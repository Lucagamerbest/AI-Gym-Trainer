// Backend Service - Main interface for Firebase operations
// Handles all backend/database operations for the app

import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

class BackendService {
  // Note: We access db and auth directly when needed to ensure fresh state
  // instead of caching them in constructor (which happens before auth is ready)

  // ========================================
  // CONNECTION TESTING
  // ========================================

  /**
   * Test Firebase connection by writing a test document
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const testRef = doc(collection(db, 'test'), 'connection-test');
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        message: 'Backend connected successfully',
        version: '1.0.0'
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================

  /**
   * Get current authenticated user ID
   * @returns {string|null} User ID or null if not authenticated
   */
  getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return user.uid;
  }

  /**
   * Get current user object
   * @returns {object|null} User object or null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Create or update user profile in Firestore
   * @param {object} firebaseUser - Firebase user object
   */
  async createOrUpdateUserProfile(firebaseUser) {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        updatedAt: new Date().toISOString(),
      };

      if (!userDoc.exists()) {
        // New user - create profile with default settings
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          settings: {
            units: 'imperial',
            theme: 'dark',
          },
          goals: {
            targetCalories: 2000,
            proteinGrams: 150,
            carbsGrams: 200,
            fatGrams: 65,
          },
        });
      } else {
        // Existing user - update profile
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} User profile or null
   */
  async getUserProfile(userId) {
    try {
      // Don't access Firebase if not authenticated
      if (!auth.currentUser) {
        return null;
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Also fetch from userProfiles collection (assessment data)
      const assessmentRef = doc(db, 'userProfiles', userId);
      const assessmentDoc = await getDoc(assessmentRef);

      // Merge both profiles (assessment data takes precedence for overlapping fields)
      const baseProfile = userDoc.exists() ? userDoc.data() : {};
      const assessmentProfile = assessmentDoc.exists() ? assessmentDoc.data() : {};

      if (userDoc.exists() || assessmentDoc.exists()) {
        return {
          ...baseProfile,
          ...assessmentProfile, // Assessment data overrides base profile
        };
      }

      return null;
    } catch (error) {
      // Silently fail on permission errors (happens during hot reload before auth completes)
      if (error.code === 'permission-denied') {
        return null;
      }
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {object} settings - Settings to update
   */
  async updateUserSettings(userId, settings) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        settings,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user goals
   * @param {string} userId - User ID
   * @param {object} goals - Goals to update
   */
  async updateUserGoals(userId, goals) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        goals,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user food preferences
   * @param {string} userId - User ID
   * @param {object} foodPreferences - Food preferences to update
   */
  async updateUserFoodPreferences(userId, foodPreferences) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        foodPreferences,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // COLLECTION REFERENCES
  // ========================================
  // These will be used in Phase 5-8 for data sync

  /**
   * Get reference to user's workouts collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getWorkoutsRef(userId) {
    return collection(db, 'users', userId, 'workouts');
  }

  /**
   * Get reference to user's meals collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getMealsRef(userId) {
    return collection(db, 'users', userId, 'meals');
  }

  /**
   * Get reference to user's progress collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getProgressRef(userId) {
    return collection(db, 'users', userId, 'progress');
  }

  /**
   * Get reference to user's AI sessions collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getAISessionsRef(userId) {
    return collection(db, 'users', userId, 'ai_sessions');
  }

  // ========================================
  // WORKOUT CACHE METHODS
  // ========================================

  /**
   * Save cached workouts to Firebase
   * @param {string} userId - User ID
   * @param {object} cache - Cache object with workouts, timestamp, and profile hash
   * @returns {Promise<void>}
   */
  async setCachedWorkouts(userId, cache) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'workouts');
      await setDoc(cacheRef, cache);
      console.log('✅ Cached workouts saved to Firebase');
    } catch (error) {
      console.error('❌ Failed to save workout cache:', error);
      throw error;
    }
  }

  /**
   * Get cached workouts from Firebase
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Cache object or null if not found
   */
  async getCachedWorkouts(userId) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'workouts');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        return cacheSnap.data();
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get workout cache:', error);
      return null;
    }
  }

  /**
   * Delete cached workouts
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteCachedWorkouts(userId) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'workouts');
      await deleteDoc(cacheRef);
      console.log('✅ Workout cache deleted');
    } catch (error) {
      console.error('❌ Failed to delete workout cache:', error);
      throw error;
    }
  }

  /**
   * Get workout usage stats (which variations user has seen)
   * @param {string} userId - User ID
   * @param {string} workoutType - Workout type (push, pull, legs, etc.)
   * @returns {Promise<object>} Usage stats object
   */
  async getWorkoutUsageStats(userId, workoutType) {
    try {
      const statsRef = doc(db, 'users', userId, 'workoutUsageStats', workoutType);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        return statsSnap.data();
      }

      return { seenVariations: [] };
    } catch (error) {
      console.error('❌ Failed to get workout usage stats:', error);
      return { seenVariations: [] };
    }
  }

  /**
   * Mark a workout variation as seen
   * @param {string} userId - User ID
   * @param {string} workoutType - Workout type
   * @param {number} variationIndex - Index of the variation
   * @returns {Promise<void>}
   */
  async markWorkoutAsSeen(userId, workoutType, variationIndex) {
    try {
      const statsRef = doc(db, 'users', userId, 'workoutUsageStats', workoutType);
      const statsSnap = await getDoc(statsRef);

      let seenVariations = [];
      if (statsSnap.exists()) {
        seenVariations = statsSnap.data().seenVariations || [];
      }

      // Add this variation if not already seen
      if (!seenVariations.includes(variationIndex)) {
        seenVariations.push(variationIndex);
        await setDoc(statsRef, { seenVariations }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Failed to mark workout as seen:', error);
    }
  }

  // ========================================
  // RECIPE CACHE METHODS
  // ========================================

  /**
   * Save cached recipes to Firebase
   * @param {string} userId - User ID
   * @param {object} cache - Cache object with recipes, timestamp, and profile hash
   * @returns {Promise<void>}
   */
  async setCachedRecipes(userId, cache) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'recipes');
      await setDoc(cacheRef, cache);
      console.log('✅ Cached recipes saved to Firebase');
    } catch (error) {
      console.error('❌ Failed to save recipe cache:', error);
      throw error;
    }
  }

  /**
   * Get cached recipes from Firebase
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Cache object or null if not found
   */
  async getCachedRecipes(userId) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'recipes');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        return cacheSnap.data();
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get recipe cache:', error);
      return null;
    }
  }

  /**
   * Delete cached recipes
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteCachedRecipes(userId) {
    try {
      const cacheRef = doc(db, 'users', userId, 'cache', 'recipes');
      await deleteDoc(cacheRef);
      console.log('✅ Recipe cache deleted');
    } catch (error) {
      console.error('❌ Failed to delete recipe cache:', error);
      throw error;
    }
  }

  /**
   * Get recipe usage stats (which variations user has seen)
   * @param {string} userId - User ID
   * @param {string} mealType - Meal type (breakfast, lunch, dinner, snack)
   * @param {boolean} highProtein - Whether this is high-protein variant
   * @returns {Promise<object>} Usage stats object
   */
  async getRecipeUsageStats(userId, mealType, highProtein) {
    try {
      const category = highProtein ? 'highProtein' : 'regular';
      const statsRef = doc(db, 'users', userId, 'recipeUsageStats', `${category}_${mealType}`);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        return statsSnap.data();
      }

      return { seenVariations: [] };
    } catch (error) {
      console.error('❌ Failed to get recipe usage stats:', error);
      return { seenVariations: [] };
    }
  }

  /**
   * Mark a recipe variation as seen
   * @param {string} userId - User ID
   * @param {string} mealType - Meal type
   * @param {boolean} highProtein - Whether this is high-protein variant
   * @param {number} variationIndex - Index of the variation
   * @returns {Promise<void>}
   */
  async markRecipeAsSeen(userId, mealType, highProtein, variationIndex) {
    try {
      const category = highProtein ? 'highProtein' : 'regular';
      const statsRef = doc(db, 'users', userId, 'recipeUsageStats', `${category}_${mealType}`);
      const statsSnap = await getDoc(statsRef);

      let seenVariations = [];
      if (statsSnap.exists()) {
        seenVariations = statsSnap.data().seenVariations || [];
      }

      // Add this variation if not already seen
      if (!seenVariations.includes(variationIndex)) {
        seenVariations.push(variationIndex);
        await setDoc(statsRef, { seenVariations }, { merge: true });
      }
    } catch (error) {
      console.error('❌ Failed to mark recipe as seen:', error);
    }
  }
}

// Export singleton instance
export default new BackendService();
