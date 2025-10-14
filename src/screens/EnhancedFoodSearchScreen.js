import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform
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
import {
  smartSearchFoods,
  updateSearchHistory,
  getSmartSuggestions,
  getRecentSearches,
  getTrendingFoods,
  COMMON_PORTIONS,
  analyzeSearchIntent
} from '../services/smartFoodSearch';

const { height: screenHeight } = Dimensions.get('window');

export default function EnhancedFoodSearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [bestMatch, setBestMatch] = useState(null);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState({});
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingFoods, setTrendingFoods] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [servingSize, setServingSize] = useState('100');
  const [selectedPortion, setSelectedPortion] = useState(null);
  const [mealType, setMealType] = useState('snack');
  const [activeTab, setActiveTab] = useState('all'); // all, branded, generic, myfoods
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allFoods, setAllFoods] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await initDatabase();
    loadRecentAndTrending();
  };

  const loadRecentAndTrending = async () => {
    const recent = await getRecentSearches(5);
    const trending = await getTrendingFoods();
    setRecentSearches(recent);
    setTrendingFoods(trending);
  };

  // Smart search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.length > 0) {
        performSmartSearch();
        loadSearchSuggestions();
      } else {
        // Clear search results and show recent/trending
        setBestMatch(null);
        setSuggestedMatches([]);
        setSearchResults([]);
        setCategories({});
        setSearchSuggestions([]);
        setOffset(0);
        loadRecentAndTrending();
      }
    }, 300); // 300ms debounce for smooth typing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSmartSearch = async () => {
    setIsLoading(true);
    try {
      // Get all available foods
      const localFoods = await searchFoods(searchQuery || '');

      // Apply smart search algorithm
      const smartResults = await smartSearchFoods(localFoods, searchQuery, {
        limit: 20,
        offset: 0,
        includeCategories: true,
        includeSuggestions: true
      });

      setBestMatch(smartResults.bestMatch);
      setSuggestedMatches(smartResults.suggested);
      setSearchResults(smartResults.all);
      setCategories(smartResults.categories);
      setHasMore(smartResults.hasMore);
      setOffset(smartResults.nextOffset);
      setAllFoods(localFoods); // Store for pagination

      // If few local results, fetch from API
      if (smartResults.totalResults < 10 && searchQuery.length > 2) {
        fetchFromAPI();
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromAPI = async () => {
    try {
      const apiResults = await foodAPI.searchFood(searchQuery);
      if (apiResults.length > 0) {
        // Save to database for future searches
        for (const food of apiResults.slice(0, 10)) {
          await saveFoodFromAPI(food);
        }
        // Re-run search to include new results
        performSmartSearch();
      }
    } catch (error) {
      // API search failed, continue with local results only
    }
  };

  const loadSearchSuggestions = async () => {
    const suggestions = await getSmartSuggestions(searchQuery);
    setSearchSuggestions(suggestions);
  };

  const loadMoreResults = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const moreResults = await smartSearchFoods(allFoods, searchQuery, {
        limit: 20,
        offset,
        includeCategories: false,
        includeSuggestions: false
      });

      setSearchResults([...searchResults, ...moreResults.all]);
      setOffset(moreResults.nextOffset);
      setHasMore(moreResults.hasMore);
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSelectFood = async (food) => {
    setSelectedFood(food);
    setShowQuickAdd(true);

    // Update search history for better future results
    await updateSearchHistory(food);
  };

  const handleQuickAdd = async (portion) => {
    if (!selectedFood) return;

    try {
      const quantity = portion.value;
      await addToDaily(selectedFood.id || selectedFood.barcode, quantity, mealType);

      Alert.alert(
        'Added!',
        `${selectedFood.name} (${quantity}g) added to ${mealType}`,
        [{ text: 'OK' }]
      );

      setShowQuickAdd(false);
      setSelectedFood(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleCustomAmount = () => {
    setShowQuickAdd(false);
    setShowAddModal(true);
  };

  const renderBestMatch = () => {
    if (!bestMatch) return null;

    return (
      <View style={styles.bestMatchContainer}>
        <Text style={styles.sectionTitle}>Best Match</Text>
        <TouchableOpacity
          style={styles.bestMatchCard}
          onPress={() => handleSelectFood(bestMatch)}
        >
          <View style={styles.bestMatchInfo}>
            <Text style={styles.bestMatchName}>{bestMatch.name}</Text>
            {bestMatch.brand && (
              <Text style={styles.bestMatchBrand}>{bestMatch.brand}</Text>
            )}
            <View style={styles.nutritionRow}>
              <Text style={styles.caloriesText}>{bestMatch.calories} cal</Text>
              <Text style={styles.macroText}>
                P: {bestMatch.protein}g | C: {bestMatch.carbs}g | F: {bestMatch.fat}g
              </Text>
            </View>
          </View>
          {bestMatch.imageUrl && (
            <Image source={{ uri: bestMatch.imageUrl }} style={styles.foodImage} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestedMatches = () => {
    if (suggestedMatches.length === 0) return null;

    return (
      <View style={styles.suggestedContainer}>
        <Text style={styles.sectionTitle}>Suggested</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={suggestedMatches}
          keyExtractor={(item, index) => `suggested-${item.id || item.barcode || index}`}
          renderItem={({ item: food }) => (
            <TouchableOpacity
              style={styles.suggestedCard}
              onPress={() => handleSelectFood(food)}
            >
              <Text style={styles.suggestedName} numberOfLines={2}>
                {food.name}
              </Text>
              <Text style={styles.suggestedCalories}>{food.calories} cal</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderSearchSuggestions = () => {
    if (searchSuggestions.length === 0 || searchQuery.length < 2) return null;

    return (
      <View style={styles.suggestionsDropdown}>
        {searchSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`suggestion-${suggestion.text}-${index}`}
            style={styles.suggestionItem}
            onPress={() => setSearchQuery(suggestion.text)}
          >
            <Text style={styles.suggestionText}>{suggestion.text}</Text>
            {suggestion.type === 'recent' && (
              <Text style={styles.suggestionType}>Recent</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
        {item.brand && (
          <Text style={styles.foodBrand} numberOfLines={1}>{item.brand}</Text>
        )}
        <View style={styles.nutritionInfo}>
          <Text style={styles.calories}>{item.calories || 0} cal</Text>
          {item.serving_size && (
            <Text style={styles.servingSize}>per {item.serving_size}</Text>
          )}
        </View>
      </View>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.foodThumbnail} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    const emptyStateData = [
      ...(recentSearches.length > 0 ? [{ type: 'header', title: 'Recent Searches' }] : []),
      ...recentSearches.map((item, index) => ({ ...item, type: 'recent', index })),
      { type: 'header', title: 'Trending Foods' },
      ...trendingFoods.map((item, index) => ({ ...item, type: 'trending', index }))
    ];

    return (
      <FlatList
        data={emptyStateData}
        keyExtractor={(item, index) => `empty-${item.type}-${item.name || item.title}-${index}`}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionTitle}>{item.title}</Text>;
          }
          if (item.type === 'recent') {
            return (
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => setSearchQuery(item.name)}
              >
                <Text style={styles.recentText}>{item.name}</Text>
                {item.brand && (
                  <Text style={styles.recentBrand}>{item.brand}</Text>
                )}
              </TouchableOpacity>
            );
          }
          if (item.type === 'trending') {
            return (
              <TouchableOpacity
                style={styles.trendingItem}
                onPress={() => setSearchQuery(item.name)}
              >
                <Text style={styles.trendingText}>{item.name}</Text>
                <Text style={styles.trendingTag}>#{item.trend}</Text>
              </TouchableOpacity>
            );
          }
          return null;
        }}
        contentContainerStyle={styles.emptyState}
      />
    );
  };

  const renderCategoryTabs = () => {
    const tabs = Object.keys(categories);
    if (tabs.length === 0) return null;

    const allTabs = ['all', ...tabs];

    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        data={allTabs}
        keyExtractor={(item) => `tab-${item}`}
        renderItem={({ item: tab }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };

  const getFilteredResults = () => {
    if (activeTab === 'all') return searchResults;
    return categories[activeTab] || [];
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods, brands, or scan barcode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Suggestions Dropdown */}
        {renderSearchSuggestions()}

        {/* Best Match */}
        {renderBestMatch()}

        {/* Suggested Matches */}
        {renderSuggestedMatches()}

        {/* Category Tabs */}
        {renderCategoryTabs()}

        {/* Search Results or Empty State */}
        {searchQuery.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={getFilteredResults()}
            renderItem={renderFoodItem}
            keyExtractor={(item, index) => `food-${item.id || item.barcode || item.name}-${index}`}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMoreResults}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              isLoadingMore && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )
            }
            ListEmptyComponent={() =>
              !isLoading && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No foods found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              )
            }
          />
        )}

        {/* Loading Indicator */}
        {isLoading && searchQuery.length > 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {/* Quick Add Modal */}
        <Modal
          visible={showQuickAdd}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowQuickAdd(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.quickAddModal}>
              <Text style={styles.modalTitle}>Quick Add</Text>
              <Text style={styles.modalFoodName}>{selectedFood?.name}</Text>

              <Text style={styles.portionTitle}>Select Portion:</Text>
              <ScrollView style={styles.portionList}>
                {COMMON_PORTIONS.generic.map((portion, index) => (
                  <TouchableOpacity
                    key={`portion-${portion.label}-${index}`}
                    style={styles.portionOption}
                    onPress={() => handleQuickAdd(portion)}
                  >
                    <Text style={styles.portionText}>{portion.label}</Text>
                    <Text style={styles.portionCalories}>
                      {Math.round((selectedFood?.calories || 0) * portion.value / 100)} cal
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={handleCustomAmount}
                >
                  <Text style={styles.customButtonText}>Custom Amount</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowQuickAdd(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Amount Modal */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add to Daily Log</Text>
              <Text style={styles.modalFoodName}>{selectedFood?.name}</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (grams):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={servingSize}
                  onChangeText={setServingSize}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>

              <View style={styles.mealTypeContainer}>
                <Text style={styles.inputLabel}>Meal:</Text>
                <View style={styles.mealTypeButtons}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                    <TouchableOpacity
                      key={meal}
                      style={[
                        styles.mealTypeButton,
                        mealType === meal && styles.mealTypeButtonActive
                      ]}
                      onPress={() => setMealType(meal)}
                    >
                      <Text
                        style={[
                          styles.mealTypeText,
                          mealType === meal && styles.mealTypeTextActive
                        ]}
                      >
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.nutritionSummary}>
                <Text style={styles.summaryTitle}>Nutrition for {servingSize}g:</Text>
                <Text style={styles.summaryText}>
                  Calories: {Math.round((selectedFood?.calories || 0) * servingSize / 100)}
                </Text>
                <Text style={styles.summaryText}>
                  Protein: {((selectedFood?.protein || 0) * servingSize / 100).toFixed(1)}g
                </Text>
                <Text style={styles.summaryText}>
                  Carbs: {((selectedFood?.carbs || 0) * servingSize / 100).toFixed(1)}g
                </Text>
                <Text style={styles.summaryText}>
                  Fat: {((selectedFood?.fat || 0) * servingSize / 100).toFixed(1)}g
                </Text>
              </View>

              <View style={styles.modalActions}>
                <StyledButton
                  title="Add"
                  onPress={() => {
                    addToDaily(
                      selectedFood.id || Date.now(),
                      parseFloat(servingSize) || 100,
                      mealType
                    ).then(() => {
                      Alert.alert('Success', 'Food added to daily log');
                      setShowAddModal(false);
                      setSelectedFood(null);
                      setServingSize('100');
                    });
                  }}
                  style={styles.addButton}
                />
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setSelectedFood(null);
                    setServingSize('100');
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    marginHorizontal: Spacing.medium,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.small,
  },
  clearText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 75,
    left: Spacing.medium,
    right: Spacing.medium,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 1000,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  suggestionType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
  },
  bestMatchContainer: {
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.small,
    marginTop: Spacing.medium,
    paddingHorizontal: Spacing.medium,
  },
  bestMatchCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bestMatchInfo: {
    flex: 1,
  },
  bestMatchName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bestMatchBrand: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  nutritionRow: {
    marginTop: Spacing.small,
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  macroText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.small,
    marginLeft: Spacing.medium,
  },
  suggestedContainer: {
    marginBottom: Spacing.medium,
    paddingLeft: 0,
  },
  suggestedCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.medium,
    padding: Spacing.medium,
    marginLeft: Spacing.medium,
    marginRight: Spacing.small,
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  suggestedName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  suggestedCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tabContainer: {
    flexGrow: 0,
    marginBottom: Spacing.small,
    paddingHorizontal: Spacing.medium,
  },
  tab: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    marginRight: Spacing.small,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: Spacing.medium,
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.small,
    borderRadius: BorderRadius.medium,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  nutritionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  servingSize: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
  },
  foodThumbnail: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.small,
    marginLeft: Spacing.medium,
  },
  listContent: {
    paddingBottom: Spacing.large,
  },
  loadingMore: {
    padding: Spacing.medium,
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  noResults: {
    alignItems: 'center',
    padding: Spacing.xlarge,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  recentSection: {
    marginBottom: Spacing.large,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.medium,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.small,
  },
  recentText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  recentBrand: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  trendingSection: {
    marginBottom: Spacing.large,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.small,
  },
  trendingText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  trendingTag: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  quickAddModal: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.large,
    maxHeight: screenHeight * 0.7,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.large,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  modalFoodName: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  portionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.medium,
  },
  portionList: {
    maxHeight: 250,
  },
  portionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  portionText: {
    fontSize: 15,
    color: Colors.text,
  },
  portionCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.large,
  },
  customButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.medium,
    borderRadius: BorderRadius.medium,
    marginRight: Spacing.small,
  },
  customButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.medium,
    borderRadius: BorderRadius.medium,
    marginLeft: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.medium,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.small,
    padding: Spacing.medium,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeContainer: {
    marginBottom: Spacing.large,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.small,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.background,
    marginHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: 14,
    color: Colors.text,
  },
  mealTypeTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  nutritionSummary: {
    backgroundColor: Colors.background,
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.large,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.small,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  modalActions: {
    marginTop: Spacing.medium,
  },
  addButton: {
    marginBottom: Spacing.small,
  },
});