import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { searchFoods, initDatabase } from '../services/foodDatabaseService';

export default function FoodSearchScreen({ navigation }) {
  // State for search
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs for debouncing
  const searchTimer = useRef(null);
  const searchInput = useRef(null);

  // Initialize database on mount
  useEffect(() => {
    console.log('[FoodSearch] Component mounted');
    initDatabase().then(() => {
      console.log('[FoodSearch] Database initialized');
    });

    // Cleanup
    return () => {
      console.log('[FoodSearch] Component unmounting, clearing timer');
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  // Perform the actual search
  const doSearch = async (query) => {
    console.log(`[SimpleSearch] Performing search for: "${query}"`);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchResults = await searchFoods(query);
      console.log(`[SimpleSearch] Found ${searchResults.length} results`);
      setResults(searchResults.slice(0, 20)); // Limit to 20 results
    } catch (error) {
      console.error('[SimpleSearch] Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle text input changes with debouncing
  const handleTextChange = (text) => {
    console.log(`[SimpleSearch] Text changed to: "${text}" at ${Date.now()}`);
    setSearchText(text);

    // Clear existing timer
    if (searchTimer.current) {
      console.log('[FoodSearch] Clearing existing timer');
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    // Don't search if text is empty
    if (text.trim() === '') {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Set new timer for debounced search
    console.log('[FoodSearch] Setting new timer (800ms)');
    searchTimer.current = setTimeout(() => {
      console.log('[FoodSearch] Timer fired, initiating search');
      doSearch(text.trim());
    }, 800);
  };

  // Handle immediate search (when search button is pressed)
  const handleSearchPress = () => {
    console.log('[FoodSearch] Search button pressed');

    // Clear any pending timer
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
      searchTimer.current = null;
    }

    // Perform search immediately
    if (searchText.trim()) {
      doSearch(searchText.trim());
    }
  };

  // Handle food item selection
  const handleFoodPress = (food) => {
    console.log(`[SimpleSearch] Selected food: ${food.name}`);
    // Navigate back or handle selection as needed
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Food Search</Text>
      </View>

      {/* Search Input Area - NOT in ScrollView */}
      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={searchInput}
            style={styles.input}
            placeholder="Type to search foods..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={handleTextChange}
            autoFocus={true}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={handleSearchPress}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchPress}
            disabled={!searchText.trim()}
          >
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Text: "{searchText}" |
            Searching: {isSearching ? 'Yes' : 'No'} |
            Results: {results.length}
          </Text>
        </View>
      </View>

      {/* Results Area - In ScrollView */}
      <ScrollView
        style={styles.resultsContainer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.resultsContent}
      >
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No results found for "{searchText}"</Text>
          </View>
        )}

        {!isSearching && results.length > 0 && (
          <View>
            <Text style={styles.resultsTitle}>
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </Text>
            {results.map((food, index) => (
              <TouchableOpacity
                key={`${food.id}-${index}`}
                style={styles.foodItem}
                onPress={() => handleFoodPress(food)}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodCategory}>
                    {food.category || 'General'} • {food.calories} cal/100g
                  </Text>
                </View>
                <View style={styles.macros}>
                  <Text style={styles.macroText}>P: {food.protein}g</Text>
                  <Text style={styles.macroText}>C: {food.carbs}g</Text>
                  <Text style={styles.macroText}>F: {food.fat}g</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!hasSearched && !isSearching && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to use:</Text>
            <Text style={styles.instructionsText}>
              1. Type in the search box above{'\n'}
              2. Wait for automatic search after you stop typing{'\n'}
              3. Or tap the search button for immediate search{'\n'}
              4. Tap any food to select it
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 45,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  searchButton: {
    width: 45,
    height: 45,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  searchButtonText: {
    fontSize: 20,
  },
  debugInfo: {
    marginTop: Spacing.sm,
    padding: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  debugText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noResultsText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  resultsTitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  foodItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  foodInfo: {
    marginBottom: Spacing.sm,
  },
  foodName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  foodCategory: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  macroText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  instructionsContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  instructionsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});