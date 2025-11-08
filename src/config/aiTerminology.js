/**
 * AI Terminology Configuration
 *
 * Purpose: Centralized terminology rules for AI responses
 * - Users can ask in ANY way (flexible input)
 * - AI always responds using STANDARD terms (consistent output)
 * - Easily modifiable for global launch & multi-language support
 *
 * Last Updated: November 8, 2025
 */

export const AI_TERMINOLOGY = {

  // ============================================================
  // NUTRITION TERMINOLOGY
  // ============================================================

  nutrition: {
    // Standard terms the AI should USE in responses
    standardTerms: {
      macroGoals: 'macro goals',           // Not: macro targets, daily macros
      calorieGoal: 'calorie goal',         // Not: calorie target
      proteinGoal: 'protein goal',         // Not: protein target
      recipe: 'recipe',                    // For cooking instructions
      meal: 'meal',                        // For logged food
      mealPlan: 'meal plan',               // For 7-day plans
      meals: 'meals',                      // For daily eating
    },

    // What users might say (AI should understand all variations)
    userVariations: {
      macroGoals: [
        'macro goals', 'macro targets', 'macros', 'daily macros',
        'macro limits', 'nutrient goals', 'protein carbs fats'
      ],
      calorieGoal: [
        'calorie goal', 'calorie target', 'calorie limit', 'daily calories',
        'cal goal', 'how many calories', 'calorie budget'
      ],
      proteinGoal: [
        'protein goal', 'protein target', 'daily protein', 'how much protein',
        'protein needs', 'protein requirement'
      ],
    }
  },

  // ============================================================
  // WORKOUT TERMINOLOGY
  // ============================================================

  workout: {
    // Standard terms the AI should USE
    standardTerms: {
      hypertrophy: 'hypertrophy',          // Not: bodybuilding, muscle building
      muscleGrowth: 'muscle growth',       // User-friendly version
      strengthTraining: 'strength training', // Not: powerlifting
      weightLoss: 'weight loss',           // Not: cutting, fat burning
      setsPerWeek: 'sets per week',        // Not: training volume
      workoutFrequency: 'workout frequency', // Not: training frequency
      exercise: 'exercise',                // Single movement
      workout: 'workout',                  // Training session
      program: 'program',                  // Long-term plan
      rpe: 'RPE',                         // Rate of Perceived Exertion
    },

    // What users might say
    userVariations: {
      hypertrophy: [
        'hypertrophy', 'muscle building', 'bodybuilding', 'grow muscle',
        'get bigger', 'mass gain', 'muscle growth'
      ],
      strengthTraining: [
        'strength training', 'get stronger', 'powerlifting', 'strength',
        'build strength', 'increase strength'
      ],
      weightLoss: [
        'weight loss', 'lose weight', 'cutting', 'fat loss', 'burn fat',
        'shred', 'get lean', 'fat burning'
      ],
    }
  },

  // ============================================================
  // MEASUREMENT TERMINOLOGY
  // ============================================================

  measurements: {
    // Standard formats
    standardFormats: {
      weight: 'lbs',                       // Not: weight, pounds
      reps: 'reps',                        // Not: repetitions
      sets: 'sets',                        // Not: set
      rest: 'rest',                        // Not: rest period
      grams: 'g',                          // Not: gm, grams
      calories: 'calories',                // Not: kcal, cal
      macros: '{p}p / {c}c / {f}f',       // Format: 200p / 250c / 60f
    }
  },

  // ============================================================
  // RESPONSE TONE BY SCREEN
  // ============================================================

  toneByScreen: {
    WorkoutScreen: {
      style: 'ultra-concise',
      description: 'Direct answers only, no explanations during training',
      example: '185 lbs (5 lbs more than last week)'
    },
    NutritionScreen: {
      style: 'data-driven',
      description: 'Show exact numbers, be supportive',
      example: "You're at 1,450 / 2,000 calories (73%). On track!"
    },
    AIScreen: {
      style: 'conversational',
      description: 'Big-picture thinking, advisory',
      example: 'Based on your training, I recommend focusing on legs this week (only 15% of volume)'
    },
    HomeScreen: {
      style: 'encouraging',
      description: 'Motivational but realistic',
      example: "You've trained 3/7 days this week. Let's keep the momentum going!"
    }
  },

  // ============================================================
  // PHRASES TO AVOID
  // ============================================================

  avoidPhrases: {
    // Don't use these ❌
    tooFormal: [
      'Affirmative', 'Shall I proceed?', 'I have retrieved',
      'Your training regimen', 'Nutritional protocol'
    ],
    tooRobotic: [
      'Processing request', 'Query executed', 'Data retrieved',
      'Acknowledged', 'Command received'
    ],
    tooVague: [
      'Looks good', 'Nice work', 'Keep going', 'Do better',
      'Your last workout', 'That food'
    ],
    tooNegative: [
      'You failed', 'You messed up', 'Bad choice', "You're off track badly",
      'This is wrong'
    ],

    // Use these instead ✅
    replacements: {
      'Affirmative': 'Got it!',
      'Shall I proceed?': 'Would you like me to...?',
      'I have retrieved': "Here's what I found:",
      'Looks good': "You're at 1,800 / 2,000 calories. On track!",
      'You failed': "You're 200 calories over today. No worries—back on track tomorrow!"
    }
  },

  // ============================================================
  // FORMATTING RULES
  // ============================================================

  formatting: {
    // How to format common data types
    weight: (value) => `${value} lbs`,
    reps: (value) => `${value} reps`,
    setsAndReps: (sets, reps) => `${sets}×${reps}`,
    macros: (protein, carbs, fat) => `${protein}p / ${carbs}c / ${fat}f`,
    calories: (value) => `${value} calories`,
    percentage: (value) => `${value}%`,

    // Exercise list format
    exerciseList: (exercises) => exercises.map((ex, i) =>
      `${i + 1}. ${ex.name} - ${ex.sets}×${ex.reps}, RPE ${ex.rpe}, ${ex.rest}`
    ).join('\n'),

    // Meal format
    mealFormat: (meal) =>
      `${meal.name} (${meal.calories} cal):\n` +
      meal.foods.map(f => `• ${f.name} (${f.calories} cal, ${f.protein}g protein)`).join('\n')
  },

  // ============================================================
  // SYSTEM PROMPT INJECTION
  // ============================================================

  getTerminologyPrompt() {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 TERMINOLOGY STANDARDS - CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CORE PRINCIPLE:
- Users can ask in ANY way (understand all variations)
- YOU must respond using ONLY standard terms below

✅ NUTRITION - Always use:
- "macro goals" (NOT: macro targets, daily macros)
- "calorie goal" (NOT: calorie target)
- "protein goal" (NOT: protein target)
- "meal plan" (NOT: nutrition plan)

✅ WORKOUT - Always use:
- "hypertrophy" or "muscle growth" (NOT: bodybuilding)
- "strength training" (NOT: powerlifting)
- "weight loss" (NOT: cutting, fat burning)
- "sets per week" (NOT: training volume)
- "workout" for session, "program" for long-term plan

✅ MEASUREMENTS - Always format:
- Weight: "185 lbs" (NOT: "185 pounds" or "weight")
- Reps: "8 reps" or "×8"
- Sets × Reps: "3×10"
- Macros: "200p / 250c / 60f"
- Calories: "450 calories"

✅ TONE - Match the screen:
- Workout screen: Ultra-concise ("185 lbs")
- Nutrition screen: Data-driven ("1,450 / 2,000 cal - 73%")
- AI/Home screen: Conversational ("Based on your training...")

❌ NEVER SAY:
- "Affirmative" → Say "Got it!"
- "Shall I proceed?" → Say "Would you like me to...?"
- "You failed" → Say "You're 200 cal over. Back on track tomorrow!"
- Vague: "Looks good" → Specific: "1,800 / 2,000 cal. On track!"

🔗 CROSS-REFERENCES - Always be specific:
- ❌ "your last workout"
- ✅ "your Push workout (Nov 5)"
- ❌ "that food"
- ✅ "the chicken rice bowl you logged earlier"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
};

// Export helper functions
export const getStandardTerm = (category, key) => {
  return AI_TERMINOLOGY[category]?.standardTerms?.[key] || key;
};

export const formatWeight = (value) => AI_TERMINOLOGY.formatting.weight(value);
export const formatReps = (value) => AI_TERMINOLOGY.formatting.reps(value);
export const formatMacros = (p, c, f) => AI_TERMINOLOGY.formatting.macros(p, c, f);
export const formatCalories = (value) => AI_TERMINOLOGY.formatting.calories(value);

export default AI_TERMINOLOGY;
