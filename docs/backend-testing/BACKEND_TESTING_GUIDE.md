# Backend Testing Guide - Phases 1-8
## Precise Step-by-Step Testing Instructions

**Test Date:** _____________

---

## 🎯 TEST 1: App Loads Without Errors

**What you're testing:** Firebase is configured correctly

### Steps:
1. Open browser
2. Go to `http://localhost:8081`
3. Press **F12** to open DevTools
4. Click **Console** tab
5. Look at the logs - NO red errors should appear

### ✅ Pass if:
- App loads and shows home screen
- No red errors in console
- You see the bottom navigation bar (AI, Home, Profile)

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 2: Guest User Data Storage

**What you're testing:** Data saves locally for guest users

### Steps:
1. Click **Home** tab (bottom navigation)
2. Click **Track Nutrition** button
3. Click **Search Food** button
4. Type "chicken" in search box
5. Click first result (Chicken Breast)
6. Click **Add** button (accept default 100g)
7. Press **F12** → Click **Application** tab → Click **Local Storage** → Click `http://localhost:8081`
8. Look for key: `@daily_consumption_guest`

### ✅ Pass if:
- You see `@daily_consumption_guest` in Local Storage
- The value contains chicken breast data
- Keys have `_guest` suffix

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 3: Complete a Workout (Guest)

**What you're testing:** Workout saves with user ID

### Steps:
1. Click **Home** tab
2. Click **Start Workout** button
3. Click **Quick Workout**
4. Click **Add Exercise** button
5. Select muscle group (e.g., **Chest**)
6. Click first exercise (e.g., **Push-ups**)
7. In the set entry:
   - Reps: Type **10**
   - Click ✓ (checkmark) to complete the set
8. Click **Finish Workout** button (top right)
9. On finalization screen, click **Skip & Save with Defaults**
10. Press **F12** → **Application** → **Local Storage**
11. Find key: `@workout_history_guest`

### ✅ Pass if:
- Workout saved successfully
- Alert says "Workout saved"
- `@workout_history_guest` key exists in Local Storage
- Contains your push-ups workout

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 4: Nutrition Goals are User-Specific

**What you're testing:** Goals save per user

### Steps:
1. Click **Home** tab
2. Click **Track Nutrition**
3. Look at the calorie goal at top (should show 2000 cal)
4. Scroll down and click **Edit Goal** button
5. Change **Daily Calorie Goal** to **2500**
6. Change **Protein** to **175**
7. Click **Save Goals** button
8. Click **Back arrow** (top left)
9. Check if goal now shows **2500** calories

### ✅ Pass if:
- Goal updates to 2500
- Protein shows 175g
- Changes persist after going back
- Press F12 → Application → Local Storage → `@user_profile_guest` contains new goals

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 5: SyncManager Starts on App Launch

**What you're testing:** Sync system initializes

### Steps:
1. Press **F5** to refresh the page
2. Immediately press **F12** to open DevTools
3. Click **Console** tab
4. Look for log message: `"Initializing SyncManager..."`
5. Look for: `"Network state changed:"` messages

### ✅ Pass if:
- You see "Initializing SyncManager..." in console
- You see network state logs
- No errors about SyncManager

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 6: Manual Sync Status Display

**What you're testing:** Sync UI shows status

### Steps:
1. Click **Profile** tab (bottom navigation)
2. Scroll down to find **"📡 Cloud Sync"** card
3. Look at the status information displayed:
   - Online/Offline badge (should be green "Online")
   - Last Sync time
   - Pending operations count

### ✅ Pass if:
- Cloud Sync card is visible
- Shows "Online" status (green badge)
- Shows last sync time (may say "Never" or show a time)
- Shows pending count (probably 0)

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 7: Network Detection

**What you're testing:** App detects offline/online

### Steps:
1. Make sure you're on **Profile** tab with **Cloud Sync card visible**
2. Press **F12** → Click **Console** tab
3. Click **Network** tab in DevTools
4. Find dropdown that says **"No throttling"** → Change to **"Offline"**
5. Look at Profile screen - badge should turn **RED** and say "Offline"
6. Check console for log: `"Network state changed:"`
7. Change back to **"No throttling"**
8. Badge should turn **GREEN** and say "Online"

### ✅ Pass if:
- Badge changes from green (Online) to red (Offline)
- Badge changes back to green when online again
- Console shows network state changes

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 8: Google Sign-In UI (Skip if no Apple Developer)

**What you're testing:** Sign-in button exists and works

### Steps:
1. Click **Profile** tab
2. Scroll to top
3. Look for **"Sign in with Google"** button
4. ⚠️ **STOP HERE if you don't have Apple Developer account**
5. If you DO have it configured:
   - Click **"Sign in with Google"**
   - Complete Google OAuth flow
   - Check if your name appears at top of Profile

### ✅ Pass if:
- "Sign in with Google" button exists and is clickable
- (If authenticated): Your name and email show on Profile screen
- (If authenticated): "✓ Google Account" badge appears

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP

---

## 🎯 TEST 9: Workout Auto-Sync (Requires Authentication)

**What you're testing:** Workouts sync to Firebase automatically

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN** (skip if guest)

### Steps:
1. Press **F12** → **Console** tab (keep it open)
2. Click **Home** tab
3. Click **Start Workout**
4. Click **Quick Workout**
5. Click **Add Exercise** → **Chest** → **Push-ups**
6. Complete 1 set: Type **15** reps → Click ✓
7. Click **Finish Workout**
8. On finalization screen:
   - Type workout name: "Test Sync"
   - Click **Save Workout** button
9. **WATCH THE CONSOLE** for sync logs
10. Open new tab → Go to Firebase Console (https://console.firebase.google.com)
11. Click your project → **Firestore Database**
12. Navigate: `users` → (your user ID) → `workouts`
13. Check if your "Test Sync" workout appears

### ✅ Pass if:
- Console shows sync messages (look for "Workout queued for sync" or similar)
- Workout appears in Firebase within 10 seconds
- Workout data includes exercises, sets, reps

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 10: Food Entry Auto-Sync (Requires Authentication)

**What you're testing:** Food syncs to Firebase

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Press **F12** → **Console** tab (keep open)
2. Click **Home** tab
3. Click **Track Nutrition**
4. Click **Search Food**
5. Search: "banana"
6. Click first result
7. Click **Add** button (100g default)
8. **WATCH CONSOLE** for sync logs
9. Go to Firebase Console → **Firestore Database**
10. Navigate: `users` → (your ID) → `meals`
11. Look for banana entry

### ✅ Pass if:
- Console shows meal sync logs
- Banana appears in Firebase meals collection
- Entry has calories, protein, carbs, fat

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 11: Manual Sync Button (Requires Authentication)

**What you're testing:** Sync Now button works

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Click **Profile** tab
2. Scroll to **"📡 Cloud Sync"** card
3. Note the **"Last Sync"** time
4. Click **"Sync Now"** button
5. Wait for alert that says **"Sync Complete"**
6. Click **"OK"** on alert
7. Check **"Last Sync"** time - should say "Just now"

### ✅ Pass if:
- "Sync Now" button is clickable
- Alert appears saying "Sync Complete"
- "Last Sync" updates to "Just now"
- "Pending" count is 0

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 12: Offline Queueing (Requires Authentication)

**What you're testing:** Operations queue when offline

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Press **F12** → **Network** tab
2. Change **"No throttling"** to **"Offline"**
3. Click **Profile** tab → Check **Pending count** (note the number)
4. Click **Home** → **Track Nutrition** → **Search Food**
5. Search "apple" → Click result → Click **Add**
6. Click **Profile** tab
7. Check **Pending count** - should have **increased by 1**
8. Press **F12** → Change **"Offline"** back to **"No throttling"**
9. Wait **10 seconds**
10. Check **Pending count** - should go back to **0**

### ✅ Pass if:
- Pending count increases when you add food while offline
- Pending count goes back to 0 when online
- No error messages appear

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 13: App Foreground Sync

**What you're testing:** Sync on app focus

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Have app open in browser tab
2. Press **F12** → **Console** tab (keep visible)
3. **Switch to a different browser tab** (e.g., Gmail)
4. Wait **5 seconds**
5. **Switch back** to the app tab
6. Look at console for message: `"App came to foreground, syncing..."`

### ✅ Pass if:
- Console logs show foreground message
- Sync is triggered automatically
- No errors appear

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 14: Barcode Scan Sync (Requires Authentication + Camera)

**What you're testing:** Scanned food syncs

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**
- Camera access enabled

### Steps:
1. Click **Home** tab
2. Click **Track Nutrition**
3. Click **Scan Barcode** button
4. Grant camera permissions if asked
5. Point camera at any barcode (or use test image)
6. After scan, adjust serving size if needed
7. Click **"Add to My Nutrition"** button
8. Check console for sync logs
9. Go to Firebase → `users` → (your ID) → `meals`
10. Find the scanned product

### ✅ Pass if:
- Product is scanned successfully
- Sync logs appear in console
- Product appears in Firebase with barcode data

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP

---

## 🎯 TEST 15: Sign Out and Data Separation

**What you're testing:** Guest and authenticated data is separate

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN FIRST**

### Steps:
1. While signed in:
   - Click **Home** → **Track Nutrition** → **Search Food**
   - Add "steak" to your log
   - Note you added it as authenticated user
2. Click **Profile** tab
3. Scroll down to find **"🚪 Sign Out"** card
4. Click **"Sign Out"** card
5. Confirm sign out
6. App returns to guest mode
7. Click **Home** → **Track Nutrition** → Look at your food log
8. **Steak should NOT be visible** (because it was saved under your account)
9. Press **F12** → **Application** → **Local Storage**
10. Check keys - should now have `_guest` suffix again

### ✅ Pass if:
- You successfully sign out
- Food log is empty after sign out
- Local Storage keys have `_guest` suffix
- No errors during sign out

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 16: Data Persists After Re-Sign-In

**What you're testing:** Data syncs back after sign-in

### Prerequisites:
- ⚠️ **Must have completed TEST 15 (signed out)**

### Steps:
1. You should be in guest mode now
2. Click **Profile** tab
3. Click **"Sign in with Google"** button
4. Sign in with **THE SAME GOOGLE ACCOUNT** as before
5. After sign-in completes, click **Profile** tab
6. Find **"📡 Cloud Sync"** card
7. Click **"Sync Now"** button
8. Wait for **"Sync Complete"** alert
9. Click **Home** → **Track Nutrition** → Check your food log
10. The **"steak"** from TEST 15 should reappear!

### ✅ Pass if:
- Sign-in works
- Sync completes successfully
- Your previous data (steak) reappears
- Workout history also returns

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP

---

## 🎯 TEST 17: Multiple Foods Sync Together

**What you're testing:** Batch meal sync

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Click **Home** → **Track Nutrition** → **Search Food**
2. Add 3 different foods:
   - Search "oatmeal" → Add 100g → **Done**
   - Click **Search Food** again
   - Search "chicken" → Add 150g → **Done**
   - Click **Search Food** again
   - Search "broccoli" → Add 100g → **Done**
3. Click **Profile** tab
4. Click **"Sync Now"** button
5. Wait for sync complete
6. Go to Firebase Console → `users` → (your ID) → `meals`
7. Check for all 3 items: oatmeal, chicken, broccoli

### ✅ Pass if:
- All 3 foods appear in Firebase
- Each has correct calories and macros
- Timestamps are recent

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 18: Nutrition Goals Persist

**What you're testing:** Changed goals stay after refresh

### Steps:
1. Click **Home** → **Track Nutrition**
2. Click **Edit Goal** button (or go to Settings → Food Settings)
3. Set:
   - **Calories:** 2800
   - **Protein:** 180
   - **Carbs:** 280
   - **Fat:** 80
4. Click **"Save Goals"** button
5. Go back to Track Nutrition screen
6. **Refresh the entire browser page** (F5)
7. After page loads, click **Home** → **Track Nutrition**
8. Check if goal still shows **2800 calories**

### ✅ Pass if:
- Goals are saved
- Goals persist after F5 refresh
- All macros (protein, carbs, fat) are saved

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 19: Workout History Shows Saved Workouts

**What you're testing:** Workouts persist in local storage

### Steps:
1. If you haven't done a workout yet:
   - Click **Home** → **Start Workout** → **Quick Workout**
   - Add exercise → Complete 1 set → **Finish Workout** → **Save**
2. Click **Home** tab
3. Click **View Workout History** or **Training** tab
4. Look for your saved workout in the list
5. Click on the workout to view details
6. Verify:
   - Workout name is shown
   - Exercises are listed
   - Sets/reps are correct

### ✅ Pass if:
- Workout appears in history
- Details are complete
- Date/time is shown

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 20: Offline Mode Doesn't Break App

**What you're testing:** App works offline

### Steps:
1. Press **F12** → **Network** tab
2. Change **"No throttling"** to **"Offline"**
3. Try these actions:
   - Click **Home** → **Track Nutrition** → **Search Food**
   - Search for "rice"
   - Add it to your log
   - Click **Home** → **Start Workout**
4. Check for error alerts (there should be NONE)
5. Change back to **"No throttling"** (online)
6. Click **Profile** → **"Sync Now"**
7. Data should sync to Firebase

### ✅ Pass if:
- No error messages appear while offline
- Can still add food and workouts
- Data syncs when back online

**Status:** ⬜ PASS / ⬜ FAIL

---

## 🎯 TEST 21: Profile Shows User Info When Signed In

**What you're testing:** User profile displays correctly

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Click **Profile** tab
2. Look at the top of the screen
3. You should see:
   - Your profile picture (if you have one in Google)
   - Your name
   - Your email address
   - "✓ Google Account" badge
4. Scroll down and check:
   - **Cloud Sync** card is visible
   - **"Sync Now"** button exists

### ✅ Pass if:
- Your name is displayed correctly
- Email is shown
- Google Account badge appears
- Cloud Sync section is visible

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 22: Firebase Data Structure Check

**What you're testing:** Data is organized correctly in Firebase

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**
- Must have added workouts and meals

### Steps:
1. Open new browser tab
2. Go to: https://console.firebase.google.com
3. Click your project name
4. Click **Firestore Database** (left sidebar)
5. Click **`users`** collection
6. Click **your user ID** (long string of letters/numbers)
7. You should see these **subcollections**:
   - `workouts`
   - `meals`
   - `progress` (may be empty)
8. Click **`workouts`** → Click any workout document
9. Verify it has: exercises, sets, date, duration
10. Go back, click **`meals`** → Click any meal document
11. Verify it has: food name, calories, protein, carbs, fat, date

### ✅ Pass if:
- User document exists with your ID
- Subcollections (workouts, meals) exist
- Documents inside have all expected fields
- Data looks correct (no null/undefined values)

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## 🎯 TEST 23: User Goals in Firebase

**What you're testing:** Settings sync to Firebase

### Prerequisites:
- ⚠️ **MUST BE SIGNED IN**

### Steps:
1. Click **Home** → **Track Nutrition**
2. Click **Edit Goal**
3. Change to:
   - **Calories:** 3000
   - **Protein:** 200
4. Click **Save Goals**
5. Go to Firebase Console (https://console.firebase.google.com)
6. Navigate: **Firestore Database** → `users` → (your user ID)
7. Click on your **user document** (not a subcollection)
8. Look for **`goals`** field
9. Check if it shows:
   - `calories: 3000`
   - `protein: 200`

### ✅ Pass if:
- User document has `goals` field
- Values match what you just set (3000, 200)
- `updatedAt` field shows recent timestamp

**Status:** ⬜ PASS / ⬜ FAIL / ⬜ SKIP (Not signed in)

---

## ✅ FINAL RESULTS

**Total Tests:** 23
**Passed:** _____
**Failed:** _____
**Skipped:** _____ (authentication required)

### Issues Found:

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Overall Status:
- ⬜ All tests passing - Ready for Phase 9
- ⬜ Minor issues found - Need fixes
- ⬜ Major issues found - Need investigation

**Tested By:** _____________
**Date:** _____________
