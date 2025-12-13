/**
 * ContentImportModal - Import wizard for workouts
 *
 * Steps:
 * 1. Source selection (Camera, Gallery, Files, Paste Text)
 * 2. Preview input (show image/text)
 * 3. Processing indicator
 * 4. Result preview with edit capability
 * 5. Save confirmation
 *
 * Note: This modal is workout-only. Recipe import is handled separately
 * in the nutrition section.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import ContentImportService from '../services/ai/ContentImportService';
import ImportPreviewCard from './ImportPreviewCard';
import { getVariantImage } from '../utils/exerciseImages';

// Import steps
const STEPS = {
  SOURCE: 'source',
  TEXT_INPUT: 'text_input',
  PROCESSING: 'processing',
  PREVIEW: 'preview',
  VARIANT_SELECTION: 'variant_selection', // Select equipment variants for exercises
  UNMATCHED_REVIEW: 'unmatched_review', // Review unmatched exercises
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ContentImportModal({
  visible,
  onClose,
  onImportComplete,
  userId,
  navigation, // For navigating to exercise detail
}) {
  const [currentStep, setCurrentStep] = useState(STEPS.SOURCE);
  // Always workout mode - recipe import is in nutrition section
  const contentHint = 'workout';
  const [textInput, setTextInput] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [progress, setProgress] = useState({ step: '', message: '', percent: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exerciseMatchInfo, setExerciseMatchInfo] = useState(null);
  const [unmatchedDecisions, setUnmatchedDecisions] = useState({}); // { exerciseId: 'add_custom' | 'remove' }
  const [variantSelections, setVariantSelections] = useState({}); // { exerciseId: 'Barbell' | 'Dumbbell' | etc }
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0); // Track which exercise we're selecting variant for
  const [exerciseDetailModal, setExerciseDetailModal] = useState(null); // { exercise, equipment } for inline detail view

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setCurrentStep(STEPS.SOURCE);
    setTextInput('');
    setPreviewImage(null);
    setProgress({ step: '', message: '', percent: 0 });
    setResult(null);
    setError(null);
    setExerciseMatchInfo(null);
    setUnmatchedDecisions({});
    setVariantSelections({});
    setCurrentVariantIndex(0);
    setExerciseDetailModal(null);
  }, []);

  // Handle close
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Setup progress callback
  const setupProgressCallback = () => {
    ContentImportService.setProgressCallback((progressData) => {
      setProgress(progressData);
    });
    ContentImportService.setErrorCallback((errorMsg) => {
      setError(errorMsg);
      setCurrentStep(STEPS.ERROR);
    });
  };

  // Handle source selection
  const handleSourceSelect = async (source) => {
    setupProgressCallback();
    setCurrentStep(STEPS.PROCESSING);

    let importResult;
    const options = { contentHint, userId };

    try {
      switch (source) {
        case 'camera':
          importResult = await ContentImportService.importFromCamera(options);
          break;
        case 'gallery':
          // Always allow multiple selection - user can pick 1 or many
          importResult = await ContentImportService.importFromGallery({
            ...options,
            allowMultiple: true,
          });
          break;
        case 'document':
          importResult = await ContentImportService.importFromDocument(options);
          break;
        case 'text':
          setCurrentStep(STEPS.TEXT_INPUT);
          return;
        default:
          throw new Error('Invalid source');
      }

      if (importResult.cancelled) {
        setCurrentStep(STEPS.SOURCE);
        return;
      }

      if (importResult.success) {
        setResult(importResult);
        // Store exercise match info for workouts
        if (importResult.exerciseMatchInfo) {
          setExerciseMatchInfo(importResult.exerciseMatchInfo);
          // Initialize decisions for unmatched exercises (default: add as custom)
          const decisions = {};
          importResult.exerciseMatchInfo.unmatched.forEach(ex => {
            decisions[ex.exerciseId] = 'add_custom';
          });
          setUnmatchedDecisions(decisions);
        }
        setCurrentStep(STEPS.PREVIEW);
      } else {
        setError(importResult.message);
        setCurrentStep(STEPS.ERROR);
      }
    } catch (err) {
      setError(err.message);
      setCurrentStep(STEPS.ERROR);
    }
  };

  // Handle text submit
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError('Please enter some text to parse');
      return;
    }

    setupProgressCallback();
    setCurrentStep(STEPS.PROCESSING);

    try {
      const importResult = await ContentImportService.importFromText(textInput, {
        contentHint,
        userId,
      });

      if (importResult.success) {
        setResult(importResult);
        // Store exercise match info for workouts
        if (importResult.exerciseMatchInfo) {
          setExerciseMatchInfo(importResult.exerciseMatchInfo);
          // Initialize decisions for unmatched exercises (default: add as custom)
          const decisions = {};
          importResult.exerciseMatchInfo.unmatched.forEach(ex => {
            decisions[ex.exerciseId] = 'add_custom';
          });
          setUnmatchedDecisions(decisions);
        }
        setCurrentStep(STEPS.PREVIEW);
      } else {
        setError(importResult.message);
        setCurrentStep(STEPS.ERROR);
      }
    } catch (err) {
      setError(err.message);
      setCurrentStep(STEPS.ERROR);
    }
  };

  // Get exercises that need variant selection
  const getExercisesNeedingVariants = () => {
    if (!result?.data || result?.contentType !== 'workout') return [];

    const exercises = result.data.isStandalone
      ? result.data.day?.exercises || []
      : (result.data.days || []).flatMap(d => d.exercises || []);

    return exercises.filter(ex => ex.needsVariantSelection && !variantSelections[ex.id]);
  };

  // Handle proceeding from preview
  const handleProceedFromPreview = () => {
    if (result?.contentType !== 'workout') {
      // Recipe - proceed directly to save
      handleSave();
      return;
    }

    // Check if any exercises need variant selection
    const needsVariants = getExercisesNeedingVariants();
    if (needsVariants.length > 0) {
      setCurrentVariantIndex(0); // Reset to first exercise
      setCurrentStep(STEPS.VARIANT_SELECTION);
      return;
    }

    // Check for unmatched exercises
    if (exerciseMatchInfo?.unmatched?.length > 0) {
      setCurrentStep(STEPS.UNMATCHED_REVIEW);
      return;
    }

    // All good, proceed to save
    handleSave();
  };

  // Handle proceeding from variant selection
  const handleProceedFromVariantSelection = () => {
    // Check for unmatched exercises
    if (exerciseMatchInfo?.unmatched?.length > 0) {
      setCurrentStep(STEPS.UNMATCHED_REVIEW);
    } else {
      handleSave();
    }
  };

  // Handle variant selection change (with optional auto-advance)
  const handleVariantSelect = (exerciseId, equipment, autoAdvance = false, totalCount = 0) => {
    // Find the exercise to get its name for logging
    setVariantSelections(prev => ({
      ...prev,
      [exerciseId]: equipment,
    }));

    // Auto-advance to next exercise after a short delay
    if (autoAdvance) {
      setTimeout(() => {
        if (currentVariantIndex < totalCount - 1) {
          setCurrentVariantIndex(currentVariantIndex + 1);
        } else {
          // All exercises selected, proceed
          handleProceedFromVariantSelection();
        }
      }, 300); // Short delay for visual feedback
    }
  };

  // Show exercise detail in inline modal (doesn't close import flow)
  const handleViewExerciseInfo = (exercise, equipment) => {
    // Find the variant data for this equipment
    const variant = exercise?.variants?.find(v => v.equipment === equipment);

    // Create exercise object with selected variant info
    const exerciseWithVariant = {
      ...exercise,
      selectedEquipment: equipment,
      selectedVariant: variant || null,
    };

    // Open inline modal instead of navigating
    setExerciseDetailModal(exerciseWithVariant);
  };

  // Apply variant selections to exercises
  const applyVariantSelections = (workoutData) => {
    if (!workoutData || Object.keys(variantSelections).length === 0) return workoutData;

    const updatedData = { ...workoutData };

    // Helper to apply variant to exercises
    const applyVariants = (exercises) => {
      return exercises.map(ex => {
        const selectedEquipment = variantSelections[ex.id];
        if (!selectedEquipment || !ex.variants) return ex;

        // Find the selected variant
        const variant = ex.variants.find(v => v.equipment === selectedEquipment);

        if (!variant) return ex;

        return {
          ...ex,
          selectedEquipment,
          selectedVariant: variant,
          needsVariantSelection: false,
        };
      });
    };

    if (updatedData.isStandalone && updatedData.day) {
      updatedData.day.exercises = applyVariants(updatedData.day.exercises);
    } else if (updatedData.days) {
      updatedData.days = updatedData.days.map(day => ({
        ...day,
        exercises: applyVariants(day.exercises),
      }));
    }

    return updatedData;
  };

  // Apply unmatched decisions to workout data
  const applyUnmatchedDecisions = (workoutData) => {
    if (!workoutData || !unmatchedDecisions) return workoutData;

    const updatedData = { ...workoutData };

    // Helper to filter exercises based on decisions
    const filterExercises = (exercises) => {
      return exercises.filter(ex => {
        const decision = unmatchedDecisions[ex.id];
        // Keep if matched, or if decision is 'add_custom'
        if (ex.isMatched || !decision) return true;
        return decision === 'add_custom';
      });
    };

    if (updatedData.isStandalone && updatedData.day) {
      // Standalone workout
      updatedData.day.exercises = filterExercises(updatedData.day.exercises);
    } else if (updatedData.days) {
      // Program with multiple days
      updatedData.days = updatedData.days.map(day => ({
        ...day,
        exercises: filterExercises(day.exercises),
      }));
    }

    return updatedData;
  };

  // Handle save
  const handleSave = async () => {
    if (!result?.data || !result?.contentType) return;

    try {
      // Apply variant selections and unmatched exercise decisions for workouts
      let dataToSave = result.data;
      if (result.contentType === 'workout') {
        dataToSave = applyVariantSelections(result.data);
        dataToSave = applyUnmatchedDecisions(dataToSave);
      }

      const saveResult = await ContentImportService.saveContent(
        dataToSave,
        result.contentType
      );

      if (saveResult.success) {
        setCurrentStep(STEPS.SUCCESS);
        if (onImportComplete) {
          onImportComplete(dataToSave, result.contentType);
        }
      } else {
        setError(saveResult.message);
        setCurrentStep(STEPS.ERROR);
      }
    } catch (err) {
      setError(err.message);
      setCurrentStep(STEPS.ERROR);
    }
  };

  // Handle unmatched exercise decision change
  const handleUnmatchedDecision = (exerciseId, decision) => {
    setUnmatchedDecisions(prev => ({
      ...prev,
      [exerciseId]: decision,
    }));
  };

  // Handle data edit from preview
  const handleDataEdit = (updatedData) => {
    setResult(prev => ({
      ...prev,
      data: updatedData,
    }));
  };

  // Render source selection step
  const renderSourceStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Import Workout</Text>
      <Text style={styles.stepSubtitle}>
        Choose how you want to import your workout program
      </Text>

      {/* Source buttons */}
      <View style={styles.sourceGrid}>
        <TouchableOpacity
          style={styles.sourceButton}
          onPress={() => handleSourceSelect('camera')}
        >
          <View style={[styles.sourceIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="camera" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.sourceLabel}>Camera</Text>
          <Text style={styles.sourceHint}>Take a photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sourceButton}
          onPress={() => handleSourceSelect('gallery')}
        >
          <View style={[styles.sourceIcon, { backgroundColor: Colors.success + '20' }]}>
            <Ionicons name="images" size={28} color={Colors.success} />
          </View>
          <Text style={styles.sourceLabel}>Gallery</Text>
          <Text style={styles.sourceHint}>1 or more images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sourceButton}
          onPress={() => handleSourceSelect('document')}
        >
          <View style={[styles.sourceIcon, { backgroundColor: Colors.info + '20' }]}>
            <Ionicons name="document" size={28} color={Colors.info} />
          </View>
          <Text style={styles.sourceLabel}>Files</Text>
          <Text style={styles.sourceHint}>PDF or image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sourceButton}
          onPress={() => handleSourceSelect('text')}
        >
          <View style={[styles.sourceIcon, { backgroundColor: Colors.warning + '20' }]}>
            <Ionicons name="clipboard" size={28} color={Colors.warning} />
          </View>
          <Text style={styles.sourceLabel}>Paste Text</Text>
          <Text style={styles.sourceHint}>Copy & paste</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );

  // Render text input step
  const renderTextInputStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <Text style={styles.stepTitle}>Paste Workout</Text>
      <Text style={styles.stepSubtitle}>
        Paste the workout text you want to import
      </Text>

      <TextInput
        style={styles.textInput}
        placeholder="Paste your workout here...

Example:
Push Day
1. Bench Press - 4x8-12
2. Incline Dumbbell Press - 3x10
3. Cable Flyes - 3x12-15
4. Tricep Pushdowns - 3x12
5. Lateral Raises - 3x15"
        placeholderTextColor={Colors.textMuted}
        multiline
        value={textInput}
        onChangeText={setTextInput}
        autoFocus
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(STEPS.SOURCE)}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !textInput.trim() && styles.buttonDisabled,
          ]}
          onPress={handleTextSubmit}
          disabled={!textInput.trim()}
        >
          <Text style={styles.primaryButtonText}>Parse Workout</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.processingTitle}>{progress.message || 'Processing...'}</Text>
      <Text style={styles.processingHint}>This may take a few seconds</Text>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress.percent}%` },
          ]}
        />
      </View>
      <Text style={styles.progressPercent}>{progress.percent}%</Text>
    </View>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review & Edit</Text>
      <Text style={styles.stepSubtitle}>
        Review the imported {result?.contentType || 'content'} and make any changes
      </Text>

      {result?.confidence < 0.8 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.warningText}>
            Confidence is low ({Math.round((result?.confidence || 0) * 100)}%). Please review carefully.
          </Text>
        </View>
      )}

      <ImportPreviewCard
        data={result?.data}
        contentType={result?.contentType}
        onEdit={handleDataEdit}
        editable
      />

      {/* Show match summary for workouts */}
      {result?.contentType === 'workout' && exerciseMatchInfo && (
        <View style={styles.matchSummary}>
          <View style={styles.matchSummaryRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.matchSummaryText}>
              {exerciseMatchInfo.matched.length} exercise{exerciseMatchInfo.matched.length !== 1 ? 's' : ''} matched to library
            </Text>
          </View>
          {getExercisesNeedingVariants().length > 0 && (
            <View style={styles.matchSummaryRow}>
              <Ionicons name="options" size={16} color={Colors.info} />
              <Text style={[styles.matchSummaryText, { color: Colors.info }]}>
                {getExercisesNeedingVariants().length} exercise{getExercisesNeedingVariants().length !== 1 ? 's' : ''} need equipment selection
              </Text>
            </View>
          )}
          {exerciseMatchInfo.unmatched.length > 0 && (
            <View style={styles.matchSummaryRow}>
              <Ionicons name="help-circle" size={16} color={Colors.warning} />
              <Text style={[styles.matchSummaryText, { color: Colors.warning }]}>
                {exerciseMatchInfo.unmatched.length} custom exercise{exerciseMatchInfo.unmatched.length !== 1 ? 's' : ''} to review
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(STEPS.SOURCE)}
        >
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleProceedFromPreview}
        >
          <Ionicons
            name={getExercisesNeedingVariants().length > 0 || exerciseMatchInfo?.unmatched?.length > 0 ? "arrow-forward" : "checkmark"}
            size={18}
            color={Colors.text}
          />
          <Text style={styles.primaryButtonText}>
            {getExercisesNeedingVariants().length > 0
              ? 'Select Equipment'
              : exerciseMatchInfo?.unmatched?.length > 0
                ? 'Review Exercises'
                : `Save ${result?.contentType}`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render variant selection step - One exercise at a time with images
  const renderVariantSelectionStep = () => {
    // Get all exercises that need variant selection
    const allExercises = result?.data?.isStandalone
      ? result?.data?.day?.exercises || []
      : (result?.data?.days || []).flatMap(d => d.exercises || []);

    const exercisesNeedingVariants = allExercises.filter(ex => ex.needsVariantSelection);
    const totalCount = exercisesNeedingVariants.length;

    // Guard against empty list
    if (totalCount === 0) {
      handleProceedFromVariantSelection();
      return null;
    }

    // Get current exercise
    const currentExercise = exercisesNeedingVariants[currentVariantIndex];
    const variants = currentExercise?.availableVariants || [];
    const selectedEquipment = variantSelections[currentExercise?.id];

    // Check if current selection is made
    const hasCurrentSelection = !!selectedEquipment;

    // Navigation handlers
    const goToPrevious = () => {
      if (currentVariantIndex > 0) {
        setCurrentVariantIndex(currentVariantIndex - 1);
      } else {
        setCurrentStep(STEPS.PREVIEW);
      }
    };

    const goToNext = () => {
      if (currentVariantIndex < totalCount - 1) {
        setCurrentVariantIndex(currentVariantIndex + 1);
      } else {
        // All done, proceed
        handleProceedFromVariantSelection();
      }
    };

    return (
      <View style={styles.stepContainer}>
        {/* Progress indicator */}
        <View style={styles.variantStepHeader}>
          <Text style={styles.variantStepCounter}>
            Exercise {currentVariantIndex + 1} of {totalCount}
          </Text>
          <View style={styles.variantStepDots}>
            {exercisesNeedingVariants.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.variantStepDot,
                  idx === currentVariantIndex && styles.variantStepDotActive,
                  variantSelections[exercisesNeedingVariants[idx]?.id] && styles.variantStepDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Exercise Title */}
        <View style={styles.variantExerciseTitleContainer}>
          <Text style={styles.variantExerciseTitle}>{currentExercise?.name}</Text>
          {currentExercise?.originalName !== currentExercise?.name && (
            <Text style={styles.variantExerciseSubtitle}>
              Imported as: "{currentExercise?.originalName}"
            </Text>
          )}
        </View>

        {/* Variant Options with Images */}
        <ScrollView
          style={styles.variantCardsContainer}
          contentContainerStyle={styles.variantCardsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.variantSelectPrompt}>
            Select the equipment you'll use:
          </Text>

          <View style={styles.variantCardsGrid}>
            {variants.map((equipment) => {
              const isSelected = selectedEquipment === equipment;
              const variantImage = getVariantImage(currentExercise?.name, equipment);

              return (
                <View key={equipment} style={styles.variantCardWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.variantCard,
                      isSelected && styles.variantCardSelected,
                    ]}
                    onPress={() => handleVariantSelect(currentExercise?.id, equipment, true, totalCount)}
                    activeOpacity={0.7}
                  >
                    {/* Image */}
                    <View style={styles.variantCardImageContainer}>
                      {variantImage ? (
                        <Image
                          source={typeof variantImage === 'string' ? { uri: variantImage } : variantImage}
                          style={styles.variantCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.variantCardImagePlaceholder}>
                          <Ionicons
                            name={getEquipmentIcon(equipment)}
                            size={40}
                            color={Colors.textMuted}
                          />
                        </View>
                      )}

                      {/* Selection indicator overlay */}
                      {isSelected && (
                        <View style={styles.variantCardSelectedOverlay}>
                          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
                        </View>
                      )}

                      {/* Info button - top right corner */}
                      <TouchableOpacity
                        style={styles.variantCardInfoButton}
                        onPress={() => handleViewExerciseInfo(currentExercise, equipment)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="information-circle" size={22} color={Colors.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Equipment Name */}
                    <View style={[
                      styles.variantCardLabel,
                      isSelected && styles.variantCardLabelSelected,
                    ]}>
                      <Ionicons
                        name={getEquipmentIcon(equipment)}
                        size={16}
                        color={isSelected ? Colors.text : Colors.textSecondary}
                      />
                      <Text style={[
                        styles.variantCardText,
                        isSelected && styles.variantCardTextSelected,
                      ]}>
                        {equipment}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.variantNavButtons}>
          <TouchableOpacity
            style={styles.variantNavButton}
            onPress={goToPrevious}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
            <Text style={styles.variantNavButtonText}>
              {currentVariantIndex === 0 ? 'Back' : 'Previous'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.variantNavButtonPrimary,
              !hasCurrentSelection && styles.buttonDisabled,
            ]}
            onPress={goToNext}
            disabled={!hasCurrentSelection}
          >
            <Text style={styles.variantNavButtonPrimaryText}>
              {currentVariantIndex === totalCount - 1
                ? (exerciseMatchInfo?.unmatched?.length > 0 ? 'Review Custom' : 'Save Workout')
                : 'Next'}
            </Text>
            <Ionicons
              name={currentVariantIndex === totalCount - 1 ? 'checkmark' : 'chevron-forward'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Helper to get equipment icon
  const getEquipmentIcon = (equipment) => {
    const icons = {
      'Barbell': 'barbell-outline',
      'Dumbbell': 'fitness-outline',
      'Machine': 'construct-outline',
      'Cable': 'git-branch-outline',
      'Smith Machine': 'grid-outline',
      'Bodyweight': 'body-outline',
      'Kettlebell': 'ellipse-outline',
      'EZ Bar': 'remove-outline',
      'Resistance Band': 'pulse-outline',
    };
    return icons[equipment] || 'help-circle-outline';
  };

  // Render unmatched exercises review step
  const renderUnmatchedReviewStep = () => {
    const unmatched = exerciseMatchInfo?.unmatched || [];
    const addCount = Object.values(unmatchedDecisions).filter(d => d === 'add_custom').length;
    const removeCount = Object.values(unmatchedDecisions).filter(d => d === 'remove').length;

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Review Custom Exercises</Text>
        <Text style={styles.stepSubtitle}>
          These exercises weren't found in your library. Choose what to do with each one.
        </Text>

        {/* Summary */}
        <View style={styles.unmatchedSummary}>
          <Text style={styles.unmatchedSummaryText}>
            {addCount} will be added as custom • {removeCount} will be removed
          </Text>
        </View>

        {/* Exercise list */}
        {unmatched.map((ex) => {
          const decision = unmatchedDecisions[ex.exerciseId] || 'add_custom';

          return (
            <View key={ex.exerciseId} style={styles.unmatchedExerciseCard}>
              <View style={styles.unmatchedExerciseHeader}>
                <Ionicons
                  name={decision === 'add_custom' ? 'add-circle' : 'close-circle'}
                  size={24}
                  color={decision === 'add_custom' ? Colors.primary : Colors.error}
                />
                <View style={styles.unmatchedExerciseInfo}>
                  <Text style={styles.unmatchedExerciseName}>{ex.originalName}</Text>
                  {ex.suggestedEquipment && (
                    <Text style={styles.unmatchedExerciseEquipment}>
                      Equipment: {ex.suggestedEquipment}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.unmatchedActions}>
                <TouchableOpacity
                  style={[
                    styles.unmatchedActionButton,
                    decision === 'add_custom' && styles.unmatchedActionActive,
                  ]}
                  onPress={() => handleUnmatchedDecision(ex.exerciseId, 'add_custom')}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={decision === 'add_custom' ? Colors.text : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.unmatchedActionText,
                    decision === 'add_custom' && styles.unmatchedActionTextActive,
                  ]}>
                    Add Custom
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unmatchedActionButton,
                    decision === 'remove' && styles.unmatchedActionActiveRemove,
                  ]}
                  onPress={() => handleUnmatchedDecision(ex.exerciseId, 'remove')}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={decision === 'remove' ? Colors.text : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.unmatchedActionText,
                    decision === 'remove' && styles.unmatchedActionTextActive,
                  ]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Go back to variant selection if that step was used
              const allExercises = result?.data?.isStandalone
                ? result?.data?.day?.exercises || []
                : (result?.data?.days || []).flatMap(d => d.exercises || []);
              const hasVariantExercises = allExercises.some(ex => ex.needsVariantSelection);
              setCurrentStep(hasVariantExercises ? STEPS.VARIANT_SELECTION : STEPS.PREVIEW);
            }}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={18} color={Colors.text} />
            <Text style={styles.primaryButtonText}>Save Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={styles.successTitle}>Import Successful!</Text>
      <Text style={styles.successSubtitle}>
        Your {result?.contentType || 'content'} has been saved.
      </Text>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleClose}
      >
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  // Render error step
  const renderErrorStep = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={64} color={Colors.error} />
      </View>
      <Text style={styles.errorTitle}>Import Failed</Text>
      <Text style={styles.errorMessage}>{error || 'An unknown error occurred'}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep(STEPS.SOURCE)}
        >
          <Ionicons name="refresh" size={18} color={Colors.text} />
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.SOURCE:
        return renderSourceStep();
      case STEPS.TEXT_INPUT:
        return renderTextInputStep();
      case STEPS.PROCESSING:
        return renderProcessingStep();
      case STEPS.PREVIEW:
        return renderPreviewStep();
      case STEPS.VARIANT_SELECTION:
        return renderVariantSelectionStep();
      case STEPS.UNMATCHED_REVIEW:
        return renderUnmatchedReviewStep();
      case STEPS.SUCCESS:
        return renderSuccessStep();
      case STEPS.ERROR:
        return renderErrorStep();
      default:
        return renderSourceStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {renderCurrentStep()}
        </View>
      </View>

      {/* Exercise Detail Inline Modal */}
      {exerciseDetailModal && (
        <View style={styles.exerciseDetailOverlay}>
          <View style={styles.exerciseDetailContainer}>
            {/* Header */}
            <View style={styles.exerciseDetailHeader}>
              <TouchableOpacity
                onPress={() => setExerciseDetailModal(null)}
                style={styles.exerciseDetailBackButton}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.exerciseDetailTitle} numberOfLines={1}>
                {exerciseDetailModal.selectedEquipment} {exerciseDetailModal.name}
              </Text>
              <TouchableOpacity
                onPress={() => setExerciseDetailModal(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.exerciseDetailContent} showsVerticalScrollIndicator={false}>
              {/* Image */}
              {(() => {
                const variantImage = getVariantImage(exerciseDetailModal.name, exerciseDetailModal.selectedEquipment);
                return variantImage ? (
                  <Image
                    source={typeof variantImage === 'string' ? { uri: variantImage } : variantImage}
                    style={styles.exerciseDetailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.exerciseDetailImagePlaceholder}>
                    <Ionicons name="barbell-outline" size={60} color={Colors.textMuted} />
                  </View>
                );
              })()}

              {/* Exercise Info */}
              <View style={styles.exerciseDetailInfo}>
                <Text style={styles.exerciseDetailName}>
                  {exerciseDetailModal.selectedEquipment} {exerciseDetailModal.name}
                </Text>

                {/* Equipment & Difficulty */}
                <View style={styles.exerciseDetailMeta}>
                  <View style={styles.exerciseDetailMetaItem}>
                    <Ionicons name="fitness-outline" size={16} color={Colors.primary} />
                    <Text style={styles.exerciseDetailMetaText}>
                      {exerciseDetailModal.selectedEquipment}
                    </Text>
                  </View>
                  {exerciseDetailModal.selectedVariant?.difficulty && (
                    <View style={styles.exerciseDetailMetaItem}>
                      <Ionicons name="speedometer-outline" size={16} color={Colors.warning} />
                      <Text style={styles.exerciseDetailMetaText}>
                        {exerciseDetailModal.selectedVariant.difficulty}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Primary Muscles */}
                {exerciseDetailModal.primaryMuscles && (
                  <View style={styles.exerciseDetailSection}>
                    <Text style={styles.exerciseDetailSectionTitle}>Target Muscles</Text>
                    <Text style={styles.exerciseDetailSectionText}>
                      {exerciseDetailModal.primaryMuscles.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Instructions */}
                {exerciseDetailModal.instructions && (
                  <View style={styles.exerciseDetailSection}>
                    <Text style={styles.exerciseDetailSectionTitle}>Instructions</Text>
                    <Text style={styles.exerciseDetailSectionText}>
                      {exerciseDetailModal.instructions}
                    </Text>
                  </View>
                )}

                {/* Variant Pros */}
                {exerciseDetailModal.selectedVariant?.pros?.length > 0 && (
                  <View style={styles.exerciseDetailSection}>
                    <Text style={[styles.exerciseDetailSectionTitle, { color: Colors.success }]}>
                      Advantages
                    </Text>
                    {exerciseDetailModal.selectedVariant.pros.map((pro, idx) => (
                      <Text key={idx} style={styles.exerciseDetailListItem}>• {pro}</Text>
                    ))}
                  </View>
                )}

                {/* Variant Cons */}
                {exerciseDetailModal.selectedVariant?.cons?.length > 0 && (
                  <View style={styles.exerciseDetailSection}>
                    <Text style={[styles.exerciseDetailSectionTitle, { color: Colors.warning }]}>
                      Considerations
                    </Text>
                    {exerciseDetailModal.selectedVariant.cons.map((con, idx) => (
                      <Text key={idx} style={styles.exerciseDetailListItem}>• {con}</Text>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    minHeight: 500,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  stepContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // Source grid
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  sourceButton: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sourceLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sourceHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Text input
  textInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    minHeight: 200,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Processing
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  processingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  processingHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Match summary (preview step)
  matchSummary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  matchSummaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Unmatched exercises review
  unmatchedSummary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  unmatchedSummaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  unmatchedExerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unmatchedExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  unmatchedExerciseInfo: {
    flex: 1,
  },
  unmatchedExerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  unmatchedExerciseEquipment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  unmatchedActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  unmatchedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unmatchedActionActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  unmatchedActionActiveRemove: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
  unmatchedActionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  unmatchedActionTextActive: {
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },

  // Variant selection styles - One at a time with images
  variantStepHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  variantStepCounter: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  variantStepDots: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  variantStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  variantStepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  variantStepDotCompleted: {
    backgroundColor: Colors.success,
  },
  variantExerciseTitleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  variantExerciseTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  variantExerciseSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  variantCardsContainer: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  variantCardsContent: {
    flexGrow: 1,
    paddingBottom: Spacing.lg,
  },
  variantSelectPrompt: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  variantCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  variantCardWrapper: {
    width: '47%',
  },
  variantCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  variantCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  variantCardImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  variantCardInfoButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
  },
  variantCardImage: {
    width: '100%',
    height: '100%',
  },
  variantCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  variantCardSelectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantCardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  variantCardLabelSelected: {
    backgroundColor: Colors.primary + '30',
  },
  variantCardText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  variantCardTextSelected: {
    color: Colors.text,
    fontWeight: Typography.weights.bold,
  },
  variantNavButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  variantNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variantNavButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  variantNavButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  variantNavButtonPrimaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },

  // Exercise Detail Inline Modal Styles
  exerciseDetailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  exerciseDetailContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    height: '85%',
  },
  exerciseDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseDetailBackButton: {
    padding: Spacing.xs,
  },
  exerciseDetailTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  exerciseDetailContent: {
    flex: 1,
  },
  exerciseDetailImage: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.card,
  },
  exerciseDetailImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetailInfo: {
    padding: Spacing.lg,
  },
  exerciseDetailName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  exerciseDetailMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  exerciseDetailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  exerciseDetailMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  exerciseDetailSection: {
    marginBottom: Spacing.lg,
  },
  exerciseDetailSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exerciseDetailSectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  exerciseDetailListItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginLeft: Spacing.sm,
  },
});
