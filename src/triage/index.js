/* Question banks, and how a region finds the right one. */

import { CHEST } from './chest.js';
import { ABDOMEN } from './abdomen.js';
import { BACK } from './back.js';
import { HEAD } from './head.js';
import { LIMB } from './limb.js';

export const BANKS = [CHEST, ABDOMEN, BACK, HEAD, LIMB];

/* Anything without a dedicated bank still gets a sensible history rather
   than nothing. The questions here are the ones that apply wherever it
   hurts: how it started, what changes it, and whether anything systemic is
   going on. */
export const GENERIC = {
  id: 'generic',
  regions: [],
  label: 'General',
  typicalQuestions: 6,
  maxQuestions: 7,
  basis: 'A general history for regions without a dedicated question set.',
  causes: [
    { id: 'soft-tissue', label: 'Muscle or soft tissue', prior: 0.4,
      note: 'Sore to press, worse using it, settles with time.',
      helps: ['Keep using it gently. Complete rest slows recovery.',
              'Heat after the first day or two helps more than ice.'] },
    { id: 'overuse', label: 'Overuse', prior: 0.25,
      note: 'Built up over weeks after a change in activity.',
      helps: ['Cut the load rather than stopping, then rebuild slowly.'] },
    { id: 'joint', label: 'Joint irritation', prior: 0.18,
      note: 'Stiff first thing, loosens with movement.',
      helps: ['Regular gentle movement beats rest.'] },
    { id: 'referred', label: 'Coming from elsewhere', prior: 0.12,
      note: 'Nothing to find at the painful spot.',
      helps: ['Worth checking the joint above and below.'] },
    { id: 'systemic', label: 'Something needing a look', prior: 0.05,
      note: 'Constant, present at night, with fever or weight loss.',
      helps: ['This wants assessing rather than managing at home.'] },
  ],
  questions: [
    { id: 'g.onset', screening: true, order: 1, prompt: 'How did it start?',
      options: [
        { id: 'injury', label: 'An injury', lr: { 'soft-tissue': 3, overuse: 0.3 } },
        { id: 'gradual', label: 'Gradually', lr: { overuse: 3, joint: 2, 'soft-tissue': 0.6 } },
        { id: 'sudden-none', label: 'Suddenly, for no reason', lr: { systemic: 2, referred: 1.5 } },
      ] },
    { id: 'g.systemic', screening: true, order: 2, prompt: 'Fever, night sweats, or weight loss?',
      options: [
        { id: 'yes', label: 'Yes', lr: { systemic: 12, 'soft-tissue': 0.3 } },
        { id: 'no', label: 'No', lr: { systemic: 0.2 } },
      ] },
    { id: 'g.night', screening: true, order: 3, prompt: 'Does it wake you at night?',
      options: [
        { id: 'constant', label: 'Yes, nothing helps', lr: { systemic: 5, 'soft-tissue': 0.4 } },
        { id: 'turning', label: 'Only when I move', lr: { 'soft-tissue': 1.5, joint: 1.3 } },
        { id: 'no', label: 'No', lr: { systemic: 0.3 } },
      ] },
    { id: 'g.press', prompt: 'Does pressing it reproduce the pain?',
      options: [
        { id: 'yes', label: 'Exactly', lr: { 'soft-tissue': 3, referred: 0.2 } },
        { id: 'no', label: 'Not at all', lr: { referred: 4, 'soft-tissue': 0.4 } },
      ] },
    { id: 'g.activity', prompt: 'What does activity do?',
      options: [
        { id: 'warms', label: 'Eases as I warm up', lr: { overuse: 3, joint: 1.5 } },
        { id: 'worse', label: 'Worse the more I do', lr: { 'soft-tissue': 2, joint: 1.5 } },
        { id: 'none', label: 'No difference', lr: { referred: 2, systemic: 1.5 } },
      ] },
    { id: 'g.duration', prompt: 'How long has it been going on?',
      options: [
        { id: 'days', label: 'Days', lr: { 'soft-tissue': 2, joint: 0.6 } },
        { id: 'weeks', label: 'Weeks', lr: { overuse: 2 } },
        { id: 'months', label: 'Months', lr: { joint: 2.5, overuse: 1.4, 'soft-tissue': 0.5 } },
      ] },
    { id: 'g.morning', prompt: 'How long is the morning stiffness?',
      options: [
        { id: 'short', label: 'Under half an hour', lr: { joint: 2.5 } },
        { id: 'long', label: 'Over an hour', lr: { systemic: 2, joint: 0.7 } },
        { id: 'none', label: 'None', lr: { joint: 0.5 } },
      ] },
  ],
  redFlags: [
    { id: 'rf.generic.systemic', urgency: 'same_day',
      answers: { 'g.systemic': 'yes' },
      headline: 'Pain with fever, night sweats, or unplanned weight loss',
      lines: [
        'Pain on its own is common. Pain together with fever, drenching night sweats, or weight you did not mean to lose is a different situation and gets investigated.',
        'Book to be seen within a few days.',
        'Bring how much weight, over how long, and any temperature readings.',
      ] },
    { id: 'rf.generic.night', urgency: 'same_day',
      answers: { 'g.night': 'constant' },
      headline: 'Pain that wakes you and no position relieves',
      lines: [
        'Pain from muscles and joints nearly always eases in some position. Pain that is constant regardless of how you lie behaves differently.',
        'Worth being seen within a few days.',
      ] },
  ],
  selfChecks: [
    'Press the area and note whether that reproduces the pain.',
    'Note which movement brings it on and which relieves it.',
    'Write down when it starts and how long it lasts, for three days.',
  ],
};

/** The bank covering a region id, or the general one. */
export function bankFor(regionId) {
  return BANKS.find(b => b.regions.includes(regionId)) ?? GENERIC;
}

export { CHEST, ABDOMEN, BACK, HEAD, LIMB };
