/**
 * COMPLETE Exercise Image Mapping
 * Updated with local images from video screenshots
 * Updated: 2025-12-23
 */

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Local exercise images - use require() for bundled assets
const LOCAL_IMAGES = {
  // Original images
  'benchpressmachine': require('../../assets/exercises/benchpressmachine.jpg'),
  'cable_crossover_high_to_low': require('../../assets/exercises/cable_crossover_high_to_low.jpg'),
  'chest_dip': require('../../assets/exercises/chest_dip.jpg'),
  'weighted_chest_dip': require('../../assets/exercises/weighted_chest_dip.jpg'),
  'machine_chest_press': require('../../assets/exercises/machine_chest_press.jpg'),

  // NEW - From video screenshots (73 images)
  // CHEST
  'bench_press_barbell': require('../../assets/exercises/bench_press_barbell.jpg'),
  'bench_press_dumbbell': require('../../assets/exercises/bench_press_dumbbell.jpg'),
  'bench_press_machine': require('../../assets/exercises/bench_press_machine.jpg'),
  'chest_press_horizontal': require('../../assets/exercises/chest_press_horizontal.jpg'),
  'chest_press_vertical': require('../../assets/exercises/chest_press_vertical.jpg'),
  'incline_bench_dumbbell': require('../../assets/exercises/incline_bench_dumbbell.jpg'),
  'chest_fly_dumbbell': require('../../assets/exercises/chest_fly_dumbbell.jpg'),
  'chest_fly_machine': require('../../assets/exercises/chest_fly_machine.jpg'),
  'chest_fly_cable': require('../../assets/exercises/chest_fly_cable.jpg'),
  'cable_crossover_low_high': require('../../assets/exercises/cable_crossover_low_high.jpg'),
  'cable_crossover_high_low': require('../../assets/exercises/cable_crossover_high_low.jpg'),
  'dips_bodyweight': require('../../assets/exercises/dips_bodyweight.jpg'),
  'dips_assisted': require('../../assets/exercises/dips_assisted.jpg'),
  'dips_machine': require('../../assets/exercises/dips_machine.jpg'),
  'close_grip_bench': require('../../assets/exercises/close_grip_bench.jpg'),
  'spoto_press': require('../../assets/exercises/spoto_press.jpg'),

  // BACK
  'bent_over_row_overhand': require('../../assets/exercises/bent_over_row_overhand.jpg'),
  'bent_over_row_pendlay': require('../../assets/exercises/bent_over_row_pendlay.jpg'),
  'one_arm_row_dumbbell': require('../../assets/exercises/one_arm_row_dumbbell.jpg'),
  'lat_pulldown': require('../../assets/exercises/lat_pulldown.jpg'),
  'chin_up_assisted': require('../../assets/exercises/chin_up_assisted.jpg'),
  'pull_up_assisted': require('../../assets/exercises/pull_up_assisted.jpg'),
  'seated_row_45deg': require('../../assets/exercises/seated_row_45deg.jpg'),
  'seated_row_horizontal': require('../../assets/exercises/seated_row_horizontal.jpg'),
  'seated_row_vertical': require('../../assets/exercises/seated_row_vertical.jpg'),
  'back_extension_machine': require('../../assets/exercises/back_extension_machine.jpg'),

  // SHOULDERS
  'shoulder_press_machine': require('../../assets/exercises/shoulder_press_machine.jpg'),
  'shoulder_press_dumbbell': require('../../assets/exercises/shoulder_press_dumbbell.jpg'),
  'shoulder_press_barbell_seated': require('../../assets/exercises/shoulder_press_barbell_seated.jpg'),
  'shoulder_press_barbell_standing': require('../../assets/exercises/shoulder_press_barbell_standing.jpg'),
  'lateral_raise_dumbbell': require('../../assets/exercises/lateral_raise_dumbbell.jpg'),
  'lateral_raise_seated': require('../../assets/exercises/lateral_raise_seated.jpg'),
  'lateral_raise_machine': require('../../assets/exercises/lateral_raise_machine.jpg'),
  'lateral_raise_cable_single': require('../../assets/exercises/lateral_raise_cable_single.jpg'),
  'lateral_raise_cable_both': require('../../assets/exercises/lateral_raise_cable_both.jpg'),
  'front_raise_dumbbell': require('../../assets/exercises/front_raise_dumbbell.jpg'),
  'rear_delt_fly_cable': require('../../assets/exercises/rear_delt_fly_cable.jpg'),
  'rear_delt_fly_machine': require('../../assets/exercises/rear_delt_fly_machine.jpg'),
  'rear_delt_fly_single': require('../../assets/exercises/rear_delt_fly_single.jpg'),

  // BICEPS
  'bicep_curl_dumbbell': require('../../assets/exercises/bicep_curl_dumbbell.jpg'),
  'bicep_curl_ez_bar': require('../../assets/exercises/bicep_curl_ez_bar.jpg'),
  'bicep_curl_one_arm': require('../../assets/exercises/bicep_curl_one_arm.jpg'),
  'hammer_curl_dumbbell': require('../../assets/exercises/hammer_curl_dumbbell.jpg'),
  'hammer_curl_preacher': require('../../assets/exercises/hammer_curl_preacher.jpg'),
  'bicep_curl_supinated': require('../../assets/exercises/bicep_curl_supinated.jpg'),
  'preacher_curl_ez_bar': require('../../assets/exercises/preacher_curl_ez_bar.jpg'),
  'preacher_curl_machine': require('../../assets/exercises/preacher_curl_machine.jpg'),
  'concentration_curl': require('../../assets/exercises/concentration_curl.jpg'),
  'high_cable_curl': require('../../assets/exercises/high_cable_curl.jpg'),
  'incline_dumbbell_curl': require('../../assets/exercises/incline_dumbbell_curl.jpg'),

  // TRICEPS
  'skull_crusher': require('../../assets/exercises/skull_crusher.jpg'),
  'skull_crusher_overhead': require('../../assets/exercises/skull_crusher_overhead.jpg'),
  'overhead_tricep_extension': require('../../assets/exercises/overhead_tricep_extension.jpg'),

  // LEGS
  'squat_high_bar': require('../../assets/exercises/squat_high_bar.jpg'),
  'squat_low_bar': require('../../assets/exercises/squat_low_bar.jpg'),
  'front_squat': require('../../assets/exercises/front_squat.jpg'),
  'deadlift_conventional': require('../../assets/exercises/deadlift_conventional.jpg'),
  'deadlift_sumo': require('../../assets/exercises/deadlift_sumo.jpg'),
  'deadlift_romanian': require('../../assets/exercises/deadlift_romanian.jpg'),
  'leg_extension': require('../../assets/exercises/leg_extension.jpg'),
  'leg_curl_lying': require('../../assets/exercises/leg_curl_lying.jpg'),
  'leg_curl_seated': require('../../assets/exercises/leg_curl_seated.jpg'),
  'hip_abduction': require('../../assets/exercises/hip_abduction.jpg'),
  'hip_adduction': require('../../assets/exercises/hip_adduction.jpg'),
  'hip_thrust_machine': require('../../assets/exercises/hip_thrust_machine.jpg'),
  'calf_raise_machine': require('../../assets/exercises/calf_raise_machine.jpg'),
  'calf_raise_leg_press': require('../../assets/exercises/calf_raise_leg_press.jpg'),
  'calf_raise_horizontal_press': require('../../assets/exercises/calf_raise_horizontal_press.jpg'),
  'leg_press_high_foot': require('../../assets/exercises/leg_press_high_foot.jpg'),
  'leg_press_low_foot': require('../../assets/exercises/leg_press_low_foot.jpg'),
  'leg_press_horizontal_high': require('../../assets/exercises/leg_press_horizontal_high.jpg'),
  'leg_press_horizontal_low': require('../../assets/exercises/leg_press_horizontal_low.jpg'),
};

const EXERCISE_IMAGE_MAPPING = {
  // ============ CHEST ============
  "Bench Press": {
    "Barbell": "LOCAL:bench_press_barbell",
    "Dumbbell": "LOCAL:bench_press_dumbbell",
    "Smith Machine": "Smith_Machine_Bench_Press",
    "Machine": "LOCAL:bench_press_machine",
    "Spoto Press (Barbell)": "LOCAL:spoto_press"
  },

  "Incline Bench Press": {
    "Barbell": "Barbell_Incline_Bench_Press_-_Medium_Grip",
    "Dumbbell": "LOCAL:incline_bench_dumbbell",
    "Smith Machine": "Smith_Machine_Incline_Bench_Press",
    "Machine": "Leverage_Incline_Chest_Press"
  },


  "Chest Fly": {
    "Dumbbell": "LOCAL:chest_fly_dumbbell",
    "Cable": "LOCAL:chest_fly_cable",
    "Machine (Pec Deck)": "LOCAL:chest_fly_machine"
  },

  "Cable Crossover": {
    "High to Low": "LOCAL:cable_crossover_high_low",
    "Low to High": "LOCAL:cable_crossover_low_high"
  },

  "Push-ups": {
    "Standard": "Pushups",
    "Wide Grip": "Push-Up_Wide",
    "Diamond": "Push-Ups_-_Close_Triceps_Position",
    "Decline": "Decline_Push-Up"
  },

  "Chest Dips": {
    "Bodyweight": "LOCAL:dips_bodyweight",
    "Weighted (Dip Belt)": "LOCAL:weighted_chest_dip",
    "Assisted Machine": "LOCAL:dips_assisted",
    "Dip Machine": "LOCAL:dips_machine"
  },

  "Machine Chest Press": {
    "Machine Horizontal Handle": "LOCAL:chest_press_horizontal",
    "Machine Vertical Handle": "LOCAL:chest_press_vertical"
  },

  // ============ BACK ============
  "Lat Pulldown": {
    "Wide Grip": "LOCAL:lat_pulldown",
    "Close Grip": "Close-Grip_Front_Lat_Pulldown",
    "Reverse Grip (Supinated)": "Underhand_Cable_Pulldowns",
    "V-Bar (Neutral Grip)": "V-Bar_Pulldown",
    "Wide Neutral Grip": "LOCAL:lat_pulldown",
    "Single Arm": "One_Arm_Lat_Pulldown",
    "Dual Handles": "Full_Range-Of-Motion_Lat_Pulldown"
  },

  "Cable Row": {
    "Low Angle (lats focus)": "Seated_Cable_Rows",
    "Mid Angle (rhomboids/traps focus)": "Seated_Cable_Rows",
    "High Angle (upper back/rear delts focus)": "Leverage_High_Row"
  },

  "One Arm Row": {
    "Dumbbell": "LOCAL:one_arm_row_dumbbell",
    "Cable": "Seated_One-arm_Cable_Pulley_Rows"
  },

  "Bent Over Row": {
    "Barbell Overhand": "LOCAL:bent_over_row_overhand",
    "Barbell Underhand": "LOCAL:bent_over_row_overhand",
    "Pendlay": "LOCAL:bent_over_row_pendlay"
  },

  "Pullover": {
    "Cable Standing": null,
    "Cable Lying": null,
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
    "Shoulder Width": "LOCAL:chin_up_assisted",
    "Narrow Grip": "LOCAL:chin_up_assisted"
  },

  "Muscle Up": {
    "Bar": "Muscle_Up",
    "Ring": "Muscle_Up"
  },

  "Pull Ups": {
    "Wide Grip": "Wide-Grip_Rear_Pull-Up",
    "Shoulder Width": "Pullups"
  },

  "Weighted Pull Ups": {
    "Dip Belt with Plates": "Pullups",
    "Dumbbell Between Feet": "Pullups",
    "Weight Vest": "Pullups"
  },

  "T-Bar Row": {
    "T-Bar Machine": "Lying_T-Bar_Row",
    "Landmine Barbell": "Lying_T-Bar_Row"
  },

  "Assisted Pull-up": {
    "Assisted Pull-up Machine": "LOCAL:pull_up_assisted",
    "Resistance Band": "Band_Assisted_Pull-Up"
  },

  "Seated Row Machine": {
    "Machine 45° Handles": "LOCAL:seated_row_45deg",
    "Machine Horizontal Handles": "LOCAL:seated_row_horizontal",
    "Machine Vertical Handles": "LOCAL:seated_row_vertical"
  },

  "Back Extension": {
    "Machine": "LOCAL:back_extension_machine",
    "Roman Chair": "LOCAL:back_extension_machine",
    "Bodyweight": "LOCAL:back_extension_machine"
  },

  // ============ SHOULDERS ============
  "Shoulder Press": {
    "Barbell": "LOCAL:shoulder_press_barbell_seated",
    "Dumbbell Seated": "LOCAL:shoulder_press_dumbbell",
    "Machine": "LOCAL:shoulder_press_machine",
    "Smith Machine": "Smith_Machine_Overhead_Shoulder_Press"
  },

  "Lateral Raise": {
    "Dumbbell": "LOCAL:lateral_raise_dumbbell",
    "Dumbbell Seated": "LOCAL:lateral_raise_seated",
    "Cable Single": "LOCAL:lateral_raise_cable_single",
    "Cable Both": "LOCAL:lateral_raise_cable_both",
    "Machine": "LOCAL:lateral_raise_machine"
  },

  "Front Raise": {
    "Barbell": "Standing_Front_Barbell_Raise_Over_Head",
    "Dumbbell": "LOCAL:front_raise_dumbbell",
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
    "Cable Cross": "LOCAL:rear_delt_fly_cable",
    "Machine Pec Deck Reverse": "LOCAL:rear_delt_fly_machine",
    "Machine Single Arm": "LOCAL:rear_delt_fly_single"
  },

  "Upright Row": {
    "Barbell": "Upright_Barbell_Row",
    "Dumbbell": "Standing_Dumbbell_Upright_Row",
    "Cable": "Upright_Cable_Row",
    "EZ Bar": "Upright_Row_-_With_Bands"
  },

  "Face Pull": {
    "Cable Rope": "Face_Pull",
    "Resistance Band": "Face_Pull"
  },

  // ============ BICEPS ============
  "Bicep Curl": {
    "Incline Dumbbell": "LOCAL:incline_dumbbell_curl",
    "Barbell": "Barbell_Curl",
    "EZ Bar": "LOCAL:bicep_curl_ez_bar",
    "Dumbbell Standing": "LOCAL:bicep_curl_dumbbell",
    "Cable Standing": "Standing_Biceps_Cable_Curl"
  },

  "One Arm Bicep Curl": {
    "Dumbbell": "LOCAL:bicep_curl_one_arm",
    "Cable Low": "Standing_One-Arm_Cable_Curl",
    "Cable Mid": "Standing_One-Arm_Cable_Curl",
    "Cable Front": "Standing_One-Arm_Cable_Curl",
    "Cable Back": "Standing_One-Arm_Cable_Curl"
  },

  "Hammer Curl": {
    "Cable Rope": "Cable_Hammer_Curls_-_Rope_Attachment",
    "Dumbbell": "LOCAL:hammer_curl_dumbbell",
    "Dumbbell Seated": "Incline_Hammer_Curls",
    "Preacher Machine": "LOCAL:hammer_curl_preacher"
  },

  "Preacher Curl": {
    "Machine": "LOCAL:preacher_curl_machine",
    "Dumbbell": "One_Arm_Dumbbell_Preacher_Curl",
    "EZ Bar": "LOCAL:preacher_curl_ez_bar"
  },

  "Concentration Curl": {
    "Dumbbell Seated": "LOCAL:concentration_curl"
  },

  "High Cable Curl": {
    "Double Cable": "LOCAL:high_cable_curl"
  },

  "Reverse Curl": {
    "Barbell": "Reverse_Barbell_Curl",
    "EZ Bar": "Reverse_Cable_Curl",
    "Dumbbell": "Standing_Dumbbell_Reverse_Curl"
  },

  "Spider Curl": {
    "EZ Bar": "Spider_Curl",
    "Dumbbell": "Dumbbell_Prone_Incline_Curl"
  },

  "Zottman Curl": {
    "Dumbbell": "Zottman_Curl"
  },

  // ============ TRICEPS ============
  "Tricep Pushdown": {
    "Cable Rope": "Triceps_Pushdown_-_Rope_Attachment",
    "Straight Bar": "Triceps_Pushdown",
    "V-Bar": "Triceps_Pushdown_-_V-Bar_Attachment"
  },

  "One Arm Tricep Pushdown": {
    "Single Handle": "Cable_One_Arm_Tricep_Extension",
    "Rope": "Standing_Low-Pulley_One-Arm_Triceps_Extension"
  },

  "Overhead Tricep Extension": {
    "Cable Rope": "Cable_Rope_Overhead_Triceps_Extension",
    "Dumbbell Two-Handed": "LOCAL:overhead_tricep_extension",
    "EZ Bar": "Incline_Barbell_Triceps_Extension"
  },

  "One Arm Overhead Extension": {
    "Dumbbell": "Dumbbell_One-Arm_Triceps_Extension",
    "Cable": "Kneeling_Cable_Triceps_Extension"
  },

  "Skull Crusher": {
    "EZ Bar": "LOCAL:skull_crusher",
    "Barbell": "Lying_Triceps_Press",
    "Dumbbell": "Decline_Dumbbell_Triceps_Extension",
    "Overhead EZ Bar": "LOCAL:skull_crusher_overhead"
  },

  "Dips": {
    "Parallel Bars": "LOCAL:dips_bodyweight",
    "Assisted Machine": "LOCAL:dips_assisted",
    "Bench Dips": "Bench_Dips"
  },

  "Close Grip Bench Press": {
    "Barbell": "LOCAL:close_grip_bench",
    "Smith Machine": "Smith_Machine_Close-Grip_Bench_Press",
    "Dumbbell": "Close-Grip_Dumbbell_Press"
  },

  "Cable Incline Tricep Extension": {
    "Overhead Rope": "Triceps_Overhead_Extension_with_Rope",
    "Incline Bar": "Cable_Incline_Triceps_Extension"
  },

  "Diamond Push-ups": {
    "Bodyweight": "Push-Ups_-_Close_Triceps_Position",
    "Weight Vest": "Close-Grip_Push-Up_off_of_a_Dumbbell",
    "Elevated": "Incline_Push-Up_Close-Grip"
  },

  "Weighted Dips": {
    "Dip Belt": "LOCAL:weighted_chest_dip",
    "Dumbbell Between Legs": "Ring_Dips",
    "Weight Vest": "Weighted_Bench_Dip"
  },

  // ============ ABS ============
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
    "Dumbbell": "Russian_Twist"
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

  // ============ LEGS ============
  "Leg Extension": {
    "Machine": "LOCAL:leg_extension"
  },

  "Leg Curl": {
    "Lying Machine": "LOCAL:leg_curl_lying",
    "Seated Machine": "LOCAL:leg_curl_seated",
    "Standing Machine": "Standing_Leg_Curl"
  },

  "Standing Calf Raise": {
    "Machine": "LOCAL:calf_raise_machine",
    "Smith Machine": "Smith_Machine_Calf_Raise",
    "Barbell": "Standing_Barbell_Calf_Raise",
    "Leg Press": "LOCAL:calf_raise_leg_press",
    "Horizontal Leg Press": "LOCAL:calf_raise_horizontal_press"
  },

  "Squat": {
    "Barbell High Bar": "LOCAL:squat_high_bar",
    "Barbell Low Bar": "LOCAL:squat_low_bar",
    "Smith Machine": "Smith_Machine_Squat",
    "Dumbbell Goblet": "Dumbbell_Squat"
  },

  "Hip Abduction": {
    "Machine": "LOCAL:hip_abduction",
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
    "Machine": "LOCAL:hip_thrust_machine",
    "Smith Machine": "LOCAL:hip_thrust_machine"
  },

  "Hack Squat": {
    "Machine": "Hack_Squat",
    "Barbell Reverse": "Barbell_Hack_Squat"
  },

  "Lunges": {
    "Dumbbell Walking": "Dumbbell_Lunges",
    "Barbell Walking": "Barbell_Walking_Lunge",
    "Dumbbell Stationary": "Dumbbell_Lunges",
    "Bodyweight": "Bodyweight_Walking_Lunge",
    "Reverse Lunge": "Dumbbell_Rear_Lunge",
    "Smith Machine": "Bodyweight_Walking_Lunge"
  },

  "Seated Calf Raise": {
    "Machine": "Seated_Calf_Raise",
    "Dumbbell": "Dumbbell_Seated_One-Leg_Calf_Raise"
  },

  "Deadlift": {
    "Barbell Conventional": "LOCAL:deadlift_conventional",
    "Barbell Sumo": "LOCAL:deadlift_sumo",
    "Trap Bar": "Barbell_Deadlift",
    "Dumbbell Romanian": "Stiff-Legged_Dumbbell_Deadlift",
    "Barbell Romanian": "LOCAL:deadlift_romanian"
  },

  "Leg Press": {
    "45° Machine": "Leg_Press",
    "45° High Foot (Hamstring)": "LOCAL:leg_press_high_foot",
    "45° Low Foot (Quad)": "LOCAL:leg_press_low_foot",
    "Horizontal Machine": "Leg_Press",
    "Horizontal High Foot (Hamstring)": "LOCAL:leg_press_horizontal_high",
    "Horizontal Low Foot (Quad)": "LOCAL:leg_press_horizontal_low"
  },

  "Bulgarian Split Squat": {
    "Dumbbell": "Split_Squat_with_Dumbbells",
    "Barbell": "Barbell_Side_Split_Squat",
    "Bodyweight": "Single-Leg_Leg_Extension",
    "Smith Machine": "Split_Squat_with_Dumbbells"
  },

  "Front Squat": {
    "Barbell": "LOCAL:front_squat",
    "Dumbbell": "Dumbbell_Squat",
    "Smith Machine": "Smith_Machine_Squat"
  },

  "Step-Ups": {
    "Dumbbell": "Dumbbell_Step_Ups",
    "Barbell": "Barbell_Step_Ups",
    "Bodyweight": "Bodyweight_Walking_Lunge"
  },

  "Hip Adduction": {
    "Machine": "LOCAL:hip_adduction",
    "Cable": "Cable_Hip_Adduction"
  },

  "Glute Bridge": {
    "Barbell": "Barbell_Glute_Bridge",
    "Dumbbell": "Dumbbell_Bench_Press",
    "Bodyweight": "Butt_Lift_Bridge"
  },

  // ============ FOREARMS ============
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

  "Reverse Curl": {
    "Barbell": "Reverse_Barbell_Curl",
    "EZ Bar": "Reverse_Cable_Curl",
    "Dumbbell": "Standing_Dumbbell_Reverse_Curl"
  },

  // ============ CARDIO - NO IMAGES ============
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
 * Supports both remote (Free Exercise DB) and local images
 * Local images use "LOCAL:imagename" format in mapping
 */
export function getVariantImage(exerciseName, equipment, imageIndex = 0) {
  // Strip equipment suffix like "(Barbell)" or nested "(Machine (Pec Deck))" from exercise name
  const cleanName = exerciseName?.replace(/\s*\(.*$/, '').trim();

  if (!EXERCISE_IMAGE_MAPPING[cleanName]) {
    console.warn(`No image mapping found for exercise: ${exerciseName} (clean: ${cleanName})`);
    return null;
  }

  const exerciseId = EXERCISE_IMAGE_MAPPING[cleanName][equipment];
  if (!exerciseId) {
    console.warn(`No image mapping found for ${exerciseName} with equipment: ${equipment}`);
    return null;
  }

  // Check if this is a local image
  if (exerciseId.startsWith('LOCAL:')) {
    const localKey = exerciseId.replace('LOCAL:', '');
    if (LOCAL_IMAGES[localKey]) {
      return LOCAL_IMAGES[localKey]; // Returns require() result for React Native
    }
    console.warn(`Local image not found: ${localKey}`);
    return null;
  }

  const imageUrl = `${BASE_URL}${exerciseId}/${imageIndex}.jpg`;
  return imageUrl;
}

/**
 * Get both images for an exercise variant
 * For local images, returns the same image twice (local images are single)
 */
export function getVariantImages(exerciseName, equipment) {
  const exerciseId = EXERCISE_IMAGE_MAPPING[exerciseName]?.[equipment];

  // Local images only have one image
  if (exerciseId && exerciseId.startsWith('LOCAL:')) {
    const image = getVariantImage(exerciseName, equipment, 0);
    if (!image) return null;
    return [image, image]; // Return same image for both positions
  }

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
 * Check if an exercise variant uses a local image
 * Useful for components that need to handle local vs remote images differently
 */
export function isLocalImage(exerciseName, equipment) {
  const exerciseId = EXERCISE_IMAGE_MAPPING[exerciseName]?.[equipment];
  return exerciseId && exerciseId.startsWith('LOCAL:');
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
  isLocalImage,
  getPlaceholderImage,
  getAvailableEquipmentWithImages
};
