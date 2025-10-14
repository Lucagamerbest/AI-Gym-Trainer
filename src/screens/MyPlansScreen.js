import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

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
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Create Buttons */}
        <View style={styles.createButtonsContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('WorkoutProgram')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, '#059669']}
              style={styles.createGradient}
            >
              <Text style={styles.createIcon}>+</Text>
              <Text style={styles.createText}>Create Program</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('WorkoutProgram', { isStandaloneWorkout: true })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, '#059669']}
              style={styles.createGradient}
            >
              <Text style={styles.createIcon}>+</Text>
              <Text style={styles.createText}>Create Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Programs Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setProgramsExpanded(!programsExpanded)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#374151', '#1F2937']}
            style={styles.toggleGradient}
          >
            <View style={styles.toggleContent}>
              <Text style={styles.toggleIcon}>📋</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Programs</Text>
                <Text style={styles.toggleSubtext}>{programs.length} programs</Text>
              </View>
              <Text style={styles.toggleArrow}>{programsExpanded ? '▼' : '▶'}</Text>
            </View>
          </LinearGradient>
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
                <View key={program.id || index} style={styles.itemCard}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ProgramDaySelection', { program })}
                    activeOpacity={0.9}
                    style={styles.itemTouchable}
                  >
                    <LinearGradient
                      colors={[Colors.primary + '15', Colors.primary + '08']}
                      style={styles.itemGradient}
                    >
                      <View style={styles.itemContent}>
                        <Text style={styles.itemName}>{program.name || 'Unnamed Program'}</Text>
                        <Text style={styles.itemMeta}>
                          {program.days?.length || 0} {program.days?.length === 1 ? 'day' : 'days'}
                          {program.description && ` • ${program.description}`}
                        </Text>
                      </View>
                      <View style={styles.arrow}>
                        <Text style={styles.arrowText}>→</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Workouts Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setWorkoutsExpanded(!workoutsExpanded)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#374151', '#1F2937']}
            style={styles.toggleGradient}
          >
            <View style={styles.toggleContent}>
              <Text style={styles.toggleIcon}>🏋️</Text>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleText}>Workouts</Text>
                <Text style={styles.toggleSubtext}>{standaloneWorkouts.length} workouts</Text>
              </View>
              <Text style={styles.toggleArrow}>{workoutsExpanded ? '▼' : '▶'}</Text>
            </View>
          </LinearGradient>
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
                <View key={workout.id || index} style={styles.itemCard}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('WorkoutDetail', {
                      workout: workout,
                    })}
                    activeOpacity={0.9}
                    style={styles.itemTouchable}
                  >
                    <LinearGradient
                      colors={[Colors.primary + '15', Colors.primary + '08']}
                      style={styles.itemGradient}
                    >
                      <View style={styles.itemContent}>
                        <Text style={styles.itemName}>{workout.name || 'Unnamed Workout'}</Text>
                        <Text style={styles.itemMeta}>
                          {workout.day?.exercises?.length || 0} exercises
                          {workout.description && ` • ${workout.description}`}
                        </Text>
                      </View>
                      <View style={styles.arrow}>
                        <Text style={styles.arrowText}>→</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
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
    marginBottom: Spacing.xl,
  },
  createButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  createIcon: {
    fontSize: 18,
    color: Colors.background,
    marginRight: Spacing.xs,
  },
  createText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  toggleButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  toggleSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  toggleArrow: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.md,
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
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  itemTouchable: {
    width: '100%',
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    marginLeft: Spacing.sm,
  },
  arrowText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
