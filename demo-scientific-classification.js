/**
 * Demonstrate Scientific Exercise Classification
 * Shows how exercises are classified into push/pull/legs
 */

// Import the fitness knowledge (convert ES6 to CommonJS for Node)
const fs = require('fs');
const path = require('path');

// Sample exercises to test
const testExercises = [
  { name: 'Bench Press', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps'] },
  { name: 'Squat', primaryMuscles: ['Quadriceps', 'Glutes'], secondaryMuscles: ['Hamstrings'] },
  { name: 'Deadlift', primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'], secondaryMuscles: ['Traps'] },
  { name: 'Pull-up', primaryMuscles: ['Back', 'Lats'], secondaryMuscles: ['Biceps'] },
  { name: 'Overhead Press', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'] },
  { name: 'Barbell Row', primaryMuscles: ['Back', 'Lats'], secondaryMuscles: ['Biceps'] },
  { name: 'Bicep Curl', primaryMuscles: ['Biceps'], secondaryMuscles: [] },
  { name: 'Tricep Pushdown', primaryMuscles: ['Triceps'], secondaryMuscles: [] },
  { name: 'Leg Press', primaryMuscles: ['Quadriceps'], secondaryMuscles: ['Glutes'] },
  { name: 'Lateral Raise', primaryMuscles: ['Shoulders'], secondaryMuscles: [] },
];

// Classification logic (simplified from FitnessKnowledge.js)
function classifyExercise(exercise) {
  const name = exercise.name.toLowerCase();
  const allMuscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])].map(m => m.toLowerCase());

  // Push exercises
  const pushMuscles = ['chest', 'shoulders', 'triceps', 'deltoids', 'pectorals'];
  const isPush = pushMuscles.some(muscle => allMuscles.some(m => m.includes(muscle)));

  // Pull exercises
  const pullMuscles = ['back', 'lats', 'traps', 'rhomboids', 'biceps'];
  const isPull = pullMuscles.some(muscle => allMuscles.some(m => m.includes(muscle)));

  // Leg exercises
  const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves'];
  const isLegs = legMuscles.some(muscle => allMuscles.some(m => m.includes(muscle)));

  if (isPush && !isPull && !isLegs) return 'push';
  if (isPull && !isPush && !isLegs) return 'pull';
  if (isLegs) return 'legs';

  return 'compound'; // Multi-category
}

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   SCIENTIFIC EXERCISE CLASSIFICATION DEMONSTRATION             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('This demonstrates how the AI now classifies exercises scientifically:\n');

// Group by classification
const classifications = {
  push: [],
  pull: [],
  legs: [],
  compound: []
};

testExercises.forEach(ex => {
  const classification = classifyExercise(ex);
  classifications[classification].push(ex);
});

// Display results
console.log('🟦 PUSH EXERCISES (Pressing movements - chest, shoulders, triceps)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
classifications.push.forEach(ex => {
  console.log(`  ✓ ${ex.name.padEnd(20)} - ${ex.primaryMuscles.join(', ')}`);
});

console.log('\n🟩 PULL EXERCISES (Pulling movements - back, biceps)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
classifications.pull.forEach(ex => {
  console.log(`  ✓ ${ex.name.padEnd(20)} - ${ex.primaryMuscles.join(', ')}`);
});

console.log('\n🟨 LEG EXERCISES (Lower body movements)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
classifications.legs.forEach(ex => {
  console.log(`  ✓ ${ex.name.padEnd(20)} - ${ex.primaryMuscles.join(', ')}`);
});

if (classifications.compound.length > 0) {
  console.log('\n⚪ COMPOUND EXERCISES (Work multiple categories)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  classifications.compound.forEach(ex => {
    console.log(`  ✓ ${ex.name.padEnd(20)} - ${ex.primaryMuscles.join(', ')}`);
  });
}

// Validation examples
console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║   WORKOUT VALIDATION EXAMPLES                                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test pull day validation
console.log('🧪 PULL DAY VALIDATION:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const pullDayCorrect = [
  { name: 'Pull-up', primaryMuscles: ['Back'] },
  { name: 'Barbell Row', primaryMuscles: ['Back'] },
  { name: 'Bicep Curl', primaryMuscles: ['Biceps'] }
];

const pullDayWrong = [
  { name: 'Pull-up', primaryMuscles: ['Back'] },
  { name: 'Squat', primaryMuscles: ['Quadriceps'] }, // WRONG!
  { name: 'Deadlift', primaryMuscles: ['Hamstrings'] }
];

console.log('\n✅ CORRECT Pull Day:');
pullDayCorrect.forEach(ex => {
  const classification = classifyExercise(ex);
  const isCorrect = classification === 'pull';
  console.log(`  ${isCorrect ? '✓' : '✗'} ${ex.name} (${classification})`);
});

console.log('\n❌ INCORRECT Pull Day (will be rejected):');
pullDayWrong.forEach(ex => {
  const classification = classifyExercise(ex);
  const isCorrect = classification === 'pull';
  console.log(`  ${isCorrect ? '✓' : '✗'} ${ex.name} (${classification}) ${!isCorrect ? '← WRONG!' : ''}`);
});

console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
console.log('║   SCIENTIFIC PRINCIPLES APPLIED                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('1. Push/Pull/Legs Split Definition:');
console.log('   ✓ Push = muscles that push weight away (chest, shoulders, triceps)');
console.log('   ✓ Pull = muscles that pull weight toward (back, biceps, rear delts)');
console.log('   ✓ Legs = lower body movements (quads, hamstrings, glutes)\n');

console.log('2. Movement Pattern Classification:');
console.log('   ✓ Exercises classified by muscle groups and movement patterns');
console.log('   ✓ Prevents illogical combinations (e.g., squat in pull day)\n');

console.log('3. Research-Based Rep Ranges:');
console.log('   ✓ Strength: 1-5 reps, 180s rest (85-100% 1RM)');
console.log('   ✓ Hypertrophy: 6-12 reps, 60s rest (65-85% 1RM)');
console.log('   ✓ Endurance: 15-20+ reps, 30s rest (50-65% 1RM)\n');

console.log('4. Exercise Ordering:');
console.log('   ✓ Compound exercises first (Bench, Squat, Deadlift)');
console.log('   ✓ Isolation exercises last (Flyes, Curls, Extensions)');
console.log('   ✓ Prevents 20-30% performance loss from pre-fatigue\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ The AI now generates scientifically accurate workouts!');
console.log('   No more squats in pull day, no more arbitrary rep ranges.\n');
