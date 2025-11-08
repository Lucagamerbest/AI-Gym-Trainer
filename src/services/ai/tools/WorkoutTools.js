/**
 * WorkoutTools - AI tools for workout generation and planning
 * Updated with 2024 exercise science research (Jeff Nippard, EMG studies, meta-analyses)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutSyncService from '../../backend/WorkoutSyncService';
import { getAllExercises } from '../../../data/exerciseDatabase';
import { getUserProfile } from '../../userProfileService';
import { generateWorkoutWithAI } from './AIWorkoutGenerator';

/**
 * Exercises to NEVER generate (proven suboptimal for bodybuilding)
 */
const EXCLUDED_EXERCISES = [
  'decline bench press',
  'decline dumbbell bench press',
  'decline barbell bench press',
  'decline press',
  'decline chest press',
  'decline flyes',
  'decline dumbbell flyes',
];

/**
 * Filter to exclude suboptimal exercises
 */
function filterExcludedExercises(exercises) {
  return exercises.filter(ex => {
    const nameLower = ex.name.toLowerCase();
    return !EXCLUDED_EXERCISES.some(excluded => nameLower.includes(excluded));
  });
}

/**
 * Generate a complete workout plan using AI
 * Used when user asks: "Create a push workout", "Plan a leg day", etc.
 *
 * NOW USES SCIENTIFIC AI GENERATOR WITH EVIDENCE-BASED PRINCIPLES
 */
export async function generateWorkoutPlan({ muscleGroups, experienceLevel, duration, goal, equipment, userId }) {
  try {
    console.log(`🤖 [WorkoutTools] Using NEW AI Generator with scientific principles`);
    console.log(`🔍 [WorkoutTools] Received userId: ${userId}`);

    // Fetch full user profile for AI generator
    let userProfile = {
      experienceLevel: experienceLevel || 'intermediate',
      sessionDuration: duration || 60,
      primaryGoal: goal ? [goal] : ['build-muscle'],
      equipmentAccess: equipment || [],
      dislikedExercises: [],
      favoriteExercises: [],
      workoutStyle: 'bodybuilding', // Default
      currentPain: [],
    };

    if (userId && userId !== 'guest') {
      try {
        const fetchedProfile = await getUserProfile(userId);
        if (fetchedProfile) {
          console.log(`✅ [WorkoutTools] User profile fetched successfully`);
          userProfile = {
            ...userProfile,
            ...fetchedProfile, // Merge with fetched profile
          };

          if (userProfile.dislikedExercises?.length > 0) {
            console.log(`🚫 Blacklisted exercises: ${userProfile.dislikedExercises.join(', ')}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch user profile:', error);
      }
    }

    // Determine workout type from muscle groups
    const workoutType = muscleGroups[0]?.toLowerCase() || 'full_body';
    console.log(`🎯 [WorkoutTools] Workout type: ${workoutType}`);

    // Generate random variation index (0-5) for workout variety
    // 6 different variation strategies to ensure diverse workouts
    const variationIndex = Math.floor(Math.random() * 6);
    console.log(`🎲 [WorkoutTools] Using variation index: ${variationIndex} (1-6)`);

    // Call NEW AI Generator with scientific principles
    const aiResult = await generateWorkoutWithAI({
      workoutType,
      userProfile,
      variationIndex,
    });

    if (!aiResult.success) {
      console.error(`❌ [WorkoutTools] AI generation failed:`, aiResult.error);
      return {
        success: false,
        error: aiResult.error || 'AI workout generation failed',
      };
    }

    // Convert AI workout format to expected format
    const workout = aiResult.workout;
    const workoutExercises = workout.exercises.map(ex => ({
      name: ex.name,
      equipment: ex.equipment,
      muscleGroup: ex.primaryMuscles?.[0] || workoutType,
      sets: ex.sets,
      reps: ex.reps,
      restTime: ex.restPeriod,
      instructions: ex.notes || '',
    }));

    console.log(`✅ [WorkoutTools] AI generated ${workoutExercises.length} exercises`);

    const generatedWorkout = {
      title: workout.name || generateWorkoutTitle(muscleGroups, goal),
      muscleGroups,
      goal,
      estimatedDuration: duration,
      exercises: workoutExercises,
      totalExercises: workoutExercises.length,
      generatedBy: 'Scientific AI',
      generatedAt: workout.generatedAt,
    };

    // Store as last generated workout for replace function
    try {
      await AsyncStorage.setItem('@last_generated_workout', JSON.stringify(generatedWorkout));
      console.log('💾 [WorkoutTools] Stored last generated workout for replacement');
    } catch (storageError) {
      console.warn('⚠️ [WorkoutTools] Failed to store workout for replacement:', storageError);
      // Don't fail the whole operation if storage fails
    }

    return {
      success: true,
      workout: generatedWorkout
    };

  } catch (error) {
    console.error('❌ generateWorkoutPlan error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function for workout title
function generateWorkoutTitle(muscleGroups, goal) {
  const muscleStr = muscleGroups.join(' + ');
  return goal ? `${muscleStr} (${goal})` : muscleStr;
}

/**
 * Generate a multi-day workout program (week-long split)
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

    let alternatives = allExercises.filter(ex => {
      if (ex.name === original.name) return false;

      // Match primary muscles
      const matchesMuscles = targetMuscles.some(muscle =>
        ex.primaryMuscles?.includes(muscle)
      );

      // Match equipment if specified
      const matchesEquipment = !equipment || ex.equipment === equipment;

      return matchesMuscles && matchesEquipment;
    });

    // Filter out excluded exercises
    alternatives = filterExcludedExercises(alternatives);

    // Top 5 alternatives
    alternatives = alternatives.slice(0, 5);

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
 * Replace an exercise in active or planned workout (ONE-SHOT)
 * Combines find alternative + replace into a single fluid action
 */
export async function replaceExerciseInWorkout({
  oldExerciseName,
  newExerciseName,
  workoutType = 'active', // 'active' or 'planned'
  equipment,
  userId
}) {
  try {
    const allExercises = getAllExercises();

    // Equipment keywords for parsing
    const equipmentKeywords = [
      'cable', 'dumbbell', 'barbell', 'machine', 'smith machine',
      'ez bar', 'band', 'bodyweight', 'kettlebell', 'trap bar'
    ];

    // Step 1: Parse equipment from old exercise name
    // Example: "Machine Chest Press" → baseName="Chest Press", equipment="Machine"
    let oldExerciseBaseName = oldExerciseName.toLowerCase();
    let oldExerciseEquipment = null;

    for (const eq of equipmentKeywords) {
      if (oldExerciseBaseName.includes(eq)) {
        oldExerciseEquipment = eq;
        oldExerciseBaseName = oldExerciseBaseName
          .replace(eq, '')
          .trim()
          .replace(/\s+/g, ' ');
        break;
      }
    }

    // Step 1b: Find the old exercise in database (by base name)
    const oldExercise = allExercises.find(ex => {
      const exNameLower = ex.name.toLowerCase();
      // Try exact match first
      if (exNameLower === oldExerciseName.toLowerCase()) return true;
      // Try base name match
      if (exNameLower === oldExerciseBaseName) return true;
      // Try if database name contains the search term
      if (exNameLower.includes(oldExerciseBaseName)) return true;
      return false;
    });

    if (!oldExercise) {
      return {
        success: false,
        error: `Exercise "${oldExerciseName}" not found in database`
      };
    }

    console.log(`✅ Found old exercise: "${oldExercise.name}" (parsed from "${oldExerciseName}")`);

    let newExercise;
    let requestedEquipment = equipment;

    // Step 2: Get the new exercise (either specified or auto-select best alternative)
    if (newExerciseName) {
      // User specified exact replacement

      // SMART MATCHING: Try to extract equipment from exercise name
      // Example: "Cable Lateral Raise" → exercise="Lateral Raise", equipment="Cable"
      const equipmentKeywords = [
        'cable', 'dumbbell', 'barbell', 'machine', 'smith machine',
        'ez bar', 'band', 'bodyweight', 'kettlebell', 'trap bar'
      ];

      let parsedExerciseName = newExerciseName.toLowerCase();
      let parsedEquipment = null;

      // Check if exercise name contains equipment keyword
      for (const eq of equipmentKeywords) {
        if (parsedExerciseName.includes(eq)) {
          parsedEquipment = eq;
          // Remove equipment from name to get base exercise
          parsedExerciseName = parsedExerciseName
            .replace(eq, '')
            .trim()
            .replace(/\s+/g, ' '); // normalize spaces
          break;
        }
      }

      // Normalize for matching: handle hyphens, spaces, plurals
      const normalize = (str) => str.toLowerCase()
        .replace(/[-\s]/g, '') // Remove hyphens and spaces
        .replace(/s$/i, '');    // Remove trailing 's'

      const normalizedSearch = normalize(newExerciseName);

      // Try exact match first
      newExercise = allExercises.find(ex =>
        ex.name.toLowerCase() === newExerciseName.toLowerCase()
      );

      // Try normalized match (handles "push up" vs "push-ups")
      if (!newExercise) {
        newExercise = allExercises.find(ex =>
          normalize(ex.name) === normalizedSearch
        );
      }

      // If no exact match, try with parsed equipment
      if (!newExercise && parsedEquipment) {
        newExercise = allExercises.find(ex => {
          const nameMatches = ex.name.toLowerCase() === parsedExerciseName;
          const equipmentStr = ex.equipment?.toLowerCase() || '';
          const equipmentMatches = equipmentStr.includes(parsedEquipment);
          return nameMatches && equipmentMatches;
        });

        // If found, determine the specific equipment variant to use
        if (newExercise) {
          // Match the specific variant from the equipment string
          // Example: equipment="Dumbbell, Cable Single, Cable Both" and parsedEquipment="cable"
          // Should use "Cable Single" or "Cable Both"
          const equipmentList = newExercise.equipment.split(',').map(e => e.trim());
          const matchingVariant = equipmentList.find(eq =>
            eq.toLowerCase().includes(parsedEquipment)
          );
          requestedEquipment = matchingVariant || parsedEquipment;
        }
      }

      // Still no match? Try fuzzy matching on base name
      if (!newExercise) {
        newExercise = allExercises.find(ex => {
          const exerciseNameLower = ex.name.toLowerCase();
          // Check if the parsed name is contained in the exercise name
          return exerciseNameLower.includes(parsedExerciseName) ||
                 parsedExerciseName.includes(exerciseNameLower);
        });

        if (newExercise && parsedEquipment) {
          // Verify equipment is available
          if (newExercise.equipment?.toLowerCase().includes(parsedEquipment)) {
            requestedEquipment = parsedEquipment;
          }
        }
      }

      if (!newExercise) {
        return {
          success: false,
          error: `Replacement exercise "${newExerciseName}" not found`
        };
      }
    } else {
      // Auto-select best alternative
      const targetMuscles = oldExercise.primaryMuscles || [];
      let alternatives = allExercises.filter(ex => {
        if (ex.name === oldExercise.name) return false;
        const matchesMuscles = targetMuscles.some(muscle =>
          ex.primaryMuscles?.includes(muscle)
        );
        const matchesEquipment = !equipment || ex.equipment?.toLowerCase() === equipment.toLowerCase();
        return matchesMuscles && matchesEquipment;
      });

      // Filter out excluded exercises
      alternatives = filterExcludedExercises(alternatives);

      if (alternatives.length === 0) {
        return {
          success: false,
          error: `No suitable alternatives found for "${oldExerciseName}"`
        };
      }

      // Pick the first (best) alternative
      newExercise = alternatives[0];
    }

    // Step 3: Replace in workout
    // Try last generated workout first (before starting), then active workout
    let workoutData = null;
    let workoutKey = null;
    let isLastGenerated = false;

    // Check last generated workout first
    const lastGeneratedStr = await AsyncStorage.getItem('@last_generated_workout');
    if (lastGeneratedStr) {
      workoutData = JSON.parse(lastGeneratedStr);
      workoutKey = '@last_generated_workout';
      isLastGenerated = true;
      console.log('🔄 [Replace] Using last generated workout');
    }

    // If no last generated, try active workout
    if (!workoutData && workoutType === 'active') {
      const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
      if (activeWorkoutStr) {
        workoutData = JSON.parse(activeWorkoutStr);
        workoutKey = '@active_workout';
        console.log('🔄 [Replace] Using active workout');
      }
    }

    if (!workoutData) {
      return {
        success: false,
        error: "No workout found. Generate or start a workout first."
      };
    }

    const activeWorkout = workoutData;

      // SMART MATCHING: Find exercise in workout
      // Try exact match first
      let exerciseIndex = activeWorkout.exercises?.findIndex(ex =>
        ex.name.toLowerCase() === oldExerciseName.toLowerCase()
      );

      // If no exact match, try partial match (e.g., "bench press" matches "Barbell Bench Press")
      if (exerciseIndex === -1) {
        const searchTerm = oldExerciseName.toLowerCase();
        const matches = activeWorkout.exercises
          .map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => ex.name.toLowerCase().includes(searchTerm));

        if (matches.length === 1) {
          // Only ONE match found - use it!
          exerciseIndex = matches[0].idx;
          console.log(`✅ Smart match: "${oldExerciseName}" → "${matches[0].ex.name}"`);
        } else if (matches.length > 1) {
          // Multiple matches - return structured data for UI to create quick reply buttons
          const matchNames = matches.map(m => m.ex.name);
          return {
            success: false,
            error: `"${oldExerciseName}" matches multiple exercises. Which one did you mean?`,
            matches: matchNames, // Array of exercise names for quick reply buttons
            clarificationNeeded: true,
            originalRequest: oldExerciseName,
            newExercise: newExerciseName
          };
        }
      }

      if (exerciseIndex === -1) {
        return {
          success: false,
          error: `"${oldExerciseName}" not found in active workout`
        };
      }

      // Replace exercise while keeping sets data
      const oldExerciseData = activeWorkout.exercises[exerciseIndex];

      // Use requested equipment if specified, otherwise use first available
      let finalEquipment = requestedEquipment || equipment;
      if (!finalEquipment && newExercise.equipment) {
        // Use first equipment from the exercise's equipment list
        const equipmentList = newExercise.equipment.split(',').map(e => e.trim());
        finalEquipment = equipmentList[0];
      }

      // Build full exercise name with equipment (matching new format)
      let fullExerciseName = newExercise.name;
      if (finalEquipment) {
        const equipmentNormalized = finalEquipment.charAt(0).toUpperCase() + finalEquipment.slice(1).toLowerCase();
        const nameLower = fullExerciseName.toLowerCase();
        const equipLower = equipmentNormalized.toLowerCase();

        // Only add equipment if not already in name
        if (!nameLower.includes(equipLower)) {
          fullExerciseName = `${equipmentNormalized} ${fullExerciseName}`;
        }
      }

      activeWorkout.exercises[exerciseIndex] = {
        ...oldExerciseData,
        name: fullExerciseName, // Now includes equipment!
        equipment: finalEquipment || newExercise.equipment,
        primaryMuscles: newExercise.primaryMuscles,
        secondaryMuscles: newExercise.secondaryMuscles,
        instructions: newExercise.instructions,
      };

      await AsyncStorage.setItem(workoutKey, JSON.stringify(activeWorkout));

      const displayName = fullExerciseName;
      const workoutTypeMsg = isLastGenerated ? "generated workout" : "active workout";

      return {
        success: true,
        message: `Replaced "${oldExerciseName}" with "${displayName}" in ${workoutTypeMsg}`,
        oldExercise: oldExerciseName,
        newExercise: displayName,
        workout: activeWorkout // Return updated workout so modal can refresh
      };

  } catch (error) {
    console.error('❌ replaceExerciseInWorkout error:', error);
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

/**
 * INTELLIGENT WORKOUT RECOMMENDATION
 * Analyzes user data to recommend what to train today
 * Based on: muscle balance, active programs, recovery, and performance trends
 */
export async function recommendTodaysWorkout({ userId }) {
  try {
    console.log('🧠 Analyzing workout history for intelligent recommendation...');

    // Get recent workouts (last 30 days)
    const workouts = await WorkoutSyncService.getAllWorkouts(100);
    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        recommendation: {
          suggested: 'Full Body',
          reason: 'No workout history found. Start with a balanced full body workout.',
          muscleGroups: ['chest', 'back', 'legs'],
          restDayRecommended: false,
        }
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const last30DaysWorkouts = workouts.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const last7DaysWorkouts = workouts.filter(w => new Date(w.date) >= sevenDaysAgo);

    // ANALYSIS 1: Check what was trained yesterday
    const yesterdaysWorkout = workouts.find(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === yesterday.toDateString();
    });

    // ANALYSIS 2: Muscle Group Balance (last 30 days)
    const muscleGroupCount = {};
    last30DaysWorkouts.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const muscles = ex.primaryMuscles || [ex.muscleGroup] || [];
        muscles.forEach(muscle => {
          if (muscle) {
            const muscleKey = muscle.toLowerCase();
            muscleGroupCount[muscleKey] = (muscleGroupCount[muscleKey] || 0) + 1;
          }
        });
      });
    });

    // Categorize into Push/Pull/Legs
    const pushMuscles = ['chest', 'pectorals', 'pecs', 'shoulders', 'deltoids', 'delts', 'triceps'];
    const pullMuscles = ['back', 'lats', 'traps', 'rhomboids', 'biceps', 'rear deltoids'];
    const legMuscles = ['legs', 'quadriceps', 'quads', 'hamstrings', 'glutes', 'calves'];

    let pushCount = 0, pullCount = 0, legCount = 0;

    Object.entries(muscleGroupCount).forEach(([muscle, count]) => {
      if (pushMuscles.some(pm => muscle.includes(pm))) pushCount += count;
      if (pullMuscles.some(pm => muscle.includes(pm))) pullCount += count;
      if (legMuscles.some(lm => muscle.includes(lm))) legCount += count;
    });

    console.log(`📊 Muscle balance (30 days): Push ${pushCount}, Pull ${pullCount}, Legs ${legCount}`);

    // ANALYSIS 3: Detect workout pattern/program
    const workoutTitles = last7DaysWorkouts.map(w => w.title?.toLowerCase() || '').filter(t => t);
    const isPPLProgram = workoutTitles.some(t => t.includes('push') || t.includes('pull') || t.includes('leg'));
    const isUpperLower = workoutTitles.some(t => t.includes('upper') || t.includes('lower'));

    // ANALYSIS 4: Recovery check (days since last workout)
    const lastWorkout = workouts[0];
    const lastWorkoutDate = lastWorkout ? new Date(lastWorkout.date) : null;
    const daysSinceLastWorkout = lastWorkoutDate ?
      Math.floor((now - lastWorkoutDate) / (1000 * 60 * 60 * 24)) : 999;

    console.log(`📅 Days since last workout: ${daysSinceLastWorkout}`);

    // ANALYSIS 5: Weekly workout frequency
    const weeklyFrequency = last7DaysWorkouts.length;
    console.log(`📈 Weekly frequency: ${weeklyFrequency} workouts`);

    // ============================================================
    // DECISION LOGIC
    // ============================================================

    let recommended = '';
    let reason = '';
    let muscleGroups = [];
    let restDayRecommended = false;

    // Calculate muscle balance percentages
    const total = pushCount + pullCount + legCount;
    const pushPercent = total > 0 ? (pushCount / total * 100).toFixed(0) : 0;
    const pullPercent = total > 0 ? (pullCount / total * 100).toFixed(0) : 0;
    const legPercent = total > 0 ? (legCount / total * 100).toFixed(0) : 0;

    // PRIORITY RULE: Severe muscle imbalance overrides everything (including rest days!)
    // If any muscle group is completely neglected (0%) or severely undertrained (<10%), fix that first
    if (total > 0 && (legCount === 0 || (legCount / total < 0.1))) {
      recommended = 'Legs';
      reason = `Muscle imbalance detected: Legs only ${legPercent}% vs Push ${pushPercent}%. Train Legs to balance.`;
      muscleGroups = ['legs', 'quadriceps', 'hamstrings', 'glutes'];
      // Note: Continue below to add rest day warning if needed
    } else if (total > 0 && (pullCount === 0 || (pullCount / total < 0.1))) {
      recommended = 'Pull';
      reason = `Muscle imbalance detected: Pull only ${pullPercent}% vs Push ${pushPercent}%. Train Pull to balance.`;
      muscleGroups = ['back', 'biceps'];
    } else if (total > 0 && (pushCount === 0 || (pushCount / total < 0.1))) {
      recommended = 'Push';
      reason = `Muscle imbalance detected: Push only ${pushPercent}% vs Pull ${pullPercent}%. Train Push to balance.`;
      muscleGroups = ['chest', 'shoulders', 'triceps'];
    }

    // Rule 1: Rest day needed? (>= 6 workouts this week)
    // Only recommend rest if there's no severe muscle imbalance
    else if (weeklyFrequency >= 6) {
      restDayRecommended = true;
      reason = `You've trained ${weeklyFrequency} times this week. Take a rest day for recovery.`;
      return {
        success: true,
        recommendation: {
          suggested: 'Rest Day',
          reason,
          restDayRecommended: true,
          alternativeWorkout: 'Light cardio or stretching',
        }
      };
    }

    // Rule 2: If following PPL program, recommend next in sequence (only if no severe imbalance)
    else if (!recommended && isPPLProgram && yesterdaysWorkout) {
      const yesterdayTitle = yesterdaysWorkout.title?.toLowerCase() || '';

      if (yesterdayTitle.includes('push')) {
        recommended = 'Pull';
        reason = 'You did Push yesterday. Following PPL sequence, today is Pull day.';
        muscleGroups = ['back', 'biceps'];
      } else if (yesterdayTitle.includes('pull')) {
        recommended = 'Legs';
        reason = 'You did Pull yesterday. Following PPL sequence, today is Leg day.';
        muscleGroups = ['legs'];
      } else if (yesterdayTitle.includes('leg')) {
        if (weeklyFrequency >= 5) {
          restDayRecommended = true;
          recommended = 'Rest Day';
          reason = 'You did Legs yesterday and trained 5+ times this week. Rest day recommended, or start new PPL cycle with Push tomorrow.';
        } else {
          recommended = 'Push';
          reason = 'You did Legs yesterday. Starting new PPL cycle with Push day.';
          muscleGroups = ['chest', 'shoulders', 'triceps'];
        }
      }
    }

    // Rule 3: If following Upper/Lower, recommend next (only if no severe imbalance or PPL)
    else if (!recommended && isUpperLower && yesterdaysWorkout) {
      const yesterdayTitle = yesterdaysWorkout.title?.toLowerCase() || '';

      if (yesterdayTitle.includes('upper')) {
        recommended = 'Lower';
        reason = 'You did Upper yesterday. Following Upper/Lower split, today is Lower day.';
        muscleGroups = ['legs'];
      } else if (yesterdayTitle.includes('lower')) {
        recommended = 'Upper';
        reason = 'You did Lower yesterday. Following Upper/Lower split, today is Upper day.';
        muscleGroups = ['chest', 'back', 'shoulders', 'arms'];
      }
    }

    // Rule 4: Muscle balance - recommend weakest muscle group (only if no recommendation yet)
    else if (!recommended) {
      if (total === 0) {
        recommended = 'Full Body';
        reason = 'Start with a balanced full body workout to assess your baseline.';
        muscleGroups = ['chest', 'back', 'legs'];
      } else {
        // Find least trained muscle group
        const balance = [
          { name: 'Push', count: pushCount, percent: (pushCount / total * 100).toFixed(0) },
          { name: 'Pull', count: pullCount, percent: (pullCount / total * 100).toFixed(0) },
          { name: 'Legs', count: legCount, percent: (legCount / total * 100).toFixed(0) },
        ].sort((a, b) => a.count - b.count);

        const weakest = balance[0];
        const strongest = balance[2];

        // If imbalance is >40% difference, strongly recommend weakest
        if (strongest.count - weakest.count >= total * 0.4) {
          recommended = weakest.name;
          reason = `Muscle imbalance detected: ${weakest.name} only ${weakest.percent}% vs ${strongest.name} ${strongest.percent}%. Train ${weakest.name} to balance.`;

          if (weakest.name === 'Push') muscleGroups = ['chest', 'shoulders', 'triceps'];
          else if (weakest.name === 'Pull') muscleGroups = ['back', 'biceps'];
          else if (weakest.name === 'Legs') muscleGroups = ['legs'];
        }
        // Else recommend based on rest days
        else if (daysSinceLastWorkout >= 2) {
          recommended = 'Full Body';
          reason = `${daysSinceLastWorkout} days since last workout. Jump back in with a full body session.`;
          muscleGroups = ['chest', 'back', 'legs'];
        } else if (daysSinceLastWorkout === 1) {
          recommended = balance[0].name; // Train weakest
          reason = `Muscle balance: ${balance.map(b => `${b.name} ${b.percent}%`).join(', ')}. Train ${balance[0].name} today.`;

          if (balance[0].name === 'Push') muscleGroups = ['chest', 'shoulders', 'triceps'];
          else if (balance[0].name === 'Pull') muscleGroups = ['back', 'biceps'];
          else if (balance[0].name === 'Legs') muscleGroups = ['legs'];
        } else {
          // Worked out today already
          restDayRecommended = true;
          recommended = 'Rest Day';
          reason = 'You already trained today. Rest and recover.';
        }
      }
    }

    // Rule 5: Prevent training same muscle group 2 days in a row (unless program-based)
    if (yesterdaysWorkout && !isPPLProgram && !isUpperLower) {
      const yesterdayMuscles = yesterdaysWorkout.exercises?.flatMap(ex =>
        (ex.primaryMuscles || [ex.muscleGroup] || []).map(m => m?.toLowerCase())
      ) || [];

      const isSameMuscleGroup = muscleGroups.some(mg =>
        yesterdayMuscles.some(ym => ym?.includes(mg) || mg.includes(ym))
      );

      if (isSameMuscleGroup && !restDayRecommended) {
        // Switch to different muscle group
        const alternatives = [
          { name: 'Push', muscles: ['chest', 'shoulders', 'triceps'] },
          { name: 'Pull', muscles: ['back', 'biceps'] },
          { name: 'Legs', muscles: ['legs'] },
        ].filter(alt => !alt.muscles.some(m => yesterdayMuscles.includes(m)));

        if (alternatives.length > 0) {
          const chosen = alternatives[0];
          recommended = chosen.name;
          muscleGroups = chosen.muscles;
          reason = `You trained similar muscles yesterday. Switch to ${chosen.name} for recovery.`;
        }
      }
    }

    // Add rest day warning if training volume is high but muscle imbalance exists
    if (weeklyFrequency >= 6 && recommended && recommended !== 'Rest Day') {
      reason += ` ⚠️ Note: You've trained ${weeklyFrequency} times this week - consider keeping this session light or taking a rest day after.`;
    }

    return {
      success: true,
      recommendation: {
        suggested: recommended,
        reason: reason,
        muscleGroups: muscleGroups,
        restDayRecommended: restDayRecommended,
        analysis: {
          weeklyFrequency,
          daysSinceLastWorkout,
          muscleBalance: {
            push: `${(pushCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
            pull: `${(pullCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
            legs: `${(legCount / (pushCount + pullCount + legCount) * 100 || 0).toFixed(0)}%`,
          },
          programDetected: isPPLProgram ? 'PPL' : isUpperLower ? 'Upper/Lower' : 'None',
        }
      }
    };

  } catch (error) {
    console.error('❌ recommendTodaysWorkout error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export tool schemas for Gemini function calling
export const workoutToolSchemas = [
  {
    name: 'recommendTodaysWorkout',
    description: 'Intelligent workout recommendation based on user history, muscle balance, active programs, and recovery. Use when user asks "What should I train today?" or "What to train today?". Analyzes: 1) Yesterday\'s workout to follow program sequence (PPL/Upper-Lower), 2) 30-day muscle balance to identify weak points, 3) Weekly frequency to suggest rest days, 4) Performance trends.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID to analyze workout history',
        },
      },
      required: ['userId'],
    },
  },
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
        userId: {
          type: 'string',
          description: 'User ID (used to fetch exercise preferences and blacklist)',
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
    name: 'replaceExerciseInWorkout',
    description: 'ONE-SHOT exercise replacement. Instantly replace an exercise in the active workout with a specific exercise OR auto-select best alternative. Use when user says "replace X with Y" or "swap X for Y" or "change X to Y". Fluid single-step replacement - no extra questions needed.',
    parameters: {
      type: 'object',
      properties: {
        oldExerciseName: {
          type: 'string',
          description: 'Name of the exercise to replace (e.g., "Bench Press")',
        },
        newExerciseName: {
          type: 'string',
          description: 'Name of the new exercise (optional - if not provided, auto-selects best alternative)',
        },
        workoutType: {
          type: 'string',
          enum: ['active', 'planned'],
          description: 'Type of workout to modify (default: active)',
        },
        equipment: {
          type: 'string',
          description: 'Preferred equipment for auto-selection (e.g., "dumbbell", "barbell")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['oldExerciseName'],
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
