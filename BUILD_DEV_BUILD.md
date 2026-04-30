# Build Development Build for Custom Native Modules

## Why You Need This

**Expo Go** doesn't support custom native modules like `SmsModule`. To use automatic SMS features, you need to build a **development build**.

## Current Issue

You're running the app in **Expo Go**, which shows:
```
LOG  📱 SMS composer opened for Rakesh
```

This means the `SmsModule` is **not available** and falls back to manual SMS composer.

## Solution: Build Development Build

### Option 1: Build Locally (Recommended for Testing)

```bash
# 1. Install EAS CLI if not already installed
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS
eas build:configure

# 4. Build for Android (development)
eas build --profile development --platform android

# Wait for build to complete (10-20 minutes)
# Download and install the APK on your device
```

### Option 2: Local Android Build (Faster for Testing)

```bash
# 1. Make sure Android Studio is installed with SDK

# 2. Start Metro bundler
npx expo start --dev-client

# 3. In another terminal, build Android APK
cd android
./gradlew assembleDebug

# 4. Install APK from: android/app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Option 3: Use Expo Development Build (Cloud Build)

```bash
# This builds in the cloud (requires Expo account)
npx expo install expo-dev-client

# Build for Android
eas build --profile development --platform android
```

## After Building

Once you install the development build on your device:

1. **Launch the app** (not Expo Go)
2. The app will show the QR code scanner
3. Run `npx expo start --dev-client` in your terminal
4. Scan the QR code with the development build app

Now the logs will show:
```
✅ SmsModule available: true
📱 Sending automatic alert to Rakesh (+919876543210)...
✅ Alert SMS sent to Rakesh
```

## Verify SMS Module is Loaded

After installing the development build, check the logs:
- ✅ **Working**: `LOG  📱 SmsModule available: true`
- ❌ **Not working**: `LOG  📱 Falling back to SMS composer`

## Important Notes

1. **Expo Go** = Cannot use SmsModule (only standard Expo modules)
2. **Development Build** = Can use SmsModule (includes native code)
3. **Production Build** = Full APK with all features

## Quick Test

After building, try sending an alert. You should see:
```
LOG  📱 Sending automatic alert to User (+91XXXXXXXXXX)...
LOG  ✅ SmsModule available: true
LOG  ✅ Alert SMS sent to User
```

Instead of:
```
LOG  📱 Falling back to SMS composer (Platform: android, SmsModule: false)
LOG  📱 SMS composer opened for User
```
