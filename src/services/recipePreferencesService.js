import AsyncStorage from '@react-native-async-storage/async-storage';

const RECIPE_PREFERENCES_KEY = '@recipe_preferences';

/**
 * Default recipe preferences
 */
const DEFAULT_PREFERENCES = {
  highProtein: {
    protein: '50',
    calories: '600',
  },
  lowCalorie: {
    calories: '400',
  },
  balanced: {
    protein: '40',
    carbs: '50',
    fat: '20',
  },
};

/**
 * Get recipe preferences with defaults
 */
export async function getRecipePreferences() {
  try {
    const saved = await AsyncStorage.getItem(RECIPE_PREFERENCES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading recipe preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save recipe preferences
 */
export async function saveRecipePreferences(preferences) {
  try {
    await AsyncStorage.setItem(RECIPE_PREFERENCES_KEY, JSON.stringify(preferences));
    return { success: true };
  } catch (error) {
    console.error('Error saving recipe preferences:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get preferences for a specific recipe type
 */
export async function getPreferencesForType(type) {
  const prefs = await getRecipePreferences();
  return prefs[type] || DEFAULT_PREFERENCES[type];
}

export default {
  getRecipePreferences,
  saveRecipePreferences,
  getPreferencesForType,
  DEFAULT_PREFERENCES,
};
