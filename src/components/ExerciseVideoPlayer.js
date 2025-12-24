/**
 * ExerciseVideoPlayer - Shows exercise demonstration images and videos
 *
 * Features:
 * - Swipeable image/video carousel
 * - First slide: Exercise demonstration image
 * - Second slide: Exercise video (if available) or placeholder
 * - Pagination dots indicator
 * - Video playback with looping (using expo-video)
 * - Custom controls: play/pause, seek bar, fullscreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Dimensions, Modal, StatusBar, PanResponder, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { getExerciseVideo } from '../utils/exerciseVideos';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Format seconds to MM:SS
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Custom Video Controls Component
 */
function VideoControls({ player, onFullscreen, showFullscreenButton, isFullscreen }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Update time and playing state periodically
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      // Check playing state
      if (player.playing !== undefined) {
        setIsPlaying(player.playing);
      }
      // Update current time
      if (!isSeeking && player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
      }
      // Update duration
      if (player.duration !== undefined && player.duration > 0) {
        setDuration(player.duration);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [player, isSeeking]);

  const togglePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekComplete = (value) => {
    if (player) {
      player.currentTime = value;
      setCurrentTime(value);
    }
    setIsSeeking(false);
  };

  const handleSeekChange = (value) => {
    setCurrentTime(value);
  };

  return (
    <View style={[styles.controlsContainer, isFullscreen && styles.controlsContainerFullscreen]}>
      {/* Play/Pause Button */}
      <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
        <Text style={styles.controlIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>

      {/* Time Display */}
      <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

      {/* Seek Bar */}
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          onSlidingStart={handleSeekStart}
          onSlidingComplete={handleSeekComplete}
          onValueChange={handleSeekChange}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
      </View>

      {/* Duration */}
      <Text style={styles.timeText}>{formatTime(duration)}</Text>

      {/* Fullscreen Button */}
      {showFullscreenButton && (
        <TouchableOpacity onPress={onFullscreen} style={styles.controlButton}>
          <Text style={styles.controlIcon}>{isFullscreen ? '⊙' : '⛶'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Double-tap overlay component for seek (left/right) or fullscreen (center)
 * Also supports long-press to speed up video (2x) on left/right sides
 */
function DoubleTapOverlay({ player, position, onToggleFullscreen }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isHolding, setIsHolding] = useState(false);
  const lastTapRef = useRef(0);
  const holdTimerRef = useRef(null);
  const DOUBLE_TAP_DELAY = 300;
  const SEEK_SECONDS = 5;
  const HOLD_DELAY = 200; // Time before speed-up activates

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (position === 'center') {
        // Toggle fullscreen
        onToggleFullscreen?.();
      } else if (player) {
        const currentTime = player.currentTime || 0;
        const duration = player.duration || 0;

        if (position === 'left') {
          player.currentTime = Math.max(0, currentTime - SEEK_SECONDS);
          setFeedbackText('◀◀ 5s');
        } else {
          player.currentTime = Math.min(duration, currentTime + SEEK_SECONDS);
          setFeedbackText('5s ▶▶');
        }

        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 500);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handlePressIn = () => {
    // Only enable speed-up for left/right sides
    if (position === 'center') return;

    // Start a timer - if held long enough, activate speed-up
    holdTimerRef.current = setTimeout(() => {
      if (player) {
        player.playbackRate = 2.0;
        setIsHolding(true);
        setFeedbackText('2x ▶▶');
        setShowFeedback(true);
        // Haptic feedback when 2x speed activates
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, HOLD_DELAY);
  };

  const handlePressOut = () => {
    // Clear the hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Reset speed if we were holding
    if (isHolding && player) {
      player.playbackRate = 1.0;
      setIsHolding(false);
      setShowFeedback(false);
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'left': return styles.seekOverlayLeft;
      case 'right': return styles.seekOverlayRight;
      case 'center': return styles.seekOverlayCenter;
      default: return {};
    }
  };

  return (
    <TouchableOpacity
      style={[styles.seekOverlay, getPositionStyle()]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      delayLongPress={HOLD_DELAY}
    >
      {showFeedback && (
        <View style={[styles.seekFeedback, isHolding && styles.seekFeedbackHolding]}>
          <Text style={styles.seekFeedbackText}>{feedbackText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Video Slide Component - Shows video with custom controls and double-tap seek
 */
function VideoSlide({ videoSource, contentWidth }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const SWIPE_THRESHOLD = 100;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const openFullscreen = () => {
    console.log('🎬 OPEN fullscreen');
    translateY.setValue(0);
    opacity.setValue(1);
    setIsClosing(false);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    console.log('🎬 CLOSE fullscreen - starting animation');
    // Animate out then close
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('🎬 CLOSE animation complete - unmounting');
      // First unmount, then reset values after a delay
      setIsFullscreen(false);
      setIsClosing(false);
      // Reset values after Modal is fully gone
      setTimeout(() => {
        console.log('🎬 Resetting animation values');
        translateY.setValue(0);
        opacity.setValue(1);
      }, 50);
    });
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      closeFullscreen();
    } else {
      openFullscreen();
    }
  };

  // Pan responder for swipe down to exit fullscreen
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to vertical swipes (down)
      return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow downward movement
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
        // Fade out as we swipe
        const newOpacity = Math.max(0, 1 - (gestureState.dy / screenHeight));
        opacity.setValue(newOpacity);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > SWIPE_THRESHOLD) {
        // Swipe down detected - continue animation to close
        setIsClosing(true);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          console.log('🎬 SWIPE animation complete - unmounting');
          // Only update state after animation is fully complete
          setIsFullscreen(false);
          setIsClosing(false);
          // Reset values after Modal is fully gone
          setTimeout(() => {
            console.log('🎬 SWIPE Resetting animation values');
            translateY.setValue(0);
            opacity.setValue(1);
          }, 50);
        });
      } else {
        // Snap back
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  }), []);

  // Only show one VideoView at a time to prevent flash
  const showingFullscreen = isFullscreen || isClosing;

  return (
    <View style={[styles.slide, { width: contentWidth }]}>
      {/* Normal view - only show when NOT in fullscreen */}
      {!showingFullscreen && (
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit="contain"
            nativeControls={false}
          />

          {/* Double-tap overlays */}
          <DoubleTapOverlay player={player} position="left" onToggleFullscreen={toggleFullscreen} />
          <DoubleTapOverlay player={player} position="center" onToggleFullscreen={toggleFullscreen} />
          <DoubleTapOverlay player={player} position="right" onToggleFullscreen={toggleFullscreen} />

          {/* Controls at bottom */}
          <VideoControls player={player} onFullscreen={toggleFullscreen} showFullscreenButton={true} isFullscreen={false} />
        </View>
      )}

      {/* Placeholder when in fullscreen to maintain layout */}
      {showingFullscreen && (
        <View style={[styles.videoContainer, styles.videoPlaceholderFullscreen]}>
          <Text style={styles.fullscreenPlaceholderText}>Playing in fullscreen...</Text>
        </View>
      )}

      {/* Fullscreen Modal */}
      {showingFullscreen && (
        <Modal
          visible={true}
          animationType="none"
          statusBarTranslucent={true}
          onRequestClose={toggleFullscreen}
          transparent={true}
        >
          <Animated.View
            style={[
              styles.fullscreenContainer,
              {
                transform: [{ translateY }],
                opacity: opacity,
              }
            ]}
            {...panResponder.panHandlers}
          >
            <StatusBar hidden />
            <VideoView
              player={player}
              style={styles.fullscreenVideo}
              contentFit="contain"
              nativeControls={false}
            />

            {/* Double-tap overlays in fullscreen */}
            <DoubleTapOverlay player={player} position="left" onToggleFullscreen={toggleFullscreen} />
            <DoubleTapOverlay player={player} position="center" onToggleFullscreen={toggleFullscreen} />
            <DoubleTapOverlay player={player} position="right" onToggleFullscreen={toggleFullscreen} />

            {/* Controls */}
            <VideoControls player={player} onFullscreen={toggleFullscreen} showFullscreenButton={true} isFullscreen={true} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={toggleFullscreen}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Swipe indicator */}
            <View style={styles.swipeIndicator}>
              <View style={styles.swipeIndicatorBar} />
            </View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

/**
 * Swipeable carousel showing image on first slide and video on second
 */
function SwipeableImageVideoCarousel({ fallbackImage, exerciseName, videoSource, style }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  // Calculate content width based on container (with padding)
  const contentWidth = screenWidth - (Spacing.lg * 2);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / contentWidth);
    setActiveSlide(slideIndex);
  };

  const hasVideo = videoSource !== null;

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
              source={typeof fallbackImage === 'string' ? { uri: fallbackImage } : fallbackImage}
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

        {/* Slide 2: Video or Placeholder */}
        {hasVideo ? (
          <VideoSlide videoSource={videoSource} contentWidth={contentWidth} />
        ) : (
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
        )}
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
  variant,
  equipment,
  muscleGroup,
  fallbackImage,
  style,
}) {
  // Get local video for this exercise/variant
  const videoSource = getExerciseVideo(exerciseName, variant);

  // Always show the swipeable carousel (image + video or placeholder)
  return (
    <SwipeableImageVideoCarousel
      fallbackImage={fallbackImage}
      exerciseName={exerciseName}
      videoSource={videoSource}
      style={style}
    />
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
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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
    backgroundColor: Colors.surface,
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
  // Custom video controls styles
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  controlButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  // Double-tap seek overlay styles
  seekOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 40, // Leave space for controls
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekOverlayLeft: {
    left: 0,
    width: '30%',
  },
  seekOverlayCenter: {
    left: '30%',
    width: '40%',
  },
  seekOverlayRight: {
    right: 0,
    width: '30%',
  },
  seekFeedback: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  seekFeedbackHolding: {
    backgroundColor: Colors.primary,
  },
  seekFeedbackText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: 'bold',
  },
  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  controlsContainerFullscreen: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeIndicatorBar: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
  },
  videoPlaceholderFullscreen: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPlaceholderText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
});
