import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import AIChatModal from '../components/AIChatModal';
import ProactiveSuggestionCard from '../components/ProactiveSuggestionCard';
import { Colors, Spacing, Typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import ProactiveAIService from '../services/ai/ProactiveAIService';

export default function AIScreen({ navigation }) {
  const { user } = useAuth();
  const [chatVisible, setChatVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  // Load suggestions when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadSuggestions();
    }, [user?.uid])
  );

  const loadSuggestions = async () => {
    if (!user?.uid) return;

    try {
      const activeSuggestions = await ProactiveAIService.getAllSuggestions(user.uid);
      setSuggestions(activeSuggestions);
      console.log(`📊 Found ${activeSuggestions.length} AI suggestions`);
    } catch (error) {
      console.log('Error loading suggestions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  };

  const handleSuggestionPress = (suggestion) => {
    // Get the AI prompt for this suggestion
    const prompt = ProactiveAIService.getSuggestionPrompt(suggestion);
    setInitialMessage(prompt);
    setChatVisible(true);
  };

  const handleDismiss = (suggestion) => {
    // Dismiss this suggestion
    ProactiveAIService.dismissSuggestion(
      suggestion.type,
      suggestion.data?.exerciseName || suggestion.data?.lastWorkout?.id || 'general'
    );
    // Reload suggestions
    loadSuggestions();
  };

  return (
    <>
      <ScreenLayout
        title="AI Assistant"
        subtitle="Your Personal Fitness Coach"
        navigation={navigation}
        showBack={false}
        showHome={false}
        centerContent={false}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Proactive Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bulb" size={24} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>AI Suggestions</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                I noticed something you might want to know
              </Text>

              {suggestions.map((suggestion, index) => (
                <ProactiveSuggestionCard
                  key={`${suggestion.type}_${index}`}
                  suggestion={suggestion}
                  onPress={() => handleSuggestionPress(suggestion)}
                  onDismiss={() => handleDismiss(suggestion)}
                />
              ))}
            </View>
          )}

          {/* Main AI Interface */}
          <View style={styles.mainSection}>
            <Ionicons name="hardware-chip" size={80} color={Colors.primary} style={{ marginBottom: 20 }} />
            <Text style={styles.mainText}>AI Fitness Coach</Text>
            <Text style={styles.subText}>
              {suggestions.length > 0
                ? 'Tap a suggestion above or start a new chat'
                : 'Ask me anything about fitness'}
            </Text>

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => {
                setInitialMessage('');
                setChatVisible(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="chatbubble" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.chatButtonText}>Start Chat</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                I can help you with workouts, nutrition, progress tracking, and personalized fitness advice based on your current activity.
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenLayout>

      <AIChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        initialMessage={initialMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  suggestionsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  mainSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  mainText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  chatButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chatButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 320,
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});