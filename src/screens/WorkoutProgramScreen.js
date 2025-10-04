import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const STORAGE_KEY = '@workout_programs';
const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function WorkoutProgramScreen({ navigation, route }) {
  const { isStandaloneWorkout = false, fromPlanning = false, plannedDate = null } = route.params || {};
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [workoutDays, setWorkoutDays] = useState([]);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(null);
  const [dayName, setDayName] = useState('');
  const isFocused = useIsFocused();

  const dayTemplates = [
    { name: 'Push Day', muscles: ['chest', 'shoulders', 'triceps'] },
    { name: 'Pull Day', muscles: ['back', 'biceps'] },
    { name: 'Leg Day', muscles: ['legs'] },
    { name: 'Upper Body', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
    { name: 'Lower Body', muscles: ['legs', 'abs'] },
    { name: 'Full Body', muscles: ['chest', 'back', 'legs', 'shoulders'] },
    { name: 'Arms & Abs', muscles: ['biceps', 'triceps', 'abs'] },
  ];

  // Auto-create a day for standalone workouts and clear any cached state
  useEffect(() => {
    const initStandaloneWorkout = async () => {
      if (isStandaloneWorkout && workoutDays.length === 0 && !route.params?.stateLoaded) {
        // Clear any previous temp state to prevent bench press bug
        await AsyncStorage.removeItem('@temp_program_state');

        setWorkoutDays([{
          id: Date.now().toString(),
          name: 'Workout',
          exercises: [],
        }]);
      }
    };

    initStandaloneWorkout();
  }, [isStandaloneWorkout]);

  // Load temporary state on mount and when focused
  useEffect(() => {
    const loadTempState = async () => {
      try {
        // Skip loading temp state for new standalone workouts
        if (isStandaloneWorkout && !route.params?.editMode) {
          return;
        }

        const tempState = await AsyncStorage.getItem('@temp_program_state');
        if (tempState && !route.params?.stateLoaded) {
          const parsed = JSON.parse(tempState);
          setProgramName(parsed.programName || '');
          setProgramDescription(parsed.programDescription || '');
          // Ensure each day has an exercises array
          const days = (parsed.workoutDays || []).map(day => ({
            ...day,
            exercises: day.exercises || []
          }));
          setWorkoutDays(days);
          navigation.setParams({ stateLoaded: true });
        }
      } catch (error) {
        console.error('Error loading temp state:', error);
      }
    };

    if (isFocused) {
      loadTempState();
    }
  }, [isFocused]);

  // Clean up global callback when component unmounts
  useEffect(() => {
    return () => {
      if (global.addExerciseToProgramDay) {
        delete global.addExerciseToProgramDay;
      }
      if (global.currentProgramDayIndex !== undefined) {
        delete global.currentProgramDayIndex;
      }
    };
  }, []);

  const handleAddDay = () => {
    if (!dayName.trim()) {
      Alert.alert('Error', 'Please enter a day name');
      return;
    }

    const newDay = {
      id: Date.now().toString(),
      name: dayName,
      exercises: [],
    };

    setWorkoutDays([...workoutDays, newDay]);
    setDayName('');
    setShowAddDayModal(false);
  };

  const handleNavigateToExerciseSelection = async (dayIndex) => {
    // Ensure workoutDays has proper structure
    const daysToSave = workoutDays.map(day => ({
      ...day,
      exercises: day.exercises || []
    }));

    // Save the current program state temporarily
    try {
      await AsyncStorage.setItem('@temp_program_state', JSON.stringify({
        programName,
        programDescription,
        workoutDays: daysToSave,
        currentDayIndex: dayIndex,
        fromPlanning,
        plannedDate
      }));

      // Navigate to day edit screen if there are exercises, otherwise to muscle selection
      if (daysToSave[dayIndex] && daysToSave[dayIndex].exercises && daysToSave[dayIndex].exercises.length > 0) {
        // Go directly to day edit screen
        navigation.navigate('WorkoutDayEdit', {
          dayIndex: dayIndex,
          refresh: Date.now()
        });
      } else {
        // Navigate to muscle group selection to add first exercise
        navigation.navigate('MuscleGroupSelection', {
          fromProgramCreation: true,
          programDayIndex: dayIndex,
          refresh: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving temp state:', error);
      Alert.alert('Error', 'Failed to save current state');
    }
  };

  const handleRemoveExercise = (dayIndex, exerciseIndex) => {
    const updatedDays = [...workoutDays];
    if (updatedDays[dayIndex] && updatedDays[dayIndex].exercises) {
      updatedDays[dayIndex].exercises.splice(exerciseIndex, 1);
      setWorkoutDays(updatedDays);
    }
  };

  const handleRemoveDay = (dayIndex) => {
    Alert.alert(
      'Remove Day',
      'Are you sure you want to remove this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedDays = [...workoutDays];
            updatedDays.splice(dayIndex, 1);
            setWorkoutDays(updatedDays);
          },
        },
      ]
    );
  };

  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      Alert.alert('Error', `Please enter a ${isStandaloneWorkout ? 'workout' : 'program'} name`);
      return;
    }

    if (workoutDays.length === 0) {
      Alert.alert('Error', 'Please add at least one workout day');
      return;
    }

    const hasExercises = workoutDays.some(day => day.exercises.length > 0);
    if (!hasExercises) {
      Alert.alert('Error', 'Please add exercises to at least one day');
      return;
    }

    try {
      if (isStandaloneWorkout) {
        // Save as standalone workout
        const existingWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        const newWorkout = {
          id: Date.now().toString(),
          name: programName,
          description: programDescription,
          day: workoutDays[0], // Only one day for standalone workouts
          createdAt: new Date().toISOString(),
        };

        workouts.push(newWorkout);
        await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(workouts));

        // Clear temporary state
        await AsyncStorage.removeItem('@temp_program_state');

        Alert.alert('Success', 'Workout saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Save as program
        const existingPrograms = await AsyncStorage.getItem(STORAGE_KEY);
        const programs = existingPrograms ? JSON.parse(existingPrograms) : [];

        const newProgram = {
          id: Date.now().toString(),
          name: programName,
          description: programDescription,
          days: workoutDays,
          createdAt: new Date().toISOString(),
        };

        programs.push(newProgram);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(programs));

        // Clear temporary state
        await AsyncStorage.removeItem('@temp_program_state');

        Alert.alert('Success', 'Workout program saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to save ${isStandaloneWorkout ? 'workout' : 'workout program'}`);
      console.error(error);
    }
  };

  const handleUseTemplate = (template) => {
    setDayName(template.name);
    handleAddDay();
  };

  const addSet = (dayIndex, exerciseIndex) => {
    const updatedDays = [...workoutDays];
    if (!updatedDays[dayIndex] || !updatedDays[dayIndex].exercises || !updatedDays[dayIndex].exercises[exerciseIndex]) {
      return;
    }
    const exercise = updatedDays[dayIndex].exercises[exerciseIndex];
    if (!exercise.sets) {
      exercise.sets = [];
    }
    exercise.sets.push({ type: 'normal', reps: '8-12', rest: '90' });
    setWorkoutDays(updatedDays);
  };

  const removeSet = (dayIndex, exerciseIndex, setIndex) => {
    const updatedDays = [...workoutDays];
    if (!updatedDays[dayIndex] || !updatedDays[dayIndex].exercises || !updatedDays[dayIndex].exercises[exerciseIndex]) {
      return;
    }
    const exercise = updatedDays[dayIndex].exercises[exerciseIndex];
    if (exercise.sets && exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1);
      setWorkoutDays(updatedDays);
    }
  };

  const updateSet = (dayIndex, exerciseIndex, setIndex, field, value) => {
    const updatedDays = [...workoutDays];
    if (!updatedDays[dayIndex] || !updatedDays[dayIndex].exercises || !updatedDays[dayIndex].exercises[exerciseIndex]) {
      return;
    }
    const exercise = updatedDays[dayIndex].exercises[exerciseIndex];
    if (exercise.sets && exercise.sets[setIndex]) {
      exercise.sets[setIndex][field] = value;
      setWorkoutDays(updatedDays);
    }
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
      default: return '';
    }
  };

  return (
    <ScreenLayout
      title={isStandaloneWorkout ? "Create Workout" : "Create Program"}
      subtitle={isStandaloneWorkout ? "Design your workout" : "Design your workout program"}
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>{isStandaloneWorkout ? 'Workout Name' : 'Program Name'}</Text>
          <TextInput
            style={styles.input}
            placeholder={isStandaloneWorkout ? "e.g., Upper Body Blast" : "e.g., 12 Week Strength Program"}
            placeholderTextColor={Colors.textSecondary}
            value={programName}
            onChangeText={setProgramName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your program goals..."
            placeholderTextColor={Colors.textSecondary}
            value={programDescription}
            onChangeText={setProgramDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isStandaloneWorkout ? 'Exercises' : 'Workout Days'}</Text>
            {!isStandaloneWorkout && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddDayModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>+ Add Day</Text>
              </TouchableOpacity>
            )}
          </View>

          {workoutDays.length === 0 && !isStandaloneWorkout ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No workout days added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add Day" to get started</Text>
            </View>
          ) : (
            workoutDays.map((day, dayIndex) => (
              <View key={day.id} style={styles.dayCard}>
                {!isStandaloneWorkout && (
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>Day {dayIndex + 1}: {day.name}</Text>
                    <View style={styles.dayActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleNavigateToExerciseSelection(dayIndex)}
                      >
                        <Text style={styles.iconButtonText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, styles.deleteButton]}
                        onPress={() => handleRemoveDay(dayIndex)}
                      >
                        <Text style={styles.iconButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.editDayButton}
                  onPress={() => handleNavigateToExerciseSelection(dayIndex)}
                >
                  <Text style={styles.editDayButtonText}>
                    {!day.exercises || day.exercises.length === 0
                      ? '+ Add Exercises'
                      : `Edit ${day.exercises.length} Exercise${day.exercises.length > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <StyledButton
          title={isStandaloneWorkout ? "Save Workout" : "Save Program"}
          onPress={handleSaveProgram}
          style={styles.saveButton}
        />

        <Modal
          visible={showAddDayModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddDayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Workout Day</Text>

              <Text style={styles.modalLabel}>Day Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Push Day, Leg Day"
                placeholderTextColor={Colors.textSecondary}
                value={dayName}
                onChangeText={setDayName}
              />

              <Text style={styles.modalLabel}>Quick Templates</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
                {dayTemplates.map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.templateButton}
                    onPress={() => {
                      setDayName(template.name);
                    }}
                  >
                    <Text style={styles.templateText}>{template.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddDayModal(false);
                    setDayName('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddDay}
                >
                  <Text style={styles.modalAddText}>Add Day</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
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
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dayTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  iconButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  editDayButton: {
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginTop: Spacing.sm,
  },
  editDayButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  exerciseItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  setsContainer: {
    marginLeft: Spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  setNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    width: 45,
  },
  setTypeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  setTypeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
  },
  setInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    minWidth: 50,
    textAlign: 'center',
  },
  setLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  removeSetButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  removeSetText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addSetButton: {
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  addSetText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  removeExerciseButton: {
    padding: Spacing.xs,
  },
  removeExerciseText: {
    color: Colors.error,
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveButton: {
    marginVertical: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  templatesContainer: {
    marginBottom: Spacing.lg,
  },
  templateButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  templateText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  modalAddButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    marginLeft: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalAddText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
});