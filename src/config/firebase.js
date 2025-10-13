// Firebase Configuration
// This file initializes Firebase for the AI Gym Trainer app

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');

  // Initialize Firestore (database)
  db = getFirestore(app);
  console.log('✅ Firestore connected');

  // Initialize Authentication
  auth = getAuth(app);
  console.log('✅ Firebase Auth connected');

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Check your .env.local file has correct Firebase credentials');
}

// Export for use in other files
export { app, db, auth };
export default app;
