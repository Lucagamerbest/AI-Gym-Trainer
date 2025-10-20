/**
 * Progress Actions
 * Handles execution of progress-related actions (goals, achievements, streaks, exercise progress)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Set a goal for an exercise
 */
export async function setGoal(params, context) {
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

/**
 * Check current goals and progress
 */
export async function checkGoals(params, context) {
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
    const ProgressSyncService = (await import('../../backend/ProgressSyncService')).default;
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

/**
 * Get earned achievements
 */
export async function getAchievements(params, context) {
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

/**
 * Check current workout streak
 */
export async function checkStreak(params, context) {
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

/**
 * Check progress for a specific exercise
 */
export async function checkExerciseProgress(params, context) {
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
