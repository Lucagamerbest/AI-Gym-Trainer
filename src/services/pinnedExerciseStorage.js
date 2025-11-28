import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVariantImage } from '../utils/exerciseImages';

const STORAGE_KEY = '@pinned_exercises_v2';

/**
 * PinnedExerciseStorage - Manages user's pinned/favorite exercise variants
 * Pinned exercises appear at the top of exercise selection for quick access
 *
 * Stores the full exercise + variant info so they can be displayed as standalone cards
 */
export class PinnedExerciseStorage {
  /**
   * Pin a specific exercise variant (e.g., "Bench Press - Barbell")
   * @param {object} exercise - The base exercise object
   * @param {object} variant - The equipment variant (from exercise.variants)
   */
  static async pinVariant(exercise, variant) {
    try {
      const pinnedExercises = await this.getPinnedExercises();

      // Create unique key combining exercise ID and equipment
      const pinKey = `${exercise.id}_${variant.equipment}`;

      // Check if already pinned
      if (pinnedExercises.some(p => p.pinKey === pinKey)) {
        return { success: true, alreadyPinned: true };
      }

      // Get the variant-specific image
      const variantImage = getVariantImage(exercise.name, variant.equipment, 0);

      const pinnedEntry = {
        pinKey,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        equipment: variant.equipment,
        difficulty: variant.difficulty,
        muscleGroup: exercise.muscleGroup,
        image: variantImage, // Store variant-specific image
        // Store the full exercise and variant for display
        fullExercise: {
          ...exercise,
          displayName: exercise.name,
          name: `${exercise.name} (${variant.equipment})`,
          selectedVariant: variant,
          equipment: variant.equipment,
          difficulty: variant.difficulty,
          image: variantImage,
          isPinnedVariant: true,
        },
        pinnedAt: new Date().toISOString(),
      };

      const updatedPinned = [pinnedEntry, ...pinnedExercises]; // Add to start
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPinned));

      return { success: true, entry: pinnedEntry };
    } catch (error) {
      console.error('Error pinning exercise variant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unpin an exercise variant
   * @param {string} exerciseId - The exercise ID
   * @param {string} equipment - The equipment type
   */
  static async unpinVariant(exerciseId, equipment) {
    try {
      const pinnedExercises = await this.getPinnedExercises();
      const pinKey = `${exerciseId}_${equipment}`;

      const filteredPinned = pinnedExercises.filter(p => p.pinKey !== pinKey);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPinned));

      return { success: true };
    } catch (error) {
      console.error('Error unpinning exercise variant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Toggle pin status for an exercise variant
   */
  static async togglePinVariant(exercise, variant) {
    const isPinned = await this.isVariantPinned(exercise.id, variant.equipment);

    if (isPinned) {
      return await this.unpinVariant(exercise.id, variant.equipment);
    } else {
      return await this.pinVariant(exercise, variant);
    }
  }

  /**
   * Check if a specific variant is pinned
   */
  static async isVariantPinned(exerciseId, equipment) {
    try {
      const pinnedExercises = await this.getPinnedExercises();
      const pinKey = `${exerciseId}_${equipment}`;
      return pinnedExercises.some(p => p.pinKey === pinKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all pinned exercises
   * @returns {Array} Array of pinned exercise entries with full data
   */
  static async getPinnedExercises() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting pinned exercises:', error);
      return [];
    }
  }

  /**
   * Get pinned exercises as display-ready exercise objects
   * These can be directly shown in the exercise list
   */
  static async getPinnedExercisesForDisplay() {
    try {
      const pinnedExercises = await this.getPinnedExercises();
      return pinnedExercises.map(p => {
        // Get the image - try fullExercise.image first, then top-level image, then generate it
        let image = p.fullExercise?.image || p.image;
        if (!image && p.exerciseName && p.equipment) {
          // Generate image URL for older pinned exercises without stored image
          image = getVariantImage(p.exerciseName, p.equipment, 0);
        }

        return {
          ...p.fullExercise,
          image, // Ensure image is set
          isPinned: true,
          pinKey: p.pinKey,
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get pinned exercises filtered by muscle group
   */
  static async getPinnedExercisesByMuscleGroup(muscleGroups) {
    try {
      const pinnedExercises = await this.getPinnedExercisesForDisplay();

      if (!muscleGroups || muscleGroups.length === 0) {
        return pinnedExercises;
      }

      const muscleGroupsLower = muscleGroups.map(m => m.toLowerCase());
      return pinnedExercises.filter(ex =>
        muscleGroupsLower.includes(ex.muscleGroup?.toLowerCase())
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Get pinned exercise keys as a Set for quick lookup
   */
  static async getPinnedExerciseKeys() {
    try {
      const pinnedExercises = await this.getPinnedExercises();
      return new Set(pinnedExercises.map(p => p.pinKey));
    } catch (error) {
      return new Set();
    }
  }

  /**
   * Get count of pinned exercises
   */
  static async getPinnedCount() {
    try {
      const pinnedExercises = await this.getPinnedExercises();
      return pinnedExercises.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear all pinned exercises
   */
  static async clearAllPinned() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Legacy method for compatibility - no longer used for sorting
  static sortWithPinnedFirst(exercises, pinnedKeys) {
    return exercises;
  }
}
