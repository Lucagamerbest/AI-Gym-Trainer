# Fix Error 400: invalid_request - Google OAuth on iOS

## The Problem
You're seeing: **"Error 400: invalid_request"** when trying to sign in with Google on iOS.

This is a **redirect URI configuration issue**, not just an OAuth consent screen issue.

---

## Root Causes of Error 400

1. **Missing Redirect URIs** in Google Cloud Console
2. **Incorrect iOS Client ID** configuration
3. **Bundle ID mismatch** between app, Firebase, and Google Cloud
4. **OAuth request malformed** due to incorrect URL scheme

---

## Solution: Fix Google Cloud Console Configuration

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your project (ID: `1011295206743-...`)
3. You should see your OAuth 2.0 Client IDs

### Step 2: Find and Edit iOS Client ID

1. Look for the **iOS client ID**: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`
2. Click on it to edit
3. Verify the following:

**Expected Configuration:**
```
Application type: iOS
Name: iOS client (or your chosen name)
Bundle ID: com.workoutwave.app
App Store ID: (can be empty for now)
```

### Step 3: Add Required Redirect URIs

**This is the critical step for Error 400!**

You need to add the correct redirect URI for your iOS app:

1. In the **iOS client** configuration, look for **"Authorized redirect URIs"** section
   - **Note**: Some iOS clients don't have this field - that's OK, move to Step 4

2. If you see it, add this redirect URI:
   ```
   com.googleusercontent.apps.1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s:/oauth2redirect/google
   ```

3. Click **"SAVE"**

### Step 4: Verify Web Client (If Exists)

Sometimes the iOS app uses the Web Client ID for OAuth. Let's check:

1. Find your **Web client** in the credentials list
2. Look for Client ID: `1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33`
3. Click to edit
4. Under **"Authorized redirect URIs"**, you should see something like:
   ```
   https://auth.expo.io/@your-username/workout-wave
   https://your-project.firebaseapp.com/__/auth/handler
   ```

5. **Add these redirect URIs**:
   ```
   https://auth.expo.io/@anonymous/workout-wave
   https://ai-gym-trainer-xxxxx.firebaseapp.com/__/auth/handler
   ```
   (Replace `xxxxx` with your Firebase project ID)

### Step 5: Add Test User (OAuth Consent Screen)

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to **"Test users"**
3. Click **"ADD USERS"**
4. Add: `rarauluca@gmail.com`
5. Click **"SAVE"**

### Step 6: Verify Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Settings** (gear icon) → **Project settings**
4. Scroll to **Your apps** section
5. Find the **iOS app**

**Expected Configuration:**
```
Apple bundle ID: com.workoutwave.app
App Store ID: (optional)
```

6. Click the **iOS app** to expand
7. Verify the **iOS Client ID** matches: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`

### Step 7: Download GoogleService-Info.plist

1. Still in Firebase → iOS app settings
2. Click **"Download GoogleService-Info.plist"**
3. Save it somewhere (Expo manages this automatically, but good to have)

---

## Alternative: Use Expo's Google Auth Instead of Firebase

If the above doesn't work, we can switch to using Expo's native Google authentication:

### Option: Update to Expo Google Sign-In

This bypasses some Firebase complexity:

1. Install Expo Google package:
   ```bash
   npx expo install expo-auth-session expo-web-browser
   ```

2. The app is already configured for this (using `expo-auth-session/providers/google`)

3. Make sure these are in `app.json`:
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.workoutwave.app",
       "infoPlist": {
         "CFBundleURLTypes": [
           {
             "CFBundleURLSchemes": [
               "com.googleusercontent.apps.1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s"
             ]
           }
         ]
       }
     }
   }
   ```

---

## Quick Fix Steps (Do These In Order)

### 1. Add Email as Test User (5 minutes)
- Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- Add `rarauluca@gmail.com` as test user
- Click SAVE

### 2. Publish the App (2 minutes) - RECOMMENDED
- Still in OAuth Consent Screen
- Click **"PUBLISH APP"** at the top
- Confirm publishing
- This removes the need for test users!

### 3. Verify iOS Client Configuration (5 minutes)
- Go to [Credentials](https://console.cloud.google.com/apis/credentials)
- Find iOS Client ID: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`
- Verify Bundle ID: `com.workoutwave.app`
- Save if you made changes

### 4. Check Firebase Google Sign-In (3 minutes)
- Go to [Firebase Console](https://console.firebase.google.com/)
- Authentication → Sign-in method
- Make sure **Google** is **enabled**
- Verify iOS Client ID is listed

### 5. Wait and Retry (10 minutes)
- Wait 5-10 minutes for changes to propagate
- Delete the app from your iOS device
- Restart Expo server:
  ```bash
  npx expo start --clear
  ```
- Reinstall the app
- Try signing in with Google again

---

## Debugging Commands

Run these to verify your configuration:

```bash
# Check app.json configuration
cat app.json | grep -A 10 "ios"

# Check what client IDs are in your code
grep -r "1011295206743" src/

# Verify Firebase config
cat src/config/firebase.js
```

---

## Expected Behavior After Fix

✅ Google Sign-In button works
✅ OAuth flow completes successfully
✅ No Error 400
✅ User redirected back to app
✅ Profile created in Firestore

---

## If Error Persists

### Check Google Cloud Console Logs

1. Go to [APIs & Services](https://console.cloud.google.com/apis/dashboard)
2. Click **"Credentials"**
3. Click on your OAuth client
4. Look for error logs or warnings

### Enable Additional Google APIs

The app might need these APIs enabled:

1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search and enable:
   - **Google+ API** (for profile info)
   - **People API** (for user info)
   - **Identity Toolkit API** (for Firebase Auth)

### Check Expo Configuration

Run this command to see your Expo config:
```bash
npx expo config --type public
```

Look for the iOS bundle identifier and URL schemes.

---

## Common Error 400 Causes

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `invalid_request` | Redirect URI not in Google Cloud Console | Add redirect URI |
| `redirect_uri_mismatch` | URL scheme doesn't match | Check app.json CFBundleURLSchemes |
| `unauthorized_client` | Client ID not authorized | Enable Google Sign-In in Firebase |
| `access_denied` | Not a test user | Add email to test users or publish app |

---

## Testing Checklist

- [ ] Added `rarauluca@gmail.com` as test user (or published app)
- [ ] iOS Client ID verified in Google Cloud Console
- [ ] Bundle ID matches: `com.workoutwave.app`
- [ ] URL scheme in app.json correct
- [ ] Firebase Google Sign-In enabled
- [ ] iOS Client ID in Firebase matches Google Cloud
- [ ] Waited 10 minutes for propagation
- [ ] Deleted and reinstalled app
- [ ] Cleared Expo cache

---

## Priority Fix (Do This First!)

The fastest fix is to **PUBLISH THE APP**:

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Click **"PUBLISH APP"** button at the top
3. Confirm publishing
4. Wait 5 minutes
5. Try again

**Why this works**: Your scopes (`openid`, `profile`, `email`) are basic and don't require Google verification. Publishing removes all restrictions.

---

## Need More Help?

If you still see Error 400 after following all steps:

1. Share a screenshot of your Google Cloud Console OAuth Client configuration
2. Confirm which project you're using in Google Cloud Console
3. Check if you have multiple OAuth clients (iOS vs Web)
4. Verify your Firebase project ID

---

**Your Email**: rarauluca@gmail.com
**iOS Client ID**: 1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s
**Bundle ID**: com.workoutwave.app

Let's get this working! 🚀
