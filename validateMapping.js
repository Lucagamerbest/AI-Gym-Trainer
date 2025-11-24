const fs = require('fs');

// Load files
const mapping = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json', 'utf8'));
const freeExerciseDB = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\free_exercise_db.json', 'utf8'));
const exerciseList = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_list.json', 'utf8'));

// Create lookup
const dbLookup = {};
for (const ex of freeExerciseDB) {
  dbLookup[ex.id] = ex;
}

console.log('=== VALIDATION REPORT ===\n');

// Validation metrics
let totalVariants = 0;
let validMappings = 0;
let invalidMappings = 0;
const errors = [];

// Validate each mapping
for (const exercise of exerciseList) {
  const exerciseName = exercise.name;

  if (!mapping[exerciseName]) {
    errors.push(`ERROR: Exercise "${exerciseName}" not found in mapping`);
    continue;
  }

  for (const variant of exercise.variants) {
    totalVariants++;
    const equipment = variant.equipment;
    const mappedId = mapping[exerciseName][equipment];

    if (!mappedId) {
      errors.push(`ERROR: No mapping for ${exerciseName} - ${equipment}`);
      invalidMappings++;
      continue;
    }

    if (!dbLookup[mappedId]) {
      errors.push(`ERROR: Invalid ID "${mappedId}" for ${exerciseName} - ${equipment}`);
      invalidMappings++;
      continue;
    }

    validMappings++;
  }
}

// Print results
console.log(`Total exercise variants: ${totalVariants}`);
console.log(`Valid mappings: ${validMappings}`);
console.log(`Invalid mappings: ${invalidMappings}`);
console.log(`Success rate: ${((validMappings / totalVariants) * 100).toFixed(2)}%\n`);

if (errors.length > 0) {
  console.log('=== ERRORS ===');
  errors.forEach(err => console.log(err));
} else {
  console.log('✅ ALL MAPPINGS VALIDATED SUCCESSFULLY!\n');
}

// Generate sample URLs to test
console.log('=== SAMPLE IMAGE URLS ===\n');
const samples = [
  ['Bench Press', 'Barbell'],
  ['Squat', 'Barbell Back'],
  ['Bicep Curl', 'Dumbbell Standing'],
  ['Pull Ups', 'Wide Grip'],
  ['Plank', 'Bodyweight']
];

samples.forEach(([exercise, equipment]) => {
  const id = mapping[exercise]?.[equipment];
  if (id) {
    const url0 = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/0.jpg`;
    const url1 = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/1.jpg`;
    console.log(`${exercise} (${equipment}):`);
    console.log(`  Start: ${url0}`);
    console.log(`  End:   ${url1}\n`);
  }
});

// Generate statistics by muscle group
console.log('=== STATISTICS BY MUSCLE GROUP ===\n');
const byMuscle = {};

for (const ex of exerciseList) {
  const group = ex.muscleGroup;
  if (!byMuscle[group]) {
    byMuscle[group] = { exercises: 0, variants: 0 };
  }
  byMuscle[group].exercises++;
  byMuscle[group].variants += ex.variants.length;
}

Object.keys(byMuscle).sort().forEach(group => {
  const stats = byMuscle[group];
  console.log(`${group}: ${stats.exercises} exercises, ${stats.variants} variants`);
});

console.log('\n=== VALIDATION COMPLETE ===');
