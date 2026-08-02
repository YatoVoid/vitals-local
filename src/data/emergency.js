/* Emergency numbers by country.
 *
 * The number to dial is the one piece of a red flag screen that has to be
 * right, so this table only carries countries where the number is settled and
 * widely published. Anywhere else the app says it does not know rather than
 * offering a number that might ring nowhere.
 *
 * `call` is what to dial for an ambulance. Where a country runs a separate
 * medical line alongside the general one, `also` records the general number,
 * because either will reach help and people know one or the other.
 */

const EU_112 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT',
  'RO', 'SK', 'SI', 'ES', 'SE',
  // Outside the union, same number, same meaning.
  'NO', 'IS', 'CH', 'LI', 'RS', 'BA', 'ME', 'MK', 'AL', 'MD', 'UA', 'TR',
  'GE', 'AM', 'AZ', 'KZ', 'BY', 'RU', 'XK'];

const TABLE = {};
for (const iso of EU_112) TABLE[iso] = { call: '112' };

/* Countries whose ambulance line is not 112. */
Object.assign(TABLE, {
  US: { call: '911' },
  CA: { call: '911' },
  MX: { call: '911' },
  GB: { call: '999', also: '112' },
  AU: { call: '000', also: '112' },
  NZ: { call: '111' },
  JP: { call: '119' },
  KR: { call: '119' },
  CN: { call: '120' },
  TW: { call: '119' },
  IN: { call: '112', also: '102' },
  PK: { call: '1122' },
  BD: { call: '999' },
  LK: { call: '1990' },
  NP: { call: '102' },
  PH: { call: '911' },
  ID: { call: '112', also: '118' },
  MY: { call: '999' },
  SG: { call: '995' },
  TH: { call: '1669' },
  VN: { call: '115' },
  HK: { call: '999' },
  IL: { call: '101' },
  AE: { call: '998', also: '999' },
  SA: { call: '997' },
  QA: { call: '999' },
  KW: { call: '112' },
  JO: { call: '911' },
  LB: { call: '140' },
  IQ: { call: '122' },
  IR: { call: '115' },
  EG: { call: '123' },
  MA: { call: '150' },
  DZ: { call: '14' },
  TN: { call: '190' },
  ZA: { call: '10177', also: '112' },
  NG: { call: '112' },
  KE: { call: '999', also: '112' },
  GH: { call: '193' },
  ET: { call: '907' },
  TZ: { call: '114' },
  UG: { call: '112' },
  BR: { call: '192' },
  AR: { call: '107' },
  CL: { call: '131' },
  CO: { call: '123' },
  PE: { call: '116' },
  UY: { call: '911' },
  VE: { call: '171' },
  EC: { call: '911' },
  BO: { call: '118' },
  PY: { call: '141' },
  CR: { call: '911' },
  PA: { call: '911' },
  GT: { call: '123' },
  CU: { call: '104' },
  DO: { call: '911' },
  JM: { call: '110' },
  UZ: { call: '103' },
  KG: { call: '103' },
  TJ: { call: '103' },
  TM: { call: '103' },
  MN: { call: '103' },
});

/**
 * What to dial where this person is.
 *
 * @param {string} iso two letter country code
 * @returns {{ call: string, also?: string } | null} null when unlisted
 */
export function emergencyFor(iso) {
  if (!iso) return null;
  return TABLE[String(iso).toUpperCase()] ?? null;
}

/**
 * The line to print above the number.
 *
 * Written so it still reads correctly when the country is not known, which is
 * the case the wording has to survive: naming no number is safe, naming the
 * wrong one is not.
 */
export function emergencyLine(iso, countryName) {
  const hit = emergencyFor(iso);
  if (!hit) {
    return {
      known: false,
      text: 'Call your local emergency number now. If you do not know it, '
          + '112 works across Europe and much of the world, and 911 across '
          + 'North America.',
    };
  }
  const where = countryName ? ` in ${countryName}` : '';
  return {
    known: true,
    call: hit.call,
    also: hit.also,
    text: hit.also
      ? `Call ${hit.call}${where}, or ${hit.also}.`
      : `Call ${hit.call}${where}.`,
  };
}

/** Every country this table covers, for the test that guards it. */
export function coveredCountries() {
  return Object.keys(TABLE);
}
