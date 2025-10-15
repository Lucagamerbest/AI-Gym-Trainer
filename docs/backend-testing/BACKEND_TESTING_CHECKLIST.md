# Backend Testing Checklist - Phases 1-8
## Complete Testing Guide for AI Gym Trainer Backend Implementation

**Testing Date:** 2025-10-15
**Tester:** Luca Rarau

---

## ⚠️ PREREQUISITES

Before starting, ensure:
- [X] App is running (`npm run web` or `npm start`)
- [X] Firebase console is open in browser (https://console.firebase.google.com/)
- [ ] Browser DevTools is open (F12) to check console logs
- [X] You have a Google account ready (for Phase 4 when you get Apple Developer)

---

## 📋 PHASE 1-2: Backend Initialization & Connection

### Test 1.1: Firebase Configuration
**What to check:** Firebase is properly configured and connected

**Steps:**
1. Open the app in browser
2. Open Browser DevTools → Console tab
3. Look for any Firebase initialization errors (there should be NONE)
4. Go to Firebase Console → Project Settings
5. Verify your project ID matches the one in `.env.local`

**Expected Result:**
- ✅ No Firebase errors in console
- ✅ App loads without crashing
- ✅ Project ID matches

**Status:** ⬜ **PASS** / ⬜ FAIL

**Notes:** _______________________________________________

---

## 🗄️ PHASE 3: Database Schema & Storage

### Test 3.1: Local Storage Structure (Guest User)
**What to check:** Data saves locally for guest users

**Steps:**
1. Open app (you're automatically a guest user)
2. Open DevTools → Application tab → Local Storage → localhost:8081
3. Look for keys like:
   - `@daily_consumption_guest`
   - `@favorites_guest`
   - `@user_profile_guest`
   - `@workout_history_guest`

**Expected Result:**
- ✅ Storage keys exist with `_guest` suffix
- ✅ Keys are organized by user ID

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

## 🔐 PHASE 4: Authentication (When You Get Apple Developer)

### Test 4.1: Google Sign-In Flow
**What to check:** Google authentication works

**Steps:**
1. Go to Profile tab
2. Click "Sign in with Google" button
3. Follow Google OAuth flow
4. After signing in, check:
   - Your name appears at top of Profile screen
   - Email is displayed
   - "✓ Google Account" badge shows

**Expected Result:**
- ✅ Google sign-in completes successfully
- ✅ User profile displays correct info
- ✅ No error alerts

**Status:** ⬜ PASS / ⬜ FAIL (Not testable yet - need Apple Developer)

**Notes:** _______________________________________________

---

### Test 4.2: User Profile Creation in Firebase
**What to check:** User profile is created in Firebase

**Steps:**
1. After signing in with Google
2. Go to Firebase Console → Firestore Database
3. Navigate to: `users` collection
4. Find document with your user ID
5. Verify it contains:
   - `uid`, `email`, `displayName`, `photoURL`
   - `createdAt`, `updatedAt`
   - `settings` object (units, theme)
   - `goals` object (calories, protein, carbs, fat)

**Expected Result:**
- ✅ User document exists in Firestore
- ✅ All fields are populated correctly
- ✅ Default goals are set (2000 cal, 150g protein, etc.)

**Status:** ⬜ PASS / ⬜ FAIL (Not testable yet - need Apple Developer)

**Notes:** _______________________________________________

---

## 💪 PHASE 5: Workout & Food Data Per User

### Test 5.1: Workout Data is User-Specific
**What to check:** Workout saves with correct user ID

**Steps:**
1. As guest user, complete a quick workout:
   - Home → Start Workout → Quick Workout
   - Add an exercise (e.g., Push-ups)
   - Complete 1 set
   - Finish workout
2. Open DevTools → Application → Local Storage
3. Check `@workout_history_guest` key
4. Verify workout data is saved

**Expected Result:**
- ✅ Workout saved with `userId: 'guest'`
- ✅ Data includes exercises, sets, duration
- ✅ Timestamp is recorded

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 5.2: Food Data is User-Specific
**What to check:** Food consumption saves per user

**Steps:**
1. Go to Home → Track Nutrition → Search Food
2. Search for "chicken"
3. Add 100g chicken breast to snack
4. Click "Done"
5. Open DevTools → Application → Local Storage
6. Check `@daily_consumption_guest` key
7. Verify food entry exists

**Expected Result:**
- ✅ Food saved with correct user ID
- ✅ Calories and macros calculated
- ✅ Meal type is "snack"

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 5.3: Nutrition Goals are User-Specific
**What to check:** Nutrition goals save per user

**Steps:**
1. Go to Track Nutrition screen
2. You should see daily calorie goal (default 2000)
3. Tap "Edit Goal" or go to Settings → Food Settings
4. Change calorie goal to 2500
5. Change protein to 175g
6. Save changes
7. Go back to Track Nutrition
8. Verify goals updated

**Expected Result:**
- ✅ Goals update in UI immediately
- ✅ New goals persist after refresh
- ✅ Goals are in `@user_profile_guest` in Local Storage

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

## 🔄 PHASE 6: Automatic Sync with SyncManager

### Test 6.1: SyncManager Initialization
**What to check:** SyncManager starts on app launch

**Steps:**
1. Refresh the app (F5)
2. Open DevTools → Console
3. Look for log: `"Initializing SyncManager..."`
4. Check for: `"Loaded X pending sync operations"`

**Expected Result:**
- ✅ SyncManager initializes on app start
- ✅ Network monitoring is active
- ✅ No initialization errors

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 6.2: Network State Detection
**What to check:** App detects online/offline state

**Steps:**
1. Open DevTools → Console
2. Go to DevTools → Network tab
3. Click "Offline" dropdown → Select "Offline"
4. Check console for: `"Network state changed: ... isOnline: false"`
5. Switch back to "Online"
6. Check for: `"Network state changed: ... isOnline: true"`

**Expected Result:**
- ✅ App detects offline state
- ✅ App detects online state
- ✅ Logs show network changes

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 6.3: Workout Auto-Sync (Authenticated User Only)
**What to check:** Workouts sync to Firebase automatically

**Steps:**
1. ⚠️ **REQUIRES:** Signed in with Google (skip if not yet authenticated)
2. Complete a workout (any type)
3. On the finalization screen, add a name and save
4. Check console for: `"Workout queued for sync..."` or sync success
5. Go to Firebase Console → Firestore
6. Navigate to: `users/{your-uid}/workouts`
7. Verify your workout appears with all data

**Expected Result:**
- ✅ Workout syncs automatically after save
- ✅ Workout appears in Firebase within seconds
- ✅ All workout data (exercises, sets) is complete

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

### Test 6.4: Manual Sync Button in Profile
**What to check:** Manual sync works

**Steps:**
1. Go to Profile tab
2. Scroll down to "Cloud Sync" card
3. Check sync status:
   - Online/Offline badge
   - Last Sync time
   - Pending operations count
4. Click "Sync Now" button
5. Wait for sync to complete
6. Check for "Sync Complete" alert

**Expected Result:**
- ✅ Sync status displays correctly
- ✅ "Sync Now" button works
- ✅ Success message appears
- ✅ Last sync time updates

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 6.5: App Foreground Sync
**What to check:** Sync triggers when app comes to foreground

**Steps:**
1. Have the app open
2. Switch to another tab/window for 10 seconds
3. Switch back to the app
4. Open DevTools → Console
5. Look for: `"App came to foreground, syncing..."`

**Expected Result:**
- ✅ Foreground event is detected
- ✅ Sync is triggered automatically
- ✅ Console logs show sync attempt

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 6.6: Offline Queueing
**What to check:** Operations queue when offline

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Set DevTools → Network to "Offline"
3. Complete a quick workout and save it
4. Check console for: `"Workout queued for sync when online"`
5. Go to Profile → Check "Pending" count (should be > 0)
6. Set Network back to "Online"
7. Wait 5 seconds
8. Check console for sync completion
9. Check "Pending" count (should be 0)

**Expected Result:**
- ✅ Workout queues when offline
- ✅ Pending count increases
- ✅ Auto-sync when back online
- ✅ Pending count decreases to 0

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 🍽️ PHASE 7: Meal Data Sync

### Test 7.1: Food Entry Auto-Sync
**What to check:** Food entries sync to Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Go to Track Nutrition → Search Food
3. Search for "banana"
4. Add 100g banana
5. Check console for meal sync log
6. Go to Firebase Console → Firestore
7. Navigate to: `users/{your-uid}/meals`
8. Verify banana entry appears

**Expected Result:**
- ✅ Meal syncs after adding food
- ✅ Entry appears in Firebase
- ✅ Nutrition data is accurate

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

### Test 7.2: Barcode Scan Sync
**What to check:** Scanned foods sync to Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user + camera access
2. Go to Home → Scan Barcode
3. Scan a food product (or use test barcode)
4. Add the food item
5. Check console for sync logs
6. Verify in Firebase: `users/{your-uid}/meals`

**Expected Result:**
- ✅ Scanned food syncs automatically
- ✅ Entry appears in Firebase with barcode
- ✅ Product details are complete

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

### Test 7.3: Meal Data Download
**What to check:** Meals download from Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Have some meals in Firebase
2. Clear browser data (DevTools → Application → Clear storage)
3. Refresh app and sign in again
4. Go to Profile → Click "Sync Now"
5. Go to Track Nutrition
6. Check if your meal history reappears

**Expected Result:**
- ✅ Meals download from Firebase
- ✅ Nutrition totals are recalculated
- ✅ Meal history displays correctly

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

### Test 7.4: Today's Meals Batch Sync
**What to check:** Multiple meals sync together

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Add 3 different foods:
   - Breakfast: Oatmeal
   - Lunch: Chicken
   - Snack: Apple
3. Go to Profile → Manual Sync
4. Go to Firebase Console → Check meals collection
5. Verify all 3 meals are present with correct meal types

**Expected Result:**
- ✅ All meals sync successfully
- ✅ Meal types are correct (breakfast, lunch, snack)
- ✅ Timestamps are accurate

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 📊 PHASE 8: Progress Data Sync

### Test 8.1: Progress Entry Sync (If Available)
**What to check:** Weight/measurements sync to Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. If your app has a progress tracking screen:
   - Add a weight entry
   - Add body measurements (if available)
3. Check console for progress sync logs
4. Go to Firebase Console → Firestore
5. Navigate to: `users/{your-uid}/progress`
6. Verify entry appears

**Expected Result:**
- ✅ Progress entry syncs automatically
- ✅ Entry appears in Firebase
- ✅ All measurements are saved

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Feature not used or not authenticated)

**Notes:** _______________________________________________

---

### Test 8.2: Complete Manual Sync (All Data Types)
**What to check:** All data types sync together

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Perform these actions:
   - Complete 1 workout
   - Add 1 food item
   - Add 1 progress entry (if available)
3. Set Network to "Offline" in DevTools
4. Note the "Pending" count in Profile
5. Set Network back to "Online"
6. Click "Sync Now" in Profile
7. Wait for completion
8. Verify in Firebase:
   - New workout in `/workouts`
   - New meal in `/meals`
   - New progress in `/progress`

**Expected Result:**
- ✅ All 3 data types sync successfully
- ✅ Pending count goes to 0
- ✅ All entries appear in Firebase
- ✅ "Last Sync" time updates

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 🔄 CROSS-DEVICE SYNC TEST (Advanced)

### Test 9.1: Multi-Device Data Sync
**What to check:** Data syncs across devices

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated on 2 devices (e.g., laptop + phone)
2. Device 1: Add a workout
3. Device 1: Click "Sync Now"
4. Device 2: Open app (or refresh if already open)
5. Device 2: Click "Sync Now"
6. Device 2: Check workout history
7. Verify workout from Device 1 appears on Device 2

**Expected Result:**
- ✅ Workout appears on second device
- ✅ All data is intact
- ✅ No duplicates created

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Only have 1 device)

**Notes:** _______________________________________________

---

## 🧪 DATA INTEGRITY TESTS

### Test 10.1: Guest to Authenticated User Data Migration
**What to check:** Data doesn't mix between guest and authenticated user

**Steps:**
1. As guest, add 1 workout and 1 meal
2. Check Local Storage - note the `_guest` suffix on keys
3. Sign in with Google
4. Check Local Storage - note keys now have your user ID
5. Check workout history - guest workouts should NOT appear
6. This is correct behavior (guest data is separate)

**Expected Result:**
- ✅ Guest data uses `_guest` suffix
- ✅ Authenticated data uses real user ID
- ✅ Data is properly separated
- ✅ No data mixing occurs

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 10.2: Sign Out and Sign In Again
**What to check:** Data persists across sign-out/sign-in

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user with some data
2. Go to Profile → Click "Sign Out"
3. Confirm sign out
4. App returns to guest mode
5. Sign in with Google again (same account)
6. Go to Profile → Click "Sync Now"
7. Check workout history, meal log
8. Verify your previous data reappears

**Expected Result:**
- ✅ Data is preserved in Firebase
- ✅ Data syncs back after re-sign-in
- ✅ All data is intact (workouts, meals, goals)

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 📱 USER EXPERIENCE TESTS

### Test 11.1: Sync Status Visibility
**What to check:** User can see sync status clearly

**Steps:**
1. Go to Profile tab
2. Find "Cloud Sync" card
3. Verify it shows:
   - ✅ Online/Offline badge (green/red)
   - ✅ Last sync time (e.g., "5m ago")
   - ✅ Pending operations count
   - ✅ "Sync Now" button

**Expected Result:**
- ✅ All sync information is visible
- ✅ Status updates in real-time
- ✅ UI is clear and understandable

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 11.2: Sync Doesn't Block UI
**What to check:** App remains responsive during sync

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Add several workouts/meals to create pending sync operations
3. Go offline, then back online
4. While sync is happening (check console logs):
   - Try navigating to different tabs
   - Try adding a new food item
   - Try viewing workout history
5. Verify app is still responsive

**Expected Result:**
- ✅ App doesn't freeze during sync
- ✅ Can navigate normally
- ✅ Can add data while sync runs in background

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 🐛 ERROR HANDLING TESTS

### Test 12.1: Offline Behavior
**What to check:** App works offline without errors

**Steps:**
1. Set DevTools → Network to "Offline"
2. Try to add a workout
3. Try to add a meal
4. Check for any error messages
5. Verify data saves locally
6. Go back online
7. Data should sync automatically

**Expected Result:**
- ✅ No error alerts when offline
- ✅ Data saves locally successfully
- ✅ User is informed sync will happen later (check console)
- ✅ Auto-sync when back online

**Status:** ⬜ PASS / ⬜ FAIL

**Notes:** _______________________________________________

---

### Test 12.2: Sync Retry on Failure
**What to check:** Failed syncs are retried

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Add a workout while online
3. Immediately go offline (before sync completes)
4. Check "Pending" count (should be > 0)
5. Go back online
6. Wait 10 seconds
7. Check "Pending" count (should decrease)
8. Check Firebase to verify data arrived

**Expected Result:**
- ✅ Failed sync is queued
- ✅ Retry happens automatically when online
- ✅ Data eventually reaches Firebase

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## 📊 FINAL VERIFICATION

### Test 13.1: Firebase Console Data Check
**What to check:** All data types are in Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user with data
2. Go to Firebase Console → Firestore Database
3. Navigate to `users` collection
4. Click on your user ID
5. Verify these subcollections exist and have data:
   - ✅ `workouts` - Check 1 workout entry
   - ✅ `meals` - Check 1 meal entry
   - ✅ `progress` - Check 1 progress entry (if available)
6. Click on each entry and verify all fields are populated

**Expected Result:**
- ✅ All collections exist
- ✅ Data structure matches expectations
- ✅ No missing or null fields
- ✅ Timestamps are present

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

### Test 13.2: User Profile Goals in Firebase
**What to check:** User settings sync to Firebase

**Steps:**
1. ⚠️ **REQUIRES:** Authenticated user
2. Change your nutrition goals:
   - Calories: 2200
   - Protein: 160g
   - Carbs: 220g
   - Fat: 70g
3. Save changes
4. Go to Firebase Console → Firestore
5. Open: `users/{your-uid}` document
6. Check `goals` field
7. Verify values match what you set

**Expected Result:**
- ✅ User document has `goals` object
- ✅ Values match what you set
- ✅ `updatedAt` timestamp is recent

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not authenticated yet)

**Notes:** _______________________________________________

---

## ✅ TESTING SUMMARY

**Total Tests:** 23
**Tests Passed:** _____
**Tests Failed:** _____
**Tests Skipped:** _____ (Not authenticated yet)

### Critical Issues Found:
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Minor Issues Found:
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Overall Status:
⬜ All critical features working
⬜ Ready for Phase 9 (AI Integration)
⬜ Issues need resolution

---

## 🔍 TROUBLESHOOTING TIPS

**If sync doesn't work:**
- Check console for error messages
- Verify you're signed in (not guest)
- Check Firebase Rules are deployed
- Verify internet connection

**If data doesn't appear:**
- Click "Sync Now" manually
- Check Firebase Console to see if data exists
- Clear browser cache and re-sync
- Check Local Storage for data

**If authentication fails:**
- Verify Google OAuth credentials in `.env.local`
- Check Firebase Authentication is enabled
- Ensure Apple Developer account is active (for iOS)

---

## 📝 NOTES SECTION

Use this space for additional observations or issues:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

**Completion Date:** _____________
**Ready for Next Phase:** ⬜ YES / ⬜ NO
