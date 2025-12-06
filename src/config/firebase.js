// Firebase Configuration
// This file initializes Firebase for the AI Gym Trainer app

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import environment variables
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

// Initialize Firebase
let app;
let db;
let auth;
let storage;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Firestore (database)
  db = getFirestore(app);

  // Initialize Storage (for food database files)
  storage = getStorage(app);

  // Initialize Authentication with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

} catch (error) {
  // Silent fail - Firebase initialization errors will surface in actual usage
}

// Export for use in other files
export { app, db, auth, storage };
export default app;
