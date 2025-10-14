// Backend Service - Main interface for Firebase operations
// Handles all backend/database operations for the app

import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

class BackendService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // ========================================
  // CONNECTION TESTING
  // ========================================

  /**
   * Test Firebase connection by writing a test document
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const testRef = doc(collection(this.db, 'test'), 'connection-test');
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
    const user = this.auth.currentUser;
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
    return this.auth.currentUser;
  }

  /**
   * Create or update user profile in Firestore
   * @param {object} firebaseUser - Firebase user object
   */
  async createOrUpdateUserProfile(firebaseUser) {
    try {
      const userRef = doc(this.db, 'users', firebaseUser.uid);
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
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user settings
   * @param {string} userId - User ID
   * @param {object} settings - Settings to update
   */
  async updateUserSettings(userId, settings) {
    try {
      const userRef = doc(this.db, 'users', userId);
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
      const userRef = doc(this.db, 'users', userId);
      await setDoc(userRef, {
        goals,
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
    return collection(this.db, 'users', userId, 'workouts');
  }

  /**
   * Get reference to user's meals collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getMealsRef(userId) {
    return collection(this.db, 'users', userId, 'meals');
  }

  /**
   * Get reference to user's progress collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getProgressRef(userId) {
    return collection(this.db, 'users', userId, 'progress');
  }

  /**
   * Get reference to user's AI sessions collection
   * @param {string} userId - User ID
   * @returns {CollectionReference}
   */
  getAISessionsRef(userId) {
    return collection(this.db, 'users', userId, 'ai_sessions');
  }
}

// Export singleton instance
export default new BackendService();
