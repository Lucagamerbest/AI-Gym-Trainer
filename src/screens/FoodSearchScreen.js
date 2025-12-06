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
  ScrollView,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { searchFoods, initDatabase } from '../services/foodDatabaseService';
import { unifiedFoodSearch } from '../services/unifiedFoodSearch';
import userContributedFoods from '../services/userContributedFoods';

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
  const [myFoods, setMyFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Load user's custom foods
  const loadMyFoods = async () => {
    try {
      await userContributedFoods.initialize();
      const foods = await userContributedFoods.getRecentFoods(10);
      setMyFoods(foods);
    } catch (error) {
      console.log('Failed to load user foods:', error);
    }
  };

  // Initialize database and load foods on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initDatabase();
        const foods = await searchFoods('');
        setAllFoods(foods);

        // Load user's custom foods
        await loadMyFoods();

        // Show popular foods initially
        const popularItems = foods.filter(food =>
          POPULAR_FOODS.some(popular =>
            food.name.toLowerCase().includes(popular.toLowerCase())
          )
        ).slice(0, 20);

        const itemsToDisplay = popularItems.length > 0 ? popularItems : foods.slice(0, 20);
        setDisplayedFoods(itemsToDisplay);
      } catch (error) {
        setDisplayedFoods([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Reload my foods when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMyFoods();
    });
    return unsubscribe;
  }, [navigation]);

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

          {/* Add Custom Food Button */}
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => navigation.navigate('AddCustomFood', {
              mealType,
              isPlannedMeal,
              plannedDateKey,
              reopenDate,
            })}
          >
            <Text style={styles.addCustomIcon}>+</Text>
            <Text style={styles.addCustomText}>Create Custom Food</Text>
          </TouchableOpacity>
        </View>

        {/* My Foods Section - Always visible when user has custom foods */}
        {myFoods.length > 0 && !searchText && (
          <View style={styles.myFoodsSection}>
            <View style={styles.myFoodsHeader}>
              <Text style={styles.myFoodsTitle}>My Foods</Text>
              <Text style={styles.myFoodsCount}>{myFoods.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.myFoodsScroll}
            >
              {myFoods.map((food, index) => (
                <TouchableOpacity
                  key={`my-food-${food.id || index}`}
                  style={styles.myFoodCard}
                  onPress={() => selectFood(food)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.myFoodName} numberOfLines={2}>{food.name}</Text>
                  <Text style={styles.myFoodCalories}>{food.calories} cal</Text>
                  <View style={styles.myFoodMacros}>
                    <Text style={styles.myFoodMacro}>P: {food.protein || 0}g</Text>
                    <Text style={styles.myFoodMacro}>C: {food.carbs || 0}g</Text>
                    <Text style={styles.myFoodMacro}>F: {food.fat || 0}g</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
                    {item.source === 'user' && (
                      <View style={styles.userIndicator}>
                        <Text style={styles.userIndicatorText}>MY FOOD</Text>
                      </View>
                    )}
                    {item.source === 'restaurant' && (
                      <View style={[styles.restaurantIndicator, { backgroundColor: item.restaurant_color || '#FF6B35' }]}>
                        <Text style={styles.restaurantIndicatorText}>{item.brand || 'RESTAURANT'}</Text>
                      </View>
                    )}
                    {item.source === 'openfoodfacts' && (
                      <View style={styles.apiIndicator}>
                        <Text style={styles.apiIndicatorText}>API</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.foodCalories}>
                    {item.calories} cal{item.source === 'restaurant' ? '' : '/100g'}
                  </Text>
                  {item.source === 'restaurant' && item.serving_size && (
                    <Text style={styles.servingSize}>{item.serving_size}</Text>
                  )}
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
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  addCustomIcon: {
    fontSize: 20,
    color: Colors.primary,
    marginRight: Spacing.xs,
    fontWeight: '600',
  },
  addCustomText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  // My Foods Section
  myFoodsSection: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  myFoodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  myFoodsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  myFoodsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  myFoodsScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  myFoodCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  myFoodName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    height: 36,
  },
  myFoodCalories: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  myFoodMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myFoodMacro: {
    fontSize: Typography.fontSize.xs,
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
  userIndicator: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  userIndicatorText: {
    fontSize: Typography.fontSize.xs,
    color: '#000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restaurantIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  restaurantIndicatorText: {
    fontSize: Typography.fontSize.xs - 1,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  foodCalories: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '700',
  },
  servingSize: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
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