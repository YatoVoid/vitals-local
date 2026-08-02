/* Outside: UV, sun protection, and air.
 *
 * Fetches on request and works without. Every figure can be entered by hand,
 * and the guidance is identical either way.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows, segmented } from '../app/ui.js';
import { savedPlace, savePlace, fetchConditions, lastConditions, sunAdvice, airAdvice,
         uvBand, SKIN_TYPES, locate } from '../app/weather.js';
import { findPlaces } from '../data/places.js';
import { profile } from '../app/store.js';

export function renderOutside(screen, { go, live }) {
  let manual = { uv: null, aqi: null };
  /* Opens on whatever was last stored, so arriving from the home tile shows
     the same reading the tile did rather than an empty screen asking for one.
     Nothing is fetched until it is asked for. */
  const held = lastConditions();
  let status = held ? { ok: true, data: held.data, at: held.at, stale: held.stale, source: 'cache' } : null;

  const draw = () => {
    screen.replaceChildren();
    const place = savedPlace();
    const p = profile.get();
    const skinType = p.skinType ?? 3;

    screen.appendChild(eyebrow('Outside'));
    screen.appendChild(el('h1', null, 'Sun and air today'));

    /* ---- Where ----
     * Ask the device first, since that is one tap and gets it right. Search
     * covers everyone who declines, is travelling, or wants somewhere else.
     */
    screen.appendChild(fieldLabel('Where you are'));

    if (place) {
      const chosen = el('div', 'placebar');
      chosen.append(
        el('span', 'placebar__name', `${place.city}, ${place.country}`),
        button('Change', 'chipbtn', () => { savePlace(null); status = null; draw(); }),
      );
      screen.appendChild(chosen);
    } else {
      const find = el('div', 'stack');

      const useLoc = button('Use my location', 'btn btn--block', async () => {
        status = 'locating';
        draw();
        const r = await locate();
        if (!r.ok) {
          status = { ok: false, error: r.message };
          draw();
          return;
        }
        savePlace(r.place);
        status = 'loading';
        draw();
        const res = await fetchConditions(r.place);
        status = res;
        live.textContent = `${r.place.city} selected`;
        draw();
      });
      find.appendChild(useLoc);
      find.appendChild(el('p', 'hint',
        'The coordinate is matched to the nearest city on a list stored in the '
        + 'app. Only that city is used for the request.'));

      const searchWrap = el('div', 'placesearch');
      const input = el('input', 'field');
      input.type = 'search';
      input.placeholder = 'Or search a city or country';
      input.setAttribute('aria-label', 'Search for a place');
      const hits = el('div', 'placesearch__hits');
      hits.setAttribute('aria-live', 'polite');
      searchWrap.append(input, hits);

      let timer = null;
      const runFind = () => {
        hits.replaceChildren();
        const found = findPlaces(input.value, 8);
        if (!input.value.trim()) return;
        if (!found.length) {
          hits.appendChild(el('p', 'hint', 'No match. Try the country name, or a larger city nearby.'));
          return;
        }
        hits.appendChild(rows(...found.map(pl => row(pl.city, {
          sub: pl.country,
          onClick: async () => {
            savePlace(pl);
            status = 'loading';
            draw();
            const res = await fetchConditions(pl);
            status = res;
            live.textContent = `${pl.city} selected`;
            draw();
          },
        }))));
      };
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(runFind, 130);
      });
      find.appendChild(searchWrap);
      screen.appendChild(find);
    }

    /* ---- Readings ---- */
    const live_ = status?.ok ? status.data : null;
    const uv = manual.uv ?? live_?.uv ?? null;
    const aqi = manual.aqi ?? live_?.aqi ?? null;
    const scale = live_?.aqiScale ?? 'eu';

    if (status === 'locating') {
      screen.appendChild(el('p', 'hint', 'Asking your device where it is...'));
    } else if (status === 'loading') {
      screen.appendChild(el('p', 'hint', 'Fetching...'));
    } else if (status && !status.ok) {
      const err = panel(eyebrow('Could not fetch'), el('p', null, status.error));
      err.dataset.severity = 'soon';
      screen.appendChild(err);
    } else if (status?.source === 'cache' && !status.stale) {
      const note = el('p', 'hint',
        `Last read at ${new Date(status.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. `
        + 'Fetch again for the current figure.');
      screen.appendChild(note);
    } else if (status?.stale) {
      screen.appendChild(el('p', 'hint',
        `Showing the last reading, from ${new Date(status.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Fetch again for the current figure.`));
    }

    if (uv != null) {
      const band = uvBand(uv);
      const head = panel();
      head.dataset.severity = band.severity;
      head.append(
        el('div', 'readout-big', String(Math.round(uv * 10) / 10)),
        el('div', 'readout-unit', `UV index, ${band.label.toLowerCase()}`),
      );
      if (live_?.tempC != null) {
        head.appendChild(el('p', 'hint',
          `${Math.round(live_.tempC)} degrees, ${Math.round(live_.cloud ?? 0)} percent cloud. `
          + 'UV is driven by sun angle, not warmth, so a cool clear day can still burn you.'));
      }
      screen.appendChild(head);
    }

    /* ---- Skin type ---- */
    screen.appendChild(el('h2', null, 'Your skin'));
    screen.appendChild(el('p', 'hint',
      'How your skin behaves in the sun, not where you are from.'));
    screen.appendChild(segmented(
      SKIN_TYPES.map(t => ({ id: String(t.id), label: String(t.id) })),
      String(skinType),
      v => { profile.set({ skinType: Number(v) }); draw(); },
      'Skin type',
    ));
    screen.appendChild(el('p', 'hint',
      `Type ${skinType}: ${SKIN_TYPES.find(t => t.id === skinType).label.toLowerCase()}.`));

    /* ---- Sun advice ---- */
    const sun = uv != null ? sunAdvice(uv, skinType) : null;
    if (sun) {
      /* The same figure as the reading above it. Rounding to a whole number
         here put "UV 9" under a reading of 8.6 on the same screen. */
      const box = panel(eyebrow(`What to do at UV ${Math.round(uv * 10) / 10}`));
      if (sun.spf) {
        box.appendChild(el('p', 'verdict-line', `SPF ${sun.spf} or higher`));
      } else {
        box.appendChild(el('p', 'verdict-line', 'No sunscreen needed'));
      }
      sun.lines.forEach(l => box.appendChild(el('p', null, l)));
      if (sun.burnText) box.appendChild(el('p', 'hint', sun.burnText));
      box.dataset.severity = sun.band.severity;
      screen.appendChild(box);

      const how = panel(
        eyebrow('The part people get wrong'),
        el('p', null,
          'Almost every sunscreen failure is quantity, not product. Testing '
          + 'uses about a shot glass for a whole adult body and a teaspoon for '
          + 'face and neck. Most people apply a quarter to a half of that, and '
          + 'because the relationship is not linear, half the amount of SPF 30 '
          + 'gives you far less than SPF 15.'),
        el('p', null,
          'SPF only describes UVB. Look for a UVA marking as well: a circled '
          + 'UVA symbol in Europe, PA with plus signs in much of Asia, or the '
          + 'words broad spectrum. A high SPF with no UVA protection is half a '
          + 'product.'),
        el('p', null,
          'Reapply every two hours, and straight after swimming or towelling. '
          + 'Water resistant is tested for 40 or 80 minutes of immersion and '
          + 'does not survive a towel.'),
        el('p', null,
          'The bits people miss: ears, back of the neck, tops of the feet, the '
          + 'hairline and parting, and the lips. Lip cancers are usually on the '
          + 'lower lip and are strongly sun related.'),
        button('Read about the filters', 'btn btn--quiet btn--block',
          () => go('#/learn/filters')),
      );
      screen.appendChild(how);
    }

    /* ---- Air ---- */
    if (aqi != null) {
      const air = airAdvice(aqi, scale);
      screen.appendChild(el('h2', null, 'Air'));
      const box = panel();
      box.dataset.severity = air.band.severity;
      box.append(
        el('div', 'readout-big', String(Math.round(aqi))),
        el('div', 'readout-unit', `${air.band.label}, ${scale === 'us' ? 'US' : 'European'} scale`),
      );
      if (live_?.pm25 != null) {
        box.appendChild(el('p', 'hint',
          `Fine particles ${Math.round(live_.pm25)} micrograms per cubic metre. `
          + 'These are the part that reaches the deepest lung and crosses into blood.'));
      }
      air.lines.forEach(l => box.appendChild(el('p', null, l)));
      screen.appendChild(box);
    }

    /* ---- Manual entry, always available ---- */
    screen.appendChild(el('h2', null, 'Enter it by hand'));
    screen.appendChild(el('p', 'hint',
      'If you would rather not fetch anything, or the network is off, type '
      + 'what your weather app says. The guidance is the same either way.'));

    const form = el('form', 'inline-form');
    const uvIn = el('input', 'field field--num');
    uvIn.type = 'number'; uvIn.step = '0.1'; uvIn.min = '0'; uvIn.max = '16';
    uvIn.placeholder = 'UV';
    uvIn.setAttribute('aria-label', 'UV index');
    const aqIn = el('input', 'field field--num');
    aqIn.type = 'number'; aqIn.min = '0';
    aqIn.placeholder = 'AQI';
    aqIn.setAttribute('aria-label', 'Air quality index');
    const go2 = button('Use these', 'btn');
    go2.type = 'submit';
    form.append(uvIn, aqIn, go2);
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      manual = {
        uv: uvIn.value === '' ? null : Number(uvIn.value),
        aqi: aqIn.value === '' ? null : Number(aqIn.value),
      };
      status = null;
      live.textContent = 'Using your values';
      draw();
    });
    screen.appendChild(form);

    if (uv == null && aqi == null) {
      screen.appendChild(el('p', 'empty',
        'Pick a place above to fetch, or type the numbers in.'));
    }

    /* ---- The network note ---- */
    const net = panel(
      eyebrow('What leaves this device'),
      el('p', null,
        'Fetching sends the coordinates of the city you picked, rounded to '
        + 'about a kilometre, to a public weather service. Nothing else. No '
        + 'account, no key, no identifier, and nothing about your health.'),
      el('p', null,
        'Everything on this screen works without it. The fetch is a '
        + 'convenience, not a requirement.'),
    );
    net.style.marginBlockStart = 'var(--s-5)';
    screen.appendChild(net);
  };

  draw();
}
