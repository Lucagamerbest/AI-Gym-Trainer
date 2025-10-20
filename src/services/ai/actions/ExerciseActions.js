/**
 * Exercise Detail Actions
 * Handles execution of exercise-specific actions (form, history, PR, alternatives)
 */

import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Get form tips for an exercise
 */
export async function getExerciseForm(params, context) {
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

/**
 * Check exercise history
 */
export async function checkExerciseHistory(params, context) {
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

/**
 * Check exercise personal record
 */
export async function checkExercisePR(params, context) {
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

/**
 * Suggest alternative exercises
 */
export async function suggestExerciseAlternative(params, context) {
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
