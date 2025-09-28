// Smart food search with MyFitnessPal-style ranking and suggestions
// Implements popularity scoring, relevance ranking, and intelligent categorization

import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const FOOD_POPULARITY_KEY = '@food_popularity';
const USER_PREFERENCES_KEY = '@user_preferences';

// Popular food brands that users commonly search for
const POPULAR_BRANDS = [
  'McDonald\'s', 'Starbucks', 'Subway', 'Chipotle', 'Wendy\'s', 'Burger King',
  'KFC', 'Taco Bell', 'Chick-fil-A', 'Panera', 'Dunkin\'', 'Pizza Hut',
  'Domino\'s', 'Coca-Cola', 'Pepsi', 'Nestle', 'Kellogg\'s', 'General Mills',
  'Kraft', 'Campbell\'s', 'Tyson', 'Hormel', 'Oscar Mayer', 'Dole'
];

// Common food categories for better matching
const FOOD_CATEGORIES = {
  proteins: ['chicken', 'beef', 'pork', 'fish', 'turkey', 'egg', 'tofu', 'protein'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  grains: ['bread', 'rice', 'pasta', 'cereal', 'oats', 'quinoa'],
  fruits: ['apple', 'banana', 'orange', 'berry', 'grape', 'melon'],
  vegetables: ['salad', 'broccoli', 'carrot', 'tomato', 'lettuce', 'spinach'],
  fastfood: ['burger', 'pizza', 'sandwich', 'wrap', 'taco', 'nugget'],
  beverages: ['coffee', 'tea', 'juice', 'soda', 'smoothie', 'shake'],
  snacks: ['chips', 'cookie', 'cracker', 'bar', 'nuts', 'popcorn']
};

// Common portion sizes for quick selection
export const COMMON_PORTIONS = {
  generic: [
    { label: '100g', value: 100 },
    { label: '1 cup (240g)', value: 240 },
    { label: '1 serving', value: 100 },
    { label: '1 oz (28g)', value: 28 },
    { label: '1 lb (454g)', value: 454 }
  ],
  proteins: [
    { label: '3 oz (85g)', value: 85 },
    { label: '4 oz (113g)', value: 113 },
    { label: '6 oz (170g)', value: 170 },
    { label: '8 oz (227g)', value: 227 },
    { label: '1 breast (174g)', value: 174 }
  ],
  liquids: [
    { label: '1 cup (240ml)', value: 240 },
    { label: '12 oz (355ml)', value: 355 },
    { label: '16 oz (473ml)', value: 473 },
    { label: '1 liter', value: 1000 }
  ],
  single: [
    { label: '1 small', value: 80 },
    { label: '1 medium', value: 120 },
    { label: '1 large', value: 180 },
    { label: '1 piece', value: 100 }
  ]
};

// Calculate relevance score for search results
const calculateRelevanceScore = (food, query, userHistory = {}) => {
  let score = 0;
  const queryLower = query.toLowerCase().trim();
  const nameLower = (food.name || '').toLowerCase();
  const brandLower = (food.brand || '').toLowerCase();

  // SUPER HIGH PRIORITY: Simple whole foods that exactly match
  const wholeFoodNames = [
    'banana', 'apple', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple',
    'chicken', 'beef', 'pork', 'salmon', 'tuna', 'egg', 'eggs',
    'rice', 'pasta', 'bread', 'oats', 'quinoa',
    'milk', 'cheese', 'yogurt', 'butter',
    'potato', 'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato'
  ];

  // Check if query is looking for a whole food
  const isWholeFoodQuery = wholeFoodNames.some(food => queryLower === food || queryLower === food + 's');

  if (isWholeFoodQuery) {
    // Massive bonus for actual whole foods vs processed products
    if (nameLower === queryLower || nameLower === queryLower + 's' || queryLower === nameLower + 's') {
      score += 10000; // Exact whole food match
    } else if (nameLower.startsWith(queryLower + ' ') || nameLower.startsWith(queryLower + ',')) {
      score += 5000; // E.g., "Banana, raw" or "Banana fresh"
    } else if (!brandLower && nameLower.includes(queryLower) && nameLower.split(' ').length <= 3) {
      score += 2000; // Simple food name containing query, no brand
    }

    // Penalize processed/flavored products when searching for whole foods
    if (nameLower.includes('yogurt') || nameLower.includes('cereal') ||
        nameLower.includes('bar') || nameLower.includes('smoothie') ||
        nameLower.includes('flavored') || nameLower.includes('shake') ||
        nameLower.includes('chips') || nameLower.includes('candy')) {
      if (queryLower !== 'yogurt' && queryLower !== 'cereal') {
        score -= 500; // Penalty for processed products
      }
    }
  }

  // Regular exact match bonus
  if (nameLower === queryLower) {
    score += 1000;
  } else if (nameLower.includes(queryLower)) {
    // Starts with query gets higher score
    if (nameLower.startsWith(queryLower)) {
      score += 500;
    } else {
      score += 200;
    }
  }

  // Bonus for foods without brands (likely whole foods)
  if (!brandLower && food.category && (food.category === 'Fruits' || food.category === 'Vegetables' ||
      food.category === 'Proteins' || food.category === 'Grains')) {
    score += 300;
  }

  // Brand match bonus (reduced for whole food queries)
  if (brandLower.includes(queryLower)) {
    score += isWholeFoodQuery ? 50 : 100;
  }

  // Popular brand bonus (reduced for whole food queries)
  if (POPULAR_BRANDS.some(brand => brandLower.includes(brand.toLowerCase()))) {
    score += isWholeFoodQuery ? 10 : 50;
  }

  // Word order matters - earlier words are more important
  const queryWords = queryLower.split(' ');
  const nameWords = nameLower.split(' ');
  queryWords.forEach((word, index) => {
    const wordIndex = nameWords.findIndex(w => w.includes(word));
    if (wordIndex !== -1) {
      // Bonus for matching word position
      score += (10 - Math.abs(index - wordIndex)) * 10;
    }
  });

  // User history bonus
  const foodKey = `${food.name}_${food.brand}`.toLowerCase();
  if (userHistory[foodKey]) {
    score += userHistory[foodKey] * 20; // Each previous selection adds 20 points
  }

  // Verified/comprehensive database bonus
  if (food.source === 'verified' || food.source === 'default') {
    score += 30;
  }

  // Category relevance
  Object.entries(FOOD_CATEGORIES).forEach(([category, keywords]) => {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        score += 25;
      }
    }
  });

  // Nutritional completeness bonus
  if (food.calories > 0 && food.protein !== undefined && food.carbs !== undefined) {
    score += 10;
  }

  // Barcode presence (indicates real product)
  if (food.barcode) {
    score += 15;
  }

  return score;
};

// Get user's search history and preferences
const getUserHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : {};
  } catch (error) {
    return {};
  }
};

// Update user's search history
export const updateSearchHistory = async (food) => {
  try {
    const history = await getUserHistory();
    const foodKey = `${food.name}_${food.brand}`.toLowerCase();

    history[foodKey] = (history[foodKey] || 0) + 1;

    // Keep only last 500 entries
    const entries = Object.entries(history);
    if (entries.length > 500) {
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      const trimmed = Object.fromEntries(sorted.slice(0, 500));
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
    } else {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating search history:', error);
  }
};

// Smart search with ranking and categorization
export const smartSearchFoods = async (foods, query, options = {}) => {
  const {
    limit = 50,
    offset = 0,
    includeCategories = true,
    includeSuggestions = true
  } = options;

  if (!query || query.length === 0) {
    // Return popular items when no query
    return {
      bestMatch: null,
      suggested: [],
      all: foods.slice(0, limit),
      categories: {},
      hasMore: foods.length > limit
    };
  }

  const userHistory = await getUserHistory();
  const queryLower = query.toLowerCase();

  // Score and sort all foods
  const scoredFoods = foods.map(food => ({
    ...food,
    relevanceScore: calculateRelevanceScore(food, query, userHistory)
  }));

  // Filter out zero-score results for specific queries
  const relevantFoods = query.length > 2
    ? scoredFoods.filter(f => f.relevanceScore > 0)
    : scoredFoods;

  // Sort by relevance score
  relevantFoods.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Find best match (highest scoring item)
  const bestMatch = relevantFoods.length > 0 && relevantFoods[0].relevanceScore > 200
    ? relevantFoods[0]
    : null;

  // Get suggested matches (top 5 high-scoring items)
  const suggested = relevantFoods
    .filter(f => f.relevanceScore > 100 && f !== bestMatch)
    .slice(0, 5);

  // Categorize results
  const categories = {};
  if (includeCategories) {
    relevantFoods.forEach(food => {
      // Determine category
      let category = 'Other';

      if (food.brand && POPULAR_BRANDS.includes(food.brand)) {
        category = 'Popular Brands';
      } else if (food.source === 'verified' || food.source === 'default') {
        category = 'Common Foods';
      } else if (food.barcode) {
        category = 'Branded Products';
      } else if (food.source === 'user') {
        category = 'My Foods';
      }

      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(food);
    });

    // Limit items per category for initial display
    Object.keys(categories).forEach(cat => {
      categories[cat] = categories[cat].slice(0, 10);
    });
  }

  // Get paginated results
  const paginatedResults = relevantFoods.slice(offset, offset + limit);

  return {
    bestMatch,
    suggested: suggested.filter(s => !paginatedResults.includes(s)),
    all: paginatedResults,
    categories,
    totalResults: relevantFoods.length,
    hasMore: relevantFoods.length > (offset + limit),
    nextOffset: offset + limit
  };
};

// Get smart suggestions based on partial input
export const getSmartSuggestions = async (partialQuery) => {
  if (!partialQuery || partialQuery.length < 2) {
    return [];
  }

  const queryLower = partialQuery.toLowerCase();
  const userHistory = await getUserHistory();

  // Common search completions
  const commonSearches = [
    'chicken breast', 'ground beef', 'white rice', 'brown rice',
    'banana', 'apple', 'eggs', 'milk', 'bread', 'pasta',
    'salmon', 'tuna', 'greek yogurt', 'cottage cheese',
    'peanut butter', 'olive oil', 'oatmeal', 'quinoa',
    'sweet potato', 'broccoli', 'spinach', 'avocado'
  ];

  // Get matching suggestions
  const suggestions = [];

  // Add from user history first (personalized)
  Object.keys(userHistory)
    .filter(key => key.includes(queryLower))
    .sort((a, b) => userHistory[b] - userHistory[a])
    .slice(0, 3)
    .forEach(key => {
      const parts = key.split('_');
      suggestions.push({
        text: parts[0],
        type: 'recent',
        count: userHistory[key]
      });
    });

  // Add common searches
  commonSearches
    .filter(search => search.includes(queryLower) &&
           !suggestions.some(s => s.text.toLowerCase() === search))
    .slice(0, 5)
    .forEach(search => {
      suggestions.push({
        text: search,
        type: 'common',
        count: 0
      });
    });

  return suggestions.slice(0, 8);
};

// Get recently searched foods
export const getRecentSearches = async (limit = 10) => {
  try {
    const history = await getUserHistory();
    const sorted = Object.entries(history)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => {
        const parts = key.split('_');
        return {
          name: parts[0],
          brand: parts[1] || '',
          searchCount: count
        };
      });

    return sorted;
  } catch (error) {
    return [];
  }
};

// Get trending/popular foods
export const getTrendingFoods = async () => {
  // This could be enhanced with real trending data from a backend
  // For now, return common foods people typically track
  return [
    { name: 'Chicken Breast (boneless, skinless)', trend: 'protein' },
    { name: 'White Rice (cooked)', trend: 'carbs' },
    { name: 'Banana', trend: 'fruit' },
    { name: 'Eggs (whole)', trend: 'breakfast' },
    { name: 'Greek Yogurt (Plain, Non-fat)', trend: 'snack' },
    { name: 'Avocado', trend: 'healthy_fat' },
    { name: 'Oatmeal (cooked)', trend: 'breakfast' },
    { name: 'Salmon (Atlantic)', trend: 'protein' },
    { name: 'Sweet Potato', trend: 'carbs' },
    { name: 'Protein Powder (Whey)', trend: 'supplement' }
  ];
};

// Analyze search query to determine intent
export const analyzeSearchIntent = (query) => {
  const queryLower = query.toLowerCase();

  // Check for restaurant/brand names
  const isBrandSearch = POPULAR_BRANDS.some(brand =>
    queryLower.includes(brand.toLowerCase())
  );

  // Check for meal types
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  const mealType = mealTypes.find(meal => queryLower.includes(meal));

  // Check for preparation methods
  const preparations = ['grilled', 'fried', 'baked', 'boiled', 'raw', 'cooked', 'steamed'];
  const preparation = preparations.find(prep => queryLower.includes(prep));

  // Check for dietary preferences
  const dietary = {
    lowCarb: queryLower.includes('low carb') || queryLower.includes('keto'),
    highProtein: queryLower.includes('protein') || queryLower.includes('high protein'),
    vegetarian: queryLower.includes('vegetarian') || queryLower.includes('veggie'),
    vegan: queryLower.includes('vegan'),
    glutenFree: queryLower.includes('gluten free')
  };

  return {
    isBrandSearch,
    mealType,
    preparation,
    dietary,
    searchType: isBrandSearch ? 'brand' : mealType ? 'meal' : 'food'
  };
};