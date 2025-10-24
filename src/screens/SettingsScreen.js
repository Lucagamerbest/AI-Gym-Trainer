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

      {/* Food Settings */}
      <TouchableOpacity
        onPress={() => navigation.navigate('FoodSettings')}
        activeOpacity={0.7}
      >
        <StyledCard variant="elevated" style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.settingEmoji}>🍽️</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Food Settings</Text>
              <Text style={styles.settingDescription}>Meal history view preferences</Text>
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

      {/* Developer Tools (Dev Only) */}
      {__DEV__ && (
        <>
          <View style={styles.devSectionHeader}>
            <Text style={styles.devSectionTitle}>🛠️ Developer Tools</Text>
          </View>

          {/* AI Stress Test */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TestRunner')}
            activeOpacity={0.7}
          >
            <StyledCard variant="elevated" style={[styles.settingCard, styles.devCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>🧪</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>AI Stress Test</Text>
                  <Text style={styles.settingDescription}>Test AI with 120 automated questions</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </StyledCard>
          </TouchableOpacity>

          {/* Debug Console */}
          <TouchableOpacity
            onPress={() => navigation.navigate('DebugConsole')}
            activeOpacity={0.7}
          >
            <StyledCard variant="elevated" style={[styles.settingCard, styles.devCard]}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Text style={styles.settingEmoji}>🐛</Text>
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Debug Console</Text>
                  <Text style={styles.settingDescription}>View AI logs & export bug reports</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </StyledCard>
          </TouchableOpacity>
        </>
      )}
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
  devSectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  devSectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  devCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
});