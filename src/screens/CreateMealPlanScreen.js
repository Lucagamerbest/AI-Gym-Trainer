import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MEAL_PLAN_TEMPLATES_KEY = '@meal_plan_templates';
const MEAL_PLANS_KEY = '@meal_plans';
const RECIPES_KEY = '@saved_recipes';

export default function CreateMealPlanScreen({ navigation, route }) {
  const { template, editMode, modalShown, screenId } = route.params || {};

  // Log screen ID on mount
  useEffect(() => {
    return () => {
    };
  }, []);

  const [planName, setPlanName] = useState(template?.name || '');
  const [planDescription, setPlanDescription] = useState(template?.description || '');
  const [numDays, setNumDays] = useState(template?.days.length || 1);
  const [days, setDays] = useState(template?.days || []);
  const [currentDayIndex, setCurrentDayIndex] = useState(null);
  const [showMealSourceModal, setShowMealSourceModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [showPastFoodsModal, setShowPastFoodsModal] = useState(false);
  const [pastFoods, setPastFoods] = useState([]);
  const [selectedPastFoods, setSelectedPastFoods] = useState([]);
  const processedParams = useRef({});
  const dayCountConfirmed = useRef(false); // Track if user has confirmed day count

  // Only show modal if: editing template OR modal already shown OR days already configured
  const [showDayCountModal, setShowDayCountModal] = useState(() => {
    // If editing existing template, don't show modal
    if (template) return false;

    // If modal was already shown (from params), don't show again
    if (modalShown) return false;

    // Show modal only for brand new template creation
    return true;
  });

  // Initialize days when numDays changes (only after user confirms)
  useEffect(() => {
    if (!template && days.length === 0 && dayCountConfirmed.current) {
      const initialDays = Array.from({ length: numDays }, (_, i) => ({
        name: `Day ${i + 1}`,
        meals: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        }
      }));
      setDays(initialDays);
    }
  }, [numDays, dayCountConfirmed.current]);

  // Handle incoming food data from Recipes/FoodSearch
  useFocusEffect(
    React.useCallback(() => {

      // Reset processed params when screen is focused
      processedParams.current = {};

      // Handle added food from RecipesScreen or FoodSearchScreen
      if (route.params?.addedFood && !processedParams.current.addedFood) {
        processedParams.current.addedFood = true;
        const { addedFood } = route.params;

        // Get the context from params (set when navigating to Recipes/FoodSearch)
        const dayIndex = route.params?.templateDayIndex ?? currentDayIndex;
        const mealType = route.params?.templateMealType ?? selectedMealType;

        if (dayIndex !== null && mealType && days[dayIndex]) {
          const updatedDays = [...days];
          updatedDays[dayIndex].meals[mealType].push(addedFood);
          setDays(updatedDays);

          // Clear the params
          navigation.setParams({ addedFood: undefined });
        }
      }
    }, [route.params, days, currentDayIndex, selectedMealType, screenId])
  );

  const handleSetDayCount = () => {
    if (numDays < 1 || numDays > 7) {
      Alert.alert('Error', 'Please choose between 1 and 7 days');
      return;
    }

    // Mark that user has confirmed day count
    dayCountConfirmed.current = true;

    // Mark modal as shown in route params so it persists across navigation
    navigation.setParams({ modalShown: true });

    const initialDays = Array.from({ length: numDays }, (_, i) => ({
      name: `Day ${i + 1}`,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      }
    }));
    setDays(initialDays);
    setShowDayCountModal(false);
  };

  const calculateDayNutrition = (day) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(day.meals).forEach(mealArray => {
      mealArray.forEach(food => {
        totals.calories += food.calories || 0;
        totals.protein += food.protein || 0;
        totals.carbs += food.carbs || 0;
        totals.fat += food.fat || 0;
      });
    });
    return totals;
  };

  const handleAddMealsToDay = (dayIndex, mealType) => {
    setCurrentDayIndex(dayIndex);
    setSelectedMealType(mealType);
    setShowMealSourceModal(true);
  };

  const handleCopyFromPastMonth = async () => {
    const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);

    if (!savedPlans) {
      Alert.alert('No Data', 'No past meal data found');
      setShowMealSourceModal(false);
      return;
    }

    const mealPlans = JSON.parse(savedPlans);

    // Get dates from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allFoods = [];

    // Collect all foods from the last 30 days
    Object.keys(mealPlans).forEach(dateKey => {
      const date = new Date(dateKey);
      if (date >= thirtyDaysAgo && mealPlans[dateKey]?.logged) {
        const meals = mealPlans[dateKey].logged;
        // Get all meals from all meal types
        Object.values(meals).forEach(mealArray => {
          if (Array.isArray(mealArray)) {
            allFoods.push(...mealArray);
          }
        });
      }
    });

    if (allFoods.length === 0) {
      Alert.alert('No Data', 'No meals found in the past month');
      setShowMealSourceModal(false);
      return;
    }

    // Remove duplicates based on food name and isRecipe flag
    const uniqueFoodsMap = new Map();
    allFoods.forEach(food => {
      const key = `${food.name}_${food.isRecipe ? 'recipe' : 'food'}`;
      if (!uniqueFoodsMap.has(key)) {
        uniqueFoodsMap.set(key, food);
      }
    });

    const uniqueFoods = Array.from(uniqueFoodsMap.values());

    // Sort: recipes first, then alphabetically
    uniqueFoods.sort((a, b) => {
      if (a.isRecipe && !b.isRecipe) return -1;
      if (!a.isRecipe && b.isRecipe) return 1;
      return a.name.localeCompare(b.name);
    });

    setPastFoods(uniqueFoods);
    setSelectedPastFoods([]);
    setShowMealSourceModal(false);
    setShowPastFoodsModal(true);
  };

  const toggleFoodSelection = (food) => {
    const foodKey = `${food.name}_${food.isRecipe ? 'recipe' : 'food'}`;
    const isSelected = selectedPastFoods.some(f =>
      `${f.name}_${f.isRecipe ? 'recipe' : 'food'}` === foodKey
    );

    if (isSelected) {
      setSelectedPastFoods(selectedPastFoods.filter(f =>
        `${f.name}_${f.isRecipe ? 'recipe' : 'food'}` !== foodKey
      ));
    } else {
      setSelectedPastFoods([...selectedPastFoods, food]);
    }
  };

  const handleAddSelectedFoods = () => {
    if (selectedPastFoods.length === 0) {
      Alert.alert('No Selection', 'Please select at least one item to add');
      return;
    }

    const updatedDays = [...days];
    updatedDays[currentDayIndex].meals[selectedMealType] = [
      ...updatedDays[currentDayIndex].meals[selectedMealType],
      ...selectedPastFoods
    ];

    setDays(updatedDays);
    setShowPastFoodsModal(false);
    setSelectedPastFoods([]);

    Alert.alert('Success', `Added ${selectedPastFoods.length} item${selectedPastFoods.length !== 1 ? 's' : ''} to ${selectedMealType}`);
  };

  const handleAddFromRecipes = () => {
    setShowMealSourceModal(false);
    // Navigate to recipes screen with template context
    navigation.navigate('Recipes', {
      mealType: selectedMealType,
      templateDayIndex: currentDayIndex,
      templateMealType: selectedMealType,
      fromMealPlanTemplate: true, // Flag to indicate we're building a template
      screenId: screenId, // Pass screen ID for tracking
    });
  };

  const handleSearchFood = () => {
    setShowMealSourceModal(false);
    // Navigate to food search with template context
    navigation.navigate('FoodSearch', {
      mealType: selectedMealType,
      templateDayIndex: currentDayIndex,
      templateMealType: selectedMealType,
      fromMealPlanTemplate: true, // Flag to indicate we're building a template
      screenId: screenId, // Pass screen ID for tracking
    });
  };

  const handleRemoveFood = (dayIndex, mealType, foodIndex) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].meals[mealType].splice(foodIndex, 1);
    setDays(updatedDays);
  };

  const handleDeleteDay = (dayIndex) => {
    if (days.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one day in your meal plan');
      return;
    }

    Alert.alert(
      'Delete Day',
      `Are you sure you want to delete ${days[dayIndex].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedDays = days.filter((_, index) => index !== dayIndex);
            // Rename remaining days
            const renamedDays = updatedDays.map((day, index) => ({
              ...day,
              name: `Day ${index + 1}`
            }));
            setDays(renamedDays);
            setNumDays(renamedDays.length);
          }
        }
      ]
    );
  };

  const handleAddDay = () => {
    if (days.length >= 7) {
      Alert.alert('Maximum Days', 'You can have a maximum of 7 days in your meal plan');
      return;
    }

    const newDay = {
      name: `Day ${days.length + 1}`,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      }
    };

    const updatedDays = [...days, newDay];
    setDays(updatedDays);
    setNumDays(updatedDays.length);
  };

  const handleSaveTemplate = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }

    if (days.length === 0) {
      Alert.alert('Error', 'Please set up at least one day');
      return;
    }

    const hasAnyMeals = days.some(day =>
      Object.values(day.meals).some(meals => meals.length > 0)
    );

    if (!hasAnyMeals) {
      Alert.alert('Error', 'Please add at least one meal to your plan');
      return;
    }

    try {
      const saved = await AsyncStorage.getItem(MEAL_PLAN_TEMPLATES_KEY);
      const templates = saved ? JSON.parse(saved) : [];

      const templateData = {
        id: editMode ? template.id : Date.now().toString(),
        name: planName.trim(),
        description: planDescription.trim(),
        days: days,
        createdAt: editMode ? template.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedTemplates;
      if (editMode) {
        updatedTemplates = templates.map(t => t.id === template.id ? templateData : t);
      } else {
        updatedTemplates = [...templates, templateData];
      }

      await AsyncStorage.setItem(MEAL_PLAN_TEMPLATES_KEY, JSON.stringify(updatedTemplates));

      Alert.alert('Success', `Meal plan template ${editMode ? 'updated' : 'created'} successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save meal plan template');
    }
  };

  return (
    <ScreenLayout
      title={editMode ? 'Edit Meal Plan' : 'Create Meal Plan'}
      subtitle={editMode ? 'Update your template' : 'Build your template'}
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      {/* Name and Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Plan Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Clean Bulk Week, Keto 5-Day"
          placeholderTextColor={Colors.textSecondary}
          value={planName}
          onChangeText={setPlanName}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your meal plan..."
          placeholderTextColor={Colors.textSecondary}
          value={planDescription}
          onChangeText={setPlanDescription}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Days */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Days ({days.length})</Text>
          <View style={styles.dayActions}>
            {!editMode && days.length === 0 && (
              <TouchableOpacity
                style={styles.changeDaysButton}
                onPress={() => setShowDayCountModal(true)}
              >
                <Text style={styles.changeDaysText}>Set Days</Text>
              </TouchableOpacity>
            )}
            {days.length > 0 && days.length < 7 && (
              <TouchableOpacity
                style={styles.addDayButton}
                onPress={handleAddDay}
              >
                <Text style={styles.addDayButtonText}>+ Add Day</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {days.map((day, dayIndex) => {
          const nutrition = calculateDayNutrition(day);
          const totalMeals = Object.values(day.meals).reduce((sum, meals) => sum + meals.length, 0);

          return (
            <View key={dayIndex} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayTitleRow}>
                  <Text style={styles.dayTitle}>{day.name}</Text>
                  {days.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteDayButton}
                      onPress={() => handleDeleteDay(dayIndex)}
                    >
                      <Text style={styles.deleteDayText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.dayStats}>
                  <Text style={styles.dayStat}>{totalMeals} items</Text>
                  <Text style={styles.dayStat}>{nutrition.calories} cal</Text>
                </View>
              </View>

              {/* Meal Types */}
              {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => (
                <View key={mealType} style={styles.mealTypeSection}>
                  <View style={styles.mealTypeHeader}>
                    <Text style={styles.mealTypeName}>
                      {mealType === 'breakfast' && '🌅 '}
                      {mealType === 'lunch' && '☀️ '}
                      {mealType === 'dinner' && '🌙 '}
                      {mealType === 'snacks' && '🍿 '}
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                    <TouchableOpacity
                      style={styles.addMealButton}
                      onPress={() => handleAddMealsToDay(dayIndex, mealType)}
                    >
                      <Text style={styles.addMealText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {day.meals[mealType].map((food, foodIndex) => (
                    <View key={foodIndex} style={styles.foodItem}>
                      <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodCals}>{food.calories} cal</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveFood(dayIndex, mealType, foodIndex)}
                        style={styles.removeFoodButton}
                      >
                        <Text style={styles.removeFoodText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Save Button */}
      <StyledButton
        title={editMode ? 'Update Template' : 'Save Template'}
        onPress={handleSaveTemplate}
        style={styles.saveButton}
      />

      {/* Day Count Modal */}
      <Modal
        visible={showDayCountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !editMode && setShowDayCountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How many days?</Text>
            <Text style={styles.modalSubtitle}>Create a 1-7 day meal plan template</Text>

            <View style={styles.dayButtons}>
              {[1, 2, 3, 4, 5, 6, 7].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.dayButton,
                    numDays === num && styles.dayButtonActive
                  ]}
                  onPress={() => setNumDays(num)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    numDays === num && styles.dayButtonTextActive
                  ]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleSetDayCount}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Meal Source Modal */}
      <Modal
        visible={showMealSourceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMealSourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Meals</Text>
            <Text style={styles.modalSubtitle}>Choose a source for {selectedMealType}</Text>

            <TouchableOpacity
              style={styles.sourceOption}
              onPress={handleAddFromRecipes}
            >
              <Text style={styles.sourceIcon}>📖</Text>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>From Recipes</Text>
                <Text style={styles.sourceDesc}>Add saved recipes</Text>
              </View>
              <Text style={styles.sourceArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceOption}
              onPress={handleSearchFood}
            >
              <Text style={styles.sourceIcon}>🔍</Text>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>Search Food</Text>
                <Text style={styles.sourceDesc}>Find specific foods</Text>
              </View>
              <Text style={styles.sourceArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceOption}
              onPress={handleCopyFromPastMonth}
            >
              <Text style={styles.sourceIcon}>📅</Text>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>Past Month Foods</Text>
                <Text style={styles.sourceDesc}>Select from recent meals</Text>
              </View>
              <Text style={styles.sourceArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMealSourceModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Past Foods Selection Modal */}
      <Modal
        visible={showPastFoodsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPastFoodsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pastFoodsModalContent}>
            <Text style={styles.modalTitle}>Past Month Foods</Text>
            <Text style={styles.modalSubtitle}>
              Select items to add to {selectedMealType} • {pastFoods.length} items
            </Text>

            {selectedPastFoods.length > 0 && (
              <View style={styles.selectionCounter}>
                <Text style={styles.selectionCounterText}>
                  {selectedPastFoods.length} selected
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.pastFoodsList}
              contentContainerStyle={styles.pastFoodsListContent}
              showsVerticalScrollIndicator={true}
            >
              {pastFoods.map((food, index) => {
                const foodKey = `${food.name}_${food.isRecipe ? 'recipe' : 'food'}`;
                const isSelected = selectedPastFoods.some(f =>
                  `${f.name}_${f.isRecipe ? 'recipe' : 'food'}` === foodKey
                );

                return (
                  <TouchableOpacity
                    key={foodKey}
                    style={[
                      styles.pastFoodCard,
                      isSelected && styles.pastFoodCardSelected
                    ]}
                    onPress={() => toggleFoodSelection(food)}
                  >
                    <View style={styles.pastFoodHeader}>
                      <View style={styles.pastFoodTitleRow}>
                        <Text style={styles.pastFoodName} numberOfLines={1}>
                          {food.isRecipe && '📖 '}
                          {food.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.pastFoodMacros}>
                        <Text style={styles.pastFoodCalories}>
                          {food.calories} cal
                        </Text>
                        <Text style={styles.pastFoodMacro}>P: {food.protein}g</Text>
                        <Text style={styles.pastFoodMacro}>C: {food.carbs}g</Text>
                        <Text style={styles.pastFoodMacro}>F: {food.fat}g</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.confirmButton, selectedPastFoods.length === 0 && styles.confirmButtonDisabled]}
                onPress={handleAddSelectedFoods}
                disabled={selectedPastFoods.length === 0}
              >
                <Text style={styles.confirmButtonText}>
                  Add {selectedPastFoods.length > 0 ? `(${selectedPastFoods.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPastFoodsModal(false);
                  setSelectedPastFoods([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  changeDaysButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  changeDaysText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  addDayButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addDayButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dayTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  deleteDayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  deleteDayText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  dayStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dayStat: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  mealTypeSection: {
    marginBottom: Spacing.md,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealTypeName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  addMealButton: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  foodCals: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  removeFoodButton: {
    padding: Spacing.xs,
  },
  removeFoodText: {
    fontSize: 20,
    color: Colors.error,
  },
  saveButton: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  dayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  dayButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayButtonTextActive: {
    color: Colors.background,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  sourceDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  sourceArrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // Past Foods Modal styles
  pastFoodsModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
    height: '80%',
  },
  selectionCounter: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  selectionCounterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.background,
  },
  pastFoodsList: {
    flex: 1,
    width: '100%',
  },
  pastFoodsListContent: {
    paddingBottom: Spacing.md,
  },
  pastFoodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  pastFoodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  pastFoodHeader: {
    width: '100%',
  },
  pastFoodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  pastFoodName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkmarkText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  pastFoodMacros: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  pastFoodCalories: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  pastFoodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  modalActions: {
    gap: Spacing.sm,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
});
