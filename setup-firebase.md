# 🔥 Firebase Setup Guide

## Prerequisites
- ✅ Google account (you have this)
- ✅ Firebase project created (you have this)
- ❌ Firebase CLI authenticated (need to do)

## Step-by-Step Instructions

### 1. Login to Firebase CLI
Open your terminal and run:
```bash
firebase login
```
- A browser window will open
- Login with your Google account
- Allow Firebase CLI access
- Return to terminal when done

### 2. Connect to Your Firebase Project
```bash
firebase use --add
```
- Select your project from the list
- Give it an alias (e.g., "default")

### 3. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```
- This uploads the rules that allow your app to access data
- You should see: ✔ Deploy complete!

### 4. Test Firebase Connection
Run your app:
```bash
npm start
```
- Scan QR code with Expo Go
- The Firebase permission errors should be GONE! ✅

---

## ❓ FAQ

**Q: Do I need Android or iOS developer accounts?**
A: NO! Firebase works independently of app stores.

**Q: Will this work in Expo Go?**
A: YES! Once authenticated properly, Firebase works perfectly in Expo Go.

**Q: What if I see "Missing or insufficient permissions"?**
A: Run `firebase deploy --only firestore:rules` again.

**Q: Is this free?**
A: YES! Firebase has a generous free tier.

---

## 🎯 After Setup

Once complete, you'll have:
- ✅ Cloud data sync across devices
- ✅ Real-time meal and workout backup
- ✅ AI chat history saved
- ✅ No more permission errors!
