/**
 * 3D Model HTML Generator
 * Generates the HTML content for the 3D muscle model WebView
 * Used by both PreloadService (for caching) and Model3DWebViewScreen
 */

const MODEL_REMOTE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

// CDN sources for Three.js and loaders
const CDN_SOURCES = {
  three: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  gltfLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
  orbitControls: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
  dracoLoader: 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js',
  dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/',
};

/**
 * Generate the full 3D model HTML with shader-based muscle highlighting
 * This is the complex version used for muscle selection
 */
export function generateModel3DHTML() {
  return `
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

    <script src="${CDN_SOURCES.three}" onerror="scriptLoadError('THREE.js')"></script>
    <script src="${CDN_SOURCES.gltfLoader}" onerror="scriptLoadError('GLTFLoader')"></script>
    <script src="${CDN_SOURCES.dracoLoader}" onerror="scriptLoadError('DRACOLoader')"></script>
    <script src="${CDN_SOURCES.orbitControls}" onerror="scriptLoadError('OrbitControls')"></script>

    <script>
        try {
            function scriptLoadError(scriptName) {
                document.getElementById('loading').innerHTML = 'Error: Failed to load ' + scriptName;
                document.getElementById('loading').style.color = 'red';
            }

        let scene, camera, renderer, model, controls;
        let selectedMuscleGroups = new Set();
        let bodyMeshMaterial = null;
        let isAnimating = false;
        let currentView = 'front';

        const GRAY_COLOR = new THREE.Color(0x808080);
        const SELECTED_COLOR = new THREE.Color(0x4ADE80);

        const CAMERA_POSITION = { x: 0, y: -1.2, z: 4.8 };
        const CAMERA_TARGET = { x: 0, y: -1.2, z: 0 };

        function getMuscleGroupFromPosition(position) {
            const x = position.x;
            const y = position.y;
            const z = position.z;

            // SHOULDERS
            if (y >= -0.5 && y < -0.1 && Math.abs(x) >= 0.25 && Math.abs(x) < 0.55 && z > -0.1) {
                return 'shoulders';
            }
            if (y >= -0.4 && y < -0.15 && z > 0.05 && Math.abs(x) >= 0.15 && Math.abs(x) < 0.35) {
                return 'shoulders';
            }
            if (y >= -0.5 && y < -0.1 && Math.abs(x) >= 0.3 && Math.abs(x) < 0.55 && z >= -0.25 && z <= -0.05) {
                return 'shoulders';
            }
            if (y >= -0.5 && y < 0.05 && z < -0.05 && Math.abs(x) < 0.25) {
                return 'shoulders';
            }

            // CHEST
            if (y >= -0.55 && y < -0.15 && z > 0.08 && Math.abs(x) < 0.28) {
                return 'chest';
            }

            // ABS
            if (y >= -1.0 && y < -0.55 && z > 0.05 && Math.abs(x) < 0.35) {
                return 'abs';
            }

            // BACK
            if (y >= -0.88 && y < -0.5 && z < -0.13 && Math.abs(x) < 0.4) {
                return 'back';
            }
            if (y >= -1.0 && y < -0.5 && z >= -0.05 && z <= 0.08 && Math.abs(x) >= 0.3 && Math.abs(x) < 0.45) {
                return 'back';
            }

            // BICEPS
            if (y >= -1.0 && y < -0.35 && Math.abs(x) >= 0.4 && Math.abs(x) < 0.85 && z > -0.04) {
                return 'biceps';
            }

            // TRICEPS
            if (y >= -0.85 && y < -0.4 && Math.abs(x) >= 0.45 && Math.abs(x) < 0.7 && z <= -0.15) {
                return 'triceps';
            }

            // FOREARMS
            if (y >= -0.59 && y < -0.36 && z >= -0.21 && z <= 0.14 && Math.abs(x) >= 1.0 && Math.abs(x) < 1.55) {
                return 'forearms';
            }

            // GLUTES
            if (y >= -1.35 && y < -1.0 && z < -0.05 && Math.abs(x) < 0.52) {
                return 'glutes';
            }

            // QUADS
            if (y >= -1.85 && y < -1.2 && z >= -0.05 && Math.abs(x) < 0.52) {
                return 'quads';
            }

            // HAMSTRINGS
            if (y >= -1.85 && y < -1.35 && z < -0.05 && Math.abs(x) < 0.52) {
                return 'hamstrings';
            }

            // CALVES
            if (y >= -2.3 && y < -1.85 && Math.abs(x) < 0.52) {
                return 'calves';
            }

            return null;
        }

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
                uniform float selectedMuscles[11];
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

                    // CHEST (0)
                    if (selectedMuscles[0] > 0.5 && y >= -0.55 && y < -0.15 && z > 0.08 && abs(x) < 0.28) {
                        isSelected = true;
                    }

                    // ABS (1)
                    if (selectedMuscles[1] > 0.5 && y >= -1.0 && y < -0.55 && z > 0.05 && abs(x) < 0.35) {
                        isSelected = true;
                    }

                    // SHOULDERS (2)
                    if (selectedMuscles[2] > 0.5) {
                        if ((y >= -0.5 && y < -0.1 && abs(x) >= 0.25 && abs(x) < 0.55 && z > -0.1) ||
                            (y >= -0.4 && y < -0.15 && z > 0.05 && abs(x) >= 0.15 && abs(x) < 0.35) ||
                            (y >= -0.5 && y < -0.1 && abs(x) >= 0.3 && abs(x) < 0.55 && z >= -0.25 && z <= -0.05) ||
                            (y >= -0.5 && y < 0.05 && z < -0.05 && abs(x) < 0.25)) {
                            isSelected = true;
                        }
                    }

                    // BACK (3)
                    if (selectedMuscles[3] > 0.5) {
                        if ((y >= -0.88 && y < -0.5 && z < -0.13 && abs(x) < 0.4) ||
                            (y >= -1.0 && y < -0.5 && z >= -0.05 && z <= 0.08 && abs(x) >= 0.3 && abs(x) < 0.45)) {
                            isSelected = true;
                        }
                    }

                    // BICEPS (4)
                    if (selectedMuscles[4] > 0.5 && y >= -1.0 && y < -0.35 && abs(x) >= 0.4 && abs(x) < 0.85 && z > -0.04) {
                        isSelected = true;
                    }

                    // TRICEPS (5)
                    if (selectedMuscles[5] > 0.5 && y >= -0.85 && y < -0.4 && abs(x) >= 0.45 && abs(x) < 0.7 && z <= -0.15) {
                        isSelected = true;
                    }

                    // FOREARMS (6)
                    if (selectedMuscles[6] > 0.5 && y >= -0.59 && y < -0.36 && z >= -0.21 && z <= 0.14 && abs(x) >= 1.0 && abs(x) < 1.55) {
                        isSelected = true;
                    }

                    // GLUTES (7)
                    if (selectedMuscles[7] > 0.5 && y >= -1.35 && y < -1.0 && z < -0.05 && abs(x) < 0.52) {
                        isSelected = true;
                    }

                    // QUADS (8)
                    if (selectedMuscles[8] > 0.5 && y >= -1.85 && y < -1.2 && z >= -0.05 && abs(x) < 0.52) {
                        isSelected = true;
                    }

                    // HAMSTRINGS (9)
                    if (selectedMuscles[9] > 0.5 && y >= -1.85 && y < -1.35 && z < -0.05 && abs(x) < 0.52) {
                        isSelected = true;
                    }

                    // CALVES (10)
                    if (selectedMuscles[10] > 0.5 && y >= -2.3 && y < -1.85 && z < 0.0 && abs(x) < 0.52) {
                        isSelected = true;
                    }

                    if (isSelected) {
                        baseCol = selectedColor;
                    }

                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(vViewPosition);

                    vec3 ambient = ambientLightColor * baseCol;

                    vec3 lightDir = normalize(directionalLightDirection);
                    float diff = max(dot(normal, lightDir), 0.0);
                    vec3 diffuse = directionalLightColor * diff * baseCol;

                    vec3 halfDir = normalize(lightDir + viewDir);
                    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
                    vec3 specular = directionalLightColor * spec * 0.3;

                    vec3 finalColor = ambient + diffuse + specular;

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            \`;

            return new THREE.ShaderMaterial({
                uniforms: {
                    baseColor: { value: GRAY_COLOR },
                    selectedColor: { value: SELECTED_COLOR },
                    selectedMuscles: { value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
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
                'glutes': 7,
                'quads': 8,
                'hamstrings': 9,
                'calves': 10
            };

            const selectedArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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
            controls.enableRotate = true;
            controls.enablePan = false;
            controls.enableZoom = true;
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.minDistance = 4.5;
            controls.maxDistance = 8.0;
            controls.target.set(0, -1.2, 0);
            controls.minPolarAngle = Math.PI / 2;
            controls.maxPolarAngle = Math.PI / 2;

            loadModel();
            window.addEventListener('resize', onWindowResize, false);

            let lastTouchTime = 0;

            canvas.addEventListener('touchend', function(e) {
                e.preventDefault();
                lastTouchTime = Date.now();
                const touch = e.changedTouches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY });
            }, { passive: false });

            canvas.addEventListener('click', function(e) {
                if (Date.now() - lastTouchTime < 500) {
                    return;
                }
                onClick(e);
            }, false);

            animate();
        }

        function loadModel() {
            const loader = new THREE.GLTFLoader();

            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('${CDN_SOURCES.dracoDecoderPath}');
            loader.setDRACOLoader(dracoLoader);

            const modelPath = '${MODEL_REMOTE_URL}';

            loader.load(
                modelPath,
                function(gltf) {
                    model = gltf.scene;

                    bodyMeshMaterial = createMuscleShaderMaterial();

                    let meshCount = 0;
                    model.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;

                            if (child.name.toLowerCase().includes('eye')) {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: GRAY_COLOR,
                                    roughness: 0.7,
                                    metalness: 0.1,
                                });
                            } else {
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
                    const allGroups = ['chest', 'abs', 'shoulders', 'back', 'biceps', 'triceps', 'forearms', 'glutes', 'quads', 'hamstrings', 'calves', 'cardio'];

                    if (data.selected) {
                        selectedMuscleGroups.clear();
                        allGroups.forEach(group => selectedMuscleGroups.add(group));
                    } else {
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
                    selectedMuscleGroups.delete(data.muscle);

                    updateMuscleHighlights();

                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'muscleGroupToggled',
                            selectedGroups: Array.from(selectedMuscleGroups)
                        }));
                    }
                } else if (data.command === 'selectMuscle') {
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
}

export default generateModel3DHTML;
