/**
 * Curated Food Database Service
 *
 * Provides fast, offline-first food search using a curated database of
 * high-quality, verified foods. This is the primary search tier.
 *
 * Features:
 * - Instant search (<50ms) using local data
 * - Fuzzy matching for typos
 * - Works offline (bundled + cached data)
 * - Firebase sync for updates
 * - Pre-filtered, high-quality data only
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import curatedFoodsData from '../data/curatedFoods.json';

// Storage keys
const CACHE_KEY = '@curated_foods_cache';
const VERSION_KEY = '@curated_foods_version';
const LAST_CHECK_KEY = '@curated_foods_last_check';

// Firebase Storage path
const FIREBASE_DB_PATH = 'food_database/curatedFoods.json';
const FIREBASE_VERSION_PATH = 'food_database/version.json';

// Check for updates every 24 hours
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

class CuratedFoodDatabase {
  constructor() {
    this.foods = [];
    this.foodsByCategory = {};
    this.isLoaded = false;
    this.version = 0;
    this.isUpdating = false;
  }

  /**
   * Initialize the database
   * Loads from: 1) Cache, 2) Bundled JSON, then checks for updates
   */
  async initialize() {
    if (this.isLoaded) return;

    try {

      // Try to load from cache first (fastest)
      const cached = await this.loadFromCache();

      if (cached) {
        this.loadData(cached);
      } else {
        // Fall back to bundled JSON
        this.loadData(curatedFoodsData);
      }

      this.isLoaded = true;

      // Check for updates in background (don't await)
      this.checkForUpdatesInBackground();

    } catch (error) {
      console.error('❌ Failed to load curated foods:', error);
      // Last resort: use bundled data
      this.loadData(curatedFoodsData);
      this.isLoaded = true;
    }
  }

  /**
   * Load data into memory and build index
   */
  loadData(data) {
    this.foods = data.foods || [];
    this.version = data.version || 1;

    // Index by category for faster filtered searches
    this.foodsByCategory = {};
    this.foods.forEach(food => {
      const cat = food.category || 'Other';
      if (!this.foodsByCategory[cat]) {
        this.foodsByCategory[cat] = [];
      }
      this.foodsByCategory[cat].push(food);
    });

  }

  /**
   * Load from AsyncStorage cache
   */
  async loadFromCache() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
    }
    return null;
  }

  /**
   * Save to AsyncStorage cache
   */
  async saveToCache(data) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(VERSION_KEY, String(data.version));
    } catch (error) {
    }
  }

  /**
   * Check for updates in background
   */
  async checkForUpdatesInBackground() {
    // Don't check if already updating
    if (this.isUpdating) return;

    try {
      // Check if enough time has passed since last check
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const now = Date.now();

      if (lastCheck && (now - parseInt(lastCheck)) < UPDATE_CHECK_INTERVAL) {
        return;
      }

      // Record this check
      await AsyncStorage.setItem(LAST_CHECK_KEY, String(now));

      // Check for newer version
      const hasUpdate = await this.checkForUpdates();

      if (hasUpdate) {
        await this.downloadFromFirebase();
      }
    } catch (error) {
    }
  }

  /**
   * Check if a newer version is available on Firebase
   */
  async checkForUpdates() {
    if (!storage) {
      return false;
    }

    try {
      const versionRef = ref(storage, FIREBASE_VERSION_PATH);
      const url = await getDownloadURL(versionRef);
      const response = await fetch(url);
      const versionData = await response.json();

      const remoteVersion = versionData.version || 0;

      return remoteVersion > this.version;
    } catch (error) {
      // Version file doesn't exist yet or network error
      return false;
    }
  }

  /**
   * Download latest database from Firebase Storage
   */
  async downloadFromFirebase() {
    if (!storage || this.isUpdating) return false;

    this.isUpdating = true;

    try {
      const dbRef = ref(storage, FIREBASE_DB_PATH);
      const url = await getDownloadURL(dbRef);
      const response = await fetch(url);
      const data = await response.json();

      if (data.foods && data.foods.length > 0) {
        // Validate data
        if (data.version > this.version) {
          // Save to cache
          await this.saveToCache(data);

          // Update in memory
          this.loadData(data);

          return true;
        }
      }
    } catch (error) {
    } finally {
      this.isUpdating = false;
    }

    return false;
  }

  /**
   * Force refresh from Firebase (manual update)
   */
  async forceRefresh() {
    await AsyncStorage.removeItem(LAST_CHECK_KEY);
    return await this.downloadFromFirebase();
  }

  /**
   * Search for foods by query
   * @param {string} query - Search term
   * @param {Object} options - Search options
   * @returns {Array} - Matching foods
   */
  search(query, options = {}) {
    if (!this.isLoaded) {
      this.initialize();
    }

    const {
      category = null,
      maxResults = 20,
      minProtein = null,
      maxCalories = null,
      minCalories = null,
    } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    // Expand search terms with plurals/singulars
    const rawTerms = query.toLowerCase().trim().split(/\s+/);
    const searchTerms = [];

    for (const term of rawTerms) {
      searchTerms.push(term);

      // Add singular form if term ends in 's' or 'ies'
      if (term.endsWith('ies')) {
        searchTerms.push(term.slice(0, -3) + 'y'); // berries -> berry
      } else if (term.endsWith('es')) {
        searchTerms.push(term.slice(0, -2)); // tomatoes -> tomato
      } else if (term.endsWith('s') && term.length > 3) {
        searchTerms.push(term.slice(0, -1)); // apples -> apple
      }

      // Add plural form if term doesn't end in 's'
      if (!term.endsWith('s') && term.length > 2) {
        if (term.endsWith('y')) {
          searchTerms.push(term.slice(0, -1) + 'ies'); // berry -> berries
        } else {
          searchTerms.push(term + 's'); // apple -> apples
        }
      }
    }
    let results = this.foods;

    // Filter by category if specified
    if (category && this.foodsByCategory[category]) {
      results = this.foodsByCategory[category];
    }

    // Score and filter results
    const scoredResults = results
      .map(food => {
        const score = this.calculateMatchScore(food, searchTerms);
        return { food, score };
      })
      .filter(({ score }) => score > 0)
      .filter(({ food }) => {
        // Apply nutrition filters
        if (minProtein && food.protein < minProtein) return false;
        if (maxCalories && food.calories > maxCalories) return false;
        if (minCalories && food.calories < minCalories) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ food }) => food);

    return scoredResults;
  }

  /**
   * Calculate match score for a food against search terms
   */
  calculateMatchScore(food, searchTerms) {
    const nameLower = food.name.toLowerCase();
    const brandLower = (food.brand || '').toLowerCase();
    const aliasesLower = (food.aliases || []).map(a => a.toLowerCase());
    const categoryLower = (food.category || '').toLowerCase();

    let score = 0;
    let matchedTerms = 0;

    for (const term of searchTerms) {
      let termScore = 0;

      // Skip very short terms or common words
      if (term.length < 2) continue;
      if (['the', 'a', 'an', 'of', 'with', 'and'].includes(term)) continue;

      // Exact match in name (highest priority)
      if (nameLower === term) {
        termScore += 200;
        matchedTerms++;
      }
      // Name starts with term
      else if (nameLower.startsWith(term)) {
        termScore += 150;
        matchedTerms++;
      }
      // Name contains term as whole word
      else if (nameLower.includes(` ${term}`) || nameLower.includes(`${term} `) || nameLower.endsWith(term)) {
        termScore += 100;
        matchedTerms++;
      }
      // Name contains term
      else if (nameLower.includes(term)) {
        termScore += 80;
        matchedTerms++;
      }
      // Alias match
      else if (aliasesLower.some(alias => alias.includes(term))) {
        termScore += 60;
        matchedTerms++;
      }
      // Brand match
      else if (brandLower.includes(term)) {
        termScore += 40;
        matchedTerms++;
      }
      // Fuzzy match (allow 1 character difference for terms > 3 chars)
      else if (term.length > 3) {
        const fuzzyMatch = this.fuzzyMatch(nameLower, term);
        if (fuzzyMatch) {
          termScore += 30;
          matchedTerms++;
        }
      }
      // Category match (lowest priority)
      else if (categoryLower.includes(term) && matchedTerms > 0) {
        termScore += 5;
      }

      score += termScore;
    }

    // CRITICAL: If no terms matched, return 0 (no match)
    if (matchedTerms === 0) {
      return 0;
    }

    // Bonus for matching ALL search terms
    if (matchedTerms === searchTerms.filter(t => t.length >= 2).length) {
      score += 50;
    }

    // Small bonus for popularity
    score += (food.popularity_score || 0) * 0.01;

    // Small bonus for verified foods
    if (food.verified) {
      score += 2;
    }

    return score;
  }

  /**
   * Simple fuzzy matching (Levenshtein distance <= 1)
   */
  fuzzyMatch(str, term) {
    for (let i = 0; i < str.length - term.length + 1; i++) {
      const substring = str.substr(i, term.length);
      let differences = 0;

      for (let j = 0; j < term.length; j++) {
        if (substring[j] !== term[j]) {
          differences++;
          if (differences > 1) break;
        }
      }

      if (differences <= 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get foods by category
   */
  getByCategory(category, limit = 50) {
    if (!this.isLoaded) {
      this.initialize();
    }

    const foods = this.foodsByCategory[category] || [];
    return foods.slice(0, limit);
  }

  /**
   * Get all available categories
   */
  getCategories() {
    if (!this.isLoaded) {
      this.initialize();
    }

    return Object.keys(this.foodsByCategory);
  }

  /**
   * Get a food by ID
   */
  getById(id) {
    if (!this.isLoaded) {
      this.initialize();
    }

    return this.foods.find(f => f.id === id) || null;
  }

  /**
   * Get popular foods (highest scored)
   */
  getPopular(limit = 20) {
    if (!this.isLoaded) {
      this.initialize();
    }

    return [...this.foods]
      .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0))
      .slice(0, limit);
  }

  /**
   * Get high protein foods
   */
  getHighProtein(minProtein = 20, limit = 20) {
    if (!this.isLoaded) {
      this.initialize();
    }

    return this.foods
      .filter(f => f.protein >= minProtein)
      .sort((a, b) => b.protein - a.protein)
      .slice(0, limit);
  }

  /**
   * Get low calorie foods
   */
  getLowCalorie(maxCalories = 100, limit = 20) {
    if (!this.isLoaded) {
      this.initialize();
    }

    return this.foods
      .filter(f => f.calories <= maxCalories && f.calories > 0)
      .sort((a, b) => a.calories - b.calories)
      .slice(0, limit);
  }

  /**
   * Convert curated food to the format expected by the app
   */
  toAppFormat(curatedFood) {
    return {
      id: curatedFood.id,
      name: curatedFood.name,
      brand: curatedFood.brand,
      calories: curatedFood.calories,
      protein: curatedFood.protein,
      carbs: curatedFood.carbs,
      fat: curatedFood.fat,
      fiber: curatedFood.fiber,
      sugar: curatedFood.sugar,
      sodium: curatedFood.sodium,
      serving_size: curatedFood.serving_size,
      serving_quantity: curatedFood.serving_quantity,
      common_servings: curatedFood.common_servings,
      category: curatedFood.category,
      source: 'curated',
      verified: curatedFood.verified,
      fdcId: curatedFood.id,
      description: curatedFood.name,
    };
  }

  /**
   * Search and return results in app format
   */
  searchForApp(query, options = {}) {
    const results = this.search(query, options);
    return results.map(food => this.toAppFormat(food));
  }

  /**
   * Get database stats
   */
  getStats() {
    if (!this.isLoaded) {
      this.initialize();
    }

    const categoryStats = {};
    Object.entries(this.foodsByCategory).forEach(([cat, foods]) => {
      categoryStats[cat] = foods.length;
    });

    return {
      version: this.version,
      totalFoods: this.foods.length,
      categories: categoryStats,
      isLoaded: this.isLoaded,
    };
  }

  /**
   * Clear cache (for debugging)
   */
  async clearCache() {
    await AsyncStorage.multiRemove([CACHE_KEY, VERSION_KEY, LAST_CHECK_KEY]);
  }
}

// Export singleton instance
const curatedFoodDatabase = new CuratedFoodDatabase();
export default curatedFoodDatabase;

// Also export the class for testing
export { CuratedFoodDatabase };
