import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'custom_exercises';

export class CustomExerciseStorage {
  // Save a new custom exercise
  static async saveCustomExercise(exerciseData) {
    try {
      const existingExercises = await this.getCustomExercises();

      const newExercise = {
        id: `custom_${Date.now()}`,
        name: exerciseData.name,
        description: exerciseData.description,
        instructions: exerciseData.description, // Use description as instructions for compatibility
        muscleGroup: exerciseData.muscleGroup,
        difficulty: 'Custom', // Mark as custom
        equipment: 'Custom Equipment',
        image: exerciseData.image,
        isCustom: true,
        createdAt: new Date().toISOString(),
        usageCount: 0 // Track how often this exercise is used
      };

      const updatedExercises = [...existingExercises, newExercise];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExercises));

      return { success: true, exercise: newExercise };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all custom exercises
  static async getCustomExercises() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  // Get custom exercises by muscle group
  static async getCustomExercisesByMuscleGroup(muscleGroup) {
    try {
      const customExercises = await this.getCustomExercises();
      return customExercises.filter(exercise => exercise.muscleGroup === muscleGroup);
    } catch (error) {
      return [];
    }
  }

  // Increment usage count when exercise is selected
  static async incrementUsageCount(exerciseId) {
    try {
      const customExercises = await this.getCustomExercises();
      const updatedExercises = customExercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return { ...exercise, usageCount: (exercise.usageCount || 0) + 1 };
        }
        return exercise;
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExercises));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete a custom exercise
  static async deleteCustomExercise(exerciseId) {
    try {
      const customExercises = await this.getCustomExercises();
      const filteredExercises = customExercises.filter(exercise => exercise.id !== exerciseId);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredExercises));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get exercise statistics
  static async getExerciseStats() {
    try {
      const customExercises = await this.getCustomExercises();

      const stats = {
        totalCustomExercises: customExercises.length,
        byMuscleGroup: {},
        mostUsed: null
      };

      // Count by muscle group
      customExercises.forEach(exercise => {
        const muscle = exercise.muscleGroup;
        stats.byMuscleGroup[muscle] = (stats.byMuscleGroup[muscle] || 0) + 1;
      });

      // Find most used exercise
      if (customExercises.length > 0) {
        stats.mostUsed = customExercises.reduce((prev, current) =>
          (prev.usageCount || 0) > (current.usageCount || 0) ? prev : current
        );
      }

      return stats;
    } catch (error) {
      return {
        totalCustomExercises: 0,
        byMuscleGroup: {},
        mostUsed: null
      };
    }
  }

  // Clear all custom exercises (for debugging/reset)
  static async clearAllCustomExercises() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}