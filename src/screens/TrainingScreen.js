import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrainingScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '🎯', color: '#FF6B6B' },
    { id: 'back', name: 'Back', icon: '🔙', color: '#4ECDC4' },
    { id: 'legs', name: 'Legs', icon: '🦵', color: '#45B7D1' },
    { id: 'shoulders', name: 'Shoulders', icon: '💪', color: '#96CEB4' },
    { id: 'arms', name: 'Arms', icon: '💪', color: '#FFEAA7' },
    { id: 'core', name: 'Core', icon: '🎯', color: '#DDA0DD' },
  ];

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
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                navigation.navigate('ExerciseList', { 
                  searchQuery: searchQuery.trim() 
                });
              }
            }}
          />
        </View>

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

        {/* Muscle Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscle Groups</Text>
          <View style={styles.muscleGroupGrid}>
            {muscleGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.muscleGroupCard}
                onPress={() => navigation.navigate('ExerciseList', { 
                  muscleGroup: group.id,
                  title: `${group.name} Exercises`
                })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[group.color + '20', group.color + '10']}
                  style={styles.muscleGroupGradient}
                >
                  <View style={[styles.muscleGroupIcon, { backgroundColor: group.color + '30' }]}>
                    <Text style={styles.muscleGroupEmoji}>{group.icon}</Text>
                  </View>
                  <Text style={styles.muscleGroupName}>{group.name}</Text>
                  <Text style={styles.exerciseCount}>
                    {group.id === 'chest' ? '4 exercises' : 
                     group.id === 'back' ? '4 exercises' :
                     group.id === 'legs' ? '4 exercises' :
                     group.id === 'shoulders' ? '3 exercises' :
                     group.id === 'arms' ? '4 exercises' :
                     '4 exercises'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
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
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleGroupCard: {
    width: '48%',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  muscleGroupGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  muscleGroupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  muscleGroupEmoji: {
    fontSize: 28,
  },
  muscleGroupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
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