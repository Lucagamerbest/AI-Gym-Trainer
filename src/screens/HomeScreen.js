import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import Logo from '../components/Logo';
import ActiveWorkoutIndicator from '../components/ActiveWorkoutIndicator';
import AIHeaderButton from '../components/AIHeaderButton';
import { getNutritionGoals } from '../services/userProfileService';
import MealSyncService from '../services/backend/MealSyncService';

function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const firstName = useMemo(() => user?.displayName?.split(' ')[0] || 'Champion', [user]);
  const [remainingCalories, setRemainingCalories] = useState(2000);

  // Disable swipe gesture on home screen to prevent accidental navigation
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false
    });
  }, [navigation]);

  // Load nutrition data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadNutritionData();
    }, [user])
  );

  const loadNutritionData = async () => {
    try {
      const userId = user?.uid || 'guest';
      const today = new Date().toISOString().split('T')[0];

      // Load macro goals from Firebase
      const goals = await getNutritionGoals(userId);
      const calorieGoal = goals.calories || 2000;

      // Load consumed meals from Firebase
      let consumedCalories = 0;
      if (userId && userId !== 'guest') {
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, today);

          // Calculate total consumed calories
          firebaseMeals.forEach(meal => {
            consumedCalories += meal.calories_consumed || 0;
          });
        } catch (error) {
          console.log('⚠️ Could not load meals from Firebase:', error);
        }
      }

      // Calculate remaining calories (same as deficit in NutritionScreen)
      const remaining = Math.round(calorieGoal - consumedCalories);
      setRemainingCalories(remaining);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  // Get greeting based on time of day
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const quickStats = useMemo(() => [
    { label: 'Streak', value: '7', unit: 'days', icon: '🔥' },
    { label: 'This Week', value: '4', unit: 'workouts', icon: '💪' },
    { label: 'Calories', value: remainingCalories.toString(), unit: 'left today', icon: '⚡' },
  ], [remainingCalories]);

  return (
    <View style={styles.container}>
      {/* Background Design */}
      <View style={styles.backgroundDesign}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.primary, '#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* AI Button - Top Left */}
          <View style={styles.aiButtonContainer}>
            <AIHeaderButton screenName="HomeScreen" />
          </View>

          <View style={styles.headerContent}>
            <Logo size="large" showText={true} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {quickStats.map((stat, index) => {
              const isRemainingCalories = stat.label === 'Calories';

              const content = (
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statCardInner}
                >
                  <Text style={styles.statIcon}>{stat.icon}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statUnit}>{stat.unit}</Text>
                </LinearGradient>
              );

              if (isRemainingCalories) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.statCard}
                    onPress={() => navigation.getParent()?.navigate('Nutrition')}
                    activeOpacity={0.7}
                  >
                    {content}
                  </TouchableOpacity>
                );
              }

              return (
                <View key={index} style={styles.statCard}>
                  {content}
                </View>
              );
            })}
          </View>

          {/* Main Actions - Simple Two Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.mainActionCard}
              onPress={() => navigation.getParent()?.navigate('StartWorkout')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.05)', 'rgba(5, 150, 105, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[Colors.primary, '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradient}
                    >
                      <Text style={styles.actionIcon}>💪</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Start Workout</Text>
                    <Text style={styles.actionSubtitle}>Begin your training session</Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mainActionCard}
              onPress={() => navigation.getParent()?.navigate('Nutrition')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.05)', 'rgba(5, 150, 105, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[Colors.primary, '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradient}
                    >
                      <Text style={styles.actionIcon}>🥗</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={styles.actionTitle}>Track Nutrition</Text>
                    <Text style={styles.actionSubtitle}>Log your meals & calories</Text>
                  </View>
                  <Text style={styles.actionArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Active Workout Indicator */}
      <ActiveWorkoutIndicator navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundDesign: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    top: -150,
    right: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: '#059669',
    bottom: 100,
    left: -125,
  },
  circle3: {
    width: 200,
    height: 200,
    backgroundColor: '#10B981',
    bottom: -100,
    right: -50,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  aiButtonContainer: {
    position: 'absolute',
    top: 60,
    left: Spacing.lg,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 40,
    marginRight: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.background,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: Colors.card,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  actionsSection: {
    marginTop: Spacing.lg,
  },
  mainActionCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionGradient: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    marginRight: Spacing.lg,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 30,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  actionArrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default React.memo(HomeScreen);