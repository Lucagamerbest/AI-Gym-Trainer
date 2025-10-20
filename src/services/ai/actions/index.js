/**
 * Actions Index
 * Central export point for all action execution functions
 */

// Workout Actions
import {
  logSet,
  suggestWeight,
  getFormTip,
  checkPR,
  addExercise,
  analyzeProgression
} from './WorkoutActions';

// Workout Creation Actions
import {
  createWorkoutPlan,
  createWorkout,
  startCreatedWorkout,
  saveWorkoutToPlans,
  scheduleWorkout,
  planWorkoutForDate,
  showWorkoutFrequency
} from './WorkoutCreationActions';

// Nutrition Actions
import {
  addFood,
  suggestMeal,
  checkMacroBreakdown,
  checkNutritionProgress,
  checkNutrition
} from './NutritionActions';

// Progress Actions
import {
  setGoal,
  checkGoals,
  getAchievements,
  checkStreak,
  checkExerciseProgress
} from './ProgressActions';

// Program Actions
import { createProgram } from './ProgramActions';

// Recipe Actions
import {
  findRecipe,
  createRecipe,
  suggestRecipe,
  showSavedRecipes
} from './RecipeActions';

// Exercise Actions
import {
  getExerciseForm,
  checkExerciseHistory,
  checkExercisePR,
  suggestExerciseAlternative
} from './ExerciseActions';

// Home Actions
import {
  getTodaySummary,
  getMotivation,
  planWorkout
} from './HomeActions';

/**
 * Execute an action based on detected intent
 * This is the main entry point for all action executions
 */
export async function executeAction(intent, parameters, context) {


  try {
    switch (intent) {
      // Workout Actions
      case 'LOG_SET':
        return await logSet(parameters, context);

      case 'SUGGEST_WEIGHT':
        return await suggestWeight(parameters, context);

      case 'GET_FORM_TIP':
        return await getFormTip(parameters, context);

      case 'CHECK_PR':
        return await checkPR(parameters, context);

      case 'ADD_EXERCISE':
        return await addExercise(parameters, context);

      case 'ANALYZE_PROGRESSION':
        return await analyzeProgression(parameters, context);

      // Workout Creation Actions
      case 'CREATE_WORKOUT_PLAN':
        return await createWorkoutPlan(parameters, context);

      case 'CREATE_WORKOUT':
        return await createWorkout(parameters, context);

      case 'START_CREATED_WORKOUT':
        return await startCreatedWorkout(parameters, context);

      case 'SAVE_TO_PLANS':
        return await saveWorkoutToPlans(parameters, context);

      case 'SCHEDULE_WORKOUT':
        return await scheduleWorkout(parameters, context);

      case 'PLAN_WORKOUT_FOR_DATE':
        return await planWorkoutForDate(parameters, context);

      case 'SHOW_WORKOUT_FREQUENCY':
        return await showWorkoutFrequency(parameters, context);

      // Nutrition Actions
      case 'ADD_FOOD':
        return await addFood(parameters, context);

      case 'SUGGEST_MEAL':
        return await suggestMeal(parameters, context);

      case 'CHECK_MACRO_BREAKDOWN':
        return await checkMacroBreakdown(parameters, context);

      case 'CHECK_NUTRITION_PROGRESS':
        return await checkNutritionProgress(parameters, context);

      case 'CHECK_NUTRITION':
        return await checkNutrition(parameters, context);

      // Progress Actions
      case 'SET_GOAL':
        return await setGoal(parameters, context);

      case 'CHECK_GOALS':
        return await checkGoals(parameters, context);

      case 'GET_ACHIEVEMENTS':
        return await getAchievements(parameters, context);

      case 'CHECK_STREAK':
        return await checkStreak(parameters, context);

      case 'CHECK_EXERCISE_PROGRESS':
        return await checkExerciseProgress(parameters, context);

      // Program Actions
      case 'CREATE_PROGRAM':
        return await createProgram(parameters, context);

      // Recipe Actions
      case 'FIND_RECIPE':
        return await findRecipe(parameters, context);

      case 'CREATE_RECIPE':
        return await createRecipe(parameters, context);

      case 'SUGGEST_RECIPE':
        return await suggestRecipe(parameters, context);

      case 'SHOW_SAVED_RECIPES':
        return await showSavedRecipes(parameters, context);

      // Exercise Detail Actions
      case 'GET_EXERCISE_FORM':
        return await getExerciseForm(parameters, context);

      case 'CHECK_EXERCISE_HISTORY':
        return await checkExerciseHistory(parameters, context);

      case 'CHECK_EXERCISE_PR':
        return await checkExercisePR(parameters, context);

      case 'SUGGEST_EXERCISE_ALTERNATIVE':
        return await suggestExerciseAlternative(parameters, context);

      // Home Screen Actions
      case 'GET_TODAY_SUMMARY':
        return await getTodaySummary(parameters, context);

      case 'GET_MOTIVATION':
        return await getMotivation(parameters, context);

      case 'PLAN_WORKOUT':
        return await planWorkout(parameters, context);

      default:
        return null; // No action to execute, just answer the question
    }
  } catch (error) {
    console.error(`❌ Error executing action ${intent}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export all individual action functions as well
export {
  // Workout Actions
  logSet,
  suggestWeight,
  getFormTip,
  checkPR,
  addExercise,
  analyzeProgression,

  // Workout Creation Actions
  createWorkoutPlan,
  createWorkout,
  startCreatedWorkout,
  saveWorkoutToPlans,
  scheduleWorkout,
  planWorkoutForDate,
  showWorkoutFrequency,

  // Nutrition Actions
  addFood,
  suggestMeal,
  checkMacroBreakdown,
  checkNutritionProgress,
  checkNutrition,

  // Progress Actions
  setGoal,
  checkGoals,
  getAchievements,
  checkStreak,
  checkExerciseProgress,

  // Program Actions
  createProgram,

  // Recipe Actions
  findRecipe,
  createRecipe,
  suggestRecipe,
  showSavedRecipes,

  // Exercise Actions
  getExerciseForm,
  checkExerciseHistory,
  checkExercisePR,
  suggestExerciseAlternative,

  // Home Actions
  getTodaySummary,
  getMotivation,
  planWorkout
};

export default {
  executeAction
};
