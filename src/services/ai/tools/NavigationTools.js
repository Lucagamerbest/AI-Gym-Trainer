/**
 * Navigation Tools
 *
 * AI tools for programmatic navigation throughout the app.
 * Allows the AI agent to navigate users to different screens after performing actions.
 */

import NavigationService from '../../NavigationService';

/**
 * Navigate to a specific screen in the app
 *
 * Use cases:
 * - After creating a workout → navigate to WorkoutScreen to start it
 * - After calculating macros → navigate to NutritionScreen
 * - After generating a program → navigate to MyPlans
 * - User asks to "show me my progress" → navigate to Progress screen
 */
export async function navigateToScreen({ screenName, params = {} }) {
  try {
    // List of valid screens (matching App.js Stack.Screen names)
    const validScreens = [
      // Main tabs
      'Main', 'Home', 'AI', 'Profile',

      // Workout screens
      'StartWorkout', 'Workout', 'WorkoutSummary', 'WorkoutFinalization',
      'WorkoutHistory', 'WorkoutDetail', 'TodayWorkoutOptions',
      'MyPlans', 'PlannedWorkoutDetail', 'PlanWorkout',
      'WorkoutProgram', 'WorkoutProgramsList', 'WorkoutDayEdit',
      'ProgramDaySelection',

      // Exercise screens
      'ExerciseList', 'ExerciseDetail', 'CreateExercise',
      'MuscleGroupSelection', 'EquipmentVariantSelection',
      'ExerciseSettings',

      // Nutrition screens
      'Nutrition', 'NutritionDashboard', 'FoodSearch', 'FoodDetail',
      'FoodScanning', 'FoodScan', 'FoodScanResult', 'Camera',
      'MealsHistory', 'Recipes', 'CalorieBreakdown',
      'EditRecipe', 'EditFoodItem', 'CreateMealPlan',
      'MealPlanTemplates', 'FoodSettings',

      // Progress screens
      'Progress', 'ProgressHub',

      // Other screens
      'Training', 'Settings', 'AIAssistant', 'AICoachAssessment',
      'UserProfile', 'ImageViewer', 'Debug',
    ];

    // Validate screen name
    if (!validScreens.includes(screenName)) {
      return {
        success: false,
        error: `Invalid screen: "${screenName}". Valid screens: ${validScreens.slice(0, 10).join(', ')}... (${validScreens.length} total)`,
      };
    }

    // Check if navigation is ready
    if (!NavigationService.isReady()) {
      return {
        success: false,
        error: 'Navigation not ready yet. Please try again.',
      };
    }

    // Navigate to the screen
    NavigationService.navigate(screenName, params);


    return {
      success: true,
      message: `Navigated to ${screenName}`,
      screen: screenName,
      params: params,
    };
  } catch (error) {
    console.error('❌ Navigation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Go back to previous screen
 */
export async function goBackToPreviousScreen() {
  try {
    if (!NavigationService.isReady()) {
      return {
        success: false,
        error: 'Navigation not ready yet',
      };
    }

    NavigationService.goBack();

    return {
      success: true,
      message: 'Navigated back to previous screen',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current screen name
 */
export async function getCurrentScreen() {
  try {
    const currentRoute = NavigationService.getCurrentRoute();

    if (!currentRoute) {
      return {
        success: false,
        error: 'Could not determine current screen',
      };
    }

    return {
      success: true,
      screen: currentRoute,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================
// TOOL SCHEMAS (for Gemini function calling)
// ============================================================

export const navigationToolSchemas = [
  // 1. Navigate to screen
  {
    name: 'navigateToScreen',
    description: `Navigate the user to a specific screen in the app. Use this AFTER performing actions that require showing a screen.

WHEN TO USE:
- After creating/generating a workout → navigate to "StartWorkout" or "Workout"
- After calculating macros → navigate to "Nutrition" or "NutritionDashboard"
- After saving a workout plan → navigate to "MyPlans"
- User asks "show me my progress" → navigate to "Progress"
- User asks "show my workout history" → navigate to "WorkoutHistory"
- After recommending today's workout → navigate to "StartWorkout"
- User asks to "start a workout" → navigate to "StartWorkout"

COMMON NAVIGATION PATTERNS:
- Workout creation flow: StartWorkout → ExerciseList → Workout
- Nutrition flow: Nutrition → FoodSearch → FoodDetail
- Progress flow: Progress → ExerciseDetail
- Planning flow: MyPlans → PlannedWorkoutDetail

IMPORTANT:
- Only navigate AFTER completing an action (e.g., after generateWorkoutPlan succeeds)
- Don't navigate if the user is just asking questions
- Use this to complete the user's workflow seamlessly`,
    parameters: {
      type: 'object',
      properties: {
        screenName: {
          type: 'string',
          enum: [
            'StartWorkout', 'Workout', 'WorkoutHistory', 'MyPlans', 'Progress',
            'Nutrition', 'NutritionDashboard', 'ExerciseList', 'ExerciseDetail',
            'FoodSearch', 'Home', 'Profile', 'WorkoutSummary', 'ProgressHub',
            'Training', 'Settings', 'AICoachAssessment', 'WorkoutDetail',
            'PlannedWorkoutDetail', 'TodayWorkoutOptions', 'MealsHistory',
            'Recipes', 'CalorieBreakdown', 'FoodScanning', 'CreateExercise',
            'WorkoutProgram', 'WorkoutProgramsList',
          ],
          description: 'The screen to navigate to. Choose based on the action completed or user request.',
        },
        params: {
          type: 'object',
          description: 'Optional parameters to pass to the screen (e.g., { workoutId: "123", exerciseName: "Bench Press" })',
          properties: {
            workoutId: { type: 'string' },
            exerciseId: { type: 'string' },
            exerciseName: { type: 'string' },
            foodId: { type: 'string' },
            date: { type: 'string' },
          },
        },
      },
      required: ['screenName'],
    },
  },

  // 2. Go back
  {
    name: 'goBackToPreviousScreen',
    description: 'Navigate back to the previous screen. Use when user wants to cancel or go back.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // 3. Get current screen
  {
    name: 'getCurrentScreen',
    description: 'Get the name of the current screen the user is on. Useful for context-aware responses.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
