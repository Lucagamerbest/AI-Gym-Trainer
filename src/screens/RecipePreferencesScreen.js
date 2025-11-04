import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getFoodPreferences, updateFoodPreferences } from '../services/userProfileService';
import { SAMPLE_MEALS, MEAL_CATEGORIES, getAllMeals } from '../constants/sampleMeals';

export default function RecipePreferencesScreen({ navigation }) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Meal-specific macro targets
  const [breakfastTargets, setBreakfastTargets] = useState({ calories: 400, protein: 25, carbs: 45, fat: 12 });
  const [lunchTargets, setLunchTargets] = useState({ calories: 600, protein: 40, carbs: 60, fat: 18 });
  const [dinnerTargets, setDinnerTargets] = useState({ calories: 700, protein: 50, carbs: 65, fat: 22 });
  const [snackTargets, setSnackTargets] = useState({ calories: 200, protein: 15, carbs: 20, fat: 8 });

  // Recipe preferences
  const [maxCookingTime, setMaxCookingTime] = useState(30);
  const [maxPrepTime, setMaxPrepTime] = useState(15);
  const [cleanupEffort, setCleanupEffort] = useState('minimal');
  const [recipeComplexity, setRecipeComplexity] = useState('simple');
  const [servingSize, setServingSize] = useState(1);

  // Favorite meal styles
  const [favoriteMealStyles, setFavoriteMealStyles] = useState([]);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const userId = user?.uid || 'guest';
      const prefs = await getFoodPreferences(userId);

      if (prefs.mealPreferences) {
        setBreakfastTargets(prefs.mealPreferences.breakfast);
        setLunchTargets(prefs.mealPreferences.lunch);
        setDinnerTargets(prefs.mealPreferences.dinner);
        setSnackTargets(prefs.mealPreferences.snack);
      }

      if (prefs.recipePreferences) {
        setMaxCookingTime(prefs.recipePreferences.maxCookingTime);
        setMaxPrepTime(prefs.recipePreferences.maxPrepTime);
        setCleanupEffort(prefs.recipePreferences.cleanupEffort);
        setRecipeComplexity(prefs.recipePreferences.recipeComplexity);
        setServingSize(prefs.recipePreferences.servingSize);
      }

      setFavoriteMealStyles(prefs.favoriteMealStyles || []);
    } catch (error) {
      console.error('Error loading recipe preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const userId = user?.uid || 'guest';

      // Get current food preferences
      const currentPrefs = await getFoodPreferences(userId);

      // Update with new recipe preferences
      const updatedPrefs = {
        ...currentPrefs,
        mealPreferences: {
          breakfast: breakfastTargets,
          lunch: lunchTargets,
          dinner: dinnerTargets,
          snack: snackTargets,
        },
        recipePreferences: {
          maxCookingTime,
          maxPrepTime,
          cleanupEffort,
          recipeComplexity,
          servingSize,
        },
        favoriteMealStyles,
      };

      const result = await updateFoodPreferences(userId, updatedPrefs);

      if (result.success) {
        Alert.alert('Success', 'Recipe preferences saved! The AI will now generate recipes based on your preferences.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMealStyle = (mealId) => {
    if (favoriteMealStyles.includes(mealId)) {
      setFavoriteMealStyles(favoriteMealStyles.filter(id => id !== mealId));
    } else {
      setFavoriteMealStyles([...favoriteMealStyles, mealId]);
    }
  };

  const renderMacroSliders = (label, targets, setTargets) => (
    <StyledCard variant="elevated" style={styles.mealCard}>
      <Text style={styles.mealTitle}>{label}</Text>

      {/* Calories */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Calories: {targets.calories} kcal</Text>
        <Slider
          style={styles.slider}
          minimumValue={200}
          maximumValue={1000}
          step={50}
          value={targets.calories}
          onValueChange={(val) => setTargets({ ...targets, calories: val })}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
        />
      </View>

      {/* Protein */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Protein: {targets.protein}g</Text>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={80}
          step={5}
          value={targets.protein}
          onValueChange={(val) => setTargets({ ...targets, protein: val })}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
        />
      </View>

      {/* Carbs */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Carbs: {targets.carbs}g</Text>
        <Slider
          style={styles.slider}
          minimumValue={20}
          maximumValue={120}
          step={5}
          value={targets.carbs}
          onValueChange={(val) => setTargets({ ...targets, carbs: val })}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
        />
      </View>

      {/* Fat */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Fat: {targets.fat}g</Text>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={50}
          step={2}
          value={targets.fat}
          onValueChange={(val) => setTargets({ ...targets, fat: val })}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
        />
      </View>
    </StyledCard>
  );

  return (
    <ScreenLayout
      title="Recipe Preferences"
      subtitle="Customize AI recipe generation"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Section Header */}
        <Text style={styles.sectionHeader}>Meal Macro Targets</Text>
        <Text style={styles.sectionDescription}>
          Set default calorie and macro targets for each meal type. The AI will use these when generating recipes.
        </Text>

        {/* Breakfast */}
        {renderMacroSliders('🍳 Breakfast Targets', breakfastTargets, setBreakfastTargets)}

        {/* Lunch */}
        {renderMacroSliders('🥗 Lunch Targets', lunchTargets, setLunchTargets)}

        {/* Dinner */}
        {renderMacroSliders('🍽️ Dinner Targets', dinnerTargets, setDinnerTargets)}

        {/* Snack */}
        {renderMacroSliders('🍎 Snack Targets', snackTargets, setSnackTargets)}

        {/* Recipe Complexity Section */}
        <Text style={styles.sectionHeader}>Recipe Complexity</Text>
        <Text style={styles.sectionDescription}>
          Tell the AI how much time you want to spend cooking and cleaning up.
        </Text>

        <StyledCard variant="elevated" style={styles.complexityCard}>
          {/* Max Cooking Time */}
          <Text style={styles.complexityLabel}>Max Cooking Time</Text>
          <View style={styles.optionsRow}>
            {[15, 30, 45, 60].map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.optionButton, maxCookingTime === time && styles.optionButtonActive]}
                onPress={() => setMaxCookingTime(time)}
              >
                <Text style={[styles.optionText, maxCookingTime === time && styles.optionTextActive]}>
                  {time} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max Prep Time */}
          <Text style={[styles.complexityLabel, { marginTop: Spacing.lg }]}>Max Prep Time</Text>
          <View style={styles.optionsRow}>
            {[5, 10, 15, 20, 30].map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.optionButton, maxPrepTime === time && styles.optionButtonActive]}
                onPress={() => setMaxPrepTime(time)}
              >
                <Text style={[styles.optionText, maxPrepTime === time && styles.optionTextActive]}>
                  {time} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cleanup Effort */}
          <Text style={[styles.complexityLabel, { marginTop: Spacing.lg }]}>Cleanup Effort</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'minimal', label: 'Minimal' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'extensive', label: 'Extensive' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, cleanupEffort === option.value && styles.optionButtonActive]}
                onPress={() => setCleanupEffort(option.value)}
              >
                <Text style={[styles.optionText, cleanupEffort === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recipe Complexity */}
          <Text style={[styles.complexityLabel, { marginTop: Spacing.lg }]}>Recipe Complexity</Text>
          <View style={styles.optionsRow}>
            {[
              { value: 'simple', label: 'Simple' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'complex', label: 'Complex' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionButton, recipeComplexity === option.value && styles.optionButtonActive]}
                onPress={() => setRecipeComplexity(option.value)}
              >
                <Text style={[styles.optionText, recipeComplexity === option.value && styles.optionTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Default Servings */}
          <Text style={[styles.complexityLabel, { marginTop: Spacing.lg }]}>Default Servings</Text>
          <View style={styles.optionsRow}>
            {[1, 2, 4, 6].map(size => (
              <TouchableOpacity
                key={size}
                style={[styles.optionButton, servingSize === size && styles.optionButtonActive]}
                onPress={() => setServingSize(size)}
              >
                <Text style={[styles.optionText, servingSize === size && styles.optionTextActive]}>
                  {size} {size === 1 ? 'serving' : 'servings'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </StyledCard>

        {/* Favorite Meal Styles Section */}
        <Text style={styles.sectionHeader}>Train the AI with Your Favorites</Text>
        <Text style={styles.sectionDescription}>
          Select 5-10 meals you love. The AI will learn your preferences and generate similar recipes.
        </Text>

        {/* Render meal categories */}
        {Object.keys(SAMPLE_MEALS).map(categoryKey => {
          const category = MEAL_CATEGORIES[categoryKey];
          const meals = SAMPLE_MEALS[categoryKey];

          return (
            <View key={categoryKey}>
              <View style={styles.categoryHeader}>
                <Ionicons name={category.icon} size={24} color={Colors.primary} />
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </View>
              <Text style={styles.categoryDescription}>{category.description}</Text>

              {meals.map(meal => {
                const isSelected = favoriteMealStyles.includes(meal.id);
                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.mealOption, isSelected && styles.mealOptionSelected]}
                    onPress={() => toggleMealStyle(meal.id)}
                  >
                    <View style={styles.mealCheckbox}>
                      {isSelected && <Ionicons name="checkmark" size={18} color={Colors.white} />}
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealDescription}>{meal.description}</Text>
                      <Text style={styles.mealMacros}>
                        {meal.calories} cal · {meal.protein}g protein · {meal.cookTime + meal.prepTime} min total
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Selected Count */}
        <StyledCard variant="elevated" style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Selected {favoriteMealStyles.length} favorite meal{favoriteMealStyles.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.summaryHint}>
            {favoriteMealStyles.length === 0 && 'Select at least 5 meals to train the AI effectively'}
            {favoriteMealStyles.length > 0 && favoriteMealStyles.length < 5 && 'Select a few more for better AI training'}
            {favoriteMealStyles.length >= 5 && favoriteMealStyles.length < 10 && 'Good selection! The AI will learn your style'}
            {favoriteMealStyles.length >= 10 && 'Excellent! The AI has a great understanding of your preferences'}
          </Text>
        </StyledCard>

        {/* Save Button */}
        <StyledButton
          title={isSaving ? "Saving..." : "Save Recipe Preferences"}
          onPress={handleSave}
          disabled={isSaving}
          style={{ marginTop: Spacing.lg, marginBottom: Spacing.xxl }}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  mealCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  mealTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sliderContainer: {
    marginBottom: Spacing.md,
  },
  sliderLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  complexityCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  complexityLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  categoryTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  categoryDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  mealOption: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight || '#e3f2fd',
  },
  mealCheckbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  mealDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  mealMacros: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  summaryCard: {
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight || '#e3f2fd',
  },
  summaryText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  summaryHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
});
