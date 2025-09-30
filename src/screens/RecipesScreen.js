import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import FoodCard from '../components/FoodCard';
import FoodDetailsView from '../components/FoodDetailsView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { unifiedFoodSearch } from '../services/unifiedFoodSearch';

const RECIPES_KEY = '@saved_recipes';

export default function RecipesScreen({ navigation, route }) {
  const { mealType } = route.params || { mealType: 'lunch' };

  // Mock recipes for testing
  const mockRecipes = [
    {
      id: '1',
      name: 'Protein Power Bowl',
      ingredients: [
        { food: { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 }, quantity: 150 },
        { food: { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 }, quantity: 100 },
        { food: { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }, quantity: 80 },
      ],
      nutrition: { calories: 410, protein: 36.4, carbs: 30, fat: 4.9 },
    },
    {
      id: '2',
      name: 'Morning Oatmeal',
      ingredients: [
        { food: { name: 'Oats', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 }, quantity: 50 },
        { food: { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }, quantity: 100 },
        { food: { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50 }, quantity: 20 },
      ],
      nutrition: { calories: 383, protein: 15, carbs: 46.5, fat: 11.4 },
    },
    {
      id: '3',
      name: 'Greek Salad',
      ingredients: [
        { food: { name: 'Cucumber', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 }, quantity: 200 },
        { food: { name: 'Tomatoes', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, quantity: 150 },
        { food: { name: 'Feta Cheese', calories: 264, protein: 14, carbs: 4, fat: 21 }, quantity: 50 },
        { food: { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100 }, quantity: 15 },
      ],
      nutrition: { calories: 295, protein: 9.6, carbs: 9.4, fat: 24.4 },
    },
  ];

  const [recipes, setRecipes] = useState(mockRecipes);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalView, setModalView] = useState('recipe'); // 'recipe' or 'ingredient'
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  const searchTimeoutRef = useRef(null);

  // New recipe state
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: [],
  });

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECIPES_KEY);
      if (saved) {
        setRecipes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const saveRecipes = async (updatedRecipes) => {
    try {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(updatedRecipes));
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  };

  const calculateRecipeNutrition = (ingredients) => {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    ingredients.forEach(item => {
      const multiplier = item.quantity / 100; // Convert to per 100g basis
      totals.calories += (item.food.calories || 0) * multiplier;
      totals.protein += (item.food.protein || 0) * multiplier;
      totals.carbs += (item.food.carbs || 0) * multiplier;
      totals.fat += (item.food.fat || 0) * multiplier;
    });

    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
    };
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
      // Use unified search with API enabled for comprehensive results
      // This ensures users can find specific products like specialty breads
      const results = await unifiedFoodSearch(query, {
        includeAPI: true,  // Enable API for specific products
        limit: 50
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  }, []);

  // Handle text input with debouncing
  const handleSearchChange = (text) => {
    setSearchText(text);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 250); // Fast response for ingredient search
  };

  const addIngredientToRecipe = (food, quantity) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { food, quantity: quantity || 100 }]
    }));
    setModalView('recipe'); // Go back to recipe view
    setSearchText('');
    setSearchResults([]);
  };

  const removeIngredient = (index) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const saveNewRecipe = () => {
    if (!newRecipe.name.trim()) {
      Alert.alert('Error', 'Please enter a recipe name');
      return;
    }

    if (newRecipe.ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    const nutrition = calculateRecipeNutrition(newRecipe.ingredients);
    const recipeToSave = {
      id: Date.now().toString(),
      name: newRecipe.name,
      ingredients: newRecipe.ingredients,
      nutrition,
      createdAt: new Date().toISOString(),
    };

    const updatedRecipes = [...recipes, recipeToSave];
    saveRecipes(updatedRecipes);

    setShowCreateModal(false);
    setNewRecipe({ name: '', ingredients: [] });

    Alert.alert('Success', 'Recipe saved successfully!');
  };

  const quickAddRecipe = (recipe) => {
    Alert.alert(
      'Add to ' + mealType,
      `Add "${recipe.name}" to ${mealType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            const foodData = {
              name: recipe.name,
              calories: recipe.nutrition.calories,
              protein: recipe.nutrition.protein,
              carbs: recipe.nutrition.carbs,
              fat: recipe.nutrition.fat,
              mealType: mealType,
            };

            // Navigate back with the recipe data and a flag indicating recipe was added
            navigation.navigate('Nutrition', {
              addedFood: foodData,
              fromRecipeAdd: true  // Flag to indicate we came from adding a recipe
            });
          }
        }
      ]
    );
  };

  const deleteRecipe = (recipeId) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedRecipes = recipes.filter(r => r.id !== recipeId);
            saveRecipes(updatedRecipes);
          }
        }
      ]
    );
  };

  const editRecipe = (recipe) => {
    navigation.navigate('EditRecipe', {
      recipe: recipe,
      onSave: (updatedRecipe) => {
        const updatedRecipes = recipes.map(r =>
          r.id === updatedRecipe.id ? updatedRecipe : r
        );
        saveRecipes(updatedRecipes);
      }
    });
  };

  const renderRecipe = ({ item }) => (
    <StyledCard style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <Text style={styles.ingredientCount}>
            {item.ingredients.length} ingredients
          </Text>
        </View>
        <View style={styles.nutritionSummary}>
          <Text style={styles.caloriesText}>
            {item.nutrition.calories} cal
          </Text>
          <Text style={styles.macroText}>
            P: {item.nutrition.protein}g
          </Text>
          <Text style={styles.macroText}>
            C: {item.nutrition.carbs}g
          </Text>
          <Text style={styles.macroText}>
            F: {item.nutrition.fat}g
          </Text>
        </View>
      </View>
      <View style={styles.recipeActions}>
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={() => quickAddRecipe(item)}
        >
          <Text style={styles.quickAddText}>Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editRecipe(item)}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRecipe(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </StyledCard>
  );


  const renderSearchResult = ({ item }) => (
    <FoodCard
      food={item}
      onPress={(food) => {
        setSelectedFood(food);
        setModalView('details');
      }}
    />
  );

  // Handle adding ingredient from the FoodDetailsView
  const handleAddIngredientFromDetails = ({ food, actualWeight }) => {
    addIngredientToRecipe(food, actualWeight);
    setModalView('recipe');
    setSelectedFood(null);
  };

  const currentNutrition = calculateRecipeNutrition(newRecipe.ingredients);

  return (
    <ScreenLayout
      title="My Recipes"
      subtitle="Create and manage your recipes"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={true}
    >
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          // Reset state before opening
          setNewRecipe({ name: '', ingredients: [] });
          setModalView('recipe');
          setSearchText('');
          setSearchResults([]);
          setShowCreateModal(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>➕ Create New Recipe</Text>
      </TouchableOpacity>

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No Recipes Yet</Text>
          <Text style={styles.emptyText}>
            Create your first recipe to quickly add your favorite meals
          </Text>
        </View>
      ) : (
        <View style={styles.recipesContainer}>
          {recipes.map((item) => (
            <View key={item.id}>
              {renderRecipe({ item })}
            </View>
          ))}
        </View>
      )}

      {/* Single Modal with Different Views */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => {
          if (modalView === 'details') {
            setModalView('ingredient');
            setSelectedFood(null);
          } else if (modalView === 'ingredient') {
            setModalView('recipe');
          } else {
            setShowCreateModal(false);
          }
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {modalView === 'recipe' ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Recipe</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    setNewRecipe({ name: '', ingredients: [] });
                    setModalView('recipe');
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag"
                scrollEnabled={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                bounces={false}
              >
                <Text style={styles.inputLabel}>Recipe Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter recipe name"
                  placeholderTextColor={Colors.textMuted}
                  value={newRecipe.name}
                  onChangeText={(text) => setNewRecipe(prev => ({ ...prev, name: text }))}
                />

                <View style={styles.ingredientsSection}>
                  <Text style={styles.inputLabel}>Ingredients</Text>
                  <TouchableOpacity
                    style={styles.addIngredientButton}
                    onPress={() => {
                      setModalView('ingredient');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addIngredientText}>+ Add Ingredient</Text>
                  </TouchableOpacity>

                  {newRecipe.ingredients.map((item, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{item.food.name}</Text>
                        <Text style={styles.ingredientQuantity}>{item.quantity}g</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeIngredient(index)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {newRecipe.ingredients.length > 0 && (
                  <View style={styles.nutritionPreview}>
                    <Text style={styles.nutritionTitle}>Total Nutrition</Text>
                    <View style={styles.nutritionRow}>
                      <Text style={styles.nutritionLabel}>Calories: {currentNutrition.calories}</Text>
                      <Text style={styles.nutritionLabel}>Protein: {currentNutrition.protein}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs: {currentNutrition.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>Fat: {currentNutrition.fat}g</Text>
                    </View>
                  </View>
                )}
          </ScrollView>

              <View style={styles.modalFooter}>
                <StyledButton
                  title="Save Recipe"
                  onPress={saveNewRecipe}
                  fullWidth
                />
              </View>
            </>
          ) : modalView === 'ingredient' ? (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Ingredient</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalView('recipe');
                    setSearchText('');
                    setSearchResults([]);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for ingredients..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchText}
                  onChangeText={handleSearchChange}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.searchResultsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  searchText.length > 0 && !isSearching ? (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No ingredients found</Text>
                      <Text style={styles.noResultsHint}>
                        Try searching in the main Food Search for more options,
                        or check the spelling of your search
                      </Text>
                    </View>
                  ) : null
                }
              />
            </>
          ) : modalView === 'details' && selectedFood ? (
            <FoodDetailsView
              food={selectedFood}
              onAction={(data) => {
                addIngredientToRecipe(data.food, data.actualWeight);
                setModalView('recipe');
                setSelectedFood(null);
              }}
              actionButtonText="Add to Recipe"
              showBackButton={true}
              onBack={() => {
                setModalView('ingredient');
                setSelectedFood(null);
              }}
            />
          ) : null}
        </SafeAreaView>
      </Modal>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 12,
    minHeight: 48,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  recipesContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recipeCard: {
    marginBottom: Spacing.md,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  recipeServings: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  ingredientCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  nutritionSummary: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  macroText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickAddText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  editButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    marginRight: Spacing.sm,
  },
  editText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.error + '20',
  },
  deleteText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.xl * 2 : Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
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
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  ingredientsSection: {
    marginTop: Spacing.lg,
  },
  addIngredientButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#00E676',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Platform.OS === 'ios' ? 16 : Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    minHeight: Platform.OS === 'ios' ? 50 : 48,
    width: '100%',
  },
  addIngredientText: {
    color: '#00E676',
    fontWeight: '700',
    fontSize: Platform.OS === 'ios' ? 16 : Typography.fontSize.md,
  },
  ingredientsList: {
    maxHeight: 200,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  ingredientQuantity: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  removeButtonText: {
    fontSize: 18,
    color: Colors.error,
  },
  nutritionPreview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nutritionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  searchBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  searchResultsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  // Food card styles removed - using FoodCard component
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchResultName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  searchResultCalories: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  noResultsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  noResultsHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  quantityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  quantityModalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  quantityInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  quantityModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quantityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  addButtonText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  // Removed Food Details Styles - Now in FoodDetailsView component
  /*detailsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  detailsFoodName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  detailsCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  nutriScoreBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  nutriScoreText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  starIcon: {
    fontSize: 20,
  },
  healthDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  healthDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  servingSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  servingSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  servingButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  servingAmount: {
    alignItems: 'center',
    flex: 1,
  },
  servingValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  servingUnit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nutritionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  nutritionServing: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  nutritionSubRow: {
    paddingLeft: Spacing.lg,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  nutritionSubLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  nutritionValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  nutritionValueLarge: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  nutritionDivider: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  addToRecipeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  addToRecipeText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: '#1a1a1a',
  },*/
});