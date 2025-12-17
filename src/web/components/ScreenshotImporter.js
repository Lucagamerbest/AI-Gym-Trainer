/**
 * ScreenshotImporter - Web component for importing recipes/workouts from screenshots
 *
 * Features:
 * - Drag and drop image files
 * - Paste from clipboard (Ctrl+V)
 * - Enter image URL
 * - Exercise matching against database
 * - Variant selection for exercises
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllExercises } from '../../data/exerciseDatabase';

// Get all exercises from database for matching
const getExerciseDatabase = () => {
  try {
    return getAllExercises();
  } catch (e) {
    console.error('Could not load exercise database:', e);
    return [];
  }
};

// Normalize exercise name for matching
const normalizeExerciseName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Find best matching exercise from database
const findBestExerciseMatch = (name, exercises) => {
  if (!name) return null;

  const normalizedInput = normalizeExerciseName(name);

  // Try exact match first
  const exactMatch = exercises.find(ex =>
    normalizeExerciseName(ex.name) === normalizedInput
  );
  if (exactMatch) {
    return { exercise: exactMatch, score: 1, isExactMatch: true };
  }

  // Try partial match
  let bestMatch = null;
  let bestScore = 0;

  for (const exercise of exercises) {
    const normalizedDbName = normalizeExerciseName(exercise.name);

    // Check if one contains the other
    if (normalizedDbName.includes(normalizedInput) || normalizedInput.includes(normalizedDbName)) {
      const score = Math.min(normalizedInput.length, normalizedDbName.length) /
                   Math.max(normalizedInput.length, normalizedDbName.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { exercise, score, isExactMatch: false };
      }
    }

    // Check word overlap
    const inputWords = normalizedInput.split(' ');
    const dbWords = normalizedDbName.split(' ');
    const commonWords = inputWords.filter(w => dbWords.includes(w));
    const wordScore = commonWords.length / Math.max(inputWords.length, dbWords.length);
    if (wordScore > bestScore && wordScore >= 0.5) {
      bestScore = wordScore;
      bestMatch = { exercise, score: wordScore, isExactMatch: false };
    }
  }

  return bestMatch;
};

// Convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Fetch image from URL and convert to base64
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to fetch image from URL. Make sure the URL is accessible.');
  }
};

// Parse image using OpenAI Vision API
const parseImageWithAI = async (base64Image, contentType = 'auto') => {
  const apiKey = process.env.OPENAI_API_KEY || localStorage.getItem('openai_api_key');

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add your API key in settings.');
  }

  const systemPrompt = contentType === 'recipe'
    ? `You are an expert at extracting recipe information from images. Extract and return a JSON object with:
{
  "type": "recipe",
  "name": "Recipe name",
  "description": "Brief description",
  "servings": number,
  "prepTime": "prep time",
  "cookTime": "cook time",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number }
}`
    : contentType === 'workout'
    ? `You are an expert at extracting workout information from images. Extract and return a JSON object with:
{
  "type": "workout",
  "name": "Workout name",
  "description": "Brief description",
  "muscleGroups": ["muscle group 1"],
  "exercises": [
    {
      "name": "Exercise name (use common gym names like 'Bench Press', 'Lat Pulldown', 'Squat')",
      "sets": number,
      "reps": "rep range or number",
      "weight": "weight if specified",
      "notes": "any notes"
    }
  ]
}`
    : `Analyze this image and determine if it contains a RECIPE or WORKOUT. Then extract the relevant information.
If it's a RECIPE, return: { "type": "recipe", ... recipe fields }
If it's a WORKOUT, return: { "type": "workout", ... workout fields }
Use common exercise names like "Bench Press", "Squat", "Deadlift", "Lat Pulldown" etc.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: 'text', text: 'Please extract the content from this image and return it as JSON.' },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to analyze image');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const jsonMatch = content.match(/```json?\s*\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response. Please try again.');
  }
};

// Exercise Selection Modal
const ExerciseSelector = ({ exercise, matchedExercise, onSelect, onKeepCustom }) => {
  const [showVariants, setShowVariants] = useState(false);

  if (!matchedExercise) {
    return (
      <div style={{
        padding: '12px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '8px',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#F59E0B' }}>
              {exercise.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              No match found - will be added as custom exercise
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {exercise.sets} sets × {exercise.reps} reps
          </div>
        </div>
      </div>
    );
  }

  const variants = matchedExercise.variants || [];

  return (
    <div style={{
      padding: '12px',
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#10B981' }}>
            {matchedExercise.name}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Matched from: "{exercise.name}"
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {exercise.sets} sets × {exercise.reps} reps
        </div>
      </div>

      {variants.length > 0 && (
        <>
          <button
            onClick={() => setShowVariants(!showVariants)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              marginBottom: showVariants ? '8px' : 0,
            }}
          >
            {showVariants ? 'Hide variants' : `Select variant (${variants.length} available)`}
          </button>

          {showVariants && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {variants.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(matchedExercise, variant)}
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#8B5CF6',
                    cursor: 'pointer',
                  }}
                >
                  {variant.equipment}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ScreenshotImporter = ({ onImport, onClose, defaultType = 'auto' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ step: '', message: '', percent: 0 });
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [contentType, setContentType] = useState(defaultType);
  const [exerciseDatabase, setExerciseDatabase] = useState([]);
  const [matchedExercises, setMatchedExercises] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef(null);

  // Load exercise database on mount
  useEffect(() => {
    const db = getExerciseDatabase();
    setExerciseDatabase(db);
  }, []);

  // Handle paste event
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await processFile(file);
          }
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }
    setError(null);
    setResult(null);
    setShowReview(false);
    const previewUrl = URL.createObjectURL(file);
    setPreview({ url: previewUrl, file });
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return;
    setError(null);
    setResult(null);
    setShowReview(false);
    setIsProcessing(true);
    setProgress({ step: 'fetch', message: 'Fetching image from URL...', percent: 20 });

    try {
      const base64 = await urlToBase64(imageUrl.trim());
      setPreview({ url: imageUrl.trim(), base64 });
      setProgress({ step: 'ready', message: 'Image loaded!', percent: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeImage = async () => {
    if (!preview) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setShowReview(false);

    try {
      setProgress({ step: 'convert', message: 'Processing image...', percent: 20 });

      let base64;
      if (preview.base64) {
        base64 = preview.base64;
      } else if (preview.file) {
        base64 = await fileToBase64(preview.file);
      } else {
        throw new Error('No image data available');
      }

      setProgress({ step: 'analyze', message: 'Analyzing with AI...', percent: 50 });

      const parsed = await parseImageWithAI(base64, contentType);

      setProgress({ step: 'match', message: 'Matching exercises...', percent: 80 });

      // If it's a workout, match exercises against database
      if (parsed.type === 'workout' || parsed.exercises) {
        const exercises = parsed.exercises || [];
        const matched = exercises.map(ex => {
          const match = findBestExerciseMatch(ex.name, exerciseDatabase);
          return {
            original: ex,
            matched: match?.exercise || null,
            score: match?.score || 0,
            selectedVariant: match?.exercise?.variants?.[0] || null,
          };
        });
        setMatchedExercises(matched);
        setShowReview(true);
      }

      setProgress({ step: 'complete', message: 'Analysis complete!', percent: 100 });
      setResult(parsed);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectVariant = (index, exercise, variant) => {
    setMatchedExercises(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        matched: exercise,
        selectedVariant: variant,
      };
      return updated;
    });
  };

  const handleConfirmImport = () => {
    if (!result) return;

    // Build final result with matched exercises
    const finalResult = { ...result };

    if (matchedExercises.length > 0) {
      finalResult.exercises = matchedExercises.map(({ original, matched, selectedVariant }) => {
        if (matched) {
          return {
            ...matched,
            name: matched.name,
            displayName: matched.displayName || matched.name,
            sets: original.sets || 3,
            reps: original.reps || '10',
            equipment: selectedVariant?.equipment || matched.equipment || 'Not specified',
            selectedVariant: selectedVariant,
            muscleGroup: matched.muscleGroup,
            primaryMuscles: matched.primaryMuscles,
            secondaryMuscles: matched.secondaryMuscles,
            instructions: matched.instructions,
            variants: matched.variants,
          };
        }
        // Keep as custom exercise
        return {
          name: original.name,
          sets: original.sets || 3,
          reps: original.reps || '10',
          equipment: original.equipment || 'Not specified',
          isCustom: true,
        };
      });
    }

    if (onImport) {
      onImport(finalResult);
    }

    // Reset state
    setShowReview(false);
    setResult(null);
    setMatchedExercises([]);
  };

  const handleClear = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    setImageUrl('');
    setShowReview(false);
    setMatchedExercises([]);
    setProgress({ step: '', message: '', percent: 0 });
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '4px' }}>
            Import from Screenshot
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Drag & drop, paste (Ctrl+V), or enter an image URL
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['auto', 'recipe', 'workout'].map((type) => (
            <motion.button
              key={type}
              onClick={() => setContentType(type)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: contentType === type ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                color: contentType === type ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      {!preview && !showReview && (
        <>
          <motion.div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            animate={{
              borderColor: isDragging ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
              background: isDragging ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
            }}
            style={{
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>
              {isDragging ? '📥' : '📷'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              {isDragging ? 'Drop image here' : 'Drag & drop an image or click to browse'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Or press Ctrl+V to paste from clipboard
            </div>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or enter an image URL..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <motion.button
              onClick={handleUrlSubmit}
              disabled={!imageUrl.trim() || isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#8B5CF6',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '500',
                cursor: imageUrl.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                opacity: imageUrl.trim() && !isProcessing ? 1 : 0.5,
              }}
            >
              Load
            </motion.button>
          </div>
        </>
      )}

      {/* Preview */}
      {preview && !showReview && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img
              src={preview.url}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <motion.button
              onClick={handleClear}
              whileHover={{ scale: 1.1 }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.7)',
                color: '#FFFFFF',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </motion.button>
          </div>

          {!result && (
            <motion.button
              onClick={analyzeImage}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              {isProcessing ? progress.message : 'Analyze Screenshot'}
            </motion.button>
          )}
        </div>
      )}

      {/* Review Step - Exercise Matching */}
      {showReview && result && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', margin: 0 }}>
              Review Exercises
            </h4>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {matchedExercises.filter(e => e.matched).length}/{matchedExercises.length} matched
            </span>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {matchedExercises.map((item, index) => (
              <ExerciseSelector
                key={index}
                exercise={item.original}
                matchedExercise={item.matched}
                onSelect={(exercise, variant) => handleSelectVariant(index, exercise, variant)}
                onKeepCustom={() => handleSelectVariant(index, null, null)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <motion.button
              onClick={handleConfirmImport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#10B981',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Confirm & Save to App
            </motion.button>
            <motion.button
              onClick={handleClear}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isProcessing && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScreenshotImporter;
