import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const DAILY_NUTRITION_KEY = '@daily_nutrition';

export default function CalorieBreakdownScreen({ route, navigation }) {
  const { meals: initialMeals, totalCalories: initialTotal, plannedMeals: initialPlannedMeals } = route.params || {};

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

  // Auto-reload data when coming back from unlog
  useFocusEffect(
    React.useCallback(() => {
      const loadLatestData = async () => {
        try {
          const saved = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
          if (saved) {
            const data = JSON.parse(saved);
            if (data.meals) {
              setMeals(data.meals);
            }
            if (data.plannedMeals) {
              setPlannedMeals(data.plannedMeals);
            }
            if (data.consumed !== undefined) {
              setTotalCalories(data.consumed);
            }
          }
        } catch (error) {
          console.error('Error loading latest data:', error);
        }
      };

      loadLatestData();
    }, [])
  );

  // Un-log handler - moves logged meal to planned instantly (no confirmation)
  const handleUnlogFood = async (mealType, foodIndex, food) => {
    try {
      const updatedMeals = { ...meals };
      const updatedPlannedMeals = { ...plannedMeals };

      // Get the food item
      const foodItem = updatedMeals[mealType][foodIndex];

      // Remove from logged meals
      updatedMeals[mealType].splice(foodIndex, 1);

      // Add to planned meals
      if (!updatedPlannedMeals[mealType]) {
        updatedPlannedMeals[mealType] = [];
      }
      updatedPlannedMeals[mealType].push(foodItem);

      // Update local state immediately
      setMeals(updatedMeals);
      setPlannedMeals(updatedPlannedMeals);

      // Recalculate calories
      const newTotal = Object.values(updatedMeals).reduce((sum, mealItems) => {
        return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
      }, 0);
      setTotalCalories(newTotal);

      // Update AsyncStorage
      const saved = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        data.meals = updatedMeals;
        data.plannedMeals = updatedPlannedMeals;
        data.consumed = newTotal;

        // Recalculate macros
        const totals = Object.values(updatedMeals).reduce((acc, mealItems) => {
          mealItems.forEach(item => {
            acc.protein += parseFloat(item.protein || 0);
            acc.carbs += parseFloat(item.carbs || 0);
            acc.fat += parseFloat(item.fat || 0);
          });
          return acc;
        }, { protein: 0, carbs: 0, fat: 0 });

        data.consumedMacros = {
          proteinGrams: totals.protein,
          carbsGrams: totals.carbs,
          fatGrams: totals.fat
        };

        await AsyncStorage.setItem(DAILY_NUTRITION_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error un-logging food:', error);
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

      // Add to logged meals
      if (!updatedMeals[mealType]) {
        updatedMeals[mealType] = [];
      }
      updatedMeals[mealType].push(foodItem);

      // Update local state immediately
      setMeals(updatedMeals);
      setPlannedMeals(updatedPlannedMeals);

      // Recalculate calories
      const newTotal = Object.values(updatedMeals).reduce((sum, mealItems) => {
        return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
      }, 0);
      setTotalCalories(newTotal);

      // Update AsyncStorage
      const saved = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        data.meals = updatedMeals;
        data.plannedMeals = updatedPlannedMeals;
        data.consumed = newTotal;

        // Recalculate macros
        const totals = Object.values(updatedMeals).reduce((acc, mealItems) => {
          mealItems.forEach(item => {
            acc.protein += parseFloat(item.protein || 0);
            acc.carbs += parseFloat(item.carbs || 0);
            acc.fat += parseFloat(item.fat || 0);
          });
          return acc;
        }, { protein: 0, carbs: 0, fat: 0 });

        data.consumedMacros = {
          proteinGrams: totals.protein,
          carbsGrams: totals.carbs,
          fatGrams: totals.fat
        };

        await AsyncStorage.setItem(DAILY_NUTRITION_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error re-logging food:', error);
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
          {/* Logged meals - click checkmark to un-log */}
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