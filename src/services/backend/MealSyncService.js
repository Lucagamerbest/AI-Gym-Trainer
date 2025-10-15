// MealSyncService - Handles synchronization of meal/nutrition data with Firebase
import { db } from '../../config/firebase';
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
import { getDailySummary, addToDaily } from '../foodDatabase.web';

class MealSyncService {
  constructor() {
    this.db = db;
  }

  // Upload a single daily consumption entry to Firebase
  async uploadDailyConsumption(userId, consumptionData) {
    try {
      if (!userId || userId === 'guest') {
        console.log('Skipping meal sync for guest user');
        return null;
      }

      const consumptionRef = doc(
        collection(this.db, 'users', userId, 'meals')
      );

      const mealData = {
        ...consumptionData,
        id: consumptionRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(consumptionRef, mealData);

      console.log('✅ Meal entry saved to cloud:', consumptionRef.id);
      return consumptionRef.id;
    } catch (error) {
      console.error('Error uploading meal:', error);
      throw error;
    }
  }

  // Get meals for a specific date from Firebase
  async getMealsByDate(userId, date) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      // Convert date to start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const mealsRef = collection(this.db, 'users', userId, 'meals');
      const q = query(
        mealsRef,
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString()),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const meals = [];

      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });

      return meals;
    } catch (error) {
      console.error('Error getting meals by date:', error);
      throw error;
    }
  }

  // Get all meals from Firebase (with limit)
  async getAllMeals(userId, limitCount = 100) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      const mealsRef = collection(this.db, 'users', userId, 'meals');
      const q = query(
        mealsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const meals = [];

      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ Retrieved ${meals.length} meals from cloud`);
      return meals;
    } catch (error) {
      console.error('Error getting meals:', error);
      throw error;
    }
  }

  // Download meals from Firebase and merge with local storage
  async downloadMeals(userId) {
    try {
      if (!userId || userId === 'guest') {
        console.log('Skipping meal download for guest user');
        return [];
      }

      const cloudMeals = await this.getAllMeals(userId);

      console.log(`✅ Downloaded ${cloudMeals.length} meals from Firebase`);
      return cloudMeals;
    } catch (error) {
      console.error('Error downloading meals:', error);
      throw error;
    }
  }

  // Upload all local meals to Firebase (bulk sync)
  async uploadLocalMeals(userId, dailySummary) {
    try {
      if (!userId || userId === 'guest') {
        console.log('Skipping meal upload for guest user');
        return { uploaded: 0, failed: 0 };
      }

      if (!dailySummary || dailySummary.length === 0) {
        console.log('✅ No meals to sync');
        return { uploaded: 0, failed: 0 };
      }

      console.log(`📤 Uploading ${dailySummary.length} meal entries to Firebase...`);

      const batch = writeBatch(this.db);
      let uploadedCount = 0;

      for (const meal of dailySummary) {
        try {
          const mealRef = doc(
            collection(this.db, 'users', userId, 'meals')
          );

          const mealData = {
            ...meal,
            id: mealRef.id,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          batch.set(mealRef, mealData);
          uploadedCount++;
        } catch (error) {
          console.error('Error preparing meal for upload:', error);
        }
      }

      await batch.commit();

      console.log(`✅ Uploaded ${uploadedCount} meals to Firebase`);
      return { uploaded: uploadedCount, failed: dailySummary.length - uploadedCount };
    } catch (error) {
      console.error('Error uploading local meals:', error);
      throw error;
    }
  }

  // Sync today's meals to Firebase
  async syncTodaysMeals(userId) {
    try {
      if (!userId || userId === 'guest') {
        console.log('Skipping sync for guest user');
        return { uploaded: 0, failed: 0 };
      }

      // Get today's summary from local storage
      const todaySummary = await getDailySummary(userId);

      if (!todaySummary || todaySummary.length === 0) {
        console.log('✅ No meals to sync today');
        return { uploaded: 0, failed: 0 };
      }

      // Upload to Firebase
      const result = await this.uploadLocalMeals(userId, todaySummary);

      console.log(`✅ Synced today's meals: ${result.uploaded} uploaded, ${result.failed} failed`);
      return result;
    } catch (error) {
      console.error('Error syncing today\'s meals:', error);
      throw error;
    }
  }

  // Sync a single meal entry immediately after adding
  async syncMealEntry(userId, mealEntry) {
    try {
      if (!userId || userId === 'guest') {
        console.log('Skipping sync for guest user');
        return null;
      }

      const cloudId = await this.uploadDailyConsumption(userId, mealEntry);

      console.log('✅ Meal entry synced immediately');
      return cloudId;
    } catch (error) {
      console.error('Error syncing meal entry:', error);
      throw error;
    }
  }
}

export default new MealSyncService();
