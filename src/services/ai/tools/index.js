/**
 * Tools Index - Register all AI tools
 */

import ToolRegistry from './ToolRegistry';

// Import tool implementations
import {
  recommendTodaysWorkout,
  generateWorkoutProgram,
  generateWorkoutPlan,
  findExerciseAlternatives,
  replaceExerciseInWorkout,
  analyzeWorkoutHistory,
  workoutToolSchemas,
} from './WorkoutTools';

import {
  searchExercises,
  getExerciseInfo,
  getExerciseStats,
  recommendExercises,
  exerciseToolSchemas,
} from './ExerciseTools';

import {
  calculateMacros,
  getNutritionStatus,
  suggestMealsForMacros,
  calculateMealMacros,
  generateWeeklyMealPlan,
  suggestNextMealForBalance,
  predictDailyMacroShortfall,
  nutritionToolSchemas,
} from './NutritionTools';

import MealBalancingTool from './MealBalancingTool';

import {
  addExerciseToWorkout,
  modifyActiveWorkout,
  finishWorkout,
  skipToNextExercise,
  getActiveWorkoutStatus,
  startRestTimer,
  logWorkoutSet,
  removeCompletedSet,
  reorderExercise,
  logMeal,
  getRecentWorkouts,
  updateUserProfile,
  startWorkout,
  savePlannedWorkout,
  scheduleWorkoutForDate,
  crudToolSchemas,
} from './CRUDTools';

import {
  calculate1RM,
  calculatePercentage1RM,
  predictProgression,
  generateWarmupSets,
  strengthToolSchemas,
} from './StrengthTools';

import {
  analyzeWeeklyVolume,
  getProgressiveOverloadAdvice,
  checkDeloadStatus,
  analyzeExerciseProgression,
  volumeProgressionToolSchemas,
} from './VolumeProgressionTools';

import {
  navigateToScreen,
  goBackToPreviousScreen,
  getCurrentScreen,
  navigationToolSchemas,
} from './NavigationTools';

import {
  generateRecipeFromIngredients,
  generateHighProteinRecipe,
  adaptRecipeToMacros,
  suggestIngredientSubstitutions,
  generateMealComponents,
  recipeToolSchemas,
} from './RecipeTools';

import {
  predictGoalCompletionDate,
  detectProgressPlateau,
  estimateBodyFatPercentage,
  progressToolSchemas,
} from './ProgressTools';

/**
 * Initialize and register all tools
 */
export function initializeTools() {
  // Workout Tools
  ToolRegistry.registerTool('recommendTodaysWorkout', workoutToolSchemas[0], recommendTodaysWorkout);
  ToolRegistry.registerTool('generateWorkoutProgram', workoutToolSchemas[1], generateWorkoutProgram);
  ToolRegistry.registerTool('generateWorkoutPlan', workoutToolSchemas[2], generateWorkoutPlan);
  ToolRegistry.registerTool('findExerciseAlternatives', workoutToolSchemas[3], findExerciseAlternatives);
  ToolRegistry.registerTool('replaceExerciseInWorkout', workoutToolSchemas[4], replaceExerciseInWorkout);
  ToolRegistry.registerTool('analyzeWorkoutHistory', workoutToolSchemas[5], analyzeWorkoutHistory);

  // Exercise Tools
  ToolRegistry.registerTool('searchExercises', exerciseToolSchemas[0], searchExercises);
  ToolRegistry.registerTool('getExerciseInfo', exerciseToolSchemas[1], getExerciseInfo);
  ToolRegistry.registerTool('getExerciseStats', exerciseToolSchemas[2], getExerciseStats);
  ToolRegistry.registerTool('recommendExercises', exerciseToolSchemas[3], recommendExercises);

  // Nutrition Tools
  ToolRegistry.registerTool('calculateMacros', nutritionToolSchemas[0], calculateMacros);
  ToolRegistry.registerTool('getNutritionStatus', nutritionToolSchemas[1], getNutritionStatus);
  ToolRegistry.registerTool('suggestMealsForMacros', nutritionToolSchemas[2], suggestMealsForMacros);
  ToolRegistry.registerTool('calculateMealMacros', nutritionToolSchemas[3], calculateMealMacros);
  ToolRegistry.registerTool('generateWeeklyMealPlan', nutritionToolSchemas[4], generateWeeklyMealPlan);
  ToolRegistry.registerTool('suggestNextMealForBalance', nutritionToolSchemas[5], suggestNextMealForBalance);
  ToolRegistry.registerTool('predictDailyMacroShortfall', nutritionToolSchemas[6], predictDailyMacroShortfall);

  // Meal Balancing Tool (Smart meal recommendations)
  ToolRegistry.registerTool(MealBalancingTool.name, MealBalancingTool, MealBalancingTool.execute);

  // CRUD Tools (Create, Read, Update, Delete)
  ToolRegistry.registerTool('addExerciseToWorkout', crudToolSchemas[0], addExerciseToWorkout);
  ToolRegistry.registerTool('modifyActiveWorkout', crudToolSchemas[1], modifyActiveWorkout);
  ToolRegistry.registerTool('finishWorkout', crudToolSchemas[2], finishWorkout);
  ToolRegistry.registerTool('skipToNextExercise', crudToolSchemas[3], skipToNextExercise);
  ToolRegistry.registerTool('getActiveWorkoutStatus', crudToolSchemas[4], getActiveWorkoutStatus);
  ToolRegistry.registerTool('startRestTimer', crudToolSchemas[5], startRestTimer);
  ToolRegistry.registerTool('logWorkoutSet', crudToolSchemas[6], logWorkoutSet);
  ToolRegistry.registerTool('removeCompletedSet', crudToolSchemas[7], removeCompletedSet);
  ToolRegistry.registerTool('reorderExercise', crudToolSchemas[8], reorderExercise);
  ToolRegistry.registerTool('logMeal', crudToolSchemas[9], logMeal);
  ToolRegistry.registerTool('getRecentWorkouts', crudToolSchemas[10], getRecentWorkouts);
  ToolRegistry.registerTool('updateUserProfile', crudToolSchemas[11], updateUserProfile);
  ToolRegistry.registerTool('startWorkout', crudToolSchemas[12], startWorkout);
  ToolRegistry.registerTool('savePlannedWorkout', crudToolSchemas[13], savePlannedWorkout);
  ToolRegistry.registerTool('scheduleWorkoutForDate', crudToolSchemas[14], scheduleWorkoutForDate);

  // Strength Training Tools
  ToolRegistry.registerTool('calculate1RM', strengthToolSchemas[0], calculate1RM);
  ToolRegistry.registerTool('calculatePercentage1RM', strengthToolSchemas[1], calculatePercentage1RM);
  ToolRegistry.registerTool('predictProgression', strengthToolSchemas[2], predictProgression);
  ToolRegistry.registerTool('generateWarmupSets', strengthToolSchemas[3], generateWarmupSets);

  // Volume & Progression Tools (2024 Research)
  ToolRegistry.registerTool('analyzeWeeklyVolume', volumeProgressionToolSchemas[0], analyzeWeeklyVolume);
  ToolRegistry.registerTool('getProgressiveOverloadAdvice', volumeProgressionToolSchemas[1], getProgressiveOverloadAdvice);
  ToolRegistry.registerTool('checkDeloadStatus', volumeProgressionToolSchemas[2], checkDeloadStatus);
  ToolRegistry.registerTool('analyzeExerciseProgression', volumeProgressionToolSchemas[3], analyzeExerciseProgression);

  // Navigation Tools (Phase 1)
  ToolRegistry.registerTool('navigateToScreen', navigationToolSchemas[0], navigateToScreen);
  ToolRegistry.registerTool('goBackToPreviousScreen', navigationToolSchemas[1], goBackToPreviousScreen);
  ToolRegistry.registerTool('getCurrentScreen', navigationToolSchemas[2], getCurrentScreen);

  // Recipe Tools
  ToolRegistry.registerTool('generateRecipeFromIngredients', recipeToolSchemas[0], generateRecipeFromIngredients);
  ToolRegistry.registerTool('generateHighProteinRecipe', recipeToolSchemas[1], generateHighProteinRecipe);
  ToolRegistry.registerTool('adaptRecipeToMacros', recipeToolSchemas[2], adaptRecipeToMacros);
  ToolRegistry.registerTool('suggestIngredientSubstitutions', recipeToolSchemas[3], suggestIngredientSubstitutions);
  ToolRegistry.registerTool('generateMealComponents', recipeToolSchemas[4], generateMealComponents);

  // Progress Tools
  ToolRegistry.registerTool('predictGoalCompletionDate', progressToolSchemas[0], predictGoalCompletionDate);
  ToolRegistry.registerTool('detectProgressPlateau', progressToolSchemas[1], detectProgressPlateau);
  ToolRegistry.registerTool('estimateBodyFatPercentage', progressToolSchemas[2], estimateBodyFatPercentage);

  console.log(`✅ Initialized ${ToolRegistry.getToolCount()} AI tools (including navigation, recipes, progress & 2024 research tools)`);
}

export { ToolRegistry };
export default ToolRegistry;
