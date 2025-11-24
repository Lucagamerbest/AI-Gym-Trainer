# Exercise to Free Exercise DB Image Mapping

## Overview

This comprehensive mapping connects **85 exercises** with **247 exercise variants** from your AI Gym Trainer app to the [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) image library.

## Files Generated

1. **exerciseImages.js** - Ready-to-use JavaScript file with complete mappings
2. **exercise_mapping_final.json** - JSON format of the mappings
3. **mapping_summary.md** - Detailed breakdown by muscle group
4. **unmapped_exercises_final.json** - List of any unmapped exercises (currently empty!)

## Statistics

- **Total Exercises:** 85
- **Total Exercise Variants:** 247
- **Muscle Groups Covered:** 9 (Chest, Back, Shoulders, Biceps, Triceps, Abs, Legs, Forearms, Cardio)
- **Success Rate:** 100% - All exercises have been mapped!

## Usage

### Integration into Your App

The `exerciseImages.js` file contains:

1. **exerciseImages** object - Maps exercise name + equipment to Free Exercise DB ID
2. **getExerciseImageUrl()** - Helper function to get image URL
3. **getExerciseImages()** - Helper to get both start and end position images

### Example Usage

```javascript
import { exerciseImages, getExerciseImageUrl, getExerciseImages } from './exerciseImages.js';

// Get a single image
const imageUrl = getExerciseImageUrl('Bench Press', 'Barbell', 0);
// Returns: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg"

// Get both images (start and end position)
const images = getExerciseImages('Bench Press', 'Barbell');
// Returns: {
//   start: "https://...../0.jpg",
//   end: "https://...../1.jpg"
// }

// Direct access to mapping
const exerciseId = exerciseImages['Bench Press']['Barbell'];
// Returns: "Barbell_Bench_Press_-_Medium_Grip"
```

### Image URL Format

All images follow this pattern:
```
https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{EXERCISE_ID}/{IMAGE_INDEX}.jpg
```

Where:
- `EXERCISE_ID` is the mapped ID (e.g., "Barbell_Bench_Press_-_Medium_Grip")
- `IMAGE_INDEX` is 0 for start position, 1 for end position

## Mapping Strategy

The mapping was created using intelligent matching:

1. **Direct Name Matching** - Exact or close name matches
2. **Equipment Matching** - Matching equipment types between databases
3. **Muscle Group Verification** - Ensuring exercises target the same muscle groups
4. **Keyword Analysis** - Breaking down exercise names into keywords for fuzzy matching
5. **Manual Curation** - Hand-selected alternatives for exercises without exact matches

## Exercise Coverage by Muscle Group

### Chest (7 exercises, 24 variants)
- Bench Press (4 variants)
- Incline Bench Press (4 variants)
- Decline Bench Press (3 variants)
- Chest Fly (3 variants)
- Cable Crossover (3 variants)
- Push-ups (4 variants)
- Chest Dips (3 variants)

### Back (12 exercises, 29 variants)
- Lat Pulldown (4 variants)
- Cable Row (2 variants)
- One Arm Row (2 variants)
- Pullover (3 variants)
- Band Assisted Pull-up (3 variants)
- Cable Incline Pushdown (2 variants)
- Chin Up (2 variants)
- Muscle Up (2 variants)
- One Arm Lat Pulldown (2 variants)
- Pull Ups (2 variants)
- V Bar Pulldown (2 variants)
- Weighted Pull Ups (3 variants)

### Shoulders (6 exercises, 25 variants)
- Shoulder Press (5 variants)
- Lateral Raise (4 variants)
- Front Raise (4 variants)
- Shrugs (4 variants)
- Rear Delt Fly (3 variants)
- Upright Row (4 variants)

### Biceps (10 exercises, 31 variants)
- Bicep Curl (4 variants)
- One Arm Bicep Curl (3 variants)
- Hammer Curl (3 variants)
- Preacher Curl (5 variants)
- Concentration Curl (3 variants)
- Cross Body Hammer Curl (3 variants)
- High Cable Curl (2 variants)
- Reverse Curl (3 variants)
- Spider Curl (3 variants)
- Zottman Curl (2 variants)

### Triceps (10 exercises, 28 variants)
- Tricep Pushdown (3 variants)
- One Arm Tricep Pushdown (2 variants)
- Overhead Tricep Extension (3 variants)
- One Arm Overhead Extension (2 variants)
- Skull Crusher (3 variants)
- Dips (3 variants)
- Close Grip Bench Press (3 variants)
- Cable Incline Tricep Extension (2 variants)
- Diamond Push-ups (3 variants)
- Weighted Dips (3 variants)

### Abs (10 exercises, 27 variants)
- Crunches (3 variants)
- Plank (3 variants)
- Leg Raises (3 variants)
- Russian Twist (4 variants)
- Cable Woodchop (2 variants)
- Ab Wheel Rollout (3 variants)
- Bicycle Crunches (2 variants)
- Mountain Climbers (2 variants)
- Dead Bug (2 variants)
- Sit-Ups (3 variants)

### Legs (18 exercises, 49 variants)
- Leg Extension (2 variants)
- Leg Curl (3 variants)
- Standing Calf Raise (3 variants)
- Squat (3 variants)
- Hip Abduction (2 variants)
- Glute Kickback (3 variants)
- Hang Clean (2 variants)
- Hip Thrust (3 variants)
- Hack Squat (2 variants)
- Lunges (3 variants)
- Seated Calf Raise (2 variants)
- Deadlift (5 variants)
- Leg Press (2 variants)
- Bulgarian Split Squat (3 variants)
- Front Squat (3 variants)
- Step-Ups (3 variants)
- Hip Adduction (2 variants)
- Glute Bridge (3 variants)

### Forearms (5 exercises, 14 variants)
- Wrist Curl (3 variants)
- Reverse Wrist Curl (3 variants)
- Farmer's Walk (3 variants)
- Plate Pinch (3 variants)
- Wrist Roller (2 variants)

### Cardio (7 exercises, 20 variants)
- Treadmill (5 variants)
- Stationary Bike (3 variants)
- Rowing Machine (2 variants)
- Elliptical (3 variants)
- Jump Rope (3 variants)
- Stair Climber (3 variants)
- Burpees (3 variants)

## Notable Mappings

Some exercises required creative mapping due to differences between databases:

- **Burpees** → Mapped to similar plyometric exercises (Freehand Jump Squat, Box Jump)
- **Cable Woodchop** → Mapped to directional crunch variations
- **Cardio Equipment** → Mapped to specific treadmill/bike/elliptical exercises in the DB

## Validation

All 247 exercise variant mappings have been validated to ensure:
- ✅ The Exercise ID exists in Free Exercise DB
- ✅ The exercise targets the correct muscle group
- ✅ The equipment type matches or is a reasonable alternative
- ✅ Images are accessible via the GitHub raw URL

## Free Exercise DB Attribution

This mapping uses the [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) by @yuhonas, which contains 800+ exercises with images.

**License:** CC0 (Public Domain)
**Repository:** https://github.com/yuhonas/free-exercise-db

## Updates and Maintenance

If new exercises are added to your app:

1. Add them to `exercise_list.json`
2. Run the mapping scripts to attempt automatic matching
3. Manually verify and adjust mappings as needed
4. Regenerate `exerciseImages.js`

## Scripts Used

- `createExerciseMapping.js` - Initial automated mapping
- `createExerciseMappingImproved.js` - Enhanced with manual mappings
- `fixAllMissingIds.js` - Final corrections for edge cases
- `generateExerciseImagesJS.js` - Generates final JavaScript file

## Contact

For questions or issues with the mapping, please refer to the AI Gym Trainer repository.

---

**Generated:** 2025-11-21
**Mapping Version:** 1.0
**Total Coverage:** 100% (247/247 variants mapped)
