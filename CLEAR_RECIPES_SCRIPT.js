/**
 * Quick script to clear corrupted recipe data
 * Run this once to remove any AI-generated recipes with malformed ingredient data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearRecipes() {
  try {
    await AsyncStorage.removeItem('@saved_recipes');
    console.log('✅ Cleared all saved recipes');
  } catch (error) {
    console.error('❌ Failed to clear recipes:', error);
  }
}

clearRecipes();
