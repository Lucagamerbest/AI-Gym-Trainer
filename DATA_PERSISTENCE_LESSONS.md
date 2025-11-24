# Data Persistence Lessons Learned

## Critical Bug: Stale Closure in useEffect (Fixed 2025-11-23)

### The Problem
Data was being saved correctly to AsyncStorage but would disappear from the UI when navigating away and back to the WorkoutScreen. The issue was a **stale closure bug** in a useEffect hook.

### Root Cause
There was an old initialization useEffect (lines 933-978) that:
1. Depended on `workoutExercises.length`
2. Read the `exerciseSets` state variable
3. But did NOT include `exerciseSets` in its dependency array

This caused a stale closure where:
1. Component mounted with empty `exerciseSets = {}`
2. Initialization loaded good data: `{0: [{weight: "250", reps: "25"}]}`
3. The old effect then ran with the STALE/OLD value of `exerciseSets` (which was `{}`)
4. It created new empty sets for all exercises, overwriting the good data!

### The Fix
**Disabled the old initialization effect entirely** (WorkoutScreen.js:933-978)

The effect now returns early with a log message explaining why it's disabled. We use a simpler "auto-set handler" effect instead that properly handles adding sets for new exercises.

### Key Lessons

#### 1. Stale Closures in useEffect
**Problem:** Reading a state variable inside useEffect without including it in the dependency array creates a stale closure.

**Solution:** Either:
- Include the variable in the dependency array (but watch for infinite loops!)
- Use the functional form of setState to get current value: `setState(prev => ...)`
- Use refs to track values that don't need to trigger re-renders

#### 2. Multiple Effects Modifying Same State
**Problem:** Having multiple useEffect hooks that modify the same state variable can cause race conditions and unexpected overwrites.

**Solution:**
- Consolidate related logic into a single effect when possible
- Use clear guards and early returns to prevent effects from running when they shouldn't
- Add extensive logging to track which effect is running when

#### 3. Initialization Timing
**Problem:** React Strict Mode and passive effects can cause components to mount/unmount multiple times, leading to double initialization.

**Solution:**
- Use a `hasInitializedRef` guard to prevent re-initialization
- Set the guard BEFORE doing any state updates
- Never re-run initialization once it's complete

#### 4. Debugging State Changes
**Useful techniques:**
- Add a logging wrapper around setState to track all changes
- Log stack traces to identify which code path is calling setState
- Add detailed logging at the start of each useEffect
- Use emoji prefixes in logs to quickly identify which effect is running

### Code Pattern: Safe Initialization
```javascript
const hasInitializedRef = useRef(false);

useEffect(() => {
  const initializeData = async () => {
    // Prevent double initialization
    if (hasInitializedRef.current) {
      console.log('⚠️ Skipping re-initialization');
      return;
    }

    // Load data from storage
    const data = await loadFromStorage();

    // Set state
    setState(data);

    // Mark as initialized AFTER setting state
    hasInitializedRef.current = true;
  };

  initializeData();
}, []); // Empty deps - only run on mount
```

### Code Pattern: Auto-Create Missing Data
```javascript
useEffect(() => {
  // Wait until initialization is complete
  if (!hasInitializedRef.current) {
    return;
  }

  // Check ALL items and create defaults for missing ones
  const updated = { ...currentData };
  let needsUpdate = false;

  items.forEach((item, index) => {
    if (!updated[index] || updated[index].length === 0) {
      updated[index] = createDefault(item);
      needsUpdate = true;
    }
  });

  if (needsUpdate) {
    setState(updated);
  }
}, [items.length, hasInitializedRef.current]);
```

### Related Files
- `src/screens/WorkoutScreen.js` - Main file with initialization and data persistence logic
- Lines 645-753: Initialization effect
- Lines 766-811: Auto-set handler (creates default sets for exercises)
- Lines 933-978: OLD disabled initialization effect (DO NOT RE-ENABLE)

## Auto-Creating Default Sets (Fixed 2025-11-23)

### The Problem
When starting a new workout or adding exercises, users had to manually click "Add Set" before they could enter data. This was a poor UX.

### Requirements
1. **First exercise** when starting a workout should automatically have one empty set
2. **New exercises** added later should automatically get one empty set
3. Default sets should be EMPTY (not pre-filled with values like "10")
4. UI placeholders (like "10 reps") should be shown in the input fields, but not as actual values

### The Solution
Implemented **two complementary approaches**:

#### 1. During Initialization (for first exercise)
When loading workout data, check if any exercises are missing sets and create empty defaults:

```javascript
// In initialization effect (lines 732-746)
const restoredSets = { ...activeWorkout.exerciseSets };

activeWorkout.exercises?.forEach((ex, index) => {
  if (!restoredSets[index] || !Array.isArray(restoredSets[index]) || restoredSets[index].length === 0) {
    const isCardio = isCardioExercise(ex);
    const isBodyweight = isBodyweightExercise(ex);
    restoredSets[index] = isCardio
      ? [{ duration: 0, completed: false }]
      : isBodyweight
        ? [{ reps: '', completed: false }]  // Empty string, not "10"
        : [{ weight: '', reps: '', completed: false }];
  }
});

setExerciseSets(restoredSets);
```

**Why during initialization?** When a user starts a new workout with the first exercise, the exercise count is already 1, so there's no "increase" to trigger an effect. We need to create the default set immediately during initialization.

#### 2. Auto-Set Handler (for subsequently added exercises)
A useEffect that runs after initialization and when exercises are added:

```javascript
// Auto-set handler effect (lines 786-841)
useEffect(() => {
  const currentExerciseCount = activeWorkout?.exercises?.length || 0;

  // Skip until initialization completes
  if (!hasInitializedRef.current) {
    prevExerciseCountRef.current = currentExerciseCount;
    return;
  }

  // Run on initial check OR when exercises added
  const isInitialCheck = hasInitializedRef.current && !hasRunInitialCheckRef.current;
  const hasExercisesAdded = currentExerciseCount > prevExerciseCountRef.current;

  if (!isInitialCheck && !hasExercisesAdded) {
    return;
  }

  // Use functional setState to avoid stale closures
  setExerciseSets(currentSets => {
    const updatedSets = { ...currentSets };
    const startIndex = isInitialCheck ? 0 : prevExerciseCountRef.current;

    for (let index = startIndex; index < activeWorkout.exercises.length; index++) {
      const ex = activeWorkout.exercises[index];
      if (!updatedSets[index] || updatedSets[index].length === 0) {
        // Create empty set
        updatedSets[index] = [{ weight: '', reps: '', completed: false }];
      }
    }

    return updatedSets;
  });
}, [activeWorkout?.exercises?.length]);
```

**Key features:**
- Uses **functional setState** to get current value and avoid stale closures
- Only runs AFTER initialization completes
- On initial check, verifies ALL exercises have sets
- On subsequent runs, only checks NEW exercises (from prevExerciseCountRef onward)

### Why Two Approaches?

**Can't we just use the auto-set handler?**
No, because of timing:
1. When starting a new workout, exercises are added DURING initialization
2. hasInitializedRef is false, so auto-set handler skips
3. After initialization, exercise count is already 1 (no change to trigger effect)
4. Result: First exercise never gets a default set

**Can't we just use initialization?**
No, because initialization only runs once:
1. When user adds a 2nd/3rd exercise via navigation
2. They return to WorkoutScreen which is already mounted
3. Initialization doesn't re-run (hasInitializedRef = true)
4. Result: New exercises don't get default sets

### Testing Checklist
When making changes to data persistence:
1. ✅ Start a workout, add sets with data (weights/reps)
2. ✅ Navigate away (home button or back navigation)
3. ✅ Return to active workout
4. ✅ Verify data is still there
5. ✅ Add a new exercise
6. ✅ Verify it has a default empty set automatically
7. ✅ Start a BRAND NEW workout with first exercise
8. ✅ Verify first exercise has a default empty set automatically
9. ✅ Check logs to ensure no effects are running with stale data
