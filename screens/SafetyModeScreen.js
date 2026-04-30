import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, Modal, Dimensions } from 'react-native';
import { Text, Button, SegmentedButtons, useTheme, Card, FAB, Portal, Dialog, TextInput, Switch, Chip, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { walkService } from '../services/walkService';
import { geofenceService } from '../services/geofenceService';
import { useContacts } from '../hooks/useContacts';

const { width, height } = Dimensions.get('window');

export default function SafetyModeScreen() {
    const theme = useTheme();
    const { contacts } = useContacts();
    const webViewRef = useRef(null);

    // Walk with Me State
    const [duration, setDuration] = useState('15');
    const [checkInInterval, setCheckInInterval] = useState('5');
    const [isWalking, setIsWalking] = useState(false);
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [checkInCountdown, setCheckInCountdown] = useState(30);

    // Danger Zone State
    const [currentLocation, setCurrentLocation] = useState(null);
    const [dangerZones, setDangerZones] = useState([]);
    const [showZoneDialog, setShowZoneDialog] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedRadius, setSelectedRadius] = useState(100);
    const [newZone, setNewZone] = useState({
        name: '',
        description: '',
        radius: '100',
    });
    const [monitoringDangerZones, setMonitoringDangerZones] = useState(false);
    const [currentDangerZones, setCurrentDangerZones] = useState([]);
    const [previewRadius, setPreviewRadius] = useState(100);

    // Combined Safety Mode State
    const [safetyModeActive, setSafetyModeActive] = useState(false);
    const [showZonesList, setShowZonesList] = useState(false);

    // Timer for walk countdown
    useEffect(() => {
        let timer;
        if (isWalking && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWalking, timeRemaining]);

    // Timer for check-in countdown
    useEffect(() => {
        let timer;
        if (showCheckIn && checkInCountdown > 0) {
            timer = setInterval(() => {
                setCheckInCountdown(prev => {
                    if (prev <= 1) {
                        handleMissedCheckIn();
                        return 30;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (!showCheckIn) {
            setCheckInCountdown(30);
        }
        return () => clearInterval(timer);
    }, [showCheckIn, checkInCountdown]);

    // Initialize
    useEffect(() => {
        initializeServices();
    }, []);

    const initializeServices = async () => {
        await loadCurrentLocation();
        await loadDangerZones();
        
        // Subscribe to geofence alerts
        geofenceService.onDangerZoneEntered = handleDangerZoneEntered;
    };

    const loadCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setCurrentLocation(coords);

            // Send to map
            if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({
                    type: 'setCenter',
                    data: coords,
                }));
            }
        } catch (error) {
            console.error('Error getting location:', error);
            setCurrentLocation({ latitude: 28.6139, longitude: 77.2090 });
        }
    };

    const loadDangerZones = async () => {
        const zones = await geofenceService.loadDangerZones();
        setDangerZones(zones);

        // Send zones to map
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'setZones',
                data: zones,
            }));
        }
    };

    // ============== WALK WITH ME HANDLERS ==============
    const handleStartWalk = async () => {
        if (!contacts || contacts.length === 0) {
            Alert.alert(
                'No Emergency Contacts',
                'Please add emergency contacts before starting.',
                [{ text: 'OK' }]
            );
            return;
        }

        const durationMins = parseInt(duration);
        const checkInMins = parseInt(checkInInterval);

        const started = await walkService.startWalk(
            durationMins,
            checkInMins,
            contacts,
            () => {
                setShowCheckIn(true);
                setCheckInCountdown(30);
            }
        );

        if (started) {
            setIsWalking(true);
            setTimeRemaining(durationMins * 60);
            Alert.alert(
                '🚶 Walk Started',
                `You'll be asked to check in every ${checkInMins} minutes. Stay safe!`,
                [{ text: 'OK' }]
            );
        }
    };

    const handleEndWalk = () => {
        Alert.alert(
            'End Walk?',
            'Are you sure you want to end this walk session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Walk',
                    onPress: () => {
                        walkService.endWalk(true);
                        setIsWalking(false);
                        setTimeRemaining(0);
                        setShowCheckIn(false);
                    },
                },
            ]
        );
    };

    const handleCheckIn = (isSafe) => {
        setShowCheckIn(false);
        if (isSafe) {
            walkService.confirmSafe();
            Alert.alert('✅ Check-in Recorded', 'Stay safe!', [{ text: 'OK' }]);
        } else {
            walkService.triggerEmergency();
            setIsWalking(false);
            setTimeRemaining(0);
        }
    };

    const handleMissedCheckIn = () => {
        setShowCheckIn(false);
        // walkService handles missed check-ins internally
    };

    // ============== DANGER ZONE HANDLERS ==============
    const handleToggleDangerZoneMonitoring = async () => {
        if (!monitoringDangerZones) {
            // Start monitoring
            if (!contacts || contacts.length === 0) {
                Alert.alert(
                    'No Emergency Contacts',
                    'Please add emergency contacts for danger zone alerts.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const started = await geofenceService.startMonitoring(contacts, (zones) => {
                setCurrentDangerZones(zones);
            });

            if (started) {
                setMonitoringDangerZones(true);
                Alert.alert('✅ Monitoring Active', 'You will be alerted when entering danger zones');
            }
        } else {
            // Stop monitoring
            geofenceService.stopMonitoring();
            setMonitoringDangerZones(false);
            setCurrentDangerZones([]);
            Alert.alert('🛑 Monitoring Stopped', 'Danger zone monitoring is now off');
        }
    };

    const handleDangerZoneEntered = (zones) => {
        setCurrentDangerZones(zones);
        
        if (zones.length > 0) {
            const zoneNames = zones.map(z => z.name).join(', ');
            Alert.alert(
                '⚠️ Danger Zone Alert!',
                `You are entering: ${zoneNames}`,
                [
                    { text: 'I\'m Aware', style: 'cancel' },
                    { 
                        text: 'Send Emergency Alert', 
                        style: 'destructive',
                        onPress: () => geofenceService.triggerEmergencyForZone(zones[0])
                    },
                ]
            );
        }
    };

    const handleMapMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'locationUpdate') {
                // Real-time location tracking on map
                if (monitoringDangerZones || isWalking) {
                    const zones = geofenceService.checkLocation(
                        message.data.latitude,
                        message.data.longitude
                    );
                    if (zones.length > 0) {
                        setCurrentDangerZones(zones);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing map message:', error);
        }
    };

    const handleAddZoneAtCurrentLocation = () => {
        if (!currentLocation) {
            Alert.alert('No Location', 'Please wait for your location to be detected.');
            return;
        }

        setSelectedLocation(currentLocation);
        setPreviewRadius(100);
        setNewZone({ name: '', description: '', radius: '100' });
        setShowZoneDialog(true);
        
        // Show preview on map
        updatePreviewCircle(currentLocation, 100);
    };

    const updatePreviewCircle = (location, radius) => {
        if (webViewRef.current && location) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'showPreview',
                data: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    radius: radius,
                },
            }));
        }
    };

    const hidePreviewCircle = () => {
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'hidePreview',
            }));
        }
    };

    const handleRadiusChange = (value) => {
        setPreviewRadius(value);
        setNewZone({ ...newZone, radius: value.toString() });
        
        if (selectedLocation) {
            updatePreviewCircle(selectedLocation, value);
        }
    };

    const handleAddZone = async () => {
        if (!newZone.name.trim()) {
            Alert.alert('Error', 'Please enter a zone name');
            return;
        }

        if (!selectedLocation) {
            Alert.alert('Error', 'No location selected');
            return;
        }

        const zone = {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            radius: parseInt(newZone.radius) || 100,
            name: newZone.name,
            description: newZone.description,
        };

        await geofenceService.addDangerZone(zone);
        await loadDangerZones();

        hidePreviewCircle();
        setShowZoneDialog(false);
        setNewZone({ name: '', description: '', radius: '100' });
        setSelectedLocation(null);
        setPreviewRadius(100);

        Alert.alert('✅ Success', `Danger zone "${zone.name}" added`);
    };

    const handleDeleteZone = (zoneId, zoneName) => {
        Alert.alert(
            'Delete Danger Zone',
            `Are you sure you want to delete "${zoneName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await geofenceService.removeDangerZone(zoneId);
                        await loadDangerZones();
                        Alert.alert('Deleted', `"${zoneName}" has been removed`);
                    },
                },
            ]
        );
    };

    // ============== COMBINED SAFETY MODE ==============
    const handleToggleSafetyMode = async () => {
        if (!safetyModeActive) {
            // Activate full safety mode
            if (!contacts || contacts.length === 0) {
                Alert.alert(
                    'No Emergency Contacts',
                    'Please add emergency contacts before activating safety mode.',
                    [{ text: 'OK' }]
                );
                return;
            }

            Alert.alert(
                '🛡️ Activate Safety Mode',
                'This will:\n• Start walk monitoring with check-ins\n• Enable danger zone alerts\n• Track your location in real-time',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Activate',
                        onPress: async () => {
                            // Start walk
                            await handleStartWalk();
                            
                            // Start danger zone monitoring
                            await geofenceService.startMonitoring(contacts, (zones) => {
                                setCurrentDangerZones(zones);
                            });
                            setMonitoringDangerZones(true);
                            
                            setSafetyModeActive(true);
                            
                            Alert.alert(
                                '✅ Safety Mode Active',
                                'Full protection enabled. Stay safe!',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                ]
            );
        } else {
            // Deactivate
            Alert.alert(
                'Deactivate Safety Mode?',
                'This will stop all monitoring.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Deactivate',
                        onPress: () => {
                            if (isWalking) {
                                walkService.endWalk(true);
                                setIsWalking(false);
                                setTimeRemaining(0);
                                setShowCheckIn(false);
                            }
                            
                            if (monitoringDangerZones) {
                                geofenceService.stopMonitoring();
                                setMonitoringDangerZones(false);
                                setCurrentDangerZones([]);
                            }
                            
                            setSafetyModeActive(false);
                            
                            Alert.alert('🛑 Safety Mode Deactivated', 'All monitoring stopped');
                        }
                    }
                ]
            );
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // HTML for OpenStreetMap with Leaflet
    const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${currentLocation?.latitude || 28.6139}, ${currentLocation?.longitude || 77.2090}], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var currentMarker = null;
    var zones = [];
    var zoneCircles = [];
    var previewCircle = null;

    // Add current location marker
    currentMarker = L.marker([${currentLocation?.latitude || 28.6139}, ${currentLocation?.longitude || 77.2090}])
      .addTo(map)
      .bindPopup('📍 Your current location')
      .openPopup();

    // Receive messages from React Native
    window.addEventListener('message', function(event) {
      var data = JSON.parse(event.data);
      
      if (data.type === 'setCenter') {
        map.setView([data.data.latitude, data.data.longitude], 13);
        if (currentMarker) {
          currentMarker.setLatLng([data.data.latitude, data.data.longitude]);
        }
      }
      
      if (data.type === 'showPreview') {
        // Remove old preview
        if (previewCircle) {
          map.removeLayer(previewCircle);
        }
        
        // Create preview circle
        previewCircle = L.circle([data.data.latitude, data.data.longitude], {
          color: '#FFA726',
          fillColor: '#FFB74D',
          fillOpacity: 0.3,
          radius: data.data.radius,
          weight: 3,
          dashArray: '10, 5'
        }).addTo(map);
        
        previewCircle.bindPopup('Preview: ' + data.data.radius + 'm radius');
        
        // Center on preview
        map.setView([data.data.latitude, data.data.longitude], 14);
      }
      
      if (data.type === 'hidePreview') {
        if (previewCircle) {
          map.removeLayer(previewCircle);
          previewCircle = null;
        }
      }
      
      if (data.type === 'setZones') {
        // Clear existing zones
        zoneCircles.forEach(circle => map.removeLayer(circle));
        zoneCircles = [];
        
        // Add new zones
        data.data.forEach(zone => {
          var circle = L.circle([zone.latitude, zone.longitude], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: zone.radius,
            weight: 2
          }).addTo(map);
          
          circle.bindPopup('<b>' + zone.name + '</b><br>' + (zone.description || 'No description') + '<br>Radius: ' + zone.radius + 'm');
          zoneCircles.push(circle);
        });
      }

      if (data.type === 'updateLocation') {
        if (currentMarker) {
          currentMarker.setLatLng([data.data.latitude, data.data.longitude]);
        }
        
        // Send location update back to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationUpdate',
          data: data.data
        }));
      }
    });
  </script>
</body>
</html>
    `;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <MaterialCommunityIcons
                            name="shield-check"
                            size={60}
                            color={safetyModeActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text variant="headlineMedium" style={styles.title}>
                            Safety Mode
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Walk monitoring + Danger zone alerts
                        </Text>
                    </View>

                    {/* Master Safety Mode Toggle */}
                    <Card style={[styles.card, safetyModeActive && { borderColor: theme.colors.primary, borderWidth: 2 }]}>
                        <Card.Content>
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                                        {safetyModeActive ? '🛡️ Protected' : '⚪ Inactive'}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        {safetyModeActive ? 'Full protection active' : 'Tap to activate'}
                                    </Text>
                                </View>
                                <Switch
                                    value={safetyModeActive}
                                    onValueChange={handleToggleSafetyMode}
                                    color={theme.colors.primary}
                                />
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Status Badges */}
                    {safetyModeActive && (
                        <View style={styles.statusRow}>
                            {isWalking && (
                                <Chip icon="clock" mode="flat" style={{ backgroundColor: theme.colors.primaryContainer }}>
                                    {formatTime(timeRemaining)} left
                                </Chip>
                            )}
                            {currentDangerZones.length > 0 && (
                                <Chip icon="alert" mode="flat" style={{ backgroundColor: theme.colors.errorContainer }}>
                                    {currentDangerZones.length} danger zone(s)
                                </Chip>
                            )}
                        </View>
                    )}

                    {/* Walk Configuration */}
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="walk" size={24} color={theme.colors.primary} />
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Walk Monitoring
                                </Text>
                                {isWalking && <Badge style={{ backgroundColor: theme.colors.primary }}>Active</Badge>}
                            </View>

                            {!isWalking ? (
                                <>
                                    <Text variant="titleSmall" style={styles.label}>
                                        Walk Duration
                                    </Text>
                                    <SegmentedButtons
                                        value={duration}
                                        onValueChange={setDuration}
                                        buttons={[
                                            { value: '5', label: '5m' },
                                            { value: '10', label: '10m' },
                                            { value: '15', label: '15m' },
                                            { value: '30', label: '30m' },
                                        ]}
                                        style={styles.segmented}
                                    />

                                    <Text variant="titleSmall" style={[styles.label, styles.labelSpacing]}>
                                        Check-in Every
                                    </Text>
                                    <SegmentedButtons
                                        value={checkInInterval}
                                        onValueChange={setCheckInInterval}
                                        buttons={[
                                            { value: '2', label: '2m' },
                                            { value: '5', label: '5m' },
                                            { value: '10', label: '10m' },
                                        ]}
                                        style={styles.segmented}
                                    />

                                    {!safetyModeActive && (
                                        <Button
                                            mode="contained"
                                            icon="walk"
                                            onPress={handleStartWalk}
                                            style={styles.actionButton}
                                        >
                                            Start Walk Only
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <View style={styles.walkingStatus}>
                                    <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
                                        {formatTime(timeRemaining)}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                                        Time remaining
                                    </Text>
                                    
                                    {!safetyModeActive && (
                                        <Button
                                            mode="outlined"
                                            icon="stop"
                                            onPress={handleEndWalk}
                                            style={styles.actionButton}
                                        >
                                            End Walk
                                        </Button>
                                    )}
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Danger Zones */}
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="map-marker-alert" size={24} color={theme.colors.error} />
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Danger Zones
                                </Text>
                                {monitoringDangerZones && <Badge style={{ backgroundColor: theme.colors.error }}>Monitoring</Badge>}
                            </View>

                            <View style={styles.dangerStats}>
                                <Text variant="bodyLarge">{dangerZones.length} zones marked</Text>
                                {!safetyModeActive && (
                                    <Button
                                        mode={monitoringDangerZones ? "outlined" : "contained"}
                                        icon={monitoringDangerZones ? "stop" : "radar"}
                                        onPress={handleToggleDangerZoneMonitoring}
                                        compact
                                    >
                                        {monitoringDangerZones ? 'Stop' : 'Monitor'}
                                    </Button>
                                )}
                            </View>

                            <Button
                                mode="contained"
                                icon="map-marker-plus"
                                onPress={handleAddZoneAtCurrentLocation}
                                style={styles.actionButton}
                            >
                                Mark Current Location as Danger Zone
                            </Button>
                            
                            <Button
                                mode="text"
                                icon="format-list-bulleted"
                                onPress={() => setShowZonesList(true)}
                            >
                                View All Zones ({dangerZones.length})
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Map */}
                    <Card style={styles.mapCard}>
                        <Card.Content style={{ padding: 0 }}>
                            <WebView
                                ref={webViewRef}
                                source={{ html: mapHTML }}
                                style={styles.map}
                                onMessage={handleMapMessage}
                                javaScriptEnabled
                                domStorageEnabled
                            />
                        </Card.Content>
                    </Card>

                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
                        <Text variant="bodySmall" style={styles.infoText}>
                            Click "Mark Current Location" to add a danger zone at your position. Adjust the radius with the slider in the dialog.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Check-in Dialog */}
            <Portal>
                <Modal
                    visible={showCheckIn}
                    transparent
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <Card style={styles.checkInCard}>
                            <Card.Content>
                                <MaterialCommunityIcons
                                    name="account-question"
                                    size={80}
                                    color={theme.colors.primary}
                                    style={{ alignSelf: 'center', marginBottom: 16 }}
                                />
                                <Text variant="headlineMedium" style={styles.checkInTitle}>
                                    Are You Safe?
                                </Text>
                                <Text variant="bodyLarge" style={styles.checkInSubtitle}>
                                    Respond in {checkInCountdown} seconds
                                </Text>
                                <Text variant="bodyMedium" style={styles.checkInMessage}>
                                    Missing 2 check-ins will alert emergency contacts
                                </Text>

                                <View style={styles.checkInButtons}>
                                    <Button
                                        mode="contained"
                                        icon="check"
                                        onPress={() => handleCheckIn(true)}
                                        style={[styles.checkInButton, { backgroundColor: theme.colors.primary }]}
                                        labelStyle={{ fontSize: 18 }}
                                    >
                                        I'm Safe
                                    </Button>
                                    <Button
                                        mode="contained"
                                        icon="alert"
                                        onPress={() => handleCheckIn(false)}
                                        style={[styles.checkInButton, { backgroundColor: theme.colors.error }]}
                                        labelStyle={{ fontSize: 18 }}
                                    >
                                        Send Alert!
                                    </Button>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>
                </Modal>

                {/* Add Zone Dialog */}
                <Dialog visible={showZoneDialog} onDismiss={() => {
                    setShowZoneDialog(false);
                    setNewZone({ name: '', description: '', radius: '100' });
                    setPreviewRadius(100);
                    hidePreviewCircle();
                }}>
                    <Dialog.Title>Add Danger Zone</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Zone Name *"
                            value={newZone.name}
                            onChangeText={(text) => setNewZone({ ...newZone, name: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Description (optional)"
                            value={newZone.description}
                            onChangeText={(text) => setNewZone({ ...newZone, description: text })}
                            style={styles.input}
                            mode="outlined"
                            multiline
                            numberOfLines={2}
                        />
                        
                        <View style={{ marginTop: 16, marginBottom: 8 }}>
                            <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                                Radius: {previewRadius}m
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text variant="bodySmall">50m</Text>
                                <View style={{ flex: 1 }}>
                                    <Slider
                                        style={{ width: '100%', height: 40 }}
                                        minimumValue={50}
                                        maximumValue={1000}
                                        step={50}
                                        value={previewRadius}
                                        onValueChange={handleRadiusChange}
                                        minimumTrackTintColor={theme.colors.primary}
                                        maximumTrackTintColor="#DEDEDE"
                                        thumbTintColor={theme.colors.primary}
                                    />
                                </View>
                                <Text variant="bodySmall">1km</Text>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                                Drag the slider to adjust the danger zone radius (see preview on map)
                            </Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setShowZoneDialog(false);
                            setNewZone({ name: '', description: '', radius: '100' });
                            setPreviewRadius(100);
                            hidePreviewCircle();
                        }}>Cancel</Button>
                        <Button onPress={handleAddZone}>Add Zone</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Zones List Dialog */}
                <Dialog visible={showZonesList} onDismiss={() => setShowZonesList(false)}>
                    <Dialog.Title>Danger Zones ({dangerZones.length})</Dialog.Title>
                    <Dialog.ScrollArea style={{ maxHeight: 400 }}>
                        <ScrollView>
                            {dangerZones.map((zone) => (
                                <Card key={zone.id} style={{ marginBottom: 8 }}>
                                    <Card.Content>
                                        <View style={styles.zoneItem}>
                                            <View style={{ flex: 1 }}>
                                                <Text variant="titleMedium">{zone.name}</Text>
                                                <Text variant="bodySmall">{zone.description}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                    Radius: {zone.radius}m
                                                </Text>
                                            </View>
                                            <Button
                                                icon="delete"
                                                mode="text"
                                                textColor={theme.colors.error}
                                                onPress={() => {
                                                    setShowZonesList(false);
                                                    handleDeleteZone(zone.id, zone.name);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                            {dangerZones.length === 0 && (
                                <Text variant="bodyMedium" style={{ textAlign: 'center', padding: 16 }}>
                                    No danger zones added yet. Long-press on the map to add one.
                                </Text>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowZonesList(false)}>Close</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        marginTop: 8,
    },
    subtitle: {
        opacity: 0.7,
        marginTop: 4,
    },
    card: {
        marginBottom: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        flex: 1,
        fontWeight: 'bold',
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
    },
    labelSpacing: {
        marginTop: 16,
    },
    segmented: {
        marginBottom: 8,
    },
    actionButton: {
        marginTop: 16,
    },
    walkingStatus: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    dangerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    mapCard: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: 300,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        color: '#1976D2',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    checkInCard: {
        maxWidth: 400,
        alignSelf: 'center',
        width: '100%',
    },
    checkInTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    checkInSubtitle: {
        textAlign: 'center',
        marginBottom: 4,
    },
    checkInMessage: {
        textAlign: 'center',
        opacity: 0.7,
        marginBottom: 24,
    },
    checkInButtons: {
        gap: 12,
    },
    checkInButton: {
        paddingVertical: 8,
    },
    input: {
        marginBottom: 12,
    },
    zoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
