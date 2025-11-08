export const Colors = {
  // Softer, warmer color palette
  primary: '#4ECCA3',  // Softer mint green
  primaryDark: '#3BA77D',
  primaryLight: '#6FE5C1',
  
  background: '#0A0E1A',  // Warm dark blue-black
  surface: '#141823',  // Slightly lighter surface
  card: '#1C2333',  // Card background
  cardHover: '#252C3E',
  
  text: '#F5F5F7',  // Softer white
  textSecondary: '#A8AEBF',  // Warmer gray
  textMuted: '#6B7280',
  
  success: '#4ECCA3',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  border: '#2A3244',
  borderLight: '#374151',
  
  overlay: 'rgba(10, 14, 26, 0.85)',
  
  // Gradient colors for backgrounds
  gradientStart: '#0A0E1A',
  gradientEnd: '#1A1F2E',
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