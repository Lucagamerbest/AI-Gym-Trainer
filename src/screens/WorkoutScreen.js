import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration, Modal, TextInput, PanResponder, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Exercise Card Component
const ExerciseCard = ({ exercise, index, onDelete, onPress, isSelected, exerciseSets, onUpdateSet, onAddSet, onDeleteSet }) => {
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
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
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
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
              
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
  const { exercise, addToExistingWorkout, existingWorkoutExercises, workoutStartTime: existingStartTime, selectedMuscleGroups } = route.params || {};
  const [workoutStartTime] = useState(existingStartTime || new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [restTimer, setRestTimer] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTargetSeconds, setRestTargetSeconds] = useState(60);
  const restIntervalRef = useRef(null);
  const [workoutExercises, setWorkoutExercises] = useState(
    addToExistingWorkout && existingWorkoutExercises
      ? [...existingWorkoutExercises, exercise]
      : [exercise]
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
    addToExistingWorkout && existingWorkoutExercises
      ? existingWorkoutExercises.length
      : 0
  );
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [showExerciseInfo, setShowExerciseInfo] = useState(false);
  const [pickerMinutes, setPickerMinutes] = useState(1);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  
  // Exercise tracking state
  const [exerciseSets, setExerciseSets] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [draggedExercise, setDraggedExercise] = useState(null);

  // Initialize exercise sets when component mounts or exercises change
  useEffect(() => {
    const newSets = {};
    workoutExercises.forEach((ex, index) => {
      if (!exerciseSets[index]) {
        newSets[index] = [
          { weight: '', reps: '', completed: false }
        ];
      } else {
        newSets[index] = exerciseSets[index];
      }
    });
    setExerciseSets(newSets);
  }, [workoutExercises.length]);

  // Update workout timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent navigation away from workout screen
  useFocusEffect(
    React.useCallback(() => {
      const beforeRemove = (e) => {
        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Show custom themed modal instead of system alert
        setShowBackWarning(true);
      };

      navigation.addListener('beforeRemove', beforeRemove);

      return () => navigation.removeListener('beforeRemove', beforeRemove);
    }, [navigation])
  );

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
      console.log('Error with timer completion:', error);
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

  const confirmFinishWorkout = () => {
    const workoutData = {
      duration: getElapsedTime(),
      exercisesCompleted: workoutExercises.length,
      exercises: workoutExercises,
      startTime: workoutStartTime,
      endTime: new Date()
    };

    // Remove the navigation listener before navigating away
    navigation.removeListener('beforeRemove', () => {});

    setShowFinishConfirmation(false);
    navigation.navigate('WorkoutSummary', { workoutData });
  };

  // Get current exercise
  const currentExercise = workoutExercises[currentExerciseIndex] || exercise;

  // Add another exercise
  const addAnotherExercise = () => {
    // If we have selectedMuscleGroups, go directly to ExerciseList
    // Otherwise, go to MuscleGroupSelection
    if (selectedMuscleGroups && selectedMuscleGroups.length > 0) {
      navigation.navigate('ExerciseList', {
        selectedMuscleGroups: selectedMuscleGroups,
        fromWorkout: true,
        currentWorkoutExercises: workoutExercises,
        workoutStartTime: workoutStartTime
      });
    } else {
      navigation.navigate('MuscleGroupSelection', {
        fromWorkout: true,
        currentWorkoutExercises: workoutExercises,
        workoutStartTime: workoutStartTime
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

  // Add a new set for specific exercise
  const addSet = (exerciseIndex) => {
    const newSets = { ...exerciseSets };
    if (!newSets[exerciseIndex]) {
      newSets[exerciseIndex] = [];
    }
    newSets[exerciseIndex].push({ weight: '', reps: '', completed: false });
    setExerciseSets(newSets);
  };

  // Delete a set for specific exercise
  const deleteSet = (exerciseIndex, setIndex) => {
    const newSets = { ...exerciseSets };
    if (newSets[exerciseIndex] && newSets[exerciseIndex].length > 1) {
      newSets[exerciseIndex].splice(setIndex, 1);
      setExerciseSets(newSets);
    }
  };

  // Update set data
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newSets = { ...exerciseSets };
    if (!newSets[exerciseIndex]) {
      newSets[exerciseIndex] = [{ weight: '', reps: '', completed: false }];
    }
    newSets[exerciseIndex][setIndex][field] = value;
    setExerciseSets(newSets);
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
      setWorkoutExercises(newExercises);
      
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
      
      // Adjust current index if needed
      if (currentExerciseIndex >= workoutExercises.length - 1) {
        setCurrentExerciseIndex(Math.max(0, workoutExercises.length - 2));
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
    setWorkoutExercises(newExercises);
    
    // Reorder exercise sets accordingly
    const newSets = {};
    newExercises.forEach((ex, newIndex) => {
      const oldIndex = workoutExercises.indexOf(ex);
      if (exerciseSets[oldIndex]) {
        newSets[newIndex] = exerciseSets[oldIndex];
      }
    });
    setExerciseSets(newSets);
    
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

  return (
    <>
      <ScreenLayout
        title="Active Workout"
        subtitle={`${workoutExercises.length} exercise${workoutExercises.length > 1 ? 's' : ''}`}
        navigation={navigation}
        showBack={true}
        scrollable={true}
      >
      {/* Compact Timer Header */}
      <View style={styles.timerHeaderCard}>
        <LinearGradient
          colors={[Colors.primary + '15', Colors.surface]}
          style={styles.timerHeaderGradient}
        >
          <View style={styles.timerRow}>
            <View style={styles.workoutTimerContainer}>
              <Text style={styles.timerLabel}>Workout</Text>
              <View style={styles.workoutControlsRow}>
                <TouchableOpacity 
                  style={styles.restControlButton}
                  onPress={toggleWorkoutPause}
                >
                  <Text style={styles.restControlButtonText}>
                    {isWorkoutPaused ? '▶️' : '⏸️'}
                  </Text>
                </TouchableOpacity>
                <Text style={[
                  styles.compactTimerText,
                  isWorkoutPaused && styles.pausedTimer
                ]}>
                  {getElapsedTime()}
                </Text>
              </View>
              {isWorkoutPaused && (
                <Text style={styles.pausedLabel}>PAUSED</Text>
              )}
            </View>
            <View style={styles.restTimerContainer}>
              <Text style={styles.timerLabel}>Timer</Text>
              <View style={styles.restControlsRow}>
                <TouchableOpacity 
                  style={styles.restControlButton}
                  onPress={() => {
                    stopRestTimer();
                    setRestTargetSeconds(60);
                  }}
                >
                  <Text style={styles.restControlButtonText}>↻</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.restTimerButton}
                  onPress={openTimerPicker}
                >
                  <Text style={[
                    styles.compactTimerText,
                    isRestTimerRunning && styles.activeRestTimer
                  ]}>
                    {restTimer > 0 ? formatRestTimer(restTimer) : formatRestTimer(restTargetSeconds)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.restControlButton}
                  onPress={() => {
                    if (isRestTimerRunning) {
                      stopRestTimer();
                    } else {
                      startRestTimer();
                    }
                  }}
                >
                  <Text style={styles.restControlButtonText}>
                    {isRestTimerRunning ? '⏸️' : '▶️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
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
              Are you sure you want to finish your workout? This will end your current session and show your workout summary.
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
          </View>
        </View>
      </Modal>

      {/* Back Navigation Warning Modal */}
      <Modal
        visible={showBackWarning}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Workout in Progress</Text>
            <Text style={styles.confirmationText}>
              You have an active workout session. To complete your workout, please use the "Finish Workout" button below.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => setShowBackWarning(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Continue Workout</Text>
              </TouchableOpacity>
            </View>
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
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  timerHeaderCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timerHeaderGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.xl, // Add more space between workout and timer
  },
  workoutTimerContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: Spacing.md, // Add padding to make it wider
    backgroundColor: Colors.primary + '05', // Subtle background
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  restTimerContainer: {
    alignItems: 'center', 
    flex: 1,
    paddingHorizontal: Spacing.md, // Add padding to make it wider
    backgroundColor: Colors.primary + '05', // Subtle background
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restControlButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  compactTimerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
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
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
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
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
  },
  infoButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
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
  infoButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  infoButtonText: {
    fontSize: 20,
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
  // Exercise info modal styles
  infoModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
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
  infoModalScroll: {
    padding: Spacing.lg,
  },
  infoModalInstructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  infoModalMeta: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
  },
  infoModalMetaTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  infoModalMetaText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
});