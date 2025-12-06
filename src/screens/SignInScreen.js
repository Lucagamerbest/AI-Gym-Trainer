import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Alert, 
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const { signIn, signInWithGoogle, signInWithEmail, createAccountWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Check if we're on Android emulator
  const isAndroidEmulator = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === '10.0.2.2' || window.location.hostname === '10.0.3.2');

  // Google Sign-In configuration - same as ProfileScreen (which works)
  const [request, response, promptAsync] = isAndroidEmulator ? [null, null, null] : Google.useAuthRequest({
    expoClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
    iosClientId: '1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s.apps.googleusercontent.com',
    androidClientId: '1011295206743-ab4i5hlk0qoh9ojqm9itmp932peacv4q.apps.googleusercontent.com',
    webClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  });

  // Debug: Log request state
  useEffect(() => {
    if (request) {
    }
  }, [request]);

  // Debug: Log response changes
  useEffect(() => {
    if (response) {
      if (response.type === 'error') {
        Alert.alert('Google Auth Error', `Type: ${response.type}\nError: ${JSON.stringify(response.error)}\nParams: ${JSON.stringify(response.params)}`);
      } else if (response.type === 'dismiss') {
      } else if (response.type === 'success') {
      }
    }
  }, [response]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response);
    }
  }, [response]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Sign in with Firebase Auth
      const result = await signInWithEmail(email.toLowerCase(), password);

      if (!result.success) {
        Alert.alert('Sign In Failed', result.error || 'Please check your credentials and try again');
      }
      // If successful, don't show alert - just let the app navigate automatically
    } catch (error) {
      Alert.alert('Sign In Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Create account with Firebase Auth
      const result = await createAccountWithEmail(email.toLowerCase(), password, name);

      if (!result.success) {
        // Provide more specific error messages
        if (result.error.includes('email-already-in-use')) {
          Alert.alert('Registration Failed', 'This email is already registered. Please sign in instead.');
        } else if (result.error.includes('weak-password')) {
          Alert.alert('Registration Failed', 'Password is too weak. Please use a stronger password.');
        } else {
          Alert.alert('Registration Failed', result.error || 'Please try again');
        }
      }
      // If successful, don't show alert - just let the app navigate automatically
    } catch (error) {
      Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    const guestData = {
      email: 'guest@workoutwave.com',
      name: 'Guest User',
      provider: 'guest',
    };
    
    await signIn(guestData);
  };

  const handleGoogleSignIn = async (response) => {
    try {
      setIsGoogleLoading(true);

      const { authentication } = response;

      if (authentication?.idToken) {
        // Sign in with Firebase Auth using Google credential
        const result = await signInWithGoogle({ idToken: authentication.idToken });

        if (!result.success) {
          Alert.alert('Sign In Failed', result.error || 'Please try again');
        }
        // If successful, don't show alert - just let the app navigate automatically
      } else {
        Alert.alert('Sign In Failed', 'Failed to get Google credentials');
      }
    } catch (error) {
      Alert.alert('Sign In Error', 'Something went wrong. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showEmailForm) {
    return (
      <AnimatedBackground>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.formContent,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowEmailForm(false)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <Text style={styles.formTitle}>
                {isRegistering ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isRegistering ? 'Start your fitness journey' : 'Continue your fitness journey'}
              </Text>

              {isRegistering && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity 
                style={styles.signInButton} 
                onPress={isRegistering ? handleRegister : handleEmailSignIn}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.signInText}>
                    {isRegistering ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setIsRegistering(!isRegistering)}
                style={styles.switchMode}
              >
                <Text style={styles.switchModeText}>
                  {isRegistering 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoWave}>〰️</Text>
            <Text style={styles.logoWave}>〰️</Text>
          </View>
          
          <Text style={styles.title}>Workout Wave</Text>
          <Text style={styles.subtitle}>Your personal fitness journey</Text>
          
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={() => setShowEmailForm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>Sign In with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.signInButton, styles.guestButton]} 
            onPress={handleGuestSignIn}
            activeOpacity={0.8}
          >
            <Text style={[styles.signInText, styles.guestButtonText]}>Continue as Guest</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton} 
              activeOpacity={0.8}
              onPress={async () => {

                // Development bypass for Android emulator
                if (isAndroidEmulator) {
                  Alert.alert(
                    'Android Emulator Detected',
                    'Google Sign-In is not available on the Android emulator due to redirect URI restrictions.\n\nPlease use one of these options:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Use Demo Account',
                        onPress: () => {
                          setShowEmailForm(true);
                          setEmail('demo@gymtrainer.com');
                          setPassword('demo123');
                          setTimeout(() => {
                            Alert.alert('Demo Account', 'Email: demo@gymtrainer.com\nPassword: demo123\n\nThese credentials are pre-filled. Click Sign In to continue.');
                          }, 100);
                        }
                      },
                      {
                        text: 'Use Email Sign In',
                        onPress: () => setShowEmailForm(true)
                      }
                    ]
                  );
                  return;
                }
                if (request) {
                  try {
                    const result = await promptAsync();
                  } catch (error) {
                    Alert.alert('Google Auth Error', `promptAsync failed: ${error.message}`);
                  }
                } else {
                  Alert.alert('Debug Info', `Request: ${request}\nPlatform: ${Platform.OS}\nCheck console for more details`);
                }
              }}
              disabled={!request || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialLabel}>Google</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton} 
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert('Coming Soon', 'Apple Sign-In will be available soon!');
              }}
            >
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width - 40,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  formContent: {
    width: width - 40,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.xl,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.fontSize.md,
  },
  switchMode: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  switchModeText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoWave: {
    fontSize: 72,
    color: Colors.primary,
    marginVertical: -25,
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.round,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    minHeight: 56,
    justifyContent: 'center',
    ...Shadows.md,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  guestButtonText: {
    color: Colors.primary,
  },
  signInText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
  socialButtons: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  socialButton: {
    width: 100,
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
  },
  socialIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  socialLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  termsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});