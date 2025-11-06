/**
 * NutritionTools - AI tools for nutrition calculations and meal planning
 */

import MealSyncService from '../../backend/MealSyncService';
import BackendService from '../../backend/BackendService';

/**
 * HELPER: Generate AI content with retry logic
 * Same as RecipeTools helper for consistency
 */
async function generateWithRetry(prompt, options = {}) {
  const maxAttempts = 3;
  const retryDelay = 1000; // 1 second between retries

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🤖 AI Generation attempt ${attempt}/${maxAttempts}`);

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const { default: AIService } = await import('../AIService');

      if (!AIService.apiKey) {
        throw new Error('Gemini API key not configured. Please restart the app.');
      }

      const genAI = new GoogleGenerativeAI(AIService.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt, {
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 2000,
        },
      });

      const response = result.response.text();

      // Validate response has minimum length
      if (!response || response.trim().length < 50) {
        throw new Error('AI response too short, likely incomplete');
      }

      console.log('✅ AI generation successful');
      return response;

    } catch (error) {
      console.error(`❌ AI generation attempt ${attempt} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * HELPER: Extract and parse JSON from AI response
 * Multiple extraction methods for robustness
 */
function extractAndParseJSON(response) {
  console.log('🔍 Extracting JSON from AI response...');

  // Method 1: Extract from ```json code blocks
  let jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    console.log('✓ Found JSON in ```json block');
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 2: Extract from regular ``` code blocks
  jsonMatch = response.match(/```\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    console.log('✓ Found JSON in ``` block');
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 3: Try to find JSON object directly
  jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    console.log('✓ Found JSON object directly');
    return parseJSONSafely(jsonMatch[0]);
  }

  // Method 4: Try parsing the entire response
  console.log('⚠ No code blocks found, trying to parse entire response');
  return parseJSONSafely(response);
}

/**
 * HELPER: Parse JSON safely with error handling
 */
function parseJSONSafely(jsonStr) {
  try {
    // Remove trailing commas (common AI mistake)
    const cleaned = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .trim();

    const parsed = JSON.parse(cleaned);
    console.log('✅ JSON parsed successfully');
    return parsed;

  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    throw new Error(`Failed to parse data: ${error.message}`);
  }
}

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

/**
 * GENERATE WEEKLY MEAL PLAN
 * User says: "Create a meal plan for this week" or "Plan my meals to hit 2000 calories and 150g protein"
 *
 * Generates a complete 7-day meal plan with breakfast, lunch, dinner (and snacks if requested)
 */
export async function generateWeeklyMealPlan({
  dailyCalories,
  dailyProtein,
  dailyCarbs = null,
  dailyFat = null,
  mealsPerDay = 3,
  dietaryRestrictions = [],
  preferences = null,
  userId
}) {
  try {
    console.log('📅 Generating weekly meal plan:', {
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
      mealsPerDay,
      dietaryRestrictions,
      preferences
    });

    // Calculate macros if not all provided
    if (!dailyCarbs || !dailyFat) {
      // Use standard macro ratios
      const proteinCals = dailyProtein * 4;
      const remainingCals = dailyCalories - proteinCals;

      if (!dailyFat) {
        dailyFat = Math.round((dailyCalories * 0.25) / 9); // 25% of calories from fat
      }

      if (!dailyCarbs) {
        const fatCals = dailyFat * 9;
        dailyCarbs = Math.round((dailyCalories - proteinCals - fatCals) / 4);
      }
    }

    // Build prompt
    let prompt = `Create a detailed 7-day meal plan with the following daily targets:
- Calories: ${dailyCalories}
- Protein: ${dailyProtein}g
- Carbs: ${dailyCarbs}g
- Fat: ${dailyFat}g
- Meals per day: ${mealsPerDay}

Requirements:
- Each day should have ${mealsPerDay} meals (breakfast, lunch, dinner${mealsPerDay > 3 ? ', and snacks' : ''})
- Include specific portion sizes
- Calculate exact macros for each meal
- Make meals varied and realistic
- Keep prep simple (30 min or less per meal)
- Each meal should be balanced and satisfying`;

    if (dietaryRestrictions.length > 0) {
      prompt += `\n- Follow these dietary restrictions: ${dietaryRestrictions.join(', ')}`;
    }

    if (preferences) {
      prompt += `\n- User preferences: ${preferences}`;
    }

    prompt += `\n\nFormat the response as JSON:
{
  "weekSummary": {
    "totalCalories": ${dailyCalories * 7},
    "avgDailyCalories": ${dailyCalories},
    "avgDailyProtein": ${dailyProtein},
    "avgDailyCarbs": ${dailyCarbs},
    "avgDailyFat": ${dailyFat}
  },
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal name",
          "foods": [
            { "item": "food item", "amount": "portion", "calories": 200, "protein": 20, "carbs": 30, "fat": 5 }
          ],
          "totalCalories": 500,
          "totalProtein": 35,
          "totalCarbs": 60,
          "totalFat": 15,
          "prepTime": "15 minutes"
        }
      ],
      "dailyTotals": {
        "calories": ${dailyCalories},
        "protein": ${dailyProtein},
        "carbs": ${dailyCarbs},
        "fat": ${dailyFat}
      }
    }
  ],
  "shoppingList": ["ingredient 1", "ingredient 2"],
  "tips": ["meal prep tip 1", "tip 2"]
}`;

    // Generate meal plan using AI with retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.7,
        maxOutputTokens: 4000,
      });
    } catch (error) {
      console.error('❌ Weekly meal plan generation failed after retries:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    // Parse response with improved extraction
    let mealPlan;
    try {
      mealPlan = extractAndParseJSON(response);
    } catch (parseError) {
      console.error('❌ Meal plan parsing failed:', parseError);
      return {
        success: false,
        message: "Couldn't create meal plan. Please try again with different parameters.",
        error: parseError.message,
      };
    }

    // Add metadata
    mealPlan.id = `mealplan_${Date.now()}`;
    mealPlan.createdAt = new Date().toISOString();
    mealPlan.createdBy = 'AI';

    // Save to AsyncStorage
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const MEAL_PLANS_KEY = '@meal_plans';
    const savedPlansStr = await AsyncStorage.getItem(MEAL_PLANS_KEY);
    const savedPlans = savedPlansStr ? JSON.parse(savedPlansStr) : [];

    savedPlans.push(mealPlan);
    await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(savedPlans));

    // Build success message
    const message = `✅ Created your 7-day meal plan!

📊 Daily Targets:
• ${dailyCalories} calories
• ${dailyProtein}g protein
• ${dailyCarbs}g carbs
• ${dailyFat}g fat

📅 ${mealPlan.days.length} days planned with ${mealsPerDay} meals/day
🛒 Shopping list included with ${mealPlan.shoppingList?.length || 0} items

Your meal plan is saved and ready!`;

    return {
      success: true,
      message,
      data: {
        mealPlan,
        mealPlanId: mealPlan.id,
      },
      action: 'meal_plan_generated',
    };

  } catch (error) {
    console.error('❌ generateWeeklyMealPlan error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't generate meal plan. Please try again.",
    };
  }
}

/**
 * SUGGEST NEXT MEAL FOR BALANCE
 * User says: "What should I eat for dinner?" or "Suggest my next meal"
 *
 * Analyzes today's intake and suggests a meal to balance macros
 */
export async function suggestNextMealForBalance({
  userId,
  mealType = null
}) {
  try {
    console.log('🍽️ Suggesting next meal for balance:', { userId, mealType });

    // Validate userId
    if (!userId) {
      return {
        success: false,
        message: "User ID is required to suggest meals.",
      };
    }

    // Get today's nutrition status
    const nutritionStatus = await getNutritionStatus({ userId });

    if (!nutritionStatus.success) {
      return {
        success: false,
        message: "Couldn't analyze your nutrition. Please log some meals first to get personalized suggestions.",
      };
    }

    const { consumed, remaining, goals } = nutritionStatus.status || nutritionStatus.data;

    // Build prompt
    const currentTime = new Date().getHours();
    let suggestedMealType = mealType;

    if (!suggestedMealType) {
      // Auto-detect meal type based on time
      if (currentTime < 11) suggestedMealType = 'breakfast';
      else if (currentTime < 15) suggestedMealType = 'lunch';
      else if (currentTime < 20) suggestedMealType = 'dinner';
      else suggestedMealType = 'snack';
    }

    let prompt = `The user needs a ${suggestedMealType} suggestion.

Current nutrition today:
• Consumed: ${consumed.calories} calories, ${consumed.protein}g protein, ${consumed.carbs}g carbs, ${consumed.fat}g fat
• Daily Goals: ${goals.calories} calories, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat
• Remaining: ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat

Suggest a ${suggestedMealType} that:
1. Uses most of the remaining macros appropriately
2. Is realistic and easy to prepare
3. Includes specific portion sizes
4. Has detailed macro breakdown

Provide 2-3 meal options with:
- Meal name
- Ingredients with amounts
- Prep instructions (brief)
- Total macros (calories, protein, carbs, fat)
- Why this meal balances their day`;

    // Generate suggestions using AI with retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1500,
      });
    } catch (error) {
      console.error('❌ Next meal suggestion failed after retries:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    // 🚀 NEW FEATURE: Calculate visual macro balance percentages
    const caloriePercent = Math.round((consumed.calories / goals.calories) * 100);
    const proteinPercent = Math.round((consumed.protein / goals.protein) * 100);
    const carbsPercent = Math.round((consumed.carbs / goals.carbs) * 100);
    const fatPercent = Math.round((consumed.fat / goals.fat) * 100);

    // Create visual progress bars (simple text-based)
    const createProgressBar = (percent) => {
      const filled = Math.min(Math.floor(percent / 10), 10);
      const empty = 10 - filled;
      return '█'.repeat(filled) + '░'.repeat(empty);
    };

    const macroBalance = `
📊 Your Macro Balance Today:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Calories: [${createProgressBar(caloriePercent)}] ${caloriePercent}% (${consumed.calories}/${goals.calories})
Protein:  [${createProgressBar(proteinPercent)}] ${proteinPercent}% (${consumed.protein}g/${goals.protein}g)
Carbs:    [${createProgressBar(carbsPercent)}] ${carbsPercent}% (${consumed.carbs}g/${goals.carbs}g)
Fat:      [${createProgressBar(fatPercent)}] ${fatPercent}% (${consumed.fat}g/${goals.fat}g)
━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return {
      success: true,
      message: `${macroBalance}\n\n🍽️ ${suggestedMealType.charAt(0).toUpperCase() + suggestedMealType.slice(1)} suggestions to balance your macros:\n\n${response}`,
      data: {
        mealType: suggestedMealType,
        remaining,
        consumed,
        goals,
        percentages: {
          calories: caloriePercent,
          protein: proteinPercent,
          carbs: carbsPercent,
          fat: fatPercent,
        },
        suggestions: response,
      },
    };

  } catch (error) {
    console.error('❌ suggestNextMealForBalance error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't suggest meal. Please try again.",
    };
  }
}

/**
 * PREDICT DAILY MACRO SHORTFALL
 * User says: "Will I hit my protein goal today?" or "Am I on track for my calories?"
 *
 * Predicts if user will meet macro targets based on current progress and time of day
 */
export async function predictDailyMacroShortfall({ userId }) {
  try {
    console.log('📊 Predicting daily macro shortfall:', { userId });

    // Validate userId
    if (!userId) {
      return {
        success: false,
        message: "User ID is required to predict macro progress.",
      };
    }

    // Get current nutrition status
    const nutritionStatus = await getNutritionStatus({ userId });

    if (!nutritionStatus.success) {
      return {
        success: false,
        message: "Couldn't analyze your nutrition. Please log some meals first to see your progress.",
      };
    }

    const { consumed, remaining, goals, percentages } = nutritionStatus.status || nutritionStatus.data;

    // Calculate time-based predictions
    const now = new Date();
    const currentHour = now.getHours();

    // Edge case: Early morning with no meals logged yet
    if (currentHour < 8 && consumed.calories === 0) {
      return {
        success: true,
        message: `🌅 Good morning! It's too early to predict your progress. Log some meals and check back later!\n\n📊 Your goals for today:\n• ${goals.calories} calories\n• ${goals.protein}g protein\n• ${goals.carbs}g carbs\n• ${goals.fat}g fat`,
        data: { consumed, goals, remaining, dayProgress: currentHour / 24 },
      };
    }
    const hoursIntoDay = currentHour;
    const hoursRemaining = 24 - currentHour;
    const dayProgress = hoursIntoDay / 24; // 0.0 to 1.0

    // Expected consumption by this time (assuming even distribution)
    const expectedCalories = goals.calories * dayProgress;
    const expectedProtein = goals.protein * dayProgress;
    const expectedCarbs = goals.carbs * dayProgress;
    const expectedFat = goals.fat * dayProgress;

    // Calculate variance
    const caloriesVariance = consumed.calories - expectedCalories;
    const proteinVariance = consumed.protein - expectedProtein;
    const carbsVariance = consumed.carbs - expectedCarbs;
    const fatVariance = consumed.fat - expectedFat;

    // Predict end-of-day totals (simple linear projection)
    const predictedCalories = Math.round(consumed.calories + (consumed.calories / dayProgress) * (1 - dayProgress));
    const predictedProtein = Math.round(consumed.protein + (consumed.protein / dayProgress) * (1 - dayProgress));
    const predictedCarbs = Math.round(consumed.carbs + (consumed.carbs / dayProgress) * (1 - dayProgress));
    const predictedFat = Math.round(consumed.fat + (consumed.fat / dayProgress) * (1 - dayProgress));

    // Determine status
    const willHitCalories = Math.abs(predictedCalories - goals.calories) < (goals.calories * 0.1); // Within 10%
    const willHitProtein = Math.abs(predictedProtein - goals.protein) < (goals.protein * 0.15); // Within 15%
    const willHitCarbs = Math.abs(predictedCarbs - goals.carbs) < (goals.carbs * 0.15);
    const willHitFat = Math.abs(predictedFat - goals.fat) < (goals.fat * 0.15);

    // Build simplified message (visual bars will be shown by MacroProgressCard component)
    const currentCaloriePercent = Math.round((consumed.calories / goals.calories) * 100);
    const currentProteinPercent = Math.round((consumed.protein / goals.protein) * 100);

    let message = `At ${Math.round(dayProgress * 100)}% through the day, you're at ${currentCaloriePercent}% calories and ${currentProteinPercent}% protein.\n\n`;

    message += `🔮 Predicted by end of day:\n`;
    message += `${predictedCalories}/${goals.calories} cal, ${predictedProtein}g/${goals.protein}g protein\n\n`;

    // Recommendations
    if (!willHitProtein && remaining.protein > 20) {
      message += `⚠️ You're ${Math.round(goals.protein - predictedProtein)}g short on protein. Add a protein shake or chicken breast!\n`;
    }

    if (!willHitCalories && remaining.calories > 300) {
      message += `⚠️ You're ${Math.round(goals.calories - predictedCalories)} calories behind. Consider adding a meal.\n`;
    }

    if (willHitProtein && willHitCalories) {
      message += `✅ You're on track! Keep it up!\n`;
    }

    return {
      success: true,
      message,
      data: {
        currentTime: currentHour,
        dayProgress,
        consumed,
        goals, // Add goals so MacroProgressCard can render
        expected: {
          calories: Math.round(expectedCalories),
          protein: Math.round(expectedProtein),
          carbs: Math.round(expectedCarbs),
          fat: Math.round(expectedFat),
        },
        predicted: {
          calories: predictedCalories,
          protein: predictedProtein,
          carbs: predictedCarbs,
          fat: predictedFat,
        },
        willHit: {
          calories: willHitCalories,
          protein: willHitProtein,
          carbs: willHitCarbs,
          fat: willHitFat,
        },
        remaining,
      },
    };

  } catch (error) {
    console.error('❌ predictDailyMacroShortfall error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't predict macro progress. Please try again.",
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
  {
    name: 'generateWeeklyMealPlan',
    description: 'Generate a complete 7-day meal plan that hits daily macro targets. Use when user wants meal planning for the week or asks "what should I eat this week?"',
    parameters: {
      type: 'object',
      properties: {
        dailyCalories: {
          type: 'number',
          description: 'Target daily calories',
        },
        dailyProtein: {
          type: 'number',
          description: 'Target daily protein in grams',
        },
        dailyCarbs: {
          type: 'number',
          description: 'Target daily carbs in grams',
        },
        dailyFat: {
          type: 'number',
          description: 'Target daily fat in grams',
        },
        mealsPerDay: {
          type: 'number',
          description: 'Number of meals per day (default: 3)',
        },
        dietaryRestrictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary restrictions (e.g., ["vegetarian", "gluten-free"])',
        },
        preferences: {
          type: 'string',
          description: 'Any food preferences or dislikes',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['dailyCalories', 'dailyProtein', 'userId'],
    },
  },
  {
    name: 'suggestNextMealForBalance',
    description: 'Analyze what user has eaten today and suggest the next meal to balance their macros. Use when user asks "what should I eat next?" or "what for dinner?"',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Type of meal to suggest',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'predictDailyMacroShortfall',
    description: 'Predict if user will hit their macro targets by end of day based on current intake and time. Use when user asks "will I hit my protein goal?" or "am I on track?"',
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
];
