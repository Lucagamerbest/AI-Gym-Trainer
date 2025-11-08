/**
 * SmartInputService
 *
 * Provides context-aware text suggestions for AI input fields
 * Detects user intent and suggests relevant fitness/nutrition terms
 *
 * Phase 3: Learning and personalization
 * Phase 4: Advanced ranking and fuzzy matching
 * Phase 5: Sequential phrase detection
 */

import SmartInputLearning, { SYNONYMS_MAP } from './SmartInputLearning';
import SmartInputRanking from './SmartInputRanking';
import exerciseKeywords from '../../exercise_keywords_complete';

// ============================================================
// VOCABULARY DATABASE
// ============================================================

const VOCABULARY = {
  // Exercise names - ALL exercises from database with equipment variants
  // Total: 1326+ keywords including equipment combinations (cable, dumbbell, barbell, etc.)
  exercises: {
    patterns: ['do', 'add', 'include', 'remove', 'replace', 'swap', 'workout', 'exercise'],
    suggestions: exerciseKeywords
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

  // Common user request phrases (high value!)
  commonRequests: {
    patterns: ['replace', 'instead', 'swap', 'change', 'remove', 'add', 'more', 'less'],
    suggestions: [
      // Replacement phrases
      'replace with',
      'replace it with',
      'swap with',
      'swap it with',
      'change to',
      'switch to',
      'use instead',
      'instead of',
      'substitute with',

      // Addition phrases
      'add more',
      'add some',
      'include more',
      'throw in',
      'put in',
      'also add',

      // Removal phrases
      'remove the',
      'take out',
      'without the',
      'skip the',
      'no',
      'leave out',

      // Modification phrases
      'make it',
      'can you',
      'could you',
      'please',
      'I want',
      'I need',
      'help me',

      // Quantity phrases
      'more protein',
      'less calories',
      'fewer carbs',
      'extra',
      'double the',
      'half the',

      // Recipe/meal requests
      'for breakfast',
      'for lunch',
      'for dinner',
      'for snack',
      'as a snack',
      'meal prep',
      'quick meal',
      'easy recipe',

      // Workout requests
      'at home',
      'at the gym',
      'with dumbbells',
      'with barbells',
      'bodyweight only',
      'no equipment',
      'beginner friendly',
      'advanced',

      // Time-based
      'under 30 minutes',
      'quick workout',
      'short workout',
      '5 minute',
      '10 minute',
      '15 minute',
      '30 minute',
      '45 minute',
      '1 hour',

      // Preferences
      'easier',
      'harder',
      'simpler',
      'more challenging',
      'something different',
      'another option',
      'different exercise',
      'different food',
      'vegetarian',
      'vegan',
      'gluten free',
      'dairy free',
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
      'substitute',
      'switch',
    ],
    recipe: [
      'create',
      'make',
      'cook',
      'prepare',
      'suggest',
      'generate',
      'find',
      'substitute',
      'replace',
    ],
    general: [
      'show',
      'analyze',
      'track',
      'log',
      'calculate',
      'estimate',
      'recommend',
      'help',
      'explain',
      'tell me',
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
// SMART REPLACE PATTERN DETECTION
// ============================================================

/**
 * Detect if user is trying to replace an exercise from current workout
 * Example: "replace" → show [leg press] [leg extension] [leg curl] [standing calf raise]
 *
 * @param {string} inputText - Current input text
 * @param {object} screenParams - Screen parameters containing workout context
 * @returns {object|null} - { suggestions: [...] } or null
 */
function detectReplacePattern(inputText, screenParams = {}) {
  const text = inputText.toLowerCase().trim();
  const words = text.split(/\s+/);

  // Check if text starts with "replace" or "swap" or "change"
  const replaceKeywords = ['replace', 'swap', 'change'];
  const hasReplaceKeyword = replaceKeywords.some(keyword =>
    words[0] === keyword || text.startsWith(keyword)
  );

  if (!hasReplaceKeyword) {
    return null;
  }

  // If user just typed "replace" (1 word), show current workout exercises
  if (words.length === 1) {
    // Extract exercises from screenParams (passed from AIButtonModal)
    const currentExercises = screenParams.currentWorkoutExercises || [];

    if (currentExercises.length > 0) {
      return {
        suggestions: currentExercises
      };
    }
  }

  // If user has selected an exercise and continues typing
  // Example: "replace leg press w" → don't show workout exercises anymore
  // Let normal suggestions handle it
  return null;
}

// ============================================================
// SEQUENTIAL PHRASE DETECTION
// ============================================================

/**
 * Sequential phrase patterns - for suggesting next word in a phrase
 * Example: "replace bench press" → suggest "with"
 */
const SEQUENTIAL_PHRASES = {
  // Replacement patterns
  'replace': { nextWord: 'with', needsMiddle: true },
  'swap': { nextWord: 'with', needsMiddle: true },
  'change': { nextWord: 'to', needsMiddle: true },
  'switch': { nextWord: 'to', needsMiddle: true },
  'substitute': { nextWord: 'with', needsMiddle: true },

  // Addition patterns
  'add': { nextWord: 'to', needsMiddle: false },

  // Other patterns
  'instead': { nextWord: 'of', needsMiddle: false },
};

/**
 * Detect if user is in the middle of a sequential phrase
 * Returns the next word to suggest, or null
 */
function detectSequentialPhrase(inputText) {
  if (!inputText || inputText.length < 5) {
    return null;
  }

  const text = inputText.toLowerCase().trim();
  const words = text.split(/\s+/);

  // Need at least 2 words to have a sequential phrase
  if (words.length < 2) {
    return null;
  }

  // Check each sequential phrase pattern
  for (const [triggerWord, config] of Object.entries(SEQUENTIAL_PHRASES)) {
    // Find if trigger word exists in the text
    const triggerIndex = words.indexOf(triggerWord);

    if (triggerIndex !== -1) {
      // Check if the connecting word (with/to/of) is already present after trigger
      const remainingWords = words.slice(triggerIndex + 1);
      const hasConnector = remainingWords.includes(config.nextWord);

      if (!hasConnector) {
        // If needsMiddle is true, make sure there's at least one word after trigger
        // Example: "replace bench press" (has middle word) → suggest "with"
        // If needsMiddle is false, suggest immediately
        // Example: "add" → suggest "to" or "add protein" → suggest "to"

        if (config.needsMiddle) {
          // Need at least one word between trigger and current position
          if (remainingWords.length >= 1) {
            // Don't suggest if user is still typing the trigger word itself
            const lastWord = words[words.length - 1];
            if (lastWord !== triggerWord) {
              return config.nextWord;
            }
          }
        } else {
          // Suggest immediately if there's any word after trigger
          if (remainingWords.length >= 1) {
            return config.nextWord;
          }
        }
      }
    }
  }

  return null;
}

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
        ...VOCABULARY.commonRequests.suggestions,
        ...VOCABULARY.workoutTypes.suggestions,
        ...VOCABULARY.exercises.suggestions,
        ...VOCABULARY.equipment.suggestions,
      ];

    case 'exercise_addition':
    case 'exercise_modification':
    case 'workout_general':
      return [
        ...VOCABULARY.commonRequests.suggestions,
        ...VOCABULARY.exercises.suggestions,
        ...VOCABULARY.equipment.suggestions,
      ];

    case 'recipe_with_ingredients':
      return [
        ...VOCABULARY.commonRequests.suggestions,
        ...VOCABULARY.ingredients.suggestions,
      ];

    case 'macro_focused_recipe':
      return [
        ...VOCABULARY.commonRequests.suggestions,
        ...VOCABULARY.macros.suggestions,
        ...VOCABULARY.ingredients.suggestions,
      ];

    case 'recipe_general':
      return [
        ...VOCABULARY.commonRequests.suggestions,
        ...VOCABULARY.ingredients.suggestions,
        ...VOCABULARY.macros.suggestions,
      ];

    default:
      // General context - return most common terms from all categories
      return [
        ...VOCABULARY.commonRequests.suggestions.slice(0, 20),
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

    // PHASE 6: Smart Replace Detection
    // If user types "replace" and has workout context, show current exercises
    const replacePattern = detectReplacePattern(inputText, screenParams);
    if (replacePattern) {
      return replacePattern.suggestions; // Return early with workout exercises
    }

    // PHASE 5: Sequential phrase detection
    // Check if we should suggest a connecting word (with/to/of)
    const sequentialNextWord = detectSequentialPhrase(inputText);
    if (sequentialNextWord) {
      // Prioritize the sequential next word if user is typing it
      if (sequentialNextWord.startsWith(lastWordLower)) {
        suggestions.push(sequentialNextWord);
      }
      // Also add it even if not typing it yet (for quick selection)
      else if (!suggestions.includes(sequentialNextWord)) {
        suggestions.push(sequentialNextWord);
      }
    }

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

      // PHASE 5: Skip multi-word phrases that contain the sequential next word
      // Example: If we're suggesting "with", skip "replace with", "swap with", etc.
      if (sequentialNextWord && item.includes(' ') && itemLower.includes(sequentialNextWord)) {
        // Check if this is a phrase like "replace with" or "swap with"
        const itemWords = itemLower.split(' ');
        if (itemWords.includes(sequentialNextWord)) {
          // Skip this item - we want to suggest the connector word alone
          return;
        }
      }

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

    // PHASE 4: Advanced ranking with multiple signals
    try {
      const ranked = await SmartInputRanking.rankSuggestions(
        uniqueSuggestions,
        lastWord,
        context,
        screenName
      );

      // PHASE 5: Boost sequential next word to the top
      if (sequentialNextWord) {
        const sequentialIndex = ranked.findIndex(item => item.term === sequentialNextWord);
        if (sequentialIndex > 0) {
          // Move sequential word to first position
          const sequentialItem = ranked.splice(sequentialIndex, 1)[0];
          ranked.unshift(sequentialItem);
        }
      }

      // Return top 6 ranked suggestions
      return ranked.slice(0, 6).map(item => item.term);
    } catch (error) {
      // Fallback to simple sorting if ranking fails
      const sorted = uniqueSuggestions.sort((a, b) => {
        // PHASE 5: Prioritize sequential next word
        if (sequentialNextWord) {
          if (a === sequentialNextWord) return -1;
          if (b === sequentialNextWord) return 1;
        }

        const aStarts = a.toLowerCase().startsWith(lastWordLower);
        const bStarts = b.toLowerCase().startsWith(lastWordLower);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.localeCompare(b);
      });

      return sorted.slice(0, 6);
    }
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
