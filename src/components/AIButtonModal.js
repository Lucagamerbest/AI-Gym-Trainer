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
  const [activeWorkoutExercises, setActiveWorkoutExercises] = useState([]);

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
          }
        } catch (error) {
          console.error('Failed to load active workout exercises:', error);
        }
      }
    };

    loadActiveWorkoutExercises();
  }, [visible, screenName]);

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
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    // Check if this is the custom input button
    if (button.isCustomInput) {
      setShowCustomInput(true);
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

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(button.text, context);

      // Store response
      setLastResponse(result.response);

      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { userMessage: button.text, aiResponse: result.response }
      ]);

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
   * Handle weight/reps submission for selected exercise
   */
  const handleLogSet = async () => {
    if (!selectedExercise || !weightInput.trim() || !repsInput.trim()) return;

    const message = `Log ${weightInput} pounds for ${repsInput} reps on ${selectedExercise}`;

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

      // Clear inputs
      setSelectedExercise(null);
      setWeightInput('');
      setRepsInput('');

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

  // If no sections, show message
  const noSections = !hasAISections(screenName);

  // Detect if AI is asking a question
  const isQuestion = detectQuestion(lastResponse);
  const isDaysQuestion = detectDaysQuestion(lastResponse);
  const isSaveLocationQuestion = detectSaveLocationQuestion(lastResponse);
  const isMuscleGroupQuestion = detectMuscleGroupQuestion(lastResponse);
  const isExerciseLogQuestion = detectExerciseLogQuestion(lastResponse);

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
                  buttons={section.buttons}
                  onButtonPress={handleButtonPress}
                  expanded={expandedSections[index] || false}
                  onToggle={() => toggleSection(index)}
                  loading={loadingButton !== null}
                />
              ))}

              {/* Response Display */}
              {lastResponse && (
                <View style={styles.responseContainer}>
                  <View style={styles.responseHeader}>
                    <Text style={styles.responseIcon}>💬</Text>
                    <Text style={styles.responseTitle}>AI Response</Text>
                  </View>
                  <Text style={styles.responseText}>{lastResponse}</Text>

                  {/* Quick Reply Buttons - Show when AI asks a question */}
                  {isQuestion && !selectedExercise && (
                    <View style={styles.quickReplyContainer}>
                      <Text style={styles.quickReplyLabel}>
                        {isDaysQuestion ? 'Days per week:' : isSaveLocationQuestion ? 'Save to:' : isMuscleGroupQuestion ? 'Focus on:' : isExerciseLogQuestion ? 'Select exercise:' : 'Quick Reply:'}
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

                  {/* Weight/Reps Input Form - Show after exercise selection */}
                  {selectedExercise && (
                    <View style={styles.weightRepsContainer}>
                      <View style={styles.weightRepsHeader}>
                        <Text style={styles.weightRepsTitle}>🏋️ {selectedExercise}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedExercise(null);
                            setWeightInput('');
                            setRepsInput('');
                          }}
                          style={styles.cancelExerciseButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.weightRepsLabel}>Enter weight and reps:</Text>
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
                        <TouchableOpacity
                          style={[
                            styles.logSetButton,
                            (!weightInput.trim() || !repsInput.trim() || loadingButton !== null) && styles.logSetButtonDisabled
                          ]}
                          onPress={handleLogSet}
                          disabled={!weightInput.trim() || !repsInput.trim() || loadingButton !== null}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="checkmark"
                            size={24}
                            color={weightInput.trim() && repsInput.trim() && loadingButton === null ? Colors.white : Colors.textMuted}
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
