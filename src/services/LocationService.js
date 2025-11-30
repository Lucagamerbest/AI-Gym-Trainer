import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Task name for background location updates
const BACKGROUND_LOCATION_TASK = 'background-gym-location-task';

// Storage keys
const STORAGE_KEYS = {
  GYM_LOCATIONS: '@gym_locations',
  LOCATION_SETTINGS: '@location_settings',
  LAST_GYM_ARRIVAL: '@last_gym_arrival',
  GYM_REMINDER_ENABLED: '@gym_reminder_enabled',
};

// Default geofence settings
const DEFAULT_SETTINGS = {
  geofenceRadius: 100, // meters
  reminderDelay: 5 * 60 * 1000, // 5 minutes in ms
  enabled: false,
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export class LocationService {
  // ==================== PERMISSIONS ====================

  static async requestForegroundPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting foreground location permission:', error);
      return false;
    }
  }

  static async requestBackgroundPermission() {
    try {
      // First ensure foreground permission is granted
      const foregroundGranted = await this.requestForegroundPermission();
      if (!foregroundGranted) return false;

      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      // In Expo Go, background permissions aren't available
      // This is expected - background location requires a custom build
      console.log('Background location permission not available (requires custom build):', error.message);
      return false;
    }
  }

  static async checkPermissions() {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      let background = { status: 'undetermined' };

      try {
        background = await Location.getBackgroundPermissionsAsync();
      } catch (bgError) {
        // Background permissions not available in Expo Go
        console.log('Background permission check not available (Expo Go)');
      }

      return {
        foreground: foreground.status === 'granted',
        background: background.status === 'granted',
        isExpoGo: background.status === 'undetermined' && foreground.status !== 'undetermined',
      };
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return { foreground: false, background: false, isExpoGo: false };
    }
  }

  // ==================== CURRENT LOCATION ====================

  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestForegroundPermission();
      if (!hasPermission) {
        return { success: false, error: 'Location permission not granted' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        },
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return { success: false, error: error.message };
    }
  }

  static async reverseGeocode(latitude, longitude) {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const addr = results[0];
        return {
          success: true,
          address: {
            street: addr.street,
            city: addr.city,
            region: addr.region,
            country: addr.country,
            postalCode: addr.postalCode,
            formatted: [addr.street, addr.city, addr.region].filter(Boolean).join(', '),
          },
        };
      }
      return { success: false, error: 'No address found' };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== GYM LOCATIONS MANAGEMENT ====================

  static async saveGymLocation(gymData, userId = 'guest') {
    try {
      const gyms = await this.getGymLocations(userId);

      const newGym = {
        id: Date.now().toString(),
        name: gymData.name || 'My Gym',
        latitude: gymData.latitude,
        longitude: gymData.longitude,
        address: gymData.address || '',
        isPrimary: gyms.length === 0, // First gym is primary
        createdAt: new Date().toISOString(),
      };

      gyms.push(newGym);

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.GYM_LOCATIONS}_${userId}`,
        JSON.stringify(gyms)
      );

      // Sync to Firebase
      await this.syncGymLocationsToFirebase(gyms, userId);

      return { success: true, gym: newGym };
    } catch (error) {
      console.error('Error saving gym location:', error);
      return { success: false, error: error.message };
    }
  }

  static async getGymLocations(userId = 'guest') {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.GYM_LOCATIONS}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting gym locations:', error);
      return [];
    }
  }

  static async updateGymLocation(gymId, updates, userId = 'guest') {
    try {
      const gyms = await this.getGymLocations(userId);
      const index = gyms.findIndex((g) => g.id === gymId);

      if (index === -1) {
        return { success: false, error: 'Gym not found' };
      }

      gyms[index] = { ...gyms[index], ...updates, updatedAt: new Date().toISOString() };

      // If setting as primary, unset others
      if (updates.isPrimary) {
        gyms.forEach((g, i) => {
          if (i !== index) g.isPrimary = false;
        });
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.GYM_LOCATIONS}_${userId}`,
        JSON.stringify(gyms)
      );

      await this.syncGymLocationsToFirebase(gyms, userId);

      return { success: true, gym: gyms[index] };
    } catch (error) {
      console.error('Error updating gym location:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteGymLocation(gymId, userId = 'guest') {
    try {
      let gyms = await this.getGymLocations(userId);
      const deletedGym = gyms.find((g) => g.id === gymId);
      gyms = gyms.filter((g) => g.id !== gymId);

      // If deleted gym was primary, set first remaining as primary
      if (deletedGym?.isPrimary && gyms.length > 0) {
        gyms[0].isPrimary = true;
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.GYM_LOCATIONS}_${userId}`,
        JSON.stringify(gyms)
      );

      await this.syncGymLocationsToFirebase(gyms, userId);

      return { success: true };
    } catch (error) {
      console.error('Error deleting gym location:', error);
      return { success: false, error: error.message };
    }
  }

  static async getPrimaryGym(userId = 'guest') {
    const gyms = await this.getGymLocations(userId);
    return gyms.find((g) => g.isPrimary) || gyms[0] || null;
  }

  // ==================== FIREBASE SYNC ====================

  static async syncGymLocationsToFirebase(gyms, userId) {
    if (userId === 'guest') return;

    try {
      const db = getFirestore();
      await setDoc(
        doc(db, 'users', userId),
        { gymLocations: gyms, gymLocationsUpdatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error syncing gym locations to Firebase:', error);
    }
  }

  static async loadGymLocationsFromFirebase(userId) {
    if (userId === 'guest') return null;

    try {
      const db = getFirestore();
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists() && docSnap.data().gymLocations) {
        const gyms = docSnap.data().gymLocations;
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.GYM_LOCATIONS}_${userId}`,
          JSON.stringify(gyms)
        );
        return gyms;
      }
      return null;
    } catch (error) {
      console.error('Error loading gym locations from Firebase:', error);
      return null;
    }
  }

  // ==================== SETTINGS ====================

  static async getSettings(userId = 'guest') {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.LOCATION_SETTINGS}_${userId}`);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting location settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(updates, userId = 'guest') {
    try {
      const current = await this.getSettings(userId);
      const newSettings = { ...current, ...updates };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LOCATION_SETTINGS}_${userId}`,
        JSON.stringify(newSettings)
      );

      return { success: true, settings: newSettings };
    } catch (error) {
      console.error('Error updating location settings:', error);
      return { success: false, error: error.message };
    }
  }

  static async isGymReminderEnabled(userId = 'guest') {
    const settings = await this.getSettings(userId);
    return settings.enabled;
  }

  static async setGymReminderEnabled(enabled, userId = 'guest') {
    return this.updateSettings({ enabled }, userId);
  }

  // ==================== GEOFENCING LOGIC ====================

  static async checkIfAtGym(userId = 'guest') {
    try {
      const locationResult = await this.getCurrentLocation();
      if (!locationResult.success) {
        return { isAtGym: false, error: locationResult.error };
      }

      const gyms = await this.getGymLocations(userId);
      if (gyms.length === 0) {
        return { isAtGym: false, error: 'No gym locations saved' };
      }

      const settings = await this.getSettings(userId);
      const { latitude, longitude } = locationResult.location;

      for (const gym of gyms) {
        const distance = calculateDistance(latitude, longitude, gym.latitude, gym.longitude);

        if (distance <= settings.geofenceRadius) {
          return {
            isAtGym: true,
            gym,
            distance,
            currentLocation: locationResult.location,
          };
        }
      }

      return {
        isAtGym: false,
        nearestGym: this.findNearestGym(latitude, longitude, gyms),
        currentLocation: locationResult.location,
      };
    } catch (error) {
      console.error('Error checking if at gym:', error);
      return { isAtGym: false, error: error.message };
    }
  }

  static findNearestGym(latitude, longitude, gyms) {
    if (!gyms || gyms.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const gym of gyms) {
      const distance = calculateDistance(latitude, longitude, gym.latitude, gym.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { ...gym, distance };
      }
    }

    return nearest;
  }

  // ==================== GYM ARRIVAL TRACKING ====================

  static async recordGymArrival(gymId, userId = 'guest') {
    try {
      const arrival = {
        gymId,
        timestamp: Date.now(),
        notificationSent: false,
      };

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LAST_GYM_ARRIVAL}_${userId}`,
        JSON.stringify(arrival)
      );

      return arrival;
    } catch (error) {
      console.error('Error recording gym arrival:', error);
      return null;
    }
  }

  static async getLastGymArrival(userId = 'guest') {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.LAST_GYM_ARRIVAL}_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting last gym arrival:', error);
      return null;
    }
  }

  static async markNotificationSent(userId = 'guest') {
    try {
      const arrival = await this.getLastGymArrival(userId);
      if (arrival) {
        arrival.notificationSent = true;
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.LAST_GYM_ARRIVAL}_${userId}`,
          JSON.stringify(arrival)
        );
      }
    } catch (error) {
      console.error('Error marking notification sent:', error);
    }
  }

  static async clearGymArrival(userId = 'guest') {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.LAST_GYM_ARRIVAL}_${userId}`);
    } catch (error) {
      console.error('Error clearing gym arrival:', error);
    }
  }

  // ==================== GYM REMINDER NOTIFICATION ====================

  static async sendGymReminderNotification(gym) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "You're at the gym! 💪",
          body: `Did you forget to start a workout? You're at ${gym.name}. Tap to begin tracking!`,
          data: { type: 'gym_reminder', gymId: gym.id, action: 'start_workout' },
          sound: 'default',
        },
        trigger: null, // Immediate
      });

      console.log('Gym reminder notification sent');
      return true;
    } catch (error) {
      console.error('Error sending gym reminder notification:', error);
      return false;
    }
  }

  // ==================== BACKGROUND LOCATION TASK ====================

  static async startBackgroundLocationTracking() {
    try {
      const hasPermission = await this.requestBackgroundPermission();
      if (!hasPermission) {
        console.log('Background location permission not granted');
        return false;
      }

      // Check if task is already running
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        console.log('Background location task already running');
        return true;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5 * 60 * 1000, // 5 minutes
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 5 * 60 * 1000,
        showsBackgroundLocationIndicator: false,
        foregroundService: {
          notificationTitle: 'Workout Wave',
          notificationBody: 'Monitoring gym location for workout reminders',
          notificationColor: '#4CAF50',
        },
      });

      console.log('Background location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting background location tracking:', error);
      return false;
    }
  }

  static async stopBackgroundLocationTracking() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location tracking stopped');
      }
      return true;
    } catch (error) {
      console.error('Error stopping background location tracking:', error);
      return false;
    }
  }

  static async isBackgroundTrackingActive() {
    try {
      return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    } catch (error) {
      console.error('Error checking background tracking status:', error);
      return false;
    }
  }
}

// Export task name for registration in App.js
export const LOCATION_TASK_NAME = BACKGROUND_LOCATION_TASK;

// Export distance calculation for external use
export { calculateDistance };
