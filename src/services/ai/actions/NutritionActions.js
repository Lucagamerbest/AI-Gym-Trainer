/**
 * Nutrition Actions
 * Handles execution of nutrition-related actions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';

/**
 * Add food to nutrition log
 */
export async function addFood(params, context) {
  const { foodName, quantity } = params;

  if (!foodName) {
    return {
      success: false,
      message: 'Please specify a food item to add (e.g., "add 200g chicken breast")'
    };
  }

  return {
    success: true,
    action: 'ADD_FOOD',
    data: {
      foodName,
      quantity: quantity || 100,
      searchRequired: true
    },
    message: `To add ${foodName}, use the Search button (🔍) on the Nutrition screen and search for "${foodName}". The food database has nutritional info for thousands of foods!`
  };
}

/**
 * Suggest a meal based on remaining macros
 */
export async function suggestMeal(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context to see what's left
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesLeft = (nutritionContext.calories?.target || 2000) - (nutritionContext.calories?.consumed || 0);
    const proteinLeft = (nutritionContext.protein?.target || 150) - (nutritionContext.protein?.consumed || 0);

    // Meal suggestions based on remaining macros
    const mealSuggestions = {
      highProtein: [
        'Grilled chicken breast (200g) with broccoli',
        'Greek yogurt (200g) with berries and almonds',
        'Salmon (150g) with quinoa and vegetables',
        'Protein shake with banana and peanut butter'
      ],
      balanced: [
        'Turkey sandwich on whole wheat with avocado',
        'Chicken rice bowl with vegetables',
        'Pasta with lean ground beef and tomato sauce',
        'Stir fry with chicken, rice, and mixed vegetables'
      ],
      lowCalorie: [
        'Vegetable omelette (3 eggs) with spinach',
        'Tuna salad with olive oil dressing',
        'Grilled chicken salad with balsamic vinaigrette',
        'Protein smoothie with berries'
      ]
    };

    let suggestion;
    let category;

    if (proteinLeft > 50) {
      // High protein needed
      category = 'highProtein';
      suggestion = mealSuggestions.highProtein[Math.floor(Math.random() * mealSuggestions.highProtein.length)];
    } else if (caloriesLeft > 600) {
      // Balanced meal
      category = 'balanced';
      suggestion = mealSuggestions.balanced[Math.floor(Math.random() * mealSuggestions.balanced.length)];
    } else {
      // Low calorie
      category = 'lowCalorie';
      suggestion = mealSuggestions.lowCalorie[Math.floor(Math.random() * mealSuggestions.lowCalorie.length)];
    }

    return {
      success: true,
      action: 'SUGGEST_MEAL',
      data: {
        suggestion,
        category,
        caloriesLeft: Math.round(caloriesLeft),
        proteinLeft: Math.round(proteinLeft)
      },
      message: `Based on your remaining macros (${Math.round(caloriesLeft)} cal, ${Math.round(proteinLeft)}g protein), try:\n\n${suggestion}\n\nCheck the Recipes tab (📖) for saved meals!`
    };
  } catch (error) {
    console.error('Error suggesting meal:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to suggest a meal. Try a balanced meal with protein, carbs, and vegetables.'
    };
  }
}

/**
 * Check macro breakdown by meal
 */
export async function checkMacroBreakdown(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context
    const nutritionContext = await ContextManager.getNutritionContext(userId);
    const todaysMeals = nutritionContext.todaysMeals || [];

    // Calculate macros by meal type
    const mealBreakdown = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      snacks: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };

    todaysMeals.forEach(meal => {
      const mealType = meal.meal_type || 'snacks';
      if (mealBreakdown[mealType]) {
        mealBreakdown[mealType].calories += meal.calories_consumed || 0;
        mealBreakdown[mealType].protein += meal.protein_consumed || 0;
        mealBreakdown[mealType].carbs += meal.carbs_consumed || 0;
        mealBreakdown[mealType].fat += meal.fat_consumed || 0;
      }
    });

    // Format message
    let message = 'Today\'s Macros by Meal:\n\n';

    Object.entries(mealBreakdown).forEach(([mealType, macros]) => {
      if (macros.calories > 0) {
        const emoji = mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : mealType === 'dinner' ? '🌙' : '🍿';
        message += `${emoji} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:\n`;
        message += `  ${Math.round(macros.calories)} cal | ${Math.round(macros.protein)}g P | ${Math.round(macros.carbs)}g C | ${Math.round(macros.fat)}g F\n\n`;
      }
    });

    return {
      success: true,
      action: 'CHECK_MACRO_BREAKDOWN',
      data: mealBreakdown,
      message: message || 'No meals logged yet today. Start tracking to see your breakdown!'
    };
  } catch (error) {
    console.error('Error checking macro breakdown:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch macro breakdown. Try again later.'
    };
  }
}

/**
 * Check nutrition progress for the day
 */
export async function checkNutritionProgress(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Get nutrition context
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const caloriesConsumed = nutritionContext.calories?.consumed || 0;
    const caloriesTarget = nutritionContext.calories?.target || 2000;
    const proteinConsumed = nutritionContext.protein?.consumed || 0;
    const proteinTarget = nutritionContext.protein?.target || 150;

    const caloriesLeft = Math.round(caloriesTarget - caloriesConsumed);
    const proteinLeft = Math.round(proteinTarget - proteinConsumed);

    const caloriesPercent = Math.round((caloriesConsumed / caloriesTarget) * 100);
    const proteinPercent = Math.round((proteinConsumed / proteinTarget) * 100);

    let status = '';
    if (caloriesPercent < 70) {
      status = 'You have room for more meals today! ';
    } else if (caloriesPercent < 100) {
      status = 'Almost at your goal! ';
    } else if (caloriesPercent < 110) {
      status = 'Right on target! ';
    } else {
      status = 'Over your calorie goal. ';
    }

    if (proteinPercent < 80) {
      status += 'Focus on protein-rich foods for remaining meals.';
    } else if (proteinPercent >= 100) {
      status += 'Great job hitting your protein goal! 💪';
    }

    const message = `Nutrition Progress:\n\n` +
                   `Calories: ${Math.round(caloriesConsumed)}/${caloriesTarget} (${caloriesLeft} left)\n` +
                   `Protein: ${Math.round(proteinConsumed)}/${proteinTarget}g (${proteinLeft}g left)\n\n` +
                   `${status}`;

    return {
      success: true,
      action: 'CHECK_NUTRITION_PROGRESS',
      data: {
        caloriesConsumed: Math.round(caloriesConsumed),
        caloriesTarget,
        caloriesLeft,
        caloriesPercent,
        proteinConsumed: Math.round(proteinConsumed),
        proteinTarget,
        proteinLeft,
        proteinPercent
      },
      message
    };
  } catch (error) {
    console.error('Error checking nutrition progress:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to check nutrition progress. Try again later.'
    };
  }
}

/**
 * Check nutrition summary
 */
export async function checkNutrition(params, context) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';


    // Use proper nutrition context from ContextManager (already uses Firebase)
    const nutritionContext = await ContextManager.getNutritionContext(userId);

    const totalCalories = nutritionContext.calories?.consumed || 0;
    const totalProtein = nutritionContext.protein?.consumed || 0;
    const totalCarbs = nutritionContext.carbs?.consumed || 0;
    const totalFat = nutritionContext.fat?.consumed || 0;

    const caloriesGoal = nutritionContext.calories?.target || 2000;
    const proteinGoal = nutritionContext.protein?.target || 150;
    const carbsGoal = nutritionContext.carbs?.target || 200;
    const fatGoal = nutritionContext.fat?.target || 65;

    const mealsToday = nutritionContext.todaysMeals || 0;

    const data = {
      calories: Math.round(totalCalories),
      caloriesGoal,
      caloriesRemaining: Math.round(caloriesGoal - totalCalories),
      protein: Math.round(totalProtein),
      proteinGoal,
      proteinRemaining: Math.round(proteinGoal - totalProtein),
      carbs: Math.round(totalCarbs),
      carbsGoal,
      carbsRemaining: Math.round(carbsGoal - totalCarbs),
      fat: Math.round(totalFat),
      fatGoal,
      fatRemaining: Math.round(fatGoal - totalFat),
      mealsToday: mealsToday
    };

    // Build message with focus on most important macro
    let message = `Today's Nutrition:\n`;
    message += `• Calories: ${data.calories}/${data.caloriesGoal} (${data.caloriesRemaining} left)\n`;
    message += `• Protein: ${data.protein}/${data.proteinGoal}g (${data.proteinRemaining}g left)\n`;
    message += `• Carbs: ${data.carbs}/${data.carbsGoal}g\n`;
    message += `• Fat: ${data.fat}/${data.fatGoal}g`;

    // Add suggestion if protein is low
    if (data.proteinRemaining > 50) {
      const mealsLeft = 3 - data.mealsToday;
      if (mealsLeft > 0) {
        const proteinPerMeal = Math.round(data.proteinRemaining / Math.max(mealsLeft, 1));
        message += `\n\nTip: Aim for ${proteinPerMeal}g protein per remaining meal.`;
      }
    }

    return {
      success: true,
      action: 'CHECK_NUTRITION',
      data,
      message
    };
  } catch (error) {
    console.error('Error in checkNutrition:', error);
    return {
      success: false,
      error: error.message,
      message: 'Unable to fetch nutrition data. Try again later.'
    };
  }
}
