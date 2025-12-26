/**
 * PreloadService - Preloads and caches heavy assets for instant loading
 *
 * Caches:
 * - 3D model HTML (for WebView)
 * - Exercise database (warm up)
 * - User images (prefetch URLs)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { exerciseDatabase, getAllExercises } from '../data/exerciseDatabase';
import { generateModel3DHTML } from '../utils/model3DGenerator';

const CACHE_KEYS = {
  MODEL_HTML: 'cached_model_html',
  MODEL_CACHE_TIME: 'model_cache_timestamp',
  EXERCISES_LOADED: 'exercises_preloaded',
};

// Cache duration: 7 days for model HTML
const MODEL_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

class PreloadServiceClass {
  constructor() {
    this.exercisesLoaded = false;
    this.modelHtmlCached = null;
    this.allExercises = null;
    this.exercisesByMuscle = {};
    this.isPreloading = false;
    this.preloadPromise = null;
  }

  /**
   * Main preload function - call at app startup
   */
  async preloadAll() {
    if (this.isPreloading) {
      return this.preloadPromise;
    }

    this.isPreloading = true;
    this.preloadPromise = this._doPreload();

    try {
      await this.preloadPromise;
    } finally {
      this.isPreloading = false;
    }

    return true;
  }

  async _doPreload() {
    console.log('🚀 PreloadService: Starting preload...');
    const startTime = Date.now();

    try {
      // Run all preloads in parallel
      await Promise.all([
        this.preloadExerciseDatabase(),
        this.preloadModelHtml(),
      ]);

      const elapsed = Date.now() - startTime;
      console.log(`✅ PreloadService: Complete in ${elapsed}ms`);
    } catch (error) {
      console.error('❌ PreloadService: Error during preload:', error);
    }
  }

  /**
   * Preload exercise database into memory
   */
  async preloadExerciseDatabase() {
    if (this.exercisesLoaded) {
      console.log('📚 Exercises already loaded');
      return;
    }

    console.log('📚 PreloadService: Loading exercise database...');
    const start = Date.now();

    try {
      // Load all exercises into memory
      this.allExercises = getAllExercises();

      // Pre-organize by muscle group for faster access
      const muscleGroups = ['chest', 'shoulders', 'back', 'biceps', 'triceps', 'abs', 'legs', 'forearms', 'cardio'];

      for (const muscle of muscleGroups) {
        this.exercisesByMuscle[muscle] = exerciseDatabase[muscle] || [];
      }

      // Also pre-map leg sub-regions
      const legExercises = exerciseDatabase.legs || [];
      this.exercisesByMuscle.quads = legExercises.filter(e =>
        e.primaryMuscles?.some(m => m.toLowerCase().includes('quad'))
      );
      this.exercisesByMuscle.hamstrings = legExercises.filter(e =>
        e.primaryMuscles?.some(m => m.toLowerCase().includes('hamstring'))
      );
      this.exercisesByMuscle.glutes = legExercises.filter(e =>
        e.primaryMuscles?.some(m => m.toLowerCase().includes('glute'))
      );
      this.exercisesByMuscle.calves = legExercises.filter(e =>
        e.primaryMuscles?.some(m => m.toLowerCase().includes('calf') || m.toLowerCase().includes('calves'))
      );

      this.exercisesLoaded = true;
      console.log(`📚 Loaded ${this.allExercises.length} exercises in ${Date.now() - start}ms`);
    } catch (error) {
      console.error('Error preloading exercises:', error);
    }
  }

  /**
   * Get cached exercises by muscle group (instant)
   */
  getExercisesByMuscle(muscleGroup) {
    const group = muscleGroup?.toLowerCase();
    return this.exercisesByMuscle[group] || [];
  }

  /**
   * Get all exercises (instant)
   */
  getAllExercises() {
    return this.allExercises || getAllExercises();
  }

  /**
   * Preload and cache 3D model HTML
   */
  async preloadModelHtml() {
    console.log('🎨 PreloadService: Checking model cache...');

    try {
      // Check if we have a valid cached version
      const [cachedHtml, cacheTime] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.MODEL_HTML),
        AsyncStorage.getItem(CACHE_KEYS.MODEL_CACHE_TIME),
      ]);

      const now = Date.now();
      const cacheAge = cacheTime ? now - parseInt(cacheTime, 10) : Infinity;

      if (cachedHtml && cacheAge < MODEL_CACHE_DURATION) {
        this.modelHtmlCached = cachedHtml;
        console.log(`🎨 Model HTML loaded from cache (age: ${Math.round(cacheAge / 1000 / 60)}min)`);
        return;
      }

      // Generate fresh HTML and cache it
      console.log('🎨 Generating fresh model HTML...');
      const html = this.generateModelHtml();

      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.MODEL_HTML, html),
        AsyncStorage.setItem(CACHE_KEYS.MODEL_CACHE_TIME, now.toString()),
      ]);

      this.modelHtmlCached = html;
      console.log('🎨 Model HTML cached successfully');
    } catch (error) {
      console.error('Error caching model HTML:', error);
      // Generate on-the-fly as fallback
      this.modelHtmlCached = this.generateModelHtml();
    }
  }

  /**
   * Get cached model HTML (instant)
   */
  getModelHtml() {
    if (this.modelHtmlCached) {
      return this.modelHtmlCached;
    }
    // Fallback to generating if not cached
    return this.generateModelHtml();
  }

  /**
   * Generate the 3D model HTML content using shared generator
   */
  generateModelHtml() {
    return generateModel3DHTML();
  }

  /**
   * Clear all caches (for debugging/reset)
   */
  async clearCache() {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.MODEL_HTML,
      CACHE_KEYS.MODEL_CACHE_TIME,
    ]);
    this.modelHtmlCached = null;
    this.exercisesLoaded = false;
    this.allExercises = null;
    this.exercisesByMuscle = {};
    console.log('🗑️ PreloadService: Cache cleared');
  }
}

// Export singleton instance
export const PreloadService = new PreloadServiceClass();
export default PreloadService;
