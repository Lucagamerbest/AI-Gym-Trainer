/**
 * FindPlanWizardScreen.js
 *
 * Multi-step wizard for finding personalized workout plans
 * Steps: Days per week -> Goals -> Split type -> Difficulty -> Equipment
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { EQUIPMENT_PROFILES, ALL_EQUIPMENT } from '../services/CuratedWorkoutPlans';

const { width } = Dimensions.get('window');

const STEPS = [
  { key: 'days', title: 'How many days per week?', subtitle: 'Choose your training frequency' },
  { key: 'split', title: 'Preferred split type?', subtitle: 'How do you want to organize workouts' },
  { key: 'difficulty', title: 'Your experience level?', subtitle: 'We\'ll match the right intensity' },
  { key: 'duration', title: 'How long per workout?', subtitle: 'Choose your preferred workout length' },
  { key: 'equipment', title: 'What equipment do you have?', subtitle: 'Select your available equipment' },
];

const DAYS_OPTIONS = [
  { value: 3, label: '3 Days', description: 'Great for beginners or busy schedules', icon: 'calendar-outline' },
  { value: 4, label: '4 Days', description: 'Balanced training and recovery', icon: 'calendar-outline' },
  { value: 5, label: '5 Days', description: 'For dedicated lifters', icon: 'calendar' },
  { value: 6, label: '6 Days', description: 'Maximum frequency training', icon: 'calendar' },
];

const SPLIT_OPTIONS = [
  { value: 'ppl', label: 'Push/Pull/Legs', description: 'Train by movement patterns', icon: 'layers' },
  { value: 'upper-lower', label: 'Upper/Lower', description: 'Simple and effective split', icon: 'swap-vertical' },
  { value: 'full-body', label: 'Full Body', description: 'Hit everything each session', icon: 'body' },
  { value: 'bro-split', label: 'Bro Split', description: 'One muscle group per day', icon: 'calendar' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'New to lifting or returning after a break', icon: 'leaf', color: '#00B894' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years of consistent training', icon: 'trending-up', color: '#FDCB6E' },
  { value: 'advanced', label: 'Advanced', description: '3+ years, ready for intense training', icon: 'flash', color: '#E17055' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 min', description: 'Quick and efficient workouts', icon: 'time-outline', color: '#00B894' },
  { value: 45, label: '45 min', description: 'Standard workout length', icon: 'time-outline', color: '#74B9FF' },
  { value: 60, label: '60 min', description: 'Comprehensive training sessions', icon: 'time', color: '#FDCB6E' },
  { value: 90, label: '90 min', description: 'Extended high-volume workouts', icon: 'time', color: '#E17055' },
];

const EQUIPMENT_OPTIONS = [
  { value: 'full-gym', label: 'Full Gym', description: 'Access to all equipment', icon: 'fitness' },
  { value: 'home-gym', label: 'Home Gym', description: 'Barbell, dumbbells, bench, pull-up bar', icon: 'home' },
  { value: 'dumbbells-only', label: 'Dumbbells Only', description: 'Just dumbbells and a bench', icon: 'barbell' },
  { value: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed', icon: 'body' },
];

export default function FindPlanWizardScreen({ navigation }) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    days: null,
    split: null,
    difficulty: null,
    duration: null,
    equipment: null,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (direction, callback) => {
    const toValue = direction === 'next' ? -width : width;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'next' ? width : -width);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSelect = (key, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateTransition('next', () => setCurrentStep(prev => prev + 1));
    } else {
      // Navigate to results
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('FindPlanResults', { filters: selections });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.selectionAsync();
      animateTransition('back', () => setCurrentStep(prev => prev - 1));
    } else {
      navigation.goBack();
    }
  };

  const currentStepData = STEPS[currentStep];
  const currentSelection = selections[currentStepData.key];
  const canProceed = currentSelection !== null;

  const renderOptionCard = (option, isSelected, onSelect) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.optionCard,
        isSelected && styles.optionCardSelected,
        option.color && isSelected && { borderColor: option.color },
      ]}
      onPress={() => onSelect(option.value)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.optionIconContainer,
        isSelected && styles.optionIconContainerSelected,
        option.color && isSelected && { backgroundColor: option.color + '20' },
      ]}>
        <Ionicons
          name={option.icon}
          size={28}
          color={isSelected ? (option.color || Colors.primary) : Colors.textMuted}
        />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionLabel,
          isSelected && styles.optionLabelSelected,
          option.color && isSelected && { color: option.color },
        ]}>
          {option.label}
        </Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {isSelected && (
        <View style={[styles.checkmark, option.color && { backgroundColor: option.color }]}>
          <Ionicons name="checkmark" size={16} color={Colors.background} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    const { key } = currentStepData;
    let options = [];

    switch (key) {
      case 'days':
        options = DAYS_OPTIONS;
        break;
      case 'split':
        options = SPLIT_OPTIONS;
        break;
      case 'difficulty':
        options = DIFFICULTY_OPTIONS;
        break;
      case 'duration':
        options = DURATION_OPTIONS;
        break;
      case 'equipment':
        options = EQUIPMENT_OPTIONS;
        break;
    }

    return (
      <View style={styles.optionsContainer}>
        {options.map(option => renderOptionCard(
          option,
          selections[key] === option.value,
          (value) => handleSelect(key, value)
        ))}
      </View>
    );
  };

  return (
    <ScreenLayout
      title="Find Your Plan"
      showBack={true}
      navigation={navigation}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / STEPS.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
      </View>

      {/* Step Header */}
      <Animated.View
        style={[
          styles.stepHeader,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>
        <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
      </Animated.View>

      {/* Options */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderStepContent()}
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <StyledButton
          title={currentStep === STEPS.length - 1 ? 'Find Plans' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed}
          icon={currentStep === STEPS.length - 1 ? 'search' : 'arrow-forward'}
          style={styles.nextButton}
        />
      </View>
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  progressContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  stepHeader: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  },
  contentContainer: {
    flex: 1,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconContainerSelected: {
    backgroundColor: Colors.primary + '20',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
  },
});
