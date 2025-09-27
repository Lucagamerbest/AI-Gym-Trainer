// Test the foodAPI service to ensure it's parsing nutriscore data correctly
const { foodAPI } = require('./src/services/foodAPI');

async function testProduct(barcode, name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name} (${barcode})`);
  console.log('='.repeat(60));

  const result = await foodAPI.getProductByBarcode(barcode);

  if (result.found) {
    console.log('✅ Product found:', result.name);
    console.log('\n📊 Nutri-Score Grade:', result.nutritionGrade || 'N/A');

    if (result.nutriscoreData) {
      console.log('\n🔍 NUTRISCORE DATA:');
      console.log('Total Score:', result.nutriscoreData.score);
      console.log('Negative Points:', result.nutriscoreData.negative_points);
      console.log('Positive Points:', result.nutriscoreData.positive_points);

      console.log('\n❌ NEGATIVE POINTS BREAKDOWN:');
      console.log(`  Energy: ${result.nutriscoreData.energy_points} pts (${result.nutriscoreData.energy_value} kJ)`);
      console.log(`  Saturated Fat: ${result.nutriscoreData.saturated_fat_points} pts (${result.nutriscoreData.saturated_fat_value}g)`);
      console.log(`  Sugars: ${result.nutriscoreData.sugars_points} pts (${result.nutriscoreData.sugars_value}g)`);
      console.log(`  Sodium: ${result.nutriscoreData.sodium_points} pts (${result.nutriscoreData.sodium_value}mg)`);

      console.log('\n✅ POSITIVE POINTS BREAKDOWN:');
      console.log(`  Fruits/Veg/Nuts: ${result.nutriscoreData.fruits_vegetables_nuts_points} pts (${result.nutriscoreData.fruits_vegetables_nuts_value}%)`);
      console.log(`  Fiber: ${result.nutriscoreData.fiber_points} pts (${result.nutriscoreData.fiber_value}g)`);
      console.log(`  Proteins: ${result.nutriscoreData.proteins_points} pts (${result.nutriscoreData.proteins_value}g)`);
    } else {
      console.log('⚠️ No nutriscore data available');
    }
  } else {
    console.log('❌ Product not found');
  }
}

async function runTests() {
  // Test Nutella (known to have nutriscore data)
  await testProduct('3017620422003', 'Nutella');

  // Test Coca-Cola
  await testProduct('5449000000996', 'Coca-Cola');

  // Test a cheese product (Babybel)
  await testProduct('3073780969000', 'Babybel Cheese');

  console.log('\n✅ Testing complete!');
}

runTests();