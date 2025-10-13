# Phase 3: Deploy Security Rules to Firebase

## 🎯 What We're Doing

We need to replace the temporary "test mode" rules with proper security rules that:
- Allow users to access only their own data
- Prevent unauthorized access
- Secure your app for production

---

## 📋 Option 1: Deploy via Firebase Console (Easiest - 2 minutes)

### Step 1: Open Security Rules

Go to your Firebase Console:
https://console.firebase.google.com/project/ai-gym-trainer-e35e6/firestore/rules

### Step 2: Copy the New Rules

Open the file `firestore.rules` in your project (I just created it)

**Or copy from here:**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function hasValidUserId() {
      return request.resource.data.userId == request.auth.uid;
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && hasRequiredFields(['uid', 'email', 'createdAt']) && request.resource.data.uid == userId;
      allow update: if isOwner(userId) && request.resource.data.uid == userId;
      allow delete: if isOwner(userId);

      match /workouts/{workoutId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && hasValidUserId() && hasRequiredFields(['userId', 'date', 'exercises']);
        allow update: if isOwner(userId) && hasValidUserId();
        allow delete: if isOwner(userId);
      }

      match /meals/{mealId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && hasValidUserId() && hasRequiredFields(['userId', 'date', 'foods']);
        allow update: if isOwner(userId) && hasValidUserId();
        allow delete: if isOwner(userId);
      }

      match /progress/{progressId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && hasValidUserId() && hasRequiredFields(['userId', 'date', 'weight']);
        allow update: if isOwner(userId) && hasValidUserId();
        allow delete: if isOwner(userId);
      }

      match /ai_sessions/{sessionId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && hasValidUserId() && hasRequiredFields(['userId', 'timestamp', 'userMessage', 'aiResponse']);
        allow update: if isOwner(userId) && hasValidUserId();
        allow delete: if isOwner(userId);
      }
    }

    match /exercises/{exerciseId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /foods/{foodId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /test/{document} {
      allow read, write: if isSignedIn();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Paste and Publish

1. In Firebase Console, **delete all existing rules**
2. **Paste** the new rules from above
3. Click **"Publish"** button (top right)
4. Wait ~5 seconds for deployment

### Step 4: Verify

You should see: **"Rules deployed successfully"**

---

## 📋 Option 2: Deploy via Firebase CLI (For Advanced Users)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Initialize Firebase in Project

```bash
cd C:\Users\lucar\AI-Gym-Trainer
firebase init firestore
```

- Select: **Use an existing project**
- Choose: **ai-gym-trainer-e35e6**
- Firestore rules file: **firestore.rules** (press Enter)
- Firestore indexes file: **firestore.indexes.json** (press Enter)

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

---

## ✅ What Do These Rules Do?

### Security Features:

1. **User Data Protection**
   - Users can ONLY see their own data
   - Can't access other users' workouts, meals, etc.

2. **Authentication Required**
   - Must be signed in to access anything
   - Anonymous users have no access

3. **Data Validation**
   - Ensures required fields are present
   - Validates userId matches authenticated user

4. **Global Collections**
   - Everyone can read exercises & foods
   - Only admins can modify (prevents abuse)

### Example:
```
User A (uid: abc123) tries to read User B's (uid: xyz789) workouts
❌ DENIED - isOwner() check fails

User A tries to read their own workouts
✅ ALLOWED - isOwner() check passes
```

---

## 🧪 Test the New Rules (2 minutes)

After deploying:

1. **Go back to your app**
2. **Click "Test Backend Connection"** again
3. Should still show **✅ success**

The connection works because:
- The `test/` collection allows authenticated writes
- Your BackendService uses that for testing

---

## ⚠️ Important Notes

### Before November 12, 2025:
- Current test mode expires: `2025-11-12`
- Deploy these rules before then
- Or your app will stop working!

### These Rules:
- ✅ Secure for production
- ✅ Allow your app to work normally
- ✅ Prevent unauthorized access
- ✅ Keep `test/` collection for debugging

### Future:
- In Phase 4, we'll add authentication
- These rules will automatically secure user data
- No additional changes needed!

---

## 🆘 Troubleshooting

### "Permission denied" error after deploying
**Fix:** Make sure you're signed in to the app
- The new rules require authentication
- Test mode allowed everything, new rules don't

### "Required fields missing" error
**Fix:** This is good! The rules are validating data
- It means your rules are working
- We'll ensure proper fields in Phases 5-8

### Rules won't save
**Fix:** Check for syntax errors
- Make sure you copied the entire rules block
- No missing brackets or commas

---

## ✅ Phase 3 Checklist

Before moving to Phase 4:

- [ ] `firestore.rules` file exists in project
- [ ] Rules copied to Firebase Console
- [ ] Clicked "Publish" button
- [ ] Saw "Rules deployed successfully"
- [ ] "Test Backend Connection" still works
- [ ] No permission errors in app

---

## 🎉 Once Complete

**You're ready for Phase 4!**

Phase 4 will:
- Integrate authentication with backend
- Create user profiles automatically
- Connect Google Sign-In to Firebase Auth

**Estimated time: 2-3 hours**

---

**Need help?** The full rules are in `firestore.rules` in your project!
