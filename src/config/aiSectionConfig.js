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
      { icon: 'play-skip-forward', text: 'Skip to next exercise', toolName: 'skipToNextExercise' },
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
      { icon: 'timer', text: 'Start rest timer', toolName: 'startRestTimer' },
    ],
  },
  {
    title: 'Status & Finish',
    icon: 'stats-chart',
    buttons: [
      { icon: 'information-circle', text: 'Check my progress', toolName: 'getActiveWorkoutStatus' },
      { icon: 'checkmark-done', text: 'Finish workout', toolName: 'finishWorkout' },
      { icon: 'star', text: 'Finish with rating', toolName: 'finishWorkout' },
    ],
  },
];

export const StartWorkoutScreenSections = [
  {
    title: 'Create Workout',
    icon: 'add-circle',
    buttons: [
      { icon: 'chatbubble-ellipses', text: 'Just create a workout', toolName: 'customWorkoutInput', isCustomInput: true },
      { icon: 'barbell', text: 'Push workout', toolName: 'generateWorkoutPlan', params: { type: 'push' } },
      { icon: 'return-down-back', text: 'Pull workout', toolName: 'generateWorkoutPlan', params: { type: 'pull' } },
      { icon: 'walk', text: 'Leg workout', toolName: 'generateWorkoutPlan', params: { type: 'legs' } },
      { icon: 'fitness', text: 'Full body workout', toolName: 'generateWorkoutPlan', params: { type: 'full_body' } },
      { icon: 'barbell', text: 'Chest & triceps', toolName: 'generateWorkoutPlan', params: { muscles: ['chest', 'triceps'] } },
      { icon: 'return-down-back', text: 'Back & biceps', toolName: 'generateWorkoutPlan', params: { muscles: ['back', 'biceps'] } },
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
    title: 'Daily Tracking',
    icon: 'stats-chart',
    buttons: [
      { icon: 'flame', text: 'Calories remaining?', toolName: 'getNutritionSummary' },
      { icon: 'restaurant', text: 'Protein remaining?', toolName: 'getNutritionSummary' },
      { icon: 'stats-chart', text: 'Today\'s macro breakdown', toolName: 'getNutritionSummary' },
      { icon: 'checkmark-circle', text: 'Am I on track?', toolName: 'analyzeNutritionProgress' },
    ],
  },
  {
    title: 'Meal Suggestions',
    icon: 'restaurant',
    buttons: [
      { icon: 'restaurant', text: 'High protein meal', toolName: 'suggestMeal', params: { highProtein: true } },
      { icon: 'flame', text: 'Low calorie meal', toolName: 'suggestMeal', params: { lowCalorie: true } },
      { icon: 'leaf', text: 'What to eat for dinner?', toolName: 'suggestMeal' },
      { icon: 'restaurant', text: 'Hit protein goal', toolName: 'suggestMeal', params: { targetProtein: true } },
    ],
  },
  {
    title: 'Macro Calculations',
    icon: 'calculator',
    buttons: [
      { icon: 'calculator', text: 'Calculate my macros', toolName: 'calculateMacros' },
      { icon: 'trending-down', text: 'Macros for cutting', toolName: 'calculateMacros', params: { goal: 'cutting' } },
      { icon: 'trending-up', text: 'Macros for bulking', toolName: 'calculateMacros', params: { goal: 'bulking' } },
      { icon: 'analytics', text: 'Adjust current macros', toolName: 'adjustMacros' },
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
    title: 'Progress Analysis',
    icon: 'trending-up',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze my progress', toolName: 'analyzeProgress' },
      { icon: 'trophy', text: 'Recent achievements', toolName: 'getRecentAchievements' },
      { icon: 'trending-up', text: 'Weight trend', toolName: 'analyzeWeightTrend' },
      { icon: 'body', text: 'Body composition', toolName: 'analyzeBodyComposition' },
    ],
  },
  {
    title: 'Goal Tracking',
    icon: 'trophy',
    buttons: [
      { icon: 'checkmark-circle', text: 'Am I on track?', toolName: 'checkGoalProgress' },
      { icon: 'calendar', text: 'Time to goal', toolName: 'estimateTimeToGoal' },
      { icon: 'bulb', text: 'Recommendations', toolName: 'getProgressRecommendations' },
    ],
  },
];

// ============================================================
// HOME & AI SCREENS
// ============================================================

export const HomeScreenSections = [
  {
    title: 'Quick Actions',
    icon: 'flash',
    buttons: [
      { icon: 'fitness', text: 'What to train today?', toolName: 'recommendWorkout' },
      { icon: 'restaurant', text: 'What to eat?', toolName: 'suggestMeal' },
      { icon: 'stats-chart', text: 'How am I doing?', toolName: 'getDailySummary' },
    ],
  },
  {
    title: 'Recent Activity',
    icon: 'time',
    buttons: [
      { icon: 'barbell', text: 'Last workout summary', toolName: 'getLastWorkout' },
      { icon: 'trophy', text: 'Recent PRs', toolName: 'getRecentPRs' },
      { icon: 'calendar', text: 'This week\'s progress', toolName: 'analyzeWeeklyProgress' },
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
      { icon: 'calculator', text: 'Calculate ideal macros', toolName: 'calculateMacros' },
      { icon: 'bulb', text: 'Suggest new goals', toolName: 'suggestGoals' },
      { icon: 'calendar', text: 'Create fitness plan', toolName: 'createFitnessPlan' },
    ],
  },
];

export const MealsHistoryScreenSections = [
  {
    title: 'Meal Analysis',
    icon: 'analytics',
    buttons: [
      { icon: 'stats-chart', text: 'Analyze eating patterns', toolName: 'analyzeMealPatterns' },
      { icon: 'trending-up', text: 'Macro consistency', toolName: 'analyzeMacroConsistency' },
      { icon: 'checkmark-circle', text: 'Am I hitting my goals?', toolName: 'analyzeNutritionProgress' },
    ],
  },
  {
    title: 'Meal Planning',
    icon: 'calendar',
    buttons: [
      { icon: 'restaurant', text: 'Plan meals for week', toolName: 'planWeeklyMeals' },
      { icon: 'copy', text: 'Copy successful day', toolName: 'copyMealDay' },
      { icon: 'bulb', text: 'Improve my diet', toolName: 'improveDiet' },
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
      title: 'Recipe Suggestions',
      icon: 'restaurant',
      buttons: [
        { icon: 'restaurant', text: 'High protein recipe', toolName: 'suggestRecipe', params: { highProtein: true } },
        { icon: 'leaf', text: 'Suggest recipe', toolName: 'suggestRecipe' },
        { icon: 'flame', text: 'Low calorie recipe', toolName: 'suggestRecipe', params: { lowCalorie: true } },
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
