import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import MacroGoalsModal from '../components/MacroGoalsModal';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MACROS_KEY = '@macro_goals';

export default function NutritionScreen({ navigation }) {
  const [consumed] = useState(0); // Will be updated when food tracking is implemented
  const [burned] = useState(0); // Will be updated when exercise tracking is implemented
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroGoals, setMacroGoals] = useState({
    calories: 2000,
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 65,
  });
  const [consumedMacros] = useState({
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
  });

  useEffect(() => {
    loadMacroGoals();
  }, []);

  const loadMacroGoals = async () => {
    try {
      const saved = await AsyncStorage.getItem(MACROS_KEY);
      if (saved) {
        setMacroGoals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading macro goals:', error);
    }
  };

  const handleSaveMacros = (newGoals) => {
    setMacroGoals(newGoals);
  };

  const calculateProgress = (consumed, goal) => {
    if (goal === 0) return 0;
    return Math.min(100, Math.round((consumed / goal) * 100));
  };

  const proteinProgress = calculateProgress(consumedMacros.proteinGrams, macroGoals.proteinGrams);
  const carbsProgress = calculateProgress(consumedMacros.carbsGrams, macroGoals.carbsGrams);
  const fatProgress = calculateProgress(consumedMacros.fatGrams, macroGoals.fatGrams);
  const calorieDeficit = macroGoals.calories - consumed - burned;

  return (
    <ScreenLayout
      title="Nutrition Tracker"
      subtitle="Track your daily intake"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <TouchableOpacity onPress={() => setShowMacroModal(true)}>
        <StyledCard style={styles.statsCard}>
          <View style={styles.editIndicator}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Goal</Text>
              <Text style={styles.statValue}>{macroGoals.calories}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Consumed</Text>
              <Text style={styles.statValue}>{consumed}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Burned</Text>
              <Text style={styles.statValue}>{burned}</Text>
              <Text style={styles.statUnit}>cal</Text>
            </View>
          </View>
          <Text style={[styles.deficitText, calorieDeficit > 0 ? styles.deficitPositive : styles.deficitNegative]}>
            {calorieDeficit > 0 ? 'Deficit' : 'Surplus'}: {Math.abs(calorieDeficit)} cal
          </Text>
        </StyledCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowMacroModal(true)}>
        <StyledCard title="Macros" style={styles.macroCard}>
          <View style={styles.editIndicator}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${proteinProgress}%` }]} />
            </View>
            <Text style={styles.macroValue}>
              {consumedMacros.proteinGrams}/{macroGoals.proteinGrams}g
            </Text>
          </View>

          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.progressBarCarbs, { width: `${carbsProgress}%` }]} />
            </View>
            <Text style={styles.macroValue}>
              {consumedMacros.carbsGrams}/{macroGoals.carbsGrams}g
            </Text>
          </View>

          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Fat</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, styles.progressBarFat, { width: `${fatProgress}%` }]} />
            </View>
            <Text style={styles.macroValue}>
              {consumedMacros.fatGrams}/{macroGoals.fatGrams}g
            </Text>
          </View>
        </StyledCard>
      </TouchableOpacity>

      <StyledCard
        icon="📷"
        title="Scan Food"
        subtitle="Instant nutrition info"
        onPress={() => navigation.navigate('FoodScanning')}
      />
      
      <StyledCard
        icon="🔍"
        title="Search & Add"
        subtitle="Find from database"
        onPress={() => navigation.navigate('SearchFood')}
      />
      
      <StyledButton
        title="My Meals & History"
        icon="📊"
        size="lg"
        fullWidth
        onPress={() => navigation.navigate('MealsHistory')}
        style={styles.historyButton}
      />

      <MacroGoalsModal
        visible={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        onSave={handleSaveMacros}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    alignItems: 'center',
    position: 'relative',
  },
  editIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  editIcon: {
    fontSize: Typography.fontSize.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  statUnit: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  deficitText: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  deficitPositive: {
    color: Colors.success,
  },
  deficitNegative: {
    color: Colors.warning,
  },
  macroCard: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    width: 60,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  progressBarCarbs: {
    backgroundColor: Colors.warning,
  },
  progressBarFat: {
    backgroundColor: Colors.success,
  },
  macroValue: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    minWidth: 70,
    textAlign: 'right',
  },
  historyButton: {
    marginTop: Spacing.md,
  },
});