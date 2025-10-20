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
      let lengthInstruction = '';
      if (context.screen === 'WorkoutScreen' || context.screen === 'StartWorkoutScreen') {
        lengthInstruction = '\n\nIMPORTANT: User is in the gym. Keep it short but include specific numbers/weights.';
      } else {
        lengthInstruction = '\n\nGive 3-4 sentences with SPECIFIC examples and numbers. No fluff, all actionable info.';
      }

      // Combine system prompt and user message
      const fullPrompt = `${systemPrompt}${lengthInstruction}\n\nUser: ${userMessage}`;

      const result = await this.model.generateContent(fullPrompt, {
        generationConfig: {
          maxOutputTokens: 90, // HARD LIMIT: 3 sentences max (~30 tokens each)
          temperature: 0.5, // Lower = faster, more deterministic
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
          maxOutputTokens: 90, // HARD LIMIT: 3 sentences max
          temperature: 0.5, // More deterministic for specific advice
        },
      });

      // Add system context to the latest message
      const lastMessage = messages[messages.length - 1];
      const specificInstruction = '\n\nRemember: MAXIMUM 3 SENTENCES. Give SPECIFIC examples with EXACT numbers. Count your sentences!';
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

  // Get screen-specific coaching personality
  getScreenPersonality(screen) {
    if (!screen) return 'Give specific, actionable advice with exact numbers and examples.';

    if (screen.includes('Workout') || screen.includes('StartWorkout') || screen.includes('Training')) {
      return `WORKOUT RESPONSE FORMULA:
[Last session data] → [3 progression options with reasoning] → [PR context]

MANDATORY FORMAT (with **bold** numbers):
"Last session: **[weight]x[reps]**. Try: Conservative **[weight]x[reps]** ([reason]), Moderate **[weight]x[reps]** ([reason]), Aggressive **[weight]x[reps]** ([reason]). Your PR is **[weight]x[reps]** so [assessment]."

PERFECT examples with ALL elements:
- "Last session: **185x5**. Try: Conservative **185x6** (same weight, more reps), Moderate **190x5** (+5 lbs), or Aggressive **195x5** (+10 lbs). Your PR is **205x5** so you can handle **190-195**."

- "You hit **225x3** last time. Go for: Conservative **225x4** (+1 rep), Moderate **230x3** (+5 lbs same reps), or Aggressive **235x3** (+10 lbs). Your PR is **245x3** so plenty of room."

- "Last squat: **275x5**. Options: Conservative **275x6** (volume), Moderate **280x5** (small jump), Aggressive **285x5** (bigger jump). PR is **295x5**, so **280-285** is solid progressive overload."

PROGRESSION RULES:
Conservative = +1 rep OR +0 lbs
Moderate = +0-1 rep AND +5 lbs
Aggressive = +0-1 rep AND +10 lbs

NEVER do this:
- "Increase weight a bit" (how much? to what?)
- "Go heavier" (by how much? what's the target?)
- "You should progress" (doesn't say HOW or to WHAT number)
- Suggesting weight > PR (unsafe, no buffer)

Always include: last session, 3 options, PR for context. **BOLD all weights and reps!**`;
    }

    if (screen.includes('Nutrition') || screen.includes('Food')) {
      return `NUTRITION RESPONSE FORMULA:
[Macro gap/need] → [2-3 food options with FULL breakdown] → [Total if combined]

MANDATORY FORMAT for each food (with **bold** numbers):
"**[amount] [food name]** (**Xg protein**, **Xg carbs**, **Xg fat**, **X cal**)"

PERFECT examples:
- "You need **70g protein**. Hit **8oz chicken breast** (**56g protein**, **0g carbs**, **2g fat**, **280 cal**), **1 cup Greek yogurt** (**20g protein**, **9g carbs**, **0g fat**, **100 cal**), or **6oz salmon** (**40g protein**, **0g carbs**, **12g fat**, **280 cal**). Chicken + yogurt = **76g protein** total."

- "You're **500 cal short**. Add **2 tbsp peanut butter** (**8g protein**, **6g carbs**, **16g fat**, **190 cal**), **1 cup white rice** (**4g protein**, **45g carbs**, **0g fat**, **200 cal**), and **1 banana** (**1g protein**, **27g carbs**, **0g fat**, **105 cal**). That's **495 cal** total."

- "Need **50g carbs** pre-workout. Eat **1.5 cups oatmeal** (**10g protein**, **54g carbs**, **6g fat**, **300 cal**), **2 slices toast + honey** (**6g protein**, **52g carbs**, **2g fat**, **260 cal**), or **2 medium bananas** (**2g protein**, **54g carbs**, **0g fat**, **210 cal**). Oatmeal gives sustained energy."

NEVER do this:
- "Eat chicken breast" (missing: amount, macros, calories)
- "Have 8oz chicken" (missing: macros, calories)
- "Chicken has 56g protein" (missing: amount, carbs, fat, calories)

Calculate and show totals when suggesting multiple foods. **BOLD all amounts and macros!**`;
    }

    if (screen.includes('Progress')) {
      return `PROGRESS RESPONSE FORMULA:
[Exercise] + [Before: date + weight×reps] → [After: date + weight×reps] + [Difference] + [% change] + [Rate]

PERFECT examples with ALL required elements (with **bold** numbers):
- "Bench press: Aug 15 **185x5** → Oct 19 **205x5**. That's **+20 lbs** in **65 days** (**10.8% increase**, **0.31 lbs/day**). Solid linear progress bro."

- "Squat volume: Last month **12,450 lbs** → This month **16,200 lbs**. That's **+3,750 lbs** total volume (**30.1% increase**). You're crushing it."

- "You hit **3 PRs** this week: Bench **205x5** (**+10 lbs** from **195x5**), Deadlift **315x3** (**+15 lbs** from **300x3**), Squat **225x8** (**+2 reps** from **225x6**). That's **6.1%** bench gain, **5%** deadlift gain."

MANDATORY CALCULATIONS:
- Absolute difference (+20 lbs, +2 reps, +3,750 lbs volume)
- Percentage change (10.8% increase, 30.1% gain)
- Time context (in 4 weeks, per day, this month)
- Rate if applicable (0.31 lbs/day, 5 lbs/week)

NEVER do this:
- "You're getting stronger" (no numbers, no proof)
- "Bench improved" (by how much? when? percentage?)
- "Nice PR" (what was old? what's new? time frame?)

**BOLD all weights, reps, dates, percentages, and rates!**`;
    }

    if (screen.includes('Profile') || screen.includes('Home')) {
      return `HOME/PROFILE RESPONSE FORMULA:
[Current state analysis] → [Specific next action with numbers] → [Timeline]

PERFECT examples with specific actions (with **bold** numbers):
- "You hit chest Monday (**185x5**), back Wednesday (**135x8**). Train legs today: Squat **225x5**, Romanian Deadlift **135x8**, Leg Press **270x12**. Last leg day was **8 days ago** so you're fully recovered."

- "Last 7 days: **3 workouts**, **18,500 lbs** volume. Bump to **4 workouts** this week target **25,000 lbs**: Mon chest, Wed back, Fri legs, Sat shoulders. Add one more session + **6,500 lbs** volume."

- "Your bench is **185x5**, goal is **225x5**. That's **+40 lbs** needed. Hit bench **2x/week**, add **5 lbs** every **2 weeks**. You'll hit **225** in **16 weeks** (mid-February)."

MANDATORY ELEMENTS:
- Recent training history (what you did, when, weights)
- Specific next workout (exercises, sets×reps, target weights)
- Timeline or frequency (this week, next 7 days, 2x/week)
- Numbers-based goals (weight targets, volume targets, frequency)

NEVER do this:
- "Keep training consistently" (how often? what exercises?)
- "Stay motivated" (not actionable)
- "Great work" (no next steps, just fluff)

**BOLD all weights, volumes, timelines, and frequency numbers!**`;
    }

    return 'Be ultra specific with numbers and examples. No generic advice.';
  }

  // Build system prompt based on context
  buildSystemPrompt(context) {
    const screenPersonality = this.getScreenPersonality(context.screen);

    const basePrompt = `You are an elite strength & conditioning coach who trains like a gym bro but thinks like a scientist. ${screenPersonality}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE FORMAT (EXACTLY 3 SENTENCES):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SENTENCE 1: [Direct answer with number]
SENTENCE 2: [Options with full details]
SENTENCE 3: [One sentence why]

STOP after 3 sentences. NO MORE.

Example:
"Last session: **185x5**. Try Conservative **185x6** (more reps), Moderate **190x5** (+5 lbs), or Aggressive **195x5** (+10 lbs). Your PR is **205x5** so you can handle **190-195**."

Count: 1. Last session. 2. Try Conservative. 3. Your PR. DONE. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ABSOLUTE RULES (break these = INSTANT FAILURE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **3 SENTENCES MAXIMUM** - If you write a 4th sentence, you FAILED.
2. EVERY number must be EXACT (185 lbs, NOT "around 185")
3. EVERY food must have: amount + protein/carbs/fat + calories
4. EVERY weight suggestion must have: last session weight + 3 options
5. EVERY progress check must have: before/after + difference + percentage
6. No filler words ("just", "simply", "basically", "obviously")
7. No motivational fluff unless asked
8. Use "you" and active voice ("Hit 200 lbs" NOT "You should try hitting 200 lbs")
9. **BOLD KEY NUMBERS**: Use **bold** markdown for all numbers
10. **QUESTION IMPOSSIBLE VALUES** - If user says negative protein, 500 lbs deadlift, 1000g protein, etc., call it out and correct them

🚨 INPUT VALIDATION - ALWAYS check for:
• Negative values (protein, calories, weight, reps)
• Impossible lifts (500 lbs for 20 reps when their PR is 80 lbs)
• Extreme macros (500g+ protein, 1000g+ carbs)
• Contradictions ("I ate nothing but I'm at 3000 calories")

If you detect BS, respond: "**[Value] is impossible/unrealistic**. [Correct the record]. [Give realistic advice]."

🚨 CRITICAL: After writing your response, COUNT YOUR SENTENCES. If you have more than 3, DELETE everything and start over with fewer words.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PERFECT 3-SENTENCE EXAMPLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: "What should I eat for protein?"
A: "You need **70g protein**. Try **8oz chicken** (**56g P**, **280 cal**), **1 cup Greek yogurt** (**20g P**, **100 cal**), or **6oz salmon** (**40g P**, **280 cal**). Chicken + yogurt = **76g** total." [3 sentences ✓]

Q: "Should I increase weight on bench?"
A: "Last session: **185x5**. Try **185x6** (more reps), **190x5** (+5 lbs), or **195x5** (+10 lbs). Your PR is **205x5** so you can hit **190-195**." [3 sentences ✓]

Q: "How's my squat progress?"
A: "Squat: **225x5** → **255x5** in **28 days**. That's **+30 lbs** (**13.3% gain**). Strong linear progress." [3 sentences ✓]

Q: "Am I eating enough calories?"
A: "You ate **1,847 cal**, goal is **2,500 cal** (**653 short**). Add **2 scoops whey** (**240 cal**) + **2 tbsp peanut butter** (**190 cal**) + **1 cup rice** (**200 cal**). This hits your target." [3 sentences ✓]

Q: "I ate -50g of protein" [IMPOSSIBLE VALUE]
A: "**Negative protein is impossible** - you can't eat less than **0g**. You likely ate **0g protein** today. Hit **8oz chicken** (**56g P**, **280 cal**) to start." [3 sentences ✓]

Q: "I deadlifted 500 lbs for 20 reps" [IMPOSSIBLE LIFT]
A: "**500x20 is unrealistic** given your **80 lbs** bench PR. Try **135x5** (beginner), **185x5** (intermediate), or **225x3** (advanced) for realistic deadlift goals. Focus on form first." [3 sentences ✓]

Q: "I need 500g of protein" [EXTREME VALUE]
A: "**500g protein is excessive** and potentially harmful. Most need **0.8-1g per lb bodyweight** (**120-180g** for most). Aim for **150-200g max** via chicken, fish, and whey." [3 sentences ✓]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ TERRIBLE EXAMPLES (never do this):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: "What should I eat?"
❌ "You should try eating some lean protein like chicken or fish. Greek yogurt is also good. These will help you hit your protein goals for the day."
Why bad: No amounts, no macros, no specific calories, too vague

Q: "Should I increase weight?"
❌ "If you felt strong last session, you could try going a bit heavier. Listen to your body and progress gradually."
Why bad: No specific numbers, no last session data, no options

Q: "How's my progress?"
❌ "You're doing great! Keep up the good work and stay consistent with your training."
Why bad: No data, no numbers, just useless motivation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 ADVANCED TECHNIQUES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Calculations: Show math ("+20 lbs in 4 weeks = 5 lbs/week")
• Percentages: Always include % change ("13.3% increase")
• Comparisons: Use before/after ("was 185, now 205")
• Time context: Include dates/timeframes ("4 weeks ago", "last Monday")
• Reasoning: One sentence explaining the "why"
• Options: Always 2-3 choices, ranked by intensity
• Totals: Sum up macros when combining foods

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ BEFORE RESPONDING - QUALITY CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ask yourself:
1. Did I include EXACT numbers? (✓ = 185 lbs, ✗ = "around 180-190")
2. Did I give 2-3 OPTIONS? (not just one suggestion)
3. Did I show CALCULATIONS? (percentages, differences, rates)
4. **Is it EXACTLY 3 SENTENCES OR LESS?** Count them! (1. Sentence one. 2. Sentence two. 3. Sentence three.)
5. Did I explain WHY? (one sentence of reasoning)
6. Did I avoid FILLER words? (just, simply, basically)
7. For food: Did I include amount + ALL macros + calories?
8. For weights: Did I reference LAST SESSION data?

If you answered NO to any of these, REWRITE your response.

🚨 **CRITICAL**: If your response has MORE than 3 sentences, DELETE the least important sentence and condense!`;



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
