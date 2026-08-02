/* DOM translation.
 *
 * Walks the rendered tree instead of wrapping strings in t() calls. This
 * covers the article library and anything else rendered from data, and it
 * cannot drift out of sync with a hand-maintained string table.
 *
 * Cached strings are substituted synchronously; only new ones wait on the
 * engine.
 */

import * as cache from './cache.js';

/* Never translated: measured values, code, and anything marked. Passing
   "1868 kcal" to a translator invites it to alter the number. */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'CANVAS', 'NOSCRIPT']);
const SKIP_CLASSES = [
  'value', 'readout-big', 'gauge__num', 'ring__val', 'painchart',
  'bmibar__axis', 'dial__count', 'meter',
];

function skippable(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.getAttribute?.('translate') === 'no') return true;
    if (el.dataset?.noTranslate != null) return true;
    for (const c of SKIP_CLASSES) if (el.classList?.contains(c)) return true;
  }
  return false;
}

/* Text worth sending. Pure numbers, single symbols and units are not. */
function translatable(text) {
  const t = text.trim();
  if (t.length < 2) return false;
  if (!/[\p{L}]/u.test(t)) return false;           // no letters at all
  if (/^[\d\s.,:%+\-/]+$/.test(t)) return false;   // a measurement
  if (/^[\d.,]+\s*\p{L}{1,4}$/u.test(t)) return false; // "500 mg", "80 kg"
  return true;
}

/** Attributes that hold text a person reads or hears. */
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

/**
 * Collect every translatable string under a root, with where it came from.
 * @returns {{ nodes: Array<{node, kind, attr, original}>, texts: Set<string> }}
 */
export function collect(root) {
  const nodes = [];
  const texts = new Set();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      /* Test the English source, not the rendered text. A translated node can
         fall below the length threshold ("Home" becomes "홈"), which would
         strand it in whatever language wrote it. */
      const source = n.__i18nSource ?? n.nodeValue ?? '';
      if (!translatable(source)) return NodeFilter.FILTER_REJECT;
      if (skippable(n)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const original = n.__i18nSource ?? n.nodeValue;
    nodes.push({ node: n, kind: 'text', original });
    texts.add(cache.normalise(original));
  }

  root.querySelectorAll('[placeholder], [aria-label], [title], [alt]').forEach(el => {
    if (el.getAttribute('translate') === 'no') return;
    for (const attr of ATTRS) {
      const raw = el.getAttribute(attr);
      if (!raw || !translatable(raw)) continue;
      const original = el.__i18nAttrs?.[attr] ?? raw;
      nodes.push({ node: el, kind: 'attr', attr, original });
      texts.add(cache.normalise(original));
    }
  });

  return { nodes, texts };
}

/** Put a translation in place, remembering the English underneath. */
function apply(entry, translated) {
  if (entry.kind === 'text') {
    if (entry.node.__i18nSource == null) entry.node.__i18nSource = entry.original;
    // Keep the original leading and trailing space so layout does not shift.
    const lead = entry.original.match(/^\s*/)[0];
    const tail = entry.original.match(/\s*$/)[0];
    entry.node.nodeValue = lead + translated + tail;
  } else {
    entry.node.__i18nAttrs ??= {};
    entry.node.__i18nAttrs[entry.attr] ??= entry.original;
    entry.node.setAttribute(entry.attr, translated);
  }
}

/** Put the English back, for switching to English or showing an original. */
export function revert(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.__i18nSource != null) { n.nodeValue = n.__i18nSource; }
  }
  root.querySelectorAll('*').forEach(el => {
    if (!el.__i18nAttrs) return;
    for (const [attr, original] of Object.entries(el.__i18nAttrs)) {
      el.setAttribute(attr, original);
    }
  });
}

/**
 * Translate everything under root that is already cached, right now.
 * @returns {string[]} the strings that were not cached
 */
export function applyCached(root, lang) {
  if (lang === 'en') { revert(root); return []; }
  const { nodes } = collect(root);
  const missing = new Set();
  for (const entry of nodes) {
    const hit = cache.get(lang, entry.original);
    if (hit) apply(entry, hit);
    else missing.add(cache.normalise(entry.original));
  }
  return [...missing];
}

/** Apply a freshly translated batch to whatever is on screen now. */
export function applyBatch(root, lang, results) {
  if (!results.size) return;
  const { nodes } = collect(root);
  for (const entry of nodes) {
    const key = cache.normalise(entry.original);
    const hit = results.get(key) ?? cache.get(lang, entry.original);
    if (hit) apply(entry, hit);
  }
}


/* ---- Critical text ----
 *
 * Machine translation is not reliable enough for the lines that route someone
 * to emergency care. "Go to emergency now. Do not drive yourself." came back
 * from the on-device model as Russian meaning "transition into an emergency
 * situation" and "do not lead yourself".
 *
 * Elements marked data-critical therefore render the translation with the
 * English kept underneath it. Leaving these untranslated would strand anyone
 * who reads no English; showing both lets the reader and anyone with them
 * check it.
 */
export function markOriginals(root, lang) {
  root.querySelectorAll('[data-critical] .i18n-original').forEach(n => n.remove());
  if (lang === 'en') return;

  root.querySelectorAll('[data-critical]').forEach(box => {
    box.querySelectorAll('li, p, h1, h2, h3, .card__head').forEach(el => {
      // Only where a substitution was made.
      const source = [...el.childNodes]
        .filter(n => n.nodeType === Node.TEXT_NODE && n.__i18nSource != null)
        .map(n => n.__i18nSource.trim())
        .join(' ')
        .trim();
      if (!source) return;
      const orig = document.createElement('span');
      orig.className = 'i18n-original';
      orig.setAttribute('lang', 'en');
      orig.setAttribute('dir', 'ltr');
      orig.setAttribute('translate', 'no');
      orig.textContent = source;
      el.appendChild(orig);
    });
  });
}
