/**
 * ProgressTools - AI tools for progress tracking and predictions
 *
 * These tools help users predict goal completion, analyze progress, and detect plateaus
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutStorageService } from '../../workoutStorage';

/**
 * PREDICT GOAL COMPLETION DATE
 * User says: "When will I hit my goal?" or "How long until I can bench 225?"
 *
 * Analyzes historical progress data and predicts when user will achieve their goal
 */
export async function predictGoalCompletionDate({
  goalType, // 'weight', 'reps', 'volume', 'bodyweight'
  exerciseName = null, // For strength goals
  currentValue = null,
  targetValue,
  userId
}) {
  try {
    console.log('📅 Predicting goal completion date:', {
      goalType,
      exerciseName,
      currentValue,
      targetValue,
      userId
    });

    let progressData = [];
    let progressRate = 0;
    let currentActual = currentValue;
    let unit = '';

    // STRENGTH GOAL (e.g., "Bench 225 lbs")
    if (goalType === 'weight' && exerciseName) {
      unit = 'lbs';

      // Get workout history for this exercise
      const workouts = await WorkoutStorageService.getAllWorkouts(50);

      // Extract max weight over time for this exercise
      const exerciseHistory = [];
      workouts.forEach(workout => {
        if (workout.exercises) {
          const exercise = workout.exercises.find(ex =>
            ex.name.toLowerCase().includes(exerciseName.toLowerCase())
          );

          if (exercise && exercise.sets) {
            const maxWeight = Math.max(
              ...exercise.sets
                .filter(set => set.completed && set.weight)
                .map(set => parseFloat(set.weight) || 0)
            );

            if (maxWeight > 0) {
              exerciseHistory.push({
                date: new Date(workout.date),
                value: maxWeight,
              });
            }
          }
        }
      });

      if (exerciseHistory.length < 2) {
        return {
          success: false,
          message: `Not enough data for ${exerciseName}. You need at least 2 workouts with this exercise to predict progress.`,
        };
      }

      // Sort by date
      exerciseHistory.sort((a, b) => a.date - b.date);
      progressData = exerciseHistory;

      // Get current value
      currentActual = exerciseHistory[exerciseHistory.length - 1].value;

      // Calculate progress rate (linear regression)
      const n = exerciseHistory.length;
      const x = exerciseHistory.map((_, i) => i); // Time indices
      const y = exerciseHistory.map(h => h.value); // Weights

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

      // Get time between workouts (average days)
      const firstDate = exerciseHistory[0].date;
      const lastDate = exerciseHistory[n - 1].date;
      const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      const daysPerWorkout = totalDays / (n - 1);

      // Progress rate in lbs per day
      progressRate = slope / daysPerWorkout;

      if (progressRate <= 0) {
        return {
          success: true,
          message: `⚠️ Your ${exerciseName} hasn't shown progress recently.\n\nCurrent: ${currentActual} lbs\nTarget: ${targetValue} lbs\nGap: ${Math.round(targetValue - currentActual)} lbs\n\n💡 Your progress rate is ${progressRate.toFixed(3)} lbs/day (stalled or declining).\n\nRecommendations:\n• Review your training program\n• Check recovery and nutrition\n• Consider deload week\n• Try progressive overload techniques`,
          data: {
            currentValue: currentActual,
            targetValue,
            gap: targetValue - currentActual,
            progressRate,
            dataPoints: n,
            willReachGoal: false,
          },
        };
      }
    }

    // BODYWEIGHT GOAL (e.g., "Lose 20 lbs")
    else if (goalType === 'bodyweight') {
      unit = 'lbs';

      // Get weight history from progress entries
      const PROGRESS_KEY = '@progress_data';
      const progressStr = await AsyncStorage.getItem(PROGRESS_KEY);
      const allProgress = progressStr ? JSON.parse(progressStr) : [];

      const weightHistory = allProgress
        .filter(p => p.weight)
        .map(p => ({
          date: new Date(p.date),
          value: parseFloat(p.weight),
        }))
        .sort((a, b) => a.date - b.date);

      if (weightHistory.length < 2) {
        return {
          success: false,
          message: "Not enough bodyweight data. Log your weight at least twice to predict progress.",
        };
      }

      progressData = weightHistory;
      currentActual = weightHistory[weightHistory.length - 1].value;

      // Calculate rate of change (lbs per day)
      const firstDate = weightHistory[0].date;
      const lastDate = weightHistory[weightHistory.length - 1].date;
      const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      const totalChange = currentActual - weightHistory[0].value;
      progressRate = totalChange / totalDays;

      if (Math.abs(progressRate) < 0.01) {
        return {
          success: true,
          message: `⚠️ Your bodyweight hasn't changed significantly.\n\nCurrent: ${currentActual} lbs\nTarget: ${targetValue} lbs\nGap: ${Math.abs(targetValue - currentActual)} lbs\n\n💡 Your weight is stable (${progressRate.toFixed(3)} lbs/day).\n\nRecommendations:\n• Adjust calorie intake\n• Increase cardio or resistance training\n• Track macros more carefully`,
          data: {
            currentValue: currentActual,
            targetValue,
            gap: Math.abs(targetValue - currentActual),
            progressRate,
            dataPoints: weightHistory.length,
            willReachGoal: false,
          },
        };
      }
    }

    // VOLUME GOAL (total weekly volume)
    else if (goalType === 'volume') {
      unit = 'lbs';

      const workouts = await WorkoutStorageService.getAllWorkouts(20);

      // Group by week
      const weeklyVolume = {};
      workouts.forEach(workout => {
        if (workout.exercises) {
          const weekStart = new Date(workout.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
          const weekKey = weekStart.toISOString().split('T')[0];

          let totalVolume = 0;
          workout.exercises.forEach(ex => {
            if (ex.sets) {
              ex.sets.forEach(set => {
                if (set.completed && set.weight && set.reps) {
                  totalVolume += parseFloat(set.weight) * parseInt(set.reps);
                }
              });
            }
          });

          weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + totalVolume;
        }
      });

      const volumeHistory = Object.entries(weeklyVolume)
        .map(([week, volume]) => ({
          date: new Date(week),
          value: volume,
        }))
        .sort((a, b) => a.date - b.date);

      if (volumeHistory.length < 2) {
        return {
          success: false,
          message: "Not enough volume data. Complete at least 2 weeks of workouts to predict progress.",
        };
      }

      progressData = volumeHistory;
      currentActual = volumeHistory[volumeHistory.length - 1].value;

      // Calculate rate (volume per week)
      const firstWeek = volumeHistory[0];
      const lastWeek = volumeHistory[volumeHistory.length - 1];
      const totalWeeks = (lastWeek.date - firstWeek.date) / (1000 * 60 * 60 * 24 * 7);
      const totalChange = lastWeek.value - firstWeek.value;
      progressRate = totalChange / totalWeeks; // lbs per week
    }

    else {
      return {
        success: false,
        message: `Goal type "${goalType}" is not supported yet. Supported types: weight, bodyweight, volume`,
      };
    }

    // Calculate prediction
    const gap = targetValue - currentActual;
    const isIncreasing = gap > 0;

    // Check if moving in right direction
    if ((isIncreasing && progressRate <= 0) || (!isIncreasing && progressRate >= 0)) {
      return {
        success: true,
        message: `⚠️ You're moving in the wrong direction!\n\nCurrent: ${currentActual} ${unit}\nTarget: ${targetValue} ${unit}\nProgress Rate: ${progressRate.toFixed(3)} ${unit}/${goalType === 'volume' ? 'week' : 'day'}\n\n💡 To reach your goal, you need to reverse this trend.`,
        data: {
          currentValue: currentActual,
          targetValue,
          gap,
          progressRate,
          dataPoints: progressData.length,
          willReachGoal: false,
        },
      };
    }

    // Calculate days/weeks to goal
    let timeToGoal;
    let timeUnit;

    if (goalType === 'volume') {
      timeToGoal = Math.abs(gap / progressRate); // weeks
      timeUnit = 'weeks';
    } else {
      timeToGoal = Math.abs(gap / progressRate); // days
      timeUnit = 'days';
    }

    // Convert to friendly format
    let friendlyTime;
    if (timeToGoal < 7) {
      friendlyTime = `${Math.round(timeToGoal)} days`;
    } else if (timeToGoal < 60) {
      const weeks = Math.round(timeToGoal / 7);
      friendlyTime = `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.round(timeToGoal / 30);
      friendlyTime = `${months} month${months > 1 ? 's' : ''}`;
    }

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.round(timeToGoal));

    // Build message
    let message = `🎯 Goal Prediction${exerciseName ? ` for ${exerciseName}` : ''}:\n\n`;
    message += `📊 Current: ${Math.round(currentActual)} ${unit}\n`;
    message += `🎯 Target: ${targetValue} ${unit}\n`;
    message += `📈 Gap: ${Math.round(Math.abs(gap))} ${unit}\n\n`;
    message += `⏱️ Progress Rate: ${progressRate.toFixed(2)} ${unit}/${timeUnit === 'weeks' ? 'week' : 'day'}\n`;
    message += `📅 Estimated Completion: ${completionDate.toLocaleDateString()}\n`;
    message += `⏳ Time to Goal: ~${friendlyTime}\n\n`;

    // Confidence assessment
    const dataPoints = progressData.length;
    let confidence;
    if (dataPoints < 5) confidence = 'Low';
    else if (dataPoints < 10) confidence = 'Moderate';
    else confidence = 'High';

    message += `🎲 Confidence: ${confidence} (based on ${dataPoints} data points)\n\n`;

    // Recommendations
    message += `💡 Tips:\n`;
    if (timeToGoal > 90) {
      message += `• This is a long-term goal. Stay consistent!\n`;
      message += `• Set intermediate milestones\n`;
    } else if (timeToGoal < 14) {
      message += `• You're close! Push hard these final weeks\n`;
      message += `• Maintain your current program\n`;
    }

    if (dataPoints < 5) {
      message += `• Keep tracking to improve prediction accuracy\n`;
    }

    return {
      success: true,
      message,
      data: {
        currentValue: Math.round(currentActual),
        targetValue,
        gap: Math.round(Math.abs(gap)),
        progressRate,
        timeToGoalDays: Math.round(timeToGoal),
        completionDate: completionDate.toISOString(),
        friendlyTime,
        confidence,
        dataPoints,
        exerciseName,
        willReachGoal: true,
      },
    };

  } catch (error) {
    console.error('❌ predictGoalCompletionDate error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't predict goal completion. Please try again.",
    };
  }
}

/**
 * DETECT PROGRESS PLATEAU
 * User says: "Am I plateauing?" or "Why isn't my bench increasing?"
 *
 * Analyzes recent performance to detect stalled progress
 */
export async function detectProgressPlateau({
  exerciseName = null,
  metric = 'weight', // 'weight', 'volume', 'reps'
  timeframe = 30, // days
  userId
}) {
  try {
    console.log('🔍 Detecting plateau:', { exerciseName, metric, timeframe });

    const workouts = await WorkoutStorageService.getAllWorkouts(50);

    if (!exerciseName) {
      // Analyze all exercises for plateaus
      const exerciseMap = new Map();

      workouts.forEach(workout => {
        if (workout.exercises) {
          workout.exercises.forEach(ex => {
            if (!exerciseMap.has(ex.name)) {
              exerciseMap.set(ex.name, []);
            }

            const maxWeight = Math.max(
              ...ex.sets
                .filter(set => set.completed && set.weight)
                .map(set => parseFloat(set.weight) || 0)
            );

            if (maxWeight > 0) {
              exerciseMap.get(ex.name).push({
                date: new Date(workout.date),
                weight: maxWeight,
              });
            }
          });
        }
      });

      // Check each exercise for plateau
      const plateaus = [];
      exerciseMap.forEach((history, name) => {
        if (history.length >= 3) {
          // Filter to timeframe
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - timeframe);
          const recentHistory = history.filter(h => h.date >= cutoffDate);

          if (recentHistory.length >= 3) {
            const values = recentHistory.map(h => h.weight);
            const avg = values.reduce((a, b) => a + b) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            // Plateau if standard deviation is very low (< 5% of mean)
            if (stdDev < avg * 0.05) {
              plateaus.push({
                exercise: name,
                avgWeight: Math.round(avg),
                variance: stdDev.toFixed(2),
                sessions: recentHistory.length,
              });
            }
          }
        }
      });

      if (plateaus.length === 0) {
        return {
          success: true,
          message: `✅ No plateaus detected in the last ${timeframe} days!\n\nYou're making progress. Keep it up!`,
          data: {
            plateaus: [],
            timeframe,
          },
        };
      }

      let message = `⚠️ Detected ${plateaus.length} plateau(s) in last ${timeframe} days:\n\n`;
      plateaus.forEach(p => {
        message += `• ${p.exercise}: ~${p.avgWeight} lbs (${p.sessions} sessions, very low variance)\n`;
      });

      message += `\n💡 Recommendations:\n`;
      message += `• Try progressive overload (add 5 lbs or 1 rep)\n`;
      message += `• Consider deload week\n`;
      message += `• Change exercise variation\n`;
      message += `• Check recovery and nutrition\n`;

      return {
        success: true,
        message,
        data: {
          plateaus,
          timeframe,
        },
      };
    }

    // Specific exercise plateau detection
    const exerciseHistory = [];
    workouts.forEach(workout => {
      if (workout.exercises) {
        const exercise = workout.exercises.find(ex =>
          ex.name.toLowerCase().includes(exerciseName.toLowerCase())
        );

        if (exercise && exercise.sets) {
          const maxWeight = Math.max(
            ...exercise.sets
              .filter(set => set.completed && set.weight)
              .map(set => parseFloat(set.weight) || 0)
          );

          if (maxWeight > 0) {
            exerciseHistory.push({
              date: new Date(workout.date),
              weight: maxWeight,
            });
          }
        }
      }
    });

    if (exerciseHistory.length < 3) {
      return {
        success: false,
        message: `Not enough data for ${exerciseName}. Need at least 3 sessions to detect plateau.`,
      };
    }

    // Filter to timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframe);
    const recentHistory = exerciseHistory
      .filter(h => h.date >= cutoffDate)
      .sort((a, b) => a.date - b.date);

    if (recentHistory.length < 3) {
      return {
        success: false,
        message: `Not enough recent data for ${exerciseName} in last ${timeframe} days.`,
      };
    }

    const values = recentHistory.map(h => h.weight);
    const avg = values.reduce((a, b) => a + b) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    const trend = secondAvg - firstAvg;

    let message = `📊 Plateau Analysis for ${exerciseName}:\n\n`;
    message += `📈 Last ${timeframe} days (${recentHistory.length} sessions):\n`;
    message += `• Average: ${Math.round(avg)} lbs\n`;
    message += `• Range: ${min} - ${max} lbs (${range} lbs)\n`;
    message += `• Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)} lbs ${trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'}\n\n`;

    const isPlateau = range < avg * 0.1 && Math.abs(trend) < 2.5; // Less than 10% range and minimal trend

    if (isPlateau) {
      message += `⚠️ PLATEAU DETECTED\n\n`;
      message += `Your ${exerciseName} hasn't progressed significantly.\n\n`;
      message += `💡 Break Through Strategies:\n`;
      message += `1. Add 5 lbs and reduce reps temporarily\n`;
      message += `2. Try different rep ranges (5x5, 3x8, etc.)\n`;
      message += `3. Add pause reps or tempo training\n`;
      message += `4. Take a deload week (50-60% weight)\n`;
      message += `5. Check sleep, nutrition, and recovery\n`;
      message += `6. Try exercise variations\n`;
    } else {
      message += `✅ NO PLATEAU\n\n`;
      message += `You're still making progress! ${trend > 0 ? 'Keep pushing!' : 'Consider increasing intensity.'}\n`;
    }

    return {
      success: true,
      message,
      data: {
        exercise: exerciseName,
        sessions: recentHistory.length,
        average: Math.round(avg),
        range,
        trend,
        isPlateau,
        timeframe,
      },
    };

  } catch (error) {
    console.error('❌ detectProgressPlateau error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't detect plateau. Please try again.",
    };
  }
}

/**
 * ESTIMATE BODY FAT PERCENTAGE
 * User says: "What's my body fat percentage?" or "Estimate my body fat"
 *
 * Uses Navy Method (circumference measurements) or AI visual estimation from photos
 */
export async function estimateBodyFatPercentage({
  gender,
  weight = null, // lbs
  height = null, // inches
  waist = null, // inches
  neck = null, // inches
  hips = null, // inches (females only)
  age = null,
  usePhotos = false,
  userId
}) {
  try {
    console.log('📏 Estimating body fat percentage:', {
      gender,
      weight,
      height,
      waist,
      neck,
      hips,
      age,
      usePhotos
    });

    // Load user profile if measurements not provided
    const PROFILE_KEY = '@user_profile_assessment';
    const profileStr = await AsyncStorage.getItem(PROFILE_KEY);
    const profile = profileStr ? JSON.parse(profileStr) : {};

    // Fill in missing values from profile
    if (!gender) gender = profile.gender;
    if (!weight) weight = profile.currentWeight;
    if (!height) height = profile.height;
    if (!age) age = profile.age;

    if (!gender) {
      return {
        success: false,
        message: "Please specify your gender (required for body fat calculation).",
      };
    }

    // METHOD 1: Navy Method (circumference measurements)
    if (waist && neck && (!gender.includes('female') || hips)) {
      console.log('Using Navy Method for body fat calculation');

      let bodyFat;

      if (gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) {
        // Male formula
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      } else {
        // Female formula
        if (!hips) {
          return {
            success: false,
            message: "Hip measurement required for female body fat calculation.",
          };
        }
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(height)) - 450;
      }

      // Ensure reasonable range
      bodyFat = Math.max(3, Math.min(50, bodyFat));

      // Get category
      let category, categoryIcon, description;
      if (gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) {
        if (bodyFat < 6) {
          category = 'Essential Fat';
          categoryIcon = '⚠️';
          description = 'Below minimum healthy range';
        } else if (bodyFat < 14) {
          category = 'Athletic';
          categoryIcon = '💪';
          description = 'Very lean, athletic physique';
        } else if (bodyFat < 18) {
          category = 'Fitness';
          categoryIcon = '✅';
          description = 'Fit and healthy';
        } else if (bodyFat < 25) {
          category = 'Average';
          categoryIcon = '📊';
          description = 'Average body composition';
        } else {
          category = 'Above Average';
          categoryIcon = '⚠️';
          description = 'Consider reducing body fat';
        }
      } else {
        if (bodyFat < 14) {
          category = 'Essential Fat';
          categoryIcon = '⚠️';
          description = 'Below minimum healthy range';
        } else if (bodyFat < 21) {
          category = 'Athletic';
          categoryIcon = '💪';
          description = 'Very lean, athletic physique';
        } else if (bodyFat < 25) {
          category = 'Fitness';
          categoryIcon = '✅';
          description = 'Fit and healthy';
        } else if (bodyFat < 32) {
          category = 'Average';
          categoryIcon = '📊';
          description = 'Average body composition';
        } else {
          category = 'Above Average';
          categoryIcon = '⚠️';
          description = 'Consider reducing body fat';
        }
      }

      // Calculate fat mass and lean mass
      let fatMass = 0, leanMass = 0;
      if (weight) {
        fatMass = weight * (bodyFat / 100);
        leanMass = weight - fatMass;
      }

      let message = `📏 Body Fat Estimate (Navy Method):\n\n`;
      message += `${categoryIcon} ${bodyFat.toFixed(1)}% - ${category}\n`;
      message += `${description}\n\n`;

      message += `Measurements Used:\n`;
      message += `• Waist: ${waist}"\n`;
      message += `• Neck: ${neck}"\n`;
      if (hips) message += `• Hips: ${hips}"\n`;
      if (height) message += `• Height: ${height}"\n\n`;

      if (weight) {
        message += `Body Composition:\n`;
        message += `• Total Weight: ${weight} lbs\n`;
        message += `• Fat Mass: ${fatMass.toFixed(1)} lbs\n`;
        message += `• Lean Mass: ${leanMass.toFixed(1)} lbs\n\n`;
      }

      message += `💡 Accuracy Note:\n`;
      message += `The Navy Method is reasonably accurate (±3-4%) for most people. For best results, measure consistently (same time of day, relaxed state).\n`;

      return {
        success: true,
        message,
        data: {
          bodyFatPercentage: parseFloat(bodyFat.toFixed(1)),
          category,
          method: 'Navy Method',
          measurements: { waist, neck, hips, height },
          fatMass: weight ? parseFloat(fatMass.toFixed(1)) : null,
          leanMass: weight ? parseFloat(leanMass.toFixed(1)) : null,
          totalWeight: weight,
        },
      };
    }

    // METHOD 2: AI Visual Estimation (from progress photos)
    else if (usePhotos) {
      console.log('Using AI visual estimation from photos');

      // Load progress photos
      const PROGRESS_KEY = '@progress_data';
      const progressStr = await AsyncStorage.getItem(PROGRESS_KEY);
      const allProgress = progressStr ? JSON.parse(progressStr) : [];

      // Find most recent entry with photos
      const recentWithPhotos = allProgress
        .filter(p => p.photos && (p.photos.front || p.photos.side || p.photos.back))
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (!recentWithPhotos) {
        return {
          success: false,
          message: "No progress photos found. Please take progress photos (front, side, back) to use AI visual estimation.\n\nAlternatively, provide measurements:\n• Waist circumference\n• Neck circumference\n• Hip circumference (females)\n• Height",
        };
      }

      // Import AIService for visual analysis
      const { default: AIService } = await import('../AIService');

      let prompt = `Analyze this person's body composition from their progress photo(s) and estimate body fat percentage.

Person details:
- Gender: ${gender}
- Weight: ${weight || 'unknown'} lbs
- Height: ${height || 'unknown'} inches
- Age: ${age || 'unknown'}

Please provide:
1. Estimated body fat percentage (be realistic and specific)
2. Category (Essential/Athletic/Fitness/Average/Above Average)
3. Visual indicators you used for estimation
4. Confidence level in your estimate
5. Recommendations for improvement

Be honest and constructive. Focus on health, not just appearance.`;

      // Note: This would require Gemini Vision API with image input
      // For now, we'll provide a fallback message
      return {
        success: false,
        message: "📸 AI photo analysis is not yet available.\n\nTo estimate body fat, please provide:\n\n**Navy Method (Most Accurate):**\n• Waist circumference (at belly button)\n• Neck circumference (below Adam's apple)\n• Hip circumference (females only, widest point)\n• Height\n\nType: 'Estimate body fat with waist 34, neck 15, height 70' (males)\nOr: 'Estimate body fat with waist 30, neck 13, hips 38, height 65' (females)",
      };
    }

    // METHOD 3: BMI-based rough estimate (least accurate)
    else if (weight && height) {
      console.log('Using BMI-based estimation (least accurate)');

      const heightInMeters = height * 0.0254;
      const weightInKg = weight * 0.453592;
      const bmi = weightInKg / (heightInMeters * heightInMeters);

      // Very rough BF% estimation from BMI (Deurenberg formula)
      let bodyFat;
      const genderFactor = gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female') ? 1 : 0;
      const ageFactor = age || 30;

      bodyFat = (1.20 * bmi) + (0.23 * ageFactor) - (10.8 * genderFactor) - 5.4;

      bodyFat = Math.max(5, Math.min(50, bodyFat));

      let message = `⚠️ Body Fat Estimate (BMI Method - Low Accuracy):\n\n`;
      message += `Estimated: ${bodyFat.toFixed(1)}%\n`;
      message += `BMI: ${bmi.toFixed(1)}\n\n`;

      message += `⚠️ **Important**: This is a ROUGH estimate based only on height and weight. BMI doesn't account for muscle mass or body composition.\n\n`;

      message += `📏 For accurate results, provide measurements:\n`;
      message += `• Waist circumference (at belly button)\n`;
      message += `• Neck circumference (below Adam's apple)\n`;
      if (gender.toLowerCase().includes('female')) {
        message += `• Hip circumference (widest point)\n`;
      }

      return {
        success: true,
        message,
        data: {
          bodyFatPercentage: parseFloat(bodyFat.toFixed(1)),
          method: 'BMI Estimation (Low Accuracy)',
          bmi: parseFloat(bmi.toFixed(1)),
          weight,
          height,
        },
      };
    }

    // No data available
    else {
      return {
        success: false,
        message: "Not enough data to estimate body fat percentage.\n\n📏 **Navy Method (Most Accurate)**:\nProvide these measurements:\n• Waist (at belly button)\n• Neck (below Adam's apple)\n• Hips (females only, widest point)\n• Height\n\nExample: 'Estimate body fat with waist 34, neck 15, height 70'\n\n📸 **Photo Method**:\nTake progress photos (front, side, back) in the Progress tab, then say 'estimate body fat from photos'",
      };
    }

  } catch (error) {
    console.error('❌ estimateBodyFatPercentage error:', error);
    return {
      success: false,
      error: error.message,
      message: "Couldn't estimate body fat. Please try again.",
    };
  }
}

// Export tool schemas for Gemini function calling
export const progressToolSchemas = [
  {
    name: 'predictGoalCompletionDate',
    description: 'Predict when user will achieve their fitness goal based on historical progress data. Use when user asks "when will I hit my goal?" or "how long until I can bench X lbs?"',
    parameters: {
      type: 'object',
      properties: {
        goalType: {
          type: 'string',
          enum: ['weight', 'bodyweight', 'volume', 'reps'],
          description: 'Type of goal: "weight" for strength goals (e.g., bench 225), "bodyweight" for weight loss/gain, "volume" for total training volume',
        },
        exerciseName: {
          type: 'string',
          description: 'Name of exercise for strength goals (e.g., "Bench Press", "Squat"). Required for goalType="weight".',
        },
        currentValue: {
          type: 'number',
          description: 'Current value (optional, will be calculated from history if not provided)',
        },
        targetValue: {
          type: 'number',
          description: 'Target value to achieve (e.g., 225 for "bench 225 lbs")',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['goalType', 'targetValue', 'userId'],
    },
  },
  {
    name: 'detectProgressPlateau',
    description: 'Detect if user has plateaued on an exercise or overall training. Use when user asks "am I plateauing?" or "why isn\'t my bench increasing?"',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Name of specific exercise to analyze (optional, will analyze all exercises if not provided)',
        },
        metric: {
          type: 'string',
          enum: ['weight', 'volume', 'reps'],
          description: 'Metric to analyze (default: "weight")',
        },
        timeframe: {
          type: 'number',
          description: 'Number of days to analyze (default: 30)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
  {
    name: 'estimateBodyFatPercentage',
    description: 'Estimate body fat percentage using Navy Method (circumference measurements) or BMI. Use when user asks "what\'s my body fat?" or "estimate body fat"',
    parameters: {
      type: 'object',
      properties: {
        gender: {
          type: 'string',
          enum: ['male', 'female'],
          description: 'Gender (required for calculation)',
        },
        weight: {
          type: 'number',
          description: 'Body weight in pounds (optional, will use profile data if not provided)',
        },
        height: {
          type: 'number',
          description: 'Height in inches (optional, will use profile data if not provided)',
        },
        waist: {
          type: 'number',
          description: 'Waist circumference in inches (at belly button, most accurate method)',
        },
        neck: {
          type: 'number',
          description: 'Neck circumference in inches (below Adam\'s apple, most accurate method)',
        },
        hips: {
          type: 'number',
          description: 'Hip circumference in inches (females only, at widest point)',
        },
        age: {
          type: 'number',
          description: 'Age in years (optional, used for BMI estimation)',
        },
        usePhotos: {
          type: 'boolean',
          description: 'Set to true to use AI visual estimation from progress photos (not yet implemented)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
    },
  },
];
