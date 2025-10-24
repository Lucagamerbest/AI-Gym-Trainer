/**
 * Automated AI Stress Tester
 *
 * Runs 100+ realistic user questions automatically to find flaws and limitations
 * Reports all failures with categorization
 */

import AIService from './AIService';
import AIDebugger, { ERROR_CATEGORIES } from './AIDebugger';
import { getUserProfileSummary } from '../userProfileAssessment';

/**
 * 100+ Realistic Test Questions
 * Covers all use cases users might ask
 */
export const TEST_QUESTIONS = {
  // ===== WORKOUT GENERATION (15 questions) =====
  workoutGeneration: [
    "Create a chest and triceps workout for hypertrophy",
    "I want a leg day workout for strength",
    "Generate a full body workout for beginners",
    "Plan a push workout with only dumbbells",
    "Create an upper body workout for 45 minutes",
    "I need a back and biceps workout",
    "Generate a shoulder and abs workout",
    "Create a powerlifting leg workout",
    "I want a 30 minute arm workout",
    "Plan a chest workout with just bodyweight",
    "Generate a pull day workout for muscle growth",
    "Create a glutes and hamstrings workout",
    "I need a quick 20 minute full body workout",
    "Plan an advanced chest and back superset workout",
    "Generate a home workout with no equipment",
  ],

  // ===== EXERCISE SEARCH & INFO (15 questions) =====
  exerciseSearch: [
    "Show me all chest exercises",
    "What exercises target the back?",
    "Find exercises for shoulders with dumbbells",
    "What are the best leg exercises?",
    "Show me bicep exercises I can do at home",
    "What exercises work the triceps?",
    "Find alternatives to bench press",
    "What can I do instead of squats?",
    "Show me core exercises",
    "What exercises target the hamstrings?",
    "Find cable exercises for chest",
    "What are good exercises for glutes?",
    "Show me exercises for lower back",
    "What exercises can I do for calves?",
    "Find compound exercises for legs",
  ],

  // ===== WORKOUT TRACKING & LOGGING (15 questions) =====
  workoutTracking: [
    "Start a chest workout",
    "Begin a leg day workout",
    "Add bench press to my workout",
    "Add squats with 3 sets",
    "I just did 185 pounds for 5 reps on bench press",
    "Log 225 lbs for 8 reps on squat",
    "I completed 135x10 on bench",
    "Log my set: 95 pounds, 12 reps, overhead press",
    "I did 3 sets of pull-ups with 10 reps each",
    "Add deadlift to my workout with 4 sets",
    "Log 315 lbs for 5 reps on deadlift",
    "I just finished 205x8 on back squat",
    "Add dumbbell press to my current workout",
    "Log 80 pound dumbbells for 10 reps",
    "I did 50 lbs for 15 reps on cable flyes",
  ],

  // ===== WORKOUT HISTORY & ANALYSIS (12 questions) =====
  workoutHistory: [
    "Show me my recent workouts",
    "What did I do last workout?",
    "Show my last 5 workouts",
    "Analyze my workout history",
    "What muscle groups have I trained this week?",
    "How many workouts did I do this month?",
    "What's my training frequency?",
    "Show me my workout patterns",
    "Which muscles am I neglecting?",
    "What's my most trained muscle group?",
    "How often do I train chest?",
    "Show my workout consistency",
  ],

  // ===== EXERCISE STATS & PRs (12 questions) =====
  exerciseStats: [
    "What's my bench press PR?",
    "Show my squat personal record",
    "What's my best deadlift?",
    "Show me my overhead press PR",
    "What's my pull-up record?",
    "Show my progress on bench press",
    "How much have I improved on squats?",
    "What's my heaviest set on deadlift?",
    "Show my barbell row PR",
    "What's my best incline press?",
    "Show my dumbbell press record",
    "What's my leg press PR?",
  ],

  // ===== NUTRITION & MACROS (15 questions) =====
  nutrition: [
    "Calculate my macros for cutting",
    "What should I eat to bulk?",
    "Calculate my daily calories",
    "I want to lose fat, what macros do I need?",
    "Calculate my protein needs",
    "What's my TDEE?",
    "How many calories should I eat to maintain weight?",
    "Calculate macros for muscle gain",
    "I'm 80kg, 180cm, 25 years old, calculate my macros",
    "What should my macro split be for cutting?",
    "Suggest high protein meals",
    "I need 40g protein, what should I eat?",
    "Suggest a meal with 500 calories",
    "What foods have high protein and low fat?",
    "Calculate macros for 8oz chicken breast",
  ],

  // ===== MEAL LOGGING (8 questions) =====
  mealLogging: [
    "I ate 8oz chicken breast",
    "Log 2 eggs and toast",
    "I just ate 100g rice with salmon",
    "Log my meal: protein shake with banana",
    "I ate a chicken salad",
    "Log 200g ground beef",
    "I just had oatmeal with protein powder",
    "Log 6oz grilled salmon",
  ],

  // ===== PROFILE & GOALS (10 questions) =====
  profile: [
    "Update my weight to 85kg",
    "Change my goal to cutting",
    "Update my age to 26",
    "I want to change my goal to bulking",
    "Update my height to 182cm",
    "Change my workout frequency",
    "Update my experience level to advanced",
    "I want to focus on strength now",
    "Change my primary goal to lose fat",
    "Update my weight to 180 lbs",
  ],

  // ===== RECOMMENDATIONS (8 questions) =====
  recommendations: [
    "Recommend exercises I should try",
    "What exercises should I add to my routine?",
    "Suggest new exercises based on my training",
    "What should I train today?",
    "Recommend a workout split",
    "What muscles should I focus on?",
    "Suggest exercises I haven't tried",
    "What workout should I do next?",
  ],

  // ===== FORM & TECHNIQUE (5 questions) =====
  technique: [
    "How do I do a proper bench press?",
    "What's the correct form for squats?",
    "Explain deadlift technique",
    "How do I do overhead press correctly?",
    "What's proper pull-up form?",
  ],

  // ===== PROGRAMMING & PLANNING (5 questions) =====
  programming: [
    "Should I do push/pull/legs or upper/lower split?",
    "How many days per week should I train?",
    "What's a good workout split for hypertrophy?",
    "How should I structure my training?",
    "What's the best rep range for muscle growth?",
  ],
};

/**
 * Test Configuration
 * Updated to use conservative rate limiting for better reliability
 */
export const TEST_CONFIG = {
  delayBetweenQuestions: 7000, // 7 seconds between questions (~8.5 requests/min, 85% of free tier limit)
  includeContext: true, // Include user profile context
  logResults: true, // Log to AIDebugger
  stopOnCriticalError: false, // Continue even if API fails
  randomizeOrder: false, // Run questions in order
};

/**
 * Test Result
 */
class TestResult {
  constructor() {
    this.totalQuestions = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
    this.warnings = [];
    this.performance = [];
    this.startTime = null;
    this.endTime = null;
    this.byCategory = {};
  }

  addSuccess(category, question, responseTime, toolsUsed) {
    this.successful++;
    this.performance.push({ category, question, responseTime, toolsUsed, success: true });
  }

  addFailure(category, question, error, errorCategory) {
    this.failed++;
    this.errors.push({ category, question, error, errorCategory });
  }

  addWarning(category, question, warning) {
    this.warnings.push({ category, question, warning });
  }

  getSuccessRate() {
    return ((this.successful / this.totalQuestions) * 100).toFixed(1);
  }

  getDuration() {
    return ((this.endTime - this.startTime) / 1000).toFixed(1);
  }

  getAverageResponseTime() {
    if (this.performance.length === 0) return 0;
    const total = this.performance.reduce((sum, p) => sum + p.responseTime, 0);
    return Math.round(total / this.performance.length);
  }

  getSummary() {
    return {
      total: this.totalQuestions,
      successful: this.successful,
      failed: this.failed,
      successRate: this.getSuccessRate() + '%',
      duration: this.getDuration() + 's',
      avgResponseTime: this.getAverageResponseTime() + 'ms',
      errors: this.errors.length,
      warnings: this.warnings.length,
    };
  }

  getDetailedReport() {
    const report = {
      summary: this.getSummary(),

      errorsByCategory: {},
      slowestQueries: [],
      fastestQueries: [],
      toolUsageStats: {},
    };

    // Group errors by category
    this.errors.forEach(err => {
      if (!report.errorsByCategory[err.errorCategory]) {
        report.errorsByCategory[err.errorCategory] = [];
      }
      report.errorsByCategory[err.errorCategory].push({
        question: err.question,
        error: err.error,
      });
    });

    // Sort by response time
    const sorted = [...this.performance].sort((a, b) => b.responseTime - a.responseTime);
    report.slowestQueries = sorted.slice(0, 10);
    report.fastestQueries = sorted.slice(-10).reverse();

    // Tool usage stats
    this.performance.forEach(p => {
      const toolCount = p.toolsUsed || 0;
      report.toolUsageStats[toolCount] = (report.toolUsageStats[toolCount] || 0) + 1;
    });

    return report;
  }
}

/**
 * Run automated stress test
 */
export async function runAutomatedStressTest(
  config = TEST_CONFIG,
  onProgress = null,
  categories = null
) {
  console.log('🤖 Starting Automated AI Stress Test...\n');

  const result = new TestResult();
  result.startTime = Date.now();

  // Determine which categories to test
  const categoriesToTest = categories || Object.keys(TEST_QUESTIONS);

  // Collect all questions
  const allQuestions = [];
  categoriesToTest.forEach(category => {
    TEST_QUESTIONS[category].forEach(question => {
      allQuestions.push({ category, question });
    });
  });

  result.totalQuestions = allQuestions.length;

  console.log(`📊 Testing ${result.totalQuestions} questions across ${categoriesToTest.length} categories\n`);

  // Get user context if enabled
  let context = {};
  if (config.includeContext) {
    const userProfile = await getUserProfileSummary();
    context = {
      screen: 'AIScreen',
      userProfile,
    };
  }

  // Randomize if enabled
  if (config.randomizeOrder) {
    allQuestions.sort(() => Math.random() - 0.5);
  }

  // Run tests
  for (let i = 0; i < allQuestions.length; i++) {
    const { category, question } = allQuestions[i];
    const questionNumber = i + 1;

    console.log(`[${questionNumber}/${result.totalQuestions}] Testing: "${question.substring(0, 50)}..."`);

    try {
      const startTime = Date.now();

      // Send question to AI
      const response = await AIService.sendMessageWithTools(question, context);

      const responseTime = Date.now() - startTime;

      // Validate response
      if (!response || !response.response) {
        result.addFailure(
          category,
          question,
          'No response returned',
          ERROR_CATEGORIES.INCOMPLETE_RESPONSE
        );
        console.log(`  ❌ FAILED: No response\n`);
      } else {
        result.addSuccess(category, question, responseTime, response.toolsUsed);
        console.log(`  ✅ SUCCESS (${responseTime}ms, ${response.toolsUsed || 0} tools)\n`);

        // Check for warnings
        if (responseTime > 5000) {
          result.addWarning(category, question, `Slow response: ${responseTime}ms`);
        }
        if (response.response.length > 1000) {
          result.addWarning(category, question, `Response too long: ${response.response.length} chars`);
        }
      }

      // Progress callback
      if (onProgress) {
        onProgress({
          current: questionNumber,
          total: result.totalQuestions,
          successRate: result.getSuccessRate(),
          category,
          question,
        });
      }

      // Delay between questions
      if (i < allQuestions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenQuestions));
      }

    } catch (error) {
      result.addFailure(
        category,
        question,
        error.message,
        ERROR_CATEGORIES.API_ERROR
      );
      console.log(`  ❌ ERROR: ${error.message}\n`);

      if (config.stopOnCriticalError && error.message.includes('API')) {
        console.log('🛑 Critical API error, stopping test...');
        break;
      }
    }
  }

  result.endTime = Date.now();

  // Generate final report
  const report = result.getDetailedReport();

  console.log('\n' + '='.repeat(60));
  console.log('📊 STRESS TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('\nSummary:');
  console.log(`  Total Questions: ${report.summary.total}`);
  console.log(`  ✅ Successful: ${report.summary.successful}`);
  console.log(`  ❌ Failed: ${report.summary.failed}`);
  console.log(`  📈 Success Rate: ${report.summary.successRate}`);
  console.log(`  ⏱️  Duration: ${report.summary.duration}`);
  console.log(`  ⚡ Avg Response Time: ${report.summary.avgResponseTime}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings}`);

  if (Object.keys(report.errorsByCategory).length > 0) {
    console.log('\n🔍 Errors by Category:');
    Object.entries(report.errorsByCategory).forEach(([category, errors]) => {
      console.log(`  ${category}: ${errors.length} errors`);
    });
  }

  console.log('\n🐌 Slowest Queries:');
  report.slowestQueries.slice(0, 5).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question.substring(0, 50)}... (${q.responseTime}ms)`);
  });

  console.log('\n⚡ Fastest Queries:');
  report.fastestQueries.slice(0, 5).forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question.substring(0, 50)}... (${q.responseTime}ms)`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  return {
    result,
    report,
  };
}

/**
 * Run test for specific category only
 */
export async function testCategory(categoryName, onProgress = null) {
  console.log(`🎯 Testing category: ${categoryName}\n`);
  return runAutomatedStressTest(TEST_CONFIG, onProgress, [categoryName]);
}

/**
 * Run quick test (first 20 questions)
 */
export async function runQuickTest(onProgress = null) {
  console.log('⚡ Running Quick Test (20 questions)...\n');

  const quickQuestions = [];
  Object.keys(TEST_QUESTIONS).forEach(category => {
    quickQuestions.push(...TEST_QUESTIONS[category].slice(0, 2));
  });

  const allQuestions = [];
  Object.keys(TEST_QUESTIONS).forEach(category => {
    TEST_QUESTIONS[category].slice(0, 2).forEach(question => {
      allQuestions.push({ category, question });
    });
  });

  return runAutomatedStressTest(
    { ...TEST_CONFIG, delayBetweenQuestions: 1000 },
    onProgress,
    Object.keys(TEST_QUESTIONS)
  );
}

/**
 * Export test results as markdown
 */
export function exportTestResults(report) {
  const md = `# AI Stress Test Results

## Summary
- **Total Questions:** ${report.summary.total}
- **Successful:** ${report.summary.successful} ✅
- **Failed:** ${report.summary.failed} ❌
- **Success Rate:** ${report.summary.successRate}
- **Duration:** ${report.summary.duration}
- **Avg Response Time:** ${report.summary.avgResponseTime}
- **Warnings:** ${report.summary.warnings}

## Errors by Category

${Object.entries(report.errorsByCategory).map(([category, errors]) => `
### ${category} (${errors.length} errors)

${errors.map(e => `- **Q:** ${e.question}\n  **Error:** ${e.error}`).join('\n')}
`).join('\n')}

## Performance

### Slowest Queries
${report.slowestQueries.slice(0, 10).map((q, i) =>
  `${i + 1}. ${q.question} - ${q.responseTime}ms`
).join('\n')}

### Fastest Queries
${report.fastestQueries.slice(0, 10).map((q, i) =>
  `${i + 1}. ${q.question} - ${q.responseTime}ms`
).join('\n')}

## Tool Usage Stats
${Object.entries(report.toolUsageStats).map(([count, freq]) =>
  `- ${count} tools used: ${freq} times`
).join('\n')}

---
*Generated: ${new Date().toISOString()}*
`;

  return md;
}

export default {
  runAutomatedStressTest,
  testCategory,
  runQuickTest,
  exportTestResults,
  TEST_QUESTIONS,
  TEST_CONFIG,
};
