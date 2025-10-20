// Workout Sync Service - Handles syncing workout data to Firebase
// Phase 5: Workout Data Sync - Part 1

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
  limit,
  writeBatch
} from 'firebase/firestore';
import { WorkoutStorageService } from '../workoutStorage';

class WorkoutSyncService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // ========================================
  // SAVE SINGLE WORKOUT TO CLOUD
  // ========================================

  /**
   * Save a single workout to Firebase
   * @param {object} workout - Workout data to sync
   * @returns {Promise<string>} Cloud workout ID
   */
  async saveWorkout(workout) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create a new document reference with auto-generated ID
      const workoutRef = doc(collection(this.db, 'users', userId, 'workouts'));

      // Prepare workout data for cloud storage
      const workoutData = {
        ...workout,
        id: workoutRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await setDoc(workoutRef, workoutData);


      return workoutRef.id;
    } catch (error) {
      console.error('❌ Error saving workout to cloud:', error);
      throw error;
    }
  }

  // ========================================
  // GET SINGLE WORKOUT FROM CLOUD
  // ========================================

  /**
   * Get a specific workout from Firebase
   * @param {string} workoutId - Workout ID to fetch
   * @returns {Promise<object|null>} Workout data or null
   */
  async getWorkout(workoutId) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutRef = doc(this.db, 'users', userId, 'workouts', workoutId);
      const workoutDoc = await getDoc(workoutRef);

      if (workoutDoc.exists()) {

        return { id: workoutDoc.id, ...workoutDoc.data() };
      }


      return null;
    } catch (error) {
      console.error('❌ Error getting workout from cloud:', error);
      throw error;
    }
  }

  // ========================================
  // GET ALL WORKOUTS FROM CLOUD
  // ========================================

  /**
   * Get all workouts for the current user from Firebase
   * @param {number} limitCount - Maximum number of workouts to fetch
   * @returns {Promise<Array>} Array of workouts
   */
  async getAllWorkouts(limitCount = 100) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutsRef = collection(this.db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });


      return workouts;
    } catch (error) {
      console.error('❌ Error getting workouts from cloud:', error);
      throw error;
    }
  }

  // ========================================
  // GET WORKOUTS BY DATE RANGE
  // ========================================

  /**
   * Get workouts within a specific date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Array of workouts in date range
   */
  async getWorkoutsByDateRange(startDate, endDate) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutsRef = collection(this.db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });


      return workouts;
    } catch (error) {
      console.error('❌ Error getting workouts by date:', error);
      throw error;
    }
  }

  // ========================================
  // SYNC LOCAL WORKOUTS TO CLOUD (BULK)
  // ========================================

  /**
   * Sync all unsynced local workouts to Firebase
   * This is the main sync function for Phase 5
   * @param {string} userId - Optional user ID (defaults to 'guest')
   * @returns {Promise<object>} Sync results { synced, failed }
   */
  async syncLocalWorkouts(userId = 'guest') {
    try {
      const firebaseUserId = this.auth.currentUser?.uid;
      if (!firebaseUserId) {
        throw new Error('User not authenticated');
      }



      // Get all local workouts from AsyncStorage
      const localWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);

      if (!localWorkouts || localWorkouts.length === 0) {

        return { synced: 0, failed: 0 };
      }

      // Filter out workouts that are already synced
      const unsyncedWorkouts = localWorkouts.filter(w => !w.synced);

      if (unsyncedWorkouts.length === 0) {

        return { synced: 0, failed: 0 };
      }



      // Use Firebase batch for efficient writes (can handle up to 500 operations)
      const batch = writeBatch(this.db);
      let syncedCount = 0;
      const updatedWorkouts = [...localWorkouts];

      for (let i = 0; i < unsyncedWorkouts.length; i++) {
        const workout = unsyncedWorkouts[i];

        try {
          // Create a new document reference
          const workoutRef = doc(
            collection(this.db, 'users', firebaseUserId, 'workouts')
          );

          // Prepare workout data with cloud ID
          const workoutData = {
            ...workout,
            id: workoutRef.id,
            userId: firebaseUserId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          // Add to batch
          batch.set(workoutRef, workoutData);

          // Update local workout with cloud ID and sync status
          const localIndex = updatedWorkouts.findIndex(w => w.id === workout.id);
          if (localIndex !== -1) {
            updatedWorkouts[localIndex].cloudId = workoutRef.id;
            updatedWorkouts[localIndex].synced = true;
            updatedWorkouts[localIndex].syncedAt = new Date().toISOString();
          }

          syncedCount++;


        } catch (error) {
          console.error(`❌ Error preparing workout ${workout.id} for sync:`, error);
        }
      }

      // Commit the batch write to Firebase

      await batch.commit();

      // Update local storage with sync status

      await WorkoutStorageService.saveWorkouts(updatedWorkouts, userId);

      const failedCount = unsyncedWorkouts.length - syncedCount;


      if (failedCount > 0) {

      }

      return { synced: syncedCount, failed: failedCount };
    } catch (error) {
      console.error('❌ Error syncing local workouts:', error);
      throw error;
    }
  }

  // ========================================
  // DOWNLOAD CLOUD WORKOUTS TO LOCAL
  // ========================================

  /**
   * Download all cloud workouts and merge with local storage
   * Cloud data takes precedence over local data
   * @param {string} userId - Optional user ID (defaults to 'guest')
   * @returns {Promise<Array>} Merged workouts array
   */
  async downloadCloudWorkouts(userId = 'guest') {
    try {
      const firebaseUserId = this.auth.currentUser?.uid;
      if (!firebaseUserId) {
        throw new Error('User not authenticated');
      }



      // Get all workouts from cloud
      const cloudWorkouts = await this.getAllWorkouts();

      // Get local workouts
      const localWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);



      // Merge strategy: Create a map with cloud ID as key
      // Cloud data takes precedence
      const workoutMap = new Map();

      // Add local workouts first (these will be overridden if cloud version exists)
      localWorkouts.forEach(workout => {
        const key = workout.cloudId || workout.id;
        workoutMap.set(key, workout);
      });

      // Override with cloud workouts (cloud is source of truth)
      cloudWorkouts.forEach(workout => {
        workoutMap.set(workout.id, {
          ...workout,
          synced: true, // Mark as synced since it came from cloud
          cloudId: workout.id,
        });
      });

      // Convert map back to array
      const mergedWorkouts = Array.from(workoutMap.values());

      // Sort by date (most recent first)
      mergedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Save merged workouts to local storage

      await WorkoutStorageService.saveWorkouts(mergedWorkouts, userId);




      return mergedWorkouts;
    } catch (error) {
      console.error('❌ Error downloading cloud workouts:', error);
      throw error;
    }
  }
}

// Helper method to save workouts (add to WorkoutStorageService if not exists)
WorkoutStorageService.saveWorkouts = async function(workouts, userId = 'guest') {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const STORAGE_KEYS = {
      WORKOUT_HISTORY: 'workout_history'
    };
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`,
      JSON.stringify(workouts)
    );
    return { success: true };
  } catch (error) {
    console.error('Error saving workouts:', error);
    return { success: false, error: error.message };
  }
};

// Export singleton instance
export default new WorkoutSyncService();
