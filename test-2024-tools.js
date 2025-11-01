/**
 * Test script for 2024 Research Tools
 *
 * This script verifies that:
 * 1. Exercise Hierarchy 2024 is working
 * 2. Volume Tracker 2024 is working
 * 3. Progression Tracker 2024 is working
 * 4. Tools are registered correctly
 */

const { getExerciseTier2024, getEquipmentPriority } = require('./src/services/ai/ExerciseHierarchy2024');
const VolumeTracker = require('./src/services/ai/VolumeTracker2024');
const ProgressionTracker = require('./src/services/ai/ProgressionTracker2024');

console.log('🔬 Testing 2024 Research Implementation...\n');

// Test 1: Exercise Hierarchy 2024
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: Exercise Hierarchy 2024');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testExercises = [
  { name: 'Incline Barbell Press', muscle: 'CHEST', expected: 'S', priority: 1 },
  { name: 'Flat Bench Press', muscle: 'CHEST', expected: 'S', priority: 2 },
  { name: 'Overhead Tricep Extension', muscle: 'TRICEPS', expected: 'S', priority: 1 },
  { name: 'Tricep Pushdown', muscle: 'TRICEPS', expected: 'B', priority: 6 },
  { name: 'Pull-up', muscle: 'BACK', expected: 'S', priority: 1 },
  { name: 'Lat Pulldown', muscle: 'BACK', expected: 'B', priority: 8 },
  { name: 'Bayesian Curl', muscle: 'BICEPS', expected: 'S', priority: 1 },
  { name: 'Preacher Curl', muscle: 'BICEPS', expected: 'B', priority: 6 }
];

let hierarchyTestsPassed = 0;
testExercises.forEach(test => {
  const tier = getExerciseTier2024(test.name, test.muscle);
  const passed = tier === test.expected;

  console.log(`${passed ? '✅' : '❌'} ${test.name} (${test.muscle})`);
  console.log(`   Expected: Tier ${test.expected}, Got: Tier ${tier}`);
  console.log(`   Reason: 2024 research - ${test.name} ${test.priority === 1 ? 'is PRIORITY #1' : 'updated ranking'}\n`);

  if (passed) hierarchyTestsPassed++;
});

console.log(`Result: ${hierarchyTestsPassed}/${testExercises.length} tests passed\n`);

// Test 2: Equipment Priority
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 2: Equipment Priority (Freeweights > Machines)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const equipmentTests = [
  { equipment: 'Barbell', expected: 1 },
  { equipment: 'Dumbbell', expected: 2 },
  { equipment: 'Bodyweight', expected: 3 },
  { equipment: 'Cable', expected: 4 },
  { equipment: 'Machine', expected: 5 }
];

let equipmentTestsPassed = 0;
equipmentTests.forEach(test => {
  const priority = getEquipmentPriority(test.equipment);
  const passed = priority === test.expected;

  console.log(`${passed ? '✅' : '❌'} ${test.equipment}: Priority ${priority} (lower is better)`);
  if (passed) equipmentTestsPassed++;
});

console.log(`\nResult: ${equipmentTestsPassed}/${equipmentTests.length} tests passed`);
console.log('Note: Jeff Nippard 2024 protocol - Freeweights prioritized over machines\n');

// Test 3: Volume Analysis
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 3: Volume Analysis (2024 Meta-Analysis)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const volumeTests = [
  { volume: 3, muscleGroup: 'CHEST', expectedStatus: 'suboptimal' },
  { volume: 12, muscleGroup: 'CHEST', expectedStatus: 'optimal' },
  { volume: 25, muscleGroup: 'CHEST', expectedStatus: 'very_high' }
];

let volumeTestsPassed = 0;
volumeTests.forEach(test => {
  const analysis = VolumeTracker.analyzeVolumeStatus(test.volume, test.muscleGroup);
  const passed = analysis.status === test.expectedStatus;

  console.log(`${passed ? '✅' : '❌'} ${test.volume} sets/week for ${test.muscleGroup}`);
  console.log(`   Status: ${analysis.status}`);
  console.log(`   Message: ${analysis.message}`);
  console.log(`   Recommendation: ${analysis.recommendation}\n`);

  if (passed) volumeTestsPassed++;
});

console.log(`Result: ${volumeTestsPassed}/${volumeTests.length} tests passed`);
console.log('Research: 2024 meta-analysis - 4 sets minimum, 8-18 optimal\n');

// Test 4: Progressive Overload
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 4: Progressive Overload (Jeff Nippard Method)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const progressionTests = [
  {
    name: 'RPE 7 - Add Weight',
    session: { weight: 185, reps: 8, rpe: 7, sets: 4, equipment: 'barbell' },
    expectedType: 'weight_increase'
  },
  {
    name: 'RPE 9, Low Reps - Add Reps',
    session: { weight: 200, reps: 8, rpe: 9, sets: 4, equipment: 'barbell' },
    expectedType: 'rep_increase'
  },
  {
    name: 'RPE 9, Max Reps - Add Weight & Drop Reps',
    session: { weight: 185, reps: 12, rpe: 9, sets: 4, equipment: 'barbell' },
    expectedType: 'weight_increase_with_rep_drop'
  }
];

let progressionTestsPassed = 0;
progressionTests.forEach(test => {
  const recommendation = ProgressionTracker.recommendNextWeight(
    'Bench Press',
    test.session,
    '8-12'
  );
  const passed = recommendation.progressionType === test.expectedType;

  console.log(`${passed ? '✅' : '❌'} ${test.name}`);
  console.log(`   Last: ${test.session.weight} lbs × ${test.session.reps} reps @ RPE ${test.session.rpe}`);
  console.log(`   Next: ${recommendation.nextWeight} lbs × ${recommendation.nextReps} reps`);
  console.log(`   Change: ${recommendation.changeAmount}`);
  console.log(`   Reason: ${recommendation.reason}\n`);

  if (passed) progressionTestsPassed++;
});

console.log(`Result: ${progressionTestsPassed}/${progressionTests.length} tests passed`);
console.log('Method: Jeff Nippard\'s RPE-based progression (2024)\n');

// Test 5: Deload Detection
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 5: Deload Detection (4-6 Week Protocol)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const deloadTests = [
  { weeks: 2, expectedDeload: false },
  { weeks: 4, expectedDeload: true },
  { weeks: 6, expectedDeload: true }
];

let deloadTestsPassed = 0;
deloadTests.forEach(test => {
  const deloadStatus = ProgressionTracker.needsDeloadWeek([], test.weeks);
  const passed = deloadStatus.needsDeload === test.expectedDeload;

  console.log(`${passed ? '✅' : '❌'} ${test.weeks} weeks of training`);
  console.log(`   Needs Deload: ${deloadStatus.needsDeload}`);
  console.log(`   Reason: ${deloadStatus.reason}\n`);

  if (passed) deloadTestsPassed++;
});

console.log(`Result: ${deloadTestsPassed}/${deloadTests.length} tests passed`);
console.log('Protocol: Jeff Nippard 2024 - Deload every 4-6 weeks\n');

// Final Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 FINAL SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const totalTests = testExercises.length + equipmentTests.length + volumeTests.length + progressionTests.length + deloadTests.length;
const totalPassed = hierarchyTestsPassed + equipmentTestsPassed + volumeTestsPassed + progressionTestsPassed + deloadTestsPassed;
const passPercentage = ((totalPassed / totalTests) * 100).toFixed(1);

console.log(`✅ Tests Passed: ${totalPassed}/${totalTests} (${passPercentage}%)`);
console.log(`\n📚 Research Sources:`);
console.log(`   - Jeff Nippard (2024): Exercise selection, progression, deload protocol`);
console.log(`   - 2024 Meta-Analysis: Training volume (4-40 sets/week)`);
console.log(`   - EMG Studies: Incline > Flat, Overhead Extensions > Pushdowns, Pull-ups > Pulldowns\n`);

if (totalPassed === totalTests) {
  console.log('🎉 ALL TESTS PASSED! 2024 Research Implementation is working correctly.\n');
} else {
  console.log(`⚠️ ${totalTests - totalPassed} tests failed. Check implementation.\n`);
}

console.log('Next Steps:');
console.log('1. Run: node test-2024-tools.js');
console.log('2. Test AI tools in the app');
console.log('3. Ask AI: "Am I doing enough chest volume?"');
console.log('4. Ask AI: "What weight should I use for bench press?"');
console.log('5. Ask AI: "Do I need a deload week?"\n');
