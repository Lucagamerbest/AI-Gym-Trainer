// ⚠️ PROTECTED FILE - DO NOT MODIFY ⚠️
// This file is working correctly on both localhost and Expo Go
// Only modify if absolutely critical and with explicit user permission
// Last working version: 2025-09-13
// Status: WORKING - Exercise Library displays correctly on all platforms

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';


export default function ExerciseListScreen({ navigation, route }) {
  const { selectedMuscleGroups, returnToWorkout, currentWorkoutExercises } = route.params || { selectedMuscleGroups: [] };
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
    console.log('🔍 [DEBUG] Loading exercises for muscle groups:', selectedMuscleGroups);
    console.log('🔍 [DEBUG] Platform:', Platform.OS);
    console.log('🔍 [DEBUG] Selected difficulty:', selectedDifficulty);
    
    let filteredExercises = [];
    
    selectedMuscleGroups.forEach(muscleGroup => {
      console.log(`🔍 [DEBUG] Processing muscle group: ${muscleGroup}`);
      try {
        const groupExercises = getExercisesByMuscleGroup(muscleGroup);
        console.log(`🔍 [DEBUG] Raw result for ${muscleGroup}:`, groupExercises);
        console.log(`🔍 [DEBUG] Type of result:`, typeof groupExercises);
        console.log(`🔍 [DEBUG] Is Array:`, Array.isArray(groupExercises));
        console.log(`🔍 [DEBUG] Length:`, groupExercises ? groupExercises.length : 'null/undefined');
        
        if (groupExercises && Array.isArray(groupExercises) && groupExercises.length > 0) {
          console.log(`🔍 [DEBUG] Adding ${groupExercises.length} exercises for ${muscleGroup}`);
          console.log(`🔍 [DEBUG] First exercise:`, groupExercises[0]);
          filteredExercises = [...filteredExercises, ...groupExercises];
        } else {
          console.warn(`⚠️ [WARNING] No exercises found for muscle group: ${muscleGroup}`);
        }
      } catch (error) {
        console.error(`❌ [ERROR] Error loading exercises for ${muscleGroup}:`, error);
      }
    });

    console.log('🔍 [DEBUG] Total exercises before difficulty filter:', filteredExercises.length);
    console.log('🔍 [DEBUG] Sample exercise:', filteredExercises[0]);

    if (selectedDifficulty !== 'all') {
      const beforeFilter = filteredExercises.length;
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.difficulty === selectedDifficulty
      );
      console.log(`🔍 [DEBUG] After difficulty filter (${selectedDifficulty}): ${filteredExercises.length} (was ${beforeFilter})`);
    }

    console.log('🔍 [DEBUG] Final filtered exercises:', filteredExercises.length);
    console.log('🔍 [DEBUG] Setting exercises to state...');
    setExercises(filteredExercises);
  };


  const startWorkoutWithExercise = (exercise) => {
    console.log('Starting workout with exercise:', exercise.name);
    console.log('Return to workout:', returnToWorkout);
    console.log('Current workout exercises:', currentWorkoutExercises?.length || 0);

    if (returnToWorkout && currentWorkoutExercises) {
      // Add exercise to existing workout
      navigation.navigate('Workout', {
        exercise,
        addToExistingWorkout: true,
        existingWorkoutExercises: currentWorkoutExercises
      });
    } else {
      // Start new workout
      navigation.navigate('Workout', { exercise });
    }
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

  const renderExercise = ({ item }) => {
    console.log('📱 [RENDER] Rendering exercise:', item.name);
    console.log('📱 [RENDER] Item data:', item);
    
    return (
      <View style={{
        backgroundColor: '#FF0000', // Bright red for debugging
        margin: 10,
        padding: 20,
        borderWidth: 3,
        borderColor: '#00FF00', // Bright green border
        minHeight: 150,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#000000',
          backgroundColor: '#FFFF00', // Yellow background for text
          padding: 5,
        }}>
          {item.name || 'NO NAME'}
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: '#000000',
          backgroundColor: '#FFFFFF',
          padding: 5,
          marginTop: 10,
        }}>
          Equipment: {item.equipment || 'Unknown'}
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: '#000000',
          backgroundColor: '#FFFFFF',
          padding: 5,
          marginTop: 5,
        }}>
          Difficulty: {item.difficulty || 'Unknown'}
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#0000FF',
            padding: 10,
            marginTop: 10,
            borderRadius: 5,
          }}
          onPress={() => {
            console.log('📱 [PRESS] Info button pressed for:', item.name);
            navigation.navigate('ExerciseDetail', { exercise: item, fromWorkout: false });
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            INFO BUTTON
          </Text>
        </TouchableOpacity>
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
      title="Exercise Library"
      subtitle={`${exercises.length} exercises for ${selectedMuscleGroups.length} muscle groups`}
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
          <FlatList
            data={exercises}
            renderItem={({ item, index }) => (
              <View style={styles.exerciseCard}>
                <View style={styles.exerciseContent}>
                  {/* Exercise Name */}
                  <Text style={styles.exerciseName}>{item.name}</Text>

                  {/* Exercise Meta */}
                  <View style={styles.exerciseMeta}>
                    <View style={styles.equipmentTag}>
                      <Text style={styles.equipmentIcon}>{getEquipmentIcon(item.equipment)}</Text>
                      <Text style={styles.equipmentText}>{item.equipment}</Text>
                    </View>
                    {item.difficulty === 'Beginner' && (
                      <View style={[styles.difficultyShape, styles.beginnerCircle]} />
                    )}
                    {item.difficulty === 'Intermediate' && (
                      <Text style={styles.intermediateTriangle}>🔸</Text>
                    )}
                    {item.difficulty === 'Advanced' && (
                      <View style={[styles.difficultyShape, styles.advancedSquare]} />
                    )}
                  </View>

                  {/* Instructions - Removed to save space */}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() => {
                        navigation.navigate('ExerciseDetail', { exercise: item, fromWorkout: false });
                      }}
                    >
                      <Text style={styles.infoButtonText}>Info</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => startWorkoutWithExercise(item)}
                    >
                      <Text style={styles.addButtonText}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            numColumns={2}
            keyExtractor={(item, index) => `exercise-${index}-${item.id || item.name}`}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
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
  webScrollView: {
    flex: 1,
  },
  exerciseListContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    height: 140,
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridContainer: {
    paddingBottom: Spacing.xxl,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    gap: Spacing.xs,
  },
  infoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    flex: 1,
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
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    height: 24,
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
    fontSize: 14,
    marginRight: 4,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  difficultyShape: {
    width: 14,
    height: 14,
  },
  beginnerCircle: {
    backgroundColor: '#4CAF50',
    borderRadius: 7,
  },
  intermediateTriangle: {
    fontSize: 14,
    color: '#FF9800',
  },
  advancedSquare: {
    backgroundColor: '#F44336',
    borderRadius: 0,
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    flex: 1,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: Typography.fontSize.sm,
  },
});