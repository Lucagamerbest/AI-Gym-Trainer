import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIActionButton from './AIActionButton';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * AIButtonSection
 *
 * Collapsible accordion section containing AI action buttons
 * Based on the design document structure
 *
 * Supports both controlled and uncontrolled modes:
 * - Controlled: pass `expanded` and `onToggle` props
 * - Uncontrolled: pass `defaultExpanded` only
 */
export default function AIButtonSection({
  title,
  icon,
  buttons = [],
  onButtonPress,
  defaultExpanded = false,
  expanded: controlledExpanded, // Controlled state from parent
  onToggle, // Callback for controlled state
  loading = false,
  emptyMessage = 'No actions available',
  showSettingsButton = false, // New prop for settings button
  onSettingsPress, // Callback for settings button
}) {
  // Use controlled state if provided, otherwise use internal state
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const [rotateAnim] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  // Update animation when expanded state changes (for controlled mode)
  React.useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [expanded]);

  const toggleExpanded = () => {
    // Animate content expand/collapse for both modes
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (isControlled) {
      // Controlled mode - call parent callback
      onToggle?.();
    } else {
      // Uncontrolled mode - manage internal state
      const newExpanded = !expanded;

      // Animate chevron rotation
      Animated.spring(rotateAnim, {
        toValue: newExpanded ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
      }).start();

      setInternalExpanded(newExpanded);
    }
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <Ionicons
              name={icon}
              size={24}
              color={Colors.primary}
              style={styles.headerIcon}
            />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {buttons.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{buttons.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {showSettingsButton && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent section toggle
                onSettingsPress?.();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase tap area
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={Colors.textSecondary}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Section Content */}
      {expanded && (
        <View style={styles.content}>
          {buttons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="information-circle-outline"
                size={32}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            <View style={styles.buttonGrid}>
              {buttons.map((button, index) => {
                // Handle dynamic text (function that returns text based on time)
                const buttonText = button.isDynamic && typeof button.text === 'function'
                  ? button.text()
                  : button.text;

                return (
                  <AIActionButton
                    key={index}
                    icon={button.icon}
                    text={buttonText}
                    onPress={() => onButtonPress?.(button)}
                    variant={button.variant || 'primary'}
                    loading={loading}
                    size={button.size || 'medium'}
                    disabled={button.disabled || false}
                    subtitle={button.subtitle || button.description}
                    fullWidth={button.fullWidth || false}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md, // Increased spacing between settings and chevron
  },
  headerIcon: {
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  settingsButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    marginRight: Spacing.xs, // Extra space from chevron
  },
  content: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
