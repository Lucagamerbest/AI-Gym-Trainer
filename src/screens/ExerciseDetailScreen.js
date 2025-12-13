// ExerciseDetailScreen - Fully Responsive Mobile Version
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { CustomExerciseStorage } from '../services/customExerciseStorage';
import { useAuth } from '../context/AuthContext';
import AIHeaderButton from '../components/AIHeaderButton';
import ScreenLayout from '../components/ScreenLayout';
import ExerciseVideoPlayer from '../components/ExerciseVideoPlayer';
import { getVariantImage } from '../utils/exerciseImages';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;
const isMediumScreen = screenWidth >= 400 && screenWidth < 600;

export default function ExerciseDetailScreen({ navigation, route }) {

  const { exercise, fromWorkout } = route?.params || {};
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  // Get display name - use variant-specific name if available
  const getDisplayName = () => {
    if (exercise?.selectedVariant?.equipment && exercise?.name) {
      // Create variant-specific name like "Barbell Back Squat"
      return `${exercise.selectedVariant.equipment} ${exercise.name}`;
    }
    if (exercise?.selectedEquipment && exercise?.name) {
      return `${exercise.selectedEquipment} ${exercise.name}`;
    }
    return exercise?.displayName || exercise?.name || 'Exercise';
  };

  // Get equipment to display - prefer selected variant
  const getDisplayEquipment = () => {
    if (exercise?.selectedVariant?.equipment) {
      return exercise.selectedVariant.equipment;
    }
    if (exercise?.selectedEquipment) {
      return exercise.selectedEquipment;
    }
    // Fallback to first equipment if multiple
    const equipment = exercise?.equipment;
    if (equipment && equipment.includes(',')) {
      return equipment.split(',')[0].trim();
    }
    return equipment || 'Unknown';
  };

  // Get difficulty - prefer variant-specific difficulty
  const getDisplayDifficulty = () => {
    if (exercise?.selectedVariant?.difficulty) {
      return exercise.selectedVariant.difficulty;
    }
    return exercise?.difficulty || 'Intermediate';
  };

  // Get combined instructions - base + variant-specific adjustments
  const getDisplayInstructions = () => {
    let instructions = exercise?.instructions || '';

    // If we have variant-specific instruction adjustments, add them
    const variantInstructions = exercise?.selectedVariant?.instructions;
    if (variantInstructions) {
      const adjustments = [];

      if (variantInstructions.setupAdjustments?.length) {
        adjustments.push('Setup: ' + variantInstructions.setupAdjustments.join('. '));
      }
      if (variantInstructions.executionAdjustments?.length) {
        adjustments.push('Execution: ' + variantInstructions.executionAdjustments.join('. '));
      }

      if (adjustments.length > 0) {
        instructions = instructions + '\n\n' + getDisplayEquipment() + ' Tips:\n' + adjustments.join('\n');
      }
    }

    return instructions || 'No instructions available';
  };

  // Get exercise image - use getVariantImage to find correct image
  const getExerciseImage = () => {
    const exerciseName = exercise?.name;
    const equipment = getDisplayEquipment();

    console.log('\n🖼️ [ExerciseDetail] Image Lookup:');
    console.log(`   Exercise Name: "${exerciseName}"`);
    console.log(`   Display Name: "${getDisplayName()}"`);
    console.log(`   Equipment: "${equipment}"`);
    console.log(`   Selected Variant: ${JSON.stringify(exercise?.selectedVariant?.equipment || 'None')}`);
    console.log(`   Selected Equipment: "${exercise?.selectedEquipment || 'None'}"`);
    console.log(`   Available Variants: ${JSON.stringify(exercise?.availableVariants || [])}`);

    // Try to get variant-specific image
    if (exerciseName && equipment) {
      const variantImage = getVariantImage(exerciseName, equipment);
      console.log(`   Looking up: getVariantImage("${exerciseName}", "${equipment}")`);
      console.log(`   Result: ${variantImage ? (typeof variantImage === 'string' ? variantImage : '[Local Image]') : 'null'}`);
      if (variantImage) {
        return variantImage;
      }
    }

    // Fall back to exercise.image if set
    if (exercise?.image) {
      console.log(`   Fallback to exercise.image: ${typeof exercise.image === 'string' ? exercise.image : '[Local Image]'}`);
      return exercise.image;
    }

    console.log(`   ❌ No image found`);
    return null;
  };

  useEffect(() => {
    loadProgressData();
  }, [exercise, user]);

  const loadProgressData = async () => {
    if (!exercise?.name) return;

    try {
      setLoading(true);
      const userId = user?.uid || 'guest';
      const progress = await WorkoutStorageService.getExerciseProgressByName(exercise.name, userId);
      setProgressData(progress);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getPersonalRecords = () => {
    if (!progressData || !progressData.records.length) return null;

    const records = progressData.records;
    const maxWeight = Math.max(...records.map(r => r.weight));
    const maxVolume = Math.max(...records.map(r => r.volume));
    const maxReps = Math.max(...records.map(r => r.reps));
    const totalSessions = records.length;

    return { maxWeight, maxVolume, maxReps, totalSessions };
  };

  const getRecentSessions = () => {
    if (!progressData || !progressData.records.length) return [];
    return progressData.records.slice(-3).reverse(); // Last 3 sessions, most recent first
  };


  // Responsive sizing functions
  const getResponsiveSize = (small, medium, large) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  const getResponsiveSpacing = (factor = 1) => {
    return isSmallScreen ? Spacing.sm * factor : Spacing.lg * factor;
  };

  const getResponsiveFontSize = (baseSize) => {
    const multiplier = isSmallScreen ? 0.85 : isMediumScreen ? 0.95 : 1;
    return baseSize * multiplier;
  };

  const getEquipmentIcon = (equipment) => {
    switch (equipment) {
      case 'Bodyweight': return '🤸‍♂️';
      case 'Dumbbells': return '🏋️‍♂️';
      case 'Barbell': return '🏋️';
      case 'Machine': return '⚙️';
      case 'Cable': return '🔗';
      case 'Cable Machine': return '🔗';
      default: return '💪';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#4CAF50';
      case 'Intermediate': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return Colors.primary;
    }
  };

  const handleDeleteExercise = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteExercise = async () => {
    try {
      const result = await CustomExerciseStorage.deleteCustomExercise(exercise.id);
      if (result.success) {
        setShowDeleteConfirmation(false);
        // Reset navigation stack with StartWorkout as previous screen
        setTimeout(() => {
          navigation.reset({
            index: 1,
            routes: [
              {
                name: 'StartWorkout'
              },
              {
                name: 'ExerciseList',
                params: {
                  selectedMuscleGroups: ['chest', 'back', 'legs', 'biceps', 'triceps', 'shoulders', 'abs'],
                  fromLibrary: true,
                  refresh: Date.now() // Force refresh
                }
              }
            ]
          });
        }, 100);
      } else {
        setShowDeleteConfirmation(false);
        setTimeout(() => {
          Alert.alert("Error", "Failed to delete the exercise. Please try again.");
        }, 100);
      }
    } catch (error) {
      setShowDeleteConfirmation(false);
      setTimeout(() => {
        Alert.alert("Error", "An unexpected error occurred while deleting the exercise.");
      }, 100);
    }
  };

  return (
    <ScreenLayout
      title="Exercise Detail"
      subtitle={getDisplayName()}
      navigation={navigation}
      showBack={true}
      scrollable={true}
      screenName="ExerciseDetailScreen"
      hideWorkoutIndicator={true}
      style={{ paddingHorizontal: 0 }}
    >
        <View style={{
          backgroundColor: Colors.surface,
          margin: getResponsiveSpacing(1),
          padding: getResponsiveSpacing(1),
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          minHeight: screenHeight * 0.6, // Ensure minimum content height
        }}>
          {/* Custom Exercise Badge */}
          {exercise?.isCustom && (
            <View style={{
              alignSelf: 'center',
              backgroundColor: Colors.primary + '20',
              paddingHorizontal: getResponsiveSpacing(0.75),
              paddingVertical: getResponsiveSpacing(0.25),
              borderRadius: BorderRadius.sm,
              marginBottom: getResponsiveSpacing(0.5),
              borderWidth: 1,
              borderColor: Colors.primary + '40',
            }}>
              <Text style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                color: Colors.primary,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                ⭐ CUSTOM EXERCISE
              </Text>
            </View>
          )}

          {/* Exercise Video Player - Swipeable image/video carousel */}
          <View style={{
            marginBottom: getResponsiveSpacing(1),
            borderRadius: BorderRadius.lg,
            overflow: 'hidden',
          }}>
            <ExerciseVideoPlayer
              exerciseName={getDisplayName()}
              equipment={getDisplayEquipment()}
              muscleGroup={exercise?.primaryMuscles?.[0] || exercise?.muscleGroup}
              fallbackImage={getExerciseImage()}
            />
          </View>

          {/* Static Image - Tap to view full size (if video player shows fallback) */}
          {getExerciseImage() && (
            <TouchableOpacity
              style={{
                alignSelf: 'center',
                marginBottom: getResponsiveSpacing(0.5),
              }}
              onPress={() => setShowFullScreenImage(true)}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                color: Colors.primary,
                fontStyle: 'italic',
                textDecorationLine: 'underline',
              }}>
                View static image full size
              </Text>
            </TouchableOpacity>
          )}

          {/* Exercise Name - Responsive Size */}
          <Text style={{
            fontSize: getResponsiveSize(20, 24, 28),
            fontWeight: 'bold',
            color: Colors.text,
            textAlign: 'center',
            marginBottom: getResponsiveSpacing(1),
            paddingHorizontal: getResponsiveSpacing(0.5),
            flexWrap: 'wrap',
          }}>
            {getDisplayName()}
          </Text>

        {/* Equipment and Difficulty - Responsive Layout */}
        <View style={{
          flexDirection: isSmallScreen ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: getResponsiveSpacing(1),
          gap: getResponsiveSpacing(0.5),
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.primary + '15',
            paddingHorizontal: getResponsiveSpacing(0.75),
            paddingVertical: getResponsiveSpacing(0.5),
            borderRadius: BorderRadius.md,
            minHeight: getResponsiveSize(36, 40, 44),
          }}>
            <Text style={{
              fontSize: getResponsiveSize(16, 18, 20),
              marginRight: getResponsiveSpacing(0.25)
            }}>
              {getEquipmentIcon(getDisplayEquipment())}
            </Text>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              color: Colors.primary,
              fontWeight: '600',
            }}>
              {getDisplayEquipment()}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: getResponsiveSpacing(0.5),
          }}>
            {(() => {
              const difficulty = getDisplayDifficulty()?.toLowerCase();
              if (difficulty === 'beginner') {
                return (
                  <View style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#4CAF50',
                    borderRadius: 12,
                  }} />
                );
              }
              if (difficulty === 'intermediate') {
                return (
                  <View style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#FF9800',
                    transform: [{ rotate: '45deg' }],
                    borderRadius: 4,
                  }} />
                );
              }
              if (difficulty === 'advanced') {
                return (
                  <View style={{
                    width: 24,
                    height: 24,
                    backgroundColor: '#F44336',
                    borderRadius: 0,
                  }} />
                );
              }
              return null;
            })()}
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.sm),
              color: Colors.textSecondary,
              textTransform: 'capitalize',
            }}>
              {getDisplayDifficulty()}
            </Text>
          </View>
        </View>

        {/* Instructions - Responsive */}
        <Text style={{
          fontSize: getResponsiveFontSize(Typography.fontSize.lg),
          fontWeight: 'bold',
          color: Colors.text,
          marginBottom: getResponsiveSpacing(0.5),
        }}>
          Instructions:
        </Text>

        <Text style={{
          fontSize: getResponsiveFontSize(Typography.fontSize.md),
          color: Colors.textSecondary,
          lineHeight: getResponsiveSize(18, 20, 22),
          marginBottom: getResponsiveSpacing(1.5),
          paddingHorizontal: getResponsiveSpacing(0.25),
        }}>
          {getDisplayInstructions()}
        </Text>

        {/* Variant-specific Pros/Cons if available */}
        {exercise?.selectedVariant?.pros && exercise?.selectedVariant?.pros.length > 0 && (
          <View style={{ marginBottom: getResponsiveSpacing(1) }}>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              fontWeight: 'bold',
              color: Colors.success,
              marginBottom: getResponsiveSpacing(0.25),
            }}>
              ✓ {getDisplayEquipment()} Advantages:
            </Text>
            {exercise.selectedVariant.pros.map((pro, index) => (
              <Text key={index} style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                color: Colors.textSecondary,
                marginLeft: getResponsiveSpacing(0.5),
              }}>
                • {pro}
              </Text>
            ))}
          </View>
        )}

        {exercise?.selectedVariant?.cons && exercise?.selectedVariant?.cons.length > 0 && (
          <View style={{ marginBottom: getResponsiveSpacing(1) }}>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              fontWeight: 'bold',
              color: Colors.warning,
              marginBottom: getResponsiveSpacing(0.25),
            }}>
              ⚠ Considerations:
            </Text>
            {exercise.selectedVariant.cons.map((con, index) => (
              <Text key={index} style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                color: Colors.textSecondary,
                marginLeft: getResponsiveSpacing(0.5),
              }}>
                • {con}
              </Text>
            ))}
          </View>
        )}

        {/* Muscle Groups - Responsive */}
        {exercise?.primaryMuscles && (
          <>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.lg),
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: getResponsiveSpacing(0.5),
            }}>
              Target Muscles:
            </Text>

            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              color: Colors.primary,
              fontWeight: '600',
              marginBottom: getResponsiveSpacing(0.5),
              paddingHorizontal: getResponsiveSpacing(0.25),
            }}>
              Primary: {exercise.primaryMuscles.join(', ')}
            </Text>

            {exercise?.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <Text style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                color: Colors.textSecondary,
                marginBottom: getResponsiveSpacing(1),
                paddingHorizontal: getResponsiveSpacing(0.25),
              }}>
                Secondary: {exercise.secondaryMuscles.join(', ')}
              </Text>
            )}
          </>
        )}

        {/* Exercise Progress Section */}
        {!loading && (
          <>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.lg),
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: getResponsiveSpacing(0.5),
              marginTop: getResponsiveSpacing(1),
            }}>
              Your Progress:
            </Text>

            {progressData && progressData.records.length > 0 ? (
              <>
                {/* Personal Records */}
                {(() => {
                  const records = getPersonalRecords();
                  return (
                    <View style={{
                      backgroundColor: Colors.surface,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      padding: getResponsiveSpacing(0.75),
                      marginBottom: getResponsiveSpacing(0.75),
                    }}>
                      <Text style={{
                        fontSize: getResponsiveFontSize(Typography.fontSize.md),
                        fontWeight: 'bold',
                        color: Colors.primary,
                        marginBottom: getResponsiveSpacing(0.5),
                      }}>
                        Personal Records
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                      }}>
                        <View style={{ alignItems: 'center', minWidth: getResponsiveSize(70, 80, 90) }}>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.lg),
                            fontWeight: 'bold',
                            color: Colors.text,
                          }}>
                            {records.maxWeight}
                          </Text>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                            color: Colors.textMuted,
                          }}>
                            Max Weight
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', minWidth: getResponsiveSize(70, 80, 90) }}>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.lg),
                            fontWeight: 'bold',
                            color: Colors.text,
                          }}>
                            {records.maxReps}
                          </Text>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                            color: Colors.textMuted,
                          }}>
                            Max Reps
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', minWidth: getResponsiveSize(70, 80, 90) }}>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.lg),
                            fontWeight: 'bold',
                            color: Colors.text,
                          }}>
                            {Math.round(records.maxVolume)}
                          </Text>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                            color: Colors.textMuted,
                          }}>
                            Max Volume
                          </Text>
                        </View>
                        <View style={{ alignItems: 'center', minWidth: getResponsiveSize(70, 80, 90) }}>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.lg),
                            fontWeight: 'bold',
                            color: Colors.text,
                          }}>
                            {records.totalSessions}
                          </Text>
                          <Text style={{
                            fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                            color: Colors.textMuted,
                          }}>
                            Sessions
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Recent Sessions */}
                {getRecentSessions().length > 0 && (
                  <View style={{
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: getResponsiveSpacing(0.75),
                    marginBottom: getResponsiveSpacing(0.75),
                  }}>
                    <Text style={{
                      fontSize: getResponsiveFontSize(Typography.fontSize.md),
                      fontWeight: 'bold',
                      color: Colors.primary,
                      marginBottom: getResponsiveSpacing(0.5),
                    }}>
                      Recent Sessions
                    </Text>
                    {getRecentSessions().map((session, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: getResponsiveSpacing(0.25),
                        borderBottomWidth: index < getRecentSessions().length - 1 ? 1 : 0,
                        borderBottomColor: Colors.border + '30',
                      }}>
                        <Text style={{
                          fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                          color: Colors.textMuted,
                          flex: 1,
                        }}>
                          {new Date(session.date).toLocaleDateString()}
                        </Text>
                        <Text style={{
                          fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                          color: Colors.text,
                          fontWeight: '600',
                          marginHorizontal: getResponsiveSpacing(0.5),
                        }}>
                          {session.weight} lbs × {session.reps}
                        </Text>
                        <Text style={{
                          fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                          color: Colors.textMuted,
                        }}>
                          {Math.round(session.volume)} vol
                        </Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={{
                        backgroundColor: Colors.primary + '20',
                        borderRadius: BorderRadius.sm,
                        padding: getResponsiveSpacing(0.5),
                        alignItems: 'center',
                        marginTop: getResponsiveSpacing(0.5),
                      }}
                      onPress={() => navigation.navigate('Progress')}
                    >
                      <Text style={{
                        fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                        color: Colors.primary,
                        fontWeight: '600',
                      }}>
                        View Full Progress
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={{
                backgroundColor: Colors.surface,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: Colors.border,
                padding: getResponsiveSpacing(1),
                alignItems: 'center',
                marginBottom: getResponsiveSpacing(0.75),
              }}>
                <Text style={{
                  fontSize: getResponsiveFontSize(Typography.fontSize.md),
                  color: Colors.textMuted,
                  textAlign: 'center',
                  marginBottom: getResponsiveSpacing(0.5),
                }}>
                  No progress data yet
                </Text>
                <Text style={{
                  fontSize: getResponsiveFontSize(Typography.fontSize.sm),
                  color: Colors.textSecondary,
                  textAlign: 'center',
                }}>
                  Complete a workout with this exercise to start tracking your progress!
                </Text>
              </View>
            )}
          </>
        )}

        {/* Responsive Action Buttons */}
        <View style={{
          flexDirection: isSmallScreen ? 'column' : 'row',
          gap: getResponsiveSpacing(0.5),
          marginTop: getResponsiveSpacing(1),
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.primary,
              padding: getResponsiveSpacing(0.75),
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              flex: isSmallScreen ? 0 : 1,
              minHeight: getResponsiveSize(44, 48, 52),
              justifyContent: 'center',
            }}
            onPress={() => {
                navigation.goBack();
            }}
          >
            <Text style={{
              color: Colors.background,
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              fontWeight: 'bold',
            }}>
              ← Back to Exercises
            </Text>
          </TouchableOpacity>

          {/* Delete Button - Only for Custom Exercises */}
          {exercise?.isCustom && (
            <TouchableOpacity
              style={{
                backgroundColor: '#DC3545',
                padding: getResponsiveSpacing(0.75),
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                flex: isSmallScreen ? 0 : 1,
                minHeight: getResponsiveSize(44, 48, 52),
                justifyContent: 'center',
              }}
              onPress={handleDeleteExercise}
            >
              <Text style={{
                color: Colors.background,
                fontSize: getResponsiveFontSize(Typography.fontSize.md),
                fontWeight: 'bold',
              }}>
                🗑️ Delete Exercise
              </Text>
            </TouchableOpacity>
          )}

          {/* Continue Workout Button */}
          {fromWorkout && (
            <TouchableOpacity
              style={{
                backgroundColor: '#FF6B35',
                padding: getResponsiveSpacing(0.75),
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                flex: isSmallScreen ? 0 : 1,
                minHeight: getResponsiveSize(44, 48, 52),
                justifyContent: 'center',
              }}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Text style={{
                color: Colors.background,
                fontSize: getResponsiveFontSize(Typography.fontSize.md),
                fontWeight: 'bold',
              }}>
                Continue Workout
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={showFullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreenImage(false)}
      >
        <View style={fullScreenModalStyles.overlay}>
          <TouchableOpacity
            style={fullScreenModalStyles.closeButton}
            onPress={() => setShowFullScreenImage(false)}
          >
            <Text style={fullScreenModalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Image
            source={typeof getExerciseImage() === 'string' ? { uri: getExerciseImage() } : getExerciseImage()}
            style={fullScreenModalStyles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Delete Custom Exercise?</Text>
            <Text style={modalStyles.confirmationText}>
              Are you sure you want to delete "{exercise?.name}"? This action cannot be undone.
            </Text>
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={modalStyles.modalButton}
                onPress={() => setShowDeleteConfirmation(false)}
              >
                <Text style={modalStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.deleteConfirmButton]}
                onPress={confirmDeleteExercise}
              >
                <Text style={modalStyles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

// Modal styles matching the app theme
const modalStyles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  confirmationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
  },
  modalButton: {
    backgroundColor: '#333',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  deleteConfirmButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  deleteConfirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
};

// Full screen image modal styles
const fullScreenModalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
};