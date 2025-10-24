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
