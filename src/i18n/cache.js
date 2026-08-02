/* Translation cache.
 *
 * Keyed by a hash of the source text rather than a position in the app. An
 * update therefore only re-translates strings whose wording changed, and a
 * sentence repeated across screens is translated once and reads identically
 * everywhere.
 *
 * One store per language: switching never loads the others, and deleting a
 * language is a single key.
 */

const PREFIX = 'vitals.i18n.';
const META_KEY = 'vitals.i18n.meta';

/* FNV-1a, 32 bit, base 36. Needs to be fast, stable across versions, and
   short enough that a few thousand keys stay small in storage. */
export function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Text as it will be hashed: collapsed whitespace, trimmed. */
export function normalise(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

const memory = new Map();     // lang -> { [hash]: translated }
let dirty = new Set();
let flushTimer = null;

function load(lang) {
  if (memory.has(lang)) return memory.get(lang);
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(PREFIX + lang) ?? '{}');
  } catch { data = {}; }
  memory.set(lang, data);
  return data;
}

function flush() {
  for (const lang of dirty) {
    try {
      localStorage.setItem(PREFIX + lang, JSON.stringify(memory.get(lang) ?? {}));
    } catch {
      /* Out of room. Drop the least useful language rather than losing the
         one in use, and try once more. */
      evictOther(lang);
      try {
        localStorage.setItem(PREFIX + lang, JSON.stringify(memory.get(lang) ?? {}));
      } catch { /* give up quietly; translation still works, just uncached */ }
    }
  }
  dirty.clear();
}

function evictOther(keep) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX) && k !== PREFIX + keep && k !== META_KEY) {
      localStorage.removeItem(k);
      memory.delete(k.slice(PREFIX.length));
      return true;
    }
  }
  return false;
}

/** Writes are batched, because a screen can add a hundred entries at once. */
function scheduleFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 400);
}

export function get(lang, text) {
  if (lang === 'en') return null;
  return load(lang)[hash(normalise(text))] ?? null;
}

export function getByHash(lang, h) {
  if (lang === 'en') return null;
  return load(lang)[h] ?? null;
}

export function put(lang, text, translated) {
  if (lang === 'en' || !translated) return;
  const store = load(lang);
  store[hash(normalise(text))] = translated;
  dirty.add(lang);
  scheduleFlush();
}

export function putMany(lang, pairs) {
  if (lang === 'en') return;
  const store = load(lang);
  for (const [text, translated] of pairs) {
    if (translated) store[hash(normalise(text))] = translated;
  }
  dirty.add(lang);
  scheduleFlush();
}

/** How much of this language is already stored. */
export function stats(lang) {
  const store = load(lang);
  const count = Object.keys(store).length;
  let bytes = 0;
  try { bytes = (localStorage.getItem(PREFIX + lang) ?? '').length; } catch {}
  return { count, kb: Math.round(bytes / 1024) };
}

/** Every language with anything cached, for the settings screen. */
export function cachedLanguages() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && k !== META_KEY) {
        const lang = k.slice(PREFIX.length);
        out.push({ lang, ...stats(lang) });
      }
    }
  } catch {}
  return out.sort((a, b) => b.count - a.count);
}

export function clear(lang) {
  try { localStorage.removeItem(PREFIX + lang); } catch {}
  memory.delete(lang);
  dirty.delete(lang);
}

export function clearAll() {
  for (const { lang } of cachedLanguages()) clear(lang);
}

/** Export and import, so a translated app can be moved to another device. */
export function exportLanguage(lang) {
  return { app: 'Vitals Local', kind: 'translations', lang, entries: load(lang) };
}

export function importLanguage(payload) {
  if (payload?.kind !== 'translations' || !payload.lang) return false;
  const store = load(payload.lang);
  Object.assign(store, payload.entries ?? {});
  dirty.add(payload.lang);
  flush();
  return true;
}
