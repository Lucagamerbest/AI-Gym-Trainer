import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MEAL_PLAN_TEMPLATES_KEY = '@meal_plan_templates';
const MEAL_PLANS_KEY = '@meal_plans';

export default function MealPlanTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [weeksToSchedule, setWeeksToSchedule] = useState(4);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Reload templates when screen comes into focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTemplates();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTemplates = async () => {
    try {
      const saved = await AsyncStorage.getItem(MEAL_PLAN_TEMPLATES_KEY);
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading meal plan templates:', error);
    }
  };

  const deleteTemplate = (templateId) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this meal plan template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = templates.filter(t => t.id !== templateId);
              await AsyncStorage.setItem(MEAL_PLAN_TEMPLATES_KEY, JSON.stringify(updated));
              setTemplates(updated);
              Alert.alert('Success', 'Template deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const scheduleTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      const startDate = new Date();
      const daysToSchedule = weeksToSchedule * 7;
      let scheduledCount = 0;

      for (let i = 0; i < daysToSchedule; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0];

        // Calculate which day of the template to use (cycling through template days)
        const templateDayIndex = i % selectedTemplate.days.length;
        const templateDay = selectedTemplate.days[templateDayIndex];

        // Add planned meals for this date
        mealPlans[dateKey] = {
          ...mealPlans[dateKey],
          planned: templateDay.meals
        };
        scheduledCount++;
      }

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
      setShowScheduleModal(false);
      setSelectedTemplate(null);

      Alert.alert(
        'Success',
        `Scheduled ${scheduledCount} days of meal plans`,
        [
          {
            text: 'View Calendar',
            onPress: () => {
              navigation.navigate('MealsHistory');
            }
          },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error scheduling template:', error);
      Alert.alert('Error', 'Failed to schedule meal plan');
    }
  };

  const quickApplyToday = async (template) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};

      // Use first day of template
      mealPlans[todayKey] = {
        ...mealPlans[todayKey],
        planned: template.days[0].meals
      };

      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
      Alert.alert('Success', 'Applied meal plan to today!', [
        {
          text: 'View',
          onPress: () => navigation.navigate('Nutrition')
        },
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('Error applying template:', error);
      Alert.alert('Error', 'Failed to apply meal plan');
    }
  };

  const getTotalNutrition = (template) => {
    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    template.days.forEach(day => {
      Object.values(day.meals).forEach(meals => {
        meals.forEach(food => {
          totalCals += food.calories || 0;
          totalProtein += food.protein || 0;
          totalCarbs += food.carbs || 0;
          totalFat += food.fat || 0;
        });
      });
    });

    const avgCals = Math.round(totalCals / template.days.length);
    const avgProtein = Math.round((totalProtein / template.days.length) * 10) / 10;
    const avgCarbs = Math.round((totalCarbs / template.days.length) * 10) / 10;
    const avgFat = Math.round((totalFat / template.days.length) * 10) / 10;

    return { avgCals, avgProtein, avgCarbs, avgFat };
  };

  return (
    <ScreenLayout
      title="Meal Plan Templates"
      subtitle="Create and schedule meal plans"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            // Generate unique screen ID for this template creation session
            const screenId = `template_${Date.now()}`;
            navigation.navigate('CreateMealPlan', { screenId });
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonIcon}>➕</Text>
            <Text style={styles.createButtonText}>Create Meal Plan Template</Text>
          </LinearGradient>
        </TouchableOpacity>

        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Templates Yet</Text>
            <Text style={styles.emptyText}>
              Create reusable meal plan templates to quickly schedule your nutrition
            </Text>
          </View>
        ) : (
          <View style={styles.templatesContainer}>
            {templates.map((template) => {
              const nutrition = getTotalNutrition(template);
              return (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateCard}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('CreateMealPlan', { template, editMode: true })}
                >
                  <LinearGradient
                    colors={[Colors.primary + '10', Colors.primary + '05']}
                    style={styles.templateGradient}
                  >
                    <View style={styles.templateHeader}>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        {template.description && (
                          <Text style={styles.templateDescription}>{template.description}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.templateStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{template.days.length}</Text>
                        <Text style={styles.statLabel}>Days</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{nutrition.avgCals}</Text>
                        <Text style={styles.statLabel}>Avg Cal/Day</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{nutrition.avgProtein}g</Text>
                        <Text style={styles.statLabel}>Avg Protein</Text>
                      </View>
                    </View>

                    <View style={styles.templateActions}>
                      <TouchableOpacity
                        style={styles.applyTodayButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          quickApplyToday(template);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.applyTodayIcon}>📅</Text>
                        <Text style={styles.applyTodayText}>Apply Today</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                          setShowScheduleModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.scheduleIcon}>🗓️</Text>
                        <Text style={styles.scheduleText}>Schedule</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Meal Plan</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTemplate?.name}
            </Text>

            <View style={styles.weeksSelector}>
              <Text style={styles.weeksSelectorLabel}>Schedule for:</Text>
              <View style={styles.weekButtons}>
                {[1, 2, 4, 8].map((weeks) => (
                  <TouchableOpacity
                    key={weeks}
                    style={[
                      styles.weekButton,
                      weeksToSchedule === weeks && styles.weekButtonActive
                    ]}
                    onPress={() => setWeeksToSchedule(weeks)}
                  >
                    <Text style={[
                      styles.weekButtonText,
                      weeksToSchedule === weeks && styles.weekButtonTextActive
                    ]}>
                      {weeks} week{weeks > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.scheduleInfo}>
              This will schedule {selectedTemplate?.days.length || 0}-day plan repeating for {weeksToSchedule} week{weeksToSchedule > 1 ? 's' : ''}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowScheduleModal(false);
                  setSelectedTemplate(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={scheduleTemplate}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>Schedule</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  createButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  createButtonIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  createButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  templatesContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  templateCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templateGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  templateStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  templateActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  applyTodayButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyTodayIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  applyTodayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  scheduleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    flexShrink: 0,
  },
  deleteButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  deleteIcon: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  weeksSelector: {
    marginBottom: Spacing.lg,
  },
  weeksSelectorLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  weekButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  weekButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  weekButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weekButtonTextActive: {
    color: Colors.background,
  },
  scheduleInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
