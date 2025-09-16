import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';

export default function ExerciseListScreenTest({ navigation, route }) {
  const { selectedMuscleGroups } = route.params || { selectedMuscleGroups: [] };
  const [exercises, setExercises] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    loadExercises();
  }, [selectedMuscleGroups, selectedDifficulty]);

  const loadExercises = async () => {
    let filteredExercises = [];

    for (const muscleGroup of selectedMuscleGroups) {
      const groupExercises = await getExercisesByMuscleGroup(muscleGroup);
      if (groupExercises) {
        filteredExercises = [...filteredExercises, ...groupExercises];
      }
    }


    if (selectedDifficulty !== 'all') {
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.difficulty === selectedDifficulty
      );
    }

    setExercises(filteredExercises);
  };

  const renderExercise = ({ item }) => {
    return (
      <View style={styles.exerciseCard}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetails}>Equipment: {item.equipment}</Text>
        <Text style={styles.exerciseDetails}>Difficulty: {item.difficulty}</Text>
        <Text style={styles.exerciseInstructions} numberOfLines={2}>
          {item.instructions}
        </Text>
      </View>
    );
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
      title="Exercise Library"
      subtitle={`${exercises.length} exercises for ${selectedMuscleGroups.length} muscle groups`}
      navigation={navigation}
      showBack={true}
      scrollable={false}
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
        <FlatList
          data={exercises}
          renderItem={renderExercise}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.exerciseListContainer}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🤷‍♂️</Text>
              <Text style={styles.emptyTitle}>No exercises found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your difficulty filter or selecting different muscle groups
              </Text>
            </View>
          }
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  exerciseListContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exerciseDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  exerciseInstructions: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
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
});