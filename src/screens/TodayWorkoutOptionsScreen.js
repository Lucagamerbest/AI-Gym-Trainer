import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useWorkout } from '../context/WorkoutContext';

const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function TodayWorkoutOptionsScreen({ navigation }) {
  const { startWorkout } = useWorkout();
  const [userPrograms, setUserPrograms] = useState([]);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([]);
  const [plannedWorkout, setPlannedWorkout] = useState(null);

  useEffect(() => {
    loadUserPrograms();
    loadStandaloneWorkouts();
    loadPlannedWorkout();
  }, []);

  const loadUserPrograms = async () => {
    try {
      const savedPrograms = await AsyncStorage.getItem('@workout_programs');
      if (savedPrograms) {
        setUserPrograms(JSON.parse(savedPrograms));
      }
    } catch (error) {
    }
  };

  const loadStandaloneWorkouts = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
      if (savedWorkouts) {
        setStandaloneWorkouts(JSON.parse(savedWorkouts));
      }
    } catch (error) {
    }
  };

  const loadPlannedWorkout = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.uid || 'guest';

      const today = new Date().toISOString().split('T')[0];
      const planned = await WorkoutStorageService.getPlannedWorkoutByDate(today, userId);

      if (planned) {
        setPlannedWorkout(planned);
      }
    } catch (error) {
      console.error('Error loading planned workout:', error);
    }
  };

  const handleStartAIWorkout = () => {
    if (!plannedWorkout || !plannedWorkout.exercises || plannedWorkout.exercises.length === 0) {
      Alert.alert('No Exercises', 'This workout has no exercises configured.');
      return;
    }

    // Format exercises to match the workout screen's expected format
    const formattedExercises = plannedWorkout.exercises.map(exercise => ({
      ...exercise,
      name: exercise.name,
      targetMuscle: exercise.targetMuscle || exercise.primaryMuscle || '',
      equipment: exercise.equipment || 'Not specified',
      difficulty: exercise.difficulty || 'Intermediate',
      programSets: exercise.sets,
    }));

    // Initialize the exercise sets
    const initializedSets = {};
    plannedWorkout.exercises.forEach((exercise, index) => {
      if (exercise.sets && exercise.sets.length > 0) {
        initializedSets[index] = exercise.sets.map(set => ({
          ...set,
          completed: false,
        }));
      } else {
        // Default sets if none are defined
        initializedSets[index] = [
          { reps: '10', weight: '', completed: false },
          { reps: '10', weight: '', completed: false },
          { reps: '10', weight: '', completed: false },
        ];
      }
    });

    // Start workout with the planned exercises
    startWorkout({
      exercises: formattedExercises,
      startTime: new Date().toISOString(),
      exerciseSets: initializedSets,
      currentExerciseIndex: 0,
      fromProgram: false,
      dayName: plannedWorkout.workoutTitle || 'AI Workout',
    });

    // Navigate directly to workout screen
    navigation.navigate('Workout', {
      fromProgram: false,
      programExercises: formattedExercises,
      dayName: plannedWorkout.workoutTitle || 'AI Workout',
    });
  };

  return (
    <ScreenLayout
      title="Start Today's Workout"
      subtitle="Choose how you want to work out"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* AI-Generated Workout for Today */}
        {plannedWorkout && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI-Generated for Today</Text>
            <TouchableOpacity
              style={styles.programCard}
              onPress={handleStartAIWorkout}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#8B5CF6' + '25', '#8B5CF6' + '10']}
                style={styles.programGradient}
              >
                <View style={styles.programContent}>
                  <Text style={styles.programName}>{plannedWorkout.workoutTitle}</Text>
                  <Text style={styles.programMeta}>
                    {plannedWorkout.exercises?.length || 0} exercises • {plannedWorkout.notes}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* From Your Programs */}
        {userPrograms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 From Your Programs</Text>
            {userPrograms.map((program, index) => (
              <TouchableOpacity
                key={index}
                style={styles.programCard}
                onPress={() => {
                  navigation.navigate('ProgramDaySelection', {
                    program: program,
                    fromCalendar: true,
                  });
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.primary + '08']}
                  style={styles.programGradient}
                >
                  <View style={styles.programContent}>
                    <Text style={styles.programName}>{program.name || 'Unnamed Program'}</Text>
                    <Text style={styles.programMeta}>
                      {program.days?.length || 0} {program.days?.length === 1 ? 'day' : 'days'}
                      {program.description && ` • ${program.description}`}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* From Your Standalone Workouts */}
        {standaloneWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏋️ From Your Workouts</Text>
            {standaloneWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={styles.programCard}
                onPress={() => {
                  // Navigate to WorkoutDetail to view and start the workout
                  navigation.navigate('WorkoutDetail', {
                    workout: workout,
                  });
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.primary + '08']}
                  style={styles.programGradient}
                >
                  <View style={styles.programContent}>
                    <Text style={styles.programName}>{workout.name || 'Unnamed Workout'}</Text>
                    <Text style={styles.programMeta}>
                      {workout.day?.exercises?.length || 0} exercises
                      {workout.description && ` • ${workout.description}`}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Start Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Start</Text>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MuscleGroupSelection')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary + '15', Colors.primary + '08']}
              style={styles.quickGradient}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickEmoji}>🏋️</Text>
              </View>
              <View style={styles.quickContent}>
                <Text style={styles.quickTitle}>Free Workout</Text>
                <Text style={styles.quickDesc}>Choose your own muscle groups and exercises</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('MuscleGroupSelection', { fromLibrary: true })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary + '15', Colors.primary + '08']}
              style={styles.quickGradient}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickEmoji}>📚</Text>
              </View>
              <View style={styles.quickContent}>
                <Text style={styles.quickTitle}>Exercise Library</Text>
                <Text style={styles.quickDesc}>Browse 800+ exercises with filters</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </LinearGradient>
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
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  programCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  programGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  programContent: {
    flex: 1,
  },
  programName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  programMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickContent: {
    flex: 1,
  },
  quickTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  quickDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
