# AI Gym Trainer - Master Implementation Plan
## 2-Month Development Roadmap (20+ Phases)

**Project Goal**: Build a context-aware AI coaching system with cloud backend for the AI Gym Trainer app

**Duration**: 8-10 weeks (2+ months)
**Current State**: Frontend complete, no backend, no AI implementation
**End State**: Production-ready app with intelligent AI coaching across all screens

---

## 📋 PROJECT OVERVIEW

### What We're Building
1. **Backend Infrastructure**: Cloud database, API endpoints, user authentication
2. **AI Agent System**: Context-aware AI that adapts to user's current screen/activity
3. **Frontend Polish**: Fix minor UI issues and integrate with backend
4. **Cloud Sync**: Seamless data synchronization across devices

### Technology Stack Decisions

#### Backend Options (Choose ONE in Phase 1):
- **Option A - Firebase** (Recommended for MVP)
  - Pros: Fast setup, built-in auth, real-time sync, free tier
  - Cons: Vendor lock-in, limited complex queries
  - Best for: Quick launch, mobile-first apps

- **Option B - Supabase** (Recommended for Production)
  - Pros: Open source, PostgreSQL, better queries, auth built-in
  - Cons: Slightly more setup than Firebase
  - Best for: Scalable production apps

- **Option C - Custom Node.js + PostgreSQL**
  - Pros: Full control, no vendor lock-in
  - Cons: More setup, need to manage infrastructure
  - Best for: Long-term custom needs

#### AI Provider (Choose ONE in Phase 1):
- **Option A - Anthropic Claude** (Recommended)
  - Pros: Best at context-aware responses, safety, reasoning
  - Cons: API costs
  - Cost: ~$3-15 per 1M tokens (Claude 3.5 Sonnet)

- **Option B - OpenAI GPT-4**
  - Pros: Well-documented, popular
  - Cons: More expensive, less nuanced
  - Cost: ~$5-15 per 1M tokens

---

## 🎯 PHASE 1: DECISION & SETUP (Week 1, Days 1-2)

### Objectives
- Choose technology stack
- Set up development environment
- Create project documentation structure

### Step-by-Step Instructions

#### Step 1.1: Technology Stack Decision (30 minutes)
1. Read the backend options above
2. Decision factors:
   - Choose **Firebase** if: You want fastest launch, less backend experience
   - Choose **Supabase** if: You want production-ready, SQL knowledge
   - Choose **Custom** if: You need full control, have DevOps experience
3. Decision factors for AI:
   - Choose **Claude** if: You want best coaching quality
   - Choose **OpenAI** if: You have existing OpenAI experience
4. **Write your decision in a new file**: `TECH_STACK_DECISION.md`

#### Step 1.2: Sign Up for Services (30 minutes)
1. Create Firebase/Supabase account:
   - Firebase: https://console.firebase.google.com/
   - Supabase: https://supabase.com/dashboard
2. Create new project named "ai-gym-trainer"
3. Save project credentials in `.env.local` (DO NOT COMMIT)
4. Create Claude AI account:
   - Go to https://console.anthropic.com/
   - Get API key
   - Save in `.env.local`

#### Step 1.3: Environment Setup (30 minutes)
```bash
# Install backend dependencies
npm install firebase @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
# OR for Supabase:
# npm install @supabase/supabase-js

# Install AI dependencies
npm install @anthropic-ai/sdk

# Install environment management
npm install @react-native-dotenv
```

#### Step 1.4: Create Environment File (15 minutes)
Create `.env.local`:
```env
# Backend (Firebase example)
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id

# OR Supabase
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=your_anon_key

# AI Provider
ANTHROPIC_API_KEY=sk-ant-xxxxx
# OR OpenAI
# OPENAI_API_KEY=sk-xxxxx

# Environment
NODE_ENV=development
```

#### Step 1.5: Update `.gitignore` (5 minutes)
Add to `.gitignore`:
```
# Environment files
.env
.env.local
.env.production

# API Keys
**/api-keys.json
```

#### Step 1.6: Create Project Structure (30 minutes)
```bash
# Create backend-related directories
mkdir -p src/services/backend
mkdir -p src/services/ai
mkdir -p src/config
mkdir -p src/models
mkdir -p docs/api
```

### Verification Checklist
- [ ] Technology stack chosen and documented
- [ ] Firebase/Supabase account created
- [ ] Claude API key obtained
- [ ] Dependencies installed
- [ ] `.env.local` file created with all keys
- [ ] `.gitignore` updated
- [ ] Directory structure created

### Deliverables
1. `TECH_STACK_DECISION.md` - Your chosen stack with reasoning
2. `.env.local` - Environment variables (not committed)
3. Updated `package.json` with new dependencies

---

## 🔥 PHASE 2: BACKEND INITIALIZATION (Week 1, Days 3-4)

### Objectives
- Initialize Firebase/Supabase in the app
- Create basic backend configuration
- Test connection

### Step-by-Step Instructions

#### Step 2.1: Create Backend Config File (1 hour)

**If using Firebase**, create `src/config/firebase.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
```

**If using Supabase**, create `src/config/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

#### Step 2.2: Create Backend Service (1 hour)

Create `src/services/backend/BackendService.js`:
```javascript
// Firebase implementation
import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

class BackendService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // Test connection
  async testConnection() {
    try {
      const testRef = collection(this.db, 'test');
      const testDoc = await setDoc(doc(testRef, 'connection-test'), {
        timestamp: new Date().toISOString(),
        message: 'Backend connected successfully'
      });
      console.log('✅ Backend connection successful');
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  // Get current user ID
  getCurrentUserId() {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  // Collection references (we'll use these later)
  getWorkoutsRef(userId) {
    return collection(this.db, 'users', userId, 'workouts');
  }

  getMealsRef(userId) {
    return collection(this.db, 'users', userId, 'meals');
  }

  getProgressRef(userId) {
    return collection(this.db, 'users', userId, 'progress');
  }
}

export default new BackendService();
```

#### Step 2.3: Create Debug Screen for Testing (30 minutes)

Update `src/screens/DebugScreen.js`:
```javascript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import BackendService from '../services/backend/BackendService';
import { Colors, Spacing } from '../constants/theme';

export default function DebugScreen() {
  const [connectionStatus, setConnectionStatus] = useState('not-tested');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setConnectionStatus('testing');
    const success = await BackendService.testConnection();
    setConnectionStatus(success ? 'success' : 'failed');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Debug Screen</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={testBackendConnection}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Test Backend Connection</Text>
        )}
      </TouchableOpacity>

      {connectionStatus !== 'not-tested' && (
        <View style={[
          styles.statusBox,
          connectionStatus === 'success' ? styles.success : styles.error
        ]}>
          <Text style={styles.statusText}>
            {connectionStatus === 'success' ? '✅ Connected' : '❌ Failed'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBox: {
    padding: Spacing.lg,
    borderRadius: 8,
    marginTop: Spacing.lg,
  },
  success: {
    backgroundColor: '#10B98144',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  error: {
    backgroundColor: '#EF444444',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

#### Step 2.4: Test Backend Connection (30 minutes)
1. Run the app: `npm start`
2. Navigate to Debug screen (add button in Profile screen if needed)
3. Press "Test Backend Connection"
4. Verify you see "✅ Connected"
5. Check Firebase/Supabase console to see the test document

### Verification Checklist
- [ ] Backend config file created
- [ ] BackendService class implemented
- [ ] Debug screen shows successful connection
- [ ] Test document visible in Firebase/Supabase console
- [ ] No errors in console

### Deliverables
1. `src/config/firebase.js` or `src/config/supabase.js`
2. `src/services/backend/BackendService.js`
3. Updated `src/screens/DebugScreen.js`
4. Screenshot of successful connection test

---

## 🗄️ PHASE 3: DATABASE SCHEMA DESIGN (Week 1, Days 5-7)

### Objectives
- Design database collections/tables
- Create data models
- Set up database rules/security

### Step-by-Step Instructions

#### Step 3.1: Design Database Schema (2 hours)

Create `docs/api/DATABASE_DESIGN.md`:
```markdown
# Database Schema Design

## Collections Structure (Firebase) / Tables (Supabase)

### users/{userId}
- uid: string
- email: string
- displayName: string
- photoURL: string
- createdAt: timestamp
- updatedAt: timestamp
- settings: object
  - units: 'imperial' | 'metric'
  - theme: 'light' | 'dark'
- goals: object
  - targetWeight: number
  - targetCalories: number
  - proteinGrams: number
  - carbsGrams: number
  - fatGrams: number

### users/{userId}/workouts/{workoutId}
- id: string (auto-generated)
- userId: string
- date: timestamp
- startTime: timestamp
- endTime: timestamp
- duration: number (seconds)
- exercises: array
  - exerciseId: string
  - exerciseName: string
  - sets: array
    - setNumber: number
    - weight: number
    - reps: number
    - type: 'normal' | 'warmup' | 'dropset' | 'failure'
    - completed: boolean
- totalVolume: number
- totalSets: number
- notes: string
- muscleGroups: array of strings
- synced: boolean
- localId: string (for offline sync)

### users/{userId}/meals/{mealId}
- id: string
- userId: string
- date: timestamp
- mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
- foods: array
  - foodId: string
  - foodName: string
  - servingSize: number
  - calories: number
  - protein: number
  - carbs: number
  - fat: number
  - photo: string (optional)
- totalCalories: number
- totalProtein: number
- totalCarbs: number
- totalFat: number
- barcodePhoto: string (optional)
- synced: boolean

### users/{userId}/progress/{progressId}
- id: string
- userId: string
- date: timestamp
- weight: number
- bodyFat: number (optional)
- measurements: object
  - chest: number
  - waist: number
  - arms: number
  - legs: number
- photos: array of strings
- notes: string

### users/{userId}/ai_sessions/{sessionId}
- id: string
- userId: string
- timestamp: timestamp
- context: object
  - screen: string (e.g., 'WorkoutScreen', 'NutritionScreen')
  - activity: string
  - relevantData: object
- userMessage: string
- aiResponse: string
- responseTime: number (ms)
- tokensUsed: number
- helpful: boolean (user feedback)

### exercises (global collection)
- id: string
- name: string
- category: string
- muscleGroups: object
  - primary: array
  - secondary: array
- equipment: array
- difficulty: string
- instructions: array
- media: object

### foods (global collection)
- id: string
- name: string
- brand: string
- nutrition: object
- fdcId: number
- barcode: string
- source: string
```

#### Step 3.2: Create TypeScript Interfaces (1.5 hours)

Create `src/models/types.ts`:
```typescript
// User Models
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  settings: UserSettings;
  goals: UserGoals;
}

export interface UserSettings {
  units: 'imperial' | 'metric';
  theme: 'light' | 'dark';
}

export interface UserGoals {
  targetWeight?: number;
  targetCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

// Workout Models
export interface Workout {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  exercises: WorkoutExercise[];
  totalVolume: number;
  totalSets: number;
  notes?: string;
  muscleGroups: string[];
  synced: boolean;
  localId?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  type: 'normal' | 'warmup' | 'dropset' | 'failure';
  completed: boolean;
}

// Meal Models
export interface Meal {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: MealFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  barcodePhoto?: string;
  synced: boolean;
}

export interface MealFood {
  foodId: string;
  foodName: string;
  servingSize: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photo?: string;
}

// Progress Models
export interface ProgressEntry {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  measurements?: BodyMeasurements;
  photos?: string[];
  notes?: string;
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  arms?: number;
  legs?: number;
}

// AI Session Models
export interface AISession {
  id: string;
  userId: string;
  timestamp: string;
  context: AIContext;
  userMessage: string;
  aiResponse: string;
  responseTime: number;
  tokensUsed: number;
  helpful?: boolean;
}

export interface AIContext {
  screen: string;
  activity: string;
  relevantData: Record<string, any>;
}
```

#### Step 3.3: Set Up Database Security Rules (1 hour)

**For Firebase**, create `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // User's workouts
      match /workouts/{workoutId} {
        allow read, write: if isOwner(userId);
      }

      // User's meals
      match /meals/{mealId} {
        allow read, write: if isOwner(userId);
      }

      // User's progress
      match /progress/{progressId} {
        allow read, write: if isOwner(userId);
      }

      // User's AI sessions
      match /ai_sessions/{sessionId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Global exercises (read-only for users)
    match /exercises/{exerciseId} {
      allow read: if isSignedIn();
      allow write: if false; // Only admins can write
    }

    // Global foods (read-only for users)
    match /foods/{foodId} {
      allow read: if isSignedIn();
      allow write: if false; // Only admins can write
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

**For Supabase**, create `supabase/policies.sql`:
```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workouts policies
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for meals, progress, ai_sessions...
```

### Verification Checklist
- [ ] Database schema documented in `DATABASE_DESIGN.md`
- [ ] TypeScript interfaces created
- [ ] Security rules/policies configured
- [ ] Rules deployed to Firebase/Supabase

### Deliverables
1. `docs/api/DATABASE_DESIGN.md`
2. `src/models/types.ts`
3. `firestore.rules` or `supabase/policies.sql`

---

## 🔐 PHASE 4: AUTHENTICATION INTEGRATION (Week 2, Days 1-2)

### Objectives
- Implement proper user authentication
- Connect existing Google Sign-In to backend
- Set up user profile creation

### Step-by-Step Instructions

#### Step 4.1: Update AuthContext (2 hours)

Update `src/context/AuthContext.js`:
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import BackendService from '../services/backend/BackendService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setIsSignedIn(true);

        // Create/update user profile in backend
        await BackendService.createOrUpdateUserProfile(firebaseUser);
      } else {
        // User is signed out
        setUser(null);
        setIsSignedIn(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (googleCredential) => {
    try {
      const credential = GoogleAuthProvider.credential(googleCredential.idToken);
      const result = await signInWithCredential(auth, credential);
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.clear(); // Clear local cache
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isSignedIn, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### Step 4.2: Add User Profile Methods to BackendService (1 hour)

Update `src/services/backend/BackendService.js`:
```javascript
// Add these methods to the BackendService class

async createOrUpdateUserProfile(firebaseUser) {
  try {
    const userRef = doc(this.db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      updatedAt: new Date().toISOString(),
    };

    if (!userDoc.exists()) {
      // New user - create profile
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        settings: {
          units: 'imperial',
          theme: 'dark',
        },
        goals: {
          targetCalories: 2000,
          proteinGrams: 150,
          carbsGrams: 200,
          fatGrams: 65,
        },
      });
      console.log('✅ User profile created');
    } else {
      // Existing user - update profile
      await setDoc(userRef, userData, { merge: true });
      console.log('✅ User profile updated');
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

async getUserProfile(userId) {
  try {
    const userRef = doc(this.db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

async updateUserSettings(userId, settings) {
  try {
    const userRef = doc(this.db, 'users', userId);
    await setDoc(userRef, {
      settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

async updateUserGoals(userId, goals) {
  try {
    const userRef = doc(this.db, 'users', userId);
    await setDoc(userRef, {
      goals,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating goals:', error);
    throw error;
  }
}
```

#### Step 4.3: Test Authentication Flow (30 minutes)
1. Sign out of the app
2. Sign in with Google
3. Check Firebase/Supabase console - verify user document created
4. Check user profile has correct data
5. Sign out and sign in again - verify profile updates

### Verification Checklist
- [ ] AuthContext uses Firebase auth
- [ ] User profile created on first sign-in
- [ ] User profile visible in backend console
- [ ] Sign out clears local data
- [ ] Re-sign in works correctly

### Deliverables
1. Updated `src/context/AuthContext.js`
2. Updated `src/services/backend/BackendService.js`
3. Screenshot of user profile in backend console

---

## 💾 PHASE 5: WORKOUT DATA SYNC - PART 1 (Week 2, Days 3-4)

### Objectives
- Sync workout data to cloud
- Implement read operations
- Test data retrieval

### Step-by-Step Instructions

#### Step 5.1: Create Workout Sync Service (2 hours)

Create `src/services/backend/WorkoutSyncService.js`:
```javascript
import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import workoutStorage from '../workoutStorage';

class WorkoutSyncService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // Save workout to cloud
  async saveWorkout(workout) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const workoutRef = doc(
        collection(this.db, 'users', userId, 'workouts')
      );

      const workoutData = {
        ...workout,
        id: workoutRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(workoutRef, workoutData);

      console.log('✅ Workout saved to cloud:', workoutRef.id);
      return workoutRef.id;
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  // Get workout from cloud
  async getWorkout(workoutId) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const workoutRef = doc(this.db, 'users', userId, 'workouts', workoutId);
      const workoutDoc = await getDoc(workoutRef);

      if (workoutDoc.exists()) {
        return { id: workoutDoc.id, ...workoutDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting workout:', error);
      throw error;
    }
  }

  // Get all workouts from cloud
  async getAllWorkouts(limitCount = 100) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const workoutsRef = collection(this.db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ Retrieved ${workouts.length} workouts from cloud`);
      return workouts;
    } catch (error) {
      console.error('Error getting workouts:', error);
      throw error;
    }
  }

  // Get workouts in date range
  async getWorkoutsByDateRange(startDate, endDate) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const workoutsRef = collection(this.db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({ id: doc.id, ...doc.data() });
      });

      return workouts;
    } catch (error) {
      console.error('Error getting workouts by date:', error);
      throw error;
    }
  }

  // Sync local workouts to cloud (bulk upload)
  async syncLocalWorkouts() {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get all local workouts
      const localWorkouts = await workoutStorage.getWorkouts();
      const unsyncedWorkouts = localWorkouts.filter(w => !w.synced);

      if (unsyncedWorkouts.length === 0) {
        console.log('✅ All workouts already synced');
        return { synced: 0, failed: 0 };
      }

      console.log(`📤 Syncing ${unsyncedWorkouts.length} local workouts...`);

      // Batch write for efficiency
      const batch = writeBatch(this.db);
      let syncedCount = 0;

      for (const workout of unsyncedWorkouts) {
        try {
          const workoutRef = doc(
            collection(this.db, 'users', userId, 'workouts')
          );

          const workoutData = {
            ...workout,
            id: workoutRef.id,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          batch.set(workoutRef, workoutData);

          // Update local storage with cloud ID
          workout.cloudId = workoutRef.id;
          workout.synced = true;
          syncedCount++;
        } catch (error) {
          console.error('Error preparing workout for sync:', error);
        }
      }

      // Commit batch
      await batch.commit();

      // Update local storage
      await workoutStorage.saveWorkouts(localWorkouts);

      console.log(`✅ Synced ${syncedCount} workouts to cloud`);
      return { synced: syncedCount, failed: unsyncedWorkouts.length - syncedCount };
    } catch (error) {
      console.error('Error syncing local workouts:', error);
      throw error;
    }
  }

  // Download cloud workouts to local storage
  async downloadCloudWorkouts() {
    try {
      const cloudWorkouts = await this.getAllWorkouts();
      const localWorkouts = await workoutStorage.getWorkouts();

      // Merge cloud and local workouts (cloud takes precedence)
      const workoutMap = new Map();

      // Add local workouts first
      localWorkouts.forEach(w => {
        workoutMap.set(w.cloudId || w.id, w);
      });

      // Override with cloud workouts
      cloudWorkouts.forEach(w => {
        workoutMap.set(w.id, w);
      });

      const mergedWorkouts = Array.from(workoutMap.values());
      await workoutStorage.saveWorkouts(mergedWorkouts);

      console.log(`✅ Downloaded and merged ${cloudWorkouts.length} workouts`);
      return mergedWorkouts;
    } catch (error) {
      console.error('Error downloading cloud workouts:', error);
      throw error;
    }
  }
}

export default new WorkoutSyncService();
```

#### Step 5.2: Add Sync Button to Debug Screen (1 hour)

Update `src/screens/DebugScreen.js` to add sync testing:
```javascript
import WorkoutSyncService from '../services/backend/WorkoutSyncService';

// Add these functions to DebugScreen component:

const [syncStatus, setSyncStatus] = useState('');

const handleSyncLocalWorkouts = async () => {
  setSyncStatus('Syncing...');
  try {
    const result = await WorkoutSyncService.syncLocalWorkouts();
    setSyncStatus(`✅ Synced: ${result.synced}, Failed: ${result.failed}`);
  } catch (error) {
    setSyncStatus(`❌ Error: ${error.message}`);
  }
};

const handleDownloadWorkouts = async () => {
  setSyncStatus('Downloading...');
  try {
    const workouts = await WorkoutSyncService.downloadCloudWorkouts();
    setSyncStatus(`✅ Downloaded ${workouts.length} workouts`);
  } catch (error) {
    setSyncStatus(`❌ Error: ${error.message}`);
  }
};

// Add these buttons to the UI:
<TouchableOpacity style={styles.button} onPress={handleSyncLocalWorkouts}>
  <Text style={styles.buttonText}>Sync Local Workouts to Cloud</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.button} onPress={handleDownloadWorkouts}>
  <Text style={styles.buttonText}>Download Cloud Workouts</Text>
</TouchableOpacity>

{syncStatus !== '' && (
  <Text style={styles.statusText}>{syncStatus}</Text>
)}
```

#### Step 5.3: Test Workout Sync (1 hour)
1. Open app and go to Debug screen
2. Click "Sync Local Workouts to Cloud"
3. Check Firebase console - verify workouts appear
4. Delete local data (reinstall app or clear storage)
5. Click "Download Cloud Workouts"
6. Verify workouts reappear in app

### Verification Checklist
- [ ] WorkoutSyncService created
- [ ] Sync button added to Debug screen
- [ ] Local workouts sync to cloud successfully
- [ ] Workouts visible in Firebase console
- [ ] Download from cloud works
- [ ] No duplicate workouts created

### Deliverables
1. `src/services/backend/WorkoutSyncService.js`
2. Updated `src/screens/DebugScreen.js`
3. Screenshot of synced workouts in Firebase console

---

## 💾 PHASE 6: WORKOUT DATA SYNC - PART 2 (Week 2, Days 5-7)

### Objectives
- Implement automatic sync
- Add offline support
- Handle sync conflicts

### Step-by-Step Instructions

#### Step 6.1: Create Sync Manager (2 hours)

Create `src/services/backend/SyncManager.js`:
```javascript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutSyncService from './WorkoutSyncService';
import { auth } from '../../config/firebase';

class SyncManager {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.syncQueue = [];
    this.lastSyncTime = null;

    // Listen to network changes
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      console.log(`📡 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

      // If we just came online, sync
      if (wasOffline && this.isOnline) {
        console.log('🔄 Connection restored, syncing...');
        this.syncAll();
      }
    });
  }

  async syncAll() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('📴 Offline, skipping sync');
      return;
    }

    if (!auth.currentUser) {
      console.log('🔒 Not authenticated, skipping sync');
      return;
    }

    this.syncInProgress = true;

    try {
      console.log('🔄 Starting full sync...');

      // 1. Sync workouts
      await WorkoutSyncService.syncLocalWorkouts();

      // TODO: Add meal sync in Phase 7
      // TODO: Add progress sync in Phase 8

      this.lastSyncTime = new Date().toISOString();
      await AsyncStorage.setItem('lastSyncTime', this.lastSyncTime);

      console.log('✅ Full sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getLastSyncTime() {
    if (!this.lastSyncTime) {
      this.lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
    }
    return this.lastSyncTime;
  }

  // Queue operations for later sync when offline
  async queueOperation(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem(
      'syncQueue',
      JSON.stringify(this.syncQueue)
    );

    console.log(`📋 Operation queued: ${operation.type}`);

    // Try to sync if online
    if (this.isOnline) {
      this.syncAll();
    }
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log(`📋 Processing ${this.syncQueue.length} queued operations...`);

    // Process each queued operation
    for (const operation of this.syncQueue) {
      try {
        switch (operation.type) {
          case 'saveWorkout':
            await WorkoutSyncService.saveWorkout(operation.data);
            break;
          // Add other operation types
        }
      } catch (error) {
        console.error('Error processing queued operation:', error);
      }
    }

    // Clear queue
    this.syncQueue = [];
    await AsyncStorage.setItem('syncQueue', JSON.stringify([]));

    console.log('✅ Sync queue processed');
  }
}

export default new SyncManager();
```

#### Step 6.2: Install Network Monitoring (15 minutes)
```bash
npm install @react-native-community/netinfo
```

#### Step 6.3: Add Auto-Sync to App Lifecycle (1 hour)

Update `App.js`:
```javascript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import SyncManager from './src/services/backend/SyncManager';

// Add inside App component (after AuthProvider, before return):
useEffect(() => {
  // Sync when app starts
  SyncManager.syncAll();

  // Sync when app comes to foreground
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      console.log('🔄 App came to foreground, syncing...');
      SyncManager.syncAll();
    }
  });

  return () => {
    subscription.remove();
  };
}, []);
```

#### Step 6.4: Update Workout Saving to Use Sync (1 hour)

Update `src/screens/WorkoutSummaryScreen.js`:
```javascript
import SyncManager from '../services/backend/SyncManager';
import WorkoutSyncService from '../services/backend/WorkoutSyncService';

// In the save workout function, add:
const saveWorkout = async () => {
  try {
    // Save locally first (existing code)
    await workoutStorage.saveWorkout(workoutData);

    // Sync to cloud
    try {
      await WorkoutSyncService.saveWorkout(workoutData);
    } catch (error) {
      // If cloud save fails, queue for later
      console.log('Cloud save failed, queueing for later');
      await SyncManager.queueOperation({
        type: 'saveWorkout',
        data: workoutData,
      });
    }

    // Continue with existing code...
  } catch (error) {
    console.error('Error saving workout:', error);
  }
};
```

#### Step 6.5: Add Sync Status to Profile Screen (1.5 hours)

Update `src/screens/ProfileScreen.js`:
```javascript
import React, { useState, useEffect } from 'react';
import SyncManager from '../services/backend/SyncManager';

export default function ProfileScreen() {
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    const syncTime = await SyncManager.getLastSyncTime();
    setLastSyncTime(syncTime);
  };

  const handleManualSync = async () => {
    await SyncManager.syncAll();
    await loadSyncStatus();
  };

  return (
    <ScreenLayout title="Profile">
      {/* Existing profile content */}

      <View style={styles.syncSection}>
        <Text style={styles.sectionTitle}>Data Sync</Text>
        <Text style={styles.syncStatus}>
          Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
        </Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleManualSync}
        >
          <Text style={styles.syncButtonText}>🔄 Sync Now</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}
```

### Verification Checklist
- [ ] SyncManager created
- [ ] Network monitoring works
- [ ] Auto-sync on app foreground works
- [ ] Workouts save to cloud automatically
- [ ] Offline queueing works
- [ ] Manual sync button in Profile works

### Deliverables
1. `src/services/backend/SyncManager.js`
2. Updated `App.js` with auto-sync
3. Updated `WorkoutSummaryScreen.js`
4. Updated `ProfileScreen.js` with sync status

---

## 🍽️ PHASE 7: MEAL DATA SYNC (Week 3, Days 1-2)

### Objectives
- Sync meal/nutrition data to cloud
- Implement same patterns as workout sync
- Test meal data persistence

### Step-by-Step Instructions

#### Step 7.1: Create Meal Sync Service (2 hours)

Create `src/services/backend/MealSyncService.js`:
```javascript
import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { foodDatabase } from '../foodDatabase';

class MealSyncService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  async saveMeal(meal) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const mealRef = doc(
        collection(this.db, 'users', userId, 'meals')
      );

      const mealData = {
        ...meal,
        id: mealRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(mealRef, mealData);

      console.log('✅ Meal saved to cloud:', mealRef.id);
      return mealRef.id;
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
  }

  async getMeal(mealId) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const mealRef = doc(this.db, 'users', userId, 'meals', mealId);
      const mealDoc = await getDoc(mealRef);

      if (mealDoc.exists()) {
        return { id: mealDoc.id, ...mealDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting meal:', error);
      throw error;
    }
  }

  async getMealsByDate(date) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Convert date to start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const mealsRef = collection(this.db, 'users', userId, 'meals');
      const q = query(
        mealsRef,
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString()),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const meals = [];

      querySnapshot.forEach((doc) => {
        meals.push({ id: doc.id, ...doc.data() });
      });

      return meals;
    } catch (error) {
      console.error('Error getting meals by date:', error);
      throw error;
    }
  }

  async syncLocalMeals() {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get all local meals from foodDatabase
      const localMeals = await foodDatabase.getAllMeals();
      const unsyncedMeals = localMeals.filter(m => !m.synced);

      if (unsyncedMeals.length === 0) {
        console.log('✅ All meals already synced');
        return { synced: 0, failed: 0 };
      }

      console.log(`📤 Syncing ${unsyncedMeals.length} local meals...`);

      const batch = writeBatch(this.db);
      let syncedCount = 0;

      for (const meal of unsyncedMeals) {
        try {
          const mealRef = doc(
            collection(this.db, 'users', userId, 'meals')
          );

          const mealData = {
            ...meal,
            id: mealRef.id,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          batch.set(mealRef, mealData);

          meal.cloudId = mealRef.id;
          meal.synced = true;
          syncedCount++;
        } catch (error) {
          console.error('Error preparing meal for sync:', error);
        }
      }

      await batch.commit();
      await foodDatabase.saveMeals(localMeals);

      console.log(`✅ Synced ${syncedCount} meals to cloud`);
      return { synced: syncedCount, failed: unsyncedMeals.length - syncedCount };
    } catch (error) {
      console.error('Error syncing local meals:', error);
      throw error;
    }
  }
}

export default new MealSyncService();
```

#### Step 7.2: Update SyncManager (30 minutes)

Update `src/services/backend/SyncManager.js`:
```javascript
import MealSyncService from './MealSyncService';

// Update syncAll method:
async syncAll() {
  // ... existing code ...

  try {
    console.log('🔄 Starting full sync...');

    // 1. Sync workouts
    await WorkoutSyncService.syncLocalWorkouts();

    // 2. Sync meals
    await MealSyncService.syncLocalMeals();

    // TODO: Add progress sync in Phase 8

    this.lastSyncTime = new Date().toISOString();
    await AsyncStorage.setItem('lastSyncTime', this.lastSyncTime);

    console.log('✅ Full sync completed');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    this.syncInProgress = false;
  }
}
```

#### Step 7.3: Update Meal Saving Logic (1 hour)

Update `src/screens/FoodScanResultScreen.js` and any other screens that save meals:
```javascript
import MealSyncService from '../services/backend/MealSyncService';
import SyncManager from '../services/backend/SyncManager';

// In the save meal function:
const saveMeal = async () => {
  try {
    // Save locally first
    await foodDatabase.saveMeal(mealData);

    // Sync to cloud
    try {
      await MealSyncService.saveMeal(mealData);
    } catch (error) {
      console.log('Cloud save failed, queueing for later');
      await SyncManager.queueOperation({
        type: 'saveMeal',
        data: mealData,
      });
    }

    // Continue...
  } catch (error) {
    console.error('Error saving meal:', error);
  }
};
```

#### Step 7.4: Test Meal Sync (1 hour)
1. Add a meal in the app
2. Check Firebase console - verify meal appears
3. Clear local data
4. Trigger sync
5. Verify meal reappears

### Verification Checklist
- [ ] MealSyncService created
- [ ] Meals sync to cloud automatically
- [ ] Meals visible in Firebase console
- [ ] Download from cloud works
- [ ] SyncManager includes meal sync

### Deliverables
1. `src/services/backend/MealSyncService.js`
2. Updated `src/services/backend/SyncManager.js`
3. Updated meal saving screens
4. Screenshot of synced meals in Firebase console

---

## 📊 PHASE 8: PROGRESS DATA SYNC (Week 3, Days 3-4)

### Objectives
- Sync progress entries to cloud
- Complete the full sync system
- All local data now backs up to cloud

### Step-by-Step Instructions

#### Step 8.1: Create Progress Sync Service (1.5 hours)

Create `src/services/backend/ProgressSyncService.js`:
```javascript
import { db, auth } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ProgressSyncService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  async saveProgress(progressEntry) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const progressRef = doc(
        collection(this.db, 'users', userId, 'progress')
      );

      const progressData = {
        ...progressEntry,
        id: progressRef.id,
        userId,
        synced: true,
        syncedAt: new Date().toISOString(),
      };

      await setDoc(progressRef, progressData);

      console.log('✅ Progress saved to cloud:', progressRef.id);
      return progressRef.id;
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  async getAllProgress() {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const progressRef = collection(this.db, 'users', userId, 'progress');
      const q = query(progressRef, orderBy('date', 'desc'));

      const querySnapshot = await getDocs(q);
      const progressEntries = [];

      querySnapshot.forEach((doc) => {
        progressEntries.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ Retrieved ${progressEntries.length} progress entries`);
      return progressEntries;
    } catch (error) {
      console.error('Error getting progress:', error);
      throw error;
    }
  }

  async syncLocalProgress() {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Get local progress data
      const localProgressJSON = await AsyncStorage.getItem('progress_entries');
      if (!localProgressJSON) {
        console.log('✅ No local progress to sync');
        return { synced: 0, failed: 0 };
      }

      const localProgress = JSON.parse(localProgressJSON);
      const unsyncedProgress = localProgress.filter(p => !p.synced);

      if (unsyncedProgress.length === 0) {
        console.log('✅ All progress already synced');
        return { synced: 0, failed: 0 };
      }

      console.log(`📤 Syncing ${unsyncedProgress.length} progress entries...`);

      const batch = writeBatch(this.db);
      let syncedCount = 0;

      for (const entry of unsyncedProgress) {
        try {
          const progressRef = doc(
            collection(this.db, 'users', userId, 'progress')
          );

          const progressData = {
            ...entry,
            id: progressRef.id,
            userId,
            synced: true,
            syncedAt: new Date().toISOString(),
          };

          batch.set(progressRef, progressData);

          entry.cloudId = progressRef.id;
          entry.synced = true;
          syncedCount++;
        } catch (error) {
          console.error('Error preparing progress for sync:', error);
        }
      }

      await batch.commit();
      await AsyncStorage.setItem('progress_entries', JSON.stringify(localProgress));

      console.log(`✅ Synced ${syncedCount} progress entries to cloud`);
      return { synced: syncedCount, failed: unsyncedProgress.length - syncedCount };
    } catch (error) {
      console.error('Error syncing local progress:', error);
      throw error;
    }
  }
}

export default new ProgressSyncService();
```

#### Step 8.2: Update SyncManager (Final) (30 minutes)

Update `src/services/backend/SyncManager.js`:
```javascript
import ProgressSyncService from './ProgressSyncService';

async syncAll() {
  if (this.syncInProgress) {
    console.log('⏳ Sync already in progress');
    return;
  }

  if (!this.isOnline) {
    console.log('📴 Offline, skipping sync');
    return;
  }

  if (!auth.currentUser) {
    console.log('🔒 Not authenticated, skipping sync');
    return;
  }

  this.syncInProgress = true;

  try {
    console.log('🔄 Starting full sync...');

    const results = {
      workouts: { synced: 0, failed: 0 },
      meals: { synced: 0, failed: 0 },
      progress: { synced: 0, failed: 0 },
    };

    // 1. Sync workouts
    results.workouts = await WorkoutSyncService.syncLocalWorkouts();

    // 2. Sync meals
    results.meals = await MealSyncService.syncLocalMeals();

    // 3. Sync progress
    results.progress = await ProgressSyncService.syncLocalProgress();

    this.lastSyncTime = new Date().toISOString();
    await AsyncStorage.setItem('lastSyncTime', this.lastSyncTime);

    console.log('✅ Full sync completed:', results);
    return results;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    this.syncInProgress = false;
  }
}
```

#### Step 8.3: Test Complete Sync System (1 hour)
1. Add workout, meal, and progress entry
2. Check Firebase console - all data synced
3. Clear local data
4. Sign in again
5. Trigger sync
6. Verify all data restored

### Verification Checklist
- [ ] ProgressSyncService created
- [ ] Progress syncs to cloud
- [ ] Complete sync system works
- [ ] All data types backed up
- [ ] Restore from cloud works

### Deliverables
1. `src/services/backend/ProgressSyncService.js`
2. Final `src/services/backend/SyncManager.js`
3. Screenshot showing all synced data in Firebase

---

## 🤖 PHASE 9: AI PROVIDER SETUP (Week 3, Days 5-7)

### Objectives
- Set up Claude/OpenAI API integration
- Create AI service wrapper
- Test basic AI responses

### Step-by-Step Instructions

#### Step 9.1: Install AI SDK (15 minutes)
```bash
npm install @anthropic-ai/sdk
# OR for OpenAI:
# npm install openai
```

#### Step 9.2: Create AI Service (2 hours)

Create `src/services/ai/AIService.js`:
```javascript
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '@env';

class AIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.model = 'claude-3-5-sonnet-20241022';
  }

  async sendMessage(userMessage, context = {}) {
    try {
      console.log('🤖 Sending message to AI...');

      const systemPrompt = this.buildSystemPrompt(context);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      const response = message.content[0].text;

      console.log('✅ AI response received');

      return {
        response,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        model: this.model,
      };
    } catch (error) {
      console.error('❌ AI service error:', error);
      throw error;
    }
  }

  buildSystemPrompt(context) {
    const basePrompt = `You are an expert fitness coach and nutritionist assistant for the AI Gym Trainer app.

Your role is to provide:
- Personalized workout advice based on user's current training
- Nutrition guidance aligned with their goals
- Motivation and encouragement
- Evidence-based recommendations

Keep responses concise, friendly, and actionable.`;

    // Add context-specific instructions
    let contextPrompt = '';

    if (context.screen) {
      contextPrompt += `\n\nCurrent Screen: ${context.screen}`;
    }

    if (context.userData) {
      contextPrompt += `\n\nUser Context:\n${JSON.stringify(context.userData, null, 2)}`;
    }

    return basePrompt + contextPrompt;
  }

  // Test function
  async testConnection() {
    try {
      const result = await this.sendMessage(
        'Hello! Can you introduce yourself?',
        { screen: 'TestScreen' }
      );
      console.log('✅ AI connection test successful');
      return result;
    } catch (error) {
      console.error('❌ AI connection test failed:', error);
      throw error;
    }
  }
}

export default new AIService();
```

#### Step 9.3: Add AI Test to Debug Screen (1 hour)

Update `src/screens/DebugScreen.js`:
```javascript
import AIService from '../services/ai/AIService';

// Add state:
const [aiTestResult, setAiTestResult] = useState('');
const [aiLoading, setAiLoading] = useState(false);

// Add function:
const testAIConnection = async () => {
  setAiLoading(true);
  setAiTestResult('Testing...');
  try {
    const result = await AIService.testConnection();
    setAiTestResult(`✅ Success!\n\nResponse: ${result.response}\n\nTokens: ${result.tokensUsed}`);
  } catch (error) {
    setAiTestResult(`❌ Failed: ${error.message}`);
  } finally {
    setAiLoading(false);
  }
};

// Add button:
<TouchableOpacity
  style={styles.button}
  onPress={testAIConnection}
  disabled={aiLoading}
>
  {aiLoading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.buttonText}>Test AI Connection</Text>
  )}
</TouchableOpacity>

{aiTestResult !== '' && (
  <View style={styles.resultBox}>
    <Text style={styles.resultText}>{aiTestResult}</Text>
  </View>
)}
```

#### Step 9.4: Test AI Connection (30 minutes)
1. Go to Debug screen
2. Click "Test AI Connection"
3. Verify you get a response from Claude
4. Check response is relevant and friendly

### Verification Checklist
- [ ] AI SDK installed
- [ ] AIService created
- [ ] Test button works
- [ ] AI returns valid responses
- [ ] Token usage tracked

### Deliverables
1. `src/services/ai/AIService.js`
2. Updated `src/screens/DebugScreen.js`
3. Screenshot of successful AI test

---

*[Continuing with remaining phases... Should I continue with the full 20+ phases? This is getting very long. I can create phases 10-25 covering:
- Phase 10-12: Context-aware AI implementation
- Phase 13-15: Screen-specific AI features
- Phase 16-18: Advanced AI features (workout generation, meal planning)
- Phase 19-20: Testing and optimization
- Phase 21-25: Production deployment

Would you like me to continue, or is this structure clear enough for you to proceed?]*
Continuing with remaining phases...
