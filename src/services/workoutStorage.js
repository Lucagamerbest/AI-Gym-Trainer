import AsyncStorage from '@react-native-async-storage/async-storage';

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

      // Add new records from all sets with weight and reps data
      const validSets = exerciseData.sets.filter(set => set.weight && set.reps);

      validSets.forEach(set => {
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
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const weekWorkouts = history.filter(w => new Date(w.date) >= sevenDaysAgo);
          return weekWorkouts.length;

        case 'streak':
          // For streak goals
          return stats.currentStreak || 0;

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
        { id: 'workout_10', icon: '💪', title: 'Getting Started', description: 'Complete 10 workouts', category: 'milestones', requirement: 10, type: 'workouts' },
        { id: 'workout_25', icon: '🔥', title: 'Quarter Century', description: 'Complete 25 workouts', category: 'milestones', requirement: 25, type: 'workouts' },
        { id: 'workout_50', icon: '⭐', title: 'Half Century', description: 'Complete 50 workouts', category: 'milestones', requirement: 50, type: 'workouts' },
        { id: 'workout_100', icon: '💯', title: 'Century Club', description: 'Complete 100 workouts', category: 'milestones', requirement: 100, type: 'workouts' },
        { id: 'workout_250', icon: '🏆', title: 'Elite Lifter', description: 'Complete 250 workouts', category: 'milestones', requirement: 250, type: 'workouts' },

        // Streak Achievements
        { id: 'streak_3', icon: '🔥', title: 'Hot Streak', description: 'Maintain a 3-day streak', category: 'consistency', requirement: 3, type: 'streak' },
        { id: 'streak_7', icon: '📅', title: 'One Week Warrior', description: 'Maintain a 7-day streak', category: 'consistency', requirement: 7, type: 'streak' },
        { id: 'streak_14', icon: '💪', title: 'Two Week Wonder', description: 'Maintain a 14-day streak', category: 'consistency', requirement: 14, type: 'streak' },
        { id: 'streak_30', icon: '🌟', title: 'Monthly Master', description: 'Maintain a 30-day streak', category: 'consistency', requirement: 30, type: 'streak' },
        { id: 'streak_100', icon: '👑', title: 'Unstoppable', description: 'Maintain a 100-day streak', category: 'consistency', requirement: 100, type: 'streak' },

        // Volume Achievements
        { id: 'volume_10k', icon: '📊', title: 'Volume Starter', description: 'Lift 10,000 lbs total', category: 'strength', requirement: 10000, type: 'volume' },
        { id: 'volume_50k', icon: '💪', title: 'Volume Crusher', description: 'Lift 50,000 lbs total', category: 'strength', requirement: 50000, type: 'volume' },
        { id: 'volume_100k', icon: '🏋️', title: 'Six Figure Lifter', description: 'Lift 100,000 lbs total', category: 'strength', requirement: 100000, type: 'volume' },
        { id: 'volume_500k', icon: '⚡', title: 'Volume Beast', description: 'Lift 500,000 lbs total', category: 'strength', requirement: 500000, type: 'volume' },
        { id: 'volume_1m', icon: '👑', title: 'Million Pound Club', description: 'Lift 1,000,000 lbs total', category: 'strength', requirement: 1000000, type: 'volume' },

        // Special Achievements
        { id: 'early_bird', icon: '🌅', title: 'Early Bird', description: 'Complete a workout before 7 AM', category: 'special', requirement: 1, type: 'early_workout' },
        { id: 'night_owl', icon: '🦉', title: 'Night Owl', description: 'Complete a workout after 10 PM', category: 'special', requirement: 1, type: 'late_workout' },
        { id: 'goal_achiever', icon: '🎯', title: 'Goal Achiever', description: 'Complete your first goal', category: 'special', requirement: 1, type: 'completed_goal' },
        { id: 'dedication', icon: '💎', title: 'Dedication', description: 'Work out 4 times in one week', category: 'special', requirement: 4, type: 'weekly_workouts' },
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

          case 'late_workout':
            shouldUnlock = history.some(w => {
              const hour = new Date(w.startTime).getHours();
              return hour >= 22;
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
}