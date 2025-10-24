# ⚡ Quick Setup: Automated AI Testing

## 🎯 Goal
Get automated AI testing running in 5 minutes.

---

## ✅ Step 1: Add Test Runner to Navigation (2 minutes)

### Find your navigation file:
- Usually `App.js` or `src/navigation/AppNavigator.js`

### Add these lines:

```javascript
// At the top with other imports:
import AutomatedTestRunner from './src/components/AutomatedTestRunner';

// In your Stack.Navigator (dev-only):
{__DEV__ && (
  <Stack.Screen
    name="TestRunner"
    component={AutomatedTestRunner}
    options={{
      title: '🧪 AI Stress Test',
      headerShown: true,
    }}
  />
)}
```

---

## ✅ Step 2: Add Button to Access Tests (1 minute)

### Option A: Settings Screen (Recommended)
```javascript
// In your SettingsScreen.js:

{__DEV__ && (
  <View style={styles.devSection}>
    <Text style={styles.sectionTitle}>Developer Tools</Text>

    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => navigation.navigate('TestRunner')}
    >
      <Text style={styles.buttonText}>🧪 Run AI Stress Tests</Text>
      <Text style={styles.buttonSubtext}>Test AI with 120 questions</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => navigation.navigate('DebugConsole')} // AIDebugViewer
    >
      <Text style={styles.buttonText}>🐛 Debug Console</Text>
      <Text style={styles.buttonSubtext}>View AI logs</Text>
    </TouchableOpacity>
  </View>
)}
```

### Option B: Home Screen
```javascript
// Add dev menu button:
{__DEV__ && (
  <TouchableOpacity
    style={styles.devButton}
    onPress={() => navigation.navigate('TestRunner')}
  >
    <Text>🧪 Tests</Text>
  </TouchableOpacity>
)}
```

---

## ✅ Step 3: Run Your First Test (1 minute)

1. **Reload app**
   - Press `R` in Metro or shake device

2. **Navigate to Test Runner**
   - Go to Settings → "🧪 Run AI Stress Tests"
   - Or tap the button you added

3. **Run Quick Test**
   - Tap "⚡ Quick Test (20 questions)"
   - This takes ~1 minute

4. **Watch it run!**
   - Progress bar shows real-time progress
   - See current question being tested
   - Success rate updates live

---

## ✅ Step 4: Review Results (1 minute)

After test completes, you'll see:

### **Statistics Dashboard**
```
Total: 20
✅ Passed: 17
❌ Failed: 3
📈 Success Rate: 85%
```

### **Error Breakdown**
```
🔍 Errors by Category:
  no_active_workout: 2 errors
  response_too_long: 1 error
```

### **Performance**
```
⏱️  Duration: 42s
⚡ Avg Response: 1250ms
```

---

## 🎯 Next Steps

### **If Success Rate >90%:**
✅ You're doing great!
✅ Run Full Test to find edge cases
✅ Ship to beta users

### **If Success Rate 80-90%:**
⚠️ Fix top 3 error categories
⚠️ Run Quick Test again
⚠️ Repeat until >90%

### **If Success Rate <80%:**
🔴 Review error details
🔴 Open AIDebugViewer for detailed logs
🔴 Fix major issues before continuing

---

## 📊 Run Full Test (Optional)

Once Quick Test passes:

1. **Tap "🚀 Run Full Test"**
   - Tests all 120 questions
   - Takes ~4 minutes

2. **Export Results**
   - Tap "📤 Export" when done
   - Share via email/Slack

3. **Track Progress**
   - Run weekly to measure improvement
   - Compare success rates over time

---

## 💡 Quick Tips

### **Test Categories Individually**
Test specific features:
- Tap "workoutGeneration" to test workout creation
- Tap "nutrition" to test macro calculations
- Tap "workoutTracking" to test logging features

### **Run Before & After Changes**
```
1. Run Quick Test → Note success rate (e.g., 85%)
2. Make code changes
3. Run Quick Test → Check if improved (e.g., 92%)
```

### **Export for Documentation**
After Full Test:
- Tap "Export"
- Save results with date
- Track improvements: `test-results-2025-10-21.md`

---

## 🚨 Troubleshooting

### **Test Runner not showing:**
- Check if you added screen to navigation
- Make sure `__DEV__` condition is true
- Reload app

### **Tests timing out:**
- Check Gemini API key is valid
- Verify internet connection
- Check console for API errors

### **All tests failing:**
- Ensure AIService.initialize() was called
- Check AIService has valid API key
- Review console for initialization errors

---

## 🔧 Advanced: Console Testing

For faster testing during development:

```javascript
// Open Chrome DevTools (Cmd+M → Debug)
// Run in console:

import AutomatedAITester from './src/services/ai/AutomatedAITester';

// Quick test
await AutomatedAITester.runQuickTest();

// Full test
await AutomatedAITester.runAutomatedStressTest();

// Category test
await AutomatedAITester.testCategory('workoutGeneration');
```

---

## 📈 Success Checklist

- [ ] Added TestRunner to navigation
- [ ] Added button to access tests
- [ ] Ran Quick Test successfully
- [ ] Reviewed results
- [ ] Success rate >80%
- [ ] Fixed top error category
- [ ] Ran Quick Test again
- [ ] Success rate improved
- [ ] Ready for Full Test

---

## 🎉 You're Done!

You now have automated testing set up!

**What happens next:**
1. Tests run automatically when you tap button
2. AI is tested with 120 realistic questions
3. All flaws and restrictions are revealed
4. You fix issues systematically
5. Success rate improves over time
6. Ship with confidence! 🚀

---

## 📞 Need Help?

Check these files:
- `AUTOMATED_AI_TESTING_GUIDE.md` - Complete guide
- `AUTOMATED_TESTING_SUMMARY.md` - Overview
- `AI_BUG_TRACKING_WORKFLOW.md` - Bug tracking
- `QUICK_REFERENCE.md` - Daily quick access

---

**Total Setup Time: 5 minutes**
**Total Test Time: 1-4 minutes**
**Total Value: Infinite** 🎯

Start testing now! 🧪✨
