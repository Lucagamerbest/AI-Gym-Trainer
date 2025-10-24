/**
 * AI Tool Testing Script
 * Run with: node test-ai-tools.js
 */

// Mock environment for testing
global.performance = { now: () => Date.now() };

const readline = require('readline');

// Test queries - add/modify as needed
const testQueries = [
  "Create a chest and triceps workout",
  "Calculate my macros for cutting",
  "Find alternatives to bench press",
  "Search for back exercises",
  "Recommend new exercises for me",
  "Analyze my workout history",
  "What should I eat for 40g protein?",
  "Show me beginner shoulder exercises",
];

async function runTests() {
  console.log('\n🧪 AI Tool System Test Suite\n');

  // Import the tools
  const { initializeTools, ToolRegistry } = require('./src/services/ai/tools');

  // Initialize
  initializeTools();

  console.log(`✅ Loaded ${ToolRegistry.getToolCount()} tools\n`);
  console.log('Available tools:');
  ToolRegistry.listTools().forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test individual tools
  console.log('🔧 Testing Tools Directly:\n');

  // Test 1: Generate Workout Plan
  try {
    console.log('1️⃣ Testing generateWorkoutPlan...');
    const result1 = await ToolRegistry.executeTool('generateWorkoutPlan', {
      muscleGroups: ['chest', 'triceps'],
      experienceLevel: 'intermediate',
      duration: 60,
      goal: 'hypertrophy',
      equipment: ['barbell', 'dumbbell']
    });
    console.log('✅ Success!');
    console.log(`   Generated: ${result1.workout?.title}`);
    console.log(`   Exercises: ${result1.workout?.exercises?.length}`);
    console.log('');
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 2: Search Exercises
  try {
    console.log('2️⃣ Testing searchExercises...');
    const result2 = await ToolRegistry.executeTool('searchExercises', {
      muscleGroup: 'chest',
      limit: 5
    });
    console.log('✅ Success!');
    console.log(`   Found: ${result2.count} exercises`);
    console.log('');
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 3: Calculate Macros
  try {
    console.log('3️⃣ Testing calculateMacros...');
    const result3 = await ToolRegistry.executeTool('calculateMacros', {
      weight: 80,
      height: 180,
      age: 25,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'cut'
    });
    console.log('✅ Success!');
    console.log(`   Calories: ${result3.macros?.calories}`);
    console.log(`   Protein: ${result3.macros?.protein}g`);
    console.log('');
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  // Test 4: Find Alternatives
  try {
    console.log('4️⃣ Testing findExerciseAlternatives...');
    const result4 = await ToolRegistry.executeTool('findExerciseAlternatives', {
      exerciseName: 'Bench Press',
      muscleGroup: 'chest'
    });
    console.log('✅ Success!');
    console.log(`   Found: ${result4.alternatives?.length} alternatives`);
    console.log('');
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ All tests complete!\n');
  console.log('💡 To test with AI (requires API key), use the app chat.\n');
}

// Run tests
runTests().catch(console.error);
