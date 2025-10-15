# 🔌 API Integration Guide

**Purpose:** Step-by-step guide to integrate scientific databases into the app

---

## 🎯 OVERVIEW

We'll integrate three main data sources:
1. **ExerciseDB** - 1500+ exercises with videos/gifs (GitHub, free)
2. **USDA FoodData Central** - 300k+ foods with nutrition data (API, free)
3. **Open Food Facts** - 3M+ products with barcode scanning (API, free)

---

## 📦 PART 1: EXERCISEDB INTEGRATION

### Option A: Direct GitHub JSON (Recommended for MVP)

**Repository:** https://github.com/yuhonas/free-exercise-db

```bash
# Clone or download the exercises.json file
curl -o exercises.json https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
```

**Data Structure:**
```json
{
  "id": "barbell-bench-press",
  "name": "Barbell Bench Press",
  "force": "push",
  "level": "beginner",
  "mechanic": "compound",
  "equipment": "barbell",
  "primaryMuscles": ["chest"],
  "secondaryMuscles": ["shoulders", "triceps"],
  "instructions": [
    "Lie flat on a bench...",
    "Grip the bar...",
    "Lower the bar..."
  ],
  "category": "strength",
  "images": ["bench-press-1.jpg", "bench-press-2.jpg"]
}
```

**Implementation in React Native:**

```typescript
// src/data/enhancedExerciseDatabase.ts
import exercisesRawData from './exercises.json';
import { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '../types/exercise';

// Map their data structure to our schema
export const enhancedExerciseDatabase: Exercise[] = exercisesRawData.map(raw => ({
  id: raw.id,
  name: raw.name,
  alternativeNames: [],

  category: mapToOurCategory(raw.category, raw.primaryMuscles[0]),
  muscleGroups: {
    primary: raw.primaryMuscles.map(m => mapToMuscleGroup(m)),
    secondary: raw.secondaryMuscles.map(m => mapToMuscleGroup(m)),
    stabilizers: []
  },

  equipment: [mapToEquipment(raw.equipment)],
  difficulty: raw.level as 'beginner' | 'intermediate' | 'advanced',
  mechanic: raw.mechanic as 'compound' | 'isolation',
  force: raw.force as 'push' | 'pull' | 'static',

  // Add NSCA guidelines based on category
  recommendedSets: getRecommendedSets(raw.mechanic),
  recommendedReps: getRecommendedReps(raw.mechanic),
  recommendedRestPeriod: getRestPeriods(raw.mechanic),

  instructions: {
    setup: [raw.instructions[0]],
    execution: raw.instructions.slice(1),
    breathing: generateBreathingCue(raw.force),
    commonMistakes: [],
    safetyTips: []
  },

  media: {
    demonstrationVideo: '',
    demonstrationGif: '',
    formImages: raw.images.map(img =>
      `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`
    ),
    muscleActivationDiagram: ''
  },

  progressionPath: {
    easier: [],
    harder: [],
    variations: []
  },

  source: 'free-exercise-db',
  sourceId: raw.id,
  scientificReferences: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  verifiedBy: 'ExerciseDB'
}));

// Helper functions
function mapToMuscleGroup(muscle: string): MuscleGroup {
  const mapping: Record<string, MuscleGroup> = {
    'chest': MuscleGroup.CHEST,
    'back': MuscleGroup.BACK,
    'legs': MuscleGroup.LEGS,
    'shoulders': MuscleGroup.SHOULDERS,
    'biceps': MuscleGroup.BICEPS,
    'triceps': MuscleGroup.TRICEPS,
    'forearms': MuscleGroup.FOREARMS,
    'abs': MuscleGroup.ABS,
    'abdominals': MuscleGroup.ABS,
    'quadriceps': MuscleGroup.LEGS_QUADS,
    'hamstrings': MuscleGroup.LEGS_HAMSTRINGS,
    'glutes': MuscleGroup.LEGS_GLUTES,
    'calves': MuscleGroup.LEGS_CALVES,
    'lats': MuscleGroup.BACK_LATS,
    'traps': MuscleGroup.BACK_TRAPS,
    'lower back': MuscleGroup.BACK_LOWER
  };
  return mapping[muscle.toLowerCase()] || MuscleGroup.CHEST;
}

function mapToEquipment(equipment: string): Equipment {
  const mapping: Record<string, Equipment> = {
    'barbell': Equipment.BARBELL,
    'dumbbell': Equipment.DUMBBELL,
    'kettlebell': Equipment.KETTLEBELL,
    'cable': Equipment.CABLE,
    'machine': Equipment.MACHINE,
    'body only': Equipment.BODYWEIGHT,
    'bands': Equipment.RESISTANCE_BAND,
    'medicine ball': Equipment.MEDICINE_BALL,
    'foam roller': Equipment.FOAM_ROLLER,
    'bench': Equipment.BENCH,
    'pull-up bar': Equipment.PULL_UP_BAR
  };
  return mapping[equipment.toLowerCase()] || Equipment.NONE;
}

function getRecommendedSets(mechanic: string) {
  // NSCA guidelines
  return {
    strength: { min: 3, max: 6 },
    hypertrophy: { min: 3, max: 5 },
    endurance: { min: 2, max: 3 }
  };
}

function getRecommendedReps(mechanic: string) {
  // ACSM guidelines
  return {
    strength: { min: 1, max: 5 },
    hypertrophy: { min: 6, max: 12 },
    endurance: { min: 12, max: 20 }
  };
}

function getRestPeriods(mechanic: string) {
  // Compound exercises need more rest
  const isCompound = mechanic === 'compound';
  return {
    strength: isCompound ? 300 : 180,    // 5 min vs 3 min
    hypertrophy: isCompound ? 120 : 90,  // 2 min vs 90 sec
    endurance: isCompound ? 60 : 45      // 60 sec vs 45 sec
  };
}

function generateBreathingCue(force: string): string {
  if (force === 'push') {
    return 'Exhale during the push/concentric phase, inhale during the lower/eccentric phase';
  } else if (force === 'pull') {
    return 'Exhale during the pull/concentric phase, inhale during the release/eccentric phase';
  } else {
    return 'Breathe steadily throughout the movement, avoid holding your breath';
  }
}
```

### Option B: ExerciseDB API (More Data, Requires API Key)

**API:** https://github.com/ExerciseDB/exercisedb-api

```bash
npm install axios
```

```typescript
// src/services/exerciseDBService.ts
import axios from 'axios';

const EXERCISEDB_API_BASE = 'https://exercisedb-api.vercel.app';

export class ExerciseDBService {
  static async getAllExercises() {
    const response = await axios.get(`${EXERCISEDB_API_BASE}/api/v1/exercises`);
    return response.data;
  }

  static async getExercisesByMuscle(muscle: string) {
    const response = await axios.get(
      `${EXERCISEDB_API_BASE}/api/v1/exercises/muscle/${muscle}`
    );
    return response.data;
  }

  static async getExercisesByEquipment(equipment: string) {
    const response = await axios.get(
      `${EXERCISEDB_API_BASE}/api/v1/exercises/equipment/${equipment}`
    );
    return response.data;
  }

  static async searchExercises(query: string) {
    const response = await axios.get(
      `${EXERCISEDB_API_BASE}/api/v1/exercises/search?q=${query}`
    );
    return response.data;
  }
}
```

---

## 🍎 PART 2: USDA FOODDATA CENTRAL INTEGRATION

### Step 1: Get API Key

1. Go to https://api.data.gov/signup/
2. Fill out the form (takes 30 seconds)
3. Receive API key via email instantly
4. Rate limit: 1000 requests/hour (plenty for most apps)

### Step 2: Add to Environment

```bash
# Create .env file (if not exists)
echo "USDA_API_KEY=your_api_key_here" >> .env
```

```typescript
// .env
USDA_API_KEY=your_actual_api_key_from_api_data_gov
```

### Step 3: Install Dependencies

```bash
npm install axios dotenv @react-native-dotenv
```

### Step 4: Create Service

```typescript
// src/services/usdaFoodService.ts
import axios from 'axios';
import { USDA_API_KEY } from '@env';

const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export class USDAFoodService {
  /**
   * Search for foods by name
   * @param query Search term (e.g., "chicken breast")
   * @param pageSize Number of results (default 25, max 200)
   */
  static async searchFoods(query: string, pageSize: number = 25) {
    try {
      const response = await axios.get(`${USDA_API_BASE}/foods/search`, {
        params: {
          api_key: USDA_API_KEY,
          query: query,
          pageSize: pageSize,
          dataType: ['Branded', 'SR Legacy', 'Foundation'], // All types
        }
      });

      return response.data.foods.map((food: any) => ({
        fdcId: food.fdcId,
        description: food.description,
        brandOwner: food.brandOwner,
        ingredients: food.ingredients,
        servingSize: food.servingSize,
        servingSizeUnit: food.servingSizeUnit,
        calories: this.getNutrient(food.foodNutrients, 'Energy'),
        protein: this.getNutrient(food.foodNutrients, 'Protein'),
        carbs: this.getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
        fat: this.getNutrient(food.foodNutrients, 'Total lipid (fat)'),
        fiber: this.getNutrient(food.foodNutrients, 'Fiber, total dietary'),
        sugar: this.getNutrient(food.foodNutrients, 'Sugars, total including NLEA')
      }));
    } catch (error) {
      console.error('USDA API Error:', error);
      throw error;
    }
  }

  /**
   * Get detailed food information by FDC ID
   */
  static async getFoodDetails(fdcId: number) {
    try {
      const response = await axios.get(`${USDA_API_BASE}/food/${fdcId}`, {
        params: {
          api_key: USDA_API_KEY
        }
      });

      const food = response.data;

      return {
        fdcId: food.fdcId,
        description: food.description,
        brandOwner: food.brandOwner,
        servingSize: food.servingSize,
        servingSizeUnit: food.servingSizeUnit,
        nutrition: {
          calories: this.getNutrient(food.foodNutrients, 'Energy'),
          protein: this.getNutrient(food.foodNutrients, 'Protein'),
          carbs: this.getNutrient(food.foodNutrients, 'Carbohydrate, by difference'),
          fat: this.getNutrient(food.foodNutrients, 'Total lipid (fat)'),
          fiber: this.getNutrient(food.foodNutrients, 'Fiber, total dietary'),
          sugar: this.getNutrient(food.foodNutrients, 'Sugars, total including NLEA'),
          sodium: this.getNutrient(food.foodNutrients, 'Sodium, Na'),
          potassium: this.getNutrient(food.foodNutrients, 'Potassium, K'),
          calcium: this.getNutrient(food.foodNutrients, 'Calcium, Ca'),
          iron: this.getNutrient(food.foodNutrients, 'Iron, Fe'),
          vitaminA: this.getNutrient(food.foodNutrients, 'Vitamin A, IU'),
          vitaminC: this.getNutrient(food.foodNutrients, 'Vitamin C, total ascorbic acid'),
          vitaminD: this.getNutrient(food.foodNutrients, 'Vitamin D (D2 + D3)')
        }
      };
    } catch (error) {
      console.error('USDA API Error:', error);
      throw error;
    }
  }

  /**
   * Helper: Extract nutrient value from foodNutrients array
   */
  private static getNutrient(nutrients: any[], nutrientName: string): number {
    const nutrient = nutrients.find(n =>
      n.nutrientName === nutrientName
    );
    return nutrient?.value || 0;
  }

  /**
   * Get multiple foods by FDC IDs (batch request)
   */
  static async getFoodsByIds(fdcIds: number[]) {
    try {
      const response = await axios.post(
        `${USDA_API_BASE}/foods`,
        { fdcIds },
        {
          params: { api_key: USDA_API_KEY },
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('USDA API Error:', error);
      throw error;
    }
  }
}
```

### Step 5: Usage Example

```typescript
// In your FoodSearchScreen.tsx
import { USDAFoodService } from '../services/usdaFoodService';

const handleSearch = async (query: string) => {
  try {
    setLoading(true);
    const results = await USDAFoodService.searchFoods(query, 50);
    setSearchResults(results);
  } catch (error) {
    Alert.alert('Error', 'Failed to search foods');
  } finally {
    setLoading(false);
  }
};

// Add to meal
const addFoodToMeal = async (fdcId: number) => {
  const foodDetails = await USDAFoodService.getFoodDetails(fdcId);
  // Add to your meal tracking
};
```

---

## 📱 PART 3: OPEN FOOD FACTS INTEGRATION (BARCODE SCANNING)

### Step 1: Install Barcode Scanner

```bash
npx expo install expo-barcode-scanner
```

### Step 2: Create Service

```typescript
// src/services/openFoodFactsService.ts
import axios from 'axios';

const OFF_API_BASE = 'https://world.openfoodfacts.net/api/v2';

export class OpenFoodFactsService {
  /**
   * Get product by barcode
   */
  static async getProductByBarcode(barcode: string) {
    try {
      const response = await axios.get(`${OFF_API_BASE}/product/${barcode}`);

      if (response.data.status === 0) {
        throw new Error('Product not found');
      }

      const product = response.data.product;

      return {
        barcode: barcode,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        servingSize: product.serving_size || '100g',

        nutrition: {
          calories: product.nutriments['energy-kcal_100g'] || 0,
          protein: product.nutriments.proteins_100g || 0,
          carbs: product.nutriments.carbohydrates_100g || 0,
          fat: product.nutriments.fat_100g || 0,
          fiber: product.nutriments.fiber_100g || 0,
          sugar: product.nutriments.sugars_100g || 0,
          sodium: product.nutriments.sodium_100g || 0
        },

        scores: {
          nutriScore: product.nutriscore_grade,
          novaGroup: product.nova_group
        },

        dietary: {
          isVegan: product.ingredients_analysis_tags?.includes('en:vegan'),
          isVegetarian: product.ingredients_analysis_tags?.includes('en:vegetarian'),
          isPalmOilFree: product.ingredients_analysis_tags?.includes('en:palm-oil-free')
        },

        ingredients: product.ingredients_text,
        allergens: product.allergens_tags || [],

        imageUrl: product.image_url,
        imageFront: product.image_front_url
      };
    } catch (error) {
      console.error('Open Food Facts Error:', error);
      throw error;
    }
  }

  /**
   * Search products by name
   */
  static async searchProducts(query: string, page: number = 1) {
    try {
      const response = await axios.get(`${OFF_API_BASE}/search`, {
        params: {
          search_terms: query,
          page: page,
          page_size: 25,
          fields: 'product_name,brands,nutriments,nutriscore_grade,nova_group'
        }
      });

      return response.data.products.map((product: any) => ({
        name: product.product_name,
        brand: product.brands,
        calories: product.nutriments['energy-kcal_100g'] || 0,
        protein: product.nutriments.proteins_100g || 0,
        carbs: product.nutriments.carbohydrates_100g || 0,
        fat: product.nutriments.fat_100g || 0,
        nutriScore: product.nutriscore_grade,
        novaGroup: product.nova_group
      }));
    } catch (error) {
      console.error('Open Food Facts Search Error:', error);
      throw error;
    }
  }
}
```

### Step 3: Barcode Scanner Component

```typescript
// src/screens/BarcodeScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { OpenFoodFactsService } from '../services/openFoodFactsService';

export default function BarcodeScannerScreen({ navigation, route }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      // Lookup product in Open Food Facts
      const product = await OpenFoodFactsService.getProductByBarcode(data);

      // Navigate to food details screen
      navigation.navigate('FoodDetails', {
        food: product,
        mealType: route.params?.mealType
      });
    } catch (error) {
      Alert.alert(
        'Product Not Found',
        'This product is not in our database. Try searching manually.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Manual Search', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instruction}>
          {loading ? 'Looking up product...' : 'Align barcode within the frame'}
        </Text>
      </View>

      {scanned && !loading && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
  },
  instruction: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
  },
  rescanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

---

## 🔐 ENVIRONMENT SETUP

```typescript
// .env
USDA_API_KEY=your_usda_api_key_here

// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }]
    ]
  };
};

// types/env.d.ts
declare module '@env' {
  export const USDA_API_KEY: string;
}
```

---

## 📊 TESTING THE INTEGRATIONS

```typescript
// __tests__/api-integration.test.ts

describe('Exercise Database', () => {
  it('should load all exercises', () => {
    const exercises = require('../src/data/exercises.json');
    expect(exercises.length).toBeGreaterThan(500);
  });
});

describe('USDA API', () => {
  it('should search for chicken breast', async () => {
    const results = await USDAFoodService.searchFoods('chicken breast');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('protein');
  });
});

describe('Open Food Facts API', () => {
  it('should scan Coca-Cola barcode', async () => {
    const product = await OpenFoodFactsService.getProductByBarcode('5449000000996');
    expect(product.name).toContain('Coca');
  });
});
```

---

## 🚀 NEXT STEPS

1. **Get API Keys** (10 minutes)
   - USDA FoodData Central: https://api.data.gov/signup/

2. **Download Exercise Data** (5 minutes)
   ```bash
   cd src/data
   curl -o exercises.json https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
   ```

3. **Install Dependencies** (2 minutes)
   ```bash
   npm install axios @react-native-dotenv expo-barcode-scanner
   ```

4. **Create Services** (30 minutes)
   - Copy the service files from above
   - Test each API endpoint

5. **Integrate into App** (1-2 hours)
   - Replace current exercise database
   - Add food search with USDA
   - Add barcode scanning

---

## 💡 BEST PRACTICES

### Caching
- Cache USDA API responses for 24 hours
- Cache exercise data permanently (static)
- Cache barcode scans for 7 days

### Error Handling
- Fallback to local database if API fails
- Show user-friendly error messages
- Log errors for debugging

### Rate Limiting
- USDA: 1000/hour (plenty for most use)
- Open Food Facts: No hard limit, be reasonable
- ExerciseDB: No API calls (static JSON)

### Offline Support
- Store frequently accessed foods locally
- All exercises available offline
- Sync when connection restored

---

**Ready to implement!** Start with ExerciseDB (easiest), then USDA, then barcode scanning.
