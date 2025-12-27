import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exerciseDatabase, getAllExercises } from '../../data/exerciseDatabase';
import { db } from '../config/firebaseWeb';
import { collection, getDocs } from 'firebase/firestore';

// GitHub URLs for media
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/exercises/';
const VIDEO_BASE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/exercise-videos/';
const FALLBACK_IMAGE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Complete exercise image mapping - same structure as exerciseImages.js
// Format: "ExerciseName": { "Equipment": "LOCAL:filename" or "RemoteFolder" }
const EXERCISE_IMAGE_MAPPING = {
  // ============ CHEST ============
  "Bench Press": {
    "Barbell": "bench_press_barbell",
    "Dumbbell": "bench_press_dumbbell",
    "Smith Machine": "bench_press_smith",
    "Machine": "bench_press_machine",
    "Spoto Press": "spoto_press"
  },
  "Incline Bench Press": {
    "Barbell": "incline_bench_barbell",
    "Dumbbell": "incline_bench_dumbbell",
    "Smith Machine": "incline_bench_smith"
  },
  "Chest Fly": {
    "Dumbbell": "chest_fly_dumbbell",
    "Cable": "chest_fly_cable",
    "Machine (Pec Deck)": "chest_fly_machine",
    "Machine": "chest_fly_machine"
  },
  "Cable Crossover": {
    "High to Low": "cable_crossover_high_low",
    "Low to High": "cable_crossover_low_high"
  },
  "Push-ups": {
    "Standard": "pushup_standard",
    "Wide Grip": "pushup_wide",
    "Wide": "pushup_wide",
    "Diamond": "pushup_diamond",
    "Decline": "pushup_decline",
    "Incline": "pushup_incline"
  },
  "Chest Dips": {
    "Bodyweight": "chest_dip",
    "Weighted": "weighted_chest_dip",
    "Dumbbell": "weighted_chest_dip",
    "Assisted Machine": "dips_assisted",
    "Dip Machine": "dips_machine"
  },
  "Machine Chest Press": {
    "Horizontal Handle": "chest_press_horizontal",
    "Vertical Handle": "chest_press_vertical"
  },
  "Close Grip Bench Press": {
    "Barbell": "close_grip_bench",
    "Smith Machine": "close_grip_bench_smith"
  },
  // ============ BACK ============
  "Lat Pulldown": {
    "Wide Grip": "lat_pulldown_wide",
    "Close Grip": "lat_pulldown_close",
    "Parallel Grip": "lat_pulldown_parallel",
    "Reverse Grip": "lat_pulldown_reverse",
    "V-Bar": "lat_pulldown_vbar",
    "V-Bar Neutral": "lat_pulldown_vbar",
    "Single Arm": "lat_pulldown_single",
    "Machine": "lat_pulldown"
  },
  "One Arm Row": {
    "Dumbbell": "one_arm_row_dumbbell"
  },
  "Bent Over Row": {
    "Overhand": "bent_over_row_overhand",
    "Pendlay": "bent_over_row_pendlay",
    "Dumbbell": "bent_over_row_dumbbell",
    "Smith Machine": "bent_over_row_smith"
  },
  "Chin Up": {
    "Bodyweight": "chin_up_bodyweight",
    "Weighted": "chin_up_weighted",
    "Assisted Machine": "chin_up_assisted"
  },
  "Pull Ups": {
    "Bodyweight": "pull_up_bodyweight",
    "Weighted": "pull_up_weighted",
    "Assisted Machine": "pull_up_assisted"
  },
  "Muscle Up": {
    "Bar": "muscle_up"
  },
  "T-Bar Row": {
    "T-Bar Machine": "tbar_row_landmine",
    "Landmine": "tbar_row_landmine",
    "Landmine Barbell": "tbar_row_landmine",
    "V-Bar": "tbar_row_vbar"
  },
  "TRX Row": {
    "TRX": "trx_row"
  },
  "Assisted Pull-up": {
    "Assisted Machine": "pull_up_assisted"
  },
  "Seated Row Machine": {
    "45° Handles": "seated_row_45deg",
    "Horizontal Handles": "seated_row_horizontal",
    "Vertical Handles": "seated_row_vertical"
  },
  "Back Extension": {
    "Machine": "back_extension_machine",
    "Roman Chair": "back_extension_bodyweight",
    "Bodyweight": "back_extension_bodyweight",
    "Weighted": "back_extension_weighted"
  },
  "Deadlift": {
    "Conventional": "deadlift_conventional",
    "Sumo": "deadlift_sumo",
    "Romanian": "deadlift_romanian",
    "Dumbbell": "deadlift_dumbbell"
  },
  // ============ SHOULDERS ============
  "Shoulder Press": {
    "Barbell": "shoulder_press_barbell_seated",
    "Seated": "shoulder_press_barbell_seated",
    "Standing": "shoulder_press_barbell_standing",
    "Dumbbell": "shoulder_press_dumbbell",
    "Machine": "shoulder_press_machine",
    "Smith Machine": "shoulder_press_smith"
  },
  "Lateral Raise": {
    "Dumbbell": "lateral_raise_dumbbell",
    "Seated": "lateral_raise_seated",
    "Single Arm": "lateral_raise_cable_single",
    "Dual Cable": "lateral_raise_cable_both",
    "Machine": "lateral_raise_machine"
  },
  "Front Raise": {
    "Dumbbell": "front_raise_dumbbell",
    "Cable": "front_raise_cable"
  },
  "Shrugs": {
    "Barbell": "shrugs_barbell",
    "Smith Machine": "shrugs_smith",
    "Machine": "shrugs_machine"
  },
  "Rear Delt Fly": {
    "Cross": "rear_delt_fly_cable",
    "Cable": "rear_delt_fly_cable",
    "Pec Deck Reverse": "rear_delt_fly_machine",
    "Machine": "rear_delt_fly_machine",
    "Machine Single Arm": "rear_delt_fly_single",
    "TRX": "rear_delt_fly_trx"
  },
  "Upright Row": {
    "Barbell": "upright_row_barbell",
    "Cable": "upright_row_cable"
  },
  "Face Pull": {
    "Rope": "face_pull_rear_delt",
    "Resistance Band": "face_pull_rear_delt"
  },
  // ============ BICEPS ============
  "Bicep Curl": {
    "Incline": "incline_dumbbell_curl",
    "EZ Bar": "bicep_curl_ez_bar",
    "Dumbbell": "bicep_curl_dumbbell",
    "Standing": "bicep_curl_dumbbell",
    "Cable": "bicep_curl_cable"
  },
  "One Arm Bicep Curl": {
    "Dumbbell": "bicep_curl_one_arm",
    "Cable": "bicep_curl_one_arm_cable",
    "Cable Low": "bicep_curl_one_arm_cable"
  },
  "Hammer Curl": {
    "Rope": "hammer_curl_cable",
    "Cable": "hammer_curl_cable",
    "Dumbbell": "hammer_curl_dumbbell",
    "Seated": "hammer_curl_incline",
    "Preacher": "hammer_curl_preacher"
  },
  "Preacher Curl": {
    "Machine": "preacher_curl_machine",
    "EZ Bar": "preacher_curl_ez_bar"
  },
  "Concentration Curl": {
    "Seated": "concentration_curl",
    "Dumbbell": "concentration_curl"
  },
  "High Cable Curl": {
    "Double Cable": "high_cable_curl"
  },
  "Spider Curl": {
    "EZ Bar": "spider_curl_ez_bar",
    "Dumbbell": "spider_curl_dumbbell"
  },
  // ============ TRICEPS ============
  "Tricep Pushdown": {
    "Rope": "tricep_pushdown_rope",
    "Straight Bar": "tricep_pushdown_straight",
    "V-Bar": "tricep_pushdown_straight"
  },
  "One Arm Tricep Pushdown": {
    "Single Handle": "tricep_pushdown_one_arm",
    "Cable": "tricep_pushdown_one_arm"
  },
  "Overhead Tricep Extension": {
    "Rope": "overhead_tricep_extension_cable",
    "Two-Handed": "overhead_tricep_extension",
    "Dumbbell": "overhead_tricep_extension"
  },
  "One Arm Overhead Extension": {
    "Cable": "one_arm_overhead_extension_cable"
  },
  "Skull Crusher": {
    "EZ Bar": "skull_crusher",
    "Overhead": "skull_crusher_overhead"
  },
  "Dips": {
    "Parallel Bars": "dips_bodyweight",
    "Bodyweight": "dips_bodyweight",
    "Weighted": "dips_weighted",
    "Assisted Machine": "dips_assisted",
    "Assisted": "dips_assisted",
    "Machine": "dips_machine",
    "Bench Dips": "dips_bodyweight"
  },
  // ============ ABS ============
  "Crunches": {
    "Floor": "crunches_bodyweight",
    "Bodyweight": "crunches_bodyweight",
    "Kneeling": "crunches_cable",
    "Cable": "crunches_cable",
    "Machine": "crunches_machine"
  },
  "Plank": {
    "Bodyweight": "plank",
    "Weighted": "plank"
  },
  "Russian Twist": {
    "Bodyweight": "russian_twist",
    "Medicine Ball": "russian_twist_weighted",
    "Dumbbell": "russian_twist_weighted",
    "Weighted": "russian_twist_weighted"
  },
  // ============ LEGS ============
  "Leg Extension": {
    "Machine": "leg_extension"
  },
  "Leg Curl": {
    "Lying Machine": "leg_curl_lying",
    "Lying": "leg_curl_lying",
    "Seated Machine": "leg_curl_seated",
    "Seated": "leg_curl_seated"
  },
  "Standing Calf Raise": {
    "Machine": "calf_raise_machine",
    "Smith Machine": "calf_raise_smith",
    "Leg Press": "calf_raise_leg_press",
    "Horizontal": "calf_raise_horizontal_press"
  },
  "Squat": {
    "High Bar": "squat_high_bar",
    "Low Bar": "squat_low_bar",
    "Smith Machine": "squat_smith",
    "Goblet": "squat_goblet"
  },
  "Front Squat": {
    "Barbell": "front_squat"
  },
  "Hip Abduction": {
    "Machine": "hip_abduction"
  },
  "Hip Adduction": {
    "Machine": "hip_adduction"
  },
  "Glute Kickback": {
    "Cable": "glute_kickback_cable",
    "Machine": "glute_kickback_cable"
  },
  "Hip Thrust": {
    "Barbell": "hip_thrust_barbell",
    "Dumbbell": "hip_thrust_dumbbell",
    "Machine": "hip_thrust_machine",
    "Smith Machine": "hip_thrust_machine"
  },
  "Lunges": {
    "Walking": "lunges_dumbbell",
    "Dumbbell": "lunges_dumbbell",
    "Stationary": "lunges_dumbbell",
    "Bodyweight": "lunges_bodyweight"
  },
  "Leg Press": {
    "45° Machine": "leg_press_high_foot",
    "45° High": "leg_press_high_foot",
    "45° Low": "leg_press_low_foot",
    "Horizontal High": "leg_press_horizontal_high",
    "Horizontal Low": "leg_press_horizontal_low",
    "Horizontal": "leg_press_horizontal_low"
  },
  "Bulgarian Split Squat": {
    "Dumbbell": "bulgarian_split_squat_dumbbell",
    "Single Dumbbell": "bulgarian_split_squat_single",
    "Bodyweight": "bulgarian_split_squat_dumbbell"
  },
  "Hang Clean": {
    "Barbell": "hang_clean"
  },
  // ============ CARDIO ============
  "Treadmill": {
    "Walking": "treadmill",
    "Jogging": "treadmill",
    "Running": "treadmill"
  },
  "Stationary Bike": {
    "Upright": "bike_upright",
    "Recumbent": "bike_recumbent"
  },
  "Rowing Machine": {
    "Steady State": "rowing_machine"
  },
  "Elliptical": {
    "Standard": "elliptical",
    "Horizontal": "elliptical_horizontal"
  },
  "Stair Climber": {
    "Steady Pace": "stair_climber"
  },
  "Burpees": {
    "Bodyweight": "burpees"
  }
};

// Fallback image mapping for free-exercise-db (when no custom image exists)
const FALLBACK_IMAGE_MAPPING = {
  // CHEST
  "Decline Bench Press": { "Barbell": "Decline_Barbell_Bench_Press", "Dumbbell": "Decline_Dumbbell_Bench_Press" },
  // BACK
  "Cable Row": { "Low Angle": "Seated_Cable_Rows", "Mid Angle": "Seated_Cable_Rows", "High Angle": "Leverage_High_Row" },
  "Pullover": { "Dumbbell": "Bent-Arm_Dumbbell_Pullover", "Cable": "Cable_Seated_Lat_Pulldown" },
  "Straight Arm Pulldown": { "Cable": "Straight-Arm_Dumbbell_Pullover" },
  // SHOULDERS
  "Arnold Press": { "Dumbbell": "Arnold_Dumbbell_Press" },
  // BICEPS
  "Reverse Curl": { "Barbell": "Reverse_Barbell_Curl", "EZ Bar": "Reverse_Cable_Curl", "Dumbbell": "Standing_Dumbbell_Reverse_Curl" },
  "Zottman Curl": { "Dumbbell": "Zottman_Curl" },
  "Incline Curl": { "Dumbbell": "Incline_Dumbbell_Curl" },
  // TRICEPS
  "Tricep Kickback": { "Dumbbell": "Tricep_Dumbbell_Kickback", "Cable": "Tricep_Dumbbell_Kickback" },
  "Diamond Push-ups": { "Bodyweight": "Push-Ups_-_Close_Triceps_Position" },
  // LEGS
  "Hack Squat": { "Machine": "Hack_Squat" },
  "Good Morning": { "Barbell": "Good_Morning" },
  "Glute Bridge": { "Barbell": "Barbell_Glute_Bridge", "Bodyweight": "Butt_Lift_Bridge" },
  "Seated Calf Raise": { "Machine": "Seated_Calf_Raise" },
  "Step-Ups": { "Dumbbell": "Dumbbell_Step_Ups", "Barbell": "Barbell_Step_Ups" },
  // ABS
  "Leg Raises": { "Hanging": "Hanging_Leg_Raise", "Lying Floor": "Flat_Bench_Lying_Leg_Raise" },
  "Ab Wheel Rollout": { "Knees": "Ab_Roller", "Standing": "Ab_Roller" },
  "Mountain Climbers": { "Bodyweight": "Mountain_Climbers" },
  "Dead Bug": { "Bodyweight": "Dead_Bug" },
  "Sit-Ups": { "Floor": "Sit-Up", "Decline": "Decline_Crunch" },
  "Bicycle Crunches": { "Bodyweight": "Air_Bike" },
  // FOREARMS
  "Wrist Curl": { "Barbell": "Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", "Dumbbell": "Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench" },
  "Reverse Wrist Curl": { "Barbell": "Palms-Down_Wrist_Curl_Over_A_Bench", "Dumbbell": "Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench" },
  "Farmer's Walk": { "Dumbbell": "Farmers_Walk", "Trap Bar": "Farmers_Walk" },
  "Plate Pinch": { "Two Plates Smooth": "Plate_Pinch" },
  "Wrist Roller": { "Standing": "Wrist_Roller" },
  // CARDIO
  "Jump Rope": { "Regular Bounce": null },
};

// Get image URL for an exercise
const getImageUrl = (exerciseName, variantEquipment) => {
  // Clean exercise name (remove any equipment suffix in parentheses)
  const cleanName = exerciseName?.replace(/\s*\(.*$/, '').trim();

  // First, check if we have a custom local image
  const exerciseMapping = EXERCISE_IMAGE_MAPPING[cleanName];
  if (exerciseMapping) {
    // Try to find the specific variant
    let imageFile = exerciseMapping[variantEquipment];

    // If not found, try the first available variant
    if (!imageFile) {
      const firstKey = Object.keys(exerciseMapping)[0];
      imageFile = exerciseMapping[firstKey];
    }

    if (imageFile) {
      return `${IMAGE_BASE_URL}${imageFile}.jpg`;
    }
  }

  // Fall back to free-exercise-db images
  const fallbackMapping = FALLBACK_IMAGE_MAPPING[cleanName];
  if (fallbackMapping) {
    let fallbackFolder = fallbackMapping[variantEquipment];
    if (!fallbackFolder) {
      const firstKey = Object.keys(fallbackMapping)[0];
      fallbackFolder = fallbackMapping[firstKey];
    }
    if (fallbackFolder) {
      return `${FALLBACK_IMAGE_URL}${fallbackFolder}/0.jpg`;
    }
  }

  return null;
};

// Video mapping (simplified for web)
const VIDEO_FILES = {
  'bench_press_barbell': 'barbell_bench_press_chest.mp4',
  'bench_press_dumbbell': 'dumbbell_bench_press.mp4',
  'bench_press_machine': 'bench_press_machine.mp4',
  'incline_bench_dumbbell': 'incline_dumbell_bench_press.mp4',
  'chest_fly_dumbbell': 'dumbbel_chest_flyes.mp4',
  'chest_fly_machine': 'machine_fly.mp4',
  'chest_fly_cable': 'cable_chest_fly.mp4',
  'cable_crossover_low_high': 'cable_fly_low_to_high.mp4',
  'cable_crossover_high_low': 'chest_fly_high_to_low.mp4',
  'dips_bodyweight': 'dips.mp4',
  'dips_weighted': 'weighted dips.MP4',
  'pushup_standard': 'standard pushup.MP4',
  'lat_pulldown': 'machine_lat_pulldown_.mp4',
  'lat_pulldown_wide': 'wide grip lat pulldown.MP4',
  'bent_over_row_overhand': 'barbell_bent_over_row.mp4',
  'one_arm_row_dumbbell': 'dumbbell_bent_over_row_single.mp4',
  'pull_up_bodyweight': 'pull ups.MP4',
  'chin_up_bodyweight': 'chin ups.MP4',
  'deadlift_conventional': 'conventional_barbell_deadlift.mp4',
  'deadlift_sumo': 'sumo_barbell_deadlift.mp4',
  'deadlift_romanian': 'romanian_barbell_deadlift.mp4',
  'shoulder_press_machine': 'shoulder_press_machine.mp4',
  'shoulder_press_dumbbell': 'shoulder_press_dumbbel.mp4',
  'lateral_raise_dumbbell': 'dumbbell_lateral_raises.mp4',
  'front_raise_dumbbell': 'dumbell_front_raise.mp4',
  'rear_delt_fly_cable': 'cable_rear_delt_flies.mp4',
  'face_pull_rear_delt': 'face pull.MP4',
  'bicep_curl_dumbbell': 'bicep_curl_dumbbels.mp4',
  'bicep_curl_ez_bar': 'bicep curl ez-bar.MP4',
  'hammer_curl_dumbbell': 'hammer curls.MP4',
  'preacher_curl_ez_bar': 'preacher curl.MP4',
  'tricep_pushdown_rope': 'rope_tricep_pushdown.mp4',
  'tricep_pushdown_straight': 'straight_bar_tricep_pushdown.mp4',
  'skull_crusher': 'skull_crushers.mp4',
  'overhead_tricep_extension': 'dumbell_tricep_overhead_extension.mp4',
  'squat_high_bar': 'high_bar_barbell_squat.mp4',
  'squat_low_bar': 'lowbar_barbell_squat.mp4',
  'squat_goblet': 'goblet_dumbbell_squat.mp4',
  'leg_press_high_foot': '45-degree high foot leg press.MP4',
  'leg_press_low_foot': '45-degree low foot leg press.MP4',
  'leg_extension': 'leg_extension.mp4',
  'leg_curl_lying': 'lying_leg_curl.mp4',
  'leg_curl_seated': 'seated_leg_curl.mp4',
  'calf_raise_machine': 'standing_calf_raise_machine.mp4',
  'hip_thrust_barbell': 'barbell_hip_thrust.mp4',
  'lunges_dumbbell': 'walking dumbell lunges.MP4',
  'crunches_bodyweight': 'crunches.MP4',
  'plank': 'plank.MP4',
  'russian_twist': 'russian twist.MP4',
  'treadmill': 'treadmill.MP4',
  'elliptical': 'elliptical.mp4',
  'rowing_machine': 'rowing_machine.mp4',
  'bike_upright': 'stationary_bike.mp4',
};


// Muscle group icons
const MuscleIcon = ({ muscle, size = 20 }) => {
  const icons = {
    chest: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4C8 4 4 8 4 12c0 2 1 4 3 5l5 3 5-3c2-1 3-3 3-5 0-4-4-8-8-8z"/>
      </svg>
    ),
    back: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M4 6h16M4 18h16M8 10h8M8 14h8"/>
      </svg>
    ),
    shoulders: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
      </svg>
    ),
    biceps: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 12c0-3 2-8 5-8s5 5 5 8c0 2-1 4-3 5l-4 3-3-3c-1-1-2-3 0-5z"/>
      </svg>
    ),
    triceps: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>
      </svg>
    ),
    legs: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 4v8l-2 8M16 4v8l2 8M10 12h4"/>
      </svg>
    ),
    abs: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="4" width="12" height="16" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/>
      </svg>
    ),
    forearms: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 4l8 16M16 4l-8 16"/>
      </svg>
    ),
    cardio: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
  };
  return icons[muscle] || icons.chest;
};

// Exercise Card Component
const ExerciseCard = ({ exercise, variant, onSelect, userVideo, userImage }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayName = variant ? `${exercise.name} (${variant.equipment})` : exercise.name;
  const difficulty = variant?.difficulty || exercise.difficulty;

  // Priority: User image > User video thumbnail > Built-in image
  const userImageUrl = userImage?.downloadUrl;
  const userVideoThumbnail = userVideo?.thumbnailUrl;
  const builtInImageUrl = getImageUrl(exercise.name, variant?.equipment);
  const imageUrl = !imageError ? (userImageUrl || userVideoThumbnail || builtInImageUrl) : null;

  const hasUserVideo = !!userVideo;
  const hasUserImage = !!userImage;
  const hasUserMedia = hasUserVideo || hasUserImage;

  const difficultyColor = {
    'Beginner': '#22C55E',
    'Intermediate': '#F59E0B',
    'Advanced': '#EF4444',
  }[difficulty] || '#8B5CF6';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(exercise, variant)}
      style={{
        background: 'rgba(30, 30, 30, 0.8)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'border-color 0.2s',
        borderColor: isHovered ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.1)',
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%',
        height: '160px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={displayName}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)',
          }}>
            <MuscleIcon muscle={exercise.muscleGroup?.toLowerCase()} size={48} />
          </div>
        )}

        {/* Difficulty badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: difficultyColor,
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {difficulty}
        </div>

        {/* Muscle group badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <MuscleIcon muscle={exercise.muscleGroup?.toLowerCase()} size={14} />
          {exercise.muscleGroup}
        </div>

        {/* Your Media badge */}
        {hasUserMedia && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
          }}>
            {hasUserImage ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
            {hasUserImage && hasUserVideo ? 'Your Media' : hasUserImage ? 'Your Image' : 'Your Video'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>
          {displayName}
        </h3>

        {/* Primary muscles */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {(variant?.primaryMuscles || exercise.primaryMuscles || []).slice(0, 3).map((muscle, i) => (
            <span key={i} style={{
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#A78BFA',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '500',
            }}>
              {muscle}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Exercise Detail Modal
const ExerciseDetailModal = ({ exercise, variant, onClose, userVideo, userImage }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!exercise) return null;

  const displayName = variant ? `${exercise.name} (${variant.equipment})` : exercise.name;

  // Priority: User image > Built-in image
  const userImageUrl = userImage?.downloadUrl;
  const builtInImageUrl = getImageUrl(exercise.name, variant?.equipment);
  const imageUrl = userImageUrl || builtInImageUrl;
  const hasUserImage = !!userImage;

  // Check for video - prioritize user video over built-in
  const cleanName = exercise.name?.replace(/\s*\(.*$/, '').trim();
  const exerciseMapping = EXERCISE_IMAGE_MAPPING[cleanName];
  let imageKey = exerciseMapping?.[variant?.equipment];
  if (!imageKey && exerciseMapping) {
    imageKey = exerciseMapping[Object.keys(exerciseMapping)[0]];
  }
  const builtInVideoFile = imageKey ? VIDEO_FILES[imageKey] : null;
  const builtInVideoUrl = builtInVideoFile ? `${VIDEO_BASE_URL}${builtInVideoFile}` : null;

  // User video takes priority
  const hasUserVideo = !!userVideo;
  const isYoutubeVideo = userVideo?.videoType === 'youtube';
  const userVideoUrl = userVideo?.downloadUrl || null;
  const youtubeUrl = userVideo?.youtubeUrl || null;

  // Final video URL: user firebase video > built-in video
  const videoUrl = userVideoUrl || builtInVideoUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          borderRadius: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header with media */}
        <div style={{
          position: 'relative',
          height: '350px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}>
          {showVideo && videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          ) : imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={displayName}
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)',
            }}>
              <MuscleIcon muscle={exercise.muscleGroup?.toLowerCase()} size={80} />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Your Media badge in modal */}
          {(hasUserVideo || hasUserImage) && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.5)',
            }}>
              {hasUserImage && !showVideo ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
              {hasUserImage && hasUserVideo ? 'Your Media' : hasUserImage ? 'Your Image' : 'Your Video'}
            </div>
          )}

          {/* YouTube button - opens in new tab */}
          {isYoutubeVideo && youtubeUrl && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                padding: '10px 20px',
                borderRadius: '25px',
                background: '#FF0000',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch on YouTube
            </a>
          )}

          {/* Video toggle - for non-YouTube videos */}
          {!isYoutubeVideo && videoUrl && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                padding: '10px 20px',
                borderRadius: '25px',
                background: showVideo ? 'rgba(255,255,255,0.2)' : (hasUserVideo ? 'linear-gradient(135deg, #8B5CF6, #06B6D4)' : '#8B5CF6'),
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {showVideo ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  Show Image
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  Watch Video
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '16px',
          }}>
            {displayName}
          </h2>

          {/* Tags */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '24px',
          }}>
            <span style={{
              background: '#8B5CF6',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {exercise.muscleGroup}
            </span>
            <span style={{
              background: variant?.difficulty === 'Beginner' ? '#22C55E' :
                         variant?.difficulty === 'Intermediate' ? '#F59E0B' : '#EF4444',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
            }}>
              {variant?.difficulty || exercise.difficulty}
            </span>
            {variant?.equipment && (
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                {variant.equipment}
              </span>
            )}
          </div>

          {/* Primary & Secondary Muscles */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#A78BFA', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Primary Muscles
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(variant?.primaryMuscles || exercise.primaryMuscles || []).map((muscle, i) => (
                <span key={i} style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#A78BFA',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}>
                  {muscle}
                </span>
              ))}
            </div>
          </div>

          {exercise.secondaryMuscles?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#6B7280', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                Secondary Muscles
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {exercise.secondaryMuscles.map((muscle, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: '#9CA3AF',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                  }}>
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Instructions
              </h4>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.7',
                margin: 0,
                fontSize: '15px',
              }}>
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Setup Tips */}
          {variant?.setupTips?.length > 0 && (
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                Setup Tips
              </h4>
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.8',
                fontSize: '14px',
              }}>
                {variant.setupTips.map((tip, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Custom Dropdown Component
const CustomDropdown = ({ value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);
  const displayLabel = value === 'all' ? placeholder : selectedOption?.label || value;
  const isActive = value !== 'all';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 18px',
          paddingRight: '40px',
          background: isActive ? 'rgba(139, 92, 246, 0.15)' : isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: '1px solid',
          borderColor: isActive || isOpen ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.08)',
          borderRadius: '12px',
          color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          position: 'relative',
          transition: 'all 0.15s',
          outline: 'none',
          userSelect: 'none',
          caretColor: 'transparent',
        }}
      >
        {displayLabel}
        <svg
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          style={{
            position: 'absolute',
            right: '12px',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: 'rgba(20, 20, 25, 0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '8px',
                minWidth: '160px',
                zIndex: 101,
                boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {options.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: value === option.value ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: value === option.value ? '#A78BFA' : 'rgba(255,255,255,0.7)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.1s',
                    outline: 'none',
                    userSelect: 'none',
                    caretColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.value) {
                      e.target.style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.value) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Component
export default function ExerciseLibraryPage({ onBack, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [expandVariants, setExpandVariants] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userVideos, setUserVideos] = useState([]);
  const [userImages, setUserImages] = useState([]);
  const [loadingUserMedia, setLoadingUserMedia] = useState(false);

  // Fetch user's uploaded videos AND images from Firestore
  useEffect(() => {
    const fetchUserMedia = async () => {
      console.log('📹 fetchUserMedia called');
      console.log('   user:', user);
      console.log('   user.uid:', user?.uid);
      console.log('   db:', db ? 'initialized' : 'NOT initialized');

      if (!user?.uid || !db) {
        console.log('   ❌ No user or db, skipping fetch');
        setUserVideos([]);
        setUserImages([]);
        return;
      }

      setLoadingUserMedia(true);
      try {
        // Fetch videos
        console.log('   📡 Fetching videos from: users/' + user.uid + '/exerciseVideos');
        const videosRef = collection(db, 'users', user.uid, 'exerciseVideos');
        const videosSnapshot = await getDocs(videosRef);
        const videos = videosSnapshot.docs.map(doc => {
          console.log('   Found video doc:', doc.id, doc.data());
          return doc.data();
        });
        console.log('📹 Fetched user videos:', videos.length);
        if (videos.length > 0) {
          console.log('   Video exercises:', videos.map(v => v.exerciseName));
        }
        setUserVideos(videos);

        // Fetch images
        console.log('   🖼️ Fetching images from: users/' + user.uid + '/exerciseImages');
        const imagesRef = collection(db, 'users', user.uid, 'exerciseImages');
        const imagesSnapshot = await getDocs(imagesRef);
        const images = imagesSnapshot.docs.map(doc => {
          console.log('   Found image doc:', doc.id, doc.data());
          return doc.data();
        });
        console.log('🖼️ Fetched user images:', images.length);
        if (images.length > 0) {
          console.log('   Image exercises:', images.map(img => img.exerciseName));
        }
        setUserImages(images);

      } catch (error) {
        console.error('❌ Error fetching user media:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        setUserVideos([]);
        setUserImages([]);
      } finally {
        setLoadingUserMedia(false);
      }
    };

    fetchUserMedia();
  }, [user?.uid]);

  // Helper to match user media (video or image) to an exercise
  const matchesExercise = (media, exerciseName, variant) => {
    if (!media?.exerciseName || !exerciseName) return false;

    // Method 1: Exact match on exercise name
    if (media.exerciseName === exerciseName) {
      return !variant || !media.variant || media.variant === variant;
    }

    // Method 2: Stored name includes variant in parentheses like "Leg Raises (Hanging)"
    // Database name is "Leg Raises" with variant "Hanging"
    const storedBaseName = media.exerciseName?.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (storedBaseName === exerciseName) {
      return !variant || !media.variant || media.variant === variant;
    }

    // Method 3: Check if stored name matches "ExerciseName (Variant)" format
    const fullNameWithVariant = variant ? `${exerciseName} (${variant})` : exerciseName;
    if (media.exerciseName === fullNameWithVariant) {
      return true;
    }

    return false;
  };

  // Helper to get user video for an exercise
  const getUserVideoForExercise = (exerciseName, variant) => {
    if (!exerciseName) return null;
    return userVideos.find(v => matchesExercise(v, exerciseName, variant));
  };

  // Helper to get user image for an exercise
  const getUserImageForExercise = (exerciseName, variant) => {
    if (!exerciseName) return null;
    return userImages.find(img => matchesExercise(img, exerciseName, variant));
  };

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = (e) => {
      const currentScrollY = e.target.scrollTop;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = document.getElementById('exercise-library-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  const muscleGroups = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'forearms', 'cardio'];
  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const muscleOptions = muscleGroups.map(m => ({
    value: m,
    label: m === 'all' ? 'All Muscles' : m.charAt(0).toUpperCase() + m.slice(1)
  }));
  const difficultyOptions = difficulties.map(d => ({ value: d, label: d === 'all' ? 'All Levels' : d }));

  // Get all exercises with their variants
  const allExercisesWithVariants = useMemo(() => {
    const result = [];

    Object.entries(exerciseDatabase).forEach(([muscle, exercises]) => {
      exercises.forEach(exercise => {
        if (exercise.variants && exercise.variants.length > 0 && expandVariants) {
          // Add each variant as a separate entry
          exercise.variants.forEach(variant => {
            result.push({
              ...exercise,
              muscleGroup: muscle.charAt(0).toUpperCase() + muscle.slice(1),
              variant,
            });
          });
        } else {
          // Add the base exercise
          result.push({
            ...exercise,
            muscleGroup: muscle.charAt(0).toUpperCase() + muscle.slice(1),
            variant: exercise.variants?.[0] || null,
          });
        }
      });
    });

    return result;
  }, [expandVariants]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return allExercisesWithVariants.filter(item => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchLower) ||
        item.muscleGroup.toLowerCase().includes(searchLower) ||
        item.variant?.equipment?.toLowerCase().includes(searchLower) ||
        item.primaryMuscles?.some(m => m.toLowerCase().includes(searchLower));

      // Muscle filter
      const matchesMuscle = selectedMuscle === 'all' ||
        item.muscleGroup.toLowerCase() === selectedMuscle;

      // Difficulty filter
      const itemDifficulty = item.variant?.difficulty || item.difficulty;
      const matchesDifficulty = selectedDifficulty === 'all' ||
        itemDifficulty === selectedDifficulty;

      return matchesSearch && matchesMuscle && matchesDifficulty;
    });
  }, [allExercisesWithVariants, searchQuery, selectedMuscle, selectedDifficulty]);

  const handleSelectExercise = (exercise, variant) => {
    setSelectedExercise(exercise);
    setSelectedVariant(variant);
  };

  return (
    <div
      id="exercise-library-scroll"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: '"Outfit", -apple-system, sans-serif',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: headerVisible ? 0 : -100 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(10, 10, 10, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '20px 5vw',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          {/* Back button */}
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              width: '46px',
              height: '46px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </motion.button>

          {/* Title */}
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '600',
            color: '#fff',
            flexShrink: 0,
          }}>
            Exercises
            <span style={{
              marginLeft: '12px',
              fontSize: '15px',
              fontWeight: '400',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {filteredExercises.length}
            </span>
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <svg
              width="16" height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
            <CustomDropdown
              value={selectedMuscle}
              options={muscleOptions}
              onChange={setSelectedMuscle}
              placeholder="Muscle"
            />

            <CustomDropdown
              value={selectedDifficulty}
              options={difficultyOptions}
              onChange={setSelectedDifficulty}
              placeholder="Difficulty"
            />

            <motion.button
              onClick={() => setExpandVariants(!expandVariants)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 18px',
                background: expandVariants ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                border: '1px solid',
                borderColor: expandVariants ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: expandVariants ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                outline: 'none',
                userSelect: 'none',
                caretColor: 'transparent',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {expandVariants ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
              </svg>
              Variants
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Exercise Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 5vw',
      }}>
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredExercises.map((item, index) => (
              <ExerciseCard
                key={`${item.id}-${item.variant?.equipment || 'base'}-${index}`}
                exercise={item}
                variant={item.variant}
                onSelect={handleSelectExercise}
                userVideo={getUserVideoForExercise(item.name, item.variant?.equipment)}
                userImage={getUserImageForExercise(item.name, item.variant?.equipment)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredExercises.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <p style={{ fontSize: '18px', margin: 0 }}>No exercises found</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            variant={selectedVariant}
            onClose={() => {
              setSelectedExercise(null);
              setSelectedVariant(null);
            }}
            userVideo={getUserVideoForExercise(selectedExercise?.name, selectedVariant?.equipment)}
            userImage={getUserImageForExercise(selectedExercise?.name, selectedVariant?.equipment)}
          />
        )}
      </AnimatePresence>

      {/* Global styles for this page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        html, body {
          background: #0a0a0a !important;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
