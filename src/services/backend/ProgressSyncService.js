// ProgressSyncService - Handles synchronization of progress tracking data with Firebase
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_ENTRIES_KEY = '@progress_entries';

class ProgressSyncService {
  constructor() {
    this.db = db;
  }

  // Upload a single progress entry to Firebase
  async uploadProgressEntry(userId, progressEntry) {
    try {
      if (!userId || userId === 'guest') {

        return null;
      }

      const progressRef = doc(
        collection(this.db, 'users', userId, 'progress')
      );

      const progressData = {
        ...progressEntry,
        id: progressRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(progressRef, progressData);


      return progressRef.id;
    } catch (error) {
      console.error('Error uploading progress entry:', error);
      throw error;
    }
  }

  // Get a specific progress entry from Firebase
  async getProgressEntry(userId, entryId) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      const progressRef = doc(this.db, 'users', userId, 'progress', entryId);
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        return { id: progressDoc.id, ...progressDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting progress entry:', error);
      throw error;
    }
  }

  // Get all progress entries from Firebase
  async getAllProgress(userId, limitCount = 100) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      const progressRef = collection(this.db, 'users', userId, 'progress');
      const q = query(
        progressRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const progressEntries = [];

      querySnapshot.forEach((doc) => {
        progressEntries.push({ id: doc.id, ...doc.data() });
      });


      return progressEntries;
    } catch (error) {
      console.error('Error getting progress entries:', error);
      throw error;
    }
  }

  // Download progress entries from Firebase and merge with local
  async downloadProgress(userId) {
    try {
      if (!userId || userId === 'guest') {

        return [];
      }

      const cloudProgress = await this.getAllProgress(userId);

      // Get local progress
      const localProgressJSON = await AsyncStorage.getItem(PROGRESS_ENTRIES_KEY);
      const localProgress = localProgressJSON ? JSON.parse(localProgressJSON) : [];

      // Merge: cloud data takes precedence
      const progressMap = new Map();

      // Add local entries first
      localProgress.forEach(entry => {
        progressMap.set(entry.cloudId || entry.id, entry);
      });

      // Override with cloud entries
      cloudProgress.forEach(entry => {
        progressMap.set(entry.id, { ...entry, synced: true, cloudId: entry.id });
      });

      const mergedProgress = Array.from(progressMap.values());

      // Save merged data locally
      await AsyncStorage.setItem(PROGRESS_ENTRIES_KEY, JSON.stringify(mergedProgress));


      return mergedProgress;
    } catch (error) {
      console.error('Error downloading progress:', error);
      throw error;
    }
  }

  // Upload all local progress entries to Firebase (bulk sync)
  async uploadLocalProgress(userId) {
    try {
      if (!userId || userId === 'guest') {

        return { uploaded: 0, failed: 0 };
      }

      // Get local progress entries
      const localProgressJSON = await AsyncStorage.getItem(PROGRESS_ENTRIES_KEY);
      if (!localProgressJSON) {

        return { uploaded: 0, failed: 0 };
      }

      const localProgress = JSON.parse(localProgressJSON);
      const unsyncedProgress = localProgress.filter(entry => !entry.synced);

      if (unsyncedProgress.length === 0) {

        return { uploaded: 0, failed: 0 };
      }



      const batch = writeBatch(this.db);
      let uploadedCount = 0;

      for (const entry of unsyncedProgress) {
        try {
          const progressRef = doc(
            collection(this.db, 'users', userId, 'progress')
          );

          const progressData = {
            ...entry,
            id: progressRef.id,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          batch.set(progressRef, progressData);

          // Update local entry with cloud ID
          entry.cloudId = progressRef.id;
          entry.synced = true;
          uploadedCount++;
        } catch (error) {
          console.error('Error preparing progress entry for upload:', error);
        }
      }

      await batch.commit();

      // Update local storage with synced status
      await AsyncStorage.setItem(PROGRESS_ENTRIES_KEY, JSON.stringify(localProgress));


      return { uploaded: uploadedCount, failed: unsyncedProgress.length - uploadedCount };
    } catch (error) {
      console.error('Error uploading local progress:', error);
      throw error;
    }
  }

  // Delete a progress entry from Firebase
  async deleteProgressEntry(userId, entryId) {
    try {
      if (!userId || userId === 'guest') {

        return;
      }

      const progressRef = doc(this.db, 'users', userId, 'progress', entryId);
      await deleteDoc(progressRef);


    } catch (error) {
      console.error('Error deleting progress entry:', error);
      throw error;
    }
  }

  // Sync a single progress entry immediately after creation/update
  async syncProgressEntry(userId, progressEntry) {
    try {
      if (!userId || userId === 'guest') {

        return null;
      }

      const cloudId = await this.uploadProgressEntry(userId, progressEntry);


      return cloudId;
    } catch (error) {
      console.error('Error syncing progress entry:', error);
      throw error;
    }
  }

  // Get progress stats (latest entry)
  async getLatestProgress(userId) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      const progressRef = collection(this.db, 'users', userId, 'progress');
      const q = query(
        progressRef,
        orderBy('date', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const latestDoc = querySnapshot.docs[0];
      return { id: latestDoc.id, ...latestDoc.data() };
    } catch (error) {
      console.error('Error getting latest progress:', error);
      throw error;
    }
  }
}

export default new ProgressSyncService();
