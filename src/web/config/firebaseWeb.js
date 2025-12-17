// Firebase Configuration for Web
// This file initializes Firebase for the web landing page

import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

// Import environment variables (same as mobile config)
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Initialize Firebase (only once)
let app = null;
let db = null;
let auth = null;
let googleProvider = null;

// Only initialize on web
if (Platform.OS === 'web') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app);
    auth = getAuth(app);

    // Google Auth Provider
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Auth functions for web
export const webAuth = {
  // Get current user
  getCurrentUser: () => auth?.currentUser,

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },

  // Sign in with email and password
  signInWithEmail: async (email, password) => {
    if (!auth) return { success: false, error: 'Auth not initialized' };

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      }
      return { success: false, error: message };
    }
  },

  // Create account with email and password
  createAccountWithEmail: async (email, password, displayName) => {
    if (!auth) return { success: false, error: 'Auth not initialized' };

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      return { success: true, user: result.user };
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      return { success: false, error: message };
    }
  },

  // Sign in with Google (popup)
  signInWithGoogle: async () => {
    if (!auth || !googleProvider) return { success: false, error: 'Auth not initialized' };

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup was blocked. Please allow popups for this site';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled';
      }
      return { success: false, error: message };
    }
  },

  // Sign out
  signOut: async () => {
    if (!auth) return { success: false, error: 'Auth not initialized' };

    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export { app, db, auth };
export default app;
