import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutStorageService } from '../workoutStorage';
import WorkoutSyncService from '../backend/WorkoutSyncService';
import MealSyncService from '../backend/MealSyncService';
import BackendService from '../backend/BackendService';
import ProgressSyncService from '../backend/ProgressSyncService';
import { getUserProfileSummary } from '../userProfileAssessment';

class ContextManager {
  constructor() {
    this.currentScreen = null;
    this.currentActivity = null;
    this.screenData = {};

  }

  // Set current screen context
  setScreen(screenName, data = {}) {
    this.currentScreen = screenName;
    this.screenData = data;

  }

  // Set current activity
  setActivity(activity) {
    this.currentActivity = activity;

  }

  // Get full context for AI (OPTIMIZED for speed)
  async getFullContext(userId = 'guest') {


    // Get user profile summary (lightweight, critical for personalization)
    const userProfile = await getUserProfileSummary();

    // Skip heavy data fetching for faster responses
    const context = {
      screen: this.currentScreen,
      activity: this.currentActivity,
      screenData: this.screenData,
      userProfile: userProfile, // PERSONALIZATION: AI coach knows the user
      // userData: await this.getUserData(), // SKIP for speed
      recentActivity: await this.getRecentActivity(),
      topExercises: await this.getTopExercisePRs(userId, 2), // Top 2 only (SPEED)
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

  // Get recent user activity (last 7 days) - MINIMAL for speed
  async getRecentActivity() {
    try {
      // Get workouts from Firebase
      let allWorkouts = [];
      try {
        allWorkouts = await WorkoutSyncService.getAllWorkouts(100);

      } catch (error) {

      }

      const lastWorkout = allWorkouts.length > 0
        ? allWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        : null;

      const daysSince = lastWorkout
        ? Math.floor((new Date() - new Date(lastWorkout.date)) / (1000 * 60 * 60 * 24))
        : null;

      let lastWorkoutText = 'No workouts yet';
      if (lastWorkout) {
        if (daysSince === 0) lastWorkoutText = `Today - ${lastWorkout.workoutTitle}`;
        else if (daysSince === 1) lastWorkoutText = `Yesterday - ${lastWorkout.workoutTitle}`;
        else lastWorkoutText = `${daysSince}d ago - ${lastWorkout.workoutTitle}`;
      }

      // Simple count of recent workouts (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCount = allWorkouts.filter(w => new Date(w.date) >= sevenDaysAgo).length;

      return {
        workouts: recentCount,
        totalVolume: 0, // Skip calculation for speed
        lastWorkout: lastWorkoutText,
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

  async getNutritionContext(userId = 'guest') {
    if (!this.currentScreen?.includes('Nutrition') && !this.currentScreen?.includes('Food')) return {};

    try {


      // Read meals from Firebase
      const today = new Date().toISOString().split('T')[0];
      let meals = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      if (userId && userId !== 'guest') {
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, today);

          // Convert Firebase meals to array and calculate totals
          meals = firebaseMeals.map(meal => ({
            name: meal.food_name || 'Unknown',
            calories: meal.calories_consumed || 0,
            protein: meal.protein_consumed || 0,
            carbs: meal.carbs_consumed || 0,
            fat: meal.fat_consumed || 0,
          }));

          // Calculate totals
          meals.forEach(meal => {
            totalCalories += meal.calories;
            totalProtein += meal.protein;
            totalCarbs += meal.carbs;
            totalFat += meal.fat;
          });


        } catch (error) {

        }
      }



      // Get goals from Firebase
      let goals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };
      if (userId && userId !== 'guest') {
        try {
          const firebaseProfile = await BackendService.getUserProfile(userId);
          if (firebaseProfile && firebaseProfile.goals) {
            goals = {
              calories: firebaseProfile.goals.targetCalories || firebaseProfile.goals.calories || 2000,
              protein: firebaseProfile.goals.proteinGrams || firebaseProfile.goals.protein || 150,
              carbs: firebaseProfile.goals.carbsGrams || firebaseProfile.goals.carbs || 200,
              fat: firebaseProfile.goals.fatGrams || firebaseProfile.goals.fat || 65,
            };
          }
        } catch (error) {

        }
      }


      // Note: goals structure is { calories, protein, carbs, fat } not { calorieGoal, proteinGoal, ... }
      const calorieGoal = goals?.calories || 2000;
      const proteinGoal = goals?.protein || 150;
      const carbsGoal = goals?.carbs || 200;
      const fatGoal = goals?.fat || 65;

      const caloriesConsumed = Math.round(totalCalories);
      const caloriesTarget = calorieGoal;
      const caloriesRemaining = Math.round(calorieGoal - totalCalories);

      const nutritionContext = {
        todaysMeals: meals.length,
        meals: meals.map(meal => ({
          name: meal.name || 'Unknown',
          calories: Math.round(meal.calories || 0),
          protein: Math.round(meal.protein || 0),
          carbs: Math.round(meal.carbs || 0),
          fat: Math.round(meal.fat || 0),
        })),
        calories: {
          consumed: caloriesConsumed,
          target: caloriesTarget,
          remaining: caloriesRemaining,
          percentage: Math.round((totalCalories / calorieGoal) * 100),
        },
        protein: {
          consumed: Math.round(totalProtein),
          target: proteinGoal,
          remaining: Math.round(proteinGoal - totalProtein),
          percentage: Math.round((totalProtein / proteinGoal) * 100),
        },
        carbs: {
          consumed: Math.round(totalCarbs),
          target: carbsGoal,
          remaining: Math.round(carbsGoal - totalCarbs),
          percentage: Math.round((totalCarbs / carbsGoal) * 100),
        },
        fat: {
          consumed: Math.round(totalFat),
          target: fatGoal,
          remaining: Math.round(fatGoal - totalFat),
          percentage: Math.round((totalFat / fatGoal) * 100),
        },
      };

      return nutritionContext;
    } catch (error) {
      console.error('❌ Error getting nutrition context:', error);
      return {};
    }
  }

  async getProgressContext(userId = 'guest') {
    if (!this.currentScreen?.includes('Progress')) return {};

    try {
      // Get progress entries from Firebase
      let entries = [];
      try {
        entries = await ProgressSyncService.getAllProgress(userId, 100);

      } catch (error) {

      }

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
  async getAllWorkoutHistory(userId = 'guest', limit = 3) {
    try {

      let allWorkouts = [];
      try {
        allWorkouts = await WorkoutSyncService.getAllWorkouts(100);

      } catch (error) {

      }


      // Format for AI consumption - LIMIT to recent workouts for speed
      return allWorkouts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit) // Only send recent 3 workouts to AI for faster responses
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
  async getAllExerciseProgress(userId = 'guest', limit = 3) {
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
            allRecords: records.slice(-limit), // Only send last 3 records per exercise (SPEED OPTIMIZATION)
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
      // Get workouts from Firebase
      let allWorkouts = [];
      try {
        allWorkouts = await WorkoutSyncService.getAllWorkouts(100);

      } catch (error) {

      }
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
      // Get exercise history from Firebase workouts
      const history = await this.getExerciseHistory(exerciseName, userId, 100);

      if (!history || history.length === 0) {

        return null;
      }



      // Extract all sets from all workouts into flat list of records
      const records = [];
      history.forEach(workout => {
        workout.sets.forEach(set => {
          if (set.weight && set.reps) {
            records.push({
              weight: parseFloat(set.weight),
              reps: parseInt(set.reps),
              volume: parseFloat(set.weight) * parseInt(set.reps),
              date: workout.date,
            });
          }
        });
      });

      if (records.length === 0) {

        return null;
      }

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
      // Get exercise history from Firebase workouts
      const history = await this.getExerciseHistory(exerciseName, userId, 100);

      if (!history || history.length === 0) {
        return {
          exerciseName,
          totalSessions: 0,
          trend: 'no_data',
          progression: [],
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Extract all sets from recent workouts
      const recentRecords = [];
      history
        .filter(workout => new Date(workout.date) >= cutoffDate)
        .forEach(workout => {
          workout.sets.forEach(set => {
            if (set.weight && set.reps) {
              recentRecords.push({
                date: workout.date,
                weight: parseFloat(set.weight),
                reps: parseInt(set.reps),
                volume: parseFloat(set.weight) * parseInt(set.reps),
              });
            }
          });
        });

      if (recentRecords.length === 0) {
        return {
          exerciseName,
          totalSessions: 0,
          trend: 'no_recent_data',
          progression: [],
        };
      }

      // Sort by date
      recentRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

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
        progression: recentRecords,
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

  // Get top exercises (simplified for speed)
  async getTopExercisePRs(userId = 'guest', limit = 2) {
    try {
      // Get all workouts from Firebase
      let allWorkouts = [];
      try {
        allWorkouts = await WorkoutSyncService.getAllWorkouts(100);
      } catch (error) {

        return [];
      }

      if (allWorkouts.length === 0) {
        return [];
      }

      // Calculate exercise stats from workouts
      const exerciseStats = {};

      allWorkouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          const exerciseName = exercise.name;
          if (!exerciseStats[exerciseName]) {
            exerciseStats[exerciseName] = {
              name: exerciseName,
              totalVolume: 0,
              maxWeight: 0,
              maxReps: 0,
            };
          }

          exercise.sets?.forEach(set => {
            if (set.weight && set.reps) {
              const weight = parseFloat(set.weight);
              const reps = parseInt(set.reps);
              const volume = weight * reps;

              exerciseStats[exerciseName].totalVolume += volume;
              exerciseStats[exerciseName].maxWeight = Math.max(exerciseStats[exerciseName].maxWeight, weight);
              exerciseStats[exerciseName].maxReps = Math.max(exerciseStats[exerciseName].maxReps, reps);
            }
          });
        });
      });

      // Convert to array and add PR display
      const exercises = Object.values(exerciseStats).map(ex => ({
        name: ex.name,
        pr: { display: `${ex.maxWeight} lbs × ${ex.maxReps} reps` },
        totalVolume: ex.totalVolume,
      }));

      // Sort by total volume and return top N
      return exercises
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top exercise PRs:', error);
      return [];
    }
  }

  // Build context for specific screen
  async buildContextForScreen(screenName, userId = 'guest') {
    this.setScreen(screenName);

    const baseContext = await this.getFullContext(userId);

    // Add screen-specific context
    let specificContext = {};
    if (screenName?.includes('Workout')) {
      specificContext = await this.getWorkoutContext();
    } else if (screenName?.includes('Nutrition') || screenName?.includes('Food')) {
      specificContext = await this.getNutritionContext(userId);
    } else if (screenName?.includes('Progress')) {
      specificContext = await this.getProgressContext(userId);
    }

    return {
      ...baseContext,
      userId, // Include userId in context for tool injection
      screenSpecific: specificContext,
    };
  }
}

export default new ContextManager();
