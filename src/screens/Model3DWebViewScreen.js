import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WebView from 'react-native-webview';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function Model3DWebViewScreen({ navigation }) {
  const webViewRef = useRef(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [autoRotate, setAutoRotate] = useState(false);

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'error') {
        console.error('[WebView Error]', data.message);
      } else if (data.type === 'modelLoaded') {
        setMeshCount(data.meshCount);
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
    setSelectedMuscleGroups([]);
    setAutoRotate(false);
    sendCommand('reset');
  };

  const removeMuscleGroup = (group) => {
    sendCommand('deselectGroup', { group });
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" onerror="scriptLoadError('THREE.js')"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js" onerror="scriptLoadError('GLTFLoader')"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js" onerror="scriptLoadError('OrbitControls')"></script>

    <script>
        try {
            function scriptLoadError(scriptName) {
                document.getElementById('loading').innerHTML = 'Error: Failed to load ' + scriptName;
                document.getElementById('loading').style.color = 'red';
            }

        let scene, camera, renderer, model, controls;
        let selectedMuscleGroups = new Set();
        let meshToGroup = {}; // Maps mesh names to muscle groups
        let groupToMeshes = {}; // Maps muscle groups to mesh arrays

        const GRAY_COLOR = 0x808080;
        const SELECTED_COLOR = 0x4ADE80; // Nice green color for selected muscles

        // Muscle group mapping - maps mesh name patterns to muscle groups
        // UPDATED: More specific muscle groups based on anatomy
        const muscleGroupPatterns = {
            // Upper body
            'chest': ['pect', 'chest', 'pectoral', 'body_low'], // Added body_low for testing
            'abs': ['abdom', 'oblique', 'rectus_abdom'],

            // Shoulders - separated front and back
            'shoulder_front': ['anterior_delt', 'front_delt'],
            'shoulder_back': ['posterior_delt', 'rear_delt'],
            'shoulders': ['delt', 'shoulder'], // fallback for generic shoulder meshes

            // Back - separated into regions
            'lats': ['lat', 'latissimus'],
            'lower_back': ['erector', 'lumbar'],
            'middle_back': ['trapez', 'rhomb', 'thoracic'],
            'back': ['dorsi'], // fallback for generic back meshes

            // Arms
            'biceps': ['bicep', 'brachii'],
            'triceps': ['tricep'],
            'forearms': ['forearm', 'brachio'],

            // Legs - separated into regions
            'quads': ['quad', 'vastus', 'rectus_fem'],
            'hamstrings': ['hamstring', 'biceps_fem', 'semimem', 'semiten'],
            'legs': ['femor'], // fallback for generic leg meshes

            // Lower legs
            'calves': ['gastro', 'soleus'],
            'calves_rear': ['calf_rear', 'gastro_rear'],

            // Glutes
            'glutes': ['glut', 'maxim', 'medius', 'minim']
        };

        // Determine muscle group based on 3D click position
        function getMuscleGroupFromPosition(position) {
            const x = position.x;
            const y = position.y;
            const z = position.z;

            // Check ARMS first (before shoulders) since they overlap in X range
            // IMPORTANT: Check FOREARMS first because they're further out on X axis

            // FOREARMS: Very far out on the sides (X >= 0.85)
            if (y >= -1.4 && y <= -0.2 && Math.abs(x) >= 0.85) {
                return 'forearms';
            }

            // BICEPS: Front/side of upper arm
            if (y >= -0.7 && y <= -0.2 && Math.abs(x) >= 0.4 && Math.abs(x) < 0.85 && z >= -0.1) {
                return 'biceps';
            }

            // TRICEPS: Back of upper arm
            if (y >= -0.7 && y <= -0.2 && Math.abs(x) >= 0.4 && Math.abs(x) < 0.85 && z < -0.1) {
                return 'triceps';
            }

            // SHOULDERS - traps and deltoids

            // TRAPS/UPPER BACK: Center of upper back/neck area
            if (y >= -0.25 && y <= 0.2 && (z <= 0.05)) {
                return 'shoulders';
            }

            // SHOULDERS SIDES: Deltoids on the sides
            if (y >= -0.25 && y <= 0.2 && Math.abs(x) >= 0.3) {
                return 'shoulders';
            }

            // CHEST: Upper torso CENTER, front
            if (y >= -0.6 && y <= 0.2 && z > 0.05 && Math.abs(x) < 0.3) {
                return 'chest';
            }

            // ABS: Lower torso, front
            if (y >= -1.0 && y < -0.6 && z > 0.05 && Math.abs(x) < 0.4) {
                return 'abs';
            }

            // BACK: All back muscles
            if (y >= -0.9 && y < -0.25 && z < 0) {
                return 'back';
            }

            // LEGS: Full legs including glutes, quads, hamstrings, and calves

            // Upper legs / Glutes area
            if (y >= -1.3 && y < -0.9 && z < -0.05 && Math.abs(x) < 0.35) {
                return 'legs';
            }

            // Mid legs (quads + hamstrings - thighs)
            if (y >= -1.8 && y < -1.0 && Math.abs(x) < 0.5) {
                return 'legs';
            }

            // Lower legs / Calves area
            if (y >= -2.5 && y < -1.8 && Math.abs(x) < 0.3) {
                return 'legs';
            }

            return null;
        }

        function getMuscleGroupFromMeshName(meshName) {
            if (!meshName) return null;
            const lowerName = meshName.toLowerCase();

            for (const [group, patterns] of Object.entries(muscleGroupPatterns)) {
                for (const pattern of patterns) {
                    if (lowerName.includes(pattern)) {
                        return group;
                    }
                }
            }
            return null;
        }

        function init() {
            if (typeof THREE === 'undefined') {
                document.getElementById('loading').innerHTML = 'Error: THREE.js failed to load';
                document.getElementById('loading').style.color = 'red';
                return;
            }

            if (typeof THREE.GLTFLoader === 'undefined') {
                document.getElementById('loading').innerHTML = 'Error: GLTFLoader failed to load';
                document.getElementById('loading').style.color = 'red';
                return;
            }

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a1a);

            camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, 4);

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

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 2;
            controls.maxDistance = 8;
            controls.autoRotate = false;
            controls.autoRotateSpeed = 1.0;
            controls.target.set(0, 0, 0);

            loadModel();
            window.addEventListener('resize', onWindowResize, false);

            // For mobile: use touchend instead of click
            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                const touch = e.changedTouches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            }, false);

            // Also support desktop clicks
            canvas.addEventListener('click', onClick, false);

            animate();
        }

        function loadModel() {
            const loader = new THREE.GLTFLoader();
            const modelPath = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

            loader.load(
                modelPath,
                function(gltf) {
                    model = gltf.scene;

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

                            const muscleGroup = getMuscleGroupFromMeshName(child.name);
                            if (muscleGroup) {
                                meshToGroup[child.name] = muscleGroup;
                                if (!groupToMeshes[muscleGroup]) {
                                    groupToMeshes[muscleGroup] = [];
                                }
                                groupToMeshes[muscleGroup].push(child);
                                child.userData.muscleGroup = muscleGroup;
                            }
                        }
                    });

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3.2 / maxDim;
                    model.scale.setScalar(scale);

                    scene.add(model);
                    document.getElementById('loading').style.display = 'none';

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'modelLoaded',
                            meshCount: getMeshCount()
                        }));
                    }
                },
                function(xhr) {
                    const percent = xhr.total ? (xhr.loaded / xhr.total * 100).toFixed(0) : 'unknown';
                    document.getElementById('loading').innerHTML = 'Loading... ' + percent + '%<br/>Please wait...';
                },
                function(error) {
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

        function onClick(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            if (!model) return;

            const intersects = raycaster.intersectObjects(model.children, true);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                const clickedMesh = intersection.object;
                const clickPosition = intersection.point;
                const muscleGroup = getMuscleGroupFromPosition(clickPosition);

                if (muscleGroup) {
                    if (selectedMuscleGroups.has(muscleGroup)) {
                        selectedMuscleGroups.delete(muscleGroup);
                    } else {
                        selectedMuscleGroups.add(muscleGroup);
                    }

                    if (selectedMuscleGroups.size > 0) {
                        clickedMesh.material.color.setHex(SELECTED_COLOR);
                    } else {
                        clickedMesh.material.color.setHex(GRAY_COLOR);
                    }

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'muscleGroupToggled',
                            muscleGroup: muscleGroup,
                            selected: selectedMuscleGroups.has(muscleGroup),
                            selectedGroups: Array.from(selectedMuscleGroups)
                        }));
                    }
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
                } else if (data.command === 'deselectGroup') {
                    const group = data.group;
                    if (selectedMuscleGroups.has(group)) {
                        selectedMuscleGroups.delete(group);
                        const meshes = groupToMeshes[group] || [];
                        meshes.forEach(mesh => {
                            mesh.material.color.setHex(GRAY_COLOR);
                        });
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'muscleGroupToggled',
                                muscleGroup: group,
                                selected: false,
                                selectedGroups: Array.from(selectedMuscleGroups)
                            }));
                        }
                    }
                } else if (data.command === 'reset') {
                    if (model) {
                        model.rotation.set(0, 0, 0);
                        camera.position.set(0, 0, 4); // Reset to full body view
                        controls.target.set(0, 0, 0);
                        controls.reset();
                    }
                    // Deselect all muscle groups
                    selectedMuscleGroups.forEach(group => {
                        const meshes = groupToMeshes[group] || [];
                        meshes.forEach(mesh => {
                            mesh.material.color.setHex(GRAY_COLOR);
                        });
                    });
                    selectedMuscleGroups.clear();
                }
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(init, 100);
            });
        } else {
            setTimeout(init, 100);
        }

        } catch (error) {
            console.error('[3D Viewer] FATAL ERROR:', error);
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: 'Script error: ' + error.message
                }));
            }
            document.getElementById('loading').innerHTML = 'Script Error: ' + error.message;
            document.getElementById('loading').style.color = 'red';
        }
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
          />
        </View>

        {/* Selected Muscle Display */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 8,
          minHeight: 50,
          backgroundColor: selectedMuscleGroups.length > 0 ? '#4ADE80' : '#374151',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {selectedMuscleGroups.length > 0 ? (
            <>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#000000',
                flex: 1,
              }}>
                Selected: {selectedMuscleGroups.map(m => m.toUpperCase()).join(', ')}
              </Text>
              <TouchableOpacity
                onPress={handleReset}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{fontSize: 20, fontWeight: 'bold', color: '#000'}}>×</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{
              fontSize: 14,
              color: '#9CA3AF',
              textAlign: 'center',
              flex: 1,
            }}>
              No muscle selected
            </Text>
          )}
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
  selectedGroupsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
    zIndex: 1000,
    elevation: 10,
  },
  muscleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  muscleChipText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  muscleChipRemove: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: Spacing.xs,
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearAllText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: '600',
  },
  webviewContainer: {
    height: 500,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    margin: Spacing.md,
    overflow: 'hidden',
    zIndex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hintContainer: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  hintText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  debugContainer: {
    backgroundColor: '#1a1a1a',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  debugTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: Spacing.sm,
  },
  debugText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'monospace',
    color: '#4ADE80',
    marginBottom: Spacing.xs,
  },
  debugHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
});
