import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePalettes, updateGlobalColors } from '../constants/theme';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('purple'); // Default to purple
  const [colors, setColors] = useState(ThemePalettes.purple);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ThemePalettes[savedTheme]) {
        setCurrentTheme(savedTheme);
        setColors(ThemePalettes[savedTheme]);
        updateGlobalColors(ThemePalettes[savedTheme]); // Update global Colors export
      } else {
        updateGlobalColors(ThemePalettes.purple); // Set default purple theme
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeTheme = async (themeName) => {
    if (!ThemePalettes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }

    try {
      setCurrentTheme(themeName);
      setColors(ThemePalettes[themeName]);
      updateGlobalColors(ThemePalettes[themeName]); // Update global Colors export
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value = {
    currentTheme,
    colors,
    changeTheme,
    isLoading,
    availableThemes: Object.keys(ThemePalettes).map(key => ({
      key,
      name: ThemePalettes[key].name,
      description: ThemePalettes[key].description,
      colors: ThemePalettes[key],
    })),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook for components that only need colors
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};
