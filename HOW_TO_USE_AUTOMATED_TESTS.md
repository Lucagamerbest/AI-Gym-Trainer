# 🚀 How to Use Automated AI Tests - Step by Step

## ✅ Setup is COMPLETE!

I just added everything to your app. Here's exactly what to do:

---

## 📱 STEP 1: Reload Your App (30 seconds)

1. **In your terminal/Metro**, press:
   - `R` (capital R) to reload
   - Or shake your device → "Reload"

2. **Wait for app to reload** (should say "Bundling complete")

---

## 🧪 STEP 2: Open AI Stress Test (1 minute)

### Method A: Through Settings (Easiest)
1. **Open your app**
2. **Go to Profile tab** (bottom right 👤)
3. **Tap "Settings"**
4. **Scroll down** to "🛠️ Developer Tools" section
5. **Tap "🧪 AI Stress Test"**

### Method B: Direct (if you know the route)
Navigate directly to `TestRunner` screen

---

## 🎯 STEP 3: Run Your First Test (1 minute)

You'll see 3 big buttons:

### **Option 1: Quick Test** ⚡ (Recommended for first time)
- **Tap "⚡ Quick Test (20 questions)"**
- Takes ~1 minute
- Tests a sample of all features
- Perfect for daily testing

### **Option 2: Full Test** 🚀 (For comprehensive testing)
- **Tap "🚀 Run Full Test (120 questions)"**
- Takes ~4 minutes
- Tests EVERYTHING
- Use weekly or before launch

### **Option 3: Category Test** 🎯 (For specific features)
- **Tap any category button** like "workoutGeneration"
- Tests only that feature
- Use when fixing specific issues

---

## 📊 STEP 4: Watch It Run! (Auto)

You'll see real-time progress:

```
Running Tests... 8/20

Progress Bar: [████████░░░░░░░░░░]

Success Rate: 87.5%
Category: workoutGeneration

"Create a chest and triceps workout for hypertrophy"

[Loading spinner]
```

**Just watch!** It's fully automated. You don't need to do anything.

---

## 🎉 STEP 5: Review Results (1 minute)

When done, you'll see:

### **Success Dashboard:**
```
📊 Test Results

[20]     [17]      [3]       [85%]
Total    Passed    Failed    Success
```

### **Error Breakdown:**
```
🔍 Errors by Category
  no_active_workout: 2 errors
  response_too_long: 1 error
```

### **Performance:**
```
⏱️  Duration: 42s
⚡ Avg Response: 1250ms
```

### **Slowest Queries:**
```
1. Generate full body workout - 2850ms
2. Calculate macros - 1420ms
```

---

## 📤 STEP 6: Export Results (Optional - 30 seconds)

1. **Tap "📤 Export" button** (top right)
2. **Share via:**
   - Email
   - Messages
   - Save to Files
   - Copy to clipboard

3. **You'll get a markdown report** with all details

---

## 🎯 What to Do With Results

### **If Success Rate >90%:** ✅
- You're doing great!
- Run Full Test to find edge cases
- Ship to beta users

### **If Success Rate 80-90%:** ⚠️
- Check "Errors by Category"
- Fix top 2-3 error types
- Run Quick Test again

### **If Success Rate <80%:** 🔴
- Open "🐛 Debug Console" (Settings → Developer Tools)
- Review failed interactions
- Fix major issues first

---

## 💡 Pro Tips

### **Test Before & After Changes:**
```
1. Run Quick Test → Note: 85%
2. Make code changes
3. Run Quick Test → Check: 92% ✅ (improved!)
```

### **Test Specific Features:**
```
Working on nutrition?
→ Tap "nutrition" category
→ Tests only nutrition features
→ Faster feedback
```

### **Export for Documentation:**
```
Before launch:
→ Run Full Test
→ Export results
→ Save as "ai-test-2025-10-21.md"
→ Track improvement over time
```

---

## 🐛 Also Available: Debug Console

From Settings → "🐛 Debug Console"

**What it shows:**
- All AI interactions (success + failed)
- Error statistics
- Tool usage breakdown
- Export individual bug reports

**Use it to:**
- Debug specific failures
- See what the AI actually called
- Create detailed bug reports
- Track AI performance over time

---

## 📱 Complete Workflow Example

```
Morning:
1. Open app
2. Go to Settings
3. Tap "🧪 AI Stress Test"
4. Tap "⚡ Quick Test"
5. Wait 1 minute
6. See: 87% success rate
7. Note top error: "no_active_workout"

Afternoon:
8. Fix the "no_active_workout" issue in code
9. Reload app (press R)
10. Run Quick Test again
11. See: 94% success rate ✅
12. Success improved!

Before shipping:
13. Run Full Test
14. Export results
15. Share with team
16. Ship to beta users 🚀
```

---

## 🎓 Understanding The Tests

### **120 Questions Test:**
- ✅ Workout Generation (15 questions)
- ✅ Exercise Search (15)
- ✅ Workout Tracking (15)
- ✅ Workout History (12)
- ✅ Exercise Stats (12)
- ✅ Nutrition (15)
- ✅ Meal Logging (8)
- ✅ Profile Updates (10)
- ✅ Recommendations (8)
- ✅ Technique (5)
- ✅ Programming (5)

**Total: 120 realistic user questions**

### **What Each Test Does:**
- Sends question to AI
- Waits for response
- Checks if tools were called correctly
- Measures response time
- Categorizes any errors
- Moves to next question

---

## 🚨 Troubleshooting

### **"Screen not found"**
- Make sure you reloaded the app (press R)
- Check that `__DEV__` is true (development mode)

### **"Tests taking too long"**
- Normal! Full test = 4 minutes
- Quick test = 1 minute
- Check your internet connection

### **"All tests failing"**
- Check console for errors
- Verify Gemini API key is valid
- Make sure AIService initialized

---

## ✅ Quick Checklist

- [ ] Reload app (press R)
- [ ] Go to Settings
- [ ] See "🛠️ Developer Tools" section
- [ ] Tap "🧪 AI Stress Test"
- [ ] Run Quick Test
- [ ] Review results
- [ ] Check success rate
- [ ] Fix top error if needed

---

## 🎉 You're Ready!

**That's it!** The automated testing is now part of your app.

**Use it:**
- ✅ Daily: Quick Test (1 min)
- ✅ Weekly: Full Test (4 min)
- ✅ Before Launch: Full Test + Export

**Benefits:**
- Find all AI flaws automatically
- No manual testing needed
- Track improvement over time
- Ship with confidence

---

## 📞 Need Help?

**Files to check:**
- `AUTOMATED_AI_TESTING_GUIDE.md` - Complete guide
- `SETUP_AUTOMATED_TESTS.md` - Setup instructions
- `QUICK_REFERENCE.md` - Daily reference
- `AI_BUG_TRACKING_WORKFLOW.md` - Bug workflow

**In the app:**
- Settings → 🧪 AI Stress Test (run tests)
- Settings → 🐛 Debug Console (view logs)

---

**Start testing now! Go to Settings → Developer Tools → 🧪 AI Stress Test** 🚀
