import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function StartWorkoutScreen({ navigation }) {
  const [exercises, setExercises] = useState([]);

  return (
    <ScreenLayout
      title="Start Workout"
      subtitle="Build your custom routine"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <StyledCard
        icon="🤖"
        title="Get Started with AI"
        subtitle="Let AI create your perfect workout"
        variant="primary"
        onPress={() => navigation.navigate('AIAssistant')}
        style={styles.aiCard}
      />

      {exercises.length === 0 ? (
        <StyledCard variant="elevated" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyIcon}>💪</Text>
            <Text style={styles.emptyTitle}>No exercises added yet</Text>
            <Text style={styles.emptySubtext}>Tap below to add your first exercise</Text>
          </View>
        </StyledCard>
      ) : (
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <StyledCard key={index} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetails}>{exercise.sets} sets • {exercise.reps} reps</Text>
            </StyledCard>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <StyledButton
          title="Add Exercise"
          icon="+"
          size="lg"
          fullWidth
          onPress={() => {
            // Add exercise functionality
            setExercises([...exercises, { name: 'Bench Press', sets: 3, reps: 10 }]);
          }}
          style={styles.actionButton}
        />
        
        <StyledButton
          title="Start from Program"
          icon="📋"
          size="lg"
          variant="secondary"
          fullWidth
          onPress={() => {}}
          style={styles.actionButton}
        />

        {exercises.length > 0 && (
          <StyledButton
            title="Begin Workout"
            icon="▶️"
            size="lg"
            variant="primary"
            fullWidth
            onPress={() => {}}
            style={styles.beginButton}
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  aiCard: {
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    marginBottom: Spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  exerciseList: {
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
  },
  exerciseName: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exerciseDetails: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  actions: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  beginButton: {
    marginTop: Spacing.md,
  },
});