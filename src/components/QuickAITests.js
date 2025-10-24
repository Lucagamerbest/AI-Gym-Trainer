/**
 * QuickAITests - One-click test buttons for AI tools
 * Add this to your AI screen for instant testing
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function QuickAITests({ onTestQuery }) {
  const testQueries = [
    // Existing Read-Only Tools
    { label: '💪 Generate Workout', query: 'Create a chest and triceps workout for hypertrophy' },
    { label: '🔍 Search Exercises', query: 'Show me all back exercises with dumbbells' },
    { label: '🧮 Calculate Macros', query: 'Calculate my macros for cutting at 80kg, 180cm, 25 years old' },
    { label: '🔄 Find Alternative', query: 'Find an alternative to bench press' },
    { label: '💡 Recommend', query: 'Recommend new exercises based on my training' },
    { label: '📊 Analyze History', query: 'Analyze my workout patterns' },
    { label: '🍽️ Meal Suggestion', query: 'Suggest a meal with 40g protein and 500 calories' },
    { label: '📈 Exercise Stats', query: 'What is my bench press PR?' },

    // NEW: CRUD Operations (Create, Read, Update, Delete)
    { label: '🏋️ Start Workout', query: 'Start a new push workout' },
    { label: '➕ Add Exercise', query: 'Add bench press to my workout' },
    { label: '📝 Log Set', query: 'Log 185 pounds for 5 reps on bench press' },
    { label: '📋 Recent Workouts', query: 'Show me my last 5 workouts' },
    { label: '🍗 Log Meal', query: 'I ate 8oz grilled chicken breast' },
    { label: '⚖️ Update Weight', query: 'Update my weight to 80kg' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Quick Tests</Text>
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
