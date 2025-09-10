import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function StyledButton({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, ghost, card
  size = 'md', // sm, md, lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  ...props 
}) {
  const getButtonStyles = () => {
    const baseStyles = [styles.base];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyles.push(styles.primary);
        break;
      case 'secondary':
        baseStyles.push(styles.secondary);
        break;
      case 'ghost':
        baseStyles.push(styles.ghost);
        break;
      case 'card':
        baseStyles.push(styles.card);
        break;
      default:
        baseStyles.push(styles.primary);
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        baseStyles.push(styles.sm);
        break;
      case 'md':
        baseStyles.push(styles.md);
        break;
      case 'lg':
        baseStyles.push(styles.lg);
        break;
    }
    
    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }
    
    if (disabled) {
      baseStyles.push(styles.disabled);
    }
    
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };
  
  const getTextStyles = () => {
    const baseTextStyles = [styles.text];
    
    // Variant text styles
    switch (variant) {
      case 'primary':
        baseTextStyles.push(styles.primaryText);
        break;
      case 'secondary':
      case 'card':
        baseTextStyles.push(styles.secondaryText);
        break;
      case 'ghost':
        baseTextStyles.push(styles.ghostText);
        break;
    }
    
    // Size text styles
    switch (size) {
      case 'sm':
        baseTextStyles.push(styles.smText);
        break;
      case 'md':
        baseTextStyles.push(styles.mdText);
        break;
      case 'lg':
        baseTextStyles.push(styles.lgText);
        break;
    }
    
    if (textStyle) {
      baseTextStyles.push(textStyle);
    }
    
    return baseTextStyles;
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? Colors.background : Colors.primary} 
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Text style={[styles.icon, { marginRight: Spacing.sm }]}>{icon}</Text>
          )}
          <Text style={getTextStyles()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Text style={[styles.icon, { marginLeft: Spacing.sm }]}>{icon}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  
  // Sizes
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 36,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 48,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    minHeight: 56,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  text: {
    fontWeight: 'bold',
  },
  
  primaryText: {
    color: Colors.background,
  },
  secondaryText: {
    color: Colors.text,
  },
  ghostText: {
    color: Colors.primary,
  },
  
  smText: {
    fontSize: Typography.fontSize.sm,
  },
  mdText: {
    fontSize: Typography.fontSize.md,
  },
  lgText: {
    fontSize: Typography.fontSize.lg,
  },
  
  icon: {
    fontSize: Typography.fontSize.xl,
  },
});