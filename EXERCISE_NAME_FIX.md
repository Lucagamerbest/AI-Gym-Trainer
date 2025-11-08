# Exercise Name Fix - Include Equipment in Exercise Names

## 🎯 Problem

From user's logs, exercises were showing without equipment:
```
✅ Workout title: "Dumbbell Upper" (CORRECT)
❌ Exercise names: "Bench Press" instead of "Dumbbell Bench Press"
❌ Replace failing: Looking for "Barbell Bench Press" but only "Bench Press" exists
```

**Root Cause**: AI was returning JSON with equipment as a separate field:
```json
{
  "name": "Bench Press",
  "equipment": "Dumbbell"
}
```

But exercises should display with equipment in the name itself: `"Dumbbell Bench Press"`

---

## ✅ Solution Implemented

### Fix #1: Combine Equipment + Name in parseAIResponse

**File**: `src/services/ai/tools/AIWorkoutGenerator.js` (lines 599-627)

**What Changed**:
- Extract equipment from AI response
- Combine equipment + name to create full variant name
- Only add equipment if it's not already in the name
- Skip for "unknown" and "bodyweight" equipment

```javascript
// Match exercises to database
const matchedExercises = parsed.exercises.map(aiEx => {
  // Pass equipment to finder for smarter matching
  const dbExercise = findExerciseInDatabase(aiEx.name, exerciseDatabase, aiEx.equipment);

  // Combine equipment + name to get full variant (e.g., "Dumbbell Bench Press")
  let fullExerciseName = dbExercise?.name || aiEx.name;
  const equipment = dbExercise?.equipment || aiEx.equipment || 'unknown';

  // If equipment exists and is not already in the name, prepend it
  if (equipment && equipment !== 'unknown' && equipment !== 'bodyweight') {
    const nameLower = fullExerciseName.toLowerCase();
    const equipmentLower = equipment.toLowerCase();

    // Only add equipment if it's not already in the name
    if (!nameLower.includes(equipmentLower)) {
      fullExerciseName = `${equipment} ${fullExerciseName}`.trim();
    }
  }

  return {
    name: fullExerciseName, // Now includes equipment!
    equipment: equipment,
    primaryMuscles: dbExercise?.primaryMuscles || [],
    sets: parseInt(aiEx.sets) || 3,
    reps: aiEx.reps || '8-12',
    restPeriod: aiEx.rest || '90s',
    notes: aiEx.notes || '',
  };
});
```

**Result**:
- Before: `{ name: "Bench Press", equipment: "Dumbbell" }`
- After: `{ name: "Dumbbell Bench Press", equipment: "Dumbbell" }`

---

### Fix #2: Smart Equipment-Aware Exercise Matching

**File**: `src/services/ai/tools/AIWorkoutGenerator.js` (lines 641-709)

**What Changed**:
- Updated `findExerciseInDatabase()` to accept equipment parameter
- Added equipment keyword parsing from exercise names
- 5 matching strategies with equipment awareness:
  1. Exact match (name + equipment)
  2. Exact name match (any equipment)
  3. Exact name match with target equipment
  4. Partial match (name contains or is contained)
  5. Word overlap (at least 2 words match)

```javascript
function findExerciseInDatabase(name, database, targetEquipment = null) {
  const nameLower = name.toLowerCase();

  // SMART PARSING: Check if equipment is already in the name
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

  // ... more strategies
}
```

**Benefits**:
- Handles "Dumbbell Bench Press" by extracting equipment from name
- Matches correct variant when AI specifies equipment
- Falls back to fuzzy matching if exact match fails
- Better console logging: `Matched "Bench Press" → "Bench Press" (Dumbbell)`

---

## 🎬 How It Works Now

### Example Flow:

**AI Response**:
```json
{
  "name": "Dumbbell Upper",
  "exercises": [
    {
      "name": "Bench Press",
      "equipment": "Dumbbell",
      "sets": 4,
      "reps": "8-12"
    }
  ]
}
```

**Step 1**: `parseAIResponse()` receives this data

**Step 2**: For each exercise, call `findExerciseInDatabase("Bench Press", database, "Dumbbell")`

**Step 3**: Smart matcher finds: `{ name: "Bench Press", equipment: "Dumbbell", ... }` from database

**Step 4**: Combine equipment + name:
- `fullExerciseName = "Bench Press"`
- `equipment = "Dumbbell"`
- Check if "dumbbell" is in "bench press" → NO
- Add equipment: `fullExerciseName = "Dumbbell Bench Press"`

**Step 5**: Return exercise:
```javascript
{
  name: "Dumbbell Bench Press", // ✅ Equipment included!
  equipment: "Dumbbell",
  primaryMuscles: ["Chest"],
  sets: 4,
  reps: "8-12",
  restPeriod: "90s",
  notes: ""
}
```

**Final Display**:
```
Here is your Upper Body workout:

Dumbbell Upper
• Dumbbell Bench Press - 4×8-12
• Dumbbell One Arm Row - 4×8-12
• Dumbbell Shoulder Press - 3×10-12
```

---

## 🧪 Testing

### Test Scenario 1: Dumbbell Upper Workout
```
1. Generate upper body workout (tap "Upper workout")
2. Wait for AI response
3. ✅ Workout title should show equipment type (e.g., "Dumbbell Upper")
4. ✅ Each exercise should include equipment (e.g., "Dumbbell Bench Press")
5. ✅ Replace function should now find "Dumbbell Bench Press" correctly
```

### Test Scenario 2: Replace with Equipment Variants
```
1. Generate push workout
2. Type: "replace"
3. ✅ Should see: [Dumbbell Bench Press] [Machine Shoulder Press] etc.
4. Tap exercise (e.g., [Machine Shoulder Press])
5. Tap: [with]
6. Type: "barbell shoulder"
7. ✅ Should suggest: [Barbell Shoulder Press]
8. Send and verify replacement works
```

### Test Scenario 3: Different Equipment Types
```
1. Generate leg workout (might get Machine, Barbell, or Dumbbell variant)
2. ✅ All exercises should show equipment in name
3. ✅ Example: "Barbell Squat", "Machine Leg Press", "Cable Lateral Raise"
```

---

## 📝 Files Modified

1. **`src/services/ai/tools/AIWorkoutGenerator.js`**
   - Updated `parseAIResponse()` to combine equipment + name (lines 599-627)
   - Enhanced `findExerciseInDatabase()` with equipment-aware matching (lines 641-709)

---

## 💡 Benefits

1. **Accurate Exercise Display**: Users see exactly which variant they're doing
   - Before: "Bench Press" (confusing - which type?)
   - After: "Dumbbell Bench Press" (clear!)

2. **Replace Function Works**: Can now find and replace specific variants
   - Before: "replace bench press" → couldn't find "Bench Press" because AI had "Barbell Bench Press"
   - After: "replace Dumbbell Bench Press" → finds exact variant

3. **Smart Matching**: Multiple fallback strategies ensure exercises are found
   - Exact name + equipment match
   - Fuzzy name matching
   - Word overlap matching

4. **Equipment Keyword Extraction**: Handles both formats
   - AI returns: `{ name: "Bench Press", equipment: "Dumbbell" }` → Works ✅
   - AI returns: `{ name: "Dumbbell Bench Press", equipment: null }` → Works ✅

---

## ✅ Result

**Exercise names now properly include equipment variants!**

Before:
```
Bodybuilding Push
• Bench Press - 4×10-12
• Shoulder Press - 4×10-12
• Lateral Raise - 3×12-15
```

After:
```
Machine Push
• Machine Bench Press - 4×10-12
• Machine Shoulder Press - 4×10-12
• Cable Lateral Raise - 3×12-15
```

---

**Status**: Exercise name fix implemented! ✅
**Impact**: All exercises now show equipment variants properly
**Last Updated**: 2025-11-08
