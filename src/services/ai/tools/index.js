/**
 * Tools Index - Register all AI tools
 */

import ToolRegistry from './ToolRegistry';

// Import tool implementations
import {
  generateWorkoutProgram,
  generateWorkoutPlan,
  findExerciseAlternatives,
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
  nutritionToolSchemas,
} from './NutritionTools';

import {
  addExerciseToWorkout,
  logWorkoutSet,
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

/**
 * Initialize and register all tools
 */
export function initializeTools() {
  // Workout Tools
  ToolRegistry.registerTool('generateWorkoutProgram', workoutToolSchemas[0], generateWorkoutProgram);
  ToolRegistry.registerTool('generateWorkoutPlan', workoutToolSchemas[1], generateWorkoutPlan);
  ToolRegistry.registerTool('findExerciseAlternatives', workoutToolSchemas[2], findExerciseAlternatives);
  ToolRegistry.registerTool('analyzeWorkoutHistory', workoutToolSchemas[3], analyzeWorkoutHistory);

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

  // CRUD Tools (Create, Read, Update, Delete)
  ToolRegistry.registerTool('addExerciseToWorkout', crudToolSchemas[0], addExerciseToWorkout);
  ToolRegistry.registerTool('logWorkoutSet', crudToolSchemas[1], logWorkoutSet);
  ToolRegistry.registerTool('logMeal', crudToolSchemas[2], logMeal);
  ToolRegistry.registerTool('getRecentWorkouts', crudToolSchemas[3], getRecentWorkouts);
  ToolRegistry.registerTool('updateUserProfile', crudToolSchemas[4], updateUserProfile);
  ToolRegistry.registerTool('startWorkout', crudToolSchemas[5], startWorkout);
  ToolRegistry.registerTool('savePlannedWorkout', crudToolSchemas[6], savePlannedWorkout);
  ToolRegistry.registerTool('scheduleWorkoutForDate', crudToolSchemas[7], scheduleWorkoutForDate);

  // Strength Training Tools
  ToolRegistry.registerTool('calculate1RM', strengthToolSchemas[0], calculate1RM);
  ToolRegistry.registerTool('calculatePercentage1RM', strengthToolSchemas[1], calculatePercentage1RM);
  ToolRegistry.registerTool('predictProgression', strengthToolSchemas[2], predictProgression);
  ToolRegistry.registerTool('generateWarmupSets', strengthToolSchemas[3], generateWarmupSets);

  console.log(`✅ Initialized ${ToolRegistry.getToolCount()} AI tools`);
}

export { ToolRegistry };
export default ToolRegistry;
