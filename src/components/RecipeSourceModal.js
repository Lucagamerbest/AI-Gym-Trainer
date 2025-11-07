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
            <View style={styles.optionCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="search" size={24} color={Colors.success} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Search Database</Text>
                <Text style={styles.optionDescription}>
                  {recipeCount}+ recipes • Instant results
                </Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="flash" size={12} color={Colors.success} />
              </View>
            </View>
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
            <View style={styles.optionCard}>
              <View style={[styles.iconCircle, styles.iconCircleAI]}>
                <Ionicons name="sparkles" size={24} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Generate Custom</Text>
                <Text style={styles.optionDescription}>
                  AI-powered • Personalized
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeAI]}>
                <Ionicons name="time" size={12} color={Colors.primary} />
              </View>
            </View>
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
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleAI: {
    backgroundColor: Colors.primary + '20',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeAI: {
    backgroundColor: Colors.primary + '15',
  },
  helpText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
