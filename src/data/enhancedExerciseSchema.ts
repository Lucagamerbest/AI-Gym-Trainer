/**
 * ENHANCED EXERCISE SYSTEM WITH EQUIPMENT VARIANTS
 *
 * Philosophy: Fewer exercises, more options within each
 * User Experience: Select exercise, then choose equipment/variation
 */

export interface ExerciseVariant {
  equipment: Equipment;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: {
    setupAdjustments?: string[];  // What changes for this variant
    executionAdjustments?: string[]; // How movement differs
  };
  pros?: string[];  // Advantages of this variant
  cons?: string[];  // Disadvantages of this variant
}

export interface Exercise {
  id: string;
  name: string;  // "Bench Press" (not "Barbell Bench Press")

  // Base classification
  category: ExerciseCategory;
  muscleGroups: {
    primary: MuscleGroup[];
    secondary: MuscleGroup[];
    stabilizers: MuscleGroup[];
  };

  // Equipment variants (user selects during workout)
  variants: ExerciseVariant[];
  defaultVariant: Equipment;  // Pre-selected option

  // Angle/style variants (for exercises like push-ups, bench press)
  styleVariants?: {
    name: string;  // "Standard", "Wide Grip", "Close Grip", "Diamond"
    description: string;
    muscleEmphasis?: string;  // "More triceps", "More chest stretch"
    difficulty?: 'easier' | 'same' | 'harder';
  }[];

  // Base instructions (common to all variants)
  instructions: {
    setup: string[];
    execution: string[];
    breathing: string;
    commonMistakes: string[];
    safetyTips: string[];
  };

  // NSCA Guidelines
  nsca: {
    sets: { strength: string; hypertrophy: string; endurance: string };
    reps: { strength: string; hypertrophy: string; endurance: string };
    rest: { strength: number; hypertrophy: number; endurance: number };
  };

  // Media
  media: {
    demonstrationVideo?: string;
    demonstrationGif?: string;
    formImages: string[];
  };

  // Progression
  progressionPath: {
    easier: string[];      // Exercise IDs
    harder: string[];
    alternatives: string[];
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export enum Equipment {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  SMITH_MACHINE = 'smith_machine',
  CABLE = 'cable',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  RESISTANCE_BAND = 'resistance_band',
  KETTLEBELL = 'kettlebell',
}

export enum MuscleGroup {
  // Major groups
  CHEST = 'chest',
  BACK = 'back',
  LEGS = 'legs',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  ABS = 'abs',

  // Chest specifics
  CHEST_UPPER = 'chest_upper',
  CHEST_MIDDLE = 'chest_middle',
  CHEST_LOWER = 'chest_lower',

  // Back specifics
  BACK_LATS = 'back_lats',
  BACK_TRAPS = 'back_traps',
  BACK_RHOMBOIDS = 'back_rhomboids',
  BACK_LOWER = 'back_lower',

  // Shoulder specifics
  SHOULDERS_FRONT = 'shoulders_front',
  SHOULDERS_SIDE = 'shoulders_side',
  SHOULDERS_REAR = 'shoulders_rear',

  // Leg specifics
  LEGS_QUADS = 'legs_quads',
  LEGS_HAMSTRINGS = 'legs_hamstrings',
  LEGS_GLUTES = 'legs_glutes',
  LEGS_CALVES = 'legs_calves',
}

export enum ExerciseCategory {
  // Chest
  CHEST_HORIZONTAL_PRESS = 'chest_horizontal_press',
  CHEST_INCLINE_PRESS = 'chest_incline_press',
  CHEST_DECLINE_PRESS = 'chest_decline_press',
  CHEST_FLY = 'chest_fly',
  CHEST_CROSSOVER = 'chest_crossover',

  // Back
  BACK_HORIZONTAL_PULL = 'back_horizontal_pull',
  BACK_VERTICAL_PULL = 'back_vertical_pull',
  BACK_DEADLIFT = 'back_deadlift',

  // Legs
  LEGS_SQUAT = 'legs_squat',
  LEGS_HINGE = 'legs_hinge',
  LEGS_LUNGE = 'legs_lunge',
  LEGS_QUAD_ISOLATION = 'legs_quad_isolation',
  LEGS_HAMSTRING_ISOLATION = 'legs_hamstring_isolation',
  LEGS_CALF = 'legs_calf',

  // Shoulders
  SHOULDERS_VERTICAL_PRESS = 'shoulders_vertical_press',
  SHOULDERS_LATERAL_RAISE = 'shoulders_lateral_raise',
  SHOULDERS_REAR_DELT = 'shoulders_rear_delt',

  // Arms
  ARMS_BICEPS = 'arms_biceps',
  ARMS_TRICEPS = 'arms_triceps',
  ARMS_FOREARMS = 'arms_forearms',

  // Core
  CORE_ANTI_EXTENSION = 'core_anti_extension',
  CORE_ANTI_ROTATION = 'core_anti_rotation',
  CORE_ROTATION = 'core_rotation',
  CORE_FLEXION = 'core_flexion',
}
