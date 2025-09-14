import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function MuscleGroupSelectionScreen({ navigation }) {
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);

  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '🎯', color: '#FF6B6B' },
    { id: 'back', name: 'Back', icon: '🔺', color: '#4ECDC4' },
    { id: 'legs', name: 'Legs', icon: '🦵', color: '#45B7D1' },
    { id: 'biceps', name: 'Biceps', icon: '💪', color: '#FFEAA7' },
    { id: 'triceps', name: 'Triceps', icon: '🔥', color: '#FF7675' },
    { id: 'shoulders', name: 'Shoulders', icon: '🤲', color: '#96CEB4' },
    { id: 'abs', name: 'Abs', icon: '🎯', color: '#DDA0DD' },
  ];

  const toggleMuscleGroup = (muscleGroupId) => {
    setSelectedMuscleGroups(prev => {
      if (prev.includes(muscleGroupId)) {
        return prev.filter(id => id !== muscleGroupId);
      } else {
        return [...prev, muscleGroupId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedMuscleGroups.length === 0) {
      return; // Don't continue if no muscle groups selected
    }

    try {
      // Check display preference
      const displayMode = await AsyncStorage.getItem('exerciseDisplayMode');

      // Navigate based on display preference
      if (displayMode === 'detailed') {
        // Use AddExerciseScreen which supports both display modes
        navigation.navigate('AddExercise', {
          selectedMuscleGroups,
          fromFreeWorkout: true  // Flag to indicate this is from free workout
        });
      } else {
        // Default to original ExerciseListScreen for compact view
        navigation.navigate('ExerciseList', { selectedMuscleGroups });
      }
    } catch (error) {
      console.error('Error reading display mode:', error);
      // Fallback to default behavior
      navigation.navigate('ExerciseList', { selectedMuscleGroups });
    }
  };

  const handleSelectAll = () => {
    if (selectedMuscleGroups.length === muscleGroups.length) {
      setSelectedMuscleGroups([]); // Deselect all
    } else {
      setSelectedMuscleGroups(muscleGroups.map(group => group.id)); // Select all
    }
  };

  return (
    <ScreenLayout
      title="Select Muscle Groups"
      subtitle={`Choose muscle groups to target (${selectedMuscleGroups.length} selected)`}
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Buttons Row */}
        <View style={styles.section}>
          <View style={styles.topButtonsRow}>
            <TouchableOpacity
              style={[styles.selectAllButton, styles.halfWidthButton]}
              onPress={handleSelectAll}
              activeOpacity={0.9}
            >
              <Text style={styles.selectAllText}>
                {selectedMuscleGroups.length === muscleGroups.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selectAllButton,
                styles.halfWidthButton,
                styles.continueButtonTop,
                selectedMuscleGroups.length === 0 && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={selectedMuscleGroups.length === 0}
              activeOpacity={0.9}
            >
              <Text style={[
                styles.selectAllText,
                selectedMuscleGroups.length > 0 ? styles.continueButtonText : styles.disabledText
              ]}>
                Continue ({selectedMuscleGroups.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Muscle Groups Grid */}
        <View style={styles.section}>
          <View style={styles.muscleGroupGrid}>
            {muscleGroups.map((group, index) => {
              const isSelected = selectedMuscleGroups.includes(group.id);
              const isLastItem = index === muscleGroups.length - 1;
              const isOddTotalItems = muscleGroups.length % 2 !== 0;

              return (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.muscleGroupCard,
                    isSelected && styles.selectedCard,
                    isLastItem && isOddTotalItems && styles.centeredCard
                  ]}
                  onPress={() => toggleMuscleGroup(group.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? [group.color + '40', group.color + '20']
                        : [group.color + '20', group.color + '10']
                    }
                    style={[
                      styles.muscleGroupGradient,
                      isSelected && styles.selectedGradient
                    ]}
                  >
                    <View style={[
                      styles.muscleGroupIcon,
                      { backgroundColor: group.color + (isSelected ? '60' : '30') }
                    ]}>
                      <Text style={styles.muscleGroupEmoji}>{group.icon}</Text>
                    </View>
                    <Text style={[
                      styles.muscleGroupName,
                      isSelected && styles.selectedText
                    ]}>
                      {group.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
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
    marginBottom: Spacing.xl,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  selectAllButton: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  halfWidthButton: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  continueButtonTop: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectAllText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  continueButtonText: {
    color: Colors.background,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleGroupCard: {
    width: '48%',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  centeredCard: {
    marginLeft: '26%',
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  muscleGroupGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  selectedGradient: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  muscleGroupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  muscleGroupEmoji: {
    fontSize: 28,
  },
  muscleGroupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  selectedText: {
    color: Colors.primary,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueButton: {
    marginBottom: Spacing.xl,
  },
  disabledButton: {
    opacity: 0.5,
  },
});