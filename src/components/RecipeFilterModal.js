import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * RecipeFilterModal
 *
 * Let user specify filters before searching database
 * This ensures results match their actual needs (e.g., high protein within 500 calories)
 */
export default function RecipeFilterModal({
  visible,
  onClose,
  onSearch,
  defaultMaxCalories = 600,
  defaultMinProtein = 30,
  buttonContext = 'high-protein', // 'high-protein', 'low-calorie', 'quick'
}) {
  const [maxCalories, setMaxCalories] = useState(defaultMaxCalories);
  const [minProtein, setMinProtein] = useState(defaultMinProtein);
  const [selectedMealType, setSelectedMealType] = useState('any');

  const mealTypes = [
    { value: 'any', label: 'Any Meal', icon: 'restaurant' },
    { value: 'breakfast', label: 'Breakfast', icon: 'sunny' },
    { value: 'lunch', label: 'Lunch', icon: 'nutrition' },
    { value: 'dinner', label: 'Dinner', icon: 'moon' },
    { value: 'snack', label: 'Snack', icon: 'fast-food' },
  ];

  const handleSearch = () => {
    const filters = {
      maxCalories: maxCalories,
      minProtein: minProtein,
      mealType: selectedMealType,
      buttonContext,
    };
    onSearch(filters);
    onClose();
  };

  const getTitle = () => {
    if (buttonContext.includes('low-calorie')) return 'Find Low-Calorie Recipe';
    if (buttonContext.includes('high-protein')) return 'Find High-Protein Recipe';
    if (buttonContext.includes('quick')) return 'Find Quick Recipe';
    return 'Filter Recipes';
  };

  const getDescription = () => {
    if (buttonContext.includes('low-calorie')) {
      return 'Set your calorie limit and meal type';
    }
    if (buttonContext.includes('high-protein')) {
      return 'Get maximum protein within your calorie budget';
    }
    return 'Set your preferences';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getDescription()}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Max Calories Slider */}
            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  <Ionicons name="flame" size={16} color={Colors.primary} /> Max Calories
                </Text>
                <Text style={styles.valueDisplay}>{maxCalories} cal</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={1000}
                step={50}
                value={maxCalories}
                onValueChange={(value) => setMaxCalories(value)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>100</Text>
                <Text style={styles.sliderLabel}>1000</Text>
              </View>
              <Text style={styles.hint}>
                Recipes will be within this calorie limit
              </Text>
            </View>

            {/* Min Protein Slider (for high-protein context) */}
            {buttonContext.includes('high-protein') && (
              <View style={styles.inputSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    <Ionicons name="fitness" size={16} color={Colors.success} /> Min Protein
                  </Text>
                  <Text style={styles.valueDisplay}>{minProtein}g</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={10}
                  maximumValue={100}
                  step={5}
                  value={minProtein}
                  onValueChange={(value) => setMinProtein(value)}
                  minimumTrackTintColor={Colors.success}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.success}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>10g</Text>
                  <Text style={styles.sliderLabel}>100g</Text>
                </View>
                <Text style={styles.hint}>
                  Minimum protein grams required
                </Text>
              </View>
            )}

            {/* Meal Type Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                <Ionicons name="time" size={16} color={Colors.info} /> Meal Type
              </Text>
              <View style={styles.mealTypeGrid}>
                {mealTypes.map((meal) => (
                  <TouchableOpacity
                    key={meal.value}
                    style={[
                      styles.mealTypeButton,
                      selectedMealType === meal.value && styles.mealTypeButtonActive,
                    ]}
                    onPress={() => setSelectedMealType(meal.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={meal.icon}
                      size={20}
                      color={selectedMealType === meal.value ? Colors.white : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.mealTypeText,
                        selectedMealType === meal.value && styles.mealTypeTextActive,
                      ]}
                    >
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsSection}>
              <Text style={styles.presetsLabel}>Quick Presets:</Text>
              <View style={styles.presetsGrid}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setMaxCalories(300);
                    setMinProtein(25);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetText}>Snack</Text>
                  <Text style={styles.presetSubtext}>300 cal / 25g</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setMaxCalories(500);
                    setMinProtein(35);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetText}>Light Meal</Text>
                  <Text style={styles.presetSubtext}>500 cal / 35g</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setMaxCalories(700);
                    setMinProtein(45);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetText}>Main Meal</Text>
                  <Text style={styles.presetSubtext}>700 cal / 45g</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchGradient}
            >
              <Ionicons name="search" size={20} color={Colors.white} />
              <Text style={styles.searchButtonText}>Search Database</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.xl,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  valueDisplay: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sliderLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  mealTypeTextActive: {
    color: Colors.white,
  },
  presetsSection: {
    marginTop: Spacing.md,
  },
  presetsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  presetText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  presetSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  searchButton: {
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    gap: Spacing.sm,
  },
  searchButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});
