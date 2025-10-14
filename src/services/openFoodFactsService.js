// Open Food Facts API Service
// Provides fallback search when local database doesn't have the item

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org';

// Search for products by name/query
export const searchOpenFoodFacts = async (query, limit = 20) => {
  try {
    // API endpoint for searching products
    const url = `${OPEN_FOOD_FACTS_API}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    // Transform Open Food Facts data to our format
    return data.products.map(product => transformProduct(product));
  } catch (error) {
    return [];
  }
};

// Get product by barcode
export const getProductByBarcode = async (barcode) => {
  try {
    const url = `${OPEN_FOOD_FACTS_API}/api/v0/product/${barcode}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    return transformProduct(data.product);
  } catch (error) {
    return null;
  }
};

// Transform Open Food Facts product to our database format
const transformProduct = (product) => {
  // Get nutriments per 100g (Open Food Facts standard)
  const nutriments = product.nutriments || {};

  // Extract brand and product name
  const brand = product.brands || '';
  const name = product.product_name || product.product_name_en || 'Unknown Product';

  // Combine brand and name if brand exists
  const fullName = brand ? `${name} (${brand})` : name;

  // Get main nutrients (per 100g)
  const calories = Math.round(nutriments['energy-kcal_100g'] || nutriments['energy_100g'] / 4.184 || 0);
  const protein = Math.round((nutriments.proteins_100g || 0) * 10) / 10;
  const carbs = Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10;
  const fat = Math.round((nutriments.fat_100g || 0) * 10) / 10;

  // Get additional nutrients
  const fiber = Math.round((nutriments.fiber_100g || 0) * 10) / 10;
  const sugar = Math.round((nutriments.sugars_100g || 0) * 10) / 10;
  const sodium = Math.round(nutriments.sodium_100g * 1000 || 0); // Convert to mg
  const saturatedFat = Math.round((nutriments['saturated-fat_100g'] || 0) * 10) / 10;

  // Get serving size if available
  const servingSize = product.serving_size || '100g';

  // Try to parse serving quantity in grams
  let servingQuantity = 100; // Default
  if (product.serving_quantity) {
    servingQuantity = parseFloat(product.serving_quantity);
  } else if (product.serving_size) {
    // Try to extract number from serving_size string (e.g., "30g" -> 30)
    const match = product.serving_size.match(/(\d+\.?\d*)\s*g/i);
    if (match) {
      servingQuantity = parseFloat(match[1]);
    }
  }

  // Determine category from Open Food Facts categories
  let category = 'General';
  if (product.categories) {
    const categoriesLower = product.categories.toLowerCase();
    if (categoriesLower.includes('meat') || categoriesLower.includes('poultry')) {
      category = 'Proteins';
    } else if (categoriesLower.includes('dairy') || categoriesLower.includes('milk') || categoriesLower.includes('cheese')) {
      category = 'Dairy';
    } else if (categoriesLower.includes('fruit')) {
      category = 'Fruits';
    } else if (categoriesLower.includes('vegetable')) {
      category = 'Vegetables';
    } else if (categoriesLower.includes('grain') || categoriesLower.includes('bread') || categoriesLower.includes('cereal')) {
      category = 'Grains';
    } else if (categoriesLower.includes('snack')) {
      category = 'Snacks';
    } else if (categoriesLower.includes('beverage') || categoriesLower.includes('drink')) {
      category = 'Beverages';
    }
  }

  return {
    id: product.code || product._id || Date.now().toString(),
    name: fullName,
    brand: brand,
    barcode: product.code,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
    saturatedFat,
    servingSize,
    servingQuantity, // Added: actual serving size in grams
    category,
    source: 'openfoodfacts',
    // Additional Open Food Facts data
    imageUrl: product.image_url || product.image_front_url,
    ingredients: product.ingredients_text,
    nutriScore: product.nutrition_grades,
    novaGroup: product.nova_group,
  };
};

// Check if we should use API (for branded products, barcodes, etc.)
export const shouldUseAPI = (query) => {
  // Check if it's a barcode (all digits, 8-13 characters)
  if (/^\d{8,13}$/.test(query)) {
    return true;
  }

  // Check for brand indicators
  const brandKeywords = [
    'mcdonald', 'starbucks', 'subway', 'kellogg', 'nestle', 'coca', 'pepsi',
    'kraft', 'general mills', 'post', 'quaker', 'campbell', 'heinz'
  ];

  const queryLower = query.toLowerCase();
  return brandKeywords.some(brand => queryLower.includes(brand));
};

// Combine local and API results
export const hybridSearch = async (query, localResults) => {
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(' ');

  // Check if this is a simple/generic search
  const isGenericSearch = queryWords.length === 1 && queryWords[0].length < 7;

  // Common whole food names that don't need API results
  const wholeFoodTerms = [
    'banana', 'apple', 'orange', 'chicken', 'beef', 'egg', 'eggs',
    'rice', 'bread', 'milk', 'cheese', 'potato', 'carrot', 'tomato'
  ];

  const isWholeFoodSearch = wholeFoodTerms.some(term =>
    queryLower === term || queryLower === term + 's'
  );

  // If searching for whole foods and have good local results, skip API
  if (isWholeFoodSearch && localResults.length >= 5) {
    return {
      local: localResults,
      api: [],
      combined: localResults
    };
  }

  // If we have plenty of good local results for generic searches, use them
  if (isGenericSearch && localResults.length >= 10) {
    return {
      local: localResults,
      api: [],
      combined: localResults
    };
  }

  // Only use API for specific searches or when local results are insufficient
  const needsAPI = (
    shouldUseAPI(query) ||  // Barcode or known brand
    queryWords.length >= 2 ||  // Multi-word search (likely specific product)
    localResults.length < 3  // Very few local results
  ) && !isWholeFoodSearch;  // But not for whole food searches

  if (needsAPI) {
    // If it's a barcode, use barcode lookup
    if (/^\d{8,13}$/.test(query)) {
      const product = await getProductByBarcode(query);
      if (product) {
        return {
          local: localResults,
          api: [product],
          combined: [product, ...localResults]
        };
      }
    } else {
      // Regular text search
      const apiResults = await searchOpenFoodFacts(query, 10);

      // Combine results, API first (usually more specific)
      const combined = [...apiResults, ...localResults];

      // Remove duplicates based on name similarity
      const uniqueResults = [];
      const seenNames = new Set();

      combined.forEach(food => {
        const simplifiedName = food.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!seenNames.has(simplifiedName)) {
          seenNames.add(simplifiedName);
          uniqueResults.push(food);
        }
      });

      return {
        local: localResults,
        api: apiResults,
        combined: uniqueResults.slice(0, 30) // Limit total results
      };
    }
  }

  return {
    local: localResults,
    api: [],
    combined: localResults
  };
};