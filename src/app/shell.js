/* App shell: status strip, screen host, tab bar, hash router.
 *
 * Routes are path shaped under a hash so a static host needs no rewrite
 * rules and a mobile wrapper reads the same strings. One history stack, so
 * the platform back gesture behaves the way people expect.
 */

import { SCREENS, TABS, resolveRoute } from './routes.js';
import { onWriteError } from './store.js';
import * as i18n from '../i18n/index.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* Icons are drawn, not fetched. Thin strokes match the hairline chrome and
   inherit currentColor so the active tab needs no second asset. */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M6 9.5V21h12V9.5',
  body: 'M12 3a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 3ZM8 8.5h8M12 8v6m0 0-3 7m3-7 3 7M8.5 8.5 7 15m9.5-6.5L18 15',
  track: 'M4 19V9m5 10V5m5 14v-7m5 7V8',
  learn: 'M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2Zm2 12.5h13',
  you: 'M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20.5a7.5 7.5 0 0 1 15 0',
};

function icon(name) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', ICONS[name] ?? ICONS.home);
  svg.appendChild(p);
  return svg;
}

const ROOT = '#/home';

export function boot(mountPoint) {
  i18n.init();
  const app = el('div', 'app');

  /* ---- Status strip ---- */
  const bar = el('div', 'statusbar');
  bar.append(el('i', 'statusbar__dot'));
  const title = el('span', 'statusbar__title', 'Home');
  bar.appendChild(title);
  const end = el('div', 'statusbar__end');
  const localTag = el('span', 'statusbar__local', 'On device');
  const clock = el('span', null, '');
  // A translator would rewrite the digits.
  clock.setAttribute('translate', 'no');
  end.append(localTag, clock);
  bar.appendChild(end);

  /* A screen of unread articles is a few hundred phrases, which is fifteen
     seconds the first time it is opened in a new language. The badge already
     sits there saying where the work happens, so it counts instead, and goes
     back to saying "On device" when there is nothing left to do. */
  const IDLE_BADGE = 'On device';
  localTag.setAttribute('aria-live', 'polite');
  /* Two rules keep this from fighting the translator. A live count is marked
     as not translatable, because rewriting it queues another pass that
     rewrites it again. And the resting label is written once, on the way
     back to rest, so the translated word is left alone afterwards. */
  const setBadge = (text, busy) => {
    if (busy) {
      localTag.setAttribute('translate', 'no');
      localTag.dataset.busy = 'on';
      localTag.textContent = text;
    } else if (localTag.dataset.busy) {
      delete localTag.dataset.busy;
      localTag.removeAttribute('translate');
      localTag.textContent = IDLE_BADGE;
    }
  };
  i18n.onStatus(s => {
    // The engine holds the authoritative answer, and it clears it the moment
    // the model lands, whether that was a success or a failure.
    const dl = s.phase === 'downloading' ? s : i18n.downloadProgress();
    if (dl) {
      setBadge(`Downloading ${Math.round((dl.loaded ?? 0) * 100)}%`, true);
    } else if (s.phase === 'working' && s.total > 12) {
      setBadge(`Translating ${s.done ?? 0} of ${s.total}`, true);
    } else {
      setBadge(null, false);
    }
  });

  /* ---- Screen host ---- */
  const host = el('main', 'screens');
  host.id = 'screens';

  /* ---- Tab bar ---- */
  const tabs = el('nav', 'tabs');
  tabs.setAttribute('aria-label', 'Sections');
  const tabButtons = TABS.map(t => {
    const b = el('button', 'tab');
    b.type = 'button';
    b.append(icon(t.icon), el('span', null, t.label));
    b.addEventListener('click', () => go(t.route));
    tabs.appendChild(b);
    return { def: t, node: b };
  });

  app.append(bar, host, tabs);
  mountPoint.appendChild(app);

  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  app.appendChild(live);

  /* A save that failed looks identical to one that worked until the screen
     redraws without the entry. This says so, and stays up until dismissed,
     because the next thing the person does is probably type it again. */
  const notice = el('div', 'notice');
  notice.setAttribute('role', 'alert');
  notice.hidden = true;
  app.appendChild(notice);

  onWriteError(detail => {
    notice.replaceChildren(
      el('p', 'notice__head', detail.reason === 'full'
        ? 'That did not save' : 'Storage is switched off'),
      el('p', null, detail.message),
    );
    const close = el('button', 'btn btn--quiet', 'Dismiss');
    close.type = 'button';
    close.addEventListener('click', () => { notice.hidden = true; });
    notice.appendChild(close);
    notice.hidden = false;
    live.textContent = detail.message;
  });

  /* The clock is the cheapest signal that the surface is live. Minute
     resolution only; a ticking second hand is noise on a health screen. */
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };
  tick();
  setInterval(tick, 20000);

  let current = null;
  let depth = 0;

  function go(route) {
    if (location.hash === route) return;
    location.hash = route;
  }

  function render() {
    const route = location.hash || ROOT;
    const def = resolveRoute(route) ?? SCREENS[ROOT];
    const nextDepth = (def.depth ?? 0);
    const direction = nextDepth >= depth ? 'forward' : 'back';
    depth = nextDepth;

    title.textContent = def.title;
    document.title = `${def.title} | Vitals Local`;

    const panel = el('section', 'screen');
    if (def.bleed) panel.classList.add('screen--bleed');
    panel.dataset.route = route;
    if (current) panel.dataset.enter = direction;

    /* The scroller is full width so the wheel works anywhere on screen. The
       readable column is an inner wrapper, except for screens that own their
       whole layout. */
    let target = panel;
    if (!def.bleed) {
      target = el('div', 'col');
      panel.appendChild(target);
    }
    def.render(target, { go, live });

    if (current) {
      const old = current;
      old.dataset.exit = direction;
      old.addEventListener('animationend', () => old.remove(), { once: true });
      // Guard against a dropped animationend when motion is reduced.
      setTimeout(() => old.remove(), 400);
      host.appendChild(panel);
    } else {
      host.replaceChildren(panel);
    }
    current = panel;
    panel.scrollTop = 0;

    /* One pass over the whole shell. Three separate calls cancelled each
       other, since each new pass aborts the one before it. */
    i18n.translateTree(app);

    // Setup owns the whole screen; the tab bar would only be a way out of it.
    tabs.hidden = route.startsWith('#/setup');

    tabButtons.forEach(({ def: t, node }) => {
      const on = route.startsWith(t.match);
      node.setAttribute('aria-current', on ? 'page' : 'false');
    });

    live.textContent = def.title;
  }

  // Anything rendered later, by a screen or a component, is picked up too.
  i18n.observe(app);

  window.addEventListener('hashchange', render);
  // Changing language rebuilds the screen so every string goes through the
  // translator again, including ones the previous language had cached.
  window.addEventListener('vitals:language', () => { current = null; render(); });
  if (!location.hash) {
    // First run lands on setup; every run after it lands on Home.
    const done = JSON.parse(localStorage.getItem('vitals.settings') || '{}').setupDone;
    location.replace(done ? ROOT : '#/setup');
  }
  render();

  return { go };
}
