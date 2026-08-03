/* Symptom game, renderer.
 *
 * One Stage holds one step at a time. Every transition is a transform and an
 * opacity change, so the compositor does the work and a mid-range phone keeps
 * its frame budget. Nothing here reads layout during an animation.
 */

import { REGIONS, PAIN_TYPES } from './regions.js';
import { renderBody, VIEWS, ZOOMS, zoomById, BODY_W, BODY_H } from './body-map.js';
import { renderPainDial, renderIntensity } from './pain-dial.js';
import { start as startEpisode, open as openEpisodes, addReading }
  from '../../../src/app/episodes.js';
import { STATES, MULTI_SELECT_PAIN, initialState, send, resolve, progress } from './machine.js';
import { enableDragScroll } from '../../../src/app/ui.js';
import { emergencyLine } from '../../../src/data/emergency.js';
import { savedPlace } from '../../../src/app/weather.js';
import { settings } from '../../../src/app/store.js';
import { promptFor } from '../../../src/triage/engine.js';

/* The country setting names a labelling region rather than a place. Only the
   ones that are a single country can point at an emergency number; "Europe,
   general" cannot, and says so instead of guessing. */
const isoForSetting = code => (['AZ', 'US', 'GR'].includes(code) ? code : null);

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const labelFor = id => REGIONS[id]?.label ?? id;
const painLabel = id => PAIN_TYPES.find(p => p.id === id)?.label ?? id;

export function mount(root) {
  let state = initialState();
  let bodyCache = {};

  const stageHost = el('div', 'stage-host');

  // Status strip. Reads as instrumentation and carries the live region.
  const hud = el('div', 'hud');
  hud.append(el('i', 'hud__dot'), el('span', null, 'Symptom scan'));
  const hudState = el('span', 'hud__val hud__spacer', 'Ready');
  hud.appendChild(hudState);

  const SEGMENTS = 6;
  const meter = el('div', 'meter');
  meter.setAttribute('role', 'progressbar');
  meter.setAttribute('aria-label', 'Progress through the questions');
  const segs = Array.from({ length: SEGMENTS }, () => {
    const i = el('i', 'meter__seg');
    meter.appendChild(i);
    return i;
  });

  const sheetHost = el('div', 'sheet-host');
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');

  root.append(hud, meter, stageHost, sheetHost, live);
  enableDragScroll(root);

  /* Some controls own their own visual state while dragging, so a full
     redraw mid-gesture would fight the finger. This records the change
     without repainting. */
  function dispatchQuiet(event) {
    state = send(state, event);
  }

  /* Move to the next question without a second tap. A single choice question
     has nothing left to say once it is answered, so waiting for Next only
     adds a step. Cancelled if the person changes their mind in the window. */
  let advanceTimer = null;
  function advanceSoon(ms = 280) {
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => dispatch({ type: 'advance' }), ms);
  }

  /* Multi select has no single right moment to move on, so the next action
     is brought to the thumb instead of the person hunting for it. */
  function scrollNextIntoView() {
    requestAnimationFrame(() => {
      stageHost.querySelector('.stage__next')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function dispatch(event) {
    /* Taken before anything renders. Drawing the stage detaches whatever was
       focused, so by the time a sheet is built the active element is already
       the document and there is nothing left to hand focus back to. */
    lastFocusMemo = rememberFocus() ?? lastFocusMemo;
    const next = send(state, event);
    if (next === state) return;
    const stageChanged = next.stage !== state.stage || next.rung !== state.rung;
    state = next;
    render(stageChanged);
  }

  function render(animate) {
    const pct = progress(state);
    const lit = Math.round(pct * segs.length);
    segs.forEach((sg, i) => { sg.dataset.on = i < lit ? '1' : '0'; });
    meter.setAttribute('aria-valuenow', Math.round(pct * 100));
    hudState.textContent = {
      BODY_SELECT: state.region ? 'Region locked' : 'Select region',
      PAIN_TYPES: 'Describe pain',
      CONTEXT: `Question ${state.rung + 1}`,
      OUTCOME: 'Result',
      REFINEMENT: 'Ranking',
    }[state.stage] ?? '';
    drawStage(animate);
    drawSheet();
  }

  /* ---- Stage: the sliding step container ---- */
  function drawStage(animate) {
    const panel = el('section', 'stage');
    panel.dataset.stage = state.stage;
    if (animate) panel.dataset.enter = state.direction;

    ({
      [STATES.BODY_SELECT]: bodySelect,
      [STATES.PAIN_TYPES]: painTypes,
      [STATES.CONTEXT]: contextStep,
      [STATES.OUTCOME]: outcome,
      [STATES.REFINEMENT]: refinement,
    })[state.stage](panel);

    const old = stageHost.firstElementChild;
    if (old && animate) {
      old.dataset.exit = state.direction;
      old.addEventListener('animationend', () => old.remove(), { once: true });
      // Guard against a dropped animationend when motion is reduced.
      setTimeout(() => old.remove(), 400);
      stageHost.appendChild(panel);
    } else {
      stageHost.replaceChildren(panel);
    }
  }

  function header(panel, eyebrow, title) {
    if (eyebrow) panel.appendChild(el('p', 'label stage__eyebrow', eyebrow));
    panel.appendChild(el('h2', 'stage__title', title));
  }

  function footer(panel, { nextLabel = 'Next', enabled = true, onNext, back = true }) {
    const bar = el('div', 'stage__footer');
    if (back) {
      const b = el('button', 'btn btn--quiet', 'Back');
      b.type = 'button';
      b.addEventListener('click', () => dispatch({ type: 'back' }));
      bar.appendChild(b);
    }
    const n = el('button', 'btn stage__next', nextLabel);
    n.type = 'button';
    n.disabled = !enabled;
    n.addEventListener('click', onNext);
    bar.appendChild(n);
    panel.appendChild(bar);
  }

  /* A reticle in viewBox units. Sized against the crop so it stays the same
     size on screen however far the figure is zoomed. */
  function markAt(x, y, n, crop) {
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'mark');
    g.setAttribute('aria-hidden', 'true');
    g.dataset.n = String(n);
    const r = Math.max(crop[2], crop[3]) / 62;
    const arm = r * 1.6;
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', r);
    const h = document.createElementNS(NS, 'line');
    h.setAttribute('x1', x - arm); h.setAttribute('x2', x + arm);
    h.setAttribute('y1', y); h.setAttribute('y2', y);
    const v = document.createElementNS(NS, 'line');
    v.setAttribute('x1', x); v.setAttribute('x2', x);
    v.setAttribute('y1', y - arm); v.setAttribute('y2', y + arm);
    g.append(ring, h, v);
    return g;
  }

  /* ---- A) BodyMap, four views ---- */
  function bodySelect(panel) {
    header(panel, 'Step 1', 'Where does it hurt?');

    // Four views, one control. Labels are the view, not an instruction.
    const views = el('div', 'views views--hud');
    views.setAttribute('role', 'group');
    views.setAttribute('aria-label', 'Body view');
    VIEWS.forEach(v => {
      const b = el('button', null, v);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(v === state.view));
      b.addEventListener('click', () => {
        if (v === state.view) return;
        dispatch({ type: 'set_view', view: v });
        live.textContent = `${v} view`;
      });
      views.appendChild(b);
    });
    panel.appendChild(views);

    /* Area zoom. On a phone the whole figure is height-bound, which leaves
       the limb zones around 30px across. Cropping to one area spends the
       width that was going spare and lifts them past the 44px floor. */
    const areas = el('div', 'zooms');
    areas.setAttribute('role', 'group');
    areas.setAttribute('aria-label', 'Zoom to an area');
    ZOOMS.forEach(z => {
      const b = el('button', 'zoombtn', z.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(z.id === state.zoom));
      b.addEventListener('click', () => {
        if (z.id === state.zoom) return;
        dispatch({ type: 'set_zoom', zoom: z.id });
        live.textContent = z.id === 'all' ? 'Whole body' : `Zoomed to ${z.label.toLowerCase()}`;
      });
      areas.appendChild(b);
    });
    panel.appendChild(areas);

    const readout = el('p', 'readout');
    readout.dataset.empty = state.region ? '0' : '1';
    readout.textContent = state.region ? labelFor(state.region) : 'No region selected';

    const wrap = el('div', 'bodymap');

    const frame = el('div', 'bodymap__frame');
    for (let i = 0; i < 4; i++) frame.appendChild(el('span'));
    wrap.appendChild(frame);

    const key = `${state.view}:${state.zoom}`;
    if (!bodyCache[key]) bodyCache[key] = renderBody(state.view, labelFor, state.zoom);
    const svg = bodyCache[key].cloneNode(true);
    const crop = zoomById(state.zoom).box;   // [x, y, w, h] in whole-body space

    svg.querySelectorAll('.zone').forEach(zone => {
      const id = zone.dataset.region;
      if (id === state.region) {
        zone.classList.add('selected');
        zone.setAttribute('aria-pressed', 'true');
      }
      // A tap records the exact spot, not just the region it fell in.
      // Coordinates are normalised against the viewBox so a mark drawn on a
      // phone lands in the same place on a tablet.
      const pick = ev => {
        const box = svg.getBoundingClientRect();
        // A pointer gives a real spot. Keyboard activation reports 0,0, which
        // would drop the mark off the figure, so fall back to the middle of
        // the region that was chosen.
        const zoneBox = zone.getBoundingClientRect();
        let cx = zoneBox.left + zoneBox.width / 2;
        let cy = zoneBox.top + zoneBox.height / 2;
        if (ev && ev.clientX > 0 && ev.clientY > 0) { cx = ev.clientX; cy = ev.clientY; }

        /* Recorded against the whole-body space, not against the crop on
           screen, so a mark made while zoomed sits on the same spot when the
           figure is zoomed back out. */
        let x = 0.5, y = 0.5;
        if (box.width && box.height) {
          const inCrop = {
            x: Math.min(Math.max((cx - box.left) / box.width, 0), 1),
            y: Math.min(Math.max((cy - box.top) / box.height, 0), 1),
          };
          x = (crop[0] + inCrop.x * crop[2]) / BODY_W;
          y = (crop[1] + inCrop.y * crop[3]) / BODY_H;
        }
        dispatch({ type: 'mark_point', point: { region: id, view: state.view, x, y } });
        live.textContent = `${labelFor(id)} marked`;
      };
      zone.addEventListener('click', pick);
      zone.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); }
      });
      // The readout tracks what is under the finger before it commits.
      const preview = () => { readout.textContent = labelFor(id); readout.dataset.empty = '0'; };
      const clear = () => {
        readout.textContent = state.region ? labelFor(state.region) : 'No region selected';
        readout.dataset.empty = state.region ? '0' : '1';
      };
      zone.addEventListener('pointerenter', preview);
      zone.addEventListener('focus', preview);
      zone.addEventListener('pointerleave', clear);
      zone.addEventListener('blur', clear);
    });
    wrap.appendChild(svg);
    wrap.appendChild(el('i', 'bodymap__scan'));

    /* Shapes outside the crop are clipped but still in the tree, so without
       this they stay in the tab order and a keyboard lands on a zone nobody
       can see. getBBox needs the element rendered, which is why this runs
       after the append rather than inside renderBody. */
    if (state.zoom !== 'all') {
      const [cx, cy, cw, ch] = crop;
      /* Deferred a frame: getBBox reports zeros while the svg is still
         detached, which reads as "outside the crop" for every shape and
         would take the whole figure out of the tab order. */
      requestAnimationFrame(() => {
        if (!svg.isConnected) return;
        svg.querySelectorAll('.zone').forEach(zone => {
          let b;
          try { b = zone.getBBox(); } catch { return; }
          if (!b.width && !b.height) return;
          const outside = b.x + b.width < cx || b.x > cx + cw
                       || b.y + b.height < cy || b.y > cy + ch;
          if (!outside) return;
          zone.setAttribute('tabindex', '-1');
          zone.setAttribute('aria-hidden', 'true');
          zone.classList.add('zone--offcrop');
        });
      });
    }

    /* Reticles are drawn inside the svg, in viewBox units. An overlay div
       cannot be trusted here: the svg letterboxes its own contents, so a
       percentage of the element box is not a percentage of the figure, and
       the mark drifts by the size of the letterbox. Inside, the browser
       applies the same transform to marks and shapes alike.

       Points are held in whole-body coordinates and mapped into the current
       crop, so a mark made while zoomed keeps its spot when zoomed out. */
    state.points.filter(pt => pt.view === state.view).forEach((pt, i) => {
      const ax = pt.x * BODY_W;
      const ay = pt.y * BODY_H;
      if (ax < crop[0] || ax > crop[0] + crop[2]) return;
      if (ay < crop[1] || ay > crop[1] + crop[3]) return;
      svg.appendChild(markAt(ax, ay, i + 1, crop));
    });
    panel.appendChild(wrap);
    panel.appendChild(readout);

    if (state.points.length) {
      const clear = el('button', 'linkish linkish--quiet',
        state.points.length === 1 ? 'Clear the mark' : `Clear ${state.points.length} marks`);
      clear.type = 'button';
      clear.addEventListener('click', () => dispatch({ type: 'clear_points' }));
      panel.appendChild(clear);
    }
  }

  /* ---- B) PainTypeSelector, a dial rather than a list ---- */
  function painTypes(panel) {
    header(panel, labelFor(state.region), 'What does it feel like?');

    /* Eight wedges to start, twelve on request. Twelve at a size anyone can
       read overlap their neighbours: the label runs radially, so the room it
       has is set by the width of the band, and the gap between one label and
       the next by the angle. Eight gives both. The four held back are the
       less common qualities, and any already picked stay on the ring. */
    const showAll = state.showExtraPain
      || PAIN_TYPES.some(t => t.extra && state.painTypes.includes(t.id));
    const types = showAll ? PAIN_TYPES : PAIN_TYPES.filter(t => !t.extra);

    panel.appendChild(renderPainDial({
      types,
      selected: state.painTypes,
      centreLabel: labelFor(state.region),
      onToggle: id => {
        dispatch({ type: 'select_pain_type', painId: id });
        live.textContent = `${painLabel(id)} ${state.painTypes.includes(id) ? 'selected' : 'removed'}`;
        scrollNextIntoView();
      },
    }));

    if (!showAll) {
      const more = el('button', 'linkish', 'More types');
      more.type = 'button';
      more.addEventListener('click', () => {
        dispatch({ type: 'reveal_extra_pain' });
        live.textContent = 'Four more types added to the ring';
      });
      panel.appendChild(more);
    }

    if (state.painTypes.length) {
      const chips = el('div', 'chips');
      chips.append(el('span', 'field-label', 'Picked'));
      state.painTypes.forEach(id => chips.appendChild(el('span', 'chip', painLabel(id))));
      panel.appendChild(chips);
    }

    panel.appendChild(el('p', 'field-label', 'How bad at its worst'));
    panel.appendChild(renderIntensity({
      value: state.intensity,
      onChange: v => dispatchQuiet({ type: 'set_intensity', value: v }),
    }));

    footer(panel, {
      enabled: state.painTypes.length > 0,
      onNext: () => dispatch({ type: 'advance' }),
    });
    if (!MULTI_SELECT_PAIN) panel.dataset.select = 'single';
  }

  /* ---- C) The question ladder, one adaptive step at a time ---- */
  function contextStep(panel) {
    const q = state.question;
    if (!q) { dispatch({ type: 'advance' }); return; }

    const n = state.triage.asked.length + 1;
    header(panel, `${labelFor(state.region)} · question ${n}`, promptFor(q, state.triage));

    const list = el('div', 'choices');
    q.options.forEach(o => {
      const b = el('button', 'choice choice--wide');
      b.type = 'button';
      const chosen = state.triage.answers[q.id] === o.id;
      b.setAttribute('aria-pressed', String(chosen));
      if (chosen) b.classList.add('selected');
      b.append(el('span', 'choice__mark', chosen ? '✓' : ''), el('span', null, o.label));
      b.addEventListener('click', () => {
        dispatch({ type: 'answer_context', questionId: q.id, optionId: o.id });
        live.textContent = o.label;
        advanceSoon();
      });
      list.appendChild(b);
    });
    panel.appendChild(list);

    const detail = el('button', 'linkish', state.detail ? 'Edit detail' : 'Add detail');
    detail.type = 'button';
    detail.addEventListener('click', () => dispatch({ type: 'open_sheet', sheet: 'detail' }));
    panel.appendChild(detail);

    footer(panel, {
      nextLabel: 'Skip this one',
      enabled: true,
      onNext: () => {
        dispatch({ type: 'skip_question' });
        live.textContent = 'Question skipped';
      },
    });

    const stop = el('button', 'linkish linkish--quiet', 'Stop and show what you have');
    stop.type = 'button';
    stop.addEventListener('click', () => { state = resolve(state); render(true); });
    panel.appendChild(stop);
  }

  /* ---- D) OutcomeCardsStack + RedFlagCard ---- */
  function outcome(panel) {
    const o = state.outcome;

    if (o.status === 'needs_detail') {
      header(panel, labelFor(state.region), o.headline);
      o.questions.forEach(q => {
        const box = el('div', 'card');
        box.appendChild(el('h3', 'card__head', promptFor(q, state.triage)));
        const row = el('div', 'choices choices--row');
        q.options.forEach(opt => {
          const b = el('button', 'choice', opt);
          b.type = 'button';
          b.addEventListener('click', () => pulse(b));
          row.appendChild(b);
        });
        box.appendChild(row);
        panel.appendChild(box);
      });
      footer(panel, { nextLabel: 'Start over', onNext: () => dispatch({ type: 'restart' }), back: false });
      return;
    }

    header(panel, o.region_label, o.red_flag_present ? 'Act on this today' : 'What your answers point at');

    const stack = el('div', 'cards');

    if (o.red_flag_present) stack.appendChild(redFlagCard(o.red_flag));

    stack.appendChild(card({
      severity: o.red_flag_present ? 'none' : 'soon',
      head: 'Likely causes, in order',
      items: o.ranked_categories.slice(0, 5).map(c => ({ term: c.label, note: c.note })),
      action: 'See what would change my ranking',
      onAction: () => dispatch({ type: 'show_refinement' }),
    }));

    if (o.helps && o.helps.length) {
      stack.appendChild(card({
        severity: 'none',
        head: 'What actually helps',
        items: o.helps.slice(0, 5),
        action: 'Track this symptom',
        onAction: () => dispatch({ type: 'open_sheet', sheet: 'track' }),
      }));
    }

    stack.appendChild(card({
      severity: 'none',
      head: 'What you can check at home',
      items: o.self_checks.slice(0, 5),
      action: o.moreQuestions ? 'Answer a few more questions' : 'See what would change my ranking',
      onAction: () => dispatch({ type: o.moreQuestions ? 'more_questions' : 'show_refinement' }),
    }));

    if (!o.red_flag_present) {
      stack.appendChild(card({
        severity: 'none',
        head: 'Nothing here needs urgent care',
        items: [
          `None of the ${o.answered} answers matched a pattern that needs seeing today.`,
          'Come back if it wakes you at night, spreads, or stops easing.',
          'Come back sooner if a fever, weakness, or numbness appears.',
        ],
        action: 'See what would change my ranking',
        onAction: () => dispatch({ type: 'show_refinement' }),
      }));
    }

    panel.appendChild(stack);
    footer(panel, { nextLabel: 'Start over', onNext: () => dispatch({ type: 'restart' }) });
  }

  function card({ severity, head, items, action, onAction }) {
    const c = el('article', 'card');
    if (severity && severity !== 'none') c.dataset.severity = severity;
    c.appendChild(el('h3', 'card__head', head));
    const ul = el('ul', 'card__list');
    items.forEach(t => {
      const li = el('li');
      /* An item can be a plain sentence or a name with an explanation. The
         second kind gets the name set apart, because comma-splicing a label
         onto a sentence reads as one run-on line. */
      if (typeof t === 'object' && t !== null) {
        li.append(el('b', 'card__term', t.term), el('span', null, t.note));
      } else {
        li.textContent = t;
      }
      ul.appendChild(li);
    });
    c.appendChild(ul);
    const b = el('button', 'btn btn--quiet card__action', action);
    b.type = 'button';
    b.addEventListener('click', onAction);
    c.appendChild(b);
    return c;
  }

  function redFlagCard(flag) {
    const c = el('article', 'card card--flag');
    c.dataset.severity = 'now';
    c.dataset.critical = '';
    c.setAttribute('role', 'alert');
    c.appendChild(el('p', 'label', 'Red flag'));
    c.appendChild(el('h3', 'card__head', flag.headline));
    const ul = el('ul', 'card__list');
    flag.lines.forEach(t => ul.appendChild(el('li', null, t)));
    c.appendChild(ul);
    const b = el('button', 'btn btn--urgent', flag.action_label);
    b.type = 'button';
    b.addEventListener('click', () => dispatch({ type: 'open_sheet', sheet: 'urgent' }));
    c.appendChild(b);

    /* On a long result the flag can land below the fold, where the one card
       that had to be read is the one nobody sees. Focus is left alone: the
       alert role announces it, and taking focus would move the caret out
       from under someone mid-answer. */
    requestAnimationFrame(() => {
      if (!c.isConnected) return;
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches
        || document.documentElement.dataset.motion === 'reduced';
      c.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    });
    return c;
  }

  /* ---- E) RefinementPanel ---- */
  function refinement(panel) {
    header(panel, state.outcome.region_label, 'Why it is ranked this way');
    const list = el('ul', 'reasons');
    state.outcome.reasons.forEach(r => list.appendChild(el('li', null, r)));
    panel.appendChild(list);

    if (state.outcome.basis) {
      const basis = el('div', 'card');
      basis.append(
        el('p', 'label', 'Where the questions come from'),
        el('p', null, state.outcome.basis),
      );
      panel.appendChild(basis);
    }
    footer(panel, {
      nextLabel: 'Back to result',
      onNext: () => dispatch({ type: 'close_refinement' }),
      back: false,
    });
  }

  /* ---- BodyRegionBottomSheet and friends ---- */

  /* What had focus when a sheet opened, so it can be handed back on close.
     Stored by identity, not by node: opening a sheet re-renders the stage, so
     the element that was focused has usually been replaced by the time the
     sheet closes and a node reference would be stale. */
  let focusBeforeSheet = null;
  let lastFocusMemo = null;

  function rememberFocus() {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const zone = a.closest?.('.zone');
    if (zone?.dataset.region) return { region: zone.dataset.region };
    return { node: a };
  }

  function restoreFocus(memo) {
    requestAnimationFrame(() => {
      let target = null;
      if (memo?.region) target = stageHost.querySelector(`.zone[data-region="${memo.region}"]`);
      else if (memo?.node?.isConnected) target = memo.node;
      // Never leave focus on the document: fall back to the step's own action.
      target = target
        ?? stageHost.querySelector('.stage__next:not(:disabled)')
        ?? stageHost.querySelector('button:not(:disabled)');
      target?.focus();
    });
  }

  function drawSheet() {
    if (!state.sheet) {
      sheetHost.replaceChildren();
      sheetHost.hidden = true;
      if (focusBeforeSheet) {
        const memo = focusBeforeSheet;
        focusBeforeSheet = null;
        restoreFocus(memo);
      }
      return;
    }
    if (!focusBeforeSheet) focusBeforeSheet = rememberFocus() ?? lastFocusMemo;
    sheetHost.hidden = false;

    const scrim = el('div', 'scrim');
    scrim.addEventListener('click', () => dispatch({ type: 'close_sheet' }));

    const sheet = el('div', 'sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');

    /* A dialog closes on Escape and keeps the tab loop inside itself. Both
       are assumed by anyone driving this without a pointer. */
    sheet.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        dispatch({ type: 'close_sheet' });
        return;
      }
      if (ev.key !== 'Tab') return;
      const stops = [...sheet.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(e => !e.disabled && e.getBoundingClientRect().width > 0);
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    });

    ({
      region: () => {
        sheet.setAttribute('aria-label', labelFor(state.region));
        // Focus the primary action so Enter carries straight on.
        requestAnimationFrame(() => sheet.querySelector('.sheet__go')?.focus());
        sheet.appendChild(el('p', 'label', labelFor(state.region)));
        sheet.appendChild(el('h3', 'sheet__head', 'Pain here can mean different things'));
        const go = el('button', 'btn sheet__go', 'Continue');
        go.type = 'button';
        go.addEventListener('click', () => dispatch({ type: 'advance' }));
        sheet.appendChild(go);
      },
      detail: () => {
        sheet.setAttribute('aria-label', 'Add detail');
        sheet.appendChild(el('h3', 'sheet__head', 'Any trigger?'));
        const field = el('input', 'field');
        field.type = 'text';
        field.value = state.detail;
        field.placeholder = 'Cold, stress, food, workout, poor sleep';
        field.setAttribute('aria-label', 'Any trigger');
        sheet.appendChild(field);
        const go = el('button', 'btn sheet__go', 'Save');
        go.type = 'button';
        go.addEventListener('click', () => dispatch({ type: 'submit_detail', text: field.value.trim() }));
        sheet.appendChild(go);
        requestAnimationFrame(() => field.focus());
      },
      track: () => {
        sheet.setAttribute('aria-label', 'Track this symptom');
        const existing = openEpisodes().find(e => e.region === state.region);

        if (existing) {
          /* Already watching this spot. Adding a second record for the same
             thing splits the history in half and neither half is useful. */
          const since = new Date(existing.startedAt).toLocaleDateString();
          sheet.appendChild(el('h3', 'sheet__head', 'You are already tracking this'));
          sheet.appendChild(el('p', 'sheet__note',
            `${labelFor(state.region)} has been tracked since ${since}, with `
            + `${existing.readings.length} reading${existing.readings.length === 1 ? '' : 's'}. `
            + 'Adding today to that record keeps the history in one place.'));
          const add = el('button', 'btn sheet__go', "Add today's reading");
          add.type = 'button';
          add.addEventListener('click', () => {
            addReading(existing.id, { intensity: state.intensity, note: '', flags: [] });
            saveChain(state, '');
            live.textContent = 'Reading added';
            dispatch({ type: 'close_sheet' });
            location.hash = `#/track/pain/${existing.id}`;
          });
          const view = el('button', 'btn btn--quiet sheet__go', 'Open the record instead');
          view.type = 'button';
          view.addEventListener('click', () => {
            dispatch({ type: 'close_sheet' });
            location.hash = `#/track/pain/${existing.id}`;
          });
          sheet.append(add, view);
          return;
        }

        sheet.appendChild(el('h3', 'sheet__head', 'Start tracking this'));
        sheet.appendChild(el('p', 'sheet__note',
          'This becomes a record you add readings to over the coming days, so '
          + 'you can see whether it is settling. Today’s answers are the '
          + 'first reading. Saved on this device only.'));
        const note = el('input', 'field');
        note.type = 'text';
        note.placeholder = 'What were you doing when it started';
        note.setAttribute('aria-label', 'Note');
        sheet.appendChild(note);
        const go = el('button', 'btn sheet__go', 'Start tracking');
        go.type = 'button';
        go.addEventListener('click', () => {
          let ep = null;
          try {
            ep = startEpisode({
              region: state.region,
              regionLabel: labelFor(state.region),
              painTypes: state.painTypes,
              intensity: state.intensity,
              outcome: state.outcome,
              note: note.value.trim(),
            });
            saveChain(state, note.value.trim());
          } catch (err) {
            live.textContent = 'Could not save';
            sheet.appendChild(el('p', 'sheet__note', 'Could not save to this device. Storage may be full or blocked.'));
            return;
          }
          live.textContent = 'Tracking started';
          dispatch({ type: 'close_sheet' });
          // Leave for the record, so it is obvious what was created.
          location.hash = `#/track/pain/${ep.id}`;
        });
        sheet.appendChild(go);
      },

      urgent: () => {
        sheet.setAttribute('aria-label', 'Get urgent help');
        sheet.dataset.critical = '';
        sheet.appendChild(el('h3', 'sheet__head', 'Go now. Do not drive yourself.'));

        /* The number to dial is the whole point of this sheet. It comes from
           the place already chosen for weather, falling back to the country
           in Settings, and says so plainly when neither names a country the
           table covers. */
        const place = savedPlace();
        const iso = place?.iso ?? isoForSetting(settings.get().country);
        const line = emergencyLine(iso, place?.country);

        if (line.known) {
          const dial = el('a', 'btn btn--urgent sheet__call', `Call ${line.call}`);
          dial.href = `tel:${line.call}`;
          dial.setAttribute('lang', 'en');
          dial.setAttribute('translate', 'no');
          sheet.appendChild(dial);
          if (line.also) {
            sheet.appendChild(el('p', 'hint', `${line.also} reaches the same service.`));
          }
        } else {
          sheet.appendChild(el('p', 'sheet__nonumber', line.text));
        }

        sheet.appendChild(el('p', 'label', 'What to say'));
        const ul = el('ul', 'card__list');
        ['Say when it started and where it started.',
         'Say what you were doing at the time.',
         'Bring any temperature readings and today\'s medications.',
        ].forEach(t => ul.appendChild(el('li', null, t)));
        sheet.appendChild(ul);
        const go = el('button', 'btn btn--quiet sheet__go', 'Close');
        go.type = 'button';
        go.addEventListener('click', () => dispatch({ type: 'close_sheet' }));
        sheet.appendChild(go);
      },
    })[state.sheet]();

    sheetHost.replaceChildren(scrim, sheet);
    requestAnimationFrame(() => sheet.classList.add('sheet--in'));
  }

  render(false);
  return { dispatch, getState: () => state };
}

/* A tap gets an acknowledgement that costs one compositor frame. */
function pulse(node) {
  node.classList.remove('pulse');
  void node.offsetWidth;
  node.classList.add('pulse');
}

/* The scan itself, kept alongside the episode. IndexedDB lands with the
 * storage layer; this writes the same record shape in the meantime.
 */
function saveChain(s, note) {
  const record = {
    saved_at: new Date().toISOString(),
    body_region_id: s.region,
    region_label: REGIONS[s.region]?.label ?? s.region,
    pain_type_ids: s.painTypes,
    intensity: s.intensity,
    // The triage session holds the answers now.
    context_answer_ids: Object.values(s.triage?.answers ?? {}).filter(Boolean),
    questions_asked: s.triage?.asked ?? [],
    red_flag_trigger_ids: s.outcome?.red_flag ? [s.outcome.red_flag.trigger_id] : [],
    points: s.points,
    note,
  };
  const key = 'vitals.symptom_sessions';
  try {
    const all = JSON.parse(localStorage.getItem(key) ?? '[]');
    all.push(record);
    localStorage.setItem(key, JSON.stringify(all));
  } catch {
    // A full or blocked store must not take the flow down with it.
  }
  return record;
}

