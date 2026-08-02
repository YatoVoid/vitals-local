/* Abdominal pain.
 *
 * The appendicitis questions are the history items of the Alvarado score:
 * pain that migrated to the right lower quadrant, loss of appetite, nausea,
 * tenderness there, rebound, and fever. Migration is the most useful of them
 * in the history, so it is asked early and weighted heavily.
 * The gallbladder questions follow the classic biliary colic description:
 * right upper pain after a fatty meal, coming in waves, radiating to the
 * right shoulder blade.
 *
 * Priors reflect adults with abdominal pain in primary care, where
 * indigestion, constipation and irritable bowel dominate and appendicitis is
 * uncommon but is the one that cannot be missed.
 */

export const ABDOMEN = {
  id: 'abdomen',
  regions: ['abdomen.upper', 'abdomen.lower.left', 'abdomen.lower.right',
            'flank.left', 'flank.right', 'pelvis'],
  label: 'Abdomen',
  typicalQuestions: 7,
  maxQuestions: 9,
  basis: 'Appendicitis questions follow the history items of the Alvarado '
       + 'score. Biliary questions follow the standard description of biliary '
       + 'colic. Urinary questions follow common criteria for uncomplicated '
       + 'urinary tract infection.',

  causes: [
    {
      id: 'gas',
      label: 'Gas or constipation',
      prior: 0.27,
      note: 'Trapped wind or a slow bowel. Crampy, moves about, eases after '
          + 'passing wind or opening the bowels.',
      selfChecks: [
        'Note whether it eases after you open your bowels.',
        'Note how many days since the last time, and whether that is normal for you.',
      ],
      helps: [
        'Walking moves gas better than lying still does.',
        'Fibre and fluid together. Fibre without fluid makes constipation worse, not better.',
        'A regular time on the toilet after breakfast works with the bowel rather than against it.',
      ],
    },
    {
      id: 'gastritis',
      label: 'Stomach lining or ulcer',
      prior: 0.16,
      note: 'Irritated stomach lining. Gnawing or burning high up, often worse '
          + 'on an empty stomach and eased briefly by food or milk.',
      selfChecks: [
        'Note whether eating settles it briefly and then it returns.',
        'Note whether you have taken anti-inflammatories recently.',
      ],
      helps: [
        'Anti-inflammatory painkillers are a common cause. Stopping them is often the whole answer.',
        'Alcohol and smoking both keep it going.',
        'If it keeps returning, testing for H pylori is the standard next step, and it is treatable.',
      ],
    },
    {
      id: 'ibs',
      label: 'Irritable bowel',
      prior: 0.15,
      note: 'A gut that reacts strongly. Pain that comes and goes for months, '
          + 'linked to bowel habit, relieved by opening the bowels, often '
          + 'worse under stress.',
      selfChecks: [
        'Note whether the pain eases once you have opened your bowels.',
        'Note whether stool form changes when the pain changes.',
      ],
      helps: [
        'Regular meals and regular sleep do more than any single food change.',
        'Keep a two week diary before cutting foods out, or you will cut out the wrong ones.',
      ],
    },
    {
      id: 'appendicitis',
      label: 'Appendix',
      prior: 0.05,
      note: 'Inflamed appendix. Classically starts around the navel, settles '
          + 'into the lower right over hours, and keeps building. Movement '
          + 'makes it worse.',
      selfChecks: [],
      helps: ['This is assessed in hospital. Do not eat or drink until you have been seen.'],
    },
    {
      id: 'biliary',
      label: 'Gallbladder',
      prior: 0.08,
      note: 'Gallstones blocking the outlet. Severe waves in the upper right, '
          + 'often an hour after a fatty meal, sometimes felt in the right '
          + 'shoulder blade.',
      selfChecks: ['Note the timing against meals, and how fatty those meals were.'],
      helps: [
        'Attacks that last more than a few hours, or come with fever, need seeing rather than riding out.',
        'Lower fat meals reduce how often attacks happen while you wait for assessment.',
      ],
    },
    {
      id: 'uti',
      label: 'Urine infection',
      prior: 0.09,
      note: 'Infection in the bladder. Burning on passing urine, going often, '
          + 'urgency, sometimes low pain above the pubic bone.',
      selfChecks: ['Note burning, frequency, and whether the urine smells strong or looks cloudy.'],
      helps: [
        'Fluids help symptoms. They do not treat the infection.',
        'Pain in the back or flank with fever means it has moved up, which needs seeing the same day.',
      ],
    },
    {
      id: 'renal-colic',
      label: 'Kidney stone',
      prior: 0.04,
      note: 'A stone moving down. Sudden severe waves in the flank going to '
          + 'the groin, with restlessness rather than lying still.',
      selfChecks: ['Note whether you can find any position that helps. With a stone, usually not.'],
      helps: ['Severe flank pain with fever needs the same day. Without fever it still needs assessing.'],
    },
    {
      id: 'gastroenteritis',
      label: 'Stomach bug',
      prior: 0.12,
      note: 'A short lived infection. Cramps with diarrhoea or vomiting, often '
          + 'after a known exposure, settling over a few days.',
      selfChecks: ['Note whether anyone you ate with is also unwell.'],
      helps: [
        'Fluids in small frequent amounts stay down better than a large glass.',
        'Eat when you feel like it. Starving yourself does not shorten it.',
      ],
    },
    {
      id: 'gynae',
      label: 'Ovary or period related',
      prior: 0.04,
      note: 'Pain from the ovary or uterus. Mid cycle on one side, or coming '
          + 'with a period, or a cyst causing sudden one sided pain.',
      selfChecks: ['Note where you are in your cycle, and whether the timing repeats.'],
      helps: ['Sudden severe one sided pain needs assessing the same day rather than waiting.'],
    },
  ],

  questions: [
    {
      id: 'q.moved',
      screening: true,
      order: 1,
      prompt: 'Has the pain moved since it started?',
      options: [
        { id: 'navel-rlq', label: 'Middle to lower right',
          lr: { appendicitis: 9, gas: 0.4, ibs: 0.3 } },
        { id: 'other-move', label: 'Moved, but differently',
          lr: { gas: 1.4, 'renal-colic': 1.5, appendicitis: 0.8 } },
        { id: 'stayed', label: 'Stayed in one place',
          lr: { appendicitis: 0.5, biliary: 1.3, gastritis: 1.3 } },
        { id: 'wanders', label: 'It wanders around',
          lr: { gas: 2.5, ibs: 2, appendicitis: 0.2 } },
      ],
    },
    {
      id: 'q.trend',
      screening: true,
      order: 2,
      prompt: 'Which way is it going?',
      options: [
        { id: 'worse', label: 'Getting worse',
          lr: { appendicitis: 3, biliary: 1.5, gas: 0.5, ibs: 0.4 } },
        { id: 'same', label: 'About the same',
          lr: { gastritis: 1.3, ibs: 1.3 } },
        { id: 'waves', label: 'Comes in waves',
          lr: { biliary: 3, 'renal-colic': 3, gas: 2, appendicitis: 0.6 } },
        { id: 'easing', label: 'Easing off',
          lr: { appendicitis: 0.2, gas: 1.6, gastroenteritis: 1.4 } },
      ],
    },
    {
      id: 'q.move-hurts',
      screening: true,
      order: 3,
      prompt: 'Worse moving or coughing?',
      options: [
        { id: 'yes', label: 'Yes, clearly',
          lr: { appendicitis: 4, gas: 0.5, ibs: 0.4 } },
        { id: 'a-bit', label: 'A little', lr: { appendicitis: 1.3 } },
        { id: 'no', label: 'No',
          lr: { appendicitis: 0.25, gas: 1.4, ibs: 1.4, 'renal-colic': 1.3 } },
      ],
    },
    {
      id: 'q.appetite',
      screening: true,
      order: 4,
      prompt: 'How is your appetite?',
      options: [
        { id: 'gone', label: 'Gone completely',
          lr: { appendicitis: 3, gastroenteritis: 1.6, ibs: 0.5 } },
        { id: 'reduced', label: 'Reduced', lr: { appendicitis: 1.4 } },
        { id: 'normal', label: 'Normal',
          lr: { appendicitis: 0.3, ibs: 1.4, gas: 1.4 } },
      ],
    },
    {
      id: 'q.fever',
      screening: true,
      order: 5,
      prompt: 'Any fever?',
      options: [
        { id: 'measured', label: 'Yes, measured',
          lr: { appendicitis: 3, uti: 2.5, gastroenteritis: 2, biliary: 2, ibs: 0.3, gas: 0.3 } },
        { id: 'feels', label: 'Feels like it', lr: { appendicitis: 1.5, gastroenteritis: 1.5 } },
        { id: 'no', label: 'No', lr: { appendicitis: 0.6, uti: 0.6 } },
      ],
    },
    {
      id: 'q.bowels',
      prompt: 'What are your bowels doing?',
      options: [
        { id: 'diarrhoea', label: 'Loose or frequent',
          lr: { gastroenteritis: 4, ibs: 1.8, appendicitis: 0.8 } },
        { id: 'constipated', label: 'Not been for days',
          lr: { gas: 3, ibs: 1.6, appendicitis: 1.2 } },
        { id: 'alternating', label: 'Swinging between both',
          lr: { ibs: 3.5, gas: 1.3 } },
        { id: 'normal', label: 'Normal',
          lr: { gastroenteritis: 0.3, ibs: 0.5, uti: 1.3, biliary: 1.3 } },
      ],
    },
    {
      id: 'q.relief-bowel',
      needs: { anyAnswer: { 'q.bowels': ['diarrhoea', 'constipated', 'alternating'] } },
      prompt: 'Does opening your bowels help?',
      options: [
        { id: 'yes', label: 'Yes, clearly', lr: { ibs: 4, gas: 2.5, appendicitis: 0.3 } },
        { id: 'no', label: 'No', lr: { ibs: 0.4 } },
      ],
    },
    {
      id: 'q.meals',
      prompt: 'Any link to meals?',
      options: [
        { id: 'fatty', label: 'Worse after fatty food',
          lr: { biliary: 5, gastritis: 1.2 } },
        { id: 'any-food', label: 'Worse after any food',
          lr: { gastritis: 2, biliary: 1.5 } },
        { id: 'empty', label: 'Better after eating',
          lr: { gastritis: 4, biliary: 0.5 } },
        { id: 'none', label: 'No link',
          lr: { gastritis: 0.4, biliary: 0.4 } },
      ],
    },
    {
      id: 'q.urine',
      prompt: 'Anything different passing urine?',
      options: [
        { id: 'burning', label: 'Burning or stinging',
          lr: { uti: 8, gas: 0.5, ibs: 0.5 } },
        { id: 'often', label: 'Going more often',
          lr: { uti: 3 } },
        { id: 'blood', label: 'Blood in it',
          lr: { uti: 3, 'renal-colic': 4 } },
        { id: 'normal', label: 'Normal', lr: { uti: 0.2, 'renal-colic': 0.6 } },
      ],
    },
    {
      id: 'q.position',
      prompt: 'Any position that helps?',
      options: [
        { id: 'still', label: 'Lying still helps',
          lr: { appendicitis: 2.5, 'renal-colic': 0.3 } },
        { id: 'restless', label: 'Nothing helps, cannot keep still',
          lr: { 'renal-colic': 6, biliary: 2, appendicitis: 0.5 } },
        { id: 'curled', label: 'Curling up helps', lr: { gas: 2, ibs: 1.6 } },
        { id: 'no-diff', label: 'No difference', lr: {} },
      ],
    },
    {
      id: 'q.duration',
      prompt: 'How long has this been going on?',
      options: [
        { id: 'hours', label: 'Hours',
          lr: { appendicitis: 2, 'renal-colic': 2, biliary: 1.8, ibs: 0.2 } },
        { id: 'days', label: 'A few days',
          lr: { gastroenteritis: 2, appendicitis: 1.2, ibs: 0.5 } },
        { id: 'weeks', label: 'Weeks',
          lr: { gastritis: 2, ibs: 2, appendicitis: 0.1 } },
        { id: 'months', label: 'Months, on and off',
          lr: { ibs: 5, gastritis: 1.6, appendicitis: 0.02, gastroenteritis: 0.1 } },
      ],
    },
    {
      id: 'q.cycle',
      prompt: 'Does it track with your cycle?',
      options: [
        { id: 'yes', label: 'Yes', lr: { gynae: 8, appendicitis: 0.5 } },
        { id: 'no', label: 'No', lr: { gynae: 0.3 } },
        { id: 'na', label: 'Does not apply', lr: { gynae: 0.05 } },
      ],
    },
  ],

  redFlags: [
    {
      id: 'rf.abdo.appendicitis',
      urgency: 'emergency',
      answers: { 'q.moved': 'navel-rlq' },
      anyAnswer: { 'q.fever': ['measured', 'feels'], 'q.move-hurts': ['yes'] },
      headline: 'Pain that moved to the lower right and is still building',
      lines: [
        'Pain that started near the navel, settled into the lower right, and is worse when you move is how an inflamed appendix behaves. Added fever or loss of appetite makes that more likely, not less.',
        'This needs assessing within hours, in an emergency department.',
        'Do not eat or drink from now on, in case an operation is needed.',
        'Bring the time it started, your temperature readings, and when you last ate.',
      ],
    },
    {
      id: 'rf.abdo.peritonitis',
      urgency: 'emergency',
      answers: { 'q.move-hurts': 'yes', 'q.position': 'still' },
      minIntensity: 7,
      headline: 'Severe pain, worse with any movement',
      lines: [
        'Severe pain that makes you lie completely still, where any movement or a cough makes it worse, points at irritation of the lining of the abdomen.',
        'Go to an emergency department now.',
        'Do not eat or drink until you have been seen.',
      ],
    },
    {
      id: 'rf.abdo.pyelonephritis',
      urgency: 'same_day',
      answers: { 'q.fever': ['measured'], 'q.urine': ['burning', 'often', 'blood'] },
      headline: 'Urine symptoms with a fever',
      lines: [
        'Burning or frequency together with a measured fever suggests the infection has reached the kidney rather than staying in the bladder.',
        'This needs seeing today, not at the next free appointment.',
        'Bring your temperature readings and note any pain in your back or side.',
      ],
    },
    {
      id: 'rf.abdo.stone-fever',
      urgency: 'emergency',
      answers: { 'q.position': 'restless', 'q.fever': ['measured'] },
      headline: 'Severe waves of pain with a fever',
      lines: [
        'Pain severe enough that you cannot keep still, together with a fever, is a combination that needs ruling out urgently. A blocked and infected kidney becomes serious quickly.',
        'Go to an emergency department now.',
      ],
    },
    {
      id: 'rf.abdo.gynae-sudden',
      urgency: 'same_day',
      answers: { 'q.cycle': 'yes', 'q.trend': 'worse' },
      minIntensity: 7,
      headline: 'Severe one sided pain that is getting worse',
      lines: [
        'Severe pain on one side that keeps building needs assessing the same day. A twisted ovary and a pregnancy in the wrong place both present this way and both are time sensitive.',
        'If you could be pregnant, say so when you call. It changes what gets checked first.',
      ],
    },
  ],

  selfChecks: [
    'Mark the sorest point on your skin, and check twice a day whether it has moved.',
    'Take your temperature morning and evening and write it down.',
    'Note when you last opened your bowels and last ate.',
  ],
};
