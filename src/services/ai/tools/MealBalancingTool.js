/**
 * MealBalancingTool
 *
 * Recommends what to eat for a specific meal (breakfast, lunch, dinner, snack)
 * to balance remaining macros, considering:
 * - User's meal plan (2-6 meals per day)
 * - Time of day (how many meals left)
 * - Remaining macros for the day
 * - Buffer for tracking inaccuracies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';

const MEAL_PLANS_KEY = '@meal_plans';
const USER_PROFILE_KEY = '@user_profile';

/**
 * Get meal recommendation for balancing macros
 *
 * @param {string} userId - User ID
 * @param {string} mealType - breakfast, lunch, dinner, or snack
 * @returns {object} Recommended calories and macros for this meal
 */
export async function getMealRecommendation(userId, mealType = 'dinner') {
  try {

    // Get user's nutrition context (remaining macros)
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    if (!nutritionContext) {
      return {
        success: false,
        error: 'Could not fetch nutrition data'
      };
    }

    // Get user profile (meal plan preferences)
    const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
    const profile = profileData ? JSON.parse(profileData) : {};

    // Default to 3 meals if not set
    const mealsPerDay = profile.nutrition?.mealsPerDay || 3;


    // Get current time and determine how many meals are left today
    const now = new Date();
    const currentHour = now.getHours();

    // Estimate meals left based on time of day
    let mealsRemaining = estimateMealsRemaining(currentHour, mealsPerDay, mealType);


    // Calculate remaining macros
    const remainingCalories = nutritionContext.calories?.remaining || 0;
    const remainingProtein = nutritionContext.protein?.remaining || 0;
    const remainingCarbs = nutritionContext.carbs?.remaining || 0;
    const remainingFat = nutritionContext.fat?.remaining || 0;

    // Calculate recommended allocation for this meal
    // Leave 10-15% buffer for snacks and tracking inaccuracies
    const buffer = 0.15;
    const allocatableCalories = remainingCalories * (1 - buffer);

    // Distribute remaining macros across remaining meals
    const caloriesForMeal = mealsRemaining > 0
      ? Math.round(allocatableCalories / mealsRemaining)
      : Math.round(allocatableCalories);

    const proteinForMeal = mealsRemaining > 0
      ? Math.round(remainingProtein / mealsRemaining)
      : Math.round(remainingProtein);

    const carbsForMeal = mealsRemaining > 0
      ? Math.round(remainingCarbs / mealsRemaining)
      : Math.round(remainingCarbs);

    const fatForMeal = mealsRemaining > 0
      ? Math.round(remainingFat / mealsRemaining)
      : Math.round(remainingFat);

    // Get meal-specific recommendations
    const mealGuidance = getMealTypeGuidance(mealType, currentHour);


    return {
      success: true,
      data: {
        mealType,
        currentHour,
        mealsPerDay,
        mealsRemaining,
        recommended: {
          calories: caloriesForMeal,
          protein: proteinForMeal,
          carbs: carbsForMeal,
          fat: fatForMeal
        },
        remaining: {
          calories: remainingCalories,
          protein: remainingProtein,
          carbs: remainingCarbs,
          fat: remainingFat
        },
        bufferNote: `Leaving ${Math.round(remainingCalories * buffer)} cal buffer for snacks/inaccuracies`,
        guidance: mealGuidance
      },
      message: `For ${mealType}, aim for **${caloriesForMeal} calories** (${proteinForMeal}p / ${carbsForMeal}c / ${fatForMeal}f).\n\n${mealGuidance}`
    };

  } catch (error) {
    console.error('Error getting meal recommendation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Estimate how many meals are left today based on time
 */
function estimateMealsRemaining(currentHour, mealsPerDay, requestedMeal) {
  // Typical meal times
  const mealSchedule = {
    2: [{ time: 12, name: 'lunch' }, { time: 19, name: 'dinner' }],
    3: [{ time: 8, name: 'breakfast' }, { time: 13, name: 'lunch' }, { time: 19, name: 'dinner' }],
    4: [{ time: 8, name: 'breakfast' }, { time: 12, name: 'lunch' }, { time: 16, name: 'snack' }, { time: 20, name: 'dinner' }],
    5: [{ time: 7, name: 'breakfast' }, { time: 10, name: 'snack' }, { time: 13, name: 'lunch' }, { time: 17, name: 'snack' }, { time: 20, name: 'dinner' }],
    6: [{ time: 7, name: 'breakfast' }, { time: 10, name: 'snack' }, { time: 13, name: 'lunch' }, { time: 16, name: 'snack' }, { time: 19, name: 'dinner' }, { time: 21, name: 'snack' }]
  };

  const schedule = mealSchedule[mealsPerDay] || mealSchedule[3];

  // Count meals that haven't happened yet (scheduled time > current hour)
  const upcomingMeals = schedule.filter(meal => meal.time > currentHour);

  // Check if the requested meal is in the upcoming list
  const requestedMealInUpcoming = upcomingMeals.some(meal => meal.name === requestedMeal);

  // If the requested meal is NOT in upcoming (meaning it's past its scheduled time but user hasn't eaten it),
  // we should still include it in the count by adding 1
  const mealsRemaining = requestedMealInUpcoming
    ? upcomingMeals.length
    : upcomingMeals.length + 1;

  return Math.max(1, mealsRemaining);
}

/**
 * Get meal-specific guidance based on type and time
 */
function getMealTypeGuidance(mealType, currentHour) {
  const guidance = {
    breakfast: 'Start your day with protein to stay full. Consider eggs, Greek yogurt, or protein smoothie.',
    lunch: 'Balance protein and carbs for sustained energy. Aim for lean protein + complex carbs + veggies.',
    dinner: 'Focus on protein and veggies. Keep carbs moderate unless post-workout.',
    snack: 'Choose high-protein snacks like Greek yogurt, protein shake, or nuts.'
  };

  // Add time-specific context
  if (mealType === 'dinner' && currentHour >= 20) {
    return guidance.dinner + ' Keep it lighter since it\'s late.';
  }

  if (mealType === 'lunch' && currentHour <= 11) {
    return 'Early lunch! ' + guidance.lunch;
  }

  return guidance[mealType] || 'Balance your macros with lean protein, complex carbs, and healthy fats.';
}

export default {
  name: 'getMealRecommendation',
  description: 'Recommends what to eat for a specific meal (breakfast, lunch, dinner, snack) to balance remaining macros. Considers user\'s meal plan, time of day, and leaves buffer for snacks.',
  parameters: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'Which meal to get recommendation for'
      }
    },
    required: ['userId', 'mealType']
  },
  execute: getMealRecommendation
};
