/**
 * User Profile Assessment Service
 * Stores comprehensive user information for personalized AI coaching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const USER_PROFILE_KEY = '@user_profile_assessment';

/**
 * User Profile Schema
 *
 * This stores everything the AI coach needs to know about the user
 * to provide personalized, effective coaching advice
 */
export const DEFAULT_USER_PROFILE = {
  // Assessment completion
  assessmentCompleted: false,
  assessmentDate: null,
  lastUpdated: null,

  // Basic Info
  age: null,
  gender: null, // 'male', 'female', 'other', 'prefer-not-to-say'
  height: null, // in cm or inches based on units
  currentWeight: null, // in kg or lbs based on units

  // Experience & Background
  experienceLevel: null, // 'beginner', 'intermediate', 'advanced', 'elite'
  yearsTraining: null, // number of years
  sportsBackground: [], // array of sports: 'football', 'basketball', 'running', etc.
  trainingHistory: '', // free text: previous programs, coaches, etc.

  // Current Fitness Level
  strengthBenchmarks: {
    // Weight in kg/lbs, reps, or '1RM' estimate
    benchPress: null,
    squat: null,
    deadlift: null,
    overheadPress: null,
    pullUps: null, // max reps
  },
  cardioLevel: null, // 'poor', 'fair', 'good', 'excellent'
  flexibilityLevel: null, // 'poor', 'fair', 'good', 'excellent'

  // Injuries & Limitations
  injuries: [], // array of {injury: string, date: string, severity: 'minor'|'moderate'|'severe', recovered: boolean}
  currentPain: [], // array of {area: string, severity: 1-10, notes: string}
  mobilityIssues: [], // array of strings: 'tight hips', 'shoulder impingement', etc.
  medicalConditions: [], // array of strings: 'asthma', 'high blood pressure', etc.

  // Training Preferences
  workoutStyle: null, // 'powerlifting', 'bodybuilding', 'crossfit', 'general-fitness', 'athletic'
  preferredRepRange: null, // 'low' (1-5), 'medium' (6-12), 'high' (12+), 'varied'
  equipmentAccess: [], // array: 'barbell', 'dumbbells', 'machines', 'cables', 'bodyweight', 'bands'
  gymEnvironment: null, // 'commercial-gym', 'home-gym', 'crossfit-box', 'outdoor', 'minimal-equipment'

  // Schedule & Availability
  availableDays: [], // array: 'monday', 'tuesday', etc.
  sessionDuration: null, // number in minutes: 30, 45, 60, 90
  preferredWorkoutTime: null, // 'morning', 'afternoon', 'evening', 'flexible'

  // Goals & Motivation
  primaryGoal: [], // array: 'bulk', 'cut', 'strength', 'powerlifting', 'athletic', 'fitness', 'recomp'
  secondaryGoals: [], // array of goals (deprecated - now using primaryGoal as array)
  specificGoals: [], // array of strings: 'bench 315 lbs', 'visible abs', 'run 5k', etc.
  motivationLevel: null, // 1-10 scale
  motivationFactors: [], // array: 'health', 'appearance', 'performance', 'competition', 'social'

  // Coaching Preferences
  coachingStyle: null, // 'motivational', 'analytical', 'balanced', 'tough-love'
  responseVerbosity: null, // 'concise', 'moderate', 'detailed'
  feedbackPreference: null, // 'gentle', 'direct', 'mixed'
  celebratePRs: true, // boolean

  // Exercise Preferences
  favoriteExercises: '', // comma-separated string, converted to array on save
  dislikedExercises: '', // comma-separated string, converted to array on save
  exercisesToAvoid: [], // array of {exercise: string, reason: string}

  // Nutrition & Lifestyle
  dietaryRestrictions: [], // array: 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', etc.
  mealsPerDay: null, // number: 2, 3, 4, 5, 6
  cookingSkill: null, // 'beginner', 'intermediate', 'advanced'
  supplementsUsed: [], // array: 'protein', 'creatine', 'pre-workout', etc.
  sleepQuality: null, // 'poor', 'fair', 'good', 'excellent'
  averageSleepHours: null, // number: 5, 6, 7, 8, 9+
  stressLevel: null, // 'low', 'moderate', 'high'
  occupation: null, // 'sedentary', 'active', 'physical-labor'

  // AI Coaching Notes (built over time)
  coachingNotes: [], // array of {date: string, note: string, category: string}
  userFeedback: [], // array of {date: string, feedback: string, context: string}
  progressInsights: [], // array of {date: string, insight: string}
};

/**
 * Save user profile to AsyncStorage and Firebase
 */
export const saveUserProfile = async (profile) => {
  try {
    const updatedProfile = {
      ...profile,
      lastUpdated: new Date().toISOString(),
    };

    // Save to AsyncStorage (local)
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

    // Save to Firebase (cloud backup) if user is authenticated
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      await setDoc(userProfileRef, updatedProfile, { merge: true });
    }

    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load user profile from AsyncStorage (or Firebase if not found locally)
 */
export const loadUserProfile = async () => {
  try {
    // Try AsyncStorage first (faster)
    const localProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);

    if (localProfile) {
      return JSON.parse(localProfile);
    }

    // If not found locally, try Firebase
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const docSnap = await getDoc(userProfileRef);

      if (docSnap.exists()) {
        const firebaseProfile = docSnap.data();
        // Save to AsyncStorage for next time
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(firebaseProfile));
        return firebaseProfile;
      }
    }

    // If nothing found, return default profile
    return DEFAULT_USER_PROFILE;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return DEFAULT_USER_PROFILE;
  }
};

/**
 * Update specific fields in the user profile
 */
export const updateUserProfile = async (updates) => {
  try {
    const currentProfile = await loadUserProfile();
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    return await saveUserProfile(updatedProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark assessment as completed
 */
export const completeAssessment = async (assessmentData) => {
  try {
    const updatedProfile = {
      ...assessmentData,
      assessmentCompleted: true,
      assessmentDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    return await saveUserProfile(updatedProfile);
  } catch (error) {
    console.error('Error completing assessment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add a coaching note (for AI to remember important insights)
 */
export const addCoachingNote = async (note, category = 'general') => {
  try {
    const currentProfile = await loadUserProfile();
    const newNote = {
      date: new Date().toISOString(),
      note,
      category, // e.g., 'exercise-preference', 'injury', 'progress', 'feedback'
    };

    const updatedCoachingNotes = [...(currentProfile.coachingNotes || []), newNote];

    return await updateUserProfile({
      coachingNotes: updatedCoachingNotes,
    });
  } catch (error) {
    console.error('Error adding coaching note:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add user feedback (for AI to learn from)
 */
export const addUserFeedback = async (feedback, context = '') => {
  try {
    const currentProfile = await loadUserProfile();
    const newFeedback = {
      date: new Date().toISOString(),
      feedback,
      context, // e.g., 'workout-too-hard', 'loved-this-exercise', 'weight-too-heavy'
    };

    const updatedFeedback = [...(currentProfile.userFeedback || []), newFeedback];

    return await updateUserProfile({
      userFeedback: updatedFeedback,
    });
  } catch (error) {
    console.error('Error adding user feedback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has completed assessment
 */
export const hasCompletedAssessment = async () => {
  try {
    const profile = await loadUserProfile();
    return profile.assessmentCompleted === true;
  } catch (error) {
    console.error('Error checking assessment status:', error);
    return false;
  }
};

/**
 * Get a summary of the user profile for AI context
 */
export const getUserProfileSummary = async () => {
  try {
    const profile = await loadUserProfile();

    if (!profile.assessmentCompleted) {
      return null;
    }

    // Build a concise summary for AI context
    const summary = {
      // RAW DATA for AI tool use (macro calculators, etc.)
      age: profile.age,
      gender: profile.gender,
      currentWeight: profile.currentWeight,
      height: profile.height,
      experienceLevel: profile.experienceLevel,
      primaryGoal: profile.primaryGoal,
      occupation: profile.occupation,
      equipmentAccess: profile.equipmentAccess,

      // FORMATTED DATA for AI understanding
      experience: `${profile.experienceLevel || 'unknown'} (${profile.yearsTraining || 0} years)`,
      goals: {
        primary: profile.primaryGoal,
        specific: profile.specificGoals?.slice(0, 3) || [], // top 3
      },
      limitations: {
        injuries: profile.injuries?.filter(i => !i.recovered).map(i => i.injury) || [],
        pain: profile.currentPain?.map(p => p.area) || [],
        mobility: profile.mobilityIssues || [],
      },
      preferences: {
        workoutStyle: profile.workoutStyle,
        repRange: profile.preferredRepRange,
        coachingStyle: profile.coachingStyle,
        responseVerbosity: profile.responseVerbosity,
      },
      schedule: {
        daysPerWeek: profile.availableDays?.length || 0,
        sessionLength: profile.sessionDuration,
        preferredTime: profile.preferredWorkoutTime,
      },
      exercisePreferences: {
        favorites: profile.favoriteExercises || [],
        disliked: profile.dislikedExercises || [],
        avoid: profile.exercisesToAvoid?.map(e => e.exercise) || [],
      },
      lifestyle: {
        sleep: `${profile.averageSleepHours || 'unknown'} hours, ${profile.sleepQuality || 'unknown'} quality`,
        stress: profile.stressLevel,
        occupation: profile.occupation,
      },
      recentNotes: profile.coachingNotes?.slice(-5) || [], // last 5 notes
    };

    return summary;
  } catch (error) {
    console.error('Error getting user profile summary:', error);
    return null;
  }
};

/**
 * Update a specific section of the user profile
 * @param {string} section - The section to update ('experience', 'goals', 'training', etc.)
 * @param {object} data - The data to update in that section
 */
export const updateProfileSection = async (section, data) => {
  try {
    // Load current profile
    const currentProfile = await loadUserProfile();

    if (!currentProfile || !currentProfile.assessmentCompleted) {
      return { success: false, error: 'No profile found. Complete assessment first.' };
    }

    // Merge the new data into the current profile
    const updatedProfile = {
      ...currentProfile,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    // Save to local storage
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

    // Save to Firebase
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      await setDoc(userProfileRef, updatedProfile, { merge: true });
    }

    console.log(`✅ Profile section '${section}' updated successfully`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating profile section '${section}':`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear user profile (for testing or reset)
 */
export const clearUserProfile = async () => {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_KEY);

    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      await setDoc(userProfileRef, DEFAULT_USER_PROFILE);
    }

    return { success: true };
  } catch (error) {
    console.error('Error clearing user profile:', error);
    return { success: false, error: error.message };
  }
};
