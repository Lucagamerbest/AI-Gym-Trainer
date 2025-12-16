/**
 * PlanDetailScreen.js
 *
 * Detailed view of a workout plan
 * Shows plan overview, day-by-day breakdown, and save/adapt options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import WorkoutPlanService from '../services/WorkoutPlanService';

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

export default function PlanDetailScreen({ navigation, route }) {
  const { plan: initialPlan } = route.params;
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [plan, setPlan] = useState(initialPlan);
  const [saving, setSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkIfSaved();
  }, [plan.id]);

  const checkIfSaved = async () => {
    const saved = await WorkoutPlanService.isPlanSaved(plan.id);
    setIsSaved(saved);
  };

  const handleSavePlan = async () => {
    if (isSaved) {
      Alert.alert('Already Saved', 'This plan is already in your programs.');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await WorkoutPlanService.savePlanToPrograms(plan);
      if (result.success) {
        setIsSaved(true);
        Alert.alert(
          'Plan Saved!',
          `"${plan.name}" has been added to your programs.`,
          [
            { text: 'View Programs', onPress: () => navigation.navigate('MyPlans') },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save the plan. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayExpansion = (dayId) => {
    Haptics.selectionAsync();
    setExpandedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const difficultyColor = DIFFICULTY_COLORS[plan.difficulty] || Colors.textMuted;
  const goalIcon = GOAL_ICONS[plan.goal] || 'fitness';

  return (
    <ScreenLayout
      title="Plan Details"
      showBack={true}
      navigation={navigation}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Plan Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{plan.name}</Text>

          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.badgeText, { color: difficultyColor }]}>
                {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
              </Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name={goalIcon} size={14} color={Colors.primary} />
              <Text style={[styles.badgeText, { color: Colors.primary }]}>
                {plan.goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{plan.description}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{plan.daysPerWeek}</Text>
            <Text style={styles.statLabel}>Days/Week</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{plan.timePerWorkout}</Text>
            <Text style={styles.statLabel}>Min/Workout</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="repeat" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{plan.durationWeeks}</Text>
            <Text style={styles.statLabel}>Weeks</Text>
          </View>
        </View>

        {/* Workout Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Days</Text>
          {plan.days.map((day) => {
            const isExpanded = expandedDays[day.id];
            return (
              <TouchableOpacity
                key={day.id}
                style={styles.dayCard}
                onPress={() => toggleDayExpansion(day.id)}
                activeOpacity={0.8}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayName}>{day.name}</Text>
                    <Text style={styles.dayStats}>
                      {day.exercises.length} exercises · {day.totalSets} sets · ~{day.estimatedDuration} min
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.exerciseList}>
                    {day.exercises.map((exercise, index) => (
                      <View key={`${day.id}-${index}`} style={styles.exerciseItem}>
                        <View style={styles.exerciseIndex}>
                          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                        </View>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <View style={styles.exerciseMeta}>
                            <Text style={styles.exerciseEquipment}>
                              {exercise.primaryEquipment}
                              {exercise.adapted && ' (adapted)'}
                              {exercise.substitutedFor && ` (replaces ${exercise.substitutedFor})`}
                            </Text>
                            <Text style={styles.exerciseSets}>
                              {exercise.sets.length} sets × {exercise.sets[exercise.sets.length - 1]?.reps || '?'} reps
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Required Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Equipment</Text>
          <View style={styles.equipmentTags}>
            {plan.requiredEquipment.map((eq) => (
              <View key={eq} style={styles.equipmentTag}>
                <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.equipmentTagText}>{eq}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <StyledButton
            title={isSaved ? 'Already Saved' : (saving ? 'Saving...' : 'Save to My Programs')}
            onPress={handleSavePlan}
            variant="primary"
            size="lg"
            fullWidth
            icon={isSaved ? 'checkmark-circle' : 'add-circle'}
            disabled={saving || isSaved}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card,
    gap: 4,
  },
  badgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  description: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
  },
  dayStats: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  exerciseList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  exerciseIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIndexText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semiBold,
    color: Colors.primary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  exerciseEquipment: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  exerciseSets: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  equipmentTagText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  actions: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
