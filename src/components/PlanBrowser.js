/**
 * PlanBrowser.js
 *
 * Main component for browsing workout plans organized by split type
 * Features "Find My Program" wizard button and 4 category cards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import WorkoutPlanService from '../services/WorkoutPlanService';

const SPLIT_CATEGORIES = [
  {
    key: 'full-body',
    label: 'Full Body',
    icon: 'body',
    color: '#00B894',
    description: 'Hit every muscle group each session',
  },
  {
    key: 'ppl',
    label: 'Push / Pull / Legs',
    icon: 'layers',
    color: '#6C5CE7',
    description: 'Train by movement patterns',
  },
  {
    key: 'upper-lower',
    label: 'Upper / Lower',
    icon: 'swap-vertical',
    color: '#74B9FF',
    description: 'Alternate between upper and lower body',
  },
  {
    key: 'bro-split',
    label: 'Bro Split',
    icon: 'calendar',
    color: '#E17055',
    description: 'One muscle group per day',
  },
];

export default function PlanBrowser({ onSelectPlan }) {
  const Colors = useColors();
  const styles = createStyles(Colors);
  const navigation = useNavigation();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load plans on mount and focus
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const loadPlans = async () => {
    try {
      setLoading(true);
      const allPlans = WorkoutPlanService.getAllPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Count plans by split type
  const getPlanCount = (splitType) => {
    return plans.filter(plan => plan.splitType === splitType).length;
  };

  const handleFindProgram = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FindPlanWizard');
  };

  const handleCategoryPress = (category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SplitPlans', {
      splitType: category.key,
      splitLabel: category.label,
      splitColor: category.color,
      splitIcon: category.icon,
      splitDescription: category.description,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Find My Program Button */}
      <TouchableOpacity
        style={styles.findButton}
        onPress={handleFindProgram}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.findButtonGradient}
        >
          <Ionicons name="sparkles" size={22} color={Colors.background} />
          <Text style={styles.findButtonText}>Find My Program</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.background} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse by Split Type</Text>
        <Text style={styles.totalCount}>{plans.length} programs available</Text>
      </View>

      {/* Category Cards */}
      <View style={styles.categoriesContainer}>
        {SPLIT_CATEGORIES.map((category) => {
          const planCount = getPlanCount(category.key);
          return (
            <TouchableOpacity
              key={category.key}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon} size={28} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <View style={[styles.planCountBadge, { backgroundColor: category.color + '20' }]}>
                <Text style={[styles.planCountText, { color: category.color }]}>
                  {planCount}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
  },
  findButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  findButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  findButtonText: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
  },
  totalCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  categoriesContainer: {
    gap: Spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  planCountBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  planCountText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
