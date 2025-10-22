# AI Button-Based Interface Integration Guide

## Overview
This guide explains how to integrate the new button-based AI interface into existing screens.

## Components Created

### 1. **AIActionButton** (`src/components/AIActionButton.js`)
- Reusable button component with beautiful gradient chip design
- Reuses the design from QuickSuggestions.js
- Supports variants: `primary`, `secondary`, `back`
- Supports sizes: `small`, `medium`, `large`
- Built-in loading and disabled states

### 2. **AIButtonSection** (`src/components/AIButtonSection.js`)
- Collapsible accordion section
- Contains grid of AIActionButton components
- Animated expand/collapse with chevron rotation
- Displays badge with button count

### 3. **AISectionPanel** (`src/components/AISectionPanel.js`)
- Main container component for AI sections
- Automatically loads sections based on screen name
- Handles AI requests with context
- Displays AI responses
- Shows loading states

### 4. **aiSectionConfig.js** (`src/config/aiSectionConfig.js`)
- Configuration file mapping screens to AI sections
- Includes tool mappings for each button
- Easy to extend with new screens/sections

## Integration Steps

### Quick Integration (Easiest)

Add to any screen with just 2 lines:

```javascript
import AISectionPanel from '../components/AISectionPanel';

// Inside your screen component's return statement:
<AISectionPanel
  screenName="WorkoutScreen"
  onResponse={(response) => console.log('AI:', response)}
/>
```

### Example: WorkoutScreen Integration

**File:** `src/screens/WorkoutScreen.js`

**Step 1:** Add import at the top
```javascript
import AISectionPanel from '../components/AISectionPanel';
```

**Step 2:** Add the panel in the render (around line 1395, after Rest Timer Card)

```javascript
return (
  <>
    <ScreenLayout
      title={<WorkoutStatsHeader />}
      // ... other props
    >
      {/* Rest Timer Card */}
      <View style={styles.restTimerCard}>
        {/* ... existing rest timer code ... */}
      </View>

      {/* 🆕 AI COACH SECTION - ADD THIS */}
      <AISectionPanel
        screenName="WorkoutScreen"
        onResponse={(response, button) => {
          // Optional: Handle AI responses
          console.log('AI Response:', response);
          console.log('Button pressed:', button.text);
        }}
        defaultExpandFirst={false}
        containerStyle={{ marginBottom: Spacing.lg }}
      />

      {/* All Workout Exercises */}
      <View style={styles.section}>
        {/* ... existing exercises ... */}
      </View>
```

### Example: NutritionScreen Integration

**File:** `src/screens/NutritionScreen.js` (or similar)

```javascript
import AISectionPanel from '../components/AISectionPanel';

// In your render:
<ScrollView>
  {/* Existing nutrition content */}

  <AISectionPanel
    screenName="NutritionScreen"
    onResponse={(response) => {
      // Could show response in a toast or modal
      Alert.alert('AI Coach', response);
    }}
    showHeader={true}
  />
</ScrollView>
```

## Available Screens with AI Sections

The following screens have pre-configured AI sections:

### Workout Screens
- `WorkoutScreen` - Set recommendations, exercise management, workout insights
- `StartWorkoutScreen` - Create workout, recommendations, exercise search
- `WorkoutHistoryScreen` - Workout analysis, planning
- `ExerciseDetailScreen` - Exercise progress, guidance
- `TodayWorkoutOptionsScreen`
- `PlannedWorkoutDetailScreen`

### Nutrition Screens
- `NutritionScreen` - Daily tracking, meal suggestions, macro calculations
- `NutritionDashboard`
- `FoodScanResultScreen` - Food analysis, meal planning
- `RecipesScreen` - Recipe suggestions

### Progress Screens
- `ProgressScreen` - Progress analysis, goal tracking
- `ProgressHubScreen`

### Home Screen
- `HomeScreen` - Quick actions, recent activity

## Adding New Screens

To add AI sections to a new screen:

**1. Update `aiSectionConfig.js`:**

```javascript
export const MyNewScreenSections = [
  {
    title: 'Section Title',
    icon: 'fitness', // ionicon name
    buttons: [
      {
        icon: 'barbell',
        text: 'Button text',
        toolName: 'aiToolName', // optional
        params: { /* optional tool params */ }
      },
      // ... more buttons
    ],
  },
  // ... more sections
];

// Add to AI_SECTION_CONFIG mapping
export const AI_SECTION_CONFIG = {
  // ... existing
  MyNewScreen: MyNewScreenSections,
};
```

**2. Add AISectionPanel to your screen:**

```javascript
<AISectionPanel screenName="MyNewScreen" />
```

## Props Reference

### AISectionPanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `screenName` | string | required | Name of the screen (must match config) |
| `onResponse` | function | optional | Callback when AI responds: `(response, button) => {}` |
| `containerStyle` | object | optional | Custom container styles |
| `showHeader` | boolean | true | Show "🤖 AI Coach" header |
| `defaultExpandFirst` | boolean | false | Auto-expand first section |

### AIButtonSection Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Section title |
| `icon` | string | required | Ionicon name |
| `buttons` | array | required | Array of button objects |
| `onButtonPress` | function | required | Button press handler |
| `defaultExpanded` | boolean | false | Start expanded |
| `loading` | boolean | false | Show loading state |
| `emptyMessage` | string | 'No actions available' | Message when no buttons |

### AIActionButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | required | Ionicon name |
| `text` | string | required | Button text |
| `onPress` | function | required | Press handler |
| `variant` | string | 'primary' | `'primary'` \| `'secondary'` \| `'back'` |
| `loading` | boolean | false | Show loading spinner |
| `disabled` | boolean | false | Disable button |
| `size` | string | 'medium' | `'small'` \| `'medium'` \| `'large'` |

## How It Works

### 1. Button Press Flow

```
User taps button
  ↓
AISectionPanel.handleButtonPress()
  ↓
Build context via ContextManager.buildContextForScreen()
  ↓
Send button.text to AIService.sendMessageWithTools()
  ↓
AI processes request + calls appropriate tools
  ↓
Response returned and displayed
  ↓
onResponse callback fired (if provided)
```

### 2. Context System

The system automatically provides the AI with:
- Current screen name
- User profile (goals, age, gender, etc.)
- Recent activity (workouts, meals, etc.)
- Screen-specific context (current workout, nutrition data, etc.)
- Exercise-specific data (for exercise screens)

### 3. Tool Execution

Buttons can optionally specify a `toolName` to hint which AI tool should be used:
- `generateWorkoutPlan` - Create workout plans
- `searchExercises` - Find exercises
- `calculateMacros` - Calculate nutrition macros
- `recommendWorkout` - Suggest workouts
- `analyzeProgress` - Analyze user progress
- etc.

## Design Philosophy

### Static vs Dynamic Content
- ✅ **Sections are static** - Pre-defined in config, not context-aware
- ✅ **Requests are generic** - Work for all users
- ❌ **Avoid dynamic generation** - Prevents bugs from AI hallucination

### Why Button-Based?
- **Discoverability** - Users see all available actions
- **Consistency** - Predictable, organized interface
- **Speed** - No typing required
- **Mobile-first** - Optimized for touch interaction

### AIScreen Exception
- **AIScreen (home)** remains text-based chat interface
- All other screens use button-based interface
- AIScreen is read-only (can't create/modify data)

## Styling & Theming

All components use the existing theme system:
- `Colors` - From `src/constants/theme`
- `Spacing` - Consistent spacing values
- `Typography` - Font sizes and weights
- `BorderRadius` - Rounded corners

Components automatically adapt to your app's theme.

## Testing

To test the integration:

1. **Add to a screen** (e.g., WorkoutScreen)
2. **Run the app** and navigate to that screen
3. **Expand a section** - Tap the section header
4. **Tap a button** - Should show loading, then response
5. **Check console** - See AI interaction logs

## Troubleshooting

### "No sections appear"
- Check `screenName` prop matches a key in `AI_SECTION_CONFIG`
- Verify `aiSectionConfig.js` exports the screen config

### "Buttons don't respond"
- Check AIService.js is working
- Verify user is authenticated (for context)
- Check console for errors

### "Response not showing"
- Verify `onResponse` callback is being called
- Check if AI response is empty
- Look for errors in AIService

## Next Steps

1. **Start with WorkoutScreen** - Most complex, best showcase
2. **Add to NutritionScreen** - Second priority
3. **Progressively add to other screens**
4. **Remove old AIHeaderButton** - Replace with AISectionPanel
5. **Update AIScreen** - Keep as chat-only (per requirements)

## Code Reuse

The following existing components are **reused** (not duplicated):
- ✅ `ContextManager` - Context gathering
- ✅ `AIService` - AI communication
- ✅ `useAITracking` - Screen tracking hook
- ✅ QuickSuggestions chip design - Adapted to AIActionButton

## Benefits

- **✅ No duplicate code** - Reuses existing services
- **✅ Consistent UX** - Same look across all screens
- **✅ Easy to maintain** - Config-driven approach
- **✅ Type-safe** - Clear props and structure
- **✅ Extensible** - Easy to add new screens/sections
- **✅ Mobile-optimized** - Touch-friendly button interface

---

*Generated as part of the AI interface redesign*
