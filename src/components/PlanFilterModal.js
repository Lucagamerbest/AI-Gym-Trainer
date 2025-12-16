/**
 * PlanFilterModal.js
 *
 * Modal for filtering workout plans
 * Includes days per week, difficulty, equipment, and workout duration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import { PLAN_CATEGORIES, EQUIPMENT_PROFILES } from '../services/CuratedWorkoutPlans';
import StyledButton from './StyledButton';

const DEFAULT_FILTERS = {
  daysPerWeek: null,
  difficulty: null,
  equipmentProfile: null,
  maxTimePerWorkout: 90,
};

export default function PlanFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
  hideSplitType = false,
}) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });

  useEffect(() => {
    if (visible) {
      setFilters({ ...DEFAULT_FILTERS, ...initialFilters });
    }
  }, [visible, initialFilters]);

  const handleChipPress = (filterKey, value) => {
    Haptics.selectionAsync();
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value,
    }));
  };

  const handleSliderChange = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const handleApply = () => {
    // Clean up filters - remove null/default values
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== DEFAULT_FILTERS[key]) {
        cleanFilters[key] = value;
      }
    });
    onApply(cleanFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({ ...DEFAULT_FILTERS });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Plans</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Days Per Week */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Days Per Week</Text>
            <View style={styles.chipsContainer}>
              {PLAN_CATEGORIES.daysPerWeek.map((days) => {
                const isSelected = filters.daysPerWeek === days;
                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleChipPress('daysPerWeek', days)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {days} days
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty</Text>
            <View style={styles.chipsContainer}>
              {PLAN_CATEGORIES.difficulties.map((item) => {
                const isSelected = filters.difficulty === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      item.color && isSelected && { backgroundColor: item.color + '30', borderColor: item.color },
                    ]}
                    onPress={() => handleChipPress('difficulty', item.value)}
                  >
                    <Text style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                      item.color && isSelected && { color: item.color },
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Equipment Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <View style={styles.chipsContainer}>
              {Object.entries(EQUIPMENT_PROFILES).map(([key, profile]) => {
                const isSelected = filters.equipmentProfile === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleChipPress('equipmentProfile', key)}
                  >
                    <Ionicons
                      name={profile.icon}
                      size={14}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {profile.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Workout Duration Slider */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionTitle}>Max Workout Time</Text>
              <Text style={styles.sliderValue}>
                {filters.maxTimePerWorkout} min
              </Text>
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>30</Text>
              <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={90}
                step={15}
                value={filters.maxTimePerWorkout}
                onValueChange={(v) => handleSliderChange('maxTimePerWorkout', v)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
              />
              <Text style={styles.sliderLabel}>90</Text>
            </View>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <StyledButton
            title="Apply Filters"
            onPress={handleApply}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
  },
  resetButton: {
    padding: Spacing.xs,
  },
  resetText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    width: 30,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
