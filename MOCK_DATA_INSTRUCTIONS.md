# Mock Data for Testing

## Quick Start

### Option 1: Add Load Mock Data Button to Profile Screen

Add this button to your `ProfileScreen.js` or any screen for easy testing:

```javascript
import { loadMockData, clearAllData } from '../utils/mockDataLoader';

// Add these buttons to your screen:
<TouchableOpacity
  onPress={async () => {
    const result = await loadMockData();
    if (result.success) {
      alert(`Loaded ${result.workouts} workouts and ${result.nutritionDays} days of nutrition!`);
    }
  }}
  style={{backgroundColor: '#4CAF50', padding: 15, margin: 10, borderRadius: 8}}
>
  <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>
    📊 Load Mock Data
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={async () => {
    const result = await clearAllData();
    if (result.success) {
      alert('All data cleared!');
    }
  }}
  style={{backgroundColor: '#f44336', padding: 15, margin: 10, borderRadius: 8}}
>
  <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>
    🗑️ Clear All Data
  </Text>
</TouchableOpacity>
```

### Option 2: Run from Console

In Expo, shake your device and select "Debug Remote JS", then in the console:

```javascript
import('./src/utils/mockDataLoader').then(m => m.loadMockData());
```

## What Gets Loaded

### Workouts (9 sessions over 60 days)
- **60 days ago**: Dumbbell Bench 60 lbs x 8 reps
- **53 days ago**: Dumbbell Bench 65 lbs x 8 reps
- **45 days ago**: Dumbbell Bench 70 lbs x 8 reps
- **30 days ago**: Dumbbell Bench 75 lbs x 6 reps
- **14 days ago**: Dumbbell Bench 75 lbs x 8 reps
- **7 days ago**: Dumbbell Bench 80 lbs x 5 reps
- **4 days ago**: Dumbbell Bench 80 lbs x 5 reps (CURRENT PR)

Also includes:
- Barbell Rows (95 → 115 lbs progression)
- Barbell Squats (135 → 155 lbs progression)
- Leg exercises (Romanian Deadlifts, etc.)

### Nutrition (31 days of meals)
- **Daily calories**: 1800-2200 (weekdays), 2200-2500 (weekends)
- **Macro split**: ~35% protein, 40% carbs, 25% fat
- **4 meals per day**:
  - Breakfast: Eggs and Oatmeal
  - Lunch: Chicken and Rice
  - Snack: Protein Shake
  - Dinner: Salmon and Vegetables

## Testing the AI

With this data loaded, you can test these AI questions:

✅ **"Show my bench press progress"**
- Should show 60 lbs → 80 lbs progression over 60 days
- Should calculate +20 lbs gain (33.3% increase)

✅ **"How's my squat progress?"**
- Should show 135 lbs → 155 lbs progression
- Should calculate +20 lbs gain

✅ **"What should I eat today?"**
- Should reference your nutrition history
- Should suggest foods based on your typical intake

✅ **"Am I hitting my protein goals?"**
- Should analyze last 30 days of nutrition
- Should show average protein intake

✅ **"What workout should I do next?"**
- Should note 4 days rest since last workout
- Should suggest progressive overload on 80 lbs bench PR

## Data Structure

The mock data follows your app's data structure:

**Workouts**:
```javascript
{
  id: string,
  date: "YYYY-MM-DD",
  name: string,
  exercises: [
    {
      name: string,
      sets: [{ weight: number, reps: number, completed: boolean }]
    }
  ],
  duration: number,
  synced: boolean
}
```

**Nutrition**:
```javascript
{
  "YYYY-MM-DD": [
    {
      id: string,
      name: string,
      protein: number,
      carbs: number,
      fat: number,
      calories: number,
      timestamp: ISO string
    }
  ]
}
```

## Progression Chart

```
Dumbbell Bench Press Progress:
60 lbs ████░░░░░░░░ (60 days ago)
65 lbs █████░░░░░░░ (53 days ago)
70 lbs ███████░░░░░ (45 days ago)
75 lbs █████████░░░ (30 days ago)
75 lbs █████████░░░ (14 days ago)
80 lbs ███████████░ (7 days ago)
80 lbs ███████████░ (4 days ago) ⭐ CURRENT PR
```

Target: 90-95 lbs (next milestone)
