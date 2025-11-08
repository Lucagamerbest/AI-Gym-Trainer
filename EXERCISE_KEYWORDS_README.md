# Exercise Keywords for Smart Input

## Overview
This document contains a comprehensive list of **1,326 exercise keywords** extracted from the exercise database (`C:\Users\lucar\AI-Gym-Trainer\src\data\exerciseDatabase.js`).

## What's Included

### 1. Base Exercise Names (85 exercises)
All exercise names from the database, e.g.:
- Bench Press
- Lateral Raise
- Pull Ups
- Squat
- etc.

### 2. Equipment Combinations (800+ variations)
For each exercise with equipment variants, combinations like:
- "Lateral Raise" → "cable lateral raise", "dumbbell lateral raise", "machine lateral raise"
- "Bench Press" → "barbell bench press", "dumbbell bench press", "smith machine bench press", "machine bench press"
- "Squat" → "barbell squat", "dumbbell squat", "smith machine squat"

### 3. Common Alternative Names (200+ variations)
Popular exercise aliases and abbreviations:
- "bench press" → "bp", "flat bench", "flat bench press"
- "shoulder press" → "overhead press", "military press", "ohp"
- "lateral raise" → "side raise", "lat raise", "side delt raise"
- "deadlift" → "dl"
- "romanian deadlift" → "rdl"
- "skull crusher" → "skullcrusher", "lying tricep extension"

### 4. Singular/Plural Variations
Both forms included:
- "pull up" / "pull ups"
- "squat" / "squats"
- "curl" / "curls"

### 5. Hyphenated Variations
Multiple formats supported:
- "pull ups", "pull-ups", "pullups"
- "push ups", "push-ups", "pushups"
- "sit ups", "sit-ups", "situps"

## File Location
**Main File:** `C:\Users\lucar\AI-Gym-Trainer\exercise_keywords_complete.js`

## Usage

### Import the keywords:
```javascript
import exerciseKeywords from './exercise_keywords_complete.js';
// or
import { exerciseKeywords } from './exercise_keywords_complete.js';
```

### Add to Smart Input vocabulary:
```javascript
const smartInputConfig = {
  vocabulary: [
    ...exerciseKeywords,
    // ... other keywords
  ]
};
```

## Critical Examples
These combinations were missing before but are now included:

1. **Cable Lateral Raise** ✓
   - `'cable lateral raise'`
   - `'cable-lateral-raise'`
   - `'lateral raise cable'`
   - `'lateral-raise-cable'`

2. **Dumbbell Bench Press** ✓
   - `'dumbbell bench press'`
   - `'dumbbell-bench-press'`
   - `'bench press dumbbell'`
   - `'bench-press-dumbbell'`

3. **Barbell Squat** ✓
   - `'barbell squat'`
   - `'barbell-squat'`
   - `'squat barbell'`
   - `'squat-barbell'`
   - `'back squat'`
   - `'back-squat'`

## Statistics
- **Total Keywords:** 1,326
- **Base Exercises:** 85
- **Equipment Combinations:** ~800
- **Alternative Names:** ~200
- **Variations (singular/plural/hyphenated):** ~300

## Equipment Types Supported
- Barbell
- Dumbbell
- Cable
- Smith Machine
- Machine
- EZ Bar
- Trap Bar
- Kettlebell
- Resistance Band
- Medicine Ball
- Bodyweight
- Pull-up Bar
- Gymnastic Rings

## Next Steps
1. Import `exercise_keywords_complete.js` into your Smart Input configuration
2. Add the keywords to your vocabulary array
3. Test with queries like:
   - "cable lateral raise"
   - "dumbbell bench press"
   - "barbell squat"
   - "ez bar skull crusher"
   - "smith machine shoulder press"

## Notes
- All keywords are lowercase for case-insensitive matching
- Both "equipment + exercise" and "exercise + equipment" formats included
- Hyphenated and space-separated versions both included
- Common gym abbreviations included (bp, dl, rdl, ohp, etc.)
