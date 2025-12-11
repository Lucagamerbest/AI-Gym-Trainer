// ⚠️ PROTECTED FILE - DO NOT MODIFY ⚠️
// This file is working correctly on both localhost and Expo Go
// Only modify if absolutely critical and with explicit user permission
// Last working version: 2025-09-13
// Status: WORKING - Exercise Library displays correctly on all platforms

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, TextInput, Image, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';
import { useWorkout } from '../context/WorkoutContext';
import { PinnedExerciseStorage } from '../services/pinnedExerciseStorage';
import { getVariantImage } from '../utils/exerciseImages';

// Cache for loaded exercises to make subsequent loads instant
const exerciseCache = new Map();
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
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false); // Debug mode disabled for clean UI
  const [debugLogs, setDebugLogs] = useState([]);
  const [hideVariations, setHideVariations] = useState(true); // Variations hidden for cleaner display
  const [pinnedKeys, setPinnedKeys] = useState(new Set()); // Track pinned exercises
  const [pinnedExercises, setPinnedExercises] = useState([]); // Pinned variants to show at top
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
    loadPinnedExercises();
  }, []);

  // Reload pinned exercises when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPinnedExercises();
    }, [activeMuscleFilters])
  );

  const loadPinnedExercises = async () => {
    const keys = await PinnedExerciseStorage.getPinnedExerciseKeys();
    setPinnedKeys(keys);

    // Load pinned variants filtered by current muscle groups
    const pinned = await PinnedExerciseStorage.getPinnedExercisesByMuscleGroup(activeMuscleFilters);
    setPinnedExercises(pinned);
  };

  // Reload pinned when muscle filters change
  useEffect(() => {
    loadPinnedExercises();
  }, [activeMuscleFilters]);

  // Handle unpinning a variant from the pinned section
  const handleUnpinVariant = async (pinnedExercise) => {
    await PinnedExerciseStorage.unpinVariant(pinnedExercise.id, pinnedExercise.equipment);
    await loadPinnedExercises();
  };

  // Start workout directly with a pinned variant (skip equipment selection)
  const startWorkoutWithPinnedVariant = (pinnedExercise) => {
    // Pinned exercises already have selectedVariant set, so skip equipment selection
    proceedWithExercise(pinnedExercise);
  };

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
    setIsLoading(true);
    try {
      let filteredExercises = [];

      // Use activeMuscleFilters for loading exercises
      const muscleGroupsToLoad = activeMuscleFilters;

      // Load all muscle groups in parallel for speed, using cache when available
      const promises = muscleGroupsToLoad.map(async (muscleGroup) => {
        try {
          // Check cache first for instant loading
          if (exerciseCache.has(muscleGroup)) {
            return exerciseCache.get(muscleGroup);
          }

          // Load from database and cache it
          const groupExercises = await getExercisesByMuscleGroup(muscleGroup);
          if (groupExercises) {
            exerciseCache.set(muscleGroup, groupExercises);
          }
          return groupExercises || [];
        } catch (error) {
          return [];
        }
      });

      const results = await Promise.all(promises);
      filteredExercises = results.flat();

      // Combine all filters into a single pass for better performance
      const hasFilters = selectedDifficulty !== 'all' || selectedEquipment !== 'all' || searchQuery.trim() !== '';

      if (hasFilters) {
        const query = searchQuery.toLowerCase().trim();
        const searchWords = query ? query.split(/\s+/).filter(word => word.length > 0) : [];
        let searchResults = [];

        filteredExercises.forEach(exercise => {
          // Difficulty filter
          if (selectedDifficulty !== 'all' && exercise.difficulty !== selectedDifficulty) {
            return;
          }

          // Equipment filter
          if (selectedEquipment !== 'all') {
            const equipment = exercise.equipment?.toLowerCase() || '';
            if (selectedEquipment === 'bodyweight') {
              if (!(equipment === 'bodyweight' || equipment === 'none' || equipment === '')) {
                return;
              }
            } else if (selectedEquipment === 'machine') {
              if (equipment !== 'machine') {
                return;
              }
            } else if (selectedEquipment === 'cable') {
              if (!(equipment === 'cable' || equipment === 'cable machine')) {
                return;
              }
            }
          }

          // Search query filter - searches name, description, equipment, and variations
          if (searchWords.length > 0) {
            const name = exercise.name.toLowerCase();
            const desc = (exercise.description || '').toLowerCase();
            const baseText = `${name} ${desc}`;

            // Check if base exercise name matches all words
            const baseMatches = searchWords.every(word => baseText.includes(word));

            if (baseMatches) {
              // Base exercise matches - show normally
              searchResults.push(exercise);
            } else {
              // Check each variant for matches
              const matchingVariants = [];
              if (exercise.variants) {
                exercise.variants.forEach(variant => {
                  const variantEquip = (variant.equipment || '').toLowerCase();
                  const combinedText = `${name} ${desc} ${variantEquip}`;
                  if (searchWords.every(word => combinedText.includes(word))) {
                    matchingVariants.push(variant);
                  }
                });
              }

              // Create entries for each matching variant
              if (matchingVariants.length > 0) {
                console.log(`=== Search: Found ${matchingVariants.length} matching variants for "${exercise.name}" ===`);
                matchingVariants.forEach(variant => {
                  console.log(`  - Variant: ${variant.equipment}`);
                  // Get the image for this specific variant
                  const variantImage = getVariantImage(exercise.name, variant.equipment);
                  searchResults.push({
                    ...exercise,
                    matchedVariant: variant,
                    displayName: exercise.name,
                    matchedEquipment: variant.equipment,
                    image: variantImage,
                    // Create unique key for this variant result
                    searchResultKey: `${exercise.id}-${variant.equipment}`,
                  });
                });
              }
            }
          } else {
            // No search query, just add the exercise
            searchResults.push(exercise);
          }
        });

        filteredExercises = searchResults;
      }

      // Sort with pinned exercises first
      const sortedExercises = PinnedExerciseStorage.sortWithPinnedFirst(filteredExercises, pinnedKeys);
      setExercises(sortedExercises);
    } finally {
      setIsLoading(false);
    }
  }, [activeMuscleFilters, selectedDifficulty, selectedEquipment, searchQuery, pinnedKeys]);


  const startWorkoutWithExercise = (exercise) => {
    console.log('=== startWorkoutWithExercise ===');
    console.log('Exercise received:', {
      id: exercise.id,
      name: exercise.name,
      hasMatchedVariant: !!exercise.matchedVariant,
      matchedEquipment: exercise.matchedEquipment,
      searchResultKey: exercise.searchResultKey,
      variantsCount: exercise.variants?.length,
    });

    // If exercise has a matched variant from search, use it directly
    if (exercise.matchedVariant) {
      const variant = exercise.matchedVariant;
      console.log('Using matched variant:', variant.equipment);
      const exerciseWithVariant = {
        ...exercise,
        displayName: exercise.name,
        name: `${exercise.name} (${variant.equipment})`,
        selectedVariant: variant,
        equipment: variant.equipment,
        difficulty: variant.difficulty,
      };
      console.log('Exercise with variant:', {
        id: exerciseWithVariant.id,
        name: exerciseWithVariant.name,
        displayName: exerciseWithVariant.displayName,
        equipment: exerciseWithVariant.equipment,
      });
      proceedWithExercise(exerciseWithVariant);
      return;
    }

    // Check if exercise has variants - if so, navigate to equipment selection
    if (exercise.variants && exercise.variants.length > 1) {
      navigation.navigate('EquipmentVariantSelection', {
        exercise,
        mode: 'workout',
        onSelect: proceedWithExercise,
        // Pass through context for proper navigation after selection
        navigationContext: {
          fromWorkout,
          fromProgramCreation,
          fromProgramDayEdit,
          programDayIndex,
          selectedMuscleGroups,
          fromLibrary
        }
      });
      return;
    }

    // If exercise has only one variant, use it directly
    if (exercise.variants && exercise.variants.length === 1) {
      const variant = exercise.variants[0];
      const exerciseWithVariant = {
        ...exercise,
        displayName: exercise.name,
        name: `${exercise.name} (${variant.equipment})`,
        selectedVariant: variant,
        equipment: variant.equipment,
        difficulty: variant.difficulty,
      };
      proceedWithExercise(exerciseWithVariant);
      return;
    }

    // No variants - use exercise as-is (legacy exercises)
    proceedWithExercise(exercise);
  };

  const proceedWithExercise = (exercise) => {
    console.log('=== proceedWithExercise ===');
    console.log('Exercise to add:', {
      id: exercise.id,
      name: exercise.name,
      displayName: exercise.displayName,
      equipment: exercise.equipment,
      selectedVariant: exercise.selectedVariant?.equipment,
      isFromLibrary: !!exercise.id,
    });

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

  // For viewing exercise info - navigate to equipment selection page
  const showInfoForExercise = (exercise) => {
    // If exercise has a matched variant from search, go directly to that variant's detail
    if (exercise.matchedVariant) {
      const variant = exercise.matchedVariant;
      const exerciseWithVariant = {
        ...exercise,
        displayName: exercise.name,
        name: `${exercise.name} (${variant.equipment})`,
        selectedVariant: variant,
        equipment: variant.equipment,
        difficulty: variant.difficulty,
      };
      navigation.navigate('ExerciseDetail', { exercise: exerciseWithVariant, fromWorkout: false });
      return;
    }

    // If exercise has variants, navigate to full-page equipment selection
    if (exercise.variants && exercise.variants.length > 1) {
      navigation.navigate('EquipmentVariantSelection', {
        exercise,
        mode: 'info'
      });
    } else {
      // No variants, navigate directly to detail
      navigation.navigate('ExerciseDetail', { exercise, fromWorkout: false });
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

  const getEquipmentLabel = (equipment) => {
    if (!equipment) return 'Bodyweight';
    const equipmentStr = String(equipment);
    // Normalize common variations
    if (equipmentStr.toLowerCase() === 'cable machine') return 'Cable';
    if (equipmentStr.toLowerCase() === 'none' || equipmentStr === '') return 'Bodyweight';
    return equipmentStr;
  };

  const getDifficultyLabel = (difficulty) => {
    if (!difficulty) return 'Intermediate';
    return String(difficulty);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'rgba(34, 197, 94, 0.3)';
      case 'Intermediate': return 'rgba(249, 115, 22, 0.3)';
      case 'Advanced': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(138, 43, 226, 0.3)';
    }
  };

  const getDifficultyTextColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#f97316';
      case 'Advanced': return '#ef4444';
      default: return Colors.primary;
    }
  };

  const getMuscleGroupLabel = (muscleGroup) => {
    if (!muscleGroup) return '';
    const str = String(muscleGroup);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getMuscleGroupColor = (muscleGroup) => {
    if (!muscleGroup) return 'rgba(138, 43, 226, 0.2)';
    const muscle = String(muscleGroup).toLowerCase();
    switch (muscle) {
      case 'chest': return 'rgba(239, 68, 68, 0.2)';
      case 'back': return 'rgba(59, 130, 246, 0.2)';
      case 'legs': return 'rgba(34, 197, 94, 0.2)';
      case 'shoulders': return 'rgba(251, 146, 60, 0.2)';
      case 'biceps': return 'rgba(168, 85, 247, 0.2)';
      case 'triceps': return 'rgba(236, 72, 153, 0.2)';
      case 'abs': return 'rgba(245, 158, 11, 0.2)';
      case 'forearms': return 'rgba(148, 163, 184, 0.2)';
      case 'cardio': return 'rgba(20, 184, 166, 0.2)';
      default: return 'rgba(138, 43, 226, 0.2)';
    }
  };

  const getMuscleGroupTextColor = (muscleGroup) => {
    if (!muscleGroup) return Colors.primary;
    const muscle = String(muscleGroup).toLowerCase();
    switch (muscle) {
      case 'chest': return '#ef4444';
      case 'back': return '#3b82f6';
      case 'legs': return '#22c55e';
      case 'shoulders': return '#fb923c';
      case 'biceps': return '#a855f7';
      case 'triceps': return '#ec4899';
      case 'abs': return '#f59e0b';
      case 'forearms': return '#94a3b8';
      case 'cardio': return '#14b8a6';
      default: return Colors.primary;
    }
  };

  const logDebug = (message, data = null) => {
    if (debugMode) {
      const logEntry = data ? `${message}: ${JSON.stringify(data)}` : message;
      setDebugLogs(prev => [...prev.slice(-19), logEntry]); // Keep last 20 logs
    }
  };

  const logAllExercises = () => {
    setDebugLogs([]); // Clear previous logs
    logDebug('=== EXERCISE VARIATION ANALYSIS ===');

    let withVariations = 0;
    let withoutVariations = 0;

    exercises.forEach((exercise, idx) => {
      const validVariants = getValidVariants(exercise);
      const hasVariants = validVariants && validVariants.length > 0;

      if (hasVariants) {
        withVariations++;
        const equipmentList = validVariants.map(v => v.equipment).join(', ');
        logDebug(`✓ ${idx + 1}. ${exercise.name}`, `HAS ${validVariants.length} VARIANTS: ${equipmentList}`);
      } else {
        withoutVariations++;
        const equipment = exercise.equipment || 'No equipment';
        logDebug(`✗ ${idx + 1}. ${exercise.name}`, `NO VARIANTS (single: ${equipment})`);
      }
    });

    logDebug('=== SUMMARY ===');
    logDebug(`Total exercises: ${exercises.length}`);
    logDebug(`With variations: ${withVariations}`);
    logDebug(`Without variations: ${withoutVariations}`);
    logDebug('=== END ANALYSIS ===');
  };

  const getValidVariants = (exercise) => {
    if (!exercise.variants || exercise.variants.length === 0) {
      return null;
    }

    // Filter out variants with empty/invalid equipment
    const validVariants = exercise.variants.filter(variant => {
      const equipment = variant.equipment;
      return equipment &&
             equipment !== '' &&
             equipment !== 'undefined' &&
             equipment !== 'null' &&
             String(equipment).trim().length > 0;
    });

    if (validVariants.length === 0) {
      return null;
    }

    // Remove duplicates
    const uniqueVariants = validVariants.filter((variant, index, self) =>
      index === self.findIndex(v => v.equipment === variant.equipment)
    );

    return uniqueVariants;
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
      screenName="ExerciseListScreen"
      hideWorkoutIndicator={true}
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      ) : exercises.length === 0 ? (
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

                {/* Pinned/Saved Exercises - Smaller grid layout */}
                {pinnedExercises.length > 0 && (
                  <View style={styles.pinnedSection}>
                    <View style={styles.pinnedHeader}>
                      <Text style={styles.pinnedHeaderIcon}>★</Text>
                      <Text style={styles.pinnedHeaderText}>Saved Exercises</Text>
                    </View>
                    <View style={styles.pinnedGrid}>
                      {pinnedExercises.map((pinned, idx) => (
                        <View key={pinned.pinKey || idx} style={styles.pinnedCard}>
                          <View style={styles.pinnedCardContent}>
                            {/* Title with star */}
                            <View style={styles.pinnedTitleRow}>
                              <Text style={styles.pinnedCardName} numberOfLines={2} ellipsizeMode="tail">
                                {pinned.displayName || pinned.name?.split(' (')[0]}
                              </Text>
                              <TouchableOpacity
                                style={styles.pinnedStarButton}
                                onPress={() => handleUnpinVariant(pinned)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Text style={styles.pinnedStarIcon}>★</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Equipment badge */}
                            <View style={styles.pinnedBadge}>
                              <Text style={styles.pinnedBadgeText}>{pinned.equipment}</Text>
                            </View>

                            {/* Action buttons */}
                            <View style={styles.pinnedButtonsRow}>
                              <TouchableOpacity
                                style={styles.pinnedInfoButton}
                                onPress={() => navigation.navigate('ExerciseDetail', { exercise: pinned, fromWorkout: false })}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.pinnedInfoButtonText}>Info</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.pinnedStartButton}
                                onPress={() => startWorkoutWithPinnedVariant(pinned)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.pinnedStartButtonText}>
                                  {fromProgramCreation ? 'Add' : (fromWorkout || isWorkoutActive() ? 'Add' : 'Start')}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                    {/* Divider line */}
                    <View style={styles.pinnedDivider} />
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
                    {item.image ? (
                      <TouchableOpacity
                        onPress={() => openFullScreenImage(item.image)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={typeof item.image === 'string' ? { uri: item.image } : item.image}
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
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    {item.isCustom && <Text style={styles.customBadge}>⭐ CUSTOM</Text>}
                    <Text style={styles.exerciseName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                    {/* Show matched variant when searching */}
                    {item.matchedEquipment && (
                      <View style={styles.matchedVariantBadge}>
                        <Text style={styles.matchedVariantText}>{item.matchedEquipment}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Exercise Meta */}
                <View style={styles.exerciseMeta}>
                  {/* Equipment badges */}
                  <View style={styles.metaBadgesContainer}>
                    {(() => {
                      const validVariants = getValidVariants(item);

                      // If there are multiple variants, show count in detailed view too
                      if (validVariants && validVariants.length > 1) {
                        return (
                          <View style={styles.equipmentBadge}>
                            <Text style={styles.equipmentBadgeText} numberOfLines={1} ellipsizeMode="tail">
                              {validVariants.length} variations
                            </Text>
                          </View>
                        );
                      }

                      // Single variant or no variants - show equipment type
                      const equipment = (validVariants && validVariants.length === 1)
                        ? validVariants[0].equipment
                        : item.equipment;

                      if (equipment && String(equipment).trim().length > 0) {
                        return (
                          <View style={styles.equipmentBadge}>
                            <Text style={styles.equipmentBadgeText} numberOfLines={1} ellipsizeMode="tail">
                              {getEquipmentLabel(equipment)}
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>

                  {/* Muscle Group badge */}
                  {item.muscleGroup && (
                    <View style={[styles.muscleGroupBadge, { backgroundColor: getMuscleGroupColor(item.muscleGroup) }]}>
                      <Text style={[styles.muscleGroupBadgeText, { color: getMuscleGroupTextColor(item.muscleGroup) }]}>
                        {getMuscleGroupLabel(item.muscleGroup)}
                      </Text>
                    </View>
                  )}

                  {/* Difficulty badge */}
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                    <Text style={[styles.difficultyBadgeText, { color: getDifficultyTextColor(item.difficulty) }]}>
                      {getDifficultyLabel(item.difficulty)}
                    </Text>
                  </View>
                </View>

                {/* Instructions - Removed to save space */}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => showInfoForExercise(item)}
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
              <View style={[
                styles.exerciseCard,
                debugMode && { borderWidth: 2, borderColor: '#ff00ff' }
              ]}>
                {/* Exercise Image - Small thumbnail for compact view */}
                {item.image && (
                  <TouchableOpacity
                    style={styles.compactImageContainer}
                    onPress={() => openFullScreenImage(item.image)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                      style={styles.compactExerciseImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                <View style={[
                  styles.exerciseContent,
                  debugMode && { borderWidth: 1, borderColor: '#00ff00' }
                ]}>
                  {/* Title Zone */}
                  <View style={styles.titleZone}>
                    <View style={styles.titleRow}>
                      {item.isCustom && <Text style={styles.customBadge}>⭐ CUSTOM</Text>}
                      <Text style={[styles.exerciseName, { flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                    </View>
                    {/* Show matched variant when searching */}
                    {item.matchedEquipment && (
                      <View style={styles.matchedVariantBadge}>
                        <Text style={styles.matchedVariantText}>{item.matchedEquipment}</Text>
                      </View>
                    )}
                  </View>

                  {/* Tag Zone - Fixed height area for badges */}
                  <View style={[
                    styles.tagZone,
                    debugMode && { borderWidth: 1, borderColor: '#ffff00' }
                  ]}>
                    <View style={styles.exerciseMeta}>
                    {/* Equipment badges */}
                    <View style={styles.metaBadgesContainer}>
                      {(() => {
                        const validVariants = getValidVariants(item);

                        // If there are multiple variants, show count instead of listing all
                        if (validVariants && validVariants.length > 1) {
                          return (
                            <View style={styles.equipmentBadge}>
                              <Text style={styles.equipmentBadgeText} numberOfLines={1} ellipsizeMode="tail">
                                {validVariants.length} variations
                              </Text>
                            </View>
                          );
                        }

                        // Single variant or no variants - show equipment type
                        const equipment = (validVariants && validVariants.length === 1)
                          ? validVariants[0].equipment
                          : item.equipment;

                        if (equipment && String(equipment).trim().length > 0) {
                          return (
                            <View style={styles.equipmentBadge}>
                              <Text style={styles.equipmentBadgeText} numberOfLines={1} ellipsizeMode="tail">
                                {getEquipmentLabel(equipment)}
                              </Text>
                            </View>
                          );
                        }
                        return null;
                      })()}
                    </View>

                      {/* Muscle Group badge */}
                      {item.muscleGroup && (
                        <View style={[styles.muscleGroupBadge, { backgroundColor: getMuscleGroupColor(item.muscleGroup) }]}>
                          <Text style={[styles.muscleGroupBadgeText, { color: getMuscleGroupTextColor(item.muscleGroup) }]}>
                            {getMuscleGroupLabel(item.muscleGroup)}
                          </Text>
                        </View>
                      )}

                      {/* Difficulty badge */}
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                        <Text style={[styles.difficultyBadgeText, { color: getDifficultyTextColor(item.difficulty) }]}>
                          {getDifficultyLabel(item.difficulty)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Spacer - Fills remaining space */}
                  <View style={styles.cardSpacer} />

                  {/* Action Buttons - Anchored at bottom */}
                  <View style={[
                    styles.actionButtons,
                    debugMode && { borderWidth: 1, borderColor: '#00ffff' }
                  ]}>
                    <TouchableOpacity
                      style={[
                        styles.infoButton,
                        debugMode && { borderWidth: 1, borderColor: '#ff0000' }
                      ]}
                      onPress={() => showInfoForExercise(item)}
                    >
                      <Text style={styles.infoButtonText} numberOfLines={1} ellipsizeMode="tail">Info</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        debugMode && { borderWidth: 1, borderColor: '#0000ff' }
                      ]}
                      onPress={() => startWorkoutWithExercise(item)}
                    >
                      <Text style={styles.addButtonText} numberOfLines={1} ellipsizeMode="tail">
                        {fromProgramCreation ? 'Add' : (fromWorkout || isWorkoutActive() ? 'Add' : 'Start')}
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
            source={typeof selectedImageUri === 'string' ? { uri: selectedImageUri } : selectedImageUri}
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
  // Pinned/Saved Exercises Section - Smaller grid layout
  pinnedSection: {
    marginHorizontal: 14,
    marginTop: Spacing.sm,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  pinnedHeaderIcon: {
    fontSize: 14,
    color: '#FFB300',
    marginRight: 6,
  },
  pinnedHeaderText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pinnedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pinnedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    width: '47%',
    minHeight: 170,
    marginBottom: 12,
  },
  pinnedImageContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  pinnedImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinnedCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pinnedTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pinnedCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  pinnedStarButton: {
    padding: 2,
    marginLeft: 6,
  },
  pinnedStarIcon: {
    fontSize: 16,
    color: '#FFB300',
  },
  pinnedBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pinnedBadgeText: {
    fontSize: 11,
    color: '#c9a0ff',
    fontWeight: '600',
  },
  pinnedButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  pinnedInfoButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.4,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.4)',
  },
  pinnedInfoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c9a0ff',
  },
  pinnedStartButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.6,
  },
  pinnedStartButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinnedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 46,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
    minHeight: 46,
    justifyContent: 'center',
  },
  filterToggleButtonActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  filterToggleIcon: {
    fontSize: 16,
  },
  filterToggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  debugToggleButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 46,
    minWidth: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugToggleButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderColor: '#ff0000',
    borderWidth: 1,
  },
  debugToggleText: {
    fontSize: 18,
  },
  debugConsole: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 2,
    borderTopColor: '#ff0000',
    maxHeight: 200,
    zIndex: 9999,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ff0000',
  },
  debugTitle: {
    color: '#ff0000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  debugActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debugActionButtonText: {
    color: '#ffaa00',
    fontSize: 12,
    fontWeight: '600',
  },
  debugActiveButton: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    borderRadius: 4,
  },
  debugActiveButtonText: {
    color: '#ffdd00',
  },
  debugClearButton: {
    color: '#ff6666',
    fontSize: 12,
    fontWeight: '600',
  },
  debugLogContainer: {
    maxHeight: 150,
    padding: 8,
  },
  debugLogText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  debugEmptyState: {
    padding: 20,
    alignItems: 'center',
  },
  debugEmptyText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
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
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    minHeight: 230,
    height: 230, // Fixed height for all cards
    width: '47%', // Fixed width for consistency
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between', // Distribute content evenly
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 14, // Consistent horizontal padding
    marginBottom: 0,
  },
  gridContainer: {
    paddingBottom: Spacing.xxl,
    paddingTop: 8,
  },
  exerciseContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start', // Changed from space-between to control spacing manually
  },
  // Title zone
  titleZone: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pinButton: {
    padding: 2,
    marginLeft: 4,
  },
  pinIcon: {
    fontSize: 14,
  },
  // Tag zone with fixed height
  tagZone: {
    minHeight: 68, // Increased height to accommodate more badges (allows 3 rows)
    marginBottom: 8,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  // Spacer to push buttons to bottom
  cardSpacer: {
    minHeight: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  matchedVariantBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  matchedVariantText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
    marginTop: 0, // Removed auto since card handles spacing
  },
  infoButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    flexBasis: '35%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.4)',
    minHeight: 38,
  },
  infoButtonText: {
    color: '#c9a0ff',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    flexShrink: 0, // Prevent text from shrinking/wrapping
  },
  exerciseMeta: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    width: '100%',
  },
  metaBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    flexWrap: 'wrap',
  },
  equipmentBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
    maxWidth: '100%', // Allow badge to use full available width
  },
  equipmentBadgeText: {
    fontSize: 10,
    color: '#c9a0ff',
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 14,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muscleGroupBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  muscleGroupBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Legacy styles - kept for compatibility
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  equipmentTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    gap: 4,
  },
  equipmentIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  equipmentIconOnly: {
    fontSize: 16,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  difficultyShape: {
    width: 16,
    height: 16,
  },
  beginnerCircle: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  intermediateTriangle: {
    backgroundColor: '#FF9800',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    flexBasis: '60%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.3,
    flexShrink: 0, // Prevent text from shrinking/wrapping
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