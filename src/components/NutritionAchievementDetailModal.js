import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function NutritionAchievementDetailModal({ visible, onClose, achievement, breakdown }) {
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
          <Text style={styles.description}>{achievement.desc}</Text>

          {!achievement.unlocked && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBarLarge}>
                <View
                  style={[
                    styles.progressFillLarge,
                    { width: `${Math.min((breakdown.current / breakdown.required) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {breakdown.current} / {breakdown.required}
              </Text>
            </View>
          )}

          <ScrollView style={styles.breakdownScroll} showsVerticalScrollIndicator={true}>
            {/* Streak achievements */}
            {breakdown.type === 'streak' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current} Day Streak!`
                    : `Progress: ${breakdown.current} / ${breakdown.required} Days`}
                </Text>
                {breakdown.recentDays && breakdown.recentDays.length > 0 && (
                  <>
                    <Text style={styles.breakdownSubtitle}>Recent Days</Text>
                    {breakdown.recentDays.map((day, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        <Text style={styles.itemNumber}>✓</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{day.date}</Text>
                          <Text style={styles.itemDetail}>
                            {Math.round(day.calories)} cal • {Math.round(day.protein)}g protein
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Days tracked achievements */}
            {breakdown.type === 'days_tracked' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current} Days Tracked!`
                    : `Progress: ${breakdown.current} / ${breakdown.required} Days`}
                </Text>
                {breakdown.recentDays && breakdown.recentDays.length > 0 && (
                  <>
                    <Text style={styles.breakdownSubtitle}>Recent Tracked Days</Text>
                    {breakdown.recentDays.slice(0, 10).map((day, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        <Text style={styles.itemNumber}>#{breakdown.current - index}</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{day.date}</Text>
                          <Text style={styles.itemDetail}>
                            {Math.round(day.calories)} cal • {Math.round(day.protein)}g protein
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Calorie total achievements */}
            {breakdown.type === 'calories' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current.toLocaleString()} Total Calories!`
                    : `Progress: ${breakdown.current.toLocaleString()} / ${breakdown.required.toLocaleString()}`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Stats</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Days Tracked:</Text>
                  <Text style={styles.statValue}>{breakdown.totalDays}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Average Per Day:</Text>
                  <Text style={styles.statValue}>{Math.round(breakdown.avgPerDay)} cal</Text>
                </View>
              </View>
            )}

            {/* Protein total achievements */}
            {breakdown.type === 'protein' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current.toLocaleString()}g Total Protein!`
                    : `Progress: ${breakdown.current.toLocaleString()}g / ${breakdown.required.toLocaleString()}g`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Stats</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Days Tracked:</Text>
                  <Text style={styles.statValue}>{breakdown.totalDays}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Average Per Day:</Text>
                  <Text style={styles.statValue}>{Math.round(breakdown.avgPerDay)}g protein</Text>
                </View>
              </View>
            )}

            {/* Goal days achievements */}
            {breakdown.type === 'goal_days' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current} Goal Days!`
                    : `Progress: ${breakdown.current} / ${breakdown.required} Days`}
                </Text>
                {breakdown.recentDays && breakdown.recentDays.length > 0 && (
                  <>
                    <Text style={styles.breakdownSubtitle}>Recent Goal Days</Text>
                    {breakdown.recentDays.slice(0, 10).map((day, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        <Text style={styles.itemNumber}>🎯</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{day.date}</Text>
                          <Text style={styles.itemDetail}>
                            {Math.round(day.calories)} cal (Goal: {day.goal})
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Consistency achievements */}
            {breakdown.type === 'consistency' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current}% Consistency!`
                    : `Progress: ${breakdown.current}% / ${breakdown.required}%`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Stats</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Days Logged:</Text>
                  <Text style={styles.statValue}>{breakdown.daysLogged}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Days:</Text>
                  <Text style={styles.statValue}>{breakdown.totalDays}</Text>
                </View>
              </View>
            )}

            {/* Deficit/Surplus achievements */}
            {(breakdown.type === 'deficit' || breakdown.type === 'surplus') && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current.toLocaleString()} cal ${breakdown.type === 'deficit' ? 'Deficit' : 'Surplus'}!`
                    : `Progress: ${breakdown.current.toLocaleString()} / ${breakdown.required.toLocaleString()} cal`}
                </Text>
                <Text style={styles.breakdownSubtitle}>Stats</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Days Contributing:</Text>
                  <Text style={styles.statValue}>{breakdown.daysCount}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Average Per Day:</Text>
                  <Text style={styles.statValue}>{Math.round(breakdown.avgPerDay)} cal</Text>
                </View>
              </View>
            )}

            {/* Macro achievements */}
            {breakdown.type === 'macros' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current} Perfect Macro Days!`
                    : `Progress: ${breakdown.current} / ${breakdown.required} Days`}
                </Text>
                {breakdown.recentDays && breakdown.recentDays.length > 0 && (
                  <>
                    <Text style={styles.breakdownSubtitle}>Recent Perfect Days</Text>
                    {breakdown.recentDays.slice(0, 10).map((day, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        <Text style={styles.itemNumber}>✨</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{day.date}</Text>
                          <Text style={styles.itemDetail}>
                            {Math.round(day.protein)}g P • {Math.round(day.carbs)}g C • {Math.round(day.fat)}g F
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Protein goal days achievements */}
            {breakdown.type === 'protein_goal_days' && (
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>
                  {breakdown.unlocked
                    ? `${breakdown.current} Protein Goal Days!`
                    : `Progress: ${breakdown.current} / ${breakdown.required} Days`}
                </Text>
                {breakdown.recentDays && breakdown.recentDays.length > 0 && (
                  <>
                    <Text style={styles.breakdownSubtitle}>Recent Protein Goals</Text>
                    {breakdown.recentDays.slice(0, 10).map((day, index) => (
                      <View key={index} style={styles.breakdownItem}>
                        <Text style={styles.itemNumber}>💪</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>{day.date}</Text>
                          <Text style={styles.itemDetail}>
                            {Math.round(day.protein)}g protein (Goal: {day.goal}g)
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
});
