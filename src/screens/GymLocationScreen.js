import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LocationService } from '../services/LocationService';

export default function GymLocationScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  const styles = useMemo(() => createStyles(colors), [colors]);

  // State
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingGym, setAddingGym] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [permissions, setPermissions] = useState({ foreground: false, background: false, isExpoGo: false });

  // Load gyms and settings when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [userId])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedGyms, settings, perms] = await Promise.all([
        LocationService.getGymLocations(userId),
        LocationService.getSettings(userId),
        LocationService.checkPermissions(),
      ]);
      setGyms(savedGyms);
      setReminderEnabled(settings.enabled);
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading gym data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const result = await LocationService.getCurrentLocation();
      if (result.success) {
        setCurrentLocation(result.location);
        // Try to get address
        const geoResult = await LocationService.reverseGeocode(
          result.location.latitude,
          result.location.longitude
        );
        if (geoResult.success) {
          setCurrentLocation((prev) => ({ ...prev, address: geoResult.address }));
        }
      } else {
        Alert.alert('Location Error', result.error || 'Could not get current location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleAddGym = async () => {
    if (!currentLocation) {
      Alert.alert('No Location', 'Please get your current location first');
      return;
    }

    if (!newGymName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your gym');
      return;
    }

    try {
      const result = await LocationService.saveGymLocation(
        {
          name: newGymName.trim(),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address?.formatted || '',
        },
        userId
      );

      if (result.success) {
        setGyms((prev) => [...prev, result.gym]);
        setAddingGym(false);
        setNewGymName('');
        setCurrentLocation(null);
        Alert.alert('Success', `${result.gym.name} has been added!`);
      } else {
        Alert.alert('Error', result.error || 'Failed to save gym');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save gym location');
    }
  };

  const handleDeleteGym = (gym) => {
    Alert.alert(
      'Delete Gym',
      `Are you sure you want to delete "${gym.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await LocationService.deleteGymLocation(gym.id, userId);
            if (result.success) {
              setGyms((prev) => prev.filter((g) => g.id !== gym.id));
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (gym) => {
    const result = await LocationService.updateGymLocation(gym.id, { isPrimary: true }, userId);
    if (result.success) {
      setGyms((prev) =>
        prev.map((g) => ({
          ...g,
          isPrimary: g.id === gym.id,
        }))
      );
    }
  };

  const handleToggleReminder = async (value) => {
    // In Expo Go, we can still save the setting but background won't work
    if (value && !permissions.background && !permissions.isExpoGo) {
      // Request background permission (only in custom build)
      const granted = await LocationService.requestBackgroundPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Background location permission is needed to remind you when you arrive at the gym. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      setPermissions((prev) => ({ ...prev, background: true }));
    }

    await LocationService.setGymReminderEnabled(value, userId);
    setReminderEnabled(value);

    // Only start/stop background tracking if not in Expo Go
    if (!permissions.isExpoGo) {
      if (value) {
        // Start background tracking
        await LocationService.startBackgroundLocationTracking();
      } else {
        // Stop background tracking
        await LocationService.stopBackgroundLocationTracking();
      }
    }
  };

  const handleRequestPermissions = async () => {
    // First try foreground permission
    const foregroundGranted = await LocationService.requestForegroundPermission();

    if (!foregroundGranted) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required for this feature. Please enable it in your device settings.'
      );
      return;
    }

    // Try background permission (will fail gracefully in Expo Go)
    const backgroundGranted = await LocationService.requestBackgroundPermission();

    setPermissions({
      foreground: foregroundGranted,
      background: backgroundGranted,
      isExpoGo: foregroundGranted && !backgroundGranted,
    });
  };

  if (loading) {
    return (
      <ScreenLayout title="Gym Location" navigation={navigation} showBack showHome>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Gym Location"
      subtitle="Auto-remind when you arrive"
      navigation={navigation}
      showBack
      showHome
    >
      {/* Expo Go Notice */}
      {permissions.isExpoGo && (
        <StyledCard variant="elevated" style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>Running in Expo Go</Text>
          <Text style={styles.warningText}>
            Background location tracking requires a custom build. You can still test:
          </Text>
          <Text style={styles.bulletPoint}>- Adding/managing gym locations</Text>
          <Text style={styles.bulletPoint}>- Location capture</Text>
          <Text style={styles.bulletPoint}>- UI and settings</Text>
          <Text style={[styles.warningText, { marginTop: 8 }]}>
            Auto-reminders will work after your next app build.
          </Text>
        </StyledCard>
      )}

      {/* Permissions Warning */}
      {!permissions.foreground && !permissions.isExpoGo && (
        <StyledCard variant="elevated" style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningTitle}>Location Permission Required</Text>
          <Text style={styles.warningText}>
            To use gym reminders, we need access to your location.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermissions}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </StyledCard>
      )}

      {/* Enable/Disable Toggle */}
      <StyledCard variant="elevated" style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleTitle}>Gym Arrival Reminders</Text>
            <Text style={styles.toggleDescription}>
              Get notified to start a workout when you arrive at your gym
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={reminderEnabled ? colors.primary : colors.textMuted}
            disabled={!permissions.foreground}
          />
        </View>
      </StyledCard>

      {/* Saved Gyms */}
      <Text style={styles.sectionHeader}>Your Gyms</Text>

      {gyms.length === 0 ? (
        <StyledCard variant="elevated" style={styles.card}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No gyms saved</Text>
            <Text style={styles.emptyText}>
              Add your gym location to get reminded when you arrive
            </Text>
          </View>
        </StyledCard>
      ) : (
        gyms.map((gym) => (
          <StyledCard key={gym.id} variant="elevated" style={styles.card}>
            <View style={styles.gymRow}>
              <View style={styles.gymIcon}>
                <Text style={styles.gymEmoji}>{gym.isPrimary ? '⭐' : '🏋️'}</Text>
              </View>
              <View style={styles.gymContent}>
                <View style={styles.gymNameRow}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  {gym.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                {gym.address && <Text style={styles.gymAddress}>{gym.address}</Text>}
                <Text style={styles.gymCoords}>
                  Exact location: {gym.latitude.toFixed(6)}, {gym.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
            <View style={styles.gymActions}>
              {!gym.isPrimary && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetPrimary(gym)}
                >
                  <Text style={styles.actionButtonText}>Set Primary</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteGym(gym)}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </StyledCard>
        ))
      )}

      {/* Add Gym Section */}
      {!addingGym ? (
        <View style={styles.addGymButtons}>
          <TouchableOpacity
            style={styles.addGymButton}
            onPress={() => navigation.navigate('GymMap')}
            activeOpacity={0.7}
          >
            <Text style={styles.addGymButtonText}>Find on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addGymButton, styles.addGymButtonSecondary]}
            onPress={() => setAddingGym(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.addGymButtonText, styles.addGymButtonTextSecondary]}>
              Use Current Location
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <StyledCard variant="elevated" style={styles.card}>
          <Text style={styles.addGymTitle}>Add New Gym</Text>

          {/* Get Location Button */}
          <TouchableOpacity
            style={[styles.locationButton, currentLocation && styles.locationButtonSuccess]}
            onPress={handleGetCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Text style={styles.locationButtonIcon}>
                  {currentLocation ? '✓' : '📍'}
                </Text>
                <Text style={styles.locationButtonText}>
                  {currentLocation ? 'Location Captured!' : 'Get Current Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {currentLocation && (
            <View style={styles.locationPreview}>
              <Text style={styles.locationPreviewText}>
                {currentLocation.address?.formatted ||
                  `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}

          {/* Gym Name Input */}
          <TextInput
            style={styles.input}
            placeholder="Gym name (e.g., Planet Fitness Downtown)"
            placeholderTextColor={colors.textMuted}
            value={newGymName}
            onChangeText={setNewGymName}
          />

          {/* Action Buttons */}
          <View style={styles.addGymActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setAddingGym(false);
                setNewGymName('');
                setCurrentLocation(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (!currentLocation || !newGymName.trim()) && styles.saveButtonDisabled]}
              onPress={handleAddGym}
              disabled={!currentLocation || !newGymName.trim()}
            >
              <Text style={styles.saveButtonText}>Save Gym</Text>
            </TouchableOpacity>
          </View>
        </StyledCard>
      )}

      {/* Info Section */}
      <StyledCard variant="elevated" style={[styles.card, styles.infoCard]}>
        <Text style={styles.infoTitle}>How it works</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>1.</Text>
          <Text style={styles.infoText}>
            Add your gym location while you're at the gym
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>2.</Text>
          <Text style={styles.infoText}>
            When you arrive at your gym, we'll wait about 5 minutes
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>3.</Text>
          <Text style={styles.infoText}>
            If you haven't started a workout, you'll get a reminder
          </Text>
        </View>
      </StyledCard>
    </ScreenLayout>
  );
}

const createStyles = (Colors) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      color: Colors.textSecondary,
      fontSize: Typography.fontSize.md,
    },
    card: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
    },
    warningCard: {
      backgroundColor: Colors.warning + '20',
      borderLeftWidth: 4,
      borderLeftColor: Colors.warning,
    },
    warningTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.warning,
      marginBottom: Spacing.xs,
    },
    warningText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    permissionButton: {
      backgroundColor: Colors.warning,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignSelf: 'flex-start',
    },
    permissionButtonText: {
      color: Colors.background,
      fontWeight: '600',
      fontSize: Typography.fontSize.md,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleContent: {
      flex: 1,
      marginRight: Spacing.md,
    },
    toggleTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 4,
    },
    toggleDescription: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    sectionHeader: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: Spacing.md,
      marginTop: Spacing.md,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: Spacing.md,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: Spacing.xs,
    },
    emptyText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    gymRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    gymIcon: {
      width: 50,
      height: 50,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    gymEmoji: {
      fontSize: 24,
    },
    gymContent: {
      flex: 1,
    },
    gymNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    gymName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
    },
    primaryBadge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    primaryBadgeText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
      color: Colors.background,
    },
    gymAddress: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginTop: 4,
    },
    gymCoords: {
      fontSize: Typography.fontSize.xs,
      color: Colors.textMuted,
      marginTop: 2,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    gymActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    actionButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.surface,
    },
    actionButtonText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.primary,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: Colors.error + '20',
    },
    deleteButtonText: {
      color: Colors.error,
    },
    addGymButtons: {
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    addGymButton: {
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    addGymButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    addGymButtonText: {
      color: Colors.background,
      fontWeight: 'bold',
      fontSize: Typography.fontSize.md,
    },
    addGymButtonTextSecondary: {
      color: Colors.primary,
    },
    addGymTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    locationButtonSuccess: {
      backgroundColor: Colors.success,
    },
    locationButtonIcon: {
      fontSize: 20,
    },
    locationButtonText: {
      color: Colors.background,
      fontWeight: '600',
      fontSize: Typography.fontSize.md,
    },
    locationPreview: {
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    locationPreviewText: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    addGymActions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.surface,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: Colors.textSecondary,
      fontWeight: '600',
      fontSize: Typography.fontSize.md,
    },
    saveButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.primary,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: Colors.background,
      fontWeight: '600',
      fontSize: Typography.fontSize.md,
    },
    infoCard: {
      marginTop: Spacing.lg,
      backgroundColor: Colors.surface,
    },
    infoTitle: {
      fontSize: Typography.fontSize.md,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    infoItem: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    infoBullet: {
      fontSize: Typography.fontSize.sm,
      color: Colors.primary,
      fontWeight: 'bold',
      width: 24,
    },
    infoText: {
      flex: 1,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
    },
    bulletPoint: {
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      marginLeft: Spacing.md,
      marginTop: 4,
    },
  });
