// ExerciseDetailScreen - Fully Responsive Mobile Version
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { WorkoutStorageService } from '../services/workoutStorage';
import { useAuth } from '../context/AuthContext';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;
const isMediumScreen = screenWidth >= 400 && screenWidth < 600;

export default function ExerciseDetailScreen({ navigation, route }) {

  const { exercise, fromWorkout } = route?.params || {};
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [exercise, user]);

  const loadProgressData = async () => {
    if (!exercise?.name) return;

    try {
      setLoading(true);
      const userId = user?.email || 'guest';
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

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: Colors.background,
    }}>
      {/* Responsive Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: getResponsiveSpacing(1),
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
        minHeight: getResponsiveSize(60, 70, 80),
      }}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
          style={{
            marginRight: getResponsiveSpacing(0.5),
            padding: getResponsiveSpacing(0.5),
            minWidth: getResponsiveSize(40, 45, 50),
            minHeight: getResponsiveSize(40, 45, 50),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: getResponsiveSize(20, 22, 24),
            color: Colors.primary
          }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: getResponsiveFontSize(Typography.fontSize.lg),
            fontWeight: 'bold',
            color: Colors.text,
            numberOfLines: 1,
          }}>
            {exercise?.name || "Exercise Detail"}
          </Text>
          <Text style={{
            fontSize: getResponsiveFontSize(Typography.fontSize.sm),
            color: Colors.textSecondary,
          }}>
            Exercise Information
          </Text>
        </View>
      </View>

      {/* Responsive Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: getResponsiveSpacing(2),
        }}
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
            {exercise?.name || 'NO NAME'}
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
            backgroundColor: getDifficultyColor(exercise?.difficulty) + '20',
            paddingHorizontal: getResponsiveSpacing(0.75),
            paddingVertical: getResponsiveSpacing(0.5),
            borderRadius: BorderRadius.md,
            minHeight: getResponsiveSize(36, 40, 44),
            justifyContent: 'center',
          }}>
            <Text style={{
              fontSize: getResponsiveFontSize(Typography.fontSize.md),
              color: getDifficultyColor(exercise?.difficulty),
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              {exercise?.difficulty || 'Unknown'}
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
      </ScrollView>
    </SafeAreaView>
  );
}