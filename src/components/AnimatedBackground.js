import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground({ children }) {
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Floating bubble animations
    const animateBubble = (bubble, duration, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(bubble, {
              toValue: 1,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(bubble, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateBubble(bubble1, 8000, 0);
    animateBubble(bubble2, 10000, 2000);
    animateBubble(bubble3, 12000, 4000);
  }, []);

  const translateY1 = bubble1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const translateY2 = bubble2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const translateY3 = bubble3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  const opacity1 = bubble1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.3, 0.1],
  });

  const opacity2 = bubble2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.25, 0.1],
  });

  const opacity3 = bubble3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.2, 0.1],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.gradientOverlay, { opacity: fadeAnim }]} />
      
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble1,
          {
            transform: [{ translateY: translateY1 }],
            opacity: opacity1,
          },
        ]}
      />
      
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble2,
          {
            transform: [{ translateY: translateY2 }],
            opacity: opacity2,
          },
        ]}
      />
      
      <Animated.View 
        style={[
          styles.bubble,
          styles.bubble3,
          {
            transform: [{ translateY: translateY3 }],
            opacity: opacity3,
          },
        ]}
      />
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.gradientEnd,
    opacity: 0.3,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  bubble1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    top: -150,
    left: -100,
  },
  bubble2: {
    width: 250,
    height: 250,
    backgroundColor: Colors.primaryLight,
    bottom: -100,
    right: -80,
  },
  bubble3: {
    width: 200,
    height: 200,
    backgroundColor: Colors.primaryDark,
    top: height / 3,
    right: -100,
  },
});