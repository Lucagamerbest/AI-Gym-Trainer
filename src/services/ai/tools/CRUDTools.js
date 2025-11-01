/**
 * CRUDTools - AI tools for Create, Read, Update, Delete operations
 *
 * These tools allow the AI to actually MODIFY user data, not just answer questions.
 * Users can say "Add bench press" and the AI will DO it.
 */

import WorkoutSyncService from '../../backend/WorkoutSyncService';
import MealSyncService from '../../backend/MealSyncService';
import { WorkoutStorageService } from '../../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ADD EXERCISE TO CURRENT/PLANNED WORKOUT
 * User says: "Add bench press to my workout"
 */
export async function addExerciseToWorkout({ exerciseName, sets = 3, reps = '8-12', userId }) {
  try {
    console.log('➕ Adding exercise to workout:', { exerciseName, sets, reps, userId });

    // Get current active workout (if user is in a workout)
    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout found. User needs to start a workout first.",
        action: 'navigate_to_start_workout',
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    // Create exercise object
    const newExercise = {
      name: exerciseName,
      sets: Array(sets).fill({ weight: '', reps: reps, completed: false }),
      equipment: 'Unknown', // Could enhance with exercise database lookup
      muscleGroup: 'Unknown',
    };

    // Add to workout
    activeWorkout.exercises = activeWorkout.exercises || [];
    activeWorkout.exercises.push(newExercise);

    // Save back
    await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

    return {
      success: true,
      message: `Added ${exerciseName} to your workout (${sets} sets × ${reps} reps)`,
      data: {
        exerciseName,
        sets,
        reps,
        totalExercises: activeWorkout.exercises.length,
      },
    };
  } catch (error) {
    console.error('❌ addExerciseToWorkout error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't add exercise. Make sure you have an active workout.",
    };
  }
}

/**
 * MODIFY ACTIVE WORKOUT
 * User says: "Remove bench press", "Move squats to position 1", "Reorder leg press after squats"
 *
 * NEW TOOL - Allows removing exercises and reordering during active workout
 */
export async function modifyActiveWorkout({ action, exerciseName, position, userId }) {
  try {
    console.log('🔧 Modifying active workout:', { action, exerciseName, position });

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout found. Start a workout first.",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) {
      return {
        success: false,
        message: "No exercises in the current workout.",
      };
    }

    // REMOVE EXERCISE
    if (action === 'remove_exercise') {
      const exerciseIndex = activeWorkout.exercises.findIndex(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (exerciseIndex === -1) {
        return {
          success: false,
          message: `${exerciseName} not found in current workout.`,
        };
      }

      const removedExercise = activeWorkout.exercises.splice(exerciseIndex, 1)[0];
      await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

      return {
        success: true,
        message: `Removed ${removedExercise.name} from your workout. ${activeWorkout.exercises.length} exercises remaining.`,
        data: {
          removedExercise: removedExercise.name,
          remainingExercises: activeWorkout.exercises.length,
        },
      };
    }

    // REORDER EXERCISE
    if (action === 'reorder_exercise') {
      if (!position || position < 1 || position > activeWorkout.exercises.length) {
        return {
          success: false,
          message: `Invalid position. Must be between 1 and ${activeWorkout.exercises.length}.`,
        };
      }

      const exerciseIndex = activeWorkout.exercises.findIndex(
        ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
      );

      if (exerciseIndex === -1) {
        return {
          success: false,
          message: `${exerciseName} not found in current workout.`,
        };
      }

      // Remove exercise from current position
      const [exercise] = activeWorkout.exercises.splice(exerciseIndex, 1);

      // Insert at new position (position is 1-indexed, array is 0-indexed)
      activeWorkout.exercises.splice(position - 1, 0, exercise);

      await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

      return {
        success: true,
        message: `Moved ${exerciseName} to position ${position}.`,
        data: {
          exerciseName,
          newPosition: position,
          exerciseOrder: activeWorkout.exercises.map(ex => ex.name),
        },
      };
    }

    return {
      success: false,
      message: `Unknown action: ${action}. Use 'remove_exercise' or 'reorder_exercise'.`,
    };

  } catch (error) {
    console.error('❌ modifyActiveWorkout error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * FINISH WORKOUT
 * User says: "I'm done", "Finish workout", "End my workout"
 *
 * NEW TOOL - Complete and save the active workout to history
 */
export async function finishWorkout({ workoutTitle, notes, rating, userId }) {
  try {
    console.log('🏁 Finishing workout:', { workoutTitle, notes, rating });

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout to finish. Start a workout first.",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    // Calculate workout duration
    const startTime = new Date(activeWorkout.startTime || activeWorkout.date);
    const endTime = new Date();
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    // Calculate total volume and sets
    let totalVolume = 0;
    let totalSets = 0;

    if (activeWorkout.exercises && activeWorkout.exercises.length > 0) {
      activeWorkout.exercises.forEach(exercise => {
        if (exercise.sets) {
          exercise.sets.forEach(set => {
            if (set.completed && set.weight && set.reps) {
              const weight = parseFloat(set.weight) || 0;
              const reps = parseInt(set.reps) || 0;
              totalVolume += weight * reps;
              totalSets++;
            }
          });
        }
      });
    }

    // Build workout data for saving
    const workoutData = {
      duration: durationMinutes,
      exercisesCompleted: activeWorkout.exercises?.length || 0,
      exercises: activeWorkout.exercises || [],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalVolume: totalVolume,
      totalSets: totalSets,
      workoutTitle: workoutTitle || activeWorkout.workoutTitle || 'AI Workout',
      workoutType: activeWorkout.workoutType || 'quick',
      notes: notes || '',
      rating: rating || null,
    };

    // Prepare exercise sets in the format expected by WorkoutStorageService
    const exerciseSets = {};
    activeWorkout.exercises?.forEach((exercise, index) => {
      exerciseSets[index] = exercise.sets || [];
    });

    // Save workout to storage
    const saveResult = await WorkoutStorageService.saveWorkout(
      workoutData,
      exerciseSets,
      userId
    );

    if (!saveResult.success) {
      return {
        success: false,
        message: "Failed to save workout. Please try again.",
        error: saveResult.error,
      };
    }

    // Clear active workout
    await AsyncStorage.removeItem(activeWorkoutKey);

    // Build summary message
    let message = `✅ Workout completed! ${durationMinutes} min, ${activeWorkout.exercises?.length || 0} exercises, ${totalSets} sets, ${Math.round(totalVolume)} lbs total volume.`;
    if (rating) message += ` Rating: ${rating}/5`;

    return {
      success: true,
      message,
      data: {
        workoutId: saveResult.workoutId,
        duration: durationMinutes,
        exercisesCompleted: activeWorkout.exercises?.length || 0,
        totalSets,
        totalVolume: Math.round(totalVolume),
        rating,
      },
    };
  } catch (error) {
    console.error('❌ finishWorkout error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't finish workout. Please try again.",
    };
  }
}

/**
 * SKIP TO NEXT EXERCISE
 * User says: "Skip to next exercise", "Move to the next one", "I'm done with this exercise"
 *
 * NEW TOOL - Move to the next exercise in the workout
 */
export async function skipToNextExercise({ userId }) {
  try {
    console.log('⏭️ Skipping to next exercise');

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout found. Start a workout first!",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) {
      return {
        success: false,
        message: "No exercises in the current workout.",
      };
    }

    // Find current exercise (first incomplete one)
    let currentIndex = -1;
    for (let i = 0; i < activeWorkout.exercises.length; i++) {
      const exercise = activeWorkout.exercises[i];
      const sets = exercise.sets || [];
      const completedSets = sets.filter(s => s.completed).length;
      const isComplete = completedSets === sets.length && sets.length > 0;

      if (!isComplete) {
        currentIndex = i;
        break;
      }
    }

    // Check if all exercises are complete
    if (currentIndex === -1) {
      return {
        success: false,
        message: "All exercises are complete! Ready to finish your workout?",
      };
    }

    const currentExercise = activeWorkout.exercises[currentIndex];
    const nextIndex = currentIndex + 1;

    // Check if there's a next exercise
    if (nextIndex >= activeWorkout.exercises.length) {
      return {
        success: false,
        message: `You're on the last exercise (${currentExercise.name}). No more exercises after this!`,
      };
    }

    const nextExercise = activeWorkout.exercises[nextIndex];

    // Store the next exercise index in AsyncStorage
    // The WorkoutScreen can read this and update the UI
    await AsyncStorage.setItem('@ai_current_exercise_index', nextIndex.toString());
    await AsyncStorage.setItem('@ai_skip_trigger', JSON.stringify({
      from: currentExercise.name,
      to: nextExercise.name,
      timestamp: new Date().toISOString(),
    }));

    return {
      success: true,
      message: `⏭️ Skipped to ${nextExercise.name}! (${nextExercise.sets?.length || 0} sets)`,
      data: {
        skippedFrom: currentExercise.name,
        skippedTo: nextExercise.name,
        nextExerciseIndex: nextIndex,
        setsInNextExercise: nextExercise.sets?.length || 0,
      },
    };
  } catch (error) {
    console.error('❌ skipToNextExercise error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't skip to next exercise. Please try again.",
    };
  }
}

/**
 * GET ACTIVE WORKOUT STATUS
 * User says: "How's my workout going?", "What exercise am I on?", "How many sets left?"
 *
 * NEW TOOL - Get current workout progress and status
 */
export async function getActiveWorkoutStatus({ userId }) {
  try {
    console.log('📊 Getting active workout status');

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout found. Start a workout first!",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    // Calculate workout duration
    const startTime = new Date(activeWorkout.startTime || activeWorkout.date);
    const now = new Date();
    const durationMs = now - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    // Calculate progress stats
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    const exerciseProgress = [];

    if (activeWorkout.exercises && activeWorkout.exercises.length > 0) {
      activeWorkout.exercises.forEach((exercise, index) => {
        const sets = exercise.sets || [];
        const completed = sets.filter(s => s.completed).length;

        totalSets += sets.length;
        completedSets += completed;

        // Calculate volume for completed sets
        sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            totalVolume += weight * reps;
          }
        });

        exerciseProgress.push({
          name: exercise.name,
          position: index + 1,
          setsCompleted: completed,
          totalSets: sets.length,
          isComplete: completed === sets.length && sets.length > 0,
        });
      });
    }

    // Find current exercise (first incomplete one)
    const currentExercise = exerciseProgress.find(ex => !ex.isComplete);
    const nextExercise = currentExercise ?
      exerciseProgress[currentExercise.position] : null;

    // Build status message
    let message = `📊 Workout Status:\n`;
    message += `⏱️ Duration: ${durationMinutes} min\n`;
    message += `💪 Exercises: ${exerciseProgress.filter(e => e.isComplete).length}/${activeWorkout.exercises.length} complete\n`;
    message += `✅ Sets: ${completedSets}/${totalSets} complete\n`;
    message += `🏋️ Volume: ${Math.round(totalVolume)} lbs\n`;

    if (currentExercise) {
      message += `\n🎯 Current: ${currentExercise.name} (${currentExercise.setsCompleted}/${currentExercise.totalSets} sets)`;
    }

    if (nextExercise) {
      message += `\n⏭️ Next: ${nextExercise.name}`;
    }

    return {
      success: true,
      message,
      data: {
        workoutTitle: activeWorkout.workoutTitle || 'Workout',
        duration: durationMinutes,
        totalExercises: activeWorkout.exercises.length,
        completedExercises: exerciseProgress.filter(e => e.isComplete).length,
        totalSets,
        completedSets,
        totalVolume: Math.round(totalVolume),
        currentExercise: currentExercise ? currentExercise.name : null,
        nextExercise: nextExercise ? nextExercise.name : null,
        exerciseProgress,
      },
    };
  } catch (error) {
    console.error('❌ getActiveWorkoutStatus error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't get workout status. Please try again.",
    };
  }
}

/**
 * START REST TIMER
 * User says: "Start 90 second timer", "Rest for 2 minutes", "Set timer for 60 seconds"
 *
 * NEW TOOL - Start a rest timer between sets
 */
export async function startRestTimer({ duration, userId }) {
  try {
    console.log('⏱️ Starting rest timer:', { duration });

    // Validate duration
    if (!duration || duration <= 0) {
      return {
        success: false,
        message: "Please provide a valid duration in seconds (e.g., 60, 90, 120)",
      };
    }

    // Maximum 10 minutes (600 seconds)
    if (duration > 600) {
      return {
        success: false,
        message: "Rest timer cannot exceed 10 minutes (600 seconds)",
      };
    }

    const now = new Date();
    const endTime = now.getTime() + (duration * 1000);

    // Store timer data in AsyncStorage
    // The WorkoutScreen will detect this and start the timer
    const timerData = {
      endTime: endTime.toString(),
      duration: duration,
      startedAt: now.toISOString(),
      triggeredByAI: true,
    };

    await AsyncStorage.setItem('@rest_timer_end', endTime.toString());
    await AsyncStorage.setItem('@ai_rest_timer_trigger', JSON.stringify(timerData));

    // Format duration for message
    let durationText;
    if (duration >= 60) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      if (seconds > 0) {
        durationText = `${minutes} min ${seconds} sec`;
      } else {
        durationText = `${minutes} min`;
      }
    } else {
      durationText = `${duration} sec`;
    }

    return {
      success: true,
      message: `⏱️ Rest timer started for ${durationText}. I'll notify you when it's time to get back to work!`,
      data: {
        duration,
        durationText,
        endTime,
      },
    };
  } catch (error) {
    console.error('❌ startRestTimer error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't start rest timer. Please try again.",
    };
  }
}

/**
 * LOG A WORKOUT SET
 * User says: "I just did 185 pounds for 5 reps on bench press" or "Log 225 for 8 reps at RPE 8"
 *
 * Enhanced with RPE, setType, and notes support
 */
export async function logWorkoutSet({
  exerciseName,
  weight,
  reps,
  setNumber,
  rpe,          // NEW: Rate of Perceived Exertion (1-10)
  setType,      // NEW: 'normal', 'warmup', 'dropset', 'failure', 'superset'
  notes,        // NEW: Optional notes for this set
  userId
}) {
  try {
    console.log('📝 Logging set:', { exerciseName, weight, reps, setNumber, rpe, setType, notes });

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout. Start a workout first to log sets.",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    // Find the exercise and its index (fuzzy match - partial name OK)
    const exerciseIndex = activeWorkout.exercises?.findIndex(
      ex => {
        const exName = ex.name.toLowerCase();
        const searchName = exerciseName.toLowerCase();
        // Exact match or partial match (e.g., "Leg Extension" matches "Leg Extension (Machine)")
        return exName === searchName ||
               exName.includes(searchName) ||
               searchName.includes(exName);
      }
    );

    if (exerciseIndex === -1) {
      return {
        success: false,
        message: `${exerciseName} not found in current workout. Add it first?`,
      };
    }

    const exercise = activeWorkout.exercises[exerciseIndex];

    // Get sets from exerciseSets object (keyed by exercise index)
    const sets = activeWorkout.exerciseSets?.[exerciseIndex.toString()] || [];

    console.log(`📊 Sets for exercise ${exerciseIndex} (${exerciseName}):`, JSON.stringify(sets, null, 2));

    if (!Array.isArray(sets) || sets.length === 0) {
      return {
        success: false,
        message: `${exerciseName} has no sets configured. Please add sets first.`,
      };
    }

    // Log the set (use setNumber if provided, otherwise next empty set)
    const setIndex = setNumber ? setNumber - 1 :
                     sets.findIndex(s => !s.completed);

    console.log(`🎯 Target set index: ${setIndex}, setNumber param: ${setNumber}`);

    if (setIndex === -1 || setIndex >= sets.length) {
      return {
        success: false,
        message: `All sets already logged for ${exerciseName}. Total sets: ${sets.length}, all completed: ${sets.every(s => s.completed)}`,
      };
    }

    // Build set object with enhanced data
    const setData = {
      weight: weight.toString(),
      reps: reps.toString(),
      completed: true,
    };

    // Add optional fields if provided
    if (rpe !== undefined && rpe !== null) {
      setData.rpe = rpe.toString();
    }

    if (setType && setType !== 'normal') {
      setData.setType = setType;
    }

    if (notes) {
      setData.notes = notes;
    }

    // Update the set in the exerciseSets object
    sets[setIndex] = setData;

    // Save
    await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

    // Build success message with details
    let message = `Logged set ${setIndex + 1}: ${weight} lbs × ${reps} reps`;
    if (rpe) message += ` @ RPE ${rpe}`;
    if (setType && setType !== 'normal') message += ` (${setType})`;
    message += ` on ${exerciseName}`;

    return {
      success: true,
      message,
      data: {
        exerciseName,
        weight,
        reps,
        rpe,
        setType,
        notes,
        setNumber: setIndex + 1,
        remainingSets: sets.filter(s => !s.completed).length,
      },
    };
  } catch (error) {
    console.error('❌ logWorkoutSet error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * LOG A MEAL
 * User says: "I ate 8oz chicken breast"
 */
export async function logMeal({ foodName, amount, calories, protein, carbs, fat, userId }) {
  try {
    console.log('🍽️ Logging meal:', { foodName, amount, calories, protein });

    if (!userId || userId === 'guest') {
      return {
        success: false,
        message: "Please sign in to log meals",
      };
    }

    // Create meal object
    const meal = {
      food_name: foodName,
      serving_size: amount || '1 serving',
      calories_consumed: calories || 0,
      protein_consumed: protein || 0,
      carbs_consumed: carbs || 0,
      fat_consumed: fat || 0,
      meal_time: new Date().toISOString(),
    };

    // Save to Firebase
    await MealSyncService.addMeal(userId, meal);

    return {
      success: true,
      message: `Logged ${amount || ''} ${foodName} - ${calories || '?'} cal, ${protein || '?'}g protein`,
      data: meal,
    };
  } catch (error) {
    console.error('❌ logMeal error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't log meal. Try again?",
    };
  }
}

/**
 * GET RECENT WORKOUTS
 * User says: "Show me my last 5 workouts"
 */
export async function getRecentWorkouts({ limit = 5, userId }) {
  try {
    console.log('📋 Getting recent workouts:', { limit, userId });

    const workouts = await WorkoutSyncService.getAllWorkouts(limit);

    if (!workouts || workouts.length === 0) {
      return {
        success: true,
        message: "No workouts found yet. Time to start training!",
        data: { workouts: [] },
      };
    }

    // Format for display
    const formatted = workouts.slice(0, limit).map(w => ({
      title: w.workoutTitle || w.name,
      date: new Date(w.date).toLocaleDateString(),
      exercises: w.exercises?.length || 0,
      duration: w.duration || 'N/A',
      totalVolume: w.exercises?.reduce((sum, ex) => {
        return sum + (ex.sets || []).reduce((setSum, set) => {
          return setSum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0);
      }, 0) || 0,
    }));

    return {
      success: true,
      message: `Found ${formatted.length} recent workout(s)`,
      data: { workouts: formatted },
    };
  } catch (error) {
    console.error('❌ getRecentWorkouts error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * UPDATE USER PROFILE DATA
 * User says: "Update my weight to 80kg"
 */
export async function updateUserProfile({ field, value, userId }) {
  try {
    console.log('👤 Updating profile:', { field, value });

    const validFields = ['currentWeight', 'age', 'height', 'primaryGoal'];

    if (!validFields.includes(field)) {
      return {
        success: false,
        message: `Can only update: ${validFields.join(', ')}`,
      };
    }

    // Update profile
    const profileKey = '@user_profile_assessment';
    const profileStr = await AsyncStorage.getItem(profileKey);
    const profile = profileStr ? JSON.parse(profileStr) : {};

    profile[field] = value;
    profile.lastUpdated = new Date().toISOString();

    await AsyncStorage.setItem(profileKey, JSON.stringify(profile));

    return {
      success: true,
      message: `Updated ${field} to ${value}`,
      data: { field, value },
    };
  } catch (error) {
    console.error('❌ updateUserProfile error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * START A NEW WORKOUT
 * User says: "Start a leg workout"
 */
export async function startWorkout({ workoutName = 'Workout', userId }) {
  try {
    console.log('🏋️ Starting workout:', { workoutName });

    const workout = {
      id: `workout_${Date.now()}`,
      workoutTitle: workoutName,
      date: new Date().toISOString(),
      startTime: new Date().toISOString(),
      exercises: [],
      duration: 0,
    };

    // Save as active workout
    await AsyncStorage.setItem('@active_workout', JSON.stringify(workout));

    return {
      success: true,
      message: `Started ${workoutName}! Ready to add exercises.`,
      data: workout,
      action: 'navigate_to_workout',
    };
  } catch (error) {
    console.error('❌ startWorkout error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * SAVE GENERATED WORKOUT TO MY PLANS
 * User says: "Save to my plans" after AI generates a workout
 */
export async function savePlannedWorkout({ workoutData, userId }) {
  try {
    console.log('💾 Saving workout to My Plans:', { workoutData });

    if (!workoutData) {
      return {
        success: false,
        message: "No workout data provided to save.",
      };
    }

    // Save to My Plans (standalone workouts)
    const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';
    const existingWorkoutsData = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
    const existingWorkouts = existingWorkoutsData ? JSON.parse(existingWorkoutsData) : [];

    // Format exercises for My Plans (convert from generated format to storage format)
    const formattedExercises = (workoutData.exercises || []).map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment || 'Unknown',
      muscleGroup: ex.muscleGroup || 'Unknown',
      sets: Array(ex.sets || 3).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps || '8-12',
        weight: null, // User will fill this in
        completed: false,
      })),
      notes: ex.instructions || '',
    }));

    // Format workout for My Plans (matches expected format from MyPlansScreen)
    // Handle muscleGroups - could be string, array, or undefined
    const muscleGroupsText = Array.isArray(workoutData.muscleGroups)
      ? workoutData.muscleGroups.join(', ')
      : workoutData.muscleGroups || 'multiple muscle groups';

    const newWorkout = {
      id: `workout_${Date.now()}`,
      name: workoutData.title || 'AI Workout',
      description: `${workoutData.goal || 'General'} workout for ${muscleGroupsText}`,
      day: {
        exercises: formattedExercises
      },
      createdAt: new Date().toISOString(),
      isAIGenerated: true,
    };

    existingWorkouts.push(newWorkout);
    await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));

    return {
      success: true,
      message: `✅ Saved '${newWorkout.name}' to My Plans! You can find it in Training → My Plans → Workouts.`,
      data: {
        workoutName: newWorkout.name,
        workoutId: newWorkout.id,
        exerciseCount: formattedExercises.length
      },
      action: 'saved_to_plans',
    };
  } catch (error) {
    console.error('❌ savePlannedWorkout error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't save workout to My Plans. Try again?",
    };
  }
}

/**
 * SCHEDULE WORKOUT FOR A SPECIFIC DATE
 * User says: "Schedule for today" or "Set it for tomorrow"
 */
export async function scheduleWorkoutForDate({ workoutData, date = 'today', userId }) {
  try {
    console.log('📅 Scheduling workout for date:', { workoutData, date, userId });

    if (!workoutData) {
      return {
        success: false,
        message: "No workout data provided to schedule.",
      };
    }

    // Parse date (can be "today", "tomorrow", or ISO date string)
    let dateKey;
    let displayDate;

    const now = new Date();
    if (date === 'today') {
      dateKey = now.toISOString().split('T')[0];
      displayDate = 'today';
    } else if (date === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateKey = tomorrow.toISOString().split('T')[0];
      displayDate = 'tomorrow';
    } else {
      // Assume it's already a date string in format YYYY-MM-DD
      dateKey = date;
      displayDate = new Date(date).toLocaleDateString();
    }

    // Format exercises for scheduled workout
    const formattedExercises = (workoutData.exercises || []).map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment || 'Unknown',
      muscleGroup: ex.muscleGroup || 'Unknown',
      sets: Array(ex.sets || 3).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps || '8-12',
        weight: null,
        completed: false,
      })),
      notes: ex.instructions || '',
    }));

    // Create workout plan for the date
    // Handle muscleGroups - could be string, array, or undefined
    const muscleGroupsText = Array.isArray(workoutData.muscleGroups)
      ? workoutData.muscleGroups.join(', ')
      : workoutData.muscleGroups || 'multiple muscle groups';

    const workoutPlan = {
      workoutTitle: workoutData.title || 'AI Workout',
      exercises: formattedExercises,
      notes: `AI-generated ${workoutData.goal || 'general'} workout for ${muscleGroupsText}`,
    };

    // Save to WorkoutStorageService for the specific date
    const result = await WorkoutStorageService.savePlannedWorkout(dateKey, workoutPlan, userId);

    if (result.success) {
      return {
        success: true,
        message: `✅ Scheduled '${workoutPlan.workoutTitle}' for ${displayDate}! You'll see it when you go to Training on that day.`,
        data: {
          workoutName: workoutPlan.workoutTitle,
          workoutId: result.workoutId,
          date: dateKey,
          displayDate: displayDate,
          exerciseCount: formattedExercises.length
        },
        action: 'scheduled_workout',
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ scheduleWorkoutForDate error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't schedule workout. Try again?",
    };
  }
}

// Export tool schemas for Gemini function calling
export const crudToolSchemas = [
  {
    name: 'addExerciseToWorkout',
    description: 'Add an exercise to the current active workout. Use when user wants to add an exercise.',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise to add',
        },
        sets: {
          type: 'number',
          description: 'Number of sets (default: 3)',
        },
        reps: {
          type: 'string',
          description: 'Rep range (e.g., "8-12", "10")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['exerciseName', 'userId'],
    },
  },
  {
    name: 'modifyActiveWorkout',
    description: 'Remove or reorder exercises in the current active workout. Use when user wants to remove an exercise or change exercise order. Examples: "Remove bench press", "Move squats to position 1", "Delete bicep curls"',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['remove_exercise', 'reorder_exercise'],
          description: 'Action to perform: "remove_exercise" to delete an exercise, "reorder_exercise" to move an exercise to a different position',
        },
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise to modify',
        },
        position: {
          type: 'number',
          description: 'New position for the exercise (1-indexed). Only required for reorder_exercise action. Position 1 means first exercise.',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['action', 'exerciseName', 'userId'],
    },
  },
  {
    name: 'finishWorkout',
    description: 'Complete and save the active workout to history. Use when user says they are done, finished, or wants to end their workout. Examples: "I\'m done", "Finish my workout", "End workout", "Save this workout"',
    parameters: {
      type: 'object',
      properties: {
        workoutTitle: {
          type: 'string',
          description: 'Optional custom title for the workout (e.g., "Chest Day", "Morning Workout"). If not provided, will use default based on workout type.',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the workout (e.g., "Felt strong today", "Struggled with energy", "New PR on bench")',
        },
        rating: {
          type: 'number',
          description: 'Optional workout rating from 1-5 (1 = terrible, 5 = excellent). Use when user mentions how they felt about the workout.',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'skipToNextExercise',
    description: 'Skip to the next exercise in the workout. Use when user wants to move on to the next exercise or says they\'re done with current exercise. Examples: "Skip to next exercise", "Move to the next one", "I\'m done with this exercise", "Next exercise please"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'getActiveWorkoutStatus',
    description: 'Get current workout progress and status. Use when user asks about their workout progress, what exercise they\'re on, how many sets completed, etc. Examples: "How\'s my workout going?", "What exercise am I on?", "How many sets left?", "Show my progress"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'startRestTimer',
    description: 'Start a rest timer between sets. Use when user wants to rest or mentions starting a timer. Common rest periods: 60s (1 min), 90s (1.5 min), 120s (2 min), 180s (3 min). Examples: "Start 90 second timer", "Rest for 2 minutes", "Set timer for 60 seconds", "Start rest timer"',
    parameters: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Rest duration in SECONDS (not minutes). Common values: 60 (1 min), 90 (1.5 min), 120 (2 min), 180 (3 min). Maximum: 600 seconds (10 min). IMPORTANT: Convert minutes to seconds (e.g., "2 minutes" = 120 seconds).',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['duration', 'userId'],
    },
  },
  {
    name: 'logWorkoutSet',
    description: 'Log a completed set with weight, reps, RPE, and set type. Use when user says they did/completed a set. Examples: "I did 225 for 8 reps at RPE 8", "Log 135 for 10 reps warmup set", "That was 315 for 5 reps to failure"',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of the exercise',
        },
        weight: {
          type: 'number',
          description: 'Weight in pounds',
        },
        reps: {
          type: 'number',
          description: 'Number of reps completed',
        },
        setNumber: {
          type: 'number',
          description: 'Which set number (optional, will auto-detect next set if not provided)',
        },
        rpe: {
          type: 'number',
          description: 'Rate of Perceived Exertion from 1-10 (optional). 10 = absolute failure, 9 = 1 rep left, 8 = 2 reps left, 7 = 3 reps left, etc.',
        },
        setType: {
          type: 'string',
          enum: ['normal', 'warmup', 'dropset', 'failure', 'superset'],
          description: 'Type of set (optional, defaults to "normal"). Use "warmup" for warmup sets, "dropset" for dropsets, "failure" when user mentions going to failure, "superset" for superset exercises.',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the set (e.g., "felt easy", "struggled on last rep", "using different grip")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['exerciseName', 'weight', 'reps', 'userId'],
    },
  },
  {
    name: 'logMeal',
    description: 'Log food/meal the user ate. Use when user mentions eating something.',
    parameters: {
      type: 'object',
      properties: {
        foodName: {
          type: 'string',
          description: 'Name of the food',
        },
        amount: {
          type: 'string',
          description: 'Amount (e.g., "8oz", "1 cup")',
        },
        calories: {
          type: 'number',
          description: 'Calories (if known)',
        },
        protein: {
          type: 'number',
          description: 'Protein in grams (if known)',
        },
        carbs: {
          type: 'number',
          description: 'Carbs in grams (if known)',
        },
        fat: {
          type: 'number',
          description: 'Fat in grams (if known)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['foodName', 'userId'],
    },
  },
  {
    name: 'getRecentWorkouts',
    description: 'Get user recent workout history. Use when user asks to see/show their workouts.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of workouts to retrieve (default: 5)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'updateUserProfile',
    description: 'Update user profile data like weight, age, goals. Use when user wants to update their info.',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['currentWeight', 'age', 'height', 'primaryGoal'],
          description: 'Which field to update',
        },
        value: {
          type: 'string',
          description: 'New value',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['field', 'value', 'userId'],
    },
  },
  {
    name: 'startWorkout',
    description: 'Start a new workout session. Use when user wants to begin working out.',
    parameters: {
      type: 'object',
      properties: {
        workoutName: {
          type: 'string',
          description: 'Name of the workout (e.g., "Leg Day", "Push Workout")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'savePlannedWorkout',
    description: 'Save a generated workout to My Plans library. Use after generateWorkoutPlan when user wants to save the workout. This saves it to the My Plans page where they can access it anytime.',
    parameters: {
      type: 'object',
      properties: {
        workoutData: {
          type: 'object',
          description: 'The workout data object returned from generateWorkoutPlan, containing title, exercises, muscleGroups, and goal',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['workoutData', 'userId'],
    },
  },
  {
    name: 'scheduleWorkoutForDate',
    description: 'Schedule a generated workout for a specific date (today, tomorrow, or a specific date). Use after generateWorkoutPlan when user wants to schedule the workout for a particular day. They can then access it from the Training screen on that date.',
    parameters: {
      type: 'object',
      properties: {
        workoutData: {
          type: 'object',
          description: 'The workout data object returned from generateWorkoutPlan, containing title, exercises, muscleGroups, and goal',
        },
        date: {
          type: 'string',
          description: 'Date to schedule the workout: "today", "tomorrow", or a date string in YYYY-MM-DD format',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['workoutData', 'userId'],
    },
  },
];
