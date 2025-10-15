# AI Gym Trainer - Master Implementation Plan (Part 2)
## Phases 10-25: AI Context System, Advanced Features & Deployment

**This document continues from IMPLEMENTATION_MASTER_PLAN.md (Phases 1-9)**

---

## 🧠 PHASE 10: CONTEXT-AWARE AI ARCHITECTURE (Week 4, Days 1-2)

### Objectives
- Design context extraction system
- Build context manager
- Implement screen tracking

### Step-by-Step Instructions

#### Step 10.1: Create Context Manager (2 hours)

Create `src/services/ai/ContextManager.js`:
```javascript
import workoutStorage from '../workoutStorage';
import { foodDatabase } from '../foodDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ContextManager {
  constructor() {
    this.currentScreen = null;
    this.currentActivity = null;
    this.screenData = {};
  }

  // Set current screen context
  setScreen(screenName, data = {}) {
    this.currentScreen = screenName;
    this.screenData = data;
    console.log(`📍 Context: Now on ${screenName}`, data);
  }

  // Set current activity
  setActivity(activity) {
    this.currentActivity = activity;
    console.log(`🎯 Activity: ${activity}`);
  }

  // Get full context for AI
  async getFullContext() {
    const context = {
      screen: this.currentScreen,
      activity: this.currentActivity,
      screenData: this.screenData,
      userData: await this.getUserData(),
      recentActivity: await this.getRecentActivity(),
    };

    return context;
  }

  // Get user profile data
  async getUserData() {
    try {
      const userProfile = await AsyncStorage.getItem('user_profile');
      const goals = await AsyncStorage.getItem('user_goals');

      return {
        profile: userProfile ? JSON.parse(userProfile) : null,
        goals: goals ? JSON.parse(goals) : null,
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return {};
    }
  }

  // Get recent user activity (last 7 days)
  async getRecentActivity() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get recent workouts
      const workouts = await workoutStorage.getWorkouts();
      const recentWorkouts = workouts
        .filter(w => new Date(w.date) >= sevenDaysAgo)
        .slice(0, 5);

      // Get recent meals
      const meals = await foodDatabase.getRecentMeals(7);

      // Calculate stats
      const totalWorkouts = recentWorkouts.length;
      const totalVolume = recentWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
      const avgCalories = meals.length > 0
        ? meals.reduce((sum, m) => sum + m.totalCalories, 0) / meals.length
        : 0;

      return {
        workouts: recentWorkouts.length,
        totalVolume,
        avgCaloriesPerDay: Math.round(avgCalories),
        lastWorkout: recentWorkouts[0] ? recentWorkouts[0].date : null,
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {};
    }
  }

  // Screen-specific context builders
  async getWorkoutContext() {
    if (this.currentScreen !== 'WorkoutScreen') return {};

    const currentWorkout = this.screenData.currentWorkout || {};
    const exercises = currentWorkout.exercises || [];

    return {
      exerciseCount: exercises.length,
      currentExercise: this.screenData.currentExercise,
      totalVolume: currentWorkout.totalVolume || 0,
      duration: currentWorkout.duration || 0,
      muscleGroups: currentWorkout.muscleGroups || [],
    };
  }

  async getNutritionContext() {
    if (!this.currentScreen?.includes('Nutrition') && !this.currentScreen?.includes('Food')) return {};

    try {
      const today = new Date().toISOString().split('T')[0];
      const todaysMeals = await foodDatabase.getMealsByDate(today);

      const totalCalories = todaysMeals.reduce((sum, m) => sum + m.totalCalories, 0);
      const totalProtein = todaysMeals.reduce((sum, m) => sum + m.totalProtein, 0);
      const totalCarbs = todaysMeals.reduce((sum, m) => sum + m.totalCarbs, 0);
      const totalFat = todaysMeals.reduce((sum, m) => sum + m.totalFat, 0);

      const userGoals = await AsyncStorage.getItem('user_goals');
      const goals = userGoals ? JSON.parse(userGoals) : {};

      return {
        todaysMeals: todaysMeals.length,
        calories: {
          consumed: Math.round(totalCalories),
          target: goals.targetCalories || 2000,
          remaining: Math.round((goals.targetCalories || 2000) - totalCalories),
        },
        protein: {
          consumed: Math.round(totalProtein),
          target: goals.proteinGrams || 150,
        },
        carbs: {
          consumed: Math.round(totalCarbs),
          target: goals.carbsGrams || 200,
        },
        fat: {
          consumed: Math.round(totalFat),
          target: goals.fatGrams || 65,
        },
      };
    } catch (error) {
      console.error('Error getting nutrition context:', error);
      return {};
    }
  }

  async getProgressContext() {
    if (this.currentScreen !== 'ProgressScreen' && this.currentScreen !== 'ProgressHub') return {};

    try {
      const progressEntries = await AsyncStorage.getItem('progress_entries');
      const entries = progressEntries ? JSON.parse(progressEntries) : [];

      if (entries.length === 0) return {};

      // Sort by date
      const sorted = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = sorted[0];
      const previous = sorted[1];

      const weightChange = previous
        ? Math.round((latest.weight - previous.weight) * 10) / 10
        : 0;

      return {
        totalEntries: entries.length,
        currentWeight: latest.weight,
        weightChange,
        lastEntry: latest.date,
      };
    } catch (error) {
      console.error('Error getting progress context:', error);
      return {};
    }
  }

  // Build context for specific screen
  async buildContextForScreen(screenName) {
    this.setScreen(screenName);

    const baseContext = await this.getFullContext();

    // Add screen-specific context
    let specificContext = {};
    switch (screenName) {
      case 'WorkoutScreen':
        specificContext = await this.getWorkoutContext();
        break;
      case 'NutritionScreen':
      case 'NutritionDashboard':
      case 'FoodScanResultScreen':
        specificContext = await this.getNutritionContext();
        break;
      case 'ProgressScreen':
      case 'ProgressHub':
        specificContext = await getProgressContext();
        break;
    }

    return {
      ...baseContext,
      screenSpecific: specificContext,
    };
  }
}

export default new ContextManager();
```

#### Step 10.2: Create Screen Tracker HOC (1.5 hours)

Create `src/components/AIScreenTracker.js`:
```javascript
import React, { useEffect } from 'react';
import ContextManager from '../services/ai/ContextManager';

/**
 * Higher-Order Component to track screen context for AI
 * Usage: wrap your screen component with withAITracking
 */
export const withAITracking = (WrappedComponent, screenName) => {
  return (props) => {
    useEffect(() => {
      // Set context when component mounts
      ContextManager.setScreen(screenName, props);

      return () => {
        // Clear context when component unmounts
        ContextManager.setScreen(null);
      };
    }, [props]);

    return <WrappedComponent {...props} />;
  };
};

// Alternative: Hook-based tracking
export const useAITracking = (screenName, data = {}) => {
  useEffect(() => {
    ContextManager.setScreen(screenName, data);

    return () => {
      ContextManager.setScreen(null);
    };
  }, [screenName, data]);
};
```

#### Step 10.3: Add Tracking to Key Screens (2 hours)

Update `src/screens/WorkoutScreen.js`:
```javascript
import { useAITracking } from '../components/AIScreenTracker';

export default function WorkoutScreen({ route, navigation }) {
  // Existing code...

  // Add AI tracking
  useAITracking('WorkoutScreen', {
    currentWorkout: workout,
    currentExercise: currentExerciseIndex,
  });

  // Rest of component...
}
```

Update `src/screens/NutritionDashboard.js`:
```javascript
import { useAITracking } from '../components/AIScreenTracker';

export default function NutritionDashboard({ navigation }) {
  // Add AI tracking
  useAITracking('NutritionDashboard');

  // Rest of component...
}
```

Update `src/screens/ProgressScreen.js`:
```javascript
import { useAITracking } from '../components/AIScreenTracker';

export default function ProgressScreen({ navigation }) {
  // Add AI tracking
  useAITracking('ProgressScreen');

  // Rest of component...
}
```

#### Step 10.4: Test Context Extraction (1 hour)
1. Navigate to different screens
2. Check console logs for context updates
3. Verify context contains relevant data
4. Test context retrieval from AI service

### Verification Checklist
- [ ] ContextManager created
- [ ] Screen tracking HOC/hook created
- [ ] Key screens tracked
- [ ] Context logs show correct data
- [ ] Context available for AI queries

### Deliverables
1. `src/services/ai/ContextManager.js`
2. `src/components/AIScreenTracker.js`
3. Updated screens with tracking
4. Screenshots of context logs

---

## 💬 PHASE 11: AI CHAT INTERFACE (Week 4, Days 3-4)

### Objectives
- Create AI chat component
- Implement message history
- Add floating AI button

### Step-by-Step Instructions

#### Step 11.1: Create Chat Component (3 hours)

Create `src/components/AIChatModal.js`:
```javascript
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
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';

export default function AIChatModal({ visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

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

  const getWelcomeMessage = () => {
    const screen = ContextManager.currentScreen;
    const welcomes = {
      WorkoutScreen: "Hey! I'm here to help with your workout. How's it going?",
      NutritionDashboard: "Hi! Ready to talk about your nutrition goals?",
      ProgressScreen: "Hello! Let's review your progress together.",
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

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    // Get AI response
    setLoading(true);
    try {
      const context = await ContextManager.getFullContext();

      // Add screen-specific context
      let screenContext = {};
      switch (context.screen) {
        case 'WorkoutScreen':
          screenContext = await ContextManager.getWorkoutContext();
          break;
        case 'NutritionDashboard':
        case 'FoodScanResultScreen':
          screenContext = await ContextManager.getNutritionContext();
          break;
        case 'ProgressScreen':
          screenContext = await ContextManager.getProgressContext();
          break;
      }

      const fullContext = {
        ...context,
        screenSpecific: screenContext,
      };

      const result = await AIService.sendMessage(userMessage, fullContext);

      // Add AI response
      addMessage({
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        tokensUsed: result.tokensUsed,
      });

      // TODO: Save conversation to backend
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
        {item.tokensUsed && (
          <Text style={styles.tokenText}>
            {item.tokensUsed} tokens
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Coach</Text>
          <Text style={styles.headerSubtitle}>
            {ContextManager.currentScreen || 'Chat'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    top: Platform.OS === 'ios' ? 60 : 40,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: Spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: Colors.text,
  },
  tokenText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
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
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
```

#### Step 11.2: Create Floating AI Button (1.5 hours)

Create `src/components/FloatingAIButton.js`:
```javascript
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import AIChatModal from './AIChatModal';

export default function FloatingAIButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Text style={styles.icon}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>

      <AIChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
  },
});
```

#### Step 11.3: Add to Key Screens (1 hour)

Update `App.js` to add floating button globally (or add to specific screens):
```javascript
import FloatingAIButton from './src/components/FloatingAIButton';

// Inside the Stack Navigator, after screens:
<>
  {/* All your existing screens */}

  {/* Add floating AI button */}
  {isSignedIn && <FloatingAIButton />}
</>
```

#### Step 11.4: Test Chat Interface (1 hour)
1. Click floating AI button
2. Test sending messages
3. Verify context is passed correctly
4. Check AI responses are relevant
5. Test on different screens

### Verification Checklist
- [ ] Chat modal created
- [ ] Floating button works
- [ ] Messages send/receive correctly
- [ ] Context-aware responses
- [ ] Chat history maintained

### Deliverables
1. `src/components/AIChatModal.js`
2. `src/components/FloatingAIButton.js`
3. Updated App.js or screen files
4. Screenshots of chat interface

---

## 🎯 PHASE 12: SCREEN-SPECIFIC AI PROMPTS (Week 4, Days 5-7)

### Objectives
- Create specialized prompts for each screen
- Implement prompt templates
- Test context-specific responses

### Step-by-Step Instructions

#### Step 12.1: Create Prompt Templates (2.5 hours)

Create `src/services/ai/PromptTemplates.js`:
```javascript
export class PromptTemplates {
  static getSystemPrompt(screen, context) {
    const basePrompt = `You are an expert fitness coach and nutritionist assistant.

User Context:
- Recent workouts: ${context.recentActivity?.workouts || 0} in last 7 days
- Total volume: ${context.recentActivity?.totalVolume || 0} lbs
- Average daily calories: ${context.recentActivity?.avgCaloriesPerDay || 0}

Keep responses concise (2-3 sentences unless asked for details), friendly, and actionable.`;

    const screenPrompts = {
      WorkoutScreen: this.getWorkoutPrompt(context),
      NutritionDashboard: this.getNutritionPrompt(context),
      FoodScanResultScreen: this.getFoodScanPrompt(context),
      ProgressScreen: this.getProgressPrompt(context),
      HomeScreen: this.getHomePrompt(context),
    };

    const screenPrompt = screenPrompts[screen] || '';

    return `${basePrompt}\n\n${screenPrompt}`;
  }

  static getWorkoutPrompt(context) {
    const workout = context.screenSpecific || {};

    return `CURRENT CONTEXT: Workout Screen
The user is currently doing a workout with ${workout.exerciseCount || 0} exercises.
Total volume so far: ${workout.totalVolume || 0} lbs
Duration: ${Math.round((workout.duration || 0) / 60)} minutes
Muscle groups: ${(workout.muscleGroups || []).join(', ') || 'none yet'}

YOUR ROLE:
- Provide encouragement and motivation
- Suggest proper form tips if asked
- Recommend rest periods based on exercise type
- Advise on progressive overload
- Alert if volume is unusually high (potential overtraining)

EXAMPLES:
User: "Should I add more weight?"
You: "You've done ${workout.totalVolume} lbs so far today. If your last set felt easy (RPE 7 or below), adding 5-10 lbs is great. Listen to your body!"

User: "How long should I rest?"
You: "For compound movements, rest 2-3 minutes. For isolation, 60-90 seconds is perfect."`;
  }

  static getNutritionPrompt(context) {
    const nutrition = context.screenSpecific || {};
    const calories = nutrition.calories || {};
    const protein = nutrition.protein || {};

    return `CURRENT CONTEXT: Nutrition Dashboard
Today's nutrition:
- Calories: ${calories.consumed || 0}/${calories.target || 0} (${calories.remaining || 0} remaining)
- Protein: ${protein.consumed || 0}g/${protein.target || 0}g
- Meals logged: ${nutrition.todaysMeals || 0}

YOUR ROLE:
- Help user hit macro targets
- Suggest high-protein foods if protein is low
- Recommend meal timing
- Provide simple meal ideas
- Celebrate when hitting goals

EXAMPLES:
User: "What should I eat for dinner?"
You: "You need ${calories.remaining} more calories and ${(protein.target || 0) - (protein.consumed || 0)}g protein. Try grilled chicken (200 cal, 40g protein) with rice and veggies!"

User: "Am I eating enough?"
You: "You're at ${calories.consumed} cals with ${calories.remaining} to go. On track! Maybe add a protein shake if you're under on protein."`;
  }

  static getFoodScanPrompt(context) {
    return `CURRENT CONTEXT: Food Scanning
The user just scanned or searched for a food item.

YOUR ROLE:
- Validate if food fits their goals
- Suggest portion sizes
- Recommend alternatives if needed
- Provide quick nutrition insights

EXAMPLES:
User: "Is this healthy?"
You: "Check the protein-to-calorie ratio and sugar content. Good foods have high protein/low sugar."

User: "Should I eat this?"
You: "It fits your remaining calories! Go for it if it helps hit your protein target."`;
  }

  static getProgressPrompt(context) {
    const progress = context.screenSpecific || {};

    return `CURRENT CONTEXT: Progress Tracking
Total entries: ${progress.totalEntries || 0}
Current weight: ${progress.currentWeight || '?'} lbs
Weight change: ${progress.weightChange >= 0 ? '+' : ''}${progress.weightChange || 0} lbs

YOUR ROLE:
- Analyze progress trends
- Provide encouragement
- Suggest adjustments if needed
- Celebrate wins

EXAMPLES:
User: "Am I making progress?"
You: "You're down ${Math.abs(progress.weightChange || 0)} lbs! That's solid progress. Keep it up!"

User: "Why am I not losing weight?"
You: "Weight fluctuates daily. Focus on the 2-week trend. Also check if you're hitting calorie targets consistently."`;
  }

  static getHomePrompt(context) {
    return `CURRENT CONTEXT: Home Screen
The user is on the main dashboard.

YOUR ROLE:
- Provide general fitness advice
- Motivate for today's workout
- Answer any fitness questions
- Guide to specific features

EXAMPLES:
User: "What should I do today?"
You: "You've worked out ${context.recentActivity?.workouts || 0} times this week. If you're recovered, hit your next scheduled workout. Otherwise, active recovery or rest!"`;
  }

  // Quick suggestions for each screen
  static getQuickSuggestions(screen) {
    const suggestions = {
      WorkoutScreen: [
        "Should I add more weight?",
        "How's my form?",
        "Am I doing too much volume?",
      ],
      NutritionDashboard: [
        "What should I eat next?",
        "Am I hitting my goals?",
        "Suggest a high-protein snack",
      ],
      ProgressScreen: [
        "Am I making progress?",
        "What should I change?",
        "Analyze my trends",
      ],
      HomeScreen: [
        "What should I do today?",
        "Create a workout plan",
        "Give me nutrition tips",
      ],
    };

    return suggestions[screen] || [
      "How can you help me?",
      "What features do you have?",
    ];
  }
}
```

#### Step 12.2: Update AIService to Use Templates (1 hour)

Update `src/services/ai/AIService.js`:
```javascript
import { PromptTemplates } from './PromptTemplates';

class AIService {
  // ... existing code ...

  buildSystemPrompt(context) {
    // Use template-based prompts
    const screen = context.screen || 'HomeScreen';
    return PromptTemplates.getSystemPrompt(screen, context);
  }

  // ... rest of existing code ...
}
```

#### Step 12.3: Add Quick Suggestions to Chat (1.5 hours)

Update `src/components/AIChatModal.js`:
```javascript
import { PromptTemplates } from '../services/ai/PromptTemplates';

// Add to component:
const [showSuggestions, setShowSuggestions] = useState(true);

// Get suggestions
const suggestions = PromptTemplates.getQuickSuggestions(
  ContextManager.currentScreen || 'HomeScreen'
);

// Add after welcome message:
{showSuggestions && messages.length <= 1 && (
  <View style={styles.suggestionsContainer}>
    <Text style={styles.suggestionsTitle}>Quick questions:</Text>
    {suggestions.map((suggestion, index) => (
      <TouchableOpacity
        key={index}
        style={styles.suggestionButton}
        onPress={() => {
          setInputText(suggestion);
          setShowSuggestions(false);
        }}
      >
        <Text style={styles.suggestionText}>{suggestion}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}

// Add styles:
suggestionsContainer: {
  padding: Spacing.md,
  backgroundColor: Colors.surface,
  borderRadius: 12,
  marginVertical: Spacing.md,
},
suggestionsTitle: {
  fontSize: 14,
  color: Colors.textSecondary,
  marginBottom: Spacing.sm,
},
suggestionButton: {
  backgroundColor: Colors.background,
  padding: Spacing.sm,
  borderRadius: 8,
  marginTop: Spacing.sm,
  borderWidth: 1,
  borderColor: Colors.border,
},
suggestionText: {
  color: Colors.primary,
  fontSize: 14,
},
```

#### Step 12.4: Test Screen-Specific Responses (2 hours)
1. Test AI on workout screen - verify workout-specific advice
2. Test on nutrition screen - verify nutrition-specific responses
3. Test on progress screen - verify progress analysis
4. Test quick suggestions work
5. Compare quality of context-aware vs generic responses

### Verification Checklist
- [ ] Prompt templates created
- [ ] AIService uses templates
- [ ] Quick suggestions implemented
- [ ] Responses are context-aware
- [ ] Quality is noticeably better

### Deliverables
1. `src/services/ai/PromptTemplates.js`
2. Updated `src/services/ai/AIService.js`
3. Updated `src/components/AIChatModal.js`
4. Test results document

---

## 🚀 PHASE 13: AI WORKOUT GENERATION (Week 5, Days 1-3)

### Objectives
- Implement AI workout plan creation
- Generate exercise recommendations
- Create progressive workout programs

### Step-by-Step Instructions

#### Step 13.1: Create Workout Generator Service (3 hours)

Create `src/services/ai/WorkoutGenerator.js`:
```javascript
import AIService from './AIService';
import { exerciseDatabase } from '../../data/exerciseDatabase';

export class WorkoutGenerator {
  static async generateWorkoutPlan(userGoals, equipment, experienceLevel) {
    const prompt = `Create a structured workout plan with the following:

User Goals: ${userGoals.join(', ')}
Available Equipment: ${equipment.join(', ')}
Experience Level: ${experienceLevel}

Please generate a workout plan in this EXACT JSON format:
{
  "programName": "Descriptive name",
  "duration": "weeks",
  "frequency": "days per week",
  "split": "type of split",
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "what this week emphasizes",
      "workouts": [
        {
          "dayNumber": 1,
          "name": "Workout name (e.g., Upper Body A)",
          "muscleGroups": ["chest", "back", "shoulders"],
          "exercises": [
            {
              "exerciseName": "exact exercise name from database",
              "sets": 3,
              "reps": "8-12",
              "restSeconds": 90,
              "notes": "form cues"
            }
          ]
        }
      ]
    }
  ],
  "progressionPlan": "How to progress week to week"
}

Guidelines:
- Choose exercises that exist in standard gym databases
- Progressive overload each week
- Balance push/pull movements
- Include compound and isolation exercises
- Rest days between similar muscle groups`;

    try {
      const result = await AIService.sendMessage(prompt, {
        screen: 'WorkoutProgramScreen',
        userData: {
          goals: userGoals,
          equipment,
          level: experienceLevel,
        },
      });

      // Parse JSON response
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse workout plan JSON');
      }

      const workoutPlan = JSON.parse(jsonMatch[0]);

      // Validate and enrich with actual exercise data
      const enrichedPlan = await this.enrichWorkoutPlan(workoutPlan);

      return enrichedPlan;
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw error;
    }
  }

  static async enrichWorkoutPlan(plan) {
    // Match exercise names to actual database exercises
    for (const week of plan.weeks) {
      for (const workout of week.workouts) {
        for (const exercise of workout.exercises) {
          // Find matching exercise in database
          const dbExercise = this.findExerciseInDatabase(exercise.exerciseName);

          if (dbExercise) {
            exercise.exerciseId = dbExercise.id;
            exercise.equipment = dbExercise.equipment;
            exercise.difficulty = dbExercise.difficulty;
            exercise.instructions = dbExercise.instructions;
          }
        }
      }
    }

    return plan;
  }

  static findExerciseInDatabase(exerciseName) {
    const normalized = exerciseName.toLowerCase().trim();

    return exerciseDatabase.find(ex => {
      const exName = ex.name.toLowerCase();
      return exName === normalized || exName.includes(normalized) || normalized.includes(exName);
    });
  }

  static async generateSingleWorkout(muscleGroups, duration, equipment) {
    const prompt = `Generate a single workout session:

Target Muscle Groups: ${muscleGroups.join(', ')}
Duration: ${duration} minutes
Equipment: ${equipment.join(', ')}

Return JSON format:
{
  "name": "Workout name",
  "estimatedDuration": ${duration},
  "exercises": [
    {
      "exerciseName": "name",
      "sets": 3,
      "reps": "8-12",
      "restSeconds": 90,
      "notes": "brief form cue"
    }
  ],
  "warmup": ["warmup exercises"],
  "cooldown": ["cooldown stretches"]
}

Include 5-7 exercises balanced between compound and isolation movements.`;

    try {
      const result = await AIService.sendMessage(prompt, {
        screen: 'WorkoutGenerator',
      });

      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse workout JSON');
      }

      const workout = JSON.parse(jsonMatch[0]);
      return await this.enrichWorkoutPlan({ weeks: [{ workouts: [workout] }] });
    } catch (error) {
      console.error('Error generating single workout:', error);
      throw error;
    }
  }

  static async suggestNextExercise(currentWorkout, remainingTime) {
    const exercisesDone = currentWorkout.exercises.map(e => e.exerciseName);
    const muscleGroupsWorked = currentWorkout.muscleGroups || [];

    const prompt = `Suggest the next exercise for this workout:

Exercises completed: ${exercisesDone.join(', ')}
Muscle groups worked: ${muscleGroupsWorked.join(', ')}
Time remaining: ${remainingTime} minutes

Suggest ONE exercise that:
- Complements what was already done
- Fits in the remaining time
- Provides balanced muscle development

Format: Just the exercise name, sets, and reps. Example: "Barbell Rows, 3 sets x 8-10 reps"`;

    try {
      const result = await AIService.sendMessage(prompt, {
        screen: 'WorkoutScreen',
        screenSpecific: { currentWorkout },
      });

      return result.response;
    } catch (error) {
      console.error('Error suggesting next exercise:', error);
      throw error;
    }
  }
}
```

#### Step 13.2: Create Workout Generator Screen (2 hours)

Create `src/screens/AIWorkoutGeneratorScreen.js`:
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import { WorkoutGenerator } from '../services/ai/WorkoutGenerator';
import ScreenLayout from '../components/ScreenLayout';

export default function AIWorkoutGeneratorScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const goals = [
    'Build Muscle',
    'Lose Fat',
    'Gain Strength',
    'Improve Endurance',
    'General Fitness',
  ];

  const equipment = [
    'Barbell',
    'Dumbbell',
    'Machines',
    'Bodyweight',
    'Resistance Bands',
    'Kettlebell',
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  const toggleSelection = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleGenerate = async () => {
    if (selectedGoals.length === 0 || selectedEquipment.length === 0) {
      alert('Please select at least one goal and equipment');
      return;
    }

    setLoading(true);
    try {
      const plan = await WorkoutGenerator.generateWorkoutPlan(
        selectedGoals,
        selectedEquipment,
        experienceLevel
      );

      setGeneratedPlan(plan);
    } catch (error) {
      alert('Failed to generate workout plan. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (generatedPlan) {
    return (
      <ScreenLayout title="Your AI Workout Plan" navigation={navigation}>
        <ScrollView style={styles.planContainer}>
          <Text style={styles.planTitle}>{generatedPlan.programName}</Text>
          <Text style={styles.planSubtitle}>
            {generatedPlan.duration} • {generatedPlan.frequency}
          </Text>
          <Text style={styles.planSubtitle}>{generatedPlan.split}</Text>

          {generatedPlan.weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekContainer}>
              <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
              <Text style={styles.weekFocus}>{week.focus}</Text>

              {week.workouts.map((workout, workoutIndex) => (
                <View key={workoutIndex} style={styles.workoutCard}>
                  <Text style={styles.workoutName}>
                    Day {workout.dayNumber}: {workout.name}
                  </Text>
                  <Text style={styles.muscleGroups}>
                    {workout.muscleGroups.join(' • ')}
                  </Text>

                  {workout.exercises.map((exercise, exIndex) => (
                    <View key={exIndex} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>
                        {exIndex + 1}. {exercise.exerciseName}
                      </Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets} × {exercise.reps} • Rest: {exercise.restSeconds}s
                      </Text>
                      {exercise.notes && (
                        <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}

          <View style={styles.progressionContainer}>
            <Text style={styles.progressionTitle}>Progression Plan</Text>
            <Text style={styles.progressionText}>
              {generatedPlan.progressionPlan}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              // TODO: Save to workout programs
              navigation.goBack();
            }}
          >
            <Text style={styles.saveButtonText}>Save Program</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="AI Workout Generator"
      subtitle="Let AI create your perfect workout plan"
      navigation={navigation}
    >
      <ScrollView style={styles.container}>
        {/* Goals Selection */}
        <Text style={styles.sectionTitle}>Your Goals</Text>
        <View style={styles.optionsContainer}>
          {goals.map(goal => (
            <TouchableOpacity
              key={goal}
              style={[
                styles.optionChip,
                selectedGoals.includes(goal) && styles.optionChipSelected,
              ]}
              onPress={() => toggleSelection(goal, selectedGoals, setSelectedGoals)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedGoals.includes(goal) && styles.optionTextSelected,
                ]}
              >
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Equipment Selection */}
        <Text style={styles.sectionTitle}>Available Equipment</Text>
        <View style={styles.optionsContainer}>
          {equipment.map(eq => (
            <TouchableOpacity
              key={eq}
              style={[
                styles.optionChip,
                selectedEquipment.includes(eq) && styles.optionChipSelected,
              ]}
              onPress={() => toggleSelection(eq, selectedEquipment, setSelectedEquipment)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedEquipment.includes(eq) && styles.optionTextSelected,
                ]}
              >
                {eq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience Level */}
        <Text style={styles.sectionTitle}>Experience Level</Text>
        <View style={styles.optionsContainer}>
          {levels.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionChip,
                experienceLevel === level && styles.optionChipSelected,
              ]}
              onPress={() => setExperienceLevel(level)}
            >
              <Text
                style={[
                  styles.optionText,
                  experienceLevel === level && styles.optionTextSelected,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate Workout Plan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.text,
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  planSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  weekContainer: {
    marginTop: Spacing.xl,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  weekFocus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  muscleGroups: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  exerciseNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  progressionContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  progressionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

#### Step 13.3: Add Navigation to Generator (30 minutes)

Add to your navigation stack in `App.js`:
```javascript
<Stack.Screen name="AIWorkoutGenerator" component={AIWorkoutGeneratorScreen} />
```

Add button in `TrainingScreen.js` or `HomeScreen.js`:
```javascript
<TouchableOpacity
  style={styles.aiGenerateButton}
  onPress={() => navigation.navigate('AIWorkoutGenerator')}
>
  <Text style={styles.aiGenerateText}>✨ Generate AI Workout Plan</Text>
</TouchableOpacity>
```

#### Step 13.4: Test Workout Generation (1.5 hours)
1. Generate workout with different goals
2. Verify exercises match selected equipment
3. Check workout structure makes sense
4. Validate exercise names match database
5. Test saving generated plans

### Verification Checklist
- [ ] Workout generator service created
- [ ] Generator screen implemented
- [ ] AI generates valid workouts
- [ ] Exercises match equipment
- [ ] Progressive overload included

### Deliverables
1. `src/services/ai/WorkoutGenerator.js`
2. `src/screens/AIWorkoutGeneratorScreen.js`
3. Navigation updates
4. Sample generated workouts

---

*[Continue to Part 3 for Phases 14-25...]*

---

## 📝 QUICK REFERENCE: PHASES 14-25 OVERVIEW

### Phase 14: AI Meal Planning (Week 5, Days 4-5)
- Generate meal plans based on calories/macros
- Suggest recipes
- Create shopping lists

### Phase 15: AI Form Analysis (Week 5, Days 6-7)
- Analyze workout form from video
- Provide technique feedback
- Safety recommendations

### Phase 16: AI Progress Analysis (Week 6, Days 1-2)
- Analyze workout trends
- Identify plateaus
- Suggest deload periods
- Recommend program changes

### Phase 17: AI Session Logging (Week 6, Days 3-4)
- Save AI conversations to backend
- Conversation history
- Export conversations

### Phase 18: Voice AI Assistant (Week 6, Days 5-7)
- Speech-to-text input
- Text-to-speech responses
- Hands-free coaching during workouts

### Phase 19: AI Notifications (Week 7, Days 1-2)
- Smart workout reminders
- Meal timing suggestions
- Progress check-ins

### Phase 20: Frontend Polish (Week 7, Days 3-5)
- Fix keyboard blocking inputs
- UI/UX improvements
- Animation polish
- Loading states

### Phase 21: Testing & QA (Week 7, Days 6-7)
- Unit tests for AI services
- Integration testing
- User acceptance testing
- Bug fixes

### Phase 22: Performance Optimization (Week 8, Days 1-2)
- Optimize AI response times
- Reduce token usage
- Cache common responses
- Improve sync performance

### Phase 23: Security & Privacy (Week 8, Days 3-4)
- Secure API keys
- Encrypt sensitive data
- Privacy policy
- GDPR compliance

### Phase 24: Production Preparation (Week 8, Days 5-6)
- Environment setup (staging/production)
- Error monitoring (Sentry)
- Analytics (Mixpanel/Amplitude)
- App store assets

### Phase 25: Deployment (Week 8, Day 7)
- Build production app
- Submit to App Store / Play Store
- Deploy backend
- Launch!

---

## 🎉 CONGRATULATIONS!

After completing all 25 phases, you will have:
- ✅ Full-stack cloud-backed fitness app
- ✅ Context-aware AI coaching system
- ✅ Automatic data synchronization
- ✅ AI workout generation
- ✅ AI meal planning
- ✅ Production-ready application

## 📚 NEXT STEPS AFTER COMPLETION

1. **User Acquisition**: Marketing and user onboarding
2. **Feature Iteration**: Based on user feedback
3. **Monetization**: Premium features, subscriptions
4. **Scaling**: Handle growing user base
5. **Advanced AI**: More sophisticated coaching algorithms

---

**END OF IMPLEMENTATION GUIDE**

*For detailed steps on Phases 14-25, see IMPLEMENTATION_MASTER_PLAN_PART3.md*
