# Global Text Input Policy

## Problem Statement

Previously, text input was disabled across all AI screens except the main Home AI screen. This created inconsistency and limited user flexibility. However, always showing a free-text input makes the app feel "text box heavy" and low-effort, like there wasn't thoughtful design behind the interaction patterns.

## Solution: Intentional Design with Optional Flexibility

The new policy balances **structured design** (buttons) with **user flexibility** (text input) by making text input **opt-in** rather than default.

---

## Design Philosophy

### ✅ **Default Interaction: Structured Buttons**
- Shows thoughtful design and intentional UX
- Guides users to the most common actions
- Demonstrates feature discovery
- Reduces cognitive load

### ✅ **Advanced Interaction: Optional Text Input**
- Revealed via "Ask Coach Anything..." button
- For custom requests beyond pre-defined buttons
- Maintains clean UI by default
- Shows we designed the flow, not just added a text box

---

## Implementation

### **Where It's Applied**
All AI screens that use `AIButtonModal`:
- Workout screens
- Nutrition screens
- Exercise screens
- Training screens
- Any screen with AI assistant functionality

### **How It Works**

1. **Default State**: User sees structured buttons organized by category
   ```
   [Quick Actions]
   - Generate workout
   - Find exercise alternatives
   - Analyze progress

   [Advanced]
   [Ask Coach Anything...] ← Reveals text input
   ```

2. **Expanded State**: User taps "Ask Coach Anything..." button
   ```
   💬 Ask your coach
   Type any fitness question or request...

   [Text input with examples]
   e.g., "Create a high protein breakfast recipe"

   [Send] [X Close]
   ```

3. **After Send**: Input collapses back to default state

---

## User Flow

```
User opens AI modal
    ↓
Sees structured buttons (intentional design)
    ↓
Option A: Taps a button → Immediate action
Option B: Taps "Ask Coach Anything..." → Reveals text input
    ↓
Types custom request
    ↓
Sends message
    ↓
Input collapses, response shown
```

---

## Benefits

### For Users
- ✅ Clear guidance on what AI can do (via buttons)
- ✅ Quick access to common actions
- ✅ Flexibility for custom requests when needed
- ✅ Clean, uncluttered interface

### For Product
- ✅ Shows intentional UX design
- ✅ Promotes feature discovery
- ✅ Reduces support burden (buttons guide users)
- ✅ Maintains professional appearance

### For Development
- ✅ Consistent pattern across all AI screens
- ✅ Single source of truth (`AIButtonModal`)
- ✅ Easy to maintain and update

---

## Technical Implementation

### Component: `AIButtonModal.js`

**State Management:**
```javascript
const [showCustomInput, setShowCustomInput] = useState(false);
const [customInputText, setCustomInputText] = useState('');
```

**Toggle Button:**
```javascript
{!lastResponse && !showCustomInput && loadingButton === null && (
  <TouchableOpacity
    style={styles.askCoachButton}
    onPress={() => setShowCustomInput(true)}
  >
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]}>
      <Ionicons name="chatbubble-ellipses" size={20} />
      <Text>Ask Coach Anything...</Text>
      <Ionicons name="chevron-forward" size={20} />
    </LinearGradient>
  </TouchableOpacity>
)}
```

**Custom Input UI:**
```javascript
{showCustomInput && !lastResponse && (
  <View style={styles.customInputContainer}>
    <View style={styles.customInputHeader}>
      <Text>💬 Ask your coach</Text>
      <TouchableOpacity onPress={() => {
        setShowCustomInput(false);
        setCustomInputText('');
      }}>
        <Ionicons name="close-circle" />
      </TouchableOpacity>
    </View>
    <Text style={styles.customInputHint}>
      Type any fitness question or request...
    </Text>
    <TextInput
      placeholder="e.g., 'Create a high protein breakfast recipe'"
      value={customInputText}
      onChangeText={setCustomInputText}
      multiline
      maxLength={500}
      autoFocus
    />
    <TouchableOpacity onPress={handleSendCustomWorkout}>
      <Ionicons name="send" />
    </TouchableOpacity>
  </View>
)}
```

---

## Design Rationale

### Why Not Always Show Text Input?

**Problems with always-visible text input:**
1. Feels generic and low-effort
2. Doesn't showcase app features
3. Users don't know what to ask
4. Creates "blank page syndrome"
5. Looks like a basic chatbot

**Benefits of button-first approach:**
1. Demonstrates thoughtful design
2. Shows what AI can do
3. Reduces decision paralysis
4. Maintains professional polish
5. Still allows flexibility when needed

---

## Exception: Main Home AI Screen

The main Home AI screen (`AIScreen.js` with `AIChatModal`) still opens with text input by default because:
- It's the **dedicated coach chat** screen
- Users navigate there specifically to talk to the coach
- It's not a contextual assistant (workout/nutrition helper)
- Traditional chat interface is expected there

---

## Future Enhancements

### Potential Additions
1. **Contextual Suggestions**: Show relevant example prompts based on screen
   - Workout screen: "Modify this workout for home equipment"
   - Nutrition screen: "Suggest a meal to hit my protein goal"

2. **Smart Autocomplete**: Predict common fitness terms as user types
   - "chick..." → "chicken breast"
   - "replace bench..." → "replace bench press with..."

3. **Voice Input**: Add microphone button for hands-free requests
   - Useful during workouts

4. **Quick Actions Above Text**: Show 2-3 contextual buttons even when text input is open
   - "Generate Recipe" | "Find Alternative" | [Custom Text Input]

---

## Testing Checklist

- [ ] Button appears on all AI modal screens
- [ ] Button has gradient styling and proper spacing
- [ ] Tapping button reveals text input with correct placeholder
- [ ] Text input has character limit (500)
- [ ] Close button clears input and hides text field
- [ ] Send button processes request correctly
- [ ] Input collapses after sending
- [ ] Works on iOS, Android, and Web
- [ ] Keyboard handling works correctly
- [ ] Doesn't interfere with existing buttons

---

## Maintenance Notes

### If You Need to Update All AI Screens
Since all AI screens use `AIButtonModal`, any changes to this policy only require updating one file: `src/components/AIButtonModal.js`

### Adding New Contextual Buttons
Update `src/config/aiSectionConfig.js` to add buttons for specific screens. The "Ask Coach Anything..." button will automatically appear below all sections.

---

**Status**: ✅ Implemented
**Last Updated**: November 6, 2025
**Files Modified**: `src/components/AIButtonModal.js`
