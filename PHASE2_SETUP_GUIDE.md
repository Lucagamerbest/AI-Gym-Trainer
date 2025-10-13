# Phase 2 Setup Guide - Get Your API Keys

## ✅ What's Already Done
- ✅ Firebase config file created
- ✅ BackendService created
- ✅ Debug screen updated with test button
- ✅ Gemini SDK installed (FREE)

## 🔑 What YOU Need to Do

### Step 1: Get Firebase Credentials (15 minutes)

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create Project**
   - Click "Add project"
   - Project name: **ai-gym-trainer**
   - Disable Google Analytics (not needed)
   - Click "Create project"

3. **Enable Firestore Database**
   - In left sidebar: Click "Firestore Database"
   - Click "Create database"
   - Select "Start in **test mode**" (important!)
   - Choose location: **us-central1**
   - Click "Enable"

4. **Enable Authentication**
   - In left sidebar: Click "Authentication"
   - Click "Get started"
   - Click "Google" sign-in method
   - Toggle "Enable"
   - Add support email (your email)
   - Click "Save"

5. **Get Your Firebase Config**
   - Click gear icon ⚙️ next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Register app: nickname "ai-gym-trainer-app"
   - **Copy the config object**

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ai-gym-trainer-xxxxx.firebaseapp.com",
  projectId: "ai-gym-trainer-xxxxx",
  storageBucket: "ai-gym-trainer-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

---

### Step 2: Get Gemini API Key (5 minutes) - FREE!

1. **Go to Google AI Studio**
   - Open: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project"
   - Copy the API key (starts with `AIza...`)

**No credit card required! It's FREE!**

---

### Step 3: Fill in .env.local (5 minutes)

Open the `.env.local` file in your project and paste your credentials:

```env
# ========================================
# FIREBASE CONFIGURATION
# ========================================
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=ai-gym-trainer-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=ai-gym-trainer-xxxxx
FIREBASE_STORAGE_BUCKET=ai-gym-trainer-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# ========================================
# GOOGLE GEMINI AI (FREE!)
# ========================================
GOOGLE_GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ========================================
# ENVIRONMENT
# ========================================
NODE_ENV=development
```

**IMPORTANT**:
- No spaces around `=` signs
- No quotes around values
- Copy entire keys (no truncation)

---

### Step 4: Restart Dev Server

After filling in `.env.local`:

1. **Stop all running servers**
   - Press `Ctrl+C` in terminal(s)

2. **Clear cache and restart**
   ```bash
   npx expo start --clear
   ```

3. **Wait for Metro to bundle**
   - Should take ~30-60 seconds

---

### Step 5: Test Connection 🧪

1. **Open your app** (in simulator or Expo Go)

2. **Navigate to Debug Screen**
   - Go to Profile tab
   - Or however you access Debug screen

3. **Click "Test Backend Connection" button**

4. **Expected Result:**
   - Should show "✅ Connected to Firebase!"
   - Alert popup: "Firebase backend connected successfully!"

---

## ❌ Troubleshooting

### Error: "Module not found: @env"
**Fix:**
```bash
# Stop server (Ctrl+C)
npx expo start --clear
```

### Error: "Firebase: API key not valid"
**Fix:**
- Check you copied the entire API key
- No spaces around `=` in .env.local
- Restart dev server

### Error: "Firebase initialization error"
**Fix:**
- Verify all 6 Firebase variables are filled
- Check project ID matches Firebase console
- Make sure you created Firestore database
- Restart dev server

### Error: "Permission denied"
**Fix:**
- Go to Firebase Console
- Firestore Database → Rules
- Make sure it says:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

---

## ✅ Phase 2 Checklist

Before moving to Phase 3:

- [ ] Firebase project created
- [ ] Firestore Database enabled (test mode)
- [ ] Google Authentication enabled
- [ ] Firebase config copied to .env.local
- [ ] Gemini API key obtained (FREE)
- [ ] Gemini key copied to .env.local
- [ ] Dev server restarted with --clear
- [ ] "Test Backend Connection" button shows ✅ success

---

## 🎉 Once All Checks Pass

**You're ready for Phase 3!**

Phase 3 will:
- Design database schema
- Create TypeScript type definitions
- Set up database security rules

**Estimated time: 2-3 hours**

---

## 💡 Pro Tips

1. **Keep Firebase Console Open**
   - You'll use it often during development
   - Bookmark: https://console.firebase.google.com/

2. **Free Tier Limits** (More than enough!)
   - Firestore: 50K reads/day, 20K writes/day
   - Gemini: 1,500 requests/day
   - You won't hit these during development

3. **Security Notes**
   - Never commit .env.local (already in .gitignore)
   - Never screenshot your API keys
   - You can regenerate keys if needed

---

**Need Help?** Check the main SETUP_INSTRUCTIONS.md or ask questions!
