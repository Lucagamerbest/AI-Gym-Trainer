import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, FlatList, ScrollView } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import FoodCard from '../components/FoodCard';
import FoodDetailsView from '../components/FoodDetailsView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { unifiedFoodSearch } from '../services/unifiedFoodSearch';

export default function EditRecipeScreen({ route, navigation }) {
  const { recipe, onSave } = route.params;

  const [recipeName, setRecipeName] = useState(recipe.name || '');
  const [ingredients, setIngredients] = useState(recipe.ingredients || []);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [modalView, setModalView] = useState('list'); // 'list' or 'details'

  const searchTimeoutRef = useRef(null);

  // Calculate total nutrition for the recipe (same logic as RecipesScreen)
  const calculateRecipeNutrition = (ingredientsList, servings = 1) => {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    ingredientsList.forEach(item => {
      const multiplier = item.quantity / 100; // Convert to per 100g basis
      totals.calories += (item.food.calories || 0) * multiplier;
      totals.protein += (item.food.protein || 0) * multiplier;
      totals.carbs += (item.food.carbs || 0) * multiplier;
      totals.fat += (item.food.fat || 0) * multiplier;
    });

    // Divide by servings to show per-serving nutrition (matches RecipesScreen display)
    return {
      calories: Math.round(totals.calories / servings),
      protein: Math.round((totals.protein / servings) * 10) / 10,
      carbs: Math.round((totals.carbs / servings) * 10) / 10,
      fat: Math.round((totals.fat / servings) * 10) / 10,
    };
  };

  const updateIngredientAmount = (index, newAmount) => {
    const updatedIngredients = [...ingredients];
    const quantity = parseFloat(newAmount) || 0;
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: Math.max(1, quantity)
    };
    setIngredients(updatedIngredients);
  };

  const removeIngredient = (index) => {
    Alert.alert(
      'Remove Ingredient',
      `Remove ${ingredients[index].food.name} from recipe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedIngredients = ingredients.filter((_, i) => i !== index);
            setIngredients(updatedIngredients);
          }
        }
      ]
    );
  };

  // Enhanced search using unified API with API fallback
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await unifiedFoodSearch(query, {
        includeAPI: true,
        limit: 50
      });
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  // Handle text input with debouncing
  const handleSearchChange = (text) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 250);
  };

  const addIngredient = (food, quantity) => {
    const newIngredient = {
      food: {
        name: food.name,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
      },
      quantity: quantity || 100,
    };

    setIngredients([...ingredients, newIngredient]);
    setShowAddIngredient(false);
    setModalView('list');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
  };

  const saveRecipe = () => {
    if (!recipeName.trim()) {
      Alert.alert('Error', 'Please enter a recipe name');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    const servings = recipe.servings || 1;
    const nutrition = calculateRecipeNutrition(ingredients, servings);
    const updatedRecipe = {
      ...recipe,
      name: recipeName.trim(),
      ingredients: ingredients,
      nutrition,
    };

    onSave(updatedRecipe);
    navigation.goBack();
  };

  const totalNutrition = calculateRecipeNutrition(ingredients, recipe.servings || 1);

  const renderSearchResult = ({ item }) => (
    <FoodCard
      food={item}
      onPress={(food) => {
        setSelectedFood(food);
        setModalView('details');
      }}
    />
  );

  return (
    <ScreenLayout
      title="Edit Recipe"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      {!showAddIngredient ? (
        <>
          {/* Recipe Name */}
          <StyledCard style={styles.card}>
            <TextInput
              style={styles.textInput}
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="Recipe name"
              placeholderTextColor={Colors.textMuted}
            />
          </StyledCard>

          {/* Total Nutrition Summary - ALWAYS VISIBLE */}
          <StyledCard style={styles.nutritionSummaryCard}>
            <View style={styles.nutritionCompactRow}>
              <View style={styles.nutritionCompactItem}>
                <Text style={styles.nutritionCompactValue}>{totalNutrition.calories}</Text>
                <Text style={styles.nutritionCompactLabel}>cal</Text>
              </View>
              <View style={styles.nutritionDivider} />
              <View style={styles.nutritionCompactItem}>
                <Text style={styles.nutritionCompactValue}>{totalNutrition.protein}g</Text>
                <Text style={styles.nutritionCompactLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionDivider} />
              <View style={styles.nutritionCompactItem}>
                <Text style={styles.nutritionCompactValue}>{totalNutrition.carbs}g</Text>
                <Text style={styles.nutritionCompactLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionDivider} />
              <View style={styles.nutritionCompactItem}>
                <Text style={styles.nutritionCompactValue}>{totalNutrition.fat}g</Text>
                <Text style={styles.nutritionCompactLabel}>Fat</Text>
              </View>
            </View>
          </StyledCard>

          {/* Ingredients List */}
          <View style={styles.ingredientsContainer}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddIngredient(true)}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient, index) => {
              const ingredientCalories = Math.round((ingredient.food.calories || 0) * (ingredient.quantity || 0) / 100);
              const ingredientProtein = Math.round((ingredient.food.protein || 0) * (ingredient.quantity || 0) / 10) / 10;
              const ingredientCarbs = Math.round((ingredient.food.carbs || 0) * (ingredient.quantity || 0) / 10) / 10;
              const ingredientFat = Math.round((ingredient.food.fat || 0) * (ingredient.quantity || 0) / 10) / 10;

              return (
                <View key={index} style={styles.ingredientCard}>
                  <View style={styles.ingredientHeader}>
                    <View style={styles.ingredientNameRow}>
                      <Text style={styles.ingredientName}>{ingredient.food.name}</Text>
                      <Text style={styles.ingredientNutritionInline}>
                        {ingredientCalories} cal • {ingredientProtein}g • {ingredientCarbs}g • {ingredientFat}g
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeIngredient(index)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.ingredientControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateIngredientAmount(index, Math.max(1, (ingredient.quantity || 0) - 10))}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.quantityDisplay}>
                      <TextInput
                        style={styles.amountInput}
                        value={(ingredient.quantity || 0).toString()}
                        onChangeText={(text) => updateIngredientAmount(index, text)}
                        keyboardType="numeric"
                        selectTextOnFocus={true}
                      />
                      <Text style={styles.unitText}>g</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateIngredientAmount(index, (ingredient.quantity || 0) + 10)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {ingredients.length === 0 && (
              <Text style={styles.emptyText}>No ingredients added yet</Text>
            )}
          </View>

          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <StyledButton
              title="Save Recipe"
              onPress={saveRecipe}
              style={styles.saveButton}
            />
          </View>
        </>
      ) : (
        // Add Ingredient View
        <View style={styles.addIngredientContainer}>
          {modalView === 'list' ? (
            <>
              <View style={styles.addIngredientHeader}>
                <Text style={styles.addIngredientTitle}>Add Ingredient</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddIngredient(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for ingredients..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.searchResultsContainer}>
                {searchResults.map((item, index) => (
                  <View key={index}>
                    {renderSearchResult({ item })}
                  </View>
                ))}
                {searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No ingredients found</Text>
                  </View>
                )}
              </View>
            </>
          ) : modalView === 'details' && selectedFood ? (
            <FoodDetailsView
              food={selectedFood}
              onAction={(data) => {
                addIngredient(data.food, data.actualWeight);
              }}
              actionButtonText="Add to Recipe"
              showBackButton={true}
              onBack={() => {
                setModalView('list');
                setSelectedFood(null);
              }}
            />
          ) : null}
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  nutritionSummaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  servingsCompactCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  nutritionCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nutritionCompactItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionCompactValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionCompactLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  totalNutritionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  nutritionSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servingsCompactLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  servingsHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  servingButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonSmall: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  servingsText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  nutritionItem: {
    alignItems: 'center',
    width: 70,
  },
  nutritionValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 60,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  nutritionValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  nutritionValueLarge: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionValueMedium: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionUnit: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 2,
  },
  ingredientsContainer: {
    marginHorizontal: Spacing.lg,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  ingredientCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  ingredientNameRow: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  ingredientName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  ingredientNutritionInline: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  ingredientControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  quantityButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: '#000',
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 100,
    justifyContent: 'center',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    width: 70,
    textAlign: 'center',
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    backgroundColor: Colors.background,
    fontWeight: '600',
  },
  unitText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  removeButtonText: {
    fontSize: 20,
    color: Colors.error,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginVertical: Spacing.lg,
  },
  saveButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  addIngredientContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
  },
  addIngredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addIngredientTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  searchResultsContainer: {
    paddingBottom: 100,
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  noResultsText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});