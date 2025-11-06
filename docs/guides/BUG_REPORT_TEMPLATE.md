# AI Bug Report Template

Use this template to report AI issues systematically. This ensures bugs can be reproduced and fixed properly.

---

## Bug ID
`AI-BUG-[DATE]-[NUMBER]`
Example: `AI-BUG-2025-10-21-001`

---

## 1. Bug Category
*Select the primary category that best describes this issue:*

- [ ] **Tool Execution** - Tool failed to execute or returned wrong result
- [ ] **Wrong Tool Selected** - AI called the wrong tool for the user's request
- [ ] **Missing Context** - AI didn't use available user profile/data
- [ ] **Response Quality** - Response too long, vague, or unhelpful
- [ ] **Data Issues** - Missing workout/profile/exercise data
- [ ] **API Error** - Gemini API timeout, rate limit, or error
- [ ] **Intent Detection** - AI misunderstood what user wanted
- [ ] **Other** - Describe below

---

## 2. What the User Said
*Exact message the user typed (copy from debug log):*

```
[User message here]
```

---

## 3. What Should Have Happened
*Describe the expected behavior:*

**Expected:**
- AI should call: `[toolName]`
- With parameters: `{ ... }`
- Response should: [describe]

---

## 4. What Actually Happened
*Describe what went wrong:*

**Actual:**
- AI called: `[toolName or "nothing"]`
- Error occurred: `[error message]`
- Response was: `[AI response or "no response"]`

---

## 5. Context & Environment
*Fill in from debug log:*

- **Screen:** [HomeScreen, WorkoutScreen, etc.]
- **User Has Profile:** [Yes/No]
- **User Goals:** [bulk, cut, strength, etc.]
- **Recent Workouts:** [number in last 7 days]
- **Timestamp:** [ISO timestamp]

---

## 6. Debug Log Entry
*Paste the full log entry from AIDebugger:*

```json
{
  "id": "ai_log_...",
  "userMessage": "...",
  "aiResponse": "...",
  "toolsUsed": [...],
  "error": {...}
}
```

---

## 7. Tool Execution Details
*If tools were called, paste their results:*

### Tool: [name]
**Success:** [true/false]
**Params:**
```json
{ ... }
```

**Result:**
```json
{ ... }
```

---

## 8. Screenshots
*Attach screenshots showing:*
1. User message in chat
2. AI response (or error)
3. Debug log viewer (if available)

---

## 9. Frequency & Impact
*How often does this happen?*

- [ ] **Always** - Happens every time for this query
- [ ] **Often** - Happens >50% of the time
- [ ] **Sometimes** - Happens occasionally (<50%)
- [ ] **Rare** - Only happened once

**Impact:**
- [ ] **Critical** - Blocks core functionality, bad user experience
- [ ] **High** - Important feature doesn't work
- [ ] **Medium** - Feature works but quality is poor
- [ ] **Low** - Minor issue, workaround exists

---

## 10. Reproduction Steps
*Step-by-step to reproduce:*

1. Go to [screen]
2. Ensure user profile has [data]
3. Type: "[exact message]"
4. Tap send
5. Observe: [what happens]

---

## 11. Possible Root Cause
*Your hypothesis (optional):*

- [ ] Prompt engineering issue - AI system prompt needs update
- [ ] Missing data - Tool doesn't have access to required data
- [ ] Tool implementation bug - Code in the tool is broken
- [ ] Context not passed - AIService not sending user profile
- [ ] API issue - Gemini API problem
- [ ] Unknown - Need investigation

---

## 12. Suggested Fix
*If you have an idea (optional):*

```
[Describe potential fix or provide code]
```

---

## 13. Related Bugs
*Link to similar issues:*

- Related to: `AI-BUG-XXXX-XX-XX-XXX`
- Duplicate of: `AI-BUG-XXXX-XX-XX-XXX`

---

## Status
- [ ] **New** - Just reported
- [ ] **Investigating** - Looking into root cause
- [ ] **In Progress** - Fix being implemented
- [ ] **Testing** - Fix deployed, needs verification
- [ ] **Resolved** - Bug fixed and verified
- [ ] **Won't Fix** - Not a bug / Working as intended

---

## Notes
*Additional observations:*

[Any other relevant information]

---

**Reporter:** [Your name]
**Date Reported:** [Date]
**Last Updated:** [Date]
