// Platform-agnostic wrapper for food database
// Uses SQLite on mobile, AsyncStorage on web
import { Platform } from 'react-native';

// Conditionally import the appropriate implementation
let foodDatabase;

if (Platform.OS === 'web') {
  foodDatabase = require('./foodDatabase.web');
} else {
  foodDatabase = require('./foodDatabase');
}

// Export all functions
export const initDatabase = foodDatabase.initDatabase;
export const saveFood = foodDatabase.saveFood;
export const searchFoods = foodDatabase.searchFoods;
export const getFoodByBarcode = foodDatabase.getFoodByBarcode;
export const addToDaily = foodDatabase.addToDaily;
export const getDailySummary = foodDatabase.getDailySummary;
export const getFavorites = foodDatabase.getFavorites;
export const getRecentFoods = foodDatabase.getRecentFoods;
export const removeFromDaily = foodDatabase.removeFromDaily;
export const getWeeklySummary = foodDatabase.getWeeklySummary;
export const saveFoodFromAPI = foodDatabase.saveFoodFromAPI;