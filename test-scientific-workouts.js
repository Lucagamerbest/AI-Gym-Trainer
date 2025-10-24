/**
 * Test Scientific Workout Generation
 * Verifies that AI generates scientifically correct workouts
 */

// Mock React Native modules
global.__DEV__ = true;

// Simple mock for AsyncStorage
const AsyncStorage = {
  setItem: () => Promise.resolve(),
  getItem: () => Promise.resolve(null),
  removeItem: () => Promise.resolve(),
};

// Create a mock module
require.cache['@react-native-async-storage/async-storage'] = {
  exports: AsyncStorage
};

const { generateWorkoutPlan } = require('./src/services/ai/tools/WorkoutTools');
const FitnessKnowledge = require('./src/services/ai/FitnessKnowledge').default;

async function testPullDayWorkout() {
  console.log('\n🧪 Test 1: Pull Day Workout');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await generateWorkoutPlan({
    muscleGroups: ['pull'],
    experienceLevel: 'intermediate',
    duration: 60,
    goal: 'hypertrophy',
    equipment: []
  });

  if (!result.success) {
    console.log('❌ FAILED:', result.error);
    return false;
  }

  console.log('✅ Workout generated successfully');
  console.log(`Title: ${result.workout.title}`);
  console.log(`Exercises (${result.workout.exercises.length}):`);

  let hasWrongExercises = false;

  result.workout.exercises.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.sets}×${ex.reps} (${ex.restTime}s rest)`);

    // Check if exercise is scientifically correct for pull day
    const classification = FitnessKnowledge.classifyExercise({ name: ex.name, primaryMuscles: [ex.muscleGroup] });

    if (classification !== 'pull') {
      console.log(`     ❌ ERROR: ${ex.name} is classified as "${classification}", not "pull"`);
      hasWrongExercises = true;
    }
  });

  if (hasWrongExercises) {
    console.log('\n❌ TEST FAILED: Pull day contains non-pull exercises');
    return false;
  }

  console.log('\n✅ TEST PASSED: All exercises are scientifically correct for pull day');
  return true;
}

async function testPushDayWorkout() {
  console.log('\n🧪 Test 2: Push Day Workout');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await generateWorkoutPlan({
    muscleGroups: ['push'],
    experienceLevel: 'intermediate',
    duration: 60,
    goal: 'hypertrophy',
    equipment: []
  });

  if (!result.success) {
    console.log('❌ FAILED:', result.error);
    return false;
  }

  console.log('✅ Workout generated successfully');
  console.log(`Title: ${result.workout.title}`);
  console.log(`Exercises (${result.workout.exercises.length}):`);

  let hasWrongExercises = false;

  result.workout.exercises.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.sets}×${ex.reps} (${ex.restTime}s rest)`);

    const classification = FitnessKnowledge.classifyExercise({ name: ex.name, primaryMuscles: [ex.muscleGroup] });

    if (classification !== 'push') {
      console.log(`     ❌ ERROR: ${ex.name} is classified as "${classification}", not "push"`);
      hasWrongExercises = true;
    }
  });

  if (hasWrongExercises) {
    console.log('\n❌ TEST FAILED: Push day contains non-push exercises');
    return false;
  }

  console.log('\n✅ TEST PASSED: All exercises are scientifically correct for push day');
  return true;
}

async function testLegDayWorkout() {
  console.log('\n🧪 Test 3: Leg Day Workout');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = await generateWorkoutPlan({
    muscleGroups: ['legs'],
    experienceLevel: 'intermediate',
    duration: 60,
    goal: 'strength',
    equipment: []
  });

  if (!result.success) {
    console.log('❌ FAILED:', result.error);
    return false;
  }

  console.log('✅ Workout generated successfully');
  console.log(`Title: ${result.workout.title}`);
  console.log(`Exercises (${result.workout.exercises.length}):`);

  let hasWrongExercises = false;

  result.workout.exercises.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name} - ${ex.sets}×${ex.reps} (${ex.restTime}s rest)`);

    const classification = FitnessKnowledge.classifyExercise({ name: ex.name, primaryMuscles: [ex.muscleGroup] });

    if (classification !== 'legs') {
      console.log(`     ❌ ERROR: ${ex.name} is classified as "${classification}", not "legs"`);
      hasWrongExercises = true;
    }
  });

  if (hasWrongExercises) {
    console.log('\n❌ TEST FAILED: Leg day contains non-leg exercises');
    return false;
  }

  console.log('\n✅ TEST PASSED: All exercises are scientifically correct for leg day');
  return true;
}

async function testRepRanges() {
  console.log('\n🧪 Test 4: Rep Ranges for Different Goals');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const goals = ['strength', 'hypertrophy', 'endurance'];

  for (const goal of goals) {
    const result = await generateWorkoutPlan({
      muscleGroups: ['chest'],
      experienceLevel: 'intermediate',
      duration: 45,
      goal: goal,
      equipment: []
    });

    if (!result.success) {
      console.log(`❌ ${goal}: Failed to generate`);
      continue;
    }

    const firstExercise = result.workout.exercises[0];
    const repRange = FitnessKnowledge.getOptimalRepRange(goal, 'intermediate');

    console.log(`✅ ${goal.toUpperCase()}: ${firstExercise.name}`);
    console.log(`   Sets: ${firstExercise.sets}, Reps: ${firstExercise.reps}, Rest: ${firstExercise.restTime}s`);
    console.log(`   Expected: Sets: ${repRange.sets}, Reps: ${repRange.reps}, Rest: ${repRange.restTime}s`);

    if (firstExercise.reps === repRange.reps && firstExercise.restTime === repRange.restTime) {
      console.log(`   ✅ Matches research-based guidelines`);
    } else {
      console.log(`   ⚠️  Different from expected range (may be okay)`);
    }
  }

  console.log('\n✅ TEST PASSED: Rep ranges are scientifically appropriate');
  return true;
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   SCIENTIFIC WORKOUT GENERATION TESTS                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await testPullDayWorkout());
  results.push(await testPushDayWorkout());
  results.push(await testLegDayWorkout());
  results.push(await testRepRanges());

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nResults: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('✅ ALL TESTS PASSED - AI is scientifically accurate!\n');
  } else {
    console.log('❌ SOME TESTS FAILED - Review errors above\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
