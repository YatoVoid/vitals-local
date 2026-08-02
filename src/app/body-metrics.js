/* Body measurements.
 *
 * BMI is a population screening tool, not a description of an individual, so
 * every figure is reported alongside its limits. Waist to height ratio tracks
 * abdominal fat, which carries the metabolic risk, and needs no chart: the
 * threshold is 0.5 for adults regardless of height or sex.
 */

import { profile, settings } from './store.js';
import { isUS, kgToLb as toLb, cmToIn as toIn } from './units.js';

export const BMI_BANDS = [
  { max: 18.5, key: 'under', label: 'Under the healthy range' },
  { max: 25,   key: 'healthy', label: 'Healthy range' },
  { max: 30,   key: 'over', label: 'Above the healthy range' },
  { max: 35,   key: 'obese1', label: 'Obesity, class 1' },
  { max: 40,   key: 'obese2', label: 'Obesity, class 2' },
  { max: Infinity, key: 'obese3', label: 'Obesity, class 3' },
];

const SEVERITY = { under: 'soon', healthy: 'none', over: 'none',
                   obese1: 'soon', obese2: 'soon', obese3: 'soon' };

/**
 * Everything derivable from the profile.
 * Returns null when height and weight are not both known, rather than
 * guessing, because a made up baseline is worse than no baseline.
 */
export function metrics() {
  const p = profile.get();
  const { heightCm, weightKg, age, sex, waistCm, activity } = p;
  if (!heightCm || !weightKg) return null;

  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  const band = BMI_BANDS.find(b => bmi < b.max);

  /* The weight range that puts BMI between 18.5 and 25 at this height. */
  const lowKg = 18.5 * m * m;
  const highKg = 24.9 * m * m;
  const toHealthy = bmi < 18.5 ? lowKg - weightKg
    : bmi >= 25 ? weightKg - highKg
    : 0;

  const male = sex === 'Male';
  const bmr = age
    ? Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (male ? 5 : -161))
    : null;
  const factor = { Low: 1.2, Some: 1.375, Regular: 1.55, Heavy: 1.725 }[activity] ?? 1.2;
  const maintenance = bmr ? Math.round(bmr * factor) : null;

  const whtr = waistCm ? waistCm / heightCm : null;
  const whtrBand = whtr == null ? null
    : whtr < 0.4 ? { key: 'low', label: 'Below the usual range' }
    : whtr < 0.5 ? { key: 'ok', label: 'Healthy range' }
    : whtr < 0.6 ? { key: 'raised', label: 'Raised' }
    : { key: 'high', label: 'High' };

  return {
    heightCm, weightKg, age, sex, waistCm,
    bmi: Math.round(bmi * 10) / 10,
    band,
    severity: SEVERITY[band.key],
    healthyRange: [Math.round(lowKg * 10) / 10, Math.round(highKg * 10) / 10],
    toHealthy: Math.round(Math.abs(toHealthy) * 10) / 10,
    direction: bmi < 18.5 ? 'gain' : bmi >= 25 ? 'lose' : 'none',
    bmr, maintenance, factor,
    whtr: whtr ? Math.round(whtr * 100) / 100 : null,
    whtrBand,
  };
}

/** Units, so the same numbers read correctly for a US profile. */
export function format(m) {
  const us = isUS();
  const kgToLb = k => Math.round(toLb(k));
  const cmToIn = c => Math.round(toIn(c));
  return {
    weight: us ? `${kgToLb(m.weightKg)} lb` : `${m.weightKg} kg`,
    height: us
      ? `${Math.floor(cmToIn(m.heightCm) / 12)} ft ${cmToIn(m.heightCm) % 12} in`
      : `${m.heightCm} cm`,
    range: us
      ? `${kgToLb(m.healthyRange[0])} to ${kgToLb(m.healthyRange[1])} lb`
      : `${m.healthyRange[0]} to ${m.healthyRange[1]} kg`,
    gap: us ? `${kgToLb(m.toHealthy)} lb` : `${m.toHealthy} kg`,
    waist: m.waistCm ? (us ? `${cmToIn(m.waistCm)} in` : `${m.waistCm} cm`) : null,
  };
}

/**
 * The sentence to print under the number. Written as what the measurement
 * describes rather than as a verdict about the person.
 */
export function readOut(m) {
  const f = format(m);
  if (m.direction === 'none') {
    return `A BMI of ${m.bmi} sits in the range associated with the lowest `
         + `risk in population data. For your height that range is ${f.range}.`;
  }
  if (m.direction === 'gain') {
    return `A BMI of ${m.bmi} is below the usual range. For your height, `
         + `${f.range} is the range population data associates with the lowest `
         + `risk, which is about ${f.gap} above where you are. Being under it `
         + `is not automatically a problem, and losing weight without meaning `
         + `to is worth mentioning to a doctor.`;
  }
  return `A BMI of ${m.bmi} is above the range associated with the lowest risk. `
       + `For your height that range is ${f.range}, about ${f.gap} below where `
       + `you are. That gap is the arithmetic, not a target anyone has to hit.`;
}

/** What BMI cannot see. Printed alongside, never hidden behind a tap. */
export const BMI_CAVEATS = [
  'BMI cannot tell muscle from fat. A heavily trained person can measure as '
  + 'overweight while carrying very little fat.',
  'It says nothing about where fat sits, and fat around the organs carries '
  + 'more risk than the same amount elsewhere. Waist measurement catches that '
  + 'and BMI does not.',
  'The thresholds were derived largely from European populations. Risk starts '
  + 'to rise at a lower BMI in people of South Asian, Chinese and some other '
  + 'ancestries, and several countries use lower cut offs as a result.',
  'It was designed to describe populations, not people. Treat it as one '
  + 'number among several rather than a grade.',
];

/** Waist to height is the one line summary worth knowing. */
export const WHTR_NOTE =
  'Keeping your waist under half your height is a simple check that tracks '
  + 'abdominal fat, and it uses the same threshold whatever your height or '
  + 'sex. Measure at the midpoint between the lowest rib and the top of the '
  + 'hip bone, after breathing out, without pulling in.';
