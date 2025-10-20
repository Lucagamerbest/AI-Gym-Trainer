/**
 * Progress Intent Detection
 * Handles intent detection for ProgressScreen
 */

import { extractExerciseName } from '../utils';

/**
 * Detect progress-related intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectProgressIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'ProgressScreen' && screen !== 'Progress') {
    return null;
  }

  // SET_GOAL - "set a goal for bench press" / "I want to squat 315" / "set deadlift goal"
  if ((msg.includes('set') && msg.includes('goal')) ||
      (msg.includes('i want to') && (msg.includes('lift') || msg.includes('bench') ||
       msg.includes('squat') || msg.includes('deadlift')))) {
    return {
      intent: 'SET_GOAL',
      confidence: 0.9,
      parameters: {
        exercise: extractExerciseName(msg)
      }
    };
  }

  // CHECK_GOALS - "show my goals" / "am I close to my goals" / "goal progress"
  if ((msg.includes('goal') && !msg.includes('set')) ||
      msg.includes('close to') || msg.includes('goal progress')) {
    return {
      intent: 'CHECK_GOALS',
      confidence: 0.9,
      parameters: {}
    };
  }

  // GET_ACHIEVEMENTS - "show my achievements" / "what badges have I earned" / "my accomplishments"
  if (msg.includes('achievement') || msg.includes('badge') ||
      msg.includes('accomplishment') || msg.includes('earned')) {
    return {
      intent: 'GET_ACHIEVEMENTS',
      confidence: 0.9,
      parameters: {}
    };
  }

  // CHECK_STREAK - "what's my streak" / "how many days in a row" / "streak status"
  if (msg.includes('streak') || msg.includes('days in a row') ||
      msg.includes('consecutive')) {
    return {
      intent: 'CHECK_STREAK',
      confidence: 0.9,
      parameters: {}
    };
  }

  // CHECK_EXERCISE_PROGRESS - "show my squat progress" / "how am I doing on deadlifts"
  if ((msg.includes('progress') || msg.includes('improvement') ||
       msg.includes('how am i doing')) && !msg.includes('nutrition')) {
    return {
      intent: 'CHECK_EXERCISE_PROGRESS',
      confidence: 0.85,
      parameters: {
        exercise: extractExerciseName(msg)
      }
    };
  }

  // CHECK_PR - Enhanced for Progress screen context
  if (msg.includes('pr') || msg.includes('personal record') ||
      msg.includes('best') || msg.includes('max')) {
    return {
      intent: 'CHECK_PR',
      confidence: 0.9,
      parameters: {
        exercise: extractExerciseName(msg)
      }
    };
  }

  return null;
}
