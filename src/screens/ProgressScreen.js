import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, Animated, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import ScreenLayout from '../components/ScreenLayout';
import SimpleChart from '../components/SimpleChart';
import AchievementDetailModal from '../components/AchievementDetailModal';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import { WorkoutStorageService } from '../services/workoutStorage';
import WorkoutSyncService from '../services/backend/WorkoutSyncService';
import { useAuth } from '../context/AuthContext';
import { getExercisesByMuscleGroup } from '../data/exerciseDatabase';
import { useAITracking } from '../components/AIScreenTracker';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const Colors = useColors();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'charts', 'goals', 'achievements'
  const [userStats, setUserStats] = useState(null);

  // Track this screen for AI context
  useAITracking('ProgressScreen', {
    totalWorkouts: userStats?.totalWorkouts || 0,
    totalVolume: userStats?.totalVolume || 0,
    activeGoals: goals?.length || 0,
  });
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Phase 2: Charts tab enhancements
  const [timeRange, setTimeRange] = useState('all'); // '7d', '30d', '3m', '6m', '1y', 'all'
  const [chartType, setChartType] = useState('max'); // 'volume', 'max', '1rm', 'reps'
  const [exerciseFilter, setExerciseFilter] = useState('all'); // 'all', 'upper', 'lower', 'core'
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonExercise, setComparisonExercise] = useState(null);
  const [activeMuscleFilters, setActiveMuscleFilters] = useState(['chest', 'back', 'legs', 'biceps', 'triceps', 'shoulders', 'abs', 'forearms', 'cardio']);
  const [showMuscleFilters, setShowMuscleFilters] = useState(false);

  // Phase 3: Goals system
  const [goals, setGoals] = useState([]);

  // Phase 4: Achievements system
  const [achievements, setAchievements] = useState([]);
  const [achievementFilter, setAchievementFilter] = useState('all'); // 'all', 'milestones', 'consistency', 'strength', 'special'
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [achievementBreakdown, setAchievementBreakdown] = useState(null);

  // Phase 5: Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Interactive modals for Overview tab
  const [showWorkoutListModal, setShowWorkoutListModal] = useState(false);
  const [showStreakCalendarModal, setShowStreakCalendarModal] = useState(false);
  const [showPRDetailModal, setShowPRDetailModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showWorkoutDetailModal, setShowWorkoutDetailModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Prevent multiple rapid clicks
  const isOpeningModalRef = useRef(false);

  useEffect(() => {
    loadProgressData();
  }, [user]);

  // Reload data when screen comes into focus (e.g., after deleting a workout)
  useFocusEffect(
    React.useCallback(() => {
      const syncAndLoad = async () => {
        // Sync with Firebase first if user is logged in
        if (user?.uid) {
          try {
            await WorkoutSyncService.downloadCloudWorkouts(user.uid);
          } catch (error) {
            console.log('Background sync failed:', error.message);
          }
        }
        // Then load local data (now updated with any deletions)
        loadProgressData();
      };
      syncAndLoad();
    }, [user])
  );

  // Reset the modal opening ref when modal closes
  useEffect(() => {
    if (!showWorkoutDetailModal) {
      isOpeningModalRef.current = false;
    }
  }, [showWorkoutDetailModal]);

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
      const userId = user?.uid || 'guest';

      // Run migration to add workoutIds to existing exercise progress records
      await WorkoutStorageService.migrateExerciseProgressWithWorkoutIds(userId);

      // Load user stats
      const stats = await WorkoutStorageService.getUserStats(userId);
      setUserStats(stats);

      // Load exercise progress
      const progress = await WorkoutStorageService.getExerciseProgress(userId);
      setExerciseProgress(progress);

      // Load workout history for heatmap
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      setWorkoutHistory(history);

      // Check for orphaned progress records
      const allWorkoutIds = new Set(history.map(w => w.id));
      Object.entries(progress).forEach(([exerciseKey, exercise]) => {
        if (!exercise || !exercise.records || !Array.isArray(exercise.records)) return;
        const orphanedRecords = exercise.records.filter(r => r && r.workoutId && !allWorkoutIds.has(r.workoutId));
      });

      // Load goals
      const userGoals = await WorkoutStorageService.getGoals(userId);
      setGoals(userGoals);

      // Load achievements
      const userAchievements = await WorkoutStorageService.getAchievements(userId);
      setAchievements(userAchievements);

      // Set default selected exercise to most recently logged exercise
      const exercisesWithData = Object.keys(progress);
      if (exercisesWithData.length > 0 && !selectedExercise) {
        // Find the exercise with the most recent record
        let mostRecentExercise = null;
        let mostRecentDate = null;

        exercisesWithData.forEach(exerciseKey => {
          const exercise = progress[exerciseKey];
          if (exercise.records && exercise.records.length > 0) {
            // Get the most recent record for this exercise
            const latestRecord = exercise.records.reduce((latest, record) => {
              const recordDate = new Date(record.date);
              const latestDate = new Date(latest.date);
              return recordDate > latestDate ? record : latest;
            });

            const latestDate = new Date(latestRecord.date);

            if (!mostRecentDate || latestDate > mostRecentDate) {
              mostRecentDate = latestDate;
              mostRecentExercise = exerciseKey;
            }
          }
        });

        // Select the most recently logged exercise, or first one if no recent date found
        if (mostRecentExercise) {
          selectExercise(mostRecentExercise, timeRange, chartType, progress);
        } else if (exercisesWithData.length > 0) {
          selectExercise(exercisesWithData[0], timeRange, chartType, progress);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Send push notification for goal completion
  const sendGoalCompletionNotification = async (goal) => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('goals', {
          name: 'Goals',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#9333EA',
          sound: 'notification.mp3',
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Goal Completed!',
          body: `You crushed it! "${goal.title}" is done!`,
          data: { type: 'goal_complete', goalId: goal.id },
          sound: 'notification.mp3',
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Could not send goal notification:', error);
    }
  };

  const updateGoalsProgress = async () => {
    const userId = user?.uid || 'guest';

    // Get current goals before update to detect completions
    const previousGoals = [...goals];
    const previousActiveIds = previousGoals.filter(g => g.status === 'active').map(g => g.id);

    await WorkoutStorageService.updateAllGoalProgress(userId);
    const updatedGoals = await WorkoutStorageService.getGoals(userId);

    // Check for newly completed goals
    const newlyCompleted = updatedGoals.filter(
      g => g.status === 'completed' && previousActiveIds.includes(g.id)
    );

    // Send notifications and show celebration for each newly completed goal
    for (const goal of newlyCompleted) {
      await sendGoalCompletionNotification(goal);

      // Show in-app celebration
      setCelebrationMessage(`🎯 ${goal.title} Complete!`);
      setShowCelebration(true);
      celebrationAnim.setValue(0);
      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCelebration(false));
    }

    setGoals(updatedGoals);
  };

  // Send push notification for achievement
  const sendAchievementNotification = async (achievement) => {
    try {
      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#9333EA',
          sound: 'notification.mp3',
        });
      }

      // Schedule immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${achievement.icon} Achievement Unlocked!`,
          body: `${achievement.title} - ${achievement.description}`,
          data: { type: 'achievement', achievementId: achievement.id },
          sound: 'notification.mp3',
        },
        trigger: null, // null means send immediately
      });
    } catch (error) {
      console.log('Could not send achievement notification:', error);
    }
  };

  const checkAchievements = async () => {
    const userId = user?.uid || 'guest';
    const result = await WorkoutStorageService.checkAndUnlockAchievements(userId);

    // Show celebration for newly unlocked achievements
    if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
      const firstUnlocked = result.newlyUnlocked[0];
      setCelebrationMessage(`${firstUnlocked.icon} ${firstUnlocked.title} Unlocked!`);
      setShowCelebration(true);

      // Send push notification for each unlocked achievement
      for (const achievement of result.newlyUnlocked) {
        await sendAchievementNotification(achievement);
      }

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

  const getAchievementBreakdown = async (achievement) => {
    const userId = user?.uid || 'guest';
    const history = await WorkoutStorageService.getWorkoutHistory(userId);
    const stats = await WorkoutStorageService.getUserStats(userId);

    switch (achievement.type) {
      case 'workouts':
        // Show all workouts (or progress towards goal)
        const totalWorkouts = stats.totalWorkouts || 0;
        const workoutList = achievement.unlocked
          ? history.slice(0, achievement.requirement)
          : history.slice(0, Math.min(totalWorkouts, achievement.requirement));

        return {
          type: 'workouts',
          total: totalWorkouts,
          requirement: achievement.requirement,
          unlocked: achievement.unlocked,
          workouts: workoutList.filter(w => w && w.date).map(w => ({
            id: w.id,
            title: w.workoutTitle,
            date: new Date(w.date).toLocaleDateString(),
            exercises: (w.exercises || []).length,
            duration: w.duration
          }))
        };

      case 'volume':
        // Show exercise breakdown by volume contribution
        const exerciseVolumes = {};
        history.forEach(workout => {
          (workout.exercises || []).forEach(exercise => {
            const volume = (exercise.sets || []).reduce((sum, set) => {
              return sum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0));
            }, 0);

            if (!exerciseVolumes[exercise.name]) {
              exerciseVolumes[exercise.name] = { name: exercise.name, volume: 0, workouts: 0 };
            }
            exerciseVolumes[exercise.name].volume += volume;
            exerciseVolumes[exercise.name].workouts += 1;
          });
        });

        const sortedExercises = Object.values(exerciseVolumes)
          .sort((a, b) => b.volume - a.volume);

        return {
          type: 'volume',
          total: stats.totalVolume || 0,
          requirement: achievement.requirement,
          unlocked: achievement.unlocked,
          exercises: sortedExercises
        };

      case 'streak':
        // Show recent workout dates for streak
        const last30 = history.filter(w => w && w.date).slice(-30).reverse();
        return {
          type: 'streak',
          currentStreak: stats.currentStreak || 0,
          requirement: achievement.requirement,
          unlocked: achievement.unlocked,
          recentWorkouts: last30.map(w => ({
            date: new Date(w.date).toLocaleDateString(),
            title: w.workoutTitle
          }))
        };

      default:
        return { type: 'general', message: 'Achievement unlocked!' };
    }
  };

  const handleAchievementPress = async (achievement) => {
    setSelectedAchievement(achievement);
    const breakdown = await getAchievementBreakdown(achievement);
    setAchievementBreakdown(breakdown);
    setShowAchievementDetailModal(true);
  };

  const selectExercise = async (exerciseKey, range = timeRange, type = chartType, progressData = null) => {
    setSelectedExercise(exerciseKey);
    // Use provided progressData if available (for initial load), otherwise use state
    const progress = progressData || exerciseProgress;
    const exerciseData = progress[exerciseKey];

    if (exerciseData && exerciseData.records && exerciseData.records.length > 0) {
      // Filter records by time range
      const filteredRecords = filterRecordsByTimeRange(exerciseData.records, range);

      // Group records by workoutId to show one data point per workout
      const workoutGroups = {};
      filteredRecords.forEach(record => {
        const workoutId = record.workoutId || 'unknown';
        if (!workoutGroups[workoutId]) {
          workoutGroups[workoutId] = [];
        }
        workoutGroups[workoutId].push(record);
      });

      // Create one chart data point per workout
      const chartData = Object.entries(workoutGroups).map(([workoutId, records]) => {
        // Use the date from the first record in the workout
        const date = new Date(records[0].date);
        let value;

        switch (type) {
          case 'volume':
            // Sum all set volumes for this workout
            value = records.reduce((sum, r) => sum + (r.volume || 0), 0);
            break;
          case 'max':
            // Take the max weight across all sets in this workout
            value = Math.max(...records.map(r => r.weight || 0));
            break;
          case '1rm':
            // Calculate 1RM for each set, then take the max
            const oneRMs = records.map(r => Math.round((r.weight || 0) * (36 / (37 - (r.reps || 0)))));
            value = Math.max(...oneRMs);
            break;
          case 'reps':
            // Take the max reps across all sets in this workout
            value = Math.max(...records.map(r => r.reps || 0));
            break;
          default:
            value = records.reduce((sum, r) => sum + (r.volume || 0), 0);
        }

        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          weight: value,
          workoutId: workoutId !== 'unknown' ? workoutId : null
        };
      }).sort((a, b) => {
        // Sort by date
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);
        const aDate = new Date(2025, aMonth - 1, aDay);
        const bDate = new Date(2025, bMonth - 1, bDay);
        return aDate - bDate;
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

    return records.filter(r => r && r.date && new Date(r.date) >= cutoffDate);
  };

  const getFilteredExercises = () => {
    let filtered = Object.keys(exerciseProgress);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(key =>
        exerciseProgress[key].name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply muscle group filter
    if (activeMuscleFilters.length > 0 && activeMuscleFilters.length < 9) {
      filtered = filtered.filter(key => {
        const exerciseName = exerciseProgress[key].name;
        // Check if this exercise belongs to any of the active muscle groups
        return activeMuscleFilters.some(muscleGroup => {
          const exercisesInGroup = exerciseProgress[key].muscleGroup ||
            // Try to match by checking common keywords
            (exerciseName.toLowerCase().includes(muscleGroup.toLowerCase()) ||
             (muscleGroup === 'chest' && (exerciseName.toLowerCase().includes('bench') || exerciseName.toLowerCase().includes('press') || exerciseName.toLowerCase().includes('fly'))) ||
             (muscleGroup === 'back' && (exerciseName.toLowerCase().includes('row') || exerciseName.toLowerCase().includes('pull') || exerciseName.toLowerCase().includes('lat'))) ||
             (muscleGroup === 'legs' && (exerciseName.toLowerCase().includes('squat') || exerciseName.toLowerCase().includes('leg') || exerciseName.toLowerCase().includes('lunge'))) ||
             (muscleGroup === 'biceps' && exerciseName.toLowerCase().includes('curl')) ||
             (muscleGroup === 'triceps' && (exerciseName.toLowerCase().includes('tricep') || exerciseName.toLowerCase().includes('extension') || exerciseName.toLowerCase().includes('dip'))) ||
             (muscleGroup === 'shoulders' && (exerciseName.toLowerCase().includes('shoulder') || exerciseName.toLowerCase().includes('lateral') || exerciseName.toLowerCase().includes('overhead'))) ||
             (muscleGroup === 'abs' && (exerciseName.toLowerCase().includes('crunch') || exerciseName.toLowerCase().includes('plank') || exerciseName.toLowerCase().includes('ab'))) ||
             (muscleGroup === 'forearms' && exerciseName.toLowerCase().includes('wrist')) ||
             (muscleGroup === 'cardio' && (exerciseName.toLowerCase().includes('run') || exerciseName.toLowerCase().includes('bike') || exerciseName.toLowerCase().includes('cardio')))
            );
          return exercisesInGroup;
        });
      });
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
      if (workout.date && new Date(workout.date) >= thirtyDaysAgo) {
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
    if (!exercise || !exercise.records || !exercise.records.length) return null;

    const records = exercise.records;
    const maxWeight = Math.max(...records.map(r => r.weight || 0));
    const maxVolume = Math.max(...records.map(r => r.volume || 0));
    const maxReps = Math.max(...records.map(r => r.reps || 0));

    return { maxWeight, maxVolume, maxReps };
  };

  // Quick Stats Calculations for Charts Tab
  const getQuickStats = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Total Volume This Month
    const thisMonthWorkouts = workoutHistory.filter(w => w && w.date && new Date(w.date) >= thirtyDaysAgo);
    const totalVolume = thisMonthWorkouts.reduce((total, workout) => {
      return total + (workout.exercises || []).reduce((workoutTotal, exercise) => {
        return workoutTotal + (exercise.sets || []).reduce((setTotal, set) => {
          if (set.weight && set.reps) {
            return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
          }
          return setTotal;
        }, 0);
      }, 0);
    }, 0);

    // Find strongest lift (highest estimated 1RM)
    let strongestLift = { exercise: 'N/A', weight: 0, reps: 0, estimatedMax: 0 };
    Object.entries(exerciseProgress).forEach(([key, exercise]) => {
      if (exercise.records && exercise.records.length > 0) {
        exercise.records.forEach(record => {
          // Brzycki formula for 1RM estimation
          const estimated1RM = record.weight * (36 / (37 - record.reps));
          if (estimated1RM > strongestLift.estimatedMax) {
            strongestLift = {
              exercise: exercise.name,
              weight: record.weight,
              reps: record.reps,
              estimatedMax: Math.round(estimated1RM)
            };
          }
        });
      }
    });

    // Most improved exercise (% gain over last month)
    let mostImproved = { exercise: 'N/A', percentGain: 0 };
    Object.entries(exerciseProgress).forEach(([key, exercise]) => {
      if (exercise.records && exercise.records.length >= 2) {
        const recentRecords = filterRecordsByTimeRange(exercise.records, '30d');
        const olderRecords = exercise.records.filter(r => {
          if (!r || !r.date) return false;
          const recordDate = new Date(r.date);
          return recordDate < thirtyDaysAgo;
        });

        if (recentRecords.length > 0 && olderRecords.length > 0) {
          const recentAvg = recentRecords.reduce((sum, r) => sum + r.weight, 0) / recentRecords.length;
          const olderAvg = olderRecords.reduce((sum, r) => sum + r.weight, 0) / olderRecords.length;
          const percentGain = ((recentAvg - olderAvg) / olderAvg) * 100;

          if (percentGain > mostImproved.percentGain) {
            mostImproved = {
              exercise: exercise.name,
              percentGain: Math.round(percentGain)
            };
          }
        }
      }
    });

    // Training frequency (workouts per week avg)
    const weeks = 4;
    const workoutsPerWeek = thisMonthWorkouts.length / weeks;

    return {
      totalVolume: Math.round(totalVolume),
      strongestLift,
      mostImproved,
      workoutsPerWeek: workoutsPerWeek.toFixed(1)
    };
  };

  const getRecentPRs = () => {
    const allPRs = [];

    Object.entries(exerciseProgress).forEach(([key, exercise]) => {
      if (exercise.records && exercise.records.length > 0) {
        const records = exercise.records;
        const maxWeight = Math.max(...records.map(r => r.weight || 0));
        const maxWeightRecord = records.find(r => (r.weight || 0) === maxWeight);

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
      .filter(pr => pr && pr.date)
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

  const getMonthlyCalendarData = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get the first Monday before or on the start of month
    const firstDay = new Date(startOfMonth);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 offset
    firstDay.setDate(firstDay.getDate() - daysToSubtract);

    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(firstDay);

    // Generate weeks (max 6 weeks to cover any month)
    for (let i = 0; i < 42; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === today.getMonth();

      // Find workout for this day
      const dayWorkout = workoutHistory.find(w => {
        if (!w || !w.date) return false;
        try {
          const workoutDate = new Date(w.date).toISOString().split('T')[0];
          return workoutDate === dateKey;
        } catch (e) {
          return false;
        }
      });

      // Check if this workout has any PRs
      let hasPR = false;
      if (dayWorkout) {
        const recentPRs = getRecentPRs();
        hasPR = recentPRs.some(pr => {
          if (!pr || !pr.date) return false;
          try {
            const prDate = new Date(pr.date).toISOString().split('T')[0];
            return prDate === dateKey;
          } catch (e) {
            return false;
          }
        });
      }

      currentWeek.push({
        date: dateKey,
        dateObj: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        hasWorkout: !!dayWorkout,
        workout: dayWorkout,
        hasPR: hasPR,
        isToday: currentDate.toDateString() === today.toDateString(),
        isCurrentMonth: isCurrentMonth
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      // Stop after end of month + extra days
      if (weeks.length >= 5 && currentDate > endOfMonth) break;
    }

    // Add remaining days if any
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
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

    const last30Days = workoutHistory.filter(w => w && w.date && new Date(w.date) >= thirtyDaysAgo);
    const previous30Days = workoutHistory.filter(w => {
      if (!w || !w.date) return false;
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

  const handleSeedTestData = () => {
    Alert.alert(
      '🧪 Seed Test Data',
      'This will create 5 bench press workouts with varying weights to test the progress chart colors (green for progress, red for regression).\n\nNote: This will clear existing data first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Test Data',
          onPress: async () => {
            try {
              const userId = user?.uid || 'guest';
              const result = await WorkoutStorageService.seedBenchPressTestData(userId);

              if (result.success) {
                // Reload to show test data
                await loadProgressData();
                Alert.alert('Success', `Created ${result.workoutsCreated} bench press workouts!\n\nGo to the Stats tab, select Bench Press, and see the green/red colors on the chart.`);
              } else {
                Alert.alert('Error', 'Failed to create test data');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create test data');
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL workout history, exercise progress, stats, goals, and achievements. This action cannot be undone!\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.uid || 'guest';

              // Clear all data
              await WorkoutStorageService.clearAllData(userId);

              // Also clear goals and achievements
              await AsyncStorage.removeItem(`goals_${userId}`);
              await AsyncStorage.removeItem(`achievements_${userId}`);

              // Reload to show empty state
              await loadProgressData();

              Alert.alert('Success', 'All data has been cleared. Starting fresh!');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
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
        <Ionicons
          name="stats-chart"
          size={20}
          color={activeTab === 'overview' ? Colors.background : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
        onPress={() => setActiveTab('charts')}
      >
        <Ionicons
          name="trending-up"
          size={20}
          color={activeTab === 'charts' ? Colors.background : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>Charts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'goals' && styles.tabActive]}
        onPress={() => setActiveTab('goals')}
      >
        <Ionicons
          name="flag"
          size={20}
          color={activeTab === 'goals' ? Colors.background : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>Goals</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
        onPress={() => setActiveTab('achievements')}
      >
        <Ionicons
          name="ribbon"
          size={20}
          color={activeTab === 'achievements' ? Colors.background : Colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>Badges</Text>
      </TouchableOpacity>
    </View>
  );

  const getWeeklyWorkoutCount = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutHistory.filter(w => w && w.date && new Date(w.date) >= weekAgo).length;
  };

  const getMonthlyWorkoutCount = () => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return workoutHistory.filter(w => w && w.date && new Date(w.date) >= monthAgo).length;
  };

  const getAverageWorkoutsPerWeek = () => {
    const validWorkouts = workoutHistory.filter(w => w && w.date);
    if (validWorkouts.length === 0) return 0;
    const oldestWorkout = new Date(Math.min(...validWorkouts.map(w => new Date(w.date))));
    const now = new Date();
    const weeksPassed = Math.max(1, Math.ceil((now - oldestWorkout) / (7 * 24 * 60 * 60 * 1000)));
    return (validWorkouts.length / weeksPassed).toFixed(1);
  };

  const getTotalActiveTime = () => {
    // Estimate: average workout is 45 minutes
    const totalMinutes = workoutHistory.length * 45;
    const hours = Math.floor(totalMinutes / 60);
    return hours;
  };

  const getMostFrequentExercises = () => {
    const exerciseCounts = {};
    workoutHistory.forEach(workout => {
      (workout.exercises || []).forEach(exercise => {
        const name = exercise.name;
        exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
      });
    });

    return Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  };

  const getWorkoutFrequencyData = () => {
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const count = workoutHistory.filter(w => {
        if (!w || !w.date) return false;
        try {
          const workoutDate = new Date(w.date).toISOString().split('T')[0];
          return workoutDate === dateKey;
        } catch (e) {
          return false;
        }
      }).length;

      last7Days.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        count,
        isToday: i === 0
      });
    }

    return last7Days;
  };

  const getTopVolumeWorkouts = () => {
    const workoutsWithVolume = workoutHistory.filter(w => w && w.date).map(workout => {
      const totalVolume = (workout.exercises || []).reduce((workoutTotal, exercise) => {
        const exerciseVolume = (exercise.sets || []).reduce((setTotal, set) => {
          if (set.weight && set.reps) {
            return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
          }
          return setTotal;
        }, 0);
        return workoutTotal + exerciseVolume;
      }, 0);

      return {
        ...workout,
        totalVolume,
        exerciseCount: workout.exercises?.length || 0,
        setCount: (workout.exercises || []).reduce((total, ex) => total + (ex.sets?.length || 0), 0)
      };
    });

    return workoutsWithVolume
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);
  };

  // Helper function to handle workout clicks with debouncing
  const handleWorkoutClick = (workout) => {
    // Prevent multiple rapid clicks
    if (isOpeningModalRef.current) {
      return;
    }

    // Validate workout has required data
    if (!workout || !workout.exercises) {
      return;
    }

    isOpeningModalRef.current = true;

    // Close other modals first
    setShowWorkoutListModal(false);
    setShowVolumeModal(false);
    setShowPRDetailModal(false);

    // Small delay before opening new modal to ensure clean transition
    setTimeout(() => {
      setSelectedWorkout(workout);
      setShowWorkoutDetailModal(true);
    }, 100);

    // Reset the ref after a short delay
    setTimeout(() => {
      isOpeningModalRef.current = false;
    }, 600);
  };

  // Helper function to handle chart point clicks
  const handleChartPointClick = (workoutId, chartPointDate) => {
    if (!workoutId) {
      return;
    }

    // First try: Find by exact ID match
    let workout = workoutHistory.find(w => w.id === workoutId);

    // Second try: Find by originalId (in case workout was synced to Firebase)
    if (!workout) {
      workout = workoutHistory.find(w => w.originalId === workoutId);
    }

    // Third try: Find by date match (fallback for synced workouts where ID changed)
    if (!workout && chartPointDate) {
      // Parse the chart date (format: "MM/DD")
      const [month, day] = chartPointDate.split('/').map(Number);
      const currentYear = new Date().getFullYear();

      workout = workoutHistory.find(w => {
        if (!w || !w.date) return false;
        const workoutDate = new Date(w.date);
        return workoutDate.getMonth() + 1 === month &&
               workoutDate.getDate() === day &&
               workoutDate.getFullYear() === currentYear;
      });
    }

    if (workout) {
      handleWorkoutClick(workout);
    } else {
      Alert.alert(
        'Workout Not Found',
        'Could not find the linked workout in your history. It may have been deleted.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderOverviewTab = () => {
    const recentPRs = getRecentPRs();
    const calendarData = getMonthlyCalendarData();
    const volumeChange = calculateVolumeChange();
    const lastWorkout = workoutHistory.length > 0
      ? [...workoutHistory].filter(w => w && w.date).sort((a, b) => {
          try {
            return new Date(b.date) - new Date(a.date);
          } catch (e) {
            return 0;
          }
        })[0] || null
      : null;
    const weeklyCount = getWeeklyWorkoutCount();
    const monthlyCount = getMonthlyWorkoutCount();
    const avgPerWeek = getAverageWorkoutsPerWeek();
    const totalHours = getTotalActiveTime();
    const topExercises = getMostFrequentExercises();
    const frequencyData = getWorkoutFrequencyData();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={80} color={Colors.textMuted} style={{ marginBottom: Spacing.lg }} />
            <Text style={styles.emptyStateTitle}>Start Your Journey!</Text>
            <Text style={styles.emptyStateText}>
              Complete your first workout to unlock progress tracking and goals
            </Text>
            <TouchableOpacity
              style={styles.startWorkoutButton}
              onPress={() => navigation.navigate('StartWorkout')}
            >
              <Text style={styles.startWorkoutButtonText}>Start Workout Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 1. Day Streak & Motivational Banner */}
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.motivationalBanner}
            >
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

            {/* 2. Monthly Activity Calendar */}
            <View style={styles.monthlyCalendarSection}>
              <Text style={styles.sectionTitle}>
                This Month's Activity - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={styles.monthlyCalendarContainer}>
                {/* Day labels */}
                <View style={styles.calendarDayLabels}>
                  <Text style={styles.calendarDayLabel}>Mon</Text>
                  <Text style={styles.calendarDayLabel}>Tue</Text>
                  <Text style={styles.calendarDayLabel}>Wed</Text>
                  <Text style={styles.calendarDayLabel}>Thu</Text>
                  <Text style={styles.calendarDayLabel}>Fri</Text>
                  <Text style={styles.calendarDayLabel}>Sat</Text>
                  <Text style={styles.calendarDayLabel}>Sun</Text>
                </View>

                {/* Calendar weeks */}
                {calendarData.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.calendarWeekRow}>
                    {week.map((day, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.calendarDay,
                          !day.isCurrentMonth && styles.calendarDayOutsideMonth,
                          day.isToday && styles.calendarDayToday,
                          day.hasWorkout && !day.hasPR && styles.calendarDayWithWorkout,
                          day.hasPR && styles.calendarDayWithPR
                        ]}
                        onPress={() => {
                          if (day.hasWorkout && day.workout) {
                            handleWorkoutClick(day.workout);
                          }
                        }}
                        disabled={!day.hasWorkout}
                        activeOpacity={day.hasWorkout ? 0.7 : 1}
                      >
                        <Text
                          style={[
                            styles.calendarDayNumber,
                            !day.isCurrentMonth && styles.calendarDayNumberOutside,
                            day.isToday && styles.calendarDayNumberToday,
                            day.hasWorkout && styles.calendarDayNumberWithWorkout,
                            day.hasPR && styles.calendarDayNumberWithPR
                          ]}
                        >
                          {day.dayNumber}
                        </Text>
                        {day.hasPR && (
                          <Text style={styles.calendarDayPRIndicator}>🏆</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}

                {/* Legend */}
                <View style={styles.calendarLegend}>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.calendarLegendText}>Workout</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendDot, { backgroundColor: '#FFD700' }]} />
                    <Text style={styles.calendarLegendText}>PR Day 🏆</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendDot, { backgroundColor: Colors.secondary }]} />
                    <Text style={styles.calendarLegendText}>Today</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Recent Personal Records */}
            {recentPRs.length > 0 && (
              <View style={styles.prSection}>
                <Text style={styles.sectionTitle}>Recent Personal Records</Text>
                {recentPRs.map((pr, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedPR(pr);
                      setShowPRDetailModal(true);
                    }}
                  >
                    <View style={styles.prCard}>
                      <View style={styles.prBadge}>
                        <Ionicons name="trophy" size={24} color={Colors.primary} />
                      </View>
                      <View style={styles.prInfo}>
                        <Text style={styles.prExercise}>{pr.exercise}</Text>
                        <Text style={styles.prDetails}>
                          {pr.weight} lbs × {pr.reps} reps
                        </Text>
                      </View>
                      <Text style={styles.prDate}>{formatTimeAgo(pr.date)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Activity Summary */}
            <View style={styles.recentActivitySection}>
              <Text style={styles.sectionTitle}>Recent Summary</Text>
              <View style={styles.summaryGrid}>
                <TouchableOpacity
                  style={styles.summaryCard}
                  onPress={() => setShowWorkoutListModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="barbell-outline" size={24} color={Colors.primary} />
                    <Text style={styles.summaryCardValue}>{userStats?.totalWorkouts || 0}</Text>
                  </View>
                  <Text style={styles.summaryCardLabel}>Total Workouts</Text>
                  <Text style={styles.summaryCardSubtext}>{weeklyCount} this week</Text>
                </TouchableOpacity>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
                    <Text style={styles.summaryCardValue}>
                      {lastWorkout ? formatTimeAgo(lastWorkout.date) : 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.summaryCardLabel}>Last Workout</Text>
                  <Text style={styles.summaryCardSubtext} numberOfLines={1}>
                    {lastWorkout?.workoutTitle || 'Quick Workout'}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="trending-up-outline" size={24} color={Colors.primary} />
                    <Text style={styles.summaryCardValue}>{monthlyCount}</Text>
                  </View>
                  <Text style={styles.summaryCardLabel}>This Month</Text>
                  <Text style={styles.summaryCardSubtext}>
                    {avgPerWeek} avg/week
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryCardHeader}>
                    <Ionicons name="flag-outline" size={24} color={Colors.primary} />
                    <Text style={styles.summaryCardValue}>
                      {goals.filter(g => g.status === 'active').length}
                    </Text>
                  </View>
                  <Text style={styles.summaryCardLabel}>Active Goals</Text>
                  <Text style={styles.summaryCardSubtext}>
                    {goals.filter(g => g.status === 'completed').length} completed
                  </Text>
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
    const quickStats = getQuickStats();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={80} color={Colors.textMuted} style={{ marginBottom: Spacing.lg }} />
            <Text style={styles.emptyStateTitle}>No Chart Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Complete workouts to see your progress visualized!
            </Text>
          </View>
        ) : (
          <>
            {/* Exercise Selector - At the Top */}
            <TouchableOpacity
              style={styles.exerciseSelectorToggle}
              onPress={() => setShowMuscleFilters(!showMuscleFilters)}
              activeOpacity={0.8}
            >
              <View style={styles.exerciseSelectorToggleContent}>
                <View style={styles.exerciseSelectorIconContainer}>
                  <Ionicons name="search" size={20} color={Colors.primary} />
                </View>
                <View style={styles.exerciseSelectorToggleTextContainer}>
                  <Text style={styles.exerciseSelectorToggleTitle}>
                    {selectedExercise ? 'Change Exercise' : 'Select Exercise'}
                  </Text>
                  {selectedExercise && (
                    <Text style={styles.exerciseSelectorToggleSubtitle}>
                      {exerciseProgress[selectedExercise]?.name}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name={showMuscleFilters ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Exercise Search Panel - Appears right after toggle */}
            {showMuscleFilters && (
              <View style={styles.exerciseSearchCard}>
                <Text style={styles.cardTitle}>Find Exercise</Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: Spacing.xs }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Exercise List */}
              <View style={styles.exerciseListContainer}>
                <Text style={styles.exerciseListLabel}>
                  {filteredExercises.length} {filteredExercises.length === 1 ? 'Exercise' : 'Exercises'}
                </Text>
                <ScrollView style={styles.exerciseListScrollCompact} showsVerticalScrollIndicator={true}>
                  {filteredExercises.map((exerciseKey) => {
                    const exercise = exerciseProgress[exerciseKey];
                    const isSelected = selectedExercise === exerciseKey;

                    // Count unique workouts by workoutId instead of total records
                    const filteredRecords = filterRecordsByTimeRange(exercise.records, timeRange);
                    const uniqueWorkoutIds = new Set(
                      filteredRecords
                        .filter(record => record.workoutId) // Only count records with workoutId
                        .map(record => record.workoutId)
                    );
                    const sessionsCount = uniqueWorkoutIds.size;

                    return (
                      <TouchableOpacity
                        key={exerciseKey}
                        style={[
                          styles.exerciseListItemCompact,
                          isSelected && styles.exerciseListItemSelected
                        ]}
                        onPress={() => {
                          selectExercise(exerciseKey, timeRange, chartType);
                          setShowMuscleFilters(false); // Close panel after selection
                        }}
                      >
                        <View style={styles.exerciseListItemContent}>
                          <Text
                            style={[
                              styles.exerciseListItemName,
                              isSelected && styles.exerciseListItemNameSelected
                            ]}
                          >
                            {exercise.name}
                          </Text>
                          <Text
                            style={[
                              styles.exerciseListItemCount,
                              isSelected && styles.exerciseListItemCountSelected
                            ]}
                          >
                            {sessionsCount} {sessionsCount === 1 ? 'workout' : 'workouts'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text style={styles.exerciseListItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            )}

            {/* Progress Chart */}
            {selectedExercise && chartData && chartData.length > 0 ? (
              <View style={styles.chartCard}>
                {/* Exercise Name */}
                <Text style={styles.chartExerciseName}>{exerciseProgress[selectedExercise]?.name}</Text>

                {/* Progress Summary */}
                {chartData.length >= 2 && (() => {
                  const firstValue = chartData[0].weight;
                  const lastValue = chartData[chartData.length - 1].weight;
                  const diff = lastValue - firstValue;
                  const percentChange = firstValue > 0 ? ((diff / firstValue) * 100).toFixed(1) : 0;
                  const isPositive = diff > 0;
                  const isNegative = diff < 0;

                  return (
                    <View style={styles.progressSummary}>
                      <View style={[
                        styles.progressSummaryBadge,
                        { backgroundColor: isPositive ? 'rgba(3, 218, 198, 0.15)' : isNegative ? 'rgba(255, 112, 67, 0.15)' : 'rgba(156, 163, 175, 0.15)' }
                      ]}>
                        <Text style={[
                          styles.progressSummaryText,
                          { color: isPositive ? '#03DAC6' : isNegative ? '#FF7043' : '#9CA3AF' }
                        ]}>
                          {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(diff).toFixed(0)} {chartType === 'reps' ? 'reps' : 'lbs'} ({isPositive ? '+' : ''}{percentChange}%)
                        </Text>
                      </View>
                      <Text style={styles.progressSummaryLabel}>
                        {isPositive ? 'Progress' : isNegative ? 'Change' : 'No change'} over {timeRange === 'all' ? 'all time' : timeRange}
                      </Text>
                    </View>
                  );
                })()}

                {/* Time Range Controls */}
                <View style={styles.timeRangeSection}>
                  <Text style={styles.controlSectionLabel}>Time Range</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartControlScroll}>
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
                          styles.chartControlButton,
                          timeRange === range.value && styles.chartControlButtonActive
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
                            styles.chartControlButtonText,
                            timeRange === range.value && styles.chartControlButtonTextActive
                          ]}
                        >
                          {range.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Chart Type Controls */}
                <View style={styles.chartTypeSection}>
                  <Text style={styles.controlSectionLabel}>Chart Type</Text>
                  <View style={styles.chartTypeButtonsRow}>
                    {[
                      { icon: 'fitness-outline', label: 'Max', value: 'max' },
                      { icon: 'bar-chart-outline', label: 'Volume', value: 'volume' },
                      { icon: 'repeat-outline', label: 'Reps', value: 'reps' },
                      { icon: 'trophy-outline', label: '1RM', value: '1rm' }
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.chartTypeButton,
                          chartType === type.value && styles.chartTypeButtonActive
                        ]}
                        onPress={() => {
                          setChartType(type.value);
                          if (selectedExercise) {
                            selectExercise(selectedExercise, timeRange, type.value);
                          }
                        }}
                      >
                        <Ionicons
                          name={type.icon}
                          size={20}
                          color={chartType === type.value ? Colors.background : Colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.chartTypeButtonLabel,
                            chartType === type.value && styles.chartTypeButtonLabelActive
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Chart */}
                <SimpleChart
                  data={chartData}
                  title=""
                  chartType={chartType}
                  onPointPress={handleChartPointClick}
                />
              </View>
            ) : selectedExercise ? (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>
                  No data available for this time range
                </Text>
              </View>
            ) : (
              <View style={styles.noDataCard}>
                <Ionicons name="analytics-outline" size={48} color={Colors.textMuted} style={{ marginBottom: Spacing.md }} />
                <Text style={styles.noDataTitle}>Select an Exercise</Text>
                <Text style={styles.noDataText}>
                  Choose an exercise above to view its progress chart
                </Text>
              </View>
            )}

          </>
        )}
      </ScrollView>
    );
  };

  const handleDeleteGoal = async (goalId) => {
    const userId = user?.uid || 'guest';
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

  // Helper: Count how many of the last N weeks hit the workout target
  const countWeeksHittingTarget = (targetPerWeek) => {
    let weeksHit = 0;
    const today = new Date();

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const workoutsInWeek = workoutHistory.filter(w => {
        if (!w || !w.date) return false;
        const d = new Date(w.date);
        return d >= weekStart && d < weekEnd;
      }).length;

      if (workoutsInWeek >= targetPerWeek) {
        weeksHit++;
      }
    }
    return weeksHit;
  };

  // Generate goal suggestions based on workout history and stats
  const generateGoalSuggestions = () => {
    const suggestions = [];
    const totalWorkouts = userStats?.totalWorkouts || 0;

    // === WEEKLY FREQUENCY GOALS ===
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const workoutsThisWeek = workoutHistory.filter(w => w && w.date && new Date(w.date) >= startOfWeek).length;

    const frequencyTargets = [3, 4, 5, 6];
    const nextFreqTarget = frequencyTargets.find(t => t > workoutsThisWeek);
    if (nextFreqTarget && !goals.some(g => g.status === 'active' && g.type === 'frequency')) {
      suggestions.push({
        type: 'frequency',
        icon: 'calendar',
        title: `${nextFreqTarget}x This Week`,
        description: `Current: ${workoutsThisWeek} workouts this week`,
        targetValue: nextFreqTarget,
        currentProgress: workoutsThisWeek,
      });
    }

    // === MONTHLY WORKOUT COUNT GOALS ===
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const workoutsThisMonth = workoutHistory.filter(w => w && w.date && new Date(w.date) >= startOfMonth).length;

    const monthlyTargets = [12, 16, 20]; // 3x/week, 4x/week, 5x/week for a month
    const nextMonthlyTarget = monthlyTargets.find(t => t > workoutsThisMonth);
    if (nextMonthlyTarget && !goals.some(g => g.status === 'active' && g.type === 'monthly_workouts')) {
      const perWeek = Math.round(nextMonthlyTarget / 4);
      suggestions.push({
        type: 'monthly_workouts',
        icon: 'fitness',
        title: `${nextMonthlyTarget} Workouts This Month`,
        description: `${workoutsThisMonth} done (~${perWeek}x/week pace)`,
        targetValue: nextMonthlyTarget,
        currentProgress: workoutsThisMonth,
      });
    }

    // === CONSISTENCY GOALS (weeks hitting target) ===
    // Count how many of the last 4 weeks hit 3+ workouts
    const weeksHittingTarget = countWeeksHittingTarget(3);
    if (weeksHittingTarget < 4 && !goals.some(g => g.status === 'active' && g.type === 'consistency')) {
      suggestions.push({
        type: 'consistency',
        icon: 'checkmark-done',
        title: '4 Weeks of 3x/Week',
        description: `${weeksHittingTarget}/4 weeks completed`,
        targetValue: 4,
        currentProgress: weeksHittingTarget,
      });
    }

    // === MONTHLY VOLUME GOALS ===
    // Calculate volume this month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyVolume = workoutHistory
      .filter(w => w && w.date && new Date(w.date) >= thirtyDaysAgo)
      .reduce((total, workout) => {
        return total + (workout.exercises || []).reduce((exerciseTotal, exercise) => {
          return exerciseTotal + (exercise.sets || []).reduce((setTotal, set) => {
            if (set.weight && set.reps) {
              return setTotal + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return setTotal;
          }, 0);
        }, 0);
      }, 0);

    const volumeTargets = [10000, 25000, 50000, 75000, 100000];
    const nextVolumeTarget = volumeTargets.find(t => t > monthlyVolume);
    if (nextVolumeTarget && !goals.some(g => g.status === 'active' && g.type === 'volume')) {
      suggestions.push({
        type: 'volume',
        icon: 'trending-up',
        title: `Lift ${(nextVolumeTarget / 1000).toFixed(0)}k lbs`,
        description: `This month: ${Math.round(monthlyVolume).toLocaleString()} lbs`,
        targetValue: nextVolumeTarget,
        currentProgress: Math.round(monthlyVolume),
      });
    }

    // === PR GOALS (Weight) ===
    const exerciseEntries = Object.entries(exerciseProgress)
      .filter(([_, data]) => data.records && data.records.length > 0)
      .sort((a, b) => {
        const aLatest = new Date(a[1].records[a[1].records.length - 1]?.date || 0);
        const bLatest = new Date(b[1].records[b[1].records.length - 1]?.date || 0);
        return bLatest - aLatest;
      });

    for (const [exerciseKey, data] of exerciseEntries) {
      const maxWeight = Math.max(...data.records.map(r => r.weight || 0));
      if (maxWeight > 0) {
        let nextTarget;
        if (maxWeight < 100) {
          nextTarget = Math.ceil((maxWeight + 5) / 5) * 5;
        } else {
          nextTarget = Math.ceil((maxWeight + 10) / 10) * 10;
        }

        const isAlreadyActive = goals.some(
          g => g.status === 'active' &&
               g.exerciseName === data.name &&
               g.type === 'weight'
        );

        if (!isAlreadyActive && suggestions.length < 12) {
          suggestions.push({
            type: 'weight',
            icon: 'barbell',
            exerciseName: data.name,
            title: `${data.name}: ${nextTarget} lbs`,
            description: `Current PR: ${maxWeight} lbs`,
            targetValue: nextTarget,
            currentProgress: maxWeight,
          });
        }
      }
    }

    return suggestions;
  };

  const handleActivateGoal = async (suggestion) => {
    const userId = user?.uid || 'guest';
    const newGoalData = {
      type: suggestion.type,
      title: suggestion.title,
      exerciseName: suggestion.exerciseName || '',
      targetValue: suggestion.targetValue.toString(),
      currentProgress: suggestion.currentProgress || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const result = await WorkoutStorageService.saveGoal(newGoalData, userId);
    if (result.success) {
      await updateGoalsProgress();
    }
  };

  const getGoalIcon = (type) => {
    switch (type) {
      case 'frequency': return 'calendar';
      case 'monthly_workouts': return 'fitness';
      case 'consistency': return 'checkmark-done';
      case 'volume': return 'trending-up';
      case 'weight': return 'barbell';
      default: return 'flag';
    }
  };

  const getGoalUnit = (type) => {
    switch (type) {
      case 'frequency': return 'workouts';
      case 'monthly_workouts': return 'workouts';
      case 'consistency': return 'weeks';
      case 'volume': return 'lbs';
      case 'weight': return 'lbs';
      default: return '';
    }
  };

  const renderGoalsTab = () => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const suggestions = generateGoalSuggestions();

    const formatProgress = (goal) => {
      const progress = goal.currentProgress || 0;
      const target = parseFloat(goal.targetValue) || 1;
      const unit = getGoalUnit(goal.type);

      if (goal.type === 'volume') {
        return `${Math.round(progress).toLocaleString()} / ${Math.round(target).toLocaleString()} ${unit}`;
      }
      return `${Math.round(progress)} / ${target} ${unit}`;
    };

    const formatRemaining = (goal) => {
      const progress = goal.currentProgress || 0;
      const target = parseFloat(goal.targetValue) || 1;
      const remaining = Math.max(0, target - progress);
      const unit = getGoalUnit(goal.type);

      if (goal.type === 'volume') {
        return `${Math.round(remaining).toLocaleString()} ${unit} to go`;
      }
      return `${Math.round(remaining)} ${unit} to go`;
    };

    const getCompleteBadgeText = (type) => {
      switch (type) {
        case 'frequency': return 'Done!';
        case 'monthly_workouts': return 'Crushed!';
        case 'consistency': return 'Consistent!';
        case 'volume': return 'Beast!';
        case 'weight': return 'PR!';
        default: return 'Complete!';
      }
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.map((goal) => {
              const progress = goal.currentProgress || 0;
              const target = parseFloat(goal.targetValue) || 1;
              const percentage = Math.min((progress / target) * 100, 100);
              const isComplete = percentage >= 100;

              return (
                <View
                  key={goal.id}
                  style={[styles.prGoalCard, isComplete && styles.prGoalCardComplete]}
                >
                  <View style={styles.prGoalHeader}>
                    <View style={styles.goalIconContainer}>
                      <Ionicons name={getGoalIcon(goal.type)} size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.prGoalInfo}>
                      <Text style={styles.prGoalExercise}>{goal.title}</Text>
                      <Text style={styles.prGoalTarget}>{formatProgress(goal)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.prGoalDelete}
                    >
                      <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.prGoalProgress}>
                    <Text style={styles.prGoalPercentage}>{Math.round(percentage)}%</Text>
                    {isComplete ? (
                      <View style={styles.prGoalCompleteBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.prGoalCompleteBadgeText}>{getCompleteBadgeText(goal.type)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.prGoalRemaining}>{formatRemaining(goal)}</Text>
                    )}
                  </View>

                  <View style={styles.prGoalProgressBar}>
                    <View
                      style={[
                        styles.prGoalProgressBarFill,
                        { width: `${percentage}%`, backgroundColor: Colors.primary }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Suggested Goals */}
        {suggestions.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>
              {activeGoals.length > 0 ? 'More Goals' : 'Suggested Goals'}
            </Text>
            <Text style={styles.goalsSectionHint}>
              Tap to activate a goal
            </Text>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.type}-${index}`}
                style={styles.suggestionCard}
                onPress={() => handleActivateGoal(suggestion)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIconContainer}>
                  <Ionicons name={suggestion.icon} size={22} color={Colors.primary} />
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionExercise}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDetails}>{suggestion.description}</Text>
                </View>
                <View style={styles.suggestionAction}>
                  <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {activeGoals.length === 0 && suggestions.length === 0 && (
          <View style={styles.emptyGoalsState}>
            <Ionicons name="flag-outline" size={48} color={Colors.textMuted} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.emptyGoalsTitle}>No Goals Yet</Text>
            <Text style={styles.emptyGoalsText}>
              Complete some workouts and we'll suggest goals for you!
            </Text>
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedGoals.map((goal) => (
              <View key={goal.id} style={styles.completedGoalCard}>
                <Ionicons name="trophy" size={20} color={Colors.primary} />
                <View style={styles.completedGoalInfo}>
                  <Text style={styles.completedGoalTitle}>{goal.title}</Text>
                  <Text style={styles.completedGoalDate}>
                    {new Date(goal.completedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
                <TouchableOpacity
                  key={achievement.id}
                  onPress={() => handleAchievementPress(achievement)}
                  activeOpacity={0.8}
                  style={styles.achievementCardWrapper}
                >
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.achievementCard}
                  >
                    <Text style={styles.achievementCardIcon}>{achievement.icon}</Text>
                    <Text style={styles.achievementCardTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementCardDescription} numberOfLines={2}>{achievement.description}</Text>
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementBadgeText}>✓ UNLOCKED</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Locked Achievements */}
        {lockedFiltered.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Locked ({lockedFiltered.length})</Text>
            <View style={styles.achievementsGridCentered}>
              {lockedFiltered.map((achievement) => {
                const progress = getAchievementProgress(achievement);
                const progressText = getProgressText(achievement);

                return (
                  <TouchableOpacity
                    key={achievement.id}
                    onPress={() => handleAchievementPress(achievement)}
                    activeOpacity={0.8}
                    style={styles.achievementCardWrapper}
                  >
                    <View style={[styles.achievementCard, styles.achievementCardLocked]}>
                      <Text style={[styles.achievementCardIcon, styles.achievementCardIconLocked]}>
                        {achievement.icon}
                      </Text>
                      <Text style={[styles.achievementCardTitle, styles.achievementCardTitleLocked]}>
                        {achievement.title}
                      </Text>
                      <Text style={[styles.achievementCardDescription, styles.achievementCardDescriptionLocked]} numberOfLines={2}>
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
                  </TouchableOpacity>
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
      screenName="ProgressScreen"
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

        {/* Workout List Modal */}
        <Modal
          visible={showWorkoutListModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWorkoutListModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Workouts</Text>
                <TouchableOpacity onPress={() => setShowWorkoutListModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.workoutSummaryCard}>
                <Text style={styles.workoutSummaryTitle}>{userStats?.totalWorkouts || 0} Total Workouts</Text>
                <Text style={styles.workoutSummarySubtext}>
                  {workoutHistory.filter(w => {
                    if (!w || !w.date) return false;
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(w.date) >= weekAgo;
                  }).length} this week · {workoutHistory.filter(w => {
                    if (!w || !w.date) return false;
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(w.date) >= monthAgo;
                  }).length} this month
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={styles.modalScrollView}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
              >
                {workoutHistory
                  .filter(w => w && w.date)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((workout, index) => {
                    const workoutDate = new Date(workout.date);
                    const totalSets = (workout.exercises || []).reduce(
                      (total, ex) => total + (ex.sets?.length || 0), 0
                    );
                    const totalExercises = workout.exercises?.length || 0;

                    return (
                      <TouchableOpacity
                        key={workout.id || index}
                        style={styles.workoutListItem}
                        onPress={() => handleWorkoutClick(workout)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.workoutListHeader}>
                          <View>
                            <Text style={styles.workoutListTitle}>
                              {workout.workoutTitle || 'Quick Workout'}
                            </Text>
                            <Text style={styles.workoutListDate}>
                              {workoutDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </View>
                          <View style={styles.workoutListStats}>
                            <Text style={styles.workoutListStatValue}>{totalExercises}</Text>
                            <Text style={styles.workoutListStatLabel}>exercises</Text>
                          </View>
                        </View>
                        <View style={styles.workoutListDetails}>
                          <Text style={styles.workoutListDetailText}>
                            {totalSets} sets · {formatTimeAgo(workout.date)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Streak Calendar Modal */}
        <Modal
          visible={showStreakCalendarModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStreakCalendarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Workout Calendar</Text>
                <TouchableOpacity onPress={() => setShowStreakCalendarModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.streakSummaryCard}>
                <View style={styles.streakSummaryItem}>
                  <Text style={styles.streakSummaryValue}>{userStats?.currentStreak || 0}</Text>
                  <Text style={styles.streakSummaryLabel}>Current Streak</Text>
                </View>
                <View style={styles.streakSummaryDivider} />
                <View style={styles.streakSummaryItem}>
                  <Text style={styles.streakSummaryValue}>
                    {Math.max(userStats?.currentStreak || 0, 0)}
                  </Text>
                  <Text style={styles.streakSummaryLabel}>Best Streak</Text>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={styles.modalScrollView}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
              >
                <Text style={styles.calendarMonthTitle}>Last 90 Days</Text>
                <View style={styles.calendarGrid}>
                  {(() => {
                    const days = [];
                    const today = new Date();
                    for (let i = 89; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(today.getDate() - i);
                      const dateKey = date.toISOString().split('T')[0];

                      const hasWorkout = workoutHistory.some(w => {
                        if (!w || !w.date) return false;
                        try {
                          const workoutDate = new Date(w.date).toISOString().split('T')[0];
                          return workoutDate === dateKey;
                        } catch (e) {
                          return false;
                        }
                      });

                      const isToday = date.toDateString() === today.toDateString();

                      days.push(
                        <View key={i} style={styles.calendarDayWrapper}>
                          <View
                            style={[
                              styles.calendarDay,
                              hasWorkout && styles.calendarDayWithWorkout,
                              isToday && styles.calendarDayToday
                            ]}
                          >
                            {hasWorkout && !isToday && (
                              <Text style={styles.calendarDayCheckmark}>✓</Text>
                            )}
                          </View>
                          <Text style={styles.calendarDayLabel}>{date.getDate()}</Text>
                        </View>
                      );
                    }
                    return days;
                  })()}
                </View>

                <View style={styles.calendarLegend}>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendBox, styles.calendarDayWithWorkout]} />
                    <Text style={styles.calendarLegendText}>Workout</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendBox, styles.calendarDayToday]} />
                    <Text style={styles.calendarLegendText}>Today</Text>
                  </View>
                  <View style={styles.calendarLegendItem}>
                    <View style={[styles.calendarLegendBox, { backgroundColor: Colors.border }]} />
                    <Text style={styles.calendarLegendText}>Rest Day</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* PR Detail Modal */}
        <Modal
          visible={showPRDetailModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPRDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Personal Record</Text>
                <TouchableOpacity onPress={() => setShowPRDetailModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              {selectedPR && (
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  style={styles.modalScrollView}
                  contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.prDetailHero}
                  >
                    <Text style={styles.prDetailIcon}>🏆</Text>
                    <Text style={styles.prDetailExercise}>{selectedPR.exercise}</Text>
                    <Text style={styles.prDetailValue}>
                      {selectedPR.weight} lbs × {selectedPR.reps} reps
                    </Text>
                    <Text style={styles.prDetailDate}>
                      {selectedPR.date ? new Date(selectedPR.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Date unknown'}
                    </Text>
                  </LinearGradient>

                  <View style={styles.prDetailStats}>
                    <View style={styles.prDetailStatCard}>
                      <Text style={styles.prDetailStatLabel}>Weight</Text>
                      <Text style={styles.prDetailStatValue}>{selectedPR.weight} lbs</Text>
                    </View>
                    <View style={styles.prDetailStatCard}>
                      <Text style={styles.prDetailStatLabel}>Reps</Text>
                      <Text style={styles.prDetailStatValue}>{selectedPR.reps}</Text>
                    </View>
                    <View style={styles.prDetailStatCard}>
                      <Text style={styles.prDetailStatLabel}>Volume</Text>
                      <Text style={styles.prDetailStatValue}>
                        {(selectedPR.weight * selectedPR.reps).toFixed(0)} lbs
                      </Text>
                    </View>
                  </View>

                  {/* Find and display the workout this PR came from */}
                  {(() => {
                    const prWorkout = workoutHistory.find(w => {
                      if (!w || !w.date || !selectedPR?.date) return false;
                      try {
                        const workoutDate = new Date(w.date).toISOString().split('T')[0];
                        const prDate = new Date(selectedPR.date).toISOString().split('T')[0];
                        return workoutDate === prDate &&
                          w.exercises?.some(ex => ex.name === selectedPR.exercise);
                      } catch (e) {
                        return false;
                      }
                    });

                    if (prWorkout) {
                      const exercise = prWorkout.exercises.find(ex => ex.name === selectedPR.exercise);
                      return (
                        <View style={styles.prDetailWorkout}>
                          <Text style={styles.prDetailWorkoutTitle}>From Workout</Text>
                          <View style={styles.prDetailWorkoutCard}>
                            <Text style={styles.prDetailWorkoutName}>
                              {prWorkout.workoutTitle || 'Quick Workout'}
                            </Text>
                            <Text style={styles.prDetailWorkoutInfo}>
                              {prWorkout.exercises?.length || 0} exercises
                            </Text>
                            {exercise?.sets && (
                              <View style={styles.prDetailSets}>
                                <Text style={styles.prDetailSetsTitle}>All Sets:</Text>
                                {exercise.sets.map((set, idx) => (
                                  <View key={idx} style={styles.prDetailSetRow}>
                                    <Text style={styles.prDetailSetText}>
                                      Set {idx + 1}: {set.weight} lbs × {set.reps} reps
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Volume Detail Modal - Top 5 Highest Volume Workouts */}
        <Modal
          visible={showVolumeModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVolumeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Top Volume Workouts</Text>
                <TouchableOpacity onPress={() => setShowVolumeModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.volumeSummaryCard}>
                <Text style={styles.volumeSummaryValue}>
                  {Math.round(userStats?.totalVolume || 0).toLocaleString()} lbs
                </Text>
                <Text style={styles.volumeSummaryLabel}>Total Volume Lifted</Text>
                {calculateVolumeChange() !== 0 && (
                  <Text style={[
                    styles.volumeSummaryChange,
                    { color: calculateVolumeChange() > 0 ? Colors.success : Colors.error }
                  ]}>
                    {calculateVolumeChange() > 0 ? '↑' : '↓'} {Math.abs(calculateVolumeChange())}% vs last month
                  </Text>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={styles.modalScrollView}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
              >
                <Text style={styles.topWorkoutsTitle}>🏆 Top 5 Highest Volume Workouts</Text>
                {getTopVolumeWorkouts().map((workout, index) => {
                  const workoutDate = new Date(workout.date);
                  const isTopWorkout = index === 0;

                  return (
                    <TouchableOpacity
                      key={workout.id || index}
                      style={[styles.topVolumeItem, isTopWorkout && styles.topVolumeItemFirst]}
                      onPress={() => handleWorkoutClick(workout)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.topVolumeRank, isTopWorkout && styles.topVolumeRankFirst]}>
                        <Text style={[styles.topVolumeRankText, isTopWorkout && styles.topVolumeRankTextFirst]}>
                          #{index + 1}
                        </Text>
                      </View>

                      <View style={styles.topVolumeContent}>
                        <View style={styles.topVolumeHeader}>
                          <Text style={styles.topVolumeTitle}>
                            {workout.workoutTitle || 'Quick Workout'}
                          </Text>
                          {isTopWorkout && (
                            <Text style={styles.topVolumeBadge}>👑</Text>
                          )}
                        </View>

                        <Text style={styles.topVolumeVolume}>
                          {Math.round(workout.totalVolume).toLocaleString()} lbs
                        </Text>
                        <Text style={styles.topVolumeDetails}>
                          {workout.exerciseCount} exercises · {workout.setCount} sets · {formatTimeAgo(workout.date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {getTopVolumeWorkouts().length === 0 && (
                  <View style={styles.emptyVolumeState}>
                    <Text style={styles.emptyVolumeText}>
                      Complete more workouts to see your top volume records!
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Workout Detail Modal - Reusing WorkoutHistory Layout */}
        <Modal
          visible={showWorkoutDetailModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowWorkoutDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.workoutHistoryModalContent}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.workoutHistoryCloseButton}
                onPress={() => setShowWorkoutDetailModal(false)}
              >
                <Text style={styles.workoutHistoryCloseButtonText}>✕</Text>
              </TouchableOpacity>

              {/* Sticky Header */}
              {selectedWorkout && (
                <View style={styles.workoutHistoryHeader}>
                  <View style={styles.workoutHistoryHeaderText}>
                    <Text style={styles.workoutHistoryHeaderTitle} numberOfLines={1}>
                      {selectedWorkout.workoutTitle || 'Workout Details'}
                    </Text>
                    <Text style={styles.workoutHistoryHeaderDate}>
                      {selectedWorkout.date ? new Date(selectedWorkout.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Date unknown'}
                    </Text>
                  </View>
                </View>
              )}

              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.workoutHistoryScrollContent}
              >
                {selectedWorkout && (
                  <>
                    {/* Workout Photos */}
                    {selectedWorkout.photos && selectedWorkout.photos.length > 0 && (
                      <View style={styles.workoutHistoryPhotos}>
                        <Text style={styles.workoutHistoryNotesLabel}>📸 Workout Photos</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.workoutHistoryPhotosScroll}
                        >
                          {selectedWorkout.photos.map((photo, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                // You can add full-screen image viewer here if needed
                              }}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: `data:image/jpeg;base64,${photo}` }}
                                style={styles.workoutHistoryPhoto}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Notes */}
                    {selectedWorkout.notes && (
                      <View style={styles.workoutHistoryNotes}>
                        <Text style={styles.workoutHistoryNotesLabel}>📝 Notes</Text>
                        <Text style={styles.workoutHistoryNotesText}>{selectedWorkout.notes}</Text>
                      </View>
                    )}

                    {/* Workout Stats */}
                    <View style={styles.workoutHistoryStats}>
                      <View style={styles.workoutHistoryStatItem}>
                        <Text style={styles.workoutHistoryStatValue}>{selectedWorkout.duration || '00:00'}</Text>
                        <Text style={styles.workoutHistoryStatLabel}>Duration</Text>
                      </View>
                      <View style={styles.workoutHistoryStatItem}>
                        <Text style={styles.workoutHistoryStatValue}>{selectedWorkout.exercises?.length || 0}</Text>
                        <Text style={styles.workoutHistoryStatLabel}>Exercises</Text>
                      </View>
                      <View style={styles.workoutHistoryStatItem}>
                        <Text style={styles.workoutHistoryStatValue}>
                          {(selectedWorkout.exercises || []).reduce((total, ex) => {
                            return total + (ex.sets?.filter(s => s.completed !== false).length || 0);
                          }, 0)}
                        </Text>
                        <Text style={styles.workoutHistoryStatLabel}>Sets</Text>
                      </View>
                    </View>

                    {/* Exercises List */}
                    <Text style={styles.workoutHistoryExercisesTitle}>Exercises</Text>
                    {(selectedWorkout.exercises || []).map((exercise, index) => (
                      <View key={index} style={styles.workoutHistoryExerciseItem}>
                        <Text style={styles.workoutHistoryExerciseName}>{exercise.name}</Text>
                        {exercise.equipment && exercise.primaryMuscle && (
                          <Text style={styles.workoutHistoryExerciseMeta}>
                            {exercise.equipment} • {exercise.primaryMuscle}
                          </Text>
                        )}

                        {/* Sets */}
                        {exercise.sets && exercise.sets.length > 0 && (
                          <View style={styles.workoutHistorySetsContainer}>
                            {exercise.sets.map((set, setIndex) => {
                              if (set.completed === false) return null;

                              return (
                                <View key={setIndex} style={styles.workoutHistorySetRow}>
                                  <Text style={styles.workoutHistorySetText}>
                                    Set {setIndex + 1}: {set.weight}lbs × {set.reps} reps{set.rpe ? ` @ RPE ${set.rpe}` : ''}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Achievement Detail Modal */}
        <AchievementDetailModal
          visible={showAchievementDetailModal}
          onClose={() => setShowAchievementDetailModal(false)}
          achievement={selectedAchievement}
          breakdown={achievementBreakdown}
        />
      </View>
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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

  // Quick Stats Row
  quickStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  quickStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Motivational Banner
  motivationalBanner: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Top Exercises Section
  topExercisesSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  topExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  topExerciseRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topExerciseRankText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  topExerciseInfo: {
    flex: 1,
  },
  topExerciseName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  topExerciseBarBackground: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  topExerciseBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  topExerciseCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },

  // Recent Activity Summary
  recentActivitySection: {
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryCardIcon: {
    fontSize: 24,
  },
  summaryCardValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryCardLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  summaryCardSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Hero Section (deprecated, keeping for compatibility)
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakBadge: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  streakValue: {
    fontSize: 48,
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
    backgroundColor: Colors.card,
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
    backgroundColor: Colors.card,
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
  tapToViewText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: '600',
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
  // Monthly Calendar Styles
  monthlyCalendarSection: {
    marginBottom: Spacing.xl,
  },
  monthlyCalendarContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarDayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  calendarDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  calendarDayOutsideMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.secondary,
    backgroundColor: Colors.background,
  },
  calendarDayWithWorkout: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  calendarDayWithPR: {
    backgroundColor: '#FFD700', // Gold for PR days
    borderColor: '#FFA500',
    borderWidth: 2,
  },
  calendarDayNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  calendarDayNumberOutside: {
    color: Colors.textMuted,
  },
  calendarDayNumberToday: {
    color: Colors.secondary,
    fontWeight: 'bold',
  },
  calendarDayNumberWithWorkout: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayNumberWithPR: {
    color: '#000000',
    fontWeight: 'bold',
  },
  calendarDayPRIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 10,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  calendarLegendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Charts Tab - Quick Stats
  // Compact Controls Card
  compactControlsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  compactStatsScroll: {
    marginBottom: Spacing.md,
  },
  compactStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  compactStatIcon: {
    fontSize: 20,
  },
  compactStatValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  compactStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  controlsRow: {
    gap: Spacing.sm,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  controlLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
    minWidth: 45,
  },
  controlScroll: {
    flex: 1,
  },
  compactControlButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginRight: Spacing.xs,
    minWidth: 36,
    alignItems: 'center',
  },
  compactControlButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compactControlButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  compactControlButtonTextActive: {
    color: Colors.background,
  },
  compactControlButtonIcon: {
    fontSize: 16,
  },

  // Charts Tab (existing styles)
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  timeRangeCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  exerciseSearchCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.xs,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  filterToggleButtonActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  filterToggleIcon: {
    fontSize: 16,
  },
  filterToggleText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterToggleArrow: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  muscleFiltersContainer: {
    marginBottom: Spacing.sm,
  },
  muscleFilterButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  muscleFilterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  muscleFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  muscleFilterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  muscleFilterButtonTextActive: {
    color: Colors.background,
  },
  exerciseListContainer: {
    marginTop: Spacing.sm,
  },
  exerciseListLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  exerciseListScroll: {
    maxHeight: 300,
  },
  exerciseListScrollCompact: {
    maxHeight: 150,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  exerciseListItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  // Chart Card Styles
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  chartExerciseName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  progressSummary: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressSummaryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  progressSummaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  progressSummaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  // Control Section Styles
  controlSectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  timeRangeSection: {
    marginBottom: Spacing.md,
  },
  chartTypeSection: {
    marginBottom: Spacing.lg,
  },
  chartControlScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  chartControlButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  chartControlButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chartControlButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chartControlButtonTextActive: {
    color: '#FFFFFF',
  },
  // Chart Type Button Styles
  chartTypeButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  chartTypeButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chartTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chartTypeButtonIcon: {
    marginBottom: 2,
  },
  chartTypeButtonLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chartTypeButtonLabelActive: {
    color: '#BB86FC', // Bright purple for better contrast on transparent bg
  },
  // Exercise Selector Toggle Styles
  exerciseSelectorToggle: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseSelectorToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseSelectorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exerciseSelectorToggleTextContainer: {
    flex: 1,
  },
  exerciseSelectorToggleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  exerciseSelectorToggleSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  exerciseSelectorToggleArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  exerciseListItemSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  exerciseListItemContent: {
    flex: 1,
  },
  exerciseListItemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  exerciseListItemNameSelected: {
    color: Colors.background,
  },
  exerciseListItemCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  exerciseListItemCountSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  exerciseListItemCheck: {
    fontSize: 18,
    color: Colors.background,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  recordsCard: {
    backgroundColor: Colors.card,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  noDataTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  // Muscle Group Volume Styles
  muscleGroupCard: {
    backgroundColor: Colors.card,
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
  goalsSectionHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  // PR Goal Card (Active)
  prGoalCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prGoalCardComplete: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  prGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  prGoalInfo: {
    flex: 1,
  },
  prGoalExercise: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  prGoalTarget: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  prGoalDelete: {
    padding: Spacing.xs,
  },
  prGoalProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  prGoalCurrent: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  prGoalRemaining: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  prGoalCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  prGoalCompleteBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  prGoalProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  prGoalProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  prGoalPercentage: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  // Suggestion Card
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionExercise: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  suggestionDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  suggestionAction: {
    paddingLeft: Spacing.md,
  },
  // Empty State
  emptyGoalsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
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
  // Completed Goal Card
  completedGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  completedGoalInfo: {
    flex: 1,
  },
  completedGoalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
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
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
    height: '90%',
  },
  modalScrollView: {
    flex: 1,
    marginTop: Spacing.md,
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
  datePickerButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  datePickerButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  datePickerButtonIcon: {
    fontSize: 20,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  clearDateButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    textDecorationLine: 'underline',
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

  // Goal Templates Styles
  templatesSection: {
    marginBottom: Spacing.lg,
  },
  templatesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  templatesSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  templatesToggle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  templatesSectionHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  templateCategory: {
    marginBottom: Spacing.lg,
  },
  templateCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateCategoryIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  templateCategoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  templateCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCardContent: {
    flex: 1,
  },
  templateCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  templateCardDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  templateCardArrow: {
    fontSize: 20,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  customGoalButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  customGoalButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  backToTemplatesRow: {
    marginBottom: Spacing.md,
  },
  backToTemplatesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Achievements Tab Styles
  achievementSummary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementSummaryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  achievementSummaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  achievementSummaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  achievementFilterScroll: {
    marginBottom: Spacing.md,
  },
  achievementFilterContainer: {
    paddingHorizontal: Spacing.xs,
  },
  achievementFilterButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
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
    fontSize: 14,
  },
  achievementFilterText: {
    fontSize: Typography.fontSize.xs,
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
  achievementsGridCentered: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  achievementCardWrapper: {
    width: '48%',
  },
  achievementCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
  },
  achievementCardLocked: {
    borderColor: Colors.border,
    opacity: 0.7,
  },
  achievementCardIcon: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  achievementCardIconLocked: {
    opacity: 0.5,
  },
  achievementCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  achievementCardTitleLocked: {
    color: Colors.textSecondary,
  },
  achievementCardDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  achievementCardDescriptionLocked: {
    color: Colors.textMuted,
  },
  achievementBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  achievementBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  achievementProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  achievementProgressBarFill: {
    height: '100%',
  },
  achievementProgressText: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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
    backgroundColor: Colors.card,
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

  // Workout List Modal Styles
  workoutSummaryCard: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  workoutSummaryTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutSummarySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  workoutListItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  workoutListTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutListDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  workoutListStats: {
    alignItems: 'center',
  },
  workoutListStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  workoutListStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  workoutListDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  workoutListDetailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Streak Calendar Modal Styles
  streakSummaryCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakSummaryValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  streakSummaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  streakSummaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  calendarMonthTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  calendarDayWrapper: {
    alignItems: 'center',
    width: '10%',
    marginBottom: Spacing.sm,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayWithWorkout: {
    backgroundColor: Colors.primary,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  calendarDayCheckmark: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  calendarLegendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  calendarLegendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // PR Detail Modal Styles
  prDetailHero: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  prDetailIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  prDetailExercise: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  prDetailValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  prDetailDate: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  prDetailStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  prDetailStatCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prDetailStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  prDetailStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  prDetailWorkout: {
    marginTop: Spacing.md,
  },
  prDetailWorkoutTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  prDetailWorkoutCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prDetailWorkoutName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  prDetailWorkoutInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  prDetailSets: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  prDetailSetsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  prDetailSetRow: {
    paddingVertical: Spacing.xs,
  },
  prDetailSetText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Volume Modal Styles
  tapToViewHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  volumeSummaryCard: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  volumeSummaryValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  volumeSummaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  volumeSummaryChange: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  topWorkoutsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  topVolumeItem: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  topVolumeItemFirst: {
    borderWidth: 1,
    borderColor: Colors.text,
    backgroundColor: Colors.text + '08',
  },
  topVolumeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.textMuted + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topVolumeRankFirst: {
    backgroundColor: Colors.text + '15',
  },
  topVolumeRankText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  topVolumeRankTextFirst: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  topVolumeContent: {
    flex: 1,
  },
  topVolumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  topVolumeTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  topVolumeBadge: {
    fontSize: Typography.fontSize.md,
  },
  topVolumeStats: {
    marginBottom: Spacing.xs,
  },
  topVolumeVolume: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  topVolumeDetails: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  topVolumeDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  emptyVolumeState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyVolumeText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Workout History Modal Styles (reused from WorkoutHistoryScreen)
  workoutHistoryModalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    position: 'relative',
    maxHeight: '85%',
    width: '100%',
  },
  workoutHistoryCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  workoutHistoryCloseButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  workoutHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    paddingRight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  workoutHistoryHeaderText: {
    flex: 1,
  },
  workoutHistoryHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  workoutHistoryHeaderDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  workoutHistoryScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  workoutHistoryPhotos: {
    marginBottom: Spacing.md,
  },
  workoutHistoryPhotosScroll: {
    marginTop: Spacing.sm,
  },
  workoutHistoryPhoto: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.border,
  },
  workoutHistoryNotes: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  workoutHistoryNotesLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  workoutHistoryNotesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  workoutHistoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  workoutHistoryStatItem: {
    alignItems: 'center',
  },
  workoutHistoryStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  workoutHistoryStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  workoutHistoryExercisesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  workoutHistoryExerciseItem: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  workoutHistoryExerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutHistoryExerciseMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  workoutHistorySetsContainer: {
    marginTop: Spacing.xs,
  },
  workoutHistorySetRow: {
    marginBottom: Spacing.xs,
  },
  workoutHistorySetText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  clearDataButton: {
    backgroundColor: '#DC2626',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: '#991B1B',
  },
  clearDataButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

