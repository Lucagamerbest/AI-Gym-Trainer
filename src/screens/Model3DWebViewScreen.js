import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WebView from 'react-native-webview';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import PreloadService from '../services/preloadService';

export default function Model3DWebViewScreen({ navigation, route }) {
  const webViewRef = useRef(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // HTML is pre-cached, no loading needed

  // Get navigation params (for passing through to ExerciseList)
  const { fromWorkout, currentWorkoutExercises, workoutStartTime, existingExerciseSets, fromLibrary, fromProgramCreation, fromProgramDayEdit, programDayIndex } = route.params || {};

  // All muscle groups available in the 3D model
  // Legs split into: glutes, quads, hamstrings, calves
  const allMuscleGroups = ['chest', 'abs', 'shoulders', 'back', 'biceps', 'triceps', 'forearms', 'glutes', 'quads', 'hamstrings', 'calves', 'cardio'];

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'error') {
        console.error('[WebView Error]', data.message);
      } else if (data.type === 'muscleGroupToggled') {
        setSelectedMuscleGroups(data.selectedGroups);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Send commands to WebView
  const sendCommand = (command, params = {}) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ command, ...params });
      webViewRef.current.postMessage(message);
    }
  };

  const handleReset = () => {
    setSelectedMuscleGroups([]);
    sendCommand('reset');
  };

  const handleDeselectMuscle = (muscleToRemove) => {
    const updatedMuscles = selectedMuscleGroups.filter(muscle => muscle !== muscleToRemove);
    setSelectedMuscleGroups(updatedMuscles);
    sendCommand('deselectMuscle', { muscle: muscleToRemove });
  };

  const handleListView = () => {
    // Navigate to traditional muscle group selection screen
    navigation.navigate('MuscleGroupSelectionClassic', {
      fromWorkout,
      currentWorkoutExercises,
      workoutStartTime,
      existingExerciseSets,
      fromLibrary,
      fromProgramCreation,
      fromProgramDayEdit,
      programDayIndex
    });
  };

  const setView = (viewName) => {
    sendCommand('setView', { view: viewName });
  };

  const handleSelectAll = () => {
    if (selectedMuscleGroups.length === allMuscleGroups.length) {
      // Deselect all
      sendCommand('selectAll', { selected: false });
      setSelectedMuscleGroups([]);
    } else {
      // Select all
      sendCommand('selectAll', { selected: true });
      setSelectedMuscleGroups([...allMuscleGroups]);
    }
  };

  const handleContinue = () => {
    if (selectedMuscleGroups.length === 0) {
      return; // Don't continue if no muscle groups selected
    }

    // Navigate to ExerciseList with selected muscles
    navigation.navigate('ExerciseList', {
      selectedMuscleGroups,
      fromWorkout: fromWorkout,
      currentWorkoutExercises: currentWorkoutExercises,
      workoutStartTime: workoutStartTime,
      existingExerciseSets: existingExerciseSets,
      fromMuscleSelection: true,
      fromLibrary: fromLibrary,
      fromProgramCreation: fromProgramCreation,
      fromProgramDayEdit: fromProgramDayEdit,
      programDayIndex: programDayIndex
    });
  };

  // Get cached HTML from PreloadService (pre-generated at app startup for instant loading)
  const htmlContent = PreloadService.getModelHtml();

  return (
    <ScreenLayout
      title="Select Muscles"
      navigation={navigation}
      showBack={true}
      scrollable={true}
    >
      <View style={styles.container}>
        {/* List View Button - Top */}
        <TouchableOpacity
          style={styles.listViewButton}
          onPress={handleListView}
          activeOpacity={0.9}
        >
          <Text style={styles.listViewButtonText}>List View</Text>
        </TouchableOpacity>

        {/* View Toggle Buttons - Moved above model */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.viewToggleButton, styles.viewToggleLeft]}
            onPress={() => setView('front')}
          >
            <Text style={styles.viewToggleText}>Front</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewToggleButton, styles.viewToggleRight]}
            onPress={() => setView('back')}
          >
            <Text style={styles.viewToggleText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* 3D WebView with overlay */}
        <View style={styles.webviewWrapper}>
          <View style={styles.webviewContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Preparing 3D Model...</Text>
                <Text style={styles.loadingSubtext}>First load may take a moment</Text>
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                mixedContentMode="always"
                originWhitelist={['*']}
                androidLayerType="hardware"
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('HTTP error:', nativeEvent);
                }}
              />
            )}
          </View>

          {/* Selected Muscles Overlay - Shows all selected muscles */}
          <View style={styles.muscleOverlay}>
            <View style={styles.overlayContent}>
              {selectedMuscleGroups.length > 0 ? (
                <View style={styles.muscleChipsContainer}>
                  {selectedMuscleGroups.map((muscle) => (
                    <TouchableOpacity
                      key={muscle}
                      style={styles.muscleChip}
                      onPress={() => handleDeselectMuscle(muscle)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.muscleChipText}>{muscle.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.hintText}>Tap muscles to select</Text>
              )}
              {/* Small Cardio Button */}
              {!selectedMuscleGroups.includes('cardio') && (
                <TouchableOpacity
                  style={styles.cardioMiniButton}
                  onPress={() => setSelectedMuscleGroups(prev => [...prev, 'cardio'])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardioMiniText}>+ Cardio</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Primary Action Buttons - Below 3D Model */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.deselectButton}
            onPress={handleSelectAll}
            activeOpacity={0.9}
          >
            <Text style={styles.deselectButtonText}>
              {selectedMuscleGroups.length === allMuscleGroups.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButtonPrimary,
              selectedMuscleGroups.length === 0 && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={selectedMuscleGroups.length === 0}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonPrimaryText}>
              Continue ({selectedMuscleGroups.length})
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
  },
  listViewButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  listViewButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.background,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  deselectButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deselectButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  continueButtonPrimary: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButtonPrimaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.background,
  },
  disabledButton: {
    opacity: 0.5,
  },
  viewToggleContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  viewToggleLeft: {
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
  },
  viewToggleRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: Colors.border,
  },
  viewToggleText: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardioMiniButton: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  cardioMiniText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  webviewWrapper: {
    position: 'relative',
  },
  webviewContainer: {
    height: 500,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  loadingSubtext: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  muscleOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxHeight: 80,
    justifyContent: 'center',
  },
  muscleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    rowGap: 5,
  },
  muscleChip: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  muscleChipText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
  clearChip: {
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  clearChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
