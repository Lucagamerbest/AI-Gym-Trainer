// Dynamic Expo config - uses environment variables for sensitive data
const IS_DEV = process.env.APP_VARIANT === "development";

export default {
  expo: {
    name: IS_DEV ? "Workout Wave (Dev)" : "Workout Wave",
    slug: "workout-wave",
    owner: "workoutwave",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    backgroundColor: "#000000",
    scheme: "workoutwave",
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? "com.rarau.workoutwave.dev" : "com.rarau.workoutwave",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      },
      infoPlist: {
        UIBackgroundModes: ["audio", "location"],
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              "com.googleusercontent.apps.1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s"
            ]
          }
        ],
        NSLocationWhenInUseUsageDescription:
          "Workout Wave needs your location to remind you to start a workout when you arrive at your gym.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Workout Wave needs background location access to automatically remind you to start a workout when you arrive at your gym, even when the app is closed.",
        ITSAppUsesNonExemptEncryption: false
      },
      runtimeVersion: {
        policy: "appVersion"
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000"
      },
      package: "com.rarau.workoutwave",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      permissions: [
        "VIBRATE",
        "POST_NOTIFICATIONS",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED"
      ],
      runtimeVersion: "1.0.0"
    },
    web: {
      bundler: "metro"
    },
    assetBundlePatterns: [
      "assets/*",
      "assets/**/*"
    ],
    plugins: [
      "expo-video",
      "expo-av",
      "expo-web-browser",
      "expo-sqlite",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Workout Wave needs background location access to automatically remind you to start a workout when you arrive at your gym.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      [
        "expo-notifications",
        {
          color: "#4CAF50",
          sounds: ["./assets/notification.mp3"]
        }
      ],
      [
        "expo-quick-actions",
        {
          androidIcons: {
            scan_food: {
              foregroundImage: "./assets/icon.png",
              backgroundColor: "#4CAF50"
            },
            log_workout: {
              foregroundImage: "./assets/icon.png",
              backgroundColor: "#2196F3"
            }
          },
          iosActions: [
            {
              id: "scan_food",
              title: "Scan Food",
              subtitle: "Quick barcode scan",
              icon: "UIApplicationShortcutIconTypeCompose",
              params: {
                action: "scan_food"
              }
            },
            {
              id: "log_workout",
              title: "Log Workout",
              subtitle: "Start tracking",
              icon: "UIApplicationShortcutIconTypeAdd",
              params: {
                action: "log_workout"
              }
            }
          ]
        }
      ],
      "expo-asset",
      "expo-speech-recognition"
    ],
    notification: {
      color: "#4CAF50",
      androidMode: "default",
      androidCollapsedTitle: "Rest Timer"
    },
    extra: {
      eas: {
        projectId: "8c7c4170-bb4a-46c8-bc8e-8288147175cc"
      },
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    updates: {
      url: "https://u.expo.dev/8c7c4170-bb4a-46c8-bc8e-8288147175cc"
    }
  }
};
