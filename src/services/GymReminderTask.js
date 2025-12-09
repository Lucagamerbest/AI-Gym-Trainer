/**
 * Gym Reminder Background Task
 *
 * This task runs in the background to check if the user is at their gym
 * and sends a reminder if they haven't started a workout.
 *
 * Uses two approaches:
 * 1. Geofencing (iOS) - More reliable for region entry/exit detection
 * 2. Background location updates (Android fallback)
 */

import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LocationService, LOCATION_TASK_NAME, GEOFENCING_TASK_NAME, calculateDistance } from './LocationService';

// Storage keys
const ACTIVE_WORKOUT_KEY = '@active_workout_state';
const LAST_REMINDER_KEY = '@last_gym_reminder';
const SCHEDULED_NOTIFICATION_KEY = '@scheduled_gym_notification';

// Constants
const DEBUG_MODE = false; // Set to true for 30s testing, false for 5 minute production delay
const REMINDER_DELAY_MS = DEBUG_MODE ? 30 * 1000 : 5 * 60 * 1000; // 30 seconds for testing, 5 minutes for production
const REMINDER_DELAY_SECONDS = DEBUG_MODE ? 30 : 5 * 60; // 30 seconds for testing, 5 minutes for production
const REMINDER_COOLDOWN_MS = DEBUG_MODE ? 60 * 1000 : 10 * 60 * 1000; // 1 minute for testing, 10 minutes for production
const GEOFENCE_RADIUS = 100; // meters

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the current user ID from AsyncStorage
 */
const getCurrentUserId = async () => {
  try {
    // First try the dedicated gym reminder user ID (most reliable for background tasks)
    const gymUserId = await AsyncStorage.getItem('@gym_reminder_user_id');
    if (gymUserId) {
      console.log(`🔑 Found user in '@gym_reminder_user_id': ${gymUserId}`);
      return gymUserId;
    }

    // Try 'user' key (main storage location)
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log(`🔑 Found user in 'user' key: ${parsed?.uid}`);
      return parsed?.uid || 'guest';
    }

    // Fallback to 'authState' key (legacy)
    const authState = await AsyncStorage.getItem('authState');
    if (authState) {
      const parsed = JSON.parse(authState);
      console.log(`🔑 Found user in 'authState' key: ${parsed?.user?.uid}`);
      return parsed?.user?.uid || 'guest';
    }

    console.log('🔑 No user found, using guest');
    return 'guest';
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'guest';
  }
};

/**
 * Check if we should send a reminder (cooldown logic)
 */
const shouldSendReminder = async () => {
  try {
    const lastReminder = await AsyncStorage.getItem(LAST_REMINDER_KEY);
    if (!lastReminder) return true;

    const lastTime = parseInt(lastReminder, 10);
    const elapsed = Date.now() - lastTime;
    return elapsed > REMINDER_COOLDOWN_MS;
  } catch (error) {
    return true;
  }
};

/**
 * Record that we sent a reminder
 */
const recordReminderSent = async () => {
  try {
    await AsyncStorage.setItem(LAST_REMINDER_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error recording reminder:', error);
  }
};

/**
 * Check if a workout is currently active
 */
export const isWorkoutCurrentlyActive = async () => {
  try {
    const data = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!data) return false;
    const state = JSON.parse(data);
    return state.isActive === true;
  } catch (error) {
    console.error('Error checking workout state:', error);
    return false;
  }
};

// ==================== NOTIFICATION FUNCTIONS ====================

/**
 * Cancel any scheduled gym reminder notification
 */
export const cancelScheduledGymReminder = async () => {
  try {
    const data = await AsyncStorage.getItem(SCHEDULED_NOTIFICATION_KEY);
    if (data) {
      const { notificationId } = JSON.parse(data);
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATION_KEY);
      console.log('Cancelled scheduled gym reminder');
    }
  } catch (error) {
    console.error('Error cancelling scheduled gym reminder:', error);
  }
};

/**
 * Ensure notification permissions are granted
 */
const ensureNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`📱 Current notification permission: ${existingStatus}`);

    if (existingStatus !== 'granted') {
      console.log('📱 Requesting notification permission...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        },
      });
      console.log(`📱 New notification permission: ${status}`);
      return status === 'granted';
    }
    return true;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a delayed gym reminder notification (for geofencing approach)
 * This schedules the notification for 5 minutes in the future (30 seconds in debug mode)
 */
const scheduleDelayedGymReminder = async (gymName, gymId) => {
  try {
    console.log('========================================');
    console.log('🏋️ GYM REMINDER DEBUG - SCHEDULING START');
    console.log(`📍 Gym: ${gymName} (ID: ${gymId})`);
    console.log(`⏱️ Delay: ${REMINDER_DELAY_SECONDS} seconds (DEBUG_MODE: ${DEBUG_MODE})`);
    console.log('========================================');

    // Ensure notification permissions
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permission not granted!');
      return null;
    }
    console.log('✅ Notification permission granted');

    // Check cooldown first
    const canSend = await shouldSendReminder();
    if (!canSend) {
      console.log('❌ Skipping gym reminder - cooldown active');
      return null;
    }
    console.log('✅ Cooldown check passed');

    // Check if workout is already active
    const workoutActive = await isWorkoutCurrentlyActive();
    if (workoutActive) {
      console.log('❌ Skipping gym reminder - workout already active');
      return null;
    }
    console.log('✅ No active workout');

    // Cancel any existing scheduled notification
    await cancelScheduledGymReminder();
    console.log('✅ Cleared any previous scheduled notifications');

    // Create notification channel for gym reminders (Android)
    await Notifications.setNotificationChannelAsync('gym-reminder', {
      name: 'Gym Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'notification.mp3',
    });

    const scheduledTime = new Date(Date.now() + REMINDER_DELAY_SECONDS * 1000);
    console.log(`📅 Notification scheduled for: ${scheduledTime.toLocaleTimeString()}`);

    // Schedule notification with TimeIntervalTriggerInput format
    // Note: There's a known bug in Expo SDK 52+ where notifications may fire immediately
    // Using explicit type declaration as workaround
    console.log(`📅 Will trigger in ${REMINDER_DELAY_SECONDS} seconds`);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "You're at the gym! 💪",
        body: `Did you forget to start a workout? You're at ${gymName}. Tap to begin tracking!`,
        data: {
          type: 'gym_reminder',
          action: 'start_workout',
          gymName,
          gymId,
        },
        sound: 'notification.mp3',
        vibrate: [0, 250, 250, 250],
        categoryIdentifier: 'gym-reminder',
      },
      trigger: {
        type: 'timeInterval',
        seconds: REMINDER_DELAY_SECONDS,
        repeats: false,
      },
    });

    // Save the notification ID so we can cancel it later
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATION_KEY, JSON.stringify({
      notificationId,
      gymId,
      gymName,
      scheduledAt: Date.now(),
    }));

    console.log('========================================');
    console.log(`✅ NOTIFICATION SCHEDULED SUCCESSFULLY`);
    console.log(`📬 Notification ID: ${notificationId}`);
    console.log(`⏰ Will fire in ${REMINDER_DELAY_SECONDS} seconds`);
    console.log('========================================');

    // DEBUG: Start countdown logging
    if (DEBUG_MODE) {
      startDebugCountdown(gymName, REMINDER_DELAY_SECONDS);
    }

    await recordReminderSent();
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling delayed gym reminder:', error);
    return null;
  }
};

/**
 * DEBUG: Log countdown every 5 seconds
 */
let countdownInterval = null;
const startDebugCountdown = (gymName, totalSeconds) => {
  // Clear any existing countdown
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  let remaining = totalSeconds;
  console.log(`\n🔔 DEBUG COUNTDOWN STARTED for ${gymName}`);
  console.log(`⏱️ ${remaining} seconds remaining...`);

  countdownInterval = setInterval(() => {
    remaining -= 5;
    if (remaining > 0) {
      console.log(`⏱️ ${remaining} seconds remaining until notification...`);
    } else {
      console.log('========================================');
      console.log('🔔 NOTIFICATION SHOULD BE SENT NOW!');
      console.log(`📍 Gym: ${gymName}`);
      console.log('💡 Check your phone for the notification');
      console.log('========================================');
      clearInterval(countdownInterval);
      countdownInterval = null;

      // Check if notification was actually sent
      checkNotificationStatus();
    }
  }, 5000);
};

/**
 * DEBUG: Check if there are any pending notifications
 */
const checkNotificationStatus = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`\n📊 NOTIFICATION STATUS CHECK:`);
    console.log(`📬 Pending notifications: ${scheduled.length}`);
    if (scheduled.length > 0) {
      scheduled.forEach((n, i) => {
        console.log(`  ${i + 1}. ID: ${n.identifier}, Title: ${n.content.title}`);
      });
    } else {
      console.log('✅ No pending notifications - it should have been delivered!');
    }
  } catch (error) {
    console.error('Error checking notification status:', error);
  }
};

/**
 * Send the gym reminder notification immediately
 */
const sendGymReminderNotification = async (gymName) => {
  try {
    await Notifications.setNotificationChannelAsync('gym-reminder', {
      name: 'Gym Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'notification.mp3',
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You're at the gym! 💪",
        body: `Did you forget to start a workout? You're at ${gymName}. Tap to begin tracking!`,
        data: {
          type: 'gym_reminder',
          action: 'start_workout',
          gymName,
        },
        sound: 'notification.mp3',
        vibrate: [0, 250, 250, 250],
        categoryIdentifier: 'gym-reminder',
      },
      trigger: null,
    });

    await recordReminderSent();
    return true;
  } catch (error) {
    console.error('Error sending gym reminder notification:', error);
    return false;
  }
};

// ==================== WORKOUT STATE FUNCTIONS ====================

/**
 * Mark workout as active (call when workout starts)
 * Also cancels any scheduled gym reminder
 */
export const markWorkoutActive = async () => {
  try {
    await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({
      isActive: true,
      startedAt: Date.now(),
    }));
    // Cancel any pending gym reminder since user started a workout
    await cancelScheduledGymReminder();
  } catch (error) {
    console.error('Error marking workout active:', error);
  }
};

/**
 * Mark workout as inactive (call when workout finishes)
 */
export const markWorkoutInactive = async () => {
  try {
    await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({
      isActive: false,
      endedAt: Date.now(),
    }));
  } catch (error) {
    console.error('Error marking workout inactive:', error);
  }
};

// ==================== GEOFENCE EVENT HANDLER ====================

/**
 * Process a geofence event (enter or exit)
 * This is the iOS-optimized approach - more reliable than continuous location tracking
 */
const processGeofenceEvent = async (event) => {
  try {
    const { eventType, region } = event;
    const userId = await getCurrentUserId();

    console.log('========================================');
    console.log('🌍 GEOFENCE EVENT DETECTED');
    console.log(`📍 Event Type: ${eventType === Location.GeofencingEventType.Enter ? 'ENTER' : 'EXIT'}`);
    console.log(`🏷️ Region ID: ${region.identifier}`);
    console.log('========================================');

    // Check if gym reminders are enabled
    const settings = await LocationService.getSettings(userId);
    console.log(`👤 User ID: ${userId}`);
    console.log(`⚙️ Settings:`, JSON.stringify(settings));
    if (!settings.enabled) {
      console.log('❌ Gym reminders disabled, ignoring geofence event');
      console.log('💡 Make sure to turn ON the "Gym Arrival Reminders" toggle');
      return;
    }
    console.log('✅ Gym reminders are enabled');

    // Get the gym info for this region
    const gyms = await LocationService.getGymLocations(userId);
    const gym = gyms.find(g => g.id === region.identifier);

    if (!gym) {
      console.log('❌ Gym not found for region:', region.identifier);
      return;
    }
    console.log(`✅ Found gym: ${gym.name}`);

    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('========================================');
      console.log(`🚶 ENTERED GYM: ${gym.name}`);
      console.log('📬 Scheduling notification...');
      console.log('========================================');

      // Schedule a notification for 30 seconds (debug) or 5 minutes from now
      // If the user starts a workout, it will be cancelled
      // If they leave the gym, it will be cancelled
      await scheduleDelayedGymReminder(gym.name, gym.id);

      // Record arrival for tracking
      await LocationService.recordGymArrival(gym.id, userId);

    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log('========================================');
      console.log(`🚶 EXITED GYM: ${gym.name}`);
      console.log('🚫 Cancelling scheduled notification...');
      console.log('========================================');

      // Cancel any scheduled notification since user left
      await cancelScheduledGymReminder();

      // Clear arrival record
      await LocationService.clearGymArrival(userId);

      // Clear countdown timer
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        console.log('⏱️ Countdown cancelled');
      }
    }
  } catch (error) {
    console.error('❌ Error processing geofence event:', error);
  }
};

// ==================== LOCATION UPDATE HANDLER (ANDROID FALLBACK) ====================

/**
 * Process a location update from the background task
 * This is primarily for Android - iOS uses geofencing instead
 */
export const processLocationUpdate = async (latitude, longitude) => {
  try {
    const userId = await getCurrentUserId();

    // Check if gym reminders are enabled
    const settings = await LocationService.getSettings(userId);
    if (!settings.enabled) {
      return;
    }

    // Get saved gym locations
    const gyms = await LocationService.getGymLocations(userId);
    if (gyms.length === 0) {
      return;
    }

    // Check if user is near any gym
    let nearbyGym = null;
    for (const gym of gyms) {
      const distance = calculateDistance(latitude, longitude, gym.latitude, gym.longitude);
      if (distance <= GEOFENCE_RADIUS) {
        nearbyGym = gym;
        break;
      }
    }

    if (!nearbyGym) {
      // User left gym area - clear any arrival record and cancel notification
      await LocationService.clearGymArrival(userId);
      await cancelScheduledGymReminder();
      return;
    }

    // Check if workout is already active
    const workoutActive = await isWorkoutCurrentlyActive();
    if (workoutActive) {
      await LocationService.clearGymArrival(userId);
      return;
    }

    // Get or create gym arrival record
    let arrival = await LocationService.getLastGymArrival(userId);

    if (!arrival || arrival.gymId !== nearbyGym.id) {
      // First time arriving at this gym (or different gym)
      arrival = await LocationService.recordGymArrival(nearbyGym.id, userId);

      // Schedule notification for 5 minutes later (geofencing style)
      await scheduleDelayedGymReminder(nearbyGym.name, nearbyGym.id);
    }

  } catch (error) {
    console.error('Error processing location update:', error);
  }
};

// ==================== DEBUG TEST FUNCTION ====================

/**
 * DEBUG: Manually trigger a gym reminder notification for testing
 * This simulates entering a gym geofence
 */
export const testGymReminderNotification = async (gymName = 'Test Gym', gymId = 'test-gym-id') => {
  console.log('========================================');
  console.log('🧪 MANUAL TEST - SIMULATING GYM ENTRY');
  console.log(`📍 Gym: ${gymName}`);
  console.log('========================================');

  await scheduleDelayedGymReminder(gymName, gymId);
};

// ==================== BACKGROUND TASK DEFINITIONS ====================

/**
 * Define all background tasks
 * IMPORTANT: This must be called at the top level of the app, before any React components render
 */
export const defineBackgroundTask = () => {
  // Define the geofencing task (iOS optimized)
  TaskManager.defineTask(GEOFENCING_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Geofencing task error:', error);
      return;
    }

    if (data) {
      const { eventType, region } = data;
      await processGeofenceEvent({ eventType, region });
    }
  });

  // Define the background location task (Android fallback)
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }

    if (data) {
      const { locations } = data;

      if (locations && locations.length > 0) {
        const location = locations[locations.length - 1];
        const { latitude, longitude } = location.coords;
        await processLocationUpdate(latitude, longitude);
      }
    }
  });
};
