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
          maxOutputTokens: 50, // HARD LIMIT: 1-2 sentences max
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
          maxOutputTokens: 50, // HARD LIMIT: 1-2 sentences max
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
            maxOutputTokens: 2000, // Higher limit for tool use
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

          // Execute the tool
          const toolResult = await ToolRegistry.executeTool(
            functionCall.name,
            functionCall.args
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

YOUR CAPABILITIES:
- Generate complete workout plans
- Search exercises and find alternatives
- Calculate nutrition macros
- Analyze workout history
- Recommend exercises based on user data
- Track progress and stats

RESPONSE FORMAT RULES:
- Keep workout plans COMPACT and SCANNABLE
- Format: "Exercise - Sets×Reps (Rest)"
- Example: "Bench Press - 4×8-12 (60s)"
- NO long paragraphs of instructions
- User should see ALL exercises at once without scrolling

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
4. **If a tool returns an error, DO NOT give up:**
   - Try the same tool with different parameters
   - Or provide a helpful alternative based on the error message
   - Tools are smart and have fallbacks built-in
5. Only ask the user for info that's NOT in their profile
6. Use tools to get real data, then craft personalized responses

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

Remember: The user took time to fill out their profile - USE IT!`;

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
