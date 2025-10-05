import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import {
  getDailySummary,
  removeFromDaily,
  getWeeklySummary,
  initDatabase,
} from '../services/foodDatabaseService';

export default function NutritionDashboard({ navigation }) {
  const [dailySummary, setDailySummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calorieGoal, setCalorieGoal] = useState(2000); // TODO: Make this configurable
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Initialize database and load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      initDatabase().then(() => {
        loadDailySummary();
        loadWeeklySummary();
      });
    }, [selectedDate])
  );

  const loadDailySummary = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const summary = await getDailySummary(dateStr);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error loading daily summary:', error);
    }
  };

  const loadWeeklySummary = async () => {
    try {
      const weekly = await getWeeklySummary();
      setWeeklySummary(weekly);
    } catch (error) {
      console.error('Error loading weekly summary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailySummary();
    await loadWeeklySummary();
    setRefreshing(false);
  };

  const handleDeleteItem = (itemId, itemName) => {
    Alert.alert(
      'Remove Food',
      `Remove ${itemName} from your diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromDaily(itemId);
              loadDailySummary();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove food');
            }
          },
        },
      ]
    );
  };

  const navigateToAddFood = () => {
    navigation.navigate('FoodSearch');
  };

  const navigateToScanFood = () => {
    navigation.navigate('Camera');
  };

  const getMealItems = (mealType) => {
    if (!dailySummary?.items) return [];
    return dailySummary.items.filter(item => item.meal_type === mealType);
  };

  const getMealCalories = (mealType) => {
    const items = getMealItems(mealType);
    return Math.round(items.reduce((sum, item) => sum + item.calories_consumed, 0));
  };

  const getProgressColor = (consumed, goal) => {
    const percentage = (consumed / goal) * 100;
    if (percentage < 80) return Colors.warning;
    if (percentage <= 110) return Colors.success;
    return Colors.error;
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const renderMealSection = (mealType, mealName, mealIcon) => {
    const items = getMealItems(mealType);
    const calories = getMealCalories(mealType);
    const isExpanded = expandedMeal === mealType;

    return (
      <StyledCard style={styles.mealCard} key={mealType}>
        <TouchableOpacity
          onPress={() => setExpandedMeal(isExpanded ? null : mealType)}
          style={styles.mealHeader}
        >
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealIcon}>{mealIcon}</Text>
            <Text style={styles.mealName}>{mealName}</Text>
            <Text style={styles.mealCalories}>{calories} cal</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.mealItems}>
            {items.length === 0 ? (
              <Text style={styles.noItemsText}>No items logged</Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.foodItem}>
                  <View style={styles.foodItemInfo}>
                    <Text style={styles.foodItemName} numberOfLines={1}>
                      {item.food_name}
                    </Text>
                    <Text style={styles.foodItemDetails}>
                      {item.quantity_grams}g • {Math.round(item.calories_consumed)} cal
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id, item.food_name)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity onPress={navigateToAddFood} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Food</Text>
            </TouchableOpacity>
          </View>
        )}
      </StyledCard>
    );
  };

  const totalCalories = dailySummary?.totals?.calories || 0;
  const remainingCalories = calorieGoal - totalCalories;
  const progressPercentage = Math.min((totalCalories / calorieGoal) * 100, 100);

  return (
    <ScreenLayout
      title="Nutrition"
      subtitle="Track your daily calorie intake"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dateDisplay}>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            {isToday() && <Text style={styles.todayBadge}>Today</Text>}
          </View>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie Summary Card */}
        <StyledCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Daily Summary</Text>

          <View style={styles.calorieRing}>
            <Text style={styles.calorieNumber}>{totalCalories}</Text>
            <Text style={styles.calorieLabel}>calories</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressColor(totalCalories, calorieGoal),
                },
              ]}
            />
          </View>

          <View style={styles.calorieDetails}>
            <View style={styles.calorieDetailItem}>
              <Text style={styles.detailLabel}>Goal</Text>
              <Text
                style={[
                  styles.detailValue,
                  { fontSize: calorieGoal >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg },
                ]}
              >
                {calorieGoal}
              </Text>
            </View>
            <View style={styles.calorieDetailItem}>
              <Text style={styles.detailLabel}>Consumed</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: Colors.primary,
                    fontSize: totalCalories >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg,
                  },
                ]}
              >
                {totalCalories}
              </Text>
            </View>
            <View style={styles.calorieDetailItem}>
              <Text style={styles.detailLabel}>Remaining</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color: remainingCalories < 0 ? Colors.error : Colors.success,
                    fontSize: Math.abs(remainingCalories) >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg,
                  },
                ]}
              >
                {Math.abs(remainingCalories)}
              </Text>
            </View>
          </View>
        </StyledCard>

        {/* Macros Card */}
        <StyledCard style={styles.macrosCard}>
          <Text style={styles.macrosTitle}>Macronutrients</Text>
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: Colors.success }]}>
                <Text style={styles.macroCircleText}>P</Text>
              </View>
              <Text style={styles.macroValue}>
                {dailySummary?.totals?.protein || 0}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: Colors.warning }]}>
                <Text style={styles.macroCircleText}>C</Text>
              </View>
              <Text style={styles.macroValue}>
                {dailySummary?.totals?.carbs || 0}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroCircle, { backgroundColor: Colors.error }]}>
                <Text style={styles.macroCircleText}>F</Text>
              </View>
              <Text style={styles.macroValue}>
                {dailySummary?.totals?.fat || 0}g
              </Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </StyledCard>

        {/* Meals */}
        <Text style={styles.mealsTitle}>Meals</Text>
        {renderMealSection('breakfast', 'Breakfast', '🌅')}
        {renderMealSection('lunch', 'Lunch', '☀️')}
        {renderMealSection('dinner', 'Dinner', '🌙')}
        {renderMealSection('snack', 'Snacks', '🍿')}

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          <StyledButton
            title="Search & Add Food"
            icon="🔍"
            onPress={() => navigation.navigate('FoodSearch')}
            style={styles.quickAddButton}
          />
          <StyledButton
            title="Scan Barcode"
            icon="📷"
            onPress={navigateToScanFood}
            variant="secondary"
            style={styles.quickAddButton}
          />
        </View>

        {/* Weekly Trend (if data exists) */}
        {weeklySummary.length > 0 && (
          <StyledCard style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>Weekly Trend</Text>
            <View style={styles.weeklyChart}>
              {weeklySummary.map((day) => {
                const height = (day.total_calories / calorieGoal) * 100;
                return (
                  <View key={day.date} style={styles.weeklyBarContainer}>
                    <View
                      style={[
                        styles.weeklyBar,
                        {
                          height: `${Math.min(height, 100)}%`,
                          backgroundColor: getProgressColor(day.total_calories, calorieGoal),
                        },
                      ]}
                    />
                    <Text style={styles.weeklyDayLabel}>
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </StyledCard>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  todayBadge: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  summaryCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  calorieRing: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  calorieNumber: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  calorieDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  calorieDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  macrosCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  macrosTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  macroCircleText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  macroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  mealsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.sm,
  },
  mealName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  mealCalories: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  mealItems: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  noItemsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
    padding: Spacing.md,
    textAlign: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  foodItemDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  quickAddButton: {
    flex: 1,
  },
  weeklyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  weeklyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weeklyBar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  weeklyDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});