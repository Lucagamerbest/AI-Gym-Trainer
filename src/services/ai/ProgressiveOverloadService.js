import ContextManager from './ContextManager';

/**
 * Progressive Overload Intelligence Service
 * Analyzes workout performance and suggests when to increase weight/reps
 */
class ProgressiveOverloadService {
  /**
   * Analyze recent performance for a specific exercise
   * @param {string} userId
   * @param {string} exerciseName
   * @returns {Object|null} Progression recommendation
   */
  async analyzeExerciseProgression(userId, exerciseName) {
    try {
      const workoutHistory = await ContextManager.getAllWorkoutHistory(userId, 10);

      // Find recent sessions for this exercise
      const exerciseSessions = [];
      workoutHistory.forEach(workout => {
        const exercise = workout.exercises?.find(ex =>
          ex.name.toLowerCase() === exerciseName.toLowerCase()
        );
        if (exercise) {
          exerciseSessions.push({
            date: workout.date,
            workoutId: workout.id,
            ...exercise,
          });
        }
      });

      if (exerciseSessions.length < 2) {
        return null; // Need at least 2 sessions to analyze
      }

      // Get last 3 sessions
      const recentSessions = exerciseSessions.slice(0, 3);
      const lastSession = recentSessions[0];

      // Calculate progression readiness
      const recommendation = this.calculateProgressionRecommendation(
        exerciseName,
        recentSessions
      );

      return recommendation;
    } catch (error) {
      console.error('Error analyzing exercise progression:', error);
      return null;
    }
  }

  /**
   * Calculate if user is ready to progress based on recent performance
   */
  calculateProgressionRecommendation(exerciseName, recentSessions) {
    const lastSession = recentSessions[0];

    // Ensure sets is an array
    let sets = lastSession.sets;
    if (!Array.isArray(sets)) {
      sets = [];
    }

    if (sets.length === 0) return null;

    // Analyze the working sets (ignore warmup sets - usually lighter)
    const workingSets = sets.filter(set =>
      set &&
      typeof set.reps === 'number' &&
      set.reps >= 5 &&
      set.reps <= 15
    );
    if (workingSets.length === 0) return null;

    const avgReps = workingSets.reduce((sum, set) => sum + set.reps, 0) / workingSets.length;
    const topWeight = Math.max(...workingSets.map(set => set.weight || 0));
    const avgWeight = workingSets.reduce((sum, set) => sum + (set.weight || 0), 0) / workingSets.length;

    // Check if user hit high reps (ready to add weight)
    const highRepThreshold = 12; // If doing 12+ reps, add weight
    const consistencyThreshold = 10; // If consistently hitting 10+ reps, progress

    let recommendation = null;

    // RULE 1: Hitting high reps (12+) = add weight
    if (avgReps >= highRepThreshold) {
      const suggestedIncrease = this.calculateWeightIncrease(avgWeight);
      recommendation = {
        type: 'ADD_WEIGHT',
        reason: `Hitting ${Math.round(avgReps)} reps per set - time to go heavier!`,
        currentWeight: Math.round(avgWeight),
        suggestedWeight: Math.round(avgWeight + suggestedIncrease),
        increase: suggestedIncrease,
        confidence: 'HIGH',
        exerciseName,
      };
    }
    // RULE 2: Consistently hitting 10+ reps = progress
    else if (avgReps >= consistencyThreshold && this.isConsistent(recentSessions)) {
      const suggestedIncrease = this.calculateWeightIncrease(avgWeight);
      recommendation = {
        type: 'ADD_WEIGHT',
        reason: `Consistently hitting ${Math.round(avgReps)} reps - ready for more weight`,
        currentWeight: Math.round(avgWeight),
        suggestedWeight: Math.round(avgWeight + suggestedIncrease),
        increase: suggestedIncrease,
        confidence: 'MEDIUM',
        exerciseName,
      };
    }
    // RULE 3: Stuck at low reps (5-6) for multiple sessions = add sets or switch to higher reps
    else if (avgReps <= 6 && recentSessions.length >= 3) {
      const isStuck = recentSessions.every(session => {
        let sets = session.sets;
        if (!Array.isArray(sets) || sets.length === 0) return false;

        const validSets = sets.filter(s => s && typeof s.reps === 'number');
        if (validSets.length === 0) return false;

        const avg = validSets.reduce((sum, s) => sum + s.reps, 0) / validSets.length;
        return avg <= 7;
      });

      if (isStuck) {
        recommendation = {
          type: 'ADD_VOLUME',
          reason: `Stuck at ${Math.round(avgReps)} reps for ${recentSessions.length} sessions`,
          suggestion: `Try adding 1-2 more sets at ${Math.round(avgWeight)} lbs OR drop to ${Math.round(avgWeight * 0.9)} lbs for 8-10 reps`,
          currentWeight: Math.round(avgWeight),
          currentSets: workingSets.length,
          suggestedSets: workingSets.length + 1,
          confidence: 'MEDIUM',
          exerciseName,
        };
      }
    }

    return recommendation;
  }

  /**
   * Check if performance is consistent across recent sessions
   */
  isConsistent(recentSessions) {
    if (recentSessions.length < 2) return false;

    const avgReps = recentSessions.map(session => {
      let sets = session.sets;
      if (!Array.isArray(sets) || sets.length === 0) return 0;

      const validSets = sets.filter(s => s && typeof s.reps === 'number');
      if (validSets.length === 0) return 0;

      return validSets.reduce((sum, s) => sum + s.reps, 0) / validSets.length;
    }).filter(avg => avg > 0); // Remove sessions with no valid data

    if (avgReps.length < 2) return false;

    // Check if all sessions had similar reps (variance < 2 reps)
    const variance = Math.max(...avgReps) - Math.min(...avgReps);
    return variance <= 2;
  }

  /**
   * Calculate suggested weight increase based on current weight
   * Smaller increases for bigger weights
   */
  calculateWeightIncrease(currentWeight) {
    if (currentWeight < 50) return 5;  // Small weights: +5 lbs
    if (currentWeight < 100) return 5; // Medium weights: +5 lbs
    if (currentWeight < 200) return 10; // Heavy weights: +10 lbs
    return 10; // Very heavy: +10 lbs
  }

  /**
   * Find all exercises ready for progression
   * @param {string} userId
   * @returns {Array} List of exercises ready to progress
   */
  async findReadyToProgress(userId) {
    try {
      const workoutHistory = await ContextManager.getAllWorkoutHistory(userId, 10);

      // Get unique exercises from recent workouts
      const exerciseNames = new Set();
      workoutHistory.forEach(workout => {
        workout.exercises?.forEach(ex => {
          exerciseNames.add(ex.name);
        });
      });

      // Analyze each exercise
      const progressionRecommendations = [];
      for (const exerciseName of exerciseNames) {
        const recommendation = await this.analyzeExerciseProgression(userId, exerciseName);
        if (recommendation && recommendation.type === 'ADD_WEIGHT') {
          progressionRecommendations.push(recommendation);
        }
      }

      // Sort by confidence (HIGH first)
      return progressionRecommendations.sort((a, b) => {
        if (a.confidence === 'HIGH' && b.confidence !== 'HIGH') return -1;
        if (b.confidence === 'HIGH' && a.confidence !== 'HIGH') return 1;
        return 0;
      });
    } catch (error) {
      console.error('Error finding ready to progress exercises:', error);
      return [];
    }
  }
}

export default new ProgressiveOverloadService();
