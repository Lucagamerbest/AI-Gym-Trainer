// Test script to verify Open Food Facts API is working
const BASE_URL = 'https://world.openfoodfacts.org/api/v0';

async function testAPI() {
  console.log('Testing Open Food Facts API...\n');

  // Test with a known barcode (Coca-Cola)
  const testBarcode = '5449000000996';

  try {
    console.log(`Fetching product with barcode: ${testBarcode}`);
    const url = `${BASE_URL}/product/${testBarcode}.json`;
    console.log(`URL: ${url}\n`);

    const response = await fetch(url);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      console.log('\n✅ API is working!\n');
      console.log('Product found:');
      console.log('- Name:', data.product.product_name || 'N/A');
      console.log('- Brand:', data.product.brands || 'N/A');
      console.log('- Calories per 100g:', data.product.nutriments?.['energy-kcal_100g'] || 'N/A');
    } else {
      console.log('❌ Product not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testAPI();