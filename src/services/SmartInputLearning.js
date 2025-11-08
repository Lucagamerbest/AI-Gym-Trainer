/**
 * SmartInputLearning
 *
 * Tracks user's typing patterns to personalize suggestions
 * - Frequently used terms
 * - Recent terms
 * - Custom vocabulary
 * - Usage analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USAGE_HISTORY: '@smart_input_usage_history',
  CUSTOM_VOCABULARY: '@smart_input_custom_vocab',
  RECENT_TERMS: '@smart_input_recent_terms',
};

// ============================================================
// SYNONYMS & ABBREVIATIONS DATABASE
// ============================================================

const SYNONYMS_MAP = {
  // Exercise abbreviations
  'bp': 'bench press',
  'squat': 'back squat',
  'dl': 'deadlift',
  'ohp': 'overhead press',
  'rdl': 'romanian deadlift',
  'db': 'dumbbell',
  'bb': 'barbell',
  'pullup': 'pull ups',
  'chinup': 'chin ups',
  'lat': 'lat pulldown',
  'incline': 'incline bench press',
  'decline': 'decline bench press',

  // Food abbreviations
  'chix': 'chicken',
  'chick': 'chicken breast',
  'salm': 'salmon',
  'sw pot': 'sweet potato',
  'sw potato': 'sweet potato',
  'greek': 'greek yogurt',
  'prot powder': 'protein powder',
  'prot': 'protein',
  'carb': 'carbs',
  'cal': 'calories',

  // Workout types
  'ppl': 'push pull legs',
  'fb': 'full body',
  'ul': 'upper lower',

  // Common request abbreviations (NEW!)
  'rep': 'replace with',
  'swp': 'swap with',
  'chng': 'change to',
  'rem': 'remove the',
  'w/o': 'without the',
  'w/': 'with',
  'b4': 'for breakfast',
  'bf': 'for breakfast',
  'lnch': 'for lunch',
  'din': 'for dinner',
  'snk': 'for snack',
  'veg': 'vegetarian',
  'vgn': 'vegan',
  'gf': 'gluten free',
  'df': 'dairy free',
  'np': 'no protein',
  'lc': 'low carb',
  'hp': 'high protein',
  'noequip': 'no equipment',
  'home': 'at home',
  'gym': 'at the gym',

  // Common typos
  'benchpress': 'bench press',
  'deadlifts': 'deadlift',
  'pullups': 'pull ups',
  'chinups': 'chin ups',
  'repalce': 'replace',
  'repace': 'replace',
  'recpie': 'recipe',
  'recip': 'recipe',
};

// ============================================================
// USAGE TRACKING
// ============================================================

class SmartInputLearning {
  /**
   * Track when a suggestion is used
   */
  static async trackSuggestionUsage(term, context, screenName) {
    try {
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_HISTORY);
      const history = historyStr ? JSON.parse(historyStr) : {};

      // Initialize term if not exists
      if (!history[term]) {
        history[term] = {
          count: 0,
          contexts: {},
          screens: {},
          firstUsed: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        };
      }

      // Update usage stats
      history[term].count += 1;
      history[term].lastUsed = new Date().toISOString();

      // Track context usage
      if (context) {
        history[term].contexts[context] = (history[term].contexts[context] || 0) + 1;
      }

      // Track screen usage
      if (screenName) {
        history[term].screens[screenName] = (history[term].screens[screenName] || 0) + 1;
      }

      // Save updated history
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_HISTORY, JSON.stringify(history));

      // Also update recent terms
      await this.addRecentTerm(term);
    } catch (error) {
      console.error('Error tracking suggestion usage:', error);
    }
  }

  /**
   * Add term to recent terms list
   */
  static async addRecentTerm(term) {
    try {
      const recentStr = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_TERMS);
      const recent = recentStr ? JSON.parse(recentStr) : [];

      // Remove if already exists (to move to front)
      const filtered = recent.filter(t => t !== term);

      // Add to front
      const updated = [term, ...filtered].slice(0, 20); // Keep last 20

      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_TERMS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding recent term:', error);
    }
  }

  /**
   * Get frequently used terms (top N)
   */
  static async getFrequentTerms(limit = 10, context = null) {
    try {
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_HISTORY);
      if (!historyStr) return [];

      const history = JSON.parse(historyStr);

      // Convert to array and sort by usage count
      let terms = Object.entries(history).map(([term, stats]) => ({
        term,
        count: stats.count,
        contexts: stats.contexts,
        lastUsed: stats.lastUsed,
      }));

      // Filter by context if specified
      if (context) {
        terms = terms.filter(t => t.contexts[context] > 0);
        // Sort by context-specific usage
        terms.sort((a, b) => (b.contexts[context] || 0) - (a.contexts[context] || 0));
      } else {
        // Sort by total usage
        terms.sort((a, b) => b.count - a.count);
      }

      return terms.slice(0, limit).map(t => t.term);
    } catch (error) {
      console.error('Error getting frequent terms:', error);
      return [];
    }
  }

  /**
   * Get recent terms
   */
  static async getRecentTerms(limit = 5) {
    try {
      const recentStr = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_TERMS);
      if (!recentStr) return [];

      const recent = JSON.parse(recentStr);
      return recent.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent terms:', error);
      return [];
    }
  }

  /**
   * Expand abbreviations and synonyms
   */
  static expandSynonyms(inputText) {
    const lastWord = this.getLastWord(inputText).toLowerCase();

    // Check if last word is a known abbreviation/synonym
    if (SYNONYMS_MAP[lastWord]) {
      return SYNONYMS_MAP[lastWord];
    }

    return null;
  }

  /**
   * Get all possible expansions for a partial word
   */
  static getSynonymSuggestions(partialWord) {
    const partial = partialWord.toLowerCase();
    const suggestions = [];

    // Find synonyms that start with the partial word
    Object.entries(SYNONYMS_MAP).forEach(([abbr, full]) => {
      if (abbr.startsWith(partial)) {
        suggestions.push({ abbr, full });
      }
    });

    return suggestions;
  }

  /**
   * Add custom vocabulary term
   */
  static async addCustomTerm(term, category = 'custom') {
    try {
      const vocabStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_VOCABULARY);
      const vocab = vocabStr ? JSON.parse(vocabStr) : {};

      if (!vocab[category]) {
        vocab[category] = [];
      }

      // Add if not already exists
      if (!vocab[category].includes(term)) {
        vocab[category].push(term);
        await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_VOCABULARY, JSON.stringify(vocab));
      }
    } catch (error) {
      console.error('Error adding custom term:', error);
    }
  }

  /**
   * Get custom vocabulary
   */
  static async getCustomVocabulary(category = null) {
    try {
      const vocabStr = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_VOCABULARY);
      if (!vocabStr) return [];

      const vocab = JSON.parse(vocabStr);

      if (category) {
        return vocab[category] || [];
      }

      // Return all custom terms
      return Object.values(vocab).flat();
    } catch (error) {
      console.error('Error getting custom vocabulary:', error);
      return [];
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats() {
    try {
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_HISTORY);
      if (!historyStr) {
        return {
          totalTerms: 0,
          totalUsages: 0,
          mostUsed: [],
          recentlyUsed: [],
        };
      }

      const history = JSON.parse(historyStr);

      const terms = Object.entries(history).map(([term, stats]) => ({
        term,
        count: stats.count,
        lastUsed: stats.lastUsed,
      }));

      const totalUsages = terms.reduce((sum, t) => sum + t.count, 0);

      // Sort by usage
      const mostUsed = [...terms]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(t => ({ term: t.term, count: t.count }));

      // Sort by recency
      const recentlyUsed = [...terms]
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, 10)
        .map(t => ({ term: t.term, lastUsed: t.lastUsed }));

      return {
        totalTerms: terms.length,
        totalUsages,
        mostUsed,
        recentlyUsed,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        totalTerms: 0,
        totalUsages: 0,
        mostUsed: [],
        recentlyUsed: [],
      };
    }
  }

  /**
   * Clear all learning data
   */
  static async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USAGE_HISTORY,
        STORAGE_KEYS.CUSTOM_VOCABULARY,
        STORAGE_KEYS.RECENT_TERMS,
      ]);
    } catch (error) {
      console.error('Error clearing learning data:', error);
    }
  }

  /**
   * Helper: Get last word from input
   */
  static getLastWord(text) {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words[words.length - 1] || '';
  }
}

export default SmartInputLearning;
export { SYNONYMS_MAP };
