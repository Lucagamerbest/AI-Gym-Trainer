import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectIntent, executeAction } from './AIActions';

class AIService {
  constructor() {
    // Initialize with API key - we'll get this from environment or config
    this.apiKey = null;
    this.genAI = null;
    this.model = null;
    // Using Gemini 2.5 Flash (now optimized with smaller prompts for speed)
    this.modelName = 'gemini-2.5-flash';
  }

  // Initialize the AI service with API key
  initialize(apiKey) {
    if (!apiKey) {
      console.error('❌ No API key provided for Gemini');
      throw new Error('Gemini API key is required');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });

    console.log('✅ Gemini AI initialized');
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
      console.log(`🎯 Intent detected:`, intentResult);

      // Step 2: Execute action if detected
      let actionResult = null;
      if (intentResult.intent !== 'ANSWER_QUESTION') {
        actionResult = await executeAction(intentResult.intent, intentResult.parameters, context);
        console.log(`✅ Action executed:`, actionResult);

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
      let lengthInstruction = '';
      if (context.screen === 'WorkoutScreen' || context.screen === 'StartWorkoutScreen') {
        lengthInstruction = '\n\nIMPORTANT: User is in the gym. Keep it short but include specific numbers/weights.';
      } else {
        lengthInstruction = '\n\nGive 3-4 sentences with SPECIFIC examples and numbers. No fluff, all actionable info.';
      }

      // Combine system prompt and user message
      const fullPrompt = `${systemPrompt}${lengthInstruction}\n\nUser: ${userMessage}`;

      // Log context size for optimization tracking
      const promptSize = fullPrompt.length;
      const estimatedTokens = Math.ceil(promptSize / 4);
      console.log(`📤 Prompt: ${promptSize} chars (~${estimatedTokens} tokens)`);
      console.log(`⏱️ Calling Gemini API...`);

      const apiStart = performance.now();
      const result = await this.model.generateContent(fullPrompt, {
        generationConfig: {
          maxOutputTokens: 200, // Allow detailed responses with specific examples and numbers
          temperature: 0.5, // Lower = faster, more deterministic
          topP: 0.9,
          topK: 20, // Lower = faster
        },
      });
      const apiTime = performance.now() - apiStart;
      console.log(`⏱️ Gemini API responded in ${apiTime.toFixed(0)}ms`);
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

      console.log('🤖 Sending conversation to Gemini...');

      const systemPrompt = this.buildSystemPrompt(context);

      // Start a chat session
      const chat = this.model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          maxOutputTokens: 300, // Allow detailed responses with specific examples
          temperature: 0.5, // More deterministic for specific advice
        },
      });

      // Add system context to the latest message
      const lastMessage = messages[messages.length - 1];
      const specificInstruction = '\n\nRemember: Give SPECIFIC examples with EXACT numbers and quantities. NO generic advice.';
      const messageWithContext = `${systemPrompt}${specificInstruction}\n\n${lastMessage.content}`;

      const result = await chat.sendMessage(messageWithContext);
      const response = result.response;
      const responseText = response.text();

      console.log('✅ Gemini response received');

      return {
        response: responseText,
        model: this.modelName,
      };
    } catch (error) {
      console.error('❌ AI service error:', error);
      throw error;
    }
  }

  // Get screen-specific coaching personality
  getScreenPersonality(screen) {
    if (!screen) return 'Give specific, actionable advice with exact numbers and examples.';

    if (screen.includes('Workout') || screen.includes('StartWorkout') || screen.includes('Training')) {
      return 'Give SPECIFIC weight recommendations. Example: "Try 185 lbs for 3x5" NOT "increase weight a bit". Use actual numbers based on their PRs and last session.';
    }

    if (screen.includes('Nutrition') || screen.includes('Food')) {
      return 'Give SPECIFIC food examples with EXACT quantities. Example: "8oz chicken breast (56g protein), 1 cup Greek yogurt (20g protein), 2 scoops whey (50g protein)" NOT generic advice like "eat lean protein". Always list 3-4 specific food options with quantities and macro breakdown.';
    }

    if (screen.includes('Progress')) {
      return 'Show EXACT numbers. Example: "Bench went from 185x5 to 205x5, that\'s a 20 lb increase" NOT "you\'re getting stronger". Use actual weights, reps, and dates.';
    }

    if (screen.includes('Profile') || screen.includes('Home')) {
      return 'Give specific next steps with numbers. Example: "Hit chest 2x this week, aim for 225 lb bench PR" NOT "keep up the good work".';
    }

    return 'Be ultra specific with numbers and examples. No generic advice.';
  }

  // Build system prompt based on context
  buildSystemPrompt(context) {
    const screenPersonality = this.getScreenPersonality(context.screen);

    const basePrompt = `You are a direct, no-BS fitness coach for gym bros. ${screenPersonality}

STRICT RULES:
- ALWAYS include specific numbers, quantities, and examples
- NO generic advice like "eat protein" - give EXACT foods with amounts
- NO vague terms like "a bit more" - use precise numbers
- List 3-4 specific options when suggesting foods/exercises
- Keep it short (3-4 sentences) but PACKED with specifics
- Talk like a gym bro - direct, practical, actionable`;


    // Add context-specific instructions (MINIMAL for speed)
    let contextPrompt = '';

    // Recent activity summary
    if (context.recentActivity) {
      const { workouts, totalVolume, lastWorkout } = context.recentActivity;
      contextPrompt += `\nLast 7d: ${workouts} workouts, ${totalVolume} lbs. Last: ${lastWorkout}`;
    }

    // Top exercises (only if asking about exercises)
    if (context.topExercises && context.topExercises.length > 0) {
      contextPrompt += `\nTop lifts: `;
      contextPrompt += context.topExercises.map(ex =>
        `${ex.name} PR ${ex.pr?.display || 'N/A'}`
      ).join(', ');
    }

    // Screen-specific context (simplified)
    if (context.screenSpecific && Object.keys(context.screenSpecific).length > 0) {
      const ss = context.screenSpecific;

      // Nutrition context
      if (ss.calories) {
        const calPercent = ss.calories.percentage || 0;
        const proteinPercent = ss.protein?.percentage || 0;

        // Show consumed amounts
        contextPrompt += `\nEaten today: ${ss.calories.consumed} cal, ${ss.protein?.consumed || 0}g protein, ${ss.carbs?.consumed || 0}g carbs, ${ss.fat?.consumed || 0}g fat`;

        // Show daily goals
        contextPrompt += `\nDaily goals: ${ss.calories.target} cal, ${ss.protein?.target || 0}g protein, ${ss.carbs?.target || 0}g carbs, ${ss.fat?.target || 0}g fat`;

        // Show remaining amounts (most important for AI advice)
        const caloriesLeft = ss.calories.remaining || 0;
        const proteinLeft = ss.protein?.remaining || 0;
        const carbsLeft = ss.carbs?.remaining || 0;
        const fatLeft = ss.fat?.remaining || 0;

        if (caloriesLeft > 0) {
          contextPrompt += `\nStill need today: ${caloriesLeft} cal, ${proteinLeft}g protein, ${carbsLeft}g carbs, ${fatLeft}g fat`;
        } else {
          contextPrompt += `\nOver by: ${Math.abs(caloriesLeft)} cal`;
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

      console.log(`🔍 Testing with model: ${this.modelName}`);

      const result = await this.sendMessage(
        'Hello! Can you introduce yourself in one sentence?',
        { screen: 'TestScreen' }
      );
      console.log('✅ AI connection test successful');
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
