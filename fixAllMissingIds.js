const fs = require('fs');

// Load the mapping
const mapping = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json', 'utf8'));

// Comprehensive fixes for all missing IDs
const fixes = {
  "Burpees": {
    "Box Jump Burpees": "Dumbbell_Seated_Box_Jump"
  },
  "Deadlift": {
    "Dumbbell Romanian": "Romanian_Deadlift",
    "Barbell Romanian": "Romanian_Deadlift"
  },
  "Dips": {
    "Assisted Machine": "Dip_Machine"
  },
  "Front Raise": {
    "Barbell": "Side_Laterals_to_Front_Raise",
    "Dumbbell": "Side_Laterals_to_Front_Raise"
  },
  "Glute Bridge": {
    "Dumbbell": "Single_Leg_Glute_Bridge"
  },
  "Glute Kickback": {
    "Cable": "Glute_Kickback",
    "Machine": "Glute_Kickback",
    "Bodyweight": "Glute_Kickback"
  },
  "Lateral Raise": {
    "Machine": "Cable_Seated_Lateral_Raise"
  },
  "Leg Extension": {
    "Cable": "Leg_Extensions"
  },
  "Leg Press": {
    "Horizontal Machine": "Leg_Press"
  },
  "Leg Raises": {
    "Lying Floor": "Flat_Bench_Lying_Leg_Raise"
  },
  "Push-ups": {
    "Wide Grip": "Pushups_Close_and_Wide_Hand_Positions"
  },
  "Step-Ups": {
    "Bodyweight": "Dumbbell_Step_Ups"
  },
  "Treadmill": {
    "Walking": "Walking_Treadmill",
    "Jogging": "Jogging_Treadmill",
    "Running": "Running_Treadmill",
    "Incline Walking": "Walking_Treadmill",
    "HIIT Intervals": "Running_Treadmill"
  },
  "Wrist Curl": {
    "Barbell": "Palms-Down_Wrist_Curl_Over_A_Bench",
    "Dumbbell": "Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench",
    "Cable": "Cable_Wrist_Curl"
  },
  "Wrist Roller": {
    "Standing": "Wrist_Roller",
    "Seated": "Wrist_Roller"
  }
};

// Apply fixes
for (const [exerciseName, variants] of Object.entries(fixes)) {
  if (!mapping[exerciseName]) {
    mapping[exerciseName] = {};
  }
  for (const [equipment, id] of Object.entries(variants)) {
    mapping[exerciseName][equipment] = id;
  }
}

// Write back
fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json',
  JSON.stringify(mapping, null, 2), 'utf8');

console.log('All IDs fixed!');
