import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function ProgressHubScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Progress & Goals"
      subtitle="Track your fitness journey"
      navigation={navigation}
      showBack={true}
      showHome={true}
      screenName="ProgressHubScreen"
    >
      <View style={styles.container}>
        <Text style={styles.instructions}>
          Choose what you'd like to track:
        </Text>

        {/* Workouts Button */}
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => navigation.navigate('Progress')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>💪</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Workouts</Text>
            <Text style={styles.buttonSubtitle}>
              View workout progress, charts, goals, and achievements
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Track Nutrition Button */}
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => navigation.navigate('NutritionDashboard')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonIcon}>
            <Text style={styles.iconText}>🍎</Text>
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Track Nutrition</Text>
            <Text style={styles.buttonSubtitle}>
              View nutrition progress, charts, goals, and insights
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  instructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  buttonSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 32,
    color: Colors.primary,
    fontWeight: '300',
    marginLeft: Spacing.sm,
  },
});
