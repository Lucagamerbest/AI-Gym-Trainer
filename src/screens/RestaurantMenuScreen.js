/**
 * Restaurant Menu Screen
 *
 * Browse fast food chain menus and add items to nutrition tracking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import restaurantData from '../data/restaurantDatabase.json';

const RestaurantMenuScreen = ({ navigation, route }) => {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuSearchQuery, setMenuSearchQuery] = useState(''); // Search within restaurant menu
  const [imageErrors, setImageErrors] = useState({});

  // Multi-select tray state
  const [trayItems, setTrayItems] = useState([]);
  const [showTrayModal, setShowTrayModal] = useState(false);

  // If coming from search with a specific restaurant
  useEffect(() => {
    if (route.params?.restaurantId) {
      const restaurant = restaurantData.restaurants.find(
        r => r.id === route.params.restaurantId
      );
      if (restaurant) {
        setSelectedRestaurant(restaurant);
      }
    }
  }, [route.params?.restaurantId]);

  // Filter restaurants based on search
  const filteredRestaurants = restaurantData.restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get menu items for selected restaurant
  const getMenuItems = () => {
    if (!selectedRestaurant) return [];

    let items = selectedRestaurant.menu;

    // Filter by category
    if (selectedCategory) {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (menuSearchQuery.trim()) {
      const query = menuSearchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      );
    }

    return items;
  };

  // Calculate tray totals
  const trayTotals = useMemo(() => {
    return trayItems.reduce((acc, item) => ({
      calories: acc.calories + (item.calories * item.quantity),
      protein: acc.protein + (item.protein * item.quantity),
      carbs: acc.carbs + (item.carbs * item.quantity),
      fat: acc.fat + (item.fat * item.quantity),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [trayItems]);

  // Check if an item is in the tray
  const getItemInTray = (item) => {
    return trayItems.find(t => t.name === item.name);
  };

  // Add item to tray or increase quantity
  const addToTray = (item) => {
    const existingItem = getItemInTray(item);
    if (existingItem) {
      setTrayItems(prev => prev.map(t =>
        t.name === item.name ? { ...t, quantity: t.quantity + 1 } : t
      ));
    } else {
      setTrayItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  // Remove item from tray or decrease quantity
  const removeFromTray = (item) => {
    const existingItem = getItemInTray(item);
    if (existingItem && existingItem.quantity > 1) {
      setTrayItems(prev => prev.map(t =>
        t.name === item.name ? { ...t, quantity: t.quantity - 1 } : t
      ));
    } else {
      setTrayItems(prev => prev.filter(t => t.name !== item.name));
    }
  };

  // Update item quantity directly
  const updateTrayItemQuantity = (itemName, quantity) => {
    if (quantity <= 0) {
      setTrayItems(prev => prev.filter(t => t.name !== itemName));
    } else {
      setTrayItems(prev => prev.map(t =>
        t.name === itemName ? { ...t, quantity } : t
      ));
    }
  };

  // Clear the entire tray
  const clearTray = () => {
    setTrayItems([]);
  };

  // Handle tapping a menu item - add to tray
  const handleSelectItem = (item) => {
    addToTray(item);
  };

  // Handle adding all tray items to the meal log
  const handleAddAllToLog = () => {
    if (trayItems.length === 0) return;

    const mealType = route.params?.mealType || 'lunch';
    const isPlannedMeal = route.params?.isPlannedMeal;
    const plannedDateKey = route.params?.plannedDateKey;

    // Convert tray items to food format
    const foodItems = trayItems.map(item => ({
      name: item.name,
      calories: Math.round(item.calories * item.quantity),
      protein: Math.round(item.protein * item.quantity * 10) / 10,
      carbs: Math.round(item.carbs * item.quantity * 10) / 10,
      fat: Math.round(item.fat * item.quantity * 10) / 10,
      mealType: mealType,
      quantity: item.quantity,
      serving: item.serving,
      restaurant: selectedRestaurant?.name,
    }));

    // Close modal and clear tray
    setShowTrayModal(false);
    setTrayItems([]);

    // Navigate back with multiple food items
    if (isPlannedMeal) {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Nutrition' },
          {
            name: 'MealsHistory',
            params: {
              addedPlannedFoods: foodItems.map(food => ({
                plannedDateKey: plannedDateKey,
                mealType: mealType,
                foodItem: food,
              })),
            }
          }
        ],
      });
    } else {
      // Reset navigation stack to prevent swiping back to restaurant menu
      // Keep Main (Home) in stack so user can go back normally
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Main' },
          {
            name: 'Nutrition',
            params: {
              addedFoods: foodItems,
              fromFoodAdd: true
            }
          }
        ],
      });
    }
  };

  // Navigate to single item detail (info only - no add button)
  const handleItemDetail = (item) => {
    const foodItem = {
      id: `${selectedRestaurant.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: item.name,
      brand: selectedRestaurant.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      serving_size: item.serving,
      serving_quantity: 1,
      category: item.category,
      source: 'restaurant',
      restaurant_id: selectedRestaurant.id,
      restaurant_name: selectedRestaurant.name,
      restaurant_logo: selectedRestaurant.logo,
      restaurant_color: selectedRestaurant.color,
    };

    navigation.navigate('FoodDetail', {
      food: foodItem,
      infoOnly: true, // Info view only - no serving selector or add button
      mealType: route.params?.mealType,
      isPlannedMeal: route.params?.isPlannedMeal,
      plannedDateKey: route.params?.plannedDateKey,
    });
  };

  // Render restaurant grid item
  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.restaurantCard, { borderColor: item.color + '40' }]}
      onPress={() => {
        setSelectedRestaurant(item);
        setSelectedCategory(null);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.logoContainer, { backgroundColor: item.color + '15' }]}>
        {!imageErrors[item.id] ? (
          <Image
            source={{ uri: item.logo }}
            style={styles.restaurantLogo}
            resizeMode="contain"
            onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
          />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: item.color }]}>
            <Text style={styles.logoPlaceholderText}>
              {item.name.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.restaurantName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.menuCount}>{item.menu.length} items</Text>
    </TouchableOpacity>
  );

  // Render menu item
  const renderMenuItem = ({ item }) => {
    const trayItem = getItemInTray(item);
    const isInTray = !!trayItem;

    return (
      <View
        style={[
          styles.menuItem,
          isInTray && styles.menuItemSelected,
          isInTray && { borderColor: selectedRestaurant?.color || Colors.primary }
        ]}
      >
        {/* Info button for food details */}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => handleItemDetail(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="information-circle-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItemTouchable}
          onPress={() => handleSelectItem(item)}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemName}>
              {item.name}
              {isInTray && trayItem.quantity > 1 && (
                <Text style={{ color: selectedRestaurant?.color || Colors.primary }}> x{trayItem.quantity}</Text>
              )}
            </Text>
            <Text style={styles.menuItemServing}>{item.serving}</Text>

            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, isInTray && { color: selectedRestaurant?.color || Colors.primary }]}>
                  {isInTray ? Math.round(item.calories * trayItem.quantity) : item.calories}
                </Text>
                <Text style={styles.macroLabel}>cal</Text>
              </View>
              <View style={[styles.macroItem, styles.proteinMacro]}>
                <Text style={[styles.macroValue, { color: '#EF4444' }]}>
                  {isInTray ? Math.round(item.protein * trayItem.quantity) : item.protein}g
                </Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={[styles.macroItem, styles.carbsMacro]}>
                <Text style={[styles.macroValue, { color: '#3B82F6' }]}>
                  {isInTray ? Math.round(item.carbs * trayItem.quantity) : item.carbs}g
                </Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={[styles.macroItem, styles.fatMacro]}>
                <Text style={[styles.macroValue, { color: '#F59E0B' }]}>
                  {isInTray ? Math.round(item.fat * trayItem.quantity) : item.fat}g
                </Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quantity controls or add button */}
        {isInTray ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: Colors.border }]}
              onPress={() => removeFromTray(item)}
            >
              <Ionicons name="remove" size={18} color={Colors.text} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: selectedRestaurant?.color || Colors.primary }]}>
              {trayItem.quantity}
            </Text>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: selectedRestaurant?.color || Colors.primary }]}
              onPress={() => addToTray(item)}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleSelectItem(item)}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Restaurant detail view
  if (selectedRestaurant) {
    return (
      <ScreenLayout
        title={selectedRestaurant.name}
        scrollable={true}
        headerLeft={
          <TouchableOpacity
            onPress={() => {
              setSelectedRestaurant(null);
              setMenuSearchQuery(''); // Clear menu search when going back
              setSelectedCategory(null); // Clear category filter
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        }
      >
        {/* Restaurant Header */}
        <View style={[styles.restaurantHeader, { backgroundColor: selectedRestaurant.color + '15' }]}>
          {!imageErrors[selectedRestaurant.id] ? (
            <Image
              source={{ uri: selectedRestaurant.logo }}
              style={styles.headerLogo}
              resizeMode="contain"
              onError={() => setImageErrors(prev => ({ ...prev, [selectedRestaurant.id]: true }))}
            />
          ) : (
            <View style={[styles.headerLogoPlaceholder, { backgroundColor: selectedRestaurant.color }]}>
              <Text style={styles.headerLogoText}>{selectedRestaurant.name.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{selectedRestaurant.name}</Text>
          <Text style={styles.headerSubtitle}>{selectedRestaurant.menu.length} menu items</Text>
        </View>

        {/* Menu Search Bar */}
        <View style={[styles.menuSearchContainer, { borderColor: selectedRestaurant.color + '40' }]}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.menuSearchInput}
            placeholder={`Search ${selectedRestaurant.name} menu...`}
            placeholderTextColor={Colors.textSecondary}
            value={menuSearchQuery}
            onChangeText={setMenuSearchQuery}
          />
          {menuSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setMenuSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary Bar (at top) */}
        {trayItems.length > 0 && (
          <TouchableOpacity
            style={[styles.trayBarTop, { backgroundColor: selectedRestaurant.color }]}
            onPress={() => setShowTrayModal(true)}
            activeOpacity={0.9}
          >
            <View style={styles.trayBarLeft}>
              <View style={styles.trayBadge}>
                <Text style={styles.trayBadgeText}>{trayItems.reduce((sum, i) => sum + i.quantity, 0)}</Text>
              </View>
              <View>
                <Text style={styles.trayBarTitle}>Your Order</Text>
                <Text style={styles.trayBarSubtitle}>
                  {Math.round(trayTotals.protein)}g P • {Math.round(trayTotals.carbs)}g C • {Math.round(trayTotals.fat)}g F
                </Text>
              </View>
            </View>
            <View style={styles.trayBarRight}>
              <Text style={styles.trayBarCalories}>{Math.round(trayTotals.calories)} cal</Text>
              <Ionicons name="chevron-down" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
              !selectedCategory && { backgroundColor: selectedRestaurant.color }
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && styles.categoryTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {selectedRestaurant.categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
                selectedCategory === cat && { backgroundColor: selectedRestaurant.color }
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {getMenuItems().length > 0 ? (
            getMenuItems().map((item, index) => (
              <View key={`${item.name}-${index}`}>
                {renderMenuItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyMenuContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyMenuText}>
                {menuSearchQuery ? `No items matching "${menuSearchQuery}"` : 'No items in this category'}
              </Text>
              {menuSearchQuery && (
                <TouchableOpacity
                  style={[styles.clearSearchButton, { borderColor: selectedRestaurant.color }]}
                  onPress={() => setMenuSearchQuery('')}
                >
                  <Text style={[styles.clearSearchText, { color: selectedRestaurant.color }]}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tray Review Modal */}
        <Modal
          visible={showTrayModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTrayModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { backgroundColor: selectedRestaurant.color }]}>
                <Text style={styles.modalTitle}>Your Order</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowTrayModal(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Tray Items List */}
              <ScrollView style={styles.trayItemsList}>
                {trayItems.map((item, index) => (
                  <View key={`tray-${item.name}-${index}`} style={styles.trayItem}>
                    <View style={styles.trayItemInfo}>
                      <Text style={[styles.trayItemName, { color: Colors.text }]}>{item.name}</Text>
                      <Text style={[styles.trayItemServing, { color: Colors.textSecondary }]}>{item.serving}</Text>
                      <Text style={[styles.trayItemCals, { color: selectedRestaurant.color }]}>
                        {Math.round(item.calories * item.quantity)} cal
                      </Text>
                    </View>
                    <View style={styles.trayItemControls}>
                      <TouchableOpacity
                        style={[styles.trayControlButton, { backgroundColor: Colors.border }]}
                        onPress={() => removeFromTray(item)}
                      >
                        <Ionicons name="remove" size={20} color={Colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.trayItemQuantity, { color: Colors.text }]}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.trayControlButton, { backgroundColor: selectedRestaurant.color }]}
                        onPress={() => addToTray(item)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Totals Summary */}
              <View style={[styles.totalsSummary, { borderTopColor: Colors.border }]}>
                <View style={styles.totalsRow}>
                  <Text style={[styles.totalsLabel, { color: Colors.textSecondary }]}>Total Calories</Text>
                  <Text style={[styles.totalsValue, { color: Colors.text }]}>{Math.round(trayTotals.calories)}</Text>
                </View>
                <View style={styles.macrosSummary}>
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryValue, { color: '#EF4444' }]}>{Math.round(trayTotals.protein)}g</Text>
                    <Text style={[styles.macroSummaryLabel, { color: Colors.textSecondary }]}>protein</Text>
                  </View>
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryValue, { color: '#3B82F6' }]}>{Math.round(trayTotals.carbs)}g</Text>
                    <Text style={[styles.macroSummaryLabel, { color: Colors.textSecondary }]}>carbs</Text>
                  </View>
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryValue, { color: '#F59E0B' }]}>{Math.round(trayTotals.fat)}g</Text>
                    <Text style={[styles.macroSummaryLabel, { color: Colors.textSecondary }]}>fat</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.clearButton, { borderColor: Colors.border }]}
                  onPress={() => {
                    clearTray();
                    setShowTrayModal(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
                  <Text style={[styles.clearButtonText, { color: Colors.textSecondary }]}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addAllButton, { backgroundColor: selectedRestaurant.color }]}
                  onPress={handleAddAllToLog}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.addAllButtonText}>Add to Meal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScreenLayout>
    );
  }

  // Restaurant grid view
  return (
    <ScreenLayout
      title="Fast Food Menus"
      scrollable={false}
      headerLeft={
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      }
    >
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Restaurant Grid */}
      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No restaurants found</Text>
          </View>
        }
      />
    </ScreenLayout>
  );
};

const createStyles = (Colors) => StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },

  // Grid
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },

  // Restaurant Card
  restaurantCard: {
    width: '31%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  restaurantLogo: {
    width: 50,
    height: 50,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  restaurantName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  menuCount: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Restaurant Header
  restaurantHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 16,
  },

  // Menu Search Bar
  menuSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  menuSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  headerLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  headerLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Categories
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Menu Items
  menuList: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  menuItemSelected: {
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
  menuItemTouchable: {
    flex: 1,
  },
  menuItemContent: {
    flex: 1,
  },
  infoButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    padding: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    marginLeft: 28,
  },
  menuItemServing: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 28,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 28,
  },
  macroItem: {
    alignItems: 'flex-start',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  macroLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  // Quantity Controls (on menu item)
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  // Order Summary Bar (at top)
  trayBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  trayBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trayBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  trayBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  trayBarSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  trayBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trayBarCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tray Items List
  trayItemsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 300,
  },
  trayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trayItemInfo: {
    flex: 1,
  },
  trayItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trayItemServing: {
    fontSize: 12,
    marginBottom: 4,
  },
  trayItemCals: {
    fontSize: 14,
    fontWeight: '600',
  },
  trayItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trayControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trayItemQuantity: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  // Totals Summary
  totalsSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  macrosSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroSummaryItem: {
    alignItems: 'center',
  },
  macroSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  macroSummaryLabel: {
    fontSize: 12,
  },

  // Modal Action Buttons
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addAllButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },

  // Empty menu search state
  emptyMenuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyMenuText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RestaurantMenuScreen;
