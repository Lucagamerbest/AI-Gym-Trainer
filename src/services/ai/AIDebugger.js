/**
 * AIDebugger - Comprehensive AI interaction logging and error tracking
 *
 * This captures EVERY AI interaction with enough detail to reproduce bugs
 * and identify patterns that cause failures.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_DEBUG_LOG_KEY = '@ai_debug_log';
const MAX_LOG_ENTRIES = 100; // Keep last 100 interactions

/**
 * Error Categories - Group similar issues together
 */
export const ERROR_CATEGORIES = {
  // Tool Execution Errors
  TOOL_NOT_FOUND: 'tool_not_found',
  TOOL_EXECUTION_FAILED: 'tool_execution_failed',
  TOOL_MISSING_PARAMS: 'tool_missing_params',
  TOOL_INVALID_RESULT: 'tool_invalid_result',

  // Data Errors
  NO_ACTIVE_WORKOUT: 'no_active_workout',
  NO_USER_PROFILE: 'no_user_profile',
  DATA_NOT_FOUND: 'data_not_found',
  INVALID_DATA_FORMAT: 'invalid_data_format',

  // AI Response Errors
  NO_FUNCTION_CALL: 'no_function_call',
  WRONG_TOOL_SELECTED: 'wrong_tool_selected',
  INCOMPLETE_RESPONSE: 'incomplete_response',
  HALLUCINATED_DATA: 'hallucinated_data',

  // Context Errors
  MISSING_CONTEXT: 'missing_context',
  STALE_CONTEXT: 'stale_context',

  // API Errors
  API_TIMEOUT: 'api_timeout',
  API_RATE_LIMIT: 'api_rate_limit',
  API_ERROR: 'api_error',

  // User Experience Issues
  RESPONSE_TOO_LONG: 'response_too_long',
  RESPONSE_TOO_VAGUE: 'response_too_vague',
  WRONG_INTENT_DETECTED: 'wrong_intent_detected',
};

/**
 * Log an AI interaction with full context
 */
export async function logAIInteraction({
  userMessage,
  aiResponse,
  toolsUsed = [],
  context = {},
  success = true,
  error = null,
  errorCategory = null,
  metadata = {},
}) {
  try {
    const logEntry = {
      id: `ai_log_${Date.now()}`,
      timestamp: new Date().toISOString(),

      // User Input
      userMessage,
      messageLength: userMessage.length,

      // AI Output
      aiResponse,
      responseLength: aiResponse?.length || 0,

      // Tools
      toolsUsed: toolsUsed.map(tool => ({
        name: tool.name,
        params: tool.params,
        result: tool.result,
        executionTime: tool.executionTime,
        success: tool.success,
      })),
      toolCount: toolsUsed.length,

      // Context (what the AI knew)
      context: {
        screen: context.screen,
        hasUserProfile: !!context.userProfile,
        hasWorkoutHistory: !!context.recentActivity,
        hasExerciseData: !!context.exerciseSpecific,
        profileAge: context.userProfile?.age,
        profileGender: context.userProfile?.gender,
        profileGoals: context.userProfile?.primaryGoal,
      },

      // Outcome
      success,
      error: error ? {
        message: error.message,
        stack: error.stack,
        category: errorCategory,
      } : null,

      // Metadata
      metadata: {
        modelName: metadata.modelName || 'gemini-2.5-flash',
        estimatedTokens: metadata.estimatedTokens,
        responseTime: metadata.responseTime,
        ...metadata,
      },
    };

    // Save to log
    const existingLog = await AsyncStorage.getItem(AI_DEBUG_LOG_KEY);
    const log = existingLog ? JSON.parse(existingLog) : [];

    // Add new entry at beginning
    log.unshift(logEntry);

    // Keep only last MAX_LOG_ENTRIES
    const trimmedLog = log.slice(0, MAX_LOG_ENTRIES);

    await AsyncStorage.setItem(AI_DEBUG_LOG_KEY, JSON.stringify(trimmedLog));

    // Also log to console in dev mode
    if (__DEV__) {
      if (success) {
        console.log('✅ AI Interaction Logged:', {
          message: userMessage.substring(0, 50) + '...',
          tools: toolsUsed.length,
          responseLength: aiResponse?.length,
        });
      } else {
        console.error('❌ AI Interaction Failed:', {
          message: userMessage.substring(0, 50) + '...',
          error: errorCategory,
          details: error?.message,
        });
      }
    }

    return logEntry.id;
  } catch (error) {
    console.error('Failed to log AI interaction:', error);
    return null;
  }
}

/**
 * Get all logged interactions
 */
export async function getAIDebugLog() {
  try {
    const log = await AsyncStorage.getItem(AI_DEBUG_LOG_KEY);
    return log ? JSON.parse(log) : [];
  } catch (error) {
    console.error('Failed to get AI debug log:', error);
    return [];
  }
}

/**
 * Get failed interactions only
 */
export async function getFailedInteractions() {
  try {
    const log = await getAIDebugLog();
    return log.filter(entry => !entry.success);
  } catch (error) {
    console.error('Failed to get failed interactions:', error);
    return [];
  }
}

/**
 * Get interactions by error category
 */
export async function getInteractionsByCategory(category) {
  try {
    const log = await getAIDebugLog();
    return log.filter(entry => entry.error?.category === category);
  } catch (error) {
    console.error('Failed to get interactions by category:', error);
    return [];
  }
}

/**
 * Get error statistics
 */
export async function getErrorStatistics() {
  try {
    const log = await getAIDebugLog();

    const stats = {
      totalInteractions: log.length,
      successfulInteractions: log.filter(e => e.success).length,
      failedInteractions: log.filter(e => !e.success).length,
      successRate: 0,

      // Error breakdown
      errorsByCategory: {},

      // Tool usage
      toolUsageCount: {},
      toolFailureCount: {},

      // Average metrics
      avgResponseLength: 0,
      avgToolsUsed: 0,
      avgResponseTime: 0,
    };

    // Calculate success rate
    stats.successRate = log.length > 0
      ? ((stats.successfulInteractions / stats.totalInteractions) * 100).toFixed(1)
      : 0;

    // Count errors by category
    log.forEach(entry => {
      if (entry.error?.category) {
        stats.errorsByCategory[entry.error.category] =
          (stats.errorsByCategory[entry.error.category] || 0) + 1;
      }

      // Count tool usage
      entry.toolsUsed?.forEach(tool => {
        stats.toolUsageCount[tool.name] = (stats.toolUsageCount[tool.name] || 0) + 1;
        if (!tool.success) {
          stats.toolFailureCount[tool.name] = (stats.toolFailureCount[tool.name] || 0) + 1;
        }
      });
    });

    // Calculate averages
    if (log.length > 0) {
      stats.avgResponseLength = Math.round(
        log.reduce((sum, e) => sum + (e.responseLength || 0), 0) / log.length
      );
      stats.avgToolsUsed = (
        log.reduce((sum, e) => sum + (e.toolCount || 0), 0) / log.length
      ).toFixed(1);
      stats.avgResponseTime = Math.round(
        log.reduce((sum, e) => sum + (e.metadata?.responseTime || 0), 0) / log.length
      );
    }

    return stats;
  } catch (error) {
    console.error('Failed to get error statistics:', error);
    return null;
  }
}

/**
 * Export debug log as formatted text for bug reports
 */
export async function exportDebugLog(includeSuccessful = false) {
  try {
    const log = await getAIDebugLog();
    const filtered = includeSuccessful ? log : log.filter(e => !e.success);

    let report = '# AI Debug Log Export\n\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Entries: ${filtered.length}\n\n`;

    filtered.forEach((entry, index) => {
      report += `## Entry ${index + 1} - ${entry.success ? '✅ Success' : '❌ Failed'}\n`;
      report += `**Time:** ${entry.timestamp}\n`;
      report += `**User Message:** ${entry.userMessage}\n`;
      report += `**AI Response:** ${entry.aiResponse || 'N/A'}\n`;

      if (entry.toolsUsed.length > 0) {
        report += `**Tools Used:** ${entry.toolsUsed.map(t => t.name).join(', ')}\n`;
      }

      if (entry.error) {
        report += `**Error Category:** ${entry.error.category}\n`;
        report += `**Error Message:** ${entry.error.message}\n`;
      }

      report += `**Context:** Screen=${entry.context.screen}, HasProfile=${entry.context.hasUserProfile}\n`;
      report += '\n---\n\n';
    });

    return report;
  } catch (error) {
    console.error('Failed to export debug log:', error);
    return null;
  }
}

/**
 * Clear debug log (for testing or privacy)
 */
export async function clearDebugLog() {
  try {
    await AsyncStorage.removeItem(AI_DEBUG_LOG_KEY);
    console.log('✅ AI debug log cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear debug log:', error);
    return false;
  }
}

/**
 * Create a shareable bug report from a specific interaction
 */
export function createBugReport(logEntry) {
  const report = {
    title: `AI Bug: ${logEntry.error?.category || 'Unknown Error'}`,

    description: `
## Bug Description
${logEntry.error?.message || 'AI interaction failed'}

## User Message
\`\`\`
${logEntry.userMessage}
\`\`\`

## Expected Behavior
[Describe what should have happened]

## Actual Behavior
${logEntry.aiResponse || 'No response received'}

## Error Details
- **Category:** ${logEntry.error?.category || 'N/A'}
- **Error Message:** ${logEntry.error?.message || 'N/A'}

## Context
- **Screen:** ${logEntry.context.screen}
- **Has User Profile:** ${logEntry.context.hasUserProfile}
- **User Goals:** ${logEntry.context.profileGoals?.join(', ') || 'N/A'}
- **Tools Used:** ${logEntry.toolsUsed.map(t => t.name).join(', ') || 'None'}

## Tool Execution Details
${logEntry.toolsUsed.map(tool => `
### ${tool.name}
- **Success:** ${tool.success}
- **Params:** ${JSON.stringify(tool.params, null, 2)}
- **Result:** ${JSON.stringify(tool.result, null, 2)}
`).join('\n')}

## Reproduction Steps
1. User says: "${logEntry.userMessage}"
2. AI should call tools: ${logEntry.toolsUsed.map(t => t.name).join(' → ')}
3. Error occurs: ${logEntry.error?.category}

## Environment
- **Timestamp:** ${logEntry.timestamp}
- **Model:** ${logEntry.metadata.modelName}
- **Response Time:** ${logEntry.metadata.responseTime}ms

---
*Auto-generated bug report - ID: ${logEntry.id}*
`,
  };

  return report;
}

export default {
  logAIInteraction,
  getAIDebugLog,
  getFailedInteractions,
  getInteractionsByCategory,
  getErrorStatistics,
  exportDebugLog,
  clearDebugLog,
  createBugReport,
  ERROR_CATEGORIES,
};
