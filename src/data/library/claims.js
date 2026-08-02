/* Claims that circulate, checked.
 *
 * Each entry states the claim as it circulates, gives a verdict, and explains
 * the mechanism behind it rather than asserting the answer.
 *
 * Verdicts: false, mostly false, mixed, mostly true, true.
 */

export const CLAIMS = [
  {
    id: 'detox',
    title: 'Detox teas, juices and cleanses remove toxins',
    category: 'Claims',
    verdict: 'false',
    tags: ['detox', 'cleanse', 'juice', 'toxins', 'liver', 'colon'],
    summary: 'No product on sale has been shown to remove any named toxin. '
           + 'Most detox teas work by being a laxative.',
    basis: 'Reviews of commercial detox products found no product identified '
         + 'the toxin it removed or demonstrated removal.',
    sections: [
      ['The question nobody answers',
        'Ask which specific compound is being removed, and by what mechanism, '
        + 'and how that removal was measured. A review looking for exactly this '
        + 'across commercial detox products found none of them answered it. '
        + 'The word toxin is doing all the work and is never defined.'],
      ['What actually clears substances',
        'The liver converts fat soluble compounds into water soluble ones. The '
        + 'kidneys filter them out. Both run continuously and are not waiting '
        + 'for a juice. Where they fail, that is liver or kidney disease, and '
        + 'it is treated medically, not with tea.'],
      ['What the tea is doing',
        'Many detox teas contain senna or a similar stimulant laxative. The '
        + 'weight that comes off is stool and water and returns within days. '
        + 'Prolonged use can cause dependence and electrolyte disturbance, and '
        + 'has caused hospital admissions.'],
      ['Colon cleansing',
        'Colonic irrigation has caused perforation, infection and electrolyte '
        + 'disturbance. There is no accumulated matter lining the bowel to '
        + 'remove; that image comes from marketing, not from anatomy.'],
      ['The grain of truth',
        'Feeling better after a "cleanse" week is usually real. You also '
        + 'stopped drinking alcohol, ate more vegetables, slept more and drank '
        + 'more water. Those things work. The product is the least active '
        + 'ingredient in the week.'],
    ],
  },
  {
    id: 'alkaline',
    title: 'Alkaline water and alkaline diets change your body pH',
    category: 'Claims',
    verdict: 'false',
    tags: ['alkaline', 'ph', 'acid', 'water', 'lemon water', 'cancer'],
    summary: 'Blood pH is held between 7.35 and 7.45 regardless of diet. '
           + 'Moving it is a medical emergency, not a wellness goal.',
    basis: 'Basic acid base physiology and reviews of the acid ash hypothesis.',
    sections: [
      ['Why it cannot work',
        'Blood pH is defended by the lungs and kidneys within a range of about '
        + 'a tenth of a unit. Drift outside it causes confusion, arrhythmia and '
        + 'collapse. Nothing you drink moves it, because the buffering systems '
        + 'exist precisely to prevent that.'],
      ['What your stomach does to alkaline water',
        'Stomach acid sits near pH 1.5 to 3.5. Alkaline water is neutralised '
        + 'on arrival. That is the entire lifespan of the alkalinity.'],
      ['Urine pH does change',
        'This is the observation the claim is built on. Urine pH shifts with '
        + 'diet, because the kidney is excreting the load to keep blood stable. '
        + 'Changing urine pH is evidence the system is working, not evidence '
        + 'the body has been alkalised.'],
      ['The cancer version',
        'The claim that cancer cannot survive in an alkaline body inverts the '
        + 'biology. Tumours produce an acidic local environment as a '
        + 'consequence of their metabolism. You cannot reach that environment '
        + 'through diet, and it is a result rather than a cause.'],
      ['The grain of truth',
        'Diets described as alkaline are usually heavy in vegetables and light '
        + 'in processed meat and alcohol. That is a good diet. The reason it '
        + 'helps has nothing to do with pH.'],
    ],
  },
  {
    id: 'seed-oils',
    title: 'Seed oils cause inflammation and disease',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['seed oils', 'vegetable oil', 'omega 6', 'linoleic', 'inflammation', 'canola'],
    summary: 'Trials that actually fed people linoleic acid and measured '
           + 'inflammation did not find it rising.',
    basis: 'Systematic reviews of controlled trials measuring inflammatory '
         + 'markers after changing linoleic acid intake.',
    sections: [
      ['The theory',
        'Linoleic acid, an omega 6 fat abundant in seed oils, can be converted '
        + 'to arachidonic acid, which is a precursor to inflammatory signalling '
        + 'molecules. On paper, more in means more inflammation.'],
      ['What happened when it was tested',
        'Systematic reviews of controlled trials that increased linoleic acid '
        + 'and measured inflammatory markers found no meaningful increase. The '
        + 'conversion step is tightly regulated and does not scale with intake '
        + 'the way the theory assumed. This has been examined more than once '
        + 'with the same result.'],
      ['What the outcome data says',
        'Replacing saturated fat with polyunsaturated fat lowers cardiovascular '
        + 'events in pooled trial data. That is one of the more durable '
        + 'findings in nutrition, and it points the opposite way from the '
        + 'claim.'],
      ['Where the concern has some ground',
        'Repeatedly heated oil in commercial frying degrades and produces '
        + 'compounds that are genuinely undesirable. And seed oils are common '
        + 'in food that is easy to overeat, so intake correlates with a dietary '
        + 'pattern that does cause problems. Correlation with a pattern is not '
        + 'the same as the oil being the agent.'],
    ],
  },
  {
    id: 'microwave',
    title: 'Microwaves destroy nutrients and make food dangerous',
    category: 'Claims',
    verdict: 'false',
    tags: ['microwave', 'radiation', 'nutrients', 'cooking', 'plastic'],
    summary: 'Microwaving preserves nutrients better than most cooking, '
           + 'because it is fast and uses little water.',
    basis: 'Comparative studies of nutrient retention across cooking methods.',
    sections: [
      ['What a microwave does',
        'It makes water molecules rotate, which produces heat. That is '
        + 'non-ionising radiation, in the same broad family as radio waves. It '
        + 'does not make food radioactive and cannot alter atomic nuclei.'],
      ['Nutrient retention',
        'Heat and water are what destroy vitamins. Boiling leaches water '
        + 'soluble vitamins into water you pour away. Microwaving uses little '
        + 'water and short times, and in comparisons it retains vitamin C and '
        + 'folate as well as or better than boiling.'],
      ['The plastic point, which is real',
        'Heating food in plastic that is not rated for it can leach compounds '
        + 'into the food. That is a container problem, not a microwave problem, '
        + 'and it applies to any hot food in the wrong plastic. Use glass or '
        + 'ceramic and it disappears.'],
      ['Uneven heating is the actual risk',
        'Microwaves heat unevenly, which can leave cold spots where bacteria '
        + 'survive. Stir, let it stand, and check the middle. That is a genuine '
        + 'food safety point and the only one worth acting on.'],
    ],
  },
  {
    id: 'cracking-knuckles',
    title: 'Cracking your knuckles causes arthritis',
    category: 'Claims',
    verdict: 'false',
    tags: ['knuckles', 'cracking', 'arthritis', 'joints', 'popping'],
    summary: 'Studied repeatedly, including by one doctor who cracked only one '
           + 'hand for sixty years. No association found.',
    basis: 'Cohort studies comparing habitual crackers with non-crackers for '
         + 'radiographic arthritis.',
    sections: [
      ['What the sound is',
        'Imaging showed it is a gas cavity forming in the joint fluid as the '
        + 'joint is pulled apart, not bones grinding or anything tearing. The '
        + 'gap before you can crack it again is the gas redissolving.'],
      ['The evidence',
        'Studies comparing habitual crackers with non-crackers have not found '
        + 'more arthritis in the crackers. One physician cracked the knuckles '
        + 'of one hand only, for over sixty years, and compared the two hands. '
        + 'No difference. It is a small study, and it is also the most direct '
        + 'test anyone has run.'],
      ['What is possible',
        'One study suggested slightly reduced grip strength and more hand '
        + 'swelling in long term crackers, which has not been consistently '
        + 'replicated. Arthritis is the claim, and arthritis is not supported.'],
    ],
  },
  {
    id: 'natural-safe',
    title: 'Natural means safe, and chemicals mean dangerous',
    category: 'Claims',
    verdict: 'false',
    tags: ['natural', 'chemical free', 'herbal', 'organic', 'toxic', 'dose'],
    summary: 'Origin says nothing about safety. Dose and the specific compound '
           + 'are what matter.',
    basis: 'Basic toxicology, plus documented harm from herbal preparations.',
    sections: [
      ['Everything is chemicals',
        'Water is a chemical. So is caffeine, and so is the digitalis in '
        + 'foxglove that will stop a heart. Chemical free, printed on a product, '
        + 'is either meaningless or false.'],
      ['Natural things that hurt people',
        'Comfrey and kava have caused liver failure. Aristolochia caused kidney '
        + 'failure and urinary tract cancer in people using herbal weight loss '
        + 'preparations. St John’s wort induces liver enzymes and can '
        + 'silently make contraceptives, transplant drugs and some cancer '
        + 'treatments stop working. That last one is the most commonly missed '
        + 'interaction in the category.'],
      ['The dose point',
        'The oldest rule in toxicology is that the dose makes the poison. '
        + 'Water in enough volume causes fatal low sodium. Botulinum toxin is '
        + 'among the most poisonous substances known and is injected into faces '
        + 'weekly. The compound and the amount decide, never the origin story.'],
      ['Where it matters most',
        'Herbal products are not required to prove effect before sale in most '
        + 'places, and testing has repeatedly found contamination or '
        + 'undeclared pharmaceutical ingredients. Tell any doctor what you '
        + 'take, including the things you do not think count.'],
    ],
  },
  {
    id: 'sweating-toxins',
    title: 'Sweating detoxifies you',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['sweat', 'sauna', 'detox', 'toxins', 'hot yoga'],
    summary: 'Sweat is mostly water and salt. Excretion of anything meaningful '
           + 'through skin is a rounding error next to the kidneys.',
    basis: 'Measurements of heavy metal and persistent pollutant concentrations '
         + 'in sweat versus urine.',
    sections: [
      ['What is in sweat',
        'Water, sodium, chloride, potassium, urea and trace amounts of other '
        + 'things. Studies that measured heavy metals and persistent pollutants '
        + 'in sweat found them present in tiny quantities, orders of magnitude '
        + 'below what the kidneys clear over the same period.'],
      ['Why sauna might still be good',
        'Not through excretion. The cardiovascular load resembles mild '
        + 'exercise, and observational data associates regular use with better '
        + 'cardiovascular outcomes. That is a different mechanism and a '
        + 'different claim.'],
      ['The risk that gets ignored',
        'Heavy sweating without replacing fluid and salt causes dizziness, and '
        + 'in hot yoga and long sauna sessions it has caused collapse. Drink '
        + 'and replace salt if you sweat a lot.'],
    ],
  },
  {
    id: 'antibiotics-cold',
    title: 'Antibiotics will help my cold get better faster',
    category: 'Claims',
    verdict: 'false',
    tags: ['antibiotics', 'cold', 'flu', 'virus', 'green mucus', 'resistance'],
    summary: 'Colds are viral. Antibiotics do nothing to viruses, and taking '
           + 'them anyway carries real costs.',
    basis: 'Antimicrobial stewardship guidance and trials of antibiotics in '
         + 'upper respiratory infection.',
    sections: [
      ['The mismatch',
        'Antibiotics interfere with bacterial machinery that viruses do not '
        + 'have. A cold is caused by viruses in the great majority of cases, so '
        + 'there is nothing for the drug to act on.'],
      ['Green mucus does not mean bacteria',
        'The colour comes from an enzyme released by your own white cells. It '
        + 'appears in ordinary viral colds and is not a signal to prescribe. '
        + 'This one belief drives a large share of unnecessary prescriptions.'],
      ['What taking them anyway costs',
        'Diarrhoea, thrush, rash, and a small risk of serious reactions. '
        + 'Disruption of gut bacteria for months. And selection for resistant '
        + 'organisms, which matters to you personally the next time you have an '
        + 'infection that does need treating.'],
      ['When it genuinely changes',
        'Symptoms worsening after initially improving, high fever with focal '
        + 'chest signs, breathing difficulty, or an illness dragging past the '
        + 'usual course. Those are reasons to be assessed, and the assessment '
        + 'is the point rather than the prescription.'],
    ],
  },
  {
    id: 'vitamin-c-cold',
    title: 'Vitamin C prevents or cures colds',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['vitamin c', 'cold', 'immune', 'zinc', 'echinacea'],
    summary: 'It does not prevent colds in the general population. It shortens '
           + 'them by a few percent, which nobody notices.',
    basis: 'Cochrane reviews of vitamin C for the common cold.',
    sections: [
      ['What the pooled trials show',
        'Regular supplementation does not reduce how often ordinary adults '
        + 'catch colds. It shortens duration by around 8 percent in adults, '
        + 'which on a seven day cold is about half a day. Starting it after '
        + 'symptoms begin has not shown consistent benefit at all.'],
      ['The exception',
        'In people under extreme physical stress, marathon runners, soldiers on '
        + 'exercises in the cold, incidence roughly halved. That is a real and '
        + 'replicated finding, and it does not generalise to sitting at a desk.'],
      ['Zinc',
        'Zinc lozenges started within 24 hours of onset appear to shorten colds '
        + 'more convincingly than vitamin C, though trials vary in dose and '
        + 'formulation and many people find the taste and nausea not worth it. '
        + 'Zinc nasal sprays have caused lasting loss of smell and should be '
        + 'avoided.'],
      ['Very high doses',
        'Above about a gram a day the excess is excreted. Large doses cause '
        + 'diarrhoea and raise the risk of kidney stones in susceptible people.'],
    ],
  },
  {
    id: 'breakfast',
    title: 'Breakfast is the most important meal of the day',
    category: 'Claims',
    verdict: 'mixed',
    tags: ['breakfast', 'skipping', 'metabolism', 'fasting', 'weight'],
    summary: 'Eating breakfast is associated with better outcomes. Making '
           + 'people eat it in trials does not reproduce them.',
    basis: 'Randomised trials of breakfast assignment versus observational '
         + 'cohort associations.',
    sections: [
      ['The observational picture',
        'Breakfast eaters tend to weigh less and have better diet quality. '
        + 'They also smoke less, drink less and exercise more. Breakfast is a '
        + 'marker of an organised life as much as a cause of anything.'],
      ['What trials found',
        'Randomising adults to eat or skip breakfast produced no weight '
        + 'advantage for eating it, and in some trials breakfast eaters '
        + 'consumed slightly more overall. The idea that skipping breakfast '
        + 'slows metabolism did not hold up.'],
      ['Where it does matter',
        'In children and adolescents, breakfast is associated with better '
        + 'attention and school performance, and the evidence there is '
        + 'stronger. In people managing diabetes, meal regularity affects '
        + 'glucose control and matters more.'],
      ['The honest version',
        'If you are hungry in the morning, eat. If you are not, skipping is '
        + 'not sabotaging you. What you eat across the day matters more than '
        + 'which hour you start.'],
    ],
  },
  {
    id: 'posture-devices',
    title: 'Bad posture is causing my back pain',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['posture', 'back pain', 'sitting', 'ergonomic', 'text neck', 'core'],
    summary: 'Posture correlates poorly with pain. The position that hurts is '
           + 'usually the one held longest, whatever it is.',
    basis: 'Cohort studies of spinal alignment against pain, and trials of '
         + 'posture interventions.',
    sections: [
      ['What the studies find',
        'Measured spinal curvature, sitting posture and forward head position '
        + 'correlate weakly or not at all with who has back and neck pain. '
        + 'People with textbook posture get pain and people with terrible '
        + 'posture do not.'],
      ['What does correlate',
        'How long a position is held without changing. Sleep. Stress and mood. '
        + 'Physical fitness. Sudden increases in load. These consistently '
        + 'outperform alignment as predictors.'],
      ['Text neck',
        'The calculation that a bowed head puts 27 kilograms through the neck '
        + 'is a static physics estimate, not a measured injury mechanism. '
        + 'Studies have not shown that phone use predicts neck pain the way the '
        + 'idea implies.'],
      ['What to actually do',
        'Change position often. Build strength and general fitness. Do not '
        + 'become afraid of bending or of sitting badly, because fear of '
        + 'movement predicts worse outcomes than any posture does.'],
      ['The grain of truth',
        'A workstation that forces one fixed position for eight hours is worth '
        + 'fixing, because it removes your ability to vary. The best posture is '
        + 'the next one.'],
    ],
  },
  {
    id: 'organic',
    title: 'Organic food is more nutritious and pesticide free',
    category: 'Claims',
    verdict: 'mixed',
    tags: ['organic', 'pesticides', 'nutrition', 'dirty dozen', 'residue'],
    summary: 'Nutrient differences are small. Pesticide residues are lower but '
           + 'both are typically far below safety limits.',
    basis: 'Systematic reviews comparing organic and conventional produce for '
         + 'nutrients and residues, plus regulatory residue monitoring.',
    sections: [
      ['Nutrients',
        'Reviews find small differences: somewhat higher antioxidant compounds '
        + 'and lower cadmium in organic produce, similar levels of vitamins and '
        + 'minerals overall. Whether those differences change health outcomes '
        + 'has not been demonstrated.'],
      ['Pesticides',
        'Organic farming uses pesticides too, drawn from a different approved '
        + 'list. Residues on conventional produce are lower in organic samples '
        + 'and both are usually well under regulatory limits in monitoring '
        + 'programmes.'],
      ['The dirty dozen list',
        'It ranks by how often residues are detected, not by amount relative to '
        + 'a safety threshold. Analyses applying actual toxicity data to the '
        + 'listed items found exposures far below levels of concern. Fear of '
        + 'the list has been shown to reduce fruit and vegetable purchasing, '
        + 'which is a real harm from a well meant campaign.'],
      ['The honest summary',
        'Eating more fruit and vegetables has strong evidence behind it. Which '
        + 'farming system they came from has weak evidence. If organic costs '
        + 'enough to make you buy less produce, that trade is a loss.'],
    ],
  },
  {
    id: 'lemon-water',
    title: 'Warm lemon water in the morning',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['lemon water', 'morning', 'metabolism', 'alkaline', 'digestion', 'enamel'],
    summary: 'It is water with a little vitamin C. Pleasant, mildly hydrating, '
           + 'and mildly bad for your teeth.',
    basis: 'Composition of lemon juice and dental erosion research on acidic '
         + 'drinks.',
    sections: [
      ['What it does',
        'Rehydrates you after a night without fluid, which is the entire real '
        + 'effect and is achieved equally well by water. Half a lemon provides '
        + 'perhaps a tenth of a day’s vitamin C.'],
      ['What it does not do',
        'It does not speed up metabolism, alkalise anything, flush the liver, or '
        + 'burn fat. Lemon juice is acidic; the alkalising claim comes from the '
        + 'urine pH confusion covered under alkaline diets.'],
      ['The one real downside',
        'Citric acid softens tooth enamel. Drinking it daily, especially '
        + 'sipped slowly, contributes to erosion. Use a straw, rinse with plain '
        + 'water after, and do not brush for half an hour, because brushing '
        + 'softened enamel removes it.'],
    ],
  },
  {
    id: 'wet-hair-cold',
    title: 'Going outside with wet hair gives you a cold',
    category: 'Claims',
    verdict: 'false',
    tags: ['cold', 'wet hair', 'draught', 'virus', 'winter'],
    summary: 'Colds are caused by viruses. Being cold does not create one.',
    basis: 'Experimental studies exposing volunteers to cold with and without '
         + 'virus inoculation.',
    sections: [
      ['The experiment',
        'Volunteers were chilled, some with a cold virus and some without. '
        + 'Chilling without exposure did not produce colds. No virus, no cold, '
        + 'however cold and wet you get.'],
      ['Why winter really has more colds',
        'People spend more time indoors together, which raises transmission. '
        + 'Dry indoor air impairs the nose’s clearance mechanisms. Several '
        + 'respiratory viruses survive better in cold dry air. And lower '
        + 'vitamin D may play a role, which is still being argued.'],
      ['The small caveat',
        'Some work suggests cooling the nose modestly reduces local immune '
        + 'defence, so if you are already exposed, being chilled might tip the '
        + 'balance slightly. That is a long way from cold air causing illness '
        + 'on its own.'],
    ],
  },
  {
    id: 'ice-injury',
    title: 'Ice an injury immediately, RICE is the standard',
    category: 'Claims',
    verdict: 'mixed',
    tags: ['ice', 'rice', 'sprain', 'injury', 'inflammation', 'rest'],
    summary: 'The doctor who coined RICE later withdrew the rest and ice parts. '
           + 'Early gentle loading beats immobilising.',
    basis: 'The originator of the RICE acronym publicly revising it, plus '
         + 'trials of early mobilisation after soft tissue injury.',
    sections: [
      ['What changed',
        'RICE was proposed in the 1970s and became universal. Its author later '
        + 'stated that rest and ice likely delay healing, since inflammation is '
        + 'part of repair rather than the enemy of it. Newer acronyms replace '
        + 'rest with optimal loading.'],
      ['What ice does',
        'It numbs, which reduces pain. That is worth having in the first day or '
        + 'two. Evidence that it speeds healing is weak, and there is reason to '
        + 'think suppressing early inflammation slows repair.'],
      ['What to do instead',
        'Protect it for the first day or so, then start moving it within '
        + 'comfort, and progressively load it. Trials of early controlled '
        + 'mobilisation after ankle sprain show faster return to function than '
        + 'immobilisation.'],
      ['Where the old advice still applies',
        'Elevation and compression for swelling remain sensible. And a suspected '
        + 'fracture or dislocation is immobilised and assessed, not loaded.'],
    ],
  },
  {
    id: 'phone-cancer',
    title: 'Mobile phones cause brain tumours',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['phone', 'radiation', 'brain tumour', '5g', 'wifi', 'emf'],
    summary: 'Decades of use with no matching rise in brain tumour rates. The '
           + 'radiation involved cannot break chemical bonds.',
    basis: 'National cancer registry trend data across the period of mobile '
         + 'phone adoption, and large cohort studies.',
    sections: [
      ['The physics',
        'Radiofrequency radiation is non-ionising: it does not carry enough '
        + 'energy to break the chemical bonds in DNA. Ionising radiation, like '
        + 'x-rays, does. The only established biological effect of '
        + 'radiofrequency at these levels is slight heating.'],
      ['The population data',
        'Mobile phone use went from almost nobody to almost everybody in about '
        + 'two decades. Brain tumour incidence in cancer registries did not '
        + 'rise correspondingly. That is a strong argument, because a real '
        + 'effect of the claimed size would have shown up.'],
      ['The classification confusion',
        'Radiofrequency fields are classed as possibly carcinogenic, group 2B. '
        + 'That category means evidence is limited and cannot be dismissed, not '
        + 'that harm is established. Aloe vera extract and pickled vegetables '
        + 'are in the same group.'],
      ['5G',
        'Higher frequency and shorter range, which means less penetration into '
        + 'tissue, not more. It remains non-ionising. The claims linking it to '
        + 'viral illness have no mechanism and no evidence.'],
    ],
  },
  {
    id: 'gluten',
    title: 'Everyone should avoid gluten',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['gluten', 'coeliac', 'wheat', 'bloating', 'fodmap', 'intolerance'],
    summary: 'Essential for around 1 percent of people with coeliac disease. '
           + 'For most others the culprit is usually something else in wheat.',
    basis: 'Blinded rechallenge trials in self reported gluten sensitivity.',
    sections: [
      ['Coeliac disease is real and serious',
        'An autoimmune reaction damaging the small intestine, affecting roughly '
        + 'one in a hundred, and lifelong strict avoidance is the treatment. '
        + 'Get tested before cutting gluten out, because testing needs gluten '
        + 'in your diet to work.'],
      ['Non-coeliac gluten sensitivity',
        'Symptoms without the antibodies or damage. When people who report it '
        + 'are given blinded challenges, most do not reliably identify gluten. '
        + 'Several of those trials pointed at fermentable carbohydrates in '
        + 'wheat instead, which cause bloating through a completely different '
        + 'route.'],
      ['Why cutting it often works anyway',
        'Removing gluten removes most bread, pasta, pastry, beer and a lot of '
        + 'processed food at once. Feeling better after that does not identify '
        + 'gluten as the agent.'],
      ['The cost of avoiding it unnecessarily',
        'Gluten free replacement products are often lower in fibre and higher '
        + 'in sugar and fat, and considerably more expensive. Cutting whole '
        + 'grains lowers fibre intake, which has real downsides.'],
    ],
  },
  {
    id: 'hydration',
    title: 'You must drink eight glasses of water a day',
    category: 'Claims',
    verdict: 'mostly false',
    tags: ['water', 'hydration', 'eight glasses', 'dehydration', 'urine'],
    summary: 'No study produced that number. Thirst plus what is in food and '
           + 'drink covers most people.',
    basis: 'Reviews tracing the origin of the recommendation, and water '
         + 'turnover measurement studies.',
    sections: [
      ['Where the number came from',
        'Traced back to a 1940s recommendation which stated a volume and then '
        + 'noted that most of it is contained in prepared food. The second '
        + 'sentence dropped away and the first became folklore.'],
      ['What the body does',
        'Thirst is a well calibrated signal driven by blood concentration, and '
        + 'it works. Food contributes roughly a fifth to a third of intake. Tea '
        + 'and coffee count; the diuretic effect of normal amounts of caffeine '
        + 'does not exceed the fluid they contain.'],
      ['A better check',
        'Pale straw urine most of the day. Dark yellow means drink more. '
        + 'Completely clear all day means you are probably drinking more than '
        + 'you need.'],
      ['When more genuinely matters',
        'Heat, hard exercise, fever, vomiting or diarrhoea. Older adults, whose '
        + 'thirst signal weakens. People prone to kidney stones, where high '
        + 'fluid intake is a genuine preventive measure with real evidence.'],
      ['Overdoing it is possible',
        'Drinking far more than the kidneys can excrete dilutes blood sodium '
        + 'and has killed people, in endurance events and in water drinking '
        + 'challenges. Rare, but it is not true that more is always safer.'],
    ],
  },
];
