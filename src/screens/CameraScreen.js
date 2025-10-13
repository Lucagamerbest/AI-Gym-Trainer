import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, Typography } from '../constants/theme';
import { foodAPI } from '../services/foodAPI';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Request camera permissions when component mounts
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scannedBarcode === data || isLoading) return; // Prevent multiple scans of the same barcode

    setScannedBarcode(data);
    setIsLoading(true);
    setIsScanning(false);

    let barcodePhotoUri = null;

    try {
      // Take a photo of the barcode immediately
      if (cameraRef.current && isReady) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            base64: false,
          });
          barcodePhotoUri = photo.uri;
          console.log('📸 Captured barcode photo:', barcodePhotoUri);
        } catch (photoError) {
          console.log('⚠️ Could not capture photo:', photoError.message);
          // Continue without photo
        }
      }

      // Fetch product info from API
      const result = await foodAPI.getProductByBarcode(data);

      if (result.found) {
        // Navigate to FoodScanResult screen with product data AND barcode photo
        navigation.navigate('FoodScanResult', {
          productData: result,
          barcode: data,
          barcodePhotoUri: barcodePhotoUri
        });
      } else {
        Alert.alert(
          'Product Not Found',
          'This product is not in our database. Would you like to try scanning another product?',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setScannedBarcode(null);
                setIsScanning(true);
                setIsLoading(false);
              }
            },
            { text: 'Cancel', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error in handleBarCodeScanned:', error);
      const errorMessage = result?.message || error.message || 'Failed to fetch product information. Please check your internet connection.';

      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScannedBarcode(null);
              setIsScanning(true);
              setIsLoading(false);
            }
          },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && isReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Generate mock nutrition data (in real app, this would come from AI analysis)
        const foodData = {
          name: 'Scanned Food Item',
          calories: Math.floor(Math.random() * 400) + 100,
          protein: Math.floor(Math.random() * 25) + 5,
          carbs: Math.floor(Math.random() * 50) + 10,
          fats: Math.floor(Math.random() * 20) + 5,
        };

        // Add to history if callback provided
        const { onScanComplete } = route?.params || {};
        if (onScanComplete) {
          onScanComplete({
            name: foodData.name,
            image: photo.uri,
            calories: foodData.calories,
            protein: foodData.protein,
            carbs: foodData.carbs,
            fats: foodData.fats,
          });
        }

        // Navigate to FoodScan screen with the captured image
        navigation.navigate('FoodScan', {
          capturedImage: photo.uri,
          foodData: foodData
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const closeCamera = () => {
    navigation.goBack();
  };

  // Handle permission states
  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setIsReady(true)}
        barCodeScannerSettings={{
          barCodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
        }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.closeButton} onPress={closeCamera}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan Food</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanningFrame}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />

          <Text style={styles.scanningText}>
            {isLoading ? 'Looking up product...' : 'Position barcode within the frame'}
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {!isScanning && !isLoading && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setScannedBarcode(null);
                setIsScanning(true);
              }}
            >
              <Text style={styles.rescanButtonText}>Scan Another Product</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.instructionText}>
            {isScanning ? 'Point camera at product barcode' : 'Processing...'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60, // Account for status bar
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 20,
  },
  scanningFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: height * 0.3,
    left: width * 0.15,
  },
  frameCornerTopRight: {
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    right: width * 0.15,
    left: 'auto',
  },
  frameCornerBottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
    bottom: height * 0.3,
    top: 'auto',
  },
  frameCornerBottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: height * 0.3,
    right: width * 0.15,
    top: 'auto',
    left: 'auto',
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: height * 0.25,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingHorizontal: Spacing.lg,
  },
  captureButtonContainer: {
    marginBottom: Spacing.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rescanButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    marginBottom: Spacing.md,
  },
  rescanButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
});