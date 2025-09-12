import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExerciseDetailScreen({ navigation, route }) {
  const { exercise, fromWorkout } = route.params || {};
  // Add error handling for route params
  if (!route || !route.params || !route.params.exercise) {
    return (
      <ScreenLayout
        title="Error"
        subtitle="Exercise not found"
        navigation={navigation}
        showBack={true}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: Colors.text, textAlign: 'center' }}>
            ❌ Exercise data not found. Please go back and try again.
          </Text>
        </View>
      </ScreenLayout>
    );
  }


  // Debug logging
  console.log('ExerciseDetailScreen rendered with exercise:', exercise?.name);

  // Add scrollbar styles for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const styleId = 'exercise-detail-scrollbar-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .exercise-detail-scroll {
            overflow-y: scroll !important;
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
          }
          .exercise-detail-scroll::-webkit-scrollbar {
            width: 12px;
          }
          .exercise-detail-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .exercise-detail-scroll::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          .exercise-detail-scroll::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return Colors.primary;
    }
  };

  const getEquipmentIcon = (equipment) => {
    switch (equipment) {
      case 'Bodyweight': return '🤸‍♂️';
      case 'Dumbbells': return '🏋️‍♂️';
      case 'Barbell': return '🏋️';
      case 'Machine': return '⚙️';
      case 'Cable': return '🔗';
      default: return '💪';
    }
  };


  const getDetailedInstructions = (exercise) => {
    const baseInstructions = exercise?.instructions || 'Follow proper form for this exercise';
    return [
      "Setup: " + baseInstructions,
      "Keep your core engaged throughout the movement",
      "Control the weight on both the up and down phases",
      "Breathe out during the exertion phase",
      "Start with lighter weight to master the form"
    ];
  };

  const detailedInstructions = getDetailedInstructions(exercise);

  const renderContent = () => (
    <>
      {/* Exercise Header */}
      <LinearGradient
        colors={[Colors.primary + '20', Colors.primary + '10']}
        style={styles.headerCard}
      >
        <View style={styles.headerContent}>
          <View style={styles.exerciseMeta}>
            <View style={styles.equipmentTag}>
              <Text style={styles.equipmentIcon}>{getEquipmentIcon(exercise?.equipment || 'Unknown')}</Text>
              <Text style={styles.equipmentText}>{exercise?.equipment || 'Unknown'}</Text>
            </View>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(exercise?.difficulty || 'Beginner') + '20' }
            ]}>
              <Text style={[
                styles.difficultyText,
                { color: getDifficultyColor(exercise?.difficulty || 'Beginner') }
              ]}>
                {exercise?.difficulty || 'Beginner'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Target Muscles</Text>
          <Text style={styles.musclesText}>
            Primary: {exercise?.primaryMuscles ? exercise.primaryMuscles.join(', ') : 'Unknown'}
          </Text>
          {exercise?.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <Text style={styles.musclesSecondary}>
              Secondary: {exercise.secondaryMuscles.join(', ')}
            </Text>
          )}
        </View>
      </LinearGradient>


      {/* Detailed Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
        {detailedInstructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>

      {/* Tips & Safety */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips & Safety</Text>
        <View style={styles.tipsCard}>
          <Text style={styles.tipItem}>⚠️ Always warm up before exercising</Text>
          <Text style={styles.tipItem}>🎯 Focus on proper form over heavy weight</Text>
          <Text style={styles.tipItem}>⏱️ Allow adequate rest between sets</Text>
          <Text style={styles.tipItem}>💧 Stay hydrated throughout your workout</Text>
        </View>
      </View>

      {/* Back to Workout Button */}
      {fromWorkout && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.backToWorkoutButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backToWorkoutButtonText}>
              ← Back to Workout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <ScreenLayout
      title={exercise?.name || 'Exercise'}
      subtitle="Exercise Guide"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      <View style={styles.container}>
        {renderContent()}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  headerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerContent: {
    gap: Spacing.md,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  equipmentIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  equipmentText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
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
  musclesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  musclesSecondary: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingRight: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  instructionText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  tipItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  backToWorkoutButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backToWorkoutButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
});