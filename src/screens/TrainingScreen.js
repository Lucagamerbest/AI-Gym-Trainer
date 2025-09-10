import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Spacing } from '../constants/theme';

export default function TrainingScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Training"
      subtitle="Build your strength"
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <View style={styles.container}>
        <StyledButton
          title="Start Workout"
          icon="💪"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('StartWorkout')}
          style={styles.button}
        />
        
        <StyledButton
          title="Workout Program"
          icon="📋"
          size="lg"
          variant="secondary"
          fullWidth
          onPress={() => {}}
          style={styles.button}
        />
        
        <StyledButton
          title="Discover Workouts"
          icon="🔍"
          size="lg"
          variant="ghost"
          fullWidth
          onPress={() => {}}
          style={styles.button}
        />
        
        <StyledButton
          title="AI Coach"
          icon="🤖"
          size="md"
          variant="card"
          fullWidth
          onPress={() => navigation.navigate('AIAssistant')}
          style={styles.button}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xl,
  },
  button: {
    marginBottom: Spacing.lg,
  },
});