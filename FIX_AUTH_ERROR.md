# 🔐 Enable Firebase Anonymous Authentication

## ⚠️ CRITICAL: You must enable Anonymous Auth in Firebase Console!

**Error you're seeing:**
```
Error: auth/admin-restricted-operation
```

This means Anonymous Authentication is **not enabled** in your Firebase project.

---

## ✅ Quick Fix (2 minutes):

### **Step 1: Open Firebase Console**
https://console.firebase.google.com/project/nyra-cff77/authentication/providers

### **Step 2: Enable Anonymous Auth**
1. Click "**Get started**" (if you see it)
2. Find "**Anonymous**" in the providers list
3. Click on it
4. Toggle the switch to **Enabled**
5. Click "**Save**"

### **Step 3: Test**
After enabling, restart your app:
1. Press `r` in the Expo terminal to reload
2. Go to NYRA Community screen
3. Toggle "Share My Location"
4. Should work now! ✅

---

## ✅ What I Fixed in Code:

1. ✅ Installed `@react-native-async-storage/async-storage`
2. ✅ Updated `firebase.config.js` to use AsyncStorage persistence
3. ✅ Fixed the AsyncStorage warning

**The only thing YOU need to do is enable Anonymous Auth in Firebase Console!**

---

## 🧪 How to Verify It's Working:

After enabling auth, check Firebase Console:
- **Authentication** → Users tab
- You should see anonymous users appear when they use the app
- **Firestore** → Data
- You should see `user_locations` collection with user data

---

## 📱 Alternative: Enable via Firebase CLI (Optional)

If you want to use terminal:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project (in your app directory)
cd C:\Users\Abhishek\OneDrive\Desktop\nyra-final-innerve\nyra-innerveX\NYRA-app
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

**But for enabling auth, you MUST use Firebase Console web interface.**
