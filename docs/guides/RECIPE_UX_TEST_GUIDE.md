# Recipe UX Improvement - Test Guide

## 🎯 What Was Changed

The AI recipe generation now displays a **condensed recipe card** instead of overwhelming text, with a button to view the full recipe in RecipesScreen.

---

## ✅ Test Scenario 1: Generate Recipe from AI Chat

### Steps:
1. **Open the app** (should already be running on port 8081)
2. **Open AI Assistant**:
   - Tap the 🤖 floating button (bottom right), OR
   - Navigate to the AI screen from the bottom navigation
3. **Test the recipe generation**:
   - Type or say: `"Create a recipe using: chicken, rice, broccoli"`
   - Press Send

### Expected Results:

#### ✅ AI Response Should Show:
```
✅ Created "Lemon Herb Roasted Chicken, Broccoli & Brown Rice"!
📊 643 cal • 61g protein

Recipe saved to your collection!
```

#### ✅ Recipe Card Should Appear Below Message:
- **Title**: "Lemon Herb Roasted Chicken, Broccoli & Brown Rice"
- **Servings**: "Serves 2"
- **Macros Grid**:
  - 643 cal
  - 61g protein
  - 49g carbs
  - 22g fat
- **Timings**:
  - ⏱️ 15 minutes prep
  - 🔥 25 minutes cook
- **Button**: "View Full Recipe" with book icon

#### ✅ When You Tap "View Full Recipe":
1. AI chat modal closes
2. Navigates to RecipesScreen
3. Recipe appears at the top with:
   - **Glowing green border** (primary color)
   - **Badge**: "✨ Just Created" at top-right
   - **Enhanced shadow effect**
4. After 3 seconds, the glow/badge fades away

---

## ✅ Test Scenario 2: Verify Recipe is Saved

### Steps:
1. Close the AI Assistant modal
2. Navigate to: **Nutrition → Meals History**
3. Tap **"Create Meal"** or **"Add Food"**
4. Navigate to **RecipesScreen** (should be an option)

### Expected Results:
- The newly created recipe should be visible in the list
- It should have all the ingredients and nutrition data
- You can add it to a meal by tapping "Add to [Meal Type]"

---

## ✅ Test Scenario 3: Generate Multiple Recipes

### Steps:
1. Open AI Assistant again
2. Generate another recipe with different ingredients:
   - `"Create a high-protein breakfast with: eggs, oats, banana"`
3. Then generate another:
   - `"Create a low-carb dinner with: salmon, asparagus, olive oil"`

### Expected Results:
- Each recipe generates a new recipe card
- Each card is condensed and easy to read
- All recipes are saved to RecipesScreen
- Tapping "View Full Recipe" navigates correctly each time

---

## ✅ Test Scenario 4: Recipe with Dietary Restrictions

Test that the tool parameters work correctly.

### Steps:
1. Open AI Assistant
2. Try a more complex request:
   - `"Create a vegetarian recipe with quinoa and chickpeas, target 30g protein"`

### Expected Results:
- AI should generate a vegetarian recipe
- Should attempt to hit ~30g protein target
- Recipe card displays correctly with all macro info

---

## 🐛 What to Watch For (Potential Issues)

### Issue #1: Recipe Card Not Showing
**Symptom**: You see the text message but no recipe card appears below it.

**Debug**:
- Check console logs for: `📦 AI Result:` and `toolResults`
- The `recipeCard` object should be in `toolResults`

**Possible Fix**: Tool might not be returning `recipeCard` properly.

---

### Issue #2: Navigation Fails
**Symptom**: Tapping "View Full Recipe" doesn't navigate or crashes.

**Debug**:
- Check console for navigation errors
- Verify RecipesScreen exists in navigation stack

**Possible Fix**: RecipesScreen route name might be wrong.

---

### Issue #3: Recipe Not Highlighted
**Symptom**: Navigation works but recipe doesn't have glowing border.

**Debug**:
- Check console: `highlightRecipe` param should be passed
- Check if recipe ID matches

**Possible Fix**: Recipe ID mismatch between saved recipe and param.

---

### Issue #4: API Key Error
**Symptom**: Error message: "Gemini API key not configured"

**Debug**:
- Check `.env.local` has `GOOGLE_GEMINI_API_KEY`
- Restart the app after adding the key

**Possible Fix**: AIService.apiKey is not initialized.

---

## 📊 Success Criteria

✅ Recipe generation creates condensed response (not full text wall)
✅ Recipe card displays with title, macros, timings
✅ "View Full Recipe" button is visible and tappable
✅ Tapping button closes AI modal and navigates to RecipesScreen
✅ Newly created recipe is highlighted with glowing border + badge
✅ Highlight fades after 3 seconds
✅ Recipe is saved and persists in RecipesScreen
✅ Recipe can be added to meals from RecipesScreen

---

## 🔍 Code Changes Summary

### Files Modified:
1. **src/services/ai/tools/RecipeTools.js**
   - Line 152-175: Changed return message format
   - Added `recipeCard` object with structured data

2. **src/components/AIChatModal.js**
   - Line 18: Added `useNavigation` import
   - Line 28: Added navigation hook
   - Line 340: Pass `toolResults` to messages
   - Line 405-482: Updated `renderMessage` to show recipe cards
   - Line 771-837: Added recipe card styles

3. **src/screens/RecipesScreen.js**
   - Line 37: Added `highlightRecipe` param
   - Line 47-57: Added highlight state + auto-clear timer
   - Line 366-432: Updated `renderRecipe` to show highlight
   - Line 1215-1238: Added highlight styles

---

## 🎨 Visual Design

### Recipe Card Layout:
```
┌─────────────────────────────────────────┐
│ ✅ Created "Recipe Name"!               │
│ 📊 643 cal • 61g protein                │
│                                         │
│ Recipe saved to your collection!       │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │  Recipe Name                       │ │
│ │  Serves 2                          │ │
│ │  ───────────────────────────────  │ │
│ │  643 cal | 61g protein            │ │
│ │  49g carbs | 22g fat              │ │
│ │  ───────────────────────────────  │ │
│ │  ⏱️ 15 min prep | 🔥 25 min cook  │ │
│ │  [📖 View Full Recipe]            │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Highlighted Recipe in RecipesScreen:
```
┌──────────────────────────────────────────┐
│         ✨ Just Created                  │
│ ╔════════════════════════════════════╗  │
│ ║  ⭐ Recipe Name                     ║  │
│ ║  3 ingredients                     ║  │
│ ║                                    ║  │
│ ║  643 cal  P: 61g  C: 49g  F: 22g  ║  │
│ ║  [Add to Lunch] [Edit] [Delete]   ║  │
│ ╚════════════════════════════════════╝  │
└──────────────────────────────────────────┘
     ^ Glowing green border
```

---

## 📝 Test Results Log

Use this section to note your test results:

### Test 1 - Basic Recipe Generation:
- [ ] AI generates recipe successfully
- [ ] Recipe card displays correctly
- [ ] "View Full Recipe" button works
- [ ] Navigation to RecipesScreen works
- [ ] Recipe is highlighted with glow + badge
- [ ] Highlight fades after 3 seconds

**Notes**:


---

### Test 2 - Recipe Persistence:
- [ ] Recipe appears in RecipesScreen
- [ ] Recipe has all ingredients
- [ ] Recipe can be added to meals

**Notes**:


---

### Test 3 - Multiple Recipes:
- [ ] Can generate multiple recipes in sequence
- [ ] Each recipe card displays correctly
- [ ] Navigation works for each recipe

**Notes**:


---

### Test 4 - Dietary Restrictions:
- [ ] Complex requests work correctly
- [ ] Parameters (protein target, dietary restrictions) are honored

**Notes**:


---

## 🚀 Next Steps After Testing

Once you confirm these tests pass, we can move on to implementing:

1. **Meal Planning Tools** (generateWeeklyMealPlan, suggestNextMealForBalance, predictDailyMacroShortfall)
2. **Progress Tools** (predictGoalCompletionDate, detectProgressPlateau, estimateBodyFatPercentage)

These tools are already implemented in the code but need similar UX improvements for their responses.

---

## 💡 Future Enhancements (Ideas)

- **Recipe Library**: Pre-populate 20 AI-generated recipes users can modify
- **Recipe Search**: Search through saved recipes by ingredient/macro
- **Recipe Scaling**: Adjust servings and recalculate macros
- **Recipe Sharing**: Export recipe as text/image to share
- **Recipe Photos**: Let users upload photos of their recipes
- **Meal Prep Mode**: Scale recipe for meal prep (5-7 servings)
