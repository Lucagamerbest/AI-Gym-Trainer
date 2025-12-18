import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, TextInput, Keyboard, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIButtonSection from './AIButtonSection';
import ThinkingAnimation from './ThinkingAnimation';
import RecipeSourceModal from './RecipeSourceModal';
import RecipeFilterModal from './RecipeFilterModal';
import RecipePreferencesModal from './RecipePreferencesModal';
import SmartTextInput from './SmartTextInput';
import VoiceInputButton from './VoiceInputButton';
import { getAISectionsForScreen, hasAISections } from '../config/aiSectionConfig';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import { useAICoach } from '../context/AICoachContext';
import { getRecentFoods } from '../services/foodDatabase';
import MacroStatsCard from './MacroStatsCard';
import FreeRecipeService from '../services/FreeRecipeService';
import { getRecipePreferences } from '../services/recipePreferencesService';
import AIChatModal from './AIChatModal';
import ProgressiveOverloadService from '../services/ai/ProgressiveOverloadService';
import { REP_RANGES } from '../services/ai/FitnessKnowledge';
import BackendService from '../services/backend/BackendService';

/**
 * Exercise alternatives database for instant lookups
 */
/**
 * Exercise alternatives database - array ordered from most specific to least specific
 */
const EXERCISE_ALTERNATIVES = [
  // Leg exercises (most specific first)
  { key: 'leg extension', name: 'Leg Extension', alternatives: [
    { name: 'Sissy Squat', reason: 'Bodyweight quad isolation' },
    { name: 'Front Squat', reason: 'Compound quad focus' },
    { name: 'Leg Press (feet low)', reason: 'Machine alternative' },
  ]},
  { key: 'leg curl', name: 'Leg Curl', alternatives: [
    { name: 'Romanian Deadlift', reason: 'Hip hinge movement' },
    { name: 'Nordic Curl', reason: 'Bodyweight option' },
    { name: 'Glute Ham Raise', reason: 'Full posterior chain' },
  ]},
  { key: 'leg press', name: 'Leg Press', alternatives: [
    { name: 'Hack Squat', reason: 'More quad focus' },
    { name: 'Belt Squat', reason: 'No spinal load' },
    { name: 'Smith Machine Squat', reason: 'Guided movement' },
  ]},
  { key: 'calf raise', name: 'Calf Raise', alternatives: [
    { name: 'Seated Calf Raise', reason: 'Soleus focus' },
    { name: 'Donkey Calf Raise', reason: 'Better stretch' },
    { name: 'Single Leg Calf Raise', reason: 'Unilateral' },
  ]},
  { key: 'hip thrust', name: 'Hip Thrust', alternatives: [
    { name: 'Glute Bridge', reason: 'No setup needed' },
    { name: 'Cable Pull Through', reason: 'Constant tension' },
    { name: 'Reverse Hyper', reason: 'Decompresses spine' },
  ]},
  { key: 'lunge', name: 'Lunge', alternatives: [
    { name: 'Bulgarian Split Squat', reason: 'More stability' },
    { name: 'Step Up', reason: 'Unilateral strength' },
    { name: 'Walking Lunge', reason: 'More dynamic' },
  ]},
  // Chest
  { key: 'bench press', name: 'Bench Press', alternatives: [
    { name: 'Dumbbell Bench Press', reason: 'Better ROM' },
    { name: 'Incline Bench Press', reason: 'Upper chest' },
    { name: 'Machine Chest Press', reason: 'Safer solo' },
  ]},
  { key: 'incline', name: 'Incline Press', alternatives: [
    { name: 'Incline Dumbbell Press', reason: 'Better ROM' },
    { name: 'Low Incline Bench', reason: 'Less shoulder stress' },
    { name: 'Landmine Press', reason: 'Shoulder-friendly' },
  ]},
  // Back
  { key: 'lat pulldown', name: 'Lat Pulldown', alternatives: [
    { name: 'Pull-ups', reason: 'Bodyweight compound' },
    { name: 'Chin-ups', reason: 'More bicep' },
    { name: 'Straight Arm Pulldown', reason: 'Lat isolation' },
  ]},
  { key: 'pull up', name: 'Pull-up', alternatives: [
    { name: 'Lat Pulldown', reason: 'Adjustable weight' },
    { name: 'Assisted Pull-ups', reason: 'Build strength' },
    { name: 'Inverted Rows', reason: 'Easier progression' },
  ]},
  { key: 'row', name: 'Row', alternatives: [
    { name: 'Dumbbell Row', reason: 'Unilateral' },
    { name: 'Cable Row', reason: 'Constant tension' },
    { name: 'T-Bar Row', reason: 'Neutral grip' },
  ]},
  { key: 'deadlift', name: 'Deadlift', alternatives: [
    { name: 'Trap Bar Deadlift', reason: 'Easier form' },
    { name: 'Romanian Deadlift', reason: 'Hamstring focus' },
    { name: 'Rack Pulls', reason: 'Reduced ROM' },
  ]},
  // Shoulders
  { key: 'shoulder press', name: 'Shoulder Press', alternatives: [
    { name: 'Dumbbell Shoulder Press', reason: 'Greater ROM' },
    { name: 'Arnold Press', reason: 'More rotation' },
    { name: 'Landmine Press', reason: 'Shoulder-friendly' },
  ]},
  { key: 'lateral raise', name: 'Lateral Raise', alternatives: [
    { name: 'Cable Lateral Raise', reason: 'Constant tension' },
    { name: 'Machine Lateral Raise', reason: 'Stability' },
    { name: 'Leaning Lateral Raise', reason: 'Better stretch' },
  ]},
  { key: 'face pull', name: 'Face Pull', alternatives: [
    { name: 'Rear Delt Fly', reason: 'Machine option' },
    { name: 'Band Pull Apart', reason: 'Anywhere, anytime' },
    { name: 'Reverse Pec Deck', reason: 'Easy setup' },
  ]},
  // Arms
  { key: 'tricep extension', name: 'Tricep Extension', alternatives: [
    { name: 'Skull Crushers', reason: 'Long head focus' },
    { name: 'Cable Pushdown', reason: 'Constant tension' },
    { name: 'Close Grip Bench', reason: 'Compound movement' },
  ]},
  { key: 'tricep pushdown', name: 'Tricep Pushdown', alternatives: [
    { name: 'Overhead Extension', reason: 'Long head stretch' },
    { name: 'Skull Crushers', reason: 'Free weight option' },
    { name: 'Dips', reason: 'Bodyweight compound' },
  ]},
  { key: 'bicep curl', name: 'Bicep Curl', alternatives: [
    { name: 'Hammer Curl', reason: 'Brachialis focus' },
    { name: 'Preacher Curl', reason: 'Strict form' },
    { name: 'Incline Curl', reason: 'Long head stretch' },
  ]},
  // Generic fallbacks
  { key: 'squat', name: 'Squat', alternatives: [
    { name: 'Front Squat', reason: 'More quad focus' },
    { name: 'Leg Press', reason: 'Easier on back' },
    { name: 'Goblet Squat', reason: 'Beginner-friendly' },
  ]},
  { key: 'bench', name: 'Bench Press', alternatives: [
    { name: 'Dumbbell Press', reason: 'Better ROM' },
    { name: 'Push-ups', reason: 'Bodyweight option' },
    { name: 'Machine Press', reason: 'Safer solo' },
  ]},
  { key: 'press', name: 'Press', alternatives: [
    { name: 'Dumbbell Press', reason: 'Greater ROM' },
    { name: 'Machine Press', reason: 'Guided movement' },
    { name: 'Push-up', reason: 'Bodyweight option' },
  ]},
  { key: 'curl', name: 'Curl', alternatives: [
    { name: 'Hammer Curl', reason: 'Brachialis focus' },
    { name: 'Preacher Curl', reason: 'Strict form' },
    { name: 'Cable Curl', reason: 'Constant tension' },
  ]},
  { key: 'fly', name: 'Fly', alternatives: [
    { name: 'Cable Crossover', reason: 'Constant tension' },
    { name: 'Pec Deck', reason: 'Machine stability' },
    { name: 'Dumbbell Fly', reason: 'Greater stretch' },
  ]},
  { key: 'raise', name: 'Raise', alternatives: [
    { name: 'Cable Raise', reason: 'Constant tension' },
    { name: 'Machine Raise', reason: 'Stability' },
    { name: 'Dumbbell Raise', reason: 'Free weight' },
  ]},
];

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
  screenParams = {}, // Screen route params like mealType
}) {
  const { user } = useAuth();
  const { coachName } = useAICoach();
  const scrollViewRef = useRef(null);
  const responseRef = useRef(null);

  const [loadingButton, setLoadingButton] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastToolResults, setLastToolResults] = useState(null); // Store tool results for recipe cards, etc.
  const [expandedSections, setExpandedSections] = useState({});
  const [conversationHistory, setConversationHistory] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const customInputRef = useRef(null);
  const [showChatModal, setShowChatModal] = useState(false); // For opening AIChatModal

  // Recipe source modal state
  const [showRecipeSourceModal, setShowRecipeSourceModal] = useState(false);
  const [showRecipeFilterModal, setShowRecipeFilterModal] = useState(false);

  // Extract current workout exercises for smart input suggestions
  const getCurrentWorkoutExercises = () => {
    if (!lastToolResults || !Array.isArray(lastToolResults)) {
      return [];
    }

    // Find workout tool result (either generateWorkoutPlan or replaceExerciseInWorkout)
    const workoutTool = lastToolResults.find(tool =>
      (tool.name === 'generateWorkoutPlan' || tool.name === 'replaceExerciseInWorkout') &&
      tool.result?.workout?.exercises
    );

    if (workoutTool && workoutTool.result.workout.exercises) {
      // Combine equipment + name to get full variant (e.g., "Machine Bench Press")
      return workoutTool.result.workout.exercises.map(ex => {
        const equipment = ex.equipment || '';
        const name = ex.name || '';

        // If equipment exists and is not already in the name, prepend it
        if (equipment && !name.toLowerCase().includes(equipment.toLowerCase())) {
          return `${equipment} ${name}`.trim();
        }

        return name;
      });
    }

    return [];
  };
  const [showRecipePreferencesModal, setShowRecipePreferencesModal] = useState(false);
  const [pendingRecipeButton, setPendingRecipeButton] = useState(null); // Store button while user chooses source
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0); // For navigating database results
  const [lastSearchFilters, setLastSearchFilters] = useState(null); // Store last filters for retry

  // Meal suggestion navigation state
  const [currentMealIndex, setCurrentMealIndex] = useState(0); // For navigating meal suggestions

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

  // Instant action result state (for interactive modals)
  const [instantActionResult, setInstantActionResult] = useState(null); // { title, content, actions }

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

  // DEBUG: Log everything about the AI modal
  useEffect(() => {
    if (visible) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🤖 AI BUTTON MODAL DEBUG');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📱 Screen Name:', screenName);
      console.log('📊 Total Sections:', sections.length);
      console.log('');

      // Log each section with full details
      sections.forEach((section, i) => {
        console.log(`┌─── Section ${i}: "${section.title}" ───`);
        console.log(`│ Icon: ${section.icon}`);
        console.log(`│ Buttons: ${section.buttons?.length || 0}`);

        section.buttons?.forEach((btn, j) => {
          console.log(`│`);
          console.log(`│ [${j}] ${btn.text}`);
          console.log(`│     instantAction: ${btn.instantAction || 'none'}`);
          console.log(`│     toolName: ${btn.toolName || 'none'}`);
          console.log(`│     description: ${btn.description || 'none'}`);
          if (btn.params) console.log(`│     params:`, btn.params);
        });
        console.log(`└────────────────────────────────────`);
        console.log('');
      });

      // Log context data
      const screenData = ContextManager.screenData || {};
      console.log('📋 CONTEXT DATA:');
      console.log('   currentExercise:', screenData.currentExercise || 'none');
      console.log('   currentExerciseIndex:', screenData.currentExerciseIndex);
      console.log('   exerciseSets:', screenData.exerciseSets ? Object.keys(screenData.exerciseSets).length + ' exercises' : 'none');
      console.log('   currentWorkout:', screenData.currentWorkout ? 'exists' : 'none');
      console.log('   userGoal:', screenData.currentWorkout?.goal || 'not set');
      console.log('═══════════════════════════════════════════════════════');
    }
  }, [visible, screenName]);

  // Initialize first section as expanded
  useEffect(() => {
    if (visible && sections.length > 0) {
      setExpandedSections({ 0: true });
    }
  }, [visible]);

  // Auto-scroll when custom input opens or keyboard shows
  useEffect(() => {
    if (!showCustomInput) return;

    // Scroll to bottom when input is revealed
    const scrollToBottom = () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    // Listen for keyboard events
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    // Initial scroll when input opens
    scrollToBottom();

    return () => {
      keyboardDidShowListener.remove();
    };
  }, [showCustomInput]);

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
   * Detect if AI is asking for clarification on exercise selection
   * (when multiple exercises match a partial name)
   */
  const detectExerciseClarificationQuestion = (response) => {
    if (!response) return false;

    // Check if lastToolResults contains clarificationNeeded flag
    if (Array.isArray(lastToolResults) && lastToolResults.some(tool => tool.result?.clarificationNeeded)) {
      return true;
    }

    const lowerResponse = response.toLowerCase();
    const clarificationKeywords = [
      'which one did you mean',
      'multiple exercises',
      'matches multiple',
      'which.*exercise',
      'did you mean',
    ];

    return clarificationKeywords.some(keyword => {
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
      '\\brate\\b.*\\bworkout\\b',  // \b ensures "rate" is a whole word (prevents matching "generate")
      'how.*\\brate\\b',
      '\\brating\\b',
      'out of 5',
      '1-5',
      'how was.*workout',
    ];

    return ratingKeywords.some(keyword => {
      if (keyword.includes('.*') || keyword.includes('\\b')) {
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
   * Recipe handling functions
   */
  const handleSaveRecipe = async (recipeCard) => {
    try {
      const recipe = recipeCard.fullRecipe;

      // Save to AsyncStorage
      const existingRecipes = await AsyncStorage.getItem('@saved_recipes');
      const recipes = existingRecipes ? JSON.parse(existingRecipes) : [];

      // Check if recipe already exists
      if (!recipes.find(r => r.id === recipe.id)) {
        recipes.push(recipe);
        await AsyncStorage.setItem('@saved_recipes', JSON.stringify(recipes));
      } else {
      }

      // Clear the recipe card and show success message
      setLastToolResults(null);
      setLastResponse('✅ Recipe saved! You can find it in your Recipes tab.');

      // Auto-close modal after 1.5 seconds (onClose callback will trigger refresh)
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('❌ Error saving recipe:', error);
      setLastResponse('❌ Failed to save recipe. Please try again.');
    }
  };

  const handleDiscardRecipe = () => {
    // Clear the recipe card and show message
    setLastToolResults(null);
    setLastResponse('Recipe discarded. Feel free to generate a new one!');
  };

  const handleSaveMealToPlan = async (meal) => {
    try {

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Load existing meal plans
      const existingPlans = await AsyncStorage.getItem('@meal_plans');
      const mealPlans = existingPlans ? JSON.parse(existingPlans) : {};

      // Initialize today's plan if needed
      if (!mealPlans[today]) {
        mealPlans[today] = {
          planned: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          logged: { breakfast: [], lunch: [], dinner: [], snacks: [] }
        };
      }

      // Determine meal type (breakfast, lunch, dinner, snacks)
      const mealType = meal.mealType || 'lunch';

      // Create planned meal object
      const plannedMeal = {
        name: meal.name,
        calories: meal.nutrition.calories,
        protein: meal.nutrition.protein,
        carbs: meal.nutrition.carbs,
        fat: meal.nutrition.fat,
        description: meal.description,
        ingredients: meal.ingredients,
        prepTime: meal.prepTime,
        tags: meal.tags,
        addedAt: new Date().toISOString()
      };

      // Add to planned meals for the appropriate meal type
      mealPlans[today].planned[mealType].push(plannedMeal);

      // Save back to AsyncStorage
      await AsyncStorage.setItem('@meal_plans', JSON.stringify(mealPlans));

      // Clear the meal suggestions and show success message
      setLastToolResults(null);
      setCurrentMealIndex(0);
      setLastResponse(`✅ "${meal.name}" saved to your planned ${mealType} meals for today! You can view it in the Nutrition screen.`);

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error saving meal to plan:', error);
      setLastResponse('❌ Failed to save meal. Please try again.');
    }
  };

  const handleRegenerateRecipe = async (recipeCard) => {
    try {
      // Clear current recipe and show loading
      setLastToolResults(null);
      setLastResponse('Generating a new recipe...');
      setLoadingButton('regenerate_recipe');

      // Call the AI to regenerate with same ingredients
      const ingredients = recipeCard.originalIngredients;
      const result = await AIService.sendMessageWithTools(
        `Generate a different recipe using these ingredients: ${ingredients.join(', ')}. Make sure it's different from the previous one.`,
        'Recipes'
      );

      // Update response and tool results
      setLastResponse(result.response);
      setLastToolResults(result.toolResults || null);
    } catch (error) {
      console.error('Error regenerating recipe:', error);
      setLastResponse('❌ Failed to generate new recipe. Please try again.');
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle database recipe search with smart filtering
   * Uses filters from RecipeFilterModal to find optimal recipes
   */
  const handleDatabaseRecipeSearch = async (filters) => {
    try {
      setLoadingButton('database_search');
      setLastResponse('🔍 Searching recipe database...');
      setExpandedSections({});

      // Store filters for retry
      setLastSearchFilters(filters);

      // Use FreeRecipeService to search (should be instant if cached)
      const recipes = await FreeRecipeService.searchRecipes({
        mealType: filters.mealType !== 'any' ? filters.mealType : null,
      });

      // Filter by calorie and protein requirements
      let filteredRecipes = recipes.filter(recipe => {
        const calories = recipe.nutrition.calories;
        const protein = recipe.nutrition.protein;

        // Must be within calorie limit
        if (calories > filters.maxCalories) return false;

        // Must meet minimum protein (if specified)
        if (filters.minProtein && protein < filters.minProtein) return false;

        return true;
      });

      // Determine sorting strategy based on button context
      const buttonContext = filters.buttonContext || '';
      let sortDescription = 'recipes';

      if (buttonContext.includes('low-calorie')) {
        // Sort by lowest calories, but still prioritize protein per calorie
        filteredRecipes.sort((a, b) => {
          const ratioA = a.nutrition.protein / a.nutrition.calories;
          const ratioB = b.nutrition.protein / b.nutrition.calories;
          // If protein/calorie ratio is similar, prefer lower calories
          if (Math.abs(ratioA - ratioB) < 0.02) {
            return a.nutrition.calories - b.nutrition.calories;
          }
          return ratioB - ratioA; // Higher protein/calorie ratio first
        });
        sortDescription = 'low-calorie, high-protein recipes';
      } else if (buttonContext.includes('high-protein')) {
        // Sort by maximum protein within calorie budget
        filteredRecipes.sort((a, b) => b.nutrition.protein - a.nutrition.protein);
        sortDescription = 'high-protein recipes within your calorie limit';
      } else if (buttonContext.includes('quick')) {
        // Sort by preparation time
        filteredRecipes.sort((a, b) => (a.readyInMinutes || 30) - (b.readyInMinutes || 30));
        sortDescription = 'quick recipes';
      } else {
        // Default: maximize protein within calorie budget
        filteredRecipes.sort((a, b) => b.nutrition.protein - a.nutrition.protein);
        sortDescription = 'high-protein recipes';
      }

      const topRecipes = filteredRecipes.slice(0, 10);

      // Check if we have recipes
      if (topRecipes.length === 0) {
        setLastResponse(
          `❌ No recipes found matching your filters.\n\n` +
          `Try increasing max calories to ${filters.maxCalories + 200} or lowering protein requirement.`
        );
        setLastToolResults({ noResults: true }); // Flag to show retry button
        return;
      }

      // Format as tool results for recipe cards
      setLastToolResults({
        recipes: topRecipes,
        source: 'database',
      });

      // Build response based on sort type
      const topRecipe = topRecipes[0];
      let responseText = `✅ Found ${topRecipes.length} ${sortDescription}!\n\n`;
      responseText += `**Filter:** Max ${filters.maxCalories} cal`;
      if (filters.minProtein) responseText += `, Min ${filters.minProtein}g protein`;
      if (filters.mealType !== 'any') responseText += `, ${filters.mealType}`;
      responseText += `\n\n**Best match:** ${topRecipe.name}\n`;
      responseText += `${topRecipe.nutrition.calories} cal | ${topRecipe.nutrition.protein}g protein`;

      setLastResponse(responseText);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ Database search error:', error);
      setLastResponse('❌ Failed to search recipes. Please try again.');
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle AI recipe generation (custom, 10-30 seconds)
   */
  const handleAIRecipeGeneration = async (button) => {
    try {
      // Handle dynamic text (function that returns text based on time)
      const buttonText = button.isDynamic && typeof button.text === 'function'
        ? button.text()
        : button.text;

      setLoadingButton(buttonText);
      setLastResponse(null);
      setExpandedSections({});

      // Build context for AI
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);
      if (screenParams) {
        context.screenParams = screenParams;
      }

      // Build prompt from button
      let messageToSend = button.prompt || buttonText;

      // Apply user preferences if button uses them
      if (button.usesPreferences) {
        const preferences = await getRecipePreferences();
        const prefType = button.usesPreferences; // 'highProtein', 'lowCalorie', 'balanced'
        const userPrefs = preferences[prefType];

        if (prefType === 'highProtein' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a high-protein recipe that meets these EXACT requirements. Adjust portion sizes to hit these targets precisely.`;
        } else if (prefType === 'lowCalorie' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a low-calorie recipe that meets these EXACT requirements. Keep it light and healthy while hitting these precise targets.`;
        } else if (prefType === 'balanced' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a balanced, nutritious recipe that meets these EXACT requirements. Focus on whole foods while hitting these precise macro targets.`;
        }
      }

      // Handle dynamic prompts (same logic as existing handleButtonPress)
      if (button.toolName === 'generateHighProteinRecipe' && screenParams?.mealType && !button.usesPreferences) {
        const mealType = screenParams.mealType;
        const calorieRanges = {
          breakfast: { min: 300, max: 600, ideal: 450 },
          lunch: { min: 400, max: 700, ideal: 550 },
          dinner: { min: 500, max: 800, ideal: 650 },
          snack: { min: 100, max: 300, ideal: 200 },
          snacks: { min: 100, max: 300, ideal: 200 },
        };

        const range = calorieRanges[mealType] || { min: 300, max: 700, ideal: 500 };

        // Use user preferences if available
        if (button.usesPreferences === 'highProtein') {
          const preferences = await getRecipePreferences();
          const proteinTarget = preferences.highProtein?.protein || '50';
          const caloriesMax = preferences.highProtein?.calories || range.max.toString();
          messageToSend = `Generate a high-protein ${mealType} with ${proteinTarget}g protein and ${range.ideal} calories (max ${caloriesMax} calories). Keep it appropriate for a ${mealType}.`;
        } else {
          const proteinAmount = Math.round((range.ideal * 0.35) / 4);
          messageToSend = `Generate a high-protein ${mealType} with approximately ${proteinAmount}g protein and ${range.ideal} calories (max ${range.max} calories). Keep it appropriate for a ${mealType}.`;
        }
      }

      if (button.promptTemplate === 'recentIngredients') {
        try {
          const recentFoods = await getRecentFoods(user?.uid, 10);
          if (recentFoods && recentFoods.length > 0) {
            const uniqueFoods = [...new Set(recentFoods.map(f => f.name))].slice(0, 6);
            messageToSend = `Create a recipe using ingredients from my recent foods: ${uniqueFoods.join(', ')}`;
          } else {
            messageToSend = button.fallbackPrompt || 'Create a recipe using: chicken, rice, broccoli';
          }
        } catch (error) {
          console.error('Error fetching recent foods:', error);
          messageToSend = button.fallbackPrompt || 'Create a recipe using: chicken, rice, broccoli';
        }
      }

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(messageToSend, context);

      setLastResponse(result.response);
      setLastToolResults(result.toolResults || null);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ AI recipe generation error:', error);
      setLastResponse('❌ Failed to generate recipe. Please try again.');
    } finally {
      setLoadingButton(null);
    }
  };

  /**
   * Handle instant actions (no AI needed) - Shows interactive modal like WorkoutQuickActions
   */
  const handleInstantAction = async (action, button = null) => {
    console.log('🚀 Handling instant action:', action, 'with params:', button?.params);
    setExpandedSections({});

    // Try to get context from ContextManager first
    let screenData = ContextManager.screenData || {};
    let currentExercise = screenData.currentExercise;
    let exerciseSets = screenData.exerciseSets || {};
    let currentWorkout = screenData.currentWorkout || {};
    let userGoal = currentWorkout.goal || 'hypertrophy';
    let workoutExercises = [];

    // If no context, load directly from AsyncStorage
    if (!currentExercise && !currentWorkout?.exercises) {
      try {
        const activeWorkoutStr = await AsyncStorage.getItem('@active_workout');
        if (activeWorkoutStr) {
          const activeWorkout = JSON.parse(activeWorkoutStr);
          currentWorkout = activeWorkout;
          workoutExercises = activeWorkout.exercises || [];
          exerciseSets = activeWorkout.exerciseSets || {};
          userGoal = activeWorkout.goal || 'hypertrophy';
          console.log('📦 Loaded active workout from AsyncStorage:', workoutExercises.length, 'exercises');
        }
      } catch (error) {
        console.error('Failed to load active workout:', error);
      }
    } else {
      workoutExercises = currentWorkout?.exercises || [];
    }

    // Get current weight from the first exercise with sets if no specific one
    let currentWeight = 0;
    const currentExerciseIndex = screenData.currentExerciseIndex;
    if (currentExerciseIndex !== undefined && exerciseSets[currentExerciseIndex]) {
      const currentSets = exerciseSets[currentExerciseIndex] || [];
      const lastSet = currentSets[currentSets.length - 1];
      currentWeight = lastSet?.weight || 0;
    }

    switch (action) {
      case 'SUGGEST_WEIGHT':
        await handleSuggestWeight(currentExercise, currentWeight, workoutExercises);
        break;
      case 'RECOMMEND_REST':
        handleRecommendRest(userGoal);
        break;
      case 'SET_FEEDBACK':
        handleSetFeedback(currentWeight, workoutExercises, exerciseSets);
        break;
      case 'FIND_ALTERNATIVE':
        handleFindAlternative(currentExercise, workoutExercises);
        break;
      case 'ADD_SIMILAR':
        handleAddSimilar(currentExercise, workoutExercises);
        break;
      case 'ADD_SUPERSET':
        handleAddSuperset(currentExercise, workoutExercises);
        break;
      case 'RECOMMEND_EXTRA_SET':
        handleRecommendExtraSet(currentExercise, workoutExercises, exerciseSets);
        break;
      case 'RPE_CALCULATOR':
        handleRPECalculator(currentWeight);
        break;
      // StartWorkoutScreen actions
      case 'RECOMMEND_TODAY':
        handleRecommendToday();
        break;
      case 'LAST_WORKOUT':
        handleLastWorkout();
        break;
      case 'MUSCLE_PRIORITY':
        handleMusclePriority();
        break;
      case 'BROWSE_EXERCISES':
        handleBrowseExercises(button?.params?.muscle);
        break;
      // WorkoutHistoryScreen actions
      case 'WEEK_SUMMARY':
        handleWeekSummary();
        break;
      case 'RECENT_PRS':
        handleRecentPRs();
        break;
      case 'MUSCLE_BALANCE':
        handleMuscleBalance();
        break;
      case 'STREAK_STATUS':
        handleStreakStatus();
        break;
      case 'VOLUME_TREND':
        handleVolumeTrend();
        break;
      case 'WORKOUT_FREQUENCY':
        handleWorkoutFrequency();
        break;
      // ExerciseDetailScreen actions
      case 'EXERCISE_PR':
        handleExercisePR(currentExercise);
        break;
      case 'EXERCISE_PROGRESSION':
        handleExerciseProgression(currentExercise);
        break;
      case 'EXERCISE_HISTORY':
        handleExerciseHistory(currentExercise);
        break;
      // WorkoutSummaryScreen actions
      case 'CHECK_WORKOUT_PRS':
        handleCheckWorkoutPRs(exerciseSets);
        break;
      case 'COMPARE_WORKOUT':
        handleCompareWorkout();
        break;
      case 'VOLUME_BREAKDOWN':
        handleVolumeBreakdown(workoutExercises, exerciseSets);
        break;
      case 'MUSCLES_WORKED':
        handleMusclesWorked(workoutExercises);
        break;
      case 'RECOMMEND_NEXT':
        handleRecommendNext(workoutExercises);
        break;
      case 'RECOVERY_TIME':
        handleRecoveryTime(workoutExercises);
        break;
      // WorkoutDetailScreen actions
      case 'WORKOUT_SUMMARY':
        handleWorkoutSummary(workoutExercises, exerciseSets);
        break;
      case 'REPEAT_WORKOUT':
        handleRepeatWorkout();
        break;
      // MyPlansScreen actions
      case 'PROGRAM_OVERVIEW':
        handleProgramOverview();
        break;
      case 'WEEKLY_SCHEDULE':
        handleWeeklySchedule();
        break;
      case 'SHOW_SPLIT_INFO':
        handleShowSplitInfo(button?.params?.type);
        break;
      case 'WEEKLY_VOLUME':
        handleWeeklyVolume();
        break;
      // Filter actions
      case 'FILTER_BY_MUSCLE':
        handleFilterByMuscle();
        break;
      case 'FILTER_BY_EQUIPMENT':
        handleFilterByEquipment();
        break;
      default:
        setLastResponse('Unknown action');
    }
  };

  /**
   * Instant Action: Suggest next weight based on progressive overload
   */
  const handleSuggestWeight = async (exerciseName, currentWeight, workoutExercises = []) => {
    // If no exercise selected, show exercise picker
    if (!exerciseName) {
      if (workoutExercises.length === 0) {
        setInstantActionResult({
          title: '💡 No Active Workout',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start a workout first to get weight recommendations.
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection
      setInstantActionResult({
        title: '💪 Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Choose an exercise to get weight suggestion:</Text>
          </View>
        ),
        actions: workoutExercises.slice(0, 4).map(ex => ({
          label: ex.name,
          onPress: async () => {
            setInstantActionResult(null);
            await handleSuggestWeight(ex.name, 0, workoutExercises);
          }
        }))
      });
      return;
    }

    setLoadingButton('Suggest next weight');
    try {
      const userId = user?.uid || BackendService.getCurrentUserId() || 'guest';
      const recommendation = await ProgressiveOverloadService.analyzeExerciseProgression(userId, exerciseName);

      if (recommendation && recommendation.suggestedWeight) {
        setInstantActionResult({
          title: '💪 Weight Suggestion',
          content: (
            <View>
              <Text style={instantStyles.resultHighlight}>{recommendation.suggestedWeight} lbs</Text>
              <Text style={instantStyles.resultSubtext}>
                Current: {recommendation.currentWeight || currentWeight} lbs
              </Text>
              <Text style={instantStyles.resultReason}>{recommendation.reason}</Text>
              {recommendation.type === 'ADD_VOLUME' && (
                <Text style={instantStyles.resultTip}>💡 {recommendation.suggestion}</Text>
              )}
            </View>
          ),
          actions: [
            {
              label: `Use ${recommendation.suggestedWeight} lbs`,
              primary: true,
              onPress: () => {
                setInstantActionResult(null);
                setLastResponse(`✅ Got it! Use **${recommendation.suggestedWeight} lbs** for your next set of ${exerciseName}.`);
              }
            }
          ]
        });
      } else if (currentWeight > 0) {
        setInstantActionResult({
          title: '💪 Weight Suggestion',
          content: (
            <View>
              <Text style={instantStyles.resultHighlight}>{currentWeight} lbs</Text>
              <Text style={instantStyles.resultSubtext}>Current weight</Text>
              <Text style={instantStyles.resultTip}>
                Complete 2-3 more workouts to get personalized progression advice!
              </Text>
            </View>
          ),
          actions: [
            {
              label: 'Add 5 lbs',
              primary: true,
              onPress: () => {
                setInstantActionResult(null);
                setLastResponse(`✅ Try **${currentWeight + 5} lbs** if last set felt easy!`);
              }
            },
            {
              label: 'Keep weight',
              onPress: () => {
                setInstantActionResult(null);
                setLastResponse(`✅ Stay at **${currentWeight} lbs** and focus on form.`);
              }
            }
          ]
        });
      } else {
        setInstantActionResult({
          title: '💪 Weight Suggestion',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start with a weight you can do 8-12 reps with good form.
              </Text>
              <Text style={instantStyles.resultTip}>
                Log a few sessions to get personalized suggestions!
              </Text>
            </View>
          ),
          actions: []
        });
      }
    } catch (error) {
      console.error('Error getting weight suggestion:', error);
      setInstantActionResult({
        title: '💪 Weight Suggestion',
        content: (
          <View>
            <Text style={instantStyles.resultText}>
              Unable to analyze history yet.
            </Text>
            <Text style={instantStyles.resultTip}>
              💡 General tip: If last set felt easy, add 5 lbs. If hard, stay at current weight.
            </Text>
          </View>
        ),
        actions: []
      });
    }
    setLoadingButton(null);
  };

  /**
   * Instant Action: Recommend rest time based on training goal
   */
  const handleRecommendRest = (userGoal) => {
    const goal = (userGoal || 'hypertrophy').toUpperCase();

    const restTimes = {
      STRENGTH: { time: '3-5 min', seconds: 180, description: 'Full recovery for max strength' },
      HYPERTROPHY: { time: '60-90 sec', seconds: 90, description: 'Optimal for muscle growth' },
      ENDURANCE: { time: '30-45 sec', seconds: 45, description: 'Keep heart rate elevated' },
      POWER: { time: '3-5 min', seconds: 180, description: 'Full CNS recovery' },
    };

    const restInfo = restTimes[goal] || restTimes.HYPERTROPHY;
    const goalDisplay = goal.charAt(0) + goal.slice(1).toLowerCase();

    setInstantActionResult({
      title: '⏱️ Rest Time',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{restInfo.time}</Text>
          <Text style={instantStyles.resultSubtext}>Goal: {goalDisplay}</Text>
          <Text style={instantStyles.resultReason}>{restInfo.description}</Text>
        </View>
      ),
      actions: [
        {
          label: `Start ${restInfo.seconds}s Timer`,
          primary: true,
          onPress: async () => {
            setInstantActionResult(null);
            // Start the rest timer via AsyncStorage event (WorkoutScreen listens for this)
            try {
              await AsyncStorage.setItem('@start_rest_timer', JSON.stringify({
                seconds: restInfo.seconds,
                timestamp: Date.now()
              }));
              // Close modal so user can see the timer
              onClose();
            } catch (e) {
              setLastResponse(`⏱️ Rest **${restInfo.time}** before your next set.`);
            }
          }
        },
        {
          label: '2 min',
          onPress: async () => {
            setInstantActionResult(null);
            try {
              await AsyncStorage.setItem('@start_rest_timer', JSON.stringify({
                seconds: 120,
                timestamp: Date.now()
              }));
              onClose();
            } catch (e) {
              setLastResponse(`⏱️ Rest **2 minutes** before your next set.`);
            }
          }
        },
        {
          label: '3 min',
          onPress: async () => {
            setInstantActionResult(null);
            try {
              await AsyncStorage.setItem('@start_rest_timer', JSON.stringify({
                seconds: 180,
                timestamp: Date.now()
              }));
              onClose();
            } catch (e) {
              setLastResponse(`⏱️ Rest **3 minutes** before your next set.`);
            }
          }
        }
      ]
    });
  };

  /**
   * Instant Action: RPE Calculator
   * Shows RPE scale and helps users understand/calculate RPE
   */
  const handleRPECalculator = (currentWeight) => {
    // RPE scale with descriptions
    const rpeScale = [
      { rpe: 10, rir: 0, label: 'Max Effort', desc: 'Could not do another rep', color: '#FF4444' },
      { rpe: 9.5, rir: 0.5, label: 'Near Max', desc: 'Maybe 1 more with bad form', color: '#FF6644' },
      { rpe: 9, rir: 1, label: 'Very Hard', desc: '1 rep left in tank', color: '#FF8844' },
      { rpe: 8.5, rir: 1.5, label: 'Hard', desc: '1-2 reps left', color: '#FFAA44' },
      { rpe: 8, rir: 2, label: 'Challenging', desc: '2 reps left in tank', color: '#FFCC44' },
      { rpe: 7.5, rir: 2.5, label: 'Moderate+', desc: '2-3 reps left', color: '#DDDD44' },
      { rpe: 7, rir: 3, label: 'Moderate', desc: '3 reps left in tank', color: '#AADD44' },
      { rpe: 6, rir: 4, label: 'Light', desc: '4+ reps left - warm up', color: '#88CC44' },
    ];

    setInstantActionResult({
      title: '📊 RPE Calculator',
      content: (
        <View>
          <Text style={instantStyles.resultSubtext}>Tap your effort level:</Text>
          <Text style={[instantStyles.resultTip, { marginBottom: 8 }]}>
            RIR = Reps In Reserve
          </Text>
        </View>
      ),
      actions: [
        {
          label: 'RPE 10 (0 RIR) - Max',
          onPress: () => showRPEResult(10, 0, currentWeight),
        },
        {
          label: 'RPE 9 (1 RIR) - Very Hard',
          onPress: () => showRPEResult(9, 1, currentWeight),
        },
        {
          label: 'RPE 8 (2 RIR) - Hard',
          primary: true,
          onPress: () => showRPEResult(8, 2, currentWeight),
        },
        {
          label: 'RPE 7 (3 RIR) - Moderate',
          onPress: () => showRPEResult(7, 3, currentWeight),
        },
      ]
    });
  };

  /**
   * Show RPE result with weight recommendations
   */
  const showRPEResult = (rpe, rir, currentWeight) => {
    // Calculate weight adjustments based on RPE
    // General rule: ~2.5% per RPE point for trained lifters
    const weightAdjustmentPerRPE = 0.025;

    let recommendation = '';
    let emoji = '';
    let nextSetAdvice = '';

    if (rpe >= 9.5) {
      emoji = '🔥';
      recommendation = 'That was a max effort set!';
      nextSetAdvice = currentWeight > 0
        ? `Consider dropping to ${Math.round(currentWeight * 0.9 / 5) * 5} lbs for your next set, or take a longer rest.`
        : 'Take a longer rest (3-5 min) or reduce weight for next set.';
    } else if (rpe >= 8.5) {
      emoji = '💪';
      recommendation = 'Great intensity! This is ideal for strength gains.';
      nextSetAdvice = currentWeight > 0
        ? `Keep at ${currentWeight} lbs or drop 5 lbs if fatigued.`
        : 'Maintain this weight or slight reduction if fatigued.';
    } else if (rpe >= 7.5) {
      emoji = '✅';
      recommendation = 'Perfect for hypertrophy! Good muscle stimulus with manageable fatigue.';
      nextSetAdvice = currentWeight > 0
        ? `Stay at ${currentWeight} lbs. You could add 5 lbs next workout.`
        : 'This is a sustainable intensity. Consider adding weight next session.';
    } else if (rpe >= 6.5) {
      emoji = '👍';
      recommendation = 'Moderate effort. Good for volume accumulation.';
      nextSetAdvice = currentWeight > 0
        ? `You could add ${Math.round(currentWeight * 0.05 / 5) * 5 || 5} lbs for more challenge.`
        : 'Add some weight to increase stimulus.';
    } else {
      emoji = '⬆️';
      recommendation = 'Light effort. This is warm-up territory.';
      nextSetAdvice = currentWeight > 0
        ? `Increase to ${Math.round(currentWeight * 1.1 / 5) * 5} lbs for working sets.`
        : 'Increase the weight significantly for your working sets.';
    }

    setInstantActionResult({
      title: `${emoji} RPE ${rpe}`,
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{rir} reps in reserve</Text>
          <Text style={instantStyles.resultReason}>{recommendation}</Text>
          <Text style={[instantStyles.resultTip, { marginTop: 12 }]}>
            {nextSetAdvice}
          </Text>
        </View>
      ),
      actions: [
        {
          label: 'Got it!',
          primary: true,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`📊 **RPE ${rpe}** logged (${rir} RIR)\n\n${recommendation}`);
          }
        },
        {
          label: 'Pick different RPE',
          onPress: () => handleRPECalculator(currentWeight),
        }
      ]
    });
  };

  /**
   * Instant Action: Set feedback (too hard/easy)
   */
  const handleSetFeedback = (currentWeight, workoutExercises = [], exerciseSets = {}) => {
    // If no weight, show exercise picker to select one with logged sets
    if (!currentWeight || currentWeight === 0) {
      // Find exercises with logged sets
      const exercisesWithSets = workoutExercises.filter((ex, index) => {
        const sets = exerciseSets[index] || [];
        return sets.some(s => s.weight && s.completed);
      });

      if (exercisesWithSets.length === 0) {
        setInstantActionResult({
          title: '📊 Set Feedback',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Log a set first to get weight adjustment suggestions!
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection with their last weight
      setInstantActionResult({
        title: '📊 Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Choose exercise to give feedback:</Text>
          </View>
        ),
        actions: exercisesWithSets.slice(0, 4).map((ex, i) => {
          const exIndex = workoutExercises.indexOf(ex);
          const sets = exerciseSets[exIndex] || [];
          const lastSet = sets.filter(s => s.completed).pop();
          const weight = lastSet?.weight || 0;
          return {
            label: `${ex.name} (${weight} lbs)`,
            onPress: () => {
              setInstantActionResult(null);
              handleSetFeedback(weight, workoutExercises, exerciseSets);
            }
          };
        })
      });
      return;
    }

    const lighterWeight = Math.round(currentWeight * 0.9 / 5) * 5;
    const heavierWeight = Math.round(currentWeight * 1.1 / 5) * 5;

    setInstantActionResult({
      title: '📊 How Was Your Set?',
      content: (
        <View>
          <Text style={instantStyles.resultSubtext}>At {currentWeight} lbs</Text>
        </View>
      ),
      actions: [
        {
          label: `😓 Too Hard → ${lighterWeight} lbs`,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`✅ Drop to **${lighterWeight} lbs** (-10%)\n\nFocus on form and controlled reps!`);
          }
        },
        {
          label: '✅ Just Right',
          primary: true,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`✅ Perfect! Stay at **${currentWeight} lbs**\n\nYou're in the sweet spot for progress!`);
          }
        },
        {
          label: `💪 Too Easy → ${heavierWeight} lbs`,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`🔥 Go up to **${heavierWeight} lbs** (+10%)\n\nYou're ready for more weight!`);
          }
        }
      ]
    });
  };

  /**
   * Instant Action: Find exercise alternative
   */
  const handleFindAlternative = (exerciseName, workoutExercises = []) => {
    // If no exercise selected, show exercise picker
    if (!exerciseName) {
      if (workoutExercises.length === 0) {
        setInstantActionResult({
          title: '🔄 No Active Workout',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start a workout first to find exercise alternatives.
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection
      setInstantActionResult({
        title: '🔄 Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Choose exercise to find alternatives:</Text>
          </View>
        ),
        actions: workoutExercises.slice(0, 4).map(ex => ({
          label: ex.name,
          onPress: () => {
            setInstantActionResult(null);
            handleFindAlternative(ex.name, workoutExercises);
          }
        }))
      });
      return;
    }

    const nameLower = exerciseName.toLowerCase();
    let alternativeSet = null;

    // Find first matching entry (most specific matches first due to array order)
    const match = EXERCISE_ALTERNATIVES.find(entry => nameLower.includes(entry.key));
    if (match) {
      alternativeSet = match;
    }

    if (alternativeSet) {
      setInstantActionResult({
        title: '🔄 Alternatives',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Instead of {exerciseName}:</Text>
            {alternativeSet.alternatives.map((alt, index) => (
              <TouchableOpacity
                key={index}
                style={instantStyles.alternativeItem}
                onPress={() => {
                  setInstantActionResult(null);
                  setLastResponse(`✅ **${alt.name}**\n\n${alt.reason}\n\nSwap this into your workout!`);
                }}
              >
                <Text style={instantStyles.alternativeName}>{alt.name}</Text>
                <Text style={instantStyles.alternativeReason}>{alt.reason}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ),
        actions: []
      });
    } else {
      setInstantActionResult({
        title: '🔄 Alternatives',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>For {exerciseName}, try:</Text>
            <Text style={instantStyles.resultTip}>
              • Dumbbell variation (more ROM){'\n'}
              • Cable variation (constant tension){'\n'}
              • Machine variation (easier form)
            </Text>
          </View>
        ),
        actions: []
      });
    }
  };

  /**
   * Similar exercise database for quick lookups
   * Keys are ordered from most specific to least specific for proper matching
   */
  const SIMILAR_EXERCISES = [
    // Leg exercises (most specific first)
    { key: 'leg extension', exercises: ['Sissy Squat', 'Leg Press (high foot)', 'Front Squat', 'Hack Squat'] },
    { key: 'leg curl', exercises: ['Romanian Deadlift', 'Nordic Curl', 'Good Morning', 'Glute Ham Raise'] },
    { key: 'leg press', exercises: ['Hack Squat', 'Smith Machine Squat', 'Belt Squat', 'Pendulum Squat'] },
    { key: 'calf raise', exercises: ['Seated Calf Raise', 'Donkey Calf Raise', 'Single Leg Calf Raise', 'Leg Press Calf Raise'] },
    { key: 'hip thrust', exercises: ['Glute Bridge', 'Cable Pull Through', 'Romanian Deadlift', 'Reverse Hyper'] },
    { key: 'lunge', exercises: ['Bulgarian Split Squat', 'Step Up', 'Walking Lunge', 'Reverse Lunge'] },
    // Chest
    { key: 'bench press', exercises: ['Incline Bench Press', 'Decline Bench Press', 'Dumbbell Bench Press', 'Floor Press'] },
    { key: 'incline', exercises: ['Incline Dumbbell Press', 'Low Incline Bench', 'Incline Machine Press', 'Landmine Press'] },
    { key: 'chest fly', exercises: ['Cable Crossover', 'Pec Deck', 'Dumbbell Fly', 'Incline Fly'] },
    { key: 'push up', exercises: ['Diamond Push-up', 'Decline Push-up', 'Archer Push-up', 'Weighted Push-up'] },
    // Back
    { key: 'lat pulldown', exercises: ['Pull-up', 'Chin-up', 'Straight Arm Pulldown', 'Cable Row'] },
    { key: 'pull up', exercises: ['Chin-up', 'Lat Pulldown', 'Neutral Grip Pull-up', 'Assisted Pull-up'] },
    { key: 'row', exercises: ['Dumbbell Row', 'Cable Row', 'T-Bar Row', 'Meadows Row'] },
    { key: 'deadlift', exercises: ['Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift', 'Deficit Deadlift'] },
    // Shoulders
    { key: 'shoulder press', exercises: ['Dumbbell Shoulder Press', 'Arnold Press', 'Push Press', 'Landmine Press'] },
    { key: 'lateral raise', exercises: ['Cable Lateral Raise', 'Machine Lateral Raise', 'Leaning Lateral Raise', 'Lu Raise'] },
    { key: 'face pull', exercises: ['Rear Delt Fly', 'Band Pull Apart', 'Reverse Pec Deck', 'High Row'] },
    { key: 'rear delt', exercises: ['Face Pull', 'Reverse Fly', 'Band Pull Apart', 'Rear Delt Row'] },
    // Arms
    { key: 'tricep extension', exercises: ['Skull Crusher', 'Cable Pushdown', 'Overhead Extension', 'Dip'] },
    { key: 'tricep pushdown', exercises: ['Overhead Extension', 'Skull Crusher', 'Close Grip Bench', 'Dip'] },
    { key: 'bicep curl', exercises: ['Hammer Curl', 'Preacher Curl', 'Incline Curl', 'Cable Curl'] },
    { key: 'hammer curl', exercises: ['Bicep Curl', 'Cross Body Curl', 'Rope Curl', 'Reverse Curl'] },
    // Generic fallbacks (less specific)
    { key: 'squat', exercises: ['Front Squat', 'Goblet Squat', 'Leg Press', 'Hack Squat'] },
    { key: 'bench', exercises: ['Incline Bench', 'Dumbbell Press', 'Machine Press', 'Push-up'] },
    { key: 'press', exercises: ['Dumbbell Press', 'Machine Press', 'Push-up', 'Landmine Press'] },
    { key: 'curl', exercises: ['Hammer Curl', 'Preacher Curl', 'Cable Curl', 'Incline Curl'] },
    { key: 'fly', exercises: ['Cable Fly', 'Pec Deck', 'Dumbbell Fly', 'Machine Fly'] },
    { key: 'raise', exercises: ['Front Raise', 'Lateral Raise', 'Rear Delt Raise', 'Y Raise'] },
  ];

  /**
   * Superset pairings database
   * Keys are ordered from most specific to least specific
   */
  const SUPERSET_PAIRINGS = [
    // Leg exercises
    { key: 'leg extension', pairs: ['Leg Curl', 'Seated Leg Curl', 'Nordic Curl'], reason: 'Quad/Hamstring balance' },
    { key: 'leg curl', pairs: ['Leg Extension', 'Sissy Squat', 'Front Squat'], reason: 'Hamstring/Quad balance' },
    { key: 'leg press', pairs: ['Leg Curl', 'Romanian Deadlift', 'Calf Raise'], reason: 'Quad/Posterior chain' },
    { key: 'squat', pairs: ['Leg Curl', 'Romanian Deadlift', 'Nordic Curl'], reason: 'Quad/Hamstring balance' },
    { key: 'lunge', pairs: ['Leg Curl', 'Calf Raise', 'Hip Thrust'], reason: 'Lower body circuit' },
    { key: 'calf', pairs: ['Tibialis Raise', 'Leg Extension', 'Leg Curl'], reason: 'Lower leg balance' },
    // Upper body push/pull
    { key: 'bench', pairs: ['Dumbbell Row', 'Face Pull', 'Rear Delt Fly'], reason: 'Push/Pull balance' },
    { key: 'incline', pairs: ['Seated Row', 'Face Pull', 'Reverse Fly'], reason: 'Push/Pull balance' },
    { key: 'shoulder press', pairs: ['Pull-up', 'Lat Pulldown', 'Face Pull'], reason: 'Vertical push/pull' },
    { key: 'lat pulldown', pairs: ['Shoulder Press', 'Incline Press', 'Lateral Raise'], reason: 'Pull/Push balance' },
    { key: 'row', pairs: ['Bench Press', 'Push-up', 'Dip'], reason: 'Pull/Push balance' },
    { key: 'pull up', pairs: ['Dip', 'Push-up', 'Overhead Press'], reason: 'Vertical pull/push' },
    // Arms
    { key: 'bicep', pairs: ['Tricep Extension', 'Tricep Pushdown', 'Skull Crusher'], reason: 'Bicep/Tricep superset' },
    { key: 'tricep', pairs: ['Bicep Curl', 'Hammer Curl', 'Preacher Curl'], reason: 'Tricep/Bicep superset' },
    { key: 'curl', pairs: ['Tricep Extension', 'Tricep Pushdown', 'Dip'], reason: 'Bicep/Tricep superset' },
    // Chest/Back
    { key: 'fly', pairs: ['Reverse Fly', 'Face Pull', 'Rear Delt Row'], reason: 'Chest/Back balance' },
    { key: 'lateral raise', pairs: ['Face Pull', 'Rear Delt Fly', 'Band Pull Apart'], reason: 'Delt balance' },
    { key: 'face pull', pairs: ['Lateral Raise', 'Front Raise', 'Shoulder Press'], reason: 'Shoulder balance' },
    // Generic
    { key: 'press', pairs: ['Row', 'Pull-up', 'Face Pull'], reason: 'Push/Pull balance' },
  ];

  /**
   * Instant Action: Add similar exercise
   */
  const handleAddSimilar = (exerciseName, workoutExercises = []) => {
    // If no exercise selected, show exercise picker
    if (!exerciseName) {
      if (workoutExercises.length === 0) {
        setInstantActionResult({
          title: '➕ No Active Workout',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start a workout first to add similar exercises.
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection
      setInstantActionResult({
        title: '➕ Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Find similar exercises for:</Text>
          </View>
        ),
        actions: workoutExercises.slice(0, 4).map(ex => ({
          label: ex.name,
          onPress: () => {
            setInstantActionResult(null);
            handleAddSimilar(ex.name, workoutExercises);
          }
        }))
      });
      return;
    }

    // Find similar exercises (array is ordered from most specific to least)
    const nameLower = exerciseName.toLowerCase();
    let similarList = null;

    // Find first matching entry (most specific matches first due to array order)
    const match = SIMILAR_EXERCISES.find(entry => nameLower.includes(entry.key));
    if (match) {
      similarList = match.exercises;
    }

    if (similarList) {
      setInstantActionResult({
        title: '➕ Similar Exercises',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Similar to {exerciseName}:</Text>
          </View>
        ),
        actions: similarList.slice(0, 4).map(ex => ({
          label: ex,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`✅ **${ex}** would be a great addition!\n\nAdd it to your workout to target similar muscles with a different stimulus.`);
          }
        }))
      });
    } else {
      // Generic suggestions
      setInstantActionResult({
        title: '➕ Similar Exercises',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>For {exerciseName}, try:</Text>
            <Text style={instantStyles.resultTip}>
              • Same movement with different equipment{'\n'}
              • Unilateral version (single arm/leg){'\n'}
              • Tempo or pause variation{'\n'}
              • Different grip or stance
            </Text>
          </View>
        ),
        actions: []
      });
    }
  };

  /**
   * Instant Action: Add superset exercise
   */
  const handleAddSuperset = (exerciseName, workoutExercises = []) => {
    // If no exercise selected, show exercise picker
    if (!exerciseName) {
      if (workoutExercises.length === 0) {
        setInstantActionResult({
          title: '🔗 No Active Workout',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start a workout first to add superset exercises.
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection
      setInstantActionResult({
        title: '🔗 Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Pair a superset with:</Text>
          </View>
        ),
        actions: workoutExercises.slice(0, 4).map(ex => ({
          label: ex.name,
          onPress: () => {
            setInstantActionResult(null);
            handleAddSuperset(ex.name, workoutExercises);
          }
        }))
      });
      return;
    }

    // Find superset pairings (array is ordered from most specific to least)
    const nameLower = exerciseName.toLowerCase();
    let pairing = null;

    // Find first matching entry (most specific matches first due to array order)
    const match = SUPERSET_PAIRINGS.find(entry => nameLower.includes(entry.key));
    if (match) {
      pairing = match;
    }

    if (pairing) {
      setInstantActionResult({
        title: '🔗 Superset Options',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Pair with {exerciseName}:</Text>
            <Text style={instantStyles.resultReason}>{pairing.reason}</Text>
          </View>
        ),
        actions: pairing.pairs.slice(0, 3).map(ex => ({
          label: ex,
          onPress: () => {
            setInstantActionResult(null);
            setLastResponse(`🔗 **${ex}** pairs great with ${exerciseName}!\n\n${pairing.reason} - no rest between exercises for maximum efficiency.`);
          }
        }))
      });
    } else {
      // Generic superset suggestions
      setInstantActionResult({
        title: '🔗 Superset Ideas',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>For {exerciseName}, pair with:</Text>
            <Text style={instantStyles.resultTip}>
              • Opposing muscle group (push/pull){'\n'}
              • Core exercise (planks, ab wheel){'\n'}
              • Mobility work (stretches){'\n'}
              • Same muscle, different angle
            </Text>
          </View>
        ),
        actions: []
      });
    }
  };

  /**
   * Instant Action: Recommend extra set
   */
  const handleRecommendExtraSet = (exerciseName, workoutExercises = [], exerciseSets = {}) => {
    // If no exercise selected, show exercise picker with set counts
    if (!exerciseName) {
      if (workoutExercises.length === 0) {
        setInstantActionResult({
          title: '➕ No Active Workout',
          content: (
            <View>
              <Text style={instantStyles.resultText}>
                Start a workout first to get set recommendations.
              </Text>
            </View>
          ),
          actions: []
        });
        return;
      }

      // Show exercise selection with set counts
      setInstantActionResult({
        title: '➕ Select Exercise',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Check if you need more sets for:</Text>
          </View>
        ),
        actions: workoutExercises.slice(0, 4).map((ex, index) => {
          const sets = exerciseSets[index] || [];
          const completedSets = sets.filter(s => s.completed).length;
          return {
            label: `${ex.name} (${completedSets} sets)`,
            onPress: () => {
              setInstantActionResult(null);
              handleRecommendExtraSet(ex.name, workoutExercises, exerciseSets, index);
            }
          };
        })
      });
      return;
    }

    // Find exercise index to get set data
    const exIndex = workoutExercises.findIndex(ex => ex.name === exerciseName);
    const sets = exerciseSets[exIndex] || [];
    const completedSets = sets.filter(s => s.completed).length;
    const targetSets = 3; // Standard recommendation

    // Calculate volume
    const totalVolume = sets
      .filter(s => s.completed && s.weight && s.reps)
      .reduce((sum, s) => sum + (parseFloat(s.weight) * parseInt(s.reps)), 0);

    if (completedSets < targetSets) {
      setInstantActionResult({
        title: '💪 Do Another Set!',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>Yes!</Text>
            <Text style={instantStyles.resultSubtext}>
              {exerciseName}: {completedSets}/{targetSets} sets done
            </Text>
            <Text style={instantStyles.resultReason}>
              You haven't hit your target volume yet. One more set will maximize gains!
            </Text>
          </View>
        ),
        actions: [
          {
            label: 'Got it!',
            primary: true,
            onPress: () => {
              setInstantActionResult(null);
              setLastResponse(`💪 Go for set ${completedSets + 1}!\n\nYou're ${targetSets - completedSets} set(s) away from your target.`);
            }
          }
        ]
      });
    } else if (completedSets === targetSets) {
      setInstantActionResult({
        title: '✅ Target Reached',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>Optional</Text>
            <Text style={instantStyles.resultSubtext}>
              {exerciseName}: {completedSets} sets ({Math.round(totalVolume)} lbs volume)
            </Text>
            <Text style={instantStyles.resultReason}>
              You've hit your target! Add a set if you're feeling strong, or move on.
            </Text>
          </View>
        ),
        actions: [
          {
            label: 'Add one more',
            onPress: () => {
              setInstantActionResult(null);
              setLastResponse(`🔥 Go for a bonus set! You're crushing it.`);
            }
          },
          {
            label: 'Move on',
            primary: true,
            onPress: () => {
              setInstantActionResult(null);
              setLastResponse(`✅ Great work on ${exerciseName}! Time for the next exercise.`);
            }
          }
        ]
      });
    } else {
      setInstantActionResult({
        title: '🏆 Exceeded Target',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>You're done!</Text>
            <Text style={instantStyles.resultSubtext}>
              {exerciseName}: {completedSets} sets ({Math.round(totalVolume)} lbs volume)
            </Text>
            <Text style={instantStyles.resultReason}>
              Excellent volume! Move on to avoid overtraining this muscle group.
            </Text>
          </View>
        ),
        actions: [
          {
            label: 'Next exercise',
            primary: true,
            onPress: () => {
              setInstantActionResult(null);
              setLastResponse(`🏆 Excellent work! ${completedSets} sets is great volume. Time to move on!`);
            }
          }
        ]
      });
    }
  };

  // ============================================================
  // StartWorkoutScreen Handlers
  // ============================================================

  const handleRecommendToday = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      const lastWorkout = history[0];

      // Simple rotation logic
      const muscleGroups = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'];
      const lastType = lastWorkout?.type || 'rest';

      let recommendation = 'Push';
      if (lastType.toLowerCase().includes('push')) recommendation = 'Pull';
      else if (lastType.toLowerCase().includes('pull')) recommendation = 'Legs';
      else if (lastType.toLowerCase().includes('leg')) recommendation = 'Push';
      else if (lastType.toLowerCase().includes('upper')) recommendation = 'Lower';
      else if (lastType.toLowerCase().includes('lower')) recommendation = 'Upper';

      const daysSinceLast = lastWorkout
        ? Math.floor((Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      setInstantActionResult({
        title: '📅 Today\'s Recommendation',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{recommendation} Day</Text>
            <Text style={instantStyles.resultSubtext}>
              {lastWorkout
                ? `Last: ${lastWorkout.type || 'Workout'} (${daysSinceLast}d ago)`
                : 'No recent workouts'}
            </Text>
            <Text style={instantStyles.resultReason}>
              Based on your training history and recovery needs.
            </Text>
          </View>
        ),
        actions: [
          { label: `Start ${recommendation}`, primary: true, onPress: () => { setInstantActionResult(null); onClose(); } },
          { label: 'Pick different', onPress: () => { setInstantActionResult(null); } }
        ]
      });
    } catch (e) {
      setLastResponse('📅 Try a **Push** or **Full Body** workout to get started!');
    }
  };

  const handleLastWorkout = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      const lastWorkout = history[0];

      if (!lastWorkout) {
        setInstantActionResult({
          title: '📊 Last Workout',
          content: (<View><Text style={instantStyles.resultText}>No workout history yet. Start your first workout!</Text></View>),
          actions: []
        });
        return;
      }

      const date = new Date(lastWorkout.date).toLocaleDateString();
      const exercises = lastWorkout.exercises?.length || 0;
      const volume = lastWorkout.totalVolume || 0;

      setInstantActionResult({
        title: '📊 Last Workout',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{lastWorkout.type || 'Workout'}</Text>
            <Text style={instantStyles.resultSubtext}>{date}</Text>
            <Text style={instantStyles.resultReason}>
              {exercises} exercises • {Math.round(volume).toLocaleString()} lbs volume
            </Text>
          </View>
        ),
        actions: [
          { label: 'Repeat this workout', primary: true, onPress: () => { setInstantActionResult(null); setLastResponse('🔄 Starting same workout...'); } }
        ]
      });
    } catch (e) {
      setLastResponse('No workout history found.');
    }
  };

  const handleMusclePriority = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      // Count muscle groups trained in last 7 days
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentWorkouts = history.filter(w => new Date(w.date).getTime() > weekAgo);

      const muscleCount = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0 };
      recentWorkouts.forEach(w => {
        const type = (w.type || '').toLowerCase();
        if (type.includes('push') || type.includes('chest')) muscleCount.chest++;
        if (type.includes('pull') || type.includes('back')) muscleCount.back++;
        if (type.includes('leg') || type.includes('lower')) muscleCount.legs++;
        if (type.includes('shoulder') || type.includes('push')) muscleCount.shoulders++;
        if (type.includes('arm') || type.includes('upper')) muscleCount.arms++;
      });

      // Find least trained
      const sorted = Object.entries(muscleCount).sort((a, b) => a[1] - b[1]);
      const priority = sorted[0][0];
      const priorityName = priority.charAt(0).toUpperCase() + priority.slice(1);

      setInstantActionResult({
        title: '💪 Muscle Priority',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>Train {priorityName}</Text>
            <Text style={instantStyles.resultSubtext}>Least trained this week</Text>
            <Text style={instantStyles.resultReason}>
              Weekly sessions: Chest {muscleCount.chest} • Back {muscleCount.back} • Legs {muscleCount.legs}
            </Text>
          </View>
        ),
        actions: [
          { label: `${priorityName} workout`, primary: true, onPress: () => { setInstantActionResult(null); } }
        ]
      });
    } catch (e) {
      setLastResponse('Train **Legs** - most commonly skipped! 🦵');
    }
  };

  const handleBrowseExercises = (muscle) => {
    const muscleExercises = {
      chest: ['Bench Press', 'Incline Press', 'Dumbbell Fly', 'Cable Crossover', 'Push-up'],
      back: ['Lat Pulldown', 'Barbell Row', 'Pull-up', 'Cable Row', 'Face Pull'],
      legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl'],
      arms: ['Bicep Curl', 'Tricep Extension', 'Hammer Curl', 'Skull Crusher', 'Lateral Raise'],
    };

    const exercises = muscleExercises[muscle] || muscleExercises.chest;
    const muscleName = muscle ? muscle.charAt(0).toUpperCase() + muscle.slice(1) : 'Chest';

    setInstantActionResult({
      title: `🎯 ${muscleName} Exercises`,
      content: (<View><Text style={instantStyles.resultSubtext}>Popular exercises:</Text></View>),
      actions: exercises.slice(0, 4).map(ex => ({
        label: ex,
        onPress: () => { setInstantActionResult(null); setLastResponse(`✅ **${ex}** - Great choice for ${muscleName.toLowerCase()}!`); }
      }))
    });
  };

  // ============================================================
  // WorkoutHistoryScreen Handlers
  // ============================================================

  const handleWeekSummary = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekWorkouts = history.filter(w => new Date(w.date).getTime() > weekAgo);
      const totalVolume = weekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

      setInstantActionResult({
        title: '📊 This Week',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{weekWorkouts.length} workouts</Text>
            <Text style={instantStyles.resultSubtext}>{Math.round(totalVolume).toLocaleString()} lbs total volume</Text>
            <Text style={instantStyles.resultReason}>
              {weekWorkouts.length >= 4 ? '🔥 Great consistency!' : weekWorkouts.length >= 2 ? '👍 Good progress!' : '💪 Keep pushing!'}
            </Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('No workout data this week.');
    }
  };

  const handleRecentPRs = async () => {
    try {
      const prsStr = await AsyncStorage.getItem('@personal_records');
      const prs = prsStr ? JSON.parse(prsStr) : {};

      const prList = Object.entries(prs).slice(0, 4);

      if (prList.length === 0) {
        setInstantActionResult({
          title: '🏆 Personal Records',
          content: (<View><Text style={instantStyles.resultText}>No PRs recorded yet. Keep training!</Text></View>),
          actions: []
        });
        return;
      }

      setInstantActionResult({
        title: '🏆 Personal Records',
        content: (
          <View>
            {prList.map(([exercise, pr], i) => (
              <Text key={i} style={instantStyles.resultSubtext}>
                {exercise}: {pr.weight} lbs × {pr.reps}
              </Text>
            ))}
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('No PRs recorded yet.');
    }
  };

  const handleMuscleBalance = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const monthWorkouts = history.filter(w => new Date(w.date).getTime() > monthAgo);

      const muscleCount = { Push: 0, Pull: 0, Legs: 0 };
      monthWorkouts.forEach(w => {
        const type = (w.type || '').toLowerCase();
        if (type.includes('push') || type.includes('chest') || type.includes('upper')) muscleCount.Push++;
        if (type.includes('pull') || type.includes('back')) muscleCount.Pull++;
        if (type.includes('leg') || type.includes('lower')) muscleCount.Legs++;
      });

      const total = muscleCount.Push + muscleCount.Pull + muscleCount.Legs || 1;

      setInstantActionResult({
        title: '⚖️ Muscle Balance',
        content: (
          <View>
            <Text style={instantStyles.resultSubtext}>Push: {muscleCount.Push} ({Math.round(muscleCount.Push/total*100)}%)</Text>
            <Text style={instantStyles.resultSubtext}>Pull: {muscleCount.Pull} ({Math.round(muscleCount.Pull/total*100)}%)</Text>
            <Text style={instantStyles.resultSubtext}>Legs: {muscleCount.Legs} ({Math.round(muscleCount.Legs/total*100)}%)</Text>
            <Text style={instantStyles.resultReason}>
              {muscleCount.Legs < muscleCount.Push ? '⚠️ Train more legs!' : '✅ Good balance!'}
            </Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('No workout history for balance check.');
    }
  };

  const handleStreakStatus = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const hasWorkout = history.some(w => w.date?.startsWith(dateStr));
        if (hasWorkout || i === 0) {
          if (hasWorkout) streak++;
        } else {
          break;
        }
      }

      setInstantActionResult({
        title: '🔥 Streak Status',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{streak} day streak</Text>
            <Text style={instantStyles.resultReason}>
              {streak >= 7 ? '🏆 Amazing consistency!' : streak >= 3 ? '💪 Keep it up!' : '🚀 Build your streak!'}
            </Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('Start your streak today! 🔥');
    }
  };

  const handleVolumeTrend = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const lastWeek = Date.now() - 14 * 24 * 60 * 60 * 1000;

      const thisWeekVol = history.filter(w => new Date(w.date).getTime() > thisWeek)
        .reduce((sum, w) => sum + (w.totalVolume || 0), 0);
      const lastWeekVol = history.filter(w => new Date(w.date).getTime() > lastWeek && new Date(w.date).getTime() <= thisWeek)
        .reduce((sum, w) => sum + (w.totalVolume || 0), 0);

      const change = lastWeekVol > 0 ? ((thisWeekVol - lastWeekVol) / lastWeekVol * 100) : 0;

      setInstantActionResult({
        title: '📈 Volume Trend',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>
              {change >= 0 ? '+' : ''}{Math.round(change)}%
            </Text>
            <Text style={instantStyles.resultSubtext}>
              This week: {Math.round(thisWeekVol).toLocaleString()} lbs
            </Text>
            <Text style={instantStyles.resultSubtext}>
              Last week: {Math.round(lastWeekVol).toLocaleString()} lbs
            </Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('Not enough data for volume trend.');
    }
  };

  const handleWorkoutFrequency = async () => {
    try {
      const historyStr = await AsyncStorage.getItem('@workout_history');
      const history = historyStr ? JSON.parse(historyStr) : [];

      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const monthWorkouts = history.filter(w => new Date(w.date).getTime() > monthAgo);
      const avgPerWeek = (monthWorkouts.length / 4).toFixed(1);

      setInstantActionResult({
        title: '📅 Workout Frequency',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{avgPerWeek}×/week</Text>
            <Text style={instantStyles.resultSubtext}>{monthWorkouts.length} workouts in last 30 days</Text>
            <Text style={instantStyles.resultReason}>
              {parseFloat(avgPerWeek) >= 4 ? '🔥 Great frequency!' : parseFloat(avgPerWeek) >= 2 ? '👍 Solid consistency' : '💪 Try to hit 3-4×/week'}
            </Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('No workout frequency data.');
    }
  };

  // ============================================================
  // ExerciseDetailScreen Handlers
  // ============================================================

  const handleExercisePR = async (exerciseName) => {
    if (!exerciseName) {
      setLastResponse('Select an exercise to view PR.');
      return;
    }

    try {
      const prsStr = await AsyncStorage.getItem('@personal_records');
      const prs = prsStr ? JSON.parse(prsStr) : {};
      const pr = prs[exerciseName];

      if (!pr) {
        setInstantActionResult({
          title: `🏆 ${exerciseName} PR`,
          content: (<View><Text style={instantStyles.resultText}>No PR recorded. Keep training!</Text></View>),
          actions: []
        });
        return;
      }

      setInstantActionResult({
        title: `🏆 ${exerciseName}`,
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{pr.weight} lbs × {pr.reps}</Text>
            <Text style={instantStyles.resultSubtext}>Set on {new Date(pr.date).toLocaleDateString()}</Text>
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('Could not load PR data.');
    }
  };

  const handleExerciseProgression = (exerciseName) => {
    if (!exerciseName) {
      setLastResponse('Select an exercise to view progression.');
      return;
    }
    setLastResponse(`📈 **${exerciseName}** progression: Check the charts in Progress screen for detailed graphs.`);
  };

  const handleExerciseHistory = (exerciseName) => {
    if (!exerciseName) {
      setLastResponse('Select an exercise to view history.');
      return;
    }
    setLastResponse(`📊 **${exerciseName}** history: View detailed session history in Progress screen.`);
  };

  // ============================================================
  // WorkoutSummaryScreen Handlers
  // ============================================================

  const handleCheckWorkoutPRs = (exerciseSets) => {
    // Simple check based on current workout data
    setInstantActionResult({
      title: '🏆 PR Check',
      content: (
        <View>
          <Text style={instantStyles.resultText}>
            PRs are automatically detected when you log sets heavier than your previous best!
          </Text>
          <Text style={instantStyles.resultReason}>
            Check the workout summary for any new records.
          </Text>
        </View>
      ),
      actions: []
    });
  };

  const handleCompareWorkout = () => {
    setInstantActionResult({
      title: '📊 Workout Comparison',
      content: (
        <View>
          <Text style={instantStyles.resultText}>
            Compare your performance in the workout history section.
          </Text>
        </View>
      ),
      actions: []
    });
  };

  const handleVolumeBreakdown = (workoutExercises = [], exerciseSets = {}) => {
    const totalSets = Object.values(exerciseSets).flat().filter(s => s.completed).length;
    const totalVolume = Object.values(exerciseSets).flat()
      .filter(s => s.completed && s.weight && s.reps)
      .reduce((sum, s) => sum + (parseFloat(s.weight) * parseInt(s.reps)), 0);

    setInstantActionResult({
      title: '📊 Volume Breakdown',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{Math.round(totalVolume).toLocaleString()} lbs</Text>
          <Text style={instantStyles.resultSubtext}>{totalSets} sets completed</Text>
          <Text style={instantStyles.resultSubtext}>{workoutExercises.length} exercises</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleMusclesWorked = (workoutExercises = []) => {
    const muscles = new Set();
    workoutExercises.forEach(ex => {
      const name = (ex.name || '').toLowerCase();
      if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('push')) muscles.add('Chest');
      if (name.includes('row') || name.includes('pull') || name.includes('lat') || name.includes('back')) muscles.add('Back');
      if (name.includes('squat') || name.includes('leg') || name.includes('lunge')) muscles.add('Legs');
      if (name.includes('shoulder') || name.includes('press') || name.includes('raise')) muscles.add('Shoulders');
      if (name.includes('curl') || name.includes('bicep')) muscles.add('Biceps');
      if (name.includes('tricep') || name.includes('extension') || name.includes('dip')) muscles.add('Triceps');
    });

    setInstantActionResult({
      title: '💪 Muscles Worked',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{muscles.size} muscle groups</Text>
          <Text style={instantStyles.resultSubtext}>{Array.from(muscles).join(', ') || 'Various muscles'}</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleRecommendNext = (workoutExercises = []) => {
    // Simple logic based on what was just trained
    const trained = workoutExercises.map(e => (e.name || '').toLowerCase()).join(' ');
    let next = 'Rest day';

    if (trained.includes('chest') || trained.includes('push')) next = 'Pull (Back & Biceps)';
    else if (trained.includes('back') || trained.includes('pull')) next = 'Legs';
    else if (trained.includes('leg')) next = 'Push (Chest & Triceps)';
    else next = 'Upper Body or Full Body';

    setInstantActionResult({
      title: '📅 What\'s Next',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{next}</Text>
          <Text style={instantStyles.resultReason}>Based on today's workout</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleRecoveryTime = (workoutExercises = []) => {
    setInstantActionResult({
      title: '⏰ Recovery Time',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>48-72 hours</Text>
          <Text style={instantStyles.resultSubtext}>For the muscles worked today</Text>
          <Text style={instantStyles.resultReason}>You can train other muscle groups tomorrow!</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleWorkoutSummary = (workoutExercises = [], exerciseSets = {}) => {
    const totalSets = Object.values(exerciseSets).flat().filter(s => s.completed).length;
    const totalVolume = Object.values(exerciseSets).flat()
      .filter(s => s.completed && s.weight && s.reps)
      .reduce((sum, s) => sum + (parseFloat(s.weight) * parseInt(s.reps)), 0);

    setInstantActionResult({
      title: '📊 Workout Summary',
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{workoutExercises.length} exercises</Text>
          <Text style={instantStyles.resultSubtext}>{totalSets} sets • {Math.round(totalVolume).toLocaleString()} lbs</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleRepeatWorkout = () => {
    setLastResponse('🔄 To repeat this workout, go to Workout History and tap "Repeat".');
  };

  // ============================================================
  // MyPlansScreen Handlers
  // ============================================================

  const handleProgramOverview = async () => {
    try {
      const programsStr = await AsyncStorage.getItem('@workout_programs');
      const programs = programsStr ? JSON.parse(programsStr) : [];

      if (programs.length === 0) {
        setInstantActionResult({
          title: '📋 Programs',
          content: (<View><Text style={instantStyles.resultText}>No programs created yet. Create one to get started!</Text></View>),
          actions: []
        });
        return;
      }

      setInstantActionResult({
        title: '📋 Your Programs',
        content: (
          <View>
            <Text style={instantStyles.resultHighlight}>{programs.length} program(s)</Text>
            {programs.slice(0, 3).map((p, i) => (
              <Text key={i} style={instantStyles.resultSubtext}>{p.name || 'Unnamed Program'}</Text>
            ))}
          </View>
        ),
        actions: []
      });
    } catch (e) {
      setLastResponse('Could not load programs.');
    }
  };

  const handleWeeklySchedule = () => {
    setInstantActionResult({
      title: '📅 Weekly Schedule',
      content: (
        <View>
          <Text style={instantStyles.resultSubtext}>Mon: Push</Text>
          <Text style={instantStyles.resultSubtext}>Tue: Pull</Text>
          <Text style={instantStyles.resultSubtext}>Wed: Legs</Text>
          <Text style={instantStyles.resultSubtext}>Thu: Rest</Text>
          <Text style={instantStyles.resultSubtext}>Fri: Upper</Text>
          <Text style={instantStyles.resultSubtext}>Sat: Lower</Text>
          <Text style={instantStyles.resultSubtext}>Sun: Rest</Text>
        </View>
      ),
      actions: []
    });
  };

  const handleShowSplitInfo = (type) => {
    const splits = {
      ppl: { name: 'Push/Pull/Legs', days: 6, desc: 'Train each muscle 2×/week. Push (chest, shoulders, triceps), Pull (back, biceps), Legs (quads, hams, glutes).' },
      upper_lower: { name: 'Upper/Lower', days: 4, desc: 'Alternate upper and lower body. Great for strength and recovery balance.' },
      full_body: { name: 'Full Body', days: 3, desc: 'Hit all muscles each session. Perfect for beginners or busy schedules.' },
      bro_split: { name: 'Bro Split', days: 5, desc: 'One muscle group per day. High volume per muscle, long recovery between sessions.' },
    };

    const split = splits[type] || splits.ppl;

    setInstantActionResult({
      title: `📋 ${split.name}`,
      content: (
        <View>
          <Text style={instantStyles.resultHighlight}>{split.days} days/week</Text>
          <Text style={instantStyles.resultReason}>{split.desc}</Text>
        </View>
      ),
      actions: [
        { label: 'Use this split', primary: true, onPress: () => { setInstantActionResult(null); setLastResponse(`✅ Great choice! Start with ${split.name}.`); } }
      ]
    });
  };

  const handleWeeklyVolume = () => {
    setInstantActionResult({
      title: '📊 Weekly Volume Guide',
      content: (
        <View>
          <Text style={instantStyles.resultSubtext}>Chest: 10-20 sets/week</Text>
          <Text style={instantStyles.resultSubtext}>Back: 10-20 sets/week</Text>
          <Text style={instantStyles.resultSubtext}>Legs: 10-20 sets/week</Text>
          <Text style={instantStyles.resultSubtext}>Shoulders: 6-12 sets/week</Text>
          <Text style={instantStyles.resultSubtext}>Arms: 6-12 sets/week</Text>
          <Text style={instantStyles.resultReason}>Adjust based on recovery and goals.</Text>
        </View>
      ),
      actions: []
    });
  };

  // ============================================================
  // Filter Handlers
  // ============================================================

  const handleFilterByMuscle = () => {
    const muscles = ['Chest', 'Back', 'Legs', 'Shoulders'];
    setInstantActionResult({
      title: '💪 Select Muscle',
      content: (<View><Text style={instantStyles.resultSubtext}>Filter exercises by:</Text></View>),
      actions: muscles.map(m => ({
        label: m,
        onPress: () => handleBrowseExercises(m.toLowerCase())
      }))
    });
  };

  const handleFilterByEquipment = () => {
    const equipment = ['Barbell', 'Dumbbell', 'Cable', 'Machine'];
    setInstantActionResult({
      title: '🏋️ Select Equipment',
      content: (<View><Text style={instantStyles.resultSubtext}>Filter exercises by:</Text></View>),
      actions: equipment.map(e => ({
        label: e,
        onPress: () => { setInstantActionResult(null); setLastResponse(`Showing ${e} exercises...`); }
      }))
    });
  };

  /**
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    // Handle dynamic text (function that returns text based on time)
    const buttonText = button.isDynamic && typeof button.text === 'function'
      ? button.text()
      : button.text;

    // Check if this is an instant action (no AI needed)
    if (button.instantAction) {
      await handleInstantAction(button.instantAction, button);
      return;
    }

    // Check if this is a recipe button - show source modal first
    const isRecipeButton = button.toolName && (
      button.toolName.includes('Recipe') ||
      button.toolName.includes('recipe') ||
      buttonText.toLowerCase().includes('recipe')
    );

    if (isRecipeButton) {
      setPendingRecipeButton(button);
      setShowRecipeSourceModal(true);
      return;
    }

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
      setLoadingButton(buttonText);
      setLastResponse(null);

      // Collapse all sections
      setExpandedSections({});

      // Build context for this screen
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);

      // Add screen params to context (e.g., mealType for RecipesScreen)
      if (screenParams) {
        context.screenParams = screenParams;
      }

      // Build prompt - check if we need to use recent ingredients
      let messageToSend = button.prompt || buttonText;

      // Apply user preferences if button uses them
      if (button.usesPreferences) {
        const preferences = await getRecipePreferences();
        const prefType = button.usesPreferences; // 'highProtein', 'lowCalorie', 'balanced'
        const userPrefs = preferences[prefType];

        if (prefType === 'highProtein' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a high-protein recipe that meets these EXACT requirements. Adjust portion sizes to hit these targets precisely.`;
        } else if (prefType === 'lowCalorie' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a low-calorie recipe that meets these EXACT requirements. Keep it light and healthy while hitting these precise targets.`;
        } else if (prefType === 'balanced' && userPrefs) {
          messageToSend = `CRITICAL REQUIREMENTS - Must be followed exactly:\n- Minimum ${userPrefs.protein}g protein (cannot be less)\n- Maximum ${userPrefs.calories} calories (cannot exceed)\n\nGenerate a balanced, nutritious recipe that meets these EXACT requirements. Focus on whole foods while hitting these precise macro targets.`;
        }
      }

      // Make high-protein recipe prompt dynamic based on meal type
      if (button.toolName === 'generateHighProteinRecipe' && screenParams?.mealType && !button.usesPreferences) {
        const mealType = screenParams.mealType;
        const calorieRanges = {
          breakfast: { min: 300, max: 600, ideal: 450 },
          lunch: { min: 400, max: 700, ideal: 550 },
          dinner: { min: 500, max: 800, ideal: 650 },
          snack: { min: 100, max: 300, ideal: 200 },
          snacks: { min: 100, max: 300, ideal: 200 }, // Handle both "snack" and "snacks"
        };

        const range = calorieRanges[mealType] || { min: 300, max: 700, ideal: 500 };
        const proteinAmount = Math.round((range.ideal * 0.35) / 4); // 35% protein for high-protein meals

        messageToSend = `Generate a high-protein ${mealType} with approximately ${proteinAmount}g protein and ${range.ideal} calories (max ${range.max} calories). Keep it appropriate for a ${mealType}.`;
      }

      if (button.promptTemplate === 'recentIngredients') {
        try {
          const recentFoods = await getRecentFoods(user?.uid, 10);
          if (recentFoods && recentFoods.length > 0) {
            // Get unique food names (remove duplicates and limit to 5-6 ingredients)
            const uniqueFoods = [...new Set(recentFoods.map(f => f.name))].slice(0, 6);
            messageToSend = `Create a recipe using ingredients from my recent foods: ${uniqueFoods.join(', ')}`;
          } else {
            // Fallback to default if no recent foods
            messageToSend = button.fallbackPrompt || 'Create a recipe using: chicken, rice, broccoli';
          }
        } catch (error) {
          console.error('Error fetching recent foods:', error);
          messageToSend = button.fallbackPrompt || 'Create a recipe using: chicken, rice, broccoli';
        }
      }

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(messageToSend, context);

      // Store response and tool results
      setLastResponse(result.response);
      setLastToolResults(result.toolResults || null);


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
  // Scroll to bottom when reply input is focused (keyboard opens)
  const scrollToReplyInput = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300); // Small delay to let keyboard animation start
  };

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
   * Process buttons to add disabled state, subtitle, and instant action indicators
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
      // Add description as subtitle for instant actions
      if (button.instantAction && button.description) {
        return {
          ...button,
          subtitle: button.description,
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
  const isExerciseClarificationQuestion = detectExerciseClarificationQuestion(lastResponse);
  const isRPERequested = detectRPERequest(lastResponse);
  const isExerciseModificationQuestion = detectExerciseModificationQuestion(lastResponse);
  const isSetRemovalQuestion = detectSetRemovalQuestion(lastResponse);
  const isExerciseReorderQuestion = detectExerciseReorderQuestion(lastResponse);
  const isReorderDirectionQuestion = detectReorderDirectionQuestion(lastResponse);
  const isWorkoutRatingQuestion = detectWorkoutRatingQuestion(lastResponse);
  const isRestDurationQuestion = detectRestDurationQuestion(lastResponse);


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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>{coachName}</Text>
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
                  showSettingsButton={section.hasSettings}
                  onSettingsPress={() => setShowRecipePreferencesModal(true)}
                />
              ))}

              {/* "Ask Coach Anything..." Button - Opens Full Chat Modal */}
              {!lastResponse && !showCustomInput && loadingButton === null && (
                <TouchableOpacity
                  style={styles.askCoachButton}
                  onPress={() => setShowChatModal(true)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.askCoachGradient}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                    <Text style={styles.askCoachButtonText}>Open Chat Mode...</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              )}

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
                  {/* Hide header and text when meal suggestions are shown */}
                  {!(lastToolResults?.mealSuggestions && lastToolResults?.source === 'generated') && (
                    <>
                      <View style={styles.responseHeader}>
                        <Text style={styles.responseIcon}>💬</Text>
                        <Text style={styles.responseTitle}>AI Response</Text>
                      </View>
                      <ScrollView
                        style={styles.responseScrollView}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        <Text style={styles.responseText}>{lastResponse}</Text>
                      </ScrollView>
                    </>
                  )}

                  {/* Recipe Card - Show when recipe is generated */}
                  {(() => {
                    const recipeCard = Array.isArray(lastToolResults) && lastToolResults[0]?.result?.recipeCard;
                    if (recipeCard && recipeCard.needsConfirmation) {
                      return (
                        <View style={styles.recipeCard}>
                          {/* Recipe Header */}
                          <Text style={styles.recipeTitle}>{recipeCard.title}</Text>

                          {/* Macros Row */}
                          <View style={styles.macrosRow}>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{recipeCard.calories}</Text>
                              <Text style={styles.macroLabel}>Calories</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{recipeCard.protein}g</Text>
                              <Text style={styles.macroLabel}>Protein</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{recipeCard.carbs}g</Text>
                              <Text style={styles.macroLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{recipeCard.fat}g</Text>
                              <Text style={styles.macroLabel}>Fat</Text>
                            </View>
                          </View>

                          {/* Recipe Details */}
                          <View style={styles.recipeDetails}>
                            <Text style={styles.recipeDetail}>🍽️ {recipeCard.servings} servings</Text>
                            <Text style={styles.recipeDetail}>⏱️ Prep: {recipeCard.prepTime} | Cook: {recipeCard.cookTime}</Text>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.recipeButtons}>
                            <TouchableOpacity
                              style={[styles.recipeButton, styles.saveButton]}
                              onPress={() => handleSaveRecipe(recipeCard)}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>💾 Save to Recipes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.recipeButton, styles.discardButton]}
                              onPress={() => handleDiscardRecipe()}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>❌ Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.recipeButton, styles.regenerateButton]}
                              onPress={() => handleRegenerateRecipe(recipeCard)}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>🔄 Generate New</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {/* Macro Stats Card - Show when nutrition tools return macro data */}
                  {(() => {
                    const macroToolResult = Array.isArray(lastToolResults) && lastToolResults.find(tool =>
                      tool.name === 'predictDailyMacroShortfall' ||
                      tool.name === 'getNutritionStatus' ||
                      tool.name === 'suggestNextMealForBalance'
                    );
                    const macroData = macroToolResult?.result?.data || macroToolResult?.result?.status;

                    if (macroData && macroData.consumed && macroData.goals) {
                      return (
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
                      );
                    }
                    return null;
                  })()}

                  {/* Database Recipe Results - Show all recipes with navigation */}
                  {(() => {
                    if (lastToolResults?.recipes && lastToolResults?.source === 'database') {
                      const recipes = lastToolResults.recipes;
                      const currentRecipe = recipes[currentRecipeIndex];

                      if (!currentRecipe) return null;

                      return (
                        <View style={styles.recipeCard}>
                          {/* Recipe Counter */}
                          <View style={styles.recipeCounter}>
                            <Text style={styles.recipeCounterText}>
                              Recipe {currentRecipeIndex + 1} of {recipes.length}
                            </Text>
                          </View>

                          {/* Recipe Header */}
                          <Text style={styles.recipeTitle}>{currentRecipe.name}</Text>

                          {/* Macros Row */}
                          <View style={styles.macrosRow}>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentRecipe.nutrition.calories}</Text>
                              <Text style={styles.macroLabel}>Calories</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentRecipe.nutrition.protein}g</Text>
                              <Text style={styles.macroLabel}>Protein</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentRecipe.nutrition.carbs}g</Text>
                              <Text style={styles.macroLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentRecipe.nutrition.fat}g</Text>
                              <Text style={styles.macroLabel}>Fat</Text>
                            </View>
                          </View>

                          {/* Recipe Details */}
                          <View style={styles.recipeDetails}>
                            <Text style={styles.recipeDetail}>🍽️ {currentRecipe.servings} servings</Text>
                            <Text style={styles.recipeDetail}>⏱️ {currentRecipe.prepTime} prep | {currentRecipe.cookTime} cook</Text>
                            {currentRecipe.category && (
                              <Text style={styles.recipeDetail}>📁 {currentRecipe.category}</Text>
                            )}
                          </View>

                          {/* Navigation Buttons */}
                          <View style={styles.navigationButtons}>
                            <TouchableOpacity
                              style={[styles.navButton, currentRecipeIndex === 0 && styles.navButtonDisabled]}
                              onPress={() => setCurrentRecipeIndex(Math.max(0, currentRecipeIndex - 1))}
                              disabled={currentRecipeIndex === 0}
                            >
                              <Ionicons name="chevron-back" size={24} color={currentRecipeIndex === 0 ? Colors.textMuted : Colors.white} />
                              <Text style={[styles.navButtonText, currentRecipeIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.navButton, currentRecipeIndex === recipes.length - 1 && styles.navButtonDisabled]}
                              onPress={() => setCurrentRecipeIndex(Math.min(recipes.length - 1, currentRecipeIndex + 1))}
                              disabled={currentRecipeIndex === recipes.length - 1}
                            >
                              <Text style={[styles.navButtonText, currentRecipeIndex === recipes.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                              <Ionicons name="chevron-forward" size={24} color={currentRecipeIndex === recipes.length - 1 ? Colors.textMuted : Colors.white} />
                            </TouchableOpacity>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.recipeButtons}>
                            <TouchableOpacity
                              style={[styles.recipeButton, styles.saveButton]}
                              onPress={() => {
                                // Convert database recipe to save format
                                const recipeCard = {
                                  fullRecipe: {
                                    id: currentRecipe.id,
                                    title: currentRecipe.name,
                                    ...currentRecipe
                                  }
                                };
                                handleSaveRecipe(recipeCard);
                              }}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>💾 Save Recipe</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.recipeButton, styles.discardButton]}
                              onPress={() => handleDiscardRecipe()}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>❌ Close</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {/* No Results - Retry Button */}
                  {lastToolResults?.noResults && (
                    <View style={styles.recipeCard}>
                      <TouchableOpacity
                        style={[styles.recipeButton, styles.regenerateButton]}
                        onPress={() => {
                          // Reopen filter modal with last filters
                          setShowRecipeFilterModal(true);
                          setLastToolResults(null); // Clear no results flag
                        }}
                        disabled={loadingButton !== null}
                      >
                        <Text style={styles.recipeButtonText}>🔄 Try Different Filters</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Meal Suggestions - Show multiple meal options with navigation */}
                  {(() => {
                    if (lastToolResults?.mealSuggestions && lastToolResults?.source === 'generated') {
                      const meals = lastToolResults.mealSuggestions;
                      const currentMeal = meals[currentMealIndex];

                      if (!currentMeal) return null;

                      return (
                        <View style={styles.recipeCard}>
                          {/* Meal Counter */}
                          <View style={styles.recipeCounter}>
                            <Text style={styles.recipeCounterText}>
                              Meal Option {currentMealIndex + 1} of {meals.length}
                            </Text>
                          </View>

                          {/* Meal Header */}
                          <Text style={styles.recipeTitle}>{currentMeal.name}</Text>

                          {/* Macros Row */}
                          <View style={styles.macrosRow}>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentMeal.nutrition.calories}</Text>
                              <Text style={styles.macroLabel}>Calories</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentMeal.nutrition.protein}g</Text>
                              <Text style={styles.macroLabel}>Protein</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentMeal.nutrition.carbs}g</Text>
                              <Text style={styles.macroLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroItem}>
                              <Text style={styles.macroValue}>{currentMeal.nutrition.fat}g</Text>
                              <Text style={styles.macroLabel}>Fat</Text>
                            </View>
                          </View>

                          {/* Meal Details */}
                          <View style={styles.recipeDetails}>
                            <Text style={styles.recipeDetail}>⏱️ {currentMeal.prepTime}</Text>
                            {currentMeal.tags && currentMeal.tags.length > 0 && (
                              <View style={styles.tagsContainer}>
                                {currentMeal.tags.map((tag, index) => (
                                  <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>

                          {/* Ingredients */}
                          {currentMeal.ingredients && currentMeal.ingredients.length > 0 && (
                            <View style={styles.ingredientsSection}>
                              <Text style={styles.sectionTitle}>🥘 Main Ingredients:</Text>
                              <View style={styles.ingredientsList}>
                                {currentMeal.ingredients.map((ingredient, index) => (
                                  <Text key={index} style={styles.ingredientItem}>
                                    • {ingredient}
                                  </Text>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Navigation Buttons */}
                          <View style={styles.navigationButtons}>
                            <TouchableOpacity
                              style={[styles.navButton, currentMealIndex === 0 && styles.navButtonDisabled]}
                              onPress={() => setCurrentMealIndex(Math.max(0, currentMealIndex - 1))}
                              disabled={currentMealIndex === 0}
                            >
                              <Ionicons name="chevron-back" size={24} color={currentMealIndex === 0 ? Colors.textMuted : Colors.white} />
                              <Text style={[styles.navButtonText, currentMealIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.navButton, currentMealIndex === meals.length - 1 && styles.navButtonDisabled]}
                              onPress={() => setCurrentMealIndex(Math.min(meals.length - 1, currentMealIndex + 1))}
                              disabled={currentMealIndex === meals.length - 1}
                            >
                              <Text style={[styles.navButtonText, currentMealIndex === meals.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                              <Ionicons name="chevron-forward" size={24} color={currentMealIndex === meals.length - 1 ? Colors.textMuted : Colors.white} />
                            </TouchableOpacity>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.recipeButtons}>
                            <TouchableOpacity
                              style={[styles.recipeButton, styles.saveButton]}
                              onPress={() => {
                                handleSaveMealToPlan(currentMeal);
                              }}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>💾 Save to Planned Meals</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.recipeButton, styles.discardButton]}
                              onPress={() => {
                                setLastToolResults(null);
                                setCurrentMealIndex(0);
                                setLastResponse('Meal suggestions closed. Feel free to ask for more!');
                              }}
                              disabled={loadingButton !== null}
                            >
                              <Text style={styles.recipeButtonText}>❌ Close</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {/* Quick Reply Buttons - Show when AI asks a question OR for special UIs */}
                  {(isQuestion || isExerciseReorderQuestion || isReorderDirectionQuestion) && !selectedExercise && (
                    <View style={styles.quickReplyContainer}>
                      <Text style={styles.quickReplyLabel}>
                        {isDaysQuestion ? 'Days per week:' : isSaveLocationQuestion ? 'Save to:' : isMuscleGroupQuestion ? 'Focus on:' : isExerciseLogQuestion ? 'Select exercise:' : isExerciseClarificationQuestion ? 'Which exercise?' : isSetRemovalQuestion ? 'Tap a set to remove it:' : isExerciseReorderQuestion ? 'Select exercise to reorder:' : isReorderDirectionQuestion ? 'Choose direction:' : isExerciseModificationQuestion ? 'Remove exercise:' : isWorkoutRatingQuestion ? 'Rate workout:' : isRestDurationQuestion ? 'Rest duration:' : 'Quick Reply:'}
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
                        ) : isExerciseClarificationQuestion ? (
                          <>
                            {/* Exercise Clarification Buttons - Show matching exercises */}
                            {(() => {
                              // Extract matches from tool results
                              const toolWithMatches = lastToolResults?.find(tool => tool.result?.matches);
                              const matches = toolWithMatches?.result?.matches || [];
                              const originalRequest = toolWithMatches?.result?.originalRequest || '';
                              const newExercise = toolWithMatches?.result?.newExercise || '';

                              if (matches.length === 0) return null;

                              return matches.map((exerciseName, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[styles.quickReplyButton, styles.exerciseButton]}
                                  onPress={() => {
                                    // User selects specific exercise - send replace command with full name
                                    handleQuickReply(`Replace ${exerciseName} with ${newExercise}`);
                                  }}
                                  disabled={loadingButton !== null}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.quickReplyText}>🏋️ {exerciseName}</Text>
                                </TouchableOpacity>
                              ));
                            })()}
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
                      <VoiceInputButton
                        onTranscript={(text) => setReplyText(text)}
                        disabled={loadingButton !== null}
                      />
                      <View style={{flex: 1}}>
                        <SmartTextInput
                          value={replyText}
                          onChangeText={setReplyText}
                          placeholder="Type your reply..."
                          screenName={screenName}
                          screenParams={{
                            ...screenParams,
                            currentWorkoutExercises: getCurrentWorkoutExercises()
                          }}
                          multiline
                          style={styles.replyInput}
                          editable={loadingButton === null}
                          maxLength={500}
                          onFocus={scrollToReplyInput}
                        />
                      </View>
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

              {/* Custom Text Input - Revealed when user taps "Ask Coach Anything..." */}
              {showCustomInput && !lastResponse && (
                <View style={styles.customInputContainer} ref={customInputRef}>
                  <View style={styles.customInputHeader}>
                    <Text style={styles.customInputTitle}>💬 Ask your coach</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomInputText(''); // Clear input when closing
                      }}
                      style={styles.customInputCloseButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.customInputRow}>
                    <VoiceInputButton
                      onTranscript={(text) => setCustomInputText(text)}
                      disabled={loadingButton !== null}
                    />
                    <View style={{flex: 1}}>
                      <SmartTextInput
                        value={customInputText}
                        onChangeText={setCustomInputText}
                        placeholder="Ask any question you have..."
                        screenName={screenName}
                        screenParams={{
                          ...screenParams,
                          currentWorkoutExercises: getCurrentWorkoutExercises()
                        }}
                        multiline
                        autoFocus
                        style={styles.customInput}
                        editable={loadingButton === null}
                        maxLength={500}
                        onFocus={scrollToReplyInput}
                      />
                    </View>
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
                <ThinkingAnimation
                  text={typeof loadingButton === 'string' && loadingButton.length > 0 && loadingButton !== 'true'
                    ? loadingButton
                    : undefined}
                  showCoachingMessage={!(typeof loadingButton === 'string' && loadingButton.length > 0 && loadingButton !== 'true')}
                  style={styles.loadingContainer}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Recipe Source Modal */}
      <RecipeSourceModal
        visible={showRecipeSourceModal}
        onClose={() => {
          setShowRecipeSourceModal(false);
          setPendingRecipeButton(null);
        }}
        onSelectDatabase={() => {
          setShowRecipeSourceModal(false);
          // Show filter modal instead of direct search
          setShowRecipeFilterModal(true);
        }}
        onSelectAI={() => {
          setShowRecipeSourceModal(false);
          if (pendingRecipeButton) {
            handleAIRecipeGeneration(pendingRecipeButton);
          } else {
            console.error('❌ No pending recipe button - this should not happen');
            setLastResponse('❌ Something went wrong. Please try again.');
          }
          setPendingRecipeButton(null);
        }}
        recipeCount={500}
      />

      {/* Recipe Filter Modal */}
      <RecipeFilterModal
        visible={showRecipeFilterModal}
        onClose={() => {
          setShowRecipeFilterModal(false);
          setPendingRecipeButton(null);
        }}
        onSearch={(filters) => {
          handleDatabaseRecipeSearch(filters);
          setPendingRecipeButton(null);
        }}
        buttonContext={pendingRecipeButton?.text?.toLowerCase() || 'high-protein'}
      />

      {/* Recipe Preferences Modal */}
      <RecipePreferencesModal
        visible={showRecipePreferencesModal}
        onClose={() => setShowRecipePreferencesModal(false)}
      />

      {/* AI Chat Modal - For free-form conversation */}
      <AIChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        screenName={screenName}
      />

      {/* Instant Action Result Modal */}
      <Modal visible={!!instantActionResult} transparent animationType="fade">
        <View style={instantStyles.modalOverlay}>
          <View style={instantStyles.resultModal}>
            <Text style={instantStyles.resultTitle}>{instantActionResult?.title}</Text>
            <View style={instantStyles.resultContent}>
              {instantActionResult?.content}
            </View>
            {instantActionResult?.actions && instantActionResult.actions.length > 0 && (
              <View style={instantStyles.resultActions}>
                {instantActionResult.actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      instantStyles.resultActionButton,
                      action.primary && instantStyles.resultActionButtonPrimary
                    ]}
                    onPress={action.onPress}
                  >
                    <Text style={[
                      instantStyles.resultActionText,
                      action.primary && instantStyles.resultActionTextPrimary
                    ]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={instantStyles.closeButton}
              onPress={() => setInstantActionResult(null)}
            >
              <Text style={instantStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// Styles for instant action modals
const instantStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resultModal: {
    backgroundColor: Colors.cardBackground || Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  resultTitle: {
    fontSize: Typography.fontSize.xl || 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resultContent: {
    marginBottom: Spacing.md,
  },
  resultText: {
    fontSize: Typography.fontSize.md || 16,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultHighlight: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  resultSubtext: {
    fontSize: Typography.fontSize.sm || 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  resultReason: {
    fontSize: Typography.fontSize.sm || 14,
    color: Colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultTip: {
    fontSize: Typography.fontSize.sm || 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  resultActionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minWidth: 80,
  },
  resultActionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  resultActionText: {
    fontSize: Typography.fontSize.sm || 14,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultActionTextPrimary: {
    color: Colors.background || '#FFFFFF',
  },
  closeButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md || 16,
  },
  alternativeItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alternativeName: {
    fontSize: Typography.fontSize.md || 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  alternativeReason: {
    fontSize: Typography.fontSize.sm || 14,
    color: Colors.textSecondary,
  },
});

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
  responseScrollView: {
    maxHeight: 300, // Limit response height so input is always visible
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
  // Recipe Card Styles
  recipeCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '100%',
  },
  recipeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  recipeDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  recipeDetails: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  recipeDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  ingredientsSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  ingredientsList: {
    gap: Spacing.xs,
  },
  ingredientItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recipeButtons: {
    gap: Spacing.sm,
  },
  recipeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.success,
  },
  discardButton: {
    backgroundColor: Colors.error,
  },
  regenerateButton: {
    backgroundColor: Colors.primary,
  },
  recipeButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  // "Ask Coach Anything..." Button Styles
  askCoachButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  askCoachGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  askCoachButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  customInputHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
    fontStyle: 'italic',
  },
  // Recipe Navigation Styles
  recipeCounter: {
    alignSelf: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  recipeCounterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  navButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
