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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import RecipeCookModeModal from '../components/RecipeCookModeModal';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const RECIPES_KEY = '@saved_recipes';

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipe, fromDatabase = false } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const [showCookMode, setShowCookMode] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('nutrition'); // 'nutrition' or 'ingredients'

  const openCookMode = () => {
    setShowCookMode(true);
  };

  const openInstructionsModal = () => {
    setShowInstructionsModal(true);
  };

  const closeCookMode = () => {
    setShowCookMode(false);
  };

  const closeInstructionsModal = () => {
    setShowInstructionsModal(false);
  };

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

      {/* Action Buttons Row */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <View style={styles.actionButtonsRow}>
          {/* Empty space on left to balance */}
          <View style={styles.actionButtonSpacer} />
          <TouchableOpacity
            style={styles.startCookingBtn}
            onPress={openCookMode}
            activeOpacity={0.7}
          >
            <Ionicons name="play-circle" size={24} color={Colors.text} />
            <Text style={styles.startCookingBtnText}>Start Cooking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewInstructionsBtn}
            onPress={openInstructionsModal}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabbed Ingredients/Nutrition Section */}
      <View style={styles.tabbedSection}>
        {/* Tab Headers */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}
            onPress={() => setActiveTab('nutrition')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>
              Nutrition
            </Text>
            {activeTab === 'nutrition' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.tabActive]}
            onPress={() => setActiveTab('ingredients')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
              Ingredients
            </Text>
            {activeTab === 'ingredients' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'ingredients' ? (
            /* Ingredients Tab */
            <View style={styles.ingredientsList}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => {
                  const ingredientName =
                    typeof ingredient === 'string' ? ingredient :
                    ingredient.food?.name || ingredient.item || ingredient.name || 'Ingredient';

                  let ingredientAmount = '';
                  if (typeof ingredient === 'string') {
                    ingredientAmount = '';
                  } else if (typeof ingredient.original === 'string') {
                    ingredientAmount = ingredient.original;
                  } else if (ingredient.original && typeof ingredient.original === 'object') {
                    ingredientAmount = ingredient.original.amount || '';
                  } else if (ingredient.amount) {
                    ingredientAmount = typeof ingredient.amount === 'string' ? ingredient.amount : '';
                  } else if (ingredient.quantity) {
                    ingredientAmount = `${ingredient.quantity}${ingredient.unit || 'g'}`;
                  }

                  const qty = ingredient.quantity || 100;
                  const multiplier = qty / 100;
                  const food = ingredient.food || ingredient;
                  const cal = Math.round((food.calories || 0) * multiplier);
                  const pro = Math.round((food.protein || 0) * multiplier * 10) / 10;
                  const carb = Math.round((food.carbs || 0) * multiplier * 10) / 10;
                  const fatVal = Math.round((food.fat || 0) * multiplier * 10) / 10;
                  const hasMacros = cal > 0 || pro > 0 || carb > 0 || fatVal > 0;

                  return (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={styles.ingredientBullet}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                      </View>
                      <View style={styles.ingredientContent}>
                        <Text style={styles.ingredientName}>{String(ingredientName)}</Text>
                        <Text style={styles.ingredientQuantity}>{String(ingredientAmount)}</Text>
                        {hasMacros && (
                          <View style={styles.ingredientMacrosRow}>
                            <View style={[styles.macroBadge, styles.calBadge]}>
                              <Text style={styles.macroBadgeText}>{cal}</Text>
                              <Text style={styles.macroBadgeLabel}>cal</Text>
                            </View>
                            <View style={[styles.macroBadge, styles.proteinBadge]}>
                              <Text style={styles.macroBadgeText}>{pro}g</Text>
                              <Text style={styles.macroBadgeLabel}>P</Text>
                            </View>
                            <View style={[styles.macroBadge, styles.carbsBadge]}>
                              <Text style={styles.macroBadgeText}>{carb}g</Text>
                              <Text style={styles.macroBadgeLabel}>C</Text>
                            </View>
                            <View style={[styles.macroBadge, styles.fatBadge]}>
                              <Text style={styles.macroBadgeText}>{fatVal}g</Text>
                              <Text style={styles.macroBadgeLabel}>F</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No ingredients listed</Text>
              )}
            </View>
          ) : (
            /* Nutrition Tab */
            <View style={styles.nutritionTabContent}>
              <View style={styles.macrosGrid}>
                <View style={[styles.macroCard, { backgroundColor: Colors.primary + '15' }]}>
                  <Ionicons name="nutrition-outline" size={32} color={Colors.primary} />
                  <Text style={styles.macroValue}>{calories}</Text>
                  <Text style={styles.macroCardLabel}>Calories</Text>
                </View>
                <View style={[styles.macroCard, { backgroundColor: '#FF6B6B15' }]}>
                  <Ionicons name="fitness-outline" size={32} color="#FF6B6B" />
                  <Text style={styles.macroValue}>{protein}g</Text>
                  <Text style={styles.macroCardLabel}>Protein</Text>
                </View>
                <View style={[styles.macroCard, { backgroundColor: '#4ECDC415' }]}>
                  <Ionicons name="leaf-outline" size={32} color="#4ECDC4" />
                  <Text style={styles.macroValue}>{carbs}g</Text>
                  <Text style={styles.macroCardLabel}>Carbs</Text>
                </View>
                <View style={[styles.macroCard, { backgroundColor: '#FFD93D15' }]}>
                  <Ionicons name="water-outline" size={32} color="#FFD93D" />
                  <Text style={styles.macroValue}>{fat}g</Text>
                  <Text style={styles.macroCardLabel}>Fat</Text>
                </View>
              </View>
              <Text style={styles.nutritionNote}>Per serving ({servings} serving{servings > 1 ? 's' : ''})</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tags Section */}
      {recipe.tags && recipe.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.md }]}>Tags</Text>
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

      {/* Full Instructions Modal */}
      <Modal
        visible={showInstructionsModal}
        animationType="slide"
        onRequestClose={() => setShowInstructionsModal(false)}
      >
        <SafeAreaView style={styles.instructionsModal}>
          {/* Header */}
          <View style={styles.instructionsModalHeader}>
            <Text style={styles.instructionsModalTitle}>Instructions</Text>
            <TouchableOpacity
              onPress={() => setShowInstructionsModal(false)}
              style={styles.instructionsModalClose}
            >
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.instructionsModalContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.instructionsModalRecipeName}>{recipe.name || recipe.title}</Text>
            <Text style={styles.instructionsModalCount}>
              {recipe.instructions?.length || 0} steps
            </Text>
            <View style={styles.instructionsModalList}>
              {recipe.instructions?.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.startCookingFromModal}
              onPress={() => {
                setShowInstructionsModal(false);
                setTimeout(() => setShowCookMode(true), 150);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="play-circle" size={24} color={Colors.text} />
              <Text style={styles.startCookingFromModalText}>Start Cooking Mode</Text>
            </TouchableOpacity>
            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Cook Mode Modal */}
      <RecipeCookModeModal
        visible={showCookMode}
        onClose={closeCookMode}
        recipe={recipe}
      />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 0,
  },
  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButtonSpacer: {
    width: 48,
  },
  startCookingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
  },
  startCookingBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  viewInstructionsBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Tabbed Section Styles
  tabbedSection: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabContent: {
    padding: Spacing.md,
  },
  nutritionTabContent: {
    paddingVertical: Spacing.sm,
  },
  nutritionNote: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  macroCardLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  macroBadgeLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.textMuted,
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
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  ingredientMacrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 2,
  },
  macroBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calBadge: {
    backgroundColor: Colors.primary + '30',
  },
  proteinBadge: {
    backgroundColor: '#FF6B6B30',
  },
  carbsBadge: {
    backgroundColor: '#4ECDC430',
  },
  fatBadge: {
    backgroundColor: '#FFD93D30',
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
  startCookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  startCookingButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  startCookingButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  startCookingButtonTextTop: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  // Instructions Modal Styles
  instructionsModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  instructionsModalInner: {
    flex: 1,
  },
  swipeZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  swipeBar: {
    width: 60,
    height: 6,
    backgroundColor: Colors.textMuted,
    borderRadius: 3,
  },
  swipeHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  instructionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  instructionsModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  instructionsModalClose: {
    padding: Spacing.xs,
  },
  instructionsModalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  instructionsModalRecipeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  instructionsModalCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  instructionsModalList: {
    gap: Spacing.md,
  },
  startCookingFromModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  startCookingFromModalText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
});
