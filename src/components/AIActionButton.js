import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * AIActionButton
 *
 * Reusable button component for AI actions
 * Reuses the beautiful chip design from QuickSuggestions.js
 */
export default function AIActionButton({
  icon,
  text,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'back'
  loading = false,
  disabled = false,
  size = 'medium', // 'small' | 'medium' | 'large'
}) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress?.();
  };

  // Determine colors based on variant
  const isBackButton = variant === 'back';
  const isSecondary = variant === 'secondary';

  const gradientColors = isBackButton
    ? [Colors.border + '30', Colors.border + '15']
    : isSecondary
    ? [Colors.surface, Colors.background]
    : [Colors.primary + '15', Colors.primary + '08'];

  const iconColor = isBackButton
    ? Colors.textSecondary
    : isSecondary
    ? Colors.textSecondary
    : Colors.primary;

  const textColor = isBackButton
    ? Colors.textSecondary
    : isSecondary
    ? Colors.text
    : Colors.text;

  // Size variations
  const sizeStyles = {
    small: {
      minHeight: 70,
      iconSize: 22,
      fontSize: Typography.fontSize.xs - 1,
    },
    medium: {
      minHeight: 95,
      iconSize: 28,
      fontSize: Typography.fontSize.xs,
    },
    large: {
      minHeight: 110,
      iconSize: 32,
      fontSize: Typography.fontSize.sm,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Animated.View style={[
      styles.chipWrapper,
      { transform: [{ scale: scaleAnim }] },
      disabled && styles.disabled,
    ]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.chipTouchable}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.suggestionChip,
            { minHeight: currentSize.minHeight },
            isBackButton && styles.backButtonChip,
            isSecondary && styles.secondaryChip,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={iconColor} size="small" />
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={icon}
                  size={currentSize.iconSize}
                  color={iconColor}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.text,
                    { color: textColor, fontSize: currentSize.fontSize },
                  ]}
                  numberOfLines={3}
                >
                  {text}
                </Text>
              </View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chipWrapper: {
    width: '48%', // 2 columns by default
  },
  disabled: {
    opacity: 0.5,
  },
  chipTouchable: {
    width: '100%',
  },
  suggestionChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  backButtonChip: {
    borderColor: Colors.border,
  },
  secondaryChip: {
    borderColor: Colors.border + '60',
  },
});
