/* You: profile, settings, history.
 *
 * Every destructive action says what disappears before it happens, and
 * export is one tap away from delete so nobody loses anything by accident.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows, segmented, toggle, removableRow, numberOrNull } from '../app/ui.js';
import { settings, profile, symptoms, exportAll, importAll, usage, wipe, applySettings } from '../app/store.js';
import { display as unitDisplay, store as unitStore, units as unitWords } from '../app/units.js';
import { language as i18nLanguage } from '../i18n/languages.js';

const THEME_NAMES = { kawaii: 'Soft', neon: 'Blue neon', crt: 'Retro CRT' };
import { stats as i18nStats } from '../i18n/cache.js';

const COUNTRIES = [
  ['AZ', 'Azerbaijan', 'Local product register, names as printed on the box'],
  ['US', 'United States', 'Labelling set with the fields your pharmacy prints'],
  ['GR', 'Greece', 'Local product register, names as printed on the box'],
  ['EU', 'Europe, general', 'Compares by active ingredient. No single register covers the region, so label wording is always worth a second read'],
];

export function renderYou(screen, { go }) {
  const s = settings.get();
  const p = profile.get();

  screen.appendChild(eyebrow('You'));
  screen.appendChild(el('h1', null, 'Your device, your data'));

  screen.appendChild(rows(
    row('Profile', { sub: p.age ? `${p.age}, ${p.sex ?? 'unstated'}` : 'Not filled in yet', onClick: () => go('#/you/profile') }),
    row('Symptom history', { end: String(symptoms.all().length), sub: 'Every scan you saved', onClick: () => go('#/you/history') }),
    row('Settings', { sub: `${THEME_NAMES[s.theme] ?? s.theme}, ${s.language}`, onClick: () => go('#/you/settings') }),
  ));

  const box = panel(
    eyebrow('Nothing leaves this device'),
    el('p', null,
      'No account, no sync, no analytics. The only time this app touches the '
      + 'network is when you ask it to download a data pack, and those are '
      + 'static files that carry nothing about you.'),
  );
  box.style.marginBlockStart = 'var(--s-6)';
  screen.appendChild(box);
}

/* ---------- Settings ---------- */
export function renderSettings(screen, { go, live }) {
  const draw = () => {
    screen.replaceChildren();
    const s = settings.get();

    screen.appendChild(eyebrow('Settings'));
    screen.appendChild(el('h1', null, 'How it looks and behaves'));

    screen.appendChild(el('h2', null, 'Theme'));
    screen.appendChild(segmented(
      [{ id: 'kawaii', label: 'Soft' },
       { id: 'neon', label: 'Blue neon' },
       { id: 'crt', label: 'Retro CRT' }],
      s.theme,
      id => { settings.set({ theme: id }); live.textContent = 'Theme changed'; draw(); },
      'Theme',
    ));

    screen.appendChild(el('h2', null, 'Motion'));
    screen.appendChild(segmented(
      [{ id: 'system', label: 'System' }, { id: 'full', label: 'Full' }, { id: 'reduced', label: 'Reduced' }],
      s.motion,
      id => { settings.set({ motion: id }); draw(); },
      'Motion',
    ));
    screen.appendChild(el('p', 'hint',
      'Reduced turns off the scan sweep, the glow pulse, and the screen slides. '
      + 'System follows whatever your device already asks for.'));

    screen.appendChild(el('h2', null, 'Text size'));
    screen.appendChild(segmented(
      [{ id: 'normal', label: 'Normal' }, { id: 'large', label: 'Large' }, { id: 'xl', label: 'Largest' }],
      s.textSize,
      id => { settings.set({ textSize: id }); draw(); },
      'Text size',
    ));

    screen.appendChild(el('h2', null, 'Units'));
    screen.appendChild(segmented(
      [{ id: 'metric', label: 'Metric' }, { id: 'us', label: 'US' }],
      s.units,
      id => {
        settings.set({ units: id });
        live.textContent = id === 'us' ? 'US units' : 'Metric units';
        draw();
      },
      'Units',
    ));

    /* Separate from the switch above, because the two do not agree. Australia
       and most of Europe are metric and read food energy in kilojoules. */
    screen.appendChild(el('h2', null, 'Energy'));
    screen.appendChild(segmented(
      [{ id: 'kcal', label: 'Calories' }, { id: 'kj', label: 'Kilojoules' }],
      s.energyUnit,
      id => {
        settings.set({ energyUnit: id });
        live.textContent = id === 'kj' ? 'Kilojoules' : 'Calories';
        draw();
      },
      'Energy unit',
    ));
    screen.appendChild(el('p', 'hint',
      'What food and targets are shown in. Entries are kept the same either '
      + 'way, so switching relabels what you already logged rather than '
      + 'changing it.'));

    screen.appendChild(el('h2', null, 'Language'));
    const langNow = i18nLanguage(s.language ?? 'en');
    const langRow = row(langNow.name, {
      sub: langNow.english + (i18nStats(s.language ?? 'en').count
        ? ', stored on this device' : ''),
      end: 'Change',
      onClick: () => go('#/you/language'),
    });
    langRow.setAttribute('translate', 'no');
    langRow.querySelector('span').setAttribute('lang', langNow.code);
    if (langNow.dir) langRow.querySelector('span').setAttribute('dir', langNow.dir);
    screen.appendChild(rows(langRow));
    screen.appendChild(el('p', 'hint',
      'Over sixty languages, translated on your device where the browser '
      + 'supports it, and stored so they work offline.'));

    screen.appendChild(el('h2', null, 'Country'));
    screen.appendChild(rows(...COUNTRIES.map(([id, name, note]) =>
      row(name, {
        sub: note,
        selected: id === s.country,
        end: id === s.country ? 'On' : '',
        onClick: () => { settings.set({ country: id }); draw(); },
      }))));

    screen.appendChild(el('h2', null, 'Data packs'));
    const packs = panel(
      eyebrow('None installed'),
      el('p', null,
        'Medicine names and lab ranges ship as separate files you download once. '
        + 'Until then the app asks you to type those values, and everything else '
        + 'works normally.'),
      button('Check for packs', 'btn btn--quiet btn--block', () => {
        live.textContent = 'No pack source configured yet';
        alertLine(screen, 'No pack source is configured yet. This build has nothing to fetch from.');
      }),
    );
    screen.appendChild(packs);

    screen.appendChild(el('h2', null, 'Your data'));
    screen.appendChild(button('Export everything to a file', 'btn btn--quiet btn--block', () => {
      const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
      const a = el('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vitals-local-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      // Revoking in the same tick cancels the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      live.textContent = 'Export saved';
    }));

    /* Restoring is the other half of exporting, and the only way to carry
       records to a new device when nothing is kept on a server. */
    const picker = el('input');
    picker.type = 'file';
    picker.accept = 'application/json,.json';
    picker.hidden = true;
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      picker.value = '';
      if (!file) return;
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        alertLine(screen, 'That file is not valid JSON.');
        return;
      }
      if (parsed?.app !== 'Vitals Local') {
        alertLine(screen, 'That file was not exported by this app.');
        return;
      }
      if (!confirm(
        'Replace what is on this device with the contents of that file? '
        + 'Your current profile, scans and logs are overwritten. This cannot be undone.')) {
        live.textContent = 'Import cancelled';
        return;
      }
      const res = importAll(parsed);
      if (!res.ok) { alertLine(screen, res.error); return; }
      const total = Object.values(res.counts).reduce((n, v) => n + v, 0);
      live.textContent = `Imported ${total} entries`;
      applySettings();
      draw();
      window.dispatchEvent(new CustomEvent('vitals:language'));
    });
    screen.appendChild(picker);
    screen.appendChild(button('Restore from a file', 'btn btn--quiet btn--block',
      () => picker.click()));

    const used = usage();
    screen.appendChild(el('p', 'hint',
      `Stored on this device: about ${used.kb} KB`
      + (used.byKey.length ? `, largest is ${used.byKey[0].key} at ${used.byKey[0].kb} KB.` : '.')));

    const danger = panel(
      eyebrow('Delete everything'),
      el('p', null,
        'This removes your profile, every symptom scan, the food and water logs, '
        + 'your medicine reminders, and your saved lab values. It cannot be '
        + 'undone. Export first if you want to keep any of it.'),
      button('Delete all my data', 'btn btn--danger btn--block', () => {
        const ok = confirm(
          'Delete profile, symptom scans, food and water logs, medicine reminders, '
          + 'and lab values from this device? This cannot be undone.');
        if (!ok) return;
        wipe('all');
        applySettings();
        live.textContent = 'All data deleted';
        draw();
      }),
    );
    danger.dataset.severity = 'now';
    danger.style.marginBlockStart = 'var(--s-4)';
    screen.appendChild(danger);
  };
  draw();
}

function alertLine(screen, text) {
  const p = el('p', 'hint', text);
  p.setAttribute('role', 'status');
  screen.appendChild(p);
}

/* ---------- Profile ---------- */
const FIELDS = [
  { id: 'age', label: 'Age', type: 'number', hint: 'in years' },
  { id: 'sex', label: 'Sex', type: 'segment', options: ['Female', 'Male', 'Other', 'Skip'] },
  { id: 'heightCm', label: 'Height', type: 'number', measure: 'length' },
  { id: 'weightKg', label: 'Weight', type: 'number', measure: 'mass' },
  { id: 'activity', label: 'Activity', type: 'segment', options: ['Low', 'Some', 'Regular', 'Heavy'] },
  { id: 'sleepH', label: 'Sleep', type: 'number', hint: 'hours a night' },
  { id: 'alcohol', label: 'Alcohol', type: 'segment', options: ['None', 'Weekly', 'Most days', 'Daily'] },
  { id: 'nicotine', label: 'Nicotine', type: 'segment', options: ['Never', 'Past', 'Now'] },
  { id: 'conditions', label: 'Ongoing conditions', type: 'text', hint: 'Anything a doctor is treating you for' },
  { id: 'medsList', label: 'Medicines you take', type: 'text', hint: 'Names as printed on the box' },
  { id: 'supplements', label: 'Supplements', type: 'text', hint: 'Name and dose' },
  { id: 'family', label: 'Family history', type: 'text', hint: 'Parents and siblings only' },
];

export function renderProfile(screen, { live }) {
  const draw = () => {
    screen.replaceChildren();
    const p = profile.get();

    screen.appendChild(eyebrow('Profile'));
    screen.appendChild(el('h1', null, 'About you'));
    screen.appendChild(el('p', null,
      'Every field is optional and every one can be skipped. The app uses these '
      + 'to work out an energy target and to know which questions are worth '
      + 'asking. Nothing is sent anywhere.'));

    FIELDS.forEach(f => {
      const box = el('div', 'field-row');
      box.appendChild(fieldLabel(f.label, f.measure ? `in ${unitWords()[f.measure + 'Long']}` : f.hint));

      if (f.type === 'segment') {
        box.appendChild(segmented(
          f.options.map(o => ({ id: o, label: o })),
          p[f.id],
          v => { profile.set({ [f.id]: v }); draw(); },
          f.label,
        ));
      } else {
        const input = el('input', 'field');
        input.type = f.type;
        if (f.type === 'number') input.inputMode = 'numeric';
        /* A measured field is held metric and shown in whichever system is
           set, so switching systems relabels and reconverts without touching
           what is stored. */
        input.value = f.measure ? (unitDisplay(p[f.id], f.measure) ?? '') : (p[f.id] ?? '');
        input.setAttribute('aria-label', f.label);
        input.addEventListener('change', () => {
          const typed = f.type === 'number' ? numberOrNull(input.value) : input.value;
          profile.set({ [f.id]: f.measure ? unitStore(typed, f.measure) : typed });
          live.textContent = `${f.label} saved`;
        });
        box.appendChild(input);
      }
      screen.appendChild(box);
    });

    /* Derived numbers show their working rather than appearing as a verdict. */
    const { age, sex, heightCm, weightKg, activity } = p;
    if (age && heightCm && weightKg) {
      const male = sex === 'Male';
      const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161));
      const factor = { Low: 1.2, Some: 1.375, Regular: 1.55, Heavy: 1.725 }[activity] ?? 1.2;
      const target = Math.round(bmr * factor);
      /* Only when it actually moved. Every field on this screen redraws the
         whole thing on change, so an unconditional write here stored the same
         number again on each edit of sleep, alcohol or anything else. */
      if (target !== p.kcalGoal) profile.set({ kcalGoal: target });

      const box = panel(
        eyebrow('Your energy target, and how it was worked out'),
        el('p', null,
          `Resting need comes to ${bmr} kcal from the Mifflin St Jeor equation: `
          + `10 times ${weightKg} kg, plus 6.25 times ${heightCm} cm, minus 5 times `
          + `${age} years, ${male ? 'plus 5' : 'minus 161'}. Multiplied by ${factor} `
          + `for a ${(activity ?? 'low').toLowerCase()} activity level, that is `
          + `${target} kcal a day.`),
        el('p', null,
          'That equation is a population average. Individual resting need scatters '
          + 'around it by roughly 200 kcal in either direction, so treat the number '
          + 'as a starting line and adjust it against what actually happens.'),
      );
      box.style.marginBlockStart = 'var(--s-5)';
      screen.appendChild(box);
    }
  };
  draw();
}

/* ---------- History ---------- */
export function renderHistory(screen, { go, live }) {
  const draw = () => {
    screen.replaceChildren();
    const list = symptoms.all().slice().reverse();

    screen.appendChild(eyebrow('History'));
    screen.appendChild(el('h1', null, 'Scans you saved'));

    if (!list.length) {
      screen.appendChild(el('p', 'empty',
        'Nothing saved yet. Finish a body scan and tap Track this symptom to keep it.'));
      screen.appendChild(button('Start a scan', 'btn btn--block', () => go('#/body')));
      return;
    }

    screen.appendChild(rows(...list.map(r =>
      removableRow(r.region_label ?? r.body_region_id ?? 'Scan', {
        end: new Date(r.at ?? r.saved_at).toLocaleDateString(),
        sub: [(r.pain_type_ids ?? []).length + ' pain types',
              r.red_flag_trigger_ids?.length ? 'red flag' : 'no red flag'].join(', '),
        onRemove: () => { symptoms.remove(r.id); live.textContent = 'Entry removed'; draw(); },
      }))));
    screen.appendChild(el('p', 'hint', 'Tap an entry twice to remove it.'));
  };
  draw();
}
