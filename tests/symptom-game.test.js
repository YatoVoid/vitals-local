/* Run: node tests/symptom-game.test.js
 * No framework. Fails loudly if the body map, the flow, the triage logic, or
 * the wording constraints break.
 */
import assert from 'node:assert/strict';
import { REGIONS, PAIN_TYPES } from '../ui/components/symptom-game/regions.js';
import { regionIdFor, regionsIn, VIEWS, ZOOMS, zoomById, BODY_W, BODY_H }
  from '../ui/components/symptom-game/body-map.js';
import { initialState, send, STATES, progress } from '../ui/components/symptom-game/machine.js';
import { bankFor, BANKS, GENERIC } from '../src/triage/index.js';
import { startSession, nextQuestion, answer, resolve, ranked, stepBack, skipQuestion }
  from '../src/triage/engine.js';
import { compareIngredients, parseIngredient } from '../src/data/ingredients.js';

/* ---- Body map: the side mapping that is easiest to get wrong ---- */
{
  const thigh = { key: 'thigh' };
  assert.equal(regionIdFor(thigh, 'front', false), 'thigh.right');
  assert.equal(regionIdFor(thigh, 'front', true), 'thigh.left');
  assert.equal(regionIdFor(thigh, 'back', false), 'hamstring.left');
  assert.equal(regionIdFor(thigh, 'back', true), 'hamstring.right');
  assert.equal(regionIdFor({ key: 'ribs' }, 'front', false), 'chest.right');
  assert.equal(regionIdFor({ key: 'ribs' }, 'back', false), 'back.upper.left');
  assert.equal(regionIdFor({ key: 'midriff' }, 'front'), 'abdomen.upper');
  assert.equal(regionIdFor({ key: 'midriff' }, 'back'), 'back.mid');
  assert.equal(regionIdFor({ key: 'chestside' }, 'left'), 'chest.side.left');
  assert.equal(regionIdFor({ key: 'chestside' }, 'right'), 'chest.side.right');
}

/* ---- Four views, every id labelled ---- */
{
  assert.deepEqual(VIEWS, ['front', 'back', 'left', 'right']);
  const all = new Set();
  for (const v of VIEWS) {
    const ids = regionsIn(v);
    assert.equal(new Set(ids).size, ids.length, `${v} view emits a duplicate id`);
    ids.forEach(id => all.add(id));
  }
  assert.ok(all.size >= 50, `expected 50+ regions, got ${all.size}`);
  for (const id of all) assert.ok(REGIONS[id], `region ${id} has no label`);
  for (const [id, r] of Object.entries(REGIONS)) {
    assert.ok(!r.label.includes('.'), `label for ${id} looks like an id`);
  }
  // Every region routes to a question bank, even if only the general one.
  for (const id of all) assert.ok(bankFor(id), `no bank for ${id}`);
}

/* ---- Triage banks are internally consistent ---- */
{
  for (const bank of [...BANKS, GENERIC]) {
    const causeIds = new Set(bank.causes.map(c => c.id));
    assert.ok(causeIds.size === bank.causes.length, `${bank.id} has a duplicate cause id`);

    const priorSum = bank.causes.reduce((n, c) => n + c.prior, 0);
    assert.ok(priorSum > 0.8 && priorSum < 1.25,
      `${bank.id} priors sum to ${priorSum.toFixed(2)}, should be near 1`);

    const qIds = new Set();
    for (const q of bank.questions) {
      assert.ok(!qIds.has(q.id), `${bank.id} has a duplicate question id ${q.id}`);
      qIds.add(q.id);
      assert.ok(q.options.length >= 2, `${q.id} needs at least two options`);
      assert.ok(q.options.length <= 4, `${q.id} offers more than four options`);
      for (const o of q.options) {
        for (const cid of Object.keys(o.lr ?? {})) {
          assert.ok(causeIds.has(cid), `${bank.id} ${q.id} ${o.id} scores unknown cause ${cid}`);
        }
      }
    }
    // Every red flag references questions that exist and can be reached.
    for (const f of bank.redFlags) {
      for (const qid of Object.keys({ ...(f.answers ?? {}), ...(f.anyAnswer ?? {}) })) {
        assert.ok(qIds.has(qid), `${bank.id} red flag ${f.id} references missing question ${qid}`);
      }
      assert.ok(f.headline && f.lines?.length, `${bank.id} red flag ${f.id} has no text`);
    }
    // A question that gates on another must not gate on itself.
    for (const q of bank.questions) {
      const gates = Object.keys({ ...(q.needs?.answers ?? {}), ...(q.needs?.anyAnswer ?? {}) });
      assert.ok(!gates.includes(q.id), `${q.id} gates on its own answer`);
    }
  }
}

/* ---- Clinical patterns land where they should ---- */
function walk(region, seed, script, limit = 12) {
  const bank = bankFor(region);
  let s = startSession(bank, { region, ...seed });
  for (let i = 0; i < limit; i++) {
    const q = nextQuestion(s, bank);
    if (!q) break;
    const opt = script[q.id] ?? q.options[q.options.length - 1].id;
    s = answer(s, bank, q.id, opt);
    if (s.redFlag) break;
  }
  return { out: resolve(s, bank), session: s, bank };
}

{
  // Exertional chest pain with sweating is an emergency, every time.
  const angina = walk('chest.left', { painTypes: ['pain.pressure'], intensity: 7 }, {
    'q.onset': 'minutes', 'q.effort': 'brings-on', 'q.press': 'nothing',
    'q.breath': 'none', 'q.breathless': 'mild', 'q.autonomic': 'yes',
  });
  assert.equal(angina.out.red_flag_present, true, 'exertional chest pain missed');
  assert.equal(angina.out.red_flag.action_label, 'Get urgent help');
  assert.equal(angina.out.red_flag.urgency, 'emergency');
  assert.equal(angina.out.ranked_categories[0].category_id, 'angina');

  // Reproducible on pressing, unrelated to effort: chest wall, no flag.
  const wall = walk('chest.left', { painTypes: ['pain.sharp'], intensity: 4 }, {
    'q.onset': 'days', 'q.effort': 'no-change', 'q.press': 'reproduces',
    'q.breath': 'slight', 'q.breathless': 'none', 'q.autonomic': 'no',
  });
  assert.equal(wall.out.red_flag_present, false, 'chest wall pain wrongly flagged');
  assert.equal(wall.out.ranked_categories[0].category_id, 'musculoskeletal');

  // Migration to the right lower quadrant with fever: appendicitis, emergency.
  const appy = walk('abdomen.lower.right', { painTypes: ['pain.sharp'], intensity: 7 }, {
    'q.moved': 'navel-rlq', 'q.trend': 'worse', 'q.move-hurts': 'yes',
    'q.appetite': 'gone', 'q.fever': 'measured',
  });
  assert.equal(appy.out.red_flag_present, true, 'appendicitis pattern missed');
  assert.equal(appy.out.ranked_categories[0].category_id, 'appendicitis');

  // Saddle numbness alone is enough. It must fire on the first answer.
  const cauda = walk('back.lower.left', { painTypes: ['pain.aching'], intensity: 6 }, {
    'q.saddle': 'yes',
  });
  assert.equal(cauda.out.red_flag_present, true, 'cauda equina missed');
  assert.equal(cauda.out.red_flag.trigger_id, 'rf.back.cauda-equina');
  assert.equal(cauda.session.asked.length, 1, 'cauda equina should stop the questions at once');

  // Ordinary mechanical back pain must not be flagged.
  const backOk = walk('back.lower.left', { painTypes: ['pain.aching'], intensity: 4 }, {
    'q.saddle': 'no', 'q.bladder': 'no', 'q.leg': 'no', 'q.night': 'turning',
    'q.trauma': 'lift', 'q.systemic': 'no', 'q.position': 'sitting', 'q.duration': 'days',
  });
  assert.equal(backOk.out.red_flag_present, false, 'mechanical back pain wrongly flagged');
  assert.equal(backOk.out.ranked_categories[0].category_id, 'mechanical');

  // A headache peaking in under a minute is an emergency on that answer alone.
  const thunder = walk('head.face', { painTypes: ['pain.sharp'], intensity: 9 }, {
    'q.onset': 'seconds',
  });
  assert.equal(thunder.out.red_flag_present, true, 'thunderclap headache missed');
  assert.equal(thunder.session.asked.length, 1);

  // Textbook migraine must beat tension headache despite the lower prior.
  const mig = walk('head.side.left', { painTypes: ['pain.aching'], intensity: 6 }, {
    'q.onset': 'hours', 'q.neuro': 'no', 'q.fever-neck': 'neither', 'q.strain': 'no',
    'q.pattern': 'same', 'q.quality': 'throbbing', 'q.sides': 'one-side',
    'q.nausea': 'both', 'q.activity': 'yes', 'q.age-new': 'no',
    'q.duration': '4-72h', 'q.painkillers': 'under-5',
  });
  assert.equal(mig.out.red_flag_present, false);
  assert.equal(mig.out.ranked_categories[0].category_id, 'migraine',
    'migraine features did not beat the tension headache prior');

  // Textbook tension headache stays tension.
  const tension = walk('head.side.left', { painTypes: ['pain.pressure'], intensity: 4 }, {
    'q.onset': 'hours', 'q.neuro': 'no', 'q.fever-neck': 'neither', 'q.strain': 'no',
    'q.pattern': 'same', 'q.quality': 'band', 'q.sides': 'both', 'q.nausea': 'no',
    'q.activity': 'no', 'q.age-new': 'no', 'q.painkillers': 'under-5',
  });
  assert.equal(tension.out.ranked_categories[0].category_id, 'tension');

  // Ottawa positive: cannot take four steps plus bone tenderness.
  const knee = walk('knee.right', { painTypes: ['pain.sharp'], intensity: 7 }, {
    'q.injury': 'yes-today', 'q.weight': 'neither', 'q.bony': 'yes',
  });
  assert.equal(knee.out.red_flag_present, true, 'Ottawa positive knee missed');
  assert.equal(knee.out.red_flag.urgency, 'same_day');

  // Rapid onset hot red joint without fever: gout leads, not infection.
  const gout = walk('foot.left', { painTypes: ['pain.burning'], intensity: 8 }, {
    'q.injury': 'no', 'q.hot': 'very', 'q.fever': 'no', 'q.speed': 'hours',
  });
  assert.equal(gout.out.red_flag_present, false);
  assert.equal(gout.out.ranked_categories[0].category_id, 'gout');
}

/* ---- The engine asks adaptively rather than from a fixed list ---- */
{
  const bank = bankFor('chest.left');
  const a = startSession(bank, { region: 'chest.left', painTypes: [], intensity: 5 });
  const first = nextQuestion(a, bank);
  assert.ok(first.screening, 'the first question must be a screening one');

  // A question gated on another answer must not appear before that answer.
  const legQ = bank.questions.find(q => q.id === 'q.legs');
  assert.ok(legQ.needs, 'the calf question should be gated');
  let s = startSession(bank, { region: 'chest.left', painTypes: [], intensity: 5 });
  s = answer(s, bank, 'q.breath', 'none');
  s = answer(s, bank, 'q.breathless', 'none');
  const pool = [];
  for (let i = 0; i < 10; i++) {
    const q = nextQuestion(s, bank);
    if (!q) break;
    pool.push(q.id);
    s = answer(s, bank, q.id, q.options[q.options.length - 1].id);
    if (s.redFlag) break;
  }
  assert.ok(!pool.includes('q.legs'),
    'the calf question was asked without any breathing symptom to justify it');

  // Stepping back reverses exactly one answer and rebuilds the scores.
  let t = startSession(bank, { region: 'chest.left', painTypes: [], intensity: 5 });
  t = answer(t, bank, 'q.onset', 'sudden');
  t = answer(t, bank, 'q.effort', 'brings-on');
  const beforeBack = ranked(t, bank)[0].id;
  const back = stepBack(t, bank);
  assert.equal(back.asked.length, 1);
  assert.equal(back.answers['q.effort'], undefined);
  const again = answer(back, bank, 'q.effort', 'brings-on');
  assert.equal(ranked(again, bank)[0].id, beforeBack, 'stepping back and forward changed the result');
}

/* ---- Walk the machine the way a person walks the screen ---- */
{
  let s = initialState();
  assert.equal(s.stage, STATES.BODY_SELECT);
  assert.equal(s.view, 'front');

  s = send(s, { type: 'advance' });
  assert.equal(s.stage, STATES.BODY_SELECT, 'cannot advance without a region');

  s = send(s, { type: 'select_region', regionId: 'chest.left' });
  assert.equal(s.sheet, 'region');

  s = send(s, { type: 'set_view', view: 'back' });
  assert.equal(s.region, 'chest.left', 'changing view cleared the region');

  s = send(s, { type: 'select_region', regionId: 'chest.left' });
  assert.equal(s.region, null, 'tapping the open region clears it');

  s = send(s, { type: 'select_region', regionId: 'chest.left' });
  s = send(s, { type: 'advance' });
  assert.equal(s.stage, STATES.PAIN_TYPES);

  s = send(s, { type: 'advance' });
  assert.equal(s.stage, STATES.PAIN_TYPES, 'cannot advance without a pain type');

  s = send(s, { type: 'select_pain_type', painId: 'pain.pressure' });
  s = send(s, { type: 'select_pain_type', painId: 'pain.dull' });
  assert.deepEqual(s.painTypes, ['pain.pressure', 'pain.dull']);
  s = send(s, { type: 'select_pain_type', painId: 'pain.dull' });
  assert.deepEqual(s.painTypes, ['pain.pressure'], 'tapping again deselects');

  s = send(s, { type: 'set_intensity', value: 6 });
  assert.equal(s.intensity, 6);

  s = send(s, { type: 'advance' });
  assert.equal(s.stage, STATES.CONTEXT);
  assert.ok(s.question, 'the context stage must carry a question');
  assert.ok(s.triage, 'the context stage must carry a triage session');

  // Answer whatever is asked until it resolves.
  for (let i = 0; i < 14 && s.stage === STATES.CONTEXT; i++) {
    const q = s.question;
    s = send(s, { type: 'answer_context', questionId: q.id, optionId: q.options[0].id });
    s = send(s, { type: 'advance' });
  }
  assert.equal(s.stage, STATES.OUTCOME, 'the flow never reached an outcome');
  assert.equal(s.outcome.status, 'resolved');
  assert.ok(s.outcome.ranked_categories.length >= 2);
  assert.equal(progress(s), 1);

  s = send(s, { type: 'show_refinement' });
  assert.equal(s.stage, STATES.REFINEMENT);
  s = send(s, { type: 'close_refinement' });
  assert.equal(s.stage, STATES.OUTCOME);

  const view = s.view;
  s = send(s, { type: 'restart' });
  assert.equal(s.stage, STATES.BODY_SELECT);
  assert.equal(s.region, null);
  assert.equal(s.view, view, 'restart keeps the view the person was on');
}

/* ---- Ingredient naming ---- */
{
  const same = compareIngredients('Paracetamol', 'Acetaminophen');
  assert.equal(same.verdict, 'same-different-name',
    'paracetamol and acetaminophen must compare as the same drug');
  assert.ok(same.detail.length > 40, 'the explanation must say why the names differ');

  assert.equal(compareIngredients('Salbutamol', 'Albuterol').verdict, 'same-different-name');
  assert.equal(compareIngredients('Adrenaline', 'Epinephrine').verdict, 'same-different-name');
  assert.equal(compareIngredients('Naproxen', 'Naproxen sodium').verdict, 'same-different-salt');
  assert.equal(compareIngredients('Ibuprofen', 'Naproxen').verdict, 'related');
  assert.equal(compareIngredients('Paracetamol', 'Ibuprofen').verdict, 'different');
  assert.equal(compareIngredients('Nonsuchamol', 'Paracetamol').verdict, 'unknown');

  // Case and spacing must not matter on a label someone retypes.
  assert.equal(compareIngredients('  PARACETAMOL ', 'acetaminophen').verdict, 'same-different-name');
  assert.equal(parseIngredient('Diclofenac sodium').salt, 'sodium');
  assert.equal(parseIngredient('Diclofenac sodium').entry.id, 'diclofenac');
}

/* ---- Wording constraints, enforced rather than documented ---- */
{
  const words = str => str.trim().split(/\s+/).length;
  for (const p of PAIN_TYPES) {
    assert.ok(words(p.label) <= 2, `pain label over two words: ${p.label}`);
  }
  for (const bank of [...BANKS, GENERIC]) {
    for (const q of bank.questions) {
      assert.ok(q.prompt.length <= 62, `question too long to read at a glance: ${q.prompt}`);
      for (const o of q.options) {
        assert.ok(words(o.label) <= 7, `option label too long: ${o.label}`);
      }
    }
    for (const f of bank.redFlags) {
      assert.ok(!/\bmay potentially\b|\bit is important\b|\bconsult a healthcare\b/i.test(f.lines.join(' ')),
        `${f.id} uses hedging language`);
    }
  }
  assert.ok(PAIN_TYPES.filter(p => !p.extra).length <= 10, 'first pain view stays at ten or fewer');
}

/* ---- Lab bands ----
   The whole point of these is that a value can sit inside the printed range
   and still mean something, so the tests pin the thresholds that carry that
   and the wording that must not slip. ---- */
{
  const { MARKERS, assess, RANGE_NOTE } = await import('../src/data/labs.js');
  const find = id => MARKERS.find(m => m.id === id);
  const zoneAt = (id, value, profile) => assess(find(id), value, profile).zone.key;

  // Every marker has zones that cover the number line, low to high.
  for (const m of MARKERS) {
    const zones = m.zonesFor({});
    assert.ok(zones.length >= 2, `${m.id} needs more than one zone`);
    assert.equal(zones[zones.length - 1].upTo, Infinity, `${m.id} must not run out of zones`);
    let last = -Infinity;
    for (const z of zones) {
      assert.ok(z.upTo > last, `${m.id} zones must climb`);
      last = z.upTo;
      assert.ok(z.label && z.note, `${m.id} zone ${z.key} needs a label and a note`);
      assert.ok(['none', 'soon', 'now'].includes(z.severity), `${m.id} zone ${z.key} severity`);
    }
    assert.ok(m.basis && m.basis.length > 20, `${m.id} says where its numbers come from`);
  }

  /* Ferritin is the case the whole feature exists for: 20 is inside a range
     that starts at 15 in many laboratories, and is still iron deficiency. */
  assert.equal(zoneAt('fer', 10), 'empty');
  assert.equal(zoneAt('fer', 20), 'deficient');
  assert.equal(zoneAt('fer', 29), 'deficient');
  assert.equal(zoneAt('fer', 45), 'low-ish');
  assert.equal(zoneAt('fer', 150), 'ok');
  assert.equal(zoneAt('fer', 400), 'high');
  assert.match(assess(find('fer'), 20).zone.note, /deficien/i);

  /* Haemoglobin has to follow the sex on the profile, since the anaemia
     threshold differs by about 10 g/L. */
  assert.equal(zoneAt('hb', 125, { sex: 'Female' }), 'low-normal');
  assert.equal(zoneAt('hb', 125, { sex: 'Male' }), 'mild');
  assert.equal(assess(find('hb'), 125, { sex: 'Female' }).outside, null);
  assert.equal(assess(find('hb'), 125, { sex: 'Male' }).outside, 'below');
  assert.equal(zoneAt('hb', 70, {}), 'severe');
  assert.equal(zoneAt('hb', 95, {}), 'moderate');

  /* HbA1c: the band between normal and diabetes is inside what many reports
     print without a flag. */
  assert.equal(zoneAt('hba1c', 38), 'ok');
  assert.equal(zoneAt('hba1c', 44), 'raised');
  assert.equal(zoneAt('hba1c', 48), 'diabetes');
  assert.match(assess(find('hba1c'), 44).zone.note, /42 and 47|6\.0 to 6\.4/);

  // TSH: inside the range at the top is not the same as mid range.
  assert.equal(zoneAt('tsh', 1.5), 'mid');
  assert.equal(zoneAt('tsh', 3.8), 'upper');
  assert.equal(zoneAt('tsh', 6), 'subclinical');
  assert.equal(zoneAt('tsh', 12), 'high');
  assert.match(assess(find('tsh'), 1.5).zone.note, /pregnan/i);

  // Vitamin D: sufficiency and deficiency are different thresholds.
  assert.equal(zoneAt('vitd', 20), 'deficient');
  assert.equal(zoneAt('vitd', 40), 'inadequate');
  assert.equal(zoneAt('vitd', 60), 'sufficient');

  // Position is only meaningful inside the range.
  const inside = assess(find('vitd'), 87);
  assert.ok(inside.position > 0.4 && inside.position < 0.6, 'mid range reads as mid');
  assert.equal(assess(find('vitd'), 10).position, null, 'outside has no position');

  assert.equal(assess(find('tsh'), null), null);
  assert.equal(assess(find('tsh'), NaN), null);

  // The explanation people are owed must not go missing.
  assert.match(RANGE_NOTE, /95/);
  assert.match(RANGE_NOTE, /twenty|20/);

  // House style: no hedging in anything shown on this screen.
  const prose = MARKERS.flatMap(m => [m.basis, ...m.zonesFor({}).flatMap(z => [z.label, z.note])])
    .concat(RANGE_NOTE).join(' ');
  assert.ok(!/consult a healthcare|it is important to|may potentially|please note/i.test(prose),
    'lab wording avoids the hedges the style rules ban');
}

/* ---- Home tile order ----
   A saved arrangement outlives the version that wrote it, so it has to
   survive tiles being added and removed rather than hiding the new ones or
   throwing on the old. ---- */
{
  const bag = new Map();
  globalThis.localStorage = {
    getItem: k => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => bag.set(k, String(v)),
    removeItem: k => bag.delete(k),
    key: i => [...bag.keys()][i] ?? null,
    get length() { return bag.size; },
  };
  globalThis.document = { documentElement: { dataset: {} } };

  const { resolveOrder, DEFAULT_ORDER } = await import('../src/screens/home.js');

  assert.deepEqual(resolveOrder(undefined), DEFAULT_ORDER, 'no saved order gives the default');
  assert.deepEqual(resolveOrder(null), DEFAULT_ORDER);
  assert.deepEqual(resolveOrder('nonsense'), DEFAULT_ORDER, 'a damaged value falls back');
  assert.deepEqual(resolveOrder([]), DEFAULT_ORDER, 'an empty order still draws every tile');

  const rotated = ['air', 'uv', 'meds', 'energy', 'water', 'symptoms'];
  assert.deepEqual(resolveOrder(rotated), rotated, 'a full arrangement is kept as it is');

  // A tile added since the arrangement was saved has to appear.
  const old = ['symptoms', 'water', 'energy', 'meds'];
  const now = resolveOrder(old);
  assert.deepEqual(now.slice(0, 4), old, 'the saved part keeps its order');
  assert.ok(now.includes('uv') && now.includes('air'), 'newer tiles are appended');
  assert.equal(now.length, DEFAULT_ORDER.length);

  // A tile removed since must not survive into the render.
  const withGhost = ['ghost', 'symptoms', 'water', 'energy', 'meds', 'uv', 'air'];
  assert.ok(!resolveOrder(withGhost).includes('ghost'), 'an unknown id is dropped');

  // No duplicates, whatever went in.
  const dupes = resolveOrder(['water', 'water', 'symptoms']);
  assert.equal(new Set(dupes).size, dupes.length, 'the result has no repeats');
  assert.equal(dupes.length, DEFAULT_ORDER.length);

  delete globalThis.localStorage;
  delete globalThis.document;
}

/* ---- Emergency numbers ----
   The number on a red flag screen is the one thing that cannot be guessed, so
   the table is checked for shape and the unknown case for honesty. ---- */
{
  const { emergencyFor, emergencyLine, coveredCountries } =
    await import('../src/data/emergency.js');

  for (const iso of coveredCountries()) {
    const hit = emergencyFor(iso);
    assert.match(iso, /^[A-Z]{2}$/, `${iso} is a two letter code`);
    assert.match(hit.call, /^[0-9]{2,5}$/, `${iso} dials digits only, got ${hit.call}`);
    if (hit.also) assert.match(hit.also, /^[0-9]{2,5}$/, `${iso} second number is digits`);
  }

  // Countries the app ships a labelling set for must all be covered.
  for (const iso of ['AZ', 'US', 'GR']) {
    assert.ok(emergencyFor(iso), `${iso} has an emergency number`);
  }
  assert.equal(emergencyFor('US').call, '911');
  assert.equal(emergencyFor('GR').call, '112');
  assert.equal(emergencyFor('AZ').call, '112');
  assert.equal(emergencyFor('GB').call, '999');

  assert.equal(emergencyFor('ZZ'), null, 'an unknown country has no number');
  assert.equal(emergencyFor(null), null);
  assert.equal(emergencyFor(undefined), null);

  const unknown = emergencyLine(null, null);
  assert.equal(unknown.known, false);
  assert.ok(!/^Call [0-9]/.test(unknown.text),
    'an unknown country must not open by naming a number as if it were local');
  assert.match(unknown.text, /local emergency number/i);

  const known = emergencyLine('GR', 'Greece');
  assert.equal(known.known, true);
  assert.match(known.text, /112/);
  assert.match(known.text, /Greece/);
}

/* ---- Skipping a question ----
   Skipping must remove the question from the pool. Left in, the engine picks
   the same one straight back and the button looks dead. It must also leave
   the ranking untouched, since a skip is not evidence. ---- */
{
  const bank = bankFor('chest.left');
  let s = startSession(bank, { region: 'chest.left', painTypes: ['pain.sharp'], intensity: 5 });

  const first = nextQuestion(s, bank);
  assert.ok(first, 'there is a question to skip');

  const beforeRanking = ranked(s, bank).map(c => `${c.category_id ?? c.id}:${c.score.toFixed(4)}`);
  const skipped = skipQuestion(s, first.id);
  const afterRanking = ranked(skipped, bank).map(c => `${c.category_id ?? c.id}:${c.score.toFixed(4)}`);
  assert.deepEqual(afterRanking, beforeRanking, 'a skip moves no candidate');

  const second = nextQuestion(skipped, bank);
  assert.notEqual(second?.id, first.id, 'the skipped question is not offered again');

  // Skipping everything has to end the session rather than loop.
  let all = s;
  for (let i = 0; i < bank.questions.length + 2; i++) {
    const q = nextQuestion(all, bank);
    if (!q) break;
    all = skipQuestion(all, q.id);
  }
  assert.equal(nextQuestion(all, bank), null, 'skipping every question resolves the session');

  // A skip survives stepping back through the answers.
  let walked = startSession(bank, { region: 'chest.left', painTypes: ['pain.sharp'], intensity: 5 });
  const q1 = nextQuestion(walked, bank);
  walked = answer(walked, bank, q1.id, q1.options[0].id);
  const q2 = nextQuestion(walked, bank);
  walked = skipQuestion(walked, q2.id);
  const q3 = nextQuestion(walked, bank);
  walked = answer(walked, bank, q3.id, q3.options[0].id);
  const back = stepBack(walked, bank);
  assert.ok(back.skipped.includes(q2.id), 'stepping back keeps the skip');
  assert.notEqual(nextQuestion(back, bank)?.id, q2.id, 'and does not re-offer it');
}

/* ---- Offline precache ----
   A module added to the tree but not to sw.js loads fine online and fails the
   moment someone opens the app without a network, which is the one case the
   file exists for. ---- */
{
  const { readFileSync, readdirSync } = await import('node:fs');
  const { join, dirname, relative, sep } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'\.\/([^']+\.(?:js|css|html))'/g)].map(m => m[1]));

  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(js|css)$/.test(e.name) ? [p] : [];
  });
  const onDisk = [...walk(join(root, 'src')), ...walk(join(root, 'ui'))]
    .map(p => relative(root, p).split(sep).join('/'));

  const missing = onDisk.filter(p => !listed.has(p));
  assert.deepEqual(missing, [],
    'these ship in the app but are not precached, so they fail offline');

  const stale = [...listed].filter(p => p !== 'index.html' && !onDisk.includes(p));
  assert.deepEqual(stale, [],
    'sw.js precaches files that no longer exist');
}

/* ---- Pain chart geometry ----
   Readings logged minutes apart divide down to the same x and stack into one
   column at the edge, which is what every episode looks like on day one. ---- */
{
  const ep = await import('../src/app/episodes.js');
  const iso = ms => new Date(ms).toISOString();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const sameSitting = { readings: [6, 5, 4, 3].map((v, i) =>
    ({ intensity: v, at: iso(now + i * 1000) })) };
  const spread = { readings: [6, 5, 4, 3].map((v, i) =>
    ({ intensity: v, at: iso(now + i * day) })) };

  const flat = ep.chartPoints(sameSitting, 100, 34);
  assert.equal(flat.length, 4);
  assert.equal(new Set(flat.map(p => p.x)).size, 4,
    'readings taken together must not share an x');
  assert.equal(flat[0].x, 0);
  assert.equal(flat.at(-1).x, 100, 'evenly spaced points still span the width');
  assert.equal(ep.chartIsTimed(sameSitting), false);

  const timed = ep.chartPoints(spread, 100, 34);
  assert.equal(ep.chartIsTimed(spread), true);
  assert.equal(timed[0].x, 0);
  assert.equal(timed.at(-1).x, 100);
  // Intensity still drives y in both cases, higher pain nearer the top.
  assert.ok(timed[0].y < timed.at(-1).y, 'a falling series climbs the y axis');

  assert.deepEqual(ep.chartPoints({ readings: [] }), []);
  assert.deepEqual(ep.chartPoints({ readings: [{ intensity: 4, at: iso(now) }] }), []);
}

/* ---- Units ----
   Records stay metric and convert only at the edges, so a round trip through
   the US system has to come back to the same stored number. ---- */
{
  const bag = new Map();
  globalThis.localStorage = {
    getItem: k => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => bag.set(k, String(v)),
    removeItem: k => bag.delete(k),
    key: i => [...bag.keys()][i] ?? null,
    get length() { return bag.size; },
  };
  globalThis.document = { documentElement: { dataset: {} } };

  const u = await import('../src/app/units.js');
  const metric = { units: 'metric' };
  const us = { units: 'us' };

  assert.equal(u.isUS(us), true);
  assert.equal(u.isUS(metric), false);
  assert.equal(u.units(us).mass, 'lb');
  assert.equal(u.units(metric).mass, 'kg');

  // Known conversions.
  assert.ok(Math.abs(u.cmToIn(178) - 70.08) < 0.01, 'cm to inches');
  assert.ok(Math.abs(u.kgToLb(82) - 180.78) < 0.01, 'kg to pounds');
  assert.deepEqual(u.cmToFeetInches(178), { feet: 5, inches: 10 });
  assert.ok(Math.abs(u.feetInchesToCm(5, 10) - 177.8) < 0.05, 'feet and inches back to cm');
  assert.equal(u.feetInchesToCm(0, 0), null, 'an empty height is absent, not zero');

  // Round trips must not drift.
  for (const [value, kind] of [[178, 'length'], [82, 'mass'], [2000, 'volume']]) {
    const shown = u.display(value, kind, us);
    const back = u.store(shown, kind, us);
    assert.ok(Math.abs(back - value) / value < 0.01,
      `${kind} round trip drifted: ${value} -> ${shown} -> ${back}`);
  }

  // Metric passes through untouched.
  assert.equal(u.store(178, 'length', metric), 178);
  assert.equal(u.display(null, 'mass', us), null);
  assert.equal(u.withUnit(82, 'mass', metric), '82 kg');
  assert.match(u.withUnit(82, 'mass', us), /^180\.8 lb$/);

  delete globalThis.localStorage;
  delete globalThis.document;
}

/* ---- Ingredient comparison ----
   The per-entry note explains how a drug's names vary between countries. It
   belongs in the answer only when the two names actually differ; shown for a
   name typed twice it reads as a warning about a product that is not on the
   table. ---- */
{
  const pair = compareIngredients('Paracetamol', 'Acetaminophen');
  assert.equal(pair.verdict, 'same-different-name');
  assert.match(pair.detail, /Acetaminophen/, 'the two name case explains the two names');

  for (const name of ['Ibuprofen', 'Paracetamol']) {
    const same = compareIngredients(name, name);
    assert.equal(same.verdict, 'same', `${name} against itself is the same ingredient`);
    assert.match(same.detail, /Strength, form/,
      `${name} against itself points at what can still differ`);
    // The synonym story names another compound, which is what made this wrong.
    assert.ok(!/Dexibuprofen|Acetaminophen/i.test(same.detail),
      `${name} against itself must not raise a drug that was never entered`);
  }

  const different = compareIngredients('Paracetamol', 'Ibuprofen');
  assert.equal(different.verdict, 'different');
}

/* ---- Zoom crops ----
   A crop that is not symmetric about the centre line breaks the mirrored
   half: getBBox reports a mirrored shape in its authored coordinates, so the
   only reason a crop test works for both halves is that the crop reflects
   onto itself. ---- */
{
  assert.ok(ZOOMS.length >= 2, 'there is more than one crop');
  assert.equal(ZOOMS[0].id, 'all', 'the whole body is the first and default crop');
  assert.deepEqual(ZOOMS[0].box, [0, 0, BODY_W, BODY_H], 'the default crop is the whole canvas');

  const ids = new Set();
  for (const z of ZOOMS) {
    assert.ok(!ids.has(z.id), `duplicate zoom id ${z.id}`);
    ids.add(z.id);
    assert.ok(z.label && z.label.length > 2, `${z.id} has no label`);

    const [x, y, w, h] = z.box;
    assert.ok(w > 0 && h > 0, `${z.id} has an empty box`);
    assert.ok(x >= 0 && y >= 0, `${z.id} starts outside the canvas`);
    assert.ok(x + w <= BODY_W, `${z.id} runs past the canvas width`);
    assert.ok(y + h <= BODY_H, `${z.id} runs past the canvas height`);

    const centre = x + w / 2;
    assert.equal(centre, BODY_W / 2,
      `${z.id} is centred on ${centre}, not the body centre line ${BODY_W / 2}. `
      + 'An off-centre crop keeps one arm and drops the other.');
  }

  assert.equal(zoomById('all').id, 'all');
  assert.equal(zoomById('nonsense').id, 'all', 'an unknown crop falls back to the whole body');
}

/* ---- Export and import round trip ----
   An export nobody can restore is not a backup, and a malformed file must be
   refused before any of it is written. ---- */
{
  // store.js writes through localStorage and stamps settings onto the root.
  const bag = new Map();
  globalThis.localStorage = {
    getItem: k => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => bag.set(k, String(v)),
    removeItem: k => bag.delete(k),
    key: i => [...bag.keys()][i] ?? null,
    get length() { return bag.size; },
  };
  globalThis.document = { documentElement: { dataset: {} } };

  const store = await import('../src/app/store.js');

  store.water.add({ ml: 250 });
  store.water.add({ ml: 400 });
  store.profile.set({ age: 41 });
  const snapshot = store.exportAll();
  assert.equal(snapshot.water_log.length, 2, 'export carries the water log');

  store.wipe('all');
  assert.equal(store.water.all().length, 0, 'wipe clears the water log');

  const restored = store.importAll(snapshot);
  assert.ok(restored.ok, 'a file this app wrote imports back');
  assert.equal(store.water.all().length, 2, 'entries come back');
  assert.equal(store.profile.get().age, 41, 'profile comes back');

  for (const [bad, why] of [
    [null, 'nothing'],
    [{ app: 'Something Else', schema: 1 }, 'another app'],
    [{ app: 'Vitals Local', schema: 9 }, 'a future schema'],
    [{ app: 'Vitals Local', schema: 1, water_log: 'nope' }, 'a damaged list'],
  ]) {
    const res = store.importAll(bad);
    assert.equal(res.ok, false, `import refuses ${why}`);
    assert.ok(res.error && res.error.length > 10, `refusal for ${why} says why`);
  }
  // A refused import leaves what was already there alone.
  assert.equal(store.water.all().length, 2, 'a refused import changes nothing');

  delete globalThis.localStorage;
  delete globalThis.document;
}

/* ---- Every module parses. A syntax error takes the app down silently in a
   browser, and a blank page passes every visual check. The file list is
   discovered rather than declared, so a new module is covered on the day it
   is written. ---- */
{
  const { execFileSync } = await import('node:child_process');
  const { readdirSync, readFileSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });

  const files = [...walk(join(root, 'src')), ...walk(join(root, 'ui'))];
  assert.ok(files.length > 20, 'module discovery found the source tree');

  for (const f of files) {
    try {
      execFileSync(process.execPath, ['--input-type=module', '--check'],
        { input: readFileSync(f, 'utf8'), stdio: ['pipe', 'ignore', 'pipe'] });
    } catch (err) {
      assert.fail(`${f.slice(root.length + 1)} does not parse\n${err.stderr}`);
    }
  }

  // Modules safe to evaluate outside a browser also get executed.
  for (const m of ['../ui/components/symptom-game/regions.js',
                   '../ui/components/symptom-game/machine.js',
                   '../ui/components/symptom-game/body-map.js',
                   '../ui/components/symptom-game/pain-dial.js',
                   '../src/app/store.js',
                   '../src/app/ui.js',
                   '../src/triage/index.js',
                   '../src/data/ingredients.js']) await import(m);
}

console.log('all checks passed');
