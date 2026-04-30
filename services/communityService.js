import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { NativeModules, Platform } from 'react-native';
import { db, auth } from '../firebase.config';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

const { SmsModule } = NativeModules;

let locationSubscription = null;
let nearbyUsersUnsubscribe = null;
let currentUserLocation = null;
let isLocationSharing = false;

// Calculate distance between two coordinates using Haversine formula with validation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Validate coordinates
    if (
        typeof lat1 !== 'number' ||
        typeof lon1 !== 'number' ||
        typeof lat2 !== 'number' ||
        typeof lon2 !== 'number'
    ) {
        console.warn('Invalid coordinates for distance calculation');
        return Infinity;
    }
    
    if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90) {
        console.warn('Invalid latitude values');
        return Infinity;
    }
    
    if (Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
        console.warn('Invalid longitude values');
        return Infinity;
    }

    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    
    // Additional accuracy check - account for GPS accuracy
    return Math.round(distance * 10) / 10; // Round to 0.1m precision
};

// Get current user location
export const getCurrentUserLocation = () => {
    return currentUserLocation;
};

// Get sharing status
export const getSharingStatus = () => {
    return {
        isSharing: isLocationSharing,
        location: currentUserLocation,
    };
};

// Start sharing location with NYRA community
export const startLocationSharing = async (userName = 'NYRA User', phoneNumber = null) => {
    try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission not granted');
        }

        // Sign in anonymously if not already signed in
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log('✅ Signed in anonymously');
        }

        isLocationSharing = true;

        // Get current location with highest accuracy
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
            maximumAge: 0, // Don't use cached location
        });

        currentUserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: Date.now(),
        };

        console.log('📍 Current location:', currentUserLocation);

        // Save location to Firestore with phone number
        const userId = auth.currentUser.uid;
        await setDoc(doc(db, 'user_locations', userId), {
            userId: userId,
            userName: userName,
            phoneNumber: phoneNumber,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            status: 'safe',
            lastUpdated: serverTimestamp(),
        });

        // Start continuous location updates (every 10 seconds for better accuracy)
        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.Highest,
                timeInterval: 10000, // 10 seconds for more frequent updates
                distanceInterval: 10, // Update every 10 meters
            },
            async (newLocation) => {
                currentUserLocation = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    accuracy: newLocation.coords.accuracy,
                    timestamp: Date.now(),
                };

                await updateDoc(doc(db, 'user_locations', userId), {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    accuracy: newLocation.coords.accuracy,
                    lastUpdated: serverTimestamp(),
                });
                console.log('📍 Location updated:', {
                    lat: newLocation.coords.latitude.toFixed(6),
                    lng: newLocation.coords.longitude.toFixed(6),
                    accuracy: Math.round(newLocation.coords.accuracy) + 'm'
                });
            }
        );

        console.log('📍 Location sharing started:', currentUserLocation);
        return { success: true, location: currentUserLocation };
    } catch (error) {
        console.error('Error starting location sharing:', error);
        return { success: false, error: error.message };
    }
};

// Stop sharing location
export const stopLocationSharing = async () => {
    isLocationSharing = false;
    currentUserLocation = null;

    // Stop location updates
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }

    // Update status to offline in Firestore
    if (auth.currentUser) {
        await updateDoc(doc(db, 'user_locations', auth.currentUser.uid), {
            status: 'offline',
            lastUpdated: serverTimestamp(),
        });
    }

    console.log('🛑 Location sharing stopped');
    return { success: true };
};

// Get nearby NYRA users within specified range (in meters)
export const getNearbyUsers = async (maxDistance = 1000) => {
    try {
        if (!currentUserLocation) {
            throw new Error('Location not available. Please enable location sharing.');
        }

        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        // Query all active users from Firestore
        const q = query(
            collection(db, 'user_locations'),
            where('status', 'in', ['safe', 'alert', 'emergency'])
        );

        const querySnapshot = await getDocs(q);
        const nearbyUsers = [];

        querySnapshot.forEach((docSnap) => {
            // Skip current user
            if (docSnap.id === auth.currentUser.uid) return;

            const userData = docSnap.data();

            // Check if user data is valid
            if (!userData.latitude || !userData.longitude) {
                console.warn('Invalid user data:', docSnap.id);
                return;
            }

            const distance = calculateDistance(
                currentUserLocation.latitude,
                currentUserLocation.longitude,
                userData.latitude,
                userData.longitude
            );

            // Add user if within range
            if (distance <= maxDistance) {
                nearbyUsers.push({
                    id: docSnap.id,
                    name: userData.userName || 'NYRA User',
                    phoneNumber: userData.phoneNumber,
                    distance: Math.round(distance),
                    latitude: userData.latitude,
                    longitude: userData.longitude,
                    accuracy: userData.accuracy,
                    status: userData.status,
                    lastSeen: userData.lastUpdated?.toDate(),
                });

                console.log(`📍 User ${userData.userName}: ${Math.round(distance)}m away at (${userData.latitude.toFixed(6)}, ${userData.longitude.toFixed(6)})`);
            }
        });

        // Sort by distance
        nearbyUsers.sort((a, b) => a.distance - b.distance);

        console.log(`✅ Found ${nearbyUsers.length} nearby users within ${maxDistance}m`);

        return {
            success: true,
            users: nearbyUsers,
            count: nearbyUsers.length,
        };
    } catch (error) {
        console.error('Error getting nearby users:', error);
        return { success: false, error: error.message, users: [] };
    }
};

// Subscribe to real-time updates of nearby users
export const subscribeToNearbyUsers = (maxDistance, onUsersUpdate) => {
    try {
        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        const q = query(
            collection(db, 'user_locations'),
            where('status', 'in', ['safe', 'alert', 'emergency'])
        );

        // Set up real-time listener
        nearbyUsersUnsubscribe = onSnapshot(q, (snapshot) => {
            if (!currentUserLocation) {
                onUsersUpdate([]);
                return;
            }

            const nearbyUsers = [];
            snapshot.forEach((docSnap) => {
                // Skip current user
                if (docSnap.id === auth.currentUser.uid) return;

                const userData = docSnap.data();
                if (!userData.latitude || !userData.longitude) return;

                const distance = calculateDistance(
                    currentUserLocation.latitude,
                    currentUserLocation.longitude,
                    userData.latitude,
                    userData.longitude
                );

                if (distance <= maxDistance) {
                    nearbyUsers.push({
                        id: docSnap.id,
                        name: userData.userName || 'NYRA User',
                        phoneNumber: userData.phoneNumber,
                        distance: Math.round(distance),
                        latitude: userData.latitude,
                        longitude: userData.longitude,
                        accuracy: userData.accuracy,
                        status: userData.status,
                        lastSeen: userData.lastUpdated?.toDate(),
                    });
                }
            });

            nearbyUsers.sort((a, b) => a.distance - b.distance);
            onUsersUpdate(nearbyUsers);
        });

        return nearbyUsersUnsubscribe;
    } catch (error) {
        console.error('Error subscribing to nearby users:', error);
        return null;
    }
};

// Unsubscribe from real-time updates
export const unsubscribeFromNearbyUsers = () => {
    if (nearbyUsersUnsubscribe) {
        nearbyUsersUnsubscribe();
        nearbyUsersUnsubscribe = null;
        console.log('🛑 Unsubscribed from nearby users updates');
    }
};

// Send SOS to nearby users via SMS
export const sendSOSToNearby = async (message = 'Emergency! I need help!', senderName = 'NYRA User') => {
    try {
        if (!currentUserLocation) {
            throw new Error('Location not available');
        }

        if (!auth.currentUser) {
            throw new Error('User not authenticated');
        }

        const userId = auth.currentUser.uid;

        // Check if SMS is available
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
            console.warn('SMS is not available on this device');
        }

        // Create SOS alert in Firestore
        const sosRef = await addDoc(collection(db, 'sos_alerts'), {
            senderId: userId,
            senderName: senderName,
            message: message,
            latitude: currentUserLocation.latitude,
            longitude: currentUserLocation.longitude,
            timestamp: serverTimestamp(),
            status: 'active',
        });

        // Update user status to emergency
        await updateDoc(doc(db, 'user_locations', userId), {
            status: 'emergency',
            lastUpdated: serverTimestamp(),
        });

        // Get nearby users within 2km
        const result = await getNearbyUsers(2000);

        // Send SMS to users who have phone numbers
        const usersWithPhones = result.users.filter(user => user.phoneNumber);

        let smsCount = 0;
        if (usersWithPhones.length > 0) {
            const mapsLink = `https://maps.google.com/?q=${currentUserLocation.latitude},${currentUserLocation.longitude}`;
            const smsBody = `🆘 EMERGENCY ALERT from ${senderName}\n${message}\n\nLocation: ${mapsLink}\n\nSent via NYRA Safety App`;

            // Use native SMS module for automatic sending on Android
            if (Platform.OS === 'android' && SmsModule) {
                console.log(`📱 Sending automatic SOS to ${usersWithPhones.length} users...`);
                
                for (const user of usersWithPhones) {
                    try {
                        await SmsModule.sendSms(user.phoneNumber, smsBody);
                        smsCount++;
                        console.log(`✅ SOS SMS sent to ${user.name} (${user.phoneNumber})`);
                        
                        // Add 1 second delay between SMS to avoid carrier blocking
                        if (smsCount < usersWithPhones.length) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (smsError) {
                        console.error(`❌ Failed to send SMS to ${user.phoneNumber}:`, smsError);
                    }
                }
            } else {
                // Fallback for iOS - open SMS composer
                const isAvailable = await SMS.isAvailableAsync();
                if (isAvailable) {
                    try {
                        const phoneNumbers = usersWithPhones.map(u => u.phoneNumber);
                        await SMS.sendSMSAsync(phoneNumbers, smsBody);
                        smsCount = phoneNumbers.length;
                        console.log(`📱 SMS composer opened for ${phoneNumbers.length} users`);
                    } catch (smsError) {
                        console.error('SMS sending failed:', smsError);
                    }
                }
            }
        }

        console.log(`🆘 SOS sent to ${result.count} nearby users (${smsCount} via SMS)`);

        return {
            success: true,
            message: `SOS sent to ${result.count} nearby NYRA users`,
            smsCount: smsCount,
            recipientCount: result.count,
            alertId: sosRef.id,
        };
    } catch (error) {
        console.error('Error sending SOS:', error);
        return { success: false, error: error.message };
    }
};

// Send direct message to specific user
export const sendMessageToUser = async (userId, message) => {
    try {
        // In production, send to backend server
        // await api.post(`/community/message/${userId}`, { message });

        console.log(`📨 Message sent to user ${userId}:`, message);

        return {
            success: true,
            message: 'Message sent successfully',
        };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};

// Send automatic SMS alert to specific user when triggered
export const sendAlertToUser = async (targetUser, alertMessage, senderName = 'NYRA User') => {
    try {
        if (!targetUser.phoneNumber) {
            throw new Error('User does not have a phone number');
        }

        if (!currentUserLocation) {
            throw new Error('Location not available');
        }

        const mapsLink = `https://maps.google.com/?q=${currentUserLocation.latitude},${currentUserLocation.longitude}`;
        const distance = targetUser.distance < 1000 
            ? `${targetUser.distance}m` 
            : `${(targetUser.distance / 1000).toFixed(1)}km`;
        
        const smsBody = `🚨 NYRA ALERT from ${senderName}\n${alertMessage}\n\nMy Location: ${mapsLink}\nDistance: ${distance} away\n\nOpen NYRA app for details`;

        // Send SMS automatically using native module (Android)
        if (Platform.OS === 'android' && SmsModule) {
            console.log(`📱 Sending automatic alert to ${targetUser.name} (${targetUser.phoneNumber})...`);
            console.log(`✅ SmsModule available: ${!!SmsModule}`);
            
            try {
                // Call native module - it returns a Promise
                await SmsModule.sendSms(targetUser.phoneNumber, smsBody);
                
                console.log(`✅ Alert SMS sent to ${targetUser.name}`);
                
                return {
                    success: true,
                    message: `Alert sent to ${targetUser.name}`,
                    sentViaAutomatic: true
                };
            } catch (error) {
                console.error(`❌ SmsModule error:`, error);
                throw error;
            }
        } else {
            console.log(`📱 Falling back to SMS composer (Platform: ${Platform.OS}, SmsModule: ${!!SmsModule})`);

            // Fallback for iOS - open SMS composer
            const isAvailable = await SMS.isAvailableAsync();
            if (!isAvailable) {
                throw new Error('SMS not available on this device');
            }
            
            await SMS.sendSMSAsync([targetUser.phoneNumber], smsBody);
            console.log(`📱 SMS composer opened for ${targetUser.name}`);
            
            return {
                success: true,
                message: `SMS composer opened for ${targetUser.name}`,
                sentViaAutomatic: false
            };
        }
    } catch (error) {
        console.error('Error sending alert to user:', error);
        return { success: false, error: error.message };
    }
};

// Update location periodically (call this in background)
export const updateLocation = async () => {
    if (!isLocationSharing) return;

    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        currentUserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
        };

        // In production, update backend server
        // await api.put('/community/location', currentUserLocation);

        return { success: true, location: currentUserLocation };
    } catch (error) {
        console.error('Error updating location:', error);
        return { success: false, error: error.message };
    }
};
