/**
 * Proven Workout Programs & Templates
 *
 * These are scientifically-proven, time-tested workout programs used by
 * millions of lifters. The AI should use these as references for optimal
 * exercise selection and programming.
 *
 * Sources: Starting Strength, 5/3/1, nSuns, PPL, PHUL, PHAT
 */

/**
 * TIER SYSTEM FOR EXERCISE SELECTION
 * The AI should prioritize exercises in this order
 */
export const EXERCISE_TIERS = {
  // TIER S: Essential compound movements - ALWAYS include these first
  TIER_S: {
    push: [
      'Bench Press', 'Barbell Bench Press', 'Flat Bench Press',
      'Overhead Press', 'Military Press', 'Shoulder Press',
      'Incline Bench Press', 'Incline Press',
      'Dips', 'Weighted Dips'
    ],
    pull: [
      'Pull-up', 'Weighted Pull-up', 'Chin-up',
      'Barbell Row', 'Bent Over Row', 'Pendlay Row',
      'Deadlift', 'Conventional Deadlift',
      'Lat Pulldown', 'Wide Grip Lat Pulldown'
    ],
    legs: [
      'Squat', 'Back Squat', 'Barbell Squat',
      'Front Squat',
      'Deadlift', 'Romanian Deadlift', 'RDL',
      'Leg Press',
      'Bulgarian Split Squat', 'Split Squat'
    ]
  },

  // TIER A: Excellent accessory compounds - fill program with these
  TIER_A: {
    push: [
      'Dumbbell Bench Press', 'DB Bench Press',
      'Dumbbell Shoulder Press', 'DB Shoulder Press',
      'Close Grip Bench Press', 'CGBP',
      'Decline Bench Press',
      'Incline Dumbbell Press',
      'Chest Press Machine'
    ],
    pull: [
      'T-Bar Row', 'T Bar Row',
      'Cable Row', 'Seated Cable Row',
      'Dumbbell Row', 'Single Arm Dumbbell Row',
      'Face Pull', 'Cable Face Pull',
      'Chest Supported Row',
      'Shrug', 'Barbell Shrug'
    ],
    legs: [
      'Hack Squat',
      'Sumo Deadlift',
      'Walking Lunge', 'Lunge',
      'Leg Curl', 'Lying Leg Curl', 'Seated Leg Curl',
      'Hip Thrust', 'Barbell Hip Thrust',
      'Leg Extension'
    ]
  },

  // TIER B: Good isolation movements - use to finish workout
  TIER_B: {
    push: [
      'Cable Fly', 'Cable Flyes', 'Chest Flyes',
      'Lateral Raise', 'Dumbbell Lateral Raise',
      'Tricep Pushdown', 'Cable Tricep Pushdown',
      'Overhead Tricep Extension',
      'Skull Crusher', 'Lying Tricep Extension',
      'Front Raise'
    ],
    pull: [
      'Bicep Curl', 'Barbell Curl', 'Dumbbell Curl',
      'Hammer Curl', 'Dumbbell Hammer Curl',
      'Preacher Curl',
      'Reverse Fly', 'Rear Delt Fly',
      'Cable Curl',
      'Concentration Curl'
    ],
    legs: [
      'Calf Raise', 'Standing Calf Raise', 'Seated Calf Raise',
      'Glute Bridge',
      'Goblet Squat',
      'Step Up', 'Dumbbell Step Up',
      'Good Morning'
    ]
  }
};

/**
 * PROVEN PUSH/PULL/LEGS TEMPLATE
 * Used by millions of lifters, proven to work
 */
export const CLASSIC_PPL = {
  name: 'Classic Push/Pull/Legs',
  description: 'The most popular intermediate split. Train each muscle 2x/week.',
  frequency: '6 days/week (or 3 days for beginners)',

  PUSH_DAY: {
    goal: 'Build chest, shoulders, and triceps',
    exercises: [
      // CHEST COMPOUNDS (2-3 exercises)
      { name: 'Bench Press', sets: '4', reps: '5-8', notes: 'Primary chest builder' },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '8-12', notes: 'Upper chest focus' },

      // SHOULDER COMPOUNDS (1-2 exercises)
      { name: 'Overhead Press', sets: '3', reps: '6-10', notes: 'Primary shoulder builder' },
      { name: 'Lateral Raise', sets: '3', reps: '12-15', notes: 'Side delt isolation' },

      // TRICEP WORK (2 exercises)
      { name: 'Tricep Pushdown', sets: '3', reps: '10-15', notes: 'Tricep isolation' },
      { name: 'Overhead Tricep Extension', sets: '3', reps: '10-12', notes: 'Long head focus' }
    ]
  },

  PULL_DAY: {
    goal: 'Build back, rear delts, and biceps',
    exercises: [
      // VERTICAL PULL (1-2 exercises)
      { name: 'Pull-up', sets: '3', reps: '6-10', notes: 'Best back builder' },
      { name: 'Lat Pulldown', sets: '3', reps: '8-12', notes: 'Lat focus' },

      // HORIZONTAL PULL (2 exercises)
      { name: 'Barbell Row', sets: '4', reps: '6-10', notes: 'Primary back thickness' },
      { name: 'Cable Row', sets: '3', reps: '10-12', notes: 'Mid-back focus' },

      // REAR DELT + BICEPS
      { name: 'Face Pull', sets: '3', reps: '15-20', notes: 'Rear delt health' },
      { name: 'Barbell Curl', sets: '3', reps: '8-12', notes: 'Bicep mass' },
      { name: 'Hammer Curl', sets: '3', reps: '10-15', notes: 'Brachialis focus' }
    ]
  },

  LEG_DAY: {
    goal: 'Build quads, hamstrings, and glutes',
    exercises: [
      // QUAD DOMINANT (2 exercises)
      { name: 'Squat', sets: '4', reps: '5-8', notes: 'King of leg exercises' },
      { name: 'Leg Press', sets: '3', reps: '10-15', notes: 'Quad volume' },

      // HAMSTRING/GLUTE DOMINANT (2 exercises)
      { name: 'Romanian Deadlift', sets: '3', reps: '8-12', notes: 'Best hamstring builder' },
      { name: 'Leg Curl', sets: '3', reps: '10-15', notes: 'Hamstring isolation' },

      // ACCESSORIES
      { name: 'Leg Extension', sets: '3', reps: '12-15', notes: 'Quad isolation' },
      { name: 'Calf Raise', sets: '4', reps: '15-20', notes: 'Calf development' }
    ]
  }
};

/**
 * BEGINNER PROGRAM - Starting Strength Style
 * 3 days/week, full body, focus on compounds
 */
export const BEGINNER_FULLBODY = {
  name: 'Beginner Full Body (Starting Strength Style)',
  description: 'Perfect for beginners. Focus on mastering the big 5 lifts with progressive overload.',
  frequency: '3 days/week (Mon/Wed/Fri)',

  WORKOUT_A: {
    exercises: [
      { name: 'Squat', sets: '3', reps: '5', notes: 'Add 5lbs every workout' },
      { name: 'Bench Press', sets: '3', reps: '5', notes: 'Add 5lbs every workout' },
      { name: 'Barbell Row', sets: '3', reps: '5', notes: 'Add 5lbs every workout' }
    ]
  },

  WORKOUT_B: {
    exercises: [
      { name: 'Squat', sets: '3', reps: '5', notes: 'Add 5lbs every workout' },
      { name: 'Overhead Press', sets: '3', reps: '5', notes: 'Add 2.5lbs every workout' },
      { name: 'Deadlift', sets: '1', reps: '5', notes: 'Add 10lbs every workout' }
    ]
  }
};

/**
 * UPPER/LOWER SPLIT (4-day)
 * Great for intermediates who want more frequency
 */
export const UPPER_LOWER_4DAY = {
  name: 'Upper/Lower 4-Day Split',
  description: 'Train upper and lower body 2x/week each. Great for strength and size.',
  frequency: '4 days/week',

  UPPER_POWER: {
    goal: 'Heavy compound work for upper body',
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '3-5', notes: 'Heavy weight' },
      { name: 'Barbell Row', sets: '4', reps: '3-5', notes: 'Heavy weight' },
      { name: 'Overhead Press', sets: '3', reps: '5-8', notes: 'Moderate weight' },
      { name: 'Pull-up', sets: '3', reps: '6-10', notes: 'Weighted if possible' },
      { name: 'Dips', sets: '3', reps: '6-10', notes: 'Weighted if possible' }
    ]
  },

  LOWER_POWER: {
    goal: 'Heavy compound work for lower body',
    exercises: [
      { name: 'Squat', sets: '4', reps: '3-5', notes: 'Heavy weight' },
      { name: 'Romanian Deadlift', sets: '3', reps: '5-8', notes: 'Moderate weight' },
      { name: 'Leg Press', sets: '3', reps: '10-15', notes: 'Volume work' },
      { name: 'Leg Curl', sets: '3', reps: '8-12', notes: 'Hamstring focus' },
      { name: 'Calf Raise', sets: '4', reps: '12-15', notes: 'Calf development' }
    ]
  },

  UPPER_HYPERTROPHY: {
    goal: 'Volume work for upper body muscle growth',
    exercises: [
      { name: 'Incline Dumbbell Press', sets: '4', reps: '8-12', notes: 'Chest focus' },
      { name: 'Cable Row', sets: '4', reps: '8-12', notes: 'Back focus' },
      { name: 'Dumbbell Shoulder Press', sets: '3', reps: '8-12', notes: 'Shoulder focus' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-15', notes: 'Lat focus' },
      { name: 'Cable Fly', sets: '3', reps: '12-15', notes: 'Chest isolation' },
      { name: 'Lateral Raise', sets: '3', reps: '12-15', notes: 'Side delt' }
    ]
  },

  LOWER_HYPERTROPHY: {
    goal: 'Volume work for lower body muscle growth',
    exercises: [
      { name: 'Front Squat', sets: '4', reps: '8-12', notes: 'Quad focus' },
      { name: 'Deadlift', sets: '3', reps: '5-8', notes: 'Moderate weight' },
      { name: 'Bulgarian Split Squat', sets: '3', reps: '10-12', notes: 'Per leg' },
      { name: 'Leg Extension', sets: '3', reps: '12-15', notes: 'Quad isolation' },
      { name: 'Seated Leg Curl', sets: '3', reps: '12-15', notes: 'Hamstring isolation' },
      { name: 'Calf Raise', sets: '4', reps: '15-20', notes: 'Calf development' }
    ]
  }
};

/**
 * 10 WEEK MASS BUILDING PROGRAM (4-day)
 * From MuscleAndStrength.com - Proven program for muscle mass
 * Uses progressive overload with decreasing reps
 */
export const TEN_WEEK_MASS = {
  name: '10 Week Mass Building',
  description: 'Advanced 4-day split focusing on mass gain. Uses progressive overload (10, 8, 8, 6 reps).',
  frequency: '4 days/week',
  goal: 'Build maximum muscle mass',
  source: 'MuscleAndStrength.com',

  CHEST_TRICEPS: {
    day: 'Monday',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '10, 8, 8, 6', notes: 'Add weight each set' },
      { name: 'Incline Bench Press', sets: 3, reps: '8, 8, 6', notes: 'Progressive overload' },
      { name: 'Decline Bench Press', sets: 3, reps: '8, 8, 6', notes: 'Progressive overload' },
      { name: 'Dumbbell Flys', sets: 2, reps: '10', notes: 'Chest stretch' },
      { name: 'Dumbbell Pullover', sets: 2, reps: '8', notes: 'Chest/lat stretch' },
      { name: 'Tricep Extension', sets: 4, reps: '10, 8, 8, 6', notes: 'Add weight each set' },
      { name: 'Tricep Dip', sets: 3, reps: '10', notes: 'Bodyweight or weighted' },
      { name: 'Tricep Bench Dip', sets: 3, reps: '8', notes: 'Bodyweight' }
    ]
  },

  BACK_BICEPS: {
    day: 'Tuesday',
    exercises: [
      { name: 'Deadlift', sets: 5, reps: '10, 8, 8, 6, 4', notes: 'Heavy progressive overload' },
      { name: 'Chin Up', sets: 2, reps: '8', notes: 'Weighted if possible' },
      { name: 'One Arm Dumbbell Row', sets: 3, reps: '8', notes: 'Per arm' },
      { name: 'Seated Row', sets: 2, reps: '8', notes: 'Cable or machine' },
      { name: 'Close Grip Lat Pull Down', sets: 3, reps: '10, 10, 8', notes: 'Focus on lats' },
      { name: 'Standing Barbell Curl', sets: 3, reps: '8, 8, 6', notes: 'Progressive overload' },
      { name: 'Close Grip Preacher Curl', sets: 3, reps: '8, 8, 6', notes: 'Isolation focus' },
      { name: 'Incline Dumbbell Curl', sets: 2, reps: '12-14', notes: 'Stretch position' },
      { name: 'Concentration Curl', sets: 2, reps: '10', notes: 'Peak contraction' }
    ]
  },

  SHOULDERS_FOREARMS: {
    day: 'Thursday',
    exercises: [
      { name: 'Machine Shoulder Press', sets: 3, reps: '10', notes: 'Warm-up first' },
      { name: 'Dumbbell Reverse Fly', sets: 3, reps: '8-10', notes: 'Rear delts' },
      { name: 'Military Press', sets: 4, reps: '10', notes: 'Standing or seated' },
      { name: 'Dumbbell Lateral Raise', sets: 2, reps: '10', notes: 'Side delts' },
      { name: 'Dumbbell Shrugs', sets: 2, reps: '10', notes: 'Can superset with upright row' },
      { name: 'Upright Row', sets: 2, reps: '10', notes: 'Can superset with shrugs' },
      { name: 'Standing Wrist Curl', sets: 4, reps: '10', notes: 'Forearms' },
      { name: 'Barbell Wrist Curl', sets: 4, reps: '10', notes: 'Forearms' }
    ]
  },

  LEGS: {
    day: 'Friday',
    exercises: [
      { name: 'Squat', sets: 5, reps: '10, 8, 8, 6, 4', notes: 'Heavy progressive overload' },
      { name: 'Leg Extension', sets: 3, reps: '12', notes: 'Quad isolation' },
      { name: 'Leg Curl', sets: 3, reps: '12', notes: 'Hamstring isolation' },
      { name: 'Standing Calf Raise', sets: 4, reps: '12', notes: 'Calf development' },
      { name: 'Seated Calf Raise', sets: 2, reps: '12', notes: 'Soleus focus' }
    ]
  }
};

/**
 * BRO SPLIT (5-day) - For advanced lifters
 * Each muscle gets one day per week
 */
export const BRO_SPLIT_5DAY = {
  name: 'Bro Split (5-Day)',
  description: 'Classic bodybuilding split. One muscle group per day with high volume.',
  frequency: '5 days/week',
  note: 'Best for advanced lifters who can handle high volume',

  CHEST_DAY: {
    exercises: [
      { name: 'Bench Press', sets: '4', reps: '6-10', notes: 'Heavy compound' },
      { name: 'Incline Dumbbell Press', sets: '4', reps: '8-12', notes: 'Upper chest' },
      { name: 'Decline Press', sets: '3', reps: '8-12', notes: 'Lower chest' },
      { name: 'Cable Fly', sets: '3', reps: '12-15', notes: 'Chest stretch' },
      { name: 'Dips', sets: '3', reps: '8-12', notes: 'Chest focus' }
    ]
  },

  BACK_DAY: {
    exercises: [
      { name: 'Deadlift', sets: '4', reps: '5-8', notes: 'Heavy compound' },
      { name: 'Pull-up', sets: '4', reps: '6-10', notes: 'Weighted' },
      { name: 'Barbell Row', sets: '4', reps: '8-12', notes: 'Back thickness' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-15', notes: 'Lat focus' },
      { name: 'Cable Row', sets: '3', reps: '10-15', notes: 'Mid-back' },
      { name: 'Face Pull', sets: '3', reps: '15-20', notes: 'Rear delt' }
    ]
  },

  SHOULDER_DAY: {
    exercises: [
      { name: 'Overhead Press', sets: '4', reps: '6-10', notes: 'Heavy compound' },
      { name: 'Dumbbell Shoulder Press', sets: '4', reps: '8-12', notes: 'Volume work' },
      { name: 'Lateral Raise', sets: '4', reps: '12-15', notes: 'Side delt' },
      { name: 'Front Raise', sets: '3', reps: '12-15', notes: 'Front delt' },
      { name: 'Reverse Fly', sets: '3', reps: '12-15', notes: 'Rear delt' }
    ]
  },

  ARM_DAY: {
    exercises: [
      { name: 'Barbell Curl', sets: '4', reps: '8-12', notes: 'Bicep mass' },
      { name: 'Close Grip Bench Press', sets: '4', reps: '6-10', notes: 'Tricep mass' },
      { name: 'Hammer Curl', sets: '3', reps: '10-15', notes: 'Brachialis' },
      { name: 'Tricep Pushdown', sets: '3', reps: '10-15', notes: 'Tricep isolation' },
      { name: 'Preacher Curl', sets: '3', reps: '10-15', notes: 'Bicep peak' },
      { name: 'Overhead Tricep Extension', sets: '3', reps: '10-15', notes: 'Long head' }
    ]
  },

  LEG_DAY: {
    exercises: [
      { name: 'Squat', sets: '4', reps: '5-8', notes: 'Heavy compound' },
      { name: 'Romanian Deadlift', sets: '4', reps: '8-12', notes: 'Hamstring focus' },
      { name: 'Leg Press', sets: '4', reps: '10-15', notes: 'Quad volume' },
      { name: 'Leg Curl', sets: '3', reps: '10-15', notes: 'Hamstring isolation' },
      { name: 'Leg Extension', sets: '3', reps: '12-15', notes: 'Quad isolation' },
      { name: 'Calf Raise', sets: '4', reps: '15-20', notes: 'Calf development' }
    ]
  }
};

/**
 * EXERCISE SELECTION RULES
 * How to build an optimal workout
 */
export const SELECTION_RULES = {
  ALWAYS_START_WITH: [
    // These should ALWAYS be first exercises if doing push/pull/legs
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up'
  ],

  EXERCISE_ORDER: [
    '1. Heavy compound (3-6 reps): Squat, Bench, Deadlift, OHP',
    '2. Medium compound (6-12 reps): Rows, Presses, Leg Press',
    '3. Accessory compound (8-15 reps): Dips, Lunges, RDL',
    '4. Isolation (10-20 reps): Flyes, Curls, Extensions, Raises'
  ],

  MINIMUM_EXERCISES_PER_WORKOUT: {
    push: {
      chest_compounds: 2, // Bench variations
      shoulder_compounds: 1, // OHP or DB Press
      tricep_exercises: 2, // Extensions/Pushdowns
      total_minimum: 5
    },
    pull: {
      vertical_pulls: 1, // Pull-ups/Pulldowns
      horizontal_pulls: 2, // Rows
      bicep_exercises: 2, // Curls
      rear_delt: 1, // Face pulls
      total_minimum: 6
    },
    legs: {
      quad_dominant: 2, // Squats, Leg Press
      hip_hinge: 1, // Deadlifts, RDLs
      isolation: 2, // Leg Curl, Leg Extension
      calves: 1,
      total_minimum: 6
    }
  }
};

/**
 * Helper: Get optimal exercise selection for a split type
 */
export function getOptimalExercises(splitType, goal, experienceLevel) {
  // For beginners, use Starting Strength approach
  if (experienceLevel === 'beginner') {
    return BEGINNER_FULLBODY;
  }

  // For intermediate/advanced, use PPL
  if (splitType === 'push') {
    return CLASSIC_PPL.PUSH_DAY.exercises;
  }
  if (splitType === 'pull') {
    return CLASSIC_PPL.PULL_DAY.exercises;
  }
  if (splitType === 'legs') {
    return CLASSIC_PPL.LEG_DAY.exercises;
  }

  return null;
}

/**
 * Helper: Check if exercise is in tier S (essential)
 */
export function isTierSExercise(exerciseName, category) {
  if (!EXERCISE_TIERS.TIER_S[category]) return false;

  return EXERCISE_TIERS.TIER_S[category].some(tierExercise =>
    exerciseName.toLowerCase().includes(tierExercise.toLowerCase()) ||
    tierExercise.toLowerCase().includes(exerciseName.toLowerCase())
  );
}

/**
 * Helper: Prioritize exercises by tier
 */
export function prioritizeExercises(exercises, category) {
  const categorized = {
    tierS: [],
    tierA: [],
    tierB: [],
    other: []
  };

  exercises.forEach(ex => {
    const name = ex.name;

    // Check Tier S
    if (EXERCISE_TIERS.TIER_S[category]?.some(t =>
      name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(name.toLowerCase())
    )) {
      categorized.tierS.push(ex);
    }
    // Check Tier A
    else if (EXERCISE_TIERS.TIER_A[category]?.some(t =>
      name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(name.toLowerCase())
    )) {
      categorized.tierA.push(ex);
    }
    // Check Tier B
    else if (EXERCISE_TIERS.TIER_B[category]?.some(t =>
      name.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(name.toLowerCase())
    )) {
      categorized.tierB.push(ex);
    }
    else {
      categorized.other.push(ex);
    }
  });

  // Return in priority order: S > A > B > Other
  return [
    ...categorized.tierS,
    ...categorized.tierA,
    ...categorized.tierB,
    ...categorized.other
  ];
}

export default {
  EXERCISE_TIERS,
  CLASSIC_PPL,
  BEGINNER_FULLBODY,
  UPPER_LOWER_4DAY,
  TEN_WEEK_MASS,
  BRO_SPLIT_5DAY,
  SELECTION_RULES,
  getOptimalExercises,
  isTierSExercise,
  prioritizeExercises
};
