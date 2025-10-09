import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  BackHandler,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const STORAGE_KEY = '@temp_program_state';
const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

// Helper function to detect if exercise is cardio
const isCardioExercise = (exercise) => {
  if (!exercise || !exercise.id) return false;
  const cardioKeywords = ['running', 'jogging', 'treadmill', 'walking', 'cardio', 'cycling', 'biking'];
  const id = exercise.id.toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  return cardioKeywords.some(keyword => id.includes(keyword) || name.includes(keyword));
};

export default function WorkoutDayEditScreen({ navigation, route }) {
  const [dayData, setDayData] = useState(null);
  const [dayIndex, setDayIndex] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [selectedSetForType, setSelectedSetForType] = useState({ exerciseIndex: null, setIndex: null });
  const [rpeEnabled, setRpeEnabled] = useState(false);
  const [isStandaloneWorkout, setIsStandaloneWorkout] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedDate, setPlannedDate] = useState(null);
  const lastProcessedExercise = useRef(null);
  const isFocused = useIsFocused();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Prevent back navigation when there are unsaved changes
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasUnsavedChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Do you want to save before leaving?',
          [
            { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save', onPress: () => handleSaveAndReturn() },
          ]
        );
        return true; // Prevent default back behavior
      }
      return false; // Allow back if no changes
    });

    return () => backHandler.remove();
  }, [hasUnsavedChanges]);

  // Load RPE setting
  useEffect(() => {
    const loadRPESetting = async () => {
      try {
        const savedRpeEnabled = await AsyncStorage.getItem('@rpe_enabled');
        if (savedRpeEnabled !== null) {
          setRpeEnabled(savedRpeEnabled === 'true');
        }
      } catch (error) {
        console.error('Error loading RPE setting:', error);
      }
    };
    loadRPESetting();
  }, []);

  // Load the day data
  useEffect(() => {
    loadDayData();
  }, [isFocused, route.params?.dayIndex]);

  const loadDayData = async () => {
    try {
      // Check if a standalone workout was passed directly via route params
      if (route.params?.standaloneWorkout) {
        const workout = route.params.standaloneWorkout;
        setDayIndex(0);
        setDayData(workout.day); // Standalone workouts use 'day' property
        setProgramData({
          programName: workout.name,
          programDescription: workout.description || '',
          workoutDays: [workout.day], // Wrap in array for consistency
          workoutId: workout.id
        });
        setIsStandaloneWorkout(true);
        return;
      }

      // Otherwise, load from temp storage
      const tempState = await AsyncStorage.getItem(STORAGE_KEY);
      if (tempState) {
        const parsed = JSON.parse(tempState);
        const index = route.params?.dayIndex !== undefined ? route.params.dayIndex : parsed.currentDayIndex;

        if (index !== undefined && parsed.workoutDays && parsed.workoutDays[index]) {
          setDayIndex(index);
          setDayData(parsed.workoutDays[index]);
          setProgramData(parsed);

          // Check if this is a standalone workout (only one day)
          setIsStandaloneWorkout(parsed.workoutDays.length === 1);

          // Check if we're in planning mode
          console.log('Loading day data - fromPlanning:', parsed.fromPlanning, 'plannedDate:', parsed.plannedDate);
          if (parsed.fromPlanning) {
            setIsPlanning(true);
            setPlannedDate(parsed.plannedDate);
            console.log('Planning mode activated for date:', parsed.plannedDate);
          }
        }
      }
    } catch (error) {
      console.error('Error loading day data:', error);
    }
  };

  // Handle adding exercise from navigation
  useEffect(() => {
    const addExerciseIfNeeded = async () => {
      if (route.params?.exercise && dayData && programData && dayIndex !== null) {
        const exercise = route.params.exercise;
        const exerciseKey = `${exercise.id}_${route.params?.refresh || ''}`;

        // Check if we already processed this exact exercise instance
        if (lastProcessedExercise.current === exerciseKey) {
          return; // Skip duplicate
        }

        lastProcessedExercise.current = exerciseKey;

        // Check if this is a cardio exercise
        const isCardio = isCardioExercise(exercise);

        // Allow adding same exercise multiple times - each gets unique ID
        const exerciseToAdd = {
          ...exercise,
          uniqueId: Date.now().toString(),
          sets: isCardio
            ? [{ type: 'normal', duration: '30' }]  // Cardio: duration in minutes
            : [{ type: 'normal', reps: '10', rpe: '' }]  // Regular: reps
        };

        const updatedDay = {
          ...dayData,
          exercises: [...(dayData.exercises || []), exerciseToAdd]
        };

        setDayData(updatedDay);
        await saveChanges(updatedDay);

        // Clear the params after successful add
        navigation.setParams({ exercise: undefined });
      }
    };

    addExerciseIfNeeded();
  }, [route.params?.exercise, route.params?.refresh, dayData, programData, dayIndex]);

  const saveChanges = async (updatedDay) => {
    if (!programData || dayIndex === null) {
      return;
    }

    try {
      setHasUnsavedChanges(true); // Mark as having unsaved changes

      const updatedDays = [...programData.workoutDays];
      updatedDays[dayIndex] = updatedDay || dayData;

      const updatedProgram = {
        ...programData,
        workoutDays: updatedDays
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProgram));
      setProgramData(updatedProgram);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const addSet = (exerciseIndex) => {
    if (!dayData || !dayData.exercises[exerciseIndex]) return;

    const updatedExercises = [...dayData.exercises];
    if (!updatedExercises[exerciseIndex].sets) {
      updatedExercises[exerciseIndex].sets = [];
    }

    // Check if this is a cardio exercise
    const isCardio = isCardioExercise(updatedExercises[exerciseIndex]);

    // Add appropriate set type
    const newSet = isCardio
      ? { type: 'normal', duration: '30' }  // Cardio: duration in minutes
      : { type: 'normal', reps: '10', rpe: '' };  // Regular: reps

    updatedExercises[exerciseIndex].sets.push(newSet);

    const updatedDay = { ...dayData, exercises: updatedExercises };
    setDayData(updatedDay);
    saveChanges(updatedDay);
  };

  const removeSet = (exerciseIndex, setIndex) => {
    if (!dayData || !dayData.exercises[exerciseIndex]) return;

    const updatedExercises = [...dayData.exercises];
    if (updatedExercises[exerciseIndex].sets && updatedExercises[exerciseIndex].sets.length > 1) {
      updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
      const updatedDay = { ...dayData, exercises: updatedExercises };
      setDayData(updatedDay);
      saveChanges(updatedDay);
    }
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    if (!dayData || !dayData.exercises[exerciseIndex]) return;

    const updatedExercises = [...dayData.exercises];
    if (updatedExercises[exerciseIndex].sets && updatedExercises[exerciseIndex].sets[setIndex]) {
      // Handle automatic dash insertion for reps
      if (field === 'reps') {
        // Remove any non-digit and non-dash characters
        let cleanedValue = value.replace(/[^0-9-]/g, '');

        // Get the current value from the sets
        const currentValue = updatedExercises[exerciseIndex].sets[setIndex].reps || '';

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

      updatedExercises[exerciseIndex].sets[setIndex][field] = value;
      const updatedDay = { ...dayData, exercises: updatedExercises };
      setDayData(updatedDay);
      saveChanges(updatedDay);
    }
  };

  const removeExercise = (exerciseIndex) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = [...dayData.exercises];
            updatedExercises.splice(exerciseIndex, 1);
            const updatedDay = { ...dayData, exercises: updatedExercises };
            setDayData(updatedDay);
            saveChanges(updatedDay);
          }
        }
      ]
    );
  };

  const getSetTypeColor = (type) => {
    switch(type) {
      case 'warmup': return '#FFA500';
      case 'dropset': return '#9B59B6';
      case 'failure': return '#E74C3C';
      case 'superset': return '#3498DB';
      default: return Colors.primary;
    }
  };

  const getSetTypeLabel = (type) => {
    switch(type) {
      case 'warmup': return 'W';
      case 'dropset': return 'D';
      case 'failure': return 'F';
      case 'superset': return 'S';
      default: return 'N';
    }
  };

  const handleAddAnotherExercise = () => {
    // Store the previously selected muscle groups if available
    let muscleGroups = route.params?.lastSelectedMuscleGroups;

    // If no muscle groups from previous selection, try to infer from day name
    if (!muscleGroups || muscleGroups.length === 0) {
      const dayNameLower = dayData?.name?.toLowerCase() || '';

      if (dayNameLower.includes('push')) {
        muscleGroups = ['chest', 'shoulders', 'triceps'];
      } else if (dayNameLower.includes('pull')) {
        muscleGroups = ['back', 'biceps'];
      } else if (dayNameLower.includes('leg')) {
        muscleGroups = ['legs'];
      } else if (dayNameLower.includes('upper')) {
        muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
      } else if (dayNameLower.includes('lower')) {
        muscleGroups = ['legs', 'abs'];
      } else if (dayNameLower.includes('arm')) {
        muscleGroups = ['biceps', 'triceps'];
      } else if (dayNameLower.includes('chest')) {
        muscleGroups = ['chest'];
      } else if (dayNameLower.includes('back')) {
        muscleGroups = ['back'];
      } else if (dayNameLower.includes('shoulder')) {
        muscleGroups = ['shoulders'];
      }
    }

    if (muscleGroups && muscleGroups.length > 0) {
      // Skip muscle group selection and go directly to exercise list
      navigation.navigate('ExerciseList', {
        selectedMuscleGroups: muscleGroups,
        fromProgramDayEdit: true,
        programDayIndex: dayIndex,
        refresh: Date.now()
      });
    } else {
      // First time and can't infer - need to select muscle groups
      navigation.navigate('MuscleGroupSelection', {
        fromProgramDayEdit: true,
        programDayIndex: dayIndex,
        refresh: Date.now()
      });
    }
  };

  const handleBackToProgram = () => {
    navigation.navigate('WorkoutProgram', { refresh: Date.now() });
  };

  const handleSaveAndReturn = async () => {
    if (!dayData || !dayData.exercises || dayData.exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise before saving');
      return;
    }

    setHasUnsavedChanges(false); // Clear unsaved changes flag

    try {
      // Check if editing from program day selection screen
      const editingProgramDay = route.params?.dayIndex !== undefined && programData?.programName;
      const fromWorkoutDetail = route.params?.fromWorkoutDetail;
      const workoutId = route.params?.workoutId || programData?.workoutId;
      const programId = route.params?.programId || programData?.programId;

      if (fromWorkoutDetail && workoutId) {
        // Editing standalone workout - update in storage
        const existingWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        const workoutIndex = workouts.findIndex(w => w.id === workoutId);
        if (workoutIndex !== -1) {
          workouts[workoutIndex] = {
            ...workouts[workoutIndex],
            day: dayData,
            updatedAt: new Date().toISOString(),
          };

          await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(workouts));
          await AsyncStorage.removeItem(STORAGE_KEY);

          Alert.alert('Success', 'Workout saved successfully!', [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 2,
                  routes: [
                    { name: 'Main' },
                    { name: 'MyPlans' },
                    {
                      name: 'WorkoutDetail',
                      params: { workout: workouts[workoutIndex] }
                    },
                  ],
                });
              }
            }
          ]);
        }
      } else if (editingProgramDay && programId) {
        // Editing program day - update program in storage
        const WORKOUT_PROGRAMS_KEY = '@workout_programs';
        const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);

        if (storedPrograms) {
          const programs = JSON.parse(storedPrograms);
          const programIndex = programs.findIndex(p => p.id === programId);

          if (programIndex !== -1) {
            // Update the specific day
            programs[programIndex].days[dayIndex] = dayData;
            programs[programIndex].updatedAt = new Date().toISOString();

            await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs));
            await AsyncStorage.removeItem(STORAGE_KEY);

            Alert.alert('Success', 'Day saved successfully!', [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 2,
                    routes: [
                      { name: 'Main' },
                      { name: 'MyPlans' },
                      {
                        name: 'ProgramDaySelection',
                        params: { program: programs[programIndex] }
                      },
                    ],
                  });
                }
              }
            ]);
          }
        }
      } else {
        // Fallback to back to program
        handleBackToProgram();
      }
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleSaveStandaloneWorkout = () => {
    if (!dayData || !dayData.exercises || dayData.exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    // Check if name exists in programData
    if (programData?.programName && programData.programName.trim()) {
      // Name already exists, save directly
      performSave(programData.programName, programData.programDescription || '');
    } else {
      // No name, show modal to enter name
      setShowNameModal(true);
    }
  };

  const performSave = async (name, description) => {
    try {
      console.log('performSave - isPlanning:', isPlanning, 'plannedDate:', plannedDate);

      // Check if we're editing an existing workout
      const workoutId = route.params?.workoutId || programData?.workoutId;
      const fromWorkoutDetail = route.params?.fromWorkoutDetail;

      if (fromWorkoutDetail && workoutId) {
        // Editing existing standalone workout
        const existingWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        const workoutIndex = workouts.findIndex(w => w.id === workoutId);
        if (workoutIndex !== -1) {
          workouts[workoutIndex] = {
            ...workouts[workoutIndex],
            name: name,
            description: description,
            day: dayData,
            updatedAt: new Date().toISOString(),
          };

          await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(workouts));
          await AsyncStorage.removeItem(STORAGE_KEY);

          Alert.alert('Success', 'Workout updated successfully!', [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('MyPlans');
              }
            }
          ]);
        }
      } else if (isPlanning && plannedDate) {
        // Save as BOTH planned workout AND standalone workout
        const PLANNED_WORKOUTS_KEY = '@planned_workouts';
        const dateKey = new Date(plannedDate).toISOString().split('T')[0];

        // 1. Save to planned workouts for the calendar
        const plannedWorkouts = await AsyncStorage.getItem(PLANNED_WORKOUTS_KEY);
        const planned = plannedWorkouts ? JSON.parse(plannedWorkouts) : {};

        console.log('Saving planned workout for date:', dateKey);
        console.log('Workout data:', { name, description, exercises: dayData.exercises });

        planned[dateKey] = {
          type: 'custom',
          workoutName: name,
          workoutDescription: description,
          exercises: dayData.exercises || [],
          plannedDate: dateKey,
          createdAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(PLANNED_WORKOUTS_KEY, JSON.stringify(planned));
        console.log('Planned workout saved to calendar');

        // 2. ALSO save as standalone workout in My Plans
        const existingWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        const newWorkout = {
          id: Date.now().toString(),
          name: name,
          description: description,
          day: dayData,
          createdAt: new Date().toISOString(),
        };

        workouts.push(newWorkout);
        await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(workouts));
        console.log('Workout also saved to My Plans');

        // Clear temporary state
        await AsyncStorage.removeItem(STORAGE_KEY);

        Alert.alert('Success', 'Workout planned successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to WorkoutHistory (calendar)
              navigation.navigate('WorkoutHistory');
            },
          }
        ]);
      } else {
        // Save as standalone workout
        const existingWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        const newWorkout = {
          id: Date.now().toString(),
          name: name,
          description: description,
          day: dayData,
          createdAt: new Date().toISOString(),
        };

        workouts.push(newWorkout);
        await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(workouts));

        // Clear temporary state
        await AsyncStorage.removeItem(STORAGE_KEY);

        Alert.alert('Success', 'Workout saved successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Main' },
                  { name: 'MyPlans' }
                ],
              });
            }
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isPlanning ? 'plan' : 'save'} workout`);
      console.error(error);
    }
  };

  const handleConfirmName = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    setShowNameModal(false);
    performSave(workoutName, workoutDescription);
  };

  const applySetType = (type) => {
    const { exerciseIndex, setIndex } = selectedSetForType;
    if (exerciseIndex !== null && setIndex !== null) {
      updateSet(exerciseIndex, setIndex, 'type', type);
    }
    setShowSetTypeModal(false);
    setSelectedSetForType({ exerciseIndex: null, setIndex: null });
  };

  if (!dayData) {
    return (
      <ScreenLayout
        title="Loading..."
        navigation={navigation}
        showBack={true}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout day...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <>
      <ScreenLayout
        title={dayData.name}
        subtitle={`${dayData.exercises?.length || 0} exercises`}
        navigation={navigation}
        showBack={true}
        gestureEnabled={!hasUnsavedChanges}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {(!dayData.exercises || dayData.exercises.length === 0) ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💪</Text>
            <Text style={styles.emptyStateTitle}>No exercises yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first exercise to get started
            </Text>
            <StyledButton
              title="Add Exercise"
              onPress={handleAddAnotherExercise}
              style={styles.emptyStateButton}
            />
          </View>
        ) : (
          <>
            {dayData.exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.uniqueId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleContainer}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMuscle}>
                      {exercise.primaryMuscle}
                      {exercise.equipment && ` • ${exercise.equipment}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeExercise(exerciseIndex)}
                    style={styles.removeExerciseButton}
                  >
                    <Text style={styles.removeExerciseText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.setsContainer}>
                  <Text style={styles.setsTitle}>Sets</Text>

                  {exercise.sets && exercise.sets.map((set, setIndex) => {
                    const isCardio = isCardioExercise(exercise);

                    return (
                    <View key={setIndex} style={styles.setRow}>
                      {/* Set Number with Type - Clickable for Modal */}
                      <TouchableOpacity
                        style={[
                          styles.setTypeButton,
                          {
                            backgroundColor: getSetTypeColor(set.type) + '20',
                            borderColor: getSetTypeColor(set.type)
                          }
                        ]}
                        onPress={() => {
                          setSelectedSetForType({ exerciseIndex, setIndex });
                          setShowSetTypeModal(true);
                        }}
                      >
                        <Text style={[styles.setTypeText, { color: getSetTypeColor(set.type) }]}>
                          {setIndex + 1}
                        </Text>
                      </TouchableOpacity>

                      {isCardio ? (
                        // Cardio Exercise - Show Duration input
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.setInput}
                            value={set.duration}
                            onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'duration', text)}
                            placeholder="30"
                            keyboardType="numeric"
                            maxLength={3}
                            placeholderTextColor={Colors.textSecondary}
                          />
                          <Text style={styles.inputLabel}>min</Text>
                        </View>
                      ) : (
                        <>
                          {/* RPE Input (if enabled) */}
                          {rpeEnabled && (
                            <View style={styles.inputContainer}>
                              <TextInput
                                style={styles.setInput}
                                value={set.rpe}
                                onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'rpe', text)}
                                placeholder="1-10"
                                keyboardType="numeric"
                                maxLength={2}
                                placeholderTextColor={Colors.textSecondary}
                              />
                              <Text style={styles.inputLabel}>RPE</Text>
                            </View>
                          )}

                          {/* Reps Input */}
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.setInput}
                              value={set.reps}
                              onChangeText={(text) => updateSet(exerciseIndex, setIndex, 'reps', text)}
                              placeholder="10"
                              keyboardType="numeric"
                              maxLength={5}
                              placeholderTextColor={Colors.textSecondary}
                            />
                            <Text style={styles.inputLabel}>reps</Text>
                          </View>
                        </>
                      )}

                      {/* Remove Set Button */}
                      {exercise.sets.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeSet(exerciseIndex, setIndex)}
                          style={styles.removeSetButton}
                        >
                          <Text style={styles.removeSetText}>−</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                  })}

                  {/* Add Set Button */}
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => addSet(exerciseIndex)}
                  >
                    <Text style={styles.addSetText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddAnotherExercise}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary, '#059669']}
                style={styles.addExerciseGradient}
              >
                <Text style={styles.addExerciseIcon}>+</Text>
                <Text style={styles.addExerciseText}>Add Another Exercise</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Universal Save Button */}
        {dayData.exercises && dayData.exercises.length > 0 && (
          <StyledButton
            title="Save Changes"
            onPress={isStandaloneWorkout && !route.params?.fromWorkoutDetail ? handleSaveStandaloneWorkout : handleSaveAndReturn}
            style={styles.saveButton}
          />
        )}
      </ScrollView>
    </ScreenLayout>

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
            <View style={[styles.setTypeColorIndicator, { backgroundColor: Colors.primary }]} />
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

    {/* Name Workout Modal */}
    <Modal
      visible={showNameModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowNameModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.nameModalContent}>
          <Text style={styles.modalTitle}>{isPlanning ? 'Plan Your Workout' : 'Name Your Workout'}</Text>

          <Text style={styles.modalLabel}>Workout Name</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g., Upper Body Blast"
            placeholderTextColor={Colors.textSecondary}
            value={workoutName}
            onChangeText={setWorkoutName}
            autoFocus
          />

          <Text style={styles.modalLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            placeholder="Add details about this workout..."
            placeholderTextColor={Colors.textSecondary}
            value={workoutDescription}
            onChangeText={setWorkoutDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowNameModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleConfirmName}
            >
              <Text style={styles.modalConfirmText}>{isPlanning ? 'Plan Workout' : 'Save Workout'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    minWidth: 150,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseMuscle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  removeExerciseButton: {
    padding: Spacing.xs,
  },
  removeExerciseText: {
    color: Colors.error,
    fontSize: 28,
    fontWeight: 'bold',
  },
  setsContainer: {
    marginTop: Spacing.sm,
  },
  setsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  setNumber: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    width: 25,
    fontWeight: '600',
  },
  setTypeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  setTypeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  setInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    minWidth: 55,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
    minWidth: 30,
  },
  removeSetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    flexShrink: 0,
  },
  removeSetText: {
    color: Colors.error,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addSetButton: {
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    width: 120,  // Same width as reps input
  },
  addSetText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  addExerciseButton: {
    marginVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  addExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  addExerciseIcon: {
    fontSize: 20,
    color: Colors.background,
    marginRight: Spacing.sm,
  },
  addExerciseText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backButton: {
    marginBottom: Spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
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
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  setTypeOptionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  cancelButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  nameModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
});