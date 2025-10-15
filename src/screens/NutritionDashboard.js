import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import NutritionAchievementDetailModal from '../components/NutritionAchievementDetailModal';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
  getDailySummary,
  removeFromDaily,
  getWeeklySummary,
  initDatabase,
} from '../services/foodDatabaseService';
import { getNutritionGoals, updateNutritionGoals } from '../services/userProfileService';
import { useAITracking } from '../components/AIScreenTracker';

const MEAL_PLANS_KEY = '@meal_plans';

export default function NutritionDashboard({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'charts', 'goals', 'insights'
  const [dailySummary, setDailySummary] = useState(null);

  // Track this screen for AI context
  useAITracking('NutritionDashboard', {
    caloriesConsumed: dailySummary?.calories || 0,
    calorieGoal,
    proteConsumed: dailySummary?.protein || 0,
    mealsToday: dailySummary?.meals?.length || 0,
  });
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calorieGoal, setCalorieGoal] = useState(2000); // TODO: Make this configurable
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [selectedDayModal, setSelectedDayModal] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [modalType, setModalType] = useState('calories'); // 'calories' or 'macros'

  // Charts tab state
  const [timeRange, setTimeRange] = useState('7d'); // '7d', '30d', '3m', 'all'
  const [multiDayData, setMultiDayData] = useState([]);
  const [weeklyComparison, setWeeklyComparison] = useState(null);

  // Goals tab state
  const [goalsData, setGoalsData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    weeklyConsistency: 0,
    monthlyConsistency: 0,
    daysAtGoal: 0,
    totalDays: 0,
    // Cumulative stats
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalDeficit: 0,
    totalSurplus: 0,
    proteinGoalDays: 0,
    carbGoalDays: 0,
    fatGoalDays: 0,
    perfectMacroDays: 0,
  });

  // Streak calendar state
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [streakDays, setStreakDays] = useState([]);
  const [streakType, setStreakType] = useState('current'); // 'current' or 'longest'

  // Achievement detail modal state
  const [showAchievementDetailModal, setShowAchievementDetailModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [achievementBreakdown, setAchievementBreakdown] = useState(null);

  // Insights tab state
  const [insightsData, setInsightsData] = useState({
    weeklyAvg: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    monthlyAvg: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    bestDay: null,
    worstDay: null,
    macroBalance: { protein: 0, carbs: 0, fat: 0 },
    topFoods: [],
    insights: [],
  });

  // Load user's nutrition goals
  const loadNutritionGoals = async () => {
    try {
      const userId = user?.uid || 'guest';
      const goals = await getNutritionGoals(userId);
      setCalorieGoal(goals.calories);
    } catch (error) {
      console.error('Error loading nutrition goals:', error);
    }
  };

  // Initialize database and load data when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadNutritionGoals();
      initDatabase().then(() => {
        loadDailySummary();
        loadWeeklySummary();
        if (activeTab === 'charts') {
          loadMultiDayData(timeRange);
        }
      });
    }, [selectedDate, activeTab, timeRange, user])
  );

  // Load chart data when Charts tab is activated or time range changes
  useEffect(() => {
    if (activeTab === 'charts') {
      loadMultiDayData(timeRange);
    } else if (activeTab === 'goals') {
      calculateGoalsData();
    } else if (activeTab === 'insights') {
      calculateInsightsData();
    }
  }, [activeTab, timeRange]);

  const loadDailySummary = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Load from meal history
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (!savedPlans) {
        setDailySummary({ totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, items: [] });
        return;
      }

      const mealPlans = JSON.parse(savedPlans);
      const dayData = mealPlans[dateStr];

      if (!dayData || !dayData.logged) {
        setDailySummary({ totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, items: [] });
        return;
      }

      // Convert logged meals to items format
      const items = [];
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meals = dayData.logged[mealType] || [];
        meals.forEach((meal, index) => {
          items.push({
            id: `${mealType}_${index}`,
            meal_type: mealType === 'snacks' ? 'snack' : mealType,
            food_name: meal.name,
            quantity_grams: 100, // Default, might not be accurate
            calories_consumed: meal.calories || 0,
          });
        });
      });

      // Calculate totals
      const dayTotals = await getMealHistoryData(dateStr);

      setDailySummary({
        totals: {
          calories: dayTotals.calories,
          protein: dayTotals.protein,
          carbs: dayTotals.carbs,
          fat: dayTotals.fat,
        },
        items: items,
      });
    } catch (error) {
      setDailySummary({ totals: { calories: 0, protein: 0, carbs: 0, fat: 0 }, items: [] });
    }
  };

  const loadWeeklySummary = async () => {
    try {
      // Load last 7 days from meal history
      const endDate = new Date();
      const weekly = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayData = await getMealHistoryData(dateStr);
        weekly.push({
          date: dateStr,
          total_calories: dayData.calories,
        });
      }

      setWeeklySummary(weekly);
    } catch (error) {
      
    }
  };

  // Helper function to get meal history data from AsyncStorage
  const getMealHistoryData = async (dateStr) => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (!savedPlans) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      const mealPlans = JSON.parse(savedPlans);
      const dayData = mealPlans[dateStr];

      if (!dayData || !dayData.logged) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Calculate totals from logged meals
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meals = dayData.logged[mealType] || [];
        meals.forEach(meal => {
          totalCalories += meal.calories || 0;
          totalProtein += meal.protein || 0;
          totalCarbs += meal.carbs || 0;
          totalFat += meal.fat || 0;
        });
      });

      return {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      };
    } catch (error) {
      
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const getAllMealHistory = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (!savedPlans) {
        return [];
      }

      const mealPlans = JSON.parse(savedPlans);
      const allDays = [];

      // Iterate through all dates in meal plans
      Object.keys(mealPlans).forEach(dateStr => {
        const dayData = mealPlans[dateStr];

        if (dayData && dayData.logged) {
          // Calculate totals for this day
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
            const meals = dayData.logged[mealType] || [];
            meals.forEach(meal => {
              totalCalories += meal.calories || 0;
              totalProtein += meal.protein || 0;
              totalCarbs += meal.carbs || 0;
              totalFat += meal.fat || 0;
            });
          });

          if (totalCalories > 0) {
            allDays.push({
              date: dateStr,
              calories: totalCalories,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
            });
          }
        }
      });

      // Sort by date (oldest first)
      allDays.sort((a, b) => new Date(a.date) - new Date(b.date));

      return allDays;
    } catch (error) {
      
      return [];
    }
  };

  const loadMultiDayData = async (range) => {
    try {
      let days = 7;
      switch (range) {
        case '7d':
          days = 7;
          break;
        case '30d':
          days = 30;
          break;
        case '3m':
          days = 90;
          break;
        case 'all':
          days = 365; // Last year of data
          break;
      }

      const endDate = new Date();
      const data = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Use meal history data from AsyncStorage instead of foodDatabaseService
        const dayData = await getMealHistoryData(dateStr);
        data.push({
          date: dateStr,
          displayDate: date,
          calories: dayData.calories,
          protein: dayData.protein,
          carbs: dayData.carbs,
          fat: dayData.fat,
        });
      }

      setMultiDayData(data);
      calculateWeeklyComparison(data);
    } catch (error) {
      
    }
  };

  const calculateWeeklyComparison = (data) => {
    if (data.length < 14) return;

    // Last 7 days
    const currentWeek = data.slice(-7);
    // Previous 7 days
    const previousWeek = data.slice(-14, -7);

    const calcAverage = (week) => ({
      avgCalories: Math.round(week.reduce((sum, d) => sum + d.calories, 0) / 7),
      avgProtein: Math.round(week.reduce((sum, d) => sum + d.protein, 0) / 7),
      avgCarbs: Math.round(week.reduce((sum, d) => sum + d.carbs, 0) / 7),
      avgFat: Math.round(week.reduce((sum, d) => sum + d.fat, 0) / 7),
    });

    const current = calcAverage(currentWeek);
    const previous = calcAverage(previousWeek);

    setWeeklyComparison({
      current,
      previous,
      caloriesDiff: current.avgCalories - previous.avgCalories,
      proteinDiff: current.avgProtein - previous.avgProtein,
      carbsDiff: current.avgCarbs - previous.avgCarbs,
      fatDiff: current.avgFat - previous.avgFat,
    });
  };

  const calculateGoalsData = async () => {
    try {
      // Load last 90 days of data for comprehensive analysis
      const endDate = new Date();
      const data = [];

      for (let i = 89; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Use meal history data from AsyncStorage
        const dayData = await getMealHistoryData(dateStr);
        data.push({
          date: dateStr,
          calories: dayData.calories,
          protein: dayData.protein,
          carbs: dayData.carbs,
          fat: dayData.fat,
        });
      }

      // Debug: Log days with data
      const daysWithCalories = data.filter(d => d.calories > 0);

      // Define "at goal" as within 10% of calorie goal
      const isAtGoal = (calories) => {
        const lowerBound = calorieGoal * 0.9;
        const upperBound = calorieGoal * 1.1;
        return calories >= lowerBound && calories <= upperBound;
      };

      // Calculate tracking streaks (any day with logged data)
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Start from most recent and count backwards for current streak
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].calories > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      for (let i = 0; i < data.length; i++) {
        if (data[i].calories > 0) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

                  // Calculate consistency metrics
      const last7Days = data.slice(-7);
      const last30Days = data.slice(-30);

      const daysAtGoal7 = last7Days.filter(d => d.calories > 0 && isAtGoal(d.calories)).length;
      const daysWithData7 = last7Days.filter(d => d.calories > 0).length;
      const weeklyConsistency = daysWithData7 > 0 ? Math.round((daysAtGoal7 / daysWithData7) * 100) : 0;

      const daysAtGoal30 = last30Days.filter(d => d.calories > 0 && isAtGoal(d.calories)).length;
      const daysWithData30 = last30Days.filter(d => d.calories > 0).length;
      const monthlyConsistency = daysWithData30 > 0 ? Math.round((daysAtGoal30 / daysWithData30) * 100) : 0;

      const totalDaysAtGoal = data.filter(d => d.calories > 0 && isAtGoal(d.calories)).length;
      const totalDaysWithData = data.filter(d => d.calories > 0).length;

      // Calculate cumulative stats
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalDeficit = 0;
      let totalSurplus = 0;

      data.forEach(d => {
        if (d.calories > 0) {
          totalCalories += d.calories;
          totalProtein += d.protein || 0;
          totalCarbs += d.carbs || 0;
          totalFat += d.fat || 0;

          // Calculate deficit/surplus
          const diff = d.calories - calorieGoal;
          if (diff < 0) {
            totalDeficit += Math.abs(diff);
          } else {
            totalSurplus += diff;
          }
        }
      });

      // Calculate macro goal achievements
      // Assuming protein goal is 0.8-1g per lb bodyweight, let's use 150g as default
      // Carbs: 40-60% of calories, Fat: 20-30% of calories
      const proteinGoal = 150; // This should come from user profile eventually
      const proteinGoalDays = data.filter(d => d.protein >= proteinGoal * 0.9).length;

      const carbGoalMin = (calorieGoal * 0.4) / 4; // 40% of calories / 4 cal per gram
      const carbGoalMax = (calorieGoal * 0.6) / 4; // 60% of calories / 4 cal per gram
      const carbGoalDays = data.filter(d => d.carbs >= carbGoalMin && d.carbs <= carbGoalMax).length;

      const fatGoalMin = (calorieGoal * 0.2) / 9; // 20% of calories / 9 cal per gram
      const fatGoalMax = (calorieGoal * 0.3) / 9; // 30% of calories / 9 cal per gram
      const fatGoalDays = data.filter(d => d.fat >= fatGoalMin && d.fat <= fatGoalMax).length;

      // Perfect macro days = hit all macros on target
      const perfectMacroDays = data.filter(d => {
        const hitProtein = d.protein >= proteinGoal * 0.9;
        const hitCarbs = d.carbs >= carbGoalMin && d.carbs <= carbGoalMax;
        const hitFat = d.fat >= fatGoalMin && d.fat <= fatGoalMax;
        return hitProtein && hitCarbs && hitFat;
      }).length;

      const calculatedGoalsData = {
        currentStreak,
        longestStreak,
        weeklyConsistency,
        monthlyConsistency,
        daysAtGoal: totalDaysAtGoal,
        totalDays: totalDaysWithData,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        totalDeficit: Math.round(totalDeficit),
        totalSurplus: Math.round(totalSurplus),
        proteinGoalDays,
        carbGoalDays,
        fatGoalDays,
        perfectMacroDays,
      };

            setGoalsData(calculatedGoalsData);
    } catch (error) {
      
    }
  };

  const loadStreakCalendarData = async () => {
    try {
      // Load last 90 days of data to show all recent streaks
      const endDate = new Date();
      const days = [];

      for (let i = 89; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayData = await getMealHistoryData(dateStr);
        if (dayData.calories > 0) {
          days.push({
            date: dateStr,
            dateObj: new Date(date),
            calories: dayData.calories,
            protein: dayData.protein,
            carbs: dayData.carbs,
            fat: dayData.fat,
          });
        }
      }

      setStreakDays(days);
          } catch (error) {
      
    }
  };

  // Achievement breakdown logic
  const getAchievementBreakdown = async (achievement) => {
    try {
      // Determine achievement type based on title/description
      const title = achievement.title.toLowerCase();
      const desc = achievement.desc.toLowerCase();

      // Streak achievements
      if (desc.includes('streak') && !desc.includes('tracked')) {
        const recentDays = [];
        const today = new Date();

        // Get last 30 days for display
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayData = await getMealHistoryData(dateStr);

          if (dayData.calories > 0) {
            recentDays.push({
              date: dateStr,
              calories: dayData.calories,
              protein: dayData.protein,
            });
          }
        }

        return {
          type: 'streak',
          current: goalsData.longestStreak,
          required: parseInt(desc.match(/\d+/)?.[0]) || 0,
          unlocked: achievement.unlocked,
          recentDays: recentDays.reverse(),
        };
      }

      // Days tracked achievements
      if (desc.includes('days tracked')) {
        const allDays = await getAllMealHistory();
        const recentDays = allDays.slice(-10).reverse();

        return {
          type: 'days_tracked',
          current: goalsData.totalDays,
          required: parseInt(desc.match(/\d+/)?.[0]) || 0,
          unlocked: achievement.unlocked,
          recentDays: recentDays.map(d => ({
            date: d.date,
            calories: d.calories,
            protein: d.protein,
          })),
        };
      }

      // Goal days achievements
      if (desc.includes('goal days')) {
        const allDays = await getAllMealHistory();
        const goalDays = allDays.filter(d =>
          Math.abs(d.calories - calorieGoal) <= calorieGoal * 0.1
        );

        return {
          type: 'goal_days',
          current: goalsData.daysAtGoal,
          required: parseInt(desc.match(/\d+/)?.[0]) || 0,
          unlocked: achievement.unlocked,
          recentDays: goalDays.slice(-10).reverse().map(d => ({
            date: d.date,
            calories: d.calories,
            goal: calorieGoal,
          })),
        };
      }

      // Consistency achievements
      if (desc.includes('weekly') || desc.includes('monthly')) {
        const isWeekly = desc.includes('weekly');
        const current = isWeekly ? goalsData.weeklyConsistency : goalsData.monthlyConsistency;
        const required = parseInt(desc.match(/\d+/)?.[0]) || 0;

        return {
          type: 'consistency',
          current: Math.round(current),
          required,
          unlocked: achievement.unlocked,
          daysLogged: goalsData.totalDays,
          totalDays: isWeekly ? 7 : 30,
        };
      }

      // Calorie total achievements
      if (desc.includes('calories') && (desc.includes('k') || desc.includes('m'))) {
        const allDays = await getAllMealHistory();
        const avgPerDay = allDays.length > 0 ? goalsData.totalCalories / allDays.length : 0;

        return {
          type: 'calories',
          current: Math.round(goalsData.totalCalories),
          required: parseInt(desc.match(/\d+/)?.[0]) * (desc.includes('m') ? 1000000 : 1000) || 0,
          unlocked: achievement.unlocked,
          totalDays: allDays.length,
          avgPerDay,
        };
      }

      // Protein total achievements
      if (desc.includes('protein') && (desc.includes('g') || desc.includes('kg'))) {
        const allDays = await getAllMealHistory();
        const avgPerDay = allDays.length > 0 ? goalsData.totalProtein / allDays.length : 0;

        return {
          type: 'protein',
          current: Math.round(goalsData.totalProtein),
          required: parseInt(desc.match(/\d+/)?.[0]) * (desc.includes('kg') ? 1000 : 1) || 0,
          unlocked: achievement.unlocked,
          totalDays: allDays.length,
          avgPerDay,
        };
      }

      // Protein goal days achievements
      if (desc.includes('protein') && desc.includes('days')) {
        const allDays = await getAllMealHistory();
        const proteinGoal = 150; // TODO: Make configurable
        const proteinGoalDays = allDays.filter(d => d.protein >= proteinGoal);

        return {
          type: 'protein_goal_days',
          current: goalsData.proteinGoalDays,
          required: parseInt(desc.match(/\d+/)?.[0]) || 0,
          unlocked: achievement.unlocked,
          recentDays: proteinGoalDays.slice(-10).reverse().map(d => ({
            date: d.date,
            protein: d.protein,
            goal: proteinGoal,
          })),
        };
      }

      // Deficit achievements
      if (desc.includes('deficit')) {
        const allDays = await getAllMealHistory();
        const deficitDays = allDays.filter(d => d.calories < calorieGoal);
        const avgPerDay = deficitDays.length > 0 ? goalsData.totalDeficit / deficitDays.length : 0;

        return {
          type: 'deficit',
          current: Math.round(goalsData.totalDeficit),
          required: parseInt(desc.match(/\d+/)?.[0]) * 1000 || 0,
          unlocked: achievement.unlocked,
          daysCount: deficitDays.length,
          avgPerDay,
        };
      }

      // Surplus achievements
      if (desc.includes('surplus')) {
        const allDays = await getAllMealHistory();
        const surplusDays = allDays.filter(d => d.calories > calorieGoal);
        const avgPerDay = surplusDays.length > 0 ? goalsData.totalSurplus / surplusDays.length : 0;

        return {
          type: 'surplus',
          current: Math.round(goalsData.totalSurplus),
          required: parseInt(desc.match(/\d+/)?.[0]) * 1000 || 0,
          unlocked: achievement.unlocked,
          daysCount: surplusDays.length,
          avgPerDay,
        };
      }

      // Macro/perfect day achievements
      if (desc.includes('perfect') || desc.includes('macro')) {
        const allDays = await getAllMealHistory();
        const perfectDays = allDays.filter(d => {
          // Consider perfect if all macros within 10% of goals
          const proteinGoal = 150;
          const carbGoal = 200;
          const fatGoal = 65;
          return (
            Math.abs(d.protein - proteinGoal) <= proteinGoal * 0.1 &&
            Math.abs(d.carbs - carbGoal) <= carbGoal * 0.1 &&
            Math.abs(d.fat - fatGoal) <= fatGoal * 0.1
          );
        });

        return {
          type: 'macros',
          current: goalsData.perfectMacroDays,
          required: parseInt(desc.match(/\d+/)?.[0]) || 1,
          unlocked: achievement.unlocked,
          recentDays: perfectDays.slice(-10).reverse().map(d => ({
            date: d.date,
            protein: d.protein,
            carbs: d.carbs,
            fat: d.fat,
          })),
        };
      }

      // Default fallback
      return {
        type: 'general',
        current: 0,
        required: 1,
        unlocked: achievement.unlocked,
      };
    } catch (error) {
      
      return null;
    }
  };

  const handleAchievementPress = async (achievement) => {
    setSelectedAchievement(achievement);
    const breakdown = await getAchievementBreakdown(achievement);
    setAchievementBreakdown(breakdown);
    setShowAchievementDetailModal(true);
  };

  const calculateInsightsData = async () => {
    try {
      // Load last 30 days for insights
      const endDate = new Date();
      const data = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Use meal history data from AsyncStorage
        const dayData = await getMealHistoryData(dateStr);
        data.push({
          date: dateStr,
          displayDate: date,
          calories: dayData.calories,
          protein: dayData.protein,
          carbs: dayData.carbs,
          fat: dayData.fat,
        });
      }

      // Filter out days with no data
      const daysWithData = data.filter(d => d.calories > 0);

      if (daysWithData.length === 0) {
        setInsightsData({
          weeklyAvg: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          monthlyAvg: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          bestDay: null,
          worstDay: null,
          macroBalance: { protein: 0, carbs: 0, fat: 0 },
          topFoods: [],
          insights: [],
        });
        return;
      }

      // Calculate weekly average (last 7 days with data)
      const last7Days = daysWithData.slice(-7);
      const weeklyAvg = {
        calories: Math.round(last7Days.reduce((sum, d) => sum + d.calories, 0) / last7Days.length),
        protein: Math.round(last7Days.reduce((sum, d) => sum + d.protein, 0) / last7Days.length),
        carbs: Math.round(last7Days.reduce((sum, d) => sum + d.carbs, 0) / last7Days.length),
        fat: Math.round(last7Days.reduce((sum, d) => sum + d.fat, 0) / last7Days.length),
      };

      // Calculate monthly average (all days with data)
      const monthlyAvg = {
        calories: Math.round(daysWithData.reduce((sum, d) => sum + d.calories, 0) / daysWithData.length),
        protein: Math.round(daysWithData.reduce((sum, d) => sum + d.protein, 0) / daysWithData.length),
        carbs: Math.round(daysWithData.reduce((sum, d) => sum + d.carbs, 0) / daysWithData.length),
        fat: Math.round(daysWithData.reduce((sum, d) => sum + d.fat, 0) / daysWithData.length),
      };

      // Find best day (closest to goal)
      const bestDay = daysWithData.reduce((best, day) => {
        const dayDiff = Math.abs(day.calories - calorieGoal);
        const bestDiff = Math.abs(best.calories - calorieGoal);
        return dayDiff < bestDiff ? day : best;
      });

      // Find worst day (furthest from goal, but only if calories > 0)
      const worstDay = daysWithData.reduce((worst, day) => {
        const dayDiff = Math.abs(day.calories - calorieGoal);
        const worstDiff = Math.abs(worst.calories - calorieGoal);
        return dayDiff > worstDiff ? day : worst;
      });

      // Calculate macro balance (percentage of calories from each macro)
      const totalProtein = daysWithData.reduce((sum, d) => sum + d.protein, 0);
      const totalCarbs = daysWithData.reduce((sum, d) => sum + d.carbs, 0);
      const totalFat = daysWithData.reduce((sum, d) => sum + d.fat, 0);
      const proteinCals = totalProtein * 4;
      const carbsCals = totalCarbs * 4;
      const fatCals = totalFat * 9;
      const totalMacroCals = proteinCals + carbsCals + fatCals;

      const macroBalance = {
        protein: totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0,
        carbs: totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0,
        fat: totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0,
      };

      // Generate insights
      const insights = [];

      // Calorie insights
      const avgDiff = weeklyAvg.calories - calorieGoal;
      if (Math.abs(avgDiff) < calorieGoal * 0.05) {
        insights.push({
          icon: '🎯',
          title: 'On Track',
          description: `You're averaging ${weeklyAvg.calories} calories, right on target!`,
          type: 'success',
        });
      } else if (avgDiff < 0) {
        insights.push({
          icon: '⚠️',
          title: 'Below Goal',
          description: `You're ${Math.abs(avgDiff)} calories below your daily goal on average.`,
          type: 'warning',
        });
      } else {
        insights.push({
          icon: '📈',
          title: 'Above Goal',
          description: `You're ${avgDiff} calories above your daily goal on average.`,
          type: 'info',
        });
      }

      // Macro balance insights
      if (macroBalance.protein < 15) {
        insights.push({
          icon: '🥩',
          title: 'Low Protein',
          description: `Only ${macroBalance.protein}% of your calories come from protein. Aim for 15-35%.`,
          type: 'warning',
        });
      } else if (macroBalance.protein >= 15 && macroBalance.protein <= 35) {
        insights.push({
          icon: '✅',
          title: 'Balanced Protein',
          description: `${macroBalance.protein}% of calories from protein is in the healthy range!`,
          type: 'success',
        });
      }

      if (macroBalance.carbs > 65) {
        insights.push({
          icon: '🍞',
          title: 'High Carbs',
          description: `${macroBalance.carbs}% of calories from carbs. Consider balancing with more protein/fat.`,
          type: 'info',
        });
      }

      // Consistency insight
      if (daysWithData.length >= 20) {
        insights.push({
          icon: '🔥',
          title: 'Great Tracking',
          description: `You've logged ${daysWithData.length} out of the last 30 days. Keep it up!`,
          type: 'success',
        });
      } else if (daysWithData.length < 10) {
        insights.push({
          icon: '📝',
          title: 'Track More Often',
          description: `Only ${daysWithData.length} days logged this month. Consistency helps reach your goals!`,
          type: 'warning',
        });
      }

      setInsightsData({
        weeklyAvg,
        monthlyAvg,
        bestDay,
        worstDay,
        macroBalance,
        topFoods: [], // TODO: Implement top foods
        insights,
      });
    } catch (error) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailySummary();
    await loadWeeklySummary();
    setRefreshing(false);
  };

  const handleDeleteItem = (itemId, itemName) => {
    Alert.alert(
      'Remove Food',
      `Remove ${itemName} from your diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.uid || 'guest';
              await removeFromDaily(itemId, userId);
              loadDailySummary();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove food');
            }
          },
        },
      ]
    );
  };

  const navigateToAddFood = () => {
    navigation.navigate('FoodSearch');
  };

  const navigateToScanFood = () => {
    navigation.navigate('Camera');
  };

  const getMealItems = (mealType) => {
    if (!dailySummary?.items) return [];
    return dailySummary.items.filter(item => item.meal_type === mealType);
  };

  const getMealCalories = (mealType) => {
    const items = getMealItems(mealType);
    return Math.round(items.reduce((sum, item) => sum + item.calories_consumed, 0));
  };

  const getProgressColor = (consumed, goal) => {
    const percentage = (consumed / goal) * 100;
    if (percentage < 80) return Colors.warning;
    if (percentage <= 110) return Colors.success;
    return Colors.error;
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const handleDayClick = async (dateStr, type = 'calories') => {
    try {
      // Load detailed data for the selected day
      const dayData = await getMealHistoryData(dateStr);

      // Load meal items for that day
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      let mealItems = { breakfast: [], lunch: [], dinner: [], snacks: [] };

      if (savedPlans) {
        const mealPlans = JSON.parse(savedPlans);
        const dayPlan = mealPlans[dateStr];

        if (dayPlan && dayPlan.logged) {
          mealItems = {
            breakfast: dayPlan.logged.breakfast || [],
            lunch: dayPlan.logged.lunch || [],
            dinner: dayPlan.logged.dinner || [],
            snacks: dayPlan.logged.snacks || [],
          };
        }
      }

      setSelectedDayData({
        date: dateStr,
        calories: dayData.calories,
        protein: dayData.protein,
        carbs: dayData.carbs,
        fat: dayData.fat,
        meals: mealItems,
      });
      setModalType(type);
      setSelectedDayModal(true);
    } catch (error) {
      
    }
  };

  const renderMealSection = (mealType, mealName, mealIcon) => {
    const items = getMealItems(mealType);
    const calories = getMealCalories(mealType);
    const isExpanded = expandedMeal === mealType;

    return (
      <StyledCard style={styles.mealCard} key={mealType}>
        <TouchableOpacity
          onPress={() => setExpandedMeal(isExpanded ? null : mealType)}
          style={styles.mealHeader}
        >
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealIcon}>{mealIcon}</Text>
            <Text style={styles.mealName}>{mealName}</Text>
            <Text style={styles.mealCalories}>{calories} cal</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.mealItems}>
            {items.length === 0 ? (
              <Text style={styles.noItemsText}>No items logged</Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.foodItem}>
                  <View style={styles.foodItemInfo}>
                    <Text style={styles.foodItemName} numberOfLines={1}>
                      {item.food_name}
                    </Text>
                    <Text style={styles.foodItemDetails}>
                      {item.quantity_grams}g • {Math.round(item.calories_consumed)} cal
                    </Text>
                  </View>
                  {isToday() && (
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id, item.food_name)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
            {isToday() && (
              <TouchableOpacity onPress={navigateToAddFood} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Food</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </StyledCard>
    );
  };

  const totalCalories = dailySummary?.totals?.calories || 0;
  const remainingCalories = calorieGoal - totalCalories;
  const progressPercentage = Math.min((totalCalories / calorieGoal) * 100, 100);

  // Streak Calendar Rendering Function
  const renderStreakCalendar = () => {
    if (streakDays.length === 0) {
      return (
        <View style={styles.calendarEmptyState}>
          <Text style={styles.calendarEmptyText}>No nutrition data logged yet</Text>
          <Text style={styles.calendarEmptySubtext}>Start tracking your meals to see your streak!</Text>
        </View>
      );
    }

    // Get the date range (last 90 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89);

    // Create a set of dates with data for quick lookup
    const datesWithData = new Set(streakDays.map(d => d.date));
    const sortedDates = Array.from(datesWithData).sort();

    // Calculate which dates to highlight based on streak type
    let streakDates = new Set();

    if (streakType === 'current') {
      // Find current streak - count backwards from today
      const todayStr = today.toISOString().split('T')[0];
      let currentDate = new Date(today);

      // Only proceed if today has data
      if (datesWithData.has(todayStr)) {
        streakDates.add(todayStr);

        // Count backwards
        for (let i = 1; i < 365; i++) {
          currentDate.setDate(currentDate.getDate() - 1);
          const dateStr = currentDate.toISOString().split('T')[0];

          if (datesWithData.has(dateStr)) {
            streakDates.add(dateStr);
          } else {
            break; // Streak is broken
          }
        }
      }
      // If no current streak (today has no data or streak is 0), streakDates stays empty

    } else if (streakType === 'longest') {
      // Find the longest consecutive streak
      let longestStreakDates = [];
      let currentStreakDates = [];

      for (let i = 0; i < sortedDates.length; i++) {
        const dateStr = sortedDates[i];

        if (currentStreakDates.length === 0) {
          // Start a new streak
          currentStreakDates = [dateStr];
        } else {
          // Check if this date is consecutive to the last date
          const lastDateStr = currentStreakDates[currentStreakDates.length - 1];
          const lastDate = new Date(lastDateStr + 'T00:00:00');
          const currentDate = new Date(dateStr + 'T00:00:00');
          const dayDiff = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

                    if (dayDiff === 1) {
            // Consecutive day - add to current streak
            currentStreakDates.push(dateStr);
          } else {
            // Streak broken - check if this was the longest (>= to prefer most recent when equal)
                        if (currentStreakDates.length >= longestStreakDates.length) {
              longestStreakDates = [...currentStreakDates];
            }
            // Start new streak
            currentStreakDates = [dateStr];
          }
        }
      }

      // Check the last streak (>= to prefer most recent when equal)
            if (currentStreakDates.length >= longestStreakDates.length) {
        longestStreakDates = [...currentStreakDates];
      }

      // Set the longest streak dates
      streakDates = new Set(longestStreakDates);
    }

    // Group days by month
    const months = [];
    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();
    let monthDays = [];

    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
        // Push the completed month
        months.push({
          month: currentMonth,
          year: currentYear,
          days: monthDays,
        });
        monthDays = [];
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();
      }

      monthDays.push({
        date: dateStr,
        day: date.getDate(),
        dayOfWeek: date.getDay(),
        hasData: datesWithData.has(dateStr),
        isStreak: streakDates.has(dateStr),
        isToday: dateStr === today.toISOString().split('T')[0],
      });
    }

    // Push the last month
    if (monthDays.length > 0) {
      months.push({
        month: currentMonth,
        year: currentYear,
        days: monthDays,
      });
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return months.reverse().map((monthData, monthIdx) => {
      // Calculate starting position (which day of week the month starts on)
      const firstDayOfWeek = monthData.days.length > 0 ? monthData.days[0].dayOfWeek : 0;

      // Add empty slots for days before the month starts
      const calendarDays = [...Array(firstDayOfWeek).fill(null), ...monthData.days];

      // Group into weeks
      const weeks = [];
      for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
      }

      return (
        <View key={`${monthData.year}-${monthData.month}`} style={styles.calendarMonthContainer}>
          <Text style={styles.calendarMonthTitle}>
            {monthNames[monthData.month]} {monthData.year}
          </Text>

          {/* Day names header */}
          <View style={styles.calendarWeekHeader}>
            {dayNames.map((day, idx) => (
              <View key={idx} style={styles.calendarDayName}>
                <Text style={styles.calendarDayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, weekIdx) => (
            <View key={weekIdx} style={styles.calendarWeekRow}>
              {week.map((day, dayIdx) => {
                if (!day) {
                  return <View key={`empty-${dayIdx}`} style={styles.calendarDayCell} />;
                }

                return (
                  <View key={day.date} style={styles.calendarDayCell}>
                    <View
                      style={[
                        styles.calendarDayCircle,
                        day.isStreak && styles.calendarDayStreak,
                        day.isToday && styles.calendarDayToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          day.isStreak && styles.calendarDayTextStreak,
                          day.isToday && styles.calendarDayTextToday,
                        ]}
                      >
                        {day.day}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {/* Fill remaining slots if week is incomplete */}
              {[...Array(Math.max(0, 7 - week.length))].map((_, idx) => (
                <View key={`fill-${idx}`} style={styles.calendarDayCell} />
              ))}
            </View>
          ))}
        </View>
      );
    });
  };

  // Chart rendering helper functions
  const renderLineChart = () => {
    if (multiDayData.length === 0) return null;

    // Filter out days with no data (0 calories) for cleaner visualization
    const dataWithValues = multiDayData.filter(d => d.calories > 0);

    if (dataWithValues.length === 0) {
      return (
        <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.fontSize.md, color: Colors.textMuted, fontStyle: 'italic' }}>
            No data logged for this period
          </Text>
        </View>
      );
    }

    const maxCalories = Math.max(...dataWithValues.map(d => d.calories), calorieGoal);
    const chartHeight = 200;
    const pointCount = dataWithValues.length;

    // Determine how many labels to show based on data points
    let numLabels;
    if (pointCount <= 7) {
      numLabels = pointCount; // Show all
    } else if (pointCount <= 30) {
      numLabels = 5; // Show ~5 labels for 30 days
    } else if (pointCount <= 90) {
      numLabels = 6; // Show ~6 labels for 3 months
    } else {
      numLabels = 6; // Show ~6 labels for all time
    }

    // Calculate which indices should show labels
    const labelIndices = [];
    if (pointCount <= 7) {
      // Show all labels for 7 days or less
      for (let i = 0; i < pointCount; i++) {
        labelIndices.push(i);
      }
    } else {
      // For longer periods, evenly distribute labels
      labelIndices.push(0); // Always show first
      const interval = Math.floor((pointCount - 1) / (numLabels - 1));
      for (let i = 1; i < numLabels - 1; i++) {
        labelIndices.push(i * interval);
      }
      labelIndices.push(pointCount - 1); // Always show last
    }

    return (
      <View>
        {/* Goal line */}
        <View
          style={{
            position: 'absolute',
            top: chartHeight - (calorieGoal / maxCalories) * chartHeight,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: Colors.warning,
            opacity: 0.5,
            zIndex: 1,
          }}
        />
        <Text
          style={{
            position: 'absolute',
            top: chartHeight - (calorieGoal / maxCalories) * chartHeight - 20,
            right: 0,
            fontSize: Typography.fontSize.xs,
            color: Colors.warning,
            backgroundColor: Colors.background,
            paddingHorizontal: 4,
          }}
        >
          Goal: {calorieGoal}
        </Text>

        {/* Chart bars */}
        <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly' }}>
          {dataWithValues.map((day, index) => {
            const height = (day.calories / maxCalories) * chartHeight;
            const isLastWeek = index >= dataWithValues.length - 7;

            return (
              <TouchableOpacity
                key={`bar-${index}-${day.date}`}
                style={{
                  flex: 1,
                  height: chartHeight,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
                onPress={() => handleDayClick(day.date, 'calories')}
                activeOpacity={0.7}
              >
                {/* Bar */}
                <View
                  style={{
                    width: '80%',
                    maxWidth: 32,
                    height: height || 2,
                    backgroundColor: isLastWeek ? Colors.primary : Colors.primary + '40',
                    borderRadius: BorderRadius.xs,
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* X-axis labels - only show selected indices */}
        <View style={{ flexDirection: 'row', marginTop: Spacing.sm, height: 20 }}>
          {dataWithValues.map((day, index) => (
            <View key={`label-${index}-${day.date}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {labelIndices.includes(index) && (
                <Text
                  style={{
                    fontSize: pointCount <= 7 ? 11 : 9,
                    color: Colors.textSecondary,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {pointCount <= 7
                    ? new Date(day.date).toLocaleDateString('en', { weekday: 'short' })
                    : pointCount <= 30
                    ? `${new Date(day.date).getMonth() + 1}/${new Date(day.date).getDate()}`
                    : `${new Date(day.date).getMonth() + 1}/${new Date(day.date).getDate()}`
                  }
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.primary, borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>Last 7 Days</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.primary + '40', borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>Earlier</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMacroChart = () => {
    if (multiDayData.length === 0) return null;

    // Show last 7 days for macro chart
    const displayData = multiDayData.slice(-7);
    const maxTotal = Math.max(...displayData.map(d => d.protein + d.carbs + d.fat));
    const chartHeight = 180;

    return (
      <View>
        <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          {displayData.map((day, index) => {
            const total = day.protein + day.carbs + day.fat;
            const proteinHeight = (day.protein / maxTotal) * chartHeight;
            const carbsHeight = (day.carbs / maxTotal) * chartHeight;
            const fatHeight = (day.fat / maxTotal) * chartHeight;

            return (
              <TouchableOpacity
                key={day.date}
                style={{
                  flex: 1,
                  height: chartHeight,
                  justifyContent: 'flex-end',
                }}
                onPress={() => handleDayClick(day.date, 'macros')}
                activeOpacity={0.7}
              >
                {/* Stacked bars */}
                <View style={{ width: '100%', alignItems: 'center' }}>
                  {/* Fat (top) */}
                  <View
                    style={{
                      width: '80%',
                      height: fatHeight || 2,
                      backgroundColor: Colors.error,
                      borderTopLeftRadius: BorderRadius.xs,
                      borderTopRightRadius: BorderRadius.xs,
                    }}
                  />
                  {/* Carbs (middle) */}
                  <View
                    style={{
                      width: '80%',
                      height: carbsHeight || 2,
                      backgroundColor: Colors.warning,
                    }}
                  />
                  {/* Protein (bottom) */}
                  <View
                    style={{
                      width: '80%',
                      height: proteinHeight || 2,
                      backgroundColor: Colors.success,
                      borderBottomLeftRadius: BorderRadius.xs,
                      borderBottomRightRadius: BorderRadius.xs,
                    }}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* X-axis labels */}
        <View style={{ flexDirection: 'row', marginTop: Spacing.sm, gap: 4 }}>
          {displayData.map((day) => (
            <View key={day.date} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })[0]}
              </Text>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.success, borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>Protein</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.warning, borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>Carbs</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, backgroundColor: Colors.error, borderRadius: 2, marginRight: 4 }} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.textSecondary }}>Fat</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyComparison = () => {
    if (!weeklyComparison) return null;

    const { current, previous, caloriesDiff, proteinDiff, carbsDiff, fatDiff } = weeklyComparison;

    const ComparisonRow = ({ label, currentVal, previousVal, diff, color }) => (
      <View style={styles.comparisonRow}>
        <Text style={styles.comparisonLabel}>{label}</Text>
        <View style={styles.comparisonValues}>
          <View style={styles.comparisonColumn}>
            <Text style={styles.comparisonHeader}>Previous</Text>
            <Text style={styles.comparisonValue}>{previousVal}</Text>
          </View>
          <View style={styles.comparisonColumn}>
            <Text style={styles.comparisonHeader}>Current</Text>
            <Text style={[styles.comparisonValue, { color }]}>{currentVal}</Text>
          </View>
          <View style={styles.comparisonColumn}>
            <Text style={styles.comparisonHeader}>Change</Text>
            <Text style={[styles.comparisonDiff, { color: diff > 0 ? Colors.success : diff < 0 ? Colors.error : Colors.textSecondary }]}>
              {diff > 0 ? '+' : ''}{diff}
            </Text>
          </View>
        </View>
      </View>
    );

    return (
      <View>
        <ComparisonRow
          label="Avg Calories"
          currentVal={current.avgCalories}
          previousVal={previous.avgCalories}
          diff={caloriesDiff}
          color={Colors.primary}
        />
        <ComparisonRow
          label="Avg Protein"
          currentVal={`${current.avgProtein}g`}
          previousVal={`${previous.avgProtein}g`}
          diff={`${proteinDiff}g`}
          color={Colors.success}
        />
        <ComparisonRow
          label="Avg Carbs"
          currentVal={`${current.avgCarbs}g`}
          previousVal={`${previous.avgCarbs}g`}
          diff={`${carbsDiff}g`}
          color={Colors.warning}
        />
        <ComparisonRow
          label="Avg Fat"
          currentVal={`${current.avgFat}g`}
          previousVal={`${previous.avgFat}g`}
          diff={`${fatDiff}g`}
          color={Colors.error}
        />
      </View>
    );
  };

  // Render Overview Tab (current content)
  const renderOverviewTab = () => (
    <>
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
          <Text style={styles.dateButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          {isToday() && <Text style={styles.todayBadge}>Today</Text>}
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
          <Text style={styles.dateButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Calorie Summary Card */}
      <StyledCard style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>

        <View style={styles.calorieRing}>
          <Text style={styles.calorieNumber}>{totalCalories}</Text>
          <Text style={styles.calorieLabel}>calories</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: getProgressColor(totalCalories, calorieGoal),
              },
            ]}
          />
        </View>

        <View style={styles.calorieDetails}>
          <View style={styles.calorieDetailItem}>
            <Text style={styles.detailLabel}>Goal</Text>
            <Text
              style={[
                styles.detailValue,
                { fontSize: calorieGoal >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg },
              ]}
            >
              {calorieGoal}
            </Text>
          </View>
          <View style={styles.calorieDetailItem}>
            <Text style={styles.detailLabel}>Consumed</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: Colors.primary,
                  fontSize: totalCalories >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg,
                },
              ]}
            >
              {totalCalories}
            </Text>
          </View>
          <View style={styles.calorieDetailItem}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: remainingCalories < 0 ? Colors.error : Colors.success,
                  fontSize: Math.abs(remainingCalories) >= 1000 ? Typography.fontSize.md : Typography.fontSize.lg,
                },
              ]}
            >
              {Math.abs(remainingCalories)}
            </Text>
          </View>
        </View>
      </StyledCard>

      {/* Macros Card */}
      <StyledCard style={styles.macrosCard}>
        <Text style={styles.macrosTitle}>Macronutrients</Text>
        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <View style={[styles.macroCircle, { backgroundColor: Colors.success }]}>
              <Text style={styles.macroCircleText}>P</Text>
            </View>
            <Text style={styles.macroValue}>
              {dailySummary?.totals?.protein || 0}g
            </Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroCircle, { backgroundColor: Colors.warning }]}>
              <Text style={styles.macroCircleText}>C</Text>
            </View>
            <Text style={styles.macroValue}>
              {dailySummary?.totals?.carbs || 0}g
            </Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <View style={[styles.macroCircle, { backgroundColor: Colors.error }]}>
              <Text style={styles.macroCircleText}>F</Text>
            </View>
            <Text style={styles.macroValue}>
              {dailySummary?.totals?.fat || 0}g
            </Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </StyledCard>

      {/* Meals */}
      <Text style={styles.mealsTitle}>Meals</Text>
      {renderMealSection('breakfast', 'Breakfast', '🌅')}
      {renderMealSection('lunch', 'Lunch', '☀️')}
      {renderMealSection('dinner', 'Dinner', '🌙')}
      {renderMealSection('snack', 'Snacks', '🍿')}

      {/* Weekly Trend (if data exists) */}
      {weeklySummary.length > 0 && (
        <StyledCard style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>Weekly Trend</Text>
          <Text style={styles.weeklySubtitle}>Tap a day to see details</Text>
          <View style={styles.weeklyChart}>
            {weeklySummary.map((day) => {
              const height = (day.total_calories / calorieGoal) * 100;
              return (
                <TouchableOpacity
                  key={day.date}
                  style={styles.weeklyBarContainer}
                  onPress={() => handleDayClick(day.date)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.weeklyBar,
                      {
                        height: `${Math.min(height, 100)}%`,
                        backgroundColor: getProgressColor(day.total_calories, calorieGoal),
                      },
                    ]}
                  />
                  <Text style={styles.weeklyDayLabel}>
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </StyledCard>
      )}
    </>
  );

  // Render Charts Tab
  const renderChartsTab = () => (
    <>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {['7d', '30d', '3m', 'all'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive,
              ]}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '3m' ? '3 Months' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calorie Trend Line Chart */}
      <StyledCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Calorie Intake Trend</Text>
        <Text style={styles.chartSubtitle}>Daily calories over time</Text>
        {multiDayData.length > 0 ? (
          <View style={styles.lineChart}>
            {renderLineChart()}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available for this period</Text>
          </View>
        )}
      </StyledCard>

      {/* Macro Breakdown Chart */}
      <StyledCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Macro Breakdown</Text>
        <Text style={styles.chartSubtitle}>Protein, Carbs, Fat per day</Text>
        {multiDayData.length > 0 ? (
          <View style={styles.macroChart}>
            {renderMacroChart()}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available for this period</Text>
          </View>
        )}
      </StyledCard>

      {/* Weekly Comparison */}
      {weeklyComparison && timeRange !== '7d' && (
        <StyledCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Comparison</Text>
          <Text style={styles.chartSubtitle}>Last 7 days vs previous 7 days</Text>
          {renderWeeklyComparison()}
        </StyledCard>
      )}
    </>
  );

  // Render Goals Tab
  const renderGoalsTab = () => (
    <>
      {/* Current Goal Card */}
      <StyledCard style={styles.goalsCard}>
        <Text style={styles.goalsCardTitle}>📊 Daily Calorie Goal</Text>
        <View style={styles.goalValueContainer}>
          <Text style={styles.goalValue}>{calorieGoal}</Text>
          <Text style={styles.goalUnit}>calories</Text>
        </View>
        <Text style={styles.goalHint}>Within ±10% counts as hitting your goal</Text>
        <TouchableOpacity
          style={styles.editGoalButton}
          onPress={() => navigation.navigate('FoodSettings')}
        >
          <Text style={styles.editGoalButtonText}>✏️ Edit Goal</Text>
        </TouchableOpacity>
      </StyledCard>

      {/* Streaks Card */}
      <StyledCard style={styles.goalsCard}>
        <Text style={styles.goalsCardTitle}>🔥 Streaks</Text>
        <View style={styles.streaksContainer}>
          <TouchableOpacity
            style={styles.streakItem}
            onPress={() => {
              setStreakType('current');
              loadStreakCalendarData();
              setShowStreakCalendar(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.streakLabel}>Current Streak</Text>
            <View style={styles.streakContentWrapper}>
              <View style={styles.streakValueContainer}>
                <Text style={styles.streakValue}>{goalsData.currentStreak}</Text>
                <Text style={styles.streakDays}>days</Text>
              </View>
              <View style={styles.streakEmojiContainer}>
                {goalsData.currentStreak > 0 ? (
                  <Text style={styles.streakEmoji}>
                    {goalsData.currentStreak >= 30 ? '🏆' : goalsData.currentStreak >= 7 ? '🔥' : '⭐'}
                  </Text>
                ) : (
                  <Text style={styles.streakEmojiPlaceholder}>⭐</Text>
                )}
              </View>
            </View>
            <Text style={styles.streakViewCalendarHint}>Tap to view calendar</Text>
          </TouchableOpacity>
          <View style={styles.streakDivider} />
          <TouchableOpacity
            style={styles.streakItem}
            onPress={() => {
              setStreakType('longest');
              loadStreakCalendarData();
              setShowStreakCalendar(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.streakLabel}>Longest Streak</Text>
            <View style={styles.streakContentWrapper}>
              <View style={styles.streakValueContainer}>
                <Text style={styles.streakValue}>{goalsData.longestStreak}</Text>
                <Text style={styles.streakDays}>days</Text>
              </View>
              <View style={styles.streakEmojiContainer}>
                {goalsData.longestStreak > 0 ? (
                  <Text style={styles.streakEmoji}>
                    {goalsData.longestStreak >= 30 ? '🏆' : goalsData.longestStreak >= 7 ? '🔥' : '⭐'}
                  </Text>
                ) : (
                  <Text style={styles.streakEmojiPlaceholder}>⭐</Text>
                )}
              </View>
            </View>
            <Text style={styles.streakViewCalendarHint}>Tap to view calendar</Text>
          </TouchableOpacity>
        </View>
      </StyledCard>

      {/* Consistency Metrics */}
      <StyledCard style={styles.goalsCard}>
        <Text style={styles.goalsCardTitle}>📈 Consistency</Text>

        {/* Weekly Consistency */}
        <View style={styles.consistencyItem}>
          <View style={styles.consistencyHeader}>
            <Text style={styles.consistencyLabel}>Last 7 Days</Text>
            <Text style={styles.consistencyPercentage}>{goalsData.weeklyConsistency}%</Text>
          </View>
          <View style={styles.consistencyBarContainer}>
            <View
              style={[
                styles.consistencyBarFill,
                {
                  width: `${goalsData.weeklyConsistency}%`,
                  backgroundColor: goalsData.weeklyConsistency >= 80 ? Colors.success :
                                   goalsData.weeklyConsistency >= 50 ? Colors.warning : Colors.error,
                },
              ]}
            />
          </View>
        </View>

        {/* Monthly Consistency */}
        <View style={styles.consistencyItem}>
          <View style={styles.consistencyHeader}>
            <Text style={styles.consistencyLabel}>Last 30 Days</Text>
            <Text style={styles.consistencyPercentage}>{goalsData.monthlyConsistency}%</Text>
          </View>
          <View style={styles.consistencyBarContainer}>
            <View
              style={[
                styles.consistencyBarFill,
                {
                  width: `${goalsData.monthlyConsistency}%`,
                  backgroundColor: goalsData.monthlyConsistency >= 80 ? Colors.success :
                                   goalsData.monthlyConsistency >= 50 ? Colors.warning : Colors.error,
                },
              ]}
            />
          </View>
        </View>

        {/* Overall Stats */}
        <View style={styles.overallStats}>
          <Text style={styles.overallStatsText}>
            You've hit your goal {goalsData.daysAtGoal} out of {goalsData.totalDays} tracked days
          </Text>
          {goalsData.totalDays > 0 && (
            <Text style={styles.overallPercentage}>
              ({Math.round((goalsData.daysAtGoal / goalsData.totalDays) * 100)}% overall)
            </Text>
          )}
        </View>
      </StyledCard>

      {/* Achievement Badges */}
      <View style={styles.achievementsSection}>
        <View style={styles.achievementsSectionHeader}>
          <Text style={styles.achievementsSectionTitle}>🏅 Badges</Text>
          <Text style={styles.achievementsSectionSubtitle}>
            {(() => {
              const achievementsArray = [
                { icon: '🌱', title: 'Rookie', desc: 'Start tracking', unlocked: goalsData.totalDays >= 1 },
                { icon: '🐣', title: 'Early Bird', desc: '3-day streak', unlocked: goalsData.longestStreak >= 3 },
                { icon: '🚀', title: 'Steady Progress', desc: '5-day streak', unlocked: goalsData.longestStreak >= 5 },
                { icon: '🔥', title: 'Week Warrior', desc: '7-day streak', unlocked: goalsData.longestStreak >= 7 },
                { icon: '💪', title: 'Two-Week Champ', desc: '14-day streak', unlocked: goalsData.longestStreak >= 14 },
                { icon: '🔥', title: 'Fire Keeper', desc: '21-day streak', unlocked: goalsData.longestStreak >= 21 },
                { icon: '🏆', title: 'Month Master', desc: '30-day streak', unlocked: goalsData.longestStreak >= 30 },
                { icon: '🌊', title: 'Unstoppable', desc: '60-day streak', unlocked: goalsData.longestStreak >= 60 },
                { icon: '👑', title: 'Centurion', desc: '100-day streak', unlocked: goalsData.longestStreak >= 100 },
                { icon: '⚡', title: 'Lightning', desc: '180-day streak', unlocked: goalsData.longestStreak >= 180 },
                { icon: '🎖️', title: 'Year Warrior', desc: '365-day streak', unlocked: goalsData.longestStreak >= 365 },
                { icon: '📅', title: 'Week Veteran', desc: '7+ days tracked', unlocked: goalsData.totalDays >= 7 },
                { icon: '🎖️', title: 'Dedication', desc: '30+ days tracked', unlocked: goalsData.totalDays >= 30 },
                { icon: '📆', title: 'Month Regular', desc: '60+ days tracked', unlocked: goalsData.totalDays >= 60 },
                { icon: '🗓️', title: 'Quarter Pro', desc: '90+ days tracked', unlocked: goalsData.totalDays >= 90 },
                { icon: '📋', title: 'Annual Hero', desc: '365+ days tracked', unlocked: goalsData.totalDays >= 365 },
                { icon: '🌈', title: 'Goal Getter', desc: '10+ goal days', unlocked: goalsData.daysAtGoal >= 10 },
                { icon: '💎', title: 'Diamond Tracker', desc: '50+ goal days', unlocked: goalsData.daysAtGoal >= 50 },
                { icon: '🎯', title: 'Century Club', desc: '100+ goal days', unlocked: goalsData.daysAtGoal >= 100 },
                { icon: '🎪', title: 'Goal Expert', desc: '200+ goal days', unlocked: goalsData.daysAtGoal >= 200 },
                { icon: '🎨', title: 'Goal Legend', desc: '365+ goal days', unlocked: goalsData.daysAtGoal >= 365 },
                { icon: '⭐', title: 'Consistent Star', desc: '80%+ weekly', unlocked: goalsData.weeklyConsistency >= 80 },
                { icon: '💫', title: 'Perfect Week', desc: '100% weekly', unlocked: goalsData.weeklyConsistency >= 100 },
                { icon: '🌟', title: 'Monthly Champion', desc: '90%+ monthly', unlocked: goalsData.monthlyConsistency >= 90 },
                { icon: '🌠', title: 'Elite', desc: '95%+ monthly', unlocked: goalsData.monthlyConsistency >= 95 },
                { icon: '✨', title: 'Perfect Month', desc: '100% monthly', unlocked: goalsData.monthlyConsistency >= 100 },
                { icon: '📊', title: 'Calorie Counter', desc: '10k+ calories', unlocked: goalsData.totalCalories >= 10000 },
                { icon: '🎓', title: 'Nutrition Scholar', desc: '100k+ calories', unlocked: goalsData.totalCalories >= 100000 },
                { icon: '🔮', title: 'Calorie Pro', desc: '250k+ calories', unlocked: goalsData.totalCalories >= 250000 },
                { icon: '🎆', title: 'Calorie King', desc: '500k+ calories', unlocked: goalsData.totalCalories >= 500000 },
                { icon: '🌌', title: 'Calorie God', desc: '1M+ calories', unlocked: goalsData.totalCalories >= 1000000 },
                { icon: '🥩', title: 'Protein Starter', desc: '500g protein', unlocked: goalsData.totalProtein >= 500 },
                { icon: '🍗', title: 'Protein Pro', desc: '2kg protein', unlocked: goalsData.totalProtein >= 2000 },
                { icon: '🦸', title: 'Protein God', desc: '5kg protein', unlocked: goalsData.totalProtein >= 5000 },
                { icon: '🍖', title: 'Protein Beast', desc: '10kg protein', unlocked: goalsData.totalProtein >= 10000 },
                { icon: '🥓', title: 'Protein Legend', desc: '20kg protein', unlocked: goalsData.totalProtein >= 20000 },
                { icon: '🏅', title: 'Protein Champion', desc: '30+ protein days', unlocked: goalsData.proteinGoalDays >= 30 },
                { icon: '🥇', title: 'Protein Elite', desc: '60+ protein days', unlocked: goalsData.proteinGoalDays >= 60 },
                { icon: '⚔️', title: 'Deficit Warrior', desc: '7k+ deficit', unlocked: goalsData.totalDeficit >= 7000 },
                { icon: '✂️', title: 'Cut Master', desc: '21k+ deficit', unlocked: goalsData.totalDeficit >= 21000 },
                { icon: '🗡️', title: 'Cutting Pro', desc: '50k+ deficit', unlocked: goalsData.totalDeficit >= 50000 },
                { icon: '👊', title: 'Bulk King', desc: '7k+ surplus', unlocked: goalsData.totalSurplus >= 7000 },
                { icon: '🏋️', title: 'Mass Gainer', desc: '21k+ surplus', unlocked: goalsData.totalSurplus >= 21000 },
                { icon: '💥', title: 'Bulk Master', desc: '50k+ surplus', unlocked: goalsData.totalSurplus >= 50000 },
                { icon: '🥗', title: 'Balanced Diet', desc: '1+ perfect day', unlocked: goalsData.perfectMacroDays >= 1 },
                { icon: '🎯', title: 'Macro Master', desc: '10+ perfect days', unlocked: goalsData.perfectMacroDays >= 10 },
                { icon: '🔥', title: 'Macro Wizard', desc: '25+ perfect days', unlocked: goalsData.perfectMacroDays >= 25 },
                { icon: '🌟', title: 'Macro God', desc: '50+ perfect days', unlocked: goalsData.perfectMacroDays >= 50 },
              ];
              const unlocked = achievementsArray.filter(a => a.unlocked).length;
                            return `${unlocked} / 48 Unlocked`;
            })()}
          </Text>
        </View>

        {/* Unlocked Badges */}
        {(() => {
          const achievementsArray = [
            { icon: '🌱', title: 'Rookie', desc: 'Start tracking', unlocked: goalsData.totalDays >= 1 },
            { icon: '🐣', title: 'Early Bird', desc: '3-day streak', unlocked: goalsData.longestStreak >= 3 },
            { icon: '🚀', title: 'Steady Progress', desc: '5-day streak', unlocked: goalsData.longestStreak >= 5 },
            { icon: '🔥', title: 'Week Warrior', desc: '7-day streak', unlocked: goalsData.longestStreak >= 7 },
            { icon: '💪', title: 'Two-Week Champ', desc: '14-day streak', unlocked: goalsData.longestStreak >= 14 },
            { icon: '🔥', title: 'Fire Keeper', desc: '21-day streak', unlocked: goalsData.longestStreak >= 21 },
            { icon: '🏆', title: 'Month Master', desc: '30-day streak', unlocked: goalsData.longestStreak >= 30 },
            { icon: '🌊', title: 'Unstoppable', desc: '60-day streak', unlocked: goalsData.longestStreak >= 60 },
            { icon: '👑', title: 'Centurion', desc: '100-day streak', unlocked: goalsData.longestStreak >= 100 },
            { icon: '⚡', title: 'Lightning', desc: '180-day streak', unlocked: goalsData.longestStreak >= 180 },
            { icon: '🎖️', title: 'Year Warrior', desc: '365-day streak', unlocked: goalsData.longestStreak >= 365 },
            { icon: '📅', title: 'Week Veteran', desc: '7+ days tracked', unlocked: goalsData.totalDays >= 7 },
            { icon: '🎖️', title: 'Dedication', desc: '30+ days tracked', unlocked: goalsData.totalDays >= 30 },
            { icon: '📆', title: 'Month Regular', desc: '60+ days tracked', unlocked: goalsData.totalDays >= 60 },
            { icon: '🗓️', title: 'Quarter Pro', desc: '90+ days tracked', unlocked: goalsData.totalDays >= 90 },
            { icon: '📋', title: 'Annual Hero', desc: '365+ days tracked', unlocked: goalsData.totalDays >= 365 },
            { icon: '🌈', title: 'Goal Getter', desc: '10+ goal days', unlocked: goalsData.daysAtGoal >= 10 },
            { icon: '💎', title: 'Diamond Tracker', desc: '50+ goal days', unlocked: goalsData.daysAtGoal >= 50 },
            { icon: '🎯', title: 'Century Club', desc: '100+ goal days', unlocked: goalsData.daysAtGoal >= 100 },
            { icon: '🎪', title: 'Goal Expert', desc: '200+ goal days', unlocked: goalsData.daysAtGoal >= 200 },
            { icon: '🎨', title: 'Goal Legend', desc: '365+ goal days', unlocked: goalsData.daysAtGoal >= 365 },
            { icon: '⭐', title: 'Consistent Star', desc: '80%+ weekly', unlocked: goalsData.weeklyConsistency >= 80 },
            { icon: '💫', title: 'Perfect Week', desc: '100% weekly', unlocked: goalsData.weeklyConsistency >= 100 },
            { icon: '🌟', title: 'Monthly Champion', desc: '90%+ monthly', unlocked: goalsData.monthlyConsistency >= 90 },
            { icon: '🌠', title: 'Elite', desc: '95%+ monthly', unlocked: goalsData.monthlyConsistency >= 95 },
            { icon: '✨', title: 'Perfect Month', desc: '100% monthly', unlocked: goalsData.monthlyConsistency >= 100 },
            { icon: '📊', title: 'Calorie Counter', desc: '10k+ calories', unlocked: goalsData.totalCalories >= 10000 },
            { icon: '🎓', title: 'Nutrition Scholar', desc: '100k+ calories', unlocked: goalsData.totalCalories >= 100000 },
            { icon: '🔮', title: 'Calorie Pro', desc: '250k+ calories', unlocked: goalsData.totalCalories >= 250000 },
            { icon: '🎆', title: 'Calorie King', desc: '500k+ calories', unlocked: goalsData.totalCalories >= 500000 },
            { icon: '🌌', title: 'Calorie God', desc: '1M+ calories', unlocked: goalsData.totalCalories >= 1000000 },
            { icon: '🥩', title: 'Protein Starter', desc: '500g protein', unlocked: goalsData.totalProtein >= 500 },
            { icon: '🍗', title: 'Protein Pro', desc: '2kg protein', unlocked: goalsData.totalProtein >= 2000 },
            { icon: '🦸', title: 'Protein God', desc: '5kg protein', unlocked: goalsData.totalProtein >= 5000 },
            { icon: '🍖', title: 'Protein Beast', desc: '10kg protein', unlocked: goalsData.totalProtein >= 10000 },
            { icon: '🥓', title: 'Protein Legend', desc: '20kg protein', unlocked: goalsData.totalProtein >= 20000 },
            { icon: '🏅', title: 'Protein Champion', desc: '30+ protein days', unlocked: goalsData.proteinGoalDays >= 30 },
            { icon: '🥇', title: 'Protein Elite', desc: '60+ protein days', unlocked: goalsData.proteinGoalDays >= 60 },
            { icon: '⚔️', title: 'Deficit Warrior', desc: '7k+ deficit', unlocked: goalsData.totalDeficit >= 7000 },
            { icon: '✂️', title: 'Cut Master', desc: '21k+ deficit', unlocked: goalsData.totalDeficit >= 21000 },
            { icon: '🗡️', title: 'Cutting Pro', desc: '50k+ deficit', unlocked: goalsData.totalDeficit >= 50000 },
            { icon: '👊', title: 'Bulk King', desc: '7k+ surplus', unlocked: goalsData.totalSurplus >= 7000 },
            { icon: '🏋️', title: 'Mass Gainer', desc: '21k+ surplus', unlocked: goalsData.totalSurplus >= 21000 },
            { icon: '💥', title: 'Bulk Master', desc: '50k+ surplus', unlocked: goalsData.totalSurplus >= 50000 },
            { icon: '🥗', title: 'Balanced Diet', desc: '1+ perfect day', unlocked: goalsData.perfectMacroDays >= 1 },
            { icon: '🎯', title: 'Macro Master', desc: '10+ perfect days', unlocked: goalsData.perfectMacroDays >= 10 },
            { icon: '🔥', title: 'Macro Wizard', desc: '25+ perfect days', unlocked: goalsData.perfectMacroDays >= 25 },
            { icon: '🌟', title: 'Macro God', desc: '50+ perfect days', unlocked: goalsData.perfectMacroDays >= 50 },
          ];

          const unlockedAchievements = achievementsArray.filter(a => a.unlocked);
          const lockedAchievements = achievementsArray.filter(a => !a.unlocked);

          return (
            <>
              {unlockedAchievements.length > 0 && (
                <>
                  <Text style={styles.achievementCategoryTitle}>UNLOCKED</Text>
                  <View style={styles.achievementsGrid}>
                    {unlockedAchievements.map((achievement, index) => (
                      <View key={`unlocked-${index}`} style={styles.achievementCardWrapper}>
                        <TouchableOpacity
                          style={styles.achievementCard}
                          onPress={() => handleAchievementPress(achievement)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.achievementCardIcon}>{achievement.icon}</Text>
                          <Text style={styles.achievementCardTitle}>{achievement.title}</Text>
                          <Text style={styles.achievementCardDescription}>{achievement.desc}</Text>
                          <View style={styles.achievementBadge}>
                            <Text style={styles.achievementBadgeText}>✓ UNLOCKED</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {lockedAchievements.length > 0 && (
                <>
                  <Text style={styles.achievementCategoryTitle}>LOCKED</Text>
                  <View style={styles.achievementsGrid}>
                    {lockedAchievements.map((achievement, index) => (
                      <View key={`locked-${index}`} style={styles.achievementCardWrapper}>
                        <TouchableOpacity
                          style={[styles.achievementCard, styles.achievementCardLocked]}
                          onPress={() => handleAchievementPress(achievement)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.achievementCardIcon, styles.achievementCardIconLocked]}>{achievement.icon}</Text>
                          <Text style={[styles.achievementCardTitle, styles.achievementCardTitleLocked]}>{achievement.title}</Text>
                          <Text style={[styles.achievementCardDescription, styles.achievementCardDescriptionLocked]}>{achievement.desc}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          );
        })()}
      </View>
    </>
  );

  // Render Insights Tab
  const renderInsightsTab = () => {
    if (!insightsData.bestDay) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📊</Text>
          <Text style={styles.placeholderTitle}>No Data Yet</Text>
          <Text style={styles.placeholderText}>
            Start logging your meals to see personalized insights and recommendations!
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Average Stats */}
        <StyledCard style={styles.insightsCard}>
          <Text style={styles.insightsCardTitle}>📊 Average Daily Intake</Text>
          <View style={styles.averagesContainer}>
            <View style={styles.averageSection}>
              <Text style={styles.averagePeriod}>Last 7 Days</Text>
              <View style={styles.averageStats}>
                <View style={styles.averageStat}>
                  <Text style={styles.averageValue}>{insightsData.weeklyAvg.calories}</Text>
                  <Text style={styles.averageLabel}>cal</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.success }]}>{insightsData.weeklyAvg.protein}g</Text>
                  <Text style={styles.averageLabel}>protein</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.warning }]}>{insightsData.weeklyAvg.carbs}g</Text>
                  <Text style={styles.averageLabel}>carbs</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.error }]}>{insightsData.weeklyAvg.fat}g</Text>
                  <Text style={styles.averageLabel}>fat</Text>
                </View>
              </View>
            </View>

            <View style={styles.averageDivider} />

            <View style={styles.averageSection}>
              <Text style={styles.averagePeriod}>Last 30 Days</Text>
              <View style={styles.averageStats}>
                <View style={styles.averageStat}>
                  <Text style={styles.averageValue}>{insightsData.monthlyAvg.calories}</Text>
                  <Text style={styles.averageLabel}>cal</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.success }]}>{insightsData.monthlyAvg.protein}g</Text>
                  <Text style={styles.averageLabel}>protein</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.warning }]}>{insightsData.monthlyAvg.carbs}g</Text>
                  <Text style={styles.averageLabel}>carbs</Text>
                </View>
                <View style={styles.averageStat}>
                  <Text style={[styles.averageValue, { color: Colors.error }]}>{insightsData.monthlyAvg.fat}g</Text>
                  <Text style={styles.averageLabel}>fat</Text>
                </View>
              </View>
            </View>
          </View>
        </StyledCard>

        {/* Macro Balance */}
        <StyledCard style={styles.insightsCard}>
          <Text style={styles.insightsCardTitle}>🥗 Macro Balance</Text>
          <Text style={styles.insightsSubtitle}>Your average calorie distribution</Text>

          <View style={styles.macroBalanceChart}>
            <View style={styles.macroBalanceBar}>
              <View style={[styles.macroBalanceSegment, { width: `${insightsData.macroBalance.protein}%`, backgroundColor: Colors.success }]} />
              <View style={[styles.macroBalanceSegment, { width: `${insightsData.macroBalance.carbs}%`, backgroundColor: Colors.warning }]} />
              <View style={[styles.macroBalanceSegment, { width: `${insightsData.macroBalance.fat}%`, backgroundColor: Colors.error }]} />
            </View>
          </View>

          <View style={styles.macroBalanceLegend}>
            <View style={styles.macroBalanceItem}>
              <View style={[styles.macroBalanceDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.macroBalanceText}>Protein: {insightsData.macroBalance.protein}%</Text>
            </View>
            <View style={styles.macroBalanceItem}>
              <View style={[styles.macroBalanceDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.macroBalanceText}>Carbs: {insightsData.macroBalance.carbs}%</Text>
            </View>
            <View style={styles.macroBalanceItem}>
              <View style={[styles.macroBalanceDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.macroBalanceText}>Fat: {insightsData.macroBalance.fat}%</Text>
            </View>
          </View>

          <Text style={styles.macroBalanceHint}>
            Recommended: Protein 15-35%, Carbs 45-65%, Fat 20-35%
          </Text>
        </StyledCard>

        {/* Best & Worst Days */}
        <StyledCard style={styles.insightsCard}>
          <Text style={styles.insightsCardTitle}>📅 Best & Worst Days</Text>

          <View style={styles.bestWorstContainer}>
            <View style={styles.bestWorstItem}>
              <Text style={styles.bestWorstLabel}>🏆 Closest to Goal</Text>
              <Text style={styles.bestWorstDate}>
                {new Date(insightsData.bestDay.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.bestWorstCalories}>{insightsData.bestDay.calories} cal</Text>
              <Text style={styles.bestWorstDiff}>
                {Math.abs(insightsData.bestDay.calories - calorieGoal)} cal {insightsData.bestDay.calories > calorieGoal ? 'over' : 'under'}
              </Text>
            </View>

            <View style={styles.bestWorstDivider} />

            <View style={styles.bestWorstItem}>
              <Text style={styles.bestWorstLabel}>📉 Furthest from Goal</Text>
              <Text style={styles.bestWorstDate}>
                {new Date(insightsData.worstDay.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.bestWorstCalories}>{insightsData.worstDay.calories} cal</Text>
              <Text style={styles.bestWorstDiff}>
                {Math.abs(insightsData.worstDay.calories - calorieGoal)} cal {insightsData.worstDay.calories > calorieGoal ? 'over' : 'under'}
              </Text>
            </View>
          </View>
        </StyledCard>

        {/* Personalized Insights */}
        <View style={styles.insightsListContainer}>
          <Text style={styles.insightsListTitle}>💡 Personalized Insights</Text>
          {insightsData.insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightItem,
                insight.type === 'success' && styles.insightSuccess,
                insight.type === 'warning' && styles.insightWarning,
                insight.type === 'info' && styles.insightInfo,
              ]}
            >
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <ScreenLayout
      title="Nutrition"
      subtitle="Track your daily calorie intake"
      navigation={navigation}
      showBack={true}
    >
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>Charts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.tabActive]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>Insights</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'charts' && renderChartsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </ScrollView>

      {/* Day Details Modal */}
      <Modal
        visible={selectedDayModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedDayModal(false)}
      >
        <View style={styles.modalContainer}>
          {selectedDayData && (
            <>
              {/* Modal Header with Drag Indicator */}
              <View style={styles.modalHeader}>
                <View style={styles.dragIndicator} />
                <View style={styles.modalHeaderRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedDayModal(false)}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {new Date(selectedDayData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={styles.headerSpacer} />
                </View>
              </View>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                    {/* Show different content based on modal type */}
                    {modalType === 'calories' ? (
                      // Calories Mode: Simple calorie summary
                      <View style={styles.modalCaloriesCard}>
                        <Text style={styles.modalCaloriesLabel}>Total Calories</Text>
                        <Text style={styles.modalCaloriesValue}>{selectedDayData.calories}</Text>
                        <Text style={styles.modalCaloriesUnit}>cal</Text>

                        {/* Progress vs Goal */}
                        <View style={styles.modalProgressBar}>
                          <View
                            style={[
                              styles.modalProgressFill,
                              {
                                width: `${Math.min((selectedDayData.calories / calorieGoal) * 100, 100)}%`,
                                backgroundColor: getProgressColor(selectedDayData.calories, calorieGoal),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.modalGoalText}>
                          {selectedDayData.calories >= calorieGoal
                            ? `${selectedDayData.calories - calorieGoal} cal over goal`
                            : `${calorieGoal - selectedDayData.calories} cal under goal`}
                        </Text>
                      </View>
                    ) : (
                      // Macros Mode: Show macronutrient breakdown
                      <View style={styles.modalMacrosCard}>
                      <Text style={styles.modalSectionTitle}>Macronutrients</Text>
                      <View style={styles.modalMacrosGrid}>
                        <View style={styles.modalMacroItem}>
                          <View style={[styles.modalMacroCircle, { backgroundColor: Colors.success }]}>
                            <Text style={styles.modalMacroIcon}>P</Text>
                          </View>
                          <Text style={styles.modalMacroValue}>{selectedDayData.protein}g</Text>
                          <Text style={styles.modalMacroLabel}>Protein</Text>
                        </View>
                        <View style={styles.modalMacroItem}>
                          <View style={[styles.modalMacroCircle, { backgroundColor: Colors.warning }]}>
                            <Text style={styles.modalMacroIcon}>C</Text>
                          </View>
                          <Text style={styles.modalMacroValue}>{selectedDayData.carbs}g</Text>
                          <Text style={styles.modalMacroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.modalMacroItem}>
                          <View style={[styles.modalMacroCircle, { backgroundColor: Colors.error }]}>
                            <Text style={styles.modalMacroIcon}>F</Text>
                          </View>
                          <Text style={styles.modalMacroValue}>{selectedDayData.fat}g</Text>
                          <Text style={styles.modalMacroLabel}>Fat</Text>
                        </View>
                      </View>
                    </View>
                    )}

                    {/* Meals Breakdown */}
                    <View style={styles.modalMealsCard}>
                      <Text style={styles.modalSectionTitle}>Meals</Text>

                      {/* Breakfast */}
                      {modalType === 'calories' && selectedDayData.meals.breakfast.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🌅 Breakfast</Text>
                          {selectedDayData.meals.breakfast.map((meal, idx) => (
                            <View key={idx} style={styles.modalMealItem}>
                              <Text style={styles.modalMealName}>{meal.name}</Text>
                              <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {modalType === 'macros' && selectedDayData.meals.breakfast.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🌅 Breakfast</Text>
                          {selectedDayData.meals.breakfast.map((meal, idx) => {
                            const proteinPercent = selectedDayData.protein > 0
                              ? Math.round((meal.protein / selectedDayData.protein) * 100)
                              : 0;
                            const carbsPercent = selectedDayData.carbs > 0
                              ? Math.round((meal.carbs / selectedDayData.carbs) * 100)
                              : 0;
                            const fatPercent = selectedDayData.fat > 0
                              ? Math.round((meal.fat / selectedDayData.fat) * 100)
                              : 0;

                            return (
                              <View key={idx} style={styles.modalMealItem}>
                                <View style={styles.modalMealInfo}>
                                  <Text style={styles.modalMealName}>{meal.name}</Text>
                                  <View style={styles.modalMealMacros}>
                                    <Text style={styles.modalMealMacroText}>
                                      P: {meal.protein}g ({proteinPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      C: {meal.carbs}g ({carbsPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      F: {meal.fat}g ({fatPercent}%)
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Lunch */}
                      {modalType === 'calories' && selectedDayData.meals.lunch.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>☀️ Lunch</Text>
                          {selectedDayData.meals.lunch.map((meal, idx) => (
                            <View key={idx} style={styles.modalMealItem}>
                              <Text style={styles.modalMealName}>{meal.name}</Text>
                              <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {modalType === 'macros' && selectedDayData.meals.lunch.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>☀️ Lunch</Text>
                          {selectedDayData.meals.lunch.map((meal, idx) => {
                            const proteinPercent = selectedDayData.protein > 0
                              ? Math.round((meal.protein / selectedDayData.protein) * 100)
                              : 0;
                            const carbsPercent = selectedDayData.carbs > 0
                              ? Math.round((meal.carbs / selectedDayData.carbs) * 100)
                              : 0;
                            const fatPercent = selectedDayData.fat > 0
                              ? Math.round((meal.fat / selectedDayData.fat) * 100)
                              : 0;

                            return (
                              <View key={idx} style={styles.modalMealItem}>
                                <View style={styles.modalMealInfo}>
                                  <Text style={styles.modalMealName}>{meal.name}</Text>
                                  <View style={styles.modalMealMacros}>
                                    <Text style={styles.modalMealMacroText}>
                                      P: {meal.protein}g ({proteinPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      C: {meal.carbs}g ({carbsPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      F: {meal.fat}g ({fatPercent}%)
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Dinner */}
                      {modalType === 'calories' && selectedDayData.meals.dinner.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🌙 Dinner</Text>
                          {selectedDayData.meals.dinner.map((meal, idx) => (
                            <View key={idx} style={styles.modalMealItem}>
                              <Text style={styles.modalMealName}>{meal.name}</Text>
                              <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {modalType === 'macros' && selectedDayData.meals.dinner.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🌙 Dinner</Text>
                          {selectedDayData.meals.dinner.map((meal, idx) => {
                            const proteinPercent = selectedDayData.protein > 0
                              ? Math.round((meal.protein / selectedDayData.protein) * 100)
                              : 0;
                            const carbsPercent = selectedDayData.carbs > 0
                              ? Math.round((meal.carbs / selectedDayData.carbs) * 100)
                              : 0;
                            const fatPercent = selectedDayData.fat > 0
                              ? Math.round((meal.fat / selectedDayData.fat) * 100)
                              : 0;

                            return (
                              <View key={idx} style={styles.modalMealItem}>
                                <View style={styles.modalMealInfo}>
                                  <Text style={styles.modalMealName}>{meal.name}</Text>
                                  <View style={styles.modalMealMacros}>
                                    <Text style={styles.modalMealMacroText}>
                                      P: {meal.protein}g ({proteinPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      C: {meal.carbs}g ({carbsPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      F: {meal.fat}g ({fatPercent}%)
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Snacks */}
                      {modalType === 'calories' && selectedDayData.meals.snacks.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🍿 Snacks</Text>
                          {selectedDayData.meals.snacks.map((meal, idx) => (
                            <View key={idx} style={styles.modalMealItem}>
                              <Text style={styles.modalMealName}>{meal.name}</Text>
                              <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {modalType === 'macros' && selectedDayData.meals.snacks.length > 0 && (
                        <View style={styles.modalMealSection}>
                          <Text style={styles.modalMealTitle}>🍿 Snacks</Text>
                          {selectedDayData.meals.snacks.map((meal, idx) => {
                            const proteinPercent = selectedDayData.protein > 0
                              ? Math.round((meal.protein / selectedDayData.protein) * 100)
                              : 0;
                            const carbsPercent = selectedDayData.carbs > 0
                              ? Math.round((meal.carbs / selectedDayData.carbs) * 100)
                              : 0;
                            const fatPercent = selectedDayData.fat > 0
                              ? Math.round((meal.fat / selectedDayData.fat) * 100)
                              : 0;

                            return (
                              <View key={idx} style={styles.modalMealItem}>
                                <View style={styles.modalMealInfo}>
                                  <Text style={styles.modalMealName}>{meal.name}</Text>
                                  <View style={styles.modalMealMacros}>
                                    <Text style={styles.modalMealMacroText}>
                                      P: {meal.protein}g ({proteinPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      C: {meal.carbs}g ({carbsPercent}%)
                                    </Text>
                                    <Text style={styles.modalMealMacroText}>
                                      F: {meal.fat}g ({fatPercent}%)
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.modalMealCalories}>{meal.calories} cal</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* No meals logged */}
                      {selectedDayData.meals.breakfast.length === 0 &&
                        selectedDayData.meals.lunch.length === 0 &&
                        selectedDayData.meals.dinner.length === 0 &&
                        selectedDayData.meals.snacks.length === 0 && (
                          <Text style={styles.modalNoMealsText}>No meals logged for this day</Text>
                        )}
                    </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

      {/* Streak Calendar Modal */}
      <Modal
        visible={showStreakCalendar}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowStreakCalendar(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={styles.calendarModalHeader}>
            <Text style={styles.calendarModalTitle}>
              {streakType === 'current' ? '📅 Current Streak' : '📅 Longest Streak'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStreakCalendar(false)}
              style={styles.calendarCloseButton}
            >
              <Text style={styles.calendarCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.calendarScrollView}
            contentContainerStyle={styles.calendarScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Streak Stats Summary */}
            <View style={styles.calendarStatsContainer}>
              <View style={styles.calendarStatBox}>
                <Text style={styles.calendarStatLabel}>Current Streak</Text>
                <Text style={styles.calendarStatValue}>{goalsData.currentStreak} days</Text>
              </View>
              <View style={styles.calendarStatBox}>
                <Text style={styles.calendarStatLabel}>Longest Streak</Text>
                <Text style={styles.calendarStatValue}>{goalsData.longestStreak} days</Text>
              </View>
              <View style={styles.calendarStatBox}>
                <Text style={styles.calendarStatLabel}>Total Days</Text>
                <Text style={styles.calendarStatValue}>{streakDays.length} days</Text>
              </View>
            </View>

            <Text style={styles.calendarSubtitle}>
              Days with logged nutrition (last 90 days)
            </Text>

            {renderStreakCalendar()}

            <View style={styles.calendarLegend}>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.calendarLegendText}>
                  {streakType === 'current' ? 'Current streak days' : 'Longest streak days'}
                </Text>
              </View>
              <View style={styles.calendarLegendItem}>
                <View style={[styles.calendarLegendDot, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} />
                <Text style={styles.calendarLegendText}>All other days</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Achievement Detail Modal */}
      <NutritionAchievementDetailModal
        visible={showAchievementDetailModal}
        onClose={() => setShowAchievementDetailModal(false)}
        achievement={selectedAchievement}
        breakdown={achievementBreakdown}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 6,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Placeholder Styles
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  placeholderText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Overview Tab Styles
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  todayBadge: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },
  calorieRing: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  calorieNumber: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  calorieDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  calorieDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  macrosCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  macrosTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  macroCircleText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  macroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  mealsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  mealCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.sm,
  },
  mealName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  mealCalories: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  expandIcon: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  mealItems: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  noItemsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
    padding: Spacing.md,
    textAlign: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  foodItemDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  quickAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  quickAddButton: {
    flex: 1,
  },
  weeklyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  weeklyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  weeklySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontWeight: '500',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  weeklyBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  weeklyBar: {
    width: '80%',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  weeklyDayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Charts Tab Styles
  timeRangeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  timeRangeButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeRangeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  chartTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  lineChart: {
    paddingVertical: Spacing.md,
  },
  macroChart: {
    paddingVertical: Spacing.md,
  },
  noDataContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  comparisonRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  comparisonLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonHeader: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  comparisonDiff: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },

  // Goals Tab Styles
  goalsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  goalsCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  goalValueContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  goalUnit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  editGoalButton: {
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  editGoalButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  streakContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  streakValueContainer: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  streakDays: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakEmojiContainer: {
    width: 40,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakEmojiPlaceholder: {
    fontSize: 40,
    opacity: 0.2,
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  consistencyItem: {
    marginBottom: Spacing.md,
  },
  consistencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  consistencyLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  consistencyPercentage: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  consistencyBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  consistencyBarFill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  overallStats: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  overallStatsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  overallPercentage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  achievementsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  achievementBadge: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    opacity: 0.4,
  },
  achievementUnlocked: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
    opacity: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  achievementName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },
  achievementDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  motivationalContainer: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  motivationalText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Insights Tab Styles
  insightsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  insightsCardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  insightsSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  averagesContainer: {
    gap: Spacing.lg,
  },
  averageSection: {
    alignItems: 'center',
  },
  averagePeriod: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  averageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: Spacing.sm,
  },
  averageStat: {
    flex: 1,
    alignItems: 'center',
  },
  averageValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  averageLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  averageDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  macroBalanceChart: {
    marginBottom: Spacing.lg,
  },
  macroBalanceBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  macroBalanceSegment: {
    height: '100%',
  },
  macroBalanceLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  macroBalanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  macroBalanceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroBalanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  macroBalanceHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  bestWorstContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bestWorstItem: {
    flex: 1,
    alignItems: 'center',
  },
  bestWorstLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  bestWorstDate: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  bestWorstCalories: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  bestWorstDiff: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  bestWorstDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  insightsListContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  insightsListTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  insightSuccess: {
    borderLeftColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  insightWarning: {
    borderLeftColor: Colors.warning,
    backgroundColor: Colors.warning + '10',
  },
  insightInfo: {
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  insightIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  modalScroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalScrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  modalCaloriesCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCaloriesLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modalCaloriesValue: {
    fontSize: Typography.fontSize.xxxl * 1.2,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  modalCaloriesUnit: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  modalGoalText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalMacrosCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  modalMacrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalMacroItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalMacroCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalMacroIcon: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.background,
  },
  modalMacroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalMacroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalMealsCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    marginTop: 0,
    marginBottom: Spacing.xl * 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalMealSection: {
    marginBottom: Spacing.lg,
  },
  modalMealTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  modalMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  modalMealInfo: {
    flex: 1,
  },
  modalMealName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modalMealMacros: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  modalMealMacroText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalMealCalories: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  modalNoMealsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // Achievement Badges
  achievementsSection: {
    marginBottom: Spacing.xl,
  },
  achievementsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  achievementsSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  achievementsSectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  achievementCategoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    letterSpacing: 1,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementCardWrapper: {
    width: '48%',
  },
  achievementCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
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
    backgroundColor: '#000000',
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
  // Streak Calendar Hint
  streakViewCalendarHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
    opacity: 0.8,
  },
  // Calendar Modal Styles
  calendarModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  calendarModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calendarCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCloseButtonText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: 'bold',
  },
  calendarScrollView: {
    flex: 1,
  },
  calendarScrollContent: {
    padding: Spacing.lg,
  },
  calendarStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  calendarStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  calendarStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calendarStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calendarSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  calendarEmptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  calendarEmptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  calendarEmptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  calendarMonthContainer: {
    marginBottom: Spacing.xl,
  },
  calendarMonthTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  calendarDayName: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayNameText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calendarDayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  calendarDayCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  calendarDayWithData: {
    backgroundColor: '#D1D5DB',
  },
  calendarDayStreak: {
    backgroundColor: '#3B82F6',
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  calendarDayText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  calendarDayTextWithData: {
    color: Colors.text,
    fontWeight: '600',
  },
  calendarDayTextStreak: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    fontWeight: 'bold',
  },
  calendarLegend: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  calendarLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  calendarLegendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
});
