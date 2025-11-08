/**
 * SmartInputService
 *
 * Provides context-aware text suggestions for AI input fields
 * Detects user intent and suggests relevant fitness/nutrition terms
 *
 * Phase 3: Now includes learning and personalization!
 */

import SmartInputLearning, { SYNONYMS_MAP } from './SmartInputLearning';

// ============================================================
// VOCABULARY DATABASE
// ============================================================

const VOCABULARY = {
  // Exercise names organized by muscle group
  exercises: {
    patterns: ['do', 'add', 'include', 'remove', 'replace', 'swap', 'workout', 'exercise'],
    suggestions: [
      // Chest exercises
      'bench press',
      'incline bench press',
      'decline bench press',
      'smith machine bench',
      'smith machine incline bench',
      'dumbbell press',
      'dumbbell incline press',
      'dumbbell decline press',
      'cable flies',
      'dumbbell flies',
      'pec deck',
      'push ups',
      'dips',
      'chest dips',

      // Back exercises
      'pull ups',
      'chin ups',
      'lat pulldown',
      'barbell row',
      'dumbbell row',
      'deadlift',
      'cable row',
      'seated cable row',
      't-bar row',
      'face pulls',
      'reverse flies',
      'shrugs',
      'back extensions',

      // Shoulder exercises
      'overhead press',
      'military press',
      'dumbbell shoulder press',
      'arnold press',
      'lateral raises',
      'front raises',
      'rear delt flies',
      'upright rows',

      // Leg exercises
      'squat',
      'back squat',
      'front squat',
      'leg press',
      'leg extension',
      'leg curl',
      'hamstring curl',
      'lunges',
      'walking lunges',
      'bulgarian split squat',
      'calf raises',
      'standing calf raises',
      'seated calf raises',
      'hack squat',
      'romanian deadlift',

      // Arm exercises
      'bicep curl',
      'barbell curl',
      'dumbbell curl',
      'hammer curl',
      'preacher curl',
      'concentration curl',
      'tricep extension',
      'overhead tricep extension',
      'skull crushers',
      'close grip bench',
      'tricep dips',
      'cable curls',
      'cable tricep pushdown',

      // Core exercises
      'crunches',
      'sit ups',
      'planks',
      'side planks',
      'russian twists',
      'leg raises',
      'hanging leg raises',
      'ab wheel',
      'cable crunches',
    ]
  },

  // Food ingredients organized by macro type
  ingredients: {
    patterns: ['recipe', 'meal', 'using', 'with', 'ingredient', 'food', 'make', 'cook'],
    suggestions: [
      // Proteins - Poultry
      'chicken breast',
      'chicken thighs',
      'chicken wings',
      'chicken drumsticks',
      'ground chicken',
      'turkey breast',
      'ground turkey',

      // Proteins - Meat
      'ground beef',
      'lean ground beef',
      'steak',
      'sirloin steak',
      'ribeye steak',
      'pork chops',
      'pork tenderloin',
      'ground pork',
      'bacon',
      'ham',
      'sausage',

      // Proteins - Seafood
      'salmon',
      'tuna',
      'tilapia',
      'cod',
      'shrimp',
      'crab',
      'lobster',
      'white fish',

      // Proteins - Dairy & Eggs
      'eggs',
      'egg whites',
      'greek yogurt',
      'cottage cheese',
      'milk',
      'cheese',
      'cheddar cheese',
      'mozzarella cheese',
      'parmesan cheese',
      'feta cheese',

      // Proteins - Plant-based
      'protein powder',
      'whey protein',
      'tofu',
      'tempeh',
      'beans',
      'black beans',
      'kidney beans',
      'chickpeas',
      'lentils',
      'edamame',

      // Carbs - Grains
      'white rice',
      'brown rice',
      'jasmine rice',
      'basmati rice',
      'quinoa',
      'pasta',
      'whole wheat pasta',
      'oats',
      'rolled oats',
      'bread',
      'whole wheat bread',
      'pita bread',
      'tortilla',
      'couscous',

      // Carbs - Starchy vegetables
      'sweet potato',
      'potatoes',
      'russet potatoes',
      'red potatoes',
      'corn',
      'peas',

      // Vegetables - Green
      'broccoli',
      'spinach',
      'kale',
      'asparagus',
      'green beans',
      'brussels sprouts',
      'lettuce',
      'arugula',
      'celery',
      'cucumber',
      'zucchini',

      // Vegetables - Other
      'carrots',
      'bell peppers',
      'red bell peppers',
      'green bell peppers',
      'mushrooms',
      'onions',
      'garlic',
      'tomatoes',
      'cherry tomatoes',
      'cauliflower',
      'eggplant',

      // Fats
      'olive oil',
      'coconut oil',
      'avocado',
      'avocado oil',
      'nuts',
      'almonds',
      'walnuts',
      'cashews',
      'peanuts',
      'peanut butter',
      'almond butter',
      'butter',
      'ghee',

      // Fruits
      'banana',
      'apple',
      'berries',
      'blueberries',
      'strawberries',
      'raspberries',
      'orange',
      'grapes',
      'pineapple',
      'mango',
      'watermelon',
    ]
  },

  // Workout types and splits
  workoutTypes: {
    patterns: ['create', 'plan', 'workout', 'day', 'split', 'program'],
    suggestions: [
      'push day',
      'pull day',
      'leg day',
      'upper body',
      'lower body',
      'full body',
      'chest day',
      'back day',
      'shoulder day',
      'arm day',
      'chest and triceps',
      'back and biceps',
      'shoulders and abs',
      'push pull legs',
      'upper lower split',
      'bro split',
      'strength training',
      'hypertrophy',
      'cardio',
      'HIIT',
    ]
  },

  // Macro-focused terms
  macros: {
    patterns: ['high', 'low', 'macro', 'protein', 'carb', 'fat', 'calorie'],
    suggestions: [
      'high protein',
      'low calorie',
      'low carb',
      'low fat',
      'balanced',
      'keto',
      'high carb',
      'moderate protein',
      'lean',
      'clean eating',
    ]
  },

  // Action verbs for different contexts
  actions: {
    workout: [
      'create',
      'generate',
      'plan',
      'add',
      'include',
      'remove',
      'delete',
      'replace',
      'swap',
      'modify',
      'change',
      'update',
    ],
    recipe: [
      'create',
      'make',
      'cook',
      'prepare',
      'suggest',
      'generate',
      'find',
    ],
    general: [
      'show',
      'analyze',
      'track',
      'log',
      'calculate',
      'estimate',
      'recommend',
    ]
  },

  // Equipment types
  equipment: {
    patterns: ['using', 'with', 'equipment', 'gym'],
    suggestions: [
      'barbell',
      'dumbbell',
      'kettlebell',
      'cable machine',
      'smith machine',
      'resistance bands',
      'bodyweight',
      'no equipment',
      'home gym',
    ]
  },
};

// ============================================================
// CONTEXT DETECTION ENGINE
// ============================================================

/**
 * Detect what the user is trying to do based on screen and input text
 */
function detectContext(screenName, inputText, screenParams = {}) {
  const text = inputText.toLowerCase().trim();

  if (!text || text.length < 2) {
    return 'general';
  }

  // Workout-related contexts
  if (screenName.includes('Workout') || screenName === 'StartWorkoutScreen' || screenName === 'WorkoutAssistant') {
    // Creating a workout plan
    if (text.match(/\b(create|make|plan|generate|give me)\b.*\b(workout|day|split|routine)\b/i)) {
      return 'workout_creation';
    }

    // Adding exercises
    if (text.match(/\b(add|include|put in)\b.*\b(exercise|exercises)\b/i)) {
      return 'exercise_addition';
    }

    // Removing/replacing exercises
    if (text.match(/\b(remove|delete|replace|swap|change)\b.*\b(exercise|exercises|with|for)\b/i)) {
      return 'exercise_modification';
    }

    // General workout context
    return 'workout_general';
  }

  // Recipe/Nutrition contexts
  if (screenName.includes('Recipe') || screenName === 'NutritionScreen' || screenName === 'MealsHistoryScreen') {
    // Recipe with specific ingredients
    if (text.match(/\b(create|make|recipe|meal|cook)\b.*\b(using|with|from)\b/i)) {
      return 'recipe_with_ingredients';
    }

    // Macro-focused recipes
    if (text.match(/\b(high protein|low calorie|low carb|low fat|keto|balanced)\b/i)) {
      return 'macro_focused_recipe';
    }

    // General recipe context
    return 'recipe_general';
  }

  // Progress tracking
  if (screenName.includes('Progress')) {
    return 'progress_tracking';
  }

  // Default to general
  return 'general';
}

/**
 * Get the word currently being typed (last partial word)
 */
function getLastPartialWord(text) {
  if (!text || typeof text !== 'string') return '';

  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1] || '';

  return lastWord;
}

/**
 * Get relevant vocabularies based on detected context
 */
function getRelevantVocabularies(context) {
  switch (context) {
    case 'workout_creation':
      return [
        ...VOCABULARY.workoutTypes.suggestions,
        ...VOCABULARY.exercises.suggestions,
        ...VOCABULARY.equipment.suggestions,
      ];

    case 'exercise_addition':
    case 'exercise_modification':
    case 'workout_general':
      return [
        ...VOCABULARY.exercises.suggestions,
        ...VOCABULARY.equipment.suggestions,
      ];

    case 'recipe_with_ingredients':
      return VOCABULARY.ingredients.suggestions;

    case 'macro_focused_recipe':
      return [
        ...VOCABULARY.macros.suggestions,
        ...VOCABULARY.ingredients.suggestions,
      ];

    case 'recipe_general':
      return [
        ...VOCABULARY.ingredients.suggestions,
        ...VOCABULARY.macros.suggestions,
      ];

    default:
      // General context - return most common terms from all categories
      return [
        ...VOCABULARY.exercises.suggestions.slice(0, 15),
        ...VOCABULARY.ingredients.suggestions.slice(0, 15),
        ...VOCABULARY.workoutTypes.suggestions.slice(0, 5),
      ];
  }
}

// ============================================================
// SMART INPUT SERVICE - PUBLIC API
// ============================================================

class SmartInputService {
  /**
   * Get smart suggestions based on current input and context
   * Phase 3: Now includes learning, synonyms, and personalization!
   *
   * @param {string} inputText - Current text input value
   * @param {string} screenName - Name of the screen (for context)
   * @param {object} screenParams - Screen parameters (optional)
   * @returns {Promise<Array<string>>} - Array of suggestion strings
   */
  static async getSuggestions(inputText, screenName, screenParams = {}) {
    // Return empty if input is too short
    if (!inputText || inputText.length < 2) {
      return [];
    }

    // Detect context from screen and input
    const context = detectContext(screenName, inputText, screenParams);

    // Get the word being typed
    const lastWord = getLastPartialWord(inputText);

    // Need at least 2 characters to suggest
    if (lastWord.length < 2) {
      return [];
    }

    const lastWordLower = lastWord.toLowerCase();
    const suggestions = [];

    // PHASE 3 ENHANCEMENT 1: Check for synonym/abbreviation expansion
    const synonym = SmartInputLearning.expandSynonyms(inputText);
    if (synonym && !suggestions.includes(synonym)) {
      suggestions.push(synonym);
    }

    // PHASE 3 ENHANCEMENT 2: Add recent terms (personalized)
    try {
      const recentTerms = await SmartInputLearning.getRecentTerms(3);
      recentTerms.forEach(term => {
        if (term.toLowerCase().includes(lastWordLower) && !suggestions.includes(term)) {
          suggestions.push(term);
        }
      });
    } catch (error) {
      // Silently fail if AsyncStorage not available
    }

    // PHASE 3 ENHANCEMENT 3: Add frequently used terms (personalized)
    try {
      const frequentTerms = await SmartInputLearning.getFrequentTerms(3, context);
      frequentTerms.forEach(term => {
        if (term.toLowerCase().includes(lastWordLower) && !suggestions.includes(term)) {
          suggestions.push(term);
        }
      });
    } catch (error) {
      // Silently fail if AsyncStorage not available
    }

    // Get relevant vocabulary based on context
    const vocabularies = getRelevantVocabularies(context);

    // Find matching suggestions from vocabulary
    vocabularies.forEach(item => {
      const itemLower = item.toLowerCase();

      // Check if item starts with the partial word
      if (itemLower.startsWith(lastWordLower)) {
        if (!suggestions.includes(item)) {
          suggestions.push(item);
        }
      }
      // Also check if any word in a multi-word item starts with the partial word
      else if (item.includes(' ')) {
        const words = item.split(' ');
        if (words.some(word => word.toLowerCase().startsWith(lastWordLower))) {
          if (!suggestions.includes(item)) {
            suggestions.push(item);
          }
        }
      }
    });

    // PHASE 3 ENHANCEMENT 4: Add custom vocabulary
    try {
      const customTerms = await SmartInputLearning.getCustomVocabulary();
      customTerms.forEach(term => {
        if (term.toLowerCase().includes(lastWordLower) && !suggestions.includes(term)) {
          suggestions.push(term);
        }
      });
    } catch (error) {
      // Silently fail if AsyncStorage not available
    }

    // Remove duplicates
    const uniqueSuggestions = [...new Set(suggestions)];

    // PHASE 3 ENHANCEMENT 5: Smart sorting with learning
    const sorted = uniqueSuggestions.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lastWordLower);
      const bStarts = b.toLowerCase().startsWith(lastWordLower);

      // Prioritize exact prefix matches
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Then alphabetical
      return a.localeCompare(b);
    });

    // Return top 6 suggestions (increased from 5 for personalized terms)
    return sorted.slice(0, 6);
  }

  /**
   * Track when a suggestion is selected (for learning)
   */
  static async trackUsage(term, context, screenName) {
    try {
      await SmartInputLearning.trackSuggestionUsage(term, context, screenName);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get the detected context for debugging/testing
   */
  static detectContext(inputText, screenName, screenParams = {}) {
    return detectContext(screenName, inputText, screenParams);
  }

  /**
   * Get all available vocabulary for a specific domain (for debugging)
   */
  static getVocabulary(domain = null) {
    if (domain && VOCABULARY[domain]) {
      return VOCABULARY[domain].suggestions;
    }
    return VOCABULARY;
  }
}

export default SmartInputService;
