/* Pain episodes.
 *
 * An episode has a start date and a body site, and collects readings over
 * days. The analysis reports the trend, any shift in pattern, and symptoms
 * that appeared after the start.
 *
 * Closing an episode and deleting one are separate actions.
 */

const KEY = 'vitals.episodes';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  return list;
}

/** Every episode, newest first. */
export function all() {
  return read().slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

export function open() { return all().filter(e => !e.closedAt); }
export function get(id) { return read().find(e => e.id === id) ?? null; }

/**
 * Start tracking. Seeded from a finished scan, so the first reading is the
 * one already given rather than one to retype.
 */
export function start({ region, regionLabel, painTypes, intensity, outcome, note }) {
  const list = read();
  const episode = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    closedAt: null,
    region,
    regionLabel,
    painTypes: painTypes ?? [],
    // What the scan concluded when the episode began. Kept so a later
    // reading can be compared against the starting picture.
    openingCauses: (outcome?.ranked_categories ?? []).slice(0, 3).map(c => c.label),
    openingRedFlag: outcome?.red_flag?.headline ?? null,
    readings: [{
      at: new Date().toISOString(),
      intensity: intensity ?? 5,
      note: note ?? '',
      flags: [],
    }],
  };
  list.push(episode);
  write(list);
  return episode;
}

/** Add a reading to a running episode. */
export function addReading(id, { intensity, note, flags }) {
  const list = read();
  const e = list.find(x => x.id === id);
  if (!e) return null;
  e.readings.push({
    at: new Date().toISOString(),
    intensity,
    note: note ?? '',
    flags: flags ?? [],
  });
  write(list);
  return e;
}

export function removeReading(id, at) {
  const list = read();
  const e = list.find(x => x.id === id);
  if (!e) return null;
  e.readings = e.readings.filter(r => r.at !== at);
  write(list);
  return e;
}

/** Close an episode. It stays in the history; it stops asking for readings. */
export function close(id, outcome = 'resolved') {
  const list = read();
  const e = list.find(x => x.id === id);
  if (!e) return null;
  e.closedAt = new Date().toISOString();
  e.outcome = outcome;
  write(list);
  return e;
}

export function reopen(id) {
  const list = read();
  const e = list.find(x => x.id === id);
  if (!e) return null;
  e.closedAt = null;
  delete e.outcome;
  write(list);
  return e;
}

/** Delete for good. Only ever called behind an explicit confirmation. */
export function remove(id) {
  return write(read().filter(e => e.id !== id));
}

const DAY = 86400000;

/**
 * Summary of the readings.
 *
 * The trend compares the average of the last three readings with the average
 * of the first three, because a single bad afternoon is noise and a person
 * checking their own chart will read it as a relapse.
 */
export function analyse(episode) {
  const r = episode.readings ?? [];
  if (!r.length) return null;

  const first = r[0];
  const last = r[r.length - 1];
  const days = Math.max(0, Math.round((new Date(last.at) - new Date(first.at)) / DAY));

  const mean = xs => xs.reduce((n, x) => n + x, 0) / (xs.length || 1);
  const head = mean(r.slice(0, 3).map(x => x.intensity));
  const tail = mean(r.slice(-3).map(x => x.intensity));
  const change = +(tail - head).toFixed(1);

  let trend = 'steady';
  if (r.length >= 3) {
    if (change <= -1.5) trend = 'improving';
    else if (change >= 1.5) trend = 'worsening';
  } else if (r.length === 2) {
    if (last.intensity < first.intensity - 1) trend = 'improving';
    else if (last.intensity > first.intensity + 1) trend = 'worsening';
  }

  const peak = r.reduce((a, b) => (b.intensity > a.intensity ? b : a));
  const best = r.reduce((a, b) => (b.intensity < a.intensity ? b : a));

  /* Anything a person ticked on a follow up that was not there at the start.
     This is the part a memory reliably loses over two weeks. */
  const newFlags = [...new Set(r.slice(1).flatMap(x => x.flags ?? []))];

  return {
    days,
    count: r.length,
    first: first.intensity,
    latest: last.intensity,
    change,
    trend,
    peak: peak.intensity,
    best: best.intensity,
    newFlags,
    lastAt: last.at,
    // A line to read out, phrased in what happened rather than a grade.
    summary: summarise({ days, count: r.length, trend, change, first: first.intensity, latest: last.intensity }),
  };
}

function summarise({ days, count, trend, change, first, latest }) {
  if (count < 2) return 'One reading so far. Add another tomorrow and the trend becomes readable.';
  const span = days === 0 ? 'today' : days === 1 ? 'since yesterday' : `over ${days} days`;
  if (trend === 'improving') {
    return `Down from ${first} to ${latest} ${span}. That is the direction you want, and slow counts.`;
  }
  if (trend === 'worsening') {
    return `Up from ${first} to ${latest} ${span}. Worth mentioning if it keeps going that way.`;
  }
  return `Holding around ${latest} ${span}. Steady is not the same as stuck, but a fortnight of steady is worth a conversation.`;
}

/* An hour. Below this the readings are effectively simultaneous and time
   cannot separate them on screen. */
const CHART_MIN_SPAN_MS = 60 * 60 * 1000;

/** Points for the sparkline, normalised so the chart needs no maths. */
export function chartPoints(episode, width = 100, height = 34) {
  const r = episode.readings ?? [];
  if (r.length < 2) return [];
  const t0 = new Date(r[0].at).getTime();
  const t1 = new Date(r[r.length - 1].at).getTime();
  const span = t1 - t0;

  /* Readings taken close together, which is every episode on its first day,
     all divide down to the same x and stack into one column at the edge.
     Space those by position instead, so the line still reads as a sequence. */
  const byTime = span >= CHART_MIN_SPAN_MS;

  return r.map((x, i) => ({
    x: byTime
      ? ((new Date(x.at).getTime() - t0) / span) * width
      : (i / (r.length - 1)) * width,
    y: height - (x.intensity / 10) * height,
    intensity: x.intensity,
    at: x.at,
  }));
}

/** Does this episode span enough time for the chart to be a timeline? */
export function chartIsTimed(episode) {
  const r = episode?.readings ?? [];
  if (r.length < 2) return false;
  return new Date(r[r.length - 1].at).getTime() - new Date(r[0].at).getTime() >= CHART_MIN_SPAN_MS;
}

/* Things that were not asked at the start but change what should happen if
   they appear later. Kept short, and worded as observations. */
export const FOLLOW_FLAGS = [
  { id: 'fever', label: 'A fever appeared' },
  { id: 'spreading', label: 'It is spreading' },
  { id: 'night', label: 'It wakes me at night' },
  { id: 'weakness', label: 'Weakness or numbness' },
  { id: 'weight', label: 'Losing weight without trying' },
  { id: 'worse-fast', label: 'Much worse in the last day' },
];

/** A flag added mid episode is a reason to be seen, whatever the trend. */
export function flagAdvice(flags) {
  if (!flags.length) return null;
  const urgent = flags.some(f => ['weakness', 'worse-fast'].includes(f));
  return {
    urgency: urgent ? 'now' : 'soon',
    line: urgent
      ? 'Something has changed that does not wait. New weakness or numbness, or a sharp turn for the worse, gets looked at today.'
      : 'Something appeared that was not there when this started. That change is worth a call, separately from how bad the pain is.',
  };
}
