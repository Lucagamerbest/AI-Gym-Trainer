/**
 * RecipeTools - AI tools for recipe generation and management
 *
 * These tools help users create, modify, and optimize recipes using AI
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

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
  userId
}) {
  try {
    console.log('🍳 Generating recipe from ingredients:', {
      ingredients,
      targetProtein,
      targetCalories,
      cuisine,
      dietaryRestrictions,
      mealType
    });

    // Validate inputs
    if (!ingredients || ingredients.length === 0) {
      return {
        success: false,
        message: "Please provide at least one ingredient to generate a recipe.",
      };
    }

    // Build prompt for recipe generation
    let prompt = `Create a detailed, healthy recipe using these ingredients: ${ingredients.join(', ')}.

Requirements:
- Include step-by-step cooking instructions (KEEP EACH STEP SHORT AND CLEAR - max 1-2 sentences per step)
- Provide exact measurements for all ingredients
- Calculate nutritional information (calories, protein, carbs, fat per serving)
- Make it realistic and easy to prepare
- Specify number of servings`;

    if (targetProtein) {
      prompt += `\n- Target approximately ${targetProtein}g of protein per serving`;
    }

    if (targetCalories) {
      prompt += `\n- Target approximately ${targetCalories} calories per serving`;
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
  "difficulty": "easy/medium/hard",
  "ingredients": [
    { "item": "ingredient name", "amount": "2 cups", "calories": 200, "protein": 10, "carbs": 20, "fat": 5 }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "nutrition": {
    "caloriesPerServing": 450,
    "proteinPerServing": 35,
    "carbsPerServing": 40,
    "fatPerServing": 12
  },
  "tags": ["high-protein", "quick", "healthy"],
  "tips": ["Optional cooking tip 1", "Optional cooking tip 2"]
}`;

    // Import GoogleGenerativeAI and get API key from AIService
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { default: AIService } = await import('../AIService');

    // Get API key from AIService (already initialized)
    if (!AIService.apiKey) {
      return {
        success: false,
        message: "Gemini API key not configured. Please restart the app.",
      };
    }

    const genAI = new GoogleGenerativeAI(AIService.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Generate recipe using AI with JSON mode
    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
    const response = result.response.text();

    // Parse the JSON response
    let recipe;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      recipe = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError);
      return {
        success: false,
        message: "AI generated a recipe but it couldn't be formatted properly. Please try again.",
        rawResponse: response,
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
    console.log('🔧 Normalizing ingredients:', recipe.ingredients);

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

      console.log(`  ${ingredient.item}: ${quantity}g, ${ingredient.calories}cal total -> ${caloriesPer100g.toFixed(1)}cal/100g`);

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
    console.log('💪 Generating high-protein recipe:', {
      targetProtein,
      targetCalories,
      cuisine,
      dietaryRestrictions,
      mealType
    });

    // Build specialized prompt for high-protein recipes
    let prompt = `Create a detailed, high-protein recipe optimized for maximum protein while keeping calories reasonable.

CRITICAL PROTEIN REQUIREMENTS:
- Target ${targetProtein}g of protein per serving (${targetProtein - 5}g to ${targetProtein + 5}g acceptable)
- Focus on PROTEIN-DENSE foods: chicken breast, salmon, tuna, eggs, Greek yogurt, cottage cheese, tofu, lean beef, turkey, shrimp, protein powder
- Avoid high-calorie/low-protein foods: oils, butter, nuts (use sparingly), regular cheese (use sparingly)
- Maximize protein-to-calorie ratio`;

    if (targetCalories) {
      prompt += `\n- Target approximately ${targetCalories} calories per serving (${targetCalories - 50} to ${targetCalories + 50} acceptable)
- Keep calories in check by using lean proteins and limiting added fats`;
    } else {
      prompt += `\n- Keep calories reasonable (aim for 400-600 calories per serving)
- Prioritize lean proteins over fatty proteins`;
    }

    prompt += `\n\nREQUIREMENTS:
- Include step-by-step cooking instructions (KEEP EACH STEP SHORT AND CLEAR - max 1-2 sentences per step)
- Provide exact measurements for all ingredients
- Calculate nutritional information (calories, protein, carbs, fat per serving)
- Make it realistic and easy to prepare
- Specify number of servings`;

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
  "difficulty": "easy/medium/hard",
  "ingredients": [
    { "item": "ingredient name", "amount": "200g", "calories": 330, "protein": 62, "carbs": 0, "fat": 7 }
  ],
  "instructions": [
    "Step 1 description",
    "Step 2 description"
  ],
  "nutrition": {
    "caloriesPerServing": ${targetCalories || 500},
    "proteinPerServing": ${targetProtein},
    "carbsPerServing": 30,
    "fatPerServing": 10
  },
  "tags": ["high-protein", "lean", "healthy"],
  "tips": ["Optional cooking tip 1", "Optional cooking tip 2"]
}

IMPORTANT: The nutrition.proteinPerServing MUST be within ${targetProtein - 5}g to ${targetProtein + 5}g range!`;

    // Import GoogleGenerativeAI and get API key from AIService
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { default: AIService } = await import('../AIService');

    // Get API key from AIService (already initialized)
    if (!AIService.apiKey) {
      return {
        success: false,
        message: "Gemini API key not configured. Please restart the app.",
      };
    }

    const genAI = new GoogleGenerativeAI(AIService.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Generate recipe using AI with JSON mode
    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    });
    const response = result.response.text();

    // Parse the JSON response
    let recipe;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      recipe = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError);
      return {
        success: false,
        message: "AI generated a recipe but it couldn't be formatted properly. Please try again.",
        rawResponse: response,
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
    console.log('🔧 Normalizing ingredients:', recipe.ingredients);

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

      console.log(`  ${ingredient.item}: ${quantity}g, ${ingredient.protein}g protein, ${ingredient.calories}cal total`);

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
    console.log('🔧 Adapting recipe to macros:', {
      recipeId,
      recipeName,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat
    });

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

    prompt += `\n\nProvide the adjusted recipe with:
1. Modified ingredient amounts
2. Any ingredient substitutions needed
3. Updated nutrition facts
4. Brief explanation of changes made

Format as JSON with the same structure as the original recipe.`;

    // Import GoogleGenerativeAI and get API key from AIService
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { default: AIService } = await import('../AIService');

    // Get API key from AIService
    if (!AIService.apiKey) {
      return {
        success: false,
        message: "Gemini API key not configured.",
      };
    }

    const genAI = new GoogleGenerativeAI(AIService.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get adapted recipe
    const result = await model.generateContent(prompt, {
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2000,
      },
    });
    const response = result.response.text();

    // Parse response
    let adaptedRecipe;
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      adaptedRecipe = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse adapted recipe JSON:', parseError);
      return {
        success: false,
        message: "Couldn't adapt the recipe properly. Please try again.",
        rawResponse: response,
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
    console.log('🔄 Suggesting ingredient substitutions:', {
      recipeId,
      recipeName,
      missingIngredient,
      availableIngredients
    });

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

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const { default: AIService } = await import('../AIService');

      if (!AIService.apiKey) {
        return {
          success: false,
          message: "Gemini API key not configured.",
        };
      }

      const genAI = new GoogleGenerativeAI(AIService.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt);
      const response = result.response.text();

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

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { default: AIService } = await import('../AIService');

    if (!AIService.apiKey) {
      return {
        success: false,
        message: "Gemini API key not configured.",
      };
    }

    const genAI = new GoogleGenerativeAI(AIService.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

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
];
