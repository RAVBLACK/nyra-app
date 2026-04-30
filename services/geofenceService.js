import AsyncStorage from '@react-native-async-storage/async-storage';
import * as turf from '@turf/turf';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { alertService } from './alertService';
import { locationService } from './locationService';

/**
 * Geofence Service
 * Manages danger zones and checks if user enters them with real-time monitoring
 */

const DANGER_ZONES_KEY = '@nyra_danger_zones';

class GeofenceService {
    constructor() {
        this.dangerZones = [];
        this.lastAlertTime = {};
        this.alertCooldown = 5 * 60 * 1000; // 5 minutes
        this.isMonitoring = false;
        this.locationSubscription = null;
        this.emergencyContacts = [];
        this.onDangerZoneEntered = null;
        this.currentZones = [];
        this.monitoringCallback = null;
    }

    /**
     * Load danger zones from storage
     */
    async loadDangerZones() {
        try {
            const data = await AsyncStorage.getItem(DANGER_ZONES_KEY);
            this.dangerZones = data ? JSON.parse(data) : [];
            console.log(`✅ Loaded ${this.dangerZones.length} danger zones`);
            return this.dangerZones;
        } catch (error) {
            console.error('Error loading danger zones:', error);
            return [];
        }
    }

    /**
     * Save danger zones to storage
     */
    async saveDangerZones() {
        try {
            await AsyncStorage.setItem(DANGER_ZONES_KEY, JSON.stringify(this.dangerZones));
            console.log(`✅ Saved ${this.dangerZones.length} danger zones`);
            return true;
        } catch (error) {
            console.error('Error saving danger zones:', error);
            return false;
        }
    }

    /**
     * Add a new danger zone
     * @param {Object} zone - Zone data
     * @param {number} zone.latitude - Center latitude
     * @param {number} zone.longitude - Center longitude
     * @param {number} zone.radius - Radius in meters
     * @param {string} zone.name - Zone name
     * @param {string} zone.description - Zone description
     */
    async addDangerZone(zone) {
        const newZone = {
            id: Date.now().toString(),
            ...zone,
            createdAt: new Date().toISOString(),
        };

        this.dangerZones.push(newZone);
        await this.saveDangerZones();
        console.log(`✅ Added danger zone: ${newZone.name}`);
        return newZone;
    }

    /**
     * Remove a danger zone
     */
    async removeDangerZone(zoneId) {
        this.dangerZones = this.dangerZones.filter(z => z.id !== zoneId);
        await this.saveDangerZones();
        console.log(`✅ Removed danger zone: ${zoneId}`);
        return true;
    }

    /**
     * Check if current location is inside any danger zone
     * @param {number} latitude - Current latitude
     * @param {number} longitude - Current longitude
     * @returns {Array} Array of zones user is inside
     */
    checkLocation(latitude, longitude) {
        if (!latitude || !longitude) {
            console.log('⚠️ Invalid coordinates for checkLocation');
            return [];
        }
        
        if (this.dangerZones.length === 0) {
            return [];
        }
        
        const currentPoint = turf.point([longitude, latitude]);
        const zonesInside = [];

        for (const zone of this.dangerZones) {
            if (!zone.latitude || !zone.longitude || !zone.radius) {
                console.warn('⚠️ Invalid zone data:', zone);
                continue;
            }
            
            const zoneCenter = turf.point([zone.longitude, zone.latitude]);
            const distance = turf.distance(currentPoint, zoneCenter, { units: 'meters' });

            console.log(`📏 Distance to ${zone.name}: ${Math.round(distance)}m (radius: ${zone.radius}m)`);

            if (distance <= zone.radius) {
                zonesInside.push({
                    ...zone,
                    distance: Math.round(distance),
                });
                console.log(`⚠️ INSIDE zone: ${zone.name}`);
            }
        }

        return zonesInside;
    }

    /**
     * Alert user if they entered a danger zone
     * @param {number} latitude
     * @param {number} longitude
     */
    async checkAndAlert(latitude, longitude) {
        const zonesInside = this.checkLocation(latitude, longitude);

        for (const zone of zonesInside) {
            const lastAlert = this.lastAlertTime[zone.id] || 0;
            const now = Date.now();

            // Only alert if cooldown period has passed
            if (now - lastAlert > this.alertCooldown) {
                console.log(`⚠️ DANGER ZONE ALERT: ${zone.name}`);

                Alert.alert(
                    '⚠️ Danger Zone Alert',
                    `You are entering: ${zone.name}\n\n${zone.description}\n\nDistance: ${zone.distance}m from center`,
                    [
                        { text: 'I\'m Aware', style: 'cancel' },
                        { text: 'Send Alert', onPress: () => this.triggerEmergencyAlert(zone) },
                    ]
                );

                this.lastAlertTime[zone.id] = now;
            }
        }

        return zonesInside;
    }

    /**
     * Trigger emergency alert for danger zone
     */
    async triggerEmergencyAlert(zone) {
        console.log(`🚨 Emergency alert triggered for zone: ${zone.name}`);
        
        try {
            const location = locationService.getLastKnownLocation();
            
            if (this.emergencyContacts && this.emergencyContacts.length > 0) {
                // Use centralized alert service (calls + SMS)
                await alertService.triggerAlertProcedure();
                
                Alert.alert(
                    '✅ Emergency Alert Sent',
                    `Danger zone "${zone.name}" - Emergency contacts notified via calls and SMS.`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    '⚠️ No Contacts',
                    'No emergency contacts configured. Please add contacts in settings.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error sending danger zone alert:', error);
            Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
        }
    }

    /**
     * Start real-time geofence monitoring
     * @param {Array} contacts - Emergency contacts
     * @param {Function} onZoneDetected - Callback when zones are detected
     */
    async startMonitoring(contacts, onZoneDetected) {
        console.log('🔍 Starting geofence monitoring...');
        
        if (this.isMonitoring) {
            console.log('⚠️ Geofence monitoring already active');
            return true; // Already running, return true
        }

        try {
            // Request location permissions
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                console.log('❌ Foreground location permission denied');
                Alert.alert('Permission Denied', 'Location access is required for danger zone monitoring.');
                return false;
            }

            console.log('✅ Foreground location permission granted');

            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                console.log('⚠️ Background location permission not granted');
                Alert.alert(
                    'Background Location',
                    'Background location is recommended for continuous danger zone monitoring.'
                );
            } else {
                console.log('✅ Background location permission granted');
            }

            // Load danger zones
            await this.loadDangerZones();
            console.log(`📍 Loaded ${this.dangerZones.length} danger zones for monitoring`);

            if (this.dangerZones.length === 0) {
                console.log('⚠️ No danger zones to monitor');
                Alert.alert(
                    'No Danger Zones',
                    'You haven\'t added any danger zones yet. Long-press on the map to add zones.',
                    [{ text: 'OK' }]
                );
                return false;
            }

            this.emergencyContacts = contacts;
            this.monitoringCallback = onZoneDetected;
            this.isMonitoring = true;
            
            console.log(`📱 Emergency contacts: ${contacts?.length || 0}`);
            console.log('🎯 Starting location tracking...');

            // Start location tracking
            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Check every 5 seconds
                    distanceInterval: 10, // Or every 10 meters
                },
                (location) => {
                    this.handleLocationUpdate(location);
                }
            );

            console.log('✅ Geofence monitoring started successfully');
            return true;

        } catch (error) {
            console.error('❌ Error starting geofence monitoring:', error);
            Alert.alert('Error', `Failed to start danger zone monitoring: ${error.message}`);
            this.isMonitoring = false;
            return false;
        }
    }

    /**
     * Stop real-time monitoring
     */
    stopMonitoring() {
        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
        }

        this.isMonitoring = false;
        this.currentZones = [];
        this.emergencyContacts = [];
        this.monitoringCallback = null;

        console.log('🛑 Geofence monitoring stopped');
    }

    /**
     * Handle location updates during monitoring
     * @param {Location.LocationObject} location
     */
    async handleLocationUpdate(location) {
        const { latitude, longitude } = location.coords;
        
        console.log(`📍 Location update: ${latitude}, ${longitude}`);
        
        const zonesInside = this.checkLocation(latitude, longitude);
        
        // Check if we entered new zones
        const newZones = zonesInside.filter(
            zone => !this.currentZones.find(cz => cz.id === zone.id)
        );

        if (newZones.length > 0) {
            console.log(`⚠️ Entered ${newZones.length} danger zone(s):`, newZones.map(z => z.name));
            
            this.currentZones = zonesInside;
            
            // Trigger callback
            if (this.monitoringCallback) {
                this.monitoringCallback(zonesInside);
            }
            
            // Also trigger the onDangerZoneEntered callback if set
            if (this.onDangerZoneEntered) {
                this.onDangerZoneEntered(zonesInside);
            }

            // Auto-alert for each new zone (with cooldown)
            for (const zone of newZones) {
                const lastAlert = this.lastAlertTime[zone.id] || 0;
                const now = Date.now();

                // Only alert if cooldown period has passed
                if (now - lastAlert > this.alertCooldown) {
                    console.log(`⚠️ DANGER ZONE ALERT: ${zone.name}`);

                    Alert.alert(
                        '⚠️ Danger Zone Alert',
                        `You are entering: ${zone.name}\n\n${zone.description || 'No description'}\n\nDistance: ${zone.distance}m from center`,
                        [
                            { text: 'I\'m Aware', style: 'cancel' },
                            { text: 'Send Alert', onPress: () => this.triggerEmergencyAlert(zone) },
                        ]
                    );

                    this.lastAlertTime[zone.id] = now;
                }
            }
        } else if (zonesInside.length === 0 && this.currentZones.length > 0) {
            // Exited all zones
            console.log('✅ Exited all danger zones');
            this.currentZones = [];
            
            if (this.monitoringCallback) {
                this.monitoringCallback([]);
            }
            
            if (this.onDangerZoneEntered) {
                this.onDangerZoneEntered([]);
            }
        } else if (zonesInside.length > 0) {
            // Still in zones, update distance
            this.currentZones = zonesInside;
            
            if (this.monitoringCallback) {
                this.monitoringCallback(zonesInside);
            }
        }
    }

    /**
     * Trigger emergency for a specific zone (called manually by user)
     * @param {Object} zone
     */
    async triggerEmergencyForZone(zone) {
        await this.triggerEmergencyAlert(zone);
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            zonesCount: this.dangerZones.length,
            currentZones: this.currentZones,
        };
    }

    /**
     * Get all danger zones
     */
    getDangerZones() {
        return this.dangerZones;
    }

    /**
     * Clear all danger zones
     */
    async clearAll() {
        this.dangerZones = [];
        await this.saveDangerZones();
        console.log('✅ Cleared all danger zones');
        return true;
    }
}

export const geofenceService = new GeofenceService();
export default geofenceService;