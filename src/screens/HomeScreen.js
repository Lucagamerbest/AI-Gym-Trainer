import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import Logo from '../components/Logo';
import ActiveWorkoutIndicator from '../components/ActiveWorkoutIndicator';
import { getNutritionGoals } from '../services/userProfileService';
import MealSyncService from '../services/backend/MealSyncService';
import { WorkoutStorageService } from '../services/workoutStorage';

// Helper function to get local date string in YYYY-MM-DD format (avoids UTC timezone issues)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const firstName = useMemo(() => user?.displayName?.split(' ')[0] || 'Champion', [user]);
  const [remainingCalories, setRemainingCalories] = useState(2000);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [expandedWorkout, setExpandedWorkout] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);

  // Workout insights state
  const [workoutInsights, setWorkoutInsights] = useState({
    currentStreak: 0,
    lastWorkout: null,
    totalPRs: 0,
  });

  // Nutrition insights state
  const [nutritionInsights, setNutritionInsights] = useState({
    currentStreak: 0,
    weeklyAvg: 0,
    nutritionStreak: 0,
    calorieGoal: 2000,
  });

  // Disable swipe gesture on home screen to prevent accidental navigation
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false
    });
  }, [navigation]);

  // Load nutrition and workout data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadNutritionData();
      loadWorkoutStats();
      loadWorkoutInsights();
      loadNutritionInsights();
    }, [user])
  );

  const loadNutritionData = async () => {
    try {
      const userId = user?.uid || 'guest';
      // Use local date, not UTC
      const date = new Date();
      const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      // Load macro goals from Firebase
      const goals = await getNutritionGoals(userId);
      const calorieGoal = goals.calories || 2000;

      // Load consumed meals from Firebase
      let consumedCals = 0;
      if (userId && userId !== 'guest') {
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, today);

          // Calculate total consumed calories
          firebaseMeals.forEach(meal => {
            consumedCals += meal.calories_consumed || 0;
          });
        } catch (error) {
        }
      }

      setConsumedCalories(consumedCals);
      // Calculate remaining calories (same as deficit in NutritionScreen)
      const remaining = Math.round(calorieGoal - consumedCals);
      setRemainingCalories(remaining);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  const loadWorkoutStats = async () => {
    try {
      const userId = user?.uid || 'guest';

      // Get all completed workouts
      const allWorkouts = await WorkoutStorageService.getWorkoutHistory(userId);

      // Count workouts this week (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const workoutsThisWeekCount = allWorkouts.filter(workout => {
        if (!workout || !workout.date) return false;
        const workoutDate = new Date(workout.date);
        return workoutDate >= sevenDaysAgo;
      }).length;

      setWorkoutsThisWeek(workoutsThisWeekCount);
    } catch (error) {
      console.error('Error loading workout stats:', error);
    }
  };

  const loadWorkoutInsights = async () => {
    try {
      const userId = user?.uid || 'guest';

      // Get user stats (includes streak)
      const stats = await WorkoutStorageService.getUserStats(userId);

      // Get workout history for last workout info
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      const lastWorkout = history.length > 0 ? history[history.length - 1] : null;

      // Count PRs (from exercise progress)
      const progress = await WorkoutStorageService.getExerciseProgress(userId);
      let totalPRs = 0;
      Object.values(progress).forEach(exercise => {
        if (exercise.records && exercise.records.length > 0) {
          // Find max weight for this exercise
          const maxWeight = Math.max(...exercise.records.map(r => r.weight || 0));
          if (maxWeight > 0) totalPRs++;
        }
      });

      setWorkoutInsights({
        currentStreak: stats?.currentStreak || 0,
        lastWorkout: lastWorkout ? {
          title: lastWorkout.workoutTitle || 'Workout',
          date: lastWorkout.date,
        } : null,
        totalPRs,
      });
    } catch (error) {
      console.error('Error loading workout insights:', error);
    }
  };

  const loadNutritionInsights = async () => {
    try {
      const userId = user?.uid || 'guest';

      // Load calorie goal
      const goals = await getNutritionGoals(userId);
      const calorieGoal = goals.calories || 2000;

      // For guest users, show defaults
      if (!userId || userId === 'guest') {
        setNutritionInsights({ currentStreak: 0, weeklyAvg: 0, nutritionStreak: 0, calorieGoal });
        return;
      }

      const today = new Date();
      const data = [];

      // Get last 30 days of data from Firebase (same source as calorie tracking)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateString(date);

        let dayCalories = 0;
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, dateStr);
          firebaseMeals.forEach(meal => {
            dayCalories += meal.calories_consumed || 0;
          });
        } catch (error) {
          // Silently continue if a day fails to load
        }
        data.push({ date: dateStr, calories: dayCalories });
      }

      // Calculate current streak (consecutive days with logged data from today backwards)
      let currentStreak = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].calories > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate weekly average (last 7 days with data)
      const last7Days = data.slice(-7);
      const daysWithData = last7Days.filter(d => d.calories > 0);
      const weeklyAvg = daysWithData.length > 0
        ? Math.round(daysWithData.reduce((sum, d) => sum + d.calories, 0) / daysWithData.length)
        : 0;

      // Calculate nutrition streak (consecutive days within ±10% of goal)
      // Success = between 90% and 110% of calorie goal
      const isSuccessfulDay = (calories) => {
        const lowerBound = calorieGoal * 0.9;
        const upperBound = calorieGoal * 1.1;
        return calories >= lowerBound && calories <= upperBound;
      };

      // Calculate streak from today backwards (only days with logged data count)
      let nutritionStreak = 0;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].calories > 0) {
          if (isSuccessfulDay(data[i].calories)) {
            nutritionStreak++;
          } else {
            break; // Streak broken by going over 10%
          }
        } else if (i === data.length - 1) {
          // Today has no data, that's okay - don't break streak yet
          continue;
        } else {
          // Past day with no data breaks the streak
          break;
        }
      }

      setNutritionInsights({
        currentStreak,
        weeklyAvg,
        nutritionStreak,
        calorieGoal,
      });
    } catch (error) {
      console.error('Error loading nutrition insights:', error);
    }
  };


  // Get greeting based on time of day
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerRow}>
              <Logo size="small" showText={false} />
              <Text style={styles.greeting}>{getGreeting}, {firstName}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Calorie Summary - Compact */}
          <TouchableOpacity
            style={styles.calorieSummary}
            onPress={() => navigation.getParent()?.navigate('NutritionDashboard')}
            activeOpacity={0.8}
          >
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieNumber}>
                {remainingCalories < 0 ? '+' : ''}{Math.abs(remainingCalories).toLocaleString()}
              </Text>
              <Text style={styles.calorieUnit}>kcal {remainingCalories < 0 ? 'over' : 'left'}</Text>
            </View>
            <View style={styles.calorieRight}>
              <Text style={styles.calorieDetail}>{consumedCalories.toLocaleString()} eaten</Text>
              <Text style={styles.calorieGoal}>of {nutritionInsights.calorieGoal.toLocaleString()} goal</Text>
            </View>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.getParent()?.navigate('Progress')}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={34} color={Colors.warning} />
              <Text style={styles.statValue}>{workoutInsights.currentStreak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.getParent()?.navigate('Progress')}
              activeOpacity={0.7}
            >
              <Ionicons name="fitness" size={34} color={Colors.primary} />
              <Text style={styles.statValue}>{workoutsThisWeek}</Text>
              <Text style={styles.statLabel}>this week</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statTile}
              onPress={() => navigation.getParent()?.navigate('NutritionDashboard')}
              activeOpacity={0.7}
            >
              <Ionicons name="nutrition" size={34} color={nutritionInsights.nutritionStreak > 0 ? Colors.success : Colors.textSecondary} />
              <Text style={styles.statValue}>{nutritionInsights.nutritionStreak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </TouchableOpacity>
          </View>

          {/* Main Action Buttons */}
          <View style={styles.mainActionsSection}>
            {/* Workout Section */}
            <View style={styles.expandableSection}>
              <TouchableOpacity
                style={styles.mainActionCard}
                onPress={() => navigation.getParent()?.navigate('StartWorkout')}
                onLongPress={() => setExpandedWorkout(!expandedWorkout)}
                activeOpacity={0.9}
              >
                <View style={styles.mainActionContent}>
                  <View style={styles.mainActionLeft}>
                    <View style={styles.mainActionIconCircle}>
                      <Text style={styles.styledEmoji}>💪</Text>
                    </View>
                    <Text style={styles.mainActionText}>Workout</Text>
                  </View>
                  <View style={styles.mainActionRight}>
                    <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} style={styles.arrowIcon} />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setExpandedWorkout(!expandedWorkout);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.chevronButton}
                    >
                      <Ionicons
                        name={expandedWorkout ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Workout Dropdown Options */}
              {expandedWorkout && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setExpandedWorkout(false);
                      navigation.getParent()?.navigate('WorkoutProgramsList');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="list" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Workout Programs</Text>
                      <Text style={styles.dropdownSubtitle}>Create or manage programs</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setExpandedWorkout(false);
                      navigation.getParent()?.navigate('WorkoutHistory');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="stats-chart" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Workout History</Text>
                      <Text style={styles.dropdownSubtitle}>View past sessions</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.dropdownItemLast]}
                    onPress={() => {
                      setExpandedWorkout(false);
                      navigation.getParent()?.navigate('PlanWorkout');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="calendar" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Plan Workout</Text>
                      <Text style={styles.dropdownSubtitle}>Schedule for later</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Nutrition Section */}
            <View style={styles.expandableSection}>
              <TouchableOpacity
                style={styles.mainActionCard}
                onPress={() => navigation.getParent()?.navigate('Nutrition')}
                onLongPress={() => setExpandedNutrition(!expandedNutrition)}
                activeOpacity={0.9}
              >
                <View style={styles.mainActionContent}>
                  <View style={styles.mainActionLeft}>
                    <View style={styles.mainActionIconCircle}>
                      <Text style={styles.styledEmoji}>🥗</Text>
                    </View>
                    <Text style={styles.mainActionText}>Nutrition</Text>
                  </View>
                  <View style={styles.mainActionRight}>
                    <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} style={styles.arrowIcon} />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setExpandedNutrition(!expandedNutrition);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.chevronButton}
                    >
                      <Ionicons
                        name={expandedNutrition ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Nutrition Dropdown Options */}
              {expandedNutrition && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setExpandedNutrition(false);
                      navigation.getParent()?.navigate('Camera', { returnScreen: 'FoodScanning' });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="camera" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Scan Food</Text>
                      <Text style={styles.dropdownSubtitle}>Barcode or camera scan</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setExpandedNutrition(false);
                      navigation.getParent()?.navigate('FoodSearch');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="search" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Search Food</Text>
                      <Text style={styles.dropdownSubtitle}>Quick food lookup</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setExpandedNutrition(false);
                      navigation.getParent()?.navigate('Recipes');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="book" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Recipes</Text>
                      <Text style={styles.dropdownSubtitle}>Browse meal ideas</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownItem, styles.dropdownItemLast]}
                    onPress={() => {
                      setExpandedNutrition(false);
                      navigation.getParent()?.navigate('MealPlanTemplates');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons name="document-text" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownTitle}>Meal Plans</Text>
                      <Text style={styles.dropdownSubtitle}>Create meal templates</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Track Weight Button */}
          <TouchableOpacity
            style={styles.trackWeightButton}
            onPress={() => navigation.getParent()?.navigate('MaintenanceFinder')}
            activeOpacity={0.8}
          >
            <View style={styles.trackWeightContent}>
              <Ionicons name="scale-outline" size={22} color={Colors.primary} />
              <View style={styles.trackWeightText}>
                <Text style={styles.trackWeightTitle}>Track Your Weight</Text>
                <Text style={styles.trackWeightSubtitle}>Find your maintenance calories</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Active Workout Indicator */}
      <ActiveWorkoutIndicator navigation={navigation} />
    </View>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.background,
  },

  // Calorie Summary
  calorieSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calorieLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: Spacing.sm,
  },
  calorieNumber: {
    fontSize: 44,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieUnit: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  calorieRight: {
    alignItems: 'flex-end',
  },
  calorieDetail: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    fontWeight: '600',
  },
  calorieGoal: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  
  // Program Cards (shared style for workout programs and planned meals)
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  programIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  programIcon: {
    fontSize: 20,
  },
  programInfo: {
    flex: 1,
  },
  programTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  programDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Recent Workouts
  recentWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentWorkoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recentWorkoutEmoji: {
    fontSize: 20,
  },
  recentWorkoutInfo: {
    flex: 1,
  },
  recentWorkoutTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  recentWorkoutDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Main Action Buttons
  mainActionsSection: {
    marginTop: 0,
    marginBottom: Spacing.xl,
  },
  expandableSection: {
    marginBottom: Spacing.md,
  },
  mainActionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 4,
  },
  mainActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  mainActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowIcon: {
    opacity: 0.6,
  },
  mainActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  styledEmoji: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mainActionIcon: {
    fontSize: 24,
  },
  mainActionText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown Styles
  dropdownContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  dropdownSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Track Weight Button
  trackWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackWeightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  trackWeightText: {
    flex: 1,
  },
  trackWeightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  trackWeightSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default React.memo(HomeScreen);