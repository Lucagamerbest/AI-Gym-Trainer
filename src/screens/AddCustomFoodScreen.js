import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import userContributedFoods, { FOOD_CATEGORIES } from '../services/userContributedFoods';

export default function AddCustomFoodScreen({ route, navigation }) {
  const { mealType, isPlannedMeal, plannedDateKey, reopenDate } = route.params || {};
  const { user } = useAuth();
  const Colors = useColors();
  const styles = createStyles(Colors);

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [category, setCategory] = useState('Protein');
  const [barcode, setBarcode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Calculate totals for preview
  const totalMacros = (parseFloat(protein) || 0) + (parseFloat(carbs) || 0) + (parseFloat(fat) || 0);

  // Validate form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a food name');
      return false;
    }
    if (!calories || isNaN(parseFloat(calories)) || parseFloat(calories) < 0) {
      Alert.alert('Missing Information', 'Please enter valid calories');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const servingQuantity = parseFloat(servingSize) || 100;

      const foodData = {
        name: name.trim(),
        brand: brand.trim(),
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        serving_size: `${servingQuantity}${servingUnit}`,
        serving_quantity: servingQuantity,
        category,
        barcode: barcode.trim() || null,
      };

      const newFood = await userContributedFoods.addFood(foodData, user?.uid);

      Alert.alert(
        'Food Added',
        `"${name}" has been saved to your foods!`,
        [
          {
            text: 'Add to Meal',
            onPress: () => {
              navigation.replace('FoodDetail', {
                food: newFood,
                mealType,
                isPlannedMeal,
                plannedDateKey,
                reopenDate,
              });
            },
          },
          {
            text: 'Done',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add food');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="Create Food"
      subtitle="Add your own custom food"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* Food Name - Prominent */}
        <View style={styles.nameSection}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Food Name *"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.brandInput}
            value={brand}
            onChangeText={setBrand}
            placeholder="Brand (optional)"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* Category Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
          >
            {FOOD_CATEGORIES.slice(0, 8).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryChipText,
                  category === cat && styles.categoryChipTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
          >
            {FOOD_CATEGORIES.slice(8).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryChipText,
                  category === cat && styles.categoryChipTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Serving Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Serving Size</Text>
          <View style={styles.servingRow}>
            <View style={styles.servingInputContainer}>
              <TextInput
                style={styles.servingInput}
                value={servingSize}
                onChangeText={setServingSize}
                placeholder="100"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.unitButtonsContainer}>
              {['g', 'ml', 'oz'].map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    servingUnit === unit && styles.unitButtonActive,
                  ]}
                  onPress={() => setServingUnit(unit)}
                >
                  <Text style={[
                    styles.unitButtonText,
                    servingUnit === unit && styles.unitButtonTextActive,
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Nutrition Card */}
        <View style={styles.nutritionCard}>
          <View style={styles.nutritionHeader}>
            <Text style={styles.nutritionTitle}>Nutrition Facts</Text>
            <Text style={styles.nutritionSubtitle}>per {servingSize || '100'}{servingUnit}</Text>
          </View>

          {/* Calories - Big and prominent */}
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesLabel}>Calories *</Text>
            <View style={styles.caloriesInputRow}>
              <TextInput
                style={styles.caloriesInput}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.caloriesUnit}>kcal</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Macros Grid */}
          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroInput}
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroInput}
                  value={carbs}
                  onChangeText={setCarbs}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroIndicator, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroInput}
                  value={fat}
                  onChangeText={setFat}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>

          {/* Optional fields */}
          <Text style={styles.optionalTitle}>Optional</Text>
          <View style={styles.optionalRow}>
            <View style={styles.optionalItem}>
              <Text style={styles.optionalLabel}>Fiber</Text>
              <View style={styles.optionalInputRow}>
                <TextInput
                  style={styles.optionalInput}
                  value={fiber}
                  onChangeText={setFiber}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.optionalUnit}>g</Text>
              </View>
            </View>

            <View style={styles.optionalItem}>
              <Text style={styles.optionalLabel}>Sugar</Text>
              <View style={styles.optionalInputRow}>
                <TextInput
                  style={styles.optionalInput}
                  value={sugar}
                  onChangeText={setSugar}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.optionalUnit}>g</Text>
              </View>
            </View>

            <View style={styles.optionalItem}>
              <Text style={styles.optionalLabel}>Barcode</Text>
              <TextInput
                style={[styles.optionalInput, styles.barcodeInput]}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Optional"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : 'Save Food'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Your custom foods are saved locally and will appear first in search results.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: 100,
  },

  // Name Section
  nameSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  nameInput: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandInput: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },

  // Section
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Category Chips
  categoryChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  categoryChipTextActive: {
    color: Colors.text,
    fontWeight: Typography.weights.semibold,
  },

  // Serving Row
  servingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  servingInputContainer: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servingInput: {
    fontSize: Typography.sizes.lg,
    color: Colors.text,
    padding: Spacing.md,
    textAlign: 'center',
    fontWeight: Typography.weights.semibold,
  },
  unitButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  unitButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  unitButtonTextActive: {
    color: Colors.text,
    fontWeight: Typography.weights.bold,
  },

  // Nutrition Card
  nutritionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  nutritionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  nutritionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },

  // Calories
  caloriesSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  caloriesLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  caloriesInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesInput: {
    fontSize: 48,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    minWidth: 120,
    textAlign: 'center',
  },
  caloriesUnit: {
    fontSize: Typography.sizes.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Macros Grid
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  macroLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  macroInput: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginLeft: 2,
  },

  // Optional
  optionalTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionalItem: {
    flex: 1,
  },
  optionalLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  optionalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  optionalInput: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 30,
  },
  optionalUnit: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  barcodeInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    textAlign: 'center',
  },

  // Submit Button
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },

  // Footer
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    lineHeight: Typography.sizes.sm * 1.5,
  },
});
