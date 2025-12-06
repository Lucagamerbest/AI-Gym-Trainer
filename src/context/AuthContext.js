import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import BackendService from '../services/backend/BackendService';
import WorkoutSyncService from '../services/backend/WorkoutSyncService';
import MealSyncService from '../services/backend/MealSyncService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
        };

        setUser(userData);

        // Create or update user profile in Firestore
        try {
          await BackendService.createOrUpdateUserProfile(firebaseUser);
        } catch (error) {
        }

        // Download cloud workouts to local storage (restores data after reinstall)
        try {
          const workouts = await WorkoutSyncService.downloadCloudWorkouts(firebaseUser.uid);
        } catch (error) {
        }

        // Upload any local workouts that haven't been synced to Firebase yet
        try {
          const syncResult = await WorkoutSyncService.syncLocalWorkouts(firebaseUser.uid);
        } catch (error) {
        }

        // Download cloud meals to local storage (restores food log after reinstall)
        try {
          const meals = await MealSyncService.downloadCloudMeals(firebaseUser.uid);
        } catch (error) {
        }

        // Upload any local meals that haven't been synced to Firebase yet
        try {
          const mealSyncResult = await MealSyncService.syncLocalMeals(firebaseUser.uid);
        } catch (error) {
        }
      } else {
        // User is signed out
        setUser(null);
      }

      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with Google using Firebase Auth
   * @param {object} googleCredential - Google credential with idToken
   */
  const signInWithGoogle = async (googleCredential) => {
    try {
      const credential = GoogleAuthProvider.credential(googleCredential.idToken);
      const result = await signInWithCredential(auth, credential);

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   */
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Create account with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   */
  const createAccountWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && result.user) {
        // Update Firebase Auth profile with display name
        await updateProfile(result.user, {
          displayName: displayName,
        });

        // Reload the user to get fresh data with the updated displayName
        await result.user.reload();

        // Get the fresh user object
        const updatedUser = auth.currentUser;

        // Manually update the user state with the correct displayName
        // This ensures the UI shows the correct name immediately
        const userData = {
          uid: updatedUser.uid,
          email: updatedUser.email,
          displayName: displayName, // Use the provided displayName directly
          photoURL: updatedUser.photoURL,
          provider: updatedUser.providerData[0]?.providerId || 'email',
        };
        setUser(userData);

        // Also sync to Firestore with the updated user data
        await BackendService.createOrUpdateUserProfile(updatedUser);
      }

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Legacy sign-in method (for backward compatibility with guest/test accounts)
   * Use signInWithGoogle or signInWithEmail for production
   */
  const signIn = async (userData) => {
    try {
      // For guest accounts or development
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Clear ONLY user session data (not workouts or other data)
      // DO NOT use AsyncStorage.clear() - it deletes workouts!
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('authState');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isSignedIn: !!user,
    signIn, // Legacy method
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}