/* UI state machine for the symptom flow.
 *
 * Pure: send(state, event) returns the next state. No DOM, no timers, no
 * storage. The renderer subscribes and draws whatever comes back, which is
 * what makes the flow testable without a browser.
 *
 *   BODY_SELECT  -select_region->  BODY_SELECT (sheet opens)
 *        ^                                  | continue
 *        |                                  v
 *        |                             PAIN_TYPES  -select_pain_type->  PAIN_TYPES
 *        |                                  | continue
 *        |                                  v
 *        |                              CONTEXT  -answer_context->  CONTEXT (next rung)
 *        |                                  | ladder exhausted
 *        |                                  v
 *        |                              OUTCOME  <-close_refinement-+
 *        |                                  | show_refinement       |
 *        |                                  v                       |
 *        +--------restart-------------- REFINEMENT ------------------+
 */

import { bankFor } from '../../../src/triage/index.js';
import { profile } from '../../../src/app/store.js';
import { startSession, nextQuestion, answer as answerQuestion, stepBack, resolve as resolveTriage,
         progress as triageProgress, hasMoreQuestions, skipQuestion } from '../../../src/triage/engine.js';

/* Only the two fields the question banks read. Passing the whole profile
   would put a weight and a sleep figure into a symptom session that has no
   use for either, and into the record it saves. */
const triageProfile = () => {
  const { age, sex } = profile.get();
  return { age, sex };
};

export const STATES = {
  BODY_SELECT: 'BODY_SELECT',
  PAIN_TYPES: 'PAIN_TYPES',
  CONTEXT: 'CONTEXT',
  OUTCOME: 'OUTCOME',
  REFINEMENT: 'REFINEMENT',
};

/** Set false for single choice pain selection. */
export const MULTI_SELECT_PAIN = true;

export function initialState() {
  return {
    stage: STATES.BODY_SELECT,
    view: 'front',
    // Which crop of the figure is on screen. Zooming changes tap size only;
    // it never changes which region a shape belongs to.
    zoom: 'all',
    region: null,
    // Each mark is { region, view, x, y } with x and y normalised 0 to 1
    // against the whole-body space, never against the current crop, so a
    // mark keeps its anatomical spot at any zoom.
    points: [],
    sheet: null,          // 'region' | 'detail' | 'track' | null
    painTypes: [],
    intensity: 5,          // 0 to 10, set on the gauge
    showExtraPain: false,
    // The triage session. Which question comes next depends on the answers
    // so far, so there is no fixed list to index into.
    triage: null,
    bank: null,
    question: null,
    detail: '',
    outcome: null,
    forcing: false,       // set when the person asked for more questions
    direction: 'forward', // drives which way the stage slides
  };
}

/**
 * @param {object} s current state
 * @param {{type: string, [k: string]: any}} e
 * @returns {object} next state
 */
export function send(s, e) {
  switch (e.type) {

    // Changing view never clears the region. A person turns the figure to
    // check a spot, and losing their selection for that is punishing.
    case 'set_view':
      return { ...s, view: e.view };

    case 'set_zoom':
      return { ...s, zoom: e.zoom };

    case 'mark_point': {
      const next = [...s.points.filter(pt => pt.view === e.point.view || true), e.point];
      return { ...s, region: e.point.region, points: next, sheet: 'region' };
    }

    case 'clear_points':
      return { ...s, points: [], region: null, sheet: null };

    case 'select_region':
      // Re-tapping the open region clears it, so a mis-tap costs one tap.
      if (s.region === e.regionId && s.sheet === 'region') {
        return { ...s, region: null, sheet: null };
      }
      return { ...s, region: e.regionId, sheet: 'region' };

    case 'select_pain_type': {
      if (!MULTI_SELECT_PAIN) return { ...s, painTypes: [e.painId] };
      const has = s.painTypes.includes(e.painId);
      return {
        ...s,
        painTypes: has
          ? s.painTypes.filter(p => p !== e.painId)
          : [...s.painTypes, e.painId],
      };
    }

    case 'set_intensity':
      return { ...s, intensity: e.value };

    case 'reveal_extra_pain':
      return { ...s, showExtraPain: true };

    case 'answer_context': {
      if (!s.triage) return s;
      const next = answerQuestion(s.triage, s.bank, e.questionId, e.optionId);
      return { ...s, triage: next };
    }

    case 'submit_detail':
      return { ...s, detail: e.text ?? '', sheet: null };

    case 'open_sheet':
      return { ...s, sheet: e.sheet };

    case 'close_sheet':
      return { ...s, sheet: null };

    case 'advance':
      return advance(s);

    /* Set the current question aside. It leaves the pool rather than being
       answered, so nothing moves in the ranking and the same question is not
       offered straight back. */
    case 'skip_question': {
      if (s.stage !== STATES.CONTEXT || !s.triage || !s.question) return s;
      const triage = skipQuestion(s.triage, s.question.id);
      return advance({ ...s, triage });
    }

    case 'back':
      return back(s);

    /* From the result screen: keep going. The person has said the answer is
       not good enough, so the engine asks whatever it has left rather than
       replaying the question they just answered, which is what the old
       Back action did. */
    case 'more_questions': {
      if (!s.triage || !s.bank) return s;
      const question = nextQuestion(s.triage, s.bank, { force: true });
      if (!question) return s;
      return { ...s, stage: STATES.CONTEXT, question, forcing: true, direction: 'forward' };
    }

    case 'show_refinement':
      return { ...s, stage: STATES.REFINEMENT, direction: 'forward' };

    case 'close_refinement':
      return { ...s, stage: STATES.OUTCOME, direction: 'back' };

    case 'restart':
      return { ...initialState(), view: s.view, zoom: s.zoom };

    default:
      return s;
  }
}

function advance(s) {
  switch (s.stage) {
    case STATES.BODY_SELECT:
      if (!s.region) return s;
      return { ...s, stage: STATES.PAIN_TYPES, sheet: null, direction: 'forward' };

    case STATES.PAIN_TYPES: {
      if (s.painTypes.length === 0) return s;
      const bank = bankFor(s.region);
      const triage = startSession(bank, {
        region: s.region, painTypes: s.painTypes, intensity: s.intensity,
        profile: triageProfile(),
      });
      const question = nextQuestion(triage, bank);
      if (!question) return resolve({ ...s, bank, triage });
      return { ...s, stage: STATES.CONTEXT, bank, triage, question, direction: 'forward' };
    }

    case STATES.CONTEXT: {
      if (!s.triage) return s;
      // A red flag ends the questions. Nothing after it would change what
      // the person should do next.
      if (s.triage.redFlag) return resolve(s);
      const question = nextQuestion(s.triage, s.bank, { force: s.forcing });
      if (!question) return resolve({ ...s, forcing: false });
      return { ...s, question, direction: 'forward' };
    }

    default:
      return s;
  }
}

function back(s) {
  switch (s.stage) {
    case STATES.PAIN_TYPES:
      return { ...s, stage: STATES.BODY_SELECT, sheet: null, direction: 'back' };

    case STATES.CONTEXT: {
      if (s.triage && s.triage.asked.length) {
        const back = stepBack(s.triage, s.bank);
        const question = s.bank.questions.find(q => q.id === s.triage.asked[s.triage.asked.length - 1]);
        return { ...s, triage: back, question, direction: 'back' };
      }
      return { ...s, stage: STATES.PAIN_TYPES, direction: 'back' };
    }

    case STATES.OUTCOME: {
      if (!s.triage) return { ...s, stage: STATES.PAIN_TYPES, direction: 'back' };
      const back = stepBack(s.triage, s.bank);
      const question = nextQuestion(back, s.bank) ?? s.question;
      return { ...s, stage: STATES.CONTEXT, triage: back, question, direction: 'back' };
    }

    case STATES.REFINEMENT:
      return { ...s, stage: STATES.OUTCOME, direction: 'back' };

    default:
      return s;
  }
}

/** Stopping early is allowed. The engine ranks on whatever it has. */
export function resolve(s) {
  const bank = s.bank ?? bankFor(s.region);
  const triage = s.triage ?? startSession(bank, {
    region: s.region, painTypes: s.painTypes, intensity: s.intensity,
    profile: triageProfile(),
  });
  const outcome = resolveTriage(triage, bank);
  outcome.moreQuestions = hasMoreQuestions(triage, bank);
  outcome.detail_note = s.detail;
  outcome.intensity = s.intensity;
  outcome.points = s.points;
  return { ...s, stage: STATES.OUTCOME, bank, triage, outcome, sheet: null, direction: 'forward' };
}

/** Progress for the step meter. Returns 0..1.
 *  The question count is not known in advance, so the context stage reports
 *  how far through a typical run it is rather than a fixed fraction. */
export function progress(s) {
  switch (s.stage) {
    case STATES.BODY_SELECT: return s.region ? 0.1 : 0;
    case STATES.PAIN_TYPES: return s.painTypes.length ? 0.22 : 0.12;
    case STATES.CONTEXT:
      return 0.25 + 0.7 * (s.triage && s.bank ? triageProgress(s.triage, s.bank) : 0);
    case STATES.OUTCOME:
    case STATES.REFINEMENT: return 1;
    default: return 0;
  }
}
