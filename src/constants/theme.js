// Theme Palettes
export const ThemePalettes = {
  purple: {
    name: 'Purple',
    description: 'Premium & Modern',
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    primaryLight: '#A78BFA',

    background: '#000000',
    surface: '#1A1A1A',
    card: '#242424',
    cardHover: '#2E2E2E',

    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#737373',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#2A2A2A',
    borderLight: '#3A3A3A',

    overlay: 'rgba(0, 0, 0, 0.9)',

    gradientStart: '#000000',
    gradientEnd: '#1A1A1A',
  },

  gold: {
    name: 'Gold',
    description: 'Ultra Premium',
    primary: '#F59E0B',
    primaryDark: '#D97706',
    primaryLight: '#FBBF24',

    background: '#000000',
    surface: '#1A1A1A',
    card: '#242424',
    cardHover: '#2E2E2E',

    text: '#FFFFFF',
    textSecondary: '#A1A1A1',
    textMuted: '#6B7280',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#2A2A2A',
    borderLight: '#3A3A3A',

    overlay: 'rgba(0, 0, 0, 0.85)',

    gradientStart: '#000000',
    gradientEnd: '#1A1A1A',
  },

  blue: {
    name: 'Blue',
    description: 'Modern Tech',
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',

    background: '#000000',
    surface: '#1A1A1A',
    card: '#242424',
    cardHover: '#2E2E2E',

    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#737373',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#2A2A2A',
    borderLight: '#3A3A3A',

    overlay: 'rgba(0, 0, 0, 0.9)',

    gradientStart: '#000000',
    gradientEnd: '#1A1A1A',
  },

  light: {
    name: 'Light',
    description: 'Clean & Bright',
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    primaryLight: '#A78BFA',

    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    cardHover: '#F3F4F6',

    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    overlay: 'rgba(0, 0, 0, 0.5)',

    gradientStart: '#FFFFFF',
    gradientEnd: '#F9FAFB',
  },
};

// Default theme (Purple) - this ensures backward compatibility
// Screens that haven't been updated yet can still import Colors
export let Colors = { ...ThemePalettes.purple };

// Function to update the exported Colors (used by ThemeContext)
export const updateGlobalColors = (newColors) => {
  Object.assign(Colors, newColors);
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  sizes: { // Alias for fontSize
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};