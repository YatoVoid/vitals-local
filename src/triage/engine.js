// Adaptive triage engine.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Odds form is easier to update than probability.
const toOdds = p => p / (1 - p);
const toProb = o => o / (1 + o);

// Start a session for one body region.
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
    // Age and sex, so a question the profile already answers is not put to anyone again.
    profile: seed.profile ?? {},
    answers: {},        // questionId -> optionId
    asked: [],          // questionId order, for back navigation
    // Questions the person declined to answer.
    skipped: [],
    candidates,
    redFlag: null,
    done: false,
  };
}

// Apply the likelihood ratios attached to one chosen option.
function applyLRs(candidates, lrs) {
  if (!lrs) return candidates;
  return candidates.map(c => {
    const lr = lrs[c.id];
    if (lr == null) return c;
    // Bounded so a single answer cannot pin a candidate at zero or certainty.
    return { ...c, odds: clamp(c.odds * lr, 1e-4, 1e4) };
  });
}

// Posterior probability per candidate, normalised so they sum to one.
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

// A finding matches when every clause in it holds.
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

  // Profile clauses.
  const p = session.profile ?? {};
  if (rule.minAge != null && p.age != null && p.age < rule.minAge) return false;
  if (rule.maxAge != null && p.age != null && p.age > rule.maxAge) return false;
  // Named as who it does not apply to rather than who it does.
  if (rule.sexNot && p.sex && rule.sexNot.includes(p.sex)) return false;
  return true;
}

// Red flags are checked after every answer and outrank everything.
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

// How much a question is expected to narrow things down, in bits.
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

// The wording to put on screen.
export function promptFor(question, session) {
  return typeof question.prompt === 'function'
    ? question.prompt(session)
    : question.prompt;
}

// Is this question worth asking given what is already known?
function applicable(question, session) {
  if (session.answers[question.id] != null) return false;
  if (session.skipped?.includes(question.id)) return false;
  if (question.needs && !matches(question.needs, session)) return false;
  return true;
}

// Set a question aside without answering it.
export function skipQuestion(session, questionId) {
  if (!questionId || session.skipped?.includes(questionId)) return session;
  return { ...session, skipped: [...(session.skipped ?? []), questionId] };
}

// Pick the next question, or null when the session should resolve.
export function nextQuestion(session, bank, { force = false } = {}) {
  const pool = bank.questions.filter(q => applicable(q, session));
  if (!pool.length) return null;

  // Screening questions carry red flag findings.
  const screening = pool.filter(q => q.screening).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (screening.length) return screening[0];

  const budget = bank.maxQuestions ?? 9;
  if (session.asked.length >= budget) return null;

  // The last slots belong to whatever a red flag still needs.
  const pending = pendingFlagInputs(session, bank, pool);
  if (pending.length && budget - session.asked.length <= pending.length) {
    return bestBy(pending, session, bank);
  }

  // Screening questions rule things out but rarely separate the leaders.
  const screeningIds = new Set(bank.questions.filter(q => q.screening).map(q => q.id));
  const discriminating = session.asked.filter(id => !screeningIds.has(id)).length;

  // `force` comes from the result screen asking for more questions.
  const top = ranked(session, bank);
  if (!force && !pending.length && discriminating >= 3 && top.length > 1
      && top[0].score > 0.40 && top[0].score - top[1].score > 0.18) {
    return null;
  }

  const best = bestBy(pool, session, bank);
  // Nothing left worth asking.
  if (!force && !pending.length && infoGain(best, session, bank) < 0.06) return null;
  return best;
}

// The question expected to narrow things down most, of those given.
function bestBy(questions, session, bank) {
  let best = questions[0], bestScore = -1;
  for (const q of questions) {
    const s = infoGain(q, session, bank);
    if (s > bestScore) { bestScore = s; best = q; }
  }
  return best;
}

// Questions a red flag depends on that nobody has answered yet.
function pendingFlagInputs(session, bank, pool) {
  const needed = new Set();
  for (const f of bank.redFlags) {
    for (const qid of Object.keys({ ...(f.answers ?? {}), ...(f.anyAnswer ?? {}) })) {
      if (session.answers[qid] == null) needed.add(qid);
    }
  }
  return pool.filter(q => needed.has(q.id));
}

// Record an answer and fold it into the candidate scores.
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

// Undo the most recent answer.
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

// Turn the session into a renderable result.
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

// Two to four plain lines naming the answers that did the most work.
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

// Are there questions left that have not been asked?
export function hasMoreQuestions(session, bank) {
  return Boolean(nextQuestion(session, bank, { force: true }));
}

// Progress for the meter.
export function progress(session, bank) {
  const target = bank.typicalQuestions ?? 7;
  return clamp(session.asked.length / target, 0, 1);
}
