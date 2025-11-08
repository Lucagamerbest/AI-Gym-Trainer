/**
 * SmartInputService Test Suite
 *
 * Test the vocabulary database and context detection engine
 * Run with: node src/services/SmartInputService.test.js
 */

import SmartInputService from './SmartInputService';

console.log('🧪 SmartInputService Test Suite\n');
console.log('='.repeat(60));

// ============================================================
// TEST 1: Context Detection
// ============================================================

console.log('\n📍 TEST 1: Context Detection\n');

const contextTests = [
  {
    input: 'create a push day workout',
    screen: 'StartWorkoutScreen',
    expectedContext: 'workout_creation'
  },
  {
    input: 'remove bench press and replace it with smith machine bench',
    screen: 'WorkoutScreen',
    expectedContext: 'exercise_modification'
  },
  {
    input: 'add pull ups to my workout',
    screen: 'WorkoutAssistant',
    expectedContext: 'exercise_addition'
  },
  {
    input: 'create a recipe using chicken breast',
    screen: 'RecipesScreen',
    expectedContext: 'recipe_with_ingredients'
  },
  {
    input: 'make a high protein meal',
    screen: 'NutritionScreen',
    expectedContext: 'macro_focused_recipe'
  },
];

contextTests.forEach((test, index) => {
  const detected = SmartInputService.detectContext(test.input, test.screen);
  const passed = detected === test.expectedContext;

  console.log(`${index + 1}. Input: "${test.input}"`);
  console.log(`   Screen: ${test.screen}`);
  console.log(`   Expected: ${test.expectedContext}`);
  console.log(`   Detected: ${detected}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// ============================================================
// TEST 2: Exercise Suggestions
// ============================================================

console.log('='.repeat(60));
console.log('\n🏋️ TEST 2: Exercise Suggestions\n');

const exerciseTests = [
  {
    input: 'add bench',
    screen: 'WorkoutScreen',
    minExpected: 3
  },
  {
    input: 'replace with smith',
    screen: 'WorkoutScreen',
    minExpected: 1
  },
  {
    input: 'create a workout with pull',
    screen: 'StartWorkoutScreen',
    minExpected: 2
  },
  {
    input: 'do some leg',
    screen: 'WorkoutAssistant',
    minExpected: 3
  },
];

exerciseTests.forEach((test, index) => {
  const suggestions = SmartInputService.getSuggestions(test.input, test.screen);
  const passed = suggestions.length >= test.minExpected;

  console.log(`${index + 1}. Input: "${test.input}"`);
  console.log(`   Expected: At least ${test.minExpected} suggestions`);
  console.log(`   Got: ${suggestions.length} suggestions`);
  console.log(`   Suggestions: ${suggestions.join(', ')}`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// ============================================================
// TEST 3: Ingredient Suggestions
// ============================================================

console.log('='.repeat(60));
console.log('\n🍗 TEST 3: Ingredient Suggestions\n');

const ingredientTests = [
  {
    input: 'create a recipe with chick',
    screen: 'RecipesScreen',
    expectedContains: ['chicken breast', 'chicken thighs', 'chickpeas']
  },
  {
    input: 'make a meal using salm',
    screen: 'NutritionScreen',
    expectedContains: ['salmon']
  },
  {
    input: 'cook something with sweet',
    screen: 'RecipesScreen',
    expectedContains: ['sweet potato']
  },
  {
    input: 'recipe with greek',
    screen: 'RecipesScreen',
    expectedContains: ['greek yogurt']
  },
];

ingredientTests.forEach((test, index) => {
  const suggestions = SmartInputService.getSuggestions(test.input, test.screen);
  const hasAll = test.expectedContains.every(expected =>
    suggestions.some(suggestion => suggestion.includes(expected))
  );

  console.log(`${index + 1}. Input: "${test.input}"`);
  console.log(`   Expected to contain: ${test.expectedContains.join(', ')}`);
  console.log(`   Got suggestions: ${suggestions.join(', ')}`);
  console.log(`   ${hasAll ? '✅ PASS' : '⚠️  PARTIAL'}\n`);
});

// ============================================================
// TEST 4: Multi-word Matching
// ============================================================

console.log('='.repeat(60));
console.log('\n🔤 TEST 4: Multi-word Matching\n');

const multiWordTests = [
  {
    input: 'add incline',
    screen: 'WorkoutScreen',
    expectedContains: 'incline bench press'
  },
  {
    input: 'replace with smith machine',
    screen: 'WorkoutScreen',
    expectedContains: 'smith machine bench'
  },
  {
    input: 'use ground',
    screen: 'RecipesScreen',
    expectedContains: 'ground beef'
  },
];

multiWordTests.forEach((test, index) => {
  const suggestions = SmartInputService.getSuggestions(test.input, test.screen);
  const hasExpected = suggestions.some(s => s.includes(test.expectedContains));

  console.log(`${index + 1}. Input: "${test.input}"`);
  console.log(`   Expected to contain: "${test.expectedContains}"`);
  console.log(`   Got suggestions: ${suggestions.join(', ')}`);
  console.log(`   ${hasExpected ? '✅ PASS' : '❌ FAIL'}\n`);
});

// ============================================================
// TEST 5: Minimum Character Requirement
// ============================================================

console.log('='.repeat(60));
console.log('\n📏 TEST 5: Minimum Character Requirement\n');

const minCharTests = [
  { input: 'a', screen: 'WorkoutScreen', shouldReturn: false },
  { input: 'ab', screen: 'WorkoutScreen', shouldReturn: true },
  { input: '', screen: 'WorkoutScreen', shouldReturn: false },
  { input: 'be', screen: 'WorkoutScreen', shouldReturn: true },
];

minCharTests.forEach((test, index) => {
  const suggestions = SmartInputService.getSuggestions(test.input, test.screen);
  const hasResults = suggestions.length > 0;
  const passed = hasResults === test.shouldReturn;

  console.log(`${index + 1}. Input: "${test.input}" (${test.input.length} chars)`);
  console.log(`   Should return suggestions: ${test.shouldReturn}`);
  console.log(`   Got: ${suggestions.length} suggestions`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// ============================================================
// TEST 6: Vocabulary Coverage
// ============================================================

console.log('='.repeat(60));
console.log('\n📊 TEST 6: Vocabulary Coverage\n');

const vocab = SmartInputService.getVocabulary();

console.log('Vocabulary Statistics:');
console.log(`  - Exercises: ${vocab.exercises.suggestions.length} terms`);
console.log(`  - Ingredients: ${vocab.ingredients.suggestions.length} terms`);
console.log(`  - Workout Types: ${vocab.workoutTypes.suggestions.length} terms`);
console.log(`  - Macros: ${vocab.macros.suggestions.length} terms`);
console.log(`  - Equipment: ${vocab.equipment.suggestions.length} terms`);
console.log(`\n  Total: ${
  vocab.exercises.suggestions.length +
  vocab.ingredients.suggestions.length +
  vocab.workoutTypes.suggestions.length +
  vocab.macros.suggestions.length +
  vocab.equipment.suggestions.length
} terms`);

// ============================================================
// SUMMARY
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('\n✅ Phase 1 Tests Complete!\n');
console.log('Next Steps:');
console.log('  1. Review test results above');
console.log('  2. Add more vocabulary if needed');
console.log('  3. Proceed to Phase 2: UI Component');
console.log('\n' + '='.repeat(60));
