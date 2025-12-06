/**
 * Meal Count Service
 * Checks if user has exceeded their daily meal count limit
 * and provides encouraging messages
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import MealSyncService from './backend/MealSyncService';

const USER_PROFILE_KEY = '@user_profile';

// Encouraging messages for when users exceed their meal count
const ENCOURAGING_MESSAGES = [
  "It's okay to be a bit more hungry today! Just try to stay mindful of your daily totals.",
  "Extra hungry? That happens! Maybe you had an intense workout or busy day.",
  "No stress! One extra meal won't derail your progress. Stay consistent overall.",
  "Listen to your body - if you're hungry, fuel up! Just keep your goals in mind.",
  "It's not the end of the world! Tomorrow is a fresh start.",
  "Flexibility is part of a healthy lifestyle. Don't be too hard on yourself!",
  "Remember: progress over perfection. You're doing great overall!",
  "Your body might need extra fuel today. That's completely normal!",
  "Stay positive! One day doesn't define your journey.",
  "Being aware is half the battle - you've got this!",
];

/**
 * Get a random encouraging message
 */
export function getRandomEncouragingMessage() {
  const index = Math.floor(Math.random() * ENCOURAGING_MESSAGES.length);
  return ENCOURAGING_MESSAGES[index];
}

/**
 * Check if user has exceeded their meal count limit
 * @param {string} userId - User ID
 * @returns {object} { exceeded: boolean, currentCount: number, limit: number, message: string }
 */
export async function checkMealCountLimit(userId) {
  try {
    if (!userId || userId === 'guest') {
      return { exceeded: false, currentCount: 0, limit: 3, message: null };
    }

    // Get user's mealsPerDay setting
    const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
    const profile = profileData ? JSON.parse(profileData) : {};
    const mealsPerDay = profile.mealsPerDay || 3;

    // Get today's meals count (use local date, not UTC)
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const todaysMeals = await MealSyncService.getMealsByDate(userId, today);
    const currentCount = todaysMeals?.length || 0;

    if (currentCount >= mealsPerDay) {
      return {
        exceeded: true,
        currentCount: currentCount + 1, // +1 because we're about to add one more
        limit: mealsPerDay,
        message: getRandomEncouragingMessage(),
      };
    }

    return {
      exceeded: false,
      currentCount: currentCount + 1,
      limit: mealsPerDay,
      message: null,
    };
  } catch (error) {
    return { exceeded: false, currentCount: 0, limit: 3, message: null };
  }
}

/**
 * Format the meal count warning message
 * @param {number} currentCount - Current meal count (after adding)
 * @param {number} limit - User's meal limit
 * @param {string} encouragingMessage - Random encouraging message
 */
export function formatMealCountWarning(currentCount, limit, encouragingMessage) {
  return {
    title: `Meal ${currentCount} of ${limit} logged`,
    subtitle: currentCount > limit
      ? `You're ${currentCount - limit} meal${currentCount - limit > 1 ? 's' : ''} over your daily goal`
      : `You've reached your daily meal goal`,
    message: encouragingMessage,
  };
}

export default {
  checkMealCountLimit,
  getRandomEncouragingMessage,
  formatMealCountWarning,
  ENCOURAGING_MESSAGES,
};
