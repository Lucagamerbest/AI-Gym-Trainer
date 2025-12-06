// Unified Food Search Service
// Provides consistent search results across all screens with accurate nutrition data
//
// 3-Tier Search System:
// 1. CURATED DATABASE - Fast (<50ms), offline, high-quality (PRIMARY)
// 2. LOCAL OVERRIDES - Manual corrections for common foods
// 3. EXTERNAL APIS - USDA, Open Food Facts (FALLBACK)

import { searchFoods } from './foodDatabaseService';
import { smartSearchFoods } from './smartFoodSearch';
import { hybridSearch } from './openFoodFactsService';
import curatedFoodDatabase from './curatedFoodDatabase';
import userContributedFoods from './userContributedFoods';
import restaurantData from '../data/restaurantDatabase.json';

/**
 * Search restaurant menu items
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return
 * @returns {Array} Array of matching restaurant food items
 */
const searchRestaurantFoods = (query, maxResults = 20) => {
  if (!query || query.trim().length < 2) return [];

  const queryLower = query.toLowerCase().trim();
  const searchTerms = queryLower.split(/\s+/);
  const results = [];

  for (const restaurant of restaurantData.restaurants) {
    const restaurantNameLower = restaurant.name.toLowerCase();

    for (const item of restaurant.menu) {
      const itemNameLower = item.name.toLowerCase();
      let score = 0;

      // Check if any search term matches
      for (const term of searchTerms) {
        if (term.length < 2) continue;

        // Item name match (highest priority)
        if (itemNameLower.includes(term)) {
          score += 100;
        }
        // Restaurant name match
        if (restaurantNameLower.includes(term)) {
          score += 50;
        }
        // Category match
        if (item.category.toLowerCase().includes(term)) {
          score += 25;
        }
      }

      if (score > 0) {
        results.push({
          id: `${restaurant.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.name,
          brand: restaurant.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          serving_size: item.serving,
          serving_quantity: 1,
          category: item.category,
          source: 'restaurant',
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          restaurant_color: restaurant.color,
          relevanceScore: score,
        });
      }
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
};

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
    localOnly = false,
    minProtein = null,
    maxCalories = null,
    minCalories = null,
    category = null,
  } = options;

  if (!query || !query.trim()) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const startTime = Date.now();

  // ═══════════════════════════════════════════════════════════════
  // TIER 1: USER FOODS + RESTAURANT + CURATED DATABASE (Fast, Offline, High Quality)
  // ═══════════════════════════════════════════════════════════════
  let curatedResultsForLater = [];
  let userFoodsResults = [];
  let restaurantResults = [];

  // Search user contributed foods first (highest priority for user's own foods)
  try {
    userFoodsResults = await userContributedFoods.search(query, {
      maxResults: 10,
      category,
    });
    if (userFoodsResults.length > 0) {
    }
  } catch (error) {
  }

  // Search restaurant menu items
  try {
    restaurantResults = searchRestaurantFoods(query, 10);
    if (restaurantResults.length > 0) {
    }
  } catch (error) {
  }

  try {
    const curatedResults = curatedFoodDatabase.searchForApp(query, {
      maxResults: limit,
      minProtein,
      maxCalories,
      minCalories,
      category,
    });

    curatedResultsForLater = curatedResults; // Save for later use

    const tier1Time = Date.now() - startTime;

    // Combine user foods (first), then restaurant foods, then curated results
    const tier1Combined = [...userFoodsResults, ...restaurantResults, ...curatedResults];

    // If we have ANY tier 1 results and NOT explicitly asking for API, return them
    // This prevents waiting for slow APIs when we have good local data
    if (tier1Combined.length >= 1 && !includeAPI) {
      return tier1Combined.slice(0, limit);
    }
  } catch (error) {
  }

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: LOCAL OVERRIDES + EXISTING DATABASE
  // ═══════════════════════════════════════════════════════════════

  // Check for accurate overrides
  const overrideResults = [];
  for (const [key, food] of Object.entries(ACCURATE_FOOD_OVERRIDES)) {
    if (key.includes(queryLower) || queryLower.includes(key)) {
      overrideResults.push({
        ...food,
        relevanceScore: 10000,  // Highest priority
        source: 'override',
      });
    }
  }

  try {
    // Search local database
    const localResults = await searchFoods(query);

    // Get curated results to merge
    let curatedResults = [];
    try {
      curatedResults = curatedFoodDatabase.searchForApp(query, { maxResults: 20 });
    } catch (e) {
      // Ignore curated errors
    }

    // Filter out inaccurate entries if we have overrides
    const filteredLocal = localResults.filter(food => {
      const foodNameLower = food.name.toLowerCase();
      // Skip local results that match our override keys
      return !Object.keys(ACCURATE_FOOD_OVERRIDES).some(key =>
        foodNameLower.includes(key) && overrideResults.length > 0
      );
    });

    // Combine: User foods first, restaurant foods, then curated, overrides, then filtered local
    const combinedLocal = [
      ...userFoodsResults,
      ...restaurantResults,
      ...curatedResults,
      ...overrideResults,
      ...filteredLocal,
    ];

    // Get the main search terms (ignore modifiers)
    const modifiers = ['frozen', 'fresh', 'raw', 'cooked', 'grilled', 'baked', 'fried', 'steamed', 'organic', 'natural', 'the', 'a', 'an', 'of', 'with'];
    const mainSearchTerms = queryLower.split(/\s+/).filter(term =>
      term.length > 2 && !modifiers.includes(term)
    );

    // Helper function to check if a food name matches a search term
    const matchesTerm = (nameLower, term) => {
      if (!term || term.length < 2) return true; // Empty term matches everything

      // Direct match
      if (nameLower.includes(term)) return true;

      // Plural/singular variations
      if (term.endsWith('s') && nameLower.includes(term.slice(0, -1))) return true;
      if (!term.endsWith('s') && nameLower.includes(term + 's')) return true;

      // 'y' -> 'ies' conversion
      if (term.endsWith('y') && nameLower.includes(term.slice(0, -1) + 'ies')) return true;
      if (term.endsWith('ies') && nameLower.includes(term.slice(0, -3) + 'y')) return true;

      // Common spelling variations (pita/pitta, yogurt/yoghurt, etc.)
      const spellingVariations = {
        'pita': ['pitta', 'pitas', 'pittas'],
        'pitta': ['pita', 'pitas', 'pittas'],
        'yogurt': ['yoghurt', 'yogurts', 'yoghurts'],
        'yoghurt': ['yogurt', 'yogurts', 'yoghurts'],
        'donut': ['doughnut', 'donuts', 'doughnuts'],
        'doughnut': ['donut', 'donuts', 'doughnuts'],
        'fiber': ['fibre'],
        'fibre': ['fiber'],
      };

      if (spellingVariations[term]) {
        for (const variant of spellingVariations[term]) {
          if (nameLower.includes(variant)) return true;
        }
      }

      // Fuzzy match - allow 1 character difference for terms > 4 chars
      if (term.length > 4) {
        const words = nameLower.split(/\s+/);
        for (const word of words) {
          if (word.length >= term.length - 1 && word.length <= term.length + 1) {
            let diff = 0;
            const minLen = Math.min(word.length, term.length);
            for (let i = 0; i < minLen; i++) {
              if (word[i] !== term[i]) diff++;
              if (diff > 1) break;
            }
            if (diff <= 1) return true;
          }
        }
      }

      return false;
    };

    // Remove duplicates, junk data, and irrelevant results
    const seen = new Set();
    const dedupedLocal = combinedLocal.filter(food => {
      // Remove duplicates
      const key = (food.name || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);

      // Remove foods with no nutritional value (0 protein, 0 carbs, 0 fat)
      const hasNoNutrition = (
        (!food.protein || food.protein === 0) &&
        (!food.carbs || food.carbs === 0) &&
        (!food.fat || food.fat === 0)
      );
      if (hasNoNutrition) return false;

      // Remove foods with 0 calories
      if (!food.calories || food.calories === 0) return false;

      // STRICT MATCHING: Food name MUST contain at least one main search term
      const nameLower = key;
      const matchesMainTerm = mainSearchTerms.length === 0 || mainSearchTerms.some(term => matchesTerm(nameLower, term));

      if (!matchesMainTerm) return false;

      // Skip foods with non-Latin characters in parentheses (foreign text)
      // Allow apostrophes, ampersands, and common punctuation
      if (/\([^)]*[^\w\s,.\-()''&/]+[^)]*\)/.test(food.name || '')) return false;

      return true;
    });

    // Apply smart ranking
    const rankedResults = await smartSearchFoods(dedupedLocal, query, {
      limit: includeAPI ? 100 : limit,
      includeCategories: false,
      includeSuggestions: false
    });

    const tier2Time = Date.now() - startTime;

    // If local only or no API needed, return now
    if (localOnly || !includeAPI) {
      return rankedResults.all.slice(0, limit);
    }

    // ═══════════════════════════════════════════════════════════════
    // TIER 3: EXTERNAL APIS (Fallback for rare foods)
    // ═══════════════════════════════════════════════════════════════

    // For FoodSearchScreen: include API results with TIMEOUT
    // If API takes too long, return local results instead
    const API_TIMEOUT_MS = 8000; // 8 seconds max for API

    let apiResults = { combined: rankedResults.all };
    try {
      const apiPromise = hybridSearch(query, rankedResults.all.slice(0, 20));
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), API_TIMEOUT_MS)
      );

      apiResults = await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      // Return local results if API times out or fails
      return rankedResults.all.slice(0, limit);
    }

    const { combined } = apiResults;

    // Filter out junk data and irrelevant results (reuse mainSearchTerms from above)
    const filtered = combined.filter(food => {
      // IMPORTANT: Remove foods with no nutritional value (0 protein, 0 carbs, 0 fat)
      const hasNoNutrition = (
        (!food.protein || food.protein === 0) &&
        (!food.carbs || food.carbs === 0) &&
        (!food.fat || food.fat === 0)
      );
      if (hasNoNutrition) {
        return false;
      }

      // Remove foods with 0 calories (incomplete data)
      if (!food.calories || food.calories === 0) {
        return false;
      }

      const nameLower = (food.name || '').toLowerCase();

      // STRICT MATCHING: Food name MUST contain at least one main search term
      const matchesMainTerm = mainSearchTerms.length === 0 || mainSearchTerms.some(term => matchesTerm(nameLower, term));

      if (!matchesMainTerm) {
        return false;
      }

      // Skip overly long/specific branded products
      if (food.brand && nameLower.split(' ').length > 6) {
        return false;
      }

      // Skip foods with non-Latin characters in parentheses (foreign text)
      // Allow apostrophes, ampersands, and common punctuation
      if (/\([^)]*[^\w\s,.\-()''&/]+[^)]*\)/.test(food.name)) {
        return false;
      }

      return true;
    });

    // Final ranking
    const finalRanked = await smartSearchFoods(filtered, query, { limit });

    const totalTime = Date.now() - startTime;

    return finalRanked.all;

  } catch (error) {
    console.error('❌ Unified search error:', error.message);

    // Fallback to user foods + restaurant + curated + overrides
    let fallbackResults = [...userFoodsResults, ...restaurantResults, ...overrideResults];
    try {
      const curatedFallback = curatedFoodDatabase.searchForApp(query, { maxResults: limit });
      fallbackResults = [...userFoodsResults, ...restaurantResults, ...curatedFallback, ...overrideResults];
    } catch (e) {
      // Last resort: user foods + restaurant + overrides + basic local
      const localResults = await searchFoods(query);
      fallbackResults = [...userFoodsResults, ...restaurantResults, ...overrideResults, ...localResults];
    }

    return fallbackResults.slice(0, limit);
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