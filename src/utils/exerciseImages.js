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

  // NEW - From video screenshots (150+ images)
  // CHEST
  'bench_press_barbell': require('../../assets/exercises/bench_press_barbell.jpg'),
  'bench_press_dumbbell': require('../../assets/exercises/bench_press_dumbbell.jpg'),
  'bench_press_machine': require('../../assets/exercises/bench_press_machine.jpg'),
  'bench_press_smith': require('../../assets/exercises/bench_press_smith.jpg'),
  'chest_press_horizontal': require('../../assets/exercises/chest_press_horizontal.jpg'),
  'chest_press_vertical': require('../../assets/exercises/chest_press_vertical.jpg'),
  'incline_bench_dumbbell': require('../../assets/exercises/incline_bench_dumbbell.jpg'),
  'incline_bench_barbell': require('../../assets/exercises/incline_bench_barbell.jpg'),
  'incline_bench_smith': require('../../assets/exercises/incline_bench_smith.jpg'),
  'chest_fly_dumbbell': require('../../assets/exercises/chest_fly_dumbbell.jpg'),
  'chest_fly_machine': require('../../assets/exercises/chest_fly_machine.jpg'),
  'chest_fly_cable': require('../../assets/exercises/chest_fly_cable.jpg'),
  'cable_crossover_low_high': require('../../assets/exercises/cable_crossover_low_high.jpg'),
  'cable_crossover_high_low': require('../../assets/exercises/cable_crossover_high_low.jpg'),
  'dips_bodyweight': require('../../assets/exercises/dips_bodyweight.jpg'),
  'dips_weighted': require('../../assets/exercises/dips_weighted.jpg'),
  'dips_assisted': require('../../assets/exercises/dips_assisted.jpg'),
  'dips_machine': require('../../assets/exercises/dips_machine.jpg'),
  'close_grip_bench': require('../../assets/exercises/close_grip_bench.jpg'),
  'close_grip_bench_smith': require('../../assets/exercises/close_grip_bench_smith.jpg'),
  'spoto_press': require('../../assets/exercises/spoto_press.jpg'),
  'pushup_standard': require('../../assets/exercises/pushup_standard.jpg'),
  'pushup_decline': require('../../assets/exercises/pushup_decline.jpg'),
  'pushup_incline': require('../../assets/exercises/pushup_incline.jpg'),
  'pushup_wide': require('../../assets/exercises/pushup_wide.jpg'),
  'pushup_diamond': require('../../assets/exercises/pushup_diamond.jpg'),

  // BACK
  'bent_over_row_overhand': require('../../assets/exercises/bent_over_row_overhand.jpg'),
  'bent_over_row_pendlay': require('../../assets/exercises/bent_over_row_pendlay.jpg'),
  'bent_over_row_dumbbell': require('../../assets/exercises/bent_over_row_dumbbell.jpg'),
  'bent_over_row_smith': require('../../assets/exercises/bent_over_row_smith.jpg'),
  'one_arm_row_dumbbell': require('../../assets/exercises/one_arm_row_dumbbell.jpg'),
  'lat_pulldown': require('../../assets/exercises/lat_pulldown.jpg'),
  'lat_pulldown_wide': require('../../assets/exercises/lat_pulldown_wide.jpg'),
  'lat_pulldown_close': require('../../assets/exercises/lat_pulldown_close.jpg'),
  'lat_pulldown_parallel': require('../../assets/exercises/lat_pulldown_parallel.jpg'),
  'lat_pulldown_reverse': require('../../assets/exercises/lat_pulldown_reverse.jpg'),
  'lat_pulldown_vbar': require('../../assets/exercises/lat_pulldown_vbar.jpg'),
  'lat_pulldown_single': require('../../assets/exercises/lat_pulldown_single.jpg'),
  'chin_up_assisted': require('../../assets/exercises/chin_up_assisted.jpg'),
  'chin_up_bodyweight': require('../../assets/exercises/chin_up_bodyweight.jpg'),
  'chin_up_weighted': require('../../assets/exercises/chin_up_weighted.jpg'),
  'pull_up_assisted': require('../../assets/exercises/pull_up_assisted.jpg'),
  'pull_up_bodyweight': require('../../assets/exercises/pull_up_bodyweight.jpg'),
  'pull_up_weighted': require('../../assets/exercises/pull_up_weighted.jpg'),
  'muscle_up': require('../../assets/exercises/muscle_up.jpg'),
  'tbar_row_landmine': require('../../assets/exercises/tbar_row_landmine.jpg'),
  'tbar_row_vbar': require('../../assets/exercises/tbar_row_vbar.jpg'),
  'trx_row': require('../../assets/exercises/trx_row.jpg'),
  'seated_row_45deg': require('../../assets/exercises/seated_row_45deg.jpg'),
  'seated_row_horizontal': require('../../assets/exercises/seated_row_horizontal.jpg'),
  'seated_row_vertical': require('../../assets/exercises/seated_row_vertical.jpg'),
  'back_extension_machine': require('../../assets/exercises/back_extension_machine.jpg'),
  'back_extension_bodyweight': require('../../assets/exercises/back_extension_bodyweight.jpg'),
  'back_extension_weighted': require('../../assets/exercises/back_extension_weighted.jpg'),

  // SHOULDERS
  'shoulder_press_machine': require('../../assets/exercises/shoulder_press_machine.jpg'),
  'shoulder_press_dumbbell': require('../../assets/exercises/shoulder_press_dumbbell.jpg'),
  'shoulder_press_barbell_seated': require('../../assets/exercises/shoulder_press_barbell_seated.jpg'),
  'shoulder_press_barbell_standing': require('../../assets/exercises/shoulder_press_barbell_standing.jpg'),
  'shoulder_press_smith': require('../../assets/exercises/shoulder_press_smith.jpg'),
  'lateral_raise_dumbbell': require('../../assets/exercises/lateral_raise_dumbbell.jpg'),
  'lateral_raise_seated': require('../../assets/exercises/lateral_raise_seated.jpg'),
  'lateral_raise_machine': require('../../assets/exercises/lateral_raise_machine.jpg'),
  'lateral_raise_cable_single': require('../../assets/exercises/lateral_raise_cable_single.jpg'),
  'lateral_raise_cable_both': require('../../assets/exercises/lateral_raise_cable_both.jpg'),
  'front_raise_dumbbell': require('../../assets/exercises/front_raise_dumbbell.jpg'),
  'front_raise_cable': require('../../assets/exercises/front_raise_cable.jpg'),
  'rear_delt_fly_cable': require('../../assets/exercises/rear_delt_fly_cable.jpg'),
  'rear_delt_fly_machine': require('../../assets/exercises/rear_delt_fly_machine.jpg'),
  'rear_delt_fly_single': require('../../assets/exercises/rear_delt_fly_single.jpg'),
  'rear_delt_fly_trx': require('../../assets/exercises/rear_delt_fly_trx.jpg'),
  'shrugs_barbell': require('../../assets/exercises/shrugs_barbell.jpg'),
  'shrugs_smith': require('../../assets/exercises/shrugs_smith.jpg'),
  'shrugs_machine': require('../../assets/exercises/shrugs_machine.jpg'),
  'upright_row_barbell': require('../../assets/exercises/upright_row_barbell.jpg'),
  'upright_row_cable': require('../../assets/exercises/upright_row_cable.jpg'),
  'face_pull_rear_delt': require('../../assets/exercises/face_pull_rear_delt.jpg'),
  'face_pull_lats': require('../../assets/exercises/face_pull_lats.jpg'),

  // BICEPS
  'bicep_curl_dumbbell': require('../../assets/exercises/bicep_curl_dumbbell.jpg'),
  'bicep_curl_ez_bar': require('../../assets/exercises/bicep_curl_ez_bar.jpg'),
  'bicep_curl_cable': require('../../assets/exercises/bicep_curl_cable.jpg'),
  'bicep_curl_one_arm': require('../../assets/exercises/bicep_curl_one_arm.jpg'),
  'bicep_curl_one_arm_cable': require('../../assets/exercises/bicep_curl_one_arm_cable.jpg'),
  'hammer_curl_dumbbell': require('../../assets/exercises/hammer_curl_dumbbell.jpg'),
  'hammer_curl_cable': require('../../assets/exercises/hammer_curl_cable.jpg'),
  'hammer_curl_preacher': require('../../assets/exercises/hammer_curl_preacher.jpg'),
  'hammer_curl_incline': require('../../assets/exercises/hammer_curl_incline.jpg'),
  'bicep_curl_supinated': require('../../assets/exercises/bicep_curl_supinated.jpg'),
  'preacher_curl_ez_bar': require('../../assets/exercises/preacher_curl_ez_bar.jpg'),
  'preacher_curl_machine': require('../../assets/exercises/preacher_curl_machine.jpg'),
  'concentration_curl': require('../../assets/exercises/concentration_curl.jpg'),
  'high_cable_curl': require('../../assets/exercises/high_cable_curl.jpg'),
  'incline_dumbbell_curl': require('../../assets/exercises/incline_dumbbell_curl.jpg'),
  'spider_curl_dumbbell': require('../../assets/exercises/spider_curl_dumbbell.jpg'),
  'spider_curl_ez_bar': require('../../assets/exercises/spider_curl_ez_bar.jpg'),
  'reverse_curl_cable': require('../../assets/exercises/reverse_curl_cable.jpg'),

  // TRICEPS
  'skull_crusher': require('../../assets/exercises/skull_crusher.jpg'),
  'skull_crusher_overhead': require('../../assets/exercises/skull_crusher_overhead.jpg'),
  'overhead_tricep_extension': require('../../assets/exercises/overhead_tricep_extension.jpg'),
  'overhead_tricep_extension_cable': require('../../assets/exercises/overhead_tricep_extension_cable.jpg'),
  'one_arm_overhead_extension_cable': require('../../assets/exercises/one_arm_overhead_extension_cable.jpg'),
  'tricep_pushdown_rope': require('../../assets/exercises/tricep_pushdown_rope.jpg'),
  'tricep_pushdown_straight': require('../../assets/exercises/tricep_pushdown_straight.jpg'),
  'tricep_pushdown_one_arm': require('../../assets/exercises/tricep_pushdown_one_arm.jpg'),

  // LEGS
  'squat_high_bar': require('../../assets/exercises/squat_high_bar.jpg'),
  'squat_low_bar': require('../../assets/exercises/squat_low_bar.jpg'),
  'squat_smith': require('../../assets/exercises/squat_smith.jpg'),
  'squat_goblet': require('../../assets/exercises/squat_goblet.jpg'),
  'front_squat': require('../../assets/exercises/front_squat.jpg'),
  'deadlift_conventional': require('../../assets/exercises/deadlift_conventional.jpg'),
  'deadlift_sumo': require('../../assets/exercises/deadlift_sumo.jpg'),
  'deadlift_romanian': require('../../assets/exercises/deadlift_romanian.jpg'),
  'deadlift_dumbbell': require('../../assets/exercises/deadlift_dumbbell.jpg'),
  'leg_extension': require('../../assets/exercises/leg_extension.jpg'),
  'leg_curl_lying': require('../../assets/exercises/leg_curl_lying.jpg'),
  'leg_curl_seated': require('../../assets/exercises/leg_curl_seated.jpg'),
  'hip_abduction': require('../../assets/exercises/hip_abduction.jpg'),
  'hip_adduction': require('../../assets/exercises/hip_adduction.jpg'),
  'hip_thrust_machine': require('../../assets/exercises/hip_thrust_machine.jpg'),
  'hip_thrust_barbell': require('../../assets/exercises/hip_thrust_barbell.jpg'),
  'hip_thrust_dumbbell': require('../../assets/exercises/hip_thrust_dumbbell.jpg'),
  'calf_raise_machine': require('../../assets/exercises/calf_raise_machine.jpg'),
  'calf_raise_leg_press': require('../../assets/exercises/calf_raise_leg_press.jpg'),
  'calf_raise_horizontal_press': require('../../assets/exercises/calf_raise_horizontal_press.jpg'),
  'calf_raise_smith': require('../../assets/exercises/calf_raise_smith.jpg'),
  'calf_raise_smith_elevated': require('../../assets/exercises/calf_raise_smith_elevated.jpg'),
  'leg_press_high_foot': require('../../assets/exercises/leg_press_high_foot.jpg'),
  'leg_press_low_foot': require('../../assets/exercises/leg_press_low_foot.jpg'),
  'leg_press_horizontal_high': require('../../assets/exercises/leg_press_horizontal_high.jpg'),
  'leg_press_horizontal_low': require('../../assets/exercises/leg_press_horizontal_low.jpg'),
  'lunges_bodyweight': require('../../assets/exercises/lunges_bodyweight.jpg'),
  'lunges_dumbbell': require('../../assets/exercises/lunges_dumbbell.jpg'),
  'bulgarian_split_squat_dumbbell': require('../../assets/exercises/bulgarian_split_squat_dumbbell.jpg'),
  'bulgarian_split_squat_single': require('../../assets/exercises/bulgarian_split_squat_single.jpg'),
  'hang_clean': require('../../assets/exercises/hang_clean.jpg'),
  'glute_kickback_cable': require('../../assets/exercises/glute_kickback_cable.jpg'),

  // CORE
  'crunches_bodyweight': require('../../assets/exercises/crunches_bodyweight.jpg'),
  'crunches_cable': require('../../assets/exercises/crunches_cable.jpg'),
  'crunches_machine': require('../../assets/exercises/crunches_machine.jpg'),
  'plank': require('../../assets/exercises/plank.jpg'),
  'russian_twist': require('../../assets/exercises/russian_twist.jpg'),
  'russian_twist_weighted': require('../../assets/exercises/russian_twist_weighted.jpg'),

  // FOREARMS
  'wrist_curl_cable': require('../../assets/exercises/wrist_curl_cable.jpg'),
  'wrist_curl_cable_single': require('../../assets/exercises/wrist_curl_cable_single.jpg'),

  // CARDIO
  'treadmill': require('../../assets/exercises/treadmill.jpg'),
  'bike_upright': require('../../assets/exercises/bike_upright.jpg'),
  'bike_recumbent': require('../../assets/exercises/bike_recumbent.jpg'),
  'elliptical': require('../../assets/exercises/elliptical.jpg'),
  'elliptical_horizontal': require('../../assets/exercises/elliptical_horizontal.jpg'),
  'stair_climber': require('../../assets/exercises/stair_climber.jpg'),
  'rowing_machine': require('../../assets/exercises/rowing_machine.jpg'),
  'burpees': require('../../assets/exercises/burpees.jpg'),
};

const EXERCISE_IMAGE_MAPPING = {
  // ============ CHEST ============
  "Bench Press": {
    "Barbell": "LOCAL:bench_press_barbell",
    "Dumbbell": "LOCAL:bench_press_dumbbell",
    "Smith Machine": "LOCAL:bench_press_smith",
    "Machine": "LOCAL:bench_press_machine",
    "Spoto Press (Barbell)": "LOCAL:spoto_press"
  },

  "Incline Bench Press": {
    "Barbell": "LOCAL:incline_bench_barbell",
    "Dumbbell": "LOCAL:incline_bench_dumbbell",
    "Smith Machine": "LOCAL:incline_bench_smith",
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
    "Standard": "LOCAL:pushup_standard",
    "Wide Grip": "LOCAL:pushup_wide",
    "Diamond": "LOCAL:pushup_diamond",
    "Decline": "LOCAL:pushup_decline",
    "Incline": "LOCAL:pushup_incline"
  },

  "Chest Dips": {
    "Bodyweight": "LOCAL:dips_bodyweight",
    "Weighted": "LOCAL:dips_weighted",
    "Weighted (Dumbbell)": "LOCAL:dips_weighted",
    "Assisted Machine": "LOCAL:dips_assisted",
    "Dip Machine": "LOCAL:dips_machine"
  },

  "Machine Chest Press": {
    "Machine Horizontal Handle": "LOCAL:chest_press_horizontal",
    "Machine Vertical Handle": "LOCAL:chest_press_vertical"
  },

  // ============ BACK ============
  "Lat Pulldown": {
    "Wide Grip": "LOCAL:lat_pulldown_wide",
    "Close Grip": "LOCAL:lat_pulldown_close",
    "Parallel Grip": "LOCAL:lat_pulldown_parallel",
    "Reverse Grip": "LOCAL:lat_pulldown_reverse",
    "Reverse Grip (Supinated)": "LOCAL:lat_pulldown_reverse",
    "V-Bar": "LOCAL:lat_pulldown_vbar",
    "V-Bar (Neutral Grip)": "LOCAL:lat_pulldown_vbar",
    "Single Arm": "LOCAL:lat_pulldown_single",
    "Machine": "LOCAL:lat_pulldown"
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
    "Pendlay": "LOCAL:bent_over_row_pendlay",
    "Dumbbell": "LOCAL:bent_over_row_dumbbell",
    "Smith Machine": "LOCAL:bent_over_row_smith"
  },

  "Pullover": {
    "Cable Standing": "LOCAL:face_pull_lats",
    "Machine": null
  },

  "Cable Incline Pushdown": {
    "Straight Bar": "Triceps_Pushdown",
    "Rope Attachment": "Triceps_Pushdown_-_Rope_Attachment"
  },

  "Chin Up": {
    "Bodyweight": "LOCAL:chin_up_bodyweight",
    "Weighted": "LOCAL:chin_up_weighted"
  },

  "Muscle Up": {
    "Bar": "LOCAL:muscle_up",
    "_default": "LOCAL:muscle_up"
  },

  "Pull Ups": {
    "Bodyweight": "LOCAL:pull_up_bodyweight",
    "Weighted": "LOCAL:pull_up_weighted"
  },

  "T-Bar Row": {
    "T-Bar Machine": "LOCAL:tbar_row_landmine",
    "Landmine": "LOCAL:tbar_row_landmine",
    "Landmine Barbell": "LOCAL:tbar_row_landmine",
    "V-Bar": "LOCAL:tbar_row_vbar"
  },

  "TRX Row": {
    "TRX": "LOCAL:trx_row"
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
    "Roman Chair": "LOCAL:back_extension_bodyweight",
    "Bodyweight": "LOCAL:back_extension_bodyweight",
    "Weighted": "LOCAL:back_extension_weighted"
  },

  // ============ SHOULDERS ============
  "Shoulder Press": {
    "Barbell": "LOCAL:shoulder_press_barbell_seated",
    "Barbell Seated": "LOCAL:shoulder_press_barbell_seated",
    "Barbell Standing": "LOCAL:shoulder_press_barbell_standing",
    "Dumbbell": "LOCAL:shoulder_press_dumbbell",
    "Dumbbell Seated": "LOCAL:shoulder_press_dumbbell",
    "Machine": "LOCAL:shoulder_press_machine",
    "Smith Machine": "LOCAL:shoulder_press_smith"
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
    "Cable": "LOCAL:front_raise_cable",
    "Plate": "Front_Plate_Raise"
  },

  "Shrugs": {
    "Barbell": "LOCAL:shrugs_barbell",
    "Dumbbell": "Dumbbell_Shrug",
    "Smith Machine": "LOCAL:shrugs_smith",
    "Machine": "LOCAL:shrugs_machine",
    "Trap Bar": null
  },

  "Rear Delt Fly": {
    "Cable Cross": "LOCAL:rear_delt_fly_cable",
    "Machine Pec Deck Reverse": "LOCAL:rear_delt_fly_machine",
    "Machine Single Arm": "LOCAL:rear_delt_fly_single",
    "TRX": "LOCAL:rear_delt_fly_trx"
  },

  "Upright Row": {
    "Barbell": "LOCAL:upright_row_barbell",
    "Dumbbell": "Standing_Dumbbell_Upright_Row",
    "Cable": "LOCAL:upright_row_cable",
    "EZ Bar": "Upright_Row_-_With_Bands"
  },

  "Face Pull": {
    "Cable Rope": "LOCAL:face_pull_rear_delt",
    "Cable Rear Delt": "LOCAL:face_pull_rear_delt",
    "Cable Lat Focus": "LOCAL:face_pull_lats",
    "Resistance Band": "LOCAL:face_pull_rear_delt"
  },

  // ============ BICEPS ============
  "Bicep Curl": {
    "Incline Dumbbell": "LOCAL:incline_dumbbell_curl",
    "Barbell": "Barbell_Curl",
    "EZ Bar": "LOCAL:bicep_curl_ez_bar",
    "Dumbbell": "LOCAL:bicep_curl_dumbbell",
    "Dumbbell Standing": "LOCAL:bicep_curl_dumbbell",
    "Cable": "LOCAL:bicep_curl_cable",
    "Cable Standing": "LOCAL:bicep_curl_cable"
  },

  "One Arm Bicep Curl": {
    "Dumbbell": "LOCAL:bicep_curl_one_arm",
    "Cable": "LOCAL:bicep_curl_one_arm_cable",
    "Cable Low": "LOCAL:bicep_curl_one_arm_cable",
    "Cable Mid": "LOCAL:bicep_curl_one_arm_cable",
    "Cable Front": "LOCAL:bicep_curl_one_arm_cable",
    "Cable Back": "LOCAL:bicep_curl_one_arm_cable"
  },

  "Hammer Curl": {
    "Cable Rope": "LOCAL:hammer_curl_cable",
    "Cable": "LOCAL:hammer_curl_cable",
    "Dumbbell": "LOCAL:hammer_curl_dumbbell",
    "Dumbbell Seated": "LOCAL:hammer_curl_incline",
    "Incline Seated": "LOCAL:hammer_curl_incline",
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
    "EZ Bar": "LOCAL:spider_curl_ez_bar",
    "Dumbbell": "LOCAL:spider_curl_dumbbell"
  },

  "Reverse Curl": {
    "Barbell": "Reverse_Barbell_Curl",
    "EZ Bar": "Reverse_Cable_Curl",
    "Dumbbell": "Standing_Dumbbell_Reverse_Curl",
    "Cable": "LOCAL:reverse_curl_cable"
  },

  "Zottman Curl": {
    "Dumbbell": "Zottman_Curl"
  },

  // ============ TRICEPS ============
  "Tricep Pushdown": {
    "Cable Rope": "LOCAL:tricep_pushdown_rope",
    "Rope": "LOCAL:tricep_pushdown_rope",
    "Straight Bar": "LOCAL:tricep_pushdown_straight",
    "V-Bar": "LOCAL:tricep_pushdown_straight"
  },

  "One Arm Tricep Pushdown": {
    "Single Handle": "LOCAL:tricep_pushdown_one_arm",
    "Cable": "LOCAL:tricep_pushdown_one_arm",
    "Rope": "LOCAL:tricep_pushdown_one_arm"
  },

  "Overhead Tricep Extension": {
    "Cable Rope": "LOCAL:overhead_tricep_extension_cable",
    "Dumbbell Two-Handed": "LOCAL:overhead_tricep_extension",
    "Dumbbell": "LOCAL:overhead_tricep_extension",
    "EZ Bar": "Incline_Barbell_Triceps_Extension"
  },

  "One Arm Overhead Extension": {
    "Dumbbell": "Dumbbell_One-Arm_Triceps_Extension",
    "Cable": "LOCAL:one_arm_overhead_extension_cable"
  },

  "Skull Crusher": {
    "EZ Bar": "LOCAL:skull_crusher",
    "Barbell": "Lying_Triceps_Press",
    "Dumbbell": "Decline_Dumbbell_Triceps_Extension",
    "Overhead EZ Bar": "LOCAL:skull_crusher_overhead"
  },

  "Dips": {
    "Parallel Bars": "LOCAL:dips_bodyweight",
    "Bodyweight": "LOCAL:dips_bodyweight",
    "Weighted": "LOCAL:dips_weighted",
    "Weighted (Dumbbell)": "LOCAL:dips_weighted",
    "Assisted Machine": "LOCAL:dips_assisted",
    "Machine": "LOCAL:dips_machine",
    "Bench Dips": "Bench_Dips"
  },

  "Close Grip Bench Press": {
    "Barbell": "LOCAL:close_grip_bench",
    "Smith Machine": "LOCAL:close_grip_bench_smith",
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
    "Bodyweight Floor": "LOCAL:crunches_bodyweight",
    "Bodyweight": "LOCAL:crunches_bodyweight",
    "Cable Kneeling": "LOCAL:crunches_cable",
    "Cable": "LOCAL:crunches_cable",
    "Machine": "LOCAL:crunches_machine"
  },

  "Plank": {
    "Bodyweight": "LOCAL:plank",
    "Weighted": "LOCAL:plank",
    "Elevated Feet": "LOCAL:plank"
  },

  "Leg Raises": {
    "Hanging": "Hanging_Leg_Raise",
    "Captain's Chair": null,
    "Lying Floor": "Flat_Bench_Lying_Leg_Raise"
  },

  "Russian Twist": {
    "Bodyweight": "LOCAL:russian_twist",
    "Medicine Ball": "LOCAL:russian_twist_weighted",
    "Dumbbell": "LOCAL:russian_twist_weighted",
    "Weighted": "LOCAL:russian_twist_weighted"
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
    "Smith Machine": "LOCAL:calf_raise_smith",
    "Smith Machine Elevated": "LOCAL:calf_raise_smith_elevated",
    "Barbell": "Standing_Barbell_Calf_Raise",
    "Leg Press": "LOCAL:calf_raise_leg_press",
    "Horizontal Leg Press": "LOCAL:calf_raise_horizontal_press"
  },

  "Squat": {
    "Barbell High Bar": "LOCAL:squat_high_bar",
    "Barbell Low Bar": "LOCAL:squat_low_bar",
    "Smith Machine": "LOCAL:squat_smith",
    "Goblet": "LOCAL:squat_goblet",
    "Dumbbell Goblet": "LOCAL:squat_goblet"
  },

  "Hip Abduction": {
    "Machine": "LOCAL:hip_abduction",
    "Cable": null
  },

  "Glute Kickback": {
    "Cable": "LOCAL:glute_kickback_cable",
    "Machine": "LOCAL:glute_kickback_cable",
    "Bodyweight": "Glute_Kickback"
  },

  "Hang Clean": {
    "Barbell": "LOCAL:hang_clean",
    "Dumbbell": "Dumbbell_Clean"
  },

  "Hip Thrust": {
    "Barbell": "LOCAL:hip_thrust_barbell",
    "Dumbbell": "LOCAL:hip_thrust_dumbbell",
    "Machine": "LOCAL:hip_thrust_machine",
    "Smith Machine": "LOCAL:hip_thrust_machine"
  },

  "Hack Squat": {
    "Machine": "Hack_Squat",
    "Barbell Reverse": "Barbell_Hack_Squat"
  },

  "Lunges": {
    "Dumbbell Walking": "LOCAL:lunges_dumbbell",
    "Dumbbell": "LOCAL:lunges_dumbbell",
    "Barbell Walking": "Barbell_Walking_Lunge",
    "Dumbbell Stationary": "LOCAL:lunges_dumbbell",
    "Bodyweight": "LOCAL:lunges_bodyweight",
    "Reverse Lunge": "Dumbbell_Rear_Lunge",
    "Smith Machine": "LOCAL:lunges_bodyweight"
  },

  "Seated Calf Raise": {
    "Machine": "Seated_Calf_Raise",
    "Dumbbell": "Dumbbell_Seated_One-Leg_Calf_Raise"
  },

  "Deadlift": {
    "Barbell Conventional": "LOCAL:deadlift_conventional",
    "Barbell Sumo": "LOCAL:deadlift_sumo",
    "Trap Bar": "Barbell_Deadlift",
    "Dumbbell": "LOCAL:deadlift_dumbbell",
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
    "Dumbbell": "LOCAL:bulgarian_split_squat_dumbbell",
    "Single Dumbbell": "LOCAL:bulgarian_split_squat_single",
    "Barbell": "Barbell_Side_Split_Squat",
    "Bodyweight": "LOCAL:bulgarian_split_squat_dumbbell",
    "Smith Machine": "LOCAL:bulgarian_split_squat_dumbbell"
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

  // ============ CARDIO ============
  "Treadmill": {
    "Walking": "LOCAL:treadmill",
    "Jogging": "LOCAL:treadmill",
    "Running": "LOCAL:treadmill",
    "Incline Walking": "LOCAL:treadmill",
    "HIIT Intervals": "LOCAL:treadmill"
  },

  "Stationary Bike": {
    "Upright": "LOCAL:bike_upright",
    "Recumbent": "LOCAL:bike_recumbent",
    "Steady State": "LOCAL:bike_upright",
    "HIIT": "LOCAL:bike_upright",
    "Spin Class": "LOCAL:bike_upright"
  },

  "Rowing Machine": {
    "Steady State": "LOCAL:rowing_machine",
    "HIIT Intervals": "LOCAL:rowing_machine"
  },

  "Elliptical": {
    "Standard": "LOCAL:elliptical",
    "Horizontal": "LOCAL:elliptical_horizontal",
    "Forward": "LOCAL:elliptical",
    "Reverse": "LOCAL:elliptical",
    "HIIT": "LOCAL:elliptical"
  },

  "Jump Rope": {
    "Regular Bounce": null,
    "Double Unders": null,
    "HIIT": null
  },

  "Stair Climber": {
    "Steady Pace": "LOCAL:stair_climber",
    "HIIT": "LOCAL:stair_climber",
    "Skip-a-Step": "LOCAL:stair_climber"
  },

  "Burpees": {
    "Bodyweight": "LOCAL:burpees",
    "Push-up Burpees": "LOCAL:burpees",
    "Box Jump Burpees": "LOCAL:burpees"
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
