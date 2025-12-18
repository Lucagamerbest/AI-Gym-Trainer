/**
 * Background Timer Service
 *
 * Uses the iOS background audio mode to keep the app alive when the screen is off.
 * This allows us to play a sound that ducks music when the timer completes,
 * similar to how Hevy handles rest timers.
 *
 * Technique:
 * 1. Play a silent audio loop to keep the app "alive" in background
 * 2. Use a JavaScript interval to track time (works because audio is playing)
 * 3. When timer completes, play the loud notification sound with music ducking
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform, AppState } from 'react-native';

class BackgroundTimerService {
  constructor() {
    this.silentSound = null;
    this.alertSound = null;
    this.timerInterval = null;
    this.remainingSeconds = 0;
    this.onTick = null;
    this.onComplete = null;
    this.isRunning = false;
    this.targetEndTime = null;
  }

  /**
   * Initialize the audio mode for background playback
   */
  async initializeAudio() {
    try {
      // Configure audio to stay active in background WITHOUT ducking user's music
      // iOS: MixWithOthers means our silent audio won't affect music volume at all
      // Android: DuckOthers is required but the 0.01 volume silent audio minimizes impact
      // Ducking only really matters when the alert plays at timer completion
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,        // Keep audio session alive in background
        playsInSilentModeIOS: true,           // Play even when silent switch is on
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,  // iOS: Don't duck music during countdown
        shouldDuckAndroid: false,             // Our audio won't be ducked by others
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers, // Android: needed for background
        playThroughEarpieceAndroid: false,
      });
      console.log('BackgroundTimerService: Audio mode initialized (music unchanged)');
      return true;
    } catch (error) {
      console.error('BackgroundTimerService: Failed to initialize audio mode:', error);
      return false;
    }
  }

  /**
   * Load the silent audio file for background keep-alive
   * We'll use a very quiet version of our notification sound on loop
   * IMPORTANT: shouldPlay must be true for iOS background audio to work properly
   */
  async loadSilentAudio() {
    try {
      if (this.silentSound) {
        try {
          await this.silentSound.stopAsync();
          await this.silentSound.unloadAsync();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Create a silent/very quiet sound for background keep-alive
      // We use the existing notification sound at very low volume
      // CRITICAL: shouldPlay: true is required for iOS background audio
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3'),
        {
          volume: 0.01, // Nearly silent - just enough to keep audio session alive
          isLooping: true,
          shouldPlay: true, // MUST be true for iOS background audio to work!
        }
      );

      this.silentSound = sound;
      console.log('BackgroundTimerService: Silent audio loaded and playing');
      return true;
    } catch (error) {
      console.error('BackgroundTimerService: Failed to load silent audio:', error);
      return false;
    }
  }

  /**
   * Load the alert sound for timer completion
   */
  async loadAlertSound() {
    try {
      if (this.alertSound) {
        await this.alertSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/notification.mp3'),
        {
          volume: 1.0, // Full volume for alert
          shouldPlay: false,
        }
      );

      this.alertSound = sound;

      // Set up callback for when alert finishes playing
      this.alertSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.resetAudioMode();
        }
      });

      console.log('BackgroundTimerService: Alert sound loaded');
      return true;
    } catch (error) {
      console.error('BackgroundTimerService: Failed to load alert sound:', error);
      return false;
    }
  }

  /**
   * Reset audio mode after alert plays (restore music)
   */
  async resetAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        shouldDuckAndroid: false,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });
      console.log('BackgroundTimerService: Audio mode reset - music should resume');
    } catch (error) {
      console.error('BackgroundTimerService: Failed to reset audio mode:', error);
    }
  }

  /**
   * Start the background timer
   * @param {number} seconds - Duration in seconds
   * @param {function} onTick - Callback called every second with remaining time
   * @param {function} onComplete - Callback called when timer completes
   */
  async start(seconds, onTick, onComplete) {
    if (this.isRunning) {
      console.log('BackgroundTimerService: Timer already running, stopping first');
      await this.stop();
    }

    console.log(`BackgroundTimerService: Starting timer for ${seconds} seconds`);

    this.remainingSeconds = seconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.isRunning = true;
    this.targetEndTime = Date.now() + (seconds * 1000);

    // Initialize audio mode
    await this.initializeAudio();

    // Load ONLY silent audio - alert sound will be loaded when timer completes
    // This prevents the alert sound from triggering audio ducking at start
    await this.loadSilentAudio();
    // NOTE: Don't load alert sound here - it will be loaded in complete()

    console.log('BackgroundTimerService: Silent audio keeping app alive in background');

    // Start the timer interval
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    // Initial tick
    if (this.onTick) {
      this.onTick(this.remainingSeconds);
    }
  }

  /**
   * Handle each tick of the timer
   */
  tick() {
    // Use target end time for accuracy (handles background timing better)
    const now = Date.now();
    this.remainingSeconds = Math.max(0, Math.ceil((this.targetEndTime - now) / 1000));

    if (this.onTick) {
      this.onTick(this.remainingSeconds);
    }

    if (this.remainingSeconds <= 0) {
      this.complete();
    }
  }

  /**
   * Handle timer completion
   */
  async complete() {
    console.log('BackgroundTimerService: Timer complete!');

    // Stop the interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop silent audio
    if (this.silentSound) {
      try {
        await this.silentSound.stopAsync();
      } catch (error) {
        console.error('BackgroundTimerService: Error stopping silent audio:', error);
      }
    }

    // Play alert sound at full volume
    await this.playAlertSound();

    // Trigger haptic feedback and vibration
    try {
      // Strong haptic notification
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Additional vibration pattern for extra attention
      const { Vibration } = require('react-native');
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      } else {
        // iOS - use pattern vibration (works if vibration is enabled)
        Vibration.vibrate([0, 500, 200, 500]);
      }
    } catch (error) {
      console.error('BackgroundTimerService: Haptic/vibration error:', error);
    }

    this.isRunning = false;

    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Play the alert sound with music ducking
   * Sound is loaded here (not at timer start) to prevent early ducking
   */
  async playAlertSound() {
    try {
      // First, set audio mode to duck others for the alert sound
      // This is the ONLY time we should duck music - when the timer completes
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false,
      });

      // Load alert sound NOW (not at timer start) to prevent early ducking
      if (!this.alertSound) {
        console.log('BackgroundTimerService: Loading alert sound for completion');
        await this.loadAlertSound();
      }

      if (this.alertSound) {
        // Reset to beginning and play
        await this.alertSound.setPositionAsync(0);
        await this.alertSound.playAsync();
        console.log('BackgroundTimerService: Alert sound playing with music ducking');
      }
    } catch (error) {
      console.error('BackgroundTimerService: Error playing alert sound:', error);
      // Fallback to haptic
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    }
  }

  /**
   * Pause the timer (preserves remaining time)
   */
  async pause() {
    if (!this.isRunning) return;

    console.log('BackgroundTimerService: Pausing timer');

    // Stop interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop silent audio
    if (this.silentSound) {
      try {
        await this.silentSound.stopAsync();
      } catch (error) {
        console.error('BackgroundTimerService: Error stopping silent audio:', error);
      }
    }

    this.isRunning = false;

    // Reset audio mode
    await this.resetAudioMode();
  }

  /**
   * Resume a paused timer
   */
  async resume() {
    if (this.isRunning || this.remainingSeconds <= 0) return;

    console.log(`BackgroundTimerService: Resuming timer with ${this.remainingSeconds} seconds`);

    // Restart with remaining time
    await this.start(this.remainingSeconds, this.onTick, this.onComplete);
  }

  /**
   * Stop and reset the timer completely
   */
  async stop() {
    console.log('BackgroundTimerService: Stopping timer');

    // Stop interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop and unload silent audio
    if (this.silentSound) {
      try {
        await this.silentSound.stopAsync();
        await this.silentSound.unloadAsync();
      } catch (error) {
        console.error('BackgroundTimerService: Error cleaning up silent audio:', error);
      }
      this.silentSound = null;
    }

    // Unload alert sound
    if (this.alertSound) {
      try {
        await this.alertSound.unloadAsync();
      } catch (error) {
        console.error('BackgroundTimerService: Error cleaning up alert audio:', error);
      }
      this.alertSound = null;
    }

    this.remainingSeconds = 0;
    this.isRunning = false;
    this.targetEndTime = null;
    this.onTick = null;
    this.onComplete = null;

    // Reset audio mode
    await this.resetAudioMode();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      remainingSeconds: this.remainingSeconds,
      targetEndTime: this.targetEndTime,
    };
  }

  /**
   * Check if timer is running
   */
  isTimerRunning() {
    return this.isRunning;
  }

  /**
   * Get remaining seconds
   */
  getRemainingSeconds() {
    return this.remainingSeconds;
  }
}

// Export singleton instance
export default new BackgroundTimerService();
