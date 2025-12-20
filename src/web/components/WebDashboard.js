import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import WebDataService from '../services/WebDataService';
import ScreenshotImporter from './ScreenshotImporter';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    const isSmallScreen = window.innerWidth < 900;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return isMobileUA || (isSmallScreen && hasTouch);
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 900;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileUA || (isSmallScreen && hasTouch));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Helper to get local date string
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Exercise image mapping for web (URL-based images only)
const EXERCISE_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EXERCISE_IMAGES = {
  // CHEST
  "Bench Press": { default: "Barbell_Bench_Press_-_Medium_Grip", "Barbell": "Barbell_Bench_Press_-_Medium_Grip", "Dumbbell": "Dumbbell_Bench_Press", "Smith Machine": "Smith_Machine_Bench_Press" },
  "Incline Bench Press": { default: "Barbell_Incline_Bench_Press_-_Medium_Grip", "Barbell": "Barbell_Incline_Bench_Press_-_Medium_Grip", "Dumbbell": "Incline_Dumbbell_Press" },
  "Decline Bench Press": { default: "Decline_Barbell_Bench_Press", "Barbell": "Decline_Barbell_Bench_Press", "Dumbbell": "Decline_Dumbbell_Bench_Press" },
  "Chest Fly": { default: "Dumbbell_Flyes", "Dumbbell": "Dumbbell_Flyes", "Cable": "Cable_Crossover", "Machine (Pec Deck)": "Butterfly" },
  "Cable Crossover": { default: "Cable_Crossover", "Low to High": "Low_Cable_Crossover" },
  "Push-ups": { default: "Pushups", "Standard": "Pushups", "Wide Grip": "Push-Up_Wide", "Diamond": "Push-Ups_-_Close_Triceps_Position" },
  "Chest Dips": { default: "Dip_Machine", "Assisted Machine": "Dip_Machine" },

  // BACK
  "Lat Pulldown": { default: "Wide-Grip_Lat_Pulldown", "Wide Grip": "Wide-Grip_Lat_Pulldown", "Close Grip": "Close-Grip_Front_Lat_Pulldown", "V-Bar (Neutral Grip)": "V-Bar_Pulldown" },
  "Cable Row": { default: "Seated_Cable_Rows", "Low Angle (lats focus)": "Seated_Cable_Rows", "High Angle (upper back/rear delts focus)": "Leverage_High_Row" },
  "One Arm Row": { default: "One-Arm_Dumbbell_Row", "Dumbbell": "One-Arm_Dumbbell_Row" },
  "Pullover": { default: "Bent-Arm_Dumbbell_Pullover", "Dumbbell": "Bent-Arm_Dumbbell_Pullover" },
  "Pull-ups": { default: "Pullups", "Wide Grip": "Wide-Grip_Rear_Pull-Up", "Close Grip": "Close-Grip_Pull-Up" },
  "Chin-ups": { default: "Chin-Up" },
  "Deadlift": { default: "Barbell_Deadlift", "Conventional": "Barbell_Deadlift", "Sumo": "Sumo_Deadlift", "Romanian": "Romanian_Deadlift" },
  "T-Bar Row": { default: "Lying_T-Bar_Row", "Chest Supported": "Lying_T-Bar_Row" },
  "Barbell Row": { default: "Bent_Over_Barbell_Row", "Overhand": "Bent_Over_Barbell_Row", "Underhand": "Reverse_Grip_Bent-Over_Rows" },
  "Face Pull": { default: "Face_Pull" },
  "Shrugs": { default: "Barbell_Shrug", "Barbell": "Barbell_Shrug", "Dumbbell": "Dumbbell_Shrug" },
  "Hyperextension": { default: "Hyperextensions_With_No_Hyperextension_Bench" },

  // SHOULDERS
  "Overhead Press": { default: "Standing_Military_Press", "Barbell": "Standing_Military_Press", "Dumbbell": "Dumbbell_Shoulder_Press" },
  "Lateral Raise": { default: "Side_Lateral_Raise", "Dumbbell": "Side_Lateral_Raise", "Cable": "Cable_Lateral_Raise" },
  "Front Raise": { default: "Front_Dumbbell_Raise", "Dumbbell": "Front_Dumbbell_Raise", "Barbell": "Front_Plate_Raise" },
  "Rear Delt Fly": { default: "Seated_Bent-Over_Rear_Delt_Raise", "Dumbbell": "Seated_Bent-Over_Rear_Delt_Raise", "Cable": "Cable_Rear_Delt_Fly" },
  "Arnold Press": { default: "Arnold_Dumbbell_Press" },
  "Upright Row": { default: "Upright_Barbell_Row", "Barbell": "Upright_Barbell_Row", "Dumbbell": "Dumbbell_Lying_Rear_Lateral_Raise" },

  // BICEPS
  "Bicep Curl": { default: "Barbell_Curl", "Barbell": "Barbell_Curl", "Dumbbell": "Dumbbell_Bicep_Curl", "EZ Bar": "EZ-Bar_Curl", "Cable": "Cable_Hammer_Curls_-_Rope_Attachment" },
  "Hammer Curl": { default: "Hammer_Curls", "Dumbbell": "Hammer_Curls", "Cable": "Cable_Hammer_Curls_-_Rope_Attachment" },
  "Preacher Curl": { default: "Preacher_Curl", "Barbell": "Preacher_Curl", "Dumbbell": "One_Arm_Dumbbell_Preacher_Curl", "EZ Bar": "EZ-Bar_Preacher_Curl" },
  "Incline Curl": { default: "Incline_Dumbbell_Curl" },
  "Concentration Curl": { default: "Concentration_Curls" },
  "Cable Curl": { default: "Cable_Hammer_Curls_-_Rope_Attachment", "Rope": "Cable_Hammer_Curls_-_Rope_Attachment", "Straight Bar": "Standing_Bicep_Cable_Curl" },

  // TRICEPS
  "Tricep Pushdown": { default: "Triceps_Pushdown", "Rope": "Triceps_Pushdown_-_Rope_Attachment", "V-Bar": "Triceps_Pushdown_-_V-Bar_Attachment", "Straight Bar": "Triceps_Pushdown" },
  "Skull Crushers": { default: "Lying_Triceps_Press", "EZ Bar": "Lying_Triceps_Press", "Dumbbell": "Lying_Dumbbell_Tricep_Extension" },
  "Overhead Tricep Extension": { default: "Dumbbell_One-Arm_Triceps_Extension", "Dumbbell": "Dumbbell_One-Arm_Triceps_Extension", "Cable": "Cable_One_Arm_Tricep_Extension" },
  "Tricep Dips": { default: "Tricep_Dip", "Bench Dips": "Bench_Dips" },
  "Close Grip Bench Press": { default: "Close-Grip_Barbell_Bench_Press" },
  "Tricep Kickback": { default: "Tricep_Dumbbell_Kickback" },

  // LEGS
  "Squat": { default: "Barbell_Full_Squat", "Barbell": "Barbell_Full_Squat", "Dumbbell": "Dumbbell_Squat", "Smith Machine": "Smith_Machine_Squat" },
  "Leg Press": { default: "Leg_Press" },
  "Leg Extension": { default: "Leg_Extensions" },
  "Leg Curl": { default: "Seated_Leg_Curl", "Seated": "Seated_Leg_Curl", "Lying": "Lying_Leg_Curls" },
  "Romanian Deadlift": { default: "Romanian_Deadlift", "Barbell": "Romanian_Deadlift", "Dumbbell": "Romanian_Deadlift_With_Dumbbells" },
  "Lunges": { default: "Dumbbell_Lunges", "Dumbbell": "Dumbbell_Lunges", "Barbell": "Barbell_Lunge" },
  "Bulgarian Split Squat": { default: "Dumbbell_Single_Leg_Split_Squat" },
  "Hip Thrust": { default: "Barbell_Hip_Thrust" },
  "Glute Kickback": { default: "Glute_Kickback" },
  "Calf Raise": { default: "Standing_Calf_Raises", "Standing": "Standing_Calf_Raises", "Seated": "Seated_Calf_Raise" },
  "Hack Squat": { default: "Hack_Squat" },
  "Step Up": { default: "Dumbbell_Step_Ups" },
  "Good Morning": { default: "Good_Morning" },
  "Hip Abduction": { default: "Thigh_Abductor" },
  "Hip Adduction": { default: "Thigh_Adductor" },

  // CORE
  "Plank": { default: "Plank" },
  "Crunches": { default: "Crunches" },
  "Leg Raise": { default: "Hanging_Leg_Raise", "Hanging": "Hanging_Leg_Raise", "Lying": "Flat_Bench_Lying_Leg_Raise" },
  "Russian Twist": { default: "Russian_Twist" },
  "Ab Rollout": { default: "Ab_Roller" },
  "Cable Crunch": { default: "Cable_Crunch" },
  "Bicycle Crunch": { default: "Air_Bike" },
  "Mountain Climbers": { default: "Mountain_Climbers" },
  "Dead Bug": { default: "Dead_Bug" },
  "Woodchop": { default: "Cable_Woodchop" },
  "Side Plank": { default: "Side_Plank" },
};

// Get exercise image URL for web
const getExerciseImageUrl = (exerciseName, equipment = null) => {
  if (!exerciseName) return null;

  // Parse exercise name - might contain equipment in parentheses like "Lat Pulldown (Wide Grip)"
  let baseName = exerciseName;
  let parsedEquipment = equipment;

  const parenMatch = exerciseName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    baseName = parenMatch[1].trim();
    parsedEquipment = parsedEquipment || parenMatch[2].trim();
  }

  // Try exact match first
  let mapping = EXERCISE_IMAGES[exerciseName];

  // Then try base name
  if (!mapping) {
    mapping = EXERCISE_IMAGES[baseName];
  }

  if (!mapping) return null;

  // Try to find equipment-specific image, fall back to default
  let imageId = null;
  if (parsedEquipment && mapping[parsedEquipment]) {
    imageId = mapping[parsedEquipment];
  } else if (equipment && mapping[equipment]) {
    imageId = mapping[equipment];
  } else {
    imageId = mapping.default;
  }

  if (!imageId) return null;

  return `${EXERCISE_IMAGE_BASE_URL}${imageId}/0.jpg`;
};

// Helper to extract local date from various formats (fixes timezone offset issues)
const extractLocalDate = (dateValue) => {
  if (!dateValue) return null;

  // If it's a Firestore Timestamp object
  if (dateValue && typeof dateValue.toDate === 'function') {
    const d = dateValue.toDate();
    return getLocalDateString(d);
  }

  // If it's a plain date string like "2024-10-04" (no time component)
  // Return as-is - this is the intended local date
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  // If it's an ISO string with UTC timezone (ends with Z), parse it to get LOCAL date
  // e.g., "2024-12-17T04:00:00.000Z" in EST should return "2024-12-16"
  if (typeof dateValue === 'string' && dateValue.includes('T') && dateValue.includes('Z')) {
    const d = new Date(dateValue);
    return getLocalDateString(d);
  }

  // If it's an ISO string WITHOUT Z (local time), just extract the date part
  // e.g., "2024-12-16T23:00:00" should return "2024-12-16"
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0];
  }

  // If it's a Date object
  if (dateValue instanceof Date) {
    return getLocalDateString(dateValue);
  }

  // If it's a number (timestamp in ms)
  if (typeof dateValue === 'number') {
    return getLocalDateString(new Date(dateValue));
  }

  return String(dateValue);
};

// Fullscreen Image Lightbox Component
const ImageLightbox = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `workout-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Close button */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#FFFFFF',
          fontSize: '28px',
          zIndex: 3001,
        }}
      >
        ×
      </motion.button>

      {/* Image */}
      <motion.img
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        src={imageUrl}
        alt="Workout photo"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      />

      {/* Download button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        whileHover={{ scale: 1.05, background: 'rgba(139, 92, 246, 0.9)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          marginTop: '24px',
          background: 'rgba(139, 92, 246, 0.7)',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 32px',
          cursor: 'pointer',
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span>⬇️</span> Download Photo
      </motion.button>
    </motion.div>
  );
};

// Tab navigation items
const TABS = [
  { id: 'workouts', label: 'Workouts', icon: 'M4 6h16M4 12h16M4 18h16' },
  { id: 'nutrition', label: 'Nutrition', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { id: 'progress', label: 'Progress', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'goals', label: 'Goals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'import', label: 'Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
];

// Stat card component
const StatCard = ({ title, value, subtitle, color = '#8B5CF6', icon, isMobile = false }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '12px' : '20px',
      flex: 1,
      minWidth: isMobile ? '80px' : '120px',
    }}
  >
    <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: isMobile ? '4px' : '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
      {title}
    </div>
    <div style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '700', color, marginBottom: '2px' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)' }}>
        {subtitle}
      </div>
    )}
  </div>
);

// Calendar component
const Calendar = ({ workoutDates = [], nutritionDates = [], type = 'workout', onDayClick, workoutsByDate = {}, mealsByDate = {} }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dates = type === 'workout' ? workoutDates : nutritionDates;
  // Dates should already be in YYYY-MM-DD format from WebDataService, don't re-process
  const dateSet = new Set(dates.filter(Boolean));
  const dataByDate = type === 'workout' ? workoutsByDate : mealsByDate;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDateStr = (day) => {
    if (!day) return null;
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isActive = (day) => {
    if (!day) return false;
    return dateSet.has(getDateStr(day));
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (day) => {
    if (!day || !isActive(day)) return;
    const dateStr = getDateStr(day);
    if (onDayClick) {
      onDayClick(dateStr, dataByDate[dateStr] || []);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '20px', cursor: 'pointer' }}>&lt;</button>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#8B5CF6', fontSize: '20px', cursor: 'pointer' }}>&gt;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '8px 0' }}>{d}</div>
        ))}
        {days.map((day, i) => (
          <motion.div
            key={i}
            onClick={() => handleDayClick(day)}
            whileHover={isActive(day) ? { scale: 1.1 } : {}}
            whileTap={isActive(day) ? { scale: 0.95 } : {}}
            style={{
              padding: '8px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive(day) ? '600' : '400',
              color: day ? (isActive(day) ? '#FFFFFF' : 'rgba(255,255,255,0.5)') : 'transparent',
              background: isActive(day) ? (type === 'workout' ? '#8B5CF6' : '#10B981') : isToday(day) ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: isToday(day) && !isActive(day) ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid transparent',
              cursor: isActive(day) ? 'pointer' : 'default',
            }}
          >
            {day || ''}
          </motion.div>
        ))}
      </div>
      {onDayClick && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click on highlighted days to view {type === 'workout' ? 'workout' : 'meal'} details
        </div>
      )}
    </div>
  );
};

// Achievement badge component
const AchievementBadge = ({ achievement, unlocked }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    style={{
      background: unlocked ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${unlocked ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
      opacity: unlocked ? 1 : 0.5,
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
      {achievement.icon || (unlocked ? '🏆' : '🔒')}
    </div>
    <div style={{ fontSize: '13px', fontWeight: '600', color: unlocked ? '#FFFFFF' : 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
      {achievement.name || achievement.title}
    </div>
    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
      {achievement.description}
    </div>
  </motion.div>
);

// Clean bar chart component with goal indicator
const BarChart = ({ data, dataKey, color = '#8B5CF6', height = 180, showLabels = true, target = null }) => {
  if (!data || data.length === 0) return null;

  const dataMax = Math.max(...data.map(d => d[dataKey] || 0), 1);
  // Scale so the goal is at ~75% height, leaving room for bars that exceed goal
  const maxValue = target ? Math.max(dataMax, target * 1.33) : dataMax;
  const barAreaHeight = height - 30; // Space for day labels

  // Get color for bar based on percentage of goal
  const getBarColor = (value) => {
    if (!target || value === 0) return color;
    const percent = (value / target) * 100;
    if (percent >= 90 && percent <= 110) return '#10B981'; // On target - green
    if (percent > 110) return '#F59E0B'; // Over - orange
    if (percent < 50) return '#EF4444'; // Way under - red
    return '#8B5CF6'; // Under but trying - purple
  };

  return (
    <div style={{ height, position: 'relative' }}>
      {/* Background grid lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 30 }}>
        {[0.25, 0.5, 0.75, 1].map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${line * 100}%`,
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>

      {/* Goal indicator line */}
      {target && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${30 + (target / maxValue) * barAreaHeight}px`,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #10B981 10%, #10B981 90%, transparent 100%)',
            zIndex: 5,
          }}
        />
      )}

      {/* Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        height: barAreaHeight,
        padding: '0 4px',
      }}>
        {data.map((item, index) => {
          const value = item[dataKey] || 0;
          const barHeight = value > 0 ? Math.max((value / maxValue) * barAreaHeight, 4) : 0;
          const barColor = getBarColor(value);

          return (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              {/* Value label */}
              {value > 0 && (
                <div style={{
                  fontSize: '12px',
                  color: barColor,
                  marginBottom: '6px',
                  fontWeight: '700',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}>
                  {value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                </div>
              )}
              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeight }}
                transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  width: '100%',
                  maxWidth: '40px',
                  background: value > 0 ? `linear-gradient(180deg, ${barColor}, ${barColor}66)` : 'rgba(255,255,255,0.05)',
                  borderRadius: '4px 4px 0 0',
                  minHeight: value === 0 ? '4px' : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '8px 4px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: '500',
          }}>
            <div style={{
              fontSize: '11px',
              color: (item[dataKey] || 0) > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
            }}>
              {item.label || ''}
            </div>
            {item.dayNum && (
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '2px',
              }}>
                {item.dayNum}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Line chart component for exercise progress
const LineChart = ({ data, height = 200, chartType = 'max', onPointClick }) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => d.weight);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Add padding to range
  const range = maxValue - minValue;
  const chartMin = range === 0 ? Math.max(0, minValue - 10) : Math.floor(minValue * 0.9);
  const chartMax = range === 0 ? maxValue + 10 : Math.ceil(maxValue * 1.1);
  const chartRange = chartMax - chartMin;

  const chartAreaHeight = height - 40; // Space for labels

  const getYPosition = (value) => {
    if (chartRange === 0) return chartAreaHeight / 2;
    return chartAreaHeight - ((value - chartMin) / chartRange) * chartAreaHeight;
  };

  const getXPosition = (index) => {
    if (data.length === 1) return 50;
    // Add padding so points aren't at the very edges (5% to 95%)
    const padding = 5;
    const usableWidth = 100 - (padding * 2);
    return padding + (index / (data.length - 1)) * usableWidth;
  };

  // Progress colors
  const getColor = (prevValue, currentValue) => {
    if (currentValue > prevValue) return '#10B981'; // Green for progress
    if (currentValue < prevValue) return '#EF4444'; // Red for regression
    return '#8B5CF6'; // Purple for no change
  };

  // Format value for display
  const formatValue = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return Math.round(value).toString();
  };

  // Calculate Y-axis labels
  const yLabels = [chartMax, chartMin + (chartRange * 2/3), chartMin + (chartRange / 3), chartMin];

  return (
    <div style={{ height, position: 'relative' }}>
      {/* Y-axis labels */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 40, width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {yLabels.map((label, i) => (
          <span key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', paddingRight: '8px' }}>
            {formatValue(label)}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 40, userSelect: 'none' }}>
        {/* Grid lines */}
        {[0, 0.33, 0.67, 1].map((ratio, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${ratio * 100}%`,
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* SVG for lines and dots */}
        <svg style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          {/* Area fill */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {data.length > 1 && (
            <path
              d={`M ${getXPosition(0)}% ${getYPosition(values[0])}
                  ${data.map((_, i) => `L ${getXPosition(i)}% ${getYPosition(values[i])}`).join(' ')}
                  L ${getXPosition(data.length - 1)}% ${chartAreaHeight}
                  L ${getXPosition(0)}% ${chartAreaHeight} Z`}
              fill="url(#areaGradient)"
            />
          )}

          {/* Lines connecting points */}
          {data.map((point, index) => {
            if (index === 0) return null;
            const x1 = `${getXPosition(index - 1)}%`;
            const y1 = getYPosition(values[index - 1]);
            const x2 = `${getXPosition(index)}%`;
            const y2 = getYPosition(values[index]);
            const color = getColor(values[index - 1], values[index]);

            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* Data points */}
          {data.map((point, index) => {
            const cx = `${getXPosition(index)}%`;
            const cy = getYPosition(values[index]);
            const color = index === 0 ? '#8B5CF6' : getColor(values[index - 1], values[index]);

            return (
              <g key={`point-${index}`}>
                <circle cx={cx} cy={cy} r="8" fill={color} opacity="0.3" />
                <circle cx={cx} cy={cy} r="5" fill="#111111" stroke={color} strokeWidth="2" />
              </g>
            );
          })}
        </svg>

        {/* Clickable overlay areas for each point */}
        {onPointClick && data.map((point, index) => {
          const left = `${getXPosition(index)}%`;
          const top = getYPosition(values[index]);

          return (
            <button
              key={`click-${index}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPointClick(point, index);
              }}
              style={{
                position: 'absolute',
                left,
                top,
                transform: 'translate(-50%, -50%)',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 20,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                background: 'transparent',
                border: 'none',
                padding: 0,
                outline: 'none',
              }}
            />
          );
        })}

        {/* Value labels on points (show first, last, and max) */}
        {data.map((point, index) => {
          const showLabel = index === 0 || index === data.length - 1 || values[index] === maxValue;
          if (!showLabel) return null;

          const left = `${getXPosition(index)}%`;
          const top = getYPosition(values[index]) - 24;
          const color = index === 0 ? '#8B5CF6' : getColor(values[index - 1], values[index]);

          return (
            <div
              key={`label-${index}`}
              onClick={() => onPointClick && onPointClick(point, index)}
              style={{
                position: 'absolute',
                left,
                top,
                transform: 'translateX(-50%)',
                background: color,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                cursor: onPointClick ? 'pointer' : 'default',
                zIndex: 11,
              }}
            >
              {formatValue(values[index])}
            </div>
          );
        })}
      </div>

      {/* X-axis labels - positioned below each data point */}
      <div style={{ position: 'absolute', left: 40, right: 0, bottom: 0, height: '40px' }}>
        {data.map((point, index) => (
          <span
            key={index}
            style={{
              position: 'absolute',
              left: `${getXPosition(index)}%`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              top: '8px',
            }}
          >
            {point.label || ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// Single Exercise Chart Card Component
const ExerciseChartCard = ({ exercise, isMobile = false }) => {
  const records = exercise?.records || [];

  // Group records by workout date and get max weight per day
  const getChartData = () => {
    const dateMap = {};

    records.forEach(record => {
      const dateKey = record.date?.split('T')[0] || record.date;
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(record.weight);
    });

    return Object.entries(dateMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-12) // Last 12 workouts
      .map(([date, weights]) => {
        const d = new Date(date);
        return {
          date,
          weight: Math.max(...weights),
          label: `${d.getMonth() + 1}/${d.getDate()}`,
        };
      });
  };

  const chartData = getChartData();

  // Calculate progress
  const getProgressSummary = () => {
    if (chartData.length < 2) return null;
    const first = chartData[0].weight;
    const last = chartData[chartData.length - 1].weight;
    const diff = last - first;
    const percent = first > 0 ? ((diff / first) * 100).toFixed(0) : 0;
    return { diff, percent, isPositive: diff > 0, isNeutral: diff === 0 };
  };

  const progress = getProgressSummary();

  // Show card even with just 1 data point
  if (chartData.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '14px' : '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>
            {exercise.name}
          </h4>
          <span style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: '600' }}>{exercise.maxWeight} lbs</span>
        </div>
        <div style={{
          height: isMobile ? 80 : 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '12px',
        }}>
          No workout data yet
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '14px' : '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{
          fontSize: isMobile ? '13px' : '15px',
          fontWeight: '600',
          color: '#FFFFFF',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '60%',
        }}>
          {exercise.name}
        </h4>
        {progress && (
          <div style={{
            background: progress.isNeutral ? 'rgba(139, 92, 246, 0.15)' : progress.isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: '600',
            color: progress.isNeutral ? '#8B5CF6' : progress.isPositive ? '#10B981' : '#EF4444',
          }}>
            {progress.isNeutral ? '→' : progress.isPositive ? '↑' : '↓'} {Math.abs(progress.diff).toFixed(0)} lbs
          </div>
        )}
      </div>

      {/* Mini Chart */}
      <LineChart data={chartData} height={isMobile ? 100 : 120} chartType="max" />

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Max</div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#8B5CF6' }}>{exercise.maxWeight} lbs</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Volume</div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#06B6D4' }}>{(exercise.totalVolume / 1000).toFixed(1)}k</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Sessions</div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '700', color: '#10B981' }}>{chartData.length}</div>
        </div>
      </div>
    </div>
  );
};

// Custom Exercise Dropdown with rounded cells
const ExerciseDropdown = ({ exercises, selectedExercise, onSelect, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = exercises.find(ex => ex.name === selectedExercise) || exercises[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '20px' }}>
      {/* Selected item / trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '50px',
          color: '#A78BFA',
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: '600',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
        }}
      >
        <span>{selected?.name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A78BFA"
          strokeWidth="2.5"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: 'rgba(17, 17, 17, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          padding: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}>
          {exercises.map(ex => (
            <button
              key={ex.name}
              onClick={() => {
                onSelect(ex.name);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: ex.name === selectedExercise ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                border: 'none',
                borderRadius: '50px',
                color: ex.name === selectedExercise ? '#A78BFA' : 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: ex.name === selectedExercise ? '600' : '500',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '4px',
                transition: 'all 0.15s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                if (ex.name !== selectedExercise) {
                  e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (ex.name !== selectedExercise) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span>{ex.name}</span>
              <span style={{ color: '#8B5CF6', fontSize: '13px' }}>{ex.maxWeight} lbs</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Exercise Progress Charts Component - Single chart with selector
const ExerciseProgressCharts = ({ exerciseProgress, isMobile = false, workouts = [] }) => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Sort exercises by number of records (most data first)
  const sortedExercises = Object.values(exerciseProgress || {})
    .filter(ex => ex.records && ex.records.length > 0)
    .sort((a, b) => b.records.length - a.records.length);

  // Set default selected exercise
  useEffect(() => {
    if (sortedExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(sortedExercises[0].name);
    }
  }, [sortedExercises.length]);

  // Get current exercise data
  const exercise = exerciseProgress?.[selectedExercise] || sortedExercises[0];

  // Handle point click - find workout for that date
  const handlePointClick = (point) => {
    try {
      const clickedDate = (point.date || '').split('T')[0];

      // Try to find the full workout for this date
      const workoutArray = Array.isArray(workouts) ? workouts : [];
      const workout = workoutArray.find(w => {
        const workoutDate = (w.date || '').split('T')[0];
        return workoutDate === clickedDate;
      });

      if (workout) {
        // Found full workout - show all details
        setSelectedWorkout({
          ...workout,
          clickedExercise: selectedExercise,
        });
      } else {
        // No full workout found - show exercise data from records
        const currentExercise = exerciseProgress?.[selectedExercise];
        const exerciseSets = (currentExercise?.records || []).filter(r => {
          const recordDate = (r.date || '').split('T')[0];
          return recordDate === clickedDate;
        });

        setSelectedWorkout({
          date: point.date,
          name: 'Workout',
          clickedExercise: selectedExercise,
          exercises: [{
            name: selectedExercise,
            sets: exerciseSets.length > 0
              ? exerciseSets.map(s => ({ weight: s.weight, reps: s.reps }))
              : [{ weight: point.weight, reps: point.reps || 0 }]
          }],
        });
      }
    } catch (err) {
      alert('Error: ' + err.message);
      console.error(err);
    }
  };

  if (!exerciseProgress || Object.keys(exerciseProgress).length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
          <path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/>
        </svg>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>Complete workouts to see exercise progress charts</div>
      </div>
    );
  }

  if (!exercise) return null;

  // Get chart data - show max weight per workout session (not every set)
  const getChartData = () => {
    const records = exercise.records || [];
    const dateMap = {};

    // Group by date and get max weight per workout
    records.forEach(record => {
      const dateKey = record.date?.split('T')[0] || record.date;
      if (!dateMap[dateKey] || record.weight > dateMap[dateKey].weight) {
        dateMap[dateKey] = {
          date: dateKey,
          weight: record.weight,
          reps: record.reps,
        };
      }
    });

    // Sort by date and take last 20 workouts
    return Object.values(dateMap)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-20)
      .map(record => {
        const d = new Date(record.date);
        return {
          ...record,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
        };
      });
  };

  const chartData = getChartData();

  // Calculate progress
  const getProgressSummary = () => {
    if (chartData.length < 2) return null;
    const first = chartData[0].weight;
    const last = chartData[chartData.length - 1].weight;
    const diff = last - first;
    return { diff, isPositive: diff > 0, isNeutral: diff === 0 };
  };

  const progress = getProgressSummary();

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px' : '24px',
    }}>
      {/* Exercise selector dropdown */}
      <ExerciseDropdown
        exercises={sortedExercises}
        selectedExercise={selectedExercise}
        onSelect={setSelectedExercise}
        isMobile={isMobile}
      />

      {/* Progress badge */}
      {progress && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <div style={{
            background: progress.isNeutral ? 'rgba(139, 92, 246, 0.15)' : progress.isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '600',
            color: progress.isNeutral ? '#8B5CF6' : progress.isPositive ? '#10B981' : '#EF4444',
          }}>
            {progress.isNeutral ? '→' : progress.isPositive ? '↑' : '↓'} {Math.abs(progress.diff).toFixed(0)} lbs from first to last
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <LineChart data={chartData} height={isMobile ? 180 : 220} chartType="max" onPointClick={handlePointClick} />
      ) : (
        <div style={{
          height: isMobile ? 180 : 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '14px',
        }}>
          No data available
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Max Weight</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#8B5CF6' }}>{exercise.maxWeight} lbs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Volume</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#06B6D4' }}>{(exercise.totalVolume / 1000).toFixed(1)}k lbs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Workouts</div>
          <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#10B981' }}>{chartData.length}</div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setSelectedWorkout(null)}
        >
          <div
            style={{
              background: '#111111',
              borderRadius: '24px',
              padding: isMobile ? '20px' : '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', margin: 0, marginBottom: '8px' }}>
                  {selectedWorkout.workoutTitle || selectedWorkout.name || 'Workout Details'}
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {new Date(selectedWorkout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedWorkout(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            </div>

            {/* Workout Stats Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                {selectedWorkout.duration && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {selectedWorkout.duration} min
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 4v16M18 4v16M6 12h12M3 8h6M15 8h6M3 16h6M15 16h6"/>
                  </svg>
                  {selectedWorkout.exercises?.length || 0} exercises
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19h16M4 15h16M4 11h16M4 7h16"/>
                  </svg>
                  {selectedWorkout.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0} sets
                </span>
              </div>
            </div>

            {/* Workout Notes */}
            {selectedWorkout.notes && selectedWorkout.notes.trim() && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M16 13H8"/>
                    <path d="M16 17H8"/>
                    <path d="M10 9H8"/>
                  </svg>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    Workout Notes
                  </h4>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedWorkout.notes}
                </p>
              </div>
            )}

            {/* Workout Photos */}
            {selectedWorkout.photos && selectedWorkout.photos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', margin: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Workout Photos ({selectedWorkout.photos.length})
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '12px',
                }}>
                  {selectedWorkout.photos.map((photo, idx) => {
                    const imageUrl = photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`;
                    return (
                      <img
                        key={idx}
                        src={imageUrl}
                        alt={`Workout photo ${idx + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Exercises */}
            {selectedWorkout.exercises?.map((exercise, exIdx) => {
              const isHighlighted = exercise.name === selectedWorkout.clickedExercise;
              const totalReps = exercise.sets?.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) || 0;
              const totalVolume = exercise.sets?.reduce((sum, s) => sum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0) || 0;
              const exerciseImageUrl = getExerciseImageUrl(exercise.name, exercise.selectedEquipment || exercise.equipment);

              return (
                <div key={exIdx} style={{
                  background: isHighlighted
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '12px',
                  border: isHighlighted ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                  {/* Exercise Header with Icon */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    {/* Exercise image */}
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '12px',
                      background: isHighlighted
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {exerciseImageUrl ? (
                        <img
                          src={exerciseImageUrl}
                          alt={exercise.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="2"
                        style={{ display: exerciseImageUrl ? 'none' : 'block' }}
                      >
                        <path d="M6 4v16M18 4v16M6 12h12M3 8h6M15 8h6M3 16h6M15 16h6"/>
                      </svg>
                    </div>

                    {/* Exercise info */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: isHighlighted ? '#A78BFA' : '#FFFFFF', margin: 0, marginBottom: '6px' }}>
                        {exercise.name}
                      </h4>
                      {exercise.muscleGroup && (
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#8B5CF6',
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                        }}>
                          {exercise.muscleGroup}
                        </span>
                      )}
                      {exercise.notes && (
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <path d="M14 2v6h6"/>
                            <path d="M16 13H8"/>
                            <path d="M16 17H8"/>
                          </svg>
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sets Table */}
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      {/* Table Header */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span>Volume</span>
                      </div>
                      {/* Sets */}
                      {exercise.sets.map((set, setIdx) => {
                        const weight = parseFloat(set.weight) || 0;
                        const reps = parseInt(set.reps) || 0;
                        const volume = weight * reps;
                        const isPR = set.isPR || set.isPersonalRecord;

                        return (
                          <div key={setIdx}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '50px 1fr 1fr 1fr',
                              padding: '12px 16px',
                              fontSize: '14px',
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                              alignItems: 'center',
                              background: isPR ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                            }}>
                              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{setIdx + 1}</span>
                              <span style={{ color: '#8B5CF6', fontWeight: '600' }}>
                                {weight > 0 ? `${weight} lbs` : '-'}
                              </span>
                              <span style={{ color: '#06B6D4', fontWeight: '600' }}>
                                {reps > 0 ? reps : '-'}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {volume > 0 ? volume.toLocaleString() : '-'}
                                {isPR && (
                                  <span style={{
                                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                                    color: '#FFFFFF',
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}>
                                    PR
                                  </span>
                                )}
                              </span>
                            </div>
                            {set.comment && (
                              <div style={{
                                padding: '4px 16px 10px 16px',
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.4)',
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                {set.comment}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Total Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr',
                        padding: '12px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(139, 92, 246, 0.1)',
                      }}>
                        <span style={{ color: '#8B5CF6' }}>Total</span>
                        <span></span>
                        <span style={{ color: '#06B6D4' }}>{totalReps} reps</span>
                        <span style={{ color: '#8B5CF6' }}>{totalVolume.toLocaleString()} lbs</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// Helper to format date for display without timezone issues
const formatDateForDisplay = (dateValue) => {
  const dateStr = extractLocalDate(dateValue);
  if (!dateStr) return '';
  // Parse as local noon to avoid timezone shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Workout card component
const WorkoutCard = ({ workout, onClick, onPhotoClick, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const exerciseCount = workout.exercises?.length || 0;
  const setCount = workout.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0;
  // Get exercise names (limit to first 3 for display)
  const exerciseNames = workout.exercises?.slice(0, 3).map(ex => ex.name).filter(Boolean) || [];
  const moreCount = exerciseCount > 3 ? exerciseCount - 3 : 0;
  // Get photos (if any)
  const photos = workout.photos || [];
  const hasPhotos = photos.length > 0;

  const getImageUrl = (photo) => {
    return photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`;
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(workout);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, background: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '10px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 10,
          }}
        >
          <p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0, textAlign: 'center' }}>
            Delete this workout?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleConfirmDelete}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '2px' }}>
            {workout.workoutTitle || workout.name || workout.workoutType || 'Workout'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {formatDateForDisplay(workout.date)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasPhotos && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '4px 8px',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#10B981',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              {photos.length}
            </div>
          )}
          {workout.duration && (
            <div style={{
              background: 'rgba(139, 92, 246, 0.15)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#8B5CF6',
              fontWeight: '500',
            }}>
              {workout.duration} min
            </div>
          )}
          {/* Delete button */}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Workout Photos */}
      {hasPhotos && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {photos.slice(0, 4).map((photo, index) => (
            <img
              key={index}
              src={getImageUrl(photo)}
              alt={`Workout photo ${index + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onPhotoClick) onPhotoClick(getImageUrl(photo));
              }}
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            />
          ))}
          {photos.length > 4 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onPhotoClick) onPhotoClick(getImageUrl(photos[4]));
              }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: '600',
                flexShrink: 0,
                cursor: 'pointer',
              }}>
              +{photos.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Exercise names */}
      {exerciseNames.length > 0 && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
          {exerciseNames.join(', ')}{moreCount > 0 && ` +${moreCount} more`}
        </div>
      )}
      <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
        <span><span style={{ color: '#06B6D4', fontWeight: '600' }}>{exerciseCount}</span> exercises</span>
        <span><span style={{ color: '#06B6D4', fontWeight: '600' }}>{setCount}</span> sets</span>
      </div>
    </motion.div>
  );
};

// Meal card component
const MealCard = ({ meal }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '12px 16px',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div>
      <div style={{ fontSize: '14px', fontWeight: '500', color: '#FFFFFF', marginBottom: '2px' }}>
        {meal.food_name || meal.name || 'Food item'}
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
        {meal.meal_type || 'Meal'}
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#06B6D4' }}>
        {Math.round(meal.calories_consumed || meal.calories || 0)} cal
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
        {Math.round(meal.protein_consumed || meal.protein || 0)}g P
      </div>
    </div>
  </motion.div>
);

// Meal Detail Modal
const MealDetailModal = ({ isOpen, onClose, date, meals }) => {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group meals by meal type
  const mealsByType = {};
  (meals || []).forEach(meal => {
    const type = meal.meal_type || 'other';
    if (!mealsByType[type]) {
      mealsByType[type] = [];
    }
    mealsByType[type].push(meal);
  });

  // Calculate totals
  const totals = (meals || []).reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories_consumed || meal.calories || 0),
    protein: acc.protein + (meal.protein_consumed || meal.protein || 0),
    carbs: acc.carbs + (meal.carbs_consumed || meal.carbs || 0),
    fat: acc.fat + (meal.fat_consumed || meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];
  const mealTypeIcons = {
    breakfast: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    lunch: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    ),
    dinner: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
      </svg>
    ),
    snack: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/>
      </svg>
    ),
    other: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  };

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
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111111',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', margin: 0, marginBottom: '8px' }}>
              Nutrition Log
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {formatDate(date)}
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '20px',
            }}
          >
            ×
          </motion.button>
        </div>

        {/* Daily Summary Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>Daily Summary</h3>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {meals?.length || 0} {(meals?.length || 0) === 1 ? 'meal' : 'meals'} logged
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#8B5CF6' }}>{Math.round(totals.calories)}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>calories</div>
            </div>
          </div>

          {/* Macro bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.15)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>{Math.round(totals.protein)}g</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Protein</div>
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.15)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>{Math.round(totals.carbs)}g</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Carbs</div>
            </div>
            <div style={{
              background: 'rgba(139, 92, 246, 0.15)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>{Math.round(totals.fat)}g</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fat</div>
            </div>
          </div>
        </div>

        {/* Meals by type */}
        {meals && meals.length > 0 ? (
          mealTypeOrder.filter(type => mealsByType[type]).map(type => (
            <div key={type} style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ color: '#8B5CF6' }}>{mealTypeIcons[type]}</div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                  textTransform: 'capitalize',
                  flex: 1,
                }}>
                  {type}
                </h4>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {mealsByType[type].reduce((sum, m) => sum + (m.calories_consumed || m.calories || 0), 0)} cal
                </div>
              </div>
              {mealsByType[type].map((meal, i) => (
                <motion.div
                  key={meal.id || i}
                  whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '500', color: '#FFFFFF', marginBottom: '4px' }}>
                        {meal.food_name || meal.name || 'Food item'}
                      </div>
                      {meal.serving_size && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          {meal.serving_size}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#8B5CF6' }}>
                        {Math.round(meal.calories_consumed || meal.calories || 0)}
                        <span style={{ fontSize: '12px', fontWeight: '400', color: 'rgba(255,255,255,0.5)', marginLeft: '2px' }}>cal</span>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: '4px',
                      }}>
                        {Math.round(meal.protein_consumed || meal.protein || 0)}g P · {Math.round(meal.carbs_consumed || meal.carbs || 0)}g C · {Math.round(meal.fat_consumed || meal.fat || 0)}g F
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No meals recorded for this day</div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Progress bar component
const ProgressBar = ({ label, current, target, unit = '', color = '#8B5CF6' }) => {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ fontSize: '13px', color }}>
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6 }}
          style={{ height: '100%', background: color, borderRadius: '4px' }}
        />
      </div>
    </div>
  );
};

// Loading spinner
const LoadingSpinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ width: '40px', height: '40px', border: '3px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8B5CF6', borderRadius: '50%' }}
    />
  </div>
);

// Empty state
const EmptyState = ({ message }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
  }}>
    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📊</div>
    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{message}</div>
  </div>
);

// Exercise icon component - returns an SVG icon
const ExerciseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0"/>
    <path d="M2.5 12h5M16.5 12h5"/>
    <path d="M4 12v-1.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1.5"/>
    <path d="M20 12v-1.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1.5"/>
    <path d="M7.5 12h9"/>
  </svg>
);

// Workout Detail Modal
const WorkoutDetailModal = ({ isOpen, onClose, date, workouts, onDelete }) => {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  if (!isOpen) return null;

  const handleDeleteClick = (workout) => {
    setDeleteConfirmId(workout.id);
  };

  const handleConfirmDelete = (workout) => {
    if (onDelete) {
      onDelete(workout);
      // If this was the only workout, close the modal
      if (workouts.length === 1) {
        onClose();
      }
    }
    setDeleteConfirmId(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getImageUrl = (photo) => {
    return photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`;
  };

  return (
    <>
    <AnimatePresence>
      {lightboxImage && (
        <ImageLightbox
          isOpen={!!lightboxImage}
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111111',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', margin: 0, marginBottom: '8px' }}>
              Workout Details
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {formatDate(date)}
            </p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '20px',
            }}
          >
            ×
          </motion.button>
        </div>

        {/* Workouts */}
        {workouts && workouts.length > 0 ? (
          workouts.map((workout, wIndex) => (
            <div key={workout.id || wIndex} style={{ marginBottom: '24px' }}>
              {/* Workout header */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                position: 'relative',
              }}>
                {/* Delete confirmation overlay */}
                {deleteConfirmId === workout.id && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.95)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    zIndex: 10,
                  }}>
                    <p style={{ color: '#FFFFFF', fontSize: '14px', margin: 0, textAlign: 'center' }}>
                      Delete this workout?
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleConfirmDelete(workout)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#EF4444',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '4px' }}>
                      {workout.workoutTitle || workout.name || workout.workoutType || 'Workout'}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                      {workout.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                          {workout.duration} min
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 4v16M18 4v16M6 12h12M3 8h6M15 8h6M3 16h6M15 16h6"/>
                        </svg>
                        {workout.exercises?.length || 0} exercises
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19h16M4 15h16M4 11h16M4 7h16"/>
                        </svg>
                        {workout.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0} sets
                      </span>
                    </div>
                  </div>
                  {/* Delete button */}
                  {onDelete && (
                    <button
                      onClick={() => handleDeleteClick(workout)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        color: '#EF4444',
                        fontSize: '12px',
                        fontWeight: '500',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Workout Notes */}
              {workout.notes && workout.notes.trim() && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M16 13H8"/>
                      <path d="M16 17H8"/>
                      <path d="M10 9H8"/>
                    </svg>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      Workout Notes
                    </h4>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.8)',
                    margin: 0,
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {workout.notes}
                  </p>
                </div>
              )}

              {/* Workout Photos */}
              {workout.photos && workout.photos.length > 0 && (
                <div style={{
                  marginBottom: '20px',
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', margin: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Workout Photos ({workout.photos.length})
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                  }}>
                    {workout.photos.map((photo, pIndex) => (
                      <motion.img
                        key={pIndex}
                        src={getImageUrl(photo)}
                        alt={`Workout photo ${pIndex + 1}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: pIndex * 0.1 }}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(getImageUrl(photo));
                        }}
                        whileHover={{ scale: 1.05 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises */}
              {workout.exercises && workout.exercises.map((exercise, eIndex) => {
                const exerciseImageUrl = getExerciseImageUrl(exercise.name, exercise.selectedEquipment || exercise.equipment);
                return (
                <motion.div
                  key={eIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: eIndex * 0.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '12px',
                  }}
                >
                  {/* Exercise header with image/icon */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    {/* Exercise image or icon */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {exerciseImageUrl ? (
                        <img
                          src={exerciseImageUrl}
                          alt={exercise.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <span style={{ display: exerciseImageUrl ? 'none' : 'flex', color: 'rgba(255,255,255,0.5)' }}>
                        <ExerciseIcon />
                      </span>
                    </div>

                    {/* Exercise info */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '6px' }}>
                        {exercise.name}
                      </h4>
                      {exercise.muscleGroup && (
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#8B5CF6',
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          marginBottom: '8px',
                        }}>
                          {exercise.muscleGroup}
                        </span>
                      )}
                      {exercise.notes && (
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <path d="M14 2v6h6"/>
                            <path d="M16 13H8"/>
                            <path d="M16 17H8"/>
                          </svg>
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sets table */}
                  {exercise.sets && exercise.sets.length > 0 && (
                    <div style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      {/* Table header */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span>Volume</span>
                      </div>

                      {/* Sets rows */}
                      {exercise.sets.map((set, sIndex) => {
                        const weight = parseFloat(set.weight) || 0;
                        const reps = parseInt(set.reps) || 0;
                        const volume = weight * reps;
                        const isPR = set.isPR || set.isPersonalRecord;
                        const hasComment = set.comment && set.comment.trim();

                        return (
                          <div key={sIndex}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '50px 1fr 1fr 1fr',
                                padding: '12px 16px',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '14px',
                                alignItems: 'center',
                                background: isPR ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                              }}
                            >
                              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{sIndex + 1}</span>
                              <span style={{ color: '#8B5CF6', fontWeight: '600' }}>
                                {weight > 0 ? `${weight} lbs` : '-'}
                              </span>
                              <span style={{ color: '#06B6D4', fontWeight: '600' }}>
                                {reps > 0 ? reps : '-'}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {volume > 0 ? volume.toLocaleString() : '-'}
                                {isPR && (
                                  <span style={{
                                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                                    color: '#FFFFFF',
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}>
                                    PR
                                  </span>
                                )}
                              </span>
                            </div>
                            {/* Set comment */}
                            {hasComment && (
                              <div style={{
                                padding: '8px 16px 12px',
                                paddingLeft: '66px',
                                background: isPR ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)',
                                borderTop: 'none',
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '6px',
                                  fontSize: '12px',
                                  color: 'rgba(255,255,255,0.6)',
                                  fontStyle: 'italic',
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                  <span>{set.comment}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Total row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr',
                        padding: '12px 16px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '13px',
                        background: 'rgba(139, 92, 246, 0.1)',
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Total</span>
                        <span></span>
                        <span style={{ color: '#06B6D4', fontWeight: '600' }}>
                          {exercise.sets.reduce((acc, s) => acc + (parseInt(s.reps) || 0), 0)} reps
                        </span>
                        <span style={{ color: '#8B5CF6', fontWeight: '600' }}>
                          {exercise.sets.reduce((acc, s) => acc + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0).toLocaleString()} lbs
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
              })}
            </div>
          ))
        ) : (
          <EmptyState message="No workout data available for this day" />
        )}
      </motion.div>
    </motion.div>
    </>
  );
};

// Workouts Section
const WorkoutsSection = ({ data, loading, isMobile = false, onDeleteWorkout }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  if (loading) return <LoadingSpinner />;

  const { workouts, workoutDates } = data || {};
  const workoutList = data?.workoutList || [];

  // Create workouts by date mapping (using extractLocalDate for timezone safety)
  const workoutsByDate = {};
  workoutList.forEach(workout => {
    const date = extractLocalDate(workout.date);
    if (date) {
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = [];
      }
      workoutsByDate[date].push(workout);
    }
  });

  const handleDayClick = (date, dayWorkouts) => {
    // If dayWorkouts wasn't passed, get from our mapping
    const workoutsForDay = dayWorkouts.length > 0 ? dayWorkouts : workoutsByDate[date] || [];
    setSelectedDate(date);
    setSelectedWorkouts(workoutsForDay);
    setShowModal(true);
  };

  const handleWorkoutClick = (workout) => {
    const date = extractLocalDate(workout.date);
    setSelectedDate(date);
    setSelectedWorkouts([workout]);
    setShowModal(true);
  };

  const handleDeleteFromModal = (workout) => {
    // Update local selectedWorkouts state
    setSelectedWorkouts(prev => prev.filter(w => w.id !== workout.id));
    // Call parent delete handler
    if (onDeleteWorkout) onDeleteWorkout(workout);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', width: '100%' }}>
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: isMobile ? '8px' : '20px' }}>Workout History</h2>

        {/* Stats - 2x2 grid on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '8px' : '12px' }}>
          <StatCard title="Total" value={workouts?.total || 0} subtitle="workouts" isMobile={isMobile} />
          <StatCard title="This Week" value={workouts?.thisWeek || 0} subtitle="workouts" color="#06B6D4" isMobile={isMobile} />
          <StatCard title="Streak" value={workouts?.currentStreak || 0} subtitle="days" color="#10B981" isMobile={isMobile} />
          <StatCard title="Best" value={workouts?.longestStreak || 0} subtitle="days" color="#F59E0B" isMobile={isMobile} />
        </div>

        {/* PRs - wrap on mobile */}
        {workouts?.prs && workouts.prs.length > 0 && (
          <div>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>Personal Records</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px',
            }}>
              {workouts.prs.slice(0, isMobile ? 6 : undefined).map((pr, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: isMobile ? '10px' : '12px',
                }}>
                  <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.name}</div>
                  <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#8B5CF6' }}>{pr.weight} lbs</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar - show on all devices */}
        <div>
          <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '10px' : '12px' }}>Workout Calendar</h3>
          <Calendar
            workoutDates={workoutDates || []}
            type="workout"
            onDayClick={handleDayClick}
            workoutsByDate={workoutsByDate}
          />
        </div>

        {/* Recent Workouts */}
        <div>
          <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>Recent Workouts</h3>
          <div style={{ maxHeight: isMobile ? 'none' : '400px', overflowY: isMobile ? 'visible' : 'auto' }}>
            {workoutList.length === 0 ? (
              <EmptyState message="No workouts recorded yet" />
            ) : (
              workoutList.slice(0, isMobile ? 10 : 15).map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => handleWorkoutClick(workout)}
                  onPhotoClick={(imageUrl) => setLightboxImage(imageUrl)}
                  onDelete={onDeleteWorkout}
                  isMobile={isMobile}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <WorkoutDetailModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            date={selectedDate}
            workouts={selectedWorkouts}
            onDelete={handleDeleteFromModal}
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox
            isOpen={!!lightboxImage}
            imageUrl={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Nutrition Section
const NutritionSection = ({ data, loading, isMobile = false }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week, etc.

  if (loading) return <LoadingSpinner />;

  const { nutrition, nutritionDates, goals } = data || {};
  const mealList = data?.mealList || [];

  // Create meals by date mapping
  const mealsByDate = {};
  mealList.forEach(meal => {
    const date = extractLocalDate(meal.date || meal.logged_at);
    if (date) {
      if (!mealsByDate[date]) {
        mealsByDate[date] = [];
      }
      mealsByDate[date].push(meal);
    }
  });

  const handleDayClick = (date, dayMeals) => {
    const mealsForDay = dayMeals.length > 0 ? dayMeals : mealsByDate[date] || [];
    setSelectedDate(date);
    setSelectedMeals(mealsForDay);
    setShowModal(true);
  };

  // Get 7 days data for chart based on weekOffset
  const chartData = [];
  const baseOffset = weekOffset * 7;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i - baseOffset);
    const dateStr = getLocalDateString(date);
    const dayData = nutrition?.byDate?.[dateStr] || { calories: 0 };
    chartData.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      calories: dayData.calories,
      protein: dayData.protein || 0,
    });
  }

  // Get date range for display
  const getWeekDateRange = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - baseOffset);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6 - baseOffset);
    const formatOpts = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', formatOpts)} - ${endDate.toLocaleDateString('en-US', formatOpts)}`;
  };

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', paddingBottom: '40px', width: '100%' }}>
      <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: isMobile ? '8px' : '20px' }}>Nutrition Tracking</h2>

      {/* Today's Stats - 2x2 grid on mobile, 3 on desktop (4th stat moves to sidebar) */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px' }}>
        <StatCard title="Today" value={nutrition?.todayCalories || 0} subtitle="calories" isMobile={isMobile} />
        <StatCard title="Protein" value={`${nutrition?.todayProtein || 0}g`} subtitle="today" color="#06B6D4" isMobile={isMobile} />
        <StatCard title="Streak" value={nutrition?.currentStreak || 0} subtitle="days" color="#10B981" isMobile={isMobile} />
        {isMobile && <StatCard title="Avg Cal" value={nutrition?.avgCalories || 0} subtitle="daily" color="#F59E0B" isMobile={isMobile} />}
      </div>

      {/* Two-column layout for desktop: main content + calendar sidebar */}
      <div style={{ display: 'flex', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', minWidth: 0 }}>
          {/* Macros Today */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '14px' : '20px',
          }}>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '12px' : '16px' }}>Today's Macros</h3>
            <ProgressBar label="Calories" current={nutrition?.todayCalories || 0} target={goals?.targetCalories || 2000} unit="" color="#8B5CF6" />
            <ProgressBar label="Protein" current={nutrition?.todayProtein || 0} target={goals?.proteinGrams || 150} unit="g" color="#06B6D4" />
            <ProgressBar label="Carbs" current={nutrition?.todayCarbs || 0} target={goals?.carbsGrams || 200} unit="g" color="#10B981" />
            <ProgressBar label="Fat" current={nutrition?.todayFat || 0} target={goals?.fatGrams || 65} unit="g" color="#F59E0B" />
          </div>

          {/* Weekly Chart */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '14px' : '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                  {weekOffset === 0 ? 'Last 7 Days' : 'Weekly History'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <motion.button
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    whileHover={{ background: 'rgba(139, 92, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </motion.button>
                  <span style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.5)', minWidth: isMobile ? '100px' : '120px', textAlign: 'center' }}>
                    {getWeekDateRange()}
                  </span>
                  <motion.button
                    onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                    whileHover={{ background: weekOffset > 0 ? 'rgba(139, 92, 246, 0.2)' : 'transparent' }}
                    whileTap={{ scale: weekOffset > 0 ? 0.95 : 1 }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: weekOffset > 0 ? 'pointer' : 'not-allowed',
                      color: weekOffset > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </motion.button>
                </div>
              </div>
              <div style={{
                fontSize: isMobile ? '11px' : '13px',
                color: 'rgba(255,255,255,0.5)',
              }}>
                Goal: <span style={{ color: '#8B5CF6', fontWeight: '600' }}>{goals?.targetCalories || 2000}</span> cal/day
              </div>
            </div>
            <BarChart data={chartData} dataKey="calories" color="#8B5CF6" height={isMobile ? 140 : 160} target={goals?.targetCalories || 2000} />
          </div>

          {/* Daily Averages - show on mobile as compact cards */}
          {isMobile && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px',
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>Daily Averages</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Calories</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#8B5CF6' }}>{nutrition?.avgCalories || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Protein</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#06B6D4' }}>{nutrition?.avgProtein || 0}g</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Carbs</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#10B981' }}>{nutrition?.avgCarbs || 0}g</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Fat</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#F59E0B' }}>{nutrition?.avgFat || 0}g</div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar - show on mobile */}
          {isMobile && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>Nutrition Calendar</h3>
              <Calendar
                nutritionDates={nutritionDates || []}
                type="nutrition"
                onDayClick={handleDayClick}
                mealsByDate={mealsByDate}
              />
            </div>
          )}

          {/* Recent Meals */}
          <div>
            <h3 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '8px' : '12px' }}>Recent Meals</h3>
            <div style={{ maxHeight: isMobile ? 'none' : '300px', overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? '0' : '8px' }}>
              {mealList.length === 0 ? (
                <EmptyState message="No meals logged yet" />
              ) : (
                mealList.slice(0, isMobile ? 10 : 20).map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Calendar Sidebar - only show on desktop */}
        {!isMobile && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Nutrition Calendar</h3>
            <Calendar
              nutritionDates={nutritionDates || []}
              type="nutrition"
              onDayClick={handleDayClick}
              mealsByDate={mealsByDate}
            />

            {/* Averages */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '16px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>Daily Averages</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Calories</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#8B5CF6' }}>{nutrition?.avgCalories || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Protein</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#06B6D4' }}>{nutrition?.avgProtein || 0}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Carbs</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#10B981' }}>{nutrition?.avgCarbs || 0}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Fat</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#F59E0B' }}>{nutrition?.avgFat || 0}g</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Meal Detail Modal */}
    <AnimatePresence>
      {showModal && (
        <MealDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          date={selectedDate}
          meals={selectedMeals}
        />
      )}
    </AnimatePresence>
    </>
  );
};

// Progress Section
const ProgressSection = ({ data, loading, isMobile = false }) => {
  if (loading) return <LoadingSpinner />;

  const { achievements, workouts, profile, exerciseProgress } = data || {};
  const achievementList = achievements || [];

  // Default achievements if none exist
  const defaultAchievements = [
    { id: 'first_workout', name: 'First Workout', description: 'Complete your first workout', icon: '🏋️' },
    { id: 'week_warrior', name: 'Week Warrior', description: '7 day workout streak', icon: '🔥' },
    { id: 'century_club', name: 'Century Club', description: 'Lift 100+ lbs', icon: '💯' },
    { id: 'early_bird', name: 'Early Bird', description: 'Workout before 7 AM', icon: '🌅' },
    { id: 'consistency', name: 'Consistency', description: '30 day streak', icon: '📆' },
    { id: 'pr_crusher', name: 'PR Crusher', description: 'Set 10 personal records', icon: '🏆' },
  ];

  const displayAchievements = achievementList.length > 0 ? achievementList : defaultAchievements;
  const unlockedIds = new Set(achievementList.map(a => a.id));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: isMobile ? '4px' : '20px' }}>Your Progress</h2>

      {/* Overview Stats - 2x2 on mobile, then extra row */}
      {isMobile ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <StatCard title="Total" value={workouts?.total || 0} subtitle="workouts" isMobile={true} />
            <StatCard title="Streak" value={workouts?.currentStreak || 0} subtitle="days" color="#10B981" isMobile={true} />
            <StatCard title="Best" value={workouts?.longestStreak || 0} subtitle="days" color="#F59E0B" isMobile={true} />
            <StatCard title="Month" value={workouts?.thisMonth || 0} subtitle="workouts" color="#06B6D4" isMobile={true} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StatCard title="Badges" value={achievementList.length} subtitle="earned" color="#EC4899" isMobile={true} />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <StatCard title="Total Workouts" value={workouts?.total || 0} subtitle="completed" />
          <StatCard title="Current Streak" value={workouts?.currentStreak || 0} subtitle="days" color="#10B981" />
          <StatCard title="Best Streak" value={workouts?.longestStreak || 0} subtitle="days" color="#F59E0B" />
          <StatCard title="This Month" value={workouts?.thisMonth || 0} subtitle="workouts" color="#06B6D4" />
          <StatCard title="Badges" value={achievementList.length} subtitle="earned" color="#EC4899" />
        </div>
      )}

      {/* Achievements Grid - wrap on mobile */}
      <div>
        <h3 style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '10px' : '16px' }}>Achievements & Badges</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: isMobile ? '8px' : '12px',
        }}>
          {displayAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={achievementList.length > 0 ? unlockedIds.has(achievement.id) || achievement.unlocked : false}
            />
          ))}
        </div>
      </div>

      {/* Exercise Progress Chart */}
      <div>
        <h3 style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '10px' : '16px' }}>Exercise Progress</h3>
        <ExerciseProgressCharts exerciseProgress={exerciseProgress} workouts={workouts?.list || []} isMobile={isMobile} />
      </div>
    </div>
  );
};

// Goals Section
const GoalsSection = ({ data, loading, isMobile = false }) => {
  if (loading) return <LoadingSpinner />;

  const { goals, nutrition, workouts } = data || {};

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: isMobile ? '4px' : '20px' }}>Your Goals</h2>

      {/* Nutrition Goals */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '14px' : '24px',
      }}>
        <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: isMobile ? '12px' : '20px' }}>Nutrition Goals</h3>
        <ProgressBar label="Calories" current={nutrition?.todayCalories || 0} target={goals?.targetCalories || 2000} unit="" color="#8B5CF6" />
        <ProgressBar label="Protein" current={nutrition?.todayProtein || 0} target={goals?.proteinGrams || 150} unit="g" color="#06B6D4" />
        <ProgressBar label="Carbs" current={nutrition?.todayCarbs || 0} target={goals?.carbsGrams || 200} unit="g" color="#10B981" />
        <ProgressBar label="Fat" current={nutrition?.todayFat || 0} target={goals?.fatGrams || 65} unit="g" color="#F59E0B" />

        <div style={{ marginTop: isMobile ? '12px' : '20px', paddingTop: isMobile ? '12px' : '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '8px' : '16px' }}>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Logging Streak</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#10B981' }}>{nutrition?.currentStreak || 0} days</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Best Streak</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#F59E0B' }}>{nutrition?.longestStreak || 0} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Goals */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '14px' : '24px',
      }}>
        <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: isMobile ? '12px' : '20px' }}>Workout Goals</h3>

        <div style={{ marginBottom: isMobile ? '12px' : '20px' }}>
          <ProgressBar label="Weekly Goal" current={workouts?.thisWeek || 0} target={4} unit=" workouts" color="#8B5CF6" />
          <ProgressBar label="Monthly Goal" current={workouts?.thisMonth || 0} target={16} unit=" workouts" color="#06B6D4" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? '8px' : '16px' }}>
          <div>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Current Streak</div>
            <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#10B981' }}>{workouts?.currentStreak || 0} days</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Best Streak</div>
            <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#F59E0B' }}>{workouts?.longestStreak || 0} days</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Total Workouts</div>
            <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#8B5CF6' }}>{workouts?.total || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>This Week</div>
            <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#06B6D4' }}>{workouts?.thisWeek || 0}</div>
          </div>
        </div>
      </div>

      {/* Goal Summary - Daily Targets */}
      {goals && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '14px' : '24px',
        }}>
          <h3 style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: '600', color: '#8B5CF6', marginBottom: isMobile ? '10px' : '16px' }}>Daily Targets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '20px' }}>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Calories</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.targetCalories || 2000}</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Protein</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.proteinGrams || 150}g</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Carbs</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.carbsGrams || 200}g</div>
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Fat</div>
              <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.fatGrams || 65}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import Section
const ImportSection = ({ user, onImportSuccess, isMobile = false }) => {
  const [importedItems, setImportedItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleImport = async (result) => {
    console.log('Imported content:', result);
    setSaveError('');
    setSaving(true);

    try {
      // Determine type
      const isRecipe = result.type === 'recipe' || result.ingredients || result.data?.ingredients;
      const isWorkout = result.type === 'workout' || result.exercises || result.data?.exercises;
      const data = result.data || result;

      let saveResult;

      if (isRecipe) {
        // Save recipe to Firebase
        saveResult = await WebDataService.saveRecipe(user?.uid, {
          name: data.name || data.title || 'Imported Recipe',
          description: data.description || '',
          servings: data.servings || 1,
          prepTime: data.prepTime || '',
          cookTime: data.cookTime || '',
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          nutrition: data.nutrition || {},
        });
      } else if (isWorkout) {
        // Check if it's a multi-day program or single workout
        const hasMultipleDays = data.days && data.days.length > 1;
        const rawExercises = data.exercises || (data.days?.[0]?.exercises) || [];

        // Format exercises to match app's expected structure
        // CRITICAL: Preserve libraryId for linking to database exercises with history
        const formatExercises = (exercises) => {
          return exercises.map((ex, idx) => ({
            // CRITICAL: Preserve library link for exercise history
            id: ex.id || `exercise_${Date.now()}_${idx}`,
            libraryId: ex.libraryId || ex.id || null, // Link to database exercise
            name: ex.name || 'Unknown Exercise',
            displayName: ex.displayName || ex.name || 'Unknown Exercise',
            targetMuscle: ex.targetMuscle || ex.muscleGroup || (ex.primaryMuscles?.[0]) || '',
            equipment: ex.equipment || ex.selectedEquipment || ex.weight || 'Not specified',
            selectedEquipment: ex.selectedEquipment || ex.equipment || null,
            difficulty: ex.difficulty || 'Intermediate',
            notes: ex.notes || '',
            // Preserve muscle data for display
            primaryMuscles: ex.primaryMuscles || [],
            secondaryMuscles: ex.secondaryMuscles || [],
            muscleGroup: ex.muscleGroup || '',
            // Preserve variant data
            variants: ex.variants || [],
            selectedVariant: ex.selectedVariant || null,
            // Track if matched from library
            isMatched: ex.isMatched || !!ex.libraryId,
            isCustom: ex.isCustom || false,
            // Create sets array - AI usually returns sets as number or array
            sets: Array.isArray(ex.sets)
              ? ex.sets.map(s => ({
                  reps: String(s.reps || s || '10'),
                  weight: s.weight || ex.weight || '',
                  type: 'normal',
                  rest: '90',
                }))
              : Array.from({ length: ex.sets || 3 }, () => ({
                  reps: String(ex.reps || '10'),
                  weight: ex.weight || '',
                  type: 'normal',
                  rest: '90',
                })),
          }));
        };

        const exercises = formatExercises(rawExercises);

        if (hasMultipleDays) {
          // Format each day's exercises
          const formattedDays = data.days.map((day, idx) => ({
            name: day.name || `Day ${idx + 1}`,
            exercises: formatExercises(day.exercises || []),
            muscleGroups: day.muscleGroups || [],
          }));

          // Save as workout program
          saveResult = await WebDataService.saveWorkoutProgram(user?.uid, {
            name: data.name || 'Imported Program',
            description: data.description || '',
            days: formattedDays,
            difficulty: data.difficulty || 'intermediate',
            daysPerWeek: formattedDays.length,
          });
        } else {
          // Save as standalone workout
          saveResult = await WebDataService.saveStandaloneWorkout(user?.uid, {
            name: data.name || 'Imported Workout',
            description: data.description || '',
            exercises: exercises,
            muscleGroups: data.muscleGroups || [],
            difficulty: data.difficulty || 'intermediate',
          });
        }
      }

      if (saveResult?.success) {
        const item = {
          id: saveResult.id,
          type: isRecipe ? 'recipe' : 'workout',
          data: data,
          importedAt: new Date().toISOString(),
        };

        setImportedItems(prev => [item, ...prev]);
        setSuccessMessage(saveResult.message || `${isRecipe ? 'Recipe' : 'Workout'} saved to your app!`);

        if (onImportSuccess) {
          onImportSuccess(item);
        }
      } else {
        setSaveError(saveResult?.message || 'Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      setSaveError(error.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: isMobile ? '4px' : '20px' }}>
        Import Content
      </h2>

      <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'rgba(255,255,255,0.6)' }}>
        {isMobile ? 'Import recipes and workouts from screenshots.' : 'Import recipes and workouts from screenshots. Simply drag & drop an image, paste from clipboard (Ctrl+V), or enter an image URL.'}
      </p>

      {/* Success message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: isMobile ? '12px' : '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: isMobile ? '14px' : '18px' }}>✓</span>
            {successMessage}
            {!isMobile && (
              <span style={{ fontSize: '12px', marginLeft: 'auto', opacity: 0.8 }}>
                Syncs to your app automatically!
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: isMobile ? '10px 12px' : '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: isMobile ? '12px' : '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: isMobile ? '14px' : '18px' }}>✕</span>
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot Importer */}
      <ScreenshotImporter onImport={handleImport} isMobile={isMobile} />

      {/* Recently imported items */}
      {importedItems.length > 0 && (
        <div>
          <h3 style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: isMobile ? '10px' : '16px' }}>
            Recently Imported
          </h3>
          <div style={{ display: 'grid', gap: isMobile ? '8px' : '12px' }}>
            {importedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: isMobile ? '10px' : '12px',
                  padding: isMobile ? '12px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '10px' : '12px',
                }}
              >
                <div style={{
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: isMobile ? '10px' : '12px',
                  background: item.type === 'recipe'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '18px' : '24px',
                  flexShrink: 0,
                }}>
                  {item.type === 'recipe' ? '🍳' : '💪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.data.name || item.data.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {item.type === 'recipe' ? (
                      <>
                        {item.data.ingredients?.length || 0} ingredients •
                        {item.data.nutrition?.calories || '?'} cal
                      </>
                    ) : (
                      <>
                        {item.data.exercises?.length || 0} exercises •
                        {item.data.muscleGroups?.join(', ') || 'Various'}
                      </>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: isMobile ? '3px 8px' : '4px 10px',
                  borderRadius: '20px',
                  background: item.type === 'recipe' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  color: item.type === 'recipe' ? '#10B981' : '#8B5CF6',
                  fontSize: isMobile ? '9px' : '11px',
                  fontWeight: '600',
                  flexShrink: 0,
                  textTransform: 'uppercase',
                }}>
                  {item.type}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions - simplified on mobile */}
      <div style={{
        padding: isMobile ? '14px' : '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: isMobile ? '10px' : '12px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h4 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: isMobile ? '10px' : '12px' }}>
          How it works
        </h4>
        <div style={{ display: 'grid', gap: isMobile ? '8px' : '12px' }}>
          {(isMobile ? [
            { icon: '📸', text: 'Screenshot a recipe or workout' },
            { icon: '📥', text: 'Upload or paste the image' },
            { icon: '🤖', text: 'AI extracts the content' },
            { icon: '✨', text: 'Add to your collection' },
          ] : [
            { icon: '📸', text: 'Take a screenshot of a recipe or workout from any app or website' },
            { icon: '📥', text: 'Drag & drop the image, paste with Ctrl+V, or enter the URL' },
            { icon: '🤖', text: 'AI analyzes the image and extracts the content' },
            { icon: '✨', text: 'Review and add to your collection in the app' },
          ]).map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>{step.icon}</span>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'rgba(255,255,255,0.6)' }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function WebDashboard({ user, onSignOut, onGoHome }) {
  const [activeTab, setActiveTab] = useState('workouts');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isMobile = useIsMobile();

  // Close menu when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return;

    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    if (!user?.uid) {
      setSyncStatus('No user logged in');
      return;
    }
    setLoading(true);
    setSyncStatus('Fetching data...');
    try {
      const [stats, workoutList, mealList, exerciseProgress] = await Promise.all([
        WebDataService.getComprehensiveStats(user.uid),
        WebDataService.getWorkouts(user.uid, 50),
        WebDataService.getMeals(user.uid, 100),
        WebDataService.getExerciseProgress(user.uid),
      ]);
      setData({ ...stats, workoutList, mealList, exerciseProgress });
      setSyncStatus(`Synced! Found ${workoutList.length} workouts, ${mealList.length} meals`);
      // Clear status after 3 seconds
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setSyncStatus(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const handleDeleteWorkout = async (workout) => {
    if (!user?.uid || !workout?.id) return;

    try {
      setSyncStatus('Deleting workout...');
      const success = await WebDataService.deleteWorkout(user.uid, workout.id);
      if (success) {
        // Remove from local state immediately for better UX
        setData(prev => ({
          ...prev,
          workoutList: prev.workoutList.filter(w => w.id !== workout.id),
          workouts: {
            ...prev.workouts,
            total: Math.max(0, (prev.workouts?.total || 0) - 1),
          }
        }));
        setSyncStatus('Workout deleted');
        setTimeout(() => setSyncStatus(''), 2000);
      } else {
        setSyncStatus('Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      setSyncStatus(`Error: ${error.message}`);
    }
  };

  if (Platform.OS !== 'web') return null;

  // Mobile Layout
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#FFFFFF',
        fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Mobile Header */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="mobileWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="15" stroke="url(#mobileWaveGradient)" strokeWidth="2" fill="none" />
              <path d="M6 16 Q10 10, 14 16 T22 16 T26 16" stroke="url(#mobileWaveGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#8B5CF6',
                fontSize: '11px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '...' : 'Sync'}
            </button>
            <button
              onClick={onSignOut}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: '#EF4444',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Content */}
        <main style={{
          flex: 1,
          padding: '56px 12px 72px',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}>
          {activeTab === 'workouts' && <WorkoutsSection data={data} loading={loading} isMobile={true} onDeleteWorkout={handleDeleteWorkout} />}
          {activeTab === 'nutrition' && <NutritionSection data={data} loading={loading} isMobile={true} />}
          {activeTab === 'progress' && <ProgressSection data={data} loading={loading} isMobile={true} />}
          {activeTab === 'goals' && <GoalsSection data={data} loading={loading} isMobile={true} />}
          {activeTab === 'import' && <ImportSection user={user} onImportSuccess={(item) => console.log('Import success:', item)} isMobile={true} />}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 12px',
          zIndex: 100,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#8B5CF6' : 'rgba(255,255,255,0.5)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span style={{ fontSize: '10px', fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile styles */}
        <style>{`
          html, body, #root {
            background: #000000 !important;
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          * { box-sizing: border-box; }
        `}</style>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#FFFFFF',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <motion.div
          onClick={onGoHome}
          whileHover={{ opacity: 0.8, cursor: 'pointer' }}
          whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="dashboardWaveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="15" stroke="url(#dashboardWaveGradient)" strokeWidth="2" fill="none" />
            <path d="M6 16 Q10 10, 14 16 T22 16 T26 16" stroke="url(#dashboardWaveGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>Workout Wave</span>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sync status message */}
          {syncStatus && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: syncStatus.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: syncStatus.includes('Error') ? '#EF4444' : '#10B981',
                fontSize: '12px',
                fontWeight: '500',
              }}
            >
              {syncStatus}
            </motion.div>
          )}
          {/* Refresh button */}
          <motion.button
            onClick={loadData}
            disabled={loading}
            whileHover={{ background: 'rgba(139, 92, 246, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#8B5CF6',
              fontSize: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <motion.svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={loading ? { rotate: 360 } : {}}
              transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
            >
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
            </motion.svg>
            {loading ? 'Syncing...' : 'Sync'}
          </motion.button>
          {/* Profile dropdown */}
          <div style={{ position: 'relative' }}>
            <motion.div
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              whileHover={{ opacity: 0.8 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                background: showProfileMenu ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid rgba(139, 92, 246, 0.5)', objectFit: 'cover' }}
                />
              ) : null}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                display: user?.photoURL ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#FFFFFF'
              }}>
                {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: '500' }}>{user?.displayName || user?.email?.split('@')[0]}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
                style={{
                  transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    minWidth: '160px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sign Out option */}
                  <motion.button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut();
                    }}
                    whileHover={{ background: 'rgba(239, 68, 68, 0.2)' }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#EF4444',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', paddingTop: '53px', minHeight: '100vh', background: '#000000', width: '100%' }}>
        {/* Sidebar */}
        <nav style={{
          width: '200px',
          minWidth: '200px',
          padding: '20px 12px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          position: 'fixed',
          top: '53px',
          bottom: 0,
          left: 0,
          background: '#050505',
          overflowY: 'auto',
        }}>
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ x: 4 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                marginBottom: '6px',
                background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.id ? '#8B5CF6' : 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </motion.button>
          ))}
        </nav>

        {/* Content */}
        <main style={{
          flex: 1,
          marginLeft: '200px',
          padding: '24px 32px',
          background: '#000000',
          height: 'calc(100vh - 53px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: 'calc(100vw - 200px)',
          maxWidth: 'calc(100vw - 200px)',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ width: '100%' }}
            >
              {activeTab === 'workouts' && <WorkoutsSection data={data} loading={loading} onDeleteWorkout={handleDeleteWorkout} />}
              {activeTab === 'nutrition' && <NutritionSection data={data} loading={loading} />}
              {activeTab === 'progress' && <ProgressSection data={data} loading={loading} />}
              {activeTab === 'goals' && <GoalsSection data={data} loading={loading} />}
              {activeTab === 'import' && <ImportSection user={user} onImportSuccess={(item) => console.log('Import success:', item)} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global styles */}
      <style>{`
        html, body, #root {
          background: #000000 !important;
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.4); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.6); }
      `}</style>
    </div>
  );
}
