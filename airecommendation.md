# AI Intent & UI Recommendations

This document outlines deterministic intent handling (Track A) and button/form-first UX (Track B), plus ready-to-paste code skeletons for detectors, clarifications, and UI hints. No code was modified yet; this is a drop-in guide.

## Track A: Deterministic Intent Handling
- Detection order: regex/keyword (per screen) -> structured prefixes -> fuzzy/LLM. If low confidence, disambiguate with 2-3 options.
- Small talk: detect and reply briefly; never call tools.
- Slot guardrails: if required slots are missing, ask a one-line clarification and stop.
- State changes: save/update/delete/schedule require confirmation.
- Disambiguation: when multiple intents fit, ask a single question with 2 buttons.

### Regex/Verb Maps (use lowercase normalization)
- Workout
  - CREATE: `create|make|build (workout|plan|program)`, `ppl|push|pull|legs|upper|lower|full body`, `hypertrophy|strength|endurance|power`
  - START: `start|begin|run (workout|session|today's plan|current plan)`
  - LOG SET: `(log|record|add) set`, `([a-z ]+)\s+\d+\s*(x|by)\s*\d+` (e.g., bench 185x5)
  - 1RM: `1rm|one rep max|percent of 1rm|% of 1rm|training max`
  - PROGRAM: `program|block|cycle`, `(\d+)\s*(weeks?|wk)`, `(\d+)\s*(days?|sessions?)\/?week`
- Nutrition
  - LOG MEAL: `(log|track|add) (meal|breakfast|lunch|dinner|snack)`, `\d+\s*cal`, `\d+\s*p`, `\d+\s*c`, `\d+\s*f`
  - STATUS: `(calories|cal|protein|macros).*(left|remaining|today|so far)`
  - MACROS: `(set|calc|calculate|recalc) (macros|targets?)`, `cut|loss|lean|recomp|bulk|gain`
  - RECIPE: `recipe|meal idea|what can I eat|cook`, `\d+\s*cal`, `\d+\s*p`, `vegan|vegetarian|keto|paleo|no [a-z]+`
- Progress
  - SUMMARY: `progress|trend|history|prs?|personal record`
  - VOLUME/DELOAD: `volume|sets|deload|fatigue` plus muscle group words
- Program
  - CREATE: `program|block|cycle`, `(\d+)\s*(weeks?|wk)`, `(\d+)\s*(days?|sessions?)\/?week`, `cut|bulk|strength|hypertrophy|power`
- Navigation
  - NAVIGATE: `open|go to|show (workouts|nutrition|progress|recipes|home)`
- Small talk: `hi|hello|hey|thanks|thank you|lol|haha|who are you`

### Required Slots (per intent)
- Workout: create (split, goal, days/week; equipment optional); start (which plan, default today); log set (exercise, weight, reps; RPE optional); 1RM (exercise, weight, reps or percent); program (goal, days/week; weeks optional).
- Nutrition: log meal (meal type, calories, protein; carbs/fat optional); status (none, default today); macros (goal, weight; activity optional); recipe (calories; protein/diet optional).
- Progress: summary (none required); volume/deload (muscle group; weeks optional).
- Program: create (goal, days/week; weeks optional).

### Clarifications (one-liners)
- Workout create: "Create a workout—pick a split?"
- Workout start: "Start workout—use today’s plan?"
- Log set: "Log set—give exercise and weight x reps (e.g., squat 225x5)."
- 1RM: "1RM calc—what weight x reps?"
- Log meal: "Log meal—calories and protein?"
- Macros: "Macro calc—goal?"
- Recipe: "Recipe target calories?"
- Progress: "Progress for which exercise?"
- Volume: "Check volume for which muscle?"

### Disambiguations (2 buttons)
- Start vs create: "Start today’s workout or create a new plan?" -> [Start today, Create plan]
- Log vs recipe: "Log a meal or get a recipe?" -> [Log meal, Recipe]
- Progress vs volume: "Show PRs/trends or check volume/deload?" -> [Progress, Volume/Deload]
- Meal numbers: "How many calories/protein?" -> [350 cal 25p, 600 cal 40p]

### State-Change Confirmations
- Save plan? [Save, Cancel]
- Schedule workout? [Yes, schedule, No]
- Overwrite existing plan? [Overwrite, Keep existing]
- Delete entry? [Delete, Cancel]

### System Prompt Fragment
Use only supported intents. If unsure, ask one clarifying question with 2-3 options (buttons). If required data is missing (exercise, weight x reps, meal calories/protein, split), ask briefly and wait. Small talk/greetings -> short reply, no tools. State changes (save/update/delete/schedule) require explicit confirmation. If multiple intents fit, ask one-line disambiguation with 2 buttons. Answer briefly when not calling tools.

### Few-Shot Examples
create push/pull/legs hypertrophy 4x dumbbells -> create workout (PPL, hypertrophy, 4d, dumbbells)
start today’s workout -> start workout (today)
log set bench 185x5 -> log set (bench, 185, 5)
log meal lunch 620 cal 45p -> log meal (lunch, 620, 45p)
calories left today -> nutrition status (today)
recipe 600 cal 45p no nuts -> recipe (600 cal, 45p, exclude nuts)
progress last 4 weeks bench -> progress summary (bench, 4w)
deload status chest last 3 weeks -> volume/deload (chest, 3w)
open progress -> navigate ProgressScreen

### Detector Skeleton Pattern (repeat per domain)
function detectIntent(text, screen) {
  const matches = [];
  const check = (intent, regexes, slotsRequired) => {
    if (!regexes.some(r => r.test(text))) return;
    matches.push({ intent, confidence: score(intent, text, screen), slotsMissing: missingSlots(intent, slotsRequired, text) });
  };
  // run checks...
  if (!matches.length) return null;
  matches.sort((a, b) => b.confidence - a.confidence);
  const top = matches[0];
  if (matches[1] && Math.abs(matches[0].confidence - matches[1].confidence) < 0.15) {
    return { intent: 'DISAMBIGUATE', data: DISAMBIGUATIONS.SOME_CASE };
  }
  if (top.slotsMissing.length) {
    return { intent: 'ASK_CLARIFICATION', prompt: clarifyFor(top.intent), options: suggestFor(top.intent) };
  }
  return top;
}

## Track B: Button/Form-First UX
- Per-screen primary buttons (3-5):
  - Workout: Start today’s workout; Create workout (Push/Pull/Legs); Log set; 1RM/percent calc.
  - Nutrition: Log meal (BF/L/D); Calories/Protein left; Calculate macros; Suggest recipe.
  - Progress: Show progress (exercise); Volume check (muscle); Deload check.
- Inline quick replies (chips):
  - Workout: "Start today", "Create push workout", "Log set bench 185x5", "1RM squat 275x5", "Percent 1RM 315 @75%"
  - Nutrition: "Log lunch 600 cal 40p", "Calories left today", "Recipe 600 cal 45p no nuts", "Set macros cut 180lb"
  - Progress: "Progress bench 4 weeks", "Volume chest 3 weeks", "Deload check legs"
- Global chat placeholders: "/workout create push hypertrophy 4x", "log meal lunch 620 cal 45p", "recipe 600 cal 45p no nuts", "open progress".
- Progressive disclosure: after Create Workout, chips/dropdowns for split, goal, days/week, equipment; defaults prefilled.
- Confirmation buttons: save/schedule/overwrite/delete always gated by yes/no buttons.

## Quick-Reply/Hint Arrays (use in UI configs)
export const WORKOUT_QUICK_REPLIES = [
  'Start today',
  'Create push workout',
  'Log set bench 185x5',
  '1RM squat 275x5',
  'Percent 1RM 315 @75%',
];

export const NUTRITION_QUICK_REPLIES = [
  'Log lunch 600 cal 40p',
  'Calories left today',
  'Recipe 600 cal 45p no nuts',
  'Set macros cut 180lb',
];

export const PROGRESS_QUICK_REPLIES = [
  'Progress bench 4 weeks',
  'Volume chest 3 weeks',
  'Deload check legs',
];

export const CHAT_PLACEHOLDER_HINTS = [
  'Try: /workout create push hypertrophy 4x',
  'Try: log meal lunch 620 cal 45p',
  'Try: recipe 600 cal 45p no nuts',
  'Try: open progress',
];

## Confirmation Prompts
export const CONFIRMATIONS = {
  SAVE_PLAN: { prompt: 'Save this plan?', options: ['Save', 'Cancel'] },
  SCHEDULE: { prompt: 'Schedule this workout?', options: ['Yes, schedule', 'No'] },
  OVERWRITE: { prompt: 'Overwrite existing plan?', options: ['Overwrite', 'Keep existing'] },
  DELETE: { prompt: 'Delete entry?', options: ['Delete', 'Cancel'] },
};

## Decision Flow (router pseudo)
routeIntent(text, screen):
  if smallTalk(text): return SMALL_TALK
  for detector in [workout, nutrition, progress, recipe, program, nav]:
    res = detector(text, screen)
    if res:
      if res.intent === DISAMBIGUATE: ask res.data.prompt + buttons
      else if res.intent === ASK_CLARIFICATION: ask prompt + buttons
      else: execute or confirm if state-changing
      return
  // fallback: offer top 3 screen actions as buttons

## Per-Domain Detector Skeletons (ready to adapt)

### Progress Detector
function detectProgressIntent(normalizedText, screen) {
  const matches = [];
  const check = (intent, regexes, slotsRequired) => {
    if (!regexes.some(r => r.test(normalizedText))) return;
    matches.push({ intent, confidence: score(intent, normalizedText, screen), slotsMissing: missingSlots(intent, slotsRequired, normalizedText) });
  };

  check('PROGRESS_SUMMARY', PROGRESS_VERBS.SUMMARY, PROGRESS_SLOTS_REQUIRED.SUMMARY);
  check('VOLUME_DELOAD', PROGRESS_VERBS.VOLUME_DELOAD, PROGRESS_SLOTS_REQUIRED.VOLUME_DELOAD);

  if (!matches.length) return null;
  matches.sort((a, b) => b.confidence - a.confidence);
  const top = matches[0];

  if (matches[1] && Math.abs(matches[0].confidence - matches[1].confidence) < 0.15) {
    return { intent: 'DISAMBIGUATE', data: DISAMBIGUATIONS.PROGRESS_VS_VOLUME };
  }

  if (top.slotsMissing.length) {
    const prompt = top.intent === 'VOLUME_DELOAD' ? SLOT_CLARIFICATIONS.VOLUME_MUSCLE : SLOT_CLARIFICATIONS.PROGRESS_EX;
    const options = top.intent === 'VOLUME_DELOAD' ? ['Chest', 'Back', 'Legs'] : ['Bench', 'Squat', 'Deadlift'];
    return { intent: 'ASK_CLARIFICATION', prompt, options };
  }

  return { intent: top.intent, slotsMissing: [], confidence: top.confidence };
}

function score(intent, text, screen) {
  let s = 0.5;
  if (screen === 'ProgressScreen') s += 0.1;
  if (/deload|volume/i.test(text) && intent === 'VOLUME_DELOAD') s += 0.2;
  if (/pr|progress|trend/i.test(text) && intent === 'PROGRESS_SUMMARY') s += 0.2;
  return Math.min(s, 1);
}

function missingSlots(intent, required, text) {
  const missing = [];
  const has = (pat) => pat.test(text);
  if (intent === 'VOLUME_DELOAD') {
    if (!has(/chest|back|legs?|arms?|shoulders?|glutes|quads|hamstrings|biceps|triceps/i)) missing.push('muscleGroup');
  }
  return missing;
}

### Recipe Detector
function detectRecipeIntent(normalizedText, screen) {
  const matches = [];
  const check = (intent, regexes, slotsRequired) => {
    if (!regexes.some(r => r.test(normalizedText))) return;
    matches.push({ intent, confidence: score(intent, normalizedText, screen), slotsMissing: missingSlots(intent, slotsRequired, normalizedText) });
  };

  check('RECIPE_GENERATE', RECIPE_VERBS.GENERATE, RECIPE_SLOTS_REQUIRED.GENERATE);

  if (!matches.length) return null;
  const top = matches.sort((a, b) => b.confidence - a.confidence)[0];

  if (top.slotsMissing.length) {
    return { intent: 'ASK_CLARIFICATION', prompt: SLOT_CLARIFICATIONS.RECIPE_CAL, options: ['450 cal', '600 cal', '800 cal'] };
  }

  return { intent: top.intent, slotsMissing: [], confidence: top.confidence };
}

function score(intent, text, screen) {
  let s = 0.5;
  if (/recipe|cook|meal idea/i.test(text)) s += 0.2;
  if (screen === 'NutritionScreen') s += 0.1;
  return Math.min(s, 1);
}

function missingSlots(intent, required, text) {
  const missing = [];
  if (!/\d+\s*cal/i.test(text)) missing.push('calories');
  return missing;
}

### Program Detector
function detectProgramIntent(normalizedText, screen) {
  const matches = [];
  const check = (intent, regexes, slotsRequired) => {
    if (!regexes.some(r => r.test(normalizedText))) return;
    matches.push({ intent, confidence: score(intent, normalizedText, screen), slotsMissing: missingSlots(intent, slotsRequired, normalizedText) });
  };

  check('PROGRAM_CREATE', PROGRAM_VERBS.CREATE, PROGRAM_SLOTS_REQUIRED.CREATE);

  if (!matches.length) return null;
  const top = matches.sort((a, b) => b.confidence - a.confidence)[0];

  if (top.slotsMissing.length) {
    return { intent: 'ASK_CLARIFICATION', prompt: 'Program goal or days/week?', options: ['Strength 4x', 'Hypertrophy 5x', 'Cut 3x'] };
  }

  return { intent: top.intent, slotsMissing: [], confidence: top.confidence };
}

function score(intent, text, screen) {
  let s = 0.5;
  if (/program|block|cycle/i.test(text)) s += 0.2;
  if (screen === 'WorkoutScreen') s += 0.1;
  return Math.min(s, 1);
}

function missingSlots(intent, required, text) {
  const missing = [];
  if (!/cut|bulk|strength|hypertrophy|power/i.test(text)) missing.push('goal');
  if (!/\d+\s*(days?|sessions?)\/?week/i.test(text)) missing.push('daysPerWeek');
  return missing;
}

### Navigation Detector
function detectNavigationIntent(normalizedText, screen) {
  const hit = NAV_VERBS.NAVIGATE.some(r => r.test(normalizedText));
  if (!hit) return null;
  return { intent: 'NAVIGATE', confidence: 0.9, slotsMissing: [] };
}

## What to implement next (minimal effort, biggest gain)
1) Add the regex maps and slot checks per intent file; return ASK_CLARIFICATION/DISAMBIGUATE before tool calls.
2) Drop the system prompt fragment and few-shots into buildSystemPrompt.
3) Add the quick-reply chips and chat placeholders per screen.
4) Gate state-changing tools with confirmation prompts above.
5) Log intent decisions, missing slots, and disambiguations to refine regex lists weekly.
