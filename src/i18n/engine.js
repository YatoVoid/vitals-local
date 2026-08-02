/* Translation providers, in order of preference.
 *
 * 1. On device. Chrome and Edge expose a Translator API backed by a model the
 *    browser downloads once, roughly 40 MB per language pair. It then runs
 *    with the network off and sends nothing anywhere.
 * 2. A public endpoint, used only when no on-device model exists and the
 *    person has switched it on. Interface text only.
 * 3. Neither, in which case the app stays in English.
 */

import { engineCode } from './languages.js';

const STATE = {
  translators: new Map(),   // targetLang -> Translator
  progress: null,           // { lang, loaded } while a model downloads
  capability: new Map(),    // targetLang -> availability string
  lastError: null,
};

/* Probing 65 languages one at a time is slow and the answer is stable, so it
   is cached for the picker. */
const CAP_KEY = 'vitals.i18n.capability';

function loadCaps() {
  if (STATE.capability.size) return;
  try {
    const saved = JSON.parse(localStorage.getItem(CAP_KEY) ?? '{}');
    for (const [k, v] of Object.entries(saved)) STATE.capability.set(k, v);
  } catch {}
}
function saveCaps() {
  try {
    localStorage.setItem(CAP_KEY, JSON.stringify(Object.fromEntries(STATE.capability)));
  } catch {}
}

export function hasOnDevice() {
  return typeof self !== 'undefined' && 'Translator' in self;
}

/**
 * @returns {'unavailable'|'downloadable'|'downloading'|'available'|'unsupported'}
 */
export async function onDeviceAvailability(target, { fresh = false } = {}) {
  if (!hasOnDevice()) return 'unsupported';
  loadCaps();
  const code = engineCode(target);
  if (!fresh && STATE.capability.has(code)) return STATE.capability.get(code);
  let result = 'unavailable';
  try {
    result = await Translator.availability({ sourceLanguage: 'en', targetLanguage: code });
  } catch { result = 'unavailable'; }
  STATE.capability.set(code, result);
  saveCaps();
  return result;
}

/**
 * Capability for every language at once, for the picker.
 * @returns {Promise<Map<string, 'ondevice'|'network'|'source'>>}
 */
export async function capabilityMap(codes) {
  const out = new Map();
  for (const code of codes) {
    if (code === 'en') { out.set(code, 'source'); continue; }
    const a = await onDeviceAvailability(code);
    out.set(code, (a === 'available' || a === 'downloadable' || a === 'downloading')
      ? 'ondevice' : 'network');
  }
  return out;
}

/**
 * Get or build an on-device translator.
 *
 * `allowDownload` must only be passed from a call path with a user gesture
 * behind it. The browser rejects a model download at any other time and one
 * gesture authorises one model, so background callers leave it off and fall
 * back instead.
 *
 * @param {string} target
 * @param {{ onProgress?: (loaded: number) => void, allowDownload?: boolean }} opts
 */
export async function getOnDevice(target, { onProgress, allowDownload = false } = {}) {
  if (!hasOnDevice()) return null;
  if (STATE.translators.has(target)) return STATE.translators.get(target);

  const availability = await onDeviceAvailability(target);
  if (availability === 'unavailable' || availability === 'unsupported') return null;

  if (availability !== 'available' && !allowDownload) {
    STATE.lastError = { lang: target, name: 'NeedsGesture',
      message: 'The model for this language downloads when it is picked.' };
    return null;
  }

  try {
    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: engineCode(target),
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          STATE.progress = { lang: target, loaded: e.loaded ?? 0 };
          onProgress?.(e.loaded ?? 0);
        });
      },
    });
    STATE.progress = null;
    STATE.lastError = null;
    STATE.translators.set(target, translator);
    STATE.capability.set(engineCode(target), 'available');
    saveCaps();
    return translator;
  } catch (err) {
    STATE.progress = null;
    STATE.lastError = { lang: target, name: err?.name, message: err?.message };
    return null;
  }
}

/** Why the last on-device attempt failed, or null. */
export function lastError() { return STATE.lastError ?? null; }

/* ---- Network fallback ----
 *
 * MyMemory, which needs no key or account. Only interface text is sent:
 * headings, labels, article prose. Never anything a person entered.
 */
const NET_ENDPOINT = 'https://api.mymemory.translated.net/get';

async function translateOverNetwork(text, target) {
  const code = engineCode(target);
  const url = `${NET_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(code)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const out = data?.responseData?.translatedText;
    if (!out || typeof out !== 'string') return null;
    // The service echoes the query back on failure and shouts warnings in caps.
    if (out === text) return null;
    if (/^(MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID)/i.test(out)) return null;
    return out;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {string[]} texts
 * @param {string} target
 * @param {object} opts { allowNetwork, allowDownload, onProgress, signal }
 * @returns {Promise<Map<string,string>>} source text to translated text
 */
export async function translateBatch(texts, target, opts = {}) {
  const out = new Map();
  if (!texts.length || target === 'en') return out;

  const translator = await getOnDevice(target, {
    onProgress: opts.onModelProgress,
    allowDownload: Boolean(opts.allowDownload),
  });

  if (translator) {
    // Local, so the only limit is main-thread responsiveness.
    const LANE = 6;
    for (let i = 0; i < texts.length; i += LANE) {
      if (opts.signal?.aborted) break;
      const slice = texts.slice(i, i + LANE);
      const results = await Promise.all(slice.map(async t => {
        try { return await translator.translate(t); }
        catch { return null; }
      }));
      results.forEach((r, n) => { if (r) out.set(slice[n], r); });
      opts.onProgress?.(Math.min(i + LANE, texts.length), texts.length);
    }
    return out;
  }

  if (!opts.allowNetwork) return out;

  /* One request per string, rate limited. No hard cap: stopping halfway would
     leave the rest in English with nothing to explain why. The caller aborts. */
  let failures = 0;
  for (let i = 0; i < texts.length; i++) {
    if (opts.signal?.aborted) break;
    const r = await translateOverNetwork(texts[i], target);
    if (r) { out.set(texts[i], r); failures = 0; }
    else if (++failures >= 5) break;   // service is refusing; stop asking
    opts.onProgress?.(i + 1, texts.length);
    await new Promise(res => setTimeout(res, 120));
  }
  return out;
}

/** What the settings screen shows about the current language. */
export async function describeCapability(target) {
  if (target === 'en') {
    return { mode: 'source', line: 'English is the language the app is written in.' };
  }
  const availability = await onDeviceAvailability(target);
  switch (availability) {
    case 'available':
      return { mode: 'ondevice-ready', line:
        'Your browser translates this language on the device itself. Nothing '
        + 'is sent anywhere and it works with the network off.' };
    case 'downloadable':
      return { mode: 'ondevice-download', line:
        'Your browser can translate this on the device once it downloads a '
        + 'language model, usually a few tens of megabytes. After that it '
        + 'works offline and nothing is sent anywhere.' };
    case 'downloading':
      return { mode: 'ondevice-downloading', line: 'The language model is downloading.' };
    case 'unsupported':
      return { mode: 'none', line:
        'This browser has no on-device translation. Chrome and Edge do. '
        + 'Without it, translating needs a network service, which stays off '
        + 'until you turn it on.' };
    default:
      return { mode: 'none', line:
        'This browser cannot translate that language on the device. '
        + 'Translating it needs a network service, which stays off until you '
        + 'turn it on.' };
  }
}

export function downloadProgress() {
  return STATE.progress;
}
