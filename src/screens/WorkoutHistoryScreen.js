import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, Image, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import CalendarView from '../components/CalendarView';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

// Helper function to detect if exercise is cardio
const isCardioExercise = (exercise) => {
  if (!exercise || !exercise.id) return false;
  const cardioKeywords = ['running', 'jogging', 'treadmill', 'walking', 'cardio', 'cycling', 'biking'];
  const id = (exercise.id || '').toLowerCase();
  const name = (exercise.name || '').toLowerCase();
  return cardioKeywords.some(keyword => id.includes(keyword) || name.includes(keyword));
};

// Helper function to format duration (seconds to MM:SS)
const formatCardioTime = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function WorkoutHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'history'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceWorkout, setCopySourceWorkout] = useState(null);
  const [selectedFutureDates, setSelectedFutureDates] = useState([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDatesToDelete, setSelectedDatesToDelete] = useState([]);
  const [filterDateRange, setFilterDateRange] = useState('all'); // 'week', 'month', '3months', 'all'
  const [filterWorkoutType, setFilterWorkoutType] = useState('all'); // 'all', 'program', 'standalone', 'quick'

  // Load workout history on focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutHistory();
      loadPlannedWorkouts();
    }, [])
  );

  // Listen for return from image viewer
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];

      if (currentRoute.params?.reopenWorkout) {
        // Restore the active tab if provided
        if (currentRoute.params.activeTab) {
          setActiveTab(currentRoute.params.activeTab);
        }
        // Reopen the workout modal
        setSelectedWorkout(currentRoute.params.reopenWorkout);
        setShowWorkoutModal(true);
        // Clear the params
        navigation.setParams({ reopenWorkout: null, activeTab: null });
      }
    });

    return unsubscribe;
  }, [navigation]);


  const loadWorkoutHistory = async () => {
    try {
      const userId = user?.email || 'guest';
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      setWorkoutHistory(history);
      updateMarkedDates(history, plannedWorkouts);
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  const loadPlannedWorkouts = async () => {
    try {
      const userId = user?.email || 'guest';
      const plannedData = await WorkoutStorageService.getPlannedWorkouts(userId);
      setPlannedWorkouts(plannedData);

      // Load history to ensure we have both
      const history = await WorkoutStorageService.getWorkoutHistory(userId);
      updateMarkedDates(history, plannedData);
    } catch (error) {
      console.error('Error loading planned workouts:', error);
    }
  };

  const updateMarkedDates = (history, planned) => {
    const marked = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];

    // Convert completed workouts to CalendarView format
    history.forEach(workout => {
      const dateKey = new Date(workout.date).toISOString().split('T')[0];
      marked[dateKey] = {
        logged: { workout: [workout] } // CalendarView expects logged property
      };
    });

    // Convert planned workouts to CalendarView format - only if not already completed
    Object.keys(planned).forEach(dateKey => {
      // Parse date correctly to avoid timezone issues
      const [year, month, day] = dateKey.split('-').map(Number);
      const plannedDate = new Date(year, month - 1, day);
      plannedDate.setHours(0, 0, 0, 0);

      // Only mark as planned (orange) if:
      // 1. It's a future date OR today
      // 2. There's no completed workout for this date
      if (plannedDate >= today && !marked[dateKey]) {
        marked[dateKey] = {
          planned: { workout: [planned[dateKey]] } // CalendarView expects planned property
        };
      }
    });

    setMarkedDates(marked);
  };

  const handleDatePress = (date) => {
    const dateKey = date.toISOString().split('T')[0];

    // If in delete mode, toggle selection
    if (deleteMode) {
      const plannedWorkout = plannedWorkouts[dateKey];
      if (plannedWorkout) {
        toggleDeleteSelection(dateKey);
      }
      return;
    }

    // Normal date press behavior
    // Date comes as a Date object from CalendarView
    setSelectedDate(date);

    // Get date strings in local timezone to avoid timezone offset issues
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const workout = workoutHistory.find(w =>
      new Date(w.date).toISOString().split('T')[0] === dateKey
    );

    // Check for planned workout
    const plannedWorkout = plannedWorkouts[dateKey];

    if (workout) {
      // Past/completed workout - show details modal
      setSelectedWorkout(workout);
      setShowWorkoutModal(true);
    } else if (plannedWorkout) {
      // Planned workout exists - navigate to planned workout detail screen
      navigation.navigate('PlannedWorkoutDetail', {
        plannedWorkout,
        selectedDate: dateKey
      });
    } else if (clickedDate.getTime() === todayDate.getTime()) {
      // Today - navigate to workout options screen
      navigation.navigate('TodayWorkoutOptions');
    } else if (clickedDate > todayDate) {
      // Future date - navigate to plan workout screen
      navigation.navigate('PlanWorkout', { selectedDate: dateKey });
    } else {
      // Past date with no workout - show modal with empty state
      setSelectedWorkout(null);
      setShowWorkoutModal(true);
    }
  };

  const toggleDeleteSelection = (dateKey) => {
    if (selectedDatesToDelete.includes(dateKey)) {
      setSelectedDatesToDelete(selectedDatesToDelete.filter(d => d !== dateKey));
    } else {
      setSelectedDatesToDelete([...selectedDatesToDelete, dateKey]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDatesToDelete.length === 0) {
      Alert.alert('Error', 'Please select at least one planned workout to delete');
      return;
    }

    const count = selectedDatesToDelete.length;

    Alert.alert(
      `Delete ${count} Planned Workout${count > 1 ? 's' : ''}?`,
      'This will permanently delete the selected planned workouts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.email || 'guest';

              // Delete each selected planned workout
              for (const dateKey of selectedDatesToDelete) {
                await WorkoutStorageService.deletePlannedWorkout(dateKey, userId);
              }

              // Reload data
              await loadPlannedWorkouts();

              // Reset delete mode
              setDeleteMode(false);
              setSelectedDatesToDelete([]);

              Alert.alert('Success', `Successfully deleted ${count} planned workout${count > 1 ? 's' : ''}!`);
            } catch (error) {
              console.error('Error deleting planned workouts:', error);
              Alert.alert('Error', 'Failed to delete some planned workouts');
            }
          }
        }
      ]
    );
  };

  const calculateWorkoutStats = (workout) => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    workout.exercises.forEach(exercise => {
      const sets = exercise.sets || [];
      totalSets += sets.length;

      sets.forEach(set => {
        if (set.completed) {
          completedSets += 1;
          if (set.weight && set.reps) {
            totalVolume += parseFloat(set.weight) * parseInt(set.reps);
          }
        }
      });
    });

    return { totalSets, completedSets, totalVolume };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (duration) => {
    return duration || '00:00';
  };

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const toggleDateSelection = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const isSelected = selectedFutureDates.some(d => d.toISOString().split('T')[0] === dateKey);

    if (isSelected) {
      setSelectedFutureDates(selectedFutureDates.filter(d => d.toISOString().split('T')[0] !== dateKey));
    } else {
      setSelectedFutureDates([...selectedFutureDates, date]);
    }
  };

  const copyWorkoutToMultipleDates = async () => {
    try {
      const userId = user?.email || 'guest';
      const targetDateKeys = selectedFutureDates.map(date => date.toISOString().split('T')[0]);

      // Create workout data to copy (without the original id and date)
      const workoutToCopy = {
        exercises: copySourceWorkout.exercises,
        duration: copySourceWorkout.duration,
        startTime: copySourceWorkout.startTime,
        endTime: copySourceWorkout.endTime
      };

      await WorkoutStorageService.copyWorkoutToMultipleDates(workoutToCopy, targetDateKeys, userId);

      // Reload both history and planned workouts
      await loadWorkoutHistory();
      await loadPlannedWorkouts();

      // Close modal and reset
      setShowCopyModal(false);
      setCopySourceWorkout(null);
      setSelectedFutureDates([]);

      alert(`Workout copied to ${targetDateKeys.length} day${targetDateKeys.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error copying workout:', error);
      alert('Failed to copy workout');
    }
  };

  const addTestWorkoutData = async () => {
    try {
      const userId = user?.email || 'guest';

      // Create comprehensive mock workouts with equipment variants for all muscle groups
      const workoutsToAdd = [
        // CHEST WORKOUTS
        {
          date: new Date('2025-10-01T10:00:00'),
          exercises: [
            {
              name: 'Bench Press (Barbell)',
              displayName: 'Bench Press',
              equipment: 'Barbell',
              primaryMuscle: 'Chest',
              sets: [
                { weight: '135', reps: '10', completed: true },
                { weight: '185', reps: '8', completed: true },
                { weight: '205', reps: '6', completed: true },
              ]
            },
            {
              name: 'Incline Press (Dumbbell)',
              displayName: 'Incline Press',
              equipment: 'Dumbbell',
              primaryMuscle: 'Chest',
              sets: [
                { weight: '60', reps: '12', completed: true },
                { weight: '70', reps: '10', completed: true },
                { weight: '75', reps: '8', completed: true },
              ]
            },
            {
              name: 'Chest Fly (Cable)',
              displayName: 'Chest Fly',
              equipment: 'Cable',
              primaryMuscle: 'Chest',
              sets: [
                { weight: '40', reps: '15', completed: true },
                { weight: '45', reps: '12', completed: true },
              ]
            }
          ],
          duration: '00:55:30',
          startTime: '10:00 AM',
          endTime: '10:55 AM',
          workoutTitle: 'Chest Day'
        },
        // BACK WORKOUT
        {
          date: new Date('2025-10-02T14:00:00'),
          exercises: [
            {
              name: 'Deadlift (Barbell)',
              displayName: 'Deadlift',
              equipment: 'Barbell',
              primaryMuscle: 'Back',
              sets: [
                { weight: '225', reps: '8', completed: true },
                { weight: '275', reps: '6', completed: true },
                { weight: '315', reps: '4', completed: true },
              ]
            },
            {
              name: 'Bent Over Row (Barbell)',
              displayName: 'Bent Over Row',
              equipment: 'Barbell',
              primaryMuscle: 'Back',
              sets: [
                { weight: '135', reps: '10', completed: true },
                { weight: '155', reps: '8', completed: true },
                { weight: '175', reps: '6', completed: true },
              ]
            },
            {
              name: 'Lat Pulldown (Cable)',
              displayName: 'Lat Pulldown',
              equipment: 'Cable',
              primaryMuscle: 'Back',
              sets: [
                { weight: '120', reps: '12', completed: true },
                { weight: '140', reps: '10', completed: true },
                { weight: '160', reps: '8', completed: true },
              ]
            }
          ],
          duration: '01:05:15',
          startTime: '14:00 PM',
          endTime: '15:05 PM',
          workoutTitle: 'Back Day'
        },
        // LEGS WORKOUT
        {
          date: new Date('2025-10-03T09:00:00'),
          exercises: [
            {
              name: 'Squat (Barbell)',
              displayName: 'Squat',
              equipment: 'Barbell',
              primaryMuscle: 'Quadriceps',
              sets: [
                { weight: '185', reps: '10', completed: true },
                { weight: '225', reps: '8', completed: true },
                { weight: '275', reps: '6', completed: true },
              ]
            },
            {
              name: 'Leg Press (Machine)',
              displayName: 'Leg Press',
              equipment: 'Machine',
              primaryMuscle: 'Quadriceps',
              sets: [
                { weight: '300', reps: '12', completed: true },
                { weight: '350', reps: '10', completed: true },
                { weight: '400', reps: '8', completed: true },
              ]
            },
            {
              name: 'Romanian Deadlift (Dumbbell)',
              displayName: 'Romanian Deadlift',
              equipment: 'Dumbbell',
              primaryMuscle: 'Hamstrings',
              sets: [
                { weight: '70', reps: '12', completed: true },
                { weight: '80', reps: '10', completed: true },
              ]
            }
          ],
          duration: '01:10:00',
          startTime: '09:00 AM',
          endTime: '10:10 AM',
          workoutTitle: 'Leg Day'
        },
        // SHOULDERS WORKOUT
        {
          date: new Date('2025-10-04T16:00:00'),
          exercises: [
            {
              name: 'Overhead Press (Barbell)',
              displayName: 'Overhead Press',
              equipment: 'Barbell',
              primaryMuscle: 'Shoulders',
              sets: [
                { weight: '95', reps: '10', completed: true },
                { weight: '115', reps: '8', completed: true },
                { weight: '135', reps: '6', completed: true },
              ]
            },
            {
              name: 'Lateral Raise (Dumbbell)',
              displayName: 'Lateral Raise',
              equipment: 'Dumbbell',
              primaryMuscle: 'Shoulders',
              sets: [
                { weight: '20', reps: '15', completed: true },
                { weight: '25', reps: '12', completed: true },
                { weight: '30', reps: '10', completed: true },
              ]
            },
            {
              name: 'Face Pull (Cable)',
              displayName: 'Face Pull',
              equipment: 'Cable',
              primaryMuscle: 'Shoulders',
              sets: [
                { weight: '60', reps: '15', completed: true },
                { weight: '70', reps: '12', completed: true },
              ]
            }
          ],
          duration: '00:50:00',
          startTime: '16:00 PM',
          endTime: '16:50 PM',
          workoutTitle: 'Shoulder Day'
        },
        // ARMS WORKOUT
        {
          date: new Date('2025-10-05T11:00:00'),
          exercises: [
            {
              name: 'Barbell Curl (Barbell)',
              displayName: 'Barbell Curl',
              equipment: 'Barbell',
              primaryMuscle: 'Biceps',
              sets: [
                { weight: '70', reps: '12', completed: true },
                { weight: '80', reps: '10', completed: true },
                { weight: '90', reps: '8', completed: true },
              ]
            },
            {
              name: 'Hammer Curl (Dumbbell)',
              displayName: 'Hammer Curl',
              equipment: 'Dumbbell',
              primaryMuscle: 'Biceps',
              sets: [
                { weight: '35', reps: '12', completed: true },
                { weight: '40', reps: '10', completed: true },
              ]
            },
            {
              name: 'Tricep Pushdown (Cable)',
              displayName: 'Tricep Pushdown',
              equipment: 'Cable',
              primaryMuscle: 'Triceps',
              sets: [
                { weight: '60', reps: '15', completed: true },
                { weight: '70', reps: '12', completed: true },
                { weight: '80', reps: '10', completed: true },
              ]
            },
            {
              name: 'Overhead Extension (Dumbbell)',
              displayName: 'Overhead Extension',
              equipment: 'Dumbbell',
              primaryMuscle: 'Triceps',
              sets: [
                { weight: '50', reps: '12', completed: true },
                { weight: '60', reps: '10', completed: true },
              ]
            }
          ],
          duration: '00:55:00',
          startTime: '11:00 AM',
          endTime: '11:55 AM',
          workoutTitle: 'Arm Day'
        },
        // SECOND CHEST WORKOUT (PROGRESS)
        {
          date: new Date('2025-10-06T10:00:00'),
          exercises: [
            {
              name: 'Bench Press (Barbell)',
              displayName: 'Bench Press',
              equipment: 'Barbell',
              primaryMuscle: 'Chest',
              sets: [
                { weight: '145', reps: '10', completed: true },
                { weight: '195', reps: '8', completed: true },
                { weight: '215', reps: '5', completed: true },
              ]
            },
            {
              name: 'Bench Press (Dumbbell)',
              displayName: 'Bench Press',
              equipment: 'Dumbbell',
              primaryMuscle: 'Chest',
              sets: [
                { weight: '80', reps: '12', completed: true },
                { weight: '90', reps: '10', completed: true },
                { weight: '100', reps: '8', completed: true },
              ]
            }
          ],
          duration: '00:45:00',
          startTime: '10:00 AM',
          endTime: '10:45 AM',
          workoutTitle: 'Chest Power'
        },
        // SECOND BACK WORKOUT
        {
          date: new Date('2025-10-07T14:00:00'),
          exercises: [
            {
              name: 'Deadlift (Barbell)',
              displayName: 'Deadlift',
              equipment: 'Barbell',
              primaryMuscle: 'Back',
              sets: [
                { weight: '235', reps: '8', completed: true },
                { weight: '285', reps: '6', completed: true },
                { weight: '325', reps: '3', completed: true },
              ]
            },
            {
              name: 'Bent Over Row (Dumbbell)',
              displayName: 'Bent Over Row',
              equipment: 'Dumbbell',
              primaryMuscle: 'Back',
              sets: [
                { weight: '70', reps: '12', completed: true },
                { weight: '80', reps: '10', completed: true },
              ]
            }
          ],
          duration: '00:50:00',
          startTime: '14:00 PM',
          endTime: '14:50 PM',
          workoutTitle: 'Back Strength'
        },
        // SECOND LEGS WORKOUT
        {
          date: new Date('2025-10-08T09:00:00'),
          exercises: [
            {
              name: 'Squat (Barbell)',
              displayName: 'Squat',
              equipment: 'Barbell',
              primaryMuscle: 'Quadriceps',
              sets: [
                { weight: '195', reps: '10', completed: true },
                { weight: '245', reps: '8', completed: true },
                { weight: '285', reps: '5', completed: true },
              ]
            },
            {
              name: 'Lunge (Dumbbell)',
              displayName: 'Lunge',
              equipment: 'Dumbbell',
              primaryMuscle: 'Quadriceps',
              sets: [
                { weight: '40', reps: '12', completed: true },
                { weight: '50', reps: '10', completed: true },
              ]
            }
          ],
          duration: '00:55:00',
          startTime: '09:00 AM',
          endTime: '09:55 AM',
          workoutTitle: 'Leg Hypertrophy'
        }
      ];

      const history = await WorkoutStorageService.getWorkoutHistory(userId);

      for (const mockWorkout of workoutsToAdd) {
        const exerciseSets = mockWorkout.exercises.map(ex => ex.sets);

        const workout = {
          id: Date.now().toString() + Math.random(),
          userId,
          date: mockWorkout.date.toISOString(),
          startTime: mockWorkout.startTime,
          endTime: mockWorkout.endTime,
          duration: mockWorkout.duration,
          workoutTitle: mockWorkout.workoutTitle,
          workoutType: 'quick',
          exercises: mockWorkout.exercises.map((exercise, index) => ({
            ...exercise,
            sets: exerciseSets[index] || [],
            completedSets: exerciseSets[index]?.filter(set => set.completed).length || 0,
            totalSets: exerciseSets[index]?.length || 0
          }))
        };

        history.push(workout);

        // Update exercise progress for each exercise
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i];
          if (exercise.sets && exercise.sets.length > 0) {
            await WorkoutStorageService.updateExerciseProgress(exercise, userId, workout.id);
          }
        }
      }

      await AsyncStorage.setItem(`workout_history_${userId}`, JSON.stringify(history));

      // Reload data
      await loadWorkoutHistory();

      Alert.alert(
        'Success! 🎉',
        `${workoutsToAdd.length} complete workouts added!\n\n` +
        '✅ Chest: Bench Press, Incline Press, Chest Fly\n' +
        '✅ Back: Deadlift, Bent Over Row, Lat Pulldown\n' +
        '✅ Legs: Squat, Leg Press, Romanian Deadlift\n' +
        '✅ Shoulders: Overhead Press, Lateral Raise\n' +
        '✅ Arms: Curls, Tricep Pushdown\n\n' +
        'All with multiple equipment variants!\n' +
        'Check Exercise Library → Info to see progress!'
      );
    } catch (error) {
      console.error('Error adding test workout:', error);
      Alert.alert('Error', 'Failed to add test workouts');
    }
  };

  // Filter workouts based on date range and type
  const getFilteredWorkouts = () => {
    let filtered = [...workoutHistory];

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (filterDateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '3months':
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter(w => new Date(w.date) >= cutoffDate);
    }

    // Filter by workout type
    if (filterWorkoutType !== 'all') {
      filtered = filtered.filter(w => w.workoutType === filterWorkoutType);
    }

    return filtered;
  };

  const handleDeleteWorkout = (workoutId) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = user?.email || 'guest';
              const result = await WorkoutStorageService.deleteWorkout(workoutId, userId);

              if (result.success) {
                // Reload workout history to reflect the deletion
                await loadWorkoutHistory();
                setShowWorkoutModal(false);
                Alert.alert('Success', `Workout and ${result.recordsRemoved} related progress record${result.recordsRemoved !== 1 ? 's' : ''} deleted successfully`);
              } else {
                Alert.alert('Error', 'Failed to delete workout');
              }
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const handleRepeatWorkout = (workout) => {
    Alert.alert(
      'Repeat Workout',
      'Schedule this workout for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule',
          onPress: () => {
            // Navigate to plan workout screen with this workout
            navigation.navigate('PlanWorkout', {
              selectedDate: new Date().toISOString().split('T')[0],
              repeatWorkout: workout
            });
            setShowWorkoutModal(false);
          }
        }
      ]
    );
  };

  const handleImagePress = (imageBase64, workout) => {
    // Close the modal and navigate immediately
    setShowWorkoutModal(false);
    navigation.navigate('ImageViewer', {
      imageBase64,
      returnToWorkout: workout,
      activeTab: activeTab // Remember which tab we're on
    });
  };

  const renderWorkoutCard = ({ item: workout }) => {
    const stats = calculateWorkoutStats(workout);
    const firstPhoto = workout.photos && workout.photos.length > 0 ? workout.photos[0] : null;
    const workoutTypeIcon = workout.workoutType === 'program' ? '📋' : workout.workoutType === 'standalone' ? '💪' : '⚡';

    return (
      <TouchableOpacity
        key={workout.id}
        style={styles.workoutCard}
        onPress={() => {
          setSelectedWorkout(workout);
          setShowWorkoutModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.workoutCardContent}>
          {firstPhoto && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleImagePress(firstPhoto, workout);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: `data:image/jpeg;base64,${firstPhoto}` }}
                style={styles.workoutCardThumbnail}
              />
            </TouchableOpacity>
          )}
          <View style={styles.workoutCardInfo}>
            <Text style={styles.workoutCardTitle}>
              {workoutTypeIcon} {workout.workoutTitle || 'Quick Workout'}
            </Text>
            <Text style={styles.workoutCardDate}>{formatDate(workout.date)}</Text>
            <View style={styles.workoutCardStats}>
              <Text style={styles.workoutCardStat}>⏱️ {workout.duration}</Text>
              <Text style={styles.workoutCardStat}>💪 {workout.exercises.length} exercises</Text>
              <Text style={styles.workoutCardStat}>📊 {Math.round(stats.totalVolume)} lbs</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout
      title="Workout History"
      subtitle="Track your progress"
      navigation={navigation}
      showBack={true}
      showHome={true}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
              📅 Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              📜 History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <>
            {/* Delete Mode Banner */}
            {deleteMode && (
          <StyledCard variant="elevated" style={styles.deleteBanner}>
            <Text style={styles.deleteBannerText}>
              🗑️ Delete Mode: Tap planned workouts to select ({selectedDatesToDelete.length} selected)
            </Text>
          </StyledCard>
        )}

        {/* Calendar */}
        <StyledCard variant="elevated" style={styles.calendarCard}>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={handleDatePress}
            mealData={markedDates}
            highlightedDates={deleteMode ? selectedDatesToDelete : []}
          />
        </StyledCard>

        {/* Legend */}
        <StyledCard variant="elevated" style={styles.legendCard}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.legendText}>Planned</Text>
            </View>
          </View>
        </StyledCard>

        {/* Delete Planned Workouts Button */}
        <StyledCard variant="elevated" style={styles.actionCard}>
          {!deleteMode ? (
            <StyledButton
              title="🗑️ Delete Planned Workouts"
              variant="secondary"
              onPress={() => setDeleteMode(true)}
            />
          ) : (
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setDeleteMode(false);
                  setSelectedDatesToDelete([]);
                }}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmButton,
                  selectedDatesToDelete.length === 0 && styles.deleteConfirmButtonDisabled
                ]}
                onPress={handleBulkDelete}
                disabled={selectedDatesToDelete.length === 0}
              >
                <Text style={styles.deleteConfirmText}>
                  Delete {selectedDatesToDelete.length > 0 ? `(${selectedDatesToDelete.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </StyledCard>

        {/* Test Button */}
        <StyledCard variant="elevated" style={styles.testCard}>
          <StyledButton
            title="🧪 Add Test Workouts with Equipment Variants"
            variant="secondary"
            onPress={addTestWorkoutData}
          />
        </StyledCard>

        {/* Cleanup Orphaned Records Button */}
        <StyledCard variant="elevated" style={styles.testCard}>
          <StyledButton
            title="🧹 Clean Up Chart Data"
            variant="secondary"
            onPress={async () => {
              Alert.alert(
                'Clean Up Chart Data',
                'This will remove orphaned exercise progress records that don\'t match any existing workouts. This will fix chart data inconsistencies.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clean Up',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const userId = user?.email || 'guest';
                        const result = await WorkoutStorageService.cleanupOrphanedProgressRecords(userId);

                        if (result.success) {
                          Alert.alert('Success', `Cleaned up ${result.recordsRemoved} orphaned record${result.recordsRemoved !== 1 ? 's' : ''}!`);
                        } else {
                          Alert.alert('Error', 'Failed to clean up records');
                        }
                      } catch (error) {
                        console.error('Error cleaning up orphaned records:', error);
                        Alert.alert('Error', 'Failed to clean up records');
                      }
                    }
                  }
                ]
              );
            }}
          />
        </StyledCard>

        {/* Workout Stats Summary */}
        {workoutHistory.length > 0 && (
          <StyledCard variant="elevated" style={styles.statsCard}>
            <Text style={styles.statsTitle}>Overall Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutHistory.length}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {workoutHistory.reduce((sum, w) => {
                    const stats = calculateWorkoutStats(w);
                    return sum + stats.completedSets;
                  }, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Sets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(workoutHistory.reduce((sum, w) => {
                    const stats = calculateWorkoutStats(w);
                    return sum + stats.totalVolume;
                  }, 0) / 1000)}k
                </Text>
                <Text style={styles.statLabel}>Total Volume</Text>
              </View>
            </View>
          </StyledCard>
        )}
          </>
        )}

        {/* History List View */}
        {activeTab === 'history' && (
          <View style={styles.historyContainer}>
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {/* Date Range Filters */}
                {['all', 'week', 'month', '3months'].map(range => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.filterChip, filterDateRange === range && styles.filterChipActive]}
                    onPress={() => setFilterDateRange(range)}
                  >
                    <Text style={[styles.filterChipText, filterDateRange === range && styles.filterChipTextActive]}>
                      {range === 'all' ? 'All Time' : range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'Last 90 Days'}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Workout Type Filters */}
                {['all', 'program', 'standalone', 'quick'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterChip, filterWorkoutType === type && styles.filterChipActive]}
                    onPress={() => setFilterWorkoutType(type)}
                  >
                    <Text style={[styles.filterChipText, filterWorkoutType === type && styles.filterChipTextActive]}>
                      {type === 'all' ? '🏋️ All' : type === 'program' ? '📋 Programs' : type === 'standalone' ? '💪 Standalone' : '⚡ Quick'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Workout List */}
            {getFilteredWorkouts().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🏋️</Text>
                <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
                <Text style={styles.emptyStateText}>
                  Start your first workout to see it here!
                </Text>
              </View>
            ) : (
              <View style={styles.workoutList}>
                {getFilteredWorkouts().map((workout) => renderWorkoutCard({ item: workout }))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Workout Details Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowWorkoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowWorkoutModal(false);
              }}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Sticky Header */}
            {selectedWorkout && (
              <View style={styles.modalHeader}>
                {selectedWorkout.photos && selectedWorkout.photos.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(selectedWorkout.photos[0], selectedWorkout)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${selectedWorkout.photos[0]}` }}
                      style={styles.modalHeaderPhoto}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                    {selectedWorkout.workoutTitle || 'Workout Details'}
                  </Text>
                  <Text style={styles.modalHeaderDate}>{formatDate(selectedWorkout.date || selectedWorkout.dateKey)}</Text>
                </View>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.modalScrollContent}
            >
              {!selectedWorkout ? (
                <>
                  <Text style={styles.modalTitle}>No Workout Logged</Text>
                  <Text style={styles.modalDate}>{formatDate(selectedDate)}</Text>

                  <View style={styles.emptyWorkoutContainer}>
                    <Text style={styles.emptyWorkoutIcon}>📋</Text>
                    <Text style={styles.emptyWorkoutText}>No workout logged for this date</Text>
                    <Text style={styles.emptyWorkoutSubtext}>
                      You didn't record a workout on this day. Start logging your workouts to track your progress!
                    </Text>
                  </View>
                </>
              ) : (
                <>

                  {/* Notes */}
                  {selectedWorkout.notes && (
                    <View style={styles.modalNotes}>
                      <Text style={styles.modalNotesLabel}>📝 Notes</Text>
                      <Text style={styles.modalNotesText}>{selectedWorkout.notes}</Text>
                    </View>
                  )}

                  {/* Workout Stats */}
                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{formatDuration(selectedWorkout.duration)}</Text>
                      <Text style={styles.modalStatLabel}>Duration</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedWorkout.exercises.length}</Text>
                      <Text style={styles.modalStatLabel}>Exercises</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>
                        {calculateWorkoutStats(selectedWorkout).completedSets}
                      </Text>
                      <Text style={styles.modalStatLabel}>Sets</Text>
                    </View>
                  </View>

                  {/* Exercises List */}
                  <Text style={styles.exercisesTitle}>Exercises</Text>
                  {selectedWorkout.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.equipment} • {exercise.primaryMuscle}
                      </Text>

                      {/* Sets */}
                      {exercise.sets && exercise.sets.length > 0 && (
                        <View style={styles.setsContainer}>
                          {exercise.sets.map((set, setIndex) => {
                            if (!set.completed) return null;

                            const isCardio = isCardioExercise(exercise);

                            return (
                              <View key={setIndex} style={styles.setRow}>
                                <Text style={styles.setText}>
                                  {isCardio ? (
                                    // Cardio set: Show duration
                                    `Set ${setIndex + 1}: ${formatCardioTime(set.duration || 0)}`
                                  ) : (
                                    // Regular set: Show weight × reps with optional RPE
                                    `Set ${setIndex + 1}: ${set.weight}lbs × ${set.reps} reps${set.rpe ? ` @ RPE ${set.rpe}` : ''}`
                                  )}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Actions */}
                  <StyledButton
                    title="Copy to Future Date"
                    onPress={() => {
                      setCopySourceWorkout(selectedWorkout);
                      setShowWorkoutModal(false);
                      setTimeout(() => setShowCopyModal(true), 300);
                    }}
                    style={styles.repeatButton}
                  />

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      activeOpacity={0.8}
                      onPress={() => handleRepeatWorkout(selectedWorkout)}
                    >
                      <LinearGradient
                        colors={[Colors.primary, '#059669']}
                        style={styles.modalActionGradient}
                      >
                        <Text style={styles.modalActionIcon}>🔄</Text>
                        <Text style={styles.modalActionText}>Repeat</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalActionButton}
                      activeOpacity={0.8}
                      onPress={() => handleDeleteWorkout(selectedWorkout.id)}
                    >
                      <LinearGradient
                        colors={['#DC2626', '#991B1B']}
                        style={styles.modalActionGradient}
                      >
                        <Text style={styles.modalActionIcon}>🗑️</Text>
                        <Text style={styles.modalActionText}>Delete</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Copy Workout Modal */}
      <Modal
        visible={showCopyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCopyModal(false);
          setCopySourceWorkout(null);
          setSelectedFutureDates([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitle}>Copy to Future Dates</Text>

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.copyModalScrollContent}
            >
              <Text style={styles.copyInstructions}>
                Select future dates to copy this workout to:
              </Text>

              <View style={styles.calendarContainer}>
                <CalendarView
                  selectedDate={new Date()}
                  multiSelectMode={true}
                  selectedDates={selectedFutureDates}
                  onDateSelect={(date) => {
                    if (isFutureDate(date)) {
                      toggleDateSelection(date);
                    } else {
                      alert('Please select a future date');
                    }
                  }}
                  mealData={markedDates}
                />
              </View>

              {selectedFutureDates.length > 0 && (
                <View style={styles.confirmSection}>
                  <View style={styles.selectedDatesInfo}>
                    <Text style={styles.selectedDatesCount}>
                      {selectedFutureDates.length} date{selectedFutureDates.length > 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity
                      onPress={() => setSelectedFutureDates([])}
                      style={styles.clearSelectionButton}
                    >
                      <Text style={styles.clearSelectionText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                  <StyledButton
                    title={`Copy to ${selectedFutureDates.length} Day${selectedFutureDates.length > 1 ? 's' : ''}`}
                    onPress={copyWorkoutToMultipleDates}
                    style={styles.confirmButton}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCopyModal(false);
                  setCopySourceWorkout(null);
                  setSelectedFutureDates([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  historyContainer: {
    flex: 1,
  },
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  workoutList: {
    paddingBottom: Spacing.xl,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  workoutCardContent: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  workoutCardThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.border,
  },
  workoutCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  workoutCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutCardDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  workoutCardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  workoutCardStat: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalPhotos: {
    marginVertical: Spacing.md,
  },
  modalPhoto: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.border,
  },
  modalNotes: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  modalNotesLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  modalNotesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  modalActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  modalActionIcon: {
    fontSize: 20,
  },
  modalActionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calendarCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  legendCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  legendTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
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
    position: 'relative',
    maxHeight: '85%',
    width: '100%',
  },
  modalScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    paddingRight: 50, // Space for X button
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalHeaderPhoto: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: Colors.border,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  modalHeaderDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  modalCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  modalDate: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  exercisesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  setsContainer: {
    marginTop: Spacing.xs,
  },
  setRow: {
    marginBottom: Spacing.xs,
  },
  setText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },
  repeatButton: {
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
  copyModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    maxHeight: '85%',
    minHeight: '70%',
  },
  copyModalScrollContent: {
    paddingBottom: Spacing.xxl,
  },
  copyInstructions: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  calendarContainer: {
    marginVertical: Spacing.md,
  },
  confirmSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedDatesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedDatesCount: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  clearSelectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearSelectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmButton: {
    marginTop: Spacing.sm,
  },
  cancelButton: {
    backgroundColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  testCard: {
    marginBottom: Spacing.md,
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  deleteBanner: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#DC2626' + '20',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  deleteBannerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  deleteCancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteConfirmButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#DC2626',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  deleteConfirmButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  deleteConfirmText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyWorkoutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyWorkoutIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyWorkoutText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyWorkoutSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
