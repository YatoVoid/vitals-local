/* Learn: a searchable library.
 *
 * Search runs over the full text of every article, on device. Typing a phrase
 * from the middle of a paragraph finds the article it came from.
 */

import { el, eyebrow, fieldLabel, panel, button, row, rows } from '../app/ui.js';
import { ARTICLES, CATEGORIES, byCategory, getArticle, search, snippet, POPULAR }
  from '../data/library/index.js';

const VERDICT_LABEL = {
  false: 'Not true',
  'mostly false': 'Mostly not true',
  mixed: 'Partly true',
  'mostly true': 'Mostly true',
  true: 'True',
};

export function renderLearnIndex(screen, { go, live }) {
  screen.appendChild(eyebrow('Learn'));
  screen.appendChild(el('h1', null, 'Look something up'));

  /* ---- Search ---- */
  const form = el('form', 'searchbar');
  const input = el('input', 'field');
  input.type = 'search';
  input.placeholder = 'Try: protein, sunscreen, back pain, detox';
  input.setAttribute('aria-label', 'Search the library');
  form.appendChild(input);
  form.addEventListener('submit', ev => ev.preventDefault());
  screen.appendChild(form);

  const results = el('div', 'results');
  results.setAttribute('aria-live', 'polite');
  screen.appendChild(results);

  const browse = el('div');
  screen.appendChild(browse);

  const drawBrowse = () => {
    browse.replaceChildren();

    const suggest = el('div', 'chiprow');
    POPULAR.forEach(q => suggest.appendChild(button(q, 'chipbtn', () => {
      input.value = q;
      runSearch(q);
      input.focus();
    })));
    browse.appendChild(fieldLabel('Common questions'));
    browse.appendChild(suggest);

    CATEGORIES.forEach(cat => {
      const list = byCategory(cat);
      browse.appendChild(el('h2', null, cat));
      browse.appendChild(rows(...list.map(a => row(a.title, {
        sub: a.summary,
        end: a.verdict ? VERDICT_LABEL[a.verdict] : '',
        onClick: () => go(`#/learn/${a.id}`),
      }))));
    });

    const how = panel(
      eyebrow('Where this comes from'),
      el('p', null,
        'Positions from guideline bodies, systematic reviews, and '
        + 'pharmacopoeia. No blogs, no news write ups, nothing industry '
        + 'funded, and no product named or recommended anywhere.'),
      el('p', null,
        'Where the evidence is weak or disputed, each article says so rather '
        + 'than picking a side and sounding confident.'),
    );
    how.style.marginBlockStart = 'var(--s-6)';
    browse.appendChild(how);
  };

  const runSearch = q => {
    const query = q.trim();
    results.replaceChildren();
    if (!query) { browse.hidden = false; return; }
    browse.hidden = true;

    const hits = search(query);
    if (!hits.length) {
      results.appendChild(el('p', 'empty',
        `Nothing found for "${query}". Try a plainer word: the library is '
        + 'written in ordinary language rather than medical terms.`));
      live.textContent = 'No results';
      return;
    }
    live.textContent = `${hits.length} result${hits.length === 1 ? '' : 's'}`;
    results.appendChild(el('p', 'label',
      `${hits.length} result${hits.length === 1 ? '' : 's'}`));
    results.appendChild(rows(...hits.map(h => row(h.article.title, {
      sub: snippet(h.article, query),
      end: h.article.verdict ? VERDICT_LABEL[h.article.verdict] : h.article.category,
      onClick: () => go(`#/learn/${h.article.id}`),
    }))));
  };

  let timer = null;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(input.value), 140);
  });

  drawBrowse();
}

/* ---- One article ---- */
export function renderArticle(id) {
  return function render(screen, { go }) {
    const a = getArticle(id);
    if (!a) {
      screen.appendChild(el('p', 'empty', 'That article is not here.'));
      screen.appendChild(button('Back to Learn', 'btn btn--block', () => go('#/learn')));
      return;
    }

    screen.appendChild(eyebrow(a.category));
    screen.appendChild(el('h1', null, a.title));

    if (a.verdict) {
      const v = panel(
        eyebrow('Verdict'),
        el('p', 'verdict-line', VERDICT_LABEL[a.verdict]),
        el('p', null, a.summary),
      );
      v.dataset.claim = a.verdict;
      screen.appendChild(v);
    } else {
      screen.appendChild(el('p', 'lede', a.summary));
    }

    a.sections.forEach(([h, p]) => {
      screen.appendChild(el('h2', null, h));
      screen.appendChild(el('p', null, p));
    });

    if (a.basis) {
      const basis = panel(eyebrow('What this is based on'), el('p', null, a.basis));
      basis.style.marginBlockStart = 'var(--s-6)';
      screen.appendChild(basis);
    }

    /* Related reading, by shared tags. Cheap, and better than nothing. */
    const related = ARTICLES
      .filter(x => x.id !== a.id)
      .map(x => ({ x, shared: (x.tags ?? []).filter(t => (a.tags ?? []).includes(t)).length }))
      .filter(r => r.shared > 0)
      .sort((p, q) => q.shared - p.shared)
      .slice(0, 3);
    if (related.length) {
      screen.appendChild(el('h2', null, 'Related'));
      screen.appendChild(rows(...related.map(r => row(r.x.title, {
        sub: r.x.summary,
        onClick: () => go(`#/learn/${r.x.id}`),
      }))));
    }

    const back = button('Back to Learn', 'btn btn--quiet btn--block', () => go('#/learn'));
    back.style.marginBlockStart = 'var(--s-6)';
    screen.appendChild(back);
  };
}
