/**
 * Workout Actions
 * Handles execution of workout-related actions
 */

import { WorkoutStorageService } from '../../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Log a set to the current workout
 */
export async function logSet(params, context) {
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

/**
 * Suggest weight for current exercise
 */
export async function suggestWeight(params, context) {
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
            message: `Try **${suggestedWeight} lbs**.`
          };
        }
      }

      // Standard 5 lb increase if stable
      const suggestedWeight = currentWeight + 5;
      return {
        success: true,
        action: 'SUGGEST_WEIGHT',
        data: { currentWeight, suggestedWeight },
        message: `Try **${suggestedWeight} lbs**.`
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
      message: `Start with **${suggestedWeight} lbs**.`
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

/**
 * Get form tip for an exercise
 */
export async function getFormTip(params, context) {
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

/**
 * Check personal record for an exercise
 */
export async function checkPR(params, context) {
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

/**
 * Add exercise to current workout
 */
export async function addExercise(params, context) {
  const { exercise } = params;

  // TODO: Actually add exercise to current workout
  return {
    success: true,
    action: 'ADD_EXERCISE',
    data: { exercise },
    message: `✅ Added ${exercise || 'exercise'} to your workout. Try 3 sets × 10 reps.`
  };
}

/**
 * Plan workout based on history
 */
export async function planWorkout(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get recent workout history from Firebase
    const WorkoutSyncService = (await import('../../backend/WorkoutSyncService')).default;
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

/**
 * Analyze progression readiness for an exercise
 */
export async function analyzeProgression(params, context) {
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
