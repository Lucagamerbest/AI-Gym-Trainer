import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  WORKOUT_HISTORY: 'workout_history',
  EXERCISE_PROGRESS: 'exercise_progress',
  USER_STATS: 'user_stats',
  PLANNED_WORKOUTS: 'planned_workouts',
  GOALS: 'goals',
  ACHIEVEMENTS: 'achievements'
};

export class WorkoutStorageService {
  // Save a completed workout with detailed exercise sets
  static async saveWorkout(workoutData, exerciseSets, userId = 'guest') {
    try {
      const workout = {
        id: Date.now().toString(),
        userId,
        date: new Date().toISOString(),
        startTime: workoutData.startTime,
        endTime: workoutData.endTime,
        duration: workoutData.duration,
        workoutTitle: workoutData.workoutTitle || 'Quick Workout',
        workoutType: workoutData.workoutType || 'quick', // 'program', 'standalone', 'quick'
        notes: workoutData.notes || '',
        photos: workoutData.photos || [], // Array of base64 strings
        exercises: workoutData.exercises.map((exercise, index) => {
          const setsForExercise = exerciseSets[index] || [];

          return {
            ...exercise,
            sets: setsForExercise,
            completedSets: setsForExercise.length, // All sets are considered completed
            totalSets: setsForExercise.length
          };
        })
      };

      // Save to workout history (local)
      const history = await this.getWorkoutHistory(userId);
      history.push(workout);
      await AsyncStorage.setItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`, JSON.stringify(history));

      // Sync to Firebase if user is logged in
      if (userId && userId !== 'guest' && db) {
        try {
          const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
          await setDoc(workoutRef, {
            ...workout,
            syncedAt: new Date().toISOString(),
          });
          console.log('✅ Workout synced to Firebase:', workout.id);
        } catch (firebaseError) {
          console.warn('⚠️ Firebase sync failed (will retry later):', firebaseError.message);
        }
      }

      // Update exercise progress for each exercise
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        if (exercise.sets && exercise.sets.length > 0) {
          await this.updateExerciseProgress(exercise, userId, workout.id);
        }
      }

      // Update user stats
      await this.updateUserStats(workout, userId);

      return { success: true, workoutId: workout.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get workout history for a user
  // Note: Firebase sync happens via WorkoutSyncService on login, not here
  // This keeps getWorkoutHistory fast and crash-free
  static async getWorkoutHistory(userId = 'guest') {
    try {
      const localHistory = await AsyncStorage.getItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`);
      let history = localHistory ? JSON.parse(localHistory) : [];

      // CRITICAL: Filter out invalid/corrupted workouts to prevent crashes
      // Some workouts from Firebase may have missing required fields
      history = history.filter(workout => {
        // Must be an object
        if (!workout || typeof workout !== 'object') return false;
        // Must have a valid date
        if (!workout.date) return false;
        // Ensure exercises is at least an empty array
        if (!workout.exercises) workout.exercises = [];
        // Ensure exercises is actually an array
        if (!Array.isArray(workout.exercises)) workout.exercises = [];
        // Filter out any null/undefined exercises inside the array
        workout.exercises = workout.exercises.filter(ex => ex && typeof ex === 'object');
        // Ensure each exercise has required fields
        workout.exercises.forEach(ex => {
          if (!ex.name) ex.name = 'Unknown Exercise';
          if (!ex.sets) ex.sets = [];
          if (!Array.isArray(ex.sets)) ex.sets = [];
          // Filter out invalid sets
          ex.sets = ex.sets.filter(set => set && typeof set === 'object');
        });
        return true;
      });

      // Sort by date (most recent first)
      history.sort((a, b) => {
        try {
          return new Date(b.date) - new Date(a.date);
        } catch (e) {
          return 0;
        }
      });

      return history;
    } catch (error) {
      console.error('Error loading workout history:', error);
      return [];
    }
  }

  // Sync all local workouts to Firebase (for past workouts that weren't synced)
  static async syncAllWorkoutsToFirebase(userId) {
    if (!userId || userId === 'guest' || !db) {
      return { success: false, message: 'User not logged in' };
    }

    try {
      // Get workouts from user's storage
      let history = await this.getWorkoutHistory(userId);
      console.log(`📊 Found ${history.length} workouts for user ${userId}`);

      // Also check guest storage and migrate those workouts
      const guestHistory = await this.getWorkoutHistory('guest');
      if (guestHistory.length > 0) {
        console.log(`📊 Found ${guestHistory.length} guest workouts to migrate`);
        history = [...history, ...guestHistory];

        // Move guest workouts to user storage
        const userHistory = await this.getWorkoutHistory(userId);
        const mergedHistory = [...userHistory];
        for (const guestWorkout of guestHistory) {
          // Check if workout already exists (by id)
          if (!mergedHistory.find(w => w.id === guestWorkout.id)) {
            mergedHistory.push({ ...guestWorkout, userId });
          }
        }
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`,
          JSON.stringify(mergedHistory)
        );
        // Clear guest storage after migration
        await AsyncStorage.removeItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_guest`);
        console.log('✅ Migrated guest workouts to user account');
      }

      let synced = 0;
      let failed = 0;

      for (const workout of history) {
        try {
          const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
          await setDoc(workoutRef, {
            ...workout,
            userId, // Ensure userId is set
            syncedAt: new Date().toISOString(),
          });
          synced++;
        } catch (error) {
          console.warn('Failed to sync workout:', workout.id, error.message);
          failed++;
        }
      }

      console.log(`✅ Synced ${synced} workouts to Firebase (${failed} failed)`);
      return { success: true, synced, failed, total: history.length };
    } catch (error) {
      console.error('Error syncing workouts:', error);
      return { success: false, error: error.message };
    }
  }

  // Update progress for a specific exercise
  static async updateExerciseProgress(exerciseData, userId = 'guest', workoutId = null) {
    try {
      const progress = await this.getExerciseProgress(userId);
      const exerciseKey = exerciseData.name.toLowerCase().replace(/\s+/g, '_');

      if (!progress[exerciseKey]) {
        progress[exerciseKey] = {
          name: exerciseData.name,
          equipment: exerciseData.equipment,
          records: []
        };
      }

      // Add new records from all sets with weight and reps data
      const validSets = exerciseData.sets.filter(set => set.weight && set.reps);

      validSets.forEach((set, setIndex) => {
        progress[exerciseKey].records.push({
          date: new Date().toISOString(),
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
          volume: (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0),
          workoutId: workoutId, // Include workout ID for linking
          setIndex: setIndex, // Track which set number this was
          comment: set.comment || null // Include any comment on this set
        });
      });

      // Sort records by date
      progress[exerciseKey].records.sort((a, b) => new Date(a.date) - new Date(b.date));

      await AsyncStorage.setItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`, JSON.stringify(progress));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get progress for all exercises
  static async getExerciseProgress(userId = 'guest') {
    try {
      const progress = await AsyncStorage.getItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`);
      return progress ? JSON.parse(progress) : {};
    } catch (error) {
      return {};
    }
  }

  // Get progress for a specific exercise (with fuzzy matching for variant names)
  static async getExerciseProgressByName(exerciseName, userId = 'guest') {
    try {
      const allProgress = await this.getExerciseProgress(userId);
      const searchKey = exerciseName.toLowerCase().replace(/\s+/g, '_');

      // Try exact match first
      if (allProgress[searchKey]) {
        return allProgress[searchKey];
      }

      // Try fuzzy matching - handles cases like:
      // - "Leg Extension" matching "machine_leg_extension_(machine)"
      // - "Machine Leg Extension (Machine)" matching "leg_extension"
      const allKeys = Object.keys(allProgress);
      for (const key of allKeys) {
        // Check if either contains the other
        if (key.includes(searchKey) || searchKey.includes(key)) {
          return allProgress[key];
        }
        // Also check without parenthetical suffixes and equipment prefixes
        const cleanKey = key.replace(/\([^)]*\)/g, '').replace(/_+/g, '_').replace(/^(machine|barbell|dumbbell|cable|bodyweight|kettlebell|ez_bar|smith_machine)_/i, '').replace(/_$/, '');
        const cleanSearch = searchKey.replace(/\([^)]*\)/g, '').replace(/_+/g, '_').replace(/^(machine|barbell|dumbbell|cable|bodyweight|kettlebell|ez_bar|smith_machine)_/i, '').replace(/_$/, '');
        if (cleanKey === cleanSearch || cleanKey.includes(cleanSearch) || cleanSearch.includes(cleanKey)) {
          return allProgress[key];
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Get previous comments for a specific exercise (most recent first)
  static async getExerciseComments(exerciseName, userId = 'guest', limit = 10) {
    try {
      const progress = await this.getExerciseProgressByName(exerciseName, userId);
      if (!progress || !progress.records) return [];

      // Filter records that have comments and sort by date (most recent first)
      const recordsWithComments = progress.records
        .filter(record => record.comment && record.comment.trim().length > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)
        .map(record => ({
          date: record.date,
          weight: record.weight,
          reps: record.reps,
          setIndex: record.setIndex,
          comment: record.comment
        }));

      return recordsWithComments;
    } catch (error) {
      return [];
    }
  }

  // Get the PR (Personal Record - highest weight) for an exercise
  static async getExercisePR(exerciseName, userId = 'guest') {
    try {
      const progress = await this.getExerciseProgressByName(exerciseName, userId);
      if (!progress || !progress.records || progress.records.length === 0) return null;

      // Find the record with the highest weight
      let pr = null;
      let maxWeight = 0;

      for (const record of progress.records) {
        const weight = parseFloat(record.weight) || 0;
        if (weight > maxWeight) {
          maxWeight = weight;
          pr = {
            weight: record.weight,
            reps: record.reps,
            date: record.date,
            volume: record.volume,
            workoutId: record.workoutId
          };
        }
      }

      return pr;
    } catch (error) {
      return null;
    }
  }

  // Get a specific workout by ID
  static async getWorkoutById(workoutId, userId = 'guest') {
    try {
      const history = await this.getWorkoutHistory(userId);
      return history.find(w => w.id === workoutId) || null;
    } catch (error) {
      return null;
    }
  }

  // Get the last workout's sets for an exercise (returns array indexed by set number)
  static async getLastExerciseSets(exerciseName, userId = 'guest') {
    try {
      const progress = await this.getExerciseProgressByName(exerciseName, userId);
      if (!progress || !progress.records || progress.records.length === 0) return [];

      // Sort records by date (most recent first)
      const sortedRecords = [...progress.records].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Get the most recent workout ID
      const lastWorkoutId = sortedRecords[0]?.workoutId;
      if (!lastWorkoutId) {
        // If no workoutId, fallback to getting the most recent records by date
        // Group by the same date (within same minute to account for slight time differences)
        const lastDate = new Date(sortedRecords[0].date);
        const lastDateRecords = sortedRecords.filter(record => {
          const recordDate = new Date(record.date);
          return Math.abs(recordDate - lastDate) < 60000; // Within 1 minute
        });

        // Create array indexed by set number
        const lastSets = [];
        lastDateRecords.forEach(record => {
          const setIdx = record.setIndex ?? lastSets.length;
          lastSets[setIdx] = {
            weight: record.weight,
            reps: record.reps,
            comment: record.comment || null,
            date: record.date
          };
        });
        return lastSets;
      }

      // Get all records from the last workout
      const lastWorkoutRecords = sortedRecords.filter(record => record.workoutId === lastWorkoutId);

      // Create array indexed by set number
      const lastSets = [];
      lastWorkoutRecords.forEach(record => {
        const setIdx = record.setIndex ?? lastSets.length;
        lastSets[setIdx] = {
          weight: record.weight,
          reps: record.reps,
          comment: record.comment || null,
          date: record.date
        };
      });

      return lastSets;
    } catch (error) {
      return [];
    }
  }

  // Update user stats (total workouts, streak, etc.)
  static async updateUserStats(workout, userId = 'guest') {
    try {
      const stats = await this.getUserStats(userId);

      stats.totalWorkouts = (stats.totalWorkouts || 0) + 1;
      stats.totalExercises = (stats.totalExercises || 0) + workout.exercises.length;
      stats.lastWorkoutDate = workout.date;

      // Calculate streak
      const today = new Date().toDateString();
      const workoutDate = new Date(workout.date).toDateString();

      if (workoutDate === today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (stats.lastStreakDate === yesterdayStr || !stats.lastStreakDate) {
          stats.currentStreak = (stats.currentStreak || 0) + 1;
        } else if (stats.lastStreakDate !== today) {
          stats.currentStreak = 1;
        }
        stats.lastStreakDate = today;
      }

      // Calculate total volume from all sets with weight and reps
      const workoutVolume = workout.exercises.reduce((total, exercise) => {
        return total + (exercise.sets || []).reduce((exerciseTotal, set) => {
          if (set.weight && set.reps) {
            return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps));
          }
          return exerciseTotal;
        }, 0);
      }, 0);

      stats.totalVolume = (stats.totalVolume || 0) + workoutVolume;

      await AsyncStorage.setItem(`${STORAGE_KEYS.USER_STATS}_${userId}`, JSON.stringify(stats));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user stats
  static async getUserStats(userId = 'guest') {
    try {
      const stats = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_STATS}_${userId}`);
      return stats ? JSON.parse(stats) : {
        totalWorkouts: 0,
        totalExercises: 0,
        currentStreak: 0,
        totalVolume: 0,
        lastWorkoutDate: null,
        lastStreakDate: null
      };
    } catch (error) {
      return {
        totalWorkouts: 0,
        totalExercises: 0,
        currentStreak: 0,
        totalVolume: 0,
        lastWorkoutDate: null,
        lastStreakDate: null
      };
    }
  }

  // Get exercise data for charts (last 30 days)
  static async getExerciseChartData(exerciseName, userId = 'guest', days = 30) {
    try {
      const progress = await this.getExerciseProgressByName(exerciseName, userId);
      if (!progress || !progress.records) return [];

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return progress.records
        .filter(record => new Date(record.date) >= cutoffDate)
        .map(record => ({
          date: new Date(record.date).toLocaleDateString(),
          weight: record.weight,
          reps: record.reps,
          volume: record.volume
        }));
    } catch (error) {
      return [];
    }
  }

  // Clear all data (for testing/reset)
  static async clearAllData(userId = 'guest') {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`);
      await AsyncStorage.removeItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`);
      await AsyncStorage.removeItem(`${STORAGE_KEYS.USER_STATS}_${userId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Seed comprehensive test data with multiple exercises to showcase chart features
  static async seedBenchPressTestData(userId = 'guest') {
    try {
      // Clear existing data first
      await this.clearAllData(userId);

      const workoutHistory = [];
      const exerciseProgress = {
        bench_press: {
          name: 'Bench Press',
          equipment: 'barbell',
          records: []
        },
        squat: {
          name: 'Squat',
          equipment: 'barbell',
          records: []
        },
        deadlift: {
          name: 'Deadlift',
          equipment: 'barbell',
          records: []
        }
      };

      // Generate unique base timestamp
      const baseTime = Date.now();

      // Workout data - shows progression with ups and downs
      const workoutData = [
        // Day 14 - Starting point
        {
          daysAgo: 14,
          title: 'Push Day - Week 1',
          exercises: [
            { name: 'Bench Press', key: 'bench_press', equipment: 'barbell', sets: [
              { weight: 135, reps: 10 },
              { weight: 145, reps: 8 },
              { weight: 155, reps: 6 }
            ]},
          ]
        },
        // Day 12 - Leg day
        {
          daysAgo: 12,
          title: 'Leg Day - Week 1',
          exercises: [
            { name: 'Squat', key: 'squat', equipment: 'barbell', sets: [
              { weight: 185, reps: 8 },
              { weight: 205, reps: 6 },
              { weight: 225, reps: 4 }
            ]},
            { name: 'Deadlift', key: 'deadlift', equipment: 'barbell', sets: [
              { weight: 225, reps: 6 },
              { weight: 275, reps: 4 },
              { weight: 315, reps: 2 }
            ]},
          ]
        },
        // Day 10 - Push day (PROGRESS - weight up)
        {
          daysAgo: 10,
          title: 'Push Day - Week 2',
          exercises: [
            { name: 'Bench Press', key: 'bench_press', equipment: 'barbell', sets: [
              { weight: 145, reps: 10 },
              { weight: 155, reps: 8 },
              { weight: 165, reps: 5 }
            ]},
          ]
        },
        // Day 8 - Leg day (PROGRESS)
        {
          daysAgo: 8,
          title: 'Leg Day - Week 2',
          exercises: [
            { name: 'Squat', key: 'squat', equipment: 'barbell', sets: [
              { weight: 195, reps: 8 },
              { weight: 215, reps: 6 },
              { weight: 235, reps: 4 }
            ]},
            { name: 'Deadlift', key: 'deadlift', equipment: 'barbell', sets: [
              { weight: 245, reps: 6 },
              { weight: 295, reps: 4 },
              { weight: 335, reps: 2 }
            ]},
          ]
        },
        // Day 6 - Push day (REGRESSION - bad day)
        {
          daysAgo: 6,
          title: 'Push Day - Deload',
          exercises: [
            { name: 'Bench Press', key: 'bench_press', equipment: 'barbell', sets: [
              { weight: 135, reps: 12 },
              { weight: 145, reps: 10 },
              { weight: 155, reps: 8 }
            ]},
          ]
        },
        // Day 4 - Leg day (slight regression)
        {
          daysAgo: 4,
          title: 'Leg Day - Week 3',
          exercises: [
            { name: 'Squat', key: 'squat', equipment: 'barbell', sets: [
              { weight: 185, reps: 10 },
              { weight: 205, reps: 8 },
              { weight: 225, reps: 6 }
            ]},
            { name: 'Deadlift', key: 'deadlift', equipment: 'barbell', sets: [
              { weight: 275, reps: 5 },
              { weight: 315, reps: 3 },
              { weight: 335, reps: 2 }
            ]},
          ]
        },
        // Day 2 - Push day (BIG PROGRESS - PR!)
        {
          daysAgo: 2,
          title: 'Push Day - PR Day!',
          exercises: [
            { name: 'Bench Press', key: 'bench_press', equipment: 'barbell', sets: [
              { weight: 155, reps: 8 },
              { weight: 175, reps: 5 },
              { weight: 185, reps: 3 }
            ]},
          ]
        },
        // Today - Leg day (PROGRESS)
        {
          daysAgo: 0,
          title: 'Leg Day - Strong!',
          exercises: [
            { name: 'Squat', key: 'squat', equipment: 'barbell', sets: [
              { weight: 205, reps: 8 },
              { weight: 225, reps: 6 },
              { weight: 245, reps: 4 }
            ]},
            { name: 'Deadlift', key: 'deadlift', equipment: 'barbell', sets: [
              { weight: 295, reps: 5 },
              { weight: 335, reps: 3 },
              { weight: 365, reps: 1 }
            ]},
          ]
        },
      ];

      // Create workouts and progress records
      for (let i = 0; i < workoutData.length; i++) {
        const data = workoutData[i];
        const workoutDate = new Date();
        workoutDate.setDate(workoutDate.getDate() - data.daysAgo);
        workoutDate.setHours(10 + i, 0, 0, 0); // Different times to ensure unique timestamps

        const workoutId = `workout_${baseTime}_${i}`;

        // Create workout history entry
        const workout = {
          id: workoutId,
          odI: workoutId,
          userId,
          date: workoutDate.toISOString(),
          startTime: workoutDate.toISOString(),
          endTime: new Date(workoutDate.getTime() + 60 * 60 * 1000).toISOString(),
          duration: 60 * 60 * 1000,
          workoutTitle: data.title,
          workoutType: 'quick',
          notes: data.daysAgo === 2 ? 'New PR on bench! Feeling strong!' : '',
          photos: [],
          exercises: data.exercises.map(ex => ({
            name: ex.name,
            equipment: ex.equipment,
            sets: ex.sets,
            completedSets: ex.sets.length,
            totalSets: ex.sets.length
          }))
        };

        workoutHistory.push(workout);

        // Create exercise progress records
        data.exercises.forEach(ex => {
          ex.sets.forEach(set => {
            exerciseProgress[ex.key].records.push({
              date: workoutDate.toISOString(),
              weight: parseFloat(set.weight),
              reps: parseInt(set.reps),
              volume: set.weight * set.reps,
              workoutId: workoutId
            });
          });
        });
      }

      // Sort all records by date
      Object.keys(exerciseProgress).forEach(key => {
        exerciseProgress[key].records.sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      // Sort workout history by date (most recent first)
      workoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Save to AsyncStorage
      await AsyncStorage.setItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`, JSON.stringify(workoutHistory));
      await AsyncStorage.setItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`, JSON.stringify(exerciseProgress));

      // Calculate total volume
      let totalVolume = 0;
      Object.values(exerciseProgress).forEach(ex => {
        ex.records.forEach(r => {
          totalVolume += r.volume;
        });
      });

      // Update user stats
      const stats = {
        totalWorkouts: workoutHistory.length,
        totalExercises: workoutHistory.reduce((sum, w) => sum + w.exercises.length, 0),
        currentStreak: 3,
        totalVolume: totalVolume,
        lastWorkoutDate: new Date().toISOString(),
        lastStreakDate: new Date().toDateString()
      };
      await AsyncStorage.setItem(`${STORAGE_KEYS.USER_STATS}_${userId}`, JSON.stringify(stats));

      return { success: true, workoutsCreated: workoutHistory.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PLANNED WORKOUTS ============

  // Save a planned workout for a specific date
  static async savePlannedWorkout(dateKey, workoutData, userId = 'guest') {
    try {
      const plannedWorkouts = await this.getPlannedWorkouts(userId);

      // Create the planned workout object
      const plannedWorkout = {
        id: Date.now().toString(),
        dateKey,
        ...workoutData,
        createdAt: new Date().toISOString()
      };

      // Store by date key
      plannedWorkouts[dateKey] = plannedWorkout;

      await AsyncStorage.setItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`, JSON.stringify(plannedWorkouts));
      return { success: true, workoutId: plannedWorkout.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all planned workouts
  static async getPlannedWorkouts(userId = 'guest') {
    try {
      const planned = await AsyncStorage.getItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`);
      return planned ? JSON.parse(planned) : {};
    } catch (error) {
      return {};
    }
  }

  // Get planned workout for a specific date
  static async getPlannedWorkoutByDate(dateKey, userId = 'guest') {
    try {
      const plannedWorkouts = await this.getPlannedWorkouts(userId);
      return plannedWorkouts[dateKey] || null;
    } catch (error) {
      return null;
    }
  }

  // Delete planned workout for a specific date
  static async deletePlannedWorkout(dateKey, userId = 'guest') {
    try {
      const plannedWorkouts = await this.getPlannedWorkouts(userId);
      delete plannedWorkouts[dateKey];
      await AsyncStorage.setItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`, JSON.stringify(plannedWorkouts));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Copy workout to multiple dates
  static async copyWorkoutToMultipleDates(workoutData, targetDateKeys, userId = 'guest') {
    try {
      const plannedWorkouts = await this.getPlannedWorkouts(userId);

      targetDateKeys.forEach(dateKey => {
        const plannedWorkout = {
          id: Date.now().toString() + Math.random(),
          dateKey,
          ...JSON.parse(JSON.stringify(workoutData)), // Deep copy
          createdAt: new Date().toISOString()
        };
        plannedWorkouts[dateKey] = plannedWorkout;
      });

      await AsyncStorage.setItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`, JSON.stringify(plannedWorkouts));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ PROGRAM SCHEDULE MANAGEMENT ============

  // Shift all future program workouts forward by one day
  static async shiftProgramScheduleForward(programId, startDate, userId = 'guest') {
    try {
      const plannedWorkouts = await this.getPlannedWorkouts(userId);
      const startDateObj = new Date(startDate);

      // Find all planned workouts for this program starting from startDate
      const programWorkouts = [];
      Object.entries(plannedWorkouts).forEach(([dateKey, workout]) => {
        const workoutDate = new Date(dateKey);
        if (workout.type === 'program' &&
            workout.programId === programId &&
            workoutDate >= startDateObj) {
          programWorkouts.push({ dateKey, workout, date: workoutDate });
        }
      });

      // Sort by date
      programWorkouts.sort((a, b) => a.date - b.date);

      // Remove old entries
      programWorkouts.forEach(({ dateKey }) => {
        delete plannedWorkouts[dateKey];
      });

      // Re-add workouts shifted by one day
      programWorkouts.forEach(({ workout }) => {
        const oldDate = new Date(workout.dateKey);
        const newDate = new Date(oldDate);
        newDate.setDate(newDate.getDate() + 1);
        const newDateKey = newDate.toISOString().split('T')[0];

        plannedWorkouts[newDateKey] = {
          ...workout,
          dateKey: newDateKey,
          shiftedAt: new Date().toISOString()
        };
      });

      await AsyncStorage.setItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`, JSON.stringify(plannedWorkouts));
      return { success: true, shiftedCount: programWorkouts.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get the next scheduled workout date for a program based on weekly schedule
  static getNextWorkoutDate(weeklySchedule, startDate = new Date()) {
    if (!weeklySchedule || weeklySchedule.length === 0) {
      return null;
    }

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date(startDate);
    const currentDayIndex = today.getDay();

    // Find the next workout day in the schedule
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDayName = daysOfWeek[nextDayIndex];
      const scheduleDay = weeklySchedule.find(s => s.day === nextDayName);

      if (scheduleDay && scheduleDay.type === 'workout') {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + i);
        return {
          date: nextDate,
          dayName: nextDayName,
          workoutIndex: scheduleDay.workoutIndex
        };
      }
    }

    return null;
  }

  // Schedule a program's workouts based on weekly schedule for the next N weeks
  static async scheduleProgramWorkouts(program, startDate, weeksAhead = 4, userId = 'guest') {
    try {
      if (!program.weeklySchedule || program.weeklySchedule.length === 0) {
        return { success: false, error: 'Program has no weekly schedule defined' };
      }

      const plannedWorkouts = await this.getPlannedWorkouts(userId);
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const startDateObj = new Date(startDate);
      const totalDays = weeksAhead * 7;

      let scheduledCount = 0;

      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + dayOffset);
        const dayOfWeek = currentDate.getDay();
        const dayName = daysOfWeek[dayOfWeek];

        const scheduleDay = program.weeklySchedule.find(s => s.day === dayName);

        if (scheduleDay && scheduleDay.type === 'workout' && scheduleDay.workoutIndex !== null) {
          const workoutDay = program.days[scheduleDay.workoutIndex];

          if (workoutDay) {
            const dateKey = currentDate.toISOString().split('T')[0];

            plannedWorkouts[dateKey] = {
              id: Date.now().toString() + Math.random(),
              dateKey,
              type: 'program',
              programId: program.id,
              programName: program.name,
              dayId: workoutDay.id,
              dayName: workoutDay.name,
              exercises: workoutDay.exercises || [],
              scheduledAt: new Date().toISOString()
            };
            scheduledCount++;
          }
        }
      }

      await AsyncStorage.setItem(`${STORAGE_KEYS.PLANNED_WORKOUTS}_${userId}`, JSON.stringify(plannedWorkouts));
      return { success: true, scheduledCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ GOALS SYSTEM ============

  // Get all goals for a user
  static async getGoals(userId = 'guest') {
    try {
      const goals = await AsyncStorage.getItem(`${STORAGE_KEYS.GOALS}_${userId}`);
      return goals ? JSON.parse(goals) : [];
    } catch (error) {
      return [];
    }
  }

  // Save a new goal
  static async saveGoal(goalData, userId = 'guest') {
    try {
      const goals = await this.getGoals(userId);

      const newGoal = {
        id: Date.now().toString(),
        userId,
        ...goalData,
        currentProgress: 0,
        status: 'active', // 'active', 'completed', 'paused'
        createdAt: new Date().toISOString(),
        completedAt: null
      };

      goals.push(newGoal);
      await AsyncStorage.setItem(`${STORAGE_KEYS.GOALS}_${userId}`, JSON.stringify(goals));
      return { success: true, goalId: newGoal.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update goal progress
  static async updateGoalProgress(goalId, progress, userId = 'guest') {
    try {
      const goals = await this.getGoals(userId);
      const goalIndex = goals.findIndex(g => g.id === goalId);

      if (goalIndex !== -1) {
        goals[goalIndex].currentProgress = progress;

        // Check if goal is completed
        if (progress >= goals[goalIndex].targetValue && goals[goalIndex].status === 'active') {
          goals[goalIndex].status = 'completed';
          goals[goalIndex].completedAt = new Date().toISOString();
        }

        await AsyncStorage.setItem(`${STORAGE_KEYS.GOALS}_${userId}`, JSON.stringify(goals));
        return { success: true };
      }
      return { success: false, error: 'Goal not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete a goal
  static async deleteGoal(goalId, userId = 'guest') {
    try {
      const goals = await this.getGoals(userId);
      const filteredGoals = goals.filter(g => g.id !== goalId);
      await AsyncStorage.setItem(`${STORAGE_KEYS.GOALS}_${userId}`, JSON.stringify(filteredGoals));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Calculate goal progress based on current stats
  static async calculateGoalProgress(goal, userId = 'guest') {
    try {
      const stats = await this.getUserStats(userId);
      const exerciseProgress = await this.getExerciseProgress(userId);
      const history = await this.getWorkoutHistory(userId);

      switch (goal.type) {
        case 'weight':
          // For exercise weight goals
          if (goal.exerciseName) {
            const exerciseKey = goal.exerciseName.toLowerCase().replace(/\s+/g, '_');
            const progress = exerciseProgress[exerciseKey];
            if (progress && progress.records.length > 0) {
              const maxWeight = Math.max(...progress.records.map(r => r.weight));
              return maxWeight;
            }
          }
          return 0;

        case 'reps':
          // For exercise rep goals
          if (goal.exerciseName) {
            const exerciseKey = goal.exerciseName.toLowerCase().replace(/\s+/g, '_');
            const progress = exerciseProgress[exerciseKey];
            if (progress && progress.records.length > 0) {
              const maxReps = Math.max(...progress.records.map(r => r.reps));
              return maxReps;
            }
          }
          return 0;

        case 'volume':
          // For monthly volume goals
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentWorkouts = history.filter(w => new Date(w.date) >= thirtyDaysAgo);
          const totalVolume = recentWorkouts.reduce((total, workout) => {
            return total + (workout.exercises || []).reduce((exerciseTotal, exercise) => {
              return exerciseTotal + (exercise.sets || []).reduce((setTotal, set) => {
                if (set.weight && set.reps) {
                  return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
                }
                return setTotal;
              }, 0);
            }, 0);
          }, 0);
          return Math.round(totalVolume);

        case 'frequency':
          // For weekly workout frequency goals
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const weekWorkouts = history.filter(w => new Date(w.date) >= startOfWeek);
          return weekWorkouts.length;

        case 'monthly_workouts':
          // For monthly workout count goals
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthWorkouts = history.filter(w => new Date(w.date) >= startOfMonth);
          return monthWorkouts.length;

        case 'consistency':
          // For consistency goals (weeks hitting 3+ workouts)
          let weeksHit = 0;
          const currentDate = new Date();
          for (let i = 0; i < 4; i++) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            const workoutsInWeek = history.filter(w => {
              const d = new Date(w.date);
              return d >= weekStart && d < weekEnd;
            }).length;
            if (workoutsInWeek >= 3) {
              weeksHit++;
            }
          }
          return weeksHit;

        default:
          return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Update all goal progress automatically
  static async updateAllGoalProgress(userId = 'guest') {
    try {
      const goals = await this.getGoals(userId);

      for (let goal of goals) {
        if (goal.status === 'active') {
          const progress = await this.calculateGoalProgress(goal, userId);
          await this.updateGoalProgress(goal.id, progress, userId);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============ ACHIEVEMENTS SYSTEM ============

  // Get all achievements with unlock status
  static async getAchievements(userId = 'guest') {
    try {
      const unlocked = await AsyncStorage.getItem(`${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`);
      const unlockedIds = unlocked ? JSON.parse(unlocked) : [];

      // Define all achievements
      const achievements = [
        // Workout Milestones
        { id: 'first_workout', icon: '🎯', title: 'First Steps', description: 'Complete your first workout', category: 'milestones', requirement: 1, type: 'workouts' },
        { id: 'workout_5', icon: '🌱', title: 'Seedling', description: 'Complete 5 workouts', category: 'milestones', requirement: 5, type: 'workouts' },
        { id: 'workout_10', icon: '💪', title: 'Getting Started', description: 'Complete 10 workouts', category: 'milestones', requirement: 10, type: 'workouts' },
        { id: 'workout_25', icon: '🔥', title: 'Quarter Century', description: 'Complete 25 workouts', category: 'milestones', requirement: 25, type: 'workouts' },
        { id: 'workout_50', icon: '⭐', title: 'Half Century', description: 'Complete 50 workouts', category: 'milestones', requirement: 50, type: 'workouts' },
        { id: 'workout_75', icon: '🚀', title: 'On Fire', description: 'Complete 75 workouts', category: 'milestones', requirement: 75, type: 'workouts' },
        { id: 'workout_100', icon: '💯', title: 'Century Club', description: 'Complete 100 workouts', category: 'milestones', requirement: 100, type: 'workouts' },
        { id: 'workout_150', icon: '🌟', title: 'Rising Star', description: 'Complete 150 workouts', category: 'milestones', requirement: 150, type: 'workouts' },
        { id: 'workout_200', icon: '🏅', title: 'Bicentennial', description: 'Complete 200 workouts', category: 'milestones', requirement: 200, type: 'workouts' },
        { id: 'workout_250', icon: '🏆', title: 'Elite Lifter', description: 'Complete 250 workouts', category: 'milestones', requirement: 250, type: 'workouts' },
        { id: 'workout_365', icon: '📅', title: 'Year Round', description: 'Complete 365 workouts', category: 'milestones', requirement: 365, type: 'workouts' },
        { id: 'workout_500', icon: '👑', title: 'Legendary', description: 'Complete 500 workouts', category: 'milestones', requirement: 500, type: 'workouts' },
        { id: 'workout_1000', icon: '💎', title: 'Diamond Status', description: 'Complete 1000 workouts', category: 'milestones', requirement: 1000, type: 'workouts' },

        // Streak Achievements
        { id: 'streak_2', icon: '🔆', title: 'Momentum', description: 'Maintain a 2-day streak', category: 'consistency', requirement: 2, type: 'streak' },
        { id: 'streak_3', icon: '🔥', title: 'Hot Streak', description: 'Maintain a 3-day streak', category: 'consistency', requirement: 3, type: 'streak' },
        { id: 'streak_5', icon: '⚡', title: 'Power Five', description: 'Maintain a 5-day streak', category: 'consistency', requirement: 5, type: 'streak' },
        { id: 'streak_7', icon: '📅', title: 'One Week Warrior', description: 'Maintain a 7-day streak', category: 'consistency', requirement: 7, type: 'streak' },
        { id: 'streak_10', icon: '💥', title: 'Ten Day Train', description: 'Maintain a 10-day streak', category: 'consistency', requirement: 10, type: 'streak' },
        { id: 'streak_14', icon: '💪', title: 'Two Week Wonder', description: 'Maintain a 14-day streak', category: 'consistency', requirement: 14, type: 'streak' },
        { id: 'streak_21', icon: '🎯', title: 'Habit Former', description: 'Maintain a 21-day streak', category: 'consistency', requirement: 21, type: 'streak' },
        { id: 'streak_30', icon: '🌟', title: 'Monthly Master', description: 'Maintain a 30-day streak', category: 'consistency', requirement: 30, type: 'streak' },
        { id: 'streak_50', icon: '🚀', title: 'Unbreakable', description: 'Maintain a 50-day streak', category: 'consistency', requirement: 50, type: 'streak' },
        { id: 'streak_75', icon: '💎', title: 'Committed', description: 'Maintain a 75-day streak', category: 'consistency', requirement: 75, type: 'streak' },
        { id: 'streak_100', icon: '👑', title: 'Unstoppable', description: 'Maintain a 100-day streak', category: 'consistency', requirement: 100, type: 'streak' },
        { id: 'streak_180', icon: '🏆', title: 'Half Year Hero', description: 'Maintain a 180-day streak', category: 'consistency', requirement: 180, type: 'streak' },
        { id: 'streak_365', icon: '🌍', title: 'Iron Will', description: 'Maintain a 365-day streak', category: 'consistency', requirement: 365, type: 'streak' },

        // Volume Achievements
        { id: 'volume_5k', icon: '📈', title: 'Getting Heavy', description: 'Lift 5,000 lbs total', category: 'strength', requirement: 5000, type: 'volume' },
        { id: 'volume_10k', icon: '📊', title: 'Volume Starter', description: 'Lift 10,000 lbs total', category: 'strength', requirement: 10000, type: 'volume' },
        { id: 'volume_25k', icon: '💪', title: 'Quarter Ton', description: 'Lift 25,000 lbs total', category: 'strength', requirement: 25000, type: 'volume' },
        { id: 'volume_50k', icon: '🏋️', title: 'Volume Crusher', description: 'Lift 50,000 lbs total', category: 'strength', requirement: 50000, type: 'volume' },
        { id: 'volume_100k', icon: '⚡', title: 'Six Figure Lifter', description: 'Lift 100,000 lbs total', category: 'strength', requirement: 100000, type: 'volume' },
        { id: 'volume_250k', icon: '🚀', title: 'Quarter Mil', description: 'Lift 250,000 lbs total', category: 'strength', requirement: 250000, type: 'volume' },
        { id: 'volume_500k', icon: '💥', title: 'Volume Beast', description: 'Lift 500,000 lbs total', category: 'strength', requirement: 500000, type: 'volume' },
        { id: 'volume_750k', icon: '🔱', title: 'Almost There', description: 'Lift 750,000 lbs total', category: 'strength', requirement: 750000, type: 'volume' },
        { id: 'volume_1m', icon: '👑', title: 'Million Pound Club', description: 'Lift 1,000,000 lbs total', category: 'strength', requirement: 1000000, type: 'volume' },
        { id: 'volume_2m', icon: '💎', title: 'Double Trouble', description: 'Lift 2,000,000 lbs total', category: 'strength', requirement: 2000000, type: 'volume' },

        // Special Achievements
        { id: 'early_bird', icon: '🌅', title: 'Early Bird', description: 'Complete a workout before 7 AM', category: 'special', requirement: 1, type: 'early_workout' },
        { id: 'night_owl', icon: '🦉', title: 'Night Owl', description: 'Complete a workout after 10 PM', category: 'special', requirement: 1, type: 'late_workout' },
        { id: 'midnight_warrior', icon: '🌙', title: 'Midnight Warrior', description: 'Complete a workout after midnight', category: 'special', requirement: 1, type: 'midnight_workout' },
        { id: 'sunrise_grinder', icon: '🌄', title: 'Sunrise Grinder', description: 'Complete 10 workouts before 7 AM', category: 'special', requirement: 10, type: 'early_workouts' },
        { id: 'goal_achiever', icon: '🎯', title: 'Goal Achiever', description: 'Complete your first goal', category: 'special', requirement: 1, type: 'completed_goal' },
        { id: 'goal_master', icon: '🏆', title: 'Goal Master', description: 'Complete 5 goals', category: 'special', requirement: 5, type: 'completed_goal' },
        { id: 'dedication', icon: '💎', title: 'Dedication', description: 'Work out 4 times in one week', category: 'special', requirement: 4, type: 'weekly_workouts' },
        { id: 'overachiever', icon: '🚀', title: 'Overachiever', description: 'Work out 6 times in one week', category: 'special', requirement: 6, type: 'weekly_workouts' },
        { id: 'daily_grind', icon: '⚡', title: 'Daily Grind', description: 'Work out 7 days in one week', category: 'special', requirement: 7, type: 'weekly_workouts' },
        { id: 'weekend_warrior', icon: '⚔️', title: 'Weekend Warrior', description: 'Complete workouts on Sat & Sun', category: 'special', requirement: 1, type: 'weekend_workouts' },
        { id: 'photographer', icon: '📸', title: 'Progress Tracker', description: 'Add photos to 5 workouts', category: 'special', requirement: 5, type: 'photos' },
        { id: 'note_taker', icon: '📝', title: 'Detail Oriented', description: 'Add notes to 10 workouts', category: 'special', requirement: 10, type: 'notes' },
      ];

      return achievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
        unlockedAt: unlockedIds.includes(achievement.id) ? new Date().toISOString() : null
      }));
    } catch (error) {
      return [];
    }
  }

  // Check and unlock achievements based on current stats
  static async checkAndUnlockAchievements(userId = 'guest') {
    try {
      const stats = await this.getUserStats(userId);
      const history = await this.getWorkoutHistory(userId);
      const goals = await this.getGoals(userId);
      const currentAchievements = await this.getAchievements(userId);

      const unlocked = await AsyncStorage.getItem(`${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`);
      const unlockedIds = unlocked ? JSON.parse(unlocked) : [];
      const newlyUnlocked = [];

      // Check each locked achievement
      for (const achievement of currentAchievements) {
        if (achievement.unlocked) continue;

        let shouldUnlock = false;

        switch (achievement.type) {
          case 'workouts':
            shouldUnlock = (stats.totalWorkouts || 0) >= achievement.requirement;
            break;

          case 'streak':
            shouldUnlock = (stats.currentStreak || 0) >= achievement.requirement;
            break;

          case 'volume':
            shouldUnlock = (stats.totalVolume || 0) >= achievement.requirement;
            break;

          case 'early_workout':
            shouldUnlock = history.some(w => {
              const hour = new Date(w.startTime).getHours();
              return hour < 7;
            });
            break;

          case 'early_workouts':
            const earlyCount = history.filter(w => {
              const hour = new Date(w.startTime).getHours();
              return hour < 7;
            }).length;
            shouldUnlock = earlyCount >= achievement.requirement;
            break;

          case 'late_workout':
            shouldUnlock = history.some(w => {
              const hour = new Date(w.startTime).getHours();
              return hour >= 22;
            });
            break;

          case 'midnight_workout':
            shouldUnlock = history.some(w => {
              const hour = new Date(w.startTime).getHours();
              return hour >= 0 && hour < 4;
            });
            break;

          case 'completed_goal':
            shouldUnlock = goals.filter(g => g.status === 'completed').length >= achievement.requirement;
            break;

          case 'weekly_workouts':
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const weekWorkouts = history.filter(w => new Date(w.date) >= lastWeek).length;
            shouldUnlock = weekWorkouts >= achievement.requirement;
            break;

          case 'weekend_workouts':
            shouldUnlock = history.some(w => {
              const date = new Date(w.date);
              const dayOfWeek = date.getDay();
              return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            });
            break;

          case 'photos':
            const workoutsWithPhotos = history.filter(w => w.photos && w.photos.length > 0).length;
            shouldUnlock = workoutsWithPhotos >= achievement.requirement;
            break;

          case 'notes':
            const workoutsWithNotes = history.filter(w => w.notes && w.notes.trim().length > 0).length;
            shouldUnlock = workoutsWithNotes >= achievement.requirement;
            break;
        }

        if (shouldUnlock && !unlockedIds.includes(achievement.id)) {
          unlockedIds.push(achievement.id);
          newlyUnlocked.push(achievement);
        }
      }

      if (newlyUnlocked.length > 0) {
        await AsyncStorage.setItem(`${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`, JSON.stringify(unlockedIds));
      }

      return { success: true, newlyUnlocked };
    } catch (error) {
      return { success: false, error: error.message, newlyUnlocked: [] };
    }
  }

  // Get achievement progress for a specific achievement
  static async getAchievementProgress(achievementId, userId = 'guest') {
    try {
      const achievements = await this.getAchievements(userId);
      const achievement = achievements.find(a => a.id === achievementId);

      if (!achievement) return 0;

      const stats = await this.getUserStats(userId);
      const history = await this.getWorkoutHistory(userId);

      switch (achievement.type) {
        case 'workouts':
          return Math.min((stats.totalWorkouts || 0) / achievement.requirement * 100, 100);

        case 'streak':
          return Math.min((stats.currentStreak || 0) / achievement.requirement * 100, 100);

        case 'volume':
          return Math.min((stats.totalVolume || 0) / achievement.requirement * 100, 100);

        default:
          return achievement.unlocked ? 100 : 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Delete workout and clean up related exercise progress records
  static async deleteWorkout(workoutId, userId = 'guest') {
    try {
      // Remove from workout history
      const history = await this.getWorkoutHistory(userId);

      // Find the workout being deleted to get its date and exercises
      const workoutToDelete = history.find(w => w.id === workoutId);
      const updatedHistory = history.filter(w => w.id !== workoutId);
      await AsyncStorage.setItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`, JSON.stringify(updatedHistory));

      // Clean up exercise progress records that reference this workout
      const progress = await this.getExerciseProgress(userId);
      let recordsRemoved = 0;

      Object.keys(progress).forEach(exerciseKey => {
        const originalLength = progress[exerciseKey].records.length;

        // Filter out records that match this workout by workoutId OR by date (for orphaned records)
        progress[exerciseKey].records = progress[exerciseKey].records.filter(record => {
          // Remove if workoutId matches
          if (record.workoutId === workoutId) {
            return false;
          }

          // If this is an orphaned record (no workoutId) and we found the workout being deleted
          // Check if the record's date matches the workout date and exercise name
          if (!record.workoutId && workoutToDelete) {
            const recordDate = new Date(record.date).toDateString();
            const workoutDate = new Date(workoutToDelete.date).toDateString();

            // Check if dates match
            if (recordDate === workoutDate) {
              // Check if this exercise was in the deleted workout
              const exerciseWasInWorkout = workoutToDelete.exercises.some(ex =>
                ex.name.toLowerCase().replace(/\s+/g, '_') === exerciseKey
              );

              // Remove orphaned record if it matches the deleted workout's date and exercise
              if (exerciseWasInWorkout) {
                return false;
              }
            }
          }

          // Keep the record
          return true;
        });

        recordsRemoved += originalLength - progress[exerciseKey].records.length;
      });

      // Save updated progress
      await AsyncStorage.setItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`, JSON.stringify(progress));

      return { success: true, recordsRemoved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // MIGRATION: Add workoutId to existing exercise progress records
  static async migrateExerciseProgressWithWorkoutIds(userId = 'guest') {
    try {
      const progress = await this.getExerciseProgress(userId);
      const history = await this.getWorkoutHistory(userId);

      if (!history || history.length === 0) {
        return { success: true, message: 'No data to migrate' };
      }

      let updatedRecords = 0;

      // For each exercise in progress
      Object.keys(progress).forEach(exerciseKey => {
        const exerciseData = progress[exerciseKey];

        // For each record in this exercise
        exerciseData.records.forEach(record => {
          // Skip if already has workoutId
          if (record.workoutId) return;

          // Try to find matching workout by date and exercise
          const matchingWorkout = history.find(workout => {
            // Check if date matches (within same day)
            const workoutDate = new Date(workout.date).toDateString();
            const recordDate = new Date(record.date).toDateString();
            if (workoutDate !== recordDate) return false;

            // Check if this workout contains this exercise
            return workout.exercises.some(ex =>
              ex.name.toLowerCase().replace(/\s+/g, '_') === exerciseKey
            );
          });

          if (matchingWorkout) {
            record.workoutId = matchingWorkout.id;
            updatedRecords++;
          }
        });
      });

      // Save updated progress
      await AsyncStorage.setItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`, JSON.stringify(progress));

      return { success: true, updatedRecords };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clean up orphaned exercise progress records (records that don't match any existing workout)
  static async cleanupOrphanedProgressRecords(userId = 'guest') {
    try {
      const progress = await this.getExerciseProgress(userId);
      const history = await this.getWorkoutHistory(userId);

      let recordsRemoved = 0;
      const workoutIds = new Set(history.map(w => w.id));

      // For each exercise in progress
      Object.keys(progress).forEach(exerciseKey => {
        const exerciseData = progress[exerciseKey];
        const originalLength = exerciseData.records.length;

        // Filter out orphaned records
        exerciseData.records = exerciseData.records.filter(record => {
          // If record has workoutId, check if workout still exists
          if (record.workoutId) {
            return workoutIds.has(record.workoutId);
          }

          // If record doesn't have workoutId, try to find a matching workout
          const matchingWorkout = history.find(workout => {
            const workoutDate = new Date(workout.date).toDateString();
            const recordDate = new Date(record.date).toDateString();
            if (workoutDate !== recordDate) return false;

            return workout.exercises.some(ex =>
              ex.name.toLowerCase().replace(/\s+/g, '_') === exerciseKey
            );
          });

          // Keep the record only if we found a matching workout
          return matchingWorkout !== undefined;
        });

        recordsRemoved += originalLength - exerciseData.records.length;
      });

      // Save updated progress
      await AsyncStorage.setItem(`${STORAGE_KEYS.EXERCISE_PROGRESS}_${userId}`, JSON.stringify(progress));

      return { success: true, recordsRemoved };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}