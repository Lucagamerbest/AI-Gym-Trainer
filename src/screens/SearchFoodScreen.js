import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function SearchFoodScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  
  const searchResults = [
    { id: 1, name: 'Grilled Salmon', calories: 206, protein: 22 },
    { id: 2, name: 'Chicken Breast', calories: 165, protein: 31 },
    { id: 3, name: 'Brown Rice', calories: 216, carbs: 45 },
    { id: 4, name: 'Greek Yogurt', calories: 100, protein: 17 },
  ];

  const recentFoods = ['Chicken Breast', 'Rice', 'Oatmeal'];

  const renderFoodItem = ({ item }) => (
    <StyledCard style={styles.foodCard}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <View style={styles.nutritionRow}>
          <Text style={styles.nutritionText}>{item.calories} cal</Text>
          {item.protein && (
            <Text style={styles.nutritionText}> • {item.protein}g protein</Text>
          )}
          {item.carbs && (
            <Text style={styles.nutritionText}> • {item.carbs}g carbs</Text>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    </StyledCard>
  );

  return (
    <ScreenLayout
      title="Search & Add"
      subtitle="Find foods from database"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={false}
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food or meal"
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {searchText === '' && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentLabel}>Recent searches</Text>
          <View style={styles.recentTags}>
            {recentFoods.map((food, index) => (
              <TouchableOpacity key={index} style={styles.recentTag}>
                <Text style={styles.recentTagText}>{food}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderFoodItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomActions}>
        <View style={styles.filterRow}>
          <StyledButton
            title="Filters"
            icon="⚙️"
            variant="ghost"
            size="sm"
            style={styles.filterButton}
            onPress={() => {}}
          />
          <StyledButton
            title="Sort By"
            icon="↕️"
            variant="ghost"
            size="sm"
            style={styles.filterButton}
            onPress={() => {}}
          />
        </View>
        
        <StyledButton
          title="Manually Add Food"
          icon="✏️"
          size="lg"
          fullWidth
          onPress={() => {}}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: Spacing.lg,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: Typography.fontSize.md,
  },
  recentContainer: {
    marginBottom: Spacing.lg,
  },
  recentLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentTag: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentTagText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  nutritionRow: {
    flexDirection: 'row',
  },
  nutritionText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    color: Colors.background,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  bottomActions: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
});