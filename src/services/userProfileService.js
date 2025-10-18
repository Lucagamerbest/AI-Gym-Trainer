// User Profile Service - Stores user-specific settings and goals
import BackendService from './backend/BackendService';

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

// Get user profile from Firebase
export const getUserProfile = async (userId) => {
  try {
    if (!userId || userId === 'guest') return DEFAULT_PROFILE;

    const firebaseProfile = await BackendService.getUserProfile(userId);

    if (firebaseProfile) {
      // Map Firebase format to local format
      return {
        nutritionGoals: {
          calories: firebaseProfile.goals?.targetCalories || firebaseProfile.goals?.calories || 2000,
          protein: firebaseProfile.goals?.proteinGrams || firebaseProfile.goals?.protein || 150,
          carbs: firebaseProfile.goals?.carbsGrams || firebaseProfile.goals?.carbs || 250,
          fat: firebaseProfile.goals?.fatGrams || firebaseProfile.goals?.fat || 65,
        },
        workoutGoals: {
          weeklyWorkouts: firebaseProfile.workoutGoals?.weeklyWorkouts || 3,
          weeklyMinutes: firebaseProfile.workoutGoals?.weeklyMinutes || 150,
        },
        preferences: {
          units: firebaseProfile.settings?.units || 'metric',
        },
      };
    }

    // Return default profile if none exists
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error loading user profile from Firebase:', error);
    return DEFAULT_PROFILE;
  }
};

// Save user profile to Firebase
export const saveUserProfile = async (userId, profile) => {
  try {
    if (!userId || userId === 'guest') throw new Error('User ID is required');

    // Map local format to Firebase format and update goals
    const firebaseGoals = {
      targetCalories: profile.nutritionGoals?.calories || 2000,
      proteinGrams: profile.nutritionGoals?.protein || 150,
      carbsGrams: profile.nutritionGoals?.carbs || 250,
      fatGrams: profile.nutritionGoals?.fat || 65,
    };

    await BackendService.updateUserGoals(userId, firebaseGoals);

    // Update settings if preferences changed
    if (profile.preferences) {
      await BackendService.updateUserSettings(userId, {
        units: profile.preferences.units || 'metric',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving user profile to Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Update nutrition goals only
export const updateNutritionGoals = async (userId, goals) => {
  try {
    if (!userId || userId === 'guest') throw new Error('User ID is required');

    // Map local format to Firebase format
    const firebaseGoals = {
      targetCalories: goals.calories,
      proteinGrams: goals.protein,
      carbsGrams: goals.carbs,
      fatGrams: goals.fat,
    };

    await BackendService.updateUserGoals(userId, firebaseGoals);
    console.log('✅ Nutrition goals updated in Firebase');
    return { success: true };
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
