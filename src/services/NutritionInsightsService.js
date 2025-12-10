/**
 * NutritionInsightsService - Phase 10 Implementation
 *
 * Provides:
 * - Micronutrient data (vitamins, minerals) for foods
 * - Nutrient density scoring
 * - Food quality/processing level assessment
 * - Allergen information
 * - Daily value calculations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for settings
const DETAILED_NUTRITION_KEY = '@show_detailed_nutrition';

// Daily Recommended Values (based on FDA 2000 calorie diet)
export const DAILY_VALUES = {
  // Vitamins
  vitaminA: { value: 900, unit: 'mcg', name: 'Vitamin A' },
  vitaminB1: { value: 1.2, unit: 'mg', name: 'Thiamin (B1)' },
  vitaminB2: { value: 1.3, unit: 'mg', name: 'Riboflavin (B2)' },
  vitaminB3: { value: 16, unit: 'mg', name: 'Niacin (B3)' },
  vitaminB5: { value: 5, unit: 'mg', name: 'Pantothenic Acid (B5)' },
  vitaminB6: { value: 1.7, unit: 'mg', name: 'Vitamin B6' },
  vitaminB12: { value: 2.4, unit: 'mcg', name: 'Vitamin B12' },
  vitaminC: { value: 90, unit: 'mg', name: 'Vitamin C' },
  vitaminD: { value: 20, unit: 'mcg', name: 'Vitamin D' },
  vitaminE: { value: 15, unit: 'mg', name: 'Vitamin E' },
  vitaminK: { value: 120, unit: 'mcg', name: 'Vitamin K' },
  folate: { value: 400, unit: 'mcg', name: 'Folate' },

  // Minerals
  calcium: { value: 1300, unit: 'mg', name: 'Calcium' },
  iron: { value: 18, unit: 'mg', name: 'Iron' },
  magnesium: { value: 420, unit: 'mg', name: 'Magnesium' },
  phosphorus: { value: 1250, unit: 'mg', name: 'Phosphorus' },
  potassium: { value: 4700, unit: 'mg', name: 'Potassium' },
  sodium: { value: 2300, unit: 'mg', name: 'Sodium' },
  zinc: { value: 11, unit: 'mg', name: 'Zinc' },
  selenium: { value: 55, unit: 'mcg', name: 'Selenium' },
};

// Micronutrient data for all foods (per 100g)
// Data sourced from USDA FoodData Central
const MICRONUTRIENT_DATABASE = {
  // ==================== PROTEIN SOURCES ====================

  'Chicken Breast (raw)': {
    vitamins: { vitaminA: 6, vitaminB1: 0.06, vitaminB2: 0.08, vitaminB3: 10.4, vitaminB5: 0.8, vitaminB6: 0.5, vitaminB12: 0.3, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.2, vitaminK: 0, folate: 4 },
    minerals: { calcium: 9, iron: 0.7, magnesium: 25, phosphorus: 190, potassium: 220, sodium: 65, zinc: 0.8, selenium: 23 },
    processingLevel: 1, allergens: [],
  },
  'Chicken Breast (cooked)': {
    vitamins: { vitaminA: 6, vitaminB1: 0.07, vitaminB2: 0.11, vitaminB3: 13.7, vitaminB5: 1.0, vitaminB6: 0.6, vitaminB12: 0.3, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.3, vitaminK: 0, folate: 4 },
    minerals: { calcium: 11, iron: 1.0, magnesium: 29, phosphorus: 220, potassium: 256, sodium: 74, zinc: 1.0, selenium: 27.6 },
    processingLevel: 1, allergens: [],
  },
  'Chicken Thigh (raw)': {
    vitamins: { vitaminA: 17, vitaminB1: 0.07, vitaminB2: 0.15, vitaminB3: 5.7, vitaminB5: 1.1, vitaminB6: 0.33, vitaminB12: 0.4, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.2, vitaminK: 2.4, folate: 6 },
    minerals: { calcium: 9, iron: 0.9, magnesium: 22, phosphorus: 170, potassium: 220, sodium: 84, zinc: 1.8, selenium: 17 },
    processingLevel: 1, allergens: [],
  },
  'Chicken Thigh (cooked)': {
    vitamins: { vitaminA: 20, vitaminB1: 0.08, vitaminB2: 0.19, vitaminB3: 6.7, vitaminB5: 1.3, vitaminB6: 0.4, vitaminB12: 0.5, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.3, vitaminK: 2.8, folate: 7 },
    minerals: { calcium: 11, iron: 1.1, magnesium: 25, phosphorus: 195, potassium: 248, sodium: 95, zinc: 2.1, selenium: 20 },
    processingLevel: 1, allergens: [],
  },
  'Ground Beef 90% Lean': {
    vitamins: { vitaminA: 0, vitaminB1: 0.04, vitaminB2: 0.18, vitaminB3: 5.4, vitaminB5: 0.6, vitaminB6: 0.4, vitaminB12: 2.5, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.2, vitaminK: 1.6, folate: 7 },
    minerals: { calcium: 12, iron: 2.3, magnesium: 21, phosphorus: 198, potassium: 318, sodium: 66, zinc: 5.0, selenium: 18.4 },
    processingLevel: 1, allergens: [],
  },
  'Ground Beef 80% Lean': {
    vitamins: { vitaminA: 0, vitaminB1: 0.04, vitaminB2: 0.16, vitaminB3: 4.8, vitaminB5: 0.5, vitaminB6: 0.35, vitaminB12: 2.3, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.2, vitaminK: 1.8, folate: 6 },
    minerals: { calcium: 18, iron: 2.1, magnesium: 19, phosphorus: 175, potassium: 290, sodium: 72, zinc: 4.5, selenium: 16.5 },
    processingLevel: 1, allergens: [],
  },
  'Ground Turkey 93% Lean': {
    vitamins: { vitaminA: 0, vitaminB1: 0.05, vitaminB2: 0.14, vitaminB3: 6.5, vitaminB5: 0.9, vitaminB6: 0.5, vitaminB12: 1.5, vitaminC: 0, vitaminD: 0.4, vitaminE: 0.1, vitaminK: 0, folate: 6 },
    minerals: { calcium: 15, iron: 1.2, magnesium: 23, phosphorus: 190, potassium: 260, sodium: 76, zinc: 2.4, selenium: 22 },
    processingLevel: 1, allergens: [],
  },
  'Steak (Sirloin)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.08, vitaminB2: 0.16, vitaminB3: 7.8, vitaminB5: 0.6, vitaminB6: 0.7, vitaminB12: 1.8, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.4, vitaminK: 1.4, folate: 8 },
    minerals: { calcium: 5, iron: 2.0, magnesium: 25, phosphorus: 220, potassium: 350, sodium: 55, zinc: 4.8, selenium: 28 },
    processingLevel: 1, allergens: [],
  },
  'Pork Tenderloin': {
    vitamins: { vitaminA: 2, vitaminB1: 0.81, vitaminB2: 0.28, vitaminB3: 6.3, vitaminB5: 1.1, vitaminB6: 0.65, vitaminB12: 0.6, vitaminC: 0.6, vitaminD: 0.5, vitaminE: 0.3, vitaminK: 0, folate: 5 },
    minerals: { calcium: 5, iron: 0.9, magnesium: 28, phosphorus: 245, potassium: 400, sodium: 55, zinc: 1.9, selenium: 41 },
    processingLevel: 1, allergens: [],
  },
  'Bacon': {
    vitamins: { vitaminA: 0, vitaminB1: 0.28, vitaminB2: 0.11, vitaminB3: 5.2, vitaminB5: 0.6, vitaminB6: 0.25, vitaminB12: 0.5, vitaminC: 0, vitaminD: 0.5, vitaminE: 0.3, vitaminK: 0, folate: 1 },
    minerals: { calcium: 6, iron: 0.6, magnesium: 15, phosphorus: 170, potassium: 220, sodium: 1717, zinc: 1.8, selenium: 23 },
    processingLevel: 3, allergens: [],
  },
  'Turkey Breast (deli)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.03, vitaminB2: 0.1, vitaminB3: 6.0, vitaminB5: 0.4, vitaminB6: 0.35, vitaminB12: 0.4, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.1, vitaminK: 0, folate: 3 },
    minerals: { calcium: 8, iron: 0.5, magnesium: 22, phosphorus: 190, potassium: 250, sodium: 930, zinc: 1.3, selenium: 22 },
    processingLevel: 3, allergens: [],
  },

  // ==================== SEAFOOD ====================

  'Salmon (raw)': {
    vitamins: { vitaminA: 12, vitaminB1: 0.2, vitaminB2: 0.25, vitaminB3: 7.9, vitaminB5: 1.4, vitaminB6: 0.64, vitaminB12: 3.2, vitaminC: 0, vitaminD: 9.0, vitaminE: 3.0, vitaminK: 0.5, folate: 25 },
    minerals: { calcium: 9, iron: 0.3, magnesium: 27, phosphorus: 240, potassium: 363, sodium: 44, zinc: 0.4, selenium: 36 },
    processingLevel: 1, allergens: ['fish-allergy'],
  },
  'Salmon (cooked)': {
    vitamins: { vitaminA: 12, vitaminB1: 0.23, vitaminB2: 0.38, vitaminB3: 8.0, vitaminB5: 1.6, vitaminB6: 0.8, vitaminB12: 3.2, vitaminC: 0, vitaminD: 11.0, vitaminE: 3.6, vitaminK: 0.5, folate: 26 },
    minerals: { calcium: 12, iron: 0.8, magnesium: 29, phosphorus: 252, potassium: 384, sodium: 59, zinc: 0.6, selenium: 41.4 },
    processingLevel: 1, allergens: ['fish-allergy'],
  },
  'Tuna (canned in water)': {
    vitamins: { vitaminA: 7, vitaminB1: 0.02, vitaminB2: 0.09, vitaminB3: 10.1, vitaminB5: 0.2, vitaminB6: 0.32, vitaminB12: 2.2, vitaminC: 0, vitaminD: 1.7, vitaminE: 0.9, vitaminK: 0, folate: 4 },
    minerals: { calcium: 11, iron: 1.0, magnesium: 30, phosphorus: 184, potassium: 237, sodium: 338, zinc: 0.7, selenium: 70 },
    processingLevel: 2, allergens: ['fish-allergy'],
  },
  'Tilapia (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.04, vitaminB2: 0.06, vitaminB3: 4.7, vitaminB5: 0.6, vitaminB6: 0.11, vitaminB12: 1.9, vitaminC: 0, vitaminD: 3.1, vitaminE: 0.6, vitaminK: 0, folate: 15 },
    minerals: { calcium: 14, iron: 0.7, magnesium: 34, phosphorus: 204, potassium: 380, sodium: 52, zinc: 0.4, selenium: 54 },
    processingLevel: 1, allergens: ['fish-allergy'],
  },
  'Shrimp (cooked)': {
    vitamins: { vitaminA: 54, vitaminB1: 0.02, vitaminB2: 0.02, vitaminB3: 2.6, vitaminB5: 0.31, vitaminB6: 0.1, vitaminB12: 1.1, vitaminC: 0, vitaminD: 0.2, vitaminE: 1.3, vitaminK: 0.3, folate: 3 },
    minerals: { calcium: 70, iron: 0.5, magnesium: 37, phosphorus: 214, potassium: 182, sodium: 224, zinc: 1.6, selenium: 40 },
    processingLevel: 1, allergens: ['shellfish-allergy'],
  },

  // ==================== EGGS ====================

  'Egg (whole, large)': {
    vitamins: { vitaminA: 160, vitaminB1: 0.04, vitaminB2: 0.46, vitaminB3: 0.1, vitaminB5: 1.4, vitaminB6: 0.12, vitaminB12: 1.1, vitaminC: 0, vitaminD: 2.0, vitaminE: 1.0, vitaminK: 0.3, folate: 47 },
    minerals: { calcium: 50, iron: 1.8, magnesium: 12, phosphorus: 172, potassium: 126, sodium: 124, zinc: 1.1, selenium: 30.8 },
    processingLevel: 1, allergens: ['egg-allergy'],
  },
  'Egg White': {
    vitamins: { vitaminA: 0, vitaminB1: 0.0, vitaminB2: 0.44, vitaminB3: 0.1, vitaminB5: 0.19, vitaminB6: 0.0, vitaminB12: 0.1, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 4 },
    minerals: { calcium: 7, iron: 0.1, magnesium: 11, phosphorus: 15, potassium: 163, sodium: 166, zinc: 0.0, selenium: 20 },
    processingLevel: 1, allergens: ['egg-allergy'],
  },
  'Egg Yolk': {
    vitamins: { vitaminA: 381, vitaminB1: 0.18, vitaminB2: 0.53, vitaminB3: 0.02, vitaminB5: 2.99, vitaminB6: 0.35, vitaminB12: 1.95, vitaminC: 0, vitaminD: 5.4, vitaminE: 2.6, vitaminK: 0.7, folate: 146 },
    minerals: { calcium: 129, iron: 2.7, magnesium: 5, phosphorus: 390, potassium: 109, sodium: 48, zinc: 2.3, selenium: 56 },
    processingLevel: 1, allergens: ['egg-allergy'],
  },

  // ==================== DAIRY ====================

  'Greek Yogurt (plain, nonfat)': {
    vitamins: { vitaminA: 2, vitaminB1: 0.02, vitaminB2: 0.27, vitaminB3: 0.2, vitaminB5: 0.33, vitaminB6: 0.06, vitaminB12: 0.75, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 7 },
    minerals: { calcium: 110, iron: 0.1, magnesium: 11, phosphorus: 135, potassium: 141, sodium: 36, zinc: 0.5, selenium: 9.7 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Greek Yogurt (plain, 2%)': {
    vitamins: { vitaminA: 10, vitaminB1: 0.02, vitaminB2: 0.25, vitaminB3: 0.2, vitaminB5: 0.35, vitaminB6: 0.07, vitaminB12: 0.8, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.02, vitaminK: 0.2, folate: 8 },
    minerals: { calcium: 115, iron: 0.1, magnesium: 12, phosphorus: 140, potassium: 150, sodium: 40, zinc: 0.6, selenium: 10 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Cottage Cheese (1% fat)': {
    vitamins: { vitaminA: 12, vitaminB1: 0.02, vitaminB2: 0.16, vitaminB3: 0.1, vitaminB5: 0.22, vitaminB6: 0.07, vitaminB12: 0.63, vitaminC: 0, vitaminD: 0, vitaminE: 0.01, vitaminK: 0, folate: 12 },
    minerals: { calcium: 61, iron: 0.1, magnesium: 5, phosphorus: 134, potassium: 86, sodium: 406, zinc: 0.4, selenium: 9.7 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Cottage Cheese (2% fat)': {
    vitamins: { vitaminA: 20, vitaminB1: 0.02, vitaminB2: 0.18, vitaminB3: 0.1, vitaminB5: 0.25, vitaminB6: 0.08, vitaminB12: 0.7, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.02, vitaminK: 0.1, folate: 14 },
    minerals: { calcium: 83, iron: 0.1, magnesium: 6, phosphorus: 150, potassium: 90, sodium: 364, zinc: 0.5, selenium: 10 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Milk (whole)': {
    vitamins: { vitaminA: 46, vitaminB1: 0.05, vitaminB2: 0.18, vitaminB3: 0.1, vitaminB5: 0.37, vitaminB6: 0.04, vitaminB12: 0.45, vitaminC: 0, vitaminD: 1.3, vitaminE: 0.07, vitaminK: 0.3, folate: 5 },
    minerals: { calcium: 113, iron: 0.03, magnesium: 10, phosphorus: 84, potassium: 132, sodium: 43, zinc: 0.4, selenium: 3.7 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Milk (2%)': {
    vitamins: { vitaminA: 47, vitaminB1: 0.04, vitaminB2: 0.18, vitaminB3: 0.1, vitaminB5: 0.35, vitaminB6: 0.04, vitaminB12: 0.5, vitaminC: 0.9, vitaminD: 1.2, vitaminE: 0.02, vitaminK: 0.1, folate: 5 },
    minerals: { calcium: 117, iron: 0.03, magnesium: 11, phosphorus: 92, potassium: 150, sodium: 47, zinc: 0.4, selenium: 3.3 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Milk (skim)': {
    vitamins: { vitaminA: 50, vitaminB1: 0.04, vitaminB2: 0.18, vitaminB3: 0.1, vitaminB5: 0.33, vitaminB6: 0.04, vitaminB12: 0.5, vitaminC: 0, vitaminD: 1.0, vitaminE: 0.01, vitaminK: 0, folate: 5 },
    minerals: { calcium: 122, iron: 0.03, magnesium: 11, phosphorus: 101, potassium: 156, sodium: 42, zinc: 0.4, selenium: 3.1 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Cheddar Cheese': {
    vitamins: { vitaminA: 265, vitaminB1: 0.03, vitaminB2: 0.38, vitaminB3: 0.04, vitaminB5: 0.41, vitaminB6: 0.07, vitaminB12: 0.83, vitaminC: 0, vitaminD: 0.6, vitaminE: 0.28, vitaminK: 2.8, folate: 18 },
    minerals: { calcium: 721, iron: 0.7, magnesium: 28, phosphorus: 512, potassium: 98, sodium: 621, zinc: 3.1, selenium: 13.9 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Mozzarella Cheese': {
    vitamins: { vitaminA: 179, vitaminB1: 0.03, vitaminB2: 0.28, vitaminB3: 0.1, vitaminB5: 0.14, vitaminB6: 0.04, vitaminB12: 2.3, vitaminC: 0, vitaminD: 0.4, vitaminE: 0.19, vitaminK: 2.3, folate: 7 },
    minerals: { calcium: 505, iron: 0.4, magnesium: 20, phosphorus: 354, potassium: 76, sodium: 486, zinc: 2.9, selenium: 17 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Parmesan Cheese': {
    vitamins: { vitaminA: 207, vitaminB1: 0.04, vitaminB2: 0.33, vitaminB3: 0.27, vitaminB5: 0.45, vitaminB6: 0.09, vitaminB12: 1.2, vitaminC: 0, vitaminD: 0.5, vitaminE: 0.22, vitaminK: 1.7, folate: 7 },
    minerals: { calcium: 1184, iron: 0.8, magnesium: 44, phosphorus: 694, potassium: 92, sodium: 1602, zinc: 2.8, selenium: 22.5 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },
  'Cream Cheese': {
    vitamins: { vitaminA: 308, vitaminB1: 0.02, vitaminB2: 0.2, vitaminB3: 0.1, vitaminB5: 0.28, vitaminB6: 0.04, vitaminB12: 0.25, vitaminC: 0, vitaminD: 0.3, vitaminE: 0.58, vitaminK: 3.0, folate: 11 },
    minerals: { calcium: 98, iron: 0.4, magnesium: 9, phosphorus: 106, potassium: 138, sodium: 321, zinc: 0.5, selenium: 2.4 },
    processingLevel: 3, allergens: ['milk-allergy', 'dairy'],
  },
  'Butter': {
    vitamins: { vitaminA: 684, vitaminB1: 0.0, vitaminB2: 0.03, vitaminB3: 0.04, vitaminB5: 0.11, vitaminB6: 0.0, vitaminB12: 0.17, vitaminC: 0, vitaminD: 1.5, vitaminE: 2.3, vitaminK: 7.0, folate: 3 },
    minerals: { calcium: 24, iron: 0.02, magnesium: 2, phosphorus: 24, potassium: 24, sodium: 576, zinc: 0.1, selenium: 1.0 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },

  // ==================== PLANT PROTEINS ====================

  'Tofu (firm)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.08, vitaminB2: 0.05, vitaminB3: 0.2, vitaminB5: 0.07, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.01, vitaminK: 2.4, folate: 15 },
    minerals: { calcium: 350, iron: 5.4, magnesium: 30, phosphorus: 97, potassium: 121, sodium: 7, zinc: 0.8, selenium: 8.9 },
    processingLevel: 2, allergens: ['soy-allergy'],
  },
  'Tempeh': {
    vitamins: { vitaminA: 0, vitaminB1: 0.08, vitaminB2: 0.36, vitaminB3: 2.6, vitaminB5: 0.28, vitaminB6: 0.22, vitaminB12: 0.08, vitaminC: 0, vitaminD: 0, vitaminE: 0.0, vitaminK: 0, folate: 24 },
    minerals: { calcium: 111, iron: 2.7, magnesium: 81, phosphorus: 266, potassium: 412, sodium: 9, zinc: 1.1, selenium: 0 },
    processingLevel: 2, allergens: ['soy-allergy'],
  },

  // ==================== LEGUMES ====================

  'Black Beans (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.24, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.24, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.87, vitaminK: 3.3, folate: 149 },
    minerals: { calcium: 27, iron: 2.1, magnesium: 70, phosphorus: 140, potassium: 355, sodium: 1, zinc: 1.1, selenium: 1.2 },
    processingLevel: 1, allergens: [],
  },
  'Chickpeas (cooked)': {
    vitamins: { vitaminA: 1, vitaminB1: 0.12, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.29, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 1.3, vitaminD: 0, vitaminE: 0.35, vitaminK: 4.0, folate: 172 },
    minerals: { calcium: 49, iron: 2.9, magnesium: 48, phosphorus: 168, potassium: 291, sodium: 7, zinc: 1.5, selenium: 3.7 },
    processingLevel: 1, allergens: [],
  },
  'Lentils (cooked)': {
    vitamins: { vitaminA: 8, vitaminB1: 0.17, vitaminB2: 0.07, vitaminB3: 1.1, vitaminB5: 0.64, vitaminB6: 0.18, vitaminB12: 0, vitaminC: 1.5, vitaminD: 0, vitaminE: 0.11, vitaminK: 1.7, folate: 181 },
    minerals: { calcium: 19, iron: 3.3, magnesium: 36, phosphorus: 180, potassium: 369, sodium: 2, zinc: 1.3, selenium: 2.8 },
    processingLevel: 1, allergens: [],
  },
  'Kidney Beans (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.16, vitaminB2: 0.06, vitaminB3: 0.6, vitaminB5: 0.22, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 1.2, vitaminD: 0, vitaminE: 0.03, vitaminK: 8.4, folate: 130 },
    minerals: { calcium: 28, iron: 2.2, magnesium: 45, phosphorus: 142, potassium: 403, sodium: 2, zinc: 1.0, selenium: 1.2 },
    processingLevel: 1, allergens: [],
  },
  'Edamame': {
    vitamins: { vitaminA: 9, vitaminB1: 0.2, vitaminB2: 0.16, vitaminB3: 1.0, vitaminB5: 0.4, vitaminB6: 0.1, vitaminB12: 0, vitaminC: 6.1, vitaminD: 0, vitaminE: 0.68, vitaminK: 26.7, folate: 311 },
    minerals: { calcium: 63, iron: 2.3, magnesium: 64, phosphorus: 169, potassium: 436, sodium: 6, zinc: 1.4, selenium: 0.8 },
    processingLevel: 1, allergens: ['soy-allergy'],
  },
  'Hummus': {
    vitamins: { vitaminA: 6, vitaminB1: 0.1, vitaminB2: 0.05, vitaminB3: 0.4, vitaminB5: 0.29, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.88, vitaminK: 3.0, folate: 59 },
    minerals: { calcium: 38, iron: 1.6, magnesium: 29, phosphorus: 110, potassium: 173, sodium: 379, zinc: 1.1, selenium: 2.6 },
    processingLevel: 2, allergens: ['sesame-allergy'],
  },

  // ==================== GRAINS & CARBS ====================

  'White Rice (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.02, vitaminB2: 0.01, vitaminB3: 0.4, vitaminB5: 0.39, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.04, vitaminK: 0, folate: 3 },
    minerals: { calcium: 10, iron: 0.2, magnesium: 12, phosphorus: 43, potassium: 35, sodium: 1, zinc: 0.5, selenium: 7.5 },
    processingLevel: 2, allergens: [],
  },
  'Brown Rice (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.10, vitaminB2: 0.03, vitaminB3: 1.5, vitaminB5: 0.39, vitaminB6: 0.15, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.0, vitaminK: 0.6, folate: 4 },
    minerals: { calcium: 10, iron: 0.5, magnesium: 44, phosphorus: 83, potassium: 79, sodium: 5, zinc: 0.6, selenium: 9.8 },
    processingLevel: 2, allergens: [],
  },
  'Jasmine Rice (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.02, vitaminB2: 0.01, vitaminB3: 0.4, vitaminB5: 0.35, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.04, vitaminK: 0, folate: 3 },
    minerals: { calcium: 9, iron: 0.2, magnesium: 11, phosphorus: 40, potassium: 32, sodium: 1, zinc: 0.5, selenium: 7.0 },
    processingLevel: 2, allergens: [],
  },
  'Quinoa (cooked)': {
    vitamins: { vitaminA: 1, vitaminB1: 0.11, vitaminB2: 0.11, vitaminB3: 0.4, vitaminB5: 0.29, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.63, vitaminK: 0, folate: 42 },
    minerals: { calcium: 17, iron: 1.5, magnesium: 64, phosphorus: 152, potassium: 172, sodium: 7, zinc: 1.1, selenium: 2.8 },
    processingLevel: 1, allergens: [],
  },
  'Oats (dry)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.76, vitaminB2: 0.14, vitaminB3: 1.0, vitaminB5: 1.35, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.7, vitaminK: 2.0, folate: 56 },
    minerals: { calcium: 54, iron: 4.7, magnesium: 177, phosphorus: 523, potassium: 429, sodium: 2, zinc: 4.0, selenium: 34 },
    processingLevel: 2, allergens: ['gluten-free'],
  },
  'Oatmeal (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.08, vitaminB2: 0.02, vitaminB3: 0.2, vitaminB5: 0.20, vitaminB6: 0.01, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.1, vitaminK: 0, folate: 6 },
    minerals: { calcium: 9, iron: 0.9, magnesium: 27, phosphorus: 77, potassium: 70, sodium: 49, zinc: 0.6, selenium: 6.1 },
    processingLevel: 2, allergens: ['gluten-free'],
  },
  'Pasta (cooked)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.02, vitaminB2: 0.02, vitaminB3: 0.4, vitaminB5: 0.11, vitaminB6: 0.02, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.06, vitaminK: 0, folate: 7 },
    minerals: { calcium: 7, iron: 0.5, magnesium: 18, phosphorus: 58, potassium: 44, sodium: 1, zinc: 0.5, selenium: 26.4 },
    processingLevel: 3, allergens: ['wheat-allergy', 'gluten'],
  },
  'Whole Wheat Bread': {
    vitamins: { vitaminA: 0, vitaminB1: 0.35, vitaminB2: 0.13, vitaminB3: 4.0, vitaminB5: 0.54, vitaminB6: 0.18, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.4, vitaminK: 7.8, folate: 42 },
    minerals: { calcium: 107, iron: 2.5, magnesium: 75, phosphorus: 202, potassium: 254, sodium: 472, zinc: 1.8, selenium: 31 },
    processingLevel: 3, allergens: ['wheat-allergy', 'gluten'],
  },
  'White Bread': {
    vitamins: { vitaminA: 0, vitaminB1: 0.48, vitaminB2: 0.29, vitaminB3: 4.8, vitaminB5: 0.44, vitaminB6: 0.06, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.23, vitaminK: 0.3, folate: 111 },
    minerals: { calcium: 151, iron: 3.6, magnesium: 25, phosphorus: 99, potassium: 117, sodium: 490, zinc: 0.8, selenium: 22.2 },
    processingLevel: 3, allergens: ['wheat-allergy', 'gluten'],
  },
  'Tortilla (flour)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.37, vitaminB2: 0.2, vitaminB3: 2.7, vitaminB5: 0.21, vitaminB6: 0.04, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.39, vitaminK: 0, folate: 89 },
    minerals: { calcium: 115, iron: 2.6, magnesium: 22, phosphorus: 141, potassium: 105, sodium: 617, zinc: 0.5, selenium: 23.5 },
    processingLevel: 3, allergens: ['wheat-allergy', 'gluten'],
  },
  'Tortilla (corn)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.05, vitaminB2: 0.05, vitaminB3: 0.6, vitaminB5: 0.18, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.13, vitaminK: 0, folate: 6 },
    minerals: { calcium: 46, iron: 0.9, magnesium: 30, phosphorus: 92, potassium: 89, sodium: 30, zinc: 0.5, selenium: 3.6 },
    processingLevel: 2, allergens: [],
  },
  'Bagel': {
    vitamins: { vitaminA: 0, vitaminB1: 0.53, vitaminB2: 0.28, vitaminB3: 4.7, vitaminB5: 0.42, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.12, vitaminK: 0.3, folate: 133 },
    minerals: { calcium: 19, iron: 3.8, magnesium: 23, phosphorus: 81, potassium: 88, sodium: 447, zinc: 0.8, selenium: 31 },
    processingLevel: 3, allergens: ['wheat-allergy', 'gluten'],
  },
  'Sweet Potato (baked)': {
    vitamins: { vitaminA: 961, vitaminB1: 0.11, vitaminB2: 0.11, vitaminB3: 1.5, vitaminB5: 0.88, vitaminB6: 0.29, vitaminB12: 0, vitaminC: 19.6, vitaminD: 0, vitaminE: 0.71, vitaminK: 2.3, folate: 6 },
    minerals: { calcium: 38, iron: 0.7, magnesium: 27, phosphorus: 54, potassium: 475, sodium: 36, zinc: 0.3, selenium: 0.2 },
    processingLevel: 1, allergens: [],
  },
  'Potato (baked)': {
    vitamins: { vitaminA: 1, vitaminB1: 0.06, vitaminB2: 0.03, vitaminB3: 1.4, vitaminB5: 0.52, vitaminB6: 0.31, vitaminB12: 0, vitaminC: 9.6, vitaminD: 0, vitaminE: 0.04, vitaminK: 2.0, folate: 28 },
    minerals: { calcium: 15, iron: 1.1, magnesium: 28, phosphorus: 70, potassium: 535, sodium: 10, zinc: 0.4, selenium: 0.5 },
    processingLevel: 1, allergens: [],
  },

  // ==================== VEGETABLES ====================

  'Broccoli': {
    vitamins: { vitaminA: 31, vitaminB1: 0.07, vitaminB2: 0.12, vitaminB3: 0.6, vitaminB5: 0.57, vitaminB6: 0.18, vitaminB12: 0, vitaminC: 89.2, vitaminD: 0, vitaminE: 0.78, vitaminK: 102, folate: 63 },
    minerals: { calcium: 47, iron: 0.7, magnesium: 21, phosphorus: 66, potassium: 316, sodium: 33, zinc: 0.4, selenium: 2.5 },
    processingLevel: 1, allergens: [],
  },
  'Spinach (raw)': {
    vitamins: { vitaminA: 469, vitaminB1: 0.08, vitaminB2: 0.19, vitaminB3: 0.7, vitaminB5: 0.07, vitaminB6: 0.2, vitaminB12: 0, vitaminC: 28.1, vitaminD: 0, vitaminE: 2.0, vitaminK: 483, folate: 194 },
    minerals: { calcium: 99, iron: 2.7, magnesium: 79, phosphorus: 49, potassium: 558, sodium: 79, zinc: 0.5, selenium: 1.0 },
    processingLevel: 1, allergens: [],
  },
  'Spinach (cooked)': {
    vitamins: { vitaminA: 524, vitaminB1: 0.10, vitaminB2: 0.24, vitaminB3: 0.5, vitaminB5: 0.14, vitaminB6: 0.24, vitaminB12: 0, vitaminC: 9.8, vitaminD: 0, vitaminE: 2.1, vitaminK: 494, folate: 146 },
    minerals: { calcium: 136, iron: 3.6, magnesium: 87, phosphorus: 56, potassium: 466, sodium: 70, zinc: 0.8, selenium: 1.5 },
    processingLevel: 1, allergens: [],
  },
  'Kale': {
    vitamins: { vitaminA: 241, vitaminB1: 0.11, vitaminB2: 0.13, vitaminB3: 1.0, vitaminB5: 0.09, vitaminB6: 0.27, vitaminB12: 0, vitaminC: 120, vitaminD: 0, vitaminE: 1.5, vitaminK: 817, folate: 141 },
    minerals: { calcium: 150, iron: 1.5, magnesium: 47, phosphorus: 92, potassium: 491, sodium: 38, zinc: 0.6, selenium: 0.9 },
    processingLevel: 1, allergens: [],
  },
  'Asparagus': {
    vitamins: { vitaminA: 38, vitaminB1: 0.14, vitaminB2: 0.14, vitaminB3: 1.0, vitaminB5: 0.27, vitaminB6: 0.09, vitaminB12: 0, vitaminC: 5.6, vitaminD: 0, vitaminE: 1.1, vitaminK: 41.6, folate: 52 },
    minerals: { calcium: 24, iron: 2.1, magnesium: 14, phosphorus: 52, potassium: 202, sodium: 2, zinc: 0.5, selenium: 2.3 },
    processingLevel: 1, allergens: [],
  },
  'Green Beans': {
    vitamins: { vitaminA: 35, vitaminB1: 0.08, vitaminB2: 0.1, vitaminB3: 0.7, vitaminB5: 0.22, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 12.2, vitaminD: 0, vitaminE: 0.41, vitaminK: 43, folate: 33 },
    minerals: { calcium: 37, iron: 1.0, magnesium: 25, phosphorus: 38, potassium: 211, sodium: 6, zinc: 0.2, selenium: 0.6 },
    processingLevel: 1, allergens: [],
  },
  'Bell Pepper': {
    vitamins: { vitaminA: 157, vitaminB1: 0.05, vitaminB2: 0.09, vitaminB3: 1.0, vitaminB5: 0.32, vitaminB6: 0.29, vitaminB12: 0, vitaminC: 127.7, vitaminD: 0, vitaminE: 1.6, vitaminK: 4.9, folate: 46 },
    minerals: { calcium: 7, iron: 0.4, magnesium: 12, phosphorus: 26, potassium: 211, sodium: 4, zinc: 0.3, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Carrots': {
    vitamins: { vitaminA: 835, vitaminB1: 0.07, vitaminB2: 0.06, vitaminB3: 1.0, vitaminB5: 0.27, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 5.9, vitaminD: 0, vitaminE: 0.66, vitaminK: 13.2, folate: 19 },
    minerals: { calcium: 33, iron: 0.3, magnesium: 12, phosphorus: 35, potassium: 320, sodium: 69, zinc: 0.2, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Zucchini': {
    vitamins: { vitaminA: 10, vitaminB1: 0.04, vitaminB2: 0.04, vitaminB3: 0.5, vitaminB5: 0.2, vitaminB6: 0.16, vitaminB12: 0, vitaminC: 17.9, vitaminD: 0, vitaminE: 0.12, vitaminK: 4.3, folate: 24 },
    minerals: { calcium: 16, iron: 0.4, magnesium: 18, phosphorus: 38, potassium: 261, sodium: 8, zinc: 0.3, selenium: 0.2 },
    processingLevel: 1, allergens: [],
  },
  'Cucumber': {
    vitamins: { vitaminA: 5, vitaminB1: 0.03, vitaminB2: 0.03, vitaminB3: 0.1, vitaminB5: 0.26, vitaminB6: 0.04, vitaminB12: 0, vitaminC: 2.8, vitaminD: 0, vitaminE: 0.03, vitaminK: 16.4, folate: 7 },
    minerals: { calcium: 16, iron: 0.3, magnesium: 13, phosphorus: 24, potassium: 147, sodium: 2, zinc: 0.2, selenium: 0.3 },
    processingLevel: 1, allergens: [],
  },
  'Tomato': {
    vitamins: { vitaminA: 42, vitaminB1: 0.04, vitaminB2: 0.02, vitaminB3: 0.6, vitaminB5: 0.09, vitaminB6: 0.08, vitaminB12: 0, vitaminC: 13.7, vitaminD: 0, vitaminE: 0.54, vitaminK: 7.9, folate: 15 },
    minerals: { calcium: 10, iron: 0.3, magnesium: 11, phosphorus: 24, potassium: 237, sodium: 5, zinc: 0.2, selenium: 0 },
    processingLevel: 1, allergens: [],
  },
  'Onion': {
    vitamins: { vitaminA: 0, vitaminB1: 0.05, vitaminB2: 0.03, vitaminB3: 0.1, vitaminB5: 0.12, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 7.4, vitaminD: 0, vitaminE: 0.02, vitaminK: 0.4, folate: 19 },
    minerals: { calcium: 23, iron: 0.2, magnesium: 10, phosphorus: 29, potassium: 146, sodium: 4, zinc: 0.2, selenium: 0.5 },
    processingLevel: 1, allergens: [],
  },
  'Garlic': {
    vitamins: { vitaminA: 0, vitaminB1: 0.2, vitaminB2: 0.11, vitaminB3: 0.7, vitaminB5: 0.6, vitaminB6: 1.24, vitaminB12: 0, vitaminC: 31.2, vitaminD: 0, vitaminE: 0.08, vitaminK: 1.7, folate: 3 },
    minerals: { calcium: 181, iron: 1.7, magnesium: 25, phosphorus: 153, potassium: 401, sodium: 17, zinc: 1.2, selenium: 14.2 },
    processingLevel: 1, allergens: [],
  },
  'Mushrooms': {
    vitamins: { vitaminA: 0, vitaminB1: 0.08, vitaminB2: 0.4, vitaminB3: 3.6, vitaminB5: 1.5, vitaminB6: 0.1, vitaminB12: 0.04, vitaminC: 2.1, vitaminD: 0.2, vitaminE: 0.01, vitaminK: 0, folate: 17 },
    minerals: { calcium: 3, iron: 0.5, magnesium: 9, phosphorus: 86, potassium: 318, sodium: 5, zinc: 0.5, selenium: 9.3 },
    processingLevel: 1, allergens: [],
  },
  'Cauliflower': {
    vitamins: { vitaminA: 0, vitaminB1: 0.05, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.67, vitaminB6: 0.18, vitaminB12: 0, vitaminC: 48.2, vitaminD: 0, vitaminE: 0.08, vitaminK: 15.5, folate: 57 },
    minerals: { calcium: 22, iron: 0.4, magnesium: 15, phosphorus: 44, potassium: 299, sodium: 30, zinc: 0.3, selenium: 0.6 },
    processingLevel: 1, allergens: [],
  },
  'Brussels Sprouts': {
    vitamins: { vitaminA: 38, vitaminB1: 0.14, vitaminB2: 0.09, vitaminB3: 0.7, vitaminB5: 0.31, vitaminB6: 0.22, vitaminB12: 0, vitaminC: 85, vitaminD: 0, vitaminE: 0.88, vitaminK: 177, folate: 61 },
    minerals: { calcium: 42, iron: 1.4, magnesium: 23, phosphorus: 69, potassium: 389, sodium: 25, zinc: 0.4, selenium: 1.6 },
    processingLevel: 1, allergens: [],
  },
  'Lettuce (Romaine)': {
    vitamins: { vitaminA: 436, vitaminB1: 0.07, vitaminB2: 0.07, vitaminB3: 0.3, vitaminB5: 0.14, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 4, vitaminD: 0, vitaminE: 0.13, vitaminK: 102.5, folate: 136 },
    minerals: { calcium: 33, iron: 1.0, magnesium: 14, phosphorus: 30, potassium: 247, sodium: 8, zinc: 0.2, selenium: 0.4 },
    processingLevel: 1, allergens: [],
  },
  'Cabbage': {
    vitamins: { vitaminA: 5, vitaminB1: 0.06, vitaminB2: 0.04, vitaminB3: 0.2, vitaminB5: 0.21, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 36.6, vitaminD: 0, vitaminE: 0.15, vitaminK: 76, folate: 43 },
    minerals: { calcium: 40, iron: 0.5, magnesium: 12, phosphorus: 26, potassium: 170, sodium: 18, zinc: 0.2, selenium: 0.3 },
    processingLevel: 1, allergens: [],
  },
  'Celery': {
    vitamins: { vitaminA: 22, vitaminB1: 0.02, vitaminB2: 0.06, vitaminB3: 0.3, vitaminB5: 0.25, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 3.1, vitaminD: 0, vitaminE: 0.27, vitaminK: 29.3, folate: 36 },
    minerals: { calcium: 40, iron: 0.2, magnesium: 11, phosphorus: 24, potassium: 260, sodium: 80, zinc: 0.1, selenium: 0.4 },
    processingLevel: 1, allergens: [],
  },
  'Corn': {
    vitamins: { vitaminA: 9, vitaminB1: 0.16, vitaminB2: 0.06, vitaminB3: 1.7, vitaminB5: 0.76, vitaminB6: 0.09, vitaminB12: 0, vitaminC: 6.8, vitaminD: 0, vitaminE: 0.07, vitaminK: 0.3, folate: 46 },
    minerals: { calcium: 2, iron: 0.5, magnesium: 37, phosphorus: 89, potassium: 270, sodium: 15, zinc: 0.5, selenium: 0.6 },
    processingLevel: 1, allergens: [],
  },

  // ==================== FRUITS ====================

  'Banana': {
    vitamins: { vitaminA: 3, vitaminB1: 0.03, vitaminB2: 0.07, vitaminB3: 0.7, vitaminB5: 0.33, vitaminB6: 0.37, vitaminB12: 0, vitaminC: 8.7, vitaminD: 0, vitaminE: 0.1, vitaminK: 0.5, folate: 20 },
    minerals: { calcium: 5, iron: 0.3, magnesium: 27, phosphorus: 22, potassium: 358, sodium: 1, zinc: 0.2, selenium: 1.0 },
    processingLevel: 1, allergens: [],
  },
  'Apple': {
    vitamins: { vitaminA: 3, vitaminB1: 0.02, vitaminB2: 0.03, vitaminB3: 0.1, vitaminB5: 0.06, vitaminB6: 0.04, vitaminB12: 0, vitaminC: 4.6, vitaminD: 0, vitaminE: 0.18, vitaminK: 2.2, folate: 3 },
    minerals: { calcium: 6, iron: 0.1, magnesium: 5, phosphorus: 11, potassium: 107, sodium: 1, zinc: 0.04, selenium: 0 },
    processingLevel: 1, allergens: [],
  },
  'Orange': {
    vitamins: { vitaminA: 11, vitaminB1: 0.09, vitaminB2: 0.04, vitaminB3: 0.3, vitaminB5: 0.25, vitaminB6: 0.06, vitaminB12: 0, vitaminC: 53.2, vitaminD: 0, vitaminE: 0.18, vitaminK: 0, folate: 30 },
    minerals: { calcium: 40, iron: 0.1, magnesium: 10, phosphorus: 14, potassium: 181, sodium: 0, zinc: 0.1, selenium: 0.5 },
    processingLevel: 1, allergens: [],
  },
  'Strawberries': {
    vitamins: { vitaminA: 1, vitaminB1: 0.02, vitaminB2: 0.02, vitaminB3: 0.4, vitaminB5: 0.12, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 58.8, vitaminD: 0, vitaminE: 0.29, vitaminK: 2.2, folate: 24 },
    minerals: { calcium: 16, iron: 0.4, magnesium: 13, phosphorus: 24, potassium: 153, sodium: 1, zinc: 0.1, selenium: 0.4 },
    processingLevel: 1, allergens: [],
  },
  'Blueberries': {
    vitamins: { vitaminA: 3, vitaminB1: 0.04, vitaminB2: 0.04, vitaminB3: 0.4, vitaminB5: 0.12, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 9.7, vitaminD: 0, vitaminE: 0.57, vitaminK: 19.3, folate: 6 },
    minerals: { calcium: 6, iron: 0.3, magnesium: 6, phosphorus: 12, potassium: 77, sodium: 1, zinc: 0.2, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Raspberries': {
    vitamins: { vitaminA: 2, vitaminB1: 0.03, vitaminB2: 0.04, vitaminB3: 0.6, vitaminB5: 0.33, vitaminB6: 0.06, vitaminB12: 0, vitaminC: 26.2, vitaminD: 0, vitaminE: 0.87, vitaminK: 7.8, folate: 21 },
    minerals: { calcium: 25, iron: 0.7, magnesium: 22, phosphorus: 29, potassium: 151, sodium: 1, zinc: 0.4, selenium: 0.2 },
    processingLevel: 1, allergens: [],
  },
  'Grapes': {
    vitamins: { vitaminA: 3, vitaminB1: 0.07, vitaminB2: 0.07, vitaminB3: 0.2, vitaminB5: 0.05, vitaminB6: 0.09, vitaminB12: 0, vitaminC: 3.2, vitaminD: 0, vitaminE: 0.19, vitaminK: 14.6, folate: 2 },
    minerals: { calcium: 10, iron: 0.4, magnesium: 7, phosphorus: 20, potassium: 191, sodium: 2, zinc: 0.1, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Watermelon': {
    vitamins: { vitaminA: 28, vitaminB1: 0.03, vitaminB2: 0.02, vitaminB3: 0.2, vitaminB5: 0.22, vitaminB6: 0.04, vitaminB12: 0, vitaminC: 8.1, vitaminD: 0, vitaminE: 0.05, vitaminK: 0.1, folate: 3 },
    minerals: { calcium: 7, iron: 0.2, magnesium: 10, phosphorus: 11, potassium: 112, sodium: 1, zinc: 0.1, selenium: 0.4 },
    processingLevel: 1, allergens: [],
  },
  'Mango': {
    vitamins: { vitaminA: 54, vitaminB1: 0.03, vitaminB2: 0.04, vitaminB3: 0.7, vitaminB5: 0.2, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 36.4, vitaminD: 0, vitaminE: 0.9, vitaminK: 4.2, folate: 43 },
    minerals: { calcium: 11, iron: 0.2, magnesium: 10, phosphorus: 14, potassium: 168, sodium: 1, zinc: 0.1, selenium: 0.6 },
    processingLevel: 1, allergens: [],
  },
  'Peach': {
    vitamins: { vitaminA: 16, vitaminB1: 0.02, vitaminB2: 0.03, vitaminB3: 0.8, vitaminB5: 0.15, vitaminB6: 0.02, vitaminB12: 0, vitaminC: 6.6, vitaminD: 0, vitaminE: 0.73, vitaminK: 2.6, folate: 4 },
    minerals: { calcium: 6, iron: 0.3, magnesium: 9, phosphorus: 20, potassium: 190, sodium: 0, zinc: 0.2, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Pineapple': {
    vitamins: { vitaminA: 3, vitaminB1: 0.08, vitaminB2: 0.03, vitaminB3: 0.5, vitaminB5: 0.21, vitaminB6: 0.11, vitaminB12: 0, vitaminC: 47.8, vitaminD: 0, vitaminE: 0.02, vitaminK: 0.7, folate: 18 },
    minerals: { calcium: 13, iron: 0.3, magnesium: 12, phosphorus: 8, potassium: 109, sodium: 1, zinc: 0.1, selenium: 0.1 },
    processingLevel: 1, allergens: [],
  },
  'Avocado': {
    vitamins: { vitaminA: 7, vitaminB1: 0.07, vitaminB2: 0.13, vitaminB3: 1.7, vitaminB5: 1.39, vitaminB6: 0.26, vitaminB12: 0, vitaminC: 10, vitaminD: 0, vitaminE: 2.1, vitaminK: 21, folate: 81 },
    minerals: { calcium: 12, iron: 0.6, magnesium: 29, phosphorus: 52, potassium: 485, sodium: 7, zinc: 0.6, selenium: 0.4 },
    processingLevel: 1, allergens: [],
  },

  // ==================== FATS & OILS ====================

  'Olive Oil': {
    vitamins: { vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 14.4, vitaminK: 60.2, folate: 0 },
    minerals: { calcium: 1, iron: 0.6, magnesium: 0, phosphorus: 0, potassium: 1, sodium: 2, zinc: 0, selenium: 0 },
    processingLevel: 2, allergens: [],
  },
  'Coconut Oil': {
    vitamins: { vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.09, vitaminK: 0.5, folate: 0 },
    minerals: { calcium: 0, iron: 0.04, magnesium: 0, phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, selenium: 0 },
    processingLevel: 2, allergens: [],
  },
  'Butter': {
    vitamins: { vitaminA: 684, vitaminB1: 0.0, vitaminB2: 0.03, vitaminB3: 0.04, vitaminB5: 0.11, vitaminB6: 0.0, vitaminB12: 0.17, vitaminC: 0, vitaminD: 1.5, vitaminE: 2.3, vitaminK: 7.0, folate: 3 },
    minerals: { calcium: 24, iron: 0.02, magnesium: 2, phosphorus: 24, potassium: 24, sodium: 576, zinc: 0.1, selenium: 1.0 },
    processingLevel: 2, allergens: ['milk-allergy', 'dairy'],
  },

  // ==================== NUTS & SEEDS ====================

  'Almonds': {
    vitamins: { vitaminA: 0, vitaminB1: 0.21, vitaminB2: 1.01, vitaminB3: 3.6, vitaminB5: 0.47, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 25.6, vitaminK: 0, folate: 44 },
    minerals: { calcium: 269, iron: 3.7, magnesium: 270, phosphorus: 481, potassium: 733, sodium: 1, zinc: 3.1, selenium: 4.1 },
    processingLevel: 1, allergens: ['tree-nut-allergy'],
  },
  'Peanuts': {
    vitamins: { vitaminA: 0, vitaminB1: 0.64, vitaminB2: 0.14, vitaminB3: 12.1, vitaminB5: 1.77, vitaminB6: 0.35, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 8.3, vitaminK: 0, folate: 240 },
    minerals: { calcium: 92, iron: 4.6, magnesium: 168, phosphorus: 376, potassium: 705, sodium: 18, zinc: 3.3, selenium: 7.2 },
    processingLevel: 1, allergens: ['peanut-allergy'],
  },
  'Walnuts': {
    vitamins: { vitaminA: 1, vitaminB1: 0.34, vitaminB2: 0.15, vitaminB3: 1.1, vitaminB5: 0.57, vitaminB6: 0.54, vitaminB12: 0, vitaminC: 1.3, vitaminD: 0, vitaminE: 0.7, vitaminK: 2.7, folate: 98 },
    minerals: { calcium: 98, iron: 2.9, magnesium: 158, phosphorus: 346, potassium: 441, sodium: 2, zinc: 3.1, selenium: 4.9 },
    processingLevel: 1, allergens: ['tree-nut-allergy'],
  },
  'Cashews': {
    vitamins: { vitaminA: 0, vitaminB1: 0.42, vitaminB2: 0.06, vitaminB3: 1.1, vitaminB5: 0.86, vitaminB6: 0.42, vitaminB12: 0, vitaminC: 0.5, vitaminD: 0, vitaminE: 0.9, vitaminK: 34.1, folate: 25 },
    minerals: { calcium: 37, iron: 6.7, magnesium: 292, phosphorus: 593, potassium: 660, sodium: 12, zinc: 5.8, selenium: 19.9 },
    processingLevel: 1, allergens: ['tree-nut-allergy'],
  },
  'Peanut Butter': {
    vitamins: { vitaminA: 0, vitaminB1: 0.15, vitaminB2: 0.11, vitaminB3: 13.1, vitaminB5: 1.14, vitaminB6: 0.44, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 9.1, vitaminK: 0.3, folate: 92 },
    minerals: { calcium: 43, iron: 1.9, magnesium: 154, phosphorus: 358, potassium: 649, sodium: 426, zinc: 2.8, selenium: 7.5 },
    processingLevel: 2, allergens: ['peanut-allergy'],
  },
  'Almond Butter': {
    vitamins: { vitaminA: 0, vitaminB1: 0.1, vitaminB2: 0.94, vitaminB3: 3.1, vitaminB5: 0.35, vitaminB6: 0.1, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 24.2, vitaminK: 0, folate: 53 },
    minerals: { calcium: 347, iron: 3.5, magnesium: 279, phosphorus: 508, potassium: 748, sodium: 7, zinc: 3.3, selenium: 2.4 },
    processingLevel: 2, allergens: ['tree-nut-allergy'],
  },
  'Chia Seeds': {
    vitamins: { vitaminA: 0, vitaminB1: 0.62, vitaminB2: 0.17, vitaminB3: 8.8, vitaminB5: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 1.6, vitaminD: 0, vitaminE: 0.5, vitaminK: 0, folate: 49 },
    minerals: { calcium: 631, iron: 7.7, magnesium: 335, phosphorus: 860, potassium: 407, sodium: 16, zinc: 4.6, selenium: 55.2 },
    processingLevel: 1, allergens: [],
  },
  'Flax Seeds': {
    vitamins: { vitaminA: 0, vitaminB1: 1.64, vitaminB2: 0.16, vitaminB3: 3.1, vitaminB5: 0.99, vitaminB6: 0.47, vitaminB12: 0, vitaminC: 0.6, vitaminD: 0, vitaminE: 0.31, vitaminK: 4.3, folate: 87 },
    minerals: { calcium: 255, iron: 5.7, magnesium: 392, phosphorus: 642, potassium: 813, sodium: 30, zinc: 4.3, selenium: 25.4 },
    processingLevel: 1, allergens: [],
  },
  'Sunflower Seeds': {
    vitamins: { vitaminA: 3, vitaminB1: 1.48, vitaminB2: 0.35, vitaminB3: 8.3, vitaminB5: 1.13, vitaminB6: 1.35, vitaminB12: 0, vitaminC: 1.4, vitaminD: 0, vitaminE: 35.2, vitaminK: 0, folate: 227 },
    minerals: { calcium: 78, iron: 5.3, magnesium: 325, phosphorus: 660, potassium: 645, sodium: 9, zinc: 5.0, selenium: 53 },
    processingLevel: 1, allergens: [],
  },

  // ==================== SUPPLEMENTS & PROTEIN POWDERS ====================

  'Whey Protein Powder': {
    vitamins: { vitaminA: 0, vitaminB1: 0.05, vitaminB2: 0.2, vitaminB3: 0.1, vitaminB5: 0.4, vitaminB6: 0.1, vitaminB12: 0.3, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 5 },
    minerals: { calcium: 100, iron: 0.5, magnesium: 20, phosphorus: 150, potassium: 160, sodium: 100, zinc: 1.0, selenium: 5 },
    processingLevel: 3, allergens: ['milk-allergy', 'dairy'],
  },
  'Casein Protein Powder': {
    vitamins: { vitaminA: 0, vitaminB1: 0.04, vitaminB2: 0.15, vitaminB3: 0.1, vitaminB5: 0.3, vitaminB6: 0.08, vitaminB12: 0.2, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 4 },
    minerals: { calcium: 120, iron: 0.4, magnesium: 15, phosphorus: 180, potassium: 140, sodium: 90, zinc: 0.8, selenium: 4 },
    processingLevel: 3, allergens: ['milk-allergy', 'dairy'],
  },

  // ==================== PLANT-BASED MILK ====================

  'Almond Milk (unsweetened)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.02, vitaminB2: 0.02, vitaminB3: 0.1, vitaminB5: 0.02, vitaminB6: 0.01, vitaminB12: 0, vitaminC: 0, vitaminD: 1.0, vitaminE: 6.3, vitaminK: 0, folate: 1 },
    minerals: { calcium: 173, iron: 0.3, magnesium: 6, phosphorus: 9, potassium: 67, sodium: 72, zinc: 0.1, selenium: 0 },
    processingLevel: 3, allergens: ['tree-nut-allergy'],
  },
  'Oat Milk': {
    vitamins: { vitaminA: 65, vitaminB1: 0.16, vitaminB2: 0.19, vitaminB3: 0.4, vitaminB5: 0.11, vitaminB6: 0.05, vitaminB12: 0.5, vitaminC: 0, vitaminD: 1.3, vitaminE: 0.22, vitaminK: 0, folate: 6 },
    minerals: { calcium: 120, iron: 0.3, magnesium: 10, phosphorus: 90, potassium: 130, sodium: 100, zinc: 0.2, selenium: 1.0 },
    processingLevel: 3, allergens: ['gluten-free'],
  },
  'Soy Milk': {
    vitamins: { vitaminA: 63, vitaminB1: 0.04, vitaminB2: 0.21, vitaminB3: 0.4, vitaminB5: 0.09, vitaminB6: 0.05, vitaminB12: 1.2, vitaminC: 0, vitaminD: 1.2, vitaminE: 0.11, vitaminK: 3.0, folate: 18 },
    minerals: { calcium: 123, iron: 0.6, magnesium: 15, phosphorus: 52, potassium: 118, sodium: 51, zinc: 0.3, selenium: 2.3 },
    processingLevel: 3, allergens: ['soy-allergy'],
  },

  // ==================== BEVERAGES & CONDIMENTS ====================

  'Coffee (black)': {
    vitamins: { vitaminA: 0, vitaminB1: 0.01, vitaminB2: 0.18, vitaminB3: 0.5, vitaminB5: 0.25, vitaminB6: 0.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.01, vitaminK: 0.1, folate: 2 },
    minerals: { calcium: 2, iron: 0.01, magnesium: 3, phosphorus: 3, potassium: 49, sodium: 2, zinc: 0.02, selenium: 0 },
    processingLevel: 2, allergens: [],
  },
  'Orange Juice': {
    vitamins: { vitaminA: 10, vitaminB1: 0.09, vitaminB2: 0.03, vitaminB3: 0.4, vitaminB5: 0.19, vitaminB6: 0.04, vitaminB12: 0, vitaminC: 50, vitaminD: 0, vitaminE: 0.04, vitaminK: 0.1, folate: 30 },
    minerals: { calcium: 11, iron: 0.2, magnesium: 11, phosphorus: 17, potassium: 200, sodium: 1, zinc: 0.1, selenium: 0.1 },
    processingLevel: 2, allergens: [],
  },
  'Honey': {
    vitamins: { vitaminA: 0, vitaminB1: 0.0, vitaminB2: 0.04, vitaminB3: 0.1, vitaminB5: 0.07, vitaminB6: 0.02, vitaminB12: 0, vitaminC: 0.5, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 2 },
    minerals: { calcium: 6, iron: 0.4, magnesium: 2, phosphorus: 4, potassium: 52, sodium: 4, zinc: 0.2, selenium: 0.8 },
    processingLevel: 2, allergens: [],
  },
  'Maple Syrup': {
    vitamins: { vitaminA: 0, vitaminB1: 0.07, vitaminB2: 1.27, vitaminB3: 0.1, vitaminB5: 0.04, vitaminB6: 0.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 0 },
    minerals: { calcium: 102, iron: 0.1, magnesium: 21, phosphorus: 2, potassium: 212, sodium: 12, zinc: 1.5, selenium: 0.6 },
    processingLevel: 2, allergens: [],
  },
  'Soy Sauce': {
    vitamins: { vitaminA: 0, vitaminB1: 0.03, vitaminB2: 0.16, vitaminB3: 4.0, vitaminB5: 0.38, vitaminB6: 0.2, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0, folate: 18 },
    minerals: { calcium: 20, iron: 2.4, magnesium: 40, phosphorus: 130, potassium: 212, sodium: 5493, zinc: 0.4, selenium: 0.8 },
    processingLevel: 3, allergens: ['soy-allergy', 'wheat-allergy', 'gluten'],
  },
  'Hot Sauce': {
    vitamins: { vitaminA: 50, vitaminB1: 0.01, vitaminB2: 0.04, vitaminB3: 0.7, vitaminB5: 0.04, vitaminB6: 0.1, vitaminB12: 0, vitaminC: 4, vitaminD: 0, vitaminE: 0.69, vitaminK: 2.3, folate: 3 },
    minerals: { calcium: 8, iron: 0.5, magnesium: 8, phosphorus: 19, potassium: 144, sodium: 2643, zinc: 0.1, selenium: 0.2 },
    processingLevel: 3, allergens: [],
  },
  'Mustard': {
    vitamins: { vitaminA: 5, vitaminB1: 0.09, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.23, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 1.3, vitaminD: 0, vitaminE: 0.36, vitaminK: 1.3, folate: 7 },
    minerals: { calcium: 58, iron: 1.5, magnesium: 49, phosphorus: 108, potassium: 152, sodium: 1135, zinc: 0.6, selenium: 33 },
    processingLevel: 3, allergens: [],
  },
  'Ketchup': {
    vitamins: { vitaminA: 26, vitaminB1: 0.02, vitaminB2: 0.05, vitaminB3: 1.4, vitaminB5: 0.13, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 4.1, vitaminD: 0, vitaminE: 1.5, vitaminK: 2.8, folate: 9 },
    minerals: { calcium: 14, iron: 0.4, magnesium: 14, phosphorus: 28, potassium: 315, sodium: 907, zinc: 0.2, selenium: 0.3 },
    processingLevel: 3, allergens: [],
  },
  'Mayonnaise': {
    vitamins: { vitaminA: 28, vitaminB1: 0.01, vitaminB2: 0.02, vitaminB3: 0.0, vitaminB5: 0.14, vitaminB6: 0.02, vitaminB12: 0.1, vitaminC: 0, vitaminD: 0.1, vitaminE: 3.3, vitaminK: 24.7, folate: 4 },
    minerals: { calcium: 8, iron: 0.2, magnesium: 2, phosphorus: 27, potassium: 20, sodium: 635, zinc: 0.1, selenium: 2.1 },
    processingLevel: 3, allergens: ['egg-allergy'],
  },
  'Salsa': {
    vitamins: { vitaminA: 25, vitaminB1: 0.03, vitaminB2: 0.03, vitaminB3: 0.7, vitaminB5: 0.11, vitaminB6: 0.12, vitaminB12: 0, vitaminC: 7.2, vitaminD: 0, vitaminE: 0.4, vitaminK: 3.5, folate: 11 },
    minerals: { calcium: 18, iron: 0.6, magnesium: 11, phosphorus: 24, potassium: 210, sodium: 571, zinc: 0.2, selenium: 0.4 },
    processingLevel: 2, allergens: [],
  },
};

// Processing level descriptions
export const PROCESSING_LEVELS = {
  1: { label: 'Whole Food', description: 'Unprocessed or minimally processed', color: '#4CAF50' },
  2: { label: 'Lightly Processed', description: 'Basic processing, nutrients intact', color: '#8BC34A' },
  3: { label: 'Processed', description: 'Moderate processing with additives', color: '#FFC107' },
  4: { label: 'Ultra-Processed', description: 'Heavily processed, many additives', color: '#FF5722' },
};

class NutritionInsightsService {
  constructor() {
    this.showDetailedNutrition = false;
  }

  /**
   * Load user preference for showing detailed nutrition
   */
  async loadSettings() {
    try {
      const value = await AsyncStorage.getItem(DETAILED_NUTRITION_KEY);
      this.showDetailedNutrition = value === 'true';
      return this.showDetailedNutrition;
    } catch (error) {
      console.error('Error loading nutrition settings:', error);
      return false;
    }
  }

  /**
   * Save user preference for showing detailed nutrition
   */
  async setShowDetailedNutrition(show) {
    try {
      await AsyncStorage.setItem(DETAILED_NUTRITION_KEY, show ? 'true' : 'false');
      this.showDetailedNutrition = show;
      return true;
    } catch (error) {
      console.error('Error saving nutrition settings:', error);
      return false;
    }
  }

  /**
   * Get micronutrient data for a food
   * @param {string} foodName - Name of the food
   * @returns {Object|null} - Micronutrient data or null if not found
   */
  getMicronutrients(foodName) {
    // Try exact match first
    if (MICRONUTRIENT_DATABASE[foodName]) {
      return MICRONUTRIENT_DATABASE[foodName];
    }

    // Try partial match
    const lowerName = foodName.toLowerCase();
    for (const [key, value] of Object.entries(MICRONUTRIENT_DATABASE)) {
      if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Calculate nutrient density score (0-100)
   * Higher score = more nutrients per calorie
   */
  calculateNutrientDensity(food) {
    if (!food.calories || food.calories === 0) return 0;

    let score = 0;
    const caloriesPer100 = food.calories;

    // Protein density (max 30 points)
    const proteinDensity = (food.protein || 0) / caloriesPer100 * 100;
    score += Math.min(30, proteinDensity * 3);

    // Fiber density (max 20 points)
    const fiberDensity = (food.fiber || 0) / caloriesPer100 * 100;
    score += Math.min(20, fiberDensity * 10);

    // Micronutrient bonus (max 30 points)
    const micronutrients = this.getMicronutrients(food.name);
    if (micronutrients) {
      let microScore = 0;

      // Check vitamins
      for (const [key, amount] of Object.entries(micronutrients.vitamins || {})) {
        const dv = DAILY_VALUES[key];
        if (dv && amount > 0) {
          const percentDV = (amount / dv.value) * 100;
          microScore += Math.min(3, percentDV / 10); // Max 3 points per vitamin
        }
      }

      // Check minerals (except sodium)
      for (const [key, amount] of Object.entries(micronutrients.minerals || {})) {
        if (key === 'sodium') continue; // Don't reward high sodium
        const dv = DAILY_VALUES[key];
        if (dv && amount > 0) {
          const percentDV = (amount / dv.value) * 100;
          microScore += Math.min(2, percentDV / 10); // Max 2 points per mineral
        }
      }

      score += Math.min(30, microScore);
    }

    // Low calorie bonus (max 10 points)
    if (caloriesPer100 < 50) score += 10;
    else if (caloriesPer100 < 100) score += 7;
    else if (caloriesPer100 < 150) score += 4;

    // Processing level penalty (max -10 points)
    if (micronutrients?.processingLevel) {
      score -= (micronutrients.processingLevel - 1) * 3;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get food quality assessment
   */
  getFoodQuality(food) {
    const densityScore = this.calculateNutrientDensity(food);
    const micronutrients = this.getMicronutrients(food.name);

    let quality = 'Unknown';
    let color = '#9E9E9E';

    if (densityScore >= 70) {
      quality = 'Excellent';
      color = '#4CAF50';
    } else if (densityScore >= 50) {
      quality = 'Good';
      color = '#8BC34A';
    } else if (densityScore >= 30) {
      quality = 'Moderate';
      color = '#FFC107';
    } else {
      quality = 'Low';
      color = '#FF9800';
    }

    return {
      score: densityScore,
      quality,
      color,
      processingLevel: micronutrients?.processingLevel || null,
      processingInfo: micronutrients?.processingLevel
        ? PROCESSING_LEVELS[micronutrients.processingLevel]
        : null,
    };
  }

  /**
   * Get allergen warnings for a food
   */
  getAllergens(foodName) {
    const micronutrients = this.getMicronutrients(foodName);
    return micronutrients?.allergens || [];
  }

  /**
   * Calculate daily value percentages for micronutrients
   */
  calculateDailyValues(foodName, servingMultiplier = 1) {
    const micronutrients = this.getMicronutrients(foodName);
    if (!micronutrients) return null;

    const result = {
      vitamins: {},
      minerals: {},
    };

    // Calculate vitamin percentages
    for (const [key, amount] of Object.entries(micronutrients.vitamins || {})) {
      const dv = DAILY_VALUES[key];
      if (dv) {
        const adjustedAmount = amount * servingMultiplier;
        result.vitamins[key] = {
          amount: adjustedAmount,
          unit: dv.unit,
          name: dv.name,
          percentDV: Math.round((adjustedAmount / dv.value) * 100),
        };
      }
    }

    // Calculate mineral percentages
    for (const [key, amount] of Object.entries(micronutrients.minerals || {})) {
      const dv = DAILY_VALUES[key];
      if (dv) {
        const adjustedAmount = amount * servingMultiplier;
        result.minerals[key] = {
          amount: adjustedAmount,
          unit: dv.unit,
          name: dv.name,
          percentDV: Math.round((adjustedAmount / dv.value) * 100),
        };
      }
    }

    return result;
  }

  /**
   * Get top nutrients for a food (for quick display)
   */
  getTopNutrients(foodName, count = 5) {
    const dailyValues = this.calculateDailyValues(foodName);
    if (!dailyValues) return [];

    const allNutrients = [
      ...Object.entries(dailyValues.vitamins).map(([key, val]) => ({ key, ...val, type: 'vitamin' })),
      ...Object.entries(dailyValues.minerals).map(([key, val]) => ({ key, ...val, type: 'mineral' })),
    ];

    // Sort by %DV and return top ones
    return allNutrients
      .filter(n => n.percentDV > 0)
      .sort((a, b) => b.percentDV - a.percentDV)
      .slice(0, count);
  }

  /**
   * Check if detailed nutrition data is available for a food
   */
  hasDetailedNutrition(foodName) {
    return this.getMicronutrients(foodName) !== null;
  }

  /**
   * Get list of all foods with micronutrient data
   */
  getFoodsWithMicronutrients() {
    return Object.keys(MICRONUTRIENT_DATABASE);
  }
}

// Export singleton
const nutritionInsightsService = new NutritionInsightsService();
export default nutritionInsightsService;

// Also export the class for testing
export { NutritionInsightsService, MICRONUTRIENT_DATABASE };
