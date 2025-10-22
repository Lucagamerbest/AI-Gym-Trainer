import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import AIButtonSection from './AIButtonSection';
import { getAISectionsForScreen, hasAISections } from '../config/aiSectionConfig';
import AIService from '../services/ai/AIService';
import ContextManager from '../services/ai/ContextManager';
import { useAuth } from '../context/AuthContext';

/**
 * AIButtonModal
 *
 * Modal version of AISectionPanel - replaces AIChatModal with button-based interface
 * Opens from AIHeaderButton at the top of screens
 */
export default function AIButtonModal({
  visible,
  onClose,
  screenName,
}) {
  const { user } = useAuth();
  const [loadingButton, setLoadingButton] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  // Get sections for this screen
  const sections = getAISectionsForScreen(screenName);

  /**
   * Handle button press
   * Sends the button action to AI with context
   */
  const handleButtonPress = async (button) => {
    try {
      setLoadingButton(button.text);
      setLastResponse(null);

      // Build context for this screen
      const context = await ContextManager.buildContextForScreen(screenName, user?.uid);

      // Send to AI with tools
      const result = await AIService.sendMessageWithTools(button.text, context);

      // Store response
      setLastResponse(result.response);

    } catch (error) {
      console.error('AI button error:', error);
      setLastResponse("Sorry, I couldn't process that request. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  // If no sections, show message
  const noSections = !hasAISections(screenName);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>🤖</Text>
            <View>
              <Text style={styles.headerTitle}>AI Coach</Text>
              <Text style={styles.headerSubtitle}>
                {screenName ? screenName.replace('Screen', '') : 'Assistant'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {noSections ? (
            <View style={styles.noSectionsContainer}>
              <Text style={styles.noSectionsIcon}>ℹ️</Text>
              <Text style={styles.noSectionsText}>
                No AI actions available for this screen yet.
              </Text>
            </View>
          ) : (
            <>
              {sections.map((section, index) => (
                <AIButtonSection
                  key={index}
                  title={section.title}
                  icon={section.icon}
                  buttons={section.buttons}
                  onButtonPress={handleButtonPress}
                  defaultExpanded={index === 0}
                  loading={loadingButton !== null}
                />
              ))}

              {/* Response Display */}
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
                  <Text style={styles.loadingText}>
                    💭 Thinking about "{loadingButton}"...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'web' ? 20 : 40,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  noSectionsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  noSectionsIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  noSectionsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
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
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
