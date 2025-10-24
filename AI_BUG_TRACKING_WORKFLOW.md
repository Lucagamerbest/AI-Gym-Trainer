# AI Bug Tracking & Prevention Workflow

This guide explains the complete system for tracking, reporting, and preventing AI bugs systematically.

---

## 🎯 Goal

Move from **case-by-case reactive debugging** to **systematic quality assurance** that prevents similar bugs from recurring.

---

## 📦 What You Have Now

### 1. **Automatic Logging System** (`AIDebugger.js`)
Every AI interaction is automatically logged with:
- ✅ User message
- ✅ AI response
- ✅ Tools called (with params and results)
- ✅ Execution time for each tool
- ✅ Success/failure status
- ✅ Error category (if failed)
- ✅ Full context (screen, user profile, etc.)

**Location:** Logs stored in AsyncStorage at `@ai_debug_log`
**Retention:** Last 100 interactions

### 2. **In-App Debug Viewer** (`AIDebugViewer.js`)
View all logs directly in the app:
- 📊 Performance statistics
- 🔍 Filter by success/failed
- 📤 Export bug reports
- 🗑️ Clear old logs
- 📋 One-tap bug report creation

### 3. **Bug Report Template** (`BUG_REPORT_TEMPLATE.md`)
Structured template for reporting bugs with:
- 🏷️ Error categorization
- 📝 Reproduction steps
- 🔍 Debug log integration
- 📊 Impact assessment
- 💡 Root cause analysis

### 4. **Automated Test Suite** (`AIToolTests.js`)
Tests all 17 AI tools automatically:
- ✅ Unit tests for each tool
- ⚡ Performance tests
- 🛡️ Error handling tests
- 🔄 Regression prevention

### 5. **Error Categorization System**
18 predefined error categories in `AIDebugger.js`:
- Tool execution errors
- Data errors
- AI response errors
- Context errors
- API errors
- UX issues

---

## 🔄 The Workflow

### **Daily Development**

```
1. Work on AI features
   ↓
2. AIDebugger logs EVERY interaction automatically
   ↓
3. You see console logs showing success/failure
   ↓
4. If something fails → Open AIDebugViewer in app
   ↓
5. Find the failed interaction
   ↓
6. Tap "Export Bug Report"
   ↓
7. Bug report auto-generated with ALL context
   ↓
8. Fix the issue
   ↓
9. Run automated tests to verify fix
```

### **Weekly Bug Review**

```
1. Open AIDebugViewer in app
   ↓
2. Check "Performance Statistics"
   - Success rate should be >90%
   - Average response time <2000ms
   ↓
3. Look at "Top Errors"
   - Are the same errors repeating?
   - Are they related to same root cause?
   ↓
4. Export logs for failed interactions
   ↓
5. Group similar bugs together
   ↓
6. Fix the ROOT CAUSE, not individual bugs
```

### **Before Launch**

```
1. Run automated test suite
   ↓
2. npm test -- AIToolTests.js
   ↓
3. All tests should pass
   ↓
4. Check debug viewer stats:
   - Success rate >95%
   - No critical errors in last 50 interactions
   ↓
5. Clear debug logs (fresh start)
   ↓
6. Launch to beta users
```

### **After Beta Launch**

```
1. Beta users report issues
   ↓
2. Ask them to open AIDebugViewer
   ↓
3. Find the failed interaction
   ↓
4. Export and share bug report
   ↓
5. You receive COMPLETE reproduction steps
   ↓
6. Fix is much faster because you have:
   - Exact user message
   - Tools that were called
   - Error category
   - Full context
```

---

## 📋 How to Report a Bug

### **Option 1: In-App (Fastest)**

1. Open AI screen
2. Reproduce the bug
3. Open AIDebugViewer component
4. Tap "Filter: Failed"
5. Find your interaction
6. Tap to expand
7. Tap "Export Bug Report"
8. Share via email/Slack/GitHub

### **Option 2: Manual Template**

1. Copy `BUG_REPORT_TEMPLATE.md`
2. Fill in all sections
3. Paste debug log JSON from AIDebugViewer
4. Submit as GitHub issue or document

---

## 🏷️ Error Categories Explained

When you see an error, it will be automatically categorized:

### **Tool Errors**
- `tool_not_found` - AI tried to call non-existent tool
- `tool_execution_failed` - Tool crashed during execution
- `tool_missing_params` - AI didn't provide required parameters
- `tool_invalid_result` - Tool returned unexpected format

### **Data Errors**
- `no_active_workout` - User tried workout action without starting workout
- `no_user_profile` - Profile data missing
- `data_not_found` - Requested data doesn't exist
- `invalid_data_format` - Data in wrong format

### **AI Response Errors**
- `no_function_call` - AI should have called tool but didn't
- `wrong_tool_selected` - AI called wrong tool for the task
- `incomplete_response` - Response cut off or missing info
- `hallucinated_data` - AI made up data instead of using tools

### **Context Errors**
- `missing_context` - AI didn't have required context
- `stale_context` - Context was outdated

### **API Errors**
- `api_timeout` - Gemini API took too long
- `api_rate_limit` - Hit rate limits
- `api_error` - General API failure

### **UX Errors**
- `response_too_long` - Response doesn't fit on screen
- `response_too_vague` - Response not specific enough
- `wrong_intent_detected` - AI misunderstood user's request

---

## 📊 How to Use Statistics

### **Success Rate**
- **>95%** = Excellent, ready for production
- **90-95%** = Good, minor issues to fix
- **80-90%** = Needs improvement
- **<80%** = Major issues, don't launch yet

### **Top Errors**
If you see the same error category appearing repeatedly:
- **Same error, different messages** → Prompt engineering issue
- **Same error, same tool** → Tool implementation bug
- **Same error, missing data** → Context not passed correctly

### **Tool Usage**
- Tools with high failure rates need debugging
- Tools never used might indicate AI doesn't know when to use them
- Average tools used = complexity indicator (higher = slower responses)

---

## 🧪 Running Automated Tests

### **Run All Tests**
```bash
npm test -- AIToolTests.js
```

### **Run Specific Test**
```bash
npm test -- AIToolTests.js -t "generateWorkoutPlan"
```

### **Manual Test in Console**
```javascript
import { runManualTests } from './src/services/ai/tools/__tests__/AIToolTests';

// In your app
runManualTests();
```

This will print a table showing all test results.

---

## 🎯 When to Fix vs. When to Ship

Use the **80/20 Rule**:

### **Fix Now (Blockers)**
- Success rate <80%
- Same error appears >20 times
- Critical tools failing (startWorkout, logWorkoutSet)
- Users can't complete core workflows

### **Fix Later (Improvements)**
- Success rate >90% but want 95%
- Minor UX issues (response too long)
- Edge cases that rarely happen
- Nice-to-have features

### **Ship It**
When you hit:
- ✅ >90% success rate
- ✅ No critical bugs in last 50 interactions
- ✅ All automated tests passing
- ✅ Core workflows work smoothly

Then ship to beta users and let REAL usage guide next improvements.

---

## 🔍 Root Cause Analysis

When you see a bug, ask:

1. **Is this a tool problem?**
   - Tool code is broken
   - Tool doesn't have access to required data
   - Fix: Update tool implementation

2. **Is this a prompt problem?**
   - AI doesn't know when to use the tool
   - AI using wrong tool
   - Fix: Update system prompt in `buildSystemPromptForTools`

3. **Is this a context problem?**
   - User profile not passed
   - Recent workout data missing
   - Fix: Update context building in `AIChatModal.js`

4. **Is this a data problem?**
   - Exercise database incomplete
   - Workout history empty
   - Fix: Add more data or handle empty states

5. **Is this an API problem?**
   - Gemini timeout
   - Rate limit hit
   - Fix: Add retry logic, check quotas

---

## 📈 Continuous Improvement Loop

```
Week 1: Build feature → Log everything
   ↓
Week 2: Review logs → Find patterns
   ↓
Week 3: Fix root causes → Add tests
   ↓
Week 4: Ship to beta → Collect real data
   ↓
Week 5: Review beta logs → Prioritize top issues
   ↓
Week 6: Fix top 3 issues → Re-test
   ↓
Week 7: Public launch 🚀
```

---

## 🚀 Quick Start Checklist

- [ ] Add `<AIDebugViewer />` to your app (Settings screen?)
- [ ] Verify AIDebugger is logging interactions (check console)
- [ ] Test the bug export feature with a failed interaction
- [ ] Run automated tests: `npm test -- AIToolTests.js`
- [ ] Review first week's statistics in AIDebugViewer
- [ ] Create your first bug report using the template
- [ ] Fix top 3 errors from the statistics
- [ ] Re-run tests to verify fixes
- [ ] Ship to 3-5 beta users

---

## 📞 Support

If you find bugs in the debugging system itself:
1. Check `AIDebugger.js` console logs
2. Verify AsyncStorage permissions
3. Check if logs are being written: `AsyncStorage.getItem('@ai_debug_log')`

---

## 🎓 Key Takeaways

1. **Every interaction is logged** - No more guessing what went wrong
2. **Categories group similar issues** - Fix root causes, not symptoms
3. **Automated tests prevent regressions** - Catch bugs before users do
4. **Statistics guide priorities** - Focus on highest-impact issues
5. **80% is good enough to ship** - Real users > perfect system

---

**Remember:** The goal isn't zero bugs. The goal is **systematic improvement** where each bug fixed makes the entire system better, not just one case.

Happy debugging! 🐛🔨
