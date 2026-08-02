# Vitals Local

A health reference and symptom triage app that runs entirely in the browser on
your own device. No account, no server, no telemetry.

Everything is stored locally. The app makes no outbound request except two you
choose to make: fetching local UV and air quality, and downloading a
translation model. Neither is required, and both can be left off.

## Running it

The app is built from ES modules, which browsers refuse to load over
`file://`. A static server is required.

```bash
python scripts/serve.py 8100
# then open http://localhost:8100/
```

On Windows, `start.cmd` does the same and opens a browser.

Any static file server works. There is no build step, no package manager, and
no dependencies.

## What it does

**Symptom triage.** A body map with front, back, left and right views, then an
adaptive question flow. Questions are chosen by how well they separate the
remaining explanations rather than asked from a fixed list. Red flags are hard
rules evaluated after every answer and cannot be overridden by a score. The
clinical logic is in `src/triage/` and cites the decision rules it implements:
Wells, Alvarado, Ottawa knee and ankle, SNNOOP10, POUND, and the national low
back pain red flags.

**Tracking.** Food, water, medicines, lab results, and pain episodes over time,
with the arithmetic behind every figure visible on tap.

**Library.** Around forty articles and a set of checked claims, searchable over
full text. Sourced from guideline bodies, systematic reviews and
pharmacopoeia. No blogs, no news write-ups, no industry-funded material, and
no product is named or recommended anywhere.

**Medicine comparison.** Compares two labels by active ingredient, so
paracetamol and acetaminophen resolve to the same molecule. It reports what is
on the label and never produces a dose.

**Outside.** UV index, burn estimate by skin type, and air quality. Works with
typed values if you would rather not share a location.

## Languages

Sixty-five languages, each listed in its own script. Interface text is
translated on the device by the browser's Translator API where a model exists,
and cached against a hash of the English so an update only re-translates
wording that actually changed. Where no on-device model exists, an opt-in
network service can be used for interface text only.

Lines that route someone to emergency care always show the English underneath
the translation. Machine translation is not reliable enough for those.

## Publishing

Every path is relative and there is no build step, so the folder can be served
as it stands. On GitHub Pages, set the source to the branch and folder holding
these files; the app is `index.html` at the root and works from a project
subpath (`user.github.io/vitals-local/`) as well as a domain root.

`sw.js` keeps a copy of the app so it starts with no network. The page itself
is fetched network first, so a deploy is never served stale; the modules it
loads are served from cache and refreshed in the background. **Bump `VERSION`
in `sw.js` when files are added or removed**, which is what clears the old
cache.

## Browser support

Chrome and Edge get on-device translation. Everything else works in any current
browser; without the Translator API the app stays in English unless network
translation is switched on.

## Privacy

Health data never leaves the device. The two optional requests carry only:

- **Weather:** coordinates of a city you picked, rounded to two decimals.
- **Translation:** the app's own interface text. Never anything you entered.

There is no analytics, no error reporting, and no third-party script.

## Layout

```
index.html               the application
sw.js                    offline cache
src/
  app/                   shell, routing, storage, shared builders
  data/                  article library, ingredients, places
  i18n/                  language table, translation cache, DOM walker
  screens/               one module per screen
  triage/                clinical question banks and the inference engine
ui/
  themes/tokens.css      colour, type, spacing, motion. Two themes.
  layout/                shell and screen-level CSS
  components/            symptom console
tests/                   node test suite and browser harnesses
docs/                    architecture and design notes
```

## Tests

```bash
node tests/symptom-game.test.js
```

Covers the body map side mapping, the zoom crops, question bank consistency,
clinical patterns landing where they should, the wording constraints, export
and import, and that every module parses.

Browser harnesses live in `tests/`:

- `audit.html` measures contrast, tap targets, accessible names and overflow
  across every route, both themes, and four viewport sizes. It plants a
  known-bad node first and refuses to report a clean run if the checker fails
  to catch it.
- `i18n.html` audits translation coverage per language.
- `fit.html` checks layout across viewport sizes.

## Licence

MIT. See [LICENSE](LICENSE).
