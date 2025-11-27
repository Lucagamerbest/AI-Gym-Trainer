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
import SyncManager from '../services/backend/SyncManager';
import { loadUserProfile } from '../services/userProfileAssessment';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen({ navigation }) {
  const { user, signIn, signInWithGoogle, signOut } = useAuth();
  const { coachName } = useAICoach();
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, isSyncing: false, pendingOperations: 0 });
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load user stats when component mounts or user changes
  useEffect(() => {
    loadUserStats();
    loadSyncStatus();
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

  const loadSyncStatus = async () => {
    try {
      const status = SyncManager.getSyncStatus();
      setSyncStatus(status);

      const lastSync = await SyncManager.getLastSyncTime();
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleManualSync = async () => {
    if (!user?.uid) {
      Alert.alert('Sign In Required', 'Please sign in to sync your data');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await SyncManager.manualSync(user.uid);

      if (result.success) {
        await loadSyncStatus();
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.results.successful} items`
        );
      }
    } catch (error) {
      Alert.alert(
        'Sync Failed',
        error.message || 'Please check your internet connection and try again'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';

    const now = new Date();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Google Sign-In configuration with YOUR credentials
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
    iosClientId: '1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s.apps.googleusercontent.com',
    androidClientId: '1011295206743-ab4i5hlk0qoh9ojqm9itmp932peacv4q.apps.googleusercontent.com',
    webClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response);
    }
  }, [response]);

  const handleGoogleSignIn = async (response) => {
    try {
      setIsLoading(true);

      const { authentication } = response;

      if (authentication?.idToken) {
        // Sign in with Firebase Auth using Google credential
        const result = await signInWithGoogle({ idToken: authentication.idToken });

        if (result.success) {
          Alert.alert('Success', 'Signed in with Google!');
        } else {
          Alert.alert('Sign In Failed', result.error || 'Please try again');
        }
      } else {
        Alert.alert('Sign In Failed', 'Failed to get Google credentials');
      }
    } catch (error) {
      Alert.alert('Sign In Error', 'Something went wrong. Please try again.');
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
            onPress={() => {
              if (request) {
                promptAsync();
              } else {
                Alert.alert('Loading', 'Please wait while Google Sign-In loads...');
              }
            }}
            disabled={!request || isLoading}
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

      {user && user.provider !== 'guest' && (
        <StyledCard variant="elevated" style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cloud" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.syncTitle}>Cloud Sync</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: syncStatus.isOnline ? Colors.success + '20' : Colors.error + '20' }]}>
              <Text style={[styles.statusText, { color: syncStatus.isOnline ? Colors.success : Colors.error }]}>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.syncStats}>
            <View style={styles.syncStatItem}>
              <Text style={styles.syncStatLabel}>Last Sync</Text>
              <Text style={styles.syncStatValue}>{formatLastSyncTime()}</Text>
            </View>
            <View style={styles.syncStatItem}>
              <Text style={styles.syncStatLabel}>Pending</Text>
              <Text style={styles.syncStatValue}>{syncStatus.pendingOperations}</Text>
            </View>
          </View>

          <StyledButton
            title={isSyncing ? "Syncing..." : "Sync Now"}
            icon="sync"
            size="md"
            variant="secondary"
            fullWidth
            onPress={handleManualSync}
            disabled={isSyncing || !syncStatus.isOnline}
            style={styles.syncButton}
          />
        </StyledCard>
      )}

      <StyledCard
        icon="stats-chart"
        title="Progress & Goals"
        subtitle="Track your achievements and set new goals"
        onPress={() => navigation.navigate('ProgressHub')}
        style={styles.progressCard}
      />

      <View style={styles.menuSection}>
        <StyledCard
          icon="settings"
          title="Settings"
          subtitle="Preferences & account"
          onPress={() => navigation.navigate('Settings')}
          style={styles.menuItem}
        />

        <StyledCard
          icon="body"
          title="3D Muscle Model Viewer"
          subtitle="Interactive anatomy model with muscle detection"
          onPress={() => navigation.navigate('Model3DWebView')}
          style={styles.menuItem}
        />

        <StyledCard
          icon="help-circle"
          title="Help & Support"
          subtitle="FAQs and contact"
          onPress={() => {}}
          style={styles.menuItem}
        />

        <StyledCard
          icon="construct"
          title="Debug: View Stored Users"
          subtitle="See where user data is stored"
          onPress={() => navigation.navigate('Debug')}
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
  syncCard: {
    marginBottom: Spacing.lg,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  syncTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  syncStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  syncStatItem: {
    alignItems: 'center',
  },
  syncStatLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  syncStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  syncButton: {
    marginTop: Spacing.xs,
  },
  progressCard: {
    marginBottom: Spacing.xl,
  },
  menuSection: {
    marginTop: Spacing.md,
  },
  menuItem: {
    marginBottom: Spacing.md,
  },
});