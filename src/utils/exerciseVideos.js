/**
 * Exercise Video Mapping
 * Streams videos from GitHub (full quality, free hosting)
 * Updated: 2025-12-25
 */

// GitHub raw URL base
const VIDEO_BASE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/exercise-videos/';

// Video filename mapping
const VIDEO_FILES = {
  // CHEST
  'bench_press_barbell': 'barbell_bench_press_chest.mp4',
  'bench_press_dumbbell': 'dumbbell_bench_press.mp4',
  'bench_press_machine': 'bench_press_machine.mp4',
  'bench_press_smith': 'smith machine bench press.MP4',
  'chest_press_horizontal': 'horizontal_handle_chest_press_machine.mp4',
  'chest_press_vertical': 'vertical_handle_chest_press_machine.mp4',
  'incline_bench_dumbbell': 'incline_dumbell_bench_press.mp4',
  'incline_bench_barbell': 'incline barbell bench press.MP4',
  'incline_bench_smith': 'incline smith machine bench press.MP4',
  'chest_fly_dumbbell': 'dumbbel_chest_flyes.mp4',
  'chest_fly_machine': 'machine_fly.mp4',
  'chest_fly_cable': 'cable_chest_fly.mp4',
  'cable_crossover_low_high': 'cable_fly_low_to_high.mp4',
  'cable_crossover_high_low': 'chest_fly_high_to_low.mp4',
  'dips_bodyweight': 'dips.mp4',
  'dips_weighted': 'weighted dips.MP4',
  'dips_assisted': 'assisted_dips.mp4',
  'dips_machine': 'dip_machine.mp4',
  'close_grip_bench': 'close_grip__barbell_bench_press.mp4',
  'close_grip_bench_smith': 'smith machine close grip bench press.MP4',
  'spoto_press': 'spoto__barbell_press.mp4',
  'pushup_standard': 'standard pushup.MP4',
  'pushup_decline': 'decline push up.MP4',
  'pushup_incline': 'incline push-up.MP4',
  'pushup_wide': 'wide grip push up.MP4',
  'pushup_diamond': 'diamond push up.MP4',

  // BACK
  'bent_over_row_overhand': 'barbell_bent_over_row.mp4',
  'bent_over_row_pendlay': 'pendlay_barbell_row.mp4',
  'bent_over_row_dumbbell': 'dumbell dual row.MP4',
  'bent_over_row_smith': 'smith machine row.MP4',
  'one_arm_row_dumbbell': 'dumbbell_bent_over_row_single.mp4',
  'lat_pulldown': 'machine_lat_pulldown_.mp4',
  'lat_pulldown_wide': 'wide grip lat pulldown.MP4',
  'lat_pulldown_close': 'close grip lat pulldown.MP4',
  'lat_pulldown_parallel': 'parralel grip lat pulldown.MP4',
  'lat_pulldown_reverse': 'reverse grip lat pulldown.MP4',
  'lat_pulldown_vbar': 'v-bar lat pulldown.MP4',
  'lat_pulldown_single': 'single arm lat pulldown.MP4',
  'chin_up_bodyweight': 'chin ups.MP4',
  'chin_up_weighted': 'weighted chin ups.mp4',
  'chin_up_assisted': 'assisted_chin_up.mp4',
  'pull_up_bodyweight': 'pull ups.MP4',
  'pull_up_weighted': 'weighted pull ups.mp4',
  'pull_up_assisted': 'assisted_wide_grip_pull_up.mp4',
  'muscle_up': 'muscle ups.MP4',
  'seated_row_45deg': '45-degree_angled_handles_row_machine.mp4',
  'seated_row_horizontal': 'horizontal_handles_row_machine.mp4',
  'seated_row_vertical': 'vertical_handles_row_machine.mp4',
  'tbar_row_landmine': 't bar landmine row.MP4',
  'tbar_row_vbar': 'v-bar landmine row.MP4',
  'trx_row': 'trx row.MOV',
  'back_extension_machine': 'lower_back_extension_machine.mp4',
  'back_extension_bodyweight': 'back extension.MP4',
  'back_extension_weighted': 'weighted back extension.MP4',

  // SHOULDERS
  'shoulder_press_machine': 'shoulder_press_machine.mp4',
  'shoulder_press_dumbbell': 'shoulder_press_dumbbel.mp4',
  'shoulder_press_barbell_seated': 'seated_barbell_shoulder_press.mp4',
  'shoulder_press_barbell_standing': 'standing_barbell_shoulder_press.mp4',
  'shoulder_press_smith': 'smith machine shoulder press.MP4',
  'lateral_raise_dumbbell': 'dumbbell_lateral_raises.mp4',
  'lateral_raise_seated': 'seated_dumbbell_lateral_raises.mp4',
  'lateral_raise_machine': 'lateral_raise_machine.mp4',
  'lateral_raise_cable_single': 'single_cable_lateral_raise.mp4',
  'lateral_raise_cable_both': 'dual_cable_lateral_raise.mp4',
  'front_raise_dumbbell': 'dumbbell_font_raises.mp4',
  'front_raise_cable': 'cable single front raise.MP4',
  'rear_delt_fly_cable': 'cable_rear_delt_fly.mp4',
  'rear_delt_fly_machine': 'rear_delt_pec_dec_machine.mp4',
  'rear_delt_fly_single': 'single_rear_delt_pec_dec_machine.mp4',
  'rear_delt_fly_trx': 'trx rear delt pull.mp4',
  'shrugs_barbell': 'barbell shrugs.MP4',
  'shrugs_smith': 'smith machine shrugs.MP4',
  'shrugs_machine': 'chest supported shrugs.MP4',
  'upright_row_barbell': 'barbell upright row.MP4',
  'upright_row_cable': 'cable upright row.MP4',
  'face_pull_rear_delt': 'Cable Rear Delt Face Pull.MP4',
  'face_pull_lats': 'cable face pull (lats).MP4',

  // BICEPS
  'bicep_curl_dumbbell': 'dumbbell_bicep_curl.mp4',
  'bicep_curl_ez_bar': 'ez_bar_standing_bicep_curl.mp4',
  'bicep_curl_cable': 'cable bicep curl.MP4',
  'bicep_curl_one_arm': 'one_arm_dumbbell_bicep_curl.mp4',
  'bicep_curl_one_arm_cable': 'cable curl single arm .mp4',
  'bicep_curl_single_arm_cable_alt': 'single arm bicep curl cable.MP4',
  'hammer_curl_dumbbell': 'hammer_curl.mp4',
  'hammer_curl_cable': 'cable hammer curl.MP4',
  'hammer_curl_preacher': 'preacher_hammer_curl_machine.mp4',
  'hammer_curl_incline': 'seated incline hammer curl.MP4',
  'bicep_curl_supinated': 'supinated_dumbbell_curls.mp4',
  'preacher_curl_ez_bar': 'ez-bar_preacher_curl.mp4',
  'preacher_curl_machine': 'preacher_curl_machine.mp4',
  'concentration_curl': 'dumbbell_concentration_curl.mp4',
  'high_cable_curl': 'dual_cable_bicep_curl.mp4',
  'cable_crossover_curl': 'cable_crossover_curl.mp4',
  'incline_dumbbell_curl': 'incline_dumbbel_bicep_curl.mp4',
  'spider_curl_dumbbell': 'dumbbell spider curl.MP4',
  'spider_curl_ez_bar': 'ez bar spider curls.MP4',
  'reverse_curl_cable': 'cable reverse curl.MP4',

  // TRICEPS
  'skull_crusher': 'skullcrusher.mp4',
  'skull_crusher_overhead': 'overhead_skullcrusher.mp4',
  'overhead_tricep_extension': 'seated_dumbbell_triceps_extension.mp4',
  'overhead_tricep_extension_cable': 'tricep extension rope.MP4',
  'one_arm_overhead_extension_cable': 'cable single arm overhead extension.MP4',
  'tricep_pushdown_rope': 'tricep pushdown rope.MP4',
  'tricep_pushdown_straight': 'tricep pushdown straight  bar.MP4',
  'tricep_pushdown_one_arm': 'one arm tricep pushdown.MP4',

  // LEGS
  'squat_high_bar': 'high-bar_squat.mp4',
  'squat_low_bar': 'low-bar_squat.mp4',
  'squat_smith': 'smith machine squat.MP4',
  'squat_goblet': 'goblet squat.MP4',
  'front_squat': 'front_barbell_squat.mp4',
  'deadlift_conventional': 'conventional_deadlift_barbell.mp4',
  'deadlift_sumo': 'sumo_deadlift_barbell.mp4',
  'deadlift_romanian': 'romanian_deadlift.mp4',
  'deadlift_dumbbell': 'dumbbell deadlift.MP4',
  'leg_extension': 'leg_extension_machine.mp4',
  'leg_curl_lying': 'lying_leg_curl.mp4',
  'leg_curl_seated': 'seated_leg_curl_machine.mp4',
  'hip_abduction': 'hip_abduction_machine.mp4',
  'hip_adduction': 'hip_adductor_machine.mp4',
  'hip_thrust_machine': 'hip_thrust_machine.mp4',
  'hip_thrust_barbell': 'barbell hip thrust.MP4',
  'hip_thrust_dumbbell': 'dumbell hip thurst.MP4',
  'calf_raise_machine': 'calf_extension_machine.mp4',
  'calf_raise_leg_press': 'leg_press_calf_extension.mp4',
  'calf_raise_horizontal_press': 'calf_extenstion_horizontal_leg_press_machine.mp4',
  'calf_raise_smith': 'smith machine calf raises.MP4',
  'calf_raise_smith_elevated': 'elevated smith machine calf raises.MP4',
  'leg_press_high_foot': 'high_foot_placement_leg_press_(hamstring).mp4',
  'leg_press_low_foot': 'low_foot_placement_leg_press_(quads).mp4',
  'leg_press_horizontal_high': 'high_foot_placement_horizontal_leg_press_machine_(hamstring).mp4',
  'leg_press_horizontal_low': 'low_foot_placement_horizontal_leg_press_machine_(quads).mp4',
  'lunges_bodyweight': 'lunges.MP4',
  'lunges_dumbbell': 'dumbell lunges.MP4',
  'bulgarian_split_squat_dumbbell': 'dumbbel bulgarian split squat.MP4',
  'bulgarian_split_squat_single': 'single hand bulgarian split squat.MP4',
  'hang_clean': 'hang clean.MP4',
  'glute_kickback_cable': 'cable kickbacks.mp4',

  // CORE
  'crunches_bodyweight': 'crunches.MP4',
  'crunches_cable': 'cable crunches.MP4',
  'crunches_machine': 'machine crunch.MP4',
  'crunches_chest_supported': 'chest supported crunch machine.MP4',
  'plank': 'plank.MP4',
  'russian_twist': 'russian twist .mp4',
  'russian_twist_weighted': 'weighted russian twist.MP4',

  // FOREARMS
  'wrist_curl_cable': 'high cable wrist curl.MP4',
  'wrist_curl_cable_single': 'single high cable wrist curl.MP4',

  // CARDIO
  'treadmill': 'treadmill.MP4',
  'bike_upright': 'bike cardio machine.MP4',
  'bike_recumbent': 'recumbent bike machine.MP4',
  'elliptical': 'eliptical machine.MP4',
  'elliptical_horizontal': 'horizontal eliptical machine.MP4',
  'stair_climber': 'stair master.mp4',
  'rowing_machine': 'rowing machine.MP4',
  'burpees': 'burpees.MP4',
};

// Map exercise names and variants to video keys
const EXERCISE_VIDEO_MAPPING = {
  // CHEST
  'Bench Press': {
    'Barbell': 'bench_press_barbell',
    'Dumbbell': 'bench_press_dumbbell',
    'Machine': 'bench_press_machine',
    'Smith Machine': 'bench_press_smith',
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
    'Barbell': 'incline_bench_barbell',
    'Smith Machine': 'incline_bench_smith',
    'Machine': 'incline_bench_dumbbell',
    '_default': 'incline_bench_barbell',
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
    'Weighted': 'dips_weighted',
    'Assisted Machine': 'dips_assisted',
    'Dip Machine': 'dips_machine',
    '_default': 'dips_bodyweight',
  },
  'Dips': {
    'Bodyweight': 'dips_bodyweight',
    'Weighted': 'dips_weighted',
    'Assisted Machine': 'dips_assisted',
    'Machine': 'dips_machine',
    '_default': 'dips_bodyweight',
  },
  'Close Grip Bench Press': {
    '_default': 'close_grip_bench',
    'Barbell': 'close_grip_bench',
    'Smith Machine': 'close_grip_bench_smith',
  },
  'Push-ups': {
    'Standard': 'pushup_standard',
    'Decline': 'pushup_decline',
    'Incline': 'pushup_incline',
    'Wide Grip': 'pushup_wide',
    '_default': 'pushup_standard',
  },
  'Diamond Push-ups': {
    '_default': 'pushup_diamond',
  },

  // BACK
  'Bent Over Row': {
    'Barbell Overhand': 'bent_over_row_overhand',
    'Pendlay': 'bent_over_row_pendlay',
    'Dumbbell': 'bent_over_row_dumbbell',
    'Smith Machine': 'bent_over_row_smith',
    '_default': 'bent_over_row_overhand',
  },
  'One Arm Row': {
    'Dumbbell': 'one_arm_row_dumbbell',
  },
  'Lat Pulldown': {
    'Wide Grip': 'lat_pulldown_wide',
    'Close Grip': 'lat_pulldown_close',
    'Parallel Grip': 'lat_pulldown_parallel',
    'Reverse Grip': 'lat_pulldown_reverse',
    'V-Bar': 'lat_pulldown_vbar',
    'Single Arm': 'lat_pulldown_single',
    'Machine': 'lat_pulldown',
    '_default': 'lat_pulldown',
  },
  'Chin Up': {
    'Bodyweight': 'chin_up_bodyweight',
    'Weighted': 'chin_up_weighted',
    'Assisted': 'chin_up_assisted',
    '_default': 'chin_up_bodyweight',
  },
  'Pull Ups': {
    'Bodyweight': 'pull_up_bodyweight',
    'Weighted': 'pull_up_weighted',
    'Assisted': 'pull_up_assisted',
    '_default': 'pull_up_bodyweight',
  },
  'Weighted Pull Ups': {
    '_default': 'pull_up_weighted',
  },
  'Assisted Pull-up': {
    '_default': 'pull_up_assisted',
    'Assisted Pull-up Machine': 'pull_up_assisted',
  },
  'Band Assisted Pull-up': {
    '_default': 'pull_up_assisted',
  },
  'Muscle Up': {
    '_default': 'muscle_up',
  },
  'T-Bar Row': {
    'Landmine': 'tbar_row_landmine',
    'V-Bar': 'tbar_row_vbar',
    '_default': 'tbar_row_landmine',
  },
  'Seated Row Machine': {
    'Machine 45° Handles': 'seated_row_45deg',
    'Machine Horizontal Handles': 'seated_row_horizontal',
    'Machine Vertical Handles': 'seated_row_vertical',
  },
  'TRX Row': {
    '_default': 'trx_row',
  },
  'Back Extension': {
    'Machine': 'back_extension_machine',
    'Bodyweight': 'back_extension_bodyweight',
    'Weighted': 'back_extension_weighted',
    '_default': 'back_extension_bodyweight',
  },

  // SHOULDERS
  'Shoulder Press': {
    'Machine': 'shoulder_press_machine',
    'Dumbbell Seated': 'shoulder_press_dumbbell',
    'Dumbbell': 'shoulder_press_dumbbell',
    'Barbell Seated': 'shoulder_press_barbell_seated',
    'Barbell Standing': 'shoulder_press_barbell_standing',
    'Barbell': 'shoulder_press_barbell_seated',
    'Smith Machine': 'shoulder_press_smith',
    '_default': 'shoulder_press_dumbbell',
  },
  'Lateral Raise': {
    'Dumbbell': 'lateral_raise_dumbbell',
    'Dumbbell Seated': 'lateral_raise_seated',
    'Machine': 'lateral_raise_machine',
    'Cable Single': 'lateral_raise_cable_single',
    'Cable Both': 'lateral_raise_cable_both',
    '_default': 'lateral_raise_dumbbell',
  },
  'Front Raise': {
    'Dumbbell': 'front_raise_dumbbell',
    'Cable': 'front_raise_cable',
    '_default': 'front_raise_dumbbell',
  },
  'Rear Delt Fly': {
    'Cable Cross': 'rear_delt_fly_cable',
    'Machine Pec Deck Reverse': 'rear_delt_fly_machine',
    'Machine Single Arm': 'rear_delt_fly_single',
    'TRX': 'rear_delt_fly_trx',
    '_default': 'rear_delt_fly_cable',
  },
  'Shrugs': {
    'Barbell': 'shrugs_barbell',
    'Smith Machine': 'shrugs_smith',
    'Machine': 'shrugs_machine',
    '_default': 'shrugs_barbell',
  },
  'Upright Row': {
    'Barbell': 'upright_row_barbell',
    'Cable': 'upright_row_cable',
    '_default': 'upright_row_barbell',
  },
  'Face Pull': {
    'Cable Rope': 'face_pull_rear_delt',
    'Cable Rear Delt': 'face_pull_rear_delt',
    'Cable Lat Focus': 'face_pull_lats',
    'Resistance Band': 'face_pull_rear_delt',
    '_default': 'face_pull_rear_delt',
  },

  // BICEPS
  'Bicep Curl': {
    'Dumbbell Standing': 'bicep_curl_dumbbell',
    'Dumbbell': 'bicep_curl_dumbbell',
    'Incline Dumbbell': 'incline_dumbbell_curl',
    'EZ Bar': 'bicep_curl_ez_bar',
    'Cable': 'bicep_curl_cable',
    'Cable Standing': 'bicep_curl_cable',
    '_default': 'bicep_curl_dumbbell',
  },
  'One Arm Bicep Curl': {
    'Dumbbell': 'bicep_curl_one_arm',
    'Cable': 'bicep_curl_one_arm_cable',
    '_default': 'bicep_curl_one_arm',
  },
  'Hammer Curl': {
    'Dumbbell': 'hammer_curl_dumbbell',
    'Cable': 'hammer_curl_cable',
    'Preacher Machine': 'hammer_curl_preacher',
    'Incline Seated': 'hammer_curl_incline',
    '_default': 'hammer_curl_dumbbell',
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
  'Spider Curl': {
    'Dumbbell': 'spider_curl_dumbbell',
    'EZ Bar': 'spider_curl_ez_bar',
    '_default': 'spider_curl_dumbbell',
  },
  'Reverse Curl': {
    'Cable': 'reverse_curl_cable',
    '_default': 'reverse_curl_cable',
  },

  // TRICEPS
  'Skull Crusher': {
    'EZ Bar': 'skull_crusher',
    'Overhead EZ Bar': 'skull_crusher_overhead',
  },
  'Overhead Tricep Extension': {
    '_default': 'overhead_tricep_extension',
    'Dumbbell Two-Handed': 'overhead_tricep_extension',
    'Cable Rope': 'overhead_tricep_extension_cable',
  },
  'One Arm Overhead Extension': {
    'Cable': 'one_arm_overhead_extension_cable',
    '_default': 'one_arm_overhead_extension_cable',
  },
  'Tricep Pushdown': {
    'Cable Rope': 'tricep_pushdown_rope',
    'Rope': 'tricep_pushdown_rope',
    'Straight Bar': 'tricep_pushdown_straight',
    'V-Bar': 'tricep_pushdown_straight',
    '_default': 'tricep_pushdown_rope',
  },
  'One Arm Tricep Pushdown': {
    '_default': 'tricep_pushdown_one_arm',
    'Cable': 'tricep_pushdown_one_arm',
  },

  // LEGS
  'Squat': {
    'Barbell High Bar': 'squat_high_bar',
    'Barbell Low Bar': 'squat_low_bar',
    'Smith Machine': 'squat_smith',
    'Goblet': 'squat_goblet',
    '_default': 'squat_high_bar',
  },
  'Front Squat': {
    '_default': 'front_squat',
    'Barbell': 'front_squat',
  },
  'Deadlift': {
    'Barbell Conventional': 'deadlift_conventional',
    'Barbell Sumo': 'deadlift_sumo',
    'Barbell Romanian': 'deadlift_romanian',
    'Dumbbell': 'deadlift_dumbbell',
    '_default': 'deadlift_conventional',
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
    'Barbell': 'hip_thrust_barbell',
    'Dumbbell': 'hip_thrust_dumbbell',
    '_default': 'hip_thrust_barbell',
  },
  'Standing Calf Raise': {
    'Machine': 'calf_raise_machine',
    'Leg Press': 'calf_raise_leg_press',
    'Horizontal Leg Press': 'calf_raise_horizontal_press',
    'Smith Machine': 'calf_raise_smith',
    'Smith Machine Elevated': 'calf_raise_smith_elevated',
    '_default': 'calf_raise_machine',
  },
  'Leg Press': {
    '45° High Foot (Hamstring)': 'leg_press_high_foot',
    '45° Low Foot (Quad)': 'leg_press_low_foot',
    'Horizontal High Foot (Hamstring)': 'leg_press_horizontal_high',
    'Horizontal Low Foot (Quad)': 'leg_press_horizontal_low',
  },
  'Lunges': {
    'Bodyweight': 'lunges_bodyweight',
    'Dumbbell': 'lunges_dumbbell',
    '_default': 'lunges_bodyweight',
  },
  'Bulgarian Split Squat': {
    'Dumbbell': 'bulgarian_split_squat_dumbbell',
    'Single Dumbbell': 'bulgarian_split_squat_single',
    '_default': 'bulgarian_split_squat_dumbbell',
  },
  'Hang Clean': {
    '_default': 'hang_clean',
  },
  'Glute Kickback': {
    'Cable': 'glute_kickback_cable',
    '_default': 'glute_kickback_cable',
  },

  // CORE
  'Crunches': {
    'Bodyweight Floor': 'crunches_bodyweight',
    'Bodyweight': 'crunches_bodyweight',
    'Cable Kneeling': 'crunches_cable',
    'Cable': 'crunches_cable',
    'Machine': 'crunches_machine',
    '_default': 'crunches_bodyweight',
  },
  'Plank': {
    '_default': 'plank',
  },
  'Russian Twist': {
    'Bodyweight': 'russian_twist',
    'Weighted': 'russian_twist_weighted',
    '_default': 'russian_twist',
  },

  // FOREARMS
  'Wrist Curl': {
    'Cable': 'wrist_curl_cable',
    'Cable Single': 'wrist_curl_cable_single',
    '_default': 'wrist_curl_cable',
  },

  // CARDIO
  'Treadmill': {
    '_default': 'treadmill',
  },
  'Stationary Bike': {
    'Upright': 'bike_upright',
    'Recumbent': 'bike_recumbent',
    '_default': 'bike_upright',
  },
  'Elliptical': {
    'Standard': 'elliptical',
    'Horizontal': 'elliptical_horizontal',
    '_default': 'elliptical',
  },
  'Stair Climber': {
    '_default': 'stair_climber',
  },
  'Rowing Machine': {
    '_default': 'rowing_machine',
  },
  'Burpees': {
    '_default': 'burpees',
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
