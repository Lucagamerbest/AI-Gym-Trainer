import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import ExerciseAnimation from '../components/ExerciseAnimation';
import { getRelatedExercises } from '../data/professionalExerciseDatabase';

export default function ProfessionalExerciseDetailScreen({ navigation, route }) {
  const { exercise } = route.params;
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  const [activeInstructionTab, setActiveInstructionTab] = useState('setup');
  const [relatedExercises, setRelatedExercises] = useState([]);

  useEffect(() => {
    const related = getRelatedExercises(exercise.id);
    setRelatedExercises(related);
  }, [exercise.id]);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      case 'Expert': return '#7C2D12';
      default: return Colors.primary;
    }
  };

  const getMechanicsColor = (mechanics) => {
    return mechanics === 'Compound' ? '#8B5CF6' : '#06B6D4';
  };

  const renderInstructionSection = () => {
    const tabs = [
      { key: 'setup', label: 'Setup', icon: '⚙️' },
      { key: 'execution', label: 'Execution', icon: '🏃' },
      { key: 'breathing', label: 'Breathing', icon: '💨' }
    ];

    return (
      <View style={styles.instructionSection}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        
        {/* Instruction Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.instructionTab,
                activeInstructionTab === tab.key && styles.activeInstructionTab
              ]}
              onPress={() => setActiveInstructionTab(tab.key)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeInstructionTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instruction Content */}
        <View style={styles.instructionContent}>
          {exercise.instructions[activeInstructionTab]?.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMuscleGroups = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Muscle Groups</Text>
      <View style={styles.muscleContainer}>
        <View style={styles.muscleGroup}>
          <Text style={styles.muscleGroupLabel}>Primary</Text>
          <View style={styles.muscleChips}>
            {exercise.primaryMuscles.map((muscle, index) => (
              <View key={index} style={[styles.muscleChip, styles.primaryMuscleChip]}>
                <Text style={styles.primaryMuscleText}>{muscle}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.muscleGroup}>
            <Text style={styles.muscleGroupLabel}>Secondary</Text>
            <View style={styles.muscleChips}>
              {exercise.secondaryMuscles.map((muscle, index) => (
                <View key={index} style={[styles.muscleChip, styles.secondaryMuscleChip]}>
                  <Text style={styles.secondaryMuscleText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderExerciseSpecs = () => (
    <View style={styles.specsContainer}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
        style={styles.specsGradient}
      >
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Difficulty</Text>
            <View style={[styles.specValue, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
              <Text style={[styles.specText, { color: getDifficultyColor(exercise.difficulty) }]}>
                {exercise.difficulty}
              </Text>
            </View>
          </View>
          
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Type</Text>
            <View style={[styles.specValue, { backgroundColor: getMechanicsColor(exercise.mechanics) + '20' }]}>
              <Text style={[styles.specText, { color: getMechanicsColor(exercise.mechanics) }]}>
                {exercise.mechanics}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.specRow}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Force</Text>
            <Text style={styles.specValueText}>{exercise.force}</Text>
          </View>
          
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Pattern</Text>
            <Text style={styles.specValueText}>{exercise.movementPattern}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRepRanges = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rep Ranges</Text>
      <View style={styles.repRangeContainer}>
        {Object.entries(exercise.repRanges).map(([goal, range]) => (
          <View key={goal} style={styles.repRangeItem}>
            <View style={styles.repRangeHeader}>
              <Text style={styles.repRangeGoal}>{goal.charAt(0).toUpperCase() + goal.slice(1)}</Text>
              <Text style={styles.repRangeValue}>{range}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCommonMistakes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Common Mistakes</Text>
      {exercise.commonMistakes.map((mistake, index) => (
        <View key={index} style={styles.mistakeItem}>
          <Text style={styles.mistakeIcon}>⚠️</Text>
          <Text style={styles.mistakeText}>{mistake}</Text>
        </View>
      ))}
    </View>
  );

  const renderVariations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Variations</Text>
      <View style={styles.variationsGrid}>
        {exercise.variations.map((variation, index) => (
          <View key={index} style={styles.variationChip}>
            <Text style={styles.variationText}>{variation}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProgressions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Progressions</Text>
      <View style={styles.progressionContainer}>
        {Object.entries(exercise.progressions).map(([level, exerciseName]) => (
          <View key={level} style={styles.progressionItem}>
            <View style={[styles.progressionLevel, { backgroundColor: getDifficultyColor(level.charAt(0).toUpperCase() + level.slice(1)) + '20' }]}>
              <Text style={[styles.progressionLevelText, { color: getDifficultyColor(level.charAt(0).toUpperCase() + level.slice(1)) }]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
            <Text style={styles.progressionExercise}>{exerciseName}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRelatedExercises = () => (
    relatedExercises.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Related Exercises</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {relatedExercises.map((relatedExercise) => (
            <TouchableOpacity
              key={relatedExercise.id}
              style={styles.relatedExerciseCard}
              onPress={() => navigation.push('ProfessionalExerciseDetail', { exercise: relatedExercise })}
            >
              <Text style={styles.relatedExerciseName}>{relatedExercise.name}</Text>
              <Text style={styles.relatedExerciseEquipment}>{relatedExercise.equipment}</Text>
              <View style={styles.relatedExerciseMuscles}>
                {relatedExercise.primaryMuscles.slice(0, 2).map((muscle, index) => (
                  <Text key={index} style={styles.relatedMuscleTag}>{muscle}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  );

  return (
    <ScreenLayout
      title={exercise.name}
      subtitle={exercise.equipment}
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.header}>
          <View style={styles.alternateNames}>
            {exercise.alternateNames.map((name, index) => (
              <Text key={index} style={styles.alternateName}>
                {name}{index < exercise.alternateNames.length - 1 ? ' • ' : ''}
              </Text>
            ))}
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

        {/* Exercise Specifications */}
        {renderExerciseSpecs()}

        {/* Muscle Groups */}
        {renderMuscleGroups()}

        {/* Instructions */}
        {renderInstructionSection()}

        {/* Rep Ranges */}
        {renderRepRanges()}

        {/* Common Mistakes */}
        {renderCommonMistakes()}

        {/* Variations */}
        {renderVariations()}

        {/* Progressions */}
        {renderProgressions()}

        {/* Related Exercises */}
        {renderRelatedExercises()}

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
    marginBottom: Spacing.xl,
  },
  alternateNames: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  alternateName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
  specsContainer: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  specsGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  specLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  specValue: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  specText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
  },
  specValueText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
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
  muscleContainer: {
    gap: Spacing.md,
  },
  muscleGroup: {
    marginBottom: Spacing.sm,
  },
  muscleGroupLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  muscleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  primaryMuscleChip: {
    backgroundColor: Colors.primary + '20',
  },
  secondaryMuscleChip: {
    backgroundColor: Colors.textSecondary + '20',
  },
  primaryMuscleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  secondaryMuscleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  instructionSection: {
    marginBottom: Spacing.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  instructionTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeInstructionTab: {
    backgroundColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.background,
  },
  instructionContent: {
    gap: Spacing.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    color: Colors.background,
  },
  instructionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  repRangeContainer: {
    gap: Spacing.sm,
  },
  repRangeItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repRangeGoal: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  repRangeValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mistakeIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  mistakeText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  variationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  variationChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  progressionContainer: {
    gap: Spacing.sm,
  },
  progressionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressionLevel: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  progressionLevelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressionExercise: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  relatedExerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 150,
  },
  relatedExerciseName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  relatedExerciseEquipment: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  relatedExerciseMuscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  relatedMuscleTag: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
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