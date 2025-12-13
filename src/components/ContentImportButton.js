/**
 * ContentImportButton - FAB button for importing workouts
 *
 * A floating action button that opens the workout import modal.
 * Note: Recipe import is handled separately in the nutrition section.
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import ContentImportModal from './ContentImportModal';

export default function ContentImportButton({
  userId,
  onImportComplete,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'bottom-center'
  style,
  showLabel = false,
  iconName = 'barbell', // Custom icon
  navigation, // For navigating to exercise detail from variant selection
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Get position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 24, left: 24 };
      case 'bottom-center':
        return { bottom: 24, left: '50%', marginLeft: -28 };
      case 'bottom-right':
      default:
        return { bottom: 24, right: 24 };
    }
  };

  const handleImportComplete = (data, type) => {
    if (onImportComplete) {
      onImportComplete(data, type);
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          getPositionStyle(),
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            showLabel && styles.buttonWithLabel,
          ]}
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={24} color={Colors.text} />
          </View>
          {showLabel && (
            <Text style={styles.label}>Import Workout</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ContentImportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImportComplete={handleImportComplete}
        userId={userId}
        navigation={navigation}
      />
    </>
  );
}

/**
 * Inline import button (not floating)
 * For use within lists or cards
 * Note: This is workout-only. Recipe import is in nutrition section.
 */
export function ImportButton({
  userId,
  onImportComplete,
  label = 'Import Workout',
  icon = 'barbell',
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'primary', // 'primary', 'secondary', 'outline'
  fullWidth = false,
  style,
  navigation, // For navigating to exercise detail from variant selection
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
          iconSize: 16,
          fontSize: Typography.fontSize.xs,
        };
      case 'large':
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
          iconSize: 24,
          fontSize: Typography.fontSize.md,
        };
      case 'medium':
      default:
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          iconSize: 20,
          fontSize: Typography.fontSize.sm,
        };
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: Colors.surface,
          textColor: Colors.text,
          borderColor: Colors.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.primary,
          borderColor: Colors.primary,
          borderWidth: 1,
        };
      case 'primary':
      default:
        return {
          backgroundColor: Colors.primary,
          textColor: Colors.text,
          borderColor: Colors.primary,
          borderWidth: 0,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const handleImportComplete = (data, type) => {
    if (onImportComplete) {
      onImportComplete(data, type);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.inlineButton,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            borderWidth: variantStyles.borderWidth,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={variantStyles.textColor}
        />
        <Text
          style={[
            styles.inlineLabel,
            {
              fontSize: sizeStyles.fontSize,
              color: variantStyles.textColor,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>

      <ContentImportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onImportComplete={handleImportComplete}
        userId={userId}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // FAB styles
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    padding: Spacing.md,
    ...Shadows.lg,
  },
  buttonWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.weights.semibold,
  },

  // Inline button styles
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  inlineLabel: {
    fontWeight: Typography.weights.medium,
  },
  fullWidth: {
    width: '100%',
  },
});
