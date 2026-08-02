/* Food and nutrition.
 *
 * Written against positions that guideline bodies and systematic reviews
 * agree on, and against the specific claims that circulate online. Where the
 * evidence is weak, that is stated rather than smoothed over. No brand is
 * named anywhere, and nothing here recommends a product.
 */

export const FOOD = [
  {
    id: 'protein',
    title: 'How much protein you actually need',
    category: 'Food',
    tags: ['protein', 'muscle', 'gym', 'powder', 'shake', 'grams', 'kidney'],
    summary: 'Most people already eat enough. Athletes need more than the '
           + 'minimum but far less than the supplement aisle implies.',
    basis: 'Dietary reference intakes and position stands from sports '
         + 'nutrition bodies.',
    sections: [
      ['The numbers',
        'The reference intake is about 0.8 grams per kilogram of body weight a '
        + 'day, which is the amount that prevents deficiency, not the amount '
        + 'that is optimal. For someone training seriously, the range that '
        + 'appears repeatedly in the literature is 1.4 to 2.0 grams per '
        + 'kilogram. Above roughly 2.2 there is no measured further benefit '
        + 'for muscle, in any study that controlled calories.'],
      ['What that looks like on a plate',
        'An 80 kg person training hard needs somewhere near 130 grams a day. '
        + 'That is achievable with three normal meals: eggs and yoghurt at '
        + 'breakfast, chicken or lentils at lunch, fish or beans at dinner. '
        + 'No powder required. Powder is convenient, not superior.'],
      ['Timing matters less than people say',
        'The anabolic window was thought to be about an hour after training. '
        + 'Better controlled work put it at several hours, and total daily '
        + 'intake explains far more of the outcome than timing does. Spreading '
        + 'protein across three or four meals is slightly better than one '
        + 'large hit, and that is roughly the size of the effect.'],
      ['Plant versus animal',
        'Plant proteins are individually lower in one or another essential '
        + 'amino acid, so a plant based diet needs a bit more total protein '
        + 'and some variety across the day. Mixing legumes with grains covers '
        + 'it. The old advice to combine them within one meal turned out to be '
        + 'unnecessary; across the day is enough.'],
      ['The kidney claim',
        'High protein damaging healthy kidneys is not supported. Trials in '
        + 'people with normal kidney function show no harm at intakes well '
        + 'above the reference. It is a real concern in people who already '
        + 'have kidney disease, which is where the advice originated and where '
        + 'it still belongs.'],
    ],
  },
  {
    id: 'ultra-processed',
    title: 'What ultra processed actually means',
    category: 'Food',
    tags: ['processed', 'upf', 'additives', 'nova', 'packaged', 'clean eating'],
    summary: 'A useful category that has been stretched past what it can carry. '
           + 'The strongest evidence is about how much you eat, not chemicals.',
    basis: 'The NOVA classification and controlled feeding studies comparing '
         + 'processed and unprocessed diets matched for nutrients.',
    sections: [
      ['The definition',
        'Ultra processed describes formulations made mostly from substances '
        + 'extracted from foods, plus additives, with little intact food left. '
        + 'It is a description of manufacturing, not of nutrition. That is why '
        + 'the category catches both a fizzy drink and a wholemeal supermarket '
        + 'loaf, which annoys people on both sides of the argument.'],
      ['What the best study found',
        'A controlled trial where people lived in a research unit and were '
        + 'offered either processed or unprocessed meals, matched for calories, '
        + 'sugar, fat, fibre and sodium, found the processed group ate about '
        + '500 kcal a day more and gained weight. They ate faster. That is the '
        + 'clearest signal there is, and it points at eating rate and how easy '
        + 'the food is to overeat rather than at any additive.'],
      ['What is not established',
        'Specific additives causing specific diseases at the amounts present '
        + 'in food is mostly not established. Emulsifiers and artificial '
        + 'sweeteners have interesting animal data and weak human data. That '
        + 'is worth watching, not worth panicking over.'],
      ['The useful version',
        'If a food is easy to eat quickly and hard to stop eating, it will '
        + 'probably push your intake up. That is a more useful test than '
        + 'checking whether a word on the label sounds like a chemical. '
        + 'Everything is a chemical, including water.'],
    ],
  },
  {
    id: 'sugar',
    title: 'Sugar, and what it does not do',
    category: 'Food',
    tags: ['sugar', 'glucose', 'fructose', 'diabetes', 'cancer', 'detox', 'carbs'],
    summary: 'Too much added sugar matters for teeth, weight and liver fat. '
           + 'It does not feed tumours in any special way.',
    basis: 'Guideline positions on free sugars and metabolic research on '
         + 'fructose and liver fat.',
    sections: [
      ['The actual concerns',
        'Free sugars raise the risk of tooth decay directly, add calories that '
        + 'do not make you feel full, and in large amounts drive fat '
        + 'accumulation in the liver. Guidelines converge on keeping free '
        + 'sugars under about ten percent of energy, with further benefit '
        + 'below five.'],
      ['Sugar does not feed cancer',
        'Every cell in your body runs on glucose, including healthy ones. '
        + 'Tumours use more of it, which is how a PET scan works, but cutting '
        + 'dietary sugar does not starve them: your liver makes glucose from '
        + 'other sources and blood glucose stays in a narrow range regardless. '
        + 'The real link is indirect and runs through obesity, which does '
        + 'raise risk for several cancers.'],
      ['Fruit is not the problem',
        'Sugar inside intact fruit arrives with water and fibre, is eaten '
        + 'slowly, and behaves differently from the same amount in a drink. '
        + 'No cohort study has found whole fruit to be harmful. Fruit juice '
        + 'sits closer to the drink end.'],
      ['Brown sugar, honey, agave',
        'Nutritionally these are close enough to identical that the difference '
        + 'does not matter at the amounts anyone eats. Honey has trace '
        + 'compounds. Agave is higher in fructose than table sugar, which is '
        + 'the opposite of how it is usually sold.'],
    ],
  },
  {
    id: 'fibre',
    title: 'Fibre, the one most people are short of',
    category: 'Food',
    tags: ['fibre', 'fiber', 'gut', 'microbiome', 'constipation', 'bowel'],
    summary: 'One of the few dietary changes with consistent large effects. '
           + 'Most people eat around half of what is recommended.',
    basis: 'Dose response meta-analyses of fibre intake against mortality, '
         + 'heart disease, and bowel cancer.',
    sections: [
      ['The size of the effect',
        'A large series of meta-analyses found that going from low to high '
        + 'fibre intake was associated with meaningful reductions in death '
        + 'from any cause, heart disease, type 2 diabetes and bowel cancer, '
        + 'with the curve still improving up to about 25 to 30 grams a day. '
        + 'Most adults eat around 15 to 20.'],
      ['Where it comes from',
        'Whole grains, legumes, vegetables, fruit, nuts. Legumes are the '
        + 'densest and the most skipped. A tin of beans adds roughly 10 grams '
        + 'and costs almost nothing.'],
      ['Two kinds, both useful',
        'Soluble fibre forms a gel and slows absorption, which helps blood '
        + 'glucose and cholesterol. Insoluble fibre adds bulk and speed, which '
        + 'helps constipation. Real foods contain both, so the distinction '
        + 'matters mainly when choosing a supplement, not a meal.'],
      ['Increase it slowly',
        'Going from 15 to 30 grams overnight causes bloating and wind, which '
        + 'is why people conclude fibre disagrees with them. Add about 5 grams '
        + 'a week and drink more water alongside. Fibre without fluid makes '
        + 'constipation worse, not better.'],
    ],
  },
  {
    id: 'salt',
    title: 'Salt, blood pressure, and who it matters for',
    category: 'Food',
    tags: ['salt', 'sodium', 'blood pressure', 'hypertension', 'himalayan'],
    summary: 'Cutting salt lowers blood pressure on average. The size varies a '
           + 'lot between people, and pink salt is still salt.',
    basis: 'Meta-analyses of sodium reduction trials and population intake data.',
    sections: [
      ['The average effect',
        'Reducing sodium lowers blood pressure by a few points on average, '
        + 'more in people who already have high blood pressure and more with '
        + 'age. Most guidelines land near 5 to 6 grams of salt a day, which is '
        + 'about a teaspoon, and most countries eat well above that.'],
      ['Most of it is not the salt shaker',
        'In countries with a lot of packaged food, roughly three quarters of '
        + 'intake is already in the food when you buy it. Bread, processed '
        + 'meat, sauces and cheese contribute more than cooking does. Cooking '
        + 'from raw ingredients with a generous hand still lands you lower '
        + 'than eating packaged food with none added.'],
      ['Pink, sea and rock salt',
        'All are around 98 percent sodium chloride. The trace minerals are '
        + 'present in amounts too small to affect anything. They differ in '
        + 'crystal size, which changes how salty a pinch tastes, and that is '
        + 'the whole story.'],
      ['Who should be careful cutting it',
        'People on certain blood pressure or heart failure medications, and '
        + 'anyone with low blood sodium, should not make large changes without '
        + 'checking. Very low intakes are not automatically better.'],
    ],
  },
  {
    id: 'supplements',
    title: 'Which supplements have evidence',
    category: 'Food',
    tags: ['supplements', 'vitamins', 'multivitamin', 'creatine', 'omega', 'zinc', 'magnesium'],
    summary: 'A short list works for specific situations. The rest sells well '
           + 'and does little in people who eat reasonably.',
    basis: 'Systematic reviews of supplementation trials with clinical rather '
         + 'than blood marker endpoints.',
    sections: [
      ['The ones with real support',
        'Vitamin D where sunlight is limited, particularly at higher latitudes '
        + 'in winter, in darker skin, and in anyone housebound. Folic acid '
        + 'before and during early pregnancy, where the effect on neural tube '
        + 'defects is large and well established. Vitamin B12 on a vegan diet, '
        + 'where deficiency is a matter of time rather than chance. Iron where '
        + 'a blood test has shown deficiency, and not otherwise. Creatine for '
        + 'strength and power training, which is among the most studied sports '
        + 'supplements and does what it claims.'],
      ['The ones that mostly do not',
        'Multivitamins in well fed people have not reduced heart disease, '
        + 'cancer or death in large trials. Antioxidant supplements have '
        + 'performed worse than placebo in several cancer prevention trials, '
        + 'which surprised everyone and is worth remembering before treating '
        + '"antioxidant" as a synonym for good. Omega 3 capsules for heart '
        + 'protection have looked steadily weaker as trials got larger, though '
        + 'eating fish still tracks well.'],
      ['The regulation gap',
        'In most countries supplements are not tested for effect before sale, '
        + 'and content can differ from the label. Products marketed for muscle '
        + 'or weight loss have repeatedly been found to contain undeclared '
        + 'pharmaceuticals. Anything promising a dramatic result deserves '
        + 'suspicion in proportion to the promise.'],
      ['A test before a bottle',
        'For iron, vitamin D and B12, a blood test tells you whether you need '
        + 'anything and how much. Guessing is how people end up taking iron '
        + 'they do not need, which is not harmless.'],
    ],
  },
  {
    id: 'diets',
    title: 'Why every diet works and then stops',
    category: 'Food',
    tags: ['diet', 'keto', 'fasting', 'low carb', 'weight loss', 'calories', 'metabolism'],
    summary: 'Head to head trials keep finding the same thing: the diet you '
           + 'stick to wins, and adherence is what differs between people.',
    basis: 'Randomised trials comparing named diets over 12 months or longer.',
    sections: [
      ['The consistent finding',
        'Trials comparing low carbohydrate against low fat, matched for '
        + 'calories and run for a year, keep landing within a couple of '
        + 'kilograms of each other, with wide variation between people '
        + 'inside each group. The between person variation dwarfs the between '
        + 'diet variation. That is the actual result, and it has been '
        + 'replicated enough to trust.'],
      ['Fasting patterns',
        'Time restricted eating and alternate day approaches produce weight '
        + 'loss roughly equal to continuous calorie restriction, when calories '
        + 'end up matched. They suit people who find one rule easier than daily '
        + 'arithmetic. The claimed metabolic benefits beyond weight loss have '
        + 'been inconsistent in humans.'],
      ['The metabolism question',
        'Metabolic rate does drop with weight loss, by more than the loss of '
        + 'tissue alone predicts. That is real and it is why maintenance is '
        + 'harder than loss. It is not the same as a metabolism being '
        + '"damaged" or "starvation mode" stopping loss entirely, which does '
        + 'not happen in a calorie deficit.'],
      ['What predicts keeping it off',
        'Regular physical activity, regular self weighing, eating breakfast '
        + 'consistently, and a stable routine appear repeatedly in registries '
        + 'of people who maintained a loss for years. Notably, no particular '
        + 'macronutrient split appears.'],
    ],
  },
  {
    id: 'alcohol',
    title: 'Alcohol, and the death of the J curve',
    category: 'Food',
    tags: ['alcohol', 'wine', 'drinking', 'liver', 'hangover', 'red wine'],
    summary: 'The idea that moderate drinking protects the heart has not '
           + 'survived better study design. Risk starts low and rises steadily.',
    basis: 'Mendelian randomisation studies and reanalyses correcting for '
         + 'former drinkers being counted as abstainers.',
    sections: [
      ['Why the old finding was wrong',
        'The famous curve showing light drinkers outliving abstainers had a '
        + 'flaw: the abstainer group contained people who had stopped drinking '
        + 'because they were already ill. Studies using genetic variants that '
        + 'affect alcohol tolerance, which are not subject to that confounding, '
        + 'find no protective level for the heart.'],
      ['The cancer link is not new',
        'Alcohol is classed as a group 1 carcinogen, the same category as '
        + 'tobacco, which describes certainty of the link rather than size of '
        + 'the risk. It raises risk of mouth, throat, oesophagus, liver, bowel '
        + 'and breast cancer. The breast cancer association appears at low '
        + 'intakes, which is the part least widely known.'],
      ['What a hangover actually is',
        'Dehydration is part of it and not most of it. Acetaldehyde, '
        + 'inflammation, disturbed sleep architecture and a rebound in '
        + 'excitatory signalling all contribute. That is why water alone does '
        + 'not fix one, and why the sleep after drinking is unrefreshing even '
        + 'when it is long.'],
      ['Practical framing',
        'Risk rises with total amount over time, not just with single heavy '
        + 'episodes, though those add their own. Several drink free days a '
        + 'week reduces total intake more reliably than trying to drink less '
        + 'on every occasion.'],
    ],
  },
];
