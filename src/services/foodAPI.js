// Enhanced service to fetch food data from multiple APIs for maximum coverage
// Combines Open Food Facts, USDA, and other databases - all free!

const APIs = {
  // Open Food Facts - International coverage, no key needed
  openFoodFacts: {
    baseUrl: 'https://world.openfoodfacts.org/api/v0',
    tryFetch: async (barcode) => {
      try {
        const response = await fetch(`${APIs.openFoodFacts.baseUrl}/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product) {
          const product = data.product;
          return {
            found: true,
            source: 'Open Food Facts',
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            imageUrl: product.image_url || product.image_front_url || null,
            nutritionGrade: product.nutrition_grades || null,  // Nutri-Score (a, b, c, d, e)
            novaGroup: product.nova_group || null,  // NOVA processing level (1-4)
            nutrition: {
              calories: product.nutriments?.['energy-kcal_100g'] || 0,
              protein: product.nutriments?.proteins_100g || 0,
              carbs: product.nutriments?.carbohydrates_100g || 0,
              fat: product.nutriments?.fat_100g || 0,
              fiber: product.nutriments?.fiber_100g || 0,
              sugar: product.nutriments?.sugars_100g || 0,
              sodium: product.nutriments?.sodium_100g || 0,
            },
            servingSize: product.serving_size || '100g',
          };
        }
      } catch (error) {
        console.log('OpenFoodFacts lookup failed, trying next source...');
      }
      return null;
    }
  },

  // USDA FoodData Central - Excellent US/Canada coverage
  usda: {
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: 'DEMO_KEY', // Works immediately, upgrade later at https://api.data.gov/signup/
    tryFetch: async (barcode) => {
      try {
        // First, search by barcode in branded foods
        const searchUrl = `${APIs.usda.baseUrl}/foods/search?query=${barcode}&dataType=Branded&limit=1&api_key=${APIs.usda.apiKey}`;
        const response = await fetch(searchUrl);

        if (!response.ok) return null;

        const data = await response.json();

        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];

          // Check if GTIN/UPC matches our barcode
          if (food.gtinUpc && food.gtinUpc.replace(/^0+/, '') === barcode.replace(/^0+/, '')) {
            // Extract nutrients
            const getNutrient = (name) => {
              const nutrient = food.foodNutrients?.find(n =>
                n.nutrientName?.toLowerCase().includes(name.toLowerCase())
              );
              return nutrient?.value || 0;
            };

            return {
              found: true,
              source: 'USDA Database',
              name: food.description || food.brandName || 'Unknown',
              brand: food.brandOwner || food.brandName || '',
              imageUrl: null, // USDA doesn't provide images
              nutrition: {
                calories: getNutrient('energy') || 0,
                protein: getNutrient('protein') || 0,
                carbs: getNutrient('carbohydrate') || 0,
                fat: getNutrient('total lipid') || getNutrient('fat') || 0,
                fiber: getNutrient('fiber') || 0,
                sugar: getNutrient('sugar') || 0,
                sodium: (getNutrient('sodium') || 0) / 1000, // Convert mg to g
              },
              servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || ''}` : '100g',
            };
          }
        }
      } catch (error) {
        console.log('USDA lookup failed, trying next source...');
      }
      return null;
    }
  },

  // FoodRepo - Swiss database with good European coverage
  foodRepo: {
    baseUrl: 'https://www.foodrepo.org/api/v3',
    tryFetch: async (barcode) => {
      try {
        const response = await fetch(`${APIs.foodRepo.baseUrl}/products?barcodes=${barcode}`);

        if (!response.ok) return null;

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const product = data.data[0];

          // Extract nutrients from FoodRepo format
          const nutrients = product.nutrients || {};

          return {
            found: true,
            source: 'FoodRepo',
            name: product.name?.en || product.name?.de || product.name?.fr || 'Unknown',
            brand: product.product_brand || '',
            imageUrl: product.images?.[0]?.url || null,
            nutrition: {
              calories: nutrients.energy_kcal?.per_hundred || 0,
              protein: nutrients.protein?.per_hundred || 0,
              carbs: nutrients.carbohydrates?.per_hundred || 0,
              fat: nutrients.fat?.per_hundred || 0,
              fiber: nutrients.fiber?.per_hundred || 0,
              sugar: nutrients.sugars?.per_hundred || 0,
              sodium: (nutrients.salt?.per_hundred || 0) / 2.5, // Convert salt to sodium
            },
            servingSize: product.serving_size || '100g',
          };
        }
      } catch (error) {
        console.log('FoodRepo lookup failed, trying next source...');
      }
      return null;
    }
  }
};

export const foodAPI = {
  // Main function - tries multiple databases in sequence
  getProductByBarcode: async (barcode) => {
    try {
      console.log('Searching for barcode:', barcode);

      // Clean the barcode
      const cleanBarcode = barcode.trim();

      // Try each API in order
      const sources = [
        APIs.openFoodFacts,
        APIs.usda,
        APIs.foodRepo,
      ];

      for (const api of sources) {
        console.log(`Trying ${api.baseUrl}...`);
        const result = await api.tryFetch(cleanBarcode);

        if (result && result.found) {
          console.log(`✓ Found in ${result.source}:`, result.name);

          // Return in the exact format our app expects
          return {
            found: true,
            name: result.name,
            brand: result.brand,
            imageUrl: result.imageUrl,
            barcode: cleanBarcode,
            nutritionGrade: result.nutritionGrade || null,
            novaGroup: result.novaGroup || null,
            nutrition: result.nutrition,
            servingSize: result.servingSize,
            source: result.source, // So user knows where data came from
            rawData: result
          };
        }
      }

      // If no API found the product
      console.log('Product not found in any database');
      return {
        found: false,
        barcode: cleanBarcode,
        message: 'Product not found in our databases'
      };

    } catch (error) {
      console.error('Error in foodAPI:', error.message || error);
      return {
        found: false,
        error: true,
        message: `Failed to fetch product data: ${error.message || 'Network error'}`,
        errorDetails: error.toString()
      };
    }
  },

  // Search for food by name (for ingredients)
  searchFood: async (query) => {
    try {
      const response = await fetch(
        `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`
      );
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        // Return top 10 results
        return data.products.slice(0, 10).map(product => ({
          name: product.product_name || 'Unknown',
          brand: product.brands || '',
          barcode: product.code,
          imageUrl: product.image_url || product.image_front_small_url,
          nutrition: {
            calories: product.nutriments?.['energy-kcal_100g'] || 0,
            protein: product.nutriments?.proteins_100g || 0,
            carbs: product.nutriments?.carbohydrates_100g || 0,
            fat: product.nutriments?.fat_100g || 0,
          }
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }
};

// Test function to verify API is working
export const testFoodAPI = async () => {
  // Test with Nutella barcode
  const testBarcode = '3017620422003';
  const result = await foodAPI.getProductByBarcode(testBarcode);
  return result;
};