/* Home: today at a glance, and the four primary entry points. */

import { el, eyebrow, panel, tile, ring, button } from '../app/ui.js';
import { summary, settings } from '../app/store.js';

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

export function renderHome(screen, { go }) {
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

  /* Summary grid. Every tile is a link to the screen that owns the number. */
  const grid = el('div', 'grid2');
  grid.style.marginBlockStart = 'var(--s-5)';

  const lastText = s.lastSymptom
    ? (s.lastSymptom.region_label ?? s.lastSymptom.body_region_id ?? 'Logged')
    : 'Nothing logged';
  const lastSub = s.lastSymptom
    ? new Date(s.lastSymptom.at ?? s.lastSymptom.saved_at).toLocaleDateString()
    : 'Tap to start a scan';
  grid.appendChild(tile('Symptoms', lastText, lastSub, () => go('#/body')));

  const glasses = Math.round(s.waterMl / 250);
  const glassGoal = Math.round(s.waterGoalMl / 250);
  const waterTile = el('button', 'tile2 tile2--ring');
  waterTile.type = 'button';
  waterTile.append(eyebrow('Water'), ring(glasses, glassGoal, 'glasses', `${glasses} of ${glassGoal}`));
  waterTile.addEventListener('click', () => go('#/track/hydration'));
  grid.appendChild(waterTile);

  const kcalTile = el('button', 'tile2 tile2--ring');
  kcalTile.type = 'button';
  kcalTile.append(eyebrow('Energy'), ring(s.kcal, s.kcalGoal, 'kcal', `${s.kcal} of ${s.kcalGoal}`));
  kcalTile.addEventListener('click', () => go('#/track/diet'));
  grid.appendChild(kcalTile);

  grid.appendChild(tile(
    'Medicines',
    s.medsDue ? `${s.medsDue} due` : 'None due',
    s.medsDue ? 'Tap to review' : 'Nothing scheduled',
    () => go('#/track/meds'),
  ));

  screen.appendChild(grid);

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
