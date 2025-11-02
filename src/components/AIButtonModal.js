import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, TextInput, Keyboard, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIButtonSection from './AIButtonSection';
import { getAISectionsForScreen, hasAISections } from '../config/aiSectionConfig';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';

/**
 * AIButtonModal
 *
 * Modal version of AISectionPanel - replaces AIChatModal with button-based interface
 * Opens from AIHeaderButton at the top of screens
 */
export default function AIButtonModal({
  visible,
  onClose,
  screenName,
}) {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const responseRef = useRef(null);

  const [loadingButton, setLoadingButton] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');

  // Workout logging state
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [rpeInput, setRpeInput] = useState('');
  const [activeWorkoutExercises, setActiveWorkoutExercises] = useState([]);
  const [completedSets, setCompletedSets] = useState([]); // Array of {exerciseName, setIndex, weight, reps, display}
  const [rpeEnabled, setRpeEnabled] = useState(false);

  // Reorder UI state
  const [selectedPosition, setSelectedPosition] = useState(null); // Which position number is selected (1, 2, 3...)
  const [reorderedExercises, setReorderedExercises] = useState([]); // Local copy for reordering
  const [showReorderUI, setShowReorderUI] = useState(false); // Show manual reorder interface
  const [exerciseColors, setExerciseColors] = useState({}); // Map exercise name to color

  // Color palette for exercises
  const exercisePalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DFE6E9', // Gray
    '#A29BFE', // Purple
    '#FD79A8', // Pink
    '#FDCB6E', // Orange
    '#74B9FF', // Light Blue
  ];

  // Get sections for this screen
  const sections = getAISectionsForScreen(screenName);

  // Initialize first section as expanded
  useEffect(() => {
    if (visible && sections.length > 0) {
      setExpandedSections({ 0: true });
    }
  }, [visible]);

  // Load active workout exercises when modal opens (for WorkoutAssistant screen)
  useEffect(() => {
    const loadActiveWorkoutExercises = async () => {
      if (visible && screenName === 'WorkoutAssistant') {
        try {
          const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
          if (activeWorkoutStr) {
            const activeWorkout = JSON.parse(activeWorkoutStr);
            const exercises = activeWorkout.exercises || [];
            setActiveWorkoutExercises(exercises.map(ex => ex.name));

            // Also load completed sets for removal
            const completed = [];

            exercises.forEach((exercise, exIndex) => {
              // Get sets from exerciseSets object (not exercise.sets!)
              const sets = activeWorkout.exerciseSets?.[exIndex.toString()] || [];

              sets.forEach((set, setIndex) => {
                if (set.completed && set.weight && set.reps) {
                  const setData = {
                    exerciseName: exercise.name,
                    setIndex: setIndex + 1, // 1-indexed for display
                    weight: set.weight,
                    reps: set.reps,
                    rpe: set.rpe,
                    display: `Set ${setIndex + 1}: ${set.weight} lbs × ${set.reps} reps${set.rpe ? ` @ RPE ${set.rpe}` : ''} - ${exercise.name}`,
                  };
                  completed.push(setData);
                }
              });
            });

            setCompletedSets(completed);
          }
        } catch (error) {
          console.error('Failed to load active workout exercises:', error);
        }
      }
    };

    loadActiveWorkoutExercises();
  }, [visible, screenName]);

  // Load RPE setting when modal opens
  useEffect(() => {
    const loadRpeSetting = async () => {
      if (visible) {
        try {
          const savedRpeEnabled = await AsyncStorage.getItem('@rpe_enabled');
          setRpeEnabled(savedRpeEnabled === 'true');
        } catch (error) {
          console.error('Failed to load RPE setting:', error);
          setRpeEnabled(false);
        }
      }
    };

    loadRpeSetting();
  }, [visible]);

  // Clear state when modal closes to prevent auto-close on reopen
  useEffect(() => {
    if (!visible) {
      setLastResponse(null);
      setConversationHistory([]);
      setReplyText('');
      setLoadingButton(null);
      setShowCustomInput(false);
      setCustomInputText('');
      setSelectedExercise(null);
      setWeightInput('');
      setRepsInput('');
      setRpeInput('');
    }
  }, [visible]);

  // Auto-close modal after successful save or set logging
  useEffect(() => {
    if (!lastResponse) return;

    const lowerResponse = lastResponse.toLowerCase();
    const saveSuccessKeywords = [
      'added to today',
      'saved to my plans',
      'workout saved',
      'added workout to',
      'saved workout to',
    ];

    const setLoggedKeywords = [
      'logged set',
      'set logged',
      'lbs × ',  // Pattern from "Logged set 1: 125 lbs × 5 reps"
    ];

    const isSaveSuccess = saveSuccessKeywords.some(keyword => lowerResponse.includes(keyword));
    const isSetLogged = setLoggedKeywords.some(keyword => lowerResponse.includes(keyword));

    if (isSaveSuccess || isSetLogged) {
      // Close modal after 1.5 seconds to let user see the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [lastResponse, onClose]);

  /**
   * Detect if AI response is asking a question
   */
  const detectQuestion = (response) => {
    if (!response) return false;

    // Check for question mark
    if (response.includes('?')) return true;

    // Check for question keywords
    const questionKeywords = [
      'would you like',
      'do you want',
      'should i',
      'shall i',
      'can i help',
      'need help',
      'prefer',
      'which one',
      'what would',
      'how about',
      'select which',
      'here are your',  // For "Here are your completed sets:"
    ];

    const lowerResponse = response.toLowerCase();
    return questionKeywords.some(keyword => lowerResponse.includes(keyword));
  };

  /**
   * Detect if AI is asking about number of days
   */
  const detectDaysQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const daysKeywords = [
      'how many days',
      'days per week',
      'days a week',
      'train per week',
      'workout per week',
    ];

    return daysKeywords.some(keyword => lowerResponse.includes(keyword));
  };

  /**
   * Detect if AI is asking about muscle groups/focus
   */
  const detectMuscleGroupQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const muscleKeywords = [
      'muscle group',
      'which muscles',
      'focus on',
      'what.*focus',
      'program.*create',
      'workout.*focus',
    ];

    return muscleKeywords.some(keyword => lowerResponse.includes(keyword));
  };

  /**
   * Detect if AI is asking about save location (Today vs My Plans)
   */
  const detectSaveLocationQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const saveKeywords = [
      'save this workout',
      'add it to today',
      'today\'s plan',
      'my plans',
      'save it to',
      'add to today',
    ];

    return saveKeywords.some(keyword => lowerResponse.includes(keyword));
  };

  /**
   * Detect if AI is asking which exercise to log
   */
  const detectExerciseLogQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const exerciseLogKeywords = [
      'what exercise',
      'which exercise',
      'exercise.*log',
      'exercise.*weight.*reps',
      'log.*exercise',
    ];

    return exerciseLogKeywords.some(keyword => {
      if (keyword.includes('.*')) {
        const regex = new RegExp(keyword);
        return regex.test(lowerResponse);
      }
      return lowerResponse.includes(keyword);
    });
  };

  /**
   * Detect if AI is asking for RPE in addition to weight/reps
   */
  const detectRPERequest = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const rpeKeywords = [
      'rpe',
      'rate of perceived exertion',
      'rating',
      '1-10 scale',
    ];

    return rpeKeywords.some(keyword => lowerResponse.includes(keyword));
  };

  /**
   * Detect if AI is asking which exercise to remove/modify (Tool 2)
   */
  const detectExerciseModificationQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const modifyKeywords = [
      'which exercise.*remove',
      'what exercise.*delete',
      'remove which.*exercise',
      'delete which.*exercise',
    ];

    return modifyKeywords.some(keyword => {
      if (keyword.includes('.*')) {
        const regex = new RegExp(keyword);
        return regex.test(lowerResponse);
      }
      return lowerResponse.includes(keyword);
    });
  };

  /**
   * Detect if we're showing the set removal interface
   * Simple check: does the response contain our static message?
   */
  const detectSetRemovalQuestion = (response) => {
    if (!response) return false;
    // Check for our exact static message
    return response.includes('Here are your completed sets:') ||
           response.includes('Select which set to remove:');
  };

  /**
   * Detect if we're showing the exercise reorder interface
   */
  const detectExerciseReorderQuestion = (response) => {
    if (!response) return false;
    return response.includes('Select an exercise to reorder:');
  };

  /**
   * Detect if AI is asking how to move the exercise
   */
  const detectReorderDirectionQuestion = (response) => {
    if (!response) return false;
    return response.includes('How would you like to move');
  };

  /**
   * Detect if AI is asking for workout rating (Tool 3)
   */
  const detectWorkoutRatingQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const ratingKeywords = [
      'rate.*workout',
      'how.*rate',
      'rating',
      'out of 5',
      '1-5',
      'how was.*workout',
    ];

    return ratingKeywords.some(keyword => {
      if (keyword.includes('.*')) {
        const regex = new RegExp(keyword);
        return regex.test(lowerResponse);
      }
      return lowerResponse.includes(keyword);
    });
  };

  /**
   * Detect if AI is asking for rest duration (Tool 4)
   */
  const detectRestDurationQuestion = (response) => {
    if (!response) return false;

    const lowerResponse = response.toLowerCase();
    const restKeywords = [
      'how long.*rest',
      'rest.*how long',
      'rest duration',
      'how many.*rest',
      'rest for',
    ];

    return restKeywords.some(keyword => {
      if (keyword.includes('.*')) {
        const regex = new RegExp(keyword);
        return regex.test(lowerResponse);
      }
      return lowerResponse.includes(keyword);
    });
  };

  /**
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    // Check if this is the custom input button
    if (button.isCustomInput && !button.showCompletedSets) {
      setShowCustomInput(true);
      setExpandedSections({});
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    // Check if this is the "Remove set" button - show completed sets directly
    if (button.showCompletedSets) {
      if (completedSets.length > 0) {
        setLastResponse("Here are your completed sets:");
      } else {
        setLastResponse("No completed sets to remove. Log some sets first!");
      }
      setExpandedSections({});
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    // Check if this is the "Reorder exercises" button - show manual reorder UI
    if (button.showExerciseReorder) {
      if (activeWorkoutExercises.length > 0) {
        setReorderedExercises([...activeWorkoutExercises]); // Create local copy
        setSelectedPosition(null); // Reset selection

        // Assign a unique color to each exercise
        const colors = {};
        activeWorkoutExercises.forEach((exerciseName, index) => {
          colors[exerciseName] = exercisePalette[index % exercisePalette.length];
        });
        setExerciseColors(colors);

        setShowReorderUI(true); // Show manual reorder interface
        setLastResponse(null); // Clear any previous response
      } else {
        setLastResponse("No exercises in your workout to reorder.");
      }
      setExpandedSections({});
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    // Check if this is the RPE button and RPE is disabled
    if (button.requiresRPE && !rpeEnabled) {
      setLastResponse(
        "⚙️ RPE tracking is currently disabled in settings.\n\n" +
        "To use this feature, go to Settings > Exercise Settings and enable 'Enable RPE Tracking'."
      );
      setExpandedSections({});
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return;
    }

    try {
      setLoadingButton(button.text);
      setLastResponse(null);

      // Collapse all sections
      setExpandedSections({});

      // Build context for this screen
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);

      // Use custom prompt if available, otherwise use button text
      const messageToSend = button.prompt || button.text;

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(messageToSend, context);

      // Store response
      setLastResponse(result.response);

      // Add to conversation history (use button.text for display, not the full prompt)
      setConversationHistory(prev => [
        ...prev,
        { userMessage: button.text, aiResponse: result.response }
      ]);

      // CRITICAL: Reload workout data after AI interaction
      await reloadWorkoutData();

      // Auto-scroll to response after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('AI button error:', error);
      setLastResponse("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Reload workout data from AsyncStorage after AI makes changes
   */
  const reloadWorkoutData = async () => {
    try {
      const updatedWorkoutStr = await AsyncStorage.getItem('@active_workout');
      if (updatedWorkoutStr) {
        const updatedWorkout = JSON.parse(updatedWorkoutStr);

        // Reload completed sets
        const exercises = updatedWorkout.exercises || [];
        const completed = [];

        exercises.forEach((exercise, exIndex) => {
          const sets = updatedWorkout.exerciseSets?.[exIndex.toString()] || [];

          sets.forEach((set, setIndex) => {
            if (set.completed && set.weight && set.reps) {
              const setData = {
                exerciseName: exercise.name,
                setIndex: setIndex + 1,
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe,
                display: `Set ${setIndex + 1}: ${set.weight} lbs × ${set.reps} reps${set.rpe ? ` @ RPE ${set.rpe}` : ''} - ${exercise.name}`,
              };
              completed.push(setData);
            }
          });
        });

        setCompletedSets(completed);
      }
    } catch (error) {
      console.error('❌ Failed to reload workout data:', error);
    }
  };

  /**
   * Handle quick reply button press
   */
  const handleQuickReply = async (reply) => {
    try {
      setLoadingButton(reply);
      const previousResponse = lastResponse;
      setLastResponse(null);

      // Build context with conversation history
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);

      // Add conversation history to context
      context.conversationHistory = conversationHistory;

      // Send reply to AI
      const result = await AIService.sendMessageWithTools(reply, context);

      // Store response
      setLastResponse(result.response);

      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { userMessage: reply, aiResponse: result.response }
      ]);

      // CRITICAL: Reload workout data after AI interaction
      await reloadWorkoutData();

      // Auto-scroll to response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Quick reply error:', error);
      setLastResponse("Sorry, I couldn't process that response. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle custom workout text submission
   */
  const handleSendCustomWorkout = async () => {
    if (!customInputText.trim()) return;

    try {
      setLoadingButton('Creating workout...');
      const messageToSend = customInputText;
      setCustomInputText('');
      setShowCustomInput(false);
      Keyboard.dismiss();

      // Build context
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);
      context.conversationHistory = conversationHistory;

      // Send to AI with explicit workout creation instruction
      const result = await AIService.sendMessageWithTools(
        `Create a workout based on this request: "${messageToSend}". Use the generateWorkoutPlan tool to create the workout and save it.`,
        context
      );

      // Store response
      setLastResponse(result.response);

      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { userMessage: messageToSend, aiResponse: result.response }
      ]);

      // CRITICAL: Reload workout data after AI interaction
      await reloadWorkoutData();

      // Auto-scroll to response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Custom workout error:', error);
      setLastResponse("Sorry, I couldn't process that workout request. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle exercise selection for logging
   */
  const handleExerciseSelection = (exerciseName) => {
    setSelectedExercise(exerciseName);
    // Auto-scroll to show input form
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  /**
   * Handle weight/reps/RPE submission for selected exercise
   */
  const handleLogSet = async () => {
    if (!selectedExercise || !weightInput.trim() || !repsInput.trim()) return;
    if (isRPERequested && !rpeInput.trim()) return;

    // Build message with optional RPE
    let message = `Log ${weightInput} pounds for ${repsInput} reps on ${selectedExercise}`;
    if (isRPERequested && rpeInput.trim()) {
      message += ` at RPE ${rpeInput}`;
    }

    try {
      setLoadingButton('Logging set...');

      // Build context
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);
      context.conversationHistory = conversationHistory;

      // Send to AI
      const result = await AIService.sendMessageWithTools(message, context);

      // Store response
      setLastResponse(result.response);

      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { userMessage: message, aiResponse: result.response }
      ]);

      // CRITICAL: Reload workout data after AI interaction
      await reloadWorkoutData();

      // Clear inputs
      setSelectedExercise(null);
      setWeightInput('');
      setRepsInput('');
      setRpeInput('');

      // Auto-scroll to response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Log set error:', error);
      setLastResponse("Sorry, I couldn't log that set. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle custom text reply
   */
  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      setLoadingButton('Sending...');
      const messageToSend = replyText;
      setReplyText(''); // Clear input immediately
      Keyboard.dismiss();

      // Build context with conversation history
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);
      context.conversationHistory = conversationHistory;

      // Send reply to AI
      const result = await AIService.sendMessageWithTools(messageToSend, context);

      // Store response
      setLastResponse(result.response);

      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { userMessage: messageToSend, aiResponse: result.response }
      ]);

      // CRITICAL: Reload workout data after AI interaction
      await reloadWorkoutData();

      // Auto-scroll to response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Send reply error:', error);
      setLastResponse("Sorry, I couldn't process that message. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Toggle section expanded state
   */
  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  /**
   * Process buttons to add disabled state and subtitle for RPE buttons
   */
  const processButtons = (buttons) => {
    return buttons.map(button => {
      // Check if this is the "Log set with RPE" button
      if (button.text === 'Log set with RPE') {
        return {
          ...button,
          requiresRPE: true,
          disabled: !rpeEnabled,
          subtitle: !rpeEnabled ? 'Disabled in settings' : undefined,
        };
      }
      return button;
    });
  };

  // If no sections, show message
  const noSections = !hasAISections(screenName);

  // Detect if AI is asking a question
  const isQuestion = detectQuestion(lastResponse);
  const isDaysQuestion = detectDaysQuestion(lastResponse);
  const isSaveLocationQuestion = detectSaveLocationQuestion(lastResponse);
  const isMuscleGroupQuestion = detectMuscleGroupQuestion(lastResponse);
  const isExerciseLogQuestion = detectExerciseLogQuestion(lastResponse);
  const isRPERequested = detectRPERequest(lastResponse);
  const isExerciseModificationQuestion = detectExerciseModificationQuestion(lastResponse);
  const isSetRemovalQuestion = detectSetRemovalQuestion(lastResponse);
  const isExerciseReorderQuestion = detectExerciseReorderQuestion(lastResponse);
  const isReorderDirectionQuestion = detectReorderDirectionQuestion(lastResponse);
  const isWorkoutRatingQuestion = detectWorkoutRatingQuestion(lastResponse);
  const isRestDurationQuestion = detectRestDurationQuestion(lastResponse);

  // Debug detection when response changes
  React.useEffect(() => {
    if (lastResponse) {
      console.log('\n🔍 ========== DETECTION DEBUG ==========');
      console.log('Response:', lastResponse);
      console.log('isQuestion:', isQuestion);
      console.log('isExerciseReorderQuestion:', isExerciseReorderQuestion);
      console.log('isReorderDirectionQuestion:', isReorderDirectionQuestion);
      console.log('isSetRemovalQuestion:', isSetRemovalQuestion);
      console.log('selectedExercise:', selectedExercise);
      console.log('Will show quick replies:', (isQuestion || isExerciseReorderQuestion || isReorderDirectionQuestion) && !selectedExercise);
      console.log('======================================\n');
    }
  }, [lastResponse]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>AI Coach</Text>
              <Text style={styles.headerSubtitle}>
                {screenName ? screenName.replace('Screen', '') : 'Assistant'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {noSections ? (
            <View style={styles.noSectionsContainer}>
              <Text style={styles.noSectionsIcon}>ℹ️</Text>
              <Text style={styles.noSectionsText}>
                No AI actions available for this screen yet.
              </Text>
            </View>
          ) : (
            <>
              {sections.map((section, index) => (
                <AIButtonSection
                  key={index}
                  title={section.title}
                  icon={section.icon}
                  buttons={processButtons(section.buttons)}
                  onButtonPress={handleButtonPress}
                  expanded={expandedSections[index] || false}
                  onToggle={() => toggleSection(index)}
                  loading={loadingButton !== null}
                />
              ))}

              {/* Manual Reorder UI */}
              {showReorderUI && (
                <View style={styles.reorderContainer}>
                  <View style={styles.reorderHeader}>
                    <Text style={styles.reorderIcon}>🔄</Text>
                    <Text style={styles.reorderTitle}>Reorder Exercises</Text>
                  </View>

                  {/* Position Buttons */}
                  <Text style={styles.reorderInstructions}>
                    Step 1: Tap a position number
                  </Text>
                  <View style={styles.positionButtonsContainer}>
                    {reorderedExercises.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.positionButton,
                          selectedPosition === index + 1 && styles.positionButtonSelected
                        ]}
                        onPress={() => setSelectedPosition(index + 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.positionButtonText,
                          selectedPosition === index + 1 && styles.positionButtonTextSelected
                        ]}>
                          {index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Exercise Buttons */}
                  <Text style={styles.reorderInstructions}>
                    Step 2: Tap an exercise to move it to position {selectedPosition || '?'}
                  </Text>
                  <View style={styles.exerciseListContainer}>
                    {reorderedExercises.map((exerciseName, index) => {
                      const exerciseColor = exerciseColors[exerciseName] || '#DFE6E9';
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.reorderExerciseButton,
                            !selectedPosition && styles.reorderExerciseButtonDisabled,
                            {
                              borderLeftWidth: 6,
                              borderLeftColor: exerciseColor,
                              backgroundColor: exerciseColor + '15', // 15 = 8% opacity
                            }
                          ]}
                          onPress={() => {
                            if (selectedPosition) {
                              // Move exercise to selected position
                              const newOrder = [...reorderedExercises];
                              const [movedExercise] = newOrder.splice(index, 1);
                              newOrder.splice(selectedPosition - 1, 0, movedExercise);
                              setReorderedExercises(newOrder);
                              setSelectedPosition(null); // Reset selection
                            }
                          }}
                          disabled={!selectedPosition}
                          activeOpacity={0.7}
                        >
                          <View style={styles.reorderExerciseContent}>
                            <View style={[styles.exerciseColorDot, { backgroundColor: exerciseColor }]} />
                            <Text style={[
                              styles.reorderExerciseButtonText,
                              !selectedPosition && styles.reorderExerciseButtonTextDisabled
                            ]}>
                              {index + 1}. {exerciseName}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.reorderActionsContainer}>
                    <TouchableOpacity
                      style={[styles.reorderActionButton, styles.cancelButton]}
                      onPress={() => {
                        setShowReorderUI(false);
                        setSelectedPosition(null);
                        setReorderedExercises([]);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reorderActionButtonText}>✖️ Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderActionButton, styles.saveButton]}
                      onPress={async () => {
                        // Send the reordered list to AI
                        const orderChange = reorderedExercises.map((ex, idx) => `${idx + 1}. ${ex}`).join('\n');
                        setShowReorderUI(false);
                        setLastResponse(`Saving new order:\n${orderChange}`);

                        // Call AI to save changes
                        const context = await ContextManager.buildContextForScreen(screenName, user?.uid);
                        const message = `Reorder my workout to this exact order:\n${orderChange}`;
                        const result = await AIService.sendMessageWithTools(message, context);
                        setLastResponse(result.response);

                        // Reload workout data
                        await reloadWorkoutData();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reorderActionButtonText}>✅ Save Changes</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Response Display */}
              {lastResponse && (
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeader}>
                    <Text style={styles.responseIcon}>💬</Text>
                    <Text style={styles.responseTitle}>AI Response</Text>
                  </View>
                  <Text style={styles.responseText}>{lastResponse}</Text>

                  {/* Quick Reply Buttons - Show when AI asks a question OR for special UIs */}
                  {(isQuestion || isExerciseReorderQuestion || isReorderDirectionQuestion) && !selectedExercise && (
                    <View style={styles.quickReplyContainer}>
                      <Text style={styles.quickReplyLabel}>
                        {isDaysQuestion ? 'Days per week:' : isSaveLocationQuestion ? 'Save to:' : isMuscleGroupQuestion ? 'Focus on:' : isExerciseLogQuestion ? 'Select exercise:' : isSetRemovalQuestion ? 'Tap a set to remove it:' : isExerciseReorderQuestion ? 'Select exercise to reorder:' : isReorderDirectionQuestion ? 'Choose direction:' : isExerciseModificationQuestion ? 'Remove exercise:' : isWorkoutRatingQuestion ? 'Rate workout:' : isRestDurationQuestion ? 'Rest duration:' : 'Quick Reply:'}
                      </Text>
                      <View style={styles.quickReplyButtons}>
                        {isExerciseLogQuestion ? (
                          <>
                            {/* Exercise Selection Buttons */}
                            {activeWorkoutExercises.map((exerciseName, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.quickReplyButton, styles.exerciseButton]}
                                onPress={() => handleExerciseSelection(exerciseName)}
                                disabled={loadingButton !== null}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quickReplyText}>🏋️ {exerciseName}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : isDaysQuestion ? (
                          <>
                            {/* Days Selection Buttons */}
                            {[1, 2, 3, 4, 5, 6, 7].map(days => (
                              <TouchableOpacity
                                key={days}
                                style={[styles.quickReplyButton, styles.daysButton]}
                                onPress={() => handleQuickReply(`${days} days per week`)}
                                disabled={loadingButton !== null}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quickReplyText}>📅 {days}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : isMuscleGroupQuestion ? (
                          <>
                            {/* Muscle Group Selection Buttons */}
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('All Balanced')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🏋️ All Balanced</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('Chest')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>💪 Chest</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('Back')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🔙 Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('Legs')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🦵 Legs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('Arms')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>💪 Arms</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.muscleGroupButton]}
                              onPress={() => handleQuickReply('Shoulders')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>💪 Shoulders</Text>
                            </TouchableOpacity>
                          </>
                        ) : isSaveLocationQuestion ? (
                          <>
                            {/* Save Location Buttons */}
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.saveLocationButton]}
                              onPress={() => handleQuickReply('Add to today\'s plan')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>📅 Today's Workout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.saveLocationButton]}
                              onPress={() => handleQuickReply('Save to my plans')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>💾 Save to My Plans</Text>
                            </TouchableOpacity>
                          </>
                        ) : isSetRemovalQuestion ? (
                          <>
                            {/* Set Removal Buttons - Show completed sets */}
                            {completedSets.length > 0 ? (
                              completedSets.map((set, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[styles.quickReplyButton, styles.setRemovalButton]}
                                  onPress={() => handleQuickReply(`Remove set ${set.setIndex} from ${set.exerciseName}`)}
                                  disabled={loadingButton !== null}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.quickReplyText}>🗑️ {set.display}</Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <Text style={styles.noSetsText}>No completed sets to remove</Text>
                            )}
                          </>
                        ) : isExerciseReorderQuestion ? (
                          <>
                            {/* Exercise Reorder Buttons - Show exercises with up/down */}
                            {activeWorkoutExercises.map((exerciseName, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.quickReplyButton, styles.exerciseReorderButton]}
                                onPress={() => handleQuickReply(`How would you like to move ${exerciseName}? Reply with: "up", "down", or "position X"`)}
                                disabled={loadingButton !== null}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quickReplyText}>{index + 1}. 🔄 {exerciseName}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : isReorderDirectionQuestion ? (
                          <>
                            {/* Direction Buttons - Move up, down, or to position */}
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.directionButton]}
                              onPress={() => {
                                // Extract exercise name from last response
                                const match = lastResponse.match(/move\s+(.+?)\?/i);
                                const exerciseName = match ? match[1] : '';
                                handleQuickReply(`Move ${exerciseName} up`);
                              }}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🔼 Move Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.directionButton]}
                              onPress={() => {
                                const match = lastResponse.match(/move\s+(.+?)\?/i);
                                const exerciseName = match ? match[1] : '';
                                handleQuickReply(`Move ${exerciseName} down`);
                              }}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🔽 Move Down</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.directionButton]}
                              onPress={() => {
                                const match = lastResponse.match(/move\s+(.+?)\?/i);
                                const exerciseName = match ? match[1] : '';
                                handleQuickReply(`Move ${exerciseName} to position 1`);
                              }}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>🎯 Move to First</Text>
                            </TouchableOpacity>
                          </>
                        ) : isExerciseModificationQuestion ? (
                          <>
                            {/* Exercise Removal/Modification Buttons - Tool 2 */}
                            {activeWorkoutExercises.map((exerciseName, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.quickReplyButton, styles.exerciseButton]}
                                onPress={() => handleQuickReply(`Remove ${exerciseName}`)}
                                disabled={loadingButton !== null}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quickReplyText}>❌ {exerciseName}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : isWorkoutRatingQuestion ? (
                          <>
                            {/* Workout Rating Buttons - Tool 3 */}
                            {[1, 2, 3, 4, 5].map(rating => (
                              <TouchableOpacity
                                key={rating}
                                style={[styles.quickReplyButton, styles.ratingButton]}
                                onPress={() => handleQuickReply(`${rating} out of 5`)}
                                disabled={loadingButton !== null}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quickReplyText}>{'⭐'.repeat(rating)}</Text>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : isRestDurationQuestion ? (
                          <>
                            {/* Rest Duration Buttons - Tool 4 */}
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.restButton]}
                              onPress={() => handleQuickReply('60 seconds')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>⏱️ 1 min</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.restButton]}
                              onPress={() => handleQuickReply('90 seconds')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>⏱️ 1.5 min</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.restButton]}
                              onPress={() => handleQuickReply('2 minutes')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>⏱️ 2 min</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quickReplyButton, styles.restButton]}
                              onPress={() => handleQuickReply('3 minutes')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>⏱️ 3 min</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            {/* Regular Yes/No/Not Sure Buttons */}
                            <TouchableOpacity
                              style={styles.quickReplyButton}
                              onPress={() => handleQuickReply('Yes')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>✓ Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.quickReplyButton}
                              onPress={() => handleQuickReply('No')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>✕ No</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.quickReplyButton}
                              onPress={() => handleQuickReply('Not sure, can you explain more?')}
                              disabled={loadingButton !== null}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.quickReplyText}>? Not sure</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Weight/Reps/RPE Input Form - Show after exercise selection */}
                  {selectedExercise && (
                    <View style={styles.weightRepsContainer}>
                      <View style={styles.weightRepsHeader}>
                        <Text style={styles.weightRepsTitle}>🏋️ {selectedExercise}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedExercise(null);
                            setWeightInput('');
                            setRepsInput('');
                            setRpeInput('');
                          }}
                          style={styles.cancelExerciseButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.weightRepsLabel}>
                        {isRPERequested ? 'Enter weight, reps, and RPE:' : 'Enter weight and reps:'}
                      </Text>
                      <View style={styles.weightRepsInputRow}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Weight (lbs)</Text>
                          <TextInput
                            style={styles.weightRepsInput}
                            placeholder="225"
                            placeholderTextColor={Colors.textMuted}
                            value={weightInput}
                            onChangeText={setWeightInput}
                            keyboardType="numeric"
                            editable={loadingButton === null}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.weightRepsInput}
                            placeholder="8"
                            placeholderTextColor={Colors.textMuted}
                            value={repsInput}
                            onChangeText={setRepsInput}
                            keyboardType="numeric"
                            editable={loadingButton === null}
                          />
                        </View>
                        {isRPERequested && (
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>RPE (1-10)</Text>
                            <TextInput
                              style={styles.weightRepsInput}
                              placeholder="8"
                              placeholderTextColor={Colors.textMuted}
                              value={rpeInput}
                              onChangeText={setRpeInput}
                              keyboardType="numeric"
                              editable={loadingButton === null}
                            />
                          </View>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.logSetButton,
                            (!weightInput.trim() || !repsInput.trim() || (isRPERequested && !rpeInput.trim()) || loadingButton !== null) && styles.logSetButtonDisabled
                          ]}
                          onPress={handleLogSet}
                          disabled={!weightInput.trim() || !repsInput.trim() || (isRPERequested && !rpeInput.trim()) || loadingButton !== null}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="checkmark"
                            size={24}
                            color={weightInput.trim() && repsInput.trim() && (!isRPERequested || rpeInput.trim()) && loadingButton === null ? Colors.white : Colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Text Input - Always show for custom replies */}
                  <View style={styles.replyInputContainer}>
                    <Text style={styles.replyInputLabel}>Continue conversation:</Text>
                    <View style={styles.replyInputRow}>
                      <TextInput
                        style={styles.replyInput}
                        placeholder="Type your reply..."
                        placeholderTextColor={Colors.textMuted}
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                        maxLength={500}
                        editable={loadingButton === null}
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          (!replyText.trim() || loadingButton !== null) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendReply}
                        disabled={!replyText.trim() || loadingButton !== null}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="send"
                          size={20}
                          color={replyText.trim() && loadingButton === null ? Colors.white : Colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Custom Workout Input */}
              {showCustomInput && !lastResponse && (
                <View style={styles.customInputContainer}>
                  <View style={styles.customInputHeader}>
                    <Text style={styles.customInputTitle}>💬 Describe your workout</Text>
                    <TouchableOpacity
                      onPress={() => setShowCustomInput(false)}
                      style={styles.customInputCloseButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.customInputRow}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Type your workout request..."
                      placeholderTextColor={Colors.textMuted}
                      value={customInputText}
                      onChangeText={setCustomInputText}
                      multiline
                      maxLength={500}
                      editable={loadingButton === null}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!customInputText.trim() || loadingButton !== null) && styles.sendButtonDisabled
                      ]}
                      onPress={handleSendCustomWorkout}
                      disabled={!customInputText.trim() || loadingButton !== null}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="send"
                        size={20}
                        color={customInputText.trim() && loadingButton === null ? Colors.white : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Loading Indicator */}
              {loadingButton && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    💭 Thinking about "{loadingButton}"...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 20 : 40,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  noSectionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  noSectionsIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  noSectionsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  responseContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  responseIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  responseTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  responseText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickReplyContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickReplyLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  quickReplyButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quickReplyButton: {
    flex: 1,
    minWidth: 90,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  daysButton: {
    minWidth: 60,
    maxWidth: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '50',
    borderWidth: 2.5,
    marginHorizontal: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  muscleGroupButton: {
    minWidth: 115,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '50',
    borderWidth: 2.5,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  saveLocationButton: {
    minWidth: 140,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  exerciseButton: {
    minWidth: 120,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '60',
    borderWidth: 2,
  },
  quickReplyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  weightRepsContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  weightRepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weightRepsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cancelExerciseButton: {
    padding: Spacing.xs,
  },
  // Manual Reorder UI Styles
  reorderContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  reorderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  reorderIcon: {
    fontSize: 24,
  },
  reorderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reorderInstructions: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  positionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  positionButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionButtonSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  positionButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  positionButtonTextSelected: {
    color: Colors.primary,
  },
  exerciseListContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  reorderExerciseButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderLeftWidth: 6, // Will be overridden with color
  },
  reorderExerciseButtonDisabled: {
    opacity: 0.5,
  },
  reorderExerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exerciseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reorderExerciseButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  reorderExerciseButtonTextDisabled: {
    color: Colors.textMuted,
  },
  reorderActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  reorderActionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  reorderActionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weightRepsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  weightRepsInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  weightRepsInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
  },
  logSetButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logSetButtonDisabled: {
    backgroundColor: Colors.textMuted + '30',
  },
  replyInputContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  customInputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '50',
  },
  customInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  customInputTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  customInputCloseButton: {
    padding: 4,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    maxHeight: 120,
    minHeight: 80,
  },
});
