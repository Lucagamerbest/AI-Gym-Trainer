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
      console.log('⚠️ Could not fetch workouts from Firebase');
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
      console.log('⚠️ Could not fetch workouts from Firebase');
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
    console.log('🔥 Using Firebase user ID:', userId);

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

    console.log('🤖 Asking AI to generate workout...');
    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });
    console.log('🤖 AI Response:', aiResponse.response);

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
      console.log('⚠️ AI parsing failed, using fallback');
      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }

    console.log(`✅ Generated ${exercises.length} exercises:`, exercises);
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

export default {
  detectIntent,
  executeAction
};
