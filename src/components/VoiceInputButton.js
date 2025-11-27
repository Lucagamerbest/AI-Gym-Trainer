import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { Colors, Spacing } from '../constants/theme';

/**
 * VoiceInputButton - Microphone button for speech-to-text input
 *
 * @param {function} onTranscript - Called with transcribed text (real-time updates)
 * @param {function} onFinalTranscript - Called when speech recognition ends with final text
 * @param {boolean} disabled - Disable the button
 * @param {object} style - Additional styles for the button
 */
export default function VoiceInputButton({
  onTranscript,
  onFinalTranscript,
  disabled = false,
  style
}) {
  const [isListening, setIsListening] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';

    if (onTranscript) {
      onTranscript(transcript);
    }

    // If this is the final result
    if (event.isFinal && onFinalTranscript) {
      onFinalTranscript(transcript);
    }
  });

  // Handle errors
  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error);
    setIsListening(false);

    if (event.error === 'no-speech') {
      // Silent - user just didn't speak
    } else if (event.error === 'not-allowed') {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use voice input.',
        [{ text: 'OK' }]
      );
    }
  });

  // Handle end of speech recognition
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  // Pulse animation while listening
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startListening = async () => {
    try {
      // Check and request permissions
      const { status } = await ExpoSpeechRecognitionModule.getPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is needed for voice input.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      setIsListening(true);

      // Start speech recognition
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true, // Get results as user speaks
        maxAlternatives: 1,
        continuous: false, // Stop after user pauses
        requiresOnDeviceRecognition: false, // Use cloud for better accuracy
        addsPunctuation: true, // Auto-add punctuation
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      Alert.alert('Error', 'Could not start voice input. Please try again.');
    }
  };

  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          isListening && styles.buttonListening,
          disabled && styles.buttonDisabled,
          style,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={22}
          color={isListening ? '#fff' : Colors.primary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  buttonListening: {
    backgroundColor: Colors.error || '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
