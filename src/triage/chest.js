/* Chest pain.
 *
 * Structure follows how chest pain is sorted in primary care. The
 * three features that define typical angina, substernal location, brought on
 * by exertion, relieved by rest or nitrate, have been the standard
 * discriminator since Diamond and Forrester set them out, and they still
 * carry the most weight of any history finding. Pleuritic quality, calf
 * swelling, immobilisation and haemoptysis are the history items from the
 * Wells criteria for pulmonary embolism. Reproducible tenderness on pressing
 * is the classic pointer to the chest wall and away from the heart.
 *
 * Likelihood ratios are set to the direction and rough magnitude reported in
 * the diagnostic accuracy literature, rounded to values a reader can sanity
 * check. They are not precise enough to publish and are not shown to the
 * person as numbers, only as an ordering.
 *
 * Priors are for adults presenting to primary care with chest pain, where
 * musculoskeletal and reflux causes dominate and cardiac causes are the
 * minority that matter most.
 */

export const CHEST = {
  id: 'chest',
  regions: ['chest.left', 'chest.right', 'chest.side.left', 'chest.side.right'],
  label: 'Chest',
  typicalQuestions: 7,
  maxQuestions: 9,
  basis: 'Question set follows the typical angina definition (Diamond and '
       + 'Forrester), the history items of the Wells criteria for pulmonary '
       + 'embolism, and standard chest wall examination findings.',

  causes: [
    {
      id: 'musculoskeletal',
      label: 'Chest wall or rib',
      prior: 0.36,
      note: 'Muscle, cartilage or rib joint. Sore to press, worse on twisting '
          + 'or a deep breath, often follows a cough, a lift, or a new activity.',
      selfChecks: [
        'Press firmly over the sore spot. If that reproduces your exact pain, the wall is the likely source.',
        'Twist your upper body slowly. Note whether that brings it on.',
        'Take a deep breath and note whether it sharpens.',
      ],
      helps: [
        'Keep moving normally. Resting a chest wall completely tends to prolong it.',
        'Heat over the spot for 15 minutes helps more than ice once the first day has passed.',
        'It usually settles over two to six weeks. Slower than people expect, and not a sign anything is wrong.',
      ],
    },
    {
      id: 'reflux',
      label: 'Reflux or oesophagus',
      prior: 0.18,
      note: 'Stomach acid reaching the gullet. Burning behind the breastbone, '
          + 'often after meals or lying down, sometimes with a sour taste.',
      selfChecks: [
        'Note whether it tracks with meals, and which meals.',
        'Note whether lying flat within two hours of eating brings it on.',
        'Note whether anything comes back up into your throat.',
      ],
      helps: [
        'Leave three hours between the last meal and lying down.',
        'Raise the head of the bed by 10 to 20 cm. Extra pillows bend the neck instead and do not work.',
        'Large meals, alcohol and late eating do more than any single food.',
      ],
    },
    {
      id: 'angina',
      label: 'Heart artery narrowing',
      prior: 0.11,
      note: 'A coronary artery that cannot deliver enough blood when the heart '
          + 'works harder. Pressure or heaviness brought on by effort and '
          + 'eased by rest.',
      selfChecks: [
        'Note exactly what you were doing when it started, and how long it took to ease after stopping.',
        'Note whether the same amount of effort brings it on each time.',
      ],
      helps: [
        'This one is assessed, not self-managed. Book with a doctor rather than waiting it out.',
        'Until then, stop the activity that brings it on rather than pushing through.',
      ],
    },
    {
      id: 'anxiety',
      label: 'Anxiety or breathing pattern',
      prior: 0.14,
      note: 'Fast shallow breathing tightens the chest wall and drops carbon '
          + 'dioxide, which causes tingling and light headedness. Real '
          + 'symptoms from a mechanism that is not dangerous.',
      selfChecks: [
        'Note whether tingling in the hands or around the mouth comes with it.',
        'Note whether it appears at rest, often when sitting still.',
      ],
      helps: [
        'Slow the out breath rather than taking bigger in breaths. Six seconds out, four in, for two minutes.',
        'It resolves fully, which is worth knowing while it is happening.',
      ],
    },
    {
      id: 'pericarditis',
      label: 'Lining around the heart',
      prior: 0.03,
      note: 'Inflamed sac around the heart. Sharp, worse lying flat, better '
          + 'sitting forward, often after a viral illness.',
      selfChecks: [
        'Lie flat, then sit and lean forward. Note whether leaning forward clearly helps.',
      ],
      helps: ['Needs assessing rather than managing at home. Book this week.'],
    },
    {
      id: 'pleurisy',
      label: 'Lung lining or infection',
      prior: 0.08,
      note: 'Inflamed lining of the lung, often with a chest infection. Sharp '
          + 'and clearly worse on breathing in.',
      selfChecks: [
        'Note whether you have a fever or a productive cough.',
        'Note whether one particular position eases it.',
      ],
      helps: ['If there is fever or coloured phlegm, this needs seeing rather than waiting.'],
    },
    {
      id: 'pe',
      label: 'Clot in the lung',
      prior: 0.02,
      note: 'A clot that travelled to the lung. Sudden, sharp on breathing in, '
          + 'with breathlessness. Risk rises after long immobility, surgery, '
          + 'pregnancy, or a previous clot.',
      selfChecks: [],
      helps: ['This is an emergency assessment, not something to watch.'],
    },
    {
      id: 'shingles',
      label: 'Shingles',
      prior: 0.02,
      note: 'Nerve inflammation that burns in a band on one side and often '
          + 'starts days before any rash appears.',
      selfChecks: ['Check the painful band for blisters or a rash on one side only.'],
      helps: ['Antiviral treatment works best started within 72 hours, so this is worth an early call.'],
    },
  ],

  questions: [
    {
      id: 'q.onset',
      screening: true,
      order: 1,
      prompt: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Suddenly, worst at once',
          lr: { pe: 4, pericarditis: 1.5, musculoskeletal: 0.6, reflux: 0.5, angina: 0.8 } },
        { id: 'minutes', label: 'Built up over minutes',
          lr: { angina: 2.2, anxiety: 1.4, musculoskeletal: 0.8 } },
        { id: 'days', label: 'Over days',
          lr: { musculoskeletal: 1.6, pleurisy: 1.5, shingles: 1.6, pe: 0.4, angina: 0.6 } },
        { id: 'weeks', label: 'Weeks or longer',
          lr: { musculoskeletal: 2, reflux: 1.8, pe: 0.15, angina: 0.7 } },
      ],
    },
    {
      id: 'q.effort',
      screening: true,
      order: 2,
      prompt: 'What does effort do to it?',
      options: [
        { id: 'brings-on', label: 'Brings it on reliably',
          lr: { angina: 6, musculoskeletal: 0.7, reflux: 0.5, anxiety: 0.6 } },
        { id: 'worse', label: 'Worse, but not only then',
          lr: { angina: 1.6, musculoskeletal: 1.3 } },
        { id: 'no-change', label: 'No difference',
          lr: { angina: 0.2, reflux: 1.4, anxiety: 1.4, musculoskeletal: 1.2 } },
        { id: 'at-rest', label: 'It happens at rest',
          lr: { angina: 0.5, anxiety: 1.8, reflux: 1.5, pericarditis: 1.4 } },
      ],
    },
    {
      id: 'q.rest',
      needs: { anyAnswer: { 'q.effort': ['brings-on', 'worse'] } },
      prompt: 'Does stopping settle it?',
      options: [
        { id: 'minutes', label: 'Within a few minutes',
          lr: { angina: 4, musculoskeletal: 0.6 } },
        { id: 'slow', label: 'Slowly, over an hour or more',
          lr: { angina: 0.5, musculoskeletal: 1.5 } },
        { id: 'no', label: 'Not really',
          lr: { angina: 0.3, musculoskeletal: 1.4, pericarditis: 1.3 } },
      ],
    },
    {
      id: 'q.press',
      screening: true,
      order: 3,
      prompt: 'Press the sore spot. What happens?',
      options: [
        { id: 'reproduces', label: 'It reproduces the pain',
          lr: { musculoskeletal: 5, angina: 0.25, pe: 0.3, reflux: 0.4 } },
        { id: 'tender', label: 'Tender, but different',
          lr: { musculoskeletal: 1.6, angina: 0.8 } },
        { id: 'nothing', label: 'Nothing changes',
          lr: { musculoskeletal: 0.3, angina: 1.5, reflux: 1.3, pe: 1.3 } },
      ],
    },
    {
      id: 'q.breath',
      screening: true,
      order: 4,
      prompt: 'What does a deep breath do?',
      options: [
        { id: 'sharp', label: 'Sharpens it clearly',
          lr: { pleurisy: 4, pe: 3, pericarditis: 2.5, musculoskeletal: 1.4, angina: 0.35 } },
        { id: 'slight', label: 'A little',
          lr: { musculoskeletal: 1.2 } },
        { id: 'none', label: 'No change',
          lr: { pleurisy: 0.2, pe: 0.4, angina: 1.4, reflux: 1.3 } },
      ],
    },
    {
      id: 'q.breathless',
      screening: true,
      order: 5,
      prompt: 'Are you short of breath?',
      options: [
        { id: 'severe', label: 'Yes, badly',
          lr: { pe: 5, pleurisy: 2, angina: 1.8, musculoskeletal: 0.4 } },
        { id: 'mild', label: 'A little',
          lr: { pe: 1.5, anxiety: 1.5, angina: 1.3 } },
        { id: 'none', label: 'No',
          lr: { pe: 0.25, pleurisy: 0.6, musculoskeletal: 1.3, reflux: 1.3 } },
      ],
    },
    {
      id: 'q.position',
      prompt: 'Does position change it?',
      options: [
        { id: 'forward', label: 'Better leaning forward',
          lr: { pericarditis: 6, musculoskeletal: 0.8, angina: 0.6 } },
        { id: 'lying', label: 'Worse lying flat',
          lr: { reflux: 3, pericarditis: 2.5, angina: 0.8 } },
        { id: 'twist', label: 'Worse when I twist',
          lr: { musculoskeletal: 3.5, angina: 0.4 } },
        { id: 'no', label: 'No difference',
          lr: { musculoskeletal: 0.6, angina: 1.3 } },
      ],
    },
    {
      id: 'q.meals',
      prompt: 'Any link to meals?',
      options: [
        { id: 'after', label: 'Worse after eating',
          lr: { reflux: 4, angina: 1.2, musculoskeletal: 0.6 } },
        { id: 'empty', label: 'Worse when empty',
          lr: { reflux: 2.2, musculoskeletal: 0.7 } },
        { id: 'none', label: 'No link',
          lr: { reflux: 0.35 } },
      ],
    },
    {
      id: 'q.spread',
      prompt: 'Does it spread anywhere?',
      options: [
        { id: 'arm-jaw', label: 'To the jaw or arm',
          lr: { angina: 3.5, musculoskeletal: 0.6 } },
        { id: 'back', label: 'Through to the back',
          lr: { reflux: 1.6, angina: 1.2 } },
        { id: 'band', label: 'A band round one side',
          lr: { shingles: 6, musculoskeletal: 1.3, angina: 0.4 } },
        { id: 'no', label: 'It stays put',
          lr: { angina: 0.7, musculoskeletal: 1.3 } },
      ],
    },
    {
      id: 'q.autonomic',
      screening: true,
      order: 6,
      prompt: 'Any sweating or sickness with it?',
      options: [
        { id: 'yes', label: 'Yes',
          lr: { angina: 3, pe: 2, musculoskeletal: 0.4, reflux: 0.6 } },
        { id: 'no', label: 'No',
          lr: { angina: 0.6, musculoskeletal: 1.2 } },
      ],
    },
    {
      id: 'q.legs',
      needs: { anyAnswer: { 'q.breath': ['sharp'], 'q.breathless': ['severe', 'mild'] } },
      prompt: 'Is one calf swollen or sore?',
      options: [
        { id: 'yes', label: 'Yes, one side',
          lr: { pe: 8, musculoskeletal: 0.5 } },
        { id: 'no', label: 'No',
          lr: { pe: 0.4 } },
      ],
    },
    {
      id: 'q.immobile',
      needs: { anyAnswer: { 'q.breath': ['sharp'], 'q.breathless': ['severe', 'mild'] } },
      prompt: 'Recent surgery, a trip, or days in bed?',
      options: [
        { id: 'yes', label: 'Yes, in the last month',
          lr: { pe: 4 } },
        { id: 'no', label: 'No',
          lr: { pe: 0.5 } },
      ],
    },
    {
      id: 'q.fever',
      prompt: 'Any fever?',
      options: [
        { id: 'yes', label: 'Yes, measured',
          lr: { pleurisy: 4, pericarditis: 2, musculoskeletal: 0.5, angina: 0.5 } },
        { id: 'feels', label: 'Feels like it',
          lr: { pleurisy: 1.6 } },
        { id: 'no', label: 'No',
          lr: { pleurisy: 0.4 } },
      ],
    },
    {
      id: 'q.rash',
      needs: { anyAnswer: { 'q.spread': ['band'] } },
      prompt: 'Any rash or blisters in that band?',
      options: [
        { id: 'yes', label: 'Yes', lr: { shingles: 20 } },
        { id: 'not-yet', label: 'Not yet, just pain', lr: { shingles: 2 } },
        { id: 'no', label: 'No', lr: { shingles: 0.3 } },
      ],
    },
  ],

  /* Hard rules. Checked after every answer, and they outrank the ranking. */
  redFlags: [
    {
      id: 'rf.chest.acs',
      urgency: 'emergency',
      answers: { 'q.effort': ['brings-on'], 'q.autonomic': 'yes' },
      headline: 'Chest pressure on effort, with sweating',
      lines: [
        'Pain brought on by exertion together with sweating or sickness is the pattern of a heart artery that cannot keep up. It is the combination that matters, not either one alone.',
        'This is assessed today, in an emergency department, not at a booked appointment.',
        'Do not drive yourself. Call an ambulance.',
        'Bring what you were doing when it started, how long it lasted, and anything you took.',
      ],
    },
    {
      id: 'rf.chest.rest-pain',
      urgency: 'emergency',
      answers: { 'q.effort': ['brings-on'] },
      anyAnswer: { 'q.rest': ['no'] },
      headline: 'Effort pain that is no longer settling with rest',
      lines: [
        'Pain that used to ease when you stopped and now does not is a change in pattern, and that change is the part that matters.',
        'This needs assessing today rather than at the next free appointment.',
        'Do not drive yourself.',
      ],
    },
    {
      id: 'rf.chest.pe',
      urgency: 'emergency',
      answers: { 'q.legs': 'yes' },
      anyAnswer: { 'q.breath': ['sharp'], 'q.breathless': ['severe'] },
      headline: 'Sharp chest pain with a swollen calf',
      lines: [
        'Pain that is worse breathing in, together with swelling in one calf, is how a clot that has travelled to the lung presents.',
        'This needs an emergency assessment now, not a wait and see.',
        'Bring anything relevant: recent surgery, a long flight or drive, pregnancy, the pill, or a previous clot.',
      ],
    },
    {
      id: 'rf.chest.sudden-severe',
      urgency: 'emergency',
      answers: { 'q.onset': 'sudden' },
      minIntensity: 8,
      headline: 'Severe chest pain that started instantly',
      lines: [
        'Pain that reached its worst within seconds and is severe needs ruling out today rather than watching.',
        'Go to an emergency department. Do not drive yourself.',
      ],
    },
    {
      id: 'rf.chest.infection',
      urgency: 'same_day',
      answers: { 'q.fever': 'yes', 'q.breath': 'sharp' },
      headline: 'Fever with pain on breathing in',
      lines: [
        'A measured fever together with pain that sharpens when you breathe in points at a chest infection rather than a strain.',
        'This wants seeing today. A same day appointment or an urgent care centre is the right level.',
        'Bring your temperature readings and note whether anything is coming up when you cough.',
      ],
    },
  ],

  selfChecks: [
    'Press the sore spot and note whether that reproduces the pain.',
    'Note what you were doing each time it starts.',
    'Write down how long each episode lasts, for three days.',
  ],
};
