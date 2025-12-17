import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import WorkoutPlanService from '../services/WorkoutPlanService';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { db, auth } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const WORKOUT_PROGRAMS_KEY = '@workout_programs';
const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function MyPlansScreen({ navigation }) {
  const [programs, setPrograms] = useState([]);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([]);
  const [programsExpanded, setProgramsExpanded] = useState(false);
  const [workoutsExpanded, setWorkoutsExpanded] = useState(false);
  const [planCount, setPlanCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadPrograms();
      loadStandaloneWorkouts();
      // Get count of available curated plans
      const allPlans = WorkoutPlanService.getAllPlans();
      setPlanCount(allPlans.length);
    }, [])
  );

  const handleDiscoverPlans = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DiscoverPlans');
  };

  const loadPrograms = async () => {
    try {
      // Load from local storage
      const savedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      let localPrograms = savedPrograms ? JSON.parse(savedPrograms) : [];

      // Also fetch from Firebase (imported from web)
      const userId = auth.currentUser?.uid;
      if (userId && db) {
        try {
          const programsRef = collection(db, 'users', userId, 'workout_programs');
          const q = query(programsRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);

          const firebasePrograms = [];
          querySnapshot.forEach((doc) => {
            firebasePrograms.push({ id: doc.id, ...doc.data() });
          });

          // Merge: add Firebase programs that aren't in local storage
          const localIds = new Set(localPrograms.map(p => p.id));
          const newFromFirebase = firebasePrograms.filter(p => !localIds.has(p.id));

          if (newFromFirebase.length > 0) {
            localPrograms = [...newFromFirebase, ...localPrograms];
            // Save merged back to local storage
            await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(localPrograms));
          }
        } catch (firebaseError) {
          console.log('Could not fetch from Firebase:', firebaseError.message);
        }
      }

      setPrograms(localPrograms);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadStandaloneWorkouts = async () => {
    try {
      // Load from local storage
      const savedWorkouts = await AsyncStorage.getItem(STANDALONE_WORKOUTS_KEY);
      let localWorkouts = savedWorkouts ? JSON.parse(savedWorkouts) : [];

      // Also fetch from Firebase (imported from web)
      const userId = auth.currentUser?.uid;
      if (userId && db) {
        try {
          const workoutsRef = collection(db, 'users', userId, 'standalone_workouts');
          const q = query(workoutsRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);

          const firebaseWorkouts = [];
          querySnapshot.forEach((doc) => {
            firebaseWorkouts.push({ id: doc.id, ...doc.data() });
          });

          // Merge: add Firebase workouts that aren't in local storage
          const localIds = new Set(localWorkouts.map(w => w.id));
          const newFromFirebase = firebaseWorkouts.filter(w => !localIds.has(w.id));

          if (newFromFirebase.length > 0) {
            localWorkouts = [...newFromFirebase, ...localWorkouts];
            // Save merged back to local storage
            await AsyncStorage.setItem(STANDALONE_WORKOUTS_KEY, JSON.stringify(localWorkouts));
          }
        } catch (firebaseError) {
          console.log('Could not fetch from Firebase:', firebaseError.message);
        }
      }

      setStandaloneWorkouts(localWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
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
      navigation={navigation}
      showBack={true}
      showHome={true}
      screenName="MyPlansScreen"
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Discover Plans Button */}
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={handleDiscoverPlans}
          activeOpacity={0.8}
        >
          <View style={styles.discoverContent}>
            <View style={styles.discoverIconContainer}>
              <Ionicons name="compass" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.discoverTextContainer}>
              <Text style={styles.discoverTitle}>Discover Plans</Text>
              <Text style={styles.discoverSubtitle}>Browse {planCount} pre-made programs</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

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
    paddingTop: Spacing.xxl,
  },
  createButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
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
  discoverButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    backgroundColor: '#1a1a1a',
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  discoverContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  discoverTextContainer: {
    flex: 1,
  },
  discoverTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  discoverSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});
