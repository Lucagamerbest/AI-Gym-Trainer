import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { searchFoods, initDatabase } from '../services/foodDatabaseService';
import { unifiedFoodSearch } from '../services/unifiedFoodSearch';

// Popular foods to show initially
const POPULAR_FOODS = [
  'Chicken Breast', 'Rice', 'Eggs', 'Banana', 'Oatmeal',
  'Salmon', 'Greek Yogurt', 'Sweet Potato', 'Avocado', 'Almonds'
];

export default function FoodSearchScreen({ route, navigation }) {
  const {
    mealType = 'lunch',
    isPlannedMeal,
    plannedDateKey,
    reopenDate,
    fromMealPlanTemplate,
    templateDayIndex,
    templateMealType,
    screenId
  } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [allFoods, setAllFoods] = useState([]);
  const [displayedFoods, setDisplayedFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Initialize database and load foods on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initDatabase();
        const foods = await searchFoods('');
        setAllFoods(foods);

        // Show popular foods initially
        const popularItems = foods.filter(food =>
          POPULAR_FOODS.some(popular =>
            food.name.toLowerCase().includes(popular.toLowerCase())
          )
        ).slice(0, 20);

        const itemsToDisplay = popularItems.length > 0 ? popularItems : foods.slice(0, 20);
        setDisplayedFoods(itemsToDisplay);
      } catch (error) {
        console.error('Failed to initialize foods:', error);
        setDisplayedFoods([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle search with debouncing
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      // Show popular foods when search is empty
      const popularItems = allFoods.filter(food =>
        POPULAR_FOODS.some(popular =>
          food.name.toLowerCase().includes(popular.toLowerCase())
        )
      ).slice(0, 20);
      setDisplayedFoods(popularItems.length > 0 ? popularItems : allFoods.slice(0, 20));
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      // Use unified search with API enabled for comprehensive results
      const results = await unifiedFoodSearch(query, {
        includeAPI: true,  // Include API results for FoodSearchScreen
        limit: 50
      });

      setDisplayedFoods(results);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search
      const localResults = allFoods.filter(food =>
        food.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50);
      setDisplayedFoods(localResults);
    }

    setIsSearching(false);
  }, [allFoods]);

  // Handle text input changes with debouncing
  const handleSearchChange = (text) => {
    setSearchText(text);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  // Clear search
  const clearSearch = () => {
    setSearchText('');
    performSearch('');
    Keyboard.dismiss();
  };

  // Handle food selection
  const selectFood = (food) => {
    // Navigate to food detail screen
    navigation.navigate('FoodDetail', {
      food,
      mealType,
      isPlannedMeal,
      plannedDateKey,
      reopenDate,
      fromMealPlanTemplate,
      templateDayIndex,
      templateMealType,
      screenId: screenId, // Pass screen ID for tracking
    });
  };

  // Render individual food item
  const renderFoodItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.foodCard}
      onPress={() => selectFood(item)}
      activeOpacity={0.7}
    >
      <View style={styles.foodHeader}>
        <Text style={styles.foodName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.foodCalories}>
          {item.calories} cal/100g
        </Text>
      </View>
      <View style={styles.macrosContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{item.protein || 0}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{item.carbs || 0}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{item.fat || 0}g</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render list header
  const renderListHeader = () => {
    if (isSearching) {
      return (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.messageText}>Searching...</Text>
        </View>
      );
    }

    if (!isLoading && displayedFoods.length === 0 && searchText) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>No foods found for "{searchText}"</Text>
        </View>
      );
    }

    if (!searchText && displayedFoods.length > 0) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Foods</Text>
        </View>
      );
    }

    if (searchText && displayedFoods.length > 0) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {displayedFoods.length} Result{displayedFoods.length !== 1 ? 's' : ''}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <ScreenLayout
      title="Add Food"
      subtitle="Search and track your meals"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* Search Bar Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading foods...</Text>
          </View>
        ) : displayedFoods.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No foods loaded. Check database initialization.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {renderListHeader()}
            {displayedFoods.map((item, index) => (
              <TouchableOpacity
                key={`food-${index}`}
                style={styles.foodCard}
                onPress={() => selectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodHeader}>
                  <View style={styles.foodTitleRow}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.source === 'openfoodfacts' && (
                      <View style={styles.apiIndicator}>
                        <Text style={styles.apiIndicatorText}>API</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.foodCalories}>
                    {item.calories} cal/100g
                  </Text>
                </View>
                <View style={styles.macrosContainer}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protein</Text>
                    <Text style={styles.macroValue}>{item.protein || 0}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Carbs</Text>
                    <Text style={styles.macroValue}>{item.carbs || 0}g</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Fat</Text>
                    <Text style={styles.macroValue}>{item.fat || 0}g</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearButtonText: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingBottom: Spacing.xl * 3,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface + '80',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  foodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  foodHeader: {
    marginBottom: Spacing.md,
  },
  foodTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  foodName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    letterSpacing: 0.2,
  },
  apiIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  apiIndicatorText: {
    fontSize: Typography.fontSize.xs,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  foodCalories: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '700',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '40',
    gap: Spacing.sm,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  macroLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
});