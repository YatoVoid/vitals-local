/* Language switching and background translation.
 *
 * Cached strings are substituted synchronously on render. Anything new is
 * translated in the background and applied as it arrives. Cache keys are
 * hashes of the English source, so an app update only re-translates the
 * wording that changed.
 */

import * as cache from './cache.js';
import * as dom from './dom.js';
import { translateBatch, describeCapability, hasOnDevice, onDeviceAvailability,
         getOnDevice } from './engine.js';
import { language, isRTL, usesCaps, preferred, LANGUAGES, findLanguages } from './languages.js';

export { LANGUAGES, findLanguages, language, preferred, isRTL };
export { cachedLanguages, stats, clear as clearLanguage, clearAll as clearAllLanguages,
         exportLanguage, importLanguage } from './cache.js';
export { describeCapability, hasOnDevice, onDeviceAvailability, downloadProgress,
         capabilityMap, lastError } from './engine.js';

const SETTINGS_KEY = 'vitals.settings';

const state = {
  lang: 'en',
  allowNetwork: false,
  running: null,        // AbortController for the current background pass
  listeners: new Set(),
  observer: null,
  root: null,
  applying: false,      // set while we write to the DOM, so the observer ignores it
  pending: null,
};

function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'); }
  catch { return {}; }
}

export function current() { return state.lang; }
export function networkAllowed() { return state.allowNetwork; }

export function setNetworkAllowed(on) {
  state.allowNetwork = Boolean(on);
  const s = readSettings();
  s.translateOverNetwork = state.allowNetwork;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

export function onStatus(fn) {
  state.listeners.add(fn);
  return () => state.listeners.delete(fn);
}
function emit(status) {
  for (const fn of state.listeners) { try { fn(status); } catch {} }
}

export function applyDocumentLanguage(lang = state.lang) {
  const root = document.documentElement;
  const meta = language(lang);
  root.lang = lang;
  root.dir = isRTL(lang) ? 'rtl' : 'ltr';
  root.dataset.script = meta.script;
  // Tracked uppercase is unreadable in most non-Latin scripts. One token
  // drives it rather than a rule per component.
  root.dataset.caps = usesCaps(lang) ? 'on' : 'off';
}

export function init() {
  const s = readSettings();
  state.lang = s.language ?? 'en';
  state.allowNetwork = Boolean(s.translateOverNetwork);
  applyDocumentLanguage();
}

/**
 * Translate content added by anything other than a screen render: sheets,
 * the symptom console swapping stages, lists redrawing.
 */
export function observe(root) {
  state.observer?.disconnect();
  state.root = root;
  if (!root) return;
  state.observer = new MutationObserver(records => {
    if (state.applying || state.lang === 'en') return;
    if (!records.some(r => r.addedNodes.length > 0)) return;
    clearTimeout(state.pending);
    state.pending = setTimeout(() => translateTree(root), 80);
  });
  state.observer.observe(root, { childList: true, subtree: true });
}

/**
 * Translate a subtree. Cached strings land on the current frame; the rest are
 * queued and applied when they arrive.
 */
export async function translateTree(root, lang = state.lang) {
  if (!root || lang === 'en') {
    if (root) {
      state.applying = true;
      dom.revert(root);
      state.applying = false;
    }
    return { cached: 0, fetched: 0 };
  }

  state.applying = true;
  const missing = dom.applyCached(root, lang);
  dom.markOriginals(root, lang);
  state.applying = false;
  if (!missing.length) return { cached: 1, fetched: 0 };

  state.running?.abort();
  const controller = new AbortController();
  state.running = controller;

  emit({ phase: 'working', lang, total: missing.length, done: 0 });

  const results = await translateBatch(missing, lang, {
    allowNetwork: state.allowNetwork,
    signal: controller.signal,
    onProgress: (done, total) => emit({ phase: 'working', lang, done, total }),
    onModelProgress: loaded => emit({ phase: 'downloading', lang, loaded }),
  });

  // A superseded pass still produced usable translations, so cache them.
  cache.putMany(lang, [...results.entries()]);
  if (controller.signal.aborted) return { cached: 0, fetched: results.size };
  if (root.isConnected) {
    state.applying = true;
    dom.applyBatch(root, lang, results);
    dom.markOriginals(root, lang);
    state.applying = false;
  }

  emit({ phase: results.size ? 'done' : 'unavailable', lang, translated: results.size });
  return { cached: 0, fetched: results.size };
}

/**
 * Fetch the on-device model for a language.
 *
 * Must be called straight out of a user gesture with nothing slow awaited
 * first: the browser rejects the download otherwise, and one gesture is worth
 * one model. See docs/ARCHITECTURE.md.
 */
export async function prepareLanguage(lang, onProgress) {
  if (lang === 'en') return { ready: true, mode: 'source' };
  const translator = await getOnDevice(lang, {
    allowDownload: true,
    onProgress: loaded => { emit({ phase: 'downloading', lang, loaded }); onProgress?.(loaded); },
  });
  if (translator) {
    emit({ phase: 'ready', lang });
    return { ready: true, mode: 'ondevice' };
  }
  emit({ phase: state.allowNetwork ? 'network' : 'unavailable', lang });
  return { ready: false, mode: state.allowNetwork ? 'network' : 'none' };
}

/**
 * Switch language.
 * @param {string} lang
 * @param {() => void} rerender
 */
export async function setLanguage(lang, rerender) {
  state.lang = lang;
  const s = readSettings();
  s.language = lang;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  applyDocumentLanguage(lang);
  // Draw from cache first so the screen changes on the same frame as the tap.
  rerender?.();
  if (lang === 'en') return;
  await prepareLanguage(lang);
  if (state.root?.isConnected) await translateTree(state.root, lang);
}

/** Fill the cache for every screen at once, for offline use. */
export async function pretranslate(lang, collectStrings, onProgress) {
  if (lang === 'en') return { total: 0, translated: 0 };
  const all = collectStrings();
  const missing = all.filter(t => !cache.get(lang, t)).map(cache.normalise);
  const unique = [...new Set(missing)];
  if (!unique.length) return { total: all.length, translated: 0, alreadyDone: true };

  const results = await translateBatch(unique, lang, {
    allowNetwork: state.allowNetwork,
    allowDownload: true,   // runs off a button press
    onProgress,
    onModelProgress: loaded => emit({ phase: 'downloading', lang, loaded }),
  });
  cache.putMany(lang, [...results.entries()]);
  return { total: unique.length, translated: results.size };
}

/** Is this language usable with the network off? */
export function isOffline(lang) {
  if (lang === 'en') return true;
  return cache.stats(lang).count > 0;
}
