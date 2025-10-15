import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutStorageService } from '../workoutStorage';
import { foodDatabase } from '../foodDatabase';

class ContextManager {
  constructor() {
    this.currentScreen = null;
    this.currentActivity = null;
    this.screenData = {};
    console.log('📍 ContextManager initialized');
  }

  // Set current screen context
  setScreen(screenName, data = {}) {
    this.currentScreen = screenName;
    this.screenData = data;
    console.log(`📍 Context: Now on ${screenName}`, data);
  }

  // Set current activity
  setActivity(activity) {
    this.currentActivity = activity;
    console.log(`🎯 Activity: ${activity}`);
  }

  // Get full context for AI
  async getFullContext(userId = 'guest') {
    console.log(`👤 Current user ID: ${userId}`);

    // Check all possible storage keys
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const workoutKeys = allKeys.filter(key => key.includes('workout'));
      console.log(`🔑 All workout-related keys:`, workoutKeys);

      // Try to get data from each workout key
      for (const key of workoutKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`📦 Data in ${key}:`, Array.isArray(parsed) ? `${parsed.length} items` : 'object');
        }
      }
    } catch (error) {
      console.log('Error checking storage keys:', error);
    }

    const allWorkoutHistory = await this.getAllWorkoutHistory(userId);
    const allExerciseProgress = await this.getAllExerciseProgress(userId);

    console.log(`📚 AI Context Summary:`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - Workouts: ${allWorkoutHistory.length}`);
    console.log(`   - Exercises: ${Object.keys(allExerciseProgress).length}`);

    if (Object.keys(allExerciseProgress).length > 0) {
      console.log(`   - Exercise List:`, Object.keys(allExerciseProgress));
    }

    const context = {
      screen: this.currentScreen,
      activity: this.currentActivity,
      screenData: this.screenData,
      userData: await this.getUserData(),
      recentActivity: await this.getRecentActivity(),
      topExercises: await this.getTopExercisePRs(userId, 5), // Top 5 exercises by volume with PRs
      allWorkoutHistory, // FULL workout history
      allExerciseProgress, // ALL exercise records
    };

    return context;
  }

  // Get user profile data
  async getUserData() {
    try {
      const userProfileStr = await AsyncStorage.getItem('user_profile');
      const goalsStr = await AsyncStorage.getItem('user_goals');

      return {
        profile: userProfileStr ? JSON.parse(userProfileStr) : null,
        goals: goalsStr ? JSON.parse(goalsStr) : null,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return {};
    }
  }

  // Get recent user activity (last 7 days)
  async getRecentActivity() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get current user ID
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.uid || 'guest';

      // Get recent workouts
      const allWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);
      const recentWorkouts = allWorkouts
        .filter(w => new Date(w.date) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      // Get recent meals
      const recentMeals = await this.getRecentMeals(7);

      // Calculate stats
      const totalWorkouts = recentWorkouts.length;
      const totalVolume = recentWorkouts.reduce((sum, w) => {
        // Calculate volume from exercises if totalVolume isn't stored
        const workoutVolume = w.totalVolume || w.exercises?.reduce((total, exercise) => {
          return total + (exercise.sets || []).reduce((exerciseTotal, set) => {
            if (set.weight && set.reps) {
              return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return exerciseTotal;
          }, 0);
        }, 0) || 0;
        return sum + workoutVolume;
      }, 0);

      const avgCalories = recentMeals.length > 0
        ? recentMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0) / recentMeals.length
        : 0;

      // Extract detailed workout information
      const detailedWorkouts = recentWorkouts.map(workout => ({
        date: workout.date,
        title: workout.workoutTitle,
        duration: workout.duration,
        exerciseCount: workout.exercises?.length || 0,
        exercises: workout.exercises?.map(ex => ({
          name: ex.name,
          sets: ex.sets?.length || 0,
          maxWeight: ex.sets?.length > 0
            ? Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0))
            : 0,
        })) || [],
        totalVolume: workout.exercises?.reduce((total, exercise) => {
          return total + (exercise.sets || []).reduce((exerciseTotal, set) => {
            if (set.weight && set.reps) {
              return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return exerciseTotal;
          }, 0);
        }, 0) || 0,
      }));

      return {
        workouts: totalWorkouts,
        totalVolume: Math.round(totalVolume),
        avgCaloriesPerDay: Math.round(avgCalories),
        lastWorkout: recentWorkouts[0] ? recentWorkouts[0].date : null,
        detailedWorkouts, // Include detailed workout info for AI
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {};
    }
  }

  // Get recent meals
  async getRecentMeals(days = 7) {
    try {
      const now = new Date();
      const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get all meals from storage
      const mealsStr = await AsyncStorage.getItem('meals');
      if (!mealsStr) return [];

      const allMeals = JSON.parse(mealsStr);
      return allMeals.filter(m => new Date(m.date) >= daysAgo);
    } catch (error) {
      console.error('Error getting recent meals:', error);
      return [];
    }
  }

  // Screen-specific context builders
  async getWorkoutContext() {
    if (!this.currentScreen?.includes('Workout')) return {};

    const currentWorkout = this.screenData.currentWorkout || {};
    const exercises = currentWorkout.exercises || [];

    return {
      exerciseCount: exercises.length,
      currentExercise: this.screenData.currentExercise,
      totalVolume: currentWorkout.totalVolume || 0,
      duration: currentWorkout.duration || 0,
      muscleGroups: currentWorkout.muscleGroups || [],
      workoutName: currentWorkout.name || 'Workout',
    };
  }

  async getNutritionContext() {
    if (!this.currentScreen?.includes('Nutrition') && !this.currentScreen?.includes('Food')) return {};

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's meals from storage
      const mealsStr = await AsyncStorage.getItem('meals');
      const allMeals = mealsStr ? JSON.parse(mealsStr) : [];
      const todaysMeals = allMeals.filter(m => m.date.startsWith(today));

      const totalCalories = todaysMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
      const totalProtein = todaysMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0);
      const totalCarbs = todaysMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0);
      const totalFat = todaysMeals.reduce((sum, m) => sum + (m.totalFat || 0), 0);

      const goalsStr = await AsyncStorage.getItem('user_goals');
      const goals = goalsStr ? JSON.parse(goalsStr) : {};

      return {
        todaysMeals: todaysMeals.length,
        calories: {
          consumed: Math.round(totalCalories),
          target: goals.targetCalories || 2000,
          remaining: Math.round((goals.targetCalories || 2000) - totalCalories),
        },
        protein: {
          consumed: Math.round(totalProtein),
          target: goals.proteinGrams || 150,
        },
        carbs: {
          consumed: Math.round(totalCarbs),
          target: goals.carbsGrams || 200,
        },
        fat: {
          consumed: Math.round(totalFat),
          target: goals.fatGrams || 65,
        },
      };
    } catch (error) {
      console.error('Error getting nutrition context:', error);
      return {};
    }
  }

  async getProgressContext() {
    if (!this.currentScreen?.includes('Progress')) return {};

    try {
      const progressStr = await AsyncStorage.getItem('progress_entries');
      if (!progressStr) return {};

      const entries = JSON.parse(progressStr);
      if (entries.length === 0) return {};

      // Sort by date
      const sorted = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sorted[0];
      const previous = sorted[1];

      const weightChange = previous
        ? Math.round((latest.weight - previous.weight) * 10) / 10
        : 0;

      return {
        totalEntries: entries.length,
        currentWeight: latest.weight,
        weightChange,
        lastEntry: latest.date,
      };
    } catch (error) {
      console.error('Error getting progress context:', error);
      return {};
    }
  }

  // ========== FULL HISTORY METHODS (FOR AI CONTEXT) ==========

  // Get ALL workout history (not just recent) - OPTIMIZED for speed
  async getAllWorkoutHistory(userId = 'guest', limit = 10) {
    try {
      console.log(`🔍 Fetching workout history for userId: ${userId}`);
      const allWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);
      console.log(`📦 Raw workouts retrieved: ${allWorkouts.length}`, allWorkouts);

      // Format for AI consumption - LIMIT to recent workouts for speed
      return allWorkouts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit) // Only send recent 10 workouts to AI for faster responses
        .map(workout => ({
          id: workout.id,
          date: workout.date,
          title: workout.workoutTitle,
          duration: workout.duration,
          exercises: workout.exercises?.map(ex => ({
            name: ex.name,
            equipment: ex.equipment,
            sets: ex.sets?.length || 0,
            maxWeight: ex.sets?.length > 0
              ? Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0))
              : 0,
            totalReps: ex.sets?.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) || 0,
            volume: ex.sets?.reduce((sum, set) =>
              sum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
            ) || 0,
            allSets: ex.sets, // Include all set details
          })) || [],
          totalVolume: workout.exercises?.reduce((total, exercise) => {
            return total + (exercise.sets || []).reduce((exerciseTotal, set) => {
              if (set.weight && set.reps) {
                return exerciseTotal + (parseFloat(set.weight) * parseInt(set.reps));
              }
              return exerciseTotal;
            }, 0);
          }, 0) || 0,
        }));
    } catch (error) {
      console.error('Error getting all workout history:', error);
      return [];
    }
  }

  // Get ALL exercise progress records - OPTIMIZED for speed
  async getAllExerciseProgress(userId = 'guest', limit = 5) {
    try {
      const allProgress = await WorkoutStorageService.getExerciseProgress(userId);

      // Format for AI consumption
      const formattedProgress = {};

      for (const [exerciseKey, exerciseData] of Object.entries(allProgress)) {
        const records = exerciseData.records || [];

        if (records.length > 0) {
          // Calculate stats
          const maxWeight = Math.max(...records.map(r => r.weight));
          const maxReps = Math.max(...records.map(r => r.reps));
          const maxVolume = Math.max(...records.map(r => r.volume));
          const totalVolume = records.reduce((sum, r) => sum + r.volume, 0);

          formattedProgress[exerciseData.name] = {
            name: exerciseData.name,
            equipment: exerciseData.equipment,
            totalSessions: records.length,
            totalVolume: Math.round(totalVolume),
            maxWeight: maxWeight,
            maxReps: maxReps,
            maxVolume: maxVolume,
            firstDate: records[0]?.date,
            lastDate: records[records.length - 1]?.date,
            allRecords: records.slice(-limit), // Only send last 5 records per exercise (SPEED OPTIMIZATION)
          };
        }
      }

      return formattedProgress;
    } catch (error) {
      console.error('Error getting all exercise progress:', error);
      return {};
    }
  }

  // ========== EXERCISE-SPECIFIC CONTEXT METHODS ==========

  // Get exercise history (all workouts containing this exercise)
  async getExerciseHistory(exerciseName, userId = 'guest', limit = 10) {
    try {
      const allWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);
      const searchName = exerciseName.toLowerCase();

      // Filter workouts that contain this exercise (flexible matching)
      const workoutsWithExercise = allWorkouts
        .filter(workout =>
          workout.exercises?.some(ex => {
            const exName = ex.name.toLowerCase();
            // Exact match OR partial match (either contains the other)
            return exName === searchName ||
                   exName.includes(searchName) ||
                   searchName.includes(exName);
          })
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);

      // Extract exercise details from each workout
      return workoutsWithExercise.map(workout => {
        const exercise = workout.exercises.find(ex => {
          const exName = ex.name.toLowerCase();
          return exName === searchName ||
                 exName.includes(searchName) ||
                 searchName.includes(exName);
        });

        return {
          date: workout.date,
          workoutId: workout.id,
          workoutTitle: workout.workoutTitle,
          exerciseName: exercise.name, // Include actual exercise name
          sets: exercise.sets || [],
          totalSets: exercise.sets?.length || 0,
          maxWeight: exercise.sets?.length > 0
            ? Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0))
            : 0,
          totalVolume: exercise.sets?.reduce((sum, set) =>
            sum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0
          ) || 0,
        };
      });
    } catch (error) {
      console.error('Error getting exercise history:', error);
      return [];
    }
  }

  // Calculate personal record for an exercise
  async getExercisePR(exerciseName, userId = 'guest', type = 'weight') {
    try {
      // First try exact match
      let progress = await WorkoutStorageService.getExerciseProgressByName(exerciseName, userId);

      // If no exact match, try flexible matching
      if (!progress || !progress.records || progress.records.length === 0) {
        const allProgress = await WorkoutStorageService.getExerciseProgress(userId);
        const searchName = exerciseName.toLowerCase();

        // Find exercise by partial match
        for (const [exerciseKey, exerciseData] of Object.entries(allProgress)) {
          const exName = exerciseData.name.toLowerCase();
          if (exName === searchName ||
              exName.includes(searchName) ||
              searchName.includes(exName)) {
            console.log(`🔍 Found exercise by fuzzy match: ${exerciseData.name}`);
            progress = exerciseData;
            break;
          }
        }
      }

      if (!progress || !progress.records || progress.records.length === 0) {
        console.log(`❌ No records found for: ${exerciseName}`);
        return null;
      }

      console.log(`✅ Found ${progress.records.length} records for: ${progress.name || exerciseName}`);

      const records = progress.records;

      switch (type) {
        case 'weight':
          // Max weight lifted (single set)
          const maxWeightRecord = records.reduce((max, record) =>
            record.weight > max.weight ? record : max
          , records[0]);
          return {
            type: 'Max Weight',
            value: maxWeightRecord.weight,
            reps: maxWeightRecord.reps,
            date: maxWeightRecord.date,
            display: `${maxWeightRecord.weight} lbs × ${maxWeightRecord.reps} reps`,
          };

        case 'volume':
          // Max volume (weight × reps for single set)
          const maxVolumeRecord = records.reduce((max, record) =>
            record.volume > max.volume ? record : max
          , records[0]);
          return {
            type: 'Max Volume',
            value: maxVolumeRecord.volume,
            weight: maxVolumeRecord.weight,
            reps: maxVolumeRecord.reps,
            date: maxVolumeRecord.date,
            display: `${maxVolumeRecord.weight} lbs × ${maxVolumeRecord.reps} reps = ${maxVolumeRecord.volume} lbs`,
          };

        case 'reps':
          // Max reps at any weight
          const maxRepsRecord = records.reduce((max, record) =>
            record.reps > max.reps ? record : max
          , records[0]);
          return {
            type: 'Max Reps',
            value: maxRepsRecord.reps,
            weight: maxRepsRecord.weight,
            date: maxRepsRecord.date,
            display: `${maxRepsRecord.reps} reps @ ${maxRepsRecord.weight} lbs`,
          };

        case '1rm':
          // Estimated 1 rep max using Brzycki formula: weight × (36 / (37 - reps))
          const estimated1RM = records.map(record => ({
            ...record,
            estimated1RM: record.reps === 1
              ? record.weight
              : record.weight * (36 / (37 - record.reps))
          })).reduce((max, record) =>
            record.estimated1RM > max.estimated1RM ? record : max
          );
          return {
            type: 'Estimated 1RM',
            value: Math.round(estimated1RM.estimated1RM),
            basedOn: `${estimated1RM.weight} lbs × ${estimated1RM.reps} reps`,
            date: estimated1RM.date,
            display: `~${Math.round(estimated1RM.estimated1RM)} lbs (based on ${estimated1RM.weight}×${estimated1RM.reps})`,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error('Error calculating exercise PR:', error);
      return null;
    }
  }

  // Get exercise progression over time
  async getExerciseProgression(exerciseName, userId = 'guest', days = 30) {
    try {
      // First try exact match
      let progress = await WorkoutStorageService.getExerciseProgressByName(exerciseName, userId);

      // If no exact match, try flexible matching
      if (!progress || !progress.records || progress.records.length === 0) {
        const allProgress = await WorkoutStorageService.getExerciseProgress(userId);
        const searchName = exerciseName.toLowerCase();

        // Find exercise by partial match
        for (const [exerciseKey, exerciseData] of Object.entries(allProgress)) {
          const exName = exerciseData.name.toLowerCase();
          if (exName === searchName ||
              exName.includes(searchName) ||
              searchName.includes(exName)) {
            progress = exerciseData;
            break;
          }
        }
      }

      if (!progress || !progress.records || progress.records.length === 0) {
        return {
          exerciseName,
          totalSessions: 0,
          trend: 'no_data',
          progression: [],
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentRecords = progress.records
        .filter(record => new Date(record.date) >= cutoffDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (recentRecords.length === 0) {
        return {
          exerciseName,
          totalSessions: 0,
          trend: 'no_recent_data',
          progression: [],
        };
      }

      // Calculate trend (comparing first vs last)
      const firstRecord = recentRecords[0];
      const lastRecord = recentRecords[recentRecords.length - 1];
      const weightChange = lastRecord.weight - firstRecord.weight;
      const volumeChange = lastRecord.volume - firstRecord.volume;

      let trend = 'stable';
      if (weightChange > 0 || volumeChange > 5) trend = 'improving';
      if (weightChange < 0 && volumeChange < -5) trend = 'declining';

      return {
        exerciseName,
        totalSessions: recentRecords.length,
        trend,
        firstWeight: firstRecord.weight,
        lastWeight: lastRecord.weight,
        weightChange,
        volumeChange,
        progression: recentRecords.map(record => ({
          date: record.date,
          weight: record.weight,
          reps: record.reps,
          volume: record.volume,
        })),
      };
    } catch (error) {
      console.error('Error getting exercise progression:', error);
      return {
        exerciseName,
        totalSessions: 0,
        trend: 'error',
        progression: [],
      };
    }
  }

  // Get all PRs for user (top 5 exercises by volume)
  async getTopExercisePRs(userId = 'guest', limit = 5) {
    try {
      const allProgress = await WorkoutStorageService.getExerciseProgress(userId);

      if (!allProgress || Object.keys(allProgress).length === 0) {
        return [];
      }

      // Calculate total volume for each exercise and get PR
      const exercisesWithPRs = await Promise.all(
        Object.entries(allProgress).map(async ([exerciseKey, exerciseData]) => {
          const totalVolume = exerciseData.records.reduce((sum, record) => sum + record.volume, 0);
          const pr = await this.getExercisePR(exerciseData.name, userId, 'weight');

          return {
            name: exerciseData.name,
            equipment: exerciseData.equipment,
            totalVolume,
            totalSessions: exerciseData.records.length,
            pr,
          };
        })
      );

      // Sort by total volume and return top N
      return exercisesWithPRs
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top exercise PRs:', error);
      return [];
    }
  }

  // Build context for specific screen
  async buildContextForScreen(screenName) {
    this.setScreen(screenName);

    const baseContext = await this.getFullContext();

    // Add screen-specific context
    let specificContext = {};
    if (screenName?.includes('Workout')) {
      specificContext = await this.getWorkoutContext();
    } else if (screenName?.includes('Nutrition') || screenName?.includes('Food')) {
      specificContext = await this.getNutritionContext();
    } else if (screenName?.includes('Progress')) {
      specificContext = await this.getProgressContext();
    }

    return {
      ...baseContext,
      screenSpecific: specificContext,
    };
  }
}

export default new ContextManager();
