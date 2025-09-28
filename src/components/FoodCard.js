import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function FoodCard({ food, onPress }) {
  return (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => onPress(food)}
      activeOpacity={0.7}
    >
      <View style={styles.foodHeader}>
        <View style={styles.foodTitleRow}>
          <Text style={styles.foodName} numberOfLines={1}>
            {food.name}
          </Text>
          {food.source === 'openfoodfacts' && (
            <View style={styles.apiIndicator}>
              <Text style={styles.apiIndicatorText}>API</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodCalories}>
          {food.calories} cal/100g
        </Text>
      </View>
      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{food.protein || 0}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{food.carbs || 0}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{food.fat || 0}g</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  foodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  foodHeader: {
    marginBottom: Spacing.md,
  },
  foodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  foodName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  apiIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  apiIndicatorText: {
    fontSize: Typography.fontSize.xs,
    color: 'white',
    fontWeight: '600',
  },
  foodCalories: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
});