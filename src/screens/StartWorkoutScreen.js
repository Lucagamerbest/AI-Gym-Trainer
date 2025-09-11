import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function StartWorkoutScreen({ navigation }) {
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('choose'); // 'choose' or 'custom'

  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '🎯', color: '#FF6B6B' },
    { id: 'back', name: 'Back', icon: '🔙', color: '#4ECDC4' },
    { id: 'legs', name: 'Legs', icon: '🦵', color: '#45B7D1' },
    { id: 'shoulders', name: 'Shoulders', icon: '💪', color: '#96CEB4' },
    { id: 'arms', name: 'Arms', icon: '💪', color: '#FFEAA7' },
    { id: 'core', name: 'Core', icon: '🎯', color: '#DDA0DD' },
  ];

  const workoutPrograms = [
    { id: 'beginner', name: 'Beginner Program', duration: '4 weeks', exercises: 12 },
    { id: 'strength', name: 'Strength Builder', duration: '8 weeks', exercises: 20 },
    { id: 'muscle', name: 'Muscle Mass', duration: '12 weeks', exercises: 24 },
    { id: 'athletic', name: 'Athletic Performance', duration: '6 weeks', exercises: 18 },
  ];

  return (
    <ScreenLayout
      title="Start Workout"
      subtitle="Choose your training method"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'choose' && styles.activeTab]}
            onPress={() => setActiveTab('choose')}
          >
            <Text style={[styles.tabText, activeTab === 'choose' && styles.activeTabText]}>
              Choose Exercises
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
            onPress={() => setActiveTab('custom')}
          >
            <Text style={[styles.tabText, activeTab === 'custom' && styles.activeTabText]}>
              Workout Program
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'choose' ? (
          <>
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

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('ExerciseList', { title: 'All Exercises' })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>📋</Text>
                  <Text style={styles.quickActionText}>Browse All</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigation.navigate('AIAssistant')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
                  style={styles.quickActionGradient}
                >
                  <Text style={styles.quickActionIcon}>🤖</Text>
                  <Text style={styles.quickActionText}>AI Coach</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Muscle Groups Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Muscle Groups</Text>
              <View style={styles.muscleGroupGrid}>
                {muscleGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.muscleGroupCard}
                    onPress={() => navigation.navigate('ProfessionalExerciseList', { 
                      initialFilters: { muscle: group.name }
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
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selected Exercises */}
            {selectedExercises.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selected Exercises ({selectedExercises.length})</Text>
                {selectedExercises.map((exercise, index) => (
                  <View key={index} style={styles.selectedExercise}>
                    <Text style={styles.selectedName}>{exercise.name}</Text>
                    <TouchableOpacity onPress={() => {
                      setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
                    }}>
                      <Text style={styles.removeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <StyledButton
                  title="Start Workout"
                  icon="▶️"
                  size="lg"
                  fullWidth
                  onPress={() => {/* Start workout logic */}}
                  style={styles.startButton}
                />
              </View>
            )}
          </>
        ) : (
          <>
            {/* Workout Programs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Program</Text>
              {workoutPrograms.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={styles.programCard}
                  onPress={() => {/* Load program */}}
                  activeOpacity={0.9}
                >
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <View style={styles.programMeta}>
                      <Text style={styles.programDuration}>📅 {program.duration}</Text>
                      <Text style={styles.programExercises}>💪 {program.exercises} exercises</Text>
                    </View>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Program */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Or Create Your Own</Text>
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
                  <Text style={styles.createText}>Create Custom Program</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

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
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.background,
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
  quickActions: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
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
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleGroupCard: {
    width: '31%',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  muscleGroupGradient: {
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  muscleGroupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  muscleGroupEmoji: {
    fontSize: 24,
  },
  muscleGroupName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  selectedName: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  removeButton: {
    fontSize: 20,
    color: Colors.error,
  },
  startButton: {
    marginTop: Spacing.md,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  programMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  programDuration: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  programExercises: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 20,
    color: Colors.primary,
  },
  createButton: {
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
});