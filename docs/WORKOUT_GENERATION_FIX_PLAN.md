# Workout Generation Fix Plan

## 🚨 Current Problems

### Issues Identified
1. **Wrong Exercise Selection**: AI keeps generating glute-focused exercises (hip thrusts, glute bridges) instead of basic compound/isolation movements
2. **Missing Core Exercises**: Not generating fundamental exercises like:
   - Leg Extension (quad isolation)
   - Leg Curl (hamstring isolation)
   - Calf Raises (calf isolation)
   - Leg Press (compound quad/glute)
3. **Prompt Not Being Followed**: Despite explicit instructions to avoid certain exercises, AI still generates them
4. **Training Style Confusion**: AI doesn't properly differentiate between powerlifting, bodybuilding, and general fitness

---

## 🎯 Goals

1. **Generate Evidence-Based Workouts**: Use exercise science principles (compound before isolation, proper volume, progressive overload)
2. **Respect Training Style**: Bodybuilders get hypertrophy work (8-12 reps, machines), powerlifters get strength work (3-6 reps, barbell)
3. **Blacklist Enforcement**: NEVER generate exercises the user dislikes (or their variations)
4. **Proper Exercise Hierarchy**:
   - Compound lifts first (Squat, Leg Press, Deadlift)
   - Isolation work second (Leg Extension, Leg Curl)
   - Accessory work last (Calf Raises)

---

## 🔍 Diagnosis Strategy

### Step 1: Analyze Current AI Responses
**Action**: Add extensive logging to see what AI is actually generating

```javascript
// In AIWorkoutGenerator.js - after AI response
console.log('🔍 [DEBUG] Raw AI Response:', response);
console.log('🔍 [DEBUG] User Profile Sent:', {
  dislikedExercises: userProfile.dislikedExercises,
  favoriteExercises: userProfile.favoriteExercises,
  workoutStyle: userProfile.workoutStyle,
  primaryGoal: userProfile.primaryGoal,
});
console.log('🔍 [DEBUG] Parsed Workout:', workout);
```

**Questions to Answer**:
- Is the AI receiving the correct user profile?
- Is the blacklist being sent to the AI?
- Is the AI actually following the prompt instructions?
- What exercises is the database returning?

### Step 2: Test Prompt Effectiveness
**Action**: Create a test script to send different prompts and compare outputs

**Test Cases**:
1. Bodybuilding leg workout (should get: Leg Press, Leg Extension, Leg Curl, Calf Raise)
2. Powerlifting leg workout (should get: Squat, Deadlift, Front Squat, Lunges)
3. Workout with "Squat" blacklisted (should get ZERO squat variations)
4. Workout with "Hip Thrust" blacklisted (should get ZERO hip thrusts/glute bridges)

---

## 🛠️ Solution Architecture

### Option 1: Stricter Prompt Engineering (Quick Fix)
**Time**: 1-2 hours
**Complexity**: Low
**Effectiveness**: Medium

**Changes**:
- Make prompt more explicit about exercise requirements
- Add examples of GOOD vs BAD workouts
- Use stronger language ("NEVER", "MANDATORY", "CRITICAL")
- Add validation step where AI must explain why it chose each exercise

**Implementation**:
```javascript
// More explicit prompt structure
const prompt = `
You are a PROFESSIONAL GYM TRAINER creating a ${workoutType.toUpperCase()} workout.

🚨 MANDATORY EXERCISE REQUIREMENTS (MUST FOLLOW):

For LEGS workout, you MUST include EXACTLY these exercise types:
1. ONE compound quad movement: Leg Press OR Squat (if not blacklisted)
2. ONE quad isolation: Leg Extension (MANDATORY - this is NON-NEGOTIABLE)
3. ONE hamstring isolation: Leg Curl OR Romanian Deadlift (MANDATORY)
4. ONE calf movement: Calf Raise (MANDATORY)

❌ FORBIDDEN EXERCISES (NEVER USE - WILL FAIL IF INCLUDED):
- Hip Thrust (this is for glute-focused training only)
- Glute Bridge (this is for glute-focused training only)
- Bulgarian Split Squat (too advanced/functional)
${dislikedExercises.map(ex => `- ${ex} and ALL variations`).join('\n')}

✅ REQUIRED EXERCISES FOR GYM BROS:
- Leg Press (primary compound)
- Leg Extension (quad pump)
- Leg Curl (hamstring pump)
- Calf Raise (calves)

TRAINING STYLE: ${userProfile.workoutStyle}
${userProfile.workoutStyle === 'bodybuilding' ? `
  → Focus on HYPERTROPHY (8-12 reps)
  → Use MACHINES over free weights
  → Prioritize PUMP and VOLUME
` : ''}

Generate the workout following this EXACT structure or it will be rejected.
`;
```

### Option 2: Exercise Database Filtering (Medium Fix)
**Time**: 3-4 hours
**Complexity**: Medium
**Effectiveness**: High

**Strategy**: Instead of relying on AI to follow rules, we programmatically filter the exercise database BEFORE sending to AI.

**Implementation**:
```javascript
function getFilteredExercisesForWorkout(workoutType, userProfile) {
  let exercises = getAllExercises();

  // Step 1: Filter by workout type (only leg exercises for legs workout)
  exercises = exercises.filter(ex => {
    const muscles = ex.primaryMuscles.map(m => m.toLowerCase());
    if (workoutType === 'legs') {
      return muscles.some(m => ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m));
    }
    // ... other workout types
  });

  // Step 2: Remove blacklisted exercises
  exercises = exercises.filter(ex => {
    const nameLower = ex.name.toLowerCase();
    return !userProfile.dislikedExercises.some(disliked => {
      const dislikedLower = disliked.toLowerCase();
      const dislikedSingular = dislikedLower.endsWith('s')
        ? dislikedLower.slice(0, -1)
        : dislikedLower;
      return nameLower.includes(dislikedLower) || nameLower.includes(dislikedSingular);
    });
  });

  // Step 3: Remove glute-focused exercises for bodybuilding
  if (userProfile.workoutStyle === 'bodybuilding' || userProfile.primaryGoal?.includes('bulk')) {
    const gluteExercises = ['hip thrust', 'glute bridge', 'donkey kick', 'fire hydrant'];
    exercises = exercises.filter(ex => {
      const nameLower = ex.name.toLowerCase();
      return !gluteExercises.some(glute => nameLower.includes(glute));
    });
  }

  // Step 4: Categorize exercises by type
  const categorized = {
    compound: exercises.filter(ex => ex.category === 'compound'),
    isolation: exercises.filter(ex => ex.category === 'isolation'),
    mandatory: exercises.filter(ex => {
      const nameLower = ex.name.toLowerCase();
      if (workoutType === 'legs') {
        return nameLower.includes('leg extension') ||
               nameLower.includes('leg curl') ||
               nameLower.includes('calf raise');
      }
      return false;
    }),
  };

  return { exercises, categorized };
}
```

### Option 3: Template-Based with AI Enhancement (Robust Fix)
**Time**: 6-8 hours
**Complexity**: High
**Effectiveness**: Very High

**Strategy**: Use scientifically-proven workout templates as the base structure, then let AI customize the details (sets, reps, rest periods, exercise order).

**Implementation**:
```javascript
// Define evidence-based workout templates
const WORKOUT_TEMPLATES = {
  legs_bodybuilding: {
    name: 'Bodybuilding Leg Day',
    structure: [
      { type: 'compound_quad', count: 1, examples: ['Leg Press', 'Squat'] },
      { type: 'quad_isolation', count: 1, mandatory: ['Leg Extension'] },
      { type: 'hamstring_isolation', count: 1, mandatory: ['Leg Curl', 'Romanian Deadlift'] },
      { type: 'calf', count: 1, mandatory: ['Calf Raise'] },
    ],
    repRange: '8-12',
    restPeriod: '60-90s',
  },
  legs_powerlifting: {
    name: 'Powerlifting Leg Day',
    structure: [
      { type: 'squat_variation', count: 1, mandatory: ['Back Squat', 'Front Squat'] },
      { type: 'deadlift_variation', count: 1, mandatory: ['Deadlift', 'Romanian Deadlift'] },
      { type: 'quad_isolation', count: 1, examples: ['Leg Press', 'Leg Extension'] },
      { type: 'posterior_chain', count: 1, examples: ['Leg Curl', 'Good Morning'] },
    ],
    repRange: '3-6',
    restPeriod: '3-5min',
  },
  // ... more templates
};

function generateWorkoutFromTemplate(templateKey, userProfile) {
  const template = WORKOUT_TEMPLATES[templateKey];
  const selectedExercises = [];

  for (const slot of template.structure) {
    // Get available exercises for this slot
    let options = slot.mandatory || slot.examples;

    // Filter by user preferences
    options = options.filter(ex => !isBlacklisted(ex, userProfile.dislikedExercises));

    // Prioritize favorites
    const favorite = options.find(ex => userProfile.favoriteExercises?.includes(ex));
    const chosen = favorite || options[0];

    if (chosen) {
      selectedExercises.push({
        name: chosen,
        type: slot.type,
        sets: 3,
        reps: template.repRange,
        rest: template.restPeriod,
      });
    }
  }

  // Let AI enhance with form cues, progressions, and customization
  return {
    exercises: selectedExercises,
    template: template.name,
    needsAIEnhancement: true,
  };
}
```

---

## 📊 Testing Plan

### Phase 1: Unit Tests (Immediate)
Create test file: `test-workout-generation.js`

```javascript
import { generateWorkoutWithAI } from './src/services/ai/tools/AIWorkoutGenerator';

const testProfiles = {
  bodybuilder_no_squats: {
    workoutStyle: 'bodybuilding',
    primaryGoal: ['bulk'],
    experienceLevel: 'intermediate',
    dislikedExercises: ['Squat', 'Hip Thrust'],
    favoriteExercises: ['Leg Press', 'Leg Extension'],
    sessionDuration: 60,
  },
  powerlifter: {
    workoutStyle: 'powerlifting',
    primaryGoal: ['strength'],
    experienceLevel: 'advanced',
    dislikedExercises: [],
    favoriteExercises: ['Squat', 'Deadlift'],
    sessionDuration: 90,
  },
  beginner: {
    workoutStyle: 'strength-training',
    primaryGoal: ['general-fitness'],
    experienceLevel: 'beginner',
    dislikedExercises: ['Deadlift'],
    favoriteExercises: [],
    sessionDuration: 45,
  },
};

async function runTests() {
  console.log('🧪 Starting Workout Generation Tests...\n');

  for (const [profileName, profile] of Object.entries(testProfiles)) {
    console.log(`\n📋 Testing: ${profileName}`);
    console.log('Profile:', profile);

    const result = await generateWorkoutWithAI({
      workoutType: 'legs',
      userProfile: profile,
      variationIndex: 0,
    });

    if (result.success) {
      console.log('✅ Workout Generated:');
      console.log('Exercises:', result.workout.exercises.map(e => e.name));

      // Validation
      const hasBlacklisted = result.workout.exercises.some(ex =>
        profile.dislikedExercises.some(disliked =>
          ex.name.toLowerCase().includes(disliked.toLowerCase())
        )
      );

      const hasLegExtension = result.workout.exercises.some(ex =>
        ex.name.toLowerCase().includes('leg extension')
      );

      const hasLegCurl = result.workout.exercises.some(ex =>
        ex.name.toLowerCase().includes('leg curl')
      );

      console.log('Validation:');
      console.log('  ❌ Has Blacklisted?', hasBlacklisted ? 'FAIL' : 'PASS');
      console.log('  ✅ Has Leg Extension?', hasLegExtension ? 'PASS' : 'FAIL');
      console.log('  ✅ Has Leg Curl?', hasLegCurl ? 'PASS' : 'FAIL');

    } else {
      console.log('❌ Generation Failed:', result.error);
    }
  }
}

runTests();
```

### Phase 2: Real-World Testing (After Fix)
1. **Create test profile** with common preferences
2. **Generate 10 workouts** for each type (legs, push, pull)
3. **Manually review** each workout for quality
4. **Track metrics**:
   - % of workouts with blacklisted exercises (target: 0%)
   - % of workouts with mandatory exercises (target: 100%)
   - User satisfaction rating

---

## 📚 Exercise Science Reference

### Leg Day Exercise Hierarchy (Evidence-Based)

#### Tier 1: Compound Movements (Pick 1-2)
- **Squat** (Back/Front/Goblet): Best overall quad/glute developer
- **Leg Press**: Great for quad volume without lower back fatigue
- **Deadlift/RDL**: Best hamstring/posterior chain builder

#### Tier 2: Isolation Movements (Pick 2-3)
- **Leg Extension**: Only exercise to truly isolate quads
- **Leg Curl**: Direct hamstring isolation
- **Walking Lunges**: Unilateral strength (functional)

#### Tier 3: Accessory Work (Pick 1-2)
- **Calf Raise** (Standing/Seated): Calf development
- **Hip Thrust**: Glute isolation (if training glutes)
- **Leg Press Calf Raise**: Calf variation

### Training Style Exercise Selection

| Training Style | Primary Exercises | Rep Range | Rest Period |
|---------------|-------------------|-----------|-------------|
| **Powerlifting** | Squat, Deadlift, Front Squat | 3-6 | 3-5 min |
| **Bodybuilding** | Leg Press, Leg Extension, Leg Curl | 8-12 | 60-90s |
| **General Fitness** | Goblet Squat, Lunges, Leg Curl | 10-15 | 60s |
| **Athletic** | Jump Squat, Bulgarian Split Squat, Hip Thrust | 6-10 | 90-120s |

### Scientifically-Proven Workout Structures

#### Bodybuilding Leg Day (Hypertrophy)
```
1. Leg Press: 4 sets x 10-12 reps (compound quad focus)
2. Leg Extension: 3 sets x 12-15 reps (quad isolation)
3. Romanian Deadlift: 3 sets x 10-12 reps (hamstring focus)
4. Leg Curl: 3 sets x 12-15 reps (hamstring isolation)
5. Calf Raise: 4 sets x 15-20 reps (calf focus)
```

#### Powerlifting Leg Day (Strength)
```
1. Back Squat: 5 sets x 3-5 reps (main lift)
2. Deadlift: 4 sets x 3-5 reps (main lift)
3. Front Squat: 3 sets x 6-8 reps (quad focus)
4. Leg Curl: 3 sets x 8-10 reps (hamstring accessory)
```

---

## 🎬 Action Plan

### Immediate Actions (Today)
1. ✅ Create this planning document
2. ⬜ Add debug logging to `AIWorkoutGenerator.js`
3. ⬜ Create test script (`test-workout-generation.js`)
4. ⬜ Run tests to see current AI behavior
5. ⬜ Document exactly what's going wrong

### Short-Term (This Week)
1. ⬜ Implement **Option 1** (Stricter Prompt Engineering)
2. ⬜ Test with all workout types (legs, push, pull)
3. ⬜ Verify blacklist enforcement
4. ⬜ If still broken → Move to Option 2

### Long-Term (Next Week)
1. ⬜ Implement **Option 3** (Template-Based System)
2. ⬜ Build exercise database with proper categorization
3. ⬜ Create workout templates for all training styles
4. ⬜ Let AI enhance templates (not create from scratch)

---

## 💡 Additional Ideas

### Exercise Database Enhancement
Add metadata to exercises for better filtering:
```javascript
{
  name: 'Leg Extension',
  category: 'isolation',
  tier: 'mandatory', // mandatory, recommended, optional
  primaryMuscles: ['quadriceps'],
  equipment: 'machine',
  trainingStyles: ['bodybuilding', 'powerlifting', 'general-fitness'],
  difficulty: 'beginner',
  substituteFor: [], // e.g., "Front Squat" if gym doesn't have squat rack
}
```

### User Feedback Loop
After workout generation:
1. Ask user: "Rate this workout (1-5 stars)"
2. Ask: "Which exercises don't fit your style?"
3. Use feedback to improve future generations

### Scientific Research Integration
If you have scientific papers/studies on exercise selection:
- Add reference links to each exercise
- Show users WHY an exercise was chosen ("Leg Extension chosen because: maximally activates vastus medialis")

---

## 📝 Notes for Future Research

Please share any scientific exercise resources you have! I can integrate:
- Exercise effectiveness studies
- Optimal rep ranges by goal
- Training volume recommendations
- Exercise progression charts
- Muscle activation data (EMG studies)

---

## 🔗 Related Files to Modify

- `src/services/ai/tools/AIWorkoutGenerator.js` - Main AI generator
- `src/data/exerciseDatabase.js` - Exercise data
- `src/services/WorkoutCacheService.js` - Caching logic
- `test-workout-generation.js` - New test file (create this)

---

**Status**: 🟡 Planning Phase
**Next Step**: Add debug logging and run tests
**Priority**: 🔥 HIGH (core feature broken)
