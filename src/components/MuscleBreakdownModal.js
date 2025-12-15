import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import WebView from 'react-native-webview';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const MODEL_REMOTE_URL = 'https://raw.githubusercontent.com/Lucagamerbest/AI-Gym-Trainer/main/assets/models/human.glb';

// Get color for muscle based on percentage
const getMuscleColor = (percentage) => {
  if (percentage >= 40) return '#4ADE80'; // Bright green
  if (percentage >= 25) return '#86EFAC'; // Light green
  if (percentage >= 15) return '#BBF7D0'; // Pale green
  return '#D1FAE5'; // Very light green
};

export default function MuscleBreakdownModal({
  visible,
  onClose,
  muscles = [],
  secondaryMuscles = [],
  secondaryTotalPercentage = 0,
  muscleIds = [],
  totalSets = 0
}) {
  const frontWebViewRef = useRef(null);
  const backWebViewRef = useRef(null);
  const [isExpoGo, setIsExpoGo] = useState(true);
  const [modelUri, setModelUri] = useState(null);
  const [showSecondary, setShowSecondary] = useState(false);

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
    const cameraZ = viewType === 'front' ? 4.8 : -4.8;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; background-color: #1a1a1a; }
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
            scene.background = new THREE.Color(0x1a1a1a);

            camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, -1.2, ${cameraZ});
            camera.lookAt(0, -1.2, 0);

            const canvas = document.getElementById('canvas');
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);

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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Muscles Worked</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          {/* 3D Models - Front and Back Views */}
          <View style={styles.modelsRow}>
            {/* Front View */}
            <View style={styles.modelContainer}>
              {modelUri && visible && (
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
              {modelUri && visible && (
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

          {/* Muscle Breakdown List */}
          <ScrollView style={styles.muscleList} showsVerticalScrollIndicator={false}>
            {muscles.length === 0 && secondaryMuscles.length === 0 ? (
              <Text style={styles.emptyText}>Log your first set to see muscles tracked!</Text>
            ) : (
              <>
                {/* Primary Muscles */}
                {muscles.map((muscle, index) => (
                  <View key={muscle.id} style={styles.muscleItem}>
                    {/* Muscle Header */}
                    <View style={styles.muscleHeader}>
                      <Text style={styles.muscleName}>{muscle.name.toUpperCase()}</Text>
                      <View style={styles.percentageContainer}>
                        <Text style={styles.percentageText}>{muscle.percentage}%</Text>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${muscle.percentage}%`,
                                backgroundColor: getMuscleColor(muscle.percentage)
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Exercise List */}
                    {muscle.exercises.map((exercise, exIndex) => (
                      <View key={exIndex} style={styles.exerciseItem}>
                        <Text style={styles.exerciseBullet}>-</Text>
                        <Text style={styles.exerciseName}>
                          {exercise.name}
                        </Text>
                        <Text style={styles.exerciseSets}>
                          ({Number.isInteger(exercise.sets) ? exercise.sets : exercise.sets.toFixed(1)} sets)
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}

                {/* Secondary Muscles Dropdown */}
                {secondaryMuscles.length > 0 && (
                  <View style={styles.secondarySection}>
                    <TouchableOpacity
                      style={styles.secondaryHeader}
                      onPress={() => setShowSecondary(!showSecondary)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.secondaryHeaderLeft}>
                        <Text style={styles.secondaryHeaderText}>Secondary Muscles</Text>
                        <Text style={styles.secondaryPercentage}>({secondaryTotalPercentage}%)</Text>
                      </View>
                      <Text style={styles.secondaryArrow}>{showSecondary ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {showSecondary && (
                      <View style={styles.secondaryContent}>
                        {secondaryMuscles.map((muscle, index) => (
                          <View key={muscle.id} style={styles.secondaryMuscleItem}>
                            <View style={styles.muscleHeader}>
                              <Text style={styles.secondaryMuscleName}>{muscle.name.toUpperCase()}</Text>
                              <View style={styles.percentageContainer}>
                                <Text style={styles.secondaryPercentageText}>{muscle.percentage}%</Text>
                                <View style={styles.progressBarContainerSmall}>
                                  <View
                                    style={[
                                      styles.progressBar,
                                      {
                                        width: `${muscle.percentage}%`,
                                        backgroundColor: '#9CA3AF'
                                      }
                                    ]}
                                  />
                                </View>
                              </View>
                            </View>

                            {/* Exercise List for Secondary */}
                            {muscle.exercises.map((exercise, exIndex) => (
                              <View key={exIndex} style={styles.exerciseItem}>
                                <Text style={styles.exerciseBullet}>-</Text>
                                <Text style={styles.secondaryExerciseName}>
                                  {exercise.name}
                                </Text>
                                <Text style={styles.exerciseSets}>
                                  ({Number.isInteger(exercise.sets) ? exercise.sets : exercise.sets.toFixed(1)} sets)
                                </Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {muscles.length} muscle group{muscles.length !== 1 ? 's' : ''} targeted - {Number.isInteger(totalSets) ? totalSets : totalSets.toFixed(1)} effective sets
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  modelContainer: {
    flex: 1,
    height: 180,
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  viewLabel: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  muscleList: {
    maxHeight: 300,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
    padding: Spacing.lg,
  },
  muscleItem: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  muscleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  muscleName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: '#4ADE80',
    width: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.sm,
    marginTop: 4,
  },
  exerciseBullet: {
    color: Colors.textMuted,
    marginRight: 6,
  },
  exerciseName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  secondaryExercise: {
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  exerciseSets: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  summary: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  // Secondary muscles dropdown styles
  secondarySection: {
    marginTop: Spacing.sm,
  },
  secondaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  secondaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryHeaderText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  secondaryPercentage: {
    fontSize: Typography.fontSize.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  secondaryArrow: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  secondaryContent: {
    marginTop: Spacing.sm,
  },
  secondaryMuscleItem: {
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#9CA3AF',
  },
  secondaryMuscleName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    flex: 1,
  },
  secondaryPercentageText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
    color: '#9CA3AF',
    width: 35,
    textAlign: 'right',
  },
  progressBarContainerSmall: {
    width: 50,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  secondaryExerciseName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    flex: 1,
    fontStyle: 'italic',
  },
});
