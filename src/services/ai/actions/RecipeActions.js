/**
 * Recipe Actions
 * Handles execution of recipe-related actions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Find recipes by filter
 */
export async function findRecipe(params, context) {
  try {
    const { filter } = params;

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Load saved recipes from AsyncStorage
    const RECIPES_KEY = '@saved_recipes';
    const savedData = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedData ? JSON.parse(savedData) : [];

    // Built-in recipe database
    const builtInRecipes = [
      {
        name: 'Grilled Chicken Salad',
        calories: 350,
        protein: 45,
        type: 'high-protein',
        prepTime: '15 min',
        ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil']
      },
      {
        name: 'Protein Oatmeal Bowl',
        calories: 420,
        protein: 35,
        type: 'high-protein',
        prepTime: '10 min',
        ingredients: ['Oats', 'Protein powder', 'Banana', 'Almond butter']
      },
      {
        name: 'Salmon & Quinoa',
        calories: 480,
        protein: 40,
        type: 'high-protein',
        prepTime: '20 min',
        ingredients: ['Salmon fillet', 'Quinoa', 'Broccoli', 'Lemon']
      },
      {
        name: 'Veggie Egg White Omelette',
        calories: 180,
        protein: 25,
        type: 'low-calorie',
        prepTime: '10 min',
        ingredients: ['Egg whites', 'Spinach', 'Mushrooms', 'Bell pepper']
      },
      {
        name: 'Greek Yogurt Parfait',
        calories: 220,
        protein: 20,
        type: 'quick',
        prepTime: '5 min',
        ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey']
      }
    ];

    // Combine saved and built-in recipes
    const allRecipes = [...savedRecipes, ...builtInRecipes];

    // Filter recipes based on parameter
    let filteredRecipes = allRecipes;
    if (filter) {
      filteredRecipes = allRecipes.filter(r => r.type === filter);
    }

    if (filteredRecipes.length === 0) {
      return {
        success: true,
        action: 'FIND_RECIPE',
        data: { noRecipes: true, filter },
        message: `No ${filter || ''} recipes found. Tap "Add Recipe" on the Recipes screen to create your own!`
      };
    }

    // Show top 3 recipes
    const topRecipes = filteredRecipes.slice(0, 3);
    let message = `${filter ? filter.charAt(0).toUpperCase() + filter.slice(1) + ' ' : ''}Recipes:\n\n`;

    topRecipes.forEach(recipe => {
      message += `🍽️ ${recipe.name}\n`;
      message += `  ${recipe.calories} cal | ${recipe.protein}g protein`;
      if (recipe.prepTime) message += ` | ${recipe.prepTime}`;
      message += `\n\n`;
    });

    if (filteredRecipes.length > 3) {
      message += `...and ${filteredRecipes.length - 3} more! Check the Recipes screen to see all.`;
    }

    return {
      success: true,
      action: 'FIND_RECIPE',
      data: {
        recipes: topRecipes,
        totalCount: filteredRecipes.length,
        filter
      },
      message
    };
  } catch (error) {
    console.error('Error finding recipes:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to find recipes. Check the Recipes screen to browse manually.'
    };
  }
}

/**
 * Create a new recipe
 */
export async function createRecipe(params, context) {
  return {
    success: true,
    action: 'CREATE_RECIPE',
    data: {},
    message: 'To create a recipe:\n\n1. Go to Recipes screen\n2. Tap "Add Recipe" button (+ icon)\n3. Enter recipe name and servings\n4. Add ingredients using the search\n5. Save your recipe!\n\nYour saved recipes will sync across devices.'
  };
}

/**
 * Suggest a recipe based on remaining macros
 */
export async function suggestRecipe(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context to see what macros are needed
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesLeft = (nutritionContext.calories?.target || 2000) - (nutritionContext.calories?.consumed || 0);
    const proteinLeft = (nutritionContext.protein?.target || 150) - (nutritionContext.protein?.consumed || 0);

    // Recipe suggestions based on remaining macros
    const recipeSuggestions = {
      highProtein: [
        { name: 'Grilled Chicken & Broccoli', calories: 380, protein: 48, prepTime: '20 min' },
        { name: 'Salmon with Asparagus', calories: 420, protein: 45, prepTime: '25 min' },
        { name: 'Greek Yogurt Protein Bowl', calories: 340, protein: 42, prepTime: '10 min' }
      ],
      balanced: [
        { name: 'Turkey Wrap with Veggies', calories: 450, protein: 35, prepTime: '15 min' },
        { name: 'Chicken Stir Fry Bowl', calories: 520, protein: 38, prepTime: '20 min' },
        { name: 'Beef & Sweet Potato', calories: 480, protein: 40, prepTime: '30 min' }
      ],
      lowCalorie: [
        { name: 'Egg White Veggie Scramble', calories: 200, protein: 28, prepTime: '10 min' },
        { name: 'Tuna Salad (no mayo)', calories: 180, protein: 32, prepTime: '5 min' },
        { name: 'Grilled Chicken Salad', calories: 250, protein: 35, prepTime: '15 min' }
      ]
    };

    let suggestion;
    let category;

    if (proteinLeft > 50) {
      category = 'highProtein';
      suggestion = recipeSuggestions.highProtein[Math.floor(Math.random() * recipeSuggestions.highProtein.length)];
    } else if (caloriesLeft > 600) {
      category = 'balanced';
      suggestion = recipeSuggestions.balanced[Math.floor(Math.random() * recipeSuggestions.balanced.length)];
    } else {
      category = 'lowCalorie';
      suggestion = recipeSuggestions.lowCalorie[Math.floor(Math.random() * recipeSuggestions.lowCalorie.length)];
    }

    const message = `Based on your remaining macros (${Math.round(caloriesLeft)} cal, ${Math.round(proteinLeft)}g protein):\n\n` +
                   `🍽️ ${suggestion.name}\n` +
                   `${suggestion.calories} cal | ${suggestion.protein}g protein | ${suggestion.prepTime}\n\n` +
                   `Find more recipes in the Recipes tab!`;

    return {
      success: true,
      action: 'SUGGEST_RECIPE',
      data: {
        recipe: suggestion,
        category,
        caloriesLeft: Math.round(caloriesLeft),
        proteinLeft: Math.round(proteinLeft)
      },
      message
    };
  } catch (error) {
    console.error('Error suggesting recipe:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to suggest a recipe. Try browsing the Recipes screen.'
    };
  }
}

/**
 * Show saved recipes
 */
export async function showSavedRecipes(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Load saved recipes from AsyncStorage
    const RECIPES_KEY = '@saved_recipes';
    const savedData = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedData ? JSON.parse(savedData) : [];

    if (savedRecipes.length === 0) {
      return {
        success: true,
        action: 'SHOW_SAVED_RECIPES',
        data: { noSavedRecipes: true },
        message: 'You haven\'t saved any recipes yet. Create your first recipe on the Recipes screen by tapping "Add Recipe"!'
      };
    }

    let message = `Your Saved Recipes (${savedRecipes.length} total):\n\n`;

    savedRecipes.slice(0, 5).forEach(recipe => {
      message += `🍽️ ${recipe.name}\n`;
      if (recipe.calories) {
        message += `  ${recipe.calories} cal | ${recipe.protein || 0}g protein\n`;
      }
      message += `  ${recipe.ingredients?.length || 0} ingredients\n\n`;
    });

    if (savedRecipes.length > 5) {
      message += `...and ${savedRecipes.length - 5} more! Go to Recipes screen to see all.`;
    }

    return {
      success: true,
      action: 'SHOW_SAVED_RECIPES',
      data: {
        totalRecipes: savedRecipes.length,
        recipes: savedRecipes.slice(0, 5)
      },
      message
    };
  } catch (error) {
    console.error('Error showing saved recipes:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to load saved recipes. Check the Recipes screen.'
    };
  }
}
