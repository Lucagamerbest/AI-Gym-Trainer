/**
 * TEST DATA SEEDER - Add realistic workout history for testing
 *
 * This adds 4 workouts this week:
 * - Monday: Push Day
 * - Tuesday: Pull Day
 * - Thursday: Push Day
 * - Friday: Pull Day
 *
 * AI should detect: "You need to train LEGS - you've done Push/Pull but no legs this week"
 */

import WorkoutSyncService from './WorkoutSyncService';

/**
 * Get date for LAST WEEK - so AI has complete workout history to analyze
 */
function getThisWeekDate(dayOfWeek) {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate Monday of LAST week
  const monday = new Date(now);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(now.getDate() - daysFromMonday - 7); // Go back 7 more days to get last week
  monday.setHours(10, 0, 0, 0); // Set to 10:00 AM

  // Add dayOfWeek offset: 0 = Monday, 1 = Tuesday, ..., 4 = Friday
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + dayOfWeek);

  return targetDate.toISOString();
}

/**
 * Realistic test workouts
 */
const TEST_WORKOUTS = [
  // ========================================
  // MONDAY - PUSH DAY
  // ========================================
  {
    title: 'Push - Chest, Shoulders, Triceps',
    date: getThisWeekDate(0), // Monday (0 days from Monday)
    duration: 65, // minutes
    exercises: [
      {
        name: 'Bench Press',
        equipment: 'Barbell',
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps', 'Front Deltoids'],
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 6, completed: true },
          { weight: 225, reps: 5, completed: true },
        ],
      },
      {
        name: 'Overhead Press',
        equipment: 'Barbell',
        primaryMuscles: ['Shoulders', 'Front Deltoids'],
        secondaryMuscles: ['Triceps'],
        sets: [
          { weight: 95, reps: 8, completed: true },
          { weight: 115, reps: 6, completed: true },
          { weight: 135, reps: 5, completed: true },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        equipment: 'Dumbbell',
        primaryMuscles: ['Chest', 'Upper Chest'],
        secondaryMuscles: ['Front Deltoids', 'Triceps'],
        sets: [
          { weight: 60, reps: 10, completed: true },
          { weight: 70, reps: 8, completed: true },
          { weight: 75, reps: 7, completed: true },
        ],
      },
      {
        name: 'Lateral Raise',
        equipment: 'Dumbbell',
        primaryMuscles: ['Shoulders', 'Side Deltoids'],
        sets: [
          { weight: 25, reps: 12, completed: true },
          { weight: 25, reps: 12, completed: true },
          { weight: 25, reps: 10, completed: true },
        ],
      },
      {
        name: 'Tricep Pushdown',
        equipment: 'Cable',
        primaryMuscles: ['Triceps'],
        sets: [
          { weight: 60, reps: 12, completed: true },
          { weight: 70, reps: 10, completed: true },
          { weight: 70, reps: 10, completed: true },
        ],
      },
      {
        name: 'Cable Flyes',
        equipment: 'Cable',
        primaryMuscles: ['Chest'],
        sets: [
          { weight: 30, reps: 15, completed: true },
          { weight: 30, reps: 12, completed: true },
          { weight: 30, reps: 12, completed: true },
        ],
      },
    ],
    totalVolume: 12450, // calculated volume
    notes: 'Felt strong today, PRed on bench!',
  },

  // ========================================
  // TUESDAY - PULL DAY
  // ========================================
  {
    title: 'Pull - Back, Biceps',
    date: getThisWeekDate(1), // Tuesday (1 day from Monday)
    duration: 70,
    exercises: [
      {
        name: 'Pull-ups',
        equipment: 'Bodyweight',
        primaryMuscles: ['Back', 'Lats'],
        secondaryMuscles: ['Biceps'],
        sets: [
          { weight: 0, reps: 10, completed: true },
          { weight: 0, reps: 8, completed: true },
          { weight: 0, reps: 7, completed: true },
        ],
      },
      {
        name: 'Barbell Row',
        equipment: 'Barbell',
        primaryMuscles: ['Back', 'Lats', 'Traps'],
        secondaryMuscles: ['Biceps', 'Rear Deltoids'],
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 8, completed: true },
          { weight: 225, reps: 6, completed: true },
        ],
      },
      {
        name: 'Cable Row',
        equipment: 'Cable',
        primaryMuscles: ['Back', 'Rhomboids', 'Traps'],
        secondaryMuscles: ['Biceps'],
        sets: [
          { weight: 120, reps: 12, completed: true },
          { weight: 140, reps: 10, completed: true },
          { weight: 140, reps: 10, completed: true },
        ],
      },
      {
        name: 'Face Pull',
        equipment: 'Cable',
        primaryMuscles: ['Rear Deltoids', 'Traps'],
        sets: [
          { weight: 50, reps: 15, completed: true },
          { weight: 60, reps: 12, completed: true },
          { weight: 60, reps: 12, completed: true },
        ],
      },
      {
        name: 'Barbell Curl',
        equipment: 'Barbell',
        primaryMuscles: ['Biceps'],
        sets: [
          { weight: 75, reps: 10, completed: true },
          { weight: 85, reps: 8, completed: true },
          { weight: 85, reps: 7, completed: true },
        ],
      },
      {
        name: 'Hammer Curl',
        equipment: 'Dumbbell',
        primaryMuscles: ['Biceps', 'Brachialis'],
        sets: [
          { weight: 35, reps: 12, completed: true },
          { weight: 40, reps: 10, completed: true },
          { weight: 40, reps: 8, completed: true },
        ],
      },
    ],
    totalVolume: 13200,
    notes: 'Great pump today, back felt thick!',
  },

  // ========================================
  // THURSDAY - PUSH DAY
  // ========================================
  {
    title: 'Push - Chest, Shoulders, Triceps',
    date: getThisWeekDate(3), // Thursday (3 days from Monday)
    duration: 68,
    exercises: [
      {
        name: 'Bench Press',
        equipment: 'Barbell',
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps', 'Front Deltoids'],
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 8, completed: true },
          { weight: 205, reps: 7, completed: true },
          { weight: 215, reps: 5, completed: true },
        ],
      },
      {
        name: 'Overhead Press',
        equipment: 'Barbell',
        primaryMuscles: ['Shoulders', 'Front Deltoids'],
        secondaryMuscles: ['Triceps'],
        sets: [
          { weight: 95, reps: 8, completed: true },
          { weight: 115, reps: 7, completed: true },
          { weight: 125, reps: 6, completed: true },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        equipment: 'Dumbbell',
        primaryMuscles: ['Chest', 'Upper Chest'],
        secondaryMuscles: ['Front Deltoids', 'Triceps'],
        sets: [
          { weight: 65, reps: 10, completed: true },
          { weight: 70, reps: 8, completed: true },
          { weight: 75, reps: 7, completed: true },
        ],
      },
      {
        name: 'Lateral Raise',
        equipment: 'Dumbbell',
        primaryMuscles: ['Shoulders', 'Side Deltoids'],
        sets: [
          { weight: 25, reps: 15, completed: true },
          { weight: 30, reps: 12, completed: true },
          { weight: 30, reps: 10, completed: true },
        ],
      },
      {
        name: 'Tricep Pushdown',
        equipment: 'Cable',
        primaryMuscles: ['Triceps'],
        sets: [
          { weight: 60, reps: 15, completed: true },
          { weight: 70, reps: 12, completed: true },
          { weight: 80, reps: 10, completed: true },
        ],
      },
      {
        name: 'Overhead Tricep Extension',
        equipment: 'Dumbbell',
        primaryMuscles: ['Triceps'],
        sets: [
          { weight: 50, reps: 12, completed: true },
          { weight: 55, reps: 10, completed: true },
          { weight: 55, reps: 9, completed: true },
        ],
      },
    ],
    totalVolume: 12780,
    notes: 'Felt a bit tired but pushed through',
  },

  // ========================================
  // FRIDAY - PULL DAY
  // ========================================
  {
    title: 'Pull - Back, Biceps',
    date: getThisWeekDate(4), // Friday (4 days from Monday)
    duration: 72,
    exercises: [
      {
        name: 'Pull-ups',
        equipment: 'Bodyweight',
        primaryMuscles: ['Back', 'Lats'],
        secondaryMuscles: ['Biceps'],
        sets: [
          { weight: 0, reps: 12, completed: true },
          { weight: 0, reps: 10, completed: true },
          { weight: 0, reps: 8, completed: true },
        ],
      },
      {
        name: 'Barbell Row',
        equipment: 'Barbell',
        primaryMuscles: ['Back', 'Lats', 'Traps'],
        secondaryMuscles: ['Biceps', 'Rear Deltoids'],
        sets: [
          { weight: 135, reps: 10, completed: true },
          { weight: 185, reps: 10, completed: true },
          { weight: 205, reps: 8, completed: true },
          { weight: 215, reps: 7, completed: true },
        ],
      },
      {
        name: 'T-Bar Row',
        equipment: 'T-Bar',
        primaryMuscles: ['Back', 'Rhomboids'],
        secondaryMuscles: ['Biceps', 'Traps'],
        sets: [
          { weight: 90, reps: 12, completed: true },
          { weight: 115, reps: 10, completed: true },
          { weight: 115, reps: 9, completed: true },
        ],
      },
      {
        name: 'Face Pull',
        equipment: 'Cable',
        primaryMuscles: ['Rear Deltoids', 'Traps'],
        sets: [
          { weight: 50, reps: 20, completed: true },
          { weight: 60, reps: 15, completed: true },
          { weight: 70, reps: 12, completed: true },
        ],
      },
      {
        name: 'Barbell Curl',
        equipment: 'Barbell',
        primaryMuscles: ['Biceps'],
        sets: [
          { weight: 75, reps: 12, completed: true },
          { weight: 85, reps: 10, completed: true },
          { weight: 95, reps: 7, completed: true },
        ],
      },
      {
        name: 'Hammer Curl',
        equipment: 'Dumbbell',
        primaryMuscles: ['Biceps', 'Brachialis'],
        sets: [
          { weight: 35, reps: 15, completed: true },
          { weight: 40, reps: 12, completed: true },
          { weight: 45, reps: 10, completed: true },
        ],
      },
    ],
    totalVolume: 14100,
    notes: 'Best pull day yet! Felt amazing, back is sore already',
  },
];

/**
 * Seed test workouts to Firebase
 */
export async function seedTestWorkouts() {
  try {
    console.log('🌱 Seeding test workout data...');
    console.log(`📅 Last week's workouts (for AI analysis):`);
    console.log('   Monday Oct 20: Push Day (Chest, Shoulders, Triceps)');
    console.log('   Tuesday Oct 21: Pull Day (Back, Biceps)');
    console.log('   Thursday Oct 23: Push Day (Chest, Shoulders, Triceps)');
    console.log('   Friday Oct 24: Pull Day (Back, Biceps)');
    console.log('   ❌ NO LEG DAYS - AI should recommend LEGS!\n');

    for (const workout of TEST_WORKOUTS) {
      const workoutId = await WorkoutSyncService.saveWorkout(workout);
      console.log(`✅ Added: ${workout.title} (${new Date(workout.date).toLocaleDateString()})`);
    }

    console.log('\n🎯 Test data seeded successfully!');
    console.log('📊 Analysis should show:');
    console.log('   - Push: 50% (2 workouts)');
    console.log('   - Pull: 50% (2 workouts)');
    console.log('   - Legs: 0% (0 workouts) ⚠️');
    console.log('\n💡 AI should recommend: LEGS (because of muscle imbalance)');

    return {
      success: true,
      workoutsAdded: TEST_WORKOUTS.length,
      message: 'Test workouts seeded successfully. AI should now recommend LEGS.',
    };
  } catch (error) {
    console.error('❌ Error seeding test workouts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export for use in app
export default seedTestWorkouts;
