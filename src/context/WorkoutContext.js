import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);

  const startWorkout = useCallback((workoutData) => {
    setActiveWorkout({
      ...workoutData,
      id: Date.now().toString(),
      createdAt: new Date()
    });
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

  const finishWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  const discardWorkout = useCallback(() => {
    // Simply clear the workout without saving
    setActiveWorkout(null);
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