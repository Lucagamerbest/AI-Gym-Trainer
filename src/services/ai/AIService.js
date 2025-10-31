import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectIntent, executeAction } from './AIActions';
import { initializeTools, ToolRegistry } from './tools';
import AIDebugger, { ERROR_CATEGORIES } from './AIDebugger';

class AIService {
  constructor() {
    // Initialize with API key - we'll get this from environment or config
    this.apiKey = null;
    this.genAI = null;
    this.model = null;
    this.modelWithTools = null; // Model with function calling enabled
    // Using Gemini 2.5 Flash (now optimized with smaller prompts for speed)
    this.modelName = 'gemini-2.5-flash';
    this.toolsEnabled = true; // Enable function calling by default
  }

  // Initialize the AI service with API key
  initialize(apiKey) {
    if (!apiKey) {
      console.error('❌ No API key provided for Gemini');
      throw new Error('Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Initialize base model (for simple queries)
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });

    // Initialize tools
    initializeTools();

    // Initialize model with function calling
    const tools = ToolRegistry.getToolSchemas();
    this.modelWithTools = this.genAI.getGenerativeModel({
      model: this.modelName,
      tools: [{ functionDeclarations: tools }],
    });

    console.log(`✅ AI Service initialized with ${ToolRegistry.getToolCount()} tools`);
  }

  // Check if service is initialized
  isInitialized() {
    return this.model !== null;
  }

  // Send message to AI
  async sendMessage(userMessage, context = {}) {
    try {
      if (!this.isInitialized()) {
        throw new Error('AI Service not initialized. Call initialize() first.');
      }

      // Step 1: Detect if user wants to DO something (intent detection)
      const intentResult = detectIntent(userMessage, context.screen);

      // Step 2: Execute action if detected
      let actionResult = null;
      if (intentResult.intent !== 'ANSWER_QUESTION') {
        actionResult = await executeAction(intentResult.intent, intentResult.parameters, context);

        // If action was successful, return the action message directly
        if (actionResult && actionResult.success) {
          return {
            response: actionResult.message,
            model: this.modelName,
            action: actionResult.action,
            actionData: actionResult.data,
            estimatedTokens: 50, // Actions don't use AI tokens
          };
        }
      }

      // Step 3: If no action or action failed, use AI to answer
      const systemPrompt = this.buildSystemPrompt(context);

      // Add response length instruction based on screen
      let lengthInstruction = '\n\n🚨 RESPOND IN 1 SENTENCE. No extra context unless asked.';
      if (context.screen === 'WorkoutScreen' || context.screen === 'StartWorkoutScreen') {
        lengthInstruction = '\n\n🚨 User is training. 1 SENTENCE: just the weight recommendation.';
      }

      // Combine system prompt and user message
      const fullPrompt = `${systemPrompt}${lengthInstruction}\n\nUser: ${userMessage}`;

      const result = await this.model.generateContent(fullPrompt, {
        generationConfig: {
          maxOutputTokens: 1000, // Increased: Allow detailed responses without cutoff
          temperature: 0.4, // Lower = faster, more deterministic
          topP: 0.9,
          topK: 20, // Lower = faster
        },
      });
      const response = result.response;
      const responseText = response.text();

      return {
        response: responseText,
        model: this.modelName,
        // Gemini doesn't provide token usage in the same way, but we can estimate
        estimatedTokens: Math.ceil((fullPrompt.length + responseText.length) / 4),
      };
    } catch (error) {
      console.error('❌ AI service error:', error);
      throw error;
    }
  }

  // Send message with conversation history
  async sendMessageWithHistory(messages, context = {}) {
    try {
      if (!this.isInitialized()) {
        throw new Error('AI Service not initialized. Call initialize() first.');
      }



      const systemPrompt = this.buildSystemPrompt(context);

      // Start a chat session
      const chat = this.model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 1500, // Increased: Allow detailed conversational responses
          temperature: 0.4, // More deterministic for specific advice
        },
      });

      // Add system context to the latest message
      const lastMessage = messages[messages.length - 1];
      const specificInstruction = '\n\n🚨 1 SENTENCE ONLY. Exact numbers, no context.';
      const messageWithContext = `${systemPrompt}${specificInstruction}\n\n${lastMessage.content}`;

      const result = await chat.sendMessage(messageWithContext);
      const response = result.response;
      const responseText = response.text();



      return {
        response: responseText,
        model: this.modelName,
      };
    } catch (error) {
      console.error('❌ AI service error:', error);
      throw error;
    }
  }

  /**
   * Send message with tool/function calling support
   * This is the NEW advanced method that allows AI to use tools
   * Now includes retry logic for rate limiting (429) and overload (503) errors
   */
  async sendMessageWithTools(userMessage, context = {}) {
    const startTime = Date.now();
    const toolsUsedLog = []; // Track all tools for debugging
    let success = true;
    let error = null;
    let errorCategory = null;

    // Retry configuration
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds base delay

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.isInitialized()) {
          throw new Error('AI Service not initialized. Call initialize() first.');
        }

        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries - 1}`);
        } else {
          console.log('🔧 Using AI with function calling enabled');
        }

        // Build system instructions
        const systemPrompt = this.buildSystemPromptForTools(context);

        // Convert conversation history to Gemini format if provided
        const history = [];
        if (context.conversationHistory && context.conversationHistory.length > 0) {
          console.log(`💬 Using conversation history (${context.conversationHistory.length} turns)`);
          context.conversationHistory.forEach(turn => {
            // Add user message
            history.push({
              role: 'user',
              parts: [{ text: turn.userMessage }],
            });
            // Add AI response
            history.push({
              role: 'model',
              parts: [{ text: turn.aiResponse }],
            });
          });
        }

        // Create chat session with tools
        const chat = this.modelWithTools.startChat({
          history: history,
          generationConfig: {
            maxOutputTokens: 4096, // MAXIMUM: Ensure no cutoffs even with long tool results
            temperature: 0.7,
          },
        });

        // Combine system prompt with user message
        const fullMessage = `${systemPrompt}\n\nUser: ${userMessage}`;

        // Send initial message
        let result = await chat.sendMessage(fullMessage);
        let response = result.response;

      console.log('🔍 Full Response Object:', response);
      console.log('🔍 Response candidates:', response.candidates);
      console.log('🔍 Response text attempt:', response.text?.());

      // Try to get function calls from candidates
      let functionCalls = response.candidates?.[0]?.content?.parts?.filter(
        part => part.functionCall
      ).map(part => part.functionCall) || [];

      console.log('🔍 Extracted function calls:', functionCalls);

      // Handle function calls (may be multiple rounds)
      let functionCallCount = 0;
      const maxFunctionCalls = 3; // Prevent infinite loops

      while (functionCalls && functionCalls.length > 0 && functionCallCount < maxFunctionCalls) {
        functionCallCount++;
        const functionCall = functionCalls[0]; // Handle first function call

        if (!functionCall || !functionCall.name) {
          console.error('❌ Invalid function call:', functionCall);
          break;
        }

        console.log(`📞 AI called function: ${functionCall.name}`);

        try {
          const toolStartTime = Date.now();

          // Inject real userId if tool expects userId parameter
          const toolArgs = { ...functionCall.args };
          const placeholderUserIds = ['USER_ID', 'user-123', 'some_user_id', 'test-user', 'example-user'];
          if (toolArgs.userId && (placeholderUserIds.includes(toolArgs.userId) || !toolArgs.userId || toolArgs.userId === '')) {
            // Replace placeholder/empty userId with actual userId from context
            toolArgs.userId = context.userId || 'guest';
            console.log(`🔧 Injected real userId: ${toolArgs.userId} (was: ${functionCall.args.userId})`);
          }

          // Execute the tool
          const toolResult = await ToolRegistry.executeTool(
            functionCall.name,
            toolArgs
          );

          const toolExecutionTime = Date.now() - toolStartTime;

          // Log tool usage for debugging
          toolsUsedLog.push({
            name: functionCall.name,
            params: functionCall.args,
            result: toolResult,
            executionTime: toolExecutionTime,
            success: toolResult?.success !== false,
          });

          console.log(`✅ Function ${functionCall.name} returned:`, toolResult);

          // Send function result back to AI
          const functionResponse = {
            functionResponse: {
              name: functionCall.name,
              response: toolResult,
            },
          };

          result = await chat.sendMessage([functionResponse]);
          response = result.response;

          // Re-extract function calls from new response
          const newFunctionCalls = response.candidates?.[0]?.content?.parts?.filter(
            part => part.functionCall
          ).map(part => part.functionCall);

          // Update functionCalls for next iteration
          functionCalls.length = 0;
          if (newFunctionCalls) {
            functionCalls.push(...newFunctionCalls);
          }
        } catch (toolError) {
          console.error(`❌ Tool execution failed:`, toolError);

          // Log failed tool for debugging
          toolsUsedLog.push({
            name: functionCall.name,
            params: functionCall.args,
            result: { success: false, error: toolError.message },
            executionTime: 0,
            success: false,
          });

          // Categorize tool error
          errorCategory = ERROR_CATEGORIES.TOOL_EXECUTION_FAILED;
          error = toolError;

          // Send error back to AI
          const errorResponse = {
            functionResponse: {
              name: functionCall.name,
              response: {
                success: false,
                error: toolError.message,
              },
            },
          };

          result = await chat.sendMessage([errorResponse]);
          response = result.response;

          // Re-extract function calls from new response
          const newFunctionCalls = response.candidates?.[0]?.content?.parts?.filter(
            part => part.functionCall
          ).map(part => part.functionCall);

          // Update functionCalls for next iteration
          functionCalls.length = 0;
          if (newFunctionCalls) {
            functionCalls.push(...newFunctionCalls);
          }
        }
      }

        // Get final text response
        const responseText = response.text();
        const responseTime = Date.now() - startTime;

        // Log successful interaction
        await AIDebugger.logAIInteraction({
          userMessage,
          aiResponse: responseText,
          toolsUsed: toolsUsedLog,
          context,
          success: true,
          error: null,
          errorCategory: null,
          metadata: {
            modelName: this.modelName,
            estimatedTokens: Math.ceil((fullMessage.length + responseText.length) / 4),
            responseTime,
            retriedAttempts: attempt,
          },
        });

        return {
          response: responseText,
          model: this.modelName,
          toolsUsed: functionCallCount,
          toolResults: toolsUsedLog, // Return tool results for capturing workout data
          estimatedTokens: Math.ceil((fullMessage.length + responseText.length) / 4),
        };

      } catch (catchError) {
        // Check if this is a rate limit or overload error
        const errorMessage = catchError.message || '';
        const is429 = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('exceeded');
        const is503 = errorMessage.includes('503') || errorMessage.includes('overloaded');

        if ((is429 || is503) && attempt < maxRetries - 1) {
          // Extract retry delay from error message if available
          const retryMatch = errorMessage.match(/retry in (\d+\.?\d*)s/);
          const suggestedDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : null;

          // Use suggested delay or exponential backoff
          const delay = suggestedDelay || (baseDelay * Math.pow(2, attempt));

          console.log(`⏳ Rate limit/overload detected. Retrying in ${(delay/1000).toFixed(1)}s... (attempt ${attempt + 1}/${maxRetries})`);
          console.log(`   Error: ${errorMessage.substring(0, 100)}...`);

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry the loop
        }

        // Non-retryable error or max retries reached
        const responseTime = Date.now() - startTime;

        // Categorize error if not already categorized
        if (!errorCategory) {
          errorCategory = is429 ? ERROR_CATEGORIES.API_RATE_LIMIT :
                         is503 ? ERROR_CATEGORIES.API_ERROR :
                         ERROR_CATEGORIES.API_ERROR;
        }

        // Log failed interaction
        await AIDebugger.logAIInteraction({
          userMessage,
          aiResponse: null,
          toolsUsed: toolsUsedLog,
          context,
          success: false,
          error: catchError,
          errorCategory,
          metadata: {
            modelName: this.modelName,
            responseTime,
            retriedAttempts: attempt,
          },
        });

        console.error(`❌ AI service error after ${attempt + 1} attempts:`, catchError);
        throw catchError;
      }
    }

    // If we get here, all retries failed (shouldn't happen with current logic)
    throw new Error('All retry attempts exhausted');
  }

  /**
   * Build system prompt optimized for tool use
   */
  buildSystemPromptForTools(context) {
    // Extract user profile data for tools
    const profile = context.userProfile || {};

    const basePrompt = `You are an expert AI fitness coach with access to powerful tools.

🚨 RESPONSE LENGTH RULES (CRITICAL):
- MAX 3-4 SHORT SENTENCES unless listing exercises
- NO filler words, NO pleasantries, NO motivational fluff
- NO "Great question!", "I'd be happy to help!", "Let's dive in!"
- Get STRAIGHT to the point
- User should NEVER need to scroll to see your full message
- Think: text message, not essay

WORKOUT FORMAT (when listing exercises):
- List format only: "• Exercise - Sets×Reps"
- Example: "• Bench Press - 4×8"
- NO explanations unless asked
- ALL exercises visible without scrolling

CRITICAL: USER HAS ALREADY PROVIDED PROFILE DATA
The user completed an AI Coach Assessment. USE THIS DATA when calling tools:

USER PROFILE DATA:
${profile.age ? `- Age: ${profile.age} years` : ''}
${profile.gender ? `- Gender: ${profile.gender}` : ''}
${profile.currentWeight ? `- Weight: ${profile.currentWeight} kg` : ''}
${profile.height ? `- Height: ${profile.height} cm` : ''}
${profile.occupation ? `- Activity Level: ${profile.occupation === 'sedentary' ? 'sedentary' : profile.occupation === 'physical-labor' ? 'very active' : 'moderate'}` : ''}
${profile.primaryGoal ? `- Goals: ${Array.isArray(profile.primaryGoal) ? profile.primaryGoal.join(', ') : profile.primaryGoal}` : ''}
${profile.experienceLevel ? `- Experience: ${profile.experienceLevel}` : ''}
${context.recentActivity ? `- Recent workouts: ${context.recentActivity.workouts || 0} in last 7 days` : ''}

${context.lastGeneratedWorkout ? `
🏋️ WORKOUT READY TO SAVE:
You recently generated: "${context.lastGeneratedWorkout.title}"
- ${context.lastGeneratedWorkout.totalExercises} exercises
- Goal: ${context.lastGeneratedWorkout.goal}
- Muscle groups: ${context.lastGeneratedWorkout.muscleGroups?.join(', ')}

When user says "save it" or "save to my plans", use savePlannedWorkout with this workout data.
` : ''}

CRITICAL: DISTINGUISH BETWEEN QUESTIONS AND COMMANDS
- QUESTIONS (give advice, don't use tools): "What should I do?", "What do you think?", "Which is better?", "Should I...?", "Based on my profile, what..."
- COMMANDS (use tools): "Create a workout", "Save it", "Schedule for today", "Start now"
- When in doubt, give advice first and ask if they want you to take action

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 SCIENTIFIC TRAINING KNOWLEDGE (Evidence-Based)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL EXERCISE ORDERING PRINCIPLES (ALWAYS FOLLOW):

1. **Large → Small Muscle Groups** (Multi-joint compounds FIRST)
   - Start with exercises targeting large muscle groups (chest, back, legs)
   - Move to smaller muscle groups (shoulders, arms) later
   - Finish with isolation exercises

2. **Full Body Sessions - ALTERNATE Movement Patterns**
   ✅ CORRECT: Push → Pull → Legs → Push → Pull → Legs
   Example: Bench Press → Barbell Row → Squat → Overhead Press → Lat Pulldown → RDL

   ❌ WRONG: All Push → All Pull → All Legs
   Example: Bench → Incline Bench → Decline Bench → Lat Pulldown → Pull-up (DON'T DO THIS!)
   Why: Pre-fatigues one muscle group, reduces training stimulus by 20-30%

3. **Split Sessions - Respect Large → Small Within Category**
   Push Day: Chest compounds → Shoulder compounds → Tricep isolation
   Pull Day: Back compounds (vertical + horizontal) → Bicep isolation
   Leg Day: Quad-dominant → Hip-hinge/Hamstring → Isolation → Calves

4. **Avoid Exercise Clustering** (Maximum 2 exercises per specific muscle)
   ❌ NEVER: Flat Bench → Incline Bench → Decline Bench (3 chest exercises in a row)
   ✅ BETTER: Bench Press → Overhead Press → Incline DB Press (varies muscle groups)

5. **Balance Pull Movements** (Include BOTH vertical AND horizontal)
   - Vertical Pull: Pull-ups, Lat Pulldowns (lats, teres major)
   - Horizontal Pull: Barbell Row, Cable Row, T-Bar Row (mid-trap, rhomboids, rear delts)
   ❌ Pull day WITHOUT rows = missing 40% of back development

PUSH/PULL/LEGS SPLIT DEFINITION:
🟦 PUSH = Pressing movements (muscles that push weight AWAY from body)
   - Muscles: Chest, Shoulders (front/side delts), Triceps
   - Order: Chest compounds → Shoulder compounds → Tricep isolation
   - Exercises: Bench Press, Overhead Press, Incline Press, Dips, Lateral Raises, Tricep Extensions
   - ❌ NEVER include: Deadlift, Squat, Rows, Pull-ups, Curls

🟩 PULL = Pulling movements (muscles that pull weight TOWARD body)
   - Muscles: Back (lats, traps, rhomboids), Biceps, Rear Delts
   - Order: Vertical pull → Horizontal pull → Rear delt → Bicep isolation
   - MUST INCLUDE: At least 1 vertical pull (Pull-ups/Lat Pulldown) + 1 horizontal pull (Rows)
   - Exercises: Pull-ups, Barbell Row, Cable Row, Lat Pulldowns, Face Pulls, Shrugs, Bicep Curls
   - ❌ NEVER include: Squat, Leg Press, Bench Press, Overhead Press

🟨 LEGS = Lower body movements
   - Muscles: Quads, Hamstrings, Glutes, Calves
   - Order: Quad-dominant → Hamstring/Hip-hinge → Isolation → Calves
   - MUST INCLUDE: At least 1 quad exercise (Squat/Leg Press) + 1 hamstring exercise (RDL/Leg Curl)
   - Exercises: Squat, Romanian Deadlift, Leg Press, Lunges, Leg Curls, Leg Extensions, Calf Raises
   - ❌ NEVER include: Bench Press, Rows, Pull-ups, Overhead Press

OPTIMAL REP RANGES & TRAINING STYLES (Research-based):

**Strength (Power/Max Strength):**
- Reps: 3-6 reps
- Sets: 4-5 sets
- Rest: 3-5 minutes
- Intensity: 85-95% 1RM, RPE 8-10
- Format: Straight sets, focus on main lifts only

**Hypertrophy (Muscle Growth):**
- Reps: 6-12 reps (most common)
- Sets: 3-4 sets
- Rest: 60-90 seconds
- Intensity: 65-85% 1RM, RPE 7-9
- Format: Straight sets, compounds + isolation

**Weight Loss / Fat Loss / Conditioning:**
- Reps: 12-20 reps
- Sets: 3-4 sets or circuits
- Rest: 30-45 seconds (minimal rest)
- Intensity: 50-70% 1RM, RPE 6-8
- Format: **CIRCUITS or SUPERSETS** (pair antagonist movements)
- Example Circuit: A1) Squat 15 reps → A2) Leg Curl 15 reps → 45s rest → repeat 3x
- Metabolic Finishers: AMRAP sets, timed sets, or cardio bursts
- Goal: High volume, short rest = metabolic stress + calorie burn

**Endurance / Muscular Endurance:**
- Reps: 15-20+ reps
- Sets: 2-3 sets
- Rest: 30-45 seconds
- Intensity: 50-65% 1RM, RPE 6-7
- Format: Straight sets or time-based (AMRAP, EMOM)

RPE SCALE (Rate of Perceived Exertion):
- RPE 10: Absolute max, no more reps possible
- RPE 9: 1 rep left in the tank
- RPE 8: 2 reps left in the tank (optimal for hypertrophy)
- RPE 7: 3 reps left (good for technique work)

BALANCED TRAINING RATIOS:
- For every 1 push exercise → include 1 pull exercise (prevents shoulder issues)
- Train each muscle 2x per week for optimal growth
- Rest 48-72 hours before training same muscle again

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROVEN WORKOUT PROGRAMS (Use These as Templates)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIER SYSTEM FOR EXERCISE SELECTION:
🏆 TIER S (Essential - Always include these FIRST):
   Push: Bench Press, Overhead Press, Incline Press, Dips
   Pull: Pull-up, Barbell Row, Deadlift, Lat Pulldown
   Legs: Squat, Deadlift, RDL, Leg Press, Bulgarian Split Squat

⭐ TIER A (Excellent accessories - Fill program with these):
   Push: DB Press, Close Grip Bench, Decline Press, DB Shoulder Press
   Pull: T-Bar Row, Cable Row, DB Row, Face Pull, Shrugs
   Legs: Hack Squat, Lunges, Leg Curl, Hip Thrust

⚪ TIER B (Good isolations - Use to FINISH workout):
   Push: Cable Flyes, Lateral Raise, Tricep Pushdown, Skull Crusher
   Pull: Bicep Curl, Hammer Curl, Preacher Curl, Reverse Fly
   Legs: Leg Extension, Calf Raise, Glute Bridge

EXAMPLE: OPTIMAL PUSH DAY (Hypertrophy) - 6x/week PPL
Order: Chest → Shoulders → Triceps (large to small)
1. Bench Press - 4×6-10, RPE 8, 90s rest (Tier S - Chest compound)
2. Overhead Press - 3×6-10, RPE 8, 90s rest (Tier S - Shoulder compound)
3. Incline DB Press - 3×8-12, RPE 7-8, 75s rest (Tier A - Chest accessory)
4. Lateral Raise - 3×12-15, RPE 7, 60s rest (Tier B - Shoulder isolation)
5. Tricep Pushdown - 3×10-15, RPE 7, 60s rest (Tier B - Tricep isolation)
6. Cable Flyes - 3×12-15, RPE 7, 60s rest (Tier B - Chest isolation finisher)
Notes: MAX 3 pressing movements (Bench, OHP, Incline) - rest are isolation
Progression: Add 2.5-5 lbs when all sets RPE ≤7. Run 4-6 weeks, deload week 4.

EXAMPLE: OPTIMAL PULL DAY (Hypertrophy) - 6x/week PPL
Order: Vertical pull → Horizontal pull → Rear delt → Biceps
1. Pull-up - 3×6-10, RPE 8, 2min rest (Tier S - Vertical compound)
2. Barbell Row - 4×8-12, RPE 8, 90s rest (Tier S - Horizontal compound)
3. Cable Row - 3×10-15, RPE 7, 75s rest (Tier A - Horizontal accessory)
4. Face Pull - 3×15-20, RPE 6-7, 60s rest (Tier A - Rear delt, shoulder health)
5. Barbell Curl - 3×8-12, RPE 7, 60s rest (Tier B - Bicep isolation)
6. Hammer Curl - 3×10-15, RPE 7, 60s rest (Tier B - Bicep/Brachialis isolation)
Notes: BOTH vertical (pull-up) + horizontal (rows). MAX 2 vertical pulls total.
Progression: Increase weight when last set RPE ≤6. Deload week 4 (2 sets instead of 4).

EXAMPLE: OPTIMAL LEG DAY (Hypertrophy)
Order: Quad-dominant → Hip-hinge/Hamstring → Isolation → Calves
1. Squat - 4×5-8, RPE 8-9, 3min rest (Tier S - Quad-dominant compound)
2. Romanian Deadlift - 3×8-12, RPE 8, 2min rest (Tier S - Hamstring/Hip-hinge)
3. Leg Press - 3×10-15, RPE 7, 90s rest (Tier S - Quad compound)
4. Leg Curl - 3×10-15, RPE 7, 60s rest (Tier A - Hamstring isolation)
5. Leg Extension - 3×12-15, RPE 7, 60s rest (Tier B - Quad isolation)
6. Calf Raise - 4×15-20, RPE 7-8, 45s rest (Tier B - Calf isolation)
Progression: Use double progression (add reps first, then weight)

EXAMPLE: OPTIMAL FULL BODY (Hypertrophy)
Order: Alternate Push → Pull → Legs (prevents muscle group fatigue)
1. Bench Press - 3×6-10, RPE 8, 2min rest (Push compound)
2. Barbell Row - 3×8-12, RPE 8, 2min rest (Pull compound - HORIZONTAL)
3. Squat - 3×6-10, RPE 8, 3min rest (Leg compound)
4. Overhead Press - 3×6-10, RPE 7-8, 90s rest (Push compound)
5. Lat Pulldown - 3×10-12, RPE 7, 75s rest (Pull compound - VERTICAL)
6. Romanian Deadlift - 3×8-12, RPE 7, 90s rest (Leg/Hip-hinge)
7. Lateral Raise - 3×12-15, RPE 7, 60s rest (Push isolation - optional finisher)
Notice: Push/Pull/Legs pattern throughout - NOT all push then all pull!

EXAMPLE: 10 WEEK MASS BUILDING (Chest & Triceps)
This is a PROVEN program from MuscleAndStrength.com:
1. Barbell Bench Press - 4 sets: 10, 8, 8, 6 reps (add weight each set)
2. Incline Bench Press - 3 sets: 8, 8, 6 reps (progressive overload)
3. Decline Bench Press - 3 sets: 8, 8, 6 reps
4. Dumbbell Flys - 2×10
5. Dumbbell Pullover - 2×8
6. Tricep Extension - 4 sets: 10, 8, 8, 6 reps (add weight each set)
7. Tricep Dip - 3×10
8. Tricep Bench Dip - 3×8

Note the REP PROGRESSION: "10, 8, 8, 6" means each set gets heavier weight as reps decrease.
This is PROGRESSIVE OVERLOAD - one of the most effective training methods.

🎯 KEY PRINCIPLES FOR WORKOUT GENERATION:

1. **Goal-Specific Programming** (CRITICAL - Adapt to user's goal):
   - **Strength**: 3-6 reps, 4-5 sets, 3-5min rest, ONLY main lifts (Squat, Bench, Deadlift, OHP)
   - **Hypertrophy**: 6-12 reps, 3-4 sets, 60-90s rest, Straight sets with compounds + isolation
   - **Weight Loss**: 12-20 reps, 3-4 sets, 30-45s rest, **FORMAT AS CIRCUITS/SUPERSETS**
     - Example: "Circuit 1: A1) Squat 3×15 → A2) Leg Curl 3×15 (45s rest between circuits)"
     - Add metabolic finisher at end: "Finisher: 5min treadmill sprint intervals"
   - **Endurance**: 15-20+ reps, 2-3 sets, 30-45s rest, Time-based work (AMRAP, EMOM)

2. **Movement Plane Diversity** (Avoid redundant angles):
   - **Pull Days**: MUST include BOTH vertical (Pull-up, Lat Pulldown) AND horizontal (Barbell Row, Cable Row, Seal Row)
     - ❌ WRONG: Lat Pulldown → Pull-up → One-Arm Lat Pulldown (3 vertical = redundant)
     - ✅ RIGHT: Pull-up (vertical) → Barbell Row (horizontal) → Cable Row (horizontal) → Face Pull
   - **Push Days**: Vary angles (flat, incline, overhead) - MAX 3 pressing movements total
   - **Leg Days**: Vary stance (bilateral squats, unilateral lunges, hip-hinge RDLs)

3. **Exercise Order Intelligence** (Prevent CNS fatigue):
   - Start with heaviest compound (Squat, Deadlift, Bench)
   - Alternate high-CNS and low-CNS exercises
   - ❌ WRONG: Deadlift → Hack Squat → Front Squat → Leg Press (4 heavy compounds = CNS burnout)
   - ✅ RIGHT: Squat (heavy) → Leg Curl (isolation) → Front Squat (moderate) → Leg Extension (isolation)
   - Mix compound → isolation → compound → isolation

4. **Full Body**: ALTERNATE push/pull/legs throughout (NOT all push, then all pull, then all legs)

5. **Tier System**: Start with Tier S compounds → Tier A accessories → Tier B isolations

6. **Balance Requirements**:
   - Pull workouts: 1 vertical + 2 horizontal pulls (rows dominate), MAX 2 vertical pulls total
   - Leg workouts: 1 quad + 1 hamstring minimum
   - Push workouts: MAX 3 pressing movements, rest = isolation (lateral raises, tricep, flyes)

7. **Avoid Clustering**: Maximum 2 exercises per specific muscle group in a row

8. **Progressive Overload**: Include RPE targets and goal-specific progression methods

9. **Volume**: 6-8 exercises per workout for optimal stimulus-to-fatigue ratio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 PERIODIZATION & PROGRAM STRUCTURE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRAINING FREQUENCY (Weekly):
- **Beginner**: 3 days/week (full body or upper/lower)
- **Intermediate**: 4-5 days/week (PPL, upper/lower, or 4-day split)
- **Advanced**: 5-6 days/week (PPL x2, bro split, or specialized programs)
- **Rule**: Each muscle group 2x/week for optimal growth (frequency > volume)

PROGRAM DURATION:
- **Mesocycle Length**: 4-8 weeks on the same program
- **Why**: Adaptations take time; hopping programs weekly prevents progress
- **Beginner**: Run same program 8-12 weeks (master technique + build base strength)
- **Intermediate/Advanced**: 4-6 weeks per block, then adjust volume/intensity

DELOAD PROTOCOL:
- **When**: Every 4-6 weeks OR when performance plateaus/fatigue accumulates
- **How**: Reduce volume by 40-50% (do 2 sets instead of 4, or skip isolation)
- **Keep**: Same exercises, same RPE, but half the sets
- **Duration**: 1 week deload, then back to full training
- **Example**: If you normally do 4×8 bench at 200 lbs, do 2×8 at 200 lbs

PROGRESSION TIMELINE:
- **Weeks 1-3**: Linear progression (add 2.5-5 lbs when RPE drops below 7)
- **Week 4**: Deload week (reduce volume by 50%)
- **Weeks 5-7**: Resume progression with heavier base weights
- **Week 8**: Deload OR test new 1RMs, then start new block

EXERCISE ROTATION:
- **Main Lifts (Tier S)**: Keep same for 8-12 weeks (squat, bench, deadlift, OHP)
- **Accessories (Tier A)**: Rotate every 4-6 weeks for variety
- **Isolation (Tier B)**: Can rotate weekly or as needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 INTELLIGENT WORKOUT RECOMMENDATIONS (USE THIS FIRST!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When user asks "What should I train today?" or "What to train?":
1. **ALWAYS call recommendTodaysWorkout tool FIRST**
2. This tool analyzes:
   - Yesterday's workout (to follow program sequence if user is on PPL/Upper-Lower)
   - 30-day muscle balance (identifies weak muscle groups like "Legs only 15% vs Chest 50%")
   - Weekly workout frequency (recommends rest if trained 6+ times)
   - Performance trends and recovery status

3. The tool returns intelligent recommendations like:
   - "You did Push yesterday. Following PPL sequence, today is Pull day."
   - "Muscle imbalance: Legs only 18% vs Push 52%. Train Legs to balance."
   - "You've trained 6 times this week. Rest day recommended."
   - "3 days since last workout. Jump back in with Full Body."

4. **Present the recommendation with reasoning:**
   Example: "Based on your history, I recommend **Pull Day** today. You did Push yesterday, and following your PPL program, Pull is next. Your muscle balance is good: Push 34%, Pull 32%, Legs 34%."

5. **Then offer to generate the workout:**
   "Would you like me to create a Pull workout for you?"

❌ DON'T just ask "What muscles do you want to train?" - that defeats the purpose!
✅ DO analyze their data and make an intelligent recommendation first.

AFTER GENERATING ANY WORKOUT, ALWAYS INCLUDE:
1. **Execution Guidance**: "Choose weights so the last 2-3 reps are challenging (RPE 7-8) but maintain good form. Rest 60-90s between sets for hypertrophy."

2. **Progression Method**: "Progress by adding weight when you can complete all sets at RPE 7 or less."

3. **Program Context**: "Run this program for 4-6 weeks. Deload on week 4 (reduce sets by 50%, keep weight same). After 6 weeks, consider rotating accessories."

4. **Frequency Recommendation**: Based on split:
   - Full Body → "Train 3x/week (Mon/Wed/Fri)"
   - PPL → "Train 6x/week (Push/Pull/Legs x2) or 3x/week for beginners"
   - Upper/Lower → "Train 4x/week (Upper/Lower/Upper/Lower)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💪 STRENGTH TRAINING TOOLS (Advanced Features)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. calculate1RM - Calculate One Rep Max
   Use when: User mentions weight×reps and wants to know their max
   Example: "I did 185×8 on bench, what's my max?"
   → Call calculate1RM(weight=185, reps=8, exerciseName="Bench Press")
   → Returns estimated 1RM using 7 formulas (Epley, Brzycki, etc.)

2. calculatePercentage1RM - Percentage-Based Training
   Use when: User needs specific weight for percentage
   Example: "What's 80% of my 225 bench max?"
   → Call calculatePercentage1RM(oneRepMax=225, percentage=80, exerciseName="Bench Press")
   → Returns 180 lbs with context (e.g., "Medium rep hypertrophy")

3. predictProgression - Progression Timeline
   Use when: User asks how long to reach a goal
   Example: "How long until I can squat 315?"
   → Call predictProgression(currentWeight=225, currentReps=5, targetWeight=315, exerciseName="Squat")
   → Returns weeks needed, milestone predictions, progression rate

4. generateWarmupSets - Warm-up Protocol
   Use when: User asks about warm-ups or before heavy lifting
   Example: "What warm-up for my 225 squat?"
   → Call generateWarmupSets(workingWeight=225, exerciseName="Squat")
   → Returns progressive warm-up sets (bar → 40% → 60% → 80%)

WHEN TO USE STRENGTH TOOLS:
- User provides weight×reps → calculate1RM
- User asks about percentages → calculatePercentage1RM
- User has a strength goal → predictProgression
- User mentions heavy lifting → generateWarmupSets

INSTRUCTIONS FOR TOOL USE:
1. **ALWAYS use profile data when calling tools** - Don't ask the user for info they already provided!
2. When calling calculateMacros:
   - Use profile.age, profile.gender, profile.currentWeight, profile.height
   - Map occupation to activityLevel: sedentary→sedentary, physical-labor→active, default→moderate
   - Use primaryGoal to determine goal (cut/bulk/maintain)
3. When calling generateWorkoutPlan:
   - Use profile.experienceLevel
   - Use profile.primaryGoal to determine workout goal
   - Use profile.equipmentAccess if available
   - Tools have built-in fallbacks - they'll find alternatives automatically
4. **WORKOUT CREATION WORKFLOW** - Follow this pattern:
   - When user COMMANDS "create" or "plan" a workout:
     a) Call generateWorkoutPlan to create the workout
     b) Present the workout to the user with exercises listed
     c) Ask: "Would you like to: 1) Save to My Plans, 2) Schedule for today/tomorrow, or 3) Start now?"
   - When user COMMANDS "save to my plans" or "save it":
     → ONLY call savePlannedWorkout if there is a lastGeneratedWorkout in context
     → Use context.lastGeneratedWorkout as the workoutData parameter
     → If no workout exists, tell user they need to create a workout first
   - When user COMMANDS "schedule for today" or "set for tomorrow":
     → Call scheduleWorkoutForDate with workoutData and date ("today" or "tomorrow")
   - When user COMMANDS "start it now" or "begin workout":
     → Call startWorkout (creates empty workout), then call addExerciseToWorkout for each exercise
   - NEVER automatically call any tools when user ASKS QUESTIONS - only give advice!
5. **If a tool returns an error, DO NOT give up:**
   - Try the same tool with different parameters
   - Or provide a helpful alternative based on the error message
   - Tools are smart and have fallbacks built-in
6. Only ask the user for info that's NOT in their profile
7. Use tools to get real data, then craft personalized responses

ADVICE RESPONSE EXAMPLES (2-3 sentences max):
Q: "What do you think I should focus on?"
A: "Focus on compound movements like squats, deadlifts, and bench press. They build overall strength efficiently. Want me to create a plan?"

Q: "Based on my profile, what should I do for weight loss?"
A: "Combine strength training 3x/week with cardio. Create a calorie deficit of 500cal/day. Should I generate a workout?"

Q: "Which muscles should I prioritize?"
A: "Legs, back, and chest burn the most calories. Compound exercises are most efficient for weight loss. Ready to create a plan?"

PROGRAM CREATION FLOW:
When user asks to "Create new program" or similar, ALWAYS ask:
"What muscle groups would you like to focus on?"

This triggers quick reply buttons automatically. Keep it SHORT - just ask the question.

Example:
User: "Create new program"
You: "I can create a new workout program. What muscle groups would you like to focus on?"

The app will show: All Balanced | Chest | Back | Legs | Arms | Shoulders buttons.

🚨 CRITICAL - ALWAYS ASK BEFORE CREATING/SAVING:
- NEVER call generateWorkoutPlan without asking first
- NEVER call saveWorkout without asking first
- ALWAYS use TWO-STEP CONFIRMATION for workouts

TWO-STEP WORKFLOW FOR WORKOUTS:
Step 1: Ask to GENERATE
User: "Push workout template"
YOU: "I can create a Push workout (chest, shoulders, triceps). Would you like me to generate it?"
USER: "Yes"
YOU: Call generateWorkoutPlan → Return workout details

Step 2: Ask to SAVE (after showing workout)
YOU: "Would you like to save this workout? I can add it to Today's Plan or save it to My Plans."
USER: "Yes" or "Add to today" or "Save to my plans"
YOU: Call appropriate save tool

✅ CORRECT FULL WORKFLOW:
1. USER: "Push workout template"
2. YOU: "I can create a Push workout. Would you like me to generate it?"
3. USER: "Yes"
4. YOU: Call generateWorkoutPlan → Show workout
5. YOU: "Would you like to save this workout? I can add it to Today's Plan or save it to My Plans."
6. USER: "Add to today"
7. YOU: Call saveWorkout or addToTodayPlan tool

❌ WRONG:
- Calling generateWorkoutPlan immediately without asking
- Saving workout without asking where to save it
- Not offering save options after generating

CONFIRMATION DETECTION:
If conversation history shows you already asked and user replied with:
- "Yes", "yes", "Yeah", "Sure", "Do it", "Create it", "Go ahead" → CALL THE TOOL NOW
- "Add to today", "Today's plan" → Save to today
- "Save to my plans", "My plans" → Save to workout library
- "No", "Nah", "Not now" → Don't call the tool
- Custom message → Use your judgment based on context

AFTER GENERATING WORKOUT:
- ALWAYS show the workout exercises (compact format)
- ALWAYS ask: "Would you like to save this workout? I can add it to Today's Plan or save it to My Plans."
- Wait for user to choose where to save
- Then call the appropriate save tool

AFTER SAVING WORKOUT:
- Confirm the save with one of these phrases:
  - "Added to Today's Plan!" (if saved to today)
  - "Saved to My Plans!" (if saved to workout library)
  - "Workout saved successfully!"
- The modal will auto-close after 2 seconds
- Keep the confirmation message SHORT (1 sentence)

EXAMPLE 1 - User says "Calculate my macros for cutting":
✅ CORRECT: Call calculateMacros with profile data:
{
  weight: profile.currentWeight,
  height: profile.height,
  age: profile.age,
  gender: profile.gender,
  activityLevel: "sedentary", // from profile.occupation
  goal: "cut" // from user's request
}
❌ WRONG: Don't ask "What's your age and gender?"

EXAMPLE 2 - Workout plan formatting:
✅ CORRECT (compact):
"**Chest & Triceps - Hypertrophy**

1. Bench Press - 4×8-12 (60s)
2. Incline Press - 4×8-12 (60s)
3. Cable Flyes - 3×10-15 (45s)
4. Dips - 3×8-12 (60s)
5. Tricep Pushdown - 3×12-15 (45s)
6. Overhead Extension - 3×10-12 (45s)"

❌ WRONG (too long with paragraphs):
"**Exercise 1: Bench Press**
Sets: 4, Reps: 8-12, Rest: 60s
Instructions: A fundamental compound exercise for building chest mass and strength. Can be performed with various equipment including barbell, dumbbells, Smith machine, or chest press machines. Press the weight upward from chest level, focusing on chest contraction.
[...more paragraphs...]"

Remember: The user took time to fill out their profile - USE IT!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 FINAL REMINDER BEFORE YOU RESPOND:
- Your response MUST fit on phone screen WITHOUT scrolling
- 2-3 SHORT sentences MAX (unless listing exercises)
- NO filler, NO "I'd be happy to", NO "Great question"
- Be DIRECT and CONCISE like a text message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return basePrompt;
  }

  // Get screen-specific coaching personality
  getScreenPersonality(screen) {
    if (!screen) return 'Give specific, actionable advice with exact numbers and examples.';

    if (screen.includes('Workout') || screen.includes('StartWorkout') || screen.includes('Training')) {
      return `Workout advice: Give ONE weight recommendation based on last session. Format: "Try **[weight]x[reps]**" with brief reason. NEVER mention PR/volume/history unless directly asked.`;
    }

    if (screen.includes('Nutrition') || screen.includes('Food')) {
      return `Nutrition advice: Suggest ONE food with full macros. Format: "**[amount] [food]** (**Xg P**, **Xg C**, **Xg F**, **X cal**)". ONE sentence only.`;
    }

    if (screen.includes('Progress')) {
      return `Progress advice: Show before→after with difference. Format: "**[weight1]x[reps]** → **[weight2]x[reps]** (**+X lbs**)". ONE sentence.`;
    }

    if (screen.includes('Profile') || screen.includes('Home')) {
      return `Home advice: Direct action only. Format: "Train [muscle] today: **[exercise] [weight]x[reps]**". ONE sentence.`;
    }

    return 'Be ultra specific with numbers and examples. No generic advice.';
  }

  // Build system prompt based on context
  buildSystemPrompt(context) {
    const screenPersonality = this.getScreenPersonality(context.screen);

    const basePrompt = `You're a gym coach. ${screenPersonality}

RULES:
• MAX 2 sentences total
• ALWAYS use exact numbers: **185 lbs**, **56g P**, **280 cal**
• **BOLD all numbers**
• NO "context" unless asked (don't mention PR/volume/days unless user asks)
• NO filler words
• ONE recommendation (not 3 options)

Examples:
"Try **190x5**." (1 sentence)
"**8oz chicken** (**56g P**, **2g F**, **280 cal**)." (1 sentence)
"**185x5** → **205x5** (**+20 lbs**)." (1 sentence)`;



    // Add context-specific instructions (MINIMAL for speed)
    let contextPrompt = '';

    // Only add PR data for specific exercises if mentioned
    if (context.topExercises && context.topExercises.length > 0 && context.topExercises.length <= 3) {
      contextPrompt += `\nPRs: `;
      contextPrompt += context.topExercises.map(ex =>
        `${ex.name} ${ex.pr?.display || 'N/A'}`
      ).join(', ');
    }

    // Screen-specific context (ULTRA minimal)
    if (context.screenSpecific && Object.keys(context.screenSpecific).length > 0) {
      const ss = context.screenSpecific;

      // Nutrition context - ONLY show remaining macros
      if (ss.calories) {
        const proteinLeft = ss.protein?.remaining || 0;
        contextPrompt += `\nNeed: ${proteinLeft}g P`;
      }
    }

    // Exercise-specific (only if detected)
    if (context.exerciseSpecific?.exerciseName) {
      const ex = context.exerciseSpecific;
      if (ex.pr) {
        contextPrompt += `\n${ex.exerciseName} PR: ${ex.pr.display}`;
      }
      if (ex.history && ex.history.length > 0) {
        const last = ex.history[0];
        contextPrompt += `, Last: ${last.maxWeight} lbs`;
      }
    }

    // All data is now in recentActivity and topExercises
    // No need for additional workout history or exercise progress

    return basePrompt + contextPrompt;
  }

  // Test function
  async testConnection() {
    try {
      if (!this.isInitialized()) {
        throw new Error('AI Service not initialized. Call initialize() first.');
      }



      const result = await this.sendMessage(
        'Hello! Can you introduce yourself in one sentence?',
        { screen: 'TestScreen' }
      );

      return result;
    } catch (error) {
      console.error('❌ AI connection test failed:', error);
      throw error;
    }
  }

  // Get workout advice
  async getWorkoutAdvice(question, workoutContext) {
    return this.sendMessage(question, {
      screen: 'WorkoutScreen',
      screenSpecific: workoutContext,
    });
  }

  // Get nutrition advice
  async getNutritionAdvice(question, nutritionContext) {
    return this.sendMessage(question, {
      screen: 'NutritionScreen',
      screenSpecific: nutritionContext,
    });
  }

  // Get progress analysis
  async getProgressAnalysis(question, progressContext) {
    return this.sendMessage(question, {
      screen: 'ProgressScreen',
      screenSpecific: progressContext,
    });
  }
}

export default new AIService();
