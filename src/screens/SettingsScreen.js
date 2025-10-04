import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function SettingsScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Settings"
      subtitle="Preferences & account"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      {/* Exercise Settings */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ExerciseSettings')}
        activeOpacity={0.7}
      >
        <StyledCard variant="elevated" style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>🏋️</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Exercise Settings</Text>
              <Text style={styles.settingDescription}>Display options & RPE tracking</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </StyledCard>
      </TouchableOpacity>

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
  settingCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingEmoji: {
    fontSize: 24,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 28,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
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
});