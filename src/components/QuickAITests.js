/**
 * QuickAITests - One-click test buttons for AI tools
 * Add this to your AI screen for instant testing
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function QuickAITests({ onTestQuery }) {
  const testQueries = [
    // Specific, contextual coaching questions
    { label: '💪 Am I overtraining?', query: 'Based on my recent workouts, am I overtraining or recovering well?' },
    { label: '📈 Why am I plateauing?', query: 'I feel like I\'m stuck on my lifts. What could be causing this plateau?' },
    { label: '🍽️ Am I eating enough protein?', query: 'Based on my logged meals, am I hitting my protein targets consistently?' },
    { label: '⚖️ Is my weight trend healthy?', query: 'Looking at my weight changes, is this a healthy rate of progress for my goals?' },
    { label: '🔥 Keep me accountable', query: 'Review my consistency this week and give me honest feedback' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Quick Questions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {testQueries.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => onTestQuery(test.query)}
          >
            <Text style={styles.buttonText}>{test.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
});
