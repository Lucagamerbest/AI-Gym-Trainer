/**
 * AIActions.js - Simple intent detection and action execution
 *
 * This handles AI taking REAL ACTIONS in the app, not just answering questions.
 * Each screen defines its own actions.
 */

import { WorkoutStorageService } from '../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

    // SUGGEST_WEIGHT - "should I add weight?" / "what weight?" / "go heavier?"
    if (msg.includes('add weight') || msg.includes('what weight') ||
        msg.includes('go heavier') || msg.includes('increase weight') ||
        msg.includes('should i add')) {
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

  // HOME SCREEN INTENTS
  if (screen === 'HomeScreen' || screen === 'Home') {

    // GET_TODAY_SUMMARY - "how's my day" / "today's progress" / "summary"
    if (msg.includes('today') || msg.includes('summary') ||
        msg.includes("how's my day") || msg.includes('progress')) {
      return {
        intent: 'GET_TODAY_SUMMARY',
        confidence: 0.9,
        parameters: {}
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

    // CREATE_WORKOUT_PLAN - "create chest day" / "make a workout" / "build leg day"
    if ((msg.includes('create') || msg.includes('make') || msg.includes('build')) &&
        (msg.includes('workout') || msg.includes('day'))) {
      return {
        intent: 'CREATE_WORKOUT_PLAN',
        confidence: 0.85,
        parameters: {
          muscleGroup: extractMuscleGroup(msg)
        }
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
  console.log(`🎯 Executing action: ${intent}`, parameters);

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
  const { reps, weight, sets } = params;

  // TODO: Integrate with actual workout logging
  // For now, return mock success
  return {
    success: true,
    action: 'LOG_SET',
    data: { reps, weight, sets },
    message: `✅ Logged: ${sets} set${sets > 1 ? 's' : ''} of ${reps} reps @ ${weight} lbs`
  };
}

async function suggestWeight(params, context) {
  // TODO: Get user's exercise history and suggest weight
  // For now, return mock suggestion
  const currentWeight = context.currentExercise?.lastWeight || 185;
  const suggestedWeight = currentWeight + 5;

  return {
    success: true,
    action: 'SUGGEST_WEIGHT',
    data: { currentWeight, suggestedWeight },
    message: `Try ${suggestedWeight} lbs. You crushed ${currentWeight} lbs last time.`
  };
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
  const { exercise } = params;

  // TODO: Get actual PR from workout history
  // For now, return mock PR
  return {
    success: true,
    action: 'CHECK_PR',
    data: { exercise, pr: '275 lbs × 5 reps' },
    message: `Your ${exercise || 'current exercise'} PR: 275 lbs × 5 reps (Oct 10)`
  };
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
  // TODO: Get real data from AsyncStorage
  const mockData = {
    calories: 1200,
    caloriesGoal: 2000,
    protein: 80,
    proteinGoal: 180,
    workoutsToday: 0,
    lastWorkout: '2 days ago - Legs'
  };

  return {
    success: true,
    action: 'GET_TODAY_SUMMARY',
    data: mockData,
    message: `Today: ${mockData.calories}/${mockData.caloriesGoal} cal, ${mockData.protein}/${mockData.proteinGoal}g protein. No workout yet. Last session: ${mockData.lastWorkout}.`
  };
}

async function planWorkout(params, context) {
  // TODO: Smart workout planning based on history
  return {
    success: true,
    action: 'PLAN_WORKOUT',
    data: { recommendation: 'Upper Body Push' },
    message: `You should train Upper Body Push today. Last workout was legs 2 days ago, you're recovered and due for chest/shoulders/triceps.`
  };
}

async function checkNutrition(params, context) {
  // TODO: Get real nutrition data
  const mockData = {
    protein: 80,
    proteinGoal: 180,
    proteinRemaining: 100
  };

  return {
    success: true,
    action: 'CHECK_NUTRITION',
    data: mockData,
    message: `Protein: ${mockData.protein}g / ${mockData.proteinGoal}g. Need ${mockData.proteinRemaining}g more. Aim for 40g per meal.`
  };
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
  const { muscleGroup } = params;

  // TODO: Actually generate workout plan
  return {
    success: true,
    action: 'CREATE_WORKOUT_PLAN',
    data: {
      name: `${muscleGroup || 'Full Body'} Workout`,
      exercises: [
        'Bench Press (4x8)',
        'Incline DB Press (3x10)',
        'Cable Flies (3x12)',
        'Close-Grip Bench (3x10)'
      ]
    },
    message: `✅ Created '${muscleGroup || 'Full Body'} Workout' with 4 exercises. Ready to start?`
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
  const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'biceps',
                        'triceps', 'abs', 'glutes', 'full body'];

  for (const group of muscleGroups) {
    if (message.toLowerCase().includes(group)) {
      return group.charAt(0).toUpperCase() + group.slice(1);
    }
  }
  return 'Full Body';
}

export default {
  detectIntent,
  executeAction
};
