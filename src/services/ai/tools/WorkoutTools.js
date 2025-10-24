/**
 * WorkoutTools - AI tools for workout generation and planning
 */

import WorkoutSyncService from '../../backend/WorkoutSyncService';
import { getAllExercises } from '../../../data/exerciseDatabase';

/**
 * Generate a complete workout plan
 * Used when user asks: "Create a push workout", "Plan a leg day", etc.
 */
export async function generateWorkoutPlan({ muscleGroups, experienceLevel, duration, goal, equipment }) {
  try {
    // Get available exercises
    const allExercises = getAllExercises();

    // Filter exercises by muscle groups and equipment
    let availableExercises = allExercises.filter(ex => {
      // Check muscle groups (case-insensitive, flexible matching)
      const matchesMuscle = muscleGroups.some(mg => {
        const mgLower = mg.toLowerCase();
        return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
               ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
               ex.muscleGroup?.toLowerCase().includes(mgLower);
      });

      // Check equipment if specified (equipment field is comma-separated string)
      const matchesEquipment = !equipment || equipment.length === 0 ||
        equipment.some(eq => {
          const equipmentStr = ex.equipment?.toLowerCase() || '';
          return equipmentStr.includes(eq.toLowerCase());
        });

      return matchesMuscle && matchesEquipment;
    });

    // FALLBACK 1: If no exercises found, try without equipment restriction
    if (availableExercises.length === 0 && equipment && equipment.length > 0) {
      console.log('⚠️ No exercises with specified equipment, trying without equipment filter...');
      availableExercises = allExercises.filter(ex => {
        const matchesMuscle = muscleGroups.some(mg => {
          const mgLower = mg.toLowerCase();
          return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
                 ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
                 ex.muscleGroup?.toLowerCase().includes(mgLower);
        });
        return matchesMuscle;
      });
    }

    // FALLBACK 2: If still no exercises, broaden muscle group search
    if (availableExercises.length === 0) {
      console.log('⚠️ No exercises found, trying broader muscle groups...');
      // Map common variations
      const broadMuscleGroups = muscleGroups.flatMap(mg => {
        const mgLower = mg.toLowerCase();
        if (mgLower.includes('chest')) return ['chest', 'pectorals', 'pecs'];
        if (mgLower.includes('tricep')) return ['triceps', 'arms'];
        if (mgLower.includes('bicep')) return ['biceps', 'arms'];
        if (mgLower.includes('back')) return ['back', 'lats', 'traps'];
        if (mgLower.includes('shoulder')) return ['shoulders', 'deltoids', 'delts'];
        if (mgLower.includes('leg')) return ['legs', 'quadriceps', 'hamstrings', 'glutes'];
        return [mg];
      });

      availableExercises = allExercises.filter(ex => {
        return broadMuscleGroups.some(mg => {
          const mgLower = mg.toLowerCase();
          return ex.primaryMuscles?.some(pm => pm.toLowerCase().includes(mgLower)) ||
                 ex.secondaryMuscles?.some(sm => sm.toLowerCase().includes(mgLower)) ||
                 ex.muscleGroup?.toLowerCase().includes(mgLower) ||
                 ex.name?.toLowerCase().includes(mgLower);
        });
      });
    }

    // If STILL no exercises, return error
    if (availableExercises.length === 0) {
      return {
        success: false,
        error: `No exercises found for muscle groups: ${muscleGroups.join(', ')}. Database may need updating.`
      };
    }

    console.log(`✅ Found ${availableExercises.length} exercises matching criteria`);

    // Determine exercise count based on duration
    let exerciseCount;
    if (duration <= 30) exerciseCount = 4;
    else if (duration <= 45) exerciseCount = 5;
    else if (duration <= 60) exerciseCount = 6;
    else exerciseCount = 7;

    // Select exercises (smart selection based on goal)
    const selectedExercises = smartSelectExercises(
      availableExercises,
      exerciseCount,
      muscleGroups,
      goal
    );

    // Generate set/rep scheme based on goal
    const workoutExercises = selectedExercises.map(exercise => {
      const { sets, reps, restTime } = generateSetScheme(goal, experienceLevel);

      return {
        name: exercise.name,
        equipment: exercise.equipment,
        muscleGroup: exercise.primaryMuscles?.[0] || 'General',
        sets: sets,
        reps: reps,
        restTime: restTime,
        // Keep instructions short - just first sentence
        instructions: exercise.instructions?.split('.')[0] + '.' || '',
      };
    });

    return {
      success: true,
      workout: {
        title: generateWorkoutTitle(muscleGroups, goal),
        muscleGroups,
        goal,
        estimatedDuration: duration,
        exercises: workoutExercises,
        totalExercises: workoutExercises.length,
      }
    };
  } catch (error) {
    console.error('❌ generateWorkoutPlan error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Smart exercise selection algorithm
 * Prioritizes compound movements, balances muscle groups
 */
function smartSelectExercises(exercises, count, muscleGroups, goal) {
  const selected = [];
  const usedEquipment = new Set();

  // Prioritize compound movements for first exercises
  const compound = exercises.filter(ex =>
    ex.equipment === 'barbell' || ex.name.toLowerCase().includes('squat') ||
    ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('press')
  );

  const isolation = exercises.filter(ex => !compound.includes(ex));

  // Strategy based on goal
  if (goal === 'strength') {
    // More compound, fewer reps
    const compoundCount = Math.ceil(count * 0.7);
    selected.push(...compound.slice(0, compoundCount));
    selected.push(...isolation.slice(0, count - compoundCount));
  } else if (goal === 'hypertrophy') {
    // Balanced compound and isolation
    const compoundCount = Math.ceil(count * 0.5);
    selected.push(...compound.slice(0, compoundCount));
    selected.push(...isolation.slice(0, count - compoundCount));
  } else if (goal === 'endurance') {
    // More variety, more isolation
    const compoundCount = Math.ceil(count * 0.3);
    selected.push(...compound.slice(0, compoundCount));
    selected.push(...isolation.slice(0, count - compoundCount));
  } else {
    // General: balanced approach
    const compoundCount = Math.ceil(count * 0.5);
    selected.push(...compound.slice(0, compoundCount));
    selected.push(...isolation.slice(0, count - compoundCount));
  }

  // Shuffle isolation exercises for variety
  const finalSelection = selected.slice(0, count);

  return finalSelection;
}

/**
 * Generate set/rep scheme based on goal
 */
function generateSetScheme(goal, experienceLevel) {
  const schemes = {
    strength: {
      beginner: { sets: 3, reps: '5-6', restTime: 180 },
      intermediate: { sets: 4, reps: '4-6', restTime: 180 },
      advanced: { sets: 5, reps: '3-5', restTime: 240 },
    },
    hypertrophy: {
      beginner: { sets: 3, reps: '8-10', restTime: 90 },
      intermediate: { sets: 4, reps: '8-12', restTime: 90 },
      advanced: { sets: 4, reps: '8-12', restTime: 60 },
    },
    endurance: {
      beginner: { sets: 2, reps: '12-15', restTime: 60 },
      intermediate: { sets: 3, reps: '15-20', restTime: 45 },
      advanced: { sets: 3, reps: '20-25', restTime: 30 },
    },
    general: {
      beginner: { sets: 3, reps: '8-10', restTime: 90 },
      intermediate: { sets: 3, reps: '8-12', restTime: 75 },
      advanced: { sets: 4, reps: '8-12', restTime: 60 },
    },
  };

  const goalSchemes = schemes[goal] || schemes.general;
  return goalSchemes[experienceLevel] || goalSchemes.intermediate;
}

/**
 * Generate workout title
 */
function generateWorkoutTitle(muscleGroups, goal) {
  const muscleStr = muscleGroups.join(' + ');
  const goalStr = goal === 'strength' ? 'Strength' :
                  goal === 'hypertrophy' ? 'Hypertrophy' :
                  goal === 'endurance' ? 'Endurance' : '';

  return `${muscleStr} ${goalStr}`.trim();
}

/**
 * GENERATE WORKOUT PROGRAM (Multiple Workouts - Full Program)
 * User says: "Create 4-day program" or "Make PPL program"
 */
export async function generateWorkoutProgram({ days, muscleGroups, experienceLevel, goal }) {
  try {
    console.log('📋 Generating program:', { days, muscleGroups, experienceLevel, goal });

    const programDays = parseInt(days) || 4;
    const workouts = [];

    // Common program splits based on days
    const programSplits = {
      3: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
      ],
      4: [
        { name: 'Upper', groups: ['chest', 'back', 'shoulders', 'arms'] },
        { name: 'Lower', groups: ['legs'] },
        { name: 'Upper', groups: ['chest', 'back', 'shoulders', 'arms'] },
        { name: 'Lower', groups: ['legs'] },
      ],
      5: [
        { name: 'Chest', groups: ['chest'] },
        { name: 'Back', groups: ['back'] },
        { name: 'Legs', groups: ['legs'] },
        { name: 'Shoulders', groups: ['shoulders'] },
        { name: 'Arms', groups: ['biceps', 'triceps'] },
      ],
      6: [
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
        { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
        { name: 'Pull', groups: ['back', 'biceps'] },
        { name: 'Legs', groups: ['legs'] },
      ],
    };

    // Use the split or create custom
    const split = programSplits[programDays] || programSplits[4];

    // Generate each workout in the program
    for (let i = 0; i < programDays; i++) {
      const dayConfig = split[i % split.length];
      const workout = await generateWorkoutPlan({
        muscleGroups: dayConfig.groups,
        experienceLevel,
        goal,
        duration: 60,
      });

      if (workout.success) {
        workouts.push({
          dayNumber: i + 1,
          dayName: `Day ${i + 1}: ${dayConfig.name}`,
          name: dayConfig.name,
          exercises: workout.workout.exercises,
          muscleGroups: dayConfig.groups,
        });
      }
    }

    return {
      success: true,
      program: {
        title: `${programDays}-Day ${goal || 'General'} Program`,
        days: programDays,
        workouts,
        goal: goal || 'general',
        experienceLevel: experienceLevel || 'intermediate',
        totalWorkouts: workouts.length,
      },
    };
  } catch (error) {
    console.error('❌ generateWorkoutProgram error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Find exercise alternatives
 */
export async function findExerciseAlternatives({ exerciseName, equipment, muscleGroup }) {
  try {
    const allExercises = getAllExercises();

    // Find the original exercise
    const original = allExercises.find(ex =>
      ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    if (!original) {
      return {
        success: false,
        error: 'Original exercise not found'
      };
    }

    // Find alternatives targeting same muscles
    const targetMuscles = original.primaryMuscles || [muscleGroup];

    const alternatives = allExercises.filter(ex => {
      if (ex.name === original.name) return false;

      // Match primary muscles
      const matchesMuscles = targetMuscles.some(muscle =>
        ex.primaryMuscles?.includes(muscle)
      );

      // Match equipment if specified
      const matchesEquipment = !equipment || ex.equipment === equipment;

      return matchesMuscles && matchesEquipment;
    }).slice(0, 5); // Top 5 alternatives

    return {
      success: true,
      original: original.name,
      alternatives: alternatives.map(ex => ({
        name: ex.name,
        equipment: ex.equipment,
        muscles: ex.primaryMuscles,
        difficulty: ex.difficulty,
      }))
    };
  } catch (error) {
    console.error('❌ findExerciseAlternatives error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get workout history analysis
 */
export async function analyzeWorkoutHistory({ userId, days = 30 }) {
  try {
    const workouts = await WorkoutSyncService.getAllWorkouts(100);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        analysis: {
          totalWorkouts: 0,
          message: 'No workout history found'
        }
      };
    }

    // Filter to recent workouts
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentWorkouts = workouts.filter(w =>
      new Date(w.date) >= cutoffDate
    );

    // Calculate stats
    const totalWorkouts = recentWorkouts.length;
    const totalVolume = recentWorkouts.reduce((sum, w) => {
      return sum + (w.exercises || []).reduce((exSum, ex) => {
        return exSum + (ex.sets || []).reduce((setSum, set) => {
          return setSum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0);
      }, 0);
    }, 0);

    // Count muscle group frequency
    const muscleGroupCount = {};
    recentWorkouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const muscle = ex.primaryMuscles?.[0] || ex.muscleGroup || 'Unknown';
        muscleGroupCount[muscle] = (muscleGroupCount[muscle] || 0) + 1;
      });
    });

    // Find most/least trained
    const muscleEntries = Object.entries(muscleGroupCount);
    const mostTrained = muscleEntries.sort((a, b) => b[1] - a[1])[0];
    const leastTrained = muscleEntries.sort((a, b) => a[1] - b[1])[0];

    return {
      success: true,
      analysis: {
        totalWorkouts,
        totalVolume: Math.round(totalVolume),
        avgWorkoutsPerWeek: (totalWorkouts / (days / 7)).toFixed(1),
        muscleGroupBreakdown: muscleGroupCount,
        mostTrained: mostTrained ? mostTrained[0] : 'N/A',
        leastTrained: leastTrained ? leastTrained[0] : 'N/A',
        frequency: totalWorkouts / days,
      }
    };
  } catch (error) {
    console.error('❌ analyzeWorkoutHistory error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export tool schemas for Gemini function calling
export const workoutToolSchemas = [
  {
    name: 'generateWorkoutProgram',
    description: 'Generate a FULL PROGRAM with multiple workouts (e.g., 4-day, 6-day PPL). Use when user asks to create a PROGRAM or multiple workouts. Returns complete program with all workouts.',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days per week (e.g., 3, 4, 5, 6)',
        },
        muscleGroups: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional specific muscle focus. If empty, creates balanced split.',
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level',
        },
        goal: {
          type: 'string',
          enum: ['strength', 'hypertrophy', 'endurance', 'general'],
          description: 'Training goal',
        },
      },
      required: ['days'],
    },
  },
  {
    name: 'generateWorkoutPlan',
    description: 'Generate a SINGLE workout (not a program). Use this when user asks to create ONE workout for today or a specific session.',
    parameters: {
      type: 'object',
      properties: {
        muscleGroups: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target muscle groups (e.g., ["chest", "triceps"])',
        },
        experienceLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'User experience level',
        },
        duration: {
          type: 'number',
          description: 'Workout duration in minutes',
        },
        goal: {
          type: 'string',
          enum: ['strength', 'hypertrophy', 'endurance', 'general'],
          description: 'Training goal',
        },
        equipment: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available equipment (e.g., ["barbell", "dumbbell"])',
        },
      },
      required: ['muscleGroups'],
    },
  },
  {
    name: 'findExerciseAlternatives',
    description: 'Find alternative exercises that target the same muscles. Use when user asks for substitutes or alternatives.',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise to find alternatives for',
        },
        equipment: {
          type: 'string',
          description: 'Preferred equipment (optional)',
        },
        muscleGroup: {
          type: 'string',
          description: 'Target muscle group',
        },
      },
      required: ['exerciseName'],
    },
  },
  {
    name: 'analyzeWorkoutHistory',
    description: 'Analyze user workout history to identify patterns, frequency, volume, and muscle group balance. Use when user asks about their training history or patterns.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 30)',
        },
      },
      required: ['userId'],
    },
  },
];
