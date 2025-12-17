/**
 * WeightLogModal.js
 *
 * Quick modal for logging daily weight.
 * - Number input with unit toggle (lbs/kg)
 * - Date selector (defaults to today)
 * - Shows previous weight for reference
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function WeightLogModal({
  visible,
  onClose,
  onSave,
  lastEntry = null,
  defaultUnit = 'lbs'
}) {
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState(defaultUnit);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setWeight('');
      setUnit(defaultUnit);
      setDate(new Date().toISOString().split('T')[0]);
      setError(null);
    }
  }, [visible, defaultUnit]);

  const handleSave = () => {
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Please enter a valid weight');
      return;
    }

    if (weightNum < 50 || weightNum > 700) {
      setError('Please enter a realistic weight');
      return;
    }

    onSave({
      date,
      weight: weightNum,
      unit
    });
  };

  const toggleUnit = () => {
    const newUnit = unit === 'lbs' ? 'kg' : 'lbs';

    // Convert existing value if present
    if (weight) {
      const weightNum = parseFloat(weight);
      if (!isNaN(weightNum)) {
        if (unit === 'lbs' && newUnit === 'kg') {
          setWeight((weightNum / 2.20462).toFixed(1));
        } else {
          setWeight((weightNum * 2.20462).toFixed(1));
        }
      }
    }

    setUnit(newUnit);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.getTime() === today.getTime()) {
      return 'Today';
    } else if (d.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const changeDate = (days) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);

    // Don't allow future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) return;

    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log Weight</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity
              onPress={() => changeDate(-1)}
              style={styles.dateArrow}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <TouchableOpacity
              onPress={() => changeDate(1)}
              style={styles.dateArrow}
            >
              <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Weight Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                setError(null);
              }}
              placeholder="0.0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
              autoFocus
            />
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={toggleUnit}
            >
              <Text style={styles.unitText}>{unit}</Text>
              <Ionicons name="swap-horizontal" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Last Entry Reference */}
          {lastEntry && (
            <View style={styles.lastEntryContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.lastEntryText}>
                Last: {lastEntry.weight} {lastEntry.unit} ({formatDate(lastEntry.date)})
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!weight}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Weight</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  dateArrow: {
    padding: Spacing.sm,
  },
  dateText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  weightInput: {
    fontSize: 48,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 150,
    paddingVertical: Spacing.md,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  unitText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  errorText: {
    color: Colors.error || '#EF4444',
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  lastEntryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  lastEntryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
});
