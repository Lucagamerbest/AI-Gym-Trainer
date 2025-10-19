import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import QuickSuggestions from './QuickSuggestions';

export default function AIChatModal({ visible, onClose, initialMessage = '' }) {
  const { user } = useAuth(); // Get real user from AuthContext
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef(null);
  const hasProcessedInitialMessage = useRef(false);

  useEffect(() => {
    if (visible && messages.length === 0) {
      // Add welcome message when first opening
      addMessage({
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString(),
      });
    }
  }, [visible]);

  // Handle initial message from proactive suggestions
  useEffect(() => {
    if (visible && initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true;
      // Auto-send the initial message
      setInputText(initialMessage);
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 500);
    } else if (!visible) {
      // Reset when modal closes
      hasProcessedInitialMessage.current = false;
    }
  }, [visible, initialMessage]);

  // Auto-scroll when keyboard appears
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
      };
    }
  }, []);

  const getWelcomeMessage = () => {
    const screen = ContextManager.currentScreen;
    const welcomes = {
      StartWorkoutScreen: "Hey! Ready to create a workout? I can help you plan the perfect session!",
      WorkoutDetailScreen: "Hey! I'm here to help with your workout. How's it going?",
      NutritionDashboard: "Hi! Ready to talk about your nutrition goals?",
      ProgressScreen: "Hello! Let's review your progress together.",
      WorkoutHistoryScreen: "Hi! Ready to plan your upcoming workouts or review your progress?",
      PlannedWorkoutDetailScreen: "Hey! Let me help you optimize this planned workout.",
      default: "Hi! I'm your AI fitness coach. How can I help you today?",
    };
    return welcomes[screen] || welcomes.default;
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const detectExerciseName = async (message) => {
    // Try to detect exercise names from user's message
    const lowerMessage = message.toLowerCase();

    // Common exercise keywords to look for (sorted by length - longest first for better matching)
    const exerciseKeywords = [
      'dumbbell bench press', 'barbell bench press', 'incline bench press',
      'decline bench press', 'close grip bench press', 'shoulder press',
      'overhead press', 'lateral raise', 'tricep extension', 'bicep curl',
      'lat pulldown', 'leg extension', 'bench press', 'chest fly',
      'face pull', 'calf raise', 'leg press', 'leg curl',
      'deadlift', 'pull up', 'squat', 'row'
    ];

    // Check if message contains PR/record keywords
    const isPRQuestion = lowerMessage.includes('pr') ||
                         lowerMessage.includes('personal record') ||
                         lowerMessage.includes('max') ||
                         lowerMessage.includes('best') ||
                         lowerMessage.includes('strongest') ||
                         lowerMessage.includes('heaviest');

    // Find matching exercise name (longest match first)
    for (const exercise of exerciseKeywords) {
      if (lowerMessage.includes(exercise)) {
        return { exerciseName: exercise, isPRQuestion };
      }
    }

    // If no keyword match, try to get user's actual exercises and fuzzy match
    // Note: This runs before we have access to the user from useAuth, so we need to get it here
    try {
      // Try to get user from AsyncStorage first (may be outdated)
      // Better: We'll get the real user later in handleSend
      const userStr = await AsyncStorage.getItem('user');
      const userFromStorage = userStr ? JSON.parse(userStr) : null;

      // Import auth to get real user
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid || userFromStorage?.uid || 'guest';

      const { WorkoutStorageService } = await import('../services/workoutStorage');
      const allProgress = await WorkoutStorageService.getExerciseProgress(userId);

      if (allProgress && Object.keys(allProgress).length > 0) {
        // Check if any user exercise name is in the message
        for (const [exerciseKey, exerciseData] of Object.entries(allProgress)) {
          const exerciseName = exerciseData.name.toLowerCase();
          // Check both ways: message contains exercise name OR exercise name contains message keywords
          if (lowerMessage.includes(exerciseName) ||
              exerciseName.split(' ').some(word => word.length > 3 && lowerMessage.includes(word))) {
            console.log(`🎯 Fuzzy matched user exercise: ${exerciseData.name}`);
            return { exerciseName: exerciseData.name, isPRQuestion };
          }
        }
      }
    } catch (error) {
      console.log('Could not fuzzy match exercises:', error);
    }

    // If PR question but no specific exercise found, might be asking about current workout
    return { exerciseName: null, isPRQuestion };
  };

  const handleSendMessage = async (messageToSend) => {
    if (!messageToSend || loading) return;

    const userMessage = messageToSend.trim();

    // Start timing
    const startTime = performance.now();
    console.log(`⏱️ [${new Date().toLocaleTimeString()}] User message sent`);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    // Get AI response
    setLoading(true);
    try {
      // Get real user ID from AuthContext
      const userId = user?.uid || 'guest';
      console.log(`🔍 AIChatModal userId from AuthContext: ${userId}`);
      console.log(`🔍 Full user object:`, user);

      const contextStart = performance.now();
      const context = await ContextManager.getFullContext(userId);
      const contextTime = performance.now() - contextStart;
      console.log(`⏱️ Context gathered in ${contextTime.toFixed(0)}ms`);

      // Add screen-specific context
      let screenContext = {};
      const currentScreen = context.screen;

      const screenContextStart = performance.now();
      console.log(`🔍 About to call getNutritionContext with userId: ${userId}`);
      if (currentScreen?.includes('Workout')) {
        screenContext = await ContextManager.getWorkoutContext();
      } else if (currentScreen?.includes('Nutrition') || currentScreen?.includes('Food')) {
        screenContext = await ContextManager.getNutritionContext(userId);
      } else if (currentScreen?.includes('Progress')) {
        screenContext = await ContextManager.getProgressContext();
      }
      const screenContextTime = performance.now() - screenContextStart;
      console.log(`⏱️ Screen context in ${screenContextTime.toFixed(0)}ms`);

      // Only detect exercises if message contains exercise keywords (skip for general questions)
      const exerciseDetectStart = performance.now();
      const lowerMessage = userMessage.toLowerCase();
      const hasExerciseKeywords = lowerMessage.includes('pr') || lowerMessage.includes('bench') ||
                                   lowerMessage.includes('squat') || lowerMessage.includes('deadlift') ||
                                   lowerMessage.includes('press') || lowerMessage.includes('weight');

      let exerciseContext = {};

      if (hasExerciseKeywords) {
        const { exerciseName, isPRQuestion } = await detectExerciseName(userMessage);

        if (exerciseName) {
          console.log(`🎯 Detected exercise query: ${exerciseName}`);

          // Fetch exercise-specific data using real user ID
          const [history, pr, progression] = await Promise.all([
            ContextManager.getExerciseHistory(exerciseName, userId, 5),
            ContextManager.getExercisePR(exerciseName, userId, 'weight'),
            ContextManager.getExerciseProgression(exerciseName, userId, 30),
          ]);

          exerciseContext = {
            exerciseName,
            history,
            pr,
            progression,
          };

          console.log('📊 Exercise context:', exerciseContext);
        }
      }
      const exerciseDetectTime = performance.now() - exerciseDetectStart;
      console.log(`⏱️ Exercise detection in ${exerciseDetectTime.toFixed(0)}ms`);

      const fullContext = {
        ...context,
        screenSpecific: screenContext,
        exerciseSpecific: exerciseContext,
      };

      const aiCallStart = performance.now();
      const result = await AIService.sendMessage(userMessage, fullContext);
      const aiCallTime = performance.now() - aiCallStart;
      console.log(`⏱️ AI API call in ${aiCallTime.toFixed(0)}ms`);

      // Add AI response
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ ✅ TOTAL TIME: ${totalTime.toFixed(0)}ms (${(totalTime/1000).toFixed(2)}s)`);
      console.log(`⏱️ [${new Date().toLocaleTimeString()}] AI response received`);

      addMessage({
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        model: result.model,
      });
    } catch (error) {
      console.error('AI error:', error);
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ ❌ FAILED after ${totalTime.toFixed(0)}ms`);

      addMessage({
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await handleSendMessage(userMessage);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.aiText
        ]}>
          {item.content}
        </Text>
        {item.model && (
          <Text style={styles.modelText}>
            {item.model}
          </Text>
        )}
      </View>
    );
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleSuggestionPress = (suggestionText) => {
    // Auto-fill the input with the suggestion
    setInputText(suggestionText);
    // Optionally, auto-send the message
    // setTimeout(() => handleSend(), 100);
  };

  const toggleSuggestions = () => {
    setShowSuggestions(prev => !prev);
  };

  const handleScroll = () => {
    // Auto-hide suggestions when user scrolls through messages
    if (showSuggestions && messages.length > 2) {
      setShowSuggestions(false);
    }
  };

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
            <Text style={styles.headerTitle}>🤖 AI Coach</Text>
            <Text style={styles.headerSubtitle}>
              {ContextManager.currentScreen || 'Chat'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleSuggestions}
            >
              <Text style={styles.headerButtonText}>{showSuggestions ? '💡' : '💬'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={clearChat}
            >
              <Text style={styles.headerButtonText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClose}
            >
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? 'height' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            keyboardShouldPersistTaps="handled"
          />

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}

          {/* Quick Suggestions - Only show when toggled on */}
          {showSuggestions && (
            <QuickSuggestions
              screen={ContextManager.currentScreen}
              onSuggestionPress={handleSuggestionPress}
              userId={user?.uid || 'guest'}
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
              editable={!loading}
              returnKeyType="send"
              blurOnSubmit={false}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
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
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  headerButtonText: {
    fontSize: 20,
    color: Colors.text,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: Colors.text,
  },
  modelText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
    minHeight: 60,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    color: Colors.text,
    maxHeight: 100,
    fontSize: Typography.fontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});
