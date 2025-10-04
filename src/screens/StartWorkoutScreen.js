import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartWorkoutScreen({ navigation }) {
  const { isWorkoutActive, activeWorkout } = useWorkout();
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const workoutPrograms = [
    { id: 'beginner', name: 'Beginner Program', duration: '4 weeks', focus: 'Foundation Building' },
    { id: 'strength', name: 'Strength Builder', duration: '8 weeks', focus: 'Maximum Strength' },
    { id: 'muscle', name: 'Muscle Mass', duration: '12 weeks', focus: 'Hypertrophy' },
    { id: 'athletic', name: 'Athletic Performance', duration: '6 weeks', focus: 'Performance' },
  ];

  const displayedPrograms = showAllPrograms ? workoutPrograms : workoutPrograms.slice(0, 2);

  const handleStartWorkout = (program) => {
    if (isWorkoutActive() && activeWorkout) {
      // Navigate to active workout for resuming
      navigation.navigate('Workout', { resumingWorkout: true });
    } else {
      // TODO: In the future, implement actual program workouts
      // For now, just navigate back or show a success message
      navigation.goBack();
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

        {/* Workout Programs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Programs</Text>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowAllPrograms(!showAllPrograms)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandButtonText}>
                {showAllPrograms ? 'Show Less ↑' : 'Show More ↓'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.programActionsContainer}>
            <TouchableOpacity
              style={styles.programActionButton}
              onPress={() => navigation.navigate('WorkoutProgram')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary, '#059669']}
                style={styles.programActionGradient}
              >
                <Text style={styles.programActionIcon}>+</Text>
                <Text style={styles.programActionText}>Create Program</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.programActionButton}
              onPress={() => navigation.navigate('MyPlans')}
              activeOpacity={0.9}
            >
              <View style={styles.myProgramsButton}>
                <Text style={styles.myProgramsIcon}>📋</Text>
                <Text style={styles.myProgramsText}>My Plans</Text>
              </View>
            </TouchableOpacity>
          </View>
          {displayedPrograms.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => handleStartWorkout(program)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary + '10', Colors.primary + '05']}
                style={styles.programGradient}
              >
                <View style={styles.programHeader}>
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programDuration}>⏱️ {program.duration}</Text>
                    <Text style={styles.programFocus}>🎯 {program.focus}</Text>
                  </View>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>
                      {isWorkoutActive() ? 'CONTINUE' : 'START'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
  programActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  programActionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  programActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  programActionIcon: {
    fontSize: 18,
    color: Colors.background,
    marginRight: Spacing.xs,
  },
  programActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  myProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  myProgramsIcon: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  myProgramsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});