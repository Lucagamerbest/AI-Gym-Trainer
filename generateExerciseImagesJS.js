const fs = require('fs');

// Load the final mapping
const mapping = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_mapping_final.json', 'utf8'));

// Load the Free Exercise DB to verify IDs and get image info
const freeExerciseDB = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\free_exercise_db.json', 'utf8'));

// Create a lookup for exercise info
const exerciseInfo = {};
for (const ex of freeExerciseDB) {
  exerciseInfo[ex.id] = ex;
}

// Generate JavaScript code
let jsCode = `// Exercise to Free Exercise DB image mapping
// Auto-generated mapping for AI Gym Trainer
// Free Exercise DB: https://github.com/yuhonas/free-exercise-db

const exerciseImages = {\n`;

// Sort exercises alphabetically for better organization
const sortedExercises = Object.keys(mapping).sort();

for (const exerciseName of sortedExercises) {
  jsCode += `  "${exerciseName}": {\n`;

  const variants = mapping[exerciseName];
  const sortedVariants = Object.keys(variants).sort();

  for (let i = 0; i < sortedVariants.length; i++) {
    const equipment = sortedVariants[i];
    const exerciseId = variants[equipment];
    const comma = i < sortedVariants.length - 1 ? ',' : '';

    // Verify the ID exists
    if (exerciseInfo[exerciseId]) {
      jsCode += `    "${equipment}": "${exerciseId}"${comma}\n`;
    } else {
      jsCode += `    "${equipment}": "${exerciseId}" // WARNING: ID not found in DB${comma}\n`;
    }
  }

  jsCode += `  },\n`;
}

jsCode += `};\n\n`;

// Add helper function to get image URL
jsCode += `// Helper function to get image URL from Free Exercise DB
// Usage: getExerciseImageUrl(exerciseName, equipment, imageIndex)
function getExerciseImageUrl(exerciseName, equipment, imageIndex = 0) {
  const baseUrl = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
  const exerciseId = exerciseImages[exerciseName]?.[equipment];

  if (!exerciseId) {
    console.warn(\`No image mapping found for \${exerciseName} - \${equipment}\`);
    return null;
  }

  return \`\${baseUrl}/\${exerciseId}/\${imageIndex}.jpg\`;
}

// Helper function to get both images (start and end position)
function getExerciseImages(exerciseName, equipment) {
  return {
    start: getExerciseImageUrl(exerciseName, equipment, 0),
    end: getExerciseImageUrl(exerciseName, equipment, 1)
  };
}

// Export for use in your app
export { exerciseImages, getExerciseImageUrl, getExerciseImages };
`;

// Write the JavaScript file
fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exerciseImages.js', jsCode, 'utf8');

console.log('exerciseImages.js generated successfully!');
console.log(`Total exercises mapped: ${sortedExercises.length}`);

// Calculate total variants
let totalVariants = 0;
for (const exerciseName of sortedExercises) {
  totalVariants += Object.keys(mapping[exerciseName]).length;
}
console.log(`Total exercise variants: ${totalVariants}`);

// Generate a summary report
let report = `# Exercise Mapping Summary\n\n`;
report += `Total exercises: ${sortedExercises.length}\n`;
report += `Total exercise variants: ${totalVariants}\n\n`;
report += `## Exercises by Muscle Group\n\n`;

const exerciseList = JSON.parse(fs.readFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\exercise_list.json', 'utf8'));
const byMuscleGroup = {};

for (const ex of exerciseList) {
  if (!byMuscleGroup[ex.muscleGroup]) {
    byMuscleGroup[ex.muscleGroup] = [];
  }
  byMuscleGroup[ex.muscleGroup].push(ex.name);
}

for (const [group, exercises] of Object.entries(byMuscleGroup).sort()) {
  report += `### ${group.charAt(0).toUpperCase() + group.slice(1)}\n`;
  report += `${exercises.length} exercises:\n`;
  for (const ex of exercises.sort()) {
    const variantCount = Object.keys(mapping[ex] || {}).length;
    report += `- ${ex} (${variantCount} variants)\n`;
  }
  report += `\n`;
}

fs.writeFileSync('C:\\Users\\lucar\\AI-Gym-Trainer\\mapping_summary.md', report, 'utf8');
console.log('mapping_summary.md generated!');
