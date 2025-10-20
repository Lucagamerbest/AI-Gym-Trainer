/**
 * Home Screen Actions
 * Handles execution of home screen-specific actions (today summary, motivation, etc.)
 */

import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Get today's summary (workout + nutrition)
 */
export async function getTodaySummary(params, context) {
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
    const WorkoutSyncService = (await import('../../backend/WorkoutSyncService')).default;
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

/**
 * Get motivational quote
 */
export async function getMotivation(params, context) {
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

/**
 * Plan a workout based on recent training history
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
