/* Tracked pain over time.
 *
 * The list shows open episodes. Opening one charts the readings, reports what
 * changed, and offers a single control to add today's number.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows } from '../app/ui.js';
import * as episodes from '../app/episodes.js';
import { FOLLOW_FLAGS, flagAdvice } from '../app/episodes.js';

const fmtDate = iso => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ---------- List ---------- */
export function renderEpisodes(screen, { go }) {
  const list = episodes.all();
  screen.appendChild(eyebrow('Tracked pain'));
  screen.appendChild(el('h1', null, 'What you are watching'));

  if (!list.length) {
    screen.appendChild(el('p', 'empty',
      'Nothing tracked yet. Finish a body scan and choose Track this symptom '
      + 'to start watching how it changes.'));
    screen.appendChild(button('Start a scan', 'btn btn--block', () => go('#/body')));
    return;
  }

  const running = list.filter(e => !e.closedAt);
  const closed = list.filter(e => e.closedAt);

  if (running.length) {
    screen.appendChild(rows(...running.map(e => {
      const a = episodes.analyse(e);
      return row(e.regionLabel ?? e.region, {
        end: a ? `${a.latest}/10` : '',
        sub: a ? `${a.count} readings, ${a.trend}` : 'No readings',
        onClick: () => go(`#/track/pain/${e.id}`),
      });
    })));
  }

  if (closed.length) {
    screen.appendChild(el('h2', null, 'Finished'));
    screen.appendChild(rows(...closed.map(e => row(e.regionLabel ?? e.region, {
      end: fmtDate(e.closedAt),
      sub: `Started ${fmtDate(e.startedAt)}`,
      onClick: () => go(`#/track/pain/${e.id}`),
    }))));
  }

  const why = panel(
    eyebrow('Why bother'),
    el('p', null,
      'A doctor gets more from "it was 7 for four days and is 4 now, and it '
      + 'stopped waking me on Tuesday" than from "it hurts a lot". Two weeks '
      + 'of numbers is the most useful thing you can bring to an appointment.'),
  );
  why.style.marginBlockStart = 'var(--s-6)';
  screen.appendChild(why);
}

/* ---------- One episode ---------- */
export function renderEpisode(id) {
  return function render(screen, { go, live }) {
    const draw = () => {
      screen.replaceChildren();
      const e = episodes.get(id);
      if (!e) {
        screen.appendChild(el('p', 'empty', 'That entry is no longer here.'));
        screen.appendChild(button('Back to tracked pain', 'btn btn--block', () => go('#/track/pain')));
        return;
      }
      const a = episodes.analyse(e);

      screen.appendChild(eyebrow(`Started ${fmtDate(e.startedAt)}`));
      screen.appendChild(el('h1', null, e.regionLabel ?? e.region));

      /* The chart. Position carries the trend; the numbers are printed
         underneath so it never relies on reading a slope. */
      if (a && a.count >= 2) {
        screen.appendChild(chart(e));
      }

      const head = panel(
        eyebrow(a ? `Now ${a.latest} out of 10` : 'No readings'),
        el('p', null, a ? a.summary : 'Add a reading to start the chart.'),
      );
      if (a?.trend === 'worsening') head.dataset.severity = 'soon';
      screen.appendChild(head);

      if (a?.newFlags.length) {
        const advice = flagAdvice(a.newFlags);
        const box = panel(
          eyebrow('Something changed since this started'),
          el('p', null, a.newFlags
            .map(f => FOLLOW_FLAGS.find(x => x.id === f)?.label ?? f)
            .join('. ') + '.'),
          el('p', null, advice.line),
        );
        box.dataset.severity = advice.urgency;
        box.style.marginBlockStart = 'var(--s-3)';
        screen.appendChild(box);
      }

      if (!e.closedAt) {
        screen.appendChild(el('h2', null, "Add today's reading"));
        screen.appendChild(readingForm(e, () => { live.textContent = 'Reading added'; draw(); }));
      }

      screen.appendChild(el('h2', null, 'Readings'));
      screen.appendChild(rows(...e.readings.slice().reverse().map(r => {
        const flags = (r.flags ?? []).map(f => FOLLOW_FLAGS.find(x => x.id === f)?.label ?? f);
        return row(`${r.intensity} out of 10`, {
          end: fmtDate(r.at),
          sub: [fmtTime(r.at), r.note, ...flags].filter(Boolean).join(' · '),
          onClick: () => {},
        });
      })));

      if (e.openingCauses?.length) {
        const opening = panel(
          eyebrow('What the first scan said'),
          el('p', null, e.openingCauses.join(', ') + '.'),
          el('p', null,
            'Kept so you can see whether the picture has changed. If the pattern '
            + 'no longer matches, run the scan again rather than assuming the '
            + 'first answer still holds.'),
          button('Run the scan again', 'btn btn--quiet btn--block', () => go('#/body')),
        );
        opening.style.marginBlockStart = 'var(--s-5)';
        screen.appendChild(opening);
      }

      const actions = el('div', 'stack');
      actions.style.marginBlockStart = 'var(--s-5)';
      if (e.closedAt) {
        actions.appendChild(button('Start watching again', 'btn btn--quiet btn--block', () => {
          episodes.reopen(id); draw();
        }));
      } else {
        actions.appendChild(button('This has settled, stop tracking', 'btn btn--quiet btn--block', () => {
          episodes.close(id, 'resolved');
          live.textContent = 'Stopped tracking';
          draw();
        }));
      }
      actions.appendChild(button('Delete this record', 'btn btn--danger btn--block', () => {
        const ok = confirm(
          `Delete every reading for ${e.regionLabel ?? e.region}? `
          + `That is ${e.readings.length} entries and cannot be undone.`);
        if (!ok) return;
        episodes.remove(id);
        go('#/track/pain');
      }));
      screen.appendChild(actions);
    };
    draw();
  };
}

/* A reading is a number and, optionally, what changed. */
function readingForm(e, done) {
  const wrap = el('div', 'reading');
  let value = e.readings.at(-1)?.intensity ?? 5;
  const picked = new Set();

  const scale = el('div', 'scale');
  scale.setAttribute('role', 'group');
  scale.setAttribute('aria-label', 'Pain now, 0 to 10');
  const buttons = [];
  for (let i = 0; i <= 10; i++) {
    const b = el('button', 'scale__step', String(i));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(i === value));
    b.addEventListener('click', () => {
      value = i;
      buttons.forEach((x, n) => x.setAttribute('aria-pressed', String(n === i)));
    });
    scale.appendChild(b);
    buttons.push(b);
  }
  wrap.append(fieldLabel('How bad right now'), scale);

  wrap.appendChild(fieldLabel('Anything new since it started'));
  const flags = el('div', 'chiprow');
  FOLLOW_FLAGS.forEach(f => {
    const b = button(f.label, 'chipbtn', () => {
      if (picked.has(f.id)) { picked.delete(f.id); b.dataset.on = '0'; }
      else { picked.add(f.id); b.dataset.on = '1'; }
    });
    flags.appendChild(b);
  });
  wrap.appendChild(flags);

  const note = el('input', 'field');
  note.placeholder = 'What were you doing, what helped';
  note.setAttribute('aria-label', 'Note');
  wrap.appendChild(note);

  wrap.appendChild(button('Save reading', 'btn btn--block', () => {
    episodes.addReading(e.id, { intensity: value, note: note.value.trim(), flags: [...picked] });
    done();
  }));
  return wrap;
}

/* A line chart drawn from the readings. No library, no axis labels beyond
   the two that matter. */
function chart(e) {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 100, H = 34;
  const pts = episodes.chartPoints(e, W, H);
  const box = el('div', 'painchart');

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('class', 'painchart__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    'Pain readings over time: ' + e.readings.map(r => r.intensity).join(', '));

  // A line at 5 gives the eye something to judge against.
  const mid = document.createElementNS(NS, 'line');
  mid.setAttribute('x1', 0); mid.setAttribute('x2', W);
  mid.setAttribute('y1', H / 2); mid.setAttribute('y2', H / 2);
  mid.setAttribute('class', 'painchart__mid');
  svg.appendChild(mid);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
  path.setAttribute('class', 'painchart__line');
  svg.appendChild(path);

  pts.forEach(p => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 1.6);
    c.setAttribute('class', 'painchart__dot');
    svg.appendChild(c);
  });

  box.appendChild(svg);

  /* Both ends carry the same date until an episode has run past a day, which
     reads as a broken axis. Show clock times in that case, since that is what
     actually separates the readings. */
  const first = e.readings[0].at;
  const last = e.readings.at(-1).at;
  const timed = episodes.chartIsTimed(e);
  const sameDay = new Date(first).toDateString() === new Date(last).toDateString();
  const stamp = at => (sameDay
    ? new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : fmtDate(at));

  const scale = el('div', 'painchart__axis');
  scale.append(
    el('span', null, stamp(first)),
    el('span', null, `peak ${Math.max(...e.readings.map(r => r.intensity))}`),
    el('span', null, e.readings.length > 1 ? stamp(last) : ''),
  );
  box.appendChild(scale);

  if (!timed && e.readings.length > 1) {
    box.appendChild(el('p', 'hint',
      'Readings are spaced evenly here. They are too close together in time to '
      + 'plot against the clock, and the shape spreads out as the days go on.'));
  }
  return box;
}
