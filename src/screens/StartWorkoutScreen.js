import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartWorkoutScreen({ navigation }) {
  const workoutPrograms = [
    { id: 'beginner', name: 'Beginner Program', duration: '4 weeks', focus: 'Foundation Building' },
    { id: 'strength', name: 'Strength Builder', duration: '8 weeks', focus: 'Maximum Strength' },
    { id: 'muscle', name: 'Muscle Mass', duration: '12 weeks', focus: 'Hypertrophy' },
    { id: 'athletic', name: 'Athletic Performance', duration: '6 weeks', focus: 'Performance' },
  ];

  const handleStartWorkout = (program) => {
    // For now, just navigate back or show a success message
    console.log(`Starting ${program.name} workout`);
    navigation.goBack();
  };

  return (
    <ScreenLayout
      title="Start Workout"
      subtitle="Choose your workout program"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Workout Programs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Programs</Text>
          {workoutPrograms.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => handleStartWorkout(program)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary + '10', Colors.primary + '05']}
                style={styles.programGradient}
              >
                <View style={styles.programHeader}>
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programDuration}>⏱️ {program.duration}</Text>
                    <Text style={styles.programFocus}>🎯 {program.focus}</Text>
                  </View>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>START</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <StyledButton
            title="Free Workout"
            subtitle="Choose your own muscle groups"
            onPress={() => navigation.navigate('MuscleGroupSelection')}
            icon="🏃"
            style={styles.quickStartButton}
          />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  programCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  programGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  programDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  programFocus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  startButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  quickStartButton: {
    marginBottom: Spacing.md,
  },
});