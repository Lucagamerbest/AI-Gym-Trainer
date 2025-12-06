import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import Logo from '../components/Logo';
import ActiveWorkoutIndicator from '../components/ActiveWorkoutIndicator';
import { getNutritionGoals } from '../services/userProfileService';
import MealSyncService from '../services/backend/MealSyncService';
import { WorkoutStorageService } from '../services/workoutStorage';

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const firstName = useMemo(() => user?.displayName?.split(' ')[0] || 'Champion', [user]);
  const [remainingCalories, setRemainingCalories] = useState(2000);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [expandedWorkout, setExpandedWorkout] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);

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

      // Calculate current day (days since first workout or account creation)
      if (allWorkouts.length > 0) {
        const firstWorkoutDate = new Date(allWorkouts[allWorkouts.length - 1].date);
        const today = new Date();
        const daysSinceStart = Math.floor((today - firstWorkoutDate) / (1000 * 60 * 60 * 24)) + 1;
        setCurrentDay(daysSinceStart);
      }

      // Count workouts this week (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const workoutsThisWeekCount = allWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= sevenDaysAgo;
      }).length;

      setWorkoutsThisWeek(workoutsThisWeekCount);
    } catch (error) {
      console.error('Error loading workout stats:', error);
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
        {/* Header with Logo and Greeting */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Logo size="medium" showText={true} />
            <Text style={styles.greeting}>{getGreeting}, {firstName}</Text>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Ionicons name="flame-outline" size={16} color={Colors.background} />
                <Text style={styles.headerStatText}>Day {currentDay}</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Ionicons name="fitness-outline" size={16} color={Colors.background} />
                <Text style={styles.headerStatText}>
                  {workoutsThisWeek} {workoutsThisWeek === 1 ? 'workout' : 'workouts'} this week
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Calorie Stat Card (Non-clickable) */}
          <View style={styles.calorieCard}>
            <View style={styles.calorieHeader}>
              <View style={styles.calorieIconCircle}>
                <Ionicons name="flame" size={24} color={Colors.primary} />
              </View>
              <View style={styles.calorieTextContainer}>
                <Text style={styles.calorieValue}>
                  {Math.abs(remainingCalories)} kcal
                </Text>
                <Text style={styles.calorieLabel}>
                  {remainingCalories < 0 ? 'over goal today' : 'remaining today'}
                </Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min((consumedCalories / (consumedCalories + remainingCalories)) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {consumedCalories} / {consumedCalories + remainingCalories} kcal
              </Text>
            </View>
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
    paddingTop: 36,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.background,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatIcon: {
    fontSize: 16,
  },
  headerStatText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.background,
    fontWeight: '500',
  },
  headerStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: Spacing.md,
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

  // Calorie Card (with progress bar)
  calorieCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    padding: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.07,
    shadowRadius: 40,
    elevation: 8,
  },
  calorieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calorieIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  calorieValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: `${Colors.primary}15`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
});

export default React.memo(HomeScreen);