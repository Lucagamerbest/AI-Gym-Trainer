/**
 * Spoonacular API Service
 *
 * Provides access to 365,000+ recipes with detailed nutrition information
 * Free tier: 150 requests/day
 * Documentation: https://spoonacular.com/food-api/docs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOONACULAR_API_KEY = 'YOUR_API_KEY_HERE'; // TODO: Get from environment or settings
const BASE_URL = 'https://api.spoonacular.com';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = '@spoonacular_cache_';

class SpoonacularService {
  constructor() {
    this.apiKey = SPOONACULAR_API_KEY;
  }

  /**
   * Search recipes with advanced filters
   * @param {object} filters - Search filters
   * @returns {Promise<Array>} Array of recipes
   */
  async searchRecipes({
    query = '',
    mealType = null, // breakfast, lunch, dinner, snack, dessert
    minCalories = null,
    maxCalories = null,
    minProtein = null,
    maxProtein = null,
    diet = null, // vegetarian, vegan, gluten-free, ketogenic, etc.
    intolerances = [], // dairy, egg, gluten, peanut, etc.
    cuisine = null, // italian, mexican, american, asian, etc.
    maxReadyTime = null, // minutes
    sort = 'popularity', // popularity, healthiness, price, time, random
    number = 20, // results per page (max 100)
    offset = 0, // pagination offset
  } = {}) {
    try {
      // Build cache key
      const cacheKey = `${CACHE_PREFIX}search_${JSON.stringify({
        query, mealType, minCalories, maxCalories, minProtein, maxProtein,
        diet, intolerances, cuisine, maxReadyTime, sort, number, offset
      })}`;

      // Check cache first
      const cached = await this._getCached(cacheKey);
      if (cached) {
        return cached;
      }

      // Build query parameters
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        number,
        offset,
        sort,
        addRecipeNutrition: true, // Include nutrition info
        fillIngredients: true, // Include ingredient details
      });

      if (query) params.append('query', query);
      if (mealType) params.append('type', mealType);
      if (minCalories) params.append('minCalories', minCalories);
      if (maxCalories) params.append('maxCalories', maxCalories);
      if (minProtein) params.append('minProtein', minProtein);
      if (maxProtein) params.append('maxProtein', maxProtein);
      if (diet) params.append('diet', diet);
      if (intolerances.length > 0) params.append('intolerances', intolerances.join(','));
      if (cuisine) params.append('cuisine', cuisine);
      if (maxReadyTime) params.append('maxReadyTime', maxReadyTime);

      const url = `${BASE_URL}/recipes/complexSearch?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format
      const recipes = data.results.map(recipe => this._transformRecipe(recipe));

      // Cache results
      await this._setCache(cacheKey, recipes);

      return recipes;
    } catch (error) {
      console.error('❌ Error searching recipes:', error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information
   * @param {string|number} recipeId - Spoonacular recipe ID
   * @returns {Promise<object>} Detailed recipe object
   */
  async getRecipeDetails(recipeId) {
    try {
      const cacheKey = `${CACHE_PREFIX}recipe_${recipeId}`;

      // Check cache first
      const cached = await this._getCached(cacheKey);
      if (cached) {
        return cached;
      }

      const url = `${BASE_URL}/recipes/${recipeId}/information?apiKey=${this.apiKey}&includeNutrition=true`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format
      const recipe = this._transformDetailedRecipe(data);

      // Cache result
      await this._setCache(cacheKey, recipe);

      return recipe;
    } catch (error) {
      console.error('❌ Error fetching recipe details:', error);
      throw error;
    }
  }

  /**
   * Get random recipes (useful for discovery)
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} Array of random recipes
   */
  async getRandomRecipes({
    number = 10,
    tags = [], // e.g., ['vegetarian', 'dessert']
  } = {}) {
    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        number,
      });

      if (tags.length > 0) {
        params.append('tags', tags.join(','));
      }

      const url = `${BASE_URL}/recipes/random?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format
      const recipes = data.recipes.map(recipe => this._transformDetailedRecipe(recipe));

      return recipes;
    } catch (error) {
      console.error('❌ Error fetching random recipes:', error);
      throw error;
    }
  }

  /**
   * Transform Spoonacular recipe to our format (from search results)
   */
  _transformRecipe(spoonacularRecipe) {
    const nutrition = spoonacularRecipe.nutrition || {};
    const nutrients = nutrition.nutrients || [];

    // Extract key nutrients
    const getNutrient = (name) => {
      const nutrient = nutrients.find(n => n.name === name);
      return nutrient ? Math.round(nutrient.amount) : 0;
    };

    return {
      id: `spoonacular_${spoonacularRecipe.id}`,
      spoonacularId: spoonacularRecipe.id,
      name: spoonacularRecipe.title,
      imageUrl: spoonacularRecipe.image,
      servings: spoonacularRecipe.servings || 1,
      readyInMinutes: spoonacularRecipe.readyInMinutes || 30,
      nutrition: {
        calories: getNutrient('Calories'),
        protein: getNutrient('Protein'),
        carbs: getNutrient('Carbohydrates'),
        fat: getNutrient('Fat'),
        caloriesPerServing: getNutrient('Calories'),
        proteinPerServing: getNutrient('Protein'),
        carbsPerServing: getNutrient('Carbohydrates'),
        fatPerServing: getNutrient('Fat'),
      },
      // Will be populated when fetching full details
      ingredients: [],
      instructions: [],
      source: 'spoonacular',
      sourceUrl: spoonacularRecipe.sourceUrl,
    };
  }

  /**
   * Transform detailed Spoonacular recipe to our format
   */
  _transformDetailedRecipe(spoonacularRecipe) {
    const nutrition = spoonacularRecipe.nutrition || {};
    const nutrients = nutrition.nutrients || [];

    // Extract key nutrients
    const getNutrient = (name) => {
      const nutrient = nutrients.find(n => n.name === name);
      return nutrient ? Math.round(nutrient.amount) : 0;
    };

    // Parse instructions
    const instructions = [];
    if (spoonacularRecipe.analyzedInstructions && spoonacularRecipe.analyzedInstructions.length > 0) {
      const steps = spoonacularRecipe.analyzedInstructions[0].steps || [];
      steps.forEach(step => {
        instructions.push(step.step);
      });
    } else if (spoonacularRecipe.instructions) {
      // Fallback to raw instructions
      instructions.push(spoonacularRecipe.instructions);
    }

    // Parse ingredients
    const ingredients = (spoonacularRecipe.extendedIngredients || []).map(ing => {
      // Try to extract nutrition per ingredient (if available)
      const ingNutrition = ing.nutrition || {};
      const ingNutrients = ingNutrition.nutrients || [];

      const getIngNutrient = (name) => {
        const nutrient = ingNutrients.find(n => n.name === name);
        return nutrient ? Math.round(nutrient.amount) : 0;
      };

      return {
        food: {
          name: ing.name,
          calories: getIngNutrient('Calories'),
          protein: getIngNutrient('Protein'),
          carbs: getIngNutrient('Carbohydrates'),
          fat: getIngNutrient('Fat'),
        },
        quantity: ing.amount || 100,
        unit: ing.unit || 'g',
        original: ing.original, // Original text like "2 cups flour"
      };
    });

    // Extract tags
    const tags = [];
    if (spoonacularRecipe.vegetarian) tags.push('vegetarian');
    if (spoonacularRecipe.vegan) tags.push('vegan');
    if (spoonacularRecipe.glutenFree) tags.push('gluten-free');
    if (spoonacularRecipe.dairyFree) tags.push('dairy-free');
    if (spoonacularRecipe.veryHealthy) tags.push('healthy');
    if (spoonacularRecipe.cheap) tags.push('budget-friendly');
    if (spoonacularRecipe.veryPopular) tags.push('popular');

    // Determine meal type from dish types
    let mealType = 'any';
    const dishTypes = spoonacularRecipe.dishTypes || [];
    if (dishTypes.includes('breakfast') || dishTypes.includes('brunch')) mealType = 'breakfast';
    else if (dishTypes.includes('lunch')) mealType = 'lunch';
    else if (dishTypes.includes('dinner')) mealType = 'dinner';
    else if (dishTypes.includes('snack') || dishTypes.includes('appetizer')) mealType = 'snack';

    // Determine if sweet or salty
    if (dishTypes.includes('dessert') || dishTypes.includes('sweet')) tags.push('sweet');

    // Add cuisine tags
    const cuisines = spoonacularRecipe.cuisines || [];
    cuisines.forEach(cuisine => tags.push(cuisine.toLowerCase()));

    return {
      id: `spoonacular_${spoonacularRecipe.id}`,
      spoonacularId: spoonacularRecipe.id,
      name: spoonacularRecipe.title,
      title: spoonacularRecipe.title,
      description: spoonacularRecipe.summary ? spoonacularRecipe.summary.replace(/<[^>]*>/g, '') : '', // Strip HTML
      imageUrl: spoonacularRecipe.image,
      servings: spoonacularRecipe.servings || 1,
      prepTime: `${spoonacularRecipe.preparationMinutes || 15} minutes`,
      cookTime: `${spoonacularRecipe.cookingMinutes || 15} minutes`,
      readyInMinutes: spoonacularRecipe.readyInMinutes || 30,
      difficulty: spoonacularRecipe.readyInMinutes < 20 ? 'easy' : spoonacularRecipe.readyInMinutes < 45 ? 'medium' : 'hard',
      mealType,
      tags,
      ingredients,
      instructions,
      nutrition: {
        calories: getNutrient('Calories'),
        protein: getNutrient('Protein'),
        carbs: getNutrient('Carbohydrates'),
        fat: getNutrient('Fat'),
        caloriesPerServing: getNutrient('Calories'),
        proteinPerServing: getNutrient('Protein'),
        carbsPerServing: getNutrient('Carbohydrates'),
        fatPerServing: getNutrient('Fat'),
      },
      source: 'spoonacular',
      sourceUrl: spoonacularRecipe.sourceUrl,
      spoonacularScore: spoonacularRecipe.spoonacularScore || 0,
      healthScore: spoonacularRecipe.healthScore || 0,
      pricePerServing: spoonacularRecipe.pricePerServing || 0,
      createdAt: new Date().toISOString(),
      createdBy: 'spoonacular',
    };
  }

  /**
   * Get cached data
   */
  async _getCached(key) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_DURATION) {
        // Cache expired
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async _setCache(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  /**
   * Clear all cached recipe data
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default new SpoonacularService();
