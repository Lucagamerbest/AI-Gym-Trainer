import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function CalorieBreakdownScreen({ route, navigation }) {
  const { meals: initialMeals, totalCalories: initialTotal, plannedMeals: initialPlannedMeals } = route.params || {};

  const [meals, setMeals] = useState(initialMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [plannedMeals, setPlannedMeals] = useState(initialPlannedMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [totalCalories, setTotalCalories] = useState(initialTotal || 0);
  const [deleteModal, setDeleteModal] = useState({ visible: false, title: '', message: '', onConfirm: null });
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'logged', 'planned'

  // Recalculate total calories whenever meals change
  useEffect(() => {
    const newTotal = Object.values(meals).reduce((sum, mealItems) => {
      return sum + mealItems.reduce((mealSum, item) => mealSum + (item.calories || 0), 0);
    }, 0);
    setTotalCalories(newTotal);
  }, [meals]);

  // Helper function to navigate back to Nutrition after delete/edit
  const navigateToNutrition = (params) => {
    setDeleteModal({ visible: false, title: '', message: '', onConfirm: null });
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Main' },
        { name: 'Nutrition', params }
      ]
    });
  };

  const handleDeleteFood = async (mealType, foodIndex, foodName, foodCalories) => {
    setDeleteModal({
      visible: true,
      title: 'Delete Food',
      message: `Are you sure you want to delete "${foodName}" (${foodCalories} cal) from ${mealType}?`,
      onConfirm: async () => {
        const updatedMeals = { ...meals };
        updatedMeals[mealType] = [...updatedMeals[mealType]];
        updatedMeals[mealType].splice(foodIndex, 1);
        setMeals(updatedMeals);

        navigateToNutrition({ deleteFood: { mealType, foodIndex } });
      }
    });
  };

  const handleDeleteMeal = (mealType) => {
    const mealItems = meals[mealType] || [];
    if (mealItems.length === 0) return;

    const mealCalories = mealItems.reduce((sum, item) => sum + (item.calories || 0), 0);

    setDeleteModal({
      visible: true,
      title: 'Delete Entire Meal',
      message: `Are you sure you want to delete all items from ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${mealCalories} cal)?`,
      onConfirm: () => {
        const updatedMeals = { ...meals };
        updatedMeals[mealType] = [];
        setMeals(updatedMeals);

        navigateToNutrition({ deleteMeal: { mealType } });
      }
    });
  };

  const handleEditFood = (mealType, foodIndex, food) => {
    navigation.navigate('EditFoodItem', {
      foodItem: food,
      mealType: mealType,
      foodIndex: foodIndex,
      returnScreen: 'CalorieBreakdown'
    });
  };

  // Refresh data when coming back from EditFoodItem
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.meals && route.params?.totalCalories !== undefined) {
        setMeals(route.params.meals);
        setTotalCalories(route.params.totalCalories);
      }
    }, [route.params])
  );


  const renderMealSection = (mealType) => {
    const loggedItems = meals[mealType] || [];
    const plannedItems = plannedMeals[mealType] || [];

    // Apply filter
    const showLogged = filterMode === 'all' || filterMode === 'logged';
    const showPlanned = filterMode === 'all' || filterMode === 'planned';

    const filteredLoggedItems = showLogged ? loggedItems : [];
    const filteredPlannedItems = showPlanned ? plannedItems : [];

    if (filteredLoggedItems.length === 0 && filteredPlannedItems.length === 0) return null;

    const loggedTotal = filteredLoggedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const plannedTotal = filteredPlannedItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const mealTotal = loggedTotal + plannedTotal;
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);

    return (
      <StyledCard key={mealType} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{mealName}</Text>
            <View style={styles.mealTotalContainer}>
              <Text style={styles.mealTotal}>{mealTotal} cal</Text>
              {showLogged && showPlanned && loggedItems.length > 0 && plannedItems.length > 0 && (
                <Text style={styles.mealBreakdown}>
                  ({loggedTotal} logged • {plannedTotal} planned)
                </Text>
              )}
            </View>
          </View>
          {loggedItems.length > 0 && (
            <TouchableOpacity
              style={styles.deleteMealButton}
              onPress={() => handleDeleteMeal(mealType)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Delete All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.foodsList}>
          {/* Logged meals */}
          {filteredLoggedItems.map((food, index) => (
            <View key={`logged-${index}`} style={styles.foodRow}>
              <View style={[styles.statusBadge, styles.statusBadgeLogged]}>
                <Text style={styles.statusBadgeText}>✓</Text>
              </View>
              <View style={[styles.foodItem, styles.foodItemLogged]}>
                <View style={styles.foodInfo}>
                  <View style={styles.foodNameRow}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.statusPill}>Logged</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodCalories}>{food.calories || 0} cal</Text>
                    {food.protein ? <Text style={styles.foodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                    {food.carbs ? <Text style={styles.foodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                    {food.fat ? <Text style={styles.foodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                  </View>
                </View>
              </View>
              <View style={styles.actionZone}>
                <TouchableOpacity
                  style={styles.editFoodButton}
                  onPress={() => handleEditFood(mealType, index, food)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editFoodButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteFoodButton}
                  onPress={() => handleDeleteFood(mealType, index, food.name, food.calories)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteFoodButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Planned meals */}
          {filteredPlannedItems.map((food, index) => (
            <View key={`planned-${index}`} style={styles.foodRow}>
              <View style={[styles.statusBadge, styles.statusBadgePlanned]}>
                <Text style={styles.statusBadgeText}>📅</Text>
              </View>
              <View style={[styles.foodItem, styles.foodItemPlanned]}>
                <View style={styles.foodInfo}>
                  <View style={styles.foodNameRow}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={[styles.statusPill, styles.statusPillPlanned]}>Planned</Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={[styles.foodCalories, styles.foodCaloriesPlanned]}>{food.calories || 0} cal</Text>
                    {food.protein ? <Text style={styles.foodMacro}>P: {parseFloat(food.protein).toFixed(1)}g</Text> : null}
                    {food.carbs ? <Text style={styles.foodMacro}>C: {parseFloat(food.carbs).toFixed(1)}g</Text> : null}
                    {food.fat ? <Text style={styles.foodMacro}>F: {parseFloat(food.fat).toFixed(1)}g</Text> : null}
                  </View>
                </View>
              </View>
              <View style={styles.actionZone}>
                <TouchableOpacity
                  style={[styles.editFoodButton, styles.editFoodButtonPlanned]}
                  onPress={() => handleEditFood(mealType, index, food)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editFoodButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteFoodButton}
                  onPress={() => handleDeleteFood(mealType, index, food.name, food.calories)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteFoodButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </StyledCard>
    );
  };

  return (
    <ScreenLayout
      title="Calorie Breakdown"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      {/* Total Summary */}
      <StyledCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Daily Total</Text>
          <Text style={styles.summaryCalories}>{totalCalories} calories</Text>
        </View>
      </StyledCard>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'logged' && styles.filterButtonActive]}
          onPress={() => setFilterMode('logged')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'logged' && styles.filterButtonTextActive]}>
            ✓ Logged
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'planned' && styles.filterButtonActive]}
          onPress={() => setFilterMode('planned')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filterMode === 'planned' && styles.filterButtonTextActive]}>
            📅 Planned
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meals Breakdown */}
      <View style={styles.mealsContainer}>
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) =>
          renderMealSection(mealType)
        )}
      </View>

      {totalCalories === 0 && (
        <StyledCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>No foods logged today</Text>
          <Text style={styles.emptySubtext}>Start adding foods to track your nutrition</Text>
        </StyledCard>
      )}

      {/* Custom Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteModal.visible}
        animationType="fade"
        onRequestClose={() => setDeleteModal({ visible: false, title: '', message: '', onConfirm: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{deleteModal.title}</Text>
            <Text style={styles.modalMessage}>{deleteModal.message}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModal({ visible: false, title: '', message: '', onConfirm: null })}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={deleteModal.onConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryCalories: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  mealsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  mealCard: {
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  mealTotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  mealTotal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  mealBreakdown: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  deleteMealButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  foodsList: {
    gap: Spacing.xs,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusBadgeLogged: {
    backgroundColor: '#4CAF50',
  },
  statusBadgePlanned: {
    backgroundColor: '#FF9800',
  },
  statusBadgeText: {
    fontSize: 14,
  },
  foodItem: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  foodItemLogged: {
    backgroundColor: '#4CAF50' + '15',
    borderColor: '#4CAF50' + '40',
    borderWidth: 2,
  },
  foodItemPlanned: {
    backgroundColor: '#FF9800' + '10',
    borderColor: '#FF9800',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: Spacing.xs,
  },
  statusPill: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: '600',
    color: Colors.background,
    overflow: 'hidden',
  },
  statusPillPlanned: {
    backgroundColor: '#FF9800',
  },
  actionZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  editFoodButton: {
    backgroundColor: Colors.primary + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editFoodButtonPlanned: {
    backgroundColor: '#FF9800' + '20',
    borderColor: '#FF9800' + '40',
  },
  editFoodButtonText: {
    fontSize: 16,
  },
  foodName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
    flexShrink: 1,
    numberOfLines: 2,
  },
  foodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  foodCalories: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  foodCaloriesPlanned: {
    color: '#FF9800',
  },
  foodMacro: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deleteFoodButton: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deleteFoodButtonText: {
    fontSize: 18,
  },
  emptyCard: {
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  modalMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalCancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  modalDeleteButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modalDeleteText: {
    fontSize: Typography.fontSize.md,
    color: Colors.background,
    fontWeight: '600',
  },
});