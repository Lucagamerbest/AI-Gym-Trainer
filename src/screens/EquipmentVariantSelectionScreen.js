import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { getVariantImage, isLocalImage } from '../utils/exerciseImages';
import { PinnedExerciseStorage } from '../services/pinnedExerciseStorage';

/**
 * Full-screen Equipment Variant Selection
 *
 * Shows all equipment variants for an exercise in a clean, scrollable page.
 * User selects their preferred equipment to either:
 * - View detailed info for that variant
 * - Add that variant to their workout
 */
export default function EquipmentVariantSelectionScreen({ navigation, route }) {
  const { exercise, mode, onSelect, navigationContext } = route.params || {};
  // mode: 'info' (view details) or 'workout' (add to workout)

  const { useWorkout } = require('../context/WorkoutContext');
  const { isWorkoutActive, activeWorkout, updateWorkout } = useWorkout();

  // Track which variant is expanded
  const [expandedVariantIndex, setExpandedVariantIndex] = useState(null);

  // Track image loading states
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});

  // Track pinned status for each variant
  const [pinnedVariants, setPinnedVariants] = useState(new Set());

  // Load pinned status on mount
  useEffect(() => {
    loadPinnedStatus();
  }, [exercise]);

  const loadPinnedStatus = async () => {
    if (!exercise?.variants) return;

    const pinnedKeys = await PinnedExerciseStorage.getPinnedExerciseKeys();
    const pinnedSet = new Set();

    exercise.variants.forEach(variant => {
      const pinKey = `${exercise.id}_${variant.equipment}`;
      if (pinnedKeys.has(pinKey)) {
        pinnedSet.add(variant.equipment);
      }
    });

    setPinnedVariants(pinnedSet);
  };

  const handleTogglePin = async (variant) => {
    const result = await PinnedExerciseStorage.togglePinVariant(exercise, variant);
    if (result.success) {
      // Update local state
      setPinnedVariants(prev => {
        const newSet = new Set(prev);
        if (newSet.has(variant.equipment)) {
          newSet.delete(variant.equipment);
        } else {
          newSet.add(variant.equipment);
        }
        return newSet;
      });
    }
  };

  const toggleVariant = (index) => {
    setExpandedVariantIndex(expandedVariantIndex === index ? null : index);
  };

  if (!exercise || !exercise.variants) {
    return (
      <ScreenLayout
        title="Equipment Selection"
        navigation={navigation}
        showBack={true}
        hideWorkoutIndicator={true}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No equipment variants available</Text>
        </View>
      </ScreenLayout>
    );
  }

  const handleVariantSelect = (variant) => {
    // Create exercise object with selected variant
    const exerciseWithVariant = {
      ...exercise,
      displayName: exercise.name,
      name: `${exercise.name} (${variant.equipment})`,
      selectedVariant: variant,
      equipment: variant.equipment,
      difficulty: variant.difficulty,
      image: getVariantImage(exercise.name, variant.equipment, 0),
      _originalExercise: exercise,
    };

    if (mode === 'info') {
      // Navigate to exercise detail screen
      navigation.replace('ExerciseDetail', {
        exercise: exerciseWithVariant,
        fromWorkout: false
      });
    } else {
      // Workout mode - add to workout
      const ctx = navigationContext || {};

      // If we're adding to a program creation or day edit
      if (ctx.fromProgramCreation || ctx.fromProgramDayEdit) {
        navigation.navigate('WorkoutDayEdit', {
          exercise: exerciseWithVariant,
          dayIndex: ctx.programDayIndex !== undefined ? ctx.programDayIndex : 0,
          lastSelectedMuscleGroups: ctx.selectedMuscleGroups,
          refresh: Date.now()
        });
        return;
      }

      // If we're adding to an existing workout
      if (ctx.fromWorkout && isWorkoutActive()) {
        const exercises = [...(activeWorkout.exercises || [])];
        exercises.push(exerciseWithVariant);
        updateWorkout({
          exercises,
          currentExerciseIndex: exercises.length - 1
        });
        // Go back to workout screen
        navigation.navigate('Workout');
      } else {
        // Starting a new workout
        navigation.navigate('Workout', {
          exercise: exerciseWithVariant,
          fromWorkout: false,
          selectedMuscleGroups: ctx.selectedMuscleGroups,
          fromLibrary: ctx.fromLibrary || false
        });
      }
    }
  };

  return (
    <ScreenLayout
      title={exercise.name}
      subtitle="Choose your equipment"
      navigation={navigation}
      showBack={true}
      hideWorkoutIndicator={true}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Select Equipment Variant</Text>
          <Text style={styles.headerSubtitle}>
            Each equipment type provides a unique training stimulus.
            Choose based on your goals and available equipment.
          </Text>
        </View>

        {/* Variant Cards - Expandable */}
        {exercise.variants.map((variant, index) => {
          const difficultyColor = getDifficultyColor(variant.difficulty);
          const equipmentIcon = getEquipmentIcon(variant.equipment);
          const isExpanded = expandedVariantIndex === index;
          const imageUrl = getVariantImage(exercise.name, variant.equipment, 0);
          const isImageLoading = imageLoadingStates[index];
          const hasImageError = imageErrorStates[index];

          return (
            <View
              key={`${variant.equipment}-${index}`}
              style={[
                styles.variantCard,
                isExpanded && styles.variantCardExpanded
              ]}
            >
              {/* Equipment Header - Tap to expand/collapse */}
              <TouchableOpacity
                style={styles.variantHeader}
                onPress={() => toggleVariant(index)}
                activeOpacity={0.7}
              >
                {/* Exercise Image Thumbnail */}
                <View style={styles.imageThumbnailContainer}>
                  {imageUrl && !hasImageError ? (
                    <>
                      <Image
                        source={isLocalImage(exercise.name, variant.equipment) ? imageUrl : { uri: imageUrl }}
                        style={styles.imageThumbnail}
                        resizeMode="cover"
                        onLoadStart={() => {
                          setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                        }}
                        onLoadEnd={() => {
                          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                        }}
                        onError={() => {
                          setImageErrorStates(prev => ({ ...prev, [index]: true }));
                          setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                        }}
                      />
                      {isImageLoading && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.equipmentIconLarge}>{equipmentIcon}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.equipmentRow}>
                  <Text style={[styles.equipmentName, { fontSize: getEquipmentNameFontSize(variant.equipment) }]} numberOfLines={3}>{variant.equipment}</Text>
                  {/* Difficulty indicator inline */}
                  <View style={styles.difficultyRow}>
                    {variant.difficulty === 'Beginner' && (
                      <View style={[styles.difficultyDot, { backgroundColor: '#4CAF50' }]} />
                    )}
                    {variant.difficulty === 'Intermediate' && (
                      <View style={[styles.difficultyDot, { backgroundColor: '#FF9800' }]} />
                    )}
                    {variant.difficulty === 'Advanced' && (
                      <View style={[styles.difficultyDot, { backgroundColor: '#F44336' }]} />
                    )}
                    <Text style={styles.difficultyLabel}>{variant.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Action Buttons Row */}
                  <View style={styles.actionButtonsRow}>
                    {/* Select Button */}
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => handleVariantSelect(variant)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectButtonText}>
                        {mode === 'info' ? 'View Details' : 'Select'}
                      </Text>
                      <Text style={styles.selectButtonIcon}>→</Text>
                    </TouchableOpacity>

                    {/* Pin/Favorite Button */}
                    <TouchableOpacity
                      style={[
                        styles.pinButton,
                        pinnedVariants.has(variant.equipment) && styles.pinButtonActive
                      ]}
                      onPress={() => handleTogglePin(variant)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pinButtonIcon}>
                        {pinnedVariants.has(variant.equipment) ? '★' : '☆'}
                      </Text>
                      <Text style={[
                        styles.pinButtonText,
                        pinnedVariants.has(variant.equipment) && styles.pinButtonTextActive
                      ]}>
                        {pinnedVariants.has(variant.equipment) ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Pros */}
                  {variant.pros && variant.pros.length > 0 && (
                    <View style={styles.prosConsSection}>
                      <Text style={styles.prosTitle}>✅ Advantages:</Text>
                      {variant.pros.map((pro, idx) => (
                        <Text key={idx} style={styles.proText}>• {pro}</Text>
                      ))}
                    </View>
                  )}

                  {/* Cons */}
                  {variant.cons && variant.cons.length > 0 && (
                    <View style={styles.prosConsSection}>
                      <Text style={styles.consTitle}>⚠️ Considerations:</Text>
                      {variant.cons.map((con, idx) => (
                        <Text key={idx} style={styles.conText}>• {con}</Text>
                      ))}
                    </View>
                  )}

                  {/* Setup Tips */}
                  {variant.setupTips && variant.setupTips.length > 0 && (
                    <View style={styles.prosConsSection}>
                      <Text style={styles.setupTitle}>💡 Setup Tips:</Text>
                      {variant.setupTips.map((tip, idx) => (
                        <Text key={idx} style={styles.setupText}>• {tip}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Style Variants Info */}
        {exercise.styleVariants && exercise.styleVariants.length > 0 && (
          <View style={styles.styleVariantsInfo}>
            <Text style={styles.styleVariantsTitle}>💡 Style Variations</Text>
            <Text style={styles.styleVariantsText}>
              This exercise also has {exercise.styleVariants.length} style variants
              (e.g., {exercise.styleVariants[0].name}). You can note your preferred
              style in your workout notes.
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
}

// Helper Functions
function getEquipmentNameFontSize(equipment) {
  const length = equipment?.length || 0;
  if (length > 32) return 12;
  if (length > 28) return 13;
  if (length > 24) return 14;
  if (length > 20) return 15;
  return 16; // default - normal size for short names
}

function getEquipmentIcon(equipment) {
  const equipmentLower = equipment?.toLowerCase() || '';
  if (equipmentLower.includes('barbell')) return '🏋️';
  if (equipmentLower.includes('dumbbell')) return '🏋️‍♂️';
  if (equipmentLower.includes('machine')) return '⚙️';
  if (equipmentLower.includes('cable')) return '🔗';
  if (equipmentLower.includes('bodyweight')) return '🤸‍♂️';
  if (equipmentLower.includes('smith')) return '🔩';
  if (equipmentLower.includes('kettlebell')) return '⚫';
  if (equipmentLower.includes('band')) return '🎗️';
  return '💪';
}

function getDifficultyColor(difficulty) {
  const difficultyLower = difficulty?.toLowerCase() || '';
  if (difficultyLower === 'beginner') return '#4CAF50';
  if (difficultyLower === 'intermediate') return '#FF9800';
  if (difficultyLower === 'advanced') return '#F44336';
  return Colors.primary;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  variantCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  variantCardExpanded: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  imageThumbnailContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    flexShrink: 0,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  equipmentIconLarge: {
    fontSize: 40,
  },
  expandIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.xs,
  },
  expandedContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  equipmentRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  equipmentIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  difficultyLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  difficultyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  difficultyShape: {
    width: 20,
    height: 20,
    marginRight: Spacing.xs,
  },
  beginnerCircle: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  intermediateTriangle: {
    backgroundColor: '#FF9800',
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  advancedSquare: {
    backgroundColor: '#F44336',
    borderRadius: 0,
  },
  prosConsSection: {
    marginBottom: Spacing.md,
  },
  prosTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: Spacing.xs,
  },
  proText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginLeft: Spacing.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  consTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: Spacing.xs,
  },
  conText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginLeft: Spacing.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  setupTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  setupText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    marginLeft: Spacing.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  selectButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  selectButtonIcon: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.background,
  },
  pinButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.xs,
    minWidth: 90,
  },
  pinButtonActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB300',
  },
  pinButtonIcon: {
    fontSize: 20,
    color: '#FFB300',
  },
  pinButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pinButtonTextActive: {
    color: '#FF8F00',
  },
  styleVariantsInfo: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  styleVariantsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  styleVariantsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
