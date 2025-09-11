import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  professionalExerciseDatabase,
  exerciseCategories,
  getExercisesByMuscle,
  getExercisesByEquipment,
  getExercisesByDifficulty,
  getExercisesByMovementPattern,
  searchExercises
} from '../data/professionalExerciseDatabase';

export default function ProfessionalExerciseListScreen({ navigation, route }) {
  const { initialFilters = {} } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState(professionalExerciseDatabase);
  const [filteredExercises, setFilteredExercises] = useState(professionalExerciseDatabase);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    muscle: initialFilters.muscle || null,
    equipment: initialFilters.equipment || null,
    difficulty: initialFilters.difficulty || null,
    movementPattern: initialFilters.movementPattern || null,
    mechanics: null,
    force: null,
    ...initialFilters
  });

  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeFilters]);

  const applyFilters = () => {
    let filtered = [...professionalExerciseDatabase];

    // Apply search
    if (searchQuery) {
      filtered = searchExercises(searchQuery);
    }

    // Apply muscle filter
    if (activeFilters.muscle) {
      filtered = filtered.filter(exercise => 
        exercise.primaryMuscles.includes(activeFilters.muscle) || 
        exercise.secondaryMuscles.includes(activeFilters.muscle)
      );
    }

    // Apply equipment filter
    if (activeFilters.equipment) {
      filtered = filtered.filter(exercise => exercise.equipment === activeFilters.equipment);
    }

    // Apply difficulty filter
    if (activeFilters.difficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === activeFilters.difficulty);
    }

    // Apply movement pattern filter
    if (activeFilters.movementPattern) {
      filtered = filtered.filter(exercise => exercise.movementPattern === activeFilters.movementPattern);
    }

    // Apply mechanics filter
    if (activeFilters.mechanics) {
      filtered = filtered.filter(exercise => exercise.mechanics === activeFilters.mechanics);
    }

    // Apply force filter
    if (activeFilters.force) {
      filtered = filtered.filter(exercise => exercise.force === activeFilters.force);
    }

    setFilteredExercises(filtered);
  };

  const clearFilters = () => {
    setActiveFilters({
      muscle: null,
      equipment: null,
      difficulty: null,
      movementPattern: null,
      mechanics: null,
      force: null
    });
    setSearchQuery('');
  };

  const toggleFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      case 'Expert': return '#7C2D12';
      default: return Colors.primary;
    }
  };

  const getMechanicsColor = (mechanics) => {
    return mechanics === 'Compound' ? '#8B5CF6' : '#06B6D4';
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => value !== null).length;
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersButton}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Muscle Groups */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Muscle Groups</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.filterChip,
                    activeFilters.muscle === muscle && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('muscle', muscle)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.muscle === muscle && styles.activeFilterChipText
                  ]}>
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Equipment */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Equipment</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.equipment.map((equipment) => (
                <TouchableOpacity
                  key={equipment}
                  style={[
                    styles.filterChip,
                    activeFilters.equipment === equipment && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('equipment', equipment)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.equipment === equipment && styles.activeFilterChipText
                  ]}>
                    {equipment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Difficulty</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.difficulty.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterChip,
                    activeFilters.difficulty === difficulty && styles.activeFilterChip,
                    { borderColor: getDifficultyColor(difficulty) + '40' }
                  ]}
                  onPress={() => toggleFilter('difficulty', difficulty)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.difficulty === difficulty && styles.activeFilterChipText,
                    { color: activeFilters.difficulty === difficulty ? Colors.background : getDifficultyColor(difficulty) }
                  ]}>
                    {difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Movement Patterns */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Movement Patterns</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.movementPatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  style={[
                    styles.filterChip,
                    activeFilters.movementPattern === pattern && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('movementPattern', pattern)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.movementPattern === pattern && styles.activeFilterChipText
                  ]}>
                    {pattern}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercise Type */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Exercise Type</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.mechanics.map((mechanics) => (
                <TouchableOpacity
                  key={mechanics}
                  style={[
                    styles.filterChip,
                    activeFilters.mechanics === mechanics && styles.activeFilterChip,
                    { borderColor: getMechanicsColor(mechanics) + '40' }
                  ]}
                  onPress={() => toggleFilter('mechanics', mechanics)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.mechanics === mechanics && styles.activeFilterChipText,
                    { color: activeFilters.mechanics === mechanics ? Colors.background : getMechanicsColor(mechanics) }
                  ]}>
                    {mechanics}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Force */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Force Type</Text>
            <View style={styles.filterGrid}>
              {exerciseCategories.force.map((force) => (
                <TouchableOpacity
                  key={force}
                  style={[
                    styles.filterChip,
                    activeFilters.force === force && styles.activeFilterChip
                  ]}
                  onPress={() => toggleFilter('force', force)}
                >
                  <Text style={[
                    styles.filterChipText,
                    activeFilters.force === force && styles.activeFilterChipText
                  ]}>
                    {force}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderExerciseCard = (exercise) => (
    <TouchableOpacity
      key={exercise.id}
      style={styles.exerciseCard}
      onPress={() => navigation.navigate('ProfessionalExerciseDetail', { exercise })}
      activeOpacity={0.9}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.exerciseMeta}>
            <View style={styles.equipmentTag}>
              <Text style={styles.equipmentText}>{exercise.equipment}</Text>
            </View>
            <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                {exercise.difficulty}
              </Text>
            </View>
            <View style={[styles.mechanicsTag, { backgroundColor: getMechanicsColor(exercise.mechanics) + '20' }]}>
              <Text style={[styles.mechanicsText, { color: getMechanicsColor(exercise.mechanics) }]}>
                {exercise.mechanics}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
      
      <View style={styles.muscleGroups}>
        <View style={styles.primaryMuscles}>
          <Text style={styles.muscleLabel}>Primary: </Text>
          {exercise.primaryMuscles.slice(0, 2).map((muscle, index) => (
            <Text key={index} style={styles.primaryMuscleTag}>
              {muscle}{index < Math.min(exercise.primaryMuscles.length, 2) - 1 ? ', ' : ''}
            </Text>
          ))}
        </View>
        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.secondaryMuscles}>
            <Text style={styles.muscleLabel}>Secondary: </Text>
            {exercise.secondaryMuscles.slice(0, 2).map((muscle, index) => (
              <Text key={index} style={styles.secondaryMuscleTag}>
                {muscle}{index < Math.min(exercise.secondaryMuscles.length, 2) - 1 ? ', ' : ''}
              </Text>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.exerciseFooter}>
        <View style={styles.movementPattern}>
          <Text style={styles.movementPatternText}>{exercise.movementPattern}</Text>
        </View>
        <View style={styles.forceType}>
          <Text style={styles.forceTypeText}>{exercise.force}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout
      title="Exercise Library"
      subtitle={`${filteredExercises.length} exercises found`}
      navigation={navigation}
      showBack={true}
    >
      <View style={styles.container}>
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, getActiveFilterCount() > 0 && styles.activeFilterButton]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={[styles.filterButtonText, getActiveFilterCount() > 0 && styles.activeFilterButtonText]}>
              🔧 {getActiveFilterCount() > 0 ? `(${getActiveFilterCount()})` : 'Filters'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(activeFilters).map(([key, value]) => 
                value && (
                  <View key={key} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {key === 'movementPattern' ? 'Pattern' : key}: {value}
                    </Text>
                    <TouchableOpacity onPress={() => toggleFilter(key, value)}>
                      <Text style={styles.removeFilterButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        )}

        {/* Exercise List */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.exerciseList}>
          {filteredExercises.map(renderExerciseCard)}
        </ScrollView>

        {/* Filter Modal */}
        {renderFilterModal()}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  filterButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: Colors.background,
  },
  activeFiltersContainer: {
    marginBottom: Spacing.md,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.xs,
  },
  activeFilterText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  removeFilterButton: {
    marginLeft: Spacing.xs,
    fontSize: 12,
    color: Colors.primary,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exerciseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  equipmentTag: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    fontWeight: '500',
  },
  difficultyTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  mechanicsTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  mechanicsText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: Colors.primary,
  },
  muscleGroups: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  primaryMuscles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  secondaryMuscles: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  muscleLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  primaryMuscleTag: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  secondaryMuscleTag: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  movementPattern: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  movementPatternText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    fontWeight: '500',
  },
  forceType: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  forceTypeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    fontSize: 24,
    color: Colors.text,
    width: 40,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearFiltersButton: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  filterContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: Colors.background,
  },
});