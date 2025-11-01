/**
 * Volume Tracker 2024
 *
 * Based on 2024 meta-analysis: "The Resistance Training Dose-Response"
 * and Mike Israetel's Volume Landmarks (Renaissance Periodization)
 *
 * Key findings from 2024 research:
 * - Minimum 4 sets/week to stimulate growth
 * - Optimal 5-10 sets/week for muscle growth
 * - Gains continue beyond 40 weekly sets (diminishing but positive)
 * - High frequency (4x/week) > Low frequency (1x/week) for strength
 * - Hypertrophy similar across frequencies IF volume is equated
 */

// import { VOLUME_LANDMARKS } from './FitnessKnowledge'; // Not needed - using 2024 landmarks below

/**
 * Volume Landmarks (sets per muscle per week)
 * Updated with 2024 meta-analysis findings
 */
export const VOLUME_LANDMARKS_2024 = {
  CHEST: {
    minimum: 4,           // Minimum to stimulate growth (2024 meta-analysis)
    optimal: [8, 18],     // Optimal range for most people
    maximum: 22,          // Maximum recoverable volume
    advanced: 40          // Advanced lifters can benefit from higher volume (diminishing returns)
  },
  BACK: {
    minimum: 4,
    optimal: [10, 20],    // Back can handle more volume
    maximum: 25,
    advanced: 45
  },
  SHOULDERS: {
    minimum: 4,
    optimal: [8, 16],
    maximum: 20,
    advanced: 35
  },
  TRICEPS: {
    minimum: 4,
    optimal: [6, 14],
    maximum: 18,
    advanced: 30
  },
  BICEPS: {
    minimum: 4,
    optimal: [6, 14],
    maximum: 20,
    advanced: 30
  },
  QUADS: {
    minimum: 4,
    optimal: [6, 14],
    maximum: 20,
    advanced: 35
  },
  HAMSTRINGS: {
    minimum: 4,
    optimal: [6, 12],
    maximum: 18,
    advanced: 30
  },
  GLUTES: {
    minimum: 4,
    optimal: [6, 14],
    maximum: 20,
    advanced: 35
  },
  CALVES: {
    minimum: 6,
    optimal: [8, 16],
    maximum: 20,
    advanced: 35
  }
};

/**
 * Training frequency recommendations (2024 research)
 */
export const FREQUENCY_RECOMMENDATIONS_2024 = {
  strength: {
    optimal: 4,           // 4 sessions/week > 1 session/week for strength gains (2024 study)
    minimum: 2,
    explanation: '2024 research: High-frequency training improves maximal strength more than low frequency'
  },
  hypertrophy: {
    optimal: 2,           // 2x/week per muscle group is optimal
    minimum: 1,
    explanation: 'Frequency less important IF volume is equated, but 2x/week allows better volume distribution'
  },
  general: {
    optimal: 2,
    minimum: 1,
    explanation: 'Train each muscle 2x/week for optimal results'
  }
};

/**
 * Calculate weekly volume for a muscle group
 */
export function calculateWeeklyVolume(workouts, muscleGroup) {
  let totalSets = 0;
  const muscleGroupLower = muscleGroup.toLowerCase();

  workouts.forEach(workout => {
    workout.exercises?.forEach(exercise => {
      // Check if exercise targets this muscle group
      const targetsMuscle =
        exercise.primaryMuscles?.some(m => m.toLowerCase().includes(muscleGroupLower)) ||
        exercise.muscleGroup?.toLowerCase().includes(muscleGroupLower);

      if (targetsMuscle) {
        // Count sets (use completedSets if available, otherwise planned sets)
        const sets = exercise.completedSets?.length || exercise.sets || 0;
        totalSets += sets;
      }
    });
  });

  return totalSets;
}

/**
 * Analyze volume status for a muscle group
 * Returns: 'suboptimal', 'optimal', 'high', or 'excessive'
 */
export function analyzeVolumeStatus(weeklyVolume, muscleGroup) {
  const muscleGroupUpper = muscleGroup.toUpperCase();
  const landmarks = VOLUME_LANDMARKS_2024[muscleGroupUpper];

  if (!landmarks) {
    return {
      status: 'unknown',
      message: `No volume data for ${muscleGroup}`,
      recommendation: null
    };
  }

  const { minimum, optimal, maximum, advanced } = landmarks;
  const [optimalMin, optimalMax] = optimal;

  if (weeklyVolume < minimum) {
    return {
      status: 'suboptimal',
      message: `${weeklyVolume} sets/week is below minimum (${minimum} sets) for muscle growth`,
      recommendation: `Increase to at least ${minimum} sets/week. Optimal is ${optimalMin}-${optimalMax} sets/week.`,
      suggestedIncrease: minimum - weeklyVolume,
      color: 'red'
    };
  }

  if (weeklyVolume >= minimum && weeklyVolume < optimalMin) {
    return {
      status: 'below_optimal',
      message: `${weeklyVolume} sets/week will stimulate growth, but below optimal range`,
      recommendation: `Increase to ${optimalMin}-${optimalMax} sets/week for optimal results.`,
      suggestedIncrease: optimalMin - weeklyVolume,
      color: 'yellow'
    };
  }

  if (weeklyVolume >= optimalMin && weeklyVolume <= optimalMax) {
    return {
      status: 'optimal',
      message: `${weeklyVolume} sets/week is in the optimal range (${optimalMin}-${optimalMax})`,
      recommendation: `You're in the sweet spot! Maintain this volume.`,
      suggestedIncrease: 0,
      color: 'green'
    };
  }

  if (weeklyVolume > optimalMax && weeklyVolume <= maximum) {
    return {
      status: 'high',
      message: `${weeklyVolume} sets/week is high but recoverable for most people`,
      recommendation: `Monitor for signs of overtraining. Consider a deload if fatigue accumulates.`,
      suggestedIncrease: 0,
      color: 'yellow'
    };
  }

  if (weeklyVolume > maximum && weeklyVolume <= advanced) {
    return {
      status: 'very_high',
      message: `${weeklyVolume} sets/week is very high. Only advanced lifters can recover from this.`,
      recommendation: `Reduce volume to ${optimalMax} sets/week unless you're an advanced lifter with confirmed recovery capacity.`,
      suggestedDecrease: weeklyVolume - optimalMax,
      color: 'orange'
    };
  }

  if (weeklyVolume > advanced) {
    return {
      status: 'excessive',
      message: `${weeklyVolume} sets/week is excessive. Risk of overtraining is high.`,
      recommendation: `REDUCE to ${optimalMax} sets/week immediately. Even advanced lifters see diminishing returns beyond 40 sets.`,
      suggestedDecrease: weeklyVolume - optimalMax,
      color: 'red'
    };
  }

  return {
    status: 'unknown',
    message: `Unable to categorize ${weeklyVolume} sets/week`,
    recommendation: null
  };
}

/**
 * Analyze training frequency for a muscle group
 */
export function analyzeTrainingFrequency(workouts, muscleGroup, goal = 'hypertrophy') {
  const muscleGroupLower = muscleGroup.toLowerCase();

  // Count how many workouts included this muscle
  const workoutsWithMuscle = workouts.filter(workout =>
    workout.exercises?.some(exercise => {
      const targetsMuscle =
        exercise.primaryMuscles?.some(m => m.toLowerCase().includes(muscleGroupLower)) ||
        exercise.muscleGroup?.toLowerCase().includes(muscleGroupLower);
      return targetsMuscle;
    })
  );

  const frequency = workoutsWithMuscle.length;
  const recommendation = FREQUENCY_RECOMMENDATIONS_2024[goal] || FREQUENCY_RECOMMENDATIONS_2024.general;

  if (frequency < recommendation.minimum) {
    return {
      status: 'too_low',
      frequency,
      message: `Training ${muscleGroup} only ${frequency}x/week`,
      recommendation: `Increase to ${recommendation.optimal}x/week. ${recommendation.explanation}`,
      color: 'red'
    };
  }

  if (frequency === recommendation.optimal) {
    return {
      status: 'optimal',
      frequency,
      message: `Training ${muscleGroup} ${frequency}x/week (optimal)`,
      recommendation: `Perfect frequency! Maintain this.`,
      color: 'green'
    };
  }

  if (frequency > recommendation.optimal) {
    return {
      status: 'high',
      frequency,
      message: `Training ${muscleGroup} ${frequency}x/week`,
      recommendation: `High frequency. Ensure you're recovering adequately between sessions (48-72hr rest).`,
      color: 'yellow'
    };
  }

  return {
    status: 'unknown',
    frequency,
    message: `Training ${muscleGroup} ${frequency}x/week`,
    recommendation: null
  };
}

/**
 * Generate comprehensive volume report for a user's training week
 */
export function generateVolumeReport(workouts, goal = 'hypertrophy') {
  const muscleGroups = ['CHEST', 'BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 'QUADS', 'HAMSTRINGS', 'GLUTES'];

  const report = {
    totalWorkouts: workouts.length,
    muscleAnalysis: {},
    overallStatus: 'unknown',
    warnings: [],
    recommendations: []
  };

  muscleGroups.forEach(muscle => {
    const volume = calculateWeeklyVolume(workouts, muscle);
    const volumeStatus = analyzeVolumeStatus(volume, muscle);
    const frequencyStatus = analyzeTrainingFrequency(workouts, muscle, goal);

    report.muscleAnalysis[muscle] = {
      weeklyVolume: volume,
      volumeStatus,
      frequencyStatus
    };

    // Collect warnings
    if (volumeStatus.status === 'suboptimal' || volumeStatus.status === 'below_optimal') {
      report.warnings.push(`⚠️ ${muscle}: ${volumeStatus.message}`);
      report.recommendations.push(`📈 ${muscle}: ${volumeStatus.recommendation}`);
    }

    if (volumeStatus.status === 'excessive' || volumeStatus.status === 'very_high') {
      report.warnings.push(`🚨 ${muscle}: ${volumeStatus.message}`);
      report.recommendations.push(`📉 ${muscle}: ${volumeStatus.recommendation}`);
    }

    if (frequencyStatus.status === 'too_low') {
      report.warnings.push(`⚠️ ${muscle}: ${frequencyStatus.message}`);
      report.recommendations.push(`🔄 ${muscle}: ${frequencyStatus.recommendation}`);
    }
  });

  // Determine overall status
  const statuses = Object.values(report.muscleAnalysis).map(m => m.volumeStatus.status);
  const hasSuboptimal = statuses.some(s => s === 'suboptimal' || s === 'below_optimal');
  const hasExcessive = statuses.some(s => s === 'excessive');
  const hasOptimal = statuses.some(s => s === 'optimal');

  if (hasExcessive) {
    report.overallStatus = 'overtraining_risk';
  } else if (hasSuboptimal) {
    report.overallStatus = 'undertraining';
  } else if (hasOptimal) {
    report.overallStatus = 'optimal';
  }

  return report;
}

/**
 * Get volume recommendation for adding exercises
 */
export function getVolumeRecommendation(currentVolume, muscleGroup, goal = 'hypertrophy') {
  const volumeStatus = analyzeVolumeStatus(currentVolume, muscleGroup);

  if (volumeStatus.status === 'suboptimal' || volumeStatus.status === 'below_optimal') {
    return {
      shouldAddVolume: true,
      setsToAdd: volumeStatus.suggestedIncrease || 2,
      reason: volumeStatus.recommendation
    };
  }

  if (volumeStatus.status === 'optimal') {
    return {
      shouldAddVolume: false,
      setsToAdd: 0,
      reason: 'Current volume is optimal. Focus on progressive overload instead of adding more volume.'
    };
  }

  if (volumeStatus.status === 'high' || volumeStatus.status === 'very_high' || volumeStatus.status === 'excessive') {
    return {
      shouldAddVolume: false,
      setsToAdd: 0,
      reason: 'Current volume is too high. Consider reducing volume or taking a deload week.',
      shouldReduceVolume: true,
      setsToRemove: volumeStatus.suggestedDecrease || 2
    };
  }

  return {
    shouldAddVolume: false,
    setsToAdd: 0,
    reason: 'Unable to determine volume needs'
  };
}

export default {
  VOLUME_LANDMARKS_2024,
  FREQUENCY_RECOMMENDATIONS_2024,
  calculateWeeklyVolume,
  analyzeVolumeStatus,
  analyzeTrainingFrequency,
  generateVolumeReport,
  getVolumeRecommendation
};
