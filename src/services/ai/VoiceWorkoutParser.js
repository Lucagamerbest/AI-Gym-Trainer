/**
 * VoiceWorkoutParser.js
 *
 * Parses natural language voice transcripts into structured workout data.
 * Handles various speech patterns like:
 * - "I did three sets of smith machine squat. First set 215 pounds 10 reps..."
 * - "bench press 185x5, 185x5, 195x3"
 * - "215 for 10, 145 for 3, 300 for 5"
 * - "add bench press" or "add incline dumbbell press"
 * - "135 pounds 8 reps" or "8 reps at 135"
 */

import { findBestExerciseMatch, findExercisesInText } from '../../utils/exerciseNameMatcher';

// Number word to digit mapping (expanded)
const NUMBER_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
  'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
  'last': -1, 'final': -1 // -1 means "last" set
};

// Common voice recognition mistakes and corrections
const VOICE_CORRECTIONS = {
  'benchpress': 'bench press',
  'dumbell': 'dumbbell',
  'dumbel': 'dumbbell',
  'barbel': 'barbell',
  'deadlift': 'deadlift',
  'dead lift': 'deadlift',
  'sqaut': 'squat',
  'squats': 'squat',
  'curls': 'curl',
  'presses': 'press',
  'rows': 'row',
  'pullups': 'pull-up',
  'pull ups': 'pull-up',
  'pushups': 'push-up',
  'push ups': 'push-up',
  'dips': 'dip',
  'flies': 'fly',
  'flyes': 'fly',
  'lunge': 'lunge',
  'lunges': 'lunge',
  'crunches': 'crunch',
  'planks': 'plank',
  'shrugs': 'shrug',
  'raises': 'raise',
  'extensions': 'extension',
  'kickbacks': 'kickback',
  'pressdowns': 'pushdown',
  'press downs': 'pushdown',
  'skull crushers': 'skull crusher',
  'skullcrushers': 'skull crusher',
  'tricep': 'triceps',
  'bicep': 'biceps',
  'lat pulldown': 'lat pulldown',
  'lateral raise': 'lateral raise',
  'shoulder press': 'overhead press',
  'military press': 'overhead press',
  'ohp': 'overhead press',
  'rdl': 'romanian deadlift',
  'romanian deadlifts': 'romanian deadlift',
};

// Ordinal patterns for set identification
const ORDINAL_PATTERNS = [
  { pattern: /\b(first|1st)\b/i, setNumber: 1 },
  { pattern: /\b(second|2nd)\b/i, setNumber: 2 },
  { pattern: /\b(third|3rd)\b/i, setNumber: 3 },
  { pattern: /\b(fourth|4th)\b/i, setNumber: 4 },
  { pattern: /\b(fifth|5th)\b/i, setNumber: 5 },
  { pattern: /\b(sixth|6th)\b/i, setNumber: 6 },
  { pattern: /\b(seventh|7th)\b/i, setNumber: 7 },
  { pattern: /\b(eighth|8th)\b/i, setNumber: 8 },
  { pattern: /\b(last|final)\b/i, setNumber: -1 }, // -1 = last set
];

/**
 * Apply voice recognition corrections to transcript
 */
function applyVoiceCorrections(transcript) {
  let corrected = transcript.toLowerCase();

  // Apply corrections
  Object.entries(VOICE_CORRECTIONS).forEach(([mistake, correction]) => {
    const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  });

  return corrected;
}

/**
 * Check if transcript is an "add exercise" command
 * Returns the exercise name if found, null otherwise
 */
function parseAddExerciseCommand(transcript) {
  const addPatterns = [
    /\b(?:add|include|throw in|do|start|begin)\s+(?:a\s+)?(?:some\s+)?(.+?)(?:\s+exercise)?(?:\s+to|\s+next|$)/i,
    /\blet'?s?\s+(?:do|add|start)\s+(.+)/i,
    /\bnext\s+(?:exercise\s+)?(?:is\s+)?(.+)/i,
    /\bswitch\s+to\s+(.+)/i,
  ];

  for (const pattern of addPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const exerciseName = match[1].trim()
        .replace(/\s+please\s*$/i, '')
        .replace(/\s+now\s*$/i, '')
        .replace(/\s+to the workout\s*$/i, '');

      if (exerciseName.length > 2) {
        return exerciseName;
      }
    }
  }

  return null;
}

/**
 * Convert number words to digits
 */
function wordToNumber(word) {
  if (!word) return null;
  const lower = word.toLowerCase().trim();
  if (NUMBER_WORDS[lower] !== undefined) {
    return NUMBER_WORDS[lower];
  }
  const num = parseInt(lower, 10);
  return isNaN(num) ? null : num;
}

/**
 * Extract set count from transcript
 * "I did three sets" -> 3
 * "3 sets of bench" -> 3
 */
function extractSetCount(transcript) {
  // Pattern: (number) sets
  const patterns = [
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+sets?\b/i,
    /\bdid\s+(\d+|one|two|three|four|five)\s+sets?\b/i,
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) {
      return wordToNumber(match[1]);
    }
  }
  return null;
}

/**
 * Extract exercise name from transcript using multiple strategies
 * "I did three sets of smith machine squat" -> "smith machine squat"
 * "bench press 185x5" -> "bench press"
 */
function extractExerciseName(transcript) {
  const corrected = applyVoiceCorrections(transcript);

  // Strategy 1: Use the exercise database to find known exercises in the text
  const foundExercises = findExercisesInText(corrected);
  if (foundExercises.length > 0) {
    // Return the first (longest) matched exercise name
    return foundExercises[0].name;
  }

  // Strategy 2: Pattern matching for exercise names

  // Pattern 1: "sets of [exercise]" or "set of [exercise]"
  const setsOfPattern = /sets?\s+of\s+([a-zA-Z\s\-]+?)(?:\.|,|first|second|third|1st|2nd|3rd|\d+\s*(?:lbs?|pounds?|kg)|$)/i;
  let match = corrected.match(setsOfPattern);
  if (match) {
    return match[1].trim();
  }

  // Pattern 2: "[exercise] [weight]x[reps]" or "[exercise] [weight] for [reps]"
  const exerciseFirstPattern = /^([a-zA-Z\s\-]+?)\s+\d+\s*(?:lbs?|pounds?|kg)?\s*(?:x|×|for|by|with)/i;
  match = corrected.match(exerciseFirstPattern);
  if (match) {
    return match[1].trim();
  }

  // Pattern 3: "did [exercise]" or "on [exercise]" or "doing [exercise]"
  const didPattern = /(?:did|on|for|doing|finished)\s+(?:the\s+)?([a-zA-Z\s\-]+?)(?:\.|,|\d+|today|$)/i;
  match = corrected.match(didPattern);
  if (match) {
    const candidate = match[1].trim();
    const noiseWords = ['the', 'a', 'my', 'some', 'about', 'around', 'it', 'that', 'this'];
    if (!noiseWords.includes(candidate.toLowerCase()) && candidate.length > 2) {
      return candidate;
    }
  }

  // Pattern 4: Just the exercise name at the start (e.g., "bench press 135")
  const startPattern = /^([a-zA-Z][a-zA-Z\s\-]+?)\s+(?:\d|first|second|one|two)/i;
  match = corrected.match(startPattern);
  if (match) {
    const candidate = match[1].trim();
    if (candidate.length > 3) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parse individual set data from a segment of text
 * Returns { weight, reps } or null
 */
function parseSetData(segment) {
  // Clean the segment and convert number words
  let cleaned = segment.toLowerCase().trim();

  // Convert spoken numbers to digits (e.g., "one thirty five" -> "135")
  Object.entries(NUMBER_WORDS).forEach(([word, num]) => {
    if (num > 0) { // Skip 'last'/'final'
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleaned = cleaned.replace(regex, String(num));
    }
  });

  // Handle compound numbers like "one thirty five" -> "135", "two twenty five" -> "225"
  cleaned = cleaned.replace(/\b(\d)\s+(\d{2})\b/g, '$1$2'); // "1 35" -> "135"
  cleaned = cleaned.replace(/\b(\d)\s+hundred\s*(\d+)?\b/gi, (_, h, t) => String(parseInt(h) * 100 + (parseInt(t) || 0)));

  // Pattern 1: "215 pounds 10 reps" or "215 lbs 10 reps" or "215 pounds with 10 reps"
  let match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?\s*(?:with|for|at|and)?\s*(\d+)\s*(?:reps?|times?|repetitions?)/i);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
  }

  // Pattern 2: "185x5" or "185 x 5" or "185×5" or "185 by 5"
  match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+)/i);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
  }

  // Pattern 3: "10 reps at 215" or "10 reps 215 pounds" (reps first)
  match = cleaned.match(/(\d+)\s*(?:reps?|times?|repetitions?)\s*(?:at|@|with|of)?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?/i);
  if (match) {
    return { weight: parseFloat(match[2]), reps: parseInt(match[1], 10) };
  }

  // Pattern 4: "215 for 10" or "215 with 10" without units
  match = cleaned.match(/(\d+(?:\.\d+)?)\s+(?:for|with)\s+(\d+)/i);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
  }

  // Pattern 5: Just two numbers close together "135 8" (weight reps)
  match = cleaned.match(/\b(\d{2,3}(?:\.\d+)?)\s+(\d{1,2})\b/);
  if (match) {
    const weight = parseFloat(match[1]);
    const reps = parseInt(match[2], 10);
    // Sanity check: weight should be bigger than reps usually
    if (weight > reps && reps <= 50 && weight >= 10) {
      return { weight, reps };
    }
  }

  // Pattern 6: "did 8 at 135" or "got 8 at 135"
  match = cleaned.match(/(?:did|got|hit)\s+(\d+)\s+(?:at|@)\s+(\d+(?:\.\d+)?)/i);
  if (match) {
    return { weight: parseFloat(match[2]), reps: parseInt(match[1], 10) };
  }

  return null;
}

/**
 * Parse sets with ordinals (first, second, third, last)
 * "First set 215 pounds 10 reps, second 145 for 3, last 300 for 5"
 */
function parseOrdinalSets(transcript) {
  const sets = [];

  // Split by common delimiters while keeping ordinals
  const segments = transcript.split(/[,.]/).filter(s => s.trim());

  for (const segment of segments) {
    // Find ordinal in this segment
    let setNumber = null;
    for (const { pattern, setNumber: num } of ORDINAL_PATTERNS) {
      if (pattern.test(segment)) {
        setNumber = num;
        break;
      }
    }

    // Parse set data from segment
    const setData = parseSetData(segment);
    if (setData) {
      sets.push({
        setNumber: setNumber || sets.length + 1, // Default to sequential if no ordinal
        weight: setData.weight,
        reps: setData.reps
      });
    }
  }

  // Resolve "last" (-1) to actual set number
  const maxSet = Math.max(...sets.filter(s => s.setNumber > 0).map(s => s.setNumber), 0);
  sets.forEach(set => {
    if (set.setNumber === -1) {
      set.setNumber = maxSet + 1;
    }
  });

  // Sort by set number
  sets.sort((a, b) => a.setNumber - b.setNumber);

  return sets;
}

/**
 * Parse sets without ordinals (sequential weight×reps patterns)
 * "185x5, 185x5, 195x3" or "bench press 185 for 5, 185 for 5, 195 for 3"
 */
function parseSequentialSets(transcript) {
  const sets = [];

  // Pattern for weight×reps or weight for reps
  const setPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)?\s*(?:x|×|by)\s*(\d+)/gi,
    /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)?\s*(?:for|with)\s*(\d+)/gi,
  ];

  for (const pattern of setPatterns) {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      const weight = parseFloat(match[1]);
      const reps = parseInt(match[2], 10);

      // Avoid duplicates (same weight+reps at same position)
      const isDuplicate = sets.some(s =>
        Math.abs(s.weight - weight) < 0.01 && s.reps === reps
      );

      if (!isDuplicate) {
        sets.push({
          setNumber: sets.length + 1,
          weight,
          reps
        });
      }
    }
  }

  return sets;
}

/**
 * Main parsing function
 *
 * @param {string} transcript - Raw voice transcript
 * @param {Object} options - Parsing options
 * @param {boolean} options.requireExerciseName - Whether exercise name is required
 * @param {Object} options.knownExercise - Pre-selected exercise (for per-exercise mic)
 * @returns {Object} Parsed workout data
 */
export function parseVoiceWorkout(transcript, options = {}) {
  const { requireExerciseName = true, knownExercise = null } = options;

  const result = {
    exerciseName: null,
    matchedExercise: knownExercise,
    matchScore: knownExercise ? 1 : 0,
    totalSets: 0,
    sets: [],
    rawTranscript: transcript,
    confidence: 'low',
    isAddExerciseCommand: false,
  };

  if (!transcript || typeof transcript !== 'string') {
    return result;
  }

  // Apply voice recognition corrections
  const correctedTranscript = applyVoiceCorrections(transcript.trim());
  result.correctedTranscript = correctedTranscript;

  // Check if this is an "add exercise" command first
  if (!knownExercise) {
    const addExerciseName = parseAddExerciseCommand(correctedTranscript);
    if (addExerciseName) {
      result.isAddExerciseCommand = true;
      result.exerciseName = addExerciseName;

      // Try to match the exercise
      const match = findBestExerciseMatch(addExerciseName, 0.35); // Lower threshold for add commands
      if (match) {
        result.matchedExercise = match.exercise;
        result.matchScore = match.score;
        result.confidence = match.score >= 0.7 ? 'high' : 'medium';
      } else {
        // Try direct search in database
        const foundExercises = findExercisesInText(addExerciseName);
        if (foundExercises.length > 0) {
          result.matchedExercise = foundExercises[0].exercise;
          result.matchScore = 0.8;
          result.confidence = 'high';
        }
      }

      return result;
    }
  }

  // Extract exercise name if not provided
  if (!knownExercise && requireExerciseName) {
    const exerciseName = extractExerciseName(correctedTranscript);
    if (exerciseName) {
      result.exerciseName = exerciseName;

      // Match to database
      const match = findBestExerciseMatch(exerciseName, 0.35); // Lower threshold for voice
      if (match) {
        result.matchedExercise = match.exercise;
        result.matchScore = match.score;
      }
    }
  }

  // Extract set count (for validation)
  const declaredSetCount = extractSetCount(correctedTranscript);

  // Try parsing with ordinals first
  let sets = parseOrdinalSets(correctedTranscript);

  // If no ordinal sets found, try sequential parsing
  if (sets.length === 0) {
    sets = parseSequentialSets(correctedTranscript);
  }

  result.sets = sets;
  result.totalSets = sets.length;

  // Calculate confidence
  if (sets.length > 0) {
    if (result.matchedExercise && result.matchScore >= 0.7) {
      result.confidence = 'high';
    } else if (result.matchedExercise || !requireExerciseName) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }
  }

  // Validate against declared set count if available
  if (declaredSetCount && sets.length !== declaredSetCount) {
    // Mismatch - lower confidence
    if (result.confidence === 'high') {
      result.confidence = 'medium';
    }
  }

  return result;
}

/**
 * Quick check if transcript looks like workout logging
 */
export function looksLikeWorkoutLog(transcript) {
  if (!transcript) return false;

  const patterns = [
    /\b(did|completed|finished)\b.*\b(sets?|reps?)\b/i,
    /\b\d+\s*(x|×|by)\s*\d+\b/i, // weight×reps
    /\b\d+\s*(lbs?|pounds?|kg)\b.*\b\d+\s*(reps?)\b/i,
    /\b(first|second|third|last)\s+(set|one)\b/i,
  ];

  return patterns.some(p => p.test(transcript));
}

export default {
  parseVoiceWorkout,
  looksLikeWorkoutLog
};
