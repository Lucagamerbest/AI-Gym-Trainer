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
  // Note: We don't cache auth/db references in constructor since they may not be ready
  // Instead, we access them directly when needed to ensure fresh state

  get currentUser() {
    return auth.currentUser;
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
      const userId = this.currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create a new document reference with auto-generated ID
      const workoutRef = doc(collection(db, 'users', userId, 'workouts'));

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
      console.error('❌ SYNC: Error saving workout to cloud:', error);
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
      const userId = this.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
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
      // Don't access Firebase if not authenticated
      if (!this.currentUser) {
        return [];
      }

      const userId = this.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutsRef = collection(db, 'users', userId, 'workouts');
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
      // Silently fail on permission errors (happens during hot reload before auth completes)
      if (error.code === 'permission-denied') {
        return [];
      }
      console.error('Error getting workouts from cloud:', error);
      return [];
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
      const userId = this.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const workoutsRef = collection(db, 'users', userId, 'workouts');
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
  async syncLocalWorkouts(userId) {
    try {
      const firebaseUserId = this.currentUser?.uid;

      if (!firebaseUserId) {
        throw new Error('User not authenticated');
      }

      // Use Firebase UID for local storage lookup
      const localStorageUserId = userId || firebaseUserId;

      // Get all local workouts from AsyncStorage
      const localWorkouts = await WorkoutStorageService.getWorkoutHistory(localStorageUserId);

      if (!localWorkouts || localWorkouts.length === 0) {
        return { synced: 0, failed: 0 };
      }

      // Filter out workouts that are already synced
      const unsyncedWorkouts = localWorkouts.filter(w => !w.synced);

      if (unsyncedWorkouts.length === 0) {
        return { synced: 0, failed: 0 };
      }

      // Use Firebase batch for efficient writes (can handle up to 500 operations)
      const batch = writeBatch(db);
      let syncedCount = 0;
      const updatedWorkouts = [...localWorkouts];

      for (let i = 0; i < unsyncedWorkouts.length; i++) {
        const workout = unsyncedWorkouts[i];

        try {
          // Create a new document reference
          const workoutRef = doc(
            collection(db, 'users', firebaseUserId, 'workouts')
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
          console.error(`Error preparing workout ${workout.id}:`, error);
        }
      }

      // Commit the batch write to Firebase
      await batch.commit();

      // Update local storage with sync status (use correct userId)
      await WorkoutStorageService.saveWorkouts(updatedWorkouts, localStorageUserId);

      const failedCount = unsyncedWorkouts.length - syncedCount;

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
   * @param {string} userId - Firebase UID for local storage key
   * @returns {Promise<Array>} Merged workouts array
   */
  async downloadCloudWorkouts(userId) {
    try {
      const firebaseUserId = this.currentUser?.uid;
      if (!firebaseUserId) {
        throw new Error('User not authenticated');
      }

      // IMPORTANT: Use the Firebase UID for local storage, not 'guest'
      const localStorageUserId = userId || firebaseUserId;

      // Get all workouts from cloud
      const cloudWorkouts = await this.getAllWorkouts();

      // Get local workouts
      const localWorkouts = await WorkoutStorageService.getWorkoutHistory(localStorageUserId);

      console.log('☁️ Cloud workouts count:', cloudWorkouts.length);
      console.log('📱 Local workouts count:', localWorkouts.length);

      // SIMPLE STRATEGY: Firebase is the source of truth
      // Only keep local workouts that have NEVER been synced (no cloudId, no synced flag)
      // Everything else comes from Firebase

      const cloudWorkoutIds = new Set(cloudWorkouts.map(w => w.id));
      const workoutMap = new Map();

      // First, add cloud workouts (these are the source of truth)
      cloudWorkouts.forEach(workout => {
        workoutMap.set(workout.id, {
          ...workout,
          synced: true,
          cloudId: workout.id,
        });
      });

      // Only keep truly local workouts (never synced to cloud)
      // These are workouts created offline that haven't been uploaded yet
      localWorkouts.forEach(workout => {
        const hasCloudId = workout.cloudId;
        const wasSynced = workout.synced === true;
        const existsInCloud = cloudWorkoutIds.has(workout.cloudId) || cloudWorkoutIds.has(workout.id);

        // If this workout was NEVER synced (truly local only), keep it
        if (!hasCloudId && !wasSynced && !existsInCloud) {
          console.log('📱 Keeping local-only workout:', workout.workoutTitle || workout.id);
          workoutMap.set(workout.id, workout);
        } else if (!existsInCloud && (hasCloudId || wasSynced)) {
          // Was synced before but no longer in cloud = DELETED
          console.log('🗑️ Removing deleted workout:', workout.workoutTitle || workout.id);
        }
      });

      console.log('✅ Final workout count:', workoutMap.size);

      // Convert map back to array
      const mergedWorkouts = Array.from(workoutMap.values());

      // Sort by date (most recent first)
      mergedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Save merged workouts to local storage using the CORRECT user ID
      await WorkoutStorageService.saveWorkouts(mergedWorkouts, localStorageUserId);

      return mergedWorkouts;
    } catch (error) {
      console.error('Error downloading cloud workouts:', error);
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
