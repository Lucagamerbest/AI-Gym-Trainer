import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function WorkoutScreen({ navigation, route }) {
  const { exercise, addToExistingWorkout, existingWorkoutExercises, workoutStartTime: existingStartTime } = route.params || {};
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

  // Update workout timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Get current exercise
  const currentExercise = workoutExercises[currentExerciseIndex] || exercise;

  // Add another exercise
  const addAnotherExercise = () => {
    navigation.navigate('AddExercise', {
      selectedMuscleGroups: [currentExercise.muscleGroup.toLowerCase()],
      currentWorkoutExercises: workoutExercises,
      workoutStartTime: workoutStartTime
    });
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
        <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
          {workoutExercises.map((ex, index) => (
            <View
              key={`workout-ex-${index}`}
              style={styles.exerciseListItem}
            >
              <TouchableOpacity
                style={styles.exerciseMainContent}
                onPress={() => setCurrentExerciseIndex(index)}
              >
                <View style={styles.exerciseListHeader}>
                  <Text style={styles.exerciseListNumber}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.exerciseListName}>
                  {ex.name}
                </Text>
                <Text style={styles.exerciseListMeta}>
                  {ex.equipment} • {ex.difficulty}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => {
                  navigation.navigate('ExerciseDetail', {
                    exercise: ex,
                    fromWorkout: true
                  });
                }}
              >
                <Text style={styles.infoButtonText}>ℹ️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>



          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={addAnotherExercise}
            >
              <Text style={styles.actionButtonText}>➕ Add Another Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.finishButton]}
              activeOpacity={0.8}
              onPress={() => {
                const workoutData = {
                  duration: getElapsedTime(),
                  exercisesCompleted: workoutExercises.length,
                  exercises: workoutExercises,
                  startTime: workoutStartTime,
                  endTime: new Date()
                };
                navigation.navigate('WorkoutSummary', { workoutData });
              }}
            >
              <Text style={styles.actionButtonText}>✅ Finish Workout</Text>
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
  exerciseList: {
    marginTop: Spacing.sm,
    maxHeight: 400, // Increased height since this is now the main content
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
    padding: Spacing.md,
  },
  exerciseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exerciseListNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
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
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: Spacing.lg,
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