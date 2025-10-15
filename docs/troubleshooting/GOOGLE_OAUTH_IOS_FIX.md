# Google OAuth 2.0 iOS Fix Guide

## The Problem
You're seeing: **"This app doesn't comply with Google OAuth 2.0 policy"** when signing in with Google on iOS/Apple devices.

## Root Cause
This error occurs because the Google Cloud Console OAuth consent screen isn't properly configured for production use, or the app is in "Testing" mode with restricted user access.

---

## Solution: Configure Google Cloud Console

Follow these steps carefully to fix the issue:

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or the project associated with your OAuth client IDs)
   - Your iOS Client ID: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`
   - Your Project ID should start with: `1011295206743`

### Step 2: Navigate to OAuth Consent Screen

1. In the left sidebar, click **"APIs & Services"**
2. Click **"OAuth consent screen"**
3. You'll see the current configuration

### Step 3: Fix the OAuth Consent Screen

#### Option A: Publishing Mode (Recommended for Production)

**If the app shows "Testing" status:**

1. Click **"PUBLISH APP"** button at the top
2. Confirm the publishing
3. This allows ANY Google user to sign in (no restrictions)
4. **Note**: You may need to submit for verification if using sensitive scopes

**Current Scopes Needed (Safe, No Verification Required):**
- `openid`
- `profile`
- `email`

These are basic scopes that don't require Google verification.

#### Option B: Add Test Users (Quick Fix for Development)

**If you want to keep the app in Testing mode:**

1. Scroll down to **"Test users"** section
2. Click **"ADD USERS"**
3. Add the Gmail accounts you want to allow:
   ```
   your-email@gmail.com
   team-member@gmail.com
   ```
4. Click **"SAVE"**
5. **Important**: Only these emails can sign in while in Testing mode

### Step 4: Verify App Information

Make sure these fields are filled out:

1. **App name**: Workout Wave (or your app name)
2. **User support email**: Your email
3. **App logo**: Upload a logo (optional but recommended)
4. **App domain**:
   - Homepage: Can leave blank for now
   - Privacy Policy: Can leave blank for now (add before production)
   - Terms of Service: Can leave blank for now
5. **Authorized domains**: Add if you have a website
6. **Developer contact information**: Your email

### Step 5: Verify Scopes

1. Go to **"Scopes"** tab
2. Click **"ADD OR REMOVE SCOPES"**
3. Make sure these are selected:
   - `openid`
   - `profile`
   - `email`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
4. Click **"UPDATE"**

### Step 6: Check OAuth Client Configuration

1. Go to **"Credentials"** in the left sidebar
2. Find your **iOS client ID**
3. Click on it to verify:
   - **Application type**: iOS
   - **Bundle ID**: `com.workoutwave.app`
   - **App Store ID**: Can be empty for now

---

## Alternative: Use Firebase Authentication Directly

Firebase provides a simpler OAuth flow. Let's verify your Firebase setup:

### Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Find **Google** provider
5. Make sure it's **enabled**
6. Check the **iOS configuration**:
   - iOS Client ID should match: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`

### Add GoogleService-Info.plist (iOS Native)

**Note**: Expo manages this automatically, but verify:

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Find or add the **iOS app**
4. **Bundle ID**: `com.workoutwave.app`
5. Download `GoogleService-Info.plist` (Expo will use this)

---

## Quick Fix: Add Your Email as Test User

**This is the FASTEST fix for immediate testing:**

1. Go to [Google Cloud Console OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to **"Test users"**
3. Click **"ADD USERS"**
4. Add your Gmail account
5. Click **"SAVE"**
6. Try signing in again on your iOS device

---

## Verification Steps

After making changes:

1. **Clear app cache** on your iOS device:
   - Delete the app
   - Reinstall from Expo Go

2. **Wait 5-10 minutes** for changes to propagate

3. **Try signing in again**

4. **Check logs** in Expo:
   ```bash
   # The app should show auth state changes
   LOG  🔐 Setting up Firebase Auth listener...
   LOG  🔐 Auth state changed: User signed in
   ```

---

## Expected Behavior After Fix

✅ Google Sign-In button works on iOS
✅ No OAuth 2.0 error
✅ User redirected back to app after sign-in
✅ User profile created in Firestore
✅ Firebase Console shows user in Authentication

---

## Common Issues & Solutions

### Issue 1: "Access Blocked: Authorization Error"
**Solution**: Add your email as a test user or publish the app

### Issue 2: "Redirect URI Mismatch"
**Solution**:
- Check `app.json` has correct URL scheme
- Bundle ID must match across Firebase, Google Cloud, and app.json

### Issue 3: "Invalid Client ID"
**Solution**:
- Verify iOS Client ID in both Firebase and Google Cloud Console
- Regenerate credentials if needed

### Issue 4: Works on Android but not iOS
**Solution**:
- iOS has stricter OAuth requirements
- Make sure iOS client ID is properly configured
- Check bundle ID matches exactly

---

## Testing Checklist

- [ ] Google Cloud Console OAuth consent screen configured
- [ ] App published OR test users added
- [ ] Scopes configured (openid, profile, email)
- [ ] Firebase Google sign-in enabled
- [ ] iOS client ID matches in Firebase
- [ ] Bundle ID matches: `com.workoutwave.app`
- [ ] URL scheme in app.json correct
- [ ] App cache cleared and reinstalled
- [ ] Waited 5-10 minutes for changes to propagate

---

## Need More Help?

If the issue persists:

1. **Check Google Cloud Console logs**:
   - APIs & Services → Credentials → View logs

2. **Check Firebase Authentication logs**:
   - Firebase Console → Authentication → Users

3. **Share the exact error message** from iOS device

4. **Verify your project configuration**:
   ```bash
   # Show current client IDs
   grep -r "1011295206743" .
   ```

---

## Quick Command to Test

After fixing, restart the Expo server:

```bash
npx expo start --clear
```

Then scan QR code with your iOS device and try signing in with Google.

---

**Priority Actions (Do These First):**

1. ✅ Add your Gmail as a test user in Google Cloud Console
2. ✅ Wait 5 minutes
3. ✅ Delete and reinstall app on iOS device
4. ✅ Try signing in again

This should fix the issue immediately! 🎉
