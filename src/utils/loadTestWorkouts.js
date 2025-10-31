/**
 * Load Test Workout Data
 *
 * Run this to add realistic test workouts to your account
 * This creates: 2 Push days + 2 Pull days this week
 * AI should recommend LEGS next!
 */

import WorkoutSyncService from '../services/backend/WorkoutSyncService';

// Calculate dates for this week (Monday through Friday)
const today = new Date();
const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
const monday = new Date(today);
monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

function getWeekdayDate(dayIndex) {
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

const TEST_WORKOUTS = [
  // Monday - Push Day
  {
    title: "Push - Chest, Shoulders, Triceps",
    date: getWeekdayDate(0), // Monday
    duration: 65,
    exercises: [
      {
        name: "Bench Press",
        equipment: "Barbell",
        primaryMuscles: ["Chest"],
        secondaryMuscles: ["Triceps", "Front Deltoids"],
        muscleGroup: "Chest",
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 6, completed: true },
          { weight: 225, reps: 5, completed: true }
        ]
      },
      {
        name: "Overhead Press",
        equipment: "Barbell",
        primaryMuscles: ["Shoulders"],
        secondaryMuscles: ["Triceps"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 95, reps: 8, completed: true },
          { weight: 115, reps: 6, completed: true },
          { weight: 135, reps: 5, completed: true }
        ]
      },
      {
        name: "Incline Dumbbell Press",
        equipment: "Dumbbell",
        primaryMuscles: ["Chest"],
        muscleGroup: "Chest",
        sets: [
          { weight: 60, reps: 10, completed: true },
          { weight: 70, reps: 8, completed: true },
          { weight: 75, reps: 7, completed: true }
        ]
      },
      {
        name: "Lateral Raise",
        equipment: "Dumbbell",
        primaryMuscles: ["Shoulders"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 25, reps: 12, completed: true },
          { weight: 25, reps: 12, completed: true },
          { weight: 25, reps: 10, completed: true }
        ]
      },
      {
        name: "Tricep Pushdown",
        equipment: "Cable",
        primaryMuscles: ["Triceps"],
        muscleGroup: "Triceps",
        sets: [
          { weight: 60, reps: 12, completed: true },
          { weight: 70, reps: 10, completed: true },
          { weight: 70, reps: 10, completed: true }
        ]
      }
    ],
    totalVolume: 12450,
    notes: "Monday - Felt strong!"
  },

  // Tuesday - Pull Day
  {
    title: "Pull - Back, Biceps",
    date: getWeekdayDate(1), // Tuesday
    duration: 70,
    exercises: [
      {
        name: "Pull-ups",
        equipment: "Bodyweight",
        primaryMuscles: ["Back", "Lats"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 0, reps: 10, completed: true },
          { weight: 0, reps: 8, completed: true },
          { weight: 0, reps: 7, completed: true }
        ]
      },
      {
        name: "Barbell Row",
        equipment: "Barbell",
        primaryMuscles: ["Back", "Lats"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 8, completed: true },
          { weight: 225, reps: 6, completed: true }
        ]
      },
      {
        name: "Cable Row",
        equipment: "Cable",
        primaryMuscles: ["Back"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 120, reps: 12, completed: true },
          { weight: 140, reps: 10, completed: true },
          { weight: 140, reps: 10, completed: true }
        ]
      },
      {
        name: "Face Pull",
        equipment: "Cable",
        primaryMuscles: ["Rear Deltoids"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 50, reps: 15, completed: true },
          { weight: 60, reps: 12, completed: true }
        ]
      },
      {
        name: "Barbell Curl",
        equipment: "Barbell",
        primaryMuscles: ["Biceps"],
        muscleGroup: "Biceps",
        sets: [
          { weight: 75, reps: 10, completed: true },
          { weight: 85, reps: 8, completed: true },
          { weight: 85, reps: 7, completed: true }
        ]
      }
    ],
    totalVolume: 13200,
    notes: "Tuesday - Great back pump!"
  },

  // Thursday - Push Day
  {
    title: "Push - Chest, Shoulders, Triceps",
    date: getWeekdayDate(3), // Thursday
    duration: 68,
    exercises: [
      {
        name: "Bench Press",
        equipment: "Barbell",
        primaryMuscles: ["Chest"],
        secondaryMuscles: ["Triceps"],
        muscleGroup: "Chest",
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 7, completed: true },
          { weight: 215, reps: 5, completed: true }
        ]
      },
      {
        name: "Overhead Press",
        equipment: "Barbell",
        primaryMuscles: ["Shoulders"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 95, reps: 8, completed: true },
          { weight: 115, reps: 7, completed: true },
          { weight: 125, reps: 6, completed: true }
        ]
      },
      {
        name: "Incline Dumbbell Press",
        equipment: "Dumbbell",
        primaryMuscles: ["Chest"],
        muscleGroup: "Chest",
        sets: [
          { weight: 65, reps: 10, completed: true },
          { weight: 70, reps: 8, completed: true },
          { weight: 75, reps: 7, completed: true }
        ]
      },
      {
        name: "Lateral Raise",
        equipment: "Dumbbell",
        primaryMuscles: ["Shoulders"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 25, reps: 15, completed: true },
          { weight: 30, reps: 12, completed: true }
        ]
      },
      {
        name: "Tricep Pushdown",
        equipment: "Cable",
        primaryMuscles: ["Triceps"],
        muscleGroup: "Triceps",
        sets: [
          { weight: 60, reps: 15, completed: true },
          { weight: 70, reps: 12, completed: true },
          { weight: 80, reps: 10, completed: true }
        ]
      }
    ],
    totalVolume: 12780,
    notes: "Thursday - Second push day"
  },

  // Friday - Pull Day
  {
    title: "Pull - Back, Biceps",
    date: getWeekdayDate(4), // Friday
    duration: 72,
    exercises: [
      {
        name: "Pull-ups",
        equipment: "Bodyweight",
        primaryMuscles: ["Back", "Lats"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 0, reps: 12, completed: true },
          { weight: 0, reps: 10, completed: true },
          { weight: 0, reps: 8, completed: true }
        ]
      },
      {
        name: "Barbell Row",
        equipment: "Barbell",
        primaryMuscles: ["Back", "Lats"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 10, completed: true },
          { weight: 205, reps: 8, completed: true },
          { weight: 215, reps: 7, completed: true }
        ]
      },
      {
        name: "T-Bar Row",
        equipment: "T-Bar",
        primaryMuscles: ["Back"],
        secondaryMuscles: ["Biceps"],
        muscleGroup: "Back",
        sets: [
          { weight: 90, reps: 12, completed: true },
          { weight: 115, reps: 10, completed: true },
          { weight: 115, reps: 9, completed: true }
        ]
      },
      {
        name: "Face Pull",
        equipment: "Cable",
        primaryMuscles: ["Rear Deltoids"],
        muscleGroup: "Shoulders",
        sets: [
          { weight: 50, reps: 20, completed: true },
          { weight: 60, reps: 15, completed: true }
        ]
      },
      {
        name: "Barbell Curl",
        equipment: "Barbell",
        primaryMuscles: ["Biceps"],
        muscleGroup: "Biceps",
        sets: [
          { weight: 75, reps: 12, completed: true },
          { weight: 85, reps: 10, completed: true },
          { weight: 95, reps: 7, completed: true }
        ]
      }
    ],
    totalVolume: 14100,
    notes: "Friday - Best pull day!"
  }
];

export async function loadTestWorkouts() {
  try {
    console.log('🌱 Loading test workout data...');
    console.log('📅 This week\'s schedule:');
    console.log('   Mon: Push (Chest, Shoulders, Triceps)');
    console.log('   Tue: Pull (Back, Biceps)');
    console.log('   Thu: Push (Chest, Shoulders, Triceps)');
    console.log('   Fri: Pull (Back, Biceps)');
    console.log('   ❌ NO LEGS!\n');

    let successCount = 0;
    for (const workout of TEST_WORKOUTS) {
      try {
        await WorkoutSyncService.saveWorkout(workout);
        console.log(`✅ ${workout.title} - ${new Date(workout.date).toLocaleDateString()}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to add ${workout.title}:`, err.message);
      }
    }

    console.log(`\n🎯 Success! Added ${successCount}/${TEST_WORKOUTS.length} workouts`);
    console.log('\n📊 Expected AI Analysis:');
    console.log('   Push: 50% (2 workouts)');
    console.log('   Pull: 50% (2 workouts)');
    console.log('   Legs: 0% ⚠️ UNDERTRAINED');
    console.log('\n💡 AI should recommend: LEGS');

    return {
      success: true,
      workoutsAdded: successCount,
      message: `Test data loaded! Click "What to train today?" - AI should recommend LEGS.`,
    };
  } catch (error) {
    console.error('❌ Error loading test workouts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default loadTestWorkouts;
