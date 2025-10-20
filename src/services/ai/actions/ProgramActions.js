/**
 * Program Actions
 * Handles execution of program creation actions
 */

import { WorkoutStorageService } from '../../workoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackendService from '../../backend/BackendService';

/**
 * Create a workout program (split)
 */
export async function createProgram(params, context) {
  try {




    const { numDays, programType, muscleGroups } = params;
    const userId = BackendService.getCurrentUserId() || 'guest';

    // If no program type specified, ask for it
    if (!programType && !numDays) {

      return {
        success: true,
        action: 'CREATE_PROGRAM_ASK_TYPE',
        message: `I can create a workout program for you! What type of split would you like?\n\n• Push/Pull/Legs (6 days)\n• Upper/Lower (4 days)\n• Bro Split (5 days)\n• Full Body (3 days)\n\nOr specify the number of days you want to train per week.`
      };
    }

    // Determine program structure based on type or days
    let programDays = [];
    let programName = '';

    if (programType === 'push_pull_legs' || (numDays === 6 && !programType)) {
      programName = 'Push/Pull/Legs Program';
      programDays = [
        { name: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'] },
        { name: 'Pull Day', muscles: ['Back', 'Biceps'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
        { name: 'Push Day', muscles: ['Chest', 'Shoulders', 'Triceps'] },
        { name: 'Pull Day', muscles: ['Back', 'Biceps'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      ];
    } else if (programType === 'upper_lower' || (numDays === 4 && !programType)) {
      programName = 'Upper/Lower Program';
      programDays = [
        { name: 'Upper Body', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'] },
        { name: 'Lower Body', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
        { name: 'Upper Body', muscles: ['Chest', 'Back', 'Shoulders', 'Arms'] },
        { name: 'Lower Body', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
      ];
    } else if (programType === 'bro_split' || (numDays === 5 && !programType)) {
      programName = 'Bro Split Program';
      programDays = [
        { name: 'Chest Day', muscles: ['Chest'] },
        { name: 'Back Day', muscles: ['Back'] },
        { name: 'Shoulder Day', muscles: ['Shoulders'] },
        { name: 'Leg Day', muscles: ['Quads', 'Hamstrings', 'Glutes'] },
        { name: 'Arm Day', muscles: ['Biceps', 'Triceps'] },
      ];
    } else if (programType === 'full_body' || (numDays === 3 && !programType)) {
      programName = 'Full Body Program';
      programDays = [
        { name: 'Full Body A', muscles: ['Chest', 'Back', 'Quads', 'Shoulders'] },
        { name: 'Full Body B', muscles: ['Back', 'Chest', 'Hamstrings', 'Arms'] },
        { name: 'Full Body C', muscles: ['Quads', 'Chest', 'Back', 'Shoulders'] },
      ];
    } else if (programType === 'personalized') {
      // For personalized programs, ask the user about their goals and preferences
      return {
        success: true,
        action: 'CREATE_PROGRAM_PERSONALIZED',
        message: `I'll create a personalized program for you! To make it perfect for your goals, tell me:\n\n1. How many days per week can you train? (3-6 days)\n2. What are your main goals? (strength, muscle growth, fat loss, general fitness)\n3. Any muscle groups you want to prioritize?\n\nOr just tell me the number of days and I'll design the optimal split for you!`
      };
    } else if (numDays && !programType) {
      // Custom number of days without specific type
      return {
        success: true,
        action: 'CREATE_PROGRAM_CUSTOM_DAYS',
        message: `Got it, ${numDays} days per week! What type of split would you like?\n\n• Push/Pull/Legs\n• Upper/Lower\n• Bro Split (body part split)\n• Full Body\n• Or let me know which muscles you want to train each day`
      };
    } else {
      return {
        success: true,
        action: 'CREATE_PROGRAM_UNCLEAR',
        message: `I can create programs with these splits:\n\n• Push/Pull/Legs (6 days)\n• Upper/Lower (4 days)\n• Bro Split (5 days)\n• Full Body (3 days)\n\nWhich would you like?`
      };
    }



    // Get next Monday as starting point
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    // Create program structure for MyPlansScreen
    const programId = `program_${Date.now()}`;
    const programDaysData = [];

    // Generate and save each workout day
    const createdWorkouts = [];
    for (let i = 0; i < programDays.length; i++) {
      const day = programDays[i];
      const workoutDate = new Date(nextMonday);
      workoutDate.setDate(nextMonday.getDate() + i);
      const dateString = workoutDate.toISOString().split('T')[0];



      // Use pre-defined exercise templates for each muscle group
      const exercises = generateExercisesForMuscles(day.muscles);

      // Format exercises for storage
      const formattedExercises = exercises.map((ex, idx) => ({
        id: `${Date.now()}_${i}_${idx}`,
        name: ex.name,
        equipment: ex.equipment,
        sets: Array(ex.sets).fill(null).map((_, setIdx) => ({
          id: `set_${i}_${idx}_${setIdx}`,
          reps: ex.reps,
          weight: null,
          completed: false,
        })),
        notes: '',
      }));

      // Create workout plan
      const workoutPlan = {
        workoutTitle: day.name,
        exercises: formattedExercises,
        notes: `Part of ${programName}`,
      };

      // Save to planned workouts (for calendar)
      await WorkoutStorageService.savePlannedWorkout(dateString, workoutPlan, userId);

      // Add to program days data (for My Plans screen)
      programDaysData.push({
        id: `day_${i}`,
        name: day.name,
        exercises: formattedExercises,
        muscleGroups: day.muscles,
      });

      createdWorkouts.push({
        name: day.name,
        date: dateString,
        muscles: day.muscles,
        exerciseCount: exercises.length,
      });


    }

    // Save the complete program to AsyncStorage for My Plans screen
    try {
      const WORKOUT_PROGRAMS_KEY = '@workout_programs';

      // Get existing programs
      const existingProgramsStr = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      const existingPrograms = existingProgramsStr ? JSON.parse(existingProgramsStr) : [];

      // Create new program object
      const newProgram = {
        id: programId,
        name: programName,
        description: `AI-generated ${programName}`,
        days: programDaysData,
        createdAt: new Date().toISOString(),
      };

      // Add to programs array
      existingPrograms.push(newProgram);

      // Save back to AsyncStorage
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(existingPrograms));


    } catch (error) {
      console.error('Error saving program to My Plans:', error);
    }

    // Format summary message
    const workoutSummary = createdWorkouts.map((w, idx) => {
      const date = new Date(w.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `Day ${idx + 1} (${dayName}): ${w.name}\n  • ${w.muscles.join(', ')}\n  • ${w.exerciseCount} exercises`;
    }).join('\n\n');

    return {
      success: true,
      action: 'CREATE_PROGRAM',
      data: {
        programName,
        numDays: programDays.length,
        startDate: nextMonday.toISOString().split('T')[0],
        workouts: createdWorkouts,
      },
      message: `✅ Created your ${programName}!\n\nStarting next Monday, here's your schedule:\n\n${workoutSummary}\n\n💾 Saved to My Plans - check the Programs section!\n📅 Also added to your calendar for easy scheduling! 💪`
    };

  } catch (error) {
    console.error('Error creating program:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to create program. Try again later.'
    };
  }
}

/**
 * Generate exercises for specific muscle groups
 * Helper function to create exercise templates
 */
function generateExercisesForMuscles(muscles) {
  const exerciseTemplates = {
    'Chest': [
      { name: 'Barbell Bench Press', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Incline Dumbbell Press', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { name: 'Cable Flyes', equipment: 'Cable', sets: 3, reps: 12 },
    ],
    'Back': [
      { name: 'Barbell Rows', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Lat Pulldowns', equipment: 'Cable', sets: 3, reps: 10 },
      { name: 'Cable Rows', equipment: 'Cable', sets: 3, reps: 12 },
    ],
    'Shoulders': [
      { name: 'Overhead Press', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Lateral Raises', equipment: 'Dumbbell', sets: 3, reps: 12 },
      { name: 'Face Pulls', equipment: 'Cable', sets: 3, reps: 15 },
    ],
    'Quads': [
      { name: 'Barbell Squats', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Leg Press', equipment: 'Machine', sets: 3, reps: 10 },
      { name: 'Leg Extensions', equipment: 'Machine', sets: 3, reps: 12 },
    ],
    'Hamstrings': [
      { name: 'Romanian Deadlifts', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Leg Curls', equipment: 'Machine', sets: 3, reps: 12 },
    ],
    'Glutes': [
      { name: 'Hip Thrusts', equipment: 'Barbell', sets: 4, reps: 10 },
      { name: 'Bulgarian Split Squats', equipment: 'Dumbbell', sets: 3, reps: 10 },
    ],
    'Calves': [
      { name: 'Standing Calf Raises', equipment: 'Machine', sets: 3, reps: 15 },
    ],
    'Triceps': [
      { name: 'Tricep Pushdowns', equipment: 'Cable', sets: 3, reps: 12 },
      { name: 'Overhead Tricep Extension', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
    'Biceps': [
      { name: 'Barbell Curls', equipment: 'Barbell', sets: 3, reps: 10 },
      { name: 'Hammer Curls', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
    'Arms': [
      { name: 'Barbell Curls', equipment: 'Barbell', sets: 3, reps: 10 },
      { name: 'Tricep Pushdowns', equipment: 'Cable', sets: 3, reps: 12 },
      { name: 'Hammer Curls', equipment: 'Dumbbell', sets: 3, reps: 12 },
    ],
  };

  const selectedExercises = [];

  // Collect exercises for each muscle group
  muscles.forEach(muscle => {
    const muscleExercises = exerciseTemplates[muscle] || [];
    selectedExercises.push(...muscleExercises);
  });

  // If no exercises found, return a default set
  if (selectedExercises.length === 0) {
    return [
      { name: 'Compound Exercise 1', equipment: 'Barbell', sets: 4, reps: 8 },
      { name: 'Compound Exercise 2', equipment: 'Dumbbell', sets: 3, reps: 10 },
      { name: 'Isolation Exercise 1', equipment: 'Cable', sets: 3, reps: 12 },
      { name: 'Isolation Exercise 2', equipment: 'Machine', sets: 3, reps: 12 },
    ];
  }

  // Return first 4-6 exercises to avoid overcrowding
  return selectedExercises.slice(0, 6);
}
