import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import DetailedNutritionCard from '../components/DetailedNutritionCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function FoodDetailScreen({ route, navigation }) {
  const {
    food,
    mealType = 'lunch',
    isPlannedMeal,
    plannedDateKey,
    reopenDate,
    fromMealPlanTemplate,
    templateDayIndex,
    templateMealType,
    screenId,
    infoOnly = false, // If true, only show health rating info (no serving selector or add button)
  } = route.params;

  // Log screen ID when FoodDetailScreen receives it
  React.useEffect(() => {
    if (fromMealPlanTemplate && screenId) {
    }
  }, [fromMealPlanTemplate, screenId]);

  // Check if this is a restaurant food (already has per-serving nutrition)
  const isRestaurantFood = food.source === 'restaurant' || food.restaurant_id;

  // Determine if this food should be measured in units rather than grams
  const getServingInfo = () => {
    const name = food.name.toLowerCase();

    // Restaurant foods - nutrition is already per serving, not per 100g
    if (isRestaurantFood) {
      const servingText = food.serving_size || food.serving || '1 serving';
      return {
        weight: 1, // Multiplier (1x, 2x, etc.)
        unit: 'serving',
        unitPlural: 'servings',
        default: 1,
        isUnit: true,
        isRestaurant: true,
        servingDescription: servingText,
      };
    }

    // Foods that are better measured by units
    const unitBasedFoods = {
      // Each item: [weight per unit in grams, unit name, default quantity]
      'egg': { weight: 50, unit: 'egg', unitPlural: 'eggs', default: 2, isUnit: true },
      'banana': { weight: 120, unit: 'banana', unitPlural: 'bananas', default: 1, isUnit: true },
      'apple': { weight: 180, unit: 'apple', unitPlural: 'apples', default: 1, isUnit: true },
      'orange': { weight: 150, unit: 'orange', unitPlural: 'oranges', default: 1, isUnit: true },
      'slice': { weight: 30, unit: 'slice', unitPlural: 'slices', default: 2, isUnit: true }, // bread
      'cookie': { weight: 20, unit: 'cookie', unitPlural: 'cookies', default: 2, isUnit: true },
      'bagel': { weight: 100, unit: 'bagel', unitPlural: 'bagels', default: 1, isUnit: true },
      'muffin': { weight: 60, unit: 'muffin', unitPlural: 'muffins', default: 1, isUnit: true },
      'tortilla': { weight: 45, unit: 'tortilla', unitPlural: 'tortillas', default: 2, isUnit: true },
      'waffle': { weight: 35, unit: 'waffle', unitPlural: 'waffles', default: 2, isUnit: true },
      'pancake': { weight: 40, unit: 'pancake', unitPlural: 'pancakes', default: 3, isUnit: true },
    };

    // Check for unit-based foods
    for (const [keyword, info] of Object.entries(unitBasedFoods)) {
      if (name.includes(keyword)) {
        return info;
      }
    }

    // Weight-based foods (return serving size from API or smart recommendation)
    // First check if we have serving quantity from API
    if (food.servingQuantity && food.servingQuantity > 0) {
      const qty = Math.round(food.servingQuantity);
      return { weight: qty, unit: 'g', default: qty, isUnit: false, apiServing: true };
    }

    // Common serving sizes for weight-based foods
    if (name.includes('rice') && name.includes('cooked')) return { weight: 150, unit: 'g', default: 150, isUnit: false };
    if (name.includes('chicken')) return { weight: 100, unit: 'g', default: 100, isUnit: false };
    if (name.includes('milk')) return { weight: 240, unit: 'ml', default: 240, isUnit: false };
    if (name.includes('yogurt')) return { weight: 150, unit: 'g', default: 150, isUnit: false };
    if (name.includes('cheese')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('nuts') || name.includes('almonds') || name.includes('cashew') ||
        name.includes('peanut') || name.includes('walnut')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('oil') || name.includes('butter')) return { weight: 15, unit: 'g', default: 15, isUnit: false };
    if (name.includes('pasta') && name.includes('cooked')) return { weight: 140, unit: 'g', default: 140, isUnit: false };
    if (name.includes('cereal')) return { weight: 30, unit: 'g', default: 30, isUnit: false };
    if (name.includes('protein powder') || name.includes('whey')) return { weight: 30, unit: 'g', default: 30, isUnit: false };

    // Default to weight-based
    return { weight: 100, unit: 'g', default: 100, isUnit: false };
  };

  const servingInfo = getServingInfo();

  // State for serving - either units or grams
  const [servingAmount, setServingAmount] = useState(servingInfo.default);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  // Calculate actual weight based on serving amount
  const calculateActualWeight = () => {
    if (servingInfo.isRestaurant) {
      // For restaurant foods, just return the multiplier
      return servingAmount;
    }
    if (servingInfo.isUnit) {
      return servingAmount * servingInfo.weight;
    }
    return servingAmount;
  };

  // Calculate nutrition for current serving
  const calculateNutrition = (value) => {
    if (servingInfo.isRestaurant) {
      // Restaurant foods: nutrition is already per-serving, just multiply by quantity
      return (value * servingAmount).toFixed(1);
    }
    // Regular foods: nutrition is per 100g, scale by weight
    const actualWeight = calculateActualWeight();
    return ((value * actualWeight) / 100).toFixed(1);
  };

  // Calculate health rating (using Nutri-Score from API or strict calculation)
  const calculateHealthRating = () => {
    // If we have Nutri-Score from Open Food Facts API, use it
    if (food.nutriScore) {
      const nutriScoreMap = {
        'a': 5,
        'b': 4,
        'c': 3,
        'd': 2,
        'e': 1
      };
      return nutriScoreMap[food.nutriScore.toLowerCase()] || 3;
    }

    // Fallback: Much stricter calculation for foods without Nutri-Score
    let score = 3; // Start with neutral score (not 5!)

    // Calorie density (per 100g)
    if (food.calories < 100) {
      score += 0.5; // Very low calorie density
    } else if (food.calories > 250) {
      score -= 0.5; // High calorie density
    }
    if (food.calories > 400) {
      score -= 1; // Very high calorie density
    }

    // Protein content (positive factor)
    const proteinRatio = (food.protein * 4) / (food.calories || 1);
    if (proteinRatio > 0.3) score += 0.5; // High protein ratio
    if (proteinRatio > 0.4) score += 0.5; // Very high protein ratio
    if (proteinRatio < 0.1) score -= 0.5; // Low protein

    // Sugar content (negative factor)
    if (food.sugar !== undefined) {
      if (food.sugar < 5) {
        score += 0.3; // Low sugar
      } else if (food.sugar > 10) {
        score -= 0.5; // High sugar
      }
      if (food.sugar > 20) {
        score -= 1; // Very high sugar
      }
    }

    // Fat content and quality
    if (food.fat > 20) {
      score -= 0.5; // High fat
    }
    if (food.fat > 30) {
      score -= 0.5; // Very high fat
    }

    // Saturated fat (if available, otherwise estimate)
    const saturatedFat = food.saturatedFat || (food.fat * 0.4);
    if (saturatedFat > 5) score -= 0.5;
    if (saturatedFat > 10) score -= 0.5;

    // Fiber content (positive factor)
    if (food.fiber !== undefined) {
      if (food.fiber > 3) score += 0.3;
      if (food.fiber > 5) score += 0.3;
      if (food.fiber > 10) score += 0.4;
    }

    // Sodium content (negative factor)
    if (food.sodium !== undefined) {
      if (food.sodium < 120) {
        score += 0.2; // Low sodium
      } else if (food.sodium > 400) {
        score -= 0.3; // High sodium
      }
      if (food.sodium > 800) {
        score -= 0.5; // Very high sodium
      }
    }

    // Special penalties for certain categories
    const nameLower = food.name.toLowerCase();
    if (nameLower.includes('candy') || nameLower.includes('soda') ||
        nameLower.includes('donut') || nameLower.includes('cake')) {
      score -= 0.5; // Treats and sweets penalty
    }

    // Fast food penalty
    if (food.brand && ['McDonald', 'Burger King', 'KFC', 'Taco Bell'].some(brand =>
        food.brand.includes(brand))) {
      score -= 0.3; // Fast food generally less healthy
    }

    // Keep score in 1-5 range
    return Math.max(1, Math.min(5, score));
  };

  const healthScore = calculateHealthRating();

  // Get health rating color
  const getRatingColor = (score) => {
    if (score >= 4) return '#4CAF50'; // Green
    if (score >= 3) return '#FFC107'; // Yellow
    if (score >= 2) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Get health rating emoji
  const getRatingEmoji = (score) => {
    if (score >= 4) return '🌟';
    if (score >= 3) return '👍';
    if (score >= 2) return '⚠️';
    return '❌';
  };

  // Get detailed health analysis
  const getHealthAnalysis = () => {
    const analysis = {
      positive: [],
      negative: [],
      recommendations: []
    };

    // Analyze calories
    if (food.calories < 200) {
      analysis.positive.push('✓ Low in calories');
    } else if (food.calories > 400) {
      analysis.negative.push('✗ High in calories');
      analysis.recommendations.push('Consider smaller portions');
    }

    // Analyze protein
    if (food.protein > 20) {
      analysis.positive.push('✓ Excellent protein source');
    } else if (food.protein > 10) {
      analysis.positive.push('✓ Good protein content');
    } else if (food.protein < 5) {
      analysis.negative.push('✗ Low protein content');
    }

    // Analyze fat
    const saturatedFat = food.saturatedFat || (food.fat * 0.4);
    if (food.fat > 20) {
      analysis.negative.push('✗ High fat content');
      if (saturatedFat > 7) {
        analysis.negative.push('✗ High in saturated fat');
        analysis.recommendations.push('Limit intake if watching cholesterol');
      }
    } else if (food.fat < 5) {
      analysis.positive.push('✓ Low fat content');
    }

    // Analyze sugar
    if (food.sugar) {
      if (food.sugar > 15) {
        analysis.negative.push('✗ High sugar content');
        analysis.recommendations.push('Be mindful of daily sugar intake');
      } else if (food.sugar > 10) {
        analysis.negative.push('✗ Moderate sugar content');
      } else if (food.sugar < 5) {
        analysis.positive.push('✓ Low in sugar');
      }
    }

    // Analyze fiber
    if (food.fiber) {
      if (food.fiber > 5) {
        analysis.positive.push('✓ High in fiber');
      } else if (food.fiber > 3) {
        analysis.positive.push('✓ Good fiber source');
      }
    }

    // Analyze sodium
    if (food.sodium) {
      if (food.sodium > 600) {
        analysis.negative.push('✗ High sodium content');
        analysis.recommendations.push('Watch sodium intake for heart health');
      } else if (food.sodium > 400) {
        analysis.negative.push('✗ Moderate sodium');
      } else if (food.sodium < 140) {
        analysis.positive.push('✓ Low sodium');
      }
    }

    // Add general recommendations based on score
    if (healthScore >= 4) {
      analysis.recommendations.push('Great choice for regular consumption');
    } else if (healthScore >= 3) {
      analysis.recommendations.push('Good option in moderation');
    } else if (healthScore >= 2) {
      analysis.recommendations.push('Consume occasionally as part of balanced diet');
    } else {
      analysis.recommendations.push('Best enjoyed as an occasional treat');
    }

    // Check for balanced macros
    const proteinCal = food.protein * 4;
    const carbsCal = food.carbs * 4;
    const fatCal = food.fat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;

    if (totalMacroCal > 0) {
      const proteinPercent = (proteinCal / totalMacroCal) * 100;
      const carbsPercent = (carbsCal / totalMacroCal) * 100;
      const fatPercent = (fatCal / totalMacroCal) * 100;

      if (proteinPercent > 30 && carbsPercent < 50 && fatPercent < 35) {
        analysis.positive.push('✓ Well-balanced macronutrients');
      }
    }

    return analysis;
  };

  const healthAnalysis = getHealthAnalysis();

  const handleAddToLog = () => {
    const foodData = {
      name: food.name,
      calories: parseFloat(calculateNutrition(food.calories || 0)),
      protein: parseFloat(calculateNutrition(food.protein || 0)),
      carbs: parseFloat(calculateNutrition(food.carbs || 0)),
      fat: parseFloat(calculateNutrition(food.fat || 0)),
      mealType: mealType,
    };

    // Navigate back to appropriate screen with the food data
    if (fromMealPlanTemplate) {

      // Calculate how many screens to pop to get back to CreateMealPlan
      const state = navigation.getState();
      const currentIndex = state.index;
      const createMealPlanIndex = state.routes.findIndex(r => r.name === 'CreateMealPlan');

      if (createMealPlanIndex !== -1) {

        // First, dispatch action to update the target screen's params
        navigation.dispatch({
          ...CommonActions.setParams({
            addedFood: foodData,
            templateDayIndex: templateDayIndex,
            templateMealType: templateMealType,
            modalShown: true,
            screenId: screenId,
          }),
          source: state.routes[createMealPlanIndex].key,
        });

        // Then pop back to that screen
        const screensToPop = currentIndex - createMealPlanIndex;
        navigation.pop(screensToPop);
      } else {
        // Fallback
        navigation.navigate('CreateMealPlan', {
          addedFood: foodData,
          templateDayIndex: templateDayIndex,
          templateMealType: templateMealType,
          screenId: screenId,
          modalShown: true,
        });
      }
    } else if (isPlannedMeal) {
      // Reset navigation stack to prevent swiping back to search/recipe screens
      // Keep Nutrition in stack so back arrow still works
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Nutrition' },
          {
            name: 'MealsHistory',
            params: {
              addedPlannedFood: {
                plannedDateKey: plannedDateKey,
                mealType: mealType,
                foodItem: foodData,
                reopenDate: reopenDate
              }
            }
          }
        ],
      });
    } else {
      // Reset navigation stack to prevent swiping back to food search/recipe screens
      // Keep Main (Home) in stack so user can go back normally
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Main' },
          {
            name: 'Nutrition',
            params: {
              addedFood: foodData,
              fromFoodAdd: true
            }
          }
        ],
      });
    }
  };

  const adjustServing = (adjustment) => {
    if (servingInfo.isRestaurant) {
      // For restaurant foods, adjust by 0.5 servings at a time (allow half portions)
      const step = adjustment > 0 ? 0.5 : -0.5;
      const newAmount = Math.max(0.5, servingAmount + step);
      setServingAmount(newAmount);
    } else if (servingInfo.isUnit) {
      // For unit-based foods, adjust by 1 unit at a time
      const newAmount = Math.max(0.5, servingAmount + (adjustment > 0 ? 1 : -1));
      setServingAmount(newAmount);
    } else {
      // For weight-based foods, adjust by 50g at a time
      const step = adjustment > 0 ? 50 : -50;
      const newAmount = Math.max(10, servingAmount + step);
      setServingAmount(newAmount);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenLayout
        title="Food Details"
        navigation={navigation}
        showBack={true}
        scrollable={true}
      >
      {/* Food Header */}
      <View style={styles.header}>
        <Text style={styles.foodName}>{food.name || 'Unknown Food'}</Text>
        {(food.brand || food.restaurant_name) ? (
          <View style={[
            styles.brandBadge,
            food.restaurant_color && { backgroundColor: food.restaurant_color + '20', borderColor: food.restaurant_color }
          ]}>
            <Text style={[
              styles.brandText,
              food.restaurant_color && { color: food.restaurant_color }
            ]}>
              {food.brand || food.restaurant_name}
            </Text>
          </View>
        ) : null}
        {food.category ? (
          <Text style={styles.category}>{food.category}</Text>
        ) : null}
      </View>

      {/* Health Rating */}
      <TouchableOpacity
        style={styles.ratingCard}
        onPress={() => setShowHealthDetails(!showHealthDetails)}
        activeOpacity={0.8}
      >
        <View style={styles.ratingHeader}>
          <View style={styles.ratingTitleRow}>
            <Text style={styles.sectionTitle}>Health Rating</Text>
            {food.nutriScore && (
              <View style={styles.nutriScoreBadge}>
                <Text style={styles.nutriScoreText}>
                  {`Nutri-Score ${food.nutriScore.toUpperCase()}`}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.ratingEmoji}>{getRatingEmoji(healthScore)}</Text>
        </View>
        <View style={styles.ratingBar}>
          <View
            style={[
              styles.ratingFill,
              {
                width: `${(healthScore / 5) * 100}%`,
                backgroundColor: getRatingColor(healthScore)
              }
            ]}
          />
        </View>
        <View style={styles.ratingTextRow}>
          <Text style={styles.ratingText}>
            {`${healthScore.toFixed(1)} / 5.0`}
          </Text>
          <Text style={styles.tapHint}>Tap for details</Text>
        </View>

        {/* Expandable Health Details */}
        {showHealthDetails && (
          <View style={styles.healthDetails}>
            <View style={styles.divider} />

            {/* Positive Points */}
            {healthAnalysis.positive.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Positive Aspects</Text>
                {healthAnalysis.positive.map((point, index) => (
                  <Text key={`pos-${index}`} style={styles.positivePoint}>
                    {point}
                  </Text>
                ))}
              </View>
            )}

            {/* Negative Points */}
            {healthAnalysis.negative.length > 0 && (
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Areas of Concern</Text>
                {healthAnalysis.negative.map((point, index) => (
                  <Text key={`neg-${index}`} style={styles.negativePoint}>
                    {point}
                  </Text>
                ))}
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Recommendations</Text>
              {healthAnalysis.recommendations.map((rec, index) => (
                <Text key={`rec-${index}`} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Serving Size Selector - hidden in info-only mode */}
      {!infoOnly && (
        <View style={styles.servingCard}>
          <Text style={styles.sectionTitle}>Serving Size</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => adjustServing(-1)}
            >
              <Text style={styles.servingButtonText}>-</Text>
            </TouchableOpacity>

            <View style={styles.servingDisplay}>
              <Text style={styles.servingSize}>
                {servingInfo.isRestaurant
                  ? `${servingAmount} ${servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural}`
                  : servingInfo.isUnit
                    ? `${servingAmount} ${servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural}`
                    : `${servingAmount}${servingInfo.unit}`
                }
              </Text>
              <Text style={styles.servingCalories}>
                {calculateNutrition(food.calories || 0)} cal
              </Text>
            </View>

            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => adjustServing(1)}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Nutrition Information - hidden in info-only mode */}
      {!infoOnly && (
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition Facts</Text>
          <Text style={styles.nutritionSubtitle}>
            {servingInfo.isRestaurant
              ? `Per ${servingAmount === 1 ? '' : servingAmount + 'x '}${servingInfo.servingDescription}`
              : servingInfo.isUnit
                ? `Per ${servingAmount} ${servingAmount === 1 ? servingInfo.unit : servingInfo.unitPlural} (${calculateActualWeight()}g)`
                : `Per ${servingAmount}${servingInfo.unit} serving`
            }
          </Text>

          {/* Calories */}
          <View style={styles.caloriesRow}>
            <Text style={styles.caloriesLabel}>Calories</Text>
            <Text style={styles.caloriesValue}>{`${calculateNutrition(food.calories || 0)}`}</Text>
          </View>

          <View style={styles.divider} />

          {/* Macronutrients */}
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{`${calculateNutrition(food.protein || 0)}g`}</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.protein * 4 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{`${calculateNutrition(food.carbs || 0)}g`}</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.carbs * 4 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{`${calculateNutrition(food.fat || 0)}g`}</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.fat * 9 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>
          </View>

          {/* Additional nutrients if available */}
          {(food.fiber || food.sugar || food.sodium) ? (
            <>
              <View style={styles.divider} />
              <View style={styles.additionalNutrients}>
                {food.fiber ? (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Fiber</Text>
                    <Text style={styles.nutrientValue}>{`${calculateNutrition(food.fiber)}g`}</Text>
                  </View>
                ) : null}
                {food.sugar ? (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Sugar</Text>
                    <Text style={styles.nutrientValue}>{`${calculateNutrition(food.sugar)}g`}</Text>
                  </View>
                ) : null}
                {food.sodium ? (
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Sodium</Text>
                    <Text style={styles.nutrientValue}>{`${calculateNutrition(food.sodium)}mg`}</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      )}

      {/* Detailed Nutrition Insights - only shows if enabled in settings */}
      {!infoOnly && (
        <DetailedNutritionCard
          food={food}
          servingMultiplier={servingInfo.isUnit ? (calculateActualWeight() / 100) : (servingAmount / 100)}
        />
      )}

      {/* Quick Macros Summary - shown in info-only mode */}
      {infoOnly && (
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nutrition per Serving</Text>
          <Text style={styles.nutritionSubtitle}>{food.serving_size || '1 serving'}</Text>

          <View style={styles.caloriesRow}>
            <Text style={styles.caloriesLabel}>Calories</Text>
            <Text style={styles.caloriesValue}>{food.calories || 0}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{food.protein || 0}g</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.protein * 4 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{food.carbs || 0}g</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.carbs * 4 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{food.fat || 0}g</Text>
              <Text style={styles.macroPercent}>
                {food.calories > 0 ? `${((food.fat * 9 / food.calories) * 100).toFixed(0)}%` : '0%'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Add to Food Log Button - hidden in info-only mode */}
      {!infoOnly && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToLog}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>
            Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
        </TouchableOpacity>
      )}
      </ScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 80, // Space for the sticky button
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  foodName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  category: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  brandBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  brandText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nutriScoreBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  nutriScoreText: {
    fontSize: Typography.fontSize.xs,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingEmoji: {
    fontSize: 32,
  },
  ratingBar: {
    height: 24,
    backgroundColor: Colors.border + '40',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ratingFill: {
    height: '100%',
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  tapHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  healthDetails: {
    marginTop: Spacing.md,
  },
  analysisSection: {
    marginTop: Spacing.md,
  },
  analysisSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  positivePoint: {
    fontSize: Typography.fontSize.sm,
    color: '#4CAF50',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  negativePoint: {
    fontSize: Typography.fontSize.sm,
    color: '#F44336',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  recommendation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  servingCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  servingButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  servingButtonText: {
    fontSize: 28,
    color: '#000',
    fontWeight: 'bold',
  },
  servingDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  servingSize: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  servingCalories: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  nutritionCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  nutritionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  caloriesLabel: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  caloriesValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  macroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  macroPercent: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  additionalNutrients: {
    gap: Spacing.sm,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  nutrientLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  nutrientValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addButtonText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stickyAddButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: '50%',
    transform: [{ translateX: -120 }], // Half of width (240px / 2)
    width: 240,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
});