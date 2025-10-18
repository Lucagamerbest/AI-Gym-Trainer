import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

function SuggestionChip({ suggestion, onPress }) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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
    <Animated.View style={[styles.chipWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.chipTouchable}
      >
        <LinearGradient
          colors={[Colors.primary + '15', Colors.primary + '08']}
          style={styles.suggestionChip}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{suggestion.icon}</Text>
          </View>
          <Text style={styles.text} numberOfLines={2}>{suggestion.text}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickSuggestions({ screen, onSuggestionPress }) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = React.useRef(null);

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
      case 'Nutrition':
        return [
          { icon: '🔥', text: 'How many calories left today?' },
          { icon: '🥩', text: 'Am I hitting my protein goal?' },
          { icon: '🍽️', text: 'What should I eat for dinner?' },
          { icon: '📈', text: 'Show my macro breakdown' },
          { icon: '⚡', text: 'Am I on track with nutrition?' },
        ];

      case 'RecipesScreen':
      case 'Recipes':
        return [
          { icon: '🍽️', text: 'Find a high protein recipe' },
          { icon: '💡', text: 'Suggest a recipe for me' },
          { icon: '📖', text: 'Show my saved recipes' },
          { icon: '🥗', text: 'What should I cook?' },
        ];

      case 'ProgressScreen':
      case 'ProgressHubScreen':
      case 'Progress':
        return [
          { icon: '🎯', text: 'Show my goals' },
          { icon: '🏆', text: 'What achievements have I earned?' },
          { icon: '🔥', text: "What's my streak?" },
          { icon: '📈', text: 'Show my squat progress' },
          { icon: '💪', text: "What's my bench press PR?" },
        ];

      case 'ExerciseDetailScreen':
      case 'ExerciseDetail':
        return [
          { icon: '📋', text: 'How to do this exercise' },
          { icon: '📊', text: 'Show my history' },
          { icon: '💪', text: "What's my PR?" },
          { icon: '🔄', text: 'Alternative exercises' },
        ];

      case 'ProfileScreen':
        return [
          { icon: '🎯', text: 'Review my goals' },
          { icon: '📊', text: 'Show my overall stats' },
          { icon: '🏆', text: 'What are my PRs?' },
          { icon: '💡', text: 'Suggest program improvements' },
        ];

      case 'TodayWorkoutOptionsScreen':
        return [
          { icon: '🤔', text: 'Which workout should I do today?' },
          { icon: '💪', text: 'What did I train last?' },
          { icon: '✨', text: 'Create a workout for chest and triceps' },
          { icon: '🎯', text: 'Suggest a workout for me' },
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
  const CARDS_PER_PAGE = 4;
  const totalPages = Math.ceil(suggestions.length / CARDS_PER_PAGE);

  // Group suggestions into pages of 4
  const pages = [];
  for (let i = 0; i < suggestions.length; i += CARDS_PER_PAGE) {
    pages.push(suggestions.slice(i, i + CARDS_PER_PAGE));
  }

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const page = Math.round(contentOffsetX / pageWidth);
    setCurrentPage(page);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {pages.map((page, pageIndex) => (
          <View key={pageIndex} style={styles.page}>
            <View style={styles.gridContainer}>
              {page.map((suggestion, index) => (
                <SuggestionChip
                  key={pageIndex * CARDS_PER_PAGE + index}
                  suggestion={suggestion}
                  onPress={() => onSuggestionPress(suggestion.text)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {totalPages > 1 && (
        <View style={styles.pagination}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
    backgroundColor: Colors.surface,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: Spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  chipWrapper: {
    width: '48%', // 2 columns
  },
  chipTouchable: {
    width: '100%',
  },
  suggestionChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    minHeight: 85,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
});
