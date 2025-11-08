import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import SmartInputService from '../services/SmartInputService';
import SmartInputSettings from './SmartInputSettings';

/**
 * SmartTextInput
 *
 * Enhanced TextInput with context-aware autocomplete suggestions
 * Displays suggestion chips below the input field
 * Tap to auto-complete words
 */
export default function SmartTextInput({
  value,
  onChangeText,
  placeholder = 'Type your request...',
  screenName,
  screenParams = {},
  multiline = true,
  autoFocus = false,
  style,
  ...props
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  // Update suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value && value.length >= 2) {
        const newSuggestions = await SmartInputService.getSuggestions(
          value,
          screenName,
          screenParams
        );

        if (newSuggestions.length > 0) {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);

          // Smooth spring animation for natural feel
          Animated.spring(fadeAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        } else {
          fadeOutSuggestions();
        }
      } else {
        fadeOutSuggestions();
      }
    };

    fetchSuggestions();
  }, [value, screenName, screenParams]);

  const fadeOutSuggestions = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120, // Faster fade out
      useNativeDriver: true,
    }).start(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    });
  };

  /**
   * Handle suggestion chip tap
   * Replaces the last partial word with the full suggestion
   * Phase 3: Now tracks usage for learning!
   * Phase 6: Smart handling for replace/swap patterns
   */
  const handleSuggestionPress = async (suggestion) => {
    if (!value) return;

    // Get the words from the input
    const trimmed = value.trim();
    const words = trimmed.split(/\s+/);

    // SPECIAL CASE: Replace pattern detection
    // If user typed "replace" or "swap" or "change" and only 1 word exists,
    // APPEND the exercise instead of replacing the keyword
    const replaceKeywords = ['replace', 'swap', 'change'];
    const isReplacePattern = words.length === 1 && replaceKeywords.includes(words[0].toLowerCase());

    let newText;
    if (isReplacePattern) {
      // APPEND: "replace" → "replace Dumbbell Bench Press "
      newText = trimmed + ' ' + suggestion + ' ';
    } else {
      // REPLACE: Normal behavior - replace last word
      words[words.length - 1] = suggestion;
      newText = words.join(' ') + ' ';
    }

    onChangeText(newText);

    // PHASE 3: Track usage for learning
    const context = SmartInputService.detectContext(value, screenName, screenParams);
    await SmartInputService.trackUsage(suggestion, context, screenName);

    // Hide suggestions after selection
    fadeOutSuggestions();

    // Keep focus on input
    inputRef.current?.focus();
  };

  /**
   * Clear all text
   */
  const handleClear = () => {
    onChangeText('');
    fadeOutSuggestions();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Suggestions - Compact horizontal strip above input */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsWrapper,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }]
            }
          ]}
        >
          <ScrollView
            horizontal
            style={styles.suggestionsScroll}
            contentContainerStyle={styles.suggestionsContent}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
          >
            {/* Subtle indicator */}
            <View style={styles.suggestionIndicator}>
              <Ionicons name="sparkles" size={12} color={Colors.primary} />
            </View>

            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion}-${index}`}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.6}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, style]}
          multiline={multiline}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="sentences"
          {...props}
        />

        {/* Clear button */}
        {value && value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Modal */}
      <SmartInputSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingRight: Spacing.xl + Spacing.sm, // Make room for clear button
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm + 2,
    padding: Spacing.xs,
  },
  suggestionsWrapper: {
    marginBottom: Spacing.xs + 2, // Minimal spacing - tight integration with input
    overflow: 'hidden',
  },
  suggestionsScroll: {
    flexGrow: 0, // Don't expand
  },
  suggestionsContent: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 6,
    alignItems: 'center',
  },
  suggestionIndicator: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    opacity: 0.6,
  },
  suggestionChip: {
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    borderRadius: 14, // More rounded for modern look
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    height: 28, // Compact height
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: 13, // Slightly smaller for compactness
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
