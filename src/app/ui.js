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

  /* Only the number goes inside. A circle is the worst container for a word
     whose length changes with the language: the usable width at the unit's
     own height is narrower than the ring looks, so anything longer than a few
     characters crosses the stroke. The unit sits under the ring instead,
     where it can be as long as it needs to be. */
  const mid = el('div', 'ring__mid');
  mid.append(el('span', 'ring__val', String(value)));
  wrap.appendChild(mid);

  const box = el('div', 'ringbox');
  box.append(wrap, el('p', 'ring__unit', unit), el('p', 'ring__label', label));
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

/**
 * Let a pointer drag a horizontal strip sideways.
 *
 * Touch gets this from the platform and a wheel works on a trackpad, but a
 * mouse has neither: the strip looks draggable and does nothing. One
 * delegated listener covers every strip on the page, including ones rendered
 * later, so nothing has to be wired up per screen.
 *
 * @param {HTMLElement} root
 */
export function enableDragScroll(root) {
  let target = null;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  const scrollerAt = node => {
    for (let el = node; el && el !== root.parentElement; el = el.parentElement) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === 'auto' || overflow === 'scroll') return el;
    }
    return null;
  };

  root.addEventListener('pointerdown', ev => {
    // Touch already scrolls by itself, and a second handler fights it.
    if (ev.pointerType === 'touch' || ev.button !== 0) return;
    const el = scrollerAt(ev.target);
    if (!el) return;
    target = el;
    startX = ev.clientX;
    startScroll = el.scrollLeft;
    moved = false;
  });

  root.addEventListener('pointermove', ev => {
    if (!target) return;
    const dx = ev.clientX - startX;
    // A few pixels of slop, so a press that wanders slightly is still a tap.
    if (!moved && Math.abs(dx) < 4) return;
    moved = true;
    target.dataset.dragging = 'on';
    target.scrollLeft = startScroll - dx;
    ev.preventDefault();
  });

  const end = () => {
    if (target) delete target.dataset.dragging;
    target = null;
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('pointerleave', end);

  /* A drag that ends over a button would otherwise activate it. The click
     fires after pointerup, so it is swallowed once in the capture phase. */
  root.addEventListener('click', ev => {
    if (!moved) return;
    moved = false;
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
}

/**
 * Let a grid be rearranged by holding an item and dragging it.
 *
 * The hold is what separates this from a scroll. A press has to stay put for
 * HOLD_MS before anything picks up, and any real movement in that window
 * cancels it, so dragging a finger down the screen never disturbs the layout.
 * Once an item is up, touch scrolling is suppressed for the rest of the
 * gesture, since the finger now belongs to the drag.
 *
 * Dragging is a pointer gesture and nothing else, so there is a keyboard route
 * as well: focus an item and press shift with an arrow key.
 *
 * @param {HTMLElement} grid
 * @param {object} opts
 * @param {(ids: string[]) => void} opts.onReorder called with the new order
 * @param {HTMLElement} [opts.live] live region for announcements
 * @param {(el: HTMLElement) => string} [opts.describe] names an item out loud
 */
export function reorderable(grid, { onReorder, live, describe } = {}) {
  const HOLD_MS = 450;
  const SLOP = 8;          // movement that means a scroll rather than a hold
  const items = () => [...grid.querySelectorAll('[data-tile]')];
  const name = node => (describe ? describe(node) : node.dataset.tile);
  const say = text => { if (live) live.textContent = text; };
  const commit = () => onReorder?.(items().map(n => n.dataset.tile));

  let held = null;         // the item being dragged
  let timer = null;
  let startX = 0, startY = 0;
  let originX = 0, originY = 0;
  let dragging = false;

  const cancelHold = () => { clearTimeout(timer); timer = null; };

  const lift = node => {
    dragging = true;
    held = node;
    node.dataset.held = 'on';
    grid.dataset.arranging = 'on';
    // A short buzz is the whole reason a phone drag feels like a phone drag.
    navigator.vibrate?.(12);
    say(`${name(node)} picked up. Drag to move it.`);
  };

  const drop = () => {
    cancelHold();
    if (held) {
      held.style.transform = '';
      delete held.dataset.held;
      say(`${name(held)} dropped.`);
      commit();
    }
    delete grid.dataset.arranging;
    held = null;
    dragging = false;
  };

  grid.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const node = ev.target.closest('[data-tile]');
    if (!node || !grid.contains(node)) return;
    /* Cleared here rather than only when a click arrives. A drag does not
       always produce one, and a flag left behind swallows the next real tap. */
    delete grid.dataset.wasDragged;
    startX = ev.clientX; startY = ev.clientY;
    originX = ev.clientX; originY = ev.clientY;
    cancelHold();
    timer = setTimeout(() => {
      lift(node);
      // Captured late, so the press behaves normally until the hold completes.
      try { node.setPointerCapture(ev.pointerId); } catch {}
    }, HOLD_MS);
  });

  grid.addEventListener('pointermove', ev => {
    if (!dragging) {
      // Movement before the hold completes means the intent was to scroll.
      if (timer && Math.hypot(ev.clientX - startX, ev.clientY - startY) > SLOP) cancelHold();
      return;
    }
    ev.preventDefault();
    held.style.transform =
      `translate(${ev.clientX - originX}px, ${ev.clientY - originY}px)`;

    /* The held item is transparent to hit testing while up, so this finds the
       item underneath the finger rather than the one in hand. */
    const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-tile]');
    if (!under || under === held || !grid.contains(under)) return;

    const box = under.getBoundingClientRect();
    const list = items();
    const after = list.indexOf(under) > list.indexOf(held);
    const past = after
      ? ev.clientX > box.left + box.width / 2 || ev.clientY > box.top + box.height / 2
      : ev.clientX < box.left + box.width / 2 || ev.clientY < box.top + box.height / 2;
    if (!past) return;

    /* Moving the node shifts everything under the pointer, so the offset the
       transform is measured from moves with it. */
    const before = held.getBoundingClientRect();
    grid.insertBefore(held, after ? under.nextSibling : under);
    const now = held.getBoundingClientRect();
    originX += now.left - before.left;
    originY += now.top - before.top;
    held.style.transform =
      `translate(${ev.clientX - originX}px, ${ev.clientY - originY}px)`;
  });

  for (const type of ['pointerup', 'pointercancel']) {
    grid.addEventListener(type, () => { if (dragging) drop(); else cancelHold(); });
  }
  grid.addEventListener('pointerleave', () => { if (!dragging) cancelHold(); });

  /* Touch scrolling has to stop once an item is up, and touch-action cannot be
     changed part way through a gesture, so the scroll is refused directly. */
  grid.addEventListener('touchmove', ev => {
    if (dragging) ev.preventDefault();
  }, { passive: false });

  /* A press that became a drag must not also count as a tap on the tile. */
  grid.addEventListener('click', ev => {
    if (!grid.dataset.wasDragged) return;
    delete grid.dataset.wasDragged;
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
  grid.addEventListener('pointerup', () => {
    if (dragging) grid.dataset.wasDragged = 'yes';
  }, true);

  grid.addEventListener('keydown', ev => {
    if (!ev.shiftKey) return;
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[ev.key];
    if (!step) return;
    const node = ev.target.closest('[data-tile]');
    if (!node) return;
    const list = items();
    const to = list.indexOf(node) + step;
    if (to < 0 || to >= list.length) return;
    ev.preventDefault();
    grid.insertBefore(node, step > 0 ? list[to].nextSibling : list[to]);
    node.focus();
    say(`${name(node)} moved to position ${to + 1} of ${list.length}.`);
    commit();
  });
}
