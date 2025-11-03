import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getNutritionGoals, updateNutritionGoals, getFoodPreferences, updateFoodPreferences } from '../services/userProfileService';

export default function FoodSettingsScreen({ navigation }) {
  const { user } = useAuth();
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [carbsGoal, setCarbsGoal] = useState('250');
  const [fatGoal, setFatGoal] = useState('65');
  const [isSaving, setIsSaving] = useState(false);

  // Food Preferences State
  const [cookingSkill, setCookingSkill] = useState('intermediate');
  const [dislikedIngredients, setDislikedIngredients] = useState([]);
  const [newDisliked, setNewDisliked] = useState('');
  const [favoriteCuisines, setFavoriteCuisines] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);

  useEffect(() => {
    loadGoals();
    loadPreferences();
  }, [user]);

  const loadGoals = async () => {
    try {
      const userId = user?.uid || 'guest';
      const goals = await getNutritionGoals(userId);
      setCalorieGoal(goals.calories.toString());
      setProteinGoal(goals.protein.toString());
      setCarbsGoal(goals.carbs.toString());
      setFatGoal(goals.fat.toString());
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const userId = user?.uid || 'guest';
      const prefs = await getFoodPreferences(userId);
      setCookingSkill(prefs.cookingSkill || 'intermediate');
      setDislikedIngredients(prefs.dislikedIngredients || []);
      setFavoriteCuisines(prefs.favoriteCuisines || []);
      setDietaryRestrictions(prefs.dietaryRestrictions || []);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const userId = user?.uid || 'guest';

      // Save nutrition goals
      const goals = {
        calories: parseInt(calorieGoal) || 2000,
        protein: parseInt(proteinGoal) || 150,
        carbs: parseInt(carbsGoal) || 250,
        fat: parseInt(fatGoal) || 65,
      };

      const goalsResult = await updateNutritionGoals(userId, goals);

      // Save food preferences
      const preferences = {
        cookingSkill,
        dislikedIngredients,
        favoriteCuisines,
        dietaryRestrictions,
      };

      const prefsResult = await updateFoodPreferences(userId, preferences);

      if (goalsResult.success && prefsResult.success) {
        Alert.alert('Success', 'Your nutrition settings have been updated!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save settings. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for food preferences
  const addDislikedIngredient = () => {
    if (newDisliked.trim() && !dislikedIngredients.includes(newDisliked.trim().toLowerCase())) {
      setDislikedIngredients([...dislikedIngredients, newDisliked.trim().toLowerCase()]);
      setNewDisliked('');
    }
  };

  const removeDislikedIngredient = (ingredient) => {
    setDislikedIngredients(dislikedIngredients.filter(i => i !== ingredient));
  };

  const toggleCuisine = (cuisine) => {
    if (favoriteCuisines.includes(cuisine)) {
      setFavoriteCuisines(favoriteCuisines.filter(c => c !== cuisine));
    } else {
      setFavoriteCuisines([...favoriteCuisines, cuisine]);
    }
  };

  const toggleDietaryRestriction = (restriction) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };

  // Predefined options
  const cuisineOptions = ['italian', 'asian', 'mexican', 'mediterranean', 'american', 'indian', 'thai', 'french'];
  const restrictionOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'low-carb', 'keto'];

  return (
    <ScreenLayout
      title="Food & Nutrition"
      subtitle="Goals and preferences"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Calorie Goal */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.goalLabel}>Daily Calorie Goal</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
              placeholder="2000"
            />
            <Text style={styles.unit}>calories</Text>
          </View>
          <Text style={styles.hint}>Recommended: 1500-2500 calories per day</Text>
        </StyledCard>

        {/* Macro Goals */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Macronutrient Goals</Text>

          {/* Protein */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="numeric"
                placeholder="150"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Carbohydrates</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={carbsGoal}
                onChangeText={setCarbsGoal}
                keyboardType="numeric"
                placeholder="250"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Fat</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={fatGoal}
                onChangeText={setFatGoal}
                keyboardType="numeric"
                placeholder="65"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>
        </StyledCard>

        {/* FOOD PREFERENCES SECTION */}
        <Text style={styles.sectionHeader}>Recipe Preferences</Text>

        {/* Cooking Skill Level */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Cooking Skill Level</Text>
          <View style={styles.skillButtonsRow}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.skillButton,
                  cookingSkill === level && styles.skillButtonActive
                ]}
                onPress={() => setCookingSkill(level)}
              >
                <Text style={[
                  styles.skillButtonText,
                  cookingSkill === level && styles.skillButtonTextActive
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>
            {cookingSkill === 'beginner' && 'Simple recipes with basic techniques'}
            {cookingSkill === 'intermediate' && 'Moderate complexity with various cooking methods'}
            {cookingSkill === 'advanced' && 'Complex recipes with advanced techniques'}
          </Text>
        </StyledCard>

        {/* Disliked Ingredients */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Disliked Ingredients</Text>
          <Text style={styles.hint}>AI will avoid these ingredients in recipes</Text>

          {/* Add new disliked ingredient */}
          <View style={styles.addIngredientRow}>
            <TextInput
              style={styles.ingredientInput}
              value={newDisliked}
              onChangeText={setNewDisliked}
              placeholder="e.g., ginger, cilantro"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={addDislikedIngredient}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDislikedIngredient}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* List of disliked ingredients */}
          <View style={styles.chipsContainer}>
            {dislikedIngredients.map((ingredient) => (
              <TouchableOpacity
                key={ingredient}
                style={styles.chip}
                onPress={() => removeDislikedIngredient(ingredient)}
              >
                <Text style={styles.chipText}>{ingredient}</Text>
                <Text style={styles.chipRemove}>  ✕</Text>
              </TouchableOpacity>
            ))}
            {dislikedIngredients.length === 0 && (
              <Text style={styles.emptyText}>No disliked ingredients yet</Text>
            )}
          </View>
        </StyledCard>

        {/* Favorite Cuisines */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Favorite Cuisines</Text>
          <Text style={styles.hint}>AI will prioritize these cuisines</Text>
          <View style={styles.chipsContainer}>
            {cuisineOptions.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.chip,
                  favoriteCuisines.includes(cuisine) && styles.chipSelected
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text style={[
                  styles.chipText,
                  favoriteCuisines.includes(cuisine) && styles.chipTextSelected
                ]}>
                  {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </StyledCard>

        {/* Dietary Restrictions */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          <Text style={styles.hint}>AI will respect these restrictions</Text>
          <View style={styles.chipsContainer}>
            {restrictionOptions.map((restriction) => (
              <TouchableOpacity
                key={restriction}
                style={[
                  styles.chip,
                  dietaryRestrictions.includes(restriction) && styles.chipSelected
                ]}
                onPress={() => toggleDietaryRestriction(restriction)}
              >
                <Text style={[
                  styles.chipText,
                  dietaryRestrictions.includes(restriction) && styles.chipTextSelected
                ]}>
                  {restriction.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </StyledCard>

        {/* Info Card */}
        <StyledCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tip</Text>
          <Text style={styles.infoText}>
            Your goals are automatically saved per user account. Sign in to sync your goals across devices.
          </Text>
        </StyledCard>

        {/* Save Button */}
        <StyledButton
          title="Save Settings"
          onPress={handleSave}
          loading={isSaving}
          size="lg"
          fullWidth
          style={styles.saveButton}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  goalCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  goalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  macroInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  unit: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  macroLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.primary + '10',
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
  sectionHeader: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  skillButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skillButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  skillButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  skillButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  skillButtonTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  addIngredientRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  ingredientInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chipRemove: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
