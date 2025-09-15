import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function NutritionScreen({ navigation }) {
  const [calories] = useState(0);
  const [burned] = useState(0);
  const [protein] = useState(45);
  const [carbs] = useState(60);
  const [fat] = useState(35);

  return (
    <ScreenLayout
      title="Nutrition Tracker"
      subtitle="Track your daily intake"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <StyledCard style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{calories}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Burned</Text>
            <Text style={styles.statValue}>{burned}</Text>
          </View>
        </View>
        <Text style={styles.deficitText}>Deficit: +300 cal</Text>
      </StyledCard>

      <StyledCard title="Macros" style={styles.macroCard}>
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Protein</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${protein}%` }]} />
          </View>
          <Text style={styles.macroValue}>{protein}%</Text>
        </View>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${carbs}%` }]} />
          </View>
          <Text style={styles.macroValue}>{carbs}%</Text>
        </View>
        
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Fat</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${fat}%` }]} />
          </View>
          <Text style={styles.macroValue}>{fat}%</Text>
        </View>
      </StyledCard>

      <StyledCard
        icon="📷"
        title="Scan Food"
        subtitle="Instant nutrition info"
        onPress={() => navigation.navigate('FoodScanning')}
      />
      
      <StyledCard
        icon="🔍"
        title="Search & Add"
        subtitle="Find from database"
        onPress={() => navigation.navigate('SearchFood')}
      />
      
      <StyledButton
        title="My Meals & History"
        icon="📊"
        size="lg"
        fullWidth
        onPress={() => navigation.navigate('MealsHistory')}
        style={styles.historyButton}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  deficitText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
  },
  macroCard: {
    marginTop: Spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  macroLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    width: 60,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  macroValue: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    width: 35,
    textAlign: 'right',
  },
  historyButton: {
    marginTop: Spacing.md,
  },
});