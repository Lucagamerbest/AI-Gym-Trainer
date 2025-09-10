import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

export const Card = ({ 
  children, 
  style, 
  onPress,
  variant = 'default',
  noPadding = false,
  ...props 
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    noPadding && styles.noPadding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  
  default: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  elevated: {
    ...Shadows.md,
    borderWidth: 0,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  
  gradient: {
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.surface,
  },
  
  noPadding: {
    padding: 0,
  },
});