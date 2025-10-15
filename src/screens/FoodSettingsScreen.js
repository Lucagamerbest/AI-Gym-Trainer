import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getNutritionGoals, updateNutritionGoals } from '../services/userProfileService';

export default function FoodSettingsScreen({ navigation }) {
  const { user } = useAuth();
  const [calorieGoal, setCalorieGoal] = useState('2000');
  const [proteinGoal, setProteinGoal] = useState('150');
  const [carbsGoal, setCarbsGoal] = useState('250');
  const [fatGoal, setFatGoal] = useState('65');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    try {
      const userId = user?.uid || 'guest';
      const goals = await getNutritionGoals(userId);
      setCalorieGoal(goals.calories.toString());
      setProteinGoal(goals.protein.toString());
      setCarbsGoal(goals.carbs.toString());
      setFatGoal(goals.fat.toString());
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const userId = user?.uid || 'guest';

      const goals = {
        calories: parseInt(calorieGoal) || 2000,
        protein: parseInt(proteinGoal) || 150,
        carbs: parseInt(carbsGoal) || 250,
        fat: parseInt(fatGoal) || 65,
      };

      const result = await updateNutritionGoals(userId, goals);

      if (result.success) {
        Alert.alert('Success', 'Your nutrition goals have been updated!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to save goals. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Nutrition Goals"
      subtitle="Set your daily targets"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Calorie Goal */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.goalLabel}>Daily Calorie Goal</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
              placeholder="2000"
            />
            <Text style={styles.unit}>calories</Text>
          </View>
          <Text style={styles.hint}>Recommended: 1500-2500 calories per day</Text>
        </StyledCard>

        {/* Macro Goals */}
        <StyledCard variant="elevated" style={styles.goalCard}>
          <Text style={styles.sectionTitle}>Macronutrient Goals</Text>

          {/* Protein */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="numeric"
                placeholder="150"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Carbohydrates</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={carbsGoal}
                onChangeText={setCarbsGoal}
                keyboardType="numeric"
                placeholder="250"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Fat</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.macroInput}
                value={fatGoal}
                onChangeText={setFatGoal}
                keyboardType="numeric"
                placeholder="65"
              />
              <Text style={styles.unit}>g</Text>
            </View>
          </View>
        </StyledCard>

        {/* Info Card */}
        <StyledCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Tip</Text>
          <Text style={styles.infoText}>
            Your goals are automatically saved per user account. Sign in to sync your goals across devices.
          </Text>
        </StyledCard>

        {/* Save Button */}
        <StyledButton
          title="Save Goals"
          onPress={handleSave}
          loading={isSaving}
          size="lg"
          fullWidth
          style={styles.saveButton}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  goalCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  goalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  macroInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  unit: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  macroLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    flex: 1,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.primary + '10',
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
