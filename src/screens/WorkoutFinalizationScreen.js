import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';

export default function WorkoutFinalizationScreen({ navigation, route }) {
  const { user } = useAuth();
  const { finishWorkout } = useWorkout();
  const { workoutData, exerciseSets } = route.params || {};

  // Generate default title based on workout type
  const getDefaultTitle = () => {
    if (workoutData.programName) {
      return `${workoutData.programName} - ${workoutData.dayName || 'Workout'}`;
    } else if (workoutData.workoutName) {
      return workoutData.workoutName;
    } else {
      return 'Quick Workout';
    }
  };

  const getWorkoutType = () => {
    if (workoutData.programName) return 'program';
    if (workoutData.workoutName) return 'standalone';
    return 'quick';
  };

  const [workoutTitle, setWorkoutTitle] = useState(getDefaultTitle());
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per workout.');
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to add photos.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        // Read image as base64
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: 'base64',
        });

        setPhotos([...photos, base64]);
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image. Try another photo.');
      }
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 photos per workout.');
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        // Read image as base64
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: 'base64',
        });

        setPhotos([...photos, base64]);
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image. Try taking another photo.');
      }
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const finalWorkoutData = {
        ...workoutData,
        workoutTitle: workoutTitle.trim() || getDefaultTitle(),
        workoutType: getWorkoutType(),
        notes: notes.trim(),
        photos: photos,
      };

      const userId = user?.email || 'guest';

      const saveResult = await WorkoutStorageService.saveWorkout(
        finalWorkoutData,
        exerciseSets,
        userId
      );

      if (!saveResult.success) {
        Alert.alert('Error', 'Failed to save workout. Please try again.');
        setSaving(false);
        return;
      }

      // Clear workout from context
      finishWorkout();

      // Navigate to summary
      navigation.replace('WorkoutSummary', {
        workoutData: finalWorkoutData,
        exerciseSets,
        saveResult,
      });
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
      setSaving(false);
    }
  };

  const handleSkipAndSave = async () => {
    setSaving(true);

    try {
      const finalWorkoutData = {
        ...workoutData,
        workoutTitle: getDefaultTitle(),
        workoutType: getWorkoutType(),
        notes: '',
        photos: [],
      };

      const userId = user?.email || 'guest';
      const saveResult = await WorkoutStorageService.saveWorkout(
        finalWorkoutData,
        exerciseSets,
        userId
      );

      if (!saveResult.success) {
        Alert.alert('Error', 'Failed to save workout. Please try again.');
        setSaving(false);
        return;
      }

      // Clear workout from context
      finishWorkout();

      // Navigate to summary
      navigation.replace('WorkoutSummary', {
        workoutData: finalWorkoutData,
        exerciseSets,
        saveResult,
      });
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
      setSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Finalize Workout"
      subtitle="Add details to remember this session"
      navigation={navigation}
      showBack={false}
      showHome={false}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Workout Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Name</Text>
          <TextInput
            style={styles.titleInput}
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
            placeholder="Enter workout name..."
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
          <Text style={styles.helperText}>
            Default: {getDefaultTitle()}
          </Text>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({photos.length}/3)</Text>
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${photo}` }}
                  style={styles.photoThumbnail}
                />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <View style={styles.addPhotoButtons}>
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={pickImage}
                >
                  <Text style={styles.addPhotoIcon}>🖼️</Text>
                  <Text style={styles.addPhotoText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did you feel? Any achievements or observations..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>

        {/* Quick Stats Preview */}
        <View style={styles.statsPreview}>
          <LinearGradient
            colors={[Colors.primary + '15', Colors.surface]}
            style={styles.statsGradient}
          >
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Duration:</Text>
              <Text style={styles.statValue}>{workoutData.duration}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Exercises:</Text>
              <Text style={styles.statValue}>{workoutData.exercisesCompleted}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Type:</Text>
              <Text style={styles.statValue}>
                {getWorkoutType() === 'program' ? '📋 Program' : getWorkoutType() === 'standalone' ? '💪 Standalone' : '⚡ Quick'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, '#059669']}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveIcon}>💾</Text>
                  <Text style={styles.saveButtonText}>Save Workout</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipAndSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip & Save with Defaults</Text>
          </TouchableOpacity>
        </View>

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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addPhotoButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addPhotoIcon: {
    fontSize: 32,
  },
  addPhotoText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    minHeight: 100,
    marginBottom: Spacing.xs,
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  statsPreview: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGradient: {
    padding: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonSection: {
    gap: Spacing.md,
  },
  saveButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  saveIcon: {
    fontSize: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
