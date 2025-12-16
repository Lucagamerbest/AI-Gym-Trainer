/**
 * ContentImportService - Orchestrates content import from various sources
 *
 * Handles importing recipes and workouts from:
 * - Camera (photo capture)
 * - Gallery (image selection)
 * - Documents (PDF files)
 * - Text (clipboard paste)
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseContentFromImage, parseContentFromText } from './tools/ContentParserTools';

// Storage keys
const RECIPES_KEY = '@saved_recipes';
const PROGRAMS_KEY = '@workout_programs';
const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

/**
 * Extract day number from a day name string
 * Handles: "Day 1", "Day 1 - Push", "D1", "Day1", "1. Push Day", etc.
 */
function extractDayNumberFromName(name) {
  if (!name) return null;

  // Pattern 1: "Day X" or "Day X -" or "Day X:"
  const dayPattern = /day\s*(\d+)/i;
  const dayMatch = name.match(dayPattern);
  if (dayMatch) {
    return parseInt(dayMatch[1]);
  }

  // Pattern 2: "DX" (D1, D2, etc.)
  const shortPattern = /\bD(\d+)\b/i;
  const shortMatch = name.match(shortPattern);
  if (shortMatch) {
    return parseInt(shortMatch[1]);
  }

  // Pattern 3: Starts with number "1. Push Day" or "1 - Push"
  const numberStartPattern = /^(\d+)[\s.\-:]/;
  const numberMatch = name.match(numberStartPattern);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  // Pattern 4: Weekday mapping
  const weekdays = {
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
    'sunday': 7, 'sun': 7,
  };

  const lowerName = name.toLowerCase();
  for (const [day, num] of Object.entries(weekdays)) {
    if (lowerName.includes(day)) {
      return num;
    }
  }

  return null;
}

/**
 * Request camera permissions
 */
async function requestCameraPermission() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
async function requestMediaLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Compress image for API upload (max 1024x1024)
 * Reduces file size and API costs
 */
async function compressImage(uri) {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024, height: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Image compression failed:', error);
    return uri; // Return original if compression fails
  }
}

/**
 * Convert image URI to base64
 */
async function imageToBase64(uri) {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error('Image to base64 conversion failed:', error);
    throw new Error('Failed to process image');
  }
}


class ContentImportService {
  constructor() {
    this.onProgress = null;
    this.onError = null;
  }

  /**
   * Set progress callback for UI updates
   */
  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  /**
   * Set error callback for UI updates
   */
  setErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Report progress to UI
   */
  reportProgress(step, message, percent) {
    if (this.onProgress) {
      this.onProgress({ step, message, percent });
    }
  }

  /**
   * Report error to UI
   */
  reportError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Import from camera - Take a photo
   * @param {Object} options - Import options
   * @param {string} options.contentHint - 'recipe', 'workout', or 'auto'
   * @param {string} options.userId - User ID
   */
  async importFromCamera(options = {}) {
    const { contentHint = 'auto', userId } = options;

    try {
      // Check permissions
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return {
          success: false,
          message: 'Camera permission is required to take photos. Please enable it in settings.',
        };
      }

      this.reportProgress('capture', 'Opening camera...', 10);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) {
        return {
          success: false,
          message: 'Photo capture cancelled.',
          cancelled: true,
        };
      }

      const imageUri = result.assets[0].uri;
      return await this.processImage(imageUri, contentHint, userId);

    } catch (error) {
      console.error('Camera import error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to capture photo. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Import from gallery - Select one or multiple images
   * @param {Object} options - Import options
   * @param {boolean} options.allowMultiple - Allow selecting multiple images
   */
  async importFromGallery(options = {}) {
    const { contentHint = 'auto', userId, allowMultiple = false } = options;

    try {
      // Check permissions
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        return {
          success: false,
          message: 'Photo library permission is required. Please enable it in settings.',
        };
      }

      this.reportProgress('select', 'Opening photo library...', 10);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: !allowMultiple, // Can't edit when selecting multiple
        allowsMultipleSelection: allowMultiple,
        selectionLimit: allowMultiple ? 10 : 1, // Max 10 images for multi-day programs
        aspect: [4, 3],
      });

      if (result.canceled) {
        return {
          success: false,
          message: 'Image selection cancelled.',
          cancelled: true,
        };
      }

      // Handle multiple images (multi-day program)
      if (allowMultiple && result.assets.length > 1) {
        return await this.processMultipleImages(result.assets, contentHint, userId);
      }

      // Single image
      const imageUri = result.assets[0].uri;
      return await this.processImage(imageUri, contentHint, userId);

    } catch (error) {
      console.error('Gallery import error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to load image. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Process multiple images as a multi-day workout program
   * Each image represents one day of the program
   * IMPORTANT: Day order is determined by content in images, NOT by selection order
   */
  async processMultipleImages(assets, contentHint, userId) {
    try {
      const totalImages = assets.length;
      const days = [];

      // Each image gets an equal portion of the 10-90% range
      const progressPerImage = 80 / totalImages;

      for (let i = 0; i < totalImages; i++) {
        const asset = assets[i];
        const baseProgress = 10 + (i * progressPerImage);

        // Step 1: Starting this image (0% of this image's portion)
        this.reportProgress(
          'process',
          `Processing image ${i + 1} of ${totalImages}...`,
          Math.round(baseProgress)
        );

        // Step 2: Compressing (20% of this image's portion)
        this.reportProgress(
          'compress',
          `Optimizing image ${i + 1}...`,
          Math.round(baseProgress + progressPerImage * 0.2)
        );
        const compressedUri = await compressImage(asset.uri);

        // Step 3: Converting (40% of this image's portion)
        this.reportProgress(
          'convert',
          `Converting image ${i + 1}...`,
          Math.round(baseProgress + progressPerImage * 0.4)
        );
        const base64 = await imageToBase64(compressedUri);

        // Step 4: Analyzing with AI (60% of this image's portion)
        this.reportProgress(
          'parse',
          `Analyzing image ${i + 1} with AI...`,
          Math.round(baseProgress + progressPerImage * 0.6)
        );

        // Parse this day's workout
        const { parseContentFromImage } = await import('./tools/ContentParserTools');
        const dayResult = await parseContentFromImage({
          imageBase64: base64,
          contentHint: 'workout', // Force workout for multi-image
          userId,
        });

        // Step 5: Done with this image (100% of this image's portion)
        this.reportProgress(
          'process',
          `Completed image ${i + 1} of ${totalImages}`,
          Math.round(baseProgress + progressPerImage)
        );

        if (dayResult.success && dayResult.data) {
          // Extract the day data
          const dayData = dayResult.data.day || (dayResult.data.days && dayResult.data.days[0]) || {
            exercises: [],
            muscleGroups: [],
          };

          // Skip if no exercises were found (empty/invalid workout)
          if (!dayData.exercises || dayData.exercises.length === 0) {
            continue;
          }

          // USE the parsed dayNumber from the image content, NOT the image order
          // The AI reads "Day 3" from the image and sets dayNumber: 3
          let parsedDayNumber = parseInt(dayData.dayNumber) || null;

          // FALLBACK: Extract day number from the name if dayNumber is missing or seems wrong
          // Look for patterns like "Day 1", "Day 2", "Day1", "D1", etc.
          const dayName = dayData.name || '';
          const dayNumberFromName = extractDayNumberFromName(dayName);

          // If we found a day number in the name, prefer it (AI often gets name right but dayNumber wrong)
          if (dayNumberFromName !== null) {
            parsedDayNumber = dayNumberFromName;
          }

          days.push({
            id: `day_temp_${i}`, // Temporary ID, will be reassigned after sorting
            dayNumber: parsedDayNumber, // Use parsed day number (can be null if not found)
            name: dayName || `Day ${parsedDayNumber || '?'}`,
            exercises: dayData.exercises || [],
            muscleGroups: dayData.muscleGroups || [],
            _imageIndex: i,
          });
        }
      }

      // Check if we got any valid days
      if (days.length === 0) {
        return {
          success: false,
          message: 'No workout content found in the selected images. Please try with images that contain exercises, sets, and reps.',
        };
      }

      // SORT days by their parsed dayNumber
      // Days without a dayNumber go to the end
      days.sort((a, b) => {
        const dayA = a.dayNumber || 999;
        const dayB = b.dayNumber || 999;
        return dayA - dayB;
      });

      // Reassign IDs and fill in missing dayNumbers after sorting
      days.forEach((day, index) => {
        day.id = `day_${index}`;
        if (!day.dayNumber) {
          day.dayNumber = index + 1;
          day.name = day.name.replace('Day ?', `Day ${index + 1}`);
        }
        delete day._imageIndex; // Clean up temp field
      });

      // Calculate how many images were skipped
      const skippedCount = totalImages - days.length;

      this.reportProgress('complete', 'All days processed!', 100);

      // Generate a creative program name based on the workout content
      const programName = this.generateProgramName(days);

      // Combine all days into a program
      const program = {
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: programName,
        description: `Program imported from ${totalImages} images${skippedCount > 0 ? ` (${skippedCount} skipped - no workout content)` : ''}`,
        type: 'custom',
        difficulty: 'intermediate',
        source: 'imported',
        importedAt: new Date().toISOString(),
        confidence: 0.8,
        isStandalone: false, // Multi-image is always a program
        days: days,
      };

      return {
        success: true,
        message: skippedCount > 0
          ? `Parsed ${days.length} workout days (${skippedCount} image${skippedCount > 1 ? 's' : ''} skipped - no workout content)`
          : `Successfully parsed ${days.length}-day workout program!`,
        contentType: 'workout',
        data: program,
        action: 'workout_imported',
        confidence: 0.8,
        needsReview: true,
        isMultiDay: true,
      };

    } catch (error) {
      console.error('Multi-image processing error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to process images. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Import from document - Select an image file
   * Note: PDF import removed - users should take screenshots instead
   * @param {Object} options - Import options
   */
  async importFromDocument(options = {}) {
    const { contentHint = 'auto', userId } = options;

    try {
      this.reportProgress('select', 'Opening file picker...', 10);

      // Launch document picker - images only
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return {
          success: false,
          message: 'File selection cancelled.',
          cancelled: true,
        };
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const mimeType = file.mimeType;

      // Handle based on file type
      if (mimeType && mimeType.startsWith('image/')) {
        return await this.processImage(fileUri, contentHint, userId);
      } else {
        return {
          success: false,
          message: 'Unsupported file type. Please select an image file (PNG, JPG, etc.)',
        };
      }

    } catch (error) {
      console.error('Document import error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to load document. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Import from text - Parse pasted text
   * @param {string} text - Text content to parse
   * @param {Object} options - Import options
   */
  async importFromText(text, options = {}) {
    const { contentHint = 'auto', userId } = options;

    try {
      if (!text || text.trim().length < 20) {
        return {
          success: false,
          message: 'Please provide more text content to parse (at least 20 characters).',
        };
      }

      this.reportProgress('start', 'Starting...', 10);
      this.reportProgress('parse', 'Preparing text...', 25);
      this.reportProgress('parse', 'Analyzing text content...', 40);

      // Parse the text
      const result = await parseContentFromText({
        text: text.trim(),
        contentHint,
        userId,
      });

      this.reportProgress('parse', 'AI analysis complete', 85);
      this.reportProgress('complete', 'Parsing complete!', 100);

      return result;

    } catch (error) {
      console.error('Text import error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to parse text content. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Process multiple images for a SINGLE RECIPE
   * All images are combined into one recipe (unlike workouts where each image = one day)
   */
  async processMultipleImagesForRecipe(assets, userId) {
    try {
      const totalImages = assets.length;
      const imagesBase64 = [];

      // Each image gets an equal portion of the 10-80% range for processing
      const progressPerImage = 70 / totalImages;

      for (let i = 0; i < totalImages; i++) {
        const asset = assets[i];
        const baseProgress = 10 + (i * progressPerImage);

        // Step 1: Processing this image
        this.reportProgress(
          'process',
          `Processing image ${i + 1} of ${totalImages}...`,
          Math.round(baseProgress)
        );

        // Step 2: Compressing
        this.reportProgress(
          'compress',
          `Optimizing image ${i + 1}...`,
          Math.round(baseProgress + progressPerImage * 0.3)
        );
        const compressedUri = await compressImage(asset.uri);

        // Step 3: Converting to base64
        this.reportProgress(
          'convert',
          `Converting image ${i + 1}...`,
          Math.round(baseProgress + progressPerImage * 0.6)
        );
        const base64 = await imageToBase64(compressedUri);
        imagesBase64.push(base64);

        // Step 4: Done with this image
        this.reportProgress(
          'process',
          `Prepared image ${i + 1} of ${totalImages}`,
          Math.round(baseProgress + progressPerImage)
        );
      }

      // Step 5: AI Analysis (all images at once)
      this.reportProgress(
        'parse',
        `Analyzing ${totalImages} images with AI...`,
        85
      );

      // Parse all images together into one recipe
      const { parseRecipeFromMultipleImages } = await import('./tools/ContentParserTools');
      const result = await parseRecipeFromMultipleImages({
        imagesBase64,
        userId,
      });

      this.reportProgress('complete', 'Analysis complete!', 100);

      return result;

    } catch (error) {
      console.error('Multi-image recipe processing error:', error);
      this.reportError(error.message);
      return {
        success: false,
        message: 'Failed to process images. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Process image - Compress, convert to base64, and parse
   */
  async processImage(uri, contentHint, userId) {
    try {
      this.reportProgress('start', 'Starting...', 5);

      this.reportProgress('compress', 'Optimizing image...', 15);

      // Compress image
      const compressedUri = await compressImage(uri);

      this.reportProgress('compress', 'Image optimized', 30);
      this.reportProgress('convert', 'Processing image...', 40);

      // Convert to base64
      const base64 = await imageToBase64(compressedUri);

      this.reportProgress('convert', 'Image processed', 50);
      this.reportProgress('parse', 'Analyzing content with AI...', 60);

      // Parse with Vision API
      const result = await parseContentFromImage({
        imageBase64: base64,
        contentHint,
        userId,
      });

      this.reportProgress('parse', 'AI analysis complete', 90);
      this.reportProgress('complete', 'Analysis complete!', 100);

      return result;

    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Generate a creative program name based on the workout days
   */
  generateProgramName(days) {
    if (!days || days.length === 0) {
      return 'Custom Workout Program';
    }

    // Collect all muscle groups and day names
    const allMuscleGroups = new Set();
    const dayNames = [];

    days.forEach(day => {
      if (day.muscleGroups) {
        day.muscleGroups.forEach(mg => allMuscleGroups.add(mg.toLowerCase()));
      }
      if (day.name) {
        dayNames.push(day.name.toLowerCase());
      }
    });

    // Detect common split types
    const muscles = Array.from(allMuscleGroups);
    const hasPush = muscles.some(m => ['chest', 'shoulders', 'triceps'].includes(m)) || dayNames.some(n => n.includes('push'));
    const hasPull = muscles.some(m => ['back', 'biceps', 'lats'].includes(m)) || dayNames.some(n => n.includes('pull'));
    const hasLegs = muscles.some(m => ['legs', 'quads', 'hamstrings', 'glutes', 'calves'].includes(m)) || dayNames.some(n => n.includes('leg'));
    const hasUpper = dayNames.some(n => n.includes('upper'));
    const hasLower = dayNames.some(n => n.includes('lower'));
    const hasFullBody = dayNames.some(n => n.includes('full body') || n.includes('fullbody'));

    // Generate name based on detected patterns
    if (hasPush && hasPull && hasLegs && days.length >= 3) {
      return `${days.length}-Day Push/Pull/Legs Split`;
    } else if (hasUpper && hasLower) {
      return `${days.length}-Day Upper/Lower Split`;
    } else if (hasFullBody) {
      return `${days.length}-Day Full Body Program`;
    } else if (hasPush && hasPull) {
      return `${days.length}-Day Push/Pull Program`;
    } else if (days.length === 1) {
      // Single day - use the day name or muscle groups
      const day = days[0];
      if (day.name && !day.name.toLowerCase().includes('day 1')) {
        return day.name;
      } else if (muscles.length > 0) {
        const muscleStr = muscles.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ');
        return `${muscleStr} Workout`;
      }
    }

    // Default: list primary muscle groups
    if (muscles.length > 0) {
      const primaryMuscles = muscles.slice(0, 3).map(m => m.charAt(0).toUpperCase() + m.slice(1));
      return `${days.length}-Day ${primaryMuscles.join('/')} Program`;
    }

    return `${days.length}-Day Training Program`;
  }

  /**
   * Save imported recipe to storage
   */
  async saveRecipe(recipe) {
    try {
      const savedRecipesStr = await AsyncStorage.getItem(RECIPES_KEY);
      const savedRecipes = savedRecipesStr ? JSON.parse(savedRecipesStr) : [];

      // Add timestamp if not present
      if (!recipe.savedAt) {
        recipe.savedAt = new Date().toISOString();
      }

      savedRecipes.push(recipe);
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(savedRecipes));

      return {
        success: true,
        message: `Recipe "${recipe.name}" saved successfully!`,
        recipeId: recipe.id,
      };
    } catch (error) {
      console.error('Save recipe error:', error);
      return {
        success: false,
        message: 'Failed to save recipe. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Save imported workout to storage
   * Automatically saves to standalone workouts or programs based on isStandalone flag
   */
  async saveWorkout(workout) {
    try {
      // Add timestamp if not present
      if (!workout.savedAt) {
        workout.savedAt = new Date().toISOString();
      }

      // Determine storage key based on workout type
      const isStandalone = workout.isStandalone === true;
      const storageKey = isStandalone ? STANDALONE_WORKOUTS_KEY : PROGRAMS_KEY;
      const typeLabel = isStandalone ? 'Workout' : 'Program';

      // Get existing items
      const savedItemsStr = await AsyncStorage.getItem(storageKey);
      const savedItems = savedItemsStr ? JSON.parse(savedItemsStr) : [];

      // Add new workout
      savedItems.push(workout);
      await AsyncStorage.setItem(storageKey, JSON.stringify(savedItems));

      return {
        success: true,
        message: `${typeLabel} "${workout.name}" saved successfully!`,
        workoutId: workout.id,
        isStandalone,
      };
    } catch (error) {
      console.error('Save workout error:', error);
      return {
        success: false,
        message: 'Failed to save workout. Please try again.',
        error: error.message,
      };
    }
  }

  /**
   * Save imported content (auto-detects type)
   */
  async saveContent(data, contentType) {
    if (contentType === 'recipe') {
      return await this.saveRecipe(data);
    } else if (contentType === 'workout') {
      return await this.saveWorkout(data);
    }
    return {
      success: false,
      message: 'Unknown content type',
    };
  }
}

// Export singleton instance
export default new ContentImportService();

// Also export the class for testing
export { ContentImportService };
