/**
 * Import Prompts - Structured prompts for parsing imported content
 *
 * These prompts are used by the Vision API and text parsing to extract
 * recipes and workouts from screenshots, PDFs, and pasted text.
 */

/**
 * Prompt for detecting content type (recipe vs workout)
 */
export const CONTENT_TYPE_DETECTION_PROMPT = `Analyze this content and determine what type it is.

Return ONLY one of these exact responses:
- "recipe" - if this is a recipe, meal plan, or food-related content
- "workout" - if this is a workout plan, exercise routine, or training program
- "unknown" - if you cannot determine the content type

Look for clues:
- RECIPE indicators: ingredients, cooking instructions, nutrition facts, servings, prep time, cook time, food items, calories per serving
- WORKOUT indicators: exercises, sets, reps, weights, rest periods, muscle groups, workout days, training splits

Respond with ONLY the content type word, nothing else.`;

/**
 * Prompt for parsing recipe content from images
 */
export const RECIPE_PARSE_PROMPT = `Analyze this image and extract all recipe information.

IMPORTANT: Extract EVERYTHING visible - ingredients, amounts, instructions, and any nutrition info shown.

Return ONLY valid JSON in this exact format (no other text):
{
  "name": "Recipe Name",
  "description": "Brief description of the dish",
  "servings": 4,
  "prepTime": "15 minutes",
  "cookTime": "20 minutes",
  "difficulty": "easy",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 200,
      "unit": "g",
      "original": "200g chicken breast"
    }
  ],
  "instructions": [
    "Step 1: First instruction",
    "Step 2: Second instruction"
  ],
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 40,
    "fat": 15
  },
  "tags": ["high-protein", "quick", "healthy"],
  "source": "imported from image",
  "confidence": 0.95
}

RULES:
1. If nutrition info is not visible, estimate based on ingredients
2. Convert all measurements to metric (grams/ml) when possible
3. If servings not specified, assume 1 serving
4. Set confidence between 0-1 based on image clarity
5. Include ALL visible ingredients, don't skip any
6. Keep instructions clear and concise
7. If any field is unclear, make your best estimate and lower confidence`;

/**
 * Prompt for parsing recipe content from text
 */
export const RECIPE_TEXT_PARSE_PROMPT = `Parse this text and extract recipe information.

TEXT TO PARSE:
{text}

Return ONLY valid JSON in this exact format (no other text):
{
  "name": "Recipe Name",
  "description": "Brief description of the dish",
  "servings": 4,
  "prepTime": "15 minutes",
  "cookTime": "20 minutes",
  "difficulty": "easy",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 200,
      "unit": "g",
      "original": "200g chicken breast"
    }
  ],
  "instructions": [
    "Step 1: First instruction",
    "Step 2: Second instruction"
  ],
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 40,
    "fat": 15
  },
  "tags": ["high-protein", "quick", "healthy"],
  "source": "imported from text",
  "confidence": 0.95
}

RULES:
1. If nutrition info is not provided, estimate based on ingredients
2. Convert all measurements to metric (grams/ml) when possible
3. If servings not specified, assume 1 serving
4. Set confidence between 0-1 based on text clarity
5. Include ALL mentioned ingredients
6. If instructions are numbered, preserve the order`;

/**
 * Prompt for parsing workout content from images
 */
export const WORKOUT_PARSE_PROMPT = `Analyze this image and extract workout/exercise information.

CRITICAL - FIRST CHECK IF THIS IS A WORKOUT:
- Look for exercise names (e.g., "Bench Press", "Squats", "Deadlift", "Curls")
- Look for sets/reps notation (e.g., "3x10", "4 sets of 8", "3 sets x 12 reps")
- Look for workout structure (Day 1, Push Day, Leg Day, etc.)

IF THIS IMAGE DOES NOT CONTAIN A WORKOUT (no exercises, no sets/reps visible), return this error response:
{
  "error": true,
  "message": "No workout content found in this image"
}

IF THIS IS A VALID WORKOUT, extract all visible information - exercises, sets, reps, weights, rest periods, and notes.

DAY ORDERING:
- READ the actual day numbers/labels from the content (e.g., "Day 1", "Day 2", "Day 3", "Monday", "Tuesday")
- ORDER the days based on what is WRITTEN in the images, NOT the order images are provided
- If an image says "Day 3" or "Week 1 Day 3", set dayNumber: 3 regardless of image order
- If days are named (e.g., "Push Day", "Pull Day", "Leg Day"), order them logically: Push=1, Pull=2, Legs=3
- If days use weekdays (Monday, Tuesday, etc.), order them: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7

Return ONLY valid JSON in this exact format (no other text):
{
  "name": "Workout Name",
  "description": "Brief description of the workout",
  "type": "push",
  "isStandalone": true,
  "days": [
    {
      "dayNumber": 1,
      "name": "Day 1 - Push",
      "exercises": [
        {
          "name": "Bench Press",
          "equipment": "Barbell",
          "setsCount": 3,
          "reps": "8-12",
          "weight": 135,
          "restPeriod": "90 seconds",
          "notes": "Focus on form"
        }
      ],
      "muscleGroups": ["chest", "shoulders", "triceps"]
    }
  ],
  "programDuration": "4 weeks",
  "frequency": "3x per week",
  "difficulty": "intermediate",
  "source": "imported from image",
  "confidence": 0.9
}

RULES:
1. DO NOT INVENT OR MAKE UP exercises - only extract what is VISIBLE in the image
2. If you cannot clearly see workout content, return the error response
3. SET isStandalone: true if this is a SINGLE workout session (one day of exercises)
4. SET isStandalone: false if this is a MULTI-DAY PROGRAM (multiple workout days, weekly split, etc.)
5. SORT days array by dayNumber in ascending order (Day 1 first, Day 2 second, etc.)
6. For exercises: use "setsCount" for number of sets (e.g., 3 for "3x10"), "reps" for rep count
7. Parse "3x10" as setsCount: 3, reps: 10
8. Parse "4 sets of 8" as setsCount: 4, reps: 8
9. PRESERVE rep ranges like "8-12" or "10-15" as strings, don't split them
10. If no sets/reps visible but exercises are listed, default to setsCount: 3, reps: 10
11. Identify the workout type: push, pull, legs, upper, lower, full_body, cardio, or custom
12. Convert weights to lbs if in kg (multiply by 2.2)
13. Common equipment: Barbell, Dumbbell, Cable, Machine, Bodyweight, Kettlebell
14. Set confidence between 0-1 based on image clarity`;

/**
 * Prompt for parsing workout content from text
 */
export const WORKOUT_TEXT_PARSE_PROMPT = `Parse this text and extract workout/exercise information.

TEXT TO PARSE:
{text}

CRITICAL - FIRST CHECK IF THIS IS A WORKOUT:
- Look for exercise names (e.g., "Bench Press", "Squats", "Deadlift", "Curls")
- Look for sets/reps notation (e.g., "3x10", "4 sets of 8", "3 sets x 12 reps")
- Look for workout structure (Day 1, Push Day, Leg Day, etc.)

IF THIS TEXT DOES NOT CONTAIN A WORKOUT (no exercises, no sets/reps), return this error response:
{
  "error": true,
  "message": "No workout content found in this text"
}

IF THIS IS A VALID WORKOUT, determine if it's a SINGLE WORKOUT or a MULTI-DAY PROGRAM.

DAY ORDERING:
- READ the actual day numbers/labels from the text (e.g., "Day 1", "Day 2", "Day 3", "Monday", "Tuesday")
- ORDER the days based on what is WRITTEN in the text, NOT the order they appear
- If text says "Day 3" or "Week 1 Day 3", set dayNumber: 3 regardless of text order
- If days are named (e.g., "Push Day", "Pull Day", "Leg Day"), order them logically: Push=1, Pull=2, Legs=3
- If days use weekdays (Monday, Tuesday, etc.), order them: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7

Return ONLY valid JSON in this exact format (no other text):
{
  "name": "Workout Name",
  "description": "Brief description of the workout",
  "type": "push",
  "isStandalone": true,
  "days": [
    {
      "dayNumber": 1,
      "name": "Day 1 - Push",
      "exercises": [
        {
          "name": "Bench Press",
          "equipment": "Barbell",
          "setsCount": 3,
          "reps": "8-12",
          "weight": 135,
          "restPeriod": "90 seconds",
          "notes": ""
        }
      ],
      "muscleGroups": ["chest", "shoulders", "triceps"]
    }
  ],
  "programDuration": "4 weeks",
  "frequency": "3x per week",
  "difficulty": "intermediate",
  "source": "imported from text",
  "confidence": 0.9
}

RULES:
1. DO NOT INVENT OR MAKE UP exercises - only extract what is in the text
2. If you cannot find workout content, return the error response
3. SET isStandalone: true if this is a SINGLE workout session (one day of exercises)
4. SET isStandalone: false if this is a MULTI-DAY PROGRAM (multiple workout days, weekly split, etc.)
5. SORT days array by dayNumber in ascending order (Day 1 first, Day 2 second, etc.)
6. For exercises: use "setsCount" for number of sets, "reps" for rep count
7. Parse "3x10" as setsCount: 3, reps: 10
8. Parse "4 sets of 8" as setsCount: 4, reps: 8
9. PRESERVE rep ranges like "8-12" or "10-15" as strings, don't split them
10. If no sets/reps specified but exercises are listed, default to setsCount: 3, reps: 10
11. If weights not specified, set weight to null
12. Identify equipment from exercise names (e.g., "DB Bench" = Dumbbell)
13. Common abbreviations: DB=Dumbbell, BB=Barbell, KB=Kettlebell
14. Set confidence between 0-1 based on text clarity`;

/**
 * Prompt for validating and improving parsed content
 */
export const VALIDATION_PROMPT = `Review this parsed {contentType} data and fix any issues.

PARSED DATA:
{parsedData}

Check for and fix:
1. Unrealistic values (e.g., 10000 calories, 500g protein)
2. Missing required fields
3. Inconsistent data (e.g., nutrition doesn't match ingredients)
4. Spelling errors in common foods/exercises

Return the corrected JSON, or the original if no fixes needed.`;

/**
 * Helper to get the appropriate prompt for content type
 */
export function getParsePrompt(contentType, inputType) {
  if (contentType === 'recipe') {
    return inputType === 'image' ? RECIPE_PARSE_PROMPT : RECIPE_TEXT_PARSE_PROMPT;
  } else if (contentType === 'workout') {
    return inputType === 'image' ? WORKOUT_PARSE_PROMPT : WORKOUT_TEXT_PARSE_PROMPT;
  }
  return null;
}

/**
 * Helper to replace placeholders in text prompts
 */
export function formatTextPrompt(prompt, text) {
  return prompt.replace('{text}', text);
}

export default {
  CONTENT_TYPE_DETECTION_PROMPT,
  RECIPE_PARSE_PROMPT,
  RECIPE_TEXT_PARSE_PROMPT,
  WORKOUT_PARSE_PROMPT,
  WORKOUT_TEXT_PARSE_PROMPT,
  VALIDATION_PROMPT,
  getParsePrompt,
  formatTextPrompt,
};
