/**
 * AI Section Configuration
 *
 * Maps each screen to its AI sections and buttons
 * Based on AI_SECTION_DESIGN_DOCUMENT.md
 *
 * Structure:
 * {
 *   ScreenName: [
 *     {
 *       title: 'Section Title',
 *       icon: 'ionicon-name',
 *       buttons: [
 *         { icon: 'ionicon-name', text: 'Button text', toolName: 'aiToolName', params: {...} }
 *       ]
 *     }
 *   ]
 * }
 */

/**
 * Get dynamic meal suggestion text based on current time
 */
export function getDynamicMealSuggestionText() {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 11) {
    return 'What to eat for breakfast?';
  } else if (currentHour >= 11 && currentHour < 16) {
    return 'What to eat for lunch?';
  } else if (currentHour >= 16 && currentHour < 22) {
    return 'What to eat for dinner?';
  } else {
    return 'What to eat for a snack?';
  }
}

/**
 * Get dynamic meal type based on current time
 */
export function getCurrentMealType() {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 11) {
    return 'breakfast';
  } else if (currentHour >= 11 && currentHour < 16) {
    return 'lunch';
  } else if (currentHour >= 16 && currentHour < 22) {
    return 'dinner';
  } else {
    return 'snack';
  }
}

// ============================================================
// WORKOUT SCREENS
// ============================================================

export const WorkoutScreenSections = [
  {
    title: 'Set Recommendations',
    icon: 'fitness',
    buttons: [
      { icon: 'barbell', text: 'Suggest next weight', toolName: 'recommendNextWeight' },
      { icon: 'timer', text: 'Recommend rest time', toolName: 'recommendRestTime' },
      { icon: 'help-circle', text: 'Is this set too easy/hard?', toolName: 'analyzeSetDifficulty' },
      { icon: 'add-circle', text: 'Should I do another set?', toolName: 'recommendAdditionalSet' },
    ],
  },
  {
    title: 'Exercise Management',
    icon: 'list',
    buttons: [
      { icon: 'add', text: 'Add similar exercise', toolName: 'searchExercises', params: { similar: true } },
      { icon: 'swap-horizontal', text: 'Find exercise alternative', toolName: 'searchExercises', params: { alternative: true } },
      { icon: 'link', text: 'Add superset exercise', toolName: 'recommendSuperset' },
    ],
  },
  {
    title: 'Workout Insights',
    icon: 'bar-chart',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze today\'s volume', toolName: 'analyzeWorkoutVolume' },
      { icon: 'trending-up', text: 'Compare to last workout', toolName: 'compareWorkouts' },
      { icon: 'trophy', text: 'Did I hit any PRs?', toolName: 'detectPRs' },
      { icon: 'body', text: 'Which muscles worked?', toolName: 'analyzeMusclesWorked' },
    ],
  },
];

// Workout Assistant - Real-time workout control (bottom "Ask AI Assistant" button)
export const WorkoutAssistantSections = [
  {
    title: 'Log Sets',
    icon: 'create',
    buttons: [
      { icon: 'chatbubble-ellipses', text: 'Type command...', toolName: 'customWorkoutInput', isCustomInput: true, fullWidth: true },
      { icon: 'checkmark-circle', text: 'Log current set', toolName: 'logWorkoutSet' },
      {
        icon: 'flame',
        text: 'Log set with RPE',
        prompt: 'Log set (include RPE 1-10)',
        toolName: 'logWorkoutSet'
      },
    ],
  },
  {
    title: 'Workout Control',
    icon: 'settings',
    buttons: [
      {
        icon: 'trash',
        text: 'Remove set',
        toolName: 'removeCompletedSet',
        showCompletedSets: true  // Special flag to show sets directly
      },
      {
        icon: 'swap-vertical',
        text: 'Reorder exercises',
        toolName: 'reorderExercise',
        showExerciseReorder: true  // Special flag to show reorder UI
      },
    ],
  },
];

export const StartWorkoutScreenSections = [
  {
    title: 'Create Workout',
    icon: 'add-circle',
    buttons: [
      { icon: 'chatbubble-ellipses', text: 'Create custom workout', toolName: 'customWorkoutInput', isCustomInput: true },
      { icon: 'barbell', text: 'Push workout', toolName: 'generateWorkoutPlan', params: { type: 'push' } },
      { icon: 'return-down-back', text: 'Pull workout', toolName: 'generateWorkoutPlan', params: { type: 'pull' } },
      { icon: 'walk', text: 'Leg workout', toolName: 'generateWorkoutPlan', params: { type: 'legs' } },
      { icon: 'fitness', text: 'Full body workout', toolName: 'generateWorkoutPlan', params: { type: 'full_body' } },
      { icon: 'body', text: 'Upper body', toolName: 'generateWorkoutPlan', params: { type: 'upper' } },
    ],
  },
  {
    title: 'Workout Recommendations',
    icon: 'bulb',
    buttons: [
      { icon: 'calendar', text: 'What to train today?', toolName: 'recommendWorkout' },
      { icon: 'ribbon', text: 'What did I train last?', toolName: 'getLastWorkout' },
      { icon: 'body', text: 'Which muscles to prioritize?', toolName: 'analyzeMuscleBalance' },
    ],
  },
  {
    title: 'Exercise Search',
    icon: 'search',
    buttons: [
      { icon: 'barbell', text: 'Chest exercises', toolName: 'searchExercises', params: { muscle: 'chest' } },
      { icon: 'return-down-back', text: 'Back exercises', toolName: 'searchExercises', params: { muscle: 'back' } },
      { icon: 'walk', text: 'Leg exercises', toolName: 'searchExercises', params: { muscle: 'legs' } },
      { icon: 'barbell', text: 'Shoulder exercises', toolName: 'searchExercises', params: { muscle: 'shoulders' } },
      { icon: 'barbell', text: 'Arm exercises', toolName: 'searchExercises', params: { muscle: 'arms' } },
      { icon: 'fitness', text: 'Core exercises', toolName: 'searchExercises', params: { muscle: 'core' } },
    ],
  },
];

export const WorkoutHistoryScreenSections = [
  {
    title: 'Workout Analysis',
    icon: 'stats-chart',
    buttons: [
      { icon: 'calendar', text: 'Analyze this week', toolName: 'analyzeWeeklyWorkouts' },
      { icon: 'trending-up', text: 'Volume progression', toolName: 'analyzeVolumeProgression' },
      { icon: 'body', text: 'Muscle balance', toolName: 'analyzeMuscleBalance' },
      { icon: 'calendar', text: 'Workout frequency', toolName: 'analyzeWorkoutFrequency' },
    ],
  },
  {
    title: 'Workout Planning',
    icon: 'calendar',
    buttons: [
      { icon: 'barbell', text: 'Plan tomorrow\'s workout', toolName: 'recommendWorkout' },
      { icon: 'calendar', text: 'Create weekly split', toolName: 'createWeeklySplit' },
    ],
  },
];

export const ExerciseDetailScreenSections = [
  {
    title: 'Exercise Progress',
    icon: 'trending-up',
    buttons: [
      { icon: 'trophy', text: 'What\'s my PR?', toolName: 'getExercisePR' },
      { icon: 'stats-chart', text: 'Show progression', toolName: 'getExerciseProgression' },
      { icon: 'calendar', text: 'Last 5 sessions', toolName: 'getExerciseHistory' },
    ],
  },
  {
    title: 'Exercise Guidance',
    icon: 'information-circle',
    buttons: [
      { icon: 'barbell', text: 'Recommend next weight', toolName: 'recommendNextWeight' },
      { icon: 'list', text: 'How to perform', toolName: 'getExerciseForm' },
      { icon: 'swap-horizontal', text: 'Find alternatives', toolName: 'searchExercises', params: { alternative: true } },
    ],
  },
];

// ============================================================
// NUTRITION SCREENS
// ============================================================

export const NutritionScreenSections = [
  {
    title: 'Meal Suggestions',
    icon: 'restaurant',
    buttons: [
      { icon: 'restaurant', text: 'High protein meal', toolName: 'suggestMeal', params: { highProtein: true } },
      { icon: 'flame', text: 'Low calorie meal', toolName: 'suggestMeal', params: { lowCalorie: true } },
      { icon: 'leaf', text: getDynamicMealSuggestionText, toolName: 'suggestMeal', isDynamic: true },
      { icon: 'restaurant', text: 'Hit protein goal', toolName: 'suggestMeal', params: { targetProtein: true } },
    ],
  },
  {
    title: 'Nutrition Insights',
    icon: 'bulb',
    buttons: [
      { icon: 'bulb', text: 'Optimize my nutrition', toolName: 'analyzeNutritionProgress' },
      { icon: 'analytics', text: 'Improve macro balance', toolName: 'analyzeMacroConsistency' },
    ],
  },
];

export const FoodScanResultScreenSections = [
  {
    title: 'Food Analysis',
    icon: 'analytics',
    buttons: [
      { icon: 'checkmark-circle', text: 'Is this good for my goals?', toolName: 'analyzeFoodForGoals' },
      { icon: 'stats-chart', text: 'How does this fit macros?', toolName: 'analyzeMacroFit' },
      { icon: 'restaurant', text: 'Better alternatives?', toolName: 'suggestFoodAlternatives' },
    ],
  },
  {
    title: 'Meal Planning',
    icon: 'calendar',
    buttons: [
      { icon: 'add', text: 'Suggest pairing', toolName: 'suggestMealPairing' },
      { icon: 'restaurant', text: 'Complete this meal', toolName: 'completeMeal' },
    ],
  },
];

// ============================================================
// PROGRESS SCREENS
// ============================================================

export const ProgressScreenSections = [
  {
    title: 'Goal Predictions',
    icon: 'calendar',
    buttons: [
      {
        icon: 'calendar',
        text: 'Predict goal completion',
        toolName: 'predictGoalCompletionDate',
        prompt: 'When will I be able to bench press 225 lbs?'
      },
      {
        icon: 'alert-circle',
        text: 'Detect plateau',
        toolName: 'detectProgressPlateau',
        prompt: 'Am I plateauing on bench press?'
      },
      { icon: 'checkmark-circle', text: 'Am I on track?', toolName: 'checkGoalProgress' },
    ],
  },
  {
    title: 'Progress Analysis',
    icon: 'trending-up',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze my progress', toolName: 'analyzeProgress' },
      {
        icon: 'body',
        text: 'Estimate body fat %',
        toolName: 'estimateBodyFatPercentage',
        prompt: 'Estimate my body fat percentage with waist 34, neck 15, height 70'
      },
      { icon: 'trophy', text: 'Recent achievements', toolName: 'getRecentAchievements' },
      { icon: 'trending-up', text: 'Weight trend', toolName: 'analyzeWeightTrend' },
    ],
  },
  {
    title: 'Recommendations',
    icon: 'bulb',
    buttons: [
      { icon: 'bulb', text: 'Get recommendations', toolName: 'getProgressRecommendations' },
    ],
  },
];

// ============================================================
// HOME & AI SCREENS
// ============================================================

export const HomeScreenSections = [
  {
    title: 'Get Advice',
    icon: 'chatbubbles',
    buttons: [
      { icon: 'bulb', text: 'How am I doing overall?', toolName: 'getDailySummary' },
      { icon: 'fitness', text: 'Training advice', toolName: 'getMotivation' },
      { icon: 'restaurant', text: 'Nutrition tips', toolName: 'getNutritionAdvice' },
      { icon: 'help-circle', text: 'Answer a question', toolName: 'customInput', isCustomInput: true },
    ],
  },
  {
    title: 'Check Progress',
    icon: 'trending-up',
    buttons: [
      { icon: 'calendar', text: 'This week\'s summary', toolName: 'analyzeWeeklyProgress' },
      { icon: 'trophy', text: 'Recent achievements', toolName: 'getRecentPRs' },
      { icon: 'stats-chart', text: 'Am I on track?', toolName: 'analyzeProgress' },
    ],
  },
  {
    title: 'Get Motivated',
    icon: 'heart',
    buttons: [
      { icon: 'flame', text: 'Motivate me', toolName: 'getMotivation' },
      { icon: 'chatbubble-ellipses', text: 'Coach\'s feedback', toolName: 'getCoachFeedback' },
    ],
  },
];

export const ExerciseListScreenSections = [
  {
    title: 'Exercise Search & Discovery',
    icon: 'search',
    buttons: [
      { icon: 'barbell', text: 'Suggest exercises for me', toolName: 'searchExercises' },
      { icon: 'body', text: 'Target weak muscles', toolName: 'analyzeMuscleBalance' },
      { icon: 'trending-up', text: 'Best exercises for gains', toolName: 'recommendExercises' },
      { icon: 'home', text: 'Home workout alternatives', toolName: 'searchExercises', params: { equipment: 'bodyweight' } },
    ],
  },
  {
    title: 'Exercise Information',
    icon: 'information-circle',
    buttons: [
      { icon: 'help-circle', text: 'How to do this exercise?', toolName: 'getExerciseForm' },
      { icon: 'swap-horizontal', text: 'Find alternatives', toolName: 'searchExercises', params: { alternative: true } },
      { icon: 'body', text: 'Which muscles does it work?', toolName: 'getExerciseMuscles' },
    ],
  },
  {
    title: 'Workout Integration',
    icon: 'add-circle',
    buttons: [
      { icon: 'barbell', text: 'Create workout from these', toolName: 'generateWorkoutPlan' },
      { icon: 'link', text: 'Suggest supersets', toolName: 'recommendSuperset' },
    ],
  },
];

export const MyPlansScreenSections = [
  {
    title: 'Program Planning',
    icon: 'calendar',
    buttons: [
      { icon: 'add-circle', text: 'Create new program', toolName: 'createProgram' },
      { icon: 'trending-up', text: 'Suggest workout split', toolName: 'createWeeklySplit' },
      { icon: 'calendar', text: '6-day PPL program', toolName: 'createProgram', params: { type: 'ppl' } },
      { icon: 'barbell', text: '4-day Upper/Lower', toolName: 'createProgram', params: { type: 'upper_lower' } },
    ],
  },
  {
    title: 'Program Optimization',
    icon: 'analytics',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze my program', toolName: 'analyzeProgram' },
      { icon: 'body', text: 'Check muscle balance', toolName: 'analyzeMuscleBalance' },
      { icon: 'bulb', text: 'Improve my split', toolName: 'optimizeProgram' },
    ],
  },
  {
    title: 'Workout Templates',
    icon: 'copy',
    buttons: [
      { icon: 'barbell', text: 'Push workout template', toolName: 'generateWorkoutPlan', params: { type: 'push' } },
      { icon: 'return-down-back', text: 'Pull workout template', toolName: 'generateWorkoutPlan', params: { type: 'pull' } },
      { icon: 'walk', text: 'Leg workout template', toolName: 'generateWorkoutPlan', params: { type: 'legs' } },
    ],
  },
];

export const ProfileScreenSections = [
  {
    title: 'Profile Analysis',
    icon: 'person',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze my progress', toolName: 'analyzeProgress' },
      { icon: 'trophy', text: 'What are my PRs?', toolName: 'getRecentPRs' },
      { icon: 'trending-up', text: 'Strength progression', toolName: 'analyzeStrengthProgression' },
    ],
  },
  {
    title: 'Goal Setting',
    icon: 'flag',
    buttons: [
      { icon: 'bulb', text: 'Suggest new goals', toolName: 'suggestGoals' },
      { icon: 'calendar', text: 'Create fitness plan', toolName: 'createFitnessPlan' },
    ],
  },
];

export const MealsHistoryScreenSections = [
  {
    title: 'Smart Meal Planning',
    icon: 'calendar',
    buttons: [
      {
        icon: 'calendar',
        text: 'Generate week meal plan',
        toolName: 'generateWeeklyMealPlan',
        prompt: 'Create a 7-day meal plan for 2000 calories and 150g protein daily'
      },
      {
        icon: 'trending-up',
        text: 'Predict macro shortfall',
        toolName: 'predictDailyMacroShortfall',
        prompt: 'Will I hit my protein goal today?'
      },
      {
        icon: 'restaurant',
        text: getDynamicMealSuggestionText,
        toolName: 'suggestNextMealForBalance',
        isDynamic: true
      },
    ],
  },
  {
    title: 'Meal Analysis',
    icon: 'analytics',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze eating patterns', toolName: 'analyzeMealPatterns' },
      { icon: 'trending-up', text: 'Macro consistency', toolName: 'analyzeMacroConsistency' },
      { icon: 'checkmark-circle', text: 'Am I hitting my goals?', toolName: 'analyzeNutritionProgress' },
      { icon: 'copy', text: 'Copy successful day', toolName: 'copyMealDay' },
    ],
  },
];

export const WorkoutSummaryScreenSections = [
  {
    title: 'Workout Analysis',
    icon: 'stats-chart',
    buttons: [
      { icon: 'trophy', text: 'Did I hit any PRs?', toolName: 'detectPRs' },
      { icon: 'trending-up', text: 'Compare to last time', toolName: 'compareWorkouts' },
      { icon: 'bar-chart', text: 'Analyze volume', toolName: 'analyzeWorkoutVolume' },
    ],
  },
  {
    title: 'Next Steps',
    icon: 'arrow-forward',
    buttons: [
      { icon: 'bulb', text: 'What to train next?', toolName: 'recommendWorkout' },
      { icon: 'barbell', text: 'Progression advice', toolName: 'getProgressionAdvice' },
    ],
  },
];

export const WorkoutDetailScreenSections = [
  {
    title: 'Workout Analysis',
    icon: 'analytics',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze this workout', toolName: 'analyzeWorkout' },
      { icon: 'body', text: 'Muscles worked', toolName: 'analyzeMusclesWorked' },
      { icon: 'trophy', text: 'PRs from this workout', toolName: 'detectPRs' },
    ],
  },
  {
    title: 'Workout Actions',
    icon: 'flash',
    buttons: [
      { icon: 'copy', text: 'Repeat this workout', toolName: 'repeatWorkout' },
      { icon: 'bulb', text: 'Improve this workout', toolName: 'improveWorkout' },
    ],
  },
];

export const WorkoutProgramScreenSections = [
  {
    title: 'Program Analysis',
    icon: 'analytics',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze this program', toolName: 'analyzeProgram' },
      { icon: 'body', text: 'Check muscle balance', toolName: 'analyzeMuscleBalance' },
      { icon: 'bulb', text: 'Optimize this program', toolName: 'optimizeProgram' },
    ],
  },
  {
    title: 'Program Modifications',
    icon: 'create',
    buttons: [
      { icon: 'add', text: 'Add exercises', toolName: 'suggestExercises' },
      { icon: 'swap-horizontal', text: 'Swap exercises', toolName: 'searchExercises', params: { alternative: true } },
    ],
  },
];

// ============================================================
// SCREEN CONFIG MAPPING
// ============================================================

export const AI_SECTION_CONFIG = {
  // Workout Screens
  WorkoutScreen: WorkoutScreenSections,
  WorkoutAssistant: WorkoutAssistantSections, // Bottom "Ask AI Assistant" button
  StartWorkoutScreen: StartWorkoutScreenSections,
  WorkoutHistoryScreen: WorkoutHistoryScreenSections,
  WorkoutDetailScreen: WorkoutDetailScreenSections,
  WorkoutSummaryScreen: WorkoutSummaryScreenSections,
  WorkoutProgramScreen: WorkoutProgramScreenSections,
  ExerciseDetailScreen: ExerciseDetailScreenSections,
  ExerciseListScreen: ExerciseListScreenSections,
  MyPlansScreen: MyPlansScreenSections,
  TodayWorkoutOptionsScreen: StartWorkoutScreenSections,
  PlannedWorkoutDetailScreen: WorkoutScreenSections,

  // Nutrition Screens
  NutritionScreen: NutritionScreenSections,
  NutritionDashboard: NutritionScreenSections,
  FoodScanResultScreen: FoodScanResultScreenSections,
  MealsHistoryScreen: MealsHistoryScreenSections,
  RecipesScreen: [
    {
      title: 'Recipe Generation',
      icon: 'sparkles',
      hasSettings: true, // Show settings button next to section title
      buttons: [
        {
          icon: 'restaurant',
          text: 'Generate from ingredients',
          toolName: 'generateRecipeFromIngredients',
          promptTemplate: 'recentIngredients', // Special flag to use recent foods
          fallbackPrompt: 'Generate a healthy, high-protein recipe. CRITICAL: Pick COMPLETELY DIFFERENT ingredients each time. Randomly choose: 1 protein (chicken/beef/pork/salmon/tilapia/shrimp/turkey/eggs/tofu), 1 carb (white rice/brown rice/pasta/quinoa/potatoes/sweet potatoes/couscous), and 2-3 vegetables (broccoli/carrots/bell peppers/spinach/green beans/zucchini/mushrooms/asparagus). NEVER repeat the same combination. Mix it up every single time!'
        },
        {
          icon: 'fitness',
          text: 'High-protein recipe',
          toolName: 'generateHighProteinRecipe',
          usesPreferences: 'highProtein', // Uses user preferences
        },
        {
          icon: 'scale',
          text: 'Adapt recipe to my macros',
          toolName: 'adaptRecipeToMacros',
          prompt: 'Adjust my last recipe to 500 calories and 45g protein'
        },
      ],
    },
    {
      title: 'Recipe Help',
      icon: 'help-circle',
      buttons: [
        {
          icon: 'swap-horizontal',
          text: 'Substitute ingredient',
          toolName: 'suggestIngredientSubstitutions',
          prompt: 'I don\'t have chicken, what can I use?'
        },
        {
          icon: 'restaurant',
          text: 'High protein recipe',
          toolName: 'suggestRecipe',
          params: { highProtein: true },
          usesPreferences: 'highProtein'
        },
        {
          icon: 'flame',
          text: 'Low calorie recipe',
          toolName: 'suggestRecipe',
          params: { lowCalorie: true },
          usesPreferences: 'lowCalorie'
        },
      ],
    },
  ],

  // Progress Screens
  ProgressScreen: ProgressScreenSections,
  ProgressHubScreen: ProgressScreenSections,

  // Profile & Settings
  ProfileScreen: ProfileScreenSections,

  // Home & Main
  HomeScreen: HomeScreenSections,

  // Default fallback (empty sections)
  default: [],
};

/**
 * Get AI sections for a specific screen
 */
export function getAISectionsForScreen(screenName) {
  return AI_SECTION_CONFIG[screenName] || AI_SECTION_CONFIG.default;
}

/**
 * Check if a screen has AI sections
 */
export function hasAISections(screenName) {
  const sections = getAISectionsForScreen(screenName);
  return sections && sections.length > 0;
}

export default AI_SECTION_CONFIG;
