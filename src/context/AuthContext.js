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
} from 'firebase/auth';
import BackendService from '../services/backend/BackendService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    console.log('🔐 Setting up Firebase Auth listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');

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
          console.log('✅ User profile synced to Firestore');
        } catch (error) {
          console.error('❌ Error syncing user profile:', error);
        }
      } else {
        // User is signed out
        setUser(null);
      }

      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔐 Cleaning up Firebase Auth listener');
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with Google using Firebase Auth
   * @param {object} googleCredential - Google credential with idToken
   */
  const signInWithGoogle = async (googleCredential) => {
    try {
      console.log('🔐 Signing in with Google...');

      const credential = GoogleAuthProvider.credential(googleCredential.idToken);
      const result = await signInWithCredential(auth, credential);

      console.log('✅ Google sign-in successful');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
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
      console.log('🔐 Signing in with email...');

      const result = await signInWithEmailAndPassword(auth, email, password);

      console.log('✅ Email sign-in successful');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Email sign-in error:', error);
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
      console.log('🔐 Creating account with email...');

      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && result.user) {
        result.user.displayName = displayName;
        await BackendService.createOrUpdateUserProfile({
          ...result.user,
          displayName: displayName,
        });
      }

      console.log('✅ Account created successfully');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Account creation error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Legacy sign-in method (for backward compatibility with guest/test accounts)
   * Use signInWithGoogle or signInWithEmail for production
   */
  const signIn = async (userData) => {
    try {
      console.log('⚠️ Using legacy signIn (not Firebase Auth)');

      // For guest accounts or development
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('❌ Legacy sign-in error:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      console.log('🔐 Signing out...');

      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Clear local cache
      await AsyncStorage.clear();

      console.log('✅ Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
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