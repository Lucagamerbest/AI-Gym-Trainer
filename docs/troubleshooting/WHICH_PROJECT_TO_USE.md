# Which Google Cloud Project Should I Use?

## You Have Multiple Projects - Let's Find the Right One!

You have two Google Cloud projects and need to find which one is for your Workout Wave app.

---

## Step 1: Find the Right Project

### Method A: Look for the Client ID

1. **Open Google Cloud Console**: https://console.cloud.google.com/
2. **Look at the top left** - you'll see a project dropdown
3. Click it to see your projects

**Look for a project that contains your app name**:
- "Workout Wave"
- "workout-wave"
- "AI Gym Trainer"
- Or similar name

### Method B: Use the Client ID to Find It

Your iOS Client ID is: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`

The project number is: **1011295206743**

1. **Click the project dropdown** (top left of Google Cloud Console)
2. **Look for the project number** `1011295206743` next to project names
3. **That's your project!**

---

## Step 2: Once You Find the Right Project

### A. Switch to It

1. Click the **project dropdown** at the top left
2. Click on the project with number `1011295206743`
3. The page will reload with your project selected

### B. Verify It's the Right One

1. Go to **"APIs & Services" → "Credentials"**
2. You should see these Client IDs:
   - iOS client: `1011295206743-rl70k9ibahkkgkf41j8qr6vfneedgb8s`
   - Android client: `1011295206743-ab4i5hlk0qoh9ojqm9itmp932peacv4q`
   - Web client: `1011295206743-8jkfemcg0fcss02fgm14b9lhv282uk33`

3. If you see these, **you're in the right project!** ✅

---

## Step 3: Navigate to OAuth Consent Screen

Now that you're in the right project:

1. **Look at the left sidebar** in Google Cloud Console
2. Click **"APIs & Services"**
3. Click **"OAuth consent screen"**

You should now see the OAuth configuration page!

---

## Visual Guide: Where to Click

### 1. Top of Page - Project Selector
```
┌─────────────────────────────────────────┐
│ ☰  [Project Dropdown ▼]  🔔  👤         │ ← Click here to switch projects
└─────────────────────────────────────────┘
```

### 2. Project Dropdown View
```
┌─────────────────────────────────────────┐
│ Select a project                         │
│                                          │
│ 🔍 Search projects                       │
│                                          │
│ 📁 Project Name 1                        │
│    ID: 1234567890                        │
│                                          │
│ 📁 Workout Wave (or similar)             │ ← Look for this!
│    ID: 1011295206743                     │ ← Your project number
│                                          │
└─────────────────────────────────────────┘
```

### 3. Left Sidebar Navigation
```
┌──────────────────────────┐
│ ☰ Navigation             │
│                          │
│ 🏠 Home                  │
│ 📊 Dashboard             │
│ 🔧 APIs & Services       │ ← Click this
│   ├─ Credentials         │ ← Then this (to verify)
│   ├─ OAuth consent screen│ ← Or this (to fix)
│   └─ Library             │
│                          │
└──────────────────────────┘
```

---

## What to Look For in OAuth Consent Screen

Once you're there, you'll see:

### Current Status
- **Testing** or **Published**
- **Test users**: (list of emails)

### What You Need to Do
1. **Add your email** (`rarauluca@gmail.com`) as a test user
   - OR -
2. **Publish the app** (click button at top)

---

## If You Can't Find the Right Project

### Option 1: Check Firebase Console First

1. Go to: https://console.firebase.google.com/
2. Look for your project there
3. Once you find it, look for the **Project settings** (gear icon)
4. Check the **Project ID** and **Project number**
5. Use that to find it in Google Cloud Console

### Option 2: Create a New OAuth Client

If you're really stuck, you can create a new OAuth setup:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Click **Google**
5. Follow the setup wizard

---

## Quick Checklist

- [ ] I found my project with number `1011295206743`
- [ ] I'm now in that project (check top left)
- [ ] I navigated to "APIs & Services"
- [ ] I can see "OAuth consent screen" option
- [ ] I see the consent screen configuration page

---

## Next Steps After Finding Your Project

Once you're in the OAuth consent screen:

### Option A: Publish the App (FASTEST)
1. Click **"PUBLISH APP"** button at the top of the page
2. Confirm
3. Done! ✅

### Option B: Add Test User
1. Scroll down to **"Test users"** section
2. Click **"ADD USERS"**
3. Type: `rarauluca@gmail.com`
4. Click **"SAVE"**
5. Done! ✅

---

## Still Confused?

Take a screenshot of:
1. The Google Cloud Console project dropdown (showing all your projects)
2. The Credentials page (showing all client IDs)

And I'll help you identify which project to use!

---

## Summary

**What you're looking for:**
- Project number: `1011295206743`
- Project name: Probably "Workout Wave" or similar
- Has iOS client ID ending in `...v282uk33`

**Where to go:**
1. Google Cloud Console → Switch to right project
2. APIs & Services → OAuth consent screen
3. Publish app OR add your email as test user

**Then:**
- Wait 10 minutes
- Restart app
- Try signing in again

You've got this! 🚀
