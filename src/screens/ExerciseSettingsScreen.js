import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const RPE_ENABLED_KEY = '@rpe_enabled';

export default function ExerciseSettingsScreen({ navigation }) {
  const [displayMode, setDisplayMode] = useState('compact'); // 'compact' or 'detailed'
  const [rpeEnabled, setRpeEnabled] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedDisplayMode = await AsyncStorage.getItem('exerciseDisplayMode');
      const savedRpeEnabled = await AsyncStorage.getItem(RPE_ENABLED_KEY);

      if (savedDisplayMode) {
        setDisplayMode(savedDisplayMode);
      }
      if (savedRpeEnabled !== null) {
        setRpeEnabled(savedRpeEnabled === 'true');
      }
    } catch (error) {
    }
  };

  const saveDisplayMode = async (mode) => {
    try {
      await AsyncStorage.setItem('exerciseDisplayMode', mode);
      setDisplayMode(mode);
    } catch (error) {
    }
  };

  const toggleRPE = async (value) => {
    try {
      await AsyncStorage.setItem(RPE_ENABLED_KEY, value.toString());
      setRpeEnabled(value);
    } catch (error) {
    }
  };

  return (
    <ScreenLayout
      title="Exercise Settings"
      subtitle="Customize your workout experience"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      {/* Exercise Display Options */}
      <StyledCard variant="elevated" style={styles.settingCard}>
        <Text style={styles.sectionTitle}>Exercise Display Options</Text>
        <Text style={styles.sectionSubtitle}>Choose how exercises are displayed in the library</Text>

        <View style={styles.optionContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              displayMode === 'compact' && styles.optionButtonSelected
            ]}
            onPress={() => saveDisplayMode('compact')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionEmoji}>⊞</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Compact View</Text>
                <Text style={styles.optionDescription}>2x2 grid, smaller exercises, more per screen</Text>
              </View>
              <View style={styles.radioButton}>
                {displayMode === 'compact' && <View style={styles.radioSelected} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              displayMode === 'detailed' && styles.optionButtonSelected
            ]}
            onPress={() => saveDisplayMode('detailed')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionEmoji}>📋</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Detailed View</Text>
                <Text style={styles.optionDescription}>One per row, larger with exercise images</Text>
              </View>
              <View style={styles.radioButton}>
                {displayMode === 'detailed' && <View style={styles.radioSelected} />}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </StyledCard>

      {/* RPE Settings */}
      <StyledCard variant="elevated" style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <View style={styles.settingHeaderLeft}>
            <Text style={styles.sectionTitle}>RPE Tracking</Text>
            <Text style={styles.sectionSubtitle}>Rate of Perceived Exertion (1-10 scale)</Text>
          </View>
          <Switch
            value={rpeEnabled}
            onValueChange={toggleRPE}
            trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
            thumbColor={rpeEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.rpeInfoBox}>
          <Text style={styles.rpeInfoTitle}>💪 What is RPE?</Text>
          <Text style={styles.rpeInfoText}>
            RPE (Rate of Perceived Exertion) is a scale from 1-10 that measures how hard you feel you're working during a set.
          </Text>
          <View style={styles.rpeScaleContainer}>
            <View style={styles.rpeScaleItem}>
              <Text style={styles.rpeScaleNumber}>1-3</Text>
              <Text style={styles.rpeScaleLabel}>Easy</Text>
            </View>
            <View style={styles.rpeScaleItem}>
              <Text style={styles.rpeScaleNumber}>4-6</Text>
              <Text style={styles.rpeScaleLabel}>Moderate</Text>
            </View>
            <View style={styles.rpeScaleItem}>
              <Text style={styles.rpeScaleNumber}>7-8</Text>
              <Text style={styles.rpeScaleLabel}>Hard</Text>
            </View>
            <View style={styles.rpeScaleItem}>
              <Text style={styles.rpeScaleNumber}>9-10</Text>
              <Text style={styles.rpeScaleLabel}>Max Effort</Text>
            </View>
          </View>
        </View>
      </StyledCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  settingCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  settingHeaderLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  optionContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  rpeInfoBox: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rpeInfoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  rpeInfoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  rpeScaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  rpeScaleItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  rpeScaleNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  rpeScaleLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
