/* Language table.
 *
 * The endonym is the primary label, since that is what a reader scans for.
 * The English name is secondary, for anyone setting the language on someone
 * else's behalf.
 *
 * `dir` marks right-to-left scripts. `script` selects a font stack and
 * switches off tracked uppercase, which is unreadable in most of them.
 */

export const LANGUAGES = [
  { code: 'en',    name: 'English',    english: 'English',    script: 'latin' },
  { code: 'zh-Hans', name: '简体中文',   english: 'Chinese, Simplified', script: 'han' },
  { code: 'zh-Hant', name: '繁體中文',   english: 'Chinese, Traditional', script: 'han' },
  { code: 'yue',   name: '粵語',        english: 'Cantonese',  script: 'han', engine: 'zh-Hant-HK' },
  { code: 'ja',    name: '日本語',       english: 'Japanese',   script: 'jpan' },
  { code: 'ko',    name: '한국어',       english: 'Korean',     script: 'hang' },
  { code: 'hi',    name: 'हिन्दी',        english: 'Hindi',      script: 'deva' },
  { code: 'bn',    name: 'বাংলা',        english: 'Bengali',    script: 'beng' },
  { code: 'pa',    name: 'ਪੰਜਾਬੀ',       english: 'Punjabi',    script: 'guru' },
  { code: 'ta',    name: 'தமிழ்',        english: 'Tamil',      script: 'taml' },
  { code: 'te',    name: 'తెలుగు',       english: 'Telugu',     script: 'telu' },
  { code: 'mr',    name: 'मराठी',        english: 'Marathi',    script: 'deva' },
  { code: 'gu',    name: 'ગુજરાતી',      english: 'Gujarati',   script: 'gujr' },
  { code: 'ur',    name: 'اردو',        english: 'Urdu',       script: 'arab', dir: 'rtl' },
  { code: 'ar',    name: 'العربية',      english: 'Arabic',     script: 'arab', dir: 'rtl' },
  { code: 'fa',    name: 'فارسی',        english: 'Persian',    script: 'arab', dir: 'rtl' },
  { code: 'he',    name: 'עברית',       english: 'Hebrew',     script: 'hebr', dir: 'rtl' },
  { code: 'ru',    name: 'Русский',     english: 'Russian',    script: 'cyrl' },
  { code: 'uk',    name: 'Українська',  english: 'Ukrainian',  script: 'cyrl' },
  { code: 'be',    name: 'Беларуская',  english: 'Belarusian', script: 'cyrl' },
  { code: 'bg',    name: 'Български',   english: 'Bulgarian',  script: 'cyrl' },
  { code: 'sr',    name: 'Српски',      english: 'Serbian',    script: 'cyrl' },
  { code: 'mk',    name: 'Македонски',  english: 'Macedonian', script: 'cyrl' },
  { code: 'kk',    name: 'Қазақша',     english: 'Kazakh',     script: 'cyrl' },
  { code: 'el',    name: 'Ελληνικά',    english: 'Greek',      script: 'grek' },
  { code: 'hy',    name: 'Հայերեն',     english: 'Armenian',   script: 'armn' },
  { code: 'ka',    name: 'ქართული',     english: 'Georgian',   script: 'geor' },
  { code: 'th',    name: 'ไทย',         english: 'Thai',       script: 'thai' },
  { code: 'vi',    name: 'Tiếng Việt',  english: 'Vietnamese', script: 'latin' },
  { code: 'km',    name: 'ខ្មែរ',         english: 'Khmer',      script: 'khmr' },
  { code: 'my',    name: 'မြန်မာ',       english: 'Burmese',    script: 'mymr' },
  { code: 'am',    name: 'አማርኛ',        english: 'Amharic',    script: 'ethi' },
  { code: 'az',    name: 'Azərbaycan',  english: 'Azerbaijani', script: 'latin' },
  { code: 'tr',    name: 'Türkçe',      english: 'Turkish',    script: 'latin' },
  { code: 'es',    name: 'Español',     english: 'Spanish',    script: 'latin' },
  { code: 'pt',    name: 'Português',   english: 'Portuguese', script: 'latin' },
  { code: 'fr',    name: 'Français',    english: 'French',     script: 'latin' },
  { code: 'de',    name: 'Deutsch',     english: 'German',     script: 'latin' },
  { code: 'it',    name: 'Italiano',    english: 'Italian',    script: 'latin' },
  { code: 'nl',    name: 'Nederlands',  english: 'Dutch',      script: 'latin' },
  { code: 'pl',    name: 'Polski',      english: 'Polish',     script: 'latin' },
  { code: 'cs',    name: 'Čeština',     english: 'Czech',      script: 'latin' },
  { code: 'sk',    name: 'Slovenčina',  english: 'Slovak',     script: 'latin' },
  { code: 'hu',    name: 'Magyar',      english: 'Hungarian',  script: 'latin' },
  { code: 'ro',    name: 'Română',      english: 'Romanian',   script: 'latin' },
  { code: 'hr',    name: 'Hrvatski',    english: 'Croatian',   script: 'latin' },
  { code: 'sl',    name: 'Slovenščina', english: 'Slovenian',  script: 'latin' },
  { code: 'sv',    name: 'Svenska',     english: 'Swedish',    script: 'latin' },
  { code: 'no',    name: 'Norsk',       english: 'Norwegian',  script: 'latin' },
  { code: 'da',    name: 'Dansk',       english: 'Danish',     script: 'latin' },
  { code: 'fi',    name: 'Suomi',       english: 'Finnish',    script: 'latin' },
  { code: 'et',    name: 'Eesti',       english: 'Estonian',   script: 'latin' },
  { code: 'lv',    name: 'Latviešu',    english: 'Latvian',    script: 'latin' },
  { code: 'lt',    name: 'Lietuvių',    english: 'Lithuanian', script: 'latin' },
  { code: 'id',    name: 'Bahasa Indonesia', english: 'Indonesian', script: 'latin' },
  { code: 'ms',    name: 'Bahasa Melayu',    english: 'Malay',  script: 'latin' },
  { code: 'tl',    name: 'Tagalog',     english: 'Tagalog',    script: 'latin' },
  { code: 'sw',    name: 'Kiswahili',   english: 'Swahili',    script: 'latin' },
  { code: 'ha',    name: 'Hausa',       english: 'Hausa',      script: 'latin' },
  { code: 'yo',    name: 'Yorùbá',      english: 'Yoruba',     script: 'latin' },
  { code: 'zu',    name: 'isiZulu',     english: 'Zulu',       script: 'latin' },
  { code: 'af',    name: 'Afrikaans',   english: 'Afrikaans',  script: 'latin' },
  { code: 'ne',    name: 'नेपाली',       english: 'Nepali',     script: 'deva' },
  { code: 'si',    name: 'සිංහල',        english: 'Sinhala',    script: 'sinh' },
  { code: 'uz',    name: 'Oʻzbekcha',   english: 'Uzbek',      script: 'latin' },
];

const BY_CODE = new Map(LANGUAGES.map(l => [l.code, l]));

/**
 * The tag to hand the translation engine, which is not always the tag the
 * app uses. Written Cantonese is served by the Hong Kong traditional model,
 * for instance, and nothing else the engine offers comes closer.
 */
export function engineCode(code) {
  return language(code).engine ?? code;
}

export function language(code) {
  return BY_CODE.get(code) ?? BY_CODE.get('en');
}

export function isRTL(code) {
  return language(code).dir === 'rtl';
}

/** Scripts where tracked uppercase is unreadable or meaningless. */
const NO_CAPS = new Set(['han', 'jpan', 'hang', 'arab', 'hebr', 'deva', 'beng',
  'guru', 'taml', 'telu', 'gujr', 'thai', 'khmr', 'mymr', 'ethi', 'sinh', 'geor', 'armn']);

export function usesCaps(code) {
  return !NO_CAPS.has(language(code).script);
}

/** The best guess at what the person reads, from the browser. */
export function preferred() {
  for (const tag of navigator.languages ?? [navigator.language]) {
    if (!tag) continue;
    if (BY_CODE.has(tag)) return tag;
    // zh-CN and zh-SG write simplified; zh-TW and zh-HK write traditional.
    if (tag.startsWith('zh')) {
      return /Hant|TW|HK|MO/i.test(tag) ? 'zh-Hant' : 'zh-Hans';
    }
    const base = tag.split('-')[0];
    if (BY_CODE.has(base)) return base;
  }
  return 'en';
}

/** Search by either name, so both spellings find it. */
export function findLanguages(query) {
  const q = query.trim().toLowerCase();
  if (!q) return LANGUAGES;
  return LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.english.toLowerCase().includes(q) ||
    l.code.toLowerCase().startsWith(q));
}
