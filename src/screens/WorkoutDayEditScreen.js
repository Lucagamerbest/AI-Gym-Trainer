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
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const STORAGE_KEY = '@temp_program_state';

export default function WorkoutDayEditScreen({ navigation, route }) {
  const [dayData, setDayData] = useState(null);
  const [dayIndex, setDayIndex] = useState(null);
  const [programData, setProgramData] = useState(null);
  const [showSetTypeModal, setShowSetTypeModal] = useState(false);
  const [selectedSetForType, setSelectedSetForType] = useState({ exerciseIndex: null, setIndex: null });
  const lastProcessedExercise = useRef(null);
  const isFocused = useIsFocused();

  // Load the day data
  useEffect(() => {
    loadDayData();
  }, [isFocused, route.params?.dayIndex]);

  const loadDayData = async () => {
    try {
      const tempState = await AsyncStorage.getItem(STORAGE_KEY);
      if (tempState) {
        const parsed = JSON.parse(tempState);
        const index = route.params?.dayIndex !== undefined ? route.params.dayIndex : parsed.currentDayIndex;

        if (index !== undefined && parsed.workoutDays && parsed.workoutDays[index]) {
          setDayIndex(index);
          setDayData(parsed.workoutDays[index]);
          setProgramData(parsed);
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

        // Allow adding same exercise multiple times - each gets unique ID
        const exerciseToAdd = {
          ...exercise,
          uniqueId: Date.now().toString(),
          sets: [
            { type: 'normal', reps: '10' }  // 1 set by default, single number
          ]
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
    updatedExercises[exerciseIndex].sets.push({ type: 'normal', reps: '10' });

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

                  {exercise.sets && exercise.sets.map((set, setIndex) => (
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
                  ))}

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

        <StyledButton
          title="Back to Program"
          onPress={handleBackToProgram}
          style={styles.backButton}
          secondary
        />
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
    justifyContent: 'flex-start',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    marginHorizontal: Spacing.sm,
  },
  setTypeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  setInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    width: 120,  // Fixed width to match Add Set button
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  removeSetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
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
});