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
    /* Age and sex, so a question the profile already answers is not put to
       anyone again. Asking a man whether the pain tracks with his cycle, or
       asking a thirty year old about headaches after fifty, reads as an app
       that did not look at what it was told. */
    profile: seed.profile ?? {},
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

  /* Profile clauses. A value nobody has entered passes rather than blocks:
     not knowing someone's age is a reason to ask them a question, never a
     reason to withhold a red flag. */
  const p = session.profile ?? {};
  if (rule.minAge != null && p.age != null && p.age < rule.minAge) return false;
  if (rule.maxAge != null && p.age != null && p.age > rule.maxAge) return false;
  /* Named as who it does not apply to rather than who it does. The profile
     offers Other and Skip alongside Female and Male, and neither of those
     tells you a question about periods is irrelevant, so only a value that
     positively rules it out is allowed to. */
  if (rule.sexNot && p.sex && rule.sexNot.includes(p.sex)) return false;
  return true;
}

/** Red flags are checked after every answer and outrank everything. */
export function checkRedFlags(session, bank) {
  for (const f of bank.redFlags) {
    if (matches(f, session)) return f;
  }
  return null;
}

const entropy = ps => {
  let h = 0;
  for (const x of ps) if (x > 0) h -= x * Math.log2(x);
  return h;
};

/**
 * How much a question is expected to narrow things down, in bits.
 *
 * The measure that replaced a cruder one. Before, a question scored on the
 * single option that spread the leaders furthest apart, across the top five
 * candidates only. That rewarded a question with one very telling answer
 * nobody was likely to give, ignored how probable each answer was, and could
 * not see a question that ruled out four unlikely causes at once.
 *
 * This is the expected drop in entropy over the whole field: for each answer,
 * how likely it is and how much doubt would be left after it, weighted
 * together. A question worth asking is one whose answer is hard to predict
 * and changes the ranking whichever way it goes.
 *
 * Likelihood ratios are read as relative likelihoods and normalised per
 * candidate across the options, which is what lets a ratio stand in for
 * P(answer given cause) without a second set of numbers to maintain.
 */
function infoGain(question, session, bank) {
  const order = ranked(session, bank);
  if (order.length < 2) return 0;

  const ids = order.map(c => c.id);
  const prior = order.map(c => c.score);
  const before = entropy(prior);
  if (before <= 0) return 0;

  const opts = question.options;
  // cond[optionIndex][causeIndex] = P(option | cause)
  const cond = opts.map(o => ids.map(id => Math.max(o.lr?.[id] ?? 1, 1e-3)));
  for (let ci = 0; ci < ids.length; ci++) {
    let sum = 0;
    for (let oi = 0; oi < opts.length; oi++) sum += cond[oi][ci];
    if (sum <= 0) continue;
    for (let oi = 0; oi < opts.length; oi++) cond[oi][ci] /= sum;
  }

  let after = 0;
  for (let oi = 0; oi < opts.length; oi++) {
    const joint = prior.map((pc, ci) => pc * cond[oi][ci]);
    const pOption = joint.reduce((a, b) => a + b, 0);
    if (pOption <= 1e-9) continue;
    after += pOption * entropy(joint.map(j => j / pOption));
  }
  return Math.max(0, before - after);
}

/**
 * The wording to put on screen.
 *
 * A prompt may be written as a function of the session where the profile
 * changes how it should read. Plain strings stay plain strings, and the
 * result is ordinary text in the DOM either way, so the translator reaches it
 * the same as any other.
 */
export function promptFor(question, session) {
  return typeof question.prompt === 'function'
    ? question.prompt(session)
    : question.prompt;
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

  const budget = bank.maxQuestions ?? 9;
  if (session.asked.length >= budget) return null;

  /* The last slots belong to whatever a red flag still needs.
   *
   * A question that only feeds a flag rarely separates the leading causes, so
   * it loses every comparison against a question that does, and the budget
   * runs out before it is ever reached. Measured over the banks, the calf
   * swelling question behind the lung clot flag went unasked in four
   * sessions out of five, which leaves the rule written, tested, and unable
   * to fire.
   *
   * Free choice keeps the early slots, where it is worth most. Once only as
   * many questions remain as there are outstanding flag inputs, those take
   * the rest. The gate below cannot end the session while any are pending. */
  const pending = pendingFlagInputs(session, bank, pool);
  if (pending.length && budget - session.asked.length <= pending.length) {
    return bestBy(pending, session, bank);
  }

  /* Screening questions rule things out but rarely separate the leaders.
     Applying the confidence gate before any discriminating question has been
     asked would return whichever cause held the highest prior. */
  const screeningIds = new Set(bank.questions.filter(q => q.screening).map(q => q.id));
  const discriminating = session.asked.filter(id => !screeningIds.has(id)).length;

  /* `force` comes from the result screen asking for more questions. The
     confidence gate lifts; the hard cap does not. */
  const top = ranked(session, bank);
  if (!force && !pending.length && discriminating >= 3 && top.length > 1
      && top[0].score > 0.40 && top[0].score - top[1].score > 0.18) {
    return null;
  }

  const best = bestBy(pool, session, bank);
  /* Nothing left worth asking. A tenth of a bit is about the point where an
     answer stops changing the ordering. Under force, ask the best remaining
     anyway, and never stop while a flag is still waiting on an answer. */
  if (!force && !pending.length && infoGain(best, session, bank) < 0.06) return null;
  return best;
}

/** The question expected to narrow things down most, of those given. */
function bestBy(questions, session, bank) {
  let best = questions[0], bestScore = -1;
  for (const q of questions) {
    const s = infoGain(q, session, bank);
    if (s > bestScore) { bestScore = s; best = q; }
  }
  return best;
}

/**
 * Questions a red flag depends on that nobody has answered yet.
 *
 * Only those still worth asking: one gated behind an answer that was never
 * given, or ruled out by the profile, is not pending, it is inapplicable.
 */
function pendingFlagInputs(session, bank, pool) {
  const needed = new Set();
  for (const f of bank.redFlags) {
    for (const qid of Object.keys({ ...(f.answers ?? {}), ...(f.anyAnswer ?? {}) })) {
      if (session.answers[qid] == null) needed.add(qid);
    }
  }
  return pool.filter(q => needed.has(q.id));
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
