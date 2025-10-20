/**
 * Extract single muscle group from user message
 * @param {string} message - User's message
 * @returns {string} - Muscle group name
 */
export function extractMuscleGroup(message) {
  const lowerMsg = message.toLowerCase();

  // Check for specific muscle groups (order matters - check specific before general)
  // Arms/Biceps/Triceps variations
  if (lowerMsg.match(/bicep|tricep|arm|curl|pushdown/)) return 'Arms';

  // Chest variations
  if (lowerMsg.match(/chest|bench|press.*chest|pec/)) return 'Chest';

  // Back variations
  if (lowerMsg.match(/back|pull|row|lat|deadlift/)) return 'Back';

  // Legs variations
  if (lowerMsg.match(/leg|squat|quad|hamstring|calf|glute/)) return 'Legs';

  // Shoulders variations
  if (lowerMsg.match(/shoulder|delt|overhead press|lateral/)) return 'Shoulders';

  // Core/Abs
  if (lowerMsg.match(/abs|core|plank/)) return 'Arms'; // Use Arms template for now

  // Full body
  if (lowerMsg.match(/full body|total body|whole body/)) return 'Full Body';

  return 'Full Body';
}

/**
 * Extract multiple muscle groups from user message
 * Handles workout splits like "push", "pull", "legs", "upper body", "lower body"
 * @param {string} message - User's message
 * @returns {string[]} - Array of muscle group names
 */
export function extractMuscleGroups(message) {
  const lowerMsg = message.toLowerCase();
  const muscleGroups = [];

  // Check for workout split types FIRST (before individual muscle groups)
  // Push workout = Chest + Shoulders + Triceps
  if (lowerMsg.match(/\bpush\b/)) {
    return ['Chest', 'Shoulders', 'Triceps'];
  }

  // Pull workout = Back + Biceps
  if (lowerMsg.match(/\bpull\b/) && !lowerMsg.match(/\bpush\b/)) {
    return ['Back', 'Biceps'];
  }

  // Leg workout - PRIORITY CHECK (before "back" check)
  if (lowerMsg.match(/\bleg\b|\blegs\b|\bleg day\b|\bleg workout\b/i) && !lowerMsg.match(/push|pull/)) {
    return ['Legs'];
  }

  // Full body
  if (lowerMsg.match(/full body|total body|whole body/)) {
    return ['Full Body'];
  }

  // Upper body
  if (lowerMsg.match(/upper body/)) {
    return ['Chest', 'Back', 'Shoulders', 'Arms'];
  }

  // Lower body
  if (lowerMsg.match(/lower body/)) {
    return ['Legs'];
  }

  // Check for each muscle group and add to array (order matters - specific before general)
  if (lowerMsg.match(/chest|bench|press.*chest|pec/)) muscleGroups.push('Chest');
  if (lowerMsg.match(/back|row|lat/)) muscleGroups.push('Back');
  if (lowerMsg.match(/leg|squat|quad|hamstring|calf|glute/)) muscleGroups.push('Legs');
  if (lowerMsg.match(/shoulder|delt|overhead press|lateral/)) muscleGroups.push('Shoulders');

  // Specific arm muscles
  if (lowerMsg.match(/tricep|pushdown|skull crusher|dip/)) muscleGroups.push('Triceps');
  if (lowerMsg.match(/bicep|curl/)) muscleGroups.push('Biceps');

  // General arms (only if biceps/triceps not already added)
  if (lowerMsg.match(/\barm\b/) && !muscleGroups.includes('Biceps') && !muscleGroups.includes('Triceps')) {
    muscleGroups.push('Arms');
  }

  if (lowerMsg.match(/abs|core|plank/)) muscleGroups.push('Core');

  // If no specific groups found, default to Full Body
  if (muscleGroups.length === 0) {
    return ['Full Body'];
  }

  return muscleGroups;
}
