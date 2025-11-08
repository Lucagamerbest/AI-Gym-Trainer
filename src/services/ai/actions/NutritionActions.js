/**
 * Nutrition Actions
 * Handles execution of nutrition-related actions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import ContextManager from '../ContextManager';
import BackendService from '../../backend/BackendService';
import { getMealRecommendation } from '../tools/MealBalancingTool';

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
 * Uses MealBalancingTool to intelligently distribute remaining macros
 * across remaining meals based on user's meal plan and time of day
 * Returns multiple meal options for user to browse
 */
export async function suggestMeal(params, context) {
  try {
    // Get user ID from Firebase Auth
    const userId = BackendService.getCurrentUserId() || 'guest';

    // Determine meal type (from params or auto-detect from time)
    let mealType = params?.mealType;

    if (!mealType) {
      // Auto-detect meal type based on current time
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 11) {
        mealType = 'breakfast';
      } else if (currentHour >= 11 && currentHour < 16) {
        mealType = 'lunch';
      } else if (currentHour >= 16 && currentHour < 22) {
        mealType = 'dinner';
      } else {
        mealType = 'snack';
      }
    }

    // Use MealBalancingTool to get smart recommendation
    const recommendation = await getMealRecommendation(userId, mealType);

    if (!recommendation.success) {
      throw new Error(recommendation.error || 'Failed to get meal recommendation');
    }

    const { recommended, remaining, mealsPerDay, mealsRemaining, bufferNote } = recommendation.data;

    // Generate multiple meal options that fit the target macros
    const mealOptions = generateMealOptions(mealType, recommended);

    // Generate meal emoji
    const mealEmoji = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍿'
    }[mealType] || '🍽️';

    // Create short intro message (card shows all details)
    let message = `${mealEmoji} **${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Suggestions**\n\nBrowse through the options below:`;

    return {
      success: true,
      action: 'SUGGEST_MEAL',
      data: {
        mealType,
        recommended,
        remaining,
        mealsPerDay,
        mealsRemaining,
        bufferNote,
        mealOptions // Array of meal suggestions
      },
      message,
      toolResults: {
        mealSuggestions: mealOptions,
        source: 'generated',
        targetMacros: recommended
      }
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
 * Generate multiple meal options based on target macros
 */
function generateMealOptions(mealType, targetMacros) {
  const { calories, protein, carbs, fat } = targetMacros;

  // Define meal templates based on meal type
  const mealTemplates = {
    breakfast: [
      {
        name: 'Protein-Packed Breakfast Bowl',
        description: 'Greek yogurt with granola, berries, and honey',
        ingredients: ['Greek yogurt', 'Granola', 'Mixed berries', 'Honey', 'Almonds'],
        prepTime: '5 min',
        tags: ['Quick', 'High Protein', 'No Cooking']
      },
      {
        name: 'Classic Eggs & Toast',
        description: 'Scrambled eggs with whole grain toast and avocado',
        ingredients: ['Eggs', 'Whole grain bread', 'Avocado', 'Butter', 'Salt & pepper'],
        prepTime: '10 min',
        tags: ['Classic', 'Filling', 'Easy']
      },
      {
        name: 'Protein Smoothie Bowl',
        description: 'Protein powder smoothie topped with fruits and nuts',
        ingredients: ['Protein powder', 'Banana', 'Almond milk', 'Peanut butter', 'Toppings'],
        prepTime: '5 min',
        tags: ['Quick', 'High Protein', 'Refreshing']
      }
    ],
    lunch: [
      {
        name: 'Grilled Chicken & Rice Bowl',
        description: 'Seasoned grilled chicken breast with rice and vegetables',
        ingredients: ['Chicken breast', 'Brown rice', 'Broccoli', 'Carrots', 'Soy sauce'],
        prepTime: '25 min',
        tags: ['High Protein', 'Balanced', 'Meal Prep']
      },
      {
        name: 'Turkey & Avocado Wrap',
        description: 'Whole wheat wrap with turkey, avocado, and veggies',
        ingredients: ['Whole wheat tortilla', 'Turkey slices', 'Avocado', 'Lettuce', 'Tomato'],
        prepTime: '10 min',
        tags: ['Quick', 'Portable', 'Fresh']
      },
      {
        name: 'Salmon with Quinoa',
        description: 'Pan-seared salmon with quinoa and roasted vegetables',
        ingredients: ['Salmon fillet', 'Quinoa', 'Asparagus', 'Bell peppers', 'Lemon'],
        prepTime: '30 min',
        tags: ['Healthy Fats', 'Omega-3', 'Gourmet']
      }
    ],
    dinner: [
      {
        name: 'Lean Steak & Sweet Potato',
        description: 'Grilled sirloin steak with baked sweet potato and green beans',
        ingredients: ['Sirloin steak', 'Sweet potato', 'Green beans', 'Olive oil', 'Garlic'],
        prepTime: '35 min',
        tags: ['High Protein', 'Filling', 'Classic']
      },
      {
        name: 'Chicken Stir-Fry',
        description: 'Chicken breast stir-fried with vegetables and brown rice',
        ingredients: ['Chicken breast', 'Mixed vegetables', 'Brown rice', 'Teriyaki sauce', 'Ginger'],
        prepTime: '20 min',
        tags: ['Quick', 'Asian-Inspired', 'Veggie-Packed']
      },
      {
        name: 'Baked Cod with Veggies',
        description: 'Oven-baked cod with roasted vegetables and quinoa',
        ingredients: ['Cod fillet', 'Quinoa', 'Zucchini', 'Tomatoes', 'Herbs'],
        prepTime: '30 min',
        tags: ['Light', 'Lean Protein', 'Low-Fat']
      }
    ],
    snack: [
      {
        name: 'Protein Shake',
        description: 'Whey protein shake with banana and almond milk',
        ingredients: ['Protein powder', 'Banana', 'Almond milk', 'Ice'],
        prepTime: '2 min',
        tags: ['Quick', 'High Protein', 'Post-Workout']
      },
      {
        name: 'Greek Yogurt & Fruit',
        description: 'Greek yogurt with mixed berries and nuts',
        ingredients: ['Greek yogurt', 'Berries', 'Almonds', 'Honey'],
        prepTime: '3 min',
        tags: ['Quick', 'Protein-Rich', 'Fresh']
      },
      {
        name: 'Protein Bar & Apple',
        description: 'High-protein bar with a medium apple',
        ingredients: ['Protein bar', 'Apple'],
        prepTime: '1 min',
        tags: ['Ultra Quick', 'Portable', 'Convenient']
      }
    ]
  };

  const templates = mealTemplates[mealType] || mealTemplates.lunch;

  // Generate meals with adjusted macros
  return templates.map((template, index) => {
    // Add slight variation to macros (+/- 10%)
    const variation = 0.9 + (index * 0.1);

    return {
      id: `meal_${mealType}_${index}`,
      name: template.name,
      description: template.description,
      ingredients: template.ingredients,
      prepTime: template.prepTime,
      tags: template.tags,
      nutrition: {
        calories: Math.round(calories * variation),
        protein: Math.round(protein * variation),
        carbs: Math.round(carbs * variation),
        fat: Math.round(fat * variation)
      },
      mealType
    };
  });
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

    // Ultra-concise progress message
    const message = `**${Math.round(caloriesConsumed)}/${caloriesTarget} cal** (**${caloriesLeft}** left) | **${Math.round(proteinConsumed)}/${proteinTarget}g P** (**${proteinLeft}g** left)`;

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

    // Ultra-concise message
    let message = `**${data.calories}/${data.caloriesGoal} cal** | **${data.protein}/${data.proteinGoal}g P** | **${data.carbs}/${data.carbsGoal}g C** | **${data.fat}/${data.fatGoal}g F**`;

    // Add ONE suggestion if needed
    if (data.proteinRemaining > 30) {
      message += `\n**${data.proteinRemaining}g P** needed.`;
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
