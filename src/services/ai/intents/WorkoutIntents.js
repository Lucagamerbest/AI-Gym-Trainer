/**
 * Workout Intent Detection
 * Handles intent detection for WorkoutScreen, StartWorkoutScreen, ExerciseDetailScreen, and TodayWorkoutOptionsScreen
 */

import { extractExerciseName, extractMuscleGroups, extractDateFromMessage } from '../utils';

/**
 * Detect workout-related intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @param {Object} context - Additional context
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectWorkoutIntents(message, screen, context = {}) {
  const msg = message.toLowerCase().trim();

  // WORKOUT SCREEN & START WORKOUT SCREEN INTENTS
  if (screen === 'WorkoutScreen' || screen === 'StartWorkoutScreen') {

    // LOG_SET - "log 8 reps at 185" / "I did 3 sets of 225"
    if (msg.includes('log') || msg.includes('did') || msg.includes('completed')) {
      const repsMatch = msg.match(/(\d+)\s*(reps?|r)/i);
      const weightMatch = msg.match(/(\d+)\s*(lbs?|pounds?|kg)/i);
      const setsMatch = msg.match(/(\d+)\s*sets?/i);

      if (repsMatch || weightMatch) {
        return {
          intent: 'LOG_SET',
          confidence: 0.9,
          parameters: {
            reps: repsMatch ? parseInt(repsMatch[1]) : null,
            weight: weightMatch ? parseInt(weightMatch[1]) : null,
            sets: setsMatch ? parseInt(setsMatch[1]) : 1,
          }
        };
      }
    }

    // ANALYZE_PROGRESSION - "should I progress?" / "ready to increase?" / "am I ready to go heavier?"
    if ((msg.includes('should i') || msg.includes('am i ready') || msg.includes('ready to')) &&
        (msg.includes('progress') || msg.includes('increase') || msg.includes('add') || msg.includes('go heavier') || msg.includes('move up'))) {
      return {
        intent: 'ANALYZE_PROGRESSION',
        confidence: 0.95,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }

    // SUGGEST_WEIGHT - "what weight should I use?" / "go heavier?"
    if (msg.includes('what weight') || msg.includes('go heavier') ||
        msg.includes('increase weight')) {
      return {
        intent: 'SUGGEST_WEIGHT',
        confidence: 0.9,
        parameters: {}
      };
    }

    // GET_FORM_TIP - "bench press form" / "how to deadlift" / "squat tips"
    if (msg.includes('form') || msg.includes('how to') ||
        msg.includes('technique') || msg.includes('tips') ||
        msg.includes('hurts') || msg.includes('pain')) {
      return {
        intent: 'GET_FORM_TIP',
        confidence: 0.85,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }

    // CHECK_PR - "what's my PR" / "personal record" / "best lift"
    // BUT NOT "program" or "personalized"
    const hasPRKeyword = (msg.includes('personal record') ||
                          msg.includes(" pr") || msg.includes("pr ") ||
                          msg.includes('my pr') || msg.includes("what's my"));
    const notProgramRelated = !msg.includes('program') && !msg.includes('personalized');

    if ((hasPRKeyword || msg.includes('best') || msg.includes('max')) && notProgramRelated) {
      return {
        intent: 'CHECK_PR',
        confidence: 0.9,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }

    // ADD_EXERCISE - "add face pulls" / "include rows"
    if (msg.includes('add') && !msg.includes('weight')) {
      return {
        intent: 'ADD_EXERCISE',
        confidence: 0.8,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }
  }

  // START WORKOUT SCREEN INTENTS
  if (screen === 'StartWorkoutScreen') {

    // CREATE_WORKOUT - "create a workout" / "create a workout for chest" / "plan a workout"
    // BUT NOT meal/nutrition related ("create a meal plan")
    const isWorkoutCreation = (msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate') || msg.includes('plan')) &&
                              (msg.includes('workout') || msg.includes('session'));
    const isNotMealPlan = !msg.includes('meal') && !msg.includes('food') && !msg.includes('nutrition') && !msg.includes('diet');

    if (isWorkoutCreation && isNotMealPlan) {

      // Try to extract date from message
      const extractedDate = extractDateFromMessage(msg);

      return {
        intent: 'CREATE_WORKOUT',
        confidence: 0.95,
        parameters: {
          muscleGroups: extractMuscleGroups(msg),
          autoScheduleDate: extractedDate, // Will be null if no date found
          context: 'startWorkout'
        }
      };
    }

    // SUGGEST_WORKOUT - "what should I train" / "suggest exercises"
    if ((msg.includes('what') && (msg.includes('train') || msg.includes('workout'))) ||
        (msg.includes('suggest') && (msg.includes('exercise') || msg.includes('workout')))) {
      return {
        intent: 'PLAN_WORKOUT',
        confidence: 0.85,
        parameters: {
          muscleGroups: extractMuscleGroups(msg)
        }
      };
    }
  }

  // TODAY WORKOUT OPTIONS SCREEN INTENTS
  if (screen === 'TodayWorkoutOptionsScreen' || screen === 'TodayWorkoutOptions') {

    // CREATE_WORKOUT - "create a workout for chest" / "make a chest and tricep workout"
    // BUT NOT meal/nutrition related
    const isWorkoutCreation = (msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate')) &&
                              (msg.includes('workout') || msg.includes('day') || msg.includes('plan'));
    const isNotMealPlan = !msg.includes('meal') && !msg.includes('food') && !msg.includes('nutrition') && !msg.includes('diet');

    if (isWorkoutCreation && isNotMealPlan) {

      // Try to extract date from message
      const extractedDate = extractDateFromMessage(msg);

      return {
        intent: 'CREATE_WORKOUT',
        confidence: 0.95,
        parameters: {
          muscleGroups: extractMuscleGroups(msg),
          autoScheduleDate: extractedDate, // Will be null if no date found
          context: 'todayWorkout'
        }
      };
    }
  }

  // EXERCISE DETAIL SCREEN INTENTS
  if (screen === 'ExerciseDetailScreen' || screen === 'ExerciseDetail') {

    // ANALYZE_PROGRESSION - "should I progress?" / "ready to increase?" / "am I ready for more weight?"
    if ((msg.includes('should i') || msg.includes('am i ready') || msg.includes('ready to') || msg.includes('ready for')) &&
        (msg.includes('progress') || msg.includes('increase') || msg.includes('add') || msg.includes('go heavier') || msg.includes('move up') || msg.includes('more weight'))) {
      return {
        intent: 'ANALYZE_PROGRESSION',
        confidence: 0.95,
        parameters: {
          exercise: context.exerciseSpecific?.exerciseName || null
        }
      };
    }

    // GET_EXERCISE_FORM - "how to do this exercise" / "form tips" / "technique"
    if (msg.includes('how to') || msg.includes('form') ||
        msg.includes('technique') || msg.includes('tips') ||
        msg.includes('proper') || msg.includes('correct way')) {
      return {
        intent: 'GET_EXERCISE_FORM',
        confidence: 0.9,
        parameters: {
          exercise: context.exerciseSpecific?.exerciseName || null
        }
      };
    }

    // CHECK_EXERCISE_HISTORY - "show my history" / "past workouts" / "how many times"
    if (msg.includes('history') || msg.includes('past') ||
        msg.includes('how many times') || msg.includes('last time')) {
      return {
        intent: 'CHECK_EXERCISE_HISTORY',
        confidence: 0.9,
        parameters: {
          exercise: context.exerciseSpecific?.exerciseName || null
        }
      };
    }

    // CHECK_EXERCISE_PR - "what's my PR" / "personal record" / "best lift"
    if (msg.includes('pr') || msg.includes('personal record') ||
        msg.includes('best') || msg.includes('max') || msg.includes('strongest')) {
      return {
        intent: 'CHECK_EXERCISE_PR',
        confidence: 0.9,
        parameters: {
          exercise: context.exerciseSpecific?.exerciseName || null
        }
      };
    }

    // SUGGEST_EXERCISE_ALTERNATIVE - "alternative exercise" / "what else" / "substitute"
    if (msg.includes('alternative') || msg.includes('substitute') ||
        msg.includes('what else') || msg.includes('replace') ||
        msg.includes('instead of')) {
      return {
        intent: 'SUGGEST_EXERCISE_ALTERNATIVE',
        confidence: 0.85,
        parameters: {
          exercise: context.exerciseSpecific?.exerciseName || null
        }
      };
    }
  }

  return null;
}

/**
 * Detect workout history screen intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectWorkoutHistoryIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'WorkoutHistoryScreen') {
    return null;
  }

  // PLAN_WORKOUT_FOR_DATE - "plan a workout for tuesday" / "schedule leg day for october 31st"
  if ((msg.includes('plan') || msg.includes('schedule') || msg.includes('create') || msg.includes('make')) &&
      (msg.includes('workout') || msg.includes('day')) && !msg.includes('program')) {

    const extractedDate = extractDateFromMessage(msg);
    const muscleGroups = extractMuscleGroups(msg);

    return {
      intent: 'PLAN_WORKOUT_FOR_DATE',
      confidence: 0.95,
      parameters: {
        dateInfo: extractedDate,
        muscleGroups: muscleGroups,
        source: 'WorkoutHistoryScreen'
      }
    };
  }

  // SHOW_WORKOUT_FREQUENCY - "what did I train this week" / "show my workout frequency"
  if ((msg.includes('what') && (msg.includes('train') || msg.includes('workout')) && msg.includes('week')) ||
      msg.includes('frequency') || msg.includes('how often')) {
    return {
      intent: 'SHOW_WORKOUT_FREQUENCY',
      confidence: 0.9,
      parameters: {}
    };
  }

  return null;
}

/**
 * Detect home screen workout intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectHomeScreenWorkoutIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'HomeScreen' && screen !== 'Home') {
    return null;
  }

  // CREATE_WORKOUT_PLAN - "create chest day" / "make a workout" / "workout to hit biceps"
  if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate') ||
       msg.includes('i want') || msg.includes('need')) &&
      (msg.includes('workout') || msg.includes('day') || msg.includes('plan'))) {
    return {
      intent: 'CREATE_WORKOUT_PLAN',
      confidence: 0.95,
      parameters: {
        muscleGroup: extractMuscleGroups(msg)[0] || 'Full Body'
      }
    };
  }

  // PLAN_WORKOUT - "what should I train" / "what workout today"
  if ((msg.includes('what') && msg.includes('train')) ||
      (msg.includes('what') && msg.includes('workout')) ||
      msg.includes('should i workout')) {
    return {
      intent: 'PLAN_WORKOUT',
      confidence: 0.85,
      parameters: {}
    };
  }

  return null;
}
