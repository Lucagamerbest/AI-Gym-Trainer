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
 * Note: Snacks can happen anytime, so no specific snack time
 */
export function getCurrentMealType() {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 11) {
    return 'breakfast';
  } else if (currentHour >= 11 && currentHour < 16) {
    return 'lunch';
  } else {
    // 4pm onwards = dinner (including late night)
    return 'dinner';
  }
}

// ============================================================
// WORKOUT SCREENS
// ============================================================

export const WorkoutScreenSections = [
  {
    title: 'Quick Actions',
    icon: 'flash',
    buttons: [
      {
        icon: 'trending-up',
        text: 'Suggest next weight',
        instantAction: 'SUGGEST_WEIGHT',
        description: 'Based on history'
      },
      {
        icon: 'timer',
        text: 'Recommend rest time',
        instantAction: 'RECOMMEND_REST',
        description: 'Based on goal'
      },
      {
        icon: 'speedometer',
        text: 'RPE Calculator',
        instantAction: 'RPE_CALCULATOR',
        description: 'Rate your effort'
      },
      {
        icon: 'swap-horizontal',
        text: 'Find alternative',
        instantAction: 'FIND_ALTERNATIVE',
        description: 'Swap exercise'
      },
    ],
  },
  {
    title: 'Exercise Management',
    icon: 'list',
    buttons: [
      {
        icon: 'add',
        text: 'Add similar exercise',
        instantAction: 'ADD_SIMILAR',
        description: 'Find variations'
      },
      {
        icon: 'link',
        text: 'Add superset exercise',
        instantAction: 'ADD_SUPERSET',
        description: 'Pair with current'
      },
      {
        icon: 'add-circle',
        text: 'Should I do another set?',
        instantAction: 'RECOMMEND_EXTRA_SET',
        description: 'Based on volume'
      },
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
    title: 'Quick Start',
    icon: 'flash',
    buttons: [
      {
        icon: 'calendar',
        text: 'What to train today?',
        instantAction: 'RECOMMEND_TODAY',
        description: 'Based on history'
      },
      {
        icon: 'time',
        text: 'Last workout info',
        instantAction: 'LAST_WORKOUT',
        description: 'What you did'
      },
      {
        icon: 'body',
        text: 'Muscles to prioritize',
        instantAction: 'MUSCLE_PRIORITY',
        description: 'Recovery status'
      },
    ],
  },
  {
    title: 'Create Workout',
    icon: 'add-circle',
    buttons: [
      { icon: 'barbell', text: 'Push workout', toolName: 'generateWorkoutPlan', params: { type: 'push' } },
      { icon: 'return-down-back', text: 'Pull workout', toolName: 'generateWorkoutPlan', params: { type: 'pull' } },
      { icon: 'walk', text: 'Leg workout', toolName: 'generateWorkoutPlan', params: { type: 'legs' } },
      { icon: 'fitness', text: 'Full body workout', toolName: 'generateWorkoutPlan', params: { type: 'full_body' } },
    ],
  },
  {
    title: 'Browse Exercises',
    icon: 'search',
    buttons: [
      {
        icon: 'barbell',
        text: 'Chest exercises',
        instantAction: 'BROWSE_EXERCISES',
        params: { muscle: 'chest' },
        description: 'Pecs & front delts'
      },
      {
        icon: 'return-down-back',
        text: 'Back exercises',
        instantAction: 'BROWSE_EXERCISES',
        params: { muscle: 'back' },
        description: 'Lats, traps, rhomboids'
      },
      {
        icon: 'walk',
        text: 'Leg exercises',
        instantAction: 'BROWSE_EXERCISES',
        params: { muscle: 'legs' },
        description: 'Quads, hams, glutes'
      },
      {
        icon: 'fitness',
        text: 'Arms & Shoulders',
        instantAction: 'BROWSE_EXERCISES',
        params: { muscle: 'arms' },
        description: 'Biceps, triceps, delts'
      },
    ],
  },
];

export const WorkoutHistoryScreenSections = [
  {
    title: 'Quick Stats',
    icon: 'flash',
    buttons: [
      {
        icon: 'calendar',
        text: 'This week summary',
        instantAction: 'WEEK_SUMMARY',
        description: 'Workouts & volume'
      },
      {
        icon: 'trophy',
        text: 'Recent PRs',
        instantAction: 'RECENT_PRS',
        description: 'Personal records'
      },
      {
        icon: 'body',
        text: 'Muscle balance',
        instantAction: 'MUSCLE_BALANCE',
        description: 'What needs work'
      },
      {
        icon: 'flame',
        text: 'Streak status',
        instantAction: 'STREAK_STATUS',
        description: 'Consistency check'
      },
    ],
  },
  {
    title: 'Analysis',
    icon: 'stats-chart',
    buttons: [
      {
        icon: 'trending-up',
        text: 'Volume trend',
        instantAction: 'VOLUME_TREND',
        description: 'Weekly comparison'
      },
      {
        icon: 'fitness',
        text: 'Workout frequency',
        instantAction: 'WORKOUT_FREQUENCY',
        description: 'Days per week'
      },
    ],
  },
];

export const ExerciseDetailScreenSections = [
  {
    title: 'Quick Stats',
    icon: 'flash',
    buttons: [
      {
        icon: 'trophy',
        text: 'My PR',
        instantAction: 'EXERCISE_PR',
        description: 'Personal record'
      },
      {
        icon: 'trending-up',
        text: 'Progression',
        instantAction: 'EXERCISE_PROGRESSION',
        description: 'Weight over time'
      },
      {
        icon: 'calendar',
        text: 'Recent history',
        instantAction: 'EXERCISE_HISTORY',
        description: 'Last 5 sessions'
      },
    ],
  },
  {
    title: 'Guidance',
    icon: 'bulb',
    buttons: [
      {
        icon: 'barbell',
        text: 'Next weight suggestion',
        instantAction: 'SUGGEST_WEIGHT',
        description: 'Progressive overload'
      },
      {
        icon: 'swap-horizontal',
        text: 'Find alternatives',
        instantAction: 'FIND_ALTERNATIVE',
        description: 'Similar exercises'
      },
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
    title: 'Meal Prep & Quick Options',
    icon: 'time',
    buttons: [
      { icon: 'cube', text: 'Meal prep components', toolName: 'generateMealComponents' },
      { icon: 'flash', text: 'Quick meal (<15 min)', toolName: 'generateRecipeFromIngredients', params: { maxPrepTime: 15 } },
      { icon: 'pizza', text: 'Full cooking meal', toolName: 'generateRecipeFromIngredients', params: { minPrepTime: 30 } },
      { icon: 'restaurant', text: 'Meal prep recipe', toolName: 'generateRecipeFromIngredients', params: { mealPrepFriendly: true } },
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
    title: 'Quick Filters',
    icon: 'flash',
    buttons: [
      {
        icon: 'barbell',
        text: 'By muscle group',
        instantAction: 'FILTER_BY_MUSCLE',
        description: 'Chest, back, legs...'
      },
      {
        icon: 'cube',
        text: 'By equipment',
        instantAction: 'FILTER_BY_EQUIPMENT',
        description: 'Dumbbells, cables...'
      },
      {
        icon: 'home',
        text: 'Bodyweight only',
        instantAction: 'BROWSE_EXERCISES',
        params: { equipment: 'bodyweight' },
        description: 'No equipment needed'
      },
    ],
  },
  {
    title: 'Exercise Help',
    icon: 'bulb',
    buttons: [
      {
        icon: 'swap-horizontal',
        text: 'Find alternatives',
        instantAction: 'FIND_ALTERNATIVE',
        description: 'Similar exercises'
      },
      {
        icon: 'link',
        text: 'Superset pairings',
        instantAction: 'ADD_SUPERSET',
        description: 'Pair exercises'
      },
    ],
  },
];

export const MyPlansScreenSections = [
  {
    title: 'Quick Info',
    icon: 'flash',
    buttons: [
      {
        icon: 'stats-chart',
        text: 'Program overview',
        instantAction: 'PROGRAM_OVERVIEW',
        description: 'Days, splits, goals'
      },
      {
        icon: 'body',
        text: 'Muscle coverage',
        instantAction: 'MUSCLE_BALANCE',
        description: 'Check balance'
      },
      {
        icon: 'calendar',
        text: 'Weekly schedule',
        instantAction: 'WEEKLY_SCHEDULE',
        description: 'Your training days'
      },
    ],
  },
  {
    title: 'Popular Splits',
    icon: 'copy',
    buttons: [
      {
        icon: 'calendar',
        text: 'PPL (6 days)',
        instantAction: 'SHOW_SPLIT_INFO',
        params: { type: 'ppl' },
        description: 'Push/Pull/Legs'
      },
      {
        icon: 'barbell',
        text: 'Upper/Lower (4 days)',
        instantAction: 'SHOW_SPLIT_INFO',
        params: { type: 'upper_lower' },
        description: 'Classic split'
      },
      {
        icon: 'fitness',
        text: 'Full Body (3 days)',
        instantAction: 'SHOW_SPLIT_INFO',
        params: { type: 'full_body' },
        description: 'Hit all muscles'
      },
      {
        icon: 'body',
        text: 'Bro Split (5 days)',
        instantAction: 'SHOW_SPLIT_INFO',
        params: { type: 'bro_split' },
        description: 'One muscle/day'
      },
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
    title: 'Workout Stats',
    icon: 'flash',
    buttons: [
      {
        icon: 'trophy',
        text: 'Did I hit any PRs?',
        instantAction: 'CHECK_WORKOUT_PRS',
        description: 'Personal records'
      },
      {
        icon: 'trending-up',
        text: 'Compare to last time',
        instantAction: 'COMPARE_WORKOUT',
        description: 'Volume & intensity'
      },
      {
        icon: 'bar-chart',
        text: 'Volume breakdown',
        instantAction: 'VOLUME_BREAKDOWN',
        description: 'Sets per muscle'
      },
      {
        icon: 'body',
        text: 'Muscles worked',
        instantAction: 'MUSCLES_WORKED',
        description: 'Coverage check'
      },
    ],
  },
  {
    title: 'Next Steps',
    icon: 'arrow-forward',
    buttons: [
      {
        icon: 'calendar',
        text: 'What to train next?',
        instantAction: 'RECOMMEND_NEXT',
        description: 'Based on recovery'
      },
      {
        icon: 'time',
        text: 'Recovery time',
        instantAction: 'RECOVERY_TIME',
        description: 'When to train again'
      },
    ],
  },
];

export const WorkoutDetailScreenSections = [
  {
    title: 'Workout Stats',
    icon: 'flash',
    buttons: [
      {
        icon: 'stats-chart',
        text: 'Workout summary',
        instantAction: 'WORKOUT_SUMMARY',
        description: 'Volume & exercises'
      },
      {
        icon: 'body',
        text: 'Muscles worked',
        instantAction: 'MUSCLES_WORKED',
        description: 'Coverage check'
      },
      {
        icon: 'trophy',
        text: 'PRs from this workout',
        instantAction: 'CHECK_WORKOUT_PRS',
        description: 'Personal records'
      },
    ],
  },
  {
    title: 'Workout Actions',
    icon: 'settings',
    buttons: [
      {
        icon: 'copy',
        text: 'Repeat this workout',
        instantAction: 'REPEAT_WORKOUT',
        description: 'Do it again'
      },
      {
        icon: 'trending-up',
        text: 'Compare performance',
        instantAction: 'COMPARE_WORKOUT',
        description: 'vs last time'
      },
    ],
  },
];

export const WorkoutProgramScreenSections = [
  {
    title: 'Program Info',
    icon: 'flash',
    buttons: [
      {
        icon: 'stats-chart',
        text: 'Program overview',
        instantAction: 'PROGRAM_OVERVIEW',
        description: 'Days & exercises'
      },
      {
        icon: 'body',
        text: 'Muscle coverage',
        instantAction: 'MUSCLE_BALANCE',
        description: 'Check balance'
      },
      {
        icon: 'calendar',
        text: 'Weekly volume',
        instantAction: 'WEEKLY_VOLUME',
        description: 'Sets per muscle'
      },
    ],
  },
  {
    title: 'Modify Program',
    icon: 'create',
    buttons: [
      {
        icon: 'swap-horizontal',
        text: 'Swap exercises',
        instantAction: 'FIND_ALTERNATIVE',
        description: 'Find alternatives'
      },
      {
        icon: 'add',
        text: 'Add exercises',
        instantAction: 'ADD_SIMILAR',
        description: 'More exercises'
      },
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
          icon: 'flame',
          text: 'Low-calorie recipe',
          toolName: 'generateLowCalorieRecipe',
          usesPreferences: 'lowCalorie', // Uses user preferences
        },
        {
          icon: 'leaf',
          text: 'Balanced recipe',
          toolName: 'generateBalancedRecipe',
          usesPreferences: 'balanced', // Uses user preferences
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
