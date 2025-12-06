/**
 * Volume and Progression Tools (2024 Research)
 *
 * AI tools for analyzing training volume and providing progressive overload recommendations
 * Based on 2024 meta-analyses and Jeff Nippard's methods
 */

import WorkoutSyncService from '../../backend/WorkoutSyncService';
import {
  calculateWeeklyVolume,
  analyzeVolumeStatus,
  analyzeTrainingFrequency,
  generateVolumeReport,
  VOLUME_LANDMARKS_2024,
  FREQUENCY_RECOMMENDATIONS_2024
} from '../VolumeTracker2024';
import {
  recommendNextWeight,
  analyzeProgressionTrend,
  needsDeloadWeek,
  generateDeloadWorkout,
  calculateTrainingWeeks,
  hasDeloadedRecently,
  generateProgressionReport
} from '../ProgressionTracker2024';

/**
 * Analyze weekly training volume for a muscle group
 * Use when user asks: "Am I training enough?", "How many sets for chest?", "Analyze my volume"
 */
export async function analyzeWeeklyVolume({ userId, muscleGroup, timeframe = 7 }) {
  try {

    // Get recent workouts
    const workouts = await WorkoutSyncService.getUserWorkouts(userId, timeframe);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        volume: 0,
        status: 'no_data',
        message: `No workouts found in the last ${timeframe} days.`,
        recommendation: 'Start training to build a baseline!'
      };
    }

    // Calculate volume for specific muscle or all muscles
    if (muscleGroup && muscleGroup.toLowerCase() !== 'all') {
      const volume = calculateWeeklyVolume(workouts, muscleGroup);
      const volumeStatus = analyzeVolumeStatus(volume, muscleGroup);
      const frequencyStatus = analyzeTrainingFrequency(workouts, muscleGroup);

      return {
        success: true,
        muscleGroup,
        weeklyVolume: volume,
        volumeStatus: volumeStatus.status,
        volumeMessage: volumeStatus.message,
        volumeRecommendation: volumeStatus.recommendation,
        frequency: frequencyStatus.frequency,
        frequencyMessage: frequencyStatus.message,
        frequencyRecommendation: frequencyStatus.recommendation,
        landmarks: VOLUME_LANDMARKS_2024[muscleGroup.toUpperCase()],
        totalWorkouts: workouts.length
      };
    }

    // Generate full report for all muscle groups
    const report = generateVolumeReport(workouts);

    return {
      success: true,
      report: report,
      totalWorkouts: workouts.length,
      overallStatus: report.overallStatus,
      warnings: report.warnings,
      recommendations: report.recommendations,
      muscleAnalysis: report.muscleAnalysis
    };

  } catch (error) {
    console.error('❌ analyzeWeeklyVolume error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get progressive overload recommendation for next workout
 * Use when user asks: "What weight should I use?", "How to progress?", "Recommend next weight"
 */
export async function getProgressiveOverloadAdvice({ userId, exerciseName, muscleGroup }) {
  try {

    // Get workout history for this exercise
    const workouts = await WorkoutSyncService.getUserWorkouts(userId, 30); // Last 30 days

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        status: 'no_history',
        message: 'No workout history found. Start with a comfortable weight at RPE 7-8.',
        recommendation: 'Choose a weight where you can complete all reps with 2-3 reps left in the tank.'
      };
    }

    // Find sessions for this exercise
    const exerciseSessions = [];
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        if (ex.name.toLowerCase().includes(exerciseName.toLowerCase())) {
          // Extract session data
          const sets = ex.completedSets || [];
          if (sets.length > 0) {
            const avgWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0) / sets.length;
            const avgReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0) / sets.length;
            const avgRPE = sets.reduce((sum, set) => sum + (set.rpe || 8), 0) / sets.length;

            exerciseSessions.push({
              date: workout.date,
              weight: avgWeight,
              reps: Math.round(avgReps),
              sets: sets.length,
              rpe: Math.round(avgRPE * 10) / 10, // Round to 1 decimal
              equipment: ex.equipment || 'barbell',
              targetRepRange: ex.targetRepRange || '8-12'
            });
          }
        }
      });
    });

    if (exerciseSessions.length === 0) {
      return {
        success: true,
        status: 'no_exercise_history',
        message: `No history found for "${exerciseName}". This will be your first session.`,
        recommendation: 'Start with a conservative weight at RPE 7 (3 reps left in reserve) to establish a baseline.'
      };
    }

    // Sort by date (most recent last)
    exerciseSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get most recent session
    const lastSession = exerciseSessions[exerciseSessions.length - 1];

    // Get progression recommendation
    const nextRecommendation = recommendNextWeight(
      exerciseName,
      lastSession,
      lastSession.targetRepRange
    );

    // Analyze trend if multiple sessions
    let trendAnalysis = null;
    if (exerciseSessions.length >= 2) {
      trendAnalysis = analyzeProgressionTrend(exerciseSessions, exerciseName);
    }

    return {
      success: true,
      exerciseName,
      lastSession: {
        date: lastSession.date,
        performance: `${lastSession.weight} lbs × ${lastSession.reps} reps @ RPE ${lastSession.rpe}`,
        sets: lastSession.sets
      },
      nextRecommendation: {
        weight: nextRecommendation.nextWeight,
        reps: nextRecommendation.nextReps,
        sets: nextRecommendation.nextSets,
        reason: nextRecommendation.reason,
        progressionType: nextRecommendation.progressionType,
        change: nextRecommendation.changeAmount,
        warning: nextRecommendation.warning
      },
      trend: trendAnalysis ? {
        status: trendAnalysis.trend,
        message: trendAnalysis.message,
        recommendation: trendAnalysis.recommendation
      } : null,
      totalSessions: exerciseSessions.length
    };

  } catch (error) {
    console.error('❌ getProgressiveOverloadAdvice error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user needs a deload week
 * Use when user asks: "Do I need a deload?", "Am I overtraining?", "Should I rest?"
 */
export async function checkDeloadStatus({ userId }) {
  try {

    // Get all workouts (last 60 days to calculate training weeks)
    const workouts = await WorkoutSyncService.getUserWorkouts(userId, 60);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        needsDeload: false,
        message: 'No workout history found. Start training first!',
        trainingWeeks: 0
      };
    }

    // Calculate training weeks
    const weeksOfTraining = calculateTrainingWeeks(workouts);

    // Check if recently deloaded
    const recentlyDeloaded = hasDeloadedRecently(workouts);

    if (recentlyDeloaded) {
      return {
        success: true,
        needsDeload: false,
        message: 'You deloaded recently (within last 2 weeks). Continue regular training.',
        trainingWeeks: weeksOfTraining,
        nextDeloadIn: Math.max(0, 4 - weeksOfTraining) + ' weeks'
      };
    }

    // Check deload need
    const deloadStatus = needsDeloadWeek(workouts, weeksOfTraining);

    return {
      success: true,
      needsDeload: deloadStatus.needsDeload,
      reason: deloadStatus.reason,
      deloadType: deloadStatus.deloadType,
      priority: deloadStatus.priority,
      trainingWeeks: weeksOfTraining,
      message: deloadStatus.needsDeload ?
        `🔵 DELOAD WEEK RECOMMENDED: ${deloadStatus.reason}` :
        `✅ Continue training. Deload in ${Math.max(0, 4 - weeksOfTraining)} weeks.`
    };

  } catch (error) {
    console.error('❌ checkDeloadStatus error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze progression for a specific exercise over time
 * Use when user asks: "Am I progressing on bench?", "Show my squat progress", "Track my gains"
 */
export async function analyzeExerciseProgression({ userId, exerciseName }) {
  try {

    // Get workout history (last 90 days for long-term trend)
    const workouts = await WorkoutSyncService.getUserWorkouts(userId, 90);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        status: 'no_data',
        message: 'No workout history found.',
        exerciseName
      };
    }

    // Extract sessions for this exercise
    const exerciseSessions = [];
    workouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        if (ex.name.toLowerCase().includes(exerciseName.toLowerCase())) {
          const sets = ex.completedSets || [];
          if (sets.length > 0) {
            const avgWeight = sets.reduce((sum, set) => sum + (set.weight || 0), 0) / sets.length;
            const avgReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0) / sets.length;
            const avgRPE = sets.reduce((sum, set) => sum + (set.rpe || 8), 0) / sets.length;
            const totalVolume = sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);

            exerciseSessions.push({
              date: workout.date,
              weight: avgWeight,
              reps: Math.round(avgReps),
              sets: sets.length,
              rpe: Math.round(avgRPE * 10) / 10,
              volume: totalVolume
            });
          }
        }
      });
    });

    if (exerciseSessions.length === 0) {
      return {
        success: true,
        status: 'no_exercise_data',
        message: `No history found for "${exerciseName}".`,
        exerciseName
      };
    }

    // Sort by date
    exerciseSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate progression report
    const report = generateProgressionReport(exerciseName, exerciseSessions);

    // Calculate total volume change
    const firstVolume = exerciseSessions[0].volume;
    const lastVolume = exerciseSessions[exerciseSessions.length - 1].volume;
    const volumeChange = ((lastVolume - firstVolume) / firstVolume * 100).toFixed(1);

    return {
      success: true,
      exerciseName,
      status: report.trend.trend,
      totalSessions: exerciseSessions.length,
      firstSession: {
        date: exerciseSessions[0].date,
        performance: `${exerciseSessions[0].weight} lbs × ${exerciseSessions[0].reps} reps`
      },
      lastSession: {
        date: exerciseSessions[exerciseSessions.length - 1].date,
        performance: `${exerciseSessions[exerciseSessions.length - 1].weight} lbs × ${exerciseSessions[exerciseSessions.length - 1].reps} reps`
      },
      volumeChange: `${volumeChange > 0 ? '+' : ''}${volumeChange}%`,
      trend: report.trend,
      nextRecommendation: report.nextRecommendation
    };

  } catch (error) {
    console.error('❌ analyzeExerciseProgression error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Tool schemas for AI function calling
 */
export const volumeProgressionToolSchemas = [
  // 1. Analyze Weekly Volume
  {
    name: 'analyzeWeeklyVolume',
    description: 'Analyze training volume for a muscle group over the past week. Based on 2024 meta-analysis: 4 sets minimum, 8-18 optimal per week. Use when user asks "Am I training enough?", "How many sets?", "Analyze my volume", or "Is my chest volume optimal?"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (auto-injected from context)'
        },
        muscleGroup: {
          type: 'string',
          description: 'Muscle group to analyze (e.g., "chest", "back", "legs", "biceps", "triceps"). Use "all" for full body analysis.',
          enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'legs', 'all']
        },
        timeframe: {
          type: 'number',
          description: 'Number of days to analyze (default: 7 for weekly)',
          default: 7
        }
      },
      required: ['userId', 'muscleGroup']
    }
  },

  // 2. Get Progressive Overload Advice
  {
    name: 'getProgressiveOverloadAdvice',
    description: 'Get weight/rep recommendation for next workout based on last session and RPE. Uses Jeff Nippard\'s progression method: Add weight when RPE ≤7, add reps when RPE 8-9. Use when user asks "What weight should I use?", "How to progress?", "Recommend next weight for bench press"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (auto-injected from context)'
        },
        exerciseName: {
          type: 'string',
          description: 'Exercise name (e.g., "Bench Press", "Squat", "Deadlift")'
        },
        muscleGroup: {
          type: 'string',
          description: 'Muscle group for context (e.g., "chest", "legs", "back")',
          enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'quads', 'hamstrings']
        }
      },
      required: ['userId', 'exerciseName']
    }
  },

  // 3. Check Deload Status
  {
    name: 'checkDeloadStatus',
    description: 'Check if user needs a deload week. Based on Jeff Nippard protocol: deload every 4-6 weeks OR when performance drops. Use when user asks "Do I need a deload?", "Am I overtraining?", "Should I take a rest week?"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (auto-injected from context)'
        }
      },
      required: ['userId']
    }
  },

  // 4. Analyze Exercise Progression
  {
    name: 'analyzeExerciseProgression',
    description: 'Analyze progression trend for a specific exercise over time (last 90 days). Shows volume change, progression status, and recommendations. Use when user asks "Am I progressing?", "Show my bench press progress", "Track my gains on squats"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID (auto-injected from context)'
        },
        exerciseName: {
          type: 'string',
          description: 'Exercise name to analyze (e.g., "Bench Press", "Squat", "Deadlift")'
        }
      },
      required: ['userId', 'exerciseName']
    }
  }
];

export default {
  analyzeWeeklyVolume,
  getProgressiveOverloadAdvice,
  checkDeloadStatus,
  analyzeExerciseProgression,
  volumeProgressionToolSchemas
};
