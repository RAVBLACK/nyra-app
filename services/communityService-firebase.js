// Firebase Implementation for Real-Time Community Feature
// Install: npm install firebase @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth

import * as Location from 'expo-location';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

let locationSubscription = null;
let nearbyUsersSubscription = null;

/**
 * Initialize Firebase with your config
 */
const initializeFirebase = () => {
    // Already initialized in App.js with Firebase config
    console.log('Firebase initialized');
};

/**
 * Start sharing location to Firebase in real-time
 */
export const startLocationSharing = async () => {
    try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission not granted');
        }

        // Get current user
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        // Update location in Firestore
        await firestore()
            .collection('user_locations')
            .doc(user.uid)
            .set({
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                status: 'safe',
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            });

        // Start continuous location updates (every 30 seconds)
        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000, // 30 seconds
                distanceInterval: 50, // 50 meters
            },
            async (newLocation) => {
                await firestore()
                    .collection('user_locations')
                    .doc(user.uid)
                    .update({
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        lastUpdated: firestore.FieldValue.serverTimestamp(),
                    });
                console.log('Location updated:', newLocation.coords);
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error starting location sharing:', error);
        throw error;
    }
};

/**
 * Stop sharing location
 */
export const stopLocationSharing = async () => {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }

    // Update status to offline
    const user = auth().currentUser;
    if (user) {
        await firestore()
            .collection('user_locations')
            .doc(user.uid)
            .update({
                status: 'offline',
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            });
    }

    console.log('Location sharing stopped');
};

/**
 * Get nearby users in real-time using Firebase geohash queries
 * Returns a subscription that updates automatically
 */
export const subscribeToNearbyUsers = (maxDistance, onUsersUpdate) => {
    const user = auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Get current user's location first
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then((location) => {
            const { latitude, longitude } = location.coords;

            // Simple approach: Get all users and filter by distance
            // For production, use geohash libraries like 'geofire-common' for efficient queries
            nearbyUsersSubscription = firestore()
                .collection('user_locations')
                .where('status', 'in', ['safe', 'alert', 'emergency'])
                .onSnapshot((snapshot) => {
                    const nearbyUsers = [];

                    snapshot.forEach((doc) => {
                        const userData = doc.data();

                        // Skip current user
                        if (doc.id === user.uid) return;

                        // Calculate distance
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            userData.latitude,
                            userData.longitude
                        );

                        // Add user if within range
                        if (distance <= maxDistance) {
                            nearbyUsers.push({
                                id: doc.id,
                                name: userData.userName,
                                distance: Math.round(distance),
                                latitude: userData.latitude,
                                longitude: userData.longitude,
                                status: userData.status,
                                lastSeen: userData.lastUpdated?.toDate(),
                            });
                        }
                    });

                    // Sort by distance
                    nearbyUsers.sort((a, b) => a.distance - b.distance);

                    // Call the callback with updated users
                    onUsersUpdate(nearbyUsers);
                });

            return nearbyUsersSubscription;
        })
        .catch((error) => {
            console.error('Error subscribing to nearby users:', error);
            throw error;
        });
};

/**
 * Unsubscribe from nearby users updates
 */
export const unsubscribeFromNearbyUsers = () => {
    if (nearbyUsersSubscription) {
        nearbyUsersSubscription();
        nearbyUsersSubscription = null;
    }
};

/**
 * Send SOS alert to all nearby users
 */
export const sendSOSToNearby = async (message = 'Emergency! Need help!') => {
    try {
        const user = auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        // Create SOS alert in Firestore
        const sosRef = await firestore()
            .collection('sos_alerts')
            .add({
                senderId: user.uid,
                senderName: user.displayName || 'Anonymous',
                message: message,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: firestore.FieldValue.serverTimestamp(),
                status: 'active',
            });

        // Update user status to emergency
        await firestore()
            .collection('user_locations')
            .doc(user.uid)
            .update({
                status: 'emergency',
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            });

        // Get nearby users to send notifications
        const nearbySnapshot = await firestore()
            .collection('user_locations')
            .where('status', 'in', ['safe', 'alert'])
            .get();

        const notifications = [];
        nearbySnapshot.forEach((doc) => {
            if (doc.id !== user.uid) {
                const userData = doc.data();
                const distance = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    userData.latitude,
                    userData.longitude
                );

                // Send notification to users within 2km
                if (distance <= 2000) {
                    notifications.push(
                        firestore()
                            .collection('notifications')
                            .add({
                                userId: doc.id,
                                type: 'sos',
                                senderId: user.uid,
                                senderName: user.displayName,
                                message: message,
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                distance: Math.round(distance),
                                timestamp: firestore.FieldValue.serverTimestamp(),
                                read: false,
                            })
                    );
                }
            }
        });

        await Promise.all(notifications);

        console.log(`✅ SOS sent to ${notifications.length} nearby users`);
        return { success: true, alertId: sosRef.id, notifiedUsers: notifications.length };
    } catch (error) {
        console.error('Error sending SOS:', error);
        throw error;
    }
};

/**
 * Listen to SOS alerts for current user
 */
export const subscribeToSOSAlerts = (onAlertReceived) => {
    const user = auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    return firestore()
        .collection('notifications')
        .where('userId', '==', user.uid)
        .where('type', '==', 'sos')
        .where('read', '==', false)
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const alert = {
                        id: change.doc.id,
                        ...change.doc.data(),
                    };
                    onAlertReceived(alert);
                }
            });
        });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Send direct message to another user
 */
export const sendMessageToUser = async (recipientId, message) => {
    const user = auth().currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }

    await firestore()
        .collection('messages')
        .add({
            senderId: user.uid,
            senderName: user.displayName,
            recipientId: recipientId,
            message: message,
            timestamp: firestore.FieldValue.serverTimestamp(),
            read: false,
        });

    console.log('Message sent to user:', recipientId);
};

export default {
    startLocationSharing,
    stopLocationSharing,
    subscribeToNearbyUsers,
    unsubscribeFromNearbyUsers,
    sendSOSToNearby,
    subscribeToSOSAlerts,
    sendMessageToUser,
};
