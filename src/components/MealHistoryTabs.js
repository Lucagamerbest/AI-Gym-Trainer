import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { getCurrentMealType } from '../config/aiSectionConfig';

const MEAL_PLANS_KEY = '@meal_plans';
const DAILY_NUTRITION_KEY = '@daily_nutrition';
const FOOD_VIEW_MODE_KEY = '@food_view_mode';

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MealHistoryTabs({ navigation, route, activeHistoryTab }) {
  // activeHistoryTab prop from parent: 'all' = show ALL dates (past + future)
  // Unified calendar: green dots = past logged meals, orange dots = future planned meals
  const [activeTab, setActiveTab] = useState('calendar'); // Always show calendar (no Today tab)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealData, setMealData] = useState({});
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState(null);
  const [selectedFutureDates, setSelectedFutureDates] = useState([]);
  const [selectedMealTypeForAdd, setSelectedMealTypeForAdd] = useState(() => getCurrentMealType());
  const [todayMeals, setTodayMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [deleteModal, setDeleteModal] = useState({ visible: false, title: '', message: '', onConfirm: null });
  const [calendarViewMode, setCalendarViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [expandedDates, setExpandedDates] = useState([]); // Track which dates are expanded in list view
  // Show all dates by default (past + future + today)
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false); // Bulk delete selection mode
  const [selectedDatesForDelete, setSelectedDatesForDelete] = useState([]); // Selected dates for bulk delete
  
  // Load meal data on focus
  useFocusEffect(
    React.useCallback(() => {
      loadMealData();
    }, [])
  );

  // Handle updates from EditFoodItem for planned meals
  useEffect(() => {
    if (route.params?.updatedPlannedFood) {
      const { plannedDateKey, mealType, foodIndex, updatedFood, reopenDate } = route.params.updatedPlannedFood;
      editPlannedFoodItem(plannedDateKey, mealType, foodIndex, updatedFood);
      navigation.setParams({ updatedPlannedFood: undefined });

      // Switch to calendar tab and reopen the date modal after a short delay
      if (reopenDate) {
        setActiveTab('calendar');
        setTimeout(() => {
          setSelectedDate(new Date(reopenDate));
          setShowDayPlanner(true);
        }, 100);
      }
    }

    // Handle new food added to planned date
    if (route.params?.addedPlannedFood) {
      const { plannedDateKey, mealType, foodItem, reopenDate } = route.params.addedPlannedFood;
      addFoodToPlannedDate(plannedDateKey, mealType, foodItem);
      navigation.setParams({ addedPlannedFood: undefined });

      // Switch to calendar tab and reopen the date modal after a short delay
      if (reopenDate) {
        setActiveTab('calendar');
        setTimeout(() => {
          setSelectedDate(new Date(reopenDate));
          setShowDayPlanner(true);
        }, 100);
      }
    }
  }, [route.params]);

  // TEMPORARY TEST FUNCTION - Add fake historical data
  const addTestHistoricalData = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Add data for yesterday (Sept 30)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      // Add data for 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoKey = threeDaysAgo.toISOString().split('T')[0];

      // Add data for a week ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoKey = weekAgo.toISOString().split('T')[0];

      mealPlans[yesterdayKey] = {
        logged: {
          breakfast: [
            { name: 'TEST: Pancakes', calories: 350, protein: 10, carbs: 45, fat: 12, mealType: 'breakfast' },
            { name: 'TEST: Orange Juice', calories: 110, protein: 2, carbs: 26, fat: 0, mealType: 'breakfast' }
          ],
          lunch: [
            { name: 'TEST: Chicken Salad', calories: 420, protein: 35, carbs: 15, fat: 25, mealType: 'lunch' }
          ],
          dinner: [
            { name: 'TEST: Steak & Potatoes', calories: 680, protein: 45, carbs: 50, fat: 30, mealType: 'dinner' }
          ],
          snacks: []
        }
      };

      mealPlans[threeDaysAgoKey] = {
        logged: {
          breakfast: [
            { name: 'TEST: Oatmeal', calories: 300, protein: 10, carbs: 50, fat: 6, mealType: 'breakfast' }
          ],
          lunch: [
            { name: 'TEST: Turkey Sandwich', calories: 450, protein: 28, carbs: 42, fat: 18, mealType: 'lunch' }
          ],
          dinner: [],
          snacks: [
            { name: 'TEST: Apple', calories: 95, protein: 0, carbs: 25, fat: 0, mealType: 'snacks' }
          ]
        }
      };

      mealPlans[weekAgoKey] = {
        logged: {
          breakfast: [
            { name: 'TEST: Eggs & Toast', calories: 320, protein: 18, carbs: 28, fat: 15, mealType: 'breakfast' }
          ],
          lunch: [
            { name: 'TEST: Pizza', calories: 550, protein: 22, carbs: 65, fat: 22, mealType: 'lunch' }
          ],
          dinner: [
            { name: 'TEST: Fish Tacos', calories: 480, protein: 32, carbs: 45, fat: 18, mealType: 'dinner' }
          ],
          snacks: []
        }
      };

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));

      // Reload data to show it
      await loadMealData();
      alert('Test data added! Check calendar for green dots on past dates.');
    } catch (error) {
    }
  };

  const loadMealData = async () => {
    try {
      // Load meal plans (includes today's logged meals)
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setMealData(plans);

        // Load today's meals from meal plans
        const today = getLocalDateString();
        const todayData = plans[today];
        if (todayData?.logged) {
          setTodayMeals(todayData.logged);
        } else {
          // Reset to empty if no meals logged today
          setTodayMeals({
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          });
        }
      }
    } catch (error) {
    }
  };

  // Get all dates sorted based on filter
  const getSortedDates = () => {
    const today = getLocalDateString();
    const todayDate = new Date(today);
    const allDates = Object.keys(mealData);

    // Add today if not in mealData
    if (!allDates.includes(today)) {
      allDates.push(today);
    }

    // Generate future dates (next 14 days) for planning
    const futureDatesToAdd = [];
    for (let i = 1; i <= 14; i++) {
      const futureDate = new Date(todayDate);
      futureDate.setDate(futureDate.getDate() + i);
      const futureDateKey = getLocalDateString(futureDate);
      if (!allDates.includes(futureDateKey)) {
        futureDatesToAdd.push(futureDateKey);
      }
    }

    const allDatesWithFuture = [...allDates, ...futureDatesToAdd];
    let filteredDates = allDatesWithFuture;

    if (dateRangeFilter === 'past') {
      // Show past dates (excluding today)
      filteredDates = allDatesWithFuture.filter(dateKey => new Date(dateKey) < todayDate);
      return filteredDates.sort((a, b) => new Date(b) - new Date(a)).slice(0, 30);
    } else if (dateRangeFilter === 'future') {
      // Show future dates (excluding today)
      filteredDates = allDatesWithFuture.filter(dateKey => new Date(dateKey) > todayDate);
      return filteredDates.sort((a, b) => new Date(a) - new Date(b)).slice(0, 30);
    } else {
      // Show all dates: today, then next 7 future days, then past 15 days
      // IMPORTANT: Filter to get exactly today, future, and past dates separately
      const pastDates = allDatesWithFuture
        .filter(dateKey => dateKey < today)  // Strict less than - excludes today
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 15);
      const futureDates = allDatesWithFuture
        .filter(dateKey => dateKey > today)  // Strict greater than - excludes today
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 7);

      // Build result: today first, then future, then past
      // Use Set to ensure today appears exactly once
      const result = [today, ...futureDates, ...pastDates];
      return [...new Set(result)];
    }
  };

  // Toggle date expansion in list view
  const toggleDateExpansion = (dateKey) => {
    setExpandedDates(prev =>
      prev.includes(dateKey)
        ? prev.filter(d => d !== dateKey)
        : [...prev, dateKey]
    );
  };

  // Toggle date selection for bulk delete
  const toggleBulkDeleteSelection = (dateKey) => {
    setSelectedDatesForDelete(prev =>
      prev.includes(dateKey)
        ? prev.filter(d => d !== dateKey)
        : [...prev, dateKey]
    );
  };

  // Bulk delete planned meals from selected dates
  const bulkDeletePlannedMeals = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Remove planned meals from all selected dates
      selectedDatesForDelete.forEach(dateKey => {
        if (mealPlans[dateKey]?.planned) {
          delete mealPlans[dateKey].planned;
        }
      });

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
      await loadMealData();

      Alert.alert(
        '✓ Success',
        `Cleared planned meals from ${selectedDatesForDelete.length} day${selectedDatesForDelete.length > 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );

      // Exit bulk delete mode
      setBulkDeleteMode(false);
      setSelectedDatesForDelete([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear planned meals');
    }
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);

    // Reload data to ensure we have the latest meals for today
    await loadMealData();

    setShowDayPlanner(true);
    // Remember we're in calendar tab when opening date modal
    if (activeTab !== 'calendar') {
      setActiveTab('calendar');
    }
  };

  const getSelectedDateMeals = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const todayKey = getLocalDateString();

    // If it's today, use todayMeals state (logged meals only)
    if (dateKey === todayKey) {
      return todayMeals;
    }

    // Otherwise, get from mealData
    const dateMeals = mealData[dateKey];

    // For future dates, check planned meals
    if (isFutureDate(selectedDate) && dateMeals?.planned) {
      return dateMeals.planned;
    }

    // For past dates, check logged meals
    if (dateMeals && dateMeals.logged) {
      return dateMeals.logged;
    }

    return { breakfast: [], lunch: [], dinner: [], snacks: [] };
  };

  // New function to get planned meals for the selected date
  const getSelectedDatePlannedMeals = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const dateMeals = mealData[dateKey];

    if (dateMeals?.planned) {
      return dateMeals.planned;
    }

    return { breakfast: [], lunch: [], dinner: [], snacks: [] };
  };

  const copyMealsToDate = async (sourceDate, targetDate) => {
    try {
      const sourceDateKey = sourceDate.toISOString().split('T')[0];
      const targetDateKey = targetDate.toISOString().split('T')[0];

      // Get source meals
      let sourceMeals = null;
      if (sourceDateKey === getLocalDateString()) {
        sourceMeals = todayMeals;
      } else {
        sourceMeals = mealData[sourceDateKey]?.logged;
      }

      if (!sourceMeals || Object.values(sourceMeals).every(meals => meals.length === 0)) {
        alert('No meals found on the source date to copy');
        setShowCopyModal(false);
        setCopySourceDate(null);
        return;
      }

      // Load existing meal plans
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Copy meals to target date as planned meals
      mealPlans[targetDateKey] = {
        ...mealPlans[targetDateKey],
        planned: JSON.parse(JSON.stringify(sourceMeals)) // Deep copy
      };

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));

      // Reload data
      await loadMealData();

      // Close modal and reset state
      setShowCopyModal(false);
      setCopySourceDate(null);

      Alert.alert(
        '✓ Success',
        `Meals copied successfully to ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setShowCopyModal(false);
      setCopySourceDate(null);
      alert('Failed to copy meals');
    }
  };

  const copyMealsToMultipleDates = async (sourceDate, targetDates) => {
    try {
      const sourceDateKey = sourceDate.toISOString().split('T')[0];

      // Get source meals
      let sourceMeals = null;
      if (sourceDateKey === getLocalDateString()) {
        sourceMeals = todayMeals;
      } else {
        sourceMeals = mealData[sourceDateKey]?.logged;
      }

      if (!sourceMeals || Object.values(sourceMeals).every(meals => meals.length === 0)) {
        alert('No meals found on the source date to copy');
        setShowCopyModal(false);
        setCopySourceDate(null);
        setSelectedFutureDates([]);
        return;
      }

      // Load existing meal plans
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Copy meals to all target dates
      targetDates.forEach(targetDate => {
        const targetDateKey = targetDate.toISOString().split('T')[0];
        mealPlans[targetDateKey] = {
          ...mealPlans[targetDateKey],
          planned: JSON.parse(JSON.stringify(sourceMeals)) // Deep copy
        };
      });

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));

      // Reload data
      await loadMealData();

      // Close modal and reset state
      setShowCopyModal(false);
      setCopySourceDate(null);
      setSelectedFutureDates([]);

      Alert.alert(
        '✓ Success',
        `Meals copied successfully to ${targetDates.length} day${targetDates.length > 1 ? 's' : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setShowCopyModal(false);
      setCopySourceDate(null);
      setSelectedFutureDates([]);
      alert('Failed to copy meals');
    }
  };

  const toggleDateSelection = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const isSelected = selectedFutureDates.some(d => d.toISOString().split('T')[0] === dateKey);

    if (isSelected) {
      setSelectedFutureDates(selectedFutureDates.filter(d => d.toISOString().split('T')[0] !== dateKey));
    } else {
      setSelectedFutureDates([...selectedFutureDates, date]);
    }
  };

  const deletePlannedMealType = async (dateKey, mealType) => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      if (mealPlans[dateKey]?.planned?.[mealType]) {
        mealPlans[dateKey].planned[mealType] = [];
        await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
        await loadMealData();
      }
    } catch (error) {
    }
  };

  const deletePlannedFoodItem = async (dateKey, mealType, foodIndex) => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      if (mealPlans[dateKey]?.planned?.[mealType]) {
        mealPlans[dateKey].planned[mealType].splice(foodIndex, 1);
        await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
        await loadMealData();
      }
    } catch (error) {
    }
  };

  const editPlannedFoodItem = async (dateKey, mealType, foodIndex, updatedFood) => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      if (mealPlans[dateKey]?.planned?.[mealType]?.[foodIndex]) {
        mealPlans[dateKey].planned[mealType][foodIndex] = updatedFood;
        await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
        await loadMealData();
      }
    } catch (error) {
    }
  };

  const addFoodToPlannedDate = async (dateKey, mealType, foodItem) => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Initialize structure if needed
      if (!mealPlans[dateKey]) {
        mealPlans[dateKey] = {};
      }
      if (!mealPlans[dateKey].planned) {
        mealPlans[dateKey].planned = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };
      }

      // Add the food item
      mealPlans[dateKey].planned[mealType].push(foodItem);
      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
      await loadMealData();
    } catch (error) {
    }
  };

  const getAllPastDatesWithMeals = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.keys(mealData).forEach(dateKey => {
      const date = new Date(dateKey);
      const hasLogged = mealData[dateKey]?.logged &&
        Object.values(mealData[dateKey].logged).some(meals => meals && meals.length > 0);

      if (date <= today && hasLogged) {
        dates.push({ dateKey, date });
      }
    });

    // Sort by most recent first
    dates.sort((a, b) => b.date - a.date);

    return dates;
  };

  const getTodayDateKey = () => {
    return getLocalDateString();
  };

  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  // Delete/Edit handlers for Today tab (copied from CalorieBreakdownScreen)
  const handleDeleteFood = async (mealType, foodIndex, foodName, foodCalories) => {
    setDeleteModal({
      visible: true,
      title: 'Delete Food',
      message: `Are you sure you want to delete "${foodName}" (${foodCalories} cal) from ${mealType}?`,
      onConfirm: async () => {
        setDeleteModal({ visible: false, title: '', message: '', onConfirm: null });
        // Navigate back to Nutrition with delete params
        navigation.navigate('Nutrition', {
          deleteFood: { mealType, foodIndex }
        });
      }
    });
  };

  const handleDeleteMeal = (mealType) => {
    const mealItems = todayMeals[mealType] || [];
    if (mealItems.length === 0) return;

    const mealCalories = mealItems.reduce((sum, item) => sum + (item.calories || 0), 0);

    setDeleteModal({
      visible: true,
      title: 'Delete Entire Meal',
      message: `Are you sure you want to delete all items from ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${mealCalories} cal)?`,
      onConfirm: () => {
        setDeleteModal({ visible: false, title: '', message: '', onConfirm: null });
        // Navigate back to Nutrition with delete params
        navigation.navigate('Nutrition', {
          deleteMeal: { mealType }
        });
      }
    });
  };

  const handleEditFood = (mealType, foodIndex, food) => {
    navigation.navigate('EditFoodItem', {
      foodItem: food,
      mealType: mealType,
      foodIndex: foodIndex,
      returnScreen: 'MealsHistory'
    });
  };

  return (
    <View style={{flex: 1}}>
      {/* Removed Today tab - it's now in the parent Nutrition screen */}
      {/* Show calendar/list view directly */}
      {false ? (
        <View>
          {/* Render meals by type with edit/delete functionality */}
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
            const items = todayMeals[mealType] || [];
            if (items.length === 0) return null;

            const mealTotal = items.reduce((sum, item) => sum + (item.calories || 0), 0);
            const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);

            return (
              <StyledCard key={mealType} style={styles.todayMealCard}>
                <View style={styles.todayMealHeader}>
                  <View style={styles.todayMealTitleContainer}>
                    <Text style={styles.todayMealTitle}>{mealName}</Text>
                    <Text style={styles.todayMealTotal}>{mealTotal} cal</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMealButton}
                    onPress={() => handleDeleteMeal(mealType)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>Delete All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.todayFoodsList}>
                  {items.map((food, index) => {
                    // Format timestamp
                    const formatTime = (timestamp) => {
                      if (!timestamp) return '';
                      const date = new Date(timestamp);
                      const hours = date.getHours();
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const displayHours = hours % 12 || 12;
                      return `${displayHours}:${minutes} ${ampm}`;
                    };

                    return (
                      <View key={index} style={styles.todayFoodRow}>
                        <View style={styles.todayFoodItem}>
                          <View style={styles.todayFoodInfo}>
                            <View style={styles.todayFoodNameRow}>
                              <Text style={styles.todayFoodName}>{food.name}</Text>
                              {food.created_at && (
                                <Text style={styles.todayFoodTime}>{formatTime(food.created_at)}</Text>
                              )}
                            </View>
                            <View style={styles.todayFoodMacros}>
                              <Text style={styles.todayFoodCalories}>{food.calories || 0} cal</Text>
                              {food.protein ? <Text style={styles.todayFoodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                              {food.carbs ? <Text style={styles.todayFoodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                              {food.fat ? <Text style={styles.todayFoodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                            </View>
                          </View>
                        </View>
                        <View style={styles.todayActionZone}>
                          <TouchableOpacity
                            style={styles.editFoodButton}
                            onPress={() => handleEditFood(mealType, index, food)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={styles.editFoodButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteFoodButton}
                            onPress={() => handleDeleteFood(mealType, index, food.name, food.calories)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={styles.deleteFoodButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </StyledCard>
            );
          })}

          {Object.values(todayMeals).every(meals => meals.length === 0) && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Add meals from the Nutrition screen</Text>
            </View>
          )}

          <View style={styles.actions}>
            <StyledButton
              title="Go to Nutrition"
              icon="🥗"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Nutrition')}
              style={styles.actionButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.historyTabContainer}>
          {/* View Mode Toggle: Calendar / List */}
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[styles.viewModeButton, calendarViewMode === 'calendar' && styles.viewModeButtonActive]}
              onPress={() => setCalendarViewMode('calendar')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewModeText, calendarViewMode === 'calendar' && styles.viewModeTextActive]}>
                📅 Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, calendarViewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setCalendarViewMode('list')}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewModeText, calendarViewMode === 'list' && styles.viewModeTextActive]}>
                📊 List
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date range filter removed - controlled by parent tabs (History vs Plan) */}

          {calendarViewMode === 'calendar' ? (
            <View style={styles.calendarTab}>
              <CalendarView
                selectedDate={selectedDate}
                onDateSelect={bulkDeleteMode ? (date) => {
                  const dateKey = date.toISOString().split('T')[0];
                  // Only allow selection of dates with planned meals
                  if (mealData[dateKey]?.planned && Object.values(mealData[dateKey].planned).some(items => items?.length > 0)) {
                    toggleBulkDeleteSelection(dateKey);
                  }
                } : handleDateSelect}
                mealData={mealData}
                multiSelectMode={bulkDeleteMode}
                selectedDates={bulkDeleteMode ? selectedDatesForDelete.map(dateKey => new Date(dateKey)) : []}
              />

              {/* Bulk Delete Planned Meals Button - Always show in calendar view */}
              {(
                <View style={styles.bulkDeleteContainer}>
                  {!bulkDeleteMode ? (
                    <TouchableOpacity
                      style={styles.clearPlannedButton}
                      onPress={() => setBulkDeleteMode(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearPlannedButtonText}>🗑️ Clear Planned Meals</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text style={styles.bulkDeleteInstructions}>
                        Tap dates with planned meals to select them
                      </Text>
                      <View style={styles.bulkDeleteActions}>
                        <TouchableOpacity
                          style={styles.cancelBulkButton}
                          onPress={() => {
                            setBulkDeleteMode(false);
                            setSelectedDatesForDelete([]);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelBulkButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.clearSelectedButton,
                            selectedDatesForDelete.length === 0 && styles.clearSelectedButtonDisabled
                          ]}
                          onPress={bulkDeletePlannedMeals}
                          disabled={selectedDatesForDelete.length === 0}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.clearSelectedButtonText}>
                            Clear Selected ({selectedDatesForDelete.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.calendarInfo}>
                <Text style={styles.infoTitle}>📅 How to Use</Text>
                <View style={styles.infoList}>
                  <Text style={styles.infoText}>• 🟢 Green dots = Past logged meals (read-only)</Text>
                  <Text style={styles.infoText}>• 🟠 Orange dots = Future planned meals (editable)</Text>
                  <Text style={styles.infoText}>• Tap any date to view/edit details</Text>
                  <Text style={styles.infoText}>• Plan meals for future dates - they become history after that date</Text>
                  <Text style={styles.infoText}>• Use "Clear Planned Meals" to bulk delete future plans</Text>
                </View>
              </View>

              {/* TEMPORARY TEST BUTTON */}
              <View style={styles.testButtonContainer}>
                <StyledButton
                  title="🧪 Add Test Historical Data"
                  size="md"
                  variant="secondary"
                  fullWidth
                  onPress={addTestHistoricalData}
                  style={styles.testButton}
                />
              </View>
            </View>
          ) : (
            <ScrollView
              style={styles.listView}
              contentContainerStyle={styles.listViewContent}
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                const sortedDates = getSortedDates();
                const todayStr = getLocalDateString(); // Calculate once for all dates

                if (sortedDates.length === 0) {
                  return (
                    <View style={styles.emptyListView}>
                      <Text style={styles.emptyListTitle}>
                        📅 No Meal Data
                      </Text>
                      <Text style={styles.emptyListText}>
                        Start logging meals in the Today tab or plan future meals by tapping dates in the calendar.
                      </Text>
                    </View>
                  );
                }

                return sortedDates.map((dateKey, index) => {
                // Parse date as local time to avoid timezone issues
                // "2025-11-07" -> Date object with local time, not UTC
                const [year, month, day] = dateKey.split('-').map(Number);
                const dateObj = new Date(year, month - 1, day);
                const isExpanded = expandedDates.includes(dateKey);
                const dayData = mealData[dateKey] || {};
                const loggedMeals = dayData.logged || {};
                const plannedMeals = dayData.planned || {};

                // Calculate totals
                const loggedTotal = Object.values(loggedMeals).reduce((sum, items) =>
                  sum + (items || []).reduce((s, item) => s + (item.calories || 0), 0), 0
                );
                const plannedTotal = Object.values(plannedMeals).reduce((sum, items) =>
                  sum + (items || []).reduce((s, item) => s + (item.calories || 0), 0), 0
                );
                const totalCals = loggedTotal + plannedTotal;

                // Count meals by type
                const mealCounts = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
                ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(type => {
                  const loggedItems = Array.isArray(loggedMeals[type]) ? loggedMeals[type] : [];
                  const plannedItems = Array.isArray(plannedMeals[type]) ? plannedMeals[type] : [];
                  mealCounts[type] = loggedItems.length + plannedItems.length;
                });

                const hasAnyMeals = Object.values(mealCounts).some(count => count > 0);
                const isToday = dateKey === todayStr;
                const hasPlannedMeals = Object.values(plannedMeals).some(items => items?.length > 0);
                const isSelected = selectedDatesForDelete.includes(dateKey);
                const isFuture = dateKey > todayStr;
                const isPast = dateKey < todayStr;

                return (
                  <TouchableOpacity
                    key={dateKey}
                    style={[
                      styles.listDateCard,
                      isToday && styles.listDateCardToday,
                      isFuture && styles.listDateCardFuture,
                      isPast && styles.listDateCardPast,
                      isExpanded && styles.listDateCardExpanded,
                      bulkDeleteMode && isSelected && styles.listDateCardSelected
                    ]}
                    onPress={() => {
                      if (bulkDeleteMode) {
                        // In bulk delete mode, only allow selection of dates with planned meals
                        if (hasPlannedMeals) {
                          toggleBulkDeleteSelection(dateKey);
                        }
                      } else {
                        if (hasAnyMeals) {
                          toggleDateExpansion(dateKey);
                        } else {
                          // Open day planner for empty dates
                          handleDateSelect(dateObj);
                        }
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listDateHeader}>
                      <View style={styles.listDateInfo}>
                        <Text style={[styles.listDateText, isToday && styles.listDateToday]}>
                          {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </Text>
                        {hasAnyMeals && (
                          <View style={styles.listMealIcons}>
                            {mealCounts.breakfast > 0 && <Text style={styles.listMealIcon}>🌅{mealCounts.breakfast}</Text>}
                            {mealCounts.lunch > 0 && <Text style={styles.listMealIcon}>☀️{mealCounts.lunch}</Text>}
                            {mealCounts.dinner > 0 && <Text style={styles.listMealIcon}>🌙{mealCounts.dinner}</Text>}
                            {mealCounts.snacks > 0 && <Text style={styles.listMealIcon}>🍿{mealCounts.snacks}</Text>}
                          </View>
                        )}
                      </View>
                      <View style={styles.listDateRight}>
                        {hasAnyMeals ? (
                          <>
                            <Text style={styles.listDateCalories}>{totalCals} cal</Text>
                            <Text style={styles.listExpandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                          </>
                        ) : (
                          <View style={styles.listEmptyContainer}>
                            {isFuture && <Text style={styles.listEmptyIcon}>📆</Text>}
                            <Text style={styles.listEmptyText}>{isFuture ? 'Tap to plan' : 'No meals'}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isExpanded && hasAnyMeals && (
                      <View style={styles.listDateExpanded}>
                        <View style={styles.listExpandedActions}>
                          <TouchableOpacity
                            style={styles.listActionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDateSelect(dateObj);
                            }}
                          >
                            <Text style={styles.listActionButtonText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                          const logged = loggedMeals[mealType] || [];
                          const planned = plannedMeals[mealType] || [];
                          if (logged.length === 0 && planned.length === 0) return null;

                          return (
                            <View key={mealType} style={styles.listMealTypeSection}>
                              <Text style={styles.listMealTypeName}>
                                {mealType === 'breakfast' && '🌅'}
                                {mealType === 'lunch' && '☀️'}
                                {mealType === 'dinner' && '🌙'}
                                {mealType === 'snacks' && '🍿'}
                                {' '}{mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                              </Text>
                              {logged.map((food, idx) => (
                                <View key={`logged-${idx}`} style={styles.listFoodItem}>
                                  <Text style={styles.listFoodStatus}>✓</Text>
                                  <Text style={styles.listFoodName}>{food.name}</Text>
                                  <Text style={styles.listFoodCals}>{food.calories} cal</Text>
                                </View>
                              ))}
                              {planned.map((food, idx) => (
                                <View key={`planned-${idx}`} style={styles.listFoodItem}>
                                  <Text style={styles.listFoodStatus}>📅</Text>
                                  <Text style={[styles.listFoodName, styles.listFoodPlanned]}>{food.name}</Text>
                                  <Text style={styles.listFoodCals}>{food.calories} cal</Text>
                                </View>
                              ))}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              });
              })()}

              {/* Bulk Delete Planned Meals - List View */}
              {(
                <View style={styles.bulkDeleteContainer}>
                  {!bulkDeleteMode ? (
                    <TouchableOpacity
                      style={styles.clearPlannedButton}
                      onPress={() => setBulkDeleteMode(true)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.clearPlannedButtonText}>🗑️ Clear Planned Meals</Text>
                    </TouchableOpacity>
                ) : (
                  <View>
                    <Text style={styles.bulkDeleteInstructions}>
                      Tap dates with planned meals to select them
                    </Text>
                    <View style={styles.bulkDeleteActions}>
                      <TouchableOpacity
                        style={styles.cancelBulkButton}
                        onPress={() => {
                          setBulkDeleteMode(false);
                          setSelectedDatesForDelete([]);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelBulkButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.clearSelectedButton,
                          selectedDatesForDelete.length === 0 && styles.clearSelectedButtonDisabled
                        ]}
                        onPress={bulkDeletePlannedMeals}
                        disabled={selectedDatesForDelete.length === 0}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.clearSelectedButtonText}>
                          Clear Selected ({selectedDatesForDelete.length})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Day Details Modal */}
      <Modal
        visible={showDayPlanner}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowDayPlanner(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Background Design */}
          <View style={styles.backgroundDesign}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>

          {/* Drag Handle */}
          <View style={styles.modalDragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowDayPlanner(false);
              }}
              style={styles.closeButtonWrapper}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dateInfoCard}>
              <Text style={styles.modalSubtitle}>
                {isFutureDate(selectedDate)
                  ? '📅 Future Date'
                  : isToday(selectedDate)
                  ? '🌟 Today'
                  : '📋 Past Date'}
              </Text>
            </View>

            {isFutureDate(selectedDate) ? (
              <>
                {/* Show planned meals if they exist */}
                {Object.entries(getSelectedDateMeals()).map(([mealType, items]) => (
                  items.length > 0 && (
                    <View key={mealType} style={[styles.modalMealSection, styles.modalMealSectionPlanned]}>
                      <View style={styles.plannedMealHeader}>
                        <View style={styles.modalMealTypeContainer}>
                          <Text style={styles.modalMealType}>
                            {mealType === 'breakfast' && '🌅 Breakfast'}
                            {mealType === 'lunch' && '☀️ Lunch'}
                            {mealType === 'dinner' && '🌙 Dinner'}
                            {mealType === 'snacks' && '🍿 Snacks'}
                          </Text>
                          <View style={styles.plannedBadge}>
                            <Text style={styles.plannedBadgeText}>📅 Planned</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => deletePlannedMealType(getDateKey(selectedDate), mealType)}
                          style={styles.deletePlannedButton}
                        >
                          <Text style={styles.deletePlannedText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      {items.map((item, index) => (
                        <View key={index} style={styles.plannedFoodItemRow}>
                          <View style={styles.plannedFoodInfo}>
                            <Text style={styles.modalMealName}>{item.name}</Text>
                            <Text style={styles.modalMealCalories}>{item.calories} cal</Text>
                          </View>
                          <View style={styles.plannedFoodActions}>
                            <TouchableOpacity
                              onPress={() => {
                                // Close the modal first, then navigate
                                const dateKey = getDateKey(selectedDate);
                                const dateToReopen = selectedDate;
                                setShowDayPlanner(false);
                                setTimeout(() => {
                                  navigation.navigate('EditFoodItem', {
                                    foodItem: item,
                                    mealType: mealType,
                                    foodIndex: index,
                                    returnScreen: 'MealsHistory',
                                    isPlannedMeal: true,
                                    plannedDateKey: dateKey,
                                    reopenDate: dateToReopen.toISOString()
                                  });
                                }, 300);
                              }}
                              style={styles.editPlannedButton}
                            >
                              <Text style={styles.editPlannedText}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => deletePlannedFoodItem(getDateKey(selectedDate), mealType, index)}
                              style={styles.deletePlannedFoodButton}
                            >
                              <Text style={styles.deletePlannedText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                ))}

                {/* Add food buttons */}
                <View style={styles.addFoodSection}>
                  <Text style={styles.addFoodTitle}>Add to Plan</Text>

                  {/* Meal Type Selector */}
                  <View style={styles.mealTypeSelector}>
                    <Text style={styles.mealTypeSelectorLabel}>Add to:</Text>
                    <View style={styles.mealTypeTabs}>
                      {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => (
                        <TouchableOpacity
                          key={mealType}
                          style={[
                            styles.mealTypeTab,
                            selectedMealTypeForAdd === mealType && styles.mealTypeTabActive
                          ]}
                          onPress={() => setSelectedMealTypeForAdd(mealType)}
                        >
                          <Text style={[
                            styles.mealTypeTabText,
                            selectedMealTypeForAdd === mealType && styles.mealTypeTabTextActive
                          ]}>
                            {mealType === 'breakfast' && '🌅'}
                            {mealType === 'lunch' && '☀️'}
                            {mealType === 'dinner' && '🌙'}
                            {mealType === 'snacks' && '🍿'}
                          </Text>
                          <Text style={[
                            styles.mealTypeTabLabel,
                            selectedMealTypeForAdd === mealType && styles.mealTypeTabLabelActive
                          ]}>
                            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.addFoodButtons}>
                    <TouchableOpacity
                      style={styles.addFoodButton}
                      onPress={() => {
                        const dateKey = getDateKey(selectedDate);
                        const dateToReopen = selectedDate;
                        setShowDayPlanner(false);
                        setTimeout(() => {
                          navigation.navigate('FoodSearch', {
                            mealType: selectedMealTypeForAdd,
                            isPlannedMeal: true,
                            plannedDateKey: dateKey,
                            reopenDate: dateToReopen.toISOString()
                          });
                        }, 300);
                      }}
                    >
                      <Text style={styles.addFoodButtonIcon}>🔍</Text>
                      <Text style={styles.addFoodButtonText}>Search Food</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addFoodButton}
                      onPress={() => {
                        const dateKey = getDateKey(selectedDate);
                        const dateToReopen = selectedDate;
                        setShowDayPlanner(false);
                        setTimeout(() => {
                          navigation.navigate('FoodScanning', {
                            mealType: selectedMealTypeForAdd,
                            isPlannedMeal: true,
                            plannedDateKey: dateKey,
                            reopenDate: dateToReopen.toISOString()
                          });
                        }, 300);
                      }}
                    >
                      <Text style={styles.addFoodButtonIcon}>📷</Text>
                      <Text style={styles.addFoodButtonText}>Scan Barcode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addFoodButton}
                      onPress={() => {
                        const dateKey = getDateKey(selectedDate);
                        const dateToReopen = selectedDate;
                        setShowDayPlanner(false);
                        setTimeout(() => {
                          navigation.navigate('Recipes', {
                            mealType: selectedMealTypeForAdd,
                            isPlannedMeal: true,
                            plannedDateKey: dateKey,
                            reopenDate: dateToReopen.toISOString()
                          });
                        }, 300);
                      }}
                    >
                      <Text style={styles.addFoodButtonIcon}>📖</Text>
                      <Text style={styles.addFoodButtonText}>Add Recipe</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Show copy meals button */}
                <View style={styles.featureCard}>
                  <Text style={styles.featureTitle}>📅 Copy Meals</Text>
                  <Text style={styles.featureText}>
                    Copy meals from a previous day to plan ahead
                  </Text>
                  <TouchableOpacity
                    style={styles.copyMealsButton}
                    onPress={() => {
                      setShowDayPlanner(false); // Close the day planner first
                      setTimeout(() => setShowCopyModal(true), 300); // Small delay for smooth transition
                    }}
                  >
                    <Text style={styles.copyMealsButtonText}>📋 Copy from Past Day</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Logged Meals */}
                {Object.entries(getSelectedDateMeals()).map(([mealType, items]) => (
                  items.length > 0 && (
                    <View key={mealType} style={styles.modalMealSection}>
                      <View style={styles.modalMealHeader}>
                        <Text style={styles.modalMealType}>
                          {mealType === 'breakfast' && '🌅 Breakfast'}
                          {mealType === 'lunch' && '☀️ Lunch'}
                          {mealType === 'dinner' && '🌙 Dinner'}
                          {mealType === 'snacks' && '🍿 Snacks'}
                        </Text>
                        <View style={styles.loggedBadge}>
                          <Text style={styles.loggedBadgeText}>✓ Logged</Text>
                        </View>
                      </View>
                      {items.map((item, index) => (
                        <View key={index} style={[styles.modalMealItem, styles.modalMealItemLogged]}>
                          <View style={styles.modalMealItemContent}>
                            <Text style={styles.modalMealName}>{item.name}</Text>
                            <Text style={styles.modalMealCalories}>{item.calories} cal</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                ))}

                {/* Planned Meals for Today */}
                {isToday(selectedDate) && Object.entries(getSelectedDatePlannedMeals()).map(([mealType, items]) => (
                  items.length > 0 && (
                    <View key={`planned-${mealType}`} style={[styles.modalMealSection, styles.modalMealSectionPlanned]}>
                      <View style={styles.plannedMealHeader}>
                        <View style={styles.modalMealTypeContainer}>
                          <Text style={styles.modalMealType}>
                            {mealType === 'breakfast' && '🌅 Breakfast'}
                            {mealType === 'lunch' && '☀️ Lunch'}
                            {mealType === 'dinner' && '🌙 Dinner'}
                            {mealType === 'snacks' && '🍿 Snacks'}
                          </Text>
                          <View style={styles.plannedBadge}>
                            <Text style={styles.plannedBadgeText}>📅 Planned</Text>
                          </View>
                        </View>
                      </View>
                      {items.map((item, index) => (
                        <View key={index} style={styles.plannedFoodItemRow}>
                          <View style={styles.plannedFoodInfo}>
                            <Text style={styles.modalMealName}>{item.name}</Text>
                            <Text style={styles.modalMealCalories}>{item.calories} cal</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                ))}

                {/* Show copy to future button if meals exist */}
                {!Object.values(getSelectedDateMeals()).every(meals => meals.length === 0) && (
                  <TouchableOpacity
                    style={styles.copyToFutureButton}
                    onPress={() => {
                      setCopySourceDate(selectedDate);
                      setShowDayPlanner(false); // Close the day planner first
                      setTimeout(() => setShowCopyModal(true), 300); // Small delay for smooth transition
                    }}
                  >
                    <Text style={styles.copyToFutureText}>📅 Copy to Future Date</Text>
                  </TouchableOpacity>
                )}

                {Object.values(getSelectedDateMeals()).every(meals => meals.length === 0) &&
                 Object.values(getSelectedDatePlannedMeals()).every(meals => meals.length === 0) && (
                  <View style={styles.emptyModalContainer}>
                    <Text style={styles.emptyModalText}>No meals logged</Text>
                    <Text style={styles.emptyModalSubtext}>
                      {isToday(selectedDate)
                        ? 'Add meals from the Nutrition screen'
                        : 'No meals were logged on this date'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Copy Meals Modal */}
      <Modal
        visible={showCopyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCopyModal(false);
          setCopySourceDate(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.backgroundDesign}>
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />
          </View>

          {/* Drag Handle */}
          <View style={styles.modalDragHandle}>
            <View style={styles.dragIndicator} />
          </View>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {copySourceDate ? 'Copy to Future Date' : 'Copy from Past Day'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCopyModal(false);
                setCopySourceDate(null);
              }}
              style={styles.closeButtonWrapper}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {copySourceDate ? (
              // Show future dates to copy TO
              <>
                <Text style={styles.copyInstructions}>
                  Select future dates to copy meals to:
                </Text>
                <CalendarView
                  selectedDate={new Date()}
                  multiSelectMode={true}
                  selectedDates={selectedFutureDates}
                  onDateSelect={(date) => {
                    if (isFutureDate(date)) {
                      toggleDateSelection(date);
                    } else {
                      alert('Please select a future date');
                    }
                  }}
                  mealData={mealData}
                />

                {/* Selected dates summary and confirm button */}
                {selectedFutureDates.length > 0 && (
                  <View style={styles.confirmSection}>
                    <View style={styles.selectedDatesInfo}>
                      <Text style={styles.selectedDatesCount}>
                        {selectedFutureDates.length} date{selectedFutureDates.length > 1 ? 's' : ''} selected
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedFutureDates([])}
                        style={styles.clearSelectionButton}
                      >
                        <Text style={styles.clearSelectionText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={async () => {
                        await copyMealsToMultipleDates(copySourceDate, selectedFutureDates);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.confirmButtonText}>
                        ✓ Copy to {selectedFutureDates.length} Day{selectedFutureDates.length > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              // Show past dates to copy FROM
              <>
                <Text style={styles.copyInstructions}>
                  Select a day to copy meals from:
                </Text>
                {getAllPastDatesWithMeals().length === 0 ? (
                  <View style={styles.emptyModalContainer}>
                    <Text style={styles.emptyModalText}>No past meals found</Text>
                    <Text style={styles.emptyModalSubtext}>
                      Log some meals first, then you can copy them to future dates
                    </Text>
                  </View>
                ) : (
                  getAllPastDatesWithMeals().slice(0, 10).map(({ dateKey, date }) => {
                    const meals = mealData[dateKey]?.logged;
                    const totalCals = Object.values(meals || {}).reduce((sum, mealItems) => {
                      return sum + (mealItems || []).reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
                    }, 0);

                    return (
                      <TouchableOpacity
                        key={dateKey}
                        style={styles.pastDateCard}
                        activeOpacity={0.7}
                        onPress={async () => {
                          await copyMealsToDate(date, selectedDate);
                        }}
                      >
                        <View style={styles.pastDateHeader}>
                          <Text style={styles.pastDateTitle}>
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </Text>
                          <Text style={styles.pastDateCalories}>{totalCals} cal</Text>
                        </View>
                        <View style={styles.pastDateMeals}>
                          {Object.entries(meals || {}).map(([mealType, items]) => (
                            items && items.length > 0 && (
                              <Text key={mealType} style={styles.pastDateMeal}>
                                {mealType === 'breakfast' && '🌅'}
                                {mealType === 'lunch' && '☀️'}
                                {mealType === 'dinner' && '🌙'}
                                {mealType === 'snacks' && '🍿'}
                                {' '}{items.length}
                              </Text>
                            )
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal for Today Tab */}
      <Modal
        transparent={true}
        visible={deleteModal.visible}
        animationType="fade"
        onRequestClose={() => setDeleteModal({ visible: false, title: '', message: '', onConfirm: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>{deleteModal.title}</Text>
            <Text style={styles.deleteModalMessage}>{deleteModal.message}</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModal({ visible: false, title: '', message: '', onConfirm: null })}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={deleteModal.onConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalDragHandle: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    opacity: 0.4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.round,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.background,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealType: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },
  mealName: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  mealDetails: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  actions: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  calendarTab: {
    flex: 1,
  },
  calendarInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundDesign: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: '#059669',
    bottom: 100,
    left: -125,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: '#10B981',
    bottom: -100,
    right: -50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  closeButtonWrapper: {
    padding: Spacing.sm,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  dateInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  featureTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  featureText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
  modalMealSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#4CAF50' + '40',
  },
  modalMealSectionPlanned: {
    borderColor: '#FF9800',
    borderStyle: 'dashed',
    backgroundColor: '#FF9800' + '05',
  },
  modalMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalMealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  modalMealType: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  loggedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  loggedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.background,
  },
  plannedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  plannedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.background,
  },
  modalMealItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalMealItemLogged: {
    backgroundColor: '#4CAF50' + '08',
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  modalMealItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalMealName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  modalMealCalories: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyModalText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  emptyModalSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  testButtonContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  testButton: {
    backgroundColor: Colors.warning + '20',
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  plannedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  deletePlannedButton: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  deletePlannedText: {
    fontSize: 16,
  },
  copyMealsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  copyMealsButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  copyToFutureButton: {
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  copyToFutureText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  copyInstructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  pastDateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pastDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pastDateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  pastDateCalories: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  pastDateMeals: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  pastDateMeal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  confirmSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  selectedDatesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  selectedDatesCount: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  clearSelectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearSelectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  plannedFoodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  plannedFoodInfo: {
    flex: 1,
  },
  plannedFoodActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  editPlannedButton: {
    backgroundColor: Colors.primary + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlannedText: {
    fontSize: 14,
  },
  deletePlannedFoodButton: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumePlannedButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  consumePlannedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addFoodSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFoodTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  addFoodButtons: {
    gap: Spacing.sm,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addFoodButtonIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  addFoodButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  mealTypeSelector: {
    marginBottom: Spacing.md,
  },
  mealTypeSelectorLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  mealTypeTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  mealTypeTab: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeTabActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  mealTypeTabText: {
    fontSize: 20,
    marginBottom: 2,
  },
  mealTypeTabTextActive: {
    // Emoji doesn't need active styling
  },
  mealTypeTabLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mealTypeTabLabelActive: {
    color: Colors.primary,
  },
  // Today Tab Styles (copied from CalorieBreakdownScreen)
  todayMealCard: {
    marginBottom: Spacing.md,
  },
  todayMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  todayMealTitleContainer: {
    flex: 1,
  },
  todayMealTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  todayMealTotal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteMealButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  todayFoodsList: {
    gap: Spacing.xs,
  },
  todayFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  todayFoodItem: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#4CAF50' + '15',
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: '#4CAF50' + '40',
  },
  todayFoodInfo: {
    flex: 1,
  },
  todayFoodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  todayFoodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  todayFoodTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '400',
    marginLeft: Spacing.xs,
  },
  todayFoodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  todayFoodCalories: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  todayFoodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  todayActionZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  editFoodButton: {
    backgroundColor: Colors.primary + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editFoodButtonText: {
    fontSize: 16,
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
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  deleteModalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  deleteModalMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalCancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  modalDeleteButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modalDeleteText: {
    fontSize: Typography.fontSize.md,
    color: Colors.background,
    fontWeight: '600',
  },
  // History tab container
  historyTabContainer: {
    flex: 1,
  },
  // View mode toggle
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewModeTextActive: {
    color: Colors.background,
  },
  // Date range filter
  dateRangeFilter: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  dateRangeButtonActive: {
    backgroundColor: Colors.primary,
  },
  dateRangeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateRangeTextActive: {
    color: Colors.background,
  },
  // List view styles
  listView: {
    flex: 1,
  },
  listViewContent: {
    flexGrow: 1,
  },
  emptyListView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyListTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyListText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  listDateCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  listDateCardToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '08',
  },
  listDateCardFuture: {
    borderColor: '#FF9500',  // Orange
    borderLeftWidth: 4,
  },
  listDateCardPast: {
    backgroundColor: Colors.surface,
    opacity: 0.85,
  },
  listDateCardExpanded: {
    borderColor: Colors.primary,
  },
  listDateCardSelected: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  listDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  listDateInfo: {
    flex: 1,
  },
  listDateText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  listDateToday: {
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
  },
  listMealIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  listMealIcon: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  listDateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listDateCalories: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  listExpandIcon: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listEmptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listEmptyIcon: {
    fontSize: Typography.fontSize.md,
  },
  listEmptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  listDateExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  listExpandedActions: {
    marginBottom: Spacing.md,
  },
  listActionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  listActionButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  listMealTypeSection: {
    marginBottom: Spacing.md,
  },
  listMealTypeName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  listFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  listFoodStatus: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  listFoodName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  listFoodPlanned: {
    color: Colors.textSecondary,
  },
  listFoodCals: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  // Bulk delete styles
  bulkDeleteContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  clearPlannedButton: {
    backgroundColor: Colors.error + '20',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '60',
  },
  clearPlannedButtonText: {
    color: Colors.error,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  bulkDeleteInstructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
    fontWeight: '500',
  },
  bulkDeleteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBulkButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cancelBulkButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  clearSelectedButton: {
    flex: 1,
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  clearSelectedButtonDisabled: {
    opacity: 0.4,
  },
  clearSelectedButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
});