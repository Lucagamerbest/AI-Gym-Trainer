import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView as RNScrollView, ActivityIndicator } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeWorkoutInsights } from '../services/ai/AIActions';
import BackendService from '../services/backend/BackendService';
import { useAICoach } from '../context/AICoachContext';

export default function WorkoutSummaryScreen({ navigation, route }) {
  const { coachName } = useAICoach();
  const { workoutData, exerciseSets, saveResult } = route.params || {};
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const {
    duration = '00:00',
    exercisesCompleted = 0,
    exercises = [],
    startTime,
    endTime,
    workoutTitle = 'Quick Workout',
    workoutType = 'quick',
    notes = '',
    photos = [],
    totalWorkoutCalories = 0,
    totalCardioCalories = 0,
    strengthCalories = 0
  } = workoutData || {};

  // Calculate total calories (use stored total or sum components)
  const caloriesBurned = totalWorkoutCalories || (totalCardioCalories + strengthCalories);

  // Calculate summary stats from exercise sets
  const calculateStats = () => {
    let totalSets = 0;
    let totalVolume = 0;

    exercises.forEach((exercise, index) => {
      // Handle both numeric and string keys
      const sets = exerciseSets?.[index] || exerciseSets?.[index.toString()] || [];
      totalSets += sets.length;

      sets.forEach(set => {
        // All sets are considered completed by default
        if (set.weight && set.reps) {
          totalVolume += parseFloat(set.weight) * parseInt(set.reps);
        }
      });
    });

    // All sets are completed (100%)
    const completedSets = totalSets;

    return { totalSets, completedSets, totalVolume };
  };

  const { totalSets, completedSets, totalVolume } = calculateStats();

  // Load AI insights on mount
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoadingInsights(true);
        const userId = BackendService.getCurrentUserId() || 'guest';
        const result = await analyzeWorkoutInsights(workoutData, exerciseSets, userId);

        if (result.success && result.insights) {
          setAiInsights(result.insights);
        }
      } catch (error) {
        console.error('Error loading workout insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    loadInsights();
  }, []);

  const handleFinish = () => {
    // Navigate back to the main app (Home)
    navigation.navigate('Main', { screen: 'Home' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Unknown';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkoutTypeEmoji = () => {
    switch (workoutType) {
      case 'program': return '📋';
      case 'standalone': return '💪';
      case 'quick': return '⚡';
      default: return '🏋️';
    }
  };

  return (
    <ScreenLayout
      title="Workout Complete! 🎉"
      subtitle={workoutTitle}
      navigation={navigation}
      showBack={false}
      showHome={false}
      scrollable={true}
      screenName="WorkoutSummaryScreen"
      hideWorkoutIndicator={true}
    >
      {/* Workout Title & Photos */}
      {(photos.length > 0 || notes) && (
        <View style={styles.mediaSection}>
          {photos.length > 0 && (
            <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: `data:image/jpeg;base64,${photo}` }}
                  style={styles.summaryPhoto}
                />
              ))}
            </RNScrollView>
          )}
          {notes && (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>📝 Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <LinearGradient
          colors={[Colors.primary + '15', Colors.surface]}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{exercisesCompleted}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedSets}</Text>
              <Text style={styles.statLabel}>Sets Done</Text>
            </View>
          </View>

          {/* Additional Stats Row */}
          <View style={styles.additionalStats}>
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatValue}>{Math.round(totalVolume).toLocaleString()}</Text>
              <Text style={styles.additionalStatLabel}>Volume (lbs)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.additionalStatItem}>
              <Text style={[styles.additionalStatValue, caloriesBurned > 0 && styles.calorieValue]}>
                {caloriesBurned > 0 ? caloriesBurned : '--'}
              </Text>
              <Text style={styles.additionalStatLabel}>🔥 Calories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatValue}>{totalSets}</Text>
              <Text style={styles.additionalStatLabel}>Total Sets</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* AI Insights Section */}
      {loadingInsights ? (
        <View style={styles.insightsLoadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.insightsLoadingText}>Analyzing your workout...</Text>
        </View>
      ) : aiInsights.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.insightsTitleRow}>
            <Text style={styles.sectionTitle}>🤖 {coachName} Insights</Text>
          </View>
          {aiInsights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
              <Text style={styles.insightMessage}>{insight.message}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Workout Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started:</Text>
            <Text style={styles.detailValue}>{formatTime(startTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Finished:</Text>
            <Text style={styles.detailValue}>{formatTime(endTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{duration}</Text>
          </View>
        </View>
      </View>

      {/* Detailed Exercise Summary */}
      {exercises.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Summary</Text>
          {exercises.map((exercise, index) => {
            // Handle both numeric and string keys
            const sets = exerciseSets?.[index] || exerciseSets?.[index.toString()] || [];
            // All sets are considered completed
            const completedExerciseSets = sets;
            const bestSet = sets.reduce((best, set) => {
              const currentVolume = (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
              const bestVolume = (parseFloat(best?.weight) || 0) * (parseInt(best?.reps) || 0);
              return currentVolume > bestVolume ? set : best;
            }, null);

            return (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseCompletionBadge}>
                    {completedExerciseSets.length}/{sets.length} sets
                  </Text>
                </View>
                <Text style={styles.exerciseMeta}>
                  {exercise.equipment} • {exercise.difficulty}
                </Text>

                {/* Set Details */}
                {sets.length > 0 && (
                  <View style={styles.setsContainer}>
                    <View style={styles.setsHeader}>
                      <Text style={styles.setHeaderText}>Set</Text>
                      <Text style={styles.setHeaderText}>Weight</Text>
                      <Text style={styles.setHeaderText}>Reps</Text>
                    </View>
                    {sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.setRow}>
                        <Text style={styles.setNumber}>{setIndex + 1}</Text>
                        <Text style={styles.setValue}>
                          {set.weight ? `${set.weight} lbs` : '-'}
                        </Text>
                        <Text style={styles.setValue}>
                          {set.reps || '-'}
                        </Text>
                      </View>
                    ))}

                    {/* Best Set Highlight */}
                    {bestSet && (
                      <View style={styles.bestSetContainer}>
                        <Text style={styles.bestSetLabel}>💪 Best Set:</Text>
                        <Text style={styles.bestSetValue}>
                          {bestSet.weight} lbs × {bestSet.reps} reps
                          ({Math.round((parseFloat(bestSet.weight) || 0) * (parseInt(bestSet.reps) || 0))} volume)
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Motivational Message */}
      <View style={styles.messageCard}>
        <Text style={styles.messageText}>
          🌟 Excellent work! You've completed another step in your fitness journey. 
          Consistency is key to reaching your goals!
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>🏠 Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  mediaSection: {
    marginBottom: Spacing.lg,
  },
  photoScroll: {
    marginBottom: Spacing.md,
  },
  summaryPhoto: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.border,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  notesLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  notesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryGradient: {
    padding: Spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  additionalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '30',
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  calorieValue: {
    color: '#FF6B35',
  },
  additionalStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  exerciseItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  exerciseCompletionBadge: {
    backgroundColor: Colors.primary + '20',
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  exerciseMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  setsContainer: {
    marginTop: Spacing.sm,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  setHeaderText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '20',
  },
  setNumber: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    textAlign: 'center',
  },
  setValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    textAlign: 'center',
  },
  setStatus: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  setStatusCompleted: {
    color: Colors.primary,
  },
  bestSetContainer: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestSetLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  bestSetValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  messageCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  insightsLoadingContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  insightsLoadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  insightEmoji: {
    fontSize: Typography.fontSize.xl,
  },
  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    flex: 1,
  },
  insightMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
    marginLeft: Typography.fontSize.xl + Spacing.sm,
  },
});