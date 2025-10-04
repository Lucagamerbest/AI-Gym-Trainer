import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
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
      const planned = await AsyncStorage.getItem('@planned_workouts');
      const plannedData = planned ? JSON.parse(planned) : {};
      setPlannedWorkouts(plannedData);
      updateMarkedDates(workoutHistory, plannedData);
    } catch (error) {
      console.error('Error loading planned workouts:', error);
    }
  };

  const updateMarkedDates = (history, planned) => {
    const marked = {};

    // Mark completed workouts (green)
    history.forEach(workout => {
      const dateKey = new Date(workout.date).toISOString().split('T')[0];
      marked[dateKey] = {
        marked: true,
        dotColor: Colors.primary,
        customStyles: {
          container: {
            backgroundColor: Colors.primary + '20',
            borderRadius: BorderRadius.sm,
          },
          text: {
            color: Colors.text,
            fontWeight: 'bold',
          }
        }
      };
    });

    // Mark planned workouts (orange)
    Object.keys(planned).forEach(dateKey => {
      if (!marked[dateKey]) { // Don't override completed workouts
        marked[dateKey] = {
          marked: true,
          dotColor: '#FFA500',
          customStyles: {
            container: {
              backgroundColor: '#FFA50020',
              borderRadius: BorderRadius.sm,
            },
            text: {
              color: Colors.text,
              fontWeight: 'bold',
            }
          }
        };
      }
    });

    setMarkedDates(marked);
  };

  const handleDatePress = (date) => {
    // Date comes as a Date object from CalendarView
    setSelectedDate(date);

    // Get date strings in local timezone to avoid timezone offset issues
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const dateKey = date.toISOString().split('T')[0];

    const workout = workoutHistory.find(w =>
      new Date(w.date).toISOString().split('T')[0] === dateKey
    );

    // Check for planned workout
    const plannedWorkout = plannedWorkouts[dateKey];

    if (workout) {
      // Past workout - show details
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
    }
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

  return (
    <ScreenLayout
      title="Workout History"
      subtitle="Track your progress"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <View style={styles.container}>
        {/* Calendar */}
        <StyledCard variant="elevated" style={styles.calendarCard}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDatePress}
            mealData={markedDates}
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
              {selectedWorkout && (
                <>
                  <Text style={styles.modalTitle}>Workout Details</Text>
                  <Text style={styles.modalDate}>{formatDate(selectedWorkout.date)}</Text>

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
                    title="Repeat This Workout"
                    onPress={() => {
                      // TODO: Implement repeat workout functionality
                      setShowWorkoutModal(false);
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
});
