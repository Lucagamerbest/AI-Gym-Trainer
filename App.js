import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { Colors } from './src/constants/theme';

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
import CalorieBreakdownScreen from './src/screens/CalorieBreakdownScreen';
import EditRecipeScreen from './src/screens/EditRecipeScreen';
import EditFoodItemScreen from './src/screens/EditFoodItemScreen';
import ExerciseSettingsScreen from './src/screens/ExerciseSettingsScreen';
import FoodSettingsScreen from './src/screens/FoodSettingsScreen';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
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
        tabBarInactiveTintColor: Colors.primary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="AI"
        component={AIScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color: Colors.primary }}>🤖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color: Colors.primary }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color: Colors.primary }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="MuscleGroupSelection" component={MuscleGroupSelectionScreen} />
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
            <Stack.Screen name="ProgressHub" component={ProgressHubScreen} />
            <Stack.Screen name="Progress" component={ProgressScreen} />
            <Stack.Screen name="Debug" component={DebugScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkoutProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </WorkoutProvider>
      </AuthProvider>
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
});