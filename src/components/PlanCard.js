/**
 * PlanCard.js
 *
 * Card component for displaying workout plan summaries
 * Shows plan name, split type, difficulty, equipment profile, and key stats
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';

const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

const GOAL_ICONS = {
  'muscle-building': 'barbell',
  'strength': 'fitness',
  'fat-loss': 'flame',
  'general-fitness': 'heart',
};

export default function PlanCard({
  plan,
  onPress,
  showCompatibility = false,
  compatibilityScore = null,
  style,
}) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const difficultyColor = DIFFICULTY_COLORS[plan.difficulty] || Colors.textMuted;
  const goalIcon = GOAL_ICONS[plan.goal] || 'fitness';

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {plan.name}
          </Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      {/* Category & Goal Row */}
      <View style={styles.categoryRow}>
        <View style={styles.categoryBadge}>
          <Ionicons name="layers-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.categoryText}>{plan.category}</Text>
        </View>
        <View style={styles.goalBadge}>
          <Ionicons name={goalIcon} size={14} color={Colors.primary} />
          <Text style={styles.goalText}>
            {plan.goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{plan.daysPerWeek} days/week</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{plan.timePerWorkout} min</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="repeat-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{plan.durationWeeks} weeks</Text>
        </View>
      </View>

      {/* Equipment Profile */}
      <View style={styles.equipmentRow}>
        <Ionicons
          name={plan.equipmentProfile === 'bodyweight' ? 'body-outline' : 'barbell-outline'}
          size={14}
          color={Colors.textMuted}
        />
        <Text style={styles.equipmentText}>
          {plan.equipmentProfile.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </Text>
      </View>

      {/* Compatibility Score (if shown) */}
      {showCompatibility && compatibilityScore !== null && (
        <View style={styles.compatibilityRow}>
          <View style={[
            styles.compatibilityBadge,
            {
              backgroundColor: compatibilityScore >= 80
                ? '#4CAF5020'
                : compatibilityScore >= 50
                  ? '#FF980020'
                  : '#F4433620'
            }
          ]}>
            <Ionicons
              name={compatibilityScore >= 80 ? 'checkmark-circle' : 'alert-circle'}
              size={14}
              color={
                compatibilityScore >= 80
                  ? '#4CAF50'
                  : compatibilityScore >= 50
                    ? '#FF9800'
                    : '#F44336'
              }
            />
            <Text style={[
              styles.compatibilityText,
              {
                color: compatibilityScore >= 80
                  ? '#4CAF50'
                  : compatibilityScore >= 50
                    ? '#FF9800'
                    : '#F44336'
              }
            ]}>
              {compatibilityScore}% compatible
            </Text>
          </View>
        </View>
      )}

    </TouchableOpacity>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipmentText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
