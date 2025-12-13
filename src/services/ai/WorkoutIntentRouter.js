/**
 * WorkoutIntentRouter - Deterministic Intent Detection
 *
 * This replaces LLM-based intent detection for common workout actions.
 * Uses regex/keyword matching for speed and reliability.
 *
 * Flow:
 * 1. Regex detection (instant, free)
 * 2. Slot validation (check for required data)
 * 3. Disambiguation (if multiple intents match)
 * 4. LLM fallback (only if needed)
 */

// Intent constants
export const INTENTS = {
  // Workout intents
  CREATE_WORKOUT: 'CREATE_WORKOUT',
  START_WORKOUT: 'START_WORKOUT',
  LOG_SET: 'LOG_SET',
  CALCULATE_1RM: 'CALCULATE_1RM',
  CALCULATE_PERCENT: 'CALCULATE_PERCENT',
  CREATE_PROGRAM: 'CREATE_PROGRAM',

  // Meta intents
  DISAMBIGUATE: 'DISAMBIGUATE',
  ASK_CLARIFICATION: 'ASK_CLARIFICATION',
  SMALL_TALK: 'SMALL_TALK',
  UNKNOWN: 'UNKNOWN',
};

// Regex patterns for each intent
const PATTERNS = {
  CREATE_WORKOUT: [
    /\b(create|make|build|generate|give me)\b.*\b(workout|plan|routine)\b/i,
    /\b(push|pull|legs?|upper|lower|full\s*body|chest|back|arms?|shoulders?)\b.*\b(workout|day|session)\b/i,
    /\b(workout|day|session)\b.*\b(push|pull|legs?|upper|lower|full\s*body|chest|back|arms?|shoulders?)\b/i,
    /^(push|pull|legs?|upper|lower|full\s*body|ppl)\s*(workout|day)?$/i, // Button presses
    /\b(hypertrophy|strength|power|endurance)\b.*\b(workout|plan)\b/i,
  ],

  START_WORKOUT: [
    /\b(start|begin|run|do)\b.*\b(workout|session|plan|today'?s?)\b/i,
    /\bstart\s+(today'?s?|my|the)\s+(workout|plan|session)\b/i,
    /\b(let'?s?|ready\s+to)\s+(work\s*out|train|lift)\b/i,
    /^start\s*(today)?$/i,
  ],

  LOG_SET: [
    /\b(log|record|add|did)\b.*\b(set|rep|lift)\b/i,
    /\b([a-z\s]+)\s+(\d+)\s*(x|×|by)\s*(\d+)/i, // "bench 185x5"
    /\b(\d+)\s*(x|×|by)\s*(\d+)\b.*\b([a-z\s]+)/i, // "185x5 bench"
    /\bjust\s+(did|finished|completed)\b/i,
  ],

  CALCULATE_1RM: [
    /\b(1rm|one\s*rep\s*max|max\s*out|training\s*max)\b/i,
    /\b(what'?s?|calculate|estimate)\b.*\b(max|1rm)\b/i,
    /\bmax\b.*\b(\d+)\s*(x|×|by)\s*(\d+)/i,
  ],

  CALCULATE_PERCENT: [
    /\b(\d+)\s*%\s*(of)?\s*(1rm|max)?\b/i,
    /\bpercent(age)?\s*(of)?\s*(1rm|max)?\b/i,
    /\b(what'?s?|calculate)\b.*\b(\d+)\s*%/i,
  ],

  CREATE_PROGRAM: [
    /\b(create|make|build|generate)\b.*\b(program|block|cycle|split)\b/i,
    /\b(\d+)\s*(week|wk)\b.*\b(program|block|cycle)\b/i,
    /\b(program|block|cycle)\b.*\b(\d+)\s*(week|wk)\b/i,
  ],

  SMALL_TALK: [
    /^(hi|hello|hey|yo|sup|what'?s?\s*up)\b/i,
    /^(thanks?|thank\s*you|thx|ty)\b/i,
    /^(lol|haha|nice|cool|great|awesome)\b/i,
    /\b(who\s*are\s*you|what\s*can\s*you\s*do)\b/i,
  ],
};

// Required slots for each intent
const REQUIRED_SLOTS = {
  CREATE_WORKOUT: ['split'], // Need at least a split/muscle group
  START_WORKOUT: [], // Can default to today
  LOG_SET: ['exercise', 'weight', 'reps'],
  CALCULATE_1RM: ['weight', 'reps'],
  CALCULATE_PERCENT: ['percentage', 'oneRepMax'],
  CREATE_PROGRAM: ['goal', 'daysPerWeek'],
};

// Slot extraction patterns
const SLOT_EXTRACTORS = {
  split: /\b(push|pull|legs?|upper|lower|full\s*body|chest|back|arms?|shoulders?|ppl)\b/i,
  goal: /\b(hypertrophy|strength|power|endurance|muscle|mass|bulk|cut|lean)\b/i,
  weight: /\b(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?)?\s*(?:x|×|by)/i,
  reps: /(?:x|×|by)\s*(\d+)/i,
  exercise: /\b(bench\s*press?|squat|deadlift|overhead\s*press|ohp|row|curl|press|pull[\s-]?up|dip|lunge|rdl)\b/i,
  percentage: /\b(\d+)\s*%/,
  daysPerWeek: /\b(\d)\s*(?:days?|x|times?)\s*(?:per|\/|a)?\s*week/i,
  weeks: /\b(\d+)\s*(?:week|wk)s?\b/i,
};

// Clarification prompts
const CLARIFICATIONS = {
  CREATE_WORKOUT: {
    prompt: 'What type of workout?',
    options: ['Push', 'Pull', 'Legs', 'Upper Body', 'Full Body'],
  },
  LOG_SET: {
    prompt: 'Log set - give exercise and weight×reps',
    placeholder: 'e.g., bench 185x5',
    options: ['Bench 185×5', 'Squat 225×5', 'Deadlift 275×5'],
  },
  CALCULATE_1RM: {
    prompt: '1RM calc - what weight×reps?',
    placeholder: 'e.g., 225x5',
    options: ['185×8', '225×5', '275×3'],
  },
  CREATE_PROGRAM: {
    prompt: 'Program details?',
    options: ['Strength 4×/week', 'Hypertrophy 5×/week', 'PPL 6×/week'],
  },
};

// Disambiguation options
const DISAMBIGUATIONS = {
  START_VS_CREATE: {
    prompt: 'Start workout or create new?',
    options: [
      { label: 'Start Today\'s Plan', intent: INTENTS.START_WORKOUT, data: { which: 'today' } },
      { label: 'Create New Workout', intent: INTENTS.CREATE_WORKOUT },
    ],
  },
};

// Small talk responses (no AI needed)
const SMALL_TALK_RESPONSES = [
  "Hey! Ready to work out? 💪",
  "What's up! Hit a button above to get started.",
  "I'm your workout assistant. Tap an action to begin!",
  "You're welcome! Keep crushing it! 🔥",
];

/**
 * Extract slots from text
 */
function extractSlots(text) {
  const slots = {};

  // Extract each slot type
  for (const [slotName, pattern] of Object.entries(SLOT_EXTRACTORS)) {
    const match = text.match(pattern);
    if (match) {
      slots[slotName] = match[1].toLowerCase().trim();
    }
  }

  // Special handling for weight×reps pattern
  const weightRepsMatch = text.match(/(\d+(?:\.\d+)?)\s*(x|×|by)\s*(\d+)/i);
  if (weightRepsMatch) {
    slots.weight = weightRepsMatch[1];
    slots.reps = weightRepsMatch[3];
  }

  // Special handling for exercise name before/after weight
  const exerciseBeforeWeight = text.match(/\b([a-z]+(?:\s+[a-z]+)?)\s+\d+\s*(x|×)/i);
  const exerciseAfterWeight = text.match(/\d+\s*(x|×)\s*\d+\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (exerciseBeforeWeight && !slots.exercise) {
    const potentialExercise = exerciseBeforeWeight[1].toLowerCase();
    if (isValidExercise(potentialExercise)) {
      slots.exercise = potentialExercise;
    }
  }
  if (exerciseAfterWeight && !slots.exercise) {
    const potentialExercise = exerciseAfterWeight[2].toLowerCase();
    if (isValidExercise(potentialExercise)) {
      slots.exercise = potentialExercise;
    }
  }

  return slots;
}

/**
 * Check if a word is a valid exercise name
 */
function isValidExercise(word) {
  const exercises = [
    'bench', 'bench press', 'squat', 'deadlift', 'overhead press', 'ohp',
    'row', 'barbell row', 'curl', 'press', 'pull up', 'pullup', 'dip',
    'lunge', 'rdl', 'leg press', 'lat pulldown', 'cable', 'fly', 'raise',
  ];
  return exercises.some(ex => word.includes(ex) || ex.includes(word));
}

/**
 * Check for missing required slots
 */
function getMissingSlots(intent, slots) {
  const required = REQUIRED_SLOTS[intent] || [];
  return required.filter(slot => !slots[slot]);
}

/**
 * Calculate confidence score
 */
function calculateConfidence(intent, text, screen, slots) {
  let score = 0.5;

  // Boost if on relevant screen
  if (screen === 'WorkoutScreen') score += 0.1;

  // Boost if slots are filled
  const missing = getMissingSlots(intent, slots);
  if (missing.length === 0) score += 0.2;

  // Boost for explicit keywords
  if (intent === INTENTS.CREATE_WORKOUT && /\b(create|make|build|generate)\b/i.test(text)) {
    score += 0.15;
  }
  if (intent === INTENTS.START_WORKOUT && /\b(start|begin)\b/i.test(text)) {
    score += 0.15;
  }
  if (intent === INTENTS.LOG_SET && /\d+\s*(x|×)\s*\d+/i.test(text)) {
    score += 0.2;
  }

  return Math.min(score, 1);
}

/**
 * Main router class
 */
export const WorkoutIntentRouter = {
  /**
   * Route a message to the appropriate intent
   * @param {string} text - User's message
   * @param {string} screen - Current screen name
   * @returns {Object} - { intent, data, confidence } or clarification/disambiguation
   */
  route(text, screen = 'WorkoutScreen') {
    const normalizedText = text.toLowerCase().trim();

    // Check for small talk first
    if (PATTERNS.SMALL_TALK.some(p => p.test(normalizedText))) {
      return {
        intent: INTENTS.SMALL_TALK,
        response: SMALL_TALK_RESPONSES[Math.floor(Math.random() * SMALL_TALK_RESPONSES.length)],
        confidence: 0.95,
      };
    }

    // Detect all matching intents
    const matches = [];
    const slots = extractSlots(normalizedText);

    for (const [intentName, patterns] of Object.entries(PATTERNS)) {
      if (intentName === 'SMALL_TALK') continue; // Already handled

      const isMatch = patterns.some(p => p.test(normalizedText));
      if (isMatch) {
        const confidence = calculateConfidence(intentName, normalizedText, screen, slots);
        const missingSlots = getMissingSlots(intentName, slots);

        matches.push({
          intent: intentName,
          confidence,
          missingSlots,
          slots,
        });
      }
    }

    // No matches - unknown intent
    if (matches.length === 0) {
      return {
        intent: INTENTS.UNKNOWN,
        confidence: 0,
        fallbackToAI: true,
      };
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);
    const top = matches[0];

    // Check for disambiguation (two intents with similar confidence)
    if (matches.length > 1) {
      const second = matches[1];
      if (Math.abs(top.confidence - second.confidence) < 0.15) {
        // Need disambiguation
        if (
          (top.intent === INTENTS.START_WORKOUT && second.intent === INTENTS.CREATE_WORKOUT) ||
          (top.intent === INTENTS.CREATE_WORKOUT && second.intent === INTENTS.START_WORKOUT)
        ) {
          return {
            intent: INTENTS.DISAMBIGUATE,
            data: DISAMBIGUATIONS.START_VS_CREATE,
          };
        }
      }
    }

    // Check for missing slots
    if (top.missingSlots.length > 0) {
      const clarification = CLARIFICATIONS[top.intent];
      if (clarification) {
        return {
          intent: INTENTS.ASK_CLARIFICATION,
          originalIntent: top.intent,
          prompt: clarification.prompt,
          placeholder: clarification.placeholder,
          options: clarification.options,
          missingSlots: top.missingSlots,
        };
      }
    }

    // All good - return the intent
    return {
      intent: top.intent,
      data: top.slots,
      confidence: top.confidence,
    };
  },

  /**
   * Quick check if text looks like a button press (exact match)
   */
  isButtonPress(text) {
    const buttonPhrases = [
      'push workout', 'pull workout', 'leg workout', 'legs workout',
      'upper body', 'lower body', 'full body', 'full body workout',
      'start today', 'start workout',
    ];
    return buttonPhrases.includes(text.toLowerCase().trim());
  },

  /**
   * Get the intent for a button press (no clarification needed)
   */
  getButtonIntent(text) {
    const normalized = text.toLowerCase().trim();

    const splitMap = {
      'push workout': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'push', goal: 'hypertrophy' } },
      'pull workout': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'pull', goal: 'hypertrophy' } },
      'leg workout': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'legs', goal: 'hypertrophy' } },
      'legs workout': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'legs', goal: 'hypertrophy' } },
      'upper body': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'upper', goal: 'hypertrophy' } },
      'lower body': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'lower', goal: 'hypertrophy' } },
      'full body': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'full_body', goal: 'hypertrophy' } },
      'full body workout': { intent: INTENTS.CREATE_WORKOUT, data: { split: 'full_body', goal: 'hypertrophy' } },
      'start today': { intent: INTENTS.START_WORKOUT, data: { which: 'today' } },
      'start workout': { intent: INTENTS.START_WORKOUT, data: { which: 'today' } },
    };

    return splitMap[normalized] || null;
  },
};

export default WorkoutIntentRouter;
