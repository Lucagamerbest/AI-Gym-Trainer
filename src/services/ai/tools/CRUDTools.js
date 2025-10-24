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
 * LOG A WORKOUT SET
 * User says: "I just did 185 pounds for 5 reps on bench press"
 */
export async function logWorkoutSet({ exerciseName, weight, reps, setNumber, userId }) {
  try {
    console.log('📝 Logging set:', { exerciseName, weight, reps, setNumber });

    const activeWorkoutKey = '@active_workout';
    const activeWorkoutStr = await AsyncStorage.getItem(activeWorkoutKey);

    if (!activeWorkoutStr) {
      return {
        success: false,
        message: "No active workout. Start a workout first to log sets.",
      };
    }

    const activeWorkout = JSON.parse(activeWorkoutStr);

    // Find the exercise
    const exercise = activeWorkout.exercises?.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    if (!exercise) {
      return {
        success: false,
        message: `${exerciseName} not found in current workout. Add it first?`,
      };
    }

    // Log the set (use setNumber if provided, otherwise next empty set)
    const setIndex = setNumber ? setNumber - 1 :
                     exercise.sets.findIndex(s => !s.completed);

    if (setIndex === -1 || setIndex >= exercise.sets.length) {
      return {
        success: false,
        message: `All sets already logged for ${exerciseName}`,
      };
    }

    exercise.sets[setIndex] = {
      weight: weight.toString(),
      reps: reps.toString(),
      completed: true,
    };

    // Save
    await AsyncStorage.setItem(activeWorkoutKey, JSON.stringify(activeWorkout));

    return {
      success: true,
      message: `Logged set ${setIndex + 1}: ${weight} lbs × ${reps} reps on ${exerciseName}`,
      data: {
        exerciseName,
        weight,
        reps,
        setNumber: setIndex + 1,
        remainingSets: exercise.sets.filter(s => !s.completed).length,
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
    name: 'logWorkoutSet',
    description: 'Log a completed set with weight and reps. Use when user says they did/completed a set.',
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
          description: 'Which set number (optional, will auto-detect next set)',
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
