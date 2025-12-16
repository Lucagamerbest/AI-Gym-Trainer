/**
 * userEquipmentStorage.js
 *
 * Service for storing and managing user's equipment profile
 * Supports preset profiles (Full Gym, Home Gym, etc.) and custom equipment selection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EQUIPMENT_PROFILES } from './CuratedWorkoutPlans';

const EQUIPMENT_PROFILE_KEY = '@user_equipment_profile';

class UserEquipmentStorage {
  /**
   * Get user's equipment profile
   * @returns {Promise<Object>} Equipment profile with profileType and customEquipment
   */
  async getEquipmentProfile() {
    try {
      const stored = await AsyncStorage.getItem(EQUIPMENT_PROFILE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Default to full gym if not set
      return {
        profileType: 'full-gym',
        customEquipment: [],
        lastUpdated: null,
      };
    } catch (error) {
      console.error('Error getting equipment profile:', error);
      return {
        profileType: 'full-gym',
        customEquipment: [],
        lastUpdated: null,
      };
    }
  }

  /**
   * Save equipment profile
   * @param {string} profileType - 'full-gym', 'home-gym', 'dumbbells-only', 'bodyweight', or 'custom'
   * @param {Array<string>} customEquipment - Array of equipment names (used when profileType is 'custom')
   * @returns {Promise<Object>} Success/failure result
   */
  async saveEquipmentProfile(profileType, customEquipment = []) {
    try {
      const profile = {
        profileType,
        customEquipment: profileType === 'custom' ? customEquipment : [],
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(EQUIPMENT_PROFILE_KEY, JSON.stringify(profile));
      return { success: true, profile };
    } catch (error) {
      console.error('Error saving equipment profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available equipment list based on user's profile
   * @returns {Promise<Array<string>>} List of equipment names the user has access to
   */
  async getAvailableEquipment() {
    const profile = await this.getEquipmentProfile();

    if (profile.profileType === 'custom') {
      return profile.customEquipment;
    }

    // Get equipment from preset profile
    const presetProfile = EQUIPMENT_PROFILES[profile.profileType];
    return presetProfile?.equipment || EQUIPMENT_PROFILES['full-gym'].equipment;
  }

  /**
   * Check if user has specific equipment
   * @param {string} equipmentName - Name of equipment to check
   * @returns {Promise<boolean>} True if user has the equipment
   */
  async hasEquipment(equipmentName) {
    const available = await this.getAvailableEquipment();
    return available.some(eq =>
      eq.toLowerCase() === equipmentName.toLowerCase()
    );
  }

  /**
   * Check if user has any of the specified equipment options
   * @param {Array<string>} equipmentOptions - Array of equipment names to check
   * @returns {Promise<string|null>} First matching equipment or null
   */
  async getFirstAvailableEquipment(equipmentOptions) {
    const available = await this.getAvailableEquipment();

    for (const option of equipmentOptions) {
      const hasIt = available.some(eq =>
        eq.toLowerCase() === option.toLowerCase()
      );
      if (hasIt) return option;
    }
    return null;
  }

  /**
   * Add equipment to custom profile
   * @param {string} equipmentName - Equipment to add
   * @returns {Promise<Object>} Updated profile
   */
  async addCustomEquipment(equipmentName) {
    const profile = await this.getEquipmentProfile();

    // Convert to custom if not already
    if (profile.profileType !== 'custom') {
      // Start custom profile with current preset equipment
      const currentEquipment = await this.getAvailableEquipment();
      profile.customEquipment = [...currentEquipment];
      profile.profileType = 'custom';
    }

    // Add if not already present
    if (!profile.customEquipment.includes(equipmentName)) {
      profile.customEquipment.push(equipmentName);
    }

    return this.saveEquipmentProfile('custom', profile.customEquipment);
  }

  /**
   * Remove equipment from custom profile
   * @param {string} equipmentName - Equipment to remove
   * @returns {Promise<Object>} Updated profile
   */
  async removeCustomEquipment(equipmentName) {
    const profile = await this.getEquipmentProfile();

    if (profile.profileType !== 'custom') {
      // Convert to custom first
      const currentEquipment = await this.getAvailableEquipment();
      profile.customEquipment = currentEquipment.filter(
        eq => eq.toLowerCase() !== equipmentName.toLowerCase()
      );
      profile.profileType = 'custom';
    } else {
      profile.customEquipment = profile.customEquipment.filter(
        eq => eq.toLowerCase() !== equipmentName.toLowerCase()
      );
    }

    return this.saveEquipmentProfile('custom', profile.customEquipment);
  }

  /**
   * Reset to a preset profile
   * @param {string} profileType - Preset profile type
   * @returns {Promise<Object>} Result
   */
  async resetToPreset(profileType) {
    if (!EQUIPMENT_PROFILES[profileType]) {
      return { success: false, error: 'Invalid profile type' };
    }
    return this.saveEquipmentProfile(profileType, []);
  }

  /**
   * Get all equipment profile options for display
   * @returns {Array<Object>} Array of profile options with details
   */
  getProfileOptions() {
    return Object.entries(EQUIPMENT_PROFILES).map(([key, profile]) => ({
      id: key,
      name: profile.name,
      description: profile.description,
      icon: profile.icon,
      equipmentCount: profile.equipment.length,
      equipment: profile.equipment,
    }));
  }
}

export default new UserEquipmentStorage();
