/* Metric and US units.
 *
 * Everything is stored metric: centimetres, kilograms, millilitres. These
 * convert only at the edges, on the way onto a screen and on the way back off
 * a keyboard, so a person can switch systems without their records changing
 * and without a rounding error accumulating in storage.
 *
 * Height is the awkward one. A person who thinks in feet does not think in
 * 70 inches, so height is offered as two boxes and recombined.
 */

import { settings } from './store.js';

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;
const ML_PER_FLOZ = 29.5735295625;

export function isUS(s = settings.get()) {
  return s.units === 'us';
}

/**
 * Unit words, so a screen never hardcodes one.
 *
 * `length` and friends are the short forms that follow a number. The `Long`
 * forms are for labels, where "Height in in" is not a sentence.
 */
export function units(s = settings.get()) {
  return isUS(s)
    ? { length: 'in', mass: 'lb', volume: 'fl oz',
        lengthLong: 'inches', massLong: 'pounds', volumeLong: 'fluid ounces' }
    : { length: 'cm', mass: 'kg', volume: 'ml',
        lengthLong: 'cm', massLong: 'kg', volumeLong: 'ml' };
}

/* ---- Length ---- */
export const cmToIn = cm => cm / CM_PER_IN;
export const inToCm = inches => inches * CM_PER_IN;

/** Centimetres as feet and remaining inches, for two input boxes. */
export function cmToFeetInches(cm) {
  if (cm == null || !Number.isFinite(cm)) return { feet: null, inches: null };
  const total = Math.round(cmToIn(cm));
  return { feet: Math.floor(total / 12), inches: total % 12 };
}

export function feetInchesToCm(feet, inches) {
  const f = Number.isFinite(feet) ? feet : 0;
  const i = Number.isFinite(inches) ? inches : 0;
  if (!f && !i) return null;
  return inToCm(f * 12 + i);
}

/* ---- Mass ---- */
export const kgToLb = kg => kg / KG_PER_LB;
export const lbToKg = lb => lb * KG_PER_LB;

/* ---- Volume ---- */
export const mlToFloz = ml => ml / ML_PER_FLOZ;
export const flozToMl = oz => oz * ML_PER_FLOZ;

/* ---- Energy ----
 *
 * Held in kcal and converted on the way out, the same as everything else.
 *
 * 4.184 is the conversion in EU food labelling regulation, which is also the
 * figure the calorie is defined against, so this is exact rather than
 * approximate. Labels in kilojoule countries generally print both, which is
 * why this sits below the other units in priority, not because the people
 * reading kilojoules are fewer.
 */
const KJ_PER_KCAL = 4.184;
export const kcalToKj = kcal => kcal * KJ_PER_KCAL;
export const kjToKcal = kj => kj / KJ_PER_KCAL;

export function usesKj(s = settings.get()) {
  return s.energyUnit === 'kj';
}

/** The word that follows an energy number. */
export function energyUnit(s = settings.get()) {
  return usesKj(s) ? 'kJ' : 'kcal';
}

/**
 * A stored kcal figure as the number to show.
 *
 * Kilojoules are read whole. Rounding to the nearest 10 above a thousand
 * keeps a day's total from reading as false precision, since the energy in a
 * plate of food is not known to four figures.
 */
export function energy(kcal, s = settings.get()) {
  if (kcal == null || !Number.isFinite(kcal)) return null;
  if (!usesKj(s)) return Math.round(kcal);
  const kj = kcalToKj(kcal);
  return kj >= 1000 ? Math.round(kj / 10) * 10 : Math.round(kj);
}

/** An energy figure with its unit, for read-only text. */
export function withEnergy(kcal, s = settings.get()) {
  const n = energy(kcal, s);
  return n == null ? null : `${n} ${energyUnit(s)}`;
}

/** A number someone typed in their own unit, back to the kcal that is stored. */
export function storeEnergy(value, s = settings.get()) {
  if (value == null || !Number.isFinite(value)) return null;
  return usesKj(s) ? kjToKcal(value) : value;
}

/**
 * A stored metric value as the number to show, rounded the way that unit is
 * normally read.
 * @param {number|null} value
 * @param {'length'|'mass'|'volume'} kind
 */
export function display(value, kind, s = settings.get()) {
  if (value == null || !Number.isFinite(value)) return null;
  if (!isUS(s)) {
    return kind === 'volume' ? Math.round(value) : Math.round(value * 10) / 10;
  }
  if (kind === 'length') return Math.round(cmToIn(value) * 10) / 10;
  if (kind === 'mass') return Math.round(kgToLb(value) * 10) / 10;
  return Math.round(mlToFloz(value));
}

/** A number a person typed, back into the metric value that gets stored. */
export function store(value, kind, s = settings.get()) {
  if (value == null || !Number.isFinite(value)) return null;
  if (!isUS(s)) return value;
  if (kind === 'length') return inToCm(value);
  if (kind === 'mass') return lbToKg(value);
  return flozToMl(value);
}

/** A value with its unit, for read-only text. */
export function withUnit(value, kind, s = settings.get()) {
  const n = display(value, kind, s);
  if (n == null) return null;
  return `${n} ${units(s)[kind]}`;
}
