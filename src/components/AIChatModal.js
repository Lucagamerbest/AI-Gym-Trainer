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
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import QuickSuggestions from './QuickSuggestions';
import QuickAITests from './QuickAITests';
import ThinkingAnimation from './ThinkingAnimation';
import MacroStatsCard from './MacroStatsCard';

export default function AIChatModal({ visible, onClose, initialMessage = '' }) {
  const { user } = useAuth(); // Get real user from AuthContext
  const navigation = useNavigation(); // For navigating to RecipesScreen
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
      // Clear any corrupted chat history on first load
      clearCorruptedMessages();

      // Add welcome message when first opening
      addMessage({
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString(),
      });
    }
  }, [visible]);

  // Clear any corrupted messages from storage
  const clearCorruptedMessages = async () => {
    try {
      await AsyncStorage.removeItem('@ai_chat_messages');
      console.log('✅ Cleared any corrupted chat history');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

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
    // Safety check: Ensure message content is a string
    if (message && typeof message.content !== 'string') {
      console.warn('⚠️ addMessage received non-string content:', typeof message.content);
      message = {
        ...message,
        content: String(message.content || 'Error: Invalid message content')
      };
    }

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
      console.log('🆔 User ID:', userId);

      const context = await ContextManager.getFullContext(userId);
      console.log('📦 Full Context:', JSON.stringify(context, null, 2));

      // Add screen-specific context
      let screenContext = {};
      const currentScreen = context.screen;
      console.log('📱 Current Screen:', currentScreen);

      // ALWAYS fetch nutrition context (not just on Nutrition screens)
      // This allows AI to see macros from ANY screen
      const nutritionContext = await ContextManager.getNutritionContext(userId);
      console.log('🍎 Nutrition Context (universal):', JSON.stringify(nutritionContext, null, 2));

      if (currentScreen?.includes('Workout')) {
        const workoutContext = await ContextManager.getWorkoutContext();
        console.log('🏋️ Workout Context:', JSON.stringify(workoutContext, null, 2));
        screenContext = { ...nutritionContext, ...workoutContext };
      } else if (currentScreen?.includes('Nutrition') || currentScreen?.includes('Food')) {
        screenContext = nutritionContext;
      } else if (currentScreen?.includes('Progress')) {
        const progressContext = await ContextManager.getProgressContext();
        console.log('📊 Progress Context:', JSON.stringify(progressContext, null, 2));
        screenContext = { ...nutritionContext, ...progressContext };
      } else {
        // For all other screens, still include nutrition context
        screenContext = nutritionContext;
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

      console.log('🎯 FULL CONTEXT BEING SENT TO AI:');
      console.log('   - Screen:', fullContext.screen);
      console.log('   - User ID:', userId);
      console.log('   - Screen Specific Data:', JSON.stringify(fullContext.screenSpecific, null, 2));
      console.log('   - Exercise Specific Data:', JSON.stringify(fullContext.exerciseSpecific, null, 2));

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
                         userMessage.toLowerCase().includes('save') ||
                         userMessage.toLowerCase().includes('track') ||
                         userMessage.toLowerCase().includes('macros') ||
                         userMessage.toLowerCase().includes('calories') ||
                         userMessage.toLowerCase().includes('protein') ||
                         userMessage.toLowerCase().includes('on track');

      // Use tool-enabled AI for complex queries, regular AI for simple questions
      console.log('🔧 needsTools:', needsTools, 'for message:', userMessage.substring(0, 50));

      console.log('⏳ About to call AIService...');
      const result = needsTools
        ? await AIService.sendMessageWithTools(userMessage, fullContext)
        : await AIService.sendMessage(userMessage, fullContext);
      console.log('✅ AIService call completed!');

      console.log('📦 AI Result:', { hasResponse: !!result.response, hasToolResults: !!result.toolResults });
      console.log('📦 Full response text:', result.response);
      console.log('📦 Tool results:', result.toolResults);

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

      console.log('📦 Adding message with toolResults:', result.toolResults);
      console.log('📦 toolResults array length:', result.toolResults?.length);
      console.log('📦 toolResults[0]:', result.toolResults?.[0]);

      const messageToAdd = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        model: result.model,
        toolsUsed: result.toolsUsed,
        toolResults: result.toolResults, // Pass tool results for recipe cards, etc.
      };

      console.log('📦 About to add message:', messageToAdd);
      addMessage(messageToAdd);
      console.log('✅ Message added to state');

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
    // Safety check: Ensure text is a string
    if (typeof text !== 'string') {
      console.warn('⚠️ parseMarkdown received non-string:', typeof text, text);
      text = String(text || '');
    }

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

  const handleSaveRecipe = async (recipeCard) => {
    try {
      const fullRecipe = recipeCard.fullRecipe;
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const RECIPES_KEY = '@saved_recipes';

      const savedRecipesStr = await AsyncStorage.getItem(RECIPES_KEY);
      const savedRecipes = savedRecipesStr ? JSON.parse(savedRecipesStr) : [];

      savedRecipes.push(fullRecipe);
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(savedRecipes));

      // Update the message to show it was saved
      addMessage({
        role: 'assistant',
        content: `✅ Recipe "${fullRecipe.title}" saved to your collection!`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      addMessage({
        role: 'assistant',
        content: "Sorry, there was an error saving the recipe. Please try again.",
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleDiscardRecipe = () => {
    addMessage({
      role: 'assistant',
      content: "Recipe discarded. Let me know if you'd like to generate another one!",
      timestamp: new Date().toISOString(),
    });
  };

  const handleRegenerateRecipe = async (recipeCard) => {
    const originalIngredients = recipeCard.originalIngredients;
    addMessage({
      role: 'assistant',
      content: "Generating a new recipe with different approach...",
      timestamp: new Date().toISOString(),
    });

    // Auto-send the recipe generation request again
    setTimeout(() => {
      handleSendMessage(`Create a different recipe using: ${originalIngredients.join(', ')}`);
    }, 500);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    // Safety check: Ensure content is a string
    const contentText = typeof item.content === 'string' ? item.content : String(item.content || '');
    const parsedContent = parseMarkdown(contentText);

    // Check if this message has a recipe card
    console.log('🔍 Rendering message, toolResults:', item.toolResults);
    const toolResult = item.toolResults?.find(tool => tool.result?.recipeCard);
    console.log('🔍 Found toolResult:', toolResult);
    const recipeCard = toolResult?.result?.recipeCard;
    console.log('🔍 Recipe card:', recipeCard);

    // Check if this message has macro data from tools
    const macroToolResult = item.toolResults?.find(tool =>
      tool.name === 'predictDailyMacroShortfall' ||
      tool.name === 'getNutritionStatus' ||
      tool.name === 'suggestNextMealForBalance'
    );
    // Handle both data and status structures
    const macroData = macroToolResult?.result?.data || macroToolResult?.result?.status;

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

        {/* Macro Stats Card - shown when tool returns macro data */}
        {macroData && macroData.consumed && macroData.goals && (
          <View style={styles.macroCardWrapper}>
            <MacroStatsCard
              macros={{
                calories: {
                  consumed: macroData.consumed.calories,
                  target: macroData.goals.calories,
                  remaining: macroData.remaining?.calories || (macroData.goals.calories - macroData.consumed.calories),
                },
                protein: {
                  consumed: macroData.consumed.protein,
                  target: macroData.goals.protein,
                  remaining: macroData.remaining?.protein || (macroData.goals.protein - macroData.consumed.protein),
                },
                carbs: {
                  consumed: macroData.consumed.carbs,
                  target: macroData.goals.carbs,
                  remaining: macroData.remaining?.carbs || (macroData.goals.carbs - macroData.consumed.carbs),
                },
                fat: {
                  consumed: macroData.consumed.fat,
                  target: macroData.goals.fat,
                  remaining: macroData.remaining?.fat || (macroData.goals.fat - macroData.consumed.fat),
                },
              }}
              title="📊 Today's Macros"
              subtitle={macroData.dayProgress ? `${Math.round(macroData.dayProgress * 100)}% through the day` : undefined}
            />
          </View>
        )}

        {/* Recipe Card */}
        {recipeCard && (
          <View style={styles.recipeCard}>
            <View style={styles.recipeCardHeader}>
              <Text style={styles.recipeCardTitle}>{recipeCard.title}</Text>
              <Text style={styles.recipeServings}>Serves {recipeCard.servings}</Text>
            </View>
            <View style={styles.recipeNutrition}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeCard.calories}</Text>
                <Text style={styles.nutritionLabel}>cal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeCard.protein}g</Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeCard.carbs}g</Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeCard.fat}g</Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
            <View style={styles.recipeTimings}>
              <Text style={styles.recipeTime}>⏱️ {recipeCard.prepTime} prep</Text>
              <Text style={styles.recipeTime}>🔥 {recipeCard.cookTime} cook</Text>
            </View>

            {/* Confirmation Buttons or View Recipe Button */}
            {recipeCard.needsConfirmation ? (
              <View style={styles.recipeConfirmationButtons}>
                <TouchableOpacity
                  style={[styles.recipeActionButton, styles.saveRecipeButton]}
                  onPress={() => handleSaveRecipe(recipeCard)}
                >
                  <Ionicons name="save" size={18} color="#fff" />
                  <Text style={styles.saveRecipeText}>Save to Recipes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recipeActionButton, styles.discardRecipeButton]}
                  onPress={handleDiscardRecipe}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                  <Text style={styles.discardRecipeText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recipeActionButton, styles.regenerateRecipeButton]}
                  onPress={() => handleRegenerateRecipe(recipeCard)}
                >
                  <Ionicons name="refresh" size={18} color={Colors.primary} />
                  <Text style={styles.regenerateRecipeText}>Generate New</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.viewRecipeButton}
                onPress={() => {
                  onClose();
                  navigation.navigate('RecipesScreen', { highlightRecipe: recipeCard.recipeId });
                }}
              >
                <Ionicons name="book" size={18} color={Colors.primary} />
                <Text style={styles.viewRecipeText}>View Full Recipe</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
              <ThinkingAnimation text="Thinking" />
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
  recipeCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeCardHeader: {
    marginBottom: Spacing.sm,
  },
  recipeCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  recipeServings: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  recipeNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  recipeTimings: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recipeTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  viewRecipeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  recipeConfirmationButtons: {
    gap: Spacing.sm,
  },
  recipeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  saveRecipeButton: {
    backgroundColor: Colors.primary,
  },
  saveRecipeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: '#000',
  },
  discardRecipeButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  discardRecipeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.error,
  },
  regenerateRecipeButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  regenerateRecipeText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
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
  macroCardWrapper: {
    marginTop: Spacing.md,
    width: '100%',
  },
});
