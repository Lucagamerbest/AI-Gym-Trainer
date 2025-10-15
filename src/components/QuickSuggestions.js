import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

function SuggestionChip({ suggestion, onPress }) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.suggestionChip}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{suggestion.icon}</Text>
        <Text style={styles.text}>{suggestion.text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickSuggestions({ screen, onSuggestionPress }) {
  const getSuggestions = () => {
    // Return suggestions based on current screen
    switch (screen) {
      case 'WorkoutDetailScreen':
      case 'WorkoutScreen':
      case 'StartWorkoutScreen':
        return [
          { icon: '💪', text: 'Should I increase weight?' },
          { icon: '🔢', text: 'How many sets should I do?' },
          { icon: '⏱️', text: 'How long should I rest?' },
          { icon: '📊', text: "How's my volume today?" },
          { icon: '🎯', text: 'What exercise should I add?' },
        ];

      case 'NutritionDashboard':
      case 'NutritionScreen':
      case 'FoodScanResultScreen':
        return [
          { icon: '🔥', text: 'How many calories left today?' },
          { icon: '🥩', text: 'Am I hitting my protein goal?' },
          { icon: '🍽️', text: 'What should I eat for dinner?' },
          { icon: '📈', text: 'Show my macro breakdown' },
          { icon: '💧', text: 'How much water should I drink?' },
        ];

      case 'ProgressScreen':
      case 'ProgressHubScreen':
        return [
          { icon: '📊', text: 'Am I making progress?' },
          { icon: '💪', text: 'Show my strength trends' },
          { icon: '🎯', text: 'What should I focus on?' },
          { icon: '📉', text: 'Identify my plateaus' },
          { icon: '🔥', text: 'How consistent am I?' },
        ];

      case 'ProfileScreen':
        return [
          { icon: '🎯', text: 'Review my goals' },
          { icon: '📊', text: 'Show my overall stats' },
          { icon: '🏆', text: 'What are my PRs?' },
          { icon: '💡', text: 'Suggest program improvements' },
        ];

      case 'HomeScreen':
        return [
          { icon: '🏋️', text: "What's my workout today?" },
          { icon: '🍽️', text: "What should I eat?" },
          { icon: '📊', text: 'How am I doing overall?' },
          { icon: '💪', text: 'Any new PRs lately?' },
        ];

      default:
        return [
          { icon: '💡', text: 'Give me workout advice' },
          { icon: '🍽️', text: 'Help with my nutrition' },
          { icon: '📊', text: 'Analyze my progress' },
          { icon: '🎯', text: 'Review my goals' },
        ];
    }
  };

  const suggestions = getSuggestions();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={150}
      >
        {suggestions.map((suggestion, index) => (
          <SuggestionChip
            key={index}
            suggestion={suggestion}
            onPress={() => onSuggestionPress(suggestion.text)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 44, // Better tap target
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
});
