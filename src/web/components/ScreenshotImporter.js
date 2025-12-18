/**
 * ScreenshotImporter - Web component for importing recipes/workouts from screenshots
 *
 * Features:
 * - Drag and drop image files
 * - Paste from clipboard (Ctrl+V)
 * - Enter image URL
 * - Exercise matching against database using sophisticated fuzzy matching
 * - Variant selection for exercises
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllExercises } from '../../data/exerciseDatabase';
import { findBestExerciseMatch as findBestMatch } from '../../utils/exerciseNameMatcher';

// Exercise image base URL from free-exercise-db
const EXERCISE_IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Mapping of exercise names to their image IDs per equipment variant
// Must match the exact equipment names from exerciseDatabase.js
const EXERCISE_IMAGE_MAP = {
  // CHEST
  "Bench Press": { "Barbell": "Barbell_Bench_Press_-_Medium_Grip", "Dumbbell": "Dumbbell_Bench_Press", "Smith Machine": "Smith_Machine_Bench_Press", "Machine": "Lever_Chest_Press" },
  "Incline Bench Press": { "Barbell": "Barbell_Incline_Bench_Press_-_Medium_Grip", "Dumbbell": "Incline_Dumbbell_Press", "Smith Machine": "Smith_Machine_Incline_Bench_Press", "Machine": "Leverage_Incline_Chest_Press" },
  "Decline Bench Press": { "Barbell": "Decline_Barbell_Bench_Press", "Dumbbell": "Decline_Dumbbell_Bench_Press", "Smith Machine": "Smith_Machine_Decline_Press" },
  "Chest Fly": { "Dumbbell": "Dumbbell_Flyes", "Cable": "Cable_Crossover", "Machine (Pec Deck)": "Butterfly" },
  "Cable Crossover": { "High to Low": "Cable_Crossover", "Low to High": "Low_Cable_Crossover", "Middle": "Cable_Crossover" },
  "Push-ups": { "Standard": "Pushups", "Wide Grip": "Push-Up_Wide", "Diamond": "Push-Ups_-_Close_Triceps_Position", "Decline": "Decline_Push-Up" },
  "Chest Dips": { "Bodyweight": "Dips_-_Triceps_Version", "Weighted (Dip Belt)": "Dips_-_Triceps_Version", "Assisted Machine": "Dip_Machine" },
  "Machine Chest Press": { "Machine Seated": "Lever_Chest_Press" },

  // BACK
  "Lat Pulldown": { "Wide Grip": "Wide-Grip_Lat_Pulldown", "Close Grip": "Close-Grip_Front_Lat_Pulldown", "Reverse Grip (Supinated)": "Underhand_Cable_Pulldowns", "V-Bar (Neutral Grip)": "V-Bar_Pulldown", "Wide Neutral Grip": "Wide-Grip_Lat_Pulldown", "Single Arm": "One_Arm_Lat_Pulldown", "Dual Handles": "Full_Range-Of-Motion_Lat_Pulldown" },
  "Cable Row": { "Low Angle (lats focus)": "Seated_Cable_Rows", "Mid Angle (rhomboids/traps focus)": "Seated_Cable_Rows", "High Angle (upper back/rear delts focus)": "Leverage_High_Row" },
  "One Arm Row": { "Dumbbell": "One-Arm_Dumbbell_Row", "Cable": "Seated_One-arm_Cable_Pulley_Rows" },
  "Pullover": { "Cable": "Rope_Straight-Arm_Pulldown", "Dumbbell": "Bent-Arm_Dumbbell_Pullover", "Machine": "Rope_Straight-Arm_Pulldown" },
  "Pull Ups": { "Wide Grip": "Wide-Grip_Rear_Pull-Up", "Shoulder Width": "Pullups" },
  "Chin Up": { "Shoulder Width": "Chin-Up", "Narrow Grip": "Chin-Up" },
  "T-Bar Row": { "T-Bar Machine": "Lying_T-Bar_Row", "Landmine Barbell": "Lying_T-Bar_Row" },
  "Cable Incline Pushdown": { "Straight Bar": "Triceps_Pushdown", "Rope Attachment": "Triceps_Pushdown_-_Rope_Attachment" },

  // SHOULDERS
  "Shoulder Press": { "Barbell": "Barbell_Shoulder_Press", "Dumbbell Seated": "Dumbbell_Shoulder_Press", "Machine": "Leverage_Shoulder_Press", "Smith Machine": "Smith_Machine_Overhead_Shoulder_Press" },
  "Lateral Raise": { "Dumbbell": "Side_Lateral_Raise", "Cable Single": "Cable_Seated_Lateral_Raise", "Cable Both": "Cable_Seated_Lateral_Raise", "Machine": "Side_Lateral_Raise" },
  "Front Raise": { "Barbell": "Standing_Front_Barbell_Raise_Over_Head", "Dumbbell": "Front_Dumbbell_Raise", "Cable": "Front_Cable_Raise", "Plate": "Front_Plate_Raise" },
  "Shrugs": { "Barbell": "Barbell_Shrug", "Dumbbell": "Dumbbell_Shrug", "Smith Machine": "Smith_Machine_Behind_the_Back_Shrug", "Trap Bar": "Barbell_Shrug" },
  "Rear Delt Fly": { "Cable Bent": "Cable_Rear_Delt_Fly", "Machine Pec Deck Reverse": "Reverse_Machine_Flyes", "Dumbbell Bent": "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench" },
  "Upright Row": { "Barbell": "Upright_Barbell_Row", "Dumbbell": "Standing_Dumbbell_Upright_Row", "Cable": "Upright_Cable_Row", "EZ Bar": "Upright_Row_-_With_Bands" },
  "Face Pull": { "Cable Rope": "Face_Pull", "Resistance Band": "Face_Pull" },

  // BICEPS
  "Bicep Curl": { "Incline Dumbbell": "Alternate_Incline_Dumbbell_Curl", "Barbell": "Barbell_Curl", "EZ Bar": "EZ-Bar_Curl", "Dumbbell Standing": "Dumbbell_Bicep_Curl", "Cable Standing": "Standing_Biceps_Cable_Curl" },
  "One Arm Bicep Curl": { "Dumbbell": "Dumbbell_Alternate_Bicep_Curl", "Cable Low": "Standing_One-Arm_Cable_Curl", "Cable Mid": "Standing_One-Arm_Cable_Curl" },
  "Hammer Curl": { "Cable Rope": "Cable_Hammer_Curls_-_Rope_Attachment", "Dumbbell": "Alternate_Hammer_Curl", "Dumbbell Seated": "Incline_Hammer_Curls" },
  "Preacher Curl": { "Machine": "Machine_Preacher_Curls", "Dumbbell": "One_Arm_Dumbbell_Preacher_Curl", "Cable Single": "Cable_Preacher_Curl", "Cable Rope": "Cable_Preacher_Curl", "EZ Bar": "Preacher_Curl" },
  "Concentration Curl": { "Dumbbell Seated": "Concentration_Curls", "Cable Kneeling": "Standing_Concentration_Curl" },

  // TRICEPS
  "Tricep Pushdown": { "Cable Rope": "Triceps_Pushdown_-_Rope_Attachment", "Straight Bar": "Triceps_Pushdown", "V-Bar": "Triceps_Pushdown_-_V-Bar_Attachment" },
  "One Arm Tricep Pushdown": { "Single Handle": "Cable_One_Arm_Tricep_Extension", "Rope": "Standing_Low-Pulley_One-Arm_Triceps_Extension" },
  "Overhead Tricep Extension": { "Cable Rope": "Cable_Rope_Overhead_Triceps_Extension", "Dumbbell Two-Handed": "Standing_Dumbbell_Triceps_Extension", "EZ Bar": "Incline_Barbell_Triceps_Extension" },
  "One Arm Overhead Extension": { "Dumbbell": "Dumbbell_One-Arm_Triceps_Extension", "Cable": "Kneeling_Cable_Triceps_Extension" },
  "Skull Crusher": { "EZ Bar": "EZ-Bar_Skullcrusher", "Barbell": "Lying_Triceps_Press", "Dumbbell": "Decline_Dumbbell_Triceps_Extension" },
  "Dips": { "Parallel Bars": "Dips_-_Triceps_Version", "Assisted Machine": "Dip_Machine", "Bench Dips": "Bench_Dips" },
  "Close Grip Bench Press": { "Barbell": "Close-Grip_Barbell_Bench_Press", "Smith Machine": "Smith_Machine_Close-Grip_Bench_Press", "Dumbbell": "Close-Grip_Dumbbell_Press" },

  // ABS
  "Crunches": { "Bodyweight Floor": "Crunches", "Cable Kneeling": "Cable_Crunch", "Machine": "Ab_Crunch_Machine" },
  "Plank": { "Bodyweight": "Plank", "Weighted": "Plank", "Elevated Feet": "Plank" },
  "Leg Raises": { "Hanging": "Hanging_Leg_Raise", "Captain's Chair": "Captains_Chair_Leg_Raise", "Lying Floor": "Flat_Bench_Lying_Leg_Raise" },
  "Russian Twist": { "Bodyweight": "Russian_Twist", "Medicine Ball": "Russian_Twist", "Dumbbell": "Russian_Twist", "Cable": "Cable_Russian_Twists" },
  "Ab Wheel Rollout": { "Knees": "Ab_Roller", "Standing": "Ab_Roller", "Barbell Rollout": "Barbell_Ab_Rollout" },
  "Mountain Climbers": { "Bodyweight": "Mountain_Climbers", "Slider Discs": "Mountain_Climbers" },
  "Sit-Ups": { "Bodyweight Floor": "Sit-Up", "Decline Bench": "Decline_Crunch", "Weighted Plate": "Weighted_Sit-Ups_-_With_Bands" },

  // LEGS
  "Leg Extension": { "Machine": "Leg_Extensions", "Cable": "One-Legged_Cable_Kickback" },
  "Leg Curl": { "Lying Machine": "Lying_Leg_Curls", "Seated Machine": "Seated_Leg_Curl", "Standing Machine": "Standing_Leg_Curl" },
  "Standing Calf Raise": { "Machine": "Standing_Calf_Raises", "Smith Machine": "Smith_Machine_Calf_Raise", "Barbell": "Standing_Barbell_Calf_Raise" },
  "Seated Calf Raise": { "Machine": "Seated_Calf_Raise", "Dumbbell": "Dumbbell_Seated_One-Leg_Calf_Raise" },
  "Squat": { "Barbell Back": "Barbell_Squat", "Smith Machine": "Smith_Machine_Squat", "Dumbbell Goblet": "Dumbbell_Squat" },
  "Front Squat": { "Barbell": "Front_Barbell_Squat", "Dumbbell": "Dumbbell_Squat", "Smith Machine": "Smith_Machine_Squat" },
  "Hack Squat": { "Machine": "Hack_Squat", "Barbell Reverse": "Barbell_Hack_Squat" },
  "Hip Thrust": { "Barbell": "Barbell_Hip_Thrust", "Dumbbell": "Barbell_Hip_Thrust", "Machine": "Hip_Extension" },
  "Lunges": { "Dumbbell Walking": "Dumbbell_Lunges", "Barbell Walking": "Barbell_Walking_Lunge", "Dumbbell Stationary": "Dumbbell_Lunges", "Bodyweight": "Bodyweight_Walking_Lunge", "Reverse Lunge": "Dumbbell_Rear_Lunge" },
  "Bulgarian Split Squat": { "Dumbbell": "Split_Squat_with_Dumbbells", "Barbell": "Barbell_Side_Split_Squat", "Bodyweight": "Split_Squat_with_Dumbbells" },
  "Deadlift": { "Barbell Conventional": "Barbell_Deadlift", "Barbell Sumo": "Sumo_Deadlift", "Trap Bar": "Barbell_Deadlift", "Dumbbell Romanian": "Stiff-Legged_Dumbbell_Deadlift", "Barbell Romanian": "Romanian_Deadlift" },
  "Leg Press": { "45° Machine": "Leg_Press", "Horizontal Machine": "Leg_Press" },
  "Glute Kickback": { "Cable": "Glute_Kickback", "Machine": "Glute_Kickback", "Bodyweight": "Glute_Kickback" },
  "Hang Clean": { "Barbell": "Hang_Clean", "Dumbbell": "Dumbbell_Clean" },
};

// Get variant image URL for web
const getVariantImageUrl = (exerciseName, equipment) => {
  const mapping = EXERCISE_IMAGE_MAP[exerciseName];
  if (!mapping) return null;

  const imageId = mapping[equipment];
  if (!imageId) return null;

  return `${EXERCISE_IMAGE_BASE}${imageId}/0.jpg`;
};

// Get all exercises from database for matching
const getExerciseDatabase = () => {
  try {
    return getAllExercises();
  } catch (e) {
    console.error('Could not load exercise database:', e);
    return [];
  }
};

// Use the sophisticated matching from exerciseNameMatcher
// This handles abbreviations (DB, BB, etc.), fuzzy matching, position qualifiers, and more
const findBestExerciseMatch = (name) => {
  if (!name) return null;
  return findBestMatch(name, 0.5); // 0.5 threshold for fuzzy matching
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

  const recipePrompt = `You are an expert at extracting recipe information from images. Extract and return a JSON object with:
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
}`;

  // Use the same sophisticated prompt as the mobile app
  const workoutPrompt = `Analyze this image and extract workout/exercise information.

CRITICAL - FIRST CHECK IF THIS IS A WORKOUT:
- Look for exercise names (e.g., "Bench Press", "Squats", "Deadlift", "Curls")
- Look for sets/reps notation (e.g., "3x10", "4 sets of 8", "3 sets x 12 reps")
- Look for workout structure (Day 1, Push Day, Leg Day, etc.)

IF THIS IMAGE DOES NOT CONTAIN A WORKOUT (no exercises, no sets/reps visible), return this error response:
{
  "error": true,
  "message": "No workout content found in this image"
}

IF THIS IS A VALID WORKOUT, extract all visible information.

IMPORTANT - USE THESE EXACT EXERCISE NAMES when applicable:
- Chest: "Bench Press", "Incline Bench Press", "Decline Bench Press", "Chest Fly", "Chest Press", "Push Up", "Cable Crossover", "Dips"
- Back: "Lat Pulldown", "Pull Up", "Chin Up", "Bent Over Row", "Seated Row", "T-Bar Row", "Deadlift", "Face Pull"
- Shoulders: "Overhead Press", "Lateral Raise", "Front Raise", "Rear Delt Fly", "Upright Row", "Shrugs"
- Biceps: "Bicep Curl", "Hammer Curl", "Preacher Curl", "Concentration Curl", "Cable Curl"
- Triceps: "Tricep Extension", "Tricep Pushdown", "Skull Crusher", "Close Grip Bench Press", "Overhead Tricep Extension"
- Legs: "Squat", "Leg Press", "Leg Extension", "Leg Curl", "Romanian Deadlift", "Lunge", "Calf Raise", "Hip Thrust"
- Core: "Crunch", "Plank", "Russian Twist", "Leg Raise", "Cable Crunch"

Return ONLY valid JSON in this exact format (no other text):
{
  "type": "workout",
  "name": "Creative Program Name",
  "description": "Brief description of the workout",
  "muscleGroups": ["chest", "shoulders", "triceps"],
  "exercises": [
    {
      "name": "Bench Press",
      "equipment": "Barbell",
      "sets": 3,
      "reps": "8-12",
      "weight": "135 lbs",
      "notes": "Focus on form"
    }
  ],
  "confidence": 0.9
}

RULES:
1. DO NOT INVENT exercises - only extract what is VISIBLE in the image
2. Parse "3x10" as sets: 3, reps: "10"
3. PRESERVE rep ranges like "8-12" or "10-15" as strings
4. Identify equipment: Barbell, Dumbbell, Cable, Machine, Bodyweight, Kettlebell, EZ Bar
5. Common abbreviations: DB=Dumbbell, BB=Barbell, KB=Kettlebell, SM=Smith Machine
6. Use the EXACT exercise names from the list above when the exercise matches`;

  const autoPrompt = `Analyze this image and determine if it contains a RECIPE or WORKOUT. Then extract the relevant information.
If it's a RECIPE, return: { "type": "recipe", ... recipe fields }
If it's a WORKOUT, return: { "type": "workout", ... workout fields with exercises array }
Use common exercise names from standard gym terminology.`;

  const systemPrompt = contentType === 'recipe' ? recipePrompt
    : contentType === 'workout' ? workoutPrompt
    : autoPrompt;

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

// Exercise Selection Component - Shows matched exercise info and variant selection
const ExerciseSelector = ({ exercise, matchedExercise, matchScore, isExactMatch, selectedVariant, needsVariantSelection, availableVariants, onSelect, onKeepCustom }) => {
  const [showVariants, setShowVariants] = useState(needsVariantSelection);

  if (!matchedExercise) {
    return (
      <div style={{
        padding: '14px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#F59E0B' }}>
                {exercise.name}
              </span>
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
              }}>
                Custom
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Not found in library - will be added as custom exercise
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            <div>{exercise.sets} sets</div>
            <div>{exercise.reps} reps</div>
          </div>
        </div>
      </div>
    );
  }

  const variants = matchedExercise.variants || [];
  const scorePercent = Math.round((matchScore || 0) * 100);

  return (
    <div style={{
      padding: '14px',
      background: isExactMatch ? 'rgba(16, 185, 129, 0.08)' : 'rgba(139, 92, 246, 0.08)',
      border: `1px solid ${isExactMatch ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
      borderRadius: '10px',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: isExactMatch ? '#10B981' : '#8B5CF6' }}>
              {matchedExercise.name}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: isExactMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: isExactMatch ? '#10B981' : '#8B5CF6',
            }}>
              {isExactMatch ? '✓ Exact' : `${scorePercent}% match`}
            </span>
          </div>
          {exercise.name !== matchedExercise.name && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
              From: "{exercise.name}"
            </div>
          )}
          {matchedExercise.primaryMuscles && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              Targets: {matchedExercise.primaryMuscles.slice(0, 3).join(', ')}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          <div>{exercise.sets} sets</div>
          <div>{exercise.reps} reps</div>
          {selectedVariant && (
            <div style={{ color: '#8B5CF6', fontWeight: '500', marginTop: '4px' }}>
              {selectedVariant.equipment}
            </div>
          )}
        </div>
      </div>

      {/* Variant selection */}
      {variants.length > 1 && (
        <div>
          <button
            onClick={() => setShowVariants(!showVariants)}
            style={{
              background: needsVariantSelection ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.08)',
              border: needsVariantSelection ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: needsVariantSelection ? '#8B5CF6' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            {showVariants ? '▼ Hide equipment options' : `▶ ${needsVariantSelection ? 'Select equipment' : 'Change equipment'} (${variants.length} options)`}
          </button>

          {showVariants && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
              {variants.map((variant, idx) => {
                const isSelected = selectedVariant?.equipment === variant.equipment;
                const imageUrl = getVariantImageUrl(matchedExercise.name, variant.equipment);
                return (
                  <button
                    key={idx}
                    onClick={() => onSelect(matchedExercise, variant)}
                    style={{
                      position: 'relative',
                      background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: isSelected ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Variant image */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={variant.equipment}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: imageUrl ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '24px',
                        color: 'rgba(255,255,255,0.3)',
                      }}>
                        🏋️
                      </div>
                    </div>
                    {/* Equipment label */}
                    <span style={{
                      fontSize: '11px',
                      color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                      fontWeight: isSelected ? '600' : '500',
                      textAlign: 'center',
                      lineHeight: '1.2',
                    }}>
                      {variant.equipment}
                    </span>
                    {/* Selected indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white',
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ScreenshotImporter = ({ onImport, onClose, defaultType = 'auto' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previews, setPreviews] = useState([]); // Changed to array for multiple images
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

  // Handle paste event - now supports multiple images
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await processFiles(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Process multiple files
  const processFiles = async (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Please upload image files (PNG, JPG, etc.)');
      return;
    }

    setError(null);
    setResult(null);
    setShowReview(false);

    const newPreviews = imageFiles.map((file, index) => ({
      id: `${Date.now()}_${index}`,
      url: URL.createObjectURL(file),
      file,
      name: file.name || `Image ${index + 1}`,
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // Process single file (for backwards compatibility)
  const processFile = async (file) => {
    await processFiles([file]);
  };

  // Remove a specific preview
  const removePreview = (id) => {
    setPreviews(prev => {
      const toRemove = prev.find(p => p.id === id);
      if (toRemove?.url) {
        URL.revokeObjectURL(toRemove.url);
      }
      return prev.filter(p => p.id !== id);
    });
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
      // Convert FileList to array and process all files
      await processFiles(Array.from(files));
    }
  }, []);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      const newPreview = {
        id: `url_${Date.now()}`,
        url: imageUrl.trim(),
        base64,
        name: 'URL Image',
      };
      setPreviews(prev => [...prev, newPreview]);
      setImageUrl('');
      setProgress({ step: 'ready', message: 'Image loaded!', percent: 100 });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Analyze all images - creates a program if multiple workouts detected
  const analyzeImages = async () => {
    if (previews.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setShowReview(false);

    try {
      const allParsedWorkouts = [];
      const totalImages = previews.length;

      // Process each image
      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        const progressPercent = Math.round(((i + 1) / totalImages) * 70) + 10;

        setProgress({
          step: 'analyze',
          message: `Analyzing image ${i + 1} of ${totalImages}...`,
          percent: progressPercent,
        });

        let base64;
        if (preview.base64) {
          base64 = preview.base64;
        } else if (preview.file) {
          base64 = await fileToBase64(preview.file);
        } else {
          continue;
        }

        const parsed = await parseImageWithAI(base64, contentType);

        if (parsed.type === 'workout' || parsed.exercises) {
          allParsedWorkouts.push({
            ...parsed,
            imageName: preview.name,
            imageIndex: i,
          });
        } else if (parsed.type === 'recipe') {
          // For recipes, just use the first one
          if (allParsedWorkouts.length === 0) {
            setProgress({ step: 'complete', message: 'Recipe analyzed!', percent: 100 });
            setResult(parsed);
            setIsProcessing(false);
            return;
          }
        }
      }

      setProgress({ step: 'match', message: 'Matching exercises...', percent: 85 });

      // Combine workouts into a program if multiple, or single workout if one
      let finalResult;
      if (allParsedWorkouts.length === 0) {
        throw new Error('No workout content found in the images');
      } else if (allParsedWorkouts.length === 1) {
        // Single workout
        finalResult = allParsedWorkouts[0];
      } else {
        // Multiple workouts - create a program
        finalResult = {
          type: 'program',
          name: `Imported Program (${allParsedWorkouts.length} days)`,
          description: `Program imported from ${allParsedWorkouts.length} screenshots`,
          days: allParsedWorkouts.map((workout, idx) => ({
            name: workout.name || `Day ${idx + 1}`,
            exercises: workout.exercises || [],
            muscleGroups: workout.muscleGroups || [],
          })),
          exercises: [], // All exercises flattened for matching
        };

        // Flatten all exercises for matching
        allParsedWorkouts.forEach((workout, dayIdx) => {
          (workout.exercises || []).forEach(ex => {
            finalResult.exercises.push({
              ...ex,
              dayIndex: dayIdx,
              dayName: workout.name || `Day ${dayIdx + 1}`,
            });
          });
        });
      }

      // Match exercises against database
      if (finalResult.exercises && finalResult.exercises.length > 0) {
        const exercises = finalResult.exercises;
        const matched = exercises.map(ex => {
          const match = findBestExerciseMatch(ex.name);

          // If matched, check for equipment variants
          let selectedVariant = null;
          let detectedEquipment = ex.equipment || null;

          if (match?.exercise) {
            const variants = match.exercise.variants || [];

            // Try to detect equipment from the original exercise name
            if (!detectedEquipment) {
              const inputLower = (ex.name || '').toLowerCase();
              const equipmentHints = [
                { hint: 'dumbbell', equipment: 'Dumbbell' },
                { hint: 'barbell', equipment: 'Barbell' },
                { hint: 'cable', equipment: 'Cable' },
                { hint: 'machine', equipment: 'Machine' },
                { hint: 'smith', equipment: 'Smith Machine' },
                { hint: 'kettlebell', equipment: 'Kettlebell' },
                { hint: 'bodyweight', equipment: 'Bodyweight' },
                { hint: 'ez bar', equipment: 'EZ Bar' },
                { hint: 'db ', equipment: 'Dumbbell' },
                { hint: 'bb ', equipment: 'Barbell' },
                { hint: 'kb ', equipment: 'Kettlebell' },
              ];
              for (const { hint, equipment } of equipmentHints) {
                if (inputLower.includes(hint)) {
                  detectedEquipment = equipment;
                  break;
                }
              }
            }

            // Find matching variant if equipment detected
            if (detectedEquipment && variants.length > 0) {
              selectedVariant = variants.find(v =>
                v.equipment?.toLowerCase() === detectedEquipment.toLowerCase()
              );
            }
          }

          return {
            original: ex,
            matched: match?.exercise || null,
            score: match?.score || 0,
            isExactMatch: match?.isExactMatch || false,
            selectedVariant: selectedVariant || match?.exercise?.variants?.[0] || null,
            detectedEquipment,
            needsVariantSelection: match?.exercise?.variants?.length > 1 && !selectedVariant,
            availableVariants: match?.exercise?.variants?.map(v => v.equipment) || [],
            // For programs, track which day this exercise belongs to
            dayIndex: ex.dayIndex,
            dayName: ex.dayName,
          };
        });
        setMatchedExercises(matched);
        setShowReview(true);
      }

      setProgress({ step: 'complete', message: 'Analysis complete!', percent: 100 });
      setResult(finalResult);

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
        needsVariantSelection: false, // User has made a selection
      };
      return updated;
    });
  };

  const handleConfirmImport = () => {
    if (!result) return;

    // Helper to build exercise object
    const buildExerciseObject = (original, matched, selectedVariant, index) => {
      if (matched) {
        const exerciseId = `exercise_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        const variantEquipment = selectedVariant?.equipment || matched.variants?.[0]?.equipment || null;
        const variantName = variantEquipment
          ? `${variantEquipment} ${matched.name} (${variantEquipment})`
          : matched.name;

        return {
          ...matched,
          id: exerciseId,
          libraryId: matched.id,
          name: matched.name,
          displayName: variantName,
          sets: original.sets || 3,
          reps: original.reps || '10',
          weight: original.weight || '',
          notes: original.notes || '',
          equipment: selectedVariant?.equipment || matched.equipment || 'Not specified',
          selectedVariant: selectedVariant,
          selectedEquipment: selectedVariant?.equipment || null,
          muscleGroup: matched.muscleGroup,
          primaryMuscles: matched.primaryMuscles,
          secondaryMuscles: matched.secondaryMuscles,
          instructions: matched.instructions,
          variants: matched.variants,
          isMatched: true,
          isCustom: false,
        };
      }
      return {
        id: `custom_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        name: original.name,
        sets: original.sets || 3,
        reps: original.reps || '10',
        weight: original.weight || '',
        equipment: original.equipment || 'Not specified',
        isCustom: true,
        isMatched: false,
      };
    };

    // Build final result with matched exercises
    const finalResult = { ...result };

    if (matchedExercises.length > 0) {
      if (result.type === 'program' && result.days) {
        // For programs, rebuild the days structure with matched exercises
        const exercisesByDay = {};
        matchedExercises.forEach((item, index) => {
          const dayIdx = item.dayIndex || 0;
          if (!exercisesByDay[dayIdx]) {
            exercisesByDay[dayIdx] = [];
          }
          exercisesByDay[dayIdx].push(
            buildExerciseObject(item.original, item.matched, item.selectedVariant, index)
          );
        });

        // Rebuild days with matched exercises
        finalResult.days = result.days.map((day, dayIdx) => ({
          ...day,
          exercises: exercisesByDay[dayIdx] || [],
        }));

        // Also include flattened exercises for compatibility
        finalResult.exercises = matchedExercises.map((item, index) =>
          buildExerciseObject(item.original, item.matched, item.selectedVariant, index)
        );
      } else {
        // Single workout
        finalResult.exercises = matchedExercises.map((item, index) =>
          buildExerciseObject(item.original, item.matched, item.selectedVariant, index)
        );
      }
    }

    if (onImport) {
      onImport(finalResult);
    }

    // Reset state
    setShowReview(false);
    setResult(null);
    setMatchedExercises([]);
    setPreviews([]);
  };

  const handleClear = () => {
    // Revoke all object URLs to prevent memory leaks
    previews.forEach(p => {
      if (p.url && p.url.startsWith('blob:')) {
        URL.revokeObjectURL(p.url);
      }
    });
    setPreviews([]);
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

      {/* Drop zone - show when no images or when adding more */}
      {!showReview && (
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
              padding: previews.length > 0 ? '20px' : '40px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: previews.length > 0 ? '24px' : '40px', marginBottom: previews.length > 0 ? '8px' : '12px' }}>
              {isDragging ? '📥' : '📷'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              {isDragging ? 'Drop images here' : previews.length > 0 ? 'Add more images' : 'Drag & drop images or click to browse'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {previews.length > 0
                ? `${previews.length} image${previews.length > 1 ? 's' : ''} selected • Ctrl+V to paste more`
                : 'Multiple images supported • Ctrl+V to paste from clipboard'}
            </div>
          </motion.div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
              Add
            </motion.button>
          </div>
        </>
      )}

      {/* Multi-image Preview Grid */}
      {previews.length > 0 && !showReview && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}>
            {previews.map((preview) => (
              <div key={preview.id} style={{ position: 'relative' }}>
                <img
                  src={preview.url}
                  alt={preview.name}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <motion.button
                  onClick={() => removePreview(preview.id)}
                  whileHover={{ scale: 1.1 }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </motion.button>
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '4px',
                  right: '4px',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.8)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}>
                  {preview.name}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!result && (
              <motion.button
                onClick={analyzeImages}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
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
                {isProcessing
                  ? progress.message
                  : previews.length > 1
                    ? `Analyze ${previews.length} Screenshots`
                    : 'Analyze Screenshot'}
              </motion.button>
            )}
            <motion.button
              onClick={handleClear}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Clear All
            </motion.button>
          </div>
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
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF', margin: 0, marginBottom: '4px' }}>
                {result.type === 'program'
                  ? `${result.name || 'Program'} (${result.days?.length || 0} days)`
                  : 'Review Exercises'}
              </h4>
              {result.type === 'program' && (
                <span style={{ fontSize: '12px', color: 'rgba(139, 92, 246, 0.8)' }}>
                  Multiple workouts detected - creating a program
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {matchedExercises.filter(e => e.matched).length}/{matchedExercises.length} matched
            </span>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {matchedExercises.map((item, index) => {
              // Show day header for program exercises
              const showDayHeader = result.type === 'program' &&
                (index === 0 || matchedExercises[index - 1]?.dayIndex !== item.dayIndex);

              return (
                <React.Fragment key={index}>
                  {showDayHeader && (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      marginTop: index > 0 ? '16px' : 0,
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#8B5CF6' }}>
                        {item.dayName || `Day ${(item.dayIndex || 0) + 1}`}
                      </span>
                    </div>
                  )}
                  <ExerciseSelector
                    exercise={item.original}
                    matchedExercise={item.matched}
                    matchScore={item.score}
                    isExactMatch={item.isExactMatch}
                    selectedVariant={item.selectedVariant}
                    needsVariantSelection={item.needsVariantSelection}
                    availableVariants={item.availableVariants}
                    onSelect={(exercise, variant) => handleSelectVariant(index, exercise, variant)}
                    onKeepCustom={() => handleSelectVariant(index, null, null)}
                  />
                </React.Fragment>
              );
            })}
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
              {result.type === 'program' ? 'Confirm & Save Program' : 'Confirm & Save to App'}
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
