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
  clearCache
};
