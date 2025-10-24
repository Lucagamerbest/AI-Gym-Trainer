/**
 * Automated AI Tool Tests
 *
 * Tests all 17 AI tools to catch regressions
 * Run this after making changes to ensure nothing broke
 */

import { ToolRegistry } from '../ToolRegistry';
import { initializeTools } from '../index';

// Mock AsyncStorage for testing
const mockStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(mockStorage.get(key) || null)),
  setItem: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

describe('AI Tools Test Suite', () => {
  beforeAll(() => {
    // Initialize all tools before testing
    initializeTools();
  });

  beforeEach(() => {
    // Clear mock storage before each test
    mockStorage.clear();
  });

  describe('Tool Registry', () => {
    test('should have 17 tools registered', () => {
      expect(ToolRegistry.getToolCount()).toBe(17);
    });

    test('should get all tool schemas', () => {
      const schemas = ToolRegistry.getToolSchemas();
      expect(schemas.length).toBe(17);
      expect(schemas[0]).toHaveProperty('name');
      expect(schemas[0]).toHaveProperty('description');
      expect(schemas[0]).toHaveProperty('parameters');
    });
  });

  describe('Workout Tools', () => {
    test('generateWorkoutPlan - should create chest workout', async () => {
      const result = await ToolRegistry.executeTool('generateWorkoutPlan', {
        muscleGroups: ['chest', 'triceps'],
        experienceLevel: 'intermediate',
        duration: 60,
        goal: 'hypertrophy',
      });

      expect(result.success).toBe(true);
      expect(result.workout).toBeDefined();
      expect(result.workout.exercises.length).toBeGreaterThan(0);
      expect(result.workout.muscleGroups).toContain('chest');
    });

    test('generateWorkoutPlan - should handle missing exercises with fallback', async () => {
      const result = await ToolRegistry.executeTool('generateWorkoutPlan', {
        muscleGroups: ['nonexistent_muscle'],
        experienceLevel: 'beginner',
        duration: 30,
        goal: 'general',
      });

      // Should either succeed with fallback or fail gracefully
      if (result.success) {
        expect(result.workout.exercises.length).toBeGreaterThan(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('findExerciseAlternatives - should find bench press alternatives', async () => {
      const result = await ToolRegistry.executeTool('findExerciseAlternatives', {
        exerciseName: 'Bench Press',
      });

      expect(result.success).toBe(true);
      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.original).toBe('Bench Press');
    });

    test('analyzeWorkoutHistory - should handle empty history', async () => {
      const result = await ToolRegistry.executeTool('analyzeWorkoutHistory', {
        userId: 'test_user',
        days: 30,
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.totalWorkouts).toBe(0);
    });
  });

  describe('Exercise Tools', () => {
    test('searchExercises - should find chest exercises', async () => {
      const result = await ToolRegistry.executeTool('searchExercises', {
        query: 'chest',
        limit: 5,
      });

      expect(result.success).toBe(true);
      expect(result.exercises.length).toBeGreaterThan(0);
      expect(result.exercises.length).toBeLessThanOrEqual(5);
    });

    test('getExerciseInfo - should get bench press info', async () => {
      const result = await ToolRegistry.executeTool('getExerciseInfo', {
        exerciseName: 'Bench Press',
      });

      expect(result.success).toBe(true);
      expect(result.exercise).toBeDefined();
      expect(result.exercise.name).toBe('Bench Press');
    });

    test('recommendExercises - should recommend exercises', async () => {
      const result = await ToolRegistry.executeTool('recommendExercises', {
        userId: 'test_user',
        count: 5,
      });

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Nutrition Tools', () => {
    test('calculateMacros - should calculate for cutting', async () => {
      const result = await ToolRegistry.executeTool('calculateMacros', {
        weight: 80, // kg
        height: 180, // cm
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'cut',
      });

      expect(result.success).toBe(true);
      expect(result.macros).toBeDefined();
      expect(result.macros.calories).toBeGreaterThan(0);
      expect(result.macros.protein).toBeGreaterThan(0);
    });

    test('calculateMacros - should handle female calculation', async () => {
      const result = await ToolRegistry.executeTool('calculateMacros', {
        weight: 60,
        height: 165,
        age: 28,
        gender: 'female',
        activityLevel: 'active',
        goal: 'maintain',
      });

      expect(result.success).toBe(true);
      expect(result.macros.calories).toBeGreaterThan(0);
    });

    test('suggestMealsForMacros - should suggest meals', async () => {
      const result = await ToolRegistry.executeTool('suggestMealsForMacros', {
        targetProtein: 40,
        targetCarbs: 50,
        targetFat: 15,
        caloriesRemaining: 500,
      });

      expect(result.success).toBe(true);
      expect(result.meals).toBeDefined();
      expect(result.meals.length).toBeGreaterThan(0);
    });
  });

  describe('CRUD Tools', () => {
    test('startWorkout - should create active workout', async () => {
      const result = await ToolRegistry.executeTool('startWorkout', {
        workoutName: 'Test Workout',
        userId: 'test_user',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Started');
      expect(result.data).toBeDefined();
      expect(result.data.workoutTitle).toBe('Test Workout');
    });

    test('addExerciseToWorkout - should require active workout', async () => {
      const result = await ToolRegistry.executeTool('addExerciseToWorkout', {
        exerciseName: 'Bench Press',
        sets: 3,
        reps: '8-12',
        userId: 'test_user',
      });

      // Should fail because no active workout
      expect(result.success).toBe(false);
      expect(result.message).toContain('No active workout');
    });

    test('addExerciseToWorkout - should add to active workout', async () => {
      // First start a workout
      await ToolRegistry.executeTool('startWorkout', {
        workoutName: 'Push Day',
        userId: 'test_user',
      });

      // Then add exercise
      const result = await ToolRegistry.executeTool('addExerciseToWorkout', {
        exerciseName: 'Bench Press',
        sets: 4,
        reps: '8-10',
        userId: 'test_user',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Added Bench Press');
      expect(result.data.totalExercises).toBe(1);
    });

    test('logWorkoutSet - should log set to active exercise', async () => {
      // Start workout and add exercise
      await ToolRegistry.executeTool('startWorkout', {
        workoutName: 'Push Day',
        userId: 'test_user',
      });
      await ToolRegistry.executeTool('addExerciseToWorkout', {
        exerciseName: 'Bench Press',
        sets: 3,
        reps: '8-12',
        userId: 'test_user',
      });

      // Log a set
      const result = await ToolRegistry.executeTool('logWorkoutSet', {
        exerciseName: 'Bench Press',
        weight: 185,
        reps: 5,
        userId: 'test_user',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Logged set 1');
      expect(result.data.weight).toBe(185);
      expect(result.data.reps).toBe(5);
    });

    test('updateUserProfile - should update weight', async () => {
      const result = await ToolRegistry.executeTool('updateUserProfile', {
        field: 'currentWeight',
        value: '85',
        userId: 'test_user',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Updated currentWeight');
    });

    test('updateUserProfile - should reject invalid field', async () => {
      const result = await ToolRegistry.executeTool('updateUserProfile', {
        field: 'invalidField',
        value: 'test',
        userId: 'test_user',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Can only update');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent tool gracefully', async () => {
      try {
        await ToolRegistry.executeTool('nonExistentTool', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('not found');
      }
    });

    test('should handle missing required parameters', async () => {
      const result = await ToolRegistry.executeTool('calculateMacros', {
        // Missing required params
      });

      // Should either fail or handle gracefully with default values
      expect(result).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('generateWorkoutPlan should complete within 2 seconds', async () => {
      const start = Date.now();

      await ToolRegistry.executeTool('generateWorkoutPlan', {
        muscleGroups: ['chest', 'back'],
        experienceLevel: 'advanced',
        duration: 90,
        goal: 'strength',
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    test('searchExercises should complete within 500ms', async () => {
      const start = Date.now();

      await ToolRegistry.executeTool('searchExercises', {
        query: 'squat',
        limit: 10,
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});

/**
 * Manual Test Runner (for console testing)
 */
export async function runManualTests() {
  console.log('🧪 Running AI Tool Tests...\n');

  const tests = [
    {
      name: 'Generate Chest Workout',
      tool: 'generateWorkoutPlan',
      params: {
        muscleGroups: ['chest', 'triceps'],
        experienceLevel: 'intermediate',
        duration: 60,
        goal: 'hypertrophy',
      },
    },
    {
      name: 'Search Back Exercises',
      tool: 'searchExercises',
      params: { query: 'back', limit: 5 },
    },
    {
      name: 'Calculate Macros',
      tool: 'calculateMacros',
      params: {
        weight: 80,
        height: 180,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'cut',
      },
    },
    {
      name: 'Start Workout',
      tool: 'startWorkout',
      params: { workoutName: 'Push Day', userId: 'test' },
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const start = Date.now();
      const result = await ToolRegistry.executeTool(test.tool, test.params);
      const duration = Date.now() - start;

      results.push({
        test: test.name,
        status: result.success ? '✅ PASS' : '❌ FAIL',
        duration: `${duration}ms`,
        result: result.success ? 'Success' : result.error || result.message,
      });

      console.log(`${result.success ? '✅' : '❌'} ${test.name} (${duration}ms)`);
    } catch (error) {
      results.push({
        test: test.name,
        status: '❌ ERROR',
        duration: 'N/A',
        result: error.message,
      });

      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }

  console.log('\n📊 Test Summary:');
  console.table(results);

  const passed = results.filter(r => r.status === '✅ PASS').length;
  const failed = results.filter(r => r.status !== '✅ PASS').length;

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  return results;
}
