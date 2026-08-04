/* Track: food, water, medicines, lab results.
 *
 * Every number on these screens shows its own arithmetic on tap. Nothing is
 * a black box, and nothing here produces a dose.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows, ring, segmented, removableRow, numberOrNull, collapseAway, softUpdate } from '../app/ui.js';
import { food, water, meds, labs, dosesTaken, summary, weekEnergy, profile } from '../app/store.js';
import { compareIngredients, describeIngredient } from '../data/ingredients.js';
import { open as openEpisodes } from '../app/episodes.js';
import { MARKERS, assess, RANGE_NOTE } from '../data/labs.js';
import { energy as showEnergy, energyUnit, storeEnergy } from '../app/units.js';
import { dailyEnergy, dailyProtein, currentGoal } from '../app/body-metrics.js';
import { DAYS, EVERY_DAY, describe, dueToday, nextDose, dayKey } from '../app/schedule.js';

/* "gl" is not an abbreviation anyone uses, and it read as a word cut off
   halfway. The row has room for the whole word. */
const glassCount = ml => {
  const n = Math.round(ml / 250);
  return `${n} ${n === 1 ? 'glass' : 'glasses'}`;
};

/* ---------- Index ---------- */
export function renderTrackIndex(screen, { go }) {
  const s = summary();
  const goalKcal = dailyEnergy();
  screen.appendChild(eyebrow('Track'));
  screen.appendChild(el('h1', null, 'What you took in today'));

  screen.appendChild(rows(
    row('Food and energy', { end: `${showEnergy(s.kcal)} ${energyUnit()}`, sub: `Target ${showEnergy(goalKcal)}`, onClick: () => go('#/track/diet') }),
    row('Water', { end: glassCount(s.waterMl), sub: `Target ${Math.round(s.waterGoalMl / 250)} glasses`, onClick: () => go('#/track/hydration') }),
    row('Medicines', { end: medsEnd(s.meds), sub: medsSub(s.meds), onClick: () => go('#/track/meds') }),
    row('Lab results', { end: labs.all().length ? `${labs.all().length}` : 'None', sub: 'Enter values, see the range', onClick: () => go('#/track/labs') }),
    row('Tracked pain', { end: openEpisodes().length ? `${openEpisodes().length}` : 'None', sub: 'Watch how a symptom changes', onClick: () => go('#/track/pain') }),
    row('Sun and air', { sub: 'UV, what SPF you need, air quality', onClick: () => go('#/track/outside') }),
  ));
}

/* The row reports the day rather than a count of medicines, which said the
   same thing whether every dose was taken or none were. */
const medsEnd = m => (!m.count ? 'None' : m.total ? `${m.outstanding} of ${m.total}` : 'None today');
const medsSub = m => {
  if (!m.count) return 'Set up a reminder, or compare two labels';
  if (!m.total) return m.next ? `Next at ${m.next.time}` : 'No times set';
  return m.outstanding ? 'Still to take today' : 'All taken today';
};

/* ---------- Food ----------
 *
 * The shortcuts are whatever this person eats, worked out from their own log.
 * A fixed list cannot be right in 65 languages: it was six English items, so
 * anyone whose breakfast is not oatmeal started every day by typing. Their own
 * entries are already in their own language and their own portions.
 *
 * The starter set below is only for a log with nothing in it yet, and is kept
 * short and staple on purpose rather than trying to represent anywhere.
 */
const STARTER_FOODS = [
  { name: 'Rice, bowl', kcal: 205, proteinG: 4 },
  { name: 'Egg', kcal: 78, proteinG: 6 },
  { name: 'Bread, slice', kcal: 80, proteinG: 3 },
  { name: 'Tea or coffee', kcal: 5, proteinG: 0 },
];

/**
 * The shortcuts to offer: most often logged first, then most recent.
 *
 * Energy is the median of what was logged under that name rather than the
 * mean, so one mistyped entry of 6000 does not drag the shortcut with it.
 *
 * @param {Array} log every food entry, oldest first
 */
export function quickFoods(log, limit = 6) {
  if (!log.length) return STARTER_FOODS.map(f => ({ ...f, fromLog: false }));

  const byName = new Map();
  log.forEach((r, i) => {
    const name = String(r.name ?? '').trim();
    if (!name) return;
    const seen = byName.get(name) ?? { name, kcals: [], proteins: [], count: 0, last: -1 };
    seen.count++;
    seen.last = i;
    if (Number.isFinite(r.kcal)) seen.kcals.push(r.kcal);
    if (Number.isFinite(r.proteinG)) seen.proteins.push(r.proteinG);
    byName.set(name, seen);
  });

  const middle = xs => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return Math.round(s[Math.floor(s.length / 2)]);
  };

  return [...byName.values()]
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, limit)
    .map(f => ({
      name: f.name,
      kcal: middle(f.kcals) ?? 0,
      proteinG: middle(f.proteins),
      fromLog: true,
    }));
}

/* Whole, half and double, because a portion is usually one of those and a
   number field for every tap would undo the point of a shortcut. */
const PORTIONS = [
  { id: 'half', label: 'Half', factor: 0.5 },
  { id: 'one', label: 'One', factor: 1 },
  { id: 'double', label: 'Double', factor: 2 },
];

export function renderDiet(screen, { go, live }) {
  let portion = 'one';

  const draw = () => {
    screen.replaceChildren();
    const s = summary();
    const week = weekEnergy();
    const goalKcal = dailyEnergy();
    const pro = dailyProtein();
    const balance = s.kcal - goalKcal;

    screen.appendChild(eyebrow('Food and energy'));

    const head = panel();
    head.append(
      el('div', 'readout-big', String(showEnergy(s.kcal))),
      el('div', 'readout-unit', `of ${showEnergy(goalKcal)} ${energyUnit()} target`),
    );
    if (s.proteinG > 0 || pro) {
      head.appendChild(el('div', 'readout-unit', pro
        ? `${Math.round(s.proteinG)} of ${pro.grams} g protein`
        : `${Math.round(s.proteinG)} g protein`));
    }
    // Says which goal the target belongs to, so the number is never unexplained.
    if (currentGoal().id !== 'hold') {
      head.appendChild(el('div', 'readout-unit', currentGoal().label.toLowerCase()));
    }
    screen.appendChild(head);

    /* Show the maths rather than a verdict.

       The difference is taken between the two figures on screen rather than
       converted on its own. Rounding each of the three separately gave a line
       that did not add up in kilojoules, and a sum that fails in front of the
       reader is worse than no sum. */
    const shownEaten = showEnergy(s.kcal);
    const shownTarget = showEnergy(goalKcal);
    const shownGap = shownEaten - shownTarget;
    const math = panel(
      eyebrow(balance <= 0 ? 'Under target' : 'Over target'),
      el('p', null,
        `${shownEaten} eaten minus ${shownTarget} target is `
        + `${shownGap > 0 ? '+' : ''}${shownGap} ${energyUnit()}. `
        + (balance <= 0
          ? 'Nothing to do about that on its own. A single day sits inside normal variation.'
          : 'One day above target changes very little. It is the run of days that moves weight.')),
    );
    math.style.marginBlockStart = 'var(--s-3)';
    screen.appendChild(math);

    /* The line above talks about a run of days, so the run of days has to be
       here. Until it was, the screen made a claim it could not show. */
    if (week.days > 1) {
      const wk = panel(
        eyebrow('The last seven days'),
        el('p', null,
          `${showEnergy(week.kcal)} ${energyUnit()} across ${week.days} days with an entry, `
          + `which averages ${showEnergy(week.perDay)} a day against a target of `
          + `${showEnergy(goalKcal)}. `
          + 'Days with nothing logged are left out rather than counted as zero.'),
      );
      wk.style.marginBlockStart = 'var(--s-3)';
      screen.appendChild(wk);
    }

    screen.appendChild(el('h2', null, 'Add something'));

    screen.appendChild(segmented(
      PORTIONS.map(p => ({ id: p.id, label: p.label })),
      portion,
      id => { portion = id; draw(); },
      'Portion',
    ));

    const factor = PORTIONS.find(p => p.id === portion)?.factor ?? 1;
    const shortcuts = quickFoods(food.all());
    const quick = el('div', 'chiprow');
    shortcuts.forEach(f => {
      const b = button(f.name, 'chipbtn', () => {
        food.add({
          name: f.name,
          kcal: Math.round(f.kcal * factor),
          ...(f.proteinG != null ? { proteinG: Math.round(f.proteinG * factor) } : {}),
        });
        live.textContent = `${f.name} added`;
        draw();
      });
      /* A name out of the log is what this person typed, in their language.
         Running their own diary through the translator would rewrite it. The
         starter names are app text and are left to translate normally. */
      if (f.fromLog) b.setAttribute('translate', 'no');
      quick.appendChild(b);
    });
    screen.appendChild(quick);

    /* The unit sits under each box rather than inside it. As placeholder text
       "protein g" ran out of a number field on a narrow phone, and a
       placeholder disappears the moment anyone types, which is exactly when
       they might want to check which box they are in. */
    const custom = el('form', 'inline-form inline-form--pair');
    const nameField = el('input', 'field');
    nameField.placeholder = 'What did you eat';
    nameField.setAttribute('aria-label', 'Food name');

    const numbered = (cls, label, aria) => {
      const wrap = el('div', 'stackfield');
      const input = el('input', `field field--num ${cls}`);
      input.type = 'number';
      input.inputMode = 'numeric';
      input.setAttribute('aria-label', aria);
      wrap.append(input, el('span', 'stackfield__unit', label));
      return { wrap, input };
    };

    const kcalBox = numbered('', energyUnit(), `Energy in ${energyUnit()}`);
    const kcalField = kcalBox.input;
    /* Protein is optional. Asking for it as a required second number would
       cost every entry a lookup, and a day of entries with it missing is
       still a usable day of energy. */
    const proBox = numbered('', 'protein, g', 'Protein in grams, optional');
    const proField = proBox.input;

    const add = button('Add', 'btn', null);
    add.type = 'submit';
    custom.append(nameField, kcalBox.wrap, proBox.wrap, add);
    screen.appendChild(custom);
    const customHint = el('p', 'hint');
    screen.appendChild(customHint);

    custom.addEventListener('submit', ev => {
      ev.preventDefault();
      const n = nameField.value.trim();
      const k = numberOrNull(kcalField.value);
      const g = numberOrNull(proField.value);
      /* Both halves are required, and the reason is shown. A button that
         silently declines reads as broken. */
      if (!n) {
        customHint.textContent = 'Give it a name first.';
        nameField.focus();
        return;
      }
      if (k == null || k <= 0) {
        customHint.textContent = `Add the ${energyUnit()} too, or pick one of the items above.`;
        kcalField.focus();
        return;
      }
      customHint.textContent = '';
      food.add({
        name: n,
        kcal: Math.round(storeEnergy(k)),
        ...(g != null && g >= 0 ? { proteinG: Math.round(g) } : {}),
      });
      live.textContent = `${n} added`;
      draw();
    });

    const today = food.today();

    /* Adding is one tap, so taking it back is one tap, the same as water.
       Typing a figure into the wrong row is easier here than there, and the
       only way out was finding the entry and pressing it twice. */
    if (today.length) {
      const last = today[today.length - 1];
      const undo = button(`Remove last, ${last.name}`, 'chipbtn chipbtn--undo', () => {
        food.remove(last.id);
        live.textContent = `${last.name} removed`;
        draw();
      });
      undo.setAttribute('translate', 'no');
      const undoRow = el('div', 'chiprow');
      undoRow.appendChild(undo);
      screen.appendChild(undoRow);
    }

    screen.appendChild(el('h2', null, "Today's log"));
    if (!today.length) {
      screen.appendChild(el('p', 'empty', 'Nothing logged yet. Add a meal to start the day.'));
    } else {
      const list = rows(...today.slice().reverse().map(r => {
        const entry = removableRow(r.name, {
          end: r.proteinG != null
            ? `${showEnergy(r.kcal)} ${energyUnit()}, ${r.proteinG} g`
            : `${showEnergy(r.kcal)} ${energyUnit()}`,
          sub: new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          onRemove: () => { food.remove(r.id); live.textContent = `${r.name} removed`; draw(); },
        });
        // Someone's own diary entry, in their own words.
        entry.querySelector('span')?.setAttribute('translate', 'no');
        return entry;
      }));
      screen.appendChild(list);
      screen.appendChild(el('p', 'hint', 'Tap an entry twice to remove it.'));
    }
  };
  draw();
}

/* ---------- Water ---------- */
export function renderHydration(screen, { live }) {
  const GLASS = 250;
  const draw = () => {
    screen.replaceChildren();
    const s = summary();
    const glasses = Math.round(s.waterMl / GLASS);
    const goal = Math.round(s.waterGoalMl / GLASS);

    screen.appendChild(eyebrow('Water today'));

    const head = panel();
    head.append(
      el('div', 'readout-big', String(glasses)),
      el('div', 'readout-unit', `of ${goal} glasses, ${s.waterMl} ml`),
    );
    screen.appendChild(head);

    /* A timeline of glasses reads faster than a number when the target is
       checking whether you drank anything since lunch. */
    const line = el('div', 'glasses');
    for (let i = 0; i < goal; i++) {
      const g = el('i', 'glass');
      if (i < glasses) g.dataset.full = '1';
      line.appendChild(g);
    }
    line.setAttribute('role', 'img');
    line.setAttribute('aria-label', `${glasses} of ${goal} glasses`);
    screen.appendChild(line);

    const today = water.today();

    const add = el('div', 'chiprow');
    [['Glass', GLASS], ['Large glass', 400], ['Bottle', 500]].forEach(([label, ml]) => {
      add.appendChild(button(label, 'chipbtn', () => {
        water.add({ ml });
        live.textContent = `${label} added`;
        draw();
      }));
    });

    /* Adding is one tap, so taking it back has to be one tap as well. Without
       this the only way out of a stray tap is to find the entry in the list
       below and press it twice. */
    const last = today[today.length - 1];
    const undo = button(
      last ? `Remove last, ${last.ml} ml` : 'Remove last',
      'chipbtn chipbtn--undo',
      () => {
        if (!last) return;
        water.remove(last.id);
        live.textContent = `${last.ml} ml removed`;
        draw();
      });
    undo.disabled = !last;
    add.appendChild(undo);
    screen.appendChild(add);

    if (today.length) {
      screen.appendChild(el('h2', null, 'When you drank'));
      screen.appendChild(rows(...today.slice().reverse().map(r =>
        removableRow(`${r.ml} ml`, {
          sub: new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          onRemove: () => { water.remove(r.id); live.textContent = 'Entry removed'; draw(); },
        }))));
    } else {
      screen.appendChild(el('p', 'empty', 'No water logged yet today.'));
    }

    const why = panel(
      eyebrow('Where the target comes from'),
      el('p', null,
        `${goal} glasses is ${s.waterGoalMl} ml, a general starting point rather than `
        + 'a measured need. Heat, exercise, and body mass all move it. Set your own '
        + 'target in Profile if this one does not fit.'),
    );
    why.style.marginBlockStart = 'var(--s-5)';
    screen.appendChild(why);
  };
  draw();
}

/* ---------- Medicines ----------
 * The app reports what two labels say and where they differ. It never
 * produces a dose, a schedule, or advice to swap one for another.
 */

/* Dosage forms equivalent on a label. A film coating changes how a tablet is
   swallowed, not what is in it. Modified-release forms are excluded. */
const FORM_GROUPS = [
  ['tablet', 'film coated tablet', 'coated tablet', 'sugar coated tablet'],
  ['capsule', 'hard capsule', 'soft capsule', 'gelatin capsule'],
  ['suspension', 'oral suspension', 'syrup', 'oral solution', 'liquid'],
  ['effervescent tablet', 'soluble tablet', 'dispersible tablet'],
];

/* These never fold into the plain form. They change how fast the drug
   arrives, which changes how it behaves in the body. */
const MODIFIED = ['modified release', 'extended release', 'slow release',
  'prolonged release', 'sustained release', 'controlled release',
  'gastro resistant', 'enteric coated'];

const norm = v => String(v || '').toLowerCase().trim().replace(/\s+/g, ' ');

function formVerdict(a, b) {
  const A = norm(a), B = norm(b);
  if (!A || !B) return { k: 'wait', t: '' };
  const modA = MODIFIED.some(m => A.includes(m));
  const modB = MODIFIED.some(m => B.includes(m));
  if (modA !== modB) {
    return { k: 'bad', t: 'Release differs',
      why: 'One of these is a modified release form and the other is not. They put '
         + 'the same drug into you at different speeds, so they are not swappable '
         + 'even when the strength matches.' };
  }
  if (A === B) return { k: 'ok', t: 'Match' };
  if (FORM_GROUPS.some(g => g.includes(A) && g.includes(B))) {
    return { k: 'ok', t: 'Same kind',
      why: 'Different wording for the same kind of form. A coating changes how it '
         + 'goes down, not what is in it.' };
  }
  return { k: 'warn', t: 'Different',
    why: 'The forms are not the same. That can be fine, and it can also mean a '
       + 'different amount reaches you. Worth asking about.' };
}

/* Strength is compared as a number and a unit, because 500 mg and 0.5 g are
   the same amount written two ways, and a bare number means nothing. */
function parseStrength(v) {
  const m = norm(v).match(/([\d.,]+)\s*(mcg|micrograms?|ug|mg|g|iu|units?|ml|%)?/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const unit = m[2] || '';
  const toMg = { g: 1000, mg: 1, mcg: 0.001, microgram: 0.001, micrograms: 0.001, ug: 0.001 };
  return { n, unit, mg: unit in toMg ? n * toMg[unit] : null };
}

function strengthVerdict(a, b) {
  const A = parseStrength(a), B = parseStrength(b);
  if (!A || !B) return { k: 'wait', t: '' };
  if (A.mg != null && B.mg != null) {
    if (Math.abs(A.mg - B.mg) < 1e-9) {
      const writtenDifferently = norm(a) !== norm(b);
      return { k: 'ok', t: 'Match',
        why: writtenDifferently ? `${a} and ${b} are the same amount written two ways.` : undefined };
    }
    const ratio = A.mg > B.mg ? A.mg / B.mg : B.mg / A.mg;
    const times = ratio % 1 === 0 ? `${ratio} times` : `${ratio.toFixed(2)} times`;
    return { k: 'bad', t: 'Different',
      why: `One is ${times} the other. That is a different amount of drug per unit, `
         + 'whatever else matches.' };
  }
  if (A.n === B.n && A.unit === B.unit) return { k: 'ok', t: 'Match' };
  return { k: 'warn', t: 'Check units',
    why: 'The numbers use units this app cannot line up. Read both boxes again.' };
}

function routeVerdict(a, b) {
  const A = norm(a), B = norm(b);
  if (!A || !B) return { k: 'wait', t: '' };
  const oral = ['by mouth', 'oral', 'orally', 'per os', 'po', 'swallow'];
  if (A === B || (oral.includes(A) && oral.includes(B))) return { k: 'ok', t: 'Match' };
  return { k: 'bad', t: 'Different',
    why: 'A different route means the drug enters the body a different way. Nothing '
       + 'else matching makes up for that.' };
}

export function renderMeds(screen, { live }) {
  /* Doses first. This screen is reached from a tab called Track, and the label
     comparison used to sit above the schedule, so anyone here to keep on top
     of their medicines had to scroll past a tool for a different job to find
     the one they came for. */
  const draw = () => {
    screen.replaceChildren();
    drawDoses();
    drawList();
    drawAdd();
    drawCompare();
  };

  /* ---- Today ---- */
  function drawDoses() {
    const list = meds.all();
    screen.appendChild(eyebrow('Medicines'));
    screen.appendChild(el('h1', null, 'What to take, and when'));

    if (!list.length) {
      screen.appendChild(el('p', null,
        'Add a medicine and this becomes a list of what is due today. '
        + 'Everything stays on this device, and the app never says what to '
        + 'take or how much.'));
      return;
    }

    const day = dueToday(list, dosesTaken.all());
    const head = panel();
    head.append(
      el('div', 'readout-big', String(day.outstanding)),
      el('div', 'readout-unit', day.outstanding === 0
        ? `left, all ${day.total} taken today`
        : `left to take of ${day.total} today`),
    );
    if (day.late) {
      head.dataset.severity = 'soon';
      head.appendChild(el('p', 'hint', day.late === 1
        ? 'One is past its time.'
        : `${day.late} are past their time.`));
    }
    screen.appendChild(head);

    if (!day.total) {
      screen.appendChild(el('p', 'hint',
        'Nothing scheduled for today. The next one is '
        + (nextAcross(list) ?? 'not set yet') + '.'));
      return;
    }

    screen.appendChild(el('h2', null, 'Today'));
    screen.appendChild(rows(...day.doses.map(d => {
      const r = row(d.med.name, {
        sub: d.med.dose ? `${d.time}, ${d.med.dose}` : d.time,
        end: d.taken ? 'Taken' : 'Take',
        onClick: () => {
          if (d.taken) {
            /* Marked by mistake is a normal thing to do, and leaving no way
               back would make the count lie for the rest of the day. */
            const hit = dosesTaken.all().find(t =>
              t.medId === d.med.id && t.time === d.time && t.day === dayKey(new Date()));
            if (hit) dosesTaken.remove(hit.id);
            live.textContent = `${d.med.name} at ${d.time} put back`;
          } else {
            dosesTaken.add({ medId: d.med.id, day: dayKey(new Date()), time: d.time });
            live.textContent = `${d.med.name} at ${d.time} marked as taken`;
          }
          draw();
        },
      });
      // The name came off a box, so it is left as it was typed.
      r.querySelector('span')?.setAttribute('translate', 'no');
      if (d.taken) r.dataset.verdict = 'ok';
      else if (d.late) r.dataset.verdict = 'warn';
      return r;
    })));
    screen.appendChild(el('p', 'hint',
      'Tap a dose to mark it taken, and tap it again to put it back.'));
  }

  /* ---- Everything on the list ---- */
  function drawList() {
    const list = meds.all();
    if (!list.length) return;
    screen.appendChild(el('h2', null, 'Your medicines'));

    const group = rows(...list.map(m => {
      /* A second tap asks rather than deletes. A medicine carries a schedule
         somebody set up, so losing one to a stray tap costs more than losing
         a glass of water, and the row gives no sign of what is about to go
         until it has gone. */
      const wrap = el('div', 'removing');
      const r = removableRow(m.name, {
        sub: describe(m),
        end: m.dose || '',
        confirm: 'Remove?',
        onRemove: () => ask(),
      });
      r.querySelector('span')?.setAttribute('translate', 'no');
      wrap.appendChild(r);

      function ask() {
        if (wrap.querySelector('.removing__ask')) return;
        /* The row stays where it is, so what is about to go is still in front
           of the person answering. It is only made untappable, which keeps its
           colours rather than greying the name out. */
        r.disabled = true;
        const box = el('div', 'removing__ask');
        /* One whole sentence, with no name spliced into it. Built from pieces
           it reached the translator as fragments, and a fragment has none of
           the context a sentence gives it. The name is on the row above. */
        const q = el('p', 'removing__q', 'Remove this medicine and its schedule?');
        const buttons = el('div', 'removing__acts');
        const cancel = () => { box.remove(); r.disabled = false; };
        buttons.append(
          button('No', 'btn btn--quiet', cancel),
          button('Yes, remove', 'btn btn--danger', () => {
            live.textContent = `${m.name} removed`;
            // The row closes its own gap, then the rest settles into it.
            collapseAway(wrap, () => {
              meds.remove(m.id);
              softUpdate(draw);
            });
          }),
        );
        box.append(q, buttons);
        wrap.appendChild(box);
        box.querySelector('button')?.focus();
      }

      return wrap;
    }));
    screen.appendChild(group);
    screen.appendChild(el('p', 'hint', 'Tap one twice to remove it.'));
  }


  /* ---- Adding one ---- */
  function drawAdd() {
    let times = ['08:00'];
    let days = [...EVERY_DAY];

    screen.appendChild(el('h2', null, 'Add a medicine'));
    const form = el('form', 'stack');

    const name = el('input', 'field');
    name.placeholder = 'Name from the box';
    name.setAttribute('aria-label', 'Medicine name');
    const dose = el('input', 'field');
    dose.placeholder = 'Dose, for example 500 mg';
    dose.setAttribute('aria-label', 'Dose, optional');
    form.append(fieldLabel('What it is'), name, dose);

    /* Times of day. A list rather than a count, because three times a day
       means nothing without knowing which three. */
    form.appendChild(fieldLabel('Times of day'));
    const timeRow = el('div', 'chiprow');
    form.appendChild(timeRow);

    const drawTimes = () => {
      timeRow.replaceChildren();
      times.forEach((t, i) => {
        const b = button(t, 'chipbtn chipbtn--undo', () => {
          if (times.length === 1) return;   // one time is the minimum
          times.splice(i, 1);
          drawTimes();
        });
        b.setAttribute('aria-label', `${t}, tap to remove this time`);
        timeRow.appendChild(b);
      });
      const add = el('input', 'field field--num');
      add.type = 'time';
      add.setAttribute('aria-label', 'Add another time');
      add.addEventListener('change', () => {
        if (!add.value || times.includes(add.value)) return;
        times = [...times, add.value].sort();
        drawTimes();
      });
      timeRow.appendChild(add);
    };
    drawTimes();

    /* Which days. Every day is the common case and is the starting point, and
       the shortcuts below cover most of the rest in one tap. */
    form.appendChild(fieldLabel('Which days'));
    const dayRow = el('div', 'daypick');
    form.appendChild(dayRow);
    const shortcuts = el('div', 'chiprow');
    form.appendChild(shortcuts);

    const drawDays = () => {
      dayRow.replaceChildren();
      DAYS.forEach(d => {
        const b = button(d.short, 'daypick__day', () => {
          days = days.includes(d.n) ? days.filter(x => x !== d.n) : [...days, d.n];
          if (!days.length) days = [d.n];   // never leave a schedule with no day
          drawDays();
        });
        b.setAttribute('aria-pressed', String(days.includes(d.n)));
        b.setAttribute('aria-label', d.label);
        dayRow.appendChild(b);
      });
      shortcuts.replaceChildren();
      [['Every day', EVERY_DAY], ['Weekdays', [1, 2, 3, 4, 5]], ['Weekends', [0, 6]]]
        .forEach(([label, set]) => {
          shortcuts.appendChild(button(label, 'chipbtn', () => { days = [...set]; drawDays(); }));
        });
    };
    drawDays();

    const preview = el('p', 'hint');
    form.appendChild(preview);
    const refresh = () => { preview.textContent = describe({ times, days }); };

    const go = button('Add medicine', 'btn btn--block');
    go.type = 'submit';
    form.appendChild(go);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      if (!name.value.trim()) { name.focus(); return; }
      meds.add({ name: name.value.trim(), dose: dose.value.trim(), times, days });
      live.textContent = `${name.value.trim()} added`;
      draw();
    });
    // Keeps the sentence under the controls honest as they are changed.
    form.addEventListener('click', refresh);
    form.addEventListener('change', refresh);
    refresh();

    screen.appendChild(form);
  }

  /* ---- Label check, after the tracking ---- */
  function drawCompare() {
    const state = {
      a: { ingredient: '', strength: '', form: '', route: '' },
      b: { ingredient: '', strength: '', form: '', route: '' },
    };
    const FIELDS = [
      { id: 'ingredient', label: 'Active ingredient', hint: 'The small print, not the big name' },
      { id: 'strength', label: 'Strength', hint: '500 mg' },
      { id: 'form', label: 'Form', hint: 'Tablet, capsule, suspension' },
      { id: 'route', label: 'Route', hint: 'By mouth' },
    ];

    const wrap = el('div');
    wrap.style.marginBlockStart = 'var(--s-6)';
    wrap.appendChild(el('h2', null, 'Are two boxes the same medicine?'));
    wrap.appendChild(el('p', null,
      'A separate job from the list above. Type what each box says and the app '
      + 'compares the fields. It does not tell you how much to take, and it '
      + 'does not tell you to swap one for the other.'));

    const cols = el('div', 'compare');
    ['a', 'b'].forEach(side => {
      const c = el('div', 'compare__col');
      c.appendChild(fieldLabel(side === 'a' ? 'Box one' : 'Box two'));
      FIELDS.forEach(f => {
        const l = el('label', 'compare__field');
        l.appendChild(fieldLabel(f.label));
        const input = el('input', 'field');
        input.placeholder = f.hint;
        input.setAttribute('aria-label', `${f.label}, box ${side === 'a' ? 'one' : 'two'}`);
        input.addEventListener('input', () => { state[side][f.id] = input.value; verdict(); });
        l.appendChild(input);
        c.appendChild(l);
      });
      cols.appendChild(c);
    });
    wrap.appendChild(cols);

    const out = el('div');
    wrap.appendChild(out);
    screen.appendChild(wrap);

    function verdict() {
      out.replaceChildren();
      const ing = compareIngredients(state.a.ingredient, state.b.ingredient);
      const ingKind = {
        same: 'ok', 'same-different-name': 'ok', 'same-different-salt': 'warn',
        related: 'bad', different: 'bad', unknown: 'warn',
      }[ing.verdict];

      const checks = [
        { label: 'Active ingredient', v: { k: ingKind, t: ing.line, why: ing.detail } },
        { label: 'Strength', v: strengthVerdict(state.a.strength, state.b.strength) },
        { label: 'Form', v: formVerdict(state.a.form, state.b.form) },
        { label: 'Route', v: routeVerdict(state.a.route, state.b.route) },
      ];

      const list = el('div', 'rows');
      let shown = 0;
      checks.forEach(r => {
        if (r.v.k === 'wait') return;
        shown++;
        const item = el('div', 'verdict');
        item.dataset.verdict = r.v.k;
        const head = el('div', 'verdict__head');
        head.append(el('span', null, r.label), el('span', 'verdict__mark', r.v.t));
        item.appendChild(head);
        if (r.v.why) item.appendChild(el('p', 'verdict__why', r.v.why));
        list.appendChild(item);
      });
      if (shown) out.appendChild(list);

      if (!state.a.ingredient || !state.b.ingredient) return;

      const anyBad = checks.some(r => r.v.k === 'bad');
      const summary = panel();
      summary.style.marginBlockStart = 'var(--s-4)';
      if (anyBad) {
        summary.dataset.severity = 'now';
        summary.append(
          eyebrow('Something does not line up'),
          el('p', null,
            'At least one field that has to match does not. Read those lines on both '
            + 'boxes again. If they still differ, ask the pharmacist before you use '
            + 'one in place of the other.'),
        );
      } else {
        summary.append(
          eyebrow('The fields line up'),
          el('p', null,
            'Same ingredient, same amount, same route. That is what makes two boxes '
            + 'comparable. It does not tell you how much to take or how often, which '
            + 'is on the label and from whoever prescribed it.'),
          el('p', null,
            'Two things this check cannot see. What else is in the box, since '
            + 'combination products add ingredients the front of the pack does not '
            + 'mention. And how your own body handles it, which is why a pharmacist '
            + 'is worth the two minutes.'),
        );
      }
      out.appendChild(summary);
    }

    verdict();
  }

  draw();
}

/** The nearest dose across every medicine, as a sentence, or null. */
function nextAcross(list) {
  const soonest = list
    .map(m => nextDose(m))
    .filter(Boolean)
    .sort((a, b) => a.date - b.date || a.time.localeCompare(b.time))[0];
  if (!soonest) return null;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return soonest.today
    ? `today at ${soonest.time}`
    : `${days[soonest.date.getDay()]} at ${soonest.time}`;
}

/* ---------- Labs ---------- */
export function renderLabs(screen, { live }) {
  const draw = () => {
    screen.replaceChildren();
    const p = profile.get();

    screen.appendChild(eyebrow('Lab results'));
    screen.appendChild(el('h1', null, 'Enter what your report says'));
    screen.appendChild(el('p', null,
      'Type a value and the app says which band it falls in, not just whether '
      + 'it cleared the range. Ranges differ between laboratories, so the one '
      + 'printed on your own report beats the one here.'));

    const what = panel(eyebrow('What a range does and does not say'),
      el('p', null, RANGE_NOTE));
    what.style.marginBlockEnd = 'var(--s-4)';
    screen.appendChild(what);

    const saved = Object.fromEntries(labs.all().map(r => [r.marker, r.value]));

    MARKERS.forEach(m => {
      const range = m.rangeFor(p);
      const box = el('div', 'panel panel--ticked lab');
      box.appendChild(eyebrow(`${m.label}, ${m.unit}`));

      const line = el('div', 'lab__line');
      const input = el('input', 'field field--num');
      input.type = 'number';
      input.step = String(m.step);
      input.inputMode = 'decimal';
      input.placeholder = 'Value';
      input.value = saved[m.id] ?? '';
      input.setAttribute('aria-label', `${m.label} value in ${m.unit}`);
      const rangeText = range.low == null
        ? `under ${range.high}`
        : `${range.low} to ${range.high}`;
      line.append(input, el('span', 'lab__range', rangeText));
      box.appendChild(line);

      /* Where the value sits inside the range, because the edges are not the
         only thing that carries meaning. */
      const scale = el('div', 'labscale');
      const track = el('div', 'labscale__track');
      const marker = el('i', 'labscale__marker');
      track.appendChild(marker);
      scale.appendChild(track);
      const ends = el('div', 'labscale__ends');
      ends.append(
        el('span', null, range.low == null ? '' : String(range.low)),
        el('span', null, String(range.high)),
      );
      scale.appendChild(ends);
      box.appendChild(scale);

      const verdictHead = el('p', 'lab__verdict');
      const verdictNote = el('p', 'lab__note');
      box.append(verdictHead, verdictNote);

      const assessNow = () => {
        const v = numberOrNull(input.value);
        const read = assess(m, v, p);
        if (!read) {
          verdictHead.textContent = '';
          verdictNote.textContent = '';
          box.dataset.severity = '';
          scale.dataset.state = 'empty';
          marker.style.insetInlineStart = '';
          return;
        }
        scale.dataset.state = read.outside ?? 'inside';
        marker.style.insetInlineStart =
          `${Math.round((read.position ?? (read.outside === 'below' ? 0 : 1)) * 100)}%`;
        marker.dataset.zone = read.zone.key;

        const distance = read.outside === 'below'
          ? `${+(range.low - v).toFixed(2)} ${m.unit} below the range. `
          : read.outside === 'above'
            ? `${+(v - range.high).toFixed(2)} ${m.unit} above the range. `
            : '';
        verdictHead.textContent = `${distance}${read.zone.label}.`;
        verdictNote.textContent = read.zone.note;
        box.dataset.severity = read.zone.severity === 'none' ? '' : read.zone.severity;
      };

      input.addEventListener('input', assessNow);
      input.addEventListener('change', () => {
        const v = numberOrNull(input.value);
        if (v == null) return;
        labs.add({ marker: m.id, label: m.label, value: v, unit: m.unit });
        live.textContent = `${m.label} saved`;
      });
      assessNow();

      const src = el('details', 'lab__src');
      src.appendChild(el('summary', null, 'Where these numbers come from'));
      src.appendChild(el('p', null, m.basis));
      src.appendChild(el('p', null,
        `The range shown is for ${range.pop}. If your report prints a different `
        + 'one, that describes the method your sample was run on and beats this.'));
      box.appendChild(src);

      screen.appendChild(box);
    });
  };
  draw();
}
