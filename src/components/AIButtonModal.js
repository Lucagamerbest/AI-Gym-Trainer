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
import { getAISectionsForScreen, hasAISections } from '../config/aiSectionConfig';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import { getRecentFoods } from '../services/foodDatabase';
import MacroStatsCard from './MacroStatsCard';
import FreeRecipeService from '../services/FreeRecipeService';
import { getRecipePreferences } from '../services/recipePreferencesService';

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

  // Recipe source modal state
  const [showRecipeSourceModal, setShowRecipeSourceModal] = useState(false);
  const [showRecipeFilterModal, setShowRecipeFilterModal] = useState(false);
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
      console.log('💾 Attempting to save recipe:', recipe.title, 'ID:', recipe.id);

      // Save to AsyncStorage
      const existingRecipes = await AsyncStorage.getItem('@saved_recipes');
      const recipes = existingRecipes ? JSON.parse(existingRecipes) : [];
      console.log('💾 Existing recipes count:', recipes.length);

      // Check if recipe already exists
      if (!recipes.find(r => r.id === recipe.id)) {
        recipes.push(recipe);
        await AsyncStorage.setItem('@saved_recipes', JSON.stringify(recipes));
        console.log('✅ Recipe saved successfully! New count:', recipes.length);
      } else {
        console.log('⚠️ Recipe already exists, skipping save');
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
      console.log('💾 Attempting to save meal to planned meals:', meal.name);

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
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    // Handle dynamic text (function that returns text based on time)
    const buttonText = button.isDynamic && typeof button.text === 'function'
      ? button.text()
      : button.text;

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

      console.log(`📥 [AIButtonModal] Received result:`, {
        hasResponse: !!result.response,
        responseLength: result.response?.length,
        responsePreview: result.response?.substring(0, 100),
        keys: Object.keys(result),
        hasToolResults: !!result.toolResults,
        toolResultsKeys: result.toolResults ? Object.keys(result.toolResults) : null,
        hasMealSuggestions: !!result.toolResults?.mealSuggestions,
        mealSuggestionsCount: result.toolResults?.mealSuggestions?.length,
        source: result.toolResults?.source
      });

      // Debug: Log meal macros if available
      if (result.toolResults?.mealSuggestions?.length > 0) {
        result.toolResults.mealSuggestions.forEach((meal, index) => {
          console.log(`🔍 [MEAL DEBUG ${index + 1}] Name: ${meal.name}`);
          console.log(`🔍 [MEAL DEBUG ${index + 1}] Calories: ${meal.calories}`);
          console.log(`🔍 [MEAL DEBUG ${index + 1}] Protein: ${meal.protein}g`);
          console.log(`🔍 [MEAL DEBUG ${index + 1}] Carbs: ${meal.carbs}g`);
          console.log(`🔍 [MEAL DEBUG ${index + 1}] Fat: ${meal.fat}g`);
        });
      }

      // Store response and tool results
      setLastResponse(result.response);
      setLastToolResults(result.toolResults || null);

      console.log('🔍 [AIButtonModal] lastToolResults set to:', result.toolResults);

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
                  showSettingsButton={section.hasSettings}
                  onSettingsPress={() => setShowRecipePreferencesModal(true)}
                />
              ))}

              {/* "Ask Coach Anything..." Button - Global Text Input Toggle */}
              {!lastResponse && !showCustomInput && loadingButton === null && (
                <TouchableOpacity
                  style={styles.askCoachButton}
                  onPress={() => setShowCustomInput(true)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.askCoachGradient}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                    <Text style={styles.askCoachButtonText}>Ask Coach Anything...</Text>
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
                      <Text style={styles.responseText}>{lastResponse}</Text>
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
                    <View style={{flex: 1}}>
                      <SmartTextInput
                        value={customInputText}
                        onChangeText={setCustomInputText}
                        placeholder="Ask any question you have..."
                        screenName={screenName}
                        screenParams={screenParams}
                        multiline
                        autoFocus
                        style={styles.customInput}
                        editable={loadingButton === null}
                        maxLength={500}
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
