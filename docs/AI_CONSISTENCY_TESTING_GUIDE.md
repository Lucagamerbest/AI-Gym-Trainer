# AI Consistency Testing Guide

**Purpose:** Validate that AI responds consistently regardless of how users phrase requests

**Target Audience:** Production & Testing Teams

**Last Updated:** November 8, 2025

---

## 🎯 Testing Philosophy

**Core Principle:** Users can ask in ANY way → AI responds using STANDARD terms

**What to test:**
- ✅ AI understands multiple variations of the same request
- ✅ AI always responds with standardized terminology
- ✅ Responses are consistent across different screens
- ✅ Tone matches the screen context

---

## 📋 Test Cases by Category

### **1. NUTRITION TERMINOLOGY**

#### Test: Macro Goals

**User can ask (ANY variation):**
- "What are my macro targets?"
- "Show my daily macros"
- "Am I hitting my nutrient goals?"
- "Protein carbs fats breakdown"
- "What are my macro limits?"

**✅ Expected AI Response (ALWAYS):**
- Uses term: **"macro goals"** (NOT: macro targets, daily macros, nutrient goals)
- Format: **"200p / 250c / 60f"**
- Example: "Your macro goals: **200p / 250c / 60f**. You're at **73%**."

**❌ Fail if AI says:**
- "macro targets"
- "daily macros"
- "nutrient goals"
- Uses different format like "200g protein, 250g carbs"

---

#### Test: Calorie Goal

**User can ask:**
- "How many calories can I eat?"
- "What's my calorie target?"
- "Calorie limit?"
- "Daily calorie budget?"

**✅ Expected AI Response:**
- Uses term: **"calorie goal"** (NOT: calorie target, calorie limit)
- Shows exact numbers: **"1,450 / 2,000 calories"**
- Example: "You're at **1,450 / 2,000 calories** (**73%**). On track!"

**❌ Fail if AI says:**
- "calorie target"
- "calorie limit"
- Missing percentage
- Vague: "You're doing well"

---

#### Test: Protein Goal

**User can ask:**
- "How much protein should I eat?"
- "What's my protein target?"
- "Daily protein needs?"
- "Am I getting enough protein?"

**✅ Expected AI Response:**
- Uses term: **"protein goal"** (NOT: protein target, protein needs)
- Shows exact numbers: **"120g / 150g protein"**
- Example: "You've hit **120g / 150g** of your protein goal (**80%**)."

**❌ Fail if AI says:**
- "protein target"
- "protein requirement"
- No specific numbers

---

### **2. WORKOUT TERMINOLOGY**

#### Test: Hypertrophy vs Muscle Building

**User can ask:**
- "I want to build muscle"
- "How to get bigger?"
- "Bodybuilding workout"
- "Grow my arms"

**✅ Expected AI Response:**
- Uses term: **"hypertrophy"** or **"muscle growth"** (NOT: bodybuilding)
- Example: "For **muscle growth**, use **8-12 reps** at **RPE 7-8**."

**❌ Fail if AI says:**
- "bodybuilding"
- "mass gain" (casual, but acceptable fallback)

---

#### Test: Weight Loss vs Cutting

**User can ask:**
- "I want to lose weight"
- "How to cut fat?"
- "Get lean"
- "Burn fat"

**✅ Expected AI Response:**
- Uses term: **"weight loss goal"** (NOT: cutting, fat burning, shredding)
- Example: "For your **weight loss goal**, aim for **12-15 reps**."

**❌ Fail if AI says:**
- "cutting"
- "shredding"
- "fat burning"

---

#### Test: Training Volume

**User can ask:**
- "How many sets should I do?"
- "Am I doing enough volume?"
- "How much chest work?"

**✅ Expected AI Response:**
- Uses term: **"sets per week"** (NOT: training volume, weekly volume)
- Shows exact numbers: **"12 sets per week"**
- Example: "You're doing **12 sets per week** for chest (**optimal range: 10-18**)."

**❌ Fail if AI says:**
- "training volume"
- "weekly volume"
- Vague: "You're doing enough"

---

### **3. MEASUREMENT CONSISTENCY**

#### Test: Weight Format

**User mentions weight:**
- "185 pounds"
- "weight"
- "how heavy?"

**✅ Expected AI Response:**
- Always formats as: **"185 lbs"** (NOT: pounds, weight)
- Example: "Try **190 lbs** next session."

**❌ Fail if AI says:**
- "185 pounds"
- "weight: 185"

---

#### Test: Reps Format

**User asks:**
- "How many repetitions?"
- "Reps?"

**✅ Expected AI Response:**
- Always formats as: **"8 reps"** or **"×8"** (NOT: repetitions)
- Example: "Do **3×10** (3 sets of 10 reps)."

**❌ Fail if AI says:**
- "repetitions"
- "10 times"

---

### **4. TONE BY SCREEN**

#### Test: Workout Screen Tone

**Context:** User is actively training

**User asks:** "What weight for bench?"

**✅ Expected Response (Ultra-concise):**
- **"185 lbs."** (Just the answer)
- **"190 lbs (+5 lbs)."** (Answer + progression)

**❌ Fail if AI says:**
- "Based on your last session, I recommend trying 185 lbs because you did 180 lbs last time and showed good form at RPE 8..." (TOO LONG)
- "Looks good!" (TOO VAGUE)

---

#### Test: Nutrition Screen Tone

**Context:** User reviewing daily nutrition

**User asks:** "How am I doing?"

**✅ Expected Response (Data-driven + supportive):**
- "You're at **1,450 / 2,000 calories** (**73%**). On track!"

**❌ Fail if AI says:**
- "Looks good!" (TOO VAGUE - no numbers)
- "You failed today" (TOO NEGATIVE)

---

#### Test: Home AI Screen Tone

**Context:** General coaching/advice

**User asks:** "What should I focus on?"

**✅ Expected Response (Conversational + big-picture):**
- "Based on your training, I recommend focusing on **legs** this week (only **15% of your volume**)."

**❌ Fail if AI says:**
- "Legs." (TOO SHORT - no context)
- "Train legs" (TOO ROBOTIC)

---

## 🚨 Critical Failures to Watch For

### **Terminology Inconsistency**

❌ **BAD:** AI says "macro targets" in one response, "macro goals" in another
✅ **GOOD:** Always says "macro goals"

---

### **Vague Responses**

❌ **BAD:** "Looks good!", "Keep going!", "Nice work!"
✅ **GOOD:** "You're at **1,800 / 2,000 calories**. On track!"

---

### **Wrong Tone for Screen**

❌ **BAD:** Long explanation during active workout
✅ **GOOD:** "**190 lbs**." (one sentence during workout)

---

### **Missing Data**

❌ **BAD:** "You're doing well on protein"
✅ **GOOD:** "You're at **120g / 150g protein** (**80%**)."

---

## 📊 Testing Checklist

Use this checklist for each testing session:

### Before Testing

- [ ] Clear app cache
- [ ] Reset AI conversation
- [ ] Note which screen you're testing (Workout, Nutrition, AI Coach, etc.)

### During Testing

- [ ] Ask the same question 3 different ways
- [ ] Verify AI uses standard terminology in all 3 responses
- [ ] Check tone matches the screen
- [ ] Verify numbers are bolded and formatted correctly
- [ ] Test cross-references (e.g., "your Push workout on Nov 5")

### After Testing

- [ ] Document any inconsistencies
- [ ] Note which variation confused the AI
- [ ] Report to dev team with exact user input + AI response

---

## 📝 Bug Report Template

When you find inconsistent AI behavior, report using this format:

```markdown
**Screen:** [Workout / Nutrition / AI Coach / Home]
**User Input:** "What are my macro targets?"
**Expected Response:** "Your macro goals: 200p / 250c / 60f. You're at 73%."
**Actual Response:** "Your daily macros are 200g protein, 250g carbs, 60g fat."
**Issue:** Used "daily macros" instead of "macro goals" + wrong format
**Severity:** [Low / Medium / High]
```

---

## 🎯 Success Criteria

### ✅ Pass Conditions

1. **100% terminology consistency** across 10 different phrasings
2. **Tone matches screen** (concise in Workout, detailed in AI Coach)
3. **All numbers bolded** and formatted correctly
4. **No vague responses** - always specific with data

### ❌ Fail Conditions

1. AI uses 2+ different terms for same concept
2. Wrong tone (too verbose in Workout screen, too brief in AI Coach)
3. Missing data ("Looks good" instead of showing numbers)
4. Robotic phrases ("Affirmative", "Shall I proceed?")

---

## 🔄 Regression Testing

### When to Re-test

- [ ] After updating `src/config/aiTerminology.js`
- [ ] After modifying AI system prompt
- [ ] Before each production release
- [ ] After adding new AI features

### Quick Smoke Test (5 min)

1. Ask about macros 3 different ways → Check consistency
2. Ask workout advice in Workout screen → Check tone (concise)
3. Ask general question in AI Coach → Check tone (detailed)
4. Check number formatting → Verify bold + correct units

---

## 📚 Reference

**Standard Terms Quick Reference:**

| Category | Standard Term | NOT This |
|----------|---------------|----------|
| Nutrition | macro goals | macro targets, daily macros |
| Nutrition | calorie goal | calorie target, calorie limit |
| Nutrition | protein goal | protein target, protein needs |
| Workout | hypertrophy | bodybuilding, mass gain |
| Workout | weight loss goal | cutting, fat burning |
| Workout | sets per week | training volume |
| Format | 185 lbs | 185 pounds, weight |
| Format | 8 reps | repetitions, 8 times |
| Format | 200p / 250c / 60f | 200g protein, 250g carbs |

---

## 🤖 AI Personality Traits to Verify

### ✅ Should Be:

1. **Knowledgeable but not preachy**
   - ✅ "Studies show 2x/week is optimal"
   - ❌ "You MUST train 2x/week or you won't grow"

2. **Encouraging but honest**
   - ✅ "You're 15% away from your protein goal. Here's a 20g snack idea"
   - ❌ "You failed your protein goal today"

3. **Concise but complete**
   - ✅ "**185 lbs** → **205 lbs** (**+20 lbs**). Great work!"
   - ❌ "Congratulations on the absolutely amazing phenomenal progress..."

4. **Technical when needed, simple by default**
   - Basic Q: "Your calories are at **1,450 / 2,000**"
   - Advanced Q: "Your Epley 1RM is **245 lbs** based on **205×8**"

---

## 📞 Contact

**Questions about testing?** Contact the dev team

**Found a bug?** Use the bug report template above

**Terminology unclear?** Check `docs/AI_TERMINOLOGY_GLOSSARY.md`

---

**Last Updated:** November 8, 2025
**Status:** ✅ Active - Use for all AI testing
**Next Review:** December 2025
