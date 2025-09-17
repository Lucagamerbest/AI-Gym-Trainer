import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import ScreenLayout from '../components/ScreenLayout';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomExerciseStorage } from '../services/customExerciseStorage';

const { width, height } = Dimensions.get('window');

export default function CreateExerciseScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isReady, setIsReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTap, setLastTap] = useState(null);
  const cameraRef = useRef(null);

  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '🎯', color: '#FF6B6B' },
    { id: 'back', name: 'Back', icon: '🔺', color: '#4ECDC4' },
    { id: 'legs', name: 'Legs', icon: '🦵', color: '#45B7D1' },
    { id: 'biceps', name: 'Biceps', icon: '💪', color: '#FFEAA7' },
    { id: 'triceps', name: 'Triceps', icon: '🔥', color: '#FF7675' },
    { id: 'shoulders', name: 'Shoulders', icon: '🤲', color: '#96CEB4' },
    { id: 'abs', name: 'Abs', icon: '🎯', color: '#DDA0DD' },
  ];

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCameraPress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected - flip camera
      toggleCameraFacing();
      setLastTap(null);
    } else {
      // Single tap - set the time
      setLastTap(now);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && isReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        setCapturedImage(photo.uri);
        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      Alert.alert('Missing Information', 'Please enter an exercise name.');
      return;
    }

    if (!selectedMuscleGroup) {
      Alert.alert('Missing Information', 'Please select a muscle group.');
      return;
    }

    if (!capturedImage) {
      Alert.alert('Missing Information', 'Please take a photo of the exercise/machine.');
      return;
    }

    try {
      // Save the custom exercise
      const result = await CustomExerciseStorage.saveCustomExercise({
        name: exerciseName.trim(),
        description: exerciseDescription.trim() || 'Custom exercise created by user',
        muscleGroup: selectedMuscleGroup,
        image: capturedImage
      });

      if (result.success) {
        // Navigate immediately without modal
        navigation.navigate('ExerciseList', {
          selectedMuscleGroups: ['chest', 'back', 'legs', 'biceps', 'triceps', 'shoulders', 'abs'],
          fromLibrary: true,
          refresh: Date.now()
        });
      } else {
        Alert.alert('Error', 'Failed to save exercise. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Handle permission states
  if (!permission) {
    return (
      <ScreenLayout title="Create Exercise" navigation={navigation} showBack={true}>
        <View style={styles.centerContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenLayout title="Create Exercise" navigation={navigation} showBack={true}>
        <View style={styles.centerContainer}>
          <Text style={styles.permissionText}>We need your permission to use the camera</Text>
          <StyledButton
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </ScreenLayout>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={() => setIsReady(true)}
        >
          <TouchableOpacity
            style={styles.cameraTouch}
            onPress={handleCameraPress}
            activeOpacity={1}
          >
            <View style={styles.cameraOverlay}>
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.cameraHeaderButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraHeaderButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>Take Exercise Photo</Text>
              <TouchableOpacity
                style={styles.cameraHeaderButton}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.cameraHeaderButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.cameraBottom}>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  disabled={!isReady}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </TouchableOpacity>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenLayout
      title="Create Exercise"
      subtitle="Add a custom exercise with photo"
      navigation={navigation}
      showBack={true}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Photo</Text>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => setShowCamera(true)}
            activeOpacity={0.8}
          >
            {capturedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
                <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                  <Text style={styles.retakeButtonText}>📷 Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <LinearGradient
                colors={[Colors.primary + '15', Colors.primary + '08']}
                style={styles.photoPlaceholder}
              >
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>Tap to take a photo</Text>
                <Text style={styles.photoSubtext}>of the exercise or machine</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Exercise Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Cable Chest Press, Leg Extension..."
            placeholderTextColor={Colors.textSecondary}
            value={exerciseName}
            onChangeText={setExerciseName}
          />
        </View>

        {/* Exercise Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Description</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Describe how to perform this exercise..."
            placeholderTextColor={Colors.textSecondary}
            value={exerciseDescription}
            onChangeText={setExerciseDescription}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Muscle Group Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Muscle Group</Text>
          <View style={styles.muscleGroupGrid}>
            {muscleGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.muscleGroupOption,
                  selectedMuscleGroup === group.id && styles.muscleGroupOptionSelected
                ]}
                onPress={() => setSelectedMuscleGroup(group.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.muscleGroupIcon}>{group.icon}</Text>
                <Text style={[
                  styles.muscleGroupName,
                  selectedMuscleGroup === group.id && styles.muscleGroupNameSelected
                ]}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Integration Placeholder */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aiPlaceholder}
            disabled={true}
            activeOpacity={0.6}
          >
            <LinearGradient
              colors={[Colors.textSecondary + '15', Colors.textSecondary + '08']}
              style={styles.aiPlaceholderGradient}
            >
              <Text style={styles.aiIcon}>🤖</Text>
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiTitle}>AI Analysis (Coming Soon)</Text>
                <Text style={styles.aiSubtitle}>Get automatic exercise details from AI</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <View style={styles.section}>
          <StyledButton
            title="Create Exercise"
            onPress={handleCreateExercise}
            style={styles.createButton}
            disabled={!exerciseName.trim() || !selectedMuscleGroup || !capturedImage}
          />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  // Camera Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraTouch: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  cameraHeaderButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraHeaderButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  cameraTitle: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  cameraBottom: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  cameraControls: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },

  // Photo Section Styles
  photoContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '50',
    borderRadius: BorderRadius.lg,
  },
  photoIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  photoText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  photoSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  imageContainer: {
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  retakeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },

  // Form Styles
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  muscleGroupOption: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  muscleGroupOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  muscleGroupIcon: {
    fontSize: Typography.fontSize.md,
    marginRight: Spacing.xs,
  },
  muscleGroupName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  muscleGroupNameSelected: {
    color: Colors.background,
  },

  // AI Placeholder Styles
  aiPlaceholder: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    opacity: 0.6,
  },
  aiPlaceholderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    borderRadius: BorderRadius.lg,
  },
  aiIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.md,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Button Styles
  createButton: {
    marginTop: Spacing.md,
  },
  permissionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    minWidth: 200,
  },
});

// Modal styles matching the app theme
const modalStyles = {
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
    borderWidth: 1,
    borderColor: Colors.border,
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
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  modalButton: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 120,
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalButtonTextPrimary: {
    color: Colors.background,
  },
};