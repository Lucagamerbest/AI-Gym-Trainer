import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Equipment Variant Selector Modal
 *
 * Shows a clean UI for selecting equipment variants when adding an exercise to workout.
 * Each variant gets its own separate history tracking.
 *
 * Props:
 * - visible: boolean
 * - exercise: object with variants array
 * - onSelect: (exerciseWithVariant) => void - Called when user selects a variant
 * - onClose: () => void - Called when user closes modal
 */
export default function EquipmentVariantModal({ visible, exercise, onSelect, onClose }) {

  if (!exercise || !exercise.variants) {
    return null;
  }

  const handleVariantSelect = (variant) => {
    // Create a new exercise object with the selected variant
    // This exercise will have a unique name for history tracking
    const exerciseWithVariant = {
      ...exercise,
      // For display
      displayName: exercise.name,
      // For tracking (unique per variant)
      name: `${exercise.name} (${variant.equipment})`,
      // Selected variant details
      selectedVariant: variant,
      equipment: variant.equipment,
      difficulty: variant.difficulty,
      // Keep variant data for future reference
      _originalExercise: exercise,
    };

    onSelect(exerciseWithVariant);
  };

  // Group variants by equipment type for better organization
  const equipmentTypes = exercise.variants.map(v => v.equipment);
  const uniqueEquipmentTypes = [...new Set(equipmentTypes)];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Equipment</Text>
            <Text style={styles.subtitle}>{exercise.name}</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Variants List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {exercise.variants.map((variant, index) => {
              const difficultyColor = getDifficultyColor(variant.difficulty);
              const equipmentIcon = getEquipmentIcon(variant.equipment);

              return (
                <TouchableOpacity
                  key={`${variant.equipment}-${index}`}
                  style={styles.variantCard}
                  onPress={() => handleVariantSelect(variant)}
                  activeOpacity={0.7}
                >
                  {/* Equipment Name & Icon */}
                  <View style={styles.variantHeader}>
                    <View style={styles.equipmentRow}>
                      <Text style={styles.equipmentIcon}>{equipmentIcon}</Text>
                      <Text style={styles.equipmentName} numberOfLines={1} ellipsizeMode="tail">{variant.equipment}</Text>
                    </View>
                    {variant.difficulty === 'Beginner' && (
                      <View style={[styles.difficultyShape, styles.beginnerCircle]} />
                    )}
                    {variant.difficulty === 'Intermediate' && (
                      <View style={[styles.difficultyShape, styles.intermediateTriangle]} />
                    )}
                    {variant.difficulty === 'Advanced' && (
                      <View style={[styles.difficultyShape, styles.advancedSquare]} />
                    )}
                  </View>

                  {/* Pros */}
                  {variant.pros && variant.pros.length > 0 && (
                    <View style={styles.prosConsSection}>
                      <Text style={styles.prosTitle}>✅ Pros:</Text>
                      {variant.pros.slice(0, 2).map((pro, idx) => (
                        <Text key={idx} style={styles.proText}>• {pro}</Text>
                      ))}
                    </View>
                  )}

                  {/* Cons */}
                  {variant.cons && variant.cons.length > 0 && (
                    <View style={styles.prosConsSection}>
                      <Text style={styles.consTitle}>⚠️ Cons:</Text>
                      {variant.cons.slice(0, 2).map((con, idx) => (
                        <Text key={idx} style={styles.conText}>• {con}</Text>
                      ))}
                    </View>
                  )}

                  {/* Tap to Select Hint */}
                  <View style={styles.selectHint}>
                    <Text style={styles.selectHintText}>Tap to select →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Style Variants Info (if applicable) */}
            {exercise.styleVariants && exercise.styleVariants.length > 0 && (
              <View style={styles.styleVariantsInfo}>
                <Text style={styles.styleVariantsTitle}>💡 Tip: Style Variants Available</Text>
                <Text style={styles.styleVariantsText}>
                  This exercise has {exercise.styleVariants.length} style variants (e.g., {exercise.styleVariants[0].name}).
                  You can note which style you're using in your workout notes.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Helper Functions
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.background + 'DD',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.background,
    fontWeight: 'bold',
  },
  scrollView: {
    padding: Spacing.md,
  },
  variantCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  equipmentIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  equipmentName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    minWidth: 70,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  difficultyShape: {
    width: 20,
    height: 20,
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
    marginBottom: Spacing.sm,
  },
  prosTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  proText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    lineHeight: 20,
  },
  consTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  conText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    lineHeight: 20,
  },
  selectHint: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  selectHintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  styleVariantsInfo: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
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
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
