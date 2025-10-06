import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  WORKOUT_HISTORY: 'workout_history',
  EXERCISE_PROGRESS: 'exercise_progress',
  USER_STATS: 'user_stats',
  PLANNED_WORKOUTS: 'planned_workouts'
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
        exercises: workoutData.exercises.map((exercise, index) => ({
          ...exercise,
          sets: exerciseSets[index] || [],
          completedSets: exerciseSets[index]?.filter(set => set.completed).length || 0,
          totalSets: exerciseSets[index]?.length || 0
        }))
      };

      // Save to workout history
      const history = await this.getWorkoutHistory(userId);
      history.push(workout);
      await AsyncStorage.setItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`, JSON.stringify(history));

      // Update exercise progress for each exercise
      for (let i = 0; i < workout.exercises.length; i++) {
        const exercise = workout.exercises[i];
        if (exercise.sets && exercise.sets.length > 0) {
          await this.updateExerciseProgress(exercise, userId);
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
  static async getWorkoutHistory(userId = 'guest') {
    try {
      const history = await AsyncStorage.getItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${userId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      return [];
    }
  }

  // Update progress for a specific exercise
  static async updateExerciseProgress(exerciseData, userId = 'guest') {
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

      // Add new records from completed sets
      const completedSets = exerciseData.sets.filter(set => set.completed && set.weight && set.reps);

      completedSets.forEach(set => {
        progress[exerciseKey].records.push({
          date: new Date().toISOString(),
          weight: parseFloat(set.weight) || 0,
          reps: parseInt(set.reps) || 0,
          volume: (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
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

  // Get progress for a specific exercise
  static async getExerciseProgressByName(exerciseName, userId = 'guest') {
    try {
      const allProgress = await this.getExerciseProgress(userId);
      const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
      return allProgress[exerciseKey] || null;
    } catch (error) {
      return null;
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

      // Calculate total volume
      const workoutVolume = workout.exercises.reduce((total, exercise) => {
        return total + (exercise.sets || []).reduce((exerciseTotal, set) => {
          if (set.completed && set.weight && set.reps) {
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
}