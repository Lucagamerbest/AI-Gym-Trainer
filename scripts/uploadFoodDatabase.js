/**
 * Upload Food Database to Firebase Storage
 *
 * This script uploads the curated food database to Firebase Storage
 * so that the app can download updates.
 *
 * Usage:
 *   node scripts/uploadFoodDatabase.js
 *
 * Prerequisites:
 *   1. Firebase CLI installed: npm install -g firebase-tools
 *   2. Logged in: firebase login
 *   3. Project selected: firebase use <project-id>
 *
 * Or use the Firebase Admin SDK with a service account.
 */

const fs = require('fs');
const path = require('path');

// Paths
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const CURATED_FOODS_PATH = path.join(DATA_DIR, 'curatedFoods.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'firebase_upload');

// Firebase Storage paths (these should match curatedFoodDatabase.js)
const FIREBASE_PATHS = {
  database: 'food_database/curatedFoods.json',
  version: 'food_database/version.json',
};

async function main() {
  console.log('📦 Preparing Food Database for Firebase Upload\n');

  // Check if curated foods file exists
  if (!fs.existsSync(CURATED_FOODS_PATH)) {
    console.error('❌ Error: curatedFoods.json not found!');
    console.error('   Run: node scripts/buildFoodDatabase.js first');
    process.exit(1);
  }

  // Read the current database
  const data = JSON.parse(fs.readFileSync(CURATED_FOODS_PATH, 'utf8'));
  const currentVersion = data.version || 1;

  console.log(`📊 Current database:`);
  console.log(`   Version: ${currentVersion}`);
  console.log(`   Foods: ${data.foods.length}`);
  console.log(`   Size: ${(fs.statSync(CURATED_FOODS_PATH).size / 1024).toFixed(1)} KB\n`);

  // Increment version for upload
  const newVersion = currentVersion + 1;
  data.version = newVersion;
  data.updated_at = new Date().toISOString();

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write updated database file
  const dbOutputPath = path.join(OUTPUT_DIR, 'curatedFoods.json');
  fs.writeFileSync(dbOutputPath, JSON.stringify(data, null, 2));

  // Write version file
  const versionData = {
    version: newVersion,
    foods_count: data.foods.length,
    updated_at: data.updated_at,
  };
  const versionOutputPath = path.join(OUTPUT_DIR, 'version.json');
  fs.writeFileSync(versionOutputPath, JSON.stringify(versionData, null, 2));

  // Also update the source file with new version
  fs.writeFileSync(CURATED_FOODS_PATH, JSON.stringify(data, null, 2));

  console.log(`✅ Prepared files for upload (v${newVersion}):`);
  console.log(`   ${dbOutputPath}`);
  console.log(`   ${versionOutputPath}\n`);

  // Print upload instructions
  console.log('📤 Upload Instructions:\n');
  console.log('Option 1: Firebase Console (Manual)');
  console.log('─────────────────────────────────────');
  console.log('1. Go to Firebase Console > Storage');
  console.log('2. Create folder: food_database/');
  console.log('3. Upload both files from: firebase_upload/');
  console.log('   - curatedFoods.json');
  console.log('   - version.json\n');

  console.log('Option 2: Firebase CLI');
  console.log('─────────────────────────────────────');
  console.log('Run these commands:');
  console.log(`   firebase storage:upload ${dbOutputPath} ${FIREBASE_PATHS.database}`);
  console.log(`   firebase storage:upload ${versionOutputPath} ${FIREBASE_PATHS.version}\n`);

  console.log('Option 3: gsutil (Google Cloud SDK)');
  console.log('─────────────────────────────────────');
  console.log('Run these commands:');
  console.log(`   gsutil cp ${dbOutputPath} gs://YOUR_BUCKET/${FIREBASE_PATHS.database}`);
  console.log(`   gsutil cp ${versionOutputPath} gs://YOUR_BUCKET/${FIREBASE_PATHS.version}\n`);

  // Generate summary
  console.log('📋 Summary');
  console.log('─────────────────────────────────────');
  console.log(`New Version: ${newVersion}`);
  console.log(`Total Foods: ${data.foods.length}`);
  console.log(`Categories: ${[...new Set(data.foods.map(f => f.category))].join(', ')}`);
  console.log(`File Size: ${(fs.statSync(dbOutputPath).size / 1024).toFixed(1)} KB`);
  console.log('');
}

// Run
main().catch(console.error);
