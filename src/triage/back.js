/* Low back pain.
 *
 * The red flags here are the set that national back pain guidelines agree
 * on: cauda equina syndrome (saddle numbness, bladder or bowel change,
 * bilateral leg symptoms), possible fracture, possible infection, and
 * possible malignancy. Cauda equina turns on hours rather than days, so the
 * saddle and bladder questions are asked early of anyone with leg symptoms.
 *
 * The straight leg pattern and pain running below the knee separate nerve
 * root irritation from ordinary mechanical pain; the two are managed
 * differently.
 *
 * Priors reflect the well replicated finding that the large majority of low
 * back pain in primary care has no identifiable structural cause and settles,
 * that a minority is nerve root related, and that serious causes are rare
 * but are the reason the screening questions exist.
 */

export const BACK = {
  id: 'back',
  regions: ['back.lower.left', 'back.lower.right', 'back.mid',
            'back.upper.left', 'back.upper.right', 'pelvis.back'],
  label: 'Back',
  typicalQuestions: 7,
  maxQuestions: 9,
  basis: 'Screening questions follow the red flag set common to national low '
       + 'back pain guidelines: cauda equina, fracture, infection, and '
       + 'malignancy. Nerve root questions follow the standard radicular '
       + 'pattern.',

  causes: [
    {
      id: 'mechanical',
      label: 'Mechanical strain',
      prior: 0.55,
      note: 'Muscle, joint and ligament working badly together. Worse with '
          + 'some positions and better with others, no single damaged part to '
          + 'point at, and it settles.',
      selfChecks: [
        'Note which position relieves it and which brings it on. That pattern is the useful information.',
        'Time how long the morning stiffness lasts.',
      ],
      helps: [
        'Keep moving. Bed rest makes back pain last longer, which is one of the better established findings in the field.',
        'Walking is the single most useful thing most days. Little and often beats one long walk.',
        'Most episodes improve substantially within six weeks. Slow improvement is still improvement.',
        'Heat helps more than ice after the first day or two.',
      ],
    },
    {
      id: 'radicular',
      label: 'Nerve root irritation',
      prior: 0.14,
      note: 'A disc or bony change pressing a nerve root. Pain running below '
          + 'the knee in a line, often with pins and needles or weakness, '
          + 'usually worse sitting or bending.',
      selfChecks: [
        'Trace where it runs with a finger. Below the knee in a line matters more than aching in the buttock.',
        'Check whether you can walk on your heels and on your toes.',
      ],
      helps: [
        'Most nerve root pain settles over six to twelve weeks without surgery.',
        'Position matters more than usual: find the one that eases the leg and use it often.',
        'New or worsening weakness is the thing to report, not the pain level.',
      ],
    },
    {
      id: 'facet',
      label: 'Small back joints',
      prior: 0.11,
      note: 'The paired joints at the back of the spine. Worse leaning back or '
          + 'twisting, better leaning forward, usually one side.',
      selfChecks: ['Lean backwards slowly and note whether that reproduces it.'],
      helps: ['Movements that avoid extension while it settles, then rebuilding into them.'],
    },
    {
      id: 'si',
      label: 'Pelvic joint',
      prior: 0.07,
      note: 'The joint between spine and pelvis. One sided, low, sometimes into '
          + 'the buttock, worse on stairs or standing on one leg.',
      selfChecks: ['Stand on one leg, then the other. Note whether one clearly hurts more.'],
      helps: ['Hip and trunk strength work does more here than stretching does.'],
    },
    {
      id: 'stenosis',
      label: 'Narrowed spinal canal',
      prior: 0.05,
      note: 'Less room for the nerves, usually with age. Legs get heavy or '
          + 'achy on walking, relieved by sitting or leaning forward, further '
          + 'uphill than down.',
      selfChecks: ['Note how far you can walk before the legs go, and whether leaning on a trolley extends it.'],
      helps: ['Cycling and leaning forward are usually tolerated far better than flat walking.'],
    },
    {
      id: 'fracture',
      label: 'Vertebral fracture',
      prior: 0.02,
      note: 'A cracked vertebra, sometimes after minor force where bone is '
          + 'thin. Sudden, focal, worse on any loading.',
      selfChecks: [],
      helps: ['Needs imaging rather than management at home.'],
    },
    {
      id: 'infection-tumour',
      label: 'Something needing investigation',
      prior: 0.01,
      note: 'Infection or growth in or near the spine. Constant, present at '
          + 'night, not relieved by position, often with fever or weight loss.',
      selfChecks: [],
      helps: ['This is an investigation pathway, not a self care one.'],
    },
    {
      id: 'cauda-equina',
      label: 'Nerve bundle compression',
      prior: 0.005,
      note: 'Pressure on the bundle of nerves at the base of the spine. '
          + 'Numbness where you sit, trouble passing or controlling urine, '
          + 'weakness in both legs. Rare, and time critical.',
      selfChecks: [],
      helps: ['This is an emergency, assessed the same day, because delay costs function permanently.'],
    },
  ],

  questions: [
    {
      id: 'q.saddle',
      screening: true,
      order: 1,
      prompt: 'Numb between your legs, where you sit?',
      options: [
        { id: 'yes', label: 'Yes',
          lr: { 'cauda-equina': 40, mechanical: 0.3 } },
        { id: 'unsure', label: 'Not sure',
          lr: { 'cauda-equina': 3 } },
        { id: 'no', label: 'No',
          lr: { 'cauda-equina': 0.2 } },
      ],
    },
    {
      id: 'q.bladder',
      screening: true,
      order: 2,
      prompt: 'Any change passing urine?',
      options: [
        { id: 'retention', label: 'Cannot go, or cannot feel it',
          lr: { 'cauda-equina': 30 } },
        { id: 'incontinent', label: 'Leaking without knowing',
          lr: { 'cauda-equina': 25 } },
        { id: 'no', label: 'No change',
          lr: { 'cauda-equina': 0.1 } },
      ],
    },
    {
      id: 'q.leg',
      screening: true,
      order: 3,
      prompt: 'Does pain run down a leg?',
      options: [
        { id: 'below-knee', label: 'Past the knee',
          lr: { radicular: 6, mechanical: 0.4, stenosis: 1.5 } },
        { id: 'both-legs', label: 'Down both legs',
          lr: { stenosis: 4, 'cauda-equina': 5, radicular: 1.2, mechanical: 0.4 } },
        { id: 'buttock', label: 'To the buttock only',
          lr: { si: 2.5, facet: 1.8, radicular: 0.7 } },
        { id: 'no', label: 'It stays in my back',
          lr: { radicular: 0.2, mechanical: 1.5, stenosis: 0.3 } },
      ],
    },
    {
      id: 'q.night',
      screening: true,
      order: 4,
      prompt: 'What is it like at night?',
      options: [
        { id: 'wakes-constant', label: 'Wakes me, nothing helps',
          lr: { 'infection-tumour': 8, mechanical: 0.3, fracture: 1.5 } },
        { id: 'turning', label: 'Hurts when I turn over',
          lr: { mechanical: 1.5, facet: 1.3 } },
        { id: 'fine', label: 'Fine once I am settled',
          lr: { 'infection-tumour': 0.2, mechanical: 1.4 } },
      ],
    },
    {
      id: 'q.trauma',
      screening: true,
      order: 5,
      prompt: 'Did anything set it off?',
      options: [
        { id: 'fall', label: 'A fall or an accident',
          lr: { fracture: 8, mechanical: 0.8 } },
        { id: 'lift', label: 'Lifting or twisting',
          lr: { mechanical: 2.5, radicular: 1.5, fracture: 0.6 } },
        { id: 'minor', label: 'Something minor, like a sneeze',
          lr: { fracture: 3, mechanical: 1.2 } },
        { id: 'nothing', label: 'Nothing I can name',
          lr: { mechanical: 1.2, 'infection-tumour': 1.5, stenosis: 1.4 } },
      ],
    },
    {
      id: 'q.systemic',
      screening: true,
      order: 6,
      prompt: 'Fever, night sweats, or unplanned weight loss?',
      options: [
        { id: 'yes', label: 'Yes, one or more',
          lr: { 'infection-tumour': 12, mechanical: 0.2 } },
        { id: 'no', label: 'No', lr: { 'infection-tumour': 0.2 } },
      ],
    },
    {
      id: 'q.position',
      prompt: 'Which position is worst?',
      options: [
        { id: 'sitting', label: 'Sitting and bending',
          lr: { radicular: 3, facet: 0.5, stenosis: 0.4 } },
        { id: 'standing', label: 'Standing and walking',
          lr: { stenosis: 3.5, facet: 2, radicular: 0.7 } },
        { id: 'back-bend', label: 'Leaning backwards',
          lr: { facet: 4, radicular: 0.6 } },
        { id: 'all', label: 'Everything hurts about the same',
          lr: { 'infection-tumour': 2, fracture: 1.6, mechanical: 0.7 } },
      ],
    },
    {
      id: 'q.walk',
      needs: { anyAnswer: { 'q.leg': ['below-knee', 'both-legs'], 'q.position': ['standing'] } },
      prompt: 'What happens after a few hundred metres?',
      options: [
        { id: 'heavy-better-sitting', label: 'Legs get heavy, sitting fixes it',
          lr: { stenosis: 8, radicular: 0.8 } },
        { id: 'worse-leg', label: 'The leg pain gets worse',
          lr: { radicular: 2 } },
        { id: 'fine', label: 'No real change', lr: { stenosis: 0.2 } },
      ],
    },
    {
      id: 'q.weakness',
      needs: { anyAnswer: { 'q.leg': ['below-knee', 'both-legs'] } },
      prompt: 'Any weakness in the leg or foot?',
      options: [
        { id: 'foot-drop', label: 'Cannot lift my foot',
          lr: { radicular: 6, 'cauda-equina': 4 } },
        { id: 'mild', label: 'Weaker than the other side',
          lr: { radicular: 2.5 } },
        { id: 'no', label: 'No', lr: { radicular: 0.7 } },
      ],
    },
    {
      id: 'q.morning',
      prompt: 'How long is the morning stiffness?',
      options: [
        { id: 'over-hour', label: 'Over an hour',
          lr: { mechanical: 0.7, facet: 1.3 } },
        { id: 'under-30', label: 'Under half an hour',
          lr: { mechanical: 1.5 } },
        { id: 'none', label: 'None', lr: {} },
      ],
    },
    {
      id: 'q.duration',
      prompt: 'How long has this episode lasted?',
      options: [
        { id: 'days', label: 'A few days',
          lr: { mechanical: 2, 'infection-tumour': 0.5, stenosis: 0.3 } },
        { id: 'weeks', label: 'Weeks', lr: { mechanical: 1.3, radicular: 1.4 } },
        { id: 'months', label: 'Months',
          lr: { stenosis: 2.5, mechanical: 0.7, 'infection-tumour': 1.5 } },
      ],
    },
  ],

  redFlags: [
    {
      id: 'rf.back.cauda-equina',
      urgency: 'emergency',
      anyAnswer: {
        'q.saddle': ['yes'],
        'q.bladder': ['retention', 'incontinent'],
      },
      headline: 'Numbness where you sit, or a change in bladder control',
      lines: [
        'Numbness between the legs, or losing the ability to feel or control passing urine, alongside back pain, points at pressure on the bundle of nerves at the base of the spine.',
        'This is assessed today, in an emergency department. The window for keeping full function is measured in hours, not days.',
        'Go now rather than waiting to see whether it settles.',
        'Tell them exactly when the numbness or the bladder change started. That timing decides what happens next.',
      ],
    },
    {
      id: 'rf.back.systemic',
      urgency: 'same_day',
      answers: { 'q.systemic': 'yes' },
      headline: 'Back pain with fever, night sweats, or unplanned weight loss',
      lines: [
        'Back pain on its own is common. Back pain together with fever, drenching night sweats, or weight you did not mean to lose is a different situation and needs investigating rather than managing.',
        'Book to be seen today.',
        'Bring how much weight, over how long, and any temperature readings.',
      ],
    },
    {
      id: 'rf.back.night',
      urgency: 'same_day',
      answers: { 'q.night': 'wakes-constant', 'q.trauma': 'nothing' },
      headline: 'Pain that wakes you and no position relieves',
      lines: [
        'Mechanical back pain almost always eases in some position. Pain that is constant, wakes you, and does not respond to how you lie behaves differently and should be looked into.',
        'Book to be seen within a few days.',
        'Note how many nights it has woken you and whether anything at all helps.',
      ],
    },
    {
      id: 'rf.back.fracture',
      urgency: 'same_day',
      anyAnswer: { 'q.trauma': ['fall', 'minor'] },
      minIntensity: 7,
      headline: 'Severe back pain after a fall or a minor strain',
      lines: [
        'Severe focal back pain after a fall needs imaging. So does severe pain after something trivial like a sneeze, because that pattern suggests bone that gives way more easily than it should.',
        'Get seen today.',
        'Say what the force actually was. A minor cause with major pain is the useful detail.',
      ],
    },
    {
      id: 'rf.back.foot-drop',
      urgency: 'same_day',
      answers: { 'q.weakness': 'foot-drop' },
      headline: 'Cannot lift your foot properly',
      lines: [
        'Weakness lifting the foot is a nerve losing function rather than a nerve being irritated. That distinction changes how urgently it is looked at.',
        'Get seen today.',
        'Note when you first noticed it and whether it is getting worse by the hour or by the week.',
      ],
    },
  ],

  selfChecks: [
    'Note which position relieves it and which brings it on.',
    'Check whether anything runs below the knee, and trace the line with a finger.',
    'Time how long the morning stiffness lasts.',
    'Try walking on your heels and on your toes, and note any difference between sides.',
  ],
};
