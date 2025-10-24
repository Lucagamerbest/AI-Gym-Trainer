# ✅ Testing Checklist - AI Tool System

## Part 1: Visual Verification (See the UI Changes)

### Step 1: Open the App
1. Make sure your app is running (reload if needed)
2. Navigate to **AI tab** (bottom navigation)
3. The AI chat modal should auto-open

### Step 2: Look for Test Buttons
**Location:** Just above the text input box, you should see:

```
┌─────────────────────────────────────────────────────┐
│  🧪 Quick Tests                                     │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │ 💪 Generate      │ │ 🔍 Search        │  ...    │
│  │    Workout       │ │    Exercises     │         │
│  └──────────────────┘ └──────────────────┘         │
└─────────────────────────────────────────────────────┘
│                                                     │
│  Type your message...                  [Send]      │
└─────────────────────────────────────────────────────┘
```

**What to look for:**
- ✅ Horizontal row of pill-shaped buttons
- ✅ Label "🧪 Quick Tests" above the buttons
- ✅ 8 different test buttons (scrollable)
- ✅ Located ABOVE the text input

**If you DON'T see them:**
- Make sure you're in development mode
- Try reloading the app (shake device → Reload)
- Check console for errors

---

## Part 2: Test the Tool System (Verify It Works)

### 🎯 Test Questions to Ask the AI

Copy these questions and paste them in the chat (or use the buttons!):

---

### ✅ Test 1: Workout Generation Tool
**Question:**
```
Create a chest and triceps workout for me
```

**What to look for in response:**
- ✅ Complete workout plan with 5-7 exercises
- ✅ Each exercise has sets, reps, rest time
- ✅ Structured format (numbered list)
- ✅ Console log: `🔧 Executing tool: generateWorkoutPlan`
- ✅ Console log: `🔧 Tools used: 1`

**Expected response example:**
```
I've created a 60-minute chest and triceps workout:

Chest + Triceps Hypertrophy

1. Barbell Bench Press - 4 sets × 8-12 reps (180s rest)
2. Incline Dumbbell Press - 4 sets × 8-12 reps (90s rest)
3. Cable Flyes - 3 sets × 10-15 reps (60s rest)
...
```

---

### ✅ Test 2: Exercise Search Tool
**Question:**
```
Show me all back exercises with dumbbells
```

**What to look for:**
- ✅ List of exercises with dumbbell equipment
- ✅ Exercise names, muscles targeted
- ✅ Console log: `🔧 Executing tool: searchExercises`
- ✅ Multiple exercises listed (5-10)

**Expected response example:**
```
Here are dumbbell back exercises:

1. Dumbbell Row - Targets: lats, upper back
2. Dumbbell Pullover - Targets: lats, chest
3. Single Arm Row - Targets: lats, rear delts
...
```

---

### ✅ Test 3: Macro Calculator Tool
**Question:**
```
Calculate my macros for cutting at 80kg, 180cm, 25 years old, male, moderate activity
```

**What to look for:**
- ✅ Specific calorie target
- ✅ Protein, carbs, fat in grams
- ✅ BMR and TDEE mentioned
- ✅ Console log: `🔧 Executing tool: calculateMacros`

**Expected response example:**
```
For cutting at your stats:

Calories: 2200
Protein: 193g
Carbs: 220g
Fat: 61g

BMR: 1800, TDEE: 2700
```

---

### ✅ Test 4: Exercise Alternatives Tool
**Question:**
```
Find an alternative to bench press
```

**What to look for:**
- ✅ List of 3-5 alternative exercises
- ✅ Similar muscle groups mentioned
- ✅ Console log: `🔧 Executing tool: findExerciseAlternatives`

**Expected response example:**
```
Alternatives to bench press:

1. Dumbbell Press - Same muscles, unilateral work
2. Push-ups - Bodyweight option
3. Incline Barbell Press - Upper chest focus
...
```

---

### ✅ Test 5: Exercise Recommendation Tool
**Question:**
```
Recommend new exercises for me
```

**What to look for:**
- ✅ Personalized recommendations based on your data
- ✅ Mentions of undertrained muscle groups
- ✅ Console log: `🔧 Executing tool: recommendExercises`

**Expected response example:**
```
Based on your training, you should try:

1. Romanian Deadlifts - You haven't trained hamstrings much
2. Face Pulls - Rear delts are undertrained
...
```

---

### ✅ Test 6: Workout History Analysis Tool
**Question:**
```
Analyze my workout patterns
```

**What to look for:**
- ✅ Statistics about frequency, volume
- ✅ Most/least trained muscle groups
- ✅ Console log: `🔧 Executing tool: analyzeWorkoutHistory`

**Expected response example:**
```
Workout Analysis:

Total Workouts: 12 in last 30 days
Avg per week: 3.4
Total Volume: 145,000 lbs

Most trained: Chest (8x)
Least trained: Back (2x)
```

---

### ✅ Test 7: Meal Suggestion Tool
**Question:**
```
Suggest a meal with 40g protein and 500 calories
```

**What to look for:**
- ✅ Specific meal suggestions with macros
- ✅ Exact amounts (8oz chicken, etc.)
- ✅ Console log: `🔧 Executing tool: suggestMealsForMacros`

**Expected response example:**
```
Try these meals:

1. Grilled Chicken Breast (8oz)
   - 56g P, 2g F, 280 cal
   Fit score: 85%

2. Greek Yogurt (1 cup) + Protein powder
   - 43g P, 3g F, 310 cal
...
```

---

### ✅ Test 8: Exercise Stats Tool
**Question:**
```
What is my bench press PR?
```

**What to look for:**
- ✅ Personal record details
- ✅ Date of PR
- ✅ Console log: `🔧 Executing tool: getExerciseStats`

**Expected response example:**
```
Bench Press Stats:

PR: 225 lbs × 5 reps
Date: 2025-10-15
Total Sessions: 15
Trend: Increasing
```

---

## Part 3: Console Verification

### What to Check in Console Logs

For EVERY tool-based query, you should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 USER: Create a chest workout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Using AI with function calling enabled
📞 AI called function: generateWorkoutPlan
🔧 Executing tool: generateWorkoutPlan { muscleGroups: [...] }
✅ Function generateWorkoutPlan completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI: [Response here]
🔧 Tools used: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Key logs to verify:**
- ✅ `🔧 Using AI with function calling enabled`
- ✅ `📞 AI called function: [toolName]`
- ✅ `🔧 Executing tool: [toolName]`
- ✅ `✅ Function [toolName] completed`
- ✅ `🔧 Tools used: X`

---

## Part 4: Quick Test with Buttons

### The Fastest Way to Test

1. **Open AI chat**
2. **Tap any test button:**
   - 💪 Generate Workout
   - 🔍 Search Exercises
   - 🧮 Calculate Macros
   - etc.
3. **Watch the magic happen!**
   - Query auto-sends
   - AI calls the appropriate tool
   - You get detailed, data-driven response

**No typing needed!**

---

## ✅ Success Criteria

### You'll know it's working if:

1. **UI Changes Visible:**
   - ✅ Test buttons appear above text input
   - ✅ Buttons are scrollable horizontally
   - ✅ 8 different test options

2. **Tools Execute:**
   - ✅ Console shows tool execution logs
   - ✅ Responses are detailed and structured
   - ✅ Data comes from actual database/calculations

3. **Responses are Different:**
   - ✅ Tool responses are longer and more detailed
   - ✅ Include real data (exercise names, macros, etc.)
   - ✅ Structured format (lists, numbers, stats)

**Compare:**

**OLD (no tools):**
```
User: Create a workout
AI: "I recommend doing bench press and squats."
```

**NEW (with tools):**
```
User: Create a workout
AI: "I've created a complete workout plan:
    1. Bench Press - 4×8-12 (90s)
    2. Incline Press - 4×8-12 (90s)
    ..."
```

---

## 🐛 Troubleshooting

### Test buttons not showing?
- Reload the app
- Make sure you're in dev mode
- Check for import errors in console

### Tools not executing?
- Check console for error messages
- Verify query contains trigger words (plan, create, calculate, etc.)
- Make sure AIService initialized properly

### Responses seem generic?
- Query might not match tool keywords
- AI chose to answer directly instead of using tool
- Try using test buttons instead

---

## 📊 Final Checklist

- [ ] Test buttons visible in UI
- [ ] All 8 buttons present and scrollable
- [ ] Tapping button auto-sends query
- [ ] Console shows tool execution logs
- [ ] Responses include structured data
- [ ] At least 3 different tools tested successfully
- [ ] Macro calculator works with your stats
- [ ] Workout generator creates real plans
- [ ] Exercise search returns real exercises

**Once all checked, the tool system is working! 🎉**
