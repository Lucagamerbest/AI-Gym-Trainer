import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';
import AIChatModal from './AIChatModal';
import ContextManager from '../services/ai/ContextManager';

/**
 * AIHeaderButton - Universal AI assistant button for all screens
 *
 * Displays a floating AI button that opens the context-aware chat modal.
 * Automatically sets the screen context when pressed.
 */
export default function AIHeaderButton({ screenName }) {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    // Set current screen context before opening modal
    if (screenName) {
      ContextManager.setScreen(screenName);
    }
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>🤖</Text>
      </TouchableOpacity>

      <AIChatModal
        visible={modalVisible}
        onClose={handleClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
});
