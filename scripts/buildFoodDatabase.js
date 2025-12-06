/**
 * Food Database Builder Script
 *
 * This script builds a curated food database by:
 * 1. Fetching from USDA and Open Food Facts APIs
 * 2. Filtering out junk/incomplete data
 * 3. Scoring by relevance and popularity
 * 4. Selecting top 5000 high-quality foods
 * 5. Exporting to JSON for app use
 *
 * Run with: node scripts/buildFoodDatabase.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  OUTPUT_FILE: path.join(__dirname, '../src/data/curatedFoods.json'),
  TARGET_FOOD_COUNT: 5000,
  USDA_API_KEY: 'DEMO_KEY', // Replace with real key for production
  USDA_BASE_URL: 'https://api.nal.usda.gov/fdc/v1',
  OFF_BASE_URL: 'https://world.openfoodfacts.org/api/v2',
};

// Known brands for scoring
const KNOWN_BRANDS = [
  'chobani', 'fage', 'oikos', 'dannon', 'yoplait', // Yogurt
  'tyson', 'perdue', 'foster farms', 'butterball', // Poultry
  'oscar mayer', 'hillshire', 'boars head', 'applegate', // Deli
  'barilla', 'ronzoni', 'de cecco', 'banza', // Pasta
  'quaker', 'general mills', 'kelloggs', 'post', // Cereals
  'kind', 'rxbar', 'quest', 'clif', 'larabar', // Bars
  'fairlife', 'horizon', 'organic valley', 'silk', // Dairy/Alt
  'sabra', 'wholly guacamole', 'good foods', // Dips
  'dave\'s killer bread', 'ezekiel', 'nature\'s own', // Bread
  'beyond meat', 'impossible', 'gardein', 'morningstar', // Plant-based
];

// Fitness-relevant categories
const FITNESS_CATEGORIES = [
  'protein', 'chicken', 'beef', 'fish', 'salmon', 'tuna', 'eggs',
  'greek yogurt', 'cottage cheese', 'whey', 'casein',
  'rice', 'oats', 'quinoa', 'sweet potato', 'potato',
  'broccoli', 'spinach', 'kale', 'vegetables',
  'almonds', 'peanut butter', 'avocado', 'olive oil',
  'banana', 'apple', 'berries', 'fruits',
];

/**
 * Common foods that should always be included (manually curated)
 * These are the most searched/used foods in fitness apps
 */
const ESSENTIAL_FOODS = [
  // Proteins
  { name: 'Chicken Breast (raw)', calories: 120, protein: 22.5, carbs: 0, fat: 2.6, serving: '100g', category: 'Protein' },
  { name: 'Chicken Breast (cooked)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', category: 'Protein' },
  { name: 'Chicken Thigh (raw)', calories: 177, protein: 19.7, carbs: 0, fat: 10.9, serving: '100g', category: 'Protein' },
  { name: 'Chicken Thigh (cooked)', calories: 209, protein: 26, carbs: 0, fat: 10.9, serving: '100g', category: 'Protein' },
  { name: 'Ground Beef 90% Lean', calories: 176, protein: 20, carbs: 0, fat: 10, serving: '100g', category: 'Protein' },
  { name: 'Ground Beef 80% Lean', calories: 254, protein: 17.2, carbs: 0, fat: 20, serving: '100g', category: 'Protein' },
  { name: 'Ground Turkey 93% Lean', calories: 150, protein: 21, carbs: 0, fat: 7, serving: '100g', category: 'Protein' },
  { name: 'Salmon (raw)', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g', category: 'Protein' },
  { name: 'Salmon (cooked)', calories: 206, protein: 22, carbs: 0, fat: 12, serving: '100g', category: 'Protein' },
  { name: 'Tuna (canned in water)', calories: 116, protein: 26, carbs: 0, fat: 0.8, serving: '100g', category: 'Protein' },
  { name: 'Tilapia (cooked)', calories: 128, protein: 26, carbs: 0, fat: 2.7, serving: '100g', category: 'Protein' },
  { name: 'Shrimp (cooked)', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, serving: '100g', category: 'Protein' },
  { name: 'Egg (whole, large)', calories: 72, protein: 6.3, carbs: 0.4, fat: 5, serving: '1 large (50g)', category: 'Protein' },
  { name: 'Egg White', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, serving: '1 large (33g)', category: 'Protein' },
  { name: 'Egg Yolk', calories: 55, protein: 2.7, carbs: 0.6, fat: 4.5, serving: '1 large (17g)', category: 'Protein' },
  { name: 'Steak (Sirloin)', calories: 183, protein: 27, carbs: 0, fat: 8, serving: '100g', category: 'Protein' },
  { name: 'Pork Tenderloin', calories: 143, protein: 26, carbs: 0, fat: 3.5, serving: '100g', category: 'Protein' },
  { name: 'Bacon', calories: 541, protein: 37, carbs: 1.4, fat: 42, serving: '100g', category: 'Protein' },
  { name: 'Turkey Breast (deli)', calories: 104, protein: 18, carbs: 4, fat: 1.7, serving: '100g', category: 'Protein' },
  { name: 'Tofu (firm)', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: '100g', category: 'Protein' },
  { name: 'Tempeh', calories: 192, protein: 20, carbs: 7.6, fat: 11, serving: '100g', category: 'Protein' },

  // Dairy
  { name: 'Greek Yogurt (plain, nonfat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, serving: '100g', category: 'Dairy' },
  { name: 'Greek Yogurt (plain, 2%)', calories: 73, protein: 9.7, carbs: 4, fat: 1.9, serving: '100g', category: 'Dairy' },
  { name: 'Cottage Cheese (1% fat)', calories: 72, protein: 12, carbs: 2.7, fat: 1, serving: '100g', category: 'Dairy' },
  { name: 'Cottage Cheese (2% fat)', calories: 86, protein: 11, carbs: 4.3, fat: 2.3, serving: '100g', category: 'Dairy' },
  { name: 'Milk (whole)', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, serving: '100ml', category: 'Dairy' },
  { name: 'Milk (2%)', calories: 50, protein: 3.3, carbs: 4.8, fat: 2, serving: '100ml', category: 'Dairy' },
  { name: 'Milk (skim)', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, serving: '100ml', category: 'Dairy' },
  { name: 'Cheddar Cheese', calories: 403, protein: 25, carbs: 1.3, fat: 33, serving: '100g', category: 'Dairy' },
  { name: 'Mozzarella Cheese', calories: 280, protein: 28, carbs: 3.1, fat: 17, serving: '100g', category: 'Dairy' },
  { name: 'Parmesan Cheese', calories: 431, protein: 38, carbs: 4.1, fat: 29, serving: '100g', category: 'Dairy' },
  { name: 'Cream Cheese', calories: 342, protein: 6, carbs: 4.1, fat: 34, serving: '100g', category: 'Dairy' },
  { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, serving: '100g', category: 'Fats' },

  // Carbs
  { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: '100g', category: 'Carbs' },
  { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 24, fat: 0.9, serving: '100g', category: 'Carbs' },
  { name: 'Jasmine Rice (cooked)', calories: 129, protein: 2.4, carbs: 28, fat: 0.4, serving: '100g', category: 'Carbs' },
  { name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, serving: '100g', category: 'Carbs' },
  { name: 'Oatmeal (cooked)', calories: 68, protein: 2.5, carbs: 12, fat: 1.4, serving: '100g', category: 'Carbs' },
  { name: 'Oats (dry)', calories: 389, protein: 17, carbs: 66, fat: 6.9, serving: '100g', category: 'Carbs' },
  { name: 'Sweet Potato (baked)', calories: 90, protein: 2, carbs: 21, fat: 0.1, serving: '100g', category: 'Carbs' },
  { name: 'Potato (baked)', calories: 93, protein: 2.5, carbs: 21, fat: 0.1, serving: '100g', category: 'Carbs' },
  { name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, serving: '100g', category: 'Carbs' },
  { name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, serving: '100g', category: 'Carbs' },
  { name: 'White Bread', calories: 265, protein: 9, carbs: 49, fat: 3.2, serving: '100g', category: 'Carbs' },
  { name: 'Tortilla (flour)', calories: 312, protein: 8.3, carbs: 52, fat: 8, serving: '100g', category: 'Carbs' },
  { name: 'Tortilla (corn)', calories: 218, protein: 5.7, carbs: 44, fat: 2.9, serving: '100g', category: 'Carbs' },
  { name: 'Bagel', calories: 257, protein: 10, carbs: 50, fat: 1.2, serving: '100g', category: 'Carbs' },

  // Vegetables
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: '100g', category: 'Vegetables' },
  { name: 'Spinach (raw)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: '100g', category: 'Vegetables' },
  { name: 'Spinach (cooked)', calories: 23, protein: 3, carbs: 3.8, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Kale', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, serving: '100g', category: 'Vegetables' },
  { name: 'Asparagus', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, serving: '100g', category: 'Vegetables' },
  { name: 'Green Beans', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, serving: '100g', category: 'Vegetables' },
  { name: 'Bell Pepper', calories: 31, protein: 1, carbs: 6, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Carrots', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, serving: '100g', category: 'Vegetables' },
  { name: 'Zucchini', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, serving: '100g', category: 'Vegetables' },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g', category: 'Vegetables' },
  { name: 'Onion', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, serving: '100g', category: 'Vegetables' },
  { name: 'Garlic', calories: 149, protein: 6.4, carbs: 33, fat: 0.5, serving: '100g', category: 'Vegetables' },
  { name: 'Mushrooms', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Cauliflower', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Brussels Sprouts', calories: 43, protein: 3.4, carbs: 9, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Lettuce (Romaine)', calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, serving: '100g', category: 'Vegetables' },
  { name: 'Cabbage', calories: 25, protein: 1.3, carbs: 6, fat: 0.1, serving: '100g', category: 'Vegetables' },
  { name: 'Celery', calories: 14, protein: 0.7, carbs: 3, fat: 0.2, serving: '100g', category: 'Vegetables' },
  { name: 'Corn', calories: 86, protein: 3.3, carbs: 19, fat: 1.4, serving: '100g', category: 'Vegetables' },

  // Fruits
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '100g', category: 'Fruits' },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: '100g', category: 'Fruits' },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, serving: '100g', category: 'Fruits' },
  { name: 'Strawberries', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, serving: '100g', category: 'Fruits' },
  { name: 'Blueberries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, serving: '100g', category: 'Fruits' },
  { name: 'Raspberries', calories: 52, protein: 1.2, carbs: 12, fat: 0.7, serving: '100g', category: 'Fruits' },
  { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, serving: '100g', category: 'Fruits' },
  { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, serving: '100g', category: 'Fruits' },
  { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, serving: '100g', category: 'Fruits' },
  { name: 'Pineapple', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, serving: '100g', category: 'Fruits' },
  { name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '100g', category: 'Fruits' },
  { name: 'Peach', calories: 39, protein: 0.9, carbs: 10, fat: 0.3, serving: '100g', category: 'Fruits' },

  // Fats & Nuts
  { name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, serving: '100ml', category: 'Fats' },
  { name: 'Coconut Oil', calories: 862, protein: 0, carbs: 0, fat: 100, serving: '100ml', category: 'Fats' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, serving: '100g', category: 'Fats' },
  { name: 'Peanuts', calories: 567, protein: 26, carbs: 16, fat: 49, serving: '100g', category: 'Fats' },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, serving: '100g', category: 'Fats' },
  { name: 'Almond Butter', calories: 614, protein: 21, carbs: 19, fat: 56, serving: '100g', category: 'Fats' },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65, serving: '100g', category: 'Fats' },
  { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44, serving: '100g', category: 'Fats' },
  { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fat: 31, serving: '100g', category: 'Fats' },
  { name: 'Flax Seeds', calories: 534, protein: 18, carbs: 29, fat: 42, serving: '100g', category: 'Fats' },
  { name: 'Sunflower Seeds', calories: 584, protein: 21, carbs: 20, fat: 51, serving: '100g', category: 'Fats' },

  // Legumes
  { name: 'Black Beans (cooked)', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, serving: '100g', category: 'Carbs' },
  { name: 'Chickpeas (cooked)', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, serving: '100g', category: 'Carbs' },
  { name: 'Lentils (cooked)', calories: 116, protein: 9, carbs: 20, fat: 0.4, serving: '100g', category: 'Carbs' },
  { name: 'Kidney Beans (cooked)', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, serving: '100g', category: 'Carbs' },
  { name: 'Edamame', calories: 121, protein: 11, carbs: 9, fat: 5, serving: '100g', category: 'Protein' },
  { name: 'Hummus', calories: 166, protein: 8, carbs: 14, fat: 10, serving: '100g', category: 'Fats' },

  // Supplements
  { name: 'Whey Protein Powder', calories: 120, protein: 24, carbs: 3, fat: 1.5, serving: '1 scoop (30g)', category: 'Supplements' },
  { name: 'Casein Protein Powder', calories: 120, protein: 24, carbs: 3, fat: 1, serving: '1 scoop (30g)', category: 'Supplements' },
  { name: 'Creatine Monohydrate', calories: 0, protein: 0, carbs: 0, fat: 0, serving: '5g', category: 'Supplements' },

  // Beverages
  { name: 'Coffee (black)', calories: 2, protein: 0.3, carbs: 0, fat: 0, serving: '240ml', category: 'Beverages' },
  { name: 'Green Tea', calories: 0, protein: 0, carbs: 0, fat: 0, serving: '240ml', category: 'Beverages' },
  { name: 'Orange Juice', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, serving: '100ml', category: 'Beverages' },
  { name: 'Almond Milk (unsweetened)', calories: 13, protein: 0.4, carbs: 0.3, fat: 1.1, serving: '100ml', category: 'Beverages' },
  { name: 'Oat Milk', calories: 47, protein: 1, carbs: 7, fat: 1.5, serving: '100ml', category: 'Beverages' },
  { name: 'Soy Milk', calories: 33, protein: 2.8, carbs: 1.2, fat: 1.8, serving: '100ml', category: 'Beverages' },

  // Condiments
  { name: 'Honey', calories: 304, protein: 0.3, carbs: 82, fat: 0, serving: '100g', category: 'Condiments' },
  { name: 'Maple Syrup', calories: 260, protein: 0, carbs: 67, fat: 0.1, serving: '100g', category: 'Condiments' },
  { name: 'Soy Sauce', calories: 53, protein: 8.1, carbs: 4.9, fat: 0, serving: '100ml', category: 'Condiments' },
  { name: 'Hot Sauce', calories: 11, protein: 0.5, carbs: 2.3, fat: 0.1, serving: '100g', category: 'Condiments' },
  { name: 'Mustard', calories: 66, protein: 4, carbs: 6, fat: 4, serving: '100g', category: 'Condiments' },
  { name: 'Ketchup', calories: 112, protein: 1.7, carbs: 26, fat: 0.1, serving: '100g', category: 'Condiments' },
  { name: 'Mayonnaise', calories: 680, protein: 1, carbs: 0.6, fat: 75, serving: '100g', category: 'Condiments' },
  { name: 'Salsa', calories: 36, protein: 1.5, carbs: 7, fat: 0.2, serving: '100g', category: 'Condiments' },
];

/**
 * Filter junk data from API results
 */
function filterJunkData(foods) {
  return foods.filter(food => {
    // Must have a name
    if (!food.name || food.name.length < 2) return false;

    // Must have calories (indicates complete data)
    if (!food.calories || food.calories <= 0) return false;

    // Remove foods with weird characters
    if (/[^\w\s\-\(\)\'\".,&%]/.test(food.name)) return false;

    // Remove foods with "???" or incomplete names
    if (food.name.includes('???') || food.name.includes('undefined')) return false;

    // Remove fake barcodes (starting with 000)
    if (food.barcode && food.barcode.startsWith('000')) return false;

    // Must have protein, carbs, and fat data
    if (food.protein === undefined || food.carbs === undefined || food.fat === undefined) return false;

    // Sanity check: macros shouldn't exceed calories
    const macroCalories = (food.protein * 4) + (food.carbs * 4) + (food.fat * 9);
    if (macroCalories > food.calories * 1.3) return false; // Allow 30% tolerance

    // Name shouldn't be too long (usually indicates junk)
    if (food.name.length > 100) return false;

    return true;
  });
}

/**
 * Calculate relevance score for a food item
 */
function calculateRelevanceScore(food) {
  let score = 0;

  // Completeness (max 30 points)
  if (food.calories > 0) score += 10;
  if (food.protein !== undefined) score += 5;
  if (food.carbs !== undefined) score += 5;
  if (food.fat !== undefined) score += 5;
  if (food.serving) score += 5;

  // Brand recognition (max 25 points)
  const brandLower = (food.brand || '').toLowerCase();
  const nameLower = food.name.toLowerCase();
  if (KNOWN_BRANDS.some(brand => brandLower.includes(brand) || nameLower.includes(brand))) {
    score += 25;
  }

  // Fitness relevance (max 25 points)
  if (FITNESS_CATEGORIES.some(cat => nameLower.includes(cat))) {
    score += 25;
  }

  // Popularity boost (max 20 points) - based on common foods
  const commonTerms = ['chicken', 'rice', 'egg', 'milk', 'bread', 'banana', 'apple', 'beef', 'fish', 'yogurt', 'cheese', 'pasta', 'oat'];
  if (commonTerms.some(term => nameLower.includes(term))) {
    score += 20;
  }

  // Verified source bonus
  if (food.source === 'usda') score += 10;
  if (food.verified) score += 10;

  return score;
}

/**
 * Normalize food data to consistent format
 */
function normalizeFood(food, source) {
  return {
    id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: food.name.trim(),
    aliases: food.aliases || [],
    brand: food.brand || null,
    category: food.category || categorizeFood(food.name),

    // Nutrition per serving
    calories: Math.round(food.calories || 0),
    protein: Math.round((food.protein || 0) * 10) / 10,
    carbs: Math.round((food.carbs || 0) * 10) / 10,
    fat: Math.round((food.fat || 0) * 10) / 10,
    fiber: food.fiber ? Math.round(food.fiber * 10) / 10 : null,
    sugar: food.sugar ? Math.round(food.sugar * 10) / 10 : null,
    sodium: food.sodium ? Math.round(food.sodium) : null,

    // Serving info
    serving_size: food.serving || '100g',
    serving_quantity: food.serving_quantity || 100,
    common_servings: generateCommonServings(food),

    // Metadata
    verified: food.verified || source === 'essential',
    popularity_score: food.popularity_score || calculateRelevanceScore(food),
    source: source,
    barcode: food.barcode || null,

    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Auto-categorize food based on name
 */
function categorizeFood(name) {
  const nameLower = name.toLowerCase();

  if (/chicken|beef|pork|fish|salmon|tuna|shrimp|egg|turkey|bacon|steak|tofu|tempeh/.test(nameLower)) {
    return 'Protein';
  }
  if (/rice|pasta|bread|oat|quinoa|potato|tortilla|bagel|cereal/.test(nameLower)) {
    return 'Carbs';
  }
  if (/yogurt|milk|cheese|cottage|cream/.test(nameLower)) {
    return 'Dairy';
  }
  if (/broccoli|spinach|kale|lettuce|carrot|tomato|cucumber|pepper|onion|mushroom|vegetable/.test(nameLower)) {
    return 'Vegetables';
  }
  if (/banana|apple|orange|berry|grape|mango|fruit|melon|peach/.test(nameLower)) {
    return 'Fruits';
  }
  if (/oil|butter|almond|peanut|walnut|cashew|seed|avocado|nut/.test(nameLower)) {
    return 'Fats';
  }
  if (/protein powder|whey|casein|creatine|supplement/.test(nameLower)) {
    return 'Supplements';
  }
  if (/juice|coffee|tea|soda|water|milk/.test(nameLower)) {
    return 'Beverages';
  }
  if (/sauce|dressing|ketchup|mustard|mayo|honey|syrup/.test(nameLower)) {
    return 'Condiments';
  }
  if (/bar|cookie|chip|snack|candy/.test(nameLower)) {
    return 'Snacks';
  }

  return 'Other';
}

/**
 * Generate common serving sizes for a food
 */
function generateCommonServings(food) {
  const servings = [];
  const nameLower = food.name.toLowerCase();

  // Default 100g option
  servings.push({ label: '100g', value: 100 });

  // Food-specific servings
  if (nameLower.includes('egg')) {
    servings.push({ label: '1 large egg (50g)', value: 50 });
    servings.push({ label: '2 large eggs (100g)', value: 100 });
  }
  if (nameLower.includes('chicken breast')) {
    servings.push({ label: '1 breast (170g)', value: 170 });
    servings.push({ label: '4 oz (113g)', value: 113 });
    servings.push({ label: '6 oz (170g)', value: 170 });
  }
  if (nameLower.includes('rice') || nameLower.includes('pasta')) {
    servings.push({ label: '1 cup cooked (158g)', value: 158 });
    servings.push({ label: '1/2 cup (79g)', value: 79 });
  }
  if (nameLower.includes('banana')) {
    servings.push({ label: '1 medium (118g)', value: 118 });
    servings.push({ label: '1 large (136g)', value: 136 });
  }
  if (nameLower.includes('apple')) {
    servings.push({ label: '1 medium (182g)', value: 182 });
    servings.push({ label: '1 small (149g)', value: 149 });
  }
  if (nameLower.includes('yogurt')) {
    servings.push({ label: '1 container (170g)', value: 170 });
    servings.push({ label: '1 cup (245g)', value: 245 });
  }
  if (nameLower.includes('milk')) {
    servings.push({ label: '1 cup (244ml)', value: 244 });
    servings.push({ label: '1/2 cup (122ml)', value: 122 });
  }
  if (nameLower.includes('bread')) {
    servings.push({ label: '1 slice (30g)', value: 30 });
    servings.push({ label: '2 slices (60g)', value: 60 });
  }
  if (nameLower.includes('peanut butter') || nameLower.includes('almond butter')) {
    servings.push({ label: '1 tbsp (16g)', value: 16 });
    servings.push({ label: '2 tbsp (32g)', value: 32 });
  }
  if (nameLower.includes('oil')) {
    servings.push({ label: '1 tbsp (14g)', value: 14 });
    servings.push({ label: '1 tsp (5g)', value: 5 });
  }
  if (nameLower.includes('protein powder') || nameLower.includes('whey')) {
    servings.push({ label: '1 scoop (30g)', value: 30 });
    servings.push({ label: '2 scoops (60g)', value: 60 });
  }

  return servings;
}

/**
 * Remove duplicates, keeping highest quality
 */
function removeDuplicates(foods) {
  const seen = new Map();

  for (const food of foods) {
    const key = food.name.toLowerCase().trim();
    const existing = seen.get(key);

    if (!existing || food.popularity_score > existing.popularity_score) {
      seen.set(key, food);
    }
  }

  return Array.from(seen.values());
}

/**
 * Main build function
 */
async function buildDatabase() {
  console.log('🍔 Starting Food Database Build...\n');

  // Step 1: Start with essential foods
  console.log('📦 Step 1: Loading essential foods...');
  let allFoods = ESSENTIAL_FOODS.map(food => normalizeFood(food, 'essential'));
  console.log(`   ✅ Loaded ${allFoods.length} essential foods\n`);

  // Step 2: Add more foods from APIs (placeholder - will be implemented)
  console.log('🌐 Step 2: API fetching (placeholder for now)...');
  console.log('   ⏭️  Skipping API fetch - using curated foods only for initial build\n');

  // Step 3: Filter junk data
  console.log('🧹 Step 3: Filtering junk data...');
  const beforeFilter = allFoods.length;
  allFoods = filterJunkData(allFoods);
  console.log(`   ✅ Filtered: ${beforeFilter} → ${allFoods.length} foods\n`);

  // Step 4: Calculate relevance scores
  console.log('📊 Step 4: Calculating relevance scores...');
  allFoods = allFoods.map(food => ({
    ...food,
    popularity_score: calculateRelevanceScore(food),
  }));
  console.log(`   ✅ Scored ${allFoods.length} foods\n`);

  // Step 5: Remove duplicates
  console.log('🔄 Step 5: Removing duplicates...');
  const beforeDedup = allFoods.length;
  allFoods = removeDuplicates(allFoods);
  console.log(`   ✅ Deduped: ${beforeDedup} → ${allFoods.length} foods\n`);

  // Step 6: Sort by relevance and take top N
  console.log('🏆 Step 6: Selecting top foods...');
  allFoods.sort((a, b) => b.popularity_score - a.popularity_score);
  const curatedFoods = allFoods.slice(0, CONFIG.TARGET_FOOD_COUNT);
  console.log(`   ✅ Selected top ${curatedFoods.length} foods\n`);

  // Step 7: Create output
  const output = {
    version: 1,
    generated_at: new Date().toISOString(),
    total_foods: curatedFoods.length,
    categories: [...new Set(curatedFoods.map(f => f.category))],
    foods: curatedFoods,
  };

  // Step 8: Ensure output directory exists
  const outputDir = path.dirname(CONFIG.OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 9: Write to file
  console.log('💾 Step 7: Writing to file...');
  fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(output, null, 2));
  const fileSizeKB = (fs.statSync(CONFIG.OUTPUT_FILE).size / 1024).toFixed(2);
  console.log(`   ✅ Written to: ${CONFIG.OUTPUT_FILE}`);
  console.log(`   📁 File size: ${fileSizeKB} KB\n`);

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('✅ BUILD COMPLETE!');
  console.log('═══════════════════════════════════════════');
  console.log(`Total foods: ${curatedFoods.length}`);
  console.log(`Categories: ${output.categories.join(', ')}`);
  console.log(`File: ${CONFIG.OUTPUT_FILE}`);
  console.log(`Size: ${fileSizeKB} KB`);
  console.log('═══════════════════════════════════════════\n');

  // Category breakdown
  console.log('📊 Category Breakdown:');
  const categoryCounts = {};
  curatedFoods.forEach(f => {
    categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
  });
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} foods`);
    });

  return output;
}

// Run the build
buildDatabase().catch(console.error);
