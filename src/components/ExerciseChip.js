/**
 * ExerciseChip Component
 *
 * A tappable chip that displays an exercise name.
 * Used in AI chat to make exercise references clickable.
 * Tapping navigates to the exercise detail screen.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, BorderRadius } from '../constants/theme';

/**
 * ExerciseChip - Inline tappable exercise reference
 *
 * @param {Object} props
 * @param {Object} props.exercise - The exercise object from database
 * @param {string} props.displayText - Optional text to display (defaults to exercise.name)
 * @param {Function} props.onPress - Optional custom onPress handler
 * @param {Object} props.style - Optional additional styles
 * @param {boolean} props.inline - If true, renders as inline text element (default: true)
 */
export default function ExerciseChip({
  exercise,
  displayText,
  onPress,
  style,
  inline = true
}) {
  const navigation = useNavigation();

  if (!exercise) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress(exercise);
      return;
    }

    // Default behavior: navigate to exercise detail
    // If exercise has multiple variants, go to variant selection
    if (exercise.variants && exercise.variants.length > 1) {
      navigation.navigate('EquipmentVariantSelection', {
        exercise,
        mode: 'info'
      });
    } else {
      // Single variant or no variants - go directly to detail
      const exerciseWithVariant = exercise.variants && exercise.variants.length === 1
        ? {
            ...exercise,
            displayName: exercise.name,
            name: `${exercise.name} (${exercise.variants[0].equipment})`,
            selectedVariant: exercise.variants[0],
            equipment: exercise.variants[0].equipment,
            difficulty: exercise.variants[0].difficulty,
          }
        : exercise;

      navigation.navigate('ExerciseDetail', {
        exercise: exerciseWithVariant,
        fromWorkout: false
      });
    }
  };

  const text = displayText || exercise.name;

  // Inline version - renders as a Text component that can be nested
  if (inline) {
    return (
      <Text
        style={[styles.inlineChip, style]}
        onPress={handlePress}
        suppressHighlighting={false}
      >
        {text}
      </Text>
    );
  }

  // Block version - renders as a full TouchableOpacity
  return (
    <TouchableOpacity
      style={[styles.chip, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.chipIcon}>💪</Text>
      <Text style={styles.chipText}>{text}</Text>
    </TouchableOpacity>
  );
}

/**
 * ExerciseChipBlock - Non-inline version for use outside of Text components
 */
export function ExerciseChipBlock(props) {
  return <ExerciseChip {...props} inline={false} />;
}

const styles = StyleSheet.create({
  // Inline chip style - appears within text flow
  inlineChip: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: Colors.primary,
  },

  // Block chip style - standalone tappable element
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignSelf: 'flex-start',
    marginVertical: 4,
  },

  chipIcon: {
    fontSize: 12,
    marginRight: 6,
  },

  chipText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
});
