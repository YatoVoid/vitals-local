# Design

The person using this is often worried and on a phone late at night. The
interface earns trust by being exact, not by being soothing.

## Themes

Two themes share one skeleton. Layout, spacing and component structure never
change between them; only colour does.

| Theme | `data-theme` | Character |
|---|---|---|
| Light | `light` (default) | A printed patient leaflet. White paper, black type, one clinical blue, hairline rules, small radii. |
| Dark | `dark` | The same leaflet for reading at night. Charcoal ground, off-white type, a lighter blue. |

Older versions had three themes. A saved `kawaii` maps to `light`, and `med`,
`neon` or `crt` map to `dark`, so a choice already made is moved across rather
than reset.

Adding a theme means defining the whole token set. A test compares the blocks
and fails on anything missing, because a half defined theme renders as a half
styled screen rather than as an error.

**Red is reserved for urgency and appears nowhere else.** This is why red was
rejected as an accent: if red is ambient chrome, a red-flag card can no longer
stop anyone.

All tokens live in `ui/themes/tokens.css`. Component files read variables and
never redefine colour.

## Rules

1. **Colour means severity.** The page is achromatic apart from the blue on
   the active element. Amber means soon, red means now. The blue is dark
   enough to carry text, not only fills.
2. **No hardcoded values.** Every colour, radius, duration, space and size
   comes from a `var(--token)`. A genuine one-off carries a comment saying why
   no token fits.
3. **Logical properties only.** `inline-start`, `margin-inline`,
   `padding-block`. Never `left` or `right`. Verified under `dir="rtl"`.
4. **No dependencies.** No framework, no build step, no CDN, no external
   request from styles or markup.
5. **Touch first.** Targets clear 44px. No hover-only affordance. Single column
   at every width; second columns are opt-in and collapse on their own.
6. **Motion serves, then stops.** Under 260ms, transform and opacity only,
   never on text mid-read, fully off under reduced motion.
7. **Accessibility floor.** Visible focus, labelled controls, keyboard
   traversal, announced state changes, 4.5:1 for body text and 3:1 for large
   text and rules, measured in both themes.

## Typography

One system sans for everything, so the twenty supported languages render in
a face the device already has. Numbers use tabular figures so columns of
values line up.

A field label names something a person has to answer, so it reads at body
size, at full brightness, in sentence case. Small section labels above a
heading stay plain sentence case too; nothing is tracked or set in uppercase.

The app runs with the network off, so there are no web fonts. To add one,
drop WOFF2 files into `ui/assets/fonts/` and add one `@font-face` block at the
top of `tokens.css`. No other file changes.

## Writing

**Never write:** comprehensive, journey, empower, holistic, optimize, leverage,
unlock, seamless, robust, boost, detox, superfood, "it is worth noting", "keep
in mind", "please note", "consult a healthcare professional", "may potentially
indicate", "symptoms may vary", "individuals", "utilize".

**Instead:** what happens, to whom, when. "See a doctor this week." "Go to
emergency now." "This often comes from the gut wall."

**Mechanics:** one idea per sentence, vary how sentences open, second person
for instructions, active voice, digits for numbers, no em dash, no exclamation
marks, sentence case headings.

**Choice labels:** two words where possible. Enforced by the test suite.

**The red-flag button reads exactly:** `Get urgent help`

## Reference material

The original specification and mockups are kept outside this repository. They
depend on a viewer runtime that has no place in a build with no dependencies,
and everything they settled is recorded above.
