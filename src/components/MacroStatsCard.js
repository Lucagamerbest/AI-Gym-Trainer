import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * MacroStatsCard - Displays macro progress bars like in NutritionScreen
 * Simplified version for AI chat (no meal segments, just overall progress)
 */
export default function MacroStatsCard({ macros, title = "📊 Today's Macros", subtitle }) {
  if (!macros || !macros.calories) {
    return null;
  }

  const { calories, protein, carbs, fat } = macros;

  // Calculate percentages
  const caloriesPercent = Math.min((calories.consumed / calories.target) * 100, 100);
  const proteinPercent = Math.min((protein.consumed / protein.target) * 100, 100);
  const carbsPercent = Math.min((carbs.consumed / carbs.target) * 100, 100);
  const fatPercent = Math.min((fat.consumed / fat.target) * 100, 100);

  // Color coding based on percentage
  const getColor = (percent) => {
    if (percent >= 90 && percent <= 110) return '#4CAF50'; // Green - perfect
    if (percent >= 80) return Colors.primary; // Blue - good
    if (percent >= 50) return '#FF9800'; // Orange - okay
    return '#F44336'; // Red - low
  };

  const caloriesColor = getColor(caloriesPercent);
  const proteinColor = '#FF6B6B'; // Red/Pink like in NutritionScreen
  const carbsColor = '#4ECDC4'; // Teal
  const fatColor = '#FFE66D'; // Yellow

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Calories Bar (larger/prominent) */}
      <View style={styles.caloriesSection}>
        <View style={styles.caloriesHeader}>
          <Text style={styles.caloriesLabel}>Daily Calories</Text>
          <Text style={styles.caloriesValue}>
            {calories.consumed}/{calories.target} cal
          </Text>
        </View>
        <View style={styles.caloriesBarContainer}>
          <View
            style={[
              styles.caloriesBarFilled,
              { width: `${caloriesPercent}%`, backgroundColor: caloriesColor }
            ]}
          />
        </View>
        <Text style={styles.remaining}>{calories.remaining} cal remaining</Text>
      </View>

      {/* Macros Progress Bars (compact like NutritionScreen) */}
      <View style={styles.macrosSection}>
        {/* Protein */}
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: proteinColor }]}>P</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFilled,
                { width: `${proteinPercent}%`, backgroundColor: proteinColor }
              ]}
            />
          </View>
          <Text style={[styles.macroValue, { color: proteinColor }]}>
            {protein.consumed}/{protein.target}g
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: carbsColor }]}>C</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFilled,
                { width: `${carbsPercent}%`, backgroundColor: carbsColor }
              ]}
            />
          </View>
          <Text style={[styles.macroValue, { color: carbsColor }]}>
            {carbs.consumed}/{carbs.target}g
          </Text>
        </View>

        {/* Fat */}
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: fatColor }]}>F</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFilled,
                { width: `${fatPercent}%`, backgroundColor: fatColor }
              ]}
            />
          </View>
          <Text style={[styles.macroValue, { color: fatColor }]}>
            {fat.consumed}/{fat.target}g
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  caloriesSection: {
    marginBottom: Spacing.md,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  caloriesLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  caloriesValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  caloriesBarContainer: {
    height: 28,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  caloriesBarFilled: {
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  remaining: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  macrosSection: {
    gap: Spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  macroLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    width: 20,
  },
  progressBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  macroValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
});
