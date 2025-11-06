/**
 * RecipeDetailScreen Component
 *
 * Full-page screen displaying complete recipe details:
 * - Recipe image and title
 * - Nutrition macros (calories, protein, carbs, fat)
 * - Ingredients list with quantities
 * - Step-by-step cooking instructions
 * - Save to collection button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const RECIPES_KEY = '@saved_recipes';

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipe, fromDatabase = false } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);

  if (!recipe) {
    return (
      <ScreenLayout
        title="Recipe Details"
        scrollable={false}
        showBackButton
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Recipe not found</Text>
        </View>
      </ScreenLayout>
    );
  }

  const handleSaveRecipe = async () => {
    if (!fromDatabase) {
      Alert.alert('Info', 'This recipe is already in your collection!');
      return;
    }

    try {
      setIsSaving(true);

      // Load existing recipes
      const existingRecipesJson = await AsyncStorage.getItem(RECIPES_KEY);
      const existingRecipes = existingRecipesJson ? JSON.parse(existingRecipesJson) : [];

      // Check if already saved
      const alreadySaved = existingRecipes.some(r => r.id === recipe.id);
      if (alreadySaved) {
        Alert.alert('Info', 'This recipe is already in your collection!');
        setIsSaving(false);
        return;
      }

      // Save recipe
      const updatedRecipes = [...existingRecipes, recipe];
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updatedRecipes));

      Alert.alert('Success', 'Recipe saved to your collection!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Extract nutrition data
  const nutrition = recipe.nutrition || {};
  const calories = Math.round(nutrition.calories || 0);
  const protein = Math.round(nutrition.protein || 0);
  const carbs = Math.round(nutrition.carbs || 0);
  const fat = Math.round(nutrition.fat || 0);

  // Extract other details
  const prepTime = recipe.prepTime || 'N/A';
  const cookTime = recipe.cookTime || 'N/A';
  const servings = recipe.servings || 1;
  const difficulty = recipe.difficulty || 'medium';

  return (
    <ScreenLayout
      title={recipe.name}
      scrollable={true}
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      {/* Quick Info Bar */}
      <View style={styles.quickInfoBar}>
        <View style={styles.quickInfoItem}>
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickInfoLabel}>Prep</Text>
          <Text style={styles.quickInfoValue}>{prepTime}</Text>
        </View>

        <View style={styles.quickInfoDivider} />

        <View style={styles.quickInfoItem}>
          <Ionicons name="flame-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickInfoLabel}>Cook</Text>
          <Text style={styles.quickInfoValue}>{cookTime}</Text>
        </View>

        <View style={styles.quickInfoDivider} />

        <View style={styles.quickInfoItem}>
          <Ionicons name="people-outline" size={20} color={Colors.primary} />
          <Text style={styles.quickInfoLabel}>Servings</Text>
          <Text style={styles.quickInfoValue}>{servings}</Text>
        </View>

        <View style={styles.quickInfoDivider} />

        <View style={styles.quickInfoItem}>
          <Ionicons
            name={difficulty === 'easy' ? 'star' : difficulty === 'medium' ? 'star-half' : 'rocket'}
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.quickInfoLabel}>Level</Text>
          <Text style={styles.quickInfoValue}>{difficulty}</Text>
        </View>
      </View>

      {/* Nutrition Macros Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Per Serving</Text>
        <View style={styles.macrosGrid}>
          <View style={[styles.macroCard, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="nutrition-outline" size={32} color={Colors.primary} />
            <Text style={styles.macroValue}>{calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>

          <View style={[styles.macroCard, { backgroundColor: '#FF6B6B15' }]}>
            <Ionicons name="fitness-outline" size={32} color="#FF6B6B" />
            <Text style={styles.macroValue}>{protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>

          <View style={[styles.macroCard, { backgroundColor: '#4ECDC415' }]}>
            <Ionicons name="leaf-outline" size={32} color="#4ECDC4" />
            <Text style={styles.macroValue}>{carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>

          <View style={[styles.macroCard, { backgroundColor: '#FFD93D15' }]}>
            <Ionicons name="water-outline" size={32} color="#FFD93D" />
            <Text style={styles.macroValue}>{fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.ingredientsList}>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => {
              // Safety check: Handle both AI-generated and manual ingredient formats
              const ingredientName =
                typeof ingredient === 'string' ? ingredient :
                ingredient.food?.name || ingredient.item || ingredient.name || 'Ingredient';

              const ingredientAmount =
                typeof ingredient === 'string' ? '' :
                ingredient.original || ingredient.amount ||
                (ingredient.quantity ? `${ingredient.quantity}${ingredient.unit || 'g'}` : '');

              return (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.ingredientContent}>
                    <Text style={styles.ingredientName}>
                      {String(ingredientName)}
                    </Text>
                    <Text style={styles.ingredientQuantity}>
                      {String(ingredientAmount)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No ingredients listed</Text>
          )}
        </View>
      </View>

      {/* Instructions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.instructionsList}>
          {recipe.instructions && recipe.instructions.length > 0 ? (
            recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No instructions available</Text>
          )}
        </View>
      </View>

      {/* Tags Section */}
      {recipe.tags && recipe.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Save Button (only show if from database) */}
      {fromDatabase && (
        <View style={styles.saveButtonContainer}>
          <StyledButton
            title={isSaving ? "Saving..." : "Save to My Recipes"}
            onPress={handleSaveRecipe}
            disabled={isSaving}
            icon="bookmark-outline"
          />
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={{ height: Spacing.xl }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h2,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  quickInfoBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quickInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  quickInfoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  quickInfoValue: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  macroCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  macroValue: {
    ...Typography.h2,
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  macroLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  ingredientBullet: {
    marginRight: Spacing.sm,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  ingredientQuantity: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...Typography.bodyBold,
    color: '#fff',
    fontSize: 16,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  noDataText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.lg,
  },
  saveButtonContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});
