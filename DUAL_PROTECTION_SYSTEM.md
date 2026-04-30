# 🔐 NYRA Dual Protection Emergency Alert System

## Overview
NYRA implements a **two-layer security system** for emergency alerts, combining automated phone calls with automatic SMS backup to ensure maximum reliability.

## How It Works

### 🎯 Emergency Alert Flow

```
User Triggers Emergency
         ↓
    [Audio Recording Starts] (if enabled)
         ↓
    [Emergency Call Made]
         ↓
    Call Connects → Pre-recorded audio plays
         ↓
    [Call Ends] ← CRITICAL TRIGGER POINT
         ↓
    [SMS Automatically Sent] ← BACKUP PROTECTION LAYER
```

### 📞 Layer 1: Emergency Phone Call

**File:** `services/phoneCallService.js`

1. **Automatic Dialing** (Android with CallModule)
   - Uses native Android `CallModule` to automatically dial emergency contacts
   - NO user interaction required - calls are placed instantly
   - Supports pre-recorded emergency voice messages

2. **Audio Playback During Call**
   - When call connects (CALL_STATE_OFFHOOK), plays pre-recorded emergency audio
   - Audio is played through speaker at maximum volume
   - Audio routing optimized for transmission to recipient

3. **Call State Monitoring**
   - Native Android CallModule monitors call state via TelephonyManager
   - Detects when call ends (CALL_STATE_IDLE)
   - **Triggers SMS backup when call ends**

**Native Implementation:** `android/app/src/main/java/com/nyra/safetyapp/CallModule.kt`

```kotlin
// When call ends, emit event to JavaScript
TelephonyManager.CALL_STATE_IDLE -> {
    Log.d(TAG, "📞 Call state: IDLE (call ended)")
    
    // Emit event to trigger SMS backup
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onEmergencyCallEnded", params)
    
    Log.d(TAG, "✅ Successfully emitted onEmergencyCallEnded event for SMS backup")
}
```

### 📱 Layer 2: Automatic SMS Backup

**File:** `services/smsService.js`

1. **Event-Driven Activation**
   - JavaScript event listener receives `onEmergencyCallEnded` event
   - Callback function immediately triggers SMS sending

2. **Automatic SMS Transmission** (Android with SmsModule)
   - Uses native Android `SmsModule.sendSms()` for direct SMS sending
   - NO SMS composer - messages sent automatically in background
   - NO user confirmation required - fully automated

3. **Silent Mode**
   - When triggered after call ends, operates in silent mode (`silent: true`)
   - No UI alerts or dialogs that could interrupt emergency flow
   - Logs all actions to console for debugging

**Native Implementation:** `android/app/src/main/java/com/nyra/safetyapp/SmsModule.kt`

```kotlin
@ReactMethod
fun sendSms(phoneNumber: String, message: String, promise: Promise) {
    val smsManager = SmsManager.getDefault()
    smsManager.sendTextMessage(phoneNumber, null, message, null, null)
    // SMS sent automatically - no user interaction
}
```

## 🔄 Complete Alert Flow

**File:** `services/alertService.js` - `triggerAlertProcedure()`

### Step 1: Initialization
```javascript
const contacts = await loadContacts();
const settings = await loadSettings();
const location = locationService.getLastKnownLocation();
```

### Step 2: Audio Recording (if enabled)
```javascript
if (settings.recordAudioOnAlert) {
    await audioRecordingService.startRecording(300000); // 5 minutes
}
```

### Step 3: Define SMS Backup Callback
```javascript
const onCallEnded = async () => {
    console.log('🔔 CALLBACK TRIGGERED: Call ended, activating SMS backup layer');
    
    // Send automatic SMS in SILENT mode (no alerts)
    const smsResult = await smsService.sendEmergencySMS(
        contacts, 
        location, 
        null,    // no custom message
        true     // SILENT MODE - no UI interruptions
    );
    
    console.log('✅ 🔐 DUAL PROTECTION SMS sent successfully');
};
```

### Step 4: Register Callback & Make Calls
```javascript
// Register callback BEFORE making calls
phoneCallService.setCallEndedCallback(onCallEnded);

// Make emergency calls
const callResult = await phoneCallService.makeEmergencyCalls(
    contacts, 
    location, 
    onCallEnded
);

if (callsSuccessful) {
    console.log('📱 🔐 SMS will be automatically sent when call ends (DUAL PROTECTION)');
    return; // SMS handled by callback
}
```

### Step 5: Fallback SMS (if calls fail)
```javascript
// Only reached if calls failed or are disabled
if (settings.sendSmsAlerts && !callsSuccessful) {
    await smsService.sendEmergencySMS(contacts, location);
}
```

## 🛡️ Protection Scenarios

### Scenario 1: Normal Emergency (Both Enabled)
1. ✅ Emergency call placed automatically
2. ✅ Recipient hears pre-recorded message
3. ✅ User hangs up or call disconnects
4. ✅ **SMS automatically sent** to all contacts
5. ✅ **Result:** Double confirmation - call + text

### Scenario 2: Call Fails (Network Issue)
1. ❌ Emergency call fails
2. ✅ **Immediate SMS fallback** kicks in
3. ✅ SMS sent to all contacts
4. ✅ **Result:** SMS ensures help is notified

### Scenario 3: Only SMS Enabled
1. ⏭️ Calls skipped (disabled in settings)
2. ✅ SMS sent immediately
3. ✅ **Result:** Fast SMS-only alert

### Scenario 4: Only Calls Enabled
1. ✅ Emergency call placed
2. ⏭️ No SMS sent (disabled in settings)
3. ✅ **Result:** Call-only alert

## 📋 Technical Requirements

### Android Native Modules Required
1. **CallModule** (`CallModule.kt`)
   - Permission: `CALL_PHONE`
   - Permission: `READ_PHONE_STATE`
   - Features: Direct calling, call state monitoring, event emission

2. **SmsModule** (`SmsModule.kt`)
   - Permission: `SEND_SMS`
   - Features: Direct SMS sending without composer

### JavaScript Services
1. **alertService.js** - Orchestrates entire alert flow
2. **phoneCallService.js** - Manages calls and event listeners
3. **smsService.js** - Handles automatic SMS sending
4. **permissionsService.js** - Ensures all permissions granted

## 🔧 Configuration

### Enable/Disable Features (Settings Screen)
```javascript
{
    makeEmergencyCalls: true,    // Enable Layer 1 (Calls)
    sendSmsAlerts: true,         // Enable Layer 2 (SMS)
    recordAudioOnAlert: true     // Pre-record emergency message
}
```

### SMS Message Format
```
🚨 EMERGENCY ALERT from NYRA: I may be in danger and need help!
My location: https://www.google.com/maps/search/?api=1&query=LAT,LON
```

## 🧪 Testing the System

### Test Dual Protection
1. Add test emergency contact (your own phone)
2. Enable both "Emergency Calls" and "SMS Alerts" in Settings
3. Record emergency voice message in Settings
4. Trigger emergency (Panic Button or SOS)
5. **Expected Result:**
   - ✅ Phone automatically calls contact
   - ✅ Pre-recorded message plays during call
   - ✅ When call ends, SMS automatically sent
   - ✅ Contact receives BOTH call AND text

### Console Logs to Watch
```
📞 Making emergency calls...
📞 Call state: OFFHOOK (call connected)
🎙️ Playing emergency audio...
📞 Call state: IDLE (call ended)
🔔 CALLBACK TRIGGERED: Call ended, activating SMS backup layer
📱 🔐 DUAL PROTECTION: Sending automatic SMS after call ended
✅ 🔐 DUAL PROTECTION SMS sent successfully after call ended
```

## ⚡ Performance Notes

- **SMS Delay:** 2 seconds between each SMS to avoid carrier spam detection
- **Call-to-SMS Delay:** ~1-2 seconds after call ends
- **Audio Playback Delay:** 5 seconds after call connects (ensures audio routing stability)
- **Total Protection Time:** ~10-15 seconds for complete dual alert

## 🚀 Deployment Requirements

**CRITICAL:** This system requires a **development build** with native modules.

```bash
# Build development APK with native modules
cd android
./gradlew assembleDebug

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Won't work in:** Expo Go (native modules not available)

## 📊 Success Indicators

✅ **System Working Correctly:**
- No SMS composer appears (automatic sending)
- No user confirmation dialogs during emergency
- Console shows "DUAL PROTECTION SMS sent successfully"
- Emergency contacts receive both call and text

❌ **System Not Working:**
- SMS composer opens (native module not available)
- User must manually send SMS
- Using Expo Go instead of development build

## 🔍 Troubleshooting

### SMS Not Sent After Call
1. Check permissions: Settings → Apps → NYRA → Permissions → SMS ✅
2. Check phone permission: READ_PHONE_STATE ✅
3. View logs: `adb logcat | grep CallModule`
4. Ensure using development build (not Expo Go)

### Call Doesn't Auto-Dial
1. Check permission: CALL_PHONE ✅
2. Verify CallModule loaded: Check startup logs
3. Ensure development build with native modules

### No Audio During Call
1. Record emergency message first: Settings → Emergency Voice Message
2. Check audio file exists in console logs
3. Ensure READ_PHONE_STATE permission granted

## 📝 Summary

The NYRA Dual Protection System ensures **maximum reliability** by combining:
1. **Primary:** Automatic emergency calls with pre-recorded audio
2. **Backup:** Automatic SMS sent when call ends
3. **Fallback:** Immediate SMS if calls fail

This creates a **fail-safe emergency alert system** that adapts to any situation, ensuring help is always notified when danger strikes.

---

**Built with ❤️ for user safety**
**Last Updated:** January 31, 2026
