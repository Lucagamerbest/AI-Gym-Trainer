# Database Schema Design - AI Gym Trainer

**Version**: 1.0
**Date**: 2025-10-13
**Database**: Firebase Firestore

---

## 🏗️ Overview

This document defines the complete database structure for the AI Gym Trainer app. All data is stored in Firebase Firestore using a document-based NoSQL structure.

---

## 📊 Database Structure

### Root Collections

```
firestore/
├── users/                    # User profiles and settings
├── exercises/                # Global exercise library (read-only)
└── foods/                    # Global food database (read-only)
```

### User Subcollections

Each user document has these subcollections:

```
users/{userId}/
├── workouts/                 # User's workout history
├── meals/                    # User's meal/nutrition logs
├── progress/                 # Body measurements & progress photos
└── ai_sessions/              # AI chat history
```

---

## 📝 Collection Schemas

### 1. `users/{userId}`

**Purpose**: Store user profile, settings, and goals

```javascript
{
  // Identity
  uid: string,                           // Firebase Auth UID
  email: string,                         // User's email
  displayName: string,                   // Display name
  photoURL: string | null,               // Profile photo URL

  // Timestamps
  createdAt: timestamp,                  // Account creation
  updatedAt: timestamp,                  // Last profile update

  // Settings
  settings: {
    units: 'imperial' | 'metric',        // Weight/distance units
    theme: 'light' | 'dark',             // App theme
    notifications: boolean,               // Push notifications enabled
  },

  // Fitness Goals
  goals: {
    targetWeight: number | null,         // Target body weight (lbs/kg)
    targetCalories: number,              // Daily calorie goal
    proteinGrams: number,                // Daily protein goal (g)
    carbsGrams: number,                  // Daily carbs goal (g)
    fatGrams: number,                    // Daily fat goal (g)
    weeklyWorkouts: number,              // Workouts per week goal
  },

  // Stats (calculated)
  stats: {
    totalWorkouts: number,               // Lifetime workout count
    totalVolume: number,                 // Lifetime volume (lbs/kg)
    currentStreak: number,               // Current workout streak (days)
    longestStreak: number,               // Longest workout streak
  }
}
```

---

### 2. `users/{userId}/workouts/{workoutId}`

**Purpose**: Store completed workout sessions

```javascript
{
  // Identity
  id: string,                            // Auto-generated document ID
  userId: string,                        // Owner's UID

  // Timing
  date: timestamp,                       // Workout date
  startTime: timestamp,                  // When workout started
  endTime: timestamp | null,             // When workout ended
  duration: number,                      // Total duration (seconds)

  // Exercises
  exercises: [
    {
      exerciseId: string,                // Reference to exercise in global DB
      exerciseName: string,              // Exercise name (cached)
      order: number,                     // Order in workout (0, 1, 2...)

      sets: [
        {
          setNumber: number,             // Set number (1, 2, 3...)
          weight: number,                // Weight used (lbs/kg)
          reps: number,                  // Repetitions completed
          type: 'normal' | 'warmup' | 'dropset' | 'failure',
          completed: boolean,            // Was this set completed?
          rpe: number | null,            // Rate of Perceived Exertion (1-10)
          notes: string | null,          // Set-specific notes
        }
      ],

      restTime: number,                  // Rest between sets (seconds)
      supersetWith: string | null,       // ID of superset exercise
    }
  ],

  // Calculated Stats
  totalVolume: number,                   // Sum of (weight × reps) for all sets
  totalSets: number,                     // Total number of sets
  totalReps: number,                     // Total number of reps

  // Metadata
  muscleGroups: string[],                // Primary muscles worked
  workoutType: string | null,            // 'push', 'pull', 'legs', 'upper', 'lower', 'full'
  notes: string | null,                  // Workout-level notes

  // Sync
  synced: boolean,                       // Has this been synced to cloud?
  localId: string | null,                // Local storage ID (for offline)
  syncedAt: timestamp | null,            // When synced to cloud
}
```

---

### 3. `users/{userId}/meals/{mealId}`

**Purpose**: Store nutrition/meal logs

```javascript
{
  // Identity
  id: string,                            // Auto-generated document ID
  userId: string,                        // Owner's UID

  // Timing
  date: timestamp,                       // When meal was consumed
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',

  // Foods
  foods: [
    {
      foodId: string,                    // Reference to food in DB
      foodName: string,                  // Food name (cached)
      brand: string | null,              // Brand name if applicable

      // Serving
      servingSize: number,               // Amount consumed
      servingUnit: string,               // 'g', 'oz', 'cup', 'piece', etc.

      // Nutrition (per serving)
      calories: number,
      protein: number,                   // grams
      carbs: number,                     // grams
      fat: number,                       // grams
      fiber: number | null,              // grams
      sugar: number | null,              // grams
      sodium: number | null,             // mg

      // Optional
      barcode: string | null,            // Barcode if scanned
      photo: string | null,              // Photo URL if captured
    }
  ],

  // Calculated Totals
  totalCalories: number,
  totalProtein: number,
  totalCarbs: number,
  totalFat: number,

  // Media
  mealPhoto: string | null,              // Photo of complete meal
  barcodePhoto: string | null,           // Barcode scan photo

  // Metadata
  notes: string | null,
  location: string | null,               // Where meal was consumed

  // Sync
  synced: boolean,
  syncedAt: timestamp | null,
}
```

---

### 4. `users/{userId}/progress/{progressId}`

**Purpose**: Track body measurements and progress photos

```javascript
{
  // Identity
  id: string,
  userId: string,

  // Timing
  date: timestamp,                       // When measurement was taken

  // Body Metrics
  weight: number,                        // Body weight (lbs/kg)
  bodyFat: number | null,                // Body fat percentage

  // Measurements (inches/cm)
  measurements: {
    chest: number | null,
    waist: number | null,
    hips: number | null,
    leftArm: number | null,
    rightArm: number | null,
    leftThigh: number | null,
    rightThigh: number | null,
    leftCalf: number | null,
    rightCalf: number | null,
    shoulders: number | null,
    neck: number | null,
  },

  // Visual Progress
  photos: [
    {
      url: string,                       // Firebase Storage URL
      angle: 'front' | 'back' | 'side',  // Photo angle
      thumbnail: string | null,          // Thumbnail URL
    }
  ],

  // Metadata
  notes: string | null,
  mood: string | null,                   // How user feels
  energyLevel: number | null,            // 1-10 scale

  // Sync
  synced: boolean,
  syncedAt: timestamp | null,
}
```

---

### 5. `users/{userId}/ai_sessions/{sessionId}`

**Purpose**: Store AI chat conversations for history and analysis

```javascript
{
  // Identity
  id: string,
  userId: string,

  // Timing
  timestamp: timestamp,                  // When message was sent

  // Context
  context: {
    screen: string,                      // Which screen user was on
    activity: string | null,             // What user was doing
    relevantData: object,                // Screen-specific data
  },

  // Messages
  userMessage: string,                   // What user asked
  aiResponse: string,                    // What AI replied

  // Metadata
  model: string,                         // AI model used (e.g., 'gemini-1.5-flash')
  responseTime: number,                  // Response time (ms)
  tokensUsed: number,                    // API tokens consumed

  // Feedback
  helpful: boolean | null,               // Did user find it helpful?
  rating: number | null,                 // 1-5 star rating

  // Sync
  synced: boolean,
  syncedAt: timestamp | null,
}
```

---

### 6. `exercises/{exerciseId}` (Global - Read Only)

**Purpose**: Global exercise library shared by all users

```javascript
{
  // Identity
  id: string,
  name: string,                          // "Barbell Bench Press"
  alternateNames: string[],              // ["Bench Press", "Flat Bench"]

  // Classification
  category: string,                      // "strength", "cardio", "flexibility"
  muscleGroups: {
    primary: string[],                   // ["chest", "triceps"]
    secondary: string[],                 // ["shoulders"]
  },

  // Requirements
  equipment: string[],                   // ["barbell", "bench"]
  difficulty: 'beginner' | 'intermediate' | 'advanced',

  // Instructions
  instructions: string[],                // Step-by-step instructions
  tips: string[],                        // Form tips
  commonMistakes: string[],              // What to avoid

  // Media
  videoUrl: string | null,               // Demonstration video
  thumbnailUrl: string | null,           // Thumbnail image

  // Metadata
  variations: string[],                  // Related exercise IDs
  tags: string[],                        // ["compound", "upper_body", "push"]
}
```

---

### 7. `foods/{foodId}` (Global - Read Only)

**Purpose**: Global food database for nutrition lookup

```javascript
{
  // Identity
  id: string,
  name: string,                          // "Chicken Breast"
  brand: string | null,                  // Brand name if applicable

  // Identifiers
  fdcId: number | null,                  // USDA FoodData Central ID
  barcode: string | null,                // UPC/EAN barcode

  // Nutrition (per 100g or per serving)
  nutrition: {
    servingSize: number,
    servingUnit: string,

    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    fiber: number | null,
    sugar: number | null,
    sodium: number | null,

    // Vitamins/Minerals (optional)
    vitaminA: number | null,
    vitaminC: number | null,
    calcium: number | null,
    iron: number | null,
  },

  // Classification
  category: string,                      // "protein", "vegetable", "grain", etc.
  tags: string[],                        // ["lean_protein", "low_carb"]

  // Metadata
  source: string,                        // "usda", "open_food_facts", "user"
  verified: boolean,                     // Is data verified?

  // Media
  imageUrl: string | null,
}
```

---

## 🔐 Security Model

### Access Control Rules

1. **User Documents**: Users can read/write only their own data
2. **Subcollections**: Users can read/write only their own subcollections
3. **Global Collections** (exercises, foods): All authenticated users can read, no one can write (admin only)

### Data Validation

- All timestamps must be valid
- User IDs must match authenticated user
- Numeric values must be within reasonable ranges
- Required fields must be present

---

## 📈 Indexing Strategy

### Composite Indexes (for queries)

```javascript
// Workouts by date (recent first)
users/{userId}/workouts: [date DESC]

// Meals by date and type
users/{userId}/meals: [date DESC, mealType ASC]

// Progress by date
users/{userId}/progress: [date DESC]

// AI sessions by timestamp
users/{userId}/ai_sessions: [timestamp DESC]
```

---

## 💾 Data Size Estimates

### Per User (After 1 Year)

- **Workouts**: ~150 workouts × 5KB = 750KB
- **Meals**: ~1,000 meals × 2KB = 2MB
- **Progress**: ~50 entries × 3KB = 150KB
- **AI Sessions**: ~500 chats × 1KB = 500KB
- **Total**: ~3.4MB per user per year

### For 1,000 Users

- **Total Data**: ~3.4GB
- **Well within Firebase free tier** (5GB storage)

---

## 🔄 Sync Strategy

### Offline-First Approach

1. Data writes go to local storage first
2. Background sync to Firebase when online
3. Conflict resolution: Last write wins
4. `synced` flag tracks sync status

### Sync Priority

1. **High**: Workouts, Progress (sync immediately)
2. **Medium**: Meals (sync within 5 minutes)
3. **Low**: AI sessions (sync when idle)

---

## 📝 Migration Strategy

### From Local to Cloud (Phase 5-8)

1. Read existing local data
2. Add `synced: false` flag
3. Batch upload to Firebase
4. Mark as `synced: true` after success
5. Keep local copy for offline access

---

## 🎯 Future Enhancements

Possible additions for v2.0:

- `workout_programs/` - Saved workout programs
- `friends/` - Social features
- `challenges/` - Community challenges
- `achievements/` - Badges and milestones
- `workout_plans/` - AI-generated plans

---

**End of Database Design Document**

*Last Updated: 2025-10-13*
