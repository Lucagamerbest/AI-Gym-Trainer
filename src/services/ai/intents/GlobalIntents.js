/**
 * Global Intent Detection
 * Handles intents that work on any screen (like HomeScreen intents, workout action intents, etc.)
 */

import { extractDateFromMessage } from '../utils';

/**
 * Detect home screen general intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectHomeScreenIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'HomeScreen' && screen !== 'Home') {
    return null;
  }

  // GET_TODAY_SUMMARY - "how's my day" / "today's progress" / "summary" (but NOT if creating workout)
  if ((msg.includes('summary') || msg.includes("how's my day") ||
       (msg.includes('today') && (msg.includes('progress') || msg.includes('stats')))) &&
      !msg.includes('create') && !msg.includes('make') && !msg.includes('build')) {
    return {
      intent: 'GET_TODAY_SUMMARY',
      confidence: 0.9,
      parameters: {}
    };
  }

  // GET_MOTIVATION - "motivate me" / "pep talk" / "encourage me"
  if (msg.includes('motivate') || msg.includes('pep talk') ||
      msg.includes('encourage') || msg.includes('inspiration')) {
    return {
      intent: 'GET_MOTIVATION',
      confidence: 0.9,
      parameters: {}
    };
  }

  return null;
}

/**
 * Detect global workout action intents (work on any screen after creating a workout)
 * @param {string} message - User's message
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectGlobalWorkoutActionIntents(message) {
  const msg = message.toLowerCase().trim();

  // START_CREATED_WORKOUT - "start it now" / "begin workout" / "start now" / "let's do it"
  if ((msg.includes('start') && (msg.includes('now') || msg.includes('it'))) ||
      msg.includes('begin') || msg.includes("let's do it") ||
      msg.includes('do it now') || msg === 'start') {
    return {
      intent: 'START_CREATED_WORKOUT',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SAVE_TO_PLANS - "save to plans" / "add to my plans" / "save for later" / "save it"
  if ((msg.includes('save') && (msg.includes('plan') || msg.includes('later') || msg.includes('library'))) ||
      (msg.includes('add to') && msg.includes('plan'))) {
    return {
      intent: 'SAVE_TO_PLANS',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SCHEDULE_WORKOUT - "schedule for today/tomorrow/friday" / "set for tomorrow" / "schedule in 2 days"
  if (msg.includes('schedule') || msg.includes('set for') || msg.includes('schedule in')) {

    // Try to extract date/day from message
    const extractedDate = extractDateFromMessage(msg);

    if (extractedDate) {
      return {
        intent: 'SCHEDULE_WORKOUT',
        confidence: 0.9,
        parameters: { dateInfo: extractedDate }
      };
    }
  }

  return null;
}
