import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import ContextManager from '../services/ai/ContextManager';

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
            <Ionicons
              name={suggestion.icon}
              size={28}
              color={isBackButton ? Colors.textSecondary : Colors.primary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[
              styles.text,
              isBackButton && styles.backButtonText
            ]} numberOfLines={3}>
              {suggestion.text}
            </Text>
            {hasSubsections && (
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function QuickSuggestions({ screen, onSuggestionPress, userId = 'guest' }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [navigationPath, setNavigationPath] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const scrollViewRef = React.useRef(null);

  // Load smart suggestions based on user context
  useEffect(() => {
    if (screen === 'StartWorkoutScreen' || screen === 'HomeScreen' || screen === 'AIScreen') {
      loadSmartSuggestions();
    }
  }, [userId, screen]);

  const loadSmartSuggestions = async () => {
    try {
      const suggestions = [];

      // Get recent workout history
      const recentWorkouts = await ContextManager.getAllWorkoutHistory(userId, 5);

      // Analyze which muscle groups to prioritize
      const muscleGroupSuggestion = analyzeMuscleGroups(recentWorkouts);
      if (muscleGroupSuggestion) {
        suggestions.push(muscleGroupSuggestion);
      }

      // Check nutrition status
      if (userId && userId !== 'guest') {
        const nutritionContext = await ContextManager.getNutritionContext(userId);
        const nutritionSuggestion = analyzeNutrition(nutritionContext);
        if (nutritionSuggestion) {
          suggestions.push(nutritionSuggestion);
        }
      }

      // Detect recent PRs
      if (recentWorkouts.length > 0) {
        const prSuggestion = detectRecentPRs(recentWorkouts);
        if (prSuggestion) {
          suggestions.push(prSuggestion);
        }
      }

      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    }
  };

  // Analyze recent workouts to suggest next muscle group
  const analyzeMuscleGroups = (recentWorkouts) => {
    if (recentWorkouts.length === 0) return null;

    // Get exercises from last 3 workouts
    const recentExercises = recentWorkouts.slice(0, 3).flatMap(w => w.exercises || []);

    // Count muscle groups trained (basic heuristic)
    const muscleGroups = {
      chest: 0,
      back: 0,
      legs: 0,
      shoulders: 0,
      arms: 0,
    };

    recentExercises.forEach(ex => {
      const name = ex.name.toLowerCase();
      if (name.includes('bench') || name.includes('chest') || name.includes('press') || name.includes('fly')) {
        muscleGroups.chest++;
      }
      if (name.includes('pull') || name.includes('row') || name.includes('lat') || name.includes('back')) {
        muscleGroups.back++;
      }
      if (name.includes('squat') || name.includes('leg') || name.includes('deadlift') || name.includes('lunge')) {
        muscleGroups.legs++;
      }
      if (name.includes('shoulder') || name.includes('lateral') || name.includes('overhead')) {
        muscleGroups.shoulders++;
      }
      if (name.includes('curl') || name.includes('tricep') || name.includes('bicep')) {
        muscleGroups.arms++;
      }
    });

    // Find the muscle group trained the least
    const sorted = Object.entries(muscleGroups).sort((a, b) => a[1] - b[1]);
    const [leastTrainedMuscle] = sorted[0];

    // Map to workout suggestions
    const muscleToWorkout = {
      chest: { icon: 'barbell', text: '🎯 Create a push workout (chest needs love!)' },
      back: { icon: 'return-down-back', text: '🎯 Create a pull workout (back needs attention!)' },
      legs: { icon: 'walk', text: '🎯 Create a leg workout (leg day incoming!)' },
      shoulders: { icon: 'barbell', text: '🎯 Create a shoulder workout (delts need work!)' },
      arms: { icon: 'barbell', text: '🎯 Create an arm workout (guns need pumping!)' },
    };

    const suggestion = muscleToWorkout[leastTrainedMuscle];
    if (!suggestion || !suggestion.text) return null;

    return { ...suggestion, priority: true };
  };

  // Analyze nutrition to suggest protein-rich meals
  const analyzeNutrition = (nutritionContext) => {
    if (!nutritionContext || !nutritionContext.protein) return null;

    const { protein, calories } = nutritionContext;

    // If protein is below 50% of goal, suggest high-protein meal
    if (protein && protein.percentage < 50 && protein.remaining) {
      return {
        icon: 'restaurant',
        text: `🎯 Need ${protein.remaining}g protein - get meal ideas!`,
        priority: true
      };
    }

    // If calories are low and it's past noon
    const hour = new Date().getHours();
    if (calories && calories.percentage < 40 && calories.consumed !== undefined && hour >= 12) {
      return {
        icon: 'flame',
        text: `🎯 Only ${calories.consumed} calories today - what should I eat?`,
        priority: true
      };
    }

    return null;
  };

  // Detect recent PRs in last workout
  const detectRecentPRs = (recentWorkouts) => {
    if (recentWorkouts.length < 2) return null;

    const lastWorkout = recentWorkouts[0];
    const previousWorkouts = recentWorkouts.slice(1);

    // Check if any exercise in last workout was a PR
    let foundPR = false;
    lastWorkout.exercises?.forEach(ex => {
      // Compare with previous performances
      previousWorkouts.forEach(prevWorkout => {
        prevWorkout.exercises?.forEach(prevEx => {
          if (ex.name === prevEx.name && ex.maxWeight > prevEx.maxWeight) {
            foundPR = true;
          }
        });
      });
    });

    if (foundPR) {
      return {
        icon: 'trophy',
        text: '🎯 You hit a PR! Analyze your progress',
        priority: true
      };
    }

    return null;
  };

  const getSuggestions = () => {
    // Return suggestions based on current screen
    switch (screen) {
      case 'StartWorkoutScreen':
        return [
          // PAGE 1: Main Categories (with subsections)
          {
            icon: 'sparkles',
            text: 'Create a workout',
            hasSubsections: true,
            subsections: [
              { icon: 'barbell', text: 'Create a push workout' },
              { icon: 'return-down-back', text: 'Create a pull workout' },
              { icon: 'walk', text: 'Create a leg workout' },
              { icon: 'fitness', text: 'Create a full body workout' },
              { icon: 'barbell', text: 'Create chest & triceps workout' },
              { icon: 'return-down-back', text: 'Create back & biceps workout' },
              { icon: 'barbell', text: 'Create shoulders & arms workout' },
            ]
          },
          {
            icon: 'calendar',
            text: 'Plan a program',
            hasSubsections: true,
            subsections: [
              { icon: 'trending-up', text: 'Create a 6-day PPL program' },
              { icon: 'barbell', text: 'Create a 4-day Upper/Lower program' },
              { icon: 'sparkles', text: 'Create a 5-day Bro Split program' },
            ]
          },
          {
            icon: 'fitness',
            text: 'Suggest exercises',
            hasSubsections: true,
            subsections: [
              { icon: 'barbell', text: 'Suggest chest exercises' },
              { icon: 'return-down-back', text: 'Suggest back exercises' },
              { icon: 'walk', text: 'Suggest leg exercises' },
              { icon: 'barbell', text: 'Suggest shoulder exercises' },
              { icon: 'barbell', text: 'Suggest arm exercises' },
              { icon: 'fitness', text: 'Suggest core exercises' },
            ]
          },
          {
            icon: 'rocket',
            text: 'Progression check',
            hasSubsections: true,
            subsections: [
              { icon: 'rocket', text: 'Should I progress?' },
              { icon: 'bulb', text: 'Should I increase weight?' },
              { icon: 'stats-chart', text: "What's my PR?" },
              { icon: 'trending-up', text: 'Show my progress' },
            ]
          },

          // PAGE 2+: Quick Questions (no subsections)
          { icon: 'fitness', text: 'What should I train today?' },
          { icon: 'barbell', text: 'What did I train last?' },
          { icon: 'add-circle', text: 'What exercise should I add?' },
          { icon: 'list', text: 'How to do exercises' },

          { icon: 'fitness', text: 'Alternative exercises' },
          { icon: 'calculator', text: 'How many sets should I do?' },
          { icon: 'timer', text: 'How long should I rest?' },
          { icon: 'bar-chart', text: "How's my volume?" },

          { icon: 'ribbon', text: 'What should I focus on?' },
        ];

      case 'WorkoutDetailScreen':
      case 'WorkoutScreen':
        return [
          { icon: 'rocket', text: 'Should I progress?' },
          { icon: 'barbell', text: 'Should I increase weight?' },
          { icon: 'calculator', text: 'How many sets should I do?' },
          { icon: 'timer', text: 'How long should I rest?' },
          { icon: 'bar-chart', text: "How's my volume today?" },
          { icon: 'add-circle', text: 'What exercise should I add?' },
        ];

      case 'NutritionDashboard':
      case 'NutritionScreen':
      case 'FoodScanResultScreen':
      case 'Nutrition':
        return [
          { icon: 'flame', text: 'How many calories left today?' },
          { icon: 'restaurant', text: 'Am I hitting my protein goal?' },
          { icon: 'restaurant', text: 'What should I eat for dinner?' },
          { icon: 'trending-up', text: 'Show my macro breakdown' },
          { icon: 'flash', text: 'Am I on track with nutrition?' },
        ];

      case 'RecipesScreen':
      case 'Recipes':
        return [
          { icon: 'restaurant', text: 'Find a high protein recipe' },
          { icon: 'bulb', text: 'Suggest a recipe for me' },
          { icon: 'book', text: 'Show my saved recipes' },
          { icon: 'leaf', text: 'What should I cook?' },
        ];

      case 'ProgressScreen':
      case 'ProgressHubScreen':
      case 'Progress':
        return [
          { icon: 'fitness', text: 'Show my goals' },
          { icon: 'trophy', text: 'What achievements have I earned?' },
          { icon: 'flame', text: "What's my streak?" },
          { icon: 'trending-up', text: 'Show my squat progress' },
          { icon: 'barbell', text: "What's my bench press PR?" },
        ];

      case 'ExerciseDetailScreen':
      case 'ExerciseDetail':
        return [
          { icon: 'rocket', text: 'Should I progress?' },
          { icon: 'list', text: 'How to do this exercise' },
          { icon: 'bar-chart', text: 'Show my history' },
          { icon: 'barbell', text: "What's my PR?" },
          { icon: 'sync', text: 'Alternative exercises' },
        ];

      case 'ProfileScreen':
        return [
          { icon: 'fitness', text: 'Review my goals' },
          { icon: 'stats-chart', text: 'Show my overall stats' },
          { icon: 'trophy', text: 'What are my PRs?' },
          { icon: 'bulb', text: 'Suggest program improvements' },
        ];

      case 'TodayWorkoutOptionsScreen':
        return [
          // Main category first
          {
            icon: 'sparkles',
            text: 'Create a workout',
            hasSubsections: true,
            subsections: [
              { icon: 'barbell', text: 'Create a push workout' },
              { icon: 'return-down-back', text: 'Create a pull workout' },
              { icon: 'walk', text: 'Create a leg workout' },
              { icon: 'fitness', text: 'Create a full body workout' },
              { icon: 'barbell', text: 'Create chest & triceps workout' },
              { icon: 'return-down-back', text: 'Create back & biceps workout' },
            ]
          },
          // Quick questions after
          { icon: 'help-circle', text: 'Which workout should I do today?' },
          { icon: 'barbell', text: 'What did I train last?' },
          { icon: 'fitness', text: 'Suggest a workout for me' },
        ];

      case 'PlannedWorkoutDetailScreen':
        return [
          { icon: 'bulb', text: 'Is this workout good for me?' },
          { icon: 'sync', text: 'Should I modify this workout?' },
          { icon: 'fitness', text: 'What muscles does this target?' },
          { icon: 'timer', text: 'How long will this take?' },
          { icon: 'barbell', text: 'What should I focus on today?' },
        ];

      case 'WorkoutHistoryScreen':
        return [
          // Main categories first (page 1)
          {
            icon: 'calendar',
            text: 'Plan a workout',
            hasSubsections: true,
            subsections: [
              { icon: 'barbell', text: 'Plan a push workout for tomorrow' },
              { icon: 'return-down-back', text: 'Plan a pull workout for tomorrow' },
              { icon: 'walk', text: 'Plan a leg workout for tomorrow' },
              { icon: 'fitness', text: 'Plan a full body workout' },
            ]
          },
          {
            icon: 'sparkles',
            text: 'Create a program',
            hasSubsections: true,
            subsections: [
              { icon: 'trending-up', text: 'Create a 6-day PPL program' },
              { icon: 'barbell', text: 'Create a 4-day Upper/Lower program' },
              { icon: 'sparkles', text: 'Create a 5-day Bro Split program' },
            ]
          },
          // Quick questions after
          { icon: 'bar-chart', text: 'What did I train this week?' },
          { icon: 'barbell', text: 'Show my workout frequency' },
        ];

      case 'HomeScreen':
        return [
          { icon: 'fitness', text: "What's my workout today?" },
          { icon: 'restaurant', text: "What should I eat?" },
          { icon: 'stats-chart', text: 'How am I doing overall?' },
          { icon: 'barbell', text: 'Any new PRs lately?' },
        ];

      case 'AIScreen':
        return [
          { icon: 'fitness', text: "What's my workout today?" },
          { icon: 'restaurant', text: 'What should I eat?' },
          { icon: 'stats-chart', text: 'How am I doing overall?' },
          { icon: 'barbell', text: 'Analyze my recent progress' },
          { icon: 'bulb', text: 'Give me personalized advice' },
          { icon: 'trophy', text: 'What are my PRs?' },
        ];

      default:
        return [
          { icon: 'bulb', text: 'Give me workout advice' },
          { icon: 'restaurant', text: 'Help with my nutrition' },
          { icon: 'bar-chart', text: 'Analyze my progress' },
          { icon: 'fitness', text: 'Review my goals' },
        ];
    }
  };

  const allSuggestions = getSuggestions();

  // Get current suggestions based on navigation path
  const getCurrentSuggestions = () => {
    if (navigationPath.length === 0) {
      // Inject smart suggestions at the top (only on main page)
      return [...smartSuggestions, ...allSuggestions];
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

  // Filter out any suggestions with empty or undefined text
  const validSuggestions = suggestions.filter(s => s && s.text && s.text.trim().length > 0);

  // Add back button if we're in a subsection
  const displaySuggestions = navigationPath.length > 0
    ? [{ icon: 'arrow-back', text: 'Back', isBackButton: true }, ...validSuggestions]
    : validSuggestions;

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
      // Calculate the actual index in the original array
      let actualIndex = index;

      if (navigationPath.length > 0) {
        // We're in a subsection, account for back button
        actualIndex = index - 1;
      } else {
        // We're on main page, account for smart suggestions
        actualIndex = index - smartSuggestions.length;
      }

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
    minHeight: 95,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  text: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
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
