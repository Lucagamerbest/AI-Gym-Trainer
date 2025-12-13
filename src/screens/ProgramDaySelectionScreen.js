import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

const WORKOUT_PROGRAMS_KEY = '@workout_programs';

export default function ProgramDaySelectionScreen({ navigation, route }) {
  const { program } = route.params;
  const { startWorkout } = useWorkout();
  const { user } = useAuth();
  const [viewDetailsDay, setViewDetailsDay] = useState(null);
  const [showScheduleOptionsModal, setShowScheduleOptionsModal] = useState(false);
  const [showProgramScheduleModal, setShowProgramScheduleModal] = useState(false);
  const [showSingleWorkoutModal, setShowSingleWorkoutModal] = useState(false);
  const [selectedWorkoutForScheduling, setSelectedWorkoutForScheduling] = useState(null);
  const [weeksToSchedule, setWeeksToSchedule] = useState(4);
  const [showSetScheduleModal, setShowSetScheduleModal] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState(
    program.weeklySchedule || [
      { day: 'Monday', type: 'rest', workoutIndex: null },
      { day: 'Tuesday', type: 'rest', workoutIndex: null },
      { day: 'Wednesday', type: 'rest', workoutIndex: null },
      { day: 'Thursday', type: 'rest', workoutIndex: null },
      { day: 'Friday', type: 'rest', workoutIndex: null },
      { day: 'Saturday', type: 'rest', workoutIndex: null },
      { day: 'Sunday', type: 'rest', workoutIndex: null },
    ]
  );

  const handleStartDay = (day, dayIndex) => {
    if (!day.exercises || day.exercises.length === 0) {
      Alert.alert('No Exercises', 'This day has no exercises configured.');
      return;
    }

    // Format exercises to match the workout screen's expected format
    const formattedExercises = day.exercises.map(exercise => ({
      ...exercise,
      // Ensure the exercise has the expected structure
      name: exercise.name,
      targetMuscle: exercise.targetMuscle || '',
      equipment: exercise.equipment || 'Not specified',
      difficulty: exercise.difficulty || 'Intermediate',
      // Keep the original sets data for reference
      programSets: exercise.sets,
    }));

    // Initialize the exercise sets
    const initializedSets = initializeExerciseSets(day.exercises);

    // Start workout with the program's exercises
    startWorkout({
      exercises: formattedExercises,
      startTime: new Date().toISOString(),
      exerciseSets: initializedSets,
      currentExerciseIndex: 0,
      fromProgram: true,
      programName: program.name,
      dayName: day.name,
      dayIndex: dayIndex,
    });

    // Navigate directly to workout screen
    navigation.navigate('Workout', {
      fromProgram: true,
      programExercises: formattedExercises,
      programName: program.name,
      dayName: day.name,
    });
  };

  // Helper function to detect if exercise is cardio
  const isCardioExercise = (exercise) => {
    if (!exercise || !exercise.id) return false;
    const cardioKeywords = ['running', 'jogging', 'treadmill', 'walking', 'cardio', 'cycling', 'biking'];
    const id = exercise.id.toLowerCase();
    const name = (exercise.name || '').toLowerCase();
    return cardioKeywords.some(keyword => id.includes(keyword) || name.includes(keyword));
  };

  // Initialize sets based on program configuration
  const initializeExerciseSets = (exercises) => {
    const sets = {};
    exercises.forEach((exercise, index) => {
      const isCardio = isCardioExercise(exercise);

      if (exercise.sets && exercise.sets.length > 0) {
        // Use the sets defined in the program - preserve ALL set data
        sets[index] = exercise.sets.map(set => {
          if (isCardio) {
            // For cardio: preserve duration (in minutes) and convert to seconds
            const durationInMinutes = parseInt(set.duration) || 30;
            return {
              duration: durationInMinutes * 60,  // Convert minutes to seconds for display
              completed: false,
              type: set.type || 'normal',
              plannedDuration: durationInMinutes * 60, // Store planned duration
            };
          } else {
            // For regular exercises: preserve reps
            return {
              weight: '',  // User will fill this in
              reps: set.reps || '10',  // Pre-fill with program's rep target
              completed: false,
              type: set.type || 'normal',
              rest: set.rest || '90',
              // Store the original program reps for display purposes
              programReps: set.reps || '10',
            };
          }
        });
      } else {
        // Default to 3 sets if none defined
        if (isCardio) {
          sets[index] = [
            { duration: 0, completed: false, type: 'normal' },
            { duration: 0, completed: false, type: 'normal' },
            { duration: 0, completed: false, type: 'normal' },
          ];
        } else {
          sets[index] = [
            { weight: '', reps: '', completed: false, type: 'normal' },
            { weight: '', reps: '', completed: false, type: 'normal' },
            { weight: '', reps: '', completed: false, type: 'normal' },
          ];
        }
      }
    });
    return sets;
  };

  const getTotalSets = (exercises) => {
    return exercises.reduce((total, exercise) => {
      const setCount = exercise.sets ? exercise.sets.length : 3;
      return total + setCount;
    }, 0);
  };

  const handleEditDay = async (dayIndex) => {
    // Save temp state for editing
    try {
      await AsyncStorage.setItem('@temp_program_state', JSON.stringify({
        programName: program.name,
        programDescription: program.description,
        workoutDays: program.days,
        currentDayIndex: dayIndex,
        programId: program.id
      }));

      navigation.navigate('WorkoutDayEdit', {
        dayIndex: dayIndex,
        programId: program.id,
        refresh: Date.now()
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to edit day');
    }
  };

  const handleDeleteProgram = () => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this entire program?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
              if (storedPrograms) {
                const programs = JSON.parse(storedPrograms);
                const updatedPrograms = programs.filter(p => p.id !== program.id);
                await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(updatedPrograms));
                Alert.alert('Success', 'Program deleted successfully');
                navigation.goBack();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete program');
            }
          },
        },
      ]
    );
  };

  const handleEditProgram = async () => {
    try {
      await AsyncStorage.setItem('@temp_program_state', JSON.stringify({
        programName: program.name,
        programDescription: program.description,
        workoutDays: program.days,
        programId: program.id,
        editMode: true
      }));

      navigation.navigate('WorkoutProgram', {
        editMode: true,
        programId: program.id,
        refresh: Date.now()
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to edit program');
    }
  };

  const handleDeleteDay = async (dayIndex) => {
    Alert.alert(
      'Delete Workout Day',
      `Are you sure you want to delete ${program.days[dayIndex].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
              if (storedPrograms) {
                const programs = JSON.parse(storedPrograms);
                const programIndex = programs.findIndex(p => p.id === program.id);

                if (programIndex !== -1) {
                  programs[programIndex].days.splice(dayIndex, 1);
                  await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs));

                  // Refresh the screen with updated program
                  navigation.replace('ProgramDaySelection', {
                    program: programs[programIndex]
                  });
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete day');
            }
          },
        },
      ]
    );
  };

  const getSetTypeLabel = (type) => {
    switch(type) {
      case 'warmup': return 'Warmup';
      case 'dropset': return 'Drop Set';
      case 'failure': return 'Failure';
      case 'superset': return 'Superset';
      default: return 'Normal';
    }
  };

  const getSetTypeColor = (type) => {
    switch(type) {
      case 'warmup': return '#FFA500';
      case 'dropset': return '#9B59B6';
      case 'failure': return '#E74C3C';
      case 'superset': return '#3498DB';
      default: return Colors.primary;
    }
  };

  const handleSaveWeeklySchedule = async () => {
    try {
      const storedPrograms = await AsyncStorage.getItem(WORKOUT_PROGRAMS_KEY);
      if (storedPrograms) {
        const programs = JSON.parse(storedPrograms);
        const programIndex = programs.findIndex(p => p.id === program.id);

        if (programIndex !== -1) {
          programs[programIndex].weeklySchedule = weeklySchedule;
          await AsyncStorage.setItem(WORKOUT_PROGRAMS_KEY, JSON.stringify(programs));

          // Update the local program object
          program.weeklySchedule = weeklySchedule;

          setShowSetScheduleModal(false);
          Alert.alert('Success', 'Weekly schedule saved successfully!');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save weekly schedule');
    }
  };

  const handleScheduleClick = () => {
    // Show options modal to choose between single workout or full program
    setShowScheduleOptionsModal(true);
  };

  const handleScheduleSingleWorkout = (workout, workoutIndex) => {
    setSelectedWorkoutForScheduling({ workout, workoutIndex });
    setShowScheduleOptionsModal(false);
    setShowSingleWorkoutModal(true);
  };

  const handleScheduleFullProgram = () => {
    setShowScheduleOptionsModal(false);

    // Check if weekly schedule is set
    if (!program.weeklySchedule || program.weeklySchedule.length === 0) {
      Alert.alert(
        'Set Weekly Schedule First',
        'To schedule the full program, you need to set up a weekly schedule. Would you like to set it up now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Schedule', onPress: () => setShowSetScheduleModal(true) }
        ]
      );
      return;
    }

    setShowProgramScheduleModal(true);
  };

  const confirmProgramSchedule = async () => {
    try {
      const userId = user?.uid || 'guest';
      const startDate = new Date();

      const result = await WorkoutStorageService.scheduleProgramWorkouts(
        program,
        startDate,
        weeksToSchedule,
        userId
      );

      if (result.success) {
        setShowProgramScheduleModal(false);
        Alert.alert(
          'Success',
          `Scheduled ${result.scheduledCount} workout${result.scheduledCount > 1 ? 's' : ''} to your calendar for the next ${weeksToSchedule} week${weeksToSchedule > 1 ? 's' : ''}`,
          [
            {
              text: 'View Calendar',
              onPress: () => {
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Main' },
                    { name: 'WorkoutHistory' },
                  ],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to schedule workouts');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule workouts to calendar');
    }
  };

  return (
    <ScreenLayout
      title={program.name}
      subtitle="Select a workout day to begin"
      navigation={navigation}
      showBack={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {program.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{program.description}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButtonWrapper}
            onPress={handleScheduleClick}
            activeOpacity={0.7}
          >
            <View style={[styles.circularButton, styles.scheduleButton]}>
              <Text style={styles.buttonIcon}>📅</Text>
            </View>
            <Text style={styles.buttonLabel}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonWrapper}
            onPress={handleEditProgram}
            activeOpacity={0.7}
          >
            <View style={[styles.circularButton, styles.editButton]}>
              <Text style={styles.buttonIcon}>✏️</Text>
            </View>
            <Text style={styles.buttonLabel}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonWrapper}
            onPress={handleDeleteProgram}
            activeOpacity={0.7}
          >
            <View style={[styles.circularButton, styles.deleteActionButton]}>
              <Text style={styles.buttonIcon}>🗑️</Text>
            </View>
            <Text style={styles.buttonLabel}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysContainer}>
          {program.days.map((day, index) => (
            <TouchableOpacity
              key={day.id || index}
              style={styles.dayCard}
              onPress={() => handleStartDay(day, index)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary + '10', Colors.primary + '05']}
                style={styles.dayGradient}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayNumber}>Day {index + 1}</Text>
                    <Text style={styles.dayName}>{day.name}</Text>
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <TouchableOpacity
                      style={styles.viewDayButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setViewDetailsDay(day);
                      }}
                    >
                      <Text style={styles.dayActionIcon}>👁️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editDayButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditDay(index);
                      }}
                    >
                      <Text style={styles.dayActionIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteDayButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteDay(index);
                      }}
                    >
                      <Text style={styles.dayActionIcon}>🗑️</Text>
                    </TouchableOpacity>
                    <View style={styles.startIcon}>
                      <Text style={styles.startIconText}>▶</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dayStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{day.exercises.length}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{getTotalSets(day.exercises)}</Text>
                    <Text style={styles.statLabel}>Total Sets</Text>
                  </View>
                </View>

                {/* Exercise preview */}
                <View style={styles.exercisePreview}>
                  <Text style={styles.exercisePreviewTitle}>Exercises:</Text>
                  {day.exercises.slice(0, 3).map((exercise, exIndex) => (
                    <View key={exIndex} style={styles.exercisePreviewItem}>
                      <Text style={styles.exercisePreviewText}>
                        • {exercise.name}
                        {exercise.sets && exercise.sets.length > 0 && (
                          <Text style={styles.setsPreviewText}>
                            {' '}({exercise.sets.length} sets)
                          </Text>
                        )}
                      </Text>
                    </View>
                  ))}
                  {day.exercises.length > 3 && (
                    <Text style={styles.moreExercisesText}>
                      +{day.exercises.length - 3} more exercises
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* View Details Modal */}
      <Modal
        visible={viewDetailsDay !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewDetailsDay(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>
                {viewDetailsDay?.name || 'Workout Details'}
              </Text>
              <TouchableOpacity
                onPress={() => setViewDetailsDay(null)}
                style={styles.closeModalButton}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScrollView} showsVerticalScrollIndicator={false}>
              {viewDetailsDay?.exercises?.map((exercise, index) => (
                <View key={index} style={styles.detailExerciseCard}>
                  <Text style={styles.detailExerciseName}>{exercise.name}</Text>
                  <Text style={styles.detailExerciseMuscle}>
                    {exercise.primaryMuscle || exercise.targetMuscle}
                    {exercise.equipment && ` • ${exercise.equipment}`}
                  </Text>

                  <View style={styles.detailSetsContainer}>
                    {exercise.sets && exercise.sets.length > 0 ? (
                      exercise.sets.map((set, setIndex) => (
                        <View key={setIndex} style={styles.detailSetRow}>
                          <View
                            style={[
                              styles.detailSetType,
                              { backgroundColor: getSetTypeColor(set.type) }
                            ]}
                          >
                            <Text style={styles.detailSetNumber}>
                              {setIndex + 1}
                            </Text>
                          </View>
                          <Text style={styles.detailSetInfo}>
                            {set.reps || '10'} reps
                            {set.type !== 'normal' && ` • ${getSetTypeLabel(set.type)}`}
                            {set.rest && ` • ${set.rest}s rest`}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noSetsText}>No sets configured</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeDetailsButton}
              onPress={() => setViewDetailsDay(null)}
            >
              <Text style={styles.closeDetailsButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Schedule Options Modal - Choose Single Workout or Full Program */}
      <Modal
        visible={showScheduleOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.optionsModalTitle}>Schedule Options</Text>
            <Text style={styles.optionsModalSubtitle}>
              Choose how you want to schedule your workouts
            </Text>

            {/* Single Workout Option */}
            <View style={styles.scheduleOptionsSection}>
              <Text style={styles.optionsSectionTitle}>Single Workout</Text>
              <Text style={styles.optionsSectionSubtitle}>
                Pick a specific workout and select multiple dates
              </Text>

              <ScrollView style={styles.workoutOptionsList} showsVerticalScrollIndicator={false}>
                {program.days.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.workoutOptionCard}
                    onPress={() => handleScheduleSingleWorkout(day, index)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981' + '20', '#10B981' + '10']}
                      style={styles.workoutOptionGradient}
                    >
                      <Text style={styles.workoutOptionName}>{day.name}</Text>
                      <Text style={styles.workoutOptionMeta}>
                        {day.exercises?.length || 0} exercises
                      </Text>
                      <Text style={styles.workoutOptionArrow}>→</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Full Program Option */}
            <TouchableOpacity
              style={styles.fullProgramOption}
              onPress={handleScheduleFullProgram}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.fullProgramGradient}
              >
                <Text style={styles.fullProgramIcon}>📆</Text>
                <View style={styles.fullProgramTextContainer}>
                  <Text style={styles.fullProgramTitle}>Schedule Full Program</Text>
                  <Text style={styles.fullProgramSubtitle}>
                    Schedule entire program with weekly pattern
                  </Text>
                </View>
                <Text style={styles.fullProgramArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Edit Weekly Schedule Button */}
            <TouchableOpacity
              style={styles.editScheduleOption}
              onPress={() => {
                setShowScheduleOptionsModal(false);
                setShowSetScheduleModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.editScheduleButton}>
                <Text style={styles.editScheduleIcon}>⚙️</Text>
                <Text style={styles.editScheduleText}>Edit Weekly Schedule</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionsCloseButton}
              onPress={() => setShowScheduleOptionsModal(false)}
            >
              <Text style={styles.optionsCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Program Schedule Modal */}
      <Modal
        visible={showProgramScheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProgramScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModalContent}>
            <Text style={styles.scheduleModalTitle}>Schedule to Calendar</Text>
            <Text style={styles.scheduleModalSubtitle}>
              Schedule your program workouts based on your weekly schedule
            </Text>

            <View style={styles.weeksSelector}>
              <Text style={styles.weeksSelectorLabel}>Weeks to schedule:</Text>
              <View style={styles.weekButtons}>
                {[2, 4, 6, 8].map((weeks) => (
                  <TouchableOpacity
                    key={weeks}
                    style={[
                      styles.weekButton,
                      weeksToSchedule === weeks && styles.weekButtonActive
                    ]}
                    onPress={() => setWeeksToSchedule(weeks)}
                  >
                    <Text style={[
                      styles.weekButtonText,
                      weeksToSchedule === weeks && styles.weekButtonTextActive
                    ]}>
                      {weeks}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {program.weeklySchedule && program.weeklySchedule.length > 0 && (
              <View style={styles.schedulePreview}>
                <Text style={styles.schedulePreviewTitle}>Your Weekly Schedule:</Text>
                {program.weeklySchedule.map((scheduleDay, index) => (
                  <View key={index} style={styles.schedulePreviewRow}>
                    <Text style={styles.schedulePreviewDay}>{scheduleDay.day}</Text>
                    <Text style={styles.schedulePreviewWorkout}>
                      {scheduleDay.type === 'rest'
                        ? '😴 Rest Day'
                        : `🏋️ ${program.days[scheduleDay.workoutIndex]?.name || 'Workout'}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.scheduleModalActions}>
              <TouchableOpacity
                style={styles.scheduleModalCancelButton}
                onPress={() => setShowProgramScheduleModal(false)}
              >
                <Text style={styles.scheduleModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scheduleModalConfirmButton}
                onPress={confirmProgramSchedule}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.scheduleModalConfirmGradient}
                >
                  <Text style={styles.scheduleModalConfirmText}>Schedule</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Weekly Schedule Modal */}
      <Modal
        visible={showSetScheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSetScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModalContent}>
            <Text style={styles.scheduleModalTitle}>Set Weekly Schedule</Text>
            <Text style={styles.scheduleModalSubtitle}>
              Assign your workout days and rest days for the week
            </Text>

            <ScrollView style={styles.scheduleScrollView} showsVerticalScrollIndicator={false}>
              {weeklySchedule.map((scheduleDay, index) => (
                <View key={index} style={styles.weekScheduleRow}>
                  <Text style={styles.weekScheduleDayName}>{scheduleDay.day}</Text>

                  <View style={styles.weekScheduleOptions}>
                    <TouchableOpacity
                      style={[
                        styles.weekScheduleOptionButton,
                        scheduleDay.type === 'rest' && styles.weekScheduleOptionActive
                      ]}
                      onPress={() => {
                        const updated = [...weeklySchedule];
                        updated[index] = { ...updated[index], type: 'rest', workoutIndex: null };
                        setWeeklySchedule(updated);
                      }}
                    >
                      <Text style={[
                        styles.weekScheduleOptionText,
                        scheduleDay.type === 'rest' && styles.weekScheduleOptionTextActive
                      ]}>Rest</Text>
                    </TouchableOpacity>

                    {program.days.map((workout, workoutIdx) => (
                      <TouchableOpacity
                        key={workoutIdx}
                        style={[
                          styles.weekScheduleOptionButton,
                          scheduleDay.type === 'workout' && scheduleDay.workoutIndex === workoutIdx && styles.weekScheduleOptionActive
                        ]}
                        onPress={() => {
                          const updated = [...weeklySchedule];
                          updated[index] = { ...updated[index], type: 'workout', workoutIndex: workoutIdx };
                          setWeeklySchedule(updated);
                        }}
                      >
                        <Text style={[
                          styles.weekScheduleOptionText,
                          scheduleDay.type === 'workout' && scheduleDay.workoutIndex === workoutIdx && styles.weekScheduleOptionTextActive
                        ]} numberOfLines={1}>
                          {workout.name.length > 8 ? workout.name.substring(0, 8) + '...' : workout.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.scheduleModalActions}>
              <TouchableOpacity
                style={styles.scheduleModalCancelButton}
                onPress={() => {
                  // Reset to original schedule
                  setWeeklySchedule(
                    program.weeklySchedule || [
                      { day: 'Monday', type: 'rest', workoutIndex: null },
                      { day: 'Tuesday', type: 'rest', workoutIndex: null },
                      { day: 'Wednesday', type: 'rest', workoutIndex: null },
                      { day: 'Thursday', type: 'rest', workoutIndex: null },
                      { day: 'Friday', type: 'rest', workoutIndex: null },
                      { day: 'Saturday', type: 'rest', workoutIndex: null },
                      { day: 'Sunday', type: 'rest', workoutIndex: null },
                    ]
                  );
                  setShowSetScheduleModal(false);
                }}
              >
                <Text style={styles.scheduleModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scheduleModalConfirmButton}
                onPress={handleSaveWeeklySchedule}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.scheduleModalConfirmGradient}
                >
                  <Text style={styles.scheduleModalConfirmText}>Save Schedule</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Single Workout Scheduling Modal */}
      <Modal
        visible={showSingleWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSingleWorkoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scheduleModalContent}>
            <Text style={styles.scheduleModalTitle}>
              Schedule: {selectedWorkoutForScheduling?.workout?.name}
            </Text>
            <Text style={styles.scheduleModalSubtitle}>
              This will navigate you to the calendar to select dates
            </Text>

            <View style={styles.singleWorkoutInfo}>
              <Text style={styles.singleWorkoutExercises}>
                📋 {selectedWorkoutForScheduling?.workout?.exercises?.length || 0} exercises
              </Text>
            </View>

            <View style={styles.scheduleModalActions}>
              <TouchableOpacity
                style={styles.scheduleModalCancelButton}
                onPress={() => {
                  setShowSingleWorkoutModal(false);
                  setSelectedWorkoutForScheduling(null);
                }}
              >
                <Text style={styles.scheduleModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scheduleModalConfirmButton}
                onPress={() => {
                  const workoutData = {
                    type: 'program',
                    programId: program.id,
                    programName: program.name,
                    dayId: selectedWorkoutForScheduling?.workout?.id,
                    dayName: selectedWorkoutForScheduling?.workout?.name,
                    exercises: selectedWorkoutForScheduling?.workout?.exercises || [],
                  };

                  // Navigate to calendar selection screen (WorkoutHistory with calendar view)
                  setShowSingleWorkoutModal(false);
                  navigation.navigate('WorkoutHistory', {
                    schedulingMode: true,
                    workoutToSchedule: workoutData,
                  });
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.scheduleModalConfirmGradient}
                >
                  <Text style={styles.scheduleModalConfirmText}>Choose Dates</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  descriptionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  daysContainer: {
    gap: Spacing.md,
  },
  dayCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayNumber: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  viewDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#3498DB' + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#DC2626' + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActionIcon: {
    fontSize: 14,
  },
  startIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIconText: {
    color: Colors.background,
    fontSize: 16,
  },
  dayStats: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  exercisePreview: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  exercisePreviewTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exercisePreviewItem: {
    marginBottom: 4,
  },
  exercisePreviewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  setsPreviewText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  moreExercisesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  actionButtonWrapper: {
    alignItems: 'center',
  },
  circularButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scheduleButton: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '40',
  },
  editButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  deleteActionButton: {
    backgroundColor: Colors.error + '15',
    borderColor: Colors.error + '40',
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailsModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  detailsScrollView: {
    padding: Spacing.lg,
  },
  detailExerciseCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailExerciseName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailExerciseMuscle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  detailSetsContainer: {
    marginTop: Spacing.sm,
  },
  detailSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailSetType: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  detailSetNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: 'bold',
    color: Colors.background,
  },
  detailSetInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  noSetsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  closeDetailsButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeDetailsButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  scheduleModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  scheduleModalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  scheduleModalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  weeksSelector: {
    marginBottom: Spacing.lg,
  },
  weeksSelectorLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  weekButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  weekButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  weekButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  weekButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weekButtonTextActive: {
    color: Colors.background,
  },
  schedulePreview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  schedulePreviewTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  schedulePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  schedulePreviewDay: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  schedulePreviewWorkout: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  scheduleModalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  scheduleModalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  scheduleModalCancelText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  scheduleModalConfirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  scheduleModalConfirmGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  scheduleModalConfirmText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scheduleScrollView: {
    maxHeight: 400,
    marginBottom: Spacing.md,
  },
  weekScheduleRow: {
    marginBottom: Spacing.lg,
  },
  weekScheduleDayName: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  weekScheduleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  weekScheduleOptionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 55,
    alignItems: 'center',
  },
  weekScheduleOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  weekScheduleOptionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  weekScheduleOptionTextActive: {
    color: Colors.background,
  },
  optionsModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  optionsModalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  optionsModalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  scheduleOptionsSection: {
    marginBottom: Spacing.lg,
  },
  optionsSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  optionsSectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  workoutOptionsList: {
    maxHeight: 200,
  },
  workoutOptionCard: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  workoutOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#10B981' + '40',
    borderRadius: BorderRadius.md,
  },
  workoutOptionName: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  workoutOptionMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  workoutOptionArrow: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  fullProgramOption: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  fullProgramGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  fullProgramIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  fullProgramTextContainer: {
    flex: 1,
  },
  fullProgramTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fullProgramSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  fullProgramArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  optionsCloseButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsCloseText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  singleWorkoutInfo: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  singleWorkoutExercises: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  editScheduleOption: {
    marginBottom: Spacing.lg,
  },
  editScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editScheduleIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  editScheduleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});