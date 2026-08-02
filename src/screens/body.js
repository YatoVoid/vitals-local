/* Body.
 *
 * Opens on the stored profile, then the scan. Figures come from setup and any
 * gaps can be filled in place rather than on another screen.
 */

import { el, eyebrow, fieldLabel, panel, button, segmented, numberOrNull } from '../app/ui.js';
import { mount } from '../../ui/components/symptom-game/symptom-game.js';
import { profile } from '../app/store.js';
import { display as unitDisplay, store as unitStore, units as unitWords } from '../app/units.js';
import { metrics, format, readOut, BMI_CAVEATS, WHTR_NOTE } from '../app/body-metrics.js';
import { open as openEpisodes } from '../app/episodes.js';

export function renderBody(screen, { go, live }) {
  const wrap = el('div', 'bodytab');
  screen.appendChild(wrap);

  const draw = () => {
    wrap.replaceChildren();
    const col = el('div', 'col');
    wrap.appendChild(col);

    const m = metrics();
    const p = profile.get();

    col.appendChild(eyebrow('Your body'));

    if (!m) {
      col.appendChild(el('h1', null, 'A few numbers first'));
      col.appendChild(el('p', null,
        'Height and weight let the app work out an energy target and show '
        + 'where you sit against population ranges. Both stay on this device.'));
      col.appendChild(measureForm(draw, live));
    } else {
      const f = format(m);
      col.appendChild(el('h1', null, f.weight + ', ' + f.height));

      const card = panel(
        eyebrow(m.band.label),
        el('div', 'readout-big', String(m.bmi)),
        el('div', 'readout-unit', 'body mass index'),
        el('p', null, readOut(m)),
      );
      card.dataset.severity = m.severity;
      col.appendChild(card);

      /* A bar showing where the number sits, because a figure alone does not
         tell you how far from the range it is. */
      col.appendChild(bmiBar(m.bmi));

      if (m.whtr != null) {
        const w = panel(
          eyebrow(`Waist to height, ${m.whtrBand.label.toLowerCase()}`),
          el('p', null,
            `Your waist is ${f.waist} and your height is ${f.height}, a ratio `
            + `of ${m.whtr}. ${m.whtr < 0.5
              ? 'Under half your height is where you want it.'
              : 'Over half your height is the point where abdominal fat starts to matter for risk.'}`),
        );
        w.dataset.severity = m.whtr >= 0.5 ? 'soon' : 'none';
        col.appendChild(w);
      } else {
        const w = panel(
          eyebrow('Waist is the better measure'),
          el('p', null, WHTR_NOTE),
          waistForm(draw, live),
        );
        col.appendChild(w);
      }

      if (m.maintenance) {
        col.appendChild(panel(
          eyebrow('Energy, and how it was worked out'),
          el('p', null,
            `Resting need comes to ${m.bmr} kcal from the Mifflin St Jeor `
            + `equation. Multiplied by ${m.factor} for a `
            + `${(p.activity ?? 'low').toLowerCase()} activity level, that is `
            + `${m.maintenance} kcal a day to stay where you are.`),
          el('p', null,
            'That equation is a population average. Individual resting need '
            + 'scatters around it by roughly 200 kcal either way, so treat it '
            + 'as a starting line and adjust against what actually happens.'),
        ));
      }

      const caveats = el('details', 'caveats');
      caveats.appendChild(el('summary', null, 'What BMI cannot see'));
      BMI_CAVEATS.forEach(c => caveats.appendChild(el('p', null, c)));
      col.appendChild(caveats);

      const edit = el('details', 'caveats');
      edit.appendChild(el('summary', null, 'Change these numbers'));
      edit.appendChild(measureForm(draw, live));
      col.appendChild(edit);
    }

    /* Episodes already open, so the scan is not the only entry point. */
    const running = openEpisodes();
    if (running.length) {
      col.appendChild(el('h2', null, 'You are tracking'));
      running.forEach(e => {
        const b = button(
          `${e.regionLabel ?? e.region}, ${e.readings.length} reading${e.readings.length === 1 ? '' : 's'}`,
          'btn btn--quiet btn--block',
          () => go(`#/track/pain/${e.id}`));
        b.style.marginBlockEnd = 'var(--s-2)';
        col.appendChild(b);
      });
    }

    col.appendChild(el('h2', null, 'Where does it hurt?'));
    col.appendChild(el('p', null,
      'Mark the spot, describe it, then answer as many questions as it takes. '
      + 'The questions change based on what you say.'));
    const start = button('Start a scan', 'btn btn--block', () => {
      wrap.replaceChildren();
      const host = el('div', 'symptom-game');
      wrap.appendChild(host);
      wrap.classList.add('bodytab--scanning');
      mount(host);
    });
    col.appendChild(start);
  };

  draw();
}

/* A bar from 15 to 40 with the healthy band marked. Position carries the
   message; the number is printed under it for anyone who cannot read a bar. */
function bmiBar(bmi) {
  const LO = 15, HI = 40;
  const pct = v => ((Math.min(Math.max(v, LO), HI) - LO) / (HI - LO)) * 100;
  const bar = el('div', 'bmibar');
  const track = el('div', 'bmibar__track');
  const healthy = el('div', 'bmibar__healthy');
  healthy.style.insetInlineStart = `${pct(18.5)}%`;
  healthy.style.inlineSize = `${pct(25) - pct(18.5)}%`;
  const marker = el('i', 'bmibar__marker');
  marker.style.insetInlineStart = `${pct(bmi)}%`;
  track.append(healthy, marker);
  const axis = el('div', 'bmibar__axis');
  axis.append(el('span', null, '15'), el('span', null, '18.5 to 25'), el('span', null, '40'));
  bar.append(track, axis);
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `BMI ${bmi}, healthy range 18.5 to 25`);
  return bar;
}

function measureForm(done, live) {
  const p = profile.get();
  const form = el('form', 'measures');

  const fields = [
    { id: 'age', label: 'Age', unit: 'in years' },
    { id: 'heightCm', label: 'Height', unit: `in ${unitWords().lengthLong}`, measure: 'length' },
    { id: 'weightKg', label: 'Weight', unit: `in ${unitWords().massLong}`, measure: 'mass' },
  ];
  const inputs = {};
  fields.forEach(f => {
    const wrap = el('label', 'measures__field');
    wrap.appendChild(fieldLabel(f.label, f.unit));
    const input = el('input', 'field field--num');
    input.type = 'number';
    input.inputMode = 'decimal';
    input.value = f.measure ? (unitDisplay(p[f.id], f.measure) ?? '') : (p[f.id] ?? '');
    input.setAttribute('aria-label', `${f.label} ${f.unit}`);
    wrap.appendChild(input);
    form.appendChild(wrap);
    inputs[f.id] = input;
  });

  const sexRow = el('div', 'measures__field');
  sexRow.appendChild(fieldLabel('Sex'));
  sexRow.appendChild(segmented(
    ['Female', 'Male', 'Other'].map(o => ({ id: o, label: o })),
    p.sex,
    v => { profile.set({ sex: v }); done(); },
    'Sex',
  ));
  form.appendChild(sexRow);

  const actRow = el('div', 'measures__field');
  actRow.appendChild(fieldLabel('How much do you move'));
  actRow.appendChild(segmented(
    ['Low', 'Some', 'Regular', 'Heavy'].map(o => ({ id: o, label: o })),
    p.activity,
    v => { profile.set({ activity: v }); done(); },
    'Activity',
  ));
  form.appendChild(actRow);

  const save = button('Save', 'btn btn--block');
  save.type = 'submit';
  form.appendChild(save);
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const patch = {};
    for (const [k, input] of Object.entries(inputs)) {
      const f = fields.find(x => x.id === k);
      const typed = numberOrNull(input.value);
      patch[k] = f?.measure ? unitStore(typed, f.measure) : typed;
    }
    profile.set(patch);
    live.textContent = 'Saved';
    done();
  });
  return form;
}

function waistForm(done, live) {
  const form = el('form', 'inline-form');
  const input = el('input', 'field field--num');
  input.type = 'number';
  input.inputMode = 'decimal';
  input.placeholder = `Waist, ${unitWords().length}`;
  input.setAttribute('aria-label', `Waist in ${unitWords().lengthLong}`);
  const go = button('Save', 'btn');
  go.type = 'submit';
  form.append(input, go);
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (input.value === '') return;
    profile.set({ waistCm: unitStore(numberOrNull(input.value), 'length') });
    live.textContent = 'Waist saved';
    done();
  });
  return form;
}
