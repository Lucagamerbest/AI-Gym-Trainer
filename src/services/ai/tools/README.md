# AI Tool System - Function Calling Architecture

## Overview

The AI Tool System enables the Gemini AI to use **functions/tools** to perform complex tasks like generating workout plans, searching exercises, calculating macros, and analyzing user data.

This is a **major upgrade** from the simple question-answer AI - now the AI can:
- 🏋️ Generate complete workout plans
- 🔍 Search and recommend exercises
- 🧮 Calculate personalized nutrition macros
- 📊 Analyze workout history and trends
- 💡 Make data-driven recommendations

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                   User Query                        │
│        "Create a push workout for me"               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              AIService.sendMessageWithTools()       │
│   • Sends message to Gemini with tool schemas       │
│   • Model decides if it needs to call a function    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Gemini Function Call Response               │
│   {                                                 │
│     name: "generateWorkoutPlan",                    │
│     args: {                                         │
│       muscleGroups: ["chest", "triceps"],           │
│       duration: 60,                                 │
│       goal: "hypertrophy"                           │
│     }                                               │
│   }                                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              ToolRegistry.executeTool()             │
│   • Finds the tool handler                          │
│   • Executes the function with args                 │
│   • Returns result                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Tool Result Sent Back to AI                │
│   {                                                 │
│     success: true,                                  │
│     workout: {                                      │
│       title: "Chest + Triceps Hypertrophy",         │
│       exercises: [...]                              │
│     }                                               │
│   }                                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              AI Final Response                      │
│   "I've created a 60-minute push workout...         │
│    1. Barbell Bench Press - 4x8-12                  │
│    2. Incline Dumbbell Press - 4x8-12               │
│    ..."                                             │
└─────────────────────────────────────────────────────┘
```

---

## Available Tools

### Workout Tools

#### 1. `generateWorkoutPlan`
Generate a complete workout plan based on user preferences.

**When to use:** User asks to create/plan/generate a workout

**Parameters:**
- `muscleGroups` (array): Target muscles (e.g., ["chest", "triceps"])
- `experienceLevel` (string): beginner | intermediate | advanced
- `duration` (number): Workout duration in minutes
- `goal` (string): strength | hypertrophy | endurance | general
- `equipment` (array): Available equipment

**Example queries:**
- "Create a chest and tricep workout"
- "Plan a 45-minute leg day for hypertrophy"
- "Generate a full body workout for beginners"

#### 2. `findExerciseAlternatives`
Find alternative exercises for the same muscle group.

**When to use:** User asks for substitutes or alternatives

**Example queries:**
- "What can I do instead of bench press?"
- "Find an alternative to barbell squats"

#### 3. `analyzeWorkoutHistory`
Analyze user workout patterns and frequency.

**When to use:** User asks about their training history

**Example queries:**
- "How often do I train?"
- "What muscle groups am I neglecting?"

---

### Exercise Tools

#### 4. `searchExercises`
Search exercises by name, muscle, or equipment.

**Example queries:**
- "Show me chest exercises"
- "What dumbbell exercises can I do?"
- "Find beginner back exercises"

#### 5. `getExerciseInfo`
Get detailed form instructions for an exercise.

**Example queries:**
- "How do I do a deadlift?"
- "Show me proper bench press form"

#### 6. `getExerciseStats`
Get user's personal records and history for an exercise.

**Example queries:**
- "What's my bench press PR?"
- "Show my squat progress"

#### 7. `recommendExercises`
Recommend new exercises based on training gaps.

**Example queries:**
- "What exercises should I try?"
- "Recommend something new for back"

---

### Nutrition Tools

#### 8. `calculateMacros`
Calculate recommended daily macros based on user stats.

**Parameters:**
- `weight` (kg), `height` (cm), `age`, `gender`
- `activityLevel`: sedentary | light | moderate | active | veryActive
- `goal`: cut | bulk | maintain | weight_loss | muscle_gain

**Example queries:**
- "Calculate my macros for cutting"
- "How many calories should I eat to bulk?"

#### 9. `getNutritionStatus`
Get current nutrition status for today.

**Example queries:**
- "How are my macros today?"
- "Am I hitting my protein goal?"

#### 10. `suggestMealsForMacros`
Suggest meals that fit specific macro targets.

**Example queries:**
- "What should I eat to hit my remaining protein?"
- "Suggest a 500 calorie meal with 40g protein"

#### 11. `calculateMealMacros`
Calculate total macros from ingredients.

**Example queries:**
- "Calculate macros for chicken breast and rice"

---

## How It Works

### 1. Tool Registration
Tools are registered in `src/services/ai/tools/index.js`:

```javascript
import ToolRegistry from './ToolRegistry';

ToolRegistry.registerTool(
  'generateWorkoutPlan',  // Tool name
  workoutToolSchema,      // Gemini function schema
  generateWorkoutPlan     // Handler function
);
```

### 2. AI Decides to Use Tool
When user asks "Create a push workout", the AI:
1. Analyzes the request
2. Determines `generateWorkoutPlan` is the best tool
3. Extracts parameters from user message
4. Calls the function

### 3. Tool Execution
```javascript
const result = await ToolRegistry.executeTool('generateWorkoutPlan', {
  muscleGroups: ['chest', 'triceps'],
  duration: 60,
  goal: 'hypertrophy',
  experienceLevel: 'intermediate'
});
```

### 4. AI Uses Result
The AI receives the workout plan and formats it nicely for the user.

---

## Adding New Tools

Want to add a new tool? Follow these steps:

### Step 1: Create Tool Function

```javascript
// src/services/ai/tools/MyNewTool.js

export async function myNewTool({ param1, param2 }) {
  try {
    // Your logic here
    const result = doSomething(param1, param2);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Step 2: Define Schema

```javascript
export const myNewToolSchema = {
  name: 'myNewTool',
  description: 'What this tool does and when to use it',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'What param1 is for'
      },
      param2: {
        type: 'number',
        description: 'What param2 is for'
      }
    },
    required: ['param1']
  }
};
```

### Step 3: Register Tool

```javascript
// src/services/ai/tools/index.js

import { myNewTool, myNewToolSchema } from './MyNewTool';

ToolRegistry.registerTool('myNewTool', myNewToolSchema, myNewTool);
```

---

## Testing

### Manual Testing
Open the AI chat and try:

```
"Create a chest and back workout for me"
"Calculate my macros for cutting"
"Find exercises for legs with dumbbells"
"What's my deadlift PR?"
"Recommend new exercises for me"
```

Check the console logs for:
- `🔧 Executing tool: [toolName]`
- `✅ Function [toolName] completed`
- `🔧 Tools used: X`

### Automatic Tool Selection
The AI automatically decides when to use tools. You don't need to explicitly tell it!

**Smart routing:**
- "Create a workout" → Uses `generateWorkoutPlan`
- "What's my max?" → Simple query, no tool needed
- "Find leg exercises" → Uses `searchExercises`

---

## Performance

**Tool-based responses:**
- More accurate (uses real data)
- Longer (2-3 seconds vs 0.5 seconds)
- More comprehensive

**Simple responses:**
- Faster (< 1 second)
- Good for quick questions
- Uses existing intent system

The system automatically routes complex queries to tools and simple queries to fast responses.

---

## Future Enhancements

Planned improvements:
- [ ] Multi-agent specialization (Coach, Nutritionist, Analyst agents)
- [ ] Long-term memory (remember user preferences)
- [ ] Conversational context (follow-up questions)
- [ ] More tools (form analysis, injury prevention, etc.)
- [ ] Tool chaining (use multiple tools in sequence)

---

## Technical Details

**Model:** Gemini 2.5 Flash (supports function calling)

**Max function calls per conversation:** 3 (to prevent loops)

**Tool registry:** Singleton pattern for global tool access

**Error handling:** Tools return structured errors, AI explains to user

---

## Troubleshooting

**Tool not being called?**
- Check tool schema description is clear
- Ensure user query matches tool use case
- Look for console logs showing function call

**Tool execution fails?**
- Check function implementation for errors
- Verify all required parameters are provided
- Look for error messages in console

**AI gives wrong response?**
- Tool may have returned unexpected data
- Check tool result structure matches schema
- Update tool description to be more specific

---

## Summary

You've just built a **professional-grade AI agent system** with:
✅ 11 powerful tools
✅ Automatic tool selection
✅ Multi-turn function calling
✅ Error handling
✅ Extensible architecture

**The AI can now:**
- Generate complete workout plans
- Search and recommend exercises
- Calculate nutrition macros
- Analyze user data
- Make personalized recommendations

This is a **foundation for even more advanced features** like multi-agent systems, memory, and autonomous planning!
