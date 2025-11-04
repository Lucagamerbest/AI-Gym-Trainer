/**
 * ThinkingAnimation Component
 *
 * A clean, professional animated indicator for AI processing states.
 * Shows pulsing dots to indicate the AI is thinking/processing.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function ThinkingAnimation({ text = "Thinking", style, compact = false }) {
  // Create animated values for each dot
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Create staggered pulse animation for dots
    const createPulse = (animatedValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start animations with staggered delays
    const anim1 = createPulse(dot1Opacity, 0);
    const anim2 = createPulse(dot2Opacity, 200);
    const anim3 = createPulse(dot3Opacity, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    // Cleanup
    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={[compact ? styles.compactContainer : styles.container, style]}>
      <View style={styles.contentWrapper}>
        {!compact && <Text style={styles.emoji}>💭</Text>}
        <View style={styles.textContainer}>
          <Text style={[styles.text, compact && styles.compactText]}>{text}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, compact && styles.compactDot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, compact && styles.compactDot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, compact && styles.compactDot, { opacity: dot3Opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  compactContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  compactText: {
    fontSize: Typography.fontSize.sm,
  },
  compactDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
