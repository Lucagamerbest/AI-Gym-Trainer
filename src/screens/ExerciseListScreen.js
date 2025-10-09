// ⚠️ PROTECTED FILE - DO NOT MODIFY ⚠️
// This file is working correctly on both localhost and Expo Go
// Only modify if absolutely critical and with explicit user permission
// Last working version: 2025-09-13
// Status: WORKING - Exercise Library displays correctly on all platforms

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, TextInput, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';
import { useWorkout } from '../context/WorkoutContext';


export default function ExerciseListScreen({ navigation, route }) {
  const { isWorkoutActive, activeWorkout, updateWorkout } = useWorkout();
  const {
    selectedMuscleGroups,
    returnToWorkout,
    currentWorkoutExercises,
    fromWorkout,
    workoutStartTime,
    fromFreeWorkout,
    fromLibrary,
    fromProgramCreation,
    fromProgramDayEdit,
    programDayIndex,
    refresh
  } = route.params || { selectedMuscleGroups: [] };
  const [exercises, setExercises] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('compact');
  const [showFilters, setShowFilters] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  // Active muscle filters - initialized from selectedMuscleGroups or default to all
  const [activeMuscleFilters, setActiveMuscleFilters] = useState(
    selectedMuscleGroups && selectedMuscleGroups.length > 0
      ? selectedMuscleGroups
      : ['chest', 'back', 'legs', 'biceps', 'triceps', 'shoulders', 'abs', 'forearms', 'cardio']
  );


  useEffect(() => {
    loadExercises();
  }, [activeMuscleFilters, selectedDifficulty, selectedEquipment, searchQuery, refresh]);

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

  const loadExercises = useCallback(async () => {
    let filteredExercises = [];

    // Use activeMuscleFilters for loading exercises
    const muscleGroupsToLoad = activeMuscleFilters;

    // Load all muscle groups in parallel for speed
    const promises = muscleGroupsToLoad.map(async (muscleGroup) => {
      try {
        const groupExercises = await getExercisesByMuscleGroup(muscleGroup);
        return groupExercises || [];
      } catch (error) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    filteredExercises = results.flat();


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
  }, [activeMuscleFilters, selectedDifficulty, selectedEquipment, searchQuery]);


  const startWorkoutWithExercise = (exercise) => {
    // If we're adding to a program creation or day edit
    if (fromProgramCreation || fromProgramDayEdit) {
      // Navigate to WorkoutDayEdit screen with the exercise and remember muscle groups
      navigation.navigate('WorkoutDayEdit', {
        exercise,
        dayIndex: programDayIndex !== undefined ? programDayIndex : 0,
        lastSelectedMuscleGroups: selectedMuscleGroups,
        refresh: Date.now()
      });
      return;
    }

    // If we're adding to an existing workout, update context and go back
    if (fromWorkout && isWorkoutActive()) {
      // Add exercise to the active workout - allow duplicates
      const exercises = [...(activeWorkout.exercises || [])];
      exercises.push(exercise);
      // Update the workout context with new exercise
      updateWorkout({
        exercises,
        currentExerciseIndex: exercises.length - 1
      });
      // Go back to the workout screen (don't navigate to new instance)
      navigation.goBack();
      // If we came from muscle selection, go back once more
      if (route.params?.fromMuscleSelection) {
        navigation.goBack();
      }
    } else {
      // Starting a new workout
      navigation.navigate('Workout', {
        exercise,
        fromWorkout: false,
        selectedMuscleGroups: selectedMuscleGroups,
        fromLibrary: fromLibrary || false
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

  const openFullScreenImage = (imageUri) => {
    setSelectedImageUri(imageUri);
    setShowFullScreenImage(true);
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

  const muscleGroupOptions = [
    { id: 'chest', name: 'Chest', icon: '🎯' },
    { id: 'back', name: 'Back', icon: '🔺' },
    { id: 'legs', name: 'Legs', icon: '🦵' },
    { id: 'biceps', name: 'Biceps', icon: '💪' },
    { id: 'triceps', name: 'Triceps', icon: '🔥' },
    { id: 'shoulders', name: 'Shoulders', icon: '🤲' },
    { id: 'abs', name: 'Abs', icon: '🎯' },
    { id: 'forearms', name: 'Forearms', icon: '✊' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
  ];

  const toggleMuscleFilter = (muscleId) => {
    setActiveMuscleFilters(prev => {
      if (prev.includes(muscleId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== muscleId);
      } else {
        return [...prev, muscleId];
      }
    });
  };

  const getMuscleGroupsDisplay = () => {
    if (!selectedMuscleGroups || selectedMuscleGroups.length === 0) {
      return 'All muscle groups';
    } else if (selectedMuscleGroups.length === 1) {
      return selectedMuscleGroups[0].charAt(0).toUpperCase() + selectedMuscleGroups[0].slice(1);
    } else if (selectedMuscleGroups.length <= 3) {
      return selectedMuscleGroups.map(mg => mg.charAt(0).toUpperCase() + mg.slice(1)).join(', ');
    } else {
      return `${selectedMuscleGroups.length} muscle groups`;
    }
  };

  return (
    <ScreenLayout
      title={fromLibrary ? "Exercise Library" : "Exercise Selection"}
      subtitle={fromLibrary ? `${exercises.length} exercises available` : `${exercises.length} exercises for ${getMuscleGroupsDisplay()}`}
      navigation={navigation}
      showBack={true}
      scrollable={false}
      style={{ paddingHorizontal: 0 }}
    >
      {/* Static Search Bar and Filters */}
      <View style={styles.staticHeaderContainer}>
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

            {/* Muscles Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Muscles:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                <View style={styles.filterButtonsRow}>
                  {muscleGroupOptions.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.filterButton,
                        activeMuscleFilters.includes(item.id) && styles.selectedFilterButton
                      ]}
                      onPress={() => toggleMuscleFilter(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        activeMuscleFilters.includes(item.id) && styles.selectedFilterButtonText
                      ]}>
                        {item.icon} {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Exercise List */}
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
                {/* Create Exercise Button - Only show in library mode */}
                {fromLibrary && (
                  <TouchableOpacity
                    style={styles.createExerciseButtonInHeader}
                    onPress={() => navigation.navigate('CreateExercise')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createExerciseInListIcon}>🔍</Text>
                    <Text style={styles.createExerciseInListText}>Still not what you're looking for? Create custom exercise</Text>
                    <Text style={styles.createExerciseInListArrow}>→</Text>
                  </TouchableOpacity>
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
                    {item.image ? (
                      <TouchableOpacity
                        onPress={() => openFullScreenImage(item.image)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.exerciseImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={styles.imagePlaceholderText}>No Image</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.detailedExerciseContent}>
                {/* Exercise Name */}
                {item.isCustom && <Text style={styles.customBadge}>⭐ CUSTOM</Text>}
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
                    <Text style={styles.addButtonText}>
                      {fromProgramCreation ? 'Add to Program' : (fromWorkout || isWorkoutActive() ? 'Add Exercise' : 'Start')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
                </View>
              );
            }

            // Default compact view
            return (
              <View style={styles.exerciseCard}>
                {/* Exercise Image - Small thumbnail for compact view */}
                {item.image && (
                  <TouchableOpacity
                    style={styles.compactImageContainer}
                    onPress={() => openFullScreenImage(item.image)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.compactExerciseImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.exerciseContent}>
                  {/* Exercise Name */}
                  {item.isCustom && <Text style={styles.customBadge}>⭐ CUSTOM</Text>}
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
                      <Text style={styles.addButtonText}>
                      {fromProgramCreation ? 'Add' : (fromWorkout || isWorkoutActive() ? 'Add Exercise' : 'Start')}
                    </Text>
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
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          windowSize={8}
        />
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <View style={fullScreenImageStyles.overlay}>
          <TouchableOpacity
            style={fullScreenImageStyles.closeButton}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Text style={fullScreenImageStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImageUri }}
            style={fullScreenImageStyles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  staticHeaderContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContainer: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.xs,
  },
  muscleGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  muscleGroupIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  muscleGroupTextContainer: {
    flex: 1,
  },
  muscleGroupLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  muscleGroupValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  muscleGroupArrow: {
    fontSize: 18,
    color: Colors.primary,
    marginLeft: Spacing.sm,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: Typography.fontSize.md,
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
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  compactImageContainer: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    zIndex: 1,
  },
  compactExerciseImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
  // Custom Exercise Badge
  customBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Create Exercise Button in Header
  createExerciseButtonInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  createExerciseInListIcon: {
    fontSize: Typography.fontSize.md,
    marginRight: Spacing.sm,
  },
  createExerciseInListText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  createExerciseInListArrow: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

// Full screen image modal styles
const fullScreenImageStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});