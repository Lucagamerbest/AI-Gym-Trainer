// Web version of foodDatabase - uses AsyncStorage instead of SQLite
import AsyncStorage from '@react-native-async-storage/async-storage';

const FOODS_KEY = '@foods_db';
const CONSUMPTION_KEY = '@daily_consumption';
const FAVORITES_KEY = '@favorites';

// Initialize database (no-op for web)
export const initDatabase = async () => {
  console.log('Using AsyncStorage for web');
  return Promise.resolve();
};

// Save food to storage
export const saveFood = async (foodData) => {
  try {
    const existingFoods = await getFoods();

    // Check if food exists by barcode
    let foodId;
    if (foodData.barcode) {
      const existingIndex = existingFoods.findIndex(f => f.barcode === foodData.barcode);
      if (existingIndex >= 0) {
        // Update existing
        existingFoods[existingIndex] = { ...existingFoods[existingIndex], ...foodData };
        foodId = existingFoods[existingIndex].id;
      } else {
        // Add new
        foodId = Date.now() + Math.random();
        existingFoods.push({ ...foodData, id: foodId });
      }
    } else {
      // Add new without barcode
      foodId = Date.now() + Math.random();
      existingFoods.push({ ...foodData, id: foodId });
    }

    await AsyncStorage.setItem(FOODS_KEY, JSON.stringify(existingFoods));
    return foodId;
  } catch (error) {
    console.error('Error saving food:', error);
    throw error;
  }
};

// Get all foods
const getFoods = async () => {
  try {
    const foods = await AsyncStorage.getItem(FOODS_KEY);
    return foods ? JSON.parse(foods) : [];
  } catch (error) {
    console.error('Error getting foods:', error);
    return [];
  }
};

// Search foods by name
export const searchFoods = async (searchQuery) => {
  try {
    const foods = await getFoods();
    const query = searchQuery.toLowerCase();

    const filtered = foods.filter(food => {
      const nameMatch = food.name?.toLowerCase().includes(query);
      const brandMatch = food.brand?.toLowerCase().includes(query);
      return nameMatch || brandMatch;
    });

    // Filter out foods with zero calories and no nutritional content
    const validFoods = filtered.filter(food => {
      const calories = food.nutrition?.calories || food.calories || 0;
      const protein = food.nutrition?.protein || food.protein || 0;
      const carbs = food.nutrition?.carbs || food.carbs || 0;
      const fat = food.nutrition?.fat || food.fat || 0;

      // Keep foods that have at least some nutritional value
      return calories > 0 || protein > 0 || carbs > 0 || fat > 0;
    });

    // Return ALL matching valid results
    return validFoods;
  } catch (error) {
    console.error('Error searching foods:', error);
    return [];
  }
};

// Get food by barcode
export const getFoodByBarcode = async (barcode) => {
  try {
    const foods = await getFoods();
    return foods.find(food => food.barcode === barcode) || null;
  } catch (error) {
    console.error('Error getting food by barcode:', error);
    return null;
  }
};

// Add food to daily consumption
export const addToDaily = async (foodId, quantity, mealType = 'snack') => {
  try {
    const foods = await getFoods();
    const food = foods.find(f => f.id === foodId);

    if (!food) {
      throw new Error('Food not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const multiplier = quantity / 100;

    const consumptionEntry = {
      id: Date.now(),
      food_id: foodId,
      date: today,
      meal_type: mealType,
      quantity_grams: quantity,
      calories_consumed: (food.calories || 0) * multiplier,
      protein_consumed: (food.protein || 0) * multiplier,
      carbs_consumed: (food.carbs || 0) * multiplier,
      fat_consumed: (food.fat || 0) * multiplier,
      food_name: food.name,
      food_brand: food.brand,
      created_at: new Date().toISOString()
    };

    const consumptionData = await AsyncStorage.getItem(CONSUMPTION_KEY);
    const consumption = consumptionData ? JSON.parse(consumptionData) : [];
    consumption.push(consumptionEntry);

    await AsyncStorage.setItem(CONSUMPTION_KEY, JSON.stringify(consumption));

    // Update favorites
    await updateFavoritesWeb(foodId);

    return consumptionEntry.id;
  } catch (error) {
    console.error('Error adding to daily:', error);
    throw error;
  }
};

// Update favorites (web version)
const updateFavoritesWeb = async (foodId) => {
  try {
    const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
    const favorites = favoritesData ? JSON.parse(favoritesData) : {};

    if (favorites[foodId]) {
      favorites[foodId].use_count++;
      favorites[foodId].last_used = new Date().toISOString();
    } else {
      favorites[foodId] = {
        food_id: foodId,
        use_count: 1,
        last_used: new Date().toISOString()
      };
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error updating favorites:', error);
  }
};

// Get daily summary
export const getDailySummary = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const consumptionData = await AsyncStorage.getItem(CONSUMPTION_KEY);
    const consumption = consumptionData ? JSON.parse(consumptionData) : [];

    const todayItems = consumption.filter(item => item.date === targetDate);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    todayItems.forEach(item => {
      totalCalories += item.calories_consumed || 0;
      totalProtein += item.protein_consumed || 0;
      totalCarbs += item.carbs_consumed || 0;
      totalFat += item.fat_consumed || 0;
    });

    return {
      date: targetDate,
      items: todayItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      totals: {
        calories: Math.round(totalCalories),
        protein: parseFloat(totalProtein.toFixed(1)),
        carbs: parseFloat(totalCarbs.toFixed(1)),
        fat: parseFloat(totalFat.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Error getting daily summary:', error);
    return {
      date: date || new Date().toISOString().split('T')[0],
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };
  }
};

// Get favorite foods
export const getFavorites = async (limit = 10) => {
  try {
    const foods = await getFoods();
    const favoritesData = await AsyncStorage.getItem(FAVORITES_KEY);
    const favorites = favoritesData ? JSON.parse(favoritesData) : {};

    const favoritesList = Object.entries(favorites)
      .map(([foodId, data]) => {
        const food = foods.find(f => f.id === parseInt(foodId));
        return food ? { ...food, ...data } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.use_count - a.use_count)
      .slice(0, limit);

    return favoritesList;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

// Get recent foods
export const getRecentFoods = async (limit = 10) => {
  try {
    const consumptionData = await AsyncStorage.getItem(CONSUMPTION_KEY);
    const consumption = consumptionData ? JSON.parse(consumptionData) : [];
    const foods = await getFoods();

    const recentFoodIds = [];
    const seen = new Set();

    // Get unique recent food IDs
    consumption
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(item => {
        if (!seen.has(item.food_id) && recentFoodIds.length < limit) {
          seen.add(item.food_id);
          recentFoodIds.push(item.food_id);
        }
      });

    return recentFoodIds
      .map(id => foods.find(f => f.id === id))
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting recent foods:', error);
    return [];
  }
};

// Remove from daily consumption
export const removeFromDaily = async (consumptionId) => {
  try {
    const consumptionData = await AsyncStorage.getItem(CONSUMPTION_KEY);
    const consumption = consumptionData ? JSON.parse(consumptionData) : [];

    const updated = consumption.filter(item => item.id !== consumptionId);
    await AsyncStorage.setItem(CONSUMPTION_KEY, JSON.stringify(updated));

    return 1; // Return rows affected
  } catch (error) {
    console.error('Error removing from daily:', error);
    throw error;
  }
};

// Get weekly summary
export const getWeeklySummary = async () => {
  try {
    const consumptionData = await AsyncStorage.getItem(CONSUMPTION_KEY);
    const consumption = consumptionData ? JSON.parse(consumptionData) : [];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const summary = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayItems = consumption.filter(item => item.date === dateStr);

      const dayTotals = dayItems.reduce((acc, item) => ({
        calories: acc.calories + (item.calories_consumed || 0),
        protein: acc.protein + (item.protein_consumed || 0),
        carbs: acc.carbs + (item.carbs_consumed || 0),
        fat: acc.fat + (item.fat_consumed || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      summary.push({
        date: dateStr,
        total_calories: Math.round(dayTotals.calories),
        total_protein: dayTotals.protein,
        total_carbs: dayTotals.carbs,
        total_fat: dayTotals.fat
      });
    }

    return summary;
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    return [];
  }
};

// Save food from API
export const saveFoodFromAPI = async (apiData) => {
  const calories = apiData.nutrition?.calories || 0;
  const protein = apiData.nutrition?.protein || 0;
  const carbs = apiData.nutrition?.carbs || 0;
  const fat = apiData.nutrition?.fat || 0;

  // Calculate calories from macros if missing or zero
  let finalCalories = calories;
  if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    finalCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
  }

  // Skip saving foods with no nutritional value
  if (finalCalories === 0 && protein === 0 && carbs === 0 && fat === 0) {
    console.log('Skipping food with no nutritional data:', apiData.name);
    return null;
  }

  const foodData = {
    barcode: apiData.barcode,
    name: apiData.name,
    brand: apiData.brand,
    calories: finalCalories,
    protein,
    carbs,
    fat,
    fiber: apiData.nutrition?.fiber || 0,
    sugar: apiData.nutrition?.sugar || 0,
    sodium: apiData.nutrition?.sodium || 0,
    saturated_fat: apiData.nutrition?.saturatedFat || 0,
    serving_size: apiData.servingSize || '100g',
    image_url: apiData.imageUrl,
    nutrition_grade: apiData.nutritionGrade,
    source: apiData.source || 'api'
  };

  return saveFood(foodData);
};