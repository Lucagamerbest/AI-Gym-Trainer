import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import WebView from 'react-native-webview';
import ScreenLayout from '../components/ScreenLayout';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

export default function Model3DWebViewScreen({ navigation }) {
  const webViewRef = useRef(null);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [autoRotate, setAutoRotate] = useState(false);
  const [meshCount, setMeshCount] = useState(0);

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

  const setView = (viewName) => {
    sendCommand('setView', { view: viewName });
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
        let bodyMeshMaterial = null; // Custom shader material for highlighting
        let isAnimating = false;

        const GRAY_COLOR = new THREE.Color(0x808080);
        const SELECTED_COLOR = new THREE.Color(0x4ADE80); // Nice green color for selected muscles

        // Preset camera positions for different views
        const CAMERA_POSITIONS = {
            front: { x: 0, y: -0.5, z: 3.8 },
            back: { x: 0, y: -0.5, z: -3.8 },
            left: { x: -3.8, y: -0.5, z: 0 },
            right: { x: 3.8, y: -0.5, z: 0 }
        };

        // Determine muscle group based on 3D click position
        function getMuscleGroupFromPosition(position) {
            const x = position.x;
            const y = position.y;
            const z = position.z;

            // FOREARMS: Upper forearm/elbow area, exclude hands
            if (y >= -0.65 && y < -0.22 && Math.abs(x) >= 0.90 && Math.abs(x) < 1.15) {
                return 'forearms';
            }

            // BICEPS: Front of upper arm - extended upward to cover entire bicep
            if (y >= -0.75 && y <= -0.25 && Math.abs(x) >= 0.5 && Math.abs(x) < 0.9 && z > 0.0) {
                return 'biceps';
            }

            // TRICEPS: Back of upper arm (z <= 0), exclude shoulders
            if (y >= -0.75 && y < -0.25 && Math.abs(x) >= 0.5 && Math.abs(x) < 0.9 && z <= 0.0) {
                return 'triceps';
            }

            // SHOULDERS - precise deltoids and traps
            // Traps (upper back/neck area)
            if (y >= -0.2 && y < 0.05 && z < -0.08 && Math.abs(x) < 0.2) {
                return 'shoulders';
            }

            // Lateral deltoids (side shoulder caps)
            if (y >= -0.35 && y < -0.05 && Math.abs(x) >= 0.3 && Math.abs(x) < 0.48 && z > -0.2 && z < 0.15) {
                return 'shoulders';
            }

            // Front deltoids (front of shoulder)
            if (y >= -0.28 && y < -0.12 && z > 0.05 && Math.abs(x) >= 0.2 && Math.abs(x) < 0.35) {
                return 'shoulders';
            }

            // CHEST: Upper torso CENTER, front, exclude face
            if (y >= -0.6 && y <= -0.15 && z > 0.05 && Math.abs(x) < 0.3) {
                return 'chest';
            }

            // ABS: Lower torso, front
            if (y >= -1.0 && y < -0.6 && z > 0.05 && Math.abs(x) < 0.4) {
                return 'abs';
            }

            // BACK: STRICT z < -0.05 to prevent showing on front
            if (y >= -0.95 && y < -0.2 && z < -0.05 && Math.abs(x) < 0.35) {
                return 'back';
            }

            // LEGS: Exclude feet strictly (y >= -2.4)
            // Upper legs / Glutes
            if (y >= -1.4 && y < -0.95 && Math.abs(x) < 0.45) {
                return 'legs';
            }

            // Mid thighs
            if (y >= -1.95 && y < -1.0 && Math.abs(x) < 0.55) {
                return 'legs';
            }

            // Lower legs / Calves - STRICTLY exclude feet
            if (y >= -2.4 && y < -1.8 && Math.abs(x) < 0.4) {
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
                uniform float selectedMuscles[10]; // [chest, abs, shoulders, back, biceps, triceps, forearms, legs, quads, glutes]
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

                    // CHEST (index 0) - Exclude face by limiting upper y to -0.15
                    if (selectedMuscles[0] > 0.5) {
                        if (y >= -0.6 && y <= -0.15 && z > 0.05 && abs(x) < 0.3) {
                            isSelected = true;
                        }
                    }

                    // ABS (index 1) - Already good
                    if (selectedMuscles[1] > 0.5) {
                        if (y >= -1.0 && y < -0.6 && z > 0.05 && abs(x) < 0.4) {
                            isSelected = true;
                        }
                    }

                    // SHOULDERS (index 2) - Precise deltoids and traps
                    if (selectedMuscles[2] > 0.5) {
                        // Traps (upper back/neck area) - more precise
                        if (y >= -0.2 && y < 0.05 && z < -0.08 && abs(x) < 0.2) {
                            isSelected = true;
                        }
                        // Lateral deltoids (side shoulder caps) - most prominent part
                        else if (y >= -0.35 && y < -0.05 && abs(x) >= 0.3 && abs(x) < 0.48 && z > -0.2 && z < 0.15) {
                            isSelected = true;
                        }
                        // Front deltoids (smaller area, front of shoulder)
                        else if (y >= -0.28 && y < -0.12 && z > 0.05 && abs(x) >= 0.2 && abs(x) < 0.35) {
                            isSelected = true;
                        }
                    }

                    // BACK (index 3) - STRICT z < -0.05 to prevent showing on front! SMOOTH EDGES
                    if (selectedMuscles[3] > 0.5) {
                        // Lats and middle back - MUST be behind (z < -0.05)
                        if (y >= -0.95 && y < -0.2 && z < -0.05 && abs(x) < 0.35) {
                            // Create smooth, organic edges instead of rectangle
                            float xEdge = smoothstep(0.3, 0.35, abs(x));
                            float yTopEdge = smoothstep(-0.25, -0.2, y);
                            float yBottomEdge = smoothstep(-0.95, -0.9, y);

                            // Only select if we're within the smooth boundaries
                            if (xEdge < 0.5 && yTopEdge < 0.5 && yBottomEdge > 0.5) {
                                isSelected = true;
                            }
                        }
                    }

                    // BICEPS (index 4) - Extended to cover entire bicep
                    if (selectedMuscles[4] > 0.5) {
                        if (y >= -0.75 && y <= -0.25 && abs(x) >= 0.5 && abs(x) < 0.9 && z > 0.0) {
                            isSelected = true;
                        }
                    }

                    // TRICEPS (index 5) - Match biceps range
                    if (selectedMuscles[5] > 0.5) {
                        if (y >= -0.75 && y < -0.25 && abs(x) >= 0.5 && abs(x) < 0.9 && z <= 0.0) {
                            isSelected = true;
                        }
                    }

                    // FOREARMS (index 6) - Upper forearm/elbow area, EXCLUDE HANDS, smooth edges
                    if (selectedMuscles[6] > 0.5) {
                        if (y >= -0.65 && y < -0.22 && abs(x) >= 0.90 && abs(x) < 1.15) {
                            // Smooth edges at the boundaries
                            float xInnerEdge = smoothstep(0.90, 0.95, abs(x));
                            float xOuterEdge = smoothstep(1.15, 1.10, abs(x));
                            float yTopEdge = smoothstep(-0.26, -0.22, y);
                            float yBottomEdge = smoothstep(-0.65, -0.60, y);
                            if (xInnerEdge > 0.3 && xOuterEdge > 0.3 && yTopEdge < 0.7 && yBottomEdge > 0.3) {
                                isSelected = true;
                            }
                        }
                    }

                    // LEGS (index 7) - Exclude feet (y >= -2.4), smooth edges
                    if (selectedMuscles[7] > 0.5) {
                        // Upper legs / Glutes
                        if (y >= -1.4 && y < -0.95 && abs(x) < 0.45) {
                            float edgeFactor = smoothstep(0.4, 0.45, abs(x));
                            if (edgeFactor < 0.5) {
                                isSelected = true;
                            }
                        }
                        // Mid thighs - wider
                        else if (y >= -1.95 && y < -1.0 && abs(x) < 0.55) {
                            float edgeFactor = smoothstep(0.5, 0.55, abs(x));
                            if (edgeFactor < 0.5) {
                                isSelected = true;
                            }
                        }
                        // Lower legs / Calves - STRICTLY exclude feet (y >= -2.4)
                        else if (y >= -2.4 && y < -1.8 && abs(x) < 0.4) {
                            float edgeFactor = smoothstep(0.35, 0.4, abs(x));
                            if (edgeFactor < 0.5) {
                                isSelected = true;
                            }
                        }
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
                    selectedMuscles: { value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
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

            const selectedArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            selectedMuscleGroups.forEach(group => {
                const index = muscleIndexMap[group];
                if (index !== undefined) {
                    selectedArray[index] = 1.0;
                }
            });

            bodyMeshMaterial.uniforms.selectedMuscles.value = selectedArray;
            bodyMeshMaterial.needsUpdate = true;

            console.log('Updated shader with selected muscles:', Array.from(selectedMuscleGroups));
            console.log('Shader array:', selectedArray);
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
            camera.position.set(0, -0.5, 3.8);

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

            // CONSTRAIN ROTATION - Prevent weird angles (no looking from feet or above head)
            controls.minPolarAngle = Math.PI / 6;     // 30° - can't look from too high
            controls.maxPolarAngle = Math.PI * 5 / 6; // 150° - can't look from below feet
            controls.enablePan = false; // Disable panning for cleaner experience

            loadModel();
            window.addEventListener('resize', onWindowResize, false);

            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                const touch = e.changedTouches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            }, false);

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
                                console.log('Skipping eye mesh:', child.name);
                            } else {
                                // Apply shader material to body meshes
                                child.material = bodyMeshMaterial;
                                console.log('Applied shader material to body mesh:', child.name);
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
                            meshCount: meshCount
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

        // Smooth camera animation to preset view
        function animateCameraToPosition(targetPos, duration = 1000) {
            if (isAnimating) return;
            isAnimating = true;

            const startPos = {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            };

            const startTime = Date.now();

            function animateStep() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease-in-out function for smooth animation
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : -1 + (4 - 2 * progress) * progress;

                camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
                camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
                camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;

                camera.lookAt(0, 0, 0);
                controls.update();

                if (progress < 1) {
                    requestAnimationFrame(animateStep);
                } else {
                    isAnimating = false;
                }
            }

            animateStep();
        }

        // Set camera to preset view
        function setPresetView(viewName) {
            const targetPos = CAMERA_POSITIONS[viewName];
            if (targetPos) {
                animateCameraToPosition(targetPos);
                console.log('Switching to', viewName, 'view');
            }
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

                if (data.command === 'rotate') {
                    if (model) {
                        model.rotation.y += data.amount;
                    }
                } else if (data.command === 'autoRotate') {
                    controls.autoRotate = data.enabled;
                } else if (data.command === 'setView') {
                    setPresetView(data.view);
                } else if (data.command === 'reset') {
                    if (model) {
                        model.rotation.set(0, 0, 0);
                        animateCameraToPosition({ x: 0, y: -0.5, z: 3.8 });
                    }
                    selectedMuscleGroups.clear();
                    updateMuscleHighlights();
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

        {/* Preset View Buttons */}
        <View style={styles.viewButtonsContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setView('front')}
          >
            <Text style={styles.viewButtonText}>Front</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setView('back')}
          >
            <Text style={styles.viewButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setView('left')}
          >
            <Text style={styles.viewButtonText}>Left</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setView('right')}
          >
            <Text style={styles.viewButtonText}>Right</Text>
          </TouchableOpacity>
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
  webviewContainer: {
    height: 520,
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
  viewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
