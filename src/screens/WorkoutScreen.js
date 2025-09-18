import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration, Modal, TextInput, PanResponder, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';

// Exercise Card Component
const ExerciseCard = ({ exercise, index, onDelete, onPress, isSelected, exerciseSets, onUpdateSet, onAddSet, onDeleteSet, onShowInfo, onSelectSetType }) => {
  // Function to get set type color
  const getSetTypeColor = (type) => {
    switch (type) {
      case 'warmup': return '#FFA500'; // Orange
      case 'dropset': return '#9B59B6'; // Purple
      case 'failure': return '#E74C3C'; // Red
      default: return Colors.primary; // Green for normal
    }
  };

  // Function to get set type label
  const getSetTypeLabel = (type) => {
    switch (type) {
      case 'warmup': return 'Warmup';
      case 'dropset': return 'Drop';
      case 'failure': return 'Failure';
      default: return '';
    }
  };

  return (
    <View
      style={[
        styles.exerciseCard,
        isSelected && styles.currentExerciseCard
      ]}
    >
        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          <TouchableOpacity
            style={styles.exerciseMainContent}
            onPress={() => onPress(index)}
          >
            <View style={styles.exerciseListHeader}>
              <Text style={styles.exerciseListNumber}>
                {index + 1}
              </Text>
              <Text style={styles.exerciseListName}>
                {exercise.name}
              </Text>
            </View>
            <Text style={styles.exerciseListMeta}>
              {exercise.equipment} • {exercise.difficulty}
            </Text>
          </TouchableOpacity>

          <View style={styles.exerciseActions}>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => onShowInfo(exercise)}
            >
              <Text style={styles.infoButtonText}>ℹ️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(index)}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sets Tracking - Always visible */}
        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setHeaderText}>Set</Text>
            <Text style={styles.setHeaderText}>Weight</Text>
            <Text style={styles.setHeaderText}>Reps</Text>
            <Text style={styles.setHeaderText}>✓</Text>
          </View>
          
          {exerciseSets && exerciseSets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <TouchableOpacity
                style={styles.setNumberContainer}
                onPress={() => onSelectSetType(index, setIndex)}
              >
                <Text style={[
                  styles.setNumber,
                  { color: getSetTypeColor(set.type || 'normal') }
                ]}>
                  {setIndex + 1}
                </Text>
                {set.type && set.type !== 'normal' && (
                  <Text style={[
                    styles.setTypeLabel,
                    { color: getSetTypeColor(set.type) }
                  ]}>
                    {getSetTypeLabel(set.type)}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.setInput}
                value={set.weight}
                onChangeText={(value) => onUpdateSet(index, setIndex, 'weight', value)}
                placeholder="lbs"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.setInput}
                value={set.reps}
                onChangeText={(value) => onUpdateSet(index, setIndex, 'reps', value)}
                placeholder="reps"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
              
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => onUpdateSet(index, setIndex, 'completed', !set.completed)}
              >
                <View style={[styles.checkboxContainer, set.completed && styles.checkboxCompleted]}>
                  {set.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              
              {exerciseSets.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteSetButton}
                  onPress={() => onDeleteSet(index, setIndex)}
                >
                  <Text style={styles.deleteSetButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => onAddSet(index)}
          >
            <Text style={styles.addSetButtonText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
};

export default function WorkoutScreen({ navigation, route }) {
  const { exercise, resumingWorkout, fromWorkout, fromLibrary, selectedMuscleGroups } = route.params || {};
  const { user } = useAuth();
  const { activeWorkout, startWorkout, updateWorkout, finishWorkout, discardWorkout } = useWorkout();
  const hasProcessedExercise = useRef(false);

  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [restTimer, setRestTimer] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTargetSeconds, setRestTargetSeconds] = useState(60);
  const restIntervalRef = useRef(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [pickerMinutes, setPickerMinutes] = useState(1);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [selectedSetForType, setSelectedSetForType] = useState({ exerciseIndex: null, setIndex: null });

  // Exercise tracking state
  const [exerciseSets, setExerciseSets] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [draggedExercise, setDraggedExercise] = useState(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Simple initialization - only for new workouts or resuming
  useEffect(() => {
    // Only start a new workout if we don't have one and we have an exercise
    if (exercise && !activeWorkout && !fromWorkout) {
      const muscleGroups = route.params?.selectedMuscleGroups || [];
      startWorkout({
        exercises: [exercise],
        startTime: new Date().toISOString(),
        exerciseSets: {},
        selectedMuscleGroups: muscleGroups, // Store the muscle groups they selected
        currentExerciseIndex: 0,
        fromLibrary: fromLibrary || false // Track if started from library or free workout
      });
    }
    // Resuming existing workout
    else if (resumingWorkout && activeWorkout) {
      if (activeWorkout.exerciseSets) {
        setExerciseSets(activeWorkout.exerciseSets);
        const totals = calculateTotals(activeWorkout.exerciseSets);
        setTotalVolume(totals.volume);
        setTotalSets(totals.sets);
      }
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex || 0);
    }
    // If we have an active workout, just restore its sets
    else if (activeWorkout && activeWorkout.exerciseSets) {
      setExerciseSets(activeWorkout.exerciseSets);
      const totals = calculateTotals(activeWorkout.exerciseSets);
      setTotalVolume(totals.volume);
      setTotalSets(totals.sets);
    }
  }, []); // Only run once on mount

  // Update exercise index when new exercises are added via context
  useEffect(() => {
    if (activeWorkout && activeWorkout.currentExerciseIndex !== undefined) {
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex);
    }
  }, [activeWorkout?.currentExerciseIndex]);

  // Get workout data from context
  const workoutExercises = activeWorkout?.exercises || [];
  const workoutStartTime = activeWorkout?.startTime ? new Date(activeWorkout.startTime) : new Date();

  // Initialize exercise sets
  useEffect(() => {
    const newSets = { ...exerciseSets };
    let hasChanges = false;

    workoutExercises.forEach((ex, index) => {
      if (!newSets[index]) {
        newSets[index] = [{ weight: '', reps: '', completed: false }];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setExerciseSets(newSets);
    }
  }, [workoutExercises.length]);

  // Update workout timer with immediate start
  useEffect(() => {
    // Set initial time immediately
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to manually update workout context when needed
  const updateWorkoutData = () => {
    updateWorkout({
      exerciseSets: exerciseSets,
      exercises: workoutExercises,
      currentExerciseIndex: currentExerciseIndex
    });
  };

  // Removed problematic sync effect that was causing infinite loops

  // Rest timer logic
  useEffect(() => {
    if (isRestTimerRunning && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            // Timer finished - ring and vibrate
            handleRestTimerComplete();
            setIsRestTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isRestTimerRunning, restTimer]);

  // Calculate elapsed time
  const getElapsedTime = () => {
    let totalElapsed;
    if (isWorkoutPaused) {
      totalElapsed = Math.floor((pauseStartTime - workoutStartTime) / 1000) - pausedDuration;
    } else {
      totalElapsed = Math.floor((currentTime - workoutStartTime) / 1000) - pausedDuration;
    }
    // Ensure totalElapsed is never negative
    totalElapsed = Math.max(0, totalElapsed);
    const minutes = Math.floor(totalElapsed / 60);
    const seconds = totalElapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format rest timer
  const formatRestTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle rest timer completion
  const handleRestTimerComplete = () => {
    try {
      // Vibration pattern - long, short, long
      Vibration.vibrate([500, 200, 500, 200, 500]);
      
      // Show alert
      Alert.alert(
        '⏰ Rest Time Complete!',
        'Time to get back to your workout!',
        [{ text: 'Let\'s Go!', style: 'default' }]
      );
    } catch (error) {
    }
  };

  // Start rest timer
  const startRestTimer = (seconds = restTargetSeconds) => {
    setRestTimer(seconds);
    setIsRestTimerRunning(true);
  };

  // Stop rest timer
  const stopRestTimer = () => {
    setIsRestTimerRunning(false);
    setRestTimer(0);
  };

  // Pause/Resume workout timer
  const toggleWorkoutPause = () => {
    if (isWorkoutPaused) {
      // Resume - add the paused time to total paused duration
      const pauseDuration = Math.floor((new Date() - pauseStartTime) / 1000);
      setPausedDuration(prev => prev + pauseDuration);
      setIsWorkoutPaused(false);
      setPauseStartTime(null);
    } else {
      // Pause - record the pause start time
      setPauseStartTime(new Date());
      setIsWorkoutPaused(true);
    }
  };

  // Open timer picker
  const openTimerPicker = () => {
    const currentMinutes = Math.floor(restTargetSeconds / 60);
    const currentSeconds = restTargetSeconds % 60;
    setPickerMinutes(currentMinutes);
    setPickerSeconds(currentSeconds);
    setShowTimerPicker(true);
  };

  // Apply picker selection
  const applyTimerSelection = () => {
    const totalSeconds = (pickerMinutes * 60) + pickerSeconds;
    setRestTargetSeconds(totalSeconds);
    setShowTimerPicker(false);
  };

  // Handle finish workout confirmation
  const handleFinishWorkout = () => {
    setShowFinishConfirmation(true);
  };

  const confirmFinishWorkout = async () => {
    const workoutData = {
      duration: getElapsedTime(),
      exercisesCompleted: workoutExercises.length,
      exercises: workoutExercises,
      startTime: workoutStartTime.toISOString(),
      endTime: new Date().toISOString(),
      totalVolume: totalVolume,
      totalSets: totalSets,
      volumePerExercise: calculateVolumePerExercise()
    };

    // Save workout data with exercise sets
    const userId = user?.email || 'guest';
    const saveResult = await WorkoutStorageService.saveWorkout(workoutData, exerciseSets, userId);

    if (!saveResult.success) {
      Alert.alert('Error', 'Failed to save workout data. Continuing anyway.');
    }

    // Clear workout from global context
    finishWorkout();

    setShowFinishConfirmation(false);

    // Navigate with replace to prevent going back to workout
    navigation.replace('WorkoutSummary', {
      workoutData,
      exerciseSets,
      saveResult
    });
  };

  // Get current exercise
  const currentExercise = workoutExercises[currentExerciseIndex];

  // Navigate to exercise detail screen
  const showExerciseDetail = (exercise) => {
    navigation.navigate('ExerciseDetail', {
      exercise: exercise,
      fromWorkout: true
    });
  };

  // Add another exercise - navigate based on how user started
  const addAnotherExercise = () => {
    // Save current exercise sets to context before navigating
    updateWorkout({
      exerciseSets,
      currentExerciseIndex
    });

    // Check if workout was started from library or free workout
    if (activeWorkout?.fromLibrary) {
      // Started from library - show all exercises
      navigation.navigate('ExerciseList', {
        selectedMuscleGroups: ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'abs'],
        fromWorkout: true,
        fromLibrary: true
      });
    } else {
      // Started from free workout - use the muscle groups they selected
      const muscleGroups = activeWorkout?.selectedMuscleGroups || ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'abs'];
      navigation.navigate('ExerciseList', {
        selectedMuscleGroups: muscleGroups,
        fromWorkout: true,
        fromLibrary: false
      });
    }
  };

  // Navigate between exercises
  const goToNextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  // Add a new set for specific exercise - LOCAL ONLY
  const addSet = (exerciseIndex) => {
    const newSets = { ...exerciseSets };
    if (!newSets[exerciseIndex]) {
      newSets[exerciseIndex] = [];
    }
    newSets[exerciseIndex].push({ weight: '', reps: '', completed: false });
    setExerciseSets(newSets);
    // DO NOT update context here - keep it local
  };

  // Delete a set for specific exercise
  const deleteSet = (exerciseIndex, setIndex) => {
    const newSets = { ...exerciseSets };
    if (newSets[exerciseIndex] && newSets[exerciseIndex].length > 1) {
      newSets[exerciseIndex].splice(setIndex, 1);
      setExerciseSets(newSets);
    }
  };

  // Calculate total volume and completed sets count
  const calculateTotals = (sets) => {
    let volume = 0;
    let completedSets = 0;
    Object.values(sets).forEach(exerciseSets => {
      exerciseSets.forEach(set => {
        if (set.completed) {
          completedSets += 1;
          if (set.weight && set.reps) {
            volume += parseFloat(set.weight) * parseFloat(set.reps);
          }
        }
      });
    });
    return { volume, sets: completedSets };
  };

  // Calculate volume per exercise
  const calculateVolumePerExercise = () => {
    const volumePerExercise = {};
    Object.entries(exerciseSets).forEach(([exerciseIndex, sets]) => {
      let exerciseVolume = 0;
      sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          exerciseVolume += parseFloat(set.weight) * parseFloat(set.reps);
        }
      });
      if (workoutExercises[exerciseIndex]) {
        volumePerExercise[workoutExercises[exerciseIndex].name] = exerciseVolume;
      }
    });
    return volumePerExercise;
  };

  // Update set data - LOCAL ONLY, no context update to avoid refresh
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newSets = { ...exerciseSets };
    if (!newSets[exerciseIndex]) {
      newSets[exerciseIndex] = [{ weight: '', reps: '', completed: false }];
    }
    newSets[exerciseIndex][setIndex][field] = value;
    setExerciseSets(newSets);

    // Update totals if relevant fields changed
    if (field === 'completed' ||
        (newSets[exerciseIndex][setIndex].completed && (field === 'weight' || field === 'reps'))) {
      const totals = calculateTotals(newSets);
      setTotalVolume(totals.volume);
      setTotalSets(totals.sets);
    }
    // DO NOT update context here - causes refresh on every keystroke
  };

  // Handle set type selection
  const handleSelectSetType = (exerciseIndex, setIndex) => {
    setSelectedSetForType({ exerciseIndex, setIndex });
    setShowSetTypeModal(true);
  };

  // Apply set type to selected set
  const applySetType = (type) => {
    const { exerciseIndex, setIndex } = selectedSetForType;
    if (exerciseIndex !== null && setIndex !== null) {
      updateSet(exerciseIndex, setIndex, 'type', type);
    }
    setShowSetTypeModal(false);
    setSelectedSetForType({ exerciseIndex: null, setIndex: null });
  };

  // Delete exercise from workout
  const deleteExercise = (index) => {
    setExerciseToDelete(index);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteExercise = () => {
    if (exerciseToDelete !== null) {
      const newExercises = [...workoutExercises];
      newExercises.splice(exerciseToDelete, 1);

      // Update exercise sets
      const newSets = { ...exerciseSets };
      delete newSets[exerciseToDelete];
      // Reindex the sets
      const reindexedSets = {};
      Object.keys(newSets).forEach(key => {
        const numKey = parseInt(key);
        if (numKey > exerciseToDelete) {
          reindexedSets[numKey - 1] = newSets[key];
        } else {
          reindexedSets[numKey] = newSets[key];
        }
      });
      setExerciseSets(reindexedSets);

      // Update workout context with new exercises and sets
      updateWorkout({
        exercises: newExercises,
        exerciseSets: reindexedSets
      });

      // Adjust current index if needed
      if (currentExerciseIndex >= newExercises.length) {
        setCurrentExerciseIndex(Math.max(0, newExercises.length - 1));
      }
    }
    setShowDeleteConfirmation(false);
    setExerciseToDelete(null);
  };

  // Reorder exercises
  const moveExercise = (fromIndex, toIndex) => {
    const newExercises = [...workoutExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);

    // Reorder exercise sets accordingly
    const newSets = {};
    newExercises.forEach((ex, newIndex) => {
      const oldIndex = workoutExercises.indexOf(ex);
      if (exerciseSets[oldIndex]) {
        newSets[newIndex] = exerciseSets[oldIndex];
      }
    });
    setExerciseSets(newSets);

    // Update workout context with reordered exercises and sets
    updateWorkout({
      exercises: newExercises,
      exerciseSets: newSets
    });

    // Update current index if the current exercise was moved
    if (currentExerciseIndex === fromIndex) {
      setCurrentExerciseIndex(toIndex);
    }
  };

  const getEquipmentIcon = (equipment) => {
    switch (equipment) {
      case 'Bodyweight': return '🤸‍♂️';
      case 'Dumbbells': return '🏋️‍♂️';
      case 'Barbell': return '🏋️';
      case 'Machine': return '⚙️';
      case 'Cable': return '🔗';
      default: return '💪';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return Colors.primary;
    }
  };

  if (!currentExercise) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.fixedTimerHeader}>
          <LinearGradient
            colors={[Colors.primary + '15', Colors.background]}
            style={styles.timerHeaderGradient}
          >
            <View style={styles.timerRow}>
              <Text style={styles.errorText}>No exercise selected</Text>
            </View>
          </LinearGradient>
        </View>

        <ScreenLayout
          title="Workout"
          subtitle="No exercise selected"
          navigation={navigation}
          showBack={true}
          style={styles.screenLayoutStyle}
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ No exercise data found</Text>
          </View>
        </ScreenLayout>
      </View>
    );
  }


  // Create custom header component with workout stats
  const WorkoutStatsHeader = () => (
    <View style={styles.headerStats}>
      <TouchableOpacity
        style={styles.headerStatBox}
        onPress={toggleWorkoutPause}
        activeOpacity={0.7}
      >
        <View style={styles.headerTimerContent}>
          <Text style={styles.headerPauseIcon}>
            {isWorkoutPaused ? '▶' : '⏸'}
          </Text>
          <Text style={[
            styles.headerTimerText,
            isWorkoutPaused && styles.headerTimerPaused
          ]}>
            {getElapsedTime()}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.headerStatBox}>
        <Text style={styles.headerStatValue}>{totalVolume.toLocaleString()}</Text>
        <Text style={styles.headerStatLabel}>volume (lbs)</Text>
      </View>

      <View style={styles.headerStatBox}>
        <Text style={styles.headerStatValue}>{totalSets}</Text>
        <Text style={styles.headerStatLabel}>sets</Text>
      </View>
    </View>
  );

  return (
    <>
      <ScreenLayout
        title={<WorkoutStatsHeader />}
        subtitle={null}
        navigation={navigation}
        showBack={true}
        scrollable={true}
        hideWorkoutIndicator={true}
      >
      {/* Rest Timer Card */}
      <View style={styles.restTimerCard}>
        <View style={styles.restTimerContent}>
          <Text style={styles.restTimerLabel}>Rest Timer</Text>
          <View style={styles.restTimerControls}>
            <TouchableOpacity
              style={styles.restButton}
              onPress={() => {
                stopRestTimer();
                setRestTargetSeconds(60);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.restButtonIcon}>↻</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restTimerDisplay}
              onPress={openTimerPicker}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.restTimerText,
                isRestTimerRunning && styles.activeTimer
              ]}>
                {restTimer > 0 ? formatRestTimer(restTimer) : formatRestTimer(restTargetSeconds)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.restButton,
                isRestTimerRunning && styles.activeRestButton
              ]}
              onPress={() => {
                if (isRestTimerRunning) {
                  stopRestTimer();
                } else {
                  startRestTimer();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.restButtonIcon}>
                {isRestTimerRunning ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* All Workout Exercises */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Exercises ({workoutExercises.length})</Text>
        {workoutExercises.map((ex, index) => (
          <ExerciseCard
            key={`workout-ex-${index}`}
            exercise={ex}
            index={index}
            onDelete={deleteExercise}
            onPress={setCurrentExerciseIndex}
            isSelected={index === currentExerciseIndex}
            exerciseSets={exerciseSets[index]}
            onUpdateSet={updateSet}
            onAddSet={addSet}
            onDeleteSet={deleteSet}
            onShowInfo={showExerciseDetail}
            onSelectSetType={handleSelectSetType}
          />
        ))}
      </View>



          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.addExerciseButton]}
              activeOpacity={0.8}
              onPress={addAnotherExercise}
            >
              <Text style={[styles.actionButtonText, styles.addExerciseButtonText]}>➕ Add Another Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.aiButton]}
              activeOpacity={0.8}
              onPress={() => setShowAIAssistant(true)}
            >
              <Text style={[styles.actionButtonText, styles.aiButtonText]}>🤖 Ask AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.finishButton]}
              activeOpacity={0.8}
              onPress={handleFinishWorkout}
            >
              <Text style={styles.actionButtonText}>Finish Workout</Text>
            </TouchableOpacity>
          </View>
      </ScreenLayout>

      {/* Timer Picker Modal */}
      <Modal
        visible={showTimerPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Rest Timer</Text>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <Picker
                  selectedValue={pickerMinutes}
                  style={styles.picker}
                  onValueChange={setPickerMinutes}
                >
                  {Array.from({ length: 61 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Seconds</Text>
                <Picker
                  selectedValue={pickerSeconds}
                  style={styles.picker}
                  onValueChange={setPickerSeconds}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString().padStart(2, '0')} value={i} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowTimerPicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={applyTimerSelection}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Set Timer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Finish Workout Confirmation Modal */}
      <Modal
        visible={showFinishConfirmation}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finish Workout?</Text>
            <Text style={styles.confirmationText}>
              Are you sure you want to finish your workout? This will end your current session.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowFinishConfirmation(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={confirmFinishWorkout}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Finish Workout</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.modalButtonFullWidth, styles.modalButtonDanger]}
              onPress={() => {
                discardWorkout();
                setShowFinishConfirmation(false);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              }}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextDanger]}>Discard Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Delete Exercise Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Exercise?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove this exercise from your workout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteConfirmation(false);
                  setExerciseToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={confirmDeleteExercise}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAIAssistant}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalContent}>
            <View style={styles.aiModalHeader}>
              <Text style={styles.modalTitle}>AI Assistant</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAIAssistant(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aiModalBody}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiMainText}>AI is currently being built</Text>
              <Text style={styles.aiSubText}>Check back later</Text>
              <View style={styles.aiInfoBox}>
                <Text style={styles.aiInfoText}>
                  Soon, your AI assistant will provide personalized guidance about your exercises, workout routines, and fitness goals based on your current activity.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Type Selection Modal */}
      <Modal
        visible={showSetTypeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.setTypeModalContent}>
            <Text style={styles.modalTitle}>Select Set Type</Text>

            <TouchableOpacity
              style={[styles.setTypeOption, styles.normalSetOption]}
              onPress={() => applySetType('normal')}
            >
              <View style={styles.setTypeColorIndicator} />
              <Text style={styles.setTypeOptionText}>Normal Set</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.setTypeOption, styles.warmupSetOption]}
              onPress={() => applySetType('warmup')}
            >
              <View style={[styles.setTypeColorIndicator, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.setTypeOptionText}>Warmup Set</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.setTypeOption, styles.dropsetOption]}
              onPress={() => applySetType('dropset')}
            >
              <View style={[styles.setTypeColorIndicator, { backgroundColor: '#9B59B6' }]} />
              <Text style={styles.setTypeOptionText}>Drop Set</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.setTypeOption, styles.failureSetOption]}
              onPress={() => applySetType('failure')}
            >
              <View style={[styles.setTypeColorIndicator, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.setTypeOptionText}>Failure Set</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSetTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header Stats Styles
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerPauseIcon: {
    fontSize: 18,
    color: Colors.primary,
  },
  headerTimerText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  headerTimerPaused: {
    color: '#FF9800',
  },
  headerStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -2,
  },
  // Rest Timer Card Styles
  restTimerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restTimerContent: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  restTimerLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  restTimerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  restButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeRestButton: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  restButtonIcon: {
    fontSize: 16,
    color: Colors.primary,
  },
  restTimerDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restTimerText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  activeTimer: {
    color: Colors.primary,
  },
  timerHeaderCard: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerHeaderGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border + '50',
    marginHorizontal: Spacing.md,
  },
  volumeSetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '70%',
    alignSelf: 'center',
  },
  volumeSection: {
    alignItems: 'center',
    paddingLeft: 10,
  },
  setsSection: {
    alignItems: 'center',
    paddingRight: 10,
  },
  setsDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border + '30',
    marginHorizontal: Spacing.sm,
  },
  workoutTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pauseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseButtonText: {
    fontSize: 12,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
  restTimerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  workoutControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  restTimerButton: {
    padding: 4,
  },
  restControlButton: {
    backgroundColor: Colors.primary + '20',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restControlButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactTimerText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
  activeRestTimer: {
    color: Colors.primary,
  },
  pausedTimer: {
    color: '#FF9800',
  },
  pausedLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 2,
  },
  screenLayoutStyle: {
    paddingTop: 100, // Make room for fixed header
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  currentExerciseCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  moveButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  moveButtonText: {
    fontSize: 18,
    color: Colors.primary,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  setsContainer: {
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  setHeaderText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  setNumberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  setTypeLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: -2,
  },
  setInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    textAlign: 'center',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completeButton: {
    flex: 1,
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 28,
    height: 28,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteSetButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  deleteSetButtonText: {
    fontSize: 18,
    color: Colors.error,
  },
  addSetButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: Typography.fontSize.md,
  },
  deleteConfirmButton: {
    backgroundColor: '#DC3545',
    opacity: 0.9,
  },
  deleteConfirmButtonText: {
    color: Colors.background,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
  },
  exerciseListItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMainContent: {
    flex: 1,
  },
  exerciseListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  exerciseListNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Spacing.sm,
    minWidth: 25,
  },
  exerciseListName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseListMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  infoButton: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    marginRight: Spacing.xs,
  },
  infoButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  exerciseCardContainer: {
    alignItems: 'center',
  },
  exerciseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  exerciseContent: {
    alignItems: 'flex-start',
    width: '100%',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  exerciseName: {
    fontSize: Typography.fontSize.xxl || 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'left',
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  equipmentIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
  },
  instructionsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  muscleInfo: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    alignItems: 'flex-start',
    width: '100%',
  },
  muscleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  muscleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'left',
  },
  muscleSecondary: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'left',
  },
  restControlsCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restTimeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  restTimeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeRestTimeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  restTimeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeRestTimeButtonText: {
    color: Colors.background,
  },
  customTimerButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  customTimerButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addExerciseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiButton: {
    backgroundColor: 'rgba(123, 104, 238, 0.9)', // Purple color for AI
    borderWidth: 1,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  finishButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  addExerciseButtonText: {
    color: Colors.text,
  },
  aiButtonText: {
    color: Colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 100,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  confirmationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: Spacing.sm,
  },
  picker: {
    height: 150,
    width: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modalButton: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalButtonTextPrimary: {
    color: Colors.background,
  },
  modalButtonsVertical: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalButtonDanger: {
    backgroundColor: '#C44444',
    borderColor: '#C44444',
  },
  modalButtonTextDanger: {
    color: Colors.background,
  },
  modalButtonSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalButtonFullWidth: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    marginTop: Spacing.sm,
  },
  // AI Modal Styles
  aiModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 500,
    borderWidth: 2,
    borderColor: 'rgba(123, 104, 238, 0.3)',
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    backgroundColor: Colors.border,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  aiModalBody: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  aiIcon: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  aiMainText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  aiSubText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  aiInfoBox: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 320,
  },
  aiInfoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  // Set Type Modal Styles
  setTypeModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  setTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  normalSetOption: {
    borderColor: Colors.primary,
  },
  warmupSetOption: {
    borderColor: '#FFA500',
  },
  dropsetOption: {
    borderColor: '#9B59B6',
  },
  failureSetOption: {
    borderColor: '#E74C3C',
  },
  setTypeColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  setTypeOptionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
});