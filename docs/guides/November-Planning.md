# 📋 AI GYM TRAINER - NOVEMBER 2025 DEVELOPMENT PLAN

**Timeline:** 3 weeks (November 6 - November 27, 2025)
**Goal:** Fix critical bugs, optimize AI systems, and implement key UX improvements

---

## **🔴 PHASE 1: CRITICAL BUGS & UX ISSUES (Do First)**

### **Priority 1A - Fix Broken Core Features**
1. **Fix "Today" meals tab not showing logged meals**
   - Status: Already implemented but reportedly broken
   - Impact: High - core tracking feature
   - Location: `src/screens/MealsHistoryScreen.js:593-675`

2. **Fix AI not replacing exercises**
   - Status: Backend exists, but may not be working
   - Impact: High - core workout customization
   - Location: Check `AIService.js` exercise replacement tools

3. **Fix "Full body workout is really just a push day"**
   - Impact: High - incorrect workout generation
   - Needs investigation in workout generation logic

### **Priority 1B - Text Input Strategy**
4. **Define global text input policy**
   - Currently disabled everywhere except Home AI
   - Decision needed: When should users type vs use buttons?
   - Affects entire app UX philosophy
   - **Recommendation:** Create tiered approach:
     - **Default:** Structured buttons (shows design intent)
     - **Advanced:** "Custom request" button that reveals text input
     - **Context-aware:** Show text input only when relevant

5. **Implement controlled custom text requests**
   - Add "Custom Request" button (doesn't show text box by default)
   - Reveals text input when clicked
   - Maintains clean, intentional UI

---

## **🟡 PHASE 2: AI OPTIMIZATION & INTELLIGENCE (Do Second)**

### **Priority 2A - Recipe Generation Strategy**
6. **Add recipe source selection flow**
   - Before recipe generation, ask user:
     - Option 1: "Search our recipe database" (fast, no AI tokens)
     - Option 2: "Generate custom recipe" (uses AI, more flexible)
   - Shows intentional design, not just defaulting to text box

7. **Optimize recipe database retrieval**
   - Current issue: 20 seconds even without AI generation
   - Check if Gemini is being called unnecessarily
   - Consider "non-Gemini mode" for database-only queries
   - Filter recipes directly using user preferences (faster)

8. **Standardize AI terminology across agents**
   - Audit all AI responses for consistency
   - Create glossary: "protein goals," "macros," "meals," "recipes"
   - Ensure all agents use same language and logic
   - Update AI prompts to use standardized vocabulary

---

## **🟢 PHASE 3: HOME AI SCREEN REFINEMENT**

9. **Redesign Home AI as "Coach" vs "Utility Agent"**
   - Focus: Advice, motivation, questions
   - Not: "Calculate my macros" (user can see this faster in app)
   - Position as personal guide, not task executor

10. **Remove low-value AI options**
    - Create list of tasks easier to do manually than via AI
    - Examples to remove:
      - "Calculate my macros" → Just show in UI
      - "Log today's weight" → Direct input faster
    - Keep only high-value conversational requests

11. **Add "What should I eat for [meal] to balance macros?"**
    - New button in Nutrition screen
    - AI calculates meal-specific calories based on:
      - Time of day (breakfast vs dinner)
      - User's meal plan (2 meals/day vs 6 meals/day)
      - Remaining daily calories
      - Buffer for snacks/tracking inaccuracies

---

## **🔵 PHASE 4: SMART TEXT INPUT ENHANCEMENTS**

12. **Implement contextual word suggestions** *(Advanced feature)*
    - Similar to smartphone predictive text
    - Fitness/nutrition-specific vocabulary
    - Examples:
      - User types "chick" → suggests "chicken breast," "chicken thigh"
      - User types "create a recipe using" → suggests common ingredients
      - User types "replace bench" → suggests "dumbbell bench," "incline bench"
    - **Note:** Only implement after finalizing text input policy (Phase 1B)

13. **Add parameter clarification modals for structured requests**
    - Example: "Create a high protein recipe" button
    - Opens modal asking:
      - Minimum protein (g)
      - Max calories
      - Dietary restrictions
      - Cooking time limit
    - Fills in AI request with user-defined parameters
    - Shows intentional design, not lazy text box

---

## **🟣 PHASE 5: NEW FEATURES & ENHANCEMENTS**

### **Exercise Management**
14. **Different bar types for lat pulldown and other exercises**
    - Already have equipment variants in database
    - May just need UI to select variants
    - Check `exerciseDatabase.js` - already has detailed variants

15. **Exercise blacklist in settings** ✅ (Already done!)
    - Already implemented in `UserProfileScreen.js`
    - May just need better visibility/UX

16. **Manually reorder exercise list**
    - Allow drag-and-drop in workout builder
    - Save custom exercise order preferences

17. **Work on bodyweight exercises (no weight tracking)**
    - Different UI for bodyweight-only exercises
    - Track reps/sets differently than weighted exercises

### **Nutrition Features**
18. **Food allergy database warnings** ✅ (Already done!)
    - Already implemented via dietary restrictions
    - May need visual warning UI when scanning

19. **Barcode scanner auto-detection** *(Camera-based food lookup)*
    - Detect when user points camera at barcode
    - Suggest adding food without opening app fully
    - Requires background camera access (advanced)

20. **Creative meal variety & meal prep options**
    - AI generates meal prep-friendly recipes
    - Mix-and-match components (protein + carb + veggie)
    - Quick assembly meals vs full cooking

### **Weight Tracking**
21. **Smart scale auto-logging**
    - **Status:** NOT IMPLEMENTED
    - Requires Bluetooth integration
    - Research smart scale APIs (Withings, Fitbit Aria, etc.)
    - Auto-sync weight to app

---

## **🟤 PHASE 6: UI/UX POLISH**

22. **Clean loading states when AI is thinking**
    - Add skeleton screens or animated loaders
    - Show "Coach is thinking..." message
    - Prevent perception of app freezing

23. **Visual weight representation**
    - Show barbell with plates for bench/squat/leg press
    - Add plate image for each 45lb added
    - Makes weight changes more tangible

24. **Scroll wheels instead of typing numbers**
    - iOS-style picker for weight/reps entry
    - Faster than typing, fewer errors

25. **Stats charts with color coding**
    - Green trend line if progress
    - Red trend line if decline
    - Colored area under chart

---

## **🟠 PHASE 7: PREMIUM & ENGAGEMENT FEATURES**

26. **Name your coach** *(Fun personalization)*
    - Let user customize AI coach name
    - Store in profile, use in responses

27. **Tutorial in exchange for 1 month premium**
    - Onboarding tutorial that earns reward
    - Increases engagement, teaches features

28. **In-app suggestion/feedback system**
    - Modal for users to submit feature requests
    - Auto-sends to dev team
    - Shows active development

29. **Faster AI for premium users?**
    - Consider premium tier with priority AI access
    - Or unlock advanced AI features (custom recipes, etc.)

30. **Sound-based rep counting**
    - Use microphone to detect rep cadence
    - Advanced feature for later

---

## **📊 RECOMMENDED EXECUTION ORDER**

### **Sprint 1 (Week 1: Nov 6-12): Critical Fixes**
- [x] Fix duplicate date display bug in Nutrition Calendar List View (Nov 6)
- [x] Fix timezone issue causing incorrect date display (Nov 6)
- [x] Add edit functionality for logged meals (Nov 6)
- [x] Fix unlog behavior to preserve meal origin (Nov 6)
- [x] Add visible edit button with pencil icon (Nov 6)
- [x] Fix Today meals tab (Verified working - Nov 6)
- [x] Fix AI exercise replacement (Nov 6)
- [x] **Fix full body workout generation** (Nov 6) ✅ **COMPLETED**
  - Implemented scientific AI workout generator with Gemini
  - Fixed exercise selection (no more hip thrusts for bodybuilding!)
  - Added mandatory exercises: Leg Press, Leg Extension, Leg Curl, Calf Raise
  - Training style adaptation (bodybuilding vs powerlifting vs athletic)
  - Proper rep ranges (8-12 for hypertrophy, 3-6 for strength)
  - 100% blacklist enforcement
- [x] **Implemented workout caching system** (Nov 6)
  - Background generation of 2 variations per workout type
  - Instant responses for 1st & 2nd requests
  - Cache invalidation when profile changes
- [x] **Added profile editing for missing sections** (Nov 6)
  - Limitations (pain areas, mobility issues)
  - Exercise preferences (favorites, dislikes)
  - Nutrition preferences
- [ ] Define text input policy ⬅️ **NEXT PRIORITY**
- [ ] Implement controlled custom text requests

**Expected completion:** November 12, 2025
**Progress Update (Nov 6):** 🔥 MAJOR MILESTONE - Fixed critical nutrition tracking bugs AND completely rebuilt workout generation system with scientific AI principles. Workouts now use evidence-based training protocols, proper exercise selection, and respect user preferences. Added profile editing and caching systems.

---

### **Sprint 2 (Week 2: Nov 13-19): AI Intelligence**
- [ ] Implement recipe source selection
- [ ] Optimize database queries (fix 20-second delay)
- [ ] Standardize AI terminology
- [ ] Add macro-balancing meal suggestions
- [ ] Redesign Home AI as coach

**Expected completion:** November 19, 2025

---

### **Sprint 3 (Week 3: Nov 20-27): Smart Inputs & Polish**
- [ ] Remove low-value AI options
- [ ] Implement parameter clarification modals
- [ ] Add predictive text suggestions (if text input stays)
- [ ] Clean loading states when AI is thinking
- [ ] Exercise variants UI improvements

**Expected completion:** November 27, 2025

---

## **🎯 KEY DECISIONS NEEDED**

Before starting development, decide on:

1. **Text input philosophy:**
   - Buttons-first with optional custom text, or always show text box?

2. **Recipe generation:**
   - Always ask user "database vs custom" or auto-detect?

3. **Home AI scope:**
   - Pure coach/advisor, or keep some utility functions?

4. **Premium features:**
   - What justifies premium tier? (faster AI, advanced features, etc.)

---

## **✅ ALREADY IMPLEMENTED (No Work Needed)**

These features are already complete in the codebase:

- ✅ Different types of exercises (927+ exercises with variants)
- ✅ Database of workouts and recipes (scientific/AI-approved)
- ✅ Food allergy database/warnings (dietary restrictions system)
- ✅ Profile settings for bulk/cut customization
- ✅ AI exercise replacement functionality (may need bug fix)
- ✅ Exercise blacklist in settings
- ✅ Today meals tab (may need bug fix)
- ✅ Macro balance meal recommendations
- ✅ Home AI screen coach functionality
- ✅ Recipe database integration with AI Coach

---

## **🚫 NOT PLANNED FOR NOVEMBER (Future Work)**

These features are deferred to December or later:

- Smart scale auto-logging (requires hardware integration)
- 3D exercise models (requires 3D rendering engine)
- Sound-based rep counting (advanced ML feature)
- Barcode scanner auto-detection (requires background processing)
- Visual weight representation with plates (nice-to-have polish)
- Scroll wheels for number input (nice-to-have UX)
- Premium features implementation (needs business model first)

---

## **📈 SUCCESS METRICS**

By November 27, 2025, we should have:

1. **Zero critical bugs** (Today meals tab, AI replacement, workout generation)
2. **Consistent AI experience** across all screens
3. **Faster recipe generation** (<5 seconds for database queries)
4. **Clear text input strategy** implemented app-wide
5. **Improved Home AI** that feels like a coach, not a calculator
6. **Better UX** with parameter modals and clean loading states

---

## **📝 NOTES**

- This plan assumes 3 weeks of focused development
- Priorities may shift based on user feedback or technical blockers
- Each sprint builds on previous sprints - follow order for best results
- Test thoroughly after each sprint before moving to next phase
- Document any new decisions or changes in this file

---

## **🔧 COMPLETED WORK LOG**

### **November 6, 2025**
**Focus:** Nutrition tracking bug fixes and UX improvements

**Completed:**
1. Fixed timezone bug causing dates to display incorrectly (Nov 7 showing as "Nov 6")
   - Changed Date parsing from UTC to local time
   - Affected: `MealHistoryTabs.js:878-881`

2. Fixed duplicate date display in List View
   - Added Set deduplication for date arrays
   - Moved todayStr calculation outside map loop for consistency

3. Added meal editing functionality
   - Logged meals now editable via EditFoodItemScreen
   - Can modify ingredients and amounts for logged meals
   - Navigation properly handles edit callbacks

4. Fixed unlog behavior to preserve meal origin
   - Added `wasPlanned` flag to track meal history
   - Unlogging planned meals → moves back to planned
   - Unlogging directly logged meals → removes completely
   - Affected: `CalorieBreakdownScreen.js:43-86, 128-133`

5. Added visible edit button for better UX
   - Pencil icon (✏️) button added to each logged meal
   - Clear visual affordance for edit action
   - Consistent with status badge design

6. Excluded decline exercises from AI workout generation
   - Added global exclusion list for decline bench press variants
   - Applied filter to all exercise generation functions
   - Based on bodybuilding research showing limited utility
   - Affected: `WorkoutTools.js:generateWorkoutPlan, findExerciseAlternatives, replaceExerciseInWorkout`

7. Optimized AI exercise replacement for fluid one-shot execution
   - Added comprehensive instructions to AI system prompt
   - Supports explicit replacement: "Replace bench with incline press"
   - Supports auto-selection: "Replace bench press" (AI picks best alternative)
   - Eliminates 3-5 turn conversations for simple exercise swaps
   - AI now responds: "Replaced [Old] with [New]. Sets preserved: X×Y."
   - Fixed issue where AI would offer to generate entirely new workout
   - Affected: `AIService.js:1081-1139` (buildSystemPromptForTools)

**Files Modified:**
- `src/components/MealHistoryTabs.js`
- `src/screens/CalorieBreakdownScreen.js`
- `src/services/ai/tools/WorkoutTools.js`
- `src/services/ai/tools/index.js`
- `src/services/ai/AIService.js`

**Commits:** 6 commits pushed to main
- `e6e2dff` - Fix date display timezone bug
- `7ac0eae` - Add edit functionality and fix unlog behavior
- `f28c127` - Add visible edit button
- `fcfbad8` - Remove debug console logs
- `f4930c0` - Exclude decline exercises from AI workout generation
- `91c79ec` - Add one-shot exercise replacement to AI system prompt

---

8. **MAJOR: Implemented scientific AI workout generator** (Nov 6 Evening)
   - Created `AIWorkoutGenerator.js` with Gemini 2.0 Flash integration
   - Evidence-based training principles from 2024 research:
     * Training frequency: 2-3x/week per muscle = 38% faster gains
     * Volume guidelines: 10-20 sets per week optimal
     * Proper exercise order: compound → isolation
   - Training style-specific protocols:
     * Bodybuilding: Machines priority, 8-12 reps, mandatory exercises
     * Powerlifting: Barbell compounds, 3-6 reps, heavy focus
     * Athletic: Functional movements, power development
   - Fixed major issues:
     * No more hip thrusts/glute bridges for bodybuilding legs
     * Mandatory: Leg Press, Leg Extension, Leg Curl, Calf Raise
     * 100% blacklist enforcement (respects disliked exercises)
     * Correct rep ranges based on training goal
   - Affected: NEW `src/services/ai/tools/AIWorkoutGenerator.js`

9. **Implemented workout caching system** (Nov 6 Evening)
   - Created `WorkoutCacheService.js` for background workout generation
   - Generates 2 AI variations per workout type after assessment
   - Instant delivery for 1st & 2nd requests (pre-cached)
   - Fresh generation for 3rd+ requests (10-30s AI thinking)
   - Cache invalidation when profile changes
   - Affected: NEW `src/services/WorkoutCacheService.js`

10. **Added profile editing for missing sections** (Nov 6 Evening)
    - Limitations section: pain areas, mobility issues
    - Exercise preferences: favorites, dislikes (with blacklist)
    - Nutrition preferences: dietary restrictions, meals/day, cooking skill
    - Cache invalidation on profile update
    - Removed duplicate "Update" button from ProfileScreen
    - Affected: `src/screens/EditProfileSectionScreen.js`, `src/screens/ProfileScreen.js`

11. **Major code cleanup and refactoring** (Nov 6 Evening)
    - Updated `WorkoutTools.js` to use new AI generator
    - Removed unused imports (FitnessKnowledge, ProvenWorkoutTemplates, etc.)
    - Cleaned up orphaned code
    - Added test files to .gitignore
    - Fixed API key imports to use @env standard
    - Comprehensive documentation added

**Files Modified:**
- `src/services/ai/tools/WorkoutTools.js` (refactored to use AI generator)
- `src/screens/EditProfileSectionScreen.js` (added 3 new edit sections)
- `src/screens/ProfileScreen.js` (removed duplicate button)
- `src/screens/AICoachAssessmentScreen.js` (cache regeneration on assessment)
- `src/services/backend/BackendService.js` (profile merging from both collections)
- `src/services/userProfileService.js` (profile system updates)
- `.gitignore` (added test files)

**Files Created:**
- `src/services/ai/tools/AIWorkoutGenerator.js` (NEW - scientific AI generator)
- `src/services/WorkoutCacheService.js` (NEW - caching system)
- `src/services/NutritionCacheService.js` (NEW - future nutrition caching)
- `docs/SCIENTIFIC_WORKOUT_IMPLEMENTATION.md` (implementation plan)
- `docs/WORKOUT_GENERATION_FIX_PLAN.md` (debugging strategy)
- `docs/CACHE_IMPLEMENTATION_SUMMARY.md` (caching architecture)
- `docs/CACHE_TESTING_GUIDE.md` (testing guide)
- `docs/guides/science.md` (exercise science research)

**Commits:** 1 major commit pushed to main
- `fe3ce30` - feat: Implement scientific AI workout generation with evidence-based principles
  - 18 files changed, 5032 insertions, 792 deletions

---

**Last Updated:** November 6, 2025 (Evening)
**Status:** Sprint 1 Almost Complete (10/11 tasks complete - 91%)
**Next Review:** November 12, 2025 (End of Sprint 1)
