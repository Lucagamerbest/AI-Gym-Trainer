import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import KeyboardScrollView from './KeyboardScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedBackground from './AnimatedBackground';
import ActiveWorkoutIndicator from './ActiveWorkoutIndicator';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function ScreenLayout({
  children,
  title,
  subtitle,
  navigation,
  showBack = true,
  showHome = true,
  scrollable = true,
  centerContent = false,
  style,
  onHomePress,
  hideWorkoutIndicator = false
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoHome = () => {
    if (onHomePress) {
      onHomePress();
    } else if (navigation) {
      // Navigate to the Main tab navigator, then to Home tab
      navigation.navigate('Main', { screen: 'Home' });
    }
  };

  const handleGoBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const ContentWrapper = scrollable ? KeyboardScrollView : View;
  const contentProps = scrollable ? {
    showsVerticalScrollIndicator: false,
    contentContainerStyle: centerContent && styles.centeredScrollContent
  } : {
    style: centerContent && styles.centeredContent
  };

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, -0.5) }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {showBack && navigation?.canGoBack() && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>←</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerCenter}>
            {typeof title === 'string' ? (
              title && <Text style={styles.headerTitle}>{title}</Text>
            ) : (
              title
            )}
          </View>

          <View style={styles.headerRight}>
            {showHome && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleGoHome}
                activeOpacity={0.7}
              >
                <Text style={styles.navIcon}>🏠</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Page Title - only show subtitle if provided */}
        {subtitle && (
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </Animated.View>
        )}

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
            style,
          ]}
        >
          <ContentWrapper {...contentProps}>
            {children}
          </ContentWrapper>
        </Animated.View>

        {/* Active Workout Indicator */}
        {!hideWorkoutIndicator && navigation && (
          <ActiveWorkoutIndicator navigation={navigation} />
        )}
      </SafeAreaView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
  },
  titleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});