import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * ProactiveSuggestionCard - Displays AI proactive suggestions
 * Shows when AI has something relevant to say
 */
export default function ProactiveSuggestionCard({ suggestion, onPress, onDismiss }) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in and fade in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return Colors.primary; // Green
      default:
        return Colors.primary;
    }
  };

  const priorityColor = getPriorityColor(suggestion.priority);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: priorityColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{suggestion.message}</Text>

        <View style={styles.footer}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>
              {suggestion.priority.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.actionText}>Tap to ask AI →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  dismissText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: 'bold',
  },
  message: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    color: '#fff',
    fontSize: Typography.fontSize.xs,
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
});
