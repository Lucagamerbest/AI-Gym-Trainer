/**
 * ContentParserTools - AI tools for parsing imported content
 *
 * These tools parse recipes and workouts from images, PDFs, and text
 * using GPT-4o Vision API for images and text parsing for documents.
 */

import {
  CONTENT_TYPE_DETECTION_PROMPT,
  RECIPE_PARSE_PROMPT,
  RECIPE_MULTI_IMAGE_PARSE_PROMPT,
  RECIPE_TEXT_PARSE_PROMPT,
  WORKOUT_PARSE_PROMPT,
  WORKOUT_TEXT_PARSE_PROMPT,
  formatTextPrompt,
} from '../prompts/importPrompts';
import { findBestExerciseMatch } from '../../../utils/exerciseNameMatcher';

/**
 * HELPER: Extract and parse JSON from AI response
 * Uses multiple extraction methods for robustness
 */
function extractAndParseJSON(response) {
  // Handle null/undefined
  if (!response) {
    console.error('Empty response received');
    throw new Error('No response from AI - please try again');
  }

  // If response is already an object (JSON mode returns parsed object sometimes)
  if (typeof response === 'object') {
    return response;
  }

  // Response should be a string at this point
  if (typeof response !== 'string') {
    console.error('Invalid response type:', typeof response);
    throw new Error('Unexpected response format - please try again');
  }

  // Method 1: Extract from ```json code blocks
  let jsonMatch = response.match(/```json\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 2: Extract from regular ``` code blocks
  jsonMatch = response.match(/```\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return parseJSONSafely(jsonMatch[1]);
  }

  // Method 3: Try to find JSON object directly (find the outermost braces)
  const firstBrace = response.indexOf('{');
  const lastBrace = response.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = response.substring(firstBrace, lastBrace + 1);
    return parseJSONSafely(jsonCandidate);
  }

  // Method 4: Try parsing the entire response (last resort)
  return parseJSONSafely(response);
}

/**
 * HELPER: Parse JSON with error handling
 */
function parseJSONSafely(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') {
    throw new Error('No JSON content to parse');
  }

  try {
    // Clean common issues
    let cleaned = jsonStr
      .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
      .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
      .replace(/[\u0000-\u001F]/g, ' ') // Remove control characters
      .trim();

    // Handle case where AI prefixes with explanation
    if (cleaned.startsWith('I') || cleaned.startsWith('Here') || cleaned.startsWith('The')) {
      // Try to find JSON within the text
      const braceStart = cleaned.indexOf('{');
      if (braceStart !== -1) {
        cleaned = cleaned.substring(braceStart);
        // Find matching closing brace
        const braceEnd = cleaned.lastIndexOf('}');
        if (braceEnd !== -1) {
          cleaned = cleaned.substring(0, braceEnd + 1);
        }
      }
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing failed:', error.message);
    console.error('Attempted to parse:', jsonStr.substring(0, 200));
    throw new Error(`Failed to parse content: ${error.message}`);
  }
}

/**
 * HELPER: Validate recipe data structure
 */
function validateRecipeData(data) {
  const errors = [];

  if (!data.name && !data.title) {
    errors.push('Missing recipe name');
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    errors.push('Missing ingredients');
  }

  if (!data.instructions || data.instructions.length === 0) {
    errors.push('Missing instructions');
  }

  // Validate nutrition values are realistic
  if (data.nutrition) {
    if (data.nutrition.calories > 5000) {
      errors.push('Unrealistic calorie count');
    }
    if (data.nutrition.protein > 200) {
      errors.push('Unrealistic protein value');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * HELPER: Validate workout data structure
 */
function validateWorkoutData(data) {
  const errors = [];

  if (!data.name && !data.title) {
    errors.push('Missing workout name');
  }

  if (!data.days || data.days.length === 0) {
    errors.push('Missing workout days/exercises');
  } else {
    // Check each day has exercises
    data.days.forEach((day, i) => {
      if (!day.exercises || day.exercises.length === 0) {
        errors.push(`Day ${i + 1} has no exercises`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * HELPER: Normalize recipe to app's expected format
 */
function normalizeRecipe(parsed) {
  const recipe = {
    id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: parsed.name || parsed.title || 'Imported Recipe',
    title: parsed.name || parsed.title || 'Imported Recipe',
    description: parsed.description || '',
    servings: parsed.servings || 1,
    prepTime: parsed.prepTime || parsed.prep_time || 'Unknown',
    cookTime: parsed.cookTime || parsed.cook_time || 'Unknown',
    difficulty: parsed.difficulty || 'medium',
    mealType: parsed.mealType || 'any',
    tags: parsed.tags || [],
    source: 'imported',
    importedAt: new Date().toISOString(),
    confidence: parsed.confidence || 0.8,
  };

  // Normalize ingredients to app format
  recipe.ingredients = (parsed.ingredients || []).map(ing => {
    const quantity = ing.quantity || 100;
    const caloriesPer100g = ing.calories ? (ing.calories / quantity) * 100 : 0;
    const proteinPer100g = ing.protein ? (ing.protein / quantity) * 100 : 0;
    const carbsPer100g = ing.carbs ? (ing.carbs / quantity) * 100 : 0;
    const fatPer100g = ing.fat ? (ing.fat / quantity) * 100 : 0;

    return {
      food: {
        name: ing.name || ing.item || 'Unknown',
        calories: Math.round(caloriesPer100g),
        protein: Math.round(proteinPer100g * 10) / 10,
        carbs: Math.round(carbsPer100g * 10) / 10,
        fat: Math.round(fatPer100g * 10) / 10,
      },
      quantity: quantity,
      unit: ing.unit || 'g',
      original: ing.original || `${quantity}${ing.unit || 'g'} ${ing.name || ing.item}`,
    };
  });

  // Normalize instructions
  recipe.instructions = (parsed.instructions || []).map((inst, i) => {
    if (typeof inst === 'string') return inst;
    return inst.step || inst.instruction || `Step ${i + 1}`;
  });

  // Normalize nutrition
  recipe.nutrition = {
    calories: parsed.nutrition?.calories || 0,
    protein: parsed.nutrition?.protein || 0,
    carbs: parsed.nutrition?.carbs || 0,
    fat: parsed.nutrition?.fat || 0,
    caloriesPerServing: parsed.nutrition?.calories || 0,
    proteinPerServing: parsed.nutrition?.protein || 0,
    carbsPerServing: parsed.nutrition?.carbs || 0,
    fatPerServing: parsed.nutrition?.fat || 0,
  };

  return recipe;
}

/**
 * HELPER: Normalize exercises array and match against library
 * Returns { exercises: [], matchInfo: { matched: [], unmatched: [] } }
 */
function normalizeExercises(exercises, dayIndex = 0) {
  const matchInfo = { matched: [], unmatched: [] };

  const normalizedExercises = (exercises || []).map((ex, exIndex) => {
    // Normalize sets
    let sets = [];

    // Helper to normalize reps - preserves rep ranges like "8-12" or "812" → "8-12"
    const normalizeReps = (repsValue) => {
      if (!repsValue) return '10';
      const repsStr = String(repsValue).trim();

      // If already has a dash (e.g., "8-12"), keep it
      if (repsStr.includes('-')) {
        return repsStr;
      }

      // If it's just a number, return as-is
      if (/^\d+$/.test(repsStr)) {
        return repsStr;
      }

      // Handle formats like "8 to 12" or "8 - 12"
      const rangeMatch = repsStr.match(/(\d+)\s*(?:to|-)\s*(\d+)/i);
      if (rangeMatch) {
        return `${rangeMatch[1]}-${rangeMatch[2]}`;
      }

      // Fallback: try to extract any number
      const numMatch = repsStr.match(/\d+/);
      return numMatch ? numMatch[0] : '10';
    };

    // Get setsCount - prefer setsCount, fallback to sets array length, default to 3
    const setsCount = parseInt(ex.setsCount) || (ex.sets && Array.isArray(ex.sets) ? ex.sets.length : 3);
    const defaultReps = normalizeReps(ex.reps);
    const defaultWeight = ex.weight ? String(ex.weight) : '';

    if (ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0) {
      // Use existing sets array
      sets = ex.sets.map((set, setIndex) => ({
        id: `set_${setIndex}`,
        reps: normalizeReps(set.reps) || normalizeReps(ex.reps),
        weight: set.weight != null ? String(set.weight) : defaultWeight,
        completed: false,
      }));
    } else {
      // Create sets from setsCount and reps
      for (let i = 0; i < setsCount; i++) {
        sets.push({
          id: `set_${i}`,
          reps: defaultReps,
          weight: defaultWeight,
          completed: false,
        });
      }
    }

    const originalName = String(ex.name || 'Unknown Exercise');
    // Generate unique ID with timestamp + random to avoid React key conflicts
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const exerciseId = `exercise_${dayIndex}_${exIndex}_${uniqueSuffix}`;

    // Try to match against exercise library
    const match = findBestExerciseMatch(originalName, 0.5);

    let normalizedExercise;

    if (match && match.exercise) {
      // Matched! Copy ALL library exercise data for full functionality
      const libEx = match.exercise;

      // Check if exercise has multiple equipment variants
      const variants = libEx.variants || [];
      const hasMultipleVariants = variants.length > 1;

      // Try to detect equipment from the imported exercise name or data
      let detectedEquipment = ex.equipment || null;
      const inputLower = originalName.toLowerCase();

      // Check if input contains equipment hint
      if (!detectedEquipment) {
        const equipmentHints = ['barbell', 'dumbbell', 'cable', 'machine', 'smith', 'kettlebell', 'bodyweight', 'ez bar', 'resistance band'];
        for (const hint of equipmentHints) {
          if (inputLower.includes(hint)) {
            detectedEquipment = hint.charAt(0).toUpperCase() + hint.slice(1);
            if (hint === 'smith') detectedEquipment = 'Smith Machine';
            if (hint === 'ez bar') detectedEquipment = 'EZ Bar';
            break;
          }
        }
      }

      // If we detected equipment, try to find matching variant
      let selectedVariant = null;
      if (detectedEquipment && variants.length > 0) {
        selectedVariant = variants.find(v =>
          v.equipment?.toLowerCase() === detectedEquipment.toLowerCase()
        );
      }

      // Determine if variant selection is needed
      const needsVariantSelection = hasMultipleVariants && !selectedVariant;

      normalizedExercise = {
        // Copy entire library exercise data
        ...libEx,
        // Override with workout-specific fields
        id: exerciseId,
        libraryId: libEx.id,
        name: libEx.name, // Use canonical name from library
        originalName: originalName, // Keep original for reference
        sets: sets,
        restPeriod: String(ex.restPeriod || '60 seconds'),
        notes: String(ex.notes || ''),
        // Matching metadata
        isMatched: true,
        matchScore: match.score,
        isExactMatch: match.isExactMatch,
        // Variant selection
        selectedEquipment: selectedVariant?.equipment || detectedEquipment || null,
        selectedVariant: selectedVariant || null,
        needsVariantSelection: needsVariantSelection,
        availableVariants: variants.map(v => v.equipment),
      };

      matchInfo.matched.push({
        exerciseId,
        originalName,
        matchedName: libEx.name,
        libraryId: libEx.id,
        score: match.score,
        isExactMatch: match.isExactMatch,
        needsVariantSelection,
        availableVariants: variants.map(v => v.equipment),
        detectedEquipment,
      });
    } else {
      // Not matched - mark as custom
      normalizedExercise = {
        id: exerciseId,
        name: originalName,
        originalName: originalName,
        equipment: String(ex.equipment || 'Bodyweight'),
        sets: sets,
        restPeriod: String(ex.restPeriod || '60 seconds'),
        notes: String(ex.notes || ''),
        isMatched: false,
        isCustom: true,
      };

      matchInfo.unmatched.push({
        exerciseId,
        originalName,
        suggestedEquipment: ex.equipment || 'Bodyweight',
      });
    }

    return normalizedExercise;
  });

  return { exercises: normalizedExercises, matchInfo };
}

/**
 * HELPER: Normalize workout to app's expected format
 * Handles both standalone workouts and multi-day programs
 * Returns { workout: {}, exerciseMatchInfo: { matched: [], unmatched: [] } }
 */
function normalizeWorkout(parsed) {
  // Determine if this is a standalone workout or a program
  // isStandalone: true if explicitly set, or if only 1 day exists
  const isStandalone = parsed.isStandalone === true ||
    (parsed.isStandalone !== false && parsed.days && parsed.days.length === 1);

  // Collect all match info across all days
  const allMatchInfo = { matched: [], unmatched: [] };

  if (isStandalone) {
    // STANDALONE WORKOUT FORMAT (saved to @standalone_workouts)
    // Uses workout.day.exercises instead of workout.days[]
    const firstDay = parsed.days?.[0] || {};
    const { exercises, matchInfo } = normalizeExercises(firstDay.exercises || [], 0);

    // Collect match info
    allMatchInfo.matched.push(...matchInfo.matched);
    allMatchInfo.unmatched.push(...matchInfo.unmatched);

    const workout = {
      id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: String(parsed.name || parsed.title || 'Imported Workout'),
      description: String(parsed.description || 'Imported workout'),
      type: String(parsed.type || 'custom'),
      difficulty: String(parsed.difficulty || 'intermediate'),
      source: 'imported',
      importedAt: new Date().toISOString(),
      confidence: parsed.confidence || 0.8,
      isStandalone: true,
      // Single day format for standalone workouts
      day: {
        id: 'day_0',
        name: String(firstDay.name || parsed.name || 'Workout'),
        muscleGroups: (firstDay.muscleGroups || []).map(m => String(m)),
        exercises: exercises,
      },
    };

    return { workout, exerciseMatchInfo: allMatchInfo };
  } else {
    // PROGRAM FORMAT (saved to @workout_programs)
    // Uses workout.days[] array

    // First, sort parsed days by dayNumber to ensure correct order
    // (regardless of the order images were sent)
    const sortedParsedDays = [...(parsed.days || [])].sort((a, b) => {
      const dayA = parseInt(a.dayNumber) || 999;
      const dayB = parseInt(b.dayNumber) || 999;
      return dayA - dayB;
    });

    const days = sortedParsedDays.map((day, dayIndex) => {
      const { exercises, matchInfo } = normalizeExercises(day.exercises || [], dayIndex);

      // Collect match info from each day
      allMatchInfo.matched.push(...matchInfo.matched);
      allMatchInfo.unmatched.push(...matchInfo.unmatched);

      return {
        id: `day_${dayIndex}`,
        dayNumber: parseInt(day.dayNumber) || dayIndex + 1,
        name: String(day.name || `Day ${dayIndex + 1}`),
        muscleGroups: (day.muscleGroups || []).map(m => String(m)),
        exercises: exercises,
      };
    });

    const workout = {
      id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: String(parsed.name || parsed.title || 'Imported Program'),
      description: String(parsed.description || 'Imported workout program'),
      type: String(parsed.type || 'custom'),
      programDuration: parsed.programDuration ? String(parsed.programDuration) : null,
      frequency: parsed.frequency ? String(parsed.frequency) : null,
      difficulty: String(parsed.difficulty || 'intermediate'),
      source: 'imported',
      importedAt: new Date().toISOString(),
      confidence: parsed.confidence || 0.8,
      isStandalone: false,
      // Multi-day format for programs
      days: days,
    };

    return { workout, exerciseMatchInfo: allMatchInfo };
  }
}

/**
 * PARSE CONTENT FROM IMAGE
 * Analyzes an image using GPT-4o Vision to extract recipe or workout data
 */
export async function parseContentFromImage({
  imageBase64,
  contentHint = 'auto',
  userId,
}) {
  try {
    if (!imageBase64) {
      return {
        success: false,
        message: 'No image data provided. Please capture or select an image.',
      };
    }

    // Dynamically import AIService to avoid circular dependency
    const { default: AIService } = await import('../AIService');

    if (!AIService.isInitialized()) {
      return {
        success: false,
        message: 'AI Service not initialized. Please restart the app.',
      };
    }

    // Step 1: Detect content type if auto
    let contentType = contentHint;
    if (contentHint === 'auto') {
      try {
        const typeResponse = await AIService.analyzeImageContent(
          imageBase64,
          CONTENT_TYPE_DETECTION_PROMPT,
          { max_tokens: 50, temperature: 0.1 }
        );
        contentType = typeResponse.trim().toLowerCase();
        if (!['recipe', 'workout'].includes(contentType)) {
          contentType = 'unknown';
        }
      } catch (error) {
        console.error('Content type detection failed:', error);
        return {
          success: false,
          message: 'Could not determine content type. Please specify if this is a recipe or workout.',
        };
      }
    }

    if (contentType === 'unknown') {
      return {
        success: false,
        message: 'Could not identify this as a recipe or workout. Please try a clearer image or specify the content type.',
      };
    }

    // Step 2: Parse content based on type
    const parsePrompt = contentType === 'recipe' ? RECIPE_PARSE_PROMPT : WORKOUT_PARSE_PROMPT;

    let response;
    try {
      response = await AIService.analyzeImageContent(
        imageBase64,
        parsePrompt,
        { max_tokens: 4096, temperature: 0.3, json_mode: true }
      );
    } catch (error) {
      console.error('Image parsing failed:', error);
      return {
        success: false,
        message: 'Failed to analyze the image. Please try again with a clearer image.',
        error: error.message,
      };
    }

    // Step 3: Extract and parse JSON
    let parsed;
    try {
      parsed = extractAndParseJSON(response);
    } catch (error) {
      console.error('JSON extraction failed:', error);
      return {
        success: false,
        message: 'Could not extract structured data from the image. The image may be unclear or not contain valid content.',
        error: error.message,
      };
    }

    // Check if AI indicated it couldn't parse the content
    if (parsed.error || parsed.message?.toLowerCase().includes('cannot') || parsed.message?.toLowerCase().includes('not a workout')) {
      return {
        success: false,
        message: parsed.message || 'This image doesn\'t appear to contain a workout plan. Please try with an image showing exercises, sets, and reps.',
      };
    }

    // Step 4: Validate parsed data
    const validation = contentType === 'recipe'
      ? validateRecipeData(parsed)
      : validateWorkoutData(parsed);

    if (!validation.valid) {
      // Check if this looks like it's not actually a workout
      const isNotWorkout = validation.errors.includes('Missing workout days/exercises') ||
                          validation.errors.includes('Missing workout name');

      return {
        success: false,
        message: isNotWorkout
          ? 'This image doesn\'t appear to contain a workout plan. Please try with an image showing exercises, sets, and reps.'
          : `Parsed content has issues: ${validation.errors.join(', ')}. Please try a clearer image.`,
        partialData: parsed,
        errors: validation.errors,
      };
    }

    // Step 5: Normalize to app format
    let normalized;
    let exerciseMatchInfo = null;

    if (contentType === 'recipe') {
      normalized = normalizeRecipe(parsed);
    } else {
      const { workout, exerciseMatchInfo: matchInfo } = normalizeWorkout(parsed);
      normalized = workout;
      exerciseMatchInfo = matchInfo;
    }

    return {
      success: true,
      message: `Successfully parsed ${contentType}! Review the details and save when ready.`,
      contentType,
      data: normalized,
      exerciseMatchInfo, // Will be null for recipes, contains match data for workouts
      action: contentType === 'recipe' ? 'recipe_imported' : 'workout_imported',
      confidence: parsed.confidence || 0.8,
      needsReview: true,
    };

  } catch (error) {
    console.error('parseContentFromImage error:', error);
    return {
      success: false,
      message: 'An error occurred while parsing the image. Please try again.',
      error: error.message,
    };
  }
}

/**
 * PARSE RECIPE FROM MULTIPLE IMAGES
 * Combines multiple screenshots into a single unified recipe
 * Used when a recipe spans multiple pages/screenshots
 */
export async function parseRecipeFromMultipleImages({
  imagesBase64,
  userId,
}) {
  try {
    if (!imagesBase64 || imagesBase64.length === 0) {
      return {
        success: false,
        message: 'No images provided. Please select at least one image.',
      };
    }

    // Dynamically import AIService
    const { default: AIService } = await import('../AIService');

    if (!AIService.isInitialized()) {
      return {
        success: false,
        message: 'AI Service not initialized. Please restart the app.',
      };
    }

    // For single image, use regular parsing
    if (imagesBase64.length === 1) {
      return await parseContentFromImage({
        imageBase64: imagesBase64[0],
        contentHint: 'recipe',
        userId,
      });
    }

    // Parse multiple images at once
    let response;
    try {
      response = await AIService.analyzeMultipleImages(
        imagesBase64,
        RECIPE_MULTI_IMAGE_PARSE_PROMPT,
        { max_tokens: 4096, temperature: 0.3, json_mode: true }
      );
    } catch (error) {
      console.error('Multi-image parsing failed:', error);
      return {
        success: false,
        message: 'Failed to analyze the images. Please try again with clearer images.',
        error: error.message,
      };
    }

    // Extract and parse JSON
    let parsed;
    try {
      parsed = extractAndParseJSON(response);
    } catch (error) {
      console.error('JSON extraction failed:', error);
      return {
        success: false,
        message: 'Could not extract recipe data from the images. The images may be unclear or not contain valid recipe content.',
        error: error.message,
      };
    }

    // Check if AI indicated it couldn't parse the content
    if (parsed.error || parsed.message?.toLowerCase().includes('cannot')) {
      return {
        success: false,
        message: parsed.message || 'These images don\'t appear to contain a recipe. Please try with images showing ingredients and instructions.',
      };
    }

    // Validate parsed data
    const validation = validateRecipeData(parsed);

    if (!validation.valid) {
      return {
        success: false,
        message: `Parsed content has issues: ${validation.errors.join(', ')}. Please try with clearer images.`,
        partialData: parsed,
        errors: validation.errors,
      };
    }

    // Normalize to app format
    const normalized = normalizeRecipe(parsed);

    return {
      success: true,
      message: `Successfully parsed recipe from ${imagesBase64.length} images! Review the details and save when ready.`,
      contentType: 'recipe',
      data: normalized,
      action: 'recipe_imported',
      confidence: parsed.confidence || 0.85,
      needsReview: true,
      isMultiImage: true,
    };

  } catch (error) {
    console.error('parseRecipeFromMultipleImages error:', error);
    return {
      success: false,
      message: 'An error occurred while parsing the images. Please try again.',
      error: error.message,
    };
  }
}

/**
 * PARSE CONTENT FROM TEXT
 * Parses pasted text or extracted PDF content to extract recipe or workout data
 */
export async function parseContentFromText({
  text,
  contentHint = 'auto',
  userId,
}) {
  try {
    if (!text || text.trim().length < 20) {
      return {
        success: false,
        message: 'Text is too short. Please provide more content to parse.',
      };
    }

    // Dynamically import AIService
    const { default: AIService } = await import('../AIService');

    if (!AIService.isInitialized()) {
      return {
        success: false,
        message: 'AI Service not initialized. Please restart the app.',
      };
    }

    // Step 1: Detect content type if auto
    let contentType = contentHint;
    if (contentHint === 'auto') {
      try {
        const detectionPrompt = `${CONTENT_TYPE_DETECTION_PROMPT}\n\nTEXT TO ANALYZE:\n${text.substring(0, 500)}`;
        const typeResponse = await AIService.generateText(detectionPrompt, {
          max_tokens: 50,
          temperature: 0.1,
        });
        contentType = typeResponse.trim().toLowerCase();
        if (!['recipe', 'workout'].includes(contentType)) {
          contentType = 'unknown';
        }
      } catch (error) {
        console.error('Content type detection failed:', error);
        return {
          success: false,
          message: 'Could not determine content type from text.',
        };
      }
    }

    if (contentType === 'unknown') {
      return {
        success: false,
        message: 'Could not identify this as a recipe or workout. Please check the content.',
      };
    }

    // Step 2: Parse content based on type
    const basePrompt = contentType === 'recipe' ? RECIPE_TEXT_PARSE_PROMPT : WORKOUT_TEXT_PARSE_PROMPT;
    const parsePrompt = formatTextPrompt(basePrompt, text);

    let response;
    try {
      response = await AIService.generateText(parsePrompt, {
        max_tokens: 4096,
        temperature: 0.3,
        json_mode: true,
      });
    } catch (error) {
      console.error('Text parsing failed:', error);
      return {
        success: false,
        message: 'Failed to parse the text content. Please try again.',
        error: error.message,
      };
    }

    // Step 3: Extract and parse JSON
    let parsed;
    try {
      parsed = extractAndParseJSON(response);
    } catch (error) {
      console.error('JSON extraction failed:', error);
      return {
        success: false,
        message: 'Could not extract structured data from the text.',
        error: error.message,
      };
    }

    // Step 4: Validate
    const validation = contentType === 'recipe'
      ? validateRecipeData(parsed)
      : validateWorkoutData(parsed);

    if (!validation.valid) {
      return {
        success: false,
        message: `Parsed content has issues: ${validation.errors.join(', ')}`,
        partialData: parsed,
        errors: validation.errors,
      };
    }

    // Step 5: Normalize
    let normalized;
    let exerciseMatchInfo = null;

    if (contentType === 'recipe') {
      normalized = normalizeRecipe(parsed);
    } else {
      const { workout, exerciseMatchInfo: matchInfo } = normalizeWorkout(parsed);
      normalized = workout;
      exerciseMatchInfo = matchInfo;
    }

    return {
      success: true,
      message: `Successfully parsed ${contentType}! Review the details and save when ready.`,
      contentType,
      data: normalized,
      exerciseMatchInfo, // Will be null for recipes, contains match data for workouts
      action: contentType === 'recipe' ? 'recipe_imported' : 'workout_imported',
      confidence: parsed.confidence || 0.85,
      needsReview: true,
    };

  } catch (error) {
    console.error('parseContentFromText error:', error);
    return {
      success: false,
      message: 'An error occurred while parsing the text. Please try again.',
      error: error.message,
    };
  }
}

/**
 * Tool schemas for registration with ToolRegistry
 */
export const contentParserToolSchemas = [
  {
    name: 'parseContentFromImage',
    description: 'Parse recipe or workout content from an image (screenshot, photo). Uses GPT-4o Vision to extract structured data. Use when user shares an image of a recipe or workout plan.',
    parameters: {
      type: 'object',
      properties: {
        imageBase64: {
          type: 'string',
          description: 'Base64 encoded image data',
        },
        contentHint: {
          type: 'string',
          enum: ['recipe', 'workout', 'auto'],
          description: 'Expected content type, or "auto" to detect automatically (default: auto)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['imageBase64', 'userId'],
    },
  },
  {
    name: 'parseContentFromText',
    description: 'Parse recipe or workout content from raw text (copied from website, PDF, etc.). Use when user pastes text containing a recipe or workout plan.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Raw text content to parse',
        },
        contentHint: {
          type: 'string',
          enum: ['recipe', 'workout', 'auto'],
          description: 'Expected content type, or "auto" to detect automatically (default: auto)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['text', 'userId'],
    },
  },
];

export default {
  parseContentFromImage,
  parseRecipeFromMultipleImages,
  parseContentFromText,
  contentParserToolSchemas,
};
