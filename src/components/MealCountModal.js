import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

/**
 * MealCountModal - Shows a friendly message when user exceeds their meal count
 *
 * @param {boolean} visible - Whether modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {number} currentCount - Number of meals logged today (after this one)
 * @param {number} limit - User's daily meal limit
 * @param {string} message - Encouraging message to show
 * @param {string} foodName - Name of the food that was logged (optional)
 */
export default function MealCountModal({
  visible,
  onClose,
  currentCount = 0,
  limit = 3,
  message = '',
  foodName = ''
}) {
  const isOverLimit = currentCount > limit;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View style={[
            styles.iconContainer,
            { backgroundColor: isOverLimit ? Colors.warning + '20' : Colors.success + '20' }
          ]}>
            <Ionicons
              name={isOverLimit ? "restaurant" : "checkmark-circle"}
              size={40}
              color={isOverLimit ? Colors.warning : Colors.success}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Meal {currentCount} of {limit} Logged
          </Text>

          {/* Food name if provided */}
          {foodName ? (
            <Text style={styles.foodName}>{foodName}</Text>
          ) : null}

          {/* Subtitle */}
          {isOverLimit && (
            <Text style={styles.subtitle}>
              You're {currentCount - limit} meal{currentCount - limit > 1 ? 's' : ''} over your daily goal
            </Text>
          )}

          {/* Encouraging message */}
          {message && (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{message}</Text>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Got it!</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  foodName: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.warning,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  messageContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  message: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.text,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
  },
});
