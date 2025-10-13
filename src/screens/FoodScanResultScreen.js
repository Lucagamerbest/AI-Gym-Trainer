import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import NutriScoreModal from '../components/NutriScoreModal';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { saveFoodFromAPI, addToDaily, initDatabase } from '../services/foodDatabaseService';

const SCAN_HISTORY_KEY = '@food_scan_history';
const DAILY_NUTRITION_KEY = '@daily_nutrition';
const MEAL_PLANS_KEY = '@meal_plans';

export default function FoodScanResultScreen({ navigation, route }) {
  const { productData, barcode, barcodePhotoUri } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const [servingSize, setServingSize] = useState('100');
  const [isEditingServing, setIsEditingServing] = useState(false);
  const [showNutriScoreModal, setShowNutriScoreModal] = useState(false);
  const [showBarcodePhoto, setShowBarcodePhoto] = useState(false);

  // Auto-detect if product is liquid based on common indicators
  const isLiquid = productData.name?.toLowerCase().includes('drink') ||
                   productData.name?.toLowerCase().includes('juice') ||
                   productData.name?.toLowerCase().includes('milk') ||
                   productData.name?.toLowerCase().includes('water') ||
                   productData.name?.toLowerCase().includes('soda') ||
                   productData.name?.toLowerCase().includes('cola') ||
                   productData.name?.toLowerCase().includes('coffee') ||
                   productData.name?.toLowerCase().includes('tea') ||
                   productData.name?.toLowerCase().includes('beverage') ||
                   false;

  // Calculate nutrition values based on serving size
  const calculateNutrition = (baseValue) => {
    const size = servingSize === '' ? 0 : parseFloat(servingSize);
    const multiplier = size / 100;
    return (baseValue * multiplier).toFixed(1);
  };

  const calculateCalories = () => {
    const size = servingSize === '' ? 0 : parseFloat(servingSize);
    const multiplier = size / 100;
    return Math.round(productData.nutrition.calories * multiplier);
  };

  const handleAddToHistory = async () => {
    setIsSaving(true);
    try {
      // Initialize database first
      await initDatabase();

      // Save food to database
      const foodId = await saveFoodFromAPI(productData);

      // Add to daily consumption with the serving size
      const size = servingSize === '' ? 0 : parseFloat(servingSize);
      await addToDaily(foodId, size, 'snack');

      // Also keep in AsyncStorage for backward compatibility
      const historyData = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];
      const multiplier = size / 100;
      const newScan = {
        id: Date.now().toString(),
        name: productData.name,
        brand: productData.brand,
        image: productData.imageUrl,
        barcodePhotoUri: barcodePhotoUri,
        calories: Math.round(productData.nutrition.calories * multiplier),
        protein: parseFloat((productData.nutrition.protein * multiplier).toFixed(1)),
        carbs: parseFloat((productData.nutrition.carbs * multiplier).toFixed(1)),
        fats: parseFloat((productData.nutrition.fat * multiplier).toFixed(1)),
        servingSize: `${servingSize}g`,
        barcode: barcode,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newScan, ...history.slice(0, 19)];
      await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));

      // IMPORTANT: Also update @daily_nutrition for NutritionScreen
      const dailyNutritionData = await AsyncStorage.getItem(DAILY_NUTRITION_KEY);
      const dailyNutrition = dailyNutritionData ? JSON.parse(dailyNutritionData) : {
        consumed: 0,
        consumedMacros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        plannedMeals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        consumedPlannedMeals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        selectedMeal: 'breakfast',
        lastUpdated: new Date().toISOString()
      };

      // Add to snacks
      const foodForNutrition = {
        name: productData.name,
        calories: Math.round(productData.nutrition.calories * multiplier),
        protein: parseFloat((productData.nutrition.protein * multiplier).toFixed(1)),
        carbs: parseFloat((productData.nutrition.carbs * multiplier).toFixed(1)),
        fat: parseFloat((productData.nutrition.fat * multiplier).toFixed(1)),
      };

      dailyNutrition.meals.snacks = dailyNutrition.meals.snacks || [];
      dailyNutrition.meals.snacks.push(foodForNutrition);
      dailyNutrition.consumed = (dailyNutrition.consumed || 0) + foodForNutrition.calories;
      dailyNutrition.consumedMacros.proteinGrams += foodForNutrition.protein;
      dailyNutrition.consumedMacros.carbsGrams += foodForNutrition.carbs;
      dailyNutrition.consumedMacros.fatGrams += foodForNutrition.fat;
      dailyNutrition.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(DAILY_NUTRITION_KEY, JSON.stringify(dailyNutrition));

      // Also sync to meal plans calendar
      const today = new Date().toISOString().split('T')[0];
      const savedPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
      const mealPlans = savedPlans ? JSON.parse(savedPlans) : {};
      mealPlans[today] = {
        ...mealPlans[today],
        logged: dailyNutrition.meals
      };
      await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));

      Alert.alert(
        'Success',
        `Added ${servingSize}g of ${productData.name} to your daily intake!`,
        [
          {
            text: 'Scan Another',
            onPress: () => navigation.navigate('Camera', { returnScreen: 'FoodScanning' })
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Nutrition'),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error adding to history:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScanAnother = () => {
    navigation.navigate('Camera', {
      returnScreen: 'FoodScanning',
    });
  };

  const getNutrientColor = (type) => {
    switch (type) {
      case 'protein':
        return Colors.primary;
      case 'carbs':
        return Colors.warning;
      case 'fat':
        return Colors.success;
      case 'fiber':
        return '#8B4513';
      case 'sugar':
        return '#FF69B4';
      case 'sodium':
        return '#FFA500';
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <ScreenLayout
      title="Scanned Item"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image and Basic Info - Compact */}
        <StyledCard style={styles.productCard}>
          {productData.imageUrl && (
            <TouchableOpacity
              onPress={() => barcodePhotoUri && setShowBarcodePhoto(true)}
              activeOpacity={barcodePhotoUri ? 0.7 : 1}
            >
              <Image
                source={{ uri: productData.imageUrl }}
                style={styles.productImage}
                resizeMode="contain"
              />
              {barcodePhotoUri && (
                <View style={styles.tapHintContainer}>
                  <Text style={styles.tapHintText}>📷 Tap to see scan</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{productData.name}</Text>
            {productData.brand && (
              <Text style={styles.productBrand} numberOfLines={1}>{productData.brand}</Text>
            )}
            {productData.nutritionGrade && (
              <View style={styles.gradeContainer}>
                <TouchableOpacity
                  onPress={() => setShowNutriScoreModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.nutriScoreBadge, styles[`nutriScore${productData.nutritionGrade.toUpperCase()}`]]}>
                    <Text style={styles.nutriScoreLabel}>Nutri-Score</Text>
                    <Text style={styles.nutriScoreGrade}>{productData.nutritionGrade.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </StyledCard>

        {/* Serving Size Adjuster */}
        <StyledCard style={styles.servingCard}>
          <Text style={styles.servingTitle}>Adjust Serving Size</Text>
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServingSize('50')}
            >
              <Text style={styles.servingButtonText}>50{isLiquid ? 'ml' : 'g'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServingSize('100')}
            >
              <Text style={styles.servingButtonText}>100{isLiquid ? 'ml' : 'g'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServingSize('150')}
            >
              <Text style={styles.servingButtonText}>150{isLiquid ? 'ml' : 'g'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServingSize(isLiquid ? '250' : '200')}
            >
              <Text style={styles.servingButtonText}>{isLiquid ? '250ml' : '200g'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.customServingContainer}>
            <TextInput
              style={styles.servingInput}
              value={servingSize}
              onChangeText={(text) => {
                // Only allow numbers
                const numericValue = text.replace(/[^0-9]/g, '');
                // Allow empty string for user to type new value
                if (numericValue === '') {
                  setServingSize('');
                } else {
                  // Remove leading zeros (except for just "0")
                  const withoutLeadingZeros = numericValue.replace(/^0+/, '') || '0';
                  setServingSize(withoutLeadingZeros);
                }
              }}
              keyboardType="numeric"
              placeholder="100"
              maxLength={4}
            />
            <Text style={styles.servingUnit}>{isLiquid ? 'milliliters' : 'grams'}</Text>
          </View>
        </StyledCard>

        {/* Calories and Macros Display */}
        <StyledCard style={styles.caloriesCard}>
          <Text style={styles.caloriesLabel}>Nutrition for {servingSize}{isLiquid ? 'ml' : 'g'}</Text>
          <Text style={styles.caloriesValue}>
            {calculateCalories()}
          </Text>
          <Text style={styles.caloriesUnit}>calories</Text>

          <View style={styles.quickMacrosContainer}>
            <View style={[styles.quickMacroItem, styles.proteinItem]}>
              <View style={styles.macroCircle}>
                <Text style={styles.macroCircleText}>P</Text>
              </View>
              <Text style={styles.quickMacroLabel}>Protein</Text>
              <Text style={[styles.quickMacroValue, styles.proteinValue]}>{calculateNutrition(productData.nutrition.protein)}g</Text>
            </View>
            <View style={styles.macroSeparator} />
            <View style={[styles.quickMacroItem, styles.carbsItem]}>
              <View style={[styles.macroCircle, styles.carbsCircle]}>
                <Text style={styles.macroCircleText}>C</Text>
              </View>
              <Text style={styles.quickMacroLabel}>Carbs</Text>
              <Text style={[styles.quickMacroValue, styles.carbsValue]}>{calculateNutrition(productData.nutrition.carbs)}g</Text>
            </View>
            <View style={styles.macroSeparator} />
            <View style={[styles.quickMacroItem, styles.fatItem]}>
              <View style={[styles.macroCircle, styles.fatCircle]}>
                <Text style={styles.macroCircleText}>F</Text>
              </View>
              <Text style={styles.quickMacroLabel}>Fat</Text>
              <Text style={[styles.quickMacroValue, styles.fatValue]}>{calculateNutrition(productData.nutrition.fat)}g</Text>
            </View>
          </View>
        </StyledCard>


        {/* Additional Nutrients */}
        <StyledCard title="Additional Nutrients" style={styles.additionalCard}>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Fiber</Text>
            <Text style={styles.nutrientValue}>
              {calculateNutrition(productData.nutrition.fiber)}g
            </Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Sugar</Text>
            <Text style={styles.nutrientValue}>
              {calculateNutrition(productData.nutrition.sugar)}g
            </Text>
          </View>
          <View style={styles.nutrientRow}>
            <Text style={styles.nutrientLabel}>Sodium</Text>
            <Text style={styles.nutrientValue}>
              {Math.round(productData.nutrition.sodium * parseFloat(servingSize) * 10)}mg
            </Text>
          </View>
        </StyledCard>

        {/* Source and Barcode Info */}
        <View style={styles.barcodeInfo}>
          <Text style={styles.barcodeLabel}>Barcode: </Text>
          <Text style={styles.barcodeValue}>{barcode}</Text>
        </View>
        {productData.source && (
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceLabel}>Data from: {productData.source}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <StyledButton
            title="Add to My Nutrition"
            size="lg"
            fullWidth
            onPress={handleAddToHistory}
            loading={isSaving}
            style={styles.addButton}
          />
          <StyledButton
            title="Scan Another Product"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={handleScanAnother}
            style={styles.scanButton}
          />
        </View>
      </ScrollView>

      {/* Nutri-Score Explanation Modal */}
      <NutriScoreModal
        visible={showNutriScoreModal}
        onClose={() => setShowNutriScoreModal(false)}
        grade={productData.nutritionGrade}
        nutriscoreData={productData.nutriscoreData}
        productName={productData.name}
      />

      {/* Barcode Photo Modal */}
      <Modal
        visible={showBarcodePhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBarcodePhoto(false)}
      >
        <View style={styles.barcodeModalOverlay}>
          <TouchableOpacity
            style={styles.barcodeModalClose}
            onPress={() => setShowBarcodePhoto(false)}
            activeOpacity={0.9}
          >
            <View style={styles.barcodeModalContent}>
              <View style={styles.barcodeModalHeader}>
                <Text style={styles.barcodeModalTitle}>Your Scanned Barcode</Text>
                <TouchableOpacity
                  onPress={() => setShowBarcodePhoto(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              {barcodePhotoUri && (
                <Image
                  source={{ uri: barcodePhotoUri }}
                  style={styles.barcodePhotoImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.barcodeModalHint}>Tap anywhere to close</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  productImage: {
    width: 200,
    height: 200,
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  productBrand: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  servingSize: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  caloriesCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '30',
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  caloriesLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  caloriesUnit: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: -Spacing.xs,
  },
  additionalCard: {
    marginBottom: Spacing.lg,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nutrientRow: {
    borderBottomWidth: 0,
  },
  nutrientLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  nutrientValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  barcodeInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  barcodeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  barcodeValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  addButton: {
    marginBottom: Spacing.md,
  },
  scanButton: {
    marginBottom: Spacing.md,
  },
  sourceInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sourceLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  servingCard: {
    marginBottom: Spacing.lg,
  },
  servingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  servingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  servingButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  servingButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: Typography.fontSize.sm,
  },
  customServingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  servingInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    width: 100,
    textAlign: 'center',
    marginRight: Spacing.sm,
  },
  servingUnit: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  quickMacrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '20',
    width: '100%',
  },
  quickMacroItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickMacroLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  quickMacroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  macroCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',  // Green for protein
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  carbsCircle: {
    backgroundColor: '#FF9800',  // Orange for carbs
  },
  fatCircle: {
    backgroundColor: '#F44336',  // Red for fat
  },
  macroCircleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  proteinValue: {
    color: '#4CAF50',  // Green
  },
  carbsValue: {
    color: '#FF9800',  // Orange
  },
  fatValue: {
    color: '#F44336',  // Red
  },
  macroSeparator: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  gradeContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutriScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  nutriScoreLabel: {
    fontSize: 9,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  nutriScoreGrade: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  tapHint: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  nutriScoreA: {
    backgroundColor: '#038141',  // Dark Green - Excellent
  },
  nutriScoreB: {
    backgroundColor: '#85BB2F',  // Light Green - Good
  },
  nutriScoreC: {
    backgroundColor: '#FECB02',  // Yellow - OK
  },
  nutriScoreD: {
    backgroundColor: '#EE8100',  // Orange - Poor
  },
  nutriScoreE: {
    backgroundColor: '#E63E11',  // Red - Bad
  },
  tapHintContainer: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  tapHintText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  barcodeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeModalClose: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  barcodeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  barcodeModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.error,
    fontWeight: 'bold',
  },
  barcodePhotoImage: {
    width: '100%',
    height: 400,
    borderRadius: BorderRadius.md,
  },
  barcodeModalHint: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.md,
  },
});