/**
 * AIActions.js - Simple intent detection and action execution
 *
 * This handles AI taking REAL ACTIONS in the app, not just answering questions.
 * Each screen defines its own actions.
 */

import { WorkoutStorageService } from '../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from './ContextManager';
import BackendService from '../backend/BackendService';

/**
 * Detect intent from user message
 * Returns: { intent: string, confidence: number, parameters: object }
 */
export function detectIntent(message, screen) {
  const msg = message.toLowerCase().trim();





  // WORKOUT SCREEN INTENTS
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

    // CREATE_PROGRAM - "create a program" / "create a 6-day PPL program" / "personalized program"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate')) &&
        (msg.includes('program') || msg.includes('split'))) {

      // Extract number of days if mentioned
      const daysMatch = msg.match(/(\d+)\s*day/i);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

      // Check for specific program types
      let programType = null;
      if (msg.includes('push pull legs') || msg.includes('ppl')) {
        programType = 'push_pull_legs';
      } else if (msg.includes('upper lower') || msg.includes('upper/lower')) {
        programType = 'upper_lower';
      } else if (msg.includes('bro split') || msg.includes('body part split')) {
        programType = 'bro_split';
      } else if (msg.includes('full body')) {
        programType = 'full_body';
      } else if (msg.includes('personalized') || msg.includes('for my goals')) {
        programType = 'personalized';
      }

      return {
        intent: 'CREATE_PROGRAM',
        confidence: 0.95,
        parameters: {
          numDays: numDays,
          programType: programType,
          muscleGroups: extractMuscleGroups(msg)
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

  // NUTRITION SCREEN INTENTS
  if (screen === 'NutritionScreen' || screen === 'Nutrition') {

    // ADD_FOOD - "add chicken" / "log 200g chicken breast"
    if ((msg.includes('add') || msg.includes('log')) &&
        !msg.includes('workout') && !msg.includes('exercise')) {
      // Extract food name and quantity
      const quantityMatch = msg.match(/(\d+)\s*(g|grams?|oz)/i);
      const foodWords = msg.split(' ').filter(w =>
        !['add', 'log', 'the', 'some', 'a', 'an', 'to'].includes(w.toLowerCase()) &&
        !/\d/.test(w)
      );

      return {
        intent: 'ADD_FOOD',
        confidence: 0.85,
        parameters: {
          foodName: foodWords.join(' ') || null,
          quantity: quantityMatch ? parseInt(quantityMatch[1]) : null
        }
      };
    }

    // SUGGEST_MEAL - "what should I eat" / "meal idea" / "suggest lunch"
    if ((msg.includes('what') && msg.includes('eat')) ||
        msg.includes('suggest') || msg.includes('meal idea') ||
        msg.includes('what to eat') || msg.includes('food recommendation')) {
      return {
        intent: 'SUGGEST_MEAL',
        confidence: 0.9,
        parameters: {}
      };
    }

    // CHECK_MACRO_BREAKDOWN - "show protein by meal" / "macros breakdown"
    if (msg.includes('breakdown') || msg.includes('macros by meal') ||
        (msg.includes('show') && (msg.includes('protein') || msg.includes('macros')))) {
      return {
        intent: 'CHECK_MACRO_BREAKDOWN',
        confidence: 0.85,
        parameters: {}
      };
    }

    // CHECK_NUTRITION_PROGRESS - "am I on track" / "calories left" / "how am I doing"
    if (msg.includes('on track') || msg.includes('left today') ||
        msg.includes('remaining') || msg.includes('how am i doing') ||
        (msg.includes('calories') && msg.includes('left'))) {
      return {
        intent: 'CHECK_NUTRITION_PROGRESS',
        confidence: 0.9,
        parameters: {}
      };
    }
  }

  // PROGRESS SCREEN INTENTS
  if (screen === 'ProgressScreen' || screen === 'Progress') {

    // SET_GOAL - "set a goal for bench press" / "I want to squat 315" / "set deadlift goal"
    if ((msg.includes('set') && msg.includes('goal')) ||
        (msg.includes('i want to') && (msg.includes('lift') || msg.includes('bench') ||
         msg.includes('squat') || msg.includes('deadlift')))) {
      return {
        intent: 'SET_GOAL',
        confidence: 0.9,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }

    // CHECK_GOALS - "show my goals" / "am I close to my goals" / "goal progress"
    if ((msg.includes('goal') && !msg.includes('set')) ||
        msg.includes('close to') || msg.includes('goal progress')) {
      return {
        intent: 'CHECK_GOALS',
        confidence: 0.9,
        parameters: {}
      };
    }

    // GET_ACHIEVEMENTS - "show my achievements" / "what badges have I earned" / "my accomplishments"
    if (msg.includes('achievement') || msg.includes('badge') ||
        msg.includes('accomplishment') || msg.includes('earned')) {
      return {
        intent: 'GET_ACHIEVEMENTS',
        confidence: 0.9,
        parameters: {}
      };
    }

    // CHECK_STREAK - "what's my streak" / "how many days in a row" / "streak status"
    if (msg.includes('streak') || msg.includes('days in a row') ||
        msg.includes('consecutive')) {
      return {
        intent: 'CHECK_STREAK',
        confidence: 0.9,
        parameters: {}
      };
    }

    // CHECK_EXERCISE_PROGRESS - "show my squat progress" / "how am I doing on deadlifts"
    if ((msg.includes('progress') || msg.includes('improvement') ||
         msg.includes('how am i doing')) && !msg.includes('nutrition')) {
      return {
        intent: 'CHECK_EXERCISE_PROGRESS',
        confidence: 0.85,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }

    // CHECK_PR - Enhanced for Progress screen context
    if (msg.includes('pr') || msg.includes('personal record') ||
        msg.includes('best') || msg.includes('max')) {
      return {
        intent: 'CHECK_PR',
        confidence: 0.9,
        parameters: {
          exercise: extractExerciseName(msg)
        }
      };
    }
  }

  // RECIPES SCREEN INTENTS
  if (screen === 'RecipesScreen' || screen === 'Recipes') {

    // FIND_RECIPE - "find a high protein recipe" / "recipe for chicken" / "show me a recipe"
    if ((msg.includes('find') || msg.includes('search') || msg.includes('show')) &&
        msg.includes('recipe')) {
      const isHighProtein = msg.includes('high protein') || msg.includes('protein');
      const isLowCalorie = msg.includes('low calorie') || msg.includes('low cal');
      const isQuick = msg.includes('quick') || msg.includes('easy');

      return {
        intent: 'FIND_RECIPE',
        confidence: 0.9,
        parameters: {
          filter: isHighProtein ? 'high-protein' : isLowCalorie ? 'low-calorie' : isQuick ? 'quick' : null
        }
      };
    }

    // CREATE_RECIPE - "create a new recipe" / "add a recipe" / "make a recipe"
    if ((msg.includes('create') || msg.includes('add') || msg.includes('make') ||
         msg.includes('save')) && msg.includes('recipe')) {
      return {
        intent: 'CREATE_RECIPE',
        confidence: 0.9,
        parameters: {}
      };
    }

    // SUGGEST_RECIPE - "what should I cook" / "recipe idea" / "meal prep suggestion"
    if ((msg.includes('what') && msg.includes('cook')) ||
        (msg.includes('recipe') && msg.includes('idea')) ||
        msg.includes('meal prep') || msg.includes('suggest')) {
      return {
        intent: 'SUGGEST_RECIPE',
        confidence: 0.9,
        parameters: {}
      };
    }

    // SHOW_SAVED_RECIPES - "show my recipes" / "what recipes do I have" / "my saved recipes"
    if ((msg.includes('my') && msg.includes('recipe')) ||
        (msg.includes('saved') && msg.includes('recipe')) ||
        msg.includes('what recipes')) {
      return {
        intent: 'SHOW_SAVED_RECIPES',
        confidence: 0.9,
        parameters: {}
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

  // START WORKOUT SCREEN INTENTS
  if (screen === 'StartWorkoutScreen') {

    // CREATE_WORKOUT - "create a workout" / "create a workout for chest" / "plan a workout"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate') || msg.includes('plan')) &&
        (msg.includes('workout') || msg.includes('session'))) {

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
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate')) &&
        (msg.includes('workout') || msg.includes('day') || msg.includes('plan'))) {

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

  // WORKOUT HISTORY SCREEN INTENTS
  if (screen === 'WorkoutHistoryScreen') {

    // CREATE_PROGRAM - "create a program" / "make a 4 day program" / "build a push pull legs program"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate')) &&
        (msg.includes('program') || msg.includes('split') || (msg.includes('day') && (msg.includes('4') || msg.includes('3') || msg.includes('5') || msg.includes('6'))))) {

      // Extract number of days if mentioned
      const daysMatch = msg.match(/(\d+)\s*day/i);
      const numDays = daysMatch ? parseInt(daysMatch[1]) : null;

      // Check for specific program types
      let programType = null;
      if (msg.includes('push pull legs') || msg.includes('ppl')) {
        programType = 'push_pull_legs';
      } else if (msg.includes('upper lower') || msg.includes('upper/lower')) {
        programType = 'upper_lower';
      } else if (msg.includes('bro split') || msg.includes('body part split')) {
        programType = 'bro_split';
      } else if (msg.includes('full body')) {
        programType = 'full_body';
      }

      return {
        intent: 'CREATE_PROGRAM',
        confidence: 0.95,
        parameters: {
          numDays: numDays,
          programType: programType,
          muscleGroups: extractMuscleGroups(msg)
        }
      };
    }

    // Also detect when user just mentions a program type (for follow-up responses)
    // More flexible detection: check for keywords without exact spacing
    const isPPL = msg.includes('push') && msg.includes('pull') && msg.includes('leg');
    const isUpperLower = (msg.includes('upper') && msg.includes('lower')) || msg.includes('upper/lower');
    const isBroSplit = msg.includes('bro') || (msg.includes('body') && msg.includes('part'));
    const isFullBody = msg.includes('full') && msg.includes('body');

    if (msg.includes('ppl') || isPPL || isUpperLower || isBroSplit || isFullBody) {


      let programType = null;
      if (msg.includes('ppl') || isPPL) {
        programType = 'push_pull_legs';
      } else if (isUpperLower) {
        programType = 'upper_lower';
      } else if (isBroSplit) {
        programType = 'bro_split';
      } else if (isFullBody) {
        programType = 'full_body';
      }



      return {
        intent: 'CREATE_PROGRAM',
        confidence: 0.9,
        parameters: {
          numDays: null,
          programType: programType,
          muscleGroups: extractMuscleGroups(msg)
        }
      };
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
  }

  // HOME SCREEN INTENTS
  if (screen === 'HomeScreen' || screen === 'Home') {

    // CREATE_WORKOUT_PLAN - "create chest day" / "make a workout" / "workout to hit biceps"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build') || msg.includes('generate') ||
         msg.includes('i want') || msg.includes('need')) &&
        (msg.includes('workout') || msg.includes('day') || msg.includes('plan'))) {
      return {
        intent: 'CREATE_WORKOUT_PLAN',
        confidence: 0.95,
        parameters: {
          muscleGroup: extractMuscleGroup(msg)
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

    // GET_TODAY_SUMMARY - "how's my day" / "today's progress" / "summary" (but NOT if creating workout)
    if ((msg.includes('summary') || msg.includes("how's my day") ||
         (msg.includes('today') && (msg.includes('progress') || msg.includes('stats')))) &&
        !msg.includes('create') && !msg.includes('make') && !msg.includes('build')) {
      return {
        intent: 'GET_TODAY_SUMMARY',
        confidence: 0.9,
        parameters: {}
      };
    }

    // CHECK_NUTRITION - "protein goal" / "calories today" / "macros"
    if (msg.includes('protein') || msg.includes('calories') ||
        msg.includes('macros') || msg.includes('nutrition')) {
      return {
        intent: 'CHECK_NUTRITION',
        confidence: 0.85,
        parameters: {}
      };
    }

    // GET_MOTIVATION - "motivate me" / "pep talk" / "encourage me"
    if (msg.includes('motivate') || msg.includes('pep talk') ||
        msg.includes('encourage') || msg.includes('inspiration')) {
      return {
        intent: 'GET_MOTIVATION',
        confidence: 0.9,
        parameters: {}
      };
    }
  }

  // GLOBAL WORKOUT ACTION INTENTS (work on any screen after creating a workout)

  // START_CREATED_WORKOUT - "start it now" / "begin workout" / "start now" / "let's do it"
  if ((msg.includes('start') && (msg.includes('now') || msg.includes('it'))) ||
      msg.includes('begin') || msg.includes("let's do it") ||
      msg.includes('do it now') || msg === 'start') {
    return {
      intent: 'START_CREATED_WORKOUT',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SAVE_TO_PLANS - "save to plans" / "add to my plans" / "save for later" / "save it"
  if ((msg.includes('save') && (msg.includes('plan') || msg.includes('later') || msg.includes('library'))) ||
      (msg.includes('add to') && msg.includes('plan'))) {
    return {
      intent: 'SAVE_TO_PLANS',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SCHEDULE_WORKOUT - "schedule for today/tomorrow/friday" / "set for tomorrow" / "schedule in 2 days"
  if (msg.includes('schedule') || msg.includes('set for') || msg.includes('schedule in')) {

    // Try to extract date/day from message
    const extractedDate = extractDateFromMessage(msg);

    if (extractedDate) {
      return {
        intent: 'SCHEDULE_WORKOUT',
        confidence: 0.9,
        parameters: { dateInfo: extractedDate }
      };
    }
  }

  // NO INTENT DETECTED - just a regular question
  return {
    intent: 'ANSWER_QUESTION',
    confidence: 0.5,
    parameters: {}
  };
}

/**
 * Execute an action based on detected intent
 */
export async function executeAction(intent, parameters, context) {


  try {
    switch (intent) {
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

      case 'GET_TODAY_SUMMARY':
        return await getTodaySummary(parameters, context);

      case 'PLAN_WORKOUT':
        return await planWorkout(parameters, context);

      case 'CHECK_NUTRITION':
        return await checkNutrition(parameters, context);

      case 'GET_MOTIVATION':
        return await getMotivation(parameters, context);

      case 'CREATE_WORKOUT_PLAN':
        return await createWorkoutPlan(parameters, context);

      case 'CREATE_WORKOUT':
        return await createWorkout(parameters, context);

      case 'PLAN_WORKOUT_FOR_DATE':
        return await planWorkoutForDate(parameters, context);

      case 'SHOW_WORKOUT_FREQUENCY':
        return await showWorkoutFrequency(parameters, context);

      case 'CREATE_PROGRAM':
        return await createProgram(parameters, context);

      case 'ADD_FOOD':
        return await addFood(parameters, context);

      case 'SUGGEST_MEAL':
        return await suggestMeal(parameters, context);

      case 'CHECK_MACRO_BREAKDOWN':
        return await checkMacroBreakdown(parameters, context);

      case 'CHECK_NUTRITION_PROGRESS':
        return await checkNutritionProgress(parameters, context);

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

      case 'FIND_RECIPE':
        return await findRecipe(parameters, context);

      case 'CREATE_RECIPE':
        return await createRecipe(parameters, context);

      case 'SUGGEST_RECIPE':
        return await suggestRecipe(parameters, context);

      case 'SHOW_SAVED_RECIPES':
        return await showSavedRecipes(parameters, context);

      case 'GET_EXERCISE_FORM':
        return await getExerciseForm(parameters, context);

      case 'CHECK_EXERCISE_HISTORY':
        return await checkExerciseHistory(parameters, context);

      case 'CHECK_EXERCISE_PR':
        return await checkExercisePR(parameters, context);

      case 'SUGGEST_EXERCISE_ALTERNATIVE':
        return await suggestExerciseAlternative(parameters, context);

      case 'START_CREATED_WORKOUT':
        return await startCreatedWorkout(parameters, context);

      case 'SAVE_TO_PLANS':
        return await saveWorkoutToPlans(parameters, context);

      case 'SCHEDULE_WORKOUT':
        return await scheduleWorkout(parameters, context);

      case 'ANALYZE_PROGRESSION':
        return await analyzeProgression(parameters, context);

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

// ============ WORKOUT SCREEN ACTIONS ============

async function logSet(params, context) {
  try {
    const { reps, weight, sets } = params;

    // Get the current exercise from context (if in workout)
    const currentExercise = context.screenData?.currentExercise;

    if (!currentExercise) {
      return {
        success: false,
        message: 'Start a workout first to log sets. Go to Training → Start a workout.'
      };
    }

    // Store the suggested set data for the workout screen to pick up
    const loggedSet = {
      exerciseName: currentExercise.name || 'Unknown Exercise',
      reps: parseInt(reps) || 0,
      weight: parseFloat(weight) || 0,
      sets: parseInt(sets) || 1,
      timestamp: new Date().toISOString(),
    };

    // Save to AsyncStorage for the workout screen to retrieve
    await AsyncStorage.setItem('ai_logged_set', JSON.stringify(loggedSet));

    return {
      success: true,
      action: 'LOG_SET',
      data: loggedSet,
      message: `✅ Logged ${sets || 1} set${(sets || 1) > 1 ? 's' : ''} of ${reps} reps @ ${weight} lbs for ${currentExercise.name}. Check your workout screen to confirm!`
    };
  } catch (error) {
    console.error('Error logging set:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to log set. Make sure you have an active workout.'
    };
  }
}

async function suggestWeight(params, context) {
  try {
    // Get current exercise name from context
    const currentExerciseName = context.screenData?.currentExercise?.name ||
                                 context.exerciseSpecific?.exerciseName ||
                                 'current exercise';

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get exercise history
    const history = await ContextManager.getExerciseHistory(currentExerciseName, userId, 5);

    if (history && history.length > 0) {
      // Get last workout's max weight
      const lastWorkout = history[0];
      const currentWeight = lastWorkout.maxWeight;

      // Analyze trend
      if (history.length >= 2) {
        const previousWorkout = history[1];
        const weightIncrease = currentWeight - previousWorkout.maxWeight;

        // If they've been progressing, suggest similar increase
        if (weightIncrease > 0) {
          const suggestedWeight = currentWeight + weightIncrease;
          return {
            success: true,
            action: 'SUGGEST_WEIGHT',
            data: { currentWeight, suggestedWeight, lastIncrease: weightIncrease },
            message: `Try ${suggestedWeight} lbs. You increased by ${weightIncrease} lbs last time (${previousWorkout.maxWeight} → ${currentWeight} lbs).`
          };
        }
      }

      // Standard 5 lb increase if stable
      const suggestedWeight = currentWeight + 5;
      return {
        success: true,
        action: 'SUGGEST_WEIGHT',
        data: { currentWeight, suggestedWeight },
        message: `Try ${suggestedWeight} lbs. You crushed ${currentWeight} lbs last time on ${new Date(lastWorkout.date).toLocaleDateString()}.`
      };
    }

    // Fallback: No history found, suggest starting weight based on exercise type
    const fallbackWeights = {
      'bench': 135,
      'squat': 185,
      'deadlift': 225,
      'press': 95,
      'row': 135,
      'curl': 65
    };

    let suggestedWeight = 100; // Default
    for (const [key, weight] of Object.entries(fallbackWeights)) {
      if (currentExerciseName.toLowerCase().includes(key)) {
        suggestedWeight = weight;
        break;
      }
    }

    return {
      success: true,
      action: 'SUGGEST_WEIGHT',
      data: { suggestedWeight, isFirstTime: true },
      message: `No history for ${currentExerciseName}. Start with ${suggestedWeight} lbs and adjust based on how it feels.`
    };
  } catch (error) {
    console.error('Error in suggestWeight:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to suggest weight. Try a weight you are comfortable with.'
    };
  }
}

async function getFormTip(params, context) {
  const { exercise } = params;

  // Simple form tips database
  const formTips = {
    'bench': 'Retract shoulder blades, keep elbows at 45°, drive through chest.',
    'squat': 'Keep back straight, push knees out, go to parallel depth.',
    'deadlift': 'Keep back flat, push through heels, hinge at hips.',
    'press': 'Brace core, press straight up, lock out overhead.',
    'row': 'Pull to lower chest, squeeze shoulder blades, control descent.'
  };

  // Find matching tip
  let tip = 'Keep form strict, control the weight, full range of motion.';
  for (const [key, value] of Object.entries(formTips)) {
    if (exercise?.includes(key)) {
      tip = value;
      break;
    }
  }

  return {
    success: true,
    action: 'GET_FORM_TIP',
    data: { exercise, tip },
    message: tip
  };
}

async function checkPR(params, context) {
  try {
    const { exercise } = params;

    // Get exercise name from params or context
    const exerciseName = exercise ||
                         context.screenData?.currentExercise?.name ||
                         context.exerciseSpecific?.exerciseName ||
                         'current exercise';

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get PR data from ContextManager
    const prData = await ContextManager.getExercisePR(exerciseName, userId, 'weight');

    if (prData) {
      return {
        success: true,
        action: 'CHECK_PR',
        data: {
          exercise: exerciseName,
          pr: prData.display,
          weight: prData.value,
          reps: prData.reps,
          date: prData.date
        },
        message: `Your ${exerciseName} PR: ${prData.display} on ${new Date(prData.date).toLocaleDateString()}`
      };
    }

    // No PR found
    return {
      success: true,
      action: 'CHECK_PR',
      data: { exercise: exerciseName, noPR: true },
      message: `No PR recorded yet for ${exerciseName}. Complete your first workout to set a baseline!`
    };
  } catch (error) {
    console.error('Error in checkPR:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch PR data right now.'
    };
  }
}

async function addExercise(params, context) {
  const { exercise } = params;

  // TODO: Actually add exercise to current workout
  return {
    success: true,
    action: 'ADD_EXERCISE',
    data: { exercise },
    message: `✅ Added ${exercise || 'exercise'} to your workout. Try 3 sets × 10 reps.`
  };
}

// ============ HOME SCREEN ACTIONS ============

async function getTodaySummary(params, context) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition data from Firebase using ContextManager
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const totalCalories = nutritionContext.calories?.consumed || 0;
    const totalProtein = nutritionContext.protein?.consumed || 0;
    const caloriesGoal = nutritionContext.calories?.target || 2000;
    const proteinGoal = nutritionContext.protein?.target || 150;
    const todaysMeals = nutritionContext.todaysMeals || 0;

    // Get workout data from Firebase
    const WorkoutSyncService = (await import('../backend/WorkoutSyncService')).default;
    let allWorkouts = [];
    try {
      allWorkouts = await WorkoutSyncService.getAllWorkouts(100);
    } catch (error) {

    }

    const todaysWorkouts = allWorkouts.filter(w => w.date.startsWith(today));

    // Get last workout
    const recentWorkouts = allWorkouts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 1);

    let lastWorkoutText = 'No workouts yet';
    if (recentWorkouts.length > 0) {
      const lastWorkout = recentWorkouts[0];
      const daysSince = Math.floor((new Date() - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24));
      if (daysSince === 0) {
        lastWorkoutText = `Today - ${lastWorkout.workoutTitle}`;
      } else if (daysSince === 1) {
        lastWorkoutText = `Yesterday - ${lastWorkout.workoutTitle}`;
      } else {
        lastWorkoutText = `${daysSince} days ago - ${lastWorkout.workoutTitle}`;
      }
    }

    const data = {
      calories: Math.round(totalCalories),
      caloriesGoal,
      protein: Math.round(totalProtein),
      proteinGoal,
      workoutsToday: todaysWorkouts.length,
      lastWorkout: lastWorkoutText,
      mealsToday: todaysMeals.length
    };

    // Build message
    let message = `Today: ${data.calories}/${data.caloriesGoal} cal, ${data.protein}/${data.proteinGoal}g protein`;

    if (data.workoutsToday > 0) {
      message += `. ✅ Completed ${data.workoutsToday} workout${data.workoutsToday > 1 ? 's' : ''} today!`;
    } else {
      message += `. No workout yet. Last session: ${lastWorkoutText}.`;
    }

    return {
      success: true,
      action: 'GET_TODAY_SUMMARY',
      data,
      message
    };
  } catch (error) {
    console.error('Error in getTodaySummary:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch today\'s summary. Try again later.'
    };
  }
}

async function planWorkout(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get recent workout history from Firebase
    const WorkoutSyncService = (await import('../backend/WorkoutSyncService')).default;
    let allWorkouts = [];
    try {
      allWorkouts = await WorkoutSyncService.getAllWorkouts(100);
    } catch (error) {

    }

    if (!allWorkouts || allWorkouts.length === 0) {
      return {
        success: true,
        action: 'PLAN_WORKOUT',
        data: { recommendation: 'Full Body', isFirstWorkout: true },
        message: `Start with a Full Body workout! Focus on compound movements: Squats, Bench Press, Rows, and Shoulder Press.`
      };
    }

    // Sort by date (most recent first)
    const sortedWorkouts = allWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastWorkout = sortedWorkouts[0];
    const daysSinceLastWorkout = Math.floor((new Date() - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24));

    // Count workouts by muscle group in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWorkouts = sortedWorkouts.filter(w => new Date(w.date) >= sevenDaysAgo);

    // Categorize workouts by muscle group based on exercises
    const muscleGroupCounts = {
      chest: 0,
      back: 0,
      legs: 0,
      shoulders: 0,
      arms: 0
    };

    recentWorkouts.forEach(workout => {
      const title = workout.workoutTitle?.toLowerCase() || '';
      const exercises = workout.exercises || [];
      const exerciseNames = exercises.map(e => e.name.toLowerCase()).join(' ');

      if (title.includes('chest') || title.includes('push') || exerciseNames.includes('bench')) {
        muscleGroupCounts.chest++;
      }
      if (title.includes('back') || title.includes('pull') || exerciseNames.includes('row') || exerciseNames.includes('pullup')) {
        muscleGroupCounts.back++;
      }
      if (title.includes('leg') || exerciseNames.includes('squat') || exerciseNames.includes('leg press')) {
        muscleGroupCounts.legs++;
      }
      if (title.includes('shoulder') || exerciseNames.includes('shoulder press') || exerciseNames.includes('lateral')) {
        muscleGroupCounts.shoulders++;
      }
      if (title.includes('arm') || exerciseNames.includes('curl') || exerciseNames.includes('tricep')) {
        muscleGroupCounts.arms++;
      }
    });

    // Find least trained muscle group
    let leastTrained = 'Full Body';
    let minCount = Infinity;
    for (const [group, count] of Object.entries(muscleGroupCounts)) {
      if (count < minCount) {
        minCount = count;
        leastTrained = group.charAt(0).toUpperCase() + group.slice(1);
      }
    }

    // Build recommendation
    let recommendation = leastTrained;
    let reason = '';

    if (daysSinceLastWorkout === 0) {
      reason = `You already worked out today (${lastWorkout.workoutTitle}). Rest or do light cardio.`;
      recommendation = 'Rest Day';
    } else if (daysSinceLastWorkout === 1) {
      reason = `Last workout was yesterday (${lastWorkout.workoutTitle}). Train ${leastTrained} - you haven't hit it in ${minCount === 0 ? 'over a week' : `${minCount} session(s)`}.`;
    } else {
      reason = `Last workout was ${daysSinceLastWorkout} days ago (${lastWorkout.workoutTitle}). You're recovered and ready for ${leastTrained}.`;
    }

    return {
      success: true,
      action: 'PLAN_WORKOUT',
      data: {
        recommendation,
        daysSinceLastWorkout,
        lastWorkout: lastWorkout.workoutTitle,
        muscleGroupCounts,
        leastTrained
      },
      message: reason
    };
  } catch (error) {
    console.error('Error in planWorkout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to plan workout. Try a balanced full body routine.'
    };
  }
}

async function checkNutrition(params, context) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';


    // Use proper nutrition context from ContextManager (already uses Firebase)
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const totalCalories = nutritionContext.calories?.consumed || 0;
    const totalProtein = nutritionContext.protein?.consumed || 0;
    const totalCarbs = nutritionContext.carbs?.consumed || 0;
    const totalFat = nutritionContext.fat?.consumed || 0;

    const caloriesGoal = nutritionContext.calories?.target || 2000;
    const proteinGoal = nutritionContext.protein?.target || 150;
    const carbsGoal = nutritionContext.carbs?.target || 200;
    const fatGoal = nutritionContext.fat?.target || 65;

    const mealsToday = nutritionContext.todaysMeals || 0;

    const data = {
      calories: Math.round(totalCalories),
      caloriesGoal,
      caloriesRemaining: Math.round(caloriesGoal - totalCalories),
      protein: Math.round(totalProtein),
      proteinGoal,
      proteinRemaining: Math.round(proteinGoal - totalProtein),
      carbs: Math.round(totalCarbs),
      carbsGoal,
      carbsRemaining: Math.round(carbsGoal - totalCarbs),
      fat: Math.round(totalFat),
      fatGoal,
      fatRemaining: Math.round(fatGoal - totalFat),
      mealsToday: mealsToday
    };

    // Build message with focus on most important macro
    let message = `Today's Nutrition:\n`;
    message += `• Calories: ${data.calories}/${data.caloriesGoal} (${data.caloriesRemaining} left)\n`;
    message += `• Protein: ${data.protein}/${data.proteinGoal}g (${data.proteinRemaining}g left)\n`;
    message += `• Carbs: ${data.carbs}/${data.carbsGoal}g\n`;
    message += `• Fat: ${data.fat}/${data.fatGoal}g`;

    // Add suggestion if protein is low
    if (data.proteinRemaining > 50) {
      const mealsLeft = 3 - data.mealsToday;
      if (mealsLeft > 0) {
        const proteinPerMeal = Math.round(data.proteinRemaining / Math.max(mealsLeft, 1));
        message += `\n\nTip: Aim for ${proteinPerMeal}g protein per remaining meal.`;
      }
    }

    return {
      success: true,
      action: 'CHECK_NUTRITION',
      data,
      message
    };
  } catch (error) {
    console.error('Error in checkNutrition:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch nutrition data. Try again later.'
    };
  }
}

async function getMotivation(params, context) {
  const motivationalQuotes = [
    "You're stronger than you think. Every rep counts. Let's crush it! 💪",
    "Progress over perfection. You showed up - that's what matters. Keep going! 🔥",
    "Your future self will thank you for this workout. Make it count! 🎯",
    "Champions aren't made in the gym - they're made from something deep inside. You've got this! ⚡",
    "The pain you feel today will be the strength you feel tomorrow. Push through! 🚀"
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return {
    success: true,
    action: 'GET_MOTIVATION',
    data: { quote: randomQuote },
    message: randomQuote
  };
}

async function createWorkoutPlan(params, context) {
  try {
    const { muscleGroup } = params;

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Import AIService to generate workout with AI
    const AIService = (await import('./AIService')).default;

    // Ask AI to generate a workout
    const aiPrompt = `Generate a workout for ${muscleGroup || 'Full Body'}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroup || 'Full Body'}.`;


    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });


    // Parse AI response to extract exercises
    const exercises = [];
    const lines = aiResponse.response.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('EXERCISE:')) {
        // Parse: "EXERCISE: Bench Press (Barbell) | 4 | 8"
        const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
        if (parts.length >= 3) {
          // Extract name and equipment
          const nameWithEquipment = parts[0];
          const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
          const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
          const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

          exercises.push({
            name: `${name} (${equipment})`,
            equipment: equipment,
            sets: parseInt(parts[1]) || 3,
            reps: parseInt(parts[2]) || 10,
          });
        }
      }
    }

    // Fallback if AI parsing failed
    if (exercises.length === 0) {

      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }


    const planName = `${muscleGroup || 'Full Body'} Day`;

    // Format exercises for storage
    const formattedExercises = exercises.map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment,
      sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps,
        weight: null, // User will fill this in
        completed: false,
      })),
      notes: '',
    }));

    // Save the workout plan
    const workoutPlan = {
      workoutTitle: planName,
      exercises: formattedExercises,
      notes: `AI-generated ${muscleGroup || 'Full Body'} workout`,
    };

    // Save to planned workouts for today
    const today = new Date().toISOString().split('T')[0];
    await WorkoutStorageService.savePlannedWorkout(today, workoutPlan, userId);

    // Build detailed message
    const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

    return {
      success: true,
      action: 'CREATE_WORKOUT_PLAN',
      data: {
        name: planName,
        exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
        totalExercises: exercises.length,
      },
      message: `✅ Created '${planName}' for today!\n\n${exerciseList}\n\nGo to Training → Start Workout to begin!`
    };
  } catch (error) {
    console.error('Error creating workout plan:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create workout plan. Try again later.'
    };
  }
}

async function createWorkout(params, context) {
  try {
    const { muscleGroups, workoutContext, autoScheduleDate } = params;
    const muscleGroupList = muscleGroups || ['Full Body'];

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Import AIService to generate workout with AI
    const AIService = (await import('./AIService')).default;

    // Build the muscle group string
    const muscleGroupStr = muscleGroupList.join(' & ');

    // Ask AI to generate a workout
    const aiPrompt = `Generate a workout for ${muscleGroupStr}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroupStr}.`;


    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });


    // Parse AI response to extract exercises
    const exercises = [];
    const lines = aiResponse.response.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('EXERCISE:')) {
        // Parse: "EXERCISE: Bench Press (Barbell) | 4 | 8"
        const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
        if (parts.length >= 3) {
          // Extract name and equipment
          const nameWithEquipment = parts[0];
          const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
          const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
          const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

          exercises.push({
            name: `${name} (${equipment})`,
            equipment: equipment,
            sets: parseInt(parts[1]) || 3,
            reps: parseInt(parts[2]) || 10,
          });
        }
      }
    }

    // Fallback if AI parsing failed
    if (exercises.length === 0) {

      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }


    const workoutTitle = `${muscleGroupStr} Workout`;

    // Format exercises for storage
    const formattedExercises = exercises.map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment,
      sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps,
        weight: null, // User will fill this in
        completed: false,
      })),
      notes: '',
    }));

    // Create the workout plan object
    const workoutPlan = {
      workoutTitle: workoutTitle,
      exercises: formattedExercises,
      notes: `AI-generated ${muscleGroupStr} workout`,
    };

    // Build detailed exercise list
    const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

    // If auto-schedule date was detected, schedule it immediately
    if (autoScheduleDate) {
      await WorkoutStorageService.savePlannedWorkout(autoScheduleDate.dateString, workoutPlan, userId);

      return {
        success: true,
        action: 'CREATE_WORKOUT_AUTO_SCHEDULED',
        data: {
          name: workoutTitle,
          muscleGroups: muscleGroupList,
          exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
          totalExercises: exercises.length,
          scheduledDate: autoScheduleDate.dateString,
          displayDate: autoScheduleDate.displayText,
        },
        message: `✅ Created '${workoutTitle}' and scheduled for ${autoScheduleDate.displayText}!\n\n${exerciseList}\n\nYou'll see it when you go to Training on that day! 📅`
      };
    }

    // Otherwise, save to temporary storage for user to decide what to do with it
    await AsyncStorage.setItem('ai_last_created_workout', JSON.stringify({
      workout: workoutPlan,
      muscleGroups: muscleGroupList,
      createdAt: new Date().toISOString(),
    }));

    // Phase 2: Present options to user
    return {
      success: true,
      action: 'CREATE_WORKOUT',
      data: {
        name: workoutTitle,
        muscleGroups: muscleGroupList,
        exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
        totalExercises: exercises.length,
        workoutPlan: workoutPlan,
      },
      message: `✅ Created '${workoutTitle}'!\n\n${exerciseList}\n\n📋 What would you like to do?\n\n1️⃣ "Start it now" - Begin workout immediately\n2️⃣ "Save to plans" - Add to My Plans library\n3️⃣ "Schedule for today" - Set for today's workout\n4️⃣ "Schedule for tomorrow" - Set for tomorrow\n\nJust tell me what you'd like!`
    };
  } catch (error) {
    console.error('Error creating workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create workout. Try again later.'
    };
  }
}

async function startCreatedWorkout(params, context) {
  try {
    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first by saying "create a workout for chest".'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Save to today's planned workout
    const today = new Date().toISOString().split('T')[0];
    await WorkoutStorageService.savePlannedWorkout(today, workout, userId);

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'START_CREATED_WORKOUT',
      data: { workoutTitle: workout.workoutTitle, date: today },
      message: `🚀 Ready to go! '${workout.workoutTitle}' is set for today.\n\nGo to Training → Start Today's Workout to begin! 💪`
    };
  } catch (error) {
    console.error('Error starting created workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to start workout. Try again later.'
    };
  }
}

async function saveWorkoutToPlans(params, context) {
  try {
    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first by saying "create a workout for chest".'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);

    // Save to My Plans (standalone workouts)
    // My Plans uses @standalone_workouts key (no userId suffix)
    const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';
    const existingWorkoutsData = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
    const existingWorkouts = existingWorkoutsData ? JSON.parse(existingWorkoutsData) : [];

    // Format workout for My Plans (matches expected format)
    const newWorkout = {
      id: `workout_${Date.now()}`,
      name: workout.workoutTitle, // MyPlansScreen expects 'name' field
      description: workout.notes || '',
      day: {
        exercises: workout.exercises // MyPlansScreen expects 'day.exercises'
      },
      createdAt: new Date().toISOString(),
      isAIGenerated: true,
    };

    existingWorkouts.push(newWorkout);
    await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'SAVE_TO_PLANS',
      data: { workoutName: workout.workoutTitle, workoutId: newWorkout.id },
      message: `✅ Saved '${workout.workoutTitle}' to My Plans!\n\nFind it in Training → My Plans → Workouts. You can use it anytime! 📋`
    };
  } catch (error) {
    console.error('Error saving workout to plans:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to save to plans. Try again later.'
    };
  }
}

async function scheduleWorkout(params, context) {
  try {
    const { dateInfo } = params;

    if (!dateInfo) {
      return {
        success: false,
        message: 'Please specify a date (e.g., "schedule for tomorrow", "schedule in 2 days", or "schedule for Friday").'
      };
    }

    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first by saying "create a workout for chest".'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Use the date info from the extracted date
    const targetDateStr = dateInfo.dateString;
    const displayDate = dateInfo.displayText;

    // Save to planned workout for target date
    await WorkoutStorageService.savePlannedWorkout(targetDateStr, workout, userId);

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'SCHEDULE_WORKOUT',
      data: {
        workoutTitle: workout.workoutTitle,
        scheduledDate: targetDateStr,
        displayDate
      },
      message: `📅 Scheduled '${workout.workoutTitle}' for ${displayDate}!\n\nYou'll see it when you go to Training on that day. 🗓️`
    };
  } catch (error) {
    console.error('Error scheduling workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to schedule workout. Try again later.'
    };
  }
}

async function planWorkoutForDate(params, context) {
  try {
    const { dateInfo, muscleGroups } = params;
    const muscleGroupList = muscleGroups && muscleGroups.length > 0 ? muscleGroups : null;

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // If no date specified, ask for it
    if (!dateInfo) {
      return {
        success: true,
        action: 'PLAN_WORKOUT_FOR_DATE_NO_DATE',
        message: 'Sure! Which date would you like to plan a workout for? You can say:\n\n• "Tuesday"\n• "October 31st"\n• "Tomorrow"\n• "In 3 days"\n\nOr specify muscle groups like "chest and triceps for Friday"'
      };
    }

    // If we have muscle groups, create the workout
    if (muscleGroupList && muscleGroupList.length > 0) {
      // Import AIService to generate workout with AI
      const AIService = (await import('./AIService')).default;

      // Build the muscle group string
      const muscleGroupStr = muscleGroupList.join(' & ');

      // Ask AI to generate a workout
      const aiPrompt = `Generate a workout for ${muscleGroupStr}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroupStr}.`;


      const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });


      // Parse AI response to extract exercises
      const exercises = [];
      const lines = aiResponse.response.split('\n');

      for (const line of lines) {
        if (line.trim().startsWith('EXERCISE:')) {
          // Parse: "EXERCISE: Bench Press (Barbell) | 4 | 8"
          const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
          if (parts.length >= 3) {
            // Extract name and equipment
            const nameWithEquipment = parts[0];
            const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
            const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
            const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

            exercises.push({
              name: `${name} (${equipment})`,
              equipment: equipment,
              sets: parseInt(parts[1]) || 3,
              reps: parseInt(parts[2]) || 10,
            });
          }
        }
      }

      // Fallback if AI parsing failed
      if (exercises.length === 0) {

        exercises.push(
          { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
          { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        );
      }


      const workoutTitle = `${muscleGroupStr} Workout`;

      // Format exercises for storage
      const formattedExercises = exercises.map((ex, idx) => ({
        id: `${Date.now()}_${idx}`,
        name: ex.name,
        equipment: ex.equipment,
        sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
          id: `set_${idx}_${setIdx}`,
          reps: ex.reps,
          weight: null, // User will fill this in
          completed: false,
        })),
        notes: '',
      }));

      // Create the workout plan object
      const workoutPlan = {
        workoutTitle: workoutTitle,
        exercises: formattedExercises,
        notes: `AI-generated ${muscleGroupStr} workout`,
      };

      // Save to planned workout for target date
      await WorkoutStorageService.savePlannedWorkout(dateInfo.dateString, workoutPlan, userId);

      const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

      return {
        success: true,
        action: 'PLAN_WORKOUT_FOR_DATE',
        data: {
          name: workoutTitle,
          muscleGroups: muscleGroupList,
          exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
          totalExercises: exercises.length,
          scheduledDate: dateInfo.dateString,
          displayDate: dateInfo.displayText,
        },
        message: `✅ Created '${workoutTitle}' and scheduled for ${dateInfo.displayText}!\n\n${exerciseList}\n\nYou'll see it in your calendar! 📅`
      };
    } else {
      // No muscle groups specified - ask for them
      return {
        success: true,
        action: 'PLAN_WORKOUT_FOR_DATE_NO_MUSCLES',
        message: `Got it! I'll plan a workout for ${dateInfo.displayText}. Which muscle groups would you like to train?\n\nExamples:\n• "Chest and triceps"\n• "Back and biceps"\n• "Legs"\n• "Full body"`
      };
    }
  } catch (error) {
    console.error('Error planning workout for date:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to plan workout. Try again later.'
    };
  }
}

async function showWorkoutFrequency(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get recent workout history from Firebase
    const WorkoutSyncService = (await import('../backend/WorkoutSyncService')).default;
    let allWorkouts = [];
    try {
      allWorkouts = await WorkoutSyncService.getAllWorkouts(100);
    } catch (error) {

    }

    if (!allWorkouts || allWorkouts.length === 0) {
      return {
        success: true,
        action: 'SHOW_WORKOUT_FREQUENCY',
        data: { noWorkouts: true },
        message: 'No workouts logged yet! Start your first workout to track your training frequency. 💪'
      };
    }

    // Get workouts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWorkouts = allWorkouts.filter(w => new Date(w.date) >= sevenDaysAgo);

    // Get workouts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthWorkouts = allWorkouts.filter(w => new Date(w.date) >= thirtyDaysAgo);

    // Count muscle groups trained this week
    const muscleGroupsThisWeek = {};
    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const muscle = exercise.primaryMuscle || 'Unknown';
        muscleGroupsThisWeek[muscle] = (muscleGroupsThisWeek[muscle] || 0) + 1;
      });
    });

    const muscleGroupSummary = Object.entries(muscleGroupsThisWeek)
      .map(([muscle, count]) => `• ${muscle}: ${count}x`)
      .join('\n') || '• No workouts this week';

    const weeklyAverage = Math.round((monthWorkouts.length / 4) * 10) / 10;

    return {
      success: true,
      action: 'SHOW_WORKOUT_FREQUENCY',
      data: {
        lastWeek: recentWorkouts.length,
        lastMonth: monthWorkouts.length,
        weeklyAverage,
        muscleGroups: muscleGroupsThisWeek
      },
      message: `📊 Your Workout Frequency:\n\n🗓️ Last 7 days: ${recentWorkouts.length} workouts\n📅 Last 30 days: ${monthWorkouts.length} workouts\n📈 Weekly average: ${weeklyAverage} workouts\n\n💪 Muscle groups this week:\n${muscleGroupSummary}`
    };
  } catch (error) {
    console.error('Error showing workout frequency:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch workout frequency. Try again later.'
    };
  }
}

async function createProgram(params, context) {
  try {




    const { numDays, programType, muscleGroups } = params;
    const userId = BackendService.getCurrentUserId() || 'guest';

    // If no program type specified, ask for it
    if (!programType && !numDays) {

      return {
        success: true,
        action: 'CREATE_PROGRAM_ASK_TYPE',
        message: `I can create a workout program for you! What type of split would you like?\n\n• Push/Pull/Legs (6 days)\n• Upper/Lower (4 days)\n• Bro Split (5 days)\n• Full Body (3 days)\n\nOr specify the number of days you want to train per week.`
      };
    }

    // Determine program structure based on type or days
    let programDays = [];
    let programName = '';

    if (programType === 'push_pull_legs' || (numDays === 6 && !programType)) {
      programName = 'Push/Pull/Legs Program';
      programDays = [
        { name: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'] },
        { name: 'Pull Day', muscles: ['Back', 'Biceps'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
        { name: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'] },
        { name: 'Pull Day', muscles: ['Back', 'Biceps'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      ];
    } else if (programType === 'upper_lower' || (numDays === 4 && !programType)) {
      programName = 'Upper/Lower Program';
      programDays = [
        { name: 'Upper Body', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'] },
        { name: 'Lower Body', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
        { name: 'Upper Body', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'] },
        { name: 'Lower Body', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      ];
    } else if (programType === 'bro_split' || (numDays === 5 && !programType)) {
      programName = 'Bro Split Program';
      programDays = [
        { name: 'Chest Day', muscles: ['Chest'] },
        { name: 'Back Day', muscles: ['Back'] },
        { name: 'Shoulder Day', muscles: ['Shoulders'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes'] },
        { name: 'Arm Day', muscles: ['Biceps', 'Triceps'] },
      ];
    } else if (programType === 'full_body' || (numDays === 3 && !programType)) {
      programName = 'Full Body Program';
      programDays = [
        { name: 'Full Body A', muscles: ['Chest', 'Back', 'Quads', 'Shoulders'] },
        { name: 'Full Body B', muscles: ['Back', 'Chest', 'Hamstrings', 'Arms'] },
        { name: 'Full Body C', muscles: ['Quads', 'Chest', 'Back', 'Shoulders'] },
      ];
    } else if (programType === 'personalized') {
      // For personalized programs, ask the user about their goals and preferences
      return {
        success: true,
        action: 'CREATE_PROGRAM_PERSONALIZED',
        message: `I'll create a personalized program for you! To make it perfect for your goals, tell me:\n\n1. How many days per week can you train? (3-6 days)\n2. What are your main goals? (strength, muscle growth, fat loss, general fitness)\n3. Any muscle groups you want to prioritize?\n\nOr just tell me the number of days and I'll design the optimal split for you!`
      };
    } else if (numDays && !programType) {
      // Custom number of days without specific type
      return {
        success: true,
        action: 'CREATE_PROGRAM_CUSTOM_DAYS',
        message: `Got it, ${numDays} days per week! What type of split would you like?\n\n• Push/Pull/Legs\n• Upper/Lower\n• Bro Split (body part split)\n• Full Body\n• Or let me know which muscles you want to train each day`
      };
    } else {
      return {
        success: true,
        action: 'CREATE_PROGRAM_UNCLEAR',
        message: `I can create programs with these splits:\n\n• Push/Pull/Legs (6 days)\n• Upper/Lower (4 days)\n• Bro Split (5 days)\n• Full Body (3 days)\n\nWhich would you like?`
      };
    }



    // Get next Monday as starting point
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    // Create program structure for MyPlansScreen
    const programId = `program_${Date.now()}`;
    const programDaysData = [];

    // Generate and save each workout day
    const createdWorkouts = [];
    for (let i = 0; i < programDays.length; i++) {
      const day = programDays[i];
      const workoutDate = new Date(nextMonday);
      workoutDate.setDate(nextMonday.getDate() + i);
      const dateString = workoutDate.toISOString().split('T')[0];



      // Use AI to generate exercises for this day
      const muscleGroupStr = day.muscles.join(', ');
      const prompt = `Create a workout for ${muscleGroupStr}. Return ONLY a JSON array of exercises with this exact format:
[{"name": "Exercise Name", "equipment": "Barbell/Dumbbell/Cable/Machine/Bodyweight", "sets": 3-4, "reps": 6-12}]

Requirements:
- Include 4-6 exercises
- Start with compound movements
- Include variety in equipment
- Progressive rep ranges (lower for compounds, higher for isolation)
- No explanations, ONLY the JSON array`;

      let exercises = [];
      try {
        const aiResponse = await aiService.generateText(prompt);
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          exercises = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {

      }

      // Fallback exercises if AI fails
      if (exercises.length === 0) {
        exercises = [
          { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
          { name: 'Compound Exercise 2', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { name: 'Isolation Exercise 1', equipment: 'Cable', sets: 3, reps: 12 },
          { name: 'Isolation Exercise 2', equipment: 'Machine', sets: 3, reps: 12 },
        ];
      }

      // Format exercises for storage
      const formattedExercises = exercises.map((ex, idx) => ({
        id: `${Date.now()}_${i}_${idx}`,
        name: ex.name,
        equipment: ex.equipment,
        sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
          id: `set_${i}_${idx}_${setIdx}`,
          reps: ex.reps,
          weight: null,
          completed: false,
        })),
        notes: '',
      }));

      // Create workout plan
      const workoutPlan = {
        workoutTitle: day.name,
        exercises: formattedExercises,
        notes: `Part of ${programName}`,
      };

      // Save to planned workouts (for calendar)
      await WorkoutStorageService.savePlannedWorkout(dateString, workoutPlan, userId);

      // Add to program days data (for My Plans screen)
      programDaysData.push({
        id: `day_${i}`,
        name: day.name,
        exercises: formattedExercises,
        muscleGroups: day.muscles,
      });

      createdWorkouts.push({
        name: day.name,
        date: dateString,
        muscles: day.muscles,
        exerciseCount: exercises.length,
      });


    }

    // Save the complete program to AsyncStorage for My Plans screen
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const WORKOUT_PROGRAMS_KEY = '@workout_programs';

      // Get existing programs
      const existingProgramsStr = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      const existingPrograms = existingProgramsStr ? JSON.parse(existingProgramsStr) : [];

      // Create new program object
      const newProgram = {
        id: programId,
        name: programName,
        description: `AI-generated ${programName}`,
        days: programDaysData,
        createdAt: new Date().toISOString(),
      };

      // Add to programs array
      existingPrograms.push(newProgram);

      // Save back to AsyncStorage
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(existingPrograms));


    } catch (error) {
      console.error('Error saving program to My Plans:', error);
    }

    // Format summary message
    const workoutSummary = createdWorkouts.map((w, idx) => {
      const date = new Date(w.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `Day ${idx + 1} (${dayName}): ${w.name}\n  • ${w.muscles.join(', ')}\n  • ${w.exerciseCount} exercises`;
    }).join('\n\n');

    return {
      success: true,
      action: 'CREATE_PROGRAM',
      data: {
        programName,
        numDays: programDays.length,
        startDate: nextMonday.toISOString().split('T')[0],
        workouts: createdWorkouts,
      },
      message: `✅ Created your ${programName}!\n\nStarting next Monday, here's your schedule:\n\n${workoutSummary}\n\n💾 Saved to My Plans - check the Programs section!\n📅 Also added to your calendar for easy scheduling! 💪`
    };

  } catch (error) {
    console.error('Error creating program:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create program. Try again later.'
    };
  }
}

// ============ NUTRITION SCREEN ACTIONS ============

async function addFood(params, context) {
  const { foodName, quantity } = params;

  if (!foodName) {
    return {
      success: false,
      message: 'Please specify a food item to add (e.g., "add 200g chicken breast")'
    };
  }

  return {
    success: true,
    action: 'ADD_FOOD',
    data: {
      foodName,
      quantity: quantity || 100,
      searchRequired: true
    },
    message: `To add ${foodName}, use the Search button (🔍) on the Nutrition screen and search for "${foodName}". The food database has nutritional info for thousands of foods!`
  };
}

async function suggestMeal(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context to see what's left
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesLeft = (nutritionContext.calories?.target || 2000) - (nutritionContext.calories?.consumed || 0);
    const proteinLeft = (nutritionContext.protein?.target || 150) - (nutritionContext.protein?.consumed || 0);

    // Meal suggestions based on remaining macros
    const mealSuggestions = {
      highProtein: [
        'Grilled chicken breast (200g) with broccoli',
        'Greek yogurt (200g) with berries and almonds',
        'Salmon (150g) with quinoa and vegetables',
        'Protein shake with banana and peanut butter'
      ],
      balanced: [
        'Turkey sandwich on whole wheat with avocado',
        'Chicken rice bowl with vegetables',
        'Pasta with lean ground beef and tomato sauce',
        'Stir fry with chicken, rice, and mixed vegetables'
      ],
      lowCalorie: [
        'Vegetable omelette (3 eggs) with spinach',
        'Tuna salad with olive oil dressing',
        'Grilled chicken salad with balsamic vinaigrette',
        'Protein smoothie with berries'
      ]
    };

    let suggestion;
    let category;

    if (proteinLeft > 50) {
      // High protein needed
      category = 'highProtein';
      suggestion = mealSuggestions.highProtein[Math.floor(Math.random() * mealSuggestions.highProtein.length)];
    } else if (caloriesLeft > 600) {
      // Balanced meal
      category = 'balanced';
      suggestion = mealSuggestions.balanced[Math.floor(Math.random() * mealSuggestions.balanced.length)];
    } else {
      // Low calorie
      category = 'lowCalorie';
      suggestion = mealSuggestions.lowCalorie[Math.floor(Math.random() * mealSuggestions.lowCalorie.length)];
    }

    return {
      success: true,
      action: 'SUGGEST_MEAL',
      data: {
        suggestion,
        category,
        caloriesLeft: Math.round(caloriesLeft),
        proteinLeft: Math.round(proteinLeft)
      },
      message: `Based on your remaining macros (${Math.round(caloriesLeft)} cal, ${Math.round(proteinLeft)}g protein), try:\n\n${suggestion}\n\nCheck the Recipes tab (📖) for saved meals!`
    };
  } catch (error) {
    console.error('Error suggesting meal:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to suggest a meal. Try a balanced meal with protein, carbs, and vegetables.'
    };
  }
}

async function checkMacroBreakdown(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context
    const nutritionContext = await ContextManager.getNutritionContext(userId);
    const todaysMeals = nutritionContext.todaysMeals || [];

    // Calculate macros by meal type
    const mealBreakdown = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      snacks: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };

    todaysMeals.forEach(meal => {
      const mealType = meal.meal_type || 'snacks';
      if (mealBreakdown[mealType]) {
        mealBreakdown[mealType].calories += meal.calories_consumed || 0;
        mealBreakdown[mealType].protein += meal.protein_consumed || 0;
        mealBreakdown[mealType].carbs += meal.carbs_consumed || 0;
        mealBreakdown[mealType].fat += meal.fat_consumed || 0;
      }
    });

    // Format message
    let message = 'Today\'s Macros by Meal:\n\n';

    Object.entries(mealBreakdown).forEach(([mealType, macros]) => {
      if (macros.calories > 0) {
        const emoji = mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌙' : '🍿';
        message += `${emoji} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:\n`;
        message += `  ${Math.round(macros.calories)} cal | ${Math.round(macros.protein)}g P | ${Math.round(macros.carbs)}g C | ${Math.round(macros.fat)}g F\n\n`;
      }
    });

    return {
      success: true,
      action: 'CHECK_MACRO_BREAKDOWN',
      data: mealBreakdown,
      message: message || 'No meals logged yet today. Start tracking to see your breakdown!'
    };
  } catch (error) {
    console.error('Error checking macro breakdown:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch macro breakdown. Try again later.'
    };
  }
}

async function checkNutritionProgress(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesConsumed = nutritionContext.calories?.consumed || 0;
    const caloriesTarget = nutritionContext.calories?.target || 2000;
    const proteinConsumed = nutritionContext.protein?.consumed || 0;
    const proteinTarget = nutritionContext.protein?.target || 150;

    const caloriesLeft = Math.round(caloriesTarget - caloriesConsumed);
    const proteinLeft = Math.round(proteinTarget - proteinConsumed);

    const caloriesPercent = Math.round((caloriesConsumed / caloriesTarget) * 100);
    const proteinPercent = Math.round((proteinConsumed / proteinTarget) * 100);

    let status = '';
    if (caloriesPercent < 70) {
      status = 'You have room for more meals today! ';
    } else if (caloriesPercent < 100) {
      status = 'Almost at your goal! ';
    } else if (caloriesPercent < 110) {
      status = 'Right on target! ';
    } else {
      status = 'Over your calorie goal. ';
    }

    if (proteinPercent < 80) {
      status += 'Focus on protein-rich foods for remaining meals.';
    } else if (proteinPercent >= 100) {
      status += 'Great job hitting your protein goal! 💪';
    }

    const message = `Nutrition Progress:\n\n` +
                   `Calories: ${Math.round(caloriesConsumed)}/${caloriesTarget} (${caloriesLeft} left)\n` +
                   `Protein: ${Math.round(proteinConsumed)}/${proteinTarget}g (${proteinLeft}g left)\n\n` +
                   `${status}`;

    return {
      success: true,
      action: 'CHECK_NUTRITION_PROGRESS',
      data: {
        caloriesConsumed: Math.round(caloriesConsumed),
        caloriesTarget,
        caloriesLeft,
        caloriesPercent,
        proteinConsumed: Math.round(proteinConsumed),
        proteinTarget,
        proteinLeft,
        proteinPercent
      },
      message
    };
  } catch (error) {
    console.error('Error checking nutrition progress:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to check nutrition progress. Try again later.'
    };
  }
}

// ============ PROGRESS SCREEN ACTIONS ============

async function setGoal(params, context) {
  const { exercise } = params;

  if (!exercise) {
    return {
      success: true,
      action: 'SET_GOAL',
      data: { needsExercise: true },
      message: 'To set a goal, go to Progress → Goals tab and tap "Add Goal". You can set goals for weight, reps, volume, frequency, or workout streaks!'
    };
  }

  return {
    success: true,
    action: 'SET_GOAL',
    data: { exercise },
    message: `To set a ${exercise} goal, go to Progress → Goals tab and tap "Add Goal". Choose your target weight, reps, or total volume to track your progress!`
  };
}

async function checkGoals(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get goals from AsyncStorage (goals are stored locally per ProgressScreen.js)
    const goalsData = await AsyncStorage.getItem(`progress_goals_${userId}`);
    const goals = goalsData ? JSON.parse(goalsData) : [];

    if (!goals || goals.length === 0) {
      return {
        success: true,
        action: 'CHECK_GOALS',
        data: { noGoals: true },
        message: 'You haven\'t set any goals yet. Go to Progress → Goals tab to set your first goal and track your progress!'
      };
    }

    // Import ProgressSyncService to get exercise progress
    const ProgressSyncService = (await import('../backend/ProgressSyncService')).default;
    const exerciseProgress = await ProgressSyncService.getExerciseProgress(userId);

    // Calculate goal progress
    let message = `Your Goals:\n\n`;
    let goalsOnTrack = 0;

    goals.forEach((goal, idx) => {
      const progress = exerciseProgress[goal.exercise] || {};
      const currentValue = progress[goal.type] || 0;
      const targetValue = goal.target;
      const percentage = Math.round((currentValue / targetValue) * 100);

      const emoji = percentage >= 100 ? '✅' : percentage >= 80 ? '🔥' : percentage >= 50 ? '📈' : '🎯';
      message += `${emoji} ${goal.exercise} - ${goal.type}\n`;
      message += `  Current: ${currentValue} / Target: ${targetValue} (${percentage}%)\n\n`;

      if (percentage >= 80) goalsOnTrack++;
    });

    if (goalsOnTrack > 0) {
      message += `You're crushing ${goalsOnTrack} of ${goals.length} goals! Keep it up! 💪`;
    } else {
      message += `Stay consistent and you'll hit these goals!`;
    }

    return {
      success: true,
      action: 'CHECK_GOALS',
      data: {
        totalGoals: goals.length,
        goalsOnTrack,
        goals: goals.map(g => ({
          exercise: g.exercise,
          type: g.type,
          target: g.target
        }))
      },
      message
    };
  } catch (error) {
    console.error('Error checking goals:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch goals. Check the Progress screen Goals tab.'
    };
  }
}

async function getAchievements(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get achievements from AsyncStorage
    const achievementsData = await AsyncStorage.getItem(`achievements_${userId}`);
    const achievements = achievementsData ? JSON.parse(achievementsData) : [];

    const earnedAchievements = achievements.filter(a => a.earned);

    if (earnedAchievements.length === 0) {
      return {
        success: true,
        action: 'GET_ACHIEVEMENTS',
        data: { noAchievements: true },
        message: 'No achievements earned yet! Complete workouts, hit PRs, and maintain streaks to unlock badges. Check Progress → Achievements to see what\'s available!'
      };
    }

    // Group achievements by type
    const byType = earnedAchievements.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});

    let message = `🏆 Your Achievements (${earnedAchievements.length} total):\n\n`;

    earnedAchievements.slice(0, 5).forEach(achievement => {
      message += `${achievement.icon || '🏅'} ${achievement.title}\n`;
      message += `  ${achievement.description}\n\n`;
    });

    if (earnedAchievements.length > 5) {
      message += `...and ${earnedAchievements.length - 5} more! Check Progress → Achievements to see all.`;
    }

    return {
      success: true,
      action: 'GET_ACHIEVEMENTS',
      data: {
        totalEarned: earnedAchievements.length,
        byType,
        recentAchievements: earnedAchievements.slice(0, 5)
      },
      message
    };
  } catch (error) {
    console.error('Error getting achievements:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch achievements. Check the Progress screen Achievements tab.'
    };
  }
}

async function checkStreak(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get streak data from ContextManager
    const streakData = await ContextManager.getStreakData(userId);

    if (!streakData || streakData.currentStreak === 0) {
      return {
        success: true,
        action: 'CHECK_STREAK',
        data: { noStreak: true },
        message: 'No active streak yet. Complete a workout today to start your streak! 🔥'
      };
    }

    const { currentStreak, longestStreak, lastWorkoutDate } = streakData;

    let message = `🔥 Current Streak: ${currentStreak} day${currentStreak > 1 ? 's' : ''}!\n\n`;

    if (currentStreak === longestStreak) {
      message += `This is your longest streak ever! Keep it going! 💪`;
    } else {
      message += `Your longest streak: ${longestStreak} days\n`;
      message += `You're ${longestStreak - currentStreak} days away from your record!`;
    }

    // Check if workout is due today
    const today = new Date().toISOString().split('T')[0];
    const lastWorkout = lastWorkoutDate?.split('T')[0];

    if (lastWorkout !== today) {
      message += `\n\n⚠️ Don't break your streak! Complete a workout today.`;
    }

    return {
      success: true,
      action: 'CHECK_STREAK',
      data: {
        currentStreak,
        longestStreak,
        lastWorkoutDate,
        isActive: lastWorkout === today
      },
      message
    };
  } catch (error) {
    console.error('Error checking streak:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch streak data. Check the Progress screen Overview tab.'
    };
  }
}

async function checkExerciseProgress(params, context) {
  try {
    const { exercise } = params;

    if (!exercise) {
      return {
        success: false,
        message: 'Please specify an exercise (e.g., "show my squat progress" or "how am I doing on bench press")'
      };
    }

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get exercise history
    const history = await ContextManager.getExerciseHistory(exercise, userId, 10);

    if (!history || history.length === 0) {
      return {
        success: true,
        action: 'CHECK_EXERCISE_PROGRESS',
        data: { noHistory: true, exercise },
        message: `No workout history found for ${exercise}. Complete a workout with this exercise to start tracking progress!`
      };
    }

    // Calculate progress metrics
    const latestWorkout = history[0];
    const oldestWorkout = history[history.length - 1];

    const maxWeightGain = latestWorkout.maxWeight - oldestWorkout.maxWeight;
    const totalVolumeGain = latestWorkout.totalVolume - oldestWorkout.totalVolume;

    // Check trend (improving, stable, declining)
    let trend = 'stable';
    if (history.length >= 3) {
      const recent3 = history.slice(0, 3);
      const avgRecentWeight = recent3.reduce((sum, w) => sum + w.maxWeight, 0) / 3;
      const older3 = history.slice(-3);
      const avgOlderWeight = older3.reduce((sum, w) => sum + w.maxWeight, 0) / 3;

      if (avgRecentWeight > avgOlderWeight * 1.05) trend = 'improving';
      else if (avgRecentWeight < avgOlderWeight * 0.95) trend = 'declining';
    }

    const trendEmoji = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
    const trendText = trend === 'improving' ? 'improving' : trend === 'declining' ? 'needs attention' : 'stable';

    let message = `${exercise} Progress ${trendEmoji}\n\n`;
    message += `Latest: ${latestWorkout.maxWeight} lbs × ${latestWorkout.maxReps} reps\n`;
    message += `Max Weight Gain: +${maxWeightGain} lbs (${history.length} workouts)\n`;
    message += `Total Volume: ${Math.round(latestWorkout.totalVolume)} lbs\n`;
    message += `Trend: ${trendText}\n\n`;

    if (trend === 'improving') {
      message += `Keep crushing it! You're making great progress! 💪`;
    } else if (trend === 'declining') {
      message += `Consider a deload week or check your recovery/nutrition.`;
    } else {
      message += `Solid consistency! Try adding 5 lbs next session.`;
    }

    return {
      success: true,
      action: 'CHECK_EXERCISE_PROGRESS',
      data: {
        exercise,
        latestWeight: latestWorkout.maxWeight,
        maxWeightGain,
        totalVolumeGain,
        trend,
        workoutCount: history.length
      },
      message
    };
  } catch (error) {
    console.error('Error checking exercise progress:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch exercise progress. Try viewing the Charts tab on the Progress screen.'
    };
  }
}

async function analyzeProgression(params, context) {
  try {
    // Get exercise name from params or context
    const exerciseName = params.exercise ||
                         context.screenData?.currentExercise?.name ||
                         context.exerciseSpecific?.exerciseName;

    if (!exerciseName) {
      return {
        success: false,
        message: 'Please specify an exercise (e.g., "should I progress on bench press?" or "am I ready to increase weight on squats?")'
      };
    }

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get last 8 workouts for the exercise to analyze trend
    const history = await ContextManager.getExerciseHistory(exerciseName, userId, 8);

    if (!history || history.length === 0) {
      return {
        success: true,
        action: 'ANALYZE_PROGRESSION',
        data: { noHistory: true, exercise: exerciseName },
        message: `No workout history found for ${exerciseName}. Complete at least 3 workouts with this exercise to get progression recommendations.`
      };
    }

    if (history.length < 3) {
      return {
        success: true,
        action: 'ANALYZE_PROGRESSION',
        data: { insufficientData: true, exercise: exerciseName, workoutCount: history.length },
        message: `You've completed ${history.length} workout${history.length > 1 ? 's' : ''} with ${exerciseName}. Complete ${3 - history.length} more to get accurate progression recommendations.`
      };
    }

    // Analyze last 3 workouts for progression readiness
    const last3Workouts = history.slice(0, 3);
    const latestWorkout = last3Workouts[0];
    const currentWeight = latestWorkout.maxWeight;

    // Check if weight has been consistent across last 3 workouts
    const weights = last3Workouts.map(w => w.maxWeight);
    const isWeightConsistent = weights.every(w => w === currentWeight);

    // Check if reps have been hitting targets consistently
    const avgReps = last3Workouts.reduce((sum, w) => sum + w.maxReps, 0) / 3;
    const targetReps = 8; // Standard hypertrophy rep range target
    const isHittingReps = avgReps >= targetReps;

    // Check volume trend
    const recentVolume = last3Workouts.reduce((sum, w) => sum + w.totalVolume, 0) / 3;
    let olderVolume = recentVolume;
    if (history.length >= 6) {
      const older3Workouts = history.slice(3, 6);
      olderVolume = older3Workouts.reduce((sum, w) => sum + w.totalVolume, 0) / 3;
    }
    const volumeIncreasing = recentVolume > olderVolume * 1.05;

    // Check for regression (weight decreasing)
    let isRegressing = false;
    if (history.length >= 5) {
      const previous2Workouts = history.slice(3, 5);
      const previousAvgWeight = previous2Workouts.reduce((sum, w) => sum + w.maxWeight, 0) / 2;
      isRegressing = currentWeight < previousAvgWeight * 0.95;
    }

    // Decision logic for progression recommendation
    let recommendation;
    let readyToProgress = false;
    let suggestedWeight = currentWeight;
    let emoji = '💪';

    if (isRegressing) {
      // User is regressing - suggest deload or maintenance
      emoji = '⚠️';
      recommendation = `Your weight has decreased recently on ${exerciseName}. Consider:\n\n`;
      recommendation += `• Take a deload week (50-60% of current weight)\n`;
      recommendation += `• Check recovery (sleep, nutrition, stress)\n`;
      recommendation += `• Focus on form over weight\n\n`;
      recommendation += `Current: ${currentWeight} lbs × ${Math.round(avgReps)} reps`;
    } else if (isWeightConsistent && isHittingReps) {
      // Ready to progress!
      readyToProgress = true;
      emoji = '🚀';

      // Calculate suggested progression (5-10 lbs depending on exercise)
      const isCompound = ['squat', 'deadlift', 'bench', 'press'].some(e =>
        exerciseName.toLowerCase().includes(e)
      );
      const increment = isCompound ? 10 : 5;
      suggestedWeight = currentWeight + increment;

      recommendation = `${emoji} Yes! You're ready to progress on ${exerciseName}!\n\n`;
      recommendation += `You've hit ${Math.round(avgReps)} reps consistently at ${currentWeight} lbs for 3 workouts.\n\n`;
      recommendation += `💡 Recommended: Increase to ${suggestedWeight} lbs (+${increment} lbs)\n\n`;
      recommendation += `Aim for ${targetReps}+ reps on your first set. If you can't hit ${targetReps} reps, stay at ${currentWeight} lbs for 1-2 more sessions.`;
    } else if (isWeightConsistent && !isHittingReps) {
      // Not hitting rep targets yet
      emoji = '⏳';
      recommendation = `Not quite yet! Stay at ${currentWeight} lbs for now.\n\n`;
      recommendation += `Your reps are averaging ${Math.round(avgReps)} across last 3 sessions. Push for ${targetReps}+ reps consistently before adding weight.\n\n`;
      recommendation += `💡 Tips:\n`;
      recommendation += `• Focus on hitting ${targetReps}-12 reps per set\n`;
      recommendation += `• Ensure proper form and full ROM\n`;
      recommendation += `• Consider adding 1 more set to build volume`;
    } else {
      // Weight is varying - encourage consistency
      emoji = '📊';
      recommendation = `Focus on consistency first.\n\n`;
      recommendation += `Your weight has varied recently (${Math.min(...weights)}-${Math.max(...weights)} lbs). Pick a weight and stick with it for 3 sessions before progressing.\n\n`;
      recommendation += `💡 Suggested: Use ${currentWeight} lbs for your next 2-3 sessions and aim for ${targetReps}+ reps.`;
    }

    return {
      success: true,
      action: 'ANALYZE_PROGRESSION',
      data: {
        exercise: exerciseName,
        currentWeight,
        suggestedWeight,
        readyToProgress,
        avgReps: Math.round(avgReps),
        workoutCount: history.length,
        isWeightConsistent,
        isHittingReps,
        volumeIncreasing,
        isRegressing
      },
      message: recommendation
    };
  } catch (error) {
    console.error('Error analyzing progression:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to analyze progression. Make sure you have workout history for this exercise.'
    };
  }
}

// ============ POST-WORKOUT ANALYSIS ============

// Map exercises to primary muscle groups
function getMuscleGroupsFromExercise(exerciseName) {
  const name = exerciseName.toLowerCase();
  const muscleGroups = [];

  // Chest
  if (name.includes('bench') || name.includes('chest') || name.includes('fly') ||
      name.includes('press') && (name.includes('chest') || name.includes('incline') || name.includes('decline'))) {
    muscleGroups.push('chest');
  }

  // Back
  if (name.includes('row') || name.includes('pull') || name.includes('lat') ||
      name.includes('back') || name.includes('deadlift')) {
    muscleGroups.push('back');
  }

  // Legs
  if (name.includes('squat') || name.includes('leg') || name.includes('lunge') ||
      name.includes('quad') || name.includes('hamstring') || name.includes('calf')) {
    muscleGroups.push('legs');
  }

  // Shoulders
  if (name.includes('shoulder') || name.includes('lateral') || name.includes('rear delt') ||
      (name.includes('press') && (name.includes('shoulder') || name.includes('overhead') || name.includes('military')))) {
    muscleGroups.push('shoulders');
  }

  // Arms
  if (name.includes('curl') || name.includes('tricep') || name.includes('bicep') ||
      name.includes('arm') || name.includes('extension')) {
    muscleGroups.push('arms');
  }

  // Core
  if (name.includes('ab') || name.includes('plank') || name.includes('crunch') ||
      name.includes('core') || name.includes('oblique')) {
    muscleGroups.push('core');
  }

  // If no match, try to categorize by equipment or movement
  if (muscleGroups.length === 0) {
    if (name.includes('push')) muscleGroups.push('chest');
    else if (name.includes('pull')) muscleGroups.push('back');
    else muscleGroups.push('other');
  }

  return muscleGroups;
}

// Get weekly volume for muscle groups
async function getWeeklyMuscleGroupVolume(userId, weeksBack = 4) {
  try {
    const WorkoutStorageService = (await import('../services/WorkoutStorageService')).default;

    // Get workouts from the last X weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeksBack * 7));

    const allWorkouts = await WorkoutStorageService.getWorkoutHistory();

    // Filter workouts within date range
    const recentWorkouts = allWorkouts.filter(w => {
      const workoutDate = new Date(w.date || w.endTime);
      return workoutDate >= startDate && workoutDate <= endDate;
    });

    // Calculate volume per muscle group per week
    const weeklyData = {};

    recentWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date || workout.endTime);
      const weekNumber = Math.floor((endDate - workoutDate) / (7 * 24 * 60 * 60 * 1000));

      if (!weeklyData[weekNumber]) {
        weeklyData[weekNumber] = {
          chest: 0,
          back: 0,
          legs: 0,
          shoulders: 0,
          arms: 0,
          core: 0,
          other: 0,
          total: 0
        };
      }

      // Sum up volume by exercise
      const exercises = workout.exercises || [];
      exercises.forEach((exercise, index) => {
        const sets = workout.exerciseSets?.[index] || workout.exerciseSets?.[index.toString()] || [];
        const muscleGroups = getMuscleGroupsFromExercise(exercise.name);

        sets.forEach(set => {
          if (set.weight && set.reps) {
            const volume = parseFloat(set.weight) * parseInt(set.reps);
            muscleGroups.forEach(group => {
              weeklyData[weekNumber][group] += volume;
              weeklyData[weekNumber].total += volume;
            });
          }
        });
      });
    });

    return weeklyData;
  } catch (error) {
    console.error('Error calculating weekly volume:', error);
    return {};
  }
}

export async function analyzeWorkoutInsights(workoutData, exerciseSets, userId) {
  try {
    const insights = [];
    const { exercises = [], duration, workoutTitle } = workoutData || {};

    // Calculate workout stats
    let totalVolume = 0;
    let totalSets = 0;
    const exerciseStats = [];

    exercises.forEach((exercise, index) => {
      const sets = exerciseSets?.[index] || exerciseSets?.[index.toString()] || [];
      if (sets.length === 0) return;

      const completedSets = sets.filter(s => s.weight && s.reps);
      const maxWeight = Math.max(...completedSets.map(s => parseFloat(s.weight) || 0));
      const maxReps = Math.max(...completedSets.map(s => parseInt(s.reps) || 0));
      const exerciseVolume = completedSets.reduce((sum, set) =>
        sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0
      );

      totalVolume += exerciseVolume;
      totalSets += completedSets.length;

      exerciseStats.push({
        name: exercise.name,
        sets: completedSets,
        maxWeight,
        maxReps,
        volume: exerciseVolume,
        bestSet: completedSets.reduce((best, set) => {
          const currentVolume = (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
          const bestVolume = (parseFloat(best?.weight) || 0) * (parseInt(best?.reps) || 0);
          return currentVolume > bestVolume ? set : best;
        }, null)
      });
    });

    // Get historical data for comparison (if available)
    const historicalComparisons = await Promise.all(
      exerciseStats.map(async (stat) => {
        try {
          const history = await ContextManager.getExerciseHistory(stat.name, userId, 5);
          if (!history || history.length === 0) {
            return {
              exerciseName: stat.name,
              isFirstTime: true
            };
          }

          const lastWorkout = history[0];
          const prData = await ContextManager.getExercisePR(stat.name, userId, 'weight');

          return {
            exerciseName: stat.name,
            isFirstTime: false,
            lastMaxWeight: lastWorkout.maxWeight,
            lastVolume: lastWorkout.totalVolume,
            lastMaxReps: lastWorkout.maxReps,
            currentPR: prData?.value || 0,
            weightImprovement: stat.maxWeight - lastWorkout.maxWeight,
            volumeImprovement: stat.volume - lastWorkout.totalVolume,
            repsImprovement: stat.maxReps - lastWorkout.maxReps,
            isNewWeightPR: stat.maxWeight > (prData?.value || 0),
            history
          };
        } catch (error) {
          console.error(`Error getting history for ${stat.name}:`, error);
          return {
            exerciseName: stat.name,
            isFirstTime: true
          };
        }
      })
    );

    // Generate insights based on comparisons
    historicalComparisons.forEach((comparison, index) => {
      const stat = exerciseStats[index];

      // New PR Detection
      if (comparison.isNewWeightPR) {
        insights.push({
          type: 'pr',
          emoji: '🏆',
          title: 'New Personal Record!',
          message: `${stat.name}: ${stat.maxWeight} lbs × ${stat.maxReps} reps - That's a new PR! Previous best: ${comparison.currentPR} lbs`,
          priority: 10
        });
      }

      // Volume PR Detection
      if (!comparison.isFirstTime && comparison.volumeImprovement > 500) {
        insights.push({
          type: 'volume_pr',
          emoji: '🔥',
          title: 'Volume Increase!',
          message: `${stat.name}: +${Math.round(comparison.volumeImprovement)} lbs total volume vs last session. You're crushing it!`,
          priority: 8
        });
      }

      // Weight Progression
      if (!comparison.isFirstTime && comparison.weightImprovement > 0) {
        insights.push({
          type: 'progression',
          emoji: '📈',
          title: 'Progressive Overload Working!',
          message: `${stat.name}: You increased weight by ${comparison.weightImprovement} lbs since last time (${comparison.lastMaxWeight} → ${stat.maxWeight} lbs)`,
          priority: 7
        });
      }

      // Rep Improvement
      if (!comparison.isFirstTime && comparison.repsImprovement >= 2 && comparison.weightImprovement === 0) {
        insights.push({
          type: 'reps',
          emoji: '💪',
          title: 'Rep Gains!',
          message: `${stat.name}: +${comparison.repsImprovement} more reps at ${stat.maxWeight} lbs. Ready to increase weight next time!`,
          priority: 6
        });
      }

      // First Time Exercise
      if (comparison.isFirstTime) {
        insights.push({
          type: 'first_time',
          emoji: '✨',
          title: 'New Exercise Unlocked!',
          message: `${stat.name}: Great job trying something new! Baseline set: ${stat.bestSet?.weight} lbs × ${stat.bestSet?.reps} reps`,
          priority: 5
        });
      }

      // Regression Warning
      if (!comparison.isFirstTime && comparison.weightImprovement < -10) {
        insights.push({
          type: 'warning',
          emoji: '⚠️',
          title: 'Strength Drop Detected',
          message: `${stat.name}: Weight dropped by ${Math.abs(comparison.weightImprovement)} lbs. Consider extra rest or check your recovery.`,
          priority: 9
        });
      }
    });

    // Overall Workout Insights
    if (totalVolume > 10000) {
      insights.push({
        type: 'overall',
        emoji: '💥',
        title: 'Epic Volume Session!',
        message: `You moved ${Math.round(totalVolume).toLocaleString()} lbs total today! That's serious work!`,
        priority: 8
      });
    }

    if (totalSets >= 20) {
      insights.push({
        type: 'overall',
        emoji: '🎯',
        title: 'High Volume Completed',
        message: `${totalSets} sets completed! Your work capacity is impressive.`,
        priority: 6
      });
    }

    // Duration-based insights
    const durationMinutes = parseInt(duration?.split(':')[0] || 0) * 60 + parseInt(duration?.split(':')[1] || 0);
    if (durationMinutes > 90) {
      insights.push({
        type: 'duration',
        emoji: '⏱️',
        title: 'Long Session',
        message: `${Math.round(durationMinutes)} minute workout. Consider if this duration is sustainable for recovery.`,
        priority: 4
      });
    } else if (durationMinutes < 30 && totalSets >= 15) {
      insights.push({
        type: 'duration',
        emoji: '⚡',
        title: 'Efficient Workout!',
        message: `${totalSets} sets in ${Math.round(durationMinutes)} minutes. You're training efficiently!`,
        priority: 7
      });
    }

    // Volume Tracking & Overtraining Detection
    try {
      // Calculate current workout volume by muscle group
      const currentMuscleVolume = {
        chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0, other: 0
      };

      exerciseStats.forEach(stat => {
        const muscleGroups = getMuscleGroupsFromExercise(stat.name);
        muscleGroups.forEach(group => {
          currentMuscleVolume[group] += stat.volume;
        });
      });

      // Get historical weekly volume data
      const weeklyData = await getWeeklyMuscleGroupVolume(userId, 4);

      // Calculate baseline (average of weeks 1-3, excluding current week 0)
      const baseline = {
        chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0, other: 0
      };

      let weekCount = 0;
      for (let week = 1; week <= 3; week++) {
        if (weeklyData[week]) {
          weekCount++;
          Object.keys(baseline).forEach(group => {
            baseline[group] += weeklyData[week][group] || 0;
          });
        }
      }

      // Average the baseline
      if (weekCount > 0) {
        Object.keys(baseline).forEach(group => {
          baseline[group] = baseline[group] / weekCount;
        });
      }

      // Add current workout to this week's total
      const thisWeekTotal = { ...currentMuscleVolume };
      if (weeklyData[0]) {
        Object.keys(thisWeekTotal).forEach(group => {
          thisWeekTotal[group] += weeklyData[0][group] || 0;
        });
      }

      // Detect volume spikes (>50% increase from baseline)
      const warnings = [];
      Object.keys(thisWeekTotal).forEach(group => {
        if (group === 'other') return; // Skip "other" category

        const thisWeek = thisWeekTotal[group];
        const avg = baseline[group];

        if (avg > 0 && thisWeek > avg * 1.5) {
          const percentIncrease = Math.round(((thisWeek - avg) / avg) * 100);
          warnings.push({
            group,
            percentIncrease,
            thisWeek: Math.round(thisWeek),
            baseline: Math.round(avg)
          });
        }
      });

      // Add warnings to insights (highest priority)
      warnings.forEach(warning => {
        const groupName = warning.group.charAt(0).toUpperCase() + warning.group.slice(1);
        insights.push({
          type: 'volume_warning',
          emoji: '⚠️',
          title: 'High Volume Alert!',
          message: `${groupName} volume is ${warning.percentIncrease}% higher than your average this week (${warning.thisWeek.toLocaleString()} vs ${warning.baseline.toLocaleString()} lbs). Risk of overtraining - consider extra rest or lighter session.`,
          priority: 11 // Higher than PR priority
        });
      });

      // Deload suggestion if multiple muscle groups are high volume
      if (warnings.length >= 2) {
        insights.push({
          type: 'deload_suggestion',
          emoji: '🔄',
          title: 'Consider a Deload Week',
          message: `Multiple muscle groups showing high volume this week. Your body might benefit from a deload (50-60% normal volume) to recover and prevent injury.`,
          priority: 11
        });
      }

      // Positive feedback for consistent volume
      if (warnings.length === 0 && weekCount >= 2) {
        const totalThisWeek = Object.values(thisWeekTotal).reduce((sum, v) => sum + v, 0);
        const totalBaseline = Object.values(baseline).reduce((sum, v) => sum + v, 0);

        if (totalThisWeek >= totalBaseline * 0.8 && totalThisWeek <= totalBaseline * 1.3) {
          insights.push({
            type: 'volume_consistent',
            emoji: '✅',
            title: 'Consistent Training Volume',
            message: `Your weekly volume is on track (${Math.round(totalThisWeek).toLocaleString()} lbs). Great consistency for sustainable progress!`,
            priority: 5
          });
        }
      }

    } catch (volumeError) {
      console.error('Error in volume tracking:', volumeError);
      // Don't fail the entire analysis if volume tracking fails
    }

    // Sort insights by priority (highest first)
    insights.sort((a, b) => b.priority - a.priority);

    // Return top 5 insights
    return {
      success: true,
      insights: insights.slice(0, 5),
      stats: {
        totalVolume: Math.round(totalVolume),
        totalSets,
        exerciseCount: exercises.length,
        duration
      }
    };

  } catch (error) {
    console.error('Error analyzing workout insights:', error);
    return {
      success: false,
      insights: [],
      error: error.message
    };
  }
}

// ============ RECIPES SCREEN ACTIONS ============

async function findRecipe(params, context) {
  try {
    const { filter } = params;

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Load saved recipes from AsyncStorage
    const RECIPES_KEY = '@saved_recipes';
    const savedData = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedData ? JSON.parse(savedData) : [];

    // Built-in recipe database
    const builtInRecipes = [
      {
        name: 'Grilled Chicken Salad',
        calories: 350,
        protein: 45,
        type: 'high-protein',
        prepTime: '15 min',
        ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil']
      },
      {
        name: 'Protein Oatmeal Bowl',
        calories: 420,
        protein: 35,
        type: 'high-protein',
        prepTime: '10 min',
        ingredients: ['Oats', 'Protein powder', 'Banana', 'Almond butter']
      },
      {
        name: 'Salmon & Quinoa',
        calories: 480,
        protein: 40,
        type: 'high-protein',
        prepTime: '20 min',
        ingredients: ['Salmon fillet', 'Quinoa', 'Broccoli', 'Lemon']
      },
      {
        name: 'Veggie Egg White Omelette',
        calories: 180,
        protein: 25,
        type: 'low-calorie',
        prepTime: '10 min',
        ingredients: ['Egg whites', 'Spinach', 'Mushrooms', 'Bell pepper']
      },
      {
        name: 'Greek Yogurt Parfait',
        calories: 220,
        protein: 20,
        type: 'quick',
        prepTime: '5 min',
        ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey']
      }
    ];

    // Combine saved and built-in recipes
    const allRecipes = [...savedRecipes, ...builtInRecipes];

    // Filter recipes based on parameter
    let filteredRecipes = allRecipes;
    if (filter) {
      filteredRecipes = allRecipes.filter(r => r.type === filter);
    }

    if (filteredRecipes.length === 0) {
      return {
        success: true,
        action: 'FIND_RECIPE',
        data: { noRecipes: true, filter },
        message: `No ${filter || ''} recipes found. Tap "Add Recipe" on the Recipes screen to create your own!`
      };
    }

    // Show top 3 recipes
    const topRecipes = filteredRecipes.slice(0, 3);
    let message = `${filter ? filter.charAt(0).toUpperCase() + filter.slice(1) + ' ' : ''}Recipes:\n\n`;

    topRecipes.forEach(recipe => {
      message += `🍽️ ${recipe.name}\n`;
      message += `  ${recipe.calories} cal | ${recipe.protein}g protein`;
      if (recipe.prepTime) message += ` | ${recipe.prepTime}`;
      message += `\n\n`;
    });

    if (filteredRecipes.length > 3) {
      message += `...and ${filteredRecipes.length - 3} more! Check the Recipes screen to see all.`;
    }

    return {
      success: true,
      action: 'FIND_RECIPE',
      data: {
        recipes: topRecipes,
        totalCount: filteredRecipes.length,
        filter
      },
      message
    };
  } catch (error) {
    console.error('Error finding recipes:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to find recipes. Check the Recipes screen to browse manually.'
    };
  }
}

async function createRecipe(params, context) {
  return {
    success: true,
    action: 'CREATE_RECIPE',
    data: {},
    message: 'To create a recipe:\n\n1. Go to Recipes screen\n2. Tap "Add Recipe" button (+ icon)\n3. Enter recipe name and servings\n4. Add ingredients using the search\n5. Save your recipe!\n\nYour saved recipes will sync across devices.'
  };
}

async function suggestRecipe(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context to see what macros are needed
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesLeft = (nutritionContext.calories?.target || 2000) - (nutritionContext.calories?.consumed || 0);
    const proteinLeft = (nutritionContext.protein?.target || 150) - (nutritionContext.protein?.consumed || 0);

    // Recipe suggestions based on remaining macros
    const recipeSuggestions = {
      highProtein: [
        { name: 'Grilled Chicken & Broccoli', calories: 380, protein: 48, prepTime: '20 min' },
        { name: 'Salmon with Asparagus', calories: 420, protein: 45, prepTime: '25 min' },
        { name: 'Greek Yogurt Protein Bowl', calories: 340, protein: 42, prepTime: '10 min' }
      ],
      balanced: [
        { name: 'Turkey Wrap with Veggies', calories: 450, protein: 35, prepTime: '15 min' },
        { name: 'Chicken Stir Fry Bowl', calories: 520, protein: 38, prepTime: '20 min' },
        { name: 'Beef & Sweet Potato', calories: 480, protein: 40, prepTime: '30 min' }
      ],
      lowCalorie: [
        { name: 'Egg White Veggie Scramble', calories: 200, protein: 28, prepTime: '10 min' },
        { name: 'Tuna Salad (no mayo)', calories: 180, protein: 32, prepTime: '5 min' },
        { name: 'Grilled Chicken Salad', calories: 250, protein: 35, prepTime: '15 min' }
      ]
    };

    let suggestion;
    let category;

    if (proteinLeft > 50) {
      category = 'highProtein';
      suggestion = recipeSuggestions.highProtein[Math.floor(Math.random() * recipeSuggestions.highProtein.length)];
    } else if (caloriesLeft > 600) {
      category = 'balanced';
      suggestion = recipeSuggestions.balanced[Math.floor(Math.random() * recipeSuggestions.balanced.length)];
    } else {
      category = 'lowCalorie';
      suggestion = recipeSuggestions.lowCalorie[Math.floor(Math.random() * recipeSuggestions.lowCalorie.length)];
    }

    const message = `Based on your remaining macros (${Math.round(caloriesLeft)} cal, ${Math.round(proteinLeft)}g protein):\n\n` +
                   `🍽️ ${suggestion.name}\n` +
                   `${suggestion.calories} cal | ${suggestion.protein}g protein | ${suggestion.prepTime}\n\n` +
                   `Find more recipes in the Recipes tab!`;

    return {
      success: true,
      action: 'SUGGEST_RECIPE',
      data: {
        recipe: suggestion,
        category,
        caloriesLeft: Math.round(caloriesLeft),
        proteinLeft: Math.round(proteinLeft)
      },
      message
    };
  } catch (error) {
    console.error('Error suggesting recipe:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to suggest a recipe. Try browsing the Recipes screen.'
    };
  }
}

async function showSavedRecipes(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Load saved recipes from AsyncStorage
    const RECIPES_KEY = '@saved_recipes';
    const savedData = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedData ? JSON.parse(savedData) : [];

    if (savedRecipes.length === 0) {
      return {
        success: true,
        action: 'SHOW_SAVED_RECIPES',
        data: { noSavedRecipes: true },
        message: 'You haven\'t saved any recipes yet. Create your first recipe on the Recipes screen by tapping "Add Recipe"!'
      };
    }

    let message = `Your Saved Recipes (${savedRecipes.length} total):\n\n`;

    savedRecipes.slice(0, 5).forEach(recipe => {
      message += `🍽️ ${recipe.name}\n`;
      if (recipe.calories) {
        message += `  ${recipe.calories} cal | ${recipe.protein || 0}g protein\n`;
      }
      message += `  ${recipe.ingredients?.length || 0} ingredients\n\n`;
    });

    if (savedRecipes.length > 5) {
      message += `...and ${savedRecipes.length - 5} more! Go to Recipes screen to see all.`;
    }

    return {
      success: true,
      action: 'SHOW_SAVED_RECIPES',
      data: {
        totalRecipes: savedRecipes.length,
        recipes: savedRecipes.slice(0, 5)
      },
      message
    };
  } catch (error) {
    console.error('Error showing saved recipes:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to load saved recipes. Check the Recipes screen.'
    };
  }
}

// ============ EXERCISE DETAIL SCREEN ACTIONS ============

async function getExerciseForm(params, context) {
  const { exercise } = params;

  const exerciseName = exercise || context.exerciseSpecific?.exerciseName || 'this exercise';

  // Enhanced form tips database with detailed cues
  const formTips = {
    'bench': {
      name: 'Bench Press',
      tips: [
        '• Retract shoulder blades and keep them pinned to the bench',
        '• Keep elbows at 45° angle, not flared out',
        '• Drive through chest and upper back',
        '• Keep feet planted, use leg drive',
        '• Lower bar to mid-chest with control'
      ]
    },
    'squat': {
      name: 'Squat',
      tips: [
        '• Keep back straight, chest up throughout the movement',
        '• Push knees out in line with toes',
        '• Go to at least parallel depth (hip crease below knee)',
        '• Drive through heels, not toes',
        '• Brace core before descending'
      ]
    },
    'deadlift': {
      name: 'Deadlift',
      tips: [
        '• Keep back flat/neutral, no rounding',
        '• Push through heels, think "leg press the floor"',
        '• Hinge at hips, maintain tension',
        '• Bar stays close to body throughout',
        '• Lock out hips and knees at top'
      ]
    },
    'press': {
      name: 'Overhead Press',
      tips: [
        '• Brace core hard before pressing',
        '• Press straight up, not forward',
        '• Lock out overhead directly over midfoot',
        '• Keep wrists straight, bar in palm',
        '• Squeeze glutes to prevent lower back arching'
      ]
    },
    'row': {
      name: 'Row',
      tips: [
        '• Pull to lower chest/upper abs',
        '• Squeeze shoulder blades together at top',
        '• Control the descent, don\'t drop',
        '• Keep torso stable, minimal momentum',
        '• Think "elbows back" not "hands back"'
      ]
    },
    'curl': {
      name: 'Curl',
      tips: [
        '• Keep elbows stationary at sides',
        '• Control the eccentric (lowering)',
        '• Full range of motion, stretch to squeeze',
        '• Don\'t swing or use momentum',
        '• Focus on bicep contraction'
      ]
    }
  };

  // Find matching exercise
  let formGuide = null;
  for (const [key, value] of Object.entries(formTips)) {
    if (exerciseName.toLowerCase().includes(key)) {
      formGuide = value;
      break;
    }
  }

  if (formGuide) {
    const message = `${formGuide.name} Form Tips:\n\n${formGuide.tips.join('\n')}\n\nPractice with lighter weight to master form before adding load!`;

    return {
      success: true,
      action: 'GET_EXERCISE_FORM',
      data: {
        exercise: formGuide.name,
        tips: formGuide.tips
      },
      message
    };
  }

  // Generic tips if exercise not found
  return {
    success: true,
    action: 'GET_EXERCISE_FORM',
    data: { exercise: exerciseName },
    message: `General Form Tips for ${exerciseName}:\n\n• Keep strict form, control the weight\n• Full range of motion\n• Breathe properly (exhale on exertion)\n• Focus on mind-muscle connection\n• Don't use momentum or swing\n\nConsider recording a set to check your form!`
  };
}

async function checkExerciseHistory(params, context) {
  try {
    const { exercise } = params;
    const exerciseName = exercise || context.exerciseSpecific?.exerciseName;

    if (!exerciseName) {
      return {
        success: false,
        message: 'Unable to determine which exercise to check history for.'
      };
    }

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get exercise history
    const history = await ContextManager.getExerciseHistory(exerciseName, userId, 10);

    if (!history || history.length === 0) {
      return {
        success: true,
        action: 'CHECK_EXERCISE_HISTORY',
        data: { noHistory: true, exercise: exerciseName },
        message: `No workout history found for ${exerciseName}. Complete a workout with this exercise to start tracking!`
      };
    }

    // Format recent workouts
    let message = `${exerciseName} History (${history.length} workouts):\n\n`;

    history.slice(0, 5).forEach((workout, idx) => {
      const date = new Date(workout.date);
      const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      const dateStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      message += `${idx + 1}. ${dateStr}\n`;
      message += `   ${workout.maxWeight} lbs × ${workout.maxReps} reps`;
      if (workout.totalVolume) {
        message += ` | ${Math.round(workout.totalVolume)} lbs volume`;
      }
      message += `\n\n`;
    });

    if (history.length > 5) {
      message += `...and ${history.length - 5} more workouts. View full history in Progress → Charts.`;
    }

    return {
      success: true,
      action: 'CHECK_EXERCISE_HISTORY',
      data: {
        exercise: exerciseName,
        workoutCount: history.length,
        recentWorkouts: history.slice(0, 5)
      },
      message
    };
  } catch (error) {
    console.error('Error checking exercise history:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch exercise history. Try again later.'
    };
  }
}

async function checkExercisePR(params, context) {
  try {
    const { exercise } = params;
    const exerciseName = exercise || context.exerciseSpecific?.exerciseName;

    if (!exerciseName) {
      return {
        success: false,
        message: 'Unable to determine which exercise to check PR for.'
      };
    }

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get PR data for weight
    const weightPR = await ContextManager.getExercisePR(exerciseName, userId, 'weight');
    const repsPR = await ContextManager.getExercisePR(exerciseName, userId, 'reps');
    const volumePR = await ContextManager.getExercisePR(exerciseName, userId, 'volume');

    if (!weightPR && !repsPR && !volumePR) {
      return {
        success: true,
        action: 'CHECK_EXERCISE_PR',
        data: { noPR: true, exercise: exerciseName },
        message: `No PR recorded yet for ${exerciseName}. Complete your first workout to set a baseline!`
      };
    }

    let message = `${exerciseName} Personal Records:\n\n`;

    if (weightPR) {
      message += `💪 Max Weight: ${weightPR.display}\n`;
      message += `   Set on ${new Date(weightPR.date).toLocaleDateString()}\n\n`;
    }

    if (repsPR && repsPR.value !== weightPR?.reps) {
      message += `🔥 Max Reps: ${repsPR.display}\n`;
      message += `   Set on ${new Date(repsPR.date).toLocaleDateString()}\n\n`;
    }

    if (volumePR) {
      message += `📊 Max Volume: ${Math.round(volumePR.value)} lbs\n`;
      message += `   Set on ${new Date(volumePR.date).toLocaleDateString()}\n\n`;
    }

    message += `Keep pushing to break these records! 🚀`;

    return {
      success: true,
      action: 'CHECK_EXERCISE_PR',
      data: {
        exercise: exerciseName,
        weightPR: weightPR?.display,
        repsPR: repsPR?.display,
        volumePR: volumePR ? Math.round(volumePR.value) : null
      },
      message
    };
  } catch (error) {
    console.error('Error checking exercise PR:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch PR data. Try again later.'
    };
  }
}

async function suggestExerciseAlternative(params, context) {
  const { exercise } = params;
  const exerciseName = exercise || context.exerciseSpecific?.exerciseName || 'this exercise';

  // Exercise alternatives database
  const alternatives = {
    'bench': {
      name: 'Bench Press',
      alternatives: [
        { name: 'Dumbbell Bench Press', reason: 'Better range of motion, unilateral strength' },
        { name: 'Incline Bench Press', reason: 'Targets upper chest more' },
        { name: 'Push-ups', reason: 'Bodyweight alternative, great for high reps' }
      ]
    },
    'squat': {
      name: 'Squat',
      alternatives: [
        { name: 'Front Squat', reason: 'More quad emphasis, easier on lower back' },
        { name: 'Leg Press', reason: 'Isolates legs, removes balance component' },
        { name: 'Bulgarian Split Squat', reason: 'Unilateral strength, mobility work' }
      ]
    },
    'deadlift': {
      name: 'Deadlift',
      alternatives: [
        { name: 'Romanian Deadlift', reason: 'More hamstring focus, less lower back stress' },
        { name: 'Trap Bar Deadlift', reason: 'More quad involvement, easier on back' },
        { name: 'Rack Pulls', reason: 'Reduced range of motion, focus on lockout' }
      ]
    },
    'press': {
      name: 'Overhead Press',
      alternatives: [
        { name: 'Dumbbell Shoulder Press', reason: 'Greater range of motion, unilateral work' },
        { name: 'Push Press', reason: 'Allow more weight with leg drive' },
        { name: 'Landmine Press', reason: 'Shoulder-friendly angle, less mobility required' }
      ]
    },
    'row': {
      name: 'Row',
      alternatives: [
        { name: 'Dumbbell Row', reason: 'Unilateral strength, better stretch' },
        { name: 'Cable Row', reason: 'Constant tension throughout movement' },
        { name: 'Pendlay Row', reason: 'Explosive power, full dead stop each rep' }
      ]
    },
    'curl': {
      name: 'Curl',
      alternatives: [
        { name: 'Hammer Curls', reason: 'Targets brachialis, forearm development' },
        { name: 'Preacher Curls', reason: 'Strict form, peak contraction' },
        { name: 'Cable Curls', reason: 'Constant tension, easier on joints' }
      ]
    }
  };

  // Find matching alternatives
  let alternativeSet = null;
  for (const [key, value] of Object.entries(alternatives)) {
    if (exerciseName.toLowerCase().includes(key)) {
      alternativeSet = value;
      break;
    }
  }

  if (alternativeSet) {
    let message = `Alternatives to ${alternativeSet.name}:\n\n`;

    alternativeSet.alternatives.forEach((alt, idx) => {
      message += `${idx + 1}. ${alt.name}\n`;
      message += `   → ${alt.reason}\n\n`;
    });

    return {
      success: true,
      action: 'SUGGEST_EXERCISE_ALTERNATIVE',
      data: {
        exercise: alternativeSet.name,
        alternatives: alternativeSet.alternatives
      },
      message
    };
  }

  // Generic suggestions if exercise not found
  return {
    success: true,
    action: 'SUGGEST_EXERCISE_ALTERNATIVE',
    data: { exercise: exerciseName },
    message: `For ${exerciseName}, consider:\n\n• A dumbbell variation (more ROM, unilateral work)\n• A cable variation (constant tension)\n• A bodyweight variation (technique practice)\n\nChoose based on your equipment and goals!`
  };
}

// ============ HELPER FUNCTIONS ============

function extractExerciseName(message) {
  const exercises = ['bench', 'press', 'squat', 'deadlift', 'row', 'curl',
                     'pullup', 'chinup', 'dip', 'lunge', 'leg press'];

  for (const exercise of exercises) {
    if (message.toLowerCase().includes(exercise)) {
      return exercise;
    }
  }
  return null;
}

function extractMuscleGroup(message) {
  const lowerMsg = message.toLowerCase();

  // Check for specific muscle groups (order matters - check specific before general)
  // Arms/Biceps/Triceps variations
  if (lowerMsg.match(/bicep|tricep|arm|curl|pushdown/)) return 'Arms';

  // Chest variations
  if (lowerMsg.match(/chest|bench|press.*chest|pec/)) return 'Chest';

  // Back variations
  if (lowerMsg.match(/back|pull|row|lat|deadlift/)) return 'Back';

  // Legs variations
  if (lowerMsg.match(/leg|squat|quad|hamstring|calf|glute/)) return 'Legs';

  // Shoulders variations
  if (lowerMsg.match(/shoulder|delt|overhead press|lateral/)) return 'Shoulders';

  // Core/Abs
  if (lowerMsg.match(/abs|core|plank/)) return 'Arms'; // Use Arms template for now

  // Full body
  if (lowerMsg.match(/full body|total body|whole body/)) return 'Full Body';

  return 'Full Body';
}

function extractMuscleGroups(message) {
  const lowerMsg = message.toLowerCase();
  const muscleGroups = [];

  // Check for workout split types FIRST (before individual muscle groups)
  // Push workout = Chest + Shoulders + Triceps
  if (lowerMsg.match(/\bpush\b/)) {
    return ['Chest', 'Shoulders', 'Triceps'];
  }

  // Pull workout = Back + Biceps
  if (lowerMsg.match(/\bpull\b/) && !lowerMsg.match(/\bpush\b/)) {
    return ['Back', 'Biceps'];
  }

  // Leg workout
  if (lowerMsg.match(/\bleg day\b|\blegs?\b/) && !lowerMsg.match(/push|pull/)) {
    return ['Legs'];
  }

  // Full body
  if (lowerMsg.match(/full body|total body|whole body/)) {
    return ['Full Body'];
  }

  // Upper body
  if (lowerMsg.match(/upper body/)) {
    return ['Chest', 'Back', 'Shoulders', 'Arms'];
  }

  // Lower body
  if (lowerMsg.match(/lower body/)) {
    return ['Legs'];
  }

  // Check for each muscle group and add to array (order matters - specific before general)
  if (lowerMsg.match(/chest|bench|press.*chest|pec/)) muscleGroups.push('Chest');
  if (lowerMsg.match(/back|row|lat/)) muscleGroups.push('Back');
  if (lowerMsg.match(/leg|squat|quad|hamstring|calf|glute/)) muscleGroups.push('Legs');
  if (lowerMsg.match(/shoulder|delt|overhead press|lateral/)) muscleGroups.push('Shoulders');

  // Specific arm muscles
  if (lowerMsg.match(/tricep|pushdown|skull crusher|dip/)) muscleGroups.push('Triceps');
  if (lowerMsg.match(/bicep|curl/)) muscleGroups.push('Biceps');

  // General arms (only if biceps/triceps not already added)
  if (lowerMsg.match(/\barm\b/) && !muscleGroups.includes('Biceps') && !muscleGroups.includes('Triceps')) {
    muscleGroups.push('Arms');
  }

  if (lowerMsg.match(/abs|core|plank/)) muscleGroups.push('Core');

  // If no specific groups found, default to Full Body
  if (muscleGroups.length === 0) {
    return ['Full Body'];
  }

  return muscleGroups;
}

function extractDateFromMessage(message) {
  const lowerMsg = message.toLowerCase();

  // Relative dates: "in 2 days", "in 3 days", "in a week"
  const relativeDaysMatch = lowerMsg.match(/in (\d+) days?/);
  if (relativeDaysMatch) {
    const daysAhead = parseInt(relativeDaysMatch[1]);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    return {
      type: 'relative',
      daysAhead,
      dateString: targetDate.toISOString().split('T')[0],
      displayText: `in ${daysAhead} day${daysAhead > 1 ? 's' : ''}`
    };
  }

  // "in a week"
  if (lowerMsg.match(/in a week/)) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    return {
      type: 'relative',
      daysAhead: 7,
      dateString: targetDate.toISOString().split('T')[0],
      displayText: 'in a week'
    };
  }

  // Specific dates: "October 20", "Oct 20", "10/20"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrev = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                       'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  for (let i = 0; i < monthNames.length; i++) {
    const fullMonth = monthNames[i];
    const abbrev = monthAbbrev[i];
    const monthRegex = new RegExp(`(${fullMonth}|${abbrev})\\s+(\\d{1,2})`, 'i');
    const match = lowerMsg.match(monthRegex);

    if (match) {
      const day = parseInt(match[2]);
      const month = i;
      const year = new Date().getFullYear();
      const targetDate = new Date(year, month, day);

      return {
        type: 'specific',
        dateString: targetDate.toISOString().split('T')[0],
        displayText: targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      };
    }
  }

  // Named days: "today", "tomorrow", day of week
  if (lowerMsg.includes('today')) {
    return {
      type: 'named',
      day: 'today',
      dateString: new Date().toISOString().split('T')[0],
      displayText: 'today'
    };
  }

  if (lowerMsg.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      type: 'named',
      day: 'tomorrow',
      dateString: tomorrow.toISOString().split('T')[0],
      displayText: 'tomorrow'
    };
  }

  // Days of week
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (const dayName of daysOfWeek) {
    if (lowerMsg.includes(dayName)) {
      const targetDayIndex = daysOfWeek.indexOf(dayName);
      const currentDate = new Date();
      const currentDayIndex = currentDate.getDay();

      let daysToAdd = targetDayIndex - currentDayIndex;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Schedule for next week
      }

      const targetDate = new Date();
      targetDate.setDate(currentDate.getDate() + daysToAdd);

      return {
        type: 'named',
        day: dayName,
        dateString: targetDate.toISOString().split('T')[0],
        displayText: dayName.charAt(0).toUpperCase() + dayName.slice(1)
      };
    }
  }

  return null; // No date found
}

export default {
  detectIntent,
  executeAction
};
