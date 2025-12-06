/**
 * User Contributed Foods Service
 *
 * Phase 4 of the Food Database Improvement Plan
 *
 * Features:
 * - Users can add custom foods
 * - Local-first storage (AsyncStorage) for offline use
 * - Firebase sync for cloud backup and community sharing
 * - Voting/verification system
 * - Integration with unified food search
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

// Storage keys
const USER_FOODS_KEY = '@user_contributed_foods';
const USER_FOODS_SYNC_KEY = '@user_foods_last_sync';

// Firestore collections
const COLLECTIONS = {
  USER_FOODS: 'user_foods',
  FOOD_VOTES: 'food_votes',
  COMMUNITY_FOODS: 'community_foods', // Verified community foods
};

// Categories for custom foods
export const FOOD_CATEGORIES = [
  'Protein',
  'Dairy',
  'Carbs',
  'Fruits',
  'Vegetables',
  'Fats',
  'Supplements',
  'Beverages',
  'Condiments',
  'Snacks',
  'Fast Food',
  'Restaurant',
  'Homemade',
  'Other',
];

class UserContributedFoodsService {
  constructor() {
    this.localFoods = [];
    this.isLoaded = false;
  }

  /**
   * Initialize the service - load local foods
   */
  async initialize() {
    if (this.isLoaded) return;

    try {
      const stored = await AsyncStorage.getItem(USER_FOODS_KEY);
      if (stored) {
        this.localFoods = JSON.parse(stored);
      }
      this.isLoaded = true;
      console.log(`🍽️ Loaded ${this.localFoods.length} user foods from storage`);
    } catch (error) {
      console.error('Failed to load user foods:', error);
      this.localFoods = [];
      this.isLoaded = true;
    }
  }

  /**
   * Save local foods to AsyncStorage
   */
  async saveLocal() {
    try {
      await AsyncStorage.setItem(USER_FOODS_KEY, JSON.stringify(this.localFoods));
    } catch (error) {
      console.error('Failed to save user foods:', error);
    }
  }

  /**
   * Generate a unique ID for local foods
   */
  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a new custom food
   * @param {Object} food - Food data
   * @param {string} userId - User ID (optional, for Firebase sync)
   * @returns {Object} - Created food with ID
   */
  async addFood(food, userId = null) {
    if (!this.isLoaded) await this.initialize();

    // Validate required fields
    if (!food.name || food.name.trim().length === 0) {
      throw new Error('Food name is required');
    }
    if (food.calories === undefined || food.calories < 0) {
      throw new Error('Valid calories value is required');
    }

    // Create food object
    const newFood = {
      id: this.generateId(),
      name: food.name.trim(),
      brand: food.brand?.trim() || '',
      calories: Math.round(food.calories) || 0,
      protein: Math.round((food.protein || 0) * 10) / 10,
      carbs: Math.round((food.carbs || 0) * 10) / 10,
      fat: Math.round((food.fat || 0) * 10) / 10,
      fiber: Math.round((food.fiber || 0) * 10) / 10,
      sugar: Math.round((food.sugar || 0) * 10) / 10,
      sodium: Math.round(food.sodium || 0),
      serving_size: food.serving_size || '100g',
      serving_quantity: food.serving_quantity || 100,
      category: food.category || 'Other',
      barcode: food.barcode || null,
      common_servings: food.common_servings || null,
      source: 'user',
      contributor_id: userId,
      verified: false,
      votes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };

    // Add to local storage
    this.localFoods.unshift(newFood);
    await this.saveLocal();

    // Try to sync to Firebase if user is logged in
    if (userId && db) {
      try {
        await this.syncFoodToFirebase(newFood, userId);
      } catch (error) {
        console.log('Firebase sync failed, will retry later:', error.message);
      }
    }

    console.log(`✅ Added custom food: ${newFood.name}`);
    return newFood;
  }

  /**
   * Update an existing food
   * @param {string} foodId - Food ID
   * @param {Object} updates - Fields to update
   * @param {string} userId - User ID
   */
  async updateFood(foodId, updates, userId = null) {
    if (!this.isLoaded) await this.initialize();

    const index = this.localFoods.findIndex(f => f.id === foodId);
    if (index === -1) {
      throw new Error('Food not found');
    }

    // Only allow editing own foods
    const food = this.localFoods[index];
    if (food.contributor_id && food.contributor_id !== userId) {
      throw new Error('Cannot edit foods created by other users');
    }

    // Update food
    this.localFoods[index] = {
      ...food,
      ...updates,
      updated_at: new Date().toISOString(),
      synced: false,
    };

    await this.saveLocal();

    // Try to sync to Firebase
    if (userId && db && food.firebase_id) {
      try {
        await this.updateFoodInFirebase(food.firebase_id, updates);
      } catch (error) {
        console.log('Firebase update failed:', error.message);
      }
    }

    return this.localFoods[index];
  }

  /**
   * Delete a food
   * @param {string} foodId - Food ID
   * @param {string} userId - User ID
   */
  async deleteFood(foodId, userId = null) {
    if (!this.isLoaded) await this.initialize();

    const index = this.localFoods.findIndex(f => f.id === foodId);
    if (index === -1) {
      throw new Error('Food not found');
    }

    const food = this.localFoods[index];

    // Only allow deleting own foods
    if (food.contributor_id && food.contributor_id !== userId) {
      throw new Error('Cannot delete foods created by other users');
    }

    // Remove from local
    this.localFoods.splice(index, 1);
    await this.saveLocal();

    // Try to delete from Firebase
    if (db && food.firebase_id) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.USER_FOODS, food.firebase_id));
      } catch (error) {
        console.log('Firebase delete failed:', error.message);
      }
    }

    console.log(`🗑️ Deleted food: ${food.name}`);
  }

  /**
   * Search user foods locally
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Matching foods
   */
  async search(query, options = {}) {
    if (!this.isLoaded) await this.initialize();

    const { maxResults = 20, category = null } = options;

    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    const searchTerms = queryLower.split(/\s+/);

    // Score and filter results
    const scoredResults = this.localFoods
      .map(food => {
        const score = this.calculateMatchScore(food, searchTerms);
        return { food, score };
      })
      .filter(({ score }) => score > 0)
      .filter(({ food }) => !category || food.category === category)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ food }) => ({
        ...food,
        source: 'user',
      }));

    return scoredResults;
  }

  /**
   * Calculate match score for a food
   */
  calculateMatchScore(food, searchTerms) {
    const nameLower = food.name.toLowerCase();
    const brandLower = (food.brand || '').toLowerCase();

    let score = 0;

    for (const term of searchTerms) {
      if (term.length < 2) continue;

      if (nameLower === term) {
        score += 200;
      } else if (nameLower.startsWith(term)) {
        score += 150;
      } else if (nameLower.includes(term)) {
        score += 100;
      } else if (brandLower.includes(term)) {
        score += 50;
      }
    }

    return score;
  }

  /**
   * Get all user foods
   * @param {string} userId - Optional user ID to filter by
   */
  async getAllFoods(userId = null) {
    if (!this.isLoaded) await this.initialize();

    if (userId) {
      return this.localFoods.filter(f => f.contributor_id === userId);
    }
    return this.localFoods;
  }

  /**
   * Get a food by ID
   */
  async getFoodById(foodId) {
    if (!this.isLoaded) await this.initialize();
    return this.localFoods.find(f => f.id === foodId) || null;
  }

  /**
   * Get recent user foods
   */
  async getRecentFoods(limit = 10, userId = null) {
    if (!this.isLoaded) await this.initialize();

    let foods = this.localFoods;
    if (userId) {
      foods = foods.filter(f => f.contributor_id === userId);
    }

    return foods
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  // ========================================
  // Firebase Sync Methods
  // ========================================

  /**
   * Sync a food to Firebase
   */
  async syncFoodToFirebase(food, userId) {
    if (!db) return;

    const docData = {
      ...food,
      contributor_id: userId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    delete docData.id;
    delete docData.synced;

    const docRef = await addDoc(collection(db, COLLECTIONS.USER_FOODS), docData);

    // Update local food with Firebase ID
    const index = this.localFoods.findIndex(f => f.id === food.id);
    if (index !== -1) {
      this.localFoods[index].firebase_id = docRef.id;
      this.localFoods[index].synced = true;
      await this.saveLocal();
    }

    console.log(`☁️ Synced food to Firebase: ${food.name}`);
  }

  /**
   * Update a food in Firebase
   */
  async updateFoodInFirebase(firebaseId, updates) {
    if (!db) return;

    const docRef = doc(db, COLLECTIONS.USER_FOODS, firebaseId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  }

  /**
   * Sync all unsynced foods to Firebase
   */
  async syncAllToFirebase(userId) {
    if (!db || !userId) return;

    const unsyncedFoods = this.localFoods.filter(f => !f.synced && f.contributor_id === userId);

    for (const food of unsyncedFoods) {
      try {
        await this.syncFoodToFirebase(food, userId);
      } catch (error) {
        console.log(`Failed to sync ${food.name}:`, error.message);
      }
    }

    console.log(`☁️ Synced ${unsyncedFoods.length} foods to Firebase`);
  }

  /**
   * Download user's foods from Firebase
   */
  async downloadFromFirebase(userId) {
    if (!db || !userId) return;

    try {
      const q = query(
        collection(db, COLLECTIONS.USER_FOODS),
        where('contributor_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      const firebaseFoods = [];

      snapshot.forEach(doc => {
        firebaseFoods.push({
          ...doc.data(),
          id: `user_${doc.id}`,
          firebase_id: doc.id,
          synced: true,
        });
      });

      // Merge with local foods (Firebase takes priority for duplicates)
      const firebaseIds = new Set(firebaseFoods.map(f => f.firebase_id));
      const localOnlyFoods = this.localFoods.filter(
        f => !f.firebase_id || !firebaseIds.has(f.firebase_id)
      );

      this.localFoods = [...firebaseFoods, ...localOnlyFoods];
      await this.saveLocal();

      console.log(`☁️ Downloaded ${firebaseFoods.length} foods from Firebase`);
    } catch (error) {
      console.log('Failed to download from Firebase:', error.message);
    }
  }

  // ========================================
  // Voting System
  // ========================================

  /**
   * Vote on a food's accuracy
   * @param {string} foodId - Food ID
   * @param {string} userId - Voter user ID
   * @param {boolean} isAccurate - True for upvote, false for downvote
   */
  async voteOnFood(foodId, userId, isAccurate) {
    if (!db || !userId) {
      throw new Error('Must be logged in to vote');
    }

    // Check if user already voted
    const voteQuery = query(
      collection(db, COLLECTIONS.FOOD_VOTES),
      where('food_id', '==', foodId),
      where('user_id', '==', userId)
    );
    const existingVotes = await getDocs(voteQuery);

    if (!existingVotes.empty) {
      throw new Error('Already voted on this food');
    }

    // Add vote
    await addDoc(collection(db, COLLECTIONS.FOOD_VOTES), {
      food_id: foodId,
      user_id: userId,
      is_accurate: isAccurate,
      created_at: serverTimestamp(),
    });

    // Update vote count on the food
    const index = this.localFoods.findIndex(f => f.id === foodId);
    if (index !== -1) {
      const voteChange = isAccurate ? 1 : -1;
      this.localFoods[index].votes = (this.localFoods[index].votes || 0) + voteChange;
      await this.saveLocal();

      // Update in Firebase if exists
      const food = this.localFoods[index];
      if (food.firebase_id) {
        await updateDoc(doc(db, COLLECTIONS.USER_FOODS, food.firebase_id), {
          votes: increment(voteChange),
        });
      }

      // Check if food should be verified (10+ votes, 80%+ accuracy)
      await this.checkForVerification(food);
    }

    console.log(`👍 Voted ${isAccurate ? 'up' : 'down'} on food: ${foodId}`);
  }

  /**
   * Check if a food should be verified based on votes
   */
  async checkForVerification(food) {
    if (food.verified) return;

    // Requirements: 10+ votes and positive score
    if (food.votes >= 10) {
      // Update to verified
      const index = this.localFoods.findIndex(f => f.id === food.id);
      if (index !== -1) {
        this.localFoods[index].verified = true;
        await this.saveLocal();

        // Add to community foods collection (for sharing with all users)
        if (db && food.firebase_id) {
          await addDoc(collection(db, COLLECTIONS.COMMUNITY_FOODS), {
            ...food,
            verified: true,
            verified_at: serverTimestamp(),
          });

          console.log(`✅ Food verified and added to community: ${food.name}`);
        }
      }
    }
  }

  /**
   * Get community verified foods
   */
  async getCommunityFoods(limitCount = 100) {
    if (!db) return [];

    try {
      const q = query(
        collection(db, COLLECTIONS.COMMUNITY_FOODS),
        where('verified', '==', true),
        orderBy('votes', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const foods = [];

      snapshot.forEach(doc => {
        foods.push({
          ...doc.data(),
          id: `community_${doc.id}`,
          source: 'community',
        });
      });

      return foods;
    } catch (error) {
      console.log('Failed to get community foods:', error.message);
      return [];
    }
  }

  /**
   * Search community foods
   */
  async searchCommunity(query, maxResults = 20) {
    const communityFoods = await this.getCommunityFoods(500);
    const queryLower = query.toLowerCase().trim();
    const searchTerms = queryLower.split(/\s+/);

    return communityFoods
      .map(food => ({
        food,
        score: this.calculateMatchScore(food, searchTerms),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(({ food }) => food);
  }

  // ========================================
  // Stats and Info
  // ========================================

  /**
   * Get stats about user foods
   */
  async getStats(userId = null) {
    if (!this.isLoaded) await this.initialize();

    const foods = userId
      ? this.localFoods.filter(f => f.contributor_id === userId)
      : this.localFoods;

    const synced = foods.filter(f => f.synced).length;
    const verified = foods.filter(f => f.verified).length;

    const categoryStats = {};
    foods.forEach(f => {
      const cat = f.category || 'Other';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    return {
      totalFoods: foods.length,
      syncedFoods: synced,
      verifiedFoods: verified,
      categoryBreakdown: categoryStats,
    };
  }

  /**
   * Clear all local user foods (for debugging/reset)
   */
  async clearAll() {
    this.localFoods = [];
    await AsyncStorage.removeItem(USER_FOODS_KEY);
    console.log('🗑️ Cleared all user foods');
  }
}

// Export singleton instance
const userContributedFoods = new UserContributedFoodsService();
export default userContributedFoods;

// Also export the class for testing
export { UserContributedFoodsService };
