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
      subtitle={exercise?.displayName || exercise?.name || "Exercise Information"}
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

          {/* Exercise Image - Show if available */}
          {exercise?.image && (
            <TouchableOpacity
              style={{
                alignSelf: 'center',
                marginBottom: getResponsiveSpacing(1),
                borderRadius: BorderRadius.lg,
                overflow: 'hidden',
                width: '100%',
                alignItems: 'center',
              }}
              onPress={() => setShowFullScreenImage(true)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: exercise.image }}
                style={{
                  width: screenWidth * 0.85,
                  height: screenWidth * 0.85 * 0.75,
                  borderRadius: BorderRadius.lg,
                }}
                resizeMode="cover"
              />
              <Text style={{
                fontSize: getResponsiveFontSize(Typography.fontSize.xs),
                color: Colors.textMuted,
                marginTop: getResponsiveSpacing(0.5),
                fontStyle: 'italic',
              }}>
                Tap to view full size
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
            {exercise?.displayName || exercise?.name || 'NO NAME'}
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
              {getEquipmentIcon(exercise?.equipment)}
            </Text>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              color: Colors.primary,
              fontWeight: '600',
            }}>
              {exercise?.equipment || 'Unknown'}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: getResponsiveSpacing(0.5),
          }}>
            {exercise?.difficulty === 'Beginner' && (
              <View style={{
                width: 24,
                height: 24,
                backgroundColor: '#4CAF50',
                borderRadius: 12,
              }} />
            )}
            {exercise?.difficulty === 'Intermediate' && (
              <View style={{
                width: 24,
                height: 24,
                backgroundColor: '#FF9800',
                transform: [{ rotate: '45deg' }],
                borderRadius: 4,
              }} />
            )}
            {exercise?.difficulty === 'Advanced' && (
              <View style={{
                width: 24,
                height: 24,
                backgroundColor: '#F44336',
                borderRadius: 0,
              }} />
            )}
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
          {exercise?.instructions || 'No instructions available'}
        </Text>

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
            source={{ uri: exercise?.image }}
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