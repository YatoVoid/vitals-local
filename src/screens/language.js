/* Language picker.
 *
 * Each language is labelled in its own script, with the English name beneath.
 * Rows report what the option can do: already stored, translated on the
 * device, or needing the network service.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows } from '../app/ui.js';
import * as i18n from '../i18n/index.js';
import { LANGUAGES, findLanguages, language } from '../i18n/languages.js';
import { ARTICLES } from '../data/library/index.js';
import { BANKS, GENERIC } from '../triage/index.js';

/* Everything the app can put on screen, for translating ahead of time. Pulled
   from the data rather than from a hand kept list, so it cannot fall behind. */
function allStrings() {
  const out = new Set();
  const add = t => { if (typeof t === 'string' && t.trim().length > 1) out.add(t.trim()); };

  for (const a of ARTICLES) {
    add(a.title); add(a.summary); add(a.category); add(a.basis);
    for (const [h, p] of a.sections ?? []) { add(h); add(p); }
  }
  for (const bank of [...BANKS, GENERIC]) {
    add(bank.label); add(bank.basis);
    for (const c of bank.causes) { add(c.label); add(c.note);
      (c.helps ?? []).forEach(add); (c.selfChecks ?? []).forEach(add); }
    for (const q of bank.questions) { add(q.prompt); q.options.forEach(o => add(o.label)); }
    for (const f of bank.redFlags) { add(f.headline); (f.lines ?? []).forEach(add); }
    (bank.selfChecks ?? []).forEach(add);
  }
  // Whatever is currently on screen catches the interface chrome.
  document.querySelectorAll('.screen, .tabs, .statusbar').forEach(root => {
    root.querySelectorAll('*').forEach(n => {
      if (n.children.length === 0) add(n.textContent);
    });
  });
  return [...out];
}

export function renderLanguage(screen, { go, live }) {
  let query = '';
  let busy = null;
  let caps = null;      // code -> 'ondevice' | 'network' | 'source'
  let switching = null; // the code being switched to, so two taps cannot race

  const draw = () => {
    screen.replaceChildren();
    const cur = i18n.current();

    screen.appendChild(eyebrow('Language'));
    screen.appendChild(el('h1', null, 'Choose your language'));

    const search = el('input', 'field');
    search.type = 'search';
    search.value = query;
    search.placeholder = 'Search, in either name';
    search.setAttribute('aria-label', 'Search languages');
    search.setAttribute('translate', 'no');
    search.addEventListener('input', () => {
      query = search.value;
      drawList();
      // Keep the caret where it was rather than redrawing the whole screen.
    });
    screen.appendChild(search);

    const listHost = el('div');
    screen.appendChild(listHost);

    const drawList = () => {
      listHost.replaceChildren();
      const matches = findLanguages(query);
      if (!matches.length) {
        listHost.appendChild(el('p', 'empty', 'No language matches that.'));
        return;
      }
      listHost.appendChild(rows(...matches.map(l => {
        const stored = i18n.stats(l.code).count;
        const cap = caps?.get(l.code);
        /* Row state, ordered by what a reader scanning the list needs
           first: current, stored, on device, network. */
        const state =
          l.code === cur ? 'On'
          : stored ? 'Offline'
          : cap === 'ondevice' ? 'On device'
          : cap === 'network' ? 'Needs network'
          : '';
        const r = row(l.name, {
          sub: l.english + (stored ? `, ${stored} phrases stored` : ''),
          end: state,
          selected: l.code === cur,
          onClick: async () => {
            if (l.code === cur || switching) return;
            switching = l.code;
            const endEl = r.querySelector('.row__end');
            /* First pick downloads tens of megabytes, around ten seconds.
               The row carries the progress so the tap has feedback. */
            const stop = i18n.onStatus(s => {
              if (s.lang !== l.code || !endEl) return;
              if (s.phase === 'downloading') {
                endEl.textContent = `Downloading ${Math.round((s.loaded ?? 0) * 100)}%`;
              } else if (s.phase === 'working') {
                endEl.textContent = `${s.done ?? 0} of ${s.total ?? 0}`;
              }
            });
            if (endEl) endEl.textContent = 'Starting';
            live.textContent = `Switching to ${l.english}`;
            await i18n.setLanguage(l.code);
            stop();
            switching = null;
            live.textContent = `${l.english} is on`;
            window.dispatchEvent(new CustomEvent('vitals:language'));
          },
        });
        /* The name is in its own script, so it must not be machine
           translated into the language you are leaving. */
        r.setAttribute('translate', 'no');
        r.querySelector('span').setAttribute('lang', l.code);
        if (l.dir) r.querySelector('span').setAttribute('dir', l.dir);
        return r;
      })));
    };
    drawList();

    /* Probing sixty five languages takes a moment, so the list draws first
       and labels itself once the answers are in. The answers are cached, so
       this is instant every time after the first. */
    if (!caps) {
      i18n.capabilityMap(LANGUAGES.map(l => l.code)).then(m => {
        caps = m;
        if (listHost.isConnected) drawList();
      });
    }

    /* ---- What this language can do ---- */
    const capBox = panel(eyebrow('Checking what your browser can do'));
    screen.appendChild(capBox);
    i18n.describeCapability(cur).then(cap => {
      capBox.replaceChildren(
        eyebrow(({
          'source': 'Written in this language',
          'ondevice-ready': 'Translated on your device',
          'ondevice-download': 'Can translate on your device',
          'ondevice-downloading': 'Downloading the language model',
          'none': 'No on-device translation here',
        })[cap.mode] ?? 'Translation'),
        el('p', null, cap.line),
      );
      if (cap.mode === 'none') {
        capBox.appendChild(networkConsent(draw, live));
      }
    });

    /* ---- Offline ---- */
    if (cur !== 'en') {
      const stored = i18n.stats(cur);
      const off = panel(
        eyebrow(stored.count ? 'Stored on this device' : 'Not stored yet'),
        el('p', null, stored.count
          ? `${stored.count} phrases are saved here, about ${stored.kb} KB. Those `
            + 'read instantly and work with the network off. Anything new is '
            + 'translated the first time you reach it.'
          : 'Nothing is stored yet. Screens translate as you open them, and '
            + 'each phrase is saved so it never has to be translated twice.'),
        el('p', null,
          'Translations are stored against the wording of the English, not '
          + 'against a position in the app. When the app is updated, only the '
          + 'sentences that actually changed are translated again, so the rest '
          + 'stays exactly as you have already read it.'),
      );

      const pre = button(
        busy ? `Translating, ${busy.done} of ${busy.total}` : 'Translate everything now, for offline use',
        'btn btn--block',
        async () => {
          if (busy) return;
          busy = { done: 0, total: 0 };
          draw();
          const res = await i18n.pretranslate(cur, allStrings, (done, total) => {
            busy = { done, total };
            const b = screen.querySelector('.pretranslate-btn');
            if (b) b.textContent = `Translating, ${done} of ${total}`;
          });
          busy = null;
          live.textContent = res.alreadyDone
            ? 'Everything is already stored'
            : `${res.translated} phrases stored`;
          draw();
        });
      pre.classList.add('pretranslate-btn');
      pre.disabled = Boolean(busy);
      off.appendChild(pre);

      if (stored.count) {
        off.appendChild(button('Delete this language', 'btn btn--quiet btn--block', () => {
          const l = language(cur);
          if (!confirm(`Delete the ${stored.count} stored phrases for ${l.english}? `
            + 'They will be translated again next time you open a screen.')) return;
          i18n.clearLanguage(cur);
          live.textContent = 'Deleted';
          draw();
        }));
      }
      off.style.marginBlockStart = 'var(--s-4)';
      screen.appendChild(off);
    }

    /* ---- The warning that matters ---- */
    if (cur !== 'en') {
      const care = panel(
        eyebrow('Read this once'),
        el('p', null,
          'These translations are produced by a machine, not by a clinician. '
          + 'They are good enough to read an article by, and they are not '
          + 'good enough to bet on when something is urgent.'),
        el('p', null,
          'Anything marked as needing urgent care shows the English underneath '
          + 'it as well. If the two seem to disagree, trust the English and '
          + 'get seen.'),
      );
      care.dataset.severity = 'soon';
      care.style.marginBlockStart = 'var(--s-4)';
      screen.appendChild(care);
    }

    const back = button('Back to Settings', 'btn btn--quiet btn--block', () => go('#/you/settings'));
    back.style.marginBlockStart = 'var(--s-5)';
    screen.appendChild(back);
  };

  draw();
}

function networkConsent(redraw, live) {
  const wrap = el('div');
  const on = i18n.networkAllowed();
  wrap.appendChild(el('p', 'hint',
    'A public translation service can do it instead. What gets sent is the '
    + "app's own interface text and article wording. Nothing you have typed, "
    + 'no symptoms, no measurements, no profile. It is off until you turn it '
    + 'on, and it only runs while you are online.'));
  wrap.appendChild(button(
    on ? 'Turn off network translation' : 'Allow network translation',
    on ? 'btn btn--quiet btn--block' : 'btn btn--block',
    () => {
      i18n.setNetworkAllowed(!on);
      live.textContent = on ? 'Network translation off' : 'Network translation on';
      redraw();
    }));
  return wrap;
}
