/**
 * Seed Test Workout Data
 *
 * Run this script to add test workouts to the database:
 * node scripts/seedTestData.js
 *
 * OR from the root directory:
 * npm run seed-test-data
 */

import { seedTestWorkouts } from '../src/services/backend/seedTestWorkouts.js';

async function main() {
  console.log('🚀 Starting test data seeding...\n');

  try {
    const result = await seedTestWorkouts();

    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log(`📊 Added ${result.workoutsAdded} test workouts`);
      console.log('\n🧪 Test the AI recommendation:');
      console.log('   1. Open the app');
      console.log('   2. Go to AI Chat');
      console.log('   3. Ask: "What should I train today?"');
      console.log('   4. AI should analyze the data and recommend: LEGS');
      console.log('\n💡 Why? Because you have:');
      console.log('   • Push: 50% (2 workouts)');
      console.log('   • Pull: 50% (2 workouts)');
      console.log('   • Legs: 0% (0 workouts) ⚠️ IMBALANCE\n');
    } else {
      console.error('\n❌ FAILED:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
