/**
 * Plate Calculator Utility
 * Calculates which plates to load on a barbell for a given weight
 */

import {
  BAR_TYPES,
  DEFAULT_AVAILABLE_PLATES,
  getBarWeight
} from '../constants/weightEquipment.js';

/**
 * Calculate plates needed per side for a given total weight
 * @param {number} totalWeight - Total weight to achieve
 * @param {string} barType - Type of bar being used
 * @param {string} unit - 'lbs' or 'kg'
 * @param {number[]} availablePlates - Array of available plate weights (optional)
 * @returns {Object} Result object with plates array and metadata
 */
export function calculatePlates(
  totalWeight,
  barType = 'olympic',
  unit = 'lbs',
  availablePlates = null
) {
  const barWeight = getBarWeight(barType, unit);
  const plates = availablePlates || DEFAULT_AVAILABLE_PLATES[unit];

  // Handle invalid inputs
  if (totalWeight === null || totalWeight === undefined || isNaN(totalWeight)) {
    return {
      success: false,
      error: 'Invalid weight',
      platesPerSide: [],
      barWeight,
      totalWeight: 0,
      achievableWeight: barWeight,
    };
  }

  // Weight less than bar
  if (totalWeight < barWeight) {
    return {
      success: false,
      error: `Weight must be at least ${barWeight} ${unit} (bar weight)`,
      platesPerSide: [],
      barWeight,
      totalWeight,
      achievableWeight: barWeight,
    };
  }

  // Just the bar, no plates needed
  if (totalWeight === barWeight) {
    return {
      success: true,
      platesPerSide: [],
      barWeight,
      totalWeight,
      achievableWeight: barWeight,
      platesSummary: 'Bar only',
    };
  }

  const weightPerSide = (totalWeight - barWeight) / 2;
  const platesPerSide = [];
  let remaining = weightPerSide;

  // Sort plates descending (heaviest first)
  const sortedPlates = [...plates].sort((a, b) => b - a);

  // Greedy algorithm: use largest plates first
  for (const plateWeight of sortedPlates) {
    while (remaining >= plateWeight - 0.001) { // Small epsilon for floating point
      platesPerSide.push(plateWeight);
      remaining -= plateWeight;
      remaining = Math.round(remaining * 100) / 100; // Round to avoid floating point issues
    }
  }

  // Check if we achieved exact weight
  const achievedPerSide = platesPerSide.reduce((sum, p) => sum + p, 0);
  const achievableWeight = barWeight + (achievedPerSide * 2);
  const isExact = Math.abs(remaining) < 0.01;

  return {
    success: isExact,
    error: isExact ? null : `Cannot achieve exact weight. Closest: ${achievableWeight} ${unit}`,
    platesPerSide,
    barWeight,
    totalWeight,
    achievableWeight,
    remainder: remaining,
    platesSummary: formatPlatesSummary(platesPerSide, unit),
  };
}

/**
 * Format plates array into readable summary
 * @param {number[]} plates - Array of plate weights
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {string} Formatted summary like "45+25+10"
 */
export function formatPlatesSummary(plates, unit = 'lbs') {
  if (!plates || plates.length === 0) {
    return 'No plates';
  }

  // Group plates by weight
  const plateCounts = {};
  plates.forEach(plate => {
    plateCounts[plate] = (plateCounts[plate] || 0) + 1;
  });

  // Format as "2×45 + 1×25" or "45+45+25"
  const parts = [];
  Object.entries(plateCounts)
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    .forEach(([weight, count]) => {
      if (count > 1) {
        parts.push(`${count}×${weight}`);
      } else {
        parts.push(weight);
      }
    });

  return parts.join(' + ') + ` per side`;
}

/**
 * Get the closest achievable weight
 * @param {number} targetWeight - Desired weight
 * @param {string} barType - Type of bar
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {number} Closest weight that can be achieved with available plates
 */
export function getClosestAchievableWeight(targetWeight, barType = 'olympic', unit = 'lbs') {
  const result = calculatePlates(targetWeight, barType, unit);
  return result.achievableWeight;
}

/**
 * Get all possible weights that can be made with available plates
 * @param {string} barType - Type of bar
 * @param {string} unit - 'lbs' or 'kg'
 * @param {number} maxWeight - Maximum weight to calculate up to
 * @returns {number[]} Array of achievable weights
 */
export function getAchievableWeights(barType = 'olympic', unit = 'lbs', maxWeight = 500) {
  const barWeight = getBarWeight(barType, unit);
  const plates = DEFAULT_AVAILABLE_PLATES[unit];
  const smallestPlate = Math.min(...plates);
  const increment = smallestPlate * 2; // Both sides

  const weights = [barWeight];
  let current = barWeight + increment;

  while (current <= maxWeight) {
    const result = calculatePlates(current, barType, unit);
    if (result.success) {
      weights.push(current);
    }
    current += increment;
  }

  return weights;
}

/**
 * Validate if a weight can be achieved exactly
 * @param {number} weight - Weight to validate
 * @param {string} barType - Type of bar
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {boolean}
 */
export function isValidWeight(weight, barType = 'olympic', unit = 'lbs') {
  const result = calculatePlates(weight, barType, unit);
  return result.success;
}

/**
 * Suggest weight adjustments if exact weight isn't achievable
 * @param {number} targetWeight - Desired weight
 * @param {string} barType - Type of bar
 * @param {string} unit - 'lbs' or 'kg'
 * @returns {Object} Suggestions with lower and higher alternatives
 */
export function suggestWeightAdjustments(targetWeight, barType = 'olympic', unit = 'lbs') {
  const barWeight = getBarWeight(barType, unit);
  const plates = DEFAULT_AVAILABLE_PLATES[unit];
  const smallestPlate = Math.min(...plates);
  const increment = smallestPlate * 2;

  // Find lower valid weight
  let lower = targetWeight;
  while (lower >= barWeight) {
    const result = calculatePlates(lower, barType, unit);
    if (result.success) break;
    lower -= increment / 2;
  }

  // Find higher valid weight
  let higher = targetWeight;
  while (higher <= targetWeight + 50) {
    const result = calculatePlates(higher, barType, unit);
    if (result.success) break;
    higher += increment / 2;
  }

  return {
    target: targetWeight,
    lower: lower >= barWeight ? lower : null,
    higher,
    lowerPlates: lower >= barWeight ? calculatePlates(lower, barType, unit) : null,
    higherPlates: calculatePlates(higher, barType, unit),
  };
}

export default {
  calculatePlates,
  formatPlatesSummary,
  getClosestAchievableWeight,
  getAchievableWeights,
  isValidWeight,
  suggestWeightAdjustments,
};
