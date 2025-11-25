/**
 * PlatePicker Component
 * Interactive plate selector for barbell exercises
 * Tap plates to add/remove them, automatically calculates total weight
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { BAR_TYPES, getBarWeight } from '../constants/weightEquipment';

// Available plates (per side) - most common gym plates
const AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5];

// Plate colors (Olympic standard-inspired)
const PLATE_COLORS = {
  45: { bg: '#2563EB', text: '#FFFFFF', name: 'Blue' },
  35: { bg: '#EAB308', text: '#000000', name: 'Yellow' },
  25: { bg: '#16A34A', text: '#FFFFFF', name: 'Green' },
  10: { bg: '#F5F5F5', text: '#000000', name: 'White' },
  5: { bg: '#DC2626', text: '#FFFFFF', name: 'Red' },
  2.5: { bg: '#16A34A', text: '#FFFFFF', name: 'Green' },
};

/**
 * Calculate plates from total weight
 */
const calculatePlatesFromWeight = (totalWeight, barWeight) => {
  const plates = {};
  AVAILABLE_PLATES.forEach(p => plates[p] = 0);

  if (totalWeight <= barWeight) return plates;

  let remainingPerSide = (totalWeight - barWeight) / 2;
  const sortedPlates = [...AVAILABLE_PLATES].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    while (remainingPerSide >= plate - 0.001) {
      plates[plate]++;
      remainingPerSide -= plate;
      remainingPerSide = Math.round(remainingPerSide * 100) / 100;
    }
  }

  return plates;
};

/**
 * Calculate total weight from plates
 */
const calculateWeightFromPlates = (plates, barWeight) => {
  let platesWeight = 0;
  Object.entries(plates).forEach(([weight, count]) => {
    platesWeight += parseFloat(weight) * count * 2; // Both sides
  });
  return barWeight + platesWeight;
};

/**
 * Single Plate Button Component
 */
const PlateButton = ({ weight, count, onAdd, onRemove }) => {
  const color = PLATE_COLORS[weight] || { bg: '#666', text: '#FFF' };

  return (
    <View style={styles.plateButtonContainer}>
      <Text style={styles.plateLabel}>{weight} lb</Text>
      <View style={styles.plateControls}>
        <TouchableOpacity
          style={[styles.plateControlButton, styles.removeButton]}
          onPress={onRemove}
          disabled={count === 0}
        >
          <Ionicons name="remove" size={18} color={count > 0 ? Colors.text : Colors.textMuted} />
        </TouchableOpacity>

        <View
          style={[
            styles.plateVisual,
            { backgroundColor: color.bg },
          ]}
        >
          <Text style={[styles.plateCount, { color: color.text }]}>
            {count}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.plateControlButton, styles.addButton]}
          onPress={onAdd}
        >
          <Ionicons name="add" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Visual Bar with Plates
 */
const BarVisualization = ({ plates, barType }) => {
  const bar = BAR_TYPES[barType] || BAR_TYPES.olympic;

  // Convert plates object to array for rendering
  const plateArray = [];
  const sortedWeights = [...AVAILABLE_PLATES].sort((a, b) => b - a);
  sortedWeights.forEach(weight => {
    for (let i = 0; i < (plates[weight] || 0); i++) {
      plateArray.push(weight);
    }
  });

  const getPlateHeight = (weight) => {
    if (weight >= 45) return 44;
    if (weight >= 35) return 38;
    if (weight >= 25) return 32;
    if (weight >= 10) return 26;
    if (weight >= 5) return 20;
    return 16;
  };

  return (
    <View style={styles.barVisualization}>
      {/* Left plates */}
      <View style={styles.platesRow}>
        {[...plateArray].reverse().map((weight, i) => (
          <View
            key={`left-${i}`}
            style={[
              styles.miniPlate,
              {
                backgroundColor: PLATE_COLORS[weight]?.bg || '#666',
                height: getPlateHeight(weight),
                width: 16,
              },
            ]}
          />
        ))}
      </View>

      {/* Bar */}
      <View style={[styles.barVisual, { backgroundColor: bar.color }]} />

      {/* Right plates */}
      <View style={styles.platesRow}>
        {plateArray.map((weight, i) => (
          <View
            key={`right-${i}`}
            style={[
              styles.miniPlate,
              {
                backgroundColor: PLATE_COLORS[weight]?.bg || '#666',
                height: getPlateHeight(weight),
                width: 16,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

/**
 * Main PlatePicker Component
 */
// Bar types to show in picker - organized by unique weights
const BAR_TYPE_OPTIONS = [
  { key: 'olympic', label: 'Olympic', weight: 45 },
  { key: 'womensOlympic', label: "Women's", weight: 35 },
  { key: 'ezCurl', label: 'EZ Curl', weight: 25 },
  { key: 'smith', label: 'Smith', weight: 20 },
  { key: 'smithLight', label: 'Smith Light', weight: 15 },
  { key: 'trapHeavy', label: 'Trap Heavy', weight: 55 },
  { key: 'safetySquat', label: 'Safety Squat', weight: 65 },
];

const PlatePicker = ({
  visible,
  onClose,
  onConfirm,
  initialWeight = 45,
  barType = 'olympic',
  unit = 'lbs',
}) => {
  // State for selected bar type and bar picker modal
  const [selectedBarType, setSelectedBarType] = useState(barType);
  const [showBarPicker, setShowBarPicker] = useState(false);
  const barWeight = getBarWeight(selectedBarType, unit);
  const bar = BAR_TYPES[selectedBarType] || BAR_TYPES.olympic;

  // Swipe to dismiss
  const startY = useRef(0);

  const handleTouchStart = (e) => {
    startY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e) => {
    const diff = e.nativeEvent.pageY - startY.current;
    if (diff > 50) {
      onClose();
    }
  };

  // Reset bar type when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedBarType(barType);
      setShowBarPicker(false);
    }
  }, [visible, barType]);

  // Initialize plates from initial weight
  const [plates, setPlates] = useState(() =>
    calculatePlatesFromWeight(parseFloat(initialWeight) || barWeight, barWeight)
  );

  // Update plates when initialWeight or bar type changes
  useEffect(() => {
    const weight = parseFloat(initialWeight) || barWeight;
    if (weight >= barWeight) {
      setPlates(calculatePlatesFromWeight(weight, barWeight));
    } else {
      // Reset plates if current weight is less than new bar weight
      const emptyPlates = {};
      AVAILABLE_PLATES.forEach(p => emptyPlates[p] = 0);
      setPlates(emptyPlates);
    }
  }, [initialWeight, barWeight]);

  // Calculate total weight
  const totalWeight = useMemo(() =>
    calculateWeightFromPlates(plates, barWeight),
    [plates, barWeight]
  );

  // Plates weight only
  const platesOnlyWeight = totalWeight - barWeight;

  const addPlate = (weight) => {
    setPlates(prev => ({
      ...prev,
      [weight]: (prev[weight] || 0) + 1,
    }));
  };

  const removePlate = (weight) => {
    setPlates(prev => ({
      ...prev,
      [weight]: Math.max(0, (prev[weight] || 0) - 1),
    }));
  };

  const handleConfirm = () => {
    onConfirm(totalWeight.toString());
    onClose();
  };

  const handleClear = () => {
    const emptyPlates = {};
    AVAILABLE_PLATES.forEach(p => emptyPlates[p] = 0);
    setPlates(emptyPlates);
  };

  // Quick add buttons for common weights
  const quickWeights = [135, 185, 225, 275, 315];

  const setQuickWeight = (weight) => {
    setPlates(calculatePlatesFromWeight(weight, barWeight));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Drag Handle - swipe down to dismiss */}
          <View
            style={styles.dragHandleContainer}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Plates</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Bar Type Button - Tap to change */}
          <TouchableOpacity
            style={styles.barTypeButton}
            onPress={() => setShowBarPicker(true)}
          >
            <View style={styles.barTypeInfo}>
              <Ionicons name="barbell" size={20} color={Colors.primary} />
              <Text style={styles.barTypeName}>{bar.name}</Text>
              <Text style={styles.barTypeWeight}>{barWeight} {unit}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Bar Type Picker Modal */}
          <Modal
            visible={showBarPicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBarPicker(false)}
          >
            <TouchableOpacity
              style={styles.barPickerOverlay}
              activeOpacity={1}
              onPress={() => setShowBarPicker(false)}
            >
              <View style={styles.barPickerContent}>
                <Text style={styles.barPickerTitle}>Select Bar Type</Text>
                {BAR_TYPE_OPTIONS.map(option => {
                  const isSelected = selectedBarType === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.barPickerOption,
                        isSelected && styles.barPickerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedBarType(option.key);
                        setShowBarPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.barPickerOptionName,
                        isSelected && styles.barPickerOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.barPickerOptionWeight,
                        isSelected && styles.barPickerOptionTextSelected,
                      ]}>
                        {option.weight} lbs
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          </Modal>

          <ScrollView showsVerticalScrollIndicator={false}>

          {/* Visual representation */}
          <BarVisualization plates={plates} barType={selectedBarType} />

          {/* Total Weight Display */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Weight</Text>
            <Text style={styles.totalWeight}>{totalWeight} {unit}</Text>
            {platesOnlyWeight > 0 && (
              <Text style={styles.platesOnlyText}>
                (Bar {barWeight} + Plates {platesOnlyWeight})
              </Text>
            )}
          </View>

          {/* Quick Weight Buttons */}
          <View style={styles.quickWeightsContainer}>
            {quickWeights.map(w => (
              <TouchableOpacity
                key={w}
                style={[
                  styles.quickWeightButton,
                  totalWeight === w && styles.quickWeightButtonActive,
                ]}
                onPress={() => setQuickWeight(w)}
              >
                <Text
                  style={[
                    styles.quickWeightText,
                    totalWeight === w && styles.quickWeightTextActive,
                  ]}
                >
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plate Selectors */}
          <View style={styles.platesGrid}>
            {AVAILABLE_PLATES.map(weight => (
              <PlateButton
                key={weight}
                weight={weight}
                count={plates[weight] || 0}
                onAdd={() => addPlate(weight)}
                onRemove={() => removePlate(weight)}
              />
            ))}
          </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm {totalWeight} {unit}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: -Spacing.md,
    marginTop: -Spacing.xs,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: Colors.textMuted,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  barTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  barTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  barTypeName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  barTypeWeight: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  barPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  barPickerContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  barPickerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  barPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  barPickerOptionSelected: {
    backgroundColor: Colors.card,
  },
  barPickerOptionName: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  barPickerOptionWeight: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  barPickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  barInfo: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  barVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  platesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlate: {
    borderRadius: 3,
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  barVisual: {
    width: 80,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  totalWeight: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  platesOnlyText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  quickWeightsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  quickWeightButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickWeightButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickWeightText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quickWeightTextActive: {
    color: Colors.background,
  },
  platesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  plateButtonContainer: {
    alignItems: 'center',
    width: '33%',
    marginBottom: Spacing.md,
  },
  plateLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  plateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plateControlButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeButton: {},
  addButton: {
    borderColor: Colors.primary,
  },
  plateVisual: {
    width: 38,
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  plateCount: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.background,
    fontWeight: '700',
  },
});

export default PlatePicker;
