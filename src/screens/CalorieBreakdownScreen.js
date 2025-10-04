import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function CalorieBreakdownScreen({ route, navigation }) {
  const { meals: initialMeals, totalCalories: initialTotal } = route.params || {};

  const [meals, setMeals] = useState(initialMeals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [totalCalories, setTotalCalories] = useState(initialTotal || 0);
  const [deleteModal, setDeleteModal] = useState({ visible: false, title: '', message: '', onConfirm: null });

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


  const renderMealSection = (mealType, mealItems) => {
    if (!mealItems || mealItems.length === 0) return null;

    const mealTotal = mealItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    const mealName = mealType.charAt(0).toUpperCase() + mealType.slice(1);

    return (
      <StyledCard key={mealType} style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <Text style={styles.mealTitle}>{mealName}</Text>
            <Text style={styles.mealTotal}>{mealTotal} cal</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteMealButton}
            onPress={() => handleDeleteMeal(mealType)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.foodsList}>
          {mealItems.map((food, index) => (
            <View key={index} style={styles.foodRow}>
              <View style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
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

      {/* Meals Breakdown */}
      <View style={styles.mealsContainer}>
        {Object.entries(meals).map(([mealType, mealItems]) =>
          renderMealSection(mealType, mealItems)
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
  mealTotal: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
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
  foodItem: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  foodInfo: {
    flex: 1,
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