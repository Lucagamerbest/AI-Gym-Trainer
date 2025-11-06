# AI Section Design Document
## Complete Hierarchical Button-Based AI Interface

> **Design Philosophy:**
> - **No text input** except on AIScreen (Home)
> - **Button-based navigation** - hierarchical menus
> - **Generic requests** - work for all users
> - **Action + Information** - both types mixed
> - **Static/Predefined** - avoid context-aware bugs
> - **AIScreen = Read-only** - no create/modify actions

---

## 🤖 AIScreen (Home Page)
**File:** `AIScreen.js`
**Special Rules:** This is the ONLY screen with text chat input. Read-only AI - can answer questions but CANNOT create/modify data.

### AI Capabilities:
- ✅ Read user data (PRs, workout history, nutrition stats)
- ✅ General fitness knowledge (form, recovery, injury, sleep)
- ✅ Nutrition information (what foods are high in protein, etc.)
- ❌ Create workouts
- ❌ Log meals
- ❌ Modify any user data

### Interface:
```
┌─────────────────────────────────────────┐
│  💬 Chat Input (Full Text Entry)       │
│  ─────────────────────────────────────  │
│  User can type anything                │
│                                         │
│  Examples:                              │
│  - "What's my bench press PR?"          │
│  - "How do I fix shoulder pain?"        │
│  - "What foods are high in protein?"    │
│  - "Am I overtraining?"                 │
│                                         │
│  ⚠️ AI will REFUSE to create/modify:    │
│  - "Create a workout" → "Use Workout    │
│    screens to create workouts"          │
│  - "Log my meal" → "Use Nutrition       │
│    screen to log meals"                 │
└─────────────────────────────────────────┘
```

### Quick Suggestions (Optional Buttons):
- "What should I train today?"
- "Am I eating enough protein?"
- "Show my recent PRs"
- "How's my recovery looking?"

---

## 🏋️ WORKOUT SCREENS

---

### StartWorkoutScreen
**File:** `StartWorkoutScreen.js`
**Purpose:** Starting a new workout session

### Current Features:
- Start free workout
- Continue active workout
- Browse exercise library
- View workout history
- View my plans
- Repeat recent workouts

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Assistant                        │
├─────────────────────────────────────────┤
│                                         │
│  📋 Workout Planning                    │
│  ├─ Generate workout for today          │
│  ├─ Suggest workout based on recovery   │
│  ├─ Create split program                │
│  └─ Recommend exercises to try          │
│                                         │
│  📊 Workout Analysis                    │
│  ├─ What should I train today?          │
│  ├─ Am I overtraining?                  │
│  ├─ Which muscles need more work?       │
│  └─ Analyze my training frequency       │
│                                         │
│  🔁 Quick Actions                       │
│  ├─ Repeat my best workout              │
│  ├─ Start workout from program          │
│  └─ Create workout from template        │
│                                         │
│  ℹ️ Ask Custom Question                 │
│  (Opens text input for one-off query)   │
└─────────────────────────────────────────┘
```

**Detailed Button Actions:**

#### 📋 Workout Planning
1. **"Generate workout for today"**
   - Tool: `generateWorkoutPlan`
   - Parameters: Uses user profile (experience, goals, available equipment)
   - Result: Creates workout and navigates to WorkoutScreen

2. **"Suggest workout based on recovery"**
   - Tool: `analyzeWorkoutHistory` → `generateWorkoutPlan`
   - Parameters: Analyzes last 7 days, suggests muscles to train
   - Result: Creates recovery-optimized workout

3. **"Create split program"**
   - Tool: `generateWorkoutPlan` (multiple days)
   - Parameters: User selects split type (PPL, UL, Bro split)
   - Result: Creates 3-7 day program

4. **"Recommend exercises to try"**
   - Tool: `searchExercises` + recommendations
   - Parameters: Exercises user hasn't done recently
   - Result: Shows list of new exercises

#### 📊 Workout Analysis
1. **"What should I train today?"**
   - Tool: `analyzeWorkoutHistory`
   - Result: Suggests muscle groups based on recovery

2. **"Am I overtraining?"**
   - Tool: `analyzeWorkoutHistory`
   - Result: Shows volume, frequency, recovery analysis

3. **"Which muscles need more work?"**
   - Tool: `analyzeWorkoutHistory`
   - Result: Shows muscle group breakdown

4. **"Analyze my training frequency"**
   - Tool: `analyzeWorkoutHistory`
   - Result: Shows workouts/week over time

---

### WorkoutScreen
**File:** `WorkoutScreen.js`
**Purpose:** Active workout tracking during session

### Current Features:
- Track sets (weight, reps, RPE)
- Add/remove exercises
- Rest timer
- Cardio timer
- Superset pairing
- Change set types (warmup, dropset, failure)
- View exercise info

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Workout Coach                    │
├─────────────────────────────────────────┤
│                                         │
│  💪 Set Recommendations                 │
│  ├─ Suggest next weight                 │
│  ├─ Recommend rest time                 │
│  ├─ Is this set too easy/hard?          │
│  └─ Should I do another set?            │
│                                         │
│  ➕ Exercise Management                 │
│  ├─ Add similar exercise                │
│  ├─ Find exercise alternative           │
│  ├─ Add superset exercise               │
│  └─ Replace current exercise            │
│                                         │
│  📊 Workout Analysis                    │
│  ├─ How's my volume today?              │
│  ├─ Am I on track with my program?      │
│  ├─ Should I finish up?                 │
│  └─ Rate this workout                   │
│                                         │
│  ⏱️ Timing & Intensity                  │
│  ├─ Set rest timer for me               │
│  ├─ Should I increase/decrease weight?  │
│  └─ Estimate 1RM for this lift          │
│                                         │
│  ℹ️ Ask Custom Question                 │
└─────────────────────────────────────────┘
```

**Detailed Button Actions:**

#### 💪 Set Recommendations
1. **"Suggest next weight"**
   - Tool: `getExerciseStats` + AI calculation
   - Context: Current exercise, last session data
   - Result: "Try **190x8**. Up 5 lbs from last week."

2. **"Recommend rest time"**
   - Tool: AI based on set type and intensity
   - Result: "Rest **90 seconds** for strength work"

3. **"Is this set too easy/hard?"**
   - Tool: Analyzes RPE, reps achieved vs target
   - Result: Suggests weight adjustment

4. **"Should I do another set?"**
   - Tool: Checks current volume vs typical
   - Result: Yes/No with reasoning

#### ➕ Exercise Management
1. **"Add similar exercise"**
   - Tool: `searchExercises` (same muscle group)
   - Result: Shows exercise list to add

2. **"Find exercise alternative"**
   - Tool: `searchExercises` (alternatives)
   - Context: Current equipment, same muscles
   - Result: Shows substitutes

3. **"Add superset exercise"**
   - Tool: `searchExercises` (complementary muscles)
   - Result: Suggests superset pairings

4. **"Replace current exercise"**
   - Tool: `searchExercises`
   - Result: Shows alternatives, swaps exercise

---

### WorkoutHistory
**File:** `WorkoutHistoryScreen.js`
**Purpose:** View past workout sessions

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Analysis                         │
├─────────────────────────────────────────┤
│                                         │
│  📊 Progress Analysis                   │
│  ├─ Show my progress over time          │
│  ├─ Compare this month vs last month    │
│  ├─ Find my best workout                │
│  └─ Identify training patterns          │
│                                         │
│  🔍 Workout Insights                    │
│  ├─ Which workouts were most effective? │
│  ├─ Am I progressing consistently?      │
│  ├─ Show volume trends                  │
│  └─ Detect overtraining signs           │
│                                         │
│  🔁 Quick Actions                       │
│  ├─ Repeat best workout                 │
│  ├─ Create program from history         │
│  └─ Export workout data                 │
└─────────────────────────────────────────┘
```

---

### WorkoutSummary
**File:** `WorkoutSummaryScreen.js`
**Purpose:** Post-workout summary and stats

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Feedback                         │
├─────────────────────────────────────────┤
│                                         │
│  🎯 Workout Feedback                    │
│  ├─ How did I do today?                 │
│  ├─ Did I hit a PR?                     │
│  ├─ Rate my volume                      │
│  └─ Suggest next workout                │
│                                         │
│  📈 Progress Tracking                   │
│  ├─ Show improvements from last session │
│  ├─ Update my PRs                       │
│  └─ Log this as a good workout          │
│                                         │
│  💡 Recovery Advice                     │
│  ├─ What should I eat post-workout?     │
│  ├─ How long to recover?                │
│  └─ Recommend rest day?                 │
└─────────────────────────────────────────┘
```

---

### ProgressScreen
**File:** `ProgressScreen.js`
**Purpose:** Main progress tracking dashboard

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Progress Coach                   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Progress Analysis                   │
│  ├─ Analyze my overall progress         │
│  ├─ Show strength gains                 │
│  ├─ Compare exercises                   │
│  └─ Identify weaknesses                 │
│                                         │
│  🎯 Goal Setting                        │
│  ├─ Suggest realistic goals             │
│  ├─ Create PR goals                     │
│  ├─ Set volume targets                  │
│  └─ Plan milestone achievements         │
│                                         │
│  📈 Trend Insights                      │
│  ├─ Show volume trends                  │
│  ├─ Track consistency                   │
│  ├─ Analyze frequency patterns          │
│  └─ Predict future progress             │
│                                         │
│  🏆 Achievements                        │
│  ├─ Celebrate recent PRs                │
│  ├─ View all achievements               │
│  └─ Track streaks                       │
└─────────────────────────────────────────┘
```

---

### ExerciseDetail
**File:** `ExerciseDetailScreen.js`
**Purpose:** Detailed exercise stats and history

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Exercise Coach                   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Exercise Analysis                   │
│  ├─ Show my progress on this exercise   │
│  ├─ Calculate estimated 1RM             │
│  ├─ Find my PR                          │
│  └─ Show volume over time               │
│                                         │
│  💡 Improvement Tips                    │
│  ├─ How to improve this lift?           │
│  ├─ Suggest progression plan            │
│  ├─ Recommend accessories               │
│  └─ Check if I'm plateauing             │
│                                         │
│  🔄 Exercise Alternatives               │
│  ├─ Find similar exercises              │
│  ├─ Show variations                     │
│  └─ Suggest equipment alternatives      │
│                                         │
│  📖 Form & Technique                    │
│  ├─ How to perform correctly?           │
│  ├─ Common mistakes                     │
│  └─ View exercise animation             │
└─────────────────────────────────────────┘
```

---

### ExerciseList
**File:** `ExerciseListScreen.js`
**Purpose:** Browse exercise library

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Exercise Finder                  │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Smart Search                        │
│  ├─ Find exercises for [muscle]         │
│  ├─ Show exercises with [equipment]     │
│  ├─ Filter by difficulty                │
│  └─ Recommend exercises I haven't tried │
│                                         │
│  💪 Exercise Recommendations            │
│  ├─ Suggest compound exercises          │
│  ├─ Show isolation exercises            │
│  ├─ Find beginner-friendly exercises    │
│  └─ Recommend for my goals              │
│                                         │
│  🔄 Alternatives & Variations           │
│  ├─ Find alternatives to [exercise]     │
│  ├─ Show variations of [exercise]       │
│  └─ Bodyweight alternatives             │
└─────────────────────────────────────────┘
```

---

## 🍎 NUTRITION SCREENS

---

### NutritionScreen
**File:** `NutritionScreen.js`
**Purpose:** Main nutrition dashboard

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Nutrition Coach                  │
├─────────────────────────────────────────┤
│                                         │
│  🍽️ Meal Planning                       │
│  ├─ Suggest meals to hit my macros      │
│  ├─ Create meal plan for today          │
│  ├─ Find high-protein foods             │
│  └─ Recommend meal timing               │
│                                         │
│  📊 Macro Analysis                      │
│  ├─ Am I on track today?                │
│  ├─ Adjust my macro goals               │
│  ├─ Calculate calories for my goal      │
│  └─ Show macro breakdown                │
│                                         │
│  🎯 Goal Nutrition                      │
│  ├─ Macros for cutting                  │
│  ├─ Macros for bulking                  │
│  ├─ Macros for maintenance              │
│  └─ Calculate TDEE                      │
│                                         │
│  💡 Quick Suggestions                   │
│  ├─ What should I eat now?              │
│  ├─ Need more protein ideas             │
│  ├─ Low-calorie snack options           │
│  └─ Pre/post-workout meal               │
└─────────────────────────────────────────┘
```

**Detailed Button Actions:**

#### 🍽️ Meal Planning
1. **"Suggest meals to hit my macros"**
   - Tool: `calculateMacros` + food database
   - Context: Remaining macros for the day
   - Result: "Need **40g P**. Try: **8oz chicken** (**56g P**, **280 cal**)"

2. **"Create meal plan for today"**
   - Tool: `generateMealPlan`
   - Result: Full day meal plan matching goals

3. **"Find high-protein foods"**
   - Tool: Food database search
   - Result: List of high-protein options

4. **"Recommend meal timing"**
   - Tool: AI based on workout schedule
   - Result: Meal timing suggestions

---

### FoodSearch / SearchFood
**File:** `FoodSearchScreen.js` / `SearchFoodScreen.js`
**Purpose:** Search for food items

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Food Finder                      │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Smart Food Search                   │
│  ├─ Find foods with high protein        │
│  ├─ Show low-calorie options            │
│  ├─ Search foods with [nutrient]        │
│  └─ Find substitutes for [food]         │
│                                         │
│  📊 Nutrition Comparison                │
│  ├─ Compare similar foods               │
│  ├─ Find healthier alternative          │
│  └─ Show macro-friendly options         │
│                                         │
│  💡 Suggestions                         │
│  ├─ Suggest foods for my goal           │
│  ├─ Recommend pre-workout snacks        │
│  └─ Post-workout meal ideas             │
└─────────────────────────────────────────┘
```

---

### RecipesScreen
**File:** `RecipesScreen.js`
**Purpose:** Manage recipes

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Recipe Assistant                 │
├─────────────────────────────────────────┤
│                                         │
│  📝 Recipe Creation                     │
│  ├─ Create recipe from ingredients      │
│  ├─ Generate high-protein recipe        │
│  ├─ Build macro-friendly meal           │
│  └─ Suggest recipe variations           │
│                                         │
│  🔍 Recipe Search                       │
│  ├─ Find recipes for [meal type]        │
│  ├─ Show quick recipes                  │
│  ├─ Filter by calories                  │
│  └─ Search by ingredients               │
│                                         │
│  ⚖️ Recipe Adjustments                  │
│  ├─ Scale recipe servings               │
│  ├─ Adjust to hit macro targets         │
│  ├─ Substitute ingredients              │
│  └─ Calculate nutrition                 │
│                                         │
│  💡 Recipe Ideas                        │
│  ├─ Meal prep recipes                   │
│  ├─ Budget-friendly options             │
│  ├─ Quick 15-min meals                  │
│  └─ High-volume low-calorie meals       │
└─────────────────────────────────────────┘
```

---

### CalorieBreakdown
**File:** `CalorieBreakdownScreen.js`
**Purpose:** Detailed calorie breakdown

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Nutrition Analyzer               │
├─────────────────────────────────────────┤
│                                         │
│  📊 Daily Analysis                      │
│  ├─ Analyze my eating today             │
│  ├─ Am I hitting my macros?             │
│  ├─ Show macro distribution             │
│  └─ Identify nutrition gaps             │
│                                         │
│  💡 Recommendations                     │
│  ├─ What should I eat next?             │
│  ├─ Adjust remaining meals              │
│  ├─ Suggest macro corrections           │
│  └─ Balance my nutrition                │
│                                         │
│  🔍 Meal Insights                       │
│  ├─ Which meal was best?                │
│  ├─ Too much/little of [macro]?         │
│  └─ Compare to previous days            │
└─────────────────────────────────────────┘
```

---

### MealPlanTemplates
**File:** `MealPlanTemplatesScreen.js`
**Purpose:** Browse meal plan templates

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Meal Planner                     │
├─────────────────────────────────────────┤
│                                         │
│  📋 Template Generation                 │
│  ├─ Create meal plan for my goals       │
│  ├─ Generate cutting meal plan          │
│  ├─ Build bulking meal plan             │
│  └─ Maintenance meal plan               │
│                                         │
│  ⚙️ Customize Templates                 │
│  ├─ Adjust for dietary preferences      │
│  ├─ Modify calorie targets              │
│  ├─ Change meal frequency               │
│  └─ Swap foods in template              │
│                                         │
│  💡 Template Suggestions                │
│  ├─ Recommend template for me           │
│  ├─ Show popular templates              │
│  └─ Find budget-friendly plans          │
└─────────────────────────────────────────┘
```

---

### FoodScanning / FoodScan / FoodScanResult
**File:** `FoodScanningScreen.js` / `FoodScanScreen.js` / `FoodScanResultScreen.js`
**Purpose:** Scan food barcode / Display results

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Scan Assistant                   │
├─────────────────────────────────────────┤
│                                         │
│  📷 Scan Analysis                       │
│  ├─ Analyze scanned food                │
│  ├─ Is this food good for my goals?     │
│  ├─ Compare to similar foods            │
│  └─ Find healthier alternative          │
│                                         │
│  ✏️ Adjust Scanned Food                 │
│  ├─ Adjust serving size                 │
│  ├─ Calculate for custom amount         │
│  └─ Add to specific meal                │
│                                         │
│  💡 Suggestions                         │
│  ├─ How does this fit my macros?        │
│  └─ Should I eat this?                  │
└─────────────────────────────────────────┘
```

---

## 👤 PROFILE & SETTINGS SCREENS

---

### HomeScreen (Tab)
**File:** `HomeScreen.js`
**Purpose:** Main home dashboard

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Home Assistant                   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Daily Overview                      │
│  ├─ What should I do today?             │
│  ├─ Am I on track with my goals?        │
│  ├─ Show my progress this week          │
│  └─ Recommend today's focus             │
│                                         │
│  💪 Training Recommendations            │
│  ├─ Suggest workout for today           │
│  ├─ What muscles to train?              │
│  └─ Should I take a rest day?           │
│                                         │
│  🍽️ Nutrition Reminders                 │
│  ├─ Check my calories today             │
│  ├─ Am I hitting protein goal?          │
│  └─ Suggest next meal                   │
│                                         │
│  🎯 Quick Actions                       │
│  ├─ Start recommended workout           │
│  ├─ Log quick meal                      │
│  └─ View today's progress               │
└─────────────────────────────────────────┘
```

---

### ProfileScreen / UserProfile
**File:** `ProfileScreen.js` / `UserProfileScreen.js`
**Purpose:** User profile and stats

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Profile Coach                    │
├─────────────────────────────────────────┤
│                                         │
│  📊 Profile Analysis                    │
│  ├─ Analyze my overall stats            │
│  ├─ Show my achievements                │
│  ├─ Compare to similar users            │
│  └─ Identify areas to improve           │
│                                         │
│  🎯 Goal Recommendations                │
│  ├─ Suggest new goals                   │
│  ├─ Update my fitness level             │
│  ├─ Adjust training frequency           │
│  └─ Optimize my profile                 │
│                                         │
│  📈 Progress Summary                    │
│  ├─ Show monthly progress               │
│  ├─ Track goal completion               │
│  └─ Celebrate milestones               │
└─────────────────────────────────────────┘
```

---

### SettingsScreen
**File:** `SettingsScreen.js`
**Purpose:** App settings and preferences

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Settings Helper                  │
├─────────────────────────────────────────┤
│                                         │
│  ⚙️ Personalization                     │
│  ├─ Optimize settings for me            │
│  ├─ Recommend notification preferences  │
│  └─ Suggest app customizations          │
│                                         │
│  💡 Help & Tips                         │
│  ├─ How to use this feature?            │
│  ├─ Explain settings                    │
│  └─ Troubleshoot issues                 │
└─────────────────────────────────────────┘
```

---

## 🎯 EXERCISE MANAGEMENT SCREENS

---

### MuscleGroupSelection
**File:** `MuscleGroupSelectionScreen.js`
**Purpose:** Select muscle groups for exercises

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Muscle Group Guide               │
├─────────────────────────────────────────┤
│                                         │
│  💪 Smart Selection                     │
│  ├─ Suggest muscle groups for today     │
│  ├─ Recommend based on recovery         │
│  ├─ Create balanced split               │
│  └─ Prioritize weak points              │
│                                         │
│  📊 Analysis                            │
│  ├─ Which muscles am I neglecting?      │
│  ├─ Show muscle group frequency         │
│  └─ Recommend training split            │
└─────────────────────────────────────────┘
```

---

### CreateExercise
**File:** `CreateExerciseScreen.js`
**Purpose:** Create custom exercise

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Exercise Creator                 │
├─────────────────────────────────────────┤
│                                         │
│  ✏️ Exercise Design                     │
│  ├─ Suggest exercise details            │
│  ├─ Recommend muscle groups             │
│  ├─ Choose difficulty level             │
│  └─ Suggest equipment needed            │
│                                         │
│  💡 Exercise Ideas                      │
│  ├─ Find similar exercises              │
│  ├─ Suggest variations                  │
│  └─ Recommend instructions              │
└─────────────────────────────────────────┘
```

---

## 📋 WORKOUT PLANNING SCREENS

---

### MyPlans
**File:** `MyPlansScreen.js`
**Purpose:** View user's workout plans

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Program Manager                  │
├─────────────────────────────────────────┤
│                                         │
│  📋 Program Analysis                    │
│  ├─ Analyze my current program          │
│  ├─ Is my program balanced?             │
│  ├─ Suggest program improvements        │
│  └─ Compare programs                    │
│                                         │
│  ✨ Program Creation                    │
│  ├─ Create new program for me           │
│  ├─ Generate split program              │
│  ├─ Build progressive program           │
│  └─ Copy and modify existing program    │
│                                         │
│  🔄 Program Adjustments                 │
│  ├─ Optimize program volume             │
│  ├─ Adjust for time constraints         │
│  ├─ Modify for available equipment      │
│  └─ Adapt program to my goals           │
└─────────────────────────────────────────┘
```

---

### WorkoutProgram
**File:** `WorkoutProgramScreen.js`
**Purpose:** Manage workout programs

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Program Coach                    │
├─────────────────────────────────────────┤
│                                         │
│  📊 Program Review                      │
│  ├─ Analyze this program                │
│  ├─ Is volume appropriate?              │
│  ├─ Check exercise selection            │
│  └─ Suggest improvements                │
│                                         │
│  ✏️ Program Editing                     │
│  ├─ Add exercises to program            │
│  ├─ Reorder workout days                │
│  ├─ Balance muscle groups               │
│  └─ Adjust set/rep schemes              │
│                                         │
│  💡 Smart Suggestions                   │
│  ├─ Recommend accessory exercises       │
│  ├─ Suggest progression scheme          │
│  └─ Add deload week                     │
└─────────────────────────────────────────┘
```

---

### PlanWorkout
**File:** `PlanWorkoutScreen.js`
**Purpose:** Plan future workouts

### AI Sections:

```
┌─────────────────────────────────────────┐
│  🤖 AI Workout Planner                  │
├─────────────────────────────────────────┤
│                                         │
│  📅 Schedule Planning                   │
│  ├─ Create weekly workout schedule      │
│  ├─ Suggest optimal training days       │
│  ├─ Plan around rest days               │
│  └─ Build microcycle                    │
│                                         │
│  💪 Workout Design                      │
│  ├─ Generate workout for specific day   │
│  ├─ Create periodized program           │
│  ├─ Plan deload strategy                │
│  └─ Design progressive overload         │
│                                         │
│  🎯 Goal-Based Planning                 │
│  ├─ Plan for strength goal              │
│  ├─ Design hypertrophy program          │
│  ├─ Create cutting program              │
│  └─ Build maintenance routine           │
└─────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION NOTES

### UI Component Structure

Each AI section should be implemented as a collapsible accordion:

```jsx
<AIAssistantPanel>
  <AccordionSection title="📋 Workout Planning" defaultOpen={false}>
    <AIButton onPress={() => handleAIAction('generate_workout')}>
      Generate workout for today
    </AIButton>
    <AIButton onPress={() => handleAIAction('suggest_recovery')}>
      Suggest workout based on recovery
    </AIButton>
    // ... more buttons
  </AccordionSection>

  <AccordionSection title="📊 Workout Analysis">
    // ... buttons
  </AccordionSection>

  {/* Custom question at bottom */}
  <AIButton
    variant="secondary"
    onPress={() => openCustomQuestionModal()}
  >
    ℹ️ Ask Custom Question
  </AIButton>
</AIAssistantPanel>
```

### Tool Mapping

Each button action should map to:
1. **Direct Tool Call** - If simple (e.g., "Show my PR")
   - Call tool directly with predefined params
   - Display result

2. **Tool + AI Response** - If needs interpretation
   - Call tool to get data
   - Pass to AI with strict prompt
   - Display AI's formatted response

3. **Multi-step Flow** - If complex
   - Call multiple tools in sequence
   - AI orchestrates the flow
   - Show progress/results

### Context Injection

Every AI request should include:
```javascript
{
  screen: 'WorkoutScreen',
  userId: user.uid,
  userProfile: {
    age, gender, weight, height,
    goals, experienceLevel, equipment
  },
  screenData: {
    // Screen-specific context
    currentExercise, todayVolume, etc.
  }
}
```

### Response Format

AI responses should be:
- **Concise** - 1-2 sentences for simple queries
- **Actionable** - Include specific numbers/actions
- **Formatted** - Use **bold** for numbers, bullet points for lists

---

## 🚀 NEXT STEPS

1. **Review this document** - Confirm structure matches your vision
2. **Prioritize screens** - Which to implement first?
3. **Create UI components** - AccordionSection, AIButton, etc.
4. **Implement per screen** - Start with most-used screens
5. **Test & iterate** - Gather user feedback

---

**Document Version:** 1.0
**Created:** 2025-10-21
**Status:** DRAFT - Awaiting Review
