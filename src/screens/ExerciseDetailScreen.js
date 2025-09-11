import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import ExerciseAnimation from '../components/ExerciseAnimation';

export default function ExerciseDetailScreen({ navigation, route }) {
  const { exercise } = route.params;
  const [currentStep, setCurrentStep] = useState(0);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return Colors.primary;
    }
  };

  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);

  return (
    <ScreenLayout
      title={exercise.name}
      subtitle={exercise.equipment}
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Difficulty and Primary Muscle */}
        <View style={styles.header}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
              {exercise.difficulty}
            </Text>
          </View>
          <View style={styles.primaryMuscle}>
            <Text style={styles.primaryLabel}>Primary:</Text>
            <Text style={styles.primaryText}>{exercise.primaryMuscle}</Text>
          </View>
        </View>

        {/* Exercise Animation */}
        <View style={styles.animationSection}>
          <Text style={styles.animationTitle}>Exercise Movement</Text>
          <ExerciseAnimation 
            exerciseType={exercise.animationType || 'default'} 
            isPlaying={isAnimationPlaying}
          />
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={() => setIsAnimationPlaying(!isAnimationPlaying)}
          >
            <Text style={styles.playPauseText}>
              {isAnimationPlaying ? '⏸ Pause' : '▶️ Play'} Animation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exercise.sets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exercise.reps}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{exercise.targetMuscles.length}</Text>
              <Text style={styles.statLabel}>Muscles</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Perform</Text>
          {exercise.instructions.map((instruction, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.instructionCard,
                currentStep === index && styles.instructionActive
              ]}
              onPress={() => setCurrentStep(index)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.stepNumber,
                currentStep === index && styles.stepNumberActive
              ]}>
                <Text style={[
                  styles.stepNumberText,
                  currentStep === index && styles.stepNumberTextActive
                ]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[
                styles.instructionText,
                currentStep === index && styles.instructionTextActive
              ]}>
                {instruction}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pro Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipsIcon}>💡</Text>
            <Text style={styles.tipsText}>{exercise.tips}</Text>
          </View>
        </View>

        {/* Target Muscles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <View style={styles.musclesList}>
            {exercise.targetMuscles.map((muscle, index) => (
              <View key={index} style={styles.muscleChip}>
                <Text style={styles.muscleChipText}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Start Workout Button */}
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => navigation.navigate('StartWorkout', { exercise })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary, '#059669']}
            style={styles.startGradient}
          >
            <Text style={styles.startText}>Start This Exercise</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  difficultyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  primaryMuscle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  primaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  animationSection: {
    marginBottom: Spacing.xl,
  },
  animationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  playPauseButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playPauseText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statsGradient: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberActive: {
    backgroundColor: Colors.primary,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  stepNumberTextActive: {
    color: Colors.background,
  },
  instructionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  instructionTextActive: {
    color: Colors.text,
    fontWeight: '500',
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  tipsIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  tipsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  musclesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  muscleChip: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  muscleChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  startButton: {
    marginVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  startGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  startText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.background,
  },
});