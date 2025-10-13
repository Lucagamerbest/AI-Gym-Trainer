// Enhanced food database service with comprehensive local data and smart API fetching
// Uses comprehensive local database + API caching for optimal performance
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { comprehensiveFoods } from './comprehensiveFoodDatabase';
import { foodAPI } from './foodAPI';

// Conditionally import the appropriate implementation
let foodDatabase;

// For now, always use the web version since SQLite is causing issues
// TODO: Fix SQLite implementation for mobile
foodDatabase = require('./foodDatabase.web');

// Cache keys
const API_CACHE_KEY = '@api_cache';
const DB_INITIALIZED_KEY = '@db_initialized_v2';
const MAX_CACHE_SIZE = 500;

// Enhanced initialization with comprehensive food data
export const initDatabase = async () => {
  await foodDatabase.initDatabase();

  try {
    // Check if we already initialized with comprehensive data
    const isInitialized = await AsyncStorage.getItem(DB_INITIALIZED_KEY);

    if (!isInitialized) {
      // Add all comprehensive foods to database
      let addedCount = 0;
      for (const food of comprehensiveFoods) {
        try {
          await foodDatabase.saveFood(food);
          addedCount++;
        } catch (error) {
          // Silent error handling for duplicates
        }
      }

      await AsyncStorage.setItem(DB_INITIALIZED_KEY, 'true');
    }
  } catch (error) {
    console.error('Error initializing comprehensive database:', error);
  }
};

// Helper function to validate and fix food nutrition data
const validateAndFixFoodNutrition = (food) => {
  if (!food || !food.nutrition && (!food.calories && !food.protein && !food.carbs && !food.fat)) {
    return null; // Skip foods with no nutrition data
  }

  // Handle both direct properties and nutrition object
  const calories = food.nutrition?.calories || food.calories || 0;
  const protein = food.nutrition?.protein || food.protein || 0;
  const carbs = food.nutrition?.carbs || food.carbs || 0;
  const fat = food.nutrition?.fat || food.fat || 0;

  // Calculate calories from macros if missing or zero
  let calculatedCalories = calories;
  if (calories === 0 || calories === null || calories === undefined) {
    if (protein > 0 || carbs > 0 || fat > 0) {
      calculatedCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
    }
  }

  // Skip foods that still have zero calories after calculation
  if (calculatedCalories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    return null;
  }

  // Return food with corrected nutrition data
  const correctedFood = { ...food };
  if (food.nutrition) {
    correctedFood.nutrition = {
      ...food.nutrition,
      calories: calculatedCalories
    };
  } else {
    correctedFood.calories = calculatedCalories;
  }

  return correctedFood;
};

// Enhanced search that prioritizes local comprehensive data
export const searchFoods = async (searchQuery) => {
  try {
    const query = searchQuery ? searchQuery.trim() : '';

    // Always search local database first (includes comprehensive foods)
    const localResults = await foodDatabase.searchFoods(query);

    // Filter and fix zero-calorie foods from local results
    const validLocalResults = localResults
      .map(validateAndFixFoodNutrition)
      .filter(Boolean);

    // If we have good local results or empty query, return them
    if (validLocalResults.length > 10 || !query) {
      return validLocalResults;
    }

    // For specific searches with few local results, enhance with API
    if (query.length > 2) {
      try {
        // Check cache first
        const cachedResults = await getCachedSearchResults(query);
        if (cachedResults.length > 0) {
          // Filter and fix cached results
          const validCachedResults = cachedResults
            .map(validateAndFixFoodNutrition)
            .filter(Boolean);

          // Combine local and cached results, removing duplicates
          const combined = [...validLocalResults];
          const existingNames = new Set(validLocalResults.map(f => f.name?.toLowerCase()));

          for (const cached of validCachedResults) {
            if (!existingNames.has(cached.name?.toLowerCase())) {
              combined.push(cached);
            }
          }
          return combined;
        }

        // Try API if not in cache and we have few local results
        if (validLocalResults.length < 5) {
          const apiResults = await foodAPI.searchFood(query);

          if (apiResults.length > 0) {
            // Filter and fix API results
            const validApiResults = apiResults
              .map(validateAndFixFoodNutrition)
              .filter(Boolean);

            if (validApiResults.length > 0) {
              // Cache the valid results
              await cacheSearchResults(query, validApiResults);

              // Save top API results to local database for future use
              const topResults = validApiResults.slice(0, 10);
              for (const food of topResults) {
                try {
                  await saveFoodFromAPI(food);
                } catch (error) {
                  // Silent error
                }
              }

              // Combine local and API results, removing duplicates
              const combined = [...validLocalResults];
              const existingNames = new Set(validLocalResults.map(f => f.name?.toLowerCase()));

              for (const apiFood of validApiResults) {
                if (!existingNames.has(apiFood.name?.toLowerCase())) {
                  combined.push(apiFood);
                }
              }

              return combined;
            }
          }
        }
      } catch (error) {
        // API search failed, using local results only
      }
    }

    return validLocalResults;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// Enhanced barcode lookup with caching
export const getFoodByBarcode = async (barcode) => {
  try {
    // First check local database
    const localFood = await foodDatabase.getFoodByBarcode(barcode);
    if (localFood) {
      return localFood;
    }

    // Check cache
    const cachedFood = await getCachedBarcode(barcode);
    if (cachedFood) {
      return cachedFood;
    }

    // Try API
    const apiResult = await foodAPI.getProductByBarcode(barcode);
    if (apiResult && apiResult.found) {
      // Validate and fix nutrition data
      const validatedResult = validateAndFixFoodNutrition(apiResult);

      if (validatedResult) {
        // Save to cache
        await cacheBarcode(barcode, validatedResult);

        // Save to local database
        await saveFoodFromAPI(validatedResult);

        return validatedResult;
      }
    }
  } catch (error) {
    console.error('Barcode lookup failed:', error);
  }

  return null;
};

// Cache management functions
const getCachedSearchResults = async (query) => {
  try {
    const cache = await AsyncStorage.getItem(API_CACHE_KEY);
    if (cache) {
      const cacheData = JSON.parse(cache);
      return cacheData.searches?.[query.toLowerCase()] || [];
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return [];
};

const cacheSearchResults = async (query, results) => {
  try {
    let cache = await AsyncStorage.getItem(API_CACHE_KEY);
    cache = cache ? JSON.parse(cache) : { searches: {}, barcodes: {} };

    if (!cache.searches) cache.searches = {};
    cache.searches[query.toLowerCase()] = results.slice(0, 20);

    // Manage cache size
    const searchKeys = Object.keys(cache.searches);
    if (searchKeys.length > MAX_CACHE_SIZE / 2) {
      delete cache.searches[searchKeys[0]];
    }

    await AsyncStorage.setItem(API_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

const getCachedBarcode = async (barcode) => {
  try {
    const cache = await AsyncStorage.getItem(API_CACHE_KEY);
    if (cache) {
      const cacheData = JSON.parse(cache);
      return cacheData.barcodes?.[barcode] || null;
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const cacheBarcode = async (barcode, data) => {
  try {
    let cache = await AsyncStorage.getItem(API_CACHE_KEY);
    cache = cache ? JSON.parse(cache) : { searches: {}, barcodes: {} };

    if (!cache.barcodes) cache.barcodes = {};
    cache.barcodes[barcode] = data;

    // Manage cache size
    const barcodeKeys = Object.keys(cache.barcodes);
    if (barcodeKeys.length > MAX_CACHE_SIZE / 2) {
      delete cache.barcodes[barcodeKeys[0]];
    }

    await AsyncStorage.setItem(API_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

// Export original database functions
export const saveFood = foodDatabase.saveFood;
export const addToDaily = foodDatabase.addToDaily;
export const getDailySummary = foodDatabase.getDailySummary;
export const getFavorites = foodDatabase.getFavorites;
export const getRecentFoods = foodDatabase.getRecentFoods;
export const removeFromDaily = foodDatabase.removeFromDaily;
export const getWeeklySummary = foodDatabase.getWeeklySummary;
export const saveFoodFromAPI = foodDatabase.saveFoodFromAPI;