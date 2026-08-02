/* Places.
 *
 * Every country, and enough cities to cover most people without shipping a
 * gazetteer. Coordinates are the capital or largest city, rounded to two
 * decimals, which is about a kilometre and plenty for a UV index.
 *
 * Search runs locally. Nothing is sent anywhere to find a place.
 */

/* iso, name, capital or main city, lat, lon */
const ROWS = `
AF|Afghanistan|Kabul|34.53|69.17
AL|Albania|Tirana|41.33|19.82
DZ|Algeria|Algiers|36.75|3.06
AD|Andorra|Andorra la Vella|42.51|1.52
AO|Angola|Luanda|-8.84|13.23
AR|Argentina|Buenos Aires|-34.60|-58.38
AM|Armenia|Yerevan|40.18|44.51
AU|Australia|Sydney|-33.87|151.21
AT|Austria|Vienna|48.21|16.37
AZ|Azerbaijan|Baku|40.41|49.87
BH|Bahrain|Manama|26.23|50.59
BD|Bangladesh|Dhaka|23.81|90.41
BY|Belarus|Minsk|53.90|27.57
BE|Belgium|Brussels|50.85|4.35
BJ|Benin|Porto-Novo|6.50|2.62
BO|Bolivia|La Paz|-16.49|-68.15
BA|Bosnia and Herzegovina|Sarajevo|43.86|18.41
BW|Botswana|Gaborone|-24.63|25.92
BR|Brazil|Sao Paulo|-23.55|-46.63
BG|Bulgaria|Sofia|42.70|23.32
BF|Burkina Faso|Ouagadougou|12.37|-1.52
KH|Cambodia|Phnom Penh|11.56|104.92
CM|Cameroon|Yaounde|3.85|11.50
CA|Canada|Toronto|43.65|-79.38
CL|Chile|Santiago|-33.45|-70.67
CN|China|Shanghai|31.23|121.47
CO|Colombia|Bogota|4.71|-74.07
CR|Costa Rica|San Jose|9.93|-84.09
HR|Croatia|Zagreb|45.81|15.98
CU|Cuba|Havana|23.11|-82.37
CY|Cyprus|Nicosia|35.19|33.38
CZ|Czechia|Prague|50.08|14.44
DK|Denmark|Copenhagen|55.68|12.57
DO|Dominican Republic|Santo Domingo|18.49|-69.93
EC|Ecuador|Quito|-0.18|-78.47
EG|Egypt|Cairo|30.04|31.24
SV|El Salvador|San Salvador|13.69|-89.22
EE|Estonia|Tallinn|59.44|24.75
ET|Ethiopia|Addis Ababa|9.01|38.76
FI|Finland|Helsinki|60.17|24.94
FR|France|Paris|48.86|2.35
GE|Georgia|Tbilisi|41.72|44.83
DE|Germany|Berlin|52.52|13.40
GH|Ghana|Accra|5.60|-0.19
GR|Greece|Athens|37.98|23.73
GT|Guatemala|Guatemala City|14.63|-90.51
HN|Honduras|Tegucigalpa|14.07|-87.19
HK|Hong Kong|Hong Kong|22.32|114.17
HU|Hungary|Budapest|47.50|19.04
IS|Iceland|Reykjavik|64.15|-21.94
IN|India|Mumbai|19.08|72.88
ID|Indonesia|Jakarta|-6.21|106.85
IR|Iran|Tehran|35.69|51.39
IQ|Iraq|Baghdad|33.31|44.36
IE|Ireland|Dublin|53.35|-6.26
IL|Israel|Jerusalem|31.77|35.21
IT|Italy|Rome|41.90|12.50
JM|Jamaica|Kingston|17.97|-76.79
JP|Japan|Tokyo|35.68|139.69
JO|Jordan|Amman|31.95|35.93
KZ|Kazakhstan|Almaty|43.24|76.89
KE|Kenya|Nairobi|-1.29|36.82
KW|Kuwait|Kuwait City|29.38|47.99
KG|Kyrgyzstan|Bishkek|42.87|74.57
LV|Latvia|Riga|56.95|24.11
LB|Lebanon|Beirut|33.89|35.50
LY|Libya|Tripoli|32.89|13.19
LT|Lithuania|Vilnius|54.69|25.28
LU|Luxembourg|Luxembourg|49.61|6.13
MY|Malaysia|Kuala Lumpur|3.14|101.69
MT|Malta|Valletta|35.90|14.51
MX|Mexico|Mexico City|19.43|-99.13
MD|Moldova|Chisinau|47.01|28.86
MN|Mongolia|Ulaanbaatar|47.89|106.91
ME|Montenegro|Podgorica|42.44|19.26
MA|Morocco|Casablanca|33.57|-7.59
MM|Myanmar|Yangon|16.87|96.20
NP|Nepal|Kathmandu|27.72|85.32
NL|Netherlands|Amsterdam|52.37|4.90
NZ|New Zealand|Auckland|-36.85|174.76
NI|Nicaragua|Managua|12.11|-86.24
NG|Nigeria|Lagos|6.52|3.38
MK|North Macedonia|Skopje|41.99|21.43
NO|Norway|Oslo|59.91|10.75
OM|Oman|Muscat|23.59|58.41
PK|Pakistan|Karachi|24.86|67.01
PA|Panama|Panama City|8.98|-79.52
PY|Paraguay|Asuncion|-25.26|-57.58
PE|Peru|Lima|-12.05|-77.04
PH|Philippines|Manila|14.60|120.98
PL|Poland|Warsaw|52.23|21.01
PT|Portugal|Lisbon|38.72|-9.14
QA|Qatar|Doha|25.29|51.53
RO|Romania|Bucharest|44.43|26.10
RU|Russia|Moscow|55.76|37.62
SA|Saudi Arabia|Riyadh|24.71|46.68
SN|Senegal|Dakar|14.72|-17.47
RS|Serbia|Belgrade|44.79|20.45
SG|Singapore|Singapore|1.35|103.82
SK|Slovakia|Bratislava|48.15|17.11
SI|Slovenia|Ljubljana|46.06|14.51
ZA|South Africa|Johannesburg|-26.20|28.05
KR|South Korea|Seoul|37.57|126.98
ES|Spain|Madrid|40.42|-3.70
LK|Sri Lanka|Colombo|6.93|79.86
SE|Sweden|Stockholm|59.33|18.07
CH|Switzerland|Zurich|47.38|8.54
SY|Syria|Damascus|33.51|36.29
TW|Taiwan|Taipei|25.03|121.57
TZ|Tanzania|Dar es Salaam|-6.79|39.21
TH|Thailand|Bangkok|13.76|100.50
TN|Tunisia|Tunis|36.81|10.18
TR|Turkey|Istanbul|41.01|28.98
TM|Turkmenistan|Ashgabat|37.95|58.38
UG|Uganda|Kampala|0.35|32.58
UA|Ukraine|Kyiv|50.45|30.52
AE|United Arab Emirates|Dubai|25.20|55.27
GB|United Kingdom|London|51.51|-0.13
US|United States|New York|40.71|-74.01
UY|Uruguay|Montevideo|-34.90|-56.16
UZ|Uzbekistan|Tashkent|41.30|69.24
VE|Venezuela|Caracas|10.48|-66.90
VN|Vietnam|Hanoi|21.03|105.85
YE|Yemen|Sanaa|15.37|44.19
ZM|Zambia|Lusaka|-15.39|28.32
ZW|Zimbabwe|Harare|-17.83|31.05
`.trim();

/* Extra cities where one point per country is not enough, because these
   countries are wide enough that UV differs meaningfully across them. */
const EXTRA = `
US|Los Angeles|34.05|-118.24
US|Chicago|41.88|-87.63
US|Houston|29.76|-95.37
US|Miami|25.76|-80.19
US|Denver|39.74|-104.99
US|Seattle|47.61|-122.33
US|Phoenix|33.45|-112.07
US|Anchorage|61.22|-149.90
US|Honolulu|21.31|-157.86
CA|Vancouver|49.28|-123.12
CA|Montreal|45.50|-73.57
CA|Calgary|51.05|-114.07
AU|Melbourne|-37.81|144.96
AU|Brisbane|-27.47|153.03
AU|Perth|-31.95|115.86
AU|Darwin|-12.46|130.84
BR|Rio de Janeiro|-22.91|-43.17
BR|Brasilia|-15.79|-47.88
BR|Manaus|-3.12|-60.02
RU|Saint Petersburg|59.93|30.34
RU|Novosibirsk|55.01|82.93
RU|Sochi|43.60|39.73
CN|Beijing|39.90|116.41
CN|Guangzhou|23.13|113.26
CN|Chengdu|30.57|104.07
IN|Delhi|28.70|77.10
IN|Bengaluru|12.97|77.59
IN|Kolkata|22.57|88.36
IN|Chennai|13.08|80.27
AZ|Ganja|40.68|46.36
AZ|Sumqayit|40.59|49.67
AZ|Lankaran|38.75|48.85
AZ|Shaki|41.19|47.17
AZ|Nakhchivan|39.21|45.41
GR|Thessaloniki|40.64|22.94
GR|Patras|38.25|21.73
GR|Heraklion|35.34|25.13
GR|Rhodes|36.43|28.22
TR|Ankara|39.93|32.86
TR|Izmir|38.42|27.14
TR|Antalya|36.90|30.69
DE|Munich|48.14|11.58
DE|Hamburg|53.55|9.99
DE|Cologne|50.94|6.96
GB|Manchester|53.48|-2.24
GB|Edinburgh|55.95|-3.19
GB|Birmingham|52.49|-1.89
FR|Marseille|43.30|5.37
FR|Lyon|45.76|4.84
ES|Barcelona|41.39|2.17
ES|Seville|37.39|-6.00
ES|Las Palmas|28.12|-15.44
IT|Milan|45.46|9.19
IT|Naples|40.85|14.27
IT|Palermo|38.12|13.36
JP|Osaka|34.69|135.50
JP|Sapporo|43.06|141.35
JP|Naha|26.21|127.68
ZA|Cape Town|-33.92|18.42
ZA|Durban|-29.86|31.02
MX|Guadalajara|20.67|-103.35
MX|Cancun|21.16|-86.85
AE|Abu Dhabi|24.45|54.38
SA|Jeddah|21.49|39.19
NG|Abuja|9.06|7.49
KE|Mombasa|-4.04|39.67
ID|Bali|-8.65|115.22
TH|Phuket|7.88|98.39
PH|Cebu|10.32|123.89
VN|Ho Chi Minh City|10.82|106.63
NZ|Christchurch|-43.53|172.64
NO|Tromso|69.65|18.96
SE|Gothenburg|57.71|11.97
FI|Rovaniemi|66.50|25.73
`.trim();

const COUNTRY_NAME = new Map();
export const PLACES = [];

for (const line of ROWS.split('\n')) {
  const [iso, country, city, lat, lon] = line.split('|');
  COUNTRY_NAME.set(iso, country);
  PLACES.push({
    id: `${iso}-${city.toLowerCase().replace(/[^a-z]/g, '')}`,
    city, country, iso,
    lat: Number(lat), lon: Number(lon),
    capital: true,
  });
}
for (const line of EXTRA.split('\n')) {
  const [iso, city, lat, lon] = line.split('|');
  PLACES.push({
    id: `${iso}-${city.toLowerCase().replace(/[^a-z]/g, '')}`,
    city, country: COUNTRY_NAME.get(iso) ?? iso, iso,
    lat: Number(lat), lon: Number(lon),
    capital: false,
  });
}

export const COUNTRIES = [...COUNTRY_NAME.entries()]
  .map(([iso, name]) => ({ iso, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Search by city or country. Local, and returns the closest matches first. */
export function findPlaces(query, limit = 8) {
  const q = fold(query.trim());
  if (!q) return [];
  const scored = [];
  for (const p of PLACES) {
    const city = fold(p.city);
    const country = fold(p.country);
    let score = 0;
    if (city === q) score = 100;
    else if (city.startsWith(q)) score = 80;
    else if (city.includes(q)) score = 50;
    else if (country === q) score = 45;
    else if (country.startsWith(q)) score = 40;
    else if (country.includes(q)) score = 20;
    if (!score) continue;
    if (p.capital) score += 5;      // a capital is the likelier intent
    scored.push({ p, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.p);
}

/** Nearest known place to a coordinate, for the geolocation path. */
export function nearest(lat, lon) {
  let best = null, bestD = Infinity;
  for (const p of PLACES) {
    // Equirectangular approximation. Precise enough to pick a city from a
    // list, and it needs no trigonometry beyond one cosine.
    const dLat = (p.lat - lat) * 111;
    const dLon = (p.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
    const d = dLat * dLat + dLon * dLon;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best ? { place: best, km: Math.round(Math.sqrt(bestD)) } : null;
}

export function placesIn(iso) {
  return PLACES.filter(p => p.iso === iso).sort((a, b) => Number(b.capital) - Number(a.capital));
}
