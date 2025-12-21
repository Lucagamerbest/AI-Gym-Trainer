/**
 * Cardio Calorie Calculator Service
 * Uses MET (Metabolic Equivalent of Task) values for accurate calorie calculations
 *
 * Formula: Calories/min = (MET × 3.5 × weight_kg) / 200
 */

// ============================================
// BMR & TDEE CALCULATIONS (Passive Calorie Burn)
// ============================================

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation (most accurate)
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'male', 'female', or 'other'
 * @returns {number} BMR in calories per day
 */
export function calculateBMR(weightKg, heightCm, age, gender) {
  if (!weightKg || !heightCm || !age) return 0;

  // Mifflin-St Jeor Equation
  // Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  // Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

  const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age);

  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else if (gender === 'female') {
    return Math.round(baseBMR - 161);
  } else {
    // For 'other' or unspecified, use average of male/female
    return Math.round(baseBMR - 78);
  }
}

/**
 * Activity level multipliers for TDEE calculation
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little or no exercise, desk job
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Hard exercise 6-7 days/week
  veryActive: 1.9,     // Very hard exercise, physical job + training
};

/**
 * Calculate Total Daily Energy Expenditure
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - One of: sedentary, light, moderate, active, veryActive
 * @returns {number} TDEE in calories per day
 */
export function calculateTDEE(bmr, activityLevel = 'sedentary') {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.sedentary;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate calories burned per hour (passive/resting)
 * @param {number} bmr - Basal Metabolic Rate (daily)
 * @returns {number} Calories burned per hour
 */
export function getCaloriesPerHour(bmr) {
  return bmr / 24;
}

/**
 * Calculate calories burned per minute (passive/resting)
 * @param {number} bmr - Basal Metabolic Rate (daily)
 * @returns {number} Calories burned per minute
 */
export function getCaloriesPerMinute(bmr) {
  return bmr / 24 / 60;
}

/**
 * Calculate passive calories burned so far today based on current time
 * @param {number} bmr - Basal Metabolic Rate (daily)
 * @returns {number} Calories burned since midnight (rounded to nearest 5)
 */
export function getPassiveCaloriesBurnedToday(bmr) {
  if (!bmr) return 0;

  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const secondsSinceMidnight = (now - midnight) / 1000;

  // Calculate calories per second for real-time updates
  const caloriesPerSecond = bmr / 24 / 60 / 60;
  const totalCalories = caloriesPerSecond * secondsSinceMidnight;

  // Round to nearest 5 calories for cleaner display
  return Math.floor(totalCalories / 5) * 5;
}

/**
 * Get user's activity level from occupation/workout frequency
 * @param {string} occupation - 'sedentary', 'active', 'physical-labor'
 * @param {number} workoutDaysPerWeek - Number of workout days per week
 * @returns {string} Activity level key
 */
export function getActivityLevel(occupation, workoutDaysPerWeek = 0) {
  // Base on occupation
  let baseLevel = 0;
  if (occupation === 'sedentary') baseLevel = 0;
  else if (occupation === 'active') baseLevel = 1;
  else if (occupation === 'physical-labor') baseLevel = 2;

  // Add workout frequency
  let workoutBonus = 0;
  if (workoutDaysPerWeek >= 6) workoutBonus = 2;
  else if (workoutDaysPerWeek >= 3) workoutBonus = 1;

  const totalLevel = Math.min(baseLevel + workoutBonus, 4);

  const levels = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];
  return levels[totalLevel];
}

// ============================================
// END BMR & TDEE CALCULATIONS
// ============================================

// Exercise type configurations with input fields and MET calculations
export const CARDIO_EXERCISE_CONFIG = {
  'cardio-1': { // Treadmill
    name: 'Treadmill',
    primaryInput: { key: 'speed', label: 'Speed', unit: 'mph', placeholder: '5.0', min: 0, max: 15 },
    secondaryInput: { key: 'incline', label: 'Incline', unit: '%', placeholder: '0', min: 0, max: 30 },
  },
  'cardio-2': { // Stationary Bike
    name: 'Stationary Bike',
    primaryInput: { key: 'rpm', label: 'RPM', unit: 'rpm', placeholder: '80', min: 30, max: 150 },
    secondaryInput: { key: 'resistance', label: 'Resist', unit: 'lvl', placeholder: '5', min: 1, max: 20 },
  },
  'cardio-3': { // Rowing Machine
    name: 'Rowing Machine',
    primaryInput: { key: 'strokes', label: 'Strokes', unit: 'spm', placeholder: '24', min: 15, max: 40 },
    secondaryInput: { key: 'damper', label: 'Damper', unit: '', placeholder: '5', min: 1, max: 10 },
  },
  'cardio-4': { // Elliptical
    name: 'Elliptical',
    primaryInput: { key: 'strides', label: 'Strides', unit: 'spm', placeholder: '140', min: 80, max: 200 },
    secondaryInput: { key: 'resistance', label: 'Resist', unit: 'lvl', placeholder: '5', min: 1, max: 20 },
  },
  'cardio-5': { // Jump Rope
    name: 'Jump Rope',
    primaryInput: { key: 'jumps', label: 'Jumps', unit: '/min', placeholder: '100', min: 50, max: 200 },
    secondaryInput: null,
  },
  'cardio-6': { // Stair Climber
    name: 'Stair Climber',
    primaryInput: { key: 'steps', label: 'Steps', unit: 'spm', placeholder: '60', min: 20, max: 150 },
    secondaryInput: { key: 'resistance', label: 'Resist', unit: 'lvl', placeholder: '5', min: 1, max: 20 },
  },
  'cardio-7': { // Burpees
    name: 'Burpees',
    primaryInput: { key: 'reps', label: 'Reps', unit: '/min', placeholder: '10', min: 5, max: 30 },
    secondaryInput: null,
  },
};

/**
 * Get MET value for Treadmill based on speed and incline
 * Based on ACSM metabolic equations and Compendium of Physical Activities
 */
function getTreadmillMET(speed, incline) {
  const speedMph = parseFloat(speed) || 0;
  const inclinePercent = parseFloat(incline) || 0;

  if (speedMph <= 0) return 1.0; // Resting

  let baseMET;

  // Walking speeds (< 4.5 mph)
  if (speedMph < 2.0) {
    baseMET = 2.0;
  } else if (speedMph < 2.5) {
    baseMET = 2.5;
  } else if (speedMph < 3.0) {
    baseMET = 2.8;
  } else if (speedMph < 3.5) {
    baseMET = 3.3;
  } else if (speedMph < 4.0) {
    baseMET = 3.8;
  } else if (speedMph < 4.5) {
    baseMET = 4.3;
  }
  // Running speeds (>= 4.5 mph)
  else if (speedMph < 5.0) {
    baseMET = 6.0;
  } else if (speedMph < 5.5) {
    baseMET = 8.3;
  } else if (speedMph < 6.0) {
    baseMET = 9.0;
  } else if (speedMph < 6.5) {
    baseMET = 9.8;
  } else if (speedMph < 7.0) {
    baseMET = 10.5;
  } else if (speedMph < 7.5) {
    baseMET = 11.0;
  } else if (speedMph < 8.0) {
    baseMET = 11.5;
  } else if (speedMph < 9.0) {
    baseMET = 12.3;
  } else if (speedMph < 10.0) {
    baseMET = 14.5;
  } else {
    // Above 10 mph, linear increase
    baseMET = 14.5 + (speedMph - 10) * 1.0;
  }

  // Incline modifier: approximately +0.1 MET per 1% grade for walking, more for running
  const inclineMultiplier = speedMph < 4.5 ? 0.1 : 0.15;
  const inclineBonus = inclinePercent * inclineMultiplier;

  return baseMET + inclineBonus;
}

/**
 * Get MET value for Stationary Bike based on RPM and resistance
 */
function getBikeMET(rpm, resistance) {
  const cadence = parseFloat(rpm) || 80;
  const resistLevel = parseFloat(resistance) || 5;

  // Base MET from cadence (watts approximation)
  // Light cycling: 50-60 rpm = 4-5 MET
  // Moderate: 60-80 rpm = 5-7 MET
  // Vigorous: 80-100 rpm = 7-10 MET
  // Very hard: 100+ rpm = 10-14 MET

  let baseMET;
  if (cadence < 50) {
    baseMET = 3.5;
  } else if (cadence < 60) {
    baseMET = 4.5;
  } else if (cadence < 70) {
    baseMET = 5.5;
  } else if (cadence < 80) {
    baseMET = 6.5;
  } else if (cadence < 90) {
    baseMET = 7.5;
  } else if (cadence < 100) {
    baseMET = 8.5;
  } else if (cadence < 110) {
    baseMET = 10.0;
  } else {
    baseMET = 11.0 + (cadence - 110) * 0.05;
  }

  // Resistance modifier: each level adds ~0.25 MET above baseline (level 5)
  const resistanceBonus = (resistLevel - 5) * 0.25;

  return Math.max(3.0, baseMET + resistanceBonus);
}

/**
 * Get MET value for Rowing Machine based on strokes per minute and damper
 */
function getRowingMET(strokes, damper) {
  const spm = parseFloat(strokes) || 24;
  const damperSetting = parseFloat(damper) || 5;

  // Rowing MET values:
  // Light (18-20 spm): 4.8 MET
  // Moderate (20-24 spm): 7.0 MET
  // Vigorous (24-28 spm): 8.5 MET
  // Very hard (28+ spm): 12.0 MET

  let baseMET;
  if (spm < 18) {
    baseMET = 4.0;
  } else if (spm < 20) {
    baseMET = 4.8;
  } else if (spm < 22) {
    baseMET = 6.0;
  } else if (spm < 24) {
    baseMET = 7.0;
  } else if (spm < 26) {
    baseMET = 7.8;
  } else if (spm < 28) {
    baseMET = 8.5;
  } else if (spm < 30) {
    baseMET = 10.0;
  } else {
    baseMET = 12.0 + (spm - 30) * 0.15;
  }

  // Damper modifier: higher damper = more resistance, each point adds ~0.2 MET above baseline (5)
  const damperBonus = (damperSetting - 5) * 0.2;

  return Math.max(3.5, baseMET + damperBonus);
}

/**
 * Get MET value for Elliptical based on strides per minute and resistance
 */
function getEllipticalMET(strides, resistance) {
  const spm = parseFloat(strides) || 140;
  const resistLevel = parseFloat(resistance) || 5;

  // Elliptical MET values:
  // Light (< 100 spm): 4.0-5.0 MET
  // Moderate (100-140 spm): 5.0-7.0 MET
  // Vigorous (140-180 spm): 7.0-10.0 MET
  // Very hard (180+ spm): 10.0-12.0 MET

  let baseMET;
  if (spm < 100) {
    baseMET = 4.5;
  } else if (spm < 120) {
    baseMET = 5.5;
  } else if (spm < 140) {
    baseMET = 6.5;
  } else if (spm < 160) {
    baseMET = 7.5;
  } else if (spm < 180) {
    baseMET = 9.0;
  } else {
    baseMET = 10.5 + (spm - 180) * 0.03;
  }

  // Resistance modifier
  const resistanceBonus = (resistLevel - 5) * 0.2;

  return Math.max(3.5, baseMET + resistanceBonus);
}

/**
 * Get MET value for Jump Rope based on jumps per minute
 */
function getJumpRopeMET(jumps) {
  const jpm = parseFloat(jumps) || 100;

  // Jump rope MET values:
  // Slow (< 80 jpm): 8.0 MET
  // Moderate (80-100 jpm): 10.0 MET
  // Fast (100-120 jpm): 11.5 MET
  // Very fast (120+ jpm): 12.3 MET

  if (jpm < 60) {
    return 7.0;
  } else if (jpm < 80) {
    return 8.0;
  } else if (jpm < 100) {
    return 10.0;
  } else if (jpm < 120) {
    return 11.5;
  } else if (jpm < 140) {
    return 12.3;
  } else {
    return 13.0 + (jpm - 140) * 0.02;
  }
}

/**
 * Get MET value for Stair Climber based on steps per minute and resistance
 */
function getStairClimberMET(steps, resistance) {
  const spm = parseFloat(steps) || 60;
  const resistLevel = parseFloat(resistance) || 5;

  // Stair climbing MET values:
  // Slow (< 40 spm): 4.0-5.0 MET
  // Moderate (40-80 spm): 6.0-9.0 MET
  // Fast (80-120 spm): 9.0-12.0 MET

  let baseMET;
  if (spm < 30) {
    baseMET = 4.0;
  } else if (spm < 50) {
    baseMET = 5.5;
  } else if (spm < 70) {
    baseMET = 7.0;
  } else if (spm < 90) {
    baseMET = 8.5;
  } else if (spm < 110) {
    baseMET = 10.0;
  } else {
    baseMET = 11.5 + (spm - 110) * 0.03;
  }

  // Resistance modifier
  const resistanceBonus = (resistLevel - 5) * 0.2;

  return Math.max(3.5, baseMET + resistanceBonus);
}

/**
 * Get MET value for Burpees based on reps per minute
 */
function getBurpeesMET(reps) {
  const rpm = parseFloat(reps) || 10;

  // Burpees are high intensity by nature
  // Slow (< 8 rpm): 8.0 MET
  // Moderate (8-12 rpm): 10.0 MET
  // Fast (12-15 rpm): 12.0 MET
  // Very fast (15+ rpm): 14.0+ MET

  if (rpm < 6) {
    return 7.0;
  } else if (rpm < 8) {
    return 8.0;
  } else if (rpm < 10) {
    return 9.5;
  } else if (rpm < 12) {
    return 10.5;
  } else if (rpm < 15) {
    return 12.0;
  } else {
    return 14.0 + (rpm - 15) * 0.2;
  }
}

/**
 * Calculate MET value for a cardio exercise based on its ID and inputs
 * @param {string} exerciseId - The exercise ID (e.g., 'cardio-1')
 * @param {object} inputs - Object containing primary and secondary input values
 * @returns {number} MET value
 */
export function calculateMET(exerciseId, inputs = {}) {
  const { primary, secondary } = inputs;

  switch (exerciseId) {
    case 'cardio-1': // Treadmill
      return getTreadmillMET(primary, secondary);
    case 'cardio-2': // Stationary Bike
      return getBikeMET(primary, secondary);
    case 'cardio-3': // Rowing Machine
      return getRowingMET(primary, secondary);
    case 'cardio-4': // Elliptical
      return getEllipticalMET(primary, secondary);
    case 'cardio-5': // Jump Rope
      return getJumpRopeMET(primary);
    case 'cardio-6': // Stair Climber
      return getStairClimberMET(primary, secondary);
    case 'cardio-7': // Burpees
      return getBurpeesMET(primary);
    default:
      // For unknown cardio exercises, return a moderate default
      return 5.0;
  }
}

/**
 * Calculate calories burned per minute
 * @param {number} met - MET value for the activity
 * @param {number} weightKg - User's weight in kg
 * @returns {number} Calories burned per minute
 */
export function calculateCaloriesPerMinute(met, weightKg) {
  if (!met || !weightKg || weightKg <= 0) return 0;
  // Formula: Calories/min = (MET × 3.5 × weight_kg) / 200
  return (met * 3.5 * weightKg) / 200;
}

/**
 * Calculate total calories burned for a cardio session
 * @param {string} exerciseId - The exercise ID
 * @param {object} inputs - Input values (primary, secondary)
 * @param {number} durationSeconds - Duration in seconds
 * @param {number} weightKg - User's weight in kg
 * @returns {number} Total calories burned (rounded to 1 decimal)
 */
export function calculateTotalCalories(exerciseId, inputs, durationSeconds, weightKg) {
  if (!durationSeconds || durationSeconds <= 0 || !weightKg) return 0;

  const met = calculateMET(exerciseId, inputs);
  const caloriesPerMin = calculateCaloriesPerMinute(met, weightKg);
  const durationMinutes = durationSeconds / 60;

  return Math.round(caloriesPerMin * durationMinutes * 10) / 10;
}

/**
 * Convert weight from lbs to kg
 * @param {number} weightLbs - Weight in pounds
 * @returns {number} Weight in kg
 */
export function lbsToKg(weightLbs) {
  return weightLbs * 0.453592;
}

/**
 * Get the cardio exercise config by ID
 * Also checks for name-based detection if ID doesn't match
 * @param {object} exercise - Exercise object with id and/or name
 * @returns {object|null} Exercise config or null if not found
 */
export function getCardioConfig(exercise) {
  if (!exercise) return null;

  // First try by ID
  if (exercise.id && CARDIO_EXERCISE_CONFIG[exercise.id]) {
    return CARDIO_EXERCISE_CONFIG[exercise.id];
  }

  // Try by name matching
  const name = (exercise.name || '').toLowerCase();

  if (name.includes('treadmill') || name.includes('running') || name.includes('walking') || name.includes('jogging')) {
    return CARDIO_EXERCISE_CONFIG['cardio-1'];
  }
  if (name.includes('bike') || name.includes('cycling') || name.includes('biking')) {
    return CARDIO_EXERCISE_CONFIG['cardio-2'];
  }
  if (name.includes('rowing') || name.includes('row')) {
    return CARDIO_EXERCISE_CONFIG['cardio-3'];
  }
  if (name.includes('elliptical')) {
    return CARDIO_EXERCISE_CONFIG['cardio-4'];
  }
  if (name.includes('jump rope') || name.includes('skipping')) {
    return CARDIO_EXERCISE_CONFIG['cardio-5'];
  }
  if (name.includes('stair') || name.includes('stepper')) {
    return CARDIO_EXERCISE_CONFIG['cardio-6'];
  }
  if (name.includes('burpee')) {
    return CARDIO_EXERCISE_CONFIG['cardio-7'];
  }

  return null;
}

/**
 * Get the exercise ID for a cardio exercise (handles name-based detection)
 * @param {object} exercise - Exercise object
 * @returns {string|null} Exercise ID or null
 */
export function getCardioExerciseId(exercise) {
  if (!exercise) return null;

  // First try by ID
  if (exercise.id && CARDIO_EXERCISE_CONFIG[exercise.id]) {
    return exercise.id;
  }

  // Try by name matching
  const name = (exercise.name || '').toLowerCase();

  if (name.includes('treadmill') || name.includes('running') || name.includes('walking') || name.includes('jogging')) {
    return 'cardio-1';
  }
  if (name.includes('bike') || name.includes('cycling') || name.includes('biking')) {
    return 'cardio-2';
  }
  if (name.includes('rowing') || name.includes('row')) {
    return 'cardio-3';
  }
  if (name.includes('elliptical')) {
    return 'cardio-4';
  }
  if (name.includes('jump rope') || name.includes('skipping')) {
    return 'cardio-5';
  }
  if (name.includes('stair') || name.includes('stepper')) {
    return 'cardio-6';
  }
  if (name.includes('burpee')) {
    return 'cardio-7';
  }

  return null;
}

export default {
  // Cardio calorie functions
  CARDIO_EXERCISE_CONFIG,
  calculateMET,
  calculateCaloriesPerMinute,
  calculateTotalCalories,
  lbsToKg,
  getCardioConfig,
  getCardioExerciseId,
  // BMR/TDEE functions
  calculateBMR,
  calculateTDEE,
  getCaloriesPerHour,
  getCaloriesPerMinute,
  getPassiveCaloriesBurnedToday,
  getActivityLevel,
  ACTIVITY_MULTIPLIERS,
};
