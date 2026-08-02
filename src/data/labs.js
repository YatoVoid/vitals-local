/* Blood test markers, and what a number actually means.
 *
 * A reference interval is the central 95% of a reference population. Two
 * things follow that people are rarely told. One in twenty healthy people sit
 * outside it by arithmetic alone. And sitting just inside it says only that
 * you resemble that population, not that the value is comfortable for you.
 *
 * For several of these markers the threshold that changes what anyone does is
 * not the edge of the range at all. Ferritin is the clearest case: plenty of
 * laboratories report from 15 upward, while iron deficiency is treated from
 * below 30. So each marker carries zones with the thresholds that are acted
 * on, and each zone says what that band means.
 *
 * Sources are named per marker. Where two bodies use different cut offs, both
 * are given rather than one being picked silently.
 */

/**
 * Zones are read in order and the first whose `upTo` the value does not exceed
 * wins, so they must be listed low to high with the last one open ended.
 */
export const MARKERS = [
  {
    id: 'hb',
    label: 'Haemoglobin',
    unit: 'g/L',
    step: 1,
    /* The single biggest error in reading your own haemoglobin is using
       somebody else's threshold: the anaemia cut off differs by about
       10 g/L between men and women. */
    rangeFor: p => (p?.sex === 'Female'
      ? { low: 120, high: 155, pop: 'non-pregnant adult women, WHO thresholds' }
      : { low: 130, high: 170, pop: 'adult men, WHO thresholds' }),
    zonesFor: p => {
      const anaemia = p?.sex === 'Female' ? 120 : 130;
      const high = p?.sex === 'Female' ? 165 : 180;
      return [
        { upTo: 80, key: 'severe', severity: 'now',
          label: 'Severe anaemia',
          note: 'Below 80 is severe anaemia on the WHO scale. This is assessed '
              + 'promptly rather than at the next routine appointment.' },
        { upTo: 110, key: 'moderate', severity: 'soon',
          label: 'Moderate anaemia',
          note: 'Between 80 and 110 is moderate anaemia. The number says how '
              + 'low the haemoglobin is, not why, and the why is what gets '
              + 'treated. Iron studies, B12 and folate are the usual next step.' },
        { upTo: anaemia, key: 'mild', severity: 'soon',
          label: 'Mild anaemia',
          note: `Below ${anaemia} meets the WHO definition of anaemia for you. `
              + 'Mild anaemia often has no symptoms and still has a cause worth '
              + 'finding, particularly if it is new.' },
        { upTo: anaemia + 10, key: 'low-normal', severity: 'none',
          label: 'Just inside the range',
          note: 'Inside the range by a small margin. On its own that is not '
              + 'anaemia. What matters more than the position is the direction: '
              + 'a value drifting down across tests means something even while '
              + 'every one of them reads as normal.' },
        { upTo: high, key: 'ok', severity: 'none',
          label: 'Comfortably inside',
          note: 'Well inside the usual range.' },
        { upTo: Infinity, key: 'high', severity: 'soon',
          label: 'Above the range',
          note: 'Raised haemoglobin follows dehydration, smoking, sleep apnoea, '
              + 'altitude, or less often a marrow condition. A repeat when well '
              + 'hydrated comes before anything else.' },
      ];
    },
    basis: 'WHO haemoglobin thresholds for anaemia, 2011 and the 2024 revision.',
  },

  {
    id: 'fer',
    label: 'Ferritin',
    unit: 'ug/L',
    step: 1,
    rangeFor: () => ({ low: 30, high: 300, pop: 'adults, mixed cohort' }),
    zonesFor: () => [
      { upTo: 15, key: 'empty', severity: 'soon',
        label: 'Iron stores empty',
        note: 'Below 15 means depleted iron stores by the WHO threshold, '
            + 'whatever the haemoglobin is doing. Iron deficiency arrives well '
            + 'before anaemia does.' },
      { upTo: 30, key: 'deficient', severity: 'soon',
        label: 'Iron deficient, even though many labs print this as normal',
        note: 'This is the band the question is really about. Plenty of '
            + 'laboratories start their range at 15, while below 30 is the cut '
            + 'off used to identify iron deficiency, with roughly 92 percent '
            + 'sensitivity and 98 percent specificity against bone marrow iron. '
            + 'A ferritin of 20 printed as normal is still iron deficiency.' },
      { upTo: 100, key: 'low-ish', severity: 'none',
        label: 'Adequate, unless there is inflammation',
        note: 'Comfortable in someone well. Ferritin also rises with any '
            + 'inflammation, infection or liver disease, so this band can hide '
            + 'deficiency when CRP is up. Where inflammation is present, '
            + 'deficiency is considered up to 100, and transferrin saturation '
            + 'settles it.' },
      { upTo: 300, key: 'ok', severity: 'none',
        label: 'Comfortably inside',
        note: 'Iron stores are not the question at this level.' },
      { upTo: Infinity, key: 'high', severity: 'soon',
        label: 'Above the range',
        note: 'Raised ferritin is far more often inflammation, alcohol or '
            + 'fatty liver than iron overload. Ferritin alone cannot tell them '
            + 'apart; transferrin saturation is what separates them.' },
    ],
    basis: 'WHO ferritin thresholds, and the Guyatt meta-analysis of ferritin '
         + 'against bone marrow iron for the deficiency cut off.',
  },

  {
    id: 'vitd',
    label: 'Vitamin D, 25-OH',
    unit: 'nmol/L',
    step: 1,
    rangeFor: () => ({ low: 50, high: 125, pop: 'adults, no seasonal adjustment' }),
    zonesFor: () => [
      { upTo: 25, key: 'deficient', severity: 'soon',
        label: 'Deficient',
        note: 'Below 25 is deficiency on the UK threshold, and carries a real '
            + 'risk to bone. This is the level at which treatment doses, rather '
            + 'than a maintenance supplement, are used.' },
      { upTo: 50, key: 'inadequate', severity: 'none',
        label: 'Below what bone health needs',
        note: 'Between 25 and 50 is inadequate rather than deficient. The '
            + 'US Institute of Medicine puts 50 as the level meeting the needs '
            + 'of 97.5 percent of people, so this band sits under that.' },
      { upTo: 75, key: 'sufficient', severity: 'none',
        label: 'Sufficient, with little margin',
        note: 'Above the bone health threshold. Worth knowing that this is a '
            + 'winter reading in most of the northern hemisphere and a summer '
            + 'one will read higher, so a value here in August is lower than it '
            + 'looks come February.' },
      { upTo: 125, key: 'ok', severity: 'none',
        label: 'Comfortably sufficient',
        note: 'No case for more. Benefits above this level have not been shown '
            + 'in trials.' },
      { upTo: Infinity, key: 'high', severity: 'soon',
        label: 'Above the range',
        note: 'Usually from supplements rather than sun, since skin stops '
            + 'making vitamin D once stores are full. Worth reviewing the dose.' },
    ],
    basis: 'UK Scientific Advisory Committee on Nutrition for the deficiency '
         + 'threshold, US Institute of Medicine for sufficiency.',
  },

  {
    id: 'tsh',
    label: 'TSH',
    unit: 'mIU/L',
    step: 0.1,
    rangeFor: () => ({ low: 0.4, high: 4.0, pop: 'adults, not pregnant' }),
    zonesFor: () => [
      { upTo: 0.1, key: 'suppressed', severity: 'soon',
        label: 'Suppressed',
        note: 'A TSH this low points at an overactive thyroid and is followed '
            + 'up with free T4 and T3.' },
      { upTo: 0.4, key: 'lowish', severity: 'soon',
        label: 'Below the range',
        note: 'Below range with normal thyroid hormones is subclinical '
            + 'hyperthyroidism. It matters most for bone and for heart rhythm, '
            + 'and it is usually repeated before anything is decided.' },
      { upTo: 2.5, key: 'mid', severity: 'none',
        label: 'Mid range',
        note: 'Where most people without thyroid disease sit. If you are '
            + 'pregnant or trying to be, the targets are different and lower, '
            + 'and set by trimester.' },
      { upTo: 4.0, key: 'upper', severity: 'none',
        label: 'Upper end of the range',
        note: 'Still inside the range. TSH drifts up with age, so this reads '
            + 'differently at 30 and at 75. A single value at the top of the '
            + 'range with no symptoms is usually just repeated.' },
      { upTo: 10, key: 'subclinical', severity: 'soon',
        label: 'Subclinical hypothyroidism, if T4 is normal',
        note: 'Between 4 and 10 with a normal free T4 is subclinical '
            + 'hypothyroidism. Whether it is treated depends on symptoms, on '
            + 'thyroid antibodies and on age rather than on the number alone.' },
      { upTo: Infinity, key: 'high', severity: 'soon',
        label: 'Clearly raised',
        note: 'Above 10 is the level at which treatment is generally started, '
            + 'after a repeat and a free T4.' },
    ],
    basis: 'Standard adult assay reference interval, with the subclinical '
         + 'hypothyroidism bands used in thyroid guidelines.',
  },

  {
    id: 'hba1c',
    label: 'HbA1c',
    unit: 'mmol/mol',
    step: 1,
    /* No lower bound worth flagging, so the range is a ceiling. */
    rangeFor: () => ({ low: null, high: 41, pop: 'adults, not pregnant' }),
    zonesFor: () => [
      { upTo: 41, key: 'ok', severity: 'none',
        label: 'Normal',
        note: 'Below 42, which is 6.0 percent on the old scale.' },
      { upTo: 47, key: 'raised', severity: 'soon',
        label: 'Raised, the band before diabetes',
        note: 'Between 42 and 47, which is 6.0 to 6.4 percent, is the band WHO '
            + 'calls high risk of diabetes. Many reports print it without a '
            + 'flag because the diabetes threshold is 48. The American Diabetes '
            + 'Association starts this band lower, at 39, or 5.7 percent. It is '
            + 'the point at which diet and activity change the trajectory more '
            + 'cheaply than anything available later.' },
      { upTo: Infinity, key: 'diabetes', severity: 'soon',
        label: 'In the diabetes range',
        note: '48 and above, which is 6.5 percent, is the diagnostic threshold. '
            + 'Diagnosis needs a second test on another day, or one test '
            + 'alongside symptoms.' },
    ],
    basis: 'WHO and the American Diabetes Association criteria, IFCC units with '
         + 'the DCCT percentages given alongside.',
  },
];

/**
 * Where a value sits and what that band means.
 *
 * @param {object} marker one of MARKERS
 * @param {number} value
 * @param {object} [profile] used where the range depends on it
 * @returns {{ zone, range, position, outside } | null}
 */
export function assess(marker, value, profile) {
  if (value == null || !Number.isFinite(value)) return null;
  const range = marker.rangeFor(profile);
  const zones = marker.zonesFor(profile);
  const zone = zones.find(z => value <= z.upTo) ?? zones[zones.length - 1];

  const low = range.low ?? 0;
  const span = range.high - low;
  /* Where in the range the value falls, 0 at the bottom and 1 at the top.
     Null when it is outside, since a position only means something inside. */
  const position = span > 0 && value >= low && value <= range.high
    ? (value - low) / span
    : null;

  return {
    zone,
    range,
    position,
    outside: value < low ? 'below' : value > range.high ? 'above' : null,
  };
}

/** What a reference interval is, said once where it is needed. */
export const RANGE_NOTE =
  'A reference interval is the middle 95 percent of a reference population, '
  + 'so one healthy person in twenty falls outside it by arithmetic alone. '
  + 'Being just inside it means you resemble that population at that moment, '
  + 'not that the value has room to spare. For several markers the number that '
  + 'changes what anyone does sits inside the printed range.';
