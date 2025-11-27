import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_COACH_NAME_KEY = '@ai_coach_name';
const DEFAULT_COACH_NAME = 'AI Coach';

const AICoachContext = createContext();

export function AICoachProvider({ children }) {
  const [coachName, setCoachName] = useState(DEFAULT_COACH_NAME);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved coach name on mount
  useEffect(() => {
    loadCoachName();
  }, []);

  const loadCoachName = async () => {
    try {
      const savedName = await AsyncStorage.getItem(AI_COACH_NAME_KEY);
      if (savedName) {
        setCoachName(savedName);
      }
    } catch (error) {
      console.error('Error loading coach name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoachName = async (newName) => {
    try {
      const name = newName.trim() || DEFAULT_COACH_NAME;
      await AsyncStorage.setItem(AI_COACH_NAME_KEY, name);
      setCoachName(name);
      return true;
    } catch (error) {
      console.error('Error saving coach name:', error);
      return false;
    }
  };

  const resetCoachName = async () => {
    try {
      await AsyncStorage.removeItem(AI_COACH_NAME_KEY);
      setCoachName(DEFAULT_COACH_NAME);
      return true;
    } catch (error) {
      console.error('Error resetting coach name:', error);
      return false;
    }
  };

  return (
    <AICoachContext.Provider value={{
      coachName,
      updateCoachName,
      resetCoachName,
      isLoading,
      defaultName: DEFAULT_COACH_NAME
    }}>
      {children}
    </AICoachContext.Provider>
  );
}

export function useAICoach() {
  const context = useContext(AICoachContext);
  if (!context) {
    throw new Error('useAICoach must be used within an AICoachProvider');
  }
  return context;
}
