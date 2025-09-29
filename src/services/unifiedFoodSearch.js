// Unified Food Search Service
// Provides consistent search results across all screens with accurate nutrition data

import { searchFoods } from './foodDatabaseService';
import { smartSearchFoods } from './smartFoodSearch';
import { hybridSearch } from './openFoodFactsService';

// Accurate common food entries that often have confusing database entries
const ACCURATE_FOOD_OVERRIDES = {
  'egg whites': {
    name: 'Egg Whites (liquid)',
    calories: 52,  // per 100g
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
    serving_size: '100g',
    category: 'Proteins',
    brand: '',
    verified: true,
    common_servings: [
      { label: '1 large egg white (33g)', value: 33 },
      { label: '3 egg whites (100g)', value: 100 },
      { label: '4 egg whites (132g)', value: 132 },
      { label: '6 egg whites (200g)', value: 200 },
      { label: '1 cup (243g)', value: 243 }
    ]
  },
  'egg white': {
    name: 'Egg White (from 1 large egg)',
    calories: 17,  // per egg white (33g)
    protein: 3.6,
    carbs: 0.2,
    fat: 0.1,
    serving_size: '1 egg white (33g)',
    serving_quantity: 33,
    category: 'Proteins',
    brand: '',
    verified: true
  },
  'feta cheese': {
    name: 'Feta Cheese',
    calories: 264,  // per 100g
    protein: 14.2,
    carbs: 4.1,
    fat: 21.3,
    serving_size: '100g',
    category: 'Dairy',
    brand: '',
    verified: true,
    common_servings: [
      { label: '1 oz (28g)', value: 28 },
      { label: '1/4 cup crumbled (38g)', value: 38 },
      { label: '1/2 cup crumbled (75g)', value: 75 },
      { label: '100g', value: 100 }
    ]
  },
  'chicken breast': {
    name: 'Chicken Breast (boneless, skinless, cooked)',
    calories: 165,  // per 100g cooked
    protein: 31,
    carbs: 0,
    fat: 3.6,
    serving_size: '100g',
    category: 'Proteins',
    brand: '',
    verified: true,
    common_servings: [
      { label: '3 oz (85g)', value: 85 },
      { label: '4 oz (113g)', value: 113 },
      { label: '6 oz (170g)', value: 170 },
      { label: '8 oz (227g)', value: 227 },
      { label: '1 breast (174g)', value: 174 }
    ]
  },
  'chicken breast raw': {
    name: 'Chicken Breast (boneless, skinless, raw)',
    calories: 120,  // per 100g raw
    protein: 22.5,
    carbs: 0,
    fat: 2.6,
    serving_size: '100g',
    category: 'Proteins',
    brand: '',
    verified: true
  }
};

/**
 * Unified search function used by all screens
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {boolean} options.includeAPI - Whether to include API results (slower but more comprehensive)
 * @param {number} options.limit - Maximum number of results
 * @param {number} options.debounceMs - Debounce time in milliseconds
 * @returns {Promise<Array>} Array of food items
 */
export const unifiedFoodSearch = async (query, options = {}) => {
  const {
    includeAPI = false,  // Only FoodSearchScreen should use API
    limit = 50,
    localOnly = false
  } = options;

  if (!query || !query.trim()) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();

  // Check for accurate overrides first
  const overrideResults = [];
  for (const [key, food] of Object.entries(ACCURATE_FOOD_OVERRIDES)) {
    if (key.includes(queryLower) || queryLower.includes(key)) {
      overrideResults.push({
        ...food,
        relevanceScore: 10000  // Highest priority
      });
    }
  }

  try {
    // Search local database
    const localResults = await searchFoods(query);

    // Filter out inaccurate entries if we have overrides
    const filteredLocal = localResults.filter(food => {
      const foodNameLower = food.name.toLowerCase();
      // Skip local results that match our override keys
      return !Object.keys(ACCURATE_FOOD_OVERRIDES).some(key =>
        foodNameLower.includes(key) && overrideResults.length > 0
      );
    });

    // Combine overrides with filtered local results
    const combinedLocal = [...overrideResults, ...filteredLocal];

    // Apply smart ranking
    const rankedResults = await smartSearchFoods(combinedLocal, query, {
      limit: includeAPI ? 100 : limit,
      includeCategories: false,
      includeSuggestions: false
    });

    // If local only or no API needed, return now
    if (localOnly || !includeAPI) {
      return rankedResults.all.slice(0, limit);
    }

    // For FoodSearchScreen: include API results
    const { combined } = await hybridSearch(query, rankedResults.all.slice(0, 20));

    // Filter out overly specific products
    const filtered = combined.filter(food => {
      const nameLower = food.name.toLowerCase();

      // Keep whole foods
      if (!food.brand && food.category) return true;

      // Keep if it's a close match
      if (nameLower.includes(queryLower)) return true;

      // Skip overly specific branded products
      if (food.brand && nameLower.split(' ').length > 5) return false;

      return true;
    });

    // Final ranking
    const finalRanked = await smartSearchFoods(filtered, query, { limit });
    return finalRanked.all;

  } catch (error) {
    console.error('Unified search error:', error);
    // Fallback to overrides + basic local search
    const localResults = await searchFoods(query);
    return [...overrideResults, ...localResults].slice(0, limit);
  }
};

/**
 * Get accurate food entry by exact name
 * @param {string} name - Exact food name
 * @returns {Object|null} Food object or null if not found
 */
export const getAccurateFood = (name) => {
  const nameLower = name.toLowerCase();
  return ACCURATE_FOOD_OVERRIDES[nameLower] || null;
};

/**
 * Get common serving sizes for a food
 * @param {Object} food - Food object
 * @returns {Array} Array of common serving sizes
 */
export const getCommonServings = (food) => {
  // Check if food has common servings defined
  if (food.common_servings) {
    return food.common_servings;
  }

  // Check overrides
  const accurate = getAccurateFood(food.name);
  if (accurate && accurate.common_servings) {
    return accurate.common_servings;
  }

  // Default servings based on category
  const category = food.category?.toLowerCase() || '';

  if (category.includes('protein') || food.name.toLowerCase().includes('chicken') ||
      food.name.toLowerCase().includes('beef') || food.name.toLowerCase().includes('fish')) {
    return [
      { label: '3 oz (85g)', value: 85 },
      { label: '4 oz (113g)', value: 113 },
      { label: '6 oz (170g)', value: 170 },
      { label: '8 oz (227g)', value: 227 },
      { label: '100g', value: 100 }
    ];
  }

  if (category.includes('liquid') || food.name.toLowerCase().includes('milk') ||
      food.name.toLowerCase().includes('juice')) {
    return [
      { label: '1 cup (240ml)', value: 240 },
      { label: '12 oz (355ml)', value: 355 },
      { label: '16 oz (473ml)', value: 473 },
      { label: '100ml', value: 100 }
    ];
  }

  // Default servings
  return [
    { label: '100g', value: 100 },
    { label: '1 serving', value: food.serving_quantity || 100 },
    { label: '1 cup (240g)', value: 240 },
    { label: '1 oz (28g)', value: 28 }
  ];
};