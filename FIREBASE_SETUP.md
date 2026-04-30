# 🔥 Firebase Setup - Quick Steps

## ✅ What I Did:
1. ✅ Installed Firebase SDK (`npm install firebase`)
2. ✅ Created `firebase.config.js` with placeholder config
3. ✅ Updated `communityService.js` to use Firebase instead of mock data

## 🎯 What YOU Need to Do:

### Step 1: Create Firebase Project (5 minutes)
1. Go to: https://console.firebase.google.com
2. Click "Add project"
3. Name: "NYRA"
4. Disable Google Analytics → Create project

### Step 2: Enable Firestore (2 minutes)
1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. **Choose: "Start in test mode"** ← Important!
4. Select region closest to you
5. Click "Enable"

### Step 3: Enable Authentication (1 minute)
1. Click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Anonymous" → Enable → Save

### Step 4: Get Your Firebase Config (2 minutes)
1. Click Settings ⚙️ → "Project settings"
2. Scroll to "Your apps" section
3. Click Web icon `</>`
4. Register app: "NYRA-App" → Register
5. **COPY** the `firebaseConfig` object

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "nyra-12345.firebaseapp.com",
  projectId: "nyra-12345",
  storageBucket: "nyra-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 5: Update firebase.config.js (1 minute)
1. Open: `firebase.config.js`
2. **Replace** lines 9-15 with YOUR config from Step 4
3. Save the file

### Step 6: Set Firestore Security Rules (2 minutes)
1. In Firebase Console → Firestore Database
2. Click "Rules" tab
3. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all locations
    match /user_locations/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write SOS alerts
    match /sos_alerts/{alertId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.senderId == request.auth.uid;
    }
  }
}
```

4. Click "Publish"

### Step 7: Test It! (2 minutes)
```bash
npx expo start
```

Then in the app:
1. Open hamburger menu → NYRA Community
2. Toggle "Share My Location" ON
3. Select a range (500m/1km/2km)
4. You should see your location saved in Firebase!

## 🔍 Verify It's Working:

**Check Firestore Database:**
1. Go to Firebase Console → Firestore Database
2. You should see:
   - Collection: `user_locations`
   - Document with your user ID
   - Fields: latitude, longitude, status, userName, lastUpdated

**Test with 2 Devices:**
- Install on 2 phones/emulators
- Enable location on both
- They should see each other if within range!

## 🐛 Troubleshooting:

**Error: "Default Firebase app not initialized"**
- Make sure you updated `firebase.config.js` with YOUR config

**Error: "Missing or insufficient permissions"**
- Check Firestore Rules (Step 6)

**Not seeing nearby users:**
- Check that both users have location sharing enabled
- Check they're within selected range (500m/1km/2km)
- Check Firestore to see if locations are being saved

**Location permission denied:**
- Go to phone Settings → Apps → NYRA → Permissions → Enable Location

## 📊 Current Firebase Integration:

✅ **Implemented:**
- Real-time location sharing (updates every 30 seconds)
- Nearby user detection with distance calculation
- SOS broadcasting to Firebase
- Anonymous authentication
- Automatic user status updates

🟡 **Coming Soon (you can add later):**
- Real-time updates (onSnapshot listeners)
- Push notifications for SOS
- Direct messaging between users
- User profiles with names/photos

## 💰 Firebase Free Tier Limits:
- **Firestore Reads:** 50,000/day
- **Firestore Writes:** 20,000/day
- **Storage:** 1 GB
- **Authentication:** Unlimited

**Estimated usage for 100 active users:**
- Location updates: ~300 writes/hour
- Nearby queries: ~100 reads/minute
- You're well within free tier! 🎉

---

**Once you complete Step 5, your NYRA Community feature will be LIVE! 🚀**
