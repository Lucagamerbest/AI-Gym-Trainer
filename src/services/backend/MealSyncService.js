// MealSyncService - Handles synchronization of meal/nutrition data with Firebase
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
import { getDailySummary, addToDaily } from '../foodDatabase.web';

class MealSyncService {
  // Note: Access db and auth directly to ensure fresh state

  // Upload a single daily consumption entry to Firebase
  async uploadDailyConsumption(userId, consumptionData) {
    try {
      if (!userId || userId === 'guest') {

        return null;
      }

      const consumptionRef = doc(
        collection(db, 'users', userId, 'meals')
      );

      const mealData = {
        ...consumptionData,
        id: consumptionRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(consumptionRef, mealData);


      return consumptionRef.id;
    } catch (error) {
      console.error('Error uploading meal:', error);
      throw error;
    }
  }

  // Get meals for a specific date from Firebase
  async getMealsByDate(userId, date) {
    try {
      // Don't access Firebase if not authenticated
      if (!auth.currentUser) {
        return [];
      }

      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      // Ensure date is in YYYY-MM-DD format
      const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];

      const mealsRef = collection(db, 'users', userId, 'meals');
      const q = query(
        mealsRef,
        where('date', '==', dateString)
      );

      const querySnapshot = await getDocs(q);
      const meals = [];

      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });

      // Sort by created_at in memory instead of in the query
      meals.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA; // Descending order (newest first)
      });

      return meals;
    } catch (error) {
      // Silently fail on permission errors (happens during hot reload before auth completes)
      if (error.code === 'permission-denied') {
        return [];
      }
      console.error('Error getting meals by date:', error);
      return [];
    }
  }

  // Get all meals from Firebase (with limit)
  async getAllMeals(userId, limitCount = 100) {
    try {
      if (!userId || userId === 'guest') {
        throw new Error('User not authenticated');
      }

      const mealsRef = collection(db, 'users', userId, 'meals');
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

        return [];
      }

      const cloudMeals = await this.getAllMeals(userId);


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

        return { uploaded: 0, failed: 0 };
      }

      if (!dailySummary || dailySummary.length === 0) {

        return { uploaded: 0, failed: 0 };
      }



      const batch = writeBatch(db);
      let uploadedCount = 0;

      for (const meal of dailySummary) {
        try {
          const mealRef = doc(
            collection(db, 'users', userId, 'meals')
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

        return { uploaded: 0, failed: 0 };
      }

      // Get today's summary from local storage
      const todaySummary = await getDailySummary(userId);

      if (!todaySummary || todaySummary.length === 0) {

        return { uploaded: 0, failed: 0 };
      }

      // Upload to Firebase
      const result = await this.uploadLocalMeals(userId, todaySummary);


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

        return null;
      }

      const cloudId = await this.uploadDailyConsumption(userId, mealEntry);


      return cloudId;
    } catch (error) {
      console.error('Error syncing meal entry:', error);
      throw error;
    }
  }

  // Migrate AsyncStorage meals to Firebase (one-time migration)
  async migrateAsyncStorageMeals(userId) {
    try {
      if (!userId || userId === 'guest') {

        return { migrated: 0, failed: 0 };
      }

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;



      // Get today's meals from AsyncStorage
      const savedNutrition = await AsyncStorage.getItem('@daily_nutrition');
      if (!savedNutrition) {

        return { migrated: 0, failed: 0 };
      }

      const nutritionData = JSON.parse(savedNutrition);
      const mealsObj = nutritionData.meals || {};
      const today = new Date().toISOString().split('T')[0];

      // Convert meals object to consumption entries
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
      let migrated = 0;
      let failed = 0;

      for (const mealType of mealTypes) {
        const mealItems = mealsObj[mealType] || [];

        for (const foodItem of mealItems) {
          try {
            const consumptionEntry = {
              date: today,
              meal_type: mealType,
              food_name: foodItem.name || 'Unknown food',
              food_brand: foodItem.brand || '',
              quantity_grams: foodItem.quantity || 100,
              calories_consumed: foodItem.calories || 0,
              protein_consumed: foodItem.protein || 0,
              carbs_consumed: foodItem.carbs || 0,
              fat_consumed: foodItem.fat || 0,
              created_at: new Date().toISOString(),
            };

            await this.uploadDailyConsumption(userId, consumptionEntry);
            migrated++;

          } catch (error) {
            console.error(`❌ Failed to migrate: ${foodItem.name}`, error);
            failed++;
          }
        }
      }


      return { migrated, failed };
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  // Delete a single meal entry from Firebase
  async deleteMeal(userId, mealId) {
    try {
      if (!userId || userId === 'guest') {

        return { success: true };
      }

      if (!mealId) {
        throw new Error('Meal ID is required');
      }

      const { deleteDoc, doc } = await import('firebase/firestore');
      const mealRef = doc(db, 'users', userId, 'meals', mealId);
      await deleteDoc(mealRef);


      return { success: true };
    } catch (error) {
      console.error('Error deleting meal from Firebase:', error);
      throw error;
    }
  }

  // Update a single meal entry in Firebase
  async updateMeal(userId, mealId, updatedData) {
    try {
      if (!userId || userId === 'guest') {

        return { success: true };
      }

      if (!mealId) {
        throw new Error('Meal ID is required');
      }

      const { updateDoc, doc } = await import('firebase/firestore');
      const mealRef = doc(db, 'users', userId, 'meals', mealId);

      const updatePayload = {
        ...updatedData,
        syncedAt: new Date().toISOString(),
      };

      await updateDoc(mealRef, updatePayload);


      return { success: true };
    } catch (error) {
      console.error('Error updating meal in Firebase:', error);
      throw error;
    }
  }
}

export default new MealSyncService();
