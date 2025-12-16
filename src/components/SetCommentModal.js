/**
 * SetCommentModal.js
 *
 * Modal for adding/viewing comments on workout sets
 * Shows current comment input and previous comments for the exercise
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';

export default function SetCommentModal({
  visible,
  onClose,
  onSave,
  exerciseName,
  setIndex,
  currentComment = '',
  weight,
  reps,
  userId = 'guest',
}) {
  const [comment, setComment] = useState(currentComment);
  const [previousComments, setPreviousComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setComment(currentComment);
      loadPreviousComments();
    }
  }, [visible, exerciseName, currentComment]);

  const loadPreviousComments = async () => {
    setLoading(true);
    try {
      const comments = await WorkoutStorageService.getExerciseComments(exerciseName, userId, 5);
      setPreviousComments(comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave(comment.trim());
    onClose();
  };

  const handleClear = () => {
    setComment('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Set {setIndex + 1} Note</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Current Set Info */}
          <View style={styles.setInfo}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            {weight && reps && (
              <Text style={styles.setDetails}>
                {weight} lbs × {reps} reps
              </Text>
            )}
          </View>

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a note for this set..."
              placeholderTextColor={Colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={200}
              autoFocus
            />
            {comment.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.charCount}>{comment.length}/200</Text>

          {/* Previous Comments */}
          {previousComments.length > 0 && (
            <View style={styles.previousSection}>
              <Text style={styles.previousTitle}>Previous Notes</Text>
              <ScrollView style={styles.previousList} showsVerticalScrollIndicator={false}>
                {previousComments.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.previousItem}
                    onPress={() => setComment(item.comment)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.previousHeader}>
                      <Text style={styles.previousDate}>{formatDate(item.date)}</Text>
                      <Text style={styles.previousStats}>
                        {item.weight} lbs × {item.reps}
                      </Text>
                    </View>
                    <Text style={styles.previousComment}>{item.comment}</Text>
                    <View style={styles.reuseHint}>
                      <Ionicons name="copy-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.reuseText}>Tap to reuse</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Quick Suggestions */}
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Quick Notes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                'Felt strong',
                'Form check needed',
                'Increase weight',
                'Decrease weight',
                'Last rep was hard',
                'Easy',
                'PR attempt',
              ].map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => setComment(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    padding: Spacing.xs,
  },
  saveText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  setInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  setDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  clearButton: {
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginHorizontal: Spacing.md,
    marginTop: 4,
  },
  previousSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    maxHeight: 200,
  },
  previousTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previousList: {
    maxHeight: 160,
  },
  previousItem: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previousHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previousDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  previousStats: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  previousComment: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  reuseHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  reuseText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  suggestions: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
});
