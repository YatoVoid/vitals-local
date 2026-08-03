/* Local UV and air quality.
 *
 * The only outbound request besides data packs. Open-Meteo needs no key and
 * sets no cookie. Coordinates are rounded to two decimals, roughly a
 * kilometre, which is ample for a UV index.
 *
 * Degrades to typed entry: with the network off, the request failed, or
 * location declined, the screen still works and the guidance is identical.
 */

const CACHE_KEY = 'vitals.weather';
const PLACE_KEY = 'vitals.place';
const MAX_AGE_MS = 45 * 60 * 1000;   // UV moves slowly; an hour old is fine

export { PLACES, COUNTRIES, findPlaces, nearest, placesIn } from '../data/places.js';
import { nearest } from '../data/places.js';

/**
 * Ask the device where it is, then match to the nearest known city.
 *
 * The coordinate never leaves the device: it is matched against a local list
 * and only the matched city is used for the request, which is already rounded
 * to about a kilometre. Declining is a normal outcome and is not an error.
 */
export function locate({ timeout = 10000 } = {}) {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve({ ok: false, reason: 'unsupported',
        message: 'This browser cannot report a location. Search for your city instead.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const hit = nearest(pos.coords.latitude, pos.coords.longitude);
        if (!hit) {
          resolve({ ok: false, reason: 'nomatch',
            message: 'Could not match that to a city on the list. Search for the nearest one.' });
          return;
        }
        resolve({ ok: true, place: hit.place, km: hit.km, accuracy: pos.coords.accuracy });
      },
      err => {
        const message = err.code === err.PERMISSION_DENIED
          ? 'Location was declined. Search for your city instead, which works just as well.'
          : err.code === err.TIMEOUT
            ? 'The location request timed out. Search for your city instead.'
            : 'Could not get a location. Search for your city instead.';
        resolve({ ok: false, reason: 'denied', message });
      },
      { timeout, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false },
    );
  });
}

export function savedPlace() {
  try { return JSON.parse(localStorage.getItem(PLACE_KEY) ?? 'null'); }
  catch { return null; }
}
export function savePlace(place) {
  try { localStorage.setItem(PLACE_KEY, JSON.stringify(place)); } catch {}
  return place;
}

function cached() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (!c) return null;
    if (Date.now() - c.at > MAX_AGE_MS) return { ...c, stale: true };
    return c;
  } catch { return null; }
}

/**
 * The last reading held on this device, without asking the network for
 * anything. Every screen draws from this, so nothing anyone looks at is
 * waiting on a request.
 *
 * @returns {{ data: object, at: number, placeId: string, stale?: boolean } | null}
 */
export function lastConditions() {
  return cached();
}

/* Screens redraw when a reading lands, rather than polling for one. */
const conditionListeners = new Set();

/** Called with the new record whenever a fetch replaces the stored reading. */
export function onConditions(fn) {
  conditionListeners.add(fn);
  return () => conditionListeners.delete(fn);
}

/* One at a time. Home and the sun screen both ask on open, and without this
   the second one starts a duplicate request for the same figure. */
let inFlight = null;

/**
 * Bring the stored reading up to date, if that is worth doing and possible.
 *
 * Returns null without touching the network in the cases that should not
 * cause a request at all: no place chosen yet, a reading that is still fresh,
 * or a browser that already knows it is offline. So this is safe to call on
 * every app open and every time the network comes back.
 *
 * Choosing a place is the consent. Nothing here runs until someone has, and
 * nothing else is ever sent: the request carries a city coordinate rounded to
 * two decimals and nothing about the person.
 */
export function refreshIfStale({ force = false } = {}) {
  const place = savedPlace();
  if (!place) return Promise.resolve(null);

  const hit = cached();
  if (!force && hit && hit.placeId === place.id && !hit.stale) {
    return Promise.resolve(null);
  }
  // navigator.onLine is only reliable when it says false, which is the half
  // worth acting on: it saves a request that cannot succeed.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return Promise.resolve(null);
  }
  if (inFlight) return inFlight;

  inFlight = fetchConditions(place, { force: true })
    .then(res => {
      if (res.ok && res.source === 'network') {
        for (const fn of conditionListeners) {
          try { fn({ data: res.data, at: res.at, placeId: place.id }); } catch {}
        }
      }
      return res;
    })
    .catch(() => null)
    .finally(() => { inFlight = null; });

  return inFlight;
}

/**
 * Fetch UV and air quality for a place.
 * Never throws. Returns { ok, data, error, stale, source }.
 */
export async function fetchConditions(place, { force = false } = {}) {
  const hit = cached();
  if (hit && !force && hit.placeId === place.id && !hit.stale) {
    return { ok: true, data: hit.data, source: 'cache', at: hit.at };
  }

  const lat = place.lat.toFixed(2);
  const lon = place.lon.toFixed(2);

  const uvUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + '&current=uv_index,temperature_2m,relative_humidity_2m,cloud_cover'
    + '&daily=uv_index_max&timezone=auto&forecast_days=1';
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}`
    + '&current=pm2_5,pm10,european_aqi,us_aqi&timezone=auto';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const [uvRes, aqRes] = await Promise.all([
      fetch(uvUrl, { signal: controller.signal }),
      fetch(aqUrl, { signal: controller.signal }).catch(() => null),
    ]);
    clearTimeout(timeout);
    if (!uvRes.ok) throw new Error(`weather ${uvRes.status}`);

    const uv = await uvRes.json();
    const aq = aqRes && aqRes.ok ? await aqRes.json() : null;

    const data = {
      uv: uv.current?.uv_index ?? null,
      uvMax: uv.daily?.uv_index_max?.[0] ?? null,
      tempC: uv.current?.temperature_2m ?? null,
      humidity: uv.current?.relative_humidity_2m ?? null,
      cloud: uv.current?.cloud_cover ?? null,
      pm25: aq?.current?.pm2_5 ?? null,
      aqi: aq?.current?.european_aqi ?? aq?.current?.us_aqi ?? null,
      aqiScale: aq?.current?.european_aqi != null ? 'eu' : 'us',
    };

    const record = { at: Date.now(), placeId: place.id, data };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(record)); } catch {}
    return { ok: true, data, source: 'network', at: record.at };
  } catch (err) {
    if (hit && hit.placeId === place.id) {
      return { ok: true, data: hit.data, source: 'cache', at: hit.at, stale: true };
    }
    return {
      ok: false,
      error: err.name === 'AbortError'
        ? 'The request took too long. Enter the values by hand instead.'
        : 'Could not reach the weather service. Enter the values by hand instead.',
    };
  }
}

/* ---- Guidance ---- */

/** UV index to a band, per the international scale. */
export function uvBand(uv) {
  if (uv == null) return null;
  if (uv < 3) return { key: 'low', label: 'Low', severity: 'none' };
  if (uv < 6) return { key: 'moderate', label: 'Moderate', severity: 'none' };
  if (uv < 8) return { key: 'high', label: 'High', severity: 'soon' };
  if (uv < 11) return { key: 'very-high', label: 'Very high', severity: 'soon' };
  return { key: 'extreme', label: 'Extreme', severity: 'now' };
}

/* Fitzpatrick types, described by how skin behaves rather than by ethnicity.
   The burn times are rough and assume unprotected skin at midday. */
export const SKIN_TYPES = [
  { id: 1, label: 'Always burns, never tans', factor: 0.55 },
  { id: 2, label: 'Burns easily, tans poorly', factor: 0.75 },
  { id: 3, label: 'Burns sometimes, tans slowly', factor: 1.0 },
  { id: 4, label: 'Rarely burns, tans easily', factor: 1.5 },
  { id: 5, label: 'Very rarely burns', factor: 2.5 },
  { id: 6, label: 'Never burns', factor: 4.0 },
];

/**
 * Advice for a UV index and skin type. The burn estimate is a range, not a
 * minute count: individual variation is too large for a single figure.
 */
export function sunAdvice(uv, skinTypeId) {
  const band = uvBand(uv);
  if (!band) return null;
  const type = SKIN_TYPES.find(t => t.id === skinTypeId) ?? SKIN_TYPES[2];

  /* A common approximation: minutes to redness is roughly 200 divided by the
     UV index for mid range skin, scaled by type. Treated as an order of
     magnitude, not a timer. */
  const mins = uv > 0 ? Math.round((200 / uv) * type.factor) : null;
  const burnText = mins == null ? null
    : mins > 120 ? 'Burning is unlikely today with normal exposure.'
    : `Unprotected skin could start to redden in roughly ${Math.max(5, Math.round(mins / 5) * 5)} minutes at midday. That is a rough guide, not a timer.`;

  const lines = [];
  let spf = null;

  if (band.key === 'low') {
    lines.push('No protection needed for normal activity.');
    lines.push('Worth knowing: at this level you are also making very little vitamin D, which is why winter deficiency is common at higher latitudes.');
  } else if (band.key === 'moderate') {
    spf = 30;
    lines.push('Seek shade around midday. Cover up and use SPF 30 or higher on exposed skin if you are out for more than a short while.');
  } else if (band.key === 'high') {
    spf = 30;
    lines.push('Protection needed. Shade between 11 and 15, a hat and sleeves, and SPF 30 or higher reapplied every two hours.');
  } else if (band.key === 'very-high') {
    spf = 50;
    lines.push('Take it seriously. Avoid open sun in the middle of the day. SPF 50, a wide brimmed hat, sunglasses and long sleeves.');
  } else {
    spf = 50;
    lines.push('Avoid being out in open sun in the middle of the day if you can. Skin can burn in minutes.');
    lines.push('Shade, full cover and SPF 50 reapplied every two hours if you must be out.');
  }

  if (spf && (type.id === 1 || type.id === 2)) {
    spf = Math.max(spf, 50);
    lines.push('Skin that burns easily gets less warning before damage is done, so use the higher factor and reapply on the shorter interval.');
  }
  if (spf && type.id >= 5) {
    lines.push('Deeply pigmented skin has natural protection roughly equal to a low SPF. That is real and it is not enough at this level.');
  }

  return { band, spf, burnText, lines, skinType: type };
}

/** Air quality band. Both scales are handled since the source varies. */
export function airBand(aqi, scale = 'eu') {
  if (aqi == null) return null;
  const eu = [
    [20, 'Good', 'none'], [40, 'Fair', 'none'], [60, 'Moderate', 'none'],
    [80, 'Poor', 'soon'], [100, 'Very poor', 'soon'], [Infinity, 'Extremely poor', 'now'],
  ];
  const us = [
    [50, 'Good', 'none'], [100, 'Moderate', 'none'], [150, 'Unhealthy for some', 'soon'],
    [200, 'Unhealthy', 'soon'], [300, 'Very unhealthy', 'now'], [Infinity, 'Hazardous', 'now'],
  ];
  const table = scale === 'us' ? us : eu;
  const row = table.find(([max]) => aqi <= max);
  return { label: row[1], severity: row[2], aqi, scale };
}

/** What to do about today's air, focused on exercise since that is the lever. */
export function airAdvice(aqi, scale = 'eu') {
  const band = airBand(aqi, scale);
  if (!band) return null;
  const bad = band.severity !== 'none';
  const worst = band.severity === 'now';

  const lines = [];
  if (!bad) {
    lines.push('Nothing to change. Train outside as normal.');
  } else if (!worst) {
    lines.push('Move hard sessions indoors, or shift them to early morning when levels are usually lowest.');
    lines.push('Easy walking outside is fine. It is the ventilation rate during hard effort that changes the dose, not being outdoors as such.');
    lines.push('If you have asthma or heart or lung disease, take the reduction seriously rather than as a suggestion.');
  } else {
    lines.push('Keep exertion indoors today. Close windows on the traffic side.');
    lines.push('A well fitted FFP2 or N95 respirator reduces exposure. A loose surgical or cloth mask does very little for fine particles.');
  }
  lines.push('Indoor air is not automatically clean: frying and gas hobs regularly push indoor particles above outdoor levels. Use the extractor.');
  return { band, lines };
}
