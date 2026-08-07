# Contributing

## Running it

```bash
python scripts/serve.py 8100
```

Open `http://localhost:8100/`. Any static file server works; ES modules
just refuse to load over `file://`.

## Running the tests

```bash
node tests/symptom-game.test.js
```

No framework. It fails loudly if the body map, the flow, the triage logic,
or the wording constraints break. `tests/audit.html`, `fit.html`, and
`i18n.html` are manual check pages, open them in a browser after changes
that touch those areas.

## Before opening a PR

- No new dependencies. The point of this project is that it has none.
- If you touch a triage rule (Wells, Alvarado, Ottawa, SNNOOP10, etc.), cite
  the source you used in the PR description.
- If you add or change user-facing text, check that it still reads in at
  least one non-English locale under `src/i18n` or `docs`, since strings get
  translated on-device and length assumptions break layouts.
- Red flag logic is a hard override, not a score. Don't fold it into the
  ranking.

## Reporting a bug

Say what you expected, what happened, and which screen or triage flow it was
on. If it's a wrong or missing clinical rule, a link to the source you're
comparing against is more useful than a screenshot.
