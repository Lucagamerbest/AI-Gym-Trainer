import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function CalorieBreakdownScreen({ route, navigation }) {
  const { meals, totalCalories, onDeleteFood } = route.params;

  const handleDeleteFood = (mealType, foodIndex, foodName, foodCalories) => {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete "${foodName}" (${foodCalories} cal) from ${mealType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeleteFood(mealType, foodIndex);
            // Navigate back to refresh the nutrition screen
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleDeleteMeal = (mealType) => {
    const mealItems = meals[mealType] || [];
    if (mealItems.length === 0) return;

    const mealCalories = mealItems.reduce((sum, item) => sum + (item.calories || 0), 0);

    Alert.alert(
      'Delete Entire Meal',
      `Are you sure you want to delete all items from ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${mealCalories} cal)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            // Delete all foods in this meal
            const mealItemsCount = mealItems.length;
            for (let i = mealItemsCount - 1; i >= 0; i--) {
              onDeleteFood(mealType, i);
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderMealSection = (mealType, mealItems) => {
    if (!mealItems || mealItems.length === 0) return null;

    const mealTotal = mealItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);

    return (
      <StyledCard key={mealType} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{mealName}</Text>
            <Text style={styles.mealTotal}>{mealTotal} cal</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteMealButton}
            onPress={() => handleDeleteMeal(mealType)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.foodsList}>
          {mealItems.map((food, index) => (
            <View key={index} style={styles.foodRow}>
              <View style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodCalories}>{food.calories || 0} cal</Text>
                    {food.protein ? <Text style={styles.foodMacro}>P: {food.protein}g</Text> : null}
                    {food.carbs ? <Text style={styles.foodMacro}>C: {food.carbs}g</Text> : null}
                    {food.fat ? <Text style={styles.foodMacro}>F: {food.fat}g</Text> : null}
                  </View>
                </View>
              </View>
              <View style={styles.deleteZone}>
                <TouchableOpacity
                  style={styles.deleteFoodButton}
                  onPress={() => {
                    console.log('Deleting food:', food.name, 'from', mealType, 'at index', index);
                    handleDeleteFood(mealType, index, food.name, food.calories);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteFoodButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </StyledCard>
    );
  };

  return (
    <ScreenLayout
      title="Calorie Breakdown"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      {/* Total Summary */}
      <StyledCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Daily Total</Text>
          <Text style={styles.summaryCalories}>{totalCalories} calories</Text>
        </View>
      </StyledCard>

      {/* Meals Breakdown */}
      <View style={styles.mealsContainer}>
        {Object.entries(meals).map(([mealType, mealItems]) =>
          renderMealSection(mealType, mealItems)
        )}
      </View>

      {totalCalories === 0 && (
        <StyledCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No foods logged today</Text>
          <Text style={styles.emptySubtext}>Start adding foods to track your nutrition</Text>
        </StyledCard>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryCalories: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  mealsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  mealTotal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteMealButton: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  foodsList: {
    gap: Spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  foodItem: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background + '40',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  foodInfo: {
    flex: 1,
  },
  deleteZone: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
    flexShrink: 1,
    numberOfLines: 2,
  },
  foodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  foodCalories: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  foodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deleteFoodButton: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteFoodButtonText: {
    fontSize: 18,
  },
  emptyCard: {
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});