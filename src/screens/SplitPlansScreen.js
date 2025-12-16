/**
 * SplitPlansScreen.js
 *
 * Displays all workout plans for a specific split type
 * Includes filtering by days, difficulty, and equipment
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import PlanCard from '../components/PlanCard';
import PlanFilterModal from '../components/PlanFilterModal';
import WorkoutPlanService from '../services/WorkoutPlanService';

export default function SplitPlansScreen({ navigation, route }) {
  const {
    splitType,
    splitLabel,
    splitColor,
    splitIcon,
    splitDescription,
    searchQuery: initialSearchQuery,
  } = route.params;

  const Colors = useColors();
  const styles = createStyles(Colors, splitColor);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const hasLoadedRef = useRef(false);

  // Load plans on mount and when filters change
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [activeFilters])
  );

  const loadPlans = async () => {
    try {
      // Only show loading spinner on initial load, not on navigation back
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      // Build filters
      const filters = {
        ...activeFilters,
      };

      // Add split type filter if provided
      if (splitType) {
        filters.splitType = splitType;
      }

      // Add search query if provided
      if (initialSearchQuery) {
        filters.searchQuery = initialSearchQuery;
      }

      const results = await WorkoutPlanService.searchPlans(filters);
      setPlans(results);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  };

  const handleFilterApply = (filters) => {
    // Remove splitType from user filters since we're already filtering by split
    const { splitType: _, ...otherFilters } = filters;
    setActiveFilters(otherFilters);
  };

  const handleSelectPlan = (plan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PlanDetail', { plan });
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  const getFilterSummary = () => {
    const parts = [];
    if (activeFilters.daysPerWeek) parts.push(`${activeFilters.daysPerWeek} days`);
    if (activeFilters.difficulty) parts.push(activeFilters.difficulty);
    if (activeFilters.equipmentProfile) parts.push(activeFilters.equipmentProfile.replace('-', ' '));
    return parts.join(' · ');
  };

  if (loading) {
    return (
      <ScreenLayout
        title={splitLabel}
        showBack={true}
        navigation={navigation}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={splitColor || Colors.primary} />
          <Text style={styles.loadingText}>Loading programs...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title={splitLabel}
      showBack={true}
      navigation={navigation}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name={splitIcon} size={32} color={splitColor || Colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{splitLabel} Programs</Text>
          <Text style={styles.headerDescription}>{splitDescription}</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="options"
            size={18}
            color={activeFilterCount > 0 ? splitColor : Colors.textSecondary}
          />
          <Text style={[
            styles.filterButtonText,
            activeFilterCount > 0 && { color: splitColor },
          ]}>
            {activeFilterCount > 0 ? getFilterSummary() : 'Filter by Days, Difficulty, Equipment'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={clearFilters}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={splitColor} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {plans.length} {plans.length === 1 ? 'program' : 'programs'} found
        </Text>
      </View>

      {/* Plans List */}
      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Programs Found</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilterCount > 0
              ? 'Try adjusting your filters to find more programs'
              : `No ${splitLabel.toLowerCase()} programs available yet`}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.plansList}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => handleSelectPlan(plan)}
            />
          ))}
        </View>
      )}

      <PlanFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        initialFilters={activeFilters}
        hideSplitType={true}
      />
    </ScreenLayout>
  );
}

const createStyles = (Colors, accentColor) => StyleSheet.create({
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (accentColor || Colors.primary) + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: (accentColor || Colors.primary) + '30',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: (accentColor || Colors.primary) + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  filterBar: {
    marginBottom: Spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: (accentColor || Colors.primary) + '15',
    borderColor: (accentColor || Colors.primary) + '50',
  },
  filterButtonText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  plansList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  clearButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: accentColor || Colors.primary,
    borderRadius: BorderRadius.full,
  },
  clearButtonText: {
    color: Colors.background,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
  },
});
