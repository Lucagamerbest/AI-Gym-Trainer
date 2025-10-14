import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { CommonActions } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function ImageViewerScreen({ route, navigation }) {
  const { imageBase64, returnToWorkout, activeTab } = route.params;

  const handleClose = () => {
    if (returnToWorkout) {
      // Reset to WorkoutHistory with params, removing ImageViewer from stack
      navigation.dispatch(state => {
        const routes = state.routes.filter(r => r.name !== 'ImageViewer');
        const historyIndex = routes.findIndex(r => r.name === 'WorkoutHistory');

        if (historyIndex !== -1) {
          routes[historyIndex] = {
            ...routes[historyIndex],
            params: {
              ...routes[historyIndex].params,
              reopenWorkout: returnToWorkout,
              activeTab: activeTab
            }
          };
        }

        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        });
      });
    } else {
      navigation.goBack();
    }
  };

  const handleSaveImage = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to save images.');
        return;
      }

      // Create a temporary file from base64
      const filename = `workout_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Write base64 string to file
      await FileSystem.writeAsStringAsync(fileUri, imageBase64, {
        encoding: 'base64',
      });

      // Save to photo library
      const asset = await MediaLibrary.createAssetAsync(fileUri);

      // Try to create/add to album (optional, will save to Photos even if this fails)
      try {
        const album = await MediaLibrary.getAlbumAsync('Workout Wave');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('Workout Wave', asset, false);
        }
      } catch (albumError) {
        // Album creation skipped
      }

      Alert.alert('Success', 'Image saved to Photos!');
    } catch (error) {
      Alert.alert('Error', `Failed to save image: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Image */}
      <Image
        source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveImage}
      >
        <LinearGradient
          colors={[Colors.primary, '#059669']}
          style={styles.saveGradient}
        >
          <Text style={styles.saveText}>💾 Save to Photos</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  saveButton: {
    position: 'absolute',
    bottom: 50,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    minWidth: 200,
  },
  saveGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
