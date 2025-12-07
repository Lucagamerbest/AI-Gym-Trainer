import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { markWorkoutActive, markWorkoutInactive } from '../services/GymReminderTask';

const WorkoutContext = createContext();
const WORKOUT_STORAGE_KEY = '@active_workout';

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const appState = useRef(AppState.currentState);

  // Load workout from storage on mount
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const storedWorkout = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
        if (storedWorkout) {
          const workout = JSON.parse(storedWorkout);
          // Restore dates as Date objects
          if (workout.createdAt) workout.createdAt = new Date(workout.createdAt);
          if (workout.startTime) workout.startTime = new Date(workout.startTime);
          if (workout.lastUpdated) workout.lastUpdated = new Date(workout.lastUpdated);
          setActiveWorkout(workout);
        }
      } catch (error) {
        console.error('Error loading workout from storage:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadWorkout();
  }, []);

  // Save workout to storage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initial load

    const saveWorkout = async () => {
      try {
        if (activeWorkout) {
          await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(activeWorkout));
        } else {
          await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving workout to storage:', error);
      }
    };
    saveWorkout();
  }, [activeWorkout, isLoaded]);

  // Save on app background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - save immediately
        if (activeWorkout) {
          try {
            await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(activeWorkout));
          } catch (error) {
            console.error('Error saving workout on background:', error);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [activeWorkout]);

  const startWorkout = useCallback((workoutData) => {
    setActiveWorkout({
      ...workoutData,
      id: Date.now().toString(),
      createdAt: new Date()
    });
    // Persist workout state for background location task
    markWorkoutActive();
  }, []);

  const updateWorkout = useCallback((updates) => {
    setActiveWorkout(prev => {
      if (prev) {
        return {
          ...prev,
          ...updates,
          lastUpdated: new Date()
        };
      }
      return prev;
    });
  }, []);

  const finishWorkout = useCallback(async () => {
    setActiveWorkout(null);
    // Clear from storage
    try {
      await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing workout from storage:', error);
    }
    // Persist workout state for background location task
    markWorkoutInactive();
  }, []);

  const discardWorkout = useCallback(async () => {
    // Simply clear the workout without saving
    setActiveWorkout(null);
    // Clear from storage
    try {
      await AsyncStorage.removeItem(WORKOUT_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing workout from storage:', error);
    }
    // Persist workout state for background location task
    markWorkoutInactive();
  }, []);

  const isWorkoutActive = useCallback(() => {
    return activeWorkout !== null;
  }, [activeWorkout]);

  const getElapsedTime = useCallback(() => {
    if (!activeWorkout || !activeWorkout.startTime) {
      return '00:00';
    }

    const now = new Date();
    const elapsed = Math.floor((now - new Date(activeWorkout.startTime)) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [activeWorkout]);

  const value = {
    activeWorkout,
    isLoaded,
    startWorkout,
    updateWorkout,
    finishWorkout,
    discardWorkout,
    isWorkoutActive,
    getElapsedTime
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};