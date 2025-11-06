/**
 * RecipeBrowser Component
 *
 * Browse and filter recipes from Spoonacular database
 * Features: Calorie/protein sliders, meal type tabs, sweet/salty toggle, dietary filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import StyledCard from './StyledCard';
import StyledButton from './StyledButton';
import FreeRecipeService from '../services/FreeRecipeService'; // FREE - No API key needed!

export default function RecipeBrowser({ onSelectRecipe, initialMealType = 'any' }) {
  // Filter state
  const [mealType, setMealType] = useState(initialMealType);
  const [minCalories, setMinCalories] = useState(0);
  const [maxCalories, setMaxCalories] = useState(1000);
  const [minProtein, setMinProtein] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [maxTime, setMaxTime] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [quickFilters, setQuickFilters] = useState([]);

  // Recipe state
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available filter options
  const mealTypes = [
    { value: 'any', label: 'All', icon: 'restaurant' },
    { value: 'breakfast', label: 'Breakfast', icon: 'sunny' },
    { value: 'lunch', label: 'Lunch', icon: 'fast-food' },
    { value: 'dinner', label: 'Dinner', icon: 'pizza' },
    { value: 'snack', label: 'Snacks', icon: 'ice-cream' },
  ];

  const flavorTags = [
    { value: 'sweet', label: 'Sweet', icon: 'ice-cream' },
    { value: 'salty', label: 'Salty', icon: 'nutrition' },
  ];

  const dietOptions = [
    { value: null, label: 'All' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular', icon: 'star' },
    { value: 'protein', label: 'Highest Protein', icon: 'fitness' },
    { value: 'quick', label: 'Quickest', icon: 'time' },
    { value: 'low-cal', label: 'Lowest Calorie', icon: 'trending-down' },
  ];

  const timeOptions = [
    { value: null, label: 'Any Time' },
    { value: 15, label: '< 15 min' },
    { value: 30, label: '< 30 min' },
    { value: 45, label: '< 45 min' },
    { value: 60, label: '< 1 hour' },
  ];

  // Set calorie range based on meal type
  useEffect(() => {
    const ranges = {
      breakfast: { min: 300, max: 600 },
      lunch: { min: 400, max: 700 },
      dinner: { min: 500, max: 800 },
      snack: { min: 100, max: 300 },
      any: { min: 0, max: 1000 },
    };

    const range = ranges[mealType] || ranges.any;
    setMinCalories(range.min);
    setMaxCalories(range.max);
  }, [mealType]);

  // Load recipes when filters change
  useEffect(() => {
    searchRecipes();
  }, [mealType, selectedDiet, maxTime]);

  const searchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await FreeRecipeService.searchRecipes({
        query: searchQuery,
        mealType: mealType === 'any' ? null : mealType,
        minCalories: minCalories > 0 ? minCalories : null,
        maxCalories: maxCalories < 1000 ? maxCalories : null,
        minProtein: minProtein > 0 ? minProtein : null,
        category: selectedDiet === 'vegetarian' ? 'Vegetarian' : null,
      });

      // Apply sorting
      const sorted = sortRecipes(results, sortBy);
      setRecipes(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load recipes. Check your internet connection.');
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortRecipes = (recipes, sortType) => {
    const sorted = [...recipes];

    switch (sortType) {
      case 'protein':
        return sorted.sort((a, b) => {
          const proteinA = a.nutrition?.protein || 0;
          const proteinB = b.nutrition?.protein || 0;
          return proteinB - proteinA; // Highest first
        });
      case 'quick':
        return sorted.sort((a, b) => {
          const timeA = a.readyInMinutes || 999;
          const timeB = b.readyInMinutes || 999;
          return timeA - timeB; // Quickest first
        });
      case 'low-cal':
        return sorted.sort((a, b) => {
          const calA = a.nutrition?.calories || 9999;
          const calB = b.nutrition?.calories || 9999;
          return calA - calB; // Lowest first
        });
      case 'popular':
      default:
        // Featured meals first, then curated, then by name
        return sorted.sort((a, b) => {
          // Featured meals come first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // Then curated over API
          if (a.source === 'curated' && b.source !== 'curated') return -1;
          if (a.source !== 'curated' && b.source === 'curated') return 1;
          return a.name.localeCompare(b.name);
        });
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const renderMealTypeTabs = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabsWrapper}>
        {mealTypes.map(type => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.tab,
              mealType === type.value && styles.tabActive
            ]}
            onPress={() => setMealType(type.value)}
          >
            <Ionicons
              name={type.icon}
              size={16}
              color={mealType === type.value ? Colors.primary : Colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              mealType === type.value && styles.tabTextActive
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersContainer}>
        {/* Calorie Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>
            Calories: {minCalories} - {maxCalories} cal
          </Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderSubLabel}>Min</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1000}
              step={50}
              value={minCalories}
              onValueChange={(value) => {
                setMinCalories(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onSlidingComplete={searchRecipes}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
            />
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderSubLabel}>Max</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1000}
              step={50}
              value={maxCalories}
              onValueChange={(value) => {
                setMaxCalories(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onSlidingComplete={searchRecipes}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
            />
          </View>
        </View>

        {/* Protein Minimum */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>
            Minimum Protein: {minProtein}g
          </Text>
          <Slider
            style={styles.sliderFull}
            minimumValue={0}
            maximumValue={100}
            step={5}
            value={minProtein}
            onValueChange={(value) => {
              setMinProtein(value);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onSlidingComplete={searchRecipes}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
          />
        </View>

        {/* Flavor Tags */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Flavor</Text>
          <View style={styles.tagRow}>
            {flavorTags.map(tag => (
              <TouchableOpacity
                key={tag.value}
                style={[
                  styles.filterTag,
                  selectedTags.includes(tag.value) && styles.filterTagActive
                ]}
                onPress={() => toggleTag(tag.value)}
              >
                <Ionicons
                  name={tag.icon}
                  size={16}
                  color={selectedTags.includes(tag.value) ? '#FFF' : Colors.textSecondary}
                />
                <Text style={[
                  styles.filterTagText,
                  selectedTags.includes(tag.value) && styles.filterTagTextActive
                ]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Diet Options */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Diet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dietOptions.map(option => (
              <TouchableOpacity
                key={option.value || 'any'}
                style={[
                  styles.filterTag,
                  selectedDiet === option.value && styles.filterTagActive
                ]}
                onPress={() => setSelectedDiet(option.value)}
              >
                <Text style={[
                  styles.filterTagText,
                  selectedDiet === option.value && styles.filterTagTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Cooking Time */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Max Cooking Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeOptions.map(option => (
              <TouchableOpacity
                key={option.value || 'any'}
                style={[
                  styles.filterTag,
                  maxTime === option.value && styles.filterTagActive
                ]}
                onPress={() => setMaxTime(option.value)}
              >
                <Text style={[
                  styles.filterTagText,
                  maxTime === option.value && styles.filterTagTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Apply Filters Button */}
        <StyledButton
          title="Apply Filters"
          onPress={() => {
            searchRecipes();
            setShowFilters(false); // Close the filter panel
          }}
          style={styles.applyButton}
        />
      </View>
    );
  };

  const renderRecipeCard = ({ item }) => (
    <StyledCard style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.name}</Text>
          <Text style={styles.ingredientCount}>
            {item.ingredients?.length || 0} ingredients
          </Text>
        </View>
        <View style={styles.nutritionSummary}>
          <Text style={styles.caloriesText}>
            {item.nutrition.calories} cal
          </Text>
          <Text style={styles.macroText}>
            P: {item.nutrition.protein}g
          </Text>
          <Text style={styles.macroText}>
            C: {item.nutrition.carbs}g
          </Text>
          <Text style={styles.macroText}>
            F: {item.nutrition.fat}g
          </Text>
        </View>
      </View>
      <View style={styles.recipeActions}>
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={() => onSelectRecipe(item)}
        >
          <Text style={styles.quickAddText}>View Recipe</Text>
        </TouchableOpacity>
      </View>
    </StyledCard>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchRecipes}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? "close" : "options"}
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Meal Type Tabs */}
      {renderMealTypeTabs()}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <View style={styles.sortWrapper}>
          {sortOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortChip,
                sortBy === option.value && styles.sortChipActive
              ]}
              onPress={() => {
                const newSortBy = option.value;
                setSortBy(newSortBy);
                // Re-sort existing recipes immediately
                const sorted = sortRecipes(recipes, newSortBy);
                setRecipes(sorted);
              }}
            >
              <Ionicons
                name={option.icon}
                size={14}
                color={sortBy === option.value ? Colors.background : Colors.textSecondary}
              />
              <Text style={[
                styles.sortChipText,
                sortBy === option.value && styles.sortChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filters Panel */}
      {renderFilters()}

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <StyledButton title="Retry" onPress={searchRecipes} />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No recipes found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.recipeList}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No background - inherits from ScreenLayout parent
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.small,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tabsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sortContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sortWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '48%',
    justifyContent: 'center',
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortChipText: {
    marginLeft: 6,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
  filtersContainer: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderSubLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.textSecondary,
    width: 40,
  },
  slider: {
    flex: 1,
  },
  sliderFull: {
    width: '100%',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  filterTagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTagText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  filterTagTextActive: {
    color: Colors.background,
    fontWeight: '700',
  },
  applyButton: {
    marginTop: Spacing.small,
  },
  recipeList: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  recipeCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  ingredientCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  nutritionSummary: {
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 90,
  },
  caloriesText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  macroText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  recipeActions: {
    gap: Spacing.md,
  },
  quickAddButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: Typography.fontSize.md,
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.large,
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: Typography.sizes.medium,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.medium,
    marginBottom: Spacing.medium,
    fontSize: Typography.sizes.medium,
    color: Colors.error,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: Spacing.medium,
    fontSize: Typography.sizes.large,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtext: {
    marginTop: Spacing.tiny,
    fontSize: Typography.sizes.small,
    color: Colors.textSecondary,
  },
});
