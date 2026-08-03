/* Service worker.
 *
 * The app claims to work offline, and without this it only holds that claim
 * once it has already loaded: the shell itself still has to come off the
 * network. This keeps a copy of every file the app is built from.
 *
 * Two strategies, because one does not fit both cases.
 *
 *   The page itself is network first. It is the only file that decides which
 *   version of everything else gets loaded, so it is never served stale while
 *   there is a network.
 *
 *   Everything else is served from cache and refreshed in the background.
 *   Going to the network first for assets costs a failed connection per
 *   module before the fallback, which is the difference between a cold
 *   offline start of nine seconds and one of none. The trade is that an asset
 *   can sit one load behind; the page that references it cannot.
 *
 * Only same-origin GETs are touched. The weather and translation endpoints are
 * cross-origin and are left alone, so nothing outbound is ever replayed from a
 * cache.
 */

const VERSION = 'vitals-10';

/* Everything needed to start with no network. Paths are relative so this works
   from a project subpath as well as a domain root. */
const SHELL = [
  './',
  './index.html',
  './ui/themes/tokens.css',
  './ui/layout/app-shell.css',
  './ui/layout/screens.css',
  './ui/layout/shell.css',
  './ui/components/symptom-game/symptom-game.css',
  './src/app/shell.js',
  './src/app/routes.js',
  './src/app/store.js',
  './src/app/ui.js',
  './src/app/units.js',
  './src/app/body-metrics.js',
  './src/app/episodes.js',
  './src/app/weather.js',
  './src/data/ingredients.js',
  './src/data/emergency.js',
  './src/data/labs.js',
  './src/data/places.js',
  './src/data/library/index.js',
  './src/data/library/basics.js',
  './src/data/library/claims.js',
  './src/data/library/food.js',
  './src/data/library/movement.js',
  './src/data/library/skin.js',
  './src/i18n/index.js',
  './src/i18n/engine.js',
  './src/i18n/cache.js',
  './src/i18n/dom.js',
  './src/i18n/languages.js',
  './src/screens/home.js',
  './src/screens/body.js',
  './src/screens/track.js',
  './src/screens/learn.js',
  './src/screens/you.js',
  './src/screens/setup.js',
  './src/screens/outside.js',
  './src/screens/episodes.js',
  './src/screens/language.js',
  './src/triage/index.js',
  './src/triage/engine.js',
  './src/triage/chest.js',
  './src/triage/abdomen.js',
  './src/triage/back.js',
  './src/triage/head.js',
  './src/triage/limb.js',
  './ui/components/symptom-game/symptom-game.js',
  './ui/components/symptom-game/body-map.js',
  './ui/components/symptom-game/pain-dial.js',
  './ui/components/symptom-game/machine.js',
  './ui/components/symptom-game/regions.js',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    /* One miss must not fail the whole install, or a single renamed file
       leaves the app with no offline copy at all. */
    await Promise.all(SHELL.map(url =>
      cache.add(new Request(url, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // weather, translation

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) (await caches.open(VERSION)).put(request, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(request, { ignoreSearch: true }))
            ?? (await caches.match('./index.html', { ignoreSearch: true }))
            ?? Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(request, { ignoreSearch: true });

    /* Kicked off either way, and never awaited when there is a hit: waiting on
       it is exactly what made the offline start slow.

       no-cache rather than a plain fetch, because a plain one is answered by
       the HTTP cache. Pages serves these with a ten minute max-age, so the
       revalidation was handed back the same copy already held and wrote it
       straight back: a held copy never picked up a fix, at any point. This
       asks the server, which answers 304 when nothing changed. */
    const update = fetch(new Request(request, { cache: 'no-cache' }))
      .then(fresh => {
        if (fresh && fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      })
      .catch(() => null);

    if (hit) return hit;
    return (await update) ?? Response.error();
  })());
});
