import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';

export default function ProgramDaySelectionScreen({ navigation, route }) {
  const { program } = route.params;
  const { startWorkout } = useWorkout();

  const handleStartDay = (day, dayIndex) => {
    if (!day.exercises || day.exercises.length === 0) {
      Alert.alert('No Exercises', 'This day has no exercises configured.');
      return;
    }

    // Format exercises to match the workout screen's expected format
    const formattedExercises = day.exercises.map(exercise => ({
      ...exercise,
      // Ensure the exercise has the expected structure
      name: exercise.name,
      targetMuscle: exercise.targetMuscle || '',
      equipment: exercise.equipment || 'Not specified',
      difficulty: exercise.difficulty || 'Intermediate',
      // Keep the original sets data for reference
      programSets: exercise.sets,
    }));

    // Initialize the exercise sets
    const initializedSets = initializeExerciseSets(day.exercises);

    // Start workout with the program's exercises
    startWorkout({
      exercises: formattedExercises,
      startTime: new Date().toISOString(),
      exerciseSets: initializedSets,
      currentExerciseIndex: 0,
      fromProgram: true,
      programName: program.name,
      dayName: day.name,
      dayIndex: dayIndex,
    });

    // Navigate directly to workout screen
    navigation.navigate('Workout', {
      fromProgram: true,
      programExercises: formattedExercises,
      programName: program.name,
      dayName: day.name,
    });
  };

  // Initialize sets based on program configuration
  const initializeExerciseSets = (exercises) => {
    const sets = {};
    exercises.forEach((exercise, index) => {
      if (exercise.sets && exercise.sets.length > 0) {
        // Use the sets defined in the program - preserve ALL set data
        sets[index] = exercise.sets.map(set => ({
          weight: '',  // User will fill this in
          reps: set.reps || '10',  // Pre-fill with program's rep target
          completed: false,
          type: set.type || 'normal',
          rest: set.rest || '90',
          // Store the original program reps for display purposes
          programReps: set.reps || '10',
        }));
      } else {
        // Default to 3 sets if none defined
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

  return (
    <ScreenLayout
      title={program.name}
      subtitle="Select a workout day to begin"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {program.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{program.description}</Text>
          </View>
        )}

        <View style={styles.daysContainer}>
          {program.days.map((day, index) => (
            <TouchableOpacity
              key={day.id || index}
              style={styles.dayCard}
              onPress={() => handleStartDay(day, index)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary + '10', Colors.primary + '05']}
                style={styles.dayGradient}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayNumber}>Day {index + 1}</Text>
                    <Text style={styles.dayName}>{day.name}</Text>
                  </View>
                  <View style={styles.startIcon}>
                    <Text style={styles.startIconText}>▶</Text>
                  </View>
                </View>

                <View style={styles.dayStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{day.exercises.length}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getTotalSets(day.exercises)}</Text>
                    <Text style={styles.statLabel}>Total Sets</Text>
                  </View>
                </View>

                {/* Exercise preview */}
                <View style={styles.exercisePreview}>
                  <Text style={styles.exercisePreviewTitle}>Exercises:</Text>
                  {day.exercises.slice(0, 3).map((exercise, exIndex) => (
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
                  {day.exercises.length > 3 && (
                    <Text style={styles.moreExercisesText}>
                      +{day.exercises.length - 3} more exercises
                    </Text>
                  )}
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
  daysContainer: {
    gap: Spacing.md,
  },
  dayCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dayNumber: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
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
  dayStats: {
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
});