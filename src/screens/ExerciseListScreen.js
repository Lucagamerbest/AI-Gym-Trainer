// ⚠️ PROTECTED FILE - DO NOT MODIFY ⚠️
// This file is working correctly on both localhost and Expo Go
// Only modify if absolutely critical and with explicit user permission
// Last working version: 2025-09-13
// Status: WORKING - Exercise Library displays correctly on all platforms

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';


export default function ExerciseListScreen({ navigation, route }) {
  const { 
    selectedMuscleGroups, 
    returnToWorkout, 
    currentWorkoutExercises,
    fromWorkout,
    workoutStartTime,
    fromFreeWorkout 
  } = route.params || { selectedMuscleGroups: [] };
  const [exercises, setExercises] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('compact');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    loadExercises();
  }, [selectedMuscleGroups, selectedDifficulty, selectedEquipment, searchQuery]);

  useEffect(() => {
    loadDisplayMode();
  }, []);

  const loadDisplayMode = async () => {
    try {
      const saved = await AsyncStorage.getItem('exerciseDisplayMode');
      if (saved) {
        setDisplayMode(saved);
      }
    } catch (error) {
    }
  };

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
    
    let filteredExercises = [];
    
    selectedMuscleGroups.forEach(muscleGroup => {
      try {
        const groupExercises = getExercisesByMuscleGroup(muscleGroup);
        
        if (groupExercises && Array.isArray(groupExercises) && groupExercises.length > 0) {
          filteredExercises = [...filteredExercises, ...groupExercises];
        }
      } catch (error) {
        // Silent error handling
      }
    });


    if (selectedDifficulty !== 'all') {
      const beforeFilter = filteredExercises.length;
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.difficulty === selectedDifficulty
      );
    }

    // Filter by equipment type
    if (selectedEquipment !== 'all') {
      filteredExercises = filteredExercises.filter(exercise => {
        const equipment = exercise.equipment?.toLowerCase() || '';
        if (selectedEquipment === 'bodyweight') {
          return equipment === 'bodyweight' || equipment === 'none' || equipment === '';
        } else if (selectedEquipment === 'machine') {
          return equipment === 'machine';
        } else if (selectedEquipment === 'cable') {
          return equipment === 'cable' || equipment === 'cable machine';
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        (exercise.description && exercise.description.toLowerCase().includes(query))
      );
    }

    setExercises(filteredExercises);
  };


  const startWorkoutWithExercise = (exercise) => {

    // Handle different navigation modes
    if (fromWorkout || (returnToWorkout && currentWorkoutExercises)) {
      // Add exercise to existing workout
      navigation.navigate('Workout', {
        exercise,
        addToExistingWorkout: true,
        existingWorkoutExercises: currentWorkoutExercises || [],
        workoutStartTime: workoutStartTime,
        selectedMuscleGroups: selectedMuscleGroups
      });
    } else if (fromFreeWorkout) {
      // Start new workout from free workout mode
      navigation.navigate('Workout', { 
        exercise,
        selectedMuscleGroups: selectedMuscleGroups 
      });
    } else {
      // Normal workout start from exercise library
      navigation.navigate('Workout', { 
        exercise,
        selectedMuscleGroups: selectedMuscleGroups 
      });
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


  const difficultyOptions = [
    { id: 'all', name: 'All Levels' },
    { id: 'Beginner', name: 'Beginner' },
    { id: 'Intermediate', name: 'Intermediate' },
    { id: 'Advanced', name: 'Advanced' },
  ];

  const equipmentOptions = [
    { id: 'all', name: 'All Equipment' },
    { id: 'bodyweight', name: 'Bodyweight' },
    { id: 'machine', name: 'Machine' },
    { id: 'cable', name: 'Cable' },
  ];

  return (
    <ScreenLayout
      title="Exercise Library"
      subtitle={`${exercises.length} exercises for ${selectedMuscleGroups.length} muscle groups`}
      navigation={navigation}
      showBack={true}
      scrollable={false}
      style={{ paddingHorizontal: 0 }}
    >
      {/* Exercise List with integrated header */}
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
          ListHeaderComponent={() => {
            return (
              <View style={styles.headerContainer}>
                {/* Search Bar with Filter Button */}
                <View style={styles.searchBarRow}>
                  <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search exercises..."
                      placeholderTextColor={Colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}
                      >
                        <Text style={styles.clearButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.filterToggleButton, (selectedDifficulty !== 'all' || selectedEquipment !== 'all') && styles.filterToggleButtonActive]}
                    onPress={() => setShowFilters(!showFilters)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterToggleIcon}>⚙️</Text>
                    <Text style={styles.filterToggleText}>Filter</Text>
                  </TouchableOpacity>
                </View>

                {/* Collapsible Filter Section */}
                {showFilters && (
                  <View style={styles.filtersContainer}>
                    {/* Difficulty Filter */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Difficulty:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <View style={styles.filterButtonsRow}>
                          {difficultyOptions.map(item => (
                            <TouchableOpacity
                              key={item.id}
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
                          ))}
                        </View>
                      </ScrollView>
                    </View>

                    {/* Equipment Filter */}
                    <View style={styles.filterSection}>
                      <Text style={styles.filterLabel}>Equipment:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                        <View style={styles.filterButtonsRow}>
                          {equipmentOptions.map(item => (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.filterButton,
                                selectedEquipment === item.id && styles.selectedFilterButton
                              ]}
                              onPress={() => setSelectedEquipment(item.id)}
                              activeOpacity={0.8}
                            >
                              <Text style={[
                                styles.filterButtonText,
                                selectedEquipment === item.id && styles.selectedFilterButtonText
                              ]}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          renderItem={({ item, index }) => {
            // Render detailed view for iOS when display mode is detailed
            if (displayMode === 'detailed') {
              return (
                <View style={styles.detailedExerciseCard}>
                  <View style={styles.detailedImageContainer}>
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Image Description</Text>
                    </View>
                  </View>
                  <View style={styles.detailedExerciseContent}>
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
                    <Text style={styles.addButtonText}>{fromWorkout ? 'Select' : 'Start'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
                </View>
              );
            }

            // Default compact view
            return (
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
                      <Text style={styles.addButtonText}>{fromWorkout ? 'Select' : 'Start'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          numColumns={displayMode === 'detailed' ? 1 : 2}
          key={displayMode}
          keyExtractor={(item, index) => `exercise-${index}-${item.id || item.name}`}
          columnWrapperStyle={displayMode === 'detailed' ? null : styles.gridRow}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        />
      )}

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.xs,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.xs,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  filterToggleButtonActive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  filterToggleIcon: {
    fontSize: 16,
  },
  filterToggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    minWidth: 70,
  },
  filterScrollView: {
    flex: 1,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
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

  // Detailed View Styles
  detailedExerciseCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
  },
  detailedImageContainer: {
    marginRight: Spacing.md,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
  },
  detailedExerciseContent: {
    flex: 1,
  },
});