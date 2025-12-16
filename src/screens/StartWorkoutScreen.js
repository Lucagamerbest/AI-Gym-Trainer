import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { ImportButton } from '../components/ContentImportButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartWorkoutScreen({ navigation }) {
  const { isWorkoutActive, activeWorkout } = useWorkout();

  return (
    <ScreenLayout
      title="Start Workout"
      navigation={navigation}
      showBack={true}
      screenName="StartWorkoutScreen"
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
            <Ionicons name="calendar" size={28} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={styles.historyTextContainer}>
              <Text style={styles.historyTitle}>Workout History</Text>
              <Text style={styles.historySubtitle}>View past workouts & track progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Start */}
        <View style={styles.section}>
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
            icon={isWorkoutActive() ? "flash" : "walk"}
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
            icon={isWorkoutActive() ? "add-circle" : "library"}
            style={styles.quickStartButton}
          />
        </View>

        {/* Import Button */}
        <View style={styles.section}>
          <ImportButton
            label="Import Plan from Photo or PDF"
            icon="scan"
            size="large"
            variant="outline"
            fullWidth
            navigation={navigation}
            onImportComplete={(data, type) => {
              Alert.alert('Success', 'Workout imported and saved to My Plans!');
            }}
          />
        </View>

        {/* My Plans - Prominent Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.myPlansButton}
            onPress={() => navigation.navigate('MyPlans')}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard" size={24} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={styles.myPlansTextContainer}>
              <Text style={styles.myPlansTitle}>My Plans</Text>
              <Text style={styles.myPlansSubtitle}>
                View all your programs & workouts
              </Text>
            </View>
          </TouchableOpacity>
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
  section: {
    marginBottom: Spacing.xxl,
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
});