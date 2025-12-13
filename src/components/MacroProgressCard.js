import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import MacroProgressBar from './MacroProgressBar';

/**
 * MacroProgressCard - Beautiful card displaying all macro progress bars
 *
 * @param {object} macros - Macro data { calories, protein, carbs, fat }
 * Each macro should have: { consumed, target }
 * @param {string} title - Card title (default: "Today's Macros")
 * @param {string} subtitle - Card subtitle (optional, e.g., "92% through the day")
 */
export default function MacroProgressCard({ macros, title = "📊 Today's Macros", subtitle }) {

  if (!macros || !macros.calories) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Macro Bars */}
      <View style={styles.macrosContainer}>
        <MacroProgressBar
          label="Calories"
          current={macros.calories.consumed}
          target={macros.calories.target}
          unit=" cal"
          color={Colors.primary}
        />

        <MacroProgressBar
          label="Protein"
          current={macros.protein.consumed}
          target={macros.protein.target}
          unit="g"
          color="#FF6B6B" // Red/Pink
        />

        <MacroProgressBar
          label="Carbs"
          current={macros.carbs.consumed}
          target={macros.carbs.target}
          unit="g"
          color="#4ECDC4" // Teal/Cyan
        />

        <MacroProgressBar
          label="Fat"
          current={macros.fat.consumed}
          target={macros.fat.target}
          unit="g"
          color="#FFE66D" // Yellow
        />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  macrosContainer: {
    gap: Spacing.md,
  },
});
