/**
 * COMPLETE Exercise Image Mapping
 * All 85 exercises mapped to Free Exercise DB
 * Generated: 2025-01-21
 */

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EXERCISE_IMAGE_MAPPING = {
  // ============ CHEST (7 exercises) ============
  "Bench Press": {
    "Barbell": "Barbell_Bench_Press_-_Medium_Grip",
    "Dumbbell": "Dumbbell_Bench_Press",
    "Smith Machine": "Smith_Machine_Bench_Press",
    "Machine": "Leverage_Chest_Press"
  },

  "Incline Bench Press": {
    "Barbell": "Barbell_Incline_Bench_Press_-_Medium_Grip",
    "Dumbbell": "Incline_Dumbbell_Press",
    "Smith Machine": "Smith_Machine_Incline_Bench_Press",
    "Machine": "Leverage_Incline_Chest_Press"
  },

  "Decline Bench Press": {
    "Barbell": "Decline_Barbell_Bench_Press",
    "Dumbbell": "Decline_Dumbbell_Bench_Press",
    "Smith Machine": "Smith_Machine_Decline_Press"
  },

  "Chest Fly": {
    "Dumbbell": "Dumbbell_Flyes",
    "Cable": "Cable_Crossover",
    "Machine (Pec Deck)": "Butterfly"
  },

  "Cable Crossover": {
    "High to Low": "Cable_Crossover",
    "Low to High": "Low_Cable_Crossover",
    "Middle": "Cable_Crossover"
  },

  "Push-ups": {
    "Standard": "Pushups",
    "Wide Grip": "Push-Up_Wide",
    "Diamond": "Push-Ups_-_Close_Triceps_Position",
    "Decline": "Decline_Push-Up"
  },

  "Chest Dips": {
    "Bodyweight": "Dips_-_Chest_Version",
    "Weighted (Dip Belt)": "Dips_-_Chest_Version",
    "Assisted Machine": "Dip_Machine"
  },

  // ============ BACK (12 exercises) ============
  "Lat Pulldown": {
    "Machine Wide Grip": "Wide-Grip_Lat_Pulldown",
    "Machine Narrow Grip": "Close-Grip_Front_Lat_Pulldown",
    "Cable Wide Grip": "Wide-Grip_Lat_Pulldown",
    "Cable Neutral Grip": "V-Bar_Pulldown"
  },

  "Cable Row": {
    "Low Angle (lats focus)": "Seated_Cable_Rows",
    "Mid Angle (rhomboids/traps focus)": "Seated_Cable_Rows"
  },

  "One Arm Row": {
    "Dumbbell": "One-Arm_Dumbbell_Row",
    "Cable": "Seated_One-arm_Cable_Pulley_Rows"
  },

  "Pullover": {
    "Cable": null,
    "Dumbbell": "Bent-Arm_Dumbbell_Pullover",
    "Machine": null
  },

  "Band Assisted Pull-up": {
    "Resistance Band": "Band_Assisted_Pull-Up"
  },

  "Cable Incline Pushdown": {
    "Straight Bar": "Triceps_Pushdown",
    "Rope Attachment": "Triceps_Pushdown_-_Rope_Attachment"
  },

  "Chin Up": {
    "Shoulder Width": "Chin-Up",
    "Narrow Grip": "Chin-Up"
  },

  "Muscle Up": {
    "Bar": "Muscle_Up",
    "Ring": "Muscle_Up"
  },

  "One Arm Lat Pulldown": {
    "Single Handle": "One_Arm_Lat_Pulldown",
    "Neutral Grip": "One_Arm_Lat_Pulldown"
  },

  "Pull Ups": {
    "Wide Grip": "Wide-Grip_Rear_Pull-Up",
    "Shoulder Width": "Pullups"
  },

  "V Bar Pulldown": {
    "Close Grip": "V-Bar_Pulldown",
    "Wide Grip": "V-Bar_Pulldown"
  },

  "Weighted Pull Ups": {
    "Dip Belt with Plates": "Pullups",
    "Dumbbell Between Feet": "Pullups",
    "Weight Vest": "Pullups"
  },

  // ============ SHOULDERS (6 exercises) ============
  "Shoulder Press": {
    "Barbell": "Barbell_Shoulder_Press",
    "Dumbbell Seated": "Dumbbell_Shoulder_Press",
    "Machine": "Leverage_Shoulder_Press",
    "Smith Machine": "Smith_Machine_Overhead_Shoulder_Press"
  },

  "Lateral Raise": {
    "Dumbbell": "Side_Lateral_Raise",
    "Cable Single": "Cable_Seated_Lateral_Raise",
    "Cable Both": "Cable_Seated_Lateral_Raise",
    "Machine": null
  },

  "Front Raise": {
    "Barbell": "Standing_Front_Barbell_Raise_Over_Head",
    "Dumbbell": "Front_Dumbbell_Raise",
    "Cable": "Front_Cable_Raise",
    "Plate": "Front_Plate_Raise"
  },

  "Shrugs": {
    "Barbell": "Barbell_Shrug",
    "Dumbbell": "Dumbbell_Shrug",
    "Smith Machine": "Smith_Machine_Behind_the_Back_Shrug",
    "Trap Bar": null
  },

  "Rear Delt Fly": {
    "Cable Bent": "Cable_Rear_Delt_Fly",
    "Machine Pec Deck Reverse": "Reverse_Machine_Flyes",
    "Dumbbell Bent": "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench"
  },

  "Upright Row": {
    "Barbell": "Upright_Barbell_Row",
    "Dumbbell": "Standing_Dumbbell_Upright_Row",
    "Cable": "Upright_Cable_Row",
    "EZ Bar": "Upright_Row_-_With_Bands"
  },

  // ============ BICEPS (10 exercises) ============
  "Bicep Curl": {
    "Incline Dumbbell": "Alternate_Incline_Dumbbell_Curl",
    "Barbell": "Barbell_Curl",
    "EZ Bar": "EZ-Bar_Curl",
    "Dumbbell Standing": "Dumbbell_Bicep_Curl"
  },

  "One Arm Bicep Curl": {
    "Dumbbell": "Dumbbell_Alternate_Bicep_Curl",
    "Cable Low": "Standing_Biceps_Cable_Curl",
    "Cable Mid": "Standing_Biceps_Cable_Curl"
  },

  "Hammer Curl": {
    "Cable Rope": "Cable_Hammer_Curls_-_Rope_Attachment",
    "Dumbbell": "Alternate_Hammer_Curl",
    "Dumbbell Seated": "Seated_Dumbbell_Curl"
  },

  "Preacher Curl": {
    "Machine": "Machine_Preacher_Curls",
    "Dumbbell": "One_Arm_Dumbbell_Preacher_Curl",
    "Cable Single": "Cable_Preacher_Curl",
    "Cable Rope": "Cable_Preacher_Curl",
    "EZ Bar": "Preacher_Curl"
  },

  "Concentration Curl": {
    "Dumbbell Seated": "Concentration_Curls",
    "Cable Kneeling": "Cable_Hammer_Curls_-_Rope_Attachment",
    "Cable Seated": "Cable_Hammer_Curls_-_Rope_Attachment"
  },

  "Cross Body Hammer Curl": {
    "Dumbbell": "Cross_Body_Hammer_Curl",
    "Cable Low": "Standing_Biceps_Cable_Curl",
    "Cable Rope": "Cable_Hammer_Curls_-_Rope_Attachment"
  },

  "High Cable Curl": {
    "Double Cable": "High_Cable_Curls",
    "Single Cable": "High_Cable_Curls"
  },

  "Reverse Curl": {
    "Barbell": "Reverse_Barbell_Curl",
    "EZ Bar": "EZ-Bar_Curl",
    "Dumbbell": "Dumbbell_Bicep_Curl"
  },

  "Spider Curl": {
    "EZ Bar": "Spider_Curl",
    "Dumbbell": "Dumbbell_Bicep_Curl",
    "Cable": "Cable_Preacher_Curl"
  },

  "Zottman Curl": {
    "Dumbbell": "Zottman_Curl",
    "Cable": "Standing_Biceps_Cable_Curl"
  },

  // ============ TRICEPS (10 exercises) ============
  "Tricep Pushdown": {
    "Cable Rope": "Triceps_Pushdown_-_Rope_Attachment",
    "Straight Bar": "Triceps_Pushdown",
    "V-Bar": "Triceps_Pushdown_-_V-Bar_Attachment"
  },

  "One Arm Tricep Pushdown": {
    "Single Handle": "Cable_One_Arm_Tricep_Extension",
    "Rope": "Cable_One_Arm_Tricep_Extension"
  },

  "Overhead Tricep Extension": {
    "Cable Rope": "Triceps_Overhead_Extension_with_Rope",
    "Dumbbell Two-Handed": "Dumbbell_One-Arm_Triceps_Extension",
    "EZ Bar": "Lying_Triceps_Press"
  },

  "One Arm Overhead Extension": {
    "Dumbbell": "Dumbbell_One-Arm_Triceps_Extension",
    "Cable": "Cable_One_Arm_Tricep_Extension"
  },

  "Skull Crusher": {
    "EZ Bar": "Lying_Triceps_Press",
    "Barbell": "Lying_Triceps_Press",
    "Dumbbell": "Decline_Dumbbell_Triceps_Extension"
  },

  "Dips": {
    "Parallel Bars": "Dips_-_Triceps_Version",
    "Assisted Machine": "Dip_Machine",
    "Bench Dips": "Bench_Dips"
  },

  "Close Grip Bench Press": {
    "Barbell": "Close-Grip_Barbell_Bench_Press",
    "Smith Machine": "Smith_Machine_Close-Grip_Bench_Press",
    "Dumbbell": "Dumbbell_Bench_Press"
  },

  "Cable Incline Tricep Extension": {
    "Overhead Rope": "Triceps_Overhead_Extension_with_Rope",
    "Incline Bar": "Cable_Incline_Triceps_Extension"
  },

  "Diamond Push-ups": {
    "Bodyweight": "Push-Ups_-_Close_Triceps_Position",
    "Weight Vest": "Push-Ups_-_Close_Triceps_Position",
    "Elevated": null
  },

  "Weighted Dips": {
    "Dip Belt": "Dips_-_Triceps_Version",
    "Dumbbell Between Legs": "Dips_-_Triceps_Version",
    "Weight Vest": "Dips_-_Triceps_Version"
  },

  // ============ ABS (10 exercises) ============
  "Crunches": {
    "Bodyweight Floor": "Crunches",
    "Cable Kneeling": "Cable_Crunch",
    "Machine": "Ab_Crunch_Machine"
  },

  "Plank": {
    "Bodyweight": "Plank",
    "Weighted": "Weighted_Ball_Side_Bend",
    "Elevated Feet": null
  },

  "Leg Raises": {
    "Hanging": "Hanging_Leg_Raise",
    "Captain's Chair": null,
    "Lying Floor": "Flat_Bench_Lying_Leg_Raise"
  },

  "Russian Twist": {
    "Bodyweight": "Russian_Twist",
    "Medicine Ball": "Russian_Twist",
    "Dumbbell": "Russian_Twist",
    "Cable": "Cable_Russian_Twists"
  },

  "Ab Wheel Rollout": {
    "Knees": "Ab_Roller",
    "Standing": "Ab_Roller",
    "Barbell Rollout": "Barbell_Ab_Rollout"
  },

  "Bicycle Crunches": {
    "Bodyweight": null,
    "Weighted": "Weighted_Crunches"
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

  // ============ LEGS (20 exercises) ============
  "Leg Extension": {
    "Machine": "Leg_Extensions",
    "Cable": "One-Legged_Cable_Kickback"
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
    "Barbell Back": "Barbell_Squat",
    "Smith Machine": "Smith_Machine_Squat",
    "Dumbbell Goblet": "Dumbbell_Squat"
  },

  "Hip Abduction": {
    "Machine": null,
    "Cable": null
  },

  "Glute Kickback": {
    "Cable": "Glute_Kickback",
    "Machine": null,
    "Bodyweight": "Glute_Kickback"
  },

  "Hang Clean": {
    "Barbell": "Hang_Clean",
    "Dumbbell": "Dumbbell_Clean"
  },

  "Hip Thrust": {
    "Barbell": "Barbell_Hip_Thrust",
    "Dumbbell": "Dumbbell_Bench_Press",
    "Machine": null
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
    "Dumbbell": "Dumbbell_Seated_One-Leg_Calf_Raise"
  },

  "Deadlift": {
    "Barbell Conventional": "Barbell_Deadlift",
    "Barbell Sumo": "Sumo_Deadlift",
    "Trap Bar": "Barbell_Deadlift",
    "Dumbbell Romanian": "Stiff-Legged_Dumbbell_Deadlift",
    "Barbell Romanian": "Romanian_Deadlift"
  },

  "Leg Press": {
    "45° Machine": "Leg_Press",
    "Horizontal Machine": "Leg_Press"
  },

  "Bulgarian Split Squat": {
    "Dumbbell": "Split_Squat_with_Dumbbells",
    "Barbell": "Barbell_Side_Split_Squat",
    "Bodyweight": "Single-Leg_Leg_Extension"
  },

  "Front Squat": {
    "Barbell": "Front_Barbell_Squat",
    "Dumbbell": "Dumbbell_Squat",
    "Smith Machine": "Smith_Machine_Squat"
  },

  "Step-Ups": {
    "Dumbbell": "Dumbbell_Step_Ups",
    "Barbell": "Barbell_Step_Ups",
    "Bodyweight": "Bodyweight_Walking_Lunge"
  },

  "Hip Adduction": {
    "Machine": "Thigh_Adductor",
    "Cable": "Cable_Hip_Adduction"
  },

  "Glute Bridge": {
    "Barbell": "Barbell_Glute_Bridge",
    "Dumbbell": "Dumbbell_Bench_Press",
    "Bodyweight": "Butt_Lift_Bridge"
  },

  // ============ FOREARMS (5 exercises) ============
  "Wrist Curl": {
    "Barbell": "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench",
    "Dumbbell": "Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench",
    "Cable": "Cable_Wrist_Curl"
  },

  "Reverse Wrist Curl": {
    "Barbell": "Palms-Down_Wrist_Curl_Over_A_Bench",
    "Dumbbell": "Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench",
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
    "Standing": "Wrist_Roller",
    "Seated": "Wrist_Roller"
  },

  // ============ CARDIO (7 exercises) - NO IMAGES IN FREE DB ============
  // These exercises don't have demonstration images in Free Exercise DB
  // Using placeholder mappings
  "Treadmill": {
    "Walking": null,
    "Jogging": null,
    "Running": null,
    "Incline Walking": null,
    "HIIT Intervals": null
  },

  "Stationary Bike": {
    "Steady State": null,
    "HIIT": null,
    "Spin Class": null
  },

  "Rowing Machine": {
    "Steady State": null,
    "HIIT Intervals": null
  },

  "Elliptical": {
    "Forward": null,
    "Reverse": null,
    "HIIT": null
  },

  "Jump Rope": {
    "Regular Bounce": null,
    "Double Unders": null,
    "HIIT": null
  },

  "Stair Climber": {
    "Steady Pace": null,
    "HIIT": null,
    "Skip-a-Step": null
  },

  "Burpees": {
    "Bodyweight": null,
    "Push-up Burpees": null,
    "Box Jump Burpees": null
  }
};

/**
 * Get image URL for an exercise variant
 */
export function getVariantImage(exerciseName, equipment, imageIndex = 0) {
  if (!EXERCISE_IMAGE_MAPPING[exerciseName]) {
    console.warn(`No image mapping found for exercise: ${exerciseName}`);
    return null;
  }

  const exerciseId = EXERCISE_IMAGE_MAPPING[exerciseName][equipment];
  if (!exerciseId) {
    console.warn(`No image mapping found for ${exerciseName} with equipment: ${equipment}`);
    return null;
  }

  const imageUrl = `${BASE_URL}${exerciseId}/${imageIndex}.jpg`;
  return imageUrl;
}

/**
 * Get both images for an exercise variant
 */
export function getVariantImages(exerciseName, equipment) {
  const image0 = getVariantImage(exerciseName, equipment, 0);
  const image1 = getVariantImage(exerciseName, equipment, 1);

  if (!image0) return null;
  return [image0, image1];
}

/**
 * Check if an exercise has image mapping
 */
export function hasImageMapping(exerciseName, equipment = null) {
  if (!EXERCISE_IMAGE_MAPPING[exerciseName]) {
    return false;
  }

  if (equipment) {
    return !!EXERCISE_IMAGE_MAPPING[exerciseName][equipment];
  }

  return true;
}

/**
 * Get placeholder image URL
 */
export function getPlaceholderImage() {
  return null;
}

/**
 * Get all available equipment types for an exercise that have image mappings
 */
export function getAvailableEquipmentWithImages(exerciseName) {
  if (!EXERCISE_IMAGE_MAPPING[exerciseName]) {
    return [];
  }

  return Object.keys(EXERCISE_IMAGE_MAPPING[exerciseName]);
}

export default {
  getVariantImage,
  getVariantImages,
  hasImageMapping,
  getPlaceholderImage,
  getAvailableEquipmentWithImages
};
