/**
 * WorkoutPlanService.js
 *
 * Service for searching, filtering, and adapting workout plans
 * Handles equipment compatibility and plan customization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURATED_WORKOUT_PLANS, EQUIPMENT_PROFILES } from './CuratedWorkoutPlans';
import UserEquipmentStorage from './userEquipmentStorage';
import { exerciseDatabase } from '../data/exerciseDatabase';

const WORKOUT_PROGRAMS_KEY = '@workout_programs';

class WorkoutPlanService {
  /**
   * Search and filter plans based on criteria
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered plans
   */
  async searchPlans(filters = {}) {
    let plans = [...CURATED_WORKOUT_PLANS];

    // Filter by split type
    if (filters.splitType) {
      plans = plans.filter(p => p.splitType === filters.splitType);
    }

    // Filter by days per week
    if (filters.daysPerWeek) {
      plans = plans.filter(p => p.daysPerWeek === filters.daysPerWeek);
    }

    // Filter by goal
    if (filters.goal) {
      plans = plans.filter(p => p.goal === filters.goal);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      plans = plans.filter(p => p.difficulty === filters.difficulty);
    }

    // Filter by equipment profile
    if (filters.equipmentProfile) {
      plans = plans.filter(p => p.equipmentProfile === filters.equipmentProfile);
    }

    // Filter by max workout time
    if (filters.maxTimePerWorkout) {
      plans = plans.filter(p => p.timePerWorkout <= filters.maxTimePerWorkout);
    }

    // Filter by min workout time
    if (filters.minTimePerWorkout) {
      plans = plans.filter(p => p.timePerWorkout >= filters.minTimePerWorkout);
    }

    // Filter by duration weeks
    if (filters.maxDurationWeeks) {
      plans = plans.filter(p => p.durationWeeks <= filters.maxDurationWeeks);
    }
    if (filters.minDurationWeeks) {
      plans = plans.filter(p => p.durationWeeks >= filters.minDurationWeeks);
    }

    // Filter by target muscles (any match)
    if (filters.targetMuscles && filters.targetMuscles.length > 0) {
      plans = plans.filter(p =>
        filters.targetMuscles.some(muscle =>
          p.targetMuscles.includes(muscle)
        )
      );
    }

    // Search by name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      plans = plans.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort results
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'popular':
          // Featured first, then by name
          plans.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.name.localeCompare(b.name);
          });
          break;
        case 'difficulty':
          const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          plans.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
          break;
        case 'duration':
          plans.sort((a, b) => a.durationWeeks - b.durationWeeks);
          break;
        case 'newest':
          plans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        default:
          break;
      }
    }

    return plans;
  }

  /**
   * Get all available plans
   * @returns {Array} All curated plans
   */
  getAllPlans() {
    return [...CURATED_WORKOUT_PLANS];
  }

  /**
   * Get plan by ID
   * @param {string} planId - Plan ID
   * @returns {Object|null} Plan or null if not found
   */
  getPlanById(planId) {
    return CURATED_WORKOUT_PLANS.find(p => p.id === planId) || null;
  }

  /**
   * Check plan compatibility with user's equipment
   * @param {Object} plan - Workout plan to check
   * @returns {Promise<Object>} Compatibility report
   */
  async checkPlanCompatibility(plan) {
    const userEquipment = await UserEquipmentStorage.getAvailableEquipment();
    const missingEquipment = new Set();
    const adaptableExercises = [];
    const incompatibleExercises = [];
    let totalExercises = 0;
    let compatibleExercises = 0;

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        totalExercises++;

        // Check if user has primary equipment
        const hasPrimary = userEquipment.some(eq =>
          eq.toLowerCase() === exercise.primaryEquipment.toLowerCase()
        );

        if (hasPrimary) {
          compatibleExercises++;
        } else {
          // Check for alternate equipment
          const hasAlternate = exercise.alternateEquipment?.some(alt =>
            userEquipment.some(eq => eq.toLowerCase() === alt.toLowerCase())
          );

          if (hasAlternate) {
            compatibleExercises++;
            const availableAlt = exercise.alternateEquipment.find(alt =>
              userEquipment.some(eq => eq.toLowerCase() === alt.toLowerCase())
            );
            adaptableExercises.push({
              dayName: day.name,
              exerciseName: exercise.name,
              from: exercise.primaryEquipment,
              to: availableAlt,
            });
          } else {
            incompatibleExercises.push({
              dayName: day.name,
              exerciseName: exercise.name,
              requiredEquipment: exercise.primaryEquipment,
              alternatives: exercise.alternateEquipment || [],
            });
            missingEquipment.add(exercise.primaryEquipment);
          }
        }
      }
    }

    const compatibilityScore = Math.round((compatibleExercises / totalExercises) * 100);

    return {
      isFullyCompatible: incompatibleExercises.length === 0,
      isAdaptable: adaptableExercises.length > 0 || incompatibleExercises.length === 0,
      compatibilityScore,
      missingEquipment: Array.from(missingEquipment),
      adaptableExercises,
      incompatibleExercises,
      totalExercises,
      compatibleExercises,
    };
  }

  /**
   * Adapt plan to user's available equipment
   * @param {Object} plan - Plan to adapt
   * @returns {Promise<Object>} Adapted plan
   */
  async adaptPlanToEquipment(plan) {
    const userEquipment = await UserEquipmentStorage.getAvailableEquipment();
    const adaptedPlan = JSON.parse(JSON.stringify(plan)); // Deep clone

    for (const day of adaptedPlan.days) {
      for (let i = 0; i < day.exercises.length; i++) {
        const exercise = day.exercises[i];

        // Check if user has the primary equipment
        const hasPrimary = userEquipment.some(eq =>
          eq.toLowerCase() === exercise.primaryEquipment.toLowerCase()
        );

        if (!hasPrimary) {
          // Find an alternative equipment
          const availableAlt = exercise.alternateEquipment?.find(alt =>
            userEquipment.some(eq => eq.toLowerCase() === alt.toLowerCase())
          );

          if (availableAlt) {
            // Adapt the exercise to use available equipment
            exercise.originalEquipment = exercise.primaryEquipment;
            exercise.primaryEquipment = availableAlt;
            exercise.adapted = true;

            // Look up variant-specific info from exercise database
            const dbExercise = this._findExerciseInDatabase(exercise.exerciseId);
            if (dbExercise) {
              const variant = dbExercise.variants?.find(v =>
                v.equipment.toLowerCase() === availableAlt.toLowerCase()
              );
              if (variant) {
                exercise.variantInfo = {
                  difficulty: variant.difficulty,
                  pros: variant.pros?.slice(0, 2),
                  setupTips: variant.setupTips?.slice(0, 2),
                };
              }
            }
          } else {
            // Try to find a substitute exercise
            const substitute = await this._findSubstituteExercise(
              exercise,
              day.targetMuscles,
              userEquipment
            );

            if (substitute) {
              day.exercises[i] = {
                ...substitute,
                substitutedFor: exercise.name,
                originalExercise: exercise,
                sets: exercise.sets,
              };
            } else {
              exercise.noSubstitute = true;
              exercise.warning = 'No compatible equipment or substitute found';
            }
          }
        }
      }
    }

    adaptedPlan.isAdapted = true;
    adaptedPlan.adaptedAt = new Date().toISOString();

    return adaptedPlan;
  }

  /**
   * Find substitute exercise for incompatible equipment
   * @private
   */
  async _findSubstituteExercise(exercise, targetMuscles, userEquipment) {
    // Search exercise database for exercises targeting same muscles
    for (const muscleGroup of targetMuscles) {
      const exercises = exerciseDatabase[muscleGroup.toLowerCase()] || [];

      for (const dbExercise of exercises) {
        if (dbExercise.id === exercise.exerciseId) continue;

        // Check equipment compatibility
        const equipmentList = dbExercise.equipment?.split(',').map(e => e.trim()) || [];
        const compatibleEquipment = equipmentList.find(eq =>
          userEquipment.some(userEq => userEq.toLowerCase() === eq.toLowerCase())
        );

        if (compatibleEquipment) {
          return {
            exerciseId: dbExercise.id,
            name: dbExercise.name,
            primaryEquipment: compatibleEquipment,
            alternateEquipment: equipmentList.filter(eq => eq !== compatibleEquipment),
            primaryMuscles: dbExercise.primaryMuscles,
            difficulty: dbExercise.difficulty,
          };
        }
      }
    }

    return null;
  }

  /**
   * Find exercise in database by ID
   * @private
   */
  _findExerciseInDatabase(exerciseId) {
    for (const muscleGroup of Object.keys(exerciseDatabase)) {
      const found = exerciseDatabase[muscleGroup].find(ex => ex.id === exerciseId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Save plan to user's programs
   * @param {Object} plan - Plan to save
   * @returns {Promise<Object>} Result with saved program
   */
  async savePlanToPrograms(plan) {
    try {
      const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      const programs = storedPrograms ? JSON.parse(storedPrograms) : [];

      // Convert curated plan to program format
      const newProgram = {
        id: Date.now().toString(),
        name: plan.name,
        description: plan.description,
        days: plan.days.map(day => ({
          id: day.id || `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: day.name,
          exercises: day.exercises.map(ex => ({
            id: ex.exerciseId,
            name: ex.name,
            equipment: ex.primaryEquipment,
            targetMuscle: day.targetMuscles?.[0] || 'General',
            sets: ex.sets.map(set => ({
              type: set.type || 'normal',
              reps: set.reps,
              rest: set.rest,
            })),
            notes: ex.notes || '',
            adapted: ex.adapted,
            substitutedFor: ex.substitutedFor,
          })),
        })),
        weeklySchedule: plan.weeklySchedule,
        createdAt: new Date().toISOString(),
        source: 'discover',
        originalPlanId: plan.id,
        originalPlanName: plan.name,
        goal: plan.goal,
        difficulty: plan.difficulty,
        durationWeeks: plan.durationWeeks,
      };

      programs.push(newProgram);
      await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs));

      return { success: true, program: newProgram };
    } catch (error) {
      console.error('Error saving plan to programs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if plan is already saved
   * @param {string} planId - Original plan ID
   * @returns {Promise<boolean>} True if already saved
   */
  async isPlanSaved(planId) {
    try {
      const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      const programs = storedPrograms ? JSON.parse(storedPrograms) : [];
      return programs.some(p => p.originalPlanId === planId);
    } catch {
      return false;
    }
  }

  /**
   * Get featured plans
   * @returns {Array} Featured plans
   */
  getFeaturedPlans() {
    return CURATED_WORKOUT_PLANS.filter(p => p.featured);
  }

  /**
   * Get plans by equipment profile
   * @param {string} profileType - Equipment profile type
   * @returns {Array} Plans for the profile
   */
  getPlansByEquipmentProfile(profileType) {
    return CURATED_WORKOUT_PLANS.filter(p => p.equipmentProfile === profileType);
  }
}

export default new WorkoutPlanService();
