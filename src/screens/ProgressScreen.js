import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import SimpleChart from '../components/SimpleChart';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [user]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const userId = user?.email || 'guest';

      // Load user stats
      const stats = await WorkoutStorageService.getUserStats(userId);
      setUserStats(stats);

      // Load exercise progress
      const progress = await WorkoutStorageService.getExerciseProgress(userId);
      setExerciseProgress(progress);

      // Set default selected exercise to first one with data
      const exercisesWithData = Object.keys(progress);
      if (exercisesWithData.length > 0 && !selectedExercise) {
        selectExercise(exercisesWithData[0]);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectExercise = async (exerciseKey) => {
    setSelectedExercise(exerciseKey);
    const userId = user?.email || 'guest';
    const exerciseData = exerciseProgress[exerciseKey];

    if (exerciseData && exerciseData.records.length > 0) {
      // Prepare chart data - show last 10 workouts
      const recentRecords = exerciseData.records.slice(-10);

      const chartData = recentRecords.map(record => {
        const date = new Date(record.date);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          weight: record.weight,
          volume: record.volume
        };
      });

      setChartData(chartData);
    } else {
      setChartData(null);
    }
  };

  const getPersonalRecords = (exerciseKey) => {
    const exercise = exerciseProgress[exerciseKey];
    if (!exercise || !exercise.records.length) return null;

    const records = exercise.records;
    const maxWeight = Math.max(...records.map(r => r.weight));
    const maxVolume = Math.max(...records.map(r => r.volume));
    const maxReps = Math.max(...records.map(r => r.reps));

    return { maxWeight, maxVolume, maxReps };
  };


  if (loading) {
    return (
      <ScreenLayout title="Progress & Goals" subtitle="Loading..." navigation={navigation}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </ScreenLayout>
    );
  }

  const exercisesWithData = Object.keys(exerciseProgress);

  return (
    <ScreenLayout
      title="Progress & Goals"
      subtitle="Track your achievements"
      navigation={navigation}
      scrollable={true}
    >
      {/* User Stats Overview */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats?.totalWorkouts || 0}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(userStats?.totalVolume || 0)}</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats?.totalExercises || 0}</Text>
            <Text style={styles.statLabel}>Total Exercises</Text>
          </View>
        </View>
      </View>

      {exercisesWithData.length === 0 ? (
        <View style={styles.noDataCard}>
          <Text style={styles.noDataTitle}>No Progress Data Yet</Text>
          <Text style={styles.noDataText}>
            Complete your first workout to start tracking your progress!
          </Text>
          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={() => navigation.navigate('MuscleGroupSelection')}
          >
            <Text style={styles.startWorkoutButtonText}>Start Your First Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Exercise Selection */}
          <View style={styles.exerciseSelectionCard}>
            <Text style={styles.cardTitle}>Exercise Progress</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.exerciseScrollView}
            >
              {exercisesWithData.map((exerciseKey) => {
                const exercise = exerciseProgress[exerciseKey];
                const isSelected = selectedExercise === exerciseKey;

                return (
                  <TouchableOpacity
                    key={exerciseKey}
                    style={[styles.exerciseTab, isSelected && styles.exerciseTabSelected]}
                    onPress={() => selectExercise(exerciseKey)}
                  >
                    <Text style={[styles.exerciseTabText, isSelected && styles.exerciseTabTextSelected]}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exerciseTabCount}>
                      {exercise.records.length} sessions
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Progress Chart */}
          {selectedExercise && chartData && (
            <SimpleChart
              data={chartData}
              title={`${exerciseProgress[selectedExercise]?.name} Progress`}
            />
          )}

          {/* Personal Records */}
          {selectedExercise && (
            <View style={styles.recordsCard}>
              <Text style={styles.cardTitle}>Personal Records</Text>
              {(() => {
                const records = getPersonalRecords(selectedExercise);
                if (!records) return <Text style={styles.noDataText}>No records yet</Text>;

                return (
                  <View style={styles.recordsGrid}>
                    <View style={styles.recordItem}>
                      <Text style={styles.recordValue}>{records.maxWeight} lbs</Text>
                      <Text style={styles.recordLabel}>Max Weight</Text>
                    </View>
                    <View style={styles.recordItem}>
                      <Text style={styles.recordValue}>{records.maxReps}</Text>
                      <Text style={styles.recordLabel}>Max Reps</Text>
                    </View>
                    <View style={styles.recordItem}>
                      <Text style={styles.recordValue}>{Math.round(records.maxVolume)}</Text>
                      <Text style={styles.recordLabel}>Max Volume</Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noDataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  noDataTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  noDataText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  startWorkoutButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  startWorkoutButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  exerciseSelectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  exerciseScrollView: {
    marginHorizontal: -Spacing.sm,
  },
  exerciseTab: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    minWidth: 120,
    alignItems: 'center',
  },
  exerciseTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  exerciseTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  exerciseTabTextSelected: {
    color: Colors.background,
  },
  exerciseTabCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recordsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  recordsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordItem: {
    alignItems: 'center',
  },
  recordValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  recordLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});