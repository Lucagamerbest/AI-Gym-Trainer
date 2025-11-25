/**
 * Weight Equipment Constants
 * Defines bar types, plate weights, colors, and exercise mappings
 */

// Bar types and their standard weights (in lbs)
// Smith machine weights based on research: counterbalanced ~15-20lbs, non-counterbalanced ~30-45lbs
export const BAR_TYPES = {
  olympic: {
    name: 'Olympic Barbell',
    weight: 45,
    weightKg: 20,
    color: '#A0A0A0',
  },
  womensOlympic: {
    name: "Women's Olympic",
    weight: 35,
    weightKg: 15,
    color: '#A0A0A0',
  },
  standard: {
    name: 'Standard Barbell',
    weight: 20,
    weightKg: 9,
    color: '#B0B0B0',
  },
  ezCurl: {
    name: 'EZ Curl Bar',
    weight: 25,
    weightKg: 11,
    color: '#909090',
  },
  smith: {
    name: 'Smith Machine',
    weight: 20,
    weightKg: 9,
    color: '#707070',
  },
  smithHeavy: {
    name: 'Smith (Non-Counterbalanced)',
    weight: 35,
    weightKg: 16,
    color: '#707070',
  },
  smithLight: {
    name: 'Smith (Counterbalanced)',
    weight: 15,
    weightKg: 7,
    color: '#707070',
  },
  trap: {
    name: 'Trap/Hex Bar',
    weight: 45,
    weightKg: 20,
    color: '#404040',
  },
  trapHeavy: {
    name: 'Trap Bar (Heavy)',
    weight: 55,
    weightKg: 25,
    color: '#404040',
  },
  safetySquat: {
    name: 'Safety Squat Bar',
    weight: 65,
    weightKg: 30,
    color: '#505050',
  },
  tbar: {
    name: 'T-Bar',
    weight: 0,
    weightKg: 0,
    color: '#505050',
  },
};

// Standard Olympic plate weights and their colors (IWF standard colors)
export const PLATE_WEIGHTS = {
  lbs: [55, 45, 35, 25, 10, 5, 2.5],
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
};

// Default available plates (most gyms)
export const DEFAULT_AVAILABLE_PLATES = {
  lbs: [45, 35, 25, 10, 5, 2.5],
  kg: [20, 15, 10, 5, 2.5, 1.25],
};

// Plate colors based on weight (IWF Olympic standard-inspired)
export const PLATE_COLORS = {
  // Pounds
  55: { bg: '#DC2626', text: '#FFFFFF' },   // Red - 55 lbs
  45: { bg: '#2563EB', text: '#FFFFFF' },   // Blue - 45 lbs
  35: { bg: '#EAB308', text: '#000000' },   // Yellow - 35 lbs
  25: { bg: '#16A34A', text: '#FFFFFF' },   // Green - 25 lbs
  10: { bg: '#F5F5F5', text: '#000000' },   // White - 10 lbs
  5: { bg: '#DC2626', text: '#FFFFFF' },    // Red (small) - 5 lbs
  2.5: { bg: '#16A34A', text: '#FFFFFF' },  // Green (small) - 2.5 lbs
  // Kilograms (same colors)
  25: { bg: '#DC2626', text: '#FFFFFF' },   // Red - 25 kg
  20: { bg: '#2563EB', text: '#FFFFFF' },   // Blue - 20 kg
  15: { bg: '#EAB308', text: '#000000' },   // Yellow - 15 kg
  10: { bg: '#16A34A', text: '#FFFFFF' },   // Green - 10 kg (override)
  5: { bg: '#F5F5F5', text: '#000000' },    // White - 5 kg
  2.5: { bg: '#DC2626', text: '#FFFFFF' },  // Red (small) - 2.5 kg
  1.25: { bg: '#16A34A', text: '#FFFFFF' }, // Green (small) - 1.25 kg
};

// Plate sizes (relative width for visualization)
export const PLATE_SIZES = {
  55: { width: 28, height: 44 },
  45: { width: 26, height: 42 },
  35: { width: 24, height: 38 },
  25: { width: 22, height: 34 },
  10: { width: 18, height: 28 },
  5: { width: 14, height: 22 },
  2.5: { width: 10, height: 18 },
  // Kg sizes
  20: { width: 26, height: 42 },
  15: { width: 24, height: 38 },
  1.25: { width: 10, height: 18 },
};

// Mapping of exercise names + equipment to bar types
export const EXERCISE_BAR_MAPPING = {
  // CHEST
  'Bench Press': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Incline Bench Press': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Decline Bench Press': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },

  // BACK
  'T-Bar Row': {
    'T-Bar Machine': 'tbar',
    'Landmine Barbell': 'olympic',
  },
  'Weighted Pull Ups': {
    'Dip Belt with Plates': 'tbar', // plates only, no bar
  },

  // SHOULDERS
  'Shoulder Press': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Shrugs': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Upright Row': {
    'Barbell': 'olympic',
    'EZ Bar': 'ezCurl',
  },

  // BICEPS
  'Bicep Curl': {
    'Barbell': 'olympic',
    'EZ Bar': 'ezCurl',
  },
  'Preacher Curl': {
    'EZ Bar': 'ezCurl',
  },
  'Reverse Curl': {
    'Barbell': 'olympic',
    'EZ Bar': 'ezCurl',
  },
  'Spider Curl': {
    'EZ Bar': 'ezCurl',
  },

  // TRICEPS
  'Overhead Tricep Extension': {
    'EZ Bar': 'ezCurl',
  },
  'Skull Crusher': {
    'EZ Bar': 'ezCurl',
    'Barbell': 'olympic',
  },
  'Close Grip Bench Press': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },

  // LEGS
  'Standing Calf Raise': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Squat': {
    'Barbell Back': 'olympic',
    'Smith Machine': 'smith',
  },
  'Hang Clean': {
    'Barbell': 'olympic',
  },
  'Hip Thrust': {
    'Barbell': 'olympic',
  },
  'Hack Squat': {
    'Barbell Reverse': 'olympic',
  },
  'Lunges': {
    'Barbell Walking': 'olympic',
  },
  'Deadlift': {
    'Barbell Conventional': 'olympic',
    'Barbell Sumo': 'olympic',
    'Trap Bar': 'trap',
    'Barbell Romanian': 'olympic',
  },
  'Bulgarian Split Squat': {
    'Barbell': 'olympic',
  },
  'Front Squat': {
    'Barbell': 'olympic',
    'Smith Machine': 'smith',
  },
  'Step-Ups': {
    'Barbell': 'olympic',
  },
  'Glute Bridge': {
    'Barbell': 'olympic',
  },
  'Romanian Deadlift': {
    'Barbell': 'olympic',
  },

  // ABS
  'Ab Wheel Rollout': {
    'Barbell Rollout': 'olympic',
  },

  // FOREARMS
  'Wrist Curl': {
    'Barbell': 'olympic',
  },
  'Reverse Wrist Curl': {
    'Barbell': 'olympic',
    'EZ Bar': 'ezCurl',
  },
  "Farmer's Walk": {
    'Trap Bar': 'trap',
  },
};

/**
 * Extract base exercise name from formatted name like "Bench Press (Barbell)"
 * @param {string} fullName - Full exercise name with equipment in parentheses
 * @returns {string} Base exercise name
 */
function extractBaseName(fullName) {
  // Check if name has format "Exercise Name (Equipment)"
  const match = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return match[1].trim();
  }
  return fullName;
}

/**
 * Extract equipment from formatted name like "Bench Press (Barbell)"
 * @param {string} fullName - Full exercise name with equipment in parentheses
 * @returns {string|null} Equipment name or null
 */
function extractEquipmentFromName(fullName) {
  const match = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return match[2].trim();
  }
  return null;
}

/**
 * Get bar type for a given exercise and equipment
 * @param {string} exerciseName - Name of the exercise (can be "Bench Press" or "Bench Press (Barbell)")
 * @param {string} equipment - Equipment variant
 * @returns {string|null} Bar type key or null if not a barbell exercise
 */
export function getBarType(exerciseName, equipment) {
  // First try the full name as-is
  let exerciseMapping = EXERCISE_BAR_MAPPING[exerciseName];

  // If not found, try extracting base name
  if (!exerciseMapping) {
    const baseName = extractBaseName(exerciseName);
    exerciseMapping = EXERCISE_BAR_MAPPING[baseName];
  }

  if (!exerciseMapping) return null;

  // Try the provided equipment first
  if (exerciseMapping[equipment]) {
    return exerciseMapping[equipment];
  }

  // If equipment not found, try extracting from exercise name
  const equipmentFromName = extractEquipmentFromName(exerciseName);
  if (equipmentFromName && exerciseMapping[equipmentFromName]) {
    return exerciseMapping[equipmentFromName];
  }

  return null;
}

/**
 * Get bar weight for a given bar type
 * @param {string} barType - Bar type key
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {number} Bar weight
 */
export function getBarWeight(barType, unit = 'lbs') {
  const bar = BAR_TYPES[barType];
  if (!bar) return 0;
  return unit === 'kg' ? bar.weightKg : bar.weight;
}

/**
 * Check if an exercise uses a barbell/plates
 * @param {string} exerciseName - Name of the exercise (can be "Bench Press" or "Bench Press (Barbell)")
 * @param {string} equipment - Equipment variant
 * @returns {boolean}
 */
export function usesBarbellPlates(exerciseName, equipment) {
  return getBarType(exerciseName, equipment) !== null;
}

/**
 * Get the base exercise name (without equipment suffix)
 * @param {string} fullName - Full exercise name
 * @returns {string} Base name
 */
export function getBaseExerciseName(fullName) {
  return extractBaseName(fullName);
}

export default {
  BAR_TYPES,
  PLATE_WEIGHTS,
  DEFAULT_AVAILABLE_PLATES,
  PLATE_COLORS,
  PLATE_SIZES,
  EXERCISE_BAR_MAPPING,
  getBarType,
  getBarWeight,
  usesBarbellPlates,
};
