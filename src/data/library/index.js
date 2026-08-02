/* The library, and search over it.
 *
 * Everything is local. Search runs against the full text of every article, so
 * a phrase from the middle of a paragraph finds the article it came from.
 *
 * Sourcing rule for everything in here: positions from guideline bodies,
 * systematic reviews, and pharmacopoeia. No blogs, no news write ups, no
 * industry funded material, and no product is named or recommended anywhere.
 */

import { FOOD } from './food.js';
import { MOVEMENT } from './movement.js';
import { CLAIMS } from './claims.js';
import { SKIN } from './skin.js';
import { BASICS } from './basics.js';

export const ARTICLES = [...BASICS, ...FOOD, ...MOVEMENT, ...SKIN, ...CLAIMS];

export const CATEGORIES = [...new Set(ARTICLES.map(a => a.category))];

export function getArticle(id) {
  return ARTICLES.find(a => a.id === id) ?? null;
}

export function byCategory(category) {
  return ARTICLES.filter(a => a.category === category);
}

/* ---- Search ----
 *
 * A small inverted index built once, on first use. Scoring favours a hit in
 * the title over a hit in a tag over a hit in the body, and rewards matching
 * more of the query rather than matching one word many times, which is what
 * makes a two word query behave sensibly.
 */

const STOP = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does',
  'for', 'from', 'has', 'have', 'how', 'i', 'if', 'in', 'is', 'it', 'its',
  'me', 'my', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'what', 'when',
  'which', 'why', 'with', 'you', 'your',
]);

const tokenise = text => String(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 1 && !STOP.has(w));

/* Crude but effective stemming for the handful of endings that matter in
   health words. A full stemmer would be more code than the problem needs. */
function stem(word) {
  return word
    .replace(/(ies)$/, 'y')
    .replace(/(sses)$/, 'ss')
    .replace(/([^s])s$/, '$1')
    .replace(/(ing|ed)$/, '');
}

let INDEX = null;

function build() {
  const idx = new Map();     // stem -> Map(articleId -> weight)
  const add = (stemmed, id, weight) => {
    if (!idx.has(stemmed)) idx.set(stemmed, new Map());
    const m = idx.get(stemmed);
    m.set(id, (m.get(id) ?? 0) + weight);
  };

  for (const a of ARTICLES) {
    for (const w of tokenise(a.title)) add(stem(w), a.id, 8);
    for (const t of a.tags ?? []) for (const w of tokenise(t)) add(stem(w), a.id, 6);
    for (const w of tokenise(a.summary ?? '')) add(stem(w), a.id, 3);
    for (const [h, p] of a.sections ?? []) {
      for (const w of tokenise(h)) add(stem(w), a.id, 3);
      for (const w of tokenise(p)) add(stem(w), a.id, 1);
    }
    if (a.verdict) for (const w of tokenise(a.verdict)) add(stem(w), a.id, 2);
  }
  INDEX = idx;
}

/**
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{article, score, why}>}
 */
export function search(query, limit = 12) {
  if (!INDEX) build();
  const terms = [...new Set(tokenise(query).map(stem))];
  if (!terms.length) return [];

  const scores = new Map();     // id -> { score, matched:Set }
  for (const t of terms) {
    // Exact stem first, then any indexed stem starting with it, so a partial
    // word still finds something rather than returning nothing.
    const buckets = INDEX.has(t)
      ? [INDEX.get(t)]
      : [...INDEX.entries()].filter(([k]) => k.startsWith(t) && t.length >= 3).map(([, v]) => v);

    for (const bucket of buckets) {
      for (const [id, weight] of bucket) {
        const cur = scores.get(id) ?? { score: 0, matched: new Set() };
        cur.score += weight;
        cur.matched.add(t);
        scores.set(id, cur);
      }
    }
  }

  return [...scores.entries()]
    .map(([id, s]) => ({
      article: getArticle(id),
      // Matching more of the query counts for more than matching one word
      // repeatedly, which is what stops a long article winning everything.
      score: s.score * (s.matched.size / terms.length) ** 2,
      why: [...s.matched],
    }))
    .filter(r => r.article)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** The line of body text a hit came from, for the result list. */
export function snippet(article, query) {
  const terms = tokenise(query).map(stem);
  if (!terms.length) return article.summary;
  const paras = (article.sections ?? []).map(([, p]) => p);
  for (const p of paras) {
    const words = tokenise(p).map(stem);
    if (terms.some(t => words.includes(t))) {
      const sentences = p.split(/(?<=\.)\s+/);
      const hit = sentences.find(s => {
        const w = tokenise(s).map(stem);
        return terms.some(t => w.includes(t));
      });
      if (hit) return hit.length > 190 ? hit.slice(0, 187) + '...' : hit;
    }
  }
  return article.summary;
}

/** Suggestions for an empty search box, drawn from real tags. */
export const POPULAR = [
  'protein', 'sunscreen', 'back pain', 'sleep', 'detox', 'seed oils',
  'how much water', 'stretching', 'sugar and cancer', 'vitamin d',
  'ice or heat', 'creatine',
];
