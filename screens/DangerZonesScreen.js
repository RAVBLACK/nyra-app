import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, FAB, Portal, Dialog, TextInput, List, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { geofenceService } from '../services/geofenceService';
import { useContacts } from '../hooks/useContacts';

const DEFAULT_LOCATION = { latitude: 28.6139, longitude: 77.2090 };

export default function DangerZonesScreen() {
    const theme = useTheme();
    const webViewRef = useRef(null);
    const { contacts } = useContacts();

    const [currentLocation, setCurrentLocation] = useState(null);
    const [dangerZones, setDangerZones] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [newZone, setNewZone] = useState({
        name: '',
        description: '',
        radius: '100',
    });

    const postToMap = useCallback((type, data = null) => {
        webViewRef.current?.postMessage(JSON.stringify({ type, data }));
    }, []);

    const syncMap = useCallback(() => {
        postToMap('setZones', dangerZones);
        postToMap('setAddMode', {
            enabled: isAddMode,
            radius: parseInt(newZone.radius, 10) || 100,
            selectedLocation,
        });

        if (currentLocation) {
            postToMap('setCenter', currentLocation);
        }
    }, [currentLocation, dangerZones, isAddMode, newZone.radius, postToMap, selectedLocation]);

    useEffect(() => {
        loadCurrentLocation();
        loadDangerZones();
        
        // Automatically start monitoring if it isn't already active
        const initGeofence = async () => {
            if (contacts && contacts.length > 0) {
                await geofenceService.startMonitoring(contacts, (zonesInside) => {
                    if (zonesInside.length > 0) {
                        console.log('You are inside danger zone(s): ', zonesInside.map(z => z.name));
                    }
                });
            }
        };
        initGeofence();
    }, [contacts]);

    useEffect(() => {
        syncMap();
    }, [syncMap]);

    const loadCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to place danger zones accurately.');
                setCurrentLocation(DEFAULT_LOCATION);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setCurrentLocation(coords);
            postToMap('setCenter', coords);
        } catch (error) {
            console.error('Error getting location:', error);
            setCurrentLocation(DEFAULT_LOCATION);
        }
    };

    const loadDangerZones = async () => {
        const zones = await geofenceService.loadDangerZones();
        setDangerZones(zones);
        postToMap('setZones', zones);
    };

    const handleMapMessage = (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === 'locationSelected') {
                setSelectedLocation(message.data);
                setShowDialog(true);
            }

            if (message.type === 'centerSelected') {
                setSelectedLocation(message.data);
                setShowDialog(true);
            }
        } catch (error) {
            console.error('Error parsing map message:', error);
        }
    };

    const startAddMode = () => {
        const location = currentLocation || DEFAULT_LOCATION;
        setIsAddMode(true);
        setSelectedLocation(location);
        postToMap('setAddMode', {
            enabled: true,
            radius: parseInt(newZone.radius, 10) || 100,
            selectedLocation: location,
        });
    };

    const cancelAddMode = () => {
        setIsAddMode(false);
        setSelectedLocation(null);
        setShowDialog(false);
        postToMap('setAddMode', { enabled: false });
    };

    const useMapCenter = () => {
        if (!isAddMode) {
            startAddMode();
            return;
        }

        postToMap('selectCenter');
    };

    const handleAddZone = async () => {
        if (!newZone.name.trim()) {
            Alert.alert('Missing Name', 'Please enter a zone name.');
            return;
        }

        if (!selectedLocation) {
            Alert.alert('No Location Selected', 'Tap the map or use the center pin to choose the danger zone location.');
            return;
        }

        const zone = {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            radius: Math.max(parseInt(newZone.radius, 10) || 100, 25),
            name: newZone.name.trim(),
            description: newZone.description.trim(),
        };

        await geofenceService.addDangerZone(zone);
        await loadDangerZones();

        setShowDialog(false);
        setIsAddMode(false);
        setSelectedLocation(null);
        setNewZone({ name: '', description: '', radius: '100' });

        Alert.alert('Success', `Danger zone "${zone.name}" added.`);
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
                    },
                },
            ]
        );
    };

    const mapHTML = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    .center-pin {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      display: none;
      pointer-events: none;
      font-size: 34px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.35);
    }
    .center-pin.visible { display: block; }
    .hint {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 12px;
      z-index: 1000;
      display: none;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(20, 20, 20, 0.82);
      color: white;
      font: 14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      text-align: center;
    }
    .hint.visible { display: block; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="centerPin" class="center-pin">!</div>
  <div id="hint" class="hint">Tap the map to choose a location, or move the map and use the center pin.</div>
  <script>
    var initialLat = ${currentLocation?.latitude || DEFAULT_LOCATION.latitude};
    var initialLng = ${currentLocation?.longitude || DEFAULT_LOCATION.longitude};
    var map = L.map('map').setView([initialLat, initialLng], 13);
    var zones = [];
    var addMode = false;
    var selectedMarker = null;
    var selectedCircle = null;
    var selectedRadius = 100;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    function send(type, data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
    }

    function setAddModeState(payload) {
      addMode = !!(payload && payload.enabled);
      selectedRadius = payload && payload.radius ? payload.radius : 100;
      document.getElementById('centerPin').className = addMode ? 'center-pin visible' : 'center-pin';
      document.getElementById('hint').className = addMode ? 'hint visible' : 'hint';

      if (!addMode) {
        clearSelectedLocation();
        return;
      }

      if (payload && payload.selectedLocation) {
        showSelectedLocation(payload.selectedLocation.latitude, payload.selectedLocation.longitude);
      }
    }

    function clearSelectedLocation() {
      if (selectedMarker) map.removeLayer(selectedMarker);
      if (selectedCircle) map.removeLayer(selectedCircle);
      selectedMarker = null;
      selectedCircle = null;
    }

    function showSelectedLocation(lat, lng) {
      clearSelectedLocation();
      selectedMarker = L.marker([lat, lng]).addTo(map).bindPopup('New danger zone').openPopup();
      selectedCircle = L.circle([lat, lng], {
        radius: selectedRadius,
        color: '#ff9800',
        fillColor: '#ff9800',
        fillOpacity: 0.22
      }).addTo(map);
    }

    function setZones(nextZones) {
      zones.forEach(function(z) {
        map.removeLayer(z.marker);
        map.removeLayer(z.circle);
      });
      zones = [];

      (nextZones || []).forEach(function(zone) {
        var marker = L.marker([zone.latitude, zone.longitude]).addTo(map);
        var circle = L.circle([zone.latitude, zone.longitude], {
          radius: zone.radius,
          color: '#d32f2f',
          fillColor: '#f44336',
          fillOpacity: 0.2
        }).addTo(map);

        marker.bindPopup('<b>' + zone.name + '</b><br>' + (zone.description || 'No description') + '<br>' + zone.radius + 'm radius');
        zones.push({ marker: marker, circle: circle });
      });
    }

    map.on('click', function(e) {
      if (!addMode) return;
      showSelectedLocation(e.latlng.lat, e.latlng.lng);
      send('locationSelected', { latitude: e.latlng.lat, longitude: e.latlng.lng });
    });

    function handleMessage(raw) {
      var message = JSON.parse(raw);

      if (message.type === 'setCenter' && message.data) {
        map.setView([message.data.latitude, message.data.longitude], 15);
      }

      if (message.type === 'setZones') {
        setZones(message.data);
      }

      if (message.type === 'setAddMode') {
        setAddModeState(message.data);
      }

      if (message.type === 'selectCenter') {
        var center = map.getCenter();
        showSelectedLocation(center.lat, center.lng);
        send('centerSelected', { latitude: center.lat, longitude: center.lng });
      }
    }

    document.addEventListener('message', function(event) { handleMessage(event.data); });
    window.addEventListener('message', function(event) { handleMessage(event.data); });
  </script>
</body>
</html>
  `, [currentLocation]);

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: mapHTML }}
                style={styles.map}
                onMessage={handleMapMessage}
                onLoadEnd={syncMap}
                javaScriptEnabled
                domStorageEnabled
            />

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                <Text variant="titleMedium">Danger Zones ({dangerZones.length})</Text>
                <Text variant="bodySmall" style={styles.infoText}>
                    {isAddMode ? 'Tap the map, or move it and use the center pin.' : 'Add places you want Nyra to warn you about.'}
                </Text>
                <View style={styles.actionsRow}>
                    <Button mode={isAddMode ? 'outlined' : 'contained'} icon="map-marker-plus" onPress={startAddMode}>
                        Add Zone
                    </Button>
                    <Button mode="outlined" icon="crosshairs-gps" onPress={useMapCenter}>
                        Use Center
                    </Button>
                    {isAddMode && (
                        <Button mode="text" onPress={cancelAddMode}>
                            Cancel
                        </Button>
                    )}
                </View>
            </View>

            {dangerZones.length > 0 && (
                <View style={[styles.zoneList, { backgroundColor: theme.colors.surface }]}>
                    {dangerZones.slice(0, 3).map((zone) => (
                        <List.Item
                            key={zone.id}
                            title={zone.name}
                            description={`${zone.radius}m radius`}
                            left={props => <List.Icon {...props} icon="map-marker-alert" color={theme.colors.error} />}
                            right={() => (
                                <Button compact onPress={() => handleDeleteZone(zone.id, zone.name)}>
                                    Delete
                                </Button>
                            )}
                            style={styles.zoneItem}
                        />
                    ))}
                </View>
            )}

            <FAB
                icon="crosshairs-gps"
                style={styles.fab}
                onPress={loadCurrentLocation}
                small
            />

            <Portal>
                <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
                    <Dialog.Title>Add Danger Zone</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Zone name"
                            value={newZone.name}
                            onChangeText={(text) => setNewZone({ ...newZone, name: text })}
                            mode="outlined"
                            style={styles.input}
                            placeholder="Dark alley, unsafe crossing"
                        />
                        <TextInput
                            label="Description"
                            value={newZone.description}
                            onChangeText={(text) => setNewZone({ ...newZone, description: text })}
                            mode="outlined"
                            style={styles.input}
                            placeholder="Why should Nyra warn here?"
                            multiline
                            numberOfLines={2}
                        />
                        <TextInput
                            label="Radius in meters"
                            value={newZone.radius}
                            onChangeText={(text) => {
                                const radius = text.replace(/[^\d]/g, '');
                                setNewZone({ ...newZone, radius });
                                postToMap('setAddMode', {
                                    enabled: true,
                                    radius: parseInt(radius, 10) || 100,
                                    selectedLocation,
                                });
                            }}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="100"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowDialog(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleAddZone}>Add Zone</Button>
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
    map: {
        flex: 1,
    },
    infoCard: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        padding: 14,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 3,
    },
    infoText: {
        marginTop: 4,
        opacity: 0.7,
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    zoneList: {
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        borderRadius: 8,
        elevation: 4,
        maxHeight: 200,
        overflow: 'hidden',
    },
    zoneItem: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ddd',
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
    input: {
        marginBottom: 12,
    },
});
