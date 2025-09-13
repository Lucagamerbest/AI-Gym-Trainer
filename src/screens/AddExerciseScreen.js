// AddExerciseScreen - For adding exercises to existing workouts
// Clone of ExerciseListScreen but specialized for workout additions

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';

export default function AddExerciseScreen({ navigation, route }) {
  const { selectedMuscleGroups, currentWorkoutExercises, workoutStartTime } = route.params || { selectedMuscleGroups: [] };
  const [exercises, setExercises] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    loadExercises();
  }, [selectedMuscleGroups, selectedDifficulty]);

  // Add scrollbar styles for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'custom-scrollbar-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .web-scroll-container {
            overflow-y: scroll !important;
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
          }
          .web-scroll-container::-webkit-scrollbar {
            width: 12px;
          }
          .web-scroll-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .web-scroll-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .web-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const loadExercises = () => {
    console.log('🔍 [ADD-EXERCISE] Loading exercises for muscle groups:', selectedMuscleGroups);
    console.log('🔍 [ADD-EXERCISE] Current workout has:', currentWorkoutExercises?.length || 0, 'exercises');

    let filteredExercises = [];

    selectedMuscleGroups.forEach(muscleGroup => {
      try {
        const groupExercises = getExercisesByMuscleGroup(muscleGroup);

        if (groupExercises && Array.isArray(groupExercises) && groupExercises.length > 0) {
          filteredExercises = [...filteredExercises, ...groupExercises];
        }
      } catch (error) {
        console.error(`❌ [ADD-EXERCISE] Error loading exercises for ${muscleGroup}:`, error);
      }
    });

    if (selectedDifficulty !== 'all') {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.difficulty === selectedDifficulty
      );
    }

    console.log('🔍 [ADD-EXERCISE] Final filtered exercises:', filteredExercises.length);
    setExercises(filteredExercises);
  };

  const addExerciseToWorkout = (exercise) => {
    console.log('🔥 [ADD-EXERCISE] Adding exercise to workout:', exercise.name);
    console.log('🔥 [ADD-EXERCISE] Current workout exercises:', currentWorkoutExercises?.length || 0);
    console.log('🔥 [ADD-EXERCISE] Preserving workout start time:', workoutStartTime);

    // Add exercise to existing workout
    navigation.navigate('Workout', {
      exercise,
      addToExistingWorkout: true,
      existingWorkoutExercises: currentWorkoutExercises || [],
      workoutStartTime: workoutStartTime
    });
  };

  const getEquipmentIcon = (equipment) => {
    switch (equipment) {
      case 'Bodyweight': return '🤸‍♂️';
      case 'Dumbbells': return '🏋️‍♂️';
      case 'Barbell': return '🏋️';
      case 'Machine': return '⚙️';
      case 'Cable': return '🔗';
      case 'Cable Machine': return '🔗';
      default: return '💪';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return Colors.primary;
    }
  };

  const difficultyOptions = [
    { id: 'all', name: 'All Levels' },
    { id: 'Beginner', name: 'Beginner' },
    { id: 'Intermediate', name: 'Intermediate' },
    { id: 'Advanced', name: 'Advanced' },
  ];

  const renderDifficultyFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedDifficulty === item.id && styles.selectedFilterButton
      ]}
      onPress={() => setSelectedDifficulty(item.id)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        selectedDifficulty === item.id && styles.selectedFilterButtonText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout
      title="Add Exercise"
      subtitle={`Add to your workout (${currentWorkoutExercises?.length || 0} exercises)`}
      navigation={navigation}
      showBack={true}
      scrollable={true}
      style={{ paddingHorizontal: 0 }}
    >
      {/* Difficulty Filter */}
      <View style={styles.filterSection}>
        <FlatList
          data={difficultyOptions}
          renderItem={renderDifficultyFilter}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        />
      </View>

      {/* Exercise List */}
      <View style={styles.listContainer}>
        {exercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🤷‍♂️</Text>
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your difficulty filter or selecting different muscle groups
            </Text>
          </View>
        ) : (
          exercises.map((exercise, index) => (
            <View key={`exercise-${index}-${exercise.id || exercise.name}`} style={styles.exerciseCard}>
              <View style={styles.exerciseContent}>
                {/* Exercise Name */}
                <Text style={styles.exerciseName}>{exercise.name}</Text>

                {/* Exercise Meta */}
                <View style={styles.exerciseMeta}>
                  <View style={styles.equipmentTag}>
                    <Text style={styles.equipmentIcon}>{getEquipmentIcon(exercise.equipment)}</Text>
                    <Text style={styles.equipmentText}>{exercise.equipment}</Text>
                  </View>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }
                  ]}>
                    <Text style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(exercise.difficulty) }
                    ]}>
                      {exercise.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Instructions */}
                <Text style={styles.instructionsText} numberOfLines={3}>
                  {exercise.instructions}
                </Text>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => {
                      navigation.navigate('ExerciseDetail', { exercise: exercise, fromWorkout: true });
                    }}
                  >
                    <Text style={styles.infoButtonText}>Info</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => addExerciseToWorkout(exercise)}
                  >
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectedFilterButtonText: {
    color: Colors.background,
  },
  listContainer: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    minHeight: 120,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  infoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  infoButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: Typography.fontSize.sm,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  equipmentIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
  },
  instructionsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  addButton: {
    backgroundColor: '#FF6B35', // Orange color to distinguish from "Start"
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: Typography.fontSize.sm,
  },
});