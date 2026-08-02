/* Adaptive triage engine.
 *
 * Naive Bayes on likelihood ratios, the same arithmetic behind published
 * diagnostic accuracy figures. Each answer option carries an LR per
 * candidate: above 1 raises that candidate, below 1 lowers it. The next
 * question asked is whichever best separates the candidates still in
 * contention. Priors are primary care base rates, not hospital ones.
 *
 * Two constraints hold throughout. Scores are never shown as probabilities,
 * since a figure derived from eight questions and no examination would imply
 * precision that is not there. And red flags are hard rules evaluated after
 * every answer that no likelihood score can override.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Odds form is easier to update than probability. */
const toOdds = p => p / (1 - p);
const toProb = o => o / (1 + o);

/**
 * Start a session for one body region.
 * @param {object} bank region question bank from ../data/triage-*.js
 * @param {object} seed { region, painTypes, intensity }
 */
export function startSession(bank, seed) {
  const candidates = bank.causes.map(c => ({
    id: c.id,
    prior: c.prior,
    odds: toOdds(c.prior),
  }));
  return {
    bankId: bank.id,
    region: seed.region,
    painTypes: seed.painTypes ?? [],
    intensity: seed.intensity ?? null,
    answers: {},        // questionId -> optionId
    asked: [],          // questionId order, for back navigation
    /* Questions the person declined to answer. Held apart from `answers`
       because a skip carries no evidence: it must not move any candidate,
       only stop the question being asked again. */
    skipped: [],
    candidates,
    redFlag: null,
    done: false,
  };
}

/** Apply the likelihood ratios attached to one chosen option. */
function applyLRs(candidates, lrs) {
  if (!lrs) return candidates;
  return candidates.map(c => {
    const lr = lrs[c.id];
    if (lr == null) return c;
    // Bounded so a single answer cannot pin a candidate at zero or certainty.
    return { ...c, odds: clamp(c.odds * lr, 1e-4, 1e4) };
  });
}

/** Posterior probability per candidate, normalised so they sum to one. */
export function ranked(session, bank) {
  const raw = session.candidates.map(c => ({ id: c.id, p: toProb(c.odds) }));
  const total = raw.reduce((n, r) => n + r.p, 0) || 1;
  return raw
    .map(r => ({
      ...bank.causes.find(c => c.id === r.id),
      score: r.p / total,
    }))
    .sort((a, b) => b.score - a.score);
}

/* A finding matches when every clause in it holds. Clauses read from the
   answers, the pain qualities, and the intensity. */
function matches(rule, session) {
  const a = session.answers;
  if (rule.answers) {
    for (const [qid, wanted] of Object.entries(rule.answers)) {
      const got = a[qid];
      if (got == null) return false;
      const list = Array.isArray(wanted) ? wanted : [wanted];
      if (!list.includes(got)) return false;
    }
  }
  if (rule.anyAnswer) {
    const hit = Object.entries(rule.anyAnswer).some(([qid, wanted]) => {
      const got = a[qid];
      if (got == null) return false;
      const list = Array.isArray(wanted) ? wanted : [wanted];
      return list.includes(got);
    });
    if (!hit) return false;
  }
  if (rule.painAny && !rule.painAny.some(p => session.painTypes.includes(p))) return false;
  if (rule.minIntensity != null && (session.intensity ?? 0) < rule.minIntensity) return false;
  return true;
}

/** Red flags are checked after every answer and outrank everything. */
export function checkRedFlags(session, bank) {
  for (const f of bank.redFlags) {
    if (matches(f, session)) return f;
  }
  return null;
}

/**
 * How much a question would separate the candidates still in contention.
 * Options that push the leaders in the same direction score zero.
 */
function separation(question, session, bank) {
  const top = ranked(session, bank).slice(0, 5);
  if (top.length < 2) return 0;
  let best = 0;
  for (const opt of question.options) {
    if (!opt.lr) continue;
    const vals = top.map(c => Math.log(opt.lr[c.id] ?? 1));
    const hi = Math.max(...vals), lo = Math.min(...vals);
    best = Math.max(best, hi - lo);
  }
  return best;
}

/** Is this question worth asking given what is already known? */
function applicable(question, session) {
  if (session.answers[question.id] != null) return false;
  if (session.skipped?.includes(question.id)) return false;
  if (question.needs && !matches(question.needs, session)) return false;
  return true;
}

/**
 * Set a question aside without answering it.
 *
 * No likelihood ratio is applied, so the ranking is exactly what it was. The
 * question simply leaves the pool, which is what stops the engine offering it
 * again on the next step.
 */
export function skipQuestion(session, questionId) {
  if (!questionId || session.skipped?.includes(questionId)) return session;
  return { ...session, skipped: [...(session.skipped ?? []), questionId] };
}

/**
 * Pick the next question, or null when the session should resolve.
 * Screening questions come first so nothing dangerous is missed, then the
 * engine follows whatever separates the leaders.
 */
export function nextQuestion(session, bank, { force = false } = {}) {
  const pool = bank.questions.filter(q => applicable(q, session));
  if (!pool.length) return null;

  // Screening questions carry red flag findings. Ask them early and always.
  const screening = pool.filter(q => q.screening).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (screening.length) return screening[0];

  if (session.asked.length >= (bank.maxQuestions ?? 9)) return null;

  /* Screening questions rule things out but rarely separate the leaders.
     Applying the confidence gate before any discriminating question has been
     asked would return whichever cause held the highest prior. */
  const screeningIds = new Set(bank.questions.filter(q => q.screening).map(q => q.id));
  const discriminating = session.asked.filter(id => !screeningIds.has(id)).length;

  /* `force` comes from the result screen asking for more questions. The
     confidence gate lifts; the hard cap does not. */
  const top = ranked(session, bank);
  if (!force && discriminating >= 3 && top.length > 1
      && top[0].score > 0.40 && top[0].score - top[1].score > 0.18) {
    return null;
  }

  const scored = pool
    .map(q => ({ q, s: separation(q, session, bank) }))
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return null;
  // Nothing discriminating left. Under force, ask the best remaining anyway.
  if (!force && scored[0].s < 0.15) return null;
  return scored[0].q;
}

/** Record an answer and fold it into the candidate scores. */
export function answer(session, bank, questionId, optionId) {
  const q = bank.questions.find(x => x.id === questionId);
  const opt = q?.options.find(o => o.id === optionId);
  if (!q || !opt) return session;

  const next = {
    ...session,
    answers: { ...session.answers, [questionId]: optionId },
    asked: session.asked.includes(questionId) ? session.asked : [...session.asked, questionId],
    candidates: applyLRs(session.candidates, opt.lr),
  };
  next.redFlag = checkRedFlags(next, bank);
  return next;
}

/** Undo the most recent answer. Rebuilt from scratch so scores stay exact. */
export function stepBack(session, bank) {
  if (!session.asked.length) return session;
  const asked = session.asked.slice(0, -1);
  const dropped = session.asked[session.asked.length - 1];
  const answers = { ...session.answers };
  delete answers[dropped];

  let rebuilt = startSession(bank, session);
  rebuilt.skipped = [...(session.skipped ?? [])];
  for (const qid of asked) {
    rebuilt = answer(rebuilt, bank, qid, answers[qid]);
  }
  return rebuilt;
}

/**
 * Turn the session into a renderable result. Ranks are categorical: the
 * engine holds a score, the screen shows an ordering.
 */
export function resolve(session, bank) {
  const order = ranked(session, bank);
  const flag = session.redFlag ?? checkRedFlags(session, bank);

  const bandOf = (score, i) => {
    if (i === 0 && score > 0.34) return 'leading';
    if (score > 0.16) return 'possible';
    return 'less likely';
  };

  const shown = order.filter((c, i) => i < 5 && (i < 3 || c.score > 0.08));

  return {
    status: 'resolved',
    region: session.region,
    red_flag_present: Boolean(flag),
    red_flag: flag ? {
      trigger_id: flag.id,
      headline: flag.headline,
      lines: flag.lines,
      action_label: 'Get urgent help',
      urgency: flag.urgency ?? 'emergency',
    } : null,
    ranked_categories: shown.map((c, i) => ({
      category_id: c.id,
      label: c.label,
      rank: bandOf(c.score, i),
      note: c.note,
      score: c.score,
    })),
    self_checks: (order[0]?.selfChecks ?? bank.selfChecks ?? []).slice(0, 4),
    helps: order[0]?.helps ?? bank.helps ?? [],
    reasons: explain(session, bank, order),
    answered: session.asked.length,
    basis: bank.basis ?? null,
  };
}

/** Two to four plain lines naming the answers that did the most work. */
function explain(session, bank, order) {
  const lines = [];
  const lead = order[0];
  if (!lead) return lines;

  // Which answers pushed the leader up the most.
  const contributions = session.asked.map(qid => {
    const q = bank.questions.find(x => x.id === qid);
    const opt = q?.options.find(o => o.id === session.answers[qid]);
    const lr = opt?.lr?.[lead.id] ?? 1;
    return { q, opt, weight: Math.abs(Math.log(lr)) , up: lr > 1 };
  }).filter(c => c.q && c.weight > 0.2)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  for (const c of contributions) {
    lines.push(c.up
      ? `You said ${c.opt.label.toLowerCase()}, which fits ${lead.label.toLowerCase()}.`
      : `You said ${c.opt.label.toLowerCase()}, which argues against the alternatives.`);
  }

  if (session.painTypes.length && lines.length < 4) {
    lines.push(`The quality you picked narrows this to the tissue layer rather than everything in the area.`);
  }
  if (!lines.length) {
    lines.push('Not enough separated the possibilities, so they are listed close together on purpose.');
  }
  return lines.slice(0, 4);
}

/** Are there questions left that have not been asked? */
export function hasMoreQuestions(session, bank) {
  return Boolean(nextQuestion(session, bank, { force: true }));
}

/** Progress for the meter. Screening questions are known up front. */
export function progress(session, bank) {
  const target = bank.typicalQuestions ?? 7;
  return clamp(session.asked.length / target, 0, 1);
}
