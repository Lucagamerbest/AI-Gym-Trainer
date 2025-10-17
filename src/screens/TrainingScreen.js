import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrainingScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const workoutTypes = [
    { id: 'strength', name: 'Strength Training', icon: '🏋️', description: 'Build muscle and strength' },
    { id: 'cardio', name: 'Cardio', icon: '🏃', description: 'Improve endurance' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘', description: 'Increase mobility' },
    { id: 'hiit', name: 'HIIT', icon: '⚡', description: 'High intensity intervals' },
  ];

  return (
    <ScreenLayout
      title="Training"
      subtitle="Choose your workout"
      navigation={navigation}
      showBack={true}
      screenName="TrainingScreen"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Workout History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('WorkoutHistory')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary + '20', Colors.primary + '10']}
            style={styles.historyGradient}
          >
            <Text style={styles.historyIcon}>📅</Text>
            <View style={styles.historyTextContainer}>
              <Text style={styles.historyTitle}>Workout History</Text>
              <Text style={styles.historySubtitle}>View past workouts & track progress</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Start Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {workoutTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.quickStartCard}
                onPress={() => navigation.navigate('StartWorkout', { type: type.id })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                  style={styles.quickStartGradient}
                >
                  <Text style={styles.quickStartIcon}>{type.icon}</Text>
                  <Text style={styles.quickStartName}>{type.name}</Text>
                  <Text style={styles.quickStartDesc}>{type.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <TouchableOpacity style={styles.recentCard} activeOpacity={0.9}>
            <View style={styles.recentIcon}>
              <Text style={styles.recentEmoji}>📅</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Upper Body Day</Text>
              <Text style={styles.recentDate}>Yesterday - 45 mins</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recentCard} activeOpacity={0.9}>
            <View style={styles.recentIcon}>
              <Text style={styles.recentEmoji}>📅</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Leg Day</Text>
              <Text style={styles.recentDate}>3 days ago - 50 mins</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Create Custom Workout */}
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateWorkout')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.primary, '#059669']}
            style={styles.createGradient}
          >
            <Text style={styles.createIcon}>➕</Text>
            <Text style={styles.createText}>Create Custom Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  historyButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  historyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  historyIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  historySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickStartCard: {
    width: 150,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickStartGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  quickStartIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  quickStartName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  quickStartDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  recentDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 20,
    color: Colors.primary,
  },
  createButton: {
    marginBottom: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  createIcon: {
    fontSize: 20,
    color: Colors.background,
    marginRight: Spacing.sm,
  },
  createText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
});