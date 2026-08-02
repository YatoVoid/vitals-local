/* Active ingredient dictionary.
 *
 * One molecule, many printed names. The International Nonproprietary Name
 * (INN) is what most of the world prints. The United States Adopted Name
 * (USAN) and the older British Approved Name (BAN) diverge for a handful of
 * common drugs: paracetamol and acetaminophen name the same compound, and
 * nothing on either label says so.
 *
 * Names here follow the WHO INN list, with USAN and BAN variants recorded
 * where they diverge. Salt and ester forms are listed against their base,
 * because a salt changes the number printed under "strength" without
 * changing which molecule is doing the work.
 *
 * No brand names live in this file. A brand is a marketing decision, not a
 * property of the molecule.
 */

export const INGREDIENTS = [
  {
    id: 'paracetamol',
    inn: 'Paracetamol',
    names: ['paracetamol', 'acetaminophen', 'apap', 'n-acetyl-p-aminophenol', 'para-acetylaminophenol'],
    note: 'Paracetamol is the INN used across Europe and most of the world. '
        + 'Acetaminophen is the name adopted in the United States and Japan. '
        + 'Both are the same molecule at the same dose. APAP on a US label is '
        + 'an abbreviation of the chemical name, not a different drug.',
    class: 'Analgesic and antipyretic',
    watch: 'It is the most common ingredient hidden inside combination cold '
         + 'and flu products, which is how accidental double dosing happens. '
         + 'Check every box you are taking for it, not just the one labelled '
         + 'as a painkiller.',
  },
  {
    id: 'ibuprofen',
    inn: 'Ibuprofen',
    names: ['ibuprofen', 'ibuprofen lysine', 'ibuprofen sodium', 'dexibuprofen'],
    note: 'One name almost everywhere. Dexibuprofen is the single active '
        + 'mirror image of the same molecule, so its strengths do not compare '
        + 'one to one with plain ibuprofen.',
    class: 'Nonsteroidal anti-inflammatory',
    watch: 'Two different NSAIDs taken together raise stomach and kidney risk '
         + 'without adding much pain relief. Naproxen, diclofenac, aspirin and '
         + 'ibuprofen are all in this group.',
  },
  {
    id: 'acetylsalicylic-acid',
    inn: 'Acetylsalicylic acid',
    names: ['acetylsalicylic acid', 'aspirin', 'asa', 'acetylsalicylate'],
    note: 'Aspirin began as a brand name and became the common name in many '
        + 'countries. Labels in Europe often print acetylsalicylic acid instead.',
    class: 'Nonsteroidal anti-inflammatory, antiplatelet',
    watch: 'A low strength tablet taken daily is doing a different job from a '
         + 'full strength tablet taken for pain. Do not swap one for the other '
         + 'on the assumption that the ingredient is the same.',
  },
  {
    id: 'diclofenac',
    inn: 'Diclofenac',
    names: ['diclofenac', 'diclofenac sodium', 'diclofenac potassium', 'diclofenac diethylamine'],
    note: 'The salt changes how fast it is absorbed and changes the number '
        + 'printed as the strength. The potassium salt is the faster one.',
    class: 'Nonsteroidal anti-inflammatory',
  },
  {
    id: 'naproxen',
    inn: 'Naproxen',
    names: ['naproxen', 'naproxen sodium'],
    note: 'Naproxen sodium 220 mg contains the same amount of naproxen as a '
        + '200 mg plain naproxen tablet. The extra 20 mg is the sodium, not '
        + 'more drug.',
    class: 'Nonsteroidal anti-inflammatory',
  },
  {
    id: 'omeprazole',
    inn: 'Omeprazole',
    names: ['omeprazole', 'omeprazole magnesium', 'omeprazole sodium', 'esomeprazole'],
    note: 'Esomeprazole is the single mirror image of omeprazole and is '
        + 'counted separately. Strengths do not map one to one.',
    class: 'Proton pump inhibitor',
  },
  {
    id: 'cetirizine',
    inn: 'Cetirizine',
    names: ['cetirizine', 'cetirizine hydrochloride', 'cetirizine dihydrochloride', 'levocetirizine'],
    note: 'Levocetirizine is half of the cetirizine molecule and is dosed at '
        + 'half the number for the same effect.',
    class: 'Antihistamine',
  },
  {
    id: 'loratadine',
    inn: 'Loratadine',
    names: ['loratadine', 'desloratadine'],
    note: 'Desloratadine is what the body turns loratadine into. Different '
        + 'strength numbers, same job.',
    class: 'Antihistamine',
  },
  {
    id: 'salbutamol',
    inn: 'Salbutamol',
    names: ['salbutamol', 'albuterol', 'salbutamol sulfate', 'albuterol sulfate', 'levalbuterol'],
    note: 'Salbutamol is the INN. Albuterol is the United States name. Same '
        + 'molecule, and the confusion is common enough that inhaler boxes '
        + 'from different countries look like different drugs.',
    class: 'Short acting bronchodilator',
  },
  {
    id: 'epinephrine',
    inn: 'Epinephrine',
    names: ['epinephrine', 'adrenaline', 'epinephrine bitartrate'],
    note: 'Adrenaline is the INN used in the United Kingdom and much of '
        + 'Europe. Epinephrine is the United States name. Identical.',
    class: 'Adrenergic',
  },
  {
    id: 'metamizole',
    inn: 'Metamizole',
    names: ['metamizole', 'dipyrone', 'metamizole sodium', 'noramidopyrine'],
    note: 'Sold over the counter in some countries and withdrawn in others '
        + 'over a rare effect on white blood cells. Worth knowing which rules '
        + 'apply where you bought it.',
    class: 'Analgesic and antipyretic',
  },
  {
    id: 'ascorbic-acid',
    inn: 'Ascorbic acid',
    names: ['ascorbic acid', 'vitamin c', 'sodium ascorbate', 'l-ascorbic acid'],
    note: 'Sodium ascorbate is a salt of the same vitamin, so the strength '
        + 'number includes the sodium.',
    class: 'Vitamin',
  },
  {
    id: 'colecalciferol',
    inn: 'Colecalciferol',
    names: ['colecalciferol', 'cholecalciferol', 'vitamin d3', 'vitamin d'],
    note: 'Printed as micrograms in some countries and international units in '
        + 'others. 25 micrograms equals 1000 IU.',
    class: 'Vitamin',
  },
];

/* Salt and ester suffixes. They change the printed strength without changing
   which molecule does the work, so they are recorded and reported rather
   than silently ignored. */
const SALTS = [
  'hydrochloride', 'hcl', 'sodium', 'potassium', 'calcium', 'magnesium',
  'sulfate', 'sulphate', 'phosphate', 'maleate', 'tartrate', 'bitartrate',
  'citrate', 'succinate', 'fumarate', 'besylate', 'mesylate', 'acetate',
  'dihydrochloride', 'diethylamine', 'lysine', 'ascorbate',
];

const clean = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, ' ');

/** Split a typed ingredient into its base name and any salt or ester. */
export function parseIngredient(text) {
  const t = clean(text);
  if (!t) return { raw: '', base: '', salt: null, entry: null };

  let salt = null;
  let base = t;
  for (const s of SALTS) {
    const re = new RegExp(`(^|\\s)${s}$`);
    if (re.test(base)) { salt = s; base = base.replace(re, '').trim(); break; }
  }

  // Match the whole typed string first, then the base without its salt.
  const entry = INGREDIENTS.find(i => i.names.includes(t))
             ?? INGREDIENTS.find(i => i.names.includes(base))
             ?? INGREDIENTS.find(i => i.names.some(n => n.startsWith(base) && base.length >= 4));

  return { raw: text, base, salt, entry: entry ?? null };
}

/**
 * Compare two typed ingredient names.
 * @returns {{verdict:'same'|'same-different-name'|'same-different-salt'|'related'|'different'|'unknown',
 *            line:string, detail?:string}}
 */
export function compareIngredients(a, b) {
  const A = parseIngredient(a);
  const B = parseIngredient(b);

  if (!A.raw || !B.raw) {
    return { verdict: 'unknown', line: 'Waiting for both names' };
  }

  if (A.entry && B.entry && A.entry.id === B.entry.id) {
    const typedDiffer = clean(a) !== clean(b);
    if (A.salt !== B.salt) {
      return {
        verdict: 'same-different-salt',
        line: 'Same drug, different salt',
        detail: `Both are ${A.entry.inn}. One is the ${A.salt ?? 'plain'} form and `
              + `the other the ${B.salt ?? 'plain'} form. The salt changes the number `
              + `printed as the strength, because that number weighs the whole `
              + `compound. Compare the amount of ${A.entry.inn} itself, which the `
              + `label usually states in brackets.`,
      };
    }
    if (typedDiffer) {
      return {
        verdict: 'same-different-name',
        line: 'Same drug, two names',
        detail: A.entry.note,
      };
    }
    /* The same name typed twice. The entry note explains how this drug's names
       vary between countries, which answers a question nobody asked here and
       reads as a warning about a second product that is not on the table.
       Point at what can still differ instead. */
    return {
      verdict: 'same',
      line: 'Same ingredient',
      detail: `Both boxes name ${A.entry.inn}. Strength, form and what else is `
            + `in the box can still differ, so read those rows before treating `
            + `the two as interchangeable.`,
    };
  }

  if (A.entry && B.entry && A.entry.class && A.entry.class === B.entry.class) {
    return {
      verdict: 'related',
      line: 'Different drugs, same family',
      detail: `${A.entry.inn} and ${B.entry.inn} are both ${A.entry.class.toLowerCase()}. `
            + `They are not interchangeable, and taking both at once usually adds `
            + `side effects rather than effect.`,
    };
  }

  if (!A.entry || !B.entry) {
    const missing = !A.entry ? A.raw : B.raw;
    return {
      verdict: 'unknown',
      line: 'Not in the local list',
      detail: `"${missing}" is not in the ingredient list on this device. That does `
            + `not mean the two differ, only that this app cannot confirm it. `
            + `Compare the names letter by letter on both boxes, and ask a `
            + `pharmacist if they are not identical.`,
    };
  }

  return {
    verdict: 'different',
    line: 'Different ingredients',
    detail: `${A.entry.inn} and ${B.entry.inn} are different molecules doing `
          + `different jobs. One is not a substitute for the other.`,
  };
}

/** Everything worth saying about one typed name, for the detail panel. */
export function describeIngredient(text) {
  const { entry, salt } = parseIngredient(text);
  if (!entry) return null;
  return {
    inn: entry.inn,
    alsoCalled: entry.names.filter(n => n !== entry.inn.toLowerCase()),
    class: entry.class,
    note: entry.note,
    watch: entry.watch ?? null,
    salt,
  };
}
