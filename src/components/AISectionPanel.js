import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIButtonSection from './AIButtonSection';
import { getAISectionsForScreen, hasAISections } from '../config/aiSectionConfig';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';
import { useAICoach } from '../context/AICoachContext';

/**
 * AISectionPanel
 *
 * Main container component for AI sections on a screen
 * Renders collapsible sections with action buttons based on screen configuration
 *
 * Usage:
 * <AISectionPanel
 *   screenName="WorkoutScreen"
 * />
 */
export default function AISectionPanel({
  screenName,
  onResponse,
  containerStyle,
  showHeader = true,
  defaultExpandFirst = false,
}) {
  const { user } = useAuth();
  const { coachName } = useAICoach();
  const [loadingButton, setLoadingButton] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  // Get sections for this screen
  const sections = getAISectionsForScreen(screenName);

  // If no sections, don't render anything
  if (!hasAISections(screenName)) {
    return null;
  }

  /**
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    try {
      // Handle dynamic text (function that returns text based on time)
      const buttonText = button.isDynamic && typeof button.text === 'function'
        ? button.text()
        : button.text;

      setLoadingButton(buttonText);
      setLastResponse(null);

      // Build context for this screen
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);

      // Prepare AI request
      let userMessage = buttonText;

      // If button has a specific tool, we can optimize the request
      if (button.toolName) {
        // The AI should intelligently call the right tool based on the message
        // We trust the tool system to handle this
        userMessage = buttonText;
      }

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(userMessage, context);

      // Store and callback with response
      setLastResponse(result.response);
      onResponse?.(result.response, button);

    } catch (error) {
      console.error('AI button error:', error);

      const errorMessage = "Sorry, I couldn't process that request. Please try again.";
      setLastResponse(errorMessage);
      onResponse?.(errorMessage, button);

    } finally {
      setLoadingButton(null);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🤖</Text>
          <Text style={styles.headerTitle}>{coachName}</Text>
        </View>
      )}

      {/* Sections */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {sections.map((section, index) => (
          <AIButtonSection
            key={index}
            title={section.title}
            icon={section.icon}
            buttons={section.buttons}
            onButtonPress={handleButtonPress}
            defaultExpanded={defaultExpandFirst && index === 0}
            loading={loadingButton !== null}
          />
        ))}

        {/* Response Display (if any) */}
        {lastResponse && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseIcon}>💬</Text>
              <Text style={styles.responseTitle}>AI Response</Text>
            </View>
            <Text style={styles.responseText}>{lastResponse}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {loadingButton && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>
              Thinking about "{loadingButton}"...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    padding: Spacing.md,
  },
  responseContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  responseIcon: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  responseTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  responseText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  loadingText: {
    marginLeft: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
});
