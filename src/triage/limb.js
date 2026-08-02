/* Limbs and joints.
 *
 * The knee and ankle questions are the Ottawa rules, which were built to
 * decide who needs an x-ray after an injury and are among the best validated
 * decision rules in emergency medicine. Near-perfect sensitivity for fracture
 * makes a negative set reassuring and a positive one an indication to image.
 *
 * The clause most often skipped: being unable to take four steps, both
 * immediately after the injury and now, counts on its own regardless of how
 * the joint feels.
 *
 * This bank covers all limb regions, since the useful questions after an
 * injury are the same whichever joint it is.
 */

export const LIMB = {
  id: 'limb',
  regions: [
    'shoulder.left', 'shoulder.right', 'shoulder.blade.left', 'shoulder.blade.right',
    'arm.upper.left', 'arm.upper.right', 'elbow.left', 'elbow.right',
    'arm.fore.left', 'arm.fore.right', 'hand.left', 'hand.right',
    'hip.left', 'hip.right', 'thigh.left', 'thigh.right',
    'hamstring.left', 'hamstring.right', 'knee.left', 'knee.right',
    'knee.back.left', 'knee.back.right', 'shin.left', 'shin.right',
    'calf.left', 'calf.right', 'foot.left', 'foot.right',
    'heel.left', 'heel.right',
  ],
  label: 'Limb or joint',
  typicalQuestions: 7,
  maxQuestions: 9,
  basis: 'Injury questions follow the Ottawa knee and ankle rules. Clot '
       + 'questions follow the history items of the Wells score for deep vein '
       + 'thrombosis. Infected joint questions follow standard criteria.',

  causes: [
    {
      id: 'soft-tissue',
      label: 'Muscle or tendon strain',
      prior: 0.34,
      note: 'Overstretched fibres. Sore to press, worse using it, settles with '
          + 'time and gradual loading.',
      selfChecks: [
        'Press along the sore area and find whether one point is clearly worse.',
        'Note whether it hurts more using it or stretching it.',
      ],
      helps: [
        'Load it early and gently. Complete rest weakens tendon and muscle and slows recovery.',
        'Ice helps pain in the first day or two. It does not speed healing.',
        'Expect weeks rather than days. Tendon in particular is slow, and slow is normal.',
      ],
    },
    {
      id: 'overuse',
      label: 'Overuse or tendinopathy',
      prior: 0.22,
      note: 'Tissue loaded faster than it adapted. Builds over weeks, worse at '
          + 'the start of activity, often eases as you warm up and hurts again '
          + 'afterwards.',
      selfChecks: [
        'Note whether it warms up during activity and hurts more the next morning.',
        'Note what changed in the weeks before: distance, shoes, surface, intensity.',
      ],
      helps: [
        'Reduce the load rather than stopping entirely, then rebuild by about ten percent a week.',
        'Slow heavy strength work is the best evidenced treatment for tendon pain. Stretching alone is not.',
        'It responds over months, not weeks. Progress is measured against last month.',
      ],
    },
    {
      id: 'arthritis',
      label: 'Joint surface wear',
      prior: 0.14,
      note: 'Cartilage thinning. Stiff first thing for under half an hour, '
          + 'worse after activity, better with regular gentle movement.',
      selfChecks: ['Time the morning stiffness. Under thirty minutes points here.'],
      helps: [
        'Strength around the joint reduces pain more reliably than anything else available.',
        'Movement lubricates the joint. Avoiding use makes it worse over time.',
        'Weight loss where relevant reduces knee load by roughly four times the amount lost, per step.',
      ],
    },
    {
      id: 'fracture',
      label: 'Broken bone',
      prior: 0.06,
      note: 'A break. Follows a definite force, focal bony tenderness, and '
          + 'usually an inability to take weight.',
      selfChecks: [],
      helps: ['Needs an x-ray rather than a wait and see.'],
    },
    {
      id: 'ligament',
      label: 'Ligament tear',
      prior: 0.09,
      note: 'A twist or a blow, often with a pop, swelling within hours, and a '
          + 'joint that feels like it might give way.',
      selfChecks: ['Note whether it swelled within an hour, and whether it feels unstable.'],
      helps: [
        'Swelling within the first hour suggests bleeding in the joint and is worth assessing.',
        'Most partial tears rehabilitate well. Strength work beats bracing long term.',
      ],
    },
    {
      id: 'dvt',
      label: 'Clot in a deep vein',
      prior: 0.03,
      note: 'A clot in a leg vein. One calf swollen, warm and tender, often '
          + 'after immobility, surgery, or a long flight or drive.',
      selfChecks: [],
      helps: ['Assessed the same day. Do not massage or stretch a suspected clot.'],
    },
    {
      id: 'gout',
      label: 'Gout or crystal joint',
      prior: 0.05,
      note: 'Crystals in the joint. Rapid onset over hours, intensely painful, '
          + 'red and hot, classically the base of the big toe.',
      selfChecks: ['Note how fast it came on. Gout goes from nothing to severe in under a day.'],
      helps: [
        'Attacks settle in days to two weeks. Treatment shortens them considerably.',
        'It recurs, and the treatment that prevents recurrence is different from the treatment for an attack.',
      ],
    },
    {
      id: 'septic',
      label: 'Infected joint',
      prior: 0.02,
      note: 'Infection inside the joint. Hot, swollen, almost unusable, with '
          + 'fever. Uncommon, and damages cartilage within days.',
      selfChecks: [],
      helps: ['This is an emergency assessment.'],
    },
    {
      id: 'referred',
      label: 'Coming from elsewhere',
      prior: 0.05,
      note: 'Pain felt in the limb but arising in the spine or hip. Nothing to '
          + 'find at the painful spot, and pressing it changes nothing.',
      selfChecks: ['Press the painful area. If nothing reproduces it, the source may be higher up.'],
      helps: ['Treating the source rather than the site is the whole point here.'],
    },
  ],

  questions: [
    {
      id: 'q.injury',
      screening: true,
      order: 1,
      prompt: 'Did an injury start it?',
      options: [
        { id: 'yes-today', label: 'Yes, in the last day',
          lr: { fracture: 4, ligament: 4, 'soft-tissue': 2, overuse: 0.2, arthritis: 0.3 } },
        { id: 'yes-older', label: 'Yes, longer ago',
          lr: { ligament: 1.5, 'soft-tissue': 1.5, overuse: 0.8 } },
        { id: 'no', label: 'No injury',
          lr: { fracture: 0.1, ligament: 0.2, overuse: 2, arthritis: 2, gout: 1.6, dvt: 1.5 } },
      ],
    },
    {
      id: 'q.weight',
      screening: true,
      order: 2,
      needs: { anyAnswer: { 'q.injury': ['yes-today', 'yes-older'] } },
      prompt: 'Could you take four steps, then and now?',
      options: [
        { id: 'neither', label: 'Neither then nor now',
          lr: { fracture: 6, 'soft-tissue': 0.4 } },
        { id: 'now-only', label: 'Not then, but I can now',
          lr: { fracture: 1.5, ligament: 1.5 } },
        { id: 'both', label: 'Yes, both',
          lr: { fracture: 0.2 } },
      ],
    },
    {
      id: 'q.bony',
      screening: true,
      order: 3,
      needs: { anyAnswer: { 'q.injury': ['yes-today', 'yes-older'] } },
      prompt: 'Press the bone. Is one point sharply tender?',
      options: [
        { id: 'yes', label: 'Yes, right on the bone',
          lr: { fracture: 5, 'soft-tissue': 0.5 } },
        { id: 'soft', label: 'Tender, but on soft tissue',
          lr: { 'soft-tissue': 2, fracture: 0.4 } },
        { id: 'no', label: 'Nothing sharp',
          lr: { fracture: 0.2, referred: 2 } },
      ],
    },
    {
      id: 'q.hot',
      screening: true,
      order: 4,
      prompt: 'Is it hot, red and swollen?',
      options: [
        { id: 'very', label: 'Yes, clearly',
          lr: { septic: 8, gout: 6, 'soft-tissue': 0.4, arthritis: 0.5 } },
        { id: 'some-swelling', label: 'Swollen, not hot',
          lr: { ligament: 2, arthritis: 1.4, dvt: 2 } },
        { id: 'no', label: 'No', lr: { septic: 0.1, gout: 0.2 } },
      ],
    },
    {
      id: 'q.fever',
      screening: true,
      order: 5,
      needs: { anyAnswer: { 'q.hot': ['very', 'some-swelling'] } },
      prompt: 'Any fever?',
      options: [
        { id: 'yes', label: 'Yes, measured', lr: { septic: 8, gout: 1.5 } },
        { id: 'no', label: 'No', lr: { septic: 0.2 } },
      ],
    },
    {
      id: 'q.speed',
      prompt: 'How fast did it come on?',
      options: [
        { id: 'hours', label: 'Hours, from nothing to severe',
          lr: { gout: 8, septic: 3, overuse: 0.1, arthritis: 0.2 } },
        { id: 'days', label: 'Over days', lr: { 'soft-tissue': 1.5, septic: 1.5 } },
        { id: 'weeks', label: 'Over weeks',
          lr: { overuse: 4, arthritis: 2, gout: 0.2, fracture: 0.3 } },
        { id: 'months', label: 'Months or years',
          lr: { arthritis: 5, overuse: 1.5, gout: 0.2, fracture: 0.1 } },
      ],
    },
    {
      id: 'q.calf',
      needs: { anyAnswer: { 'q.hot': ['some-swelling', 'very'], 'q.injury': ['no'] } },
      prompt: 'Is one calf bigger than the other?',
      options: [
        { id: 'yes', label: 'Noticeably', lr: { dvt: 10, 'soft-tissue': 0.5 } },
        { id: 'no', label: 'No', lr: { dvt: 0.2 } },
      ],
    },
    {
      id: 'q.immobile',
      needs: { anyAnswer: { 'q.calf': ['yes'] } },
      prompt: 'Recent surgery, a trip, or days off your feet?',
      options: [
        { id: 'yes', label: 'Yes, in the last month', lr: { dvt: 5 } },
        { id: 'no', label: 'No', lr: { dvt: 0.5 } },
      ],
    },
    {
      id: 'q.morning',
      prompt: 'How is it first thing in the morning?',
      options: [
        { id: 'stiff-short', label: 'Stiff for under half an hour',
          lr: { arthritis: 3, overuse: 1.5 } },
        { id: 'stiff-long', label: 'Stiff for over an hour',
          lr: { arthritis: 0.6 } },
        { id: 'worse-after', label: 'Worse the next morning',
          lr: { overuse: 3 } },
        { id: 'fine', label: 'Fine', lr: { arthritis: 0.4 } },
      ],
    },
    {
      id: 'q.warmup',
      prompt: 'What does activity do?',
      options: [
        { id: 'warms-up', label: 'Eases as I warm up',
          lr: { overuse: 4, arthritis: 1.5, fracture: 0.2 } },
        { id: 'worse-through', label: 'Gets worse the more I do',
          lr: { arthritis: 2, 'soft-tissue': 1.5, overuse: 0.7 } },
        { id: 'cannot', label: 'I cannot use it',
          lr: { fracture: 3, septic: 3, ligament: 2 } },
      ],
    },
    {
      id: 'q.giving-way',
      prompt: 'Does the joint give way or lock?',
      options: [
        { id: 'gives', label: 'It gives way', lr: { ligament: 4, arthritis: 1.3 } },
        { id: 'locks', label: 'It locks or catches', lr: { ligament: 2.5, arthritis: 2 } },
        { id: 'no', label: 'Neither', lr: { ligament: 0.5 } },
      ],
    },
    {
      id: 'q.press-local',
      prompt: 'Does pressing it reproduce the pain?',
      options: [
        { id: 'yes', label: 'Exactly',
          lr: { 'soft-tissue': 2.5, overuse: 2, referred: 0.2 } },
        { id: 'no', label: 'Not at all',
          lr: { referred: 5, 'soft-tissue': 0.4 } },
      ],
    },
  ],

  redFlags: [
    {
      id: 'rf.limb.septic',
      urgency: 'emergency',
      answers: { 'q.hot': 'very', 'q.fever': 'yes' },
      headline: 'A hot, swollen joint with a fever',
      lines: [
        'A joint that is hot, swollen, and hard to move, together with a fever, is treated as infection inside the joint until proven otherwise. Cartilage is damaged within days when it is.',
        'Go to an emergency department now.',
        'Do not take anything that lowers the fever before you are seen, and say when the joint first changed.',
      ],
    },
    {
      id: 'rf.limb.dvt',
      urgency: 'same_day',
      answers: { 'q.calf': 'yes' },
      anyAnswer: { 'q.immobile': ['yes'], 'q.hot': ['some-swelling', 'very'] },
      headline: 'One swollen calf',
      lines: [
        'One calf clearly bigger than the other, swollen and tender, is assessed for a clot the same day. The concern is not the leg itself but a piece travelling to the lung.',
        'Get seen today. Do not massage it or stretch it out.',
        'If you become breathless or get chest pain, that becomes an emergency rather than a same day matter.',
      ],
    },
    {
      id: 'rf.limb.fracture',
      urgency: 'same_day',
      answers: { 'q.weight': 'neither', 'q.bony': 'yes' },
      headline: 'Cannot take four steps, with tenderness on the bone',
      lines: [
        'Being unable to take four steps right after an injury and still now, together with a sharply tender point on the bone, is the combination that means an x-ray rather than waiting.',
        'Get seen today at an urgent care centre or emergency department.',
        'Keep weight off it until it has been looked at.',
      ],
    },
    {
      id: 'rf.limb.no-use',
      urgency: 'same_day',
      answers: { 'q.warmup': 'cannot', 'q.injury': 'yes-today' },
      headline: 'A limb you cannot use after an injury',
      lines: [
        'Losing the ability to use a limb after an injury needs imaging rather than a few days of rest.',
        'Get seen today.',
        'Note any numbness, or a change in colour or temperature past the injury, and mention it first if present.',
      ],
    },
  ],

  selfChecks: [
    'Press along the area and find whether one point is clearly worst.',
    'Note whether it warms up during activity and hurts more the next morning.',
    'Compare the two sides for swelling, warmth and colour.',
  ],
};
