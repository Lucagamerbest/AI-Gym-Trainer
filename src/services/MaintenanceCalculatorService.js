/**
 * MaintenanceCalculatorService.js
 *
 * Calculates user's actual TDEE (maintenance calories) based on real data:
 * daily weight entries + calorie intake over time.
 *
 * Formula: TDEE = Avg Daily Calories + ((Start Weight - End Weight) × 3500 / Days)
 * - 3500 calories ≈ 1 lb of body weight
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_HISTORY_KEY = '@weight_history';
const MEAL_PLANS_KEY = '@meal_plans';

/**
 * Log a weight entry for a specific date
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {number} weight - Weight value
 * @param {string} unit - 'lbs' or 'kg'
 */
export async function logWeight(date, weight, unit = 'lbs') {
  try {
    const history = await getWeightHistory();

    // Check if entry exists for this date
    const existingIndex = history.findIndex(entry => entry.date === date);

    const newEntry = {
      date,
      weight: parseFloat(weight),
      unit,
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = newEntry;
    } else {
      // Add new entry
      history.push(newEntry);
    }

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(history));
    return newEntry;
  } catch (error) {
    console.error('Error logging weight:', error);
    throw error;
  }
}

/**
 * Get all weight history entries
 * @returns {Array} Array of { date, weight, unit, timestamp }
 */
export async function getWeightHistory() {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting weight history:', error);
    return [];
  }
}

/**
 * Delete a weight entry by date
 * @param {string} date - Date string in YYYY-MM-DD format
 */
export async function deleteWeightEntry(date) {
  try {
    const history = await getWeightHistory();
    const filtered = history.filter(entry => entry.date !== date);
    await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw error;
  }
}

/**
 * Get calorie data from meal plans for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of { date, calories, protein, carbs, fat }
 */
export async function getCalorieHistory(startDate, endDate) {
  try {
    const mealPlansData = await AsyncStorage.getItem(MEAL_PLANS_KEY);
    if (!mealPlansData) return [];

    const mealPlans = JSON.parse(mealPlansData);
    const results = [];

    // Iterate through date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = mealPlans[dateStr];

      if (dayData && dayData.logged) {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meals = dayData.logged[mealType] || [];
          meals.forEach(meal => {
            totalCalories += meal.calories || 0;
            totalProtein += meal.protein || 0;
            totalCarbs += meal.carbs || 0;
            totalFat += meal.fat || 0;
          });
        });

        if (totalCalories > 0) {
          results.push({
            date: dateStr,
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error getting calorie history:', error);
    return [];
  }
}

/**
 * Convert weight between units
 * @param {number} weight - Weight value
 * @param {string} fromUnit - 'lbs' or 'kg'
 * @param {string} toUnit - 'lbs' or 'kg'
 * @returns {number} Converted weight
 */
export function convertWeight(weight, fromUnit, toUnit) {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'kg' && toUnit === 'lbs') return weight * 2.20462;
  if (fromUnit === 'lbs' && toUnit === 'kg') return weight / 2.20462;
  return weight;
}

/**
 * Calculate TDEE from weight and calorie data
 *
 * @param {Array} weightEntries - Array of { date, weight, unit }
 * @param {Array} calorieData - Array of { date, calories }
 * @returns {Object} { tdee, confidence, weightChange, avgCalories, daysTracked, startWeight, endWeight }
 */
export function calculateMaintenanceTDEE(weightEntries, calorieData) {
  if (!weightEntries || weightEntries.length < 2) {
    return {
      tdee: null,
      confidence: 'insufficient',
      message: 'Need at least 2 weight entries',
      daysTracked: weightEntries?.length || 0
    };
  }

  if (!calorieData || calorieData.length < 2) {
    return {
      tdee: null,
      confidence: 'insufficient',
      message: 'Need calorie data for calculation',
      daysTracked: weightEntries.length
    };
  }

  // Sort entries by date (oldest first for calculation)
  const sortedWeights = [...weightEntries].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Convert all weights to lbs for calculation
  const weightsInLbs = sortedWeights.map(entry => ({
    ...entry,
    weightLbs: convertWeight(entry.weight, entry.unit, 'lbs')
  }));

  // Get first and last weight
  const firstEntry = weightsInLbs[0];
  const lastEntry = weightsInLbs[weightsInLbs.length - 1];

  // Calculate days between first and last entry
  const daysDiff = Math.ceil(
    (new Date(lastEntry.date) - new Date(firstEntry.date)) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 1) {
    return {
      tdee: null,
      confidence: 'insufficient',
      message: 'Need entries across multiple days',
      daysTracked: weightEntries.length
    };
  }

  // Calculate weight change (positive = lost weight, negative = gained)
  const weightChange = firstEntry.weightLbs - lastEntry.weightLbs;

  // Calculate average daily calories
  const totalCalories = calorieData.reduce((sum, day) => sum + day.calories, 0);
  const avgCalories = totalCalories / calorieData.length;

  // Calculate TDEE
  // Formula: TDEE = Avg Calories + (Weight Change × 3500 / Days)
  // 3500 calories ≈ 1 lb
  const calorieAdjustment = (weightChange * 3500) / daysDiff;
  const tdee = Math.round(avgCalories + calorieAdjustment);

  // Determine confidence level
  let confidence = 'low';
  if (daysDiff >= 14 && calorieData.length >= 10) {
    confidence = 'high';
  } else if (daysDiff >= 7 && calorieData.length >= 5) {
    confidence = 'medium';
  }

  // Validate result (sanity check)
  let warning = null;
  if (tdee < 1000) {
    warning = 'Calculated TDEE seems unusually low. Consider tracking more consistently.';
  } else if (tdee > 5000) {
    warning = 'Calculated TDEE seems unusually high. Consider tracking more consistently.';
  }

  // Calculate additional stats
  const avgWeight = weightsInLbs.reduce((sum, e) => sum + e.weightLbs, 0) / weightsInLbs.length;
  const weeklyChange = (weightChange / daysDiff) * 7;

  return {
    tdee: Math.max(1000, Math.min(5000, tdee)), // Clamp to reasonable range
    rawTdee: tdee,
    confidence,
    weightChange: parseFloat(weightChange.toFixed(1)),
    weeklyChange: parseFloat(weeklyChange.toFixed(1)),
    avgCalories: Math.round(avgCalories),
    daysTracked: daysDiff,
    entriesCount: weightEntries.length,
    calorieEntriesCount: calorieData.length,
    startWeight: parseFloat(firstEntry.weightLbs.toFixed(1)),
    endWeight: parseFloat(lastEntry.weightLbs.toFixed(1)),
    avgWeight: parseFloat(avgWeight.toFixed(1)),
    calorieAdjustment: Math.round(calorieAdjustment),
    warning,
    startDate: firstEntry.date,
    endDate: lastEntry.date
  };
}

/**
 * Get combined data and calculate TDEE
 * Convenience function that fetches all data and calculates
 */
export async function calculateCurrentTDEE() {
  try {
    const weightHistory = await getWeightHistory();

    if (weightHistory.length < 2) {
      return {
        tdee: null,
        confidence: 'insufficient',
        message: 'Need at least 2 weight entries',
        daysTracked: weightHistory.length
      };
    }

    // Get date range from weight entries
    const sortedWeights = [...weightHistory].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    const startDate = sortedWeights[0].date;
    const endDate = sortedWeights[sortedWeights.length - 1].date;

    // Get calorie data for the same period
    const calorieHistory = await getCalorieHistory(startDate, endDate);

    return calculateMaintenanceTDEE(weightHistory, calorieHistory);
  } catch (error) {
    console.error('Error calculating TDEE:', error);
    return {
      tdee: null,
      confidence: 'error',
      message: 'Error calculating TDEE',
      error: error.message
    };
  }
}

/**
 * Get progress towards 14-day goal
 */
export async function getTrackingProgress() {
  const weightHistory = await getWeightHistory();

  if (weightHistory.length === 0) {
    return {
      daysLogged: 0,
      targetDays: 14,
      progress: 0,
      hasStarted: false,
      lastEntry: null
    };
  }

  // Count unique days with entries
  const uniqueDays = new Set(weightHistory.map(e => e.date)).size;

  // Get the most recent entry
  const sortedHistory = [...weightHistory].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  return {
    daysLogged: uniqueDays,
    targetDays: 14,
    progress: Math.min(100, Math.round((uniqueDays / 14) * 100)),
    hasStarted: true,
    lastEntry: sortedHistory[0],
    canCalculate: uniqueDays >= 7
  };
}

/**
 * Reset all weight tracking data
 */
export async function resetWeightHistory() {
  try {
    await AsyncStorage.removeItem(WEIGHT_HISTORY_KEY);
  } catch (error) {
    console.error('Error resetting weight history:', error);
    throw error;
  }
}

export default {
  logWeight,
  getWeightHistory,
  deleteWeightEntry,
  getCalorieHistory,
  convertWeight,
  calculateMaintenanceTDEE,
  calculateCurrentTDEE,
  getTrackingProgress,
  resetWeightHistory
};
