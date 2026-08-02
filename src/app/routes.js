/* Route table.
 *
 * `depth` drives slide direction: a deeper screen enters from the end edge, a
 * shallower one from the start edge, matching a back gesture.
 */

import { renderHome } from '../screens/home.js';
import { renderBody } from '../screens/body.js';
import { renderTrackIndex, renderDiet, renderHydration, renderMeds, renderLabs }
  from '../screens/track.js';
import { renderLearnIndex, renderArticle } from '../screens/learn.js';
import { renderYou, renderSettings, renderProfile, renderHistory }
  from '../screens/you.js';
import { renderSetup } from '../screens/setup.js';
import { renderEpisodes, renderEpisode } from '../screens/episodes.js';
import { getArticle } from '../data/library/index.js';
import { renderOutside } from '../screens/outside.js';
import { renderLanguage } from '../screens/language.js';

export const TABS = [
  { label: 'Home',  icon: 'home',  route: '#/home',  match: '#/home' },
  { label: 'Body',  icon: 'body',  route: '#/body',  match: '#/body' },
  { label: 'Track', icon: 'track', route: '#/track', match: '#/track' },
  { label: 'Learn', icon: 'learn', route: '#/learn', match: '#/learn' },
  { label: 'You',   icon: 'you',   route: '#/you',   match: '#/you' },
];

/* An episode route carries its id in the hash, so a person can keep a link
   to one they are watching. Resolved at match time rather than listed. */
export function resolveRoute(hash) {
  const direct = SCREENS[hash];
  if (direct) return direct;
  const pain = hash.match(/^#\/track\/pain\/(.+)$/);
  if (pain) return { title: 'Tracked pain', depth: 2, render: renderEpisode(pain[1]) };

  const article = hash.match(/^#\/learn\/(.+)$/);
  if (article) {
    const a = getArticle(article[1]);
    if (a) return { title: a.title, depth: 1, render: renderArticle(article[1]) };
  }
  return null;
}

export const SCREENS = {
  '#/setup':           { title: 'Setup',       depth: 0, render: renderSetup },

  '#/home':            { title: 'Home',        depth: 0, render: renderHome },

  '#/body':            { title: 'Body',        depth: 0, bleed: true, render: renderBody },

  '#/track':           { title: 'Track',       depth: 0, render: renderTrackIndex },
  '#/track/diet':      { title: 'Food',        depth: 1, render: renderDiet },
  '#/track/hydration': { title: 'Water',       depth: 1, render: renderHydration },
  '#/track/meds':      { title: 'Medicines',   depth: 1, render: renderMeds },
  '#/track/labs':      { title: 'Lab results', depth: 1, render: renderLabs },
  '#/track/pain':      { title: 'Tracked pain', depth: 1, render: renderEpisodes },
  '#/track/outside':   { title: 'Sun and air',  depth: 1, render: renderOutside },

  '#/learn':           { title: 'Learn',       depth: 0, render: renderLearnIndex },

  '#/you':             { title: 'You',         depth: 0, render: renderYou },
  '#/you/profile':     { title: 'Profile',     depth: 1, render: renderProfile },
  '#/you/settings':    { title: 'Settings',    depth: 1, render: renderSettings },
  '#/you/language':    { title: 'Language',     depth: 2, render: renderLanguage },
  '#/you/history':     { title: 'History',     depth: 1, render: renderHistory },
};
