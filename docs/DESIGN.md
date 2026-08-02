# Design

The person using this is often worried and on a phone late at night. The
interface earns trust by being exact, not by being soothing.

## Themes

Three themes share one skeleton. Layout, spacing and component structure never
change between them; only colour, type, overlay and radius do.

| Theme | `data-theme` | Character |
|---|---|---|
| Soft | `kawaii` (default) | Warm cream ground, white cards, dusty sakura accent, generous radii, sentence case. A Japanese cute register rather than an instrument panel: no glow, no scanlines, no viewfinder ticks. |
| Blue neon | `neon` | Near-black cool ground, ice-cyan hairlines, tight radii, wide-tracked mono labels. Precision and negative space carry it, not glow. |
| Retro CRT | `crt` | Phosphor green readout, scanlines, bloom, zero radius, mono throughout. |

`neon` was called `med` before the themes were named. Anyone holding the old
value is moved across on read rather than reset, so a choice already made is
not taken away.

Adding a theme means defining the whole token set. A test compares each block
against the others and fails on anything missing, because a half defined theme
renders as a half styled screen rather than as an error.

**Red is reserved for urgency and appears nowhere else.** This is why red was
rejected as an accent: if red is ambient chrome, a red-flag card can no longer
stop anyone.

All tokens live in `ui/themes/tokens.css`. Component files read variables and
never redefine colour.

## Rules

1. **Colour means severity.** The page is achromatic apart from the theme
   accent on the active element. Amber means soon, red means now. This holds
   on the light theme too, which is why its accent is a deep dusty rose rather
   than the pale pink it fills with: an accent has to carry text.
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

An eyebrow is decoration and sits quietly above a heading that carries the
meaning: tracked mono, micro size.

A field label is not decoration. It names something a person has to answer, so
it reads at body size in the body face, at full brightness, in sentence case.
Tracked mono at eleven pixels is a heads-up-display flourish and the wrong tool
for a question.

Tracked uppercase is switched off wholesale for scripts where it is unreadable,
driven by `data-caps` on the root rather than a rule per component.

### Fonts

The mockups ask for Chakra Petch, Manrope and IBM Plex. Those are Google Fonts
and the app must run with the network off, so the build uses a system stack. To
change that, drop WOFF2 files into `ui/assets/fonts/` and add one `@font-face`
block at the top of `tokens.css`. No other file changes.

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

**Tone by theme.** Same meaning, different rhythm:

- `med`: *Does the pain change when you move?* / *Saved. Three entries today.*
- `crt`: *MOVEMENT CHANGES PAIN? [Y] [N] [SOMETIMES]* / *ENTRY LOGGED, 3 TODAY*

## Reference material

The original specification and mockups are kept outside this repository. They
depend on a viewer runtime that has no place in a build with no dependencies,
and everything they settled is recorded above.
