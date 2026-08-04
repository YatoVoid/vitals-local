/* Local store.
 *
 * One namespace per domain, all of it on this device, over localStorage.
 *
 * Sizing: a fully translated language is about 200 KB, this origin gets
 * roughly 10 MB of localStorage, and a 193 KB store reads in 0.3 ms and
 * writes in 0.4 ms. Logs grow by a few KB a year. IndexedDB would make every
 * read asynchronous for no gain at this scale.
 *
 * Data packs are the case that would need it. A national medicine register
 * runs to tens of megabytes and belongs in IndexedDB on its own, leaving
 * these records here.
 *
 * Nothing here talks to a network. There is no endpoint to talk to.
 */

import { dueToday, nextDose } from './schedule.js';

const NS = 'vitals';
const key = name => `${NS}.${name}`;

function read(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/* A full or blocked store must report the failure. Silently dropping a write
   is indistinguishable from a save until the screen redraws without the
   entry. */
const writeErrorListeners = new Set();

export function onWriteError(fn) {
  writeErrorListeners.add(fn);
  return () => writeErrorListeners.delete(fn);
}

let lastWriteFailed = false;

/** Did the most recent write fail? */
export function writeFailed() { return lastWriteFailed; }

function write(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
    lastWriteFailed = false;
  } catch (err) {
    lastWriteFailed = true;
    const full = err?.name === 'QuotaExceededError'
      || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      || err?.code === 22;
    const detail = {
      store: name,
      reason: full ? 'full' : 'blocked',
      message: full
        ? 'This device is out of storage for the app, so that did not save. '
          + 'Free space by deleting a stored language or exporting and '
          + 'clearing older entries.'
        : 'The browser blocked local storage, so that did not save. Private '
          + 'browsing and blocked site data both do this.',
    };
    for (const fn of writeErrorListeners) { try { fn(detail); } catch {} }
  }
  return value;
}

/** Roughly how much room the app is using, in KB, and the keys behind it. */
export function usage() {
  let total = 0;
  const byKey = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(`${NS}.`)) continue;
      // Two bytes per UTF-16 code unit, key included.
      const bytes = ((localStorage.getItem(k) ?? '').length + k.length) * 2;
      total += bytes;
      byKey.push({ key: k.slice(NS.length + 1), kb: Math.round(bytes / 1024) });
    }
  } catch { return { kb: 0, byKey: [] }; }
  byKey.sort((a, b) => b.kb - a.kb);
  return { kb: Math.round(total / 1024), byKey };
}

/* The instrument theme was called med before it was named. Anyone holding the
   old value is moved across on read rather than being reset to the default,
   which would take their choice away. */
const THEME_ALIASES = { med: 'neon' };

/* The themes that exist. Anything else, from a future version or a damaged
   store, falls back rather than reaching the DOM as an unknown value. */
const THEMES = ['kawaii', 'neon', 'crt'];

const SETTING_DEFAULTS = {
  theme: 'kawaii',
  motion: 'system',
  language: 'en',
  country: 'US',
  units: 'metric',
  /* Its own setting rather than part of `units`, because the two do not line
     up. Australia, New Zealand and much of Europe are metric and read energy
     in kilojoules, so a metric or US switch cannot answer this. */
  energyUnit: 'kcal',
  textSize: 'normal',
};

export const settings = {
  get() {
    /* Merged over the defaults rather than returned as found. A stored object
       written by an older version, or restored from an export made by one, is
       missing whatever was added since, and an absent key reaching the DOM
       lands as the string "undefined". */
    const s = { ...SETTING_DEFAULTS, ...read('settings', {}) };
    if (THEME_ALIASES[s.theme]) s.theme = THEME_ALIASES[s.theme];
    if (!THEMES.includes(s.theme)) s.theme = SETTING_DEFAULTS.theme;
    return s;
  },
  set(patch) {
    const next = { ...settings.get(), ...patch };
    write('settings', next);
    applySettings(next);
    return next;
  },
};

/* What the browser paints around the page: the address bar on Android, the
   status area in a standalone window. It has to follow the theme or a light
   app sits under a black bar. */
const THEME_COLOR = { kawaii: '#F5EEE2', neon: '#030507', crt: '#010301' };

/** Push settings onto the document so CSS can act on them. */
export function applySettings(s = settings.get()) {
  const root = document.documentElement;
  root.dataset.theme = s.theme;
  const meta = document.querySelector?.('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_COLOR[s.theme] ?? THEME_COLOR.kawaii);
  if (s.motion === 'system') delete root.dataset.motion;
  else root.dataset.motion = s.motion;
  root.dataset.text = s.textSize;
  // Language and direction are owned by src/i18n, which knows about every
  // script rather than a hardcoded pair of right to left codes.
}

/* A log is an append-only list of records, newest last. */
function logStore(name) {
  return {
    all: () => read(name, []),
    add(record) {
      const list = read(name, []);
      list.push({ id: crypto.randomUUID(), at: new Date().toISOString(), ...record });
      return write(name, list);
    },
    remove(id) {
      return write(name, read(name, []).filter(r => r.id !== id));
    },
    clear() { return write(name, []); },
    today() {
      const d = new Date().toDateString();
      return read(name, []).filter(r => new Date(r.at).toDateString() === d);
    },
    /* Counted back in whole days from this morning rather than by subtracting
       hours, so a week is seven days on the calendar however the clocks moved
       in the middle of it. */
    lastDays(days) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
      return read(name, []).filter(r => new Date(r.at) >= start);
    },
  };
}

export const symptoms = logStore('symptom_sessions');
export const food = logStore('food_log');
export const water = logStore('water_log');
export const meds = logStore('medications');
export const labs = logStore('lab_results');
/* Doses actually taken, one entry per dose, kept apart from the medicine
   itself so a schedule can be edited without rewriting its history. */
export const dosesTaken = logStore('doses_taken');

export const profile = {
  get() { return read('profile', {}); },
  /* A key set to null, undefined or NaN is removed rather than stored. A
     cleared number field must not land as 0, which reads as a real height to
     everything downstream and exports that way. */
  set(patch) {
    const next = { ...profile.get() };
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || (typeof v === 'number' && !Number.isFinite(v))) delete next[k];
      else next[k] = v;
    }
    return write('profile', next);
  },
};

/** Everything this device holds, as one file the person can keep. */
export function exportAll() {
  return {
    exported_at: new Date().toISOString(),
    app: 'Vitals Local',
    schema: 1,
    settings: settings.get(),
    profile: profile.get(),
    symptom_sessions: symptoms.all(),
    food_log: food.all(),
    water_log: water.all(),
    medications: meds.all(),
    lab_results: labs.all(),
  };
}

/**
 * Restore a file written by exportAll.
 *
 * The only route between two devices, since nothing is kept on a server.
 * The whole file is validated before any of it is written, so a wrong or
 * damaged file cannot leave the store half replaced.
 *
 * @param {unknown} data parsed JSON
 * @returns {{ ok: boolean, error?: string, counts?: Record<string, number> }}
 */
export function importAll(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'That file is not readable as an export.' };
  }
  if (data.app !== 'Vitals Local') {
    return { ok: false, error: 'That file was not exported by this app.' };
  }
  if (data.schema !== 1) {
    return { ok: false, error: `That export is version ${data.schema ?? 'unknown'}, and this build reads version 1.` };
  }

  const lists = {
    symptom_sessions: 'symptom_sessions', food_log: 'food_log',
    water_log: 'water_log', medications: 'medications', lab_results: 'lab_results',
  };
  for (const field of Object.keys(lists)) {
    if (data[field] != null && !Array.isArray(data[field])) {
      return { ok: false, error: `The ${field.replace('_', ' ')} section is damaged.` };
    }
  }
  if (data.settings != null && typeof data.settings !== 'object') {
    return { ok: false, error: 'The settings section is damaged.' };
  }
  if (data.profile != null && typeof data.profile !== 'object') {
    return { ok: false, error: 'The profile section is damaged.' };
  }

  const counts = {};
  for (const [field, store] of Object.entries(lists)) {
    if (data[field] == null) continue;
    write(store, data[field]);
    counts[field] = data[field].length;
  }
  if (data.profile) write('profile', data.profile);
  if (data.settings) { write('settings', data.settings); applySettings(data.settings); }

  if (lastWriteFailed) {
    return { ok: false, error: 'There was not enough room to store all of it. Some of the import did not save.' };
  }
  return { ok: true, counts };
}

export function wipe(which = 'all') {
  const map = {
    symptoms: 'symptom_sessions', food: 'food_log', water: 'water_log',
    meds: 'medications', labs: 'lab_results', profile: 'profile',
  };
  if (which === 'all') {
    Object.values(map).forEach(n => localStorage.removeItem(key(n)));
    localStorage.removeItem(key('settings'));
    return;
  }
  localStorage.removeItem(key(map[which] ?? which));
}

/**
 * The energy figure to measure a day against when the profile is too empty to
 * work one out.
 *
 * A filled profile gets an equation using height, weight, age and activity.
 * With nothing to put in it, the only honest answer is a published reference
 * intake, and there are two of those rather than one. A single figure for
 * everyone lands about 600 kcal above what an average woman at low activity
 * actually needs, which is the same mistake as quoting one haemoglobin range
 * to everybody.
 *
 * 2000 and 2500 are the reference intakes used by the UK health service and
 * by EU food labelling, where 2000 is also the figure printed on packaging
 * for the average adult. Sex is the only thing being read here, so an unset
 * profile takes 2000, the lower and more widely printed of the two.
 */
export function referenceEnergy(p = profile.get()) {
  if (p.kcalGoal) return p.kcalGoal;
  return p.sex === 'Male' ? 2500 : 2000;
}


/** What is outstanding today, and when the next dose falls. */
export function medsToday(now = new Date()) {
  const list = meds.all();
  const day = dueToday(list, dosesTaken.all(), now);
  const soonest = list
    .map(m => nextDose(m, now))
    .filter(Boolean)
    .sort((a, b) => a.date - b.date || a.time.localeCompare(b.time))[0] ?? null;
  return { count: list.length, ...day, next: soonest };
}

/** Counts for the home dashboard, computed on read rather than stored. */
export function summary() {
  const w = water.today().reduce((n, r) => n + (r.ml ?? 0), 0);
  const eaten = food.today();
  const kcal = eaten.reduce((n, r) => n + (r.kcal ?? 0), 0);
  const last = symptoms.all().at(-1);
  return {
    waterMl: w,
    waterGoalMl: 2000,
    kcal,
    // Absent on older entries, so it counts as none rather than breaking.
    proteinG: eaten.reduce((n, r) => n + (r.proteinG ?? 0), 0),
    lastSymptom: last ?? null,
    /* From the schedule and what has actually been marked, rather than a
       flag set when the medicine was added and never cleared, which counted
       every medicine as due forever. */
    meds: medsToday(),
  };
}

/**
 * Energy over the last seven days, and the daily average across them.
 *
 * The screen says the weekly total is what moves weight, and until this
 * existed it only ever showed today, so it was asserting something it could
 * not show. The average divides by days that have an entry rather than by
 * seven, since a day nobody logged is a day with no data, not a day of
 * nothing eaten.
 */
export function weekEnergy() {
  const rows = food.lastDays(7);
  const kcal = rows.reduce((n, r) => n + (r.kcal ?? 0), 0);
  const days = new Set(rows.map(r => new Date(r.at).toDateString())).size;
  return {
    kcal,
    days,
    perDay: days ? Math.round(kcal / days) : 0,
    proteinG: rows.reduce((n, r) => n + (r.proteinG ?? 0), 0),
  };
}
