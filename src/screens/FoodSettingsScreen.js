import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function FoodSettingsScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Food Settings"
      subtitle="Customize your nutrition tracking"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      {/* Placeholder for future food settings */}
      <StyledCard variant="elevated" style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>🍽️</Text>
        <Text style={styles.placeholderTitle}>Food Settings</Text>
        <Text style={styles.placeholderText}>
          Future nutrition and meal tracking preferences will appear here.
        </Text>
      </StyledCard>

      {/* Info Card */}
      <StyledCard variant="elevated" style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Quick Tip</Text>
        <Text style={styles.infoText}>
          You can switch between Calendar and List views directly in the Meal Planner & History screen using the toggle at the top.
        </Text>
      </StyledCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  placeholderCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
});
