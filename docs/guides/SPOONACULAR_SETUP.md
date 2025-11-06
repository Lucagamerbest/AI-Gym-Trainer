# Spoonacular API Setup Guide

## Overview
The app now includes a Recipe Database powered by Spoonacular API with 365,000+ recipes.

## Features
- ✅ Filter by meal type (breakfast, lunch, dinner, snack)
- ✅ Calorie range sliders (respects meal type limits)
- ✅ Minimum protein filter
- ✅ Sweet/Salty tags
- ✅ Dietary filters (vegetarian, vegan, gluten-free, keto, paleo)
- ✅ Cooking time filter
- ✅ Search by ingredient or name
- ✅ 24-hour caching to minimize API calls

## Getting Your API Key

1. **Sign up for Spoonacular**
   - Go to: https://spoonacular.com/food-api/console#Dashboard
   - Create a free account
   - Free tier includes: **150 requests per day** (plenty for testing)

2. **Get Your API Key**
   - After signup, you'll see your API key on the dashboard
   - Copy the key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

3. **Add API Key to the App**

   **Option A: Hardcode (for testing)**
   - Open `src/services/SpoonacularService.js`
   - Replace `YOUR_API_KEY_HERE` with your actual key:
     ```javascript
     const SPOONACULAR_API_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
     ```

   **Option B: Environment Variable (recommended for production)**
   - Create `.env` file in project root:
     ```
     SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
     ```
   - Install `react-native-dotenv`:
     ```bash
     npm install react-native-dotenv
     ```
   - Update `src/services/SpoonacularService.js`:
     ```javascript
     import { SPOONACULAR_API_KEY } from '@env';
     ```

## Testing the Integration

1. Navigate to RecipesScreen
2. Tap the "Browse Recipes" tab (or however it's integrated)
3. Try searching for:
   - Snacks under 300 calories
   - High-protein breakfast
   - Vegetarian lunch

## API Rate Limits

### Free Tier (Most Users)
- **150 requests/day**
- Resets at midnight UTC
- Caching reduces actual API calls significantly

### Paid Tiers (if needed later)
- Starter: $25/month = 1,500 requests/day
- Basic: $75/month = 5,000 requests/day
- Advanced: $200/month = 15,000 requests/day

## Caching Strategy

The app caches recipes for 24 hours to minimize API usage:
- Search results are cached by filter combination
- Recipe details are cached by ID
- Cache is stored locally using AsyncStorage
- Clear cache: `SpoonacularService.clearCache()`

## Recipe Database Schema

```javascript
{
  id: "spoonacular_12345",
  spoonacularId: 12345,
  name: "Greek Yogurt Parfait",
  mealType: "snack",
  nutrition: {
    calories: 180,
    protein: 15,
    carbs: 22,
    fat: 3,
  },
  readyInMinutes: 5,
  difficulty: "easy",
  tags: ["sweet", "high-protein", "vegetarian"],
  ingredients: [...],
  instructions: [...],
  imageUrl: "https://...",
  source: "spoonacular"
}
```

## Troubleshooting

### "API Key not configured" error
- Make sure you replaced `YOUR_API_KEY_HERE` in SpoonacularService.js
- Check that there are no extra spaces in the key

### "Network request failed"
- Check internet connection
- Verify API key is valid
- Check if you've exceeded daily limit (150 requests)

### "No recipes found"
- Try broader filters (increase calorie range)
- Remove dietary restrictions
- Check if search query is too specific

### Rate limit exceeded
- Wait until midnight UTC for reset
- Use cached results (they last 24 hours)
- Consider upgrading to paid tier if needed

## Next Steps

1. Get your API key from Spoonacular
2. Add it to `SpoonacularService.js`
3. Test the recipe browser
4. Adjust filters as needed for your users

## Cost Optimization Tips

1. **Cache aggressively** - Already implemented (24 hours)
2. **Batch user requests** - Load 20 recipes at once
3. **Popular recipes** - Cache common searches longer
4. **Fallback to AI** - If API limit reached, use AI generation
5. **User favorites** - Store user's saved recipes locally

## Future Enhancements

- [ ] Infinite scroll pagination
- [ ] Sort by price, health score, popularity
- [ ] Save favorite recipes offline
- [ ] Meal plan generator (7-day meal plans)
- [ ] Shopping list generation from recipes
- [ ] Nutrition goals integration
- [ ] Recipe substitutions
- [ ] User recipe ratings and notes
