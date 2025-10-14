import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function WorkoutDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const { workout } = route.params;
  const { startWorkout } = useWorkout();
  const [viewDetails, setViewDetails] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedFutureDates, setSelectedFutureDates] = useState([]);

  const handleStartWorkout = () => {
    const day = workout.day;

    if (!day.exercises || day.exercises.length === 0) {
      Alert.alert('No Exercises', 'This workout has no exercises configured.');
      return;
    }

    // Format exercises to match the workout screen's expected format
    const formattedExercises = day.exercises.map(exercise => ({
      ...exercise,
      name: exercise.name,
      targetMuscle: exercise.targetMuscle || '',
      equipment: exercise.equipment || 'Not specified',
      difficulty: exercise.difficulty || 'Intermediate',
      programSets: exercise.sets,
    }));

    // Initialize the exercise sets
    const initializedSets = initializeExerciseSets(day.exercises);

    // Start workout
    startWorkout({
      exercises: formattedExercises,
      startTime: new Date().toISOString(),
      exerciseSets: initializedSets,
      currentExerciseIndex: 0,
      fromProgram: false,
      workoutName: workout.name,
    });

    // Navigate to workout screen
    navigation.navigate('Workout', {
      fromProgram: false,
      workoutName: workout.name,
    });
  };

  const initializeExerciseSets = (exercises) => {
    const sets = {};
    exercises.forEach((exercise, index) => {
      if (exercise.sets && exercise.sets.length > 0) {
        sets[index] = exercise.sets.map((set, setIndex) => {
          const initializedSet = {
            weight: '',
            reps: set.reps || '10',
            completed: false,
            type: set.type || 'normal',
            rest: set.rest || '90',
            programReps: set.reps || '10',
            rpe: set.rpe || '',
          };
          return initializedSet;
        });
      } else {
        sets[index] = [
          { weight: '', reps: '', completed: false, type: 'normal' },
          { weight: '', reps: '', completed: false, type: 'normal' },
          { weight: '', reps: '', completed: false, type: 'normal' },
        ];
      }
    });
    return sets;
  };

  const getTotalSets = (exercises) => {
    return exercises.reduce((total, exercise) => {
      const setCount = exercise.sets ? exercise.sets.length : 3;
      return total + setCount;
    }, 0);
  };

  const handleEditWorkout = async () => {
    try {
      await AsyncStorage.setItem('@temp_program_state', JSON.stringify({
        programName: workout.name,
        programDescription: workout.description,
        workoutDays: [workout.day],
        currentDayIndex: 0,
        workoutId: workout.id,
        editMode: true
      }));

      navigation.navigate('WorkoutDayEdit', {
        dayIndex: 0,
        fromWorkoutDetail: true,
        workoutId: workout.id,
        refresh: Date.now()
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to edit workout');
    }
  };

  const handleDeleteWorkout = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
              if (storedWorkouts) {
                const workouts = JSON.parse(storedWorkouts);
                const updatedWorkouts = workouts.filter(w => w.id !== workout.id);
                await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
                Alert.alert('Success', 'Workout deleted successfully');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  const getSetTypeLabel = (type) => {
    switch(type) {
      case 'warmup': return 'Warmup';
      case 'dropset': return 'Drop Set';
      case 'failure': return 'Failure';
      case 'superset': return 'Superset';
      default: return 'Normal';
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

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const toggleDateSelection = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const isSelected = selectedFutureDates.some(d => d.toISOString().split('T')[0] === dateKey);

    if (isSelected) {
      setSelectedFutureDates(selectedFutureDates.filter(d => d.toISOString().split('T')[0] !== dateKey));
    } else {
      setSelectedFutureDates([...selectedFutureDates, date]);
    }
  };

  const handleAddToCalendar = async () => {
    try {
      const userId = user?.email || 'guest';
      const targetDateKeys = selectedFutureDates.map(date => date.toISOString().split('T')[0]);

      // Create workout data to add
      const workoutToAdd = {
        type: 'standalone',
        workoutId: workout.id,
        workoutName: workout.name,
        exercises: workout.day?.exercises || [],
      };

      await WorkoutStorageService.copyWorkoutToMultipleDates(workoutToAdd, targetDateKeys, userId);

      // Close modal and reset
      setShowCalendarModal(false);
      setSelectedFutureDates([]);

      // Navigate to calendar to show the planned workouts
      Alert.alert(
        'Success',
        `Workout added to ${targetDateKeys.length} day${targetDateKeys.length > 1 ? 's' : ''}!`,
        [
          {
            text: 'View Calendar',
            onPress: () => {
              navigation.navigate('WorkoutHistory');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add workout to calendar');
    }
  };

  return (
    <ScreenLayout
      title={workout.name}
      subtitle="Workout Details"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {workout.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{workout.description}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCalendarModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={styles.actionIcon}>📅</Text>
              </View>
              <Text style={styles.actionText}>Calendar</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEditWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#3B82F620' }]}>
                <Text style={styles.actionIcon}>✏️</Text>
              </View>
              <Text style={styles.actionText}>Edit</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#EF444420' }]}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </View>
              <Text style={styles.actionText}>Delete</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Card */}
        <TouchableOpacity
          style={styles.workoutCard}
          onPress={handleStartWorkout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary + '10', Colors.primary + '05']}
            style={styles.workoutGradient}
          >
            <View style={styles.workoutHeader}>
              <View style={styles.workoutHeaderLeft}>
                <Text style={styles.workoutTitle}>Start Workout</Text>
              </View>
              <View style={styles.workoutHeaderRight}>
                <View style={styles.startIcon}>
                  <Text style={styles.startIconText}>▶</Text>
                </View>
              </View>
            </View>

            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workout.day?.exercises?.length || 0}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{getTotalSets(workout.day?.exercises || [])}</Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
            </View>

            {/* Exercise preview */}
            <View style={styles.exercisePreview}>
              <Text style={styles.exercisePreviewTitle}>Exercises:</Text>
              {workout.day?.exercises?.slice(0, 5).map((exercise, exIndex) => (
                <View key={exIndex} style={styles.exercisePreviewItem}>
                  <Text style={styles.exercisePreviewText}>
                    • {exercise.name}
                    {exercise.sets && exercise.sets.length > 0 && (
                      <Text style={styles.setsPreviewText}>
                        {' '}({exercise.sets.length} sets)
                      </Text>
                    )}
                  </Text>
                </View>
              ))}
              {workout.day?.exercises?.length > 5 && (
                <Text style={styles.moreExercisesText}>
                  +{workout.day.exercises.length - 5} more exercises
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* View Details Modal */}
      <Modal
        visible={viewDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>
                {workout.name || 'Workout Details'}
              </Text>
              <TouchableOpacity
                onPress={() => setViewDetails(false)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScrollView} showsVerticalScrollIndicator={false}>
              {workout.day?.exercises?.map((exercise, index) => (
                <View key={index} style={styles.detailExerciseCard}>
                  <Text style={styles.detailExerciseName}>{exercise.name}</Text>
                  <Text style={styles.detailExerciseMuscle}>
                    {exercise.primaryMuscle || exercise.targetMuscle}
                    {exercise.equipment && ` • ${exercise.equipment}`}
                  </Text>

                  <View style={styles.detailSetsContainer}>
                    {exercise.sets && exercise.sets.length > 0 ? (
                      exercise.sets.map((set, setIndex) => (
                        <View key={setIndex} style={styles.detailSetRow}>
                          <View
                            style={[
                              styles.detailSetType,
                              { backgroundColor: getSetTypeColor(set.type) }
                            ]}
                          >
                            <Text style={styles.detailSetNumber}>
                              {setIndex + 1}
                            </Text>
                          </View>
                          <Text style={styles.detailSetInfo}>
                            {set.reps || '10'} reps
                            {set.type !== 'normal' && ` • ${getSetTypeLabel(set.type)}`}
                            {set.rest && ` • ${set.rest}s rest`}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noSetsText}>No sets configured</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeDetailsButton}
              onPress={() => setViewDetails(false)}
            >
              <Text style={styles.closeDetailsButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCalendarModal(false);
          setSelectedFutureDates([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <Text style={styles.calendarModalTitle}>Add to Calendar</Text>

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.calendarScrollContent}
            >
              <Text style={styles.calendarInstructions}>
                Select future dates to add this workout:
              </Text>

              <View style={styles.calendarContainer}>
                <CalendarView
                  selectedDate={new Date()}
                  multiSelectMode={true}
                  selectedDates={selectedFutureDates}
                  onDateSelect={(date) => {
                    if (isFutureDate(date)) {
                      toggleDateSelection(date);
                    } else {
                      Alert.alert('Invalid Date', 'Please select a future date');
                    }
                  }}
                  mealData={{}}
                />
              </View>

              {selectedFutureDates.length > 0 && (
                <View style={styles.confirmSection}>
                  <View style={styles.selectedDatesInfo}>
                    <Text style={styles.selectedDatesCount}>
                      {selectedFutureDates.length} date{selectedFutureDates.length > 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedFutureDates([])}
                      style={styles.clearSelectionButton}
                    >
                      <Text style={styles.clearSelectionText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                  <StyledButton
                    title={`Add to ${selectedFutureDates.length} Day${selectedFutureDates.length > 1 ? 's' : ''}`}
                    onPress={handleAddToCalendar}
                    style={styles.confirmButton}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelCalendarButton}
                onPress={() => {
                  setShowCalendarModal(false);
                  setSelectedFutureDates([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  descriptionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionButtonContent: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButtonWrapper: {
    alignItems: 'center',
  },
  circularButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonIcon: {
    fontSize: 28,
  },
  buttonLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  workoutCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  workoutTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  editWorkoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editWorkoutIcon: {
    fontSize: 16,
  },
  startIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIconText: {
    color: Colors.background,
    fontSize: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  exercisePreview: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  exercisePreviewTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exercisePreviewItem: {
    marginBottom: 4,
  },
  exercisePreviewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  setsPreviewText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  moreExercisesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailsModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  detailsScrollView: {
    padding: Spacing.lg,
  },
  detailExerciseCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailExerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailExerciseMuscle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  detailSetsContainer: {
    marginTop: Spacing.sm,
  },
  detailSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailSetType: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  detailSetNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  detailSetInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  noSetsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  closeDetailsButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeDetailsButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  calendarModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    maxHeight: '85%',
    minHeight: '70%',
  },
  calendarModalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  calendarScrollContent: {
    paddingBottom: Spacing.xxl,
  },
  calendarInstructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  calendarContainer: {
    marginVertical: Spacing.md,
  },
  confirmSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedDatesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedDatesCount: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  clearSelectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearSelectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmButton: {
    marginTop: Spacing.sm,
  },
  cancelCalendarButton: {
    backgroundColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
