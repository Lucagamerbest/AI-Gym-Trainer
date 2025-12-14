/**
 * RecipeCookModeModal - Step-by-step cooking mode with swipeable cards
 *
 * Shows one instruction at a time with swipe navigation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

export default function RecipeCookModeModal({
  visible,
  onClose,
  recipe,
}) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const instructions = recipe?.instructions || [];
  const totalSteps = instructions.length;

  // Use refs to track current values for PanResponder
  const currentStepRef = useRef(currentStep);
  const totalStepsRef = useRef(totalSteps);

  // Simple debounce for button presses
  const debounceButton = useCallback(() => {
    setButtonDisabled(true);
    setTimeout(() => setButtonDisabled(false), 400);
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);

  // Animation for card swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      currentStepRef.current = 0;
      setShowIngredients(false);
      setButtonDisabled(false);
      translateX.setValue(0);
      cardOpacity.setValue(1);
    }
  }, [visible]);

  // Navigate to step - simple version without complex animation chaining
  const navigateToStep = useCallback((direction) => {
    if (buttonDisabled) return;

    const current = currentStepRef.current;
    const total = totalStepsRef.current;
    const nextStep = direction === 'next' ? current + 1 : current - 1;

    if (nextStep < 0 || nextStep >= total) return;

    debounceButton();

    // Simple fade transition
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      currentStepRef.current = nextStep;

      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  }, [buttonDisabled, debounceButton, cardOpacity]);

  // Pan responder for swipe gestures - simplified
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        // Just fade based on swipe distance
        const opacity = 1 - Math.abs(gesture.dx) / SCREEN_WIDTH * 0.5;
        cardOpacity.setValue(Math.max(0.5, opacity));
      },
      onPanResponderRelease: (_, gesture) => {
        const current = currentStepRef.current;
        const total = totalStepsRef.current;

        if (gesture.dx > SWIPE_THRESHOLD && current > 0) {
          navigateToStep('prev');
        } else if (gesture.dx < -SWIPE_THRESHOLD && current < total - 1) {
          navigateToStep('next');
        } else {
          // Snap back
          cardOpacity.setValue(1);
        }
      },
    })
  ).current;

  // Progress dots
  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      {instructions.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index === currentStep && styles.progressDotActive,
            index < currentStep && styles.progressDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  // Render ingredients overlay
  const renderIngredientsOverlay = () => (
    <Modal
      visible={showIngredients}
      transparent
      animationType="fade"
      onRequestClose={() => setShowIngredients(false)}
    >
      <View style={styles.ingredientsOverlay}>
        <View style={styles.ingredientsCard}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.ingredientsTitle}>Ingredients</Text>
            <TouchableOpacity onPress={() => setShowIngredients(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.ingredientsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.ingredientsList}>
              {recipe?.ingredients?.map((ing, index) => {
                // Handle ing.original being either a string or an object
                let displayText = '';
                if (typeof ing.original === 'string') {
                  displayText = ing.original;
                } else if (ing.original && typeof ing.original === 'object') {
                  displayText = `${ing.original.amount || ''} ${ing.original.item || ing.food?.name || ing.name || ''}`.trim();
                } else {
                  displayText = `${ing.quantity || ''}${ing.unit || 'g'} ${ing.food?.name || ing.name || ''}`.trim();
                }
                return (
                  <View key={index} style={styles.ingredientRow}>
                    <Ionicons name="checkbox-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.ingredientText}>{displayText}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!recipe || !instructions.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.recipeName} numberOfLines={1}>
              {recipe.name || recipe.title}
            </Text>
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {totalSteps}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowIngredients(true)}
            style={styles.ingredientsButton}
          >
            <Ionicons name="list" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        {renderProgressDots()}

        {/* Main card area */}
        <View style={styles.cardContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity },
            ]}
          >
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
            </View>
            <Text style={styles.instructionText}>
              {instructions[currentStep]}
            </Text>
          </Animated.View>
        </View>

        {/* Navigation buttons - Left arrow + Next Step/Done */}
        <View style={[styles.navigation, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              (currentStep === 0 || buttonDisabled) && styles.navButtonDisabled,
            ]}
            onPress={() => navigateToStep('prev')}
            disabled={currentStep === 0 || buttonDisabled}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentStep === 0 || buttonDisabled ? Colors.textMuted : Colors.text}
            />
          </TouchableOpacity>

          {currentStep === totalSteps - 1 ? (
            <TouchableOpacity
              style={[styles.doneButton, buttonDisabled && styles.navButtonDisabled]}
              onPress={onClose}
              disabled={buttonDisabled}
            >
              <Ionicons name="checkmark-circle" size={24} color={Colors.text} />
              <Text style={styles.doneButtonText}>Done!</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, buttonDisabled && styles.navButtonDisabled]}
              onPress={() => navigateToStep('next')}
              disabled={buttonDisabled}
            >
              <Text style={styles.nextButtonText}>Next Step</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients overlay */}
        {renderIngredientsOverlay()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  swipeZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  swipeBar: {
    width: 60,
    height: 6,
    backgroundColor: Colors.textMuted,
    borderRadius: 3,
  },
  swipeHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  recipeName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  stepCounter: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ingredientsButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.round,
  },

  // Progress dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },

  // Card
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  instructionText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  nextButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  doneButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },

  // Ingredients overlay
  ingredientsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  ingredientsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingredientsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  ingredientsScroll: {
    flexGrow: 0,
  },
  ingredientsList: {
    gap: Spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ingredientText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
});
