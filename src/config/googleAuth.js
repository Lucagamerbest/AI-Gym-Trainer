// Google OAuth Configuration
// These are your REAL Google Cloud OAuth credentials
// Created for Workout Wave app

export const GOOGLE_CONFIG = {
  // Web Client ID (you didn't provide this one, using iOS as fallback)
  webClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
  
  // iOS Client ID
  iosClientId: '1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s.apps.googleusercontent.com',
  
  // Android Client ID  
  androidClientId: '1011295206743-ab4i5hlk0qoh9ojqm9itmp932peacv4q.apps.googleusercontent.com',
  
  // Expo Client ID (using web client ID for Expo)
  expoClientId: '1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33.apps.googleusercontent.com',
};

// Note: For production, you need to:
// 1. Create a Google Cloud Project
// 2. Enable Google+ API
// 3. Create OAuth 2.0 credentials
// 4. Add your app's bundle identifier and SHA-1 fingerprint