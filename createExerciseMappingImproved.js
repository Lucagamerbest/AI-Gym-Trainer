const fs = require('fs');

// Load the initial mapping
const mapping = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping.json', 'utf8'));

// Manual mappings for unmapped exercises
const manualMappings = {
  "Chest Fly": {
    "Dumbbell": "Dumbbell_Flyes",
    "Cable": "Flat_Bench_Cable_Flyes",
    "Machine (Pec Deck)": "Butterfly"
  },
  "Diamond Push-ups": {
    "Bodyweight": "Push-Ups_-_Close_Triceps_Position",
    "Weight Vest": "Push-Ups_-_Close_Triceps_Position",
    "Elevated": "Push-Ups_-_Close_Triceps_Position"
  },
  "Ab Wheel Rollout": {
    "Knees": "Barbell_Ab_Rollout_-_On_Knees",
    "Standing": "Barbell_Ab_Rollout",
    "Barbell Rollout": "Barbell_Ab_Rollout"
  },
  "Hip Abduction": {
    "Machine": "Thigh_Abductor",
    "Cable": "Thigh_Abductor"
  },
  "Stationary Bike": {
    "Steady State": "Bicycling_Stationary",
    "HIIT": "Bicycling_Stationary",
    "Spin Class": "Bicycling_Stationary"
  },
  "Stair Climber": {
    "Steady Pace": "Stairmaster",
    "HIIT": "Stairmaster",
    "Skip-a-Step": "Stairmaster"
  },
  "Burpees": {
    "Bodyweight": "Burpee",  // We'll need to check if this exists
    "Push-up Burpees": "Burpee",
    "Box Jump Burpees": "Box_Jump_Burpee"
  }
};

// Merge manual mappings
for (const [exerciseName, variants] of Object.entries(manualMappings)) {
  if (!mapping[exerciseName]) {
    mapping[exerciseName] = {};
  }
  for (const [equipment, id] of Object.entries(variants)) {
    mapping[exerciseName][equipment] = id;
  }
}

// Additional improvements for existing mappings
const improvements = {
  "Bench Press": {
    "Dumbbell": "Dumbbell_Bench_Press"
  },
  "Push-ups": {
    "Standard": "Push-Up_Wide",
    "Wide Grip": "Pushups_Wide_and_Close_Hands_Positions",
    "Diamond": "Push-Ups_-_Close_Triceps_Position",
    "Decline": "Decline_Push-Up"
  },
  "Lat Pulldown": {
    "Machine Wide Grip": "Wide-Grip_Lat_Pulldown",
    "Machine Narrow Grip": "Close-Grip_Front_Lat_Pulldown",
    "Cable Wide Grip": "Wide-Grip_Lat_Pulldown",
    "Cable Neutral Grip": "Underhand_Cable_Pulldowns"
  },
  "Cable Row": {
    "Low Angle (lats focus)": "Seated_Cable_Rows",
    "Mid Angle (rhomboids/traps focus)": "Seated_Cable_Rows"
  },
  "One Arm Row": {
    "Dumbbell": "One-Arm_Dumbbell_Row"
  },
  "Pullover": {
    "Cable": "Straight-Arm_Pulldown",
    "Dumbbell": "Bent-Arm_Dumbbell_Pullover",
    "Machine": "Straight-Arm_Pulldown"
  },
  "Band Assisted Pull-up": {
    "Heavy Band": "Band_Assisted_Pull-Up",
    "Medium Band": "Band_Assisted_Pull-Up",
    "Light Band": "Band_Assisted_Pull-Up"
  },
  "Chin Up": {
    "Shoulder Width": "Chin-Up",
    "Narrow Grip": "Chin-Up"
  },
  "Pull Ups": {
    "Wide Grip": "Pullups",
    "Shoulder Width": "Pullups"
  },
  "Bicep Curl": {
    "Incline Dumbbell": "Alternate_Incline_Dumbbell_Curl",
    "Barbell": "Barbell_Curl",
    "EZ Bar": "EZ-Bar_Curl",
    "Dumbbell Standing": "Dumbbell_Bicep_Curl"
  },
  "Lateral Raise": {
    "Dumbbell": "Dumbbell_Lying_Rear_Lateral_Raise",
    "Cable Single": "Cable_Seated_Lateral_Raise",
    "Cable Both": "Cable_Seated_Lateral_Raise",
    "Machine": "Leverage_Lateral_Raise"
  },
  "Front Raise": {
    "Barbell": "Front_Barbell_Raise",
    "Dumbbell": "Front_Dumbbell_Raise",
    "Cable": "Front_Cable_Raise",
    "Plate": "Front_Plate_Raise"
  },
  "Dips": {
    "Parallel Bars": "Dips_-_Triceps_Version",
    "Assisted Machine": "Machine_Triceps_Dip",
    "Bench Dips": "Bench_Dips"
  },
  "Crunches": {
    "Bodyweight Floor": "Crunches",
    "Cable Kneeling": "Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists",
    "Machine": "Ab_Crunch_Machine"
  },
  "Plank": {
    "Bodyweight": "Plank",
    "Weighted": "Plank",
    "Elevated Feet": "Plank"
  },
  "Leg Raises": {
    "Hanging": "Hanging_Pike",
    "Captain's Chair": "Suspended_Fallout",
    "Lying Floor": "Lying_Leg_Raise_Flat_Bench"
  },
  "Russian Twist": {
    "Bodyweight": "Russian_Twist",
    "Medicine Ball": "Russian_Twist",
    "Dumbbell": "Russian_Twist",
    "Cable": "Russian_Twist"
  },
  "Cable Woodchop": {
    "High to Low": "Cable_Seated_Crunch",
    "Low to High": "Cable_Reverse_Crunch"
  },
  "Bicycle Crunches": {
    "Bodyweight": "Air_Bike",
    "Weighted": "Air_Bike"
  },
  "Mountain Climbers": {
    "Bodyweight": "Mountain_Climbers",
    "Slider Discs": "Mountain_Climbers"
  },
  "Dead Bug": {
    "Bodyweight": "Dead_Bug",
    "Resistance Band": "Dead_Bug"
  },
  "Sit-Ups": {
    "Bodyweight Floor": "Sit-Up",
    "Decline Bench": "Decline_Crunch",
    "Weighted Plate": "Weighted_Sit-Ups_-_With_Bands"
  },
  "Leg Extension": {
    "Machine": "Leg_Extensions",
    "Cable": "Single-Leg_Cable_Hip_Extension"
  },
  "Leg Curl": {
    "Lying Machine": "Lying_Leg_Curls",
    "Seated Machine": "Seated_Leg_Curl",
    "Standing Machine": "Standing_Leg_Curl"
  },
  "Standing Calf Raise": {
    "Machine": "Standing_Calf_Raises",
    "Smith Machine": "Smith_Machine_Calf_Raise",
    "Barbell": "Standing_Barbell_Calf_Raise"
  },
  "Squat": {
    "Barbell Back": "Barbell_Full_Squat",
    "Smith Machine": "Smith_Machine_Squat",
    "Dumbbell Goblet": "Goblet_Squat"
  },
  "Glute Kickback": {
    "Cable": "Cable_Glute_Kickback",
    "Machine": "Glute_Kickback",
    "Bodyweight": "Glute_Kickback"
  },
  "Hang Clean": {
    "Barbell": "Hang_Clean_-_Below_the_Knees",
    "Dumbbell": "Dumbbell_Clean"
  },
  "Hip Thrust": {
    "Barbell": "Barbell_Hip_Thrust",
    "Dumbbell": "Reverse_Band_Box_Squat",
    "Machine": "Hip_Lift_with_Band"
  },
  "Hack Squat": {
    "Machine": "Hack_Squat",
    "Barbell Reverse": "Barbell_Hack_Squat"
  },
  "Lunges": {
    "Dumbbell Walking": "Dumbbell_Lunges",
    "Barbell Walking": "Barbell_Walking_Lunge",
    "Dumbbell Stationary": "Dumbbell_Lunges"
  },
  "Seated Calf Raise": {
    "Machine": "Seated_Calf_Raise",
    "Dumbbell": "Seated_Calf_Raise"
  },
  "Deadlift": {
    "Barbell Conventional": "Barbell_Deadlift",
    "Barbell Sumo": "Sumo_Deadlift",
    "Trap Bar": "Trap_Bar_Deadlift",
    "Dumbbell Romanian": "Dumbbell_Lying_Rear_Delt_Raise",
    "Barbell Romanian": "Romanian_Deadlift"
  },
  "Leg Press": {
    "45° Machine": "Leg_Press",
    "Horizontal Machine": "Sled_Leg_Press"
  },
  "Bulgarian Split Squat": {
    "Dumbbell": "Dumbbell_Lunge",
    "Barbell": "Barbell_Lunge",
    "Bodyweight": "Bodyweight_Squat"
  },
  "Front Squat": {
    "Barbell": "Front_Barbell_Squat",
    "Dumbbell": "Goblet_Squat",
    "Smith Machine": "Smith_Machine_Squat"
  },
  "Step-Ups": {
    "Dumbbell": "Dumbbell_Step_Ups",
    "Barbell": "Barbell_Step_Ups",
    "Bodyweight": "Box_Step_Ups"
  },
  "Hip Adduction": {
    "Machine": "Adductor",
    "Cable": "Cable_Hip_Adduction"
  },
  "Glute Bridge": {
    "Barbell": "Barbell_Glute_Bridge",
    "Dumbbell": "Single-Leg_Glute_Bridge",
    "Bodyweight": "Butt_Lift_Bridge"
  },
  "Wrist Curl": {
    "Barbell": "Barbell_Seated_Wrist_Curl",
    "Dumbbell": "Dumbbell_Bicep_Curl",
    "Cable": "Cable_Wrist_Curl"
  },
  "Reverse Wrist Curl": {
    "Barbell": "Reverse_Barbell_Curl",
    "Dumbbell": "Standing_Dumbbell_Reverse_Curl",
    "EZ Bar": "Reverse_Barbell_Curl"
  },
  "Farmer's Walk": {
    "Dumbbell": "Farmers_Walk",
    "Trap Bar": "Farmers_Walk",
    "Kettlebell": "Farmers_Walk"
  },
  "Plate Pinch": {
    "Two Plates Smooth": "Plate_Pinch",
    "Single Plate": "Plate_Pinch",
    "Weight Plate Hold": "Plate_Pinch"
  },
  "Wrist Roller": {
    "Standing": "Palms-Up_Wrist_Curl_Over_A_Bench",
    "Seated": "Palms-Up_Wrist_Curl_Over_A_Bench"
  },
  "Treadmill": {
    "Walking": "Walking_Treadmill",
    "Jogging": "Jog_In_Place",
    "Running": "Running_Treadmill",
    "Incline Walking": "Treadmill_walking",
    "HIIT Intervals": "Running_Treadmill"
  },
  "Rowing Machine": {
    "Steady State": "Rowing_Stationary",
    "HIIT Intervals": "Rowing_Stationary"
  },
  "Elliptical": {
    "Forward": "Elliptical_Trainer",
    "Reverse": "Elliptical_Trainer",
    "HIIT": "Elliptical_Trainer"
  },
  "Jump Rope": {
    "Regular Bounce": "Rope_Jumping",
    "Double Unders": "Rope_Jumping",
    "HIIT": "Rope_Jumping"
  }
};

// Apply improvements
for (const [exerciseName, variants] of Object.entries(improvements)) {
  if (!mapping[exerciseName]) {
    mapping[exerciseName] = {};
  }
  for (const [equipment, id] of Object.entries(variants)) {
    mapping[exerciseName][equipment] = id;
  }
}

// Write the final mapping
fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json',
  JSON.stringify(mapping, null, 2), 'utf8');

console.log('Final mapping created!');

// Check for any remaining unmapped exercises
const unmapped = [];
const exerciseList = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_list.json', 'utf8'));

for (let exercise of exerciseList) {
  for (let variant of exercise.variants) {
    if (!mapping[exercise.name] || !mapping[exercise.name][variant.equipment]) {
      unmapped.push({
        exercise: exercise.name,
        equipment: variant.equipment
      });
    }
  }
}

fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\unmapped_exercises_final.json',
  JSON.stringify(unmapped, null, 2), 'utf8');

console.log(`Remaining unmapped variants: ${unmapped.length}`);
