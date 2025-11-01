/**
 * Progressive Overload Tracker 2024
 *
 * Based on Jeff Nippard's proven progression methods and 2024 research
 *
 * Key principles:
 * 1. Add weight when RPE drops below 7 (still have 3+ reps in reserve)
 * 2. Double progression: Add reps first (within range), then weight
 * 3. Linear progression for beginners/intermediates
 * 4. Deload every 4-6 weeks to prevent overtraining
 */

/**
 * Progression increments by equipment type
 */
export const PROGRESSION_INCREMENTS = {
  barbell: 5,        // 5 lbs for barbell (2.5kg)
  dumbbell: 2.5,     // 2.5 lbs for dumbbells (1.25kg per hand)
  machine: 5,        // 5 lbs for machines
  cable: 5,          // 5 lbs for cables
  bodyweight: 1,     // 1 rep for bodyweight
  plate: 2.5         // 2.5 lbs for plate-loaded machines
};

/**
 * Get progression increment based on exercise equipment
 */
export function getProgressionIncrement(exercise) {
  const equipment = exercise.equipment?.toLowerCase() || '';

  if (equipment.includes('barbell')) return PROGRESSION_INCREMENTS.barbell;
  if (equipment.includes('dumbbell')) return PROGRESSION_INCREMENTS.dumbbell;
  if (equipment.includes('cable')) return PROGRESSION_INCREMENTS.cable;
  if (equipment.includes('machine')) return PROGRESSION_INCREMENTS.machine;
  if (equipment.includes('bodyweight') || equipment.includes('body weight')) return PROGRESSION_INCREMENTS.bodyweight;

  return PROGRESSION_INCREMENTS.barbell; // Default
}

/**
 * Recommend next weight/reps based on last session
 *
 * Jeff Nippard's progression rules:
 * - If RPE ≤ 7 (3+ reps left): Add weight
 * - If RPE 8-9 and reps < max range: Add 1 rep
 * - If RPE 8-9 and reps = max range: Add weight and drop reps
 * - If RPE 10 (failure): Maintain weight, try for more reps
 */
export function recommendNextWeight(exerciseName, lastSession, targetRepRange = '8-12') {
  const { weight, reps, rpe, sets } = lastSession;

  // Parse target rep range
  const [minReps, maxReps] = targetRepRange.split('-').map(r => parseInt(r.trim()));

  // Determine equipment type
  const equipment = lastSession.equipment || '';
  const increment = equipment.includes('dumbbell') ? PROGRESSION_INCREMENTS.dumbbell :
                    equipment.includes('barbell') ? PROGRESSION_INCREMENTS.barbell :
                    PROGRESSION_INCREMENTS.barbell;

  // RULE 1: RPE ≤ 7 (Easy) - Add weight
  if (rpe <= 7) {
    return {
      nextWeight: weight + increment,
      nextReps: reps,
      nextSets: sets,
      reason: `Last session: ${weight} lbs × ${reps} reps @ RPE ${rpe}. You had 3+ reps left in the tank. Time to increase weight!`,
      progressionType: 'weight_increase',
      changeAmount: `+${increment} lbs`
    };
  }

  // RULE 2: RPE 8-9 (Hard) and reps below max range - Add reps first (double progression)
  if (rpe >= 8 && rpe < 10 && reps < maxReps) {
    return {
      nextWeight: weight,
      nextReps: reps + 1,
      nextSets: sets,
      reason: `Last session: ${weight} lbs × ${reps} reps @ RPE ${rpe}. Try ${reps + 1} reps with same weight (double progression).`,
      progressionType: 'rep_increase',
      changeAmount: '+1 rep'
    };
  }

  // RULE 3: RPE 8-9 and reps at max range - Add weight, drop reps to minimum
  if (rpe >= 8 && rpe < 10 && reps >= maxReps) {
    return {
      nextWeight: weight + increment,
      nextReps: minReps,
      nextSets: sets,
      reason: `Last session: ${weight} lbs × ${reps} reps @ RPE ${rpe}. You hit max reps! Add weight and start fresh at ${minReps} reps.`,
      progressionType: 'weight_increase_with_rep_drop',
      changeAmount: `+${increment} lbs`
    };
  }

  // RULE 4: RPE 10 (Failure) - Maintain weight, try for more reps
  if (rpe >= 10) {
    return {
      nextWeight: weight,
      nextReps: reps + 1,
      nextSets: sets,
      reason: `Last session: ${weight} lbs × ${reps} reps @ RPE 10 (failure). Maintain weight and push for ${reps + 1} reps without hitting failure.`,
      progressionType: 'rep_increase',
      changeAmount: '+1 rep',
      warning: 'Try to stop at RPE 8-9 (1-2 reps shy of failure) for optimal hypertrophy.'
    };
  }

  // DEFAULT: Maintain current weight and reps
  return {
    nextWeight: weight,
    nextReps: reps,
    nextSets: sets,
    reason: `Maintain ${weight} lbs × ${reps} reps until RPE drops below 8.`,
    progressionType: 'maintain',
    changeAmount: 'No change'
  };
}

/**
 * Analyze progression trend over multiple sessions
 */
export function analyzeProgressionTrend(sessions, exerciseName) {
  if (!sessions || sessions.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 2 sessions to analyze progression',
      recommendation: null
    };
  }

  // Sort sessions by date (oldest to newest)
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate total volume for each session (sets × reps × weight)
  const volumes = sorted.map(s => {
    const sets = s.sets || s.completedSets?.length || 1;
    const avgWeight = s.weight || s.avgWeight || 0;
    const avgReps = s.reps || s.avgReps || 0;
    return sets * avgWeight * avgReps;
  });

  // Check if progressing
  const firstVolume = volumes[0];
  const lastVolume = volumes[volumes.length - 1];
  const percentChange = ((lastVolume - firstVolume) / firstVolume) * 100;

  // Analyze last 3 sessions for stagnation
  const recentSessions = sorted.slice(-3);
  const recentVolumes = recentSessions.map(s => {
    const sets = s.sets || s.completedSets?.length || 1;
    const avgWeight = s.weight || s.avgWeight || 0;
    const avgReps = s.reps || s.avgReps || 0;
    return sets * avgWeight * avgReps;
  });

  const isStagnant = recentVolumes.every(v => Math.abs(v - recentVolumes[0]) < 10); // Within 10 volume units

  if (percentChange > 10) {
    return {
      trend: 'progressing',
      message: `Great progress! Volume increased by ${percentChange.toFixed(1)}% over ${sessions.length} sessions.`,
      percentChange: percentChange.toFixed(1),
      recommendation: 'Keep up the progressive overload. You\'re on the right track!'
    };
  }

  if (percentChange > 0 && percentChange <= 10) {
    return {
      trend: 'slow_progress',
      message: `Modest progress: Volume increased by ${percentChange.toFixed(1)}% over ${sessions.length} sessions.`,
      percentChange: percentChange.toFixed(1),
      recommendation: 'Progress is happening but slow. Ensure you\'re pushing to RPE 7-8 and adding weight/reps consistently.'
    };
  }

  if (isStagnant && sessions.length >= 3) {
    return {
      trend: 'stagnant',
      message: `No progress in last 3 sessions. Volume has plateaued at ${lastVolume.toFixed(0)}.`,
      percentChange: 0,
      recommendation: 'PLATEAU DETECTED. Try: 1) Increase training frequency, 2) Add 1-2 sets, 3) Change rep range, or 4) Take a deload week.'
    };
  }

  if (percentChange < 0) {
    return {
      trend: 'regressing',
      message: `Volume decreased by ${Math.abs(percentChange).toFixed(1)}% over ${sessions.length} sessions.`,
      percentChange: percentChange.toFixed(1),
      recommendation: 'REGRESSION DETECTED. Possible overtraining or inadequate recovery. Consider: 1) Deload week, 2) Check sleep/nutrition, 3) Reduce volume.'
    };
  }

  return {
    trend: 'neutral',
    message: `Volume stable around ${lastVolume.toFixed(0)}.`,
    percentChange: 0,
    recommendation: 'Focus on consistent progressive overload (add weight or reps each session).'
  };
}

/**
 * Detect if user needs a deload week
 * Based on Jeff Nippard's protocol: Deload every 4-6 weeks OR when performance drops
 */
export function needsDeloadWeek(workoutHistory, weeksOfTraining) {
  // RULE 1: Automatic deload every 4-6 weeks
  if (weeksOfTraining >= 4 && weeksOfTraining <= 6) {
    return {
      needsDeload: true,
      reason: `You've trained for ${weeksOfTraining} weeks straight. Time for a planned deload week.`,
      deloadType: 'scheduled',
      priority: 'high'
    };
  }

  if (weeksOfTraining > 6) {
    return {
      needsDeload: true,
      reason: `You've trained for ${weeksOfTraining} weeks without a deload. OVERDUE for deload week!`,
      deloadType: 'overdue',
      priority: 'critical'
    };
  }

  // RULE 2: Performance-based deload (check for regression in multiple exercises)
  if (!workoutHistory || workoutHistory.length < 6) {
    return {
      needsDeload: false,
      reason: 'Not enough training history to assess deload need.',
      deloadType: null,
      priority: 'none'
    };
  }

  // Check if performance is dropping across multiple exercises
  // (simplified: check if RPE is consistently high or volume is dropping)
  const recentWorkouts = workoutHistory.slice(-6);
  const avgRecentRPE = recentWorkouts.reduce((sum, w) => {
    const workoutRPE = w.exercises?.reduce((s, e) => s + (e.avgRPE || 8), 0) / (w.exercises?.length || 1);
    return sum + workoutRPE;
  }, 0) / recentWorkouts.length;

  if (avgRecentRPE >= 9) {
    return {
      needsDeload: true,
      reason: `Average RPE is ${avgRecentRPE.toFixed(1)} (very high). Your body needs recovery.`,
      deloadType: 'fatigue_based',
      priority: 'high'
    };
  }

  return {
    needsDeload: false,
    reason: `Training for ${weeksOfTraining} weeks. Continue until week 4 for scheduled deload.`,
    deloadType: null,
    priority: 'none'
  };
}

/**
 * Generate deload workout (reduce volume by 40-50%, keep intensity same)
 */
export function generateDeloadWorkout(normalWorkout) {
  return {
    ...normalWorkout,
    title: `${normalWorkout.title} (DELOAD WEEK)`,
    isDeload: true,
    exercises: normalWorkout.exercises.map(ex => ({
      ...ex,
      sets: Math.ceil(ex.sets / 2), // Reduce sets by 50%
      reps: ex.reps,                 // Keep reps same
      restTime: ex.restTime,         // Keep rest same
      rpe: ex.rpe,                   // Keep intensity same
      deloadNote: `Deload: ${Math.ceil(ex.sets / 2)} sets (normally ${ex.sets} sets). Same weight and RPE.`
    })),
    formatNotes: '🔵 DELOAD WEEK: Reduce volume by 50% (half the sets), but keep weight and RPE the same. This allows your body to recover and supercompensate.'
  };
}

/**
 * Calculate training weeks from workout history
 */
export function calculateTrainingWeeks(workoutHistory) {
  if (!workoutHistory || workoutHistory.length === 0) return 0;

  // Sort by date
  const sorted = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get first and last workout dates
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);

  // Calculate weeks
  const diffTime = Math.abs(lastDate - firstDate);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

  return diffWeeks;
}

/**
 * Check if user has deloaded recently (within last 2 weeks)
 */
export function hasDeloadedRecently(workoutHistory) {
  if (!workoutHistory || workoutHistory.length === 0) return false;

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return workoutHistory.some(workout =>
    workout.isDeload && new Date(workout.date) >= twoWeeksAgo
  );
}

/**
 * Generate progression report for a specific exercise
 */
export function generateProgressionReport(exerciseName, sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      exercise: exerciseName,
      status: 'no_data',
      message: 'No workout history available',
      nextRecommendation: null
    };
  }

  // Get most recent session
  const lastSession = sessions[sessions.length - 1];

  // Get progression recommendation
  const nextRecommendation = recommendNextWeight(exerciseName, lastSession, lastSession.targetRepRange || '8-12');

  // Analyze trend
  const trend = analyzeProgressionTrend(sessions, exerciseName);

  return {
    exercise: exerciseName,
    lastSession: {
      date: lastSession.date,
      weight: lastSession.weight,
      reps: lastSession.reps,
      sets: lastSession.sets,
      rpe: lastSession.rpe
    },
    nextRecommendation,
    trend,
    totalSessions: sessions.length
  };
}

export default {
  PROGRESSION_INCREMENTS,
  getProgressionIncrement,
  recommendNextWeight,
  analyzeProgressionTrend,
  needsDeloadWeek,
  generateDeloadWorkout,
  calculateTrainingWeeks,
  hasDeloadedRecently,
  generateProgressionReport
};
