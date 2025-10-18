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

  // Different styling for back button
  const isBackButton = suggestion.isBackButton;
  const hasSubsections = suggestion.hasSubsections;

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
          colors={isBackButton
            ? [Colors.border + '30', Colors.border + '15']
            : [Colors.primary + '15', Colors.primary + '08']}
          style={[
            styles.suggestionChip,
            isBackButton && styles.backButtonChip
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{suggestion.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[
              styles.text,
              isBackButton && styles.backButtonText
            ]} numberOfLines={2}>
              {suggestion.text}
            </Text>
            {hasSubsections && (
              <Text style={styles.arrowIcon}>➡️</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickSuggestions({ screen, onSuggestionPress }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [navigationPath, setNavigationPath] = useState([]);
  const scrollViewRef = React.useRef(null);

  const getSuggestions = () => {
    // Return suggestions based on current screen
    switch (screen) {
      case 'StartWorkoutScreen':
        return [
          // PAGE 1: Main Categories (with subsections)
          {
            icon: '✨',
            text: 'Create a workout',
            hasSubsections: true,
            subsections: [
              { icon: '💪', text: 'Create a push workout' },
              { icon: '🔙', text: 'Create a pull workout' },
              { icon: '🦵', text: 'Create a leg workout' },
              { icon: '🏋️', text: 'Create a full body workout' },
              { icon: '💪', text: 'Create chest & triceps workout' },
              { icon: '🔙', text: 'Create back & biceps workout' },
              { icon: '💪', text: 'Create shoulders & arms workout' },
            ]
          },
          {
            icon: '📅',
            text: 'Plan a program',
            hasSubsections: true,
            subsections: [
              { icon: '📋', text: 'Create a 3-day full body split' },
              { icon: '📋', text: 'Create a 4-day upper/lower split' },
              { icon: '📋', text: 'Create a 5-day bro split' },
              { icon: '📋', text: 'Create a 6-day PPL program' },
              { icon: '📋', text: 'Create a custom split' },
            ]
          },
          {
            icon: '🎯',
            text: 'Suggest exercises',
            hasSubsections: true,
            subsections: [
              { icon: '💪', text: 'Suggest chest exercises' },
              { icon: '🔙', text: 'Suggest back exercises' },
              { icon: '🦵', text: 'Suggest leg exercises' },
              { icon: '💪', text: 'Suggest shoulder exercises' },
              { icon: '💪', text: 'Suggest arm exercises' },
              { icon: '🏋️', text: 'Suggest core exercises' },
            ]
          },
          {
            icon: '🚀',
            text: 'Progression check',
            hasSubsections: true,
            subsections: [
              { icon: '🚀', text: 'Should I progress?' },
              { icon: '💡', text: 'Should I increase weight?' },
              { icon: '📊', text: "What's my PR?" },
              { icon: '📈', text: 'Show my progress' },
            ]
          },

          // PAGE 2+: Quick Questions (no subsections)
          { icon: '🎯', text: 'What should I train today?' },
          { icon: '💪', text: 'What did I train last?' },
          { icon: '🔄', text: 'What exercise should I add?' },
          { icon: '📋', text: 'How to do exercises' },

          { icon: '🏋️', text: 'Alternative exercises' },
          { icon: '🔢', text: 'How many sets should I do?' },
          { icon: '⏱️', text: 'How long should I rest?' },
          { icon: '📊', text: "How's my volume?" },

          { icon: '💯', text: 'What should I focus on?' },
        ];

      case 'WorkoutDetailScreen':
      case 'WorkoutScreen':
        return [
          { icon: '🚀', text: 'Should I progress?' },
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
          { icon: '🚀', text: 'Should I progress?' },
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
          // Main category first
          {
            icon: '✨',
            text: 'Create a workout',
            hasSubsections: true,
            subsections: [
              { icon: '💪', text: 'Create a push workout' },
              { icon: '🔙', text: 'Create a pull workout' },
              { icon: '🦵', text: 'Create a leg workout' },
              { icon: '🏋️', text: 'Create a full body workout' },
              { icon: '💪', text: 'Create chest & triceps workout' },
              { icon: '🔙', text: 'Create back & biceps workout' },
            ]
          },
          // Quick questions after
          { icon: '🤔', text: 'Which workout should I do today?' },
          { icon: '💪', text: 'What did I train last?' },
          { icon: '🎯', text: 'Suggest a workout for me' },
        ];

      case 'PlannedWorkoutDetailScreen':
        return [
          { icon: '💡', text: 'Is this workout good for me?' },
          { icon: '🔄', text: 'Should I modify this workout?' },
          { icon: '🎯', text: 'What muscles does this target?' },
          { icon: '⏱️', text: 'How long will this take?' },
          { icon: '💪', text: 'What should I focus on today?' },
        ];

      case 'WorkoutHistoryScreen':
        return [
          // Main categories first (page 1)
          {
            icon: '📅',
            text: 'Plan a workout',
            hasSubsections: true,
            subsections: [
              { icon: '💪', text: 'Plan a push workout for tomorrow' },
              { icon: '🔙', text: 'Plan a pull workout for tomorrow' },
              { icon: '🦵', text: 'Plan a leg workout for tomorrow' },
              { icon: '🏋️', text: 'Plan a full body workout' },
            ]
          },
          {
            icon: '✨',
            text: 'Create a program',
            hasSubsections: true,
            subsections: [
              { icon: '📋', text: 'Create a 3-day full body split' },
              { icon: '📋', text: 'Create a 4-day upper/lower split' },
              { icon: '📋', text: 'Create a 5-day bro split' },
              { icon: '📋', text: 'Create a 6-day PPL program' },
            ]
          },
          // Quick questions after
          { icon: '📊', text: 'What did I train this week?' },
          { icon: '💪', text: 'Show my workout frequency' },
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

  const allSuggestions = getSuggestions();

  // Get current suggestions based on navigation path
  const getCurrentSuggestions = () => {
    if (navigationPath.length === 0) {
      return allSuggestions;
    }

    // Navigate to the current subsection
    let current = allSuggestions[navigationPath[0]];
    for (let i = 1; i < navigationPath.length; i++) {
      current = current.subsections[navigationPath[i]];
    }

    return current.subsections || [];
  };

  const suggestions = getCurrentSuggestions();
  const CARDS_PER_PAGE = 4;

  // Add back button if we're in a subsection
  const displaySuggestions = navigationPath.length > 0
    ? [{ icon: '←', text: 'Back', isBackButton: true }, ...suggestions]
    : suggestions;

  const totalPages = Math.ceil(displaySuggestions.length / CARDS_PER_PAGE);

  // Group suggestions into pages of 4
  const pages = [];
  for (let i = 0; i < displaySuggestions.length; i += CARDS_PER_PAGE) {
    pages.push(displaySuggestions.slice(i, i + CARDS_PER_PAGE));
  }

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const page = Math.round(contentOffsetX / pageWidth);
    setCurrentPage(page);
  };

  const handleSuggestionPress = (suggestion, index) => {
    // Handle back button
    if (suggestion.isBackButton) {
      setNavigationPath(navigationPath.slice(0, -1));
      setCurrentPage(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: false });
      }
      return;
    }

    // Handle navigation to subsection
    if (suggestion.hasSubsections) {
      // Calculate the actual index in the original array (accounting for back button)
      const actualIndex = navigationPath.length > 0 ? index - 1 : index;
      setNavigationPath([...navigationPath, actualIndex]);
      setCurrentPage(0);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, animated: false });
      }
      return;
    }

    // Handle final selection - send to AI
    onSuggestionPress(suggestion.text);
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
              {page.map((suggestion, index) => {
                const globalIndex = pageIndex * CARDS_PER_PAGE + index;
                return (
                  <SuggestionChip
                    key={globalIndex}
                    suggestion={suggestion}
                    onPress={() => handleSuggestionPress(suggestion, globalIndex)}
                  />
                );
              })}
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
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  arrowIcon: {
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.xs,
  },
  backButtonChip: {
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textSecondary,
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
