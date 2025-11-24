const fs = require('fs');

// Load the mapping
const mapping = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json', 'utf8'));

// Fix the IDs that don't exist
const fixes = {
  "Bulgarian Split Squat": {
    "Dumbbell": "Dumbbell_Lunges"
  },
  "Burpees": {
    "Bodyweight": "Freehand_Jump_Squat",
    "Push-up Burpees": "Freehand_Jump_Squat",
    "Box Jump Burpees": "Box_Jump"
  }
};

// Apply fixes
for (const [exerciseName, variants] of Object.entries(fixes)) {
  for (const [equipment, id] of Object.entries(variants)) {
    if (mapping[exerciseName]) {
      mapping[exerciseName][equipment] = id;
    }
  }
}

// Write back
fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json',
  JSON.stringify(mapping, null, 2), 'utf8');

console.log('Fixed missing IDs!');
