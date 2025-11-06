import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * MacroProgressBar - Beautiful visual progress bar for macros
 *
 * @param {string} label - Macro name (e.g., "Calories", "Protein")
 * @param {number} current - Current value consumed
 * @param {number} target - Target value
 * @param {string} unit - Unit (e.g., "cal", "g")
 * @param {string} color - Bar color
 */
export default function MacroProgressBar({ label, current, target, unit = '', color = Colors.primary }) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);

  // Determine status color
  let statusColor = color;
  if (percentage >= 90 && percentage <= 110) {
    statusColor = Colors.success; // Green - perfect range
  } else if (percentage > 110) {
    statusColor = Colors.warning; // Orange - over target
  } else if (percentage < 50) {
    statusColor = Colors.error; // Red - way behind
  }

  return (
    <View style={styles.container}>
      {/* Label and Values */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={[styles.current, { color: statusColor }]}>
            {current}{unit}
          </Text>
          <Text style={styles.slash}> / </Text>
          <Text style={styles.target}>{target}{unit}</Text>
        </Text>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.barContainer}>
        {/* Background */}
        <View style={styles.barBackground} />

        {/* Filled Portion */}
        <View
          style={[
            styles.barFilled,
            {
              width: `${percentage}%`,
              backgroundColor: statusColor,
            }
          ]}
        />

        {/* Percentage Label */}
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>

      {/* Remaining */}
      <Text style={styles.remaining}>
        {remaining > 0 ? `${remaining}${unit} remaining` : 'Target reached! ✓'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  values: {
    fontSize: Typography.fontSize.sm,
  },
  current: {
    fontWeight: '700',
    fontSize: Typography.fontSize.md,
  },
  slash: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  target: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  barContainer: {
    height: 24,
    width: '100%',
    position: 'relative',
    marginBottom: 4,
  },
  barBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  barFilled: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
    // Gradient effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  remaining: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
