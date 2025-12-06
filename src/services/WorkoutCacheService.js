/**
 * WorkoutCacheService - Pre-generates workouts using REAL AI thinking
 *
 * Strategy: When user completes assessment, AI generates 2 variations of each workout type
 * (push, pull, legs, upper, full_body) in the background. Uses Gemini AI to THINK about
 * proper exercises (machines > bodyweight, respects blacklist, gym-bro style).
 *
 * Benefits:
 * - Instant workout delivery (1st and 2nd request use pre-generated workouts)
 * - REAL AI thinking (not algorithmic templates)
 * - Respects user preferences (no squats if blacklisted, proper gym exercises)
 * - Smart fallback (generates fresh workout if user asks for 3rd+ time)
 * - Background generation (happens after assessment, user doesn't wait)
 */

import { generateWorkoutWithAI } from './ai/tools/AIWorkoutGenerator';
import { getUserProfile } from './userProfileService';
import BackendService from './backend/BackendService';

// Workout types to cache
const WORKOUT_TYPES = ['push', 'pull', 'legs', 'upper', 'full_body'];

// Number of variations per workout type (reduced to 2 for AI generation speed)
const VARIATIONS_PER_TYPE = 2;

// Cache expiration (7 days)
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

class WorkoutCacheService {
  /**
   * Generate all cached workouts for a user
   * This is called after AI assessment or when profile changes
   */
  static async generateAllCachedWorkouts(userId) {
    const startTime = Date.now();

    try {
      // Validation
      if (!userId || userId === 'guest') {
        return { success: false, error: 'Guest users cannot use caching' };
      }

      // Get user profile
      const profile = await getUserProfile(userId);

      if (!profile) {
        console.error('❌ [WorkoutCache] No profile found for user');
        return { success: false, error: 'No profile found' };
      }

        experienceLevel: profile.experienceLevel,
        equipmentCount: profile.equipmentAccess?.length || 0,
        goal: profile.primaryGoal,
        blacklistedExercises: profile.dislikedExercises?.length || 0,
      });

      // Generate variations for each workout type
      const cache = {
        workouts: {},
        lastGenerated: Date.now(),
        profileHash: this.hashProfile(profile),
      };

      let totalGenerated = 0;

      for (const type of WORKOUT_TYPES) {

        try {
          const variations = await this.generateVariations(type, profile, userId);
          cache.workouts[type] = variations;
          totalGenerated += variations.length;
        } catch (error) {
          console.error(`❌ [WorkoutCache] Failed to generate ${type} workouts:`, error);
          cache.workouts[type] = []; // Empty array for failed type
        }
      }

      // Save to Firebase
      await BackendService.setCachedWorkouts(userId, cache);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      return { success: true, cache, totalGenerated, duration };

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ [WorkoutCache] Cache generation failed after ${duration}s:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate multiple variations of a workout type using AI
   */
  static async generateVariations(type, profile, userId) {
    const variations = [];


    for (let i = 0; i < VARIATIONS_PER_TYPE; i++) {
      try {

        const result = await generateWorkoutWithAI({
          workoutType: type,
          userProfile: profile,
          variationIndex: i,
        });

        if (result.success && result.workout) {
          const exerciseCount = result.workout.exercises?.length || 0;

          variations.push({
            ...result.workout,
            generatedAt: Date.now(),
            variationIndex: i,
          });
        } else {
          console.warn(`  ⚠️ Variation ${i + 1}: AI generation failed - ${result.error}`);
        }
      } catch (error) {
        console.error(`  ❌ Variation ${i + 1} failed:`, error.message || error);
      }
    }

    if (variations.length === 0) {
      throw new Error(`Failed to generate any ${type} workout variations with AI`);
    }

    return variations;
  }

  /**
   * Get a cached workout (random from unseen ones, or any if all seen)
   */
  static async getCachedWorkout(userId, type) {

    try {
      if (userId === 'guest') {
        return null;
      }

      // Get cache from Firebase
      const cache = await BackendService.getCachedWorkouts(userId);

      if (!cache) {

        // Trigger background generation
        this.generateAllCachedWorkouts(userId).catch(err => {
          console.error('❌ [WorkoutCache] Background generation failed:', err);
        });

        return null;
      }


      // Validate cache
      const isValid = await this.isCacheValid(cache, userId);

      if (!isValid) {

        // Trigger background regeneration (don't wait for it)
        this.generateAllCachedWorkouts(userId).catch(err => {
          console.error('❌ [WorkoutCache] Background regeneration failed:', err);
        });

        return null; // Return null to trigger real-time generation
      }

      // Get workouts for this type
      const workouts = cache.workouts?.[type] || [];

      if (workouts.length === 0) {
        return null;
      }

      // Get user's workout usage stats (which ones they've already seen)
      const usageStats = await BackendService.getWorkoutUsageStats(userId, type);
      const seenIndices = usageStats?.seenVariations || [];


      // Find unseen workouts
      const unseenWorkouts = workouts.filter(w => !seenIndices.includes(w.variationIndex));

      // Pick a workout (prefer unseen, fallback to random)
      const selectedWorkout = unseenWorkouts.length > 0
        ? unseenWorkouts[Math.floor(Math.random() * unseenWorkouts.length)]
        : workouts[Math.floor(Math.random() * workouts.length)];

      const wasUnseen = unseenWorkouts.length > 0;

      // Mark this variation as seen
      await BackendService.markWorkoutAsSeen(userId, type, selectedWorkout.variationIndex);

      return selectedWorkout;

    } catch (error) {
      console.error('❌ [WorkoutCache] Failed to get cached workout:', error);
      return null; // Fallback to real-time generation
    }
  }

  /**
   * Check if cache is valid (not expired, profile hasn't changed)
   */
  static async isCacheValid(cache, userId) {
    if (!cache || !cache.lastGenerated || !cache.workouts) {
      return false;
    }

    // Check age (7 days max)
    const age = Date.now() - cache.lastGenerated;
    if (age > CACHE_MAX_AGE) {
      return false;
    }

    // Check if profile changed
    const profile = await getUserProfile(userId);
    const currentHash = this.hashProfile(profile);

    if (currentHash !== cache.profileHash) {
      return false;
    }

    return true;
  }

  /**
   * Hash user profile to detect changes
   * Only includes fields that affect workout generation
   */
  static hashProfile(profile) {
    const relevantFields = {
      equipmentAccess: profile.equipmentAccess || [],
      dislikedExercises: profile.dislikedExercises || [],
      favoriteExercises: profile.favoriteExercises || [],
      experienceLevel: profile.experienceLevel || '',
      injuries: profile.injuries || [],
      primaryGoal: profile.primaryGoal || '',
      workoutStyle: profile.workoutStyle || '',
    };

    // Simple hash: JSON stringify and sort keys
    const sortedJson = JSON.stringify(relevantFields, Object.keys(relevantFields).sort());
    return sortedJson;
  }

  /**
   * Invalidate cache and regenerate (called when user updates profile)
   */
  static async invalidateAndRegenerate(userId) {

    try {
      // Delete old cache
      await BackendService.deleteCachedWorkouts(userId);

      // Generate new cache in background
      this.generateAllCachedWorkouts(userId).catch(err => {
        console.error('❌ [WorkoutCache] Background regeneration failed:', err);
      });

      return { success: true };
    } catch (error) {
      console.error('❌ [WorkoutCache] Failed to invalidate cache:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cache status (for debugging/UI display)
   */
  static async getCacheStatus(userId) {
    try {
      const cache = await BackendService.getCachedWorkouts(userId);

      if (!cache || !cache.workouts) {
        return {
          exists: false,
          message: 'No cache found',
        };
      }

      const age = Date.now() - cache.lastGenerated;
      const daysOld = Math.round(age / (24 * 60 * 60 * 1000));
      const isValid = await this.isCacheValid(cache, userId);

      const workoutCounts = {};
      for (const type of WORKOUT_TYPES) {
        workoutCounts[type] = cache.workouts[type]?.length || 0;
      }

      return {
        exists: true,
        valid: isValid,
        age: daysOld,
        lastGenerated: new Date(cache.lastGenerated).toLocaleString(),
        workoutCounts,
        profileHash: cache.profileHash?.substring(0, 20) + '...',
      };

    } catch (error) {
      console.error('❌ [WorkoutCache] Failed to get cache status:', error);
      return {
        exists: false,
        error: error.message,
      };
    }
  }
}

export default WorkoutCacheService;
