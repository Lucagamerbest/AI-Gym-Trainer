// Test script to verify Nutri-Score data structure from Open Food Facts API

const BASE_URL = 'https://world.openfoodfacts.org/api/v0';

async function testNutriscore(barcode, productName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${productName} (${barcode})`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      const product = data.product;
      const nutriscore = product.nutriscore_data;

      console.log('\n📊 NUTRI-SCORE GRADE:', product.nutrition_grades?.toUpperCase() || 'N/A');
      console.log('📊 NUTRI-SCORE VALUE:', product.nutriscore_score || 'N/A');

      if (nutriscore) {
        console.log('\n📋 FULL NUTRISCORE DATA:');
        console.log(JSON.stringify(nutriscore, null, 2));

        console.log('\n❌ NEGATIVE POINTS (Total:', nutriscore.negative_points || 0, ')');
        console.log('  Energy:', nutriscore.energy, 'points');
        console.log('  Sugars:', nutriscore.sugars, 'points');
        console.log('  Saturated Fat:', nutriscore.saturated_fat, 'points');
        console.log('  Sodium:', nutriscore.sodium, 'points');

        console.log('\n✅ POSITIVE POINTS (Total:', nutriscore.positive_points || 0, ')');
        console.log('  Fruits/Veg/Nuts:', nutriscore.fruits_vegetables_nuts || nutriscore.fruits_vegetables_nuts_colza_walnut_olive_oils || 0, 'points');
        console.log('  Fiber:', nutriscore.fiber, 'points');
        console.log('  Proteins:', nutriscore.proteins, 'points');

        console.log('\n📈 ACTUAL VALUES:');
        console.log('  Energy:', nutriscore.energy_value, 'kJ');
        console.log('  Sugars:', nutriscore.sugars_value, 'g');
        console.log('  Saturated Fat:', nutriscore.saturated_fat_value, 'g');
        console.log('  Sodium:', nutriscore.sodium_value, 'mg');
      } else {
        console.log('\n⚠️ No nutriscore_data found in product');
      }

      // Also check nutriments for comparison
      console.log('\n🔍 NUTRIMENTS DATA (for verification):');
      console.log('  Energy:', product.nutriments?.['energy-kj_100g'], 'kJ');
      console.log('  Sugars:', product.nutriments?.sugars_100g, 'g');
      console.log('  Saturated Fat:', product.nutriments?.['saturated-fat_100g'], 'g');
      console.log('  Sodium:', product.nutriments?.sodium_100g, 'mg');
      console.log('  Salt:', product.nutriments?.salt_100g, 'g');
      console.log('  Protein:', product.nutriments?.proteins_100g, 'g');
      console.log('  Fiber:', product.nutriments?.fiber_100g, 'g');

    } else {
      console.log('❌ Product not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with various products
async function runTests() {
  // Feta cheese
  await testNutriscore('5310974101010', 'Feta Cheese (example)');

  // Coca-Cola
  await testNutriscore('5449000000996', 'Coca-Cola');

  // Nutella
  await testNutriscore('3017620422003', 'Nutella');

  console.log('\n✅ Testing complete!');
}

runTests();