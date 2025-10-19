import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import VolumeTrackingService from '../services/ai/VolumeTrackingService';

/**
 * WeeklyVolumeCard - Shows volume breakdown per muscle group
 */
export default function WeeklyVolumeCard({ userId }) {
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVolumeData();
  }, [userId]);

  const loadVolumeData = async () => {
    try {
      setLoading(true);
      const data = await VolumeTrackingService.getWeeklyVolume(userId);
      setVolumeData(data);
    } catch (error) {
      console.error('Error loading volume data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LOW': return Colors.error;
      case 'HIGH': return '#FF9500'; // Orange
      case 'OPTIMAL': return Colors.primary;
      default: return Colors.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'LOW': return 'arrow-down-circle';
      case 'HIGH': return 'warning';
      case 'OPTIMAL': return 'checkmark-circle';
      default: return 'remove-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!volumeData) {
    return null;
  }

  const { weeklyVolume, totalSets, workoutCount } = volumeData;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bar-chart" size={24} color={Colors.primary} />
          <Text style={styles.title}>Weekly Volume</Text>
        </View>
        <Text style={styles.subtitle}>{workoutCount} workouts</Text>
      </View>

      {/* Total Sets */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Sets This Week</Text>
        <Text style={styles.totalValue}>{totalSets}</Text>
      </View>

      {/* Muscle Group Breakdown */}
      <View style={styles.muscleGroups}>
        {Object.entries(weeklyVolume).map(([muscle, data]) => (
          <View key={muscle} style={styles.muscleRow}>
            <View style={styles.muscleInfo}>
              <Text style={styles.muscleName}>
                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
              </Text>
              <Text style={styles.muscleSets}>{data.sets} sets</Text>
            </View>

            <View style={styles.statusContainer}>
              <Ionicons
                name={getStatusIcon(data.status)}
                size={18}
                color={getStatusColor(data.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(data.status) }]}>
                {data.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Volume Guide */}
      <View style={styles.guide}>
        <Text style={styles.guideText}>
          Optimal: 10-20 sets per muscle per week
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  totalContainer: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  muscleGroups: {
    gap: Spacing.sm,
  },
  muscleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  muscleInfo: {
    flex: 1,
  },
  muscleName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  muscleSets: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  guide: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
  },
  guideText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
