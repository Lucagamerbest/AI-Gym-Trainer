import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * RecipeSourceModal
 *
 * Shows user a choice between searching database (instant) or generating with AI (custom)
 * This prevents unnecessary 20-second delays when user just wants to browse recipes
 */
export default function RecipeSourceModal({
  visible,
  onClose,
  onSelectDatabase,
  onSelectAI,
  recipeCount = 500, // Number of recipes in database (TheMealDB + curated)
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Recipe Source</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Option 1: Database Search */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              onClose();
              onSelectDatabase();
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.success, '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionGradient}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="search" size={32} color={Colors.white} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Search Recipe Database</Text>
                <Text style={styles.optionDescription}>
                  Browse {recipeCount}+ fitness recipes
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="flash" size={14} color={Colors.success} />
                  <Text style={styles.badgeText}>Instant</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Option 2: AI Generation */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              onClose();
              onSelectAI();
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionGradient}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="sparkles" size={32} color={Colors.white} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Generate Custom Recipe</Text>
                <Text style={styles.optionDescription}>
                  AI creates recipe tailored to you
                </Text>
                <View style={styles.badge}>
                  <Ionicons name="time" size={14} color={Colors.primary} />
                  <Text style={styles.badgeText}>10-30 seconds</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            💡 Tip: Try database search first for quick inspiration!
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  optionButton: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
