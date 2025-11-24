const fs = require('fs');
const path = require('path');

console.log('\n=== CHECKING FOR EXERCISES WITHOUT IMAGES ===\n');

// Read the image mappings file
const imageMappingPath = path.join(__dirname, 'src', 'utils', 'exerciseImages.js');
const imageMappingContent = fs.readFileSync(imageMappingPath, 'utf8');

// Extract EXERCISE_IMAGE_MAPPING object - use a simpler regex
const mappingStart = imageMappingContent.indexOf('const EXERCISE_IMAGE_MAPPING = {');
const mappingEnd = imageMappingContent.indexOf('};', mappingStart) + 2;
const mappingStr = imageMappingContent.substring(mappingStart, mappingEnd);

// Parse the mapping (remove 'const EXERCISE_IMAGE_MAPPING = ')
const mappingObjStr = mappingStr.replace('const EXERCISE_IMAGE_MAPPING = ', '');
const imageMapping = eval('(' + mappingObjStr + ')');

console.log('✓ Loaded image mappings\n');

// Now check each exercise in the mapping for null values
let totalExercises = 0;
let exercisesWithNullImages = 0;
let totalVariants = 0;
let variantsWithNullImages = 0;
const missingList = [];

for (const exerciseName in imageMapping) {
  totalExercises++;
  const variants = imageMapping[exerciseName];
  const missingVariants = [];
  let hasAnyMapping = false;

  for (const equipment in variants) {
    totalVariants++;
    const imageId = variants[equipment];

    if (imageId === null || imageId === undefined || imageId === '') {
      variantsWithNullImages++;
      missingVariants.push(equipment);
    } else {
      hasAnyMapping = true;
    }
  }

  if (missingVariants.length > 0) {
    missingList.push({
      exercise: exerciseName,
      missingVariants: missingVariants,
      totalVariants: Object.keys(variants).length,
      hasPartialMapping: hasAnyMapping
    });
  }

  if (!hasAnyMapping) {
    exercisesWithNullImages++;
  }
}

// Print results
console.log('📊 STATISTICS:');
console.log(`Total Exercises in mapping: ${totalExercises}`);
console.log(`Total Variants in mapping: ${totalVariants}`);
console.log(`Exercises with NO images (all null): ${exercisesWithNullImages}`);
console.log(`Individual variants with null images: ${variantsWithNullImages}`);
console.log(`\n${'='.repeat(70)}\n`);

if (missingList.length > 0) {
  console.log('❌ EXERCISES WITH MISSING IMAGES (NULL VALUES):\n');

  missingList.forEach((item, index) => {
    const status = item.hasPartialMapping ? '⚠️  PARTIAL' : '❌ NO IMAGES';
    const mapped = item.totalVariants - item.missingVariants.length;

    console.log(`${index + 1}. ${item.exercise}`);
    console.log(`   ${status} (${mapped}/${item.totalVariants} variants have images)`);
    console.log(`   ❌ Missing images for: ${item.missingVariants.join(', ')}`);
    console.log('');
  });

  console.log(`\n${'='.repeat(70)}\n`);
  console.log('💡 TIP: These exercises have null image mappings.');
  console.log('   Most are cardio equipment exercises that don\'t have');
  console.log('   demonstration images in the Free Exercise DB.\n');
} else {
  console.log('✅ ALL EXERCISES HAVE IMAGE MAPPINGS!\n');
  console.log('   (No null values found)\n');
}

console.log('=== CHECK COMPLETE ===\n');
