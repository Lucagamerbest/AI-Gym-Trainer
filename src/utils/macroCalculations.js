/**
 * Macro Calculation Utilities
 *
 * Provides realistic macro recommendations based on calorie targets
 * Uses evidence-based nutrition guidelines for balanced meals
 */

/**
 * Calculate realistic macro ranges for a given calorie target
 *
 * Based on general nutrition guidelines:
 * - Protein: 25-35% of calories (prioritize higher end for fitness)
 * - Carbs: 40-50% of calories
 * - Fat: 20-30% of calories
 *
 * @param {number} targetCalories - Target calories for the meal
 * @param {string} goalType - 'muscle-building', 'fat-loss', 'balanced', or 'high-protein'
 * @returns {object} - Recommended macro ranges
 */
export function calculateRealisticMacros(targetCalories, goalType = 'balanced') {
  // Calorie per gram
  const PROTEIN_CALS = 4; // 4 calories per gram
  const CARBS_CALS = 4;   // 4 calories per gram
  const FAT_CALS = 9;     // 9 calories per gram

  let proteinPercent, carbsPercent, fatPercent;

  switch (goalType) {
    case 'muscle-building':
    case 'high-protein':
      // High protein for muscle building
      proteinPercent = 0.35; // 35% protein
      carbsPercent = 0.45;   // 45% carbs
      fatPercent = 0.20;     // 20% fat
      break;

    case 'fat-loss':
      // Moderate protein, lower carbs
      proteinPercent = 0.30; // 30% protein
      carbsPercent = 0.40;   // 40% carbs
      fatPercent = 0.30;     // 30% fat
      break;

    case 'balanced':
    default:
      // Balanced macros
      proteinPercent = 0.30; // 30% protein
      carbsPercent = 0.45;   // 45% carbs
      fatPercent = 0.25;     // 25% fat
      break;
  }

  // Calculate grams from percentages
  const proteinGrams = Math.round((targetCalories * proteinPercent) / PROTEIN_CALS);
  const carbsGrams = Math.round((targetCalories * carbsPercent) / CARBS_CALS);
  const fatGrams = Math.round((targetCalories * fatPercent) / FAT_CALS);

  return {
    protein: {
      grams: proteinGrams,
      min: Math.round(proteinGrams * 0.9), // Allow 10% variance
      max: Math.round(proteinGrams * 1.1),
      percentage: Math.round(proteinPercent * 100),
    },
    carbs: {
      grams: carbsGrams,
      min: Math.round(carbsGrams * 0.9),
      max: Math.round(carbsGrams * 1.1),
      percentage: Math.round(carbsPercent * 100),
    },
    fat: {
      grams: fatGrams,
      min: Math.round(fatGrams * 0.9),
      max: Math.round(fatGrams * 1.1),
      percentage: Math.round(fatPercent * 100),
    },
  };
}

/**
 * Validate if requested macros are realistic for the given calories
 *
 * @param {number} calories - Target calories
 * @param {number} protein - Requested protein (g)
 * @param {number} carbs - Requested carbs (g)
 * @param {number} fat - Requested fat (g)
 * @returns {object} - { valid: boolean, reason: string, suggestion: object }
 */
export function validateMacros(calories, protein, carbs, fat) {
  const PROTEIN_CALS = 4;
  const CARBS_CALS = 4;
  const FAT_CALS = 9;

  const totalMacroCals = (protein * PROTEIN_CALS) + (carbs * CARBS_CALS) + (fat * FAT_CALS);
  const variance = Math.abs(totalMacroCals - calories);
  const variancePercent = (variance / calories) * 100;

  // Allow up to 10% variance
  if (variancePercent > 10) {
    const realisticMacros = calculateRealisticMacros(calories, 'balanced');
    return {
      valid: false,
      reason: `Macros don't match calories. ${totalMacroCals} cal from macros vs ${calories} cal target (${Math.round(variancePercent)}% difference)`,
      suggestion: realisticMacros,
    };
  }

  // Check if protein is unrealistically high
  const proteinPercent = (protein * PROTEIN_CALS) / calories;
  if (proteinPercent > 0.45) {
    return {
      valid: false,
      reason: `Protein too high (${Math.round(proteinPercent * 100)}%). Max realistic is ~40-45% of calories.`,
      suggestion: calculateRealisticMacros(calories, 'high-protein'),
    };
  }

  // Check if fat is too low (unhealthy)
  const fatPercent = (fat * FAT_CALS) / calories;
  if (fatPercent < 0.15) {
    return {
      valid: false,
      reason: `Fat too low (${Math.round(fatPercent * 100)}%). Minimum healthy is ~15-20% of calories.`,
      suggestion: calculateRealisticMacros(calories, 'fat-loss'),
    };
  }

  return {
    valid: true,
    reason: 'Macros are realistic',
    actual: {
      proteinPercent: Math.round(proteinPercent * 100),
      carbsPercent: Math.round(((carbs * CARBS_CALS) / calories) * 100),
      fatPercent: Math.round(fatPercent * 100),
    },
  };
}

/**
 * Get macro recommendations for different meal sizes
 *
 * @param {string} goalType - 'muscle-building', 'fat-loss', or 'balanced'
 * @returns {object} - Macro recommendations for small/medium/large meals
 */
export function getMealSizeRecommendations(goalType = 'balanced') {
  return {
    snack: {
      calories: 200,
      macros: calculateRealisticMacros(200, goalType),
    },
    small: {
      calories: 400,
      macros: calculateRealisticMacros(400, goalType),
    },
    medium: {
      calories: 600,
      macros: calculateRealisticMacros(600, goalType),
    },
    large: {
      calories: 800,
      macros: calculateRealisticMacros(800, goalType),
    },
  };
}

/**
 * Calculate recommended meal distribution for daily calories
 *
 * @param {number} dailyCalories - Total daily calorie goal
 * @param {number} mealsPerDay - Number of meals (3-6)
 * @returns {object} - Recommended calorie distribution
 */
export function calculateMealDistribution(dailyCalories, mealsPerDay = 3) {
  if (mealsPerDay === 3) {
    // Traditional 3 meals: breakfast (25%), lunch (35%), dinner (40%)
    return {
      breakfast: Math.round(dailyCalories * 0.25),
      lunch: Math.round(dailyCalories * 0.35),
      dinner: Math.round(dailyCalories * 0.40),
    };
  } else if (mealsPerDay === 4) {
    // 3 meals + 1 snack
    return {
      breakfast: Math.round(dailyCalories * 0.25),
      lunch: Math.round(dailyCalories * 0.30),
      snack: Math.round(dailyCalories * 0.10),
      dinner: Math.round(dailyCalories * 0.35),
    };
  } else if (mealsPerDay === 5) {
    // 3 meals + 2 snacks
    return {
      breakfast: Math.round(dailyCalories * 0.20),
      snack1: Math.round(dailyCalories * 0.10),
      lunch: Math.round(dailyCalories * 0.30),
      snack2: Math.round(dailyCalories * 0.10),
      dinner: Math.round(dailyCalories * 0.30),
    };
  } else {
    // 6+ meals: even distribution
    const caloriesPerMeal = Math.round(dailyCalories / mealsPerDay);
    const meals = {};
    for (let i = 1; i <= mealsPerDay; i++) {
      meals[`meal${i}`] = caloriesPerMeal;
    }
    return meals;
  }
}

/**
 * Format macro recommendations for AI prompts
 */
export function formatMacrosForAI(calories, goalType = 'balanced') {
  const macros = calculateRealisticMacros(calories, goalType);
  return `${calories} calories with approximately ${macros.protein.grams}g protein (${macros.protein.percentage}%), ${macros.carbs.grams}g carbs (${macros.carbs.percentage}%), and ${macros.fat.grams}g fat (${macros.fat.percentage}%)`;
}
