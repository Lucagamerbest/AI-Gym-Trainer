import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function AchievementDetailModal({ visible, onClose, achievement, breakdown }) {
  if (!achievement || !breakdown) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.icon}>{achievement.icon}</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {!achievement.unlocked && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBarLarge}>
                <View
                  style={[
                    styles.progressFillLarge,
                    { width: `${Math.min((breakdown.total / breakdown.requirement) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {breakdown.total} / {breakdown.requirement}
              </Text>
            </View>
          )}

          <ScrollView style={styles.breakdownScroll} showsVerticalScrollIndicator={true}>
            {breakdown.type === 'workouts' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked ? `Your ${breakdown.total} Workouts` : `Progress: ${breakdown.total} / ${breakdown.requirement} Workouts`}
                </Text>
                {breakdown.workouts.map((workout, index) => (
                  <View key={workout.id} style={styles.breakdownItem}>
                    <Text style={styles.itemNumber}>#{index + 1}</Text>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{workout.title}</Text>
                      <Text style={styles.itemDetail}>
                        {workout.date} • {workout.exercises} exercises • {Math.floor(workout.duration / 60)}min
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {breakdown.type === 'volume' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.total.toLocaleString()} lbs Total Volume`
                    : `Progress: ${breakdown.total.toLocaleString()} / ${breakdown.requirement.toLocaleString()} lbs`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Exercise Breakdown</Text>
                {breakdown.exercises.map((exercise, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{exercise.name}</Text>
                      <Text style={styles.itemDetail}>
                        {exercise.volume.toLocaleString()} lbs • {exercise.workouts} workouts
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${(exercise.volume / breakdown.total) * 100}%` }
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {breakdown.type === 'streak' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.currentStreak} Day Streak`
                    : `Progress: ${breakdown.currentStreak} / ${breakdown.requirement} Days`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Recent Workouts</Text>
                {breakdown.recentWorkouts.map((workout, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Text style={styles.itemNumber}>✓</Text>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{workout.title}</Text>
                      <Text style={styles.itemDetail}>{workout.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 30,
    color: Colors.textMuted,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressSection: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
  },
  breakdownScroll: {
    maxHeight: 400,
  },
  breakdownSection: {
    marginTop: Spacing.md,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  breakdownSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: Spacing.sm,
    minWidth: 30,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
