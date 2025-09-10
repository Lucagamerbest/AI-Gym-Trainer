import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function MealsHistoryScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('meals');
  
  const meals = [
    { id: 1, type: 'Breakfast', name: 'Oatmeal and banana', calories: 350, time: '8:00 AM' },
    { id: 2, type: 'Lunch', name: 'Grilled Chicken and rice', calories: 650, time: '1:00 PM' },
    { id: 3, type: 'Dinner', name: 'Salmon and vegetables', calories: 450, time: '7:00 PM' },
  ];

  const history = [
    { id: 1, date: 'Today', calories: 1450, meals: 3 },
    { id: 2, date: 'Yesterday', calories: 1680, meals: 4 },
    { id: 3, date: 'Dec 15', calories: 1520, meals: 3 },
  ];

  const renderMealItem = ({ item }) => (
    <StyledCard style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={styles.mealType}>{item.type}</Text>
          <Text style={styles.mealName}>{item.name}</Text>
        </View>
        <View style={styles.mealDetails}>
          <Text style={styles.mealCalories}>{item.calories} cal</Text>
          <Text style={styles.mealTime}>{item.time}</Text>
        </View>
      </View>
    </StyledCard>
  );

  const renderHistoryItem = ({ item }) => (
    <StyledCard style={styles.historyCard}>
      <View style={styles.historyRow}>
        <View>
          <Text style={styles.historyDate}>{item.date}</Text>
          <Text style={styles.historyStats}>{item.meals} meals • {item.calories} cal</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.viewDetails}>View →</Text>
        </TouchableOpacity>
      </View>
    </StyledCard>
  );

  return (
    <ScreenLayout
      title="My Meals & History"
      subtitle="Track your nutrition journey"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={false}
    >
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
          onPress={() => setActiveTab('meals')}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
            My Meals
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'meals' ? (
        <>
          <FlatList
            data={meals}
            renderItem={renderMealItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.actions}>
            <StyledButton
              title="Add Meal"
              icon="+"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('SearchFood')}
              style={styles.actionButton}
            />
            
            <StyledButton
              title="Discover More Meals"
              icon="🔍"
              size="lg"
              variant="secondary"
              fullWidth
              onPress={() => {}}
            />
          </View>
        </>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your meals to see your history</Text>
            </View>
          }
        />
      )}
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
  listContainer: {
    paddingBottom: Spacing.lg,
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
    marginBottom: Spacing.xs,
  },
  mealTime: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  historyCard: {
    marginBottom: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  historyStats: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  viewDetails: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  actions: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
});