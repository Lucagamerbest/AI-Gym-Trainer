/**
 * RecipeTools - AI tools for recipe generation and management
 *
 * These tools help users create, modify, and optimize recipes using AI
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import FreeRecipeService from '../../FreeRecipeService';
import { calculateRealisticMacros, validateMacros, formatMacrosForAI } from '../../../utils/macroCalculations';
import {
  getMealTypeConstraints,
  validateCaloriesForMealType,
  formatMealTypeGuidanceForAI,
  getProteinRangeForMealType,
} from '../../../utils/mealTypeConstraints';

/**
 * HELPER: Generate AI content with retry logic and improved parsing
 * Handles API failures gracefully with automatic retries
 */
async function generateWithRetry(prompt, options = {}) {
  const maxAttempts = 3;
  const retryDelay = 1000; // 1 second between retries

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {

      // Import GoogleGenerativeAI and get API key
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const { default: AIService } = await import('../AIService');

      if (!AIService.apiKey) {
        throw new Error('Gemini API key not configured. Please restart the app.');
      }

      const genAI = new GoogleGenerativeAI(AIService.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Generate content
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

      return response;

    } catch (error) {
      console.error(`❌ AI generation attempt ${attempt} failed:`, error.message);

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * HELPER: Extract and parse JSON from AI response
 * Uses multiple extraction methods for robustness
 */
function extractAndParseJSON(response) {

  // Method 1: Extract from ```json code blocks
  let jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 2: Extract from regular ``` code blocks
  jsonMatch = response.match(/```\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 3: Try to find JSON object directly
  jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return parseJSONSafely(jsonMatch[0]);
  }

  // Method 4: Try parsing the entire response
  return parseJSONSafely(response);
}

/**
 * HELPER: Parse JSON with error handling
 * Removes trailing commas and validates required fields
 */
function parseJSONSafely(jsonStr) {
  try {
    // Remove trailing commas (common AI mistake)
    const cleaned = jsonStr
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required recipe fields
    const requiredFields = ['title', 'ingredients', 'instructions', 'nutrition'];
    const missingFields = requiredFields.filter(field => !parsed[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate nutrition has required subfields
    const requiredNutrition = ['caloriesPerServing', 'proteinPerServing', 'carbsPerServing', 'fatPerServing'];
    const missingNutrition = requiredNutrition.filter(field => parsed.nutrition[field] === undefined);

    if (missingNutrition.length > 0) {
      throw new Error(`Missing nutrition fields: ${missingNutrition.join(', ')}`);
    }

    return parsed;

  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
    throw new Error(`Failed to parse recipe data: ${error.message}`);
  }
}

/**
 * GENERATE RECIPE FROM INGREDIENTS
 * User says: "Create a recipe with common ingredients" or "Generate a healthy meal"
 *
 * Uses AI to generate a complete recipe with instructions and macro calculations
 */
export async function generateRecipeFromIngredients({
  ingredients,
  targetProtein = null,
  targetCalories = null,
  cuisine = null,
  dietaryRestrictions = [],
  mealType = 'any', // 'breakfast', 'lunch', 'dinner', 'snack', 'any'
  maxPrepTime = null, // Filter for quick meals (in minutes)
  minPrepTime = null, // Filter for full cooking meals (in minutes)
  mealPrepFriendly = false, // Request meal prep-friendly recipe
  userId
}) {
  try {
    // Validate inputs
    if (!ingredients || ingredients.length === 0) {
      return {
        success: false,
        message: "Please provide at least one ingredient to generate a recipe. Example: 'chicken breast, rice, broccoli'",
      };
    }

    // Validate ingredient names (basic check for gibberish)
    const invalidIngredients = ingredients.filter(ing =>
      !ing || ing.length < 2 || /[^a-zA-Z\s-]/.test(ing)
    );

    if (invalidIngredients.length > 0) {
      return {
        success: false,
        message: `Invalid ingredient names detected: "${invalidIngredients.join('", "')}". Please use real food names.`,
      };
    }

    // Ensure at least 2 ingredients for a real recipe
    if (ingredients.length < 2) {
      return {
        success: false,
        message: "Please provide at least 2 ingredients to create a complete recipe. Try adding a protein and vegetable or carb source!",
      };
    }

    // 🚀 NEW FEATURE: Search database first for faster results!
    // Try to find matching recipes from free database before using AI
    if (targetCalories || targetProtein) {
      try {
        const dbRecipes = await FreeRecipeService.searchRecipes({
          mealType: mealType !== 'any' ? mealType : null,
          minCalories: targetCalories ? targetCalories - 100 : null,
          maxCalories: targetCalories ? targetCalories + 100 : null,
          minProtein: targetProtein ? targetProtein - 10 : null,
        });

        // Filter by ingredients if specific ingredients requested
        let matchingRecipes = dbRecipes;
        if (ingredients.length > 0) {
          matchingRecipes = dbRecipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.map(i =>
              i.food?.name?.toLowerCase() || i.item?.toLowerCase() || ''
            ).join(' ');
            return ingredients.some(ing =>
              recipeIngredients.includes(ing.toLowerCase())
            );
          });
        }

        // If we found good matches, offer them
        if (matchingRecipes.length > 0) {
          const topMatches = matchingRecipes.slice(0, 3);

          return {
            success: true,
            message: `I found ${topMatches.length} recipes in the database that match your criteria! Check them out below, or ask me to generate a custom recipe with AI.`,
            action: 'database_recipes_found',
            recipes: topMatches,
            suggestAIGeneration: true,
          };
        }
      } catch (error) {
        // Continue to AI generation if database search fails
      }
    }

    // Get meal type constraints
    const mealConstraints = getMealTypeConstraints(mealType);

    // Validate calories for meal type if provided
    let adjustedCalories = targetCalories;
    let calorieNote = '';

    if (targetCalories) {
      const calorieValidation = validateCaloriesForMealType(targetCalories, mealType);
      if (!calorieValidation.valid) {
        calorieNote = `\n\n⚠️ CALORIE WARNING: ${calorieValidation.reason}`;
        adjustedCalories = calorieValidation.suggestion;
      }
    } else if (mealType !== 'any') {
      // Use ideal calories for the meal type
      adjustedCalories = mealConstraints.calorieRange.ideal;
    }

    // Validate and calculate realistic macros if both calories and protein are provided
    let macroGuidance = '';
    if (adjustedCalories && targetProtein) {
      const validation = validateMacros(adjustedCalories, targetProtein, 0, 0);
      if (!validation.valid) {
        // User requested unrealistic macros - provide realistic suggestion
        const realistic = calculateRealisticMacros(adjustedCalories, 'balanced');
        macroGuidance = `\n\nIMPORTANT MACRO NOTE: The requested macros (${targetProtein}g protein with ${adjustedCalories} calories) may not be realistic. ${validation.reason}
Suggested realistic macros: ${formatMacrosForAI(adjustedCalories, 'balanced')}`;
      }
    } else if (adjustedCalories && !targetProtein) {
      // Only calories provided - calculate realistic macros
      macroGuidance = `\n\nRECOMMENDED MACROS: ${formatMacrosForAI(adjustedCalories, 'balanced')}`;
    }

    // Add meal type guidance
    const mealTypeGuidance = formatMealTypeGuidanceForAI(mealType);

    // Build prompt for recipe generation
    let prompt = `Create a detailed, healthy recipe using these ingredients: ${ingredients.join(', ')}.
${mealTypeGuidance}
${calorieNote}

Requirements:
- Include step-by-step cooking instructions (KEEP EACH STEP SHORT AND CLEAR - max 1-2 sentences per step)
- Provide exact measurements for all ingredients
- Calculate nutritional information (calories, protein, carbs, fat per serving)
- Make it realistic and easy to prepare
- Specify number of servings

MEAL PREP OPTIONS:
- Include a "mealPrepFriendly" boolean field indicating if this recipe can be made in bulk
- If meal prep friendly, add "mealPrepInstructions" with batch cooking tips and storage instructions
- Add "componentBased" field - can this be made as separate components (protein + carb + veggie)?
- If component-based, add "components" array breaking down the recipe into: protein source, carb source, vegetable, sauce/seasoning
- Add "assemblyTime" field for quick assembly meals (e.g., "5 minutes" for pre-prepped components)
- Include "storageInstructions" with how long each component lasts in the fridge

${maxPrepTime ? `⚡ QUICK MEAL REQUIREMENT: Total time (prep + cook) must be under ${maxPrepTime} minutes! Focus on simple, fast recipes with minimal cooking.` : ''}
${minPrepTime ? `🍳 FULL COOKING MEAL REQUIREMENT: Total time (prep + cook) should be at least ${minPrepTime} minutes. This is a proper cooking session, not a quick meal.` : ''}
${mealPrepFriendly ? `📦 MEAL PREP FOCUS: This MUST be meal prep friendly! Make it suitable for batch cooking and storing for 4-5 days. Include detailed storage and reheating instructions.` : ''}`;

    if (targetProtein && adjustedCalories) {
      prompt += `\n- Aim for approximately ${targetProtein}g of protein and ${adjustedCalories} calories per serving`;
      prompt += macroGuidance;
    } else if (targetProtein) {
      prompt += `\n- Target approximately ${targetProtein}g of protein per serving`;
    } else if (adjustedCalories) {
      prompt += `\n- Target approximately ${adjustedCalories} calories per serving`;
      prompt += macroGuidance;
    }

    if (cuisine) {
      prompt += `\n- Use ${cuisine} cuisine style`;
    }

    if (dietaryRestrictions.length > 0) {
      prompt += `\n- Accommodate these dietary restrictions: ${dietaryRestrictions.join(', ')}`;
    }

    if (mealType !== 'any') {
      prompt += `\n- This is for ${mealType}`;
    }

    prompt += `\n\nFormat the response as JSON with this structure:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "servings": 2,
  "prepTime": "15 minutes",
  "cookTime": "20 minutes",
  "totalTime": "35 minutes",
  "difficulty": "easy/medium/hard",
  "mealPrepFriendly": true,
  "componentBased": true,
  "assemblyTime": "5 minutes",
  "ingredients": [
    { "item": "ingredient name", "amount": "2 cups", "calories": 200, "protein": 10, "carbs": 20, "fat": 5 }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "components": [
    { "type": "protein", "name": "Grilled chicken", "prepInstructions": "Season and grill for 6-7 min per side", "storageTime": "4 days" },
    { "type": "carb", "name": "Brown rice", "prepInstructions": "Cook 1 cup rice with 2 cups water", "storageTime": "5 days" },
    { "type": "vegetable", "name": "Roasted broccoli", "prepInstructions": "Toss with oil, roast at 425°F for 20 min", "storageTime": "3 days" },
    { "type": "sauce", "name": "Lemon herb dressing", "prepInstructions": "Mix olive oil, lemon, herbs", "storageTime": "7 days" }
  ],
  "mealPrepInstructions": "Cook all components on Sunday. Store in separate containers. Reheat protein and carbs together for 2 min, add fresh vegetables.",
  "storageInstructions": "Store each component in airtight containers in the refrigerator. Keeps for 3-5 days depending on component.",
  "nutrition": {
    "caloriesPerServing": 450,
    "proteinPerServing": 35,
    "carbsPerServing": 40,
    "fatPerServing": 12
  },
  "tags": ["high-protein", "meal-prep", "quick-assembly", "healthy"],
  "tips": ["Optional cooking tip 1", "Optional cooking tip 2"]
}`;

    // Generate recipe using AI with retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.7,
        maxOutputTokens: 2000,
      });
    } catch (error) {
      console.error('❌ AI generation failed after retries:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    // Parse the JSON response with improved extraction
    let recipe;
    try {
      recipe = extractAndParseJSON(response);
    } catch (parseError) {
      console.error('❌ Recipe parsing failed:', parseError);
      return {
        success: false,
        message: "AI generated a recipe but it couldn't be formatted properly. Please try again with different ingredients.",
        error: parseError.message,
      };
    }

    // Add metadata
    recipe.id = `recipe_${Date.now()}`;
    recipe.createdAt = new Date().toISOString();
    recipe.createdBy = 'AI';
    recipe.sourceIngredients = ingredients;

    // Normalize recipe structure for RecipesScreen compatibility
    // RecipesScreen expects: name, nutrition.calories, nutrition.protein, etc.
    recipe.name = recipe.title; // Add 'name' field for compatibility
    recipe.nutrition = {
      calories: recipe.nutrition.caloriesPerServing,
      protein: recipe.nutrition.proteinPerServing,
      carbs: recipe.nutrition.carbsPerServing,
      fat: recipe.nutrition.fatPerServing,
      // Keep the original values too
      caloriesPerServing: recipe.nutrition.caloriesPerServing,
      proteinPerServing: recipe.nutrition.proteinPerServing,
      carbsPerServing: recipe.nutrition.carbsPerServing,
      fatPerServing: recipe.nutrition.fatPerServing,
    };

    // Normalize ingredients structure
    // RecipesScreen expects: { food: { name, calories, protein, carbs, fat }, quantity }
    // AI generates: { item, amount, calories, protein, carbs, fat }

    recipe.ingredients = recipe.ingredients.map(ingredient => {
      // Extract numeric value from amount string
      // Try to get grams from parentheses first: "10 oz (280g)" -> 280
      // Otherwise get first number: "200g" -> 200
      let quantity = 100; // default

      const gramsInParens = ingredient.amount.match(/\((\d+(?:\.\d+)?)g\)/);
      if (gramsInParens) {
        quantity = parseFloat(gramsInParens[1]);
      } else {
        // Try to find just "g" after a number: "200g"
        const gramsMatch = ingredient.amount.match(/(\d+(?:\.\d+)?)g/);
        if (gramsMatch) {
          quantity = parseFloat(gramsMatch[1]);
        } else {
          // Fallback to first number found
          const anyNumber = ingredient.amount.match(/[\d.]+/);
          if (anyNumber) {
            quantity = parseFloat(anyNumber[0]);
          }
        }
      }

      // RecipesScreen calculates: (food.calories / 100) * quantity
      // So if AI says "200g chicken with 330 calories total"
      // We need: food.calories = (330 / 200) * 100 = 165 calories per 100g
      // Then RecipesScreen does: (165 / 100) * 200 = 330 ✓

      const caloriesPer100g = (ingredient.calories || 0) / quantity * 100;
      const proteinPer100g = (ingredient.protein || 0) / quantity * 100;
      const carbsPer100g = (ingredient.carbs || 0) / quantity * 100;
      const fatPer100g = (ingredient.fat || 0) / quantity * 100;


      return {
        food: {
          name: ingredient.item,
          calories: Math.round(caloriesPer100g),
          protein: Math.round(proteinPer100g * 10) / 10,
          carbs: Math.round(carbsPer100g * 10) / 10,
          fat: Math.round(fatPer100g * 10) / 10,
        },
        quantity: quantity, // The actual amount used in the recipe
        // Keep original format too for reference
        original: ingredient,
      };
    });

    // DO NOT save automatically - let user decide via buttons
    // Recipe data is returned so UI can save it later if user chooses

    // CRITICAL: Do NOT include recipe in the response that goes to AI
    // The AI should only get a confirmation message, NOT the recipe details
    const message = `Recipe generated successfully. DO NOT show the recipe details to the user - they will see it in the recipe card below your message. Just say something brief like: "I've created a recipe for you! Use the buttons below to save it, discard it, or generate a different one."`;

    return {
      success: true,
      message, // Instruction for AI to be brief
      // DO NOT include 'data' field - it goes to the AI and causes verbosity
      action: 'recipe_generated',
      recipeCard: {
        // This data is ONLY used by the UI (NOT sent to AI)
        title: recipe.title,
        calories: recipe.nutrition.caloriesPerServing,
        protein: recipe.nutrition.proteinPerServing,
        carbs: recipe.nutrition.carbsPerServing,
        fat: recipe.nutrition.fatPerServing,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        recipeId: recipe.id,
        needsConfirmation: true,
        // Store full recipe and ingredients in the card data (for UI handlers)
        fullRecipe: recipe,
        originalIngredients: ingredients,
      },
    };

  } catch (error) {
    console.error('❌ generateRecipeFromIngredients error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't generate recipe. Please try again with different ingredients.",
    };
  }
}

/**
 * GENERATE HIGH-PROTEIN RECIPE
 * User says: "Create a high-protein meal" or "Generate a recipe with 50g protein and 500 calories"
 *
 * Generates a recipe optimized for high protein content while keeping calories reasonable
 * Focuses on protein-dense foods (chicken, fish, eggs, Greek yogurt, tofu, etc.)
 */
export async function generateHighProteinRecipe({
  targetProtein = 40,
  targetCalories = null,
  cuisine = null,
  dietaryRestrictions = [],
  mealType = 'any', // 'breakfast', 'lunch', 'dinner', 'snack', 'any'
  userId
}) {
  try {
    // Get meal type constraints
    const mealConstraints = getMealTypeConstraints(mealType);
    const { min, max, ideal } = mealConstraints.calorieRange;

    // Validate or adjust calories for meal type
    let adjustedCalories = targetCalories;
    let calorieNote = '';

    if (targetCalories) {
      // IMPORTANT: Do NOT validate/adjust if user explicitly set calories (from preferences)
      // Only validate if calories seem unrealistic AND protein is default (meaning no user prefs)
      const isUsingDefaults = (targetProtein === 40 && !targetCalories) || targetProtein === 40;

      if (isUsingDefaults) {
        const calorieValidation = validateCaloriesForMealType(targetCalories, mealType);
        if (!calorieValidation.valid) {
          calorieNote = `\n\n⚠️ CALORIE WARNING: ${calorieValidation.reason}
Adjusted to ${calorieValidation.suggestion} calories to match ${mealType} requirements.`;
          adjustedCalories = calorieValidation.suggestion;
        }
      }
      // Otherwise respect user's explicit calorie preference
    } else {
      // No calories specified - use ideal for meal type
      adjustedCalories = ideal;
    }

    // Get recommended protein range for this meal type and calorie amount
    const proteinRange = getProteinRangeForMealType(mealType, adjustedCalories);

    // IMPORTANT: Do NOT adjust protein if explicitly set by user (from preferences)
    // Only adjust if it's using the default value
    let adjustedProtein = targetProtein;

    // Only validate/adjust if using default value (40g) - otherwise respect user preference
    if (targetProtein === 40) {
      // This is the default, so we can adjust based on meal type
      if (targetProtein > proteinRange.max) {
        adjustedProtein = proteinRange.max;
        calorieNote += `\n\n⚠️ PROTEIN WARNING: ${targetProtein}g protein is too high for a ${adjustedCalories}-calorie ${mealType}. Adjusted to ${adjustedProtein}g (realistic max for this meal).`;
      } else if (targetProtein < proteinRange.min) {
        adjustedProtein = proteinRange.ideal;
      }
    }
    // If user explicitly set a different value (from preferences), respect it completely

    // Calculate realistic macros for high-protein meal
    const realisticMacros = calculateRealisticMacros(adjustedCalories, 'high-protein');

    // Validate if user's request is realistic
    let macroNote = '';
    if (targetCalories && targetProtein) {
      const validation = validateMacros(adjustedCalories, adjustedProtein, 0, 0);
      if (!validation.valid) {
        macroNote = `\n\nNOTE: ${validation.reason}
Recommended: ${formatMacrosForAI(adjustedCalories, 'high-protein')}`;
      }
    }

    // Add meal type guidance to prompt
    const mealTypeGuidance = formatMealTypeGuidanceForAI(mealType);

    // Build specialized prompt for high-protein recipes
    let prompt = `Create a detailed, high-protein recipe optimized for maximum protein while keeping calories reasonable.
${mealTypeGuidance}
${calorieNote}

CRITICAL PROTEIN REQUIREMENTS:
- Target ${adjustedProtein}g of protein per serving (${adjustedProtein - 5}g to ${adjustedProtein + 5}g acceptable)
- Focus on PROTEIN-DENSE foods: chicken breast, salmon, tuna, eggs, Greek yogurt, cottage cheese, tofu, lean beef, turkey, shrimp, protein powder
- Avoid high-calorie/low-protein foods: oils, butter, nuts (use sparingly), regular cheese (use sparingly)
- Maximize protein-to-calorie ratio

REALISTIC MACRO GUIDANCE:
- For high-protein meals, aim for ~35% protein, ~45% carbs, ~20% fat
- Example: ${realisticMacros.protein.grams}g protein, ${realisticMacros.carbs.grams}g carbs, ${realisticMacros.fat.grams}g fat for ${adjustedCalories} calories${macroNote}

CRITICAL CALORIE REQUIREMENTS FOR ${mealType.toUpperCase()}:
- MUST stay within ${adjustedCalories - 50} to ${adjustedCalories + 50} calories per serving
- Target exactly ${adjustedCalories} calories per serving
- THIS IS NON-NEGOTIABLE: Exceeding ${adjustedCalories + 50} calories is NOT ACCEPTABLE
- Keep calories in check by using lean proteins and limiting added fats
- If this is a SNACK, use snack-sized portions (NOT full meals!)`;

    prompt += `\n\nREQUIREMENTS:
- Include step-by-step cooking instructions (KEEP EACH STEP SHORT AND CLEAR - max 1-2 sentences per step)
- Provide exact measurements for all ingredients
- Calculate nutritional information (calories, protein, carbs, fat per serving)
- Make it realistic and easy to prepare
- Specify number of servings

MEAL PREP OPTIONS:
- Include "mealPrepFriendly" boolean - can this be made in bulk?
- If meal prep friendly, add "mealPrepInstructions" with batch cooking and storage tips
- Add "componentBased" boolean - can be made as protein + carb + veggie?
- If component-based, add "components" array with breakdown
- Add "assemblyTime" for quick assembly (e.g., "5 minutes")
- Include "storageInstructions" with fridge life for each component`;

    if (cuisine) {
      prompt += `\n- Use ${cuisine} cuisine style`;
    }

    if (dietaryRestrictions.length > 0) {
      prompt += `\n- Accommodate these dietary restrictions: ${dietaryRestrictions.join(', ')}`;
    }

    if (mealType !== 'any') {
      prompt += `\n- This is for ${mealType}`;
    }

    prompt += `\n\nEXAMPLES OF HIGH-PROTEIN FOODS TO USE:
- Chicken breast (31g protein per 100g, ~165 calories)
- Salmon (25g protein per 100g, ~200 calories)
- Eggs (13g protein per 100g, ~155 calories)
- Greek yogurt (10g protein per 100g, ~60 calories)
- Cottage cheese (11g protein per 100g, ~98 calories)
- Tofu (8g protein per 100g, ~76 calories)
- Protein powder (can add to smoothies, oats, pancakes)

Format the response as JSON with this structure:
{
  "title": "Recipe Name",
  "description": "Brief description emphasizing high protein content",
  "servings": 1,
  "prepTime": "15 minutes",
  "cookTime": "20 minutes",
  "totalTime": "35 minutes",
  "difficulty": "easy/medium/hard",
  "mealPrepFriendly": true,
  "componentBased": true,
  "assemblyTime": "5 minutes",
  "ingredients": [
    { "item": "ingredient name", "amount": "200g", "calories": 330, "protein": 62, "carbs": 0, "fat": 7 }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "components": [
    { "type": "protein", "name": "Grilled chicken", "prepInstructions": "Season and grill", "storageTime": "4 days" },
    { "type": "carb", "name": "Rice", "prepInstructions": "Cook rice", "storageTime": "5 days" },
    { "type": "vegetable", "name": "Broccoli", "prepInstructions": "Steam or roast", "storageTime": "3 days" }
  ],
  "mealPrepInstructions": "Batch cook all components. Store separately.",
  "storageInstructions": "Store in airtight containers for 3-5 days.",
  "nutrition": {
    "caloriesPerServing": ${adjustedCalories},
    "proteinPerServing": ${adjustedProtein},
    "carbsPerServing": 30,
    "fatPerServing": 10
  },
  "tags": ["high-protein", "lean", "healthy"],
  "tips": ["Optional cooking tip 1", "Optional cooking tip 2"]
}

IMPORTANT: The nutrition.proteinPerServing MUST be within ${adjustedProtein - 5}g to ${adjustedProtein + 5}g range!
IMPORTANT: The nutrition.caloriesPerServing MUST be within ${adjustedCalories - 50} to ${adjustedCalories + 50} range!`;

    // Generate recipe using AI with retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.7,
        maxOutputTokens: 2000,
      });
    } catch (error) {
      console.error('❌ High-protein recipe generation failed after retries:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    // Parse the JSON response with improved extraction
    let recipe;
    try {
      recipe = extractAndParseJSON(response);
    } catch (parseError) {
      console.error('❌ High-protein recipe parsing failed:', parseError);
      return {
        success: false,
        message: "AI generated a recipe but it couldn't be formatted properly. Please try again.",
        error: parseError.message,
      };
    }

    // Validate protein target
    const actualProtein = recipe.nutrition.proteinPerServing;
    if (actualProtein < targetProtein - 5) {
      console.warn(`⚠️ Recipe only has ${actualProtein}g protein, below target of ${targetProtein}g`);
    }

    // Add metadata
    recipe.id = `recipe_${Date.now()}`;
    recipe.createdAt = new Date().toISOString();
    recipe.createdBy = 'AI';
    recipe.recipeType = 'high-protein';

    // Normalize recipe structure for RecipesScreen compatibility
    recipe.name = recipe.title;
    recipe.nutrition = {
      calories: recipe.nutrition.caloriesPerServing,
      protein: recipe.nutrition.proteinPerServing,
      carbs: recipe.nutrition.carbsPerServing,
      fat: recipe.nutrition.fatPerServing,
      caloriesPerServing: recipe.nutrition.caloriesPerServing,
      proteinPerServing: recipe.nutrition.proteinPerServing,
      carbsPerServing: recipe.nutrition.carbsPerServing,
      fatPerServing: recipe.nutrition.fatPerServing,
    };

    // Normalize ingredients structure

    recipe.ingredients = recipe.ingredients.map(ingredient => {
      let quantity = 100; // default

      const gramsInParens = ingredient.amount.match(/\((\d+(?:\.\d+)?)g\)/);
      if (gramsInParens) {
        quantity = parseFloat(gramsInParens[1]);
      } else {
        const gramsMatch = ingredient.amount.match(/(\d+(?:\.\d+)?)g/);
        if (gramsMatch) {
          quantity = parseFloat(gramsMatch[1]);
        } else {
          const anyNumber = ingredient.amount.match(/[\d.]+/);
          if (anyNumber) {
            quantity = parseFloat(anyNumber[0]);
          }
        }
      }

      const caloriesPer100g = (ingredient.calories || 0) / quantity * 100;
      const proteinPer100g = (ingredient.protein || 0) / quantity * 100;
      const carbsPer100g = (ingredient.carbs || 0) / quantity * 100;
      const fatPer100g = (ingredient.fat || 0) / quantity * 100;


      return {
        food: {
          name: ingredient.item,
          calories: Math.round(caloriesPer100g),
          protein: Math.round(proteinPer100g * 10) / 10,
          carbs: Math.round(carbsPer100g * 10) / 10,
          fat: Math.round(fatPer100g * 10) / 10,
        },
        quantity: quantity,
        original: ingredient,
      };
    });

    const message = `High-protein recipe generated successfully with ${actualProtein}g protein! DO NOT show the recipe details to the user - they will see it in the recipe card below your message. Just say something brief like: "I've created a high-protein recipe for you with ${actualProtein}g of protein! Use the buttons below to save it, discard it, or generate a different one."`;

    return {
      success: true,
      message,
      action: 'recipe_generated',
      recipeCard: {
        title: recipe.title,
        calories: recipe.nutrition.caloriesPerServing,
        protein: recipe.nutrition.proteinPerServing,
        carbs: recipe.nutrition.carbsPerServing,
        fat: recipe.nutrition.fatPerServing,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        recipeId: recipe.id,
        needsConfirmation: true,
        fullRecipe: recipe,
      },
    };

  } catch (error) {
    console.error('❌ generateHighProteinRecipe error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't generate high-protein recipe. Please try again.",
    };
  }
}

/**
 * ADAPT RECIPE TO MACROS
 * User says: "Adjust this recipe to have 40g protein and 400 calories"
 *
 * Takes an existing recipe and modifies portions/ingredients to hit macro targets
 */
export async function adaptRecipeToMacros({
  recipeId,
  recipeName,
  targetCalories,
  targetProtein,
  targetCarbs = null,
  targetFat = null,
  userId
}) {
  try {
    // Load user's recipes
    const RECIPES_KEY = '@saved_recipes';
    const savedRecipesStr = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedRecipesStr ? JSON.parse(savedRecipesStr) : [];

    // Find the recipe
    let recipe = null;
    if (recipeId) {
      recipe = savedRecipes.find(r => r.id === recipeId);
    } else if (recipeName) {
      recipe = savedRecipes.find(r =>
        r.title.toLowerCase().includes(recipeName.toLowerCase())
      );
    }

    if (!recipe) {
      return {
        success: false,
        message: recipeName
          ? `Recipe "${recipeName}" not found in your collection.`
          : "Recipe not found. Please specify a recipe name or ID.",
      };
    }

    // Validate requested macros if calories and macros are provided
    let validation = null;
    let macroGuidance = '';

    if (targetCalories && targetProtein && targetCarbs && targetFat) {
      validation = validateMacros(targetCalories, targetProtein, targetCarbs, targetFat);
      if (!validation.valid) {
        macroGuidance = `\n\n⚠️ MACRO VALIDATION WARNING: ${validation.reason}
Suggested realistic macros: ${formatMacrosForAI(targetCalories, 'balanced')}`;
      }
    } else if (targetCalories && targetProtein) {
      // Calculate realistic macros for the target
      const realistic = calculateRealisticMacros(targetCalories, 'balanced');
      macroGuidance = `\n\nRECOMMENDED MACROS for ${targetCalories} calories:
- Protein: ${realistic.protein.grams}g (you requested ${targetProtein}g)
- Carbs: ${realistic.carbs.grams}g
- Fat: ${realistic.fat.grams}g`;
    }

    // Build prompt for adaptation
    let prompt = `I have this recipe:

Title: ${recipe.title}
Current Nutrition (per serving):
- Calories: ${recipe.nutrition.caloriesPerServing}
- Protein: ${recipe.nutrition.proteinPerServing}g
- Carbs: ${recipe.nutrition.carbsPerServing}g
- Fat: ${recipe.nutrition.fatPerServing}g

Ingredients:
${recipe.ingredients.map(ing => `- ${ing.amount} ${ing.item}`).join('\n')}

Please adjust this recipe to meet these targets (per serving):`;

    if (targetCalories) prompt += `\n- Calories: ${targetCalories}`;
    if (targetProtein) prompt += `\n- Protein: ${targetProtein}g`;
    if (targetCarbs) prompt += `\n- Carbs: ${targetCarbs}g`;
    if (targetFat) prompt += `\n- Fat: ${targetFat}g`;

    prompt += macroGuidance;

    prompt += `\n\nIMPORTANT: Ensure the macros are realistic and match the calorie target. Remember:
- Protein: 4 calories per gram
- Carbs: 4 calories per gram
- Fat: 9 calories per gram

Provide the adjusted recipe with:
1. Modified ingredient amounts
2. Any ingredient substitutions needed
3. Updated nutrition facts that are REALISTIC
4. Brief explanation of changes made

Format as JSON with the same structure as the original recipe.`;

    // Get adapted recipe using retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.5,
        maxOutputTokens: 2000,
      });
    } catch (error) {
      console.error('❌ Recipe adaptation failed after retries:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    // Parse response with improved extraction
    let adaptedRecipe;
    try {
      adaptedRecipe = extractAndParseJSON(response);
    } catch (parseError) {
      console.error('❌ Adapted recipe parsing failed:', parseError);
      return {
        success: false,
        message: "Couldn't adapt the recipe properly. Please try again with different macro targets.",
        error: parseError.message,
      };
    }

    // Add metadata
    adaptedRecipe.id = `recipe_${Date.now()}`;
    adaptedRecipe.createdAt = new Date().toISOString();
    adaptedRecipe.createdBy = 'AI';
    adaptedRecipe.adaptedFrom = recipe.id;
    adaptedRecipe.title = `${recipe.title} (Adapted)`;

    // Save adapted recipe
    savedRecipes.push(adaptedRecipe);
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(savedRecipes));

    const message = `✅ Adapted "${recipe.title}"!

Original: ${recipe.nutrition.caloriesPerServing} cal, ${recipe.nutrition.proteinPerServing}g protein
New: ${adaptedRecipe.nutrition.caloriesPerServing} cal, ${adaptedRecipe.nutrition.proteinPerServing}g protein

Saved as "${adaptedRecipe.title}"!`;

    return {
      success: true,
      message,
      data: {
        originalRecipe: recipe,
        adaptedRecipe,
        recipeId: adaptedRecipe.id,
      },
      action: 'recipe_adapted',
    };

  } catch (error) {
    console.error('❌ adaptRecipeToMacros error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't adapt recipe. Please try again.",
    };
  }
}

/**
 * SUGGEST INGREDIENT SUBSTITUTIONS
 * User says: "I don't have chicken, what can I use instead?"
 *
 * Suggests alternative ingredients for a recipe
 */
export async function suggestIngredientSubstitutions({
  recipeId,
  recipeName,
  missingIngredient,
  availableIngredients = [],
  userId
}) {
  try {
    // Load user's recipes
    const RECIPES_KEY = '@saved_recipes';
    const savedRecipesStr = await AsyncStorage.getItem(RECIPES_KEY);
    const savedRecipes = savedRecipesStr ? JSON.parse(savedRecipesStr) : [];

    // Find the recipe
    let recipe = null;
    if (recipeId) {
      recipe = savedRecipes.find(r => r.id === recipeId);
    } else if (recipeName) {
      recipe = savedRecipes.find(r =>
        r.title.toLowerCase().includes(recipeName.toLowerCase())
      );
    }

    if (!recipe) {
      // If no recipe specified, provide general substitution advice
      let prompt = `What are good substitutes for ${missingIngredient} in cooking?`;

      if (availableIngredients.length > 0) {
        prompt += ` I have these ingredients available: ${availableIngredients.join(', ')}.`;
      }

      prompt += `\n\nProvide 3-5 substitution options with:
1. Substitute ingredient name
2. How to use it (measurement conversion if needed)
3. How it will affect the dish
4. Nutritional comparison (if significantly different)`;

      // Generate substitution suggestions with retry logic
      let response;
      try {
        response = await generateWithRetry(prompt, {
          temperature: 0.7,
          maxOutputTokens: 1500,
        });
      } catch (error) {
        console.error('❌ Substitution generation failed:', error);
        return {
          success: false,
          message: "Couldn't connect to AI service. Please check your internet connection and try again.",
          error: error.message,
        };
      }

      return {
        success: true,
        message: `🔄 Substitutes for ${missingIngredient}:\n\n${response}`,
        data: {
          missingIngredient,
          suggestions: response,
        },
      };
    }

    // Recipe-specific substitution
    let prompt = `In this recipe "${recipe.title}", I need to substitute ${missingIngredient}.

Recipe ingredients:
${recipe.ingredients.map(ing => `- ${ing.amount} ${ing.item}`).join('\n')}

Instructions:
${recipe.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}`;

    if (availableIngredients.length > 0) {
      prompt += `\n\nI have these ingredients available: ${availableIngredients.join(', ')}.`;
    }

    prompt += `\n\nProvide:
1. Best substitute option
2. Adjusted amount needed
3. Any changes to cooking instructions
4. How it will affect taste/nutrition
5. Alternative options if available`;

    // Generate recipe-specific substitution suggestions with retry logic
    let response;
    try {
      response = await generateWithRetry(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1500,
      });
    } catch (error) {
      console.error('❌ Recipe-specific substitution failed:', error);
      return {
        success: false,
        message: "Couldn't connect to AI service. Please check your internet connection and try again.",
        error: error.message,
      };
    }

    return {
      success: true,
      message: `🔄 Substitutes for ${missingIngredient} in "${recipe.title}":\n\n${response}`,
      data: {
        recipe: recipe.title,
        missingIngredient,
        suggestions: response,
      },
    };

  } catch (error) {
    console.error('❌ suggestIngredientSubstitutions error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't suggest substitutions. Please try again.",
    };
  }
}

/**
 * Generate mix-and-match meal components
 * @param {Object} params - Component generation parameters
 * @returns {Object} - Component options with prep instructions
 */
export async function generateMealComponents({
  componentTypes = ['protein', 'carb', 'vegetable', 'sauce'],
  optionsPerComponent = 3,
  dietaryRestrictions = [],
  cuisineStyle = 'any',
  userId,
}) {
  try {
    const prompt = `Generate ${optionsPerComponent} options for each of these meal components: ${componentTypes.join(', ')}.

REQUIREMENTS:
- Each component should be simple to prepare separately
- Include prep instructions, cook time, and storage time for each option
- All options should be meal prep friendly (can be stored 3-5 days)
- Consider dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'none'}
- Cuisine style: ${cuisineStyle}
- Focus on variety within each component type
- Include both quick-cook and batch-cook options

COMPONENT TYPES TO GENERATE:
${componentTypes.map(type => `- ${type.toUpperCase()}: ${optionsPerComponent} different options`).join('\n')}

Return ONLY valid JSON in this exact format:
{
  "components": {
    "protein": [
      {
        "name": "Grilled chicken breast",
        "prepTime": "5 minutes",
        "cookTime": "12 minutes",
        "totalTime": "17 minutes",
        "prepInstructions": "Season with salt, pepper, garlic powder. Grill 6-7 min per side until 165°F.",
        "storageTime": "4 days",
        "nutrition": {
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6
        }
      }
    ],
    "carb": [
      {
        "name": "Brown rice",
        "prepTime": "2 minutes",
        "cookTime": "45 minutes",
        "totalTime": "47 minutes",
        "prepInstructions": "Rinse 1 cup rice. Cook with 2 cups water, bring to boil, simmer covered 45 min.",
        "storageTime": "5 days",
        "nutrition": {
          "calories": 218,
          "protein": 5,
          "carbs": 46,
          "fat": 1.6
        }
      }
    ],
    "vegetable": [
      {
        "name": "Roasted broccoli",
        "prepTime": "5 minutes",
        "cookTime": "20 minutes",
        "totalTime": "25 minutes",
        "prepInstructions": "Cut into florets, toss with olive oil, salt, pepper. Roast at 425°F for 20 min.",
        "storageTime": "3 days",
        "nutrition": {
          "calories": 55,
          "protein": 4,
          "carbs": 11,
          "fat": 0.6
        }
      }
    ],
    "sauce": [
      {
        "name": "Lemon herb dressing",
        "prepTime": "5 minutes",
        "cookTime": "0 minutes",
        "totalTime": "5 minutes",
        "prepInstructions": "Mix lemon juice, olive oil, minced garlic, fresh herbs, salt, pepper.",
        "storageTime": "7 days",
        "nutrition": {
          "calories": 120,
          "protein": 0,
          "carbs": 2,
          "fat": 14
        }
      }
    ]
  },
  "mealPrepTips": [
    "Cook all proteins on Sunday and store in separate containers",
    "Prepare carbs in bulk and portion into containers",
    "Roast vegetables fresh every 2-3 days for best texture",
    "Keep sauces separate until serving to prevent sogginess"
  ],
  "assemblyInstructions": "Mix and match any protein + carb + vegetable + sauce for a complete meal in under 5 minutes"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();


    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const componentsData = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      components: componentsData.components,
      mealPrepTips: componentsData.mealPrepTips,
      assemblyInstructions: componentsData.assemblyInstructions,
      message: `Generated ${optionsPerComponent} options for each component type`,
    };

  } catch (error) {
    console.error('❌ generateMealComponents error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't generate meal components. Please try again.",
    };
  }
}

// Export tool schemas for Gemini function calling
export const recipeToolSchemas = [
  {
    name: 'generateRecipeFromIngredients',
    description: 'Generate a complete recipe from a list of ingredients with cooking instructions and nutrition facts. Use when user wants to create a recipe from ingredients they have.',
    parameters: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ingredients to use in the recipe (e.g., ["salmon", "quinoa", "asparagus"] or ["ground beef", "pasta", "tomatoes"]). Use varied, common ingredients.',
        },
        targetProtein: {
          type: 'number',
          description: 'Target grams of protein per serving (optional)',
        },
        targetCalories: {
          type: 'number',
          description: 'Target calories per serving (optional)',
        },
        cuisine: {
          type: 'string',
          description: 'Cuisine style (e.g., "Italian", "Asian", "Mexican") (optional)',
        },
        dietaryRestrictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary restrictions or preferences (e.g., ["vegetarian", "gluten-free", "dairy-free"]) (optional)',
        },
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'any'],
          description: 'Type of meal (optional, defaults to "any")',
        },
        maxPrepTime: {
          type: 'number',
          description: 'Maximum total time in minutes for quick meals (optional, e.g., 15 for quick meals)',
        },
        minPrepTime: {
          type: 'number',
          description: 'Minimum total time in minutes for full cooking meals (optional, e.g., 30 for proper cooking)',
        },
        mealPrepFriendly: {
          type: 'boolean',
          description: 'Whether the recipe should be meal prep friendly (optional, defaults to false)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['ingredients', 'userId'],
    },
  },
  {
    name: 'generateHighProteinRecipe',
    description: 'Generate a high-protein recipe optimized for maximum protein while keeping calories reasonable. Focuses on protein-dense foods like chicken, fish, eggs, Greek yogurt, cottage cheese, tofu. Use when user wants a high-protein meal.',
    parameters: {
      type: 'object',
      properties: {
        targetProtein: {
          type: 'number',
          description: 'Target grams of protein per serving (default: 40g)',
        },
        targetCalories: {
          type: 'number',
          description: 'Target calories per serving (optional, will optimize for protein-to-calorie ratio if not specified)',
        },
        cuisine: {
          type: 'string',
          description: 'Cuisine style (e.g., "Italian", "Asian", "Mexican") (optional)',
        },
        dietaryRestrictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary restrictions or preferences (e.g., ["vegetarian", "gluten-free", "dairy-free"]) (optional)',
        },
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'any'],
          description: 'Type of meal (optional, defaults to "any")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'adaptRecipeToMacros',
    description: 'Adapt an existing recipe to meet specific macro targets by adjusting portions and ingredients. Use when user wants to modify a recipe to hit their nutritional goals.',
    parameters: {
      type: 'object',
      properties: {
        recipeId: {
          type: 'string',
          description: 'ID of the recipe to adapt (optional if recipeName provided)',
        },
        recipeName: {
          type: 'string',
          description: 'Name of the recipe to adapt (optional if recipeId provided)',
        },
        targetCalories: {
          type: 'number',
          description: 'Target calories per serving',
        },
        targetProtein: {
          type: 'number',
          description: 'Target grams of protein per serving',
        },
        targetCarbs: {
          type: 'number',
          description: 'Target grams of carbs per serving (optional)',
        },
        targetFat: {
          type: 'number',
          description: 'Target grams of fat per serving (optional)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'suggestIngredientSubstitutions',
    description: 'Suggest alternative ingredients when user is missing an ingredient for a recipe. Provides substitution options with cooking adjustments.',
    parameters: {
      type: 'object',
      properties: {
        recipeId: {
          type: 'string',
          description: 'ID of the recipe (optional)',
        },
        recipeName: {
          type: 'string',
          description: 'Name of the recipe (optional)',
        },
        missingIngredient: {
          type: 'string',
          description: 'The ingredient that needs to be substituted',
        },
        availableIngredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ingredients the user has available (optional)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['missingIngredient', 'userId'],
    },
  },
  {
    name: 'generateMealComponents',
    description: 'Generate mix-and-match meal prep components (proteins, carbs, vegetables, sauces) that can be combined for flexible meal prep. Use when user wants meal prep options or wants to mix and match meal components.',
    parameters: {
      type: 'object',
      properties: {
        componentTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of components to generate (e.g., ["protein", "carb", "vegetable", "sauce"]) (optional, defaults to all types)',
        },
        optionsPerComponent: {
          type: 'number',
          description: 'Number of options to generate for each component type (optional, default: 3)',
        },
        dietaryRestrictions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dietary restrictions or preferences (e.g., ["vegetarian", "gluten-free", "dairy-free"]) (optional)',
        },
        cuisineStyle: {
          type: 'string',
          description: 'Cuisine style preference (e.g., "Asian", "Mediterranean", "Mexican") (optional, defaults to "any")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
];
