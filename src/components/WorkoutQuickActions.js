/**
 * WorkoutQuickActions - Button-First UX for Active Workout Screen
 *
 * Actions relevant to IN-PROGRESS workout:
 * - Suggest Next Weight (progressive overload)
 * - Recommend Rest Time (based on goal)
 * - Too Hard/Easy? (adjust set difficulty)
 * - Add Similar Exercise
 * - Find Alternative Exercise
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import ProgressiveOverloadService from '../services/ai/ProgressiveOverloadService';
import { REP_RANGES } from '../services/ai/FitnessKnowledge';
import BackendService from '../services/backend/BackendService';

/**
 * Primary action buttons for active workout
 */
const getActiveWorkoutActions = (hasExercise) => [
  {
    id: 'suggest_weight',
    label: 'Suggest Weight',
    icon: 'trending-up',
    color: Colors.primary,
    disabled: !hasExercise,
  },
  {
    id: 'rest_time',
    label: 'Rest Timer',
    icon: 'timer',
    color: '#3B82F6',
    disabled: false,
  },
  {
    id: 'set_feedback',
    label: 'Too Hard/Easy?',
    icon: 'help-circle',
    color: '#8B5CF6',
    disabled: !hasExercise,
  },
  {
    id: 'find_alternative',
    label: 'Find Alternative',
    icon: 'swap-horizontal',
    color: '#F59E0B',
    disabled: !hasExercise,
  },
];

/**
 * Exercise alternatives database
 */
const EXERCISE_ALTERNATIVES = {
  'bench': {
    name: 'Bench Press',
    alternatives: [
      { name: 'Dumbbell Bench Press', reason: 'Better ROM, unilateral' },
      { name: 'Incline Bench Press', reason: 'Upper chest focus' },
      { name: 'Push-ups', reason: 'Bodyweight option' },
    ]
  },
  'squat': {
    name: 'Squat',
    alternatives: [
      { name: 'Front Squat', reason: 'More quad focus' },
      { name: 'Leg Press', reason: 'Easier on back' },
      { name: 'Bulgarian Split Squat', reason: 'Unilateral' },
    ]
  },
  'deadlift': {
    name: 'Deadlift',
    alternatives: [
      { name: 'Romanian Deadlift', reason: 'Hamstring focus' },
      { name: 'Trap Bar Deadlift', reason: 'Easier form' },
      { name: 'Rack Pulls', reason: 'Reduced ROM' },
    ]
  },
  'press': {
    name: 'Overhead Press',
    alternatives: [
      { name: 'Dumbbell Shoulder Press', reason: 'Greater ROM' },
      { name: 'Push Press', reason: 'More weight' },
      { name: 'Landmine Press', reason: 'Shoulder-friendly' },
    ]
  },
  'row': {
    name: 'Row',
    alternatives: [
      { name: 'Dumbbell Row', reason: 'Unilateral' },
      { name: 'Cable Row', reason: 'Constant tension' },
      { name: 'Pendlay Row', reason: 'Explosive' },
    ]
  },
  'curl': {
    name: 'Curl',
    alternatives: [
      { name: 'Hammer Curls', reason: 'Brachialis focus' },
      { name: 'Preacher Curls', reason: 'Strict form' },
      { name: 'Cable Curls', reason: 'Constant tension' },
    ]
  },
  'lat pulldown': {
    name: 'Lat Pulldown',
    alternatives: [
      { name: 'Pull-ups', reason: 'Bodyweight compound' },
      { name: 'Chin-ups', reason: 'More bicep' },
      { name: 'Straight Arm Pulldown', reason: 'Isolation' },
    ]
  },
  'tricep': {
    name: 'Tricep Extension',
    alternatives: [
      { name: 'Close Grip Bench', reason: 'Compound movement' },
      { name: 'Skull Crushers', reason: 'Long head focus' },
      { name: 'Dips', reason: 'Bodyweight option' },
    ]
  },
  'fly': {
    name: 'Chest Fly',
    alternatives: [
      { name: 'Cable Crossover', reason: 'Constant tension' },
      { name: 'Pec Deck', reason: 'Machine stability' },
      { name: 'Dumbbell Fly', reason: 'Greater stretch' },
    ]
  },
  'leg press': {
    name: 'Leg Press',
    alternatives: [
      { name: 'Hack Squat', reason: 'More quad focus' },
      { name: 'Goblet Squat', reason: 'Free weight option' },
      { name: 'Lunges', reason: 'Unilateral' },
    ]
  },
};

/**
 * Result Modal - Shows results of actions
 */
const ResultModal = ({ visible, onClose, title, content, actions }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.resultModal}>
        <Text style={styles.resultTitle}>{title}</Text>
        <View style={styles.resultContent}>
          {typeof content === 'string' ? (
            <Text style={styles.resultText}>{content}</Text>
          ) : (
            content
          )}
        </View>
        {actions && actions.length > 0 && (
          <View style={styles.resultActions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.resultActionButton,
                  action.primary && styles.resultActionButtonPrimary
                ]}
                onPress={action.onPress}
              >
                <Text style={[
                  styles.resultActionText,
                  action.primary && styles.resultActionTextPrimary
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

/**
 * Main WorkoutQuickActions Component
 */
const WorkoutQuickActions = ({
  currentExercise,
  currentExerciseIndex,
  onUpdateSet,
  onReplaceExercise,
  onOpenChat,
  currentWorkout,
  onStartRestTimer,
  exerciseSets,
  userGoal = 'hypertrophy', // strength, hypertrophy, endurance
}) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hasExercise = !!currentExercise;
  const exerciseName = currentExercise?.name || '';

  // Handle action button press
  const handleActionPress = useCallback(async (actionId) => {
    if (actionId === 'suggest_weight') {
      await handleSuggestWeight();
    } else if (actionId === 'rest_time') {
      handleRestTime();
    } else if (actionId === 'set_feedback') {
      handleSetFeedback();
    } else if (actionId === 'find_alternative') {
      handleFindAlternative();
    }
  }, [currentExercise, exerciseSets, currentExerciseIndex, userGoal]);

  // Suggest next weight based on progressive overload
  const handleSuggestWeight = async () => {
    setLoading(true);
    try {
      const userId = BackendService.getCurrentUserId() || 'guest';
      const recommendation = await ProgressiveOverloadService.analyzeExerciseProgression(
        userId,
        exerciseName
      );

      if (recommendation) {
        setResult({
          title: '💪 Weight Suggestion',
          content: (
            <View>
              <Text style={styles.resultHighlight}>
                {recommendation.suggestedWeight} lbs
              </Text>
              <Text style={styles.resultSubtext}>
                Current: {recommendation.currentWeight} lbs
              </Text>
              <Text style={styles.resultReason}>
                {recommendation.reason}
              </Text>
              {recommendation.type === 'ADD_VOLUME' && (
                <Text style={styles.resultTip}>
                  Tip: {recommendation.suggestion}
                </Text>
              )}
            </View>
          ),
          actions: [
            {
              label: `Use ${recommendation.suggestedWeight} lbs`,
              primary: true,
              onPress: () => {
                // Apply weight to current set
                if (onUpdateSet && exerciseSets?.[currentExerciseIndex]) {
                  const currentSets = exerciseSets[currentExerciseIndex];
                  if (currentSets.length > 0) {
                    const lastSetIndex = currentSets.length - 1;
                    onUpdateSet(currentExerciseIndex, lastSetIndex, 'weight', recommendation.suggestedWeight);
                  }
                }
                setResult(null);
              }
            },
          ]
        });
      } else {
        // No history - suggest based on current sets or defaults
        const currentSets = exerciseSets?.[currentExerciseIndex] || [];
        const lastSet = currentSets[currentSets.length - 1];
        const currentWeight = lastSet?.weight || 0;

        setResult({
          title: '💪 Weight Suggestion',
          content: currentWeight > 0 ? (
            <View>
              <Text style={styles.resultText}>
                You're currently at {currentWeight} lbs.
              </Text>
              <Text style={styles.resultTip}>
                Complete 2-3 more workouts with this exercise to get personalized progression advice!
              </Text>
            </View>
          ) : (
            <Text style={styles.resultText}>
              Start with a weight you can do 8-12 reps with good form. Log a few sessions to get personalized suggestions!
            </Text>
          ),
        });
      }
    } catch (error) {
      console.error('Error getting weight suggestion:', error);
      setResult({
        title: 'Weight Suggestion',
        content: 'Unable to get suggestion. Try completing a few more workouts first!',
      });
    }
    setLoading(false);
  };

  // Recommend rest time based on training goal
  const handleRestTime = () => {
    const goal = userGoal.toUpperCase();
    const restData = REP_RANGES[goal] || REP_RANGES.HYPERTROPHY;

    const restTimes = {
      STRENGTH: { time: '3-5 min', seconds: 180, description: 'Full recovery for max strength' },
      HYPERTROPHY: { time: '60-90 sec', seconds: 90, description: 'Optimal for muscle growth' },
      ENDURANCE: { time: '30-45 sec', seconds: 45, description: 'Short rest for endurance' },
      POWER: { time: '3-5 min', seconds: 180, description: 'Full recovery for explosive power' },
    };

    const restInfo = restTimes[goal] || restTimes.HYPERTROPHY;

    setResult({
      title: '⏱️ Recommended Rest',
      content: (
        <View>
          <Text style={styles.resultHighlight}>{restInfo.time}</Text>
          <Text style={styles.resultSubtext}>Goal: {goal.charAt(0) + goal.slice(1).toLowerCase()}</Text>
          <Text style={styles.resultReason}>{restInfo.description}</Text>
        </View>
      ),
      actions: [
        {
          label: `Start ${restInfo.seconds}s Timer`,
          primary: true,
          onPress: () => {
            onStartRestTimer?.(restInfo.seconds);
            setResult(null);
            setExpanded(false);
          }
        },
        {
          label: '2 min',
          onPress: () => {
            onStartRestTimer?.(120);
            setResult(null);
            setExpanded(false);
          }
        },
      ]
    });
  };

  // Handle set feedback (too hard/easy)
  const handleSetFeedback = () => {
    const currentSets = exerciseSets?.[currentExerciseIndex] || [];
    const lastSet = currentSets[currentSets.length - 1];
    const currentWeight = lastSet?.weight || 0;

    setResult({
      title: '📊 Set Feedback',
      content: (
        <View>
          <Text style={styles.resultText}>
            How was your last set at {currentWeight > 0 ? `${currentWeight} lbs` : 'current weight'}?
          </Text>
        </View>
      ),
      actions: [
        {
          label: '😓 Too Hard (-10%)',
          onPress: () => {
            if (onUpdateSet && currentWeight > 0) {
              const newWeight = Math.round(currentWeight * 0.9 / 5) * 5; // Round to nearest 5
              const nextSetIndex = currentSets.length; // New set
              // Apply to next set if added
              setResult({
                title: '✅ Noted',
                content: `Next set suggestion: ${newWeight} lbs\nDrop the weight and focus on form!`,
              });
            } else {
              setResult(null);
            }
          }
        },
        {
          label: '✅ Just Right',
          onPress: () => {
            setResult({
              title: '✅ Perfect!',
              content: 'Keep it up! This weight is in your sweet spot for progress.',
            });
          }
        },
        {
          label: '💪 Too Easy (+10%)',
          onPress: () => {
            if (currentWeight > 0) {
              const newWeight = Math.round(currentWeight * 1.1 / 5) * 5; // Round to nearest 5
              setResult({
                title: '🔥 Time to Level Up!',
                content: `Next set suggestion: ${newWeight} lbs\nYou're ready for more weight!`,
              });
            } else {
              setResult(null);
            }
          }
        },
      ]
    });
  };

  // Find alternative exercise
  const handleFindAlternative = () => {
    const nameLower = exerciseName.toLowerCase();

    // Find matching alternatives
    let alternativeSet = null;
    for (const [key, value] of Object.entries(EXERCISE_ALTERNATIVES)) {
      if (nameLower.includes(key)) {
        alternativeSet = value;
        break;
      }
    }

    if (alternativeSet) {
      setResult({
        title: '🔄 Alternatives',
        content: (
          <View>
            <Text style={styles.resultSubtext}>Instead of {alternativeSet.name}:</Text>
            {alternativeSet.alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.alternativeItem}
                onPress={() => {
                  onReplaceExercise?.(currentExerciseIndex, alt.name);
                  setResult(null);
                  setExpanded(false);
                }}
              >
                <Text style={styles.alternativeName}>{alt.name}</Text>
                <Text style={styles.alternativeReason}>{alt.reason}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ),
      });
    } else {
      // Generic suggestions
      setResult({
        title: '🔄 Find Alternative',
        content: (
          <View>
            <Text style={styles.resultText}>
              For {exerciseName}, consider:
            </Text>
            <Text style={styles.resultTip}>
              • A dumbbell variation (more ROM){'\n'}
              • A cable variation (constant tension){'\n'}
              • A machine variation (easier form)
            </Text>
            <TouchableOpacity
              style={styles.askAIButton}
              onPress={() => {
                onOpenChat?.();
                setResult(null);
                setExpanded(false);
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={Colors.primary} />
              <Text style={styles.askAIText}>Ask AI for more suggestions</Text>
            </TouchableOpacity>
          </View>
        ),
      });
    }
  };

  const actions = getActiveWorkoutActions(hasExercise);

  return (
    <View style={styles.container}>
      {/* Collapsed State - Just show a button */}
      {!expanded && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={20} color={Colors.background} />
          <Text style={styles.expandButtonText}>Quick Actions</Text>
          <Ionicons name="chevron-up" size={18} color={Colors.background} />
        </TouchableOpacity>
      )}

      {/* Expanded State - Show all actions */}
      {expanded && (
        <View style={styles.expandedContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={() => setExpanded(false)}>
              <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current Exercise Info */}
          {hasExercise && (
            <View style={styles.exerciseInfo}>
              <Ionicons name="barbell" size={16} color={Colors.primary} />
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exerciseName}
              </Text>
            </View>
          )}

          {/* Primary Action Buttons */}
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  { borderColor: action.disabled ? Colors.border : action.color },
                  action.disabled && styles.actionButtonDisabled,
                ]}
                onPress={() => !action.disabled && handleActionPress(action.id)}
                activeOpacity={action.disabled ? 1 : 0.7}
                disabled={action.disabled}
              >
                {loading && action.id === 'suggest_weight' ? (
                  <ActivityIndicator size="small" color={action.color} />
                ) : (
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={action.disabled ? Colors.textSecondary : action.color}
                  />
                )}
                <Text style={[
                  styles.actionButtonText,
                  { color: action.disabled ? Colors.textSecondary : action.color }
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fallback to AI Chat */}
          <TouchableOpacity
            style={styles.chatFallback}
            onPress={onOpenChat}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.textSecondary} />
            <Text style={styles.chatFallbackText}>Ask AI something else...</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result Modal */}
      <ResultModal
        visible={!!result}
        onClose={() => setResult(null)}
        title={result?.title}
        content={result?.content}
        actions={result?.actions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.md,
  },

  // Collapsed state
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  expandButtonText: {
    color: Colors.background,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },

  // Expanded state
  expandedContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },

  // Exercise info
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  exerciseName: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },

  // Action buttons grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },

  // Chat fallback
  chatFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  chatFallbackText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  // Result Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resultModal: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  resultTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resultContent: {
    marginBottom: Spacing.md,
  },
  resultText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultHighlight: {
    fontSize: 32,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  resultSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  resultReason: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultTip: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  resultActionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  resultActionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  resultActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  resultActionTextPrimary: {
    color: Colors.background,
  },
  closeButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.md,
  },

  // Alternative exercise items
  alternativeItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alternativeName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  alternativeReason: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  // Ask AI button
  askAIButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  askAIText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
});

export default WorkoutQuickActions;
