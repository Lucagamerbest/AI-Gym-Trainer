import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import WebDataService from '../services/WebDataService';
import ScreenshotImporter from './ScreenshotImporter';

// Helper to get local date string
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

// Tab navigation items
const TABS = [
  { id: 'workouts', label: 'Workouts', icon: 'M4 6h16M4 12h16M4 18h16' },
  { id: 'nutrition', label: 'Nutrition', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { id: 'progress', label: 'Progress', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'goals', label: 'Goals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'import', label: 'Import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
];

// Stat card component
const StatCard = ({ title, value, subtitle, color = '#8B5CF6', icon }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px',
      flex: 1,
      minWidth: '120px',
    }}
  >
    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
      {title}
    </div>
    <div style={{ fontSize: '28px', fontWeight: '700', color, marginBottom: '4px' }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        {subtitle}
      </div>
    )}
  </motion.div>
);

// Calendar component
const Calendar = ({ workoutDates = [], nutritionDates = [], type = 'workout', onDayClick, workoutsByDate = {} }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dates = type === 'workout' ? workoutDates : nutritionDates;
  // Dates should already be in YYYY-MM-DD format from WebDataService, don't re-process
  const dateSet = new Set(dates.filter(Boolean));

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
      onDayClick(dateStr, workoutsByDate[dateStr] || []);
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
      {type === 'workout' && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click on highlighted days to view workout details
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

// Simple bar chart component
const BarChart = ({ data, dataKey, color = '#8B5CF6', height = 150, showLabels = true }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0), 1);

  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: '6px', paddingTop: '20px' }}>
      {data.map((item, index) => {
        const value = item[dataKey] || 0;
        const heightPercent = (value / maxValue) * 100;

        return (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {showLabels && value > 0 && (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                {value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              </div>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(heightPercent, value > 0 ? 5 : 0)}%` }}
              transition={{ delay: index * 0.03, duration: 0.4 }}
              style={{
                width: '100%',
                maxWidth: '50px',
                background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
                borderRadius: '4px 4px 0 0',
              }}
            />
            {showLabels && (
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                {item.label || item.date?.slice(5) || ''}
              </div>
            )}
          </div>
        );
      })}
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
const WorkoutCard = ({ workout }) => {
  const exerciseCount = workout.exercises?.length || 0;
  const setCount = workout.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0;
  // Get exercise names (limit to first 3 for display)
  const exerciseNames = workout.exercises?.slice(0, 3).map(ex => ex.name).filter(Boolean) || [];
  const moreCount = exerciseCount > 3 ? exerciseCount - 3 : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '2px' }}>
            {workout.workoutTitle || workout.name || workout.workoutType || 'Workout'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {formatDateForDisplay(workout.date)}
          </div>
        </div>
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
      </div>
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

// Exercise image mapping (common exercises)
const getExerciseImage = (exerciseName) => {
  const name = exerciseName?.toLowerCase() || '';

  // Map common exercises to placeholder images or icons
  const exerciseIcons = {
    'bench press': '🏋️',
    'squat': '🦵',
    'deadlift': '💪',
    'overhead press': '🙆',
    'barbell row': '🚣',
    'pull up': '🧗',
    'pullup': '🧗',
    'chin up': '🧗',
    'lat pulldown': '⬇️',
    'bicep curl': '💪',
    'tricep': '💪',
    'leg press': '🦵',
    'lunge': '🚶',
    'calf raise': '🦶',
    'shoulder': '🙆',
    'chest fly': '🦅',
    'dumbbell': '🏋️',
    'cable': '🔗',
    'machine': '⚙️',
    'plank': '📏',
    'crunch': '🔄',
    'sit up': '🔄',
  };

  for (const [key, icon] of Object.entries(exerciseIcons)) {
    if (name.includes(key)) return icon;
  }
  return '🏋️'; // Default
};

// Workout Detail Modal
const WorkoutDetailModal = ({ isOpen, onClose, date, workouts }) => {
  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '4px' }}>
                      {workout.workoutTitle || workout.name || workout.workoutType || 'Workout'}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                      {workout.duration && <span>⏱️ {workout.duration} min</span>}
                      <span>💪 {workout.exercises?.length || 0} exercises</span>
                      <span>📊 {workout.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0} sets</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exercises */}
              {workout.exercises && workout.exercises.map((exercise, eIndex) => (
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
                      {exercise.imageUrl ? (
                        <img
                          src={exercise.imageUrl}
                          alt={exercise.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <span style={{ display: exercise.imageUrl ? 'none' : 'flex' }}>
                        {getExerciseImage(exercise.name)}
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
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, marginTop: '4px' }}>
                          📝 {exercise.notes}
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

                        return (
                          <div
                            key={sIndex}
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
              ))}
            </div>
          ))
        ) : (
          <EmptyState message="No workout data available for this day" />
        )}
      </motion.div>
    </motion.div>
  );
};

// Workouts Section
const WorkoutsSection = ({ data, loading }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', width: '100%' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>Workout History</h2>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <StatCard title="Total" value={workouts?.total || 0} subtitle="workouts" />
            <StatCard title="This Week" value={workouts?.thisWeek || 0} subtitle="workouts" color="#06B6D4" />
            <StatCard title="Streak" value={workouts?.currentStreak || 0} subtitle="days" color="#10B981" />
            <StatCard title="Best Streak" value={workouts?.longestStreak || 0} subtitle="days" color="#F59E0B" />
          </div>

          {/* PRs */}
          {workouts?.prs && workouts.prs.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Personal Records</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {workouts.prs.map((pr, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{pr.name}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#8B5CF6' }}>{pr.weight} lbs</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workouts */}
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Recent Workouts</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {workoutList.length === 0 ? (
              <EmptyState message="No workouts recorded yet" />
            ) : (
              workoutList.slice(0, 15).map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))
            )}
          </div>
        </div>

        {/* Calendar Sidebar */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Workout Calendar</h3>
          <Calendar
            workoutDates={workoutDates || []}
            type="workout"
            onDayClick={handleDayClick}
            workoutsByDate={workoutsByDate}
          />
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Nutrition Section
const NutritionSection = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const { nutrition, nutritionDates, goals } = data || {};
  const mealList = data?.mealList || [];

  // Get last 7 days data for chart
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getLocalDateString(date);
    const dayData = nutrition?.byDate?.[dateStr] || { calories: 0 };
    chartData.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: dayData.calories,
      protein: dayData.protein || 0,
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', paddingBottom: '40px', width: '100%' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>Nutrition Tracking</h2>

        {/* Today's Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <StatCard title="Today" value={nutrition?.todayCalories || 0} subtitle="calories" />
          <StatCard title="Protein" value={`${nutrition?.todayProtein || 0}g`} subtitle="today" color="#06B6D4" />
          <StatCard title="Streak" value={nutrition?.currentStreak || 0} subtitle="days" color="#10B981" />
          <StatCard title="Avg Cal" value={nutrition?.avgCalories || 0} subtitle="daily" color="#F59E0B" />
        </div>

        {/* Macros Today */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>Today's Macros</h3>
          <ProgressBar label="Calories" current={nutrition?.todayCalories || 0} target={goals?.targetCalories || 2000} unit="" color="#8B5CF6" />
          <ProgressBar label="Protein" current={nutrition?.todayProtein || 0} target={goals?.proteinGrams || 150} unit="g" color="#06B6D4" />
          <ProgressBar label="Carbs" current={nutrition?.todayCarbs || 0} target={goals?.carbsGrams || 200} unit="g" color="#10B981" />
          <ProgressBar label="Fat" current={nutrition?.todayFat || 0} target={goals?.fatGrams || 65} unit="g" color="#F59E0B" />
        </div>

        {/* Weekly Chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>Last 7 Days - Calories</h3>
          <BarChart data={chartData} dataKey="calories" color="#8B5CF6" height={120} />
        </div>

        {/* Recent Meals */}
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Recent Meals</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
          {mealList.length === 0 ? (
            <EmptyState message="No meals logged yet" />
          ) : (
            mealList.slice(0, 20).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))
          )}
        </div>
      </div>

      {/* Calendar Sidebar */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>Nutrition Calendar</h3>
        <Calendar nutritionDates={nutritionDates || []} type="nutrition" />

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
    </div>
  );
};

// Progress Section
const ProgressSection = ({ data, loading }) => {
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
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>Your Progress</h2>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard title="Total Workouts" value={workouts?.total || 0} subtitle="completed" />
        <StatCard title="Current Streak" value={workouts?.currentStreak || 0} subtitle="days" color="#10B981" />
        <StatCard title="Best Streak" value={workouts?.longestStreak || 0} subtitle="days" color="#F59E0B" />
        <StatCard title="This Month" value={workouts?.thisMonth || 0} subtitle="workouts" color="#06B6D4" />
        <StatCard title="Badges" value={achievementList.length} subtitle="earned" color="#EC4899" />
      </div>

      {/* Achievements Grid */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>Achievements & Badges</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {displayAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            unlocked={achievementList.length > 0 ? unlockedIds.has(achievement.id) || achievement.unlocked : false}
          />
        ))}
      </div>

      {/* Exercise Progress */}
      {exerciseProgress && Object.keys(exerciseProgress).length > 0 && (
        <>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>Exercise Progress</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {Object.values(exerciseProgress).slice(0, 8).map((exercise) => (
              <div key={exercise.name} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>
                  {exercise.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Max Weight</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#8B5CF6' }}>{exercise.maxWeight} lbs</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Volume</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#06B6D4' }}>{(exercise.totalVolume / 1000).toFixed(1)}k</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Goals Section
const GoalsSection = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const { goals, nutrition, workouts } = data || {};

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>Your Goals</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Nutrition Goals */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>Nutrition Goals</h3>
          <ProgressBar label="Calories" current={nutrition?.todayCalories || 0} target={goals?.targetCalories || 2000} unit="" color="#8B5CF6" />
          <ProgressBar label="Protein" current={nutrition?.todayProtein || 0} target={goals?.proteinGrams || 150} unit="g" color="#06B6D4" />
          <ProgressBar label="Carbs" current={nutrition?.todayCarbs || 0} target={goals?.carbsGrams || 200} unit="g" color="#10B981" />
          <ProgressBar label="Fat" current={nutrition?.todayFat || 0} target={goals?.fatGrams || 65} unit="g" color="#F59E0B" />

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Logging Streak</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>{nutrition?.currentStreak || 0} days</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Best Streak</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>{nutrition?.longestStreak || 0} days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout Goals */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>Workout Goals</h3>

          <div style={{ marginBottom: '20px' }}>
            <ProgressBar label="Weekly Goal" current={workouts?.thisWeek || 0} target={4} unit=" workouts" color="#8B5CF6" />
            <ProgressBar label="Monthly Goal" current={workouts?.thisMonth || 0} target={16} unit=" workouts" color="#06B6D4" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Current Streak</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>{workouts?.currentStreak || 0} days</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Best Streak</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#F59E0B' }}>{workouts?.longestStreak || 0} days</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Total Workouts</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#8B5CF6' }}>{workouts?.total || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>This Week</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#06B6D4' }}>{workouts?.thisWeek || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Summary */}
      {goals && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#8B5CF6', marginBottom: '16px' }}>Daily Targets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Calories</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.targetCalories || 2000}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Protein</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.proteinGrams || 150}g</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Carbs</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.carbsGrams || 200}g</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Fat</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{goals.fatGrams || 65}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import Section
const ImportSection = ({ user, onImportSuccess }) => {
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
        const formatExercises = (exercises) => {
          return exercises.map(ex => ({
            name: ex.name || 'Unknown Exercise',
            targetMuscle: ex.targetMuscle || ex.muscleGroup || '',
            equipment: ex.equipment || ex.weight || 'Not specified',
            difficulty: ex.difficulty || 'Intermediate',
            notes: ex.notes || '',
            // Create sets array - AI usually returns sets as number or array
            sets: Array.isArray(ex.sets)
              ? ex.sets.map(s => ({
                  reps: String(s.reps || s || '10'),
                  weight: s.weight || '',
                  type: 'normal',
                  rest: '90',
                }))
              : Array.from({ length: ex.sets || 3 }, () => ({
                  reps: String(ex.reps || '10'),
                  weight: '',
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
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>
        Import Content
      </h2>

      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
        Import recipes and workouts from screenshots. Simply drag & drop an image, paste from clipboard (Ctrl+V), or enter an image URL.
      </p>

      {/* Success message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              fontSize: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>✓</span>
            {successMessage}
            <span style={{ fontSize: '12px', marginLeft: 'auto', opacity: 0.8 }}>
              Syncs to your app automatically!
            </span>
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
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>✕</span>
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot Importer */}
      <ScreenshotImporter onImport={handleImport} />

      {/* Recently imported items */}
      {importedItems.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            Recently Imported
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {importedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: item.type === 'recipe'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}>
                  {item.type === 'recipe' ? '🍳' : '💪'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>
                    {item.data.name || item.data.title || 'Untitled'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
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
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: item.type === 'recipe' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  color: item.type === 'recipe' ? '#10B981' : '#8B5CF6',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {item.type}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
          How it works
        </h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { icon: '📸', text: 'Take a screenshot of a recipe or workout from any app or website' },
            { icon: '📥', text: 'Drag & drop the image, paste with Ctrl+V, or enter the URL' },
            { icon: '🤖', text: 'AI analyzes the image and extracts the content' },
            { icon: '✨', text: 'Review and add to your collection in the app' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{step.icon}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{step.text}</span>
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

  if (Platform.OS !== 'web') return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
                <img src={user.photoURL} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid rgba(139, 92, 246, 0.5)' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#FFFFFF' }}>
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
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
              {activeTab === 'workouts' && <WorkoutsSection data={data} loading={loading} />}
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
