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
  foodPreferences: {
    cookingSkill: 'intermediate',
    dislikedIngredients: [],
    favoriteCuisines: [],
    dietaryRestrictions: [],
    // Flexible meal generation preferences (AI calculates realistic macros)
    mealPreferences: {
      // Maximum calories per meal type
      maxCaloriesPerMeal: {
        breakfast: 600,  // Max calories for breakfast
        lunch: 800,      // Max calories for lunch
        dinner: 900,     // Max calories for dinner
        snack: 300,      // Max calories for snacks
      },
      // Macro calculation strategy for AI
      macroStrategy: 'balanced', // 'balanced', 'high-protein', 'muscle-building', 'fat-loss'
    },
    // Recipe complexity and time preferences
    recipePreferences: {
      maxCookingTime: 30, // minutes (15, 30, 45, 60, 90)
      maxPrepTime: 15, // minutes (5, 10, 15, 20, 30)
      cleanupEffort: 'minimal', // 'minimal', 'moderate', 'extensive'
      recipeComplexity: 'simple', // 'simple', 'moderate', 'complex'
      servingSize: 1, // Default servings (1, 2, 4, 6)
    },
    // Example meals for AI training (user selects favorites)
    favoriteMealStyles: [],
  },
};

// Get user profile from Firebase
export const getUserProfile = async (userId) => {
  try {
    if (!userId || userId === 'guest') return DEFAULT_PROFILE;

    const firebaseProfile = await BackendService.getUserProfile(userId);

    if (firebaseProfile) {
      // Map Firebase format to local format and include ALL profile fields
      return {
        ...firebaseProfile, // Include all fields from Firebase
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
        // Explicitly include exercise preferences (in case they're at root level)
        dislikedExercises: firebaseProfile.dislikedExercises || [],
        favoriteExercises: firebaseProfile.favoriteExercises || [],
      };
    }

    // Return default profile if none exists
    return DEFAULT_PROFILE;
  } catch (error) {
    // Silently fail on permission errors (happens during hot reload before auth completes)
    if (error.code !== 'permission-denied') {
      console.error('Error loading user profile from Firebase:', error);
    }
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

    // 🔄 Invalidate workout cache (profile changed)
    import('./WorkoutCacheService').then(module => {
      const WorkoutCacheService = module.default;
      WorkoutCacheService.invalidateAndRegenerate(userId).catch(err => {
        console.warn('Failed to invalidate workout cache:', err);
      });
    });

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

// Get food preferences
export const getFoodPreferences = async (userId) => {
  try {
    if (!userId || userId === 'guest') return DEFAULT_PROFILE.foodPreferences;

    const firebaseProfile = await BackendService.getUserProfile(userId);

    if (firebaseProfile?.foodPreferences) {
      return {
        cookingSkill: firebaseProfile.foodPreferences.cookingSkill || 'intermediate',
        dislikedIngredients: firebaseProfile.foodPreferences.dislikedIngredients || [],
        favoriteCuisines: firebaseProfile.foodPreferences.favoriteCuisines || [],
        dietaryRestrictions: firebaseProfile.foodPreferences.dietaryRestrictions || [],
        mealPreferences: firebaseProfile.foodPreferences.mealPreferences || DEFAULT_PROFILE.foodPreferences.mealPreferences,
        recipePreferences: firebaseProfile.foodPreferences.recipePreferences || DEFAULT_PROFILE.foodPreferences.recipePreferences,
        favoriteMealStyles: firebaseProfile.foodPreferences.favoriteMealStyles || [],
      };
    }

    return DEFAULT_PROFILE.foodPreferences;
  } catch (error) {
    console.error('Error loading food preferences:', error);
    return DEFAULT_PROFILE.foodPreferences;
  }
};

// Update food preferences
export const updateFoodPreferences = async (userId, preferences) => {
  try {
    if (!userId || userId === 'guest') throw new Error('User ID is required');

    await BackendService.updateUserFoodPreferences(userId, preferences);

    // 🔄 Invalidate recipe cache (food preferences changed)
    import('./NutritionCacheService').then(module => {
      const NutritionCacheService = module.default;
      NutritionCacheService.invalidateAndRegenerate(userId).catch(err => {
        console.warn('Failed to invalidate recipe cache:', err);
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating food preferences:', error);
    return { success: false, error: error.message };
  }
};
