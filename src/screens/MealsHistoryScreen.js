import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MEAL_PLANS_KEY = '@meal_plans';
const DAILY_NUTRITION_KEY = '@daily_nutrition';

export default function MealsHistoryScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('meals'); // Start on Today tab by default
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealData, setMealData] = useState({});
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDate, setCopySourceDate] = useState(null);
  const [selectedFutureDates, setSelectedFutureDates] = useState([]);
  const [selectedMealTypeForAdd, setSelectedMealTypeForAdd] = useState('breakfast');
  const [todayMeals, setTodayMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  
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
      console.error('Error adding test data:', error);
    }
  };

  const loadMealData = async () => {
    try {
      // Load today's meals from daily nutrition
      const savedNutrition = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (savedNutrition) {
        const data = JSON.parse(savedNutrition);
        setTodayMeals(data.meals || {});
      }

      // Load meal plans
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setMealData(plans);
      }
    } catch (error) {
      console.error('Error loading meal data:', error);
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
    const todayKey = new Date().toISOString().split('T')[0];

    // If it's today, use todayMeals state
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

  const copyMealsToDate = async (sourceDate, targetDate) => {
    try {
      const sourceDateKey = sourceDate.toISOString().split('T')[0];
      const targetDateKey = targetDate.toISOString().split('T')[0];

      // Get source meals
      let sourceMeals = null;
      if (sourceDateKey === new Date().toISOString().split('T')[0]) {
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

      alert(`Meals copied successfully to ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    } catch (error) {
      console.error('Error copying meals:', error);
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
      if (sourceDateKey === new Date().toISOString().split('T')[0]) {
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

      alert(`Meals copied successfully to ${targetDates.length} day${targetDates.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error copying meals:', error);
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
      console.error('Error deleting planned meal type:', error);
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
      console.error('Error deleting planned food item:', error);
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
      console.error('Error editing planned food item:', error);
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
      console.error('Error adding food to planned date:', error);
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
    return new Date().toISOString().split('T')[0];
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

  return (
    <ScreenLayout
      title="Meal Planner & History"
      subtitle="Plan and track your nutrition"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={true}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
          onPress={() => setActiveTab('meals')}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'meals' ? (
        <View>
          {Object.entries(todayMeals).flatMap(([mealType, items]) =>
            items.map((item, index) => (
              <StyledCard key={`${mealType}-${index}`} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={styles.mealType}>{mealType}</Text>
                    <Text style={styles.mealName}>{item.name}</Text>
                  </View>
                  <View style={styles.mealDetails}>
                    <Text style={styles.mealCalories}>{item.calories} cal</Text>
                  </View>
                </View>
              </StyledCard>
            ))
          )}

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
        <View style={styles.calendarTab}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            mealData={mealData}
          />

          <View style={styles.calendarInfo}>
            <Text style={styles.infoTitle}>📅 How to Use</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoText}>• Tap any date to view details</Text>
              <Text style={styles.infoText}>• Green dots = Logged meals</Text>
              <Text style={styles.infoText}>• Orange dots = Planned meals</Text>
              <Text style={styles.infoText}>• Copy past meals to plan future days</Text>
              <Text style={styles.infoText}>• Planned meals auto-load on their date</Text>
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

                {Object.values(getSelectedDateMeals()).every(meals => meals.length === 0) && (
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
    </ScreenLayout>
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
});