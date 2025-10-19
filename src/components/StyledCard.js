import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function StyledCard({ 
  children,
  title,
  subtitle,
  icon,
  onPress,
  style,
  variant = 'default', // default, elevated, primary
  ...props 
}) {
  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.8 } : {};
  
  const getCardStyles = () => {
    const baseStyles = [styles.base];
    
    switch (variant) {
      case 'elevated':
        baseStyles.push(styles.elevated);
        break;
      case 'primary':
        baseStyles.push(styles.primary);
        break;
      default:
        baseStyles.push(styles.default);
    }
    
    if (style) {
      baseStyles.push(style);
    }
    
    return baseStyles;
  };

  return (
    <CardWrapper style={getCardStyles()} {...cardProps} {...props}>
      {(icon || title || subtitle) && (
        <View style={styles.header}>
          {icon && (
            <Ionicons
              name={icon}
              size={28}
              color={variant === 'primary' ? Colors.background : Colors.primary}
              style={{ marginRight: Spacing.md }}
            />
          )}
          <View style={styles.headerText}>
            {title && <Text style={[styles.title, variant === 'primary' && styles.primaryText]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, variant === 'primary' && styles.primarySubtext]}>{subtitle}</Text>}
          </View>
          {onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={variant === 'primary' ? Colors.background : Colors.textMuted}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </View>
      )}
      {children}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  
  default: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  
  elevated: {
    backgroundColor: Colors.card,
    ...Shadows.md,
  },
  
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  icon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  
  headerText: {
    flex: 1,
  },
  
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  
  arrow: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  
  primaryText: {
    color: Colors.background,
  },
  
  primarySubtext: {
    color: Colors.background,
    opacity: 0.8,
  },
});