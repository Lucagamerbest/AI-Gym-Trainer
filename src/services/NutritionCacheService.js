/**
 * NutritionCacheService - Pre-generates and caches recipes for instant access
 *
 * Strategy: Generate 5 variations of each recipe type (breakfast, lunch, dinner, snack)
 * and high-protein variations when user completes food preferences setup.
 *
 * Benefits:
 * - Instant recipe generation (no AI delay)
 * - Still uses full AI logic (respects dietary restrictions, disliked ingredients)
 * - Variety (5 different variations per type)
 * - Auto-regenerates when food preferences change
 */

import { generateHighProteinRecipe, generateRecipeFromIngredients } from './ai/tools/RecipeTools';
import { getFoodPreferences } from './userProfileService';
import BackendService from './backend/BackendService';

// Recipe types to cache
const RECIPE_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// High-protein variants
const HIGH_PROTEIN_TYPES = ['breakfast', 'lunch', 'dinner'];

// Number of variations per recipe type
const VARIATIONS_PER_TYPE = 5;

// Cache expiration (7 days)
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

class NutritionCacheService {
  /**
   * Generate all cached recipes for a user
   * This is called after food preferences setup or when preferences change
   */
  static async generateAllCachedRecipes(userId) {
    console.log('🔄 [NutritionCache] Starting cache generation for user:', userId);

    try {
      // Get user food preferences
      const foodPrefs = await getFoodPreferences(userId);

      if (!foodPrefs || userId === 'guest') {
        console.log('⚠️ [NutritionCache] Cannot cache for guest user');
        return { success: false, error: 'Guest users cannot use caching' };
      }

      // Generate variations for each recipe type
      const cache = {
        recipes: {},
        highProtein: {},
        lastGenerated: Date.now(),
        profileHash: this.hashFoodPreferences(foodPrefs),
      };

      // Generate regular recipes
      for (const type of RECIPE_TYPES) {
        console.log(`🍳 [NutritionCache] Generating ${VARIATIONS_PER_TYPE} ${type} recipes...`);

        try {
          const variations = await this.generateRecipeVariations(type, foodPrefs, userId, false);
          cache.recipes[type] = variations;
          console.log(`✅ [NutritionCache] Generated ${variations.length} ${type} recipes`);
        } catch (error) {
          console.error(`❌ [NutritionCache] Failed to generate ${type} recipes:`, error);
          cache.recipes[type] = [];
        }
      }

      // Generate high-protein recipes (breakfast, lunch, dinner only)
      for (const type of HIGH_PROTEIN_TYPES) {
        console.log(`💪 [NutritionCache] Generating ${VARIATIONS_PER_TYPE} high-protein ${type} recipes...`);

        try {
          const variations = await this.generateRecipeVariations(type, foodPrefs, userId, true);
          cache.highProtein[type] = variations;
          console.log(`✅ [NutritionCache] Generated ${variations.length} high-protein ${type} recipes`);
        } catch (error) {
          console.error(`❌ [NutritionCache] Failed to generate high-protein ${type}:`, error);
          cache.highProtein[type] = [];
        }
      }

      // Save to Firebase
      await BackendService.setCachedRecipes(userId, cache);

      console.log('✅ [NutritionCache] All recipes cached successfully');
      return { success: true, cache };

    } catch (error) {
      console.error('❌ [NutritionCache] Cache generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate multiple variations of a recipe type
   */
  static async generateRecipeVariations(mealType, foodPrefs, userId, highProtein = false) {
    const variations = [];

    // Get meal-specific calorie targets
    const maxCalories = foodPrefs.mealPreferences?.maxCaloriesPerMeal?.[mealType] || 600;

    // Calculate protein target (35% for high-protein, 25% for regular)
    const proteinPercentage = highProtein ? 0.35 : 0.25;
    const targetProtein = Math.round((maxCalories * proteinPercentage) / 4);

    for (let i = 0; i < VARIATIONS_PER_TYPE; i++) {
      try {
        const result = highProtein
          ? await generateHighProteinRecipe({
              mealType,
              targetCalories: maxCalories,
              targetProtein,
              dietaryRestrictions: foodPrefs.dietaryRestrictions || [],
              dislikedIngredients: foodPrefs.dislikedIngredients || [],
            })
          : await generateRecipeFromIngredients({
              ingredients: this.getCommonIngredients(mealType), // Use common ingredients
              mealType,
              targetCalories: maxCalories,
              dietaryRestrictions: foodPrefs.dietaryRestrictions || [],
              dislikedIngredients: foodPrefs.dislikedIngredients || [],
            });

        if (result.success && result.recipe) {
          variations.push({
            ...result.recipe,
            generatedAt: Date.now(),
            variationIndex: i,
            isHighProtein: highProtein,
          });
        }
      } catch (error) {
        console.error(`❌ [NutritionCache] Failed to generate ${mealType} variation ${i}:`, error);
      }
    }

    return variations;
  }

  /**
   * Get common ingredients for a meal type (for variety in generation)
   */
  static getCommonIngredients(mealType) {
    const ingredientSets = {
      breakfast: [
        ['eggs', 'spinach', 'cheese'],
        ['oats', 'banana', 'protein powder'],
        ['greek yogurt', 'berries', 'honey'],
        ['whole wheat bread', 'avocado', 'eggs'],
        ['cottage cheese', 'fruit', 'nuts'],
      ],
      lunch: [
        ['chicken breast', 'rice', 'broccoli'],
        ['ground turkey', 'pasta', 'tomatoes'],
        ['salmon', 'quinoa', 'asparagus'],
        ['beef', 'sweet potato', 'green beans'],
        ['tuna', 'salad', 'olive oil'],
      ],
      dinner: [
        ['chicken', 'potatoes', 'vegetables'],
        ['fish', 'rice', 'vegetables'],
        ['lean beef', 'pasta', 'sauce'],
        ['pork', 'quinoa', 'vegetables'],
        ['shrimp', 'noodles', 'vegetables'],
      ],
      snack: [
        ['protein bar', 'apple'],
        ['nuts', 'dried fruit'],
        ['cheese', 'crackers'],
        ['hummus', 'vegetables'],
        ['greek yogurt', 'granola'],
      ],
    };

    const sets = ingredientSets[mealType] || ingredientSets.lunch;
    return sets[Math.floor(Math.random() * sets.length)];
  }

  /**
   * Get a cached recipe (random from unseen ones, or any if all seen)
   */
  static async getCachedRecipe(userId, mealType, highProtein = false) {
    console.log(`🔍 [NutritionCache] Fetching cached ${highProtein ? 'high-protein ' : ''}${mealType} recipe for user:`, userId);

    try {
      if (userId === 'guest') {
        console.log('⚠️ [NutritionCache] Guest user, skipping cache');
        return null;
      }

      // Get cache from Firebase
      const cache = await BackendService.getCachedRecipes(userId);

      // Validate cache
      const isValid = await this.isCacheValid(cache, userId);

      if (!isValid) {
        console.log('⚠️ [NutritionCache] Cache invalid or expired, will regenerate');

        // Trigger background regeneration (don't wait for it)
        this.generateAllCachedRecipes(userId).catch(err => {
          console.error('❌ [NutritionCache] Background regeneration failed:', err);
        });

        return null; // Return null to trigger real-time generation
      }

      // Get recipes for this type
      const recipeCategory = highProtein ? cache.highProtein : cache.recipes;
      const recipes = recipeCategory?.[mealType] || [];

      if (recipes.length === 0) {
        console.log(`⚠️ [NutritionCache] No cached ${mealType} recipes found`);
        return null;
      }

      // Get user's recipe usage stats
      const usageStats = await BackendService.getRecipeUsageStats(userId, mealType, highProtein);
      const seenIndices = usageStats?.seenVariations || [];

      // Find unseen recipes
      const unseenRecipes = recipes.filter(r => !seenIndices.includes(r.variationIndex));

      // Pick a recipe (prefer unseen, fallback to random)
      const selectedRecipe = unseenRecipes.length > 0
        ? unseenRecipes[Math.floor(Math.random() * unseenRecipes.length)]
        : recipes[Math.floor(Math.random() * recipes.length)];

      // Mark this variation as seen
      await BackendService.markRecipeAsSeen(userId, mealType, highProtein, selectedRecipe.variationIndex);

      console.log(`✅ [NutritionCache] Retrieved ${mealType} recipe (variation ${selectedRecipe.variationIndex})`);
      return selectedRecipe;

    } catch (error) {
      console.error('❌ [NutritionCache] Failed to get cached recipe:', error);
      return null; // Fallback to real-time generation
    }
  }

  /**
   * Check if cache is valid (not expired, preferences haven't changed)
   */
  static async isCacheValid(cache, userId) {
    if (!cache || !cache.lastGenerated || !cache.recipes) {
      console.log('⚠️ [NutritionCache] Cache missing or incomplete');
      return false;
    }

    // Check age (7 days max)
    const age = Date.now() - cache.lastGenerated;
    if (age > CACHE_MAX_AGE) {
      console.log(`⚠️ [NutritionCache] Cache expired (${Math.round(age / (24 * 60 * 60 * 1000))} days old)`);
      return false;
    }

    // Check if food preferences changed
    const foodPrefs = await getFoodPreferences(userId);
    const currentHash = this.hashFoodPreferences(foodPrefs);

    if (currentHash !== cache.profileHash) {
      console.log('⚠️ [NutritionCache] Food preferences changed, cache invalid');
      return false;
    }

    console.log('✅ [NutritionCache] Cache valid');
    return true;
  }

  /**
   * Hash food preferences to detect changes
   */
  static hashFoodPreferences(foodPrefs) {
    const relevantFields = {
      dietaryRestrictions: foodPrefs.dietaryRestrictions || [],
      dislikedIngredients: foodPrefs.dislikedIngredients || [],
      favoriteCuisines: foodPrefs.favoriteCuisines || [],
      cookingSkill: foodPrefs.cookingSkill || '',
      mealPreferences: foodPrefs.mealPreferences || {},
      recipePreferences: foodPrefs.recipePreferences || {},
    };

    // Simple hash: JSON stringify and sort keys
    const sortedJson = JSON.stringify(relevantFields, Object.keys(relevantFields).sort());
    return sortedJson;
  }

  /**
   * Invalidate cache and regenerate (called when user updates food preferences)
   */
  static async invalidateAndRegenerate(userId) {
    console.log('🔄 [NutritionCache] Invalidating cache and regenerating...');

    try {
      // Delete old cache
      await BackendService.deleteCachedRecipes(userId);

      // Generate new cache in background
      this.generateAllCachedRecipes(userId).catch(err => {
        console.error('❌ [NutritionCache] Background regeneration failed:', err);
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [NutritionCache] Failed to invalidate cache:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cache status (for debugging/UI display)
   */
  static async getCacheStatus(userId) {
    try {
      const cache = await BackendService.getCachedRecipes(userId);

      if (!cache || !cache.recipes) {
        return {
          exists: false,
          message: 'No cache found',
        };
      }

      const age = Date.now() - cache.lastGenerated;
      const daysOld = Math.round(age / (24 * 60 * 60 * 1000));
      const isValid = await this.isCacheValid(cache, userId);

      const recipeCounts = {};
      for (const type of RECIPE_TYPES) {
        recipeCounts[type] = cache.recipes[type]?.length || 0;
      }

      const highProteinCounts = {};
      for (const type of HIGH_PROTEIN_TYPES) {
        highProteinCounts[type] = cache.highProtein?.[type]?.length || 0;
      }

      return {
        exists: true,
        valid: isValid,
        age: daysOld,
        lastGenerated: new Date(cache.lastGenerated).toLocaleString(),
        recipeCounts,
        highProteinCounts,
        profileHash: cache.profileHash?.substring(0, 20) + '...',
      };

    } catch (error) {
      console.error('❌ [NutritionCache] Failed to get cache status:', error);
      return {
        exists: false,
        error: error.message,
      };
    }
  }
}

export default NutritionCacheService;
