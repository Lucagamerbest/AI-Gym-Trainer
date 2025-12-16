/**
 * VoiceWorkoutParser.js
 *
 * Parses natural language voice transcripts into structured workout data.
 * Handles various speech patterns like:
 * - "I did three sets of smith machine squat. First set 215 pounds 10 reps..."
 * - "bench press 185x5, 185x5, 195x3"
 * - "215 for 10, 145 for 3, 300 for 5"
 */

import { findBestExerciseMatch } from '../../utils/exerciseNameMatcher';

// Number word to digit mapping
const NUMBER_WORDS = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'first': 1, 'second': 2, 'third': 3,
  'fourth': 4, 'fifth': 5, 'last': -1 // -1 means "last" set
};

// Ordinal patterns for set identification
const ORDINAL_PATTERNS = [
  { pattern: /\b(first|1st)\b/i, setNumber: 1 },
  { pattern: /\b(second|2nd)\b/i, setNumber: 2 },
  { pattern: /\b(third|3rd)\b/i, setNumber: 3 },
  { pattern: /\b(fourth|4th)\b/i, setNumber: 4 },
  { pattern: /\b(fifth|5th)\b/i, setNumber: 5 },
  { pattern: /\b(last|final)\b/i, setNumber: -1 }, // -1 = last set
];

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
 * Extract exercise name from transcript
 * "I did three sets of smith machine squat" -> "smith machine squat"
 * "bench press 185x5" -> "bench press"
 */
function extractExerciseName(transcript) {
  // Pattern 1: "sets of [exercise]" or "set of [exercise]"
  const setsOfPattern = /sets?\s+of\s+([a-zA-Z\s]+?)(?:\.|,|first|second|third|1st|2nd|3rd|\d+\s*(?:lbs?|pounds?|kg)|$)/i;
  let match = transcript.match(setsOfPattern);
  if (match) {
    return match[1].trim();
  }

  // Pattern 2: "[exercise] [weight]x[reps]" or "[exercise] [weight] for [reps]"
  const exerciseFirstPattern = /^([a-zA-Z\s]+?)\s+\d+\s*(?:lbs?|pounds?|kg)?\s*(?:x|×|for|by|with)/i;
  match = transcript.match(exerciseFirstPattern);
  if (match) {
    return match[1].trim();
  }

  // Pattern 3: "did [exercise]" or "on [exercise]"
  const didPattern = /(?:did|on|for)\s+([a-zA-Z\s]+?)(?:\.|,|\d+|$)/i;
  match = transcript.match(didPattern);
  if (match) {
    // Filter out common noise words
    const candidate = match[1].trim();
    const noiseWords = ['the', 'a', 'my', 'some', 'about', 'around'];
    if (!noiseWords.includes(candidate.toLowerCase())) {
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
  // Clean the segment
  const cleaned = segment.toLowerCase().trim();

  // Pattern 1: "215 pounds with 10 reps" or "215 lbs 10 reps"
  let match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)?\s*(?:with|for|at)?\s*(\d+)\s*(?:reps?)?/);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
  }

  // Pattern 2: "185x5" or "185 x 5" or "185×5"
  match = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+)/);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
  }

  // Pattern 3: "10 reps at 215" (reps first)
  match = cleaned.match(/(\d+)\s*(?:reps?)\s*(?:at|@|with)?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)?/);
  if (match) {
    return { weight: parseFloat(match[2]), reps: parseInt(match[1], 10) };
  }

  // Pattern 4: Just "215 for 10" without units
  match = cleaned.match(/(\d+(?:\.\d+)?)\s+(?:for|with)\s+(\d+)/);
  if (match) {
    return { weight: parseFloat(match[1]), reps: parseInt(match[2], 10) };
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
    confidence: 'low'
  };

  if (!transcript || typeof transcript !== 'string') {
    return result;
  }

  const normalizedTranscript = transcript.trim();

  // Extract exercise name if not provided
  if (!knownExercise && requireExerciseName) {
    const exerciseName = extractExerciseName(normalizedTranscript);
    if (exerciseName) {
      result.exerciseName = exerciseName;

      // Match to database
      const match = findBestExerciseMatch(exerciseName, 0.4); // Lower threshold for voice
      if (match) {
        result.matchedExercise = match.exercise;
        result.matchScore = match.score;
      }
    }
  }

  // Extract set count (for validation)
  const declaredSetCount = extractSetCount(normalizedTranscript);

  // Try parsing with ordinals first
  let sets = parseOrdinalSets(normalizedTranscript);

  // If no ordinal sets found, try sequential parsing
  if (sets.length === 0) {
    sets = parseSequentialSets(normalizedTranscript);
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
