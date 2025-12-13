/**
 * Exercise Name Matcher Utility
 *
 * Detects exercise names from the database within text (like AI chat responses).
 * Returns matched exercises with their positions for rendering as clickable chips.
 */

import { getAllExercises } from '../data/exerciseDatabase';

// Cache for exercise names to avoid repeated database calls
let exerciseNamesCache = null;
let exerciseMapCache = null;

/**
 * Get all exercise names from the database (cached)
 * Returns array of { name, exercise } objects sorted by name length (longest first)
 * Sorting by length ensures "Incline Bench Press" matches before "Bench Press"
 */
export const getExerciseNames = () => {
  if (exerciseNamesCache) {
    return exerciseNamesCache;
  }

  const allExercises = getAllExercises();

  // Create array of exercise names with their full exercise objects
  const exerciseNames = allExercises.map(exercise => ({
    name: exercise.name,
    nameLower: exercise.name.toLowerCase(),
    exercise: exercise
  }));

  // Sort by name length (longest first) to match longer names first
  // This prevents "Bench Press" from matching before "Incline Bench Press"
  exerciseNames.sort((a, b) => b.name.length - a.name.length);

  exerciseNamesCache = exerciseNames;
  return exerciseNames;
};

/**
 * Get exercise map (name -> exercise) for quick lookups
 */
export const getExerciseMap = () => {
  if (exerciseMapCache) {
    return exerciseMapCache;
  }

  const allExercises = getAllExercises();
  const map = new Map();

  allExercises.forEach(exercise => {
    map.set(exercise.name.toLowerCase(), exercise);
  });

  exerciseMapCache = map;
  return map;
};

/**
 * Find all exercise names within a text string
 *
 * @param {string} text - The text to search (e.g., AI chat response)
 * @returns {Array} Array of matches: { name, start, end, exercise }
 *
 * Example:
 * findExercisesInText("Try Bench Press and Cable Crossover")
 * Returns:
 * [
 *   { name: "Bench Press", start: 4, end: 15, exercise: {...} },
 *   { name: "Cable Crossover", start: 20, end: 35, exercise: {...} }
 * ]
 */
export const findExercisesInText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const exerciseNames = getExerciseNames();
  const textLower = text.toLowerCase();
  const matches = [];
  const usedRanges = []; // Track matched ranges to avoid overlaps

  // Check each exercise name
  for (const { name, nameLower, exercise } of exerciseNames) {
    let searchStart = 0;

    // Find all occurrences of this exercise name
    while (searchStart < textLower.length) {
      const index = textLower.indexOf(nameLower, searchStart);

      if (index === -1) break;

      const end = index + name.length;

      // Check if this position overlaps with an existing match
      const overlaps = usedRanges.some(range =>
        (index >= range.start && index < range.end) ||
        (end > range.start && end <= range.end) ||
        (index <= range.start && end >= range.end)
      );

      if (!overlaps) {
        // Check word boundaries to avoid partial matches
        // e.g., "Bench Press" shouldn't match inside "TheBench Pressor"
        const charBefore = index > 0 ? text[index - 1] : ' ';
        const charAfter = end < text.length ? text[end] : ' ';

        const isWordBoundaryBefore = /[\s,.:;!?()"'\-\[\]\/]/.test(charBefore) || index === 0;
        const isWordBoundaryAfter = /[\s,.:;!?()"'\-\[\]\/]/.test(charAfter) || end === text.length;

        if (isWordBoundaryBefore && isWordBoundaryAfter) {
          // Get the actual text from the original string (preserves case)
          const matchedText = text.substring(index, end);

          matches.push({
            name: exercise.name, // Use canonical name from database
            matchedText: matchedText, // What was actually in the text
            start: index,
            end: end,
            exercise: exercise
          });

          usedRanges.push({ start: index, end: end });
        }
      }

      searchStart = index + 1;
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  return matches;
};

/**
 * Check if a specific exercise name exists in text
 *
 * @param {string} text - The text to search
 * @param {string} exerciseName - The exercise name to look for
 * @returns {boolean}
 */
export const hasExerciseInText = (text, exerciseName) => {
  if (!text || !exerciseName) return false;

  const textLower = text.toLowerCase();
  const nameLower = exerciseName.toLowerCase();

  return textLower.includes(nameLower);
};

/**
 * Get exercise by name (case-insensitive)
 *
 * @param {string} name - Exercise name to look up
 * @returns {Object|null} Exercise object or null if not found
 */
export const getExerciseByName = (name) => {
  if (!name) return null;

  const map = getExerciseMap();
  return map.get(name.toLowerCase()) || null;
};

/**
 * Common abbreviations and their expansions
 */
const ABBREVIATIONS = {
  'db': 'dumbbell',
  'bb': 'barbell',
  'kb': 'kettlebell',
  'ez': 'ez bar',
  'sm': 'smith machine',
  'inc': 'incline',
  'dec': 'decline',
  'lat': 'lateral',
  'tri': 'tricep',
  'bi': 'bicep',
  'ext': 'extension',
  'curl': 'curl',
  'press': 'press',
  'row': 'row',
  'pull': 'pull',
  'push': 'push',
  'flye': 'fly',
  'flies': 'fly',
  'flys': 'fly',
  'rdl': 'romanian deadlift',
  'sldl': 'stiff leg deadlift',
  'ohp': 'overhead press',
  'cgbp': 'close grip bench press',
  'jm': 'jm press',
};

/**
 * Words to remove when normalizing (equipment is handled separately)
 */
const NOISE_WORDS = ['with', 'using', 'on', 'the', 'a', 'an'];

/**
 * Position/stance qualifiers that can be ignored for base matching
 * These are helpful but not required for matching
 */
const POSITION_QUALIFIERS = [
  'standing', 'seated', 'sitting', 'lying', 'prone', 'supine',
  'single leg', 'single arm', 'one arm', 'one leg',
  'bent over', 'leaning', 'kneeling',
  'alternating', 'unilateral', 'bilateral',
];

/**
 * Normalize exercise name for matching
 * Expands abbreviations, removes noise words, lowercases
 */
const normalizeExerciseName = (name) => {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Replace abbreviations
  Object.entries(ABBREVIATIONS).forEach(([abbr, full]) => {
    // Match whole words only
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    normalized = normalized.replace(regex, full);
  });

  // Remove noise words
  NOISE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, '');
  });

  // Remove extra spaces and special chars
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  return normalized;
};

/**
 * Calculate similarity between two strings (0-1)
 * Uses word overlap + partial matching + containment bonus
 */
const calculateSimilarity = (inputStr, dbStr) => {
  const inputWords = inputStr.split(' ').filter(w => w.length > 1);
  const dbWords = dbStr.split(' ').filter(w => w.length > 1);

  if (inputWords.length === 0 || dbWords.length === 0) return 0;

  // Check if one string fully contains the other (high match)
  if (dbStr.includes(inputStr) || inputStr.includes(dbStr)) {
    // Strong containment match - give high score
    const containmentScore = Math.min(inputStr.length, dbStr.length) / Math.max(inputStr.length, dbStr.length);
    return Math.max(0.7, containmentScore);
  }

  let matches = 0;
  let partialMatches = 0;

  // Check how many input words are found in db words
  inputWords.forEach(inputWord => {
    if (dbWords.includes(inputWord)) {
      matches++;
    } else {
      // Check for partial match (one word contains another)
      const hasPartial = dbWords.some(dbWord =>
        inputWord.includes(dbWord) || dbWord.includes(inputWord)
      );
      if (hasPartial) partialMatches += 0.5;
    }
  });

  // Score based on how many input words matched
  // Use input words length as denominator to favor matches where all input words are found
  const inputMatchRatio = (matches + partialMatches) / inputWords.length;

  // Also consider coverage of db name
  const dbMatchRatio = (matches + partialMatches) / dbWords.length;

  // Weighted average favoring input match (user's search terms should all match)
  return (inputMatchRatio * 0.7) + (dbMatchRatio * 0.3);
};

/**
 * Remove position qualifiers from name for base matching
 */
const removePositionQualifiers = (normalizedName) => {
  let result = normalizedName;
  POSITION_QUALIFIERS.forEach(qualifier => {
    const regex = new RegExp(`\\b${qualifier}\\b`, 'gi');
    result = result.replace(regex, '');
  });
  return result.replace(/\s+/g, ' ').trim();
};

/**
 * Find best matching exercise from library using fuzzy matching
 *
 * @param {string} name - Exercise name to match (can be abbreviated or varied)
 * @param {number} threshold - Minimum similarity score (0-1), default 0.5
 * @returns {{ exercise: Object, score: number, isExactMatch: boolean } | null}
 */
export const findBestExerciseMatch = (name, threshold = 0.5) => {
  if (!name) return null;

  const normalizedInput = normalizeExerciseName(name);
  const exerciseNames = getExerciseNames();

  // First try exact match (case-insensitive)
  const exactMatch = getExerciseByName(name);
  if (exactMatch) {
    return { exercise: exactMatch, score: 1, isExactMatch: true };
  }

  // Try normalized exact match
  const map = getExerciseMap();
  for (const [dbName, exercise] of map.entries()) {
    const normalizedDbName = normalizeExerciseName(dbName);
    if (normalizedDbName === normalizedInput) {
      return { exercise, score: 0.95, isExactMatch: false };
    }
  }

  // Try matching with position qualifiers removed (e.g., "Standing Leg Curl" -> "Leg Curl")
  const inputWithoutQualifiers = removePositionQualifiers(normalizedInput);
  if (inputWithoutQualifiers !== normalizedInput) {
    for (const [dbName, exercise] of map.entries()) {
      const normalizedDbName = normalizeExerciseName(dbName);
      const dbWithoutQualifiers = removePositionQualifiers(normalizedDbName);
      if (dbWithoutQualifiers === inputWithoutQualifiers || normalizedDbName === inputWithoutQualifiers) {
        return { exercise, score: 0.9, isExactMatch: false };
      }
    }
  }

  // Fuzzy match
  let bestMatch = null;
  let bestScore = 0;

  for (const { name: dbName, exercise } of exerciseNames) {
    const normalizedDbName = normalizeExerciseName(dbName);

    // Try both with and without qualifiers
    const score1 = calculateSimilarity(normalizedInput, normalizedDbName);
    const score2 = inputWithoutQualifiers !== normalizedInput
      ? calculateSimilarity(inputWithoutQualifiers, normalizedDbName)
      : 0;
    const score = Math.max(score1, score2);

    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = exercise;
    }
  }

  if (bestMatch) {
    return { exercise: bestMatch, score: bestScore, isExactMatch: false };
  }

  return null;
};

/**
 * Match multiple exercises and categorize them
 *
 * @param {Array} exercises - Array of exercise objects with 'name' property
 * @returns {{ matched: Array, unmatched: Array }}
 *   - matched: exercises found in library with their match info
 *   - unmatched: exercises not found (potential custom exercises)
 */
export const matchExercisesToLibrary = (exercises) => {
  const matched = [];
  const unmatched = [];

  (exercises || []).forEach(exercise => {
    const match = findBestExerciseMatch(exercise.name);

    if (match && match.score >= 0.5) {
      matched.push({
        original: exercise,
        libraryExercise: match.exercise,
        score: match.score,
        isExactMatch: match.isExactMatch,
      });
    } else {
      unmatched.push(exercise);
    }
  });

  return { matched, unmatched };
};

/**
 * Clear the cache (useful if exercise database is updated)
 */
export const clearCache = () => {
  exerciseNamesCache = null;
  exerciseMapCache = null;
};

export default {
  getExerciseNames,
  getExerciseMap,
  findExercisesInText,
  hasExerciseInText,
  getExerciseByName,
  findBestExerciseMatch,
  matchExercisesToLibrary,
  clearCache
};
