/**
 * DetailedNutritionCard - Shows micronutrients, food quality, and allergens
 * Only visible when user has enabled "Show Detailed Nutrition" in settings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import nutritionInsightsService, { DAILY_VALUES, PROCESSING_LEVELS } from '../services/NutritionInsightsService';

export default function DetailedNutritionCard({ food, servingMultiplier = 1 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false);

  useEffect(() => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    const enabled = await nutritionInsightsService.loadSettings();
    setShowDetailedNutrition(enabled);
  };

  // Don't render if setting is disabled or no data available
  if (!showDetailedNutrition) return null;

  const hasDetailedData = nutritionInsightsService.hasDetailedNutrition(food.name);
  if (!hasDetailedData) return null;

  const foodQuality = nutritionInsightsService.getFoodQuality(food);
  const topNutrients = nutritionInsightsService.getTopNutrients(food.name, 5);
  const dailyValues = nutritionInsightsService.calculateDailyValues(food.name, servingMultiplier);
  const allergens = nutritionInsightsService.getAllergens(food.name);

  return (
    <View style={styles.container}>
      {/* Quality Score Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Nutrition Insights</Text>
          <View style={styles.qualityBadge}>
            <View style={[styles.qualityDot, { backgroundColor: foodQuality.color }]} />
            <Text style={[styles.qualityText, { color: foodQuality.color }]}>
              {foodQuality.quality} ({foodQuality.score}/100)
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
      </TouchableOpacity>

      {/* Top Nutrients Preview (always visible) */}
      {topNutrients.length > 0 && (
        <View style={styles.topNutrients}>
          <Text style={styles.subTitle}>Top Nutrients</Text>
          <View style={styles.nutrientChips}>
            {topNutrients.slice(0, 3).map((nutrient, index) => (
              <View key={index} style={styles.nutrientChip}>
                <Text style={styles.nutrientChipText}>
                  {nutrient.name}: {nutrient.percentDV}% DV
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Processing Level */}
          {foodQuality.processingInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Processing Level</Text>
              <View style={styles.processingRow}>
                <View style={[styles.processingBadge, { backgroundColor: foodQuality.processingInfo.color + '20' }]}>
                  <Text style={[styles.processingText, { color: foodQuality.processingInfo.color }]}>
                    {foodQuality.processingInfo.label}
                  </Text>
                </View>
                <Text style={styles.processingDesc}>
                  {foodQuality.processingInfo.description}
                </Text>
              </View>
            </View>
          )}

          {/* Allergens */}
          {allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergen Warnings</Text>
              <View style={styles.allergenRow}>
                {allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenBadge}>
                    <Text style={styles.allergenText}>
                      {allergen.replace('-', ' ').replace('allergy', '').trim()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Vitamins */}
          {dailyValues?.vitamins && Object.keys(dailyValues.vitamins).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vitamins</Text>
              {Object.entries(dailyValues.vitamins)
                .filter(([_, data]) => data.percentDV > 0)
                .sort((a, b) => b[1].percentDV - a[1].percentDV)
                .slice(0, 6)
                .map(([key, data]) => (
                  <View key={key} style={styles.nutrientRow}>
                    <Text style={styles.nutrientName}>{data.name}</Text>
                    <View style={styles.nutrientBarContainer}>
                      <View
                        style={[
                          styles.nutrientBar,
                          {
                            width: `${Math.min(100, data.percentDV)}%`,
                            backgroundColor: data.percentDV >= 20 ? '#4CAF50' : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.nutrientPercent}>{data.percentDV}%</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Minerals */}
          {dailyValues?.minerals && Object.keys(dailyValues.minerals).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minerals</Text>
              {Object.entries(dailyValues.minerals)
                .filter(([_, data]) => data.percentDV > 0)
                .sort((a, b) => b[1].percentDV - a[1].percentDV)
                .slice(0, 6)
                .map(([key, data]) => (
                  <View key={key} style={styles.nutrientRow}>
                    <Text style={styles.nutrientName}>{data.name}</Text>
                    <View style={styles.nutrientBarContainer}>
                      <View
                        style={[
                          styles.nutrientBar,
                          {
                            width: `${Math.min(100, data.percentDV)}%`,
                            backgroundColor: data.percentDV >= 20 ? '#4CAF50' : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.nutrientPercent}>{data.percentDV}%</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Info note */}
          <Text style={styles.infoNote}>
            % Daily Value based on a 2000 calorie diet. Values per 100g serving.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  qualityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    width: 30,
    textAlign: 'center',
  },
  topNutrients: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  subTitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  nutrientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  nutrientChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  nutrientChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  processingBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  processingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  processingDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  allergenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allergenBadge: {
    backgroundColor: '#FF5722' + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  allergenText: {
    fontSize: Typography.fontSize.sm,
    color: '#FF5722',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nutrientName: {
    width: 120,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  nutrientBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  nutrientBar: {
    height: '100%',
    borderRadius: 4,
  },
  nutrientPercent: {
    width: 40,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  infoNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
});
