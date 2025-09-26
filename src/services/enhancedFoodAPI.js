// Enhanced Food API Service - Combines multiple free databases for maximum coverage
// This approach is similar to what Yuka and other apps use

const APIs = {
  // Open Food Facts - International coverage
  openFoodFacts: {
    baseUrl: 'https://world.openfoodfacts.org/api/v0',
    getProduct: async (barcode) => {
      try {
        const response = await fetch(`${APIs.openFoodFacts.baseUrl}/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product) {
          return {
            found: true,
            source: 'Open Food Facts',
            name: data.product.product_name || 'Unknown Product',
            brand: data.product.brands || '',
            imageUrl: data.product.image_url || data.product.image_front_url || null,
            nutrition: {
              calories: data.product.nutriments?.['energy-kcal_100g'] || 0,
              protein: data.product.nutriments?.proteins_100g || 0,
              carbs: data.product.nutriments?.carbohydrates_100g || 0,
              fat: data.product.nutriments?.fat_100g || 0,
              fiber: data.product.nutriments?.fiber_100g || 0,
              sugar: data.product.nutriments?.sugars_100g || 0,
              sodium: data.product.nutriments?.sodium_100g || 0,
              saturatedFat: data.product.nutriments?.['saturated-fat_100g'] || 0,
            },
            servingSize: data.product.serving_size || '100g',
            ingredients: data.product.ingredients_text || '',
            nutritionGrade: data.product.nutrition_grades || null,
          };
        }
        return { found: false };
      } catch (error) {
        console.log('OpenFoodFacts error:', error.message);
        return { found: false };
      }
    }
  },

  // USDA FoodData Central - US products, very comprehensive
  // Note: Requires free API key from https://fdc.nal.usda.gov/api-guide.html
  usdaFoodData: {
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: 'DEMO_KEY', // Replace with actual key from https://api.data.gov/signup/
    searchByUPC: async (barcode) => {
      try {
        // USDA uses GTIN/UPC field for barcodes
        const response = await fetch(
          `${APIs.usdaFoodData.baseUrl}/foods/search?query=${barcode}&dataType=Branded&api_key=${APIs.usdaFoodData.apiKey}`
        );
        const data = await response.json();

        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];

          // Extract nutrients from USDA format
          const getNutrient = (id) => {
            const nutrient = food.foodNutrients?.find(n => n.nutrientId === id);
            return nutrient?.value || 0;
          };

          return {
            found: true,
            source: 'USDA FoodData Central',
            name: food.description || food.brandName || 'Unknown',
            brand: food.brandOwner || '',
            nutrition: {
              calories: getNutrient(1008), // Energy in kcal
              protein: getNutrient(1003), // Protein
              carbs: getNutrient(1005), // Carbohydrates
              fat: getNutrient(1004), // Total Fat
              fiber: getNutrient(1079), // Fiber
              sugar: getNutrient(2000), // Sugars
              sodium: getNutrient(1093) / 1000, // Sodium (convert mg to g)
              saturatedFat: getNutrient(1258), // Saturated Fat
            },
            servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit}` : '100g',
            ingredients: food.ingredients || '',
          };
        }
        return { found: false };
      } catch (error) {
        console.log('USDA API error:', error.message);
        return { found: false };
      }
    }
  },

  // Nutritionix - Good coverage, especially for US/Canada
  // Free tier: 200 calls/day
  nutritionix: {
    baseUrl: 'https://trackapi.nutritionix.com/v2',
    appId: 'YOUR_APP_ID', // Get from https://www.nutritionix.com/api
    appKey: 'YOUR_APP_KEY', // Free registration required
    searchByUPC: async (barcode) => {
      try {
        const response = await fetch(
          `${APIs.nutritionix.baseUrl}/search/item?upc=${barcode}`,
          {
            headers: {
              'x-app-id': APIs.nutritionix.appId,
              'x-app-key': APIs.nutritionix.appKey,
            }
          }
        );

        if (!response.ok) return { found: false };

        const data = await response.json();
        if (data.foods && data.foods.length > 0) {
          const food = data.foods[0];
          return {
            found: true,
            source: 'Nutritionix',
            name: food.food_name || 'Unknown',
            brand: food.brand_name || '',
            imageUrl: food.photo?.thumb || null,
            nutrition: {
              calories: food.nf_calories || 0,
              protein: food.nf_protein || 0,
              carbs: food.nf_total_carbohydrate || 0,
              fat: food.nf_total_fat || 0,
              fiber: food.nf_dietary_fiber || 0,
              sugar: food.nf_sugars || 0,
              sodium: food.nf_sodium / 1000 || 0, // Convert mg to g
              saturatedFat: food.nf_saturated_fat || 0,
            },
            servingSize: `${food.serving_qty} ${food.serving_unit}` || '1 serving',
          };
        }
        return { found: false };
      } catch (error) {
        console.log('Nutritionix error:', error.message);
        return { found: false };
      }
    }
  },

  // Edamam Food Database - Good international coverage
  // Free tier: 10,000 calls/month
  edamam: {
    baseUrl: 'https://api.edamam.com/api/food-database/v2',
    appId: 'YOUR_APP_ID', // Get from https://developer.edamam.com/
    appKey: 'YOUR_APP_KEY',
    searchByUPC: async (barcode) => {
      try {
        const response = await fetch(
          `${APIs.edamam.baseUrl}/parser?upc=${barcode}&app_id=${APIs.edamam.appId}&app_key=${APIs.edamam.appKey}`
        );

        const data = await response.json();
        if (data.hints && data.hints.length > 0) {
          const food = data.hints[0].food;
          return {
            found: true,
            source: 'Edamam',
            name: food.label || 'Unknown',
            brand: food.brand || '',
            imageUrl: food.image || null,
            nutrition: {
              calories: food.nutrients.ENERC_KCAL || 0,
              protein: food.nutrients.PROCNT || 0,
              carbs: food.nutrients.CHOCDF || 0,
              fat: food.nutrients.FAT || 0,
              fiber: food.nutrients.FIBTG || 0,
              sugar: food.nutrients.SUGAR || 0,
              sodium: (food.nutrients.NA || 0) / 1000, // Convert mg to g
              saturatedFat: food.nutrients.FASAT || 0,
            },
            servingSize: '100g',
          };
        }
        return { found: false };
      } catch (error) {
        console.log('Edamam error:', error.message);
        return { found: false };
      }
    }
  },

  // UPCitemdb - Large UPC database
  // Free tier: 100 requests/day
  upcItemDb: {
    baseUrl: 'https://api.upcitemdb.com/prod/trial',
    searchByUPC: async (barcode) => {
      try {
        const response = await fetch(`${APIs.upcItemDb.baseUrl}/lookup?upc=${barcode}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          // Note: This API provides product info but limited nutrition data
          return {
            found: true,
            source: 'UPC Database',
            name: item.title || 'Unknown',
            brand: item.brand || '',
            imageUrl: item.images?.[0] || null,
            // Nutrition data would need to come from another source
            needsNutritionLookup: true,
            description: item.description || '',
          };
        }
        return { found: false };
      } catch (error) {
        console.log('UPCitemdb error:', error.message);
        return { found: false };
      }
    }
  }
};

// Main enhanced API function that tries multiple sources
export const enhancedFoodAPI = {
  getProductByBarcode: async (barcode) => {
    console.log(`Searching for barcode: ${barcode}`);

    // Try each API in order of preference
    const apiOrder = [
      () => APIs.openFoodFacts.getProduct(barcode),
      // Uncomment these as you add API keys:
      // () => APIs.usdaFoodData.searchByUPC(barcode),
      // () => APIs.nutritionix.searchByUPC(barcode),
      // () => APIs.edamam.searchByUPC(barcode),
      // () => APIs.upcItemDb.searchByUPC(barcode),
    ];

    for (const apiCall of apiOrder) {
      try {
        const result = await apiCall();
        if (result.found) {
          console.log(`Found in ${result.source}`);
          return {
            ...result,
            barcode: barcode,
            found: true,
          };
        }
      } catch (error) {
        console.log('API error, trying next source...');
        continue;
      }
    }

    // If no API found the product
    return {
      found: false,
      barcode: barcode,
      message: 'Product not found in any database. Would you like to add it manually?',
      triedSources: ['Open Food Facts', 'USDA', 'Nutritionix', 'Edamam', 'UPC Database'],
    };
  },

  // Function to search by name across multiple APIs
  searchByName: async (query) => {
    const results = [];

    // Search Open Food Facts
    try {
      const response = await fetch(
        `${APIs.openFoodFacts.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
      );
      const data = await response.json();

      if (data.products) {
        results.push(...data.products.map(p => ({
          name: p.product_name,
          brand: p.brands,
          barcode: p.code,
          source: 'Open Food Facts',
          imageUrl: p.image_url,
        })));
      }
    } catch (error) {
      console.log('Search error:', error);
    }

    return results;
  }
};

// Instructions for getting API keys (all free):
/*
1. USDA FoodData Central (Best for US products):
   - Go to: https://api.data.gov/signup/
   - Sign up for free API key
   - No credit card required
   - 1000 calls/hour limit

2. Nutritionix (Good for US/Canada):
   - Go to: https://www.nutritionix.com/api
   - Sign up for free account
   - Get App ID and App Key
   - 200 calls/day free

3. Edamam (International coverage):
   - Go to: https://developer.edamam.com/
   - Sign up for free "Developer" plan
   - Get App ID and App Key
   - 10,000 calls/month free

4. UPCitemdb (Product info):
   - Go to: https://www.upcitemdb.com/api/explorer
   - Sign up for free trial
   - 100 calls/day free

With all these combined, you'll have coverage similar to Yuka!
*/