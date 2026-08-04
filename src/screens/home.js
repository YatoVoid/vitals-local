/* Home: today at a glance, and the primary entry points.
 *
 * The tiles are a set the person arranges, so each one is built by id and the
 * order comes from settings. Nothing here fetches: the sun and air tiles read
 * the last stored reading, because a summary should never be what puts a
 * request on the network.
 */

import { el, eyebrow, panel, tile, ring, button, reorderable } from '../app/ui.js';
import { summary, settings, profile } from '../app/store.js';
import { dailyEnergy } from '../app/body-metrics.js';
import { lastConditions, uvBand, airBand, sunAdvice } from '../app/weather.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const dayLabel = () => new Date().toLocaleDateString([], {
  weekday: 'long', month: 'short', day: 'numeric',
});

/* The arrangement someone gets before they move anything. Today first, then
   what it is like outside, then what has already been recorded. */
export const DEFAULT_ORDER = ['water', 'energy', 'uv', 'air', 'symptoms', 'meds'];

/**
 * The order to draw in, given what was saved and what exists now.
 *
 * A saved arrangement is from whatever version wrote it, so ids that no longer
 * exist are dropped and ids added since are appended. Without that, a new tile
 * would be invisible to anyone who had ever rearranged, and a removed one
 * would throw.
 *
 * @param {unknown} saved
 * @param {string[]} available
 */
/**
 * Every tile that exists, in the order it should appear before anyone moves
 * anything.
 *
 * The arrangement was being read off the order the builders happen to be
 * written in, which is not an arrangement anyone chose and quietly ignored
 * DEFAULT_ORDER. A tile added to the builders but not listed there still
 * appears, at the end, rather than vanishing.
 *
 * @param {object} builders tile id to builder function
 */
export function availableTiles(builders) {
  const ids = Object.keys(builders);
  return [
    ...DEFAULT_ORDER.filter(id => ids.includes(id)),
    ...ids.filter(id => !DEFAULT_ORDER.includes(id)),
  ];
}

export function resolveOrder(saved, available = DEFAULT_ORDER) {
  const known = new Set(available);
  const wanted = Array.isArray(saved) && saved.length ? saved : available;
  const seen = new Set();
  // A repeated id would otherwise build the same tile twice.
  const kept = wanted.filter(id => known.has(id) && !seen.has(id) && seen.add(id));
  return [...kept, ...available.filter(id => !seen.has(id))];
}

export function renderHome(screen, { go, live }) {
  const s = summary();

  screen.appendChild(eyebrow(dayLabel()));
  screen.appendChild(el('h1', null, greeting()));

  /* Quick actions. One tap to the thing, no menu in between. */
  const quick = el('div', 'chiprow');
  [
    ['I have pain', () => go('#/body')],
    ['Add food', () => go('#/track/diet')],
    ['Drink water', () => go('#/track/hydration')],
    ['Check a medicine', () => go('#/track/meds')],
    ['Sun and air', () => go('#/track/outside')],
  ].forEach(([label, fn]) => quick.appendChild(button(label, 'chipbtn', fn)));
  screen.appendChild(quick);

  const builders = tileBuilders(s, go);
  const order = resolveOrder(settings.get().homeOrder, availableTiles(builders));

  const grid = el('div', 'grid2 grid2--arrangeable');
  grid.style.marginBlockStart = 'var(--s-5)';
  order.forEach(id => {
    const node = builders[id]();
    node.dataset.tile = id;
    grid.appendChild(node);
  });
  screen.appendChild(grid);

  reorderable(grid, {
    live,
    onReorder: ids => settings.set({ homeOrder: ids }),
    describe: node => node.querySelector('.eyebrow')?.textContent ?? 'Tile',
  });

  screen.appendChild(el('p', 'hint',
    'Hold a tile to pick it up, then drag it where you want it.'));

  /* The privacy claim belongs on the first screen, stated plainly once. */
  const note = panel(
    eyebrow('Where your data lives'),
    el('p', null,
      'Everything you enter stays in this browser on this device. '
      + 'There is no account and no server behind this app. '
      + 'Export it any time from Settings, and delete it in one tap.'),
  );
  note.style.marginBlockStart = 'var(--s-6)';
  screen.appendChild(note);

  const country = settings.get().country;
  const packs = panel(
    eyebrow('Data packs'),
    el('p', null,
      `Medicine names and lab ranges for ${country} are not downloaded yet. `
      + 'The app works without them. Anything that needs a pack says so and '
      + 'offers to type the values instead.'),
    button('Check for packs', 'btn btn--quiet btn--block', () => go('#/you/settings')),
  );
  packs.style.marginBlockStart = 'var(--s-4)';
  screen.appendChild(packs);
}

/* One builder per tile, keyed by the id the saved order refers to. */
function tileBuilders(s, go) {
  return {
    symptoms: () => {
      const value = s.lastSymptom
        ? (s.lastSymptom.region_label ?? s.lastSymptom.body_region_id ?? 'Logged')
        : 'Nothing logged';
      const sub = s.lastSymptom
        ? new Date(s.lastSymptom.at ?? s.lastSymptom.saved_at).toLocaleDateString()
        : 'Tap to start a scan';
      return tile('Symptoms', value, sub, () => go('#/body'));
    },

    water: () => {
      const glasses = Math.round(s.waterMl / 250);
      const goal = Math.round(s.waterGoalMl / 250);
      const t = el('button', 'tile2 tile2--ring');
      t.type = 'button';
      t.append(eyebrow('Water'), ring(glasses, goal, 'glasses', `${glasses} of ${goal}`));
      t.addEventListener('click', () => go('#/track/hydration'));
      return t;
    },

    energy: () => {
      const goalKcal = dailyEnergy();
      const t = el('button', 'tile2 tile2--ring');
      t.type = 'button';
      t.append(eyebrow('Energy'), ring(s.kcal, goalKcal, 'kcal', `${s.kcal} of ${goalKcal}`));
      t.addEventListener('click', () => go('#/track/diet'));
      return t;
    },

    meds: () => tile(
      'Medicines',
      s.medsDue ? `${s.medsDue} due` : 'None due',
      s.medsDue ? 'Tap to review' : 'Nothing scheduled',
      () => go('#/track/meds'),
    ),

    uv: () => {
      const hit = lastConditions();
      const uv = hit?.data?.uv;
      const band = uvBand(uv);
      if (!band) {
        return tile('Sun', 'Not checked', 'Tap to read the UV here', () => go('#/track/outside'));
      }
      const advice = sunAdvice(uv, profile.get().skinType);
      const t = tile(
        'Sun',
        `UV ${Math.round(uv * 10) / 10}`,
        advice?.spf ? `${band.label}, SPF ${advice.spf}` : band.label,
        () => go('#/track/outside'),
      );
      if (band.severity !== 'none') t.dataset.severity = band.severity;
      if (hit.stale) t.appendChild(el('span', 'tile2__stale', staleLabel(hit.at)));
      return t;
    },

    air: () => {
      const hit = lastConditions();
      const aqi = hit?.data?.aqi;
      const band = airBand(aqi, hit?.data?.aqiScale);
      if (!band) {
        return tile('Air', 'Not checked', 'Tap to read the air here', () => go('#/track/outside'));
      }
      const sub = hit.data.pm25 != null
        ? `${band.label}, PM2.5 ${Math.round(hit.data.pm25)}`
        : band.label;
      const t = tile('Air', `AQI ${Math.round(aqi)}`, sub, () => go('#/track/outside'));
      if (band.severity !== 'none') t.dataset.severity = band.severity;
      if (hit.stale) t.appendChild(el('span', 'tile2__stale', staleLabel(hit.at)));
      return t;
    },
  };
}

/* A reading past its shelf life still says something useful, as long as the
   tile gives its age rather than presenting it as now. */
function staleLabel(at) {
  const hours = Math.round((Date.now() - at) / 3600000);
  if (hours < 1) return 'from earlier';
  if (hours < 24) return `${hours} h old`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'a day old' : `${days} days old`;
}
