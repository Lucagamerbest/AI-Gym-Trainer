import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartWorkoutScreen({ navigation }) {
  const { user } = useAuth();
  const { isWorkoutActive, activeWorkout } = useWorkout();
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [showRecentWorkouts, setShowRecentWorkouts] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadRecentWorkouts();
    }, [])
  );

  const loadRecentWorkouts = async () => {
    try {
      const userId = user?.uid || 'guest';

      // Get workout history (completed workouts)
      const history = await WorkoutStorageService.getWorkoutHistory(userId);

      // Get user programs
      const savedPrograms = await AsyncStorage.getItem('@workout_programs');
      const userPrograms = savedPrograms ? JSON.parse(savedPrograms) : [];

      // Combine and format recent items
      const recentItems = [];

      // Add recent completed workouts
      history.slice(0, 3).forEach(workout => {
        recentItems.push({
          id: workout.id,
          type: 'completed',
          name: `Workout on ${new Date(workout.date).toLocaleDateString()}`,
          exercises: workout.exercises,
          date: workout.date,
          duration: workout.duration,
        });
      });

      // Add recent programs (for now, just get the first 3 programs if workout history < 3)
      if (recentItems.length < 3 && userPrograms.length > 0) {
        const programsToAdd = userPrograms.slice(0, 3 - recentItems.length);
        programsToAdd.forEach(program => {
          if (program.days && program.days.length > 0) {
            recentItems.push({
              id: program.id,
              type: 'program',
              name: program.name,
              exercises: program.days[0].exercises || [],
              dayName: program.days[0].name,
            });
          }
        });
      }

      setRecentWorkouts(recentItems.slice(0, 3));
    } catch (error) {
    }
  };

  const handleStartRecentWorkout = (item) => {
    if (item.type === 'completed') {
      // Start a new workout with the same exercises
      navigation.navigate('Workout', {
        exercises: item.exercises,
        workoutName: 'Repeat Workout',
      });
    } else if (item.type === 'program') {
      // Start workout from program day
      navigation.navigate('Workout', {
        exercises: item.exercises,
        workoutName: item.dayName || item.name,
      });
    }
  };

  return (
    <ScreenLayout
      title="Start Workout"
      subtitle="Choose your workout program"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Workout History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('WorkoutHistory')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary + '20', Colors.primary + '10']}
            style={styles.historyGradient}
          >
            <Text style={styles.historyIcon}>📅</Text>
            <View style={styles.historyTextContainer}>
              <Text style={styles.historyTitle}>Workout History</Text>
              <Text style={styles.historySubtitle}>View past workouts & track progress</Text>
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <StyledButton
            title={isWorkoutActive() ? "Continue Workout" : "Free Workout"}
            subtitle={isWorkoutActive() ? "Resume your active workout" : "Choose your own muscle groups"}
            onPress={() => {
              if (isWorkoutActive() && activeWorkout) {
                // Navigate to active workout for resuming
                navigation.navigate('Workout', { resumingWorkout: true });
              } else {
                // Start new free workout
                navigation.navigate('MuscleGroupSelection');
              }
            }}
            icon={isWorkoutActive() ? "⚡" : "🏃"}
            style={styles.quickStartButton}
          />
          <StyledButton
            title={isWorkoutActive() ? "Add Exercises" : "Exercise Library"}
            subtitle={isWorkoutActive() ? "Add exercises to your current workout" : "Browse all 800+ exercises with advanced filters"}
            onPress={() => {
              if (isWorkoutActive() && activeWorkout) {
                // Navigate to exercise library with active workout context
                navigation.navigate('ExerciseList', {
                  selectedMuscleGroups: [],
                  fromWorkout: true,
                  currentWorkoutExercises: activeWorkout.exercises || [],
                  workoutStartTime: activeWorkout.startTime,
                  existingExerciseSets: activeWorkout.exerciseSets || {},
                  fromLibrary: true,
                  refresh: Date.now()
                });
              } else {
                // Normal exercise library access - let user select muscle groups first
                navigation.navigate('MuscleGroupSelection', {
                  fromLibrary: true,
                  refresh: Date.now()
                });
              }
            }}
            icon={isWorkoutActive() ? "➕" : "📚"}
            style={styles.quickStartButton}
          />
        </View>

        {/* My Plans - Prominent Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.myPlansButton}
            onPress={() => navigation.navigate('MyPlans')}
            activeOpacity={0.8}
          >
            <Text style={styles.myPlansIcon}>📋</Text>
            <View style={styles.myPlansTextContainer}>
              <Text style={styles.myPlansTitle}>My Plans</Text>
              <Text style={styles.myPlansSubtitle}>
                View all your programs & workouts
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowRecentWorkouts(!showRecentWorkouts)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleButtonText}>
                {showRecentWorkouts ? 'Hide ↑' : 'Show ↓'}
              </Text>
            </TouchableOpacity>
          </View>

          {showRecentWorkouts && (
            <>
              {recentWorkouts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🏋️</Text>
                  <Text style={styles.emptyStateText}>No recent workouts yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Start your first workout or create a program!
                  </Text>
                </View>
              ) : (
                recentWorkouts.map((item, index) => (
                  <TouchableOpacity
                    key={item.id || index}
                    style={styles.programCard}
                    onPress={() => handleStartRecentWorkout(item)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[Colors.primary + '10', Colors.primary + '05']}
                      style={styles.programGradient}
                    >
                      <View style={styles.programHeader}>
                        <View style={styles.programInfo}>
                          <Text style={styles.programName}>{item.name}</Text>
                          {item.type === 'completed' && item.duration && (
                            <Text style={styles.programDuration}>⏱️ {item.duration}</Text>
                          )}
                          {item.type === 'program' && item.dayName && (
                            <Text style={styles.programDuration}>📋 {item.dayName}</Text>
                          )}
                          <Text style={styles.programFocus}>
                            💪 {item.exercises?.length || 0} exercises
                          </Text>
                        </View>
                        <View style={styles.startButton}>
                          <Text style={styles.startButtonText}>START</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  historyButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  historyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  historyIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  historyArrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: Spacing.xxl,
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
  expandButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  expandButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  programCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  programGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  programDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  programFocus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  quickStartButton: {
    marginBottom: Spacing.md,
  },
  myPlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1b',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    minHeight: 56,
  },
  myPlansIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.sm,
  },
  myPlansTextContainer: {
    flex: 1,
  },
  myPlansTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  myPlansSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  toggleButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  toggleButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});