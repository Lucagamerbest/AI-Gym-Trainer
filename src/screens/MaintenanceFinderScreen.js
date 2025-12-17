/**
 * MaintenanceFinderScreen.js
 *
 * Main screen for finding user's actual maintenance calories (TDEE)
 * based on weight and calorie tracking over 2 weeks.
 *
 * Three states:
 * A. Getting Started (< 7 days data)
 * B. Preliminary Results (7-13 days)
 * C. Final Results (14+ days)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import ScreenLayout from '../components/ScreenLayout';
import WeightLogModal from '../components/WeightLogModal';
import SimpleChart from '../components/SimpleChart';
import {
  getWeightHistory,
  logWeight,
  deleteWeightEntry,
  calculateCurrentTDEE,
  getTrackingProgress,
  resetWeightHistory,
} from '../services/MaintenanceCalculatorService';
import { updateNutritionGoals, getNutritionGoals } from '../services/userProfileService';
import { useAuth } from '../context/AuthContext';

export default function MaintenanceFinderScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Data state
  const [weightHistory, setWeightHistory] = useState([]);
  const [progress, setProgress] = useState(null);
  const [tdeeResult, setTdeeResult] = useState(null);

  // Load data on mount and focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [history, progressData, tdee] = await Promise.all([
        getWeightHistory(),
        getTrackingProgress(),
        calculateCurrentTDEE()
      ]);

      setWeightHistory(history);
      setProgress(progressData);
      setTdeeResult(tdee);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogWeight = async (data) => {
    try {
      await logWeight(data.date, data.weight, data.unit);
      setShowWeightModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save weight entry');
    }
  };

  const handleDeleteEntry = (date) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWeightEntry(date);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          }
        }
      ]
    );
  };

  const handleResetTracking = () => {
    Alert.alert(
      'Reset Tracking',
      'This will delete all weight entries and start fresh. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetWeightHistory();
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset tracking');
            }
          }
        }
      ]
    );
  };

  const handleUseAsGoal = async () => {
    if (!tdeeResult?.tdee || !user?.uid) return;

    try {
      const currentGoals = await getNutritionGoals(user.uid);
      await updateNutritionGoals(user.uid, {
        ...currentGoals,
        calories: tdeeResult.tdee
      });

      Alert.alert(
        'Goal Updated',
        `Your daily calorie goal has been set to ${tdeeResult.tdee.toLocaleString()} calories.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update calorie goal');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return Colors.success || '#22C55E';
      case 'medium': return Colors.warning || '#F59E0B';
      default: return Colors.textSecondary;
    }
  };

  const getConfidenceLabel = (confidence) => {
    switch (confidence) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Preliminary Estimate';
      default: return 'Need More Data';
    }
  };

  // Prepare chart data
  const chartData = weightHistory
    .slice(0, 14)
    .reverse()
    .map(entry => ({
      label: formatDate(entry.date),
      value: entry.weight
    }));

  const renderProgressBar = () => {
    const daysLogged = progress?.daysLogged || 0;
    const progressPercent = progress?.progress || 0;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressCount}>{daysLogged}/14 days</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {daysLogged < 7
            ? `Log ${7 - daysLogged} more days for preliminary results`
            : daysLogged < 14
              ? `Log ${14 - daysLogged} more days for accurate results`
              : 'You have enough data for accurate results!'}
        </Text>
      </View>
    );
  };

  const renderTDEEResult = () => {
    if (!tdeeResult?.tdee) return null;

    const { tdee, confidence, avgCalories, weightChange, daysTracked, calorieAdjustment, warning } = tdeeResult;

    return (
      <View style={styles.resultContainer}>
        <View style={styles.tdeeDisplay}>
          <Text style={styles.tdeeLabel}>Your Maintenance</Text>
          <Text style={styles.tdeeValue}>{tdee.toLocaleString()}</Text>
          <Text style={styles.tdeeUnit}>calories/day</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(confidence) + '20' }]}>
            <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(confidence) }]} />
            <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
              {getConfidenceLabel(confidence)}
            </Text>
          </View>
        </View>

        {warning && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color={Colors.warning || '#F59E0B'} />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        )}

        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>How we calculated this:</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Avg Daily Calories</Text>
              <Text style={styles.breakdownValue}>{avgCalories?.toLocaleString()}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Weight Change</Text>
              <Text style={[
                styles.breakdownValue,
                { color: weightChange > 0 ? (Colors.success || '#22C55E') : weightChange < 0 ? (Colors.error || '#EF4444') : Colors.text }
              ]}>
                {weightChange > 0 ? '-' : weightChange < 0 ? '+' : ''}{Math.abs(weightChange)} lbs
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Days Tracked</Text>
              <Text style={styles.breakdownValue}>{daysTracked}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Daily Adjustment</Text>
              <Text style={styles.breakdownValue}>
                {calorieAdjustment > 0 ? '+' : ''}{calorieAdjustment} cal
              </Text>
            </View>
          </View>
        </View>

        {confidence === 'high' && (
          <TouchableOpacity
            style={styles.useGoalButton}
            onPress={handleUseAsGoal}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.useGoalButtonText}>Use as My Calorie Goal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderWeightChart = () => {
    if (chartData.length < 2) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weight Trend</Text>
        <SimpleChart
          data={chartData}
          height={150}
          color={Colors.primary}
          showLabels
        />
      </View>
    );
  };

  const renderWeightHistory = () => {
    if (weightHistory.length === 0) return null;

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Weight History</Text>
        {weightHistory.slice(0, 14).map((entry, index) => (
          <TouchableOpacity
            key={entry.date}
            style={styles.historyItem}
            onLongPress={() => handleDeleteEntry(entry.date)}
          >
            <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
            <Text style={styles.historyWeight}>
              {entry.weight} {entry.unit}
            </Text>
            {index === 0 && (
              <View style={styles.latestBadge}>
                <Text style={styles.latestBadgeText}>Latest</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <Text style={styles.historyHint}>Long press to delete an entry</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="scale-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>Find Your Maintenance Calories</Text>
      <Text style={styles.emptyDescription}>
        Log your weight daily for 2 weeks while tracking your food.
        We'll calculate your actual maintenance calories based on real data.
      </Text>
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How it works:</Text>
        <View style={styles.howItWorksItem}>
          <Text style={styles.howItWorksNumber}>1</Text>
          <Text style={styles.howItWorksText}>Log your weight each morning</Text>
        </View>
        <View style={styles.howItWorksItem}>
          <Text style={styles.howItWorksNumber}>2</Text>
          <Text style={styles.howItWorksText}>Track your food intake daily</Text>
        </View>
        <View style={styles.howItWorksItem}>
          <Text style={styles.howItWorksNumber}>3</Text>
          <Text style={styles.howItWorksText}>After 14 days, see your real TDEE</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenLayout
      title="Find My Maintenance"
      showBackButton
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Log Weight Button */}
        <TouchableOpacity
          style={styles.logWeightButton}
          onPress={() => setShowWeightModal(true)}
        >
          <View style={styles.logWeightContent}>
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
            <View>
              <Text style={styles.logWeightTitle}>Log Today's Weight</Text>
              {progress?.lastEntry && (
                <Text style={styles.logWeightSubtitle}>
                  Last: {progress.lastEntry.weight} {progress.lastEntry.unit}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Progress Bar */}
        {progress?.hasStarted && renderProgressBar()}

        {/* TDEE Result (if available) */}
        {tdeeResult?.tdee && renderTDEEResult()}

        {/* Weight Chart */}
        {renderWeightChart()}

        {/* Weight History or Empty State */}
        {weightHistory.length > 0 ? renderWeightHistory() : renderEmptyState()}

        {/* Reset Button */}
        {weightHistory.length > 0 && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetTracking}
          >
            <Ionicons name="refresh" size={16} color={Colors.error || '#EF4444'} />
            <Text style={styles.resetButtonText}>Reset & Start Over</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Weight Log Modal */}
      <WeightLogModal
        visible={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSave={handleLogWeight}
        lastEntry={progress?.lastEntry}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  logWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  logWeightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logWeightTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  logWeightSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  progressCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  tdeeDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tdeeLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  tdeeValue: {
    fontSize: 48,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  tdeeUnit: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (Colors.warning || '#F59E0B') + '15',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.warning || '#F59E0B',
  },
  breakdownContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#2C2C2E',
    paddingTop: Spacing.md,
  },
  breakdownTitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  useGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  useGoalButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  historyContainer: {
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#2C2C2E',
  },
  historyDate: {
    flex: 1,
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  historyWeight: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  latestBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  latestBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold,
  },
  historyHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  howItWorks: {
    width: '100%',
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  howItWorksTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  howItWorksNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: '#fff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: Spacing.sm,
  },
  howItWorksText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  resetButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error || '#EF4444',
  },
});
