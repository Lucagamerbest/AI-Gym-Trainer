import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import AIChatModal from '../components/AIChatModal';
import ProactiveSuggestionCard from '../components/ProactiveSuggestionCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useAICoach } from '../context/AICoachContext';
import ProactiveAIService from '../services/ai/ProactiveAIService';
import { getNutritionGoals } from '../services/userProfileService';
import MealSyncService from '../services/backend/MealSyncService';
import WorkoutSyncService from '../services/backend/WorkoutSyncService';
import { WorkoutStorageService } from '../services/workoutStorage';

// Motivational quotes
const MOTIVATIONAL_QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Anonymous" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Anonymous" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { text: "Don't wish for it, work for it.", author: "Anonymous" },
  { text: "The difference between try and triumph is a little umph.", author: "Anonymous" },
];

export default function AIScreen({ navigation }) {
  const { user } = useAuth();
  const { coachName, updateCoachName, defaultName } = useAICoach();
  const firstName = useMemo(() => user?.displayName?.split(' ')[0] || 'Champion', [user]);
  const [chatVisible, setChatVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [remainingCalories, setRemainingCalories] = useState(2000);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [lastWorkout, setLastWorkout] = useState('No workouts yet');
  const [lastWorkoutTitle, setLastWorkoutTitle] = useState('');
  const [todayMealPlan, setTodayMealPlan] = useState(null);
  const [todayWorkoutPlan, setTodayWorkoutPlan] = useState(null);
  const [todayQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  // Coach name editing
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Load suggestions when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadSuggestions();
      loadUserStats();

      // Animate entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, [user?.uid])
  );

  const loadSuggestions = async () => {
    if (!user?.uid) return;

    try {
      const activeSuggestions = await ProactiveAIService.getAllSuggestions(user.uid);
      setSuggestions(activeSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const userId = user?.uid || 'guest';
      // Use local date instead of UTC to avoid timezone issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Load nutrition data
      const goals = await getNutritionGoals(userId);
      const calGoal = goals.calories || 2000;
      setCalorieGoal(calGoal);

      let consumed = 0;
      if (userId && userId !== 'guest') {
        try {
          const firebaseMeals = await MealSyncService.getMealsByDate(userId, today);
          firebaseMeals.forEach(meal => {
            consumed += meal.calories_consumed || 0;
          });
        } catch (error) {
        }
      }

      setConsumedCalories(Math.round(consumed));
      const remaining = Math.round(calGoal - consumed);
      setRemainingCalories(remaining);

      // Load workout data
      if (userId && userId !== 'guest') {
        try {
          const allWorkouts = await WorkoutSyncService.getAllWorkouts(100);

          // Get last workout
          if (allWorkouts.length > 0) {
            const sortedWorkouts = allWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastWorkoutData = sortedWorkouts[0];
            setLastWorkoutTitle(lastWorkoutData.workoutTitle || 'Workout');
            const daysSince = Math.floor((new Date() - new Date(lastWorkoutData.date)) / (1000 * 60 * 60 * 24));

            if (daysSince === 0) {
              setLastWorkout('Today');
            } else if (daysSince === 1) {
              setLastWorkout('Yesterday');
            } else {
              setLastWorkout(`${daysSince} days ago`);
            }

            // Streak and weekly stats removed - no longer needed
          }
        } catch (error) {
        }
      }

      // Check for today's planned meals
      try {
        const MEAL_PLANS_KEY = '@meal_plans';
        const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
        if (savedPlans) {
          const mealPlans = JSON.parse(savedPlans);
          const todayPlanned = mealPlans[today]?.planned;

          if (todayPlanned) {
            // Check if there are any planned meals for today
            const hasPlannedMeals = Object.values(todayPlanned).some(meals => meals && meals.length > 0);
            if (hasPlannedMeals) {
              setTodayMealPlan(todayPlanned);
            }
          }
        } else {
        }
      } catch (error) {
      }

      // Check for today's planned workout
      if (userId && userId !== 'guest') {
        try {
          const plannedWorkout = await WorkoutStorageService.getPlannedWorkoutByDate(today, userId);
          if (plannedWorkout) {
            const workoutName = plannedWorkout.workoutName || plannedWorkout.workoutTitle || 'Unnamed workout';
            setTodayWorkoutPlan(plannedWorkout);
          } else {
          }
        } catch (error) {
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    await loadUserStats();
    setRefreshing(false);
  };

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Get motivation emoji based on streak
  const getStreakEmoji = () => {
    if (workoutStreak === 0) return '💤';
    if (workoutStreak < 3) return '🔥';
    if (workoutStreak < 7) return '🚀';
    if (workoutStreak < 14) return '⚡';
    return '👑';
  };

  const handleSuggestionPress = (suggestion) => {
    const prompt = ProactiveAIService.getSuggestionPrompt(suggestion);
    setInitialMessage(prompt);
    setChatVisible(true);
  };

  const handleDismiss = (suggestion) => {
    ProactiveAIService.dismissSuggestion(
      suggestion.type,
      suggestion.data?.exerciseName || suggestion.data?.lastWorkout?.id || 'general'
    );
    loadSuggestions();
  };

  // Calculate calorie progress percentage
  const calorieProgress = calorieGoal > 0 ? (consumedCalories / calorieGoal) * 100 : 0;

  // Coach name editing handlers
  const openNameEditor = () => {
    setEditingName(coachName);
    setNameModalVisible(true);
  };

  const saveCoachName = async () => {
    await updateCoachName(editingName);
    setNameModalVisible(false);
  };

  const cancelNameEdit = () => {
    setNameModalVisible(false);
    setEditingName('');
  };

  return (
    <>
      <ScreenLayout
        title={coachName}
        subtitle="Your Personal Fitness Assistant"
        navigation={navigation}
        showBack={false}
        showHome={false}
        centerContent={false}
        rightComponent={
          <TouchableOpacity onPress={openNameEditor} style={styles.editNameButton}>
            <Ionicons name="pencil" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        }
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Simple Welcome Message */}
            <View style={styles.welcomeMessage}>
              <Text style={styles.welcomeEmoji}>👋</Text>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>{greeting}, <Text style={styles.welcomeName}>{firstName}!</Text></Text>
              </View>
            </View>

            {/* Chat Button - MOVED TO TOP - Primary Action */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => setChatVisible(true)}
              activeOpacity={0.95}
            >
              <View style={styles.chatButtonContent}>
                <View style={styles.chatButtonIconContainer}>
                  <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
                </View>
                <View style={styles.chatButtonTextContainer}>
                  <Text style={styles.chatButtonTitle}>Chat with Coach</Text>
                  <Text style={styles.chatButtonSubtitle}>Get personalized advice</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Small Stats Grid - Calories and Last Workout */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('Nutrition')}
              >
                <View style={styles.statCardContent}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <Text style={styles.statValue}>{Math.round(calorieProgress)}%</Text>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Cal</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('WorkoutHistory')}
              >
                <View style={styles.statCardContent}>
                  <Text style={styles.statEmoji}>💪</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{lastWorkout}</Text>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Last</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Larger Plan Cards */}
            <View style={styles.planCardsContainer}>
              <TouchableOpacity
                style={styles.planCard}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('Nutrition')}
              >
                <View style={styles.planCardContent}>
                  <Ionicons
                    name={todayMealPlan ? "restaurant" : "restaurant-outline"}
                    size={28}
                    color={todayMealPlan ? Colors.primary : Colors.textMuted}
                  />
                  <View style={styles.planCardTextContainer}>
                    <Text style={styles.planCardTitle}>Meal Plan</Text>
                    <Text style={styles.planCardSubtitle}>
                      {todayMealPlan ? 'Planned for today' : 'No plan today'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.planCard}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('WorkoutHistory')}
              >
                <View style={styles.planCardContent}>
                  <Ionicons
                    name={todayWorkoutPlan ? "barbell" : "barbell-outline"}
                    size={28}
                    color={todayWorkoutPlan ? Colors.primary : Colors.textMuted}
                  />
                  <View style={styles.planCardTextContainer}>
                    <Text style={styles.planCardTitle}>Workout Plan</Text>
                    <Text style={styles.planCardSubtitle}>
                      {todayWorkoutPlan ? 'Planned for today' : 'No plan today'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Motivational Quote - Primary Color Theme */}
            <View style={styles.motivationCard}>
              <Ionicons name="sparkles" size={22} color={Colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.motivationText} numberOfLines={2}>"{todayQuote.text}"</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </ScreenLayout>

      <AIChatModal
        visible={chatVisible}
        onClose={() => {
          setChatVisible(false);
          setInitialMessage('');
        }}
        initialMessage={initialMessage}
      />

      {/* Coach Name Edit Modal */}
      <Modal
        visible={nameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelNameEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.nameModalContainer}>
            <View style={styles.nameModalHeader}>
              <Text style={styles.nameModalTitle}>Rename Your Coach</Text>
              <TouchableOpacity onPress={cancelNameEdit} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.nameModalSubtitle}>
              Give your AI coach a personal name
            </Text>

            <TextInput
              style={styles.nameInput}
              value={editingName}
              onChangeText={setEditingName}
              placeholder={defaultName}
              placeholderTextColor={Colors.textMuted}
              maxLength={20}
              autoFocus={true}
              selectTextOnFocus={true}
            />

            <View style={styles.nameModalButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setEditingName(defaultName)}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCoachName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },

  // Welcome Message - Simple text display
  welcomeMessage: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 3,
  },
  welcomeName: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  welcomeSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },

  // Stats Grid - Only 2 columns now
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statCardContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },

  // Plan Cards - Larger cards for meal and workout plans
  planCardsContainer: {
    gap: 12,
    marginBottom: Spacing.xl,
  },
  planCard: {
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  planCardTextContainer: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  planCardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Quick Actions - Compact 2x2 Grid - White with Green Border
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    width: 'calc(50% - 6px)',
    flex: 0.48,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    numberOfLines: 1,
  },

  // Motivation Card - Compact horizontal with primary color
  motivationCard: {
    marginBottom: Spacing.xl,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  motivationText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontStyle: 'italic',
    color: Colors.text,
    lineHeight: 22,
  },

  // Chat Button - Professional card design
  chatButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  chatButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  chatButtonTextContainer: {
    flex: 1,
  },
  chatButtonTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  chatButtonSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Edit Name Button
  editNameButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },

  // Name Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  nameModalContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
  },
  nameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nameModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  closeModalButton: {
    padding: Spacing.xs,
  },
  nameModalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.background,
  },
});
