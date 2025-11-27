# Plan: Visual Plate/Bar Weight Representation

## Overview
Implement a visual representation of weight for barbell and plate-based exercises that shows:
- The bar type and its weight
- The plates loaded on each side
- Real-time updates as weight is changed

## Visual Concept
```
┌─────────────────────────────────────────────────────────┐
│  [45] [25] [10] ═══════════════════ [10] [25] [45]     │
│                    Olympic Bar                          │
│                      45 lbs                             │
│                                                         │
│              Total: 225 lbs                             │
└─────────────────────────────────────────────────────────┘
```

Each plate shown as a colored circle/rectangle with weight labeled.

---

## Exercises That Will Have This Feature

### CHEST (4 exercises, 6 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Bench Press | Barbell | Olympic | 45 lbs |
| Bench Press | Smith Machine | Smith | 15-25 lbs |
| Incline Bench Press | Barbell | Olympic | 45 lbs |
| Incline Bench Press | Smith Machine | Smith | 15-25 lbs |
| Decline Bench Press | Barbell | Olympic | 45 lbs |
| Decline Bench Press | Smith Machine | Smith | 15-25 lbs |

### BACK (3 exercises, 4 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| T-Bar Row | T-Bar Machine | T-Bar | 0 lbs (just plates) |
| T-Bar Row | Landmine Barbell | Olympic | 45 lbs |
| Weighted Pull Ups | Dip Belt with Plates | N/A (plates only) | 0 lbs |

### SHOULDERS (3 exercises, 5 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Shoulder Press | Barbell | Olympic | 45 lbs |
| Shoulder Press | Smith Machine | Smith | 15-25 lbs |
| Shrugs | Barbell | Olympic | 45 lbs |
| Shrugs | Smith Machine | Smith | 15-25 lbs |
| Upright Row | Barbell | Olympic | 45 lbs |

### BICEPS (5 exercises, 7 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Bicep Curl | Barbell | Olympic/Standard | 45/20 lbs |
| Bicep Curl | EZ Bar | EZ Curl | 15-25 lbs |
| Preacher Curl | EZ Bar | EZ Curl | 15-25 lbs |
| Reverse Curl | Barbell | Olympic | 45 lbs |
| Reverse Curl | EZ Bar | EZ Curl | 15-25 lbs |
| Spider Curl | EZ Bar | EZ Curl | 15-25 lbs |

### TRICEPS (3 exercises, 5 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Overhead Tricep Extension | EZ Bar | EZ Curl | 15-25 lbs |
| Skull Crusher | EZ Bar | EZ Curl | 15-25 lbs |
| Skull Crusher | Barbell | Olympic | 45 lbs |
| Close Grip Bench Press | Barbell | Olympic | 45 lbs |
| Close Grip Bench Press | Smith Machine | Smith | 15-25 lbs |

### LEGS (10 exercises, 15 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Standing Calf Raise | Barbell | Olympic | 45 lbs |
| Standing Calf Raise | Smith Machine | Smith | 15-25 lbs |
| Squat | Barbell Back | Olympic | 45 lbs |
| Squat | Smith Machine | Smith | 15-25 lbs |
| Hang Clean | Barbell | Olympic | 45 lbs |
| Hip Thrust | Barbell | Olympic | 45 lbs |
| Hack Squat | Barbell Reverse | Olympic | 45 lbs |
| Lunges | Barbell Walking | Olympic | 45 lbs |
| Deadlift | Barbell Conventional | Olympic | 45 lbs |
| Deadlift | Barbell Sumo | Olympic | 45 lbs |
| Deadlift | Trap Bar | Trap/Hex | 45-60 lbs |
| Deadlift | Barbell Romanian | Olympic | 45 lbs |
| Bulgarian Split Squat | Barbell | Olympic | 45 lbs |
| Front Squat | Barbell | Olympic | 45 lbs |
| Front Squat | Smith Machine | Smith | 15-25 lbs |
| Step-Ups | Barbell | Olympic | 45 lbs |
| Glute Bridge | Barbell | Olympic | 45 lbs |
| Romanian Deadlift | Barbell | Olympic | 45 lbs |

### ABS (1 exercise, 1 variant)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Ab Wheel Rollout | Barbell Rollout | Olympic | 45 lbs |

### FOREARMS (2 exercises, 4 variants)
| Exercise | Variant | Bar Type | Bar Weight |
|----------|---------|----------|------------|
| Wrist Curl | Barbell | Olympic/Standard | 45/20 lbs |
| Reverse Wrist Curl | Barbell | Olympic | 45 lbs |
| Reverse Wrist Curl | EZ Bar | EZ Curl | 15-25 lbs |
| Farmer's Walk | Trap Bar | Trap/Hex | 45-60 lbs |

---

## TOTAL: 31 exercises with 47 barbell/plate variants

---

## Bar Types & Standard Weights

| Bar Type | Weight (lbs) | Weight (kg) | Color Code |
|----------|--------------|-------------|------------|
| Olympic Barbell | 45 | 20 | Silver/Chrome |
| Women's Olympic | 35 | 15 | Silver/Chrome |
| Standard Barbell | 20 | 9 | Silver |
| EZ Curl Bar | 15-25 | 7-11 | Silver |
| Smith Machine Bar | 15-25 | 7-11 | Gray |
| Trap/Hex Bar | 45-60 | 20-27 | Black |
| T-Bar (plates only) | 0 | 0 | N/A |

## Standard Plate Weights & Colors (Olympic)

| Weight (lbs) | Weight (kg) | Color | Size |
|--------------|-------------|-------|------|
| 55 | 25 | Red | XL |
| 45 | 20 | Blue | Large |
| 35 | 15 | Yellow | Medium-Large |
| 25 | 10 | Green | Medium |
| 10 | 5 | White | Small |
| 5 | 2.5 | Red | X-Small |
| 2.5 | 1.25 | Green | XX-Small |

---

## Implementation Plan

### Phase 1: Core Component Development

#### 1.1 Create PlateVisualization Component
**File:** `src/components/PlateVisualization.js`

```javascript
// Props:
// - totalWeight: number (total weight entered by user)
// - barType: 'olympic' | 'ez' | 'smith' | 'trap' | 'standard' | 'tbar'
// - unit: 'lbs' | 'kg'
// - compact: boolean (for inline display vs expanded)
```

Features:
- Calculate plates needed per side
- Render visual bar with plates
- Support different bar types
- Handle edge cases (odd weights, minimums)

#### 1.2 Create PlateCalculator Utility
**File:** `src/utils/plateCalculator.js`

Functions:
- `calculatePlates(totalWeight, barWeight, availablePlates)` → plate array
- `getBarWeight(barType)` → number
- `formatPlateDisplay(plates)` → display array
- `validateWeight(weight, barType)` → boolean (is weight achievable?)

#### 1.3 Create Plate/Bar Constants
**File:** `src/constants/weightEquipment.js`

Define:
- Bar types and weights
- Plate weights and colors
- Default available plates
- Exercise-to-bar-type mapping

### Phase 2: Integration

#### 2.1 Update ExerciseCard in WorkoutScreen
- Detect if exercise uses barbell/plates
- Add PlateVisualization below weight input
- Update visualization on weight change

#### 2.2 Add Bar Type Detection
- Map exercise + equipment variant to bar type
- Handle Smith Machine variable weight
- Support user customization (future)

### Phase 3: Polish

#### 3.1 Visual Enhancements
- Animate plates appearing/disappearing
- Color-coded plates matching gym standards
- Compact mode for set rows

#### 3.2 User Settings (Optional/Future)
- Available plates in user's gym
- Default bar weights (Smith machines vary)
- Unit preference (lbs/kg)
- Bar type preference per exercise

---

## File Changes Required

### New Files
1. `src/components/PlateVisualization.js` - Main visualization component
2. `src/utils/plateCalculator.js` - Weight calculation logic
3. `src/constants/weightEquipment.js` - Bar/plate constants

### Modified Files
1. `src/screens/WorkoutScreen.js` - Integrate visualization into ExerciseCard
2. `src/data/exerciseDatabase.js` - Add barType field to relevant exercises (optional)

---

## Component Design

### PlateVisualization (Compact Mode - for set rows)
```
[10][25][45] ══════ [45][25][10]  Bar: 45 lbs
```

### PlateVisualization (Expanded Mode - for exercise detail)
```
┌────────────────────────────────────────────┐
│                                            │
│   ●  ●  ●  ══════════════════  ●  ●  ●    │
│  10 25 45        BAR          45 25 10    │
│                                            │
│         Olympic Barbell: 45 lbs            │
│         Plates per side: 45+25+10          │
│         ─────────────────────              │
│         Total Weight: 225 lbs              │
└────────────────────────────────────────────┘
```

### Plate Colors (React Native styles)
```javascript
const PLATE_COLORS = {
  55: '#E53935',  // Red
  45: '#1E88E5',  // Blue
  35: '#FDD835',  // Yellow
  25: '#43A047',  // Green
  10: '#FFFFFF',  // White
  5:  '#E53935',  // Red (small)
  2.5: '#43A047', // Green (small)
};
```

---

## Algorithm: Plate Calculation

```javascript
function calculatePlates(totalWeight, barWeight, availablePlates = [45, 35, 25, 10, 5, 2.5]) {
  const weightPerSide = (totalWeight - barWeight) / 2;

  if (weightPerSide < 0) {
    return { error: 'Weight less than bar', plates: [] };
  }

  const plates = [];
  let remaining = weightPerSide;

  // Sort plates descending
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }

  if (remaining > 0) {
    return {
      error: 'Cannot make exact weight with available plates',
      plates,
      remainder: remaining
    };
  }

  return { plates, perSide: plates };
}
```

---

## UI/UX Considerations

1. **Show only for barbell exercises** - Don't clutter dumbbell/cable/machine exercises
2. **Collapse by default** - Can expand to see full visualization
3. **Quick glance info** - Show plate summary inline: "45+25+10 per side"
4. **Error handling** - Show warning if weight can't be achieved with standard plates
5. **Performance** - Memoize calculations, only recalculate on weight change

---

## Future Enhancements (Out of Scope for V1)

- [ ] Custom gym plate inventory
- [ ] Metric/Imperial toggle
- [ ] Bar weight customization per exercise
- [ ] Plate loading order suggestions
- [ ] Integration with exercise history to suggest weight
- [ ] AR visualization (camera overlay)
