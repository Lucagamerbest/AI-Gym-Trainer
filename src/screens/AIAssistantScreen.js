import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography } from '../constants/theme';

export default function AIAssistantScreen({ navigation }) {
  const aiOptions = [
    { id: 1, title: 'Get Meal Suggestions', subtitle: 'Personalized nutrition ideas', icon: '🍽️', category: 'nutrition' },
    { id: 2, title: 'Find a Recipe', subtitle: 'Discover healthy recipes', icon: '📖', category: 'nutrition' },
    { id: 3, title: 'Create a Meal Plan', subtitle: 'Weekly meal planning', icon: '📅', category: 'nutrition' },
    { id: 4, title: 'Generate Workout Plan', subtitle: 'Custom fitness routine', icon: '💪', category: 'fitness' },
    { id: 5, title: 'Modify Current Workout', subtitle: 'Adjust your routine', icon: '✏️', category: 'fitness' },
    { id: 6, title: 'Ask AI Anything', subtitle: 'General fitness help', icon: '🤖', category: 'general' },
  ];

  const renderOption = ({ item }) => (
    <StyledCard
      icon={item.icon}
      title={item.title}
      subtitle={item.subtitle}
      variant={item.category === 'nutrition' ? 'default' : item.category === 'fitness' ? 'elevated' : 'primary'}
      onPress={() => {
        // Handle AI option selection
      }}
      style={styles.optionCard}
    />
  );

  return (
    <ScreenLayout
      title="AI Assistant"
      subtitle="Your personal fitness coach"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={false}
    >
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeIcon}>🤖</Text>
        <Text style={styles.welcomeText}>How can I help you today?</Text>
        <Text style={styles.welcomeSubtext}>Choose an option below or ask me anything</Text>
      </View>

      <FlatList
        data={aiOptions}
        renderItem={renderOption}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomActions}>
        <StyledButton
          title="Voice Assistant"
          icon="🎤"
          size="lg"
          variant="primary"
          fullWidth
          onPress={() => {}}
          style={styles.voiceButton}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  welcomeText: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  welcomeSubtext: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  optionCard: {
    marginBottom: Spacing.md,
  },
  bottomActions: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voiceButton: {
    marginTop: Spacing.sm,
  },
});