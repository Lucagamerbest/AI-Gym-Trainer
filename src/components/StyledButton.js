import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useColors } from '../context/ThemeContext';

export default function StyledButton({
  title,
  onPress,
  variant = 'primary', // primary, secondary, ghost, card
  size = 'md', // sm, md, lg, xl
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) {
  const Colors = useColors();

  const dynamicStyles = createDynamicStyles(Colors);

  const getButtonStyles = () => {
    const baseStyles = [dynamicStyles.base];

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyles.push(dynamicStyles.primary);
        break;
      case 'secondary':
        baseStyles.push(dynamicStyles.secondary);
        break;
      case 'ghost':
        baseStyles.push(dynamicStyles.ghost);
        break;
      case 'card':
        baseStyles.push(dynamicStyles.card);
        break;
      default:
        baseStyles.push(dynamicStyles.primary);
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        baseStyles.push(dynamicStyles.sm);
        break;
      case 'md':
        baseStyles.push(dynamicStyles.md);
        break;
      case 'lg':
        baseStyles.push(dynamicStyles.lg);
        break;
      case 'xl':
        baseStyles.push(dynamicStyles.xl);
        break;
    }

    if (fullWidth) {
      baseStyles.push(dynamicStyles.fullWidth);
    }

    if (disabled) {
      baseStyles.push(dynamicStyles.disabled);
    }
    
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };
  
  const getTextStyles = () => {
    const baseTextStyles = [dynamicStyles.text];

    // Variant text styles
    switch (variant) {
      case 'primary':
        baseTextStyles.push(dynamicStyles.primaryText);
        break;
      case 'secondary':
      case 'card':
        baseTextStyles.push(dynamicStyles.secondaryText);
        break;
      case 'ghost':
        baseTextStyles.push(dynamicStyles.ghostText);
        break;
    }

    // Size text styles
    switch (size) {
      case 'sm':
        baseTextStyles.push(dynamicStyles.smText);
        break;
      case 'md':
        baseTextStyles.push(dynamicStyles.mdText);
        break;
      case 'lg':
        baseTextStyles.push(dynamicStyles.lgText);
        break;
      case 'xl':
        baseTextStyles.push(dynamicStyles.xlText);
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
        <View style={dynamicStyles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'xl' ? 24 : 20}
              color={variant === 'primary' ? Colors.background : Colors.text}
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <Text style={getTextStyles()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'xl' ? 24 : 20}
              color={variant === 'primary' ? Colors.background : Colors.text}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const createDynamicStyles = (Colors) => StyleSheet.create({
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
  xl: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl * 1.5,
    minHeight: 80,
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
  xlText: {
    fontSize: Typography.fontSize.xl,
  },
  
  icon: {
    fontSize: Typography.fontSize.xl,
  },
  xlIcon: {
    fontSize: Typography.fontSize.xxl || 32,
  },
});