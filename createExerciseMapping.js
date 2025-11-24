const fs = require('fs');

// Load the Free Exercise DB
const freeExerciseDB = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\free_exercise_db.json', 'utf8'));

// Load your exercise list
const exerciseList = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_list.json', 'utf8'));

// Helper function to normalize strings for comparison
function normalize(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// Helper function to find best match
function findBestMatch(exerciseName, equipment, freeDB) {
  const normalizedExercise = normalize(exerciseName);
  const normalizedEquipment = normalize(equipment);

  // Equipment mapping
  const equipmentMap = {
    'barbell': 'barbell',
    'dumbbell': 'dumbbell',
    'cable': 'cable',
    'machine': 'machine',
    'smith_machine': 'machine',
    'bodyweight': 'body only',
    'ez_bar': 'e-z curl bar',
    'trap_bar': 'other',
    'kettlebell': 'kettlebells',
    'resistance_band': 'bands',
    'plate': 'other',
    'pec_deck': 'machine',
    'parallel_bars': 'body only',
    'assisted_machine': 'machine',
    'bench_dips': 'body only',
    'dip_belt': 'other',
    'weight_vest': 'other',
    'medicine_ball': 'medicine ball',
    'rope': 'cable',
    'v_bar': 'cable',
    'heavy_band': 'bands',
    'medium_band': 'bands',
    'light_band': 'bands',
    'hanging': 'body only',
    'captains_chair': 'other',
    'lying_floor': 'body only',
    'slider_discs': 'other',
    'decline_bench': 'barbell',
    'weighted_plate': 'other',
    'knees': 'other',
    'standing': 'body only',
    'lying_machine': 'machine',
    'seated_machine': 'machine',
    'standing_machine': 'machine',
    'barbell_back': 'barbell',
    'dumbbell_goblet': 'dumbbell',
    'barbell_conventional': 'barbell',
    'barbell_sumo': 'barbell',
    'dumbbell_romanian': 'dumbbell',
    'barbell_romanian': 'barbell',
    '45_machine': 'machine',
    'horizontal_machine': 'machine',
    'two_plates_smooth': 'other',
    'single_plate': 'other',
    'weight_plate_hold': 'other'
  };

  // Try to find exact or close matches
  let matches = [];

  // Strategy 1: Direct name match
  for (let ex of freeDB) {
    const exName = normalize(ex.name);
    const exId = ex.id;

    // Check if names match
    if (exName.includes(normalizedExercise) || normalizedExercise.includes(exName)) {
      matches.push({ exercise: ex, score: 100 });
    }
  }

  // Strategy 2: Keyword matching
  const exerciseKeywords = normalizedExercise.split('_').filter(w => w.length > 2);

  for (let ex of freeDB) {
    const exName = normalize(ex.name);
    const exKeywords = exName.split('_').filter(w => w.length > 2);

    let matchCount = 0;
    for (let keyword of exerciseKeywords) {
      if (exKeywords.some(k => k.includes(keyword) || keyword.includes(k))) {
        matchCount++;
      }
    }

    if (matchCount >= Math.min(2, exerciseKeywords.length)) {
      const score = (matchCount / exerciseKeywords.length) * 80;
      matches.push({ exercise: ex, score });
    }
  }

  // Filter by equipment if possible
  const targetEquipment = equipmentMap[normalizedEquipment] || normalizedEquipment;

  let equipmentMatches = matches.filter(m => {
    if (!m.exercise.equipment) return false;
    const exEquip = normalize(m.exercise.equipment);
    return exEquip === targetEquipment ||
           normalize(targetEquipment).includes(exEquip) ||
           exEquip.includes(normalize(targetEquipment));
  });

  // If we have equipment matches, prefer those
  if (equipmentMatches.length > 0) {
    equipmentMatches.sort((a, b) => b.score - a.score);
    return equipmentMatches[0]?.exercise;
  }

  // Otherwise return best match regardless of equipment
  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return matches[0]?.exercise;
  }

  return null;
}

// Create the mapping
const mapping = {};
const unmapped = [];

for (let exercise of exerciseList) {
  mapping[exercise.name] = {};

  for (let variant of exercise.variants) {
    const match = findBestMatch(exercise.name, variant.equipment, freeExerciseDB);

    if (match) {
      mapping[exercise.name][variant.equipment] = match.id;
    } else {
      unmapped.push({
        exercise: exercise.name,
        equipment: variant.equipment
      });
    }
  }
}

// Write results
fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping.json',
  JSON.stringify(mapping, null, 2), 'utf8');

fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\unmapped_exercises.json',
  JSON.stringify(unmapped, null, 2), 'utf8');

console.log(`Mapping complete!`);
console.log(`Total exercises: ${Object.keys(mapping).length}`);
console.log(`Unmapped variants: ${unmapped.length}`);
