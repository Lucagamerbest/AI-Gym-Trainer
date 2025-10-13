/**
 * TypeScript Type Definitions for AI Gym Trainer
 *
 * These types define the structure of all data in the app.
 * They match the database schema in docs/api/DATABASE_DESIGN.md
 */

// ============================================
// USER TYPES
// ============================================

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  createdAt: string;
  updatedAt: string;
  settings: UserSettings;
  goals: UserGoals;
  stats?: UserStats;
}

export interface UserSettings {
  units: 'imperial' | 'metric';
  theme: 'light' | 'dark';
  notifications?: boolean;
}

export interface UserGoals {
  targetWeight?: number | null;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  weeklyWorkouts?: number;
}

export interface UserStats {
  totalWorkouts: number;
  totalVolume: number;
  currentStreak: number;
  longestStreak: number;
}

// ============================================
// WORKOUT TYPES
// ============================================

export interface Workout {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime?: string | null;
  duration: number; // seconds
  exercises: WorkoutExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  muscleGroups: string[];
  workoutType?: string | null;
  notes?: string | null;
  synced: boolean;
  localId?: string | null;
  syncedAt?: string | null;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: WorkoutSet[];
  restTime: number; // seconds
  supersetWith?: string | null;
}

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  reps: number;
  type: 'normal' | 'warmup' | 'dropset' | 'failure';
  completed: boolean;
  rpe?: number | null; // Rate of Perceived Exertion (1-10)
  notes?: string | null;
}

// ============================================
// NUTRITION/MEAL TYPES
// ============================================

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
  mealPhoto?: string | null;
  barcodePhoto?: string | null;
  notes?: string | null;
  location?: string | null;
  synced: boolean;
  syncedAt?: string | null;
}

export interface MealFood {
  foodId: string;
  foodName: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  barcode?: string | null;
  photo?: string | null;
}

// ============================================
// PROGRESS TRACKING TYPES
// ============================================

export interface ProgressEntry {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number | null;
  measurements?: BodyMeasurements;
  photos?: ProgressPhoto[];
  notes?: string | null;
  mood?: string | null;
  energyLevel?: number | null; // 1-10
  synced: boolean;
  syncedAt?: string | null;
}

export interface BodyMeasurements {
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  leftArm?: number | null;
  rightArm?: number | null;
  leftThigh?: number | null;
  rightThigh?: number | null;
  leftCalf?: number | null;
  rightCalf?: number | null;
  shoulders?: number | null;
  neck?: number | null;
}

export interface ProgressPhoto {
  url: string;
  angle: 'front' | 'back' | 'side';
  thumbnail?: string | null;
}

// ============================================
// AI SESSION TYPES
// ============================================

export interface AISession {
  id: string;
  userId: string;
  timestamp: string;
  context: AIContext;
  userMessage: string;
  aiResponse: string;
  model: string;
  responseTime: number; // milliseconds
  tokensUsed: number;
  helpful?: boolean | null;
  rating?: number | null; // 1-5
  synced: boolean;
  syncedAt?: string | null;
}

export interface AIContext {
  screen: string;
  activity?: string | null;
  relevantData: Record<string, any>;
}

// ============================================
// EXERCISE DATABASE TYPES
// ============================================

export interface Exercise {
  id: string;
  name: string;
  alternateNames?: string[];
  category: string; // 'strength', 'cardio', 'flexibility'
  muscleGroups: {
    primary: string[];
    secondary: string[];
  };
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips?: string[];
  commonMistakes?: string[];
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  variations?: string[];
  tags?: string[];
}

// ============================================
// FOOD DATABASE TYPES
// ============================================

export interface Food {
  id: string;
  name: string;
  brand?: string | null;
  fdcId?: number | null; // USDA FoodData Central ID
  barcode?: string | null;
  nutrition: FoodNutrition;
  category: string;
  tags?: string[];
  source: string; // 'usda', 'open_food_facts', 'user'
  verified: boolean;
  imageUrl?: string | null;
}

export interface FoodNutrition {
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  vitaminA?: number | null;
  vitaminC?: number | null;
  calcium?: number | null;
  iron?: number | null;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Generic response type for API calls
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Sync status for offline-first architecture
 */
export interface SyncStatus {
  lastSyncTime?: string;
  pendingChanges: number;
  syncing: boolean;
  error?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset?: number;
  cursor?: string;
}

/**
 * Date range for queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================
// AI PROVIDER TYPES
// ============================================

/**
 * AI message format
 */
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/**
 * AI provider response
 */
export interface AIResponse {
  response: string;
  tokensUsed: number;
  model: string;
  responseTime: number;
}

/**
 * AI provider interface (for switching between Gemini/Claude/GPT)
 */
export interface AIProvider {
  send(systemPrompt: string, userMessage: string): Promise<string>;
  getName(): string;
  getModel(): string;
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  // Re-export for convenience
  User,
  UserSettings,
  UserGoals,
  UserStats,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Meal,
  MealFood,
  ProgressEntry,
  BodyMeasurements,
  ProgressPhoto,
  AISession,
  AIContext,
  Exercise,
  Food,
  FoodNutrition,
  ApiResponse,
  SyncStatus,
  PaginationParams,
  DateRange,
  AIMessage,
  AIResponse,
  AIProvider,
};
