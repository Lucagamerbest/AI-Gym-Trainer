import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useAICoach } from '../context/AICoachContext';
import { WorkoutStorageService } from '../services/workoutStorage';
import { loadUserProfile } from '../services/userProfileAssessment';

// Conditionally import Google Sign-In (not available in Expo Go)
let GoogleSignin = null;
let statusCodes = null;
let isGoogleSignInAvailable = false;

try {
  const googleSignIn = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignIn.GoogleSignin;
  statusCodes = googleSignIn.statusCodes;

  // Configure Google Sign-In once when module loads
  GoogleSignin.configure({
    // Web client ID (not Android client ID!) - required for getting idToken
    webClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
    offlineAccess: true,
  });
  isGoogleSignInAvailable = true;
} catch (e) {
  console.log('Google Sign-In not available (Expo Go mode)');
}

export default function ProfileScreen({ navigation }) {
  const { user, signIn, signInWithGoogle, signOut } = useAuth();
  const { coachName } = useAICoach();
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Load user stats when component mounts or user changes
  useEffect(() => {
    loadUserStats();
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const profile = await loadUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const userId = user?.uid || 'guest';
      const stats = await WorkoutStorageService.getUserStats(userId);
      setUserStats(stats);
    } catch (error) {
    }
  };

  // Native Google Sign-In handler
  const handleNativeGoogleSignIn = async () => {
    if (!isGoogleSignInAvailable) {
      Alert.alert('Not Available', 'Google Sign-In is not available in Expo Go. Please use email sign-in or build a development version.');
      return;
    }

    try {
      setIsLoading(true);

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token
      const idToken = userInfo?.data?.idToken;

      if (idToken) {
        // Sign in with Firebase Auth using Google credential
        const result = await signInWithGoogle({ idToken });

        if (result.success) {
          Alert.alert('Success', 'Signed in with Google!');
        } else {
          Alert.alert('Sign In Failed', result.error || 'Please try again');
        }
      } else {
        Alert.alert('Sign In Failed', 'Failed to get Google credentials');
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in flow - do nothing
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Please Wait', 'Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available on this device');
      } else {
        Alert.alert('Sign In Error', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Profile"
      subtitle="Your fitness journey"
      navigation={navigation}
      showBack={false}
      showHome={false}
      screenName="ProfileScreen"
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={50} color={Colors.primary} />
          )}
        </View>
        <Text style={styles.userName}>{user?.displayName || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Not signed in'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {(user?.provider === 'google.com' || user?.provider === 'apple.com' || user?.provider === 'password' || user?.subscriptionType === 'premium') && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginRight: 4 }} />
          )}
          <Text style={styles.userStatus}>
            {user?.provider === 'google.com' ? 'Google Account' :
             user?.provider === 'apple.com' ? 'Apple Account' :
             user?.provider === 'password' ? 'Regular Account' :
             user?.subscriptionType === 'premium' ? 'Premium Account' :
             'Guest Account'}
          </Text>
        </View>
      </View>

      {!user || user.provider === 'guest' ? (
        <>
          <StyledButton
            title="Sign in with Google"
            icon="G"
            size="lg"
            variant="primary"
            fullWidth
            onPress={handleNativeGoogleSignIn}
            disabled={isLoading}
            style={styles.googleButton}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Signing in with Google...</Text>
            </View>
          )}
        </>
      ) : (
        <StyledCard variant="elevated" style={styles.accountCard}>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Signed in as</Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
            {user.provider === 'google.com' && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerIcon}>G</Text>
                <Text style={styles.providerText}>Google Account</Text>
              </View>
            )}
            {user.provider === 'password' && (
              <View style={styles.providerBadge}>
                <Ionicons name="mail" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.providerText}>Regular Account</Text>
              </View>
            )}
          </View>
        </StyledCard>
      )}

      <StyledCard variant="elevated" style={styles.aiStatusCard}>
        <View style={styles.statusContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="hardware-chip" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.statusLabel}>{coachName} Profile</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            {user && user.provider !== 'guest' && userProfile?.assessmentCompleted && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={{ marginRight: 6 }} />
            )}
            <Text style={styles.statusValue}>
              {user && user.provider !== 'guest'
                ? (userProfile?.assessmentCompleted
                  ? 'Profile Complete'
                  : 'Profile Incomplete')
                : 'Sign in to enable'}
            </Text>
          </View>
          <Text style={styles.statusHint}>
            {user && user.provider !== 'guest'
              ? (userProfile?.assessmentCompleted
                ? `${coachName} knows your goals, preferences, and limitations`
                : 'Complete your profile to get highly personalized coaching and recommendations')
              : 'Sign in to get personalized recommendations'}
          </Text>

          {user && user.provider !== 'guest' && (
            <View style={styles.profileButtonsContainer}>
              {!userProfile?.assessmentCompleted ? (
                <StyledButton
                  title="Complete Profile Assessment"
                  icon="clipboard"
                  size="md"
                  variant="primary"
                  fullWidth
                  onPress={() => navigation.navigate('AICoachAssessment')}
                  style={styles.assessmentButton}
                />
              ) : (
                <View style={styles.profileActionsRow}>
                  <StyledButton
                    title="View & Edit Profile"
                    icon="person"
                    size="md"
                    variant="secondary"
                    fullWidth
                    onPress={() => navigation.navigate('UserProfile')}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </StyledCard>

      <View style={styles.menuSection}>
        <StyledCard
          icon="scale-outline"
          title="Find My Maintenance"
          subtitle="Calculate your real TDEE"
          onPress={() => navigation.navigate('MaintenanceFinder')}
          style={styles.menuItem}
        />

        <StyledCard
          icon="settings"
          title="Settings"
          subtitle="Preferences & account"
          onPress={() => navigation.navigate('Settings')}
          style={styles.menuItem}
        />

        <StyledCard
          icon="help-circle"
          title="Help & Support"
          subtitle="FAQs and contact"
          onPress={() => {}}
          style={styles.menuItem}
        />

        {user && user.provider !== 'guest' && (
          <StyledCard
            icon="log-out"
            title="Sign Out"
            subtitle={`Signed in as ${user.email}`}
            onPress={async () => {
              await signOut();
              Alert.alert('Signed Out', 'You have been signed out successfully');
            }}
            style={styles.menuItem}
          />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.round,
  },
  userName: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    marginBottom: Spacing.xs,
  },
  userStatus: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  googleButton: {
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
  },
  accountCard: {
    marginBottom: Spacing.lg,
  },
  accountInfo: {
    alignItems: 'center',
  },
  accountLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  accountEmail: {
    color: Colors.text,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  providerIcon: {
    fontSize: Typography.fontSize.md,
    marginRight: Spacing.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  providerText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  aiStatusCard: {
    marginBottom: Spacing.lg,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  statusHint: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  profileButtonsContainer: {
    width: '100%',
    marginTop: Spacing.md,
  },
  assessmentButton: {
    marginTop: Spacing.sm,
  },
  profileActionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  viewProfileButton: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  updateProfileButton: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  aiButton: {
    marginBottom: Spacing.xl,
  },
  menuSection: {
    marginTop: Spacing.md,
  },
  menuItem: {
    marginBottom: Spacing.md,
  },
});