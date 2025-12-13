/**
 * ImportPreviewCard - Preview card for imported recipes and workouts
 *
 * Displays parsed content with optional edit capability
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function ImportPreviewCard({
  data,
  contentType,
  onEdit,
  editable = false,
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState(data);

  if (!data) return null;

  // Handle field update
  const handleFieldUpdate = (field, value) => {
    const updated = { ...editedData, [field]: value };
    setEditedData(updated);
    if (onEdit) {
      onEdit(updated);
    }
  };

  // Handle nested field update (like nutrition.calories)
  const handleNestedFieldUpdate = (parent, field, value) => {
    const updated = {
      ...editedData,
      [parent]: {
        ...editedData[parent],
        [field]: value,
      },
    };
    setEditedData(updated);
    if (onEdit) {
      onEdit(updated);
    }
  };

  // Render recipe preview
  const renderRecipePreview = () => (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="restaurant" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Recipe Name</Text>
        </View>
        {editMode ? (
          <TextInput
            style={styles.editInput}
            value={editedData.name || editedData.title || ''}
            onChangeText={(text) => handleFieldUpdate('name', text)}
            placeholder="Recipe name"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={styles.titleText}>{data.name || data.title}</Text>
        )}
      </View>

      {/* Nutrition */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="nutrition" size={18} color={Colors.success} />
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
        </View>
        <View style={styles.macroGrid}>
          <MacroBox
            label="Calories"
            value={editedData.nutrition?.calories}
            unit="cal"
            color={Colors.warning}
            editable={editMode}
            onEdit={(val) => handleNestedFieldUpdate('nutrition', 'calories', parseInt(val) || 0)}
          />
          <MacroBox
            label="Protein"
            value={editedData.nutrition?.protein}
            unit="g"
            color={Colors.success}
            editable={editMode}
            onEdit={(val) => handleNestedFieldUpdate('nutrition', 'protein', parseInt(val) || 0)}
          />
          <MacroBox
            label="Carbs"
            value={editedData.nutrition?.carbs}
            unit="g"
            color={Colors.info}
            editable={editMode}
            onEdit={(val) => handleNestedFieldUpdate('nutrition', 'carbs', parseInt(val) || 0)}
          />
          <MacroBox
            label="Fat"
            value={editedData.nutrition?.fat}
            unit="g"
            color={Colors.error}
            editable={editMode}
            onEdit={(val) => handleNestedFieldUpdate('nutrition', 'fat', parseInt(val) || 0)}
          />
        </View>
      </View>

      {/* Time & Servings */}
      <View style={styles.section}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.prepTime || 'Unknown'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flame" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.cookTime || 'Unknown'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.servings || 1} servings</Text>
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Ingredients ({data.ingredients?.length || 0})</Text>
        </View>
        <View style={styles.ingredientsList}>
          {(data.ingredients || []).map((ing, index) => (
            <Text key={index} style={styles.ingredientText}>
              • {ing.original || `${ing.quantity || ''}${ing.unit || ''} ${ing.food?.name || ing.name || 'Unknown'}`}
            </Text>
          ))}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Instructions ({data.instructions?.length || 0} steps)</Text>
        </View>
        <View style={styles.instructionsList}>
          {(data.instructions || []).map((inst, index) => (
            <Text key={index} style={styles.instructionText}>
              {index + 1}. {inst}
            </Text>
          ))}
        </View>
      </View>

      {/* Edit toggle */}
      {editable && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'pencil'}
            size={18}
            color={Colors.text}
          />
          <Text style={styles.editButtonText}>
            {editMode ? 'Done Editing' : 'Edit Details'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render workout preview
  const renderWorkoutPreview = () => (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Workout Name</Text>
        </View>
        {editMode ? (
          <TextInput
            style={styles.editInput}
            value={editedData.name || editedData.title || ''}
            onChangeText={(text) => handleFieldUpdate('name', text)}
            placeholder="Workout name"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={styles.titleText}>{data.name || data.title}</Text>
        )}
      </View>

      {/* Workout Info */}
      <View style={styles.section}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="fitness" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.type || 'Custom'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.days?.length || 1} days</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="trending-up" size={16} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{data.difficulty || 'Intermediate'}</Text>
          </View>
        </View>
      </View>

      {/* Days/Exercises - handle both standalone (data.day) and programs (data.days) */}
      {(data.isStandalone && data.day ? [data.day] : (data.days || [])).map((day, dayIndex) => (
        <View key={day.id || `day_${dayIndex}`} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={Colors.info} />
            <Text style={styles.sectionTitle}>
              {day.name || `Day ${dayIndex + 1}`}
            </Text>
          </View>

          {/* Muscle groups */}
          {day.muscleGroups && day.muscleGroups.length > 0 && (
            <View style={styles.tagRow}>
              {day.muscleGroups.map((muscle, i) => (
                <View key={`muscle_${i}`} style={styles.tag}>
                  <Text style={styles.tagText}>{muscle}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Exercises */}
          <View style={styles.exerciseList}>
            {(day.exercises || []).map((ex, exIndex) => (
              <View key={ex.id || `ex_${dayIndex}_${exIndex}`} style={styles.exerciseRow}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex.name}
                </Text>
                <Text style={styles.exerciseSets}>
                  {ex.sets?.length || 3} sets
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Edit toggle */}
      {editable && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'pencil'}
            size={18}
            color={Colors.text}
          />
          <Text style={styles.editButtonText}>
            {editMode ? 'Done Editing' : 'Edit Details'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render based on content type
  return contentType === 'recipe' ? renderRecipePreview() : renderWorkoutPreview();
}

// Macro box component
function MacroBox({ label, value, unit, color, editable, onEdit }) {
  return (
    <View style={[styles.macroBox, { borderColor: color + '40' }]}>
      {editable ? (
        <TextInput
          style={[styles.macroValue, { color }]}
          value={String(value || 0)}
          onChangeText={onEdit}
          keyboardType="numeric"
        />
      ) : (
        <Text style={[styles.macroValue, { color }]}>
          {value || 0}
        </Text>
      )}
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  titleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  editInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Macro grid
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  macroBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    minWidth: 40,
  },
  macroUnit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  macroLabel: {
    fontSize: Typography.fontSize.xxs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Ingredients
  ingredientsList: {
    gap: Spacing.xs,
  },
  ingredientText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },

  // Instructions
  instructionsList: {
    gap: Spacing.sm,
  },
  instructionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },

  // More text
  moreText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    textTransform: 'capitalize',
  },

  // Exercise list
  exerciseList: {
    gap: Spacing.xs,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  exerciseName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  exerciseSets: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },

  // Edit button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
});
