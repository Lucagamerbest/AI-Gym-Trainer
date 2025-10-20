/**
 * Intent Detection Module
 * Central export point for all intent detection functions
 */

export {
  detectWorkoutIntents,
  detectWorkoutHistoryIntents,
  detectHomeScreenWorkoutIntents
} from './WorkoutIntents';

export {
  detectNutritionIntents,
  detectHomeScreenNutritionIntents
} from './NutritionIntents';

export { detectProgressIntents } from './ProgressIntents';
export { detectProgramIntents } from './ProgramIntents';
export { detectRecipeIntents } from './RecipeIntents';

export {
  detectHomeScreenIntents,
  detectGlobalWorkoutActionIntents
} from './GlobalIntents';
