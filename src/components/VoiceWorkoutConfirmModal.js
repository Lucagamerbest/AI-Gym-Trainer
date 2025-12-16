/**
 * VoiceWorkoutConfirmModal.js
 *
 * Modal for confirming/editing parsed voice workout data before saving.
 * Shows exercise name and set details with editing capabilities.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function VoiceWorkoutConfirmModal({
  visible,
  onClose,
  onConfirm,
  parsedData,
  targetExercise, // Pre-selected exercise (for per-exercise mic)
}) {
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState([]);
  const [showExerciseInput, setShowExerciseInput] = useState(false);

  // Initialize state when modal opens or data changes
  useEffect(() => {
    if (parsedData) {
      const exercise = targetExercise || parsedData.matchedExercise;
      setExerciseName(exercise?.name || parsedData.exerciseName || '');
      setSets(parsedData.sets.map((s, idx) => ({
        id: idx,
        weight: s.weight?.toString() || '',
        reps: s.reps?.toString() || '',
      })));
      setShowExerciseInput(!exercise && !targetExercise);
    }
  }, [parsedData, targetExercise, visible]);

  const handleConfirm = () => {
    // Convert sets back to numbers
    const confirmedSets = sets
      .filter(s => s.weight && s.reps)
      .map((s, idx) => ({
        setNumber: idx + 1,
        weight: parseFloat(s.weight) || 0,
        reps: parseInt(s.reps, 10) || 0,
      }));

    if (confirmedSets.length === 0) {
      return; // Don't confirm empty sets
    }

    onConfirm({
      exerciseName,
      matchedExercise: targetExercise || parsedData?.matchedExercise,
      sets: confirmedSets,
    });
  };

  const updateSet = (index, field, value) => {
    setSets(prev => prev.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    ));
  };

  const addSet = () => {
    // Copy last set values as default
    const lastSet = sets[sets.length - 1];
    setSets(prev => [...prev, {
      id: Date.now(),
      weight: lastSet?.weight || '',
      reps: lastSet?.reps || '',
    }]);
  };

  const removeSet = (index) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getConfidenceColor = () => {
    if (!parsedData) return Colors.textSecondary;
    switch (parsedData.confidence) {
      case 'high': return Colors.success || '#22C55E';
      case 'medium': return Colors.warning || '#F59E0B';
      default: return Colors.error || '#EF4444';
    }
  };

  const displayExercise = targetExercise || parsedData?.matchedExercise;

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
            <Text style={styles.title}>Confirm Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Confidence indicator */}
          {parsedData && (
            <View style={styles.confidenceRow}>
              <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor() }]} />
              <Text style={styles.confidenceText}>
                {parsedData.confidence === 'high' ? 'Understood clearly' :
                 parsedData.confidence === 'medium' ? 'Please verify' :
                 'May need corrections'}
              </Text>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Exercise Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Exercise</Text>
              {displayExercise && !showExerciseInput ? (
                <TouchableOpacity
                  style={styles.exerciseDisplay}
                  onPress={() => setShowExerciseInput(true)}
                >
                  <Text style={styles.exerciseName}>{displayExercise.name}</Text>
                  <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.exerciseInput}
                  value={exerciseName}
                  onChangeText={setExerciseName}
                  placeholder="Enter exercise name"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus={showExerciseInput}
                />
              )}
              {parsedData?.exerciseName && displayExercise &&
               parsedData.exerciseName.toLowerCase() !== displayExercise.name.toLowerCase() && (
                <Text style={styles.matchInfo}>
                  Matched from: "{parsedData.exerciseName}"
                </Text>
              )}
            </View>

            {/* Sets */}
            <View style={styles.section}>
              <View style={styles.setsHeader}>
                <Text style={styles.sectionLabel}>Sets ({sets.length})</Text>
                <TouchableOpacity onPress={addSet} style={styles.addButton}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <View style={styles.setNumber}>
                    <Text style={styles.setNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.setInputGroup}>
                    <TextInput
                      style={styles.setInput}
                      value={set.weight}
                      onChangeText={(v) => updateSet(index, 'weight', v)}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitLabel}>lbs</Text>
                  </View>

                  <Text style={styles.setDivider}>×</Text>

                  <View style={styles.setInputGroup}>
                    <TextInput
                      style={styles.setInput}
                      value={set.reps}
                      onChangeText={(v) => updateSet(index, 'reps', v)}
                      placeholder="0"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                    <Text style={styles.unitLabel}>reps</Text>
                  </View>

                  {sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSet(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error || '#EF4444'} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Raw transcript (for debugging/reference) */}
            {parsedData?.rawTranscript && (
              <View style={styles.transcriptSection}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcriptText}>"{parsedData.rawTranscript}"</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                sets.length === 0 && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={sets.length === 0}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Add {sets.length} Set{sets.length !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#2C2C2E',
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  confidenceText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exerciseName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  exerciseInput: {
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    fontSize: Typography.sizes.md,
    color: Colors.text,
  },
  matchInfo: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  addButton: {
    padding: Spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  setNumberText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  setInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInput: {
    flex: 1,
    backgroundColor: Colors.cardBackground || '#1C1C1E',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 50,
  },
  unitLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    width: 30,
  },
  setDivider: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  transcriptSection: {
    backgroundColor: Colors.inputBackground || '#2C2C2E',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  transcriptLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  transcriptText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#2C2C2E',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground || '#2C2C2E',
  },
  cancelButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.xs,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#fff',
  },
});
