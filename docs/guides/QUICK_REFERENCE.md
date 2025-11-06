# AI Debugging Quick Reference Card

Keep this open while developing for quick access to common workflows.

---

## 🚨 When You See a Bug

### **Fastest Way to Report**
1. Open AIDebugViewer in app
2. Tap "Filter: Failed"
3. Find the interaction
4. Tap "Export Bug Report"
5. Share it

### **Console Logs to Watch**
```
✅ AI Interaction Logged: {...}     → Success
❌ AI Interaction Failed: {...}     → Bug detected
📞 AI called function: toolName      → Tool being used
✅ Function toolName returned: {...} → Tool succeeded
❌ Tool execution failed: {...}      → Tool crashed
```

---

## 📊 Debug Viewer Shortcuts

| Action | What It Does |
|--------|--------------|
| **Filter: Failed** | Show only errors |
| **Export Logs** | Share all logs |
| **Refresh** | Reload latest data |
| **Clear** | Delete all logs (can't undo!) |
| Tap entry | Expand details |
| **Export Bug Report** | Create shareable bug report |

---

## 🏷️ Quick Error Categories

| If You See... | It Means... | Likely Fix |
|--------------|-------------|------------|
| `tool_not_found` | AI called wrong tool name | Update prompt with correct tool name |
| `tool_execution_failed` | Tool crashed | Debug tool code |
| `no_active_workout` | User needs to start workout first | Add check or guide user |
| `no_user_profile` | Profile data missing | Ensure profile is passed in context |
| `wrong_tool_selected` | AI used wrong tool | Improve tool descriptions in schema |
| `response_too_long` | Response doesn't fit screen | Add shorter response rules to prompt |
| `api_timeout` | Gemini took too long | Reduce maxOutputTokens or simplify prompt |

---

## 🧪 Testing Commands

```bash
# Run all AI tool tests
npm test -- AIToolTests.js

# Run specific test
npm test -- AIToolTests.js -t "generateWorkoutPlan"

# Run manual tests in console
# In app: import { runManualTests } from './src/services/ai/tools/__tests__/AIToolTests'
# Then call: runManualTests()
```

---

## 📈 Success Rate Guide

| Success Rate | Status | Action |
|--------------|--------|--------|
| **>95%** | 🟢 Excellent | Ship it! |
| **90-95%** | 🟡 Good | Fix top 2-3 errors |
| **80-90%** | 🟠 Needs work | Fix top 5 errors before launch |
| **<80%** | 🔴 Critical | Don't launch, debug thoroughly |

---

## 🔍 Debugging Checklist

When bug occurs, check:
- [ ] Is tool code correct? (Read `CRUDTools.js`, etc.)
- [ ] Is tool registered? (Check `tools/index.js`)
- [ ] Does AI know when to use it? (Check `buildSystemPromptForTools`)
- [ ] Is context passed? (Check `AIChatModal.js` fullContext)
- [ ] Is data available? (Check AsyncStorage/Firebase)
- [ ] Is error categorized correctly? (Check AIDebugger log)

---

## 🎯 Priority Matrix

Fix in this order:

**1. Critical (Fix Today)**
- Blocks core features
- >20% of interactions failing
- Users can't complete main workflows

**2. High (Fix This Week)**
- Success rate <90%
- Same error appearing >10 times
- Important features degraded

**3. Medium (Fix Before Launch)**
- Success rate <95%
- UX issues (too long, too vague)
- Edge cases that sometimes occur

**4. Low (Backlog)**
- Nice-to-haves
- Rare edge cases (<1%)
- Features that can be improved later

---

## 📝 Files You'll Edit Most

| File | When to Edit |
|------|-------------|
| `AIService.js → buildSystemPromptForTools()` | AI using wrong tools or wrong format |
| `CRUDTools.js` | Workout/exercise logging bugs |
| `WorkoutTools.js` | Workout generation bugs |
| `NutritionTools.js` | Macro calculation bugs |
| `AIDebugger.js → ERROR_CATEGORIES` | Add new error types |
| `AIChatModal.js` | Context not being passed |

---

## 💡 Common Fixes

### **AI Not Using Tools**
```javascript
// In buildSystemPromptForTools(), add:
CRITICAL: When user says "X", call toolName.

Example:
- "Create workout" → call generateWorkoutPlan
- "Add exercise" → call addExerciseToWorkout
```

### **Tool Execution Failing**
```javascript
// In tool file, add try-catch:
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: error.message };
}
```

### **Response Too Long**
```javascript
// In buildSystemPromptForTools(), add:
RESPONSE FORMAT:
- MAX 3 sentences
- Format: "Exercise - Sets×Reps"
- NO paragraphs or explanations
```

### **Missing Context**
```javascript
// In AIChatModal.js, ensure:
const fullContext = {
  screen: currentScreen,
  userProfile: await getUserProfileSummary(), // ← Add this
  recentActivity: await getRecentActivity(),  // ← Add this
};
```

---

## 🚀 Ship Checklist

Before launching to users:

- [ ] Success rate >90%
- [ ] All automated tests passing
- [ ] Top 3 errors fixed
- [ ] No critical bugs in last 50 interactions
- [ ] Tested core workflows manually
- [ ] Debug logs cleared (fresh start)

---

## 📞 Quick Debug Commands

```javascript
// Get current stats
await AIDebugger.getErrorStatistics()

// Get failed interactions
await AIDebugger.getFailedInteractions()

// Get specific error category
await AIDebugger.getInteractionsByCategory('tool_execution_failed')

// Export all logs
await AIDebugger.exportDebugLog()

// Clear logs
await AIDebugger.clearDebugLog()
```

---

## 🎓 Remember

1. **Every interaction is logged** - Check AIDebugViewer first
2. **Categories = Patterns** - Same category = same root cause
3. **80% = Ship** - Don't chase perfection
4. **Real users > Tests** - Beta feedback is gold
5. **Fix causes, not symptoms** - Group similar bugs

---

Print this page and keep it next to your monitor! 🖨️
