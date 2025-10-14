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
            nutrition: (() => {
              const calories = product.nutriments?.['energy-kcal_100g'] || 0;
              const protein = product.nutriments?.proteins_100g || 0;
              const carbs = product.nutriments?.carbohydrates_100g || 0;
              const fat = product.nutriments?.fat_100g || 0;

              // Calculate calories from macros if missing or zero
              let finalCalories = calories;
              if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
                finalCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
              }

              return {
                calories: finalCalories,
                protein,
                carbs,
                fat,
                fiber: product.nutriments?.fiber_100g || 0,
                sugar: product.nutriments?.sugars_100g || 0,
                sodium: product.nutriments?.sodium_100g || 0,
                saturatedFat: product.nutriments?.['saturated-fat_100g'] || 0,
                salt: product.nutriments?.salt_100g || 0,
              };
            })(),
            // Nutri-Score details for explanation - extract from components arrays
            nutriscoreData: (() => {
              const data = {
                score: product.nutriscore_score || null,
                negative_points: product.nutriscore_data?.negative_points || 0,
                positive_points: product.nutriscore_data?.positive_points || 0,
                is_beverage: product.nutriscore_data?.is_beverage || 0,
                // Initialize all points to 0
                energy_points: 0,
                sugars_points: 0,
                saturated_fat_points: 0,
                sodium_points: 0,
                fruits_vegetables_nuts_points: 0,
                fiber_points: 0,
                proteins_points: 0,
                // Initialize all values to 0
                energy_value: 0,
                sugars_value: 0,
                saturated_fat_value: 0,
                sodium_value: 0,
                fruits_vegetables_nuts_value: 0,
                fiber_value: 0,
                proteins_value: 0,
              };

              // Extract from components.negative array
              if (product.nutriscore_data?.components?.negative) {
                product.nutriscore_data.components.negative.forEach(component => {
                  switch(component.id) {
                    case 'energy':
                      data.energy_points = component.points || 0;
                      data.energy_value = component.value || 0;
                      break;
                    case 'sugars':
                      data.sugars_points = component.points || 0;
                      data.sugars_value = component.value || 0;
                      break;
                    case 'saturated_fat':
                    case 'saturated-fat':
                      data.saturated_fat_points = component.points || 0;
                      data.saturated_fat_value = component.value || 0;
                      break;
                    case 'sodium':
                    case 'salt':
                      data.sodium_points = component.points || 0;
                      data.sodium_value = component.value || 0;
                      break;
                  }
                });
              }

              // Extract from components.positive array
              if (product.nutriscore_data?.components?.positive) {
                product.nutriscore_data.components.positive.forEach(component => {
                  switch(component.id) {
                    case 'fiber':
                      data.fiber_points = component.points || 0;
                      data.fiber_value = component.value || 0;
                      break;
                    case 'proteins':
                    case 'protein':
                      data.proteins_points = component.points || 0;
                      data.proteins_value = component.value || 0;
                      break;
                    case 'fruits_vegetables_nuts':
                    case 'fruits_vegetables':
                    case 'fruits_vegetables_legumes':
                      data.fruits_vegetables_nuts_points = component.points || 0;
                      data.fruits_vegetables_nuts_value = component.value || 0;
                      break;
                  }
                });
              }

              // Fallback to old API structure if components are not available
              if (!product.nutriscore_data?.components) {
                data.energy_points = product.nutriscore_data?.energy || 0;
                data.sugars_points = product.nutriscore_data?.sugars || 0;
                data.saturated_fat_points = product.nutriscore_data?.saturated_fat || 0;
                data.sodium_points = product.nutriscore_data?.sodium || 0;
                data.fruits_vegetables_nuts_points = product.nutriscore_data?.fruits_vegetables_nuts_colza_walnut_olive_oils ||
                                                    product.nutriscore_data?.fruits_vegetables_nuts || 0;
                data.fiber_points = product.nutriscore_data?.fiber || 0;
                data.proteins_points = product.nutriscore_data?.proteins || 0;
                // Use nutriments as fallback for values
                data.energy_value = product.nutriscore_data?.energy_value || product.nutriments?.['energy-kj_100g'] || 0;
                data.sugars_value = product.nutriscore_data?.sugars_value || product.nutriments?.sugars_100g || 0;
                data.saturated_fat_value = product.nutriscore_data?.saturated_fat_value || product.nutriments?.['saturated-fat_100g'] || 0;
                data.sodium_value = product.nutriscore_data?.sodium_value || product.nutriments?.sodium_100g || 0;
                data.fiber_value = product.nutriscore_data?.fiber_value || product.nutriments?.fiber_100g || 0;
                data.proteins_value = product.nutriscore_data?.proteins_value || product.nutriments?.proteins_100g || 0;
              }

              return data;
            })(),
            servingSize: product.serving_size || '100g',
          };
        }
      } catch (error) {
        // OpenFoodFacts lookup failed, trying next source
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
              nutrition: (() => {
                const calories = getNutrient('energy') || 0;
                const protein = getNutrient('protein') || 0;
                const carbs = getNutrient('carbohydrate') || 0;
                const fat = getNutrient('total lipid') || getNutrient('fat') || 0;

                // Calculate calories from macros if missing or zero
                let finalCalories = calories;
                if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
                  finalCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
                }

                return {
                  calories: finalCalories,
                  protein,
                  carbs,
                  fat,
                  fiber: getNutrient('fiber') || 0,
                  sugar: getNutrient('sugar') || 0,
                  sodium: (getNutrient('sodium') || 0) / 1000, // Convert mg to g
                };
              })(),
              servingSize: food.servingSize ? `${food.servingSize}${food.servingSizeUnit || ''}` : '100g',
            };
          }
        }
      } catch (error) {
        // USDA lookup failed, trying next source
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
            nutrition: (() => {
              const calories = nutrients.energy_kcal?.per_hundred || 0;
              const protein = nutrients.protein?.per_hundred || 0;
              const carbs = nutrients.carbohydrates?.per_hundred || 0;
              const fat = nutrients.fat?.per_hundred || 0;

              // Calculate calories from macros if missing or zero
              let finalCalories = calories;
              if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
                finalCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
              }

              return {
                calories: finalCalories,
                protein,
                carbs,
                fat,
                fiber: nutrients.fiber?.per_hundred || 0,
                sugar: nutrients.sugars?.per_hundred || 0,
                sodium: (nutrients.salt?.per_hundred || 0) / 2.5, // Convert salt to sodium
              };
            })(),
            servingSize: product.serving_size || '100g',
          };
        }
      } catch (error) {
        // FoodRepo lookup failed, trying next source
      }
      return null;
    }
  }
};

export const foodAPI = {
  // Main function - tries multiple databases in sequence
  getProductByBarcode: async (barcode) => {
    try {
      // Clean the barcode
      const cleanBarcode = barcode.trim();

      // Try each API in order
      const sources = [
        APIs.openFoodFacts,
        APIs.usda,
        APIs.foodRepo,
      ];

      for (const api of sources) {
        const result = await api.tryFetch(cleanBarcode);

        if (result && result.found) {
          // Return in the exact format our app expects
          return {
            found: true,
            name: result.name,
            brand: result.brand,
            imageUrl: result.imageUrl,
            barcode: cleanBarcode,
            nutritionGrade: result.nutritionGrade || null,
            novaGroup: result.novaGroup || null,
            nutriscoreData: result.nutriscoreData || null,
            nutrition: result.nutrition,
            servingSize: result.servingSize,
            source: result.source, // So user knows where data came from
            rawData: result
          };
        }
      }

      // If no API found the product
      return {
        found: false,
        barcode: cleanBarcode,
        message: 'Product not found in our databases'
      };

    } catch (error) {
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
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`
      );
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        // Return top 25 results for better variety
        return data.products.slice(0, 25).map(product => {
          const calories = product.nutriments?.['energy-kcal_100g'] || 0;
          const protein = product.nutriments?.proteins_100g || 0;
          const carbs = product.nutriments?.carbohydrates_100g || 0;
          const fat = product.nutriments?.fat_100g || 0;

          // Calculate calories from macros if missing or zero
          let finalCalories = calories;
          if (calories === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
            finalCalories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
          }

          return {
            name: product.product_name || 'Unknown',
            brand: product.brands || '',
            barcode: product.code,
            imageUrl: product.image_url || product.image_front_small_url,
            nutrition: {
              calories: finalCalories,
              protein,
              carbs,
              fat,
            }
          };
        }).filter(food =>
          // Filter out foods with zero calories and no macros
          food.nutrition.calories > 0 ||
          food.nutrition.protein > 0 ||
          food.nutrition.carbs > 0 ||
          food.nutrition.fat > 0
        );
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