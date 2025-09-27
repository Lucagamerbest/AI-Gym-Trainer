import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import {
  initDatabase,
  searchFoods,
  getFavorites,
  getRecentFoods,
  addToDaily,
  saveFoodFromAPI,
  saveFood,
} from '../services/foodDatabaseService';
import { foodAPI } from '../services/foodAPI';
import { defaultFoods } from '../services/defaultFoods';

export default function FoodSearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [servingSize, setServingSize] = useState('100');
  const [mealType, setMealType] = useState('snack');
  const [activeTab, setActiveTab] = useState('search'); // search, favorites, recent

  // Add real-time search as user types
  useEffect(() => {
    // Debounce search to avoid too many queries
    const delayDebounce = setTimeout(() => {
      if (activeTab === 'search' && searchQuery.length > 0) {
        handleSearch();
      }
    }, 800); // 0.8 second delay - balanced for multi-word typing

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    // Initialize database when screen loads
    initDatabase().then(async () => {
      // Check if database is empty and populate with default foods
      const existingFoods = await searchFoods('');

      // Check if we have the new foods (100+ items) or just old ones
      const hasBeef = existingFoods.some(f => f.name?.toLowerCase().includes('beef'));
      const needsUpdate = existingFoods.length < 100 || !hasBeef;

      if (existingFoods.length === 0 || needsUpdate) {
        // Clear and repopulate to ensure we have all 100+ items
        for (const food of defaultFoods) {
          try {
            await saveFood(food);
          } catch (error) {
            // Silent error handling
          }
        }
        // Load all foods after adding defaults
        const allFoods = await searchFoods('');
        setSearchResults(allFoods);
      } else {
        // Show existing foods
        setSearchResults(existingFoods);
      }

      loadFavorites();
      loadRecentFoods();
    });
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadRecentFoods = async () => {
    try {
      const recent = await getRecentFoods();
      setRecentFoods(recent);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    }
  };

  const handleSearch = async () => {
    // Allow empty search to show all foods
    const query = searchQuery.trim();

    setIsLoading(true);
    try {
      // First search local database
      const localResults = await searchFoods(query || '');

      if (localResults.length > 0) {
        setSearchResults(localResults);
      } else {
        // If no local results, search API
        const apiResults = await foodAPI.searchFood(searchQuery);

        if (apiResults.length > 0) {
          // Save API results to local database
          for (const food of apiResults) {
            await saveFoodFromAPI({
              ...food,
              barcode: food.barcode,
              name: food.name,
              brand: food.brand,
              nutrition: food.nutrition,
              imageUrl: food.imageUrl,
            });
          }

          // Search again to get the saved results
          const updatedResults = await searchFoods(searchQuery);
          setSearchResults(updatedResults);
        } else {
          setSearchResults([]);
          Alert.alert('No Results', 'No foods found matching your search');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for foods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setServingSize('100');
    setShowAddModal(true);
  };

  const handleAddToDaily = async () => {
    if (!selectedFood || !servingSize) return;

    try {
      await addToDaily(selectedFood.id, parseFloat(servingSize), mealType);

      Alert.alert(
        'Success',
        `Added ${servingSize}g of ${selectedFood.name} to your daily intake`,
        [
          { text: 'OK', onPress: () => {
            setShowAddModal(false);
            loadRecentFoods();
            navigation.navigate('NutritionDashboard');
          }}
        ]
      );
    } catch (error) {
      console.error('Error adding to daily:', error);
      Alert.alert('Error', 'Failed to add food to daily intake');
    }
  };

  const handleScanBarcode = () => {
    navigation.navigate('Camera');
  };

  const handleCreateCustomFood = () => {
    // TODO: Implement custom food creation
    Alert.alert('Coming Soon', 'Custom food creation will be available soon!');
  };

  const renderFoodItem = ({ item }) => {
    const calories = Math.round(item.calories);

    return (
      <TouchableOpacity onPress={() => handleFoodSelect(item)}>
        <StyledCard style={styles.foodCard}>
          <View style={styles.foodInfo}>
            <View style={styles.foodHeader}>
              <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
              {item.brand && (
                <Text style={styles.foodBrand} numberOfLines={1}>{item.brand}</Text>
              )}
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.calorieText}>{calories} cal</Text>
              <View style={styles.macroRow}>
                <Text style={styles.macroText}>P: {item.protein}g</Text>
                <Text style={styles.macroText}>C: {item.carbs}g</Text>
                <Text style={styles.macroText}>F: {item.fat}g</Text>
              </View>
            </View>
          </View>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.foodImage} />
          )}
        </StyledCard>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    if (activeTab === 'search' && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading foods...</Text>
          <Text style={styles.emptySubtext}>Try searching for "apple", "chicken", or "rice"</Text>
        </View>
      );
    }
    if (activeTab === 'favorites' && favorites.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No favorite foods yet</Text>
          <Text style={styles.emptySubtext}>Foods you use frequently will appear here</Text>
        </View>
      );
    }
    if (activeTab === 'recent' && recentFoods.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent foods</Text>
          <Text style={styles.emptySubtext}>Foods you've logged will appear here</Text>
        </View>
      );
    }
    return null;
  };

  const getDisplayList = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites;
      case 'recent':
        return recentFoods;
      default:
        return searchResults;
    }
  };

  return (
    <ScreenLayout
      title="Add Food"
      subtitle="Search or scan foods to track calories"
      navigation={navigation}
      showBack={true}
      scrollable={false}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleScanBarcode}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleCreateCustomFood}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Create Food</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={getDisplayList()}
          renderItem={renderFoodItem}
          keyExtractor={(item, index) => `${item.id || index}-${item.name || index}`}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Food Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedFood && (
              <>
                <Text style={styles.modalTitle}>Add to Daily Intake</Text>
                <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                {selectedFood.brand && (
                  <Text style={styles.modalFoodBrand}>{selectedFood.brand}</Text>
                )}

                {/* Meal Type Selection */}
                <Text style={styles.modalLabel}>Meal Type</Text>
                <View style={styles.mealTypeContainer}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
                    <TouchableOpacity
                      key={meal}
                      style={[
                        styles.mealTypeButton,
                        mealType === meal && styles.mealTypeButtonActive,
                      ]}
                      onPress={() => setMealType(meal)}
                    >
                      <Text
                        style={[
                          styles.mealTypeText,
                          mealType === meal && styles.mealTypeTextActive,
                        ]}
                      >
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Serving Size */}
                <Text style={styles.modalLabel}>Serving Size (grams)</Text>
                <TextInput
                  style={styles.servingInput}
                  value={servingSize}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    if (numericValue === '') {
                      setServingSize('');
                    } else {
                      const withoutLeadingZeros = numericValue.replace(/^0+/, '') || '0';
                      setServingSize(withoutLeadingZeros);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="100"
                />

                {/* Nutrition Preview */}
                <View style={styles.nutritionPreview}>
                  <Text style={styles.nutritionPreviewTitle}>Nutrition for {servingSize || 0}g</Text>
                  <View style={styles.nutritionPreviewRow}>
                    <Text style={styles.nutritionPreviewItem}>
                      Calories: {Math.round((selectedFood.calories * (parseFloat(servingSize) || 0)) / 100)}
                    </Text>
                    <Text style={styles.nutritionPreviewItem}>
                      Protein: {((selectedFood.protein * (parseFloat(servingSize) || 0)) / 100).toFixed(1)}g
                    </Text>
                  </View>
                  <View style={styles.nutritionPreviewRow}>
                    <Text style={styles.nutritionPreviewItem}>
                      Carbs: {((selectedFood.carbs * (parseFloat(servingSize) || 0)) / 100).toFixed(1)}g
                    </Text>
                    <Text style={styles.nutritionPreviewItem}>
                      Fat: {((selectedFood.fat * (parseFloat(servingSize) || 0)) / 100).toFixed(1)}g
                    </Text>
                  </View>
                </View>

                {/* Buttons */}
                <View style={styles.modalButtons}>
                  <StyledButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setShowAddModal(false)}
                  />
                  <StyledButton title="Add" onPress={handleAddToDaily} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchButton: {
    width: 50,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  searchButtonText: {
    fontSize: Typography.fontSize.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  foodCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodHeader: {
    marginBottom: Spacing.xs,
  },
  foodName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  foodBrand: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
  },
  listContent: {
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalFoodName: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    textAlign: 'center',
  },
  modalFoodBrand: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  mealTypeTextActive: {
    color: Colors.background,
    fontWeight: 'bold',
  },
  servingInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  nutritionPreview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  nutritionPreviewTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  nutritionPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  nutritionPreviewItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
});