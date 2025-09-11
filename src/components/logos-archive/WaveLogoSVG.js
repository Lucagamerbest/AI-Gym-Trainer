import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../constants/theme';

export default function WaveLogoSVG({ size = 60, style }) {
  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
            <Stop offset="50%" stopColor="#059669" stopOpacity="1" />
            <Stop offset="100%" stopColor={Colors.primary} stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle cx="50" cy="50" r="48" fill="url(#waveGradient)" opacity="0.1" />
        
        {/* Wave pattern - represents energy and motion */}
        <Path
          d="M 10 50 Q 25 30, 40 50 T 70 50 T 90 50"
          stroke="url(#waveGradient)"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        
        {/* Bar chart representing progress/strength */}
        <G>
          <Rect x="20" y="55" width="8" height="20" fill="url(#barGradient)" rx="2" />
          <Rect x="32" y="45" width="8" height="30" fill="url(#barGradient)" rx="2" />
          <Rect x="44" y="35" width="8" height="40" fill="url(#barGradient)" rx="2" />
          <Rect x="56" y="40" width="8" height="35" fill="url(#barGradient)" rx="2" />
          <Rect x="68" y="50" width="8" height="25" fill="url(#barGradient)" rx="2" />
        </G>
        
        {/* Energy dots */}
        <Circle cx="25" cy="25" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="75" cy="25" r="2" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="50" cy="20" r="3" fill="#FFFFFF" opacity="1" />
        
        {/* Center focus point */}
        <Circle cx="50" cy="50" r="4" fill="#FFFFFF" opacity="0.9" />
        
        {/* Outer ring */}
        <Circle 
          cx="50" 
          cy="50" 
          r="47" 
          stroke="url(#waveGradient)" 
          strokeWidth="2" 
          fill="none"
          strokeDasharray="5 3"
          opacity="0.5"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});