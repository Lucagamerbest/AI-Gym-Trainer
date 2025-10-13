import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const SCAN_HISTORY_KEY = '@food_scan_history';

export default function FoodScanningScreen({ navigation, route }) {
  const { mealType, isPlannedMeal, plannedDateKey } = route.params || {};
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScanHistory();
  }, []);

  // Load scanning history from AsyncStorage
  const loadScanHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
      if (historyData) {
        const history = JSON.parse(historyData);
        setScanHistory(history);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Save scanning history to AsyncStorage
  const saveScanHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(newHistory));
      setScanHistory(newHistory);
    } catch (error) {
    }
  };

  // Add new scan to history
  const addToHistory = (scanData) => {
    const newScan = {
      id: Date.now().toString(),
      name: scanData.name,
      image: scanData.image,
      calories: scanData.calories,
      protein: scanData.protein,
      carbs: scanData.carbs,
      fats: scanData.fats,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [newScan, ...scanHistory.slice(0, 19)]; // Keep last 20 items
    saveScanHistory(updatedHistory);
  };

  // Navigate to camera screen
  const openCamera = () => {
    navigation.navigate('Camera', {
      returnScreen: 'FoodScanning',
      onScanComplete: addToHistory,
      mealType,
      isPlannedMeal,
      plannedDateKey
    });
  };

  // Navigate to scan results for history item
  const viewHistoryItem = (item) => {
    navigation.navigate('FoodScan', {
      capturedImage: item.image,
      foodData: {
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
      },
      fromHistory: true
    });
  };

  // Clear scanning history
  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scanning history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => saveScanHistory([])
        }
      ]
    );
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <ScreenLayout
      title="Food Scanner"
      subtitle="Scan & track your meals"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      {/* Main Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={openCamera}
        activeOpacity={0.8}
      >
        <View style={styles.scanButtonContent}>
          <View style={styles.cameraIconContainer}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
          <View style={styles.scanButtonText}>
            <Text style={styles.scanButtonTitle}>Scan Food</Text>
            <Text style={styles.scanButtonSubtitle}>Point camera at food to analyze</Text>
          </View>
          <Text style={styles.scanButtonArrow}>→</Text>
        </View>
      </TouchableOpacity>

      {/* Scanning History Section */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Scans</Text>
          {scanHistory.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearHistoryText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Loading history...</Text>
          </View>
        ) : scanHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🍽️</Text>
            <Text style={styles.emptyStateTitle}>No scans yet</Text>
            <Text style={styles.emptyStateText}>
              Start by scanning your first food item above
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {scanHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => viewHistoryItem(item)}
                activeOpacity={0.7}
              >
                <View style={styles.historyItemContent}>
                  <View style={styles.imagesContainer}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.historyItemImage}
                        resizeMode="cover"
                      />
                    )}
                    {item.barcodePhotoUri && (
                      <Image
                        source={{ uri: item.barcodePhotoUri }}
                        style={styles.barcodePhotoThumb}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.historyItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.historyItemDetails}>
                      {item.calories} cal • {item.servingSize || '100g'}
                    </Text>
                    <View style={styles.historyItemMacros}>
                      <View style={styles.macroTag}>
                        <Text style={styles.macroTagLabel}>P</Text>
                        <Text style={styles.macroTagValue}>{item.protein || 0}g</Text>
                      </View>
                      <View style={[styles.macroTag, styles.macroTagCarbs]}>
                        <Text style={styles.macroTagLabel}>C</Text>
                        <Text style={styles.macroTagValue}>{item.carbs || 0}g</Text>
                      </View>
                      <View style={[styles.macroTag, styles.macroTagFat]}>
                        <Text style={styles.macroTagLabel}>F</Text>
                        <Text style={styles.macroTagValue}>{item.fats || 0}g</Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemTime}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.historyItemArrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  cameraIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  cameraIcon: {
    fontSize: 30,
  },
  scanButtonText: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  scanButtonSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  scanButtonArrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  historySection: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  historyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearHistoryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginRight: Spacing.md,
    gap: 4,
  },
  historyItemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  barcodePhotoThumb: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  historyItemInfo: {
    flex: 1,
  },
  historyItemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  historyItemDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  historyItemTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  historyItemArrow: {
    paddingLeft: Spacing.sm,
  },
  arrowText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  historyItemMacros: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  macroTag: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    alignItems: 'center',
  },
  macroTagCarbs: {
    backgroundColor: Colors.warning + '20',
  },
  macroTagFat: {
    backgroundColor: Colors.success + '20',
  },
  macroTagLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 3,
  },
  macroTagValue: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
  },
});