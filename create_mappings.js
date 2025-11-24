const fs = require('fs');

// Load both datasets
const myExercises = JSON.parse(fs.readFileSync('exercise_list.json', 'utf8'));
const freeExerciseDB = JSON.parse(fs.readFileSync('free_exercise_db.json', 'utf8'));

// Create searchable index
const dbIndex = {};
freeExerciseDB.forEach(ex => {
  const name = ex.name.toLowerCase();
  const id = ex.id;
  const equipment = ex.equipment ? ex.equipment.toLowerCase() : '';

  if (!dbIndex[name]) {
    dbIndex[name] = [];
  }
  dbIndex[name].push({ id, equipment, fullName: ex.name });
});

// Mapping object
const mapping = {};
const unmapped = [];

// Helper function to find best match
function findMatch(exerciseName, equipmentType) {
  const searchName = exerciseName.toLowerCase();
  const searchEquipment = equipmentType.toLowerCase();

  // Try exact name match first
  if (dbIndex[searchName]) {
    const matches = dbIndex[searchName].filter(m =>
      m.equipment.includes(searchEquipment) || searchEquipment.includes(m.equipment)
    );
    if (matches.length > 0) return matches[0].id;
  }

  // Try partial name matches
  const nameWords = searchName.split(' ');
  for (let dbName in dbIndex) {
    const dbWords = dbName.split(' ');
    const commonWords = nameWords.filter(w => dbWords.includes(w));

    if (commonWords.length >= 2) {
      const matches = dbIndex[dbName].filter(m =>
        m.equipment.includes(searchEquipment) || searchEquipment.includes(m.equipment)
      );
      if (matches.length > 0) return matches[0].id;
    }
  }

  // Equipment-specific searches
  const equipmentMappings = {
    'barbell': ['barbell'],
    'dumbbell': ['dumbbell', 'dumbell'],
    'cable': ['cable'],
    'machine': ['machine', 'leverage', 'lever'],
    'smith machine': ['smith'],
    'bodyweight': ['bodyweight', 'body weight'],
    'ez bar': ['ez-bar', 'ez bar', 'e-z'],
    'rope': ['rope'],
    'band': ['band'],
  };

  // Search by exercise type + equipment
  for (let dbName in dbIndex) {
    if (dbName.includes(searchName.split(' ')[0]) || searchName.includes(dbName.split(' ')[0])) {
      for (let equipKey in equipmentMappings) {
        if (searchEquipment.includes(equipKey)) {
          const matches = dbIndex[dbName].filter(m =>
            equipmentMappings[equipKey].some(eq => m.equipment.includes(eq) || m.fullName.toLowerCase().includes(eq))
          );
          if (matches.length > 0) return matches[0].id;
        }
      }
    }
  }

  return null;
}

// Process all exercises
myExercises.forEach(exercise => {
  const exerciseName = exercise.name;

  if (!mapping[exerciseName]) {
    mapping[exerciseName] = {};
  }

  let mappedCount = 0;

  exercise.variants.forEach(variant => {
    const match = findMatch(exerciseName, variant.equipment);

    if (match) {
      mapping[exerciseName][variant.equipment] = match;
      mappedCount++;
    }
  });

  if (mappedCount === 0) {
    unmapped.push({
      exercise: exerciseName,
      variants: exercise.variants.map(v => v.equipment)
    });
  } else if (mappedCount < exercise.variants.length) {
    // Partially mapped
    const missing = exercise.variants
      .filter(v => !mapping[exerciseName][v.equipment])
      .map(v => v.equipment);

    unmapped.push({
      exercise: exerciseName,
      partiallyMapped: true,
      missingVariants: missing
    });
  }
});

// Output results
console.log('=== MAPPING COMPLETE ===\n');
console.log(`Total Exercises: ${myExercises.length}`);
console.log(`Fully Mapped: ${myExercises.length - unmapped.filter(u => !u.partiallyMapped).length}`);
console.log(`Partially Mapped: ${unmapped.filter(u => u.partiallyMapped).length}`);
console.log(`Unmapped: ${unmapped.filter(u => !u.partiallyMapped).length}`);
console.log('\n');

// Save mapping
fs.writeFileSync('exercise_mapping.json', JSON.stringify(mapping, null, 2));
console.log('✓ Saved mapping to exercise_mapping.json\n');

// Save unmapped list
fs.writeFileSync('unmapped_exercises.json', JSON.stringify(unmapped, null, 2));
console.log('✓ Saved unmapped list to unmapped_exercises.json\n');

// Show unmapped exercises
if (unmapped.length > 0) {
  console.log('=== EXERCISES NEEDING MANUAL REVIEW ===\n');
  unmapped.forEach(item => {
    if (item.partiallyMapped) {
      console.log(`⚠️  ${item.exercise} (Partial - Missing: ${item.missingVariants.join(', ')})`);
    } else {
      console.log(`❌ ${item.exercise} (All variants: ${item.variants.join(', ')})`);
    }
  });
}

console.log('\n=== DONE ===');
