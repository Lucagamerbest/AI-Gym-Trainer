import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import QuickSuggestions from './QuickSuggestions';
import QuickAITests from './QuickAITests';

export default function AIChatModal({ visible, onClose, initialMessage = '' }) {
  const { user } = useAuth(); // Get real user from AuthContext
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [contextualButtons, setContextualButtons] = useState(null); // For muscle focus, days, etc.
  const flatListRef = useRef(null);
  const hasProcessedInitialMessage = useRef(false);
  const lastGeneratedWorkout = useRef(null); // Store last generated workout for saving

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

  // Auto-scroll when keyboard appears and hide suggestions
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          // Hide suggestions when keyboard opens
          setShowSuggestions(false);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          // Show suggestions again when keyboard closes (if messages are few)
          if (messages.length <= 2) {
            setShowSuggestions(true);
          }
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, [messages.length]);

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
            return { exerciseName: exerciseData.name, isPRQuestion };
          }
        }
      }
    } catch (error) {
      // Fuzzy match failed
    }

    // If PR question but no specific exercise found, might be asking about current workout
    return { exerciseName: null, isPRQuestion };
  };

  const handleSendMessage = async (messageToSend) => {
    if (!messageToSend || loading) return;

    const userMessage = messageToSend.trim();

    // Start timing
    const startTime = performance.now();

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    // Get AI response
    setLoading(true);
    try {
      // Log user question
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 USER:', userMessage);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Get real user ID from AuthContext
      const userId = user?.uid || 'guest';

      const context = await ContextManager.getFullContext(userId);

      // Add screen-specific context
      let screenContext = {};
      const currentScreen = context.screen;

      if (currentScreen?.includes('Workout')) {
        screenContext = await ContextManager.getWorkoutContext();
      } else if (currentScreen?.includes('Nutrition') || currentScreen?.includes('Food')) {
        screenContext = await ContextManager.getNutritionContext(userId);
      } else if (currentScreen?.includes('Progress')) {
        screenContext = await ContextManager.getProgressContext();
      }

      // Only detect exercises if message contains exercise keywords (skip for general questions)
      const lowerMessage = userMessage.toLowerCase();
      const hasExerciseKeywords = lowerMessage.includes('pr') || lowerMessage.includes('bench') ||
                                   lowerMessage.includes('squat') || lowerMessage.includes('deadlift') ||
                                   lowerMessage.includes('press') || lowerMessage.includes('weight');

      let exerciseContext = {};

      if (hasExerciseKeywords) {
        const { exerciseName, isPRQuestion } = await detectExerciseName(userMessage);

        if (exerciseName) {
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
        }
      }

      const fullContext = {
        ...context,
        screenSpecific: screenContext,
        exerciseSpecific: exerciseContext,
        lastGeneratedWorkout: lastGeneratedWorkout.current, // Pass last generated workout
      };

      // Detect if this is a complex query that needs tools
      const needsTools = userMessage.toLowerCase().includes('plan') ||
                         userMessage.toLowerCase().includes('create') ||
                         userMessage.toLowerCase().includes('generate') ||
                         userMessage.toLowerCase().includes('workout for') ||
                         userMessage.toLowerCase().includes('calculate') ||
                         userMessage.toLowerCase().includes('search') ||
                         userMessage.toLowerCase().includes('find') ||
                         userMessage.toLowerCase().includes('recommend') ||
                         userMessage.toLowerCase().includes('suggest') ||
                         userMessage.toLowerCase().includes('analyze') ||
                         userMessage.toLowerCase().includes('show me') ||
                         userMessage.toLowerCase().includes('what exercises') ||
                         userMessage.toLowerCase().includes('meal') ||
                         userMessage.toLowerCase().includes('save');

      // Use tool-enabled AI for complex queries, regular AI for simple questions
      console.log('🔧 needsTools:', needsTools, 'for message:', userMessage.substring(0, 50));

      const result = needsTools
        ? await AIService.sendMessageWithTools(userMessage, fullContext)
        : await AIService.sendMessage(userMessage, fullContext);

      console.log('📦 AI Result:', { hasResponse: !!result.response, hasToolResults: !!result.toolResults });
      console.log('📦 Full response text:', result.response);

      // Store generated workout if one was created
      if (result.toolResults) {
        const workoutGenerated = result.toolResults.find(t => t.name === 'generateWorkoutPlan');
        if (workoutGenerated && workoutGenerated.result?.success) {
          lastGeneratedWorkout.current = workoutGenerated.result.workout;
          console.log('💾 Stored workout for saving:', lastGeneratedWorkout.current.title);
        }
      }

      // Detect if AI is asking for muscle focus or program creation
      const responseText = result.response.toLowerCase();

      console.log('🔍 Checking for contextual buttons...');
      console.log('   Response snippet:', responseText.substring(0, 100));

      const isAskingMuscleGroup =
        responseText.includes('muscle group') ||
        responseText.includes('which muscles') ||
        responseText.includes('focus on') ||
        (responseText.includes('program') && (responseText.includes('create') || responseText.includes('new'))) ||
        responseText.includes('what.*goal') ||
        responseText.includes('hypertrophy') ||
        responseText.includes('strength');

      console.log('   Triggers: muscle group?', responseText.includes('muscle group'));
      console.log('   Triggers: focus on?', responseText.includes('focus on'));
      console.log('   Triggers: program+create?', responseText.includes('program') && responseText.includes('create'));
      console.log('   Final decision:', isAskingMuscleGroup ? 'SHOW BUTTONS' : 'NO BUTTONS');

      if (isAskingMuscleGroup) {
        console.log('🎯 SHOWING MUSCLE FOCUS BUTTONS');
        setContextualButtons({
          type: 'muscle_focus',
          options: [
            { icon: 'fitness', text: 'All Balanced', value: 'balanced' },
            { icon: 'body', text: 'Chest', value: 'chest' },
            { icon: 'body', text: 'Back', value: 'back' },
            { icon: 'walk', text: 'Legs', value: 'legs' },
            { icon: 'barbell', text: 'Arms', value: 'arms' },
            { icon: 'barbell', text: 'Shoulders', value: 'shoulders' },
          ]
        });
      } else {
        console.log('❌ Not showing buttons');
        setContextualButtons(null);
      }

      // Log AI response
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 AI:', result.response);
      if (result.toolsUsed) {
        console.log(`🔧 Tools used: ${result.toolsUsed}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      addMessage({
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        model: result.model,
        toolsUsed: result.toolsUsed,
      });

      // Debug: Log contextual buttons state
      console.log('📊 Contextual Buttons State:', contextualButtons);
    } catch (error) {
      console.error('AI error:', error);

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

  // Parse markdown **bold** syntax
  const parseMarkdown = (text) => {
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          bold: false,
        });
      }
      // Add the bold text
      parts.push({
        text: match[1],
        bold: true,
      });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        bold: false,
      });
    }

    return parts.length > 0 ? parts : [{ text, bold: false }];
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const parsedContent = parseMarkdown(item.content);

    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.aiText
        ]}>
          {parsedContent.map((part, index) => (
            <Text
              key={index}
              style={part.bold ? styles.boldText : null}
            >
              {part.text}
            </Text>
          ))}
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
    console.log('💬 Quick suggestion pressed:', suggestionText);
    // Auto-fill and send the suggestion
    setInputText(suggestionText);
    setShowSuggestions(false); // Hide suggestions after selection
    // Auto-send the message
    setTimeout(() => {
      console.log('📤 Auto-sending suggestion...');
      handleSendMessage(suggestionText);
    }, 100);
  };

  const handleQuickTest = (query) => {
    setInputText(query);
    setShowSuggestions(false);
    // Auto-send the test query
    setTimeout(() => {
      handleSendMessage(query);
    }, 100);
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

  const handleContextualButtonPress = (option) => {
    setContextualButtons(null); // Hide buttons after selection
    handleSendMessage(option.text); // Send the selection as a message
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
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
            keyboardDismissMode="interactive"
          />

          {/* Loading indicator - Enhanced visibility */}
          {loading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            </View>
          )}

          {/* Quick Test Buttons - DEVELOPMENT ONLY */}
          {__DEV__ && (
            <QuickAITests onTestQuery={handleQuickTest} />
          )}

          {/* Quick Suggestions - Only show when toggled on */}
          {showSuggestions && (
            <QuickSuggestions
              screen={ContextManager.currentScreen}
              onSuggestionPress={handleSuggestionPress}
              userId={user?.uid || 'guest'}
            />
          )}

          {/* Contextual Quick Reply Buttons (Muscle Focus, etc.) */}
          {contextualButtons && (
            <View style={styles.contextualButtonsContainer}>
              <Text style={styles.contextualButtonsTitle}>Quick Replies:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contextualButtonsScroll}
              >
                {contextualButtons.options.map((option, index) => {
                  console.log(`🔘 Rendering button ${index}:`, option.text);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.contextualButton}
                      onPress={() => {
                        console.log('🔘 Button pressed:', option.text);
                        handleContextualButtonPress(option);
                      }}
                    >
                      <Ionicons name={option.icon} size={18} color={Colors.primary} />
                      <Text style={styles.contextualButtonText}>{option.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
          {!contextualButtons && console.log('❌ Contextual buttons is NULL/undefined')}

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
              onContentSizeChange={() => {
                // Scroll messages to bottom when input expands
                flatListRef.current?.scrollToEnd({ animated: true });
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
  boldText: {
    fontWeight: '900', // Extra bold (heaviest weight)
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    fontSize: Typography.fontSize.md + 1, // Slightly larger
    color: Colors.primary, // Use primary color for emphasis
  },
  modelText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    alignItems: 'flex-start',
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: Spacing.md, // Reduced padding for tighter keyboard spacing
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
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
    minHeight: 40, // Reduced for tighter spacing
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
  contextualButtonsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 2,
    borderTopColor: Colors.primary + '40',
  },
  contextualButtonsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  contextualButtonsScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  contextualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  contextualButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
});
