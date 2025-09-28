import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function FoodDetailsView({
  food,
  onAction,
  actionButtonText = 'Add to Food Log',
  actionButtonStyle = {},
  showBackButton = false,
  onBack = () => {}
}) {
  // Determine if this food should be measured in units rather than grams
  const getServingInfo = () => {
    const name = food.name.toLowerCase();

    // Foods that are better measured by units
    const unitBasedFoods = {
      'egg': { weight: 50, unit: 'egg', unitPlural: 'eggs', default: 2, isUnit: true },
      'banana': { weight: 120, unit: 'banana', unitPlural: 'bananas', default: 1, isUnit: true },
      'apple': { weight: 180, unit: 'apple', unitPlural: 'apples', default: 1, isUnit: true },
      'orange': { weight: 150, unit: 'orange', unitPlural: 'oranges', default: 1, isUnit: true },
      'slice': { weight: 30, unit: 'slice', unitPlural: 'slices', default: 2, isUnit: true },
      'cookie': { weight: 20, unit: 'cookie', unitPlural: 'cookies', default: 2, isUnit: true },
      'bagel': { weight: 100, unit: 'bagel', unitPlural: 'bagels', default: 1, isUnit: true },
      'muffin': { weight: 60, unit: 'muffin', unitPlural: 'muffins', default: 1, isUnit: true },
      'tortilla': { weight: 45, unit: 'tortilla', unitPlural: 'tortillas', default: 2, isUnit: true },
      'waffle': { weight: 35, unit: 'waffle', unitPlural: 'waffles', default: 2, isUnit: true },
      'pancake': { weight: 40, unit: 'pancake', unitPlural: 'pancakes', default: 3, isUnit: true },
    };

    // Check for unit-based foods
    for (const [keyword, info] of Object.entries(unitBasedFoods)) {
      if (name.includes(keyword)) {
        return info;
      }
    }

    // Weight-based foods
    if (food.servingQuantity && food.servingQuantity > 0) {
      const qty = Math.round(food.servingQuantity);
      return { weight: qty, unit: 'g', default: qty, isUnit: false, apiServing: true };
    }

    // Common serving sizes
    if (name.includes('rice') && name.includes('cooked')) return { weight: 150, unit: 'g', default: 150, isUnit: false };
    if (name.includes('chicken')) return { weight: 100, unit: 'g', default: 100, isUnit: false };
    if (name.includes('milk')) return { weight: 240, unit: 'ml', default: 240, isUnit: false };
    if (name.includes('yogurt')) return { weight: 150, unit: 'g', default: 150, isUnit: false };
    if (name.includes('cheese')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('nuts') || name.includes('almonds') || name.includes('cashew') ||
        name.includes('peanut') || name.includes('walnut')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('oil') || name.includes('butter')) return { weight: 15, unit: 'g', default: 15, isUnit: false };
    if (name.includes('pasta') && name.includes('cooked')) return { weight: 140, unit: 'g', default: 140, isUnit: false };
    if (name.includes('cereal')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('protein powder') || name.includes('whey')) return { weight: 30, unit: 'g', default: 30, isUnit: false };

    // Default to weight-based
    return { weight: 100, unit: 'g', default: 100, isUnit: false };
  };

  const servingInfo = getServingInfo();
  const [servingAmount, setServingAmount] = useState(servingInfo.default);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  // Calculate actual weight based on serving amount
  const calculateActualWeight = () => {
    if (servingInfo.isUnit) {
      return servingAmount * servingInfo.weight;
    }
    return servingAmount;
  };

  // Calculate nutrition for current serving
  const calculateNutrition = (value) => {
    const actualWeight = calculateActualWeight();
    return ((value * actualWeight) / 100).toFixed(1);
  };

  // Calculate health rating
  const calculateHealthRating = () => {
    // If we have Nutri-Score from API, use it
    if (food.nutriScore) {
      const nutriScoreMap = {
        'a': 5,
        'b': 4,
        'c': 3,
        'd': 2,
        'e': 1
      };
      return nutriScoreMap[food.nutriScore.toLowerCase()] || 3;
    }

    // Fallback calculation
    let score = 3;

    if (food.calories > 500) score -= 2;
    else if (food.calories > 300) score -= 1;
    else if (food.calories < 150) score += 0.5;

    if (food.protein > 20) score += 1;
    else if (food.protein > 10) score += 0.5;

    if (food.fat > 30) score -= 1.5;
    else if (food.fat > 20) score -= 0.5;
    else if (food.fat < 5) score += 0.5;

    if (food.sugar && food.sugar > 15) score -= 1.5;
    else if (food.sugar && food.sugar < 5) score += 0.5;

    if (food.fiber && food.fiber > 5) score += 1;
    if (food.sodium && food.sodium > 600) score -= 1;

    return Math.max(1, Math.min(5, Math.round(score)));
  };

  const healthScore = calculateHealthRating();

  const adjustServing = (adjustment) => {
    if (servingInfo.isUnit) {
      const newAmount = Math.max(0.5, servingAmount + (adjustment > 0 ? 1 : -1));
      setServingAmount(newAmount);
    } else {
      const newAmount = Math.max(10, servingAmount + adjustment);
      setServingAmount(newAmount);
    }
  };

  const handleAction = () => {
    const actualWeight = calculateActualWeight();
    const servingText = servingInfo.isUnit
      ? `${servingAmount} ${servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural}`
      : `${servingAmount}${servingInfo.unit}`;

    onAction({
      food,
      servingAmount,
      actualWeight,
      servingText,
      nutrition: {
        calories: Math.round((food.calories * actualWeight) / 100),
        protein: parseFloat(((food.protein * actualWeight) / 100).toFixed(1)),
        carbs: parseFloat(((food.carbs * actualWeight) / 100).toFixed(1)),
        fat: parseFloat(((food.fat * actualWeight) / 100).toFixed(1)),
      }
    });
  };

  return (
    <>
      {showBackButton && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Details</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Food Header */}
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.category && (
            <Text style={styles.category}>{food.category}</Text>
          )}
        </View>

        {/* Health Rating */}
        <TouchableOpacity
          style={styles.ratingCard}
          onPress={() => setShowHealthDetails(!showHealthDetails)}
          activeOpacity={0.8}
        >
          <View style={styles.ratingHeader}>
            <Text style={styles.sectionTitle}>Health Rating</Text>
            {food.nutriScore && (
              <View style={styles.nutriScoreBadge}>
                <Text style={styles.nutriScoreText}>
                  Nutri-Score {food.nutriScore.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text key={star} style={styles.starIcon}>
                {star <= healthScore ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
          {showHealthDetails && (
            <View style={styles.healthDetails}>
              <Text style={styles.healthDetailText}>
                Based on nutritional content and balanced macro distribution
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Serving Size Selector */}
        <View style={styles.servingSection}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingSelector}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => adjustServing(-10)}
            >
              <Text style={styles.servingButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.servingAmount}>
              <Text style={styles.servingValue}>{servingAmount}</Text>
              <Text style={styles.servingUnit}>
                {servingInfo.isUnit
                  ? (servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural)
                  : servingInfo.unit}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => adjustServing(10)}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Facts */}
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          <Text style={styles.nutritionServing}>
            Per {servingAmount} {servingInfo.isUnit
              ? (servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural)
              : servingInfo.unit}
          </Text>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Calories</Text>
            <Text style={styles.nutritionValueLarge}>
              {Math.round((food.calories * calculateActualWeight()) / 100)}
            </Text>
          </View>

          <View style={styles.nutritionDivider} />

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <Text style={styles.nutritionValue}>{calculateNutrition(food.protein)}g</Text>
          </View>

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Carbohydrates</Text>
            <Text style={styles.nutritionValue}>{calculateNutrition(food.carbs)}g</Text>
          </View>

          {food.sugar !== undefined && (
            <View style={[styles.nutritionRow, styles.nutritionSubRow]}>
              <Text style={styles.nutritionSubLabel}>Sugars</Text>
              <Text style={styles.nutritionValue}>{calculateNutrition(food.sugar)}g</Text>
            </View>
          )}

          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <Text style={styles.nutritionValue}>{calculateNutrition(food.fat)}g</Text>
          </View>

          {food.fiber !== undefined && (
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fiber</Text>
              <Text style={styles.nutritionValue}>{calculateNutrition(food.fiber)}g</Text>
            </View>
          )}

          {food.sodium !== undefined && (
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Sodium</Text>
              <Text style={styles.nutritionValue}>
                {Math.round((food.sodium * calculateActualWeight()) / 100)}mg
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, actionButtonStyle]}
          onPress={handleAction}
        >
          <Text style={styles.actionButtonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  foodHeader: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  foodName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  nutriScoreBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  nutriScoreText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  starIcon: {
    fontSize: 20,
  },
  healthDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  healthDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  servingSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  servingButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  servingAmount: {
    alignItems: 'center',
    flex: 1,
  },
  servingValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  servingUnit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nutritionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  nutritionServing: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  nutritionSubRow: {
    paddingLeft: Spacing.lg,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  nutritionSubLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  nutritionValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  nutritionValueLarge: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionDivider: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});