import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AICoachProvider } from './src/context/AICoachContext';
import { Colors } from './src/constants/theme';
import SyncManager from './src/services/backend/SyncManager';
import { initializeGemini } from './src/config/gemini';
import AIBadge from './src/components/AIBadge';
import ProactiveAIService from './src/services/ai/ProactiveAIService';
import { navigationRef } from './src/services/NavigationService';
import FreeRecipeService from './src/services/FreeRecipeService';
import * as QuickActions from 'expo-quick-actions';
import * as Notifications from 'expo-notifications';
import { defineBackgroundTask } from './src/services/GymReminderTask';

// Define background location task BEFORE any React components render
defineBackgroundTask();

// Import screens
import SignInScreen from './src/screens/SignInScreen';
import HomeScreen from './src/screens/HomeScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import AIScreen from './src/screens/AIScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FoodScanScreen from './src/screens/FoodScanScreen';
import MealsHistoryScreen from './src/screens/MealsHistoryScreen';
import SearchFoodScreen from './src/screens/SearchFoodScreen';
import StartWorkoutScreen from './src/screens/StartWorkoutScreen';
import MuscleGroupSelectionScreen from './src/screens/MuscleGroupSelectionScreen';
import ExerciseListScreen from './src/screens/ExerciseListScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import WorkoutSummaryScreen from './src/screens/WorkoutSummaryScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import DebugScreen from './src/screens/DebugScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProgressHubScreen from './src/screens/ProgressHubScreen';
import CameraScreen from './src/screens/CameraScreen';
import FoodScanningScreen from './src/screens/FoodScanningScreen';
import FoodScanResultScreen from './src/screens/FoodScanResultScreen';
import CreateExerciseScreen from './src/screens/CreateExerciseScreen';
import WorkoutProgramScreen from './src/screens/WorkoutProgramScreen';
import WorkoutProgramsListScreen from './src/screens/WorkoutProgramsListScreen';
import WorkoutDayEditScreen from './src/screens/WorkoutDayEditScreen';
import ProgramDaySelectionScreen from './src/screens/ProgramDaySelectionScreen';
import FoodSearchScreen from './src/screens/FoodSearchScreen';
import FoodDetailScreen from './src/screens/FoodDetailScreen';
import EnhancedFoodSearchScreen from './src/screens/EnhancedFoodSearchScreen';
import NutritionDashboard from './src/screens/NutritionDashboard';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import CalorieBreakdownScreen from './src/screens/CalorieBreakdownScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';
import EditFoodItemScreen from './src/screens/EditFoodItemScreen';
import ExerciseSettingsScreen from './src/screens/ExerciseSettingsScreen';
import FoodSettingsScreen from './src/screens/FoodSettingsScreen';
import RecipePreferencesScreen from './src/screens/RecipePreferencesScreen';
import MealPlanTemplatesScreen from './src/screens/MealPlanTemplatesScreen';
import EquipmentVariantSelectionScreen from './src/screens/EquipmentVariantSelectionScreen';
import CreateMealPlanScreen from './src/screens/CreateMealPlanScreen';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import TodayWorkoutOptionsScreen from './src/screens/TodayWorkoutOptionsScreen';
import PlanWorkoutScreen from './src/screens/PlanWorkoutScreen';
import MyPlansScreen from './src/screens/MyPlansScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import PlannedWorkoutDetailScreen from './src/screens/PlannedWorkoutDetailScreen';
import WorkoutFinalizationScreen from './src/screens/WorkoutFinalizationScreen';
import ImageViewerScreen from './src/screens/ImageViewerScreen';
import AICoachAssessmentScreen from './src/screens/AICoachAssessmentScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import EditProfileSectionScreen from './src/screens/EditProfileSectionScreen';
import Model3DWebViewScreen from './src/screens/Model3DWebViewScreen';
import GymLocationScreen from './src/screens/GymLocationScreen';
import GymMapScreen from './src/screens/GymMapScreen';

// Automated Testing (Dev only)
import AutomatedTestRunner from './src/components/AutomatedTestRunner';
import AIDebugViewer from './src/components/AIDebugViewer';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { user } = useAuth();
  const { coachName } = require('./src/context/AICoachContext').useAICoach();
  const [aiSuggestionCount, setAISuggestionCount] = useState(0);

  // Check for AI suggestions every 30 seconds
  useEffect(() => {
    const checkSuggestions = async () => {
      if (!user?.uid) return;

      try {
        const suggestions = await ProactiveAIService.getAllSuggestions(user.uid);
        setAISuggestionCount(suggestions.length);
      } catch (error) {
        console.log('Error checking AI suggestions:', error);
      }
    };

    checkSuggestions();
    const interval = setInterval(checkSuggestions, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [user?.uid]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{
          tabBarLabel: coachName,
          tabBarIcon: ({ focused }) => (
            <View>
              <Ionicons
                name="bulb"
                size={24}
                color={focused ? Colors.primary : '#8a8a8a'}
              />
              <AIBadge count={aiSuggestionCount} visible={aiSuggestionCount > 0} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={focused ? Colors.primary : '#8a8a8a'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={focused ? Colors.primary : '#8a8a8a'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isSignedIn, isLoading, user } = useAuth();
  const [recipeCacheProgress, setRecipeCacheProgress] = useState(null);

  // Initialize SyncManager and Gemini AI when app starts
  useEffect(() => {
    console.log('Initializing SyncManager...');
    SyncManager.initialize();

    // Initialize Gemini AI
    try {
      initializeGemini();
    } catch (error) {
      console.log('Gemini initialization skipped:', error.message);
    }

    // Cleanup on unmount
    return () => {
      SyncManager.cleanup();
    };
  }, []);

  // Pre-cache recipes in background (non-blocking)
  useEffect(() => {
    const preCacheRecipes = async () => {
      try {
        // Check if already cached - if so, skip the loading UI
        const isCached = await FreeRecipeService.isCached();
        if (isCached) {
          console.log('✅ Recipes already cached, skipping pre-cache');
          return;
        }

        // Start pre-caching with progress updates
        console.log('🍽️ Pre-caching recipe database...');
        setRecipeCacheProgress({ current: 0, total: 26, completed: false });

        await FreeRecipeService.preCacheRecipes((progress) => {
          if (progress.completed) {
            console.log(`✅ Recipe cache complete: ${progress.count} recipes`);
            // Keep the loading message for 1 second before hiding
            setTimeout(() => {
              setRecipeCacheProgress(null);
            }, 1000);
          } else {
            setRecipeCacheProgress({
              current: progress.current,
              total: progress.total,
              letter: progress.letter,
              completed: false,
            });
          }
        });
      } catch (error) {
        console.error('❌ Recipe pre-cache failed:', error);
        setRecipeCacheProgress(null);
      }
    };

    // Start pre-caching immediately to ensure cache is ready when user needs it
    preCacheRecipes();
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, syncing...');
        // Sync when app comes to foreground
        if (user?.uid) {
          try {
            await SyncManager.checkNetworkStatus();
            await SyncManager.syncPendingOperations();
          } catch (error) {
            console.log('Background sync error:', error);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Handle gym reminder notification taps
  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);

        if (data?.type === 'gym_reminder' && data?.action === 'start_workout') {
          // Navigate to start workout screen
          if (navigationRef.current) {
            navigationRef.current.navigate('StartWorkout');
          }
        }
      }
    );

    return () => {
      notificationSubscription.remove();
    };
  }, []);

  // Handle quick actions (3D Touch / long-press app icon shortcuts)
  useEffect(() => {
    // Set up quick actions
    QuickActions.setItems([
      {
        id: 'scan_food',
        title: 'Scan Food',
        subtitle: 'Quick barcode scan',
        icon: 'symbol:camera.fill',
        params: { action: 'scan_food' }
      },
      {
        id: 'log_workout',
        title: 'Log Workout',
        subtitle: 'Start tracking',
        icon: 'symbol:figure.strengthtraining.traditional',
        params: { action: 'log_workout' }
      }
    ]);

    // Listen for quick action events
    const subscription = QuickActions.addListener((action) => {
      console.log('Quick action triggered:', action);

      if (!navigationRef.current) {
        console.warn('Navigation ref not ready');
        return;
      }

      // Handle the action
      if (action.params?.action === 'scan_food') {
        // Navigate to barcode scanner
        navigationRef.current.navigate('Camera', {
          returnScreen: 'FoodScanning'
        });
      } else if (action.params?.action === 'log_workout') {
        // Navigate to start workout
        navigationRef.current.navigate('StartWorkout');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {/* Recipe cache progress indicator (only shown during first-time cache) */}
      {recipeCacheProgress && !recipeCacheProgress.completed && (
        <View style={styles.recipeCacheOverlay}>
          <View style={styles.recipeCacheContainer}>
            <Text style={styles.recipeCacheTitle}>📚 Loading Recipe Database</Text>
            <Text style={styles.recipeCacheText}>
              Fetching recipes: {recipeCacheProgress.letter || '...'}
              ({recipeCacheProgress.current}/{recipeCacheProgress.total})
            </Text>
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 10 }} />
            <Text style={styles.recipeCacheHint}>This only happens once!</Text>
          </View>
        </View>
      )}
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.background }
          }}
        >
          {!isSignedIn ? (
            <Stack.Screen name="SignIn" component={SignInScreen} />
          ) : (
            <>
              <Stack.Screen
                name="Main"
                component={TabNavigator}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="Nutrition" component={NutritionScreen} />
              <Stack.Screen name="NutritionDashboard" component={NutritionDashboard} />
            <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
            <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
            <Stack.Screen name="FoodScanning" component={FoodScanningScreen} />
            <Stack.Screen name="Recipes" component={RecipesScreen} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
            <Stack.Screen name="RecipePreferences" component={RecipePreferencesScreen} />
            <Stack.Screen name="CalorieBreakdown" component={CalorieBreakdownScreen} />
            <Stack.Screen name="EditRecipe" component={EditRecipeScreen} />
            <Stack.Screen name="EditFoodItem" component={EditFoodItemScreen} />
            <Stack.Screen name="MealPlanTemplates" component={MealPlanTemplatesScreen} />
            <Stack.Screen name="CreateMealPlan" component={CreateMealPlanScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="FoodScan" component={FoodScanScreen} />
            <Stack.Screen name="FoodScanResult" component={FoodScanResultScreen} />
            <Stack.Screen name="MealsHistory" component={MealsHistoryScreen} />
            <Stack.Screen name="SearchFood" component={SearchFoodScreen} />
            <Stack.Screen name="StartWorkout" component={StartWorkoutScreen} />
            <Stack.Screen name="WorkoutProgram" component={WorkoutProgramScreen} />
            <Stack.Screen name="WorkoutProgramsList" component={WorkoutProgramsListScreen} />
            <Stack.Screen name="ProgramDaySelection" component={ProgramDaySelectionScreen} />
            <Stack.Screen name="WorkoutDayEdit" component={WorkoutDayEditScreen} />
            <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} />
            <Stack.Screen name="MuscleGroupSelection" component={Model3DWebViewScreen} />
            <Stack.Screen name="MuscleGroupSelectionClassic" component={MuscleGroupSelectionScreen} />
            <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
            <Stack.Screen name="EquipmentVariantSelection" component={EquipmentVariantSelectionScreen} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="Workout" component={WorkoutScreen} />
            <Stack.Screen name="WorkoutFinalization" component={WorkoutFinalizationScreen} />
            <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
            <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
            <Stack.Screen name="Training" component={TrainingScreen} />
            <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
            <Stack.Screen name="TodayWorkoutOptions" component={TodayWorkoutOptionsScreen} />
            <Stack.Screen name="PlanWorkout" component={PlanWorkoutScreen} />
            <Stack.Screen name="MyPlans" component={MyPlansScreen} />
            <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
            <Stack.Screen name="PlannedWorkoutDetail" component={PlannedWorkoutDetailScreen} />
            <Stack.Screen
              name="ImageViewer"
              component={ImageViewerScreen}
              options={{
                animationEnabled: false,
                headerShown: false
              }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ExerciseSettings" component={ExerciseSettingsScreen} />
            <Stack.Screen name="FoodSettings" component={FoodSettingsScreen} />
            <Stack.Screen name="GymLocation" component={GymLocationScreen} />
            <Stack.Screen name="GymMap" component={GymMapScreen} />
            <Stack.Screen name="ProgressHub" component={ProgressHubScreen} />
            <Stack.Screen name="Progress" component={ProgressScreen} />
            <Stack.Screen name="Debug" component={DebugScreen} />
            <Stack.Screen name="Model3DWebView" component={Model3DWebViewScreen} />
            <Stack.Screen name="AICoachAssessment" component={AICoachAssessmentScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="EditProfileSection" component={EditProfileSectionScreen} />

            {/* Automated Testing & Debugging (Dev Only) */}
            {__DEV__ && (
              <>
                <Stack.Screen
                  name="TestRunner"
                  component={AutomatedTestRunner}
                  options={{ headerShown: true, title: '🧪 AI Stress Test' }}
                />
                <Stack.Screen
                  name="DebugConsole"
                  component={AIDebugViewer}
                  options={{ headerShown: true, title: '🐛 Debug Console' }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AICoachProvider>
            <WorkoutProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </WorkoutProvider>
          </AICoachProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  recipeCacheOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  recipeCacheContainer: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recipeCacheTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  recipeCacheText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recipeCacheHint: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 12,
    fontStyle: 'italic',
  },
});