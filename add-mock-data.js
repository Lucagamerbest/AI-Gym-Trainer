/**
 * Mock Data Generator for AI Gym Trainer
 * Run this script to add realistic workout and nutrition history for testing
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Helper to generate dates going backwards
function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Mock workout data (60 days of history)
const mockWorkouts = [
  // Week 1 (54-60 days ago) - Starting point
  {
    id: `workout_${Date.now() - 60 * 24 * 60 * 60 * 1000}_1`,
    date: getDaysAgo(60),
    name: 'Chest Day',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: [
          { weight: 60, reps: 8, completed: true },
          { weight: 60, reps: 8, completed: true },
          { weight: 60, reps: 7, completed: true },
        ]
      },
      {
        name: 'Incline Dumbbell Press',
        sets: [
          { weight: 45, reps: 10, completed: true },
          { weight: 45, reps: 9, completed: true },
          { weight: 45, reps: 8, completed: true },
        ]
      }
    ],
    duration: 45,
    synced: true
  },

  {
    id: `workout_${Date.now() - 57 * 24 * 60 * 60 * 1000}_2`,
    date: getDaysAgo(57),
    name: 'Back Day',
    exercises: [
      {
        name: 'Barbell Row',
        sets: [
          { weight: 95, reps: 8, completed: true },
          { weight: 95, reps: 8, completed: true },
          { weight: 95, reps: 7, completed: true },
        ]
      },
      {
        name: 'Lat Pulldown',
        sets: [
          { weight: 80, reps: 10, completed: true },
          { weight: 80, reps: 10, completed: true },
          { weight: 80, reps: 9, completed: true },
        ]
      }
    ],
    duration: 50,
    synced: true
  },

  // Week 2 (47-53 days ago) - Progressive overload
  {
    id: `workout_${Date.now() - 53 * 24 * 60 * 60 * 1000}_3`,
    date: getDaysAgo(53),
    name: 'Chest Day',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: [
          { weight: 65, reps: 8, completed: true },
          { weight: 65, reps: 8, completed: true },
          { weight: 65, reps: 7, completed: true },
        ]
      },
      {
        name: 'Incline Dumbbell Press',
        sets: [
          { weight: 50, reps: 10, completed: true },
          { weight: 50, reps: 9, completed: true },
          { weight: 50, reps: 8, completed: true },
        ]
      }
    ],
    duration: 47,
    synced: true
  },

  {
    id: `workout_${Date.now() - 50 * 24 * 60 * 60 * 1000}_4`,
    date: getDaysAgo(50),
    name: 'Leg Day',
    exercises: [
      {
        name: 'Barbell Squat',
        sets: [
          { weight: 135, reps: 8, completed: true },
          { weight: 135, reps: 8, completed: true },
          { weight: 135, reps: 7, completed: true },
        ]
      },
      {
        name: 'Romanian Deadlift',
        sets: [
          { weight: 115, reps: 10, completed: true },
          { weight: 115, reps: 10, completed: true },
          { weight: 115, reps: 9, completed: true },
        ]
      }
    ],
    duration: 55,
    synced: true
  },

  // Week 3-8 (continuing progression...)
  // Adding more recent workouts with higher weights
  {
    id: `workout_${Date.now() - 30 * 24 * 60 * 60 * 1000}_5`,
    date: getDaysAgo(30),
    name: 'Chest Day',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: [
          { weight: 70, reps: 8, completed: true },
          { weight: 70, reps: 8, completed: true },
          { weight: 70, reps: 8, completed: true },
        ]
      },
      {
        name: 'Incline Dumbbell Press',
        sets: [
          { weight: 55, reps: 10, completed: true },
          { weight: 55, reps: 10, completed: true },
          { weight: 55, reps: 9, completed: true },
        ]
      }
    ],
    duration: 48,
    synced: true
  },

  {
    id: `workout_${Date.now() - 14 * 24 * 60 * 60 * 1000}_6`,
    date: getDaysAgo(14),
    name: 'Chest Day',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: [
          { weight: 75, reps: 6, completed: true },
          { weight: 75, reps: 6, completed: true },
          { weight: 75, reps: 5, completed: true },
        ]
      },
      {
        name: 'Incline Dumbbell Press',
        sets: [
          { weight: 60, reps: 8, completed: true },
          { weight: 60, reps: 8, completed: true },
          { weight: 60, reps: 7, completed: true },
        ]
      }
    ],
    duration: 50,
    synced: true
  },

  // Most recent workout (current PR)
  {
    id: `workout_${Date.now() - 4 * 24 * 60 * 60 * 1000}_7`,
    date: getDaysAgo(4),
    name: 'Quick Workout',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: [
          { weight: 80, reps: 5, completed: true },
          { weight: 80, reps: 5, completed: true },
          { weight: 80, reps: 5, completed: true },
        ]
      }
    ],
    duration: 25,
    synced: true
  }
];

// Mock nutrition data (last 30 days)
const mockNutritionData = {};

for (let i = 30; i >= 0; i--) {
  const date = getDaysAgo(i);
  const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;

  // Vary calories between 1800-2200 on weekdays, 2200-2500 on weekends
  const baseCal = isWeekend ? 2300 : 2000;
  const variation = Math.floor(Math.random() * 300) - 150;
  const totalCal = baseCal + variation;

  // Calculate macros (40/30/30 split roughly)
  const protein = Math.floor((totalCal * 0.35) / 4); // 35% from protein
  const carbs = Math.floor((totalCal * 0.40) / 4); // 40% from carbs
  const fat = Math.floor((totalCal * 0.25) / 9); // 25% from fat

  mockNutritionData[date] = [
    // Breakfast
    {
      id: `meal_${date}_1`,
      name: 'Eggs and Oatmeal',
      protein: Math.floor(protein * 0.25),
      carbs: Math.floor(carbs * 0.3),
      fat: Math.floor(fat * 0.3),
      calories: Math.floor(totalCal * 0.25),
      timestamp: new Date(`${date}T08:00:00`).toISOString()
    },
    // Lunch
    {
      id: `meal_${date}_2`,
      name: 'Chicken and Rice',
      protein: Math.floor(protein * 0.35),
      carbs: Math.floor(carbs * 0.35),
      fat: Math.floor(fat * 0.25),
      calories: Math.floor(totalCal * 0.35),
      timestamp: new Date(`${date}T12:30:00`).toISOString()
    },
    // Snack
    {
      id: `meal_${date}_3`,
      name: 'Protein Shake',
      protein: Math.floor(protein * 0.15),
      carbs: Math.floor(carbs * 0.10),
      fat: Math.floor(fat * 0.10),
      calories: Math.floor(totalCal * 0.12),
      timestamp: new Date(`${date}T15:00:00`).toISOString()
    },
    // Dinner
    {
      id: `meal_${date}_4`,
      name: 'Salmon and Vegetables',
      protein: Math.floor(protein * 0.25),
      carbs: Math.floor(carbs * 0.25),
      fat: Math.floor(fat * 0.35),
      calories: Math.floor(totalCal * 0.28),
      timestamp: new Date(`${date}T19:00:00`).toISOString()
    }
  ];
}

// Function to add data to AsyncStorage
async function addMockData() {
  try {
    console.log('📊 Adding mock workout data...');
    await AsyncStorage.setItem('workouts', JSON.stringify(mockWorkouts));
    console.log(`✅ Added ${mockWorkouts.length} mock workouts`);

    console.log('🍽️ Adding mock nutrition data...');
    await AsyncStorage.setItem('nutrition_history', JSON.stringify(mockNutritionData));
    console.log(`✅ Added ${Object.keys(mockNutritionData).length} days of nutrition data`);

    console.log('🎉 Mock data added successfully!');
    console.log('\nData summary:');
    console.log(`- Workouts: ${mockWorkouts.length} sessions over 60 days`);
    console.log(`- Nutrition: ${Object.keys(mockNutritionData).length} days of meals`);
    console.log(`- Bench Press PR: 80 lbs x 5 reps (4 days ago)`);
    console.log(`- Progression: 60 lbs → 80 lbs (+20 lbs over 60 days)`);

  } catch (error) {
    console.error('❌ Error adding mock data:', error);
  }
}

// Export for use in React Native app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addMockData, mockWorkouts, mockNutritionData };
}

// Run if executed directly
if (require.main === module) {
  addMockData();
}
