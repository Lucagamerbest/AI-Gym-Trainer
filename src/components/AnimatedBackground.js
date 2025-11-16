import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function AnimatedBackground({ children }) {

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});