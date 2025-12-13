import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { ImportButton } from '../components/ContentImportButton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const WORKOUT_PROGRAMS_KEY = '@workout_programs';
const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function MyPlansScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([]);
  const [programsExpanded, setProgramsExpanded] = useState(false);
  const [workoutsExpanded, setWorkoutsExpanded] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadPrograms();
      loadStandaloneWorkouts();
    }, [])
  );

  const loadPrograms = async () => {
    try {
      const savedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      if (savedPrograms) {
        setPrograms(JSON.parse(savedPrograms));
      }
    } catch (error) {
    }
  };

  const loadStandaloneWorkouts = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
      if (savedWorkouts) {
        setStandaloneWorkouts(JSON.parse(savedWorkouts));
      }
    } catch (error) {
    }
  };

  const handleDeleteProgram = async (programId) => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPrograms = programs.filter(p => p.id !== programId);
              await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
              setPrograms(updatedPrograms);
            } catch (error) {
            }
          },
        },
      ]
    );
  };

  const handleDeleteWorkout = async (workoutId) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedWorkouts = standaloneWorkouts.filter(w => w.id !== workoutId);
              await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(updatedWorkouts));
              setStandaloneWorkouts(updatedWorkouts);
            } catch (error) {
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout
      title="My Plans"
      subtitle="Programs & Workouts"
      navigation={navigation}
      showBack={true}
      showHome={true}
      screenName="MyPlansScreen"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Create Buttons */}
        <View style={styles.createButtonsContainer}>
          <StyledButton
            title="Create Program"
            icon="add"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('WorkoutProgram')}
            style={styles.createButton}
          />
          <StyledButton
            title="Create Workout"
            icon="add"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('WorkoutProgram', { isStandaloneWorkout: true })}
            style={styles.createButton}
          />
        </View>

        {/* Import Section */}
        <View style={styles.importSection}>
          <View style={styles.importHeader}>
            <Ionicons name="scan" size={20} color={Colors.primary} />
            <Text style={styles.importTitle}>Import from Photo or PDF</Text>
          </View>
          <Text style={styles.importDesc}>
            Have a workout plan saved as a screenshot or PDF? Import it instantly!
          </Text>
          <ImportButton
            label="Import Workout"
            icon="camera"
            size="large"
            variant="primary"
            fullWidth
            navigation={navigation}
            onImportComplete={(data, type) => {
              loadPrograms();
              loadStandaloneWorkouts();
              Alert.alert('Success', 'Workout imported and saved!');
            }}
          />
        </View>

        {/* Programs Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setProgramsExpanded(!programsExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleContent}>
            <View style={styles.toggleIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleText}>Programs</Text>
              <Text style={styles.toggleSubtext}>{programs.length} programs</Text>
            </View>
            <Ionicons
              name={programsExpanded ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={Colors.primary}
            />
          </View>
        </TouchableOpacity>

        {/* Programs Section */}
        {programsExpanded && (
          <View style={styles.section}>
            {programs.length === 0 ? (
              <StyledCard variant="elevated" style={styles.emptyCard}>
                <Text style={styles.emptyText}>No programs yet</Text>
                <Text style={styles.emptySubtext}>Create a multi-day workout program</Text>
              </StyledCard>
            ) : (
              programs.map((program, index) => (
                <TouchableOpacity
                  key={`program-${program.id}-${index}`}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('ProgramDaySelection', { program })}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{program.name || 'Unnamed Program'}</Text>
                    <Text style={styles.itemMeta}>
                      {program.days?.length || 0} {program.days?.length === 1 ? 'day' : 'days'}
                      {program.description && ` • ${program.description}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Workouts Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setWorkoutsExpanded(!workoutsExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.toggleContent}>
            <View style={styles.toggleIconContainer}>
              <Ionicons name="barbell-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleText}>Workouts</Text>
              <Text style={styles.toggleSubtext}>{standaloneWorkouts.length} workouts</Text>
            </View>
            <Ionicons
              name={workoutsExpanded ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={Colors.primary}
            />
          </View>
        </TouchableOpacity>

        {/* Standalone Workouts Section */}
        {workoutsExpanded && (
          <View style={styles.section}>
            {standaloneWorkouts.length === 0 ? (
              <StyledCard variant="elevated" style={styles.emptyCard}>
                <Text style={styles.emptyText}>No workouts yet</Text>
                <Text style={styles.emptySubtext}>Create a standalone workout</Text>
              </StyledCard>
            ) : (
              standaloneWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={`workout-${workout.id}-${index}`}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('WorkoutDetail', {
                    workout: workout,
                  })}
                  activeOpacity={0.8}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{workout.name || 'Unnamed Workout'}</Text>
                    <Text style={styles.itemMeta}>
                      {workout.day?.exercises?.length || 0} exercises
                      {workout.description && ` • ${workout.description}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  createButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  importSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  importTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  importDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  createButton: {
    flex: 1,
  },
  toggleButton: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  toggleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  toggleSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
