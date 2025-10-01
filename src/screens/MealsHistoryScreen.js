import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MEAL_PLANS_KEY = '@meal_plans';
const DAILY_NUTRITION_KEY = '@daily_nutrition';

export default function MealsHistoryScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('meals'); // Start on Today tab by default
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealData, setMealData] = useState({});
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [todayMeals, setTodayMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  
  // Load meal data on focus
  useFocusEffect(
    React.useCallback(() => {
      loadMealData();
    }, [])
  );

  const loadMealData = async () => {
    try {
      // Load today's meals from daily nutrition
      const savedNutrition = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      if (savedNutrition) {
        const data = JSON.parse(savedNutrition);
        setTodayMeals(data.meals || {});
      }

      // Load meal plans
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setMealData(plans);
      }
    } catch (error) {
      console.error('Error loading meal data:', error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowDayPlanner(true);
  };

  const getSelectedDateMeals = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const todayKey = new Date().toISOString().split('T')[0];

    // If it's today, use todayMeals state
    if (dateKey === todayKey) {
      return todayMeals;
    }

    // Otherwise, get from mealData
    const dateMeals = mealData[dateKey];
    if (dateMeals && dateMeals.logged) {
      return dateMeals.logged;
    }

    return { breakfast: [], lunch: [], dinner: [], snacks: [] };
  };

  const getTodayDateKey = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <ScreenLayout
      title="Meal Planner & History"
      subtitle="Plan and track your nutrition"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={true}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
          onPress={() => setActiveTab('meals')}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'meals' ? (
        <View>
          {Object.entries(todayMeals).flatMap(([mealType, items]) =>
            items.map((item, index) => (
              <StyledCard key={`${mealType}-${index}`} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={styles.mealType}>{mealType}</Text>
                    <Text style={styles.mealName}>{item.name}</Text>
                  </View>
                  <View style={styles.mealDetails}>
                    <Text style={styles.mealCalories}>{item.calories} cal</Text>
                  </View>
                </View>
              </StyledCard>
            ))
          )}

          {Object.values(todayMeals).every(meals => meals.length === 0) && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>Add meals from the Nutrition screen</Text>
            </View>
          )}

          <View style={styles.actions}>
            <StyledButton
              title="Go to Nutrition"
              icon="🥗"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('Nutrition')}
              style={styles.actionButton}
            />
          </View>
        </View>
      ) : (
        <View style={styles.calendarTab}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            mealData={mealData}
          />

          <View style={styles.calendarInfo}>
            <Text style={styles.infoTitle}>📅 How to Use</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoText}>• Tap any date to view details</Text>
              <Text style={styles.infoText}>• Green dots = Logged meals</Text>
              <Text style={styles.infoText}>• Orange dots = Planned meals (coming soon)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Day Details Modal */}
      <Modal
        visible={showDayPlanner}
        animationType="slide"
        onRequestClose={() => setShowDayPlanner(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDayPlanner(false)}
              style={styles.closeButtonWrapper}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dateInfoCard}>
              <Text style={styles.modalSubtitle}>
                {isFutureDate(selectedDate)
                  ? '📅 Future Date'
                  : isToday(selectedDate)
                  ? '🌟 Today'
                  : '📋 Past Date'}
              </Text>
            </View>

            {isFutureDate(selectedDate) ? (
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Future Planning</Text>
                <Text style={styles.featureText}>
                  Meal planning for future dates coming soon!
                </Text>
              </View>
            ) : (
              <>
                {Object.entries(getSelectedDateMeals()).map(([mealType, items]) => (
                  items.length > 0 && (
                    <View key={mealType} style={styles.modalMealSection}>
                      <Text style={styles.modalMealType}>
                        {mealType === 'breakfast' && '🌅 Breakfast'}
                        {mealType === 'lunch' && '☀️ Lunch'}
                        {mealType === 'dinner' && '🌙 Dinner'}
                        {mealType === 'snacks' && '🍿 Snacks'}
                      </Text>
                      {items.map((item, index) => (
                        <View key={index} style={styles.modalMealItem}>
                          <Text style={styles.modalMealName}>{item.name}</Text>
                          <Text style={styles.modalMealCalories}>{item.calories} cal</Text>
                        </View>
                      ))}
                    </View>
                  )
                ))}

                {Object.values(getSelectedDateMeals()).every(meals => meals.length === 0) && (
                  <View style={styles.emptyModalContainer}>
                    <Text style={styles.emptyModalText}>No meals logged</Text>
                    <Text style={styles.emptyModalSubtext}>
                      {isToday(selectedDate)
                        ? 'Add meals from the Nutrition screen'
                        : 'No meals were logged on this date'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.round,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.background,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealType: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },
  mealName: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  mealDetails: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  actions: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  calendarTab: {
    flex: 1,
  },
  calendarInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  closeButtonWrapper: {
    padding: Spacing.sm,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  dateInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    fontWeight: '600',
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  featureTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  featureText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
  modalMealSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalMealType: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  modalMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalMealName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  modalMealCalories: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyModalText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  emptyModalSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});