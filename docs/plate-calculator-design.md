# Plate Calculator Feature - Design Document

## Overview
A visual plate calculator that shows users exactly which plates to load on each side of a barbell when they enter a weight. This helps users quickly set up their barbell without mental math, especially important for exercises like Bench Press, Squat, Deadlift, etc.

## User Experience Flow

### 1. When to Show the Plate Calculator
- Display when the exercise equipment includes "barbell"
- Show as an optional visual aid below or next to the weight input
- Can be toggled on/off per user preference (default: on for barbell exercises)

### 2. Visual Design Options

#### Option A: Inline Visual (Recommended)
```
Weight Input: [225] lbs
Plates per side: 🔴 45 🔵 25 ⚫ 5
```

#### Option B: Modal/Expandable View
```
Weight Input: [225] lbs  [🏋️ Show Plates]
→ Opens modal showing visual barbell with plates
```

#### Option C: Always-On Compact View
```
[Weight] [Reps] [RPE]
  225      8      7
  ━━━━━━━━━
  45|25|5  (per side)
```

## Technical Implementation

### 1. Plate Calculator Logic

**Standard Barbell**: 45 lbs (20 kg metric)
**Available Plates** (in lbs):
- 45 lbs (Red) - 🔴
- 35 lbs (Yellow/Blue) - 🟡
- 25 lbs (Green) - 🟢
- 10 lbs (Blue) - 🔵
- 5 lbs (Red) - 🔴
- 2.5 lbs (Small) - ⚫

**Algorithm**:
1. Subtract bar weight (45 lbs) from total weight
2. Divide remainder by 2 (for each side)
3. Greedily select largest plates that fit
4. Return array of plates per side

**Example**:
- Input: 225 lbs total
- After bar: 225 - 45 = 180 lbs
- Per side: 180 / 2 = 90 lbs
- Plates: 1x45 + 1x25 + 1x10 + 1x5 + 1x2.5 = 87.5 ❌
- Plates: 2x45 = 90 ✓
- Display: "2 × 45 lbs per side"

### 2. User Preferences

Store in AsyncStorage:
```javascript
{
  plateCalculator: {
    enabled: true,
    barWeight: 45, // Can be 35 for women's bar, 45 for standard, 55 for specialty
    availablePlates: [45, 35, 25, 10, 5, 2.5], // User's gym might not have all
    displayStyle: 'inline' // 'inline', 'modal', 'compact'
  }
}
```

### 3. Component Structure

#### New Component: `PlateCalculator.js`
```javascript
Props:
- weight: number (total weight including bar)
- barWeight: number (default 45)
- availablePlates: array (default [45, 35, 25, 10, 5, 2.5])
- displayStyle: string ('inline', 'modal', 'compact')
- onChange: function (called when user adjusts via calculator)
```

#### Integration Points:
1. **WorkoutScreen.js** - Add below weight input for barbell exercises
2. **ExerciseDetailScreen.js** - Show in history/previous sets section
3. **Settings** - Add plate calculator preferences

### 4. Database Schema Updates

**Exercise Equipment Detection**:
- Already exists: `exercise.equipment` field
- Check if includes "barbell" case-insensitive
- For compound movements (Bench Press variants, Squats, Deadlifts, etc.)

**User Settings**:
```javascript
// Add to user profile or workout settings
userSettings: {
  plateCalculator: {
    enabled: true,
    preferredBarWeight: 45,
    customPlates: [45, 35, 25, 10, 5, 2.5],
    showInWorkout: true,
    showInHistory: true
  }
}
```

## Feature Enhancements (Future)

### Phase 1 (MVP - Current Plan)
- ✓ Basic plate calculation algorithm
- ✓ Visual display for barbell exercises
- ✓ Standard Olympic plates (45, 25, 10, 5, 2.5)
- ✓ Standard 45lb bar

### Phase 2 (Enhanced)
- □ Multiple bar weights (45lb men's, 35lb women's, 55lb specialty)
- □ Metric support (20kg bar, metric plates)
- □ Custom plate availability per gym
- □ Plate calculator as weight picker (tap plates to add/remove)
- □ Save custom bars (Safety Squat Bar, Trap Bar, etc.)

### Phase 3 (Advanced)
- □ Visual 3D barbell representation
- □ Asymmetric loading warnings
- □ Weight validation (check if possible with available plates)
- □ Progressive overload suggestions based on available increments
- □ Training max calculator integration

## UI Mockup

### Inline View (Recommended for MVP)
```
┌─────────────────────────────────────┐
│ Bench Press (Barbell)               │
│                                     │
│ Set 1  [225] lbs  [8] reps  [7] RPE│
│        └─ 🏋️ 2×45 + 1×25 per side  │
│                                     │
│ Set 2  [225] lbs  [8] reps          │
│        └─ 🏋️ 2×45 + 1×25 per side  │
└─────────────────────────────────────┘
```

### Compact Icon View
```
┌─────────────────────────────────────┐
│ Set 1  [🏋️] [225] [8] [7]          │
│        Tap 🏋️ to see plate breakdown│
└─────────────────────────────────────┘
```

## Implementation Checklist

### Step 1: Core Algorithm (Utils)
- [ ] Create `src/utils/plateCalculator.js`
- [ ] Implement `calculatePlates(totalWeight, barWeight, availablePlates)`
- [ ] Unit tests for edge cases (impossible weights, fractional weights)
- [ ] Handle metric/imperial conversions

### Step 2: Component Creation
- [ ] Create `src/components/PlateCalculator.js`
- [ ] Implement inline display style
- [ ] Add plate color coding (visual indicators)
- [ ] Make component responsive and accessible

### Step 3: Integration
- [ ] Detect barbell exercises in `WorkoutScreen.js`
- [ ] Add PlateCalculator component below weight input
- [ ] Only show for barbell exercises
- [ ] Add toggle to hide/show per user preference

### Step 4: Settings & Preferences
- [ ] Add settings screen section for plate calculator
- [ ] Allow customization of bar weight
- [ ] Allow customization of available plates
- [ ] Persist preferences in AsyncStorage

### Step 5: Polish & Testing
- [ ] Test with various barbell exercises
- [ ] Ensure works with imperial (lbs) and metric (kg)
- [ ] Add animations/transitions for better UX
- [ ] User testing and feedback

## Edge Cases to Handle

1. **Weight impossible with available plates**: Show "Cannot load this weight with available plates"
2. **Weight less than bar weight**: Show warning or disable plate calculator
3. **Fractional weights**: Round to nearest possible weight with available plates
4. **Custom bars**: Allow user to specify bar weight (35, 45, 55 lbs)
5. **No barbell detected**: Don't show calculator for dumbbells, machines, etc.
6. **Metric/Imperial**: Support both unit systems with appropriate conversions

## Success Metrics

1. Reduced time to set up barbell exercises
2. User adoption rate (% of users who enable/use feature)
3. Accuracy of plate calculations
4. User feedback on helpfulness

## Technical Considerations

- **Performance**: Calculation should be instant (< 10ms)
- **Accessibility**: Use text + icons for color-blind users
- **i18n**: Support for metric/imperial units
- **State Management**: Integrate with existing workout context
- **Error Handling**: Graceful degradation if calculation fails
