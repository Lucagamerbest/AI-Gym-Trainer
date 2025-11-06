import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import MacroGoalsModal from '../components/MacroGoalsModal';
import AIHeaderButton from '../components/AIHeaderButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getNutritionGoals, updateNutritionGoals } from '../services/userProfileService';
import MealSyncService from '../services/backend/MealSyncService';
import MealHistoryTabs from '../components/MealHistoryTabs';

const MACROS_KEY = '@macro_goals';
const DAILY_NUTRITION_KEY = '@daily_nutrition';
const LAST_RESET_DATE_KEY = '@last_reset_date';
const MEAL_PLANS_KEY = '@meal_plans';

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NutritionScreen({ navigation, route }) {
  const { user } = useAuth();
  const [burned] = useState(0); // Will be updated when exercise tracking is implemented
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [disableBack, setDisableBack] = useState(false); // Track if back should be disabled
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded
  const processedParams = useRef({}); // Track which params have been processed

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'calendar'
  const [macroGoals, setMacroGoals] = useState({
    calories: 2000,
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 65,
  });
  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [plannedMeals, setPlannedMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [consumedPlannedMeals, setConsumedPlannedMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });

  // Calculate consumed calories and macros directly from meals state
  // This ensures it's always in sync with Firebase data (same as AI/ContextManager)
  const { consumed, consumedMacros } = useMemo(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
      if (meals[mealType] && Array.isArray(meals[mealType])) {
        meals[mealType].forEach(food => {
          totalCalories += food.calories || 0;
          totalProtein += food.protein || 0;
          totalCarbs += food.carbs || 0;
          totalFat += food.fat || 0;
        });
      }
    });

    return {
      consumed: totalCalories,
      consumedMacros: {
        proteinGrams: totalProtein,
        carbsGrams: totalCarbs,
        fatGrams: totalFat
      }
    };
  }, [meals]);

  useEffect(() => {
    const initializeData = async () => {
      await loadMacroGoals();
      await checkAndResetDaily();
      await loadDailyNutrition();

      // One-time migration: Sync existing AsyncStorage meals to Firebase
      if (user?.uid && user.uid !== 'guest') {
        try {
          const migrationKey = `@meals_migrated_${user.uid}`;
          const alreadyMigrated = await AsyncStorage.getItem(migrationKey);

          if (!alreadyMigrated) {
            console.log('🔄 Starting one-time meal migration to Firebase...');
            const result = await MealSyncService.migrateAsyncStorageMeals(user.uid);
            console.log(`🎉 Migration result: ${result.migrated} migrated, ${result.failed} failed`);

            // Mark migration as complete
            await AsyncStorage.setItem(migrationKey, 'true');
          }
        } catch (error) {
          console.log('⚠️ Migration error (will retry next time):', error);
        }
      }
    };
    initializeData();
  }, []);

  // Reload data when screen is focused (e.g., coming back from CalorieBreakdown)
  // Skip reload if we're coming back with edit/delete/add params (handled by useEffect)
  useFocusEffect(
    React.useCallback(() => {
      // Reset processed params when screen is focused
      processedParams.current = {};

      if (!route.params?.deleteFood && !route.params?.deleteMeal && !route.params?.editFood && !route.params?.addedFood) {
        loadDailyNutrition();
      }
    }, [route.params])
  );

  // Use focus effect to ensure swipe is disabled when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (disableBack) {
        // Ensure swipe is disabled when screen is focused
        navigation.setOptions({
          gestureEnabled: false
        });
      }

      // Listen for delete and edit events from CalorieBreakdownScreen
      const unsubscribeDelete = navigation.addListener('focus', () => {
        navigation.setOptions({
          deleteFood: handleDeleteFood,
          editFood: handleEditFood
        });
      });

      return () => {
        unsubscribeDelete();
      };
    }, [disableBack, navigation])
  );

  // Handle incoming food/recipe data from navigation
  useEffect(() => {
    // Only process these if data has been loaded
    if (!dataLoaded) {
      return;
    }

    // Handle delete food request from CalorieBreakdownScreen
    if (route.params?.deleteFood && !processedParams.current.deleteFood) {
      const { mealType, foodIndex } = route.params.deleteFood;
      processedParams.current.deleteFood = true;
      handleDeleteFood(mealType, foodIndex);
    }

    // Handle delete entire meal request from CalorieBreakdownScreen
    if (route.params?.deleteMeal && !processedParams.current.deleteMeal) {
      const { mealType } = route.params.deleteMeal;
      processedParams.current.deleteMeal = true;
      const mealItems = meals[mealType] || [];
      const mealItemsCount = mealItems.length;
      for (let i = mealItemsCount - 1; i >= 0; i--) {
        handleDeleteFood(mealType, i);
      }
    }

    // Handle edit food request from CalorieBreakdownScreen
    if (route.params?.editFood && !processedParams.current.editFood) {
      const { mealType, foodIndex, updatedFood } = route.params.editFood;
      processedParams.current.editFood = true;
      handleEditFood(mealType, foodIndex, updatedFood);
    }

    // Check if we came from adding a recipe
    if (route.params?.fromRecipeAdd && !processedParams.current.fromRecipeAdd) {
      processedParams.current.fromRecipeAdd = true;
      setDisableBack(true); // Disable back navigation

      // Disable swipe gesture immediately
      navigation.setOptions({
        gestureEnabled: false
      });
    }

    // Only process added food after data is loaded
    if (route.params?.addedFood && dataLoaded && !processedParams.current.addedFood) {
      const { addedFood } = route.params;
      const mealType = addedFood.mealType || 'breakfast';

      processedParams.current.addedFood = true;

      // Update selected meal to match the added food's meal type
      setSelectedMeal(mealType);

      // Add created_at timestamp to the food item
      const timestamp = new Date().toISOString();
      addedFood.created_at = timestamp;

      // Auto-sync new meal to Firebase first to get the Firebase ID
      (async () => {
        if (user?.uid && user.uid !== 'guest') {
          try {
            const today = getLocalDateString();
            const consumptionEntry = {
              date: today,
              meal_type: mealType,
              food_name: addedFood.name || 'Unknown food',
              food_brand: addedFood.brand || '',
              quantity_grams: addedFood.quantity || 100,
              calories_consumed: addedFood.calories || 0,
              protein_consumed: addedFood.protein || 0,
              carbs_consumed: addedFood.carbs || 0,
              fat_consumed: addedFood.fat || 0,
              created_at: timestamp,
            };
            const firebaseId = await MealSyncService.uploadDailyConsumption(user.uid, consumptionEntry);

            // Store Firebase ID with the added food
            addedFood.firebaseId = firebaseId;
            console.log('✅ New meal synced to Firebase with ID:', firebaseId);
          } catch (error) {
            console.log('⚠️ Failed to sync to Firebase:', error);
            // Continue without firebaseId if sync fails
          }
        }
      })();

      // Use current meals state (already loaded from Firebase)
      const updatedMeals = {
        ...meals,
        [mealType]: [...(meals[mealType] || []), addedFood]
      };

      // Update meals state (consumed will auto-calculate from useMemo)
      setMeals(updatedMeals);

      // Save UI state to AsyncStorage
      saveDailyNutrition(updatedMeals, mealType);
    }
  }, [route.params?.addedFood, route.params?.fromRecipeAdd, route.params?.deleteFood, route.params?.deleteMeal, route.params?.editFood, dataLoaded, meals]);

  const loadMacroGoals = async () => {
    try {
      const userId = user?.uid || 'guest';
      const goals = await getNutritionGoals(userId);
      setMacroGoals({
        calories: goals.calories,
        proteinGrams: goals.protein,
        carbsGrams: goals.carbs,
        fatGrams: goals.fat,
      });
    } catch (error) {
      console.error('Error loading macro goals:', error);
    }
  };

  const checkAndResetDaily = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
      const today = new Date().toDateString();

      if (lastResetDate !== today) {
        // BEFORE resetting, save yesterday's meals to calendar history
        const savedNutrition = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
        if (savedNutrition) {
          const data = JSON.parse(savedNutrition);
          if (data.meals && lastResetDate) {
            // Get yesterday's date key
            const yesterdayDate = new Date(lastResetDate);
            const yesterdayKey = yesterdayDate.toISOString().split('T')[0];

            // Save to calendar history
            const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
            const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

            mealPlans[yesterdayKey] = {
              ...mealPlans[yesterdayKey],
              logged: data.meals
            };

            await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
          }
        }

        // Now reset for new day
        await AsyncStorage.setItem(LAST_RESET_DATE_KEY, today);
        await AsyncStorage.removeItem(DAILY_NUTRITION_KEY);

        // Check if there are planned meals for today
        const todayKey = getLocalDateString();
        const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
        const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};
        const todayPlanned = mealPlans[todayKey]?.planned;

        if (todayPlanned && Object.values(todayPlanned).some(meals => meals && meals.length > 0)) {
          // Load planned meals separately (don't count toward nutrition yet)
          setPlannedMeals(todayPlanned);
          setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
          setSelectedMeal('breakfast');
        } else {
          // No planned meals, start fresh
          setMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
          setPlannedMeals({ breakfast: [], lunch: [], dinner: [], snacks: [] });
          setSelectedMeal('breakfast');
        }
      }
    } catch (error) {
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
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;

        mealsData[mealType].forEach(food => {
          mealCalories += food.calories || 0;
          mealProtein += food.protein || 0;
          mealCarbs += food.carbs || 0;
          mealFat += food.fat || 0;
        });

        totalCalories += mealCalories;
        totalProtein += mealProtein;
        totalCarbs += mealCarbs;
        totalFat += mealFat;
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
      const userId = user?.uid || 'guest';
      const today = getLocalDateString();

      // Load consumed meals from Firebase
      let loadedMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };

      if (userId && userId !== 'guest') {
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, today);

          // Convert Firebase flat array to UI grouped object
          firebaseMeals.forEach(meal => {
            const mealType = meal.meal_type || 'snacks';
            if (loadedMeals[mealType]) {
              loadedMeals[mealType].push({
                firebaseId: meal.id, // Store Firebase ID for deletes
                name: meal.food_name || 'Unknown',
                brand: meal.food_brand || '',
                quantity: meal.quantity_grams || 100,
                calories: meal.calories_consumed || 0,
                protein: meal.protein_consumed || 0,
                carbs: meal.carbs_consumed || 0,
                fat: meal.fat_consumed || 0,
                created_at: meal.created_at,
              });
            }
          });

          console.log('✅ Loaded meals from Firebase:', firebaseMeals.length);
        } catch (error) {
          console.log('⚠️ Could not load meals from Firebase:', error);
          // Fall back to empty meals
        }
      }

      // Load planned meals and other UI state from AsyncStorage
      let loadedPlannedMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
      let loadedConsumedPlanned = { breakfast: [], lunch: [], dinner: [], snacks: [] };
      let savedSelectedMeal = 'breakfast';

      const saved = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        loadedPlannedMeals = data.plannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
        loadedConsumedPlanned = data.consumedPlannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
        savedSelectedMeal = data.selectedMeal || 'breakfast';

        // MIGRATION: If plannedMeals doesn't exist in saved data, check if current meals came from today's plan
        if (!data.plannedMeals) {
          const todayKey = getLocalDateString();
          const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
          const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};
          const todayPlanned = mealPlans[todayKey]?.planned;

          // If there were planned meals for today that match current meals, move them to planned
          if (todayPlanned && Object.values(todayPlanned).some(meals => meals && meals.length > 0)) {
            loadedPlannedMeals = todayPlanned;
          }
        }
      }

      // Update meals state (consumed will auto-calculate from useMemo)
      setMeals(loadedMeals);
      setPlannedMeals(loadedPlannedMeals);
      setConsumedPlannedMeals(loadedConsumedPlanned);
      setSelectedMeal(savedSelectedMeal);

      // Sync to calendar on load
      await syncMealsToCalendar(loadedMeals);

      setDataLoaded(true); // Mark data as loaded
    } catch (error) {
      console.error('Error loading nutrition:', error);
      setDataLoaded(true); // Mark as loaded even on error
    }
  };

  const saveDailyNutrition = async (newMeals, newSelectedMeal, newPlannedMeals = null, newConsumedPlanned = null) => {
    try {
      // NOTE: Consumed meals are now stored in Firebase, so we don't save them to AsyncStorage
      // We only save plannedMeals, consumedPlannedMeals, and selectedMeal (UI state)

      const safeMeals = newMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
      const safePlannedMeals = newPlannedMeals !== null
        ? (newPlannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] })
        : (plannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
      const safeConsumedPlanned = newConsumedPlanned !== null
        ? (newConsumedPlanned || { breakfast: [], lunch: [], dinner: [], snacks: [] })
        : (consumedPlannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });

      // Only save UI state and planned meals to AsyncStorage
      // Consumed meals are in Firebase now
      const data = {
        plannedMeals: safePlannedMeals,
        consumedPlannedMeals: safeConsumedPlanned,
        selectedMeal: newSelectedMeal || 'breakfast',
        lastUpdated: new Date().toISOString()
      };

      await AsyncStorage.setItem(DAILY_NUTRITION_KEY, JSON.stringify(data));

      // Also sync consumed meals to calendar for history
      await syncMealsToCalendar(safeMeals);
    } catch (error) {
    }
  };

  const syncMealsToCalendar = async (meals) => {
    try {
      // Get today's date key
      const today = getLocalDateString();

      // Load existing meal plans
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Update today's logged meals
      mealPlans[today] = {
        ...mealPlans[today],
        logged: meals
      };

      // Save updated meal plans
      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
    } catch (error) {
    }
  };

  const handleSaveMacros = async (newGoals) => {
    try {
      const userId = user?.uid || 'guest';
      await updateNutritionGoals(userId, {
        calories: newGoals.calories,
        protein: newGoals.proteinGrams,
        carbs: newGoals.carbsGrams,
        fat: newGoals.fatGrams,
      });
      setMacroGoals(newGoals);
    } catch (error) {
      console.error('Error saving macro goals:', error);
      Alert.alert('Error', 'Failed to save nutrition goals');
    }
  };

  const calculateProgress = (consumed, goal) => {
    if (goal === 0) return 0;
    return Math.min(100, Math.round((consumed / goal) * 100));
  };

  const showConsumedBreakdown = () => {
    navigation.navigate('CalorieBreakdown', {
      meals: meals,
      plannedMeals: plannedMeals,
      totalCalories: consumed,
      userId: user?.uid || 'guest'
    });
  };

  const handleDeleteFood = async (mealType, foodIndex) => {
    try {
      const updatedMeals = { ...meals };
      if (updatedMeals[mealType] && updatedMeals[mealType][foodIndex] !== undefined) {
        // Get the food item to delete (to access firebaseId)
        const foodToDelete = updatedMeals[mealType][foodIndex];

        // Delete from Firebase first (if it has a Firebase ID)
        if (user?.uid && user.uid !== 'guest' && foodToDelete.firebaseId) {
          try {
            await MealSyncService.deleteMeal(user.uid, foodToDelete.firebaseId);
            console.log('✅ Meal deleted from Firebase');
          } catch (error) {
            console.log('⚠️ Failed to delete from Firebase:', error);
            // Continue with local delete even if Firebase delete fails
          }
        }

        // Delete from local state
        updatedMeals[mealType].splice(foodIndex, 1);
        setMeals(updatedMeals);

        // Ensure plannedMeals has a default value
        const currentPlannedMeals = plannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] };

        // Save to storage with plannedMeals
        await saveDailyNutrition(updatedMeals, selectedMeal, currentPlannedMeals);

        // Also sync to calendar
        await syncMealsToCalendar(updatedMeals);
      }
    } catch (error) {
    }
  };

  const handleEditFood = async (mealType, foodIndex, updatedFood) => {
    try {
      const updatedMeals = { ...meals };
      if (updatedMeals[mealType] && updatedMeals[mealType][foodIndex] !== undefined) {
        // Get the old food item to access firebaseId
        const oldFood = updatedMeals[mealType][foodIndex];

        // Update in Firebase first (if it has a Firebase ID)
        if (user?.uid && user.uid !== 'guest' && oldFood.firebaseId) {
          try {
            const today = getLocalDateString();
            const firebaseUpdateData = {
              food_name: updatedFood.name || 'Unknown food',
              food_brand: updatedFood.brand || '',
              quantity_grams: updatedFood.quantity || 100,
              calories_consumed: updatedFood.calories || 0,
              protein_consumed: updatedFood.protein || 0,
              carbs_consumed: updatedFood.carbs || 0,
              fat_consumed: updatedFood.fat || 0,
            };
            await MealSyncService.updateMeal(user.uid, oldFood.firebaseId, firebaseUpdateData);
            console.log('✅ Meal updated in Firebase');

            // Preserve firebaseId in updated food
            updatedFood.firebaseId = oldFood.firebaseId;
          } catch (error) {
            console.log('⚠️ Failed to update in Firebase:', error);
            // Continue with local update even if Firebase update fails
          }
        }

        // Update local state
        updatedMeals[mealType][foodIndex] = updatedFood;
        setMeals(updatedMeals);

        // Ensure plannedMeals has a default value
        const currentPlannedMeals = plannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] };

        // Save to storage with plannedMeals
        await saveDailyNutrition(updatedMeals, selectedMeal, currentPlannedMeals);

        // Also sync to calendar
        await syncMealsToCalendar(updatedMeals);
      }
    } catch (error) {
    }
  };

  const clearAllPlannedMeals = async () => {
    try {
      const emptyPlanned = { breakfast: [], lunch: [], dinner: [], snacks: [] };
      setPlannedMeals(emptyPlanned);

      // Save to storage
      await saveDailyNutrition(meals, selectedMeal, emptyPlanned);

      Alert.alert('Success', 'All planned meals have been cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear planned meals');
    }
  };

  const markPlannedAsConsumed = async (mealType, foodIndex) => {
    try {
      const plannedFood = { ...plannedMeals[mealType][foodIndex] };

      // Auto-sync consumed planned meal to Firebase first to get Firebase ID
      if (user?.uid && user.uid !== 'guest') {
        try {
          const today = getLocalDateString();
          const consumptionEntry = {
            date: today,
            meal_type: mealType,
            food_name: plannedFood.name || 'Unknown food',
            food_brand: plannedFood.brand || '',
            quantity_grams: plannedFood.quantity || 100,
            calories_consumed: plannedFood.calories || 0,
            protein_consumed: plannedFood.protein || 0,
            carbs_consumed: plannedFood.carbs || 0,
            fat_consumed: plannedFood.fat || 0,
            created_at: new Date().toISOString(),
          };
          const firebaseId = await MealSyncService.uploadDailyConsumption(user.uid, consumptionEntry);

          // Store Firebase ID with the planned food
          plannedFood.firebaseId = firebaseId;
          console.log('✅ Consumed planned meal synced to Firebase with ID:', firebaseId);
        } catch (error) {
          console.log('⚠️ Failed to sync to Firebase:', error);
          // Continue without firebaseId if sync fails
        }
      }

      // Add to consumed meals
      const updatedMeals = {
        ...meals,
        [mealType]: [...meals[mealType], plannedFood]
      };

      // Remove from planned meals
      const updatedPlannedMeals = { ...plannedMeals };
      updatedPlannedMeals[mealType] = [...plannedMeals[mealType]];
      updatedPlannedMeals[mealType].splice(foodIndex, 1);

      // Add to consumed planned meals history
      const updatedConsumedPlanned = { ...consumedPlannedMeals };
      updatedConsumedPlanned[mealType] = [...consumedPlannedMeals[mealType], plannedFood];

      // Update state
      setMeals(updatedMeals);
      setPlannedMeals(updatedPlannedMeals);
      setConsumedPlannedMeals(updatedConsumedPlanned);

      // Save to storage (now includes consumed planned meals)
      await saveDailyNutrition(updatedMeals, selectedMeal, updatedPlannedMeals, updatedConsumedPlanned);
    } catch (error) {
    }
  };

  const deletePlannedFood = async (mealType, foodIndex) => {
    try {
      const updatedPlannedMeals = { ...plannedMeals };
      updatedPlannedMeals[mealType] = [...plannedMeals[mealType]];
      updatedPlannedMeals[mealType].splice(foodIndex, 1);

      setPlannedMeals(updatedPlannedMeals);

      // Save to storage
      await saveDailyNutrition(meals, selectedMeal, updatedPlannedMeals);
    } catch (error) {
    }
  };

  const proteinProgress = calculateProgress(consumedMacros.proteinGrams, macroGoals.proteinGrams);
  const carbsProgress = calculateProgress(consumedMacros.carbsGrams, macroGoals.carbsGrams);
  const fatProgress = calculateProgress(consumedMacros.fatGrams, macroGoals.fatGrams);
  const calorieDeficit = macroGoals.calories - consumed - burned;

  // Calculate macro breakdown by meal type
  const getMacroBreakdownByMeal = (macroType) => {
    const breakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0
    };

    Object.entries(meals).forEach(([mealType, items]) => {
      items.forEach(food => {
        breakdown[mealType] += food[macroType] || 0;
      });
    });

    return breakdown;
  };

  const proteinBreakdown = getMacroBreakdownByMeal('protein');
  const carbsBreakdown = getMacroBreakdownByMeal('carbs');
  const fatBreakdown = getMacroBreakdownByMeal('fat');

  // Meal type colors for segmented progress bars
  const mealTypeColors = {
    breakfast: '#FF9800', // Orange (same as carbs color)
    lunch: '#2196F3',     // Blue
    dinner: '#9C27B0',    // Purple
    snacks: '#4CAF50'     // Green (same as protein color)
  };

  // Calculate segment widths as percentages of the goal
  const getSegmentWidths = (breakdown, goal) => {
    const segments = [];
    let cumulativePercent = 0;

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
      const amount = breakdown[mealType];
      if (amount > 0) {
        const percent = Math.min((amount / goal) * 100, 100 - cumulativePercent);
        segments.push({
          mealType,
          width: percent,
          left: cumulativePercent
        });
        cumulativePercent += percent;
      }
    });

    return segments;
  };

  const proteinSegments = getSegmentWidths(proteinBreakdown, macroGoals.proteinGrams);
  const carbsSegments = getSegmentWidths(carbsBreakdown, macroGoals.carbsGrams);
  const fatSegments = getSegmentWidths(fatBreakdown, macroGoals.fatGrams);

  // Get current date formatted
  const getCurrentDate = () => {
    const today = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return `📅 ${today.toLocaleDateString('en-US', options)}`;
  };

  return (
    <ScreenLayout
      title="Nutrition"
      subtitle={getCurrentDate()}
      navigation={navigation}
      showBack={!disableBack}  // Disable back when coming from recipe add
      showHome={true}
      screenName="NutritionScreen"
    >
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.tabActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today Tab Content */}
      {activeTab === 'today' && (
        <>
          <StyledCard style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Daily Calories</Text>
          <View style={styles.headerButtons}>
            <AIHeaderButton screenName="NutritionScreen" />
            <TouchableOpacity
              style={styles.editIndicator}
              onPress={() => setShowMacroModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.editIcon}>✏️</Text>
              <Text style={styles.editHint}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{macroGoals.calories}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.statItem, styles.clickableStatItem]}
              onPress={showConsumedBreakdown}
              activeOpacity={0.7}
            >
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statValue}>{consumed}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Burned</Text>
              <Text style={styles.statValue}>{burned}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
          </View>
        <Text style={[styles.deficitText, calorieDeficit > 0 ? styles.deficitPositive : styles.deficitNegative]}>
          {calorieDeficit > 0 ? '🎯 Deficit' : '⚠️ Surplus'}: {Math.round(Math.abs(calorieDeficit))} cal
        </Text>
      </StyledCard>

      {/* Compact Meal Selector and Actions */}
      <View style={styles.foodActionsSection}>
        <View style={styles.mealSelectorRow}>
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
                  // Save the selected meal immediately so it persists across navigation
                  saveDailyNutrition(meals, mealType, plannedMeals);
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

      {/* Planned Meals Status Indicator */}
      {(() => {
        const currentPlannedMeals = plannedMeals[selectedMeal] || [];
        const currentConsumedPlanned = consumedPlannedMeals[selectedMeal] || [];
        const hasMeals = currentPlannedMeals.length > 0;
        const hasConsumedMeals = currentConsumedPlanned.length > 0;
        const totalCals = currentPlannedMeals.reduce((sum, item) => sum + (item.calories || 0), 0);

        return (
          <View style={styles.plannedStatusContainer}>
            <TouchableOpacity
              style={[
                styles.plannedStatusBar,
                hasMeals ? styles.plannedStatusBarActive : (hasConsumedMeals ? styles.plannedStatusBarConsumed : styles.plannedStatusBarEmpty)
              ]}
              onPress={() => {
                if (hasMeals || hasConsumedMeals) {
                  setExpandedMeal(expandedMeal === 'planned' ? null : 'planned');
                }
              }}
            >
              <View style={styles.plannedStatusLeft}>
                <Text style={styles.plannedStatusIcon}>{hasMeals ? '📅' : (hasConsumedMeals ? '✓' : '📅')}</Text>
                <View>
                  <Text style={[
                    styles.plannedStatusText,
                    (!hasMeals && !hasConsumedMeals) && styles.plannedStatusTextMuted
                  ]}>
                    {hasMeals
                      ? `${currentPlannedMeals.length} item${currentPlannedMeals.length !== 1 ? 's' : ''} planned`
                      : (hasConsumedMeals
                          ? `${currentConsumedPlanned.length} consumed (View)`
                          : `No meals planned`)
                    }
                  </Text>
                  {hasMeals && (
                    <Text style={styles.plannedStatusSubtext}>{Math.round(totalCals)} calories</Text>
                  )}
                </View>
              </View>
              {(hasMeals || hasConsumedMeals) && (
                <Text style={styles.plannedStatusArrow}>
                  {expandedMeal === 'planned' ? '▲' : '▼'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Expanded Planned Meals */}
            {expandedMeal === 'planned' && (hasMeals || hasConsumedMeals) && (
              <View style={styles.plannedItemsExpanded}>
                {/* Pending Planned Meals */}
                {hasMeals && (
                  <>
                    <Text style={styles.plannedSectionLabel}>📅 To Be Consumed</Text>
                    {currentPlannedMeals.map((item, index) => (
                      <View key={index} style={styles.plannedItemRow}>
                        <View style={styles.plannedItemInfo}>
                          <Text style={styles.plannedItemName}>{item.name}</Text>
                          <Text style={styles.plannedItemCals}>{item.calories} cal</Text>
                        </View>
                        <View style={styles.plannedItemActions}>
                          <TouchableOpacity
                            style={styles.plannedItemCheckButton}
                            onPress={() => markPlannedAsConsumed(selectedMeal, index)}
                          >
                            <Text style={styles.plannedItemCheckText}>✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.plannedItemDeleteButton}
                            onPress={() => deletePlannedFood(selectedMeal, index)}
                          >
                            <Text style={styles.plannedItemDeleteText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addAllPlannedButton}
                      onPress={() => {
                        currentPlannedMeals.forEach(() => markPlannedAsConsumed(selectedMeal, 0));
                        setExpandedMeal(null);
                      }}
                    >
                      <Text style={styles.addAllPlannedText}>✓ Mark All as Consumed</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Consumed Planned Meals */}
                {hasConsumedMeals && (
                  <>
                    {hasMeals && <View style={styles.plannedDivider} />}
                    <Text style={styles.plannedSectionLabel}>✅ Already Consumed</Text>
                    {currentConsumedPlanned.map((item, index) => (
                      <View key={index} style={styles.consumedPlannedItemRow}>
                        <View style={styles.plannedItemInfo}>
                          <Text style={styles.consumedPlannedItemName}>✓ {item.name}</Text>
                          <Text style={styles.plannedItemCals}>{item.calories} cal</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        );
      })()}

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

      {/* Meal Plans button - wide and horizontal below */}
      <TouchableOpacity
        style={styles.mealPlansButton}
        onPress={() => navigation.navigate('MealPlanTemplates')}
      >
        <Text style={styles.mealPlansIcon}>📋</Text>
        <Text style={styles.mealPlansText}>Meal Plan Templates</Text>
      </TouchableOpacity>

      {/* Planned Meals Section */}
      {Object.values(plannedMeals).some(meals => meals.length > 0) && (
        <View style={styles.plannedSection}>
          <View style={styles.plannedHeader}>
            <Text style={styles.plannedTitle}>📅 Planned for Today</Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                Alert.alert(
                  'Clear All Planned Meals',
                  'Are you sure you want to clear all planned meals for today?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearAllPlannedMeals }
                  ]
                );
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.plannedSubtitle}>
            These meals are planned but not yet consumed. Mark them as eaten throughout the day.
          </Text>

          {Object.entries(plannedMeals).map(([mealType, items]) => (
            items.length > 0 && (
              <View key={mealType} style={styles.plannedMealSection}>
                <Text style={styles.plannedMealType}>
                  {mealType === 'breakfast' && '🌅 Breakfast'}
                  {mealType === 'lunch' && '☀️ Lunch'}
                  {mealType === 'dinner' && '🌙 Dinner'}
                  {mealType === 'snacks' && '🍿 Snacks'}
                </Text>
                {items.map((item, index) => (
                  <View key={index} style={styles.plannedFoodItem}>
                    <View style={styles.plannedFoodInfo}>
                      <Text style={styles.plannedFoodName}>{item.name}</Text>
                      <Text style={styles.plannedFoodCalories}>{item.calories} cal</Text>
                    </View>
                    <View style={styles.plannedFoodActions}>
                      <TouchableOpacity
                        style={styles.checkButton}
                        onPress={() => markPlannedAsConsumed(mealType, index)}
                      >
                        <Text style={styles.checkButtonText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deletePlannedButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Planned Food',
                            `Remove ${item.name} from planned meals?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => deletePlannedFood(mealType, index) }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.deletePlannedButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )
          ))}
        </View>
      )}

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

          {/* Compact Progress Bars with Meal Type Segments */}
          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.proteinColor]}>P</Text>
            <View style={styles.progressBarContainer}>
              {proteinSegments.map((segment, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBarSegment,
                    {
                      width: `${segment.width}%`,
                      left: `${segment.left}%`,
                      backgroundColor: mealTypeColors[segment.mealType]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.macroValue, styles.proteinColor]}>
              {parseFloat(consumedMacros.proteinGrams).toFixed(1)}/{macroGoals.proteinGrams}
            </Text>
          </View>

          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.carbsColor]}>C</Text>
            <View style={styles.progressBarContainer}>
              {carbsSegments.map((segment, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBarSegment,
                    {
                      width: `${segment.width}%`,
                      left: `${segment.left}%`,
                      backgroundColor: mealTypeColors[segment.mealType]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.macroValue, styles.carbsColor]}>
              {parseFloat(consumedMacros.carbsGrams).toFixed(1)}/{macroGoals.carbsGrams}
            </Text>
          </View>

          <View style={styles.macroProgressRow}>
            <Text style={[styles.macroLabel, styles.fatColor]}>F</Text>
            <View style={styles.progressBarContainer}>
              {fatSegments.map((segment, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBarSegment,
                    {
                      width: `${segment.width}%`,
                      left: `${segment.left}%`,
                      backgroundColor: mealTypeColors[segment.mealType]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.macroValue, styles.fatColor]}>
              {parseFloat(consumedMacros.fatGrams).toFixed(1)}/{macroGoals.fatGrams}
            </Text>
          </View>

          {/* Legend for meal types */}
          <View style={styles.mealLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mealTypeColors.breakfast }]} />
              <Text style={styles.legendText}>Breakfast</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mealTypeColors.lunch }]} />
              <Text style={styles.legendText}>Lunch</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mealTypeColors.dinner }]} />
              <Text style={styles.legendText}>Dinner</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mealTypeColors.snacks }]} />
              <Text style={styles.legendText}>Snacks</Text>
            </View>
          </View>
        </StyledCard>

        {/* Today's Logged Meals Section */}
        <StyledCard style={styles.loggedMealsCard}>
          <Text style={styles.loggedMealsTitle}>📋 Today's Logged Meals</Text>
          {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
            const items = meals[mealType] || [];
            if (items.length === 0) return null;

            const mealTotal = items.reduce((sum, item) => sum + (item.calories || 0), 0);
            const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
            const mealIcon = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' }[mealType];

            return (
              <View key={mealType} style={styles.loggedMealSection}>
                <View style={styles.loggedMealHeader}>
                  <Text style={styles.loggedMealTitle}>{mealIcon} {mealName}</Text>
                  <Text style={styles.loggedMealTotal}>{mealTotal} cal</Text>
                </View>
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
                    <View key={index} style={styles.loggedFoodItem}>
                      <View style={styles.loggedFoodInfo}>
                        <View style={styles.loggedFoodNameRow}>
                          <Text style={styles.loggedFoodName}>{food.name}</Text>
                          {food.created_at && (
                            <Text style={styles.loggedFoodTime}>{formatTime(food.created_at)}</Text>
                          )}
                        </View>
                        <View style={styles.loggedFoodMacros}>
                          <Text style={styles.loggedFoodCal}>{food.calories || 0} cal</Text>
                          {food.protein ? <Text style={styles.loggedFoodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                          {food.carbs ? <Text style={styles.loggedFoodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                          {food.fat ? <Text style={styles.loggedFoodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
          {Object.values(meals).every(items => items.length === 0) && (
            <Text style={styles.loggedMealsEmpty}>No meals logged yet today</Text>
          )}
        </StyledCard>
        </>
      )}

      {/* Calendar Tab Content - Shows both history AND planning */}
      {activeTab === 'calendar' && (
        <MealHistoryTabs
          navigation={navigation}
          route={route}
          activeHistoryTab="all"
        />
      )}

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '25',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  editIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  editHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  clickableStatItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  macroGoalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  macroGoalCompact: {
    flex: 1,
    alignItems: 'center',
  },
  macroGoalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  macroGoalLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroGoalDivider: {
    width: 1,
    height: 35,
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
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressBarSegment: {
    position: 'absolute',
    height: '100%',
    opacity: 0.9,
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
  mealLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
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
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  scanButton: {
    backgroundColor: '#1a1a1a',
    borderColor: Colors.primary,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flex: 1.5,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
  },
  recipesButton: {
    backgroundColor: '#1a1a1a',
    borderColor: Colors.primary,
  },
  actionButtonIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greenText: {
    color: Colors.primary,
  },
  blackText: {
    color: '#000',
  },
  orangeText: {
    color: '#FF9800',
  },
  mealPlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF980025',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mealPlansIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  mealPlansText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: '#FF9800',
    letterSpacing: 0.5,
  },
  progressChartsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '25',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressChartsIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  progressChartsText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  // Planned Status Indicator styles
  plannedStatusContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  plannedStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  plannedStatusBarActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  plannedStatusBarEmpty: {
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  plannedStatusBarConsumed: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}10`,
    opacity: 0.9,
  },
  plannedStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  plannedStatusIcon: {
    fontSize: 20,
  },
  plannedStatusText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  plannedStatusTextMuted: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  plannedStatusSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plannedStatusArrow: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  plannedItemsExpanded: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  plannedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  plannedItemInfo: {
    flex: 1,
  },
  plannedItemName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  plannedItemCals: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plannedItemActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  plannedItemCheckButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannedItemCheckText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  plannedItemDeleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannedItemDeleteText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  addAllPlannedButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addAllPlannedText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  plannedSectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  plannedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  consumedPlannedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
    opacity: 0.7,
  },
  consumedPlannedItemName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: '500',
    textDecorationLine: 'line-through',
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
    gap: Spacing.sm,
  },
  addingToText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 0,
  },
  mealDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    minHeight: 56,
  },
  selectedMealText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    numberOfLines: 1,
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
    width: 50,
    height: 56,
    flexShrink: 0,
  },
  historyIcon: {
    fontSize: 28,
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
  plannedSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.warning + '60',
  },
  plannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  plannedTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.warning,
    flex: 1,
  },
  clearAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  clearAllText: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '600',
  },
  plannedSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  plannedMealSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  plannedMealType: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  plannedFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  plannedFoodInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  plannedFoodName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  plannedFoodCalories: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plannedFoodActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  checkButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  deletePlannedButton: {
    backgroundColor: Colors.error + '20',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  deletePlannedButtonText: {
    color: Colors.error,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  // Placeholder Tab Styles
  placeholderTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  placeholderText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  // Today's Logged Meals Styles
  loggedMealsCard: {
    padding: Spacing.md,
  },
  loggedMealsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  loggedMealSection: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  loggedMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loggedMealTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  loggedMealTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  loggedFoodItem: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  loggedFoodInfo: {
    flex: 1,
  },
  loggedFoodNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  loggedFoodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  loggedFoodTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  loggedFoodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  loggedFoodCal: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  loggedFoodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  loggedMealsEmpty: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});