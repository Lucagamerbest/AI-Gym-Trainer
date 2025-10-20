/**
 * Extract exercise name from user message
 * @param {string} message - User's message
 * @returns {string|null} - Exercise name or null if not found
 */
export function extractExerciseName(message) {
  const exercises = ['bench', 'press', 'squat', 'deadlift', 'row', 'curl',
                     'pullup', 'chinup', 'dip', 'lunge', 'leg press'];

  for (const exercise of exercises) {
    if (message.toLowerCase().includes(exercise)) {
      return exercise;
    }
  }
  return null;
}
