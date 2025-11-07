/**
 * Free Recipe Service
 *
 * Uses TheMealDB + Curated Fitness Meals
 * Combines free API recipes with practical fitness meals
 * API: https://www.themealdb.com/api.php
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURATED_FITNESS_MEALS } from './CuratedFitnessMeals';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (data doesn't change often)
const CACHE_PREFIX = '@free_recipes_';

// Estimated nutrition per 100g for common ingredients (used to calculate recipe nutrition)
const INGREDIENT_NUTRITION = {
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 15 },
  pork: { calories: 242, protein: 27, carbs: 0, fat: 14 },
  fish: { calories: 206, protein: 22, carbs: 0, fat: 12 },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13 },
  shrimp: { calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  eggs: { calories: 155, protein: 13, carbs: 1, fat: 11 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  pasta: { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  cheese: { calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  milk: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  yogurt: { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3 },
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100 },
  butter: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  sugar: { calories: 387, protein: 0, carbs: 100, fat: 0 },
  flour: { calories: 364, protein: 10, carbs: 76, fat: 1 },
};

class FreeRecipeService {
  constructor() {
    this.allRecipes = null; // Cache all recipes locally
  }

  /**
   * Search recipes with filters (free!)
   */
  async searchRecipes({
    query = '',
    mealType = null,
    minCalories = null,
    maxCalories = null,
    minProtein = null,
    category = null, // Seafood, Chicken, Beef, Vegetarian, Dessert, etc.
    area = null, // American, British, Canadian, Chinese, French, Italian, Mexican, etc.
  } = {}) {
    try {
      let recipes = [];

      // Start with curated fitness meals (ALWAYS include these)
      // Recalculate nutrition from ingredients to ensure accuracy
      recipes = CURATED_FITNESS_MEALS.map(recipe => ({
        ...recipe,
        nutrition: this._calculateNutritionFromIngredients(recipe.ingredients)
      }));

      // Add TheMealDB recipes
      let apiRecipes = [];
      if (query) {
        apiRecipes = await this._searchByName(query);
      }
      // If filtering by category
      else if (category) {
        apiRecipes = await this._filterByCategory(category);
      }
      // If filtering by area/cuisine
      else if (area) {
        apiRecipes = await this._filterByArea(area);
      }
      // Otherwise get all recipes
      else {
        apiRecipes = await this._getAllRecipes();
      }

      // Merge curated + API recipes
      recipes = [...recipes, ...apiRecipes];

      // Apply client-side filters
      let filtered = recipes;

      // ALWAYS filter out useless categories for fitness app
      const excludedCategories = ['dessert', 'goat', 'miscellaneous'];
      filtered = filtered.filter(recipe => {
        const category = recipe.category?.toLowerCase() || '';
        const name = recipe.name?.toLowerCase() || '';

        // Exclude desserts and weird categories
        if (excludedCategories.some(exc => category.includes(exc))) {
          return false;
        }

        // Exclude recipes with weird/unclear names
        const weirdNames = ['tart', 'cake', 'cookie', 'pie', 'pudding', 'crumble', 'fudge'];
        if (weirdNames.some(weird => name.includes(weird))) {
          return false;
        }

        return true;
      });

      // Filter by meal type
      if (mealType && mealType !== 'any') {
        filtered = filtered.filter(recipe => {
          const category = recipe.category?.toLowerCase() || '';
          const recipeType = recipe.mealType?.toLowerCase() || '';

          if (mealType === 'breakfast') {
            return category.includes('breakfast') || recipeType === 'breakfast';
          } else if (mealType === 'lunch' || mealType === 'dinner') {
            // Show main meals (chicken, beef, seafood, pasta, vegetarian, etc.)
            return !category.includes('breakfast') &&
                   (category.includes('chicken') || category.includes('beef') ||
                    category.includes('seafood') || category.includes('pasta') ||
                    category.includes('pork') || category.includes('vegetarian') ||
                    category.includes('vegan') || category.includes('lamb') ||
                    category.includes('side') || category.includes('starter'));
          } else if (mealType === 'snack' || mealType === 'snacks') {
            return category.includes('starter') || category.includes('side') ||
                   recipe.nutrition.calories < 300;
          }
          return true;
        });
      }

      // Filter by calories
      if (minCalories !== null || maxCalories !== null) {
        filtered = filtered.filter(recipe => {
          const cals = recipe.nutrition.calories;
          if (minCalories !== null && cals < minCalories) return false;
          if (maxCalories !== null && cals > maxCalories) return false;
          return true;
        });
      }

      // Filter by protein
      if (minProtein !== null) {
        filtered = filtered.filter(recipe => recipe.nutrition.protein >= minProtein);
      }

      console.log(`🔍 Found ${filtered.length} recipes matching filters`);
      return filtered;
    } catch (error) {
      console.error('❌ Error searching recipes:', error);
      throw error;
    }
  }

  /**
   * Calculate accurate nutrition from ingredients
   * Ingredients have per-100g nutrition in food object, and quantity in grams
   */
  _calculateNutritionFromIngredients(ingredients) {
    if (!ingredients || ingredients.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ingredients.forEach(ingredient => {
      const { food, quantity } = ingredient;
      if (!food || !quantity) return;

      // Food nutrition is per 100g, quantity is in grams
      const multiplier = quantity / 100;

      totalCalories += (food.calories || 0) * multiplier;
      totalProtein += (food.protein || 0) * multiplier;
      totalCarbs += (food.carbs || 0) * multiplier;
      totalFat += (food.fat || 0) * multiplier;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat)
    };
  }

  /**
   * Get recipe details by ID
   */
  async getRecipeDetails(recipeId) {
    try {
      // Extract TheMealDB ID from our format
      const mealId = recipeId.replace('themealdb_', '');

      const cacheKey = `${CACHE_PREFIX}recipe_${mealId}`;
      const cached = await this._getCached(cacheKey);
      if (cached) return cached;

      const url = `${THEMEALDB_BASE}/lookup.php?i=${mealId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.meals || data.meals.length === 0) {
        throw new Error('Recipe not found');
      }

      const recipe = this._transformRecipe(data.meals[0]);
      await this._setCache(cacheKey, recipe);

      return recipe;
    } catch (error) {
      console.error('❌ Error fetching recipe details:', error);
      throw error;
    }
  }

  /**
   * Get random recipes
   */
  async getRandomRecipes(count = 10) {
    try {
      const recipes = [];

      // Fetch random meals (TheMealDB returns 1 at a time)
      for (let i = 0; i < count; i++) {
        const url = `${THEMEALDB_BASE}/random.php`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.meals && data.meals.length > 0) {
          recipes.push(this._transformRecipe(data.meals[0]));
        }
      }

      return recipes;
    } catch (error) {
      console.error('❌ Error fetching random recipes:', error);
      throw error;
    }
  }

  /**
   * Get all available categories
   */
  async getCategories() {
    try {
      const cacheKey = `${CACHE_PREFIX}categories`;
      const cached = await this._getCached(cacheKey);
      if (cached) return cached;

      const url = `${THEMEALDB_BASE}/categories.php`;
      const response = await fetch(url);
      const data = await response.json();

      const categories = data.categories.map(cat => ({
        name: cat.strCategory,
        description: cat.strCategoryDescription,
        thumbnail: cat.strCategoryThumb,
      }));

      await this._setCache(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get all available cuisines/areas
   */
  async getAreas() {
    try {
      const cacheKey = `${CACHE_PREFIX}areas`;
      const cached = await this._getCached(cacheKey);
      if (cached) return cached;

      const url = `${THEMEALDB_BASE}/list.php?a=list`;
      const response = await fetch(url);
      const data = await response.json();

      const areas = data.meals.map(area => area.strArea);
      await this._setCache(cacheKey, areas);
      return areas;
    } catch (error) {
      console.error('❌ Error fetching areas:', error);
      return [];
    }
  }

  // Private methods

  async _searchByName(query) {
    const queryLower = query.toLowerCase();

    // Search curated meals first
    const curatedResults = CURATED_FITNESS_MEALS.filter(meal =>
      meal.name.toLowerCase().includes(queryLower) ||
      meal.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );

    // Search TheMealDB
    const url = `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();

    const apiResults = data.meals ? data.meals.map(meal => this._transformRecipe(meal)) : [];

    return [...curatedResults, ...apiResults];
  }

  async _filterByCategory(category) {
    const url = `${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.meals) return [];

    // Filter endpoint returns limited info, need to fetch full details
    const detailedRecipes = await Promise.all(
      data.meals.slice(0, 20).map(meal => this.getRecipeDetails(`themealdb_${meal.idMeal}`))
    );

    return detailedRecipes;
  }

  async _filterByArea(area) {
    const url = `${THEMEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.meals) return [];

    // Fetch full details for first 20
    const detailedRecipes = await Promise.all(
      data.meals.slice(0, 20).map(meal => this.getRecipeDetails(`themealdb_${meal.idMeal}`))
    );

    return detailedRecipes;
  }

  async _getAllRecipes() {
    // Get recipes from all letters (a-z)
    const cacheKey = `${CACHE_PREFIX}all_recipes`;
    const cached = await this._getCached(cacheKey);
    if (cached) return cached;

    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const allRecipes = [];

    // Fetch in parallel for speed
    const promises = letters.map(async (letter) => {
      try {
        const url = `${THEMEALDB_BASE}/search.php?f=${letter}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.meals || [];
      } catch (err) {
        console.error(`Error fetching recipes for letter ${letter}:`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(meals => {
      meals.forEach(meal => allRecipes.push(this._transformRecipe(meal)));
    });

    await this._setCache(cacheKey, allRecipes);
    console.log(`📦 Cached ${allRecipes.length} recipes from TheMealDB`);

    return allRecipes;
  }

  _transformRecipe(meal) {
    // Extract ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        // Estimate nutrition based on ingredient name
        const nutrition = this._estimateIngredientNutrition(ingredient, measure);

        ingredients.push({
          food: {
            name: ingredient,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
          },
          quantity: nutrition.quantity,
          unit: nutrition.unit,
          original: `${measure} ${ingredient}`.trim(),
        });
      }
    }

    // Estimate total nutrition
    const totalNutrition = ingredients.reduce((total, ing) => {
      const factor = ing.quantity / 100;
      return {
        calories: total.calories + (ing.food.calories * factor),
        protein: total.protein + (ing.food.protein * factor),
        carbs: total.carbs + (ing.food.carbs * factor),
        fat: total.fat + (ing.food.fat * factor),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Parse instructions into steps
    const instructions = meal.strInstructions
      ? meal.strInstructions.split(/\r?\n/).filter(line => line.trim().length > 0)
      : [];

    // Determine tags
    const tags = [];
    if (meal.strCategory) tags.push(meal.strCategory.toLowerCase());
    if (meal.strArea) tags.push(meal.strArea.toLowerCase());
    if (meal.strTags) {
      meal.strTags.split(',').forEach(tag => tags.push(tag.trim().toLowerCase()));
    }

    // Determine meal type from category
    let mealType = 'any';
    const category = meal.strCategory?.toLowerCase() || '';
    if (category.includes('breakfast')) mealType = 'breakfast';
    else if (category.includes('dessert')) mealType = 'snack';
    else mealType = 'dinner'; // Most meals are lunch/dinner

    return {
      id: `themealdb_${meal.idMeal}`,
      themealdbId: meal.idMeal,
      name: meal.strMeal,
      title: meal.strMeal,
      description: meal.strInstructions?.substring(0, 150) + '...' || '',
      imageUrl: meal.strMealThumb,
      category: meal.strCategory,
      area: meal.strArea,
      mealType,
      tags,
      servings: 4, // TheMealDB doesn't specify, assume 4
      prepTime: '20 minutes', // Estimated
      cookTime: '30 minutes', // Estimated
      readyInMinutes: 50,
      difficulty: 'medium',
      ingredients,
      instructions,
      nutrition: {
        calories: Math.round(totalNutrition.calories / 4), // Per serving
        protein: Math.round(totalNutrition.protein / 4),
        carbs: Math.round(totalNutrition.carbs / 4),
        fat: Math.round(totalNutrition.fat / 4),
        caloriesPerServing: Math.round(totalNutrition.calories / 4),
        proteinPerServing: Math.round(totalNutrition.protein / 4),
        carbsPerServing: Math.round(totalNutrition.carbs / 4),
        fatPerServing: Math.round(totalNutrition.fat / 4),
      },
      source: 'themealdb',
      sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
      youtubeUrl: meal.strYoutube,
      createdAt: new Date().toISOString(),
      createdBy: 'themealdb',
    };
  }

  _estimateIngredientNutrition(ingredientName, measure) {
    const name = ingredientName.toLowerCase();

    // Find matching ingredient in our database
    let nutrition = { calories: 100, protein: 5, carbs: 15, fat: 2 }; // Default

    for (const [key, value] of Object.entries(INGREDIENT_NUTRITION)) {
      if (name.includes(key)) {
        nutrition = value;
        break;
      }
    }

    // Estimate quantity from measure
    let quantity = 100; // Default 100g
    const measureLower = measure?.toLowerCase() || '';

    // Parse common measurements
    if (measureLower.includes('cup')) quantity = 200;
    else if (measureLower.includes('tbsp') || measureLower.includes('tablespoon')) quantity = 15;
    else if (measureLower.includes('tsp') || measureLower.includes('teaspoon')) quantity = 5;
    else if (measureLower.match(/\d+g/)) {
      const match = measureLower.match(/(\d+)g/);
      quantity = parseInt(match[1]);
    } else if (measureLower.match(/\d+\s*oz/)) {
      const match = measureLower.match(/(\d+)\s*oz/);
      quantity = parseInt(match[1]) * 28; // oz to grams
    }

    return {
      ...nutrition,
      quantity,
      unit: 'g',
    };
  }

  async _getCached(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_DURATION) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async _setCache(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching:', error);
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`🗑️ Cleared ${cacheKeys.length} cached entries`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Pre-cache all recipes on app startup
   * Call this during app initialization for instant database searches
   * Returns progress info for loading screen
   */
  async preCacheRecipes(onProgress = null) {
    try {
      console.log('🚀 Starting recipe pre-cache...');

      // Check if already cached
      const cacheKey = `${CACHE_PREFIX}all_recipes`;
      const cached = await this._getCached(cacheKey);

      if (cached) {
        console.log(`✅ Recipes already cached (${cached.length} recipes)`);
        if (onProgress) onProgress({ completed: true, count: cached.length });
        return cached;
      }

      // Not cached yet - fetch all recipes
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const allRecipes = [];
      let completed = 0;

      // Fetch in parallel for speed
      const promises = letters.map(async (letter) => {
        try {
          const url = `${THEMEALDB_BASE}/search.php?f=${letter}`;
          const response = await fetch(url);
          const data = await response.json();

          completed++;
          if (onProgress) {
            onProgress({
              completed: false,
              progress: (completed / letters.length) * 100,
              letter: letter.toUpperCase(),
              total: letters.length,
              current: completed,
            });
          }

          return data.meals || [];
        } catch (err) {
          console.error(`Error fetching recipes for letter ${letter}:`, err);
          completed++;
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach(meals => {
        meals.forEach(meal => allRecipes.push(this._transformRecipe(meal)));
      });

      // Cache the results
      await this._setCache(cacheKey, allRecipes);
      console.log(`✅ Pre-cached ${allRecipes.length} recipes from TheMealDB`);

      if (onProgress) {
        onProgress({ completed: true, count: allRecipes.length });
      }

      return allRecipes;
    } catch (error) {
      console.error('❌ Error pre-caching recipes:', error);
      throw error;
    }
  }

  /**
   * Check if recipes are already cached
   */
  async isCached() {
    const cacheKey = `${CACHE_PREFIX}all_recipes`;
    const cached = await this._getCached(cacheKey);
    return cached !== null;
  }
}

export default new FreeRecipeService();
