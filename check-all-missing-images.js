const fs = require('fs');
const path = require('path');

console.log('\n=== COMPREHENSIVE IMAGE MAPPING CHECK ===\n');
console.log('Checking ALL exercises in database against image mappings...\n');

// Read exercise database and extract all exercises manually
const dbPath = path.join(__dirname, 'src', 'data', 'exerciseDatabase.js');
const dbContent = fs.readFileSync(dbPath, 'utf8');

// Read image mappings
const imagePath = path.join(__dirname, 'src', 'utils', 'exerciseImages.js');
const imageContent = fs.readFileSync(imagePath, 'utf8');

// Extract EXERCISE_IMAGE_MAPPING
const mappingStart = imageContent.indexOf('const EXERCISE_IMAGE_MAPPING = {');
const mappingEnd = imageContent.indexOf('export function', mappingStart);
const mappingSection = imageContent.substring(mappingStart, mappingEnd);

// Parse exercise names and their variants from the mapping
const imageMapping = {};
const exerciseMatches = mappingSection.matchAll(/"([^"]+)":\s*\{([^}]+)\}/g);

for (const match of exerciseMatches) {
  const exerciseName = match[1];
  const variantsBlock = match[2];

  imageMapping[exerciseName] = {};

  // Extract equipment variants
  const variantMatches = variantsBlock.matchAll(/"([^"]+)":\s*(null|"[^"]+")/g);
  for (const vMatch of variantMatches) {
    const equipment = vMatch[1];
    const imageId = vMatch[2];
    imageMapping[exerciseName][equipment] = imageId === 'null' ? null : imageId.replace(/"/g, '');
  }
}

console.log(`✓ Loaded ${Object.keys(imageMapping).length} exercises from image mappings\n`);

// Now extract exercises from database
const exercises = [];
const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'legs', 'forearms', 'cardio'];

// Find each exercise definition in the database
const exerciseRegex = /"name":\s*"([^"]+)"[\s\S]*?"variants":\s*\[([\s\S]*?)\s*\]/g;
let match;

while ((match = exerciseRegex.exec(dbContent)) !== null) {
  const exerciseName = match[1];
  const variantsBlock = match[2];

  // Extract equipment from variants
  const equipmentMatches = variantsBlock.matchAll(/"equipment":\s*"([^"]+)"/g);
  const variants = [];

  for (const eqMatch of equipmentMatches) {
    variants.push(eqMatch[1]);
  }

  if (variants.length > 0) {
    exercises.push({
      name: exerciseName,
      variants: variants
    });
  }
}

console.log(`✓ Found ${exercises.length} exercises with variants in database\n`);
console.log('='.repeat(70) + '\n');

// Compare and find missing
const missing = [];
let totalVariantsChecked = 0;
let missingVariantsCount = 0;

exercises.forEach(exercise => {
  const hasMapping = imageMapping[exercise.name];
  const missingVariants = [];

  exercise.variants.forEach(variant => {
    totalVariantsChecked++;

    if (!hasMapping) {
      missingVariants.push(variant);
      missingVariantsCount++;
    } else if (!hasMapping[variant] || hasMapping[variant] === null) {
      missingVariants.push(variant);
      missingVariantsCount++;
    }
  });

  if (missingVariants.length > 0) {
    missing.push({
      exercise: exercise.name,
      totalVariants: exercise.variants.length,
      missingVariants: missingVariants,
      hasPartialMapping: hasMapping && missingVariants.length < exercise.variants.length
    });
  }
});

// Print results
console.log('📊 RESULTS:\n');
console.log(`Total exercises checked: ${exercises.length}`);
console.log(`Total variants checked: ${totalVariantsChecked}`);
console.log(`Exercises with missing images: ${missing.length}`);
console.log(`Total missing variants: ${missingVariantsCount}`);
console.log(`\n${'='.repeat(70)}\n`);

if (missing.length > 0) {
  console.log('❌ EXERCISES WITH MISSING IMAGE MAPPINGS:\n');

  missing.forEach((item, index) => {
    const mapped = item.totalVariants - item.missingVariants.length;
    const status = item.hasPartialMapping ? '⚠️  PARTIAL' : '❌ NONE';

    console.log(`${index + 1}. ${item.exercise}`);
    console.log(`   ${status} - ${mapped}/${item.totalVariants} variants have images`);
    console.log(`   Missing: ${item.missingVariants.join(', ')}`);
    console.log('');
  });
} else {
  console.log('✅ ALL EXERCISES HAVE COMPLETE IMAGE MAPPINGS!\n');
}

console.log('='.repeat(70));
console.log('\n=== CHECK COMPLETE ===\n');
