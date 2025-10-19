import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutStorageService } from '../workoutStorage';
import WorkoutSyncService from '../backend/WorkoutSyncService';
import MealSyncService from '../backend/MealSyncService';
import BackendService from '../backend/BackendService';
import ProgressiveOverloadService from './ProgressiveOverloadService';
import VolumeTrackingService from './VolumeTrackingService';

/**
 * ProactiveAIService - Detects key moments and suggests when AI should offer help
 *
 * Key Moments:
 * - Workout just completed
 * - PR just achieved
 * - Low on calories/protein
 * - Consistency opportunities
 */

class ProactiveAIService {
  constructor() {
    this.lastCheckedWorkout = null;
    this.lastCheckedNutrition = null;
    this.dismissedSuggestions = new Set();
  }

  // Check if workout was just completed (within last 2 minutes)
  async checkWorkoutCompletion(userId) {
    try {
      // Get workouts from Firebase
      let workouts = [];
      try {
        workouts = await WorkoutSyncService.getAllWorkouts(20);
      } catch (error) {
        console.log('⚠️ Could not fetch workouts from Firebase');
        return null;
      }
      if (!workouts || workouts.length === 0) return null;

      const latestWorkout = workouts[0];
      const completedAt = new Date(latestWorkout.endTime || latestWorkout.date);
      const now = new Date();
      const minutesAgo = (now - completedAt) / 1000 / 60;

      // If completed within last 2 minutes and we haven't shown this yet
      if (minutesAgo <= 2 && this.lastCheckedWorkout !== latestWorkout.id) {
        this.lastCheckedWorkout = latestWorkout.id;

        return {
          type: 'workout_complete',
          title: '🎉 Workout Complete!',
          message: 'Great job finishing your workout! Want me to analyze your performance?',
          action: 'analyze_workout',
          data: latestWorkout,
          priority: 'high',
        };
      }
    } catch (error) {
      console.log('Error checking workout completion:', error);
    }
    return null;
  }

  // Check if user just hit a PR (within last 5 minutes)
  async checkPRDetection(userId) {
    try {
      // Get workouts from Firebase
      let workouts = [];
      try {
        workouts = await WorkoutSyncService.getAllWorkouts(100);
      } catch (error) {
        console.log('⚠️ Could not fetch workouts from Firebase');
        return null;
      }
      if (!workouts || workouts.length === 0) return null;

      const latestWorkout = workouts[0];
      const completedAt = new Date(latestWorkout.endTime || latestWorkout.date);
      const now = new Date();
      const minutesAgo = (now - completedAt) / 1000 / 60;

      // Only check recent workouts
      if (minutesAgo > 5) return null;

      // Check each exercise for PRs
      if (latestWorkout.exercises) {
        for (const exercise of latestWorkout.exercises) {
          // Calculate historical max from all workouts (not using AsyncStorage)
          let historicalMax = 0;
          workouts.forEach(workout => {
            workout.exercises?.forEach(ex => {
              if (ex.name === exercise.name) {
                ex.sets?.forEach(set => {
                  if (set.weight) {
                    historicalMax = Math.max(historicalMax, parseFloat(set.weight));
                  }
                });
              }
            });
          });

          if (exercise.sets && exercise.sets.length > 0) {
            // Find max weight in this workout
            const maxWeightInWorkout = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
            const maxRepsAtMaxWeight = Math.max(
              ...exercise.sets.filter(s => parseFloat(s.weight) === maxWeightInWorkout).map(s => parseInt(s.reps) || 0)
            );

            // Compare to historical max
            if (historicalMax > 0 && maxWeightInWorkout > historicalMax) {
              const suggestionKey = `pr_${exercise.name}_${maxWeightInWorkout}`;
              if (!this.dismissedSuggestions.has(suggestionKey)) {
                this.dismissedSuggestions.add(suggestionKey);

                return {
                  type: 'pr_achieved',
                  title: '🏆 New PR!',
                  message: `You just hit a new PR on ${exercise.name}: ${maxWeightInWorkout} lbs! Should I suggest your next goal?`,
                  action: 'celebrate_pr',
                  data: {
                    exercise: exercise.name,
                    newPR: maxWeightInWorkout,
                    reps: maxRepsAtMaxWeight,
                    oldPR: historicalMax,
                  },
                  priority: 'high',
                };
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('Error checking PR:', error);
    }
    return null;
  }

  // Check nutrition status (low calories, low protein)
  async checkNutritionAlerts(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();

      // Get today's meals from Firebase
      let meals = [];
      try {
        meals = await MealSyncService.getMealsByDate(userId, today);
      } catch (error) {
        console.log('⚠️ Could not fetch meals from Firebase');
        return null;
      }

      if (!meals || meals.length === 0) return null;

      // Calculate consumed totals
      let totalCalories = 0;
      let totalProtein = 0;
      meals.forEach(meal => {
        totalCalories += meal.calories_consumed || meal.calories || 0;
        totalProtein += meal.protein_consumed || meal.protein || 0;
      });

      // Get user goals from Firebase
      let goals = { calories: 2000, protein: 150 };
      try {
        const userProfile = await BackendService.getUserProfile(userId);
        if (userProfile && userProfile.goals) {
          goals = {
            calories: userProfile.goals.targetCalories || userProfile.goals.calories || 2000,
            protein: userProfile.goals.proteinGrams || userProfile.goals.protein || 150,
          };
        }
      } catch (error) {
        console.log('⚠️ Could not fetch goals from Firebase');
        return null;
      }

      const consumed = { calories: totalCalories, protein: totalProtein };

      const remaining = {
        calories: goals.calories - consumed.calories,
        protein: goals.protein - consumed.protein,
      };

      // Alert if it's evening (after 6pm) and significantly under goals
      if (currentHour >= 18) {
        const caloriesPercent = (consumed.calories / goals.calories) * 100;
        const proteinPercent = (consumed.protein / goals.protein) * 100;

        // Under 70% of daily goals
        if (caloriesPercent < 70 || proteinPercent < 70) {
          const suggestionKey = `nutrition_low_${today}`;
          if (!this.dismissedSuggestions.has(suggestionKey)) {
            this.dismissedSuggestions.add(suggestionKey);

            return {
              type: 'nutrition_alert',
              title: '🍽️ Nutrition Check',
              message: `You have ${Math.round(remaining.calories)} cal and ${Math.round(remaining.protein)}g protein left today. Need meal ideas?`,
              action: 'suggest_meal',
              data: { remaining, consumed, goals },
              priority: 'medium',
            };
          }
        }
      }
    } catch (error) {
      console.log('Error checking nutrition:', error);
    }
    return null;
  }

  // Check workout consistency (remind if haven't worked out in a while)
  async checkWorkoutConsistency(userId) {
    try {
      // Get workouts from Firebase
      let workouts = [];
      try {
        workouts = await WorkoutSyncService.getAllWorkouts(20);
      } catch (error) {
        console.log('⚠️ Could not fetch workouts from Firebase');
        return null;
      }
      if (!workouts || workouts.length === 0) return null;

      const latestWorkout = workouts[0];
      const lastWorkoutDate = new Date(latestWorkout.endTime || latestWorkout.date);
      const now = new Date();
      const daysAgo = (now - lastWorkoutDate) / 1000 / 60 / 60 / 24;

      // If haven't worked out in 3+ days
      if (daysAgo >= 3) {
        const suggestionKey = `consistency_${now.toISOString().split('T')[0]}`;
        if (!this.dismissedSuggestions.has(suggestionKey)) {
          this.dismissedSuggestions.add(suggestionKey);

          return {
            type: 'consistency_reminder',
            title: '💪 Ready to Train?',
            message: `It's been ${Math.floor(daysAgo)} days since your last workout. Want help planning your next session?`,
            action: 'plan_workout',
            data: { daysAgo: Math.floor(daysAgo), lastWorkout: latestWorkout },
            priority: 'low',
          };
        }
      }
    } catch (error) {
      console.log('Error checking consistency:', error);
    }
    return null;
  }

  // Check progressive overload opportunities
  async checkProgressiveOverload(userId) {
    try {
      const readyToProgress = await ProgressiveOverloadService.findReadyToProgress(userId);

      if (readyToProgress && readyToProgress.length > 0) {
        // Take the top recommendation (highest confidence)
        const top = readyToProgress[0];
        const suggestionKey = `overload_${top.exerciseName}_${top.suggestedWeight}`;

        if (!this.dismissedSuggestions.has(suggestionKey)) {
          this.dismissedSuggestions.add(suggestionKey);

          return {
            type: 'progressive_overload',
            title: '📈 Ready to Progress!',
            message: `${top.exerciseName}: ${top.reason}. Try ${top.suggestedWeight} lbs next session!`,
            action: 'suggest_progression',
            data: {
              exercise: top.exerciseName,
              currentWeight: top.currentWeight,
              suggestedWeight: top.suggestedWeight,
              increase: top.increase,
              confidence: top.confidence,
              allRecommendations: readyToProgress,
            },
            priority: 'high',
          };
        }
      }
    } catch (error) {
      console.log('Error checking progressive overload:', error);
    }
    return null;
  }

  // Check volume imbalances
  async checkVolumeBalance(userId) {
    try {
      const imbalances = await VolumeTrackingService.detectImbalances(userId);

      if (imbalances && imbalances.length > 0) {
        // Take the highest severity imbalance
        const top = imbalances[0];
        const suggestionKey = `volume_${top.type}_${new Date().toISOString().split('T')[0]}`;

        if (!this.dismissedSuggestions.has(suggestionKey)) {
          this.dismissedSuggestions.add(suggestionKey);

          return {
            type: 'volume_imbalance',
            title: '⚖️ Volume Imbalance',
            message: `${top.message}. ${top.recommendation}`,
            action: 'fix_volume',
            data: {
              imbalanceType: top.type,
              severity: top.severity,
              musclesAffected: top.musclesAffected,
              recommendation: top.recommendation,
              allImbalances: imbalances,
            },
            priority: top.severity === 'HIGH' ? 'high' : 'medium',
          };
        }
      }
    } catch (error) {
      console.log('Error checking volume balance:', error);
    }
    return null;
  }

  // Get all active suggestions
  async getAllSuggestions(userId) {
    try {
      const suggestions = await Promise.all([
        this.checkWorkoutCompletion(userId),
        this.checkPRDetection(userId),
        this.checkNutritionAlerts(userId),
        this.checkWorkoutConsistency(userId),
        this.checkProgressiveOverload(userId),
        this.checkVolumeBalance(userId),
      ]);

      // Filter out nulls and sort by priority
      const activeSuggestions = suggestions.filter(s => s !== null);

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      activeSuggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return activeSuggestions;
    } catch (error) {
      console.log('Error getting suggestions:', error);
      return [];
    }
  }

  // Dismiss a suggestion so it doesn't show again
  dismissSuggestion(suggestionType, suggestionId) {
    const key = `${suggestionType}_${suggestionId}`;
    this.dismissedSuggestions.add(key);
  }

  // Clear dismissed suggestions (reset daily)
  clearDismissed() {
    this.dismissedSuggestions.clear();
  }

  // Get AI prompt for suggestion
  getSuggestionPrompt(suggestion) {
    switch (suggestion.action) {
      case 'analyze_workout':
        return `I just completed a workout: ${suggestion.data.title}. Can you analyze my performance and give me feedback?`;

      case 'celebrate_pr':
        return `I just hit a new PR on ${suggestion.data.exercise}: ${suggestion.data.newPR} lbs × ${suggestion.data.reps} reps (previous: ${suggestion.data.oldPR} lbs). What should my next goal be?`;

      case 'suggest_meal':
        return `I have ${Math.round(suggestion.data.remaining.calories)} calories and ${Math.round(suggestion.data.remaining.protein)}g protein left today. What should I eat?`;

      case 'plan_workout':
        return `It's been ${suggestion.data.daysAgo} days since my last workout. Can you help me plan my next session?`;

      case 'suggest_progression':
        return `I'm ready to progress on ${suggestion.data.exercise}! Currently doing ${suggestion.data.currentWeight} lbs. Should I jump to ${suggestion.data.suggestedWeight} lbs? What rep scheme should I use?`;

      case 'fix_volume':
        return `${suggestion.data.recommendation}. What exercises should I add and how many sets?`;

      default:
        return suggestion.message;
    }
  }
}

export default new ProactiveAIService();
