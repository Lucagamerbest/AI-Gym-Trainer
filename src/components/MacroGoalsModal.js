import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import StyledButton from './StyledButton';

const MACROS_KEY = '@macro_goals';
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

export default function MacroGoalsModal({ visible, onClose, onSave }) {
  const [calories, setCalories] = useState('2000');
  const [proteinGrams, setProteinGrams] = useState('150');
  const [carbsGrams, setCarbsGrams] = useState('250');
  const [fatGrams, setFatGrams] = useState('65');
  const [autoAdjust, setAutoAdjust] = useState(true);

  useEffect(() => {
    loadSavedGoals();
  }, []);

  useEffect(() => {
    if (autoAdjust) {
      calculateFromCalories();
    }
  }, [calories, autoAdjust]);

  const loadSavedGoals = async () => {
    try {
      const saved = await AsyncStorage.getItem(MACROS_KEY);
      if (saved) {
        const goals = JSON.parse(saved);
        setCalories(goals.calories.toString());
        setProteinGrams(goals.proteinGrams.toString());
        setCarbsGrams(goals.carbsGrams.toString());
        setFatGrams(goals.fatGrams.toString());
      }
    } catch (error) {
    }
  };

  const calculateFromCalories = () => {
    const cal = parseFloat(calories) || 0;

    // Standard macro split: 30% protein, 40% carbs, 30% fat
    const proteinCal = cal * 0.30;
    const carbsCal = cal * 0.40;
    const fatCal = cal * 0.30;

    setProteinGrams(Math.round(proteinCal / CALORIES_PER_GRAM.protein).toString());
    setCarbsGrams(Math.round(carbsCal / CALORIES_PER_GRAM.carbs).toString());
    setFatGrams(Math.round(fatCal / CALORIES_PER_GRAM.fat).toString());
  };

  const calculateTotalCalories = (p = proteinGrams, c = carbsGrams, f = fatGrams) => {
    const protein = parseFloat(p) || 0;
    const carbs = parseFloat(c) || 0;
    const fat = parseFloat(f) || 0;

    return (
      protein * CALORIES_PER_GRAM.protein +
      carbs * CALORIES_PER_GRAM.carbs +
      fat * CALORIES_PER_GRAM.fat
    );
  };

  const handleMacroChange = (macro, value) => {
    setAutoAdjust(false);

    let newProtein = proteinGrams;
    let newCarbs = carbsGrams;
    let newFat = fatGrams;

    switch (macro) {
      case 'protein':
        setProteinGrams(value);
        newProtein = value;
        break;
      case 'carbs':
        setCarbsGrams(value);
        newCarbs = value;
        break;
      case 'fat':
        setFatGrams(value);
        newFat = value;
        break;
    }

    // Update calories based on new macro values
    const newCalories = calculateTotalCalories(newProtein, newCarbs, newFat);
    setCalories(Math.round(newCalories).toString());
  };

  const handleCalorieChange = (value) => {
    setCalories(value);
    setAutoAdjust(true);
  };

  const getPercentages = () => {
    const total = calculateTotalCalories();
    if (total === 0) return { protein: 0, carbs: 0, fat: 0 };

    const p = parseFloat(proteinGrams) || 0;
    const c = parseFloat(carbsGrams) || 0;
    const f = parseFloat(fatGrams) || 0;

    return {
      protein: Math.round((p * CALORIES_PER_GRAM.protein / total) * 100),
      carbs: Math.round((c * CALORIES_PER_GRAM.carbs / total) * 100),
      fat: Math.round((f * CALORIES_PER_GRAM.fat / total) * 100),
    };
  };

  const handleSave = async () => {
    const goals = {
      calories: parseFloat(calories) || 2000,
      proteinGrams: parseFloat(proteinGrams) || 150,
      carbsGrams: parseFloat(carbsGrams) || 250,
      fatGrams: parseFloat(fatGrams) || 65,
    };

    try {
      await AsyncStorage.setItem(MACROS_KEY, JSON.stringify(goals));
      onSave(goals);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save macro goals');
    }
  };

  const percentages = getPercentages();
  const actualCalories = calculateTotalCalories();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={100}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Macro Goals</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Calorie Target</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={handleCalorieChange}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={Colors.textMuted}
              />
              {!autoAdjust && (
                <Text style={styles.helper}>
                  Based on macros: {Math.round(actualCalories)} cal
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Protein</Text>
              <View style={styles.macroRow}>
                <TextInput
                  style={[styles.input, styles.macroInput]}
                  value={proteinGrams}
                  onChangeText={(value) => handleMacroChange('protein', value)}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.unit}>grams</Text>
                <Text style={styles.percentage}>{percentages.protein}%</Text>
              </View>
              <Text style={styles.helper}>
                {proteinGrams}g × 4 cal/g = {Math.round(parseFloat(proteinGrams || 0) * 4)} cal
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Carbohydrates</Text>
              <View style={styles.macroRow}>
                <TextInput
                  style={[styles.input, styles.macroInput]}
                  value={carbsGrams}
                  onChangeText={(value) => handleMacroChange('carbs', value)}
                  keyboardType="numeric"
                  placeholder="250"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.unit}>grams</Text>
                <Text style={styles.percentage}>{percentages.carbs}%</Text>
              </View>
              <Text style={styles.helper}>
                {carbsGrams}g × 4 cal/g = {Math.round(parseFloat(carbsGrams || 0) * 4)} cal
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fat</Text>
              <View style={styles.macroRow}>
                <TextInput
                  style={[styles.input, styles.macroInput]}
                  value={fatGrams}
                  onChangeText={(value) => handleMacroChange('fat', value)}
                  keyboardType="numeric"
                  placeholder="65"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.unit}>grams</Text>
                <Text style={styles.percentage}>{percentages.fat}%</Text>
              </View>
              <Text style={styles.helper}>
                {fatGrams}g × 9 cal/g = {Math.round(parseFloat(fatGrams || 0) * 9)} cal
              </Text>
            </View>

            {Math.abs(percentages.protein + percentages.carbs + percentages.fat - 100) > 1 && (
              <View style={styles.summary}>
                <Text style={styles.warning}>
                  ⚠️ Percentages should add up to 100%
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <StyledButton
                title="Cancel"
                variant="secondary"
                onPress={onClose}
                style={styles.button}
              />
              <StyledButton
                title="Save Goals"
                onPress={handleSave}
                style={styles.button}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroInput: {
    flex: 1,
  },
  unit: {
    marginLeft: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    width: 50,
  },
  percentage: {
    marginLeft: Spacing.md,
    color: Colors.primary,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    width: 45,
    textAlign: 'right',
  },
  helper: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  summary: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warning: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
});