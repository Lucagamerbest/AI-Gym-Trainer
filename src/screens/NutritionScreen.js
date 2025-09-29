import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import MacroGoalsModal from '../components/MacroGoalsModal';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MACROS_KEY = '@macro_goals';
const DAILY_NUTRITION_KEY = '@daily_nutrition';
const LAST_RESET_DATE_KEY = '@last_reset_date';

export default function NutritionScreen({ navigation, route }) {
  const [consumed, setConsumed] = useState(0);
  const [burned] = useState(0); // Will be updated when exercise tracking is implemented
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [disableBack, setDisableBack] = useState(false); // Track if back should be disabled
  const [macroGoals, setMacroGoals] = useState({
    calories: 2000,
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 65,
  });
  const [consumedMacros, setConsumedMacros] = useState({
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
  });
  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  useEffect(() => {
    loadMacroGoals();
    loadDailyNutrition();
    checkAndResetDaily();
  }, []);

  // Use focus effect to ensure swipe is disabled when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (disableBack) {
        // Ensure swipe is disabled when screen is focused
        navigation.setOptions({
          gestureEnabled: false
        });
      }
      return () => {
        // Cleanup if needed
      };
    }, [disableBack, navigation])
  );

  // Handle incoming food/recipe data from navigation
  useEffect(() => {
    // Check if we came from adding a recipe
    if (route.params?.fromRecipeAdd) {
      setDisableBack(true); // Disable back navigation

      // Disable swipe gesture immediately
      navigation.setOptions({
        gestureEnabled: false
      });

      // Clear the flag after processing but keep swipe disabled
      navigation.setParams({ fromRecipeAdd: undefined });
    }

    if (route.params?.addedFood) {
      const { addedFood } = route.params;
      const mealType = addedFood.mealType || 'breakfast';

      // Clear the params immediately to prevent re-adding
      navigation.setParams({ addedFood: undefined });

      // Update selected meal to match the added food's meal type
      setSelectedMeal(mealType);

      // Update all state using functional updates to get latest values
      setMeals(prevMeals => {
        const updatedMeals = {
          ...prevMeals,
          [mealType]: [...prevMeals[mealType], addedFood]
        };

        // Update consumed and macros with functional updates
        setConsumed(prevConsumed => {
          const newConsumed = prevConsumed + (addedFood.calories || 0);

          setConsumedMacros(prevMacros => {
            const newMacros = {
              proteinGrams: prevMacros.proteinGrams + (addedFood.protein || 0),
              carbsGrams: prevMacros.carbsGrams + (addedFood.carbs || 0),
              fatGrams: prevMacros.fatGrams + (addedFood.fat || 0),
            };

            // Save to AsyncStorage with the updated values
            saveDailyNutrition(newConsumed, newMacros, updatedMeals, mealType);

            return newMacros;
          });

          return newConsumed;
        });

        return updatedMeals;
      });
    }
  }, [route.params?.addedFood, route.params?.fromRecipeAdd]);

  const loadMacroGoals = async () => {
    try {
      const saved = await AsyncStorage.getItem(MACROS_KEY);
      if (saved) {
        setMacroGoals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading macro goals:', error);
    }
  };

  const checkAndResetDaily = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
      const today = new Date().toDateString();

      if (lastResetDate !== today) {
        // It's a new day, reset the data
        await AsyncStorage.setItem(LAST_RESET_DATE_KEY, today);
        await AsyncStorage.removeItem(DAILY_NUTRITION_KEY);

        // Reset state
        setConsumed(0);
        setConsumedMacros({ proteinGrams: 0, carbsGrams: 0, fatGrams: 0 });
        setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
        setSelectedMeal('breakfast');
      }
    } catch (error) {
      console.error('Error checking daily reset:', error);
    }
  };

  // Helper function to calculate totals from all meals
  const calculateTotalsFromMeals = (mealsData) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Sum up all meals
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
      if (mealsData[mealType] && Array.isArray(mealsData[mealType])) {
        mealsData[mealType].forEach(food => {
          totalCalories += food.calories || 0;
          totalProtein += food.protein || 0;
          totalCarbs += food.carbs || 0;
          totalFat += food.fat || 0;
        });
      }
    });

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };
  };

  const loadDailyNutrition = async () => {
    try {
      const saved = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const loadedMeals = data.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] };

        // Recalculate totals from all meals to ensure accuracy
        const totals = calculateTotalsFromMeals(loadedMeals);

        setConsumed(totals.calories);
        setConsumedMacros({
          proteinGrams: totals.protein,
          carbsGrams: totals.carbs,
          fatGrams: totals.fat
        });
        setMeals(loadedMeals);
        setSelectedMeal(data.selectedMeal || 'breakfast');
      }
    } catch (error) {
      console.error('Error loading daily nutrition:', error);
    }
  };

  const saveDailyNutrition = async (newConsumed, newMacros, newMeals, newSelectedMeal) => {
    try {
      const data = {
        consumed: newConsumed,
        consumedMacros: newMacros,
        meals: newMeals,
        selectedMeal: newSelectedMeal,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem(DAILY_NUTRITION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving daily nutrition:', error);
    }
  };

  const handleSaveMacros = (newGoals) => {
    setMacroGoals(newGoals);
  };

  const calculateProgress = (consumed, goal) => {
    if (goal === 0) return 0;
    return Math.min(100, Math.round((consumed / goal) * 100));
  };

  const proteinProgress = calculateProgress(consumedMacros.proteinGrams, macroGoals.proteinGrams);
  const carbsProgress = calculateProgress(consumedMacros.carbsGrams, macroGoals.carbsGrams);
  const fatProgress = calculateProgress(consumedMacros.fatGrams, macroGoals.fatGrams);
  const calorieDeficit = macroGoals.calories - consumed - burned;

  return (
    <ScreenLayout
      title="Nutrition Tracker"
      subtitle="Track your daily intake"
      navigation={navigation}
      showBack={!disableBack}  // Disable back when coming from recipe add
      showHome={true}
    >
      <StyledCard style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Daily Calories</Text>
          <TouchableOpacity
            style={styles.editIndicator}
            onPress={() => setShowMacroModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.editIcon}>✏️</Text>
            <Text style={styles.editHint}>Edit</Text>
          </TouchableOpacity>
        </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{macroGoals.calories}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statValue}>{consumed}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Burned</Text>
              <Text style={styles.statValue}>{burned}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
          </View>
        <Text style={[styles.deficitText, calorieDeficit > 0 ? styles.deficitPositive : styles.deficitNegative]}>
          {calorieDeficit > 0 ? '🎯 Deficit' : '⚠️ Surplus'}: {Math.abs(calorieDeficit)} cal
        </Text>
      </StyledCard>

      {/* Compact Meal Selector and Actions */}
      <View style={styles.foodActionsSection}>
        <View style={styles.mealSelectorRow}>
          <Text style={styles.addingToText}>Adding to:</Text>
          <TouchableOpacity
            style={styles.mealDropdown}
            onPress={() => setExpandedMeal(expandedMeal === 'selector' ? null : 'selector')}
          >
            <Text style={styles.selectedMealText}>
              {selectedMeal === 'breakfast' && '🌅 Breakfast'}
              {selectedMeal === 'lunch' && '☀️ Lunch'}
              {selectedMeal === 'dinner' && '🌙 Dinner'}
              {selectedMeal === 'snacks' && '🍿 Snacks'}
            </Text>
            <Text style={styles.dropdownArrow}>
              {expandedMeal === 'selector' ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('MealsHistory')}
          >
            <Text style={styles.historyIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Meal Options */}
        {expandedMeal === 'selector' && (
          <View style={styles.mealOptions}>
            {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => (
              <TouchableOpacity
                key={mealType}
                style={styles.mealOption}
                onPress={() => {
                  setSelectedMeal(mealType);
                  setExpandedMeal(null);
                }}
              >
                <Text style={styles.mealOptionText}>
                  {mealType === 'breakfast' && '🌅 Breakfast'}
                  {mealType === 'lunch' && '☀️ Lunch'}
                  {mealType === 'dinner' && '🌙 Dinner'}
                  {mealType === 'snacks' && '🍿 Snacks'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={() => navigation.navigate('FoodScanning', { mealType: selectedMeal })}
        >
          <Text style={[styles.actionButtonIcon, styles.greenText]}>📷</Text>
          <Text style={[styles.actionButtonText, styles.greenText]}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.searchButton]}
          onPress={() => navigation.navigate('FoodSearch', { mealType: selectedMeal })}
        >
          <Text style={[styles.actionButtonIcon, styles.blackText]}>🔍</Text>
          <Text style={[styles.actionButtonText, styles.blackText]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.recipesButton]}
          onPress={() => navigation.navigate('Recipes', { mealType: selectedMeal })}
        >
          <Text style={[styles.actionButtonIcon, styles.greenText]}>📖</Text>
          <Text style={[styles.actionButtonText, styles.greenText]}>Recipes</Text>
        </TouchableOpacity>
      </View>

      <StyledCard title="Macros" style={styles.macroCard}>
          {/* Compact Macro Goals Display */}
          <View style={styles.macroGoalsRow}>
            <View style={styles.macroGoalCompact}>
              <Text style={[styles.macroGoalLabel, styles.proteinColor]}>Protein</Text>
              <Text style={[styles.macroGoalValue, styles.proteinColor]}>{macroGoals.proteinGrams}g</Text>
            </View>
            <View style={styles.macroGoalDivider} />
            <View style={styles.macroGoalCompact}>
              <Text style={[styles.macroGoalLabel, styles.carbsColor]}>Carbs</Text>
              <Text style={[styles.macroGoalValue, styles.carbsColor]}>{macroGoals.carbsGrams}g</Text>
            </View>
            <View style={styles.macroGoalDivider} />
            <View style={styles.macroGoalCompact}>
              <Text style={[styles.macroGoalLabel, styles.fatColor]}>Fat</Text>
              <Text style={[styles.macroGoalValue, styles.fatColor]}>{macroGoals.fatGrams}g</Text>
            </View>
          </View>

          {/* Compact Progress Bars */}
          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.proteinColor]}>P</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.progressBarProtein, { width: `${proteinProgress}%` }]} />
            </View>
            <Text style={[styles.macroValue, styles.proteinColor]}>
              {consumedMacros.proteinGrams}/{macroGoals.proteinGrams}
            </Text>
          </View>

          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.carbsColor]}>C</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.progressBarCarbs, { width: `${carbsProgress}%` }]} />
            </View>
            <Text style={[styles.macroValue, styles.carbsColor]}>
              {consumedMacros.carbsGrams}/{macroGoals.carbsGrams}
            </Text>
          </View>

          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.fatColor]}>F</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.progressBarFat, { width: `${fatProgress}%` }]} />
            </View>
            <Text style={[styles.macroValue, styles.fatColor]}>
              {consumedMacros.fatGrams}/{macroGoals.fatGrams}
            </Text>
          </View>
        </StyledCard>

      <MacroGoalsModal
        visible={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        onSave={handleSaveMacros}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    alignItems: 'center',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  statsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  editIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  editHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  statUnit: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  deficitText: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  deficitPositive: {
    color: Colors.success,
  },
  deficitNegative: {
    color: Colors.warning,
  },
  macroCard: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  macroGoalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  macroGoalCompact: {
    flex: 1,
    alignItems: 'center',
  },
  macroGoalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  macroGoalLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  macroGoalDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  macroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    width: 20,
    fontWeight: '600',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  progressBarProtein: {
    backgroundColor: '#4CAF50', // Green
  },
  progressBarCarbs: {
    backgroundColor: '#FF9800', // Orange
  },
  progressBarFat: {
    backgroundColor: '#F44336', // Red
  },
  proteinColor: {
    color: '#4CAF50', // Green
  },
  carbsColor: {
    color: '#FF9800', // Orange
  },
  fatColor: {
    color: '#F44336', // Red
  },
  macroValue: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    minWidth: 45,
    textAlign: 'right',
  },
  mealsHistoryButton: {
    marginTop: Spacing.md,
  },
  testButton: {
    marginTop: Spacing.sm,
  },
  mealSelectorCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealSelectorTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  mealTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  mealTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  mealTabActive: {
    backgroundColor: Colors.primary,
  },
  mealTabText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  mealTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  mealsSection: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  mealsSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  mealStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealCalories: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  mealItems: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  foodItemName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  foodItemCalories: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyMealText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  scanButton: {
    backgroundColor: '#1a1a1a',
    borderColor: Colors.primary,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flex: 1.5,  // Make search button 50% wider
  },
  recipesButton: {
    backgroundColor: '#1a1a1a',
    borderColor: Colors.primary,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  greenText: {
    color: Colors.primary,
  },
  blackText: {
    color: '#1a1a1a',
  },
  // Compact meal selector styles
  foodActionsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addingToText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  mealDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  selectedMealText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  dropdownArrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  historyButton: {
    backgroundColor: Colors.primary + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIcon: {
    fontSize: 20,
  },
  mealOptions: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mealOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mealOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
});