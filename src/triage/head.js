/* Headache.
 *
 * The screening questions cover the widely used headache red flag set:
 * sudden onset reaching peak in under a minute, systemic signs such as
 * fever, neurological deficit, older age at first onset, a clear change in
 * pattern, and headache made worse by position or straining.
 *
 * The migraine questions are the four features that carry most of the
 * diagnostic weight in the POUND description: pulsating quality, duration of
 * four to seventy two hours, one sided location, nausea, and disabling
 * intensity. Four of five present makes migraine much more likely than not.
 *
 * Priors reflect headache in primary care, where tension type headache is
 * the most common and migraine the most commonly missed.
 */

export const HEAD = {
  id: 'head',
  regions: ['head.face', 'head.back', 'head.side.left', 'head.side.right',
            'neck.front', 'neck.back', 'neck.side.left', 'neck.side.right'],
  label: 'Head and neck',
  typicalQuestions: 7,
  maxQuestions: 9,
  basis: 'Screening follows the standard headache red flag set. Migraine '
       + 'questions follow the POUND features: pulsating, duration, one '
       + 'sided, nausea, disabling.',

  causes: [
    {
      id: 'tension',
      label: 'Tension type headache',
      prior: 0.40,
      note: 'A band of pressure on both sides, mild to moderate, not made '
          + 'worse by walking about, no sickness. The most common headache '
          + 'there is.',
      selfChecks: [
        'Note whether it is both sides and pressing rather than throbbing.',
        'Note whether ordinary activity makes it worse. With this one it usually does not.',
      ],
      helps: [
        'Regular sleep and regular meals do more than anything taken for it.',
        'Painkillers more than two or three days a week can start causing the headaches themselves. That is the most common reversible cause of daily headache.',
        'Neck and shoulder strength work helps when it is frequent.',
      ],
    },
    {
      id: 'migraine',
      label: 'Migraine',
      prior: 0.22,
      note: 'Throbbing, often one sided, four hours to three days, with '
          + 'sickness or dislike of light and noise, and made worse by moving '
          + 'about.',
      selfChecks: [
        'Note whether light or noise becomes hard to tolerate.',
        'Note whether walking upstairs makes it clearly worse.',
        'Note any visual changes in the twenty to sixty minutes before it starts.',
      ],
      helps: [
        'Treat early. Migraine treatment works far better in the first hour than in the third.',
        'A dark quiet room is not weakness, it is the one thing that reliably shortens an attack.',
        'Keep a trigger diary for a month before eliminating anything, because the usual suspects are often wrong.',
        'Skipped meals, disturbed sleep and dehydration are more common triggers than any food.',
      ],
    },
    {
      id: 'medication-overuse',
      label: 'Painkiller rebound',
      prior: 0.08,
      note: 'Headaches caused by the treatment. Present most days, worst on '
          + 'waking, improves briefly with a dose and returns.',
      selfChecks: ['Count how many days in the last month you took something for headache.'],
      helps: [
        'Taking simple painkillers on more than fifteen days a month, or triptans on more than ten, maintains this.',
        'Stopping causes a worse week or two and then a clear improvement. Worth planning with a doctor rather than alone.',
      ],
    },
    {
      id: 'cervicogenic',
      label: 'Coming from the neck',
      prior: 0.10,
      note: 'Pain starting at the back of the neck and spreading forward, one '
          + 'sided, brought on by neck position or a long time at a desk.',
      selfChecks: ['Note whether turning your head or a long desk session brings it on.'],
      helps: ['Neck mobility and shoulder blade strength, plus changing screen height.'],
    },
    {
      id: 'sinus',
      label: 'Sinus',
      prior: 0.07,
      note: 'Pressure over the cheeks or forehead with a blocked nose and '
          + 'coloured discharge, worse leaning forward.',
      selfChecks: ['Lean forward and note whether the pressure builds. Check whether your nose is blocked on that side.'],
      helps: [
        'Most sinus infections are viral and settle without antibiotics.',
        'Saline rinses help more than decongestant sprays used beyond three days.',
      ],
    },
    {
      id: 'cluster',
      label: 'Cluster headache',
      prior: 0.02,
      note: 'Severe pain behind or around one eye, lasting fifteen minutes to '
          + 'three hours, with a red or watering eye and a blocked nostril on '
          + 'that side, often at the same time each day.',
      selfChecks: ['Note whether the eye on that side waters or the lid droops.'],
      helps: ['Specific treatments exist that ordinary painkillers cannot match. Worth naming this pattern to a doctor.'],
    },
    {
      id: 'dehydration',
      label: 'Dehydration or a skipped meal',
      prior: 0.07,
      note: 'A dull headache after too little fluid, a missed meal, alcohol, '
          + 'or a caffeine change.',
      selfChecks: ['Note what you have had to drink today and when you last ate.'],
      helps: ['Fluid, food, and a consistent caffeine intake rather than swings.'],
    },
    {
      id: 'serious',
      label: 'Something needing urgent imaging',
      prior: 0.02,
      note: 'Bleeding, raised pressure, or inflamed arteries. Sudden onset, '
          + 'neurological changes, fever with a stiff neck, or a headache '
          + 'clearly unlike any before.',
      selfChecks: [],
      helps: ['This is an emergency assessment pathway.'],
    },
  ],

  questions: [
    {
      id: 'q.onset',
      screening: true,
      order: 1,
      prompt: 'How quickly did it reach its worst?',
      options: [
        { id: 'seconds', label: 'Under a minute, like a blow',
          lr: { serious: 25, tension: 0.2, migraine: 0.3 } },
        { id: 'minutes', label: 'Over several minutes',
          lr: { cluster: 3, migraine: 1.3 } },
        { id: 'hours', label: 'Gradually, over hours',
          lr: { tension: 1.6, migraine: 1.4, serious: 0.3 } },
        { id: 'days', label: 'Days or longer',
          lr: { tension: 1.5, 'medication-overuse': 2, serious: 0.4 } },
      ],
    },
    {
      id: 'q.neuro',
      screening: true,
      order: 2,
      prompt: 'Weakness, slurred speech, or confusion?',
      options: [
        { id: 'yes', label: 'Yes, now',
          lr: { serious: 30, tension: 0.1 } },
        { id: 'resolved', label: 'Earlier, now gone',
          lr: { serious: 6, migraine: 2 } },
        { id: 'no', label: 'No', lr: { serious: 0.2 } },
      ],
    },
    {
      id: 'q.fever-neck',
      screening: true,
      order: 3,
      prompt: 'Any fever with a stiff neck?',
      options: [
        { id: 'both', label: 'Both',
          lr: { serious: 20, tension: 0.2 } },
        { id: 'fever', label: 'Fever only',
          lr: { sinus: 2.5, serious: 1.5 } },
        { id: 'neither', label: 'Neither', lr: { serious: 0.4 } },
      ],
    },
    {
      id: 'q.strain',
      screening: true,
      order: 4,
      prompt: 'Worse coughing, straining, or lying flat?',
      options: [
        { id: 'yes', label: 'Clearly worse',
          lr: { serious: 5, sinus: 1.8, tension: 0.5 } },
        { id: 'no', label: 'No', lr: { serious: 0.5 } },
      ],
    },
    {
      id: 'q.pattern',
      screening: true,
      order: 5,
      prompt: 'Compared with your usual headaches?',
      options: [
        { id: 'first-worst', label: 'The first or worst ever',
          lr: { serious: 6, tension: 0.4 } },
        { id: 'different', label: 'Different from my usual',
          lr: { serious: 2.5 } },
        { id: 'same', label: 'Same as usual',
          lr: { serious: 0.2, tension: 1.5, migraine: 1.4 } },
        { id: 'no-usual', label: 'I do not get them',
          lr: { serious: 1.4 } },
      ],
    },
    {
      id: 'q.quality',
      prompt: 'What does it feel like?',
      options: [
        { id: 'throbbing', label: 'Throbbing or pulsing',
          lr: { migraine: 3, tension: 0.4 } },
        { id: 'band', label: 'A tight band',
          lr: { tension: 3.5, migraine: 0.4 } },
        { id: 'boring', label: 'Boring behind one eye',
          lr: { cluster: 8, tension: 0.3 } },
        { id: 'pressure-face', label: 'Pressure over the face',
          lr: { sinus: 4, migraine: 0.7 } },
      ],
    },
    {
      id: 'q.sides',
      prompt: 'Where is it?',
      options: [
        { id: 'one-side', label: 'One side',
          lr: { migraine: 2.5, cluster: 3, cervicogenic: 2, tension: 0.5 } },
        { id: 'both', label: 'Both sides',
          lr: { tension: 2.5, migraine: 0.6 } },
        { id: 'back-neck', label: 'Starts in the neck',
          lr: { cervicogenic: 5, tension: 1.3 } },
      ],
    },
    {
      id: 'q.nausea',
      prompt: 'Sickness, or trouble with light?',
      options: [
        { id: 'both', label: 'Both',
          lr: { migraine: 5, tension: 0.25 } },
        { id: 'one', label: 'One of them',
          lr: { migraine: 2.2, tension: 0.6 } },
        { id: 'no', label: 'Neither',
          lr: { migraine: 0.3, tension: 1.6 } },
      ],
    },
    {
      id: 'q.activity',
      prompt: 'Does walking about make it worse?',
      options: [
        { id: 'yes', label: 'Clearly worse',
          lr: { migraine: 3.5, tension: 0.3 } },
        { id: 'no', label: 'No difference',
          lr: { migraine: 0.4, tension: 2 } },
      ],
    },
    {
      id: 'q.duration',
      prompt: 'How long does one episode last?',
      options: [
        { id: 'under-3h', label: 'Under three hours',
          lr: { cluster: 4, migraine: 0.5 } },
        { id: '4-72h', label: 'Four hours to three days',
          lr: { migraine: 3 } },
        { id: 'constant', label: 'There most of the time',
          lr: { 'medication-overuse': 4, tension: 1.5, migraine: 0.4 } },
      ],
    },
    {
      id: 'q.painkillers',
      prompt: 'Days a month you take something?',
      options: [
        { id: 'over-15', label: 'More than fifteen',
          lr: { 'medication-overuse': 12, tension: 0.6 } },
        { id: '5-15', label: 'Five to fifteen',
          lr: { 'medication-overuse': 2.5 } },
        { id: 'under-5', label: 'Fewer than five',
          lr: { 'medication-overuse': 0.15 } },
      ],
    },
    {
      id: 'q.eye',
      needs: { anyAnswer: { 'q.quality': ['boring'], 'q.sides': ['one-side'] } },
      prompt: 'Does that eye water or the lid droop?',
      options: [
        { id: 'yes', label: 'Yes', lr: { cluster: 12, migraine: 0.6 } },
        { id: 'no', label: 'No', lr: { cluster: 0.2 } },
      ],
    },
    {
      id: 'q.age-new',
      screening: true,
      order: 6,
      /* The age half of this is on the profile, so it is not asked again.
         Under fifty the question is not put at all, and where the age is
         known the wording drops the part the app can already answer. It is
         still asked when no age has been entered, and there the age has to
         stay in the wording, since the answer is what carries it. */
      needs: { minAge: 50 },
      prompt: s => (s.profile?.age != null
        ? 'Is this a new kind of headache for you?'
        : 'A new kind of headache, and are you over 50?'),
      options: [
        { id: 'yes', label: 'Yes', lr: { serious: 5, tension: 0.6 } },
        { id: 'no', label: 'No', lr: { serious: 0.7 } },
      ],
    },
  ],

  redFlags: [
    {
      id: 'rf.head.thunderclap',
      urgency: 'emergency',
      answers: { 'q.onset': 'seconds' },
      headline: 'A headache that hit maximum in under a minute',
      lines: [
        'A headache that reaches its worst almost instantly is treated as bleeding around the brain until proven otherwise. It does not matter whether it has since eased.',
        'Go to an emergency department now. Do not drive yourself.',
        'Tell them it peaked within a minute. That single detail decides what gets done first.',
      ],
    },
    {
      id: 'rf.head.neuro',
      urgency: 'emergency',
      anyAnswer: { 'q.neuro': ['yes'] },
      headline: 'Headache with weakness, slurred speech, or confusion',
      lines: [
        'Headache together with any neurological change is assessed immediately. Time matters for the treatments that exist.',
        'Call an ambulance now rather than arranging your own transport.',
        'Note the time the symptoms started. Treatment decisions run from that clock.',
      ],
    },
    {
      id: 'rf.head.meningism',
      urgency: 'emergency',
      answers: { 'q.fever-neck': 'both' },
      headline: 'Fever with a stiff neck and headache',
      lines: [
        'Fever, a stiff neck and headache together is the pattern of infection around the brain and its lining. It can move quickly.',
        'Go to an emergency department now.',
        'If a rash appears that does not fade when pressed with a glass, say so when you call.',
      ],
    },
    {
      id: 'rf.head.pressure',
      urgency: 'same_day',
      answers: { 'q.strain': 'yes', 'q.pattern': ['first-worst', 'different'] },
      headline: 'A new headache made worse by coughing or lying flat',
      lines: [
        'A headache that is clearly worse when you cough, strain, or lie down, and is new or different from your usual, is checked for raised pressure inside the head.',
        'Get seen today.',
        'Note whether it is worst on waking and whether anything is changing about your vision.',
      ],
    },
    {
      id: 'rf.head.new-over-50',
      urgency: 'same_day',
      answers: { 'q.age-new': 'yes' },
      headline: 'A new kind of headache after 50',
      lines: [
        'A genuinely new headache in later life is investigated rather than assumed benign. One treatable cause, inflamed arteries at the temple, can affect vision permanently if it is left.',
        'Get seen within a day or two.',
        'Note any tenderness over the temples, jaw ache while chewing, or any change in vision, and mention those first.',
      ],
    },
  ],

  selfChecks: [
    'Note whether it is one side or both, and whether it throbs or presses.',
    'Note whether walking about makes it worse.',
    'Count the days per month you take something for it.',
  ],
};
