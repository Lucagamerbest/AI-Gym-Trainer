# 📱 BUILD STANDALONE APP - Complete Guide

**Goal:** Create a standalone app you can use WITHOUT localhost + keep development mode

---

## 🎯 WHAT YOU'LL GET

After following this guide, you'll have:

1. **Development Build APK** - Install on your phone, use 24/7 without computer
2. **Localhost Development** - Still works when you want to develop
3. **Easy Switching** - Toggle between standalone and development modes

---

## 📋 PREREQUISITES

✅ EAS CLI installed (already done!)
✅ expo-dev-client installed (already done!)
✅ eas.json configured (already done!)

**Next step:** Login and build!

---

## 🚀 STEP-BY-STEP BUILD PROCESS

### **Step 1: Login to Expo**

Open your terminal and run:

```bash
eas login
```

- If you don't have an Expo account, it will prompt you to create one (FREE)
- Enter your email and password
- You'll stay logged in

---

### **Step 2: Build the Development APK**

This creates the standalone app that can ALSO connect to localhost.

```bash
cd C:\Users\lucar\AI-Gym-Trainer
eas build --platform android --profile development
```

**What happens:**
1. Asks if you want to create a new project (say YES)
2. Uploads your code to Expo servers
3. Builds the APK (takes 10-15 minutes)
4. Gives you a download link

**While it builds:**
- You'll see progress in terminal
- You can close terminal and check status at: https://expo.dev/accounts/[your-username]/projects/ai-gym-trainer/builds
- You'll get email when done

---

### **Step 3: Install on Your Phone**

When build finishes:

1. **Get the APK:**
   - Terminal will show a download link
   - Or go to https://expo.dev → Projects → AI Gym Trainer → Builds
   - Download the APK to your phone

2. **Install:**
   - Open the APK file on your phone
   - Android will ask "Install unknown app?" → Tap "Settings" → Enable "Allow from this source"
   - Tap "Install"

3. **Done!** You now have a standalone app on your phone!

---

## 🔄 HOW TO USE BOTH MODES

### **Mode 1: Standalone (No Computer Needed)**

Just open the app on your phone!

- ✅ Works anywhere
- ✅ No WiFi needed (after data loads)
- ✅ Computer can be off
- ✅ Firebase backend still works

**Use this for:** Daily workouts, logging meals, using AI features

---

### **Mode 2: Development (Connect to Localhost)**

When you want to develop and see changes instantly:

1. **Start dev server on computer:**
   ```bash
   npm start
   ```

2. **On your phone:**
   - Open the development build app
   - Shake device → "Settings"
   - Enter your computer's IP: `192.168.x.x:8081` (shown in terminal)
   - Tap "Reload"

3. **Now you're connected to localhost!**
   - Make changes in VS Code
   - App refreshes automatically
   - Press `r` in terminal to reload

**Use this for:** Testing new features, debugging, development

---

## 💡 SWITCHING BETWEEN MODES

### **To go Standalone → Development:**
```bash
# 1. Start localhost on computer
npm start

# 2. On phone app:
Shake → Settings → Enter localhost URL → Reload
```

### **To go Development → Standalone:**
```bash
# On phone app:
Shake → Settings → Clear localhost URL → Reload
```

Or just close and reopen the app (it defaults to standalone).

---

## 🔄 UPDATING THE APP

### **Option A: Rebuild (For Major Changes)**

When you add new native dependencies or make big changes:

```bash
eas build --platform android --profile development
```

Download and reinstall the new APK.

---

### **Option B: Over-the-Air Update (For Code Changes)**

For small code changes, use Expo Updates (instant, no rebuild needed):

```bash
# Install expo-updates if not already
npx expo install expo-updates

# Publish update
eas update --branch development --message "Added new feature"
```

Next time users open the app, it downloads the update automatically!

---

## 📊 COMPARISON

| Feature | Expo Go (Current) | Development Build | Production Build |
|---------|-------------------|-------------------|------------------|
| Needs computer | ✅ Yes | ❌ No | ❌ No |
| Can connect to localhost | ✅ Yes | ✅ Yes | ❌ No |
| Fast refresh | ✅ Yes | ✅ Yes | ❌ No |
| Works offline | ⚠️ Limited | ✅ Yes | ✅ Yes |
| Easy updates | ✅ Instant | ✅ OTA updates | ⚠️ Rebuild needed |
| Computer must be on | ✅ Yes | ❌ No | ❌ No |

**You want:** Development Build (middle column) ✅

---

## 🎯 RECOMMENDED WORKFLOW

### **Daily Use:**
1. Use standalone development build on phone
2. Computer off, use app normally
3. All features work (AI, Firebase, etc.)

### **When Developing:**
1. Turn on computer
2. Run `npm start`
3. Open dev build app on phone
4. Shake → Connect to localhost
5. Develop with fast refresh
6. When done, disconnect from localhost

### **When Ready to Share:**
1. Build production APK:
   ```bash
   eas build --platform android --profile production
   ```
2. Share APK with friends/testers

---

## 🐛 TROUBLESHOOTING

### "Build failed"
- Check you're logged in: `eas whoami`
- Try again: `eas build --platform android --profile development --clear-cache`

### "Can't connect to localhost"
- Make sure computer and phone on same WiFi
- Check firewall isn't blocking port 8081
- Use IP address, not "localhost"

### "App crashes on startup"
- Check logs: `npx react-native log-android`
- Rebuild: `eas build --platform android --profile development --clear-cache`

---

## 📝 NEXT STEPS

**Right now:**
```bash
# 1. Login to Expo
eas login

# 2. Start the build
eas build --platform android --profile development
```

**In 15 minutes:**
- Download APK from the link
- Install on your phone
- You're done! 🎉

**Tomorrow:**
- Use app standalone (computer off)
- Firebase, AI, everything works!

**When developing:**
- `npm start` on computer
- Connect app to localhost
- Fast refresh works!

---

## ✅ CHECKLIST

Before building:
- [x] EAS CLI installed
- [x] expo-dev-client installed
- [x] eas.json configured
- [ ] Logged in to Expo (`eas login`)
- [ ] Started build (`eas build --platform android --profile development`)

After building:
- [ ] Downloaded APK
- [ ] Installed on phone
- [ ] Tested standalone mode (computer off)
- [ ] Tested development mode (connect to localhost)

---

## 🎉 YOU'RE READY!

Run these two commands to get started:

```bash
# 1. Login
eas login

# 2. Build
eas build --platform android --profile development
```

Then wait 15 minutes and install the APK!

**Want me to walk you through it step-by-step?** Let me know when you're ready! 🚀
