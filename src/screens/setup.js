/* First run: language, then country, then the profile fields the rest of the
 * app needs. Language leads because every screen after it has to be readable.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows, segmented, numberOrNull } from '../app/ui.js';
import { settings, profile, applySettings } from '../app/store.js';
import { display as unitDisplay, store as unitStore, units as unitWords } from '../app/units.js';
import * as i18n from '../i18n/index.js';
import { LANGUAGES, preferred } from '../i18n/languages.js';

/* The languages offered up front. The rest are one tap further on, through
   the full picker in Settings. The browser's own preference is promoted into
   this set so it is never buried. */
const SUGGESTED = ['en', 'es', 'zh-Hans', 'hi', 'ar', 'fr', 'ru', 'pt', 'bn',
  'ja', 'de', 'ur', 'id', 'tr', 'ko', 'it', 'th', 'pl', 'az', 'el'];

const COUNTRIES = [
  ['AZ', 'Azerbaijan', 'Medicine names as they appear on boxes sold there'],
  ['US', 'United States', 'Labelling fields the way a US pharmacy prints them'],
  ['GR', 'Greece', 'Medicine names as they appear on boxes sold there'],
  ['EU', 'Europe, general', 'Compares by active ingredient. No single register covers the whole region, so label wording always gets a second look'],
];

const STEPS = ['language', 'country', 'profile', 'done'];

export function renderSetup(screen, { go, live }) {
  let step = 0;
  let busyLang = null;   // guards against a second tap during a model download

  const draw = () => {
    screen.replaceChildren();
    const s = settings.get();

    /* A dot per step. Position carries progress, the label names it. */
    const dots = el('div', 'dots');
    STEPS.forEach((_, i) => {
      const d = el('i', 'dot');
      if (i <= step) d.dataset.on = '1';
      dots.appendChild(d);
    });
    screen.appendChild(dots);
    screen.appendChild(eyebrow(`Step ${Math.min(step + 1, 3)} of 3`));

    if (STEPS[step] === 'language') {
      screen.appendChild(el('h1', null, 'Choose your language'));
      screen.appendChild(el('p', null, 'You can change this later in Settings.'));

      const codes = [...new Set([preferred(), ...SUGGESTED])];
      const grid = el('div', 'langgrid');
      codes.forEach(code => {
        const meta = LANGUAGES.find(l => l.code === code);
        if (!meta) return;
        const b = button(meta.name, 'chipbtn', async () => {
          if (busyLang) return;
          busyLang = code;
          b.dataset.busy = '1';
          live.textContent = `Setting up ${meta.english}`;
          settings.set({ language: code });
          applySettings();
          /* Called from inside the tap: this is the only moment the browser
             will fetch a translation model. */
          await i18n.setLanguage(code);
          busyLang = null;
          live.textContent = `Language set to ${meta.english}`;
          draw();
          window.dispatchEvent(new CustomEvent('vitals:language'));
        });
        /* The label is in its own script and must not be translated into the
           language being left behind. */
        b.setAttribute('translate', 'no');
        b.setAttribute('lang', code);
        if (meta.dir) b.setAttribute('dir', meta.dir);
        if (code === s.language) b.dataset.on = '1';
        grid.appendChild(b);
      });
      screen.appendChild(grid);

      screen.appendChild(button('See all languages', 'btn btn--quiet btn--block',
        () => go('#/you/language')));
      screen.appendChild(button('Continue', 'btn btn--block', () => { step = 1; draw(); }));
    }

    if (STEPS[step] === 'country') {
      screen.appendChild(el('h1', null, 'Where do you buy medicine?'));
      screen.appendChild(el('p', null,
        'This decides which medicine list the app compares labels against. '
        + 'Nothing else changes, and you can switch it any time.'));
      screen.appendChild(rows(...COUNTRIES.map(([id, name, note]) =>
        row(name, {
          sub: note,
          selected: id === s.country,
          end: id === s.country ? 'On' : '',
          onClick: () => { settings.set({ country: id }); draw(); },
        }))));
      const bar = el('div', 'setup__bar');
      bar.append(
        button('Back', 'btn btn--quiet', () => { step = 0; draw(); }),
        button('Continue', 'btn', () => { step = 2; draw(); }),
      );
      screen.appendChild(bar);
    }

    if (STEPS[step] === 'profile') {
      const p = profile.get();
      screen.appendChild(el('h1', null, 'A few numbers, if you want'));
      screen.appendChild(el('p', null,
        'These let the app work out an energy target and know which questions '
        + 'are worth asking. Skip any of it and everything still works.'));

      const u = unitWords();
      [
        { id: 'age', label: 'Age', unit: 'in years', type: 'number' },
        { id: 'heightCm', label: 'Height', unit: `in ${u.lengthLong}`, type: 'number', measure: 'length' },
        { id: 'weightKg', label: 'Weight', unit: `in ${u.massLong}`, type: 'number', measure: 'mass' },
        { id: 'waistCm', label: 'Waist', unit: `in ${u.lengthLong}, optional`, type: 'number', measure: 'length' },
      ].forEach(f => {
        const box = el('div', 'field-row');
        box.appendChild(fieldLabel(f.label, f.unit));
        const input = el('input', 'field');
        input.type = 'number';
        input.inputMode = 'numeric';
        input.value = f.measure ? (unitDisplay(p[f.id], f.measure) ?? '') : (p[f.id] ?? '');
        input.setAttribute('aria-label', f.label);
        input.addEventListener('change', () => {
          const typed = numberOrNull(input.value);
          profile.set({ [f.id]: f.measure ? unitStore(typed, f.measure) : typed });
        });
        box.appendChild(input);
        screen.appendChild(box);
      });

      const sexRow = el('div', 'field-row');
      sexRow.appendChild(fieldLabel('Sex'));
      sexRow.appendChild(segmented(
        ['Female', 'Male', 'Other', 'Skip'].map(o => ({ id: o, label: o })),
        p.sex,
        v => { profile.set({ sex: v }); draw(); },
        'Sex',
      ));
      screen.appendChild(sexRow);

      const actRow = el('div', 'field-row');
      actRow.appendChild(fieldLabel('How much do you move'));
      actRow.appendChild(segmented(
        ['Low', 'Some', 'Regular', 'Heavy'].map(o => ({ id: o, label: o })),
        p.activity,
        v => { profile.set({ activity: v }); draw(); },
        'Activity',
      ));
      screen.appendChild(actRow);

      const bar = el('div', 'setup__bar');
      bar.append(
        button('Back', 'btn btn--quiet', () => { step = 1; draw(); }),
        button('Finish', 'btn', () => { step = 3; draw(); }),
      );
      screen.appendChild(bar);
    }

    if (STEPS[step] === 'done') {
      settings.set({ setupDone: true });
      screen.appendChild(el('h1', null, 'Ready'));
      screen.appendChild(panel(
        eyebrow('What happens now'),
        el('p', null,
          'Everything you enter from here stays in this browser on this device. '
          + 'No account was made and nothing was sent anywhere.'),
        el('p', null,
          'Medicine and lab packs are not downloaded yet. The app works without '
          + 'them, and anything that needs one says so and offers to take the '
          + 'values typed in instead.'),
      ));
      screen.appendChild(button('Open the app', 'btn btn--block', () => go('#/home')));
    }
  };

  draw();
}
