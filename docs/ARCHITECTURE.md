# Architecture

No framework, no build step, no dependencies. Plain HTML, CSS and ES modules
served statically. The constraint is deliberate: the app has to run from a
folder, work offline, and wrap into a native shell without restructuring.

## Shell and routing

`src/app/shell.js` builds three fixed bands: a status strip, a scrolling screen
host, and a tab bar. The strip and bar never move, so a screen can be swapped
without touching the frame and a native wrapper sees a stable shape.

Routes are path-shaped under a hash (`#/track/pain`). A static host needs no
rewrite rules and a mobile wrapper reads the same strings. There is one history
stack, so the platform back gesture behaves as expected.

`src/app/routes.js` carries a `depth` per route, which drives slide direction:
deeper screens enter from the end edge, shallower from the start edge.

## Storage

`src/app/store.js` is one namespace per domain over `localStorage`.

That is a decision, not a stopgap. Measured on the current data model:

| | |
|---|---|
| Translatable strings in the app | 1161, about 88k characters |
| A fully translated language | ~200 KB |
| localStorage available to this origin | ~10 MB |
| Reading a 193 KB store | 0.3 ms |
| Writing a 193 KB store | 0.4 ms |

Ten stored languages come to about 2 MB, and only the current language is
read at boot. IndexedDB would make every read asynchronous and buy nothing.

The threshold that would change this is data packs: a national medicine
register runs to tens of megabytes and does not belong in localStorage. When
packs land, give them IndexedDB on their own and leave these records alone.

Writes report failure through `onWriteError` instead of swallowing it. A full
or blocked store otherwise looks exactly like a successful save until the
screen redraws without the entry. The shell puts that on screen.

`usage()` reports what the app is holding, and Settings shows it.

`localStorage` is per-origin including port. Changing the dev server port
loses saved data.

Export and import are the only route between devices. `importAll` validates
the whole file before writing any of it, so a wrong or damaged file cannot
leave the store half replaced.

## Translation

Three modules under `src/i18n/`:

- `languages.js`: the language table. Endonym first, English name second.
  `script` selects a font stack and switches off tracked uppercase, which is
  unreadable in most non-Latin scripts. `engine` overrides the tag sent to the
  translator where it differs from the app's tag.
- `cache.js`: translations keyed by an FNV-1a hash of the source text, one
  store per language.
- `dom.js`: walks the rendered tree and substitutes text, rather than wrapping
  every string in a `t()` call. This covers content rendered from data and
  cannot drift out of sync with a hand-maintained string table.

### Two rules that are easy to break

**The Translator API needs a user gesture per model.**

```
NotAllowedError: Requires a user gesture when availability is
"downloading" or "downloadable".
```

One tap authorises exactly one model download. A loop over languages downloads
the first and fails every later one in about a millisecond, with the error
swallowed and no symptom beyond text staying English.

So `getOnDevice(lang, { allowDownload })` refuses to download unless told to.
Only `prepareLanguage` and `pretranslate` pass it, and both sit directly behind
a tap. Every background pass uses models already present and falls back
otherwise. There is no "download all languages" affordance that can work.

38 of the 65 languages have on-device models in current Chrome and Edge. The
rest need the opt-in network service.

**The DOM walker tests the English source, never the rendered text.**

`Home` translates to `홈`, one character, which falls below the minimum length
test. Judging the rendered value strands that node in whatever language wrote
it, permanently. `collect()` reads `__i18nSource ?? nodeValue`.

### Critical text

Elements marked `data-critical` render the translation with the English kept
underneath. A live test turned "Go to emergency now. Do not drive yourself."
into Russian meaning "transition into an emergency situation" and "do not lead
yourself". Leaving these untranslated would strand anyone who reads no English,
so both are shown.

## Triage

`src/triage/engine.js` runs naive Bayes on likelihood ratios. Each answer
option carries an LR per candidate; the next question asked is whichever best
separates the candidates still in contention. Priors are primary care base
rates, not hospital ones.

Two constraints hold throughout:

- Scores are never shown as probabilities. A figure derived from eight
  questions and no examination would imply precision that is not there, so the
  screen shows an ordering.
- Red flags are hard rules evaluated after every answer. No likelihood score
  overrides them.

Question banks are one file per region (`chest.js`, `abdomen.js`, `back.js`,
`head.js`, `limb.js`), each documenting the published rule it implements.

Region ids are hierarchical and view-independent: `chest.side.left` is the
person's own left regardless of which way the figure faces. The body map
returns an id and nothing downstream needs to know the view. Getting this
backwards records a complaint against the wrong side of someone's body, so the
mapping lives in one table with a test asserting it.

## Symptom console

`ui/components/symptom-game/`:

- `regions.js`: display vocabulary only. Region labels and pain types.
- `machine.js`: pure state machine. `send(state, event)` returns the next
  state, with no DOM, timers or storage, so the flow is testable without a
  browser.
- `body-map.js`: SVG figure in four views. Front and back share a silhouette,
  left and right share a profile. Each view draws centre-line shapes once and
  side shapes twice, the second pass through a mirror transform, so a limb is
  authored once. The outline path must live inside the group it traces or it
  does not inherit the transform.
- `pain-dial.js`: pain types on a ring. Plain trigonometry against a 200 unit
  square; nothing measures the DOM, so cost does not vary with device.
- `symptom-game.js`: renderer. One stage at a time, transitions on transform
  and opacity only.

## Verification

```bash
node tests/symptom-game.test.js

# No hardcoded values outside a documented one-off
grep -nE '#[0-9a-fA-F]{3,8}|[0-9]+px|[0-9]+ms|rgb\(|hsl\(' ui/components/**/*.css | grep -v 'var(--'

# No physical directions
grep -rnE 'margin-left|margin-right|padding-left|padding-right|border-left|border-right|text-align:\s*(left|right)' ui/

# No external requests from styles or markup
grep -rnE 'https?://|@import|cdn\.' ui/ --include=*.css --include=*.html
```

The SVG namespace URI in `body-map.js` is an expected hit on the last one and
is not a request.

In a browser, before shipping a screen:

1. Renders in `med` and `crt`.
2. Renders under `dir="rtl"` with the figure not mirrored. A body is not a text
   direction; the chrome around it is.
3. No animation under `prefers-reduced-motion` or `data-motion="reduced"`.
4. Every interactive element keyboard reachable with a visible focus ring.
5. Tap targets at least 44px on the short axis.

### Tap targets on the body map

A whole body is tall and thin and the area a phone gives it is nearly square,
so the figure is height-bound and the width goes unused. Left alone that puts
25 of 26 zones under 44px on the short axis, the neck at 19px.

Two things carry the fix. The svg stretches to the whole area and lets
`preserveAspectRatio` centre the figure, rather than the CSS centring a box
capped at its intrinsic size. And `ZOOMS` crops the viewBox to one area at a
time, which spends the spare width: every region clears 44px in at least one
crop, with the whole-body view kept as the default for orientation.

Three things about the crops are load-bearing:

- **Every crop is centred on the body centre line.** `getBBox` reports a
  mirrored shape in its authored coordinates, so an off-centre crop would keep
  one arm and drop the other. A test asserts it.
- **Shapes outside the crop are marked inert** (`tabindex="-1"`,
  `aria-hidden`, no pointer events). They are clipped but still in the tree,
  and without this a keyboard tabs onto zones nobody can see.
- **That pass runs a frame after mounting.** `getBBox` returns zeros on a
  detached element, which reads as "outside the crop" for every shape and
  takes the whole figure out of the tab order.

Marks are stored in whole-body coordinates and mapped into the current crop
when drawn, so a mark made while zoomed keeps its anatomical spot. They are
drawn inside the svg rather than as an overlay: the svg letterboxes its own
contents, so a percentage of the element box is not a percentage of the
figure.

`tests/audit.html` measures tap targets, contrast, accessible names and
overflow across every route, all three themes, and four viewport sizes. It
plants a known-bad node first and reports the run as meaningless if the checker
fails to catch it.

## Offline

`sw.js` precaches the app shell and every module. Two strategies, because one
does not fit both cases:

- **The page is network first.** It decides which version of everything else
  loads, so it is never served stale while there is a network.
- **Assets are served from cache and refreshed in the background.** Network
  first here costs a failed connection per module before the fallback, across
  forty nine of them. Measured cold offline start: 8.9 seconds that way, 0 ms
  this way.

The trade is that an asset can be one load behind. The page referencing it is
not, and `VERSION` clears the cache when the file list changes.

The background refresh asks the server with `cache: 'no-cache'` rather than
fetching plainly. A plain fetch is answered by the HTTP cache, and Pages serves
these files with a ten minute `max-age`, so the refresh was handed back the
copy already held and wrote it straight back. An installed copy never picked up
a change at all, at any point, and only a `VERSION` bump moved anyone. It looks
like the cache working normally, which is what made it hard to see.

Cross-origin requests are never intercepted, so the weather and translation
endpoints are never replayed from a cache.

### Working on the app with a worker installed

The worker serves assets from its cache, ahead of the network and ahead of any
header the dev server sends. An edit to a module therefore does nothing at all
until the cache updates, which looks exactly like a change that did not work.

Clear it before trusting what is on screen:

```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister());
(await caches.keys()).forEach(k => caches.delete(k));
```

DevTools offers the same under Application, with "Bypass for network".

## Development server

`scripts/serve.py` sends `Cache-Control: no-store` and strips `Last-Modified`.
The stock `http.server` handler honours `If-Modified-Since`, so a browser keeps
an ES module across an edit and the page silently runs stale code. That failure
mode is near-invisible and costs hours.
