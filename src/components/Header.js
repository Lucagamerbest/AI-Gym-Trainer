import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function Header({ title, navigation, showBack = true, rightAction }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showBack && navigation?.canGoBack() ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
        
        <Text style={styles.title}>{title}</Text>
        
        {rightAction ? (
          <TouchableOpacity style={styles.rightButton} onPress={rightAction.onPress}>
            <Text style={styles.rightText}>{rightAction.text}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  backIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  backText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 80,
  },
  rightButton: {
    padding: Spacing.sm,
  },
  rightText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
});