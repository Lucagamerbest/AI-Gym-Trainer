import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

export default function PlannedWorkoutDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const { plannedWorkout, selectedDate } = route.params || {};

  const formatDate = (dateString) => {
    // Parse date string correctly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Planned Workout',
      'Are you sure you want to delete this planned workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.email || 'guest';
              await WorkoutStorageService.deletePlannedWorkout(selectedDate, userId);

              Alert.alert(
                'Success',
                'Planned workout deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 1,
                        routes: [
                          { name: 'Main' },
                          { name: 'WorkoutHistory' },
                        ],
                      });
                    },
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting planned workout:', error);
              Alert.alert('Error', 'Failed to delete planned workout');
            }
          },
        },
      ]
    );
  };

  const handleReplace = () => {
    navigation.navigate('PlanWorkout', { selectedDate });
  };

  const getWorkoutName = () => {
    if (plannedWorkout.type === 'program') {
      return plannedWorkout.dayName;
    } else if (plannedWorkout.type === 'standalone') {
      return plannedWorkout.workoutName;
    }
    return 'Custom Workout';
  };

  const getWorkoutSubtitle = () => {
    if (plannedWorkout.type === 'program') {
      return `From: ${plannedWorkout.programName}`;
    } else if (plannedWorkout.type === 'standalone') {
      return 'Standalone Workout';
    }
    return '';
  };

  return (
    <ScreenLayout
      title="Planned Workout"
      subtitle={formatDate(selectedDate)}
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Workout Info Card */}
        <StyledCard variant="elevated" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>📅 PLANNED</Text>
            </View>
          </View>
          <Text style={styles.workoutName}>{getWorkoutName()}</Text>
          {getWorkoutSubtitle() && (
            <Text style={styles.workoutSubtitle}>{getWorkoutSubtitle()}</Text>
          )}
        </StyledCard>

        {/* Exercises List */}
        {plannedWorkout.exercises && plannedWorkout.exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercises ({plannedWorkout.exercises.length})</Text>
            {plannedWorkout.exercises.map((exercise, index) => (
              <StyledCard key={index} variant="elevated" style={styles.exerciseCard}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.equipment} • {exercise.primaryMuscle || exercise.muscleGroup}
                </Text>
                {exercise.sets && exercise.sets.length > 0 && (
                  <Text style={styles.exerciseSets}>
                    {exercise.sets.length} set{exercise.sets.length > 1 ? 's' : ''} • {exercise.sets[0].reps} reps
                  </Text>
                )}
              </StyledCard>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleReplace}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#374151', '#1F2937']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>Replace</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#374151', '#1F2937']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionText}>Delete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    marginBottom: Spacing.md,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFA500',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    color: Colors.background,
  },
  workoutName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseCard: {
    padding: Spacing.md,
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
    marginBottom: Spacing.xs,
  },
  exerciseSets: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
