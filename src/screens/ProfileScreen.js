import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import StyledCard from '../components/StyledCard';
import StyledButton from '../components/StyledButton';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen({ navigation }) {
  const { user, signIn, signOut } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

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
      
      // Get the authentication response
      const { authentication } = response;
      
      if (authentication?.accessToken) {
        // Fetch user info using the access token
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          }
        );
        
        const userInfo = await userInfoResponse.json();
        
        // Save user data
        const userData = {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
        };
        
        const result = await signIn(userData);
        
        if (result.success) {
          Alert.alert('Success', 'Signed in with Google!');
        } else {
          Alert.alert('Sign In Failed', 'Please try again');
        }
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
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
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarIcon}>👤</Text>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'Not signed in'}</Text>
        <Text style={styles.userStatus}>
          {user?.provider === 'google' ? '✓ Google Account' : 
           user?.provider === 'apple' ? '✓ Apple Account' : 
           user?.provider === 'email' ? '✓ Email Account' :
           'Guest Account'}
        </Text>
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
            {user.provider === 'google' && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerIcon}>G</Text>
                <Text style={styles.providerText}>Google Account</Text>
              </View>
            )}
          </View>
        </StyledCard>
      )}

      <StyledCard variant="elevated" style={styles.aiStatusCard}>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>AI Profile Status</Text>
          <Text style={styles.statusValue}>
            {user && user.provider !== 'guest' ? 'Ready to personalize' : 'Sign in to enable'}
          </Text>
          <Text style={styles.statusHint}>
            {user && user.provider !== 'guest' 
              ? 'Your AI profile will adapt to your preferences'
              : 'Sign in to get personalized recommendations'}
          </Text>
        </View>
      </StyledCard>

      {user && user.provider !== 'guest' && (
        <StyledButton
          title="Get Started with AI"
          icon="🤖"
          size="lg"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('AIAssistant')}
          style={styles.aiButton}
        />
      )}

      <View style={styles.statsContainer}>
        <StyledCard style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </StyledCard>
        
        <StyledCard style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </StyledCard>
        
        <StyledCard style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </StyledCard>
      </View>

      <View style={styles.menuSection}>
        <StyledCard
          icon="⚙️"
          title="Settings"
          subtitle="Preferences & account"
          onPress={() => navigation.navigate('Settings')}
          style={styles.menuItem}
        />
        
        <StyledCard
          icon="📊"
          title="Progress & Goals"
          subtitle="Track your achievements"
          onPress={() => {}}
          style={styles.menuItem}
        />
        
        <StyledCard
          icon="📚"
          title="Help & Support"
          subtitle="FAQs and contact"
          onPress={() => {}}
          style={styles.menuItem}
        />
        
        <StyledCard
          icon="🔧"
          title="Debug: View Stored Users"
          subtitle="See where user data is stored"
          onPress={() => navigation.navigate('Debug')}
          style={styles.menuItem}
        />
        
        {user && user.provider !== 'guest' && (
          <StyledCard
            icon="🚪"
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
  avatarIcon: {
    fontSize: 50,
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
  },
  aiButton: {
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statValue: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  menuSection: {
    marginTop: Spacing.md,
  },
  menuItem: {
    marginBottom: Spacing.md,
  },
});