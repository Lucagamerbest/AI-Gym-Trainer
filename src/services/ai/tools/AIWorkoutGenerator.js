/**
 * AI-Powered Workout Generator - Uses Gemini AI to THINK and create workouts
 *
 * This replaces the algorithmic template system with REAL AI thinking that:
 * - Respects user preferences (disliked exercises, equipment, injuries)
 * - Understands what exercises guys actually do at the gym (machines > bodyweight)
 * - Creates proper workout structure (compound first, isolation after)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAllExercises } from '../../../data/exerciseDatabase';
import AIService from '../AIService';

/**
 * Generate workout using AI thinking (takes 10-30 seconds, but SMART)
 */
export async function generateWorkoutWithAI({
  workoutType,
  userProfile,
  variationIndex = 0
}) {

  try {
    // Initialize Gemini AI
    if (!AIService.apiKey) {
      throw new Error('Gemini API key not configured. Please restart the app.');
    }
    const genAI = new GoogleGenerativeAI(AIService.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Get available exercises from database
    const allExercises = getAllExercises();
    const exerciseList = allExercises
      .map(ex => `${ex.name} (${ex.equipment || 'unknown equipment'})`)
      .join('\n');

    // Build prompt
    const prompt = buildAIWorkoutPrompt({
      workoutType,
      userProfile,
      variationIndex,
      exerciseList,
    });


    // Call AI
    const result = await model.generateContent(prompt);
    const response = result.response.text();


    // Parse response
    const workout = parseAIResponse(response, allExercises);

    if (workout && workout.exercises && workout.exercises.length > 0) {
      return {
        success: true,
        workout: {
          ...workout,
          type: workoutType,
          generatedBy: 'AI',
          variationIndex,
          generatedAt: Date.now(),
        },
      };
    } else {
      console.error(`❌ [AI Generator] AI returned invalid workout`);
      return { success: false, error: 'Invalid workout from AI' };
    }

  } catch (error) {
    console.error(`❌ [AI Generator] Failed:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Build comprehensive AI prompt
 */
function buildAIWorkoutPrompt({ workoutType, userProfile, variationIndex, exerciseList }) {
  const {
    experienceLevel = 'intermediate',
    dislikedExercises = [],
    favoriteExercises = [],
    equipmentAccess = [],
    primaryGoal = [],
    currentPain = [],
    sessionDuration = 60,
  } = userProfile;

  const workoutTypeUpper = workoutType.toUpperCase();

  return `You are an EXPERT strength & conditioning coach with 20+ years experience training bodybuilders, powerlifters, and athletes.

Your task: Generate a SCIENTIFICALLY-BACKED ${workoutTypeUpper} WORKOUT based on evidence-based training principles.

📚 SCIENTIFIC PRINCIPLES YOU MUST FOLLOW:

1. **Training Frequency** (Meta-analysis: Schoenfeld et al., 2016)
   - Each muscle group should be trained 2-3x per week for maximum hypertrophy
   - Higher frequency (2-3x/week) = 38% faster muscle growth than 1x/week
   - This workout is part of a weekly split where muscles are hit multiple times

2. **Training Volume** (Systematic review: Schoenfeld et al., 2017)
   - Optimal volume: 10-20 sets per muscle group per WEEK
   - More than 20 sets = diminishing returns and overtraining risk
   - This workout should contribute to weekly volume, not exceed it

3. **Exercise Order** (ACSM Guidelines)
   - ALWAYS start with compound/multi-joint exercises (Squat, Bench, Deadlift)
   - Follow with isolation/single-joint exercises (Leg Extension, Bicep Curl)
   - Reason: Compound lifts require more energy and neural drive

4. **Rep Ranges by Goal** (Carvalho et al., 2022)
   - Strength (Powerlifting): 3-6 reps, 85-95% 1RM, 3-5min rest
   - Hypertrophy (Bodybuilding): 8-12 reps, 65-85% 1RM, 60-90s rest
   - Endurance (General Fitness): 12-15+ reps, 50-65% 1RM, 30-60s rest

🚨 ABSOLUTE REQUIREMENTS - WORKOUT WILL BE REJECTED IF NOT FOLLOWED:

1️⃣ **ONE EQUIPMENT TYPE PER EXERCISE (CRITICAL)**:
   - Each exercise MUST use EXACTLY ONE equipment type
   - ✅ CORRECT: "Barbell Bench Press" (equipment: "Barbell")
   - ✅ CORRECT: "Dumbbell Shoulder Press" (equipment: "Dumbbell")
   - ❌ WRONG: "Barbell, Dumbbell Bench Press" (equipment: "Barbell, Dumbbell")
   - ❌ WRONG: Equipment field contains commas: "Cable Rope, EZ Bar"
   - Pick the BEST equipment variant for the workout variation strategy
   - NEVER list multiple equipment types separated by commas
   - NEVER list multiple variations (Seated, Standing, etc.)

${dislikedExercises.length > 0 ? `
2️⃣ **❌ BLACKLISTED EXERCISES (NEVER USE - USER EXPLICITLY HATES THESE):**
${dislikedExercises.map(ex => `- "${ex}" and ALL variations (e.g., if "Squat" → avoid: Back Squat, Front Squat, Goblet Squat, Hack Squat, Bulgarian Split Squat, Box Squat, Overhead Squat, etc.)`).join('\n')}

⚠️ CRITICAL: If you include ANY blacklisted exercise or variation, the workout will FAIL validation.
` : ''}

**🎯 TRAINING STYLE-SPECIFIC EXERCISE SELECTION:**

${userProfile.workoutStyle === 'powerlifting' || (Array.isArray(primaryGoal) && primaryGoal.includes('strength')) || (Array.isArray(primaryGoal) && primaryGoal.includes('powerlifting')) ? `
🏋️ POWERLIFTING PROTOCOL (Strength Development):

Scientific Basis: Powerlifting focuses on maximal force production in the squat, bench press, and deadlift (Swinton et al., 2012).

MANDATORY EXERCISE SELECTION:
- Primary Lifts: Squat, Bench Press, Deadlift, Overhead Press
- Rep Range: 3-6 reps (heavy load, neural adaptation)
- Rest Periods: 3-5 minutes (ATP-PC system recovery)
- Equipment: Barbell > Dumbbells > Machines
- Isolation Work: Minimal (only for weak point strengthening)

LEGS EXAMPLE STRUCTURE:
1. Back Squat or Front Squat: 5 sets x 3-5 reps, 3-5min rest
2. Deadlift or Romanian Deadlift: 4 sets x 3-5 reps, 3-5min rest
3. Leg Press (accessory volume): 3 sets x 6-8 reps, 2-3min rest
4. Hamstring Curl (weak point): 3 sets x 8-10 reps, 90s rest

❌ AVOID: Bodyweight exercises, functional movements, glute bridges, hip thrusts
` : userProfile.workoutStyle === 'bodybuilding' || (Array.isArray(primaryGoal) && primaryGoal.includes('bulk')) || (Array.isArray(primaryGoal) && primaryGoal.includes('build-muscle')) || (Array.isArray(primaryGoal) && primaryGoal.includes('cut')) ? `
💪 BODYBUILDING PROTOCOL (Muscle Hypertrophy):

Scientific Basis: Hypertrophy is maximized through mechanical tension, metabolic stress, and muscle damage (Schoenfeld, 2010).

MANDATORY EXERCISE SELECTION RULES:
- Equipment Priority: Machines > Dumbbells > Barbells > Bodyweight
- Why? Machines allow safer failure, better isolation, constant tension
- Rep Range: 8-12 reps (hypertrophy sweet spot)
- Rest Periods: 60-90 seconds (metabolic stress accumulation)
- Focus: PUMP and VOLUME over strength

🚨 CRITICAL FOR LEGS WORKOUTS:
REQUIRED EXERCISES (Must include these core movements):
✅ Leg Press - Primary quad compound (replaces squat for most bodybuilders)
✅ Leg Extension - ONLY true quad isolation exercise (VMO development)
✅ Leg Curl - Hamstring isolation (biceps femoris activation)
✅ Calf Raise - Calf development (gastrocnemius & soleus)

❌ FORBIDDEN EXERCISES FOR BODYBUILDING LEGS:
- Hip Thrust (glute-specific, not for general leg development)
- Glute Bridge (glute-specific, not for mass building)
- Walking Lunges (functional training, not bodybuilding)
- Bulgarian Split Squats (too unstable, limits load)
- Step-Ups (functional/athletic, not mass building)
- Box Jumps (plyometric, not hypertrophy)

WHY THESE ARE FORBIDDEN:
→ Bodybuilding = maximize muscle cross-sectional area through controlled, loaded movements
→ Functional exercises = athletic performance, stability, not pure hypertrophy
→ Hip thrusts/glute bridges = women's glute specialization, not for male leg development

CORRECT BODYBUILDING LEGS STRUCTURE:
1. Leg Press: 4 sets x 10-12 reps, 90s rest (quad compound)
2. Leg Extension: 3 sets x 12-15 reps, 60s rest (quad isolation - MANDATORY)
3. Romanian Deadlift OR Leg Curl: 3 sets x 10-12 reps, 90s rest (hamstring)
4. Lying/Seated Leg Curl: 3 sets x 12-15 reps, 60s rest (hamstring isolation - MANDATORY)
5. Standing Calf Raise: 4 sets x 15-20 reps, 60s rest (calf - MANDATORY)

This structure follows proven bodybuilding methodology used by IFBB pros.
` : userProfile.workoutStyle === 'crossfit' || userProfile.workoutStyle === 'athletic' ? `
🏃 ATHLETIC/FUNCTIONAL PROTOCOL:

Scientific Basis: Athletic training emphasizes power, stability, and multi-planar movement (Haff & Triplett, 2016).

EXERCISE SELECTION:
- Functional movements ARE appropriate here (lunges, hip thrusts, box jumps)
- Mix: Barbell compounds + Bodyweight + Plyometrics
- Rep Range: 6-10 reps (power development)
- Rest: 90-120 seconds (power recovery)

LEGS EXAMPLE:
1. Back Squat: 4 sets x 6-8 reps
2. Hip Thrust: 3 sets x 10-12 reps (glute power for sprinting)
3. Walking Lunges: 3 sets x 12 reps per leg (stability)
4. Box Jumps: 3 sets x 8 reps (explosive power)
` : `
🎯 GENERAL FITNESS PROTOCOL:

Scientific Basis: General fitness prioritizes overall health, strength, and muscle maintenance.

EXERCISE SELECTION:
- Balanced compound and isolation exercises
- Equipment: Machines preferred (safety, ease of learning)
- Rep Range: 10-15 reps (moderate intensity)
- Rest: 60-90 seconds

LEGS EXAMPLE:
1. Leg Press: 3 sets x 10-12 reps (safe compound)
2. Leg Extension: 3 sets x 12-15 reps (quad isolation)
3. Leg Curl: 3 sets x 12-15 reps (hamstring)
4. Calf Raise: 3 sets x 15-20 reps (calf work)
`}

${favoriteExercises.length > 0 ? `
⭐ USER'S FAVORITE EXERCISES (MUST INCLUDE AT LEAST 1-2):
${favoriteExercises.map(ex => `- ${ex}`).join('\n')}
` : ''}

📋 **CLIENT PROFILE:**
- Experience Level: ${experienceLevel.toUpperCase()}
- Primary Goals: ${Array.isArray(primaryGoal) ? primaryGoal.join(', ') : primaryGoal}
- Session Duration: ${sessionDuration} minutes
${currentPain.length > 0 ? `- Injuries/Pain: ${currentPain.map(p => p.area).join(', ')} (modify exercises to avoid aggravation)` : ''}
${favoriteExercises.length > 0 ? `- Favorite Exercises (prioritize these): ${favoriteExercises.join(', ')}` : ''}

📝 **WORKOUT TYPE-SPECIFIC SCIENTIFIC GUIDANCE:**
${getWorkoutGuidance(workoutType)}

🔄 **VARIATION #${variationIndex + 1} STRATEGY:**
${getVariationRequirement(variationIndex)}

✅ **YOUR TASK - GENERATE WORKOUT FOLLOWING THESE EXACT STEPS:**

STEP 1: Set workout name based on VARIATION strategy above (THIS IS MANDATORY - see variation section for exact format)
STEP 2: Select ${getExerciseCount(sessionDuration, workoutType)} exercises
STEP 3: Order exercises correctly:
   → START with compound/multi-joint (Squat, Press, Deadlift, Row)
   → FINISH with isolation/single-joint (Extension, Curl, Raise)
STEP 4: Assign sets, reps, rest based on training goal:
   → Powerlifting: 3-6 reps, 3-5min rest
   → Bodybuilding: 8-12 reps, 60-90s rest
   → General: 10-15 reps, 60s rest
STEP 5: Double-check NO blacklisted exercises included
STEP 6: Add brief form cues for safety

**OUTPUT FORMAT (JSON ONLY - NO MARKDOWN):**
{
  "name": "MUST follow the format specified in VARIATION section above for ${workoutTypeUpper} workout",
  "exercises": [
    {
      "name": "Exercise name - CHOOSE EXACTLY ONE EQUIPMENT TYPE (e.g., 'Bench Press' NOT 'Barbell, Dumbbell, Machine Bench Press')",
      "equipment": "ONE equipment type only (Barbell OR Dumbbell OR Machine OR Cable - NOT multiple)",
      "sets": 3-4,
      "reps": "6-10" or "8-12" or "12-15",
      "rest": "60s" or "90s" or "120s",
      "notes": "Brief form cue"
    }
  ]
}

🚨 **CRITICAL RULES FOR EXERCISE NAMES:**
1. Each exercise must use EXACTLY ONE equipment type
2. Choose ONE variant: "Barbell Bench Press" OR "Dumbbell Bench Press" OR "Machine Bench Press"
3. NEVER list multiple equipment types: ❌ "Barbell, Dumbbell Bench Press"
4. NEVER list multiple variations: ❌ "Seated, Standing Shoulder Press"
5. Pick the BEST equipment variant for the VARIATION strategy above
6. Example CORRECT: "Dumbbell Shoulder Press" ✅
7. Example WRONG: "Barbell, Dumbbell, Seated Shoulder Press" ❌

**AVAILABLE EXERCISES (USE EXACT NAMES):**
${exerciseList}

**Generate the workout now as valid JSON (NO markdown, NO code blocks, JUST JSON):**`;
}

/**
 * Get workout-specific guidance with scientific backing
 */
function getWorkoutGuidance(type) {
  const guidance = {
    legs: `
🦵 LEGS WORKOUT - SCIENTIFIC EXERCISE SELECTION:

Research shows legs require 4-6 exercises covering all major muscle groups:

1️⃣ QUAD DOMINANT COMPOUND (Choose 1):
   ✅ Leg Press - Best for quad hypertrophy without lower back fatigue
   ✅ Back Squat - King of leg exercises (if not blacklisted)
   ✅ Front Squat - Quad emphasis, less lower back stress
   ✅ Hack Squat - Machine-based quad builder

2️⃣ QUAD ISOLATION (MANDATORY - Choose 1):
   ✅ Leg Extension - ONLY exercise that truly isolates quadriceps
   → EMG studies show highest VMO (vastus medialis oblique) activation
   → Essential for complete quad development

3️⃣ HAMSTRING WORK (Choose 1-2):
   ✅ Leg Curl (Lying or Seated) - Direct hamstring isolation
   ✅ Romanian Deadlift - Hamstring compound (if deadlifts not blacklisted)
   ✅ Stiff-Leg Deadlift - Hamstring stretch focus

4️⃣ CALF WORK (MANDATORY):
   ✅ Standing Calf Raise - Gastrocnemius emphasis (straight leg)
   ✅ Seated Calf Raise - Soleus emphasis (bent knee)

❌ EXERCISES TO AVOID FOR STANDARD LEG DAY:
   - Hip Thrust / Glute Bridge → These are glute-specific (use for glute specialization only)
   - Walking Lunges / Bulgarian Split Squats → Functional/athletic training (not mass building)
   - Step-Ups / Box Jumps → Plyometric/functional (not bodybuilding)
   - Leg Press Calf Raise → Inferior to standing/seated variations

📚 Scientific Rationale:
   → Leg Extension is THE ONLY way to truly isolate quads (no hip flexor involvement)
   → Machines allow higher volume with less fatigue than free weights
   → Calves require direct work (not stimulated enough by squats/presses)`,

    push: `
🫸 PUSH WORKOUT - CHEST, SHOULDERS, TRICEPS:

Research-backed exercise order (heavy → light, compound → isolation):

1️⃣ HORIZONTAL PRESS - CHEST COMPOUND (Choose 1):
   ✅ Barbell Bench Press - King of chest exercises
   ✅ Dumbbell Bench Press - Greater ROM, unilateral work
   ✅ Machine Chest Press - Constant tension, safe failure

2️⃣ VERTICAL PRESS - SHOULDER COMPOUND (Choose 1):
   ✅ Overhead Press (Barbell) - Best overall shoulder developer
   ✅ Dumbbell Shoulder Press - Unilateral stability
   ✅ Machine Shoulder Press - Safer for shoulder health

3️⃣ CHEST ISOLATION (Choose 1):
   ✅ Cable Fly - Constant tension throughout ROM
   ✅ Dumbbell Fly - Stretch emphasis
   ✅ Pec Deck - Machine-based isolation

4️⃣ LATERAL DELT (MANDATORY):
   ✅ Lateral Raise - ONLY way to isolate side delts (shoulder width)

5️⃣ TRICEP ISOLATION (Choose 1):
   ✅ Tricep Pushdown - Long head emphasis
   ✅ Overhead Extension - Stretch position stimulus
   ✅ Dips - Compound tricep builder

📚 Order Rationale: Heavy compounds first while fresh, isolation when fatigued`,

    pull: `
🫷 PULL WORKOUT - BACK & BICEPS:

Research-backed pulling pattern balance (vertical + horizontal):

1️⃣ VERTICAL PULL - LAT FOCUS (Choose 1):
   ✅ Pull-Ups - King of back exercises (add weight when possible)
   ✅ Lat Pulldown - Controlled lat isolation
   ✅ Close-Grip Pulldown - Lower lat emphasis

2️⃣ HORIZONTAL PULL - MID-BACK THICKNESS (Choose 1):
   ✅ Barbell Row - Overall back mass
   ✅ Cable Row - Constant tension
   ✅ Chest-Supported Row - Removes lower back fatigue

3️⃣ DEADLIFT VARIATION (Optional if not blacklisted):
   ✅ Conventional Deadlift - Full posterior chain
   ✅ Romanian Deadlift - Hamstring/lower back

4️⃣ REAR DELT (MANDATORY):
   ✅ Face Pull - Rear delt + rotator cuff health
   ✅ Rear Delt Fly - Direct isolation

5️⃣ BICEPS (Choose 1-2):
   ✅ Barbell Curl - Overall bicep mass
   ✅ Dumbbell Curl - Unilateral, supination control
   ✅ Hammer Curl - Brachialis development

📚 Rationale: Need BOTH vertical (lats) and horizontal (mid-back) pulling`,

    chest: `
💪 CHEST-FOCUSED WORKOUT:

1️⃣ FLAT PRESS (Compound):
   ✅ Barbell Bench Press - Overall chest mass
   ✅ Dumbbell Bench Press - Better stretch

2️⃣ INCLINE PRESS (Upper Chest):
   ✅ Incline Barbell Press - Upper chest emphasis
   ✅ Incline Dumbbell Press - ROM advantage

3️⃣ FLY MOVEMENT (Isolation):
   ✅ Cable Fly - Constant tension
   ✅ Dumbbell Fly - Deep stretch

4️⃣ OPTIONAL: Dips (Lower Chest/Triceps)

❌ AVOID: Decline press (minimal benefit, awkward setup)`,

    back: `
🔙 BACK-FOCUSED WORKOUT:

Must include BOTH vertical and horizontal pulling:

1️⃣ VERTICAL PULL:
   ✅ Pull-Ups or Lat Pulldown

2️⃣ HORIZONTAL PULL:
   ✅ Barbell Row or Cable Row

3️⃣ DEADLIFT (if not blacklisted):
   ✅ Conventional or Romanian Deadlift

4️⃣ REAR DELTS:
   ✅ Face Pull or Rear Delt Fly`,

    shoulders: `
👐 SHOULDER-FOCUSED WORKOUT:

All 3 delt heads must be trained:

1️⃣ COMPOUND PRESS (All 3 heads):
   ✅ Overhead Press
   ✅ Dumbbell Shoulder Press

2️⃣ LATERAL DELT (MANDATORY):
   ✅ Lateral Raise - Side delt isolation

3️⃣ FRONT DELT:
   ✅ Front Raise (often covered by pressing)

4️⃣ REAR DELT (MANDATORY):
   ✅ Rear Delt Fly
   ✅ Face Pull`,

    arms: `
💪 ARM-FOCUSED WORKOUT:

Balance biceps and triceps volume:

BICEPS (2-3 exercises):
1️⃣ Barbell Curl - Mass builder
2️⃣ Dumbbell Curl - Unilateral control
3️⃣ Hammer Curl - Brachialis/forearm

TRICEPS (2-3 exercises):
1️⃣ Tricep Pushdown - Long head
2️⃣ Overhead Extension - Stretch position
3️⃣ Dips - Compound tricep work`,

    upper: `
🔝 UPPER BODY WORKOUT:

Balance push and pull:

PUSH (2-3 exercises):
- Bench Press or Dumbbell Press
- Overhead Press
- Lateral Raise

PULL (2-3 exercises):
- Pull-Ups or Lat Pulldown
- Cable Row or Barbell Row
- Face Pull

ARMS (1-2 exercises):
- Bicep Curl
- Tricep Pushdown`,

    lower: `
🦵 LOWER BODY WORKOUT:

QUAD DOMINANT (1-2):
- Squat or Leg Press
- Leg Extension

HAMSTRING/GLUTE (1-2):
- Deadlift or Romanian Deadlift
- Leg Curl

CALVES (1):
- Calf Raise`,

    full_body: `
🏋️ FULL BODY WORKOUT (Beginner-Friendly):

Hit all major muscle groups with compounds:

LOWER BODY (2 exercises):
- Squat or Leg Press
- Deadlift or Romanian Deadlift

UPPER PUSH (1-2 exercises):
- Bench Press
- Overhead Press

UPPER PULL (1-2 exercises):
- Pull-Ups or Lat Pulldown
- Cable Row

📚 Rationale: Beginners benefit from 3x/week full body (higher frequency)`,
  };

  return guidance[type] || guidance.legs;
}

/**
 * Get variation requirement
 */
function getVariationRequirement(index) {
  const reqs = [
    // Variation 1: Standard Mix
    `**VARIATION 1 - Balanced Compound & Isolation Mix:**
- Mix of barbell, dumbbell, and machine exercises
- Start with 2-3 heavy compound movements
- Follow with 3-4 isolation exercises
- Standard gym equipment
- Example exercises: "Barbell Bench Press", "Dumbbell Fly", "Cable Crossover"
- CRITICAL: Each exercise ONE equipment type only - choose best variant for each
- **Workout name must be**: "Balanced [MuscleGroup]" (e.g., "Balanced Push")
- **NEVER write**: "Barbell, Dumbbell Bench Press" - pick ONE equipment`,

    // Variation 2: Machine-Focused Hypertrophy
    `**VARIATION 2 - Machine-Heavy Hypertrophy Focus:**
- Prioritize MACHINES for safer high-rep training and constant tension
- Use cable exercises for unique resistance curves
- Include 1-2 compound movements (barbell/dumbbell)
- Higher rep ranges (10-15 reps)
- Example exercises: "Machine Chest Press", "Cable Fly", "Machine Shoulder Press"
- CRITICAL: Each exercise ONE equipment type only - prefer "Machine" or "Cable" variants
- GOAL: Maximum pump and metabolic stress
- **Workout name must be**: "Machine [MuscleGroup]" (e.g., "Machine Push")
- **NEVER write**: "Machine, Cable Fly" - pick ONE equipment`,

    // Variation 3: Free Weight Strength & Power
    `**VARIATION 3 - Free Weight Compound Emphasis:**
- Emphasize BARBELLS and DUMBBELLS for maximum strength
- Focus on heavy compound lifts with lower reps (6-10 reps)
- Minimal machine work
- Include Olympic lift variations if applicable
- Example exercises: "Barbell Bench Press", "Barbell Row", "Dumbbell Overhead Press"
- CRITICAL: Each exercise ONE equipment type only - prefer "Barbell" or "Dumbbell" variants
- GOAL: Maximum strength and neural adaptation
- **Workout name must be**: "Barbell [MuscleGroup]" or "Free Weight [MuscleGroup]" (e.g., "Barbell Push")
- **NEVER write**: "Barbell, Dumbbell Bench Press" - pick ONE equipment`,

    // Variation 4: Unilateral & Stability Focus
    `**VARIATION 4 - Unilateral & Dumbbell Focus:**
- Use DUMBBELLS ONLY and single-arm variations
- Emphasize unilateral exercises for balance correction
- Include stabilizer muscle activation
- Example exercises: "Dumbbell Bench Press", "One Arm Dumbbell Row", "Single Arm Cable Press"
- CRITICAL: Each exercise must use ONLY ONE equipment type - pick "Dumbbell" variant
- GOAL: Fix imbalances and improve coordination
- **Workout name must be**: "Dumbbell [MuscleGroup]" or "Unilateral [MuscleGroup]" (e.g., "Dumbbell Push")
- **NEVER write**: "Barbell, Dumbbell Bench Press" - ONLY write "Dumbbell Bench Press"`,

    // Variation 5: High-Intensity Techniques
    `**VARIATION 5 - Advanced Techniques & Drop Sets:**
- Include exercises suitable for drop sets and supersets
- Prefer machines and cables for quick weight changes
- Higher volume with moderate weight
- Example exercises: "Machine Shoulder Press", "Cable Lateral Raise", "Machine Chest Press"
- CRITICAL: Each exercise ONE equipment type only - prefer "Machine" or "Cable" variants
- GOAL: Maximum metabolic stress and time under tension
- **Workout name must be**: "High-Volume [MuscleGroup]" or "Drop Set [MuscleGroup]" (e.g., "High-Volume Push")
- **NEVER write**: "Machine, Cable Lateral Raise" - pick ONE equipment`,

    // Variation 6: Powerlifting Foundation
    `**VARIATION 6 - Powerlifting Core Movements:**
- Base workout around squat, bench press, deadlift variations
- BARBELL-DOMINANT with heavy loads
- Low rep ranges (3-6 reps) on main lifts
- Minimal accessory work
- Example exercises: "Barbell Back Squat", "Barbell Romanian Deadlift", "Barbell Bench Press"
- CRITICAL: Each exercise ONE equipment type only - prefer "Barbell" variants
- GOAL: Maximum strength and power development
- **Workout name must be**: "Powerlifting [MuscleGroup]" or "Strength [MuscleGroup]" (e.g., "Powerlifting Push")
- **NEVER write**: "Barbell, Smith Machine Bench Press" - pick ONE equipment`,
  ];
  return reqs[Math.min(index, reqs.length - 1)];
}

/**
 * Get exercise count based on duration and type
 */
function getExerciseCount(duration, type) {
  if (type === 'legs') return 5; // Legs: fewer exercises, more volume
  if (duration <= 45) return 5;
  if (duration <= 60) return 6;
  return 7;
}

/**
 * Parse AI response and match to database
 */
function parseAIResponse(response, exerciseDatabase) {
  try {
    // Log raw AI response for debugging

    // Remove markdown code blocks if present
    let jsonStr = response.trim();
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
      throw new Error('No exercises array in response');
    }

    // Match exercises to database
    const matchedExercises = parsed.exercises.map(aiEx => {
      // VALIDATION: Detect if AI returned multiple equipment types in name OR equipment field
      // Example: "Barbell, Dumbbell Bench Press" → extract first equipment only
      let cleanedName = aiEx.name;
      let cleanedEquipment = aiEx.equipment;

      // Check for comma-separated equipment in NAME field (AI mistake)
      if (cleanedName && cleanedName.includes(',')) {
        console.warn(`⚠️ AI returned multiple equipment types in NAME: "${cleanedName}"`);

        // Extract first equipment type before comma
        const firstPart = cleanedName.split(',')[0].trim();
        cleanedName = firstPart;
      }

      // Check for comma-separated equipment in EQUIPMENT field (AI mistake)
      if (cleanedEquipment && cleanedEquipment.includes(',')) {
        console.warn(`⚠️ AI returned multiple equipment types in EQUIPMENT: "${cleanedEquipment}"`);

        // Extract first equipment type before comma
        const firstPart = cleanedEquipment.split(',')[0].trim();
        cleanedEquipment = firstPart;
      }

      // Also check for complex equipment names (e.g., "Cable Rope" → "Cable")
      // Extract just the first word for equipment matching
      const equipmentKeywords = ['cable', 'dumbbell', 'barbell', 'machine', 'band', 'kettlebell', 'ez bar', 'trap bar', 'smith machine'];
      if (cleanedEquipment) {
        const equipLower = cleanedEquipment.toLowerCase();
        // Check if it matches a known equipment keyword
        const matchedKeyword = equipmentKeywords.find(kw => equipLower.startsWith(kw));
        if (matchedKeyword) {
          cleanedEquipment = matchedKeyword;
        } else {
          // If no match, just take first word
          const firstWord = cleanedEquipment.split(' ')[0];
          if (firstWord !== cleanedEquipment) {
            console.warn(`⚠️ Complex equipment "${cleanedEquipment}" → simplified to "${firstWord}"`);
            cleanedEquipment = firstWord;
          }
        }
      }

      // Pass equipment to finder for smarter matching
      const dbExercise = findExerciseInDatabase(cleanedName, exerciseDatabase, cleanedEquipment);

      // Combine equipment + name to get full variant (e.g., "Dumbbell Bench Press")
      let fullExerciseName = dbExercise?.name || cleanedName;
      let equipment = cleanedEquipment || dbExercise?.equipment || 'unknown';

      // CRITICAL FIX: If database exercise has comma-separated equipment,
      // extract the specific variant that matches our target equipment
      if (dbExercise?.equipment && dbExercise.equipment.includes(',')) {
        console.warn(`⚠️ Database exercise has multiple equipment: "${dbExercise.equipment}"`);

        // If we have target equipment, use it; otherwise extract first
        if (cleanedEquipment) {
          const equipmentLower = cleanedEquipment.toLowerCase();
          const dbEquipments = dbExercise.equipment.split(',').map(e => e.trim());
          const matchedEquip = dbEquipments.find(e => e.toLowerCase() === equipmentLower);
          equipment = matchedEquip || cleanedEquipment;
        } else {
          // No target equipment, take first variant
          equipment = dbExercise.equipment.split(',')[0].trim();
        }
      }

      // If equipment exists and is not already in the name, prepend it
      if (equipment && equipment !== 'unknown' && equipment !== 'bodyweight') {
        const nameLower = fullExerciseName.toLowerCase();
        const equipmentLower = equipment.toLowerCase();

        // Only add equipment if it's not already in the name
        if (!nameLower.includes(equipmentLower)) {
          fullExerciseName = `${equipment} ${fullExerciseName}`.trim();
        }
      }

      const finalExercise = {
        name: fullExerciseName, // Now includes equipment!
        equipment: equipment,
        primaryMuscles: dbExercise?.primaryMuscles || [],
        sets: parseInt(aiEx.sets) || 3,
        reps: aiEx.reps || '8-12',
        restPeriod: aiEx.rest || '90s',
        notes: aiEx.notes || '',
      };

      // Log each parsed exercise for debugging

      return finalExercise;
    });

    return {
      name: parsed.name || 'AI Generated Workout',
      exercises: matchedExercises,
    };

  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    return null;
  }
}

/**
 * Find exercise in database (fuzzy match)
 * Now supports equipment-aware matching (e.g., "Dumbbell Bench Press")
 */
function findExerciseInDatabase(name, database, targetEquipment = null) {
  const nameLower = name.toLowerCase();

  // SMART PARSING: Check if equipment is already in the name
  // Example: "Dumbbell Bench Press" → equipment="Dumbbell", baseName="Bench Press"
  const equipmentKeywords = [
    'cable', 'dumbbell', 'barbell', 'machine', 'smith machine',
    'ez bar', 'band', 'bodyweight', 'kettlebell', 'trap bar'
  ];

  let parsedEquipment = targetEquipment;
  let parsedName = nameLower;

  // Extract equipment from name if present
  for (const eq of equipmentKeywords) {
    if (nameLower.startsWith(eq + ' ') || nameLower.includes(' ' + eq + ' ')) {
      parsedEquipment = eq;
      parsedName = nameLower.replace(eq, '').trim().replace(/\s+/g, ' ');
      break;
    }
  }

  // Strategy 1: Exact match (name + equipment)
  if (parsedEquipment) {
    let match = database.find(ex =>
      ex.name.toLowerCase() === parsedName &&
      ex.equipment?.toLowerCase() === parsedEquipment.toLowerCase()
    );
    if (match) return match;
  }

  // Strategy 2: Exact name match (any equipment)
  let match = database.find(ex => ex.name.toLowerCase() === nameLower);
  if (match) return match;

  // Strategy 3: Exact name match with target equipment
  if (parsedEquipment) {
    match = database.find(ex =>
      ex.name.toLowerCase() === nameLower &&
      ex.equipment?.toLowerCase() === parsedEquipment.toLowerCase()
    );
    if (match) return match;
  }

  // Strategy 4: Partial match (name contains or is contained)
  match = database.find(ex => {
    const exLower = ex.name.toLowerCase();
    return exLower.includes(parsedName) || parsedName.includes(exLower);
  });
  if (match) return match;

  // Strategy 5: Word overlap (at least 2 words match)
  const nameWords = parsedName.split(' ');
  match = database.find(ex => {
    const exWords = ex.name.toLowerCase().split(' ');
    const overlap = nameWords.filter(w => exWords.includes(w));
    return overlap.length >= 2;
  });

  if (match) {
  }

  return match;
}

export default {
  generateWorkoutWithAI,
};
