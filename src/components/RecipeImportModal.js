/**
 * RecipeImportModal - Import wizard for recipes
 *
 * Steps:
 * 1. Source selection (Camera, Gallery, Paste Text)
 * 2. Processing indicator
 * 3. Result preview with edit capability
 * 4. Save confirmation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import ContentImportService from '../services/ai/ContentImportService';
import ImportPreviewCard from './ImportPreviewCard';
import VoiceInputButton from './VoiceInputButton';

// Import steps
const STEPS = {
  SOURCE: 'source',
  TEXT_INPUT: 'text_input',
  PROCESSING: 'processing',
  PREVIEW: 'preview',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function RecipeImportModal({
  visible,
  onClose,
  onImportComplete,
  userId,
}) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(STEPS.SOURCE);
  const [textInput, setTextInput] = useState('');
  const [progress, setProgress] = useState({ step: '', message: '', percent: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Swipe to close functionality
  const translateY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderGrant: () => translateY.setOffset(0),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        if (gestureState.dy > 80 || (gestureState.dy > 20 && gestureState.vy > 0.3)) {
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  // Smooth progress animation
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayedPercent, setDisplayedPercent] = useState(0);

  useEffect(() => {
    const targetPercent = progress.percent;
    const startPercent = displayedPercent;
    const diff = targetPercent - startPercent;

    if (diff > 0) {
      const duration = diff * 50;

      Animated.timing(animatedProgress, {
        toValue: targetPercent,
        duration: duration,
        useNativeDriver: false,
      }).start();

      const intervalTime = duration / diff;
      let currentPercent = startPercent;

      const interval = setInterval(() => {
        currentPercent++;
        if (currentPercent >= targetPercent) {
          setDisplayedPercent(targetPercent);
          clearInterval(interval);
        } else {
          setDisplayedPercent(currentPercent);
        }
      }, intervalTime);

      return () => clearInterval(interval);
    } else if (targetPercent === 0) {
      setDisplayedPercent(0);
      animatedProgress.setValue(0);
    }
  }, [progress.percent]);

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setCurrentStep(STEPS.SOURCE);
    setTextInput('');
    setProgress({ step: '', message: '', percent: 0 });
    setDisplayedPercent(0);
    animatedProgress.setValue(0);
    setResult(null);
    setError(null);
    setIsVoiceActive(false);
  }, [animatedProgress]);

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

    let importResult;
    const options = { contentHint: 'recipe', userId };

    try {
      switch (source) {
        case 'camera':
          setCurrentStep(STEPS.PROCESSING);
          importResult = await ContentImportService.importFromCamera(options);
          break;
        case 'gallery':
          // Allow multiple images for recipes (they get combined into one)
          const hasPermission = await requestMediaLibraryPermission();
          if (!hasPermission) {
            setError('Photo library permission is required. Please enable it in settings.');
            setCurrentStep(STEPS.ERROR);
            return;
          }

          // Launch image picker with multiple selection
          const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsMultipleSelection: true,
            selectionLimit: 10, // Max 10 images
          });

          if (pickerResult.canceled) {
            return; // Stay on source step
          }

          setCurrentStep(STEPS.PROCESSING);

          // Process based on number of images
          if (pickerResult.assets.length > 1) {
            // Multiple images - combine into one recipe
            importResult = await ContentImportService.processMultipleImagesForRecipe(
              pickerResult.assets,
              userId
            );
          } else {
            // Single image - regular processing
            importResult = await ContentImportService.importFromGallery({
              ...options,
              allowMultiple: false,
            });
          }
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

  // Request media library permission
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
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
        contentHint: 'recipe',
        userId,
      });

      if (importResult.success) {
        setResult(importResult);
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

  // Handle save
  const handleSave = async () => {
    if (!result?.data || !result?.contentType) return;

    try {
      const saveResult = await ContentImportService.saveContent(
        result.data,
        result.contentType
      );

      if (saveResult.success) {
        setCurrentStep(STEPS.SUCCESS);
        if (onImportComplete) {
          onImportComplete(result.data, result.contentType);
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

  // Handle data edit from preview
  const handleDataEdit = (updatedData) => {
    setResult(prev => ({
      ...prev,
      data: updatedData,
    }));
  };

  // Handle voice transcript
  const handleVoiceTranscript = () => {
    setIsVoiceActive(true);
  };

  // Handle final voice transcript
  const handleVoiceFinalTranscript = (transcript) => {
    if (transcript.trim()) {
      setTextInput(prev => {
        if (prev.trim()) {
          return prev + '\n' + transcript;
        }
        return transcript;
      });
    }
    setIsVoiceActive(false);
  };

  // Render source selection step
  const renderSourceStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Import Recipe</Text>
      <Text style={styles.stepSubtitle}>
        Import a recipe from a photo or text
      </Text>

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
          <Text style={styles.sourceHint}>Pick 1-10 images</Text>
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

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color={Colors.warning} />
        <Text style={styles.tipText}>
          For long recipes, select multiple screenshots - they'll be combined into one recipe automatically!
        </Text>
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
      <Text style={styles.stepTitle}>Paste Recipe</Text>
      <Text style={styles.stepSubtitle}>
        Paste the recipe text or use voice input
      </Text>

      <View style={styles.voiceInputSection}>
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          onFinalTranscript={handleVoiceFinalTranscript}
          style={styles.voiceInputButton}
        />
        <Text style={styles.voiceInputLabel}>
          {isVoiceActive ? 'Listening...' : 'Tap to speak'}
        </Text>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Paste your recipe here...

Example:
Chicken Stir Fry
Ingredients:
- 200g chicken breast
- 100g broccoli
- 50g bell peppers

Instructions:
1. Cut chicken into cubes
2. Heat oil in a pan
3. Cook chicken until golden
4. Add vegetables and stir fry"
        placeholderTextColor={Colors.textMuted}
        multiline
        value={textInput}
        onChangeText={setTextInput}
        autoFocus={!isVoiceActive}
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
          <Text style={styles.primaryButtonText}>Parse Recipe</Text>
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

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedProgress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressPercent}>{displayedPercent}%</Text>
    </View>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review & Edit</Text>
      <Text style={styles.stepSubtitle}>
        Review the imported recipe and make any changes
      </Text>

      {result?.confidence < 0.8 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.warningText}>
            Confidence is low ({Math.round((result?.confidence || 0) * 100)}%). Please review carefully.
          </Text>
        </View>
      )}

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Macros are AI-estimated. For best accuracy, use the nutrition info from your original recipe.
        </Text>
      </View>

      <ImportPreviewCard
        data={result?.data}
        contentType="recipe"
        onEdit={handleDataEdit}
        editable
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(STEPS.SOURCE)}
        >
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={18} color={Colors.text} />
          <Text style={styles.primaryButtonText}>Save Recipe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
      </View>
      <Text style={styles.successTitle}>Recipe Imported!</Text>
      <Text style={styles.successSubtitle}>
        Your recipe has been saved to My Recipes.
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
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      onShow={() => translateY.setValue(0)}
    >
      <Animated.View
        style={[
          styles.fullScreenOverlay,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.container}>
          <View style={{ height: insets.top, backgroundColor: Colors.background }} />

          <View
            {...panResponder.panHandlers}
            style={styles.swipeableHeader}
          >
            <View style={styles.dragHandle} />
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {renderCurrentStep()}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  swipeableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 60,
  },
  dragHandle: {
    position: 'absolute',
    top: Spacing.sm,
    width: 40,
    height: 5,
    backgroundColor: Colors.textMuted,
    borderRadius: 3,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
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

  // Tip card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
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

  // Voice input section
  voiceInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceInputButton: {
    marginLeft: 0,
    marginRight: Spacing.sm,
  },
  voiceInputLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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
  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.info + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
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
});
