/* Small builders shared by every screen. Nothing here holds state. */

export const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export function eyebrow(text) { return el('p', 'eyebrow', text); }

/**
 * The label above a form control. Reads at body size in the body face,
 * because it names something a person has to answer rather than decorating
 * a section. An optional unit sits after it in a lighter weight.
 */
export function fieldLabel(text, unit) {
  const l = el('span', 'field-label', text);
  if (unit) {
    l.appendChild(document.createTextNode(' '));
    l.appendChild(el('span', 'field-label__unit', unit));
  }
  return l;
}

export function panel(...kids) {
  const p = el('div', 'panel panel--ticked');
  p.append(...kids);
  return p;
}

export function button(label, cls, onClick) {
  const b = el('button', cls, label);
  b.type = 'button';
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/** A tappable list row with an optional trailing value and sub label. */
export function row(label, { end, sub, onClick, selected } = {}) {
  const r = el('button', 'row');
  r.type = 'button';
  const main = el('span');
  main.append(document.createTextNode(label));
  if (sub) main.appendChild(el('span', 'row__sub', sub));
  r.appendChild(main);
  if (end != null) r.appendChild(el('span', 'row__end', end));
  if (selected) r.setAttribute('aria-selected', 'true');
  if (onClick) r.addEventListener('click', onClick);
  return r;
}

export function rows(...kids) {
  const g = el('div', 'rows');
  g.append(...kids);
  return g;
}

/**
 * A ring gauge. Value and goal are plain numbers; the arc is a stroked
 * circle with a dash offset, so it animates on the compositor and needs no
 * per-frame maths.
 */
export function ring(value, goal, unit, label) {
  const NS = 'http://www.w3.org/2000/svg';
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const R = 42;
  const C = 2 * Math.PI * R;

  const wrap = el('div', 'ring');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');

  const track = document.createElementNS(NS, 'circle');
  track.setAttribute('cx', '50'); track.setAttribute('cy', '50'); track.setAttribute('r', R);
  track.setAttribute('class', 'ring__track');

  const arc = document.createElementNS(NS, 'circle');
  arc.setAttribute('cx', '50'); arc.setAttribute('cy', '50'); arc.setAttribute('r', R);
  arc.setAttribute('class', 'ring__arc');
  arc.setAttribute('stroke-dasharray', String(C));
  arc.setAttribute('stroke-dashoffset', String(C * (1 - pct)));

  svg.append(track, arc);
  wrap.appendChild(svg);

  const mid = el('div', 'ring__mid');
  mid.append(el('span', 'ring__val', String(value)), el('span', 'ring__unit', unit));
  wrap.appendChild(mid);

  const box = el('div', 'ringbox');
  box.append(wrap, el('p', 'eyebrow', label));
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', `${label}: ${value} of ${goal} ${unit}`);
  return box;
}

/** A stat tile for the home grid. */
export function tile(label, value, sub, onClick) {
  const t = el('button', 'tile2');
  t.type = 'button';
  t.append(
    el('span', 'eyebrow', label),
    el('span', 'tile2__val', value),
  );
  if (sub) t.appendChild(el('span', 'tile2__sub', sub));
  if (onClick) t.addEventListener('click', onClick);
  return t;
}

/** Segmented control. Returns the wrapper; caller keeps the value. */
export function segmented(options, value, onPick, ariaLabel, variant) {
  const g = el('div', variant === 'hud' ? 'views views--hud' : 'views');
  g.setAttribute('role', 'group');
  if (ariaLabel) g.setAttribute('aria-label', ariaLabel);
  g.style.gridTemplateColumns = `repeat(${options.length}, 1fr)`;
  options.forEach(o => {
    const b = el('button', null, o.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(o.id === value));
    b.addEventListener('click', () => onPick(o.id));
    g.appendChild(b);
  });
  return g;
}

/** A labelled switch built on a real checkbox, so it is keyboard native. */
export function toggle(label, checked, onChange, sub) {
  const wrap = el('label', 'switch');
  const input = el('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const text = el('span');
  text.append(document.createTextNode(label));
  if (sub) text.appendChild(el('span', 'row__sub', sub));
  wrap.append(input, text, el('i', 'switch__track'));
  return wrap;
}

/**
 * A list row whose tap deletes the entry, armed on the first press.
 *
 * A single tap on a whole row is easy to hit by accident, and these lists have
 * no undo. The first press turns the row into its own confirmation and states
 * what goes; the second press removes it. Moving focus away disarms it.
 *
 * @param {string} label
 * @param {{ sub?: string, end?: string, confirm?: string, onRemove: () => void }} opts
 */
export function removableRow(label, { sub, end: endText = '', confirm = 'Remove?', onRemove }) {
  const r = row(label, { sub, end: endText });
  const end = r.querySelector('.row__end');
  let armed = false;
  let timer = null;

  const disarm = () => {
    if (!armed) return;
    armed = false;
    clearTimeout(timer);
    delete r.dataset.armed;
    // The end slot often carries real data, so it goes back rather than blank.
    if (end) end.textContent = endText;
  };

  r.addEventListener('click', () => {
    if (armed) { onRemove(); return; }
    armed = true;
    r.dataset.armed = '1';
    if (end) end.textContent = confirm;
    r.setAttribute('aria-label', `${label}. Press again to remove.`);
    // A row left armed becomes a trap for the next tap, so it lapses.
    timer = setTimeout(disarm, 4000);
  });
  r.addEventListener('blur', disarm);
  r.addEventListener('pointerleave', disarm);
  return r;
}

/**
 * A number from a text field, or null when the field is empty or not numeric.
 *
 * `Number('')` is 0 and passes `Number.isFinite`, so an empty field reads as a
 * real zero unless it is checked separately.
 */
export function numberOrNull(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
