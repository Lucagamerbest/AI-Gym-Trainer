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

          // Fade in animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
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
      duration: 150,
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
   */
  const handleSuggestionPress = async (suggestion) => {
    if (!value) return;

    // Get the words from the input
    const trimmed = value.trim();
    const words = trimmed.split(/\s+/);

    // Replace the last word with the suggestion
    words[words.length - 1] = suggestion;

    // Join back and add trailing space
    const newText = words.join(' ') + ' ';

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

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsWrapper,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.suggestionsHeader}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={styles.suggestionsHeaderText}>Smart Suggestions</Text>
          </View>

          <ScrollView
            horizontal
            style={styles.suggestionsScroll}
            contentContainerStyle={styles.suggestionsContent}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion}-${index}`}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={Colors.primary}
                  style={styles.suggestionIcon}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
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
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    overflow: 'hidden',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '20',
  },
  suggestionsHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  suggestionsScroll: {
    maxHeight: 48,
  },
  suggestionsContent: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    marginRight: Spacing.xs,
    height: 32,
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  suggestionIcon: {
    opacity: 0.7,
  },
});
