// When a medicine is meant to be taken.

// Sunday first, matching Date.getDay.
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

// A medicine record with its schedule filled in, whatever version wrote it.
export function normalise(med) {
  const times = Array.isArray(med?.times) && med.times.length
    ? [...med.times].sort((a, b) => minutes(a) - minutes(b))
    : [];
  const days = Array.isArray(med?.days) && med.days.length
    ? [...new Set(med.days)].sort((a, b) => a - b)
    : EVERY_DAY;
  return { ...med, times, days };
}

// The times due on one date, earliest first.
export function timesOn(med, date = new Date()) {
  const s = normalise(med);
  return s.days.includes(date.getDay()) ? s.times : [];
}

// The next dose from a moment, looking up to a week ahead.
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

// How a schedule reads in a sentence.
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

// What is outstanding today, across every medicine.
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
