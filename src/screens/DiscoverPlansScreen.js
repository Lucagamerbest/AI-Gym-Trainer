/**
 * DiscoverPlansScreen.js
 *
 * Main screen for discovering and browsing pre-made workout plans
 * Shows Find My Program button and browse by split type categories
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useColors } from '../context/ThemeContext';
import ScreenLayout from '../components/ScreenLayout';
import PlanBrowser from '../components/PlanBrowser';

export default function DiscoverPlansScreen({ navigation }) {
  const Colors = useColors();
  const styles = createStyles(Colors);

  const handleSelectPlan = (plan) => {
    navigation.navigate('PlanDetail', { plan });
  };

  return (
    <ScreenLayout
      title="Discover Plans"
      showBack={true}
      navigation={navigation}
    >
      <View style={styles.content}>
        <PlanBrowser onSelectPlan={handleSelectPlan} />
      </View>
    </ScreenLayout>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  content: {
    flex: 1,
  },
});
