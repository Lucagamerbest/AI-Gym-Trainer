/**
 * PlateVisualization Component
 * Visual representation of barbell with plates
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { calculatePlates } from '../utils/plateCalculator';
import { BAR_TYPES, PLATE_COLORS, getBarWeight } from '../constants/weightEquipment';

/**
 * Get plate color based on weight
 */
const getPlateColor = (weight) => {
  // Map common weights to colors
  if (weight >= 45) return PLATE_COLORS[45] || { bg: '#2563EB', text: '#FFFFFF' };
  if (weight >= 35) return PLATE_COLORS[35] || { bg: '#EAB308', text: '#000000' };
  if (weight >= 25) return PLATE_COLORS[25] || { bg: '#16A34A', text: '#FFFFFF' };
  if (weight >= 10) return PLATE_COLORS[10] || { bg: '#F5F5F5', text: '#000000' };
  if (weight >= 5) return PLATE_COLORS[5] || { bg: '#DC2626', text: '#FFFFFF' };
  return PLATE_COLORS[2.5] || { bg: '#16A34A', text: '#FFFFFF' };
};

/**
 * Get plate size based on weight
 */
const getPlateSize = (weight, compact = false) => {
  const baseMultiplier = compact ? 0.7 : 1;

  if (weight >= 45) return { width: 22 * baseMultiplier, height: 36 * baseMultiplier };
  if (weight >= 35) return { width: 20 * baseMultiplier, height: 32 * baseMultiplier };
  if (weight >= 25) return { width: 18 * baseMultiplier, height: 28 * baseMultiplier };
  if (weight >= 10) return { width: 14 * baseMultiplier, height: 22 * baseMultiplier };
  if (weight >= 5) return { width: 12 * baseMultiplier, height: 18 * baseMultiplier };
  return { width: 10 * baseMultiplier, height: 14 * baseMultiplier };
};

/**
 * Individual Plate Component
 */
const Plate = ({ weight, compact = false, isRight = false }) => {
  const color = getPlateColor(weight);
  const size = getPlateSize(weight, compact);

  return (
    <View
      style={[
        styles.plate,
        {
          backgroundColor: color.bg,
          width: size.width,
          height: size.height,
          marginLeft: isRight ? 1 : 0,
          marginRight: isRight ? 0 : 1,
        },
      ]}
    >
      {!compact && size.height >= 20 && (
        <Text
          style={[
            styles.plateText,
            { color: color.text, fontSize: compact ? 7 : 9 },
          ]}
          numberOfLines={1}
        >
          {weight}
        </Text>
      )}
    </View>
  );
};

/**
 * Barbell Bar Component
 */
const Bar = ({ barType, compact = false }) => {
  const bar = BAR_TYPES[barType] || BAR_TYPES.olympic;
  const barHeight = compact ? 6 : 8;
  const barWidth = compact ? 60 : 80;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: bar.color,
          height: barHeight,
          width: barWidth,
        },
      ]}
    />
  );
};

/**
 * Main PlateVisualization Component
 */
const PlateVisualization = ({
  totalWeight,
  barType = 'olympic',
  unit = 'lbs',
  compact = false,
  showBarInfo = true,
  showPlatesSummary = true,
}) => {
  const result = useMemo(() => {
    const weight = parseFloat(totalWeight);
    if (isNaN(weight) || weight <= 0) {
      return null;
    }
    return calculatePlates(weight, barType, unit);
  }, [totalWeight, barType, unit]);

  // Don't render if no valid weight
  if (!result) {
    return null;
  }

  const bar = BAR_TYPES[barType] || BAR_TYPES.olympic;
  const barWeight = getBarWeight(barType, unit);
  const plates = result.platesPerSide || [];

  // Reverse plates for left side (heaviest closest to center)
  const leftPlates = [...plates].reverse();
  const rightPlates = plates;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Bar visualization */}
      <View style={styles.barContainer}>
        {/* Left plates (reversed order - heavy plates near center) */}
        <View style={[styles.platesContainer, styles.platesLeft]}>
          {leftPlates.map((plateWeight, index) => (
            <Plate
              key={`left-${index}`}
              weight={plateWeight}
              compact={compact}
              isRight={false}
            />
          ))}
        </View>

        {/* Bar */}
        <Bar barType={barType} compact={compact} />

        {/* Right plates */}
        <View style={[styles.platesContainer, styles.platesRight]}>
          {rightPlates.map((plateWeight, index) => (
            <Plate
              key={`right-${index}`}
              weight={plateWeight}
              compact={compact}
              isRight={true}
            />
          ))}
        </View>
      </View>

      {/* Bar and plates info */}
      {!compact && (showBarInfo || showPlatesSummary) && (
        <View style={styles.infoContainer}>
          {showBarInfo && (
            <Text style={styles.barInfo}>
              {bar.name}: {barWeight} {unit}
            </Text>
          )}
          {showPlatesSummary && plates.length > 0 && (
            <Text style={styles.platesSummary}>
              {result.platesSummary}
            </Text>
          )}
          {!result.success && result.error && (
            <Text style={styles.errorText}>
              {result.error}
            </Text>
          )}
        </View>
      )}

      {/* Compact mode info */}
      {compact && plates.length > 0 && (
        <Text style={styles.compactInfo}>
          {plates.join('+')} per side
        </Text>
      )}
    </View>
  );
};

/**
 * Compact inline visualization for set rows
 */
export const PlateVisualizationCompact = ({
  totalWeight,
  barType = 'olympic',
  unit = 'lbs',
}) => {
  const result = useMemo(() => {
    const weight = parseFloat(totalWeight);
    if (isNaN(weight) || weight <= 0) {
      return null;
    }
    return calculatePlates(weight, barType, unit);
  }, [totalWeight, barType, unit]);

  if (!result || !result.platesPerSide || result.platesPerSide.length === 0) {
    const barWeight = getBarWeight(barType, unit);
    const weight = parseFloat(totalWeight);
    if (weight === barWeight) {
      return (
        <View style={styles.compactContainer}>
          <Text style={styles.compactText}>Bar only</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactBarVisual}>
        {/* Mini plates - left side */}
        {[...result.platesPerSide].reverse().map((w, i) => (
          <View
            key={`l-${i}`}
            style={[
              styles.miniPlate,
              { backgroundColor: getPlateColor(w).bg },
            ]}
          />
        ))}

        {/* Mini bar */}
        <View style={styles.miniBar} />

        {/* Mini plates - right side */}
        {result.platesPerSide.map((w, i) => (
          <View
            key={`r-${i}`}
            style={[
              styles.miniPlate,
              { backgroundColor: getPlateColor(w).bg },
            ]}
          />
        ))}
      </View>
      <Text style={styles.compactText}>
        {result.platesPerSide.join('+')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  containerCompact: {
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platesLeft: {
    justifyContent: 'flex-end',
  },
  platesRight: {
    justifyContent: 'flex-start',
  },
  plate: {
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  plateText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  bar: {
    borderRadius: 2,
  },
  infoContainer: {
    marginTop: Spacing.xs,
    alignItems: 'center',
  },
  barInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  platesSummary: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    marginTop: 2,
  },
  compactInfo: {
    fontSize: Typography.fontSize.xxs,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
  // Compact inline styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  compactBarVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  miniPlate: {
    width: 4,
    height: 12,
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
  miniBar: {
    width: 20,
    height: 3,
    backgroundColor: '#808080',
    borderRadius: 1,
  },
  compactText: {
    fontSize: Typography.fontSize.xxs,
    color: Colors.textMuted,
  },
});

export default PlateVisualization;
