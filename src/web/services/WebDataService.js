// WebDataService - Fetches user data from Firestore for web dashboard
import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

// Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Initialize Firebase for web
let db = null;
if (Platform.OS === 'web') {
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error in WebDataService:', error);
  }
}

// Helper function to get local date string
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to extract local date from various formats (fixes timezone offset issues)
const extractLocalDate = (dateValue) => {
  if (!dateValue) return null;

  // If it's a Firestore Timestamp object
  if (dateValue && typeof dateValue.toDate === 'function') {
    const d = dateValue.toDate();
    return getLocalDateString(d);
  }

  // If it's a plain date string like "2024-10-04" (no time component)
  // Return as-is - this is the intended local date
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  // If it's an ISO string with UTC timezone (ends with Z), parse it to get LOCAL date
  // e.g., "2024-12-17T04:00:00.000Z" in EST should return "2024-12-16"
  if (typeof dateValue === 'string' && dateValue.includes('T') && dateValue.includes('Z')) {
    const d = new Date(dateValue);
    return getLocalDateString(d);
  }

  // If it's an ISO string WITHOUT Z (local time), just extract the date part
  // e.g., "2024-12-16T23:00:00" should return "2024-12-16"
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0];
  }

  // If it's a Date object
  if (dateValue instanceof Date) {
    return getLocalDateString(dateValue);
  }

  // If it's a number (timestamp in ms)
  if (typeof dateValue === 'number') {
    return getLocalDateString(new Date(dateValue));
  }

  // Fallback - try to use as string
  return String(dateValue);
};

class WebDataService {
  // ========================================
  // USER PROFILE
  // ========================================

  async getUserProfile(userId) {
    try {
      if (!userId || !db) return null;

      // Get main user profile
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // Get assessment profile
      const assessmentRef = doc(db, 'userProfiles', userId);
      const assessmentDoc = await getDoc(assessmentRef);

      const baseProfile = userDoc.exists() ? userDoc.data() : {};
      const assessmentProfile = assessmentDoc.exists() ? assessmentDoc.data() : {};

      return {
        ...baseProfile,
        ...assessmentProfile,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // ========================================
  // WORKOUTS
  // ========================================

  async getWorkouts(userId, limitCount = 50) {
    try {
      if (!userId || !db) {
        console.log('🔍 WebDataService: No userId or db', { userId, hasDb: !!db });
        return [];
      }

      console.log('🔍 WebDataService: Fetching workouts for user:', userId);
      const workoutsRef = collection(db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 Workout found:', doc.id);
        console.log('  - date:', data.date);
        console.log('  - name:', data.workoutTitle || data.name || data.workoutType);
        console.log('  - exercises:', JSON.stringify(data.exercises?.slice(0, 2), null, 2));
        workouts.push({ id: doc.id, ...data });
      });

      console.log('🔍 WebDataService: Total workouts fetched:', workouts.length);
      return workouts;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  }

  async getWorkoutStats(userId) {
    try {
      const workouts = await this.getWorkouts(userId, 100);

      if (workouts.length === 0) {
        return {
          totalWorkouts: 0,
          thisWeek: 0,
          thisMonth: 0,
          totalVolume: 0,
          avgDuration: 0,
          favoriteExercise: null,
          streak: 0,
        };
      }

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeek = workouts.filter(w => new Date(w.date) >= weekAgo).length;
      const thisMonth = workouts.filter(w => new Date(w.date) >= monthAgo).length;

      // Calculate total volume
      let totalVolume = 0;
      const exerciseCounts = {};

      workouts.forEach(workout => {
        if (workout.exercises) {
          workout.exercises.forEach(exercise => {
            // Count exercises
            exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;

            // Calculate volume
            if (exercise.sets) {
              exercise.sets.forEach(set => {
                if (set.weight && set.reps) {
                  totalVolume += set.weight * set.reps;
                }
              });
            }
          });
        }
      });

      // Find favorite exercise
      let favoriteExercise = null;
      let maxCount = 0;
      Object.entries(exerciseCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteExercise = name;
        }
      });

      // Calculate average duration
      const durations = workouts
        .filter(w => w.duration)
        .map(w => w.duration);
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // Calculate streak
      let streak = 0;
      const sortedDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
      const today = getLocalDateString();

      for (let i = 0; i < sortedDates.length; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateStr = getLocalDateString(checkDate);

        if (sortedDates.includes(checkDateStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      return {
        totalWorkouts: workouts.length,
        thisWeek,
        thisMonth,
        totalVolume: Math.round(totalVolume),
        avgDuration,
        favoriteExercise,
        streak,
      };
    } catch (error) {
      console.error('Error calculating workout stats:', error);
      return null;
    }
  }

  // ========================================
  // NUTRITION / MEALS
  // ========================================

  async getMeals(userId, limitCount = 100) {
    try {
      if (!userId || !db) return [];

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
      console.error('Error fetching meals:', error);
      return [];
    }
  }

  async getMealsByDate(userId, date) {
    try {
      if (!userId || !db) return [];

      const dateString = typeof date === 'string' ? date : getLocalDateString(date);
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

      // Sort by time
      meals.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      return meals;
    } catch (error) {
      console.error('Error fetching meals by date:', error);
      return [];
    }
  }

  async getNutritionStats(userId, days = 7) {
    try {
      const meals = await this.getMeals(userId, 500);

      if (meals.length === 0) {
        return {
          avgCalories: 0,
          avgProtein: 0,
          avgCarbs: 0,
          avgFat: 0,
          todayCalories: 0,
          todayProtein: 0,
          dailyData: [],
        };
      }

      const today = getLocalDateString();

      // Group meals by date
      const mealsByDate = {};
      meals.forEach(meal => {
        const date = meal.date;
        if (!mealsByDate[date]) {
          mealsByDate[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        mealsByDate[date].calories += meal.calories_consumed || meal.calories || 0;
        mealsByDate[date].protein += meal.protein_consumed || meal.protein || 0;
        mealsByDate[date].carbs += meal.carbs_consumed || meal.carbs || 0;
        mealsByDate[date].fat += meal.fat_consumed || meal.fat || 0;
      });

      // Get last N days
      const dailyData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateString(date);

        dailyData.push({
          date: dateStr,
          ...mealsByDate[dateStr] || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        });
      }

      dailyData.reverse();

      // Calculate averages (excluding zero days)
      const daysWithData = Object.values(mealsByDate).filter(d => d.calories > 0);
      const count = daysWithData.length || 1;

      const totals = daysWithData.reduce((acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const todayData = mealsByDate[today] || { calories: 0, protein: 0, carbs: 0, fat: 0 };

      return {
        avgCalories: Math.round(totals.calories / count),
        avgProtein: Math.round(totals.protein / count),
        avgCarbs: Math.round(totals.carbs / count),
        avgFat: Math.round(totals.fat / count),
        todayCalories: Math.round(todayData.calories),
        todayProtein: Math.round(todayData.protein),
        todayCarbs: Math.round(todayData.carbs),
        todayFat: Math.round(todayData.fat),
        dailyData,
      };
    } catch (error) {
      console.error('Error calculating nutrition stats:', error);
      return null;
    }
  }

  // ========================================
  // PROGRESS
  // ========================================

  async getProgress(userId, limitCount = 50) {
    try {
      if (!userId || !db) return [];

      const progressRef = collection(db, 'users', userId, 'progress');
      const q = query(
        progressRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const progress = [];

      querySnapshot.forEach((doc) => {
        progress.push({ id: doc.id, ...doc.data() });
      });

      return progress;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    }
  }

  // ========================================
  // GOALS
  // ========================================

  async getGoals(userId) {
    try {
      if (!userId || !db) return null;

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return data.goals || null;
      }

      return null;
    } catch (error) {
      console.error('Error fetching goals:', error);
      return null;
    }
  }

  // ========================================
  // ACHIEVEMENTS
  // ========================================

  async getAchievements(userId) {
    try {
      if (!userId || !db) return [];

      const achievementsRef = collection(db, 'users', userId, 'achievements');
      const querySnapshot = await getDocs(achievementsRef);
      const achievements = [];

      querySnapshot.forEach((doc) => {
        achievements.push({ id: doc.id, ...doc.data() });
      });

      return achievements;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  // ========================================
  // CALENDAR DATA
  // ========================================

  async getWorkoutCalendarData(userId, year, month) {
    try {
      if (!userId || !db) return {};

      const workouts = await this.getWorkouts(userId, 200);
      const calendarData = {};

      workouts.forEach(workout => {
        const date = extractLocalDate(workout.date);
        if (date) {
          if (!calendarData[date]) {
            calendarData[date] = [];
          }
          calendarData[date].push(workout);
        }
      });

      return calendarData;
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      return {};
    }
  }

  async getNutritionCalendarData(userId) {
    try {
      if (!userId || !db) return {};

      const meals = await this.getMeals(userId, 500);
      const calendarData = {};

      meals.forEach(meal => {
        const date = extractLocalDate(meal.date);
        if (date) {
          if (!calendarData[date]) {
            calendarData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] };
          }
          calendarData[date].calories += meal.calories_consumed || meal.calories || 0;
          calendarData[date].protein += meal.protein_consumed || meal.protein || 0;
          calendarData[date].carbs += meal.carbs_consumed || meal.carbs || 0;
          calendarData[date].fat += meal.fat_consumed || meal.fat || 0;
          calendarData[date].meals.push(meal);
        }
      });

      return calendarData;
    } catch (error) {
      console.error('Error fetching nutrition calendar data:', error);
      return {};
    }
  }

  // ========================================
  // EXERCISE PROGRESS
  // ========================================

  async getExerciseProgress(userId) {
    try {
      if (!userId || !db) return {};

      const workouts = await this.getWorkouts(userId, 200);
      const exerciseProgress = {};

      workouts.forEach(workout => {
        if (workout.exercises) {
          workout.exercises.forEach(exercise => {
            const name = exercise.name;
            if (!exerciseProgress[name]) {
              exerciseProgress[name] = {
                name,
                records: [],
                maxWeight: 0,
                maxReps: 0,
                totalVolume: 0,
              };
            }

            if (exercise.sets) {
              exercise.sets.forEach(set => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;

                if (weight > 0 && reps > 0) {
                  exerciseProgress[name].records.push({
                    date: workout.date,
                    weight,
                    reps,
                    volume: weight * reps,
                  });

                  if (weight > exerciseProgress[name].maxWeight) {
                    exerciseProgress[name].maxWeight = weight;
                  }
                  if (reps > exerciseProgress[name].maxReps) {
                    exerciseProgress[name].maxReps = reps;
                  }
                  exerciseProgress[name].totalVolume += weight * reps;
                }
              });
            }
          });
        }
      });

      // Sort records by date for each exercise
      Object.values(exerciseProgress).forEach(exercise => {
        exercise.records.sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      return exerciseProgress;
    } catch (error) {
      console.error('Error calculating exercise progress:', error);
      return {};
    }
  }

  // ========================================
  // STREAK CALCULATION
  // ========================================

  calculateStreak(dates, type = 'workout') {
    if (!dates || dates.length === 0) return { current: 0, longest: 0 };

    const sortedDates = [...new Set(dates)].sort().reverse();
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check if most recent activity is today or yesterday
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      // Count consecutive days
      for (let i = 0; i < sortedDates.length; i++) {
        const date = new Date(sortedDates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);

        if (sortedDates[i] === getLocalDateString(expectedDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round((prevDate - currDate) / 86400000);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { current: currentStreak, longest: longestStreak };
  }

  // ========================================
  // COMPREHENSIVE STATS
  // ========================================

  async getComprehensiveStats(userId) {
    try {
      const [workouts, meals, profile, goals, achievements] = await Promise.all([
        this.getWorkouts(userId, 200),
        this.getMeals(userId, 500),
        this.getUserProfile(userId),
        this.getGoals(userId),
        this.getAchievements(userId),
      ]);

      // Workout stats - use extractLocalDate to handle timezone issues
      const workoutDates = workouts.map(w => extractLocalDate(w.date)).filter(Boolean);
      const workoutStreak = this.calculateStreak(workoutDates);

      // Calculate PRs
      const prs = {};
      workouts.forEach(workout => {
        if (workout.exercises) {
          workout.exercises.forEach(exercise => {
            const name = exercise.name;
            if (!prs[name]) prs[name] = { weight: 0, reps: 0 };
            if (exercise.sets) {
              exercise.sets.forEach(set => {
                if (set.weight > prs[name].weight) prs[name].weight = set.weight;
                if (set.reps > prs[name].reps) prs[name].reps = set.reps;
              });
            }
          });
        }
      });

      // Nutrition stats - use extractLocalDate to handle timezone issues
      const nutritionByDate = {};
      meals.forEach(meal => {
        const date = extractLocalDate(meal.date);
        if (!date) return;
        if (!nutritionByDate[date]) {
          nutritionByDate[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        nutritionByDate[date].calories += meal.calories_consumed || meal.calories || 0;
        nutritionByDate[date].protein += meal.protein_consumed || meal.protein || 0;
        nutritionByDate[date].carbs += meal.carbs_consumed || meal.carbs || 0;
        nutritionByDate[date].fat += meal.fat_consumed || meal.fat || 0;
      });

      const nutritionDates = Object.keys(nutritionByDate);
      const nutritionStreak = this.calculateStreak(nutritionDates);

      // Calculate averages
      const daysWithNutrition = Object.values(nutritionByDate).filter(d => d.calories > 0);
      const avgNutrition = daysWithNutrition.length > 0 ? {
        calories: Math.round(daysWithNutrition.reduce((a, b) => a + b.calories, 0) / daysWithNutrition.length),
        protein: Math.round(daysWithNutrition.reduce((a, b) => a + b.protein, 0) / daysWithNutrition.length),
        carbs: Math.round(daysWithNutrition.reduce((a, b) => a + b.carbs, 0) / daysWithNutrition.length),
        fat: Math.round(daysWithNutrition.reduce((a, b) => a + b.fat, 0) / daysWithNutrition.length),
      } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      return {
        workouts: {
          total: workouts.length,
          currentStreak: workoutStreak.current,
          longestStreak: workoutStreak.longest,
          thisWeek: workouts.filter(w => {
            const d = new Date(w.date);
            const weekAgo = new Date(Date.now() - 7 * 86400000);
            return d >= weekAgo;
          }).length,
          thisMonth: workouts.filter(w => {
            const d = new Date(w.date);
            const monthAgo = new Date(Date.now() - 30 * 86400000);
            return d >= monthAgo;
          }).length,
          prs: Object.entries(prs).slice(0, 5).map(([name, data]) => ({ name, ...data })),
          list: workouts, // Full workouts array for detail views
        },
        nutrition: {
          currentStreak: nutritionStreak.current,
          longestStreak: nutritionStreak.longest,
          avgCalories: avgNutrition.calories,
          avgProtein: avgNutrition.protein,
          avgCarbs: avgNutrition.carbs,
          avgFat: avgNutrition.fat,
          todayCalories: nutritionByDate[getLocalDateString()]?.calories || 0,
          todayProtein: nutritionByDate[getLocalDateString()]?.protein || 0,
          todayCarbs: nutritionByDate[getLocalDateString()]?.carbs || 0,
          todayFat: nutritionByDate[getLocalDateString()]?.fat || 0,
          byDate: nutritionByDate,
        },
        profile,
        goals,
        achievements,
        workoutDates,
        nutritionDates,
      };
    } catch (error) {
      console.error('Error fetching comprehensive stats:', error);
      return null;
    }
  }

  // ========================================
  // SAVE IMPORTED CONTENT
  // ========================================

  /**
   * Save an imported workout program to Firebase
   * @param {string} userId - User ID
   * @param {Object} program - Program data with days and exercises
   * @returns {Promise<Object>} Result with success status and ID
   */
  async saveWorkoutProgram(userId, program) {
    try {
      if (!userId || !db) {
        throw new Error('User not authenticated or database not available');
      }

      const programData = {
        ...program,
        id: program.id || `imported_${Date.now()}`,
        userId,
        source: 'web_import',
        importedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isImported: true,
      };

      // Save to user's workout_programs collection
      const programRef = doc(collection(db, 'users', userId, 'workout_programs'));
      await setDoc(programRef, {
        ...programData,
        id: programRef.id,
      });

      console.log('✅ Workout program saved to Firebase:', programRef.id);

      return {
        success: true,
        id: programRef.id,
        message: `Program "${program.name}" saved successfully!`,
      };
    } catch (error) {
      console.error('Error saving workout program:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to save workout program. Please try again.',
      };
    }
  }

  /**
   * Save an imported standalone workout to Firebase
   * @param {string} userId - User ID
   * @param {Object} workout - Single workout data with exercises
   * @returns {Promise<Object>} Result with success status and ID
   */
  async saveStandaloneWorkout(userId, workout) {
    try {
      if (!userId || !db) {
        throw new Error('User not authenticated or database not available');
      }

      // Structure workout data to match app's expected format
      // App expects: { name, day: { exercises: [...] } }
      const workoutData = {
        id: workout.id || `imported_${Date.now()}`,
        name: workout.name || 'Imported Workout',
        description: workout.description || '',
        userId,
        source: 'web_import',
        importedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isImported: true,
        isStandalone: true,
        // Wrap exercises in 'day' object as app expects
        day: {
          name: workout.name || 'Imported Workout',
          exercises: workout.exercises || [],
          muscleGroups: workout.muscleGroups || [],
        },
        difficulty: workout.difficulty || 'intermediate',
      };

      // Save to user's standalone_workouts collection
      const workoutRef = doc(collection(db, 'users', userId, 'standalone_workouts'));
      await setDoc(workoutRef, {
        ...workoutData,
        id: workoutRef.id,
      });

      console.log('✅ Standalone workout saved to Firebase:', workoutRef.id);

      return {
        success: true,
        id: workoutRef.id,
        message: `Workout "${workout.name}" saved successfully!`,
      };
    } catch (error) {
      console.error('Error saving standalone workout:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to save workout. Please try again.',
      };
    }
  }

  /**
   * Save an imported recipe to Firebase
   * @param {string} userId - User ID
   * @param {Object} recipe - Recipe data
   * @returns {Promise<Object>} Result with success status and ID
   */
  async saveRecipe(userId, recipe) {
    try {
      if (!userId || !db) {
        throw new Error('User not authenticated or database not available');
      }

      const recipeData = {
        ...recipe,
        id: recipe.id || `imported_${Date.now()}`,
        userId,
        source: 'web_import',
        importedAt: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        isImported: true,
      };

      // Save to user's saved_recipes collection
      const recipeRef = doc(collection(db, 'users', userId, 'saved_recipes'));
      await setDoc(recipeRef, {
        ...recipeData,
        id: recipeRef.id,
      });

      console.log('✅ Recipe saved to Firebase:', recipeRef.id);

      return {
        success: true,
        id: recipeRef.id,
        message: `Recipe "${recipe.name}" saved successfully!`,
      };
    } catch (error) {
      console.error('Error saving recipe:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to save recipe. Please try again.',
      };
    }
  }

  /**
   * Get saved workout programs for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of programs
   */
  async getWorkoutPrograms(userId) {
    try {
      if (!userId || !db) return [];

      const programsRef = collection(db, 'users', userId, 'workout_programs');
      const q = query(programsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const programs = [];
      querySnapshot.forEach((doc) => {
        programs.push({ id: doc.id, ...doc.data() });
      });

      return programs;
    } catch (error) {
      console.error('Error fetching workout programs:', error);
      return [];
    }
  }

  /**
   * Get saved standalone workouts for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of workouts
   */
  async getStandaloneWorkouts(userId) {
    try {
      if (!userId || !db) return [];

      const workoutsRef = collection(db, 'users', userId, 'standalone_workouts');
      const q = query(workoutsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const workouts = [];
      querySnapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });

      return workouts;
    } catch (error) {
      console.error('Error fetching standalone workouts:', error);
      return [];
    }
  }

  /**
   * Get saved recipes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of recipes
   */
  async getSavedRecipes(userId) {
    try {
      if (!userId || !db) return [];

      const recipesRef = collection(db, 'users', userId, 'saved_recipes');
      const q = query(recipesRef, orderBy('savedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const recipes = [];
      querySnapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() });
      });

      return recipes;
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      return [];
    }
  }

  /**
   * Delete a workout from history
   * @param {string} userId - User ID
   * @param {string} workoutId - Workout ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteWorkout(userId, workoutId) {
    try {
      if (!userId || !workoutId || !db) {
        console.error('Missing userId, workoutId, or db not initialized');
        return false;
      }

      const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
      await deleteDoc(workoutRef);
      console.log('✅ Workout deleted from Firebase:', workoutId);
      return true;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }
}

export default new WebDataService();
