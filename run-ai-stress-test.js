/**
 * Console-based AI Stress Test Runner
 *
 * Run this script to test AI in the background without opening the app
 * Usage: node run-ai-stress-test.js [options]
 *
 * Options:
 *   --quick          Run quick test (20 questions)
 *   --category=NAME  Run specific category test
 *   --full           Run full test (all questions)
 *   --export         Export results to file
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  quick: args.includes('--quick'),
  full: args.includes('--full'),
  export: args.includes('--export'),
  category: args.find(arg => arg.startsWith('--category='))?.split('=')[1],
};

// Determine test mode
let testMode = 'full';
if (options.quick) testMode = 'quick';
if (options.category) testMode = 'category';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║       🤖 AI Gym Trainer - Automated Stress Test 🤖       ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log(`📋 Test Mode: ${testMode.toUpperCase()}`);
if (options.category) console.log(`📂 Category: ${options.category}`);
console.log(`📤 Export Results: ${options.export ? 'YES' : 'NO'}`);
console.log('');

// Instructions for running
console.log('⚠️  IMPORTANT: This script needs to be run within the React Native app context.\n');

console.log('To run automated tests, choose one of these methods:\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📱 METHOD 1: In-App Test Runner (Recommended)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Add to your app navigation:');
console.log('');
console.log('   import AutomatedTestRunner from \'./src/components/AutomatedTestRunner\';');
console.log('   ');
console.log('   <Stack.Screen name="TestRunner" component={AutomatedTestRunner} />');
console.log('');
console.log('2. Open the app → Navigate to Test Runner');
console.log('3. Tap "Run Full Test" or "Quick Test"');
console.log('4. Tests run in the background while you see progress');
console.log('5. Export results when done\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💻 METHOD 2: Console Testing (Development)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Open your app in development mode');
console.log('2. Open Chrome DevTools (press Cmd+M → Debug)');
console.log('3. In the console, run:');
console.log('');
console.log('   import AutomatedAITester from \'./src/services/ai/AutomatedAITester\';');
console.log('   ');
console.log('   // Quick test');
console.log('   await AutomatedAITester.runQuickTest();');
console.log('   ');
console.log('   // Full test');
console.log('   await AutomatedAITester.runAutomatedStressTest();');
console.log('   ');
console.log('   // Category test');
console.log('   await AutomatedAITester.testCategory(\'workoutGeneration\');');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔧 METHOD 3: Add Test Button to Your App');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('In your Settings or Dev screen:');
console.log('');
console.log('   import AutomatedAITester from \'./src/services/ai/AutomatedAITester\';');
console.log('   ');
console.log('   const runTest = async () => {');
console.log('     const { report } = await AutomatedAITester.runQuickTest();');
console.log('     Alert.alert(');
console.log('       \'Test Complete\',');
console.log('       `Success Rate: ${report.summary.successRate}`');
console.log('     );');
console.log('   };');
console.log('   ');
console.log('   <Button title="🧪 Run AI Test" onPress={runTest} />');
console.log('');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📊 Test Categories Available:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const categories = {
  'workoutGeneration': 15,
  'exerciseSearch': 15,
  'workoutTracking': 15,
  'workoutHistory': 12,
  'exerciseStats': 12,
  'nutrition': 15,
  'mealLogging': 8,
  'profile': 10,
  'recommendations': 8,
  'technique': 5,
  'programming': 5,
};

Object.entries(categories).forEach(([name, count]) => {
  console.log(`  • ${name.padEnd(20)} - ${count} questions`);
});

const total = Object.values(categories).reduce((sum, n) => sum + n, 0);
console.log(`\n  📦 TOTAL: ${total} questions\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 Example Questions Being Tested:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  • "Create a chest and triceps workout for hypertrophy"');
console.log('  • "I just did 185 pounds for 5 reps on bench press"');
console.log('  • "Calculate my macros for cutting"');
console.log('  • "Show me my recent workouts"');
console.log('  • "What\'s my bench press PR?"');
console.log('  • "Add bench press to my workout"');
console.log('  • "I ate 8oz chicken breast"');
console.log('  • "Find alternatives to bench press"');
console.log('  ... and 112 more!\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📈 What You\'ll Get:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ✅ Success Rate (should be >90%)');
console.log('  ❌ Failed Questions (categorized by error type)');
console.log('  ⏱️  Average Response Time');
console.log('  🔧 Tools Used Statistics');
console.log('  🐌 Slowest Queries');
console.log('  ⚡ Fastest Queries');
console.log('  📋 Detailed Error Report');
console.log('  📤 Exportable Results\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚡ Quick Start:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Add this to your app.json or App.js:');
console.log('');
console.log('  if (__DEV__) {');
console.log('    // Add test runner to navigation');
console.log('    import AutomatedTestRunner from \'./src/components/AutomatedTestRunner\';');
console.log('  }');
console.log('');
console.log('Then open the app and navigate to the Test Runner screen!\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📖 Documentation:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  See: AI_BUG_TRACKING_WORKFLOW.md');
console.log('  See: QUICK_REFERENCE.md');
console.log('  See: AI_BUG_TRACKING_SYSTEM_SUMMARY.md\n');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║           Ready to find all AI flaws! 🚀                 ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Create a sample test results file
if (options.export) {
  const sampleResults = {
    summary: {
      total: total,
      successful: 0,
      failed: 0,
      successRate: '0%',
      duration: '0s',
      avgResponseTime: '0ms',
    },
    note: 'Run tests in the app to generate real results',
    instructions: 'Use AutomatedTestRunner component in your React Native app',
  };

  const resultsPath = path.join(__dirname, 'ai-test-results-sample.json');
  fs.writeFileSync(resultsPath, JSON.stringify(sampleResults, null, 2));

  console.log(`📄 Sample results file created: ${resultsPath}\n`);
}
