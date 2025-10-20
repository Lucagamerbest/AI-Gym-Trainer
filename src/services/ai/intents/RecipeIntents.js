/**
 * Recipe Intent Detection
 * Handles intent detection for RecipesScreen
 */

/**
 * Detect recipe-related intents
 * @param {string} message - User's message
 * @param {string} screen - Current screen
 * @returns {Object|null} - Intent object or null if no intent detected
 */
export function detectRecipeIntents(message, screen) {
  const msg = message.toLowerCase().trim();

  if (screen !== 'RecipesScreen' && screen !== 'Recipes') {
    return null;
  }

  // FIND_RECIPE - "find a high protein recipe" / "recipe for chicken" / "show me a recipe"
  if ((msg.includes('find') || msg.includes('search') || msg.includes('show')) &&
      msg.includes('recipe')) {
    const isHighProtein = msg.includes('high protein') || msg.includes('protein');
    const isLowCalorie = msg.includes('low calorie') || msg.includes('low cal');
    const isQuick = msg.includes('quick') || msg.includes('easy');

    return {
      intent: 'FIND_RECIPE',
      confidence: 0.9,
      parameters: {
        filter: isHighProtein ? 'high-protein' : isLowCalorie ? 'low-calorie' : isQuick ? 'quick' : null
      }
    };
  }

  // CREATE_RECIPE - "create a new recipe" / "add a recipe" / "make a recipe"
  if ((msg.includes('create') || msg.includes('add') || msg.includes('make') ||
       msg.includes('save')) && msg.includes('recipe')) {
    return {
      intent: 'CREATE_RECIPE',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SUGGEST_RECIPE - "what should I cook" / "recipe idea" / "meal prep suggestion"
  if ((msg.includes('what') && msg.includes('cook')) ||
      (msg.includes('recipe') && msg.includes('idea')) ||
      msg.includes('meal prep') || msg.includes('suggest')) {
    return {
      intent: 'SUGGEST_RECIPE',
      confidence: 0.9,
      parameters: {}
    };
  }

  // SHOW_SAVED_RECIPES - "show my recipes" / "what recipes do I have" / "my saved recipes"
  if ((msg.includes('my') && msg.includes('recipe')) ||
      (msg.includes('saved') && msg.includes('recipe')) ||
      msg.includes('what recipes')) {
    return {
      intent: 'SHOW_SAVED_RECIPES',
      confidence: 0.9,
      parameters: {}
    };
  }

  return null;
}
