// Test the enhanced multi-database API
const { foodAPI } = require('./src/services/foodAPI');

async function testProduct(name, barcode) {
  console.log(`\n📦 Testing: ${name}`);
  console.log(`Barcode: ${barcode}`);
  console.log('-'.repeat(50));

  const result = await foodAPI.getProductByBarcode(barcode);

  if (result.found) {
    console.log(`✅ FOUND in ${result.source}`);
    console.log(`Product: ${result.name}`);
    console.log(`Brand: ${result.brand}`);
    console.log(`Calories: ${result.nutrition.calories} per ${result.servingSize}`);
    console.log(`Protein: ${result.nutrition.protein}g`);
  } else {
    console.log('❌ Not found in any database');
  }
}

async function runTests() {
  console.log('🔍 Testing Enhanced Multi-Database Coverage\n');

  // Test products that should now work
  await testProduct('Coca-Cola', '5449000000996');
  await testProduct('White Tuna (typical)', '086600000015');
  await testProduct('Campbell Soup', '051000000019');
  await testProduct('Kraft Mac & Cheese', '021000658844');
  await testProduct('Wonder Bread', '072945100328');

  console.log('\n✨ Coverage should be much better now!');
}

runTests().catch(console.error);