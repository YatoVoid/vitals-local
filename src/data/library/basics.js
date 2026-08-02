/* Foundations: what cancer is, what moves risk, and how to read a health
 * claim without needing a statistics degree.
 */

export const BASICS = [
  {
    id: 'cancer',
    title: 'What cancer is',
    category: 'Basics',
    tags: ['cancer', 'tumour', 'stage', 'metastasis', 'cells', 'dna'],
    summary: 'A cell copies itself wrong, keeps the mistake, and keeps '
           + 'dividing. Everything else is detail about where and how fast.',
    basis: 'Standard cancer biology and staging descriptions used by cancer '
         + 'registries.',
    sections: [
      ['How a cell goes wrong',
        'Every division copies about three billion letters of DNA. Errors '
        + 'happen constantly and almost all are repaired, or the cell shuts '
        + 'itself down. Cancer starts when errors land in the genes that do the '
        + 'repairing and the shutting down, so the next error is kept instead '
        + 'of corrected.'],
      ['What a tumour is',
        'A mass of those cells plus the blood vessels they recruited to feed '
        + 'themselves. Benign means it stays where it started and pushes tissue '
        + 'aside. Malignant means it breaks through the boundary and can '
        + 'travel.'],
      ['What stage describes',
        'Three things: how large it is, whether it has reached nearby lymph '
        + 'nodes, and whether it has appeared somewhere distant. Stage '
        + 'describes spread at one moment. It is not a prediction about a '
        + 'person.'],
      ['Why early matters so much',
        'While it is local, removing it can end the problem. Once cells have '
        + 'travelled, treatment has to reach the whole body. That difference is '
        + 'the entire argument for screening.'],
      ['What it is not',
        'It is not one disease. Breast, blood and brain cancers behave so '
        + 'differently that a treatment for one is often useless for another. '
        + 'That is why a single cure has never been plausible.'],
    ],
  },
  {
    id: 'prevention',
    title: 'What actually moves cancer risk',
    category: 'Basics',
    tags: ['prevention', 'risk', 'smoking', 'alcohol', 'weight', 'hpv', 'screening'],
    summary: 'A short list does most of the work. The rest is noise sold by '
           + 'people with something to sell.',
    basis: 'Attributable fraction estimates from cancer research bodies and '
         + 'guideline positions on modifiable risk factors.',
    sections: [
      ['Tobacco',
        'The largest single lever anyone has. Stopping at 40 recovers most of '
        + 'the lost life expectancy, and stopping at 60 still recovers years. '
        + 'The benefit begins within weeks and continues for decades.'],
      ['Alcohol',
        'Ethanol breaks down into acetaldehyde, which damages DNA directly. '
        + 'Risk rises with amount and there is no threshold below which it is '
        + 'zero. The association with breast cancer appears at low intakes and '
        + 'is the least widely known part.'],
      ['Body weight and movement',
        'Fat tissue is hormonally active and keeps insulin and oestrogen higher '
        + 'than they otherwise sit. The link is strongest for bowel, womb, and '
        + 'breast cancer after menopause. Activity lowers risk partly through '
        + 'weight and partly on its own.'],
      ['Infections that are preventable',
        'HPV, hepatitis B and C, and H pylori together account for a large '
        + 'share of cancer worldwide. Vaccination and treatment remove that '
        + 'share outright, which makes them the most cost effective prevention '
        + 'that exists.'],
      ['Screening, honestly',
        'Screening finds disease earlier in some people and finds harmless '
        + 'things in others, leading to treatment nobody needed. Programmes are '
        + 'designed around that trade off, which is why they target specific '
        + 'ages and intervals rather than testing everyone for everything.'],
      ['What does not move it',
        'No single food causes or prevents cancer. Sugar does not feed tumours '
        + 'in any way that differs from feeding every other cell. Detoxes '
        + 'remove nothing. Alkaline diets do not change blood pH.'],
    ],
  },
  {
    id: 'reading-claims',
    title: 'How to read a health claim',
    category: 'Basics',
    tags: ['evidence', 'study', 'relative risk', 'absolute', 'correlation', 'headline'],
    summary: 'Three questions dismantle most headlines. None of them require '
           + 'knowing any statistics.',
    basis: 'Standard epidemiological concepts: study design hierarchy, '
         + 'absolute versus relative risk, and confounding.',
    sections: [
      ['Question one: was it people?',
        'Cells in a dish and mice are where ideas start, not where they are '
        + 'confirmed. A compound that kills cancer cells in a dish tells you '
        + 'almost nothing, because bleach does that too. Ask what species, and '
        + 'how many.'],
      ['Question two: how much, compared with what anyone gets?',
        'Studies often use doses far above any realistic exposure. A finding at '
        + 'a hundred times the amount in food is a finding about that dose. It '
        + 'is not a finding about the food.'],
      ['Question three: relative or absolute?',
        'Doubling your risk means something very different at one in ten '
        + 'thousand than at one in ten. "Raises risk by 50 percent" is the '
        + 'relative figure and is almost always the one quoted, because it is '
        + 'the larger number. Ask what the risk was to begin with.'],
      ['Correlation and the usual trap',
        'People who take vitamins are also more likely to exercise, not smoke, '
        + 'and see a doctor. Untangling that is what a randomised trial is for, '
        + 'and it is why observational findings so often fail to replicate when '
        + 'someone finally runs the trial.'],
      ['Who paid, and does it show?',
        'Industry funded nutrition studies produce results favourable to the '
        + 'funder more often than independent ones. That does not make them '
        + 'wrong, but it changes how much weight a single study should carry.'],
      ['The quiet signal of a bad source',
        'One study cited with no context. A mechanism explained with confidence '
        + 'but no outcome data. A named enemy, usually an industry or the '
        + 'medical profession. And something to buy at the end.'],
    ],
  },
];
