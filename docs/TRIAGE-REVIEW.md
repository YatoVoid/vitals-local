# Triage review

Findings from reading `src/triage/` against its own engine, with the
measurement behind each one, worst first by what a wrong answer costs the
person reading it rather than by effort.

Sections 1 and 2 are done. The rest stand.

Figures come from simulating sessions against the real banks and the real
engine. Answers are picked uniformly at random, which is not how anyone
answers, so the percentages measure how exposed a mechanism is rather than how
often it bites a real person. The mechanisms themselves are read from the code
and are not statistical.

## What already works

Worth stating first, because most of what follows is criticism.

The arithmetic is sound. Likelihood ratios in odds form, bounded so no single
answer can pin a candidate at zero or certainty, and the next question chosen
by how much it is expected to narrow the field. Fed a textbook typical angina
history, the chest bank puts heart artery narrowing on top with the rest well
behind, and names the three answers that did the work.

Red flags are hard rules checked after every answer and no score can override
them. The head bank is built the way all five should be: every red flag rides
on a question the engine is obliged to ask.

## 1. Red flag inputs the engine is free never to ask (fixed)

The most serious finding.

Every bank holds 11 to 14 questions behind a cap of 9. After the screening
questions, the engine picks whichever question best separates the leading
causes. A question that exists only to feed a red flag usually separates
nothing, so it loses that comparison every time and is never asked.

Nine red flags across four banks depend on such a question:

| Bank | Red flag | Depends on | Unasked in |
|---|---|---|---|
| chest | rf.chest.pe | q.legs | 80% |
| chest | rf.chest.rest-pain | q.rest | 74% |
| chest | rf.chest.infection | q.fever | 40% |
| abdomen | rf.abdo.gynae-sudden | q.cycle | 96% |
| abdomen | rf.abdo.peritonitis, rf.abdo.stone-fever | q.position | 52% |
| abdomen | rf.abdo.pyelonephritis | q.urine | 39% |
| back | rf.back.foot-drop | q.weakness | 92% |
| limb | rf.limb.dvt | q.immobile, q.calf | 95%, 65% |
| limb | rf.limb.no-use | q.warmup | 9% |

Percentages are over sessions that ended without any flag firing, so they are
the cases where a missed input mattered.

A red flag whose input is never collected cannot fire. The rule is written,
reviewed and tested, and is dead in most sessions.

Nothing in the test suite could see this, which is how nine of them
accumulated.

Fixed by reserving the end of the budget. Free choice keeps the early slots,
where it is worth most, and once only as many questions remain as there are
outstanding flag inputs, those take the rest. The confidence gate cannot end a
session while any are pending. Re-measured across the same simulation, every
flag input is now reached in every session that ends without a flag.

The test is worth more than the nine corrections, and it exists now: it walks
every bank, ignores questions gated behind an answer nobody gave, and fails on
any flag left depending on a question the engine may never reach.

## 2. How the next question is chosen (changed)

The old measure scored a question on the single option that spread the
leading five candidates furthest apart. That rewarded a question with one
very telling answer nobody was likely to give, ignored how probable each
answer was, and could not see a question that ruled out four unlikely
causes at once.

It now scores the expected drop in entropy across the whole field. Measured
at a fixed question budget, against a simulated person whose answers are
sampled from the likelihood ratios of one true cause:

| Questions asked | 2 | 3 | 4 | 5 | 6 | 8 |
|---|---|---|---|---|---|---|
| Widest spread | 24.9 | 27.1 | 31.5 | 35.3 | 39.5 | 43.0 |
| Information gain | 26.3 | 30.4 | 33.5 | 35.8 | 40.2 | 45.0 |

Better at every budget and by the most early on, which is where it counts.

Worth knowing what this cannot fix. Asking every question in a bank, with
no budget at all, reaches 47 percent. Selection already reaches 44. The
ceiling is set by how well the likelihood ratios separate the causes, not
by the order questions are put in, so further gains have to come from the
banks rather than from the engine.

## 3. Advice that never says when

26 of 42 causes say what is needed and never when:

- `back/fracture` (Vertebral fracture): *Needs imaging rather than management at home.*
- `limb/fracture` (Broken bone): *Needs an x-ray rather than a wait and see.*
- `back/infection-tumour`: *This is an investigation pathway, not a self care one.*

Someone reading "Broken bone" needs to know whether that means today. The red
flag path speaks in exactly these terms and the ranked results do not.

This applies to the reassuring causes too. "It usually settles over two to six
weeks" is only safe next to what would change that.

## 4. Age and sex are not in the arithmetic

Priors are fixed per bank. The same answers give the same ranking at 22 and at
72.

For chest pain this is the largest single source of imprecision in the app. An
angina prior of 0.11 is roughly a middle-aged primary care figure, far too high
for a young adult and too low for an older one. Sex matters as well, for chest
and abdomen both.

The profile already holds age and sex, and both are optional, so any change
must leave the engine working unchanged when they are absent.

## 5. Questions that are missing

**Chest: is this new, or getting easier to bring on.** The bank asks how this
episode started but never whether the pattern is new or crescendo. New onset
and worsening exertional pain are treated as urgent. The typical angina script
above produced no red flag and a routine booking, which is right for long
standing stable angina and wrong for a first episode this week. This is the
highest value addition available.

**Abdomen: could you be pregnant.** No bank asks. For lower abdominal pain in
someone of childbearing age, ectopic pregnancy is the can't-miss, and the only
nearby question goes unasked in 96% of sessions.

## 6. A candidate no answer can touch

`head/dehydration` carries a prior of 0.07 and is named by no likelihood ratio
anywhere in the head bank. Nothing anyone answers can raise or lower it; it
moves only as the others do. It should earn its place with evidence that
separates it, or come out.

## 7. Answers for people whose answer is not listed

Five of 62 questions offer one. Thirteen questions are binary.

`q.press` tells the person to press the sore spot. If they will not or cannot,
all three answers carry likelihood ratios, and "Nothing changes" pushes toward
angina and away from the chest wall. A finding is recorded that was never
observed.

Skip already carries the right semantics, applying no evidence at all. The gap
is that a person facing an instruction they cannot follow has no reason to know
that skip is the button for it.

Separately, two options carry no likelihood ratio and so cost a question and
move nothing: `abdomen q.position` "No difference" and `back q.morning` "None".
Both answers genuinely carry information and should have ratios rather than
being removed.

## 8. The progress meter

The meter targets 7 questions. Sessions that do not hit a red flag run to the
cap of 9 in every bank, median and minimum alike. The bar sits full for the
last two questions.

That the cap is always reached is the more interesting half: it suggests the
confidence gate is not being reached in practice, which is worth confirming
before tuning the meter around it.

## Method

```
node --input-type=module -e "..."   against src/triage/index.js
```

4000 sessions per bank for the reachability figures, 3000 for session length,
answers uniform at random from a fixed seed. Structural findings, the
unreachable candidate, the missing ratios, the escape option counts, come from
walking the banks directly and do not depend on the simulation.
