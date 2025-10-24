/**
 * NutritionTools - AI tools for nutrition calculations and meal planning
 */

import MealSyncService from '../../backend/MealSyncService';
import BackendService from '../../backend/BackendService';

/**
 * Calculate recommended macros based on user goals
 */
export async function calculateMacros({ weight, height, age, gender, activityLevel, goal }) {
  try {
    // Calculate BMR using Mifflin-St Jeor equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

    // Goal adjustments
    let calories;
    let proteinRatio;
    let fatRatio;
    let carbRatio;

    if (goal === 'cut' || goal === 'weight_loss') {
      calories = tdee - 500; // 500 cal deficit
      proteinRatio = 0.35; // Higher protein to preserve muscle
      fatRatio = 0.25;
      carbRatio = 0.40;
    } else if (goal === 'bulk' || goal === 'muscle_gain') {
      calories = tdee + 300; // 300 cal surplus
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45;
    } else {
      // Maintenance
      calories = tdee;
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45;
    }

    // Calculate macro grams
    const protein = Math.round((calories * proteinRatio) / 4); // 4 cal per gram
    const fat = Math.round((calories * fatRatio) / 9); // 9 cal per gram
    const carbs = Math.round((calories * carbRatio) / 4); // 4 cal per gram

    return {
      success: true,
      macros: {
        calories: Math.round(calories),
        protein,
        fat,
        carbs,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      },
      breakdown: {
        proteinPercent: Math.round(proteinRatio * 100),
        fatPercent: Math.round(fatRatio * 100),
        carbPercent: Math.round(carbRatio * 100),
      },
    };
  } catch (error) {
    console.error('❌ calculateMacros error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current nutrition status for today
 */
export async function getNutritionStatus({ userId }) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's meals
    const meals = await MealSyncService.getMealsByDate(userId, today);

    // Calculate consumed totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals.forEach(meal => {
      totalCalories += meal.calories_consumed || meal.calories || 0;
      totalProtein += meal.protein_consumed || meal.protein || 0;
      totalCarbs += meal.carbs_consumed || meal.carbs || 0;
      totalFat += meal.fat_consumed || meal.fat || 0;
    });

    // Get user goals
    let goals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    try {
      const profile = await BackendService.getUserProfile(userId);
      if (profile?.goals) {
        goals = {
          calories: profile.goals.targetCalories || profile.goals.calories || 2000,
          protein: profile.goals.proteinGrams || profile.goals.protein || 150,
          carbs: profile.goals.carbsGrams || profile.goals.carbs || 200,
          fat: profile.goals.fatGrams || profile.goals.fat || 65,
        };
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
    }

    // Calculate remaining
    const remaining = {
      calories: goals.calories - totalCalories,
      protein: goals.protein - totalProtein,
      carbs: goals.carbs - totalCarbs,
      fat: goals.fat - totalFat,
    };

    // Calculate percentages
    const percentages = {
      calories: Math.round((totalCalories / goals.calories) * 100),
      protein: Math.round((totalProtein / goals.protein) * 100),
      carbs: Math.round((totalCarbs / goals.carbs) * 100),
      fat: Math.round((totalFat / goals.fat) * 100),
    };

    return {
      success: true,
      status: {
        consumed: {
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein),
          carbs: Math.round(totalCarbs),
          fat: Math.round(totalFat),
        },
        goals,
        remaining: {
          calories: Math.round(remaining.calories),
          protein: Math.round(remaining.protein),
          carbs: Math.round(remaining.carbs),
          fat: Math.round(remaining.fat),
        },
        percentages,
        mealsLogged: meals.length,
      },
    };
  } catch (error) {
    console.error('❌ getNutritionStatus error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Suggest meals to meet remaining macros
 */
export async function suggestMealsForMacros({ targetCalories = 500, targetProtein = 30, targetCarbs = 50, targetFat = 15, mealType = 'any' }) {
  try {
    console.log('🍽️ suggestMealsForMacros called with:', { targetCalories, targetProtein, targetCarbs, targetFat, mealType });
    // Meal database (simplified - could be expanded)
    const mealDatabase = [
      // High protein meals
      { name: 'Grilled Chicken Breast (8oz)', calories: 280, protein: 56, carbs: 0, fat: 6, type: 'protein' },
      { name: 'Salmon Fillet (6oz)', calories: 360, protein: 40, carbs: 0, fat: 22, type: 'protein' },
      { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 23, carbs: 9, fat: 0, type: 'protein' },
      { name: 'Egg Whites (6)', calories: 100, protein: 22, carbs: 2, fat: 0, type: 'protein' },

      // Carb sources
      { name: 'Brown Rice (1 cup)', calories: 215, protein: 5, carbs: 45, fat: 2, type: 'carbs' },
      { name: 'Sweet Potato (large)', calories: 160, protein: 4, carbs: 37, fat: 0, type: 'carbs' },
      { name: 'Oatmeal (1 cup)', calories: 150, protein: 6, carbs: 27, fat: 3, type: 'carbs' },
      { name: 'Whole Wheat Pasta (2oz)', calories: 200, protein: 8, carbs: 40, fat: 2, type: 'carbs' },

      // Healthy fats
      { name: 'Avocado (whole)', calories: 240, protein: 3, carbs: 12, fat: 22, type: 'fats' },
      { name: 'Almonds (1oz)', calories: 160, protein: 6, carbs: 6, fat: 14, type: 'fats' },
      { name: 'Peanut Butter (2 tbsp)', calories: 190, protein: 8, carbs: 8, fat: 16, type: 'fats' },

      // Balanced meals
      { name: 'Protein Shake with Banana', calories: 300, protein: 30, carbs: 35, fat: 5, type: 'snack' },
      { name: 'Chicken & Rice Bowl', calories: 450, protein: 45, carbs: 50, fat: 8, type: 'meal' },
      { name: 'Tuna Salad', calories: 250, protein: 30, carbs: 10, fat: 10, type: 'meal' },
    ];

    // Find best matches based on what macros are needed most
    const suggestions = [];

    // Determine priority macro
    const macroNeeds = {
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
    };

    // Sort meals by how well they fit the target
    const scoredMeals = mealDatabase.map(meal => {
      const calorieScore = Math.abs(meal.calories - targetCalories) / targetCalories;
      const proteinScore = targetProtein > 0 ? Math.abs(meal.protein - targetProtein) / targetProtein : 1;
      const carbScore = targetCarbs > 0 ? Math.abs(meal.carbs - targetCarbs) / targetCarbs : 1;
      const fatScore = targetFat > 0 ? Math.abs(meal.fat - targetFat) / targetFat : 1;

      const totalScore = calorieScore + proteinScore + carbScore + fatScore;

      return {
        ...meal,
        score: totalScore,
      };
    });

    // Get top 3 suggestions
    const topSuggestions = scoredMeals
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return {
      success: true,
      suggestions: topSuggestions.map(meal => ({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fitScore: (1 - meal.score / 4) * 100, // Convert to percentage
      })),
      targetMacros: {
        calories: targetCalories,
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
      },
    };
  } catch (error) {
    console.error('❌ suggestMealsForMacros error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate meal macros from ingredients
 */
export async function calculateMealMacros({ ingredients }) {
  try {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ingredients.forEach(ingredient => {
      totalCalories += ingredient.calories || 0;
      totalProtein += ingredient.protein || 0;
      totalCarbs += ingredient.carbs || 0;
      totalFat += ingredient.fat || 0;
    });

    return {
      success: true,
      totals: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      },
      breakdown: ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
      })),
    };
  } catch (error) {
    console.error('❌ calculateMealMacros error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export tool schemas for Gemini function calling
export const nutritionToolSchemas = [
  {
    name: 'calculateMacros',
    description: 'Calculate recommended daily macros (calories, protein, carbs, fat) based on user stats and goals. Use when user asks about their macro targets or calorie needs.',
    parameters: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          description: 'Body weight in kg',
        },
        height: {
          type: 'number',
          description: 'Height in cm',
        },
        age: {
          type: 'number',
          description: 'Age in years',
        },
        gender: {
          type: 'string',
          enum: ['male', 'female'],
          description: 'Gender',
        },
        activityLevel: {
          type: 'string',
          enum: ['sedentary', 'light', 'moderate', 'active', 'veryActive'],
          description: 'Activity level',
        },
        goal: {
          type: 'string',
          enum: ['cut', 'bulk', 'maintain', 'weight_loss', 'muscle_gain'],
          description: 'Fitness goal',
        },
      },
      required: ['weight', 'height', 'age', 'gender', 'activityLevel', 'goal'],
    },
  },
  {
    name: 'getNutritionStatus',
    description: 'Get current nutrition status for today including consumed macros, remaining macros, and progress toward goals. Use when user asks about their nutrition today.',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'suggestMealsForMacros',
    description: 'Suggest meals that fit specific macro targets. Use when user asks what to eat or needs meal ideas to hit remaining macros.',
    parameters: {
      type: 'object',
      properties: {
        targetCalories: {
          type: 'number',
          description: 'Target calories for the meal',
        },
        targetProtein: {
          type: 'number',
          description: 'Target protein in grams',
        },
        targetCarbs: {
          type: 'number',
          description: 'Target carbs in grams',
        },
        targetFat: {
          type: 'number',
          description: 'Target fat in grams',
        },
        mealType: {
          type: 'string',
          description: 'Type of meal (breakfast, lunch, dinner, snack, any)',
        },
      },
      required: ['targetCalories', 'targetProtein'],
    },
  },
  {
    name: 'calculateMealMacros',
    description: 'Calculate total macros from a list of ingredients. Use when user asks about macro content of a meal they want to make.',
    parameters: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fat: { type: 'number' },
            },
          },
          description: 'List of ingredients with their macros',
        },
      },
      required: ['ingredients'],
    },
  },
];
