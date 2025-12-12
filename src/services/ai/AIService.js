import { detectIntent, executeAction } from './AIActions';
import { initializeTools, ToolRegistry } from './tools';
import AIDebugger, { ERROR_CATEGORIES } from './AIDebugger';
import AI_TERMINOLOGY from '../../config/aiTerminology';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class AIService {
  constructor() {
    // Initialize with API key - we'll get this from environment or config
    this.apiKey = null;
    // Using OpenAI GPT-4o-mini (smart, fast, affordable, reliable)
    this.modelName = 'gpt-4o-mini';
    this.toolsEnabled = true; // Enable function calling by default
  }

  // Initialize the AI service with API key
  initialize(apiKey) {
    if (!apiKey) {
      console.error('❌ No API key provided for OpenAI');
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = apiKey;

    // Initialize tools
    initializeTools();

    console.log('✅ OpenAI GPT-4o-mini initialized');
  }

  // Simple text generation (for tools that just need text output)
  async generateText(prompt, options = {}) {
    const { temperature = 0.7, max_tokens = 4096 } = options;

    const completion = await this.makeOpenAIRequest(
      [{ role: 'user', content: prompt }],
      { temperature, max_tokens }
    );

    return completion.choices[0].message.content;
  }

  // Make API request to OpenAI
  async makeOpenAIRequest(messages, options = {}) {
    const { tools, tool_choice, max_tokens = 4096, temperature = 0.7 } = options;

    const body = {
      model: this.modelName,
      messages,
      max_tokens,
      temperature,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = tool_choice || 'auto';
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    return response.json();
  }

  // Check if service is initialized
  isInitialized() {
    return this.apiKey !== null;
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

      const completion = await this.makeOpenAIRequest(
        [
          { role: 'system', content: systemPrompt + lengthInstruction },
          { role: 'user', content: userMessage }
        ],
        { max_tokens: 1000, temperature: 0.4 }
      );

      const responseText = completion.choices[0].message.content;

      return {
        response: responseText,
        model: this.modelName,
        estimatedTokens: completion.usage?.total_tokens || 0,
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
      const specificInstruction = '\n\n🚨 1 SENTENCE ONLY. Exact numbers, no context.';

      // Convert messages to OpenAI format
      const openaiMessages = [
        { role: 'system', content: systemPrompt + specificInstruction },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
      ];

      const completion = await this.makeOpenAIRequest(
        openaiMessages,
        { max_tokens: 1500, temperature: 0.4 }
      );

      const responseText = completion.choices[0].message.content;

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
   * Convert Gemini tool schemas to OpenAI format
   */
  convertToolsToOpenAIFormat(geminiTools) {
    return geminiTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || { type: 'object', properties: {} },
      }
    }));
  }

  /**
   * Send message with tool/function calling support
   * Uses OpenAI GPT-4o-mini with function calling
   */
  async sendMessageWithTools(userMessage, context = {}) {
    const startTime = Date.now();
    const toolsUsedLog = []; // Track all tools for debugging
    let errorCategory = null;

    // Retry configuration
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds base delay

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!this.isInitialized()) {
          throw new Error('AI Service not initialized. Call initialize() first.');
        }

        // 🎯 BUTTON PRESS DETECTION
        const buttonPhraseMap = {
          'Push workout': { type: 'push', tool: 'generateWorkoutPlan' },
          'Pull workout': { type: 'pull', tool: 'generateWorkoutPlan' },
          'Leg workout': { type: 'legs', tool: 'generateWorkoutPlan' },
          'Full body workout': { type: 'full_body', tool: 'generateWorkoutPlan' },
          'Upper body': { type: 'upper', tool: 'generateWorkoutPlan' },
        };

        const buttonMatch = buttonPhraseMap[userMessage.trim()];
        if (buttonMatch) {
          context.buttonPress = {
            type: buttonMatch.type,
            instruction: `User pressed "${userMessage}" button. IMMEDIATELY call generateWorkoutPlan tool with muscleGroups: ["${buttonMatch.type}"]. DO NOT ask questions - just generate the workout directly.`
          };
        }

        // Build system prompt
        const systemPrompt = this.buildSystemPromptForTools(context);

        // Get tools and convert to OpenAI format
        const geminiTools = ToolRegistry.getToolSchemas();
        const openaiTools = this.convertToolsToOpenAIFormat(geminiTools);

        // Build messages array
        const messages = [
          { role: 'system', content: systemPrompt },
        ];

        // Add conversation history if provided
        if (context.conversationHistory && context.conversationHistory.length > 0) {
          context.conversationHistory.forEach(turn => {
            messages.push({ role: 'user', content: turn.userMessage });
            messages.push({ role: 'assistant', content: turn.aiResponse });
          });
        }

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        // Send initial request
        let completion = await this.makeOpenAIRequest(messages, {
          tools: openaiTools,
          tool_choice: 'auto',
          max_tokens: 4096,
          temperature: 0.7,
        });

        let responseMessage = completion.choices[0].message;
        let functionCallCount = 0;
        const maxFunctionCalls = 3;

        // Handle tool calls loop
        while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0 && functionCallCount < maxFunctionCalls) {
          functionCallCount++;

          // Add assistant's response with tool calls to messages
          messages.push(responseMessage);

          // Process each tool call
          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments || '{}');

            try {
              const toolStartTime = Date.now();

              // Inject real userId if needed
              const toolArgs = { ...functionArgs };
              const placeholderUserIds = ['USER_ID', 'User ID', 'user-123', 'user123', 'some_user_id', 'test-user', 'test_user', 'example-user', '_user_id', 'userId', 'user_id', 'current_user', '<user_id>'];
              if (!toolArgs.userId || toolArgs.userId === '' || placeholderUserIds.includes(toolArgs.userId)) {
                toolArgs.userId = context.userId || 'guest';
              }

              // Auto-inject food preferences for recipe tools
              const recipeTools = ['generateRecipeFromIngredients', 'generateHighProteinRecipe'];
              if (recipeTools.includes(functionName)) {
                const foodPrefs = context.screenSpecific?.foodPreferences;
                if (context.screenParams?.mealType && !toolArgs.mealType) {
                  toolArgs.mealType = context.screenParams.mealType;
                }
                const userDietaryRestrictions = foodPrefs?.dietaryRestrictions || [];
                if (userDietaryRestrictions.length > 0) {
                  toolArgs.dietaryRestrictions = [...new Set([...userDietaryRestrictions, ...(toolArgs.dietaryRestrictions || [])])];
                }
                if (foodPrefs?.mealPreferences && !toolArgs.targetCalories && !toolArgs.targetProtein) {
                  const mealType = context.screenParams?.mealType || toolArgs.mealType || 'any';
                  const mealTargets = foodPrefs.mealPreferences[mealType];
                  if (mealTargets) {
                    toolArgs.targetCalories = toolArgs.targetCalories || mealTargets.targetCalories;
                    toolArgs.targetProtein = toolArgs.targetProtein || mealTargets.targetProtein;
                  }
                }
              }

              // Auto-inject workout preferences
              const workoutTools = ['generateWorkoutPlan', 'generateWorkoutProgram', 'recommendTodaysWorkout'];
              if (workoutTools.includes(functionName)) {
                const profile = context.userProfile || {};
                if (!toolArgs.equipment && profile.equipmentAccess?.length > 0) {
                  toolArgs.equipment = profile.equipmentAccess;
                }
                if (!toolArgs.experienceLevel && profile.experienceLevel) {
                  toolArgs.experienceLevel = profile.experienceLevel;
                }
                if (!toolArgs.goal && profile.primaryGoal) {
                  const goalMap = {
                    'muscle gain': 'hypertrophy',
                    'weight loss': 'endurance',
                    'strength': 'strength',
                    'general fitness': 'general'
                  };
                  toolArgs.goal = goalMap[profile.primaryGoal] || 'hypertrophy';
                }
              }

              // Execute the tool
              const toolResult = await ToolRegistry.executeTool(functionName, toolArgs);
              const toolExecutionTime = Date.now() - toolStartTime;

              toolsUsedLog.push({
                name: functionName,
                params: functionArgs,
                result: toolResult,
                executionTime: toolExecutionTime,
                success: toolResult?.success !== false,
              });

              // Add tool result to messages
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              });

            } catch (toolError) {
              console.error(`❌ Tool execution failed:`, toolError);

              toolsUsedLog.push({
                name: functionName,
                params: functionArgs,
                result: { success: false, error: toolError.message },
                executionTime: 0,
                success: false,
              });

              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({ success: false, error: toolError.message }),
              });
            }
          }

          // Get next response after tool results
          completion = await this.makeOpenAIRequest(messages, {
            tools: openaiTools,
            tool_choice: 'auto',
            max_tokens: 4096,
            temperature: 0.7,
          });

          responseMessage = completion.choices[0].message;
        }

        // Get final text response
        const responseText = responseMessage.content || '';
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
            estimatedTokens: completion.usage?.total_tokens || 0,
            responseTime,
            retriedAttempts: attempt,
          },
        });

        // Extract toolResults
        let finalToolResults = null;
        if (toolsUsedLog.length > 0) {
          const lastTool = toolsUsedLog[toolsUsedLog.length - 1];
          if (lastTool.result?.toolResults) {
            finalToolResults = lastTool.result.toolResults;
          } else {
            finalToolResults = toolsUsedLog;
          }
        }

        return {
          response: responseText,
          model: this.modelName,
          toolsUsed: functionCallCount,
          toolResults: finalToolResults,
          toolsUsedLog,
          estimatedTokens: completion.usage?.total_tokens || 0,
        };

      } catch (catchError) {
        const errorMessage = catchError.message || '';
        const is429 = errorMessage.includes('429') || errorMessage.includes('rate') || errorMessage.includes('quota');
        const is503 = errorMessage.includes('503') || errorMessage.includes('overloaded');

        if ((is429 || is503) && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const responseTime = Date.now() - startTime;
        errorCategory = is429 ? ERROR_CATEGORIES.API_RATE_LIMIT : ERROR_CATEGORIES.API_ERROR;

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

    throw new Error('All retry attempts exhausted');
  }

  /**
   * Build system prompt optimized for tool use - LEAN VERSION
   * Best practice: Keep prompt short, load details on-demand
   */
  buildSystemPromptForTools(context) {
    const profile = context.userProfile || {};

    // Build minimal user context (only what's relevant)
    const userContext = [
      profile.primaryGoal && `Goal: ${Array.isArray(profile.primaryGoal) ? profile.primaryGoal[0] : profile.primaryGoal}`,
      profile.experienceLevel && `Level: ${profile.experienceLevel}`,
      profile.equipmentAccess?.length > 0 && `Equipment: ${profile.equipmentAccess.slice(0, 5).join(', ')}`,
      profile.injuries?.length > 0 && `Injuries: ${profile.injuries.join(', ')}`,
      profile.dislikedExercises?.length > 0 && `Avoid: ${profile.dislikedExercises.join(', ')}`,
    ].filter(Boolean).join('\n');

    // Nutrition context (only if on nutrition screen)
    const nutritionContext = context.screenSpecific?.calories ? `
Macros today: ${context.screenSpecific.calories.consumed}/${context.screenSpecific.calories.target} cal (${context.screenSpecific.calories.remaining} left)
Protein: ${context.screenSpecific.protein.consumed}g/${context.screenSpecific.protein.target}g` : '';

    const basePrompt = `You are a knowledgeable fitness coach. Think like a real trainer - understand what the user REALLY wants, not just their words.

## How to Think
Before responding, ask: What does the user actually WANT? What's the CONTEXT?
- "best chest pump" → They want high-rep isolation (cable flies, pec deck), not just "chest exercises"
- "what should I eat" → Consider time of day, their goal, remaining macros
- "I'm tired" → Maybe suggest lighter workout or recovery, not a full program

${context.buttonPress ? `## IMMEDIATE ACTION REQUIRED
${context.buttonPress.instruction}
` : ''}
## User Profile
${userContext || 'No profile data'}
${nutritionContext}

## Response Style
- 2-3 sentences MAX (unless listing exercises)
- Be specific: exact exercises, weights, reps
- Sound like a knowledgeable friend
- NO fluff: "Great question!", "I'd love to help"
- Exercise format: "• Exercise - Sets×Reps"

## Tools Available
- generateWorkoutPlan: Create workouts (use profile data automatically)
- recommendTodaysWorkout: Analyze history, suggest what to train
- calculate1RM: Estimate max from weight×reps
- getProgressiveOverloadAdvice: Recommend next session's weight
- savePlannedWorkout: Save generated workout
- replaceExerciseInWorkout: Swap exercises
- Nutrition tools: suggestMeal, getNutritionStatus, generateRecipe

## Key Rules
1. QUESTIONS → Give advice (don't use tools): "What should I do?", "Which is better?"
2. COMMANDS → Use tools: "Create workout", "Save it", "Start now"
3. Button phrases ("Push workout", "Pull workout", "Leg workout") → Generate immediately, no confirmation
4. Always use profile data - don't ask what they already told you
5. When generating workouts: respect dislikedExercises, use available equipment

${context.lastGeneratedWorkout ? `## Last Generated Workout
"${context.lastGeneratedWorkout.title}" - ${context.lastGeneratedWorkout.totalExercises} exercises
User can say "save it" to save this workout.` : ''}`;

    return basePrompt;
  }

  // Get screen-specific coaching personality
  getScreenPersonality(screen) {
    if (!screen) return 'Give specific, actionable advice.';

    if (screen.includes('Workout') || screen.includes('StartWorkout') || screen.includes('Training')) {
      return `Workout advice: Give ONE weight recommendation based on last session. Format: "Try **[weight]x[reps]**" with brief reason. NEVER mention PR/volume/history unless directly asked.`;
    }

    if (screen.includes('Nutrition') || screen.includes('Food')) {
      return `Nutrition advice: ALWAYS start with visual progress bars, then suggest food. Format:
"📊 Macros Today:
Calories: [████████░░] 80% (1600/2000)
Protein: [██████░░░░] 60% (90g/150g)

Try **[amount] [food]** (**Xg P**, **Xg C**, **Xg F**, **X cal**)."`;
    }

    if (screen.includes('Progress')) {
      return `Progress advice: Show before→after with difference. Format: "**[weight1]x[reps]** → **[weight2]x[reps]** (**+X lbs**)". ONE sentence.`;
    }

    if (screen.includes('Profile') || screen.includes('Home')) {
      return `Home advice: Direct action only. Format: "Train [muscle] today: **[exercise] [weight]x[reps]**". ONE sentence.`;
    }

    return 'Be ultra specific with numbers and examples. No generic advice.';
  }

  // Map user's primary goal to workout goal
  mapGoalToWorkoutGoal(primaryGoal) {
    const goalMap = {
      'muscle gain': 'hypertrophy',
      'weight loss': 'endurance',
      'strength': 'strength',
      'general fitness': 'general',
      'cut': 'hypertrophy', // Maintain muscle during cut
      'recomp': 'hypertrophy', // Build muscle during recomp
    };
    return goalMap[primaryGoal] || 'hypertrophy';
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
"**185x5** → **205x5** (**+20 lbs**)." (1 sentence)

${AI_TERMINOLOGY.getTerminologyPrompt()}`;



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

      // Nutrition context - Show current status with visual bar
      if (ss.calories) {
        const currentHour = new Date().getHours();
        const dayProgress = Math.round((currentHour / 24) * 100);

        // Create simple progress bar
        const createBar = (percent) => {
          const filled = Math.min(Math.floor(percent / 10), 10);
          return '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';
        };

        contextPrompt += `\nTime: ${currentHour}:00 (${dayProgress}% through day)`;
        contextPrompt += `\nCalories: ${createBar(ss.calories.percentage)} ${ss.calories.percentage}% (${ss.calories.consumed}/${ss.calories.target})`;
        contextPrompt += `\nProtein: ${createBar(ss.protein.percentage)} ${ss.protein.percentage}% (${ss.protein.consumed}g/${ss.protein.target}g)`;

        // Get user's goal from context
        const userGoal = context.userProfile?.primaryGoal;
        const isCutting = userGoal && (userGoal.includes('loss') || userGoal.includes('cut') || userGoal.includes('lean'));
        const isBulking = userGoal && (userGoal.includes('gain') || userGoal.includes('bulk') || userGoal.includes('muscle'));

        // Smart meal timing warning based on goal
        if (currentHour >= 19 && ss.calories.remaining > 1000) {
          if (isCutting) {
            contextPrompt += `\n✅ CUTTING + HIGH REMAINING: ${ss.calories.remaining} cal left is GOOD for cutting! User can have satisfying dinner and stay in deficit.`;
          } else if (isBulking) {
            contextPrompt += `\n⚠️ BULKING + HIGH REMAINING: ${ss.calories.remaining} cal left at ${currentHour}:00 is a problem for bulking! Advise calorie-dense foods (nuts, shakes, peanut butter).`;
          } else {
            contextPrompt += `\n⚠️ LATE + HIGH REMAINING: ${ss.calories.remaining} cal left at ${currentHour}:00 is too much for one meal. Advise lighter dinner.`;
          }
        }
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
