import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Vibration, Modal, TextInput, PanResponder, Animated, AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import AIButtonModal from '../components/AIButtonModal';
import PlatePicker from '../components/PlatePicker';
import { usesBarbellPlates, getBarType } from '../constants/weightEquipment';

// Configure notification handler - always show notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowBanner: true, // Always show notification banner
      shouldShowList: true,   // Always add to notification list
      shouldPlaySound: true,  // Always play sound
      shouldSetBadge: false,
    };
  },
});

// Helper function to play notification sound using the "silent sound hack"
const playNotificationSound = async () => {
  try {
    // CRITICAL: Set audio mode to play in silent mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
    });

    // Create and immediately play the notification sound
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
      { shouldPlay: true, volume: 1.0 }, // shouldPlay: true is CRITICAL for silent mode
      null,
      false
    );

    // Clean up after sound finishes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });

  } catch (error) {
      }
};

// Helper function to detect if exercise is cardio
const isCardioExercise = (exercise) => {
  if (!exercise || !exercise.id) return false;
  const cardioKeywords = ['running', 'jogging', 'treadmill', 'walking', 'cardio', 'cycling', 'biking'];
  const id = exercise.id.toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  return cardioKeywords.some(keyword => id.includes(keyword) || name.includes(keyword));
};

// Helper function to detect if exercise is bodyweight
const isBodyweightExercise = (exercise) => {
  if (!exercise) return false;
  // Check if exercise has equipment field set to "Bodyweight"
  if (exercise.equipment && typeof exercise.equipment === 'string') {
    return exercise.equipment.toLowerCase().includes('bodyweight');
  }
  // Check variants if they exist
  if (exercise.variants && Array.isArray(exercise.variants)) {
    return exercise.variants.some(variant =>
      variant.equipment && variant.equipment.toLowerCase() === 'bodyweight'
    );
  }
  return false;
};

// Exercise Card Component
const ExerciseCard = ({ exercise, index, onDelete, onPress, isSelected, exerciseSets, onUpdateSet, onAddSet, onDeleteSet, onShowInfo, onSelectSetType, onPairSuperset, supersetPairIndex, fromProgram, rpeEnabled, onStartCardioTimer, onPauseCardioTimer, cardioTimers, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) => {

  // Check if this exercise uses barbell/plates
  const selectedEquipment = exercise.selectedEquipment || exercise.equipment?.split(', ')[0] || '';
  const isBarbellExercise = usesBarbellPlates(exercise.name, selectedEquipment);
  const barType = isBarbellExercise ? getBarType(exercise.name, selectedEquipment) : null;

  // State for plate picker modal
  const [showPlatePicker, setShowPlatePicker] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Open plate picker for a specific set
  const openPlatePicker = (setIndex) => {
    setActiveSetIndex(setIndex);
    setShowPlatePicker(true);
  };

  // Handle plate picker confirmation
  const handlePlatePickerConfirm = (weight) => {
    onUpdateSet(index, activeSetIndex, 'weight', weight);
  };

  // Function to get set type color
  const getSetTypeColor = (type) => {
    switch (type) {
      case 'warmup': return '#FFA500'; // Orange
      case 'dropset': return '#9B59B6'; // Purple
      case 'failure': return '#E74C3C'; // Red
      case 'superset': return '#3498DB'; // Blue
      default: return Colors.primary; // Green for normal
    }
  };

  // Function to get set type label
  const getSetTypeLabel = (type) => {
    switch (type) {
      case 'warmup': return 'Warmup';
      case 'dropset': return 'Drop';
      case 'failure': return 'Failure';
      case 'superset': return 'S';
      default: return '';
    }
  };

  // Check if this is a cardio exercise
  const isCardio = isCardioExercise(exercise);

  // Check if this is a bodyweight exercise
  const isBodyweight = isBodyweightExercise(exercise);

  // Format duration for cardio (seconds to MM:SS)
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.exerciseCard,
        isSelected && styles.currentExerciseCard,
        supersetPairIndex !== null && supersetPairIndex !== undefined && styles.supersetPairedCard
      ]}
    >
        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          {/* Reorder Buttons */}
          {onMoveUp && onMoveDown && (
            <View style={styles.reorderButtons}>
              <TouchableOpacity
                onPress={() => onMoveUp(index)}
                style={[
                  styles.reorderButton,
                  !canMoveUp && styles.reorderButtonDisabled
                ]}
                disabled={!canMoveUp}
              >
                <Ionicons
                  name="chevron-up"
                  size={20}
                  color={canMoveUp ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onMoveDown(index)}
                style={[
                  styles.reorderButton,
                  !canMoveDown && styles.reorderButtonDisabled
                ]}
                disabled={!canMoveDown}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={canMoveDown ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            </View>
          )}

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
            {supersetPairIndex !== null && supersetPairIndex !== undefined && (
              <View style={styles.supersetBadgeRow}>
                <Text style={styles.supersetBadgeText}>Superset with #{supersetPairIndex + 1}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.exerciseActions}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => onShowInfo(exercise)}
            >
              <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIconButton, supersetPairIndex !== null && supersetPairIndex !== undefined && styles.pairButtonActive]}
              onPress={() => onPairSuperset(index)}
            >
              <Ionicons name="link-outline" size={20} color={supersetPairIndex !== null && supersetPairIndex !== undefined ? '#3498DB' : Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionIconButton, styles.deleteIconButton]}
              onPress={() => onDelete(index)}
            >
              <Ionicons name="close" size={22} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sets Tracking - Conditional rendering based on exercise type */}
        <View style={styles.setsContainer}>
          {isCardio ? (
            // Cardio Exercise - Show Set, Duration, Timer Button
            <>
              <View style={styles.setsHeader}>
                <Text style={styles.setHeaderText}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 2 }]}>Duration</Text>
                <Text style={styles.setHeaderText}>Timer</Text>
              </View>
            </>
          ) : (
            // Regular Exercise - Show Set, Weight (if not bodyweight), Reps, RPE (if enabled)
            <View style={styles.setsHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              {!isBodyweight && <Text style={styles.setHeaderText}>Weight</Text>}
              <Text style={styles.setHeaderText}>Reps</Text>
              {rpeEnabled && <Text style={styles.rpeHeaderText}>RPE</Text>}
            </View>
          )}

          {exerciseSets && exerciseSets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              {isCardio ? (
                // Cardio set row: Set number | Duration display | Timer button
                <>
                  <View style={styles.setNumberContainer}>
                    <Text style={[styles.setNumber, { color: Colors.primary }]}>
                      {setIndex + 1}
                    </Text>
                  </View>

                  <View style={[styles.setInput, { flex: 2 }]}>
                    <Text style={styles.cardioDurationText}>
                      {formatDuration(set.duration || 0)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cardioTimerButton}
                    onPress={() => {
                      const timerKey = `${index}-${setIndex}`;
                      const isRunning = cardioTimers?.[timerKey]?.isRunning;
                      if (isRunning) {
                        onPauseCardioTimer(index, setIndex);
                      } else {
                        onStartCardioTimer(index, setIndex);
                      }
                    }}
                  >
                    <Text style={styles.cardioTimerButtonText}>
                      {cardioTimers?.[`${index}-${setIndex}`]?.isRunning ? '⏸' : '▶'}
                    </Text>
                  </TouchableOpacity>

                  {exerciseSets.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteSetButton}
                      onPress={() => onDeleteSet(index, setIndex)}
                    >
                      <Text style={styles.deleteSetButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                // Regular exercise set row: Set number | Weight (if not bodyweight) | Reps | RPE
                <>
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

                  {!isBodyweight && (
                    isBarbellExercise ? (
                      <TouchableOpacity
                        style={[styles.setInput, styles.weightTouchable]}
                        onPress={() => openPlatePicker(setIndex)}
                      >
                        <Text style={[
                          styles.weightTouchableText,
                          !set.weight && styles.weightTouchablePlaceholder
                        ]}>
                          {set.weight || 'lbs'}
                        </Text>
                        <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        style={styles.setInput}
                        value={set.weight}
                        onChangeText={(value) => onUpdateSet(index, setIndex, 'weight', value)}
                        placeholder="lbs"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                      />
                    )
                  )}

                  <TextInput
                    style={[
                      styles.setInput,
                      styles.repsInput,
                      fromProgram && set.reps && styles.programRepsInput
                    ]}
                    value={set.reps}
                    onChangeText={(value) => onUpdateSet(index, setIndex, 'reps', value)}
                    placeholder={fromProgram && set.reps ? set.reps : "10"}
                    placeholderTextColor={fromProgram && set.reps ? Colors.primary : Colors.textMuted}
                    keyboardType="numeric"
                    maxLength={5}
                  />

                  {rpeEnabled && (
                    <TextInput
                      style={[styles.setInput, styles.rpeInput]}
                      value={set.rpe}
                      onChangeText={(value) => onUpdateSet(index, setIndex, 'rpe', value)}
                      placeholder="1-10"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  )}

                  {exerciseSets.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteSetButton}
                      onPress={() => onDeleteSet(index, setIndex)}
                    >
                      <Text style={styles.deleteSetButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </>
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

        {/* Plate Picker Modal for barbell exercises */}
        {isBarbellExercise && barType && (
          <PlatePicker
            visible={showPlatePicker}
            onClose={() => setShowPlatePicker(false)}
            onConfirm={handlePlatePickerConfirm}
            initialWeight={exerciseSets?.[activeSetIndex]?.weight || '45'}
            barType={barType}
            unit="lbs"
          />
        )}
    </View>
  );
};

export default function WorkoutScreen({ navigation, route }) {
  const { exercise, resumingWorkout, fromWorkout, fromLibrary, selectedMuscleGroups, fromProgram, programExercises, programName, dayName } = route.params || {};
  const { user } = useAuth();
  const { activeWorkout, startWorkout, updateWorkout, finishWorkout, discardWorkout } = useWorkout();
  const hasProcessedExercise = useRef(false);
  const initializedExerciseCount = useRef(0);

  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [restTimer, setRestTimer] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [restTargetSeconds, setRestTargetSeconds] = useState(60);
  const [restTimerEndTime, setRestTimerEndTime] = useState(null);
  const restIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState(null);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [pickerMinutes, setPickerMinutes] = useState(1);
  const [pickerSeconds, setPickerSeconds] = useState(0);
  const [showRestTimerModal, setShowRestTimerModal] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [selectedSetForType, setSelectedSetForType] = useState({ exerciseIndex: null, setIndex: null });
  const [rpeEnabled, setRpeEnabled] = useState(false);

  // Exercise reordering state
  const moveTimerRef = useRef(null);
  const pendingMovesRef = useRef({ index: null, direction: null, count: 0 });

  // Superset pairing state
  const [supersetPairings, setSupersetPairings] = useState({}); // { exerciseIndex: pairedExerciseIndex }
  const [showSupersetPairModal, setShowSupersetPairModal] = useState(false);
  const [exerciseToPair, setExerciseToPair] = useState(null);

  // Exercise tracking state
  const [exerciseSets, setExerciseSets] = useState({});
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [draggedExercise, setDraggedExercise] = useState(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Cardio timer state: { "exerciseIndex-setIndex": { startTime, duration, isRunning } }
  const [cardioTimers, setCardioTimers] = useState({});
  const cardioTimerIntervals = useRef({});

  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef(null);
  const latestSetsRef = useRef(exerciseSets);
  const hasInitializedRef = useRef(false);

  // Keep ref updated with latest sets - BUT only if they have actual data
  useEffect(() => {
    // Check if exerciseSets has any actual data (not all empty)
    let hasData = false;
    for (const exerciseIndex in exerciseSets) {
      const sets = exerciseSets[exerciseIndex];
      if (Array.isArray(sets)) {
        for (const set of sets) {
          if ((set.weight && set.weight !== '') ||
              (set.reps && set.reps !== '') ||
              (set.duration && set.duration > 0)) {
            hasData = true;
            break;
          }
        }
      }
      if (hasData) break;
    }

    // Only update ref if we have real data OR if ref is currently empty
    if (hasData || !latestSetsRef.current || Object.keys(latestSetsRef.current).length === 0) {
      latestSetsRef.current = exerciseSets;
    }
  }, [exerciseSets]);

  // Execute pending save when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Clear any pending timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // ALWAYS save when leaving, regardless of pending timeout
        const saveSets = async () => {
          try {
            const sets = latestSetsRef.current;

            if (!sets || Object.keys(sets).length === 0) {
              return;
            }

            // Check if the sets have actual data (not all empty)
            let hasActualData = false;
            for (const exerciseIndex in sets) {
              const exerciseSets = sets[exerciseIndex];
              if (Array.isArray(exerciseSets)) {
                for (const set of exerciseSets) {
                  // Check if set has weight, reps, or duration
                  if ((set.weight && set.weight !== '') ||
                      (set.reps && set.reps !== '') ||
                      (set.duration && set.duration > 0)) {
                    hasActualData = true;
                    break;
                  }
                }
              }
              if (hasActualData) break;
            }

            if (!hasActualData) {
              return;
            }

            // Only save to AsyncStorage - the sync effect will handle context
            const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
            if (activeWorkoutStr) {
              const currentWorkout = JSON.parse(activeWorkoutStr);
              currentWorkout.exerciseSets = sets;
              await AsyncStorage.setItem('@active_workout', JSON.stringify(currentWorkout));
            }
          } catch (error) {
            console.error('❌ Save on blur failed:', error);
          }
        };

        saveSets();
      };
    }, [])
  );

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Sync activeWorkout to AsyncStorage for AI tools (one-way: Context → Storage)
  useEffect(() => {
    const syncWorkoutToStorage = async () => {
      try {
        if (activeWorkout) {
          // Save workout to AsyncStorage so AI tools can access it
          await AsyncStorage.setItem('@active_workout', JSON.stringify(activeWorkout));
        } else {
          // Remove when no active workout
          await AsyncStorage.removeItem('@active_workout');
        }
      } catch (error) {
        console.error('Failed to sync workout to AsyncStorage:', error);
      }
    };

    syncWorkoutToStorage();
  }, [activeWorkout]);

  // Load RPE setting and request notification permissions
  useEffect(() => {
    const loadRPESetting = async () => {
      try {
        const savedRpeEnabled = await AsyncStorage.getItem('@rpe_enabled');
        if (savedRpeEnabled !== null) {
          setRpeEnabled(savedRpeEnabled === 'true');
        }
      } catch (error) {
              }
    };

    const requestNotificationPermissions = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // Permissions handled silently

        // Set up notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('rest-timer', {
            name: 'Rest Timer',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            enableVibrate: true,
          });
        }
      } catch (error) {
              }
    };

    // Set up notification listeners
    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      // Notification received
    });

    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Notification tapped
    });

    loadRPESetting();
    requestNotificationPermissions();

    return () => {
      notificationReceivedSubscription.remove();
      notificationResponseSubscription.remove();
    };
  }, []);

  // AppState listener to handle background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground - check AsyncStorage for timer
        try {
          const storedEndTime = await AsyncStorage.getItem('@rest_timer_end');

          if (storedEndTime) {
            const endTime = parseInt(storedEndTime);
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

            if (remaining > 0) {
              // Timer still running - restore state
              setRestTimerEndTime(endTime);
              setRestTimer(remaining);
              setIsRestTimerRunning(true);
            } else {
              // Timer expired while in background - just clean up (notification already sent)
              await AsyncStorage.removeItem('@rest_timer_end');
              setIsRestTimerRunning(false);
              setRestTimer(0);
              setRestTimerEndTime(null);
            }
          } else if (isRestTimerRunning && restTimerEndTime) {
            // Fallback to state-based check
            const now = new Date().getTime();
            const remaining = Math.max(0, Math.ceil((restTimerEndTime - now) / 1000));
            setRestTimer(remaining);

            if (remaining <= 0) {
              // Timer expired - just clean up (notification already sent)
              setIsRestTimerRunning(false);
              setRestTimerEndTime(null);
            }
          }
        } catch (error) {
                  }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRestTimerRunning, restTimerEndTime]);

  // Initialize workout - handle all scenarios
  useEffect(() => {
    const initializeWorkout = async () => {
      // Prevent double initialization from React StrictMode or rapid re-renders
      // Once initialized, NEVER re-initialize to prevent overwriting saved data
      if (hasInitializedRef.current) {
        return;
      }

      // CRITICAL: Load from AsyncStorage first if context is empty
      if (activeWorkout && (!activeWorkout.exerciseSets || Object.keys(activeWorkout.exerciseSets).length === 0)) {
        try {
          const storedWorkout = await AsyncStorage.getItem('@active_workout');
          if (storedWorkout) {
            const workout = JSON.parse(storedWorkout);
            if (workout.exerciseSets && Object.keys(workout.exerciseSets).length > 0) {
              // Set directly to state instead of calling updateWorkout to avoid re-initialization loop
              setExerciseSets(workout.exerciseSets);
              hasInitializedRef.current = true;

              const totals = calculateTotals(workout.exerciseSets);
              setTotalVolume(totals.volume);
              setTotalSets(totals.sets);

              return; // Done!
            }
          }
        } catch (error) {
          console.error('❌ Failed to load from AsyncStorage:', error);
        }
      }

    // For program workouts, activeWorkout is set by ProgramDaySelection before navigation
    if (fromProgram && activeWorkout) {
      // Load the sets from the active workout
      if (activeWorkout.exerciseSets) {
        setExerciseSets(activeWorkout.exerciseSets);
        const totals = calculateTotals(activeWorkout.exerciseSets);
        setTotalVolume(totals.volume);
        setTotalSets(totals.sets);
      }
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex || 0);
      return; // Exit early for program workouts
    }

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
    // Resuming existing workout OR returning from adding exercise
    else if (activeWorkout) {
      if (activeWorkout.exerciseSets) {
        // Restore sets from context, but ensure ALL exercises have at least one set
        // Check if any exercises are missing sets and create default empty ones
        const restoredSets = { ...activeWorkout.exerciseSets };

        activeWorkout.exercises?.forEach((ex, index) => {
          if (!restoredSets[index] || !Array.isArray(restoredSets[index]) || restoredSets[index].length === 0) {
            const isCardio = isCardioExercise(ex);
            const isBodyweight = isBodyweightExercise(ex);
            // Create ONE default EMPTY set
            restoredSets[index] = isCardio
              ? [{ duration: 0, completed: false }]
              : isBodyweight
                ? [{ reps: '', completed: false }]
                : [{ weight: '', reps: '', completed: false }];
          }
        });

        setExerciseSets(restoredSets);
        const totals = calculateTotals(restoredSets);
        setTotalVolume(totals.volume);
        setTotalSets(totals.sets);

        // Mark as initialized to prevent re-initialization
        hasInitializedRef.current = true;

        // DON'T update context here - it causes re-initialization with empty sets
        // The auto-save will handle syncing to context when user makes changes
      }
      if (activeWorkout.currentExerciseIndex !== undefined) {
        setCurrentExerciseIndex(activeWorkout.currentExerciseIndex);
      }
    }
    };

    initializeWorkout();
  }, [activeWorkout, fromProgram, updateWorkout]); // Re-run when activeWorkout changes

  // Update exercise index when new exercises are added via context
  useEffect(() => {
    if (activeWorkout && activeWorkout.currentExerciseIndex !== undefined) {
      setCurrentExerciseIndex(activeWorkout.currentExerciseIndex);
    }
  }, [activeWorkout?.currentExerciseIndex]);

  // Handle new exercises being added - auto-create default sets
  // Track previous exercise count to detect when exercises are actually added (not just loaded)
  const prevExerciseCountRef = useRef(0);
  const hasRunInitialCheckRef = useRef(false);

  useEffect(() => {
    const currentExerciseCount = activeWorkout?.exercises?.length || 0;

    // Skip if no exercises
    if (!activeWorkout?.exercises || currentExerciseCount === 0) {
      return;
    }

    // Skip until initialization is complete to avoid interfering with data loading
    if (!hasInitializedRef.current) {
      prevExerciseCountRef.current = currentExerciseCount;
      return;
    }

    // Check if this is the first run after initialization OR if exercise count increased
    const isInitialCheck = hasInitializedRef.current && !hasRunInitialCheckRef.current;
    const hasExercisesAdded = currentExerciseCount > prevExerciseCountRef.current;

    if (!isInitialCheck && !hasExercisesAdded) {
      prevExerciseCountRef.current = currentExerciseCount;
      return;
    }

    if (isInitialCheck) {
      hasRunInitialCheckRef.current = true;
    }

    // Use functional setState to get current value and avoid stale closure
    setExerciseSets(currentSets => {
      const updatedSets = { ...currentSets };
      let hasChanges = false;

      // On initial check, check ALL exercises. Otherwise only check NEW exercises
      const startIndex = isInitialCheck ? 0 : prevExerciseCountRef.current;

      for (let index = startIndex; index < activeWorkout.exercises.length; index++) {
        const ex = activeWorkout.exercises[index];

        if (!updatedSets[index] || !Array.isArray(updatedSets[index]) || updatedSets[index].length === 0) {
          const isCardio = isCardioExercise(ex);
          const isBodyweight = isBodyweightExercise(ex);
          // Create ONE default EMPTY set (placeholders will be shown in UI, not actual values)
          updatedSets[index] = isCardio
            ? [{ duration: 0, completed: false }]
            : isBodyweight
              ? [{ reps: '', completed: false }]
              : [{ weight: '', reps: '', completed: false }];
          hasChanges = true;
        }
      }

      return hasChanges ? updatedSets : currentSets;
    });

    prevExerciseCountRef.current = currentExerciseCount;
  }, [activeWorkout?.exercises?.length]); // Only trigger when exercise count changes

  // Get workout data from context
  const workoutExercises = activeWorkout?.exercises || [];
  const workoutStartTime = activeWorkout?.startTime ? new Date(activeWorkout.startTime) : new Date();

  // Execute batched exercise moves
  const executePendingMoves = () => {
    const moves = pendingMovesRef.current;

    if (moves.index === null || moves.count === 0) {
      return;
    }

    const { index, direction, count } = moves;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedExercises = [...workoutExercises];
    const exercise = updatedExercises[index];

    // Calculate target position
    let targetIndex = index;
    if (direction === 'up') {
      targetIndex = Math.max(0, index - count);
    } else {
      targetIndex = Math.min(updatedExercises.length - 1, index + count);
    }

    // Remove from old position and insert at new position
    updatedExercises.splice(index, 1);
    updatedExercises.splice(targetIndex, 0, exercise);

    // Update workout with new exercise order
    updateWorkout({ exercises: updatedExercises });

    // Reset pending moves
    pendingMovesRef.current = { index: null, direction: null, count: 0 };
  };

  // Move exercise up with batching
  const moveExerciseUp = (index) => {
    if (index === 0) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Clear existing timer
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
    }

    // Update pending moves
    const current = pendingMovesRef.current;
    const newState = current.index === index && current.direction === 'up'
      ? { ...current, count: current.count + 1 }
      : { index, direction: 'up', count: 1 };
    pendingMovesRef.current = newState;

    // Set timer to execute after delay
    moveTimerRef.current = setTimeout(() => {
      executePendingMoves();
    }, 300);
  };

  // Move exercise down with batching
  const moveExerciseDown = (index) => {
    if (index === workoutExercises.length - 1) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Clear existing timer
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
    }

    // Update pending moves
    const current = pendingMovesRef.current;
    const newState = current.index === index && current.direction === 'down'
      ? { ...current, count: current.count + 1 }
      : { index, direction: 'down', count: 1 };
    pendingMovesRef.current = newState;

    // Set timer to execute after delay
    moveTimerRef.current = setTimeout(() => {
      executePendingMoves();
    }, 300);
  };

  // OLD: Initialize exercise sets - DISABLED to prevent stale closure issues
  // This effect was causing data to be overwritten after loading
  // Default sets are now created during initialization and by the auto-set handler
  useEffect(() => {
    // DISABLED - see auto-set handler effect above instead
    return;

    // For program workouts, don't override the sets from the program
    if (activeWorkout?.fromProgram) {
      return;
    }

    // Only run when exercise count actually changes
    if (workoutExercises.length === initializedExerciseCount.current) {
      return;
    }

    // Update the ref
    initializedExerciseCount.current = workoutExercises.length;

    // Start with current local state to preserve user input
    const newSets = { ...exerciseSets };
    let hasChanges = false;

    workoutExercises.forEach((ex, index) => {
      // Only add sets if this exercise doesn't have any OR has empty array
      if (!newSets[index] || !Array.isArray(newSets[index]) || newSets[index].length === 0) {
        // Check if this is a cardio exercise to determine what fields to initialize
        const isCardio = isCardioExercise(ex);
        if (isCardio) {
          newSets[index] = [{ duration: 0, completed: false }];
        } else {
          newSets[index] = [{ weight: '', reps: '', completed: false }];
        }
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

  // Rest timer logic - using timestamp-based calculation for background support
  useEffect(() => {
    if (isRestTimerRunning && restTimerEndTime) {
      restIntervalRef.current = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.ceil((restTimerEndTime - now) / 1000));

        setRestTimer(remaining);

        if (remaining <= 0) {
          handleRestTimerComplete(); // This triggers notification + alert
          setIsRestTimerRunning(false);
          setRestTimerEndTime(null);
          clearInterval(restIntervalRef.current);
          restIntervalRef.current = null;
        }
      }, 100); // Check every 100ms for smoother countdown
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
  }, [isRestTimerRunning, restTimerEndTime]);

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

  // Handle rest timer completion (only for in-app handling)
  const handleRestTimerComplete = async () => {
    try {
      // Clear from AsyncStorage
      await AsyncStorage.removeItem('@rest_timer_end');

      const currentState = AppState.currentState;

      // Only vibrate and show alert if app is ACTIVE (foreground)
      if (currentState === 'active') {
        // Play notification sound (works when silent mode is OFF)
        // NOTE: In production build, this will work even in silent mode
        await playNotificationSound();

        // Normal vibration pattern
        Vibration.vibrate([500, 200, 500, 200, 500]);

        // Send immediate notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Rest Time Complete!',
            body: 'Time to get back to your workout!',
            sound: false, // We handle sound manually with playNotificationSound
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Fire immediately
        });

        // Show alert
        Alert.alert(
          '⏰ Rest Time Complete!',
          'Time to get back to your workout!',
          [{ text: 'Let\'s Go!', style: 'default' }]
        );
      }
      // If app is background/inactive - scheduled notification already fired, do nothing
    } catch (error) {
          }
  };

  // Start rest timer
  const startRestTimer = async (seconds = restTargetSeconds) => {
    // Prevent starting if already running
    if (isRestTimerRunning) {
      return;
    }

    const now = new Date();
    const endTime = now.getTime() + (seconds * 1000);
    const expectedEndTime = new Date(endTime);

    setRestTimerEndTime(endTime);
    setRestTimer(seconds);
    setIsRestTimerRunning(true);

    // Store in AsyncStorage for background persistence
    try {
      await AsyncStorage.setItem('@rest_timer_end', endTime.toString());

      // Schedule notification using proper TIME_INTERVAL type
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Rest Time Complete!',
          body: 'Time to get back to your workout!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
          repeats: false,
        },
      });
    } catch (error) {
          }
  };

  // Stop rest timer (full reset)
  const stopRestTimer = async () => {
    setIsRestTimerRunning(false);
    setRestTimer(0);
    setRestTimerEndTime(null);

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem('@rest_timer_end');
    } catch (error) {
          }
  };

  // Pause rest timer (preserves current time)
  const pauseRestTimer = async () => {
    setIsRestTimerRunning(false);
    setRestTimerEndTime(null);

    // Clear from AsyncStorage
    try {
      await AsyncStorage.removeItem('@rest_timer_end');
    } catch (error) {
          }
  };

  // Cardio timer functions
  const startCardioTimer = (exerciseIndex, setIndex) => {
    const timerKey = `${exerciseIndex}-${setIndex}`;
    const now = new Date().getTime();

    // Check if this set has a planned duration that hasn't been started yet
    const currentSet = exerciseSets[exerciseIndex]?.[setIndex];
    const hasPlannedDuration = currentSet?.plannedDuration && !cardioTimers[timerKey]?.hasStarted;

    // If has planned duration and hasn't started, reset to 0 and start fresh
    // Otherwise, use accumulated duration from previous pause/resume cycles
    const currentDuration = hasPlannedDuration ? 0 : (cardioTimers[timerKey]?.baseDuration || 0);

    // Initialize or restart timer
    setCardioTimers(prev => ({
      ...prev,
      [timerKey]: {
        startTime: now,
        baseDuration: currentDuration, // Save the base duration when we start
        isRunning: true,
        hasStarted: true, // Mark that timer has been started
      }
    }));

    // Start interval to update duration every second
    cardioTimerIntervals.current[timerKey] = setInterval(() => {
      const currentTime = new Date().getTime();

      setCardioTimers(prev => {
        if (!prev[timerKey] || !prev[timerKey].isRunning) {
          return prev;
        }

        // Calculate elapsed time since this session started
        const elapsed = Math.floor((currentTime - prev[timerKey].startTime) / 1000);
        // Add to base duration
        const totalDuration = prev[timerKey].baseDuration + elapsed;

        // Update exerciseSets with the new duration
        setExerciseSets(prevSets => {
          const newSets = { ...prevSets };
          if (newSets[exerciseIndex] && newSets[exerciseIndex][setIndex]) {
            newSets[exerciseIndex][setIndex].duration = totalDuration;
          }
          return newSets;
        });

        return {
          ...prev,
          [timerKey]: {
            ...prev[timerKey],
            currentDuration: totalDuration // Store for display
          }
        };
      });
    }, 1000);
  };

  const pauseCardioTimer = (exerciseIndex, setIndex) => {
    const timerKey = `${exerciseIndex}-${setIndex}`;

    // Clear interval
    if (cardioTimerIntervals.current[timerKey]) {
      clearInterval(cardioTimerIntervals.current[timerKey]);
      delete cardioTimerIntervals.current[timerKey];
    }

    // Update timer state to paused and save final duration
    setCardioTimers(prev => {
      if (!prev[timerKey]) return prev;

      // Calculate final duration
      const elapsed = Math.floor((new Date().getTime() - prev[timerKey].startTime) / 1000);
      const finalDuration = prev[timerKey].baseDuration + elapsed;

      // Update exerciseSets with final duration
      setExerciseSets(prevSets => {
        const newSets = { ...prevSets };
        if (newSets[exerciseIndex] && newSets[exerciseIndex][setIndex]) {
          newSets[exerciseIndex][setIndex].duration = finalDuration;
        }
        return newSets;
      });

      return {
        ...prev,
        [timerKey]: {
          baseDuration: finalDuration, // Save for next resume
          isRunning: false,
          hasStarted: prev[timerKey].hasStarted || false, // Preserve hasStarted flag
        }
      };
    });
  };

  // Cleanup cardio timers on unmount
  useEffect(() => {
    return () => {
      // Clear all cardio timer intervals
      Object.values(cardioTimerIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

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

  // Apply picker selection and auto-start timer
  const applyTimerSelection = () => {
    const totalSeconds = (pickerMinutes * 60) + pickerSeconds;
    setRestTargetSeconds(totalSeconds);
    setShowTimerPicker(false);
    // Auto-start the timer after setting the duration
    startRestTimer(totalSeconds);
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
      volumePerExercise: calculateVolumePerExercise(),
      programName: activeWorkout?.programName || null,
      dayName: activeWorkout?.dayName || null,
      workoutName: activeWorkout?.workoutName || null,
    };

    setShowFinishConfirmation(false);

    // Navigate to finalization screen first (no saving yet)
    navigation.replace('WorkoutFinalization', {
      workoutData,
      exerciseSets
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

    // Check if workout was started from program
    if (activeWorkout?.fromProgram) {
      // Started from program - show all exercises but maintain program context
      navigation.navigate('ExerciseList', {
        selectedMuscleGroups: ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'abs'],
        fromWorkout: true,
        fromLibrary: true,
        fromProgram: true
      });
    }
    // Check if workout was started from library or free workout
    else if (activeWorkout?.fromLibrary) {
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

    // Check if this is a cardio or bodyweight exercise to determine what fields to initialize
    const exercise = workoutExercises[exerciseIndex];
    const isCardio = isCardioExercise(exercise);
    const isBodyweight = isBodyweightExercise(exercise);

    if (isCardio) {
      // For cardio: Stop and complete the previous set's timer
      const previousSetIndex = newSets[exerciseIndex].length - 1;
      if (previousSetIndex >= 0) {
        // Stop the timer for the previous set
        const timerKey = `${exerciseIndex}-${previousSetIndex}`;
        if (cardioTimerIntervals.current[timerKey]) {
          clearInterval(cardioTimerIntervals.current[timerKey]);
          delete cardioTimerIntervals.current[timerKey];
        }

        // Calculate final duration for the previous set
        if (cardioTimers[timerKey]?.isRunning) {
          const elapsed = Math.floor((new Date().getTime() - cardioTimers[timerKey].startTime) / 1000);
          const finalDuration = cardioTimers[timerKey].baseDuration + elapsed;

          // Update the previous set with final duration and mark as completed
          newSets[exerciseIndex][previousSetIndex].duration = finalDuration;
          newSets[exerciseIndex][previousSetIndex].completed = true;

          // Update timer state
          setCardioTimers(prev => ({
            ...prev,
            [timerKey]: {
              baseDuration: finalDuration,
              isRunning: false
            }
          }));
        } else {
          // If not running, just mark as completed
          newSets[exerciseIndex][previousSetIndex].completed = true;
        }
      }

      // Add new set with duration instead of weight/reps
      newSets[exerciseIndex].push({ duration: 0, completed: true });
    } else if (isBodyweight) {
      // For bodyweight exercises: only reps (no weight)
      newSets[exerciseIndex].push({ reps: '', rpe: '', completed: true });
    } else {
      // For regular exercises: weight, reps, rpe
      newSets[exerciseIndex].push({ weight: '', reps: '', rpe: '', completed: true });
    }

    setExerciseSets(newSets);

    // Update totals if we marked a cardio set as completed
    if (isCardio && newSets[exerciseIndex].length > 1) {
      const totals = calculateTotals(newSets);
      setTotalSets(totals.sets);
    }

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

  // Calculate total volume and sets count
  const calculateTotals = (sets) => {
    let volume = 0;
    let totalSets = 0;
    Object.values(sets).forEach(exerciseSets => {
      exerciseSets.forEach(set => {
        // Count all sets, not just completed ones
        totalSets += 1;
        // Calculate volume for sets with weight and reps
        if (set.weight && set.reps) {
          // Handle rep ranges (e.g., "8-12") - use the lower value for calculation
          const repsValue = set.reps.includes('-')
            ? parseFloat(set.reps.split('-')[0])
            : parseFloat(set.reps);
          if (!isNaN(repsValue)) {
            volume += parseFloat(set.weight) * repsValue;
          }
        }
      });
    });
    return { volume, sets: totalSets };
  };

  // Calculate volume per exercise
  const calculateVolumePerExercise = () => {
    const volumePerExercise = {};
    Object.entries(exerciseSets).forEach(([exerciseIndex, sets]) => {
      let exerciseVolume = 0;
      sets.forEach(set => {
        // Calculate volume for all sets with weight and reps
        if (set.weight && set.reps) {
          // Handle rep ranges (e.g., "8-12") - use the lower value for calculation
          const repsValue = set.reps.includes('-')
            ? parseFloat(set.reps.split('-')[0])
            : parseFloat(set.reps);
          if (!isNaN(repsValue)) {
            exerciseVolume += parseFloat(set.weight) * repsValue;
          }
        }
      });
      if (workoutExercises[exerciseIndex]) {
        volumePerExercise[workoutExercises[exerciseIndex].name] = exerciseVolume;
      }
    });
    return volumePerExercise;
  };

  /**
   * Auto-save exerciseSets to AsyncStorage and WorkoutContext
   * Debounced to avoid saving on every keystroke
   */
  const autoSaveExerciseSets = useCallback((sets) => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule auto-save after 200ms of inactivity (reduced for faster saves)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        // Update WorkoutContext
        updateWorkout({
          exerciseSets: sets,
          exercises: workoutExercises,
          currentExerciseIndex: currentExerciseIndex
        });

        // Also directly save to AsyncStorage for immediate AI access
        const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
        if (activeWorkoutStr) {
          const currentWorkout = JSON.parse(activeWorkoutStr);
          currentWorkout.exerciseSets = sets;
          await AsyncStorage.setItem('@active_workout', JSON.stringify(currentWorkout));
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, 200); // 200ms debounce (faster than before)
  }, [updateWorkout, workoutExercises, currentExerciseIndex]);

  // Update set data - LOCAL ONLY, no context update to avoid refresh
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newSets = { ...exerciseSets };
    if (!newSets[exerciseIndex]) {
      newSets[exerciseIndex] = [{ weight: '', reps: '', completed: true }];
    }

    // Handle automatic dash insertion for reps
    if (field === 'reps') {
      // Remove any non-digit and non-dash characters
      let cleanedValue = value.replace(/[^0-9-]/g, '');

      // Get the current value from the sets
      const currentValue = newSets[exerciseIndex][setIndex].reps || '';

      // Check if we're adding a 3rd digit to a 2-digit number (no dash present)
      if (!currentValue.includes('-') && currentValue.length === 2 && cleanedValue.length === 3) {
        // Insert dash before the 3rd digit
        cleanedValue = `${cleanedValue.slice(0, 2)}-${cleanedValue.slice(2)}`;
      }

      // Prevent multiple dashes
      const dashCount = (cleanedValue.match(/-/g) || []).length;
      if (dashCount > 1) {
        // Keep only the first dash
        const firstDashIndex = cleanedValue.indexOf('-');
        cleanedValue = cleanedValue.slice(0, firstDashIndex + 1) +
                      cleanedValue.slice(firstDashIndex + 1).replace(/-/g, '');
      }

      // Limit numbers: max 2 digits before dash, max 2 digits after dash
      if (cleanedValue.includes('-')) {
        const parts = cleanedValue.split('-');
        if (parts[0] && parts[0].length > 2) {
          parts[0] = parts[0].slice(0, 2);
        }
        if (parts[1] && parts[1].length > 2) {
          parts[1] = parts[1].slice(0, 2);
        }
        cleanedValue = parts.join('-');
      } else {
        // No dash yet, limit to 2 digits (will auto-add dash on 3rd)
        if (cleanedValue.length > 2 && !value.includes('-')) {
          // This shouldn't happen due to logic above, but as safety
          cleanedValue = cleanedValue.slice(0, 2);
        }
      }

      value = cleanedValue;
    }

    newSets[exerciseIndex][setIndex][field] = value;

    // CRITICAL: Auto-mark as completed based on exercise type
    const currentSet = newSets[exerciseIndex][setIndex];
    const exercise = workoutExercises[exerciseIndex];
    const isBodyweight = isBodyweightExercise(exercise);

    const hasWeight = currentSet.weight && currentSet.weight.toString().trim() !== '';
    const hasReps = currentSet.reps && currentSet.reps.toString().trim() !== '';

    if (isBodyweight) {
      // Bodyweight exercises: only need reps to be completed
      if (hasReps) {
        newSets[exerciseIndex][setIndex].completed = true;
      } else {
        newSets[exerciseIndex][setIndex].completed = false;
      }
    } else {
      // Regular exercises: need both weight and reps
      if (hasWeight && hasReps) {
        newSets[exerciseIndex][setIndex].completed = true;
      } else {
        newSets[exerciseIndex][setIndex].completed = false;
      }
    }

    setExerciseSets(newSets);

    // Update totals if weight or reps changed
    if (field === 'weight' || field === 'reps') {
      const totals = calculateTotals(newSets);
      setTotalVolume(totals.volume);
      setTotalSets(totals.sets);
    }

    // CRITICAL: Auto-save after user stops typing (500ms debounce)
    autoSaveExerciseSets(newSets);
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

  // Handle superset pairing
  const handlePairSuperset = (exerciseIndex) => {
    setExerciseToPair(exerciseIndex);
    setShowSupersetPairModal(true);
  };

  // Apply superset pairing
  const applySupersetPair = (pairedExerciseIndex) => {
    if (exerciseToPair !== null && pairedExerciseIndex !== exerciseToPair) {
      // Create bidirectional pairing
      const newPairings = { ...supersetPairings };
      newPairings[exerciseToPair] = pairedExerciseIndex;
      newPairings[pairedExerciseIndex] = exerciseToPair;
      setSupersetPairings(newPairings);
    }
    setShowSupersetPairModal(false);
    setExerciseToPair(null);
  };

  // Remove superset pairing
  const removeSupersetPair = () => {
    if (exerciseToPair !== null) {
      const newPairings = { ...supersetPairings };
      const pairedIndex = newPairings[exerciseToPair];
      delete newPairings[exerciseToPair];
      if (pairedIndex !== undefined) {
        delete newPairings[pairedIndex];
      }
      setSupersetPairings(newPairings);
    }
    setShowSupersetPairModal(false);
    setExerciseToPair(null);
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

      // Check if this was the last exercise
      if (newExercises.length === 0) {
        // No exercises left - end the workout and go back
        Alert.alert(
          'Workout Empty',
          'You deleted the last exercise. Would you like to end this workout or add more exercises?',
          [
            {
              text: 'End Workout',
              onPress: () => {
                finishWorkout();
                setShowDeleteConfirmation(false);
                setExerciseToDelete(null);
              },
              style: 'destructive'
            },
            {
              text: 'Add Exercise',
              onPress: () => {
                setShowDeleteConfirmation(false);
                setExerciseToDelete(null);
                addAnotherExercise(); // Navigate to exercise library
              }
            },
            {
              text: 'Cancel',
              onPress: () => {
                setShowDeleteConfirmation(false);
                setExerciseToDelete(null);
              },
              style: 'cancel'
            }
          ]
        );
        return;
      }

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

      // CRITICAL: Adjust current index BEFORE updating context
      let newCurrentIndex = currentExerciseIndex;

      if (exerciseToDelete === currentExerciseIndex) {
        // Deleted the current exercise - move to the next one (or previous if it was the last)
        newCurrentIndex = Math.min(currentExerciseIndex, newExercises.length - 1);
      } else if (exerciseToDelete < currentExerciseIndex) {
        // Deleted an exercise before the current one - shift index down
        newCurrentIndex = currentExerciseIndex - 1;
      }
      // else: deleted an exercise after the current one - no change needed

      setCurrentExerciseIndex(newCurrentIndex);

      // Update workout context with new exercises, sets, AND current index
      updateWorkout({
        exercises: newExercises,
        exerciseSets: reindexedSets,
        currentExerciseIndex: newCurrentIndex
      });

      // Also save to AsyncStorage immediately
      const saveToStorage = async () => {
        try {
          const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
          if (activeWorkoutStr) {
            const currentWorkout = JSON.parse(activeWorkoutStr);
            currentWorkout.exercises = newExercises;
            currentWorkout.exerciseSets = reindexedSets;
            currentWorkout.currentExerciseIndex = newCurrentIndex;
            await AsyncStorage.setItem('@active_workout', JSON.stringify(currentWorkout));
          }
        } catch (error) {
          console.error('Failed to save after exercise deletion:', error);
        }
      };
      saveToStorage();
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
          screenName="WorkoutScreen"
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
    <View style={styles.headerStatsContainer}>
      {/* Show program info if from program */}
      {activeWorkout?.fromProgram && (
        <View style={styles.programInfoBar}>
          <Text style={styles.programInfoText}>
            {activeWorkout.programName} • {activeWorkout.dayName}
          </Text>
        </View>
      )}

      {/* Volume and Sets - Two columns */}
      <View style={styles.headerStatsRow}>
        <View style={styles.headerStatBox}>
          <Text style={styles.headerStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {totalVolume.toLocaleString()}
          </Text>
          <Text style={styles.headerStatLabel}>VOLUME</Text>
        </View>

        <View style={styles.headerStatBox}>
          <Text style={styles.headerStatValue} numberOfLines={1}>
            {totalSets}
          </Text>
          <Text style={styles.headerStatLabel}>SETS</Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <ScreenLayout
        title={<WorkoutStatsHeader />}
        subtitle={null}
        navigation={navigation}
        showBack={false}
        scrollable={true}
        hideWorkoutIndicator={true}
        screenName="WorkoutScreen"
      >
      {/* Workout Timer Card - Split Layout */}
      <View style={styles.workoutTimerCard}>
        {/* Left Section: Workout Timer (centered in this space) */}
        <View style={styles.workoutTimerSection}>
          <TouchableOpacity
            style={styles.workoutTimerMain}
            onPress={toggleWorkoutPause}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isWorkoutPaused ? 'play' : 'pause'}
              size={28}
              color={isWorkoutPaused ? '#FF9800' : Colors.primary}
            />
            <Text style={[
              styles.workoutTimerText,
              isWorkoutPaused && styles.workoutTimerPaused
            ]}>
              {getElapsedTime()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Section: Rest Timer (centered vertically) */}
        <View style={styles.restTimerSection}>
          <TouchableOpacity
            style={styles.restTimerButton}
            onPress={() => setShowRestTimerModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="timer-outline"
              size={18}
              color={isRestTimerRunning ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.restTimerButtonText,
              isRestTimerRunning && styles.restTimerButtonActive
            ]}>
              {restTimer > 0 ? formatRestTimer(restTimer) : formatRestTimer(restTargetSeconds)}
            </Text>
          </TouchableOpacity>
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
            onPairSuperset={handlePairSuperset}
            supersetPairIndex={supersetPairings[index]}
            fromProgram={activeWorkout?.fromProgram || false}
            rpeEnabled={rpeEnabled}
            onStartCardioTimer={startCardioTimer}
            onPauseCardioTimer={pauseCardioTimer}
            cardioTimers={cardioTimers}
            onMoveUp={moveExerciseUp}
            onMoveDown={moveExerciseDown}
            canMoveUp={index > 0}
            canMoveDown={index < workoutExercises.length - 1}
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
              <Ionicons name="sparkles" size={20} color={Colors.background} />
              <Text style={[styles.actionButtonText, styles.aiButtonText]}>Ask AI Assistant</Text>
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

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimerModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rest Timer</Text>

            <View style={styles.restTimerModalDisplay}>
              <Text style={styles.restTimerModalText}>
                {restTimer > 0 ? formatRestTimer(restTimer) : formatRestTimer(restTargetSeconds)}
              </Text>
            </View>

            <View style={styles.restTimerModalControls}>
              <TouchableOpacity
                style={styles.restTimerModalButton}
                onPress={() => {
                  stopRestTimer();
                  // Reset to the target time (not hardcoded to 60)
                  startRestTimer();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={24} color={Colors.text} />
                <Text style={styles.restTimerModalButtonLabel}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.restTimerModalButton}
                onPress={() => {
                  setShowRestTimerModal(false);
                  openTimerPicker();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={24} color={Colors.text} />
                <Text style={styles.restTimerModalButtonLabel}>Set Time</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.restTimerModalButton, styles.restTimerModalButtonPrimary]}
                onPress={() => {
                  if (isRestTimerRunning) {
                    pauseRestTimer();
                  } else {
                    // Resume from current time if paused, otherwise start from target
                    startRestTimer(restTimer > 0 ? restTimer : restTargetSeconds);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isRestTimerRunning ? 'pause' : 'play'}
                  size={24}
                  color={Colors.background}
                />
                <Text style={[styles.restTimerModalButtonLabel, styles.restTimerModalButtonLabelPrimary]}>
                  {isRestTimerRunning ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary,
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 12,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setShowRestTimerModal(false)}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                Close
              </Text>
            </TouchableOpacity>
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

      {/* AI Workout Assistant Modal */}
      <AIButtonModal
        visible={showAIAssistant}
        onClose={async () => {
          setShowAIAssistant(false);
          // Reload workout from AsyncStorage after AI makes changes
          try {
            const updatedWorkoutStr = await AsyncStorage.getItem('@active_workout');
            if (updatedWorkoutStr && activeWorkout) {
              const updatedWorkout = JSON.parse(updatedWorkoutStr);

              // Update WorkoutContext
              updateWorkout(updatedWorkout);

              // IMPORTANT: Also update local exerciseSets state so UI reflects changes
              if (updatedWorkout.exerciseSets) {
                setExerciseSets(updatedWorkout.exerciseSets);

                // Recalculate totals
                const totals = calculateTotals(updatedWorkout.exerciseSets);
                setTotalVolume(totals.volume);
                setTotalSets(totals.sets);
              }
            }
          } catch (error) {
            console.error('Failed to reload workout after AI changes:', error);
          }
        }}
        screenName="WorkoutAssistant"
      />

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
              style={[styles.setTypeOption, styles.supersetOption]}
              onPress={() => applySetType('superset')}
            >
              <View style={[styles.setTypeColorIndicator, { backgroundColor: '#3498DB' }]} />
              <Text style={styles.setTypeOptionText}>Superset</Text>
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

      {/* Superset Pairing Modal */}
      <Modal
        visible={showSupersetPairModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.setTypeModalContent}>
            <Text style={styles.modalTitle}>Pair Superset With...</Text>
            <Text style={styles.modalSubtitle}>
              {exerciseToPair !== null ? workoutExercises[exerciseToPair]?.name : ''}
            </Text>

            <ScrollView style={styles.supersetPairList}>
              {workoutExercises.map((ex, index) => {
                if (index === exerciseToPair) return null; // Don't show the exercise we're pairing

                return (
                  <TouchableOpacity
                    key={`pair-option-${index}`}
                    style={[
                      styles.supersetPairOption,
                      supersetPairings[exerciseToPair] === index && styles.supersetPairOptionActive
                    ]}
                    onPress={() => applySupersetPair(index)}
                  >
                    <View style={styles.supersetPairOptionContent}>
                      <Text style={styles.supersetPairNumber}>{index + 1}</Text>
                      <Text style={styles.supersetPairExerciseName}>{ex.name}</Text>
                    </View>
                    {supersetPairings[index] !== undefined && supersetPairings[index] !== exerciseToPair && (
                      <Text style={styles.supersetPairAlreadyPaired}>
                        Paired with #{supersetPairings[index] + 1}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {supersetPairings[exerciseToPair] !== undefined && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={removeSupersetPair}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextDanger]}>Remove Pairing</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSupersetPairModal(false)}
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
  // Program Info Styles
  programInfoBar: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  programInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Header Stats Styles - Single Row Layout
  headerStatsContainer: {
    width: '100%',
  },
  headerTimerText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  headerTimerPaused: {
    color: '#FF9800',
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerStatBox: {
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Rest Timer Icon in Header Styles
  restTimerIconBox: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  restTimerIconText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  restTimerIconActive: {
    color: Colors.primary,
  },
  // Workout Timer Card Styles (split layout)
  workoutTimerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingVertical: 20,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTimerSection: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTimerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTimerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  workoutTimerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  workoutTimerPaused: {
    color: '#FF9800',
  },
  restTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  restTimerButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  restTimerButtonActive: {
    color: Colors.primary,
  },
  // Rest Timer Modal Styles
  restTimerModalDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginVertical: 16,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restTimerModalText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  restTimerModalControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  restTimerModalButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  restTimerModalButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  restTimerModalButtonLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'uppercase',
  },
  restTimerModalButtonLabelPrimary: {
    color: Colors.background,
  },
  // Old rest timer styles (kept for reference, can be removed)
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
  supersetPairedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  supersetBadgeRow: {
    backgroundColor: '#3498DB' + '10',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  supersetBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: '#3498DB',
    fontWeight: '600',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
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
    alignItems: 'center',
  },
  setHeaderText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 2,
  },
  rpeHeaderText: {
    flex: 0.7,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: 2,
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
    marginHorizontal: 2,
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
    paddingHorizontal: 4,
    marginHorizontal: 2,
    textAlign: 'center',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repsInput: {
    flex: 1,     // Same as other inputs, not bigger
  },
  programRepsInput: {
    borderColor: Colors.primary + '50',
    backgroundColor: Colors.primary + '10',
  },
  rpeInput: {
    flex: 0.7,     // Smaller for RPE
    marginHorizontal: 2,
  },
  completeButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
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
  weightInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInputWithButton: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  platePickerButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderTopRightRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  weightTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  weightTouchableText: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    flex: 1,
  },
  weightTouchablePlaceholder: {
    color: Colors.textMuted,
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
  },
  exerciseListNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Spacing.sm,
    width: 30,
  },
  exerciseListName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    flexShrink: 1,
  },
  actionIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconText: {
    fontSize: 18,
    color: Colors.text,
  },
  pairButtonActive: {
    backgroundColor: '#3498DB' + '20',
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
    marginBottom: Spacing.xxl * 2, // Extra padding to ensure buttons are always visible
    paddingBottom: Spacing.lg, // Additional padding for safety
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
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
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
    borderColor: Colors.primary,
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
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
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
  supersetOption: {
    borderColor: '#3498DB',
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
  // Cardio-specific styles
  cardioDurationText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  cardioTimerButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioTimerButtonText: {
    fontSize: 16,
    color: Colors.background,
  },
  // Superset Pairing Modal Styles
  modalSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  supersetPairList: {
    maxHeight: 300,
    marginBottom: Spacing.md,
  },
  supersetPairOption: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supersetPairOptionActive: {
    borderColor: '#3498DB',
    backgroundColor: '#3498DB' + '10',
  },
  supersetPairOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supersetPairNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Spacing.md,
    minWidth: 30,
  },
  supersetPairExerciseName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  supersetPairAlreadyPaired: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  // Reorder button styles
  reorderButtons: {
    flexDirection: 'column',
    marginRight: Spacing.sm,
    gap: 2,
  },
  reorderButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
});