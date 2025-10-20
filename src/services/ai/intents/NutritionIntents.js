/**
 * Nutrition Intent Detection
 * Handles intent detection for NutritionScreen
 */

/**
 * Detect nutrition-related intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectNutritionIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'NutritionScreen' && screen !== 'Nutrition') {
    return null;
  }

  // ADD_FOOD - "add chicken" / "log 200g chicken breast"
  if ((msg.includes('add') || msg.includes('log')) &&
      !msg.includes('workout') && !msg.includes('exercise')) {
    // Extract food name and quantity
    const quantityMatch = msg.match(/(\d+)\s*(g|grams?|oz)/i);
    const foodWords = msg.split(' ').filter(w =>
      !['add', 'log', 'the', 'some', 'a', 'an', 'to'].includes(w.toLowerCase()) &&
      !/\d/.test(w)
    );

    return {
      intent: 'ADD_FOOD',
      confidence: 0.85,
      parameters: {
        foodName: foodWords.join(' ') || null,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : null
      }
    };
  }

  // SUGGEST_MEAL - "what should I eat" / "meal idea" / "suggest lunch"
  if ((msg.includes('what') && msg.includes('eat')) ||
      msg.includes('suggest') || msg.includes('meal idea') ||
      msg.includes('what to eat') || msg.includes('food recommendation')) {
    return {
      intent: 'SUGGEST_MEAL',
      confidence: 0.9,
      parameters: {}
    };
  }

  // CHECK_MACRO_BREAKDOWN - "show protein by meal" / "macros breakdown"
  if (msg.includes('breakdown') || msg.includes('macros by meal') ||
      (msg.includes('show') && (msg.includes('protein') || msg.includes('macros')))) {
    return {
      intent: 'CHECK_MACRO_BREAKDOWN',
      confidence: 0.85,
      parameters: {}
    };
  }

  // CHECK_NUTRITION_PROGRESS - "am I on track" / "calories left" / "how am I doing"
  if (msg.includes('on track') || msg.includes('left today') ||
      msg.includes('remaining') || msg.includes('how am i doing') ||
      (msg.includes('calories') && msg.includes('left'))) {
    return {
      intent: 'CHECK_NUTRITION_PROGRESS',
      confidence: 0.9,
      parameters: {}
    };
  }

  return null;
}

/**
 * Detect home screen nutrition intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectHomeScreenNutritionIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'HomeScreen' && screen !== 'Home') {
    return null;
  }

  // CHECK_NUTRITION - "protein goal" / "calories today" / "macros"
  if (msg.includes('protein') || msg.includes('calories') ||
      msg.includes('macros') || msg.includes('nutrition')) {
    return {
      intent: 'CHECK_NUTRITION',
      confidence: 0.85,
      parameters: {}
    };
  }

  return null;
}
