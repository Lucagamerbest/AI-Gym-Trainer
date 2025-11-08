/**
 * ToolRegistry - Central registry for AI function calling
 *
 * This system allows the AI to use tools/functions to perform actions:
 * - Generate workout plans
 * - Search exercises
 * - Calculate macros
 * - Query database
 * - Perform complex operations
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool that the AI can use
   * @param {string} name - Tool name (e.g., 'generateWorkoutPlan')
   * @param {Object} schema - Gemini function declaration schema
   * @param {Function} handler - Function to execute when tool is called
   */
  registerTool(name, schema, handler) {
    this.tools.set(name, {
      schema,
      handler,
    });
  }

  /**
   * Get all tool schemas for Gemini function calling
   * Returns array of function declarations
   */
  getToolSchemas() {
    return Array.from(this.tools.values()).map(tool => tool.schema);
  }

  /**
   * Execute a tool by name
   * @param {string} name - Tool name
   * @param {Object} args - Tool arguments from AI
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(name, args) {
    // Redirect meal suggestion tools to suggestMeal action for browsable UI
    if (name === 'getMealRecommendation' || name === 'suggestNextMealForBalance') {
      console.log(`🔀 Redirecting ${name} to suggestMeal action for multiple browsable options`);

      // Import suggestMeal action
      const { suggestMeal } = require('../actions/NutritionActions');

      // Determine meal type from args or auto-detect
      let mealType = args.mealType;

      // If no mealType specified, auto-detect from current time
      if (!mealType) {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 11) {
          mealType = 'breakfast';
        } else if (currentHour >= 11 && currentHour < 16) {
          mealType = 'lunch';
        } else if (currentHour >= 16 && currentHour < 22) {
          mealType = 'dinner';
        } else {
          mealType = 'snack';
        }
      }

      // Call suggestMeal with the meal type
      const result = await suggestMeal({ mealType }, {});
      console.log('✅ suggestMeal action completed');

      // Return in tool format with toolResults for UI rendering
      return result;
    }

    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry`);
    }

    try {
      console.log(`🔧 Executing tool: ${name}`, args);
      const result = await tool.handler(args);
      console.log(`✅ Tool ${name} completed`);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${name} failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(name) {
    return this.tools.has(name);
  }

  /**
   * Get tool count
   */
  getToolCount() {
    return this.tools.size;
  }

  /**
   * List all registered tool names
   */
  listTools() {
    return Array.from(this.tools.keys());
  }
}

export default new ToolRegistry();
