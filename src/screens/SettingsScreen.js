import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function SettingsScreen({ navigation }) {
  const [displayMode, setDisplayMode] = useState('compact'); // 'compact' or 'detailed'

  // Load display mode preference on component mount
  useEffect(() => {
    loadDisplayMode();
  }, []);

  const loadDisplayMode = async () => {
    try {
      const saved = await AsyncStorage.getItem('exerciseDisplayMode');
      if (saved) {
        setDisplayMode(saved);
      }
    } catch (error) {
      console.error('Error loading display mode:', error);
    }
  };

  const saveDisplayMode = async (mode) => {
    try {
      await AsyncStorage.setItem('exerciseDisplayMode', mode);
      setDisplayMode(mode);
    } catch (error) {
      console.error('Error saving display mode:', error);
    }
  };

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Preferences & account"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <StyledCard variant="elevated" style={styles.displayOptionsCard}>
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

      {/* Other Settings Sections */}
      <StyledCard variant="elevated" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionSubtitle}>Manage your account settings</Text>
        {/* Add more account settings here */}
      </StyledCard>

      <StyledCard variant="elevated" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Text style={styles.sectionSubtitle}>Customize your app experience</Text>
        {/* Add more preference settings here */}
      </StyledCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  displayOptionsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionCard: {
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
});