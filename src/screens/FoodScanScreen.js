import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function FoodScanScreen({ navigation }) {
  const [foodItem] = useState('Food Item Name');
  const [rating] = useState('green');
  const [quantity] = useState('300g');
  const [calories] = useState(300);
  const [protein] = useState(10);
  const [fats] = useState(15);
  const [carbs] = useState(20);

  return (
    <ScreenLayout
      title={foodItem}
      subtitle="Nutrition Analysis"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <StyledCard style={styles.scanImageCard}>
        <View style={styles.scanImageContainer}>
          <Text style={styles.scanImageIcon}>📷</Text>
          <Text style={styles.scanImageText}>Scanned Image</Text>
        </View>
      </StyledCard>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingLabel}>Food Rating</Text>
        <View style={[styles.ratingBadge, rating === 'green' && styles.greenRating]}>
          <Text style={styles.ratingIcon}>✓</Text>
        </View>
      </View>

      <StyledCard style={styles.quantityCard}>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Per {quantity}</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </StyledCard>

      <StyledCard title="Nutrition Facts" variant="elevated">
        <View style={styles.nutritionContent}>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieLabel}>Calories</Text>
            <Text style={styles.calorieValue}>{calories}</Text>
          </View>
          
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{fats}g</Text>
              <Text style={styles.macroLabel}>Fats</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreInfo}>
            <Text style={styles.moreInfoText}>See more nutritional value →</Text>
          </TouchableOpacity>
        </View>
      </StyledCard>

      <View style={styles.actions}>
        <StyledButton
          title="Add to Meal"
          icon="+"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Nutrition')}
          style={styles.actionButton}
        />
        
        <StyledButton
          title="Rescan"
          icon="🔄"
          size="lg"
          variant="secondary"
          fullWidth
          onPress={() => {}}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scanImageCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  scanImageContainer: {
    alignItems: 'center',
  },
  scanImageIcon: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
  scanImageText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  ratingLabel: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  ratingBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  greenRating: {
    backgroundColor: Colors.success,
  },
  ratingIcon: {
    color: Colors.background,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  quantityCard: {
    marginBottom: Spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
  },
  editButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  nutritionContent: {
    marginTop: Spacing.md,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  calorieLabel: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  calorieValue: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  macroLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  moreInfo: {
    paddingVertical: Spacing.sm,
  },
  moreInfoText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  actions: {
    marginTop: Spacing.lg,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
});