import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function NutriScoreModal({ visible, onClose, grade, nutriscoreData, productName }) {
  // Get grade explanation based on the score
  const getGradeExplanation = (grade) => {
    switch(grade?.toLowerCase()) {
      case 'a':
        return {
          title: 'Excellent Nutritional Quality',
          color: '#038141',
          summary: 'This product has excellent nutritional quality. It\'s a healthy choice for regular consumption.',
          recommendation: '✅ Excellent choice! Enjoy regularly as part of a balanced diet.',
        };
      case 'b':
        return {
          title: 'Good Nutritional Quality',
          color: '#85BB2F',
          summary: 'This product has good nutritional quality with minor concerns.',
          recommendation: '✅ Good choice! Can be consumed regularly.',
        };
      case 'c':
        return {
          title: 'Average Nutritional Quality',
          color: '#FECB02',
          summary: 'This product has average nutritional quality. Some aspects could be better.',
          recommendation: '⚠️ OK choice. Consume in moderation.',
        };
      case 'd':
        return {
          title: 'Poor Nutritional Quality',
          color: '#EE8100',
          summary: 'This product has poor nutritional quality with several concerns.',
          recommendation: '⚠️ Limit consumption. Look for healthier alternatives.',
        };
      case 'e':
        return {
          title: 'Very Poor Nutritional Quality',
          color: '#E63E11',
          summary: 'This product has very poor nutritional quality with significant health concerns.',
          recommendation: '❌ Avoid regular consumption. Choose healthier alternatives.',
        };
      default:
        return {
          title: 'Nutritional Information',
          color: Colors.textSecondary,
          summary: 'Nutritional score information not available.',
          recommendation: 'Score data unavailable.',
        };
    }
  };

  const gradeInfo = getGradeExplanation(grade);

  // Format positive/negative factors
  const getFactorLevel = (points) => {
    if (points <= 2) return { text: 'Low', color: '#4CAF50' };
    if (points <= 5) return { text: 'Moderate', color: '#FF9800' };
    return { text: 'High', color: '#F44336' };
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.gradeBadge, { backgroundColor: gradeInfo.color }]}>
                <Text style={styles.gradeText}>{grade?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Nutri-Score Details</Text>
                <Text style={styles.productNameText} numberOfLines={1}>
                  {productName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Grade Explanation */}
            <View style={[styles.gradeSection, { backgroundColor: gradeInfo.color + '15' }]}>
              <Text style={[styles.gradeTitle, { color: gradeInfo.color }]}>
                {gradeInfo.title}
              </Text>
              <Text style={styles.gradeSummary}>{gradeInfo.summary}</Text>
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationText}>{gradeInfo.recommendation}</Text>
              </View>
            </View>

            {/* How Nutri-Score Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How Nutri-Score is Calculated</Text>
              <Text style={styles.explanationText}>
                The Nutri-Score analyzes the nutritional content per 100g/100ml:
              </Text>
            </View>

            {/* Negative Points */}
            {nutriscoreData && (
              <View style={styles.section}>
                <Text style={styles.subsectionTitle}>
                  ❌ Negative Points: {nutriscoreData.negative_points || 0}/{nutriscoreData.is_beverage ? '40' : '55'}
                </Text>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Energy</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {Math.round(nutriscoreData.energy_value || 0)} kJ
                    </Text>
                    <Text style={[
                      styles.factorPoints,
                      { color: getFactorLevel(nutriscoreData.energy_points).color }
                    ]}>
                      {nutriscoreData.energy_points || 0} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Saturated Fat</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.saturated_fat_value || 0).toFixed(1)}g
                    </Text>
                    <Text style={[
                      styles.factorPoints,
                      { color: getFactorLevel(nutriscoreData.saturated_fat_points).color }
                    ]}>
                      {nutriscoreData.saturated_fat_points || 0} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Sugars</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.sugars_value || 0).toFixed(1)}g
                    </Text>
                    <Text style={[
                      styles.factorPoints,
                      { color: getFactorLevel(nutriscoreData.sugars_points).color }
                    ]}>
                      {nutriscoreData.sugars_points || 0} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Salt</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.sodium_value || 0).toFixed(1)}mg
                    </Text>
                    <Text style={[
                      styles.factorPoints,
                      { color: getFactorLevel(nutriscoreData.sodium_points).color }
                    ]}>
                      {nutriscoreData.sodium_points || 0} pts
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Positive Points */}
            {nutriscoreData && (
              <View style={styles.section}>
                <Text style={styles.subsectionTitle}>
                  ✅ Positive Points: {nutriscoreData.positive_points || 0}/{nutriscoreData.is_beverage ? '10' : '17'}
                </Text>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Fruits/Veg/Nuts</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.fruits_vegetables_nuts_value || 0).toFixed(0)}%
                    </Text>
                    <Text style={[styles.factorPoints, { color: '#4CAF50' }]}>
                      {nutriscoreData.fruits_vegetables_nuts_points || 0} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Fiber</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.fiber_value || 0).toFixed(1)}g
                    </Text>
                    <Text style={[styles.factorPoints, { color: '#4CAF50' }]}>
                      {nutriscoreData.fiber_points || 0} pts
                    </Text>
                  </View>
                </View>

                <View style={styles.factorRow}>
                  <Text style={styles.factorLabel}>Protein</Text>
                  <View style={styles.factorValue}>
                    <Text style={styles.factorActualValue}>
                      {(nutriscoreData.proteins_value || 0).toFixed(1)}g
                    </Text>
                    <Text style={[styles.factorPoints, { color: '#4CAF50' }]}>
                      {nutriscoreData.proteins_points || 0} pts
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Final Score */}
            {nutriscoreData?.score !== null && (
              <View style={styles.scoreSection}>
                <Text style={styles.finalScoreLabel}>Final Score</Text>
                <Text style={styles.finalScoreValue}>
                  {nutriscoreData.score} points
                </Text>
                <Text style={styles.scoreExplanation}>
                  Lower scores = Better nutrition
                </Text>
                <Text style={styles.scoreRange}>
                  A: ≤-1 | B: 0-2 | C: 3-10 | D: 11-18 | E: ≥19
                </Text>
              </View>
            )}

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Health Tips</Text>
              {grade?.toLowerCase() === 'a' || grade?.toLowerCase() === 'b' ? (
                <Text style={styles.tipsText}>
                  This is a nutritious choice! Pair it with other whole foods for a balanced meal.
                </Text>
              ) : grade?.toLowerCase() === 'c' ? (
                <Text style={styles.tipsText}>
                  Consider this an occasional food. Balance it with healthier options throughout your day.
                </Text>
              ) : (
                <Text style={styles.tipsText}>
                  Try to find alternatives with better nutritional profiles. Look for products with less sugar, salt, and saturated fat.
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  productNameText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gradeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: 'white',
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  gradeSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  gradeTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  gradeSummary: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  recommendationBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  recommendationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  explanationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  factorLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  factorValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorValueText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  factorPoints: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  factorActualValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  scoreSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  finalScoreLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  finalScoreValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  scoreExplanation: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  scoreRange: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  tipsSection: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tipsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 20,
  },
});