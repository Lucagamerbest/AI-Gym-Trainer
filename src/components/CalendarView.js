import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function CalendarView({ selectedDate, onDateSelect, mealData = {}, multiSelectMode = false, selectedDates = [], highlightedDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get calendar grid data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month's trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Add trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Add current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Add leading days from next month
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (multiSelectMode) {
      const dateKey = date.toISOString().split('T')[0];
      return selectedDates.some(d => d.toISOString().split('T')[0] === dateKey);
    }
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const getMealDataForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return mealData[dateKey] || null;
  };

  const isHighlighted = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return highlightedDates.includes(dateKey);
  };

  const renderDayCell = (item, index) => {
    const { date, isCurrentMonth } = item;
    const dayMealData = getMealDataForDate(date);
    const hasLoggedMeals = dayMealData?.logged && Object.values(dayMealData.logged).some(meals => meals && meals.length > 0);
    const hasPlannedMeals = dayMealData?.planned && Object.values(dayMealData.planned).some(meals => meals && meals.length > 0);
    const futureDate = isFutureDate(date);
    const highlighted = isHighlighted(date);

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayCell,
          !isCurrentMonth && styles.dayCellInactive,
          isToday(date) && styles.dayCellToday,
          isSelected(date) && styles.dayCellSelected,
          highlighted && styles.dayCellHighlighted,
        ]}
        onPress={() => onDateSelect(date)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.dayTextInactive,
            isToday(date) && styles.dayTextToday,
            isSelected(date) && styles.dayTextSelected,
            highlighted && styles.dayTextHighlighted,
          ]}
        >
          {date.getDate()}
        </Text>
        <View style={styles.indicators}>
          {hasLoggedMeals && (
            <View style={[styles.indicator, styles.indicatorLogged]} />
          )}
          {hasPlannedMeals && (
            <View style={[styles.indicator, styles.indicatorPlanned]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7}>
          <Text style={styles.monthText}>{monthName}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, styles.indicatorLogged]} />
          <Text style={styles.legendText}>Logged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, styles.indicatorPlanned]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
      </View>

      {/* Day Headers */}
      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {calendarData.map((item, index) => renderDayCell(item, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  navButton: {
    padding: Spacing.md,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '600',
  },
  monthText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  weekDayText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 44,
  },
  dayCellInactive: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  dayCellHighlighted: {
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: '#991B1B',
  },
  dayText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  dayTextInactive: {
    color: Colors.textMuted,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  dayTextHighlighted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  indicators: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorLogged: {
    backgroundColor: '#4CAF50',
  },
  indicatorPlanned: {
    backgroundColor: '#FF9800',
  },
});
