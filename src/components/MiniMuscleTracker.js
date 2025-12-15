import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import WebView from 'react-native-webview';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import MuscleBreakdownModal from './MuscleBreakdownModal';

const MODEL_REMOTE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

// Map exercise primaryMuscles to our 3D model muscle IDs
const muscleNameToModelId = {
  // Chest
  'chest': 'chest',
  'middle chest': 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',
  'pectorals': 'chest',
  'pecs': 'chest',

  // Back
  'back': 'back',
  'lats': 'back',
  'latissimus dorsi': 'back',
  'upper back': 'back',
  'lower back': 'back',
  'rhomboids': 'back',
  'traps': 'shoulders',
  'trapezius': 'shoulders',
  'erector spinae': 'back',
  'spinal erectors': 'back',

  // Shoulders
  'shoulders': 'shoulders',
  'deltoids': 'shoulders',
  'front deltoids': 'shoulders',
  'side deltoids': 'shoulders',
  'rear deltoids': 'shoulders',
  'anterior deltoid': 'shoulders',
  'lateral deltoid': 'shoulders',
  'posterior deltoid': 'shoulders',
  'delts': 'shoulders',

  // Arms
  'biceps': 'biceps',
  'biceps brachii': 'biceps',
  'triceps': 'triceps',
  'triceps brachii': 'triceps',
  'forearms': 'forearms',
  'forearm': 'forearms',
  'wrist flexors': 'forearms',
  'wrist extensors': 'forearms',
  'grip': 'forearms',

  // Core / Abs - expanded mappings
  'abs': 'abs',
  'abdominals': 'abs',
  'core': 'abs',
  'obliques': 'abs',
  'rectus abdominis': 'abs',
  'upper abs': 'abs',
  'lower abs': 'abs',
  'transverse abdominis': 'abs',
  'serratus': 'abs',
  'hip flexors': 'abs',

  // Legs - mapped to sub-regions
  'quadriceps': 'quads',
  'quads': 'quads',
  'glutes': 'glutes',
  'gluteus maximus': 'glutes',
  'gluteus medius': 'glutes',
  'glute medius': 'glutes',
  'hip abductors': 'glutes',
  'hamstrings': 'hamstrings',
  'calves': 'calves',
  'gastrocnemius': 'calves',
  'soleus': 'calves',
  'adductors': 'quads',
  'hip adductors': 'quads',

  // Cardio
  'cardiovascular system': 'cardio',
  'cardio': 'cardio',
  'heart': 'cardio',
};

// Helper to check if a set has been completed (has actual logged values)
function isSetCompleted(set) {
  if (!set) return false;

  // Check if it's marked as completed
  if (set.completed) return true;

  // For cardio exercises, check duration
  if (set.duration !== undefined) {
    return set.duration > 0;
  }

  // For regular/bodyweight exercises, check reps
  // reps can be a string or number, so convert to number
  const reps = typeof set.reps === 'string' ? parseInt(set.reps, 10) : set.reps;
  return reps > 0;
}

// Weights for primary vs secondary muscle contribution
const PRIMARY_WEIGHT = 1.0;
const SECONDARY_WEIGHT = 0.5;

// Extract unique muscles from exercises and count sets
// Primary muscles count as 1.0 sets, secondary muscles count as 0.5 sets
export function extractMusclesFromExercises(exercises, exerciseSets) {
  const muscleData = {};

  exercises.forEach((exercise, index) => {
    const primaryMuscles = exercise.primaryMuscles || [];
    const secondaryMuscles = exercise.secondaryMuscles || [];
    const sets = exerciseSets[index] || [];

    // Count only completed sets (sets with actual logged reps/duration)
    const completedSetCount = sets.filter(isSetCompleted).length;

    // Skip this exercise if no sets have been completed
    if (completedSetCount === 0) return;

    // Get UNIQUE model IDs for primary muscles (1.0 weight)
    const primaryModelIds = new Set();
    primaryMuscles.forEach(muscleName => {
      const normalizedName = muscleName.toLowerCase().trim();
      const modelId = muscleNameToModelId[normalizedName];
      if (modelId) {
        primaryModelIds.add(modelId);
      }
    });

    // Get UNIQUE model IDs for secondary muscles (0.5 weight)
    // Exclude any that are already primary (primary takes precedence)
    const secondaryModelIds = new Set();
    secondaryMuscles.forEach(muscleName => {
      const normalizedName = muscleName.toLowerCase().trim();
      const modelId = muscleNameToModelId[normalizedName];
      if (modelId && !primaryModelIds.has(modelId)) {
        secondaryModelIds.add(modelId);
      }
    });

    const exerciseName = exercise.displayName || exercise.name;

    // Add primary muscle sets (full weight)
    primaryModelIds.forEach(modelId => {
      if (!muscleData[modelId]) {
        muscleData[modelId] = {
          id: modelId,
          name: modelId.charAt(0).toUpperCase() + modelId.slice(1),
          sets: 0,
          exercises: []
        };
      }
      muscleData[modelId].sets += completedSetCount * PRIMARY_WEIGHT;

      // Add exercise if not already added
      const existingEx = muscleData[modelId].exercises.find(e => e.name === exerciseName);
      if (!existingEx) {
        muscleData[modelId].exercises.push({
          name: exerciseName,
          sets: completedSetCount,
          isPrimary: true
        });
      } else {
        existingEx.sets = completedSetCount;
      }
    });

    // Add secondary muscle sets (half weight)
    secondaryModelIds.forEach(modelId => {
      if (!muscleData[modelId]) {
        muscleData[modelId] = {
          id: modelId,
          name: modelId.charAt(0).toUpperCase() + modelId.slice(1),
          sets: 0,
          exercises: []
        };
      }
      muscleData[modelId].sets += completedSetCount * SECONDARY_WEIGHT;

      // Add exercise if not already added (mark as secondary)
      const existingEx = muscleData[modelId].exercises.find(e => e.name === exerciseName);
      if (!existingEx) {
        muscleData[modelId].exercises.push({
          name: exerciseName,
          sets: completedSetCount * SECONDARY_WEIGHT,
          isPrimary: false
        });
      } else if (!existingEx.isPrimary) {
        existingEx.sets = completedSetCount * SECONDARY_WEIGHT;
      }
    });
  });

  // Determine which muscles are "primary" (targeted by at least one exercise as primary)
  // vs "secondary only" (only hit as secondary muscle)
  Object.values(muscleData).forEach(muscle => {
    muscle.isPrimaryMuscle = muscle.exercises.some(ex => ex.isPrimary);
  });

  // Calculate percentages
  const totalSets = Object.values(muscleData).reduce((sum, m) => sum + m.sets, 0);
  Object.values(muscleData).forEach(muscle => {
    muscle.percentage = totalSets > 0 ? Math.round((muscle.sets / totalSets) * 100) : 0;
  });

  // Separate primary and secondary muscles
  const allMuscles = Object.values(muscleData);
  const primaryMuscles = allMuscles.filter(m => m.isPrimaryMuscle).sort((a, b) => b.percentage - a.percentage);
  const secondaryMuscles = allMuscles.filter(m => !m.isPrimaryMuscle).sort((a, b) => b.percentage - a.percentage);

  // Calculate total secondary percentage
  const secondaryTotalPercentage = secondaryMuscles.reduce((sum, m) => sum + m.percentage, 0);

  return {
    muscles: primaryMuscles,  // Only primary muscles in main list
    secondaryMuscles: secondaryMuscles,  // Secondary muscles separate
    muscleIds: primaryMuscles.map(m => m.id),  // Only highlight primary on 3D model
    totalSets,
    secondaryTotalPercentage
  };
}

export default function MiniMuscleTracker({ exercises = [], exerciseSets = {} }) {
  const frontWebViewRef = useRef(null);
  const backWebViewRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [isExpoGo, setIsExpoGo] = useState(true);
  const [modelUri, setModelUri] = useState(null);

  // Extract muscle data
  const { muscles, secondaryMuscles, muscleIds, totalSets, secondaryTotalPercentage } = extractMusclesFromExercises(exercises, exerciseSets);

  useEffect(() => {
    import('expo-constants').then((Constants) => {
      const expoGo = Constants.default.appOwnership === 'expo';
      setIsExpoGo(expoGo);

      if (expoGo) {
        setModelUri(MODEL_REMOTE_URL);
      } else {
        if (Platform.OS === 'android') {
          setModelUri('file:///android_asset/models/human.glb');
        } else {
          setModelUri(MODEL_REMOTE_URL);
        }
      }
    }).catch(() => {
      setModelUri(MODEL_REMOTE_URL);
    });
  }, []);

  // Don't render if no exercises
  if (exercises.length === 0) {
    return null;
  }

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

  // Build the selected muscles array for the shader
  const muscleIndexMap = {
    'chest': 0, 'abs': 1, 'shoulders': 2, 'back': 3,
    'biceps': 4, 'triceps': 5, 'forearms': 6,
    'glutes': 7, 'quads': 8, 'hamstrings': 9, 'calves': 10
  };

  const selectedMusclesArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  muscleIds.forEach(id => {
    if (muscleIndexMap[id] !== undefined) {
      selectedMusclesArray[muscleIndexMap[id]] = 1;
    }
  });

  // Generate HTML content for a given view (front or back)
  const generateHtmlContent = (viewType) => {
    // Camera position: front view looks from positive z, back view from negative z
    const cameraZ = viewType === 'front' ? 4.8 : -4.8;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; background-color: transparent; }
        #canvas { width: 100%; height: 100%; display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="${scriptSources.three}"></script>
    <script src="${scriptSources.gltfLoader}"></script>
    <script src="${scriptSources.dracoLoader}"></script>
    <script>
        const selectedMuscles = [${selectedMusclesArray.join(',')}];

        let scene, camera, renderer, model;
        const GRAY_COLOR = new THREE.Color(0x808080);
        const SELECTED_COLOR = new THREE.Color(0x4ADE80);

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
                    selectedMuscles: { value: selectedMuscles },
                    ambientLightColor: { value: new THREE.Color(0xffffff).multiplyScalar(0.6) },
                    directionalLightColor: { value: new THREE.Color(0xffffff).multiplyScalar(0.8) },
                    directionalLightDirection: { value: new THREE.Vector3(5, 5, 5).normalize() }
                },
                vertexShader,
                fragmentShader,
                lights: false
            });
        }

        function init() {
            if (typeof THREE === 'undefined') return;

            scene = new THREE.Scene();
            scene.background = null; // Transparent

            camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, -1.2, ${cameraZ});
            camera.lookAt(0, -1.2, 0);

            const canvas = document.getElementById('canvas');
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);

            loadModel();
            animate();
        }

        function loadModel() {
            const loader = new THREE.GLTFLoader();
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('${scriptSources.dracoDecoderPath}');
            loader.setDRACOLoader(dracoLoader);

            loader.load('${modelUri || MODEL_REMOTE_URL}', function(gltf) {
                model = gltf.scene;
                const bodyMeshMaterial = createMuscleShaderMaterial();

                model.traverse((child) => {
                    if (child.isMesh) {
                        if (child.name.toLowerCase().includes('eye')) {
                            child.material = new THREE.MeshStandardMaterial({ color: GRAY_COLOR, roughness: 0.7, metalness: 0.1 });
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
            });
        }

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
        } else {
            setTimeout(init, 50);
        }
    </script>
</body>
</html>
  `;
  };

  // Generate HTML for front and back views
  const frontHtmlContent = generateHtmlContent('front');
  const backHtmlContent = generateHtmlContent('back');

  // Get display text for muscles
  const muscleNames = muscles.slice(0, 3).map(m => m.name);
  const displayText = muscleNames.length > 0
    ? muscleNames.join(', ') + (muscles.length > 3 ? ` +${muscles.length - 3}` : '')
    : 'No muscles targeted';

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        {/* Dual 3D Models - Front and Back Views */}
        <View style={styles.modelsRow}>
          {/* Front View */}
          <View style={styles.modelContainer}>
            {modelUri && (
              <WebView
                ref={frontWebViewRef}
                source={{ html: frontHtmlContent }}
                style={styles.webview}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                mixedContentMode="always"
                originWhitelist={['*']}
              />
            )}
            <Text style={styles.viewLabel}>Front</Text>
          </View>

          {/* Back View */}
          <View style={styles.modelContainer}>
            {modelUri && (
              <WebView
                ref={backWebViewRef}
                source={{ html: backHtmlContent }}
                style={styles.webview}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                mixedContentMode="always"
                originWhitelist={['*']}
              />
            )}
            <Text style={styles.viewLabel}>Rear</Text>
          </View>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Text style={styles.muscleCount}>{muscles.length} muscle{muscles.length !== 1 ? 's' : ''} targeted</Text>
          <Text style={styles.muscleNames} numberOfLines={1}>{displayText}</Text>
        </View>

        {/* Expand indicator */}
        <Text style={styles.expandIcon}>▼</Text>
      </TouchableOpacity>

      {/* Breakdown Modal */}
      <MuscleBreakdownModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        muscles={muscles}
        secondaryMuscles={secondaryMuscles}
        secondaryTotalPercentage={secondaryTotalPercentage}
        muscleIds={muscleIds}
        totalSets={totalSets}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modelsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  modelContainer: {
    width: 55,
    height: 65,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  viewLabel: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  muscleCount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  muscleNames: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: Spacing.xs,
  },
});
