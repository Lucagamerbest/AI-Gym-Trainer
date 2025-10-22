/**
 * ExerciseTools - AI tools for exercise search and information
 */

import { getAllExercises } from '../../../data/exerciseDatabase';
import WorkoutSyncService from '../../backend/WorkoutSyncService';

/**
 * Search exercises by name, muscle group, or equipment
 */
export async function searchExercises({ query, muscleGroup, equipment, difficulty, limit = 10 }) {
  try {
    const allExercises = getAllExercises();

    let filtered = allExercises;

    // Filter by query (name search)
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm) ||
        ex.primaryMuscles?.some(m => m.toLowerCase().includes(searchTerm)) ||
        ex.equipment?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by muscle group (case-insensitive)
    if (muscleGroup) {
      const muscleGroupLower = muscleGroup.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.primaryMuscles?.some(m => m.toLowerCase().includes(muscleGroupLower)) ||
        ex.secondaryMuscles?.some(m => m.toLowerCase().includes(muscleGroupLower)) ||
        ex.muscleGroup?.toLowerCase().includes(muscleGroupLower)
      );
    }

    // Filter by equipment (case-insensitive)
    if (equipment) {
      const equipmentLower = equipment.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.equipment?.toLowerCase().includes(equipmentLower)
      );
    }

    // Filter by difficulty (case-insensitive)
    if (difficulty) {
      const difficultyLower = difficulty.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.difficulty?.toLowerCase() === difficultyLower
      );
    }

    const results = filtered.slice(0, limit).map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      difficulty: ex.difficulty,
      instructions: ex.instructions?.slice(0, 200), // First 200 chars
    }));

    return {
      success: true,
      count: results.length,
      exercises: results,
    };
  } catch (error) {
    console.error('❌ searchExercises error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get detailed exercise information
 */
export async function getExerciseInfo({ exerciseName }) {
  try {
    const allExercises = getAllExercises();

    const exercise = allExercises.find(ex =>
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    if (!exercise) {
      return {
        success: false,
        error: 'Exercise not found',
      };
    }

    return {
      success: true,
      exercise: {
        name: exercise.name,
        equipment: exercise.equipment,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        difficulty: exercise.difficulty,
        instructions: exercise.instructions,
        tips: exercise.tips,
      },
    };
  } catch (error) {
    console.error('❌ getExerciseInfo error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get exercise personal records and history
 */
export async function getExerciseStats({ exerciseName, userId, days = 90 }) {
  try {
    const workouts = await WorkoutSyncService.getAllWorkouts(100);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        stats: {
          totalSessions: 0,
          message: 'No workout history found',
        },
      };
    }

    // Find workouts containing this exercise
    const exerciseWorkouts = workouts.filter(w =>
      w.exercises?.some(ex =>
        ex.name.toLowerCase() === exerciseName.toLowerCase()
      )
    );

    if (exerciseWorkouts.length === 0) {
      return {
        success: true,
        stats: {
          totalSessions: 0,
          message: `No history found for ${exerciseName}`,
        },
      };
    }

    // Calculate stats
    let maxWeight = 0;
    let maxReps = 0;
    let maxVolume = 0;
    let totalVolume = 0;
    let totalSets = 0;

    exerciseWorkouts.forEach(workout => {
      const exercise = workout.exercises.find(ex =>
        ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (exercise && exercise.sets) {
        exercise.sets.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps) || 0;
          const volume = weight * reps;

          maxWeight = Math.max(maxWeight, weight);
          maxReps = Math.max(maxReps, reps);
          maxVolume = Math.max(maxVolume, volume);
          totalVolume += volume;
          totalSets++;
        });
      }
    });

    // Get recent trend (last 5 sessions)
    const recentSessions = exerciseWorkouts.slice(0, 5);
    const recentWeights = recentSessions.map(w => {
      const ex = w.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
      return ex?.sets?.length > 0 ? Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0)) : 0;
    });

    const trend = recentWeights.length >= 2 &&
                  recentWeights[0] > recentWeights[recentWeights.length - 1]
                  ? 'increasing' : 'stable';

    return {
      success: true,
      stats: {
        exerciseName,
        totalSessions: exerciseWorkouts.length,
        totalSets,
        totalVolume: Math.round(totalVolume),
        maxWeight,
        maxReps,
        maxVolume,
        trend,
        lastPerformed: exerciseWorkouts[0].date,
        recentWeights,
      },
    };
  } catch (error) {
    console.error('❌ getExerciseStats error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Recommend exercises based on training history
 */
export async function recommendExercises({ userId, goal, limit = 5 }) {
  try {
    const allExercises = getAllExercises();
    const workouts = await WorkoutSyncService.getAllWorkouts(50);

    // Find which exercises user has done
    const performedExercises = new Set();
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        performedExercises.add(ex.name.toLowerCase());
      });
    });

    // Find muscle groups that are undertrained
    const muscleGroupCount = {};
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        const muscle = ex.primaryMuscles?.[0] || ex.muscleGroup || 'Unknown';
        muscleGroupCount[muscle] = (muscleGroupCount[muscle] || 0) + 1;
      });
    });

    // Find least trained muscle groups
    const muscleEntries = Object.entries(muscleGroupCount);
    const undertrainedMuscles = muscleEntries
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    // Recommend exercises for undertrained muscles that user hasn't done
    const recommendations = allExercises.filter(ex => {
      const notPerformed = !performedExercises.has(ex.name.toLowerCase());
      const targetsWeakArea = ex.primaryMuscles?.some(m =>
        undertrainedMuscles.includes(m)
      );

      return notPerformed && targetsWeakArea;
    }).slice(0, limit);

    return {
      success: true,
      recommendations: recommendations.map(ex => ({
        name: ex.name,
        equipment: ex.equipment,
        primaryMuscles: ex.primaryMuscles,
        difficulty: ex.difficulty,
        reason: `Targets ${ex.primaryMuscles?.[0]} (undertrained muscle group)`,
      })),
      undertrainedMuscles,
    };
  } catch (error) {
    console.error('❌ recommendExercises error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export tool schemas for Gemini function calling
export const exerciseToolSchemas = [
  {
    name: 'searchExercises',
    description: 'Search for exercises by name, muscle group, equipment, or difficulty. Use when user asks to find/search exercises.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (exercise name or keyword)',
        },
        muscleGroup: {
          type: 'string',
          description: 'Filter by muscle group (e.g., "chest", "back")',
        },
        equipment: {
          type: 'string',
          description: 'Filter by equipment (e.g., "barbell", "dumbbell")',
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Filter by difficulty level',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
    },
  },
  {
    name: 'getExerciseInfo',
    description: 'Get detailed information about a specific exercise including form tips and instructions. Use when user asks about how to perform an exercise.',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise',
        },
      },
      required: ['exerciseName'],
    },
  },
  {
    name: 'getExerciseStats',
    description: 'Get user personal records and statistics for a specific exercise. Use when user asks about their performance or history with an exercise.',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 90)',
        },
      },
      required: ['exerciseName', 'userId'],
    },
  },
  {
    name: 'recommendExercises',
    description: 'Recommend new exercises based on user training history and goals. Use when user asks for exercise recommendations or what to try next.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        goal: {
          type: 'string',
          description: 'Training goal (strength, hypertrophy, endurance)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of recommendations (default: 5)',
        },
      },
      required: ['userId'],
    },
  },
];
