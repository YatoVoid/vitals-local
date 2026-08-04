/* When a medicine is meant to be taken.
 *
 * One shape covers every pattern people actually get given: a set of times of
 * day, and a set of weekdays those times apply to.
 *
 *   Every morning          times ['08:00'],                 every day
 *   Twice a day            times ['08:00','20:00'],         every day
 *   Once a week            times ['09:00'],                 Monday
 *   Weekdays only          times ['08:00'],                 Monday to Friday
 *   Three times a day,     times ['08:00','14:00','20:00'], Tuesday and Friday
 *   two days a week
 *
 * Anything more elaborate than that, alternate days or a tapering course, is
 * deliberately not modelled. A schedule this app cannot describe honestly is
 * worse than one it declines to hold, because a missed dose is the failure
 * that matters.
 *
 * Times are local wall clock strings, not instants. A person taking a tablet
 * at eight in the morning means eight wherever they are, and storing an offset
 * would move the dose when they travel.
 */

/** Sunday first, matching Date.getDay. */
export const DAYS = [
  { n: 0, short: 'Sun', label: 'Sunday' },
  { n: 1, short: 'Mon', label: 'Monday' },
  { n: 2, short: 'Tue', label: 'Tuesday' },
  { n: 3, short: 'Wed', label: 'Wednesday' },
  { n: 4, short: 'Thu', label: 'Thursday' },
  { n: 5, short: 'Fri', label: 'Friday' },
  { n: 6, short: 'Sat', label: 'Saturday' },
];

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const pad = n => String(n).padStart(2, '0');
export const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const minutes = hhmm => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

/** A medicine record with its schedule filled in, whatever version wrote it. */
export function normalise(med) {
  const times = Array.isArray(med?.times) && med.times.length
    ? [...med.times].sort((a, b) => minutes(a) - minutes(b))
    : [];
  const days = Array.isArray(med?.days) && med.days.length
    ? [...new Set(med.days)].sort((a, b) => a - b)
    : EVERY_DAY;
  return { ...med, times, days };
}

/** The times due on one date, earliest first. Empty on a day it is not taken. */
export function timesOn(med, date = new Date()) {
  const s = normalise(med);
  return s.days.includes(date.getDay()) ? s.times : [];
}

/**
 * The next dose from a moment, looking up to a week ahead.
 * @returns {{ time: string, date: Date, today: boolean } | null}
 */
export function nextDose(med, from = new Date()) {
  const s = normalise(med);
  if (!s.times.length) return null;
  const nowMin = from.getHours() * 60 + from.getMinutes();

  for (let ahead = 0; ahead <= 7; ahead++) {
    const d = new Date(from);
    d.setDate(d.getDate() + ahead);
    if (!s.days.includes(d.getDay())) continue;
    for (const t of s.times) {
      if (ahead === 0 && minutes(t) <= nowMin) continue;
      return { time: t, date: d, today: ahead === 0 };
    }
  }
  return null;
}

/**
 * How a schedule reads in a sentence.
 *
 * Written the way somebody would say it rather than as a rule, so "Mon, Wed,
 * Fri at 08:00" instead of a list of fields.
 */
export function describe(med) {
  const s = normalise(med);
  if (!s.times.length) return 'No time set';

  const when = s.times.join(', ');
  const everyDay = s.days.length === 7;
  const weekdays = s.days.length === 5 && s.days.every(d => d >= 1 && d <= 5);

  if (everyDay) {
    if (s.times.length === 1) return `Every day at ${when}`;
    return `Every day, ${s.times.length} times: ${when}`;
  }
  if (weekdays) return `Weekdays at ${when}`;
  if (s.days.length === 1) {
    return `${DAYS[s.days[0]].label}s at ${when}`;
  }
  const names = s.days.map(d => DAYS[d].short).join(', ');
  return `${names} at ${when}`;
}

/**
 * What is outstanding today, across every medicine.
 *
 * A dose counts as done once it has been marked, and as late once its time has
 * passed. Nothing is inferred from the clock alone: an unmarked dose stays
 * outstanding rather than being assumed taken.
 *
 * @param {Array} meds
 * @param {Array} takenLog entries of { medId, day, time }
 * @param {Date} now
 */
export function dueToday(meds, takenLog = [], now = new Date()) {
  const today = dayKey(now);
  const done = new Set(
    takenLog.filter(t => t.day === today).map(t => `${t.medId}@${t.time}`));
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const doses = [];
  for (const med of meds) {
    for (const time of timesOn(med, now)) {
      const key = `${med.id}@${time}`;
      doses.push({
        med, time,
        taken: done.has(key),
        late: !done.has(key) && minutes(time) < nowMin,
      });
    }
  }
  doses.sort((a, b) => minutes(a.time) - minutes(b.time));

  return {
    doses,
    total: doses.length,
    taken: doses.filter(d => d.taken).length,
    outstanding: doses.filter(d => !d.taken).length,
    late: doses.filter(d => d.late).length,
  };
}
