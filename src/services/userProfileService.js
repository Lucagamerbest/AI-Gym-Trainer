// User Profile Service - Stores user-specific settings and goals
import AsyncStorage from '@react-native-async-storage/async-storage';

const getUserProfileKey = (userId) => `@user_profile_${userId}`;

// Default profile
const DEFAULT_PROFILE = {
  nutritionGoals: {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  },
  workoutGoals: {
    weeklyWorkouts: 3,
    weeklyMinutes: 150,
  },
  preferences: {
    units: 'metric', // metric or imperial
  },
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    if (!userId) return DEFAULT_PROFILE;

    const profileKey = getUserProfileKey(userId);
    const profileData = await AsyncStorage.getItem(profileKey);

    if (profileData) {
      return JSON.parse(profileData);
    }

    // Return default profile if none exists
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return DEFAULT_PROFILE;
  }
};

// Save user profile
export const saveUserProfile = async (userId, profile) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const profileKey = getUserProfileKey(userId);
    await AsyncStorage.setItem(profileKey, JSON.stringify(profile));
    return { success: true };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

// Update nutrition goals only
export const updateNutritionGoals = async (userId, goals) => {
  try {
    const profile = await getUserProfile(userId);
    profile.nutritionGoals = { ...profile.nutritionGoals, ...goals };
    return await saveUserProfile(userId, profile);
  } catch (error) {
    console.error('Error updating nutrition goals:', error);
    return { success: false, error: error.message };
  }
};

// Update workout goals only
export const updateWorkoutGoals = async (userId, goals) => {
  try {
    const profile = await getUserProfile(userId);
    profile.workoutGoals = { ...profile.workoutGoals, ...goals };
    return await saveUserProfile(userId, profile);
  } catch (error) {
    console.error('Error updating workout goals:', error);
    return { success: false, error: error.message };
  }
};

// Get nutrition goals
export const getNutritionGoals = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    return profile.nutritionGoals;
  } catch (error) {
    console.error('Error loading nutrition goals:', error);
    return DEFAULT_PROFILE.nutritionGoals;
  }
};

// Get workout goals
export const getWorkoutGoals = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    return profile.workoutGoals;
  } catch (error) {
    console.error('Error loading workout goals:', error);
    return DEFAULT_PROFILE.workoutGoals;
  }
};
