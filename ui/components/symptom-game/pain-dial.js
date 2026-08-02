/* PainDial: pain types arranged on a ring instead of stacked in a list.
 *
 * The centre holds the body region already chosen, so the question and its
 * subject stay on screen together. Each type is a wedge on the ring. Tapping
 * lights it; tapping again puts it out. Arrow keys walk the ring, so it is
 * fully operable from a keyboard.
 *
 * Geometry is plain trigonometry against a 200 unit square. Nothing here
 * measures the DOM, so it costs the same on a cheap phone as an expensive one.
 */

const NS = 'http://www.w3.org/2000/svg';
const SIZE = 200;
const CX = SIZE / 2, CY = SIZE / 2;
const R_OUT = 98;
const R_IN = 52;
const GAP = 1.6; // degrees trimmed from each wedge, to separate the segments

const rad = deg => (deg - 90) * Math.PI / 180;
const px = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];

/** An annular wedge between two angles. */
function wedgePath(a0, a1) {
  const s0 = a0 + GAP, s1 = a1 - GAP;
  const [x0, y0] = px(R_OUT, s0);
  const [x1, y1] = px(R_OUT, s1);
  const [x2, y2] = px(R_IN, s1);
  const [x3, y3] = px(R_IN, s0);
  const large = s1 - s0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${R_OUT} ${R_OUT} 0 ${large} 1 ${x1} ${y1}`
       + `L${x2} ${y2}A${R_IN} ${R_IN} 0 ${large} 0 ${x3} ${y3}Z`;
}

/**
 * @param {object} opts
 * @param {Array<{id,label,glyph}>} opts.types
 * @param {string[]} opts.selected
 * @param {string} opts.centreLabel  region name shown in the middle
 * @param {(id:string)=>void} opts.onToggle
 * @returns {HTMLElement}
 */
export function renderPainDial({ types, selected, centreLabel, onToggle }) {
  const wrap = document.createElement('div');
  wrap.className = 'dial';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('class', 'dial__svg');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', 'Pain type');

  // Two faint guide circles. They read as an instrument bezel and they give
  // the wedges an edge to sit against.
  for (const r of [R_OUT, R_IN]) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', r);
    c.setAttribute('class', 'dial__bezel');
    svg.appendChild(c);
  }

  const step = 360 / types.length;
  const nodes = [];

  types.forEach((t, i) => {
    const a0 = i * step, a1 = (i + 1) * step;
    const on = selected.includes(t.id);

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'dial__seg');
    g.dataset.pain = t.id;
    g.setAttribute('role', 'button');
    g.setAttribute('tabindex', i === 0 ? '0' : '-1');
    g.setAttribute('aria-pressed', String(on));
    g.setAttribute('aria-label', t.label);
    if (on) g.classList.add('selected');

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', wedgePath(a0, a1));
    path.setAttribute('class', 'dial__wedge');
    g.appendChild(path);

    // The label runs along its own wedge, which is the only way twelve of
    // them fit a ring without colliding. Anything past the halfway point of
    // the circle gets flipped so no word ends up upside down.
    const mid = (a0 + a1) / 2;
    /* On a crowded ring the ends of neighbouring labels meet and read as one
       long word. Alternating the radius by a few units pulls them apart
       without shrinking the type. */
    const stagger = types.length > 8 ? (i % 2 ? 4 : -4) : 0;
    const rLabel = (R_OUT + R_IN) / 2 - 2 + stagger;
    const [lx, ly] = px(rLabel, mid);
    const flip = mid > 90 && mid < 270;
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', lx);
    label.setAttribute('y', ly);
    label.setAttribute('class', 'dial__label');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('transform', `rotate(${mid + (flip ? 180 : 0)} ${lx} ${ly})`);
    label.textContent = t.label;
    g.appendChild(label);

    // The glyph sits in the outer band, upright at every angle, because a
    // rotated symbol stops being recognisable.
    const [gx, gy] = px(R_OUT - 9, mid);
    const glyph = document.createElementNS(NS, 'text');
    glyph.setAttribute('x', gx);
    glyph.setAttribute('y', gy);
    glyph.setAttribute('class', 'dial__glyph');
    glyph.setAttribute('text-anchor', 'middle');
    glyph.setAttribute('dominant-baseline', 'central');
    glyph.textContent = t.glyph;
    g.appendChild(glyph);

    const fire = ev => { ev.preventDefault(); onToggle(t.id); };
    g.addEventListener('click', fire);
    g.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') return fire(ev);
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!dir) return;
      ev.preventDefault();
      const next = nodes[(i + dir + nodes.length) % nodes.length];
      nodes.forEach(n => n.setAttribute('tabindex', '-1'));
      next.setAttribute('tabindex', '0');
      next.focus();
    });

    svg.appendChild(g);
    nodes.push(g);
  });

  // Centre: the region under investigation, plus a running count.
  const hub = document.createElementNS(NS, 'circle');
  hub.setAttribute('cx', CX); hub.setAttribute('cy', CY);
  hub.setAttribute('r', R_IN - 6);
  hub.setAttribute('class', 'dial__hub');
  svg.appendChild(hub);

  /* The hub is a circle, so the label has to be wrapped to fit rather than
     truncated. Region names run up to four words, and dropping the last one
     loses the part that matters: "Lower left abdomen" must not read as
     "Lower left". Lines are packed to a character budget, then the type
     shrinks as the line count grows. */
  const HUB_CHARS = 11;
  const lines = [];
  for (const word of String(centreLabel).split(' ')) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= HUB_CHARS) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  const hubSize = lines.length >= 3 ? 7.5 : lines.length === 2 ? 9 : 11;
  const lineGap = hubSize + 2.5;
  const top = CY - 6 - ((lines.length - 1) * lineGap) / 2;

  lines.forEach((line, i) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', CX);
    t.setAttribute('y', top + i * lineGap);
    t.setAttribute('class', 'dial__hubtext');
    t.setAttribute('font-size', String(hubSize));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.textContent = line;
    svg.appendChild(t);
  });

  const count = document.createElementNS(NS, 'text');
  count.setAttribute('x', CX);
  count.setAttribute('y', top + lines.length * lineGap + 6);
  count.setAttribute('class', 'dial__count');
  count.setAttribute('text-anchor', 'middle');
  count.setAttribute('dominant-baseline', 'central');
  count.textContent = selected.length ? `${selected.length} picked` : 'Tap a type';
  svg.appendChild(count);

  wrap.appendChild(svg);
  /* A staggered ring gives each label less clear radius, so the budget drops
     with it. */
  fitLabelsWhenMounted(svg, types.length > 8 ? 32 : 38);
  return wrap;
}

/**
 * Squeeze any label that outgrows its wedge.
 *
 * Wedge labels run radially, so their length is bounded by the width of the
 * band rather than by the arc. English sits close to that bound already and a
 * translation goes past it, so each label is measured once on screen and
 * compressed to the room it has. Short words are left alone: `textLength`
 * would otherwise stretch them across the whole band.
 *
 * Measuring needs layout, which a detached node does not have, hence the
 * wait for the mount.
 */
function fitLabelsWhenMounted(svg, room) {
  const fit = () => {
    if (!svg.isConnected) return;
    svg.querySelectorAll('.dial__label').forEach(label => {
      label.removeAttribute('textLength');
      let width = 0;
      try { width = label.getComputedTextLength(); } catch { return; }
      if (!width || width <= room) return;
      label.setAttribute('textLength', String(room));
      label.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    });
  };
  requestAnimationFrame(fit);

  /* Translation rewrites these labels in place, after the first measurement
     and by no single event this could listen for. Watching the text itself
     catches every path that changes it. Only character data and children are
     observed, so setting the length back does not retrigger this. */
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fit(); });
  });
  observer.observe(svg, { characterData: true, childList: true, subtree: true });
}

/**
 * Intensity as an arc.
 *
 * The arc is the control, not a picture of one. Pointer events are captured
 * on the whole gauge area and mapped to an angle, so a drag anywhere near
 * the arc works and a tap jumps straight to that value. An earlier version
 * floated a transparent range input on top; hits landed on it only some of
 * the time, which is what made the wheel feel broken.
 *
 * Keyboard and screen reader support come from role and aria on the gauge
 * itself, so there is one control rather than two disagreeing about state.
 */
export function renderIntensity({ value, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'gauge';

  const W = 220, H = 128, R = 88, CXg = W / 2, CYg = 108;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'gauge__svg');
  svg.setAttribute('role', 'slider');
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('aria-label', 'Pain intensity, 0 to 10');
  svg.setAttribute('aria-valuemin', '0');
  svg.setAttribute('aria-valuemax', '10');
  svg.setAttribute('touch-action', 'none');

  const point = (r, t) => {
    const a = Math.PI + t * Math.PI;
    return [CXg + r * Math.cos(a), CYg + r * Math.sin(a)];
  };
  const arcTo = (r, from, to) => {
    const [x0, y0] = point(r, from);
    const [x1, y1] = point(r, to);
    return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };

  // A fat transparent band under everything gives the pointer something
  // generous to land on without changing how the gauge looks.
  const band = document.createElementNS(NS, 'path');
  band.setAttribute('d', arcTo(R, 0, 1));
  band.setAttribute('class', 'gauge__band');
  svg.appendChild(band);

  const track = document.createElementNS(NS, 'path');
  track.setAttribute('d', arcTo(R, 0, 1));
  track.setAttribute('class', 'gauge__track');
  svg.appendChild(track);

  const fill = document.createElementNS(NS, 'path');
  fill.setAttribute('class', 'gauge__fill');
  svg.appendChild(fill);

  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const [x0, y0] = point(R - 10, t);
    const [x1, y1] = point(R - (i % 5 === 0 ? 18 : 14), t);
    const tick = document.createElementNS(NS, 'line');
    tick.setAttribute('x1', x0); tick.setAttribute('y1', y0);
    tick.setAttribute('x2', x1); tick.setAttribute('y2', y1);
    tick.setAttribute('class', 'gauge__tick');
    svg.appendChild(tick);
  }

  const knob = document.createElementNS(NS, 'circle');
  knob.setAttribute('r', '7');
  knob.setAttribute('class', 'gauge__knob');
  svg.appendChild(knob);

  const readout = document.createElement('div');
  readout.className = 'gauge__readout';
  const num = document.createElement('span');
  num.className = 'gauge__num';
  const word = document.createElement('span');
  word.className = 'gauge__word';

  const WORDS = ['None', 'Barely there', 'Mild', 'Mild', 'Noticeable',
    'Noticeable', 'Hard to ignore', 'Hard to ignore', 'Bad', 'Very bad', 'Worst yet'];

  let current = value;

  const paint = v => {
    const t = v / 10;
    fill.setAttribute('d', t <= 0 ? '' : arcTo(R, 0, Math.max(t, 0.001)));
    const [kx, ky] = point(R, t);
    knob.setAttribute('cx', kx);
    knob.setAttribute('cy', ky);
    num.textContent = String(v);
    word.textContent = WORDS[v];
    svg.setAttribute('aria-valuenow', String(v));
    svg.setAttribute('aria-valuetext', `${v} out of 10, ${WORDS[v]}`);
  };

  const set = v => {
    v = Math.min(10, Math.max(0, Math.round(v)));
    if (v === current) return;
    current = v;
    paint(v);
    onChange(v);
  };

  /* Screen point to a value on the half circle. Angles behind the gauge
     clamp to whichever end they are nearest, so a drag that wanders below
     the arc still tracks instead of jumping. */
  const valueFromEvent = ev => {
    const box = svg.getBoundingClientRect();
    const sx = (ev.clientX - box.left) / box.width * W;
    const sy = (ev.clientY - box.top) / box.height * H;
    const dx = sx - CXg;
    const dy = sy - CYg;
    let a = Math.atan2(dy, dx);          // 0 at the right, positive downward
    if (a > 0) a = dx < 0 ? Math.PI : 0; // below the baseline: clamp to an end
    const t = (a + Math.PI) / Math.PI;   // 0 at the left end, 1 at the right
    return t * 10;
  };

  let dragging = false;
  svg.addEventListener('pointerdown', ev => {
    dragging = true;
    svg.setPointerCapture(ev.pointerId);
    set(valueFromEvent(ev));
    ev.preventDefault();
  });
  svg.addEventListener('pointermove', ev => {
    if (!dragging) return;
    set(valueFromEvent(ev));
  });
  const stop = ev => {
    if (!dragging) return;
    dragging = false;
    try { svg.releasePointerCapture(ev.pointerId); } catch {}
  };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  svg.addEventListener('keydown', ev => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key];
    if (step) { set(current + step); ev.preventDefault(); return; }
    if (ev.key === 'Home') { set(0); ev.preventDefault(); }
    if (ev.key === 'End') { set(10); ev.preventDefault(); }
    if (ev.key === 'PageUp') { set(current + 2); ev.preventDefault(); }
    if (ev.key === 'PageDown') { set(current - 2); ev.preventDefault(); }
  });

  readout.append(num, word);
  wrap.append(svg, readout);
  paint(current);
  return wrap;
}
