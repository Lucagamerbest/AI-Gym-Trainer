import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledCard from './StyledCard';
import StyledButton from './StyledButton';
import CalendarView from './CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MEAL_PLANS_KEY = '@meal_plans';

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MealHistoryTabs({ navigation, route, activeHistoryTab }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealData, setMealData] = useState({});
  const [showDayPlanner, setShowDayPlanner] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [expandedDates, setExpandedDates] = useState([]);
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  // Load meal data
  useFocusEffect(
    React.useCallback(() => {
      loadMealData();
    }, [])
  );

  const loadMealData = async () => {
    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      if (savedPlans) {
        const plans = JSON.parse(savedPlans);
        setMealData(plans);
      }
    } catch (error) {
      console.error('Error loading meal data:', error);
    }
  };

  // Check if activeHistoryTab is 'history' or 'plan'
  const isHistoryMode = activeHistoryTab === 'history';

  // Filter dates based on history or plan mode
  const getFilteredDates = () => {
    const today = getLocalDateString();
    const todayDate = new Date(today);
    const allDates = Object.keys(mealData);

    if (isHistoryMode) {
      // History: show only past dates (excluding today)
      return allDates
        .filter(dateKey => new Date(dateKey) < todayDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .slice(0, 30);
    } else {
      // Plan: show only future dates (excluding today)
      return allDates
        .filter(dateKey => new Date(dateKey) > todayDate)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(0, 30);
    }
  };

  const filteredDates = getFilteredDates();

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.viewModeButton, calendarViewMode === 'calendar' && styles.viewModeButtonActive]}
          onPress={() => setCalendarViewMode('calendar')}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewModeText, calendarViewMode === 'calendar' && styles.viewModeTextActive]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, calendarViewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => setCalendarViewMode('list')}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewModeText, calendarViewMode === 'list' && styles.viewModeTextActive]}>
            📋 List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar View */}
      {calendarViewMode === 'calendar' && (
        <ScrollView style={styles.scrollView}>
          <CalendarView
            markedDates={mealData}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setShowDayPlanner(true);
            }}
            highlightToday={false}
          />
          <StyledCard style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {isHistoryMode ? '📅 Past Meals' : '📆 Meal Planning'}
            </Text>
            <Text style={styles.infoText}>
              {isHistoryMode
                ? 'View your meal history by tapping on dates with green dots. These show days where you logged meals.'
                : 'Plan future meals by tapping on any date. Orange dots show days with planned meals.'}
            </Text>
          </StyledCard>
        </ScrollView>
      )}

      {/* List View */}
      {calendarViewMode === 'list' && (
        <ScrollView style={styles.scrollView}>
          {filteredDates.length === 0 ? (
            <StyledCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isHistoryMode ? '📅 No past meals logged yet' : '📆 No future meals planned yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {isHistoryMode
                  ? 'Start logging meals in the Today tab to see your history here'
                  : 'Tap a future date to start planning your meals'}
              </Text>
            </StyledCard>
          ) : (
            filteredDates.map((dateKey) => {
              const dateData = mealData[dateKey];
              const mealsToShow = isHistoryMode ? dateData?.logged : dateData?.planned;
              if (!mealsToShow) return null;

              const totalCals = ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((sum, mealType) => {
                const items = mealsToShow[mealType] || [];
                return sum + items.reduce((s, item) => s + (item.calories || 0), 0);
              }, 0);

              const date = new Date(dateKey);
              const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <TouchableOpacity
                  key={dateKey}
                  onPress={() => {
                    setSelectedDate(date);
                    setShowDayPlanner(true);
                  }}
                  activeOpacity={0.7}
                >
                  <StyledCard style={styles.dateCard}>
                    <View style={styles.dateCardHeader}>
                      <Text style={styles.dateCardTitle}>{formattedDate}</Text>
                      <Text style={styles.dateCardCals}>{totalCals} cal</Text>
                    </View>
                    <View style={styles.mealIconsRow}>
                      {mealsToShow.breakfast?.length > 0 && <Text style={styles.mealIcon}>🌅 {mealsToShow.breakfast.length}</Text>}
                      {mealsToShow.lunch?.length > 0 && <Text style={styles.mealIcon}>☀️ {mealsToShow.lunch.length}</Text>}
                      {mealsToShow.dinner?.length > 0 && <Text style={styles.mealIcon}>🌙 {mealsToShow.dinner.length}</Text>}
                      {mealsToShow.snacks?.length > 0 && <Text style={styles.mealIcon}>🍿 {mealsToShow.snacks.length}</Text>}
                    </View>
                  </StyledCard>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Day Planner Modal */}
      <Modal
        visible={showDayPlanner}
        animationType="slide"
        onRequestClose={() => setShowDayPlanner(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setShowDayPlanner(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const dateKey = getLocalDateString(selectedDate);
            const dayData = mealData[dateKey];
            const mealsToShow = isHistoryMode ? dayData?.logged : dayData?.planned;

            if (!mealsToShow || Object.values(mealsToShow).every(items => !items || items.length === 0)) {
              return (
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyModalText}>
                    {isHistoryMode ? '📅 No meals logged on this date' : '📆 No meals planned for this date'}
                  </Text>
                  <Text style={styles.emptyModalSubtext}>
                    {isHistoryMode ? 'Check other dates for your meal history' : 'Go to Today tab to plan meals for this date'}
                  </Text>
                </View>
              );
            }

            return (
              <View>
                {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                  const items = mealsToShow[mealType] || [];
                  if (items.length === 0) return null;

                  const mealTotal = items.reduce((sum, item) => sum + (item.calories || 0), 0);
                  const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                  const mealIcon = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' }[mealType];

                  return (
                    <StyledCard key={mealType} style={styles.modalMealCard}>
                      <View style={styles.modalMealHeader}>
                        <Text style={styles.modalMealTitle}>{mealIcon} {mealName}</Text>
                        <Text style={styles.modalMealTotal}>{mealTotal} cal</Text>
                      </View>
                      {items.map((food, index) => (
                        <View key={index} style={styles.modalFoodItem}>
                          <Text style={styles.modalFoodName}>{food.name}</Text>
                          <View style={styles.modalFoodMacros}>
                            <Text style={styles.modalFoodCal}>{food.calories || 0} cal</Text>
                            {food.protein ? <Text style={styles.modalFoodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                            {food.carbs ? <Text style={styles.modalFoodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                            {food.fat ? <Text style={styles.modalFoodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                          </View>
                        </View>
                      ))}
                    </StyledCard>
                  );
                })}
              </View>
            );
          })()}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dateCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  dateCardCals: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  mealIconsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mealIcon: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    padding: Spacing.sm,
  },
  modalPlaceholder: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  emptyModal: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyModalSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalMealCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '30',
  },
  modalMealTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  modalMealTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalFoodItem: {
    paddingVertical: Spacing.xs,
  },
  modalFoodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  modalFoodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  modalFoodCal: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalFoodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
