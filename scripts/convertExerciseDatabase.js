const fs = require('fs');
const path = require('path');

// Load the external exercise database
const externalExercises = JSON.parse(fs.readFileSync(path.join(__dirname, '../temp-exercise-db/dist/exercises.json'), 'utf8'));

// Load our current database
const currentDatabase = require('../src/data/exerciseDatabase.js');

// Mapping functions
function mapMuscleGroup(primaryMuscles, category) {
  if (!primaryMuscles || primaryMuscles.length === 0) return 'other';

  const primary = primaryMuscles[0].toLowerCase();

  // Map to our muscle group categories
  if (primary.includes('chest') || primary.includes('pectorals')) return 'chest';
  if (primary.includes('shoulder') || primary.includes('deltoid')) return 'shoulders';
  if (primary.includes('lat') || primary.includes('rhomboid') || primary.includes('trapezius') || primary.includes('erector spinae')) return 'back';
  if (primary.includes('bicep')) return 'biceps';
  if (primary.includes('tricep')) return 'triceps';
  if (primary.includes('abdominal') || primary.includes('oblique')) return 'abs';
  if (primary.includes('quadriceps') || primary.includes('hamstring') || primary.includes('glute') || primary.includes('calves') || primary.includes('adductor')) return 'legs';

  return 'other'; // For exercises that don't fit our categories
}

function mapDifficulty(level) {
  switch (level && level.toLowerCase()) {
    case 'beginner': return 'Beginner';
    case 'intermediate': return 'Intermediate';
    case 'expert': return 'Advanced';
    default: return 'Intermediate';
  }
}

function mapEquipment(equipment) {
  if (!equipment) return 'Other';

  const eq = equipment.toLowerCase();
  if (eq.includes('body only') || eq.includes('bodyweight')) return 'Bodyweight';
  if (eq.includes('dumbbell')) return 'Dumbbell';
  if (eq.includes('barbell')) return 'Barbell';
  if (eq.includes('cable')) return 'Cable Machine';
  if (eq.includes('machine')) return 'Machine';
  if (eq.includes('kettlebell')) return 'Kettlebell';
  if (eq.includes('resistance band')) return 'Resistance Band';

  return 'Other';
}

function capitalizeMuscles(muscles) {
  if (!muscles || !Array.isArray(muscles)) return [];

  return muscles.map(muscle => {
    return muscle.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
}

function generateUniqueId(name, muscleGroup, existingIds) {
  // Create base ID from name
  let baseId = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-'); // Replace spaces with dashes

  // Truncate if too long
  if (baseId.length > 30) {
    baseId = baseId.substring(0, 30);
  }

  // Add muscle group prefix if not already there
  if (!baseId.startsWith(muscleGroup)) {
    baseId = muscleGroup + '-' + baseId;
  }

  // Ensure uniqueness
  let finalId = baseId;
  let counter = 1;
  while (existingIds.has(finalId)) {
    finalId = baseId + '-' + counter;
    counter++;
  }

  existingIds.add(finalId);
  return finalId;
}

// Convert external exercises to our format
function convertExercises() {
  const convertedExercises = {
    chest: [],
    shoulders: [],
    back: [],
    biceps: [],
    triceps: [],
    abs: [],
    legs: [],
    other: []
  };

  // Get existing IDs to avoid duplicates
  const existingIds = new Set();

  // Add current exercise IDs
  Object.values(currentDatabase.exerciseDatabase).forEach(categoryExercises => {
    if (Array.isArray(categoryExercises)) {
      categoryExercises.forEach(ex => existingIds.add(ex.id));
    }
  });

  // Convert each external exercise
  externalExercises.forEach((exercise, index) => {
    try {
      const muscleGroup = mapMuscleGroup(exercise.primaryMuscles, exercise.category);
      const id = generateUniqueId(exercise.name, muscleGroup, existingIds);

      const convertedExercise = {
        id: id,
        name: exercise.name,
        equipment: mapEquipment(exercise.equipment),
        difficulty: mapDifficulty(exercise.level),
        instructions: Array.isArray(exercise.instructions)
          ? exercise.instructions.join(' ')
          : exercise.instructions || 'No instructions provided',
        muscleGroup: muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1),
        primaryMuscles: capitalizeMuscles(exercise.primaryMuscles) || ['Unknown'],
        secondaryMuscles: capitalizeMuscles(exercise.secondaryMuscles) || [],
        // Optional: keep original data for reference
        originalId: exercise.id,
        images: exercise.images || []
      };

      convertedExercises[muscleGroup].push(convertedExercise);

    } catch (error) {
      console.error('Error converting exercise ' + index + ':', error);
    }
  });

  return convertedExercises;
}

// Merge with existing exercises
function mergeExercises(newExercises) {
  const merged = Object.assign({}, currentDatabase.exerciseDatabase);

  // Add new exercises to each category
  Object.keys(newExercises).forEach(category => {
    if (category !== 'other' && merged[category]) {
      merged[category] = merged[category].concat(newExercises[category]);
    } else if (category === 'other') {
      // Add 'other' category if it doesn't exist
      merged.other = newExercises.other;
    }
  });

  return merged;
}

// Generate the new database file
function generateNewDatabaseFile(mergedDatabase) {
  // Calculate totals
  const totals = Object.keys(mergedDatabase).reduce((acc, category) => {
    acc[category] = mergedDatabase[category].length;
    acc.total += mergedDatabase[category].length;
    return acc;
  }, { total: 0 });

  console.log('Exercise counts by category:', totals);

  // Create the new file content
  const fileContent = '// EXPANDED DATABASE - AUTO-GENERATED\n' +
'// This database now includes 800+ exercises from the free-exercise-db\n' +
'// Original exercises preserved + new exercises added\n' +
'// Total exercises: ' + totals.total + '\n' +
'// Generated: ' + new Date().toISOString() + '\n\n' +
'export const exerciseDatabase = ' + JSON.stringify(mergedDatabase, null, 2) + ';\n\n' +
'// Helper functions for exercise filtering and retrieval\n' +
'export const getExercisesByMuscleGroup = (muscleGroup) => {\n' +
'  console.log(\'[DATABASE] getExercisesByMuscleGroup called with:\', muscleGroup);\n\n' +
'  const muscleGroupMap = {\n' +
'    \'chest\': exerciseDatabase.chest,\n' +
'    \'shoulders\': exerciseDatabase.shoulders,\n' +
'    \'back\': exerciseDatabase.back,\n' +
'    \'biceps\': [...(exerciseDatabase.biceps || [])],\n' +
'    \'triceps\': [...(exerciseDatabase.triceps || [])],\n' +
'    \'abs\': exerciseDatabase.abs,\n' +
'    \'legs\': exerciseDatabase.legs,\n' +
'    \'other\': exerciseDatabase.other || []\n' +
'  };\n\n' +
'  // For arms, combine biceps and triceps\n' +
'  if (muscleGroup === \'arms\') {\n' +
'    const result = [...exerciseDatabase.biceps, ...exerciseDatabase.triceps];\n' +
'    console.log(\'[DATABASE] Arms result length:\', result.length);\n' +
'    return result;\n' +
'  }\n\n' +
'  const result = muscleGroupMap[muscleGroup] || [];\n' +
'  console.log(\'[DATABASE] Result for \' + muscleGroup + \':\', result ? result.length : \'null/undefined\');\n\n' +
'  return result;\n' +
'};\n\n' +
'export const getExercisesByEquipment = (equipment) => {\n' +
'  const allExercises = getAllExercises();\n' +
'  return allExercises.filter(exercise => exercise.equipment === equipment);\n' +
'};\n\n' +
'export const getExercisesByDifficulty = (difficulty) => {\n' +
'  const allExercises = getAllExercises();\n' +
'  return allExercises.filter(exercise => exercise.difficulty === difficulty);\n' +
'};\n\n' +
'export const getAllExercises = () => {\n' +
'  return [\n' +
'    ...exerciseDatabase.chest,\n' +
'    ...exerciseDatabase.shoulders,\n' +
'    ...exerciseDatabase.back,\n' +
'    ...exerciseDatabase.biceps,\n' +
'    ...exerciseDatabase.triceps,\n' +
'    ...exerciseDatabase.abs,\n' +
'    ...exerciseDatabase.legs,\n' +
'    ...(exerciseDatabase.other || [])\n' +
'  ];\n' +
'};\n\n' +
'export const searchExercises = (query) => {\n' +
'  const allExercises = getAllExercises();\n' +
'  const lowercaseQuery = query.toLowerCase();\n\n' +
'  return allExercises.filter(exercise =>\n' +
'    exercise.name.toLowerCase().includes(lowercaseQuery) ||\n' +
'    exercise.equipment.toLowerCase().includes(lowercaseQuery) ||\n' +
'    exercise.instructions.toLowerCase().includes(lowercaseQuery) ||\n' +
'    exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||\n' +
'    exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(lowercaseQuery))\n' +
'  );\n' +
'};\n\n' +
'export const getExerciseById = (id) => {\n' +
'  const allExercises = getAllExercises();\n' +
'  return allExercises.find(exercise => exercise.id === id);\n' +
'};\n\n' +
'// New helper functions\n' +
'export const getEquipmentTypes = () => {\n' +
'  const allExercises = getAllExercises();\n' +
'  const equipmentSet = new Set(allExercises.map(ex => ex.equipment));\n' +
'  return Array.from(equipmentSet).sort();\n' +
'};\n\n' +
'export const getDifficultyLevels = () => {\n' +
'  return [\'Beginner\', \'Intermediate\', \'Advanced\'];\n' +
'};\n\n' +
'export const getMuscleGroups = () => {\n' +
'  return Object.keys(exerciseDatabase);\n' +
'};\n';

  return fileContent;
}

// Main execution
console.log('Starting exercise database conversion...');
console.log('External exercises to convert: ' + externalExercises.length);

const convertedExercises = convertExercises();
console.log('Conversion complete!');

const mergedDatabase = mergeExercises(convertedExercises);
console.log('Merge complete!');

const newDatabaseContent = generateNewDatabaseFile(mergedDatabase);

// Write backup of original
const backupPath = path.join(__dirname, '../src/data/exerciseDatabase.backup.js');
fs.copyFileSync(path.join(__dirname, '../src/data/exerciseDatabase.js'), backupPath);
console.log('Original database backed up to:', backupPath);

// Write new database
const outputPath = path.join(__dirname, '../src/data/exerciseDatabase.js');
fs.writeFileSync(outputPath, newDatabaseContent);
console.log('New database written to:', outputPath);

// Cleanup temp directory
try {
  if (fs.rmSync) {
    fs.rmSync(path.join(__dirname, '../temp-exercise-db'), { recursive: true, force: true });
  } else {
    // Fallback for older Node versions
    const rimraf = require('child_process').execSync;
    rimraf('rmdir /s /q temp-exercise-db', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  }
  console.log('Temporary directory cleaned up');
} catch (error) {
  console.warn('Could not clean up temp directory:', error.message);
}

console.log('Database expansion complete! Your app now has 800+ exercises!');