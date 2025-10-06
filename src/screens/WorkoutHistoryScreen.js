import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

export default function WorkoutHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceWorkout, setCopySourceWorkout] = useState(null);
  const [selectedFutureDates, setSelectedFutureDates] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDatesToDelete, setSelectedDatesToDelete] = useState([]);

  // Load workout history on focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutHistory();
      loadPlannedWorkouts();
    }, [])
  );

  const loadWorkoutHistory = async () => {
    try {
      const userId = user?.email || 'guest';
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      setWorkoutHistory(history);
      updateMarkedDates(history, plannedWorkouts);
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  const loadPlannedWorkouts = async () => {
    try {
      const userId = user?.email || 'guest';
      const plannedData = await WorkoutStorageService.getPlannedWorkouts(userId);
      setPlannedWorkouts(plannedData);
      updateMarkedDates(workoutHistory, plannedData);
    } catch (error) {
      console.error('Error loading planned workouts:', error);
    }
  };

  const updateMarkedDates = (history, planned) => {
    const marked = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert completed workouts to CalendarView format
    history.forEach(workout => {
      const dateKey = new Date(workout.date).toISOString().split('T')[0];
      marked[dateKey] = {
        logged: { workout: [workout] } // CalendarView expects logged property
      };
    });

    // Convert planned workouts to CalendarView format - only if not already completed
    Object.keys(planned).forEach(dateKey => {
      const plannedDate = new Date(dateKey);
      plannedDate.setHours(0, 0, 0, 0);

      // Only mark as planned (orange) if:
      // 1. It's a future date OR today
      // 2. There's no completed workout for this date
      if (plannedDate >= today && !marked[dateKey]) {
        marked[dateKey] = {
          planned: { workout: [planned[dateKey]] } // CalendarView expects planned property
        };
      }
    });

    setMarkedDates(marked);
  };

  const handleDatePress = (date) => {
    const dateKey = date.toISOString().split('T')[0];

    // If in delete mode, toggle selection
    if (deleteMode) {
      const plannedWorkout = plannedWorkouts[dateKey];
      if (plannedWorkout) {
        toggleDeleteSelection(dateKey);
      }
      return;
    }

    // Normal date press behavior
    // Date comes as a Date object from CalendarView
    setSelectedDate(date);

    // Get date strings in local timezone to avoid timezone offset issues
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const workout = workoutHistory.find(w =>
      new Date(w.date).toISOString().split('T')[0] === dateKey
    );

    // Check for planned workout
    const plannedWorkout = plannedWorkouts[dateKey];

    if (workout) {
      // Past/completed workout - show details modal
      setSelectedWorkout(workout);
      setShowWorkoutModal(true);
    } else if (plannedWorkout) {
      // Planned workout exists - navigate to planned workout detail screen
      navigation.navigate('PlannedWorkoutDetail', {
        plannedWorkout,
        selectedDate: dateKey
      });
    } else if (clickedDate.getTime() === todayDate.getTime()) {
      // Today - navigate to workout options screen
      navigation.navigate('TodayWorkoutOptions');
    } else if (clickedDate > todayDate) {
      // Future date - navigate to plan workout screen
      navigation.navigate('PlanWorkout', { selectedDate: dateKey });
    } else {
      // Past date with no workout - show modal with empty state
      setSelectedWorkout(null);
      setShowWorkoutModal(true);
    }
  };

  const toggleDeleteSelection = (dateKey) => {
    if (selectedDatesToDelete.includes(dateKey)) {
      setSelectedDatesToDelete(selectedDatesToDelete.filter(d => d !== dateKey));
    } else {
      setSelectedDatesToDelete([...selectedDatesToDelete, dateKey]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDatesToDelete.length === 0) {
      Alert.alert('Error', 'Please select at least one planned workout to delete');
      return;
    }

    const count = selectedDatesToDelete.length;

    Alert.alert(
      `Delete ${count} Planned Workout${count > 1 ? 's' : ''}?`,
      'This will permanently delete the selected planned workouts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.email || 'guest';

              // Delete each selected planned workout
              for (const dateKey of selectedDatesToDelete) {
                await WorkoutStorageService.deletePlannedWorkout(dateKey, userId);
              }

              // Reload data
              await loadPlannedWorkouts();

              // Reset delete mode
              setDeleteMode(false);
              setSelectedDatesToDelete([]);

              Alert.alert('Success', `Successfully deleted ${count} planned workout${count > 1 ? 's' : ''}!`);
            } catch (error) {
              console.error('Error deleting planned workouts:', error);
              Alert.alert('Error', 'Failed to delete some planned workouts');
            }
          }
        }
      ]
    );
  };

  const calculateWorkoutStats = (workout) => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    workout.exercises.forEach(exercise => {
      const sets = exercise.sets || [];
      totalSets += sets.length;

      sets.forEach(set => {
        if (set.completed) {
          completedSets += 1;
          if (set.weight && set.reps) {
            totalVolume += parseFloat(set.weight) * parseInt(set.reps);
          }
        }
      });
    });

    return { totalSets, completedSets, totalVolume };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (duration) => {
    return duration || '00:00';
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

  const copyWorkoutToMultipleDates = async () => {
    try {
      const userId = user?.email || 'guest';
      const targetDateKeys = selectedFutureDates.map(date => date.toISOString().split('T')[0]);

      // Create workout data to copy (without the original id and date)
      const workoutToCopy = {
        exercises: copySourceWorkout.exercises,
        duration: copySourceWorkout.duration,
        startTime: copySourceWorkout.startTime,
        endTime: copySourceWorkout.endTime
      };

      await WorkoutStorageService.copyWorkoutToMultipleDates(workoutToCopy, targetDateKeys, userId);

      // Reload both history and planned workouts
      await loadWorkoutHistory();
      await loadPlannedWorkouts();

      // Close modal and reset
      setShowCopyModal(false);
      setCopySourceWorkout(null);
      setSelectedFutureDates([]);

      alert(`Workout copied to ${targetDateKeys.length} day${targetDateKeys.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error copying workout:', error);
      alert('Failed to copy workout');
    }
  };

  const addTestWorkoutData = async () => {
    try {
      const userId = user?.email || 'guest';

      // Create mock workout for October 4th, 2025
      const mockWorkout = {
        exercises: [
          {
            name: 'Bench Press',
            equipment: 'Barbell',
            primaryMuscle: 'Chest',
            sets: [
              { weight: '135', reps: '10', completed: true, rpe: '7' },
              { weight: '185', reps: '8', completed: true, rpe: '8' },
              { weight: '205', reps: '6', completed: true, rpe: '9' },
            ]
          },
          {
            name: 'Squat',
            equipment: 'Barbell',
            primaryMuscle: 'Quadriceps',
            sets: [
              { weight: '225', reps: '8', completed: true, rpe: '8' },
              { weight: '275', reps: '6', completed: true, rpe: '9' },
              { weight: '315', reps: '4', completed: true, rpe: '10' },
            ]
          },
          {
            name: 'Pull-ups',
            equipment: 'Body Weight',
            primaryMuscle: 'Back',
            sets: [
              { weight: '0', reps: '12', completed: true, rpe: '7' },
              { weight: '0', reps: '10', completed: true, rpe: '8' },
              { weight: '0', reps: '8', completed: true, rpe: '9' },
            ]
          }
        ],
        duration: '01:15:30',
        startTime: '10:00 AM',
        endTime: '11:15 AM'
      };

      const exerciseSets = mockWorkout.exercises.map(ex => ex.sets);

      // Set the date to October 4th, 2025
      const oct4 = new Date('2025-10-04T10:00:00');

      const workoutData = {
        ...mockWorkout,
        startTime: mockWorkout.startTime,
        endTime: mockWorkout.endTime,
        duration: mockWorkout.duration
      };

      // Manually create the workout with the specific date
      const workout = {
        id: Date.now().toString(),
        userId,
        date: oct4.toISOString(),
        startTime: workoutData.startTime,
        endTime: workoutData.endTime,
        duration: workoutData.duration,
        exercises: workoutData.exercises.map((exercise, index) => ({
          ...exercise,
          sets: exerciseSets[index] || [],
          completedSets: exerciseSets[index]?.filter(set => set.completed).length || 0,
          totalSets: exerciseSets[index]?.length || 0
        }))
      };

      // Save directly to workout history
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      history.push(workout);
      await AsyncStorage.setItem(`workout_history_${userId}`, JSON.stringify(history));

      // Reload data
      await loadWorkoutHistory();

      alert('Test workout added for October 4th! Check the calendar.');
    } catch (error) {
      console.error('Error adding test workout:', error);
      alert('Failed to add test workout');
    }
  };

  return (
    <ScreenLayout
      title="Workout History"
      subtitle="Track your progress"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <View style={styles.container}>
        {/* Delete Mode Banner */}
        {deleteMode && (
          <StyledCard variant="elevated" style={styles.deleteBanner}>
            <Text style={styles.deleteBannerText}>
              🗑️ Delete Mode: Tap planned workouts to select ({selectedDatesToDelete.length} selected)
            </Text>
          </StyledCard>
        )}

        {/* Calendar */}
        <StyledCard variant="elevated" style={styles.calendarCard}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDatePress}
            mealData={markedDates}
            highlightedDates={deleteMode ? selectedDatesToDelete : []}
          />
        </StyledCard>

        {/* Legend */}
        <StyledCard variant="elevated" style={styles.legendCard}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.legendText}>Planned</Text>
            </View>
          </View>
        </StyledCard>

        {/* Delete Planned Workouts Button */}
        <StyledCard variant="elevated" style={styles.actionCard}>
          {!deleteMode ? (
            <StyledButton
              title="🗑️ Delete Planned Workouts"
              variant="secondary"
              onPress={() => setDeleteMode(true)}
            />
          ) : (
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setDeleteMode(false);
                  setSelectedDatesToDelete([]);
                }}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  selectedDatesToDelete.length === 0 && styles.deleteConfirmButtonDisabled
                ]}
                onPress={handleBulkDelete}
                disabled={selectedDatesToDelete.length === 0}
              >
                <Text style={styles.deleteConfirmText}>
                  Delete {selectedDatesToDelete.length > 0 ? `(${selectedDatesToDelete.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </StyledCard>

        {/* Test Button */}
        <StyledCard variant="elevated" style={styles.testCard}>
          <StyledButton
            title="🧪 Add Test Workout (Oct 4th)"
            variant="secondary"
            onPress={addTestWorkoutData}
          />
        </StyledCard>

        {/* Workout Stats Summary */}
        {workoutHistory.length > 0 && (
          <StyledCard variant="elevated" style={styles.statsCard}>
            <Text style={styles.statsTitle}>Overall Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutHistory.length}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {workoutHistory.reduce((sum, w) => {
                    const stats = calculateWorkoutStats(w);
                    return sum + stats.completedSets;
                  }, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(workoutHistory.reduce((sum, w) => {
                    const stats = calculateWorkoutStats(w);
                    return sum + stats.totalVolume;
                  }, 0) / 1000)}k
                </Text>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
            </View>
          </StyledCard>
        )}
      </View>

      {/* Workout Details Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {!selectedWorkout ? (
                <>
                  <Text style={styles.modalTitle}>No Workout Logged</Text>
                  <Text style={styles.modalDate}>{formatDate(selectedDate)}</Text>

                  <View style={styles.emptyWorkoutContainer}>
                    <Text style={styles.emptyWorkoutIcon}>📋</Text>
                    <Text style={styles.emptyWorkoutText}>No workout logged for this date</Text>
                    <Text style={styles.emptyWorkoutSubtext}>
                      You didn't record a workout on this day. Start logging your workouts to track your progress!
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Workout Details</Text>
                  <Text style={styles.modalDate}>{formatDate(selectedWorkout.date || selectedWorkout.dateKey)}</Text>

                  {/* Workout Stats */}
                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{formatDuration(selectedWorkout.duration)}</Text>
                      <Text style={styles.modalStatLabel}>Duration</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedWorkout.exercises.length}</Text>
                      <Text style={styles.modalStatLabel}>Exercises</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {calculateWorkoutStats(selectedWorkout).completedSets}
                      </Text>
                      <Text style={styles.modalStatLabel}>Sets</Text>
                    </View>
                  </View>

                  {/* Exercises List */}
                  <Text style={styles.exercisesTitle}>Exercises</Text>
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.equipment} • {exercise.primaryMuscle}
                      </Text>

                      {/* Sets */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <View style={styles.setsContainer}>
                          {exercise.sets.map((set, setIndex) => (
                            set.completed && (
                              <View key={setIndex} style={styles.setRow}>
                                <Text style={styles.setText}>
                                  Set {setIndex + 1}: {set.weight}lbs × {set.reps} reps
                                  {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                                </Text>
                              </View>
                            )
                          ))}
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Actions */}
                  <StyledButton
                    title="Copy to Future Date"
                    onPress={() => {
                      setCopySourceWorkout(selectedWorkout);
                      setShowWorkoutModal(false);
                      setTimeout(() => setShowCopyModal(true), 300);
                    }}
                    style={styles.repeatButton}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWorkoutModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Copy Workout Modal */}
      <Modal
        visible={showCopyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCopyModal(false);
          setCopySourceWorkout(null);
          setSelectedFutureDates([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitle}>Copy to Future Dates</Text>

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.copyModalScrollContent}
            >
              <Text style={styles.copyInstructions}>
                Select future dates to copy this workout to:
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
                      alert('Please select a future date');
                    }
                  }}
                  mealData={markedDates}
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
                    title={`Copy to ${selectedFutureDates.length} Day${selectedFutureDates.length > 1 ? 's' : ''}`}
                    onPress={copyWorkoutToMultipleDates}
                    style={styles.confirmButton}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCopyModal(false);
                  setCopySourceWorkout(null);
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
  },
  calendarCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  legendCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  legendTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalDate: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  exercisesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseItem: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  setsContainer: {
    marginTop: Spacing.xs,
  },
  setRow: {
    marginBottom: Spacing.xs,
  },
  setText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  repeatButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  closeButton: {
    backgroundColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  copyModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    maxHeight: '85%',
    minHeight: '70%',
  },
  copyModalScrollContent: {
    paddingBottom: Spacing.xxl,
  },
  copyInstructions: {
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
  cancelButton: {
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
  testCard: {
    marginBottom: Spacing.md,
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  deleteBanner: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#DC2626' + '20',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  deleteBannerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  deleteCancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteConfirmButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  deleteConfirmText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyWorkoutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyWorkoutIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyWorkoutText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyWorkoutSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
