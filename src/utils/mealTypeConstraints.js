/**
 * Meal Type Constraints
 *
 * Defines realistic constraints, calorie ranges, and food categories
 * for different meal types (breakfast, lunch, dinner, snack)
 */

/**
 * Meal type constraints defining realistic characteristics for each meal
 */
export const MEAL_TYPE_CONSTRAINTS = {
  breakfast: {
    calorieRange: { min: 300, max: 600, ideal: 450 },
    description: 'Morning meal to start the day',

    // Common breakfast food categories
    typicalFoods: {
      proteins: ['eggs', 'egg whites', 'Greek yogurt', 'cottage cheese', 'protein powder', 'turkey sausage', 'smoked salmon', 'bacon (in moderation)'],
      carbs: ['oats', 'oatmeal', 'whole wheat toast', 'whole grain bread', 'bagels', 'English muffins', 'pancakes', 'waffles', 'cereal', 'granola', 'fruit'],
      healthy_fats: ['avocado', 'nuts', 'nut butters', 'seeds', 'olive oil'],
      extras: ['berries', 'bananas', 'apples', 'honey', 'maple syrup', 'cinnamon'],
    },

    // Foods that are unusual for breakfast
    avoidFoods: ['heavy pasta dishes', 'pizza', 'burgers', 'sandwiches', 'steak', 'pork chops', 'rice bowls', 'stir fry'],

    characteristics: [
      'Often includes eggs or dairy',
      'Sweet or savory options',
      'Quick to prepare or can be made ahead',
      'Includes coffee or tea often',
      'Lighter than lunch/dinner',
    ],

    mealStyleExamples: [
      'Scrambled eggs with toast and avocado',
      'Oatmeal with protein powder and berries',
      'Greek yogurt parfait with granola',
      'Protein pancakes with fruit',
      'Veggie omelet with whole wheat toast',
      'Smoothie bowl with toppings',
    ],
  },

  lunch: {
    calorieRange: { min: 400, max: 700, ideal: 550 },
    description: 'Midday meal to sustain energy',

    typicalFoods: {
      proteins: ['chicken breast', 'turkey', 'tuna', 'salmon', 'shrimp', 'tofu', 'tempeh', 'lean beef', 'eggs', 'chickpeas', 'lentils'],
      carbs: ['rice', 'quinoa', 'pasta', 'bread', 'wraps', 'tortillas', 'potatoes', 'sweet potatoes', 'couscous', 'bulgur'],
      vegetables: ['mixed greens', 'spinach', 'lettuce', 'tomatoes', 'cucumbers', 'bell peppers', 'onions', 'carrots', 'broccoli'],
      healthy_fats: ['olive oil', 'avocado', 'nuts', 'seeds', 'cheese (moderate)', 'dressing'],
    },

    avoidFoods: ['breakfast cereals', 'pancakes', 'waffles', 'oatmeal'],

    characteristics: [
      'Balanced and filling',
      'Can be packed/portable',
      'Often includes vegetables',
      'Sandwiches, salads, or bowls common',
      'Moderate portion sizes',
    ],

    mealStyleExamples: [
      'Grilled chicken salad with vinaigrette',
      'Turkey and avocado wrap',
      'Chicken and rice bowl with veggies',
      'Tuna pasta salad',
      'Quinoa Buddha bowl',
      'Chicken sandwich with side salad',
    ],
  },

  dinner: {
    calorieRange: { min: 500, max: 800, ideal: 650 },
    description: 'Evening meal, typically the largest',

    typicalFoods: {
      proteins: ['chicken', 'beef', 'pork', 'salmon', 'tilapia', 'cod', 'shrimp', 'turkey', 'lamb', 'tofu', 'tempeh'],
      carbs: ['rice', 'pasta', 'potatoes', 'sweet potatoes', 'quinoa', 'bread', 'couscous', 'polenta'],
      vegetables: ['broccoli', 'asparagus', 'green beans', 'Brussels sprouts', 'zucchini', 'bell peppers', 'spinach', 'kale', 'carrots', 'cauliflower'],
      healthy_fats: ['olive oil', 'butter (moderate)', 'avocado', 'nuts', 'cheese'],
    },

    avoidFoods: ['breakfast cereals', 'oatmeal', 'pancakes'],

    characteristics: [
      'Largest meal of the day typically',
      'More time for preparation',
      'Often cooked/hot meals',
      'Protein + carb + vegetable combination',
      'Can be more indulgent',
    ],

    mealStyleExamples: [
      'Grilled salmon with roasted vegetables and rice',
      'Chicken breast with sweet potato and broccoli',
      'Beef stir-fry with mixed vegetables',
      'Pasta with lean ground turkey and marinara',
      'Pork tenderloin with quinoa and asparagus',
      'Baked cod with green beans and potatoes',
    ],
  },

  snack: {
    calorieRange: { min: 100, max: 300, ideal: 200 },
    description: 'Small meal between main meals',

    typicalFoods: {
      proteins: ['protein bar', 'Greek yogurt', 'cottage cheese', 'protein shake', 'jerky', 'hard-boiled eggs', 'cheese', 'edamame', 'protein balls'],
      carbs: ['fruit', 'crackers', 'rice cakes', 'popcorn', 'pretzels', 'granola bar'],
      healthy_fats: ['nuts', 'nut butter', 'seeds', 'avocado', 'dark chocolate'],
      vegetables: ['baby carrots', 'cherry tomatoes', 'celery sticks', 'cucumber slices', 'bell pepper strips'],
    },

    avoidFoods: ['full meals', 'large portions', 'heavy dishes', 'pasta bowls', 'rice bowls', 'full sandwiches', 'burgers'],

    characteristics: [
      'Small portion sizes',
      'Quick and convenient',
      'Often portable',
      'Should not replace meals',
      'Light and easy to digest',
      'Ideally 100-300 calories max',
    ],

    mealStyleExamples: [
      'Apple with peanut butter',
      'Greek yogurt with berries',
      'Protein shake',
      'Handful of almonds',
      'String cheese and crackers',
      'Hard-boiled eggs',
      'Protein bar',
      'Cottage cheese with fruit',
    ],
  },

  any: {
    // Fallback for when meal type is not specified
    calorieRange: { min: 300, max: 700, ideal: 500 },
    description: 'General meal without specific type',

    characteristics: [
      'Flexible approach',
      'Can be any meal style',
      'Focus on balanced macros',
    ],
  },
};

/**
 * Get constraints for a specific meal type
 * @param {string} mealType - 'breakfast', 'lunch', 'dinner', 'snack', or 'any'
 * @returns {object} Meal type constraints
 */
export function getMealTypeConstraints(mealType = 'any') {
  return MEAL_TYPE_CONSTRAINTS[mealType.toLowerCase()] || MEAL_TYPE_CONSTRAINTS.any;
}

/**
 * Validate if calories are appropriate for meal type
 * @param {number} calories - Target calories
 * @param {string} mealType - Meal type
 * @returns {object} { valid: boolean, reason: string, suggestion: number }
 */
export function validateCaloriesForMealType(calories, mealType = 'any') {
  const constraints = getMealTypeConstraints(mealType);
  const { min, max, ideal } = constraints.calorieRange;

  if (calories < min) {
    return {
      valid: false,
      reason: `${calories} calories is too low for ${mealType}. Minimum is ${min} calories.`,
      suggestion: ideal,
    };
  }

  if (calories > max) {
    return {
      valid: false,
      reason: `${calories} calories is too high for ${mealType}. Maximum is ${max} calories.`,
      suggestion: ideal,
    };
  }

  return {
    valid: true,
    reason: `${calories} calories is appropriate for ${mealType}`,
    suggestion: calories,
  };
}

/**
 * Get ideal calorie range for meal type
 * @param {string} mealType - Meal type
 * @returns {string} Formatted calorie range
 */
export function getCalorieRangeForMealType(mealType = 'any') {
  const constraints = getMealTypeConstraints(mealType);
  const { min, max, ideal } = constraints.calorieRange;
  return `${min}-${max} calories (ideal: ~${ideal} cal)`;
}

/**
 * Format meal type guidance for AI prompts
 * @param {string} mealType - Meal type
 * @returns {string} Formatted guidance text
 */
export function formatMealTypeGuidanceForAI(mealType = 'any') {
  const constraints = getMealTypeConstraints(mealType);
  const { min, max, ideal } = constraints.calorieRange;

  let guidance = `\n\n🍽️ MEAL TYPE: ${mealType.toUpperCase()}`;
  guidance += `\nCalorie Range: ${min}-${max} calories (ideal: ~${ideal} calories)`;
  guidance += `\nDescription: ${constraints.description}`;

  if (constraints.characteristics) {
    guidance += `\n\nCharacteristics:`;
    constraints.characteristics.forEach(char => {
      guidance += `\n- ${char}`;
    });
  }

  if (constraints.typicalFoods) {
    guidance += `\n\nTypical Foods for ${mealType}:`;
    Object.entries(constraints.typicalFoods).forEach(([category, foods]) => {
      guidance += `\n- ${category}: ${foods.slice(0, 5).join(', ')}${foods.length > 5 ? ', etc.' : ''}`;
    });
  }

  if (constraints.avoidFoods && constraints.avoidFoods.length > 0) {
    guidance += `\n\n⚠️ AVOID for ${mealType}: ${constraints.avoidFoods.join(', ')}`;
  }

  if (constraints.mealStyleExamples && constraints.mealStyleExamples.length > 0) {
    guidance += `\n\nExample ${mealType} meals:`;
    constraints.mealStyleExamples.slice(0, 3).forEach(example => {
      guidance += `\n- ${example}`;
    });
  }

  return guidance;
}

/**
 * Get recommended protein range for meal type and calories
 * @param {string} mealType - Meal type
 * @param {number} calories - Target calories
 * @returns {object} { min: number, max: number, ideal: number }
 */
export function getProteinRangeForMealType(mealType, calories) {
  // Higher protein % for snacks and breakfast, moderate for lunch/dinner
  let proteinPercent;

  switch (mealType.toLowerCase()) {
    case 'snack':
      proteinPercent = 0.35; // 35% for snacks (protein bars, yogurt, etc.)
      break;
    case 'breakfast':
      proteinPercent = 0.30; // 30% for breakfast
      break;
    case 'lunch':
    case 'dinner':
      proteinPercent = 0.30; // 30% for main meals
      break;
    default:
      proteinPercent = 0.30;
  }

  const idealProtein = Math.round((calories * proteinPercent) / 4);

  return {
    min: Math.round(idealProtein * 0.8),
    max: Math.round(idealProtein * 1.2),
    ideal: idealProtein,
  };
}
