let ContextManager;
try {
  ContextManager = require('./ContextManager').default;
} catch (error) {
  console.error('Failed to load ContextManager:', error.message);
}

/**
 * Volume Tracking & Balance Service
 * Tracks weekly volume per muscle group and detects imbalances
 */
class VolumeTrackingService {
  /**
   * Get volume breakdown for the last 7 days
   * @param {string} userId
   * @returns {Object} Volume data per muscle group
   */
  async getWeeklyVolume(userId) {
    try {
      if (!ContextManager || !ContextManager.getAllWorkoutHistory) {
        console.warn('ContextManager not available');
        return null;
      }
      const workoutHistory = await ContextManager.getAllWorkoutHistory(userId, 30);

      // Filter to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentWorkouts = workoutHistory.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= sevenDaysAgo;
      });

      // Count sets per muscle group
      const volumeData = {
        chest: { sets: 0, exercises: [] },
        back: { sets: 0, exercises: [] },
        legs: { sets: 0, exercises: [] },
        shoulders: { sets: 0, exercises: [] },
        arms: { sets: 0, exercises: [] },
        core: { sets: 0, exercises: [] },
      };

      recentWorkouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          const sets = exercise.sets?.length || 0;
          const muscleGroups = this.identifyMuscleGroups(exercise.name);

          muscleGroups.forEach(muscle => {
            if (volumeData[muscle]) {
              volumeData[muscle].sets += sets;
              if (!volumeData[muscle].exercises.includes(exercise.name)) {
                volumeData[muscle].exercises.push(exercise.name);
              }
            }
          });
        });
      });

      // Add recommendations for each muscle group
      Object.keys(volumeData).forEach(muscle => {
        volumeData[muscle].status = this.getVolumeStatus(volumeData[muscle].sets);
        volumeData[muscle].recommendation = this.getVolumeRecommendation(
          muscle,
          volumeData[muscle].sets
        );
      });

      return {
        weeklyVolume: volumeData,
        totalSets: Object.values(volumeData).reduce((sum, m) => sum + m.sets, 0),
        workoutCount: recentWorkouts.length,
        period: '7 days',
      };
    } catch (error) {
      console.error('Error calculating weekly volume:', error.message || error);
      return null;
    }
  }

  /**
   * Identify which muscle groups an exercise targets
   */
  identifyMuscleGroups(exerciseName) {
    const name = exerciseName.toLowerCase();
    const muscles = [];

    // Chest
    if (name.match(/bench|chest|press|fly|flye|pec|dip/)) {
      if (!name.includes('shoulder') && !name.includes('overhead')) {
        muscles.push('chest');
      }
    }

    // Back
    if (name.match(/pull|row|lat|back|deadlift|shrug/)) {
      muscles.push('back');
    }

    // Legs
    if (name.match(/squat|leg|lunge|deadlift|calf|glute|hamstring|quad/)) {
      muscles.push('legs');
    }

    // Shoulders
    if (name.match(/shoulder|lateral|overhead|military|arnold|delt|raise/)) {
      muscles.push('shoulders');
    }

    // Arms
    if (name.match(/curl|tricep|bicep|arm|preacher|hammer/)) {
      muscles.push('arms');
    }

    // Core
    if (name.match(/crunch|plank|ab|core|sit.?up|leg.?raise/)) {
      muscles.push('core');
    }

    // If no match, try to infer from common patterns
    if (muscles.length === 0) {
      // Default to most common
      if (name.includes('press') && !name.includes('leg')) {
        muscles.push('chest');
      }
    }

    return muscles;
  }

  /**
   * Get volume status (LOW, OPTIMAL, HIGH)
   */
  getVolumeStatus(sets) {
    // Optimal range: 10-20 sets per muscle group per week
    if (sets < 8) return 'LOW';
    if (sets >= 8 && sets <= 22) return 'OPTIMAL';
    return 'HIGH';
  }

  /**
   * Get recommendation for a muscle group based on volume
   */
  getVolumeRecommendation(muscle, sets) {
    const status = this.getVolumeStatus(sets);

    if (status === 'LOW') {
      const needed = 10 - sets;
      return `Add ${needed}+ sets this week`;
    }

    if (status === 'HIGH') {
      const excess = sets - 20;
      return `Reduce by ${excess} sets - risk of overtraining`;
    }

    return 'Volume is good';
  }

  /**
   * Detect muscle group imbalances
   * @param {string} userId
   * @returns {Array} List of imbalance warnings
   */
  async detectImbalances(userId) {
    try {
      const volumeData = await this.getWeeklyVolume(userId);
      if (!volumeData) return [];

      const { weeklyVolume } = volumeData;
      const imbalances = [];

      // Check common imbalances
      // 1. Chest vs Back (should be roughly equal or back slightly higher)
      const chestSets = weeklyVolume.chest.sets;
      const backSets = weeklyVolume.back.sets;

      if (chestSets > backSets * 1.5 && chestSets >= 10) {
        imbalances.push({
          type: 'PUSH_PULL_IMBALANCE',
          severity: 'HIGH',
          message: `Chest volume (${chestSets} sets) is much higher than back (${backSets} sets)`,
          recommendation: 'Add more pulling exercises (rows, pull-ups, face pulls)',
          musclesAffected: ['chest', 'back'],
        });
      }

      // 2. Legs vs Upper Body (legs often neglected)
      const legSets = weeklyVolume.legs.sets;
      const upperSets = chestSets + backSets + weeklyVolume.shoulders.sets;

      if (upperSets > legSets * 2 && upperSets >= 20) {
        imbalances.push({
          type: 'LEG_NEGLECT',
          severity: 'MEDIUM',
          message: `Upper body (${upperSets} sets) getting 2x more volume than legs (${legSets} sets)`,
          recommendation: 'Add at least 1 more leg session this week',
          musclesAffected: ['legs'],
        });
      }

      // 3. Very low volume on any muscle group
      Object.entries(weeklyVolume).forEach(([muscle, data]) => {
        if (data.sets < 5 && data.sets > 0) {
          imbalances.push({
            type: 'LOW_VOLUME',
            severity: 'LOW',
            message: `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} only has ${data.sets} sets this week`,
            recommendation: `Add ${10 - data.sets} more sets to hit minimum effective volume`,
            musclesAffected: [muscle],
          });
        }
      });

      // Sort by severity
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return imbalances.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    } catch (error) {
      console.error('Error detecting imbalances:', error);
      return [];
    }
  }

  /**
   * Get a quick summary for display
   */
  async getVolumeSummary(userId) {
    try {
      const volumeData = await this.getWeeklyVolume(userId);
      if (!volumeData) return null;

      const { weeklyVolume, totalSets, workoutCount } = volumeData;

      // Find highest and lowest volume muscle groups
      const muscleArray = Object.entries(weeklyVolume).map(([name, data]) => ({
        name,
        sets: data.sets,
        status: data.status,
      }));

      const sorted = muscleArray.sort((a, b) => b.sets - a.sets);
      const highest = sorted[0];
      const lowest = sorted.filter(m => m.sets > 0)[sorted.filter(m => m.sets > 0).length - 1];

      return {
        totalSets,
        workoutCount,
        highest: highest ? `${highest.name} (${highest.sets} sets)` : 'N/A',
        lowest: lowest ? `${lowest.name} (${lowest.sets} sets)` : 'N/A',
        weeklyVolume,
      };
    } catch (error) {
      console.error('Error getting volume summary:', error);
      return null;
    }
  }
}

export default new VolumeTrackingService();
