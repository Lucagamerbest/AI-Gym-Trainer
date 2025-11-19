import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WebView from 'react-native-webview';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function Model3DWebViewScreen({ navigation }) {
  const webViewRef = useRef(null);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [meshCount, setMeshCount] = useState(0);

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'debug') {
        console.log(`[WebView Debug] ${data.message}`, data.data || '');
      } else if (data.type === 'error') {
        console.error('[WebView Error]', data.message);
      } else if (data.type === 'modelLoaded') {
        console.log('✅ Model loaded in WebView!');
        console.log('Mesh count:', data.meshCount);
        setMeshCount(data.meshCount);
      } else if (data.type === 'meshClicked') {
        console.log('Clicked mesh:', data.meshName);
        setSelectedMuscle(data.selected ? data.meshName : null);
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

  const handleRotateLeft = () => {
    sendCommand('rotate', { amount: -0.3 });
  };

  const handleRotateRight = () => {
    sendCommand('rotate', { amount: 0.3 });
  };

  const toggleAutoRotate = () => {
    const newState = !autoRotate;
    setAutoRotate(newState);
    sendCommand('autoRotate', { enabled: newState });
  };

  const handleReset = () => {
    setSelectedMuscle(null);
    setAutoRotate(false);
    sendCommand('reset');
  };

  // HTML content - inline to avoid path issues
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Muscle Model Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #1a1a1a;
        }
        #canvas {
            width: 100%;
            height: 100vh;
            display: block;
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-family: Arial, sans-serif;
            font-size: 18px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="loading">Loading 3D Model...<br/>Please wait...</div>
    <canvas id="canvas"></canvas>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <script>
        // Debug logging helper
        function debugLog(message, data) {
            console.log('[3D Viewer]', message, data || '');
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    message: message,
                    data: data
                }));
            }
        }

        debugLog('1. HTML loaded, starting initialization...');

        let scene, camera, renderer, model, controls;
        let selectedMesh = null;

        const GRAY_COLOR = 0x808080;
        const SELECTED_COLOR = 0xFFD700;

        function init() {
            debugLog('2. init() called');

            debugLog('3. Checking THREE.js:', typeof THREE);
            if (typeof THREE === 'undefined') {
                debugLog('ERROR: THREE.js not loaded!');
                document.getElementById('loading').innerHTML = 'Error: THREE.js failed to load';
                document.getElementById('loading').style.color = 'red';
                return;
            }

            debugLog('4. Checking GLTFLoader:', typeof THREE.GLTFLoader);
            if (typeof THREE.GLTFLoader === 'undefined') {
                debugLog('ERROR: GLTFLoader not loaded!');
                document.getElementById('loading').innerHTML = 'Error: GLTFLoader failed to load';
                document.getElementById('loading').style.color = 'red';
                return;
            }

            debugLog('5. Creating scene...');
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a1a);

            camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, 5);

            const canvas = document.getElementById('canvas');
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight1.position.set(5, 5, 5);
            scene.add(directionalLight1);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
            directionalLight2.position.set(-5, -5, -5);
            scene.add(directionalLight2);

            debugLog('6. Creating OrbitControls...');
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 2;
            controls.maxDistance = 10;
            controls.autoRotate = false;
            controls.autoRotateSpeed = 1.0;

            debugLog('7. Starting model load...');
            loadModel();
            window.addEventListener('resize', onWindowResize, false);
            animate();
        }

        function loadModel() {
            debugLog('8. loadModel() called');
            const loader = new THREE.GLTFLoader();

            // Try GitHub raw URL first (more reliable than jsDelivr for large files)
            const modelPath = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

            debugLog('9. Model URL:', modelPath);
            debugLog('10. Starting loader.load()...');

            loader.load(
                modelPath,
                function(gltf) {
                    debugLog('11. SUCCESS! Model loaded from server');
                    model = gltf.scene;

                    debugLog('12. Processing model meshes...');
                    let meshCount = 0;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;
                            child.material = new THREE.MeshStandardMaterial({
                                color: GRAY_COLOR,
                                roughness: 0.7,
                                metalness: 0.1,
                            });
                            child.userData.originalColor = GRAY_COLOR;
                            child.userData.clickable = true;
                            debugLog('Mesh found:', child.name);
                        }
                    });
                    debugLog('13. Total meshes processed:', meshCount);

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2.5 / maxDim;
                    model.scale.setScalar(scale);

                    debugLog('14. Adding model to scene...');
                    scene.add(model);
                    document.getElementById('loading').style.display = 'none';
                    debugLog('15. ✅ Model fully loaded and displayed!');

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'modelLoaded',
                            meshCount: getMeshCount()
                        }));
                    }
                },
                function(xhr) {
                    const percent = xhr.total ? (xhr.loaded / xhr.total * 100).toFixed(0) : 'unknown';
                    debugLog('Loading progress:', percent + '%');
                    document.getElementById('loading').innerHTML = 'Loading... ' + percent + '%<br/>Please wait...';
                },
                function(error) {
                    debugLog('ERROR loading model:', error.message || error);
                    console.error('Full error:', error);
                    document.getElementById('loading').innerHTML = 'Error loading model<br/>' + (error.message || 'Unknown error');
                    document.getElementById('loading').style.color = 'red';

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'error',
                            message: error.message || 'Unknown error'
                        }));
                    }
                }
            );
        }

        function getMeshCount() {
            let count = 0;
            if (model) {
                model.traverse((child) => {
                    if (child.isMesh) count++;
                });
            }
            return count;
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        renderer.domElement.addEventListener('click', onClick, false);

        function onClick(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            if (model) {
                const intersects = raycaster.intersectObjects(model.children, true);

                if (intersects.length > 0) {
                    const clickedMesh = intersects[0].object;

                    if (selectedMesh && selectedMesh !== clickedMesh) {
                        selectedMesh.material.color.setHex(selectedMesh.userData.originalColor);
                    }

                    if (selectedMesh === clickedMesh) {
                        clickedMesh.material.color.setHex(GRAY_COLOR);
                        selectedMesh = null;
                    } else {
                        clickedMesh.material.color.setHex(SELECTED_COLOR);
                        selectedMesh = clickedMesh;
                    }

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'meshClicked',
                            meshName: clickedMesh.name,
                            selected: selectedMesh === clickedMesh
                        }));
                    }

                    console.log('Clicked:', clickedMesh.name);
                }
            }
        }

        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);

                if (data.command === 'rotate') {
                    if (model) {
                        model.rotation.y += data.amount;
                    }
                } else if (data.command === 'autoRotate') {
                    controls.autoRotate = data.enabled;
                } else if (data.command === 'reset') {
                    if (model) {
                        model.rotation.set(0, 0, 0);
                        camera.position.set(0, 0, 5);
                        controls.reset();
                    }
                    if (selectedMesh) {
                        selectedMesh.material.color.setHex(GRAY_COLOR);
                        selectedMesh = null;
                    }
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });

        init();
    </script>
</body>
</html>
  `;

  const htmlSource = { html: htmlContent };

  return (
    <ScreenLayout
      title="3D Muscle Model (WebView)"
      subtitle="Gray anatomy model with muscle definition"
      navigation={navigation}
      showBack={true}
      scrollable={false}
    >
      <View style={styles.container}>
        {/* 3D WebView */}
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={htmlSource}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            originWhitelist={['*']}
            baseUrl={Platform.OS === 'android' ? 'file:///android_asset/' : ''}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error:', nativeEvent);
            }}
            onLoadStart={() => console.log('WebView loading...')}
            onLoadEnd={() => console.log('WebView loaded!')}
          />
        </View>

        {/* Selected Muscle Display */}
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionLabel}>Selected Muscle:</Text>
          <Text style={styles.selectionValue}>
            {selectedMuscle || 'None - Tap on model'}
          </Text>
          {meshCount > 0 && (
            <Text style={styles.meshCountText}>
              {meshCount} clickable muscle meshes loaded
            </Text>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <View style={styles.rotationControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRotateLeft}
            >
              <Text style={styles.controlButtonText}>← Rotate Left</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, autoRotate && styles.controlButtonActive]}
              onPress={toggleAutoRotate}
            >
              <Text style={styles.controlButtonText}>
                {autoRotate ? '⏸ Stop' : '▶ Auto Rotate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRotateRight}
            >
              <Text style={styles.controlButtonText}>Rotate Right →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>🎨 Gray Muscle Anatomy Model</Text>
          <Text style={styles.instructionsText}>• All muscles rendered in gray (not skin tone)</Text>
          <Text style={styles.instructionsText}>• Tap any muscle to select it (turns gold)</Text>
          <Text style={styles.instructionsText}>• Rotate to see front/back muscles</Text>
          <Text style={styles.instructionsText}>• Shows detailed muscle definition</Text>
        </View>

        {/* Model Info */}
        <View style={styles.modelInfoContainer}>
          <Text style={styles.modelInfoTitle}>📥 To Use Custom Model:</Text>
          <Text style={styles.modelInfoText}>
            1. Download "Male Base Muscular Anatomy" from Sketchfab
          </Text>
          <Text style={styles.modelInfoText}>
            2. Place GLB file: assets/models/human.glb
          </Text>
          <Text style={styles.modelInfoText}>
            3. Model will automatically load as GRAY
          </Text>
          <Text style={styles.modelInfoText}>
            4. All skin tones converted to gray material
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  webviewContainer: {
    height: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  selectionContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectionLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  selectionValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  meshCountText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  controlsContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  rotationControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  controlButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  controlButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  instructionsContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  modelInfoContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#E3F2FD',
    borderRadius: BorderRadius.md,
  },
  modelInfoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: Spacing.sm,
  },
  modelInfoText: {
    fontSize: Typography.fontSize.sm,
    color: '#0D47A1',
    marginBottom: Spacing.xs,
  },
});
