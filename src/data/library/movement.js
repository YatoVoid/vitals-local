/* Movement, training, sleep and stress.
 *
 * Written against physical activity guidelines and exercise science that has
 * replicated. Where gym advice is folklore, that is said plainly.
 */

export const MOVEMENT = [
  {
    id: 'how-much-exercise',
    title: 'How much movement actually changes anything',
    category: 'Movement',
    tags: ['exercise', 'steps', 'walking', 'cardio', 'guidelines', 'sedentary'],
    summary: 'The largest gains come from going from nothing to something. '
           + 'After that the curve flattens fast.',
    basis: 'Physical activity guidelines and dose response meta-analyses of '
         + 'activity against mortality.',
    sections: [
      ['The guideline numbers',
        'Between 150 and 300 minutes a week of moderate activity, or half that '
        + 'if vigorous, plus strength work twice a week. Moderate means you can '
        + 'talk but not sing. Those numbers are a target, not a threshold.'],
      ['Where the benefit actually sits',
        'The dose response curve is steepest at the bottom. Going from '
        + 'sedentary to about 75 minutes a week captures roughly half the '
        + 'mortality benefit available. Going from 300 to 600 minutes adds very '
        + 'little. If you do nothing, a short walk most days is the single '
        + 'highest value change available to you.'],
      ['The step count',
        'Ten thousand steps came from a 1960s pedometer marketing campaign in '
        + 'Japan, not from research. When it was studied later, benefit rose '
        + 'steeply to about 7,000 to 8,000 steps and flattened after. In older '
        + 'adults the plateau arrives closer to 6,000.'],
      ['Sitting',
        'Long uninterrupted sitting is associated with worse outcomes partly '
        + 'independently of exercise, though high activity offsets much of it. '
        + 'Breaking up sitting every half hour or so is the practical version, '
        + 'and it does not require a standing desk.'],
    ],
  },
  {
    id: 'strength',
    title: 'Strength training, what actually drives it',
    category: 'Movement',
    tags: ['strength', 'gym', 'muscle', 'hypertrophy', 'reps', 'sets', 'failure'],
    summary: 'Total hard sets and progressive load do the work. Most arguments '
           + 'online are about variables that barely move the outcome.',
    basis: 'Meta-analyses of resistance training volume, frequency, load and '
         + 'proximity to failure.',
    sections: [
      ['The variables that matter',
        'Doing enough hard sets per muscle per week, and adding load or reps '
        + 'over time. Around 10 or more sets per muscle per week produces more '
        + 'growth than fewer, with returns diminishing somewhere past 20. That '
        + 'is most of what determines the result.'],
      ['The variables that matter less than claimed',
        'Rep range: anywhere from about 5 to 30 reps builds similar muscle if '
        + 'sets are taken close to failure. Frequency: same weekly volume split '
        + 'over two days or four gives similar results. Exercise order, machine '
        + 'versus free weight, and tempo all have small effects compared with '
        + 'volume and progression.'],
      ['Training to failure',
        'You do not need to reach failure on every set. Stopping one to three '
        + 'reps short produces similar growth with less fatigue, which lets you '
        + 'do more total work across the week. That trade usually wins.'],
      ['Soreness is not the scoreboard',
        'Delayed soreness reflects novelty and eccentric load, not how much you '
        + 'grew. Trained muscles get sore less often while continuing to '
        + 'improve. Chasing soreness leads to constantly changing programmes, '
        + 'which is the opposite of progressive overload.'],
      ['Rest between sets',
        'Two to three minutes for heavy compound work beats one minute for '
        + 'both strength and size, because it lets you keep the load up. The '
        + 'short rest tradition came from a misreading of hormone response '
        + 'studies, and the hormone response turned out not to predict growth.'],
    ],
  },
  {
    id: 'stretching',
    title: 'Stretching, warming up, and injury',
    category: 'Movement',
    tags: ['stretching', 'warm up', 'flexibility', 'injury', 'mobility', 'foam roller'],
    summary: 'Static stretching before training does not prevent injury and '
           + 'briefly reduces power. Warming up does help.',
    basis: 'Randomised trials and meta-analyses of stretching and warm up '
         + 'protocols against injury and performance.',
    sections: [
      ['Static stretching before sport',
        'Repeated trials have found no meaningful reduction in injury from '
        + 'static stretching before activity. Held over about 60 seconds it '
        + 'temporarily reduces force and power output. That effect is small '
        + 'and short lived, but the injury benefit that would justify it is '
        + 'simply not there.'],
      ['What does reduce injury',
        'Progressive strength work, particularly eccentric loading for muscles '
        + 'that get strained, has the best evidence. Structured neuromuscular '
        + 'warm up programmes reduce injury in team sports substantially. '
        + 'Gradually increasing training load rather than jumping it matters '
        + 'more than any single exercise.'],
      ['A warm up that works',
        'Raise the heart rate, move the joints through the range you are about '
        + 'to use, then do lighter versions of the actual movement. Five to ten '
        + 'minutes. That is the whole recipe.'],
      ['Foam rolling',
        'Improves range of motion briefly and reduces perceived soreness '
        + 'modestly. It does not break down scar tissue or release fascia in '
        + 'any way that has been demonstrated. Harmless, mildly useful, '
        + 'oversold.'],
    ],
  },
  {
    id: 'fat-loss-training',
    title: 'Training for fat loss, and spot reduction',
    category: 'Movement',
    tags: ['fat loss', 'abs', 'spot reduction', 'cardio', 'hiit', 'belly fat'],
    summary: 'You cannot choose where fat comes off. Exercise helps mainly by '
           + 'preserving muscle and supporting adherence.',
    basis: 'Trials of localised training on regional fat, and diet plus '
         + 'exercise weight loss trials.',
    sections: [
      ['Spot reduction does not happen',
        'Studies training one limb, or the abdominal muscles specifically, and '
        + 'measuring fat with imaging, consistently find no preferential loss '
        + 'in the trained area. Fat is mobilised systemically. Where you lose '
        + 'it first is largely genetic and hormonal.'],
      ['What abdominal training does',
        'It builds the muscle underneath. Whether that muscle is visible is '
        + 'decided by the fat layer above it, which is decided by overall '
        + 'energy balance. Both matter, but only one of them is affected by '
        + 'crunches.'],
      ['Exercise alone is a weak weight loss tool',
        'Trials of exercise without dietary change produce modest weight loss, '
        + 'because appetite and unconscious activity partly compensate. That is '
        + 'not an argument against exercising. It is an argument against '
        + 'expecting the scale to be the measure of whether it worked.'],
      ['Where exercise earns its place',
        'Preserving muscle during a deficit, which changes what you look like '
        + 'at the same weight. Improving heart and metabolic health '
        + 'independently of weight. And predicting who keeps weight off years '
        + 'later, where it is one of the strongest factors.'],
      ['Intervals versus steady state',
        'Interval training gets similar results in less time, at the cost of '
        + 'being harder and needing more recovery. Neither is magic. The one '
        + 'you will keep doing three times a week beats the optimal one you '
        + 'abandon.'],
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep, and what actually improves it',
    category: 'Mind and sleep',
    tags: ['sleep', 'insomnia', 'melatonin', 'screens', 'blue light', 'caffeine'],
    summary: 'Behavioural treatment beats sleeping tablets for long term '
           + 'insomnia, and most sleep advice online targets the wrong thing.',
    basis: 'Guideline positions recommending cognitive behavioural therapy for '
         + 'insomnia as first line, and controlled studies of sleep hygiene '
         + 'measures.',
    sections: [
      ['The first line treatment',
        'For persistent insomnia, cognitive behavioural therapy for insomnia '
        + 'outperforms sleeping tablets over the long term and is recommended '
        + 'first by every major guideline. It works through restricting time in '
        + 'bed, fixing the wake time, and changing what you do when you cannot '
        + 'sleep. It is available as self guided programmes.'],
      ['The single most effective habit',
        'A fixed wake time, every day, including weekends. It anchors the whole '
        + 'rhythm. Going to bed earlier when you are not sleepy tends to make '
        + 'insomnia worse by teaching you to lie awake in bed.'],
      ['Caffeine timing',
        'Caffeine has a half life around five hours, longer in some people and '
        + 'much longer with certain medications. An afternoon coffee still has '
        + 'a quarter of its dose in you at bedtime. It reduces deep sleep even '
        + 'when it does not stop you falling asleep.'],
      ['Blue light, in proportion',
        'Light does shift the body clock, and evening light delays it. The '
        + 'effect of a phone screen at typical brightness is smaller than the '
        + 'effect of what you are doing on the phone. Blue blocking glasses '
        + 'have produced inconsistent results. Dimming the room helps more.'],
      ['Melatonin is not a sleeping pill',
        'It is a timing signal, most useful for jet lag and delayed sleep '
        + 'phase, taken in small amounts several hours before the target sleep '
        + 'time. Taken as a large dose at bedtime it does very little for '
        + 'ordinary insomnia, which is how most people use it.'],
      ['Alcohol',
        'It shortens the time to fall asleep and wrecks the second half of the '
        + 'night, suppressing REM and causing early waking. It is one of the '
        + 'most common reasons for unrefreshing sleep in people who think they '
        + 'sleep fine.'],
    ],
  },
  {
    id: 'stress',
    title: 'Stress, cortisol, and what is actually measurable',
    category: 'Mind and sleep',
    tags: ['stress', 'cortisol', 'anxiety', 'burnout', 'adrenal fatigue', 'breathing'],
    summary: 'Chronic stress has real physical effects. Most of what is sold '
           + 'to measure or fix cortisol is not measuring anything useful.',
    basis: 'Endocrine society positions on adrenal function and trials of '
         + 'stress reduction interventions.',
    sections: [
      ['What stress does that is real',
        'Sustained stress affects sleep, blood pressure, appetite, immune '
        + 'response and pain perception. Those are measurable and matter. The '
        + 'mechanism involves cortisol among many other things.'],
      ['Adrenal fatigue is not a diagnosis',
        'The idea that ordinary stress exhausts the adrenal glands has been '
        + 'examined and rejected by endocrine bodies. A systematic review of '
        + 'the studies claiming to show it found the methods could not support '
        + 'the conclusion. Genuine adrenal insufficiency exists, is serious, '
        + 'and is diagnosed with specific tests rather than a symptom checklist.'],
      ['Saliva cortisol panels',
        'Sold widely and rarely useful. Cortisol swings enormously through the '
        + 'day and with any acute stress, including the stress of doing the '
        + 'test. Single measurements outside a specific clinical question tell '
        + 'you very little.'],
      ['What does help, with evidence',
        'Regular aerobic exercise. Structured relaxation and mindfulness '
        + 'programmes, with small to moderate effects that are real but oversold. '
        + 'Slow breathing with a longer out breath than in breath, which shifts '
        + 'autonomic balance measurably within minutes. Sorting out sleep, '
        + 'which is often both a cause and a consequence.'],
      ['When it is not just stress',
        'Persistent low mood, loss of interest, or anxiety that stops you doing '
        + 'things is treatable and worth naming rather than managing alone. '
        + 'Attributing everything to stress delays that.'],
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery: ice baths, saunas, and rest days',
    category: 'Movement',
    tags: ['recovery', 'ice bath', 'cold plunge', 'sauna', 'rest day', 'doms', 'massage'],
    summary: 'Cold after training blunts some of the adaptation you trained for. '
           + 'Heat looks better than cold on current evidence.',
    basis: 'Trials measuring muscle adaptation after post exercise cold water '
         + 'immersion, and cohort data on sauna use.',
    sections: [
      ['Cold water after strength training',
        'Several controlled studies found that regular cold water immersion '
        + 'straight after resistance training reduced gains in muscle size and '
        + 'strength compared with the same training without it. The cold blunts '
        + 'the inflammatory signalling that drives adaptation. If you are '
        + 'training to get stronger, that is working against you.'],
      ['When cold does make sense',
        'When recovering fast matters more than adapting: a tournament with '
        + 'games hours apart, or a training camp where you have to perform '
        + 'again tomorrow. It reduces soreness and perceived fatigue reliably. '
        + 'That is a real use with a real trade off.'],
      ['Sauna',
        'Observational data, mostly from Finland, associates frequent sauna use '
        + 'with lower cardiovascular death, with a dose response. Observational '
        + 'means confounding is possible. Mechanistically it resembles mild '
        + 'cardiovascular exercise, which is plausible rather than proven.'],
      ['Rest days',
        'Adaptation happens between sessions, not during them. Training a sore '
        + 'muscle group again immediately does not make it grow faster. Most '
        + 'people undertrain rather than overtrain, but the ones who overtrain '
        + 'tend to be the ones reading about recovery.'],
      ['Massage',
        'Reduces soreness and feels good. Does not flush lactate, which clears '
        + 'within an hour on its own and was never the cause of soreness '
        + 'anyway. Enjoy it for what it is.'],
    ],
  },
];
