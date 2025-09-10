import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Spacing } from '../constants/theme';

export default function HomeScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Your Fitness Journey"
      subtitle="Starts Here"
      navigation={navigation}
      showBack={false}
      showHome={false}
      centerContent={true}
    >
      <View style={styles.buttonContainer}>
        <StyledButton
          title="Nutrition"
          icon="🥗"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Nutrition')}
          style={styles.button}
        />
        
        <StyledButton
          title="Exercise"
          icon="💪"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Training')}
          style={styles.button}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
  },
  button: {
    marginBottom: Spacing.lg,
  },
});