import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function Logo({ size = 'medium', showText = true, style }) {
  const getSize = () => {
    switch(size) {
      case 'small': return { wave: 30, text: 16 };
      case 'medium': return { wave: 60, text: 28 };
      case 'large': return { wave: 72, text: 32 };
      default: return { wave: 60, text: 28 };
    }
  };

  const dimensions = getSize();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoWrapper}>
        {/* Background circles similar to sign-in page */}
        <View style={[styles.circle, styles.circle1, { 
          width: dimensions.wave * 1.5, 
          height: dimensions.wave * 1.5,
          borderRadius: dimensions.wave * 0.75
        }]} />
        <View style={[styles.circle, styles.circle2, { 
          width: dimensions.wave * 1.2, 
          height: dimensions.wave * 1.2,
          borderRadius: dimensions.wave * 0.6
        }]} />
        
        {/* Wave emojis like sign-in page */}
        <View style={styles.waveContainer}>
          <Text style={[styles.logoWave, { 
            fontSize: dimensions.wave,
            marginVertical: size === 'large' ? -25 : -15
          }]}>〰️</Text>
          <Text style={[styles.logoWave, { 
            fontSize: dimensions.wave,
            marginVertical: size === 'large' ? -25 : -15
          }]}>〰️</Text>
        </View>
      </View>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: dimensions.text }]}>
            Workout Wave
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  circle: {
    position: 'absolute',
    opacity: 0.1,
  },
  circle1: {
    backgroundColor: Colors.primary,
    top: -20,
    left: -20,
  },
  circle2: {
    backgroundColor: '#059669',
    bottom: -15,
    right: -15,
  },
  waveContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWave: {
    color: '#000000',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  textContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  brandText: {
    fontWeight: 'bold',
    color: Colors.background,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});