/**
 * SmartInputRanking
 *
 * Advanced ranking algorithm for smart suggestions
 * Combines multiple signals to rank suggestions optimally
 */

import SmartInputLearning from './SmartInputLearning';

// ============================================================
// FUZZY MATCHING UTILITIES
// ============================================================

/**
 * Calculate Levenshtein distance (edit distance) between two strings
 * Used for typo tolerance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Check if two strings are similar enough (fuzzy match)
 */
function isFuzzyMatch(input, target, maxDistance = 2) {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (targetLower.includes(inputLower)) {
    return true;
  }

  // For very short inputs, require exact match
  if (input.length < 3) {
    return targetLower.startsWith(inputLower);
  }

  // Calculate edit distance
  const distance = levenshteinDistance(inputLower, targetLower);

  // Allow more edits for longer words
  const allowedDistance = Math.min(maxDistance, Math.floor(input.length / 3));

  return distance <= allowedDistance;
}

/**
 * Get fuzzy match score (0-100, higher is better)
 */
function getFuzzyMatchScore(input, target) {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();

  // Perfect prefix match = 100
  if (targetLower.startsWith(inputLower)) {
    return 100;
  }

  // Contains = 80
  if (targetLower.includes(inputLower)) {
    return 80;
  }

  // Check word-by-word for multi-word terms
  if (target.includes(' ')) {
    const words = target.split(' ');
    for (const word of words) {
      if (word.toLowerCase().startsWith(inputLower)) {
        return 90; // Word prefix match
      }
    }
  }

  // Fuzzy match based on edit distance
  const distance = levenshteinDistance(inputLower, targetLower.substring(0, inputLower.length + 2));
  if (distance === 0) return 100;
  if (distance === 1) return 70;
  if (distance === 2) return 50;

  return 0;
}

// ============================================================
// RANKING SYSTEM
// ============================================================

class SmartInputRanking {
  /**
   * Rank suggestions using multiple signals
   * Returns array of {term, score, signals} sorted by score
   */
  static async rankSuggestions(suggestions, input, context, screenName) {
    const ranked = [];

    for (const suggestion of suggestions) {
      const signals = await this.calculateSignals(suggestion, input, context, screenName);
      const score = this.calculateFinalScore(signals);

      ranked.push({
        term: suggestion,
        score,
        signals,
      });
    }

    // Sort by score (highest first)
    ranked.sort((a, b) => b.score - a.score);

    return ranked;
  }

  /**
   * Calculate all ranking signals for a suggestion
   */
  static async calculateSignals(term, input, context, screenName) {
    const signals = {
      // Match quality (0-100)
      matchScore: getFuzzyMatchScore(input, term),

      // Usage frequency (0-100)
      frequencyScore: 0,

      // Recency (0-100)
      recencyScore: 0,

      // Context relevance (0-100)
      contextScore: 50, // Default neutral

      // Length penalty (shorter is better for typing efficiency)
      lengthScore: this.getLengthScore(term),
    };

    // Get usage stats
    try {
      const usageHistory = await SmartInputLearning.getUsageStats();
      const termStats = usageHistory.mostUsed.find(t => t.term === term);

      if (termStats) {
        // Normalize frequency to 0-100
        const maxCount = usageHistory.mostUsed[0]?.count || 1;
        signals.frequencyScore = (termStats.count / maxCount) * 100;
      }

      // Check recency
      const recentTerms = await SmartInputLearning.getRecentTerms(20);
      const recentIndex = recentTerms.indexOf(term);
      if (recentIndex !== -1) {
        // More recent = higher score
        signals.recencyScore = 100 - (recentIndex * 5);
      }
    } catch (error) {
      // Fail silently if AsyncStorage not available
    }

    return signals;
  }

  /**
   * Calculate final score from all signals
   */
  static calculateFinalScore(signals) {
    // Weighted combination of signals
    const weights = {
      matchScore: 0.40,      // 40% - Most important: does it match what they typed?
      frequencyScore: 0.25,  // 25% - How often do they use it?
      recencyScore: 0.20,    // 20% - Did they use it recently?
      contextScore: 0.10,    // 10% - Is it relevant to current screen?
      lengthScore: 0.05,     // 5% - Prefer shorter terms
    };

    return (
      signals.matchScore * weights.matchScore +
      signals.frequencyScore * weights.frequencyScore +
      signals.recencyScore * weights.recencyScore +
      signals.contextScore * weights.contextScore +
      signals.lengthScore * weights.lengthScore
    );
  }

  /**
   * Length score (shorter = better for quick typing)
   */
  static getLengthScore(term) {
    const length = term.length;

    if (length <= 10) return 100;
    if (length <= 15) return 80;
    if (length <= 20) return 60;
    if (length <= 25) return 40;
    return 20;
  }

  /**
   * Group suggestions by category
   */
  static categorizeSuggestions(rankedSuggestions, vocabularyMap) {
    const categories = {
      recent: [],
      frequent: [],
      exercises: [],
      ingredients: [],
      other: [],
    };

    for (const item of rankedSuggestions) {
      // Check if it's a recent/frequent term (high recency/frequency score)
      if (item.signals.recencyScore > 70) {
        categories.recent.push(item);
      } else if (item.signals.frequencyScore > 70) {
        categories.frequent.push(item);
      } else {
        // Categorize by vocabulary type
        const term = item.term.toLowerCase();

        // Check if it's an exercise
        if (this.isExercise(term, vocabularyMap)) {
          categories.exercises.push(item);
        }
        // Check if it's an ingredient
        else if (this.isIngredient(term, vocabularyMap)) {
          categories.ingredients.push(item);
        }
        // Other
        else {
          categories.other.push(item);
        }
      }
    }

    return categories;
  }

  /**
   * Check if term is an exercise
   */
  static isExercise(term, vocabularyMap) {
    if (!vocabularyMap || !vocabularyMap.exercises) return false;
    return vocabularyMap.exercises.suggestions.some(
      ex => ex.toLowerCase() === term
    );
  }

  /**
   * Check if term is an ingredient
   */
  static isIngredient(term, vocabularyMap) {
    if (!vocabularyMap || !vocabularyMap.ingredients) return false;
    return vocabularyMap.ingredients.suggestions.some(
      ing => ing.toLowerCase() === term
    );
  }

  /**
   * Find fuzzy matches in vocabulary
   */
  static findFuzzyMatches(input, vocabulary, maxResults = 5) {
    const matches = [];

    for (const term of vocabulary) {
      if (isFuzzyMatch(input, term)) {
        const score = getFuzzyMatchScore(input, term);
        matches.push({ term, score });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, maxResults).map(m => m.term);
  }
}

export default SmartInputRanking;
export { isFuzzyMatch, getFuzzyMatchScore, levenshteinDistance };
