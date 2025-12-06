/**
 * Gym Reminder Background Task
 *
 * This task runs in the background to check if the user is at their gym
 * and sends a reminder if they haven't started a workout.
 */

import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationService, LOCATION_TASK_NAME, calculateDistance } from './LocationService';

// Storage keys
const ACTIVE_WORKOUT_KEY = '@active_workout_state';
const LAST_REMINDER_KEY = '@last_gym_reminder';

// Constants
const REMINDER_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const REMINDER_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown between reminders
const GEOFENCE_RADIUS = 100; // meters

/**
 * Mark workout as active (call when workout starts)
 */
export const markWorkoutActive = async () => {
  try {
    await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({
      isActive: true,
      startedAt: Date.now(),
    }));
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

/**
 * Get the current user ID from AsyncStorage
 */
const getCurrentUserId = async () => {
  try {
    // Try to get the auth state which contains the user
    const authState = await AsyncStorage.getItem('authState');
    if (authState) {
      const parsed = JSON.parse(authState);
      return parsed?.user?.uid || 'guest';
    }
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
    return true; // Default to sending if error
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
 * Send the gym reminder notification
 */
const sendGymReminderNotification = async (gymName) => {
  try {
    // Create notification channel for gym reminders (Android)
    await Notifications.setNotificationChannelAsync('gym-reminder', {
      name: 'Gym Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "You're at the gym! 💪",
        body: `Looks like you're at ${gymName}. Did you forget to start a workout? Tap to begin tracking!`,
        data: {
          type: 'gym_reminder',
          action: 'start_workout',
          gymName,
        },
        sound: 'default',
        categoryIdentifier: 'gym-reminder',
      },
      trigger: null, // Send immediately
    });

    await recordReminderSent();
    return true;
  } catch (error) {
    console.error('Error sending gym reminder notification:', error);
    return false;
  }
};

/**
 * Process a location update from the background task
 */
export const processLocationUpdate = async (latitude, longitude) => {

  try {
    // Get user ID
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
      // User left gym area - clear any arrival record
      await LocationService.clearGymArrival(userId);
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
    }

    // Check if 5 minutes have passed since arrival
    const timeAtGym = Date.now() - arrival.timestamp;

    if (timeAtGym < REMINDER_DELAY_MS) {
      return;
    }

    // Check if we already sent a notification for this arrival
    if (arrival.notificationSent) {
      return;
    }

    // Check cooldown
    const canSend = await shouldSendReminder();
    if (!canSend) {
      return;
    }

    // Re-check workout status (in case it started while we were waiting)
    const stillNoWorkout = !(await isWorkoutCurrentlyActive());
    if (!stillNoWorkout) {
      return;
    }

    // Send the reminder!
    await sendGymReminderNotification(nearbyGym.name);
    await LocationService.markNotificationSent(userId);

  } catch (error) {
    console.error('Error processing location update:', error);
  }
};

/**
 * Define the background location task
 * IMPORTANT: This must be called at the top level of the app, before any React components render
 */
export const defineBackgroundTask = () => {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background location task error:', error);
      return;
    }

    if (data) {
      const { locations } = data;

      if (locations && locations.length > 0) {
        // Use the most recent location
        const location = locations[locations.length - 1];
        const { latitude, longitude } = location.coords;

        await processLocationUpdate(latitude, longitude);
      }
    }
  });

};
