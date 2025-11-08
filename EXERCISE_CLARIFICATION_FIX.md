# Exercise Clarification Quick Replies Fix

## Problem
When the AI asked for clarification (e.g., "Which bench press exercise do you want to replace?"), the quick reply buttons showed generic options like "Yes", "No", "Not sure" instead of the actual exercise options.

## Root Cause
The `replaceExerciseInWorkout` tool was returning an error message as a string when multiple exercises matched, but there was no structured data that the UI could use to create quick reply buttons.

## Solution

### 1. Updated WorkoutTools.js (lines 528-539)
Modified the tool to return structured data when multiple matches are found:

```javascript
} else if (matches.length > 1) {
  // Multiple matches - return structured data for UI to create quick reply buttons
  const matchNames = matches.map(m => m.ex.name);
  return {
    success: false,
    error: `"${oldExerciseName}" matches multiple exercises. Which one did you mean?`,
    matches: matchNames, // Array of exercise names for quick reply buttons
    clarificationNeeded: true,
    originalRequest: oldExerciseName,
    newExercise: newExerciseName
  };
}
```

**Key Changes:**
- Added `matches` array containing the exercise names
- Added `clarificationNeeded` flag for easy detection
- Added `originalRequest` and `newExercise` to reconstruct the replace command

### 2. Added Detection Function in AIButtonModal.js (lines 374-402)
Created a new function to detect when clarification is needed:

```javascript
const detectExerciseClarificationQuestion = (response) => {
  if (!response) return false;

  // Check if lastToolResults contains clarificationNeeded flag
  if (lastToolResults?.some(tool => tool.result?.clarificationNeeded)) {
    return true;
  }

  const lowerResponse = response.toLowerCase();
  const clarificationKeywords = [
    'which one did you mean',
    'multiple exercises',
    'matches multiple',
    'which.*exercise',
    'did you mean',
  ];

  return clarificationKeywords.some(keyword => {
    if (keyword.includes('.*')) {
      const regex = new RegExp(keyword);
      return regex.test(lowerResponse);
    }
    return lowerResponse.includes(keyword);
  });
};
```

**Detection Strategy:**
1. First checks if tool results have `clarificationNeeded` flag (most reliable)
2. Falls back to keyword detection in AI response text

### 3. Added Detection Call (line 1333)
Added the new detection to the list of question detectors:

```javascript
const isExerciseClarificationQuestion = detectExerciseClarificationQuestion(lastResponse);
```

### 4. Updated Quick Reply Label (line 1915)
Added exercise clarification to the label logic:

```javascript
{isExerciseClarificationQuestion ? 'Which exercise?' : ...}
```

### 5. Added Quick Reply Buttons (lines 1933-1960)
Created a new case to render exercise options as buttons:

```javascript
} : isExerciseClarificationQuestion ? (
  <>
    {/* Exercise Clarification Buttons - Show matching exercises */}
    {(() => {
      // Extract matches from tool results
      const toolWithMatches = lastToolResults?.find(tool => tool.result?.matches);
      const matches = toolWithMatches?.result?.matches || [];
      const originalRequest = toolWithMatches?.result?.originalRequest || '';
      const newExercise = toolWithMatches?.result?.newExercise || '';

      if (matches.length === 0) return null;

      return matches.map((exerciseName, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.quickReplyButton, styles.exerciseButton]}
          onPress={() => {
            // User selects specific exercise - send replace command with full name
            handleQuickReply(`Replace ${exerciseName} with ${newExercise}`);
          }}
          disabled={loadingButton !== null}
          activeOpacity={0.7}
        >
          <Text style={styles.quickReplyText}>🏋️ {exerciseName}</Text>
        </TouchableOpacity>
      ));
    })()}
  </>
) : isDaysQuestion ? (
```

## How It Works Now

### Before:
1. User: "Replace bench with squat"
2. Tool finds: "Barbell Bench Press", "Dumbbell Bench Press"
3. Tool returns: `error: "bench matches multiple exercises: Barbell Bench Press, Dumbbell Bench Press. Please be more specific."`
4. AI asks: "Which exercise did you mean?"
5. UI shows: [Yes] [No] [Not sure] ❌

### After:
1. User: "Replace bench with squat"
2. Tool finds: "Barbell Bench Press", "Dumbbell Bench Press"
3. Tool returns structured data with `matches` array
4. AI asks: "Which exercise did you mean?"
5. UI shows: [🏋️ Barbell Bench Press] [🏋️ Dumbbell Bench Press] ✅
6. User taps one → sends "Replace Barbell Bench Press with squat"

## Benefits

✅ **Better UX**: Users can tap the exercise they want instead of typing
✅ **Fewer errors**: No typos when selecting from list
✅ **Faster**: One tap vs typing full exercise name
✅ **Clearer**: User sees exactly which exercises matched
✅ **Consistent**: Matches the pattern used for other quick replies

## Files Modified

1. **src/services/ai/tools/WorkoutTools.js** (lines 528-539)
   - Modified multiple match return to include structured data

2. **src/components/AIButtonModal.js**
   - Added `detectExerciseClarificationQuestion` function (lines 374-402)
   - Added detection call (line 1333)
   - Updated quick reply label (line 1915)
   - Added exercise clarification buttons (lines 1933-1960)

## Testing

To test this fix:

1. Generate a workout with multiple bench press exercises (e.g., "Barbell Bench Press" and "Dumbbell Bench Press")
2. Type "replace bench with squat"
3. Verify that quick reply buttons show the specific exercise names
4. Tap one of the buttons
5. Verify that the replace command is sent with the full exercise name

## Status
✅ **Complete** - Exercise clarification now shows specific exercise options as quick reply buttons instead of generic Yes/No buttons.

**Last Updated:** 2025-11-08
