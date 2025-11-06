# ⚡ QUICK TEST COMMANDS - Copy & Paste These!

Use these exact commands to test each feature quickly.

---

## 🍳 RECIPE TOOLS

### Test 1: Database Search (NEW! 🚀)
```
Create a recipe with 500 calories and 40g protein for dinner
```
**Expected:** Shows 1-3 database recipes instantly

### Test 2: Custom AI Recipe
```
Create a recipe using chicken breast, sweet potato, and spinach
```
**Expected:** AI generates custom recipe with those ingredients

### Test 3: High-Protein Recipe
```
Create a high-protein breakfast with 40g protein
```
**Expected:** Breakfast recipe with ~40g protein

### Test 4: Unrealistic Macros (Edge Case)
```
Create a recipe with 100g protein and 200 calories
```
**Expected:** Warning + realistic suggestion

### Test 5: Adapt Recipe
```
Adapt my last recipe to 400 calories
```
**Expected:** New recipe with "(Adapted)" suffix, 400 cal

### Test 6: Ingredient Substitution
```
I don't have chicken, what can I use instead?
```
**Expected:** 3-5 alternatives with measurements

### Test 7: Invalid Input (Edge Case)
```
Create a recipe with xyz123
```
**Expected:** Error: "Invalid ingredient names detected"

---

## 🍽️ MEAL PLANNING TOOLS

### Test 8: Visual Macro Balance (NEW! 🚀)
**Prerequisites:** Log 1-2 meals first

```
What should I eat for dinner to balance my macros?
```
**Expected:** Visual progress bars showing current macro %
**Example:**
```
Calories: [████████░░] 80%
Protein:  [██████░░░░] 60%
```

### Test 9: Next Meal Auto-Detection
```
Suggest my next meal
```
**Expected:** Detects meal type from time (breakfast/lunch/dinner/snack)

### Test 10: Macro Prediction (NEW! 🚀)
**Prerequisites:** Log 1-2 meals, test in afternoon

```
Will I hit my protein goal today?
```
**Expected:** Current status bars + end-of-day predictions with ✅/⚠️

### Test 11: Early Morning (Edge Case)
**Prerequisites:** Test before 8am, no meals logged

```
Am I on track for my macros today?
```
**Expected:** "Good morning! Too early to predict..."

### Test 12: Weekly Meal Plan
```
Create a 7-day meal plan for 2200 calories and 160g protein daily
```
**Expected:** Full 7-day plan (takes 10-15 seconds)
**Check:** Each day ~2200 cal, ~160g protein

### Test 13: Vegetarian Meal Plan
```
Generate a vegetarian week meal plan for 1800 calories
```
**Expected:** 7 days, all vegetarian, ~1800 cal/day

---

## 📊 PROGRESS TOOLS

### Test 14: Goal Prediction
**Prerequisites:** Log same exercise multiple times

```
When will I bench press 225 lbs?
```
**Expected:** Date prediction based on progress

### Test 15: Plateau Detection
```
Am I plateauing on any exercises?
```
**Expected:** Lists stalled vs progressing exercises

### Test 16: Body Fat Estimation
```
Estimate my body fat with waist 34, neck 15, height 70, weight 180, gender male
```
**Expected:** Body fat %, category, fat/lean mass

---

## 🐛 EDGE CASE TESTS

### Test 17: Single Ingredient
```
Create a recipe with just chicken
```
**Expected:** "Please provide at least 2 ingredients..."

### Test 18: No Meals Logged
```
Suggest next meal
```
**Expected:** "Please log some meals first..."

### Test 19: No Internet
- Turn off Wi-Fi
- Try generating recipe
**Expected:** "Couldn't connect to AI service..."
**Check:** Retries 3 times before failing

---

## ⚡ 5-MINUTE QUICK TEST

Copy and paste these 3 commands in order:

```
1. Create a recipe with 500 calories and 40g protein for dinner
```
(Should show database recipes)

```
2. What should I eat for dinner to balance my macros?
```
(Should show visual progress bars)

```
3. Will I hit my protein goal today?
```
(Should show predictions with ✅/⚠️)

---

## 📋 QUICK CHECKLIST

After running tests above:

- [ ] Database search showed recipes instantly (Test 1)
- [ ] Progress bars displayed correctly (Test 8)
- [ ] Predictions showed current + end-of-day (Test 10)
- [ ] Edge cases showed helpful errors (Tests 7, 11, 17, 18)
- [ ] No crashes occurred
- [ ] Error messages were clear

---

## 🎯 EXPECTED RESULTS SUMMARY

### Should See:
- ✅ Database recipes appear in <1 second
- ✅ Visual bars like: [████████░░]
- ✅ Predictions with ✅ or ⚠️ icons
- ✅ Clear error messages for invalid inputs
- ✅ Retry messages in console: "attempt 1/3", "attempt 2/3", etc.

### Should NOT See:
- ❌ App crashes
- ❌ Technical error messages
- ❌ "undefined" or "null" errors
- ❌ Garbled text instead of progress bars
- ❌ Recipes with wildly incorrect macros

---

**Testing Time:** 5 min (quick test) to 40 min (comprehensive)
**Start With:** Tests 1, 8, 10 (new features!)
**Most Fun:** Test 12 (7-day meal plan is impressive!)

Good luck! 🚀
