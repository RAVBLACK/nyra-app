# Nyra Community Features - Enhanced

## Overview
The Nyra Community feature allows users to connect with nearby Nyra app users for emergency assistance and safety support. The enhanced version includes automatic SMS alerts, accurate distance calculation, and real-time location sharing.

## Key Features

### 1. **Real-Time Location Sharing**
- Users can enable/disable location sharing with a single toggle
- Location updates every 10 seconds for maximum accuracy
- Customizable search radius (500m, 1km, 2km)
- Real-time updates when nearby users join or leave
- GPS accuracy indicator shown for each user (±accuracy in meters)

### 2. **Enhanced Distance Calculation**
- **Haversine Formula**: Uses Earth's curvature for accurate distance calculation
- **Coordinate Validation**: Validates latitude/longitude before calculation
- **Accuracy Rounding**: Rounds to 0.1m precision for better readability
- **Error Handling**: Returns Infinity for invalid coordinates to prevent crashes
- **GPS Accuracy Display**: Shows ±accuracy for each user's location

### 3. **Automatic SMS Alerts (Android)**
When a user triggers an alert or SOS:
- **Automatic Sending**: SMS sent without user intervention on Android
- **Native SMS Module**: Uses SmsModule for direct SMS delivery
- **iOS Fallback**: Opens SMS composer on iOS
- **Smart Delays**: 1-second delay between messages to avoid carrier spam detection
- **Location Included**: Google Maps link with exact coordinates
- **Distance Info**: Shows distance between users in the SMS

### 4. **Individual User Alerts**
Users can send alerts to specific nearby users:
- Click on any user card to open contact options
- **Send Alert SMS**: Automatic SMS with custom message
- **View on Map**: Opens user's location in Google Maps
- **Automatic Message**: Includes sender location, distance, and request for help
- **Status Indicator**: Shows if SMS was sent automatically or via composer

### 5. **Emergency SOS Broadcast**
Send emergency alerts to all nearby users:
- **Automatic SMS**: Sent to all users with phone numbers (up to 2km radius)
- **App Notification**: All nearby users alerted in Firestore
- **Emergency Status**: User's status changed to "emergency" in database
- **SMS Count**: Shows how many automatic SMS were sent
- **Success Feedback**: Confirms alert delivery to all recipients

## Technical Implementation

### Distance Calculation
```javascript
// Enhanced Haversine formula with validation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Validates coordinates
    // Uses Earth's radius (6371km)
    // Returns distance in meters with 0.1m precision
}
```

### Automatic SMS Sending
```javascript
// Android automatic SMS
await SmsModule.sendSms(phoneNumber, message);

// iOS fallback
await SMS.sendSMSAsync([phoneNumber], message);
```

### Real-Time Updates
```javascript
// Firestore listener for nearby users
onSnapshot(query, (snapshot) => {
    // Calculates distance for each user
    // Filters by maxDistance
    // Sorts by proximity
    // Updates UI in real-time
});
```

## User Flow

### Enabling Location Sharing
1. User opens Community Screen
2. Sets up profile (name + phone number) if not done
3. Toggles "Location Sharing" switch ON
4. Selects desired range (500m/1km/2km)
5. Location shared to Firestore every 10 seconds
6. Nearby users appear in real-time

### Sending Individual Alert
1. User sees nearby NYRA users in list
2. Taps on a user card
3. Selects "Send Alert SMS"
4. Enters custom message or uses default
5. SMS sent automatically (Android) or composer opened (iOS)
6. User receives SMS with sender's location and distance

### Sending Emergency SOS
1. User in emergency taps "Send SOS" button
2. Confirmation dialog shows recipient count
3. User confirms
4. Automatic SMS sent to all nearby users with phones
5. Firestore alert created
6. User's status changed to "emergency"
7. All nearby users see emergency status

## SMS Message Format

### Individual Alert
```
🚨 NYRA ALERT from [Sender Name]
[Custom Message]

My Location: https://maps.google.com/?q=lat,lng
Distance: [distance] away

Open NYRA app for details
```

### SOS Broadcast
```
🆘 NYRA EMERGENCY from [Sender Name]
🆘 EMERGENCY! I need help immediately!

Location: https://maps.google.com/?q=lat,lng
Distance: Check NYRA app

Open NYRA to help!
```

## Accuracy Features

### Location Accuracy
- **High Accuracy Mode**: Uses GPS with highest accuracy setting
- **10-Second Updates**: Frequent updates for real-time tracking
- **10-Meter Threshold**: Updates when user moves 10+ meters
- **Accuracy Display**: Shows ±accuracy for each user location
- **Validation**: Checks for invalid coordinates before calculations

### Distance Accuracy
- **Haversine Formula**: Accounts for Earth's curvature
- **Coordinate Validation**: Prevents errors from invalid data
- **0.1m Precision**: Rounds to one decimal place
- **GPS Accuracy Factor**: Displays actual GPS accuracy for transparency

## Privacy & Security

### Data Protection
- Only shared with active Nyra users
- Location sharing can be disabled anytime
- User controls visibility radius
- Phone numbers only shown to nearby users
- Location data deleted when sharing stopped

### Emergency Protocol
- SOS alerts stored in Firestore for audit
- Emergency status visible to all nearby users
- Automatic SMS ensures rapid response
- Location links work without app

## Future Enhancements

### Planned Features
1. **In-App Messaging**: Direct chat without SMS
2. **Voice Calls**: Direct calling through app
3. **Group Alerts**: Create safety groups
4. **Route Sharing**: Share travel routes with trusted contacts
5. **Offline Mode**: Cache nearby users for offline access
6. **Push Notifications**: Alert users when help requests received
7. **Video Calling**: Emergency video support

## Testing

### Test Scenarios
1. **Distance Accuracy**: Test with known distances
2. **Automatic SMS**: Verify Android automatic sending
3. **iOS Fallback**: Test SMS composer on iOS
4. **Multiple Users**: Test with 10+ nearby users
5. **SOS Broadcast**: Verify all users receive SMS
6. **GPS Accuracy**: Test in different environments
7. **Real-Time Updates**: Verify instant location updates

## Troubleshooting

### Common Issues
1. **"No nearby users"**: Increase search radius or check internet connection
2. **SMS not sending**: Verify SEND_SMS permission granted
3. **Location not updating**: Check location permission and GPS enabled
4. **Inaccurate distance**: Check GPS accuracy (shown in app)
5. **SmsModule undefined**: Rebuild app to load native module

### Permissions Required
- `ACCESS_FINE_LOCATION`: For accurate GPS location
- `SEND_SMS`: For automatic SMS sending (Android)
- `READ_PHONE_STATE`: For SMS module (Android)

## Performance

### Optimizations
- Real-time Firestore listeners for instant updates
- Distance calculated client-side to reduce server load
- SMS sent sequentially with delays to avoid spam detection
- Location updates throttled to 10-second intervals
- Query limited to active users only (safe/alert/emergency status)

## Conclusion
The enhanced Nyra Community feature provides a robust safety network with automatic SMS alerts, accurate distance tracking, and real-time location sharing. Users can quickly request help from nearby Nyra users with automatic SMS delivery and precise location information.
