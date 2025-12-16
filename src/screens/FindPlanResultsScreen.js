/**
 * FindPlanResultsScreen.js
 *
 * Shows workout plans matching the user's wizard selections
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import PlanCard from '../components/PlanCard';
import WorkoutPlanService from '../services/WorkoutPlanService';

export default function FindPlanResultsScreen({ navigation, route }) {
  const { filters } = route.params;
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [compatibilityScores, setCompatibilityScores] = useState({});

  useEffect(() => {
    findMatchingPlans();
  }, []);

  const findMatchingPlans = async () => {
    try {
      setLoading(true);

      // Map wizard selections to filter format
      const searchFilters = {
        daysPerWeek: filters.days,
        splitType: filters.split,
        difficulty: filters.difficulty,
        maxTimePerWorkout: filters.duration ? filters.duration + 15 : null,
        minTimePerWorkout: filters.duration ? filters.duration - 15 : null,
        equipmentProfile: filters.equipment,
      };

      // First try with all filters
      let results = await WorkoutPlanService.searchPlans(searchFilters);

      // If no results, try with relaxed filters (remove equipment/duration requirement)
      if (results.length === 0) {
        const relaxedFilters = { ...searchFilters };
        delete relaxedFilters.equipmentProfile;
        delete relaxedFilters.maxTimePerWorkout;
        delete relaxedFilters.minTimePerWorkout;
        results = await WorkoutPlanService.searchPlans(relaxedFilters);
      }

      // If still no results, try with just days and split
      if (results.length === 0) {
        results = await WorkoutPlanService.searchPlans({
          daysPerWeek: filters.days,
          splitType: filters.split,
        });
      }

      // If still nothing, try just days
      if (results.length === 0) {
        results = await WorkoutPlanService.searchPlans({
          daysPerWeek: filters.days,
        });
      }

      // If STILL nothing, get all plans
      if (results.length === 0) {
        results = await WorkoutPlanService.searchPlans({});
      }

      setPlans(results);

      // Check compatibility for each plan
      const scores = {};
      for (const plan of results) {
        const compatibility = await WorkoutPlanService.checkPlanCompatibility(plan);
        scores[plan.id] = compatibility.compatibilityScore;
      }
      setCompatibilityScores(scores);
    } catch (error) {
      console.error('Error finding plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PlanDetail', { plan });
  };

  const handleStartOver = () => {
    Haptics.selectionAsync();
    navigation.goBack();
  };

  const getFilterSummary = () => {
    const parts = [];
    if (filters.days) parts.push(`${filters.days} days`);
    if (filters.split) parts.push(filters.split.replace('-', '/'));
    if (filters.difficulty) parts.push(filters.difficulty);
    if (filters.duration) parts.push(`${filters.duration} min`);
    if (filters.equipment) parts.push(filters.equipment.replace('-', ' '));
    return parts.join(' · ');
  };

  if (loading) {
    return (
      <ScreenLayout
        title="Finding Plans"
        showBack={true}
        navigation={navigation}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding your perfect plans...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Your Plans"
      showBack={true}
      navigation={navigation}
    >
      {/* Results Header */}
      <View style={styles.header}>
        <View style={styles.resultsCount}>
          <Text style={styles.resultsNumber}>{plans.length}</Text>
          <Text style={styles.resultsLabel}>
            {plans.length === 1 ? 'Plan Found' : 'Plans Found'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refineButton} onPress={handleStartOver}>
          <Ionicons name="options" size={18} color={Colors.primary} />
          <Text style={styles.refineButtonText}>Refine</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Summary */}
      <View style={styles.filterSummary}>
        <Ionicons name="funnel" size={14} color={Colors.textMuted} />
        <Text style={styles.filterSummaryText}>{getFilterSummary()}</Text>
      </View>

      {/* Results */}
      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Exact Matches</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters to find more plans
          </Text>
          <TouchableOpacity style={styles.startOverButton} onPress={handleStartOver}>
            <Text style={styles.startOverButtonText}>Adjust Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.plansList}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => handleSelectPlan(plan)}
              showCompatibility={true}
              compatibilityScore={compatibilityScores[plan.id]}
            />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  resultsNumber: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  resultsLabel: {
    fontSize: Typography.sizes.lg,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  refineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  refineButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.semiBold,
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSummaryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  plansList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  startOverButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  startOverButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.background,
    fontWeight: Typography.weights.semiBold,
  },
});
