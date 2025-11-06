# 📊 Scientific Database Schemas

**Purpose:** Define data structures for exercises, meals, programs, and AI coaching

---

## 🏋️ EXERCISE DATABASE SCHEMA

### Exercise Entity
```typescript
interface Exercise {
  // Core Identifiers
  id: string;                    // Unique ID
  name: string;                  // "Barbell Bench Press"
  alternativeNames: string[];    // ["Bench Press", "Flat Bench Press"]

  // Classification
  category: ExerciseCategory;    // See enum below
  muscleGroups: {
    primary: MuscleGroup[];      // Main muscles worked
    secondary: MuscleGroup[];    // Supporting muscles
    stabilizers: MuscleGroup[];  // Stabilizing muscles
  };

  // Training Characteristics
  equipment: Equipment[];        // ["Barbell", "Bench"]
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mechanic: 'compound' | 'isolation';
  force: 'push' | 'pull' | 'static' | 'dynamic';

  // NSCA/ACSM Guidelines
  recommendedSets: {
    strength: { min: number; max: number };      // 3-6 sets
    hypertrophy: { min: number; max: number };   // 3-5 sets
    endurance: { min: number; max: number };     // 2-3 sets
  };
  recommendedReps: {
    strength: { min: number; max: number };      // 1-5 reps
    hypertrophy: { min: number; max: number };   // 6-12 reps
    endurance: { min: number; max: number };     // 12-20+ reps
  };
  recommendedRestPeriod: {
    strength: number;    // 180-300 seconds
    hypertrophy: number; // 60-120 seconds
    endurance: number;   // 30-60 seconds
  };

  // Instructions & Safety
  instructions: {
    setup: string[];           // Step-by-step setup
    execution: string[];       // Step-by-step movement
    breathing: string;         // Breathing pattern
    commonMistakes: string[];  // What to avoid
    safetyTips: string[];      // Injury prevention
  };

  // Media
  media: {
    demonstrationVideo: string;      // URL or local path
    demonstrationGif: string;        // URL or local path
    formImages: string[];            // Multiple angle photos
    muscleActivationDiagram: string; // Anatomical illustration
  };

  // Progression & Variations
  progressionPath: {
    easier: string[];     // Exercise IDs for regressions
    harder: string[];     // Exercise IDs for progressions
    variations: string[]; // Exercise IDs for variations
  };

  // Metadata
  source: 'exercisedb' | 'free-exercise-db' | 'custom' | 'nsca';
  sourceId: string;          // Original API ID
  scientificReferences: string[]; // Citation URLs
  createdAt: string;
  updatedAt: string;
  verifiedBy: string;        // "NSCA", "ACSM", etc.
}

// Enums
enum ExerciseCategory {
  CHEST_HORIZONTAL_PUSH = 'chest_horizontal_push',  // Bench press
  CHEST_INCLINE_PUSH = 'chest_incline_push',        // Incline press
  CHEST_DECLINE_PUSH = 'chest_decline_push',        // Decline press
  CHEST_FLY = 'chest_fly',                          // Flyes, crossovers

  BACK_HORIZONTAL_PULL = 'back_horizontal_pull',    // Rows
  BACK_VERTICAL_PULL = 'back_vertical_pull',        // Pull-ups, lat pulldowns
  BACK_DEADLIFT = 'back_deadlift',                  // Deadlift variations

  LEGS_SQUAT = 'legs_squat',                        // Squat variations
  LEGS_HINGE = 'legs_hinge',                        // RDL, good mornings
  LEGS_LUNGE = 'legs_lunge',                        // Lunges, split squats
  LEGS_QUAD_ISOLATION = 'legs_quad_isolation',      // Leg extensions
  LEGS_HAMSTRING_ISOLATION = 'legs_hamstring_isolation', // Leg curls
  LEGS_CALF = 'legs_calf',                          // Calf raises

  SHOULDERS_VERTICAL_PUSH = 'shoulders_vertical_push', // Overhead press
  SHOULDERS_LATERAL_RAISE = 'shoulders_lateral_raise', // Side raises
  SHOULDERS_REAR_DELT = 'shoulders_rear_delt',        // Face pulls, reverse flyes

  ARMS_BICEPS_CURL = 'arms_biceps_curl',
  ARMS_BICEPS_PULL = 'arms_biceps_pull',            // Chin-ups
  ARMS_TRICEPS_EXTENSION = 'arms_triceps_extension',
  ARMS_TRICEPS_PRESS = 'arms_triceps_press',        // Close-grip bench
  ARMS_FOREARMS = 'arms_forearms',                  // Wrist curls

  CORE_ANTI_EXTENSION = 'core_anti_extension',      // Planks, rollouts
  CORE_ANTI_ROTATION = 'core_anti_rotation',        // Pallof press
  CORE_ROTATION = 'core_rotation',                  // Russian twists
  CORE_FLEXION = 'core_flexion',                    // Crunches

  CARDIO_RUNNING = 'cardio_running',
  CARDIO_CYCLING = 'cardio_cycling',
  CARDIO_ROWING = 'cardio_rowing',
  CARDIO_SWIMMING = 'cardio_swimming',
  CARDIO_HIIT = 'cardio_hiit',
}

enum MuscleGroup {
  // Major Groups
  CHEST = 'chest',
  BACK = 'back',
  LEGS = 'legs',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  ABS = 'abs',

  // Specific Muscles
  CHEST_UPPER = 'chest_upper',
  CHEST_MIDDLE = 'chest_middle',
  CHEST_LOWER = 'chest_lower',

  BACK_LATS = 'back_lats',
  BACK_TRAPS = 'back_traps',
  BACK_RHOMBOIDS = 'back_rhomboids',
  BACK_LOWER = 'back_lower',

  SHOULDERS_FRONT_DELT = 'shoulders_front_delt',
  SHOULDERS_SIDE_DELT = 'shoulders_side_delt',
  SHOULDERS_REAR_DELT = 'shoulders_rear_delt',

  LEGS_QUADS = 'legs_quads',
  LEGS_HAMSTRINGS = 'legs_hamstrings',
  LEGS_GLUTES = 'legs_glutes',
  LEGS_CALVES = 'legs_calves',
  LEGS_ADDUCTORS = 'legs_adductors',
  LEGS_ABDUCTORS = 'legs_abductors',

  BICEPS_LONG_HEAD = 'biceps_long_head',
  BICEPS_SHORT_HEAD = 'biceps_short_head',

  TRICEPS_LONG_HEAD = 'triceps_long_head',
  TRICEPS_LATERAL_HEAD = 'triceps_lateral_head',
  TRICEPS_MEDIAL_HEAD = 'triceps_medial_head',

  FOREARMS_FLEXORS = 'forearms_flexors',
  FOREARMS_EXTENSORS = 'forearms_extensors',

  ABS_RECTUS = 'abs_rectus',
  ABS_OBLIQUES = 'abs_obliques',
  ABS_TRANSVERSE = 'abs_transverse',
}

enum Equipment {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  CABLE = 'cable',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  RESISTANCE_BAND = 'resistance_band',
  MEDICINE_BALL = 'medicine_ball',
  FOAM_ROLLER = 'foam_roller',
  BENCH = 'bench',
  PULL_UP_BAR = 'pull_up_bar',
  DIP_BARS = 'dip_bars',
  RINGS = 'rings',
  SUSPENSION_TRAINER = 'suspension_trainer', // TRX
  SMITH_MACHINE = 'smith_machine',
  LEG_PRESS = 'leg_press',
  HACK_SQUAT = 'hack_squat',
  NONE = 'none',
}
```

### Volume Landmarks (Per Muscle Group Per Week)
```typescript
interface VolumeLandmarks {
  muscleGroup: MuscleGroup;

  // Renaissance Periodization Guidelines
  MV: number;   // Maintenance Volume (sets/week)
  MEV: number;  // Minimum Effective Volume
  MAV: { min: number; max: number }; // Maximum Adaptive Volume (optimal range)
  MRV: number;  // Maximum Recoverable Volume

  // Recommendations by training level
  beginner: { min: number; max: number };
  intermediate: { min: number; max: number };
  advanced: { min: number; max: number };
}

// Example values (based on RP guidelines)
const volumeLandmarksData: VolumeLandmarks[] = [
  {
    muscleGroup: MuscleGroup.CHEST,
    MV: 8, MEV: 10, MAV: { min: 12, max: 20 }, MRV: 22,
    beginner: { min: 10, max: 14 },
    intermediate: { min: 12, max: 18 },
    advanced: { min: 14, max: 20 }
  },
  {
    muscleGroup: MuscleGroup.BACK,
    MV: 10, MEV: 12, MAV: { min: 14, max: 22 }, MRV: 25,
    beginner: { min: 12, max: 16 },
    intermediate: { min: 14, max: 20 },
    advanced: { min: 16, max: 22 }
  },
  {
    muscleGroup: MuscleGroup.LEGS,
    MV: 8, MEV: 10, MAV: { min: 12, max: 18 }, MRV: 20,
    beginner: { min: 10, max: 14 },
    intermediate: { min: 12, max: 16 },
    advanced: { min: 14, max: 18 }
  },
  // ... more muscle groups
];
```

---

## 🍽️ FOOD & NUTRITION DATABASE SCHEMA

### Food Item Entity
```typescript
interface FoodItem {
  // Core Identifiers
  id: string;
  fdcId?: number;              // USDA FDC ID
  offBarcode?: string;         // Open Food Facts barcode
  name: string;
  brand?: string;

  // Nutrition (per 100g)
  nutrition: {
    servingSize: number;       // grams
    servingUnit: string;       // "g", "ml", "cup", "piece"

    // Macros
    calories: number;
    protein: number;           // grams
    carbs: number;            // grams
    fat: number;              // grams
    fiber: number;            // grams
    sugar: number;            // grams

    // Micros (optional but valuable)
    sodium: number;           // mg
    potassium: number;        // mg
    calcium: number;          // mg
    iron: number;             // mg
    vitaminA: number;         // IU
    vitaminC: number;         // mg
    vitaminD: number;         // IU
  };

  // Classification
  category: FoodCategory;
  subcategory: string;
  tags: string[];              // ["high-protein", "low-carb", "vegan"]

  // Dietary Info
  dietary: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isKeto: boolean;
    isPaleo: boolean;
    allergens: string[];       // ["milk", "eggs", "nuts"]
  };

  // Quality Scores
  scores: {
    nutriScore?: string;       // "A", "B", "C", "D", "E" (Open Food Facts)
    novaGroup?: 1 | 2 | 3 | 4; // Processing level (1=unprocessed, 4=ultra-processed)
  };

  // Barcode Photo (if scanned)
  barcodePhoto?: string;       // Base64 or URL

  // Metadata
  source: 'usda' | 'openfoodfacts' | 'manual' | 'custom';
  sourceId: string;
  createdAt: string;
  updatedAt: string;
}

enum FoodCategory {
  PROTEIN = 'protein',
  GRAINS = 'grains',
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  DAIRY = 'dairy',
  FATS_OILS = 'fats_oils',
  SNACKS = 'snacks',
  BEVERAGES = 'beverages',
  CONDIMENTS = 'condiments',
  SUPPLEMENTS = 'supplements',
}
```

### Recipe Entity
```typescript
interface Recipe {
  id: string;
  name: string;
  description: string;

  // Ingredients
  ingredients: {
    foodItemId: string;        // Reference to FoodItem
    amount: number;            // Quantity
    unit: string;              // "g", "cups", "tbsp"
  }[];

  // Calculated Nutrition (sum of ingredients)
  totalNutrition: {
    servings: number;
    perServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };

  // Instructions
  instructions: {
    step: number;
    instruction: string;
    timeMinutes?: number;
  }[];

  prepTime: number;            // minutes
  cookTime: number;            // minutes
  totalTime: number;           // minutes

  // Media
  photos: string[];            // Recipe photos

  // Classification
  mealType: MealType[];        // Can be breakfast AND lunch
  cuisine: string;             // "Italian", "Mexican", etc.
  difficulty: 'easy' | 'medium' | 'hard';

  // Dietary
  dietary: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isKeto: boolean;
  };

  // User Data
  isFavorite: boolean;
  timesCooked: number;
  lastCookedDate?: string;
  userRating?: number;         // 1-5 stars

  // Metadata
  source: 'user' | 'template' | 'ai_generated';
  createdAt: string;
  updatedAt: string;
}

enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  PRE_WORKOUT = 'pre_workout',
  POST_WORKOUT = 'post_workout',
}
```

### Meal Plan Template
```typescript
interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;

  // Target audience
  goal: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'performance';
  targetCalories: number;
  targetMacros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };

  // Days
  days: {
    dayNumber: number;
    meals: {
      mealType: MealType;
      recipeId: string;
      servings: number;
    }[];
  }[];

  duration: number;            // 7 for weekly, 30 for monthly

  // Metadata
  createdBy: 'system' | 'nutritionist' | 'ai' | 'user';
  scientificBasis: string;     // Citation to guidelines
  isPublic: boolean;
  usageCount: number;
  averageRating: number;

  createdAt: string;
  updatedAt: string;
}
```

---

## 🏆 WORKOUT PROGRAM SCHEMA

### Workout Program Template
```typescript
interface WorkoutProgram {
  id: string;
  name: string;
  description: string;

  // Program characteristics
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'general_fitness' | 'fat_loss';
  trainingLevel: 'beginner' | 'intermediate' | 'advanced';
  splitType: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split' | 'custom';

  // Duration
  durationWeeks: number;
  workoutsPerWeek: number;

  // Days/Workouts
  days: {
    dayNumber: number;
    name: string;              // "Upper Body", "Push Day"
    muscleGroups: MuscleGroup[];
    exercises: {
      exerciseId: string;
      order: number;

      // Programming
      sets: number;
      reps: { min: number; max: number } | number;
      restPeriodSeconds: number;
      tempo?: string;          // "3-1-1-0" (eccentric-pause-concentric-pause)
      rpe?: number;            // Rate of Perceived Exertion (1-10)
      percentOf1RM?: number;   // For strength programs

      // Instructions
      notes?: string;
      supersetWith?: number;   // Exercise order number to superset with
      dropset?: boolean;
      restPause?: boolean;
    }[];
  }[];

  // Weekly schedule (which days to work out)
  weeklySchedule: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    type: 'workout' | 'rest' | 'active_recovery';
    workoutDayIndex?: number; // References days array
  }[];

  // Progression scheme
  progressionScheme: {
    type: 'linear' | 'double_progression' | 'weekly_undulating' | 'daily_undulating';
    description: string;
    rules: string[];           // "Add 5 lbs when you hit top of rep range"
  };

  // Deload protocol
  deloadWeek?: {
    frequency: number;         // Every X weeks
    volumeReduction: number;   // Percentage (40-50%)
    intensityReduction: number;// Percentage (0-10%)
  };

  // Scientific basis
  basedOn: 'NSCA' | 'ACSM' | 'Renaissance_Periodization' | 'Custom';
  citations: string[];

  // Metadata
  createdBy: 'system' | 'trainer' | 'ai' | 'user';
  isPublic: boolean;
  usageCount: number;
  averageRating: number;

  createdAt: string;
  updatedAt: string;
}
```

---

## 🤖 AI COACH DATA MODELS

### User Profile (for AI)
```typescript
interface UserAIProfile {
  userId: string;

  // Demographics
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;              // kg
  height: number;              // cm

  // Training Data
  trainingAge: number;         // months of consistent training
  trainingLevel: 'beginner' | 'intermediate' | 'advanced';
  currentProgram?: string;     // WorkoutProgram ID

  // Goals
  primaryGoal: 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'health';
  targetWeight?: number;
  targetBodyFatPercentage?: number;

  // Constraints
  availableDays: number;       // Days per week available
  availableEquipment: Equipment[];
  injuries: {
    bodyPart: string;
    description: string;
    date: string;
    status: 'active' | 'recovered';
  }[];

  // Preferences
  preferredExercises: string[]; // Exercise IDs
  dislikedExercises: string[];

  // Nutrition Data
  tdee: number;                // Total Daily Energy Expenditure
  targetCalories: number;
  targetMacros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };

  // Calculated Metrics
  bmr: number;                 // Basal Metabolic Rate
  activityFactor: number;      // 1.2 - 1.9

  // Progress Tracking
  strengthStandards: {
    exerciseName: string;
    currentMax: number;        // lbs or kg
    standard: 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite';
  }[];

  updatedAt: string;
}
```

### AI Coaching Session
```typescript
interface CoachingSession {
  id: string;
  userId: string;
  timestamp: string;

  // Context
  sessionType: 'workout_recommendation' | 'meal_recommendation' | 'progress_check' | 'question';
  userInput: string;           // User's message or question

  // AI Analysis
  analysis: {
    // Workout analysis
    currentVolume?: {
      muscleGroup: MuscleGroup;
      weeklySets: number;
      status: 'under_MEV' | 'optimal' | 'near_MRV' | 'over_MRV';
    }[];

    progressionStatus?: 'on_track' | 'plateau' | 'regressing' | 'excellent';
    needsDeload?: boolean;

    // Nutrition analysis
    macroAdherence?: {
      protein: { actual: number; target: number; status: string };
      carbs: { actual: number; target: number; status: string };
      fat: { actual: number; target: number; status: string };
    };

    calorieDeficit?: number;
    weeklyWeightChange?: number;

    // Recommendations
    recommendations: {
      type: 'workout_change' | 'nutrition_change' | 'deload' | 'progression' | 'general';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      actionSteps: string[];
      reasoning: string;       // Why AI made this recommendation
      scientificBasis: string; // NSCA/ACSM citation
    }[];
  };

  // AI Response
  aiResponse: string;          // Natural language response
  suggestedWorkouts?: string[];    // WorkoutProgram IDs
  suggestedMeals?: string[];       // Recipe IDs

  // User Feedback
  userFeedback?: {
    helpful: boolean;
    rating: number;            // 1-5
    comment?: string;
  };
}
```

### Progressive Overload Tracker
```typescript
interface ProgressiveOverloadRecord {
  userId: string;
  exerciseId: string;
  date: string;

  // Performance data
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
    rpe?: number;
    formQuality?: 'excellent' | 'good' | 'poor';
  }[];

  // Calculated metrics
  totalVolume: number;         // sets × reps × weight
  estimatedOneRepMax: number;  // Brzycki formula
  volumeChangeFromLastSession: number; // Percentage

  // AI Decision
  nextSessionPlan: {
    recommendedWeight: number;
    recommendedReps: { min: number; max: number };
    reasoning: string;
    confidenceLevel: number;   // 0-1
  };
}
```

---

## 🗄️ STORAGE STRATEGY

### AsyncStorage (Current - Mobile Only)
```
@workout_history_{userId}
@exercise_progress_{userId}
@user_stats_{userId}
@planned_workouts_{userId}
@goals_{userId}
@achievements_{userId}
@daily_nutrition_{userId}
@meal_plans_{userId}
@macro_goals_{userId}
```

### Future Backend (Firebase/Supabase)
```
Collections/Tables:
- users
- exercises
- food_items
- recipes
- workout_programs
- meal_plan_templates
- workout_history
- nutrition_logs
- coaching_sessions
- progressive_overload_records
- achievements
- goals
```

---

## 📝 Implementation Priority

### Phase 1 (Week 3): Core Schemas
1. ✅ Exercise schema with NSCA guidelines
2. ✅ Food item schema with USDA/OFF integration
3. ✅ Recipe schema

### Phase 2 (Week 3-4): Templates
4. Workout program templates (20 evidence-based programs)
5. Meal plan templates (100 scientifically accurate meals)
6. Volume landmarks data

### Phase 3 (Week 4-5): AI Models
7. User AI profile schema
8. Coaching session schema
9. Progressive overload tracker

---

**Next:** Populate databases with real data from ExerciseDB and USDA FoodData Central
