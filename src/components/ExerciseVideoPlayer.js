/**
 * ExerciseVideoPlayer - Shows exercise demonstration images with video placeholder
 *
 * Features:
 * - Swipeable image/video carousel
 * - First slide: Exercise demonstration image
 * - Second slide: Placeholder for future video
 * - Pagination dots indicator
 * - Video playback with looping (using expo-video) - ready for future videos
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Swipeable carousel showing image on first slide and video placeholder on second
 */
function SwipeableImageVideoCarousel({ fallbackImage, exerciseName, style }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  // Calculate content width based on container (with padding)
  const contentWidth = screenWidth - (Spacing.lg * 2);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / contentWidth);
    setActiveSlide(slideIndex);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Swipeable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        decelerationRate="fast"
        snapToInterval={contentWidth}
        snapToAlignment="start"
      >
        {/* Slide 1: Exercise Image */}
        <View style={[styles.slide, { width: contentWidth }]}>
          {fallbackImage ? (
            <Image
              source={{ uri: fallbackImage }}
              style={styles.slideImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageIcon}>🏋️</Text>
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Slide 2: Video Placeholder */}
        <View style={[styles.slide, { width: contentWidth }]}>
          <View style={styles.videoPlaceholder}>
            <View style={styles.placeholderIconContainer}>
              <Text style={styles.placeholderIcon}>🎬</Text>
            </View>
            <Text style={styles.placeholderTitle}>Video Coming Soon</Text>
            <Text style={styles.placeholderSubtitle}>
              Demonstration video will appear here
            </Text>
            <View style={styles.placeholderDivider} />
            <Text style={styles.placeholderHint}>
              Swipe left to return to image
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        <View style={[styles.paginationDot, activeSlide === 0 && styles.paginationDotActive]}>
          <Text style={[styles.paginationLabel, activeSlide === 0 && styles.paginationLabelActive]}>
            Image
          </Text>
        </View>
        <View style={[styles.paginationDot, activeSlide === 1 && styles.paginationDotActive]}>
          <Text style={[styles.paginationLabel, activeSlide === 1 && styles.paginationLabelActive]}>
            Video
          </Text>
        </View>
      </View>

    </View>
  );
}

export default function ExerciseVideoPlayer({
  exerciseName,
  equipment,
  muscleGroup,
  fallbackImage,
  style,
}) {
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGender, setSelectedGender] = useState('male');
  const [selectedAngle, setSelectedAngle] = useState('front');
  const [isPlaying, setIsPlaying] = useState(true);

  // Get current video URL
  const getCurrentVideoUrl = () => {
    if (!videos) return null;
    return videos[selectedGender]?.[selectedAngle];
  };

  const videoUrl = getCurrentVideoUrl();

  // Create video player with expo-video
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    player.muted = true;
    if (isPlaying) {
      player.play();
    }
  });

  // Update player when URL changes
  useEffect(() => {
    const updateVideo = async () => {
      if (player && videoUrl) {
        await player.replaceAsync(videoUrl);
        if (isPlaying) {
          player.play();
        }
      }
    };
    updateVideo();
  }, [videoUrl]);

  // Update play state
  useEffect(() => {
    if (player) {
      if (isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isPlaying, player]);

  useEffect(() => {
    loadVideo();
  }, [exerciseName, equipment, muscleGroup]);

  const loadVideo = async () => {
    // Videos coming soon - using images for now
    // TODO: Enable when self-hosted videos are available
    setLoading(false);
    setError('Videos coming soon');
  };

  const hasMultipleAngles = () => {
    if (!videos) return false;
    const gender = videos[selectedGender];
    return gender?.front && gender?.side;
  };

  const hasMultipleGenders = () => {
    if (!videos) return false;
    const hasMale = videos.male?.front || videos.male?.side;
    const hasFemale = videos.female?.front || videos.female?.side;
    return hasMale && hasFemale;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }

  // Show swipeable image/video placeholder carousel
  if (!videoUrl || error) {
    return (
      <SwipeableImageVideoCarousel
        fallbackImage={fallbackImage}
        exerciseName={exerciseName}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Video Player */}
      <TouchableOpacity activeOpacity={0.9} onPress={togglePlayPause}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <View style={styles.pauseOverlay}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Angle Toggle */}
        {hasMultipleAngles() && (
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedAngle === 'front' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedAngle('front')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedAngle === 'front' && styles.toggleButtonTextActive,
                ]}
              >
                Front
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedAngle === 'side' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedAngle('side')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedAngle === 'side' && styles.toggleButtonTextActive,
                ]}
              >
                Side
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Gender Toggle */}
        {hasMultipleGenders() && (
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedGender === 'male' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedGender('male')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedGender === 'male' && styles.toggleButtonTextActive,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedGender === 'female' && styles.toggleButtonActive,
              ]}
              onPress={() => setSelectedGender('female')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedGender === 'female' && styles.toggleButtonTextActive,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  fallbackImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.background,
  },
  errorBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  errorBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  setupBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary + '90',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  setupBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.background,
    textAlign: 'center',
    fontWeight: '600',
  },
  noVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  noVideoIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  noVideoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    color: Colors.primary,
    marginLeft: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: Colors.background,
  },
  // Carousel styles
  carousel: {
    width: '100%',
  },
  carouselContent: {
    // No extra padding - slides manage their own width
  },
  slide: {
    aspectRatio: 4 / 3,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  noImageIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  noImageText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  videoPlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  placeholderIcon: {
    fontSize: 40,
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  placeholderSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  placeholderDivider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  placeholderHint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  paginationDot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
  },
  paginationLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  paginationLabelActive: {
    color: Colors.background,
  },
});
