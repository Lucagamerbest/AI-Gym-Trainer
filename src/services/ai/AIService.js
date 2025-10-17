import { GoogleGenerativeAI } from '@google/generative-ai';
import { detectIntent, executeAction } from './AIActions';

class AIService {
  constructor() {
    // Initialize with API key - we'll get this from environment or config
    this.apiKey = null;
    this.genAI = null;
    this.model = null;
    // Using Gemini 2.5 Flash - fast, free, and stable
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
        lengthInstruction = '\n\nIMPORTANT: User is in the gym working out. Keep response to 1-2 sentences MAX. Be ultra concise.';
      } else if (context.screen === 'HomeScreen' || context.screen === 'Home') {
        lengthInstruction = '\n\nKeep response to 2-4 sentences. Be helpful but concise.';
      }

      // Combine system prompt and user message
      const fullPrompt = `${systemPrompt}${lengthInstruction}\n\nUser: ${userMessage}`;

      // Log context size for optimization tracking
      const promptSize = fullPrompt.length;
      const estimatedTokens = Math.ceil(promptSize / 4);
      console.log(`🤖 Sending to Gemini... (${promptSize} chars, ~${estimatedTokens} tokens)`);

      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const responseText = response.text();

      console.log('✅ Gemini response received');

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
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      // Add system context to the latest message
      const lastMessage = messages[messages.length - 1];
      const messageWithContext = `${systemPrompt}\n\n${lastMessage.content}`;

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
    if (!screen) return '';

    if (screen.includes('Workout') || screen.includes('StartWorkout') || screen.includes('Training')) {
      return `WORKOUT COACH MODE:
- Focus on progressive overload (add weight/reps when ready)
- Recommend specific weight increases (5-10 lbs typically)
- Suggest optimal set/rep ranges based on their history
- Warn about volume management (don't overtrain)
- Emphasize proper form and recovery`;
    }

    if (screen.includes('Nutrition') || screen.includes('Food')) {
      return `NUTRITION COACH MODE:
- Calculate remaining macros precisely
- Suggest specific meals/foods to hit targets
- Warn if too far from goals (over/under eating)
- Recommend meal timing around workouts
- Focus on protein intake for muscle building`;
    }

    if (screen.includes('Progress')) {
      return `PROGRESS ANALYST MODE:
- Identify specific strength gains with numbers
- Point out plateaus and suggest solutions
- Celebrate PRs and improvements
- Recommend program adjustments if needed
- Track consistency and suggest improvements`;
    }

    if (screen.includes('Profile') || screen.includes('Home')) {
      return `GENERAL COACH MODE:
- Give overview of their fitness journey
- Suggest next steps based on recent activity
- Balance workout/nutrition/recovery advice
- Set realistic short-term goals`;
    }

    return '';
  }

  // Build system prompt based on context
  buildSystemPrompt(context) {
    const screenPersonality = this.getScreenPersonality(context.screen);

    const basePrompt = `You are an expert fitness coach and nutritionist assistant for the AI Gym Trainer app.

${screenPersonality}

Core Principles:
- Give SPECIFIC, actionable advice (not generic)
- Use NUMBERS from the user's data when available
- Be encouraging but honest about their progress
- Focus on progressive overload and consistency
- Prioritize safety and proper form

Response Style:
- Keep responses concise (2-3 sentences unless asked for details)
- Use simple, direct language
- Include specific recommendations with numbers
- Reference their actual data when possible
- Be motivating but realistic`;


    // Add context-specific instructions
    let contextPrompt = '';

    if (context.screen) {
      contextPrompt += `\n\nCurrent Screen: ${context.screen}`;
    }

    if (context.userData) {
      contextPrompt += `\n\nUser Profile:\n${JSON.stringify(context.userData, null, 2)}`;
    }

    if (context.recentActivity) {
      const { workouts, totalVolume, detailedWorkouts, avgCaloriesPerDay, lastWorkout } = context.recentActivity;

      contextPrompt += `\n\nRecent Activity (Last 7 Days):`;
      contextPrompt += `\n- Total Workouts: ${workouts}`;
      contextPrompt += `\n- Total Volume: ${totalVolume} lbs`;
      contextPrompt += `\n- Avg Calories/Day: ${avgCaloriesPerDay}`;

      if (detailedWorkouts && detailedWorkouts.length > 0) {
        contextPrompt += `\n\nRecent Workouts:`;
        detailedWorkouts.forEach((workout, idx) => {
          contextPrompt += `\n${idx + 1}. ${workout.title} (${new Date(workout.date).toLocaleDateString()})`;
          contextPrompt += `\n   - ${workout.exerciseCount} exercises, ${Math.round(workout.totalVolume)} lbs volume`;
          if (workout.exercises && workout.exercises.length > 0) {
            contextPrompt += `\n   - Exercises: ${workout.exercises.map(ex =>
              `${ex.name} (${ex.sets} sets, max ${ex.maxWeight} lbs)`
            ).join(', ')}`;
          }
        });
      }
    }

    if (context.topExercises && context.topExercises.length > 0) {
      contextPrompt += `\n\nTop Exercises (by total volume):`;
      context.topExercises.forEach((exercise, idx) => {
        contextPrompt += `\n${idx + 1}. ${exercise.name}`;
        contextPrompt += `\n   - Total Volume: ${Math.round(exercise.totalVolume)} lbs`;
        contextPrompt += `\n   - Sessions: ${exercise.totalSessions}`;
        if (exercise.pr) {
          contextPrompt += `\n   - PR: ${exercise.pr.display}`;
        }
      });
    }

    if (context.screenSpecific) {
      contextPrompt += `\n\nScreen-Specific Data:\n${JSON.stringify(context.screenSpecific, null, 2)}`;
    }

    if (context.exerciseSpecific) {
      contextPrompt += `\n\nExercise-Specific Data:\n${JSON.stringify(context.exerciseSpecific, null, 2)}`;
    }

    // Add RECENT workout history (OPTIMIZED - less data = faster response)
    if (context.allWorkoutHistory && context.allWorkoutHistory.length > 0) {
      contextPrompt += `\n\n=== RECENT WORKOUT HISTORY (last ${context.allWorkoutHistory.length} workouts) ===`;

      // Show workouts with SUMMARY only (not all sets) for speed
      context.allWorkoutHistory.forEach((workout, idx) => {
        contextPrompt += `\n\n${idx + 1}. ${workout.title} - ${new Date(workout.date).toLocaleDateString()}`;
        contextPrompt += `\n   Volume: ${Math.round(workout.totalVolume)} lbs, ${workout.exercises?.length || 0} exercises`;

        if (workout.exercises && workout.exercises.length > 0) {
          // Only show exercise names and key stats (not all sets)
          const exerciseSummary = workout.exercises.map(ex =>
            `${ex.name} (${ex.sets} sets @ ${ex.maxWeight} lbs)`
          ).join(', ');
          contextPrompt += `\n   ${exerciseSummary}`;
        }
      });
    }

    // Add exercise progress (OPTIMIZED - less data = faster response)
    if (context.allExerciseProgress && Object.keys(context.allExerciseProgress).length > 0) {
      contextPrompt += `\n\n=== EXERCISE RECORDS (${Object.keys(context.allExerciseProgress).length} exercises) ===`;

      Object.entries(context.allExerciseProgress).forEach(([exerciseName, data]) => {
        contextPrompt += `\n\n${exerciseName}: ${data.totalSessions} sessions, Max ${data.maxWeight} lbs × ${data.maxReps} reps, Total ${data.totalVolume} lbs`;

        // Show only last 3 records for speed
        if (data.allRecords && data.allRecords.length > 0) {
          const recentRecords = data.allRecords.slice(-3); // Last 3 records only
          contextPrompt += `\n  Recent: `;
          contextPrompt += recentRecords.map(r =>
            `${new Date(r.date).toLocaleDateString()}: ${r.weight}×${r.reps}`
          ).join(', ');
        }
      });
    }

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
