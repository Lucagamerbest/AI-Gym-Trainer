import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import SimpleChart from '../components/SimpleChart';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'charts', 'goals', 'achievements'
  const [userStats, setUserStats] = useState(null);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Phase 2: Charts tab enhancements
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', '3m', '6m', '1y', 'all'
  const [exerciseFilter, setExerciseFilter] = useState('all'); // 'all', 'upper', 'lower', 'core'
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonExercise, setComparisonExercise] = useState(null);

  // Phase 3: Goals system
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'weight', // 'weight', 'reps', 'volume', 'frequency', 'streak'
    title: '',
    exerciseName: '',
    targetValue: '',
    deadline: ''
  });

  // Phase 4: Achievements system
  const [achievements, setAchievements] = useState([]);
  const [achievementFilter, setAchievementFilter] = useState('all'); // 'all', 'milestones', 'consistency', 'strength', 'special'

  // Phase 5: Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  useEffect(() => {
    loadProgressData();
  }, [user]);

  useEffect(() => {
    // Fade animation when switching tabs
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Update goal progress when switching to goals tab
    if (activeTab === 'goals') {
      updateGoalsProgress();
    }
    // Check achievements when switching to achievements tab
    if (activeTab === 'achievements') {
      checkAchievements();
    }
  }, [activeTab, workoutHistory]);

  // Pulse animation for streak badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const userId = user?.email || 'guest';

      // Load user stats
      const stats = await WorkoutStorageService.getUserStats(userId);
      setUserStats(stats);

      // Load exercise progress
      const progress = await WorkoutStorageService.getExerciseProgress(userId);
      setExerciseProgress(progress);

      // Load workout history for heatmap
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      setWorkoutHistory(history);

      // Load goals
      const userGoals = await WorkoutStorageService.getGoals(userId);
      setGoals(userGoals);

      // Load achievements
      const userAchievements = await WorkoutStorageService.getAchievements(userId);
      setAchievements(userAchievements);

      // Set default selected exercise to first one with data
      const exercisesWithData = Object.keys(progress);
      if (exercisesWithData.length > 0 && !selectedExercise) {
        selectExercise(exercisesWithData[0]);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalsProgress = async () => {
    const userId = user?.email || 'guest';
    await WorkoutStorageService.updateAllGoalProgress(userId);
    const updatedGoals = await WorkoutStorageService.getGoals(userId);
    setGoals(updatedGoals);
  };

  const checkAchievements = async () => {
    const userId = user?.email || 'guest';
    const result = await WorkoutStorageService.checkAndUnlockAchievements(userId);

    // Show celebration for newly unlocked achievements
    if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
      const firstUnlocked = result.newlyUnlocked[0];
      setCelebrationMessage(`${firstUnlocked.icon} ${firstUnlocked.title} Unlocked!`);
      setShowCelebration(true);

      // Celebration animation
      celebrationAnim.setValue(0);
      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCelebration(false));
    }

    const updatedAchievements = await WorkoutStorageService.getAchievements(userId);
    setAchievements(updatedAchievements);
  };

  const selectExercise = async (exerciseKey, range = timeRange) => {
    setSelectedExercise(exerciseKey);
    const exerciseData = exerciseProgress[exerciseKey];

    if (exerciseData && exerciseData.records.length > 0) {
      // Filter records by time range
      const filteredRecords = filterRecordsByTimeRange(exerciseData.records, range);

      const chartData = filteredRecords.map(record => {
        const date = new Date(record.date);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          weight: record.weight,
          volume: record.volume
        };
      });

      setChartData(chartData);
    } else {
      setChartData(null);
    }
  };

  const filterRecordsByTimeRange = (records, range) => {
    if (range === 'all') return records;

    const now = new Date();
    const cutoffDate = new Date();

    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return records;
    }

    return records.filter(r => new Date(r.date) >= cutoffDate);
  };

  const getFilteredExercises = () => {
    let filtered = Object.keys(exerciseProgress);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(key =>
        exerciseProgress[key].name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (exerciseFilter !== 'all') {
      // This is a simplified filter - you'd need to add muscle group data to exercises
      // For now, just return all
    }

    return filtered;
  };

  const getMuscleGroupVolume = () => {
    // Calculate volume by muscle group for last 30 days
    const muscleGroups = {
      'Chest': 0,
      'Back': 0,
      'Legs': 0,
      'Shoulders': 0,
      'Arms': 0,
      'Core': 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    workoutHistory.forEach(workout => {
      if (new Date(workout.date) >= thirtyDaysAgo) {
        (workout.exercises || []).forEach(exercise => {
          const muscleGroup = exercise.primaryMuscle || exercise.muscleGroup || 'Other';
          const volume = (exercise.sets || []).reduce((total, set) => {
            if (set.weight && set.reps) {
              return total + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return total;
          }, 0);

          if (muscleGroups[muscleGroup] !== undefined) {
            muscleGroups[muscleGroup] += volume;
          }
        });
      }
    });

    // Calculate max for percentage
    const maxVolume = Math.max(...Object.values(muscleGroups));

    return Object.entries(muscleGroups).map(([group, volume]) => ({
      group,
      volume,
      percentage: maxVolume > 0 ? (volume / maxVolume) * 100 : 0
    }));
  };

  const getPersonalRecords = (exerciseKey) => {
    const exercise = exerciseProgress[exerciseKey];
    if (!exercise || !exercise.records.length) return null;

    const records = exercise.records;
    const maxWeight = Math.max(...records.map(r => r.weight));
    const maxVolume = Math.max(...records.map(r => r.volume));
    const maxReps = Math.max(...records.map(r => r.reps));

    return { maxWeight, maxVolume, maxReps };
  };

  const getRecentPRs = () => {
    const allPRs = [];

    Object.entries(exerciseProgress).forEach(([key, exercise]) => {
      if (exercise.records && exercise.records.length > 0) {
        const records = exercise.records;
        const maxWeight = Math.max(...records.map(r => r.weight));
        const maxWeightRecord = records.find(r => r.weight === maxWeight);

        if (maxWeightRecord) {
          allPRs.push({
            exercise: exercise.name,
            weight: maxWeight,
            reps: maxWeightRecord.reps,
            date: maxWeightRecord.date
          });
        }
      }
    });

    // Sort by date (most recent first) and return top 3
    return allPRs
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  };

  const getMotivationalMessage = () => {
    const streak = userStats?.currentStreak || 0;
    const workouts = userStats?.totalWorkouts || 0;

    if (streak >= 30) return "You're unstoppable! 🔥";
    if (streak >= 14) return "Two weeks strong! Keep crushing it! 💪";
    if (streak >= 7) return "One week streak! You're on fire! 🔥";
    if (workouts >= 100) return "Century club member! 💯";
    if (workouts >= 50) return "Halfway to 100! Keep going! 🎯";
    if (workouts >= 10) return "Building momentum! 💪";
    return "Start your journey today! 🚀";
  };

  const getWeeklyHeatmapData = () => {
    const today = new Date();
    const fourWeeksAgo = new Date(today);
    fourWeeksAgo.setDate(today.getDate() - 27); // 4 weeks = 28 days

    const weeks = [[], [], [], []];

    for (let i = 0; i < 28; i++) {
      const date = new Date(fourWeeksAgo);
      date.setDate(fourWeeksAgo.getDate() + i);
      const weekIndex = Math.floor(i / 7);
      const dateKey = date.toISOString().split('T')[0];

      const hasWorkout = workoutHistory.some(w => {
        const workoutDate = new Date(w.date).toISOString().split('T')[0];
        return workoutDate === dateKey;
      });

      weeks[weekIndex].push({
        date: dateKey,
        hasWorkout,
        isToday: date.toDateString() === today.toDateString()
      });
    }

    return weeks;
  };

  const calculateVolumeChange = () => {
    if (!workoutHistory.length) return 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const last30Days = workoutHistory.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const previous30Days = workoutHistory.filter(w => {
      const date = new Date(w.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const calculateTotalVolume = (workouts) => {
      return workouts.reduce((total, workout) => {
        return total + (workout.exercises || []).reduce((exerciseTotal, exercise) => {
          return exerciseTotal + (exercise.sets || []).reduce((setTotal, set) => {
            if (set.weight && set.reps) {
              return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return setTotal;
          }, 0);
        }, 0);
      }, 0);
    };

    const currentVolume = calculateTotalVolume(last30Days);
    const previousVolume = calculateTotalVolume(previous30Days);

    if (previousVolume === 0) return 0;
    return Math.round(((currentVolume - previousVolume) / previousVolume) * 100);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1d ago';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  if (loading) {
    return (
      <ScreenLayout title="Progress & Goals" subtitle="Loading..." navigation={navigation}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </ScreenLayout>
    );
  }

  const exercisesWithData = Object.keys(exerciseProgress);
  const hasData = exercisesWithData.length > 0;

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabIcon, activeTab === 'overview' && styles.tabIconActive]}>📊</Text>
        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
        onPress={() => setActiveTab('charts')}
      >
        <Text style={[styles.tabIcon, activeTab === 'charts' && styles.tabIconActive]}>📈</Text>
        <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>Charts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'goals' && styles.tabActive]}
        onPress={() => setActiveTab('goals')}
      >
        <Text style={[styles.tabIcon, activeTab === 'goals' && styles.tabIconActive]}>🏆</Text>
        <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>Goals</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
        onPress={() => setActiveTab('achievements')}
      >
        <Text style={[styles.tabIcon, activeTab === 'achievements' && styles.tabIconActive]}>🎖️</Text>
        <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>Badges</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => {
    const recentPRs = getRecentPRs();
    const heatmapData = getWeeklyHeatmapData();
    const volumeChange = calculateVolumeChange();
    const lastWorkout = workoutHistory.length > 0
      ? workoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💪</Text>
            <Text style={styles.emptyStateTitle}>Start Your Journey!</Text>
            <Text style={styles.emptyStateText}>
              Complete your first workout to unlock progress tracking and goals
            </Text>
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={() => navigation.navigate('StartWorkout')}
            >
              <Text style={styles.startWorkoutButtonText}>Start Workout Now →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hero Section - Streak + Motivation */}
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.streakBadge}>
                <Animated.Text style={[styles.streakIcon, { transform: [{ scale: pulseAnim }] }]}>
                  🔥
                </Animated.Text>
                <Text style={styles.streakValue}>{userStats?.currentStreak || 0}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
              <View style={styles.streakProgress}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(((userStats?.currentStreak || 0) / 10) * 100, 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.max(0, 10 - (userStats?.currentStreak || 0))} days to 10-day milestone
                </Text>
              </View>
            </LinearGradient>

            {/* Primary Stat Card - Total Volume */}
            <View style={styles.primaryStatCard}>
              <Text style={styles.primaryStatLabel}>Total Volume Lifted</Text>
              <Text style={styles.primaryStatValue}>
                {Math.round(userStats?.totalVolume || 0).toLocaleString()} <Text style={styles.primaryStatUnit}>lbs</Text>
              </Text>
              {volumeChange !== 0 && (
                <View style={styles.changeIndicator}>
                  <Text style={[
                    styles.changeText,
                    { color: volumeChange > 0 ? Colors.success : Colors.error }
                  ]}>
                    {volumeChange > 0 ? '↑' : '↓'} {Math.abs(volumeChange)}% vs last month
                  </Text>
                </View>
              )}
            </View>

            {/* Secondary Stats Grid */}
            <View style={styles.secondaryStatsGrid}>
              <View style={styles.secondaryStatCard}>
                <Text style={styles.secondaryStatIcon}>🏋️</Text>
                <Text style={styles.secondaryStatValue}>{userStats?.totalWorkouts || 0}</Text>
                <Text style={styles.secondaryStatLabel}>Total Workouts</Text>
                <Text style={styles.secondaryStatSubtext}>
                  {workoutHistory.filter(w => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(w.date) >= weekAgo;
                  }).length} this week
                </Text>
              </View>

              <View style={styles.secondaryStatCard}>
                <Text style={styles.secondaryStatIcon}>📅</Text>
                <Text style={styles.secondaryStatValue}>
                  {lastWorkout ? formatTimeAgo(lastWorkout.date) : 'N/A'}
                </Text>
                <Text style={styles.secondaryStatLabel}>Last Workout</Text>
                <Text style={styles.secondaryStatSubtext} numberOfLines={1}>
                  {lastWorkout?.workoutTitle || 'Quick Workout'}
                </Text>
              </View>

              <View style={styles.secondaryStatCard}>
                <Text style={styles.secondaryStatIcon}>🎯</Text>
                <Text style={styles.secondaryStatValue}>
                  {workoutHistory.length > 0 ? '89%' : '0%'}
                </Text>
                <Text style={styles.secondaryStatLabel}>Goal Progress</Text>
                <Text style={styles.secondaryStatSubtext}>Coming soon</Text>
              </View>

              <View style={styles.secondaryStatCard}>
                <Text style={styles.secondaryStatIcon}>🔥</Text>
                <Text style={styles.secondaryStatValue}>
                  {userStats?.currentStreak > 5 ? userStats.currentStreak : '0'}
                </Text>
                <Text style={styles.secondaryStatLabel}>Best Streak</Text>
                <Text style={styles.secondaryStatSubtext}>
                  {userStats?.currentStreak > 5 ? 'Active now!' : 'Start today'}
                </Text>
              </View>
            </View>

            {/* Recent Personal Records */}
            {recentPRs.length > 0 && (
              <View style={styles.prSection}>
                <Text style={styles.sectionTitle}>🎉 Recent Personal Records</Text>
                {recentPRs.map((pr, index) => (
                  <LinearGradient
                    key={index}
                    colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.prCard}
                  >
                    <View style={styles.prBadge}>
                      <Text style={styles.prBadgeIcon}>🏆</Text>
                    </View>
                    <View style={styles.prInfo}>
                      <Text style={styles.prExercise}>{pr.exercise}</Text>
                      <Text style={styles.prDetails}>
                        {pr.weight} lbs × {pr.reps} reps
                      </Text>
                    </View>
                    <Text style={styles.prDate}>{formatTimeAgo(pr.date)}</Text>
                  </LinearGradient>
                ))}
              </View>
            )}

            {/* Weekly Activity Heatmap */}
            <View style={styles.heatmapSection}>
              <Text style={styles.sectionTitle}>This Month's Activity</Text>
              <View style={styles.heatmapContainer}>
                <View style={styles.heatmapDayLabels}>
                  <Text style={styles.heatmapDayLabel}>M</Text>
                  <Text style={styles.heatmapDayLabel}>T</Text>
                  <Text style={styles.heatmapDayLabel}>W</Text>
                  <Text style={styles.heatmapDayLabel}>T</Text>
                  <Text style={styles.heatmapDayLabel}>F</Text>
                  <Text style={styles.heatmapDayLabel}>S</Text>
                  <Text style={styles.heatmapDayLabel}>S</Text>
                </View>
                {heatmapData.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.heatmapWeek}>
                    <Text style={styles.heatmapWeekLabel}>Week {weekIndex + 1}</Text>
                    <View style={styles.heatmapDays}>
                      {week.map((day, dayIndex) => (
                        <View
                          key={dayIndex}
                          style={[
                            styles.heatmapDay,
                            day.hasWorkout && styles.heatmapDayActive,
                            day.isToday && styles.heatmapDayToday
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ))}
                <View style={styles.heatmapLegend}>
                  <View style={styles.heatmapLegendItem}>
                    <View style={[styles.heatmapLegendDot, styles.heatmapDayActive]} />
                    <Text style={styles.heatmapLegendText}>Workout</Text>
                  </View>
                  <View style={styles.heatmapLegendItem}>
                    <View style={[styles.heatmapLegendDot, styles.heatmapDayToday]} />
                    <Text style={styles.heatmapLegendText}>Today</Text>
                  </View>
                  <View style={styles.heatmapLegendItem}>
                    <View style={[styles.heatmapLegendDot, { backgroundColor: Colors.border }]} />
                    <Text style={styles.heatmapLegendText}>Missed</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const renderChartsTab = () => {
    const filteredExercises = getFilteredExercises();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📈</Text>
            <Text style={styles.emptyStateTitle}>No Chart Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Complete workouts to see your progress visualized!
            </Text>
          </View>
        ) : (
          <>
            {/* Time Range Selector */}
            <View style={styles.timeRangeCard}>
              <Text style={styles.cardTitle}>Time Range</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeRangeButtons}
              >
                {[
                  { label: '7D', value: '7d' },
                  { label: '30D', value: '30d' },
                  { label: '3M', value: '3m' },
                  { label: '6M', value: '6m' },
                  { label: '1Y', value: '1y' },
                  { label: 'ALL', value: 'all' }
                ].map((range) => (
                  <TouchableOpacity
                    key={range.value}
                    style={[
                      styles.timeRangeButton,
                      timeRange === range.value && styles.timeRangeButtonActive
                    ]}
                    onPress={() => {
                      setTimeRange(range.value);
                      if (selectedExercise) {
                        selectExercise(selectedExercise, range.value);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.timeRangeButtonText,
                        timeRange === range.value && styles.timeRangeButtonTextActive
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Exercise Selection */}
            <View style={styles.exerciseSelectionCard}>
              <Text style={styles.cardTitle}>Select Exercise</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.exerciseScrollView}
              >
                {filteredExercises.map((exerciseKey) => {
                  const exercise = exerciseProgress[exerciseKey];
                  const isSelected = selectedExercise === exerciseKey;

                  return (
                    <TouchableOpacity
                      key={exerciseKey}
                      style={[styles.exerciseTab, isSelected && styles.exerciseTabSelected]}
                      onPress={() => selectExercise(exerciseKey)}
                    >
                      <Text style={[styles.exerciseTabText, isSelected && styles.exerciseTabTextSelected]}>
                        {exercise.name}
                      </Text>
                      <Text style={[
                        styles.exerciseTabCount,
                        isSelected && styles.exerciseTabCountSelected
                      ]}>
                        {filterRecordsByTimeRange(exercise.records, timeRange).length} sessions
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Progress Chart */}
            {selectedExercise && chartData && chartData.length > 0 ? (
              <SimpleChart
                data={chartData}
                title={`${exerciseProgress[selectedExercise]?.name} Progress`}
              />
            ) : selectedExercise ? (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>
                  No data available for this time range
                </Text>
              </View>
            ) : null}

            {/* Personal Records for Selected Exercise */}
            {selectedExercise && (
              <View style={styles.recordsCard}>
                <Text style={styles.cardTitle}>Personal Records</Text>
                {(() => {
                  const records = getPersonalRecords(selectedExercise);
                  if (!records) return <Text style={styles.noDataText}>No records yet</Text>;

                  return (
                    <View style={styles.recordsGrid}>
                      <View style={styles.recordItem}>
                        <Text style={styles.recordValue}>{records.maxWeight} lbs</Text>
                        <Text style={styles.recordLabel}>Max Weight</Text>
                      </View>
                      <View style={styles.recordItem}>
                        <Text style={styles.recordValue}>{records.maxReps}</Text>
                        <Text style={styles.recordLabel}>Max Reps</Text>
                      </View>
                      <View style={styles.recordItem}>
                        <Text style={styles.recordValue}>{Math.round(records.maxVolume)}</Text>
                        <Text style={styles.recordLabel}>Max Volume</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Muscle Group Volume Heatmap */}
            <View style={styles.muscleGroupCard}>
              <Text style={styles.cardTitle}>Muscle Group Volume (Last 30 Days)</Text>
              <View style={styles.muscleGroupBars}>
                {getMuscleGroupVolume().map((group, index) => (
                  <View key={index} style={styles.muscleGroupRow}>
                    <Text style={styles.muscleGroupLabel}>{group.group}</Text>
                    <View style={styles.muscleGroupBarContainer}>
                      <LinearGradient
                        colors={[Colors.primary, Colors.primary + '80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.muscleGroupBar,
                          { width: `${group.percentage}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.muscleGroupValue}>
                      {Math.round(group.volume / 1000)}k
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const handleCreateGoal = async () => {
    const userId = user?.email || 'guest';

    if (!newGoal.title || !newGoal.targetValue) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const result = await WorkoutStorageService.saveGoal(newGoal, userId);
    if (result.success) {
      setShowGoalModal(false);
      setNewGoal({
        type: 'weight',
        title: '',
        exerciseName: '',
        targetValue: '',
        deadline: ''
      });
      await updateGoalsProgress();
      Alert.alert('Success', 'Goal created successfully!');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const userId = user?.email || 'guest';
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await WorkoutStorageService.deleteGoal(goalId, userId);
            await updateGoalsProgress();
          }
        }
      ]
    );
  };

  const getGoalTypeLabel = (type) => {
    const labels = {
      weight: '🏋️ Weight Goal',
      reps: '🔄 Rep Goal',
      volume: '📊 Volume Goal',
      frequency: '📅 Frequency Goal',
      streak: '🔥 Streak Goal'
    };
    return labels[type] || type;
  };

  const getGoalUnit = (type) => {
    const units = {
      weight: 'lbs',
      reps: 'reps',
      volume: 'lbs total',
      frequency: 'workouts/week',
      streak: 'days'
    };
    return units[type] || '';
  };

  const renderGoalsTab = () => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Create Goal Button */}
        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => setShowGoalModal(true)}
        >
          <Text style={styles.createGoalButtonText}>+ Create New Goal</Text>
        </TouchableOpacity>

        {/* Active Goals */}
        {activeGoals.length > 0 ? (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.map((goal) => {
              const progress = goal.currentProgress || 0;
              const target = goal.targetValue || 1;
              const percentage = Math.min((progress / target) * 100, 100);

              return (
                <LinearGradient
                  key={goal.id}
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.goalCard}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleRow}>
                      <Text style={styles.goalTypeLabel}>{getGoalTypeLabel(goal.type)}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteGoal(goal.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.deleteGoalButton}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    {goal.exerciseName && (
                      <Text style={styles.goalExercise}>{goal.exerciseName}</Text>
                    )}
                  </View>

                  <View style={styles.goalProgressSection}>
                    <View style={styles.goalProgressStats}>
                      <Text style={styles.goalProgressCurrent}>
                        {Math.round(progress)} {getGoalUnit(goal.type)}
                      </Text>
                      <Text style={styles.goalProgressTarget}>
                        / {target} {getGoalUnit(goal.type)}
                      </Text>
                    </View>
                    <Text style={styles.goalProgressPercentage}>{Math.round(percentage)}%</Text>
                  </View>

                  <View style={styles.goalProgressBar}>
                    <LinearGradient
                      colors={[Colors.primary, Colors.primary + '80']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.goalProgressBarFill, { width: `${percentage}%` }]}
                    />
                  </View>

                  {goal.deadline && (
                    <Text style={styles.goalDeadline}>
                      Target: {new Date(goal.deadline).toLocaleDateString()}
                    </Text>
                  )}
                </LinearGradient>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyGoalsState}>
            <Text style={styles.emptyGoalsIcon}>🎯</Text>
            <Text style={styles.emptyGoalsTitle}>No Active Goals</Text>
            <Text style={styles.emptyGoalsText}>
              Create your first goal to stay motivated and track your progress!
            </Text>
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>🎉 Completed Goals</Text>
            {completedGoals.map((goal) => (
              <View key={goal.id} style={styles.completedGoalCard}>
                <Text style={styles.completedGoalTitle}>{goal.title}</Text>
                <Text style={styles.completedGoalDate}>
                  Completed {new Date(goal.completedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Goal Creation Modal */}
        <Modal
          visible={showGoalModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGoalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Goal</Text>
                <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Goal Type Selection */}
                <Text style={styles.inputLabel}>Goal Type</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.goalTypeScroll}
                >
                  {[
                    { type: 'weight', icon: '🏋️', label: 'Weight' },
                    { type: 'reps', icon: '🔄', label: 'Reps' },
                    { type: 'volume', icon: '📊', label: 'Volume' },
                    { type: 'frequency', icon: '📅', label: 'Frequency' },
                    { type: 'streak', icon: '🔥', label: 'Streak' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.goalTypeButton,
                        newGoal.type === item.type && styles.goalTypeButtonActive
                      ]}
                      onPress={() => setNewGoal({ ...newGoal, type: item.type })}
                    >
                      <Text style={styles.goalTypeIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.goalTypeText,
                        newGoal.type === item.type && styles.goalTypeTextActive
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Goal Title */}
                <Text style={styles.inputLabel}>Goal Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Bench Press 225 lbs"
                  placeholderTextColor={Colors.textMuted}
                  value={newGoal.title}
                  onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
                />

                {/* Exercise Name (for weight/reps goals) */}
                {(newGoal.type === 'weight' || newGoal.type === 'reps') && (
                  <>
                    <Text style={styles.inputLabel}>Exercise Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Bench Press"
                      placeholderTextColor={Colors.textMuted}
                      value={newGoal.exerciseName}
                      onChangeText={(text) => setNewGoal({ ...newGoal, exerciseName: text })}
                    />
                  </>
                )}

                {/* Target Value */}
                <Text style={styles.inputLabel}>Target Value *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Enter target (${getGoalUnit(newGoal.type)})`}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={newGoal.targetValue}
                  onChangeText={(text) => setNewGoal({ ...newGoal, targetValue: text })}
                />

                {/* Deadline (optional) */}
                <Text style={styles.inputLabel}>Target Date (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                  value={newGoal.deadline}
                  onChangeText={(text) => setNewGoal({ ...newGoal, deadline: text })}
                />

                {/* Create Button */}
                <TouchableOpacity
                  style={styles.createGoalModalButton}
                  onPress={handleCreateGoal}
                >
                  <Text style={styles.createGoalModalButtonText}>Create Goal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  const getAchievementProgress = (achievement) => {
    if (achievement.unlocked) return 100;

    switch (achievement.type) {
      case 'workouts':
        return Math.min((userStats?.totalWorkouts || 0) / achievement.requirement * 100, 100);
      case 'streak':
        return Math.min((userStats?.currentStreak || 0) / achievement.requirement * 100, 100);
      case 'volume':
        return Math.min((userStats?.totalVolume || 0) / achievement.requirement * 100, 100);
      default:
        return 0;
    }
  };

  const getProgressText = (achievement) => {
    if (achievement.unlocked) return 'Unlocked!';

    switch (achievement.type) {
      case 'workouts':
        return `${userStats?.totalWorkouts || 0} / ${achievement.requirement}`;
      case 'streak':
        return `${userStats?.currentStreak || 0} / ${achievement.requirement}`;
      case 'volume':
        return `${Math.round(userStats?.totalVolume || 0).toLocaleString()} / ${achievement.requirement.toLocaleString()} lbs`;
      default:
        return 'Locked';
    }
  };

  const renderAchievementsTab = () => {
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    const lockedAchievements = achievements.filter(a => !a.unlocked);

    const filteredAchievements = achievementFilter === 'all'
      ? achievements
      : achievements.filter(a => a.category === achievementFilter);

    const unlockedFiltered = filteredAchievements.filter(a => a.unlocked);
    const lockedFiltered = filteredAchievements.filter(a => !a.unlocked);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Summary */}
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.achievementSummary}
        >
          <Text style={styles.achievementSummaryTitle}>Your Progress</Text>
          <View style={styles.achievementSummaryStats}>
            <View style={styles.achievementSummaryStat}>
              <Text style={styles.achievementSummaryValue}>{unlockedAchievements.length}</Text>
              <Text style={styles.achievementSummaryLabel}>Unlocked</Text>
            </View>
            <View style={styles.achievementSummaryDivider} />
            <View style={styles.achievementSummaryStat}>
              <Text style={styles.achievementSummaryValue}>{achievements.length}</Text>
              <Text style={styles.achievementSummaryLabel}>Total</Text>
            </View>
            <View style={styles.achievementSummaryDivider} />
            <View style={styles.achievementSummaryStat}>
              <Text style={styles.achievementSummaryValue}>
                {Math.round((unlockedAchievements.length / achievements.length) * 100)}%
              </Text>
              <Text style={styles.achievementSummaryLabel}>Complete</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.achievementFilterScroll}
          contentContainerStyle={styles.achievementFilterContainer}
        >
          {[
            { value: 'all', label: 'All', icon: '🏆' },
            { value: 'milestones', label: 'Milestones', icon: '🎯' },
            { value: 'consistency', label: 'Consistency', icon: '🔥' },
            { value: 'strength', label: 'Strength', icon: '💪' },
            { value: 'special', label: 'Special', icon: '⭐' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.achievementFilterButton,
                achievementFilter === filter.value && styles.achievementFilterButtonActive
              ]}
              onPress={() => setAchievementFilter(filter.value)}
            >
              <Text style={styles.achievementFilterIcon}>{filter.icon}</Text>
              <Text style={[
                styles.achievementFilterText,
                achievementFilter === filter.value && styles.achievementFilterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Unlocked Achievements */}
        {unlockedFiltered.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Unlocked ({unlockedFiltered.length})</Text>
            <View style={styles.achievementsGrid}>
              {unlockedFiltered.map((achievement) => (
                <LinearGradient
                  key={achievement.id}
                  colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.achievementCard}
                >
                  <Text style={styles.achievementCardIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementCardTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementCardDescription}>{achievement.description}</Text>
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>✓ UNLOCKED</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {/* Locked Achievements */}
        {lockedFiltered.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Locked ({lockedFiltered.length})</Text>
            <View style={styles.achievementsGrid}>
              {lockedFiltered.map((achievement) => {
                const progress = getAchievementProgress(achievement);
                const progressText = getProgressText(achievement);

                return (
                  <View key={achievement.id} style={[styles.achievementCard, styles.achievementCardLocked]}>
                    <Text style={[styles.achievementCardIcon, styles.achievementCardIconLocked]}>
                      {achievement.icon}
                    </Text>
                    <Text style={[styles.achievementCardTitle, styles.achievementCardTitleLocked]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementCardDescription, styles.achievementCardDescriptionLocked]}>
                      {achievement.description}
                    </Text>
                    {progress > 0 && (
                      <>
                        <View style={styles.achievementProgressBar}>
                          <LinearGradient
                            colors={[Colors.primary, Colors.primary + '80']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.achievementProgressBarFill, { width: `${progress}%` }]}
                          />
                        </View>
                        <Text style={styles.achievementProgressText}>{progressText}</Text>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <ScreenLayout
      title="Progress & Goals"
      subtitle="Track your achievements"
      navigation={navigation}
      scrollable={true}
    >
      <View style={styles.container}>
        {renderTabBar()}
        <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'charts' && renderChartsTab()}
          {activeTab === 'goals' && renderGoalsTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
        </Animated.View>

        {/* Celebration Toast */}
        {showCelebration && (
          <Animated.View
            style={[
              styles.celebrationToast,
              {
                opacity: celebrationAnim,
                transform: [
                  {
                    translateY: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                  {
                    scale: celebrationAnim,
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primary + 'DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationToastGradient}
            >
              <Text style={styles.celebrationToastText}>{celebrationMessage}</Text>
            </LinearGradient>
          </Animated.View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  tabContent: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  startWorkoutButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  startWorkoutButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },

  // Hero Section
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  streakBadge: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakIcon: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  streakValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  streakLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  motivationalText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  streakProgress: {
    width: '100%',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Primary Stat Card
  primaryStatCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  primaryStatLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  primaryStatValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  primaryStatUnit: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },

  // Secondary Stats Grid
  secondaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  secondaryStatCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryStatIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  secondaryStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  secondaryStatSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Recent PRs Section
  prSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  prBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  prBadgeIcon: {
    fontSize: 24,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  prDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  prDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Weekly Heatmap
  heatmapSection: {
    marginBottom: Spacing.xl,
  },
  heatmapContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heatmapDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
    paddingLeft: 50,
  },
  heatmapDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    width: 28,
    textAlign: 'center',
  },
  heatmapWeek: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  heatmapWeekLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    width: 45,
  },
  heatmapDays: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'space-around',
  },
  heatmapDay: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  heatmapDayActive: {
    backgroundColor: Colors.primary,
  },
  heatmapDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  heatmapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heatmapLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  heatmapLegendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Charts Tab (existing styles)
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  timeRangeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeRangeButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeRangeButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  timeRangeButtonTextActive: {
    color: Colors.background,
  },
  exerciseSelectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  exerciseScrollView: {
    marginHorizontal: -Spacing.sm,
  },
  exerciseTab: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    minWidth: 120,
    alignItems: 'center',
  },
  exerciseTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  exerciseTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  exerciseTabTextSelected: {
    color: Colors.background,
  },
  exerciseTabCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  exerciseTabCountSelected: {
    color: Colors.background + 'CC',
  },
  recordsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  recordsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recordItem: {
    alignItems: 'center',
  },
  recordValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  recordLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  noDataText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noDataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  // Muscle Group Volume Styles
  muscleGroupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  muscleGroupBars: {
    gap: Spacing.md,
  },
  muscleGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleGroupLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    width: 80,
  },
  muscleGroupBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  muscleGroupBar: {
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  muscleGroupValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    width: 40,
    textAlign: 'right',
  },

  // Goals Tab Styles
  createGoalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  createGoalButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  goalsSection: {
    marginBottom: Spacing.xl,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  goalHeader: {
    marginBottom: Spacing.md,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  goalTypeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteGoalButton: {
    fontSize: 32,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  goalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  goalExercise: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  goalProgressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalProgressStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  goalProgressCurrent: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalProgressTarget: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  goalProgressPercentage: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  goalProgressBarFill: {
    height: '100%',
  },
  goalDeadline: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyGoalsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyGoalsIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyGoalsTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyGoalsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completedGoalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  completedGoalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  completedGoalDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  // Goal Creation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 40,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  goalTypeScroll: {
    marginBottom: Spacing.md,
  },
  goalTypeButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  goalTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  goalTypeIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  goalTypeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  goalTypeTextActive: {
    color: Colors.background,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  createGoalModalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  createGoalModalButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },

  // Achievements Tab Styles
  achievementSummary: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  achievementSummaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  achievementSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  achievementSummaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  achievementSummaryValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  achievementSummaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  achievementSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  achievementFilterScroll: {
    marginBottom: Spacing.lg,
  },
  achievementFilterContainer: {
    paddingHorizontal: Spacing.xs,
  },
  achievementFilterButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  achievementFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  achievementFilterIcon: {
    fontSize: 18,
  },
  achievementFilterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  achievementFilterTextActive: {
    color: Colors.background,
  },
  achievementsSection: {
    marginBottom: Spacing.xl,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
  },
  achievementCardLocked: {
    borderColor: Colors.border,
    opacity: 0.7,
  },
  achievementCardIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  achievementCardIconLocked: {
    opacity: 0.5,
  },
  achievementCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  achievementCardTitleLocked: {
    color: Colors.textSecondary,
  },
  achievementCardDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  achievementCardDescriptionLocked: {
    color: Colors.textMuted,
  },
  achievementBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  achievementBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    color: Colors.background,
  },
  achievementProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  achievementProgressBarFill: {
    height: '100%',
  },
  achievementProgressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Celebration Toast
  celebrationToast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  celebrationToastGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  celebrationToastText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.background,
    textAlign: 'center',
  },

  // Coming Soon Styles
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  comingSoonIcon: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureItem: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
});
