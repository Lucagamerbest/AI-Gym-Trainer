import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, TextInput, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

  // Get sections for this screen
  const sections = getAISectionsForScreen(screenName);

  // Initialize first section as expanded
  useEffect(() => {
    if (visible && sections.length > 0) {
      setExpandedSections({ 0: true });
    }
  }, [visible]);

  // Clear state when modal closes to prevent auto-close on reopen
  useEffect(() => {
    if (!visible) {
      setLastResponse(null);
      setConversationHistory([]);
      setReplyText('');
      setLoadingButton(null);
    }
  }, [visible]);

  // Auto-close modal after successful save
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

    const isSaveSuccess = saveSuccessKeywords.some(keyword => lowerResponse.includes(keyword));

    if (isSaveSuccess) {
      // Close modal after 2 seconds to let user see the success message
      setTimeout(() => {
        onClose();
      }, 2000);
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
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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
                  {isQuestion && (
                    <View style={styles.quickReplyContainer}>
                      <Text style={styles.quickReplyLabel}>
                        {isDaysQuestion ? 'Days per week:' : isSaveLocationQuestion ? 'Save to:' : isMuscleGroupQuestion ? 'Focus on:' : 'Quick Reply:'}
                      </Text>
                      <View style={styles.quickReplyButtons}>
                        {isDaysQuestion ? (
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
      </View>
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
  quickReplyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 0.3,
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
});
