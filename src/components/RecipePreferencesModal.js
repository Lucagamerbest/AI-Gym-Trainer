import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECIPE_PREFERENCES_KEY = '@recipe_preferences';

/**
 * RecipePreferencesModal
 * Allows users to define their own criteria for recipe types:
 * - High-protein: minimum protein (g), maximum calories
 * - Low-calorie: minimum protein (g), maximum calories
 * - Balanced: minimum protein (g), maximum calories
 */
export default function RecipePreferencesModal({ visible, onClose }) {
  const [preferences, setPreferences] = useState({
    highProtein: {
      protein: 50,
      calories: 600,
    },
    lowCalorie: {
      protein: 30,
      calories: 400,
    },
    balanced: {
      protein: 40,
      calories: 600,
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
      } else {
        // No saved preferences, use defaults
        setPreferences({
          highProtein: {
            protein: 50,
            calories: 600,
          },
          lowCalorie: {
            protein: 30,
            calories: 400,
          },
          balanced: {
            protein: 40,
            calories: 600,
          },
        });
      }
    } catch (error) {
      console.error('Error loading recipe preferences:', error);
      // On error, set defaults
      setPreferences({
        highProtein: {
          protein: 50,
          calories: 600,
        },
        lowCalorie: {
          protein: 30,
          calories: 400,
        },
        balanced: {
          protein: 40,
          calories: 600,
        },
      });
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
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Recipe Preferences</Text>
                <Text style={styles.subtitle}>
                  Define your own criteria for recipe types
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.headerCellType}>
                <Text style={styles.headerText}>Type</Text>
              </View>
              <View style={styles.headerCellValue}>
                <Text style={styles.headerText}>Min Protein (g)</Text>
              </View>
              <View style={styles.headerCellValue}>
                <Text style={styles.headerText}>Max Calories</Text>
              </View>
            </View>

            {/* High-Protein Row */}
            <View style={styles.tableRow}>
              <View style={styles.typeCell}>
                <Text style={styles.typeIcon}>💪</Text>
                <Text style={styles.typeText}>High{'\n'}Protein</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.highProtein.protein || 50}g</Text>
                <Slider
                  minimumValue={10}
                  maximumValue={80}
                  step={5}
                  value={preferences.highProtein.protein || 50}
                  onValueChange={(value) => updatePreference('highProtein', 'protein', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.highProtein.calories || 600}</Text>
                <Slider
                  minimumValue={100}
                  maximumValue={1500}
                  step={50}
                  value={preferences.highProtein.calories || 600}
                  onValueChange={(value) => updatePreference('highProtein', 'calories', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
            </View>

            {/* Low-Calorie Row */}
            <View style={styles.tableRow}>
              <View style={styles.typeCell}>
                <Text style={styles.typeIcon}>🔥</Text>
                <Text style={styles.typeText}>Low{'\n'}Calorie</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.lowCalorie.protein || 30}g</Text>
                <Slider
                  minimumValue={10}
                  maximumValue={80}
                  step={5}
                  value={preferences.lowCalorie.protein || 30}
                  onValueChange={(value) => updatePreference('lowCalorie', 'protein', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.lowCalorie.calories || 400}</Text>
                <Slider
                  minimumValue={100}
                  maximumValue={1500}
                  step={50}
                  value={preferences.lowCalorie.calories || 400}
                  onValueChange={(value) => updatePreference('lowCalorie', 'calories', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
            </View>

            {/* Balanced Row */}
            <View style={styles.tableRow}>
              <View style={styles.typeCell}>
                <Text style={styles.typeIcon}>⚖️</Text>
                <Text style={styles.typeText} numberOfLines={1}>Balanced</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.balanced.protein || 40}g</Text>
                <Slider
                  minimumValue={10}
                  maximumValue={80}
                  step={5}
                  value={preferences.balanced.protein || 40}
                  onValueChange={(value) => updatePreference('balanced', 'protein', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{preferences.balanced.calories || 600}</Text>
                <Slider
                  minimumValue={100}
                  maximumValue={1500}
                  step={50}
                  value={preferences.balanced.calories || 600}
                  onValueChange={(value) => updatePreference('balanced', 'calories', value)}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                  style={styles.slider}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
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
  tableContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  headerCellType: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCellValue: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 90,
    paddingVertical: Spacing.md,
  },
  typeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 2,
  },
  valueCell: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  naText: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  valueText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actions: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
