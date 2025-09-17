import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const ActiveWorkoutIndicator = React.memo(({ navigation }) => {
  const { activeWorkout, finishWorkout, discardWorkout, getElapsedTime } = useWorkout();
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [currentTime, setCurrentTime] = useState(getElapsedTime());

  // Define all hooks before any conditional returns
  const handleReturnToWorkout = useCallback(() => {
    if (!activeWorkout) return;
    navigation.navigate('Workout', {
      existingWorkoutExercises: activeWorkout.exercises || [],
      workoutStartTime: activeWorkout.startTime,
      selectedMuscleGroups: activeWorkout.selectedMuscleGroups || [],
      existingExerciseSets: activeWorkout.exerciseSets || {},
      resumingWorkout: true
    });
  }, [navigation, activeWorkout]);

  const handleFinishWorkout = useCallback(() => {
    setShowFinishConfirmation(true);
  }, []);

  const confirmFinishWorkout = useCallback(() => {
    finishWorkout();
    setShowFinishConfirmation(false);
  }, [finishWorkout]);

  const confirmDiscardWorkout = useCallback(() => {
    discardWorkout();
    setShowFinishConfirmation(false);
    // Navigate to main tab screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [discardWorkout, navigation]);

  useEffect(() => {
    if (activeWorkout) {
      const timer = setInterval(() => {
        setCurrentTime(getElapsedTime());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeWorkout, getElapsedTime]);

  if (!activeWorkout) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primary]}
          style={styles.gradient}
        >
          <TouchableOpacity
            style={styles.workoutInfo}
            onPress={handleReturnToWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.leftSection}>
              <Text style={styles.title}>Active Workout</Text>
              <Text style={styles.subtitle}>
                {activeWorkout.exercises?.length || 0} exercise{(activeWorkout.exercises?.length || 0) !== 1 ? 's' : ''} • {currentTime}
              </Text>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.pulseContainer}>
                <View style={styles.pulseIndicator} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleFinishWorkout}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Finish Workout Confirmation Modal */}
      <Modal
        visible={showFinishConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinishConfirmation(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Finish Workout?</Text>
            <Text style={modalStyles.confirmationText}>
              Are you sure you want to finish your workout? This will end your current session and show your workout summary.
            </Text>
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={modalStyles.modalButton}
                onPress={() => setShowFinishConfirmation(false)}
              >
                <Text style={modalStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.modalButtonPrimary]}
                onPress={confirmFinishWorkout}
              >
                <Text style={[modalStyles.modalButtonText, modalStyles.modalButtonTextPrimary]}>Finish Workout</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[modalStyles.modalButtonFullWidth, modalStyles.modalButtonDanger]}
              onPress={confirmDiscardWorkout}
            >
              <Text style={[modalStyles.modalButtonText, modalStyles.modalButtonTextDanger]}>Discard Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

export default ActiveWorkoutIndicator;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg, // Increased from md to lg
    borderTopWidth: 2, // Increased border width
    borderTopColor: Colors.primary,
    minHeight: 80, // Added minimum height
  },
  workoutInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.lg, // Increased font size
    fontWeight: 'bold',
    color: Colors.background, // Changed to background (white) for better contrast
    marginBottom: 4, // Increased margin
  },
  subtitle: {
    fontSize: Typography.fontSize.md, // Increased font size
    color: Colors.background + 'E0', // Semi-transparent white for better contrast
  },
  pulseContainer: {
    width: 16, // Increased size
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseIndicator: {
    width: 12, // Increased size
    height: 12,
    backgroundColor: Colors.background, // Changed to white for better visibility
    borderRadius: 6,
    shadowColor: Colors.background,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    marginLeft: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
});

// Modal styles matching the app theme
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  confirmationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modalButtonsVertical: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalButton: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modalButtonDanger: {
    backgroundColor: '#C44444',
    borderColor: '#C44444',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalButtonTextPrimary: {
    color: Colors.background,
  },
  modalButtonTextDanger: {
    color: Colors.background,
  },
  modalButtonSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalButtonFullWidth: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    marginTop: Spacing.sm,
  },
});