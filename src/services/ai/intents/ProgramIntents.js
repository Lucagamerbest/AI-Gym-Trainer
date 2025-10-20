/**
 * Program Intent Detection
 * Handles intent detection for workout program creation
 */

import { extractMuscleGroups } from '../utils';

/**
 * Detect program creation intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectProgramIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  // CREATE_PROGRAM - Works on WorkoutScreen, StartWorkoutScreen, and WorkoutHistoryScreen
  if (screen === 'WorkoutScreen' || screen === 'StartWorkoutScreen' || screen === 'WorkoutHistoryScreen') {

    // CREATE_PROGRAM - "create a program" / "create a 6-day PPL program" / "personalized program"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate')) &&
        (msg.includes('program') || msg.includes('split'))) {

      // Extract number of days if mentioned
      const daysMatch = msg.match(/(\d+)\s*day/i);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

      // Check for specific program types
      let programType = null;
      if (msg.includes('push pull legs') || msg.includes('ppl')) {
        programType = 'push_pull_legs';
      } else if (msg.includes('upper lower') || msg.includes('upper/lower')) {
        programType = 'upper_lower';
      } else if (msg.includes('bro split') || msg.includes('body part split')) {
        programType = 'bro_split';
      } else if (msg.includes('full body')) {
        programType = 'full_body';
      } else if (msg.includes('personalized') || msg.includes('for my goals')) {
        programType = 'personalized';
      }

      return {
        intent: 'CREATE_PROGRAM',
        confidence: 0.95,
        parameters: {
          numDays: numDays,
          programType: programType,
          muscleGroups: extractMuscleGroups(msg)
        }
      };
    }
  }

  // Additional detection for WorkoutHistoryScreen when user mentions a program type
  if (screen === 'WorkoutHistoryScreen') {
    // Detect when user just mentions a program type (for follow-up responses)
    const isPPL = msg.includes('push') && msg.includes('pull') && msg.includes('leg');
    const isUpperLower = (msg.includes('upper') && msg.includes('lower')) || msg.includes('upper/lower');
    const isBroSplit = msg.includes('bro') || (msg.includes('body') && msg.includes('part'));
    const isFullBody = msg.includes('full') && msg.includes('body');

    if (msg.includes('ppl') || isPPL || isUpperLower || isBroSplit || isFullBody) {
      let programType = null;
      if (msg.includes('ppl') || isPPL) {
        programType = 'push_pull_legs';
      } else if (isUpperLower) {
        programType = 'upper_lower';
      } else if (isBroSplit) {
        programType = 'bro_split';
      } else if (isFullBody) {
        programType = 'full_body';
      }

      return {
        intent: 'CREATE_PROGRAM',
        confidence: 0.9,
        parameters: {
          numDays: null,
          programType: programType,
          muscleGroups: extractMuscleGroups(msg)
        }
      };
    }
  }

  return null;
}
