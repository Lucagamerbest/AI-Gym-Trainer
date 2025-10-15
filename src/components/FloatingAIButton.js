import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Colors } from '../constants/theme';
import AIChatModal from './AIChatModal';

export default function FloatingAIButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Text style={styles.icon}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>

      <AIChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 30 : 20,
    right: Platform.OS === 'web' ? 30 : 20,
    zIndex: 1000,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
  },
});
