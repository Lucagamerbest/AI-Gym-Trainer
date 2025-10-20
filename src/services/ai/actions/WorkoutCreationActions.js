/**
 * Workout Creation Actions
 * Handles creation, scheduling, and management of AI-generated workouts
 */

import { WorkoutStorageService } from '../../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendService from '../../backend/BackendService';

/**
 * Create a workout plan for a specific muscle group
 */
export async function createWorkoutPlan(params, context) {
  try {
    const { muscleGroup } = params;

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Import AIService to generate workout with AI
    const AIService = (await import('../AIService')).default;

    // Ask AI to generate a workout
    const aiPrompt = `Generate a workout for ${muscleGroup || 'Full Body'}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroup || 'Full Body'}.`;


    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });


    // Parse AI response to extract exercises
    const exercises = [];
    const lines = aiResponse.response.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('EXERCISE:')) {
        // Parse: "EXERCISE: Bench Press (Barbell) | 4 | 8"
        const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
        if (parts.length >= 3) {
          // Extract name and equipment
          const nameWithEquipment = parts[0];
          const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
          const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
          const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

          exercises.push({
            name: `${name} (${equipment})`,
            equipment: equipment,
            sets: parseInt(parts[1]) || 3,
            reps: parseInt(parts[2]) || 10,
          });
        }
      }
    }

    // Fallback if AI parsing failed
    if (exercises.length === 0) {

      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }


    const planName = `${muscleGroup || 'Full Body'} Day`;

    // Format exercises for storage
    const formattedExercises = exercises.map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment,
      sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps,
        weight: null, // User will fill this in
        completed: false,
      })),
      notes: '',
    }));

    // Save the workout plan
    const workoutPlan = {
      workoutTitle: planName,
      exercises: formattedExercises,
      notes: `AI-generated ${muscleGroup || 'Full Body'} workout`,
    };

    // Save to planned workouts for today
    const today = new Date().toISOString().split('T')[0];
    await WorkoutStorageService.savePlannedWorkout(today, workoutPlan, userId);

    // Build detailed message
    const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

    return {
      success: true,
      action: 'CREATE_WORKOUT_PLAN',
      data: {
        name: planName,
        exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
        totalExercises: exercises.length,
      },
      message: `✅ Created '${planName}' for today!\n\n${exerciseList}\n\nGo to Training → Start Workout to begin!`
    };
  } catch (error) {
    console.error('Error creating workout plan:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create workout plan. Try again later.'
    };
  }
}

/**
 * Create a custom workout with specified muscle groups
 */
export async function createWorkout(params, context) {
  try {
    const { muscleGroups, workoutContext, autoScheduleDate } = params;
    const muscleGroupList = muscleGroups || ['Full Body'];

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Import AIService to generate workout with AI
    const AIService = (await import('../AIService')).default;

    // Build the muscle group string
    const muscleGroupStr = muscleGroupList.join(' & ');

    // Ask AI to generate a workout
    const aiPrompt = `Generate a workout for ${muscleGroupStr}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroupStr}.`;


    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });


    // Parse AI response to extract exercises
    const exercises = [];
    const lines = aiResponse.response.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('EXERCISE:')) {
        // Parse: "EXERCISE: Bench Press (Barbell) | 4 | 8"
        const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
        if (parts.length >= 3) {
          // Extract name and equipment
          const nameWithEquipment = parts[0];
          const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
          const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
          const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

          exercises.push({
            name: `${name} (${equipment})`,
            equipment: equipment,
            sets: parseInt(parts[1]) || 3,
            reps: parseInt(parts[2]) || 10,
          });
        }
      }
    }

    // Fallback if AI parsing failed
    if (exercises.length === 0) {

      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }


    const workoutTitle = `${muscleGroupStr} Workout`;

    // Format exercises for storage
    const formattedExercises = exercises.map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment,
      sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps,
        weight: null, // User will fill this in
        completed: false,
      })),
      notes: '',
    }));

    // Create the workout plan object
    const workoutPlan = {
      workoutTitle: workoutTitle,
      exercises: formattedExercises,
      notes: `AI-generated ${muscleGroupStr} workout`,
    };

    // Build detailed exercise list
    const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

    // If auto-schedule date was detected, schedule it immediately
    if (autoScheduleDate) {
      await WorkoutStorageService.savePlannedWorkout(autoScheduleDate.dateString, workoutPlan, userId);

      return {
        success: true,
        action: 'CREATE_WORKOUT_AUTO_SCHEDULED',
        data: {
          name: workoutTitle,
          muscleGroups: muscleGroupList,
          exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
          totalExercises: exercises.length,
          scheduledDate: autoScheduleDate.dateString,
          displayDate: autoScheduleDate.displayText,
        },
        message: `✅ Created '${workoutTitle}' and scheduled for ${autoScheduleDate.displayText}!\n\n${exerciseList}\n\nYou'll see it when you go to Training on that day! 📅`
      };
    }

    // Otherwise, save to temporary storage for user to decide what to do with it
    await AsyncStorage.setItem('ai_last_created_workout', JSON.stringify({
      workout: workoutPlan,
      muscleGroups: muscleGroupList,
      createdAt: new Date().toISOString(),
    }));

    // Phase 2: Present options to user
    return {
      success: true,
      action: 'CREATE_WORKOUT',
      data: {
        name: workoutTitle,
        muscleGroups: muscleGroupList,
        exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
        totalExercises: exercises.length,
        workoutPlan: workoutPlan,
      },
      message: `✅ Created '${workoutTitle}'!\n\n${exerciseList}\n\n📋 What would you like to do?\n\n1️⃣ "Start it now" - Begin workout immediately\n2️⃣ "Save to plans" - Add to My Plans library\n3️⃣ "Schedule for today" - Set for today's workout\n4️⃣ "Schedule for tomorrow" - Set for tomorrow\n\nJust tell me what you'd like!`
    };
  } catch (error) {
    console.error('Error creating workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create workout. Try again later.'
    };
  }
}

/**
 * Start a recently created workout
 */
export async function startCreatedWorkout(params, context) {
  try {
    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first by saying "create a workout for chest".'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Save to today's planned workout
    const today = new Date().toISOString().split('T')[0];
    await WorkoutStorageService.savePlannedWorkout(today, workout, userId);

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'START_CREATED_WORKOUT',
      data: { workoutTitle: workout.workoutTitle, date: today },
      message: `🚀 Ready to go! '${workout.workoutTitle}' is set for today.\n\nGo to Training → Start Today's Workout to begin! 💪`
    };
  } catch (error) {
    console.error('Error starting created workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to start workout. Try again later.'
    };
  }
}

/**
 * Save workout to My Plans
 */
export async function saveWorkoutToPlans(params, context) {
  try {
    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first by saying "create a workout for chest".'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);

    // Save to My Plans (standalone workouts)
    const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';
    const existingWorkoutsData = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
    const existingWorkouts = existingWorkoutsData ? JSON.parse(existingWorkoutsData) : [];

    // Format workout for My Plans (matches expected format)
    const newWorkout = {
      id: `workout_${Date.now()}`,
      name: workout.workoutTitle,
      description: workout.notes || '',
      day: {
        exercises: workout.exercises
      },
      createdAt: new Date().toISOString(),
      isAIGenerated: true,
    };

    existingWorkouts.push(newWorkout);
    await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'SAVE_TO_PLANS',
      data: { workoutName: workout.workoutTitle, workoutId: newWorkout.id },
      message: `✅ Saved '${workout.workoutTitle}' to My Plans!\n\nFind it in Training → My Plans → Workouts. You can use it anytime! 📋`
    };
  } catch (error) {
    console.error('Error saving workout to plans:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to save to plans. Try again later.'
    };
  }
}

/**
 * Schedule workout for a specific date
 */
export async function scheduleWorkout(params, context) {
  try {
    const { dateInfo } = params;

    if (!dateInfo) {
      return {
        success: false,
        message: 'Please specify a date (e.g., "schedule for tomorrow", "schedule in 2 days", or "schedule for Friday").'
      };
    }

    // Get the last created workout from temporary storage
    const lastCreatedData = await AsyncStorage.getItem('ai_last_created_workout');

    if (!lastCreatedData) {
      return {
        success: false,
        message: 'No workout found. Create a workout first, then schedule it.'
      };
    }

    const { workout } = JSON.parse(lastCreatedData);
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Save to the specified date
    await WorkoutStorageService.savePlannedWorkout(dateInfo.dateString, workout, userId);

    // Clear temporary storage
    await AsyncStorage.removeItem('ai_last_created_workout');

    return {
      success: true,
      action: 'SCHEDULE_WORKOUT',
      data: {
        workoutTitle: workout.workoutTitle,
        date: dateInfo.dateString,
        displayDate: dateInfo.displayText
      },
      message: `✅ Scheduled '${workout.workoutTitle}' for ${dateInfo.displayText}!\n\nYou'll see it when you go to Training on that day! 📅`
    };
  } catch (error) {
    console.error('Error scheduling workout:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to schedule workout. Try again later.'
    };
  }
}

/**
 * Plan workout for a specific date
 */
export async function planWorkoutForDate(params, context) {
  try {
    const { dateInfo, muscleGroups } = params;

    if (!dateInfo) {
      return {
        success: false,
        message: 'Please specify a date for the workout.'
      };
    }

    const muscleGroupList = muscleGroups || ['Full Body'];
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Import AIService to generate workout
    const AIService = (await import('../AIService')).default;
    const muscleGroupStr = muscleGroupList.join(' & ');

    // Generate workout
    const aiPrompt = `Generate a workout for ${muscleGroupStr}.

IMPORTANT: Respond in this EXACT format (nothing else):
EXERCISE: Exercise Name (Equipment) | Sets | Reps
EXERCISE: Exercise Name (Equipment) | Sets | Reps
(continue for 4-6 exercises)

Example:
EXERCISE: Bench Press (Barbell) | 4 | 8
EXERCISE: Incline Dumbbell Press (Dumbbell) | 3 | 10

Generate 4-6 exercises for ${muscleGroupStr}.`;

    const aiResponse = await AIService.sendMessage(aiPrompt, { screen: 'WorkoutGenerator' });

    // Parse exercises (same logic as createWorkout)
    const exercises = [];
    const lines = aiResponse.response.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('EXERCISE:')) {
        const parts = line.replace('EXERCISE:', '').trim().split('|').map(p => p.trim());
        if (parts.length >= 3) {
          const nameWithEquipment = parts[0];
          const equipmentMatch = nameWithEquipment.match(/\(([^)]+)\)/);
          const equipment = equipmentMatch ? equipmentMatch[1] : 'Barbell';
          const name = nameWithEquipment.replace(/\([^)]+\)/, '').trim();

          exercises.push({
            name: `${name} (${equipment})`,
            equipment: equipment,
            sets: parseInt(parts[1]) || 3,
            reps: parseInt(parts[2]) || 10,
          });
        }
      }
    }

    if (exercises.length === 0) {
      exercises.push(
        { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
        { name: 'Isolation Exercise 1', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { name: 'Isolation Exercise 2', equipment: 'Cable', sets: 3, reps: 12 },
        { name: 'Finishing Exercise', equipment: 'Dumbbell', sets: 3, reps: 12 },
      );
    }

    const workoutTitle = `${muscleGroupStr} Workout`;
    const formattedExercises = exercises.map((ex, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: ex.name,
      equipment: ex.equipment,
      sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
        id: `set_${idx}_${setIdx}`,
        reps: ex.reps,
        weight: null,
        completed: false,
      })),
      notes: '',
    }));

    const workoutPlan = {
      workoutTitle: workoutTitle,
      exercises: formattedExercises,
      notes: `AI-generated ${muscleGroupStr} workout`,
    };

    // Save to the specified date
    await WorkoutStorageService.savePlannedWorkout(dateInfo.dateString, workoutPlan, userId);

    const exerciseList = exercises.map(ex => `• ${ex.name} (${ex.sets}×${ex.reps})`).join('\n');

    return {
      success: true,
      action: 'PLAN_WORKOUT_FOR_DATE',
      data: {
        name: workoutTitle,
        date: dateInfo.dateString,
        displayDate: dateInfo.displayText,
        exercises: exercises.map(ex => `${ex.name} (${ex.sets}×${ex.reps})`),
        totalExercises: exercises.length,
      },
      message: `✅ Created '${workoutTitle}' for ${dateInfo.displayText}!\n\n${exerciseList}\n\nYou'll see it when you go to Training on that day! 📅`
    };
  } catch (error) {
    console.error('Error planning workout for date:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to plan workout. Try again later.'
    };
  }
}

/**
 * Show workout frequency stats
 */
export async function showWorkoutFrequency(params, context) {
  try {
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get workouts from last 7 days
    const WorkoutSyncService = (await import('../../backend/WorkoutSyncService')).default;
    const allWorkouts = await WorkoutSyncService.getAllWorkouts(30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWorkouts = allWorkouts.filter(w => new Date(w.date) >= sevenDaysAgo);

    // Count by muscle group
    const muscleGroupCounts = {};
    recentWorkouts.forEach(workout => {
      const title = workout.workoutTitle?.toLowerCase() || '';
      if (title.includes('chest') || title.includes('push')) {
        muscleGroupCounts['Chest'] = (muscleGroupCounts['Chest'] || 0) + 1;
      }
      if (title.includes('back') || title.includes('pull')) {
        muscleGroupCounts['Back'] = (muscleGroupCounts['Back'] || 0) + 1;
      }
      if (title.includes('leg')) {
        muscleGroupCounts['Legs'] = (muscleGroupCounts['Legs'] || 0) + 1;
      }
      if (title.includes('shoulder')) {
        muscleGroupCounts['Shoulders'] = (muscleGroupCounts['Shoulders'] || 0) + 1;
      }
      if (title.includes('arm')) {
        muscleGroupCounts['Arms'] = (muscleGroupCounts['Arms'] || 0) + 1;
      }
    });

    const summary = Object.entries(muscleGroupCounts)
      .map(([group, count]) => `• ${group}: ${count}x`)
      .join('\n');

    return {
      success: true,
      action: 'SHOW_WORKOUT_FREQUENCY',
      data: {
        totalWorkouts: recentWorkouts.length,
        muscleGroupCounts,
        period: '7 days'
      },
      message: `Last 7 days workout frequency:\n\n${summary || 'No workouts yet'}\n\nTotal: ${recentWorkouts.length} workout${recentWorkouts.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    console.error('Error showing workout frequency:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch workout frequency.'
    };
  }
}
