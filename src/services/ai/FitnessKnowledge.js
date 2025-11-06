/**
 * Scientific Fitness Knowledge Base
 *
 * Evidence-based training principles to ensure the AI coach gives
 * scientifically accurate recommendations based on sports science research.
 */

/**
 * PUSH/PULL/LEGS CLASSIFICATION
 * Based on movement patterns and muscle actions
 */
export const TRAINING_SPLITS = {
  // PUSH = Pressing movements (muscles that push weight away)
  PUSH: {
    primaryMuscles: ['Chest', 'Shoulders', 'Triceps', 'Front Deltoids', 'Side Deltoids'],
    movementPatterns: ['horizontal press', 'vertical press', 'tricep extension'],
    exercises: [
      'Bench Press', 'Incline Press', 'Decline Press', 'Dumbbell Press',
      'Overhead Press', 'Military Press', 'Arnold Press', 'Shoulder Press',
      'Chest Flyes', 'Cable Flyes', 'Pec Deck',
      'Lateral Raise', 'Front Raise',
      'Tricep Pushdown', 'Skull Crusher', 'Dips', 'Close Grip Bench',
      'Tricep Extension', 'Tricep Kickback'
    ],
    // Deadlift and squats are NOT push exercises
    excludedExercises: ['Deadlift', 'Squat', 'Row', 'Pull-up', 'Chin-up', 'Curl']
  },

  // PULL = Pulling movements (muscles that pull weight toward body)
  PULL: {
    primaryMuscles: ['Back', 'Lats', 'Traps', 'Rhomboids', 'Biceps', 'Rear Deltoids'],
    movementPatterns: ['horizontal pull', 'vertical pull', 'bicep curl'],
    exercises: [
      'Pull-up', 'Chin-up', 'Lat Pulldown',
      'Barbell Row', 'Dumbbell Row', 'Cable Row', 'T-Bar Row', 'Seated Row',
      'Face Pull', 'Reverse Flyes',
      'Shrug', 'Upright Row',
      'Bicep Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl',
      'Deadlift' // Deadlift CAN be in pull day (works back, traps, lats as stabilizers)
    ],
    notes: 'Deadlift is debated - some programs put it on leg day, some on pull day. Both are acceptable.',
    // Squats are NOT pull exercises
    excludedExercises: ['Squat', 'Leg Press', 'Leg Extension', 'Leg Curl (except as hamstring work)', 'Bench Press', 'Overhead Press']
  },

  // LEGS = Lower body movements
  LEGS: {
    primaryMuscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors'],
    movementPatterns: ['squat', 'hinge', 'lunge', 'calf raise', 'leg extension/curl'],
    exercises: [
      'Squat', 'Front Squat', 'Back Squat', 'Goblet Squat', 'Bulgarian Split Squat',
      'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift',
      'Leg Press', 'Hack Squat',
      'Lunge', 'Walking Lunge', 'Reverse Lunge',
      'Leg Extension', 'Leg Curl', 'Hamstring Curl',
      'Hip Thrust', 'Glute Bridge',
      'Calf Raise', 'Seated Calf Raise', 'Standing Calf Raise'
    ],
    notes: 'Deadlift can be on pull day OR leg day depending on program structure.',
    excludedExercises: ['Bench Press', 'Row', 'Pull-up', 'Overhead Press', 'Curl']
  }
};

/**
 * OPTIMAL REP RANGES (Based on research from Schoenfeld, Helms, Israetel)
 */
export const REP_RANGES = {
  STRENGTH: {
    reps: '1-5',
    sets: '3-6',
    restTime: 180, // 3-5 minutes
    notes: 'Heavy weight, low reps. Focus on neurological adaptation and maximal force production.',
    intensity: '85-100% 1RM',
    scientificBasis: 'Maximal strength gains occur at 85%+ 1RM (Schoenfeld et al., 2017)'
  },

  HYPERTROPHY: {
    reps: '6-12',
    sets: '3-5',
    restTime: 60, // 60-90 seconds
    notes: 'Moderate weight, moderate reps. Optimal for muscle growth through metabolic stress and mechanical tension.',
    intensity: '65-85% 1RM',
    scientificBasis: 'Muscle growth occurs across 6-35 rep range, but 6-12 is most time-efficient (Schoenfeld et al., 2021)'
  },

  ENDURANCE: {
    reps: '15-20+',
    sets: '2-3',
    restTime: 30, // 30-45 seconds
    notes: 'Light weight, high reps. Improves muscular endurance and work capacity.',
    intensity: '50-65% 1RM',
    scientificBasis: 'Muscular endurance improves most at lower intensities with higher volume (ACSM guidelines)'
  },

  POWER: {
    reps: '3-6',
    sets: '3-5',
    restTime: 180, // 3-5 minutes
    notes: 'Explosive movements with moderate-heavy weight. Focus on speed and force production.',
    intensity: '75-90% 1RM',
    scientificBasis: 'Power output maximized at 75-85% 1RM with explosive intent (Kawamori & Haff, 2004)'
  }
};

/**
 * TRAINING VOLUME GUIDELINES (MEV/MRV by muscle group)
 * Based on Renaissance Periodization research (Dr. Mike Israetel)
 */
export const VOLUME_LANDMARKS = {
  // Sets per muscle group per week
  CHEST: {
    maintenanceVolume: 6, // MV: minimum to maintain muscle
    minimumEffectiveVolume: 8, // MEV: minimum to grow
    maximumAdaptiveVolume: 18, // MAV: sweet spot for most people
    maximumRecoverableVolume: 22, // MRV: max before overtraining
  },
  BACK: {
    maintenanceVolume: 8,
    minimumEffectiveVolume: 10,
    maximumAdaptiveVolume: 20,
    maximumRecoverableVolume: 25,
  },
  SHOULDERS: {
    maintenanceVolume: 6,
    minimumEffectiveVolume: 8,
    maximumAdaptiveVolume: 16,
    maximumRecoverableVolume: 20,
  },
  BICEPS: {
    maintenanceVolume: 4,
    minimumEffectiveVolume: 6,
    maximumAdaptiveVolume: 14,
    maximumRecoverableVolume: 20,
  },
  TRICEPS: {
    maintenanceVolume: 4,
    minimumEffectiveVolume: 6,
    maximumAdaptiveVolume: 14,
    maximumRecoverableVolume: 18,
  },
  LEGS: {
    maintenanceVolume: 6,
    minimumEffectiveVolume: 8,
    maximumAdaptiveVolume: 18,
    maximumRecoverableVolume: 24,
  },
  QUADS: {
    maintenanceVolume: 4,
    minimumEffectiveVolume: 6,
    maximumAdaptiveVolume: 14,
    maximumRecoverableVolume: 20,
  },
  HAMSTRINGS: {
    maintenanceVolume: 4,
    minimumEffectiveVolume: 6,
    maximumAdaptiveVolume: 12,
    maximumRecoverableVolume: 18,
  },
  GLUTES: {
    maintenanceVolume: 4,
    minimumEffectiveVolume: 6,
    maximumAdaptiveVolume: 14,
    maximumRecoverableVolume: 20,
  },
  CALVES: {
    maintenanceVolume: 6,
    minimumEffectiveVolume: 8,
    maximumAdaptiveVolume: 16,
    maximumRecoverableVolume: 20,
  }
};

/**
 * EXERCISE SELECTION PRINCIPLES
 * Compound vs Isolation, exercise order
 */
export const EXERCISE_PRINCIPLES = {
  COMPOUND_FIRST: {
    rule: 'Always do compound exercises before isolation',
    reason: 'Compound exercises require more energy and technique. Do them fresh.',
    examples: {
      correct: ['Bench Press → Cable Flyes → Tricep Pushdown'],
      incorrect: ['Tricep Pushdown → Cable Flyes → Bench Press']
    },
    scientificBasis: 'Pre-fatigue with isolation reduces performance on compounds by 20-30% (Brennecke et al., 2009)'
  },

  HEAVY_TO_LIGHT: {
    rule: 'Progress from heavy/low-rep to light/high-rep exercises',
    reason: 'Neurological fatigue from heavy lifting impairs light weight performance less than vice versa.',
    examples: {
      correct: ['Squat 5x5 → Leg Press 4x10 → Leg Extension 3x15'],
      incorrect: ['Leg Extension 3x15 → Leg Press 4x10 → Squat 5x5']
    }
  },

  BALANCE_PUSH_PULL: {
    rule: 'For every push exercise, include a pull exercise (1:1 or 2:3 ratio)',
    reason: 'Prevents shoulder imbalances and injury. Maintains proper posture.',
    scientificBasis: 'Push-to-pull imbalance leads to shoulder impingement and rounded shoulders (Cools et al., 2007)'
  }
};

/**
 * TRAINING FREQUENCY RECOMMENDATIONS
 */
export const FREQUENCY_GUIDELINES = {
  BEGINNER: {
    frequency: '3-4 days/week',
    split: 'Full body or Upper/Lower',
    reason: 'Need more recovery, learning form',
    restDays: '1-2 days between workouts'
  },
  INTERMEDIATE: {
    frequency: '4-5 days/week',
    split: 'Push/Pull/Legs or Upper/Lower/Upper/Lower',
    reason: 'Can handle more volume, each muscle 2x/week optimal',
    restDays: '1-2 rest days per week'
  },
  ADVANCED: {
    frequency: '5-6 days/week',
    split: 'Push/Pull/Legs/Push/Pull/Legs or Bro Split',
    reason: 'High work capacity, can handle high volume',
    restDays: '1 rest day per week'
  }
};

/**
 * PROGRESSIVE OVERLOAD STRATEGIES
 */
export const PROGRESSION_METHODS = {
  LINEAR: {
    method: 'Add 2.5-5 lbs every workout',
    bestFor: 'Beginners',
    duration: '3-6 months typically'
  },
  DOUBLE_PROGRESSION: {
    method: 'Increase reps, then weight. Example: 3x8 → 3x12, then add weight and drop back to 3x8',
    bestFor: 'Intermediate lifters',
    duration: 'Indefinitely'
  },
  PERIODIZATION: {
    method: 'Cycle through strength, hypertrophy, and deload phases',
    bestFor: 'Advanced lifters',
    duration: '4-12 week blocks'
  }
};

/**
 * DELOAD PROTOCOLS
 */
export const DELOAD_GUIDELINES = {
  FREQUENCY: 'Every 4-8 weeks',
  METHODS: {
    VOLUME_DELOAD: 'Reduce sets by 50% (6 sets → 3 sets)',
    INTENSITY_DELOAD: 'Reduce weight by 30-40%',
    COMBINED_DELOAD: 'Reduce both volume and intensity by 30%'
  },
  PURPOSE: 'Allow accumulated fatigue to dissipate, prevent overtraining, restore sensitivity to training stimulus'
};

/**
 * Helper function: Classify exercise into push/pull/legs
 */
export function classifyExercise(exercise) {
  const name = exercise.name.toLowerCase();
  const primaryMuscles = exercise.primaryMuscles?.map(m => m.toLowerCase()) || [];
  const secondaryMuscles = exercise.secondaryMuscles?.map(m => m.toLowerCase()) || [];
  const allMuscles = [...primaryMuscles, ...secondaryMuscles];

  // Check if exercise is explicitly in any category
  if (TRAINING_SPLITS.PUSH.exercises.some(ex => name.includes(ex.toLowerCase()))) {
    return 'push';
  }
  if (TRAINING_SPLITS.PULL.exercises.some(ex => name.includes(ex.toLowerCase()))) {
    return 'pull';
  }
  if (TRAINING_SPLITS.LEGS.exercises.some(ex => name.includes(ex.toLowerCase()))) {
    return 'legs';
  }

  // Classify by muscle groups
  const isPush = TRAINING_SPLITS.PUSH.primaryMuscles.some(muscle =>
    allMuscles.some(m => m.includes(muscle.toLowerCase()))
  );
  const isPull = TRAINING_SPLITS.PULL.primaryMuscles.some(muscle =>
    allMuscles.some(m => m.includes(muscle.toLowerCase()))
  );
  const isLegs = TRAINING_SPLITS.LEGS.primaryMuscles.some(muscle =>
    allMuscles.some(m => m.includes(muscle.toLowerCase()))
  );

  if (isPush) return 'push';
  if (isPull) return 'pull';
  if (isLegs) return 'legs';

  return 'unknown';
}

/**
 * Helper function: Validate workout scientifically
 */
export function validateWorkout(exercises, workoutType) {
  const errors = [];
  const warnings = [];

  // Classify all exercises
  const classifications = exercises.map(ex => ({
    name: ex.name,
    classification: classifyExercise(ex)
  }));

  // Check if exercises match workout type
  if (workoutType === 'push') {
    const wrongExercises = classifications.filter(c => c.classification !== 'push');
    if (wrongExercises.length > 0) {
      errors.push(`Push workout contains non-push exercises: ${wrongExercises.map(e => e.name).join(', ')}`);
    }
  }

  if (workoutType === 'pull') {
    const wrongExercises = classifications.filter(c => c.classification !== 'pull');
    if (wrongExercises.length > 0) {
      errors.push(`Pull workout contains non-pull exercises: ${wrongExercises.map(e => e.name).join(', ')}`);
    }
  }

  if (workoutType === 'legs') {
    const wrongExercises = classifications.filter(c => c.classification !== 'legs');
    if (wrongExercises.length > 0) {
      errors.push(`Leg workout contains non-leg exercises: ${wrongExercises.map(e => e.name).join(', ')}`);
    }
  }

  // Check exercise order (compound before isolation)
  // This would require more metadata about compound vs isolation

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Helper function: Get optimal rep range for goal
 */
export function getOptimalRepRange(goal, experienceLevel) {
  const ranges = {
    strength: REP_RANGES.STRENGTH,
    hypertrophy: REP_RANGES.HYPERTROPHY,
    endurance: REP_RANGES.ENDURANCE,
    power: REP_RANGES.POWER
  };

  return ranges[goal] || ranges.hypertrophy;
}

/**
 * Map common user terms to muscle groups
 */
export function mapUserTermToMuscleGroups(userTerm) {
  const term = userTerm.toLowerCase();

  // Handle push/pull/legs
  if (term.includes('push')) {
    return TRAINING_SPLITS.PUSH.primaryMuscles;
  }
  if (term.includes('pull')) {
    return TRAINING_SPLITS.PULL.primaryMuscles;
  }
  if (term.includes('leg')) {
    return TRAINING_SPLITS.LEGS.primaryMuscles;
  }

  // Handle upper/lower splits
  if (term.includes('upper')) {
    // Upper body = push + pull muscles
    return [...TRAINING_SPLITS.PUSH.primaryMuscles, ...TRAINING_SPLITS.PULL.primaryMuscles];
  }
  if (term.includes('lower')) {
    // Lower body = leg muscles
    return TRAINING_SPLITS.LEGS.primaryMuscles;
  }

  // Handle specific muscle groups
  const muscleMap = {
    'chest': ['Chest'],
    'back': ['Back', 'Lats', 'Traps'],
    'shoulders': ['Shoulders', 'Front Deltoids', 'Side Deltoids', 'Rear Deltoids'],
    'arms': ['Biceps', 'Triceps'],
    'biceps': ['Biceps'],
    'triceps': ['Triceps'],
    'legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
    'quads': ['Quadriceps'],
    'hamstrings': ['Hamstrings'],
    'glutes': ['Glutes'],
    'calves': ['Calves'],
    'core': ['Core', 'Abs']
  };

  for (const [key, muscles] of Object.entries(muscleMap)) {
    if (term.includes(key)) {
      return muscles;
    }
  }

  return [userTerm]; // Return as-is if not found
}

export default {
  TRAINING_SPLITS,
  REP_RANGES,
  VOLUME_LANDMARKS,
  EXERCISE_PRINCIPLES,
  FREQUENCY_GUIDELINES,
  PROGRESSION_METHODS,
  DELOAD_GUIDELINES,
  classifyExercise,
  validateWorkout,
  getOptimalRepRange,
  mapUserTermToMuscleGroups
};
