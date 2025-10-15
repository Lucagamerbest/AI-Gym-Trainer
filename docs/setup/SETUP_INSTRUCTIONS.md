# Setup Instructions - Phase 1

## ✅ Completed Steps

1. ✅ Technology stack decided (Firebase + Claude AI)
2. ✅ Dependencies installed
3. ✅ Directory structure created
4. ✅ .gitignore updated
5. ✅ .env.local template created

## 🔑 Next Steps: Get Your API Keys

### Step 1: Create Firebase Project (15 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: **ai-gym-trainer**
4. Disable Google Analytics (not needed for now)
5. Click "Create project"

**Enable Firestore:**
1. In left sidebar, click "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode"
4. Choose a location (us-central1 recommended)
5. Click "Enable"

**Enable Authentication:**
1. In left sidebar, click "Authentication"
2. Click "Get started"
3. Click "Google" sign-in method
4. Toggle "Enable"
5. Add support email (your email)
6. Click "Save"

**Get Firebase Config:**
1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register app: nickname "ai-gym-trainer-app"
6. Copy the config values (firebaseConfig object)
7. Paste these values into `.env.local`

Example of what you'll see:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ai-gym-trainer-xxxxx.firebaseapp.com",
  projectId: "ai-gym-trainer-xxxxx",
  storageBucket: "ai-gym-trainer-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 2: Get Claude AI API Key (10 minutes)

1. Go to https://console.anthropic.com/
2. Click "Sign up" (or sign in if you have an account)
3. Verify your email
4. Click on your profile → "API Keys"
5. Click "Create Key"
6. Name it: "ai-gym-trainer-dev"
7. Copy the key (starts with `sk-ant-`)
8. **IMPORTANT**: Add credits to your account:
   - Click "Billing" in sidebar
   - Click "Purchase credits"
   - Add $5-10 to start (should last months for development)

9. Paste the API key into `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Fill in .env.local

Open `.env.local` and replace the placeholder values:

```env
# Firebase - Copy from Firebase Console
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_AUTH_DOMAIN=ai-gym-trainer-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=ai-gym-trainer-xxxxx
FIREBASE_STORAGE_BUCKET=ai-gym-trainer-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Claude AI - Copy from Anthropic Console
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

NODE_ENV=development
```

### Step 4: Restart Development Server

After filling in your keys:

1. **Stop** the current dev server (Ctrl+C in all terminals)
2. **Clear** Metro bundler cache:
   ```bash
   npx expo start --clear
   ```
3. If you see any import errors, restart again

### Step 5: Test Configuration (Phase 2)

You'll test the configuration in Phase 2 by:
1. Creating Firebase initialization code
2. Creating AI service
3. Testing connections via Debug screen

## 📋 Checklist

Before moving to Phase 2, verify:
- [ ] Firebase project created
- [ ] Firestore Database enabled (test mode)
- [ ] Google Authentication enabled
- [ ] Firebase config copied to .env.local
- [ ] Claude AI account created
- [ ] API credits added ($5-10)
- [ ] Claude API key copied to .env.local
- [ ] Development server restarted

## ⚠️ Security Reminders

- ✅ .env.local is in .gitignore (already done)
- ⚠️ NEVER commit .env.local to git
- ⚠️ NEVER share your API keys publicly
- ⚠️ NEVER screenshot .env.local and post online

## 💰 Cost Tracking

**Firebase (Free Tier):**
- Firestore: 50K reads/day, 20K writes/day - FREE
- Authentication: Unlimited - FREE
- Storage: 1GB - FREE

**Claude AI (Pay-as-you-go):**
- Development: ~$0.10 - $1.00 per day
- Expected: $5-10 per month during development
- Production: ~$30-80 per month for 1000 active users

## 🆘 Troubleshooting

**"Module not found @env"**
- Make sure you restarted the dev server after editing babel.config.js
- Try: `npx expo start --clear`

**"Firebase: API key not valid"**
- Check that you copied the entire API key (no spaces)
- Verify it's from the correct Firebase project
- Make sure .env.local has no spaces around the = sign

**"Anthropic API authentication failed"**
- Verify the API key starts with `sk-ant-`
- Check that you added credits to your account
- Try creating a new API key

## 🎉 What's Next?

Once your .env.local is filled and server restarted, you're ready for:
- **Phase 2**: Backend Initialization (Create Firebase config and test connection)

---

**Phase 1 Complete!** 🎊

Time spent: ~30-45 minutes
Next phase: Phase 2 - Backend Initialization (2-3 hours)
