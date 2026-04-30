# 📞 Call → SMS Dual Protection System

## Overview
When an emergency alert is triggered, the app will:
1. **Make an emergency call** to the first contact
2. **Play a pre-recorded audio message** during the call (if recorded)
3. **Automatically send SMS to all contacts** when the call ends

This dual protection ensures contacts are alerted even if they miss the call.

---

## 🔄 How It Works

### Step 1: Emergency Triggered
User activates emergency mode (panic button, sudden stop detection, etc.)

```
User Action → alertService.triggerAlertProcedure()
```

### Step 2: Call Initiated
```javascript
// alertService.js sets up callback
const onCallEnded = async () => {
  console.log('Call ended - sending backup SMS');
  await smsService.sendEmergencySMS(contacts, location);
};

// Set callback before calling
phoneCallService.setCallEndedCallback(onCallEnded);

// Make emergency call
phoneCallService.makeEmergencyCalls(contacts, location, onCallEnded);
```

### Step 3: Native Call Module Monitors State
**CallModule.kt** monitors phone call state:

```kotlin
when (state) {
  CALL_STATE_OFFHOOK -> {
    // Call connected - play audio message
    playAudioInCall(audioFilePath)
  }
  CALL_STATE_IDLE -> {
    // Call ended - emit event to JavaScript
    emit("onEmergencyCallEnded", params)
  }
}
```

### Step 4: JavaScript Receives Event
```javascript
// phoneCallService.js listens for event
callEventEmitter.addListener('onEmergencyCallEnded', () => {
  console.log('Call ended - triggering callback');
  onCallEndedCallback(); // Sends SMS
});
```

### Step 5: SMS Sent Automatically
```javascript
// smsService.js sends SMS to all contacts
await smsService.sendEmergencySMS(contacts, location);
// ✅ All contacts receive SMS with location
```

---

## 🎯 Key Features

### Dual Protection
- ✅ **Call first** - Direct voice communication
- ✅ **SMS backup** - Automatic when call ends
- ✅ **No user interaction** - Fully automatic

### Audio Message During Call
- 📢 Plays pre-recorded emergency message
- 🔊 Uses speakerphone at maximum volume
- 🎙️ Transmits through call's microphone path
- ⏱️ 5-second delay ensures call is fully connected

### Smart SMS Sending
- 📱 Only sends if SMS alerts are enabled in settings
- 🔐 Checks SMS permissions before sending
- 📍 Includes current location in message
- ⚡ Automatic - no manual composer

---

## 🔍 Code Flow Diagram

```
User Triggers Emergency
         ↓
   alertService.js
         ↓
  Sets up callback ─────────┐
         ↓                  │
phoneCallService.js         │
         ↓                  │
  CallModule.kt (Native)    │
         ↓                  │
   Makes phone call         │
         ↓                  │
 Monitors call state        │
         ↓                  │
   OFFHOOK (connected)      │
         ↓                  │
 Plays audio message        │
         ↓                  │
   IDLE (call ended) ───────┤
         ↓                  │
 Emits event to JS ◄────────┘
         ↓
 Callback triggered
         ↓
   smsService.js
         ↓
  Sends SMS to all
         ↓
   ✅ Complete
```

---

## 📝 Event Flow Details

### 1. Call State Monitoring
CallModule.kt uses TelephonyManager to monitor call states:

```kotlin
TelephonyManager.CALL_STATE_IDLE      // Call ended
TelephonyManager.CALL_STATE_RINGING   // Incoming call
TelephonyManager.CALL_STATE_OFFHOOK   // Call connected
```

### 2. Event Emission
When call ends (IDLE state):

```kotlin
reactContext
  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
  .emit("onEmergencyCallEnded", params)
```

### 3. JavaScript Event Listener
phoneCallService.js receives the event:

```javascript
callEventEmitter.addListener('onEmergencyCallEnded', (data) => {
  console.log('Event received:', data);
  if (onCallEndedCallback) {
    onCallEndedCallback();
  }
});
```

---

## 🧪 Testing the Flow

### Test 1: Full Flow
1. Open app and go to Contacts
2. Add emergency contact (your second phone)
3. Go to Settings → Record emergency voice message
4. Trigger emergency (panic button)
5. **Expected:**
   - Call automatically dials first contact
   - Audio message plays during call
   - When call ends, SMS automatically sent
   - Check second phone for SMS

### Test 2: Console Logs
Watch for these logs in Metro bundler:

```
📞 Setting up call-ended callback for SMS backup...
📞 Making emergency calls...
📞 Using native module to call 1 contacts
✅ Native call result: {called: 1}
📞 Call state: OFFHOOK (call connected)
📞 Playing audio message...
📞 Call state: IDLE (call ended)
✅ Successfully emitted onEmergencyCallEnded event
🔔 CALLBACK TRIGGERED: Call ended, preparing to send backup SMS
📱 Dual Protection: Sending backup SMS after call ended
✅ Backup SMS sent successfully after call ended
```

### Test 3: Verify SMS Permissions
```javascript
// In Settings screen
const testSms = async () => {
  const hasSms = await permissionsService.ensureSmsPermission();
  console.log('SMS Permission:', hasSms);
};
```

---

## ⚙️ Configuration

### Enable/Disable Features
In Settings screen or storageService defaults:

```javascript
{
  makeEmergencyCalls: true,     // Enable calls
  sendSmsAlerts: true,          // Enable SMS
  recordAudioOnAlert: true,     // Record audio during emergency
  // ... other settings
}
```

### SMS Message Template
Defined in smsService.js:

```javascript
const message = customMessage || 
  `🚨 EMERGENCY ALERT from ${userName}!\n\n` +
  `I need immediate help!\n` +
  `📍 My location: ${locationText}\n` +
  `🕒 Time: ${timestamp}\n\n` +
  `This is an automated emergency alert. Please respond immediately!`;
```

---

## 🐛 Troubleshooting

### Issue: SMS not sent after call
**Check:**
1. SMS permission granted? → Settings → Permissions
2. SMS alerts enabled? → Settings → Send SMS Alerts
3. Contacts have valid phone numbers?
4. Check Metro console for error logs

**Solution:**
```javascript
// Test SMS manually
import { smsService } from './services/smsService';
const contacts = [{ phone: '+1234567890', name: 'Test' }];
smsService.sendEmergencySMS(contacts, location);
```

### Issue: Event not received in JavaScript
**Check:**
1. Is CallModule properly initialized?
2. Is event listener set up before call?
3. Check Logcat for native errors

**Solution:**
```bash
# Check native logs
adb logcat | grep CallModule
```

### Issue: Audio not playing during call
**Check:**
1. Audio message recorded? → Settings → Emergency Voice Message
2. READ_PHONE_STATE permission granted?
3. Audio file exists at correct path?

**Solution:**
```kotlin
// Check in CallModule.kt logs
Audio file exists: true/false
Audio file size: XXX bytes
```

---

## 📊 Success Indicators

### ✅ Working Correctly
- Console shows "onEmergencyCallEnded event" emitted
- Callback triggered log appears
- SMS sent successfully log appears
- Contact receives SMS after call ends

### ❌ Not Working
- No event emission in logs
- Callback not triggered
- SMS permission errors
- Contact doesn't receive SMS

---

## 🔒 Permissions Required

1. **CALL_PHONE** - Make emergency calls automatically
2. **READ_PHONE_STATE** - Monitor call state changes
3. **SEND_SMS** - Send automatic SMS messages
4. **RECORD_AUDIO** - Record emergency voice message
5. **ACCESS_FINE_LOCATION** - Include location in alerts

All permissions are requested automatically on first use.

---

## 🚀 Enhancements Made

1. ✅ **Better event emitter initialization** with error handling
2. ✅ **Event subscription management** - removes old listeners
3. ✅ **Enhanced logging** throughout the flow
4. ✅ **Permission checks** before sending SMS
5. ✅ **Cleanup function** to prevent memory leaks
6. ✅ **Detailed event parameters** for debugging
7. ✅ **Try-catch blocks** for robust error handling

---

## 📱 User Experience

From the user's perspective:
1. **Press panic button**
2. **Phone automatically calls** emergency contact
3. **Contact hears** pre-recorded message
4. **Call ends**
5. **All contacts receive SMS** with location
6. **User can focus** on the emergency

**Zero manual interaction required after initial trigger!** 🎯
