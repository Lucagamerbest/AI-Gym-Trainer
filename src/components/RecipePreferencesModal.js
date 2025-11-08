import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECIPE_PREFERENCES_KEY = '@recipe_preferences';

/**
 * RecipePreferencesModal
 * Allows users to define their own criteria for recipe types:
 * - High-protein: protein target, calorie limit
 * - Low-calorie: calorie limit
 * - Balanced: protein/carbs/fat targets
 */
export default function RecipePreferencesModal({ visible, onClose }) {
  const [preferences, setPreferences] = useState({
    highProtein: {
      protein: '50',
      calories: '600',
    },
    lowCalorie: {
      calories: '400',
    },
    balanced: {
      protein: '40',
      carbs: '50',
      fat: '20',
    },
  });

  const [saving, setSaving] = useState(false);

  // Load preferences when modal opens
  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECIPE_PREFERENCES_KEY);
      if (saved) {
        const loadedPrefs = JSON.parse(saved);
        setPreferences(loadedPrefs);
      }
    } catch (error) {
      console.error('Error loading recipe preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(RECIPE_PREFERENCES_KEY, JSON.stringify(preferences));
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error saving recipe preferences:', error);
      setSaving(false);
    }
  };

  const updatePreference = (type, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Recipe Preferences</Text>
            <Text style={styles.subtitle}>
              Define your own criteria for recipe types
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* High-Protein Recipe */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💪</Text>
                <Text style={styles.sectionTitle}>High-Protein Recipe</Text>
              </View>
              <Text style={styles.sectionDescription}>
                What does "high-protein" mean to you?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Minimum Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.highProtein.protein}
                  onChangeText={(value) => updatePreference('highProtein', 'protein', value)}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Calories</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.highProtein.calories}
                  onChangeText={(value) => updatePreference('highProtein', 'calories', value)}
                  keyboardType="numeric"
                  placeholder="600"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Low-Calorie Recipe */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🔥</Text>
                <Text style={styles.sectionTitle}>Low-Calorie Recipe</Text>
              </View>
              <Text style={styles.sectionDescription}>
                What's your calorie limit for "low-calorie"?
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Calories</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.lowCalorie.calories}
                  onChangeText={(value) => updatePreference('lowCalorie', 'calories', value)}
                  keyboardType="numeric"
                  placeholder="400"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Balanced Recipe */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚖️</Text>
                <Text style={styles.sectionTitle}>Balanced Recipe</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Define your ideal macro balance
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.balanced.protein}
                  onChangeText={(value) => updatePreference('balanced', 'protein', value)}
                  keyboardType="numeric"
                  placeholder="40"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.balanced.carbs}
                  onChangeText={(value) => updatePreference('balanced', 'carbs', value)}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  value={preferences.balanced.fat}
                  onChangeText={(value) => updatePreference('balanced', 'fat', value)}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                These preferences will be used when you press recipe generation buttons like
                "High-protein recipe" or "Low-calorie recipe"
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '90%',
    paddingBottom: Spacing.xl,
  },
  header: {
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
