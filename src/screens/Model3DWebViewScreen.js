import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WebView from 'react-native-webview';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MODEL_REMOTE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

export default function Model3DWebViewScreen({ navigation, route }) {
  const webViewRef = useRef(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [modelUri, setModelUri] = useState(null);
  const [isExpoGo, setIsExpoGo] = useState(true); // Default to true (safer - uses CDN)
  const [isLoading, setIsLoading] = useState(true);

  // Detect if running in Expo Go or dev/production build
  // Expo Go: Use remote URL (can't access native assets)
  // Dev Build/Production: Use local bundled asset (offline support)
  useEffect(() => {
    import('expo-constants').then((Constants) => {
      const expoGo = Constants.default.appOwnership === 'expo';
      setIsExpoGo(expoGo);

      if (expoGo) {
        // Expo Go - must use remote URL
        setModelUri(MODEL_REMOTE_URL);
      } else {
        // Dev build or production - use local Android asset (works offline!)
        if (Platform.OS === 'android') {
          setModelUri('file:///android_asset/models/human.glb');
        } else {
          // iOS - use remote for now (TODO: bundle for iOS)
          setModelUri(MODEL_REMOTE_URL);
        }
      }
      setIsLoading(false);
    }).catch(() => {
      // Fallback to remote URL
      setModelUri(MODEL_REMOTE_URL);
      setIsLoading(false);
    });
  }, []);

  // Get navigation params (for passing through to ExerciseList)
  const { fromWorkout, currentWorkoutExercises, workoutStartTime, existingExerciseSets, fromLibrary, fromProgramCreation, fromProgramDayEdit, programDayIndex } = route.params || {};

  // All muscle groups available in the 3D model
  const allMuscleGroups = ['chest', 'abs', 'shoulders', 'back', 'biceps', 'triceps', 'forearms', 'legs'];

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

  // Script sources - use local files for dev/production (offline), CDN for Expo Go
  const useLocalAssets = !isExpoGo && Platform.OS === 'android';
  const scriptSources = useLocalAssets
    ? {
        three: 'file:///android_asset/js/three.min.js',
        gltfLoader: 'file:///android_asset/js/GLTFLoader.js',
        orbitControls: 'file:///android_asset/js/OrbitControls.js',
        dracoLoader: 'file:///android_asset/js/DRACOLoader.js',
        dracoDecoderPath: 'file:///android_asset/js/draco/',
      }
    : {
        three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        gltfLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
        orbitControls: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
        dracoLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js',
        dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/',
      };

  // Log which mode we're using

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

    <script src="${scriptSources.three}" onerror="scriptLoadError('THREE.js')"></script>
    <script src="${scriptSources.gltfLoader}" onerror="scriptLoadError('GLTFLoader')"></script>
    <script src="${scriptSources.dracoLoader}" onerror="scriptLoadError('DRACOLoader')"></script>
    <script src="${scriptSources.orbitControls}" onerror="scriptLoadError('OrbitControls')"></script>

    <script>
        try {
            function scriptLoadError(scriptName) {
                document.getElementById('loading').innerHTML = 'Error: Failed to load ' + scriptName;
                document.getElementById('loading').style.color = 'red';
            }

        let scene, camera, renderer, model, controls;
        let selectedMuscleGroups = new Set();
        let bodyMeshMaterial = null; // Custom shader material for highlighting
        let isAnimating = false;
        let currentView = 'front'; // Track current view: 'front' or 'back'

        const GRAY_COLOR = new THREE.Color(0x808080);
        const SELECTED_COLOR = new THREE.Color(0x4ADE80); // Nice green color for selected muscles

        // Camera position - centered on model
        const CAMERA_POSITION = { x: 0, y: -1.2, z: 4.8 };
        const CAMERA_TARGET = { x: 0, y: -1.2, z: 0 };

        // Determine muscle group based on 3D click position
        function getMuscleGroupFromPosition(position) {
            const x = position.x;
            const y = position.y;
            const z = position.z;

            // SHOULDERS: Deltoids + Traps (shoulder caps and upper back)
            // Front/side deltoids
            if (y >= -0.5 && y < -0.1 && Math.abs(x) >= 0.25 && Math.abs(x) < 0.55 && z > -0.1) {
                return 'shoulders';
            }
            // Front deltoids
            if (y >= -0.4 && y < -0.15 && z > 0.05 && Math.abs(x) >= 0.15 && Math.abs(x) < 0.35) {
                return 'shoulders';
            }
            // Rear deltoids (back of shoulders)
            if (y >= -0.5 && y < -0.1 && Math.abs(x) >= 0.3 && Math.abs(x) < 0.55 && z >= -0.25 && z <= -0.05) {
                return 'shoulders';
            }
            // Traps (upper back, centered on spine)
            if (y >= -0.5 && y < 0.05 && z < -0.05 && Math.abs(x) < 0.25) {
                return 'shoulders';
            }

            // CHEST: All pectorals - keep original good detection
            if (y >= -0.55 && y < -0.15 && z > 0.08 && Math.abs(x) < 0.28) {
                return 'chest';
            }

            // ABS: Entire core front - keep original good detection
            if (y >= -1.0 && y < -0.55 && z > 0.05 && Math.abs(x) < 0.35) {
                return 'abs';
            }

            // BACK: Lats, lower back, and obliques (side torso)
            // Back side lats (below traps)
            if (y >= -0.88 && y < -0.5 && z < -0.13 && Math.abs(x) < 0.4) {
                return 'back';
            }
            // Side lats/obliques (sides of torso) - now part of back
            if (y >= -1.0 && y < -0.5 && z >= -0.05 && z <= 0.08 && Math.abs(x) >= 0.3 && Math.abs(x) < 0.45) {
                return 'back';
            }

            // BICEPS: Front of upper arm - improved positioning
            if (y >= -1.0 && y < -0.35 && Math.abs(x) >= 0.4 && Math.abs(x) < 0.85 && z > -0.04) {
                return 'biceps';
            }

            // TRICEPS: Back of upper arm - improved positioning
            if (y >= -0.85 && y < -0.4 && Math.abs(x) >= 0.45 && Math.abs(x) < 0.7 && z <= -0.15) {
                return 'triceps';
            }

            // FOREARMS: Lower arm (user-defined, bilateral, excluding hands)
            if (y >= -0.59 && y < -0.36 && z >= -0.21 && z <= 0.14 && Math.abs(x) >= 1.0 && Math.abs(x) < 1.55) {
                return 'forearms';
            }

            // LEGS: Entire legs - keep original good detection
            if (y >= -2.7 && y < -1.0 && Math.abs(x) < 0.52) {
                return 'legs';
            }

            return null;
        }

        // Create custom shader material that highlights specific muscle regions
        function createMuscleShaderMaterial() {
            const vertexShader = \`
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;

                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;

                    vNormal = normalize(normalMatrix * normal);

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;

                    gl_Position = projectionMatrix * mvPosition;
                }
            \`;

            const fragmentShader = \`
                uniform vec3 baseColor;
                uniform vec3 selectedColor;
                uniform float selectedMuscles[8]; // 8 muscle groups
                uniform vec3 ambientLightColor;
                uniform vec3 directionalLightColor;
                uniform vec3 directionalLightDirection;

                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;

                void main() {
                    float x = vWorldPosition.x;
                    float y = vWorldPosition.y;
                    float z = vWorldPosition.z;

                    vec3 baseCol = baseColor;
                    bool isSelected = false;

                    // CHEST (0) - All pectorals
                    if (selectedMuscles[0] > 0.5 && y >= -0.55 && y < -0.15 && z > 0.08 && abs(x) < 0.28) {
                        isSelected = true;
                    }

                    // ABS (1) - Entire core front
                    if (selectedMuscles[1] > 0.5 && y >= -1.0 && y < -0.55 && z > 0.05 && abs(x) < 0.35) {
                        isSelected = true;
                    }

                    // SHOULDERS (2) - Deltoids + Traps
                    if (selectedMuscles[2] > 0.5) {
                        // Front/side deltoids
                        if ((y >= -0.5 && y < -0.1 && abs(x) >= 0.25 && abs(x) < 0.55 && z > -0.1) ||
                            // Front deltoids
                            (y >= -0.4 && y < -0.15 && z > 0.05 && abs(x) >= 0.15 && abs(x) < 0.35) ||
                            // Rear deltoids (back of shoulders)
                            (y >= -0.5 && y < -0.1 && abs(x) >= 0.3 && abs(x) < 0.55 && z >= -0.25 && z <= -0.05) ||
                            // Traps (upper back)
                            (y >= -0.5 && y < 0.05 && z < -0.05 && abs(x) < 0.25)) {
                            isSelected = true;
                        }
                    }

                    // BACK (3) - Lats, lower back, and obliques
                    if (selectedMuscles[3] > 0.5) {
                        // Back side lats
                        if ((y >= -0.88 && y < -0.5 && z < -0.13 && abs(x) < 0.4) ||
                            // Side lats/obliques (sides of torso) - now part of back
                            (y >= -1.0 && y < -0.5 && z >= -0.05 && z <= 0.08 && abs(x) >= 0.3 && abs(x) < 0.45)) {
                            isSelected = true;
                        }
                    }

                    // BICEPS (4) - Front of upper arm
                    if (selectedMuscles[4] > 0.5 && y >= -1.0 && y < -0.35 && abs(x) >= 0.4 && abs(x) < 0.85 && z > -0.04) {
                        isSelected = true;
                    }

                    // TRICEPS (5) - Back of upper arm
                    if (selectedMuscles[5] > 0.5 && y >= -0.85 && y < -0.4 && abs(x) >= 0.45 && abs(x) < 0.7 && z <= -0.15) {
                        isSelected = true;
                    }

                    // FOREARMS (6) - Lower arm (bilateral, excluding hands)
                    if (selectedMuscles[6] > 0.5 && y >= -0.59 && y < -0.36 && z >= -0.21 && z <= 0.14 && abs(x) >= 1.0 && abs(x) < 1.55) {
                        isSelected = true;
                    }

                    // LEGS (7) - Entire legs
                    if (selectedMuscles[7] > 0.5 && y >= -2.7 && y < -1.0 && abs(x) < 0.52) {
                        isSelected = true;
                    }

                    if (isSelected) {
                        baseCol = selectedColor;
                    }

                    // Lighting calculations
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);

                    // Ambient light
                    vec3 ambient = ambientLightColor * baseCol;

                    // Diffuse light (Lambertian)
                    vec3 lightDir = normalize(directionalLightDirection);
                    float diff = max(dot(normal, lightDir), 0.0);
                    vec3 diffuse = directionalLightColor * diff * baseCol;

                    // Specular light (Blinn-Phong)
                    vec3 halfDir = normalize(lightDir + viewDir);
                    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
                    vec3 specular = directionalLightColor * spec * 0.3;

                    // Combine lighting
                    vec3 finalColor = ambient + diffuse + specular;

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            \`;

            return new THREE.ShaderMaterial({
                uniforms: {
                    baseColor: { value: GRAY_COLOR },
                    selectedColor: { value: SELECTED_COLOR },
                    selectedMuscles: { value: [0, 0, 0, 0, 0, 0, 0, 0] },
                    ambientLightColor: { value: new THREE.Color(0xffffff).multiplyScalar(0.6) },
                    directionalLightColor: { value: new THREE.Color(0xffffff).multiplyScalar(0.8) },
                    directionalLightDirection: { value: new THREE.Vector3(5, 5, 5).normalize() }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                lights: false
            });
        }

        function updateMuscleHighlights() {
            if (!bodyMeshMaterial) return;

            const muscleIndexMap = {
                'chest': 0,
                'abs': 1,
                'shoulders': 2,
                'back': 3,
                'biceps': 4,
                'triceps': 5,
                'forearms': 6,
                'legs': 7
            };

            const selectedArray = [0, 0, 0, 0, 0, 0, 0, 0];

            selectedMuscleGroups.forEach(group => {
                const index = muscleIndexMap[group];
                if (index !== undefined) {
                    selectedArray[index] = 1.0;
                }
            });

            bodyMeshMaterial.uniforms.selectedMuscles.value = selectedArray;
            bodyMeshMaterial.needsUpdate = true;

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

            camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, -1.2, 4.8);
            camera.lookAt(0, -1.2, 0);

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
            controls.enableRotate = true; // Enable rotation
            controls.enablePan = false; // Disable panning
            controls.enableZoom = true; // Enable pinch to zoom
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.minDistance = 4.5;
            controls.maxDistance = 8.0;
            controls.target.set(0, -1.2, 0);
            // Lock vertical rotation - only horizontal
            controls.minPolarAngle = Math.PI / 2;
            controls.maxPolarAngle = Math.PI / 2;

            loadModel();
            window.addEventListener('resize', onWindowResize, false);

            // Touch handling - prevent double-firing of click events
            let lastTouchTime = 0;

            canvas.addEventListener('touchend', function(e) {
                e.preventDefault(); // Prevent synthetic click event
                lastTouchTime = Date.now();
                const touch = e.changedTouches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            }, { passive: false });

            canvas.addEventListener('click', function(e) {
                // Ignore click if it came right after a touch (prevents double-firing)
                if (Date.now() - lastTouchTime < 500) {
                    return;
                }
                onClick(e);
            }, false);

            animate();
        }

        function loadModel() {
            const loader = new THREE.GLTFLoader();

            // Set up Draco decoder for compressed models (70% smaller = faster loading!)
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('${scriptSources.dracoDecoderPath}');
            loader.setDRACOLoader(dracoLoader);

            const modelPath = '${modelUri || 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb'}';

            loader.load(
                modelPath,
                function(gltf) {
                    model = gltf.scene;

                    // Create the shader material once
                    bodyMeshMaterial = createMuscleShaderMaterial();

                    let meshCount = 0;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;

                            // Skip eye meshes
                            if (child.name.toLowerCase().includes('eye')) {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: GRAY_COLOR,
                                    roughness: 0.7,
                                    metalness: 0.1,
                                });
                            } else {
                                // Apply shader material to body meshes
                                child.material = bodyMeshMaterial;
                            }
                        }
                    });

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3.6 / maxDim;
                    model.scale.setScalar(scale);

                    scene.add(model);

                    document.getElementById('loading').style.display = 'none';
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

        // Set view by moving camera (not rotating model - keeps coordinates stable)
        function setPresetView(viewName) {
            if (!model || isAnimating) return;
            isAnimating = true;

            const targetZ = viewName === 'front' ? CAMERA_POSITION.z : -CAMERA_POSITION.z;
            const startZ = camera.position.z;
            const startTime = Date.now();
            const duration = 600;

            function animateStep() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-in-out
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : -1 + (4 - 2 * progress) * progress;

                camera.position.z = startZ + (targetZ - startZ) * eased;
                camera.lookAt(0, -1.2, 0);

                if (progress < 1) {
                    requestAnimationFrame(animateStep);
                } else {
                    camera.position.z = targetZ;
                    currentView = viewName;
                    isAnimating = false;
                }
            }

            animateStep();
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
                const clickPosition = intersection.point;

                // Toggle muscle selection
                const muscleGroup = getMuscleGroupFromPosition(clickPosition);

                if (muscleGroup) {
                    if (selectedMuscleGroups.has(muscleGroup)) {
                        selectedMuscleGroups.delete(muscleGroup);
                    } else {
                        selectedMuscleGroups.add(muscleGroup);
                    }

                    updateMuscleHighlights();

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

                if (data.command === 'setView') {
                    setPresetView(data.view);
                } else if (data.command === 'reset') {
                    if (model) {
                        model.rotation.set(0, 0, 0);
                        currentView = 'front';
                    }
                    selectedMuscleGroups.clear();
                    updateMuscleHighlights();
                } else if (data.command === 'selectAll') {
                    const allGroups = ['chest', 'abs', 'shoulders', 'back', 'biceps', 'triceps', 'forearms', 'legs'];

                    if (data.selected) {
                        // Select all muscles
                        selectedMuscleGroups.clear();
                        allGroups.forEach(group => selectedMuscleGroups.add(group));
                    } else {
                        // Deselect all muscles
                        selectedMuscleGroups.clear();
                    }

                    updateMuscleHighlights();

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'muscleGroupToggled',
                            selectedGroups: Array.from(selectedMuscleGroups)
                        }));
                    }
                } else if (data.command === 'deselectMuscle') {
                    // Deselect a specific muscle
                    selectedMuscleGroups.delete(data.muscle);

                    updateMuscleHighlights();

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'muscleGroupToggled',
                            selectedGroups: Array.from(selectedMuscleGroups)
                        }));
                    }
                } else if (data.command === 'selectMuscle') {
                    // Select a specific muscle
                    selectedMuscleGroups.add(data.muscle);

                    updateMuscleHighlights();

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'muscleGroupToggled',
                            selectedGroups: Array.from(selectedMuscleGroups)
                        }));
                    }
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
            )}
          </View>

          {/* Selected Muscles Overlay - Shows all selected muscles */}
          <View style={styles.muscleOverlay}>
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
