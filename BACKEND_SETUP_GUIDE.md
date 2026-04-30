# 🚀 NYRA Community Backend Setup Guide

## Overview
To make the NYRA Community feature work in real-time, you need a backend with:
1. **Database** - Store user locations, SOS alerts
2. **API Server** - Handle requests from mobile app
3. **Real-time Communication** - WebSocket or Firebase for live updates

---

## 📋 Choose Your Backend Approach

### **Option 1: Firebase (Recommended for Quick Start)**

#### ✅ Pros:
- No backend code needed
- Built-in authentication
- Real-time updates out of the box
- Free tier available
- Easy to scale

#### ❌ Cons:
- Vendor lock-in
- Less control over data
- Can get expensive at scale

#### Setup Steps:

1. **Install Firebase Dependencies**
```bash
npm install firebase
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth
```

2. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project "NYRA"
   - Enable Firestore Database
   - Enable Authentication (Phone/Email)

3. **Add Firebase Config to App**
```javascript
// firebase.config.js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:android:abc123"
};

const app = initializeApp(firebaseConfig);
export default app;
```

4. **Create Firestore Collections**
   - `user_locations`: { userId, userName, latitude, longitude, status, lastUpdated }
   - `sos_alerts`: { senderId, senderName, message, latitude, longitude, timestamp }
   - `notifications`: { userId, type, senderId, message, timestamp, read }

5. **Set Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_locations/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /sos_alerts/{alertId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

6. **Replace communityService.js**
   - Use `communityService-firebase.js` (already created)
   - Rename it to `communityService.js`

---

### **Option 2: Custom Backend (Node.js + MongoDB + Socket.io)**

#### ✅ Pros:
- Full control over data and logic
- No vendor lock-in
- Can optimize for your specific needs
- Better for complex business logic

#### ❌ Cons:
- Need to manage server infrastructure
- More code to maintain
- Need to handle scaling yourself

#### Setup Steps:

1. **Create Backend Folder**
```bash
mkdir nyra-backend
cd nyra-backend
npm init -y
```

2. **Install Dependencies**
```bash
npm install express mongoose socket.io cors dotenv
npm install nodemon --save-dev
```

3. **Setup MongoDB**
   - **Cloud Option**: Create free cluster at https://www.mongodb.com/cloud/atlas
   - **Local Option**: Install MongoDB locally

4. **Create Server** (use `backend-example/server.js` already created)

5. **Create .env File**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nyra
PORT=3000
JWT_SECRET=your_secret_key_here
```

6. **Start Server**
```bash
node server.js
# or with nodemon for auto-reload
npx nodemon server.js
```

7. **Update Mobile App**
   - Update `communityService.js` with your server URL
   - Install socket.io-client: `npm install socket.io-client`

---

## 📱 Mobile App Integration

### For Custom Backend:

```javascript
// communityService.js
import io from 'socket.io-client';

const BACKEND_URL = 'http://YOUR_SERVER_IP:3000'; // Replace with your server

// Initialize socket connection
const socket = io(BACKEND_URL);

socket.on('connect', () => {
  console.log('✅ Connected to NYRA server');
  socket.emit('join', userId);
});

socket.on('location_update', (data) => {
  console.log('📍 Location update received:', data);
  // Update nearby users list
});

socket.on(`sos_alert_${userId}`, (alert) => {
  console.log('🚨 SOS Alert received:', alert);
  // Show notification to user
});

// Update location
export const updateLocation = async (latitude, longitude) => {
  socket.emit('update_location', {
    userId,
    userName,
    latitude,
    longitude,
    status: 'safe',
  });
  
  // Also save to database via REST API
  await fetch(`${BACKEND_URL}/api/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName, latitude, longitude }),
  });
};
```

---

## 🔐 Security Considerations

### 1. **Authentication**
- Use Firebase Auth or JWT tokens
- Never store user credentials in app
- Validate all API requests

### 2. **Location Privacy**
- Only share location when user enables it
- Allow users to control who can see them
- Auto-expire old locations (e.g., after 5 minutes offline)

### 3. **Database Security**
- Set proper Firestore/MongoDB rules
- Use HTTPS for all API calls
- Sanitize all inputs

### 4. **Rate Limiting**
- Prevent abuse of SOS feature
- Limit location updates (e.g., max 1 per 10 seconds)

---

## 📊 Database Schema

### MongoDB Collections:

```javascript
// user_locations
{
  _id: ObjectId,
  userId: String (unique),
  userName: String,
  latitude: Number,
  longitude: Number,
  status: String ['safe', 'alert', 'emergency', 'offline'],
  lastUpdated: Date
}

// sos_alerts
{
  _id: ObjectId,
  senderId: String,
  senderName: String,
  message: String,
  latitude: Number,
  longitude: Number,
  timestamp: Date,
  status: String ['active', 'resolved', 'cancelled']
}

// users (for authentication)
{
  _id: ObjectId,
  phone: String (unique),
  name: String,
  email: String,
  emergencyContacts: Array,
  createdAt: Date
}
```

---

## 🧪 Testing

### 1. **Test with Mock Data**
- Use current `communityService.js` with mock users
- Test UI and UX flow

### 2. **Test with Backend**
- Start your backend server
- Connect mobile app to server
- Test with multiple devices/emulators

### 3. **Test Scenarios**
- Location sharing on/off
- Different distance ranges
- SOS broadcasting
- Multiple users nearby
- Network disconnection

---

## 🚀 Deployment

### Firebase:
- Already deployed when you publish to Firestore
- Just need to publish your mobile app

### Custom Backend:
1. **Deploy to Cloud Platform**:
   - **Heroku**: `git push heroku main`
   - **AWS EC2**: Set up instance and deploy
   - **DigitalOcean**: Use droplet with Node.js
   - **Vercel/Netlify**: For serverless functions

2. **Set Environment Variables** on server

3. **Update Mobile App** with production URL

---

## 💡 Quick Start Recommendation

**For fastest setup (1-2 hours):**
1. Use **Firebase** for backend
2. Follow Firebase setup steps above
3. Use `communityService-firebase.js`
4. Test with 2 phones

**For production-ready (1-2 days):**
1. Build **Custom Backend**
2. Deploy to cloud platform
3. Add authentication & security
4. Test thoroughly with real users

---

## 📞 Support

Need help? Common issues:
- **Can't connect to backend**: Check firewall, CORS settings
- **Location not updating**: Check permissions, socket connection
- **SOS not received**: Check notification settings, socket events
- **Database errors**: Check MongoDB connection string, Firestore rules

---

## 🎯 Next Steps

1. Choose your backend approach (Firebase vs Custom)
2. Set up database and authentication
3. Update `communityService.js` with real implementation
4. Test with multiple devices
5. Add push notifications for SOS alerts
6. Deploy to production

**Your current app has mock data working. Once backend is ready, just replace the service file!**
