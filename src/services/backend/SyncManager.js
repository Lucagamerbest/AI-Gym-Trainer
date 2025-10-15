// SyncManager - Handles automatic synchronization of data with Firebase
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutSyncService from './WorkoutSyncService';
import MealSyncService from './MealSyncService';
import ProgressSyncService from './ProgressSyncService';

const SYNC_STATUS_KEY = '@sync_status';
const PENDING_SYNC_KEY = '@pending_sync_operations';
const LAST_SYNC_KEY = '@last_sync_time';

class SyncManager {
  constructor() {
    this.isOnline = true;
    this.isSyncing = false;
    this.syncQueue = [];
    this.listeners = [];
    this.unsubscribeNetInfo = null;
  }

  // Initialize network monitoring
  initialize() {
    // Listen to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable !== false;

      console.log('Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        isOnline: this.isOnline
      });

      // If we just came back online, sync pending operations
      if (wasOffline && this.isOnline) {
        console.log('Device came back online, triggering sync...');
        this.syncPendingOperations();
      }

      // Notify listeners of network status change
      this.notifyListeners({ isOnline: this.isOnline });
    });

    // Load pending operations from storage
    this.loadPendingOperations();

    return this;
  }

  // Clean up resources
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  // Add a listener for sync events
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Check if device is online
  async checkNetworkStatus() {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected && state.isInternetReachable !== false;
      return this.isOnline;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  // Add operation to sync queue
  async queueOperation(operation) {
    try {
      this.syncQueue.push(operation);
      await this.savePendingOperations();

      // If online, try to sync immediately
      if (this.isOnline) {
        this.syncPendingOperations();
      }
    } catch (error) {
      console.error('Error queueing operation:', error);
    }
  }

  // Load pending operations from storage
  async loadPendingOperations() {
    try {
      const saved = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      if (saved) {
        this.syncQueue = JSON.parse(saved);
        console.log(`Loaded ${this.syncQueue.length} pending sync operations`);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }

  // Save pending operations to storage
  async savePendingOperations() {
    try {
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  // Sync all pending operations
  async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      console.log('Skipping sync:', { isSyncing: this.isSyncing, isOnline: this.isOnline });
      return { success: false, reason: this.isSyncing ? 'Already syncing' : 'Offline' };
    }

    this.isSyncing = true;
    this.notifyListeners({ syncStarted: true });

    try {
      const operations = [...this.syncQueue];
      const results = {
        total: operations.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      console.log(`Starting sync of ${operations.length} operations...`);

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        try {
          await this.executeOperation(operation);
          results.successful++;

          // Remove from queue after successful sync
          this.syncQueue.shift();
        } catch (error) {
          console.error('Error executing operation:', error);
          results.failed++;
          results.errors.push({
            operation,
            error: error.message
          });

          // Keep failed operation in queue for retry
          break; // Stop processing on first failure
        }
      }

      // Save updated queue
      await this.savePendingOperations();

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('Sync completed:', results);

      this.notifyListeners({
        syncCompleted: true,
        results
      });

      return { success: true, results };
    } catch (error) {
      console.error('Error during sync:', error);
      this.notifyListeners({
        syncError: true,
        error: error.message
      });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Execute a single sync operation
  async executeOperation(operation) {
    const { type, userId, data } = operation;

    switch (type) {
      case 'workout_upload':
        return await WorkoutSyncService.saveWorkout(data);

      case 'workout_download':
        return await WorkoutSyncService.downloadCloudWorkouts(userId);

      case 'meal_upload':
        return await MealSyncService.uploadDailyConsumption(userId, data);

      case 'meal_sync_today':
        return await MealSyncService.syncTodaysMeals(userId);

      case 'meal_download':
        return await MealSyncService.downloadMeals(userId);

      case 'progress_upload':
        return await ProgressSyncService.uploadProgressEntry(userId, data);

      case 'progress_sync_all':
        return await ProgressSyncService.uploadLocalProgress(userId);

      case 'progress_download':
        return await ProgressSyncService.downloadProgress(userId);

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  // Manually trigger a full sync
  async manualSync(userId) {
    if (!userId) {
      throw new Error('User ID is required for sync');
    }

    console.log('Manual sync triggered for user:', userId);

    // Check network first
    const isOnline = await this.checkNetworkStatus();
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    // Add download operations to get latest data from Firebase
    await this.queueOperation({
      type: 'workout_download',
      userId,
      timestamp: new Date().toISOString()
    });

    await this.queueOperation({
      type: 'meal_download',
      userId,
      timestamp: new Date().toISOString()
    });

    await this.queueOperation({
      type: 'progress_download',
      userId,
      timestamp: new Date().toISOString()
    });

    // Sync all pending operations
    return await this.syncPendingOperations();
  }

  // Get last sync time
  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingOperations: this.syncQueue.length
    };
  }

  // Auto-sync workout after save
  async syncWorkout(userId, workout) {
    if (!userId) {
      console.warn('No user ID provided for workout sync');
      return;
    }

    // Queue the upload operation
    await this.queueOperation({
      type: 'workout_upload',
      userId,
      data: workout,
      timestamp: new Date().toISOString()
    });

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingOperations();
    } else {
      console.log('Workout queued for sync when online');
    }
  }

  // Auto-sync meal after adding
  async syncMeal(userId, mealEntry) {
    if (!userId || userId === 'guest') {
      console.warn('No user ID provided for meal sync');
      return;
    }

    // Queue the upload operation
    await this.queueOperation({
      type: 'meal_upload',
      userId,
      data: mealEntry,
      timestamp: new Date().toISOString()
    });

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingOperations();
    } else {
      console.log('Meal queued for sync when online');
    }
  }

  // Sync today's meals
  async syncTodaysMeals(userId) {
    if (!userId || userId === 'guest') {
      console.warn('No user ID provided for meal sync');
      return;
    }

    // Queue the sync operation
    await this.queueOperation({
      type: 'meal_sync_today',
      userId,
      timestamp: new Date().toISOString()
    });

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingOperations();
    } else {
      console.log('Today\'s meals queued for sync when online');
    }
  }

  // Auto-sync progress entry after adding
  async syncProgressEntry(userId, progressEntry) {
    if (!userId || userId === 'guest') {
      console.warn('No user ID provided for progress sync');
      return;
    }

    // Queue the upload operation
    await this.queueOperation({
      type: 'progress_upload',
      userId,
      data: progressEntry,
      timestamp: new Date().toISOString()
    });

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingOperations();
    } else {
      console.log('Progress entry queued for sync when online');
    }
  }

  // Sync all local progress entries
  async syncAllProgress(userId) {
    if (!userId || userId === 'guest') {
      console.warn('No user ID provided for progress sync');
      return;
    }

    // Queue the sync operation
    await this.queueOperation({
      type: 'progress_sync_all',
      userId,
      timestamp: new Date().toISOString()
    });

    // If online, sync immediately
    if (this.isOnline) {
      await this.syncPendingOperations();
    } else {
      console.log('Progress entries queued for sync when online');
    }
  }
}

// Create singleton instance
const syncManager = new SyncManager();

export default syncManager;
