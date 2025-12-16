/**
 * EquipmentProfileSelector.js
 *
 * Component for selecting equipment profile (preset or custom)
 * Shows preset options and allows custom equipment selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useColors } from '../context/ThemeContext';
import { EQUIPMENT_PROFILES, ALL_EQUIPMENT } from '../services/CuratedWorkoutPlans';
import UserEquipmentStorage from '../services/userEquipmentStorage';
import StyledButton from './StyledButton';

const PROFILE_ICONS = {
  'full-gym': 'fitness',
  'home-gym': 'home',
  'dumbbells-only': 'barbell',
  'bodyweight': 'body',
};

export default function EquipmentProfileSelector({ onProfileChange }) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const [selectedProfile, setSelectedProfile] = useState('full-gym');
  const [customEquipment, setCustomEquipment] = useState([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await UserEquipmentStorage.getEquipmentProfile();
      setSelectedProfile(profile.profileType);
      setCustomEquipment(profile.customEquipment || []);
      setIsCustomMode(profile.profileType === 'custom');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = async (profileType) => {
    Haptics.selectionAsync();
    setSelectedProfile(profileType);
    setIsCustomMode(false);

    const result = await UserEquipmentStorage.saveEquipmentProfile(profileType, []);
    if (result.success) {
      onProfileChange?.(profileType);
    }
  };

  const handleCustomToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!isCustomMode) {
      // Switching to custom - start with current profile's equipment
      const currentEquipment = await UserEquipmentStorage.getAvailableEquipment();
      setCustomEquipment(currentEquipment);
      setIsCustomMode(true);
      setSelectedProfile('custom');
      await UserEquipmentStorage.saveEquipmentProfile('custom', currentEquipment);
      onProfileChange?.('custom');
    } else {
      // Switching back to preset
      setIsCustomMode(false);
      handleProfileSelect('full-gym');
    }
  };

  const toggleEquipment = async (equipment) => {
    Haptics.selectionAsync();

    let newEquipment;
    if (customEquipment.includes(equipment)) {
      newEquipment = customEquipment.filter(e => e !== equipment);
    } else {
      newEquipment = [...customEquipment, equipment];
    }

    setCustomEquipment(newEquipment);
    await UserEquipmentStorage.saveEquipmentProfile('custom', newEquipment);
    onProfileChange?.('custom');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading equipment profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="barbell-outline" size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>My Equipment</Text>
      </View>
      <Text style={styles.headerSubtitle}>
        Select what equipment you have access to. Plans will be filtered and adapted based on your selection.
      </Text>

      {/* Preset Profiles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <View style={styles.profilesGrid}>
          {Object.entries(EQUIPMENT_PROFILES).map(([key, profile]) => {
            const isSelected = selectedProfile === key && !isCustomMode;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.profileCard,
                  isSelected && styles.profileCardSelected,
                ]}
                onPress={() => handleProfileSelect(key)}
              >
                <View style={[
                  styles.profileIconContainer,
                  isSelected && styles.profileIconContainerSelected,
                ]}>
                  <Ionicons
                    name={profile.icon}
                    size={28}
                    color={isSelected ? Colors.background : Colors.primary}
                  />
                </View>
                <Text style={[
                  styles.profileName,
                  isSelected && styles.profileNameSelected,
                ]}>
                  {profile.name}
                </Text>
                <Text style={styles.profileDescription} numberOfLines={2}>
                  {profile.description}
                </Text>
                <Text style={styles.equipmentCount}>
                  {profile.equipment.length} items
                </Text>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Custom Equipment Toggle */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.customToggle,
            isCustomMode && styles.customToggleActive,
          ]}
          onPress={handleCustomToggle}
        >
          <View style={styles.customToggleContent}>
            <Ionicons
              name={isCustomMode ? 'construct' : 'construct-outline'}
              size={24}
              color={isCustomMode ? Colors.primary : Colors.textSecondary}
            />
            <View style={styles.customToggleText}>
              <Text style={[
                styles.customToggleTitle,
                isCustomMode && styles.customToggleTitleActive,
              ]}>
                Custom Equipment
              </Text>
              <Text style={styles.customToggleSubtitle}>
                {isCustomMode ? 'Select individual items below' : 'Tap to customize your equipment list'}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isCustomMode ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Custom Equipment Selection */}
      {isCustomMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Equipment ({customEquipment.length} selected)
          </Text>
          <View style={styles.equipmentGrid}>
            {ALL_EQUIPMENT.map((equipment) => {
              const isSelected = customEquipment.includes(equipment);
              return (
                <TouchableOpacity
                  key={equipment}
                  style={[
                    styles.equipmentItem,
                    isSelected && styles.equipmentItemSelected,
                  ]}
                  onPress={() => toggleEquipment(equipment)}
                >
                  <Ionicons
                    name={isSelected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isSelected ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[
                    styles.equipmentText,
                    isSelected && styles.equipmentTextSelected,
                  ]}>
                    {equipment}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Current Equipment Display (when preset selected) */}
      {!isCustomMode && selectedProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Included Equipment</Text>
          <View style={styles.equipmentTags}>
            {EQUIPMENT_PROFILES[selectedProfile]?.equipment.map((eq) => (
              <View key={eq} style={styles.equipmentTag}>
                <Text style={styles.equipmentTagText}>{eq}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
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
  profilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  profileCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  profileCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  profileName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
    marginBottom: 4,
  },
  profileNameSelected: {
    color: Colors.primary,
  },
  profileDescription: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  equipmentCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customToggleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  customToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customToggleText: {
    flex: 1,
  },
  customToggleTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semiBold,
    color: Colors.text,
  },
  customToggleTitleActive: {
    color: Colors.primary,
  },
  customToggleSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  equipmentGrid: {
    gap: Spacing.xs,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentItemSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  equipmentText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  equipmentTextSelected: {
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  equipmentTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  equipmentTagText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
});
