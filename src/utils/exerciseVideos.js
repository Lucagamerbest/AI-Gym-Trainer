/**
 * Exercise Video Mapping
 * Streams videos from GitHub (full quality, free hosting)
 * Updated: 2025-12-24
 */

// GitHub raw URL base
const VIDEO_BASE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/exercise-videos/';

// Video filename mapping
const VIDEO_FILES = {
  // CHEST
  'bench_press_barbell': 'barbell_bench_press_chest.mp4',
  'bench_press_dumbbell': 'dumbbell_bench_press.mp4',
  'bench_press_machine': 'bench_press_machine.mp4',
  'chest_press_horizontal': 'horizontal_handle_chest_press_machine.mp4',
  'chest_press_vertical': 'vertical_handle_chest_press_machine.mp4',
  'incline_bench_dumbbell': 'incline_dumbell_bench_press.mp4',
  'chest_fly_dumbbell': 'dumbbel_chest_flyes.mp4',
  'chest_fly_machine': 'machine_fly.mp4',
  'chest_fly_cable': 'cable_chest_fly.mp4',
  'cable_crossover_low_high': 'cable_fly_low_to_high.mp4',
  'cable_crossover_high_low': 'chest_fly_high_to_low.mp4',
  'dips_bodyweight': 'dips.mp4',
  'dips_assisted': 'assisted_dips.mp4',
  'dips_machine': 'dip_machine.mp4',
  'close_grip_bench': 'close_grip__barbell_bench_press.mp4',
  'spoto_press': 'spoto__barbell_press.mp4',

  // BACK
  'bent_over_row_overhand': 'barbell_bent_over_row.mp4',
  'bent_over_row_pendlay': 'pendlay_barbell_row.mp4',
  'one_arm_row_dumbbell': 'dumbbell_bent_over_row_single.mp4',
  'lat_pulldown': 'machine_lat_pulldown_.mp4',
  'chin_up_assisted': 'assisted_chin_up.mp4',
  'pull_up_assisted': 'assisted_wide_grip_pull_up.mp4',
  'seated_row_45deg': '45-degree_angled_handles_row_machine.mp4',
  'seated_row_horizontal': 'horizontal_handles_row_machine.mp4',
  'seated_row_vertical': 'vertical_handles_row_machine.mp4',
  'back_extension_machine': 'lower_back_extension_machine.mp4',

  // SHOULDERS
  'shoulder_press_machine': 'shoulder_press_machine.mp4',
  'shoulder_press_dumbbell': 'shoulder_press_dumbbel.mp4',
  'shoulder_press_barbell_seated': 'seated_barbell_shoulder_press.mp4',
  'shoulder_press_barbell_standing': 'standing_barbell_shoulder_press.mp4',
  'lateral_raise_dumbbell': 'dumbbell_lateral_raises.mp4',
  'lateral_raise_seated': 'seated_dumbbell_lateral_raises.mp4',
  'lateral_raise_machine': 'lateral_raise_machine.mp4',
  'lateral_raise_cable_single': 'single_cable_lateral_raise.mp4',
  'lateral_raise_cable_both': 'dual_cable_lateral_raise.mp4',
  'front_raise_dumbbell': 'dumbbell_font_raises.mp4',
  'rear_delt_fly_cable': 'cable_rear_delt_fly.mp4',
  'rear_delt_fly_machine': 'rear_delt_pec_dec_machine.mp4',
  'rear_delt_fly_single': 'single_rear_delt_pec_dec_machine.mp4',

  // BICEPS
  'bicep_curl_dumbbell': 'dumbbell_bicep_curl.mp4',
  'bicep_curl_ez_bar': 'ez_bar_standing_bicep_curl.mp4',
  'bicep_curl_one_arm': 'one_arm_dumbbell_bicep_curl.mp4',
  'hammer_curl_dumbbell': 'hammer_curl.mp4',
  'hammer_curl_preacher': 'preacher_hammer_curl_machine.mp4',
  'bicep_curl_supinated': 'supinated_dumbbell_curls.mp4',
  'preacher_curl_ez_bar': 'ez-bar_preacher_curl.mp4',
  'preacher_curl_machine': 'preacher_curl_machine.mp4',
  'concentration_curl': 'dumbbell_concentration_curl.mp4',
  'high_cable_curl': 'dual_cable_bicep_curl.mp4',
  'cable_crossover_curl': 'cable_crossover_curl.mp4',
  'incline_dumbbell_curl': 'incline_dumbbel_bicep_curl.mp4',

  // TRICEPS
  'skull_crusher': 'skullcrusher.mp4',
  'skull_crusher_overhead': 'overhead_skullcrusher.mp4',
  'overhead_tricep_extension': 'seated_dumbbell_triceps_extension.mp4',

  // LEGS
  'squat_high_bar': 'high-bar_squat.mp4',
  'squat_low_bar': 'low-bar_squat.mp4',
  'front_squat': 'front_barbell_squat.mp4',
  'deadlift_conventional': 'conventional_deadlift_barbell.mp4',
  'deadlift_sumo': 'sumo_deadlift_barbell.mp4',
  'deadlift_romanian': 'romanian_deadlift.mp4',
  'leg_extension': 'leg_extension_machine.mp4',
  'leg_curl_lying': 'lying_leg_curl.mp4',
  'leg_curl_seated': 'seated_leg_curl_machine.mp4',
  'hip_abduction': 'hip_abduction_machine.mp4',
  'hip_adduction': 'hip_adductor_machine.mp4',
  'hip_thrust_machine': 'hip_thrust_machine.mp4',
  'calf_raise_machine': 'calf_extension_machine.mp4',
  'calf_raise_leg_press': 'leg_press_calf_extension.mp4',
  'calf_raise_horizontal_press': 'calf_extenstion_horizontal_leg_press_machine.mp4',
  'leg_press_high_foot': 'high_foot_placement_leg_press_(hamstring).mp4',
  'leg_press_low_foot': 'low_foot_placement_leg_press_(quads).mp4',
  'leg_press_horizontal_high': 'high_foot_placement_horizontal_leg_press_machine_(hamstring).mp4',
  'leg_press_horizontal_low': 'low_foot_placement_horizontal_leg_press_machine_(quads).mp4',
};

// Map exercise names and variants to video keys
const EXERCISE_VIDEO_MAPPING = {
  // CHEST
  'Bench Press': {
    'Barbell': 'bench_press_barbell',
    'Dumbbell': 'bench_press_dumbbell',
    'Machine': 'bench_press_machine',
    'Smith Machine': 'bench_press_barbell',
    'Spoto Press (Barbell)': 'spoto_press',
    '_default': 'bench_press_barbell',
  },
  'Machine Chest Press': {
    'Machine Horizontal Handle': 'chest_press_horizontal',
    'Machine Vertical Handle': 'chest_press_vertical',
    '_default': 'bench_press_machine',
  },
  'Incline Bench Press': {
    'Dumbbell': 'incline_bench_dumbbell',
    'Barbell': 'incline_bench_dumbbell',
    'Smith Machine': 'incline_bench_dumbbell',
    'Machine': 'incline_bench_dumbbell',
    '_default': 'incline_bench_dumbbell',
  },
  'Chest Fly': {
    'Dumbbell': 'chest_fly_dumbbell',
    'Machine (Pec Deck)': 'chest_fly_machine',
    'Cable': 'chest_fly_cable',
  },
  'Cable Crossover': {
    'Low to High': 'cable_crossover_low_high',
    'High to Low': 'cable_crossover_high_low',
  },
  'Chest Dips': {
    'Bodyweight': 'dips_bodyweight',
    'Assisted Machine': 'dips_assisted',
    'Dip Machine': 'dips_machine',
  },
  'Close Grip Bench Press': {
    '_default': 'close_grip_bench',
    'Barbell': 'close_grip_bench',
  },

  // BACK
  'Bent Over Row': {
    'Barbell Overhand': 'bent_over_row_overhand',
    'Pendlay': 'bent_over_row_pendlay',
  },
  'One Arm Row': {
    'Dumbbell': 'one_arm_row_dumbbell',
  },
  'Lat Pulldown': {
    '_default': 'lat_pulldown',
    'Wide Grip': 'lat_pulldown',
  },
  'Chin Up': {
    'Assisted': 'chin_up_assisted',
  },
  'Assisted Pull-up': {
    '_default': 'pull_up_assisted',
    'Assisted Pull-up Machine': 'pull_up_assisted',
  },
  'Seated Row Machine': {
    'Machine 45° Handles': 'seated_row_45deg',
    'Machine Horizontal Handles': 'seated_row_horizontal',
    'Machine Vertical Handles': 'seated_row_vertical',
  },
  'Back Extension': {
    '_default': 'back_extension_machine',
    'Machine': 'back_extension_machine',
  },

  // SHOULDERS
  'Shoulder Press': {
    'Machine': 'shoulder_press_machine',
    'Dumbbell Seated': 'shoulder_press_dumbbell',
    'Barbell': 'shoulder_press_barbell_seated',
  },
  'Lateral Raise': {
    'Dumbbell': 'lateral_raise_dumbbell',
    'Dumbbell Seated': 'lateral_raise_seated',
    'Machine': 'lateral_raise_machine',
    'Cable Single': 'lateral_raise_cable_single',
    'Cable Both': 'lateral_raise_cable_both',
  },
  'Front Raise': {
    'Dumbbell': 'front_raise_dumbbell',
  },
  'Rear Delt Fly': {
    'Cable Cross': 'rear_delt_fly_cable',
    'Machine Pec Deck Reverse': 'rear_delt_fly_machine',
    'Machine Single Arm': 'rear_delt_fly_single',
  },

  // BICEPS
  'Bicep Curl': {
    'Dumbbell Standing': 'bicep_curl_dumbbell',
    'Incline Dumbbell': 'incline_dumbbell_curl',
    'EZ Bar': 'bicep_curl_ez_bar',
  },
  'One Arm Bicep Curl': {
    'Dumbbell': 'bicep_curl_one_arm',
  },
  'Hammer Curl': {
    'Dumbbell': 'hammer_curl_dumbbell',
    'Preacher Machine': 'hammer_curl_preacher',
  },
  'Preacher Curl': {
    'EZ Bar': 'preacher_curl_ez_bar',
    'Machine': 'preacher_curl_machine',
  },
  'Concentration Curl': {
    '_default': 'concentration_curl',
    'Dumbbell Seated': 'concentration_curl',
  },
  'High Cable Curl': {
    '_default': 'high_cable_curl',
    'Double Cable': 'high_cable_curl',
  },

  // TRICEPS
  'Skull Crusher': {
    'EZ Bar': 'skull_crusher',
    'Overhead EZ Bar': 'skull_crusher_overhead',
  },
  'Overhead Tricep Extension': {
    '_default': 'overhead_tricep_extension',
    'Dumbbell Two-Handed': 'overhead_tricep_extension',
  },

  // LEGS
  'Squat': {
    'Barbell High Bar': 'squat_high_bar',
    'Barbell Low Bar': 'squat_low_bar',
  },
  'Front Squat': {
    '_default': 'front_squat',
    'Barbell': 'front_squat',
  },
  'Deadlift': {
    'Barbell Conventional': 'deadlift_conventional',
    'Barbell Sumo': 'deadlift_sumo',
    'Barbell Romanian': 'deadlift_romanian',
  },
  'Leg Extension': {
    '_default': 'leg_extension',
    'Machine': 'leg_extension',
  },
  'Leg Curl': {
    'Lying Machine': 'leg_curl_lying',
    'Seated Machine': 'leg_curl_seated',
  },
  'Hip Abduction': {
    '_default': 'hip_abduction',
    'Machine': 'hip_abduction',
  },
  'Hip Adduction': {
    '_default': 'hip_adduction',
    'Machine': 'hip_adduction',
  },
  'Hip Thrust': {
    'Machine': 'hip_thrust_machine',
  },
  'Standing Calf Raise': {
    'Machine': 'calf_raise_machine',
    'Leg Press': 'calf_raise_leg_press',
    'Horizontal Leg Press': 'calf_raise_horizontal_press',
  },
  'Leg Press': {
    '45° High Foot (Hamstring)': 'leg_press_high_foot',
    '45° Low Foot (Quad)': 'leg_press_low_foot',
    'Horizontal High Foot (Hamstring)': 'leg_press_horizontal_high',
    'Horizontal Low Foot (Quad)': 'leg_press_horizontal_low',
  },
};

/**
 * Get video URL for an exercise and variant
 * @param {string} exerciseName - The exercise name
 * @param {string} variantName - The variant name (optional)
 * @returns {string|null} - The video URL or null if not available
 */
export function getExerciseVideo(exerciseName, variantName = null) {
  // Strip equipment suffix like "(Barbell)" from exercise name
  const cleanName = exerciseName?.replace(/\s*\(.*$/, '').trim();

  const exerciseMapping = EXERCISE_VIDEO_MAPPING[cleanName];
  if (!exerciseMapping) {
    return null;
  }

  // Try exact variant match first
  let videoKey = null;
  if (variantName && exerciseMapping[variantName]) {
    videoKey = exerciseMapping[variantName];
  } else if (exerciseMapping['_default']) {
    videoKey = exerciseMapping['_default'];
  } else {
    videoKey = Object.values(exerciseMapping)[0];
  }

  if (!videoKey || !VIDEO_FILES[videoKey]) {
    return null;
  }

  // Return GitHub raw URL
  const filename = VIDEO_FILES[videoKey];
  return `${VIDEO_BASE_URL}${encodeURIComponent(filename)}`;
}

/**
 * Check if an exercise has a video available
 * @param {string} exerciseName - The exercise name
 * @param {string} variantName - The variant name (optional)
 * @returns {boolean}
 */
export function hasExerciseVideo(exerciseName, variantName = null) {
  return getExerciseVideo(exerciseName, variantName) !== null;
}

// Export for reference
export { VIDEO_FILES, EXERCISE_VIDEO_MAPPING, VIDEO_BASE_URL };
