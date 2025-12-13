import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { ImportButton } from '../components/ContentImportButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

const STANDALONE_WORKOUTS_KEY = '@standalone_workouts';

export default function PlanWorkoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { selectedDate } = route.params || {};
  const [userPrograms, setUserPrograms] = useState([]);
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([]);
  const [dateString, setDateString] = useState('');
  const [programsExpanded, setProgramsExpanded] = useState(false);
  const [workoutsExpanded, setWorkoutsExpanded] = useState(false);
  const [expandedProgramIds, setExpandedProgramIds] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setDateString(date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }));
    }
    loadUserPrograms();
    loadStandaloneWorkouts();
  }, [selectedDate]);

  const loadUserPrograms = async () => {
    try {
      const savedPrograms = await AsyncStorage.getItem('@workout_programs');
      if (savedPrograms) {
        setUserPrograms(JSON.parse(savedPrograms));
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

  const savePlannedWorkout = async (workoutData) => {
    try {
      const userId = user?.uid || 'guest';
      const dateKey = new Date(selectedDate).toISOString().split('T')[0];

      const plannedWorkoutData = {
        ...workoutData,
        plannedDate: dateKey,
        createdAt: new Date().toISOString(),
      };

      await WorkoutStorageService.savePlannedWorkout(dateKey, plannedWorkoutData, userId);

      Alert.alert(
        'Success',
        'Workout planned successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Main' },
                  { name: 'WorkoutHistory' },
                ],
              });
            },
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save planned workout');
    }
  };

  const handlePlanFromProgram = (program, day) => {
    const workoutData = {
      type: 'program',
      programId: program.id,
      programName: program.name,
      dayId: day.id,
      dayName: day.name,
      exercises: day.exercises || [],
    };
    savePlannedWorkout(workoutData);
  };

  const handlePlanFromStandaloneWorkout = (workout) => {
    const workoutData = {
      type: 'standalone',
      workoutId: workout.id,
      workoutName: workout.name,
      exercises: workout.day?.exercises || [],
    };
    savePlannedWorkout(workoutData);
  };

  const handlePlanCustomWorkout = () => {
    // Navigate to Create Workout screen for planning
    navigation.navigate('WorkoutProgram', {
      isStandaloneWorkout: true,
      fromPlanning: true,
      plannedDate: selectedDate,
    });
  };

  const toggleProgramExpanded = (programId) => {
    if (expandedProgramIds.includes(programId)) {
      setExpandedProgramIds(expandedProgramIds.filter(id => id !== programId));
    } else {
      setExpandedProgramIds([...expandedProgramIds, programId]);
    }
  };

  const handleViewWorkoutDetails = (workout, type, program = null, day = null) => {
    setSelectedWorkoutDetail({
      type,
      workout,
      program,
      day
    });
    setShowWorkoutModal(true);
  };

  const handlePlanFromModal = () => {
    const { type, program, day, workout } = selectedWorkoutDetail;
    setShowWorkoutModal(false);

    if (type === 'program') {
      handlePlanFromProgram(program, day);
    } else if (type === 'standalone') {
      handlePlanFromStandaloneWorkout(workout);
    }
  };

  return (
    <ScreenLayout
      title="Plan Workout"
      subtitle={dateString}
      navigation={navigation}
      showBack={true}
      showHome={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* From Your Programs */}
        {userPrograms.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setProgramsExpanded(!programsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>📋 From Your Programs</Text>
              <Text style={styles.expandIcon}>{programsExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {programsExpanded && userPrograms.map((program, programIndex) => {
              const isProgramExpanded = expandedProgramIds.includes(program.id || programIndex);

              return (
                <View key={programIndex} style={styles.programContainer}>
                  <TouchableOpacity
                    style={styles.programHeader}
                    onPress={() => toggleProgramExpanded(program.id || programIndex)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programExpandIcon}>{isProgramExpanded ? '▼' : '▶'}</Text>
                  </TouchableOpacity>

                  {isProgramExpanded && program.days?.map((day, dayIndex) => (
                    <TouchableOpacity
                      key={dayIndex}
                      style={styles.dayCard}
                      onPress={() => handleViewWorkoutDetails(null, 'program', program, day)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[Colors.primary + '15', Colors.primary + '08']}
                        style={styles.dayGradient}
                      >
                        <View style={styles.dayContent}>
                          <Text style={styles.dayName}>{day.name}</Text>
                          <Text style={styles.dayMeta}>
                            {day.exercises?.length || 0} exercises
                          </Text>
                        </View>
                        <Text style={styles.viewButton}>View</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* From Your Standalone Workouts */}
        {standaloneWorkouts.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setWorkoutsExpanded(!workoutsExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>🏋️ From Your Workouts</Text>
              <Text style={styles.expandIcon}>{workoutsExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>

            {workoutsExpanded && standaloneWorkouts.map((workout, workoutIndex) => (
              <TouchableOpacity
                key={workoutIndex}
                style={styles.dayCard}
                onPress={() => handleViewWorkoutDetails(workout, 'standalone')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary + '15', Colors.primary + '08']}
                  style={styles.dayGradient}
                >
                  <View style={styles.dayContent}>
                    <Text style={styles.dayName}>{workout.name}</Text>
                    <Text style={styles.dayMeta}>
                      {workout.day?.exercises?.length || 0} exercises
                    </Text>
                  </View>
                  <Text style={styles.viewButton}>View</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Custom Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏋️ Custom Workout</Text>

          <TouchableOpacity
            style={styles.customCard}
            onPress={handlePlanCustomWorkout}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary + '20', Colors.primary + '10']}
              style={styles.customGradient}
            >
              <View style={styles.customIcon}>
                <Text style={styles.customEmoji}>✨</Text>
              </View>
              <View style={styles.customContent}>
                <Text style={styles.customTitle}>Create Custom Workout</Text>
                <Text style={styles.customDesc}>Choose your own exercises</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Import Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Import Workout</Text>
          <View style={styles.importContainer}>
            <Text style={styles.importDesc}>
              Have a workout plan saved as a screenshot or PDF? Import it!
            </Text>
            <ImportButton
              label="Import Workout"
              icon="scan"
              size="medium"
              variant="secondary"
              fullWidth
              navigation={navigation}
              onImportComplete={(data, type) => {
                // Refresh programs list after import
                loadUserPrograms();
                Alert.alert('Success', 'Workout imported successfully!');
              }}
            />
          </View>
        </View>

        <StyledButton
          title="Cancel"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          secondary
        />
      </ScrollView>

      {/* Workout Details Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedWorkoutDetail && (
                <>
                  <Text style={styles.modalTitle}>
                    {selectedWorkoutDetail.type === 'program'
                      ? selectedWorkoutDetail.day?.name
                      : selectedWorkoutDetail.workout?.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedWorkoutDetail.type === 'program'
                      ? `From: ${selectedWorkoutDetail.program?.name}`
                      : selectedWorkoutDetail.workout?.description || 'Standalone Workout'}
                  </Text>

                  {/* Exercises List */}
                  <Text style={styles.exercisesTitle}>Exercises</Text>
                  {(selectedWorkoutDetail.type === 'program'
                    ? selectedWorkoutDetail.day?.exercises
                    : selectedWorkoutDetail.workout?.day?.exercises
                  )?.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.equipment} • {exercise.primaryMuscle || exercise.muscleGroup}
                      </Text>
                      {exercise.sets && exercise.sets.length > 0 && (
                        <Text style={styles.exerciseSets}>
                          {exercise.sets.length} set{exercise.sets.length > 1 ? 's' : ''} • {exercise.sets[0].reps} reps
                        </Text>
                      )}
                    </View>
                  ))}

                  {/* Actions */}
                  <StyledButton
                    title="Plan This Workout"
                    onPress={handlePlanFromModal}
                    style={styles.planModalButton}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowWorkoutModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  expandIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  programContainer: {
    marginBottom: Spacing.lg,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginBottom: Spacing.sm,
  },
  programName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  programExpandIcon: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  dayCard: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  dayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: BorderRadius.lg,
  },
  dayContent: {
    flex: 1,
  },
  dayName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  dayMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  planButton: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
  },
  arrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  customCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  customGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderRadius: BorderRadius.lg,
  },
  customIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  customEmoji: {
    fontSize: 24,
  },
  customContent: {
    flex: 1,
  },
  customTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  customDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  importContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  viewButton: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  exercisesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  exerciseItem: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  exerciseSets: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  planModalButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  closeButton: {
    backgroundColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
});
