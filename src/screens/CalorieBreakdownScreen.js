import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import MealSyncService from '../services/backend/MealSyncService';

export default function CalorieBreakdownScreen({ route, navigation }) {
  const { meals: initialMeals, totalCalories: initialTotal, plannedMeals: initialPlannedMeals, userId } = route.params || {};

  const [meals, setMeals] = useState(initialMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [plannedMeals, setPlannedMeals] = useState(initialPlannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [totalCalories, setTotalCalories] = useState(initialTotal || 0);
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'logged', 'planned'

  // Recalculate total calories whenever meals change
  useEffect(() => {
    const newTotal = Object.values(meals).reduce((sum, mealItems) => {
      return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
    }, 0);
    setTotalCalories(newTotal);
  }, [meals]);

  // Handle edited food from EditFoodItemScreen
  useEffect(() => {
    if (route.params?.editFood) {
      const { mealType, foodIndex, updatedFood } = route.params.editFood;
      const updatedMeals = { ...meals };
      updatedMeals[mealType][foodIndex] = updatedFood;
      setMeals(updatedMeals);
      // Clear the param to prevent re-triggering
      navigation.setParams({ editFood: undefined });
    }
  }, [route.params?.editFood]);

  // NOTE: Removed AsyncStorage loading - we now use only Firebase data passed via route params
  // The data comes from NutritionScreen which loads from Firebase

  // Un-log handler - removes logged meal or moves back to planned if it was originally planned
  const handleUnlogFood = async (mealType, foodIndex, food) => {
    try {
      const updatedMeals = { ...meals };
      const updatedPlannedMeals = { ...plannedMeals };

      // Get the food item
      const foodItem = updatedMeals[mealType][foodIndex];

      // Delete from Firebase if it has a firebaseId
      if (userId && userId !== 'guest' && foodItem.firebaseId) {
        try {
          await MealSyncService.deleteMeal(userId, foodItem.firebaseId);
          console.log('✅ Meal deleted from Firebase (unlogged)');
        } catch (error) {
          console.log('⚠️ Failed to delete from Firebase:', error);
        }
      }

      // Remove from logged meals
      updatedMeals[mealType].splice(foodIndex, 1);

      // Only add back to planned meals if it was originally planned
      // Check if the food has a wasPlanned flag set to true
      if (foodItem.wasPlanned === true) {
        if (!updatedPlannedMeals[mealType]) {
          updatedPlannedMeals[mealType] = [];
        }
        // Remove the wasPlanned flag when moving back to planned
        const { wasPlanned, firebaseId, ...cleanedFoodItem } = foodItem;
        updatedPlannedMeals[mealType].push(cleanedFoodItem);
      }
      // Otherwise, just delete it completely (don't add to planned)

      // Update local state immediately
      setMeals(updatedMeals);
      setPlannedMeals(updatedPlannedMeals);

      // Recalculate calories
      const newTotal = Object.values(updatedMeals).reduce((sum, mealItems) => {
        return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
      }, 0);
      setTotalCalories(newTotal);

      // Note: NutritionScreen will reload from Firebase when we navigate back
    } catch (error) {
      console.error('Error unlogging food:', error);
    }
  };

  // Re-log handler - moves planned meal back to logged
  const handleRelogFood = async (mealType, foodIndex, food) => {
    try {
      const updatedMeals = { ...meals };
      const updatedPlannedMeals = { ...plannedMeals };

      // Get the food item from planned
      const foodItem = updatedPlannedMeals[mealType][foodIndex];

      // Remove from planned meals
      updatedPlannedMeals[mealType].splice(foodIndex, 1);

      // Add to Firebase (re-logging)
      if (userId && userId !== 'guest') {
        try {
          const today = new Date().toISOString().split('T')[0];
          const consumptionEntry = {
            date: today,
            meal_type: mealType,
            food_name: foodItem.name || 'Unknown food',
            food_brand: foodItem.brand || '',
            quantity_grams: foodItem.quantity || 100,
            calories_consumed: foodItem.calories || 0,
            protein_consumed: foodItem.protein || 0,
            carbs_consumed: foodItem.carbs || 0,
            fat_consumed: foodItem.fat || 0,
            created_at: new Date().toISOString(),
          };
          const firebaseId = await MealSyncService.uploadDailyConsumption(userId, consumptionEntry);
          foodItem.firebaseId = firebaseId;
          console.log('✅ Meal re-logged to Firebase with ID:', firebaseId);
        } catch (error) {
          console.log('⚠️ Failed to sync to Firebase:', error);
        }
      }

      // Add to logged meals with wasPlanned flag so it can be moved back if unlogged
      if (!updatedMeals[mealType]) {
        updatedMeals[mealType] = [];
      }
      foodItem.wasPlanned = true; // Mark that this was originally planned
      updatedMeals[mealType].push(foodItem);

      // Update local state immediately
      setMeals(updatedMeals);
      setPlannedMeals(updatedPlannedMeals);

      // Recalculate calories
      const newTotal = Object.values(updatedMeals).reduce((sum, mealItems) => {
        return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
      }, 0);
      setTotalCalories(newTotal);

      // Note: NutritionScreen will reload from Firebase when we navigate back
    } catch (error) {
      console.error('Error relogging food:', error);
    }
  };

  const renderMealSection = (mealType) => {
    const loggedItems = meals[mealType] || [];
    const plannedItems = plannedMeals[mealType] || [];

    // Apply filter
    const showLogged = filterMode === 'all' || filterMode === 'logged';
    const showPlanned = filterMode === 'all' || filterMode === 'planned';

    const filteredLoggedItems = showLogged ? loggedItems : [];
    const filteredPlannedItems = showPlanned ? plannedItems : [];

    if (filteredLoggedItems.length === 0 && filteredPlannedItems.length === 0) return null;

    const loggedTotal = filteredLoggedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const plannedTotal = filteredPlannedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const mealTotal = loggedTotal + plannedTotal;
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);

    return (
      <StyledCard key={mealType} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{mealName}</Text>
            <View style={styles.mealTotalContainer}>
              <Text style={styles.mealTotal}>{mealTotal} cal</Text>
              {showLogged && showPlanned && loggedItems.length > 0 && plannedItems.length > 0 && (
                <Text style={styles.mealBreakdown}>
                  ({loggedTotal} logged • {plannedTotal} planned)
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.foodsList}>
          {/* Logged meals - click checkmark to un-log, click edit button to modify */}
          {filteredLoggedItems.map((food, index) => (
            <View key={`logged-${index}`} style={styles.foodRow}>
              <TouchableOpacity
                style={[styles.statusBadge, styles.statusBadgeLogged]}
                onPress={() => handleUnlogFood(mealType, index, food)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.statusBadgeText}>✓</Text>
              </TouchableOpacity>
              <View style={[styles.foodItem, styles.foodItemLogged]}>
                <View style={styles.foodInfo}>
                  <View style={styles.foodNameRow}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.statusPill}>Logged</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodCalories}>{food.calories || 0} cal</Text>
                    {food.protein ? <Text style={styles.foodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                    {food.carbs ? <Text style={styles.foodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                    {food.fat ? <Text style={styles.foodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  navigation.navigate('EditFoodItem', {
                    foodItem: food,
                    mealType: mealType,
                    foodIndex: index,
                    isPlannedMeal: false,
                    returnScreen: 'CalorieBreakdown'
                  });
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Planned meals - click calendar to re-log */}
          {filteredPlannedItems.map((food, index) => (
            <View key={`planned-${index}`} style={styles.foodRow}>
              <TouchableOpacity
                style={[styles.statusBadge, styles.statusBadgePlanned]}
                onPress={() => handleRelogFood(mealType, index, food)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.statusBadgeText}>📅</Text>
              </TouchableOpacity>
              <View style={[styles.foodItem, styles.foodItemPlanned]}>
                <View style={styles.foodInfo}>
                  <View style={styles.foodNameRow}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={[styles.statusPill, styles.statusPillPlanned]}>Planned</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={[styles.foodCalories, styles.foodCaloriesPlanned]}>{food.calories || 0} cal</Text>
                    {food.protein ? <Text style={styles.foodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                    {food.carbs ? <Text style={styles.foodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                    {food.fat ? <Text style={styles.foodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                  </View>
                </View>
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
      screenName="CalorieBreakdownScreen"
    >
      {/* Total Summary */}
      <StyledCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Daily Total</Text>
          <Text style={styles.summaryCalories}>{totalCalories} calories</Text>
        </View>
      </StyledCard>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'logged' && styles.filterButtonActive]}
          onPress={() => setFilterMode('logged')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'logged' && styles.filterButtonTextActive]}>
            ✓ Logged
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'planned' && styles.filterButtonActive]}
          onPress={() => setFilterMode('planned')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'planned' && styles.filterButtonTextActive]}>
            📅 Planned
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meals Breakdown */}
      <View style={styles.mealsContainer}>
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) =>
          renderMealSection(mealType)
        )}
      </View>

      {/* Empty state for no logged foods */}
      {totalCalories === 0 && filterMode !== 'planned' && (
        <StyledCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No foods logged today</Text>
          <Text style={styles.emptySubtext}>Start adding foods to track your nutrition</Text>
        </StyledCard>
      )}

      {/* Empty state for Planned tab when no planned meals */}
      {filterMode === 'planned' && Object.values(plannedMeals).every(meals => meals.length === 0) && (
        <StyledCard style={styles.emptyCard}>
          <Text style={styles.emptyPlannedIcon}>📅</Text>
          <Text style={styles.emptyText}>No meals planned</Text>
          <Text style={styles.emptySubtext}>All planned meals have been logged</Text>
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
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.background,
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
  mealTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  mealTotal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  mealBreakdown: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  foodsList: {
    gap: Spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusBadgeLogged: {
    backgroundColor: '#4CAF50',
  },
  statusBadgePlanned: {
    backgroundColor: '#FF9800',
  },
  statusBadgeText: {
    fontSize: 14,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editButtonText: {
    fontSize: 16,
  },
  foodItem: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  foodItemLogged: {
    backgroundColor: '#4CAF50' + '15',
    borderColor: '#4CAF50' + '40',
    borderWidth: 2,
  },
  foodItemPlanned: {
    backgroundColor: '#FF9800' + '10',
    borderColor: '#FF9800',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  statusPill: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: '600',
    color: Colors.background,
    overflow: 'hidden',
  },
  statusPillPlanned: {
    backgroundColor: '#FF9800',
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
  foodCaloriesPlanned: {
    color: '#FF9800',
  },
  foodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
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
  emptyPlannedIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
});