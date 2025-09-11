import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function AIScreen({ navigation }) {
  return (
    <ScreenLayout
      title="AI Assistant"
      subtitle="Your Personal Fitness Coach"
      navigation={navigation}
      showBack={false}
      showHome={false}
      centerContent={true}
    >
      <View style={styles.container}>
        <Text style={styles.buildingIcon}>🤖</Text>
        <Text style={styles.mainText}>AI is currently being built</Text>
        <Text style={styles.subText}>Check back later</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Soon, your AI assistant will provide personalized guidance based on your current activity in the app.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buildingIcon: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  mainText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 320,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});