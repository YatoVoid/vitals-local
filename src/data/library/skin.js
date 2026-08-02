/* Skin, sun and sunscreen.
 *
 * Filters are described by what they cover and how they behave. No brands and
 * no product recommendations. Approved filter lists differ by region, which
 * matters when reading a label bought abroad.
 */

export const SKIN = [
  {
    id: 'uv-index',
    title: 'Reading the UV index',
    category: 'Sun and skin',
    tags: ['uv', 'uv index', 'sun', 'burn', 'shade', 'clouds'],
    summary: 'The number tells you how fast skin burns, not how hot it is. '
           + 'Protection is worth it from 3 upwards.',
    basis: 'The international UV index scale and its associated exposure '
         + 'categories.',
    sections: [
      ['What the number means',
        'The UV index is a scale of the strength of burning ultraviolet at '
        + 'ground level. Under 3 is low, 3 to 5 moderate, 6 to 7 high, 8 to 10 '
        + 'very high, 11 and over extreme. Above 3 is the threshold where '
        + 'protection is generally recommended.'],
      ['It is not about temperature',
        'UV is driven by sun angle, altitude, ozone and cloud, not by warmth. '
        + 'A cool clear day in spring at altitude can carry a higher index than '
        + 'a humid overcast day in summer. Snow and water reflect UV upward, '
        + 'which is why people burn under the chin on the water and on ski '
        + 'slopes.'],
      ['Clouds',
        'Thin cloud transmits most UV. Broken cloud can briefly raise it above '
        + 'a clear sky through scattering. Overcast reduces it substantially '
        + 'but rarely to zero.'],
      ['The shadow rule',
        'If your shadow is shorter than you are, the sun is high and UV is '
        + 'near its peak. It is a rough guide that needs no app and works '
        + 'anywhere.'],
      ['Glass',
        'Ordinary window glass blocks almost all UVB and passes much of the '
        + 'UVA. That is why sun damage accumulates on the driving side of the '
        + 'face over years, and why sitting by a window is not protection.'],
    ],
  },
  {
    id: 'sunscreen',
    title: 'How sunscreen actually works, and where it fails',
    category: 'Sun and skin',
    tags: ['sunscreen', 'spf', 'uva', 'filters', 'zinc', 'reapply', 'mineral'],
    summary: 'Most failures are about quantity and reapplication, not about '
           + 'which product was bought.',
    basis: 'SPF testing methodology and studies measuring real world '
         + 'application thickness.',
    sections: [
      ['What SPF measures',
        'SPF is a UVB measure, tested at 2 milligrams of product per square '
        + 'centimetre of skin. SPF 30 filters about 97 percent of UVB, SPF 50 '
        + 'about 98. The step from 30 to 50 is small in filtration and matters '
        + 'mostly because people under apply, so a higher number leaves more '
        + 'margin.'],
      ['The quantity problem',
        'Studies of how much people actually apply find between a quarter and '
        + 'half of the tested amount. Because the relationship is not linear, '
        + 'applying half the amount of SPF 30 does not give you SPF 15, it '
        + 'gives you considerably less. For an adult body that means roughly '
        + '30 to 40 millilitres, about a shot glass, and around a teaspoon for '
        + 'face and neck alone.'],
      ['UVA is the other half',
        'SPF says nothing about UVA, which penetrates deeper, drives ageing '
        + 'and contributes to skin cancer. Look for a UVA marking: a circled '
        + 'UVA symbol in Europe, PA with plus signs in much of Asia, or the '
        + 'words broad spectrum. A high SPF with no UVA protection is a half '
        + 'finished product.'],
      ['Reapplication',
        'Every two hours in continuous sun, and immediately after swimming, '
        + 'towelling or heavy sweating. Water resistant means tested for 40 or '
        + '80 minutes of immersion, not waterproof, and towelling removes it '
        + 'regardless.'],
      ['The bits everyone misses',
        'Ears, the back of the neck, the tops of the feet, the hairline and '
        + 'parting, the lips, and the eyelids. Lips need a balm with a filter; '
        + 'lip cancers are usually on the lower lip and are strongly sun '
        + 'related.'],
    ],
  },
  {
    id: 'filters',
    title: 'What the filters on the label do',
    category: 'Sun and skin',
    tags: ['filters', 'zinc oxide', 'avobenzone', 'oxybenzone', 'tinosorb', 'mineral', 'chemical'],
    summary: 'Mineral and organic filters both work. What matters is coverage '
           + 'across the spectrum and whether the filter is stable in light.',
    basis: 'Regulatory approved filter lists and published absorption spectra '
         + 'and photostability data.',
    sections: [
      ['Mineral filters',
        'Zinc oxide covers UVB and the whole UVA range, and is very '
        + 'photostable. Titanium dioxide covers UVB and short UVA but is weak '
        + 'in long UVA. Both sit mostly on the skin surface and are the usual '
        + 'choice for very sensitive or reactive skin. The trade off is a white '
        + 'cast, which is worse on darker skin and is the main reason people '
        + 'stop using them.'],
      ['Organic filters worth recognising',
        'Avobenzone covers long UVA well but degrades in sunlight unless it is '
        + 'stabilised, usually by octocrylene or specific stabilisers. If a '
        + 'label lists avobenzone with no stabiliser, that is a genuine '
        + 'weakness. Newer broad spectrum filters, sold under names such as '
        + 'Tinosorb and Uvinul, cover wide ranges and are photostable, but they '
        + 'are approved in Europe and much of Asia and not in the United '
        + 'States, which is why sunscreens differ so much between regions.'],
      ['Oxybenzone',
        'Effective, and the most common cause of contact allergy among '
        + 'sunscreen filters. It is absorbed through skin and detectable in '
        + 'blood, which regulators have asked for more data on. No health harm '
        + 'has been demonstrated in people, and the balance of evidence still '
        + 'favours using sunscreen. If you want to avoid it, alternatives are '
        + 'easy to find.'],
      ['Reef claims',
        'Some regions restrict oxybenzone and octinoxate over coral concerns. '
        + 'The laboratory evidence is real; how much sunscreen contributes '
        + 'relative to warming and runoff is contested. Reef safe is not a '
        + 'regulated term on a label.'],
      ['Mineral is not gentler by default',
        'Both categories are well tolerated by most people. Irritation is more '
        + 'often caused by fragrance, preservatives or alcohol in the base than '
        + 'by the filter.'],
    ],
  },
  {
    id: 'skin-type',
    title: 'Skin type, burning, and what changes with it',
    category: 'Sun and skin',
    tags: ['skin type', 'fitzpatrick', 'melanin', 'burn', 'tan', 'vitamin d', 'dark skin'],
    summary: 'Darker skin burns more slowly but is not exempt, and skin cancer '
           + 'in darker skin is usually found later and does worse.',
    basis: 'The Fitzpatrick classification and survival data by skin tone at '
         + 'melanoma diagnosis.',
    sections: [
      ['The scale',
        'Type 1 always burns and never tans. Type 2 burns easily and tans '
        + 'poorly. Type 3 burns sometimes. Type 4 rarely burns. Types 5 and 6 '
        + 'burn rarely to very rarely. The scale describes response to sun, not '
        + 'ethnicity, and people within any group vary.'],
      ['What melanin does and does not do',
        'Deeply pigmented skin provides natural protection roughly equivalent '
        + 'to a low SPF. That is meaningful and it is not enough at high UV or '
        + 'over long exposure.'],
      ['The outcome gap',
        'Melanoma is far less common in darker skin and, when it occurs, is '
        + 'diagnosed later and has worse survival. It also appears more often '
        + 'on palms, soles and under nails, places people do not think to '
        + 'check. Any new or changing dark patch in those places is worth '
        + 'showing to a doctor.'],
      ['Vitamin D',
        'More melanin means more sun exposure needed for the same vitamin D. '
        + 'At high latitudes that is a real reason darker skinned people are '
        + 'more often deficient. The answer is a supplement rather than '
        + 'deliberate burning, since UV exposure sufficient for vitamin D in '
        + 'winter is often unobtainable anyway.'],
      ['There is no safe tan',
        'A tan is the skin responding to DNA damage by producing pigment. '
        + 'Sunbeds are classed as a group 1 carcinogen, and use before age 35 '
        + 'raises melanoma risk substantially. A base tan provides protection '
        + 'roughly equivalent to SPF 3, at the cost of the damage that produced '
        + 'it.'],
    ],
  },
  {
    id: 'mole-check',
    title: 'Checking a mole, and when to act',
    category: 'Sun and skin',
    tags: ['mole', 'melanoma', 'abcde', 'skin cancer', 'ugly duckling', 'spot'],
    summary: 'Change over weeks to months matters more than any single '
           + 'feature, and a mole unlike your others deserves a look.',
    basis: 'The ABCDE criteria and the ugly duckling sign used in '
         + 'dermatological screening.',
    sections: [
      ['ABCDE',
        'Asymmetry, one half unlike the other. Border that is irregular or '
        + 'blurred. Colour that varies within the spot or has changed. Diameter '
        + 'over about 6 millimetres, though smaller melanomas exist. Evolving, '
        + 'meaning any change in size, shape, colour, or new itching, bleeding '
        + 'or crusting.'],
      ['The ugly duckling',
        'Most of your moles look broadly like each other. The one that looks '
        + 'unlike the rest is the one worth showing someone, even when it '
        + 'passes the ABCDE check. In practice this catches things the letters '
        + 'miss.'],
      ['What matters most',
        'Change. A mole that has been identical for twenty years is far less '
        + 'concerning than one that has altered over three months. Photograph '
        + 'anything you are unsure about, with something for scale, and compare '
        + 'in eight weeks.'],
      ['Places people forget',
        'Scalp, behind the ears, between the toes, soles, under nails, and the '
        + 'genital area. A dark streak appearing under one nail, especially if '
        + 'it widens or the pigment spreads onto the surrounding skin, needs '
        + 'checking.'],
      ['Do not wait to be sure',
        'Melanoma caught while thin is usually cured by removing it. The cost '
        + 'of showing someone a harmless mole is a short appointment. The cost '
        + 'of waiting on a real one is much larger.'],
    ],
  },
  {
    id: 'air-quality',
    title: 'Air quality, and what to change when it is bad',
    category: 'Environment',
    tags: ['air quality', 'aqi', 'pm2.5', 'pollution', 'mask', 'exercise', 'smog'],
    summary: 'Fine particles are the part that matters most. On a bad day, '
           + 'move hard exercise indoors rather than skipping it.',
    basis: 'Air quality index breakpoints and studies of exercise ventilation '
         + 'during pollution episodes.',
    sections: [
      ['What the number counts',
        'Air quality indices are usually driven by fine particles under 2.5 '
        + 'micrometres, plus ozone, nitrogen dioxide and others. Fine particles '
        + 'reach the deepest part of the lung and cross into the blood, which '
        + 'is why they dominate the health effect.'],
      ['Why exercise changes the maths',
        'Hard exercise raises ventilation many times over rest and shifts '
        + 'breathing from nose to mouth, bypassing the nose’s filtering. An '
        + 'hour of hard running on a polluted day delivers a far larger dose '
        + 'than an hour of walking.'],
      ['What to do at each level',
        'Good to moderate: no change. Unhealthy for sensitive groups: people '
        + 'with asthma, heart or lung disease, children and older adults reduce '
        + 'prolonged outdoor exertion. Unhealthy: everyone moves hard sessions '
        + 'indoors, keeps windows shut, and keeps easy activity short. Very '
        + 'unhealthy and above: stay in, filter indoor air if you can.'],
      ['Masks',
        'A well fitted respirator rated N95, FFP2 or better reduces particle '
        + 'exposure meaningfully. A loose surgical or cloth mask does very '
        + 'little for fine particles. Fit matters more than the rating on the '
        + 'packet.'],
      ['Indoors is not automatically clean',
        'Cooking, especially frying and gas hobs, and candles and wood burners '
        + 'produce fine particles indoors that regularly exceed outdoor levels. '
        + 'Extraction while cooking is one of the cheapest air quality '
        + 'improvements available.'],
    ],
  },
];
